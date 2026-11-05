import {test, expect, type Page} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {medirContraste} from '../helpers/contraste';

test.use({serviceWorkers:'block', reducedMotion:'reduce'});

async function open(page:Page, blockArt=false) {
  await page.route('**/*', route => {
    const url=new URL(route.request().url());
    if(blockArt && url.pathname.endsWith('/assets/scenes/ritual-initiation.webp')) return route.abort();
    return url.hostname==='localhost' ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', {waitUntil:'domcontentloaded'});
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(()=>{
    for(const key of ['nefroquest-recommended-difficulty','nefroquest-ritual-done','nefroquest-sr-data']) localStorage.removeItem(key);
  });
  await page.locator('#forgeBtn:visible,.mdock-btn.forge-item:visible').first().focus();
  await page.evaluate(()=>(window as any).openRitual());
  await expect(page.locator('#ritualPage')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
}

async function imageReady(page:Page) {
  const image=page.locator('#ritualPage .nql-ritual-art img').first();
  await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete && el.naturalWidth>0)).toBe(true);
  await expect(image).toBeVisible();
}

test('scene stays visible after starting the Ritual',async({page})=>{
  await open(page);
  await imageReady(page);
  await page.locator('#ritualStart').click();
  await expect(page.locator('#ritualOpts button')).toHaveCount(4);
  await imageReady(page);
});

async function readable(page:Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const clipped=await page.locator('#ritualPage').evaluate(root=>{
    const outside:string[]=[];
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      const el=node.parentElement;
      if(!el || !node.textContent?.trim() || !el.getClientRects().length || el.closest('[hidden]')) continue;
      const range=document.createRange();range.selectNodeContents(node);
      if([...range.getClientRects()].some(r=>r.width && (r.left < -1 || r.right > innerWidth+1))) outside.push(node.textContent.trim().slice(0,35));
    }
    return outside;
  });
  expect(clipped).toEqual([]);
  expect(await page.evaluate(medirContraste,'#ritualPage')).toEqual([]);
  for(const button of await page.locator('#ritualPage button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
}

for(const layout of [{width:1280,height:800,font:16},{width:390,height:800,font:16},{width:320,height:740,font:32}]){
  test(`intro and question remain readable at ${layout.width}/${layout.font}`,async({page})=>{
    await page.setViewportSize(layout);
    await open(page);
    await page.addStyleTag({content:`html {font-size:${layout.font}px !important;}`});
    await expect(page.locator('html')).toHaveCSS('font-size',layout.font+'px');
    await imageReady(page);
    await readable(page);
    await expect(page.locator('.nql-ritual-intro .nql-ritual-sequence span')).toHaveCount(8);
    await test.info().attach('ritual-intro',{body:await page.screenshot(),contentType:'image/png'});
    await page.locator('#ritualStart').click();
    await expect(page.getByRole('heading',{name:'Questão 1 de 8',exact:true})).toBeFocused();
    await expect(page.locator('#ritualQuestao')).toBeInViewport();
    await expect(page.getByRole('progressbar',{name:'Progresso do Ritual'})).toHaveAttribute('aria-valuenow','0');
    await expect(page.locator('.nql-ritual-route .is-current')).toHaveText('01');
    await expect(page.locator('.nql-ritual-route .is-complete')).toHaveCount(0);
    if(layout.width>360) await imageReady(page);
    await readable(page);
    await test.info().attach('ritual-question',{body:await page.screenshot(),contentType:'image/png'});
    await page.locator('#ritualOpts button').first().click();
    await expect(page.locator('#ritualVeredito')).toContainText(/Correto|Incorreto/);
    for(const button of await page.locator('#ritualOpts button').all()) await expect(button).toBeDisabled();
    await expect(page.getByRole('heading',{name:'Questão 2 de 8',exact:true})).toBeFocused();
    await expect(page.getByRole('progressbar',{name:'Progresso do Ritual'})).toHaveAttribute('aria-valuenow','1');
    await expect(page.locator('.nql-ritual-route .is-complete')).toHaveCount(1);
    await expect(page.locator('.nql-ritual-route .is-current')).toHaveText('02');
  });
}

function progress(page:Page) {
  return page.evaluate(()=>(0,eval)(`JSON.stringify({journey:[state.score,state.correctTotal,state.xp,state.lives,state.gold],sr:localStorage.getItem('nefroquest-sr-data'),recommendation:localStorage.getItem('nefroquest-recommended-difficulty'),done:localStorage.getItem('nefroquest-ritual-done')})`));
}

test('visible exit restores the journey and discards no persisted progress',async({page})=>{
  await open(page);
  const before=await progress(page);
  await page.locator('#ritualStart').click();
  await page.locator('#ritualOpts button').first().click();
  await expect(page.locator('#ritualOpts button').first()).toBeDisabled();
  await page.getByRole('button',{name:'Sair do Ritual',exact:true}).click();
  await expect(page.locator('#ritualPage')).toHaveCount(0);
  await page.waitForTimeout(1100); // The original pending 900ms transition must not recreate the closed page or save a result.
  await expect(page.locator('#ritualPage')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeVisible();
  expect(await page.locator('#mainApp').evaluate((el:HTMLElement)=>el.inert)).toBe(false);
  await expect(page.locator('#forgeBtn:visible,.mdock-btn.forge-item:visible').first()).toBeFocused();
  expect(await progress(page)).toBe(before);
});

test('missing artwork keeps the real Ritual usable',async({page})=>{
  await open(page,true);
  await expect(page.locator('.nql-ritual-art.is-unavailable')).toBeVisible();
  await expect(page.locator('.nql-ritual-art img')).toBeHidden();
  await expect(page.locator('#ritualStart')).toBeEnabled();
  await page.locator('#ritualStart').click();
  await expect(page.locator('#ritualOpts button')).toHaveCount(4);
  await page.getByRole('button',{name:'Sair do Ritual',exact:true}).click();
  await expect(page.locator('#ritualPage')).toHaveCount(0);
});

test('closing never steals focus from a Ritual opened immediately after it',async({page})=>{
  await open(page);
  await page.evaluate(()=>{
    document.querySelector<HTMLButtonElement>('#ritualSair')!.click();
    (window as any).openRitual();
  });
  await expect(page.getByRole('heading',{name:'Ritual de Iniciação',exact:true})).toBeFocused();
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));
  await expect(page.getByRole('heading',{name:'Ritual de Iniciação',exact:true})).toBeFocused();
  await expect(page.locator('#mainApp')).toBeHidden();
  expect(await page.locator('#mainApp').evaluate((el:HTMLElement)=>el.inert)).toBe(true);
});

test('light animation respects reduced motion and stays outside question text',async({page})=>{
  await open(page);
  const art=page.locator('#ritualPage .nql-ritual-art').first();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(()=>art.evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('nqRitualGlow');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>art.evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
  await page.locator('#ritualStart').click();
  await expect(page.locator('#ritualOpts button')).toHaveCount(4);
  await expect.poll(()=>page.locator('#ritualPage .nql-ritual-art').evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
});

async function correctIndex(page:Page) {
  return page.evaluate(()=>{
    const question=document.querySelector('#ritualPage .nq-exam-enunciado')!.textContent;
    const bank=(0,eval)('questionBank') as any[];
    const authored=bank.find(q=>q.q===question);
    const text=authored.o[authored.a];
    const index=[...document.querySelectorAll('#ritualOpts button > span:last-child')].findIndex(el=>el.textContent===text);
    if(index<0) throw new Error('Displayed correct option missing');
    return index;
  });
}

for(const layout of [{width:1280,height:800,font:16},{width:320,height:740,font:32}]){
  test(`result preserves the eight responses and recommendation at ${layout.width}/${layout.font}`,async({page})=>{
    await page.setViewportSize(layout);
    await open(page);
    await page.addStyleTag({content:`html {font-size:${layout.font}px !important;}`});
    await page.locator('#ritualStart').click();
    for(let step=1;step<=8;step++){
      await expect(page.getByRole('heading',{name:`Questão ${step} de 8`,exact:true})).toBeVisible();
      await page.locator('#ritualOpts button').nth(await correctIndex(page)).click();
    }
    await expect(page.getByRole('heading',{name:'Ritual concluído',exact:true})).toBeFocused();
    await expect(page.locator('.nql-ritual-result')).toContainText('Você acertou 8 de 8');
    await expect(page.locator('.nql-ritual-result .is-complete')).toHaveCount(8);
    await expect(page.locator('.nql-ritual-result .is-current')).toHaveCount(0);
    expect(await page.evaluate(()=>localStorage.getItem('nefroquest-recommended-difficulty'))).toBe('hardcore');
    expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('nefroquest-sr-data')||'{}')).length)).toBe(8);
    await imageReady(page);
    await readable(page);
    await test.info().attach('ritual-result',{body:await page.screenshot(),contentType:'image/png'});
  });
}
