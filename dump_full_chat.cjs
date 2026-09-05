const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('manus_session.json', 'utf8'));
const events = raw.data.segments[0].events;

const chats = events.filter(e => e.type === 'chat');
let log = '=== ALL CHAT MESSAGES IN MANUS SESSION ===\n\n';

chats.forEach((c, idx) => {
  log += `--------------------------------------------------\n`;
  log += `[CHAT #${idx + 1}] SENDER: ${c.sender} | TYPE: ${c.messageType} | TIME: ${new Date(c.timestamp).toISOString()}\n`;
  const text = typeof c.content === 'string' ? c.content : JSON.stringify(c.content, null, 2);
  log += text + '\n';
  if (c.attachments && c.attachments.length) {
    log += `ATTACHMENTS: ${JSON.stringify(c.attachments, null, 2)}\n`;
  }
  log += '\n';
});

fs.writeFileSync('full_chat_history.txt', log);
console.log(`Wrote ${chats.length} chat messages to full_chat_history.txt`);

// Also find all fileOperationPromotion
const filePromos = events.filter(e => e.type === 'fileOperationPromotion');
let fileLog = '=== FILE OPERATIONS ===\n\n';
filePromos.forEach(f => {
  fileLog += JSON.stringify(f, null, 2) + '\n---\n';
});
fs.writeFileSync('file_operations.txt', fileLog);
console.log(`Wrote ${filePromos.length} file promotions to file_operations.txt`);
