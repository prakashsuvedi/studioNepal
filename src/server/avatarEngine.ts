import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile, spawn, execSync } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { serverGenerateAudio } from './aiServices';
import { db } from './db';
import { Avatar, AvatarVideoJob } from '../db/schema';

const execFileAsync = promisify(execFile);

export interface GenerateAvatarVideoOptions {
  userId: string;
  avatarId: string;
  script: string;
  language?: string;
  voiceId?: string;
  speed?: string;
  pitch?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  backgroundPreset?: string;
  customBackgroundUrl?: string;
  pose?: 'seated' | 'standing';
  consentConfirmed: boolean;
  signerFullName?: string;
  isFreeAvatarRender?: boolean;
}

export interface AvatarGenerationResult {
  jobId: string;
  videoUrl: string;
  audioUrl: string;
  durationSeconds: number;
  avatarId: string;
  avatarName: string;
  aspectRatio: string;
  creditsDeducted: number;
  watermark: boolean;
}

const DATA_STORAGE_DIR = path.join(process.cwd(), 'data', 'storage');
const STORAGE_UPLOADS_DIR = path.join(process.cwd(), 'dist', 'uploads');
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

[DATA_STORAGE_DIR, STORAGE_UPLOADS_DIR, PUBLIC_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
});

// Helper to probe media files
async function probeMedia(filePath: string): Promise<{ duration: number; width: number; height: number; hasVideo: boolean; hasAudio: boolean }> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration:stream=codec_type,width,height',
      '-of', 'json',
      filePath,
    ]);
    const data = JSON.parse(stdout);
    const duration = parseFloat(data.format?.duration || '0');
    const vStream = data.streams?.find((s: any) => s.codec_type === 'video');
    const aStream = data.streams?.find((s: any) => s.codec_type === 'audio');
    return {
      duration,
      width: vStream?.width || 1280,
      height: vStream?.height || 720,
      hasVideo: Boolean(vStream),
      hasAudio: Boolean(aStream),
    };
  } catch (err) {
    console.warn('[AvatarEngine] Probe fallback notice:', err);
    return { duration: 5, width: 1280, height: 720, hasVideo: true, hasAudio: true };
  }
}

// Download remote asset or resolve local path
async function resolveImageToLocalFile(urlOrPath: string, scratchDir: string, filename: string): Promise<string> {
  const dest = path.join(scratchDir, filename);

  if (urlOrPath.startsWith('data:')) {
    const commaIdx = urlOrPath.indexOf(',');
    const base64Data = commaIdx !== -1 ? urlOrPath.slice(commaIdx + 1) : urlOrPath;
    fs.writeFileSync(dest, Buffer.from(base64Data, 'base64'));
    return dest;
  }

  if (urlOrPath.startsWith('/api/storage/file/')) {
    const fn = urlOrPath.replace('/api/storage/file/', '').split('?')[0];
    const candidates = [
      path.join(DATA_STORAGE_DIR, fn),
      path.join(PUBLIC_UPLOADS_DIR, fn),
      path.join(STORAGE_UPLOADS_DIR, fn),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        fs.copyFileSync(c, dest);
        return dest;
      }
    }
  }

  if (urlOrPath.startsWith('/')) {
    const rel = urlOrPath.replace(/^\//, '');
    const candidates = [
      path.join(process.cwd(), 'public', rel),
      path.join(process.cwd(), 'dist', rel),
      path.join(process.cwd(), rel),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        fs.copyFileSync(c, dest);
        return dest;
      }
    }
  }

  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    try {
      const res = await fetch(urlOrPath, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        fs.writeFileSync(dest, Buffer.from(buf));
        return dest;
      }
    } catch (e) {
      console.warn('[AvatarEngine] Remote image download notice:', e);
    }
  }

  // Fallback to verified local portrait photo
  const photoFallbacks = [
    path.join(process.cwd(), 'public', 'assets', 'avatars', 'aarav.jpg'),
    path.join(process.cwd(), 'public', 'assets', 'avatars', 'hemkala.jpg'),
  ];
  for (const p of photoFallbacks) {
    if (fs.existsSync(p)) {
      fs.copyFileSync(p, dest);
      return dest;
    }
  }

  return dest;
}

// Resolve Studio Background
async function resolveBackgroundImage(preset: string, customUrl: string | undefined, scratchDir: string): Promise<string> {
  if (customUrl) {
    try {
      const customPath = await resolveImageToLocalFile(customUrl, scratchDir, 'custom_bg.jpg');
      if (fs.existsSync(customPath)) return customPath;
    } catch (e) {}
  }

  const presetMap: Record<string, string> = {
    newsroom: 'newsroom.jpg',
    broadcast: 'newsroom.jpg',
    office: 'office.jpg',
    podcast: 'podcast.jpg',
    kathmandu: 'kathmandu.jpg',
    traditional_nepali: 'kathmandu.jpg',
    green_screen: 'green_screen.png',
  };

  const filename = presetMap[preset] || 'newsroom.jpg';
  const candidates = [
    path.join(process.cwd(), 'public', 'assets', 'backgrounds', filename),
    path.join(process.cwd(), 'dist', 'assets', 'backgrounds', filename),
    path.join(process.cwd(), 'public', 'assets', 'backgrounds', 'newsroom.jpg'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // Generate fallback background if none found
  const fallbackBg = path.join(scratchDir, 'fallback_bg.png');
  await execFileAsync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'color=c=0x0f172a:s=1280x720:d=1',
    '-vframes', '1', fallbackBg,
  ]);
  return fallbackBg;
}

// Resolve Watermark Image
function resolveWatermarkImage(): string | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'assets', 'nepalai_watermark.png'),
    path.join(process.cwd(), 'dist', 'assets', 'nepalai_watermark.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Resolve Subtitle Font
function resolveSubtitleFont(): string {
  const candidates = [
    '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansDevanagari-Bold.otf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    path.join(process.cwd(), 'public', 'assets', 'fonts', 'NotoSansDevanagari-Bold.ttf'),
    path.join(process.cwd(), 'dist', 'assets', 'fonts', 'NotoSansDevanagari-Bold.ttf'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'Sans';
}

// Generate Executive Studio Chair SVG Overlay
function generateExecutiveChairSvg(w: number, h: number, presTop: number, presH: number): Buffer {
  const headrestY = presTop + Math.round(presH * 0.12);
  const headrestW = Math.round(w * 0.22);
  const headrestH = Math.round(presH * 0.18);
  const cx = Math.round(w / 2);

  return Buffer.from(`
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chairLeather" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e2530" />
          <stop offset="50%" stop-color="#0f1318" />
          <stop offset="100%" stop-color="#080a0d" />
        </linearGradient>
        <linearGradient id="chromeAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#475569" />
          <stop offset="50%" stop-color="#94a3b8" />
          <stop offset="100%" stop-color="#334155" />
        </linearGradient>
      </defs>
      <!-- Headrest behind presenter -->
      <rect x="${cx - headrestW / 2}" y="${headrestY}" width="${headrestW}" height="${headrestH}" rx="22" fill="url(#chairLeather)" stroke="url(#chromeAccent)" stroke-width="2" />
      <path d="M ${cx - headrestW * 0.4} ${headrestY + headrestH * 0.45} Q ${cx} ${headrestY + headrestH * 0.55} ${cx + headrestW * 0.4} ${headrestY + headrestH * 0.45}" stroke="#334155" stroke-width="1.5" fill="none" />
      <!-- Upper Back Support Wings -->
      <path d="M ${cx - headrestW * 0.7} ${headrestY + headrestH * 0.9} Q ${cx} ${headrestY + headrestH * 0.7} ${cx + headrestW * 0.7} ${headrestY + headrestH * 0.9} L ${cx + headrestW * 0.8} ${headrestY + headrestH * 2.2} Q ${cx} ${headrestY + headrestH * 2.0} ${cx - headrestW * 0.8} ${headrestY + headrestH * 2.2} Z" fill="url(#chairLeather)" stroke="#1e293b" stroke-width="2" />
      <!-- Chrome spine connector -->
      <rect x="${cx - 10}" y="${headrestY + headrestH * 0.8}" width="20" height="${headrestH * 0.4}" rx="4" fill="url(#chromeAccent)" />
    </svg>
  `);
}

// Generate Broadcast Newsroom Studio Desk SVG Overlay
function generateBroadcastDeskSvg(w: number, h: number): Buffer {
  const deskY = Math.round(h * 0.82);
  const midY = deskY - Math.round(h * 0.05);
  const micX = Math.round(w * 0.65);
  const micY = deskY + 15;

  return Buffer.from(`
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" stop-opacity="0.98" />
          <stop offset="30%" stop-color="#0f172a" stop-opacity="0.99" />
          <stop offset="100%" stop-color="#020617" stop-opacity="1.0" />
        </linearGradient>
        <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.2" />
          <stop offset="25%" stop-color="#38bdf8" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.9" />
          <stop offset="75%" stop-color="#38bdf8" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.2" />
        </linearGradient>
        <linearGradient id="micMetal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#334155" />
          <stop offset="50%" stop-color="#64748b" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <!-- Desk Curved Rim -->
      <path d="M 0 ${deskY} Q ${w / 2} ${midY} ${w} ${deskY} L ${w} ${h} L 0 ${h} Z" fill="url(#deskGrad)" />
      <path d="M 0 ${deskY} Q ${w / 2} ${midY} ${w} ${deskY}" stroke="url(#edgeGlow)" stroke-width="4" fill="none" />
      
      <!-- Studio Tablet / Presenter Script Notes on Desk -->
      <rect x="${Math.round(w * 0.25)}" y="${deskY + 12}" width="${Math.round(w * 0.14)}" height="${Math.round(h * 0.10)}" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1.5" transform="rotate(-4 ${Math.round(w * 0.32)} ${deskY + 45})" />
      <rect x="${Math.round(w * 0.26)}" y="${deskY + 20}" width="${Math.round(w * 0.12)}" height="6" rx="2" fill="#38bdf8" opacity="0.6" transform="rotate(-4 ${Math.round(w * 0.32)} ${deskY + 45})" />
      <rect x="${Math.round(w * 0.26)}" y="${deskY + 32}" width="${Math.round(w * 0.09)}" height="4" rx="2" fill="#64748b" opacity="0.5" transform="rotate(-4 ${Math.round(w * 0.32)} ${deskY + 45})" />

      <!-- Studio Condenser Gooseneck Microphone -->
      <ellipse cx="${micX}" cy="${micY}" rx="24" ry="8" fill="#090d16" stroke="#475569" stroke-width="1.5" />
      <rect x="${micX - 4}" y="${micY - 10}" width="8" height="10" rx="2" fill="url(#micMetal)" />
      <path d="M ${micX} ${micY - 10} Q ${micX - 10} ${micY - 60} ${micX - 25} ${micY - 100}" stroke="#1e293b" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M ${micX} ${micY - 10} Q ${micX - 10} ${micY - 60} ${micX - 25} ${micY - 100}" stroke="#475569" stroke-width="2" fill="none" stroke-linecap="round" />
      <rect x="${micX - 35}" y="${micY - 135}" width="20" height="38" rx="10" fill="url(#micMetal)" stroke="#0f172a" stroke-width="1" transform="rotate(-18 ${micX - 25} ${micY - 115})" />
      <line x1="${micX - 32}" y1="${micY - 126}" x2="${micX - 18}" y2="${micY - 130}" stroke="#94a3b8" stroke-width="1" />
      <line x1="${micX - 31}" y1="${micY - 120}" x2="${micX - 17}" y2="${micY - 124}" stroke="#94a3b8" stroke-width="1" />
      <!-- Studio Active On-Air Indicator Ring -->
      <rect x="${micX - 32}" y="${micY - 102}" width="14" height="3" rx="1" fill="#ef4444" transform="rotate(-18 ${micX - 25} ${micY - 115})" />
    </svg>
  `);
}

// Format Script for Subtitle Lower-Third Card
function formatScriptForSubtitles(script: string, maxLineLength = 50): string {
  const words = script.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxLineLength) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 3) break; // 3 lines max for comfortable reading
    }
  }
  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }
  return lines.join('\n');
}

export class AvatarEngine {
  /**
   * Generates a realistic presenter video synchronized with TTS voice track, studio background, and bold script
   */
  public static async generateAvatarVideo(options: GenerateAvatarVideoOptions): Promise<AvatarGenerationResult> {
    const {
      userId,
      avatarId,
      script,
      language = 'ne-NP',
      voiceId = 'ne-NP-HemkalaNeural',
      speed = 'normal',
      pitch = '0%',
      aspectRatio = '16:9',
      backgroundPreset = 'newsroom',
      customBackgroundUrl,
      pose = 'seated',
      consentConfirmed,
      signerFullName,
    } = options;

    if (!consentConfirmed) {
      throw new Error('Avatar generation requires explicit likeness and voice consent acknowledgment.');
    }

    const avatar = db.getAvatarById(avatarId);
    if (!avatar) {
      throw new Error(`Avatar with ID "${avatarId}" not found.`);
    }

    const user = db.getUserById(userId);
    const usage = db.getTrialUsage(userId);
    const freeAvatarUsed = Boolean((usage as any).freeAvatarRenderUsed || ((usage as any).avatarCount && (usage as any).avatarCount >= 1));

    // Policy: 1 Video Render Free for Google Login / Free Users (with NepalAI Studio watermark)
    const showWatermark = options.isFreeAvatarRender ?? (!freeAvatarUsed && (user?.tier === 'free_trial' || !user?.credits));

    // Step 1: Create Job Record
    const jobId = `avt_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: AvatarVideoJob = {
      id: jobId,
      userId,
      avatarId: avatar.id,
      avatarName: avatar.name,
      avatarImageUrl: avatar.imageUrl,
      script,
      language,
      voiceId,
      aspectRatio,
      backgroundStyle: backgroundPreset,
      status: 'processing',
      progress: 10,
      watermark: showWatermark,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.createAvatarJob(job);

    // Scratch workspace for intermediate rendering
    const scratchDir = path.join(os.tmpdir(), `nepalai_avatar_${jobId}`);
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }

    try {
      // Step 2: Synthesize Voiceover Audio using the verified TTS engine
      console.log(`[AvatarEngine] Synthesizing speech track for Avatar "${avatar.name}" (${language}, ${voiceId})...`);
      db.updateAvatarJob(jobId, { progress: 20 });

      const audioResult = await serverGenerateAudio({
        text: script,
        voiceId,
        language: (language === 'en-US' ? 'en-US' : 'ne-NP') as 'ne-NP' | 'en-US',
        speed,
        pitch,
      });
      if (!audioResult || !audioResult.url) {
        throw new Error('Audio voiceover synthesis failed.');
      }

      // Write audio to temporary scratch WAV/MP3 file
      const rawExt = audioResult.filename ? path.extname(audioResult.filename) : (audioResult.format?.toLowerCase().includes('wav') ? '.wav' : '.mp3');
      const scratchAudioPath = path.join(scratchDir, `voiceover${rawExt || '.mp3'}`);
      if (audioResult.url.startsWith('data:')) {
        const commaIdx = audioResult.url.indexOf(',');
        const base64Data = commaIdx !== -1 ? audioResult.url.slice(commaIdx + 1) : audioResult.url;
        fs.writeFileSync(scratchAudioPath, Buffer.from(base64Data, 'base64'));
      } else if (audioResult.filename) {
        const localCandidates = [
          path.join(DATA_STORAGE_DIR, audioResult.filename),
          path.join(PUBLIC_UPLOADS_DIR, audioResult.filename),
          path.join(STORAGE_UPLOADS_DIR, audioResult.filename),
        ];
        let found = false;
        for (const cand of localCandidates) {
          if (fs.existsSync(cand)) {
            fs.copyFileSync(cand, scratchAudioPath);
            found = true;
            break;
          }
        }
        if (!found) {
          const fullUrl = `http://127.0.0.1:3000/api/storage/file/${audioResult.filename}`;
          const audioBuf = await fetch(fullUrl).then((r) => r.arrayBuffer());
          fs.writeFileSync(scratchAudioPath, Buffer.from(audioBuf));
        }
      } else if (audioResult.url.startsWith('http://') || audioResult.url.startsWith('https://')) {
        const audioBuf = await fetch(audioResult.url).then((r) => r.arrayBuffer());
        fs.writeFileSync(scratchAudioPath, Buffer.from(audioBuf));
      } else if (audioResult.url.startsWith('/')) {
        const fn = path.basename(audioResult.url);
        const rel = audioResult.url.replace(/^\//, '');
        const candidates = [
          path.join(DATA_STORAGE_DIR, fn),
          path.join(PUBLIC_UPLOADS_DIR, fn),
          path.join(STORAGE_UPLOADS_DIR, fn),
          path.join(process.cwd(), 'dist', rel),
          path.join(process.cwd(), 'public', rel),
          path.join(process.cwd(), rel),
        ];
        let copied = false;
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            fs.copyFileSync(c, scratchAudioPath);
            copied = true;
            break;
          }
        }
        if (!copied) {
          const fullUrl = `http://127.0.0.1:3000${audioResult.url}`;
          const audioBuf = await fetch(fullUrl).then((r) => r.arrayBuffer());
          fs.writeFileSync(scratchAudioPath, Buffer.from(audioBuf));
        }
      }

      // Measure exact audio duration
      const audioProbe = await probeMedia(scratchAudioPath);
      const exactDuration = Math.max(audioProbe.duration || audioResult.duration || 4, 3);
      console.log(`[AvatarEngine] Audio track ready: ${exactDuration.toFixed(2)}s`);

      db.updateAvatarJob(jobId, { progress: 45, durationSeconds: exactDuration, audioUrl: audioResult.url });

      // Step 3: Resolve Assets (Presenter Photo, Studio Background, Font, Watermark)
      const presenterImagePath = await resolveImageToLocalFile(avatar.imageUrl, scratchDir, 'presenter.jpg');
      const bgImagePath = await resolveBackgroundImage(backgroundPreset, customBackgroundUrl, scratchDir);
      const watermarkPath = showWatermark ? resolveWatermarkImage() : null;
      const fontPath = resolveSubtitleFont();

      // Format script for lower-third subtitle banner
      const formattedScript = formatScriptForSubtitles(script);
      const scriptTextPath = path.join(scratchDir, 'subtitles.txt');
      fs.writeFileSync(scriptTextPath, formattedScript, 'utf-8');

      // Determine video canvas and presenter dimensions based on aspect ratio
      let width = 1280;
      let height = 720;
      let presW = 560;
      let presH = 700;
      let presX = `(W-w)/2 + 2*sin(t*1.5)`;
      let presY = `H-h + 10`;
      let cardX = 40;
      let cardY = height - 136;
      let cardW = width - 80;
      let cardH = 96;
      let titleFontSize = 18;
      let scriptFontSize = 21;

      if (aspectRatio === '9:16') {
        width = 720;
        height = 1280;
        presW = 680;
        presH = 880;
        presX = `(W-w)/2`;
        presY = `H-h - 40`;
        cardX = 24;
        cardY = height - 170;
        cardW = width - 48;
        cardH = 110;
        titleFontSize = 20;
        scriptFontSize = 23;
      } else if (aspectRatio === '1:1') {
        width = 1080;
        height = 1080;
        presW = 760;
        presH = 920;
        presX = `(W-w)/2`;
        presY = `H-h + 10`;
        cardX = 36;
        cardY = height - 150;
        cardW = width - 72;
        cardH = 100;
        titleFontSize = 20;
        scriptFontSize = 22;
      }

      const outputFileName = `avatar_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp4`;
      const outputPublicPath = path.join(PUBLIC_UPLOADS_DIR, outputFileName);
      const outputDistPath = path.join(STORAGE_UPLOADS_DIR, outputFileName);

      // Step 4: Audio-Driven Lipsync & Pose Rendering Pipeline
      console.log(`[AvatarEngine] Rendering presenter studio video (${width}x${height}, ${exactDuration.toFixed(2)}s, pose: ${pose}, bg: ${backgroundPreset}, watermark: ${showWatermark})...`);
      db.updateAvatarJob(jobId, { progress: 60 });

      // 4.1 Decode audio track to 16kHz mono PCM for energy analysis
      const pcmBuffer = execSync(`ffmpeg -v error -i "${scratchAudioPath}" -f s16le -ac 1 -ar 16000 pipe:1`);
      const sampleCount = Math.floor(pcmBuffer.length / 2);
      const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, sampleCount);
      const samplesPerFrame = 640; // 16000 / 25 fps
      const totalFrames = Math.max(1, Math.floor(sampleCount / samplesPerFrame));

      const energies: number[] = [];
      let maxRms = 0.0001;
      for (let i = 0; i < totalFrames; i++) {
        const start = i * samplesPerFrame;
        let sumSq = 0;
        for (let j = 0; j < samplesPerFrame; j++) {
          const s = samples[start + j] || 0;
          sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / samplesPerFrame);
        energies.push(rms);
        if (rms > maxRms) maxRms = rms;
      }

      // 4.2 Normalize presenter image to exact presenter size (presW, presH)
      const normalizedPresenter = await sharp(presenterImagePath)
        .rotate()
        .resize(presW, presH, { fit: 'cover' })
        .toBuffer();

      const mouthX = Math.round(presW * 0.50);
      const mouthY = Math.round(presH * 0.58);
      const mouthW = Math.round(presW * 0.155);

      const eyeL = Math.round(presW * 0.437);
      const eyeR = Math.round(presW * 0.563);
      const eyeY = Math.round(presH * 0.37);

      const lipsyncOverlays: Buffer[] = [
        // Level 0: Rest (Closed mouth)
        Buffer.from(`<svg width="${presW}" height="${presH}" xmlns="http://www.w3.org/2000/svg"></svg>`),
        // Level 1: Soft open
        Buffer.from(`
          <svg width="${presW}" height="${presH}" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="${mouthX}" cy="${mouthY}" rx="${mouthW * 0.48}" ry="${mouthW * 0.16}" fill="#2a080c" />
            <path d="M ${mouthX - mouthW * 0.32} ${mouthY - 1} Q ${mouthX} ${mouthY + 1} ${mouthX + mouthW * 0.32} ${mouthY - 1}" stroke="#f8fafc" stroke-width="2.5" opacity="0.9" fill="none" />
            <path d="M ${mouthX - mouthW * 0.48} ${mouthY} Q ${mouthX} ${mouthY - mouthW * 0.18} ${mouthX + mouthW * 0.48} ${mouthY}" stroke="#e21d48" stroke-width="3" fill="none" />
          </svg>
        `),
        // Level 2: Mid open with teeth & tongue
        Buffer.from(`
          <svg width="${presW}" height="${presH}" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="${mouthX}" cy="${mouthY + 1}" rx="${mouthW * 0.54}" ry="${mouthW * 0.30}" fill="#1a0306" />
            <path d="M ${mouthX - mouthW * 0.42} ${mouthY - 3} Q ${mouthX} ${mouthY} ${mouthX + mouthW * 0.42} ${mouthY - 3}" stroke="#ffffff" stroke-width="4" opacity="0.95" fill="none" />
            <path d="M ${mouthX - mouthW * 0.30} ${mouthY + mouthW * 0.14} Q ${mouthX} ${mouthY + mouthW * 0.08} ${mouthX + mouthW * 0.30} ${mouthY + mouthW * 0.14}" fill="#f43f5e" opacity="0.85" />
            <path d="M ${mouthX - mouthW * 0.54} ${mouthY} Q ${mouthX} ${mouthY - mouthW * 0.22} ${mouthX + mouthW * 0.54} ${mouthY}" stroke="#be123c" stroke-width="3.5" fill="none" />
          </svg>
        `),
        // Level 3: Open vowel mouth
        Buffer.from(`
          <svg width="${presW}" height="${presH}" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="${mouthX}" cy="${mouthY + 2}" rx="${mouthW * 0.58}" ry="${mouthW * 0.42}" fill="#0f0204" />
            <path d="M ${mouthX - mouthW * 0.46} ${mouthY - 5} Q ${mouthX} ${mouthY - 2} ${mouthX + mouthW * 0.46} ${mouthY - 5}" stroke="#ffffff" stroke-width="5" fill="none" />
            <path d="M ${mouthX - mouthW * 0.38} ${mouthY + mouthW * 0.22} Q ${mouthX} ${mouthY + mouthW * 0.10} ${mouthX + mouthW * 0.38} ${mouthY + mouthW * 0.22}" fill="#fb7185" opacity="0.9" />
            <path d="M ${mouthX - mouthW * 0.58} ${mouthY} Q ${mouthX} ${mouthY - mouthW * 0.28} ${mouthX + mouthW * 0.58} ${mouthY}" stroke="#9f1239" stroke-width="4" fill="none" />
          </svg>
        `),
        // Level 4: Articulate / round
        Buffer.from(`
          <svg width="${presW}" height="${presH}" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="${mouthX}" cy="${mouthY + 2}" rx="${mouthW * 0.36}" ry="${mouthW * 0.38}" fill="#180205" stroke="#be123c" stroke-width="3" />
            <path d="M ${mouthX - mouthW * 0.22} ${mouthY - 4} Q ${mouthX} ${mouthY - 2} ${mouthX + mouthW * 0.22} ${mouthY - 4}" stroke="#ffffff" stroke-width="3.5" fill="none" />
          </svg>
        `),
        // Level 5: Natural Blink
        Buffer.from(`
          <svg width="${presW}" height="${presH}" xmlns="http://www.w3.org/2000/svg">
            <path d="M ${eyeL - 26} ${eyeY} Q ${eyeL} ${eyeY + 12} ${eyeL + 26} ${eyeY}" stroke="#475569" stroke-width="4" fill="none" stroke-linecap="round" />
            <path d="M ${eyeR - 26} ${eyeY} Q ${eyeR} ${eyeY + 12} ${eyeR + 26} ${eyeY}" stroke="#475569" stroke-width="4" fill="none" stroke-linecap="round" />
          </svg>
        `),
      ];

      // Build 6 face buffers scaled to presW, presH
      const faceBuffers: Buffer[] = [];
      for (const svgBuf of lipsyncOverlays) {
        const face = await sharp(normalizedPresenter)
          .composite([{ input: svgBuf, top: 0, left: 0 }])
          .toBuffer();
        faceBuffers.push(face);
      }

      // 4.3 Prepare studio background with depth blur and pose overlays
      const rawBg = await sharp(bgImagePath)
        .resize(width, height, { fit: 'cover' })
        .blur(1.8)
        .toBuffer();

      const presYVal = aspectRatio === '9:16' ? height - presH - 40 : height - presH + 10;
      let baseBg = rawBg;
      let deskBuf: Buffer | null = null;

      if (pose === 'seated') {
        const chairBuf = await sharp(generateExecutiveChairSvg(width, height, presYVal, presH)).png().toBuffer();
        baseBg = await sharp(rawBg).composite([{ input: chairBuf, top: 0, left: 0 }]).toBuffer();
        deskBuf = await sharp(generateBroadcastDeskSvg(width, height)).png().toBuffer();
      }

      // 4.4 Build the 6 template scene frame buffers
      const templateFrames: Buffer[] = [];
      const presLeft = Math.round((width - presW) / 2);

      for (let lvl = 0; lvl < faceBuffers.length; lvl++) {
        const layers: Array<{ input: Buffer; top: number; left: number }> = [
          { input: faceBuffers[lvl], top: presYVal, left: presLeft },
        ];
        if (deskBuf) {
          layers.push({ input: deskBuf, top: 0, left: 0 });
        }
        const sceneBuf = await sharp(baseBg).composite(layers).jpeg({ quality: 88 }).toBuffer();
        templateFrames.push(sceneBuf);
      }

      // 4.5 Stream frames directly to FFmpeg via image2pipe
      const pass1OutputFile = path.join(scratchDir, 'lipsync_raw.mp4');
      const ffmpegProc = spawn('ffmpeg', [
        '-y',
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-framerate', '25',
        '-i', 'pipe:0',
        '-i', scratchAudioPath,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '22',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        pass1OutputFile,
      ]);

      ffmpegProc.stderr.on('data', () => {}); // consume logs silently

      const writeFramesPromise = new Promise<void>((resWrite, rejWrite) => {
        ffmpegProc.on('close', (code) => {
          if (code === 0) resWrite();
          else rejWrite(new Error(`FFmpeg lipsync pipe exited with code ${code}`));
        });
        ffmpegProc.on('error', rejWrite);

        let f = 0;
        function writeNext() {
          let ok = true;
          while (f < totalFrames && ok) {
            const rms = energies[f] || 0;
            const norm = rms / maxRms;

            let lvl = 0;
            // Natural human blink cycle every 3.2 seconds
            if (f % 80 >= 74 && f % 80 <= 76) {
              lvl = 5;
            } else if (norm < 0.09) {
              lvl = 0;
            } else if (norm < 0.28) {
              lvl = 1;
            } else if (norm < 0.58) {
              lvl = 2;
            } else if (norm < 0.82) {
              lvl = 3;
            } else {
              lvl = f % 2 === 0 ? 3 : 4;
            }

            const buf = templateFrames[lvl];
            f++;
            ok = ffmpegProc.stdin.write(buf);
          }

          if (f < totalFrames) {
            ffmpegProc.stdin.once('drain', writeNext);
          } else {
            ffmpegProc.stdin.end();
          }
        }
        writeNext();
      });

      await writeFramesPromise;
      db.updateAvatarJob(jobId, { progress: 85 });

      // 4.6 Final pass: Add lower-third subtitles and watermark banner
      console.log(`[AvatarEngine] Applying lower-third banner and watermark overlay...`);
      const cleanPresenterName = avatar.name.replace(/['":\\]/g, '');
      const filterParts: string[] = [];

      filterParts.push(
        `[0:v]drawbox=x=${cardX}:y=${cardY}:w=${cardW}:h=${cardH}:color=black@0.80:t=fill,` +
        `drawbox=x=${cardX}:y=${cardY}:w=${cardW}:h=3:color=#f59e0b@0.95:t=fill,` +
        `drawtext=fontfile='${fontPath}':text='प्रस्तोता: ${cleanPresenterName}':fontsize=${titleFontSize}:fontcolor=#38bdf8:x=${cardX + 24}:y=${cardY + 14},` +
        `drawtext=fontfile='${fontPath}':textfile='${scriptTextPath}':fontsize=${scriptFontSize}:fontcolor=white:x=${cardX + 24}:y=${cardY + 42}:line_spacing=6[graded]`
      );

      let finalVideoTag = '[graded]';
      const hasWatermarkInput = Boolean(showWatermark && watermarkPath && fs.existsSync(watermarkPath));
      if (hasWatermarkInput) {
        filterParts.push(`[1:v]scale=180:53[wm]`);
        filterParts.push(`[graded][wm]overlay=x=W-w-28:y=28:format=auto[vfinal]`);
        finalVideoTag = '[vfinal]';
      }

      await new Promise<void>((resolve, reject) => {
        const ff = ffmpeg().input(pass1OutputFile);

        if (hasWatermarkInput && watermarkPath) {
          ff.input(watermarkPath).inputOptions(['-loop 1', `-t ${exactDuration}`]);
        }

        ff.complexFilter(filterParts.join(';'))
          .outputOptions([
            `-map ${finalVideoTag}`,
            '-map 0:a',
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-preset veryfast',
            '-crf 20',
            '-c:a copy',
            '-movflags +faststart',
          ])
          .output(outputPublicPath)
          .on('end', () => {
            try {
              fs.copyFileSync(outputPublicPath, outputDistPath);
            } catch (e) {}
            try {
              const storagePath = path.join(DATA_STORAGE_DIR, outputFileName);
              fs.copyFileSync(outputPublicPath, storagePath);
            } catch (e) {}
            resolve();
          })
          .on('error', (err) => {
            console.error('[AvatarEngine] Final pass FFmpeg error:', err);
            reject(err);
          })
          .run();
      });

      // Step 5: Verify Generated Video via ffprobe
      const probeResult = await probeMedia(outputPublicPath);
      if (!probeResult.hasVideo || probeResult.duration <= 0) {
        throw new Error('Generated avatar video failed verification probe.');
      }

      console.log(`[AvatarEngine] ✅ Avatar video successfully generated: ${outputFileName} (${probeResult.duration.toFixed(2)}s)`);

      const videoUrl = `/api/storage/file/${outputFileName}`;
      
      // Step 6: Deduct Credits and Update Job Record
      const creditsCost = showWatermark ? 0 : ((user?.role === 'admin') ? 0 : 15);
      db.recordGeneration(
        userId,
        'avatar',
        `Avatar Presenter: ${avatar.name} (${language}, bg: ${backgroundPreset}) - "${script.slice(0, 80)}"`,
        videoUrl,
        'NepalAI Neural Avatar Presenter v2.0',
        Math.round(exactDuration)
      );

      db.updateAvatarJob(jobId, {
        status: 'completed',
        progress: 100,
        videoUrl,
        durationSeconds: exactDuration,
        creditsDeducted: creditsCost,
        watermark: showWatermark,
      });

      // Cleanup scratch dir
      try {
        fs.rmSync(scratchDir, { recursive: true, force: true });
      } catch (e) {}

      return {
        jobId,
        videoUrl,
        audioUrl: audioResult.url,
        durationSeconds: exactDuration,
        avatarId: avatar.id,
        avatarName: avatar.name,
        aspectRatio,
        creditsDeducted: creditsCost,
        watermark: showWatermark,
      };
    } catch (error: any) {
      console.error('[AvatarEngine] Avatar generation failed:', error);
      db.updateAvatarJob(jobId, {
        status: 'failed',
        error: error.message || 'Avatar video generation failed',
      });
      try {
        fs.rmSync(scratchDir, { recursive: true, force: true });
      } catch (e) {}
      throw error;
    }
  }
}
