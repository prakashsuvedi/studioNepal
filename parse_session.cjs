const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('manus_session.json', 'utf8'));
const session = raw.data;

console.log('=== SESSION INFO ===');
console.log('Title:', session.title);
console.log('Created At:', session.createdAt);
console.log('Segments count:', session.segments?.length);

const summary = {
  title: session.title,
  createdAt: session.createdAt,
  agentTaskMode: session.agentTaskMode,
  userPrompts: [],
  toolCalls: [],
  agentResponses: [],
  filesCreated: []
};

if (session.segments) {
  session.segments.forEach((seg, sIdx) => {
    console.log(`\n--- Segment ${sIdx} (events: ${seg.events?.length}) ---`);
    seg.events?.forEach((ev, eIdx) => {
      // Check event types
      const t = ev.type || ev.eventType;
      if (ev.userMessage || ev.message?.role === 'user' || t === 'user_message') {
        const msg = ev.userMessage || ev.message?.content || ev.content || JSON.stringify(ev);
        summary.userPrompts.push({ sIdx, eIdx, msg });
        console.log(`[USER PROMPT]:`, typeof msg === 'string' ? msg.slice(0, 300) : msg);
      } else if (ev.agentMessage || ev.message?.role === 'assistant' || t === 'agent_message') {
        const msg = ev.agentMessage || ev.message?.content || ev.content;
        summary.agentResponses.push({ sIdx, eIdx, msg });
        console.log(`[AGENT MESSAGE]:`, typeof msg === 'string' ? msg.slice(0, 300) : msg);
      } else if (t?.includes('tool') || ev.toolCall || ev.toolName) {
        summary.toolCalls.push({ sIdx, eIdx, type: t, tool: ev.toolName || ev.toolCall?.name, input: ev.toolCall?.arguments || ev.input });
      }
    });
  });
}

fs.writeFileSync('parsed_summary.json', JSON.stringify(summary, null, 2));
console.log('\nTool calls total:', summary.toolCalls.length);
console.log('User prompts total:', summary.userPrompts.length);
console.log('Agent responses total:', summary.agentResponses.length);
