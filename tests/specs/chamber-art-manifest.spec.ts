import { openChamberCase } from '../helpers/chamber';
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
const source = readFileSync(resolve(__dirname, '../../js/chamber-art.js'), 'utf8');
const cases = readFileSync(resolve(__dirname, '../../js/minigame-acidbase.js'), 'utf8');
const catalog = cases.slice(cases.indexOf('const CASES = ['), cases.indexOf('// Helper p/'));
const expected = [...catalog.matchAll(/id:'([^']+)'[^\n]*character:'([^']+)'/g)].map(m => ({ id: m[1], name: m[2] }));
const fixture = '<svg xmlns="http://www.w3.org/2000/svg" width="768" height="960"><rect width="768" height="960" fill="#203645"/><text x="80" y="480" fill="white" font-size="48">QA fixture only</text></svg>';

async function prepare(page: Page, artSource?: string) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  if (artSource) await page.route('**/js/chamber-art.js*', r => r.fulfill({ contentType: 'application/javascript', body: artSource }));
  await page.goto('/jogar/', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof (window as any).showAcidBaseMinigame === 'function');
  await page.evaluate(() => {
    document.getElementById('landingScreen')?.classList.add('hidden');
    document.getElementById('welcomeScreen')?.classList.add('hidden');
    (window as any).showAcidBaseMinigame();
  });
  if (await page.locator('#nqEntryCinema[open]').count()) await page.keyboard.press('Escape');
}

function enableAldric(src: string | null = 'assets/chamber/patients/aldric.webp', approved = true) {
  const pattern = /aldric:\s*\{ name: 'Ferreiro Aldric',\s*src: (?:null|'[^']*'), approved: (?:true|false) \}/;
  expect(pattern.test(source)).toBe(true);
  return source.replace(pattern,
    `aldric: { name: 'Ferreiro Aldric', src: ${src === null ? 'null' : `'${src}'`}, approved: ${approved} }`);
}

test('20 approved patient identities resolve to their own real art; touch remains unchanged', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', r => { if (r.url().includes('/assets/chamber/patients/')) requests.push(r.url()); });
  await prepare(page);
  const manifest = await page.evaluate(() => Object.values((window as any).NQChamberArt.portraits));
  expect(expected).toHaveLength(20);
  expect(manifest.map((p: any) => ({ id: p.id, name: p.name }))).toEqual(expected);
  expect(manifest.every((p: any) => p.src === p.expectedSource && p.approved === true)).toBe(true);
  await openChamberCase(page,'aldric');
  if (await page.evaluate(() => matchMedia('(min-width:961px) and (pointer:fine)').matches)) {
    await expect(page.locator('[data-ab-portrait="aldric"]')).toBeVisible();
    await expect(page.locator('.ab-patient-portrait img')).toHaveAttribute('src', 'assets/chamber/patients/aldric.webp');
    expect(await page.locator('.ab-patient-portrait img').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([768,960]);
    expect(requests.every(url => url.endsWith('/assets/chamber/patients/aldric.webp'))).toBe(true);
  } else {
    await expect(page.locator('.ab-patient-portrait')).toHaveCount(0);
    expect(requests).toEqual([]);
  }
});

test('explicitly unavailable patient art leaves no markup, probe or placeholder', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', r => { if (r.url().includes('/assets/chamber/patients/')) requests.push(r.url()); });
  await prepare(page, enableAldric(null, false));
  await openChamberCase(page,'aldric');
  await expect(page.locator('.ab-patient-portrait')).toHaveCount(0);
  await page.locator('[data-ab-start-acts]').click();
  await expect(page.locator('.ab-patient-portrait')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('banner preserves full approved frame and canonical cinema narrative', async ({ page }) => {
  test.skip(!await page.evaluate(() => matchMedia('(pointer:fine)').matches), 'Desktop-only banner/approved portrait; touch absence is covered separately.');
  await prepare(page);
  const frame = await page.evaluate(async () => {
    const img = new Image(); img.src = '/assets/scenes/chamber-balance-still.webp'; await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight };
  });
  expect(frame).toEqual({ width: 1280, height: 720 });
  const art = await page.locator('.ab-hub-banner').evaluate(el => {
    const s = getComputedStyle(el, '::before'); return { size: s.backgroundSize, image: s.backgroundImage, repeat: s.backgroundRepeat };
  });
  expect(art.size).toBe('auto 100%');
  expect(art.image).toContain('chamber-balance-still.webp');
  expect(art.repeat).toBe('no-repeat');
  expect(await page.locator('.ab-lead').textContent()).toBe(cases.match(/<p class="ab-lead">([^<]+)<\/p>/)![1]);
  expect(await page.locator('.ab-scroll').evaluate(el => getComputedStyle(el).overflowY)).toBe('visible');
});

test('approved art reveals only after successful load, then follows that patient into the act', async ({ page }) => {
  test.skip(!await page.evaluate(() => matchMedia('(pointer:fine)').matches), 'Desktop-only banner/approved portrait; touch absence is covered separately.');
  await prepare(page, enableAldric());
  let release!: () => void;
  const loaded = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/chamber/patients/aldric.webp', async r => {
    await loaded; await r.fulfill({ contentType: 'image/svg+xml', body: fixture });
  });
  await openChamberCase(page,'aldric');
  await expect(page.locator('[data-ab-portrait="aldric"]')).toBeAttached();
  await expect(page.locator('[data-ab-portrait="aldric"]')).toBeHidden();
  release();
  await expect(page.locator('[data-ab-portrait="aldric"]')).toBeVisible();
  await expect(page.locator('.ab-patient-portrait img')).toHaveAttribute('alt', 'Retrato ilustrado de Ferreiro Aldric');
  await expect(page.locator('.ab-context .ab-title')).toBeFocused();
  await page.locator('[data-ab-start-acts]').click();
  await expect(page.locator('[data-ab-portrait="aldric"]')).toBeVisible();
  await expect(page.locator('.ab-prompt')).toBeFocused();
  expect(await page.evaluate(() => (window as any).NQChamberArt.portraitHTML('missing-patient'))).toBe('');
  expect(await page.evaluate(() => (window as any).NQChamberArt.portraitHTML('mara'))).toContain('assets/chamber/patients/mara.webp');
});

test('a failed approved file leaves no broken image, empty frame or focus loss', async ({ page }) => {
  test.skip(!await page.evaluate(() => matchMedia('(pointer:fine)').matches), 'Desktop-only banner/approved portrait; touch absence is covered separately.');
  await prepare(page, enableAldric());
  await page.route('**/assets/chamber/patients/aldric.webp', r => r.abort());
  await openChamberCase(page,'aldric');
  await expect(page.locator('.ab-patient-portrait')).toHaveCount(0);
  await expect(page.locator('.ab-patient-heading')).not.toHaveClass(/has-portrait/);
  await expect(page.locator('.ab-context .ab-title')).toBeFocused();
  await expect(page.locator('.ab-narrative')).toBeVisible();
});

test('a hero URL cannot be enabled as a patient portrait', async ({ page }) => {
  test.skip(!await page.evaluate(() => matchMedia('(pointer:fine)').matches), 'Desktop-only banner/approved portrait; touch absence is covered separately.');
  await prepare(page, enableAldric('assets/classes-cinema/guerreiro_glomerular/nivel_01.webp'));
  await openChamberCase(page,'aldric');
  await expect(page.locator('.ab-patient-portrait')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).NQChamberArt.portraitHTML('aldric'))).toBe('');
});

test('portrait component keeps mobile unchanged even when an art entry is available', async ({ page }) => {
  await prepare(page, enableAldric());
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', r => { if (r.url().includes('/assets/chamber/patients/')) requests.push(r.url()); });
  await openChamberCase(page,'aldric');
  await expect(page.locator('.ab-patient-portrait')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('a loaded desktop portrait disappears on mobile resize and returns only on desktop', async ({ page }) => {
  test.skip(!await page.evaluate(() => matchMedia('(pointer:fine)').matches), 'Desktop-only banner/approved portrait; touch absence is covered separately.');
  await prepare(page, enableAldric());
  await page.route('**/assets/chamber/patients/aldric.webp', r => r.fulfill({ contentType: 'image/svg+xml', body: fixture }));
  await openChamberCase(page,'aldric');
  await expect(page.locator('[data-ab-portrait="aldric"]')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-ab-portrait="aldric"]')).toBeHidden();
  await expect(page.locator('.ab-context .ab-title')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(page.locator('[data-ab-portrait="aldric"]')).toBeVisible();
});
