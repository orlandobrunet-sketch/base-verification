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

test('pintura real ocupa a cena sem disputar o título e sem controle de pausa local', async ({ page }) => {
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
  await expect(image).toHaveJSProperty('tagName', 'IMG');
  await expect(image).toHaveAttribute('src', /assets\/scenes\/chamber-balance-still\.webp$/);
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth === 1280)).toBe(true);
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
    await page.evaluate(() => scrollTo(0, 0));
    await expect(image).toBeVisible();
    const layout = await page.evaluate(() => {
      const root = document.getElementById('acidBaseOverlay')!, title = root.querySelector('.ab-title')!.getBoundingClientRect(), image = root.querySelector('.ab-lab-art')!.getBoundingClientRect();
      const gear = root.querySelector('.ab-preferences')!, box = gear.getBoundingClientRect();
      return { headerHit: gear.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)), overlap: !(title.right <= image.left || title.bottom <= image.top || image.right <= title.left || image.bottom <= title.top), width: image.width,
        overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    expect(layout.headerHit).toBe(true); expect(layout.overlap).toBe(false); expect(layout.overflow).toBe(false); expect(layout.width).toBeGreaterThan(180);
  }
  await Promise.all(visibleWhenRequested.values());
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
