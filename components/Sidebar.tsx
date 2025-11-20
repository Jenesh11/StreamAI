import React from 'react';
import { Home, Search, Library, PlusSquare, Heart, Music, ListMusic, Youtube } from 'lucide-react';
import { View, Playlist } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  playlists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    onChangeView, 
    playlists,
    onSelectPlaylist
}) => {
  const navItemClass = (view: View) => 
    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer font-medium text-sm mb-1 ${
      currentView === view 
        ? 'text-white bg-white/10 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.2)] backdrop-blur-md' 
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="w-64 h-full flex flex-col bg-black/20 backdrop-blur-xl border-r border-white/5 z-20 pt-6 relative shrink-0 transition-all duration-300 hidden md:flex">
      
      {/* Logo Area */}
      <div className="px-6 mb-8 flex items-center gap-3 text-white group cursor-pointer" onClick={() => onChangeView(View.HOME)}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
            <Youtube className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight group-hover:text-red-400 transition-colors">StreamAI</span>
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
           {playlists.map((playlist) => (
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
             ))}
         </div>
      </div>
    </div>
  );
};

export default Sidebar;