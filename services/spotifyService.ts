import { Song, Playlist } from "../types";

// Try to retrieve from various environment variable conventions
// Note: In Vercel/React, variables usually need NEXT_PUBLIC_ or REACT_APP_ prefix to be exposed to the browser.
const ENV_CLIENT_ID = 
  process.env.SPOTIFY_CLIENT_ID || 
  process.env.REACT_APP_SPOTIFY_CLIENT_ID || 
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

let dynamicClientId = ENV_CLIENT_ID || "";

// Initialize from localStorage if available and not found in env
if (!dynamicClientId && typeof window !== 'undefined') {
    const stored = localStorage.getItem('spotify_client_id');
    if (stored) dynamicClientId = stored;
}

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
// Ensure no trailing slash for consistency
export const REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, "") : "";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "user-library-modify",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-top-read",
  "playlist-read-private",
  "playlist-read-collaborative"
];

export const setClientId = (id: string) => {
    dynamicClientId = id;
    if (typeof window !== 'undefined') {
        localStorage.setItem('spotify_client_id', id);
    }
};

export const getClientId = () => dynamicClientId;

export const getLoginUrl = () => {
  if (!dynamicClientId) {
    return "";
  }
  return `${AUTH_ENDPOINT}?client_id=${dynamicClientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(" "))}&response_type=token&show_dialog=true`;
};

export const getTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const params = new URLSearchParams(hash.substring(1)); // remove #
  return params.get("access_token");
};

const fetchSpotify = async (token: string, endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...options.headers,
        }
    });
    if (res.status === 401) {
        window.location.hash = "";
        return null;
    }
    return res;
}

export const searchSpotify = async (token: string, query: string): Promise<Song[]> => {
  if (!query) return [];
  
  try {
    const response = await fetchSpotify(token, `search?q=${encodeURIComponent(query)}&type=track&limit=20`);
    if (!response || !response.ok) return [];

    const data = await response.json();
    
    return data.tracks.items.map((track: any) => mapSpotifyTrackToSong(track));

  } catch (error) {
    console.error("Spotify Search Error:", error);
    return [];
  }
};

export const getUserPlaylists = async (token: string): Promise<Playlist[]> => {
    try {
        const response = await fetchSpotify(token, 'me/playlists?limit=20');
        if (!response || !response.ok) return [];
        const data = await response.json();
        return data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            coverUrl: item.images?.[0]?.url || "",
            songs: [] // We fetch these on demand
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const getUserTopTracks = async (token: string): Promise<Song[]> => {
    try {
        const response = await fetchSpotify(token, 'me/top/tracks?limit=10&time_range=short_term');
        if (!response || !response.ok) return [];
        const data = await response.json();
        return data.items.map((track: any) => mapSpotifyTrackToSong(track));
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const getPlaylistTracks = async (token: string, playlistId: string): Promise<Song[]> => {
    try {
        const response = await fetchSpotify(token, `playlists/${playlistId}/tracks?limit=50`);
        if (!response || !response.ok) return [];
        const data = await response.json();
        return data.items
            .filter((item: any) => item.track) // filter out null tracks
            .map((item: any) => mapSpotifyTrackToSong(item.track));
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const playSpotifyTrack = async (token: string, deviceId: string, uri: string) => {
    try {
        await fetchSpotify(token, `me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            body: JSON.stringify({ uris: [uri] }),
        });
    } catch (e) {
        console.error("Error playing track:", e);
    }
};

export const togglePlay = async (token: string, isPlaying: boolean) => {
    const endpoint = isPlaying ? "pause" : "play";
    await fetchSpotify(token, `me/player/${endpoint}`, { method: "PUT" });
}

export const nextTrack = async (token: string) => {
    await fetchSpotify(token, `me/player/next`, { method: "POST" });
}

export const prevTrack = async (token: string) => {
    await fetchSpotify(token, `me/player/previous`, { method: "POST" });
}

export const seek = async (token: string, positionMs: number) => {
    await fetchSpotify(token, `me/player/seek?position_ms=${Math.floor(positionMs)}`, { method: "PUT" });
}

export const setVolume = async (token: string, volumePercent: number) => {
    const vol = Math.round(volumePercent * 100);
    await fetchSpotify(token, `me/player/volume?volume_percent=${vol}`, { method: "PUT" });
}

const mapSpotifyTrackToSong = (track: any): Song => {
    const image = track.album.images[0]?.url || track.album.images[1]?.url || "";
    return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        album: track.album.name,
        coverUrl: image,
        duration: formatDuration(track.duration_ms),
        durationSec: Math.floor(track.duration_ms / 1000),
        uri: track.uri,
        spotifyId: track.id
    };
}

const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}