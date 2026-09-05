const https = require('https');
const fs = require('fs');

async function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function inspect() {
  const content = await get('https://files.manuscdn.com/webapp/_next/static/chunks/40znial8_hg44.js');
  // Find where getSessionV2 or share is defined
  const idx = content.indexOf('/api/chat/getSessionV2');
  if (idx !== -1) {
    console.log('Context around getSessionV2:');
    console.log(content.slice(Math.max(0, idx - 300), Math.min(content.length, idx + 700)));
  }

  // Also check for "share" endpoints in this file
  const shareIdx = content.indexOf('share');
  console.log('Share mentions in file:', (content.match(/\/api\/[^"'\`\s]+/g) || []));
}

inspect();
