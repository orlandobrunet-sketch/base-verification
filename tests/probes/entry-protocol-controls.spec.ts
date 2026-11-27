import {test, expect} from '@playwright/test';

// Opt-in diagnostics only. The main Playwright config has testDir ./specs.
test.use({serviceWorkers: 'block'});
test.beforeEach(async ({context, baseURL}) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET' &&
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
});

test('control: a real reload retires the context of an awaited evaluation', async ({page}, info) => {
  await page.goto('/version.json');
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  const outcome = page.evaluate(() => new Promise(() => {})).then(
    () => ({ok: true, message: ''}), error => ({ok: false, message: String(error.message)}));
  expect(await page.evaluate(() => 1)).toBe(1);
  await page.reload();
  const result = await outcome;
  expect(result.ok).toBe(false); expect(result.message).toContain('Execution context was destroyed');
  expect(navigations).toBe(1);
  await info.attach('known-protocol-control', {contentType: 'application/json',
    body: JSON.stringify({control: 'reload', result, navigations})});
});

test('control: an invalid object id returns a protocol error without navigation', async ({page, context}, info) => {
  await page.goto('/version.json');
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  const cdp = await context.newCDPSession(page);
  let message = '';
  try {
    await cdp.send('Runtime.callFunctionOn', {objectId: 'controlled-invalid-object-id',
      functionDeclaration: 'function(){return 1}', returnByValue: true});
  } catch (error: any) { message = String(error.message); }
  finally { await cdp.detach(); }
  expect(message).toMatch(/object id|object with given id/i); expect(navigations).toBe(0);
  expect(await page.evaluate(() => document.readyState)).toBe('complete');
  await info.attach('known-protocol-control', {contentType: 'application/json',
    body: JSON.stringify({control: 'invalid-object-id', message, navigations})});
});
