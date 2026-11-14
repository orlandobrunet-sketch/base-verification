// Native Guest routes and local progress; no product/controller, RNG or clock replacement.
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'no-preference'}});
const auditByPage=new WeakMap();
const progressKeys=['nq-acidbase-progress','nefroquest-save-v7','nefroquest-stats','nefroquest-detailed-stats','nefroquest-sr-data','unlockedArticles','nq-unlocked-refs'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const saved=page=>page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),progressKeys);
async function contextHash(page){
 return hash(await page.locator('.ab-context').evaluate(node=>({
  title:node.querySelector('.ab-title')?.textContent,story:node.querySelector('.ab-narrative')?.textContent,
  rows:[...node.querySelectorAll('.ab-gas')].map(row=>[row.querySelector('span')?.textContent,row.querySelector('strong')?.textContent,row.querySelector('em')?.textContent||''])
 })));
}
async function frames(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function openHub(page){
 await page.locator('[data-atrium-route="modes"]').click();
 await page.locator('[data-mode-route="balance"]:visible').click();
 const fonts=await page.evaluate(async()=>{
  const body=await document.fonts.load('400 16px "Source Sans 3"');
  const heading=await document.fonts.load('600 24px "Alegreya"');
  await document.fonts.ready;
  const loaded=faces=>faces.filter(face=>face.status==='loaded').map(face=>face.family.replaceAll('"',''));
  return {body:loaded(body),heading:loaded(heading)};
 });
 expect(fonts.body).toContain('Source Sans 3');expect(fonts.heading).toContain('Alegreya');await frames(page);
 if(await page.locator('#nqEntryCinema[open]').count())await page.keyboard.press('Escape');
 await expect(page.locator('#acidBaseOverlay')).toBeVisible();
}
async function openCollectionCase(page,id){
 const tab=page.getByRole('tab',{name:/^Casos clínicos \(\d+\)$/});
 if(await tab.isVisible())await tab.click();
 const target=page.locator('[data-ab-case="'+id+'"]');
 const paging=page.getByRole('navigation',{name:'Página',exact:true});
 if(await paging.count()){
  for(let i=0;i<5&&!await target.isVisible();i++){
   const back=paging.getByRole('button',{name:'Anterior',exact:true});if(await back.isEnabled())await back.click();else break;
  }
  for(let i=0;i<5&&!await target.isVisible();i++){
   const next=paging.getByRole('button',{name:'Próxima',exact:true});if(await next.isEnabled())await next.click();else break;
  }
 }
 await expect(target).toBeVisible();await expect(target).toBeEnabled();
 const memory={page:await paging.count()?await paging.locator('.nql-page-status').textContent():null,
  caseIndex:await target.evaluate(node=>[...document.querySelectorAll('#acidBaseOverlay .ab-case')].indexOf(node))};
 await target.click();await expect(page.locator('.ab-body--intro')).toBeVisible();return memory;
}
async function sourceIdentity(page,original){
 return page.evaluate(original=>{
  const root=document.getElementById('acidBaseOverlay'),current=root.querySelector('[data-ab-case-scene]');
  return {count:root.querySelectorAll('[data-ab-case-scene]').length,same:current===original,
   connected:original.isConnected,inRoot:root.contains(original),
   src:current?.querySelector('img')?.getAttribute('src')||null,
   width:current?.querySelector('img')?.naturalWidth||0,height:current?.querySelector('img')?.naturalHeight||0,
   rows:root.querySelectorAll('.ab-context .ab-gas').length};
 },original);
}
async function intactScene(page,scene,source,context){
 const observed=await sourceIdentity(page,scene);
 expect(observed.count).toBe(1);expect(observed.same).toBe(true);expect(observed.connected).toBe(true);expect(observed.inRoot).toBe(true);
 expect(observed.src).toBe(source);expect(observed.width).toBe(1280);expect(observed.height).toBe(720);expect(observed.rows).toBe(8);
 expect(await contextHash(page)).toBe(context);
}
async function scale(page,width,font){
 await page.setViewportSize({width,height:900});
 await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',font);
 await page.waitForFunction(font=>Math.abs(parseFloat(getComputedStyle(document.documentElement).fontSize)-font)<.01,font);
 await page.waitForFunction(()=>{const root=document.getElementById('acidBaseOverlay');
  const eligible=matchMedia('(min-width:961px) and (pointer:fine)').matches&&innerHeight>=600&&parseFloat(getComputedStyle(document.documentElement).fontSize)<=20;
  return root&&root.classList.contains('nq-chamber-workspace')===eligible;});
 await frames(page);
}
async function returnedToCase(page,id,memory){
 const target=page.locator('[data-ab-case="'+id+'"]');await expect(target).toBeFocused();await expect(target).toBeInViewport({ratio:1});
 const workspace=await page.locator('#acidBaseOverlay').evaluate(n=>n.classList.contains('nq-chamber-workspace'));
 if(workspace){
  await expect(page.getByRole('tab',{name:/^Casos clínicos \(\d+\)$/})).toHaveAttribute('aria-selected','true');
  const status=page.getByRole('navigation',{name:'Página',exact:true}).locator('.nql-page-status');
  if(memory.page)await expect(status).toHaveText(memory.page);
  else await expect(status).toContainText('Página '+(Math.floor(memory.caseIndex/4)+1)+' de');
 }
 expect(await target.evaluate(n=>{const r=n.getBoundingClientRect();return r.width>=44&&r.height>=44&&n.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));})).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
test.beforeEach(async({page,context,baseURL})=>{
 const origin=new URL(baseURL).origin;expect(['localhost','127.0.0.1']).toContain(new URL(origin).hostname);
 const initial=await context.storageState();expect(initial.cookies).toEqual([]);expect(initial.origins).toEqual([]);
 const audit={nonGET:[],responses:[],sockets:0,errors:[],externalScriptResponses:0};auditByPage.set(page,audit);
 page.on('pageerror',e=>audit.errors.push(e.message));page.on('response',r=>{if(r.request().method()!=='GET')audit.responses.push(r.request().method());
  if(r.request().resourceType()==='script'&&new URL(r.url()).origin!==origin)audit.externalScriptResponses++;});
 await context.route('**/*',route=>{const r=route.request(),url=new URL(r.url());if(r.method()!=='GET')audit.nonGET.push(r.method());
  const font=['https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(url.origin)&&['font','stylesheet'].includes(r.resourceType());
  return r.method()==='GET'&&(url.origin===origin||font)?route.continue():route.abort();});
 await context.routeWebSocket('**/*',socket=>{audit.sockets++;socket.close();});
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.locator('[data-portal-route="guest"]').click();await expect(page.locator('#welcomeScreen')).toBeVisible();
 expect(await page.evaluate(()=>window.authUser)).toBeNull();
});
test.afterEach(async({page},info)=>{
 const audit=auditByPage.get(page);await info.attach('native-guards',{contentType:'application/json',body:JSON.stringify(audit)});
 expect(audit.nonGET).toEqual([]);expect(audit.responses).toEqual([]);expect(audit.sockets).toBe(0);expect(audit.errors).toEqual([]);
 expect(audit.externalScriptResponses).toBe(0);
 expect(await page.evaluate(()=>window.authUser)).toBeNull();
});
test('scene identity, source and opaque eight-value context survive answer, next act and viewport changes',async({page},info)=>{
 await openHub(page);await openCollectionCase(page,'aldric');
 const scene=await page.locator('[data-ab-case-scene="aldric"]').elementHandle();
 await page.locator('[data-ab-case-scene="aldric"] img').evaluate(image=>image.decode());
 const source=await page.locator('[data-ab-case-scene="aldric"] img').getAttribute('src'),context=await contextHash(page),before=await saved(page);
 await page.locator('[data-ab-start-acts]').click();await intactScene(page,scene,source,context);
 await page.locator('.ab-option').first().click();await expect(page.locator('#abFeedback')).toBeVisible();await intactScene(page,scene,source,context);
 await page.locator('.ab-next').click();await expect(page.locator('#abNumInput')).toBeEnabled();await intactScene(page,scene,source,context);
 for(const [width,font]of [[320,32],[1440,16],[390,16]]){await scale(page,width,font);await intactScene(page,scene,source,context);}
 expect(await saved(page)).toEqual(before);
 await info.attach('scene-invariants',{contentType:'application/json',body:JSON.stringify({source,contextSHA256:context,progressPreserved:true})});
});
const previous=['aldric','mara','theron','vance','kael','vorgath','selene','edrin'];
async function returningFixture(page){
 // Existing local Guest progress schema; no account, premium or authoring mutation.
 await page.evaluate(completed=>localStorage.setItem('nq-acidbase-progress',JSON.stringify({completed})),previous);
 await openHub(page);
}
test('foco da aba e do paginador retorna a um controle visível após fallback',async({page,isMobile},info)=>{
 test.skip(isMobile,'Generated desktop tabs require a fine pointer. Native mobile return is covered separately.');
 await returningFixture(page);
 const report=[];
 for(const kind of ['tab','pager']){
  const tab=page.getByRole('tab',{name:/^Casos clínicos \(\d+\)$/});await tab.click();
  const control=kind==='tab'?tab:page.getByRole('navigation',{name:'Página',exact:true}).locator('button:not(:disabled)').first();
  await control.focus();await expect(control).toBeFocused();
  await scale(page,390,32);await scale(page,1440,16);
  report.push(await page.locator('#acidBaseOverlay').evaluate((root,kind)=>{
   const active=document.activeElement,rect=active?.getBoundingClientRect();
   return {kind,activeTag:active?.tagName,activeClass:active?.className,
    inside:!!active&&root.contains(active),hidden:!!active?.closest('[hidden], [inert], .nql-hidden'),
    rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null};
  },kind));
  await expect.soft(tab).toBeFocused();await expect.soft(tab).toBeInViewport({ratio:1});
 }
 await info.attach('generated-control-focus',{contentType:'application/json',body:JSON.stringify(report)});
});
for(const motion of ['no-preference','reduce'] as const)test.describe('retorno com movimento '+motion,()=>{
 test.use({contextOptions:{reducedMotion:motion}});
 test('introdução retorna à coleção/página/caso após reflow e ignora controle de overlay fechado',async({page})=>{
  await returningFixture(page);const memory=await openCollectionCase(page,'kael'),before=await saved(page);
  const back=page.locator('.ab-body--intro [data-ab-intro-back]');await expect(back).toHaveAccessibleName('Voltar à Câmara');
  const staleBack=await back.elementHandle();await scale(page,320,32);
  expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(motion==='reduce');
  await back.click();await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-ab-tela','hub');
  await returnedToCase(page,'kael',memory);expect(await saved(page)).toEqual(before);
  await scale(page,1440,16);await returnedToCase(page,'kael',memory);
  await page.locator('[data-ab-close]').click();await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
  await openHub(page);const newRoot=await page.locator('#acidBaseOverlay').elementHandle(),after=await saved(page);
  await staleBack.evaluate(button=>button.click());
  expect(await page.locator('#acidBaseOverlay').evaluate((n,old)=>n===old,newRoot)).toBe(true);
  await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-ab-tela','hub');expect(await saved(page)).toEqual(after);
 });
 test('entrada pelo próximo atendimento retorna à visão geral e ao CTA atualizado',async({page})=>{
  await openHub(page);const before=await saved(page);await page.locator('[data-ab-next="aldric"]').click();
  await expect(page.locator('.ab-body--intro')).toBeVisible();await scale(page,320,32);
  await page.getByRole('button',{name:'Voltar à Câmara',exact:true}).click();
  await expect(page.locator('[data-ab-next="aldric"]')).toBeFocused();
  await expect(page.locator('[data-ab-next="aldric"]')).toBeInViewport({ratio:1});
  await scale(page,1440,16);
  const overview=page.getByRole('tab',{name:'Visão geral',exact:true});
  if(await overview.isVisible())await expect(overview).toHaveAttribute('aria-selected','true');
  await expect(page.locator('[data-ab-next="aldric"]')).toBeFocused();expect(await saved(page)).toEqual(before);
 });
});
async function completeWithoutInterpreting(page){
 await page.locator('[data-ab-start-acts]').click();
 for(let step=0;step<10&&!await page.locator('.ab-summary-view').count();step++){
  if(await page.locator('.ab-option:not(:disabled)').count())await page.locator('.ab-option:not(:disabled)').first().click();
  else if(await page.locator('#abNumInput:not(:disabled)').count()){await page.locator('#abNumInput').fill('0');await page.locator('[data-ab-num-submit]').click();}
  else{await page.locator('[data-ab-card-id]').first().click();await page.locator('[data-ab-cards-submit]').click();}
  await page.locator('.ab-next').click();
 }
 await expect(page.locator('.ab-summary-view')).toBeVisible();
}
test('result return records a new completion and unlock while preserving the originating collection and page',async({page})=>{
 await returningFixture(page);
 expect(JSON.parse((await saved(page))[0]).completed).not.toContain('liora');
 const memory=await openCollectionCase(page,'liora');
 await completeWithoutInterpreting(page);
 const completed=await saved(page);expect(JSON.parse(completed[0]).completed).toEqual([...previous,'liora']);
 await page.locator('[data-ab-back]').click();
 await returnedToCase(page,'liora',memory);expect(await saved(page)).toEqual(completed);
 await expect(page.locator('[data-ab-case="liora"]')).toHaveClass(/ab-case-done/);
 await expect(page.locator('.ab-hub-progress strong')).toHaveText('9');
 await expect(page.locator('[data-ab-case="borius"]')).toBeEnabled();
 await expect(page.locator('[data-ab-case="isolde"]')).toHaveCount(0);
});
