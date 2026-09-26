import { test, expect, type Page } from '@playwright/test';

/**
 * Texto a 200% sem conteúdo cortado nas telas principais.
 *
 * A medição anterior ignorava todo elemento dentro de contêiner com
 * `overflow: hidden` — e é exatamente assim que um corte se esconde. Com o
 * instrumento corrigido (só região que ROLA é aceitável), apareceu o Átrio:
 * `#welcomeScreen` tinha `min-width: 20rem`, que a 200% vira 640px numa tela
 * de 320, e título, subtítulo e o cartão da jornada ficavam cortados. O mesmo
 * `20rem` estava na tela de dificuldade e no body do Lúmen.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

/**
 * Trechos de TEXTO com parte fora da largura da tela, fora de região rolável.
 * Mede o texto (Range), não a caixa: uma palavra grande demais transborda a
 * própria caixa, e medir só caixas deixava "Seu domín…" passar.
 */
function cortados(): string[] {
  const fora: string[] = [];
  const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let no = andar.nextNode(); no; no = andar.nextNode()) {
    const el = no.parentElement;
    if (!el || !(no.textContent || '').trim()) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    // Texto decorativo (aria-hidden) entra: corte visível é defeito mesmo sem leitor de tela.
    if (el.closest('[inert], .hidden, .bg-layer, .bg-overlay, .particles, .nq-sr-only, .sr-only, script, style')) continue;
    let ignorar = false;
    for (let p: Element | null = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) { ignorar = true; break; }
      // Dentro de gaveta recolhida (contêiner inteiro fora da tela): não é corte.
      const c = p.getBoundingClientRect();
      if (c.width && (c.right <= 0 || c.left >= innerWidth)) { ignorar = true; break; }
    }
    if (ignorar) continue;
    const faixa = document.createRange();
    faixa.selectNodeContents(no);
    for (const r of faixa.getClientRects()) {
      if (!r.width || r.right <= 0 || r.left >= innerWidth) continue; // gaveta recolhida
      if (r.right > innerWidth + 1 || r.left < -1) {
        fora.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${(no.textContent || '').trim().slice(0, 30)}" [${Math.round(r.left)}, ${Math.round(r.right)}]`);
        break;
      }
    }
  }
  return fora;
}

async function preparar(page: Page, largura: number) {
  await page.setViewportSize({ width: largura, height: 800 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('nefroquest-save', JSON.stringify({
    schemaVersion: 2, level: 5, xp: 150, xpToNext: 400, score: 2500, lives: 3, streak: 2, gold: 80, bonusUses: 0,
    correctTotal: 15, gameOver: false, gameStarted: true, difficulty: 'normal', character: 'glomerulus',
    idx: 0, queueIds: [], recentIds: [], chestsOpened: 2, timestamp: Date.now(),
  })));
  await page.reload();
  await page.waitForLoadState('load');
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
}

test('o instrumento enxerga um corte plantado', async ({ page }) => {
  await preparar(page, 320);
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#atriumTitle')).toBeVisible();
  await page.evaluate(() => { const h = document.getElementById('atriumTitle')!; h.style.minWidth = '40rem'; });
  expect((await page.evaluate(cortados)).length, 'o medidor ficou cego').toBeGreaterThan(0);
});

for (const largura of [320, 390]) {
  test(`Átrio sem corte a 200% em ${largura}px`, async ({ page }) => {
    await preparar(page, largura);
    await page.locator('[data-portal-route="guest"]').click();
    await expect(page.locator('#atriumTitle')).toBeVisible();
    expect(await page.evaluate(cortados)).toEqual([]);
    // Sobreposição não é corte: o logo não pode passar por baixo dos controles.
    const cruzam = await page.evaluate(() => {
      const a = document.querySelector('#welcomeScreen .nql-brand')!.getBoundingClientRect();
      return [...document.querySelectorAll('#welcomeScreen .nql-atrium__topbar :is(button, [role="button"], .sound-toggle, .profile-btn)')].some(el => {
        const b = el.getBoundingClientRect();
        return b.width && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      });
    });
    expect(cruzam, 'logo sob os botões do cabeçalho').toBe(false);
  });

  test(`Dificuldade sem corte a 200% em ${largura}px`, async ({ page }) => {
    await preparar(page, largura);
    await page.locator('[data-portal-route="guest"]').click();
    await page.locator('[data-action="startNewFromWelcome"]').first().click();
    await expect(page.locator('#diffSelectorOverlay')).toBeVisible();
    expect(await page.evaluate(cortados)).toEqual([]);
  });

  test(`Jogo e Dashboard sem corte a 200% em ${largura}px`, async ({ page }) => {
    await preparar(page, largura);
    await page.evaluate(() => {
      document.getElementById('landingScreen')?.classList.add('hidden');
      document.getElementById('welcomeScreen')?.classList.add('hidden');
      return (window as any).continueGame();
    });
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#question')).not.toBeEmpty();
    expect(await page.evaluate(cortados), 'tela de jogo').toEqual([]);
    await page.evaluate(() => (window as any).openDashboard({ tab: 'overview' }));
    await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
    for (const aba of await page.locator('[data-dash-tab]').evaluateAll(els => [...new Set(els.map(e => (e as HTMLElement).dataset.dashTab))])) {
      await page.locator(`[data-dash-tab="${aba}"]`).first().click();
      await page.waitForTimeout(300);
      expect(await page.evaluate(cortados), `Dashboard / ${aba}`).toEqual([]);
    }
  });
}
