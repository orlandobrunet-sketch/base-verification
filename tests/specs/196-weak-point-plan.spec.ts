import {test,expect,type Page} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {medirContraste} from '../helpers/contraste';
test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
const ranked={drc:{correct:5,total:10},lra:{correct:6,total:10},dialise:{correct:7,total:10},transplante:{correct:9,total:10}};
async function prepare(page:Page,categories=ranked){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page);await page.waitForLoadState('load');
 await page.evaluate(categories=>localStorage.setItem('nefroquest-detailed-stats',JSON.stringify({schemaVersion:1,totalQuestions:40,totalCorrect:27,totalWrong:13,byCategory:categories,byTopic:{},questionHistory:[],dailyActivity:{},timeStats:{totalTime:0,questionCount:0},mostMissed:{},syncedMastered:[]})),categories);
 await page.locator('#forgeBtn:visible,.mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(()=>(window as any).openGameModesPopup());
 await page.locator('#gameModesOverlay [data-mode-route="weak"]').click();
}
test('fallback explains the real categories and cancelling changes no study or statistics',async({page})=>{
 const nativeDialogs:string[]=[];page.on('dialog',async d=>{nativeDialogs.push(d.message());await d.dismiss();});await prepare(page);expect(nativeDialogs).toEqual([]);
 const dialog=page.getByRole('dialog',{name:'Ponto Fraco',exact:true});await expect(dialog).toBeVisible();
 await expect(dialog.locator('li strong')).toHaveText(['DRC','Lesão Renal Aguda','Diálise']);await expect(dialog).toContainText('50%');await expect(dialog).toContainText('pelo menos 5 respostas');
 const before=await page.evaluate(()=>(0,eval)('JSON.stringify([localStorage.getItem(STUDY_SAVE_KEY),getDetailedStats()])'));
 await dialog.getByRole('button',{name:'Voltar',exact:true}).click();await expect(dialog).toHaveCount(0);await expect(page.locator('#studyModePage')).toHaveCount(0);await expect(page.locator('#forgeBtn:visible,.mdock-btn.forge-item:visible').first()).toBeFocused();
 expect(await page.evaluate(()=>(0,eval)('JSON.stringify([localStorage.getItem(STUDY_SAVE_KEY),getDetailedStats()])'))).toBe(before);
});
test('starting uses the same three lowest categories, once',async({page})=>{
 await prepare(page);const dialog=page.getByRole('dialog',{name:'Ponto Fraco',exact:true});await dialog.getByRole('button',{name:'Começar estudo',exact:true}).click();
 await expect(dialog).toHaveCount(0);await expect(page.locator('#studyModePage')).toBeVisible();await expect(page.locator('#studyOptions button')).toHaveCount(4);
 expect(await page.evaluate(()=>(0,eval)('[...new Set(studyModeQuestions.map(q=>q.cat))].sort()'))).toEqual(['dialise','drc','lra']);
 await expect(page.locator('#studyProgress')).toHaveText('1');
});
test('small samples and fewer categories are described accurately',async({page})=>{
 await prepare(page,{drc:{correct:1,total:3}} as typeof ranked);const dialog=page.getByRole('dialog',{name:'Ponto Fraco',exact:true});await expect(dialog.locator('h3')).toHaveText('Treine o tema com menor acerto');await expect(dialog.locator('li')).toHaveCount(1);await expect(dialog).toContainText('33%');await expect(dialog).toContainText('3 respostas');
});
test('the existing weak-category route still starts directly',async({page})=>{
 await prepare(page,{drc:{correct:2,total:5},lra:{correct:6,total:10}} as typeof ranked);await expect(page.locator('#nqWeakPointPlan')).toHaveCount(0);await expect(page.locator('#studyModePage')).toBeVisible();expect(await page.evaluate(()=>(0,eval)('[...new Set(studyModeQuestions.map(q=>q.cat))]'))).toEqual(['drc']);
});
test('keyboard, enlarged text and closing remain accessible',async({page})=>{
 await page.setViewportSize({width:320,height:740});await prepare(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');const dialog=page.getByRole('dialog',{name:'Ponto Fraco',exact:true});await expect(dialog).toBeVisible();
 for(let i=0;i<5;i++){await page.keyboard.press('Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('1');expect(await page.evaluate(()=>(0,eval)('state.answered'))).toBe(false);for(const button of await dialog.locator('footer button').all()){const box=(await button.boundingBox())!;expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(740);expect(box.height).toBeGreaterThanOrEqual(44);}const reading=dialog.getByRole('region',{name:'Plano de estudo',exact:true});await reading.focus();await page.keyboard.press('End');await expect.poll(()=>reading.evaluate(el=>el.scrollHeight<=el.clientHeight||el.scrollTop>0)).toBe(true);await expect(dialog.locator('.nq-weak-plan-count')).toBeInViewport();await test.info().attach('weak-plan-320-font-200',{body:await page.screenshot(),contentType:'image/png'});
 expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);expect(await page.evaluate(medirContraste,'#nqWeakPointPlan')).toEqual([]);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.locator('#mainApp')).toBeVisible();
});
test('a changed profile cannot start the plan captured earlier',async({page})=>{
 await prepare(page);await page.evaluate(()=>(window as any).authUser={id:'different-account'});await page.getByRole('button',{name:'Começar estudo',exact:true}).click();await expect(page.locator('#studyModePage')).toHaveCount(0);await expect(page.locator('#nqWeakPointPlan')).toHaveCount(0);
});


test('a first visit waits for the real question bank before presenting the plan',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let release!:()=>void,requested=false;
 const ready=new Promise<void>(resolve=>release=resolve);
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.route('**/data/topics.js',async route=>{requested=true;await ready;await route.continue();});
 try{
  await page.goto('/jogar/',{waitUntil:'load'});await page.evaluate(categories=>{localStorage.setItem('nefroquest-detailed-stats',JSON.stringify({schemaVersion:1,byCategory:categories}));document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).openGameModesPopup();},ranked);
  await page.locator('#gameModesOverlay [data-mode-route="weak"]').click();await expect.poll(()=>requested).toBe(true);expect(errors).toEqual([]);await expect(page.locator('#nqWeakPointPlan')).toHaveCount(0);
  release();await expect(page.getByRole('dialog',{name:'Ponto Fraco',exact:true})).toBeVisible();await expect(page.locator('.nq-weak-plan-count')).not.toContainText(/^0 /);expect(errors).toEqual([]);
 }finally{release();}
});

async function coldRoute(page:Page,file:'topics'|'articles',categories=ranked){
 let release!:()=>void,requests=0;const ready=new Promise<void>(resolve=>release=resolve);
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.route(`**/data/${file}.js`,async route=>{requests++;await ready;await route.continue();});
 await page.goto('/jogar/',{waitUntil:'load'});await page.evaluate(categories=>{localStorage.setItem('nefroquest-detailed-stats',JSON.stringify({schemaVersion:1,byCategory:categories}));document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).openGameModesPopup();},categories);
 await page.locator('#gameModesOverlay [data-mode-route="weak"]').click();return{release,requests:()=>requests};
}
for(const route of ['fallback','direct'] as const)test(`pending articles never block the ${route} route`,async({page})=>{
 const pending=await coldRoute(page,'articles',route==='fallback'?ranked:{drc:{correct:2,total:5}} as typeof ranked);
 try{await expect.poll(pending.requests).toBe(1);await expect(page.locator(route==='fallback'?'#nqWeakPointPlan':'#studyModePage')).toBeVisible();}finally{pending.release();}
});
for(const navigation of ['other mode','Escape'] as const)test(`pending plan is cancelled by ${navigation}`,async({page})=>{
 const pending=await coldRoute(page,'topics');try{
 await expect.poll(pending.requests).toBe(1);
 if(navigation==='Escape')await page.keyboard.press('Escape');else await page.evaluate(()=>(window as any).openGameModesPopup());
 pending.release();await page.evaluate(()=>(window as any)._loadTopics({refsOnly:true}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await expect(page.locator('#nqWeakPointPlan')).toHaveCount(0);await expect(page.locator('#studyModePage')).toHaveCount(0);if(navigation==='other mode')await expect(page.locator('#gameModesOverlay')).toHaveClass(/show/);
 }finally{pending.release();}
});
test('loading timeout permits retry without injecting the question script twice',async({page})=>{
 const pending=await coldRoute(page,'topics');try{
 await expect(page.getByText('Não foi possível carregar o estudo. Tente novamente.',{exact:true})).toBeVisible({timeout:12000});
 pending.release();await page.evaluate(()=>(window as any)._loadTopics({refsOnly:true}));await page.evaluate(()=>(window as any).openGameModesPopup());await page.locator('#gameModesOverlay [data-mode-route="weak"]').click();
 await expect(page.locator('#nqWeakPointPlan')).toBeVisible();expect(pending.requests()).toBe(1);
 }finally{pending.release();}
});
test('duplicate start events cannot create a second session',async({page})=>{
 await prepare(page);await page.locator('#nqWeakPointPlan [data-weak-start]').evaluate((button:HTMLButtonElement)=>{button.click();button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});await expect(page.locator('#studyModePage')).toHaveCount(1);await expect(page.locator('#studyProgress')).toHaveText('1');expect(await page.evaluate(()=>(0,eval)('new Set(studyModeQuestions.map(q=>q.qid)).size===studyModeQuestions.length'))).toBe(true);
});
