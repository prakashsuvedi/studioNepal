import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, Volume2, Clock, Check, Scissors } from 'lucide-react';

interface VoiceWaveformVisualizerProps {
  audioTitle?: string;
  duration?: number; // duration in seconds
  currentTime?: number; // parent-synced playback time
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  onSeek?: (newTime: number) => void;
  audioUrl?: string | null;
  sceneMarkers?: { title: string; time: number; duration: number }[];
  scriptText?: string;
}

// In-memory global peak cache across renders
const audioPeakCache = new Map<string, number[]>();

export const VoiceWaveformVisualizer: React.FC<VoiceWaveformVisualizerProps> = ({
  audioTitle = 'Nepali Neural TTS Track',
  duration = 12,
  currentTime: parentCurrentTime,
  isPlaying = false,
  onPlayToggle,
  onSeek,
  audioUrl = null,
  sceneMarkers = [
    { title: 'Scene 1: Kathmandu Valley', time: 0, duration: 4 },
    { title: 'Scene 2: Himalayan Peaks', time: 4, duration: 4.5 },
    { title: 'Scene 3: Pokhara Sunrise', time: 8.5, duration: 3.5 },
  ],
  scriptText = '',
}) => {
  const [internalTime, setInternalTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [decodedPeaks, setDecodedPeaks] = useState<number[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveDuration = Math.max(1, duration || 12);
  const effectiveCurrentTime = typeof parentCurrentTime === 'number' && !isNaN(parentCurrentTime)
    ? Math.min(effectiveDuration, Math.max(0, parentCurrentTime))
    : internalTime;

  const numBars = Math.floor(72 * zoomLevel);

  // Decode real audio peaks via Web Audio API whenever audioUrl changes
  useEffect(() => {
    if (!audioUrl || typeof window === 'undefined') {
      setDecodedPeaks(null);
      return;
    }

    const cacheKey = `${audioUrl}_${numBars}`;
    if (audioPeakCache.has(cacheKey)) {
      setDecodedPeaks(audioPeakCache.get(cacheKey) || null);
      return;
    }

    let isCancelled = false;

    async function extractPeaks() {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const res = await fetch(audioUrl!);
        if (!res.ok) return;
        const arrayBuf = await res.arrayBuffer();

        const ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuf);
        if (isCancelled) {
          ctx.close();
          return;
        }

        const channelData = audioBuffer.getChannelData(0);
        const totalSamples = channelData.length;
        const blockSize = Math.floor(totalSamples / numBars);
        const peaks: number[] = [];

        for (let i = 0; i < numBars; i++) {
          const start = i * blockSize;
          let sum = 0;
          const count = Math.min(blockSize, totalSamples - start);
          if (count <= 0) {
            peaks.push(0.15);
            continue;
          }
          for (let j = 0; j < count; j += 4) {
            const val = channelData[start + j];
            sum += val * val;
          }
          const rms = Math.sqrt(sum / (count / 4));
          // Normalize to [0.15, 0.95]
          const scaled = Math.min(0.95, Math.max(0.15, rms * 3.5));
          peaks.push(scaled);
        }

        audioPeakCache.set(cacheKey, peaks);
        if (!isCancelled) {
          setDecodedPeaks(peaks);
        }
        ctx.close();
      } catch (err) {
        // Graceful fallback to synthetic tokenized wave
        if (!isCancelled) setDecodedPeaks(null);
      }
    }

    extractPeaks();

    return () => {
      isCancelled = true;
    };
  }, [audioUrl, numBars]);

  // Synthetic script-informed waveform fallback
  const syntheticPeaks = useMemo(() => {
    if (!scriptText) {
      return Array.from({ length: numBars }, (_, i) => {
        const base = Math.sin(i * 0.25) * 0.4 + 0.5;
        const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.2;
        return Math.min(0.95, Math.max(0.18, base + noise));
      });
    }

    // Tokenize scriptText into speech and pause segments
    const tokens: { type: 'text' | 'pause'; durationWeight: number }[] = [];
    const regex = /\[Pause:\s*([0-9\.]+(s|ms))\]/gi;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(scriptText)) !== null) {
      const textSegment = scriptText.substring(lastIndex, match.index);
      if (textSegment.trim()) {
        tokens.push({ type: 'text', durationWeight: Math.max(1, textSegment.length) });
      }
      const pauseDurationStr = match[1].toLowerCase();
      let seconds = 1.0;
      if (pauseDurationStr.endsWith('ms')) {
        seconds = parseFloat(pauseDurationStr) / 1000;
      } else if (pauseDurationStr.endsWith('s')) {
        seconds = parseFloat(pauseDurationStr);
      }
      tokens.push({ type: 'pause', durationWeight: seconds * 14 });
      lastIndex = regex.lastIndex;
    }

    const remainingText = scriptText.substring(lastIndex);
    if (remainingText.trim()) {
      tokens.push({ type: 'text', durationWeight: Math.max(1, remainingText.length) });
    }

    const totalWeight = tokens.reduce((sum, t) => sum + t.durationWeight, 0);
    const bars: number[] = [];

    if (totalWeight === 0) {
      return Array.from({ length: numBars }, () => 0.2);
    }

    tokens.forEach((token) => {
      const share = Math.round((token.durationWeight / totalWeight) * numBars);
      for (let k = 0; k < share; k++) {
        if (token.type === 'pause') {
          bars.push(0.06); // silence valley
        } else {
          const idx = bars.length;
          const base = Math.sin(idx * 0.45) * 0.35 + 0.55;
          const noise = (Math.sin(idx * 2.2) + Math.cos(idx * 1.1)) * 0.15;
          bars.push(Math.min(0.95, Math.max(0.2, base + noise)));
        }
      }
    });

    while (bars.length < numBars) {
      bars.push(0.2);
    }
    return bars.slice(0, numBars);
  }, [scriptText, numBars]);

  const activePeaks = decodedPeaks || syntheticPeaks;

  // Internal animation loop only if parent does not control playback time
  useEffect(() => {
    if (typeof parentCurrentTime === 'number') return;
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setInternalTime((prev) => {
          if (prev >= effectiveDuration) return 0;
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, effectiveDuration, parentCurrentTime]);

  const calculateTimeFromEvent = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      return (clickX / rect.width) * effectiveDuration;
    },
    [effectiveDuration]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const newTime = calculateTimeFromEvent(e.clientX);
    if (onSeek) {
      onSeek(newTime);
    } else {
      setInternalTime(newTime);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverX(relX);
    setHoverTime((relX / rect.width) * effectiveDuration);

    if (isDragging) {
      const newTime = calculateTimeFromEvent(e.clientX);
      if (onSeek) {
        onSeek(newTime);
      } else {
        setInternalTime(newTime);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverTime(null);
      setHoverX(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    const sInt = Math.floor(seconds % 60);
    const sDec = Math.floor((seconds % 1) * 10);
    return `${mins < 10 ? '0' : ''}${mins}:${sInt < 10 ? '0' : ''}${sInt}.${sDec}`;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white space-y-4 shadow-xl select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25">
              <Volume2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white tracking-wide">{audioTitle}</h3>
            <span className="text-[11px] font-mono text-slate-400">
              {effectiveDuration.toFixed(1)}s
            </span>
            {decodedPeaks ? (
              <span className="text-[9.5px] font-medium text-emerald-400 flex items-center gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Decoded PCM</span>
              </span>
            ) : (
              <span className="text-[9.5px] font-medium text-indigo-300">
                Prosodic Map
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Interactive speech waveform playhead. Click or drag anywhere along the track to seek.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-medium mr-1">Zoom:</span>
            {([1, 1.5, 2] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomLevel(z)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition ${
                  zoomLevel === z ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {z}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onPlayToggle}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
          </button>
        </div>
      </div>

      {/* Main Waveform Canvas Stage */}
      <div className="space-y-1.5">
        {/* Time ruler */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
          <span>00:00.0</span>
          <span>{formatTime(effectiveDuration * 0.25)}</span>
          <span>{formatTime(effectiveDuration * 0.5)}</span>
          <span>{formatTime(effectiveDuration * 0.75)}</span>
          <span>{formatTime(effectiveDuration)}</span>
        </div>

        {/* Interactive Scrubbable Waveform Container */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="relative h-28 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden cursor-crosshair group shadow-inner flex items-center px-2 select-none touch-none"
        >
          {/* Subtle Grid line accents */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-15">
            <div className="border-r border-slate-600 h-full"></div>
            <div className="border-r border-slate-600 h-full"></div>
            <div className="border-r border-slate-600 h-full"></div>
            <div></div>
          </div>

          {/* Waveform Amplitude Bars */}
          <div className="flex items-center justify-between w-full h-full gap-0.5 z-10 py-3 pointer-events-none">
            {activePeaks.map((peak, idx) => {
              const barTime = (idx / numBars) * effectiveDuration;
              const isPlayed = barTime <= effectiveCurrentTime;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col justify-center items-center h-full"
                >
                  <div
                    className={`w-full rounded-full transition-all duration-75 ${
                      isPlayed
                        ? 'bg-gradient-to-t from-rose-500 via-amber-400 to-rose-300 shadow-[0_0_4px_rgba(244,63,94,0.4)]'
                        : 'bg-slate-700/80 group-hover:bg-slate-600/90'
                    }`}
                    style={{
                      height: `${Math.max(8, peak * 100)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Scene Transition Markers Overlay */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {sceneMarkers.map((marker, mIdx) => {
              const leftPercent = (marker.time / effectiveDuration) * 100;
              const widthPercent = (marker.duration / effectiveDuration) * 100;

              return (
                <div
                  key={mIdx}
                  className="absolute top-0 bottom-0 border-l border-dashed border-amber-400/50 bg-amber-500/5 flex flex-col justify-between p-1"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  <span className="text-[8.5px] font-semibold text-amber-300 bg-slate-950/90 px-1 py-0.2 rounded border border-amber-400/30 w-max truncate max-w-full">
                    {marker.title}
                  </span>
                  <span className="text-[7.5px] font-mono text-amber-200/80 bg-slate-950/70 px-1 rounded w-max">
                    {marker.time.toFixed(1)}s → {(marker.time + marker.duration).toFixed(1)}s
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hover Scrub Bubble & Guideline */}
          {hoverTime !== null && hoverX !== null && !isDragging && (
            <div
              className="absolute top-0 bottom-0 w-px bg-indigo-400/70 pointer-events-none z-25"
              style={{ left: `${hoverX}px` }}
            >
              <div className="absolute -top-1 -translate-x-1/2 px-1.5 py-0.5 rounded bg-indigo-600 text-[9px] font-mono font-bold text-white shadow-md">
                {formatTime(hoverTime)}
              </div>
            </div>
          )}

          {/* Playhead Vertical Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 shadow-[0_0_10px_rgba(244,63,94,0.9)] pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.min(100, Math.max(0, (effectiveCurrentTime / effectiveDuration) * 100))}%`,
            }}
          >
            <div className="w-3 h-3 bg-rose-500 rounded-full -ml-1.25 -mt-1 shadow-md border-2 border-white"></div>
          </div>
        </div>
      </div>

      {/* Scrub Time readout & transition alignment stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <Clock className="w-4 h-4 text-rose-400" />
            <span className="text-slate-400 text-[11px]">Playhead:</span>
            <strong className="text-white font-bold">{formatTime(effectiveCurrentTime)}</strong>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>Click/drag waveform to scrub instantly</span>
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Timeline Synced</span>
          </span>
        </div>
      </div>
    </div>
  );
};
