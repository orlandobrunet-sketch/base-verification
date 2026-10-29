import { test, expect } from '@playwright/test';
test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
test('confirmation precedes journey; film moves behind short captions and closes itself once',async({page})=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof(window as any)._confirmDiff==='function');
 await page.evaluate(()=>(0,eval)('_pendingDiff="normal";_confirmDiff(false)'));
 await page.locator('#charSelectModal [data-arg="nephros"]').click();
 const confirmation=page.locator('#charIntroOverlay');await expect(confirmation).toBeVisible();
 expect(await page.evaluate(()=>(0,eval)('state.gameStarted'))).toBe(false);
 await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).__entryClosed=[];document.addEventListener('nq-entry-cinema-closed',(e:CustomEvent)=>(window as any).__entryClosed.push(e.detail));});
 await confirmation.locator('[data-action="closeIntroAndStart"]').click();
 const cinema=page.locator('#nqEntryCinema[open]'),video=cinema.locator('video');await expect(cinema).toBeVisible();await cinema.getByRole('button',{name:'Pular histórias',exact:true}).click();
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);
 await expect(video).toHaveJSProperty('muted',true);
 await expect(cinema.locator('.nq-movie-caption')).toHaveText('Dr. Nephros',{timeout:5000});
 await cinema.locator('.nq-entry-cinema__play').click();const before=await video.evaluate((v:HTMLVideoElement)=>v.currentTime);await page.waitForTimeout(3500);
 expect(await video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeCloseTo(before,1);
 await expect(cinema.locator('.nq-movie-caption')).toHaveText('Dr. Nephros');
 await cinema.locator('.nq-entry-cinema__play').click();
 await expect(cinema.locator('.nq-movie-caption')).toHaveText('A jornada começa agora.',{timeout:6000});
 await expect(cinema).toBeHidden({timeout:7000});
 expect(await page.evaluate(()=>(0,eval)('state.correctTotal'))).toBe(0);
 await expect(page.locator('#mainApp')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).__entryClosed.map((e:any)=>e.reason))).toEqual(['ended']);
});

test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinema only; native touch presentation is preserved.');});
