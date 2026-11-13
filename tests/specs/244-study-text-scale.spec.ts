import { test, expect } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

// Force the layout/input overlap without replacing any production function.
// No clinical content is used: the long text makes a displaced correction observable.
const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'study-text-scale-' + index, t: 'Interface', cat: 'geral', diff: 'medium',
  q: 'Questão técnica. ' + 'Este texto verifica foco e posição dos controles da interface. '.repeat(12),
  opts: ['A', 'B', 'C', 'D'].map(letter => 'Alternativa técnica ' + letter + '. ' +
    'Texto extenso para conferir a disposição dos controles, sem conteúdo clínico. '.repeat(7)),
  ans: index, exp: 'Explicação técnica para conferir o destino da rolagem após ampliar o texto.',
}));

for (const motion of ['reduce', 'no-preference'] as const) {
  test.describe('movimento ' + motion, () => {
    test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: motion } });

    for (const input of ['teclado', 'clique'] as const) {
      test(`ampliar texto e responder por ${input} no mesmo quadro conserva a correção na janela`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 740 });
        await page.route('**/*', route => {
          const request = route.request();
          return new URL(request.url()).hostname === 'localhost' && request.method() === 'GET' &&
            !['image', 'media', 'font'].includes(request.resourceType()) ? route.continue() : route.abort();
        });
        await page.routeWebSocket('**/*', socket => socket.close());
        await routeTechnicalQuestionBank(page, authors);
        await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-portal-route="guest"]').click();
        await page.evaluate(() => (window as any)._loadTopics());
        await page.locator('[data-atrium-route="modes"]').click();
        await page.locator('[data-mode-route="study"]:visible').click();
        await page.locator('[data-action="startFreeStudyMode"]').click();
        await expect(page.locator('#studyOptions button')).toHaveCount(4);
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        });

        const baseTitleSize = await page.locator('.nq-study-question-title').evaluate(title => parseFloat(getComputedStyle(title).fontSize));
        await page.evaluate(input => {
          document.documentElement.style.fontSize = '32px';
          const answer = (0, eval)('_studyPresentations[studyModeIndex].a');
          const index = (answer + 1) % 4;
          const button = document.querySelectorAll<HTMLButtonElement>('#studyOptions button')[index];
          button.focus();
          if (input === 'teclado') button.dispatchEvent(new KeyboardEvent('keydown', { key: String(index + 1), bubbles: true }));
          else button.click();
        }, input);
        const feedback = page.locator('#studyFeedback');
        await expect(feedback).toBeFocused();
        await expect(feedback).toBeVisible();

        // A focused correction must remain visible once the declared scale is
        // actually applied. Waiting for layout never changes or scrolls the app.
        await page.waitForFunction(expectedTitleSize => {
          const title = document.querySelector('.nq-study-question-title');
          return title && parseFloat(getComputedStyle(document.documentElement).fontSize) === 32 &&
            Math.abs(parseFloat(getComputedStyle(title).fontSize) - expectedTitleSize) < .01 &&
            !document.getAnimations().some(animation => animation instanceof CSSTransition &&
              (animation.pending || animation.playState === 'running'));
        }, baseTitleSize * 2);
        await expect(feedback).toBeFocused();
        await expect(feedback).toBeInViewport();
        expect(await page.evaluate(() => (0, eval)('studyModeCorrect + studyModeWrong'))).toBe(1);
        await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
        await page.locator('[data-action="nextStudyQuestion"]').click();
        await expect(page.locator('#studyQuestionArea')).toBeFocused();
        await expect(page.locator('#studyProgress')).toHaveText('2');
      });
    }
  });
}
