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
  youtubeId?: string; // New: YouTube Video ID
  uri?: string;
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

// YouTube IFrame API Types
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}