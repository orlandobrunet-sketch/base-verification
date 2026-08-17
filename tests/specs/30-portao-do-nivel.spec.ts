import { test, expect, Page } from '@playwright/test';
import { saveBase } from '../helpers/fixtures';

/**
 * O portão real do nível (v14.60).
 *
 * A "próxima forma" é a recompensa visual mais forte da Visão geral, e o nível
 * não destrava por XP: `levelCapForCorrect` é `min(10, 1 + floor(acertos/10))`
 * e o XP excedente é descartado ao teto (js/game.js). O jogador via a barra
 * encher, parar, e não se mexer mais — sem explicação.
 */

const BASE_SAVE = saveBase();

async function abrir(page: Page, extra: Record<string, unknown> = {}) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, extra }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify({ ...save, ...(extra as object) }));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
      totalQuestions: 96, totalCorrect: 61, totalWrong: 35,
      byCategory: { drc: { correct: 9, wrong: 14 } }, dailyActivity: {},
    }));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: BASE_SAVE, extra });
  await page.reload();
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
}

test.describe('Portão do nível', () => {
  test('diz em quantos acertos a próxima forma abre e quantos faltam', async ({ page }) => {
    await abrir(page); // nível 6, 47 acertos -> nível 7 abre em 60, faltam 13
    const gate = page.locator('#nqdPane-overview .nqd-level-gate');
    await expect(gate).toBeVisible();
    await expect(gate).toContainText('Nível 7 abre em 60 acertos');
    await expect(gate).toContainText('faltam 13');
  });

  test('com a barra de XP cheia, explica que o que destrava é acerto', async ({ page }) => {
    await abrir(page, { xp: 480, xpToNext: 480, correctTotal: 52 });
    const gate = page.locator('#nqdPane-overview .nqd-level-gate');
    await expect(gate).toContainText('faltam 8');
    await expect(gate, 'a barra parada sem explicação era o defeito').toContainText('acerto, não experiência');
  });

  test('atingido o limiar, anuncia liberado em vez de exigir mais', async ({ page }) => {
    await abrir(page, { correctTotal: 60 });
    const gate = page.locator('#nqdPane-overview .nqd-level-gate');
    await expect(gate).toContainText('Nível 7 liberado');
    await expect(gate).not.toContainText('faltam');
  });

  test('no nível máximo não promete um nível que não existe', async ({ page }) => {
    await abrir(page, { level: 10, correctTotal: 100 });
    await expect(page.locator('#nqdPane-overview .nqd-level-gate')).toHaveCount(0);
    await expect(page.locator('#nqdPane-overview .nqd-next-form.is-complete')).toBeVisible();
  });

  test('o número exibido é o portão real, não o XP', async ({ page }) => {
    await abrir(page);
    const gate = await page.locator('#nqdPane-overview .nqd-level-gate').innerText();
    // 210/480 é o XP; nada disso pode aparecer como condição de evolução.
    expect(gate).not.toContain('210');
    expect(gate).not.toContain('480');
  });
});

test.describe('Estados vazios com saída', () => {
  test('o Grimório vazio oferece um caminho e não quebra a aba', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', e => erros.push(String(e)));

    await abrir(page);
    await page.getByRole('tab', { name: 'Grimório', exact: true }).click();

    const vazio = page.locator('#nqdPane-library [data-library-empty]');
    await expect(vazio).toBeVisible();
    await expect(vazio.getByRole('button')).toBeVisible();

    // _libraryCards(items) não recebe `data`: usar data.save ali lançaria
    // ReferenceError e derrubaria a aba inteira — node --check não pega isso.
    expect(erros, `erro de runtime ao montar o Grimório: ${erros.join(' | ')}`).toEqual([]);
  });

  test('competências sem amostra oferecem como gerar a primeira', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(save => {
      localStorage.setItem('nefroquest-save', JSON.stringify(save));
      localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
        totalQuestions: 0, totalCorrect: 0, totalWrong: 0, byCategory: {}, dailyActivity: {},
      }));
      localStorage.setItem('nefroquest-premium', '1');
    }, BASE_SAVE);
    await page.reload();
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(() => (window as any).openDashboard());
    await page.getByRole('tab', { name: 'Competências', exact: true }).click();

    const painel = page.locator('#nqdPane-skills');
    const vazio = painel.locator('.nqd-empty');
    if (await vazio.count()) {
      await expect(vazio.getByRole('button'), 'estado vazio sem ação é beco sem saída').toBeVisible();
    }
  });
});
