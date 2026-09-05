import dotenv from 'dotenv';
dotenv.config();

import { postgresDb } from '../src/server/postgresDb.js';
import { serverGenerateAudio } from '../src/server/aiServices.js';
import { storageBucket } from '../src/server/storageBucket.js';

async function runTests() {
  console.log('--- STARTING REAL DATA & INTEGRATION VERIFICATION ---');

  // Test 1: Supabase PostgreSQL Connection & Data Operations
  console.log('\n[Test 1] Testing Supabase PostgreSQL Database...');
  try {
    const isConn = await postgresDb.testConnection();
    console.log('Postgres Connected:', isConn);

    if (isConn) {
      // Insert test sample data 1
      const testUser1 = `usr_test_${Date.now()}_1`;
      await postgresDb.query(
        `INSERT INTO users (id, email, name, role, tier, credits) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
        [testUser1, `prakash.test1_${Date.now()}@nepalai.tech`, 'Prakash Suvedi Test User 1', 'admin', 'pro_studio', 5000]
      );
      console.log('✅ PostgreSQL Test Record 1 Inserted:', testUser1);

      // Insert test sample data 2
      const testUser2 = `usr_test_${Date.now()}_2`;
      await postgresDb.query(
        `INSERT INTO users (id, email, name, role, tier, credits) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
        [testUser2, `maya.test2_${Date.now()}@nepalai.tech`, 'Maya Gurung Test User 2', 'client', 'creator', 1800]
      );
      console.log('✅ PostgreSQL Test Record 2 Inserted:', testUser2);

      // Verify Query Retrieval
      const res = await postgresDb.query('SELECT count(*) FROM users');
      console.log('✅ PostgreSQL Total Users Count in Database:', res.rows[0].count);
    }
  } catch (err) {
    console.error('❌ Supabase PostgreSQL Test Error:', err);
  }

  // Test 2: Storage Bucket Verification
  console.log('\n[Test 2] Testing Storage Bucket Media File Save...');
  try {
    const sampleBuffer = Buffer.from('NepalAI Studio Test Media Content Data Buffer');
    const saved = await storageBucket.saveMedia(`verification_test_${Date.now()}.txt`, sampleBuffer, 'text/plain');
    console.log('✅ Storage Bucket Saved File URL:', saved.url);
    console.log('✅ Storage Provider Used:', saved.provider);
    console.log('✅ Bytes Written:', saved.sizeBytes);
  } catch (err) {
    console.error('❌ Storage Bucket Test Error:', err);
  }

  // Test 3: Azure Speech Audio Generation Verification
  console.log('\n[Test 3] Testing Azure Cognitive Speech Audio Generation...');
  try {
    const sampleText = 'नमस्ते! नेपाल एआई स्टुडियोमा तपाईंलाई स्वागत छ। यो एजुर स्पीच परीक्षण हो।';
    const audioResult = await serverGenerateAudio(sampleText, 'sagar_ne', 'ne-NP');
    console.log('✅ Audio Generation Result URL:', audioResult.url);
    console.log('✅ Speech Voice:', audioResult.voice);
    console.log('✅ Audio Format:', audioResult.format);
    console.log('✅ Duration (seconds):', audioResult.duration);
  } catch (err) {
    console.error('❌ Audio Generation Test Error:', err);
  }

  console.log('\n--- VERIFICATION FINISHED ---');
  process.exit(0);
}

runTests();
