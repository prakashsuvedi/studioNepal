/**
 * NepalAI Studio - Database Transaction Validation & Supabase RPC Verification Suite
 */

import {
  validateSceneTransaction,
  validateSubtitleTransaction,
  validateAudioTrackTransaction,
  validateProjectTransactionPayload,
  validateCreditTransactionPayload,
  dbTransactions,
} from '../src/lib/dbTransactions';
import type { Scene } from '../src/types';
import type { SubtitleItem } from '../src/components/SubtitleEditorModal';

async function runDatabaseTransactionTests() {
  console.log('================================================================');
  console.log('🧪 Running Supabase RPC & Database Transaction Validation Suite');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`, details || '');
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // -------------------------------------------------------------
  // Test Group 1: Scene Pre-Flight Validation
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Scene Pre-Flight Validation ---');

  const validScene: Scene = {
    id: 'sc_01',
    title: 'Himalayan Sunrise',
    duration: 4.5,
    prompt: 'Hyper-realistic cinematic sunrise over Mount Everest',
    mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
    mediaType: 'image',
    aspectRatio: '16:9',
    motion: 'pan_right',
    transition: 'fade',
    textOverlay: 'Morning in Himalayas',
    textColor: '#ffffff',
    textFont: 'devanagari',
    textPosition: 'bottom',
    filter: 'vibrant',
    volume: 80,
  };

  const sceneErrors = validateSceneTransaction(validScene, 0);
  assert(sceneErrors.length === 0, 'Valid scene passes validation with 0 errors');

  const invalidScene1 = { ...validScene, duration: -2 };
  const errors1 = validateSceneTransaction(invalidScene1, 0);
  assert(errors1.some((e) => e.code === 'INVALID_DURATION'), 'Rejects negative scene duration with INVALID_DURATION code');

  const invalidScene2 = { ...validScene, duration: 4000 };
  const errors2 = validateSceneTransaction(invalidScene2, 0);
  assert(errors2.some((e) => e.code === 'DURATION_EXCEEDS_LIMIT'), 'Rejects excessive scene duration with DURATION_EXCEEDS_LIMIT');

  const invalidScene3 = { ...validScene, id: '' };
  const errors3 = validateSceneTransaction(invalidScene3, 0);
  assert(errors3.some((e) => e.code === 'MISSING_SCENE_ID'), 'Rejects missing scene ID');

  // -------------------------------------------------------------
  // Test Group 2: Subtitle Validation
  // -------------------------------------------------------------
  console.log('\n--- Test Group 2: Subtitle Pre-Flight Validation ---');

  const validSubtitle: SubtitleItem = {
    id: 'sub_01',
    index: 1,
    startTimeSec: 0,
    endTimeSec: 4.5,
    text: 'Cinematic view of Everest',
    devanagariText: 'सगरमाथाको सुन्दर दृश्य',
  };

  const subErrors = validateSubtitleTransaction(validSubtitle, 0);
  assert(subErrors.length === 0, 'Valid bilingual subtitle passes validation');

  const invalidSubTiming: SubtitleItem = {
    ...validSubtitle,
    startTimeSec: 5.0,
    endTimeSec: 2.0, // End is before start
  };
  const subErrors2 = validateSubtitleTransaction(invalidSubTiming, 0);
  assert(subErrors2.some((e) => e.code === 'END_BEFORE_START'), 'Rejects subtitle where endTime is earlier than startTime');

  const emptySub: SubtitleItem = {
    ...validSubtitle,
    text: '',
    devanagariText: '',
  };
  const subErrors3 = validateSubtitleTransaction(emptySub, 0);
  assert(subErrors3.some((e) => e.code === 'EMPTY_SUBTITLE_TEXT'), 'Warns on empty subtitle text content');

  // -------------------------------------------------------------
  // Test Group 3: Project Atomic Payload Validation
  // -------------------------------------------------------------
  console.log('\n--- Test Group 3: Atomic Project State Payload Validation ---');

  const validProjectPayload = {
    projectId: 'proj_himalaya_01',
    userId: 'usr_prakash',
    projectTitle: 'Everest Documentary Promo',
    aspectRatio: '16:9' as const,
    scenes: [
      validScene,
      { ...validScene, id: 'sc_02', title: 'Sherpa Village', duration: 5.0 },
    ],
    subtitles: [
      validSubtitle,
      { id: 'sub_02', index: 2, startTimeSec: 4.5, endTimeSec: 9.5, text: 'Namche Bazaar', devanagariText: 'नाम्चे बजार' },
    ],
    audioTracks: [
      { id: 'trk_bgm', name: 'Flute Ambient', url: '/sample-media/nepali_folk_flute.mp3', type: 'bgm' as const, duration: 9.5, volume: 60 },
    ],
  };

  const projectValidation = validateProjectTransactionPayload(validProjectPayload);
  assert(projectValidation.valid === true, 'Complete multi-scene + multi-subtitle project passes atomic validation');
  assert(projectValidation.sanitizedPayload?.scenes.length === 2, 'Sanitized payload preserves scene count');

  // Duplicate Scene IDs Check
  const payloadWithDuplicateIds = {
    ...validProjectPayload,
    scenes: [validScene, { ...validScene, id: 'sc_01' }], // Duplicate ID 'sc_01'
  };
  const dupValidation = validateProjectTransactionPayload(payloadWithDuplicateIds);
  assert(dupValidation.valid === false, 'Detects and rejects duplicate Scene IDs across the sequence');
  assert(dupValidation.errors.some((e) => e.code === 'DUPLICATE_SCENE_ID'), 'Returns DUPLICATE_SCENE_ID error code');

  // -------------------------------------------------------------
  // Test Group 4: Credit Deduction Validation
  // -------------------------------------------------------------
  console.log('\n--- Test Group 4: Credit Deduction Validation ---');

  const creditValidation = validateCreditTransactionPayload({
    userId: 'usr_prakash',
    creditCost: 15,
    actionType: 'sora_render',
    actionDescription: 'Render 1080p Sora-2 Video',
  });
  assert(creditValidation.valid === true, 'Valid credit deduction payload passes');

  const badCreditValidation = validateCreditTransactionPayload({
    userId: '',
    creditCost: -5,
    actionType: 'sora_render',
    actionDescription: 'Render 1080p Sora-2 Video',
  });
  assert(badCreditValidation.valid === false, 'Rejects invalid credit cost and missing userId');

  // -------------------------------------------------------------
  // Test Group 5: Atomic Multi-Step Execution & Rollback Handling
  // -------------------------------------------------------------
  console.log('\n--- Test Group 5: Atomic Multi-Step Execution & Rollback ---');

  // Successful atomic save
  const atomicSaveResult = await dbTransactions.atomicSaveSceneAndSubtitles(validProjectPayload, {
    autoSnapshot: true,
    validateStrictly: true,
    transactionTitle: 'Integration Test Save',
  });

  assert(atomicSaveResult.success === true, 'atomicSaveSceneAndSubtitles completes successfully');
  assert(atomicSaveResult.status === 'committed', 'Transaction status is committed');
  assert(atomicSaveResult.rollbackApplied === false, 'No rollback applied on successful transaction');
  assert(atomicSaveResult.data?.scenesCount === 2, 'Scene count matches committed payload');

  // Failing atomic save with invalid payload
  const badAtomicSaveResult = await dbTransactions.atomicSaveSceneAndSubtitles(payloadWithDuplicateIds, {
    validateStrictly: true,
  });

  assert(badAtomicSaveResult.success === false, 'Rejects invalid atomic payload before DB commit');
  assert(badAtomicSaveResult.status === 'failed', 'Status is marked as failed');
  assert(badAtomicSaveResult.validation.errors.length > 0, 'Validation errors returned in atomic result');

  // Transaction history audit check
  const history = dbTransactions.getTransactionHistory();
  assert(history.length >= 2, 'Transaction history tracks all committed and failed transactions');
  assert(history[0].transactionId.startsWith('tx_atomic_'), 'Transaction IDs generated with structured prefix');

  console.log('\n================================================================');
  console.log(`🎉 All ${passedTests}/${totalTests} Database Transaction & Validation Tests PASSED!`);
  console.log('================================================================\n');
}

runDatabaseTransactionTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
