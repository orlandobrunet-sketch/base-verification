const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/refs.js');
let fileContent = fs.readFileSync(filePath, 'utf8');

// The file defines a global variable refsDB.
// To evaluate it safely in Node without browser window objects,
// we can strip the "const refsDB = " part and parse or evaluate it.
fileContent = fileContent.trim();
if (fileContent.startsWith('const refsDB =')) {
  fileContent = fileContent.replace('const refsDB =', 'global.refsDB =');
}

// Evaluate the file content
eval(fileContent);

const keys = Object.keys(global.refsDB);
const total = keys.length;
const withResumo = keys.filter(k => global.refsDB[k].resumo).length;
const missing = keys.filter(k => !global.refsDB[k].resumo);

console.log(`--- refsDB Statistics ---`);
console.log(`Total references: ${total}`);
console.log(`With summaries (resumo): ${withResumo}`);
console.log(`Without summaries: ${missing.length}`);
if (missing.length > 0) {
  console.log(`Missing keys:`, missing);
}
