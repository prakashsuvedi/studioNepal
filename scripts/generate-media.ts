import { ensureSampleMediaFiles } from '../src/server/sampleMediaGenerator.js';

async function main() {
  console.log('Starting media asset generation...');
  await ensureSampleMediaFiles();
  console.log('All sample media and avatar assets successfully ensured.');
}

main().catch((err) => {
  console.error('Error generating media:', err);
  process.exit(1);
});
