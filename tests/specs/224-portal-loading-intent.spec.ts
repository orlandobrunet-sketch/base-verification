import {test,expect} from '@playwright/test';
import {saveBase,statsBase} from '../helpers/fixtures';

test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});

test('email access does not prepare the question bank or change saved progress',async({page,context})=>{
  let requests=0;
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
  await context.route('**/data/topics.js',r=>{requests++;return r.abort();});
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  const before=await page.evaluate(({save,stats})=>{
    localStorage.setItem('nefroquest-save',JSON.stringify(save));
    localStorage.setItem('nefroquest-detailed-stats',JSON.stringify(stats));
    const keys=['nefroquest-save','nefroquest-save-v7','nefroquest-detailed-stats'];
    return Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]));
  },{save:saveBase(),stats:statsBase()});
  expect(JSON.parse(before['nefroquest-save']!)).toMatchObject({correctTotal:47,score:4820});
  await page.locator('[data-portal-route="email"]').click();
  await expect(page.locator('script[src*="data/topics.js"]')).toHaveCount(0);
  expect(requests).toBe(0);
  await expect(page.locator('#authEmail')).toBeFocused();
  await page.locator('#tabEntrar').focus();await expect(page.locator('#tabEntrar')).toBeFocused();
  await page.keyboard.press('End');await expect(page.locator('#tabCadastrar')).toBeFocused();
  expect(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(before))).toEqual(before);
});

test('an unrelated touch leaves gameplay warmup available for the guest action',async({page,context})=>{
  let requests=0;
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
  await context.route('**/data/topics.js',r=>{requests++;return r.abort();});
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  await page.locator('#portalTitle').dispatchEvent('pointerdown',{bubbles:true,pointerType:'touch'});
  await expect(page.locator('script[src*="data/topics.js"]')).toHaveCount(0);expect(requests).toBe(0);
  await page.locator('[data-portal-route="email"]').click();
  await expect(page.locator('#authEmail')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#authModal')).not.toHaveClass(/show/);
  await page.locator('[data-portal-route="guest"] strong').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await expect.poll(()=>requests).toBe(1);
  await page.locator('[data-portal-route="guest"]').dispatchEvent('pointerdown',{bubbles:true});
  expect(requests).toBe(1);
});

test('closing before visibility cancels pending focus and keyboard reopening still works',async({page,context})=>{
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  await page.addStyleTag({content:'#authModal[data-nq-ui="lumen"] { transition: visibility 0s linear 150ms !important; }'});
  const route=page.locator('[data-portal-route="email"]');
  await route.click();await page.evaluate(()=>(window as any).closeAuthModal());
  await expect(page.locator('#authModal')).toHaveAttribute('aria-hidden','true');
  await expect(page.locator('#landingScreen')).not.toHaveAttribute('inert','');
  await route.focus();
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await expect(route).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#authEmail')).toBeFocused();
  await page.keyboard.press('Escape');await expect(route).toBeFocused();
});

test('initial focus waits for dialog visibility and keeps the active panel accessible',async({page,context})=>{
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  await page.addStyleTag({content:'#authModal[data-nq-ui="lumen"] { transition: visibility 0s linear 150ms !important; }'});
  await page.locator('[data-portal-route="email"]').click();
  await expect(page.locator('#authEmail')).toBeFocused();
  await expect(page.locator('#authFormEntrar')).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('#tabEntrar')).toHaveAttribute('aria-selected','true');
  await page.locator('#tabEntrar').focus();await expect(page.locator('#tabEntrar')).toBeFocused();
  await page.keyboard.press('End');await expect(page.locator('#tabCadastrar')).toBeFocused();
});

test('opening autofocus does not take focus already chosen by the user',async({page,context})=>{
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  await page.addStyleTag({content:'#authModal[data-nq-ui="lumen"] { transition: visibility 0s linear 10s !important; }'});
  const result=await page.evaluate(async()=>{
    (window as any).openAuthModal();await Promise.resolve();
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    const modal=document.getElementById('authModal')!;
    modal.style.setProperty('transition','none','important');
    modal.style.setProperty('visibility','visible','important');
    const chosen=document.querySelector<HTMLElement>('.auth-close-btn[data-action="closeAuthModal"]')!;
    chosen.focus();const initiallyChosen=document.activeElement===chosen;
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    return {initiallyChosen,preserved:document.activeElement===chosen,
      loginSelected:document.getElementById('tabEntrar')!.getAttribute('aria-selected'),
      loginHidden:document.getElementById('authFormEntrar')!.getAttribute('aria-hidden')};
  });
  expect(result).toEqual({initiallyChosen:true,preserved:true,loginSelected:'true',loginHidden:'false'});
});

test.describe('normal motion tab readiness',()=>{
  test.use({contextOptions:{reducedMotion:'no-preference'}});
  test('tabs accept native focus when the initial field first receives focus',async({page,context})=>{
    await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
    await context.routeWebSocket('**/*',s=>s.close());
    await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{
      (window as any).__initialTabReadiness=null;
      const probe=(event:FocusEvent)=>{
        if((event.target as Element)?.id!=='authEmail')return;
        document.removeEventListener('focusin',probe,true);
        const tab=document.getElementById('tabEntrar')!;
        tab.focus({preventScroll:true});
        (window as any).__initialTabReadiness={visibility:getComputedStyle(tab).visibility,focused:document.activeElement===tab};
      };
      document.addEventListener('focusin',probe,true);
    });
    await page.locator('[data-portal-route="email"]').click();
    await expect.poll(()=>page.evaluate(()=>(window as any).__initialTabReadiness)).not.toBeNull();
    expect(await page.evaluate(()=>(window as any).__initialTabReadiness)).toEqual({visibility:'visible',focused:true});
    await page.keyboard.press('End');await expect(page.locator('#tabCadastrar')).toBeFocused();
  });
});
