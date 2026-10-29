import {test,expect} from '@playwright/test';
import {injectGameState,enterGame} from '../helpers/game';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test('wrong answer, replay and reload preserve fifth artwork and rewards',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches),'Desktop artwork only');
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
 await injectGameState(page,{correctTotal:95,narrativeShown:95,level:12,score:45000,gold:5000,bossIntroShown:true,lives:5,maxLives:5},{replaceSnapshot:true});
 const key=()=>page.evaluate(()=>(window as any).NQBossCinema.inspection.image.artKey);
 await expect.poll(key).toBe('hit5');
 await page.waitForFunction(()=>!(0,eval)('_loadingNextQuestion'));
 const before=await page.evaluate(()=>{const w=window as any;return{correct:w.state.correctTotal,score:w.state.score,gold:w.state.gold,chests:w.state.chestsOpened,answer:w.state.current.a};});
 await page.locator(`#options .option[data-idx="${(before.answer+1)%4}"]`).click();
 await expect.poll(key).toBe('hit5');
 const after=()=>page.evaluate(()=>{const s=(window as any).state;return{correct:s.correctTotal,score:s.score,gold:s.gold,chests:s.chestsOpened};});
 const expected=await after();
 expect(expected.correct).toBe(before.correct);expect(expected.gold).toBe(before.gold);expect(expected.chests).toBe(before.chests);
 // An incorrect answer retains the native score penalty; only replay/reload must leave this result unchanged.
 expect(expected.score).toBeLessThan(before.score);
 await page.locator('#nqStaticIntro').click();
 const cinema=page.locator('#nqEntryCinema[open]');await expect(cinema).toBeVisible();
 await page.keyboard.press('Escape');await expect(cinema).toBeHidden();
 await expect.poll(key).toBe('hit5');expect(await after()).toEqual(expected);
 await page.evaluate(()=>(window as any).saveGame());
 await page.reload();await enterGame(page);await expect.poll(key).toBe('hit5');expect(await after()).toEqual(expected);
 await page.setViewportSize({width:1280,height:720});
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'cinema-art-evidence/boss-six-visual/reload-1280x720.png',fullPage:true});
});
