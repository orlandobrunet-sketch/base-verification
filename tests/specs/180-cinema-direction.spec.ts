import { test, expect, type Page } from '@playwright/test';
import { injectBossState } from '../helpers/game';
import { advanceToFilm } from '../helpers/cinema';

test.use({ serviceWorkers: 'block', reducedMotion: 'no-preference' });

async function preview(page: Page, key: string) {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/cinema-preview.html', { waitUntil: 'domcontentloaded' });
  await page.locator(`[data-preview="${key}"]`).click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  return dialog;
}
const playing = (dialog: ReturnType<Page['locator']>, time = .1) => expect.poll(() =>
  dialog.locator('video').evaluate((v: HTMLVideoElement, t) => !v.paused && v.currentTime > t, time)).toBe(true);

test.beforeEach(async ({ page }) => {
  test.skip(!await page.evaluate(() => matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches), 'Desktop cinema only');
});

test('one click on Pular introdução leaves the cards and the film together', async ({ page }) => {
  const dialog = await preview(page, 'nephros');
  await expect(dialog.locator('.nq-prologue-copy')).toHaveText('Os néfrons do reino estão virando pedra.');
  await dialog.getByRole('button', { name: 'Pular introdução', exact: true }).click();
  await expect(dialog).toBeHidden();
});

test('the film rises from under the dark card without a black veil', async ({ page }) => {
  const dialog = await preview(page, 'aquaria');
  await advanceToFilm(dialog);
  await playing(dialog);
  expect(await dialog.locator('.nq-movie-veil').evaluate(n => getComputedStyle(n).opacity)).toBe('0');
  await expect(dialog.locator('.nq-movie-prologue')).toHaveCount(0);
});

test('the film darkens while still moving, then closes', async ({ page }) => {
  const dialog = await preview(page, 'battle');
  await expect(dialog).toHaveAttribute('data-movie-phase', 'tail', { timeout: 12000 });
  expect(await dialog.locator('video').evaluate((v: HTMLVideoElement) => !v.paused && v.duration - v.currentTime <= .6)).toBe(true);
  await expect(dialog).toBeHidden({ timeout: 4000 });
});

test('controls recede during the film and return on pointer movement', async ({ page }) => {
  const dialog = await preview(page, 'chamber');
  await playing(dialog);
  const sound = dialog.locator('.nq-entry-cinema__sound'), skip = dialog.locator('.nq-entry-cinema__skip');
  await expect(dialog).toHaveAttribute('data-chrome', 'idle', { timeout: 4000 });
  await expect.poll(() => sound.evaluate(n => Number(getComputedStyle(n).opacity))).toBeLessThan(.2);
  expect(await skip.evaluate(n => Number(getComputedStyle(n).opacity))).toBeGreaterThan(.5);
  await page.mouse.move(40, 40);
  await page.mouse.move(60, 60);
  await expect(dialog).toHaveAttribute('data-chrome', 'awake');
});

test('volume appears only with sound on, and the choice carries to the next film', async ({ page }) => {
  let dialog = await preview(page, 'battle');
  await playing(dialog);
  await expect(dialog.locator('input[type=range]')).toBeHidden();
  await dialog.getByRole('button', { name: 'Ativar som', exact: true }).click();
  await expect(dialog.locator('input[type=range]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.locator('[data-preview="battle"]').click();
  dialog = page.locator('dialog[open]');
  await playing(dialog);
  await expect(dialog.getByRole('button', { name: 'Silenciar', exact: true })).toBeVisible();
  await expect(dialog.locator('audio[data-nq-movie-music]')).toHaveJSProperty('muted', false);
});

test('epilogue shows the fall, dissolves into the portrait at film size, and replays from the fall', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const dialog = await preview(page, 'victory');
  const caption = dialog.locator('.nq-epilogue-caption');
  await playing(dialog);
  await expect(dialog).toHaveAttribute('data-epilogue-phase', 'film');
  await expect(caption).toHaveText('O Arqui-Nefromante caiu.', { timeout: 3000 });
  await expect(dialog).toHaveAttribute('data-epilogue-phase', 'portrait', { timeout: 5000 });
  await expect(caption).toHaveText('O reino volta a filtrar.', { timeout: 3000 });
  await expect.poll(() => dialog.locator('video').evaluate(v => Number(getComputedStyle(v).opacity))).toBe(0);
  const frame = await dialog.locator('.nq-victory-cinema__aperture').boundingBox();
  expect(frame!.width / frame!.height).toBeCloseTo(16 / 9, 2);
  expect(frame!.height).toBeGreaterThan(560);
  expect(await dialog.evaluate(d => d.scrollHeight <= d.clientHeight)).toBe(true);
  await dialog.getByRole('button', { name: 'Rever', exact: true }).click();
  await expect(dialog).toHaveAttribute('data-epilogue-phase', 'film');
  await playing(dialog);
  await expect(caption).toHaveText('O Arqui-Nefromante caiu.', { timeout: 3000 });
});

test('the portrait carries the ending alone when the film cannot play', async ({ page }) => {
  await page.route('**/NefroQuest-vitoria-coletiva-v6.mp4', r => r.abort());
  await page.route('**/*', r => {
    if (r.request().url().endsWith('vitoria-coletiva-v6.mp4')) return r.abort();
    return new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort();
  });
  await page.goto('/cinema-preview.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preview="victory"]').click();
  const dialog = page.locator('#nqVictoryCinema[open]');
  await expect(dialog).toHaveAttribute('data-epilogue-phase', 'portrait', { timeout: 4000 });
  await expect(dialog.locator('.nq-epilogue-caption')).toHaveText('O Arqui-Nefromante caiu.', { timeout: 4000 });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('a level-up arriving during the boss film waits for it to close', async ({ page }) => {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectBossState(page);
  await page.locator('#nqStaticIntro').click();
  const dialog = page.locator('#nqEntryCinema[open]');
  await playing(dialog);
  await page.evaluate(() => (window as any).showEvolutionPopup((0, eval)('state.level'), 'Guardião', 'assets/victory-jornada.webp'));
  await page.waitForTimeout(500);
  await expect(dialog).toBeVisible();
  await expect(page.locator('.evolution-popup')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('.evolution-popup')).toHaveCount(1);
});

test.describe('reduced motion', () => {
  test('the film waits for an explicit play', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dialog = await preview(page, 'battle');
    await expect(dialog.getByRole('button', { name: 'Reproduzir filme', exact: true })).toBeVisible();
    await page.waitForTimeout(600);
    await expect(dialog.locator('video')).toHaveJSProperty('paused', true);
  });
});

test('a notebook with a touch screen keeps the films, because the mouse stays its primary pointer', async ({ page }) => {
  // Playwright's hasTouch turns the primary pointer coarse, like a phone; a touch notebook only adds a secondary one.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 10 });
    const media = window.matchMedia.bind(window);
    window.matchMedia = query => query === '(any-pointer:coarse)' ? { ...media('all'), matches: true, media: query, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList : media(query);
  });
  const dialog = await preview(page, 'battle');
  expect(await page.evaluate(() => navigator.maxTouchPoints)).toBe(10);
  await playing(dialog);
});
