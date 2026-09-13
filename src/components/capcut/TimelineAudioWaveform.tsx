import React, { useMemo } from 'react';

interface TimelineAudioWaveformProps {
  trackId: string;
  type: 'voiceover' | 'bgm' | 'sfx';
  duration: number; // in seconds
  pixelsPerSecond: number;
  isMuted?: boolean;
  volume?: number; // 0 - 100
  isPlaying?: boolean;
  currentTime?: number;
  height?: number;
}

export const TimelineAudioWaveform: React.FC<TimelineAudioWaveformProps> = ({
  trackId,
  type,
  duration,
  pixelsPerSecond,
  isMuted = false,
  volume = 100,
  isPlaying = false,
  currentTime = 0,
  height = 18,
}) => {
  const totalWidth = Math.max(120, duration * pixelsPerSecond);

  // Generate deterministic but realistic waveform peaks based on trackId & track type
  const bars = useMemo(() => {
    const barWidth = 3; // px per bar segment
    const totalBars = Math.floor(totalWidth / barWidth);
    if (totalBars <= 0) return [];

    // Simple pseudo-random generator seeded with trackId
    let seed = 0;
    for (let i = 0; i < trackId.length; i++) {
      seed = (seed << 5) - seed + trackId.charCodeAt(i);
      seed |= 0;
    }

    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const result: { amplitude: number; isSilence: boolean }[] = [];
    
    // Voiceover has speech bursts and natural sentence pauses (silence)
    // BGM has steady rhythmic envelope with drum beats and drops
    for (let i = 0; i < totalBars; i++) {
      const progress = i / totalBars;
      let amp = 0.2;
      let isSilence = false;

      if (type === 'voiceover') {
        // Human speech cadence: 3-5s sentence bursts followed by 0.5s pause
        const cycle = (progress * (duration || 10)) % 4.0;
        if (cycle > 3.4) {
          // Micro-pause / breath
          amp = 0.05 + pseudoRandom() * 0.08;
          isSilence = true;
        } else {
          // Dynamic formant speech amplitude
          const baseEnergy = 0.35 + Math.sin(i * 0.25) * 0.25;
          const noise = pseudoRandom() * 0.45;
          amp = Math.min(1.0, Math.max(0.12, baseEnergy + noise));
        }
      } else {
        // Music: 4/4 beat pulsing with bass drops
        const beat = (i % 8 === 0) ? 0.9 : (i % 4 === 0) ? 0.7 : 0.4;
        const melody = Math.sin(i * 0.15) * 0.2;
        amp = Math.min(1.0, Math.max(0.15, beat * 0.6 + melody + pseudoRandom() * 0.25));
      }

      // Scale by volume factor (volume is 0-100)
      const volFactor = isMuted ? 0 : Math.min(1.5, (volume / 100));
      result.push({
        amplitude: amp * volFactor,
        isSilence
      });
    }

    return result;
  }, [trackId, type, duration, totalWidth, isMuted, volume]);

  const primaryColor = type === 'voiceover' 
    ? (isMuted ? '#64748b' : '#34d399') 
    : (isMuted ? '#64748b' : '#c084fc');

  const silenceColor = isMuted ? '#334155' : '#475569';

  return (
    <div 
      className="h-full flex items-center overflow-hidden pointer-events-none select-none relative opacity-85"
      style={{ width: `${totalWidth}px` }}
    >
      <svg 
        width={totalWidth} 
        height={height} 
        className="block"
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = idx * 3;
          const barH = Math.max(2, bar.amplitude * (height - 2));
          const y = (height - barH) / 2;
          const isPassed = currentTime * pixelsPerSecond > x;
          const fill = isMuted
            ? '#475569'
            : bar.isSilence
              ? silenceColor
              : isPassed
                ? (type === 'voiceover' ? '#10b981' : '#a855f7')
                : primaryColor;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={2}
              height={barH}
              rx={1}
              fill={fill}
              className={isPlaying && !isMuted ? 'transition-all duration-75' : ''}
              opacity={bar.isSilence ? 0.35 : isPassed ? 1 : 0.75}
            />
          );
        })}
      </svg>
    </div>
  );
};
