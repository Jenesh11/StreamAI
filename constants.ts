import { Song, Playlist } from './types';

export const SAMPLE_SONGS: Song[] = [
  {
    id: '1',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    coverUrl: 'https://image.pollinations.ai/prompt/city%20lights%20purple%20neon%20night%20sky%20album%20cover?width=512&height=512&nologo=true',
    duration: '4:03',
    durationSec: 243,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '2',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    coverUrl: 'https://image.pollinations.ai/prompt/dark%20mood%20red%20neon%20cross%20abstract%20album%20cover?width=512&height=512&nologo=true',
    duration: '3:50',
    durationSec: 230,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '3',
    title: 'Neon Lights',
    artist: 'Kraftwerk',
    album: 'The Man-Machine',
    coverUrl: 'https://image.pollinations.ai/prompt/retro%20computer%20green%20code%20glitch%20art%20album%20cover?width=512&height=512&nologo=true',
    duration: '5:41',
    durationSec: 341,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'liked',
    name: 'Liked Songs',
    description: 'Your favorite tracks',
    coverUrl: 'https://image.pollinations.ai/prompt/heart%20shape%20neon%20glowing%20purple?width=512&height=512&nologo=true',
    songs: SAMPLE_SONGS
  },
  {
    id: 'daily-mix',
    name: 'Daily Mix 1',
    description: 'Made for you based on your recent listening',
    coverUrl: 'https://image.pollinations.ai/prompt/colorful%20abstract%20sound%20waves?width=512&height=512&nologo=true',
    songs: [SAMPLE_SONGS[1], SAMPLE_SONGS[0]]
  }
];
