import {test,expect,type Page} from '@playwright/test';
import {saveBase} from '../helpers/fixtures';
import AxeBuilder from '@axe-core/playwright';
import {setupPilotPage,startPilot,normalBytes} from '../helpers/pilot';

test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
async function open(page:Page,counts:unknown){
  const origin=new URL(test.info().project.use.baseURL as string||process.env.BASE_URL||'http://localhost:5500').origin;
  await page.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.routeWebSocket('**/*',s=>s.close());
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>(window as any)._loadTopics());
  const before=await page.evaluate(({save,counts})=>{
    localStorage.clear();localStorage.setItem('nefroquest-save',JSON.stringify(save));
    localStorage.setItem('nefroquest-error-reasons',JSON.stringify({counts,log:[{qid:'older-reflection',reason:'knowledge',ts:1}]}));
    (window as any).isAdminUser=()=>false;
    return localStorage.getItem('nefroquest-error-reasons');
  },{save:saveBase(),counts});
  await page.evaluate(()=>(window as any).openDashboard({tab:'skills'}));
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state','ready');
  return{panel:page.locator('.nqd-error-patterns'),before};
}

test('distribution includes every recorded reason and the complete cumulative denominator',async({page})=>{
  const{panel,before}=await open(page,{knowledge:40,between_two:25,confusion:15,anchoring:10,misread:6,guess:4});
  await expect(panel.locator('.nqd-error-count strong')).toHaveText(['40','25','15','10','6','4']);
  await expect(panel.locator('.nqd-error-total')).toHaveText('100');
  await expect(panel.locator('.nqd-error-share')).toHaveText(['40%','25%','15%','10%','6%','4%']);
  await expect(panel).toContainText('reflexões');await expect(panel).toContainText('opcional');
  const bars=await panel.locator('.nqd-error-bar').evaluateAll(nodes=>nodes.map(n=>n.firstElementChild!.getBoundingClientRect().width/n.getBoundingClientRect().width));
  expect(bars).toHaveLength(6);for(const[i,ratio]of[.4,.25,.15,.1,.06,.04].entries())expect(bars[i]).toBeCloseTo(ratio,2);
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
});

test('invalid values cannot become reflections or prevent the valid records from rendering',async({page})=>{
  const{panel,before}=await open(page,{knowledge:3,guess:'2',between_two:true,confusion:1.5,anchoring:-1,misread:{valueOf:1,toString:0}});
  await expect(panel.locator('.nqd-error-count strong')).toHaveText(['3','2']);await expect(panel.locator('.nqd-error-total')).toHaveText('5');
  await expect(panel).toContainText('Alguns valores não puderam ser exibidos');
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
});

test('unknown reason labels stay text and do not inherit object properties',async({page})=>{
  const label='<img src=x onerror="window.__reasonExecuted=true">';
  const{panel,before}=await open(page,{[label]:4,constructor:2});
  await expect(panel.locator('.nqd-error-ledger')).toContainText(label);await expect(panel.locator('.nqd-error-ledger')).toContainText('constructor');
  await expect(panel.locator('img')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).__reasonExecuted)).toBeUndefined();
  await expect(panel.locator('.nqd-error-total')).toHaveText('6');
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
});

for(const counts of[{},[],[3,2],null,{knowledge:0,misread:'0'}])test(`empty or malformed count containers are not a player score: ${JSON.stringify(counts)}`,async({page})=>{
  const{panel,before}=await open(page,counts);await expect(panel.locator('.nqd-error-count')).toHaveCount(0);
  await expect(panel.locator('.nqd-error-empty')).toBeVisible();await expect(panel.locator('.nqd-error-bar')).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
});

test('one reason and equal counts have faithful shares without choosing a dominant diagnosis',async({page})=>{
  for(const counts of[{knowledge:1},{knowledge:4,misread:4}]){
    const{panel,before}=await open(page,counts);const n=Object.keys(counts).length;
    await expect(panel.locator('.nqd-error-share')).toHaveText(n===1?['100%']:['50%','50%']);
    if(n===1)await expect(panel).toContainText('1 reflexão registrada');
    await expect(panel.locator('.nqd-error-count strong')).toHaveText(n===1?['1']:['4','4']);
    await expect(panel.locator('.nqd-error-ledger')).toContainText('Lacuna de conhecimento');
    if(n===2)await expect(panel.locator('.nqd-error-ledger')).toContainText('Erro de leitura');
    expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
  }
});

test('a small positive share is not rounded to zero or drawn as a larger count',async({page})=>{
  const{panel}=await open(page,{knowledge:1000000000,misread:1});
  await expect(panel.locator('.nqd-error-total')).toHaveText('1.000.000.001');
  await expect(panel.locator('.nqd-error-share').last()).toHaveText('menos de 0,1%');
  const width=await panel.locator('.nqd-error-bar > span').last().evaluate(e=>parseFloat((e as HTMLElement).style.width));
  expect(width).toBeGreaterThan(0);expect(width).toBeLessThan(.000001);
});

test('large valid cumulative counts retain an exact total instead of losing a record',async({page})=>{
  const{panel,before}=await open(page,{knowledge:Number.MAX_SAFE_INTEGER,misread:Number.MAX_SAFE_INTEGER-1});
  await expect(panel.locator('.nqd-error-total')).toHaveText('18.014.398.509.481.981');
  await expect(panel.locator('.nqd-error-count strong')).toHaveText(['9.007.199.254.740.991','9.007.199.254.740.990']);
  await expect(panel.locator('.nqd-error-share')).toHaveText(['50%','50%']);
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
});

test('narrow enlarged reflection keeps labels, counts and shares readable with accessible contrast',async({page})=>{
  await page.setViewportSize({width:320,height:740});const{panel,before}=await open(page,{knowledge:40,between_two:25,confusion:15,anchoring:10,misread:6,guess:4});
  await page.evaluate(()=>document.documentElement.style.fontSize='32px');await expect(page.locator('html')).toHaveCSS('font-size','32px');
  const minFont=await panel.locator('.nqd-error-count strong,.nqd-error-count small,.nqd-error-share,.nqd-error-context,.nqd-error-note').evaluateAll(nodes=>Math.min(...nodes.map(n=>parseFloat(getComputedStyle(n).fontSize))));expect(minFont).toBeGreaterThanOrEqual(24);
  const outside=await panel.evaluate(el=>{const p=el.getBoundingClientRect();return[...el.querySelectorAll('.nqd-error-ledger span,.nqd-error-context,.nqd-error-note')].filter(e=>!e.classList.contains('nqd-sr-only')).map(e=>e.getBoundingClientRect()).filter(r=>r.right>p.right||r.left<p.left).length;});expect(outside).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const audit=await new AxeBuilder({page}).include('.nqd-error-patterns').analyze();expect(audit.violations.filter(v=>v.impact==='serious'||v.impact==='critical')).toEqual([]);
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
});

test('large reflection counts remain inside the panel at 320 pixels and enlarged text',async({page})=>{
  await page.setViewportSize({width:320,height:740});const{panel,before}=await open(page,{knowledge:Number.MAX_SAFE_INTEGER,misread:Number.MAX_SAFE_INTEGER-1});
  await page.evaluate(()=>document.documentElement.style.fontSize='32px');await expect(page.locator('html')).toHaveCSS('font-size','32px');
  const escaped=await panel.evaluate(el=>{const panel=el.getBoundingClientRect();return[...el.querySelectorAll('.nqd-error-count strong,.nqd-error-total')].flatMap(n=>{const range=document.createRange();range.selectNodeContents(n);return[...range.getClientRects()].filter(r=>r.right>panel.right||r.left<panel.left);}).length;});
  expect(escaped).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(panel.locator('.nqd-error-total')).toHaveText('18.014.398.509.481.981');
  expect(await page.evaluate(()=>localStorage.getItem('nefroquest-error-reasons'))).toBe(before);
});

test('pilot reflection uses its own records and returns to normal counts without transferring data',async({page})=>{
  await setupPilotPage(page,true);const before=await normalBytes(page);await startPilot(page,'nephros');
  const raw=JSON.stringify({counts:{guess:3,knowledge:1},log:[]});
  await page.evaluate(raw=>(window as any).nqProgressStorage().setItem('nefroquest-error-reasons',raw),raw);
  await page.evaluate(()=>(window as any).openDashboard({tab:'skills'}));await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state','ready');
  const panel=page.locator('.nqd-error-patterns');await expect(panel.locator('.nqd-error-total')).toHaveText('4');await expect(panel.locator('.nqd-error-count strong')).toHaveText(['3','1']);await expect(panel).not.toContainText('normal-marker');
  expect(await normalBytes(page)).toEqual(before);expect(await page.evaluate(()=>(window as any).nqProgressStorage().getItem('nefroquest-error-reasons'))).toBe(raw);
  await page.evaluate(()=>(window as any).closeDashboard());await page.locator('#leavePilotBtn').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();await page.evaluate(()=>(window as any).openDashboard({tab:'skills'}));await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state','ready');
  await expect(panel.locator('.nqd-error-total')).toHaveText('2');await expect(panel).toContainText('normal-marker');await expect(panel.locator('.nqd-error-count strong')).toHaveText(['2']);
  expect(await normalBytes(page)).toEqual(before);
});
