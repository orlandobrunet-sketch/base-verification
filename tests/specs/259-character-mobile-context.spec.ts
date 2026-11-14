import {test, expect, type Page, type TestInfo} from '@playwright/test';
import {confirmCharacterStart} from '../helpers/cinema';

type CharacterAudit = {initialCookies: number; initialOrigins: number; pageErrors: string[];
  nonGET: string[]; nonGETResponses: string[]; webSocketAttempts: number;
  blockedExternalGET: {origin: string; resourceType: string}[]; externalScriptResponses: number};
const audits = new WeakMap<Page, CharacterAudit>();
test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'reduce'}});
test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL!).origin;
  const storage = await context.storageState();
  const audit: CharacterAudit = {initialCookies: storage.cookies.length, initialOrigins: storage.origins.length,
    pageErrors: [], nonGET: [], nonGETResponses: [], webSocketAttempts: 0, blockedExternalGET: [], externalScriptResponses: 0};
  audits.set(page, audit);
  page.on('pageerror', error => audit.pageErrors.push(error.message));
  page.on('response', response => {
    const request = response.request(), url = new URL(response.url());
    if (request.method() !== 'GET') audit.nonGETResponses.push(request.method() + ' ' + url.origin + url.pathname);
    if (request.resourceType() === 'script' && url.origin !== origin) audit.externalScriptResponses++;
  });
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { audit.nonGET.push(request.method() + ' ' + url.origin + url.pathname); return route.abort(); }
    if (url.origin === origin || ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin)
      && ['stylesheet', 'font'].includes(request.resourceType())) return route.continue();
    audit.blockedExternalGET.push({origin: url.origin, resourceType: request.resourceType()});
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.webSocketAttempts++; socket.close(); });
});
test.afterEach(async ({page}, info) => {
  const audit = {...audits.get(page), authNull: await page.evaluate(() => (window as any).authUser === null).catch(() => false)};
  await info.attach('character-context-runtime', {contentType: 'application/json', body: JSON.stringify(audit)});
  expect(audit.initialCookies).toBe(0); expect(audit.initialOrigins).toBe(0); expect(audit.authNull).toBe(true);
  expect(audit.pageErrors).toEqual([]); expect(audit.nonGET).toEqual([]); expect(audit.nonGETResponses).toEqual([]);
  expect(audit.webSocketAttempts).toBe(0); expect(audit.externalScriptResponses).toBe(0);
});

async function realFonts(page: Page) {
  const families = await page.evaluate(async () => {
    const body = await document.fonts.load('400 16px "Source Sans 3"');
    const heading = await document.fonts.load('600 24px "Alegreya"');
    await document.fonts.ready;
    return {body: body.filter(face => face.status === 'loaded').map(face => face.family.replaceAll('"', '')),
      heading: heading.filter(face => face.status === 'loaded').map(face => face.family.replaceAll('"', ''))};
  });
  expect(families.body).toContain('Source Sans 3'); expect(families.heading).toContain('Alegreya');
}
async function captureContext(page: Page, info: TestInfo, width: number, font: string) {
  for (const [name, selector] of [['portrait', '.nqc-profile-art'], ['bonus', '.nqc-initial']]) {
    await page.locator('#charSelectModal ' + selector).scrollIntoViewIfNeeded();
    const geometry = await page.locator('#charSelectModal').evaluate(element => ({
      viewport: {width: innerWidth, height: innerHeight}, rootFont: getComputedStyle(document.documentElement).fontSize,
      selected: (element as HTMLElement).dataset.previewCharacter, scrollTop: element.scrollTop,
      bodyFont: getComputedStyle(element.querySelector('#nqcInitialBonus')!).fontFamily,
      headingFont: getComputedStyle(element.querySelector('#nqcProfileName')!).fontFamily,
      rectangles: Object.fromEntries(['.nqc-portrait-stage', '#nqcProfileName', '.nqc-profile-attributes', '.nqc-initial', '#nqcProfileStory', '.nqc-path']
        .map(selector => { const box = element.querySelector(selector)!.getBoundingClientRect(); return [selector, {x: box.x, y: box.y, width: box.width, height: box.height}]; }))
    }));
    await info.attach(`character-${width}-${font}-${name}-geometry`, {contentType: 'application/json', body: JSON.stringify(geometry)});
    await info.attach(`character-${width}-${font}-${name}`, {contentType: 'image/png', body: await page.screenshot({fullPage: false})});
  }
}

async function openChoice(page: Page) {
  await page.locator('[data-action="startNewFromWelcome"]').click();
  await page.locator('#diffSelectorOverlay [data-diff-key="normal"][role="radio"]').click();
  await page.locator('#diffConfirmBtn').click();
  const choice = page.locator('#charSelectModal');
  await expect(choice).toBeVisible();
  return choice;
}
async function open(page: Page) {
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  return openChoice(page);
}
const progress = (page: Page) => page.evaluate(() => Object.fromEntries([
  'nefroquest-save-v7', 'nefroquest-save', 'nefroquest-pilot-v1', 'nefroquest-sr-data',
  'nefroquest-stats', 'nefroquest-detailed-stats'
].map(key => [key, localStorage.getItem(key)])));

for (const width of [320, 390]) test(`contexto selecionado precede história em${width}px e texto200%`, async ({page}, info) => {
  await page.setViewportSize({width, height: 844});
  const choice = await open(page), before = await progress(page);
  await choice.locator('[data-char="glomerulus"]').click();
  await realFonts(page);
  await expect(choice.locator('.nqc-portrait-stage')).toHaveAttribute('data-portrait-state', 'ready');
  for (const font of ['16px', '32px']) {
    await page.evaluate(font => { document.documentElement.style.fontSize = font; }, font);
    await expect.poll(() => choice.evaluate(element => {
      const story = element.querySelector('#nqcProfileStory')!.getBoundingClientRect();
      return ['.nqc-portrait-stage', '.nqc-profile-attributes', '.nqc-initial'].every(selector =>
        element.querySelector(selector)!.getBoundingClientRect().bottom <= story.top + 1);
    })).toBe(true);
    expect(await choice.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await expect(choice.locator('#nqcProfileName')).toHaveText('Dr. Glomerulus');
    await expect(choice.locator('#nqcAttributes strong')).toHaveText(['+2', '+1']);
    await expect(choice.locator('#nqcInitialBonus')).toContainText('+2 ouro por acerto, até 40 ouro');
    await expect(choice.locator('.nqc-path i')).toHaveCount(10);
    const centers = await choice.evaluate(element => {
      const art = element.querySelector('#nqcProfilePortrait')!.getBoundingClientRect();
      const path = element.querySelector('.nqc-path')!.getBoundingClientRect();
      return {art: art.left + art.width / 2, path: path.left + path.width / 2};
    });
    expect(Math.abs(centers.art - centers.path)).toBeLessThanOrEqual(1);
    for (const target of [choice.locator('#nqcInitialBonus'), choice.locator('.nqc-story-toggle'), choice.locator('[data-character-cancel]')]) {
      await target.scrollIntoViewIfNeeded();
      await expect(target).toBeInViewport();
    }
    await captureContext(page, info, width, font);
  }
  expect(await progress(page)).toEqual(before);
});

test('teclado mantém a escolha visível e expande a história integral sem gravar progresso', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const choice = await open(page), before = await progress(page);
  const first = choice.locator('[data-char="nephros"]');
  await first.focus(); await page.keyboard.press('End');
  const selected = choice.locator('[data-char="glomerulus"]');
  await expect(selected).toBeFocused();
  await expect(selected).toBeInViewport();
  await expect(selected).toHaveAttribute('aria-checked', 'true');
  const story = choice.locator('#nqcProfileStory'), toggle = choice.locator('.nqc-story-toggle');
  const original = await story.textContent();
  await toggle.focus(); await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toBeFocused();
  expect(await story.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  expect(await story.textContent()).toBe(original);
  await expect(choice.locator('details')).toHaveCount(0);
  await selected.focus(); await page.keyboard.press('Home');
  await expect(first).toHaveAttribute('aria-checked', 'true');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await progress(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(choice).toBeHidden();
  await expect(page.locator('[data-action="startNewFromWelcome"]')).toBeFocused();
  expect(await page.evaluate(() => (window as any)._pendingDiff)).toBeNull();
  expect(await progress(page)).toEqual(before);
});

test('retrato lento reserva a área e uma resposta antiga não troca a nova classe', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/classes-cinema/maga_metabolica/nivel_01.webp*', async route => { await hold; await route.continue(); });
  try {
    const choice = await open(page), before = await progress(page);
    const stage = choice.locator('.nqc-portrait-stage');
    const original = await stage.boundingBox();
    await choice.locator('[data-char="aquaria"]').click();
    await expect(stage).toHaveAttribute('data-portrait-state', 'loading');
    await expect(choice.locator('#nqcProfileName')).toHaveText('Dra. Aquaria');
    await expect(choice.locator('#nqcInitialBonus')).toContainText('Uma proteção contra perda de vida');
    await expect(choice.locator('[data-action="startCharacterPreview"]')).toBeEnabled();
    const pending = await stage.boundingBox();
    expect(pending!.width).toBeCloseTo(original!.width, 1);
    expect(pending!.height).toBeCloseTo(original!.height, 1);
    await choice.locator('[data-char="glomerulus"]').click();
    release();
    await expect(stage).toHaveAttribute('data-portrait-state', 'ready');
    await expect(choice.locator('#nqcProfilePortrait')).toHaveAttribute('src', /guerreiro_glomerular\/nivel_01\.webp$/);
    await expect(choice.locator('#nqcProfileName')).toHaveText('Dr. Glomerulus');
    expect(await progress(page)).toEqual(before);
  } finally { release(); }
});

test('troca pronta usa200ms, movimento reduzido e fechamento encerram a animação', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const choice = await open(page), before = await progress(page);
  const portrait = choice.locator('#nqcProfilePortrait');
  await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await choice.locator('.nqc-portrait-stage').scrollIntoViewIfNeeded();
  for (const [motion, character] of [['no-preference', 'aquaria'], ['reduce', 'glomerulus']] as const) {
    await page.emulateMedia({reducedMotion: motion});
    const durations = await page.evaluate(character => new Promise<(number | null)[]>(resolve => {
      const image = document.querySelector<HTMLImageElement>('#nqcProfilePortrait')!;
      image.addEventListener('load', () => requestAnimationFrame(() => resolve(image.getAnimations().map(animation =>
        Number(animation.effect!.getComputedTiming().duration)))), {once: true});
      document.querySelector<HTMLButtonElement>(`#charSelectModal [data-char="${character}"]`)!.click();
    }), character);
    expect(durations).toEqual(motion === 'reduce' ? [] : [200]);
    if (motion === 'reduce') expect(await portrait.evaluate(element => element.getAnimations().length)).toBe(0);
  }
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const closed = await page.evaluate(() => new Promise<{before: number[], after: number}>(resolve => {
    const image = document.querySelector<HTMLImageElement>('#nqcProfilePortrait')!;
    image.addEventListener('load', () => requestAnimationFrame(() => {
      const before = image.getAnimations().map(animation => Number(animation.effect!.getComputedTiming().duration));
      document.querySelector<HTMLButtonElement>('#charSelectModal [data-character-cancel]')!.click();
      requestAnimationFrame(() => resolve({before, after: image.getAnimations().length}));
    }), {once: true});
    document.querySelector<HTMLButtonElement>('#charSelectModal [data-char="nephros"]')!.click();
  }));
  expect(closed.before).toEqual([200]);
  expect(closed.after).toBe(0);
  await expect(choice).toBeHidden();
  expect(await progress(page)).toEqual(before);
});

test('trocar a escolha durante GET pendente mantém o início antigo sem efeito e confirma a nova classe', async ({page}) => {
  let release!: () => void, requested = false;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/data/topics.js*', async route => { requested = true; await hold; await route.continue(); });
  try {
    let choice = await open(page);
    await choice.locator('[data-char="aquaria"]').click();
    await choice.locator('[data-action="startCharacterPreview"]').click();
    await expect.poll(() => requested).toBe(true);
    choice = await openChoice(page);
    await choice.locator('[data-char="glomerulus"]').click();
    const start = choice.locator('[data-action="startCharacterPreview"]');
    await expect(start).toBeDisabled();
    release();
    await expect(start).toBeEnabled();
    expect(await page.evaluate(() => (0, eval)('state.gameStarted'))).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('nefroquest-save-v7'))).toBeNull();
    await expect(choice).toHaveAttribute('data-preview-character', 'glomerulus');
    await confirmCharacterStart(page);
    await expect(choice).toBeHidden();
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null'));
    expect(save).toMatchObject({character: 'glomerulus', difficulty: 'normal', gameStarted: true,
      classBenefits: {lockedClass: 'glomerulus', windowAnswers: 0}});
  } finally { release(); }
});
