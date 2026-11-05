import {test,expect,type Page} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {medirContraste} from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
async function open(page:Page,boss:boolean){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
 if(boss){await page.waitForFunction(()=>typeof (window as any).startBossPreview==='function');await page.evaluate(async()=>await (window as any).startBossPreview());}
 else await injectGameState(page);
 await expect(page.locator('#options .option')).toHaveCount(4);await page.evaluate(()=>document.fonts.ready);
}
for(const boss of [false,true]){
 for(let index=0;index<4;index++)test(`${boss?'final':'main'} numeric shortcut ${index+1} selects the displayed option`,async({page})=>{
  await open(page,boss);const options=page.locator('#options .option');
  await expect(options.locator('.opt-key')).toHaveText(['A','B','C','D']);
  await expect(options.locator('.nq-option-shortcut')).toHaveText(['1','2','3','4']);
  const before=await page.evaluate(()=>({answer:(window as any).state.current.a,text:[...(window as any).state.current.o]}));
  await expect(options.locator('.opt-body')).toHaveText(before.text);
  for(let i=0;i<4;i++){await expect(options.nth(i).locator('.nq-option-shortcut')).toBeVisible();await expect(options.nth(i)).toHaveAttribute('aria-keyshortcuts',`${i+1} ${String.fromCharCode(65+i)}`);await expect(options.nth(i).locator('.nq-option-shortcut')).toHaveAttribute('aria-hidden','true');}
  const chosen=options.nth(index);await chosen.focus();await expect(chosen).toBeFocused();await expect(chosen).not.toHaveCSS('outline-style','none');
  await page.keyboard.press(String(index+1));await expect(chosen).toHaveClass(index===before.answer?/correct/:/wrong/);await expect(chosen).toBeDisabled();
  await expect(options.nth(before.answer)).toHaveClass(/correct/);await expect(page.locator('#nextBtn')).toBeVisible();
  expect(await page.evaluate(()=>(window as any).state.answered)).toBe(true);for(const hint of await options.locator('.nq-option-shortcut').all())await expect(hint).toBeHidden();
 });
 for(const layout of [{width:1159,height:684,font:16},{width:390,height:800,font:16},{width:320,height:740,font:32}])test(`${boss?'final':'main'} hints fit at ${layout.width}/${layout.font}`,async({page})=>{
  await page.setViewportSize(layout);await open(page,boss);await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',layout.font);
  const hints=page.locator('#options .nq-option-shortcut');for(const hint of await hints.all())await expect(hint).toBeVisible();
  const bounds=await hints.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),b=node.closest('button')!.getBoundingClientRect(),text=node.closest('button')!.querySelector('.opt-body')!.getBoundingClientRect();return {inside:r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom,separate:r.right<=text.left+1,inViewport:r.left>=0&&r.right<=innerWidth};}));expect(bounds.every(b=>b.inside&&b.separate&&b.inViewport)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(await page.evaluate(medirContraste,'#options .nq-option-shortcut')).toEqual([]);
  await page.locator('#options .option').first().scrollIntoViewIfNeeded();
  await test.info().attach('keyboard-guides',{body:await page.screenshot(),contentType:'image/png'});
 });
}
