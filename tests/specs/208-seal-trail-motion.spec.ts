import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { openVisualDashboard, visualProgress } from '../helpers/dashboard-visual-fixture';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
async function openTrail(page: Page, context: BrowserContext, baseURL: string, correct: number) {
  await openVisualDashboard(page, context, baseURL);
  await page.evaluate(correct => {
    const w = window as any, save = JSON.parse(localStorage.getItem('nefroquest-save')!);
    localStorage.setItem('nefroquest-save', JSON.stringify({ ...save, correctTotal: correct }));
    w.closeDashboard(); return w.openDashboard({ tab: 'overview' });
  }, correct);
  return page.locator('.nqd-stage-trail');
}

for (const correct of [0, 18, 40, 100]) test(`finite sheen stays within ${correct} percent of real progress`, async ({ page, context, baseURL }) => {
  const trail = await openTrail(page, context, baseURL!, correct), before = await visualProgress(page), text = await trail.innerText();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const result = await trail.evaluate(el => {
    getComputedStyle(el, '::after').animationName;
    const animations = el.getAnimations({ subtree: true }).filter(a => (a as CSSAnimation).animationName === 'nqd-stage-trail-sheen');
    if (animations.length !== 1) return { found: animations.length };
    const a = animations[0]; a.pause();
    const frames = [0, 900, 2700].map(time => {
      a.currentTime = time;
      const style = getComputedStyle(el, '::after');
      return { width: parseFloat(style.width), position: style.backgroundPosition, track: el.getBoundingClientRect().width };
    });
    const timing = a.effect!.getTiming(); a.finish();
    return { found: animations.length, frames, duration: timing.duration, iterations: timing.iterations, finished: a.playState,
      finalWidth: parseFloat(getComputedStyle(el, '::after').width), progress: (el as HTMLElement).style.getPropertyValue('--acertos') };
  });
  expect(result.found).toBe(1);
  expect(result.duration).toBe(1800); expect(result.iterations).toBe(2); expect(result.finished).toBe('finished');
  expect(result.frames![0].position).not.toBe(result.frames![1].position);
  expect(result.progress).toBe(`${correct}%`);
  for (const frame of result.frames!) expect(Math.abs(frame.width - frame.track * correct / 100)).toBeLessThan(1);
  expect(result.finalWidth).toBeCloseTo(result.frames![0].width, 1);
  expect(await trail.innerText()).toBe(text); expect(await visualProgress(page)).toEqual(before);
});

test('switching to reduced motion restores the static line and exact progress', async ({ page, context, baseURL }) => {
  const trail = await openTrail(page, context, baseURL!, 40), before = await visualProgress(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => trail.evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('nqd-stage-trail-sheen');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const result = await trail.evaluate(el => ({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, noPreference: matchMedia('(prefers-reduced-motion: no-preference)').matches, name: getComputedStyle(el, '::after').animationName,
    count: el.getAnimations({ subtree: true }).filter(a => (a as CSSAnimation).animationName === 'nqd-stage-trail-sheen').length,
    width: parseFloat(getComputedStyle(el, '::after').width), track: el.getBoundingClientRect().width }));
  expect(result.reduce, JSON.stringify(result)).toBe(true); expect(result.noPreference).toBe(false);
  expect(result.name).toBe('none'); expect(result.count).toBe(0);
  expect(Math.abs(result.width - result.track * .4)).toBeLessThan(1);
  expect(await visualProgress(page)).toEqual(before);
});

test('motion does not move badges or overflow at 320px with 200 percent text', async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  const trail = await openTrail(page, context, baseURL!, 18);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const before = await visualProgress(page), positions = await trail.locator('li').evaluateAll(items => items.map(el => el.getBoundingClientRect().toJSON()));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await page.locator('.nqd-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await trail.locator('li').evaluateAll(items => items.map(el => el.getBoundingClientRect().toJSON()))).toEqual(positions);
  expect(await visualProgress(page)).toEqual(before);
});
