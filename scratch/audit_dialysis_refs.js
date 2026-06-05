const fs = require('fs');

const topicsContent = fs.readFileSync('data/topics.js', 'utf8');
const sandbox = {};
eval(topicsContent.replace('const topics =', 'sandbox.topics ='));
const topics = sandbox.topics;

const refsContent = fs.readFileSync('data/refs.js', 'utf8');
const refsSandbox = {};
eval(refsContent.replace('const refsDB =', 'refsSandbox.refsDB ='));
const refsDB = refsSandbox.refsDB;

console.log('Dialysis questions audit:');
let issuesCount = 0;

topics.forEach((t, i) => {
  const text = (t.q + ' ' + t.t + ' ' + t.exp).toLowerCase();
  
  // Check if it is a peritoneal dialysis question
  const isPD = text.includes('peritoneal') || text.includes(' dp ') || text.includes('capd') || text.includes('apd');
  
  if (isPD) {
    // Check if it references any HD-specific reference keys
    const hdRefs = t.refs.filter(refKey => {
      const ref = refsDB[refKey];
      if (!ref) return false;
      const refText = (ref.label + ' ' + (ref.journal || '') + ' ' + (ref.resumo || '')).toLowerCase();
      // HD-specific terms: hemodialysis, hemodiálise, hd
      return refText.includes('hemodialysis') || refText.includes('hemodiálise') || refKey === 'kdigo_dialise';
    });
    
    if (hdRefs.length > 0) {
      issuesCount++;
      console.log(`\nIssue #${issuesCount}: Question Index ${i}, ID: ${t.qid}, Title: "${t.t}"`);
      console.log(`- Question text contains Peritoneal Dialysis terms.`);
      console.log(`- Mismatched HD references:`, hdRefs.map(k => `${k} (${refsDB[k].label})`));
      console.log(`- All references on question:`, t.refs);
    }
  }
});

console.log(`\nFound ${issuesCount} questions with potential dialysis reference mismatch.`);
