import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, Maximize2, Heart, Music2, VolumeX } from 'lucide-react';
import { Song } from '../types';
import { setVolume as spotifySetVolume } from '../services/spotifyService';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleLyrics: () => void;
  showLyrics: boolean;
  isSpotifyActive: boolean;
  externalProgress?: number;
  onSeek?: (val: number) => void;
  spotifyToken?: string | null;
}

const Player: React.FC<PlayerProps> = ({ 
    currentSong, 
    isPlaying, 
    onPlayPause, 
    onNext, 
    onPrevious, 
    onToggleLyrics, 
    showLyrics,
    isSpotifyActive,
    externalProgress,
    onSeek,
    spotifyToken
}) => {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Debounce for volume slider to avoid spamming Spotify API
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- HTML5 Audio Logic ---
  useEffect(() => {
    if (isSpotifyActive) {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        return;
    }

    if (currentSong && !currentSong.uri) {
        if (!audioRef.current) {
            audioRef.current = new Audio(currentSong.audioUrl);
            audioRef.current.volume = volume;
        } else {
            if (audioRef.current.src !== currentSong.audioUrl) {
                audioRef.current.src = currentSong.audioUrl || '';
                audioRef.current.play().catch(e => console.warn("Autoplay prevented", e));
            }
        }
    }
  }, [currentSong, isSpotifyActive]);

  useEffect(() => {
      if (!isSpotifyActive && audioRef.current) {
          if (isPlaying) audioRef.current.play().catch(e => console.error(e));
          else audioRef.current.pause();
      }
  }, [isPlaying, isSpotifyActive]);

  useEffect(() => {
    if(!isSpotifyActive && audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume, isSpotifyActive]);

  const handleVolumeChange = (val: number) => {
      setVolume(val);
      
      if (isSpotifyActive && spotifyToken) {
          if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
          volumeTimeoutRef.current = setTimeout(() => {
              spotifySetVolume(spotifyToken, val);
          }, 300);
      }
  };

  // --- Progress Logic ---
  useEffect(() => {
    if (isSpotifyActive) {
        if (currentSong && currentSong.durationSec) {
            const pct = ((externalProgress || 0) / 1000 / currentSong.durationSec) * 100;
            setProgress(Math.min(pct || 0, 100));
        }
        return;
    }

    const interval = setInterval(() => {
        if (audioRef.current && !audioRef.current.paused) {
            const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(pct || 0);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSpotifyActive, externalProgress, currentSong]);

  // --- Visualizer (Blue/Cyan Theme) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 16;
    const bars = new Array(barCount).fill(0);
    const targets = new Array(barCount).fill(0);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#22d3ee'); // Cyan-400
      gradient.addColorStop(1, '#8b5cf6'); // Violet-500

      const barWidth = 3;
      const gap = 2;
      const totalWidth = (barCount * barWidth) + ((barCount - 1) * gap);
      const startX = width - totalWidth; // Align right

      bars.forEach((currentHeight, i) => {
        if (isPlaying) {
           if (Math.abs(targets[i] - currentHeight) < 1) {
               targets[i] = Math.random() * height * 0.8 + (height * 0.1);
           }
        } else {
           targets[i] = 2; 
        }
        const speed = isPlaying ? 0.15 : 0.1; 
        bars[i] += (targets[i] - bars[i]) * speed;

        const x = startX + i * (barWidth + gap);
        const y = height - bars[i];
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, bars[i], 2);
        ctx.fill();
      });
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setProgress(val);
      if (isSpotifyActive && onSeek && currentSong) {
          const ms = (val / 100) * (currentSong.durationSec * 1000);
          onSeek(ms);
      } else if (audioRef.current) {
          const time = (val / 100) * audioRef.current.duration;
          audioRef.current.currentTime = time;
      }
  };

  if (!currentSong) {
      return (
        <div className="fixed bottom-6 md:left-72 left-6 right-6 h-[80px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center z-50 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500 transition-all">
           <div className="flex items-center gap-3 text-white/50">
               <Music2 className="w-5 h-5 animate-bounce" />
               <span className="text-sm font-medium">Select a track to start listening</span>
           </div>
        </div>
      );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-72 md:right-6 h-[88px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-t md:border border-white/10 md:rounded-[2rem] px-4 md:px-6 flex items-center justify-between z-50 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-500">
      
      {/* Left: Song Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-[140px]">
        <div className="relative group hidden md:block">
             <img 
                src={currentSong.coverUrl} 
                alt={currentSong.title} 
                className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-black/40"
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${isSpotifyActive ? 'bg-green-500' : 'bg-cyan-500'}`}>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
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
             <span className="min-w-[35px] text-right">{isSpotifyActive ? formatTime(externalProgress! / 1000) : (audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00")}</span>
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
        <canvas ref={canvasRef} width={80} height={24} className="opacity-60 mr-2 hidden xl:block" />
        
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
                   style={{ width: `${volume * 100}%` }}
                ></div>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
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