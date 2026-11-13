import { test, expect, type Page } from '@playwright/test';

const DEFAULT_STATUS = 'Explore uma rota sem perder o fio da sua jornada.';
const ROUTES = [
  { route: 'modes', copy: 'Alterne entre a jornada principal, treinos, prova e desafios rápidos.' },
  { route: 'dashboard', copy: 'Leia seus pontos fortes, lacunas e evolução por competência.' },
  { route: 'ritual', copy: 'Responda ao ritual para receber uma dificuldade inicial recomendada.' },
  { route: 'ranking', copy: 'Compare constância, nível e pontuação com outros exploradores.' },
  { route: 'library', copy: 'Consulte referências e materiais para aprofundar o raciocínio clínico.' },
];
const CONFIGURATIONS = [
  { width: 412, font: 16 },
  { width: 320, font: 32 },
  { width: 1280, font: 16 },
  { width: 1280, font: 32 },
];

async function geometry(page: Page) {
  return page.locator('#welcomeScreen').evaluate(screen => {
    const status = screen.querySelector<HTMLElement>('#atriumRouteStatus')!;
    const shell = status.closest<HTMLElement>('.nql-atrium__route-status')!;
    const list = screen.querySelector<HTMLElement>('.nql-atrium__route-list')!;
    const routes = screen.querySelector<HTMLElement>('.nql-atrium__routes')!;
    const modes = screen.querySelector<HTMLElement>('[data-atrium-route="modes"]')!;
    const shellRect = shell.getBoundingClientRect(), copyRect = status.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(status);
    const clipped = [...range.getClientRects()].filter(box => box.width && box.height &&
      (box.left < copyRect.left - 1 || box.right > copyRect.right + 1 ||
        box.top < copyRect.top - 1 || box.bottom > copyRect.bottom + 1 ||
        box.left < shellRect.left - 1 || box.right > shellRect.right + 1 ||
        box.top < shellRect.top - 1 || box.bottom > shellRect.bottom + 1))
      .map(box => ({ x: box.x, y: box.y, width: box.width, height: box.height }));
    const liveRegions = [shell, ...shell.querySelectorAll<HTMLElement>('[aria-live]')]
      .filter(element => ['polite', 'assertive'].includes(element.getAttribute('aria-live') || ''));
    const copyStyle = getComputedStyle(status);
    return {
      // Compare within the same component: native focus may scroll its parent.
      // Horizontal position is intentionally excluded from the motion contract.
      statusHeight: shellRect.height,
      listFromStatusTop: list.getBoundingClientRect().top - shellRect.top,
      modesFromRoutesTop: modes.getBoundingClientRect().top - routes.getBoundingClientRect().top,
      copy: status.textContent,
      clipped,
      copyVisible: copyStyle.display !== 'none' && copyStyle.visibility === 'visible' && Number(copyStyle.opacity) > 0,
      uniqueStatus: screen.querySelectorAll('#atriumRouteStatus').length,
      liveRegions: liveRegions.map(element => element.getAttribute('aria-live')),
      screenScroll: screen.scrollTop,
      windowScroll: window.scrollY,
    };
  });
}

function assertStable(before: Awaited<ReturnType<typeof geometry>>, after: Awaited<ReturnType<typeof geometry>>, phase: string) {
  expect(after.statusHeight, phase + ': status height').toBeCloseTo(before.statusHeight, 2);
  expect(after.listFromStatusTop, phase + ': route list offset').toBeCloseTo(before.listFromStatusTop, 2);
  expect(after.modesFromRoutesTop, phase + ': Modes offset').toBeCloseTo(before.modesFromRoutesTop, 2);
  expect(after.clipped, phase + ': live text must remain fully legible').toEqual([]);
  expect(after.copyVisible, phase + ': the live copy is visible').toBe(true);
  expect(after.uniqueStatus, phase + ': one status ID').toBe(1);
  expect(after.liveRegions, phase + ': one polite live region').toEqual(['polite']);
}

for (const motion of ['reduce', 'no-preference'] as const) {
  test.describe('movimento ' + motion, () => {
    test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: motion } });
    for (const configuration of CONFIGURATIONS) {
      test(`descrições das rotas mantêm altura e destinos estáveis em ${configuration.width}px / fonte ${configuration.font}px`, async ({ page, context, baseURL }, info) => {
        await page.setViewportSize({ width: configuration.width, height: 839 });
        const origin = new URL(baseURL!).origin;
        await context.route('**/*', route => {
          const request = route.request();
          return request.method() === 'GET' && new URL(request.url()).origin === origin &&
            !['image', 'media', 'font'].includes(request.resourceType()) ? route.continue() : route.abort();
        });
        await context.routeWebSocket('**/*', socket => socket.close());
        await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
        const guest = page.locator('[data-portal-route="guest"]');
        if (await guest.isVisible()) await guest.click();
        await expect(page.locator('#welcomeScreen')).toBeVisible();
        expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
        expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion === 'reduce');
        // Park the pointer outside the route rail to exercise keyboard focus
        // independently of the separately investigated pointer boundary loop.
        await page.mouse.move(0, 0);
        const targetCopyFont = await page.evaluate(async font => {
          await document.fonts.ready;
          const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
          const status = document.getElementById('atriumRouteStatus')!;
          const target = parseFloat(getComputedStyle(status).fontSize) * font / rootSize;
          document.documentElement.style.fontSize = font + 'px';
          return target;
        }, configuration.font);
        // Wait for the requested scale, not ambient CSS animations or a fixed
        // delay. No settling wait is added between the route focus changes.
        await page.waitForFunction(({ font, copyFont }) => {
          const status = document.getElementById('atriumRouteStatus');
          const screen = document.getElementById('welcomeScreen');
          return status && screen && document.fonts.status === 'loaded' &&
            Math.abs(parseFloat(getComputedStyle(document.documentElement).fontSize) - font) < .01 &&
            Math.abs(parseFloat(getComputedStyle(status).fontSize) - copyFont) < .01 &&
            !screen.getAnimations({ subtree: true }).some(animation => animation instanceof CSSTransition &&
              (animation.pending || animation.playState === 'running'));
        }, { font: configuration.font, copyFont: targetCopyFont });
        const status = page.locator('#atriumRouteStatus');
        await expect(status).toHaveCount(1);
        await expect(status).toHaveText(DEFAULT_STATUS);
        const initial = await geometry(page);
        assertStable(initial, initial, 'baseline');
        const observations: unknown[] = [{ phase: 'baseline', ...initial }];
        for (const route of ROUTES) {
          const button = page.locator(`[data-atrium-route="${route.route}"]`);
          await button.focus();
          await expect(status).toHaveText(route.copy);
          const focused = await geometry(page);
          observations.push({ phase: route.route + '-focused', ...focused });
          await info.attach('atrium-route-step', { contentType: 'application/json',
            body: JSON.stringify({ motion, configuration, observations }) });
          assertStable(initial, focused, route.route + '-focused');
          await button.evaluate(element => (element as HTMLElement).blur());
          await expect(status).toHaveText(DEFAULT_STATUS);
          const blurred = await geometry(page);
          observations.push({ phase: route.route + '-blurred', ...blurred });
          assertStable(initial, blurred, route.route + '-blurred');
        }
        await info.attach('atrium-route-stability', { contentType: 'application/json',
          body: JSON.stringify({ motion, configuration, observations }) });
      });
    }
  });
}
