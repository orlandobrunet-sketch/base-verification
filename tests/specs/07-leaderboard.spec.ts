import { test, expect } from '@playwright/test';
import { injectGameState, waitForGame } from '../helpers/game';

test.describe('Leaderboard — rate limiting e validação', () => {
  test('boardPush respeita rate limit de 1 push por sessão', async ({ page }) => {
    await page.goto('/');
    await injectGameState(page);
    await waitForGame(page);

    // Intercepta as chamadas ao Supabase
    const pushCalls: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/rest/v1/leaderboard') && req.method() === 'POST') {
        pushCalls.push(req.url());
      }
    });

    // Tenta chamar boardPush duas vezes via JS
    await page.evaluate(async () => {
      // @ts-ignore — função global do app
      await (window as any).boardPush?.(1000, 5, 'Teste');
      await (window as any).boardPush?.(2000, 6, 'Teste2');
    });

    await page.waitForTimeout(500);

    // Apenas 1 push deve ter chegado ao Supabase (ou 0 se offline)
    expect(pushCalls.length).toBeLessThanOrEqual(1);
  });

  test('score inválido não é enviado ao leaderboard', async ({ page }) => {
    await page.goto('/');
    await injectGameState(page);
    await waitForGame(page);

    const pushCalls: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/rest/v1/leaderboard') && req.method() === 'POST') {
        pushCalls.push(req.postData() || '');
      }
    });

    await page.evaluate(async () => {
      // Score absurdo — deve ser bloqueado pela validação
      await (window as any).boardPush?.(-999, 0, 'Hack');
      await (window as any).boardPush?.(99_999_999, 999, 'Hack2');
    });

    await page.waitForTimeout(500);
    expect(pushCalls.length).toBe(0);
  });
});
