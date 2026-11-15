import {test,expect,type Page} from '@playwright/test';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';
import {attachFailureEvidence} from '../helpers/failure-evidence';

// The two 30 ms focus callbacks have a new, causal ownership regression.
// This does not identify the cause of the historical evaluate timeout in193.
test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
type Audit={errors:string[];nonGET:string[];sockets:number};
const audits=new WeakMap<Page,Audit>();

test.beforeEach(async({page,baseURL})=>{
 const origin=new URL(baseURL!).origin,audit:Audit={errors:[],nonGET:[],sockets:0};audits.set(page,audit);
 page.on('pageerror',error=>audit.errors.push(error.message));
 await page.route('**/*',route=>{
  const request=route.request();
  if(request.method()!=='GET'){audit.nonGET.push(request.method());return route.abort();}
  return new URL(request.url()).origin===origin?route.continue():route.abort();
 });
 await page.context().routeWebSocket('**/*',socket=>{audit.sockets++;socket.close();});
 await routeTechnicalQuestionBank(page,[{qid:'chamber-delayed-focus-technical',q:'Marcador técnico de interface.',
  opts:['A','B','C','D'],ans:0,exp:'Fixture técnica, sem questão clínica.',cat:'geral'}]);
 await page.goto('/jogar/',{waitUntil:'load'});
 await page.locator('[data-portal-route="guest"]').click();
 await page.locator('[data-atrium-route="modes"]').click();
 await page.locator('[data-mode-route="balance"]:visible').click();
 const cinema=page.locator('#nqEntryCinema[open]');
 if(await cinema.count()){await page.keyboard.press('Escape');await expect(cinema).toHaveCount(0);}
 await page.locator('[data-ab-next]:visible').first().click();
 await page.locator('[data-ab-start-acts]').click();
 await expect(page.locator('.ab-option').first()).toBeVisible();
 // Pause before the action, with no in-flight Chamber focus callback.
 await page.clock.install({time:new Date('2026-11-15T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-11-15T12:00:01Z'));
 expect(await page.evaluate(()=>(window as any).authUser)).toBeNull();
});

test.afterEach(async({page},info)=>{
 if(info.status!==info.expectedStatus)await attachFailureEvidence(page,info);
 const audit=audits.get(page);
 await info.attach('chamber-delayed-focus-audit',{contentType:'application/json',body:JSON.stringify(audit)});
 expect(audit).toEqual({errors:[],nonGET:[],sockets:0});
});

type Phase='próximo botão'|'campo numérico';
async function reachBoundary(page:Page,phase:Phase){
 // Any authored option invokes the real answer handler; no clinical answer is inferred.
 await page.locator('.ab-option').first().click();
 await expect(page.locator('.ab-next')).toBeVisible();
 if(phase==='campo numérico'){
  await page.clock.runFor(30);
  await page.locator('.ab-next').click();
  await expect(page.locator('#abNumInput')).toBeVisible();
 }
}
const preferences=(page:Page)=>page.locator('#acidBaseOverlay [data-action="toggleProfilePopup"]');

for(const phase of ['próximo botão','campo numérico'] as const){
 test(`${phase}: o fluxo normal ainda recebe foco após 30 ms`,async({page})=>{
  await reachBoundary(page,phase);
  if(phase==='próximo botão')await expect(page.locator('.ab-prompt')).toBeFocused();
  else expect(await page.evaluate(()=>document.activeElement===document.body)).toBe(true);
  await page.clock.runFor(30);
  await expect(page.locator(phase==='próximo botão'?'.ab-next':'#abNumInput')).toBeFocused();
 });

 test(`${phase}: Preferências conservam a escolha de foco do usuário`,async({page})=>{
  await reachBoundary(page,phase);
  await preferences(page).click();
  await expect(page.locator('#mobileProfilePopup')).toHaveClass(/open/);
  await expect(preferences(page)).toBeFocused();
  await page.clock.runFor(30);
  await expect(page.locator('#mobileProfilePopup')).toHaveClass(/open/);
  await expect(preferences(page)).toBeFocused();
  await expect(preferences(page)).toHaveAttribute('aria-expanded','true');
 });

 test(`${phase}: uma área de leitura escolhida conserva foco e rolagem`,async({page})=>{
  await reachBoundary(page,phase);
  if(phase==='campo numérico')await page.locator('[data-ab-grimoire]').click();
  const reading=page.locator(phase==='próximo botão'?'#abFeedback .ab-feedback-body':'#abGrimoirePanel .ab-grimoire-body');
  await expect(reading).toBeVisible();
  // A technical focusability marker exercises the actual reading node. It changes
  // no content, controller, layout, value or authored accessibility in the product.
  await reading.evaluate(node=>{(node as HTMLElement).tabIndex=0;(node as HTMLElement).focus();});
  await expect(reading).toBeFocused();
  const before=await page.evaluate(()=>({x:scrollX,y:scrollY}));
  await page.clock.runFor(30);
  await expect(reading).toBeFocused();
  expect(await page.evaluate(()=>({x:scrollX,y:scrollY}))).toEqual(before);
 });

 test(`${phase}: sair antes do prazo impede foco da página removida`,async({page})=>{
  await reachBoundary(page,phase);
  await page.locator('[data-ab-close]').click();
  await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
  const before=await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,cls:document.activeElement?.className}));
  await page.clock.runFor(30);
  expect(await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,cls:document.activeElement?.className}))).toEqual(before);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
 });
}

test('avançar antes do prazo descarta o botão antigo e respeita o novo campo escolhido',async({page})=>{
 await reachBoundary(page,'próximo botão');
 const oldNext=await page.locator('.ab-next').elementHandle();
 await page.locator('.ab-next').click();
 const input=page.locator('#abNumInput');await input.click();
 await expect(input).toBeFocused();
 await page.clock.runFor(30);
 expect(await oldNext!.evaluate(node=>node.isConnected)).toBe(false);
 await expect(input).toBeFocused();
});

test('trocar o ato antes do prazo descarta o campo antigo e preserva Preferências',async({page})=>{
 await reachBoundary(page,'campo numérico');
 const oldInput=await page.locator('#abNumInput').elementHandle();
 await page.locator('[data-ab-goto="0"]').click();
 await preferences(page).click();await expect(page.locator('#mobileProfilePopup')).toHaveClass(/open/);
 await page.clock.runFor(30);
 expect(await oldInput!.evaluate(node=>node.isConnected)).toBe(false);
 await expect(preferences(page)).toBeFocused();
 await expect(page.locator('#mobileProfilePopup')).toHaveClass(/open/);
});
