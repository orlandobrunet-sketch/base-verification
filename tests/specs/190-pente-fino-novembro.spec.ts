import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.beforeEach(async({page,context})=>{
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'&&r.request().method()==='GET'?r.continue():r.abort());
 await context.routeWebSocket('**/*',s=>s.close());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
});
test('drawer fechado não recebe foco; abrir, fechar e ampliar restaura o acesso correto',async({page})=>{
 await page.setViewportSize({width:390,height:844});await injectGameState(page);
 const drawer=page.locator('.panel.left');await page.locator('#mainApp').focus();
 for(let n=0;n<18;n++){await page.keyboard.press('Tab');expect(await drawer.evaluate(e=>e.contains(document.activeElement))).toBe(false);}
 const opener=page.locator('[data-action="openMobileDrawer"]:visible').first();await opener.focus();await opener.press('Enter');
 await expect(drawer).toHaveClass(/mobile-open/);await expect(drawer.locator('.drawer-close-btn')).toBeFocused();
 await page.keyboard.press('Escape');await expect(opener).toBeFocused();
 expect(await drawer.evaluate(e=>e.contains(document.activeElement))).toBe(false);
 await page.setViewportSize({width:1280,height:800});await drawer.locator('.stat-badge').first().focus();
 await expect(drawer.locator('.stat-badge').first()).toBeFocused();
});
test('perfil compacto preserva o nome inteiro nas larguras intermediárias',async({page})=>{
 await injectGameState(page);await page.evaluate(()=>(window as any).openBibliotecaModal());
 const name=page.locator('.nqd-profile-name');await expect(name).toHaveText('Jogador local');
 for(const width of [768,844,980])for(const font of [16,32]){
  await page.setViewportSize({width,height:900});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);
  expect(await name.evaluate(e=>{const b=e.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(e);return [...r.getClientRects()].every(x=>x.left>=b.left-1&&x.right<=b.right+1);}),width+'px / '+font+'px').toBe(true);
 }
});
test('voltar ao Átrio anuncia o destino sem perder o progresso',async({page})=>{
 await injectGameState(page);const before=await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,idx:state.idx,equipment:state.equipment,correct:state.correctTotal})'));
 await page.locator('#mainApp').focus();await page.evaluate(()=>(window as any).goToWelcomeFromGame());
 await expect(page.locator('#welcomeScreen')).toBeVisible();await expect(page.locator('#atriumTitle')).toBeFocused();
 expect(await page.evaluate(()=>(0,eval)('JSON.stringify({gold:state.gold,idx:state.idx,equipment:state.equipment,correct:state.correctTotal})'))).toBe(before);
 await page.keyboard.press('Tab');expect(await page.locator('#welcomeScreen').evaluate(e=>e.contains(document.activeElement))).toBe(true);
});

test('ranking reflui resumo e busca sem colisões com texto ampliado',async({page})=>{
 await injectGameState(page);await page.evaluate(()=>(window as any).openDashboard({tab:'ranking'}));
 await expect(page.locator('#nqdPane-ranking')).toBeVisible();
 for(const width of [768,844,1100,1440])for(const font of [16,32]){
  await page.setViewportSize({width,height:900});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);
  const geometry=await page.locator('#nqdPane-ranking').evaluate(root=>{
   const rects=[...root.querySelector('.nqd-ranking-personal')!.children].map(e=>{const r=document.createRange();r.selectNodeContents(e);return [...r.getClientRects()];});
   const overlap=rects.some((list,i)=>list.some(a=>rects.slice(i+1).some(other=>other.some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1))));
   const search=root.querySelector('#nqDashLbSearch')!.getBoundingClientRect(),box=root.getBoundingClientRect();
   return {overlap,searchFits:search.left>=box.left-1&&search.right<=Math.min(box.right,innerWidth)+1};
  });
  expect(geometry,width+'px / '+font+'px').toEqual({overlap:false,searchFits:true});
 }
 await page.locator('#nqDashLbSearch').fill('Jogador');await expect(page.locator('#nqDashLbSearch')).toHaveValue('Jogador');
});
