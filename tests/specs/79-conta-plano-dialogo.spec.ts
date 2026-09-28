import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Conta e Plano: contrato de diálogo e alvos de toque.
 *
 * Medido antes do conserto:
 * - Seu Plano não era diálogo: sem papel nem nome, o foco ficava no botão que
 *   o abriu, o Tab caminhava pela jornada e o Escape não fechava;
 * - o ✕ da Conta e do Plano media 28x28, e campos e botões 37–43px de altura.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const ORIGEM = '#forgeBtn:visible, .mdock-btn.forge-item:visible';

async function abrir(page: Page, fn: string, largura = 1280) {
  await page.setViewportSize({ width: largura, height: 844 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.locator(ORIGEM).first().focus();
  await page.evaluate(f => (window as any)[f](), fn);
}

test('Seu Plano é diálogo: nome, foco dentro, Tab preso e Escape devolve o foco', async ({ page }) => {
  await abrir(page, 'openPlanModal');
  const dialogo = page.getByRole('dialog', { name: 'Seu Plano' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toHaveAttribute('aria-modal', 'true');
  await expect(page.getByRole('button', { name: /Fazer Upgrade/ })).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await dialogo.evaluate(el => el.contains(document.activeElement)), `Tab ${i + 1} escapou do diálogo`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
  await expect(page.locator(ORIGEM).first()).toBeFocused();
});

test('Seu Plano: o botão Fechar também devolve o foco', async ({ page }) => {
  await abrir(page, 'openPlanModal');
  await page.getByRole('dialog', { name: 'Seu Plano' }).locator('.modal-actions button').click();
  await expect(page.getByRole('dialog', { name: 'Seu Plano' })).toBeHidden();
  await expect(page.locator(ORIGEM).first()).toBeFocused();
});

for (const [fn, nome] of [['openAccountModal', 'Minha Conta'], ['openPlanModal', 'Seu Plano']] as const) {
  for (const largura of [320, 390]) {
    test(`${nome} em ${largura}px com texto a 200%: nada cortado, contraste e alvos de 44px`, async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
      await abrir(page, fn, largura);
      await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
      const dialogo = page.getByRole('dialog', { name: nome });
      await expect(dialogo).toBeVisible();
      await dialogo.evaluate(el => el.setAttribute('data-medir', '1'));
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));
      const cortes = await page.evaluate(() => {
        const fora: string[] = [];
        const w = document.createTreeWalker(document.querySelector('[data-medir]')!, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (!(n.textContent || '').trim()) continue;
          const g = document.createRange(); g.selectNodeContents(n);
          for (const x of g.getClientRects()) if (x.width && (x.right > innerWidth + 1 || x.left < -1)) { fora.push((n.textContent || '').trim().slice(0, 25)); break; }
        }
        return fora;
      });
      expect(cortes).toEqual([]);
      for (const alvo of await dialogo.locator('button, input:not([disabled]), select').all()) {
        const caixa = (await alvo.boundingBox())!;
        const rotulo = (await alvo.getAttribute('aria-label')) || (await alvo.getAttribute('placeholder')) || (await alvo.textContent())?.trim();
        expect(Math.min(caixa.width, caixa.height), `alvo de toque: ${rotulo}`).toBeGreaterThanOrEqual(44);
      }
      const falhas = await page.evaluate(medirContraste, '[data-medir]');
      expect(falhas, JSON.stringify(falhas.map((f: any) => `${f.texto} ${f.razao}`))).toEqual([]);
    });
  }
}
