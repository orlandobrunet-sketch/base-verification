import { test, expect, type Page } from '@playwright/test';

/**
 * A jornada principal, ponta a ponta, como o NQ-03 pede:
 *
 *   Portal → Átrio → Dificuldade → Classe → Questão → Feedback → Central → Retomada
 *
 * Até aqui a suíte cobria cada tela isoladamente, quase sempre entrando por
 * `injectGameState`, que pula o começo. Ninguém percorria o caminho inteiro do
 * jeito que uma pessoa percorre — e é justamente na emenda entre telas que
 * mora o defeito que nenhum teste de tela isolada vê.
 */

const PASSOS = {
  portal: '#portalMain',
  atrio: '#atriumMain',
  classe: '#charSelectModal',
  jogo: '#mainApp',
} as const;

/* Só contam erros do NOSSO código.
 *
 * Filtrar por texto não servia: o Turnstile do Cloudflare emite uma detecção
 * de devtools que chega ao console como erro e não traz a palavra "Turnstile"
 * em lugar nenhum da mensagem — só na URL de origem. A origem diz o que o
 * texto esconde, então o corte é por URL.
 *
 * `pageerror` entra sempre: exceção não capturada é nossa por definição. */
function coletarErros(page: Page) {
  const erros: string[] = [];
  const nosso = (url: string) => !url || url.includes('localhost') || url.includes('127.0.0.1');
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (!nosso(m.location().url || '')) return;
    erros.push(m.text());
  });
  page.on('pageerror', (erro) => erros.push(`pageerror: ${erro.message}`));
  return erros;
}

/* "Alguma das que casam está visível", não "a primeira está visível": o link
 * da marca existe em três lugares (portal, átrio, rodapé) e só um deles está
 * na tela por vez. Perguntar pela primeira dava falso negativo. */
const visivel = async (page: Page, sel: string) =>
  (await page.locator(sel).evaluateAll((els) =>
    els.some((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el as HTMLElement).visibility !== 'hidden';
    }),
  ).catch(() => false));

/** Percorre a jornada inteira, parando em cada emenda. */
async function percorrer(page: Page, aoChegar?: (etapa: string) => Promise<void>) {
  await page.goto('/jogar/', { waitUntil: 'load' });
  await expect(page.locator(PASSOS.portal)).toBeVisible({ timeout: 20000 });
  await aoChegar?.('portal');

  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator(PASSOS.atrio)).toBeVisible({ timeout: 20000 });
  await aoChegar?.('atrio');

  await page.locator('[data-action="startNewFromWelcome"]').first().click();
  await expect(page.locator('#diffConfirmBtn')).toBeVisible({ timeout: 20000 });
  await aoChegar?.('dificuldade');

  await page.locator('[data-action="_selectDiffCard"]').first().click();
  await expect(page.locator('#diffConfirmBtn')).toBeEnabled();
  await page.locator('#diffConfirmBtn').click();
  await expect(page.locator(PASSOS.classe)).toBeVisible({ timeout: 20000 });
  await aoChegar?.('classe');

  await page.locator('.nqc-card[data-char="nephros"]').click();
  await expect(page.locator(PASSOS.jogo)).toBeVisible({ timeout: 20000 });

  /* A narrativa de abertura fica por cima do jogo e segura a primeira
   * questão. Ela É parte da jornada — não um estorvo do teste —, e por isso
   * aparece aqui como etapa, com o mesmo clique que a pessoa daria. */
  const abertura = page.locator('[data-action="closeIntroAndStart"]');
  await expect(abertura).toBeVisible({ timeout: 20000 });
  await aoChegar?.('abertura');
  await abertura.click();

  await expect(page.locator('#question')).not.toHaveText('', { timeout: 25000 });
  await aoChegar?.('jogo');
}

test.describe('A jornada completa, do portal à retomada', () => {
  for (const [nome, largura] of [['desktop', 1280], ['celular', 390]] as const) {
    test(`chega ao jogo pelo caminho do usuário — ${nome}`, async ({ page }) => {
      test.setTimeout(180000);
      await page.setViewportSize({ width: largura, height: largura === 390 ? 844 : 800 });
      const erros = coletarErros(page);
      const vistos: string[] = [];
      await percorrer(page, async (etapa) => { vistos.push(etapa); });

      expect(vistos, 'alguma emenda da jornada não foi alcançada').toEqual([
        'portal', 'atrio', 'dificuldade', 'classe', 'abertura', 'jogo',
      ]);
      expect(erros, `erro de console durante a jornada: ${erros.join(' | ')}`).toEqual([]);
    });
  }

  test('cada etapa oferece caminho de volta', async ({ page }) => {
    test.setTimeout(180000);
    // "Sem caminho de volta" é a reclamação mais cara de UI: a pessoa fica
    // presa e recarrega, perdendo o contexto.
    const semVolta: string[] = [];
    await percorrer(page, async (etapa) => {
      if (etapa === 'portal') return; // o portal É o começo
      /* Seletores medidos na tela, não deduzidos da marcação: a primeira
       * versão deste teste acusou "atrio, dificuldade, jogo" sem saída, e as
       * três tinham. O defeito era meu. */
      const saidas: Record<string, string> = {
        atrio: 'a[aria-label*="voltar à página inicial"]',
        dificuldade: '[data-action="_closeDifficultySelector"]',
        classe: '[data-action="closeCharSelectModal"]',
        abertura: '[data-action="closeIntroAndStart"]',
        jogo: '[data-action="goToWelcomeFromGame"]',
      };
      const saida = saidas[etapa];
      if (!saida) return;
      if (!(await visivel(page, saida))) semVolta.push(etapa);
    });
    expect(semVolta, `etapas sem saída visível: ${semVolta.join(', ')}`).toEqual([]);
  });

  test('responder leva a feedback, e a Central abre de dentro do jogo', async ({ page }) => {
    test.setTimeout(180000);
    await percorrer(page);

    await page.locator('#options .option').first().click();
    await expect(page.locator('#feedback, .feedback')).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => (window as any).openDashboard());
    await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible({ timeout: 25000 });
    await page.locator('#nqDashboard [data-action="closeDashboard"]').first().click();
    await expect(page.locator('#nqDashboard')).toHaveCount(0);
    // Fechar a Central devolve ao jogo, não ao portal.
    await expect(page.locator(PASSOS.jogo)).toBeVisible();
  });

  test('recarregar no meio devolve ao Átrio com a jornada retomável', async ({ page }) => {
    test.setTimeout(180000);
    /* Medido antes de afirmar: recarregar NÃO devolve direto ao jogo, e isso
     * é desenho, não defeito. A pessoa cai no Átrio com "Retomar jornada"
     * como primeira ação. O contrato que importa é outro:
     *
     *   1. não voltar ao Portal — ninguém deve reentrar do zero;
     *   2. existir a porta de volta ao jogo;
     *   3. o progresso atravessar o reload.
     *
     * A primeira versão deste teste exigia `#mainApp` e reprovava um produto
     * que estava certo. */
    await percorrer(page);
    await page.locator('#options .option').first().click();
    await page.waitForTimeout(1200);
    const antes = await page.evaluate(() => (window as any).state?.correctTotal ?? null);

    await page.reload({ waitUntil: 'load' });
    await expect(page.locator(PASSOS.atrio)).toBeVisible({ timeout: 25000 });
    await expect(page.locator(PASSOS.portal), 'recarregar mandou reentrar pelo portal').toBeHidden();

    const retomar = page.getByRole('button', { name: /retomar jornada/i }).first();
    await expect(retomar, 'sem porta de volta depois do reload').toBeVisible();
    await retomar.click();

    await expect(page.locator(PASSOS.jogo)).toBeVisible({ timeout: 25000 });
    const depois = await page.evaluate(() => (window as any).state?.correctTotal ?? null);
    expect(depois, 'o progresso não sobreviveu ao reload').toBe(antes);
  });
});

/**
 * O NQ-03 pede teclado e movimento reduzido na jornada, não só em telas soltas.
 *
 * Estes dois cenários não repetem a jornada inteira: verificam a propriedade
 * que a jornada precisa ter para ser percorrível sem mouse e sem animação.
 */
test.describe('A jornada sem mouse e sem animação', () => {
  test('dá para sair do Portal só com o teclado', async ({ page }) => {
    test.setTimeout(180000);
    await page.goto('/jogar/', { waitUntil: 'load' });
    await expect(page.locator(PASSOS.portal)).toBeVisible({ timeout: 20000 });

    // Tabula até a entrada de visitante e aciona com Enter. Se a rota não for
    // alcançável por teclado, não há como entrar sem mouse.
    let achou = false;
    for (let i = 0; i < 25 && !achou; i++) {
      await page.keyboard.press('Tab');
      achou = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-portal-route') === 'guest');
    }
    expect(achou, 'a entrada de visitante não é alcançável por Tab').toBe(true);

    await page.keyboard.press('Enter');
    await expect(page.locator(PASSOS.atrio)).toBeVisible({ timeout: 20000 });
  });

  test('a jornada completa acontece com movimento reduzido', async ({ page }) => {
    test.setTimeout(180000);
    // A contrapartida de animar transições: quem pede menos movimento não pode
    // ficar preso numa tela que só avança quando a animação termina.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const erros = coletarErros(page);
    const vistos: string[] = [];
    await percorrer(page, async (etapa) => { vistos.push(etapa); });

    expect(vistos).toEqual(['portal', 'atrio', 'dificuldade', 'classe', 'abertura', 'jogo']);
    expect(erros, `erro de console com movimento reduzido: ${erros.join(' | ')}`).toEqual([]);
  });
});
