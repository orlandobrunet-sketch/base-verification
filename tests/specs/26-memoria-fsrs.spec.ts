import { test, expect, Page } from '@playwright/test';
import { saveBase } from '../helpers/fixtures';

/**
 * Memória — o FSRS na superfície (v14.55).
 *
 * O motor FSRS-4.5 já gravava por card S (estabilidade em dias até a retenção
 * cair a 90%), due, reps e lapses. A Central lia apenas `due <= hoje` e
 * descartava o resto — a resposta para "não dá a sensação de ir aumentando o
 * conhecimento" estava no localStorage e não era exibida.
 *
 * As duas regras de honestidade que estes cenários protegem:
 *  - o denominador é sempre "itens já vistos", nunca o banco inteiro;
 *  - não há série histórica de estabilidade, então nada de "era X há um mês".
 */

const DIA = 86400000;

const SAVE = saveBase();

async function abrirCom(page: Page, srBuilder: (ids: string[]) => Record<string, unknown>) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.waitForFunction(() => Array.isArray((window as any).questionBank) && (window as any).questionBank.length > 0);

  await page.evaluate(({ save, dia }) => {
    const ids = (window as any).questionBank.slice(0, 12).map((q: any) => String(q.id || q.qid));
    const hoje = Date.now();
    const sr: Record<string, unknown> = {};
    // 2 vencidos, 3 nos próximos 7 dias, 4 consolidados (S alto), 1 órfão
    sr[ids[0]] = { S: 3, due: hoje - dia, interval: 3, reps: 2, lapses: 0 };
    sr[ids[1]] = { S: 5, due: hoje - 2 * dia, interval: 5, reps: 3, lapses: 1 };
    sr[ids[2]] = { S: 8, due: hoje + dia, interval: 8, reps: 3, lapses: 0 };
    sr[ids[3]] = { S: 10, due: hoje + 2 * dia, interval: 10, reps: 4, lapses: 0 };
    sr[ids[4]] = { S: 12, due: hoje + 5 * dia, interval: 12, reps: 4, lapses: 0 };
    sr[ids[5]] = { S: 30, due: hoje + 40 * dia, interval: 30, reps: 6, lapses: 0 };
    sr[ids[6]] = { S: 45, due: hoje + 50 * dia, interval: 45, reps: 7, lapses: 0 };
    sr[ids[7]] = { S: 22, due: hoje + 30 * dia, interval: 22, reps: 5, lapses: 0 };
    sr[ids[8]] = { S: 60, due: hoje + 70 * dia, interval: 60, reps: 8, lapses: 0 };
    sr['questao_que_nao_existe_mais'] = { S: 99, due: hoje - dia, interval: 99, reps: 9, lapses: 0 };

    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-sr-data', JSON.stringify(sr));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE, dia: DIA });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
}

test.describe('Memória (FSRS na superfície)', () => {
  test('exibe vencidos, consolidados e estabilidade mediana a partir do que o motor grava', async ({ page }) => {
    await abrirCom(page, () => ({}));
    const secao = page.locator('#nqDashboard .nqd-memory-section');
    await expect(secao).toBeVisible();
    // Renomeada na v14.88 (NQ-06A): a seção deixou de ser um relatório de
    // memória e passou a abrir com ação, então o título diz o que ela faz.
    await expect(secao).toContainText('Estudo e revisão');
    // 4 cards com S >= 21 dias (30, 45, 22, 60); o órfão não conta.
    await expect(secao).toContainText('de 9 consolidados');
    await expect(secao.locator('.nqd-metric-value').first()).toHaveText('2');
  });

  test('o denominador é o que já foi visto, nunca o banco inteiro', async ({ page }) => {
    await abrirCom(page, () => ({}));
    const secao = page.locator('#nqDashboard .nqd-memory-section');
    const texto = await secao.innerText();
    const banco = await page.evaluate(() => (window as any).questionBank.length);
    expect(texto, 'o total do banco não pode virar denominador de memória').not.toContain(String(banco));
  });

  test('não inventa série histórica de estabilidade', async ({ page }) => {
    await abrirCom(page, () => ({}));
    const texto = await page.locator('#nqDashboard .nqd-memory-section').innerText();
    expect(texto).not.toMatch(/era \d|há um mês|desde o mês|tendência/i);
  });

  test('cartões órfãos não entram na contagem', async ({ page }) => {
    await abrirCom(page, () => ({}));
    const secao = page.locator('#nqDashboard .nqd-memory-section');
    // 10 entradas gravadas, 1 sem questão correspondente -> 9 vistas
    await expect(secao).toContainText('de 9 consolidados');
    await expect(secao).not.toContainText('de 10 consolidados');
  });

  test('o horizonte de sete dias tem rótulo acessível e um dia sem revisão não parece um dia com pouca', async ({ page }) => {
    await abrirCom(page, () => ({}));
    const horizonte = page.getByRole('group', { name: /pr..?ximos sete dias/i });
    await expect(horizonte).toBeVisible();

    const dias = horizonte.locator('.nqd-memory-day');
    await expect(dias).toHaveCount(7);

    const alturas = await dias.evaluateAll(els =>
      els.map(el => ({
        temDue: el.classList.contains('has-due'),
        h: (el.querySelector('i') as HTMLElement).getBoundingClientRect().height,
      }))
    );
    const semDue = alturas.filter(d => !d.temDue).map(d => d.h);
    const comDue = alturas.filter(d => d.temDue).map(d => d.h);
    expect(comDue.length, 'o cenário precisa ter dias com revisão').toBeGreaterThan(0);
    expect(Math.max(...semDue), 'dia vazio não pode ter barra maior que a de um dia com revisão')
      .toBeLessThan(Math.min(...comDue));
  });

  test('sem nenhum card, a seção convida sem mostrar zeros', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(save => {
      localStorage.setItem('nefroquest-save', JSON.stringify(save));
      localStorage.removeItem('nefroquest-sr-data');
      localStorage.setItem('nefroquest-premium', '1');
    }, SAVE);
    await page.reload();
    await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.evaluate(() => (window as any).openDashboard());
    await expect(page.locator('#nqDashboard')).toBeVisible();

    /* A regra mudou na v14.88 (NQ-06A), e mudou de propósito.
     *
     * Antes a seção SUMIA sem cards. A regra que ela protegia — não mostrar
     * zeros, porque zero aqui lê como dívida antes de haver o que dever —
     * continua valendo e é afirmada abaixo. O que mudou é a conclusão: sumir
     * fazia quem abria a Central pela primeira vez não descobrir que revisão
     * existe. Agora a seção aparece, convida, e não mostra número nenhum. */
    const secao = page.locator('#nqDashboard .nqd-memory-section');
    await expect(secao, 'a seção passa a existir mesmo sem histórico').toHaveCount(1);
    await expect(secao.locator('.nqd-study-primary'), 'e oferece a porta de entrada').toHaveCount(1);
    await expect(secao.locator('.nqd-metric-value'), 'sem cards, nenhum número — a regra original').toHaveCount(0);
    await expect(secao.locator('.nqd-memory-horizon'), 'nem horizonte de sete dias vazio').toHaveCount(0);
  });
});
