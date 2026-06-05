const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'minigame-acidbase.js');
const code = fs.readFileSync(filePath, 'utf8');

// We want to find function _build[Name]() and extract its contents up to return { ... } and summary: `...`
const functionRegex = /function _build([A-Z][a-zA-Z0-9_]+)\s*\(\)\s*\{([\s\S]*?)(?=function _build|\/\/ ── Casos clínicos)/g;

let match;
const casesFound = [];

while ((match = functionRegex.exec(code)) !== null) {
  const name = match[1];
  const body = match[2];
  
  // Try to extract comments at the top of function
  const lines = body.split('\n');
  const comments = lines
    .filter(line => line.trim().startsWith('//'))
    .map(line => line.trim().substring(2).trim())
    .join(' ');

  // Look for return statement and especially narrative and summary
  let narrative = '';
  const narrativeMatch = body.match(/narrative:\s*`([\s\S]*?)`/);
  if (narrativeMatch) {
    narrative = narrativeMatch[1].replace(/\s+/g, ' ').trim();
  }

  let summary = '';
  const summaryMatch = body.match(/summary:\s*`([\s\S]*?)`/);
  if (summaryMatch) {
    summary = summaryMatch[1].replace(/\s+/g, ' ').trim();
  }

  // Look for target and tolerance checks
  const targetMatches = [];
  const targetRegex = /target:\s*([a-zA-Z0-9_]+)/g;
  let targetMatch;
  while ((targetMatch = targetRegex.exec(body)) !== null) {
    targetMatches.push(targetMatch[1]);
  }

  casesFound.push({
    name,
    comments,
    narrative,
    summary,
    targets: targetMatches
  });
}

let md = `| Caso | Nome | Conceito Clínico (Comentários) | Resumo Clínico / Alvos |\n|---|---|---|---|\n`;

casesFound.forEach((c, idx) => {
  md += `| ${idx + 1} | **${c.name}** | ${c.comments || 'N/A'} | ${c.summary.substring(0, 150)}... <br>Alvos: ${c.targets.join(', ')} |\n`;
});

console.log(md);
console.log(`Total cases: ${casesFound.length}`);

