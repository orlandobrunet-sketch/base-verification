import{test,expect}from'@playwright/test';
test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
for(const key of ['nephros'])test('skip freezes the picture while original sound fades: '+key,async({page})=>{
 await page.goto('/cinema-preview.html',{waitUntil:'domcontentloaded'});await page.locator('[data-preview="'+key+'"]').click();const d=page.locator('dialog[open]'),v=d.locator('video');if(['nephros','aquaria','glomerulus'].includes(key))await d.getByRole('button',{name:'Pular histórias',exact:true}).click();await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.2)).toBe(true);
 await d.getByRole('button',{name:'Ativar som',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(1);
 await d.getByRole('button',{name:/^Pular (introdução|encerramento)$/}).click();expect(await d.locator('.nq-movie-freeze').count()).toBe(1);
 await page.waitForTimeout(120);const volume=await v.evaluate((v:HTMLVideoElement)=>v.volume);expect(volume).toBeGreaterThan(0);expect(volume).toBeLessThan(key==='victory'?.78:1);
 await expect(d).toBeHidden();expect(await page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);
});
test('all selected movies keep opt-in, pause, mute and volume isolated from saved preferences',async({page})=>{
 await page.goto('/cinema-preview.html',{waitUntil:'domcontentloaded'});const preferences=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>/nefroquest-(sound|music|sfx|audio)/.test(k)).map(k=>[k,localStorage.getItem(k)]))));
 for(const key of ['nephros','aquaria','glomerulus','chamber','battle']){
  await page.locator('[data-preview="'+key+'"]').click();const d=page.locator('dialog[open]'),v=d.locator('video');if(['nephros','aquaria','glomerulus'].includes(key))await d.getByRole('button',{name:'Pular histórias',exact:true}).click();await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);await expect(v).toHaveJSProperty('muted',true);
  await d.getByRole('button',{name:'Ativar som',exact:true}).click();await expect(v).toHaveJSProperty('muted',key==='battle');await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(1);
  const range=d.locator('input[type="range"]');await range.focus();await page.keyboard.press('Home');for(let i=0;i<30;i++)await page.keyboard.press('ArrowRight');await expect.poll(()=>v.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.6);const output=key==='battle'?d.locator('audio'):v,gain=await page.evaluate(()=>(window as any).NQEntryCinema.inspection.maximumLinearPlaybackGain);await expect.poll(()=>output.evaluate((v:HTMLMediaElement)=>v.volume)).toBeCloseTo(.3*gain*(key==='battle'?.3:1),4);
  await d.getByRole('button',{name:/^Pausar/}).click();await expect(v).toHaveJSProperty('paused',true);await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);
  await d.getByRole('button',{name:'Silenciar',exact:true}).click();await expect(v).toHaveJSProperty('muted',true);
  await page.keyboard.press('Escape');await expect(d).toBeHidden();await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);
 }
 expect(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>/nefroquest-(sound|music|sfx|audio)/.test(k)).map(k=>[k,localStorage.getItem(k)]))))).toBe(preferences);
});

test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinema only; native touch presentation is preserved.');});
