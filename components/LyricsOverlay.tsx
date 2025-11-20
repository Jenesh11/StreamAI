import React, { useEffect, useState } from 'react';
import { Edit2, Save, X, Loader2 } from 'lucide-react';
import { Song } from '../types';

interface LyricsOverlayProps {
  song: Song;
  isVisible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSaveLyrics: (songId: string, newLyrics: string) => void;
}

const LyricsOverlay: React.FC<LyricsOverlayProps> = ({ song, isVisible, isLoading, onClose, onSaveLyrics }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');

  // Reset state when song changes
  useEffect(() => {
    setIsEditing(false);
    setEditedLyrics(song.lyrics || '');
  }, [song]);

  // Update local state if lyrics come in late (e.g. finished loading)
  useEffect(() => {
      if (!isEditing) {
          setEditedLyrics(song.lyrics || '');
      }
  }, [song.lyrics, isEditing]);

  const handleSave = () => {
    onSaveLyrics(song.id, editedLyrics);
    setIsEditing(false);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 top-0 left-0 bottom-24 bg-[#05050a]/95 backdrop-blur-md z-40 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/20">
         <div className="flex items-center gap-4">
            <img src={song.coverUrl} className="w-12 h-12 rounded-md shadow-lg opacity-80" alt="Cover" />
            <div>
                <h2 className="text-xl font-bold text-white">Lyrics</h2>
                <p className="text-sm text-zinc-400">{song.title} • {song.artist}</p>
            </div>
         </div>
         <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition">
             <X className="w-6 h-6" />
         </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex justify-center">
         <div className="w-full max-w-2xl relative">
             {isLoading ? (
                 <div className="flex flex-col items-center justify-center h-64 gap-4 text-zinc-500">
                     <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                     <span className="animate-pulse">Fetching lyrics from the cosmos...</span>
                 </div>
             ) : (
                 <>
                    <div className="absolute right-0 top-0">
                        {isEditing ? (
                             <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-full text-sm font-bold text-white transition shadow-lg shadow-violet-900/20"
                             >
                                <Save className="w-4 h-4" /> Save
                             </button>
                        ) : (
                             <button 
                                onClick={() => { setIsEditing(true); setEditedLyrics(song.lyrics || ''); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition border border-white/5"
                             >
                                <Edit2 className="w-3 h-3" /> Edit
                             </button>
                        )}
                    </div>

                    {isEditing ? (
                        <textarea 
                            value={editedLyrics}
                            onChange={(e) => setEditedLyrics(e.target.value)}
                            className="w-full h-[500px] bg-transparent text-2xl md:text-3xl font-bold text-white/90 leading-relaxed focus:outline-none resize-none font-sans selection:bg-violet-500/30"
                            placeholder="Type lyrics here..."
                        />
                    ) : (
                        <div className="text-2xl md:text-3xl font-bold text-zinc-300 leading-relaxed whitespace-pre-wrap pb-20">
                            {song.lyrics ? song.lyrics : (
                                <div className="text-zinc-600 italic">No lyrics found. Click edit to add them.</div>
                            )}
                        </div>
                    )}
                 </>
             )}
         </div>
      </div>
    </div>
  );
};

export default LyricsOverlay;