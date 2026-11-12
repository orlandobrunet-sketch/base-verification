const fs = require('node:fs');
const path = require('node:path');
const { babelParse } = require('playwright/lib/transform/babelBundle');

// Use the parser shipped/exported by the locked Playwright version: no extra dependency.
// This guards direct declarations, not dynamically assembled fixture objects.
function invalidMotionOptions(source, filename) {
  const ast = babelParse(source, filename, true);
  const names = new Set(['test']);
  const issues = [];
  const configuration = /config\.[cm]?[jt]s$/.test(filename);
  const key = property => {
    if (!property || (property.computed && property.key?.type !== 'StringLiteral')) return null;
    return property.key?.name || property.key?.value;
  };
  function visit(node, callback) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(child => visit(child, callback)); return; }
    callback(node);
    for (const [name, value] of Object.entries(node)) {
      if (!['loc', 'tokens', 'leadingComments', 'trailingComments', 'innerComments'].includes(name)) visit(value, callback);
    }
  }
  visit(ast, node => {
    if (node.type === 'ImportSpecifier' && node.imported?.name === 'test') names.add(node.local.name);
  });
  function inspect(options) {
    if (options?.type !== 'ObjectExpression') return;
    for (const property of options.properties) {
      if (key(property) === 'reducedMotion') issues.push({ file: filename, line: property.loc.start.line });
    }
  }
  visit(ast, node => {
    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression' &&
        names.has(node.callee.object?.name) &&
        ((!node.callee.computed && node.callee.property?.name === 'use') || node.callee.property?.value === 'use')) {
      inspect(node.arguments[0]);
    }
    if (configuration && node.type === 'ObjectProperty' && key(node) === 'use') inspect(node.value);
  });
  return issues;
}

function testSources() {
  const files = [path.resolve(__dirname, '../playwright.config.ts')];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(?:spec|test)\.[cm]?[jt]sx?$/.test(entry.name)) files.push(file);
    }
  }
  visit(path.resolve(__dirname, '../specs'));
  return files;
}

module.exports = { invalidMotionOptions, testSources };
