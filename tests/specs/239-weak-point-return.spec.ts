import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';
import { writeFileSync } from 'node:fs';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const authors = Array.from({ length: 8 }, (_, index) => ({
  qid: 'weak-return-technical-' + index, cat: index % 2 ? 'lra' : 'drc',
  t: 'Marcador técnico', q: 'Pergunta técnica de navegação ' + index,
  opts: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
  ans: index % 4, exp: 'Explicação técnica para testar retorno e persistência.',
}));

async function campaign(page: Page) {
  return page.evaluate(() => (0, eval)(`JSON.parse(JSON.stringify({
    current:state.current?.id, index:state.idx, answered:state.answered,
    character:state.character, difficulty:state.difficulty, level:state.level,
    xp:state.xp, gold:state.gold, score:state.score, lives:state.lives,
    correct:state.correctTotal, equipment:state.equipment
  }))`));
}

async function surfaces(page: Page) {
  return page.evaluate(() => ({
    roots: ['mainApp', 'welcomeScreen'].map(id => {
      const element = document.getElementById(id)!;
      return { id, hidden: element.classList.contains('hidden'), inert: element.inert,
        visible: !!element.getClientRects().length };
    }),
    origin: (0, eval)('_studySurfaceOrigin?.elements.map(({element,hidden,inert})=>({id:element.id,hidden,inert}))'),
    started: (0, eval)('state.gameStarted'),
    studying: document.body.classList.contains('nq-studying'),
    active: document.activeElement?.id || document.activeElement?.getAttribute('data-action'),
  }));
}

for (const origin of ['atrio', 'campanha'] as const) {
  for (const path of ['direto', 'plano', 'cancelar'] as const) {
    test(`Ponto Fraco ${path} retorna à origem ${origin} com a jornada operante`, async ({ page, context, baseURL }, info) => {
      const allowed = new URL(baseURL!).origin;
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await context.route('**/*', route => {
        const request = route.request();
        if (!['GET', 'HEAD'].includes(request.method()) || ['font', 'media'].includes(request.resourceType())) return route.abort();
        return new URL(request.url()).origin === allowed ? route.continue() : route.abort();
      });
      await context.routeWebSocket('**/*', socket => socket.close());
      await routeTechnicalQuestionBank(page, authors);
      await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-portal-route="guest"]').click();
      await injectGameState(page, { schemaVersion: 6, gold: 1234, correctTotal: 10, narrativeShown: 1 });
      await page.evaluate(path => localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
        version: 1, totalQuestions: 20, totalCorrect: 13, totalWrong: 7,
        byCategory: { drc: { correct: path === 'direto' ? 2 : 6, total: path === 'direto' ? 5 : 10 }, lra: { correct: 7, total: 10 } },
        byTopic: {}, questionHistory: [], dailyActivity: {}, timeStats: { totalTime: 0, questionCount: 0 }, mostMissed: {}, syncedMastered: [],
      })), path);
      if (origin === 'atrio') {
        await page.locator('[data-action="goToWelcomeFromGame"]:visible').first().click();
        await expect(page.locator('#welcomeScreen')).toBeVisible();
        await page.locator('[data-atrium-route="modes"]').click();
      } else {
        // The public campaign overlay entry matches the existing196 contract.
        await page.evaluate(() => (window as any).openGameModesPopup());
      }
      const before = await campaign(page);
      await page.locator('[data-mode-route="weak"]:visible').click();
      let mounted;
      if (path === 'cancelar') {
        await expect(page.locator('#nqWeakPointPlan')).toBeVisible();
        mounted = await surfaces(page);
        await page.getByRole('button', { name: 'Voltar', exact: true }).click();
      } else {
        if (path === 'plano') await page.getByRole('button', { name: 'Começar estudo', exact: true }).click();
        await expect(page.locator('#studyModePage')).toBeVisible();
        mounted = await surfaces(page);
        await page.locator('#studyOptions button').first().click();
        await expect(page.locator('#studyFeedback')).toBeVisible();
        await page.getByRole('button', { name: 'Pausar e voltar', exact: true }).click();
      }
      const returned = await surfaces(page);
      const observation = info.outputPath('retorno-ponto-fraco.json');
      writeFileSync(observation, JSON.stringify({ origin, path, mounted, returned }, null, 2));
      await info.attach('retorno-ponto-fraco', { path: observation, contentType: 'application/json' });
      const root = page.locator(origin === 'atrio' ? '#welcomeScreen' : '#mainApp');
      if (!await root.isVisible()) {
        const screenshot = info.outputPath('retorno-sem-tela.png');
        await page.screenshot({ path: screenshot });
        await info.attach('retorno-sem-tela', { path: screenshot, contentType: 'image/png' });
      }
      await expect(root).toBeVisible();
      expect(await root.evaluate(element => (element as HTMLElement).inert)).toBe(false);
      await expect(page.locator('#studyModePage, #nqWeakPointPlan')).toHaveCount(0);
      expect(returned.studying).toBe(false);
      expect(await campaign(page)).toEqual(before);
      expect(errors).toEqual([]);
      if (origin === 'atrio') {
        await expect(page.locator('[data-atrium-route="modes"]')).toBeFocused();
        await page.locator('[data-atrium-route="modes"]').click();
        await expect(page.locator('#atriumModesPanel')).toBeVisible();
        await page.getByRole('button', { name: 'Voltar às rotas', exact: true }).click();
      } else {
        const wrong = await page.evaluate(() => (0, eval)('(state.current.a+1)%4'));
        await page.locator('#options .option').nth(wrong).click();
        await expect(page.locator('#nextBtn')).toBeVisible();
      }
    });
  }
}
