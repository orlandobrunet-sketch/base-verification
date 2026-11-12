import {test,expect,type Page} from '@playwright/test';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.beforeEach(async({context,baseURL})=>{
  const origin=new URL(baseURL!).origin;
  await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await context.routeWebSocket('**/*',s=>s.close());
});
async function open(page:Page,earned:string[]=[],boundary?:'sandbox'|'missing'){
  await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(()=>localStorage.setItem('nefroquest-save',JSON.stringify({schemaVersion:6,level:1,xp:50,correctTotal:3,gold:500,lives:3,maxLives:3,character:'nephros',gameStarted:true,timestamp:Date.now()})));
  if(earned.length)await page.evaluate(ids=>localStorage.setItem('nefroquest-achievements',JSON.stringify(ids)),earned);
  if(boundary)await page.evaluate(boundary=>{
    if(boundary==='sandbox')(window as any).beginProgressSandbox('difficulty-preview');
    else (0,eval)('getUnlockedAchievements = () => {throw new Error("Synthetic unavailable metadata")}');
  },boundary);
  await page.locator('[data-action="startNewFromWelcome"]').click();
  const dialog=page.getByRole('dialog',{name:'Calibre o ritmo da jornada.'});await expect(dialog).toBeVisible();return dialog;
}
test('popup desktop é mais amplo e dá espaço real à coluna de seleção',async({page})=>{
  await page.setViewportSize({width:1440,height:900});const dialog=await open(page);
  const box=(await dialog.boundingBox())!,left=(await dialog.locator('.nql-difficulty__selector').boundingBox())!,right=(await dialog.locator('.nql-difficulty__impact').boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(1280);expect(left.width/right.width).toBeGreaterThanOrEqual(1.4);
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(1441);
});
test('marcos de vitória usam nomes e artes reais, sem conceder conquista ao selecionar',async({page})=>{
  const dialog=await open(page);
  const read=()=>page.evaluate(()=>({save:localStorage.getItem('nefroquest-save'),earned:localStorage.getItem('nefroquest-achievements'),won:localStorage.getItem('nefroquest-arqui-defeated'),hardcore:localStorage.getItem('nefroquest-hardcore-completed')}));
  const before=await read();
  for(const mode of ['easy','normal','hard','hardcore']){
    await dialog.locator(`[role="radio"][data-diff-key="${mode}"]`).click();
    const panel=dialog.locator('.nql-difficulty__impact-panel[aria-hidden="false"]'),ids=mode==='hardcore'?['arqui_nefromante_slayer','hardcore_champion']:['arqui_nefromante_slayer'];
    const badges=panel.locator('[data-victory-achievement]');await expect(badges).toHaveCount(ids.length);
    expect(await badges.evaluateAll(es=>es.map(e=>e.getAttribute('data-victory-achievement')))).toEqual(ids);
    for(const id of ids){const expected=await page.evaluate(id=>(0,eval)(`ACHIEVEMENTS_LIST.find(a=>a.id===${JSON.stringify(id)}).name`),id);await expect(panel.locator(`[data-victory-achievement="${id}"]`)).toContainText(expected)}
    await expect(badges.locator('img')).toHaveCount(ids.length);
    await expect.poll(()=>badges.locator('img').evaluateAll(es=>es.every(e=>(e as HTMLImageElement).naturalWidth>0))).toBe(true);
    await expect(panel.locator('.nql-difficulty__victory-note')).toContainText('desempenho e histórico');expect(await read()).toEqual(before);
  }
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();expect(await read()).toEqual(before);
});
for(const width of [320,1100]){
  test(`texto200% em${width}px mantém opções e rodapé inteiros`,async({page})=>{
    await page.setViewportSize({width,height:740});const dialog=await open(page);
    await page.evaluate(async()=>{document.documentElement.style.fontSize='32px';await document.fonts.ready});
    const hard=dialog.locator('[role="radio"][data-diff-key="hardcore"]');await hard.click();await expect(hard).toHaveAttribute('aria-checked','true');
    const clipped=await dialog.evaluate(root=>{const r=root.getBoundingClientRect();return [...root.querySelectorAll('[role="radio"] span,button,li')].filter(e=>{const a=e.getBoundingClientRect();return a.width&&(a.left<r.left-1||a.right>r.right+1)}).map(e=>e.textContent)});expect(clipped).toEqual([]);
    const overlaps=await dialog.locator('[role="radio"]').evaluateAll(es=>es.filter(e=>{const a=e.querySelector('.difficulty-name')!.getBoundingClientRect(),b=e.querySelector('.nql-difficulty__lives')!.getBoundingClientRect();return Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1}).map(e=>e.getAttribute('data-diff-key')));expect(overlaps).toEqual([]);
    expect(await dialog.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
    const confirm=dialog.locator('#diffConfirmBtn');await confirm.focus();await expect(confirm).toBeFocused();const b=(await confirm.boundingBox())!;expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.height).toBeLessThanOrEqual(741);
    await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.locator('[data-action="startNewFromWelcome"]')).toBeFocused();
  });
}
test('conquista anterior é identificada sem regravar o histórico',async({page})=>{
  const dialog=await open(page,['arqui_nefromante_slayer']);
  const before=await page.evaluate(()=>localStorage.getItem('nefroquest-achievements'));
  const panel=dialog.locator('.nql-difficulty__impact-panel[aria-hidden="false"]');await expect(panel.locator('[data-victory-achievement="arqui_nefromante_slayer"] small')).toHaveText('Já conquistada');
  await dialog.locator('[role="radio"][data-diff-key="hardcore"]').click();
  await expect(dialog.locator('.nql-difficulty__impact-panel[aria-hidden="false"] [data-victory-achievement="hardcore_champion"] small')).toHaveCount(0);
  await page.keyboard.press('Escape');expect(await page.evaluate(()=>localStorage.getItem('nefroquest-achievements'))).toBe(before);
});
for(const boundary of ['sandbox','missing'] as const){
  test(`prévia ${boundary} mantém seleção utilizável e não promete conquistas`,async({page})=>{
    const dialog=await open(page,[],boundary),raw=await page.evaluate(()=>localStorage.getItem('nefroquest-save'));
    await expect(dialog.locator('.nql-difficulty__victory')).toHaveCount(0);
    await dialog.locator('[role="radio"][data-diff-key="hardcore"]').click();
    await expect(dialog.locator('#diffConfirmBtn')).toHaveAttribute('aria-label','Continuar com dificuldade Hardcore');
    await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(()=>localStorage.getItem('nefroquest-save'))).toBe(raw);
    expect(await page.evaluate(()=>localStorage.getItem('nefroquest-achievements'))).toBeNull();
  });
}
