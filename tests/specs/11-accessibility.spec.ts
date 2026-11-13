import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { injectGameState, waitForGame } from '../helpers/game';

/**
 * Auditoria de acessibilidade automatizada (axe-core, WCAG 2.0/2.1 nível A+AA).
 * Falha apenas em violações de impacto 'serious' ou 'critical' — as de impacto
 * 'minor'/'moderate' são reportadas no log mas não quebram o build, para manter
 * o gate acionável sem virar ruído.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function summarize(violations: Result[]): string {
  if (violations.length === 0) return 'nenhuma';
  return '\n' + violations.map(v =>
    `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x)\n    ${v.helpUrl}`
  ).join('\n');
}

async function audit(page: import('@playwright/test').Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  const blocking = results.violations.filter(
    v => v.impact === 'serious' || v.impact === 'critical'
  );
  const minor = results.violations.filter(
    v => v.impact !== 'serious' && v.impact !== 'critical'
  );
  if (minor.length) console.log(`[a11y] violações menores (não bloqueiam): ${summarize(minor)}`);
  return blocking;
}

test.describe('Acessibilidade — axe-core / WCAG 2.1 AA', () => {
  test('landing comercial sem violações sérias/críticas', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#conteudo', { state: 'visible', timeout: 10_000 });
    const blocking = await audit(page, '#conteudo');
    expect(blocking, `Violações sérias/críticas: ${summarize(blocking)}`).toEqual([]);
  });

  test('tela de jogo sem violações sérias/críticas', async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    await waitForGame(page);
    const blocking = await audit(page, '#mainApp');
    expect(blocking, `Violações sérias/críticas: ${summarize(blocking)}`).toEqual([]);
  });

  for (const expired of [false, true]) test(`tela de Resultados do Simulado sem violações sérias/críticas${expired ? ' após expirar' : ''}`, async ({ page }) => {
    // Usa a configuração real para chegar legitimamente ao resultado. A prova
    // curta inclui acerto, erro e, na expiração, uma questão não respondida.
    await page.goto('/jogar/');
    await injectGameState(page, {}, { asGuest: expired });
    await waitForGame(page);
    await page.evaluate(async () => {
      localStorage.removeItem('nefroquest-exam-state');
      await (window as any).startExamMode();
    });
    await page.getByLabel('Quantidade de questões', { exact: true }).fill(expired ? '3' : '2');
    if (expired) await page.getByLabel('Tempo total em minutos', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Começar prova' }).click();
    await page.waitForSelector('#examOpts', { state: 'visible', timeout: 10_000 });
    await page.evaluate(() => (window as any).showExamResults());
    await expect(page.locator('#examResultado')).toHaveCount(0);
    for (let index = 0; index < 2; index++) {
      const question = await page.evaluate(() => {
        const state = (0, eval)('_examState'), q = state.questions[state.idx];
        return { correct: q.a, count: q.o.length };
      });
      await page.locator('#examOpts button').nth(index === 0 ? (question.correct + 1) % question.count : question.correct).click();
      await expect(page.locator('#examPage .nq-exam-explicacao,#examPage .nq-exam-veredito')).toHaveCount(0);
      if (index === 0 || expired) await page.getByRole('button', { name: 'Próxima questão', exact: true }).click();
    }
    if (expired) {
      const deadline = await page.evaluate(() => {
        const state = (0, eval)('_examState'); return state.startTime + state.durationSec * 1000;
      });
      await page.clock.setFixedTime(new Date(deadline));
      await page.evaluate(() => (window as any)._updateExamTimer());
    } else await page.getByRole('button', { name: 'Ver resultado', exact: true }).click();
    await page.waitForFunction(
      () => /Resultado da Prova/.test(document.getElementById('examPage')?.textContent || ''),
      null, { timeout: 5_000 });
    await expect(page.locator('#examResultado .nq-study-result-metrics')).toContainText('1 de 2');
    if (expired) await expect(page.locator('#examResultado')).toContainText('1 questão ficou sem resposta');
    await page.locator('.nq-exam-erros > summary').click();
    await page.locator('.nq-exam-revisao-demais > summary').click();
    const blocking = await audit(page, '#examPage');
    expect(blocking, `Violações sérias/críticas: ${summarize(blocking)}`).toEqual([]);
  });
});
