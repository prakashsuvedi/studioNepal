import React from 'react';

interface NepalAiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'emblem';
  theme?: 'auto' | 'light' | 'dark';
}

export const NepalAiLogo: React.FC<NepalAiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'auto',
}) => {
  const heights = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-10',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  };

  const isExplicitLight = theme === 'light';
  const isExplicitDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2 select-none relative bg-transparent ${className}`}>
      {variant === 'full' ? (
        <svg
          viewBox="0 0 540 160"
          className={`${heights[size]} w-auto object-contain transition duration-200 filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_2px_12px_rgba(6,182,212,0.25)]`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="fullOrbBase" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#2a3b8f" />
              <stop offset="40%" stopColor="#121a52" />
              <stop offset="75%" stopColor="#070b28" />
              <stop offset="100%" stopColor="#020412" />
            </radialGradient>

            <linearGradient id="fullGoldMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe875" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            <linearGradient id="fullGoldHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="fullGoldShadow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            <linearGradient id="fullCyanSwoosh" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="30%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* White / Light Background High-Contrast Gradient for Nepal */}
            <linearGradient id="fullNepalTextLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1128" />
              <stop offset="65%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Dark Background High-Contrast Gradient for Nepal */}
            <linearGradient id="fullNepalTextDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>

            {/* AI Electric Cyan Gradient */}
            <linearGradient id="fullAiTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Studio Gold Gradient for Light/White Background */}
            <linearGradient id="fullStudioGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Studio Gold Gradient for Dark Background */}
            <linearGradient id="fullStudioGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>

          {/* EMBLEM ORB GROUP */}
          <g transform="translate(10, 10)">
            <circle cx="70" cy="70" r="64" fill="url(#fullOrbBase)" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="70" cy="70" r="63" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />

            <g opacity="0.95">
              <line x1="28" y1="52" x2="44" y2="34" stroke="#38bdf8" strokeWidth="2" />
              <line x1="44" y1="34" x2="68" y2="24" stroke="#38bdf8" strokeWidth="2" />
              <line x1="28" y1="52" x2="52" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
              <line x1="44" y1="34" x2="52" y2="50" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="28" cy="52" r="4" fill="#38bdf8" />
              <circle cx="44" cy="34" r="3.5" fill="#a5f3fc" />
              <circle cx="68" cy="24" r="5" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
              <circle cx="52" cy="50" r="3" fill="#38bdf8" />
            </g>

            {/* Mountains */}
            <polygon points="35,92 56,58 76,92" fill="url(#fullGoldShadow)" />
            <polygon points="48,94 74,42 96,94" fill="url(#fullGoldShadow)" />
            <polygon points="74,42 96,94 84,94" fill="url(#fullGoldMain)" />
            <polygon points="55,98 88,32 94,98" fill="url(#fullGoldHighlight)" />
            <polygon points="88,32 124,98 94,98" fill="url(#fullGoldMain)" />
            <polygon points="88,32 124,98 128,82 108,50" fill="url(#fullGoldShadow)" />
            <polygon points="96,98 126,56 138,98" fill="url(#fullGoldMain)" />
            <polygon points="126,56 138,98 132,98" fill="url(#fullGoldHighlight)" />

            {/* Cyan Swoosh */}
            <path d="M 10,80 C 20,128 88,142 136,90 C 104,130 36,122 18,84 Z" fill="url(#fullCyanSwoosh)" />
            <path d="M 22,92 C 45,124 94,124 126,94 C 100,118 48,118 28,94 Z" fill="#7dd3fc" opacity="0.6" />
          </g>

          {/* TYPOGRAPHY GROUP (100% visible on both white & dark backgrounds) */}
          <g transform="translate(155, 15)">
            {/* Nepal: High-contrast midnight navy in light mode (white bg), crisp ice-white in dark mode */}
            <text
              x="0"
              y="68"
              fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
              fontWeight="900"
              fontSize="64"
              letterSpacing="-1.5"
              className={
                isExplicitLight
                  ? 'fill-[url(#fullNepalTextLight)]'
                  : isExplicitDark
                  ? 'fill-[url(#fullNepalTextDark)]'
                  : 'fill-[url(#fullNepalTextLight)] dark:fill-[url(#fullNepalTextDark)]'
              }
            >
              Nepal
            </text>

            {/* AI: Vibrant Electric Cyan */}
            <text
              x="185"
              y="68"
              fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
              fontWeight="900"
              fontSize="64"
              letterSpacing="-1"
              fill="url(#fullAiTextGrad)"
            >
              AI
            </text>

            {/* studio: Rich amber bronze in light mode (white bg), metallic gold in dark mode */}
            <text
              x="125"
              y="114"
              fontFamily="System-UI, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
              fontWeight="700"
              fontSize="40"
              letterSpacing="0"
              className={
                isExplicitLight
                  ? 'fill-[url(#fullStudioGradLight)]'
                  : isExplicitDark
                  ? 'fill-[url(#fullStudioGradDark)]'
                  : 'fill-[url(#fullStudioGradLight)] dark:fill-[url(#fullStudioGradDark)]'
              }
            >
              studio
            </text>
          </g>
        </svg>
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
