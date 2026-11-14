import { test, expect } from '@playwright/test';

test.describe('Painel administrativo — dados persistidos não executam HTML', () => {
  test('trata payload público de avaliações e votos como texto', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
      return request.method() === 'GET' && url.origin === origin ? route.continue() : route.abort();
    });
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).loadAnalyticsData === 'function');

    const result = await page.evaluate(async () => {
      const ratingPayload = '<img data-xss="rating" src="x">';
      const difficultyPayload = '<img data-xss="difficulty" src="x">';
      const rows: Record<string, unknown[]> = {
        leaderboard: [{ player_name: 'Teste', score: 10, level: 1 }],
        question_ratings: [{
          question_id: ratingPayload,
          question_text: 'Questão de teste',
          rating_quality: 5,
          rating_learning: 4,
          player_email: 'teste@example.com',
          created_at: '2026-08-21T12:00:00.000Z',
        }],
        question_difficulty_votes: Array.from({ length: 5 }, () => ({
          question_id: 'qid-seguro',
          vote: 'easy',
          current_diff: difficultyPayload,
        })),
      };

      const fakeClient = {
        from(table: string) {
          const builder = {
            select: () => builder,
            order: () => builder,
            limit: async () => ({ data: rows[table] || [], error: null }),
          };
          return builder;
        },
      };

      (window as any).__nqAdminTestClient = fakeClient;
      window.eval('_supaClient = window.__nqAdminTestClient');
      // Exercise the real restricted panel; detached divs no longer authorize
      // an administrative read or represent its rendering destination.
      (window as any).authUser = {
        id: '00000000-0000-4000-8000-0000000000a1',
        email: 'admin-xss@example.invalid',
        app_metadata: { is_admin: true },
      };
      (window as any).openAnalyticsPanel();
      await (window as any).loadAnalyticsData();

      return {
        executableNodes: document.querySelectorAll('[data-xss]').length,
        ratingsText: document.getElementById('anRatingsList')?.textContent || '',
        difficultyText: document.getElementById('anDifficultyList')?.textContent || '',
        ratingPayload,
        difficultyPayload,
      };
    });

    expect(result.executableNodes).toBe(0);
    expect(result.ratingsText).toContain(result.ratingPayload);
    expect(result.difficultyText).toContain(result.difficultyPayload);
  });
});
