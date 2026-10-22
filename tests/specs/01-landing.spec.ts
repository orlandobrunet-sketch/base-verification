import { test, expect } from '@playwright/test';

test.describe('Landing comercial', () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    await context.route('**/*', route => route.request().method() === 'GET'
      && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await context.routeWebSocket('**/*', socket => socket.close());
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
    await expect(artwork).toHaveAttribute('src', '/landing/assets/nefromancer-cajado-renal.jpg');
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
    expect(stylesheets.some(s => s.startsWith('/landing/styles.css')),
      'a folha da landing precisa estar linkada (versão é irrelevante aqui)').toBe(true);

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
    // Atlas e cartão usam superfícies quentes e translúcidas; o fluxo mantém
    // as cores clínicas acima. Verificamos a direção, sem fixar um tom exato.
    const atlasBorder = palette.atlasBorder.match(/[\d.]+/g)!.map(Number);
    expect(atlasBorder).toHaveLength(4);
    expect(atlasBorder[0]).toBeGreaterThan(atlasBorder[2]);
    expect(atlasBorder[3]).toBeGreaterThan(0);
    expect(atlasBorder[3]).toBeLessThan(.5);
    expect(palette.console).toContain('radial-gradient');
    const consoleBorder = palette.consoleBorder.match(/[\d.]+/g)!.map(Number);
    expect(consoleBorder).toHaveLength(4);
    expect(consoleBorder[0]).toBeGreaterThan(consoleBorder[2]);
    expect(consoleBorder[3]).toBeGreaterThan(0);
    expect(consoleBorder[3]).toBeLessThan(.5);
    expect(palette.currentStage).toContain('rgba(214, 169, 74, 0.2)');
    expect(palette.proof).toContain('linear-gradient');
  });

  test('alinha o início do atlas ao conteúdo e preserva o respiro do portal', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900, minGap: 12, maxGap: 24 },
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

  test('preserva a ordem da narrativa e as três formas dos personagens canônicos', async ({ page }) => {
    const sequence = await page.locator('#metodo, #oraculo, #como-funciona, #classes, #confronto')
      .evaluateAll(sections => sections.map(section => ({
        id: section.id,
        top: section.getBoundingClientRect().top + window.scrollY,
      })));
    expect(sequence.map(section => section.id)).toEqual(['metodo', 'oraculo', 'como-funciona', 'classes', 'confronto']);
    for (let i = 1; i < sequence.length; i++) {
      expect(sequence[i].top, `a seção ${sequence[i].id} deve vir após a anterior`)
        .toBeGreaterThan(sequence[i - 1].top);
    }

    const experience = page.locator('#classes .game-experience-card');
    await expect(experience).toHaveCount(4);
    await expect(experience.locator('h3')).toHaveText([
      'XP e evolução', 'Capítulos da aventura', 'Equipamentos e escolhas', 'Conquistas e marcos',
    ]);

    const characters = [
      { name: 'Dr. Glomerulus', title: 'Lâmina dos Glomérulos', folder: 'guerreiro_glomerular' },
      { name: 'Dra. Aquaria', title: 'Mestra das Águas', folder: 'maga_metabolica' },
      { name: 'Dr. Nephros', title: 'Guardião dos Néfrons', folder: 'clerigo_renal' },
    ];
    const profiles = page.locator('#classes .class-profile');
    await expect(profiles).toHaveCount(characters.length);
    for (const [index, character] of characters.entries()) {
      const profile = profiles.nth(index);
      await profile.scrollIntoViewIfNeeded();
      await expect(profile.getByRole('heading', { name: character.name, exact: true })).toBeVisible();
      await expect(profile.locator('.class-path')).toHaveText(character.title);
      await expect(profile.locator('.evolution-stage')).toHaveCount(3);
      await expect(profile.locator('figcaption b')).toHaveText(['01', '05', '10']);
      const portraits = profile.locator('.evolution-stage img');
      for (const [stage, level] of ['01', '05', '10'].entries()) {
        await expect(portraits.nth(stage))
          .toHaveAttribute('src', `/assets/classes-cinema/${character.folder}/nivel_${level}.webp`);
        await expect(portraits.nth(stage)).toHaveAttribute('alt', new RegExp(character.name.replace('.', '\\.')));
      }
      await expect.poll(() => portraits.evaluateAll(images =>
        images.map(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)
      )).toEqual([true, true, true]);
    }
  });

  test('permite consultar fontes e traduções sem confundir resultados com limites', async ({ page }) => {
    const evidence = page.locator('#evidencias-aprendizagem');
    const summary = evidence.locator(':scope > summary');
    const limits = evidence.locator('.learning-evidence-limits');
    const limitsSummary = limits.locator(':scope > summary');
    await expect(evidence).not.toHaveAttribute('open');
    await expect(evidence.locator('.learning-evidence-note')).not.toBeVisible();
    await summary.focus();
    await summary.press('Enter');
    await expect(evidence).toHaveAttribute('open', '');
    await expect(evidence.locator('.learning-evidence-note')).toBeVisible();
    await expect(evidence.locator('.learning-evidence-note')).toContainText('traduções nossas');
    await expect(evidence.locator('.learning-evidence-note'))
      .toContainText('não constituem validação específica do NefroQuest');
    await expect(evidence.locator('.learning-evidence-columns h3'))
      .toHaveText(['Método de estudo', 'Elementos de jogo']);
    await expect(evidence.locator('blockquote')).toHaveCount(6);
    await expect(limits).not.toHaveAttribute('open');
    await expect(limits.locator('blockquote').first()).not.toBeVisible();
    await limitsSummary.focus();
    await limitsSummary.press('Space');
    await expect(limits).toHaveAttribute('open', '');
    await expect(limits.locator('blockquote').first()).toBeVisible();

    const quotations = evidence.locator('blockquote');
    for (const quote of await quotations.all()) {
      await expect(quote).toHaveText(/^“[^“”]+”$/);
      const citation = quote.locator('xpath=..').locator('.learning-evidence-cite');
      await expect(citation).toContainText('Tradução nossa');
      await expect(citation.locator('a')).toHaveCount(1);
    }
    const sources = evidence.locator('.learning-evidence-cite a');
    const expectedSources = [
      'https://doi.org/10.1126/science.1199327',
      'https://doi.org/10.1111/j.1365-2923.2009.03518.x',
      'https://doi.org/10.1007/s10459-020-10000-3',
      'https://doi.org/10.1186/s12909-023-04951-5',
      'https://www.bmj.com/content/359/bmj.j5416',
      'https://www.jmir.org/2019/3/e12994',
      'https://doi.org/10.1002/bjs.8819',
    ];
    await expect(sources).toHaveCount(expectedSources.length);
    for (const [index, href] of expectedSources.entries()) {
      await expect(sources.nth(index)).toHaveAttribute('href', href);
      await expect(sources.nth(index)).toHaveAttribute('target', '_blank');
      await expect(sources.nth(index)).toHaveAttribute('rel', /\bnoopener\b/);
      await expect(sources.nth(index)).toHaveAttribute('rel', /\bnoreferrer\b/);
    }

    await limitsSummary.focus();
    await limitsSummary.press('Enter');
    await expect(limits).not.toHaveAttribute('open');
    await summary.focus();
    await summary.press('Space');
    await expect(evidence).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
    await expect(evidence.locator('.learning-evidence-note')).not.toBeVisible();
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
