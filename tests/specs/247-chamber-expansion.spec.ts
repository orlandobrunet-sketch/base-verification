import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { openChamberCase } from '../helpers/chamber';

test.use({ serviceWorkers: 'block' });

async function openChamber(page: Page) {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="balance"]:visible').click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
  });
  if (await page.locator('#nqEntryCinema[open]').count()) await page.keyboard.press('Escape');
  await expect(page.locator('#acidBaseOverlay')).toBeVisible();
  await expect(page.locator('#acidBaseOverlay')).toHaveClass(/nq-chamber-expansion/);
}
const progress = (page: Page) => page.evaluate(() => localStorage.getItem('nq-acidbase-progress'));
async function contextDigest(page: Page) {
  const original = await page.locator('.ab-context').evaluate(context => ({
    title: context.querySelector('.ab-title')?.textContent,
    story: context.querySelector('.ab-narrative')?.textContent,
    gas: [...context.querySelectorAll('.ab-gas')].map(item => item.textContent),
  }));
  // The comparison is opaque: clinical text/values are neither interpreted nor printed on failure.
  return createHash('sha256').update(JSON.stringify(original)).digest('hex');
}

test.beforeEach(async ({ context, baseURL, page, isMobile }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
});

test.describe('movimento normal', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('Visão geral não solicita vinte cenas; Casos carrega apenas arte aprovada ao aparecer', async ({ page }) => {
    const requested = new Set<string>();
    const visibilityAtRequest = new Map<string, Promise<{ path: string; visible: boolean }>>();
    page.on('request', request => {
      const path = new URL(request.url()).pathname;
      if (!path.startsWith('/assets/chamber/scenes/')) return;
      requested.add(path);
      if (!visibilityAtRequest.has(path)) visibilityAtRequest.set(path, page.evaluate(path => {
        const image = [...document.querySelectorAll<HTMLImageElement>('.ab-case img')]
          .find(element => new URL(element.src, location.href).pathname === path);
        const card = image?.closest('.ab-case'), bounds = card?.getBoundingClientRect();
        return { path, visible: !!card && !!bounds && bounds.width > 0 && bounds.height > 0
          && bounds.bottom > 0 && bounds.right > 0 && bounds.top < innerHeight && bounds.left < innerWidth
          && !card.closest('[hidden], [inert], .nql-hidden') && getComputedStyle(card).visibility === 'visible' };
      }, path).catch(() => ({ path, visible: false })));
    });
    await openChamber(page);
    const before = await progress(page);
    const approved = await page.evaluate(() => Object.values((window as any).NQChamberArt.scenes)
      .filter((entry: any) => entry.approved).map((entry: any) => '/' + entry.src));
    const cases = page.getByRole('tab', { name: /^Casos clínicos \(\d+\)$/ });
    if (await cases.isVisible()) {
      expect([...requested]).toEqual([]);
      await cases.click();
    } else {
      const initial = await Promise.all(visibilityAtRequest.values());
      await test.info().attach('initial-case-scene-visibility', { contentType: 'application/json', body: JSON.stringify(initial) });
      expect(initial.every(entry => entry.visible && approved.includes(entry.path))).toBe(true);
      expect(requested.size).toBeLessThan(approved.length);
      await page.locator('.ab-case').first().scrollIntoViewIfNeeded();
    }
    await expect.poll(() => requested.size).toBeGreaterThan(0);
    expect(requested.size).toBeLessThan(approved.length);
    expect([...requested].every(path => approved.includes(path))).toBe(true);
    await expect.poll(() => page.locator('.abx-case-art').evaluateAll(images =>
      images.some(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await expect(page.locator('[data-ab-case="aldric"]')).toBeEnabled();
    await expect(page.locator('.ab-case-locked').first()).toBeDisabled();
    await expect(page.locator('[data-ab-case="mara"]')).toHaveCount(0);
    expect(await progress(page)).toBe(before);
    await Promise.all(visibilityAtRequest.values());
  });

  for (const [width, font] of [[1280, 16], [390, 16], [320, 32], [1440, 16]]) test(`introdução mantém história, exames e valores originais em ${width}px / fonte ${font}px`, async ({ page }) => {
    await openChamber(page);
    await openChamberCase(page, 'aldric');
    await expect(page.locator('.ab-body--intro')).toBeVisible();
    await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-abx-stage', 'intro');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: no-preference)').matches)).toBe(true);
    expect(await page.locator('.ab-context .ab-gas').count()).toBeGreaterThan(0);
    const original = await contextDigest(page), before = await progress(page);
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(async font => {
      document.documentElement.style.fontSize = font + 'px';
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }, font);
    await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-abx-stage', 'intro');
    expect(await contextDigest(page)).toBe(original);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator('[data-ab-start-acts]')).toBeEnabled();
    expect(await progress(page)).toBe(before);
  });

  test('ambiente se move, preferência pausa e fechar remove efeitos e observadores antigos', async ({ page }) => {
    await openChamber(page);
    const overlay = page.locator('#acidBaseOverlay'), light = page.locator('.abx-atmosphere-light');
    const before = await progress(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: no-preference)').matches)).toBe(true);
    await expect(overlay).toHaveAttribute('data-abx-motion', 'running');
    await expect.poll(() => light.evaluate(element => element.getAnimations().some(animation =>
      animation instanceof CSSAnimation && animation.animationName.startsWith('abx-') && animation.playState === 'running'))).toBe(true);
    await page.getByRole('button', { name: 'Preferências', exact: true }).click();
    const toggle = page.locator('#mobileProfilePopup.open').getByRole('button', { name: 'Animações da Câmara', exact: true });
    await toggle.focus(); await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(overlay).toHaveAttribute('data-abx-motion', 'paused');
    await expect.poll(() => light.evaluate(element => element.getAnimations().length)).toBe(0);
    await page.keyboard.press('Escape');
    const retained = await overlay.elementHandle();
    await page.locator('[data-ab-close]').click();
    await expect(overlay).toHaveCount(0);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    const retired = await retained!.evaluate(element => ({
      connected: element.isConnected, owned: element.querySelectorAll('.abx-atmosphere,.abx-case-art,.abx-patient-portrait').length,
      attributes: element.getAttributeNames().filter(name => name.startsWith('data-abx-')),
    }));
    expect(retired).toEqual({ connected: false, owned: 0, attributes: [] });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      dispatchEvent(new Event('resize'));
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    });
    expect(await retained!.evaluate(element => element.getAttributeNames().filter(name => name.startsWith('data-abx-')))).toEqual([]);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openChamber(page);
    await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-abx-motion', 'paused');
    await expect.poll(() => page.locator('.abx-atmosphere-light').evaluate(element => element.getAnimations().length)).toBe(0);
    expect(await progress(page)).toBe(before);
  });

  test('arte ausente mantém conteúdo nativo, fallback, início e saída alcançáveis', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const aborted: string[] = [];
    // The mobile catalogue can request Aldric before entering the case.
    // Fail both approved asset paths before the first hub request can cache them.
    await page.route('**/assets/chamber/**/aldric.webp', route => {
      aborted.push(new URL(route.request().url()).pathname);
      return route.abort();
    });
    await openChamber(page);
    await openChamberCase(page, 'aldric');
    const before = await progress(page), original = await contextDigest(page);
    await expect(page.locator('[data-ab-case-scene="aldric"]')).toHaveAttribute('data-ab-scene-source', 'chamber');
    expect(aborted.length).toBeGreaterThan(0);
    expect(aborted).toContain('/assets/chamber/scenes/aldric.webp');
    await expect(page.locator('.ab-context .ab-title')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 740 });
    await page.evaluate(async () => {
      document.documentElement.style.fontSize = '32px';
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    });
    expect(await contextDigest(page)).toBe(original);
    const start = page.locator('[data-ab-start-acts]');
    await start.scrollIntoViewIfNeeded(); await start.focus(); await expect(start).toBeFocused();
    await start.click();
    await expect(page.locator('.ab-prompt')).toBeVisible();
    await page.locator('[data-ab-close]').click();
    await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    expect(await progress(page)).toBe(before);
    expect(errors).toEqual([]);
  });

  test('consulta recolhida conserva nós e valores e devolve o contexto ao layout nativo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openChamber(page);
    await openChamberCase(page, 'aldric');
    await page.locator('[data-ab-start-acts]').click();
    const fold = page.locator('.abx-context-fold'), prompt = page.locator('.ab-prompt');
    await expect(fold).toBeVisible();
    await expect(fold).not.toHaveAttribute('open');
    await expect(prompt).toBeVisible();
    const choice = page.locator('.ab-option').first();
    await expect(choice).toBeEnabled();
    await expect(page.locator('[data-ab-close]')).toBeVisible();
    const original = await contextDigest(page), before = await progress(page);
    const gas = await page.locator('.ab-context .ab-gas-grid').elementHandle();
    await fold.locator('summary').focus(); await page.keyboard.press('Enter');
    await expect(fold).toHaveAttribute('open', '');
    await expect(page.locator('.ab-context .ab-gas-grid')).toBeVisible();
    expect(await contextDigest(page)).toBe(original);
    await fold.locator('summary').press('Enter');
    await expect(fold).not.toHaveAttribute('open');
    await page.setViewportSize({ width: 1440, height: 900 });
    const workspace = await page.evaluate(() => matchMedia('(min-width:961px) and (pointer:fine)').matches);
    if (workspace) {
      await expect(page.locator('#acidBaseOverlay')).toHaveClass(/nq-chamber-workspace/);
      await expect(fold).toHaveCount(0);
      expect(await page.evaluate(() => {
        const active = document.activeElement;
        return !!active && !!document.getElementById('acidBaseOverlay')?.contains(active)
          && active.getClientRects().length > 0 && !active.closest('[hidden], [inert], .nql-hidden');
      })).toBe(true);
    } else {
      await expect(fold).toHaveCount(1);
    }
    expect(await page.locator('.ab-context .ab-gas-grid').evaluate((current, previous) => current === previous, gas)).toBe(true);
    expect(await contextDigest(page)).toBe(original);
    await choice.focus();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(fold).toHaveCount(1);
    await expect(choice).toBeFocused();
    expect(await contextDigest(page)).toBe(original);
    await page.locator('[data-ab-close]').click();
    await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
    expect(await progress(page)).toBe(before);
  });
});

test.describe('movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('preferência efetiva remove animações da expansão sem impedir o primeiro atendimento', async ({ page }) => {
    await openChamber(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const before = await progress(page);
    await expect(page.locator('.abx-atmosphere-light')).toHaveCount(1);
    const active = () => page.locator('#acidBaseOverlay').evaluate(element => element.getAnimations({ subtree: true }).filter(animation =>
      animation instanceof CSSAnimation && animation.animationName.startsWith('abx-')).length);
    expect(await active()).toBe(0);
    await openChamberCase(page, 'aldric');
    await expect(page.locator('.ab-body--intro')).toBeVisible();
    await expect(page.locator('[data-ab-start-acts]')).toBeEnabled();
    expect(await active()).toBe(0);
    await page.locator('[data-ab-close]').click();
    await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
    expect(await progress(page)).toBe(before);
  });
});
