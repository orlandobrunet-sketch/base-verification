import {test,expect,type Page} from '@playwright/test';
import {openChamberCase} from '../helpers/chamber';
import {chamberCatalog} from '../helpers/chamber-catalog';
test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
async function lastAnswer(page:Page,setup:()=>Promise<void>){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await setup();
 await page.addInitScript(()=>{Math.random=()=>.5;window.requestIdleCallback=()=>1;});
 await page.goto('/jogar/',{waitUntil:'load'});
 await page.evaluate(()=>{document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).showAcidBaseMinigame();});
 const cinema=page.locator('#nqEntryCinema[open]');if(await cinema.count())await page.keyboard.press('Escape');
 await openChamberCase(page,'aldric');await page.locator('[data-ab-start-acts]').click();
 const patient=chamberCatalog.find(p=>p.id==='aldric');
 for(let i=0;i<5;i++){
  const act=patient.acts[i];
  if(act.kind==='mc')await page.locator('.ab-option').filter({hasText:act.options.find((o:any)=>o.correct).label}).click();
  else if(act.kind==='num'){await page.locator('#abNumInput').fill(String(act.target));await page.locator('[data-ab-num-submit]').click();}
  else{
   const correct=new Set(act.cards.filter((c:any)=>c.correct).map((c:any)=>c.id)),nav=page.getByRole('navigation',{name:'Carta',exact:true});
   for(let n=0;n<act.cards.length;n++){
    for(const card of await page.locator('[data-ab-card-id]:visible').all())if(correct.has(await card.getAttribute('data-ab-card-id')))await card.click();
    if(!await nav.isVisible()||!await nav.getByRole('button',{name:'Próxima',exact:true}).isEnabled())break;
    await nav.getByRole('button',{name:'Próxima',exact:true}).click();
   }
   await page.locator('[data-ab-cards-submit]').click();
  }
  await expect(page.locator('.ab-next')).toBeVisible();if(i<4)await page.locator('.ab-next').click();
 }
}
test('failed source load can recover inside summary without replay or duplicate completion',async({page})=>{
 let fail=true;
 await lastAnswer(page,()=>page.route('**/data/refs.js',r=>fail?r.abort():r.continue()));
 await page.locator('.ab-next').click();
 await expect(page.locator('.ab-summary-title')).toBeVisible();
 const refsTab=page.getByRole('tab',{name:'Referências',exact:true});if(await refsTab.isVisible())await refsTab.click();
 await expect(page.getByText('Fontes clínicas indisponíveis nesta conexão')).toBeVisible();
 fail=false;await page.getByRole('button',{name:'Tentar carregar fontes novamente'}).click();
 await expect(page.locator('[data-ab-source-id="bicaricu2_2025"] a')).toHaveAttribute('href','https://jamanetwork.com/journals/jama/fullarticle/2840824');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nq-acidbase-progress')||'{}').completed.filter((id:string)=>id==='aldric').length)).toBe(1);
});
test('returning to a prior act while sources load keeps that act when the response arrives',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);let requested=false;
 await lastAnswer(page,()=>page.route('**/data/refs.js',async r=>{requested=true;await gate;await r.continue();}));
 await page.locator('.ab-next').click();await expect.poll(()=>requested).toBe(true);
 await page.locator('[data-ab-goto="0"]').click();
 release();await page.waitForFunction("typeof refsDB==='object'");
 await expect(page.locator('.ab-summary-title')).toHaveCount(0);
 await expect(page.locator('.ab-dot.current').first()).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nq-acidbase-progress')||'{}').completed||[])).not.toContain('aldric');
});
test('closing during source load cannot save or reopen the abandoned case',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);let requested=false;
 await lastAnswer(page,()=>page.route('**/data/refs.js',async r=>{requested=true;await gate;await r.continue();}));
 await page.locator('.ab-next').click();await expect.poll(()=>requested).toBe(true);
 await page.locator('[data-ab-close]').click();release();
 await page.waitForFunction("typeof refsDB==='object'");
 await expect(page.locator('#acidBaseOverlay')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nq-acidbase-progress')||'{}').completed||[])).not.toContain('aldric');
});
test('a never-settling reference request cannot block completed clinical work indefinitely',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);let requested=false;
 await lastAnswer(page,()=>page.route('**/data/refs.js',async r=>{requested=true;await gate;await r.continue();}));
 await page.clock.install();
 try{
  await page.locator('.ab-next').click();await expect.poll(()=>requested).toBe(true);
  await page.clock.fastForward(6000);
  await expect(page.locator('.ab-summary-title')).toBeVisible();
  const refsTab=page.getByRole('tab',{name:'Referências',exact:true});if(await refsTab.isVisible())await refsTab.click();
  await expect(page.getByRole('button',{name:'Tentar carregar fontes novamente'})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nq-acidbase-progress')||'{}').completed.filter((id:string)=>id==='aldric').length)).toBe(1);
 }finally{release();}
});
test('an unrelated stalled article request does not block available clinical references',async({page})=>{
 let release!:()=>void,releaseRefs!:()=>void;const gate=new Promise<void>(r=>release=r),refsGate=new Promise<void>(r=>releaseRefs=r);
 let refsRequests=0,articleRequested=false;
 await lastAnswer(page,async()=>{
  await page.route('**/data/refs.js',async r=>{refsRequests++;await refsGate;await r.continue();});
  await page.route('**/data/articles.js',async r=>{articleRequested=true;await gate;await r.continue();});
 });
 await page.evaluate(()=>{(window as any).__sharedGrimoire=(window as any).carregarDadosGrimorio().catch(()=>{});});
 await expect.poll(()=>articleRequested&&refsRequests===1).toBe(true);
 await page.clock.install();
 try{
  await page.locator('.ab-next').click();
  releaseRefs();await page.waitForFunction("typeof refsDB==='object'");
  await expect(page.locator('.ab-summary-title')).toBeVisible();
  await expect(page.locator('[data-ab-source-id="bicaricu2_2025"] a')).toHaveAttribute('href','https://jamanetwork.com/journals/jama/fullarticle/2840824');
  expect(refsRequests).toBe(1);
 }finally{releaseRefs();release();}
});
