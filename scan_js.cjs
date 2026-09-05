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

async function search() {
  const html = fs.readFileSync('manus_page.html', 'utf8');
  const jsUrls = Array.from(new Set(html.match(/https:\/\/files\.manuscdn\.com\/webapp\/_next\/static\/chunks\/[a-zA-Z0-9_\-\.]+\.js/g) || []));
  console.log(`Found ${jsUrls.length} JS files. Downloading and scanning...`);

  for (const url of jsUrls) {
    try {
      const content = await get(url);
      if (content.includes('/share/') || content.includes('shareId') || content.includes('shareSession') || content.includes('ShareSession')) {
        console.log(`Found match in ${url}`);
        // find patterns
        const r = /([a-zA-Z0-9_\/.:\-]+(?:share|session)[a-zA-Z0-9_\/.:\-]+)/gi;
        const matches = content.match(r) || [];
        console.log('Matches:', matches.slice(0, 10));
        
        // Also look for endpoint definitions or fetch/axios/rpc calls
        const endpoints = content.match(/["'`](https?:\/\/[^"'`]+|\/api\/[^"'`]+|\/v1\/[^"'`]+|\/rpc\/[^"'`]+)["'`]/g) || [];
        if (endpoints.length) {
          console.log('Endpoints in file:', endpoints.slice(0, 10));
        }
      }
    } catch (e) {}
  }
}

search();
