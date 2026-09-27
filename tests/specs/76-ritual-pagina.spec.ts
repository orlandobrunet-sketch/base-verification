import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Ritual de Iniciação como página própria.
 *
 * Defeitos reproduzidos antes do conserto:
 * - resposta dupla: as alternativas só bloqueavam o mouse (pointer-events);
 *   um clique e depois Enter em outra levavam da questão 1 à 3, contando duas
 *   respostas para a recomendação;
 * - falha virando resultado: com o banco de questões bloqueado, a tela dizia
 *   "Você acertou 0 de 8 — Fácil" e gravava `easy` como recomendação;
 * - correção só pela cor da borda.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function abrir(page: Page, opcoes: { largura?: number; bloquearBanco?: boolean } = {}) {
  await page.setViewportSize({ width: opcoes.largura ?? 1280, height: 800 });
  let bloqueado = !!opcoes.bloquearBanco;
  await page.route('**/*', r => {
    const u = new URL(r.request().url());
    if (bloqueado && u.pathname.endsWith('/data/topics.js')) return r.abort();
    return u.hostname === 'localhost' ? r.continue() : r.abort();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  if (opcoes.bloquearBanco) {
    await page.locator('[data-portal-route="guest"]').click();
  } else {
    await injectGameState(page);
    await page.waitForLoadState('load');
  }
  await page.evaluate(() => { localStorage.removeItem('nefroquest-recommended-difficulty'); localStorage.removeItem('nefroquest-ritual-done'); });
  await page.evaluate(() => (window as any).openRitual());
  await expect(page.locator('#ritualPage')).toBeVisible();
  return { liberar: () => { bloqueado = false; } };
}

const gabarito = (page: Page) => page.evaluate(() => {
  const q = document.querySelector('#ritualPage .nq-exam-enunciado')?.textContent || '';
  const bank = (0, eval)('questionBank') as any[];
  return bank.find(x => x.q === q)?.a as number;
});

test('é página, e a jornada fica fora de alcance', async ({ page }) => {
  await abrir(page);
  const pagina = page.locator('#ritualPage');
  await expect(pagina).toHaveAttribute('role', 'main');
  expect(await pagina.evaluate(el => getComputedStyle(el).position)).not.toBe('fixed');
  await expect(page.getByRole('heading', { name: 'Ritual de Iniciação' })).toBeFocused();
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(true);
});

test('a mesma questão não conta duas vezes pelo teclado', async ({ page }) => {
  await abrir(page);
  await page.locator('#ritualStart').click();
  await expect(page.getByRole('heading', { name: 'Questão 1 de 8' })).toBeFocused();
  const botoes = page.locator('#ritualOpts button');
  await botoes.nth(0).click();
  await expect(botoes.nth(1)).toBeDisabled();
  await botoes.nth(1).focus().catch(() => {});
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Questão 2 de 8' })).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1200);
  await expect(page.getByRole('heading', { name: 'Questão 2 de 8' }), 'uma resposta a mais pulou a questão 2').toBeVisible();
});

test('a correção diz em texto qual era a certa e qual foi a sua', async ({ page }) => {
  await abrir(page);
  await page.locator('#ritualStart').click();
  const certa = await gabarito(page);
  const errada = (certa + 1) % 4;
  await page.locator('#ritualOpts button').nth(errada).click();
  await expect(page.locator('#ritualVeredito')).toHaveText(`Incorreto. A resposta certa é a ${'ABCD'[certa]}.`);
  await expect(page.locator('#ritualOpts button').nth(errada).locator('.nq-exam-marca')).toHaveText('Sua escolha');
  await expect(page.locator('#ritualOpts button').nth(certa).locator('.nq-exam-marca')).toHaveText('Resposta correta');
});

test('falha ao baixar as questões não vira recomendação, e a nova tentativa funciona', async ({ page }) => {
  const { liberar } = await abrir(page, { bloquearBanco: true });
  await page.locator('#ritualStart').click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar as questões');
  await expect(page.getByRole('alert')).toContainText('Nada foi registrado');
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-recommended-difficulty'))).toBeNull();
  await expect(page.locator('#ritualPage')).not.toContainText('Ritual concluído');

  liberar();
  await page.locator('#ritualStart').click();
  await expect(page.getByRole('heading', { name: 'Questão 1 de 8' })).toBeVisible({ timeout: 15_000 });
});

test('concluir grava a recomendação; Escape e "Agora não" devolvem a jornada', async ({ page }) => {
  await abrir(page);
  await page.locator('#ritualStart').click();
  for (let i = 1; i <= 8; i++) {
    await expect(page.getByRole('heading', { name: `Questão ${i} de 8` })).toBeVisible({ timeout: 5000 });
    await page.locator('#ritualOpts button').nth(await gabarito(page)).click();
  }
  await expect(page.getByRole('heading', { name: 'Ritual concluído' })).toBeFocused({ timeout: 5000 });
  await expect(page.locator('#ritualPage')).toContainText('Você acertou 8 de 8');
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-recommended-difficulty'))).toBe('hardcore');
  await page.keyboard.press('Escape');
  await expect(page.locator('#ritualPage')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeVisible();
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(false);

  await page.evaluate(() => (window as any).openRitual());
  await page.getByRole('button', { name: 'Agora não' }).click();
  await expect(page.locator('#ritualPage')).toHaveCount(0);
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200%, contraste e alvos de toque`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    await abrir(page, { largura });
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
    await page.locator('#ritualStart').click();
    await expect(page.locator('#ritualOpts button')).toHaveCount(4);
    // O sorteio decide a questão; palavras longas do banco (ex.:
    // "Hiperparatireoidismo") estouravam a 320px. Fixa o pior caso.
    await page.evaluate(() => {
      const longa = 'Hiperparatireoidismo pseudo-hipoaldosteronismo';
      document.querySelector('#ritualPage .nq-exam-enunciado')!.textContent = longa;
      document.querySelector('#ritualOpts button > span:last-child')!.textContent = longa;
    });
    const cortes = await page.evaluate(() => {
      const fora: string[] = [];
      const w = document.createTreeWalker(document.getElementById('ritualPage')!, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!(n.textContent || '').trim()) continue;
        const g = document.createRange(); g.selectNodeContents(n);
        for (const x of g.getClientRects()) if (x.width && (x.right > innerWidth + 1 || x.left < -1)) { fora.push((n.textContent || '').trim().slice(0, 25)); break; }
      }
      return fora;
    });
    expect(cortes).toEqual([]);
    for (const b of await page.locator('#ritualPage button').all()) {
      expect((await b.boundingBox())!.height, 'alvo de toque').toBeGreaterThanOrEqual(44);
    }
    const falhas = await page.evaluate(medirContraste, '#ritualPage');
    expect(falhas, JSON.stringify(falhas.map((f: any) => `${f.texto} ${f.razao}`))).toEqual([]);
  });
}
