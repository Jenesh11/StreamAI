import React from 'react';
import { Clock, Play, BarChart3 } from 'lucide-react';
import { Song } from '../types';

interface SongListProps {
  songs: Song[];
  onPlaySong: (song: Song) => void;
  showHeader?: boolean;
  title?: string;
}

const SongList: React.FC<SongListProps> = ({ songs, onPlaySong, showHeader = true, title }) => {
  return (
    <div className="w-full">
      {title && <h2 className="text-2xl font-bold mb-6 px-4 text-white tracking-tight">{title}</h2>}
      
      {showHeader && (
        <div className="grid grid-cols-[24px_4fr_3fr_minmax(100px,1fr)] gap-6 px-6 py-3 text-white/40 text-xs font-bold uppercase tracking-wider mb-2">
          <span>#</span>
          <span>Track</span>
          <span>Album</span>
          <span className="flex justify-end"><Clock className="w-3 h-3" /></span>
        </div>
      )}

      <div className="flex flex-col pb-32 gap-2">
        {songs.map((song, index) => (
          <div 
            key={song.id}
            className="group grid grid-cols-[24px_4fr_3fr_minmax(100px,1fr)] gap-6 px-6 py-3 rounded-2xl hover:bg-white/10 items-center cursor-pointer transition-all duration-200 border border-transparent hover:border-white/5 hover:shadow-lg hover:backdrop-blur-md"
            onClick={() => onPlaySong(song)}
          >
            <div className="text-white/40 font-medium text-sm flex items-center justify-center w-6">
               <span className="group-hover:hidden">{index + 1}</span>
               <Play className="w-4 h-4 hidden group-hover:block text-cyan-400 fill-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
            </div>
            
            <div className="flex items-center gap-4">
              <img src={song.coverUrl} alt={song.album} className="w-12 h-12 rounded-lg object-cover shadow-md group-hover:shadow-xl transition-shadow" />
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base truncate mb-0.5">{song.title}</span>
                <span className="text-sm text-white/50 group-hover:text-white/80 truncate transition-colors">{song.artist}</span>
              </div>
            </div>

            <div className="text-sm text-white/50 group-hover:text-white/80 truncate transition-colors font-medium">
              {song.album}
            </div>

            <div className="text-sm text-white/40 flex justify-end font-mono group-hover:text-white/80">
              {song.duration}
            </div>
          </div>
        ))}
        {songs.length === 0 && (
            <div className="text-white/30 p-12 text-center flex flex-col items-center gap-4 bg-white/5 rounded-3xl border border-white/5 border-dashed mx-4">
                <BarChart3 className="w-12 h-12 opacity-50" />
                <span className="text-lg font-medium">No tracks found in this dimension.</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default SongList;