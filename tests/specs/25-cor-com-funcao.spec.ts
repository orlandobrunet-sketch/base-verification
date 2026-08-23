import { test, expect, Page } from '@playwright/test';
import { saveBase, statsBase } from '../helpers/fixtures';
import { injectGameState } from '../helpers/game';

/**
 * Cor com função (v14.54).
 *
 * A gramática de estado no conteúdo estava certa, mas a moldura em volta usava
 * as mesmas cinco cores sem função nenhuma — barra lateral com uma cor de
 * identidade por aba, e ciano como padrão de qualquer metadado. Com mais pixels
 * de cor decorativa do que semântica, o olho aprende a descontar a cor: é por
 * isso que a tela lia como monocrômica tendo seis cores.
 *
 * Estes cenários afirmam a cor RESOLVIDA no navegador, não a regra no arquivo.
 */

const SAVE = saveBase();
const STATS = statsBase();

async function abrirCentral(page: Page) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, stats }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE, stats: STATS });
  await page.reload();
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
}

/** Cor resolvida, normalizada em rgb(). */
async function cor(page: Page, seletor: string) {
  return page.locator(seletor).first().evaluate(el => getComputedStyle(el).color);
}

test.describe('Cor com função', () => {
  test('a barra lateral não dá uma cor de identidade por aba', async ({ page }) => {
    await abrirCentral(page);
    const cores = await page.locator('#nqDashboard .nqd-nav-item').evaluateAll(els =>
      els.map(el => getComputedStyle(el).getPropertyValue('--nqd-tab-accent').trim())
    );
    expect(cores.length).toBeGreaterThan(1);
    // Todas as abas resolvem para o mesmo acento — cor deixa de ser identidade
    // de navegação e volta a marcar estado no conteúdo.
    expect(new Set(cores).size, `abas ainda têm cores distintas: ${[...new Set(cores)].join(', ')}`).toBe(1);
  });

  test('cada instrumento do dock tem a sua própria cor', async ({ page }) => {
    // Invertido de propósito na v14.79. O #759 tinha neutralizado as seis cores
    // por consistência com a barra lateral da Central, e este teste congelava
    // isso. O proprietário do produto pediu as cores de volta olhando a tela.
    //
    // O teste não foi apagado: foi virado. Antes protegia a neutralização;
    // agora protege as cores. Uma próxima auditoria de design que queira
    // neutralizar o dock de novo vai encontrar um teste vermelho e uma conversa
    // a ter, em vez de um caminho livre.
    //
    // A regra da Central segue intacta no cenário acima: lá a barra lateral
    // continua sem cor por aba. Não é a mesma superfície.
    await page.goto('/jogar/');
    await injectGameState(page);
    await expect(page.locator('#mainApp')).toBeVisible({ timeout: 10000 });

    const cores = await page.locator('.dock-btn:not(.next-question-dock)').evaluateAll(els =>
      els.map(el => getComputedStyle(el).getPropertyValue('--nql-dock-rgb').trim())
    );
    expect(cores.length, 'o dock precisa ter instrumentos para medir').toBeGreaterThan(1);
    expect(new Set(cores).size,
      `instrumentos do dock voltaram a compartilhar cor: ${[...new Set(cores)].join(' | ')}`).toBe(cores.length);
  });

  test('o rótulo de recompensa é ouro, não ciano', async ({ page }) => {
    await abrirCentral(page);
    await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();

    const recompensa = page.locator('#nqdPane-achievements .nqd-eyebrow--reward');
    expect(await recompensa.count(), 'o spotlight de conquistas precisa marcar recompensa').toBeGreaterThan(0);

    const ouro = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#nqDashboard') as Element).getPropertyValue('--nqd-gold').trim()
    );
    const aplicada = await cor(page, '#nqdPane-achievements .nqd-eyebrow--reward');
    const alvo = await page.evaluate(t => {
      const d = document.createElement('div');
      d.style.color = t; document.body.appendChild(d);
      const c = getComputedStyle(d).color; d.remove(); return c;
    }, ouro);
    expect(aplicada).toBe(alvo);
  });

  test('o eyebrow neutro não usa a cor de leitura clínica', async ({ page }) => {
    await abrirCentral(page);
    const neutro = page.locator('#nqdPane-overview .nqd-eyebrow:not(.nqd-eyebrow--reward):not(.nqd-eyebrow--clinical)');
    expect(await neutro.count()).toBeGreaterThan(0);

    const ciano = await page.evaluate(() => {
      const raiz = document.querySelector('#nqDashboard') as Element;
      const v = getComputedStyle(raiz).getPropertyValue('--nqd-cyan').trim();
      const d = document.createElement('div');
      d.style.color = v; document.body.appendChild(d);
      const c = getComputedStyle(d).color; d.remove(); return c;
    });
    const aplicada = await neutro.first().evaluate(el => getComputedStyle(el).color);
    expect(aplicada, 'metadado neutro não pode competir com a leitura clínica').not.toBe(ciano);
  });

  test('magenta saiu do sistema — só as cinco funções permanecem', async ({ page }) => {
    await abrirCentral(page);
    const magenta = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#nqDashboard') as Element).getPropertyValue('--nqd-magenta').trim()
    );
    expect(magenta).toBe('');
  });
});
