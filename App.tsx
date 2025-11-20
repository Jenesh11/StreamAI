import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, User, Bell, Settings, Sparkles, Play, Zap, LogIn, X, Loader2, LayoutGrid, List, AlertCircle, Info } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import SongList from './components/SongList';
import LyricsOverlay from './components/LyricsOverlay';
import { Song, View, Playlist } from './types';
import { SAMPLE_SONGS, MOCK_PLAYLISTS } from './constants';
import { searchMusicWithGemini, getAiGreeting, getSongLyrics } from './services/geminiService';
import { searchYouTubeVideo } from './services/youtubeService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>(SAMPLE_SONGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [greeting, setGreeting] = useState("Welcome back");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'info' | 'error' | 'success'} | null>(null);

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
  };

  // Initialize
  useEffect(() => {
    getAiGreeting().then(setGreeting);
  }, []);

  // Search Logic
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    // Use Gemini to get smart song suggestions
    const results = await searchMusicWithGemini(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Play Logic (YouTube Powered)
  const playSong = useCallback(async (song: Song) => {
      setCurrentSong(song);
      setIsPlaying(false); // Pause briefly while loading
      showToast(`Loading ${song.title} from YouTube...`, 'info');

      try {
        // If we don't have a YouTube ID yet, fetch it
        if (!song.youtubeId) {
            const query = `${song.title} ${song.artist} audio`;
            const videoId = await searchYouTubeVideo(query);
            
            if (videoId) {
                song.youtubeId = videoId;
                // Update queue references
                setQueue(prev => prev.map(s => s.id === song.id ? { ...s, youtubeId: videoId } : s));
                setCurrentSong({ ...song, youtubeId: videoId });
                setIsPlaying(true);
            } else {
                showToast("Could not find song on YouTube.", "error");
            }
        } else {
            // Already have ID, just play
            setIsPlaying(true);
        }
      } catch (e) {
          console.error(e);
          showToast("Playback error", "error");
      }
  }, []);

  const togglePlayPause = () => {
      setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
      if(!currentSong) return;
      const idx = queue.findIndex(s => s.id === currentSong.id);
      if(idx < queue.length - 1) playSong(queue[idx + 1]);
      else playSong(queue[0]);
  };

  const handlePrev = () => {
      if(!currentSong) return;
      const idx = queue.findIndex(s => s.id === currentSong.id);
      if(idx > 0) playSong(queue[idx - 1]);
      else playSong(queue[queue.length - 1]);
  };

  // Lyrics Logic
  useEffect(() => {
      const fetchLyricsIfNeeded = async () => {
          if (currentSong && showLyrics && !currentSong.lyrics && !isLoadingLyrics) {
              setIsLoadingLyrics(true);
              const lyrics = await getSongLyrics(currentSong.title, currentSong.artist);
              const updatedSong = { ...currentSong, lyrics };
              setCurrentSong(updatedSong);
              setQueue(prevQueue => prevQueue.map(s => s.id === currentSong.id ? { ...s, lyrics } : s));
              setIsLoadingLyrics(false);
          }
      };
      fetchLyricsIfNeeded();
  }, [currentSong, showLyrics]);

  const handleSelectPlaylist = (playlist: Playlist) => {
      setSelectedPlaylist(playlist);
      setCurrentView(View.PLAYLIST);
      setQueue(playlist.songs);
  }

  const renderContent = () => {
    if (currentView === View.SEARCH) {
      return (
        <div className="p-8 pb-32">
          <div className="mb-8 flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-white">Search the Universe</h2>
            
            <div className="relative w-full max-w-lg group">
                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                 <form onSubmit={handleSearch} className="relative flex items-center">
                    <div className="absolute left-4 text-white/60">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        className="block w-full py-4 pl-12 pr-6 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all font-medium shadow-xl"
                        placeholder="Songs, artists, or moods..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-5">
                        {isSearching && <Sparkles className="h-5 w-5 text-cyan-400 animate-spin" />}
                    </div>
                 </form>
            </div>

            {searchResults.length > 0 ? (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold text-white/90 mb-4">Results</h3>
                    <SongList songs={searchResults} onPlaySong={playSong} showHeader={false} />
                </div>
            ) : (
                <div className="mt-12 text-center text-white/40">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a prompt to generate a playlist with AI.</p>
                    <p className="text-sm mt-2">"Cyberpunk vibes for coding"</p>
                </div>
            )}
          </div>
        </div>
      );
    }

    if (currentView === View.PLAYLIST && selectedPlaylist) {
         return (
            <div className="pb-32 animate-in fade-in duration-500">
                 <div className="h-64 w-full bg-gradient-to-b from-indigo-900/60 to-[#0f0c29] p-8 flex items-end gap-6 relative">
                     <img src={selectedPlaylist.coverUrl} alt={selectedPlaylist.name} className="w-48 h-48 rounded-2xl shadow-2xl" />
                     <div className="flex flex-col gap-2 mb-2">
                         <span className="text-xs font-bold uppercase tracking-widest text-white/70">Playlist</span>
                         <h1 className="text-5xl font-bold text-white tracking-tight">{selectedPlaylist.name}</h1>
                         <p className="text-white/60 text-sm">{selectedPlaylist.description}</p>
                     </div>
                 </div>
                 <div className="px-8 mt-6">
                    <SongList songs={selectedPlaylist.songs} onPlaySong={playSong} showHeader={true} />
                 </div>
            </div>
        )
    }

    // HOME VIEW
    return (
      <div className="p-8 pb-32">
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white tracking-tight">{greeting}</h1>
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center cursor-pointer transition-all backdrop-blur-md">
                         <Bell className="w-5 h-5 text-white/70" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center cursor-pointer shadow-lg shadow-cyan-500/20">
                         <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Recent Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                {queue.slice(0, 6).map((song) => (
                    <div 
                        key={song.id} 
                        className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all rounded-xl overflow-hidden flex items-center cursor-pointer group pr-4 h-16 backdrop-blur-sm"
                        onClick={() => playSong(song)}
                    >
                        <img src={song.coverUrl} className="w-16 h-16 object-cover" alt={song.title} />
                        <div className="flex items-center justify-between flex-1 ml-4 overflow-hidden">
                             <span className="font-bold text-white truncate text-xs">{song.title}</span>
                             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-transparent text-white font-sans selection:bg-cyan-500/30 relative">
      
      {/* Toast Notification */}
      {toast && (
          <div className={`fixed top-24 right-6 z-[70] px-4 py-3 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300 ${
              toast.type === 'error' ? 'bg-red-500/20 border border-red-500/30' : 'bg-cyan-500/20 border border-cyan-500/30'
          }`}>
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-300"/> : <Info className="w-5 h-5 text-cyan-300"/>}
              <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar 
            currentView={currentView} 
            onChangeView={setCurrentView} 
            playlists={MOCK_PLAYLISTS} 
            onSelectPlaylist={handleSelectPlaylist} 
        />
        
        <div className="flex-1 relative flex flex-col bg-transparent overflow-hidden">
          {/* Top Navigation Bar */}
          <div className="h-20 px-8 flex items-center justify-between z-20 sticky top-0 bg-gradient-to-b from-[#0f0c29] to-transparent">
             <div className="flex gap-3">
                <button className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-md border border-white/5 flex items-center justify-center hover:bg-white/10 transition text-white">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-md border border-white/5 flex items-center justify-center hover:bg-white/10 transition text-white">
                    <ChevronRight className="w-5 h-5" />
                </button>
             </div>
          </div>

          {/* Main Scrollable Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
             <div className="relative z-10 max-w-none mx-auto w-full">
                {renderContent()}
             </div>
          </div>
        
          {/* Lyrics Overlay */}
          {currentSong && (
              <LyricsOverlay 
                  song={currentSong} 
                  isVisible={showLyrics} 
                  isLoading={isLoadingLyrics}
                  onClose={() => setShowLyrics(false)}
                  onSaveLyrics={(id, txt) => console.log(txt)}
              />
          )}
        </div>
      </div>
      
      <Player 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onPlayPause={togglePlayPause}
        onNext={handleNext}
        onPrevious={handlePrev}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
        showLyrics={showLyrics}
        onSeek={() => {}}
        onSongEnd={handleNext}
      />
    </div>
  );
};

export default App;