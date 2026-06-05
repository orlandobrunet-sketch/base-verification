const fs = require('fs');

const filePath = 'data/topics.js';
const content = fs.readFileSync(filePath, 'utf8');

// Parse topics
const sandbox = {};
eval(content.replace('const topics =', 'sandbox.topics ='));
const topics = sandbox.topics;

let totalReplacements = 0;
const replacementsLog = [];

topics.forEach((t, qIndex) => {
  if (!t.exp || !t.opts) return;

  const originalExp = t.exp;
  let exp = t.exp;
  const letters = ['A', 'B', 'C', 'D'];

  // Let's look for patterns like:
  // (alternativa|opção|alternativas|opções)\s+['"‘“]([^'"’“”]+)['"’“”]
  // We want to capture the leading word (alternativa/opção/etc.), the quotes, and the text inside.
  
  // We can do this by searching for all quotes: '...', "...", ‘...’, “...”
  const quoteRegex = /(['"‘“])([^'"’“”]+)(['"’“”])/g;
  let match;
  
  // We'll collect all potential replacements first to avoid indexing issues during replacement
  const replacementsToMake = [];

  while ((match = quoteRegex.exec(originalExp)) !== null) {
    const fullMatch = match[0]; // e.g. "'Vasodilatação...'"
    const innerText = match[2].trim(); // e.g. "Vasodilatação..."
    
    // Clean innerText of trailing dots
    const cleanedText = innerText.replace(/\.\.\.+$|…+$/, '').trim();
    
    if (cleanedText.length < 5) continue; // too short to match reliably

    // Try to find which option this refers to
    for (let optIdx = 0; optIdx < t.opts.length; optIdx++) {
      const optText = t.opts[optIdx];
      const letter = letters[optIdx];
      
      // Check if it's a prefix or match
      // Also check if the option text starts with the cleaned text or contains it near the start
      const isMatch = optText.toLowerCase().startsWith(cleanedText.toLowerCase()) || 
                      (cleanedText.length >= 12 && optText.toLowerCase().includes(cleanedText.toLowerCase()));

      if (isMatch) {
        // We found a match! Now let's see if there is a leading word like "alternativa" or "opção" before the quote.
        // We look back in the explanation text from the index of fullMatch.
        const matchIndex = match.index;
        const lookbackLength = 25;
        const start = Math.max(0, matchIndex - lookbackLength);
        const lookbackText = originalExp.substring(start, matchIndex).toLowerCase();
        
        let leadWord = '';
        if (lookbackText.match(/(alternativas|opções)\s*$/)) {
          leadWord = lookbackText.match(/(alternativas|opções)\s*$/)[1];
        } else if (lookbackText.match(/(alternativa|opção)\s*$/)) {
          leadWord = lookbackText.match(/(alternativa|opção)\s*$/)[1];
        }

        let targetToReplace = fullMatch;
        let replacementText = `alternativa ${letter}`;

        if (leadWord) {
          // Replace the leading word and the quoted text
          // We need to match the leading word casing
          const actualLeadWordMatch = originalExp.substring(start, matchIndex).match(new RegExp(`(${leadWord})\\s*$`, 'i'));
          const actualLeadWord = actualLeadWordMatch ? actualLeadWordMatch[1] : leadWord;
          
          // Re-capitalize standard
          const singularPlural = actualLeadWord.toLowerCase().startsWith('alternativa') ? 'alternativa' : 'opção';
          const isPlural = actualLeadWord.toLowerCase().endsWith('s');
          const isCaps = actualLeadWord[0] === actualLeadWord[0].toUpperCase();
          
          let baseWord = singularPlural;
          if (isPlural) baseWord += 's';
          if (isCaps) baseWord = baseWord[0].toUpperCase() + baseWord.slice(1);
          
          // Find the exact text in explanation to replace
          const leadWordStart = matchIndex - actualLeadWordMatch[0].length;
          targetToReplace = originalExp.substring(leadWordStart, matchIndex + fullMatch.length);
          replacementText = `${baseWord} ${letter}`;
        } else {
          // If no leading word, just replace the quoted text with 'alternativa X'
          replacementText = `alternativa ${letter}`;
        }

        replacementsToMake.push({
          target: targetToReplace,
          replacement: replacementText,
          letter,
          originalQuote: fullMatch
        });
        
        break; // found the matching option, stop checking other options
      }
    }
  }

  // Apply replacements from back to front to preserve indices if we were replacing by index, 
  // or just replace occurrences if they are unique. Let's do simple replace since they are usually unique.
  if (replacementsToMake.length > 0) {
    replacementsToMake.forEach(rep => {
      // Avoid replacing multiple times if the target matches multiple times but only replace the specific one.
      // A simple split/join works if we are careful, or replace.
      if (exp.includes(rep.target)) {
        exp = exp.replace(rep.target, rep.replacement);
        totalReplacements++;
        replacementsLog.push({
          qid: t.qid,
          target: rep.target,
          replacement: rep.replacement
        });
      }
    });
    t.exp = exp;
  }
});

console.log(`Made ${totalReplacements} replacements.`);

// Write back to topics.js
let newContent = 'const topics = [\n';
topics.forEach((t, i) => {
  newContent += '  ' + JSON.stringify(t) + (i < topics.length - 1 ? ',\n' : '\n');
});
newContent += '];\n';

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated data/topics.js');
