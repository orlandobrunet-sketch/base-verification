const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'js', 'minigame-acidbase.js');
const rawCode = fs.readFileSync(filePath, 'utf8');

// Find the IIFE contents
const startIdx = rawCode.indexOf('(function(){');
const endIdx = rawCode.lastIndexOf('})();');

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find IIFE wrapping in minigame-acidbase.js");
  process.exit(1);
}

// Extract IIFE body
let iifeBody = rawCode.substring(startIdx + 12, endIdx);

// Append a bridge to expose CASES and the build functions
iifeBody += `
  global.extractedCases = CASES;
`;

// Create mock environment
const sandbox = {
  console: console,
  Math: Math,
  Set: Set,
  Map: Map,
  Array: Array,
  String: String,
  JSON: JSON,
  localStorage: {
    getItem: () => null,
    setItem: () => null
  },
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {} }),
    body: { appendChild: () => {}, removeChild: () => {} }
  },
  window: {
    NQ_ACIDBASE_DEBUG: false
  },
  state: {
    correctTotal: 0
  },
  playSound: () => {},
  global: {}
};

// Run the script in VM context
try {
  vm.createContext(sandbox);
  vm.runInContext(iifeBody, sandbox);
} catch (e) {
  console.error("Failed to run minigame code in sandbox:", e);
  process.exit(1);
}

const cases = sandbox.global.extractedCases;

if (!cases || !Array.isArray(cases)) {
  console.error("Failed to extract CASES array from minigame.");
  process.exit(1);
}

console.log(`Successfully extracted ${cases.length} cases.`);

let hasError = false;
cases.forEach((c) => {
  if (typeof c.build !== 'function') {
    console.log(`Case ${c.id} (${c.caso}): 🔒 Em breve (sem build)`);
    return;
  }

  try {
    const result = c.build();
    console.log(`Case ${c.id} (${c.caso}): ✅ Build succeeded!`);
    
    // Perform simple validation on build result
    if (!result.narrative || typeof result.narrative !== 'string') {
      console.error(`  [ERROR] Missing or invalid narrative`);
      hasError = true;
    }
    if (!result.gas || typeof result.gas !== 'object') {
      console.error(`  [ERROR] Missing or invalid gas parameters`);
      hasError = true;
    }
    if (!result.acts || !Array.isArray(result.acts) || result.acts.length === 0) {
      console.error(`  [ERROR] Missing or empty acts array`);
      hasError = true;
    }
    if (!result.summary || typeof result.summary !== 'string') {
      console.error(`  [ERROR] Missing or invalid summary`);
      hasError = true;
    }
  } catch (err) {
    console.error(`Case ${c.id} (${c.caso}): ❌ Build failed! Error:`, err);
    hasError = true;
  }
});

if (hasError) {
  console.error("Test validation failed with errors.");
  process.exit(1);
} else {
  console.log("All cases validated successfully!");
}
