import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Preços e Paywall: contrato de diálogo e alvos de toque (só interface — preço,
 * checkout e pagamento não mudam).
 *
 * Medido antes do conserto: nenhum dos dois era diálogo. Sem papel nem nome,
 * o foco ficava no botão que os abriu, o Tab caminhava pela jornada e o Escape
 * não fechava Preços; os botões de escolha e de entrar mediam 31–41px.
 *
 * O Paywall continua sem fechar: é a barreira depois das questões gratuitas.
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

async function tabPreso(page: Page, dialogo: ReturnType<Page['getByRole']>) {
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await dialogo.evaluate(el => el.contains(document.activeElement)), `Tab ${i + 1} escapou do diálogo`).toBe(true);
  }
}

test('Paywall é diálogo com foco e Tab presos, e o Escape não abre caminho', async ({ page }) => {
  await abrir(page, 'showPaywallModal');
  const dialogo = page.getByRole('dialog').filter({ has: page.locator('.paywall-price') });
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toHaveAttribute('aria-modal', 'true');
  expect(await dialogo.getAttribute('aria-labelledby')).toBeTruthy();
  await expect(page.getByRole('button', { name: /Desbloquear Acesso Premium/ })).toBeFocused();
  await tabPreso(page, dialogo);
  await page.keyboard.press('Escape');
  await expect(dialogo, 'o Escape fechou a barreira do paywall').toBeVisible();
});

test('Paywall reaberto volta a prender o foco', async ({ page }) => {
  await abrir(page, 'showPaywallModal');
  await page.evaluate(() => document.getElementById('paywallModal')!.classList.remove('show'));
  await page.locator(ORIGEM).first().focus();
  await page.evaluate(() => (window as any).showPaywallModal());
  await expect(page.getByRole('button', { name: /Desbloquear Acesso Premium/ })).toBeFocused();
});

test('do Paywall para Preços: o foco entra no novo diálogo', async ({ page }) => {
  await abrir(page, 'showPaywallModal');
  await page.getByRole('button', { name: /Desbloquear Acesso Premium/ }).click();
  const precos = page.getByRole('dialog', { name: /Planos e preços|Plans and pricing/ });
  await expect(precos).toBeVisible();
  expect(await precos.evaluate(el => el.contains(document.activeElement)), 'foco ficou fora de Preços').toBe(true);
  await tabPreso(page, precos);
});

test('Preços é diálogo com nome, e o Escape fecha pelo mesmo caminho do ✕', async ({ page }) => {
  await abrir(page, 'showPricingModal');
  const precos = page.getByRole('dialog', { name: /Planos e preços|Plans and pricing/ });
  await expect(precos).toBeVisible();
  await tabPreso(page, precos);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pricingModal')).toHaveCount(0);
});

for (const [fn, raiz] of [['showPaywallModal', '#paywallModal .paywall-content'], ['showPricingModal', '#pricingModal .pricing-wrap']] as const) {
  // Com texto a 200% os botões crescem sozinhos; o defeito (31–41px) aparece
  // no tamanho normal.
  test(`${fn} em tamanho normal: alvos de 44px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    await abrir(page, fn);
    await expect(page.locator(raiz)).toBeVisible();
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));
    for (const alvo of await page.locator(`${raiz} button`).all()) {
      const caixa = (await alvo.boundingBox())!;
      expect(Math.min(caixa.width, caixa.height), `alvo de toque: ${(await alvo.getAttribute('aria-label')) || (await alvo.textContent())?.trim()}`).toBeGreaterThanOrEqual(44);
    }
  });

  for (const largura of [320, 390]) {
    test(`${fn} em ${largura}px com texto a 200%: nada cortado, contraste e alvos de 44px`, async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
      await abrir(page, fn, largura);
      await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
      await expect(page.locator(raiz)).toBeVisible();
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));
      const cortes = await page.evaluate(sel => {
        const fora: string[] = [];
        const w = document.createTreeWalker(document.querySelector(sel)!, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (!(n.textContent || '').trim()) continue;
          const g = document.createRange(); g.selectNodeContents(n);
          for (const x of g.getClientRects()) if (x.width && (x.right > innerWidth + 1 || x.left < -1)) { fora.push((n.textContent || '').trim().slice(0, 25)); break; }
        }
        return fora;
      }, raiz);
      expect(cortes).toEqual([]);
      for (const alvo of await page.locator(`${raiz} button`).all()) {
        const caixa = (await alvo.boundingBox())!;
        const rotulo = (await alvo.getAttribute('aria-label')) || (await alvo.textContent())?.trim();
        expect(Math.min(caixa.width, caixa.height), `alvo de toque: ${rotulo}`).toBeGreaterThanOrEqual(44);
      }
      const falhas = await page.evaluate(medirContraste, raiz);
      expect(falhas, JSON.stringify(falhas.map((f: any) => `${f.texto} ${f.razao}`))).toEqual([]);
    });
  }
}
