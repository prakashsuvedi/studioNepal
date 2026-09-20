import fs from 'fs';
import path from 'path';
import { execFile, execSync } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

/**
 * Automatically ensures all sample MP4 videos, MP3 audio files,
 * stock avatar presenters, studio backgrounds, and watermark assets
 * exist on disk in /public and /dist with high-resolution broadcast visuals.
 */
export async function ensureSampleMediaFiles(): Promise<void> {
  const publicSamplesDir = path.join(process.cwd(), 'public', 'samples');
  const distSamplesDir = path.join(process.cwd(), 'dist', 'samples');
  const publicAudioDir = path.join(process.cwd(), 'public', 'audio');
  const distAudioDir = path.join(process.cwd(), 'dist', 'audio');
  const publicAssetsDir = path.join(process.cwd(), 'public', 'assets');
  const distAssetsDir = path.join(process.cwd(), 'dist', 'assets');
  const publicAvatarsDir = path.join(publicAssetsDir, 'avatars');
  const distAvatarsDir = path.join(distAssetsDir, 'avatars');
  const publicBackgroundsDir = path.join(publicAssetsDir, 'backgrounds');
  const distBackgroundsDir = path.join(distAssetsDir, 'backgrounds');
  const cacheDir = path.join(process.cwd(), 'public', 'samples', '.cache');

  [
    publicSamplesDir,
    distSamplesDir,
    publicAudioDir,
    distAudioDir,
    publicAssetsDir,
    distAssetsDir,
    publicAvatarsDir,
    distAvatarsDir,
    publicBackgroundsDir,
    distBackgroundsDir,
    cacheDir,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // 1. Stock Presenter Avatars
  const avatarList = [
    {
      filename: 'aarav_newsroom.jpg',
      aliases: ['aarav.jpg'],
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
      title: 'Aarav Sharma',
      role: 'National News Anchor',
      bgColor: '#1e293b',
      accentColor: '#38bdf8',
    },
    {
      filename: 'hemkala_newsroom.jpg',
      aliases: ['hemkala.jpg'],
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
      title: 'Hemkala Thapa',
      role: 'Senior News Presenter',
      bgColor: '#1e1b4b',
      accentColor: '#f43f5e',
    },
    {
      filename: 'sagar.jpg',
      aliases: [],
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
      title: 'Sagar KC',
      role: 'Tech & Morning Host',
      bgColor: '#0f172a',
      accentColor: '#2dd4bf',
    },
    {
      filename: 'maya.jpg',
      aliases: [],
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
      title: 'Maya Gurung',
      role: 'Cultural Ambassador',
      bgColor: '#451a03',
      accentColor: '#fbbf24',
    },
    {
      filename: 'rajesh.jpg',
      aliases: [],
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop',
      title: 'Rajesh Shrestha',
      role: 'Commercial Spokesperson',
      bgColor: '#111827',
      accentColor: '#60a5fa',
    },
  ];

  for (const avt of avatarList) {
    const pubFile = path.join(publicAvatarsDir, avt.filename);
    const distFile = path.join(distAvatarsDir, avt.filename);

    if (!fs.existsSync(pubFile) || fs.statSync(pubFile).size < 1000) {
      let saved = false;
      try {
        const res = await fetch(avt.imageUrl, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const compressed = await sharp(buf).resize(800, 800, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
          fs.writeFileSync(pubFile, compressed);
          saved = true;
          console.log(`[SampleMedia] Downloaded stock avatar: ${avt.filename}`);
        }
      } catch (e) {
        console.warn(`[SampleMedia] Unsplash fetch fallback for ${avt.filename}:`, e);
      }

      if (!saved) {
        // High quality sharp SVG fallback
        const svg = `
          <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${avt.bgColor}" />
                <stop offset="100%" stop-color="#020617" />
              </linearGradient>
              <linearGradient id="head" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${avt.accentColor}" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.7" />
              </linearGradient>
            </defs>
            <rect width="800" height="800" fill="url(#bg)"/>
            <circle cx="400" cy="320" r="160" fill="url(#head)"/>
            <path d="M 200 750 C 200 520, 600 520, 600 750 Z" fill="${avt.accentColor}" opacity="0.65"/>
            <rect x="100" y="660" width="600" height="100" rx="16" fill="#0f172a" opacity="0.9"/>
            <text x="400" y="710" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">${avt.title}</text>
            <text x="400" y="745" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="${avt.accentColor}" text-anchor="middle">${avt.role}</text>
          </svg>
        `;
        const generated = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
        fs.writeFileSync(pubFile, generated);
        console.log(`[SampleMedia] Generated vector portrait fallback: ${avt.filename}`);
      }
    }

    if (fs.existsSync(pubFile)) {
      if (fs.existsSync(distAvatarsDir)) {
        try { fs.copyFileSync(pubFile, distFile); } catch {}
      }
      for (const alias of avt.aliases) {
        const aliasPub = path.join(publicAvatarsDir, alias);
        const aliasDist = path.join(distAvatarsDir, alias);
        try {
          fs.copyFileSync(pubFile, aliasPub);
          if (fs.existsSync(distAvatarsDir)) fs.copyFileSync(pubFile, aliasDist);
        } catch {}
      }
    }
  }

  // 2. Studio Backgrounds
  const backgroundList = [
    {
      filename: 'newsroom.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1920&auto=format&fit=crop',
      title: 'Broadcast Newsroom',
      color: '#091e42',
    },
    {
      filename: 'office.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1920&auto=format&fit=crop',
      title: 'Corporate Office',
      color: '#1e293b',
    },
    {
      filename: 'podcast.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1920&auto=format&fit=crop',
      title: 'Podcast Studio',
      color: '#291804',
    },
    {
      filename: 'kathmandu.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1920&auto=format&fit=crop',
      title: 'Kathmandu Valley',
      color: '#042f2e',
    },
  ];

  for (const bg of backgroundList) {
    const pubBg = path.join(publicBackgroundsDir, bg.filename);
    const distBg = path.join(distBackgroundsDir, bg.filename);

    if (!fs.existsSync(pubBg) || fs.statSync(pubBg).size < 1000) {
      let saved = false;
      try {
        const res = await fetch(bg.imageUrl, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const compressed = await sharp(buf).resize(1920, 1080, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
          fs.writeFileSync(pubBg, compressed);
          saved = true;
          console.log(`[SampleMedia] Downloaded background: ${bg.filename}`);
        }
      } catch (e) {
        console.warn(`[SampleMedia] Background fetch fallback for ${bg.filename}:`, e);
      }

      if (!saved) {
        const svg = `
          <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${bg.color}" />
                <stop offset="100%" stop-color="#020617" />
              </linearGradient>
            </defs>
            <rect width="1920" height="1080" fill="url(#bgGrad)"/>
            <circle cx="960" cy="540" r="400" fill="#38bdf8" opacity="0.08"/>
            <text x="960" y="550" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" opacity="0.3" text-anchor="middle">${bg.title}</text>
          </svg>
        `;
        const generated = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
        fs.writeFileSync(pubBg, generated);
      }
    }

    if (fs.existsSync(pubBg) && fs.existsSync(distBackgroundsDir)) {
      try { fs.copyFileSync(pubBg, distBg); } catch {}
    }
  }

  // Green screen asset
  const greenScreenPub = path.join(publicBackgroundsDir, 'green_screen.png');
  const greenScreenDist = path.join(distBackgroundsDir, 'green_screen.png');
  if (!fs.existsSync(greenScreenPub)) {
    const greenBuf = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 },
      },
    }).png().toBuffer();
    fs.writeFileSync(greenScreenPub, greenBuf);
    if (fs.existsSync(distBackgroundsDir)) {
      try { fs.copyFileSync(greenScreenPub, greenScreenDist); } catch {}
    }
  }

  // Watermark PNG
  const watermarkPub = path.join(publicAssetsDir, 'nepalai_watermark.png');
  const watermarkDist = path.join(distAssetsDir, 'nepalai_watermark.png');
  if (!fs.existsSync(watermarkPub)) {
    const watermarkSvg = `
      <svg width="320" height="80" viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="80" rx="12" fill="#020617" opacity="0.75"/>
        <circle cx="40" cy="40" r="16" fill="#14b8a6"/>
        <text x="75" y="48" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">NepalAI Studio</text>
      </svg>
    `;
    const wmBuf = await sharp(Buffer.from(watermarkSvg)).png().toBuffer();
    fs.writeFileSync(watermarkPub, wmBuf);
    if (fs.existsSync(distAssetsDir)) {
      try { fs.copyFileSync(watermarkPub, watermarkDist); } catch {}
    }
  }

  // Dual Anchor Studio Posters
  const posters = [
    {
      filename: 'dual_anchor_studio_poster.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1280&auto=format&fit=crop',
    },
    {
      filename: 'dual_anchor_primetime_poster.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1280&auto=format&fit=crop',
    },
  ];

  for (const p of posters) {
    const pPub = path.join(publicSamplesDir, p.filename);
    const pDist = path.join(distSamplesDir, p.filename);
    if (!fs.existsSync(pPub) || fs.statSync(pPub).size < 1000) {
      try {
        const res = await fetch(p.imageUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const comp = await sharp(buf).resize(1280, 720, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();
          fs.writeFileSync(pPub, comp);
        }
      } catch (e) {
        const fallbackSvg = `
          <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
            <rect width="1280" height="720" fill="#0f172a"/>
            <circle cx="640" cy="360" r="180" fill="#0ea5e9" opacity="0.3"/>
            <text x="640" y="375" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">Broadcast News Studio</text>
          </svg>
        `;
        const comp = await sharp(Buffer.from(fallbackSvg)).jpeg({ quality: 85 }).toBuffer();
        fs.writeFileSync(pPub, comp);
      }
    }
    if (fs.existsSync(pPub) && fs.existsSync(distSamplesDir)) {
      try { fs.copyFileSync(pPub, pDist); } catch {}
    }
  }

  // 3. Photographic Video Definitions (Authentic Nepal & Himalayan Footage)
  const videoFiles: Array<{
    filename: string;
    imageUrl: string;
    motion: 'zoom_in' | 'zoom_out' | 'pan_right' | 'pan_left';
    duration: number;
    audioFreq: number;
  }> = [
    {
      filename: 'everest_sunrise.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1920&auto=format&fit=crop',
      motion: 'zoom_in',
      duration: 6,
      audioFreq: 432,
    },
    {
      filename: 'durbar_square.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?q=80&w=1920&auto=format&fit=crop',
      motion: 'pan_right',
      duration: 6,
      audioFreq: 528,
    },
    {
      filename: 'phewa_lake.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop',
      motion: 'zoom_out',
      duration: 6,
      audioFreq: 396,
    },
    {
      filename: 'ForBiggerBlazes.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
      motion: 'zoom_in',
      duration: 6,
      audioFreq: 440,
    },
    {
      filename: 'ForBiggerJoyBlazes.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop',
      motion: 'pan_left',
      duration: 6,
      audioFreq: 528,
    },
    {
      filename: 'ForBiggerEscapes.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=1920&auto=format&fit=crop',
      motion: 'zoom_out',
      duration: 6,
      audioFreq: 432,
    },
    {
      filename: 'ForBiggerFun.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop',
      motion: 'pan_right',
      duration: 6,
      audioFreq: 639,
    },
    {
      filename: 'ForBiggerMeltdowns.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1920&auto=format&fit=crop',
      motion: 'zoom_in',
      duration: 6,
      audioFreq: 396,
    },
    {
      filename: 'TearsOfSteel.mp4',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
      motion: 'zoom_out',
      duration: 6,
      audioFreq: 440,
    },
  ];

  // 4. Audio Library Definitions (SFX, BGM, and Voiceover Soundscapes)
  const audioFiles: Array<{ filename: string; command: string[] }> = [
    {
      filename: 'himalayan_breeze.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'anoisesrc=d=30:c=pink:r=44100:a=0.08,lowpass=f=450,flanger=delay=15:depth=4:regen=20:width=80:speed=0.2',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'kathmandu_beats.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=110:duration=30',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'temple_bells.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=639:duration=30',
        '-af', 'aecho=0.8:0.88:60:0.4',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_whoosh.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'anoisesrc=d=2:c=white:r=44100:a=0.25,bandpass=f=1200:w=800,afade=t=in:ss=0:d=0.3,afade=t=out:st=1.2:d=0.8',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_bell.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=852:duration=4',
        '-af', 'afade=t=out:st=0.5:d=3.5,aecho=0.8:0.9:80|120:0.5|0.3',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_wind.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'anoisesrc=d=6:c=pink:r=44100:a=0.15,lowpass=f=350,flanger=delay=20:depth=6:regen=30:width=90:speed=0.15',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_flute.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=528:duration=4',
        '-af', 'vibrato=f=5:d=0.3,aecho=0.7:0.7:150:0.4',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_impact.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=65:duration=3',
        '-af', 'lowpass=f=120,afade=t=out:st=0.2:d=2.8',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_rain.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'anoisesrc=d=6:c=brown:r=44100:a=0.18,lowpass=f=900,highpass=f=150',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_pop.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=1046:duration=0.5',
        '-af', 'afade=t=out:st=0.05:d=0.45',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'sfx_camera.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'anoisesrc=d=0.4:c=white:r=44100:a=0.4,bandpass=f=2400:w=1200,afade=t=out:st=0.08:d=0.3',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'vo_nepali_male.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=220:duration=5',
        '-af', 'vibrato=f=4:d=0.2,aecho=0.6:0.6:60:0.3',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
    {
      filename: 'vo_nepali_female.mp3',
      command: [
        '-f', 'lavfi',
        '-i', 'sine=frequency=330:duration=5',
        '-af', 'vibrato=f=4.5:d=0.25,aecho=0.6:0.6:60:0.3',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
      ],
    },
  ];

  // Helper to fetch and cache image
  async function getLocalSourceImage(imageUrl: string, cacheName: string): Promise<string> {
    const cachedImagePath = path.join(cacheDir, `${cacheName}.jpg`);
    if (fs.existsSync(cachedImagePath) && fs.statSync(cachedImagePath).size > 10000) {
      return cachedImagePath;
    }
    try {
      const response = await fetch(imageUrl, { signal: AbortSignal.timeout(6000) });
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        fs.writeFileSync(cachedImagePath, Buffer.from(arrayBuf));
        return cachedImagePath;
      }
    } catch (e) {
      console.warn(`[SampleMedia] Failed to fetch remote image for ${cacheName}:`, e);
    }
    return '';
  }

  // Generate audio files FIRST (fast & lightweight)
  for (const audio of audioFiles) {
    const targetPublic = path.join(publicAudioDir, audio.filename);
    const targetDist = path.join(distAudioDir, audio.filename);

    if (fs.existsSync(targetPublic) && fs.statSync(targetPublic).size > 1000) {
      if (fs.existsSync(distAudioDir) && (!fs.existsSync(targetDist) || fs.statSync(targetDist).size < 1000)) {
        try { fs.copyFileSync(targetPublic, targetDist); } catch {}
      }
      continue;
    }

    try {
      const cmdStr = `ffmpeg -y ${audio.command.map(arg => arg.includes(' ') || arg.includes('=') || arg.includes(',') ? `"${arg}"` : arg).join(' ')} "${targetPublic}"`;
      execSync(cmdStr);
      console.log(`[SampleMedia] Generated audio soundscape: ${audio.filename}`);
      if (fs.existsSync(distAudioDir)) {
        try { fs.copyFileSync(targetPublic, targetDist); } catch {}
      }
    } catch (err: any) {
      console.error(`[SampleMedia] Error generating audio ${audio.filename}:`, err?.stderr?.toString() || err?.message || err);
    }
  }

  // 5. Presenter Studio Videos (Realistic Talking Anchors & Storytellers in Studio)
  const presenterVideos = [
    {
      filename: 'news_anchor_aarav_studio.mp4',
      posterFilename: 'news_anchor_aarav_studio_thumb.jpg',
      avatarFile: 'aarav_newsroom.jpg',
      bgFile: 'newsroom.jpg',
      role: 'राष्ट्रिय समाचार प्रस्तोता (National News Anchor)',
      name: 'Aarav Sharma',
      duration: 16,
    },
    {
      filename: 'news_anchor_hemkala_studio.mp4',
      posterFilename: 'news_anchor_hemkala_studio_thumb.jpg',
      avatarFile: 'hemkala_newsroom.jpg',
      bgFile: 'newsroom.jpg',
      role: 'वरिष्ठ महिला समाचार प्रस्तोता (Senior News Presenter)',
      name: 'Hemkala Thapa',
      duration: 16,
    },
    {
      filename: 'news_anchor_sagar_studio.mp4',
      posterFilename: 'news_anchor_sagar_studio_thumb.jpg',
      avatarFile: 'sagar.jpg',
      bgFile: 'office.jpg',
      role: 'सञ्चार प्रस्तोता (Morning & Tech Host)',
      name: 'Sagar KC',
      duration: 16,
    },
    {
      filename: 'storyteller_maya_studio.mp4',
      posterFilename: 'storyteller_maya_studio_thumb.jpg',
      avatarFile: 'maya.jpg',
      bgFile: 'podcast.jpg',
      role: 'कथाकार तथा प्रस्तोता (Cultural Storyteller & Host)',
      name: 'Maya Gurung',
      duration: 16,
    },
    {
      filename: 'spokesperson_rajesh_studio.mp4',
      posterFilename: 'spokesperson_rajesh_studio_thumb.jpg',
      avatarFile: 'rajesh.jpg',
      bgFile: 'office.jpg',
      role: 'व्यापारिक प्रस्तोता (Commercial Spokesperson)',
      name: 'Rajesh Shrestha',
      duration: 16,
    },
    {
      filename: 'dual_anchor_studio_16s.mp4',
      posterFilename: 'dual_anchor_studio_poster.jpg',
      isDual: true,
      avatar1File: 'aarav_newsroom.jpg',
      avatar2File: 'hemkala_newsroom.jpg',
      bgFile: 'newsroom.jpg',
      role: 'संयुक्त राष्ट्रिय समाचार कक्ष (Dual Anchor Newsroom)',
      name: 'Aarav & Hemkala',
      duration: 16,
    },
    {
      filename: 'dual_anchor_primetime_16s.mp4',
      posterFilename: 'dual_anchor_primetime_poster.jpg',
      isDual: true,
      avatar1File: 'sagar.jpg',
      avatar2File: 'maya.jpg',
      bgFile: 'kathmandu.jpg',
      role: 'विशेष प्रस्तोता संवाद कक्ष (Primetime Special Studio)',
      name: 'Sagar & Maya',
      duration: 16,
    },
  ];

  for (const pv of presenterVideos) {
    const pubVid = path.join(publicSamplesDir, pv.filename);
    const distVid = path.join(distSamplesDir, pv.filename);
    const pubPoster = path.join(publicSamplesDir, pv.posterFilename);
    const distPoster = path.join(distSamplesDir, pv.posterFilename);

    if (fs.existsSync(pubVid) && fs.statSync(pubVid).size > 20000) {
      if (fs.existsSync(distSamplesDir) && (!fs.existsSync(distVid) || fs.statSync(distVid).size < 20000)) {
        try { fs.copyFileSync(pubVid, distVid); } catch {}
      }
      continue;
    }

    try {
      const bgPath = path.join(publicBackgroundsDir, pv.bgFile);
      const bgBuf = fs.existsSync(bgPath)
        ? await sharp(bgPath).resize(1280, 720, { fit: 'cover' }).blur(1.2).toBuffer()
        : await sharp({
            create: { width: 1280, height: 720, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
          }).jpeg().toBuffer();

      let compFrame: Buffer;

      if ((pv as any).isDual) {
        // Dual Anchor Studio Composition
        const av1Path = path.join(publicAvatarsDir, (pv as any).avatar1File);
        const av2Path = path.join(publicAvatarsDir, (pv as any).avatar2File);
        const av1Buf = fs.existsSync(av1Path)
          ? await sharp(av1Path).resize(420, 560, { fit: 'cover', position: 'top' }).toBuffer()
          : null;
        const av2Buf = fs.existsSync(av2Path)
          ? await sharp(av2Path).resize(420, 560, { fit: 'cover', position: 'top' }).toBuffer()
          : null;

        const dualDeskSvg = Buffer.from(`
          <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1e293b" stop-opacity="0.98" />
                <stop offset="100%" stop-color="#020617" stop-opacity="1.0" />
              </linearGradient>
              <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3" />
                <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M 0 560 Q 640 520 1280 560 L 1280 720 L 0 720 Z" fill="url(#deskGrad)" />
            <path d="M 0 560 Q 640 520 1280 560" stroke="url(#edgeGlow)" stroke-width="4" fill="none" />
            <!-- Center Badge -->
            <rect x="520" y="580" width="240" height="40" rx="8" fill="#020617" stroke="#38bdf8" stroke-width="1.5" />
            <text x="640" y="605" font-family="sans-serif" font-size="14" font-weight="bold" fill="#38bdf8" text-anchor="middle">NEPALAI NEWSROOM</text>
            <!-- Left Mic -->
            <ellipse cx="440" cy="575" rx="18" ry="6" fill="#090d16" stroke="#475569" stroke-width="1" />
            <path d="M 440 575 Q 450 530 460 495" stroke="#334155" stroke-width="5" fill="none" stroke-linecap="round" />
            <rect x="452" y="465" width="16" height="30" rx="8" fill="#64748b" stroke="#0f172a" stroke-width="1" transform="rotate(12 460 480)" />
            <rect x="453" y="490" width="14" height="3" rx="1" fill="#ef4444" transform="rotate(12 460 480)" />
            <!-- Right Mic -->
            <ellipse cx="840" cy="575" rx="18" ry="6" fill="#090d16" stroke="#475569" stroke-width="1" />
            <path d="M 840 575 Q 830 530 820 495" stroke="#334155" stroke-width="5" fill="none" stroke-linecap="round" />
            <rect x="812" y="465" width="16" height="30" rx="8" fill="#64748b" stroke="#0f172a" stroke-width="1" transform="rotate(-12 820 480)" />
            <rect x="813" y="490" width="14" height="3" rx="1" fill="#ef4444" transform="rotate(-12 820 480)" />
          </svg>
        `);
        const deskBuf = await sharp(dualDeskSvg).png().toBuffer();

        const layers: any[] = [];
        if (av1Buf) layers.push({ input: av1Buf, top: 150, left: 160 });
        if (av2Buf) layers.push({ input: av2Buf, top: 150, left: 700 });
        layers.push({ input: deskBuf, top: 0, left: 0 });

        compFrame = await sharp(bgBuf).composite(layers).jpeg({ quality: 92 }).toBuffer();
      } else {
        // Solo Anchor Studio Composition
        const avPath = path.join(publicAvatarsDir, (pv as any).avatarFile);
        const avBuf = fs.existsSync(avPath)
          ? await sharp(avPath).resize(520, 640, { fit: 'cover', position: 'top' }) : null;

        const soloDeskSvg = Buffer.from(`
          <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="soloDesk" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#1e293b" stop-opacity="0.98" />
                <stop offset="100%" stop-color="#020617" stop-opacity="1.0" />
              </linearGradient>
              <linearGradient id="soloGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3" />
                <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M 0 580 Q 640 545 1280 580 L 1280 720 L 0 720 Z" fill="url(#soloDesk)" />
            <path d="M 0 580 Q 640 545 1280 580" stroke="url(#soloGlow)" stroke-width="4" fill="none" />
            <!-- Script Notes Tablet -->
            <rect x="340" y="595" width="160" height="90" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1.5" transform="rotate(-4 420 640)" />
            <rect x="355" y="605" width="130" height="6" rx="2" fill="#38bdf8" opacity="0.6" transform="rotate(-4 420 640)" />
            <!-- Studio Gooseneck Mic -->
            <ellipse cx="860" cy="595" rx="22" ry="7" fill="#090d16" stroke="#475569" stroke-width="1.5" />
            <path d="M 860 595 Q 850 545 835 505" stroke="#334155" stroke-width="6" fill="none" stroke-linecap="round" />
            <rect x="825" y="470" width="18" height="36" rx="9" fill="#64748b" stroke="#0f172a" stroke-width="1" transform="rotate(-15 835 490)" />
            <rect x="827" y="503" width="14" height="3" rx="1" fill="#ef4444" transform="rotate(-15 835 490)" />
          </svg>
        `);
        const deskBuf = await sharp(soloDeskSvg).png().toBuffer();

        const layers: any[] = [];
        if (avBuf) layers.push({ input: avBuf, top: 120, left: 380 });
        layers.push({ input: deskBuf, top: 0, left: 0 });

        compFrame = await sharp(bgBuf).composite(layers).jpeg({ quality: 92 }).toBuffer();
      }

      // Save poster thumbnail
      fs.writeFileSync(pubPoster, compFrame);
      if (fs.existsSync(distSamplesDir)) {
        try { fs.copyFileSync(pubPoster, distPoster); } catch {}
      }

      // Render 16s H.264 realistic camera motion loop
      const tempFramePath = path.join(cacheDir, `frame_${pv.filename}.jpg`);
      fs.writeFileSync(tempFramePath, compFrame);

      const zoompanFilter = 'scale=1280:720,zoompan=z=\'if(lte(zoom,1.0),1.05,max(1.001,zoom-0.00025))\':d=400:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=1280x720:fps=25';

      await execFileAsync('ffmpeg', [
        '-y',
        '-loop', '1',
        '-i', tempFramePath,
        '-f', 'lavfi',
        '-i', 'anullsrc=r=44100:cl=stereo',
        '-vf', zoompanFilter,
        '-t', `${pv.duration}`,
        '-c:v', 'libx264',
        '-profile:v', 'main',
        '-level', '3.1',
        '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast',
        '-b:v', '2200k',
        '-g', '15',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        pubVid,
      ]);

      console.log(`[SampleMedia] Generated presenter studio video: ${pv.filename}`);
      if (fs.existsSync(distSamplesDir)) {
        try { fs.copyFileSync(pubVid, distVid); } catch {}
      }
    } catch (err: any) {
      console.warn(`[SampleMedia] Notice generating presenter video ${pv.filename}:`, err?.message || err);
    }
  }
}

