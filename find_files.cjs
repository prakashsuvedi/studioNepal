const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('manus_session.json', 'utf8'));
const events = raw.data.segments[0].events;

const tools = events.filter(e => e.type === 'toolUsed');
console.log('Total tools:', tools.length);

const filesCreated = new Map();

tools.forEach((t, idx) => {
  // Check text_editor commands
  if (t.tool === 'text_editor') {
    const desc = t.description || '';
    const brief = t.brief || '';
    // Look in raw event for arguments or content
    const str = JSON.stringify(t);
    // Find file paths
    const m = str.match(/nepalai[^\s"']+/g);
    if (m) {
      m.forEach(p => filesCreated.set(p, (filesCreated.get(p) || 0) + 1));
    }
  }
});

console.log('Files referenced in text_editor / tools:');
filesCreated.forEach((count, path) => console.log(`${path}: ${count} references`));

// Find the content of HUGGINGFACE_STARTUP_FIX_v1.9.1.md and release notes
events.forEach(e => {
  const s = JSON.stringify(e);
  if (s.includes('HUGGINGFACE_STARTUP_FIX_v1.9.1.md') && s.includes('###') || s.includes('```')) {
    // print snippet
    // console.log("Found MD snippet in event:", e.type);
  }
});
