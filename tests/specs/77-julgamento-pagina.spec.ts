import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Julgamento Rápido como página própria.
 *
 * Defeitos reproduzidos antes do conserto:
 * - item perdido: com 8+ acertos o resultado dizia "Item conquistado", mas
 *   fechar pelo ✕ ou pelo Escape não equipava nem vendia o item (só o botão
 *   "Continuar" entregava) e o HUD ficava com o ouro antigo;
 * - a explicação sumia em 1 segundo, sem tempo de leitura;
 * - ao errar, a resposta certa era indicada só por um brilho verde.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function abrir(page: Page, { standalone = true, largura = 1280, relogio = false, qid = '' } = {}) {
  await page.setViewportSize({ width: largura, height: 800 });
  if (relogio) await page.clock.install();
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
  const selecionada = await page.evaluate(({ standalone, qid }) => {
    if (!qid) { (window as any).showRapidQuizMinigame(standalone); return ''; }
    // Mantém o banco e o fluxo reais; controla somente o sorteio para que a
    // explicação longa que falhou na CI não seja trocada no próximo retry.
    const questoes = (0, eval)('RAPID_QUIZ_QUESTIONS') as any[];
    const indice = questoes.findIndex(q => q.qid === qid);
    if (indice < 0) throw new Error(`Questão ausente: ${qid}`);
    let i = questoes.length - 1;
    const randomOriginal = Math.random;
    Math.random = () => i-- === indice ? 0 : 1 - Number.EPSILON;
    try { (window as any).showRapidQuizMinigame(standalone); }
    finally { Math.random = randomOriginal; }
    return questoes.find(q => q.q === document.getElementById('mgStmt')!.textContent)?.qid;
  }, { standalone, qid });
  if (qid) expect(selecionada).toBe(qid);
  await expect(page.locator('#rapidQuizPage')).toBeVisible();
}

const verdadeira = (page: Page) => page.evaluate(() => {
  const t = document.getElementById('mgStmt')!.textContent;
  return ((0, eval)('RAPID_QUIZ_QUESTIONS') as any[]).find(q => q.q === t).ans as boolean;
});

test('é página, e a jornada fica fora de alcance', async ({ page }) => {
  await abrir(page);
  const pagina = page.locator('#rapidQuizPage');
  await expect(pagina).toHaveAttribute('role', 'main');
  expect(await pagina.evaluate(el => getComputedStyle(el).position)).not.toBe('fixed');
  await expect(page.getByRole('heading', { name: 'Afirmação 1 de 10' })).toBeFocused();
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(true);
});

test('o item conquistado é entregue também ao sair pelo Escape, e o HUD mostra o ouro novo', async ({ page }) => {
  await abrir(page, { standalone: false });
  const antes = await page.evaluate(() => JSON.stringify((0, eval)('state').equipment));
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByRole('heading', { name: `Afirmação ${i} de 10` })).toBeVisible();
    await page.locator(await verdadeira(page) ? '#mgTrue' : '#mgFalse').click();
    await page.locator('#mgProxima').click();
  }
  await expect(page.getByRole('heading', { name: 'Resultado do Julgamento Rápido' })).toBeFocused();
  await expect(page.locator('#rapidQuizPage')).toContainText('Item conquistado');
  await page.keyboard.press('Escape');
  await expect(page.locator('#rapidQuizPage')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.stringify((0, eval)('state').equipment)), { timeout: 5000 }).not.toBe(antes);
  const ouro = await page.evaluate(() => String((0, eval)('state').gold));
  await expect(page.locator('#gold')).toHaveText(ouro);
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(false);
});

test('a explicação fica até o jogador avançar, e a correção diz em texto', async ({ page }) => {
  await abrir(page);
  const certa = await verdadeira(page);
  await page.locator(certa ? '#mgFalse' : '#mgTrue').click();
  await expect(page.locator('#mgFeedback')).toContainText(`Incorreto. A afirmação é ${certa ? 'verdadeira' : 'falsa'}.`);
  await expect(page.locator(certa ? '#mgTrue' : '#mgFalse').locator('.nq-exam-marca')).toHaveText('Resposta correta');
  await expect(page.locator(certa ? '#mgFalse' : '#mgTrue').locator('.nq-exam-marca')).toHaveText('Sua escolha');
  await expect(page.locator('#mgProxima')).toBeFocused();
  await page.waitForTimeout(2500);
  await expect(page.getByRole('heading', { name: 'Afirmação 1 de 10' }), 'a explicação sumiu sozinha').toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Afirmação 2 de 10' })).toBeFocused();
});

test('atalhos V e F respondem uma vez só', async ({ page }) => {
  await abrir(page);
  await page.keyboard.press('v');
  await page.keyboard.press('f');
  await expect(page.locator('#mgTrue')).toBeDisabled();
  await expect(page.locator('.nq-exam-marca')).toHaveCount(await verdadeira(page) ? 1 : 2);
  await expect(page.locator('#mgFeedback')).toContainText(await verdadeira(page) ? 'Correto.' : 'Incorreto.');
});

test('tempo esgotado diz a resposta e para o cronômetro', async ({ page }) => {
  await abrir(page, { relogio: true });
  const certa = await verdadeira(page);
  await page.clock.runFor(13_000);
  await expect(page.locator('#mgFeedback')).toContainText(`Tempo esgotado. A afirmação é ${certa ? 'verdadeira' : 'falsa'}.`);
  await page.clock.runFor(5_000);
  await expect(page.getByRole('heading', { name: 'Afirmação 1 de 10' })).toBeVisible();
});

test('sair devolve a jornada e o foco', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.locator('#rapidQuizPage')).toHaveCount(0);
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200%, contraste e alvos de toque`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    await abrir(page, { largura, qid: '8e763ea6' });
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
    await page.locator('#mgTrue').click();
    await expect(page.locator('#mgProxima')).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    const correcao = await page.locator('#mgFeedback').evaluate(el => {
      const fora: Array<{ texto: string; esquerda: number; direita: number; limiteEsquerdo: number; limiteDireito: number }> = [];
      for (const p of el.querySelectorAll('p')) {
        const limite = p.getBoundingClientRect();
        const range = document.createRange(); range.selectNodeContents(p);
        for (const r of range.getClientRects()) {
          if (r.width && (r.left < limite.left - 1 || r.right > limite.right + 1)) {
            fora.push({ texto: p.textContent || '', esquerda: r.left, direita: r.right, limiteEsquerdo: limite.left, limiteDireito: limite.right });
          }
        }
      }
      return { qid: '8e763ea6', largura: innerWidth, fonteRaiz: getComputedStyle(document.documentElement).fontSize, fontes: document.fonts.status, fora };
    });
    await info.attach('correcao-questao-fixa', { body: JSON.stringify(correcao, null, 2), contentType: 'application/json' });
    await info.attach('correcao-200-porcento', { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
    expect(correcao.fora, 'a explicação ultrapassa a largura útil do próprio card').toEqual([]);
    const cortes = await page.evaluate(() => {
      const fora: string[] = [];
      const w = document.createTreeWalker(document.getElementById('rapidQuizPage')!, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!(n.textContent || '').trim()) continue;
        const g = document.createRange(); g.selectNodeContents(n);
        for (const x of g.getClientRects()) if (x.width && (x.right > innerWidth + 1 || x.left < -1)) { fora.push((n.textContent || '').trim().slice(0, 25)); break; }
      }
      return fora;
    });
    expect(cortes).toEqual([]);
    for (const b of await page.locator('#rapidQuizPage button').all()) {
      expect((await b.boundingBox())!.height, 'alvo de toque').toBeGreaterThanOrEqual(44);
    }
    const falhas = await page.evaluate(medirContraste, '#rapidQuizPage');
    expect(falhas, JSON.stringify(falhas.map((f: any) => `${f.texto} ${f.razao}`))).toEqual([]);
  });
}
