import {test, expect, type Page} from '@playwright/test';
import {saveBase} from '../helpers/fixtures';

test.use({serviceWorkers:'block'});
test.beforeEach(async ({context,baseURL})=>{
 const origin=new URL(baseURL!).origin;
 await context.route('**/*',r=>new URL(r.request().url()).origin===origin && r.request().method()==='GET' ? r.continue() : r.abort());
 await context.routeWebSocket('**/*',s=>s.close());
});
const keys=['nefroquest-save','nefroquest-save-v7','nefroquest-achievements','nefroquest-badge-history','nefroquest-detailed-stats'];
const snapshot=(page:Page)=>page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys);
async function open(page:Page, mode:'none'|'few'|'all'='few'){
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>(window as any)._loadTopics());
 await page.evaluate(({save,mode})=>{
  localStorage.clear();localStorage.setItem('nefroquest-save',JSON.stringify(save));
  const all=(0,eval)('ACHIEVEMENTS_LIST').map((a:any)=>a.id);
  localStorage.setItem('nefroquest-achievements',JSON.stringify(mode==='all'?all:mode==='few'?['century_club','arqui_nefromante_slayer']:[]));
  localStorage.setItem('nefroquest-badge-history',JSON.stringify(mode==='none'?{}:mode==='all'?Object.fromEntries([1,2,3,4,5].map(id=>[id,{jornada:1}])):{1:{jornada:1},2:{jornada:2}}));
  localStorage.setItem('nefroquest-detailed-stats',JSON.stringify({totalQuestions:99,totalCorrect:0,totalWrong:99,byTopic:{},byCategory:{},questionHistory:[],dailyActivity:{},bestStreak:0}));
  (window as any).isAdminUser=()=>false;document.getElementById('landingScreen')?.classList.add('hidden');
  return (window as any).openDashboard();
 },{save:saveBase({correctTotal:mode==='none'?0:mode==='all'?100:47}),mode});
 await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state','ready');
 await page.getByRole('tab',{name:'Conquistas',exact:true}).click();
 await page.evaluate(()=>document.fonts.ready);
 return page.locator('#nqdPane-achievements');
}

for(const [mode,count,shelf] of [['none',0,0],['few',2,4],['all',12,17]] as const){
 test(`${mode}: vitrine e contagem seguem aquisições reais sem gravar ou celebrar`,async({page})=>{
  const pane=await open(page,mode),before=await snapshot(page);
  await expect(pane.locator('.nqd-achievement')).toHaveCount(12);
  await expect(pane.locator('.nqd-achievement.is-unlocked')).toHaveCount(count);
  await expect(pane.locator('.nqd-trophy-showcase li')).toHaveCount(shelf);
  await expect(pane.locator('.nqd-achievement-summary')).toHaveAttribute('aria-label',`${count} de 12 conquistas especiais conquistadas`);
  if(mode==='none')await expect(pane.locator('.nqd-trophy-empty')).toBeVisible();
  const requirements=await page.evaluate(()=>(0,eval)('ACHIEVEMENTS_LIST').map((a:any)=>({id:a.id,description:a.description})));
  for(const item of requirements)await expect(pane.locator(`[data-achievement-id="${item.id}"] .nqd-achievement-copy`)).toHaveText(item.description);
  await pane.getByRole('button',{name:'Conquistadas',exact:true}).click();await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(count);
  await pane.getByRole('button',{name:'A conquistar',exact:true}).click();await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(12-count);
  await pane.getByRole('button',{name:'Todas',exact:true}).click();await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(12);
  await page.getByRole('tab',{name:'Visão geral',exact:true}).click();await page.getByRole('tab',{name:'Conquistas',exact:true}).click();
  expect(await snapshot(page)).toEqual(before);await expect(page.locator('#nqAchievementCelebrations')).toHaveCount(0);
 });
}

test('categoria, lupa e teclado preservam requisito, bloqueio e foco',async({page})=>{
 const pane=await open(page),before=await snapshot(page);
 await pane.locator('#nqdAchievementCategory').selectOption('Prática clínica');
 await expect(pane.locator('.nqd-achievement:visible')).toHaveCount(5);
 expect(await pane.locator('.nqd-achievement:visible').evaluateAll(cards=>cards.every(c=>(c as HTMLElement).dataset.achievementCategory==='Prática clínica'))).toBe(true);
 const card=pane.locator('.nqd-achievement:visible').first(),art=card.locator('button');
 const title=await card.locator('h3').innerText(),requirement=await card.locator('.nqd-achievement-copy').innerText();
 await art.focus();await page.keyboard.press('Enter');
 const dialog=page.locator('dialog.nq-ach-detail');await expect(dialog).toBeVisible();await expect(dialog).toHaveAttribute('data-acquired','false');
 await expect(dialog.getByRole('heading')).toHaveText(title);await expect(dialog.locator('#nqAchievementArtworkRequirement')).toHaveText(requirement);
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(art).toBeFocused();
 expect(await art.evaluate(el=>getComputedStyle(el).outlineStyle==='solid'&&parseFloat(getComputedStyle(el).outlineWidth)>=2)).toBe(true);
 expect(await snapshot(page)).toEqual(before);
});

test('emblemas sem placa CSS e texto200% permanecem íntegros sem overflow',async({page})=>{
 const pane=await open(page);
 expect(await pane.locator('.nqd-badge-art').evaluateAll(els=>els.every(el=>getComputedStyle(el).backgroundColor==='rgba(0, 0, 0, 0)'))).toBe(true);
 const first=pane.locator('.nqd-achievement').first();await first.scrollIntoViewIfNeeded();
 const original=await first.boundingBox();await first.hover();
 await expect.poll(async()=>Math.abs((await first.boundingBox())!.width-original!.width)).toBeLessThan(1);
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
 await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 const violations=await pane.evaluate(root=>{
  const bad:string[]=[];const main=root.closest('#nqDashboard')!.querySelector('.nqd-main')!;
  if(main.scrollWidth>main.clientWidth+1)bad.push('horizontal');
  for(const el of root.querySelectorAll('button,select,h1,h2,h3,.nqd-achievement-copy')){
   const b=el.getBoundingClientRect();if(!b.width)continue;
   if(el.scrollWidth>el.clientWidth+1)bad.push(el.className||el.tagName);
   if(el.matches('button,select')&&b.height<44)bad.push('target');
  }return bad;
 });expect(violations).toEqual([]);
 expect(await pane.locator('.nqd-achievement').first().evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
});

test('condição real do Clube100 celebra uma vez após registro e não ao abrir',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await open(page,'none');await expect(page.locator('#nqAchievementCelebrations')).toHaveCount(0);
 await page.evaluate(()=>{
  const stats=JSON.parse(localStorage.getItem('nefroquest-detailed-stats')!);stats.totalQuestions=100;
  localStorage.setItem('nefroquest-detailed-stats',JSON.stringify(stats));(window as any).checkAchievements();
 });
 await expect(page.locator('.nq-ach-celebration')).toHaveCount(1);
 await expect(page.locator('.ach-notification-name')).toHaveText('Clube dos 100');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nefroquest-achievements')!))).toEqual(['century_club']);
 await page.evaluate(()=>(window as any).checkAchievements());await expect(page.locator('.nq-ach-celebration')).toHaveCount(1);
 expect(await page.locator('.nq-ach-celebration').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('nota administrativa permanece completa no detalhe sem contar acesso como aquisição',async({page})=>{
 await open(page,'none');
 await page.evaluate(()=>{(window as any).closeDashboard();(window as any).isAdminUser=()=>true;return (window as any).openDashboard();});
 await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state','ready');
 await page.getByRole('tab',{name:'Conquistas',exact:true}).click();
 const card=page.locator('[data-achievement-id="grimoire_master"]');
 await expect(card).toHaveClass(/is-locked/);
 await expect(card.locator('.nqd-achievement-progress-note')).toHaveText('Condição e observações disponíveis na lupa.');
 await card.locator('button').click();
 await expect(page.locator('#nqAchievementArtworkRequirement')).toContainText('O acesso administrativo exibe o acervo, mas não registra desbloqueios do perfil.');
 await expect(page.locator('dialog.nq-ach-detail')).toHaveAttribute('data-acquired','false');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nefroquest-achievements')!))).toEqual([]);
});
