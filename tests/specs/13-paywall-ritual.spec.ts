import { test, expect } from '@playwright/test';
import { injectGameState, waitForGame } from '../helpers/game';

/**
 * Cobertura de dois fluxos que não tinham teste:
 *  - Paywall premium (showPaywallModal) — modal de upgrade.
 *  - Ritual de Iniciação (openRitual, PED-3) — placement de dificuldade.
 *
 * Ambos são abertos via funções globais (scripts clássicos) após o jogo
 * carregar (precisam de `state`/questionBank), então entramos no jogo primeiro.
 */

test.describe('Paywall premium', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    await waitForGame(page);
  });

  test('abre com preço e CTA de upgrade', async ({ page }) => {
    await page.evaluate(() => (window as any).showPaywallModal());

    const modal = page.locator('#paywallModal');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(modal).toHaveClass(/show/);
    // Conteúdo essencial: título, preço e botão de upgrade
    await expect(modal.locator('.paywall-price .price-amount')).toBeVisible();
    await expect(modal.locator('[data-action="paywallUpgrade"]')).toBeVisible();
  });

  test('reabrir não duplica o modal', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).showPaywallModal();
      (window as any).showPaywallModal();
    });
    await expect(page.locator('#paywallModal')).toHaveCount(1);
  });
});

test.describe('Ritual de Iniciação (placement)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    await waitForGame(page);
  });

  test('abre com intro e botão de começar', async ({ page }) => {
    await page.evaluate(() => (window as any).openRitual());

    const overlay = page.locator('#ritualPage');
    await expect(overlay).toBeVisible({ timeout: 10_000 });
    await expect(overlay).toContainText('Ritual de Iniciação');
    await expect(overlay.locator('#ritualStart')).toBeVisible();
  });

  test('começar o ritual renderiza a primeira questão', async ({ page }) => {
    await page.evaluate(() => (window as any).openRitual());
    await page.locator('#ritualPage #ritualStart').click();

    // Contador "Questão 1 de N" e opções renderizadas (o Ritual virou página, 15.29)
    const overlay = page.locator('#ritualPage');
    await expect(overlay).toContainText(/Questão\s*1\s*de\s*\d+/, { timeout: 5_000 });
    await expect(overlay.locator('#ritualOpts button')).not.toHaveCount(0);
  });
});
