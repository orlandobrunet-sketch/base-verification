import{test,expect}from'@playwright/test';import{enterGame}from'../helpers/game';
import{advanceToFilm}from'../helpers/cinema';
import path from'node:path';import{mkdirSync}from'node:fs';
test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
test('combined normal entry, Chamber, boss, epilogue and continuation',async({page})=>{
 test.setTimeout(100000);test.skip(!await page.evaluate(()=>matchMedia('(min-width:961px) and (pointer:fine)').matches),'Consolidated desktop composition');
 await page.setViewportSize({width:1280,height:800});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 const dir=path.resolve(__dirname,'../test-results/visual-screens');mkdirSync(dir,{recursive:true});
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof(window as any)._confirmDiff==='function');
 await page.evaluate(()=>{document.getElementById('landingScreen')?.classList.add('hidden');return(0,eval)('_pendingDiff="normal";_confirmDiff(false)');});
 await page.locator('#charSelectModal [data-arg="nephros"]').click();await page.locator('#charIntroOverlay [data-action="closeIntroAndStart"]').click();
 const cinema=page.locator('#nqEntryCinema[open]');await expect(cinema.locator('.nq-movie-prologue')).toBeVisible();await page.screenshot({path:path.join(dir,'character-cards.png')});
 await advanceToFilm(cinema);await expect.poll(()=>cinema.locator('video').evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);await expect(cinema.locator('video')).toHaveJSProperty('muted',true);
 await page.keyboard.press('Escape');await expect(cinema).toHaveCount(0);await expect(page.locator('#question')).not.toBeEmpty();
 const origin=page.locator('#forgeBtn:visible');await origin.focus();await page.evaluate(()=>(window as any).showAcidBaseMinigame());await expect(cinema).toBeVisible();await expect(cinema.locator('video')).toHaveJSProperty('muted',true);await page.keyboard.press('Tab');expect(await cinema.evaluate(el=>el.contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await expect(cinema).toHaveCount(0);
 const hub=page.locator('#acidBaseOverlay');await expect(hub).toHaveAttribute('data-ab-tela','hub');await expect(page.getByRole('heading',{name:'Alquimista Renal'})).toBeFocused();
 await expect(hub.locator('.ab-next-case')).toBeVisible();await expect(hub.locator('.ab-lead')).toContainText('Vinte pacientes');await page.screenshot({path:path.join(dir,'chamber-hub.png'),fullPage:true});
 const progressBefore=await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'));
 await hub.locator('[data-entry-replay="chamber"]').click();await expect(cinema).toBeVisible();await expect(cinema.locator('video')).toHaveJSProperty('muted',true);await page.keyboard.press('Escape');await expect(cinema).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'))).toBe(progressBefore);
 await hub.locator('[data-ab-next]').click();await page.locator('[data-ab-start-acts]').click();await expect(page.locator('.ab-prompt')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('.ab-prompt')).toBeVisible();await page.screenshot({path:path.join(dir,'chamber-act.png'),fullPage:true});
 for(let i=0;i<8&&!await page.locator('.ab-summary-view').count();i++){
  if(await page.locator('#abNumInput:not([disabled])').count()){await page.locator('#abNumInput').fill('10');await page.locator('[data-ab-num-submit]').click();}
  else if(await page.locator('[data-ab-pick]:not([disabled])').count())await page.locator('[data-ab-pick]').first().click();
  else await page.locator('[data-ab-cards-submit]').click();
  await expect(page.locator('.ab-next')).toBeFocused();await page.locator('.ab-next').click();
 }
 await expect(page.locator('.ab-summary-view')).toBeVisible();await page.screenshot({path:path.join(dir,'chamber-summary.png'),fullPage:true});
 const completed=await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'));expect(completed).toContain('aldric');
 await page.getByRole('button',{name:'Sair da Câmara',exact:true}).click();await expect(hub).toHaveCount(0);await expect(origin).toBeFocused();await expect(page.locator('#mainApp')).toBeVisible();
 // Isolate the native final-answer boundary; the separate unchanged full-ten-hit spec covers90→100.
 await page.evaluate(()=>{const w=window as any;Object.assign(w.state,{correctTotal:99,bossIntroShown:true,battleFinalShown:true,narrativeShown:99,chestCorrectCount:0,chestTarget:999,gold:0,level:12,lives:5,maxLives:5,xp:0,xpToNext:99999});w.renderHUD();w.updateBossUI();});
 await expect(page.locator('#arquiQ9Popup')).toBeVisible();await page.locator('#arquiQ9CloseBtn').click();
 await page.locator('#nqBossStatic').scrollIntoViewIfNeeded();await expect.poll(()=>page.evaluate(()=>(window as any).NQBossCinema.inspection.image.artKey)).toBe('last');await page.screenshot({path:path.join(dir,'boss-final.png')});
 await page.waitForFunction(()=>!(0,eval)('_loadingNextQuestion'));await page.locator('#options .option[data-idx="'+await page.evaluate(()=>(window as any).state.current.a)+'"]').click();
 const victory=page.locator('#nqVictoryCinema[open]');await expect(victory).toBeVisible();await expect(victory.locator('video')).toHaveCount(0);await victory.getByRole('button',{name:'Ativar som',exact:true}).click();await expect(victory.locator('audio')).toHaveJSProperty('muted',false);
 await expect(victory.locator('.nq-epilogue-caption')).toHaveText('OS RINS FORAM SALVOS!',{timeout:9000});await victory.getByRole('button',{name:'Pausar',exact:true}).click();
 const geometry=await victory.evaluate(d=>{const img=d.querySelector('img')!,caption=d.querySelector('.nq-epilogue-reading')!,a=img.getBoundingClientRect(),b=caption.getBoundingClientRect();return{ratio:a.width/a.height,inside:b.top>=a.top&&b.bottom<=a.bottom+1,overflow:d.scrollHeight>d.clientHeight};});expect(geometry.ratio).toBeCloseTo(1402/1122,2);expect(geometry.inside).toBe(true);expect(geometry.overflow).toBe(false);await page.screenshot({path:path.join(dir,'victory-epilogue.png')});
 await victory.locator('.nq-victory-cinema__skip').click();const results=page.locator('#victoryModal');await expect(results).toBeVisible();await expect(results.locator('.nqvictory-awarded img')).toBeVisible();await page.screenshot({path:path.join(dir,'victory-results.png')});
 const earned=await page.evaluate(()=>JSON.stringify({score:(window as any).state.score,gold:(window as any).state.gold,correct:(window as any).state.correctTotal,ach:localStorage.getItem('nefroquest-achievements')}));
 await results.getByRole('button',{name:'Continuar jogando',exact:true}).click();await expect(results).toHaveCount(0);await page.reload();await enterGame(page);
 expect(await page.evaluate(()=>JSON.stringify({score:(window as any).state.score,gold:(window as any).state.gold,correct:(window as any).state.correctTotal,ach:localStorage.getItem('nefroquest-achievements')}))).toBe(earned);expect(await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'))).toBe(completed);
 expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
