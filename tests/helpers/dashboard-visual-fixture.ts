import { expect, type Page, type BrowserContext } from '@playwright/test';
import { saveBase } from './fixtures';

export async function openVisualDashboard(page: Page, context: BrowserContext, baseURL: string) {
  const origin = new URL(baseURL).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => (window as any)._loadTopics());
  await page.evaluate(save => {
    localStorage.clear();
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({ version: 1, totalQuestions: 300,
      totalCorrect: 200, totalWrong: 100, byTopic: {}, questionHistory: [], dailyActivity: {}, timeStats: {}, mostMissed: {},
      byCategory: { drc: { correct: 9, wrong: 1 }, glomerular: { correct: 2, wrong: 8 }, dialise: { correct: 6, wrong: 4 } } }));
    const comps = (0, eval)('NQ_COMPETENCIES');
    localStorage.setItem('nefroquest-comp-stats', JSON.stringify(Object.fromEntries(comps.slice(0, 8).map((c: any) => [c.id, { c: 1, t: 8 }]))));
    (window as any).isAdminUser = () => false;
    return (window as any).openDashboard();
  }, saveBase());
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.evaluate(() => document.fonts.ready);
}

export const visualProgress = (page: Page) => page.evaluate(() => ['nefroquest-save', 'nefroquest-detailed-stats',
  'nefroquest-comp-stats', 'unlockedArticles', 'nq-unlocked-refs'].map(key => localStorage.getItem(key)));
