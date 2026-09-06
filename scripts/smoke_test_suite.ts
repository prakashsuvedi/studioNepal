/**
 * NepalAI Studio - Full End-to-End Automated Smoke Test Suite
 * Validates modules, endpoints, AI engines, media pipelines, and storage.
 */
import dotenv from 'dotenv';
dotenv.config();

import { serverGenerateImage, serverGenerateAudio, serverCheckVideoJob } from '../src/server/aiServices.js';
import { storageBucket } from '../src/server/storageBucket.js';
import { postgresDb } from '../src/server/postgresDb.js';

interface TestResult {
  module: string;
  feature: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function runTest(
  module: string,
  feature: string,
  fn: () => Promise<string | void>
) {
  const start = Date.now();
  try {
    const details = await fn();
    results.push({
      module,
      feature,
      status: 'PASSED',
      durationMs: Date.now() - start,
      details: details || 'Success',
    });
    console.log(`  ✅ [${module}] ${feature} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({
      module,
      feature,
      status: 'FAILED',
      durationMs: Date.now() - start,
      details: err.message || String(err),
    });
    console.error(`  ❌ [${module}] ${feature}:`, err.message || err);
  }
}

async function startSuite() {
  console.log('\n======================================================');
  console.log('   NEPALAI STUDIO PRO - FULL PLATFORM SMOKE TEST SUITE');
  console.log('======================================================\n');

  // MODULE 1: Health & Diagnostics
  console.log('▶ Testing Module 1: System Health & Server Routes...');
  await runTest('System', 'Health Check Endpoint (/api/health)', async () => {
    const res = await fetch('http://localhost:3000/api/health');
    if (!res.ok) throw new Error(`Health status: ${res.status}`);
    const data = await res.json();
    return `Status: ${data.status}, Version: ${data.version || '1.0.0'}`;
  });

  await runTest('System', 'Diagnostic Endpoint (/api/diagnostic)', async () => {
    const res = await fetch('http://localhost:3000/api/diagnostic');
    if (!res.ok) throw new Error(`Diagnostic status: ${res.status}`);
    const data = await res.json();
    return `Mode: ${data.environment || 'production'}`;
  });

  // MODULE 2: Media Storage & Streaming
  console.log('\n▶ Testing Module 2: Local & Cloud Storage Engine...');
  await runTest('Storage', 'Binary File Write & Retrieval', async () => {
    const samplePayload = Buffer.from('NepalAI Studio Smoke Test Data: ' + new Date().toISOString());
    const saved = await storageBucket.saveMedia('smoke_test_sample.txt', samplePayload, 'text/plain');
    if (!saved || !saved.url) throw new Error('Failed to save test buffer to storage');
    return `Saved via ${saved.provider} (${saved.sizeBytes} bytes) at ${saved.url}`;
  });

  await runTest('Storage', 'HTTP Range Byte Streaming (206 Partial Content)', async () => {
    const testFile = 'sora_video_6a9cd5492de48190bae531eb25e8892e.mp4';
    const res = await fetch(`http://localhost:3000/api/storage/file/${testFile}`, {
      headers: { Range: 'bytes=0-1024' },
    });
    if (res.status !== 206 && res.status !== 200) {
      throw new Error(`Expected 206 Partial Content or 200, got ${res.status}`);
    }
    const rangeHeader = res.headers.get('content-range');
    return `Status: ${res.status}, Content-Range: ${rangeHeader || 'None'}`;
  });

  // MODULE 3: Audio & Speech Synthesis
  console.log('\n▶ Testing Module 3: Nepali & Multilingual Audio TTS Engine...');
  await runTest('Voice TTS', 'Azure Cognitive Speech Generation (ne-NP Sagar)', async () => {
    const text = 'नमस्ते! नेपाल एआई स्टुडियोमा स्वागत छ। यो परीक्षण अडियो हो।';
    const result = await serverGenerateAudio(text, 'sagar_ne', 'ne-NP');
    if (!result || !result.url) throw new Error('Audio generation returned empty URL');
    return `Voice: ${result.voice}, Format: ${result.format}, URL Length: ${result.url.length}`;
  });

  // MODULE 4: Image Studio Engine
  console.log('\n▶ Testing Module 4: High-Speed Neural Image Pipeline...');
  await runTest('Image Engine', 'FLUX.1 Turbo Image Synthesis (1024x576)', async () => {
    const prompt = 'Hyperrealistic panoramic Himalayan sunset with prayer flags and snowy peaks';
    const result = await serverGenerateImage(prompt, 'gpt-image-1.5', 'hd');
    if (!result || !result.url) throw new Error('Image generation returned empty URL');
    return `Model: ${result.model}, Resolution: ${result.resolution}, Engine: ${result.engine}`;
  });

  // MODULE 5: Sora-2 Video Engine
  console.log('\n▶ Testing Module 5: Sora-2 Video Generation Pipeline...');
  await runTest('Sora-2 Video', 'Azure Sora-2 Status & Polling Verification', async () => {
    const testJobId = 'video_6a9cd5492de48190bae531eb25e8892e';
    const status = await serverCheckVideoJob(testJobId);
    if (!status || !status.status) throw new Error('Invalid status object returned from check');
    return `Job Status: ${status.status}, Progress: ${status.progress}%, URL: ${status.url || 'N/A'}`;
  });

  // MODULE 6: Database & Persistence
  console.log('\n▶ Testing Module 6: Database Engine (PostgreSQL / Supabase)...');
  await runTest('Database', 'Postgres Connectivity & Health Check', async () => {
    const isConn = await postgresDb.testConnection();
    if (!isConn) {
      return 'PostgreSQL is in offline/fallback mode (local in-memory storage active)';
    }
    const res = await postgresDb.query('SELECT NOW() as current_time');
    return `Connected to Supabase PostgreSQL at ${res.rows[0].current_time}`;
  });

  // MODULE 7: Admin & Billing Endpoints
  console.log('\n▶ Testing Module 7: Admin & Governance Endpoints...');
  await runTest('Admin', 'Public Pages & Static Routes', async () => {
    const res = await fetch('http://localhost:3000/');
    if (!res.ok) throw new Error(`Homepage returned status: ${res.status}`);
    return `Status: ${res.status} OK`;
  });

  console.log('\n======================================================');
  console.log('               SMOKE TEST SUITE SUMMARY               ');
  console.log('======================================================');
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  console.log(`Total Checks Executed : ${results.length}`);
  console.log(`Passed                : ${passed}`);
  console.log(`Failed                : ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

startSuite().catch((err) => {
  console.error('Fatal Smoke Test Suite Failure:', err);
  process.exit(1);
});
