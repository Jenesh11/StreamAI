import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, Maximize2, Heart, Music2, VolumeX, Youtube } from 'lucide-react';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleLyrics: () => void;
  showLyrics: boolean;
  onSeek: (time: number) => void;
  onSongEnd: () => void;
}

const Player: React.FC<PlayerProps> = ({ 
    currentSong, 
    isPlaying, 
    onPlayPause, 
    onNext, 
    onPrevious, 
    onToggleLyrics, 
    showLyrics,
    onSeek,
    onSongEnd
}) => {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const [playerReady, setPlayerReady] = useState(false);
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize YouTube API
  useEffect(() => {
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
            createPlayer();
        };
    } else {
        createPlayer();
    }
  }, []);

  const createPlayer = () => {
      if (playerRef.current) return;
      
      playerRef.current = new window.YT.Player('youtube-player', {
          height: '1', // 1px to avoid browser throttling (0px sometimes blocks autoplay)
          width: '1',
          playerVars: {
              'playsinline': 1,
              'controls': 0,
              'disablekb': 1,
              'fs': 0,
          },
          events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
          }
      });
  };

  const onPlayerReady = (event: any) => {
      setPlayerReady(true);
      event.target.setVolume(volume);
  };

  const onPlayerStateChange = (event: any) => {
      // 0 = Ended
      if (event.data === 0) {
          onSongEnd();
      }
  };

  // Sync Song
  useEffect(() => {
      if (currentSong?.youtubeId && playerReady && playerRef.current) {
          // Load the new video
          playerRef.current.loadVideoById(currentSong.youtubeId);
          if (isPlaying) {
              playerRef.current.playVideo();
          }
      }
  }, [currentSong?.youtubeId, playerReady]);

  // Sync Play/Pause
  useEffect(() => {
      if (playerReady && playerRef.current) {
          if (isPlaying) {
             if (playerRef.current.getPlayerState() !== 1) playerRef.current.playVideo();
          } else {
             playerRef.current.pauseVideo();
          }
      }
  }, [isPlaying, playerReady]);

  // Sync Volume
  useEffect(() => {
      if (playerReady && playerRef.current) {
          playerRef.current.setVolume(volume);
      }
  }, [volume, playerReady]);

  // Progress Loop
  useEffect(() => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      
      progressInterval.current = setInterval(() => {
          if (playerReady && playerRef.current && isPlaying) {
              const cur = playerRef.current.getCurrentTime();
              const dur = playerRef.current.getDuration();
              if (dur > 0) {
                  setCurrentTime(cur);
                  setProgress((cur / dur) * 100);
              }
          }
      }, 1000);

      return () => {
          if (progressInterval.current) clearInterval(progressInterval.current);
      }
  }, [playerReady, isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setProgress(val);
      if (playerReady && playerRef.current) {
          const dur = playerRef.current.getDuration();
          const newTime = (val / 100) * dur;
          playerRef.current.seekTo(newTime, true);
          setCurrentTime(newTime);
      }
  };

  if (!currentSong) {
      return (
        <div className="fixed bottom-6 md:left-72 left-6 right-6 h-[80px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center z-50 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500 transition-all">
           <div className="flex items-center gap-3 text-white/50">
               <Music2 className="w-5 h-5 animate-bounce" />
               <span className="text-sm font-medium">Select a track to start listening</span>
           </div>
           {/* Hidden Player Container */}
           <div id="youtube-player" className="hidden"></div>
        </div>
      );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-72 md:right-6 h-[88px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-t md:border border-white/10 md:rounded-[2rem] px-4 md:px-6 flex items-center justify-between z-50 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-500">
      
      {/* Hidden Player Container */}
      <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden">
         <div id="youtube-player"></div>
      </div>

      {/* Left: Song Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-[140px]">
        <div className="relative group hidden md:block shrink-0">
             <img 
                src={currentSong.coverUrl} 
                alt={currentSong.title} 
                className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-black/40"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black bg-red-600 flex items-center justify-center">
                <Youtube className="w-3 h-3 text-white fill-white" />
            </div>
        </div>
        
        <div className="flex flex-col justify-center min-w-0 overflow-hidden">
            <div className="text-sm font-bold text-white truncate leading-tight mb-0.5">
                {currentSong.title}
            </div>
            <div className="text-xs text-white/50 truncate font-medium">
                {currentSong.artist}
            </div>
        </div>
        
        <HeartButton />
      </div>

      {/* Center: Controls */}
      <div className="flex flex-col items-center w-full md:w-[40%] max-w-[600px]">
        <div className="flex items-center gap-4 md:gap-6 mb-2">
            <Shuffle className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors hidden md:block" />
            <SkipBack 
                className="w-5 h-5 md:w-6 md:h-6 text-white/70 hover:text-white cursor-pointer transition-colors fill-current active:scale-90" 
                onClick={onPrevious}
            />
            <button 
                className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/30 transition-all active:scale-95 group"
                onClick={onPlayPause}
            >
                {isPlaying ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                ) : (
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                )}
            </button>
            <SkipForward 
                className="w-5 h-5 md:w-6 md:h-6 text-white/70 hover:text-white cursor-pointer transition-colors fill-current active:scale-90"
                onClick={onNext}
            />
            <Repeat className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors hidden md:block" />
        </div>
        
        <div className="w-full flex items-center gap-3 text-xs text-white/40 font-medium">
             <span className="min-w-[35px] text-right">{formatTime(currentTime)}</span>
             <div className="relative flex-1 h-1.5 group rounded-full bg-white/10 overflow-hidden cursor-pointer">
                 <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100 ease-linear" 
                    style={{ width: `${progress}%` }}
                 ></div>
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={progress} 
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer range-slider z-10"
                 />
             </div>
             <span className="min-w-[35px]">{currentSong.duration}</span>
        </div>
      </div>

      {/* Right: Volume & Extra */}
      <div className="flex items-center justify-end gap-4 w-[30%] hidden md:flex">
        <div 
            className={`p-2 rounded-full transition-all cursor-pointer ${showLyrics ? 'bg-white/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            onClick={onToggleLyrics}
            title="Lyrics"
        >
            <Mic2 className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 w-24 group">
            {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-white/40" />
            ) : (
                <Volume2 className="w-4 h-4 text-white/40" />
            )}
            <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                   className="absolute inset-y-0 left-0 bg-white/60 group-hover:bg-cyan-400 rounded-full" 
                   style={{ width: `${volume}%` }}
                ></div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer range-slider"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

const HeartButton = () => {
    const [liked, setLiked] = useState(false);
    return (
        <div onClick={() => setLiked(!liked)} className="cursor-pointer ml-2 transition-transform active:scale-90 hover:scale-110">
            {liked ? (
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
            ) : (
                <Heart className="w-5 h-5 text-white/40 hover:text-white" />
            )}
        </div>
    )
}

const formatTime = (seconds: number) => {
    if(!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default Player;