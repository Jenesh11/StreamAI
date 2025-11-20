import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, User, Bell, Settings, Sparkles, Play, Zap, LogIn, X, Loader2, LayoutGrid, List } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import SongList from './components/SongList';
import LyricsOverlay from './components/LyricsOverlay';
import { Song, View, Playlist } from './types';
import { SAMPLE_SONGS } from './constants';
import { searchMusicWithGemini, getAiGreeting, getSongLyrics } from './services/geminiService';
import { 
    getLoginUrl, 
    getTokenFromUrl, 
    searchSpotify, 
    playSpotifyTrack, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    seek,
    getUserPlaylists,
    getUserTopTracks,
    getPlaylistTracks
} from './services/spotifyService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>(SAMPLE_SONGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [greeting, setGreeting] = useState("Welcome back");
  const [isSearching, setIsSearching] = useState(false);
  const [isPopupHandler, setIsPopupHandler] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Lyrics State
  const [showLyrics, setShowLyrics] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Spotify State
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>(null);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [spotifyProgress, setSpotifyProgress] = useState(0);
  
  // Spotify Data
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<Playlist[]>([]);
  const [topTracks, setTopTracks] = useState<Song[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // --- Initialization & Auth Flow ---
  useEffect(() => {
    const token = getTokenFromUrl();
    if (token) {
        if (window.opener) {
            setIsPopupHandler(true);
            window.opener.postMessage({ type: 'SPOTIFY_TOKEN', token }, '*');
            window.close();
            return;
        }
        setSpotifyToken(token);
        window.location.hash = ""; 
    }
    getAiGreeting().then(setGreeting);
  }, []);

  useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'SPOTIFY_TOKEN' && event.data?.token) {
              setSpotifyToken(event.data.token);
              setShowSettings(false);
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- Spotify Data Fetching ---
  useEffect(() => {
      if (spotifyToken) {
          const loadData = async () => {
              const [playlists, tracks] = await Promise.all([
                  getUserPlaylists(spotifyToken),
                  getUserTopTracks(spotifyToken)
              ]);
              setSpotifyPlaylists(playlists);
              setTopTracks(tracks);
              if (tracks.length > 0) setQueue(tracks); // Init queue with top tracks
          };
          loadData();
      }
  }, [spotifyToken]);

  // --- Spotify SDK Loading ---
  useEffect(() => {
    if (spotifyToken && !isSpotifyReady) {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'StreamAI Web Player',
                getOAuthToken: (cb: any) => { cb(spotifyToken); },
                volume: 0.5
            });

            player.addListener('ready', ({ device_id }: any) => {
                setSpotifyDeviceId(device_id);
                setIsSpotifyReady(true);
            });

            player.addListener('not_ready', ({ device_id }: any) => {
                setIsSpotifyReady(false);
            });

            player.addListener('authentication_error', ({ message }: any) => {
                console.error(message);
                setSpotifyToken(null);
            });

            player.addListener('player_state_changed', (state: any) => {
                if (!state) return;
                setIsPlaying(!state.paused);
                setSpotifyProgress(state.position);
                
                const track = state.track_window.current_track;
                if (track && (!currentSong || currentSong.uri !== track.uri)) {
                     const duration = track.duration_ms;
                     const m = Math.floor(duration / 60000);
                     const s = Math.floor((duration % 60000) / 1000);
                     
                     setCurrentSong({
                         id: track.id,
                         title: track.name,
                         artist: track.artists[0].name,
                         album: track.album.name,
                         coverUrl: track.album.images[0]?.url || "",
                         duration: `${m}:${s < 10 ? '0' : ''}${s}`,
                         durationSec: Math.floor(duration / 1000),
                         uri: track.uri
                     });
                }
            });

            player.connect();
        };
    }
  }, [spotifyToken]);

  const handleConnectSpotify = () => {
      const loginUrl = getLoginUrl();
      if (!loginUrl) return;
      const width = 450;
      const height = 730;
      const left = (window.screen.width / 2) - (width / 2);
      const top = (window.screen.height / 2) - (height / 2);
      window.open(loginUrl, 'SpotifyLogin', `menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=${width}, height=${height}, top=${top}, left=${left}`);
  };

  const handleDisconnectSpotify = () => {
      setSpotifyToken(null);
      setIsSpotifyReady(false);
      setSpotifyDeviceId(null);
      setSpotifyPlaylists([]);
      setTopTracks([]);
  };

  // Lyrics Fetching Logic
  useEffect(() => {
      const fetchLyricsIfNeeded = async () => {
          if (currentSong && showLyrics && !currentSong.lyrics && !isLoadingLyrics) {
              setIsLoadingLyrics(true);
              const lyrics = await getSongLyrics(currentSong.title, currentSong.artist);
              const updatedSong = { ...currentSong, lyrics };
              setCurrentSong(updatedSong);
              setQueue(prevQueue => prevQueue.map(s => s.id === currentSong.id ? { ...s, lyrics } : s));
              setSearchResults(prevResults => prevResults.map(s => s.id === currentSong.id ? { ...s, lyrics } : s));
              setIsLoadingLyrics(false);
          }
      };
      fetchLyricsIfNeeded();
  }, [currentSong, showLyrics]);

  // Search Logic
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    if (spotifyToken) {
        const results = await searchSpotify(spotifyToken, searchQuery);
        setSearchResults(results);
    } else {
        const results = await searchMusicWithGemini(searchQuery);
        setSearchResults(results);
    }
    setIsSearching(false);
  };

  const playSong = useCallback(async (song: Song) => {
    setCurrentSong(song);
    if (spotifyToken && spotifyDeviceId && song.uri) {
        await playSpotifyTrack(spotifyToken, spotifyDeviceId, song.uri);
        setIsPlaying(true);
    } else {
        setIsPlaying(true);
    }
  }, [spotifyToken, spotifyDeviceId]);

  const togglePlayPause = async () => {
      if (spotifyToken && isSpotifyReady) {
          await togglePlay(spotifyToken, isPlaying);
          setIsPlaying(!isPlaying);
      } else {
          setIsPlaying(!isPlaying);
      }
  };

  const handleNext = async () => {
      if (spotifyToken && isSpotifyReady) await nextTrack(spotifyToken);
      else {
          if(!currentSong) return;
          const idx = queue.findIndex(s => s.id === currentSong.id);
          if(idx < queue.length - 1) playSong(queue[idx + 1]);
          else playSong(queue[0]);
      }
  };

  const handlePrev = async () => {
      if (spotifyToken && isSpotifyReady) await prevTrack(spotifyToken);
      else {
          if(!currentSong) return;
          const idx = queue.findIndex(s => s.id === currentSong.id);
          if(idx > 0) playSong(queue[idx - 1]);
          else playSong(queue[queue.length - 1]);
      }
  };

  const handleSeek = async (val: number) => {
      if(spotifyToken) await seek(spotifyToken, val);
  }

  const handleUpdateLyrics = (songId: string, newLyrics: string) => {
      if (currentSong && currentSong.id === songId) {
          const updatedSong = { ...currentSong, lyrics: newLyrics };
          setCurrentSong(updatedSong);
          setQueue(prev => prev.map(s => s.id === songId ? updatedSong : s));
      }
  };

  const handleSelectPlaylist = async (playlist: Playlist) => {
      setSelectedPlaylist(playlist);
      setCurrentView(View.PLAYLIST);
      if (spotifyToken) {
          setIsLoadingData(true);
          const tracks = await getPlaylistTracks(spotifyToken, playlist.id);
          // Update the selected playlist object with tracks
          setSelectedPlaylist({ ...playlist, songs: tracks });
          setIsLoadingData(false);
      }
  };

  if (isPopupHandler) {
      return (
          <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
              <div className="flex flex-col items-center gap-4">
                  <Sparkles className="w-8 h-8 animate-spin text-cyan-500" />
                  <span className="text-xl font-bold">Syncing with the cloud...</span>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    if (currentView === View.SEARCH) {
      return (
        <div className="p-8">
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
                    <h3 className="text-xl font-bold text-white/90 mb-4">Top Results</h3>
                    <SongList songs={searchResults} onPlaySong={playSong} showHeader={false} />
                </div>
            ) : (
              <div className="mt-8">
                <h3 className="text-white/90 font-bold text-lg mb-4">Explore Genres</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {['Pop', 'Cyberpunk', 'Lofi', 'Synthwave', 'Ambient', 'Jazz', 'Deep Focus', 'Energy', 'Retro', 'Future Bass'].map((genre, i) => (
                        <div 
                            key={genre} 
                            onClick={() => { setSearchQuery(genre + " music"); handleSearch({ preventDefault: () => {} } as any); }}
                            className="aspect-[4/3] rounded-2xl p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform group border border-white/5"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm z-0"></div>
                            <div className={`absolute inset-0 bg-gradient-to-br opacity-40 z-0 ${
                                [
                                    'from-pink-500 to-purple-600',
                                    'from-cyan-500 to-blue-600',
                                    'from-emerald-500 to-teal-600',
                                    'from-orange-500 to-red-600',
                                    'from-violet-500 to-fuchsia-600'
                                ][i % 5]
                            }`}></div>
                            <span className="text-lg font-bold text-white absolute bottom-3 left-4 z-10 group-hover:translate-x-1 transition-transform">{genre}</span>
                            <Sparkles className="absolute top-3 right-3 w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors z-10" />
                        </div>
                    ))}
                </div>
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
                     {selectedPlaylist.coverUrl ? (
                         <img src={selectedPlaylist.coverUrl} alt={selectedPlaylist.name} className="w-48 h-48 rounded-2xl shadow-2xl" />
                     ) : (
                         <div className="w-48 h-48 rounded-2xl bg-white/10 flex items-center justify-center shadow-2xl"><List className="w-16 h-16 text-white/20"/></div>
                     )}
                     <div className="flex flex-col gap-2 mb-2">
                         <span className="text-xs font-bold uppercase tracking-widest text-white/70">Playlist</span>
                         <h1 className="text-5xl font-bold text-white tracking-tight">{selectedPlaylist.name}</h1>
                         <p className="text-white/60 text-sm">{selectedPlaylist.description || "Your custom collection"}</p>
                     </div>
                 </div>
                 <div className="px-8 mt-6">
                     {isLoadingData ? (
                         <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-500"/></div>
                     ) : (
                        <SongList songs={selectedPlaylist.songs} onPlaySong={playSong} showHeader={true} />
                     )}
                 </div>
            </div>
        )
    }

    if (currentView === View.LIBRARY) {
        const displayTracks = spotifyToken && topTracks.length > 0 ? topTracks : queue;
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold text-white mb-8">Your Collection</h2>
                <div className="flex gap-3 mb-8">
                     {['Playlists', 'Albums', 'Artists'].map(filter => (
                         <button key={filter} className="px-5 py-2 bg-white/5 hover:bg-white/15 border border-white/5 rounded-full text-sm font-medium transition-all text-white backdrop-blur-md">
                             {filter}
                         </button>
                     ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {displayTracks.map((s, i) => (
                        <div key={s.id} onClick={() => playSong(s)} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5">
                            <div className="relative mb-4 aspect-square rounded-xl overflow-hidden">
                                <img src={s.coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={s.title} />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                                <div className="absolute bottom-2 right-2 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                </div>
                            </div>
                            <h3 className="font-bold text-white truncate mb-1 text-sm">{s.title}</h3>
                            <p className="text-xs text-white/50 truncate">By {s.artist}</p>
                        </div>
                    ))}
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
                    <div className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center cursor-pointer transition-all backdrop-blur-md" onClick={() => setShowSettings(true)}>
                         <Settings className="w-5 h-5 text-white/70" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center cursor-pointer shadow-lg shadow-cyan-500/20">
                         <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>

            {/* Recent Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {(spotifyToken && topTracks.length > 0 ? topTracks.slice(0, 6) : queue.slice(0, 6)).map((song) => (
                    <div 
                        key={song.id} 
                        className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all rounded-xl overflow-hidden flex items-center cursor-pointer group pr-4 h-20 backdrop-blur-sm"
                        onClick={() => playSong(song)}
                    >
                        <img src={song.coverUrl} className="w-20 h-20 object-cover" alt={song.title} />
                        <div className="flex items-center justify-between flex-1 ml-4 overflow-hidden">
                             <span className="font-bold text-white truncate text-sm">{song.title}</span>
                             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {spotifyToken ? "Your Top Tracks" : "Jump Back In"}
                    </h2>
                    <span className="text-xs text-cyan-400 font-bold hover:text-cyan-300 cursor-pointer uppercase tracking-wider flex items-center gap-1">
                        View All <ChevronRight className="w-3 h-3" />
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {(spotifyToken && topTracks.length > 0 ? topTracks : SAMPLE_SONGS).slice(0, 10).map((song, idx) => (
                        <div key={idx} className="bg-[#181818]/40 hover:bg-[#181818]/80 border border-white/5 p-4 rounded-2xl transition-all cursor-pointer group hover:-translate-y-2 duration-300">
                            <div className="relative mb-4 w-full aspect-square rounded-xl overflow-hidden shadow-lg">
                                <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute bottom-3 right-3 bg-cyan-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg shadow-cyan-500/40 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-300 translate-y-4 group-hover:translate-y-0" onClick={() => playSong(song)}>
                                    <Play className="w-5 h-5 text-white fill-white ml-1" />
                                </div>
                            </div>
                            <h3 className="font-bold text-white truncate mb-1 text-sm">{song.title}</h3>
                            <p className="text-xs text-white/50 line-clamp-1 font-medium">{song.artist}</p>
                        </div>
                    ))}
                </div>
            </section>
         </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-transparent text-white font-sans selection:bg-cyan-500/30">
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar 
            currentView={currentView} 
            onChangeView={setCurrentView} 
            isSpotifyConnected={!!spotifyToken}
            onConnectSpotify={handleConnectSpotify}
            onDisconnectSpotify={handleDisconnectSpotify}
            spotifyPlaylists={spotifyPlaylists}
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
             
             <div className="flex items-center gap-4">
                 {!spotifyToken && (
                    <button 
                        onClick={handleConnectSpotify} 
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg"
                    >
                        Sign In
                    </button>
                 )}
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
                    onSaveLyrics={handleUpdateLyrics}
                />
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-md p-4">
                    <div className="bg-[#1a1a2e] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Settings className="w-6 h-6 text-cyan-400" /> Settings
                        </h2>
                        <div className="mb-8 space-y-6">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-white/50 mb-2 font-bold uppercase tracking-wide">Redirect URI</p>
                                <code className="text-sm text-cyan-300 font-mono select-all break-all block bg-black/20 p-2 rounded-lg">
                                    {window.location.origin}
                                </code>
                            </div>
                            <div className="text-sm text-white/60 leading-relaxed">
                                 StreamAI uses your environment variables for secure authentication. 
                                 <span className="block mt-2 text-white/40 text-xs">Client ID: ...228227</span>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setShowSettings(false)} 
                                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
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
        isSpotifyActive={!!(spotifyToken && isSpotifyReady)}
        externalProgress={spotifyProgress}
        onSeek={handleSeek}
        spotifyToken={spotifyToken}
      />
    </div>
  );
};

export default App;