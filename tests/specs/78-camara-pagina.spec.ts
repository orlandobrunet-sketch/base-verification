import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Câmara do Equilíbrio (ácido-base) como página própria.
 *
 * Defeito reproduzido antes do conserto: o código prometia fechar a Câmara
 * SOMENTE pelo ✕, para não perder um caso no meio do raciocínio, mas o
 * envoltório de diálogo da 15.28 ligou o Escape ao ✕ — um Escape no Ato I
 * descartava o caso inteiro.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const ORIGEM = '#forgeBtn:visible, .mdock-btn.forge-item:visible';

async function abrir(page: Page, largura = 1280) {
  await page.setViewportSize({ width: largura, height: 800 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => localStorage.removeItem('nq-acidbase-progress'));
  await page.locator(ORIGEM).first().focus();
  await page.evaluate(() => (window as any).showAcidBaseMinigame());
  await expect(page.locator('#acidBaseOverlay')).toBeVisible();
}

async function entrarNoCaso(page: Page) {
  await page.locator('[data-ab-case="aldric"]').click();
  await page.locator('[data-ab-start-acts]').click();
  await expect(page.locator('.ab-prompt')).toBeFocused();
}

/** Responde o ato atual (qualquer resposta serve) e avança. */
async function responderEAvancar(page: Page) {
  if (await page.locator('#abNumInput:not([disabled])').count()) {
    await page.locator('#abNumInput').fill('10');
    await page.locator('[data-ab-num-submit]').click();
  } else if (await page.locator('[data-ab-pick]:not([disabled])').count()) {
    await page.locator('[data-ab-pick]').first().click();
  } else {
    await page.locator('[data-ab-cards-submit]').click();
  }
  await expect(page.locator('.ab-next')).toBeFocused();
  await page.locator('.ab-next').click();
}

test('é página, e a jornada fica fora de alcance', async ({ page }) => {
  await abrir(page);
  const pagina = page.locator('#acidBaseOverlay');
  await expect(pagina).toHaveAttribute('role', 'main');
  expect(await pagina.evaluate(el => getComputedStyle(el).position)).not.toBe('fixed');
  await expect(page.getByRole('heading', { name: 'Alquimista Renal' })).toBeFocused();
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(true);
});

test('Escape dentro de um caso não descarta o caso; o botão de sair fecha', async ({ page }) => {
  await abrir(page);
  await entrarNoCaso(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.ab-prompt'), 'o Escape descartou o caso').toBeVisible();
  await page.getByRole('button', { name: 'Sair da Câmara' }).click();
  await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
  await expect(page.locator(ORIGEM).first()).toBeFocused();
});

test('Escape no hub fecha e devolve o foco', async ({ page }) => {
  await abrir(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator(ORIGEM).first()).toBeFocused();
});

test('concluir um caso e voltar à Câmara mantém a jornada restaurável', async ({ page }) => {
  await abrir(page);
  await entrarNoCaso(page);
  for (let i = 0; i < 12 && !(await page.locator('.ab-summary-title').count()); i++) {
    await responderEAvancar(page);
  }
  await expect(page.locator('.ab-summary-title')).toBeFocused();
  await page.locator('[data-ab-back]').click();
  await expect(page.getByRole('heading', { name: 'Alquimista Renal' })).toBeFocused();
  await expect(page.locator('#acidBaseOverlay .ab-case-done')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
  await expect(page.locator('#mainApp'), 'jornada ficou escondida depois de voltar à Câmara').toBeVisible();
  expect(await page.locator('#mainApp').evaluate((el: HTMLElement) => el.inert)).toBe(false);
});

test('no celular, nada do jogo aparece abaixo da página', async ({ page }) => {
  // O body reservava 120px para a barra e o dock do celular, que ficam
  // escondidos nas páginas próprias: a sobra mostrava o fundo do jogo.
  await abrir(page, 390);
  const sobra = await page.evaluate(() => {
    const p = document.getElementById('acidBaseOverlay')!;
    return document.documentElement.scrollHeight - (p.getBoundingClientRect().bottom + window.scrollY);
  });
  expect(sobra).toBeLessThanOrEqual(1);
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200%, contraste e alvos de toque`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    await abrir(page, largura);
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
    for (const tela of ['hub', 'ato']) {
      if (tela === 'ato') await entrarNoCaso(page);
      const cortes = await page.evaluate(() => {
        const fora: string[] = [];
        const w = document.createTreeWalker(document.getElementById('acidBaseOverlay')!, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (!(n.textContent || '').trim()) continue;
          const g = document.createRange(); g.selectNodeContents(n);
          for (const x of g.getClientRects()) if (x.width && (x.right > innerWidth + 1 || x.left < -1)) { fora.push((n.textContent || '').trim().slice(0, 25)); break; }
        }
        return fora;
      });
      expect(cortes, tela).toEqual([]);
      for (const b of await page.locator('#acidBaseOverlay button:not([disabled])').all()) {
        const caixa = (await b.boundingBox())!;
        expect(Math.min(caixa.height, caixa.width), `alvo de toque (${tela})`).toBeGreaterThanOrEqual(24);
      }
      const falhas = await page.evaluate(medirContraste, '#acidBaseOverlay');
      expect(falhas, `${tela}: ${JSON.stringify(falhas.map((f: any) => `${f.texto} ${f.razao}`))}`).toEqual([]);
    }
  });
}
