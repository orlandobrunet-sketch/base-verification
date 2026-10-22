import {test, expect} from '@playwright/test';
import {saveBase} from '../helpers/fixtures';

const routes = [
  ['modes', 'openGameModesPopup'],
  ['dashboard', 'openDashboard'],
  ['ritual', 'openRitual'],
  ['ranking', 'showLeaderboardFromWelcome'],
  ['library', 'openBibliotecaModal'],
];
const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
const luminance = (rgb: number[]) => rgb.slice(0, 3).map(v => v / 255)
  .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
function contrast(foreground: string, background: string) {
  const f = rgba(foreground), b = rgba(background);
  const mixed = f.slice(0, 3).map((v, i) => v * (f[3] ?? 1) + b[i] * (1 - (f[3] ?? 1)));
  const x = luminance(mixed), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

test.beforeEach(async ({page, context}) => {
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    return ['localhost', '127.0.0.1'].includes(url.hostname) && req.method() === 'GET'
      ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
  await page.evaluate(() => (window as any).playAsGuest());
  await expect(page.locator('#welcomeScreen')).toBeVisible();
});

test('Atrium routes use opaque dark surfaces, readable secondary text and distinct accents', async ({page}) => {
  const buttons = page.locator('#welcomeScreen .nql-atrium__route');
  await expect(buttons).toHaveCount(5);
  const normal = await buttons.evaluateAll(els => els.map(el => {
    const button = el as HTMLButtonElement, s = getComputedStyle(el);
    const small = getComputedStyle(el.querySelector('small')!);
    const icon = getComputedStyle(el.querySelector('.nql-atrium__route-icon')!);
    return {route:button.dataset.atriumRoute, action:button.dataset.action,
      background:s.backgroundColor, image:s.backgroundImage, opacity:s.opacity,
      text:small.color, accent:s.getPropertyValue('--nql-route-accent').trim(),
      icon:icon.backgroundColor, overflow:el.scrollWidth > el.clientWidth + 1};
  }));
  expect(normal.map(r => [r.route, r.action])).toEqual(routes);
  expect(new Set(normal.map(r => r.accent)).size).toBe(5);
  for (const [i, row] of normal.entries()) {
    await expect(buttons.nth(i)).toBeEnabled();
    expect(row.opacity).toBe('1');
    expect(row.image).toBe('none');
    expect(rgba(row.background)[3] ?? 1).toBe(1);
    expect(luminance(rgba(row.background))).toBeLessThan(.01);
    expect(rgba(row.icon)[3] ?? 1).toBe(1);
    expect(luminance(rgba(row.icon))).toBeLessThan(.02);
    expect(contrast(row.text, row.background)).toBeGreaterThanOrEqual(4.5);
    expect(row.overflow).toBe(false);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('Keyboard focus remains visible on all five routes and Enter opens the real game-mode dialog', async ({page}, info) => {
  const buttons = page.locator('#welcomeScreen .nql-atrium__route');
  const originalBoxes = await buttons.evaluateAll(els => els.map(el => {
    const b = el.getBoundingClientRect(); return {width:b.width,height:b.height};
  }));
  await buttons.first().focus();
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  for (let i = 0; i < 5; i++) {
    await expect(buttons.nth(i)).toBeFocused();
    const state = await buttons.nth(i).evaluate(el => {
      const s = getComputedStyle(el), b = el.getBoundingClientRect();
      return {outline:s.outlineStyle,width:s.outlineWidth,opacity:s.opacity,
        background:s.backgroundColor,small:getComputedStyle(el.querySelector('small')!).color,
        box:{width:b.width,height:b.height}};
    });
    expect(state.outline).toBe('solid'); expect(parseFloat(state.width)).toBeGreaterThanOrEqual(2);
    expect(state.opacity).toBe('1'); expect(state.box).toEqual(originalBoxes[i]);
    expect(contrast(state.small, state.background)).toBeGreaterThanOrEqual(4.5);
    if (i < 4) await page.keyboard.press('Tab');
  }
  if (info.project.name === 'chromium') {
    await buttons.first().hover();
    const hovered = await buttons.first().evaluate(el => ({bg:getComputedStyle(el).backgroundColor,small:getComputedStyle(el.querySelector('small')!).color}));
    expect(luminance(rgba(hovered.bg))).toBeLessThan(.02);
    expect(contrast(hovered.small, hovered.bg)).toBeGreaterThanOrEqual(4.5);
  }
  await buttons.first().focus(); await buttons.first().press('Enter');
  await expect(page.locator('#gameModesOverlay')).toHaveClass(/show/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#gameModesOverlay')).not.toHaveClass(/show/);
  await expect(buttons.first()).toBeFocused();
});

test('Header covers both edges at widths equivalent to100,90,80and75percent while content stays aligned',async({page})=>{
 for(const [width,height] of [[1920,1080],[2133,1200],[2400,1350],[2560,1440]]){
  await page.setViewportSize({width,height});
  const layout=await page.locator('#welcomeScreen').evaluate(root=>{
   const box=(selector:string)=>root.querySelector(selector)!.getBoundingClientRect();
   const header=box('.nql-atrium__topbar'),main=box('.nql-atrium__main'),footer=box('.nql-atrium__footer');
   const brand=box('.nql-brand'),actions=box('.nql-atrium__top-actions');
   return{headerLeft:header.left,headerRight:header.right,width:root.clientWidth,
    mainLeft:main.left,mainWidth:main.width,mainRight:main.right,footerLeft:footer.left,footerWidth:footer.width,
    brandLeft:brand.left,actionsRight:actions.right,headerHeight:header.height,
    overflow:root.scrollWidth>root.clientWidth+1};
  });
  expect(layout.headerLeft).toBeCloseTo(0,0);expect(layout.headerRight).toBeCloseTo(layout.width,0);
  expect(layout.mainWidth).toBeCloseTo(1536,0);expect(layout.mainLeft).toBeCloseTo((width-1536)/2,0);
  expect(layout.footerLeft).toBeCloseTo(layout.mainLeft,0);expect(layout.footerWidth).toBeCloseTo(layout.mainWidth,0);
  expect(layout.brandLeft).toBeCloseTo(layout.mainLeft+Math.min(width*.04,80),0);
  expect(layout.actionsRight).toBeCloseTo(layout.mainRight-Math.min(width*.04,80),0);
  expect(layout.headerHeight).toBeGreaterThanOrEqual(76);expect(layout.overflow).toBe(false);
 }
});

test('Saved journey has modest external breathing room without enlarging card or CTA',async({page})=>{
 await page.evaluate(()=>(window as any)._loadTopics());
 const qid=await page.evaluate(()=>(window as any).questionBank[0].id);
 await page.evaluate(save=>localStorage.setItem('nefroquest-save',JSON.stringify(save)),saveBase({level:3,correctTotal:32,queueIds:[qid]}));
 await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>(window as any).playAsGuest());
 await expect(page.locator('#welcomeSavedInfo')).toBeVisible();
 for(const [width,height,font] of [[1280,800,16],[1920,1080,16],[2560,1440,16],[390,844,16],[390,844,32],[320,900,32]]){
  await page.setViewportSize({width,height});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',font);
  const layout=await page.locator('#welcomeScreen').evaluate(root=>{
   const main=root.querySelector('.nql-atrium__main')!,journey=root.querySelector('.nql-atrium__journey')!;
   const card=root.querySelector('.nql-atrium__resume-shell')!,metrics=root.querySelector('.nql-mastery-rail')!;
   const c=card.getBoundingClientRect(),m=metrics.getBoundingClientRect();
   const title=root.querySelector('#atriumTitle')!,range=document.createRange();range.selectNodeContents(title);
   const titleBounds=journey.getBoundingClientRect();
   return{leftOffset:journey.getBoundingClientRect().top-main.getBoundingClientRect().top-parseFloat(getComputedStyle(main).paddingTop),
    outsideGap:m.top-c.bottom,cardPaddingBottom:getComputedStyle(card).paddingBottom,
    titleFits:[...range.getClientRects()].every(r=>r.left>=titleBounds.left-1&&r.right<=titleBounds.right+1),
    finalStepBottom:root.querySelector('.nql-atrium__continuum')!.getBoundingClientRect().bottom,
    header:root.querySelector('.nql-atrium__topbar')!.getBoundingClientRect().toJSON(),
    overflow:root.scrollWidth>root.clientWidth+1,
    clipped:[...root.querySelectorAll('header .nql-brand,header button,header [role="button"],.nql-atrium__primary')].some(el=>el.scrollWidth>el.clientWidth+1)};
  });
  expect(layout.leftOffset).toBeCloseTo(12,0);expect(layout.outsideGap).toBeGreaterThanOrEqual(font===32?40:18);
  expect(layout.cardPaddingBottom).toBe('4px');expect(layout.titleFits).toBe(true);
  expect(layout.header.x).toBe(0);expect(layout.header.width).toBe(width);
  expect(layout.overflow).toBe(false);expect(layout.clipped).toBe(false);
  if(width>=1280&&font===16)expect(layout.finalStepBottom).toBeLessThan(height);
 }
});
