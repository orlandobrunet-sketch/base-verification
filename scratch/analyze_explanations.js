const fs = require('fs');

const content = fs.readFileSync('data/topics.js', 'utf8');
// Evaluate the topics variable by stripping the const declaration
const sandbox = {};
eval(content.replace('const topics =', 'sandbox.topics ='));
const topics = sandbox.topics;

console.log('Total topics:', topics.length);

const patterns = [
  /alternativa\s+['"][^'"]+\.\.\.['"]/gi,
  /alternativas\s+['"][^'"]+\.\.\.['"]/gi,
  /opção\s+['"][^'"]+\.\.\.['"]/gi,
  /opções\s+['"][^'"]+\.\.\.['"]/gi,
  /alternativa\s+['"][^'"]+['"]/gi, // let's see how general it is
];

const matches = [];
topics.forEach((t, index) => {
  const exp = t.exp || '';
  // Check for the pattern
  const match = exp.match(/alternativa\s+['"][^'"]+\.\.\.['"]/i) || exp.match(/opção\s+['"][^'"]+\.\.\.['"]/i);
  if (match) {
    matches.push({
      index,
      qid: t.qid,
      ans: t.ans,
      correctText: t.opts[t.ans],
      match: match[0],
      exp: exp
    });
  }
});

console.log('Found', matches.length, 'matches containing ellipses.');
console.log('Sample matches:');
matches.slice(0, 15).forEach(m => {
  console.log(`\nQID: ${m.qid}, Ans Index: ${m.ans} (Letter: ${String.fromCharCode(65 + m.ans)})`);
  console.log(`Match: ${m.match}`);
  console.log(`Correct Option: ${m.correctText}`);
  console.log(`Snippet: ${m.exp.substring(0, 200)}...`);
});
