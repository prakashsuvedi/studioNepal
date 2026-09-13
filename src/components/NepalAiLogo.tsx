import React from 'react';

interface NepalAiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'emblem';
}

export const NepalAiLogo: React.FC<NepalAiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const heights = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-10',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none relative bg-transparent ${className}`}>
      {variant === 'full' ? (
        <img
          src="/nepalai_logo.svg"
          alt="NepalAI Studio Logo"
          className={`${heights[size]} w-auto object-contain transition duration-200 drop-shadow-[0_2px_12px_rgba(6,182,212,0.25)]`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <svg
          viewBox="0 0 140 140"
          className={`${heights[size]} w-auto object-contain filter drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="emblemOrb" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#2a3b8f"/>
              <stop offset="40%" stopColor="#121a52"/>
              <stop offset="75%" stopColor="#070b28"/>
              <stop offset="100%" stopColor="#020412"/>
            </radialGradient>
            <linearGradient id="emblemGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe875"/>
              <stop offset="35%" stopColor="#f59e0b"/>
              <stop offset="70%" stopColor="#d97706"/>
              <stop offset="100%" stopColor="#92400e"/>
            </linearGradient>
            <linearGradient id="emblemGoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="25%" stopColor="#fef08a"/>
              <stop offset="70%" stopColor="#fbbf24"/>
              <stop offset="100%" stopColor="#b45309"/>
            </linearGradient>
            <linearGradient id="emblemCyan" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369a1"/>
              <stop offset="30%" stopColor="#0284c7"/>
              <stop offset="70%" stopColor="#06b6d4"/>
              <stop offset="100%" stopColor="#38bdf8"/>
            </linearGradient>
          </defs>

          {/* Sphere Base */}
          <circle cx="70" cy="70" r="64" fill="url(#emblemOrb)" stroke="#2563eb" strokeWidth="2.5" />
          
          {/* AI Constellation Network Nodes */}
          <g opacity="0.95">
            <line x1="28" y1="52" x2="44" y2="34" stroke="#38bdf8" strokeWidth="2.5"/>
            <line x1="44" y1="34" x2="68" y2="24" stroke="#38bdf8" strokeWidth="2.5"/>
            <line x1="28" y1="52" x2="52" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2"/>
            <circle cx="28" cy="52" r="4" fill="#38bdf8" />
            <circle cx="44" cy="34" r="3.5" fill="#a5f3fc" />
            <circle cx="68" cy="24" r="5" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
            <circle cx="52" cy="50" r="3" fill="#38bdf8" />
          </g>

          {/* Golden Mountain Facets */}
          <polygon points="35,92 56,58 76,92" fill="#78350f" />
          <polygon points="48,94 74,42 96,94" fill="url(#emblemGold)" />
          <polygon points="55,98 88,32 94,98" fill="url(#emblemGoldLight)" />
          <polygon points="88,32 124,98 94,98" fill="url(#emblemGold)" />
          <polygon points="96,98 126,56 138,98" fill="url(#emblemGold)" />

          {/* Curved Cyan Swoosh */}
          <path d="M 10,80 C 20,128 88,142 136,90 C 104,130 36,122 18,84 Z" fill="url(#emblemCyan)" />
        </svg>
      )}
    </div>
  );
};
