const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read and execute refs.js to get refsDB
const refsCode = fs.readFileSync(path.join(__dirname, '../data/refs.js'), 'utf8');
const refsCtx = { window: {}, console };
vm.createContext(refsCtx);
vm.runInContext(refsCode, refsCtx);
const refsDB = refsCtx.window.refsDB || refsCtx.refsDB;

// Read and execute topics.js to get topics
const topicsCode = fs.readFileSync(path.join(__dirname, '../data/topics.js'), 'utf8');
const topicsCtx = { window: {}, console };
vm.createContext(topicsCtx);
vm.runInContext(topicsCode, topicsCtx);
const topics = topicsCtx.window.topics || topicsCtx.topics;

console.log(`Loaded ${topics.length} questions and ${Object.keys(refsDB).length} reference definitions.`);

const issues = [];

topics.forEach((topic, idx) => {
  const text = topic.q || '';
  const title = topic.t || '';
  const exp = topic.exp || '';
  const refs = topic.refs || [];

  // Match years (4 digits starting with 20)
  const yearsInText = text.match(/20\d{2}/g) || [];
  const yearsInTitle = title.match(/20\d{2}/g) || [];
  const yearsInExp = exp.match(/20\d{2}/g) || [];
  const allYears = Array.from(new Set([...yearsInText, ...yearsInTitle, ...yearsInExp]));

  // Check references for KDIGO-specific mismatches
  refs.forEach(refKey => {
    const ref = refsDB[refKey];
    if (!ref) {
      issues.push({
        idx,
        qid: topic.qid,
        title,
        problem: `Reference key "${refKey}" not found in refsDB.`
      });
      return;
    }

    const refLabel = ref.label || '';
    const refYear = ref.ano;

    // Check for year mismatch (e.g., question says KDIGO 2021, but ref is 2025, or vice-versa)
    allYears.forEach(year => {
      const yearInt = parseInt(year, 10);
      if (refLabel.toLowerCase().includes('kdigo') || refKey.toLowerCase().includes('kdigo')) {
        // If the reference year is different from the year mentioned in the question/title/exp, check if it's a conflict
        if (yearInt !== refYear) {
          // If the reference label or key has a specific year, compare it
          const yearInLabelMatch = refLabel.match(/20\d{2}/);
          if (yearInLabelMatch) {
            const labelYear = parseInt(yearInLabelMatch[0], 10);
            if (labelYear !== yearInt) {
              issues.push({
                idx,
                qid: topic.qid,
                title,
                yearMentioned: yearInt,
                refKey,
                refLabel,
                refYear: labelYear,
                textSnippet: text.substring(0, 100) + '...',
                problem: `Year mismatch: Text mentions KDIGO ${yearInt} but reference is "${refLabel}" (${labelYear})`
              });
            }
          }
        }
      }
    });
  });
});

console.log(`\nFound ${issues.length} potential year mismatches:`);
issues.forEach((issue, i) => {
  console.log(`\n[${i + 1}] QID: ${issue.qid} | Index: ${issue.idx} | Title: "${issue.title}"`);
  console.log(`  - Problem: ${issue.problem}`);
  console.log(`  - Reference: ${issue.refKey} (${issue.refLabel})`);
  console.log(`  - Text snippet: ${issue.textSnippet}`);
});
