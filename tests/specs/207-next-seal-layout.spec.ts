import { test, expect } from '@playwright/test';
import { openVisualDashboard, visualProgress } from '../helpers/dashboard-visual-fixture';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

for (const correct of [18, 19, 39, 59, 79, 99, 100]) test(`next seal preserves full text and layout at ${correct} correct answers`, async ({ page, context, baseURL }) => {
  await openVisualDashboard(page, context, baseURL!);
  await page.evaluate(correct => {
    const w = window as any, save = JSON.parse(localStorage.getItem('nefroquest-save')!);
    localStorage.setItem('nefroquest-save', JSON.stringify({ ...save, correctTotal: correct }));
    w.closeDashboard(); return w.openDashboard({ tab: 'overview' });
  }, correct);
  const before = await visualProgress(page), phrase = page.locator('.nqd-stage-next');
  const names = ['Vórtice do Néfron', 'Sábio do Microscópio', 'Guardião das Águas', 'Árbitro dos Rins', 'Ascendido do NefroQuest'];
  const index = Math.floor(correct / 20), remaining = (index + 1) * 20 - correct;
  const expected = correct === 100 ? 'Os cinco selos da jornada são seus.'
    : `Próximo selo: ${names[index]}, ${remaining === 1 ? 'falta 1 acerto' : `faltam ${remaining} acertos`}.`;
  await expect(phrase).toHaveText(expected);
  for (const [width, font] of [[1440, 16], [1280, 16], [1024, 16], [390, 16], [320, 32], [1440, 32]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
    const metrics = await phrase.evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const r = el.getBoundingClientRect(), main = document.querySelector('.nqd-main')!;
      const overlaps = ['.nqd-stage-name', '.nqd-stage-meta', '.nqd-stage-trail'].some(selector => {
        const other = document.querySelector(selector)!.getBoundingClientRect();
        return Math.min(other.right, r.right) > Math.max(other.left, r.left) + 1
          && Math.min(other.bottom, r.bottom) > Math.max(other.top, r.top) + 1;
      });
      return { lines: new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top))).size,
        overlaps, overflow: main.scrollWidth > main.clientWidth + 1, textFits: el.scrollWidth <= el.clientWidth + 1,
        ellipsis: getComputedStyle(el).textOverflow === 'ellipsis' };
    });
    if (width >= 1280 && font === 16) expect(metrics.lines, `${width}px: ${expected}`).toBe(1);
    expect(metrics.overlaps, `${width}px/${font}px: overlap`).toBe(false); expect(metrics.overflow, `${width}px/${font}px: overflow`).toBe(false);
    expect(metrics.textFits).toBe(true); expect(metrics.ellipsis).toBe(false);
    await expect(phrase).toHaveText(expected);
    expect(await visualProgress(page)).toEqual(before);
  }
});

test('long player name keeps comfortable space and complete text beside the seal', async ({ page, context, baseURL }) => {
  await openVisualDashboard(page, context, baseURL!);
  const name = 'Orlando Bruno Filho da Silva e Albuquerque';
  await page.evaluate(name => {
    const w = window as any;
    // Display metadata only: no account id or server authentication is introduced.
    w.authUser = { user_metadata: { full_name: name } };
    w.closeDashboard(); return w.openDashboard({ tab: 'overview' });
  }, name);
  const before = await visualProgress(page);
  for (const [width, font] of [[1440, 16], [1280, 16], [1024, 16], [390, 16], [320, 32], [1440, 32]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, font);
    await expect(page.locator('.nqd-stage-name')).toHaveText(name);
    const metrics = await page.locator('.nqd-stage-name').evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const r = el.getBoundingClientRect(), phrase = document.querySelector('.nqd-stage-next')!.getBoundingClientRect();
      return { width: r.width, overlap: Math.min(r.right, phrase.right) > Math.max(r.left, phrase.left) + 1 && Math.min(r.bottom, phrase.bottom) > Math.max(r.top, phrase.top) + 1,
        fits: [...range.getClientRects()].every(line => line.left >= r.left - 1 && line.right <= r.right + 1), overflow: el.scrollWidth > el.clientWidth + 1 };
    });
    if (width >= 1280 && font === 16) expect(metrics.width).toBeGreaterThanOrEqual(250);
    expect(metrics.fits).toBe(true); expect(metrics.overflow).toBe(false); expect(metrics.overlap).toBe(false);
    expect(await visualProgress(page)).toEqual(before);
  }
});
