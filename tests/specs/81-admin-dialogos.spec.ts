import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Painéis de administração: contrato de diálogo, alvos, texto a 200% e contraste.
 *
 * Medido antes do conserto (Lista de Acesso, Analytics, Campanha Push e Galeria):
 * nenhum era diálogo — o foco ficava atrás, o Tab caminhava pela jornada e o
 * Escape não fechava três deles; o ✕ media 28x28 e campos/botões 35–43px; com
 * texto a 200% o campo de e-mail da Lista de Acesso era espremido a 26px de
 * largura; os caminhos de arquivo da Galeria ficavam a 4,36:1.
 *
 * O administrador é simulado no navegador do teste (isAdminUser), sem
 * credencial: as telas só são desenhadas, nenhuma ação administrativa roda.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const ORIGEM = '#forgeBtn:visible, .mdock-btn.forge-item:visible';
const TELAS = [
  ['openAdminPanel', '#adminModal', /Lista de Acesso/],
  ['openAnalyticsPanel', '#analyticsModal', /Analytics/],
  ['openPushCampaign', '#pushCampaignModal', /Campanha/],
  ['openAssetGallery', '#assetGalleryModal', /Galeria de Assets/],
] as const;

async function abrir(page: Page, fn: string, largura = 1280) {
  await page.setViewportSize({ width: largura, height: 844 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => { (0, eval)('isAdminUser = () => true'); });
  await page.locator(ORIGEM).first().focus();
  await page.evaluate(f => (window as any)[f](), fn);
}

async function semAnimacao(page: Page) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));
}

for (const [fn, raiz, nome] of TELAS) {
  test(`${fn}: diálogo com nome, foco e Tab presos, Escape fecha e devolve o foco`, async ({ page }) => {
    await abrir(page, fn);
    const dialogo = page.getByRole('dialog', { name: nome });
    await expect(dialogo).toBeVisible();
    await expect.poll(() => dialogo.evaluate(el => el.contains(document.activeElement))).toBe(true);
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      expect(await dialogo.evaluate(el => el.contains(document.activeElement)), `Tab ${i + 1} escapou`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(page.locator(ORIGEM).first()).toBeFocused();
  });

  test(`${fn}: alvos de 44px no tamanho normal`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    await abrir(page, fn);
    await expect(page.getByRole('dialog', { name: nome })).toBeVisible();
    await semAnimacao(page);
    for (const alvo of await page.locator(`${raiz} .modal-panel :is(button, input, textarea, select)`).all()) {
      if (!(await alvo.isVisible()) || (await alvo.isDisabled())) continue;
      const caixa = (await alvo.boundingBox())!;
      const rotulo = (await alvo.getAttribute('aria-label')) || (await alvo.getAttribute('placeholder')) || (await alvo.textContent())?.trim();
      expect(Math.min(caixa.width, caixa.height), `alvo de toque: ${rotulo}`).toBeGreaterThanOrEqual(44);
    }
  });

  test(`${fn}: 320px com texto a 200%, nada cortado nem espremido, contraste`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    await abrir(page, fn, 320);
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
    await expect(page.getByRole('dialog', { name: nome })).toBeVisible();
    await semAnimacao(page);
    const painel = `${raiz} .modal-panel`;
    const problemas = await page.evaluate(sel => {
      const out: string[] = [];
      const el = document.querySelector(sel)!;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!(n.textContent || '').trim() || !n.parentElement!.getClientRects().length) continue;
        const g = document.createRange(); g.selectNodeContents(n);
        for (const x of g.getClientRects()) if (x.width && (x.right > innerWidth + 1 || x.left < -1)) { out.push(`cortado: ${(n.textContent || '').trim().slice(0, 25)}`); break; }
      }
      for (const c of el.querySelectorAll('input, textarea')) {
        const r = c.getBoundingClientRect();
        if (r.width && r.width < 120) out.push(`campo espremido a ${Math.round(r.width)}px: ${(c as HTMLInputElement).placeholder}`);
      }
      return out;
    }, painel);
    expect(problemas).toEqual([]);
    const falhas = await page.evaluate(medirContraste, painel);
    expect(falhas, JSON.stringify(falhas.slice(0, 5).map((f: any) => `${f.texto} ${f.razao}`))).toEqual([]);
  });
}

test('Lista de Acesso reaberta volta a prender o foco', async ({ page }) => {
  await abrir(page, 'openAdminPanel');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Lista de Acesso/ })).toBeHidden();
  await page.evaluate(() => (window as any).openAdminPanel());
  const dialogo = page.getByRole('dialog', { name: /Lista de Acesso/ });
  await expect.poll(() => dialogo.evaluate(el => el.contains(document.activeElement))).toBe(true);
});
