import{test,expect}from'@playwright/test';import{injectGameState,enterGame}from'../helpers/game';test.use({serviceWorkers:'block'});
test('current normal character save resumes after choosing post-victory continuation',async({page})=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/');await page.waitForFunction(()=>typeof(window as any)._confirmDiff==='function');
 // This fixture starts at the native welcome flow, after the separate access screen.
 await page.evaluate(()=>{document.getElementById('landingScreen')?.classList.add('hidden');return(0,eval)('_pendingDiff="normal";_confirmDiff(false)');});await page.locator('#charSelectModal [data-arg="nephros"]').click();await page.locator('#charIntroOverlay [data-action="closeIntroAndStart"]').click();
 const desktop=await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0);if(desktop){await expect(page.locator('#nqEntryCinema[open]')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);}
 await expect(page.locator('#question')).not.toBeEmpty();await page.evaluate(()=>{const w=window as any;Object.assign(w.state,{correctTotal:99,bossIntroShown:true,battleFinalShown:true,narrativeShown:99,chestCorrectCount:0,chestTarget:999,gold:0,level:12,lives:99,maxLives:99,xp:0,xpToNext:99999});w.renderHUD();w.updateBossUI();});
 await expect(page.locator('#arquiQ9Popup')).toBeVisible();await page.locator('#arquiQ9CloseBtn').click();await expect(page.locator('#arquiQ9Popup')).toBeHidden();await page.locator('#options .option[data-idx="'+await page.evaluate(()=>(window as any).state.current.a)+'"]').click();
 if(desktop){await expect(page.locator('#nqVictoryCinema[open]')).toBeVisible();await page.locator('#nqVictoryCinema .nq-victory-cinema__skip').click();}
 await page.locator('#victoryModal').getByRole('button',{name:'Continuar jogando',exact:true}).click();await expect.poll(()=>page.evaluate(()=>{const s=(window as any).loadGame();return s?.schemaVersion===9&&!!s?.classBenefits&&s?.completedGame===true;})).toBe(true);
 const earned=await page.evaluate(()=>JSON.stringify({score:(window as any).state.score,gold:(window as any).state.gold,correct:(window as any).state.correctTotal,ach:localStorage.getItem('nefroquest-achievements')}));await page.reload();await enterGame(page);expect(await page.evaluate(()=>JSON.stringify({score:(window as any).state.score,gold:(window as any).state.gold,correct:(window as any).state.correctTotal,ach:localStorage.getItem('nefroquest-achievements')}))).toBe(earned);
});
test('awarded badge and result choices preserve victory across close, reopen and reload',async({page})=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/');
 await injectGameState(page,{correctTotal:99,bossIntroShown:true,battleFinalShown:true,narrativeShown:99,chestCorrectCount:0,chestTarget:999,gold:0,level:12,lives:99,maxLives:99,xp:0,xpToNext:99999});
 if(await page.locator('#arquiQ9Popup').isVisible())await page.locator('#arquiQ9CloseBtn').click();
 const answer=await page.evaluate(()=>(window as any).state.current.a);await page.locator('#options .option[data-idx="'+answer+'"]').click();
 const desktop=await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0);if(desktop){const ending=page.locator('#nqVictoryCinema[open]');await expect(ending).toBeVisible();await ending.locator('.nq-victory-cinema__skip').click();}const results=page.locator('#victoryModal');await expect(results).toBeVisible();
 await expect(results.locator('.nqvictory-awarded img')).toHaveAttribute('src','assets/achievements/campeao.webp');
 const earned=await page.evaluate(()=>JSON.stringify({score:(window as any).state.score,gold:(window as any).state.gold,correct:(window as any).state.correctTotal,ach:localStorage.getItem('nefroquest-achievements')}));
 await page.keyboard.press('Escape');await expect(results).toHaveCount(0);expect(await page.evaluate(()=>(window as any).state.gameStarted)).toBe(true);await page.locator('#victoryResultsBtn').click();await expect(results).toBeVisible();
 await results.getByRole('button',{name:'Voltar à tela inicial',exact:true}).focus();await page.keyboard.press('Enter');await expect(results).toHaveCount(0);await expect(page.locator('#welcomeScreen')).toBeVisible();
 await page.reload();await enterGame(page);await page.locator('#victoryResultsBtn').click();await expect(results).toBeVisible();await results.getByRole('button',{name:'Continuar jogando',exact:true}).click();await expect(results).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).loadGame()?.completedGame)).toBe(true);await page.reload();await enterGame(page);await expect(page.locator('#nextBtn')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify({score:(window as any).state.score,gold:(window as any).state.gold,correct:(window as any).state.correctTotal,ach:localStorage.getItem('nefroquest-achievements')}))).toBe(earned);
 await expect(page.locator('#nqVictoryCinema[open]')).toHaveCount(0);
});
