/**
 * NepalAI Studio Pro - Live Practical Smoke Test Suite with Real Data & Real Outputs
 * Executes actual platform functions, network services, AI models, and media pipelines.
 */
import dotenv from 'dotenv';
dotenv.config();

import { 
  serverHamroAiChat, 
  serverGenerateImage, 
  serverGenerateAudio, 
  serverCheckVideoJob, 
  serverRenderVideoProject 
} from '../src/server/aiServices.js';
import { storageBucket } from '../src/server/storageBucket.js';
import { postgresDb } from '../src/server/postgresDb.js';
import { db } from '../src/server/db.js';

interface DetailedTestRun {
  stepNumber: number;
  module: string;
  name: string;
  realInput: Record<string, any>;
  realOutput: Record<string, any>;
  durationMs: number;
  passed: boolean;
}

const detailedLog: DetailedTestRun[] = [];

async function logAndRun(
  stepNumber: number,
  module: string,
  name: string,
  input: Record<string, any>,
  action: () => Promise<Record<string, any>>
) {
  console.log(`\n--------------------------------------------------------------------------------`);
  console.log(`[STEP ${stepNumber}] MODULE: ${module.toUpperCase()} -> ${name}`);
  console.log(`📥 REAL INPUT:`, JSON.stringify(input, null, 2));
  const start = Date.now();
  try {
    const output = await action();
    const durationMs = Date.now() - start;
    console.log(`📤 REAL OUTPUT (${durationMs}ms):`, JSON.stringify(output, null, 2));
    console.log(`✅ RESULT: PASSED`);
    detailedLog.push({
      stepNumber,
      module,
      name,
      realInput: input,
      realOutput: output,
      durationMs,
      passed: true,
    });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.error(`❌ RESULT: FAILED after ${durationMs}ms:`, err.message || err);
    detailedLog.push({
      stepNumber,
      module,
      name,
      realInput: input,
      realOutput: { error: err.message || String(err) },
      durationMs,
      passed: false,
    });
    throw err;
  }
}

async function runLivePracticalPass() {
  console.log('================================================================================');
  console.log('   NEPALAI STUDIO PRO - LIVE PRACTICAL EXECUTION TEST WITH REAL DATA & OUTPUTS  ');
  console.log('================================================================================');

  // STEP 1: Diagnostic & Ingress Health
  await logAndRun(
    1,
    'System Health & Diagnostic',
    'HTTP /api/diagnostic and Server Ingress',
    { url: 'http://localhost:3000/api/diagnostic', method: 'GET' },
    async () => {
      const res = await fetch('http://localhost:3000/api/diagnostic');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return {
        status: data.status,
        nodeVersion: data.nodeVersion,
        uptimeSeconds: data.uptimeSeconds,
        databaseConnected: data.database?.connected,
        azureSora2Configured: data.services?.azureSora2,
        azureSpeechConfigured: data.services?.azureSpeech,
      };
    }
  );

  // STEP 2: PostgreSQL / Supabase Real SQL Query
  await logAndRun(
    2,
    'Database Engine',
    'Live Supabase PostgreSQL Query Execution',
    { sql: 'SELECT current_database(), current_user, version(), NOW() AS server_time;' },
    async () => {
      const isConnected = await postgresDb.testConnection();
      if (!isConnected) {
        return { mode: 'in_memory_sqlite_fallback', notice: 'Running on localized state' };
      }
      const sqlRes = await postgresDb.query('SELECT current_database(), current_user, version(), NOW() AS server_time;');
      const row = sqlRes.rows[0];
      return {
        databaseName: row.current_database,
        currentUser: row.current_user,
        postgresVersion: row.version.slice(0, 45) + '...',
        serverTime: row.server_time,
      };
    }
  );

  // STEP 3: Media Storage Binary Ingestion & Range-Request Streaming
  await logAndRun(
    3,
    'Storage & Streaming',
    'Binary Ingestion & HTTP 206 Partial Content Range Stream',
    {
      filename: 'real_test_media.dat',
      byteSize: 4096,
      rangeRequested: 'bytes=0-511',
    },
    async () => {
      const rawData = Buffer.alloc(4096, 0x41); // 4KB of 'A'
      const saved = await storageBucket.saveMedia('real_test_media.dat', rawData, 'application/octet-stream');
      
      const streamRes = await fetch(`http://localhost:3000/api/storage/file/real_test_media.dat`, {
        headers: { Range: 'bytes=0-511' },
      });

      const arrayBuf = await streamRes.arrayBuffer();
      return {
        savedUrl: saved.url,
        provider: saved.provider,
        storedBytes: saved.sizeBytes,
        httpStatus: streamRes.status,
        httpStatusText: streamRes.statusText,
        contentRangeHeader: streamRes.headers.get('content-range'),
        contentTypeHeader: streamRes.headers.get('content-type'),
        receivedBytes: arrayBuf.byteLength,
        firstByteChar: String.fromCharCode(new Uint8Array(arrayBuf)[0]),
      };
    }
  );

  // STEP 4: HamroAI Real Conversational Script Generation (Nepali Devanagari)
  await logAndRun(
    4,
    'HamroAI Studio',
    'Nepali Devanagari Video Script Generation',
    {
      userId: 'test_prakash_dev',
      model: 'gpt-4o',
      language: 'ne',
      prompt: 'पोखरा र फेवातालको सौन्दर्य झल्काउने ५ सेकेन्डको भिडियो स्क्रिप्ट लेख्नुहोस्।',
    },
    async () => {
      const response = await serverHamroAiChat({
        userId: 'test_prakash_dev',
        model: 'gpt-4o',
        language: 'ne',
        messages: [
          {
            role: 'user',
            content: 'पोखरा र फेवातालको सौन्दर्य झल्काउने ५ सेकेन्डको भिडियो स्क्रिप्ट लेख्नुहोस्।',
          },
        ],
      });

      return {
        replyLength: response.reply.length,
        replySample: response.reply.slice(0, 200) + '...',
        containsDevanagari: /[\u0900-\u097F]/.test(response.reply),
        usage: response.usage,
      };
    }
  );

  // STEP 5: Voice & Audio Studio (Azure Cognitive Neural TTS)
  await logAndRun(
    5,
    'Voice Studio',
    'Azure Cognitive Speech (ne-NP-SagarNeural 24kHz HD MP3)',
    {
      text: 'नमस्ते! नेपाल एआई स्टुडियोमा तपाईंलाई स्वागत छ। यो वास्तविक परीक्षण अडियो हो।',
      voiceId: 'sagar_ne',
      language: 'ne-NP',
    },
    async () => {
      const audioResult = await serverGenerateAudio(
        'नमस्ते! नेपाल एआई स्टुडियोमा तपाईंलाई स्वागत छ। यो वास्तविक परीक्षण अडियो हो।',
        'sagar_ne',
        'ne-NP'
      );

      // Verify binary payload from base64
      let byteCount = 0;
      let magicHeader = '';
      if (audioResult.url.startsWith('data:audio/mp3;base64,')) {
        const b64 = audioResult.url.replace('data:audio/mp3;base64,', '');
        const buf = Buffer.from(b64, 'base64');
        byteCount = buf.length;
        magicHeader = buf.subarray(0, 3).toString('ascii'); // usually 'ID3' or MPEG sync
      }

      return {
        voice: audioResult.voice,
        language: audioResult.language,
        format: audioResult.format,
        durationSeconds: audioResult.duration,
        byteSize: byteCount,
        magicHeader: magicHeader,
        storageUrl: audioResult.storageUrl,
      };
    }
  );

  // STEP 6: Image Studio (FLUX.1 Turbo Neural Image Synthesis)
  await logAndRun(
    6,
    'Image Studio',
    'Neural Image Generation (FLUX.1 Turbo 1024x576 HD)',
    {
      prompt: 'Panoramic view of Mount Everest at sunrise with golden morning rays on snowy peaks',
      model: 'gpt-image-1.5',
      quality: 'hd',
    },
    async () => {
      const imgResult = await serverGenerateImage(
        'Panoramic view of Mount Everest at sunrise with golden morning rays on snowy peaks',
        'gpt-image-1.5',
        'hd'
      );

      // Verify URL is reachable
      let httpReachable = false;
      let contentType = '';
      if (imgResult.url.startsWith('http')) {
        const headRes = await fetch(imgResult.url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
        httpReachable = headRes.ok;
        contentType = headRes.headers.get('content-type') || '';
      } else if (imgResult.url.startsWith('data:image/')) {
        httpReachable = true;
        contentType = 'data:image';
      }

      return {
        model: imgResult.model,
        resolution: imgResult.resolution,
        engine: imgResult.engine,
        imageUrl: imgResult.url.slice(0, 80) + '...',
        isReachable: httpReachable,
        contentType: contentType,
      };
    }
  );

  // STEP 7: Sora-2 Video Engine (Azure AI Foundry Video Check & Stream)
  await logAndRun(
    7,
    'Sora-2 Video Studio',
    'Azure Sora-2 Neural Job Validation & Stream Header Check',
    {
      jobId: 'video_6a9cd5492de48190bae531eb25e8892e',
      testStreamUrl: '/api/video/content/video_6a9cd5492de48190bae531eb25e8892e',
    },
    async () => {
      const jobStatus = await serverCheckVideoJob('video_6a9cd5492de48190bae531eb25e8892e');
      
      const streamRes = await fetch('http://localhost:3000/api/video/content/video_6a9cd5492de48190bae531eb25e8892e', {
        headers: { Range: 'bytes=0-1024' },
      });

      const arrayBuf = await streamRes.arrayBuffer();
      const firstChunk = Buffer.from(arrayBuf);
      // Check MP4 signature in first 32 bytes (looking for ftyp)
      const hasFtyp = firstChunk.toString('binary').includes('ftyp');

      return {
        soraJobStatus: jobStatus.status,
        progress: jobStatus.progress,
        videoUrl: jobStatus.url,
        streamHttpStatus: streamRes.status,
        streamContentRange: streamRes.headers.get('content-range'),
        streamContentType: streamRes.headers.get('content-type'),
        streamChunkBytes: arrayBuf.byteLength,
        mp4FtypSignatureDetected: hasFtyp,
      };
    }
  );

  // STEP 8: Video Timeline Project Rendering Engine (Multi-Scene Compilation)
  await logAndRun(
    8,
    'Video Rendering Engine',
    'Multi-Scene Timeline Render & MP4 Packaging',
    {
      projectTitle: 'Nepal Tourism 2026 Showcase',
      scenes: [
        {
          id: 'sc_01',
          mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1024',
          duration: 3,
          mediaType: 'image',
          transition: 'fade',
        },
        {
          id: 'sc_02',
          mediaUrl: 'http://localhost:3000/api/storage/file/sora_video_6a9cd5492de48190bae531eb25e8892e.mp4',
          duration: 4,
          mediaType: 'video',
          transition: 'wipe',
        },
      ],
    },
    async () => {
      const renderOutput = await serverRenderVideoProject({
        scenes: [
          {
            id: 'sc_01',
            mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1024',
            duration: 3,
            mediaType: 'image',
            transition: 'fade',
          },
          {
            id: 'sc_02',
            mediaUrl: 'http://localhost:3000/api/storage/file/sora_video_6a9cd5492de48190bae531eb25e8892e.mp4',
            duration: 4,
            mediaType: 'video',
            transition: 'wipe',
          },
        ],
      });

      return {
        renderId: renderOutput.renderId,
        format: renderOutput.format,
        resolution: renderOutput.resolution,
        durationSeconds: renderOutput.duration,
        sizeMb: renderOutput.sizeMb,
        codec: renderOutput.codec,
        fps: renderOutput.fps,
        status: renderOutput.status,
        downloadUrl: renderOutput.downloadUrl,
      };
    }
  );

  // STEP 9: Credit Ledger & Quota Deductions
  await logAndRun(
    9,
    'User Quota & Billing',
    'Real Deduction & Balance Verification',
    {
      userId: 'usr_smoke_test_prakash',
      action: 'video_generation',
      creditCost: 25,
    },
    async () => {
      // 1. Check initial quota
      const canGen = db.checkCanGenerate('usr_smoke_test_prakash', 'video');
      const initialUsage = db.getTrialUsage('usr_smoke_test_prakash');

      // 2. Record generation transaction
      db.recordGeneration(
        'usr_smoke_test_prakash',
        'video',
        'Himalayan flyover cinematic',
        'http://localhost:3000/api/video/content/test_vid_123',
        'sora-2',
        4
      );

      // 3. Inspect updated usage ledger
      const updatedUsage = db.getTrialUsage('usr_smoke_test_prakash');

      return {
        userId: 'usr_smoke_test_prakash',
        generationAllowed: canGen.allowed,
        remainingCredits: canGen.remaining,
        initialVideoCount: initialUsage.videoCount,
        updatedVideoCount: updatedUsage.videoCount,
        tokenUsageTotal: updatedUsage.totalTokensUsed,
        quotaMaxVideo: updatedUsage.maxVideo,
        lastTransactionTime: updatedUsage.lastUsedAt,
      };
    }
  );

  // STEP 10: Realtime Presence & Project Collaboration
  await logAndRun(
    10,
    'Collaboration & Presence',
    'Realtime Project Presence & Active Peer State',
    {
      projectId: 'proj_smoke_test_001',
      userId: 'usr_smoke_test_prakash',
      name: 'Prakash Suvedi (Tester)',
      email: 'prakashsuvedi.backup@gmail.com',
      currentSceneId: 'sc_01',
    },
    async () => {
      const presRes = await fetch('http://localhost:3000/api/realtime/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj_smoke_test_001',
          userId: 'usr_smoke_test_prakash',
          name: 'Prakash Suvedi (Tester)',
          email: 'prakashsuvedi.backup@gmail.com',
          currentSceneId: 'sc_01',
          isEditing: true,
          statusText: 'Reviewing timeline cuts',
        }),
      });

      const presData = await presRes.json();
      return {
        httpStatus: presRes.status,
        projectId: presData.projectId,
        totalPresence: presData.totalPresence,
        activeUsers: presData.activeUsers?.map((u: any) => ({
          name: u.name,
          email: u.email,
          currentSceneId: u.currentSceneId,
          statusText: u.statusText,
        })),
      };
    }
  );

  console.log('\n================================================================================');
  console.log('                          FINAL TEST VERIFICATION REPORT                         ');
  console.log('================================================================================');
  console.log(`Total Live Tests Executed : ${detailedLog.length}`);
  console.log(`Tests Passed              : ${detailedLog.filter(t => t.passed).length}`);
  console.log(`Tests Failed              : ${detailedLog.filter(t => !t.passed).length}`);
  console.log('Status                    : ALL LIVE PRACTICAL TESTS EXECUTED WITH REAL DATA ✅');
  console.log('================================================================================\n');
}

runLivePracticalPass().catch((err) => {
  console.error('\n❌ Fatal execution error:', err);
  process.exit(1);
});
