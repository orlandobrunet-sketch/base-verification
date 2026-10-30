import{test,expect}from'@playwright/test';test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
for(const key of ['battle'])test('designated music is the only opt-in output: '+key,async({page})=>{
 await page.goto('/cinema-preview.html',{waitUntil:'domcontentloaded'});await page.locator('[data-preview="'+key+'"]').click();const d=page.locator('dialog[open]'),v=d.locator('video'),music=d.locator('audio[data-nq-movie-music]');await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);
 await expect(music).toHaveCount(1);await expect(v).toHaveJSProperty('muted',true);await expect(music).toHaveJSProperty('paused',true);
 await d.getByRole('button',{name:'Ativar som',exact:true}).click();await expect(music).toHaveJSProperty('muted',false);await expect.poll(()=>music.evaluate((a:HTMLAudioElement)=>!a.paused&&a.currentTime>0)).toBe(true);await expect(v).toHaveJSProperty('muted',true);
 expect(await music.evaluate((a:HTMLAudioElement)=>a.currentSrc)).toContain(key==='battle'?'battle-dragon-due.mp3':'victory-sovereign-ascent.mp3');
 await d.getByRole('button',{name:/^Pausar/}).click();await expect(music).toHaveJSProperty('paused',true);await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);
 await page.keyboard.press('Escape');await expect(d).toBeHidden();await expect(page.locator('audio[data-nq-movie-music]')).toHaveCount(0);
});

test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinema only; native touch presentation is preserved.');});
