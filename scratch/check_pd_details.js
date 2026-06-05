const fs = require('fs');

const topicsContent = fs.readFileSync('data/topics.js', 'utf8');
const sandbox = {};
eval(topicsContent.replace('const topics =', 'sandbox.topics ='));
const topics = sandbox.topics;

const targetIds = ['e33de909', 'faac594e', '3c1b02d7', '5d6677ab'];

topics.forEach(t => {
  if (targetIds.includes(t.qid)) {
    console.log(`QID: ${t.qid}, Title: ${t.t}`);
    console.log(`Question: ${t.q}`);
    console.log(`Refs:`, t.refs);
    console.log(`Explanation: ${t.exp.substring(0, 150)}...\n`);
  }
});
