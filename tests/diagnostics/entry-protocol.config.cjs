'use strict';
const path = require('node:path');
const {devices} = require('@playwright/test');
const output = process.env.NQ_PROTOCOL_OUTPUT, baseURL = process.env.NQ_PROTOCOL_BASE_URL;
if (!output || !path.isAbsolute(output) || !baseURL) throw new Error('Use capture-entry-protocol.cjs to launch this configuration');
// No existence guard here: Playwright imports this module in parent and worker.
module.exports = {
  testDir: path.resolve(__dirname, '..'), fullyParallel: false, workers: 1,
  retries: 0, timeout: 20000, forbidOnly: true,
  use: {baseURL, headless: true, serviceWorkers: 'block', trace: 'off', screenshot: 'off', video: 'off',
    launchOptions: {args: ['--host-resolver-rules=MAP localhost 127.0.0.1']}},
  projects: [
    {name: 'protocol-controls', testMatch: '**/probes/entry-protocol-controls.spec.ts', use: {...devices['Desktop Chrome']}},
    {name: 'entry-226-mobile', testMatch: '**/specs/226-streak-multiplier-display.spec.ts', use: {...devices['Pixel 7']}},
    {name: 'entry-279-chromium', testMatch: '**/specs/279-starter-image-fallback.spec.ts',
      grep: /equipamento inicial de glomerulus mantém nomes e atributos quando a imagem falha$/, use: {...devices['Desktop Chrome']}}
  ],
  // Built-in JSON/HTML reporters can persist worker DEBUG stderr before the
  // launcher filters it. This reporter never stores stdout/stderr chunks.
  reporter: [[require.resolve('./protocol-summary-reporter.cjs'), {outputFile: path.join(output, 'results-summary.json')}]],
  outputDir: path.join(output, 'artifacts')
};
