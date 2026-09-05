const https = require('https');
const fs = require('fs');

async function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers
      }
    }, res => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: responseData }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  const sessionId = 'KJ1MwOfwqqKWynaZWcAu7u';
  
  // Try common Manus endpoints
  const endpoints = [
    `https://api.manus.im/share/${sessionId}`,
    `https://api.manus.im/api/share/${sessionId}`,
    `https://api.manus.im/v1/share/${sessionId}`,
    `https://api.manus.im/session/share/${sessionId}`,
    `https://api.manus.im/v1/session/share/${sessionId}`,
    `https://api.manus.im/trpc/share.get?input=${encodeURIComponent(JSON.stringify({ shareId: sessionId }))}`,
    `https://api.manus.im/trpc/share.getSession?input=${encodeURIComponent(JSON.stringify({ shareId: sessionId }))}`,
    `https://api.manus.im/trpc/share.getSession?input=${encodeURIComponent(JSON.stringify({ sessionId }))}`,
    `https://manus.im/api/share/${sessionId}`,
    `https://manus.im/api/session/${sessionId}`
  ];

  for (const ep of endpoints) {
    try {
      const res = await get(ep);
      console.log(`GET ${ep} => status: ${res.status}, len: ${res.body.length}`);
      if (res.status === 200 && res.body.length > 50) {
        console.log(`FOUND DATA: ${res.body.slice(0, 300)}`);
        fs.writeFileSync('session_data.json', res.body);
      }
    } catch (e) {
      console.log(`ERR ${ep}: ${e.message}`);
    }
  }
}

run();
