import React, { useState } from 'react';
import { Home, Search, Library, PlusSquare, Heart, Disc, LogIn, LogOut, Music, Sparkles, ListMusic, Copy, Check } from 'lucide-react';
import { View, Playlist } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isSpotifyConnected: boolean;
  onConnectSpotify: () => void;
  onDisconnectSpotify: () => void;
  spotifyPlaylists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    onChangeView, 
    isSpotifyConnected, 
    onConnectSpotify, 
    onDisconnectSpotify,
    spotifyPlaylists,
    onSelectPlaylist
}) => {
  const [copied, setCopied] = useState(false);
  const navItemClass = (view: View) => 
    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer font-medium text-sm mb-1 ${
      currentView === view 
        ? 'text-white bg-white/10 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.2)] backdrop-blur-md' 
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`;

  const handleCopyUri = () => {
      navigator.clipboard.writeText(window.location.origin.replace(/\/$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-64 h-full flex flex-col bg-black/20 backdrop-blur-xl border-r border-white/5 z-20 pt-6 relative shrink-0 transition-all duration-300 hidden md:flex">
      
      {/* Logo Area */}
      <div className="px-6 mb-8 flex items-center gap-3 text-white group cursor-pointer" onClick={() => onChangeView(View.HOME)}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Music className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight group-hover:text-cyan-400 transition-colors">StreamAI</span>
      </div>

      {/* Main Nav */}
      <div className="px-4 space-y-1">
        <div className={navItemClass(View.HOME)} onClick={() => onChangeView(View.HOME)}>
          <Home className="w-5 h-5" />
          <span>Discover</span>
        </div>
        <div className={navItemClass(View.SEARCH)} onClick={() => onChangeView(View.SEARCH)}>
          <Search className="w-5 h-5" />
          <span>Search</span>
        </div>
        <div className={navItemClass(View.LIBRARY)} onClick={() => onChangeView(View.LIBRARY)}>
          <Library className="w-5 h-5" />
          <span>Library</span>
        </div>
      </div>

      <div className="mt-8 px-4 space-y-2">
         <div className="text-xs font-bold text-white/40 uppercase tracking-wider px-4 mb-2">Your Library</div>
         <div className="flex items-center gap-4 px-4 py-2 text-white/70 hover:text-white cursor-pointer transition-all rounded-xl hover:bg-white/5">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <PlusSquare className="w-4 h-4 text-white/80" />
            </div>
            <span className="text-sm font-medium">New Playlist</span>
         </div>
         <div className="flex items-center gap-4 px-4 py-2 text-white/70 hover:text-white cursor-pointer transition-all rounded-xl hover:bg-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center rounded-lg shadow-lg shadow-purple-500/20">
                <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-medium">Favorites</span>
         </div>
      </div>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mx-6 my-6"></div>

      {/* Playlist Scroll Area */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
         <div className="text-xs font-bold text-white/40 uppercase tracking-wider px-4 mb-2">Playlists</div>
         <div className="flex flex-col gap-1">
           {isSpotifyConnected && spotifyPlaylists.length > 0 ? (
             spotifyPlaylists.map((playlist) => (
               <div 
                 key={playlist.id} 
                 className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-all"
                 onClick={() => onSelectPlaylist(playlist)}
               >
                 {playlist.coverUrl ? (
                     <img src={playlist.coverUrl} alt={playlist.name} className="w-8 h-8 rounded bg-white/10 object-cover" />
                 ) : (
                     <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><ListMusic className="w-4 h-4 text-white/50"/></div>
                 )}
                 <span className="text-sm text-white/70 group-hover:text-white transition-colors truncate flex-1">{playlist.name}</span>
               </div>
             ))
           ) : (
             [1, 2, 3].map((i) => (
               <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer group opacity-50">
                 <div className="w-8 h-8 rounded bg-white/10"></div>
                 <span className="text-sm text-white/50">Playlist #{i}</span>
               </div>
             ))
           )}
           {!isSpotifyConnected && (
               <div className="px-4 py-4 text-xs text-white/30 text-center italic">
                   Connect Spotify to see your playlists
               </div>
           )}
         </div>
      </div>

      {/* Spotify Status at Bottom */}
      <div className="p-4 mt-auto space-y-3">
        {isSpotifyConnected ? (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/5 overflow-hidden transition-all hover:bg-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]"></div>
                        <span className="text-xs font-bold text-white/90">Spotify Active</span>
                    </div>
                    <button onClick={onDisconnectSpotify} title="Disconnect" className="bg-transparent border-0 p-0 focus:outline-none">
                        <LogOut className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
                    </button>
                </div>
            </div>
        ) : (
            <>
                <button 
                    onClick={onConnectSpotify}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02]"
                >
                    <LogIn className="w-4 h-4" />
                    <span>Connect Spotify</span>
                </button>
                
                {/* Configuration Helper */}
                <div className="px-3 py-3 bg-white/5 rounded-xl border border-white/5 relative group">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Required Setup</span>
                        {copied && <span className="text-[10px] text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>}
                     </div>
                     <p className="text-[10px] text-white/60 mb-2 leading-relaxed">
                        Add this URI to your <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-cyan-400 hover:underline">Spotify Dashboard</a> whitelist to fix connection errors:
                     </p>
                     <div 
                        className="flex items-center justify-between bg-black/30 rounded-lg border border-white/5 p-2 cursor-pointer hover:bg-black/50 transition-colors group/code"
                        onClick={handleCopyUri}
                        title="Click to Copy"
                     >
                        <code className="text-[10px] text-cyan-300 font-mono truncate flex-1 mr-2">
                            {window.location.origin.replace(/\/$/, "")}
                        </code>
                        <Copy className="w-3 h-3 text-white/30 group-hover/code:text-white transition-colors" />
                     </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;