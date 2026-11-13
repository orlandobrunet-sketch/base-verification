import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'no-preference' } });

async function open(page: Page) {
  await page.route('**/*', route => route.request().method() === 'GET' && new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="balance"]:visible').click();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (await page.locator('#nqEntryCinema[open]').count()) await page.keyboard.press('Escape');
  await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
}

async function assertUnoccluded(page: Page, selector: string) {
  const target = page.locator(selector);
  await expect(target).toHaveCount(1);
  await expect(target).toBeVisible();
  await target.scrollIntoViewIfNeeded();
  const observed = await target.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const points = [.25, .5, .75].map(fraction => ({ x: bounds.left + bounds.width * fraction, y: bounds.top + bounds.height / 2 }));
    const hit = points.every(point => element.contains(document.elementFromPoint(point.x, point.y)));
    const range = document.createRange(); range.selectNodeContents(element);
    const lines = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
    const rect = (box: DOMRect) => ({ x: box.x, y: box.y, width: box.width, height: box.height });
    const clipping: unknown[] = [];
    if (lines.some(line => line.left < -1 || line.right > innerWidth + 1))
      clipping.push({ ancestor: 'viewport', width: innerWidth, glyphs: lines.map(rect) });
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
      // Contents has no clipping box. Root overflow applies to the viewport;
      // the fixed Chamber is not clipped by BODY's in-flow bounding rectangle.
      if (style.display === 'contents' || parent === document.body || parent === document.documentElement) continue;
      if (lines.some(line =>
        (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (line.left < box.left - 1 || line.right > box.right + 1)) ||
        (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY) && (line.top < box.top - 1 || line.bottom > box.bottom + 1))))
        clipping.push({ ancestor: parent.className, display: style.display, overflow: [style.overflowX, style.overflowY], bounds: rect(box), glyphs: lines.map(rect) });
    }
    return { hit, clipping, width: bounds.width, height: bounds.height, viewportWidth: innerWidth, font: getComputedStyle(document.documentElement).fontSize };
  });
  const label = selector + ' at ' + observed.viewportWidth + 'px / font ' + observed.font;
  expect(observed.hit, label + ' remains in front of the painted scene and mask').toBe(true);
  expect(observed.clipping, label + ' keeps its whole label legible').toEqual([]);
  expect(observed.width).toBeGreaterThan(0); expect(observed.height).toBeGreaterThan(0);
}

test('pintura real envolve o hub com título legível, destinos desobstruídos e sem pausa local', async ({ page }) => {
  const scenesRequested: string[] = [];
  const visibleWhenRequested = new Map<string, Promise<boolean>>();
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (!path.startsWith('/assets/chamber/scenes/')) return;
    scenesRequested.push(path);
    if (!visibleWhenRequested.has(path)) visibleWhenRequested.set(path, page.evaluate(path => {
      const image = [...document.querySelectorAll<HTMLImageElement>('.ab-case .abx-case-art')]
        .find(image => new URL(image.src, location.href).pathname === path);
      const card = image?.closest('.ab-case'), bounds = card?.getBoundingClientRect();
      return !!card && !!bounds && bounds.width > 0 && bounds.height > 0
        && bounds.bottom > 0 && bounds.right > 0 && bounds.top < innerHeight && bounds.left < innerWidth
        && !card.closest('[hidden], [inert], .nql-hidden') && getComputedStyle(card).visibility === 'visible';
    }, path).catch(() => false));
  });
  await open(page);
  const image = page.locator('[data-ab-lab] .ab-lab-art');
  const progressBefore = await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'));
  await expect(image).toHaveJSProperty('tagName', 'IMG');
  await expect(image).toHaveAttribute('src', /assets\/scenes\/chamber-balance-still\.webp$/);
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth === 1280)).toBe(true);
  expect(await image.evaluate(async (el: HTMLImageElement) => { await el.decode(); return el.naturalWidth === 1280 && el.naturalHeight > 0; })).toBe(true);
  await expect(page.locator('[data-ab-lab] svg, [data-ab-motion-toggle]')).toHaveCount(0);
  const overview = page.getByRole('tab', { name: 'Visão geral', exact: true });
  if (await overview.isVisible()) {
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(scenesRequested).toEqual([]);
  } else {
    const approved = await page.evaluate(() => Object.values((window as any).NQChamberArt.scenes)
      .filter((entry: any) => entry.approved).map((entry: any) => '/' + entry.src));
    expect(scenesRequested.every(path => approved.includes(path))).toBe(true);
    expect(new Set(scenesRequested).size).toBeLessThan(approved.length);
    expect((await Promise.all(visibleWhenRequested.values())).every(Boolean)).toBe(true);
  }
  if (await page.evaluate(() => matchMedia('(min-width:961px) and (pointer:fine)').matches)) {
    const copyGap = await page.evaluate(() => {
      const title = document.querySelector('.ab-hub-banner .ab-title')!.getBoundingClientRect();
      return document.querySelector('.ab-hub-progress')!.getBoundingClientRect().top - title.bottom;
    });
    expect(copyGap).toBeGreaterThanOrEqual(8); expect(copyGap).toBeLessThanOrEqual(20);
  }
  for (const [width, font] of [[1440, 16], [1440, 32], [390, 16], [320, 32]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(font => document.documentElement.style.fontSize = font + 'px', font);
    await page.waitForFunction(font => Math.abs(parseFloat(getComputedStyle(document.documentElement).fontSize) - font) < .01, font);
    await page.evaluate(() => scrollTo(0, 0));
    await expect(image).toBeVisible();
    const layout = await page.evaluate(() => {
      const root = document.getElementById('acidBaseOverlay')!, stage = root.querySelector('.ab-hub-stage')!;
      const picture = root.querySelector<HTMLImageElement>('.ab-lab-art')!, scene = picture.closest('[data-ab-lab]')!;
      const frame = stage.getBoundingClientRect(), art = scene.getBoundingClientRect(), rendered = picture.getBoundingClientRect();
      const title = root.querySelector('.ab-title')!.getBoundingClientRect();
      const style = getComputedStyle(picture), transform = new DOMMatrixReadOnly(style.transform), mask = getComputedStyle(stage, '::after');
      return {
        // The approved composition deliberately paints behind the title. Verify
        // full coverage and undistorted native imagery rather than separation.
        fullBleed: Math.abs(art.left - frame.left) <= 2 && Math.abs(art.top - frame.top) <= 2 &&
          Math.abs(art.right - frame.right) <= 2 && Math.abs(art.bottom - frame.bottom) <= 2,
        titleOverScene: title.left >= art.left && title.right <= art.right && title.top >= art.top && title.bottom <= art.bottom,
        covers: rendered.left <= art.left + 1 && rendered.top <= art.top + 1 && rendered.right >= art.right - 1 && rendered.bottom >= art.bottom - 1,
        fit: style.objectFit, scaleX: Math.hypot(transform.a, transform.b), scaleY: Math.hypot(transform.c, transform.d),
        mask: mask.backgroundImage.includes('gradient(') && mask.pointerEvents === 'none',
        decorative: scene.getAttribute('aria-hidden'), width: rendered.width,
        native: picture.complete && picture.naturalWidth === 1280 && picture.naturalHeight > 0,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(layout.fullBleed).toBe(true); expect(layout.titleOverScene).toBe(true); expect(layout.covers).toBe(true);
    expect(layout.fit).toBe('cover'); expect(layout.scaleX).toBeCloseTo(layout.scaleY, 5);
    expect(layout.mask).toBe(true); expect(layout.decorative).toBe('true'); expect(layout.native).toBe(true);
    expect(layout.overflow).toBe(false); expect(layout.width).toBeGreaterThan(180);
    for (const selector of ['#acidBaseOverlay .ab-hub-copy .ab-title', '#acidBaseOverlay .ab-preferences',
      '#acidBaseOverlay [data-ab-close]', '#acidBaseOverlay [data-ab-next]:visible',
      '#acidBaseOverlay .ab-hub-about summary']) await assertUnoccluded(page, selector);
    const workspace = await page.locator('#acidBaseOverlay').evaluate(root => root.classList.contains('nq-chamber-workspace'));
    if (workspace) {
      await expect(page.getByRole('tab', { name: 'Visão geral', exact: true })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tab', { name: 'Casos clínicos (20)', exact: true })).toHaveAttribute('aria-selected', 'false');
      for (const selector of ['#acidBaseOverlay [role="tab"][aria-selected="true"]',
        '#acidBaseOverlay [role="tab"][aria-selected="false"]']) await assertUnoccluded(page, selector);
    } else {
      // Native layout intentionally replaces workspace tabs for narrow/coarse
      // displays or enlarged type. Its collection and actual case route remain.
      await expect(page.locator('#acidBaseOverlay [role="tab"]')).toHaveCount(0);
      const heading = page.locator('#acidBaseOverlay .ab-collection-heading h2');
      await expect(heading).toHaveCount(1); await expect(heading).toHaveText('Casos clínicos do reino');
      if (await page.evaluate(() => matchMedia('(min-width:961px) and (pointer:fine)').matches))
        await assertUnoccluded(page, '#acidBaseOverlay .ab-collection-heading h2');
      else await expect(heading).toBeHidden();
      const firstCase = page.locator('#acidBaseOverlay .ab-grid [data-ab-case]:not([disabled])').first();
      await expect(firstCase).toHaveJSProperty('tagName', 'BUTTON'); await expect(firstCase).toBeEnabled();
      await expect(firstCase).toHaveAttribute('data-ab-case', 'aldric');
      await assertUnoccluded(page, '#acidBaseOverlay .ab-grid [data-ab-case="aldric"]');
    }
    const next = page.locator('#acidBaseOverlay [data-ab-next]:visible');
    await expect(next).toHaveJSProperty('tagName', 'BUTTON'); await expect(next).toBeEnabled();
    await expect(next).toHaveAttribute('data-ab-next', 'aldric');
  }
  await Promise.all(visibleWhenRequested.values());
  expect(await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'))).toBe(progressBefore);
});

test('preferência de movimento persiste fora da cena e a pintura continua visível ao pausar ou reduzir', async ({ page }) => {
  await open(page);
  const art = page.locator('[data-ab-lab]'), image = art.locator('img');
  const before = await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'));
  expect(await page.evaluate(() => typeof (window as any).toggleChamberMotion)).toBe('function');
  await expect(art).toHaveAttribute('data-motion', 'running');
  const preferences = page.getByRole('button', { name: 'Preferências', exact: true });
  await preferences.click();
  const popup = page.locator('#mobileProfilePopup.open');
  await expect(popup).toBeVisible();
  await expect(popup.locator('.profile-popup-email strong')).toHaveText('Preferências');
  await expect(popup.locator('.profile-popup-group:visible')).toHaveCount(1);
  await expect(popup.locator('[data-action="openAccountModal"]:visible, [data-action="authLogout"]:visible')).toHaveCount(0);
  const control = popup.getByRole('button', { name: 'Animações da Câmara', exact: true });
  await control.focus(); await page.keyboard.press('Space');
  await expect(control).toHaveAttribute('aria-pressed', 'false');
  await expect(art).toHaveAttribute('data-motion', 'paused');
  expect(await page.evaluate(() => localStorage.getItem('nq-chamber-motion-paused'))).toBe('true');
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-action="toggleChamberMotion"]')].every(el => el.getAttribute('aria-pressed') === 'false') &&
    (document.getElementById('profilePopupItems') as HTMLTemplateElement).content.querySelector('[data-action="toggleChamberMotion"]')!.getAttribute('aria-pressed') === 'false')).toBe(true);
  await expect(image).toBeVisible();
  expect(await art.evaluate(el => el.getAnimations({ subtree: true }).every(a => a.playState === 'paused'))).toBe(true);
  await page.keyboard.press('Escape'); await expect(preferences).toBeFocused();
  await expect(page.locator('#mobileProfilePopup')).not.toHaveAttribute('data-profile-scope', 'preferences');
  await expect(page.locator('#mobileProfilePopup .profile-popup-email strong')).toHaveText('Conta');
  await page.locator('[data-ab-close]').click();
  const normalProfile = page.locator('[data-action="toggleProfilePopup"]:visible').first();
  await normalProfile.click();
  const normalPopup = page.locator('#' + await normalProfile.getAttribute('aria-controls'));
  await expect(normalPopup.locator('.profile-popup-email strong')).toHaveText('Conta');
  await expect(normalPopup.locator('[data-action="openAccountModal"]')).toBeVisible();
  await expect(normalPopup.locator('[data-action="authLogout"]')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(normalProfile).toBeFocused();
  await page.evaluate(() => (window as any).showAcidBaseMinigame());
  await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion', 'paused');
  await page.evaluate(() => (window as any).toggleChamberMotion());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion', 'paused');
  await expect(page.locator('[data-ab-lab] img')).toBeVisible();
  expect(await page.locator('[data-ab-lab]').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('nq-acidbase-progress'))).toBe(before);
});

test('cena indisponível usa a sala sem bloquear início e o mesmo nó visual permanece entre os atos', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await page.route('**/assets/chamber/scenes/aldric.webp', route => route.abort());
  const next = page.locator('[data-ab-next="aldric"]:visible');
  if (await next.count()) await next.click(); else await page.locator('[data-ab-case="aldric"]:visible').click();
  const scene = page.locator('[data-ab-case-scene="aldric"]');
  await expect(scene).toHaveAttribute('data-ab-scene-source', 'chamber');
  await expect(scene.locator('img')).toHaveAttribute('src', /assets\/scenes\/chamber-balance-still\.webp$/);
  await expect(page.locator('.ab-context .ab-title')).toBeFocused();
  const headerClear = await page.evaluate(() => {
    const scene = document.querySelector('[data-ab-case-scene]')!.getBoundingClientRect();
    return [...document.querySelectorAll('.ab-preferences, [data-ab-close]')].every(control => {
      const box = control.getBoundingClientRect();
      return box.bottom <= scene.top || box.top >= scene.bottom || box.right <= scene.left || box.left >= scene.right;
    });
  });
  expect(headerClear).toBe(true);
  const before = await scene.elementHandle();
  await page.locator('[data-ab-start-acts]').click();
  await expect(page.locator('.ab-prompt')).toBeFocused();
  expect(await scene.evaluate((current, previous) => current === previous, before)).toBe(true);
  expect(errors).toEqual([]);
});
