import { test, expect } from '@playwright/test';

test.describe('Landing comercial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('carrega sem erros de console críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForLoadState('domcontentloaded');
    const critical = errors.filter(e =>
      !e.includes('supabase') &&   // falhas de rede auth são esperadas offline
      !e.includes('fetch') &&
      !e.includes('net::')
    );
    expect(critical, `Erros críticos: ${critical.join(' | ')}`).toHaveLength(0);
  });

  test('exibe a proposta principal e conduz ao jogo', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#hero-title')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('link', { name: 'Começar grátis' }).first())
      .toHaveAttribute('href', 'https://nefroquest.com/jogar/');
    await expect(page.locator('#welcomeScreen')).toHaveCount(0);
  });

  test('usa a arte nítida do Nefromante sem reamostragem por escala', async ({ page }) => {
    const artwork = page.locator('.boss-backdrop');
    await artwork.scrollIntoViewIfNeeded();
    await expect(artwork).toHaveAttribute('src', '/landing/assets/nefromancer-lumen-v3.png');
    await expect.poll(() => artwork.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThanOrEqual(1600);

    const presentation = await artwork.evaluate((image) => {
      const style = getComputedStyle(image);
      return {
        opacity: style.opacity,
        transform: style.transform,
        objectFit: style.objectFit,
      };
    });
    expect(presentation.opacity).toBe('1');
    expect(presentation.transform).toBe('none');
    expect(presentation.objectFit).toBe('cover');
  });

  test('mantém a gramática cromática clínica da experiência Lúmen', async ({ page }) => {
    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLLinkElement).href).pathname + new URL((link as HTMLLinkElement).href).search)
    );
    expect(stylesheets).toContain('/landing/styles.css?v=14.13');

    const palette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        clinical: root.getPropertyValue('--clinical').trim(),
        readable: root.getPropertyValue('--readable').trim(),
        hero: getComputedStyle(document.querySelector('.hero')!).backgroundImage,
        heroFieldContent: getComputedStyle(document.querySelector('.hero')!, '::after').content,
        atlasBorder: getComputedStyle(document.querySelector('.hero-atlas')!).borderTopColor,
        console: getComputedStyle(document.querySelector('.flow-deck')!).backgroundImage,
        consoleBorder: getComputedStyle(document.querySelector('.flow-deck')!).borderTopColor,
        currentStage: getComputedStyle(document.querySelector('.flow-node-control.is-current')!).backgroundImage,
        proof: getComputedStyle(document.querySelector('.proof-ledger')!).backgroundImage,
      };
    });
    expect(palette.clinical).toBe('#69bde7');
    expect(palette.readable).toBe('#8c9cb6');
    expect(palette.hero).toContain('radial-gradient');
    expect(palette.hero).toContain('linear-gradient(112deg');
    expect(palette.hero).toContain('rgb(8, 13, 24) 48%');
    expect(palette.hero).toContain('rgb(13, 31, 54) 48%');
    expect(palette.heroFieldContent).toBe('none');
    expect(palette.atlasBorder).toBe('rgba(87, 191, 200, 0.28)');
    expect(palette.console).toContain('radial-gradient');
    expect([
      'rgba(105, 189, 231, 0.4)',
      'rgba(105, 189, 231, 0.36)',
    ]).toContain(palette.consoleBorder);
    expect(palette.currentStage).toContain('rgba(214, 169, 74, 0.2)');
    expect(palette.proof).toContain('linear-gradient');
  });

  test('alinha o início do atlas ao conteúdo e preserva o respiro do portal', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900, minGap: 36, maxGap: 48 },
      { width: 1024, height: 900, minGap: 32, maxGap: 48 },
      { width: 760, height: 900, minGap: 18, maxGap: 34 },
      { width: 390, height: 844, minGap: 14, maxGap: 28 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.addStyleTag({
        content: '.hero-lab { transform: none !important; transition: none !important; }',
      });

      const geometry = await page.evaluate(() => {
        const nav = document.querySelector('#nav')!.getBoundingClientRect();
        const copy = document.querySelector('.hero-copy')!.getBoundingClientRect();
        const lab = document.querySelector('.hero-lab')!.getBoundingClientRect();
        return {
          itemDelta: Math.abs(copy.top - lab.top),
          gap: Math.min(copy.top, lab.top) - nav.bottom,
        };
      });

      if (viewport.width > 1080) {
        expect(geometry.itemDelta, `${viewport.width}px desalinhou texto e atlas`).toBeLessThanOrEqual(1);
      }
      expect(geometry.gap, `${viewport.width}px sem respiro mínimo`).toBeGreaterThanOrEqual(viewport.minGap);
      expect(geometry.gap, `${viewport.width}px deixou espaço morto`).toBeLessThanOrEqual(viewport.maxGap);
    }
  });

  test('mantém a régua do atlas visível em desktop com pouca altura útil', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 764 });
    await page.goto('/');
    await page.addStyleTag({
      content: '.hero-lab { transform: none !important; transition: none !important; }',
    });

    const geometry = await page.evaluate(() => {
      const nav = document.querySelector('#nav')!.getBoundingClientRect();
      const lab = document.querySelector('.hero-lab')!.getBoundingClientRect();
      const controls = document.querySelector('.flow-node-controls')!.getBoundingClientRect();
      return {
        topGap: lab.top - nav.bottom,
        labHeight: lab.height,
        controlsBottom: controls.bottom,
        viewportHeight: window.innerHeight,
      };
    });

    expect(geometry.topGap).toBeGreaterThanOrEqual(8);
    expect(geometry.topGap).toBeLessThanOrEqual(16);
    expect(geometry.labHeight).toBeLessThanOrEqual(650);
    expect(geometry.controlsBottom).toBeLessThanOrEqual(geometry.viewportHeight - 8);
  });

  test('oferece entrada direta para quem já possui conta', async ({ page }) => {
    const login = page.getByRole('link', { name: 'Entrar em uma conta existente' });
    await expect(login).toBeVisible();
    await expect(login).toHaveAttribute('href', 'https://nefroquest.com/jogar/?auth=login');

    await page.setViewportSize({ width: 320, height: 700 });
    const actions = await page.locator('.nav-actions').boundingBox();
    expect(actions).not.toBeNull();
    expect(actions!.x).toBeGreaterThanOrEqual(0);
    expect(actions!.x + actions!.width).toBeLessThanOrEqual(320);
  });

  test('deep link abre o login existente e consome o parâmetro', async ({ page }) => {
    await page.goto('/jogar/?auth=login');
    await expect(page.locator('#authModal')).toHaveClass(/show/, { timeout: 8_000 });
    await expect(page.locator('#tabEntrar')).toHaveClass(/active/);
    await expect(page.locator('#authFormEntrar')).toBeVisible();
    await expect(page).toHaveURL(/\/jogar\/$/);
  });

  test('preserva a intenção de login durante atualização de cache', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('nq-version-test-seeded')) return;
      sessionStorage.setItem('nq-version-test-seeded', '1');
      localStorage.setItem('nq-sw-version', '13.03');
    });
    await page.goto('/jogar/?auth=login');
    await expect(page.locator('#authModal')).toHaveClass(/show/, { timeout: 15_000 });
    await expect(page.locator('#tabEntrar')).toHaveClass(/active/);
    await expect(page).toHaveURL(/\/jogar\/$/);
  });

  test('título NefroQuest está presente na página', async ({ page }) => {
    await expect(page).toHaveTitle(/NefroQuest/i);
  });

  test('encaminha contexto antigo para a entrada do jogo', async ({ page }) => {
    await page.goto('/?app=1');
    await expect(page).toHaveURL(/\/jogar\/\?app=1$/);
    await page.waitForFunction(() => typeof (window as any).escapeHtml === 'function');
  });

  test('Oráculo começa próximo ao menu, sem área morta', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    await page.locator('a[href="#oraculo"]').first().click();

    const nav = await page.locator('#nav').boundingBox();
    const label = await page.locator('#oraculo .section-label').boundingBox();
    expect(nav).not.toBeNull();
    expect(label).not.toBeNull();

    const gap = label!.y - (nav!.y + nav!.height);
    expect(gap).toBeGreaterThanOrEqual(10);
    expect(gap).toBeLessThanOrEqual(24);
  });

  test('card +23 mantém separação entre metadado e título', async ({ page }) => {
    const card = page.locator('.guideline-cover--more');
    await card.scrollIntoViewIfNeeded();
    const meta = await card.locator('.guideline-cover__meta').boundingBox();
    const title = await card.locator('strong').boundingBox();
    expect(meta).not.toBeNull();
    expect(title).not.toBeNull();
    expect(title!.y - (meta!.y + meta!.height)).toBeGreaterThanOrEqual(10);
  });

  test('manifest.json carrega corretamente', async ({ page }) => {
    const res = await page.request.get('/manifest.json');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.name || json.short_name).toBeTruthy();
  });

  test('version.json está acessível', async ({ page }) => {
    const res = await page.request.get('/version.json');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.version).toBeTruthy();
  });
});
