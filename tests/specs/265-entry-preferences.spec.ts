import {test, expect, type Page} from '@playwright/test';
import {confirmCharacterStart} from '../helpers/cinema';

// Native Guest routes. Only persisted records/preferences are fixtures; no
// product controller, bank, catalog, authentication service or state is replaced.
const observations = new WeakMap<Page, {errors: string[]; nonGet: string[]}>();
const PROGRESS = ['nefroquest-save', 'nefroquest-save-v7', 'nefroquest-stats',
  'nefroquest-detailed-stats', 'nefroquest-sr-data', 'nefroquest-study-state',
  'nefroquest-exam-state', 'nq-acidbase-progress', 'nefroquest-all-answered-qids'];
test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: 'no-preference'}});
test.setTimeout(90000);
test.beforeEach(async ({page, context, baseURL}) => {
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  const report = {errors: [] as string[], nonGet: [] as string[]}; observations.set(page, report);
  page.on('pageerror', error => report.errors.push(error.message));
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { report.nonGet.push(request.method() + ' ' + url.origin + url.pathname); return route.abort(); }
    const font = ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) && url.protocol === 'https:';
    return url.origin === origin || font ? route.continue() : route.abort();
  });
});
test.afterEach(async ({page}, info) => {
  await info.attach('entry-preferences-runtime', {contentType: 'application/json', body: JSON.stringify(observations.get(page))});
  expect(observations.get(page)?.errors).toEqual([]);
  expect(observations.get(page)?.nonGet).toEqual([]);
});
async function fonts(page: Page) {
  const loaded = await page.evaluate(async () => {
    const body = await document.fonts.load('400 16px "Source Sans 3"');
    const heading = await document.fonts.load('600 24px "Alegreya"');
    await document.fonts.ready;
    return {body: body.map(face => face.family.replaceAll('"', '')), heading: heading.map(face => face.family.replaceAll('"', ''))};
  });
  expect(loaded.body).toContain('Source Sans 3'); expect(loaded.heading).toContain('Alegreya');
}
async function enter(page: Page) {
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await expect(page.locator('html')).not.toHaveClass(/nq-auth-pending/);
  const guest = page.locator('[data-portal-route="guest"]');
  if (await guest.isVisible()) await guest.click();
  if (await page.locator('#identityOverlay').isVisible())
    await page.locator('[data-action="_pickIdentity"][data-arg="combat"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  await fonts(page);
}
async function progress(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), PROGRESS);
}
async function assertPreferenceViewport(page: Page, initial = false) {
  const geometry = await page.locator('#welcomeProfilePopup').evaluate(element => {
    const box = element.getBoundingClientRect(), trigger = document.getElementById('welcomeProfileBtn')!.getBoundingClientRect();
    const style = getComputedStyle(element), parent = element.offsetParent as HTMLElement | null;
    return {left:box.left,right:box.right,top:box.top,bottom:box.bottom,width:box.width,height:box.height,
      viewportWidth:innerWidth,viewportHeight:innerHeight,triggerBottom:trigger.bottom,gap:box.top-trigger.bottom,
      position:style.position,computedTop:style.top,computedRight:style.right,marginTop:style.marginTop,
      offsetParent:parent?.id || parent?.className || null,scrollTop:element.scrollTop,
      scrollHeight:element.scrollHeight,clientHeight:element.clientHeight};
  });
  await test.info().attach(initial ? 'preferences-bounds-open' : 'preferences-bounds-scrolled', {contentType:'application/json',body:JSON.stringify(geometry)});
  expect(geometry.left).toBeGreaterThanOrEqual(0); expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.top).toBeGreaterThanOrEqual(0); expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  if (initial) expect(Math.abs(geometry.gap - 8)).toBeLessThanOrEqual(1);
  return geometry;
}
async function preferenceMenu(page: Page) {
  await page.locator('#welcomeProfileBtn').click();
  const menu = page.locator('#welcomeProfilePopup');
  await expect(menu).toHaveClass(/open/);
  await assertPreferenceViewport(page, true);
  return menu;
}
test('first access gives a next step beside the real CTA and de-emphasizes zero history', async ({page}, info) => {
  await enter(page);
  const before = await progress(page), screen = page.locator('#welcomeScreen');
  await expect(screen).toHaveAttribute('data-first-access', 'true');
  await expect(page.locator('#welcomeFirstStep')).toBeVisible();
  await expect(page.locator('#welcomeStats')).toBeHidden();
  const start = screen.locator('[data-action="startNewFromWelcome"]');
  await expect(start).toHaveAttribute('aria-describedby', /welcomeFirstStep/);
  const geometry = await page.evaluate(() => {
    const cta = document.querySelector('.nql-atrium__primary-actions')!.getBoundingClientRect();
    const hint = document.getElementById('welcomeFirstStep')!.getBoundingClientRect();
    return {gap: hint.top - cta.bottom, overflow: document.documentElement.scrollWidth - innerWidth};
  });
  expect(geometry.gap).toBeGreaterThanOrEqual(0); expect(geometry.gap).toBeLessThan(32);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(await progress(page)).toEqual(before);
  await info.attach('first-access', {body: await screen.screenshot(), contentType: 'image/png'});
  await start.click(); await expect(page.locator('.difficulty-card[data-diff-key="normal"]')).toBeVisible();
});
for (const fixture of [
  {name: 'existing personal record', key: 'nefroquest-stats', raw: JSON.stringify({gamesPlayed: 2, bestScore: 600, bestLevel: 3})},
  {name: 'ended/reset journey', key: 'nefroquest-save-v7', raw: JSON.stringify({schemaVersion: 7, saveOwner: null, save: null, resetReason: 'journey', saveRevision: 'entry-test'})},
]) test(fixture.name + ' is never described as first access and its raw value is retained', async ({page}) => {
  await page.addInitScript(({key, raw}) => localStorage.setItem(key, raw), fixture);
  await enter(page);
  await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-first-access', 'false');
  await expect(page.locator('#welcomeFirstStep')).toBeHidden();
  expect(await page.evaluate(key => localStorage.getItem(key), fixture.key)).toBe(fixture.raw);
  if (fixture.key === 'nefroquest-stats') {
    await expect(page.locator('#wsBestScore')).toHaveText('600'); await expect(page.locator('#wsGamesPlayed')).toHaveText('2');
  }
});
test('foreign-owner boot leaves only the signed-out Portal interactive, then admits the native Guest route', async ({page}) => {
  const raw = JSON.stringify({schemaVersion: 7, saveOwner: 'another-owner', character: 'nephros', lives: 5});
  await page.addInitScript(raw => localStorage.setItem('nefroquest-save-v7', raw), raw);
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await expect(page.locator('html')).not.toHaveClass(/nq-auth-pending/);
  await expect(page.locator('#landingScreen')).toBeVisible();
  await expect(page.locator('#welcomeScreen')).toBeHidden();
  await expect(page.locator('#mainApp')).toBeHidden();
  const retired = await page.evaluate(() => localStorage.getItem('nefroquest-save-v7'));
  expect(retired).not.toBe(raw);
  expect(JSON.parse(retired!)).toMatchObject({save: null, saveOwner: 'another-owner', resetReason: 'logout'});
  const guest = page.locator('[data-portal-route="guest"]');
  await guest.scrollIntoViewIfNeeded();
  expect(await guest.evaluate(element => {const b = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));})).toBe(true);
  await guest.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect(page.locator('#landingScreen')).toBeHidden();
  await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-first-access', 'false');
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('nq_guest_mode'))).toBe('1');
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save-v7'))).toBe(retired);
});
test('first-access presentation retains a foreign raw record introduced after settled Guest startup', async ({page}) => {
  await enter(page);
  const raw = JSON.stringify({schemaVersion: 7, saveOwner: 'another-owner', character: 'nephros', lives: 5});
  await page.evaluate(raw => localStorage.setItem('nefroquest-save-v7', raw), raw);
  const before = await progress(page);
  // Invoke the actual read/presentation hook after the native Guest startup;
  // no authentication callback, owner transition or product function is replaced.
  await page.evaluate(() => (window as any).refreshWelcomeSave());
  await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-first-access', 'false');
  await expect(page.locator('#welcomeFirstStep')).toBeHidden();
  await expect(page.locator('#welcomeContinueBtn')).toBeHidden();
  expect(await progress(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save-v7'))).toBe(raw);
});
test('the native saved journey retains its real binding and remains resumable', async ({page}) => {
  await enter(page);
  await page.locator('#welcomeScreen [data-action="startNewFromWelcome"]').click();
  await page.locator('.difficulty-card[data-diff-key="normal"]').click(); await page.locator('#diffConfirmBtn').click();
  await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="nephros"]').click();
  await confirmCharacterStart(page);
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
  await expect.poll(() => page.evaluate(() => localStorage.getItem('nefroquest-save-v7'))).not.toBeNull();
  await page.locator('#mainApp').getByRole('button', {name: 'Voltar ao início do NefroQuest', exact: true}).click();
  await expect(page.locator('#welcomeScreen')).toHaveAttribute('data-first-access', 'false');
  await expect(page.locator('#welcomeFirstStep')).toBeHidden();
  await expect(page.locator('#welcomeContinueBtn')).toBeVisible();
  const before = await page.evaluate(() => (0, eval)('JSON.stringify({gold:state.gold,score:state.score,xp:state.xp,level:state.level,correctTotal:state.correctTotal})'));
  const qid = await page.evaluate(() => (0, eval)('state.current.id'));
  await page.locator('#welcomeContinueBtn').click(); await expect(page.locator('#mainApp')).toBeVisible();
  expect(await page.evaluate(() => (0, eval)('state.current.id'))).toBe(qid);
  expect(await page.evaluate(() => (0, eval)('JSON.stringify({gold:state.gold,score:state.score,xp:state.xp,level:state.level,correctTotal:state.correctTotal})'))).toBe(before);
});
for (const motion of ['no-preference', 'reduce'] as const) test('portal routes focus immediately and fade only the selected form: ' + motion, async ({page}) => {
  await page.emulateMedia({reducedMotion: motion});
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await fonts(page);
  await page.evaluate(() => {
    (window as any).__entryPanelStarts = [];
    document.addEventListener('animationstart', event => {
      const animation = event as AnimationEvent;
      if (animation.animationName === 'nql-auth-panel-enter')
        (window as any).__entryPanelStarts.push((event.target as HTMLElement).id);
    }, true);
  });
  const trigger = page.locator('[data-portal-route="email"]'); await trigger.click();
  await expect(page.locator('#authEmail')).toBeFocused();
  // Focus is checked before waiting for the existing outer opening transition.
  // Panel opacity changes must not resize the settled dialog.
  await expect(page.locator('#authBox')).toHaveCSS('transform', 'none');
  const box = await page.locator('#authBox').boundingBox();
  for (const route of [
    {button: '#tabCadastrar', form: '#authFormCadastrar', field: '#authDisplayName'},
    {button: '#tabEntrar', form: '#authFormEntrar', field: '#authEmail'},
    {button: '#authModal [data-action="showForgotPassword"]', form: '#authFormForgot', field: '#authForgotEmail'},
  ]) {
    await page.locator(route.button).click(); await expect(page.locator(route.field)).toBeFocused();
    await expect(page.locator('#authModal .nql-auth-panel-active')).toHaveCount(1);
    await expect(page.locator(route.form)).toHaveClass(/nql-auth-panel-active/);
    await expect(page.locator(route.form)).toHaveCSS('animation-name', motion === 'reduce' ? 'none' : 'nql-auth-panel-enter');
    if (motion === 'no-preference') await expect(page.locator(route.form)).toHaveCSS('animation-duration', '0.18s');
    const next = await page.locator('#authBox').boundingBox(); expect(Math.abs(next!.height - box!.height)).toBeLessThan(1);
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const starts = await page.evaluate(() => (window as any).__entryPanelStarts);
  // Empty recovery invokes native validation only; no authentication request.
  await page.locator('#authForgotBtn').click(); await expect(page.locator('#authMsg.error')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__entryPanelStarts)).toEqual(starts);
  await expect(page.locator('#authFormForgot')).toHaveClass(/nql-auth-panel-active/);
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
  await expect(page.locator('#authModal .nql-auth-panel-active')).toHaveCount(0);
  if (motion === 'reduce') expect(starts).toEqual([]);
});
test('reading preview and applied state remain in the same menu without extra announcements or preference keys', async ({page}, info) => {
  await enter(page);
  const before = await progress(page), menu = await preferenceMenu(page);
  const state = menu.locator('[data-nq-preference-state="reading"]'), button = menu.locator('[data-action="toggleReadingMode"]');
  await expect(state).toHaveText('Aplicado: leitura padrão.');
  const preview = menu.locator('.nql-reading-preview'); await preview.locator('summary').click();
  const size = await preview.locator('p').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  const dialogs = await page.locator('[role="dialog"]:visible').count();
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  await button.focus(); await page.keyboard.press('Space');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(state).toHaveText('Aplicado: texto maior e mais contraste.');
  await expect(menu).toHaveClass(/open/); await expect(button).toBeFocused();
  expect(await preview.locator('p').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(size);
  expect(await page.locator('[role="dialog"]:visible').count()).toBe(dialogs);
  await expect(page.locator('.nq-toast')).toHaveCount(0);
  await expect(menu.locator('.nql-preference-help [aria-live]')).toHaveCount(0);
  expect(await progress(page)).toEqual(before);
  const afterKeys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(afterKeys.filter(key => !keys.includes(key))).toEqual(['nefroquest-reading-mode']);
  await info.attach('inline-preferences', {body: await menu.screenshot(), contentType: 'image/png'});
  await page.keyboard.press('Escape'); await expect(page.locator('#welcomeProfileBtn')).toBeFocused();
  await page.reload({waitUntil: 'domcontentloaded'}); await expect(page.locator('body')).toHaveClass(/reading-mode/);
  const reopened = await preferenceMenu(page); await expect(reopened.locator('[data-nq-preference-state="reading"]')).toHaveText('Aplicado: texto maior e mais contraste.');
});
test('motion state follows its existing control and system reduction, preserving the stored choice', async ({page}) => {
  await enter(page); const before = await progress(page), menu = await preferenceMenu(page);
  const button = menu.locator('[data-action="toggleChamberMotion"]'), state = menu.locator('[data-nq-preference-state="motion"]');
  await expect(state).toHaveText('Aplicado: animações da Câmara ativas.');
  await button.click(); await expect(state).toHaveText('Aplicado: animações da Câmara pausadas.');
  expect(await page.evaluate(() => localStorage.getItem('nq-chamber-motion-paused'))).toBe('true');
  await page.emulateMedia({reducedMotion: 'reduce'}); await expect(button).toBeDisabled();
  await expect(state).toHaveText('Aplicado: movimento reduzido pelo sistema.');
  expect(await page.evaluate(() => localStorage.getItem('nq-chamber-motion-paused'))).toBe('true');
  await page.emulateMedia({reducedMotion: 'no-preference'}); await expect(button).toBeEnabled();
  await expect(state).toHaveText('Aplicado: animações da Câmara pausadas.');
  expect(await progress(page)).toEqual(before);
});

test('preferences remain reachable in their native scroller at320px and32px root text', async ({page}, info) => {
  await page.setViewportSize({width: 320, height: 568});
  await page.addInitScript(() => {
    localStorage.setItem('nefroquest-reading-mode', '0');
    localStorage.setItem('nq-chamber-motion-paused', 'false');
  });
  await enter(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
  const before = await progress(page);
  const preferences = () => page.evaluate(() => {
    const keys = [...new Set([...(window as any).NQ_DEVICE_KEYS, 'nefroquest-reading-mode', 'nq-chamber-motion-paused'])] as string[];
    return Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
  });
  const savedPreferences = await preferences(), menu = await preferenceMenu(page);
  const initialMenuBounds = await assertPreferenceViewport(page, true);
  const reading = menu.locator('[data-action="toggleReadingMode"]'), motion = menu.locator('[data-action="toggleChamberMotion"]');
  const preview = menu.locator('.nql-reading-preview'), summary = preview.locator('summary');
  await summary.scrollIntoViewIfNeeded(); await summary.focus(); await page.keyboard.press('Space');
  await expect(preview).toHaveAttribute('open', '');
  await preview.locator('p').scrollIntoViewIfNeeded(); await expect(preview.locator('p')).toBeVisible();
  const scroller = await menu.evaluate(element => ({scrollHeight: element.scrollHeight, clientHeight: element.clientHeight, overflowY: getComputedStyle(element).overflowY}));
  await assertPreferenceViewport(page);
  expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
  expect(['auto', 'scroll']).toContain(scroller.overflowY);
  for (const control of [reading, motion, summary]) {
    await control.scrollIntoViewIfNeeded(); await control.focus(); await expect(control).toBeFocused();
    const geometry = await control.evaluate(element => {const b = element.getBoundingClientRect(); return {height:b.height,hit:element.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))};});
    expect(geometry.height).toBeGreaterThanOrEqual(44); expect(geometry.hit).toBe(true);
    const currentMenuBounds = await assertPreferenceViewport(page);
    expect(Math.abs(currentMenuBounds.left - initialMenuBounds.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(currentMenuBounds.top - initialMenuBounds.top)).toBeLessThanOrEqual(1);
  }
  await reading.scrollIntoViewIfNeeded(); await reading.focus(); await page.keyboard.press('Space');
  await expect(menu.locator('[data-nq-preference-state="reading"]')).toHaveText('Aplicado: texto maior e mais contraste.');
  await expect(reading).toBeFocused(); await expect(preview).toHaveAttribute('open', '');
  await page.keyboard.press('Space'); await expect(reading).toHaveAttribute('aria-pressed', 'false');
  await motion.scrollIntoViewIfNeeded(); await motion.focus(); await page.keyboard.press('Space');
  await expect(menu.locator('[data-nq-preference-state="motion"]')).toHaveText('Aplicado: animações da Câmara pausadas.');
  await page.keyboard.press('Space'); await expect(motion).toHaveAttribute('aria-pressed', 'true');
  const widths = await page.evaluate(() => ({document:document.documentElement.scrollWidth-innerWidth,
    menu:document.getElementById('welcomeProfilePopup')!.scrollWidth-document.getElementById('welcomeProfilePopup')!.clientWidth}));
  expect(widths.document).toBeLessThanOrEqual(1); expect(widths.menu).toBeLessThanOrEqual(1);
  await assertPreferenceViewport(page);
  expect(await progress(page)).toEqual(before); expect(await preferences()).toEqual(savedPreferences);
  await info.attach('preferences320-text32', {body:await menu.screenshot(),contentType:'image/png'});
  await page.keyboard.press('Escape'); await expect(menu).not.toHaveClass(/open/); await expect(page.locator('#welcomeProfileBtn')).toBeFocused();
  expect(await progress(page)).toEqual(before); expect(await preferences()).toEqual(savedPreferences);
});
