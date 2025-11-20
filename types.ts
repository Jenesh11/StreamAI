export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: string; // Format "MM:SS"
  durationSec: number;
  audioUrl?: string; // For fallback/preview
  lyrics?: string;
  uri?: string; // Spotify URI
  spotifyId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songs: Song[];
}

export enum View {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  LIBRARY = 'LIBRARY',
  PLAYLIST = 'PLAYLIST'
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  currentSong: Song | null;
  queue: Song[];
}

// Spotify SDK Type Definitions
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}