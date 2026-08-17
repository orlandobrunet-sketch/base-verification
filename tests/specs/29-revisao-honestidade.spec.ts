import { test, expect, Page } from '@playwright/test';
import { saveBase, statsBase, diaChave } from '../helpers/fixtures';

/**
 * Revisão dos achados que ficaram para trás (v14.59).
 *
 * A auditoria multidisciplinar produziu mais achados verificados do que as
 * quatro frentes cobriram. Estes cenários fecham três deles:
 *
 *  1. o Pulso prometia "últimos sete dias" e exibia o acumulado vitalício;
 *  2. três agrupamentos usavam aria-label em <div> genérico — atributo que
 *     leitor de tela ignora em role=generic, e que o axe não sinaliza;
 *  3. o ranking despejava até 50 linhas de tabela dentro de aria-live.
 */

const SAVE = saveBase();

/**
 * 96 respostas na vida, mas só 14 dentro da janela de sete dias.
 *
 * A chave de dia vem de `diaChave`, que ancora no meio-dia antes de recuar —
 * subtrair milissegundos direto poderia cair no dia anterior numa virada de
 * horário de verão, e o cenário passaria a medir uma janela diferente da que
 * declara.
 */
function statsComJanela() {
  return statsBase({
    dailyActivity: {
      [diaChave(0)]: { count: 6, correct: 5 },
      [diaChave(2)]: { count: 5, correct: 4 },
      [diaChave(5)]: { count: 3, correct: 3 },
    },
  });
}

async function abrirCentral(page: Page) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, stats }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE, stats: statsComJanela() });
  await page.reload();
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
}

test.describe('Pulso: o número obedece ao cabeçalho', () => {
  test('o destaque é a janela de sete dias, não o acumulado da vida', async ({ page }) => {
    await abrirCentral(page);
    const faixa = page.locator('#nqdPane-overview .nqd-summary-strip').first();

    // 6 + 5 + 3 = 14 respostas na janela; 96 é o acumulado e não pode ser o
    // número em destaque sob um cabeçalho que promete sete dias.
    await expect(faixa.locator('.nqd-metric-value').first()).toHaveText('14');
    await expect(faixa.locator('.nqd-metric-value').first()).not.toHaveText('96');
  });

  test('a precisão exibida é a da janela, e o acumulado aparece como contexto', async ({ page }) => {
    await abrirCentral(page);
    const faixa = page.locator('#nqdPane-overview .nqd-summary-strip').first();
    // 12 certas de 14 = 86%
    await expect(faixa.locator('.nqd-metric-value').nth(1)).toHaveText('86%');
    await expect(faixa).toContainText('96 desde o início');
    await expect(faixa).toContainText('64% no acumulado');
  });

  test('sem atividade na janela, mostra travessão em vez de zero', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(save => {
      localStorage.setItem('nefroquest-save', JSON.stringify(save));
      localStorage.setItem('nefroquest-detailed-stats', JSON.stringify({
        totalQuestions: 96, totalCorrect: 61, totalWrong: 35,
        byCategory: { drc: { correct: 9, wrong: 14 } }, dailyActivity: {},
      }));
      localStorage.setItem('nefroquest-premium', '1');
    }, SAVE);
    await page.reload();
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(() => (window as any).openDashboard());
    const faixa = page.locator('#nqdPane-overview .nqd-summary-strip').first();
    await expect(faixa.locator('.nqd-metric-value').first()).toHaveText('—');
  });
});

test.describe('Semântica que o axe não enxerga', () => {
  test('os agrupamentos rotulados são regiões de verdade, não div genérica', async ({ page }) => {
    await abrirCentral(page);
    // aria-label num <div> sem role é ignorado: role=generic não expõe nome.
    // O pulso está sempre presente; o preview de guardiões só aparece para
    // perfil sem jornada, então não serve de âncora aqui.
    await expect(page.getByRole('region', { name: /últimos sete dias/i })).toBeVisible();
  });

  test('nenhum agrupamento rotulado da Visão geral continua sendo div sem papel', async ({ page }) => {
    await abrirCentral(page);
    const orfaos = await page.locator('#nqdPane-overview div[aria-label]:not([role])').count();
    expect(orfaos, 'div com aria-label e sem role não é anunciado por leitor de tela').toBe(0);
  });

  test('a tabela do ranking não é uma região live que despeja 50 linhas', async ({ page }) => {
    await abrirCentral(page);
    await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
    const wrap = page.locator('#nqDashLbWrap');
    await expect(wrap).toHaveCount(1);
    expect(await wrap.getAttribute('aria-live'),
      'uma tabela inteira em aria-live é lida de uma vez, sem poder interromper').toBeNull();
  });
});

test.describe('Mapa sem amostra: não oferece filtro sobre zeros', () => {
  test('com histórico amplo mas sem mapa granular, a toolbar some e o motivo é explicado', async ({ page }) => {
    await abrirCentral(page); // fixture não grava nefroquest-comp-stats
    await page.getByRole('tab', { name: 'Mapa clínico', exact: true }).click();

    // Buscar e filtrar uma tela inteira de "sem amostra" custa passos e não
    // devolve nada — e o usuário conclui que a lacuna é dele.
    await expect(page.locator('#nqDashMapSearch')).toHaveCount(0);
    await expect(page.locator('#nqDashMapFilter')).toHaveCount(0);

    const aviso = page.locator('#nqdPane-mapa .nqd-map-priming');
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText('96');
    await expect(aviso).toContainText('Competências');
  });
});
