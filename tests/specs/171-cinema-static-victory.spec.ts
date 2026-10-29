import{test,expect}from'@playwright/test';test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
test('static epilogue pauses, replays without music duplication and finishes once',async({page})=>{
 await page.goto('/cinema-preview.html');await page.locator('[data-preview="victory"]').click();const d=page.locator('#nqVictoryCinema[open]');
 await expect(d.locator('video')).toHaveCount(0);await expect(d.locator('img.nq-victory-epilogue__image')).toBeVisible();await expect(d.locator('audio')).toHaveCount(1);
 await expect(d.locator('audio')).toHaveJSProperty('paused',true);await d.getByRole('button',{name:'Ativar som',exact:true}).click();await expect(d.locator('audio')).toHaveJSProperty('muted',false);
 await d.getByRole('button',{name:'Pausar epílogo',exact:true}).click();const time=await page.evaluate(()=>(window as any).NQVictoryCinema.inspection.elapsed);await page.waitForTimeout(900);expect(await page.evaluate(()=>(window as any).NQVictoryCinema.inspection.elapsed)).toBe(time);await expect(d.locator('audio')).toHaveJSProperty('paused',true);
 await d.getByRole('button',{name:'Rever epílogo',exact:true}).click();await expect(d.locator('audio')).toHaveCount(1);await expect(d.locator('audio')).toHaveJSProperty('muted',true);
 await expect(d.locator('.nq-epilogue-caption')).toHaveText('OS RINS FORAM SALVOS!',{timeout:6000});await expect(d).toBeHidden({timeout:12000});
 expect(await page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);await expect(page.locator('audio[data-nq-movie-music]')).toHaveCount(0);
});

test('unavailable music never blocks automatic epilogue completion',async({page})=>{
 await page.route('**/victory-sovereign-ascent.mp3',r=>r.abort());await page.goto('/cinema-preview.html');await page.locator('[data-preview="victory"]').click();const d=page.locator('#nqVictoryCinema[open]');await expect(d.locator('img')).toBeVisible();await expect(d).toBeHidden({timeout:16000});expect(await page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);
});
test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinema only; native touch presentation is preserved.');});
