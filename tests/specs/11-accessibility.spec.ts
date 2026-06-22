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
  test('landing screen sem violações sérias/críticas', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#landingScreen', { state: 'visible', timeout: 10_000 });
    const blocking = await audit(page, '#landingScreen');
    expect(blocking, `Violações sérias/críticas: ${summarize(blocking)}`).toEqual([]);
  });

  test('tela de jogo sem violações sérias/críticas', async ({ page }) => {
    await page.goto('/');
    await injectGameState(page);
    await waitForGame(page);
    const blocking = await audit(page, '#mainApp');
    expect(blocking, `Violações sérias/críticas: ${summarize(blocking)}`).toEqual([]);
  });
});
