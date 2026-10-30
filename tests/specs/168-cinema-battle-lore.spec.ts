import{test,expect}from'@playwright/test';import{injectBossState}from'../helpers/game';
test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
async function boss(page){await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectBossState(page);await page.locator('#nqStaticIntro').waitFor({state:'visible'});}
test('real battle uses camera04 and battle captions, not the chamber copy',async({page})=>{
 await boss(page);await page.locator('#nqStaticIntro').click();const d=page.locator('#nqEntryCinema[open]');await expect(d).toBeVisible();await expect(d).toHaveAttribute('data-movie-key','battle');
 await expect.poll(()=>d.locator('video').evaluate((v:HTMLVideoElement)=>v.currentSrc)).toContain('NefroQuest-camera-isolada-teste-04.mp4');
 await expect(d.locator('.nq-movie-caption')).toHaveText('Noventa batalhas depois.');await page.keyboard.press('Escape');await expect(d).toBeHidden();
});
test('full battle lore remains readable outside the film without changing native state',async({page})=>{
 await boss(page);const before=await page.evaluate(()=>(0,eval)('JSON.stringify({correct:state.correctTotal,score:state.score,level:state.level,lives:state.lives})'));
 const open=page.getByRole('button',{name:'Ler história do confronto',exact:true});await open.click();const lore=page.locator('#nqMovieLore');await expect(lore).toBeVisible();await expect(lore.locator('p')).toHaveCount(5);await expect(page.locator('dialog[open] video')).toHaveCount(0);
 await page.keyboard.press('Escape');await expect(lore).toBeHidden();await expect(open).toBeFocused();expect(await page.evaluate(()=>(0,eval)('JSON.stringify({correct:state.correctTotal,score:state.score,level:state.level,lives:state.lives})'))).toBe(before);
});

test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinema only; native touch presentation is preserved.');});
