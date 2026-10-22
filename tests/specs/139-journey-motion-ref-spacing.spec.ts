import {test, expect, type Page} from '@playwright/test';
import {injectGameState, enterGame} from '../helpers/game';

async function openHero(page: Page, mobile: boolean) {
  if (mobile) {
    await page.locator('#mobileBottomDock > .mdock-btn.personagem').click();
    await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
    await page.locator('.panel.left').evaluate(el => Promise.all(el.getAnimations()
      .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
      .map(a => a.finished.catch(() => {}))));
  }
  await page.locator('#heroImg').evaluate(img => (img as HTMLImageElement).decode());
}

test.beforeEach(async ({page, context}) => {
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    return ['localhost', '127.0.0.1'].includes(url.hostname) && req.method() === 'GET'
      ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/');
  await injectGameState(page, {gold: 0, streak: 0, narrativeShown: 5});
});

test('Play moves the artwork, Pause freezes it, and the frame stays still', async ({page}, info) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await openHero(page, info.project.name === 'mobile');
  const toggle = page.locator('#guardianMotionToggle'), portrait = page.locator('#heroImg');
  const frame = page.locator('.portrait-frame'), frameBefore = await frame.boundingBox();
  await toggle.focus(); await toggle.press('Enter');
  await expect(toggle).toHaveAccessibleName('Retomar animação do personagem');
  await expect.poll(() => portrait.evaluate(el => el.getAnimations().map(a => a.playState))).toEqual(['paused']);
  const frozen = await portrait.boundingBox();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await portrait.boundingBox()).toEqual(frozen);
  await toggle.press('Space');
  await expect(toggle).toHaveAccessibleName('Pausar animação do personagem');
  // Start at a known point, then let the real browser clock move the artwork.
  await portrait.evaluate(el => { el.getAnimations()[0].currentTime = 0; });
  const start = await portrait.boundingBox();
  await expect.poll(async () => Math.abs((await portrait.boundingBox())!.width - start!.width), {timeout: 5000}).toBeGreaterThan(2);
  expect(await frame.boundingBox()).toEqual(frameBefore);
  await toggle.click();
  await expect.poll(() => portrait.evaluate(el => el.getAnimations().map(a => a.playState))).toEqual(['paused']);
  expect(await page.locator('.nql-portrait-light').evaluate(el => el.getAnimations()[0].playState)).toBe('paused');
  const paused = await portrait.boundingBox();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await portrait.boundingBox()).toEqual(paused);
  await page.reload(); await enterGame(page); await openHero(page, info.project.name === 'mobile');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => portrait.evaluate(el => el.getAnimations().map(a => a.playState))).toEqual(['paused']);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(toggle).toBeHidden();
  await expect.poll(() => portrait.evaluate(el => el.getAnimations().length)).toBe(0);
  await expect(portrait).toHaveCSS('translate', 'none');
  await expect(portrait).toHaveCSS('scale', 'none');
});

test('source titles keep a separate arrow and the question has no loose cycle mark', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  const question = await page.locator('#question').textContent();
  const options = await page.locator('#options .opt-body').allTextContents();
  await page.evaluate(() => { const w = window as any; w.state.idx = 1; w.state.queue = w.questionBank.slice(); w.renderHUD(); });
  await expect(page.locator('#cycleProgressBar')).toBeHidden();
  await expect(page.locator('.nql-choice-instruction')).toHaveText('Escolha uma alternativa.');
  expect(await page.locator('#question').textContent()).toBe(question);
  expect(await page.locator('#options .opt-body').allTextContents()).toEqual(options);
  const correct = await page.evaluate(() => (window as any).state.current.a);
  await page.locator('#options .option').nth(correct).click();
  // Render real, unchanged reference records through the production renderer.
  await page.evaluate(() => (window as any).renderRefs(['ispd_peritonitis_guideline', 'gitelman_kdigo_2017']));
  for (const link of await page.locator('#refs .ref-title').all()) {
    await expect(link.locator('.ref-title-arrow')).toHaveAttribute('aria-hidden', 'true');
    const text = (await link.locator('.ref-title-label').textContent())!;
    await expect(link).toHaveAccessibleName(text);
    expect(new URL((await link.getAttribute('href'))!).searchParams.get('q')).toBe(text);
    const label = (await link.locator('.ref-title-label').boundingBox())!;
    const arrow = (await link.locator('.ref-title-arrow').boundingBox())!;
    expect(arrow.x - label.x - label.width).toBeGreaterThanOrEqual(5);
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
    expect(await link.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({width: 320, height: 844});
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const clippedText = await page.locator('#refs .ref-card').evaluateAll(cards => cards.flatMap(card => {
    const bounds = card.getBoundingClientRect(), cut: string[] = [];
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent?.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(walker.currentNode);
      if ([...range.getClientRects()].some(rect => rect.width && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)))
        cut.push(walker.currentNode.textContent);
    }
    return cut;
  }));
  expect(clippedText, 'all source text, metadata and button labels reflow inside the card at 320px/200%').toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await test.info().attach('source-320px-200pct', {body: await page.locator('#refs').screenshot(), contentType: 'image/png'});
});
