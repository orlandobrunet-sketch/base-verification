import {test,expect,type Page} from '@playwright/test';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.beforeEach(async({context,baseURL})=>{const origin=new URL(baseURL!).origin;await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===origin?r.continue():r.abort());await context.routeWebSocket('**/*',s=>s.close());});
async function open(page:Page,mode='normal'){
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.locator('[data-portal-route="guest"]').click();await page.locator('[data-action="startNewFromWelcome"]').click();await page.locator(`[role="radio"][data-diff-key="${mode}"]`).click();await page.locator('#diffConfirmBtn').click();const root=page.locator('#charSelectModal');await expect(root).toBeVisible();return root;
}
test('Hardcore mostra atributos canônicos sem prometer o bônus inicial',async({page})=>{
 const root=await open(page,'hardcore');await expect(root.locator('#nqcHardcoreNotice')).toBeVisible();
 for(const id of ['nephros','aquaria','glomerulus']){
  await root.locator(`[data-char="${id}"]`).click();await expect(root.locator('#nqcInitialBonus')).toHaveText('Os bônus iniciais não se aplicam no Hardcore. Os atributos originais da classe permanecem.');
  const expected=await page.evaluate(id=>(0,eval)(`[characters[${JSON.stringify(id)}].bonusAtk,characters[${JSON.stringify(id)}].bonusDef,characters[${JSON.stringify(id)}].bonusKno,characters[${JSON.stringify(id)}].bonusLuck].filter(x=>x>0).map(x=>'+'+x)`),id);
  await expect(root.locator('#nqcAttributes strong')).toHaveText(expected);
 }
 expect(await page.evaluate(()=>localStorage.getItem('nefroquest-save-v7'))).toBeNull();
});
for(const width of [320,1100])test(`teclado, nome e ações permanecem íntegros a200% em${width}px`,async({page})=>{
 await page.setViewportSize({width,height:740});const root=await open(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 const first=root.locator('[role="radio"]').first();await first.focus();await page.keyboard.press('End');const last=root.locator('[data-char="glomerulus"]');await expect(last).toBeFocused();await expect(last).toHaveAttribute('aria-checked','true');await expect(root).toHaveAttribute('data-preview-character','glomerulus');
 await expect.poll(()=>root.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
 expect(await root.locator('#nqcProfileName').evaluate(e=>{const n=e.firstChild!,r=document.createRange(),start=n.textContent!.indexOf('Glomerulus');r.setStart(n,start);r.setEnd(n,start+10);return r.getClientRects().length})).toBe(1);
 for(const button of [root.locator('[data-character-cancel]'),root.locator('[data-action="startCharacterPreview"]')]){await button.focus();await button.scrollIntoViewIfNeeded();await expect(button).toBeFocused();expect(await button.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===hit||e.contains(hit)})).toBe(true);}
 await page.keyboard.press('Escape');await expect(root).toBeHidden();await expect(page.locator('[data-action="startNewFromWelcome"]')).toBeFocused();expect(await page.evaluate(()=>(window as any)._pendingDiff)).toBeNull();
});
test('duplo clique confirma somente uma vez pelo início nativo',async({page})=>{
 const root=await open(page);await root.locator('[data-char="aquaria"]').click();await page.evaluate(()=>{const w=window as any,native=w.startGameWithCharacter;w.__sceneStarts=0;w.__sceneResults=[];w.startGameWithCharacter=async function(...args:any[]){w.__sceneStarts++;const result=await native.apply(this,args);w.__sceneResults.push(result);return result;};const b=document.querySelector<HTMLButtonElement>('[data-action="startCharacterPreview"]')!;b.click();b.click();});
 await expect.poll(()=>page.evaluate(()=>(window as any).__sceneResults.filter((v:boolean)=>v===true).length)).toBe(1);expect(await page.evaluate(()=>(window as any).__sceneStarts)).toBe(1);
 expect(await page.evaluate(()=>(0,eval)('state.character'))).toBe('aquaria');const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('nefroquest-save-v7')||'null'));expect(save).toMatchObject({character:'aquaria',difficulty:'normal',gameStarted:true,classBenefits:{lockedClass:'aquaria',windowAnswers:0}});
 await expect(root).toBeHidden();await expect(page.locator('#charIntroOverlay')).toHaveCount(0);
});
