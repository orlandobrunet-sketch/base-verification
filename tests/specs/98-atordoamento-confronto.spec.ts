import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
import { attachFailureEvidence } from '../helpers/failure-evidence';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.beforeEach(async ({page}) => {
 await page.addInitScript(() => {
  if (window !== window.top) return;
  const limit = 48, events: unknown[] = [];
  const identify = (target: EventTarget | null) => {
   const element = target instanceof Element ? target : null;
   return element ? {tag:element.tagName,id:element.id.slice(0,80),classes:[...element.classList].slice(0,8),
    inStunReader:!!element.closest('.nqstun-card .nqnarr-reading'),inPortal:!!element.closest('#landingScreen')}
    : {kind:target === document ? 'document' : target === window ? 'window' : 'other'};
  };
  const record = (event:Event, phase:string) => {
   events.push({type:event.type,phase,at:performance.now(),eventAt:event.timeStamp,isTrusted:event.isTrusted,
    eventPhase:event.eventPhase,defaultPrevented:event.defaultPrevented,target:identify(event.target),
    activeElement:identify(document.activeElement),documentHasFocus:document.hasFocus(),visibility:document.visibilityState});
   if (events.length > limit) events.splice(0,events.length-limit);
  };
  for (const capture of [true,false]) {
   for (const type of ['keydown','keyup']) window.addEventListener(type,event => {
    if ((event as KeyboardEvent).key === 'End') record(event,capture ? 'capture' : 'bubble');
   },{capture,passive:true});
  }
  for (const type of ['focusin','scroll']) window.addEventListener(type,event => record(event,'capture'),{capture:true,passive:true});
  (window as any).__nq98PassiveEnd = {limit,events};
 });
});

async function attachStunEndEvidence(page:Page,info:Parameters<typeof attachFailureEvidence>[1]) {
 let timer:ReturnType<typeof setTimeout>|undefined;
 let evidence:unknown = {status:'unavailable',reason:'page-closed'};
 try {
  if (!page.isClosed()) {
   evidence = await Promise.race([page.evaluate(() => {
    const identify = (element:Element|null) => element && ({tag:element.tagName,id:element.id.slice(0,80),
     classes:[...element.classList].slice(0,8),inStunReader:!!element.closest('.nqstun-card .nqnarr-reading'),
     inPortal:!!element.closest('#landingScreen')});
    const measure = (selector:string) => {
     const element = document.querySelector<HTMLElement>(selector);
     if (!element) return {selector,present:false};
     const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
     return {selector,present:true,element:identify(element),hiddenAncestor:!!element.closest('[hidden],.hidden'),
      inertAncestor:!!element.closest('[inert]'),scrollTop:element.scrollTop,scrollHeight:element.scrollHeight,
      clientHeight:element.clientHeight,rect:{top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right,width:rect.width,height:rect.height},
      style:{overflowY:style.overflowY,display:style.display,visibility:style.visibility,fontSize:style.fontSize}};
    };
    const ring=(window as any).__nq98PassiveEnd;
    return {status:'available',phase:'after-failure',at:performance.now(),documentHasFocus:document.hasFocus(),
     visibility:document.visibilityState,activeElement:identify(document.activeElement),
     viewport:{width:innerWidth,height:innerHeight},ringLimit:ring?.limit ?? null,events:ring?.events ?? null,
     regions:['.nqstun-card .nqnarr-reading','.nqstun-card','#landingScreen'].map(measure)};
   }).catch(() => ({status:'unavailable',reason:'evaluation-failed'})),new Promise(resolve => {
    timer=setTimeout(() => resolve({status:'unavailable',reason:'evaluation-timeout'}),3000);
   })]);
  }
 } catch { evidence={status:'unavailable',reason:'diagnostic-failed'}; }
 finally { if (timer) clearTimeout(timer); }
 try { await info.attach('stun-end-evidence',{contentType:'application/json',body:JSON.stringify({schema:1,readLimitMs:3000,evidence})}); }
 catch { /* Preserve the original failure if teardown no longer accepts attachments. */ }
}

test.afterEach(async ({page},info) => {
 if (info.status !== info.expectedStatus) await Promise.all([attachFailureEvidence(page,info),attachStunEndEvidence(page,info)]);
});

async function abrir(page:Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
 await injectGameState(page,{gold:0,correctTotal:93,level:12,score:45000,bossIntroShown:true,narrativeShown:90});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(()=>(0,eval)('checkNarrative()'));
 const card=page.getByRole('dialog',{name:'A Névoa da Azotemia',exact:true});await expect(card).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);return card;
}
test('feitiço preserva bloqueio 93–97, estado e retorno à questão; recuperação ocorre em 98',async({page})=>{
 const card=await abrir(page);await expect(card.locator('.nqstun-effect')).toContainText('Durante as questões 93 a 97.');
 await expect(card.locator('.nqnarr-story')).toHaveText(await page.evaluate(()=>(0,eval)('narrativeStages.find(s=>s.stun).text')));
 const before=await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal,current:state.current,idx:state.idx,equipment:state.equipment})'));
 const button=card.getByRole('button',{name:'Suportar o impacto…'});await expect(button).toBeFocused();
 for(const key of ['Tab','Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(e=>e.contains(document.activeElement))).toBe(true)}
 expect(await page.evaluate(medirContraste,'.nqstun-card')).toEqual([]);
 await button.click();await expect(card).toHaveCount(0);
 expect(await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,score:state.score,lives:state.lives,correct:state.correctTotal,current:state.current,idx:state.idx,equipment:state.equipment})'))).toBe(before);
 expect(await page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
 await page.evaluate(()=>(0,eval)('state.correctTotal=97;checkNarrative()'));
 await expect(page.locator('.narrative-popup')).toHaveCount(0);expect(await page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);
 await page.evaluate(()=>(0,eval)('state.correctTotal=98;checkNarrative()'));
 await expect.poll(()=>page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(false);
 await expect(page.getByRole('dialog')).toContainText('A Chama dos Néfrons');
});
for(const width of [320,390,1100])test('aviso legível com texto a 200% em '+width,async({page})=>{
 await page.setViewportSize({width,height:700});const card=await abrir(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 for(const button of await card.locator('button').all()){const b=(await button.boundingBox())!;expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(700)}
 const region=card.getByRole('region');await region.focus();await page.keyboard.press('End');await expect.poll(()=>region.evaluate(e=>e.scrollHeight<=e.clientHeight||e.scrollTop>0)).toBe(true);
 expect(await card.locator('.mist').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 if(width<600)expect(await region.evaluate(e=>getComputedStyle(e).scrollbarWidth)).toBe('none');
 await page.keyboard.press('Escape');await expect(card).toHaveCount(0);expect(await page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);
});
