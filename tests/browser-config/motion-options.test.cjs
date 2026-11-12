const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { invalidMotionOptions, testSources } = require('./motion-options.cjs');

for (const value of ['reduce', 'no-preference']) test(`rejects ignored direct test.use reducedMotion ${value}`, () => {
  const issues = invalidMotionOptions(`import {test} from '@playwright/test'; test.use({serviceWorkers:'block', reducedMotion:'${value}'});`, 'example.spec.ts');
  assert.equal(issues.length, 1);
  assert.equal(issues[0].line, 1);
});
test('accepts supported contextOptions, page emulation and explicit browser contexts', () => {
  assert.deepEqual(invalidMotionOptions(`test.use({contextOptions:{reducedMotion:'reduce'}}); page.emulateMedia({reducedMotion:'reduce'}); browser.newContext({reducedMotion:'no-preference'});`, 'example.spec.ts'), []);
});
test('recognizes quoted and static computed keys and imported test aliases', () => {
  assert.equal(invalidMotionOptions(`import {test as scenario} from '@playwright/test'; scenario.use({'reducedMotion':'reduce'}); test.use({['reducedMotion']:'reduce'});`, 'example.spec.ts').length, 2);
});
test('ignores comments and strings that resemble configuration', () => {
  assert.deepEqual(invalidMotionOptions(`// test.use({reducedMotion:'reduce'});\nconst text="test.use({reducedMotion:'reduce'})";`, 'example.spec.ts'), []);
});
test('rejects ignored direct configuration use options', () => {
  assert.equal(invalidMotionOptions(`export default defineConfig({use:{reducedMotion:'reduce'}});`, 'playwright.config.ts').length, 1);
});
test('accepts supported configuration contextOptions', () => {
  assert.deepEqual(invalidMotionOptions(`export default {use:{contextOptions:{reducedMotion:'reduce'}}};`, 'playwright.config.ts'), []);
});
test('does not silently ignore a source parse error', () => {
  assert.throws(() => invalidMotionOptions(`test.use({`, 'example.spec.ts'));
});
test('all versioned browser scenarios declare motion through supported options', () => {
  const issues = testSources().flatMap(file => invalidMotionOptions(fs.readFileSync(file, 'utf8'), file));
  assert.equal(issues.length, 0, `${issues.length} ignored motion declarations. Use contextOptions.reducedMotion. First: ${JSON.stringify(issues.slice(0, 3))}`);
});
