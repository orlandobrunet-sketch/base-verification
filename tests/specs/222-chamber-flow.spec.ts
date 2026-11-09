import {test,expect,type Page} from '@playwright/test';
import {openChamberCase} from '../helpers/chamber';
import {chamberCatalog} from '../helpers/chamber-catalog';
import AxeBuilder from '@axe-core/playwright';

test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
test.beforeEach(async({context,page})=>{
  expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
  await context.addInitScript(()=>Math.random=()=>0.5);
});
const aldric=chamberCatalog.find(c=>c.id==='aldric');
const council=aldric.acts.find((a:any)=>a.kind==='cards');
async function open(page:Page,width=1159,height=684){
  await page.setViewportSize({width,height});await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof(window as any).showAcidBaseMinigame==='function');
  await page.evaluate(()=>{document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).showAcidBaseMinigame();});
  if(await page.locator('#nqEntryCinema[open]').count())await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!(window as any).NQEntryCinema?.inspection.open);
  await expect(page.locator('#acidBaseOverlay')).toBeVisible();
}
async function reachCards(page:Page){
  await openChamberCase(page,'aldric');await page.locator('[data-ab-start-acts]').click();
  for(const act of aldric.acts.slice(0,3)){
    if(act.kind==='num'){await page.locator('#abNumInput').fill(String(act.target));await page.locator('[data-ab-num-submit]').click();}
    else await page.locator('.ab-option').filter({hasText:act.options.find((o:any)=>o.correct).label}).click();
    await page.locator('.ab-next').click();
  }
}
async function intactWidth(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}

for(const width of[1159,1440])test(`all council cards remain comparable and selections survive context/reflow at ${width}`,async({page})=>{
  await open(page,width,684);await reachCards(page);
  const cards=page.locator('[data-ab-card-id]');await expect(cards).toHaveCount(council.cards.length);
  await expect(page.locator('[data-ab-card-id]:visible')).toHaveCount(council.cards.length);
  await expect(page.getByRole('navigation',{name:'Carta',exact:true})).toHaveCount(0);
  const before=await cards.evaluateAll(ns=>ns.map(n=>({id:n.getAttribute('data-ab-card-id'),text:n.textContent})));
  const progress=await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'));
  await cards.first().click();await cards.last().click();await expect(page.locator('#abDdxCount')).toHaveText('2');
  const details=page.locator('.nql-case-context');
  const workspace=await page.locator('.nq-chamber-workspace').count();
  if(workspace){
    await details.locator('summary').click();await expect(details.locator('.ab-narrative')).toBeVisible();await expect(details.locator('.ab-gas-grid')).toBeVisible();
    await details.locator('summary').click();await expect(details).not.toHaveAttribute('open');
    await page.getByRole('tab',{name:'Orientações',exact:true}).click();await page.getByRole('tab',{name:'Cartas',exact:true}).click();
  }
  expect(await cards.evaluateAll(ns=>ns.map(n=>({id:n.getAttribute('data-ab-card-id'),text:n.textContent})))).toEqual(before);
  await page.setViewportSize({width:1280,height:760});await expect(page.locator('[data-ab-card-id]:visible')).toHaveCount(council.cards.length);
  await page.evaluate(()=>document.documentElement.style.fontSize='32px');await expect(page.locator('html')).toHaveCSS('font-size','32px');await expect(page.locator('#acidBaseOverlay')).not.toHaveClass(/nq-chamber-workspace/);await expect(page.locator('[data-ab-card-id]:visible')).toHaveCount(council.cards.length);await intactWidth(page);
  await page.evaluate(()=>document.documentElement.style.fontSize='16px');await expect(page.locator('html')).toHaveCSS('font-size','16px');await expect(page.locator('#abDdxCount')).toHaveText('2');
  if(workspace)await expect(page.locator('#acidBaseOverlay')).toHaveClass(/nq-chamber-workspace/);
  expect(await cards.evaluateAll(ns=>ns.map(n=>({id:n.getAttribute('data-ab-card-id'),text:n.textContent})))).toEqual(before);
  await expect(cards.first()).toHaveAttribute('aria-pressed','true');await expect(cards.last()).toHaveAttribute('aria-pressed','true');
  await cards.last().scrollIntoViewIfNeeded();await expect(cards.last()).toBeInViewport();
  await page.locator('[data-ab-cards-submit]').scrollIntoViewIfNeeded();await expect(page.locator('[data-ab-cards-submit]')).toBeInViewport({ratio:1});
  expect(await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'))).toBe(progress);await intactWidth(page);
  await page.locator('[data-ab-cards-submit]').click();await page.locator('.ab-next').click();
  await page.locator('[data-ab-pick]').first().click();await page.locator('.ab-next').click();
  await expect(page.locator('.ab-summary-stats strong').nth(1)).toHaveText('0×');
});

test('revealed council keeps all four outcomes and complete mechanisms in one collection',async({page})=>{
  await open(page);await reachCards(page);
  const correct=council.cards.filter((c:any)=>c.correct),wrong=council.cards.filter((c:any)=>!c.correct);
  await expect(page.locator('[data-ab-card-id]:visible')).toHaveCount(council.cards.length);
  for(const c of[correct[0],wrong[0]])await page.locator(`[data-ab-card-id="${c.id}"]`).click();
  await page.locator('[data-ab-cards-submit]').click();const tab=page.getByRole('tab',{name:'Cartas',exact:true});if(await tab.isVisible())await tab.click();
  await expect(page.locator('.ab-ddx-card.revealed:visible')).toHaveCount(council.cards.length);
  for(const status of['correct','missed','wrong','rejected'])expect(await page.locator('.ab-ddx-card.'+status).count()).toBeGreaterThan(0);
  await expect(page.locator('.ab-ddx-table .nql-reader-controls')).toHaveCount(0);
  for(const c of council.cards){const card=page.locator('.ab-ddx-card.revealed').filter({has:page.locator('.ab-ddx-card-title',{hasText:c.title})});
    const text=await page.evaluate(c=>{const decode=(html:string)=>{const e=document.createElement('div');e.innerHTML=html;return e.textContent||'';};return{mechanism:decode(c.reveal.mechanism),why:decode(c.reveal.why)};},c);
    await expect(card.locator('.ab-ddx-reveal-block').nth(0)).toContainText(text.mechanism);
    await expect(card.locator('.ab-ddx-reveal-block').nth(1)).toContainText(text.why);
  }
  for(const[font,width]of[[16,1159],[32,1159],[32,320]]){
    await page.setViewportSize({width,height:740});
    await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',font);await expect(page.locator('html')).toHaveCSS('font-size',font+'px');
    if(font===32)await expect(page.locator('#acidBaseOverlay')).not.toHaveClass(/nq-chamber-workspace/);
    const overlaps=await page.locator('.ab-ddx-card.revealed').evaluateAll(nodes=>nodes.map(n=>({title:n.querySelector('.ab-ddx-card-title')!.textContent,badgeBottom:n.querySelector('.ab-ddx-card-badge')!.getBoundingClientRect().bottom,titleTop:n.querySelector('.ab-ddx-card-title')!.getBoundingClientRect().top})).filter(x=>x.badgeBottom>x.titleTop-4));
    expect(overlaps,`badge/title spacing at ${font}px`).toEqual([]);
    const escapes=await page.locator('.ab-ddx-card.revealed').evaluateAll(nodes=>nodes.flatMap(n=>{const box=n.getBoundingClientRect(),table=n.parentElement!.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);const textOutside=[...range.getClientRects()].filter(r=>r.width&&r.height&&(r.right>box.right-3||r.left<box.left+3));return box.right>table.right+1||box.left<table.left-1||textOutside.length?[{title:n.querySelector('.ab-ddx-card-title')!.textContent,cardWidth:box.width,tableWidth:table.width,textOutside:textOutside.length}]:[];}));
    expect(escapes,`card/text boundaries at ${width}px and ${font}px font`).toEqual([]);
  }
  await page.locator('.ab-ddx-card.revealed').last().scrollIntoViewIfNeeded();await expect(page.locator('.ab-ddx-card.revealed').last()).toBeInViewport();
  await page.locator('.ab-next').scrollIntoViewIfNeeded();await expect(page.locator('.ab-next')).toBeInViewport({ratio:1});await intactWidth(page);
});

test('keyboard reaches context, every card and confirmation with accessible comparisons',async({page},info)=>{
  await open(page);await reachCards(page);
  const audit=async(label:string)=>{const a=await new AxeBuilder({page}).include('#acidBaseOverlay').analyze();await info.attach('axe-'+label,{body:JSON.stringify(a.violations,null,2),contentType:'application/json'});expect(a.violations.filter(v=>v.impact==='serious'||v.impact==='critical')).toEqual([]);};
  const details=page.locator('.nql-case-context');if(await details.count()){
    const summary=details.locator('summary');await summary.focus();await page.keyboard.press('Enter');await expect(details).toHaveAttribute('open','');await expect(details.locator('.ab-narrative')).toBeVisible();
    await page.keyboard.press('Space');await expect(details).not.toHaveAttribute('open');await expect(summary).toBeFocused();await expect(summary).toBeInViewport({ratio:1});
  }
  await audit('cards');const cards=page.locator('[data-ab-card-id]');await cards.first().focus();await page.keyboard.press('Space');await expect(cards.first()).toHaveAttribute('aria-pressed','true');
  for(let i=1;i<await cards.count();i++){await page.keyboard.press('Tab');await expect(cards.nth(i)).toBeFocused();await expect(cards.nth(i)).toBeInViewport();}
  await page.keyboard.press('Tab');await expect(page.locator('[data-ab-cards-clear]')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('[data-ab-cards-submit]')).toBeFocused();await expect(page.locator('[data-ab-cards-submit]')).toBeInViewport({ratio:1});
  await page.keyboard.press('Enter');await expect(page.locator('.ab-next')).toBeFocused();await expect(page.locator('.ab-next')).toBeInViewport({ratio:1});await audit('commentary');
  const tab=page.getByRole('tab',{name:'Cartas',exact:true});if(await tab.isVisible())await tab.click();await audit('revealed');await intactWidth(page);
});

test('council permits zero, one and all selections, clearing without a hidden minimum',async({page})=>{
  await open(page);await reachCards(page);const cards=page.locator('[data-ab-card-id]');
  await expect(page.locator('[data-ab-card-id]:visible')).toHaveCount(council.cards.length);
  await expect(page.locator('.ab-ddx-counter')).toHaveAttribute('role','status');await expect(page.locator('.ab-ddx-counter')).toHaveAttribute('aria-live','polite');await expect(page.locator('.ab-ddx-counter')).toHaveAttribute('aria-atomic','true');
  await expect(page.locator('#abDdxCount')).toHaveText('0');await cards.first().click();await expect(page.locator('#abDdxCount')).toHaveText('1');
  await cards.first().click();await expect(page.locator('#abDdxCount')).toHaveText('0');
  for(const card of await cards.all())await card.click();await expect(page.locator('#abDdxCount')).toHaveText(String(council.cards.length));
  await page.locator('[data-ab-cards-clear]').click();await expect(page.locator('#abDdxCount')).toHaveText('0');
  await expect(page.locator('[data-ab-cards-submit]')).toBeEnabled();await page.locator('[data-ab-cards-submit]').click();await expect(page.locator('.ab-next')).toBeVisible();
});

test('hub and opening are compact, catalogue-labelled and preview only neutral step formats',async({page})=>{
  await open(page,1440,900);const workspace=await page.locator('.nq-chamber-workspace').count();
  await expect(page.locator('#acidBaseOverlay .nq-entry-replay')).toHaveCount(0);
  if(workspace)await expect(page.getByRole('tab',{name:`Casos clínicos (${chamberCatalog.length})`,exact:true})).toBeVisible();
  await openChamberCase(page,'aldric');await expect(page.locator('.ab-intro-route li')).toHaveCount(aldric.acts.length);
  await expect(page.locator('.ab-intro-route')).toHaveText(/Decisão clínica.*Análise numérica.*Conselho de Diagnósticos/s);
  await expect(page.locator('.ab-intro-route :is(button,a)')).toHaveCount(0);
  await expect(page.locator('[data-ab-start-acts]')).toBeEnabled();await intactWidth(page);
  if(workspace){const gap=await page.locator('.ab-card').evaluate(e=>e.getBoundingClientRect().bottom-e.querySelector('[data-ab-start-acts]')!.getBoundingClientRect().bottom);expect(gap).toBeLessThan(60);}
});

test('opening preview lists real interaction formats without future clinical titles',async({page})=>{
  await open(page,1440,900);
  await page.evaluate(ids=>{localStorage.setItem('nq-acidbase-progress',JSON.stringify({completed:ids}));(window as any).showAcidBaseMinigame();},chamberCatalog.map(c=>c.id));
  for(const id of['kael','helena']){
    await openChamberCase(page,id);const authored=chamberCatalog.find(c=>c.id===id);
    const labels=authored.acts.map((a:any)=>a.kind==='cards'?'Conselho de Diagnósticos':a.kind==='num'?'Análise numérica':'Decisão clínica');
    await expect(page.locator('.ab-intro-route li')).toHaveCount(labels.length);
    await expect(page.locator('.ab-intro-route li strong')).toHaveText(labels);
    await expect(page.locator('.ab-intro-route')).not.toContainText(/aguda|crônica|Winter/i);
    await page.locator('[data-ab-close]').click();await page.evaluate(()=>(window as any).showAcidBaseMinigame());
  }
});
