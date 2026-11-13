import {test, expect} from '@playwright/test';
import {openChamberCase} from '../helpers/chamber';

// Read the first native question layout while decorative images are pending.
// The global .01ms reduced-motion reset must not create geometry transitions.
for (const motion of ['reduce', 'no-preference'] as const) {
  test.describe('movimento ' + motion, () => {
    test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: motion}});
    test(`a passagem da introdução mantém o espaço externo estável (${motion})`, async ({page, context, baseURL, isMobile}, info) => {
      if (!isMobile) await page.setViewportSize({width: 1159, height: 684});
      const origin = new URL(baseURL!).origin;
      let holdImages = false, release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      const errors: string[] = [], held: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (request.method() !== 'GET' || url.origin !== origin || request.resourceType() === 'media') return route.abort();
        if (holdImages && request.resourceType() === 'image') { held.push(url.pathname); await gate; }
        return route.continue();
      });
      await context.routeWebSocket('**/*', socket => socket.close());
      try {
        await page.goto('/jogar/', {waitUntil: 'load'});
        await page.locator('[data-portal-route="guest"]').click();
        await expect(page.locator('#welcomeScreen')).toBeVisible();
        expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
        await page.locator('[data-atrium-route="modes"]').click();
        await page.locator('[data-mode-route="balance"]:visible').click();
        const heading = page.getByRole('heading', {name: 'Alquimista Renal', exact: true});
        // Media is unavailable in this test; wait for the native fallback to
        // return focus rather than racing its automatic cinema dismissal.
        await expect(heading).toBeFocused();
        holdImages = true;
        await openChamberCase(page, 'aldric');
        const overlay = page.locator('#acidBaseOverlay');
        if (motion === 'reduce') await expect(overlay).toHaveAttribute('data-abx-motion-enabled', 'false');
        const before = await page.evaluate(() => ({
          fine: matchMedia('(pointer:fine)').matches,
          reduced: matchMedia('(prefers-reduced-motion:reduce)').matches,
          progress: localStorage.getItem('nq-acidbase-progress'),
          padding: getComputedStyle(document.getElementById('acidBaseOverlay')!).paddingBottom,
        }));
        expect(before.reduced).toBe(motion === 'reduce');
        await page.evaluate(() => {
          const root = document.getElementById('acidBaseOverlay')!;
          const frames: any[] = [], events: string[] = [];
          const sample = () => {
            const style = getComputedStyle(root);
            frames.push({height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth,
              viewportHeight: innerHeight, viewportWidth: innerWidth, paddingBottom: style.paddingBottom,
              geometry: root.getAnimations().filter(animation => animation instanceof CSSTransition &&
                /padding|margin|height|width|transform|^(?:top|bottom|left|right)$/.test(animation.transitionProperty))
                .map(animation => (animation as CSSTransition).transitionProperty)});
          };
          const record = (event: Event) => {
            const transition = event as TransitionEvent;
            if (event.target === root && /padding|margin|height|width|transform|^(?:top|bottom|left|right)$/.test(transition.propertyName)) events.push(transition.propertyName);
          };
          const observer = new MutationObserver(() => { if (root.querySelector('.ab-prompt') && !frames.length) sample(); });
          observer.observe(root, {subtree: true, childList: true, attributes: true});
          root.addEventListener('transitionrun', record);
          (window as any).__chamberRootMotion = {frames, events, sample, cleanup() {observer.disconnect(); root.removeEventListener('transitionrun', record);}};
        });
        await page.locator('[data-ab-start-acts]').click();
        await expect(page.locator('.ab-prompt')).toBeVisible();
        await page.evaluate(async () => {
          const probe = (window as any).__chamberRootMotion;
          for (let i = 0; i < 3; i++) { await new Promise(requestAnimationFrame); probe.sample(); }
          probe.cleanup();
        });
        const after = await page.evaluate(() => ({
          frames: (window as any).__chamberRootMotion.frames,
          events: (window as any).__chamberRootMotion.events,
          progress: localStorage.getItem('nq-acidbase-progress'),
          ambient: getComputedStyle(document.querySelector('.abx-world-art')!).animationName,
          enabled: document.getElementById('acidBaseOverlay')!.getAttribute('data-abx-motion-enabled'),
        }));
        await info.attach('chamber-root-motion', {contentType: 'application/json', body: JSON.stringify({motion, held, before, after, errors})});
        expect(after.frames.length).toBeGreaterThan(0);
        expect(after.events).toEqual([]);
        for (const frame of after.frames) {
          expect(frame.geometry).toEqual([]);
          expect(frame.width).toBeLessThanOrEqual(frame.viewportWidth + 1);
          if (before.fine) expect(frame.height).toBeLessThanOrEqual(frame.viewportHeight + 1);
        }
        if (motion === 'no-preference' && before.fine) {
          expect(after.enabled).toBe('true');
          expect(after.ambient).toContain('abx-camera-breath');
        }
        expect(after.progress).toBe(before.progress);
        expect(errors).toEqual([]);
      } finally {
        release();
        await page.evaluate(() => (window as any).__chamberRootMotion?.cleanup()).catch(() => {});
      }
    });
  });
}
