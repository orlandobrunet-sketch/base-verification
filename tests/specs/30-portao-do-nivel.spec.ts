import { test, expect, Page } from '@playwright/test';
import { saveBase } from '../helpers/fixtures';

/**
 * O portão real do nível é apresentado no Átrio. A Visão geral já não tem
 * galeria de personagem: ela não deve ser restaurada para satisfazer o teste.
 * XP e acertos são requisitos distintos; a prévia não aplica a evolução nem
 * modifica a jornada salva.
 */

const BASE_SAVE = saveBase();

async function abrirPortaoNoAtrio(page: Page, extra: Record<string, unknown> = {}) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
  const original = await page.evaluate(save => {
    const raw = JSON.stringify(save);
    localStorage.setItem('nefroquest-save', raw);
    return raw;
  }, { ...BASE_SAVE, ...extra });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
  await page.evaluate(() => (window as any).playAsGuest());
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('#welcomeSavedInfo')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(original);
  return original;
}

async function expectPreviewPreserved(page: Page, original: string) {
  const resume = page.locator('#welcomeContinueBtn');
  await resume.focus();
  await expect(resume).toBeFocused();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow')));
  await expect(page.locator('#welcomeSavedInfo')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save'))).toBe(original);
}

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
  test('o Átrio mostra a próxima forma e quantos acertos faltam sem alterar a jornada', async ({ page }) => {
    const original = await abrirPortaoNoAtrio(page); // nível 6, 47 acertos: faltam 13 para o nível 7
    const next = page.locator('#wsSavedNextLevel');
    const milestone = page.locator('#wsSavedMilestone');
    await expect(next).toBeVisible();
    await expect(next).toHaveText('Nível 7');
    await expect(milestone).toBeVisible();
    await expect(milestone).toContainText('13 acertos');
    expect(await page.evaluate(() => [(window as any).levelCapForCorrect(59), (window as any).levelCapForCorrect(60)])).toEqual([6, 7]);
    await expectPreviewPreserved(page, original);
  });

  test('com a barra de XP cheia, explica que o que destrava é acerto', async ({ page }) => {
    const original = await abrirPortaoNoAtrio(page, { xp: 480, xpToNext: 480, correctTotal: 52 });
    const milestone = page.locator('#wsSavedMilestone');
    await expect(milestone).toBeVisible();
    await expect(milestone, 'XP completo não pode esconder os acertos pendentes').toHaveText('XP completo · 8 acertos para evoluir');
    await expect(page.locator('#wsSavedProgress')).toHaveAttribute('aria-valuenow', '100');
    await expect(page.locator('#wsSavedNextLevel')).toHaveText('Nível 7');
    await expectPreviewPreserved(page, original);
  });

  test('atingidos os requisitos de XP e acertos, convida a retomar sem exigir mais', async ({ page }) => {
    const original = await abrirPortaoNoAtrio(page, { xp: 480, correctTotal: 60 });
    const milestone = page.locator('#wsSavedMilestone');
    await expect(milestone).toBeVisible();
    await expect(milestone).toHaveText('Requisitos completos · retome a jornada');
    await expect(milestone).not.toContainText(/faltam|acertos para evoluir/);
    await expect(page.locator('#wsSavedNextLevel')).toHaveText('Nível 7');
    // A prévia não consome XP nem promove o nível antes da próxima resposta.
    await expect(page.locator('#wsSavedLevel')).toHaveText('06');
    await expectPreviewPreserved(page, original);
  });

  test('no nível máximo não promete um nível que não existe', async ({ page }) => {
    const original = await abrirPortaoNoAtrio(page, { level: 10, correctTotal: 100 });
    const next = page.locator('#wsSavedNextLevel');
    await expect(next).toBeVisible();
    await expect(next).toHaveText('Domínio máximo');
    await expect(page.locator('#wsSavedLevel')).toHaveText('10');
    await expect(page.locator('#wsSavedXpText')).toHaveText('Domínio máximo alcançado');
    await expect(page.locator('#wsSavedMilestone')).toHaveText('100 de 100 acertos na jornada');
    const avatar = page.locator('#wsSavedAvatar');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('src', /\/nivel_10\.webp(?:\?.*)?$/);
    await expect(page.locator('#welcomeSavedInfo')).not.toContainText('Nível 11');
    expect(await page.evaluate(() => (window as any).levelCapForCorrect(100))).toBe(10);
    await expectPreviewPreserved(page, original);
  });

  test('atingir os acertos não oculta XP ainda pendente nem aplica a evolução', async ({ page }) => {
    const original = await abrirPortaoNoAtrio(page, { correctTotal: 60 });
    const missingXp = await page.evaluate(() => (window as any).xpForLevel(6) - 210);
    expect(missingXp).toBeGreaterThan(0);
    const milestone = page.locator('#wsSavedMilestone');
    await expect(milestone).toBeVisible();
    await expect(milestone).toHaveText(`Acertos completos · faltam ${missingXp} XP`);
    await expect(milestone).not.toContainText('acertos para evoluir');
    await expect(page.locator('#wsSavedNextLevel')).toHaveText('Nível 7');
    await expect(page.locator('#wsSavedLevel')).toHaveText('06');
    await expectPreviewPreserved(page, original);
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
