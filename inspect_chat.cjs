const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('manus_session.json', 'utf8'));
const events = raw.data.segments[0].events;

console.log('=== CHAT MESSAGES ===');
const chats = events.filter(e => e.type === 'chat');
chats.forEach((c, idx) => {
  console.log(`\n[CHAT ${idx}] Sender: ${c.sender} | Type: ${c.messageType}`);
  console.log('Content:', typeof c.content === 'string' ? c.content.slice(0, 500) : JSON.stringify(c.content).slice(0, 500));
  if (c.attachments?.length) {
    console.log('Attachments:', JSON.stringify(c.attachments));
  }
});

console.log('\n=== PLAN STEPS ===');
const planSteps = events.filter(e => e.type === 'newPlanStep' || e.type === 'planUpdate');
const uniqueSteps = new Map();
events.filter(e => e.type === 'newPlanStep').forEach(s => {
  uniqueSteps.set(s.id, s.title || s.description || s.content);
});
console.log('Plan Steps count:', uniqueSteps.size);
uniqueSteps.forEach((val, id) => console.log(`Step [${id}]:`, val));

console.log('\n=== FILE PROMOTIONS (Files Created/Edited) ===');
events.filter(e => e.type === 'fileOperationPromotion').forEach(f => {
  console.log(JSON.stringify(f, null, 2));
});
