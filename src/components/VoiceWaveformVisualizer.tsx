import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Sparkles, Clock, Sliders, Scissors, Layers, Check } from 'lucide-react';

interface VoiceWaveformVisualizerProps {
  audioTitle?: string;
  duration?: number; // duration in seconds
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  sceneMarkers?: { title: string; time: number; duration: number }[];
}

export const VoiceWaveformVisualizer: React.FC<VoiceWaveformVisualizerProps> = ({
  audioTitle = 'Nepali Neural TTS Track',
  duration = 12,
  isPlaying = false,
  onPlayToggle,
  sceneMarkers = [
    { title: 'Scene 1: Kathmandu Valley', time: 0, duration: 4 },
    { title: 'Scene 2: Himalayan Peaks', time: 4, duration: 4.5 },
    { title: 'Scene 3: Pokhara Sunrise', time: 8.5, duration: 3.5 },
  ],
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedCueTime, setSelectedCueTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate deterministic waveform peaks
  const numBars = Math.floor(64 * zoomLevel);
  const peaks = useRef<number[]>([]);
  if (peaks.current.length !== numBars) {
    peaks.current = Array.from({ length: numBars }, (_, i) => {
      const base = Math.sin(i * 0.25) * 0.4 + 0.5;
      const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.2;
      return Math.min(1, Math.max(0.15, base + noise));
    });
  }

  // Animation loop when playing
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newTime = (clickX / rect.width) * duration;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins < 10 ? '0' : ''}${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Volume2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">{audioTitle}</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
              {duration.toFixed(1)}s Duration
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audio waveform visualizer for timing scene transitions in Video Studio
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-medium px-1">Zoom:</span>
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                zoomLevel === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => setZoomLevel(1.5)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                zoomLevel === 1.5 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              1.5x
            </button>
            <button
              onClick={() => setZoomLevel(2)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                zoomLevel === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2x
            </button>
          </div>

          <button
            onClick={onPlayToggle}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
          </button>
        </div>
      </div>

      {/* Main Waveform Canvas Stage */}
      <div className="space-y-1">
        {/* Time ruler */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
          <span>00:00.0</span>
          <span>{formatTime(duration * 0.25)}</span>
          <span>{formatTime(duration * 0.5)}</span>
          <span>{formatTime(duration * 0.75)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Interactive Scrubbable Waveform Container */}
        <div
          ref={containerRef}
          onClick={handleScrub}
          className="relative h-28 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer group shadow-inner flex items-center px-2 select-none"
        >
          {/* Grid line accents */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-20">
            <div className="border-r border-slate-700 h-full"></div>
            <div className="border-r border-slate-700 h-full"></div>
            <div className="border-r border-slate-700 h-full"></div>
            <div></div>
          </div>

          {/* Waveform Amplitude Bars */}
          <div className="flex items-center justify-between w-full h-full gap-0.5 z-10 py-3">
            {peaks.current.map((peak, idx) => {
              const barTime = (idx / numBars) * duration;
              const isPlayed = barTime <= currentTime;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col justify-center items-center h-full"
                >
                  <div
                    className={`w-full rounded-full transition-all duration-75 ${
                      isPlayed
                        ? 'bg-gradient-to-t from-rose-500 to-indigo-400 shadow-sm'
                        : 'bg-slate-700 group-hover:bg-slate-600'
                    }`}
                    style={{
                      height: `${peak * 100}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Scene Transition Markers Overlay */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {sceneMarkers.map((marker, mIdx) => {
              const leftPercent = (marker.time / duration) * 100;
              const widthPercent = (marker.duration / duration) * 100;

              return (
                <div
                  key={mIdx}
                  className="absolute top-0 bottom-0 border-l border-dashed border-amber-400/80 bg-amber-500/10 flex flex-col justify-between p-1"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  <span className="text-[9px] font-bold text-amber-300 bg-black/80 px-1 py-0.2 rounded border border-amber-400/40 w-max truncate max-w-full">
                    🎬 {marker.title}
                  </span>
                  <span className="text-[8px] font-mono text-amber-200 bg-black/60 px-1 rounded w-max">
                    {marker.time.toFixed(1)}s → {(marker.time + marker.duration).toFixed(1)}s
                  </span>
                </div>
              );
            })}
          </div>

          {/* Playhead Vertical Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 shadow-[0_0_8px_rgba(244,63,94,0.8)] pointer-events-none transition-all duration-75"
            style={{
              left: `${(currentTime / duration) * 100}%`,
            }}
          >
            <div className="w-3 h-3 bg-rose-500 rounded-full -ml-1.25 -mt-1 shadow-md border border-white"></div>
          </div>
        </div>
      </div>

      {/* Scrub Time readout & transition alignment stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>Playhead Position:</span>
            <strong className="text-white font-bold">{formatTime(currentTime)}</strong>
            <span className="text-slate-500">/ {formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Target Transition Sync:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Aligned with Video Studio (3 Scenes)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
