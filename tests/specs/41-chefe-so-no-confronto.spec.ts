import { test, expect, type Page } from '@playwright/test';

/**
 * O feitiço do Arqui-Nefromante caía sobre quem estava no começo da jornada.
 *
 * REPRODUZIDO a partir do relato: nível 4, 93 acertos, 737 cartas restantes, e
 * o layout NORMAL na tela — não o do Confronto Final.
 *
 * As etapas narrativas do chefe eram escolhidas só pelo contador:
 *
 *     narrativeStages.find(s => s.at === state.correctTotal && ...)
 *
 * Nenhuma delas perguntava se o Confronto Final estava de fato acontecendo. E o
 * contador pode estar alto sem a batalha existir — foi o que aconteceu: o
 * atalho de administrador "pular para o chefe" grava correctTotal = 90 no save
 * e reembaralha o baralho, sem tocar em nível nem pontos. A partir daí, três
 * acertos em qualquer sessão futura levam o contador a 93 e o feitiço dispara.
 *
 * `isBossBattle()` já existia e já respondia certo: exige jogo começado,
 * correctTotal >= 90 e jornada não concluída. Faltava consultá-la.
 */

const SAVE_VICIADO = {
  schemaVersion: 2,
  level: 4, xp: 40, xpToNext: 400, score: 6488,
  lives: 3, streak: 0, gold: 80, bonusUses: 0,
  // O contador que o atalho de administrador deixou para trás.
  correctTotal: 92,
  narrativeShown: 90,
  bossIntroShown: true,
  gameOver: false, gameStarted: true,
  difficulty: 'normal', character: 'glomerulus',
  idx: 0, queueIds: [], recentIds: [],
  chestsOpened: 2, timestamp: Date.now(),
};

async function abrirCom(page: Page, save: Record<string, unknown>, jornadaConcluida: boolean) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ s, concluida }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(s));
    localStorage.setItem('nefroquest-premium', '1');
    // Quem já derrotou o Arqui-Nefromante carrega esta marca, e é ela que faz
    // isBossBattle() responder "não" mesmo com o contador alto.
    if (concluida) localStorage.setItem('nefroquest-arqui-defeated', '1');
    else localStorage.removeItem('nefroquest-arqui-defeated');
  }, { s: save, concluida: jornadaConcluida });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForFunction(() => typeof (window as any).continueGame === 'function', undefined, { timeout: 15000 });
  await page.evaluate(async () => { await (window as any).continueGame?.(); });
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15000 });
}

/** Leva o contador até `alvo` sem passar pela UI, e roda o gatilho narrativo. */
async function avancarAcertosAte(page: Page, alvo: number) {
  await page.evaluate((n) => {
    const g = window as any;
    g.state.correctTotal = n;
    g.checkNarrative?.();
  }, alvo);
  await page.waitForTimeout(500);
}

const estaAtordoado = (page: Page) => page.evaluate(() => ({
  estado: !!(window as any).state?.bossStunActive,
  classe: document.body.classList.contains('boss-stun-active'),
  tarja: !!document.querySelector('.equip-stun-overlay'),
}));

test.describe('Feitiço do Arqui-Nefromante', () => {
  test('não dispara com a jornada já concluída, mesmo com o contador em 93', async ({ page }) => {
    // O caso relatado: contador alto herdado, Confronto Final inativo.
    await abrirCom(page, SAVE_VICIADO, true);

    const noConfronto = await page.evaluate(() => (window as any).isBossBattle?.());
    expect(noConfronto, 'o cenário exige que o Confronto Final esteja INATIVO').toBe(false);

    await avancarAcertosAte(page, 93);

    const atordoado = await estaAtordoado(page);
    expect(atordoado.estado, 'o feitiço disparou fora do Confronto Final').toBe(false);
    expect(atordoado.classe, 'a marca de atordoamento entrou no body fora do Confronto Final').toBe(false);
    expect(atordoado.tarja, 'a tarja de equipamentos paralisados apareceu fora do Confronto Final').toBe(false);
  });

  test('continua disparando quando o Confronto Final está de fato ativo', async ({ page }) => {
    // A contrapartida: o conserto não pode matar a mecânica do chefe.
    await abrirCom(page, SAVE_VICIADO, false);

    const noConfronto = await page.evaluate(() => (window as any).isBossBattle?.());
    expect(noConfronto, 'sem a marca de vitória, o Confronto Final tem de estar ativo').toBe(true);

    await avancarAcertosAte(page, 93);

    const atordoado = await estaAtordoado(page);
    expect(atordoado.estado, 'o feitiço precisa continuar existindo no Confronto Final').toBe(true);
  });

  test('a recuperação em 98 também exige o Confronto Final', async ({ page }) => {
    await abrirCom(page, { ...SAVE_VICIADO, narrativeShown: 97 }, true);
    await avancarAcertosAte(page, 98);

    const houvePopup = await page.evaluate(() => !!document.querySelector('#narrativePopup, .narrative-popup'));
    expect(houvePopup, 'a recuperação do herói apareceu fora do Confronto Final').toBe(false);
  });

  test('a entrada do chefe em 90 também exige o Confronto Final', async ({ page }) => {
    await abrirCom(page, { ...SAVE_VICIADO, correctTotal: 89, narrativeShown: 85, bossIntroShown: false }, true);
    await avancarAcertosAte(page, 90);

    const intro = await page.evaluate(() => ({
      marcada: !!(window as any).state?.bossIntroShown,
      popup: !!document.querySelector('#bossIntroPopup'),
    }));
    expect(intro.popup, 'a entrada do chefe apareceu com a jornada já concluída').toBe(false);
  });
});
