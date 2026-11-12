import {test,expect,type Page} from '@playwright/test';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.beforeEach(async({context,baseURL})=>{const origin=new URL(baseURL!).origin;await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===origin?r.continue():r.abort());await context.routeWebSocket('**/*',s=>s.close());});
async function open(page:Page,mode='normal'){
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.locator('[data-portal-route="guest"]').click();
 await page.locator('[data-action="startNewFromWelcome"]').click();await page.locator(`[data-diff-key="${mode}"][role="radio"]`).click();await page.locator('#diffConfirmBtn').click();
 const choice=page.locator('#charSelectModal');await expect(choice).toBeVisible();return choice;
}
test('preview integrado mostra história completa e troca de classe sem gravar progresso',async({page})=>{
 const choice=await open(page);await expect(choice.locator('#nqcProfile')).toBeVisible();
 const snapshot=()=>page.evaluate(()=>({save:localStorage.getItem('nefroquest-save-v7'),mirror:localStorage.getItem('nefroquest-save'),pilot:localStorage.getItem('nefroquest-pilot-v1'),state:(0,eval)('JSON.stringify({character:state.character,xp:state.xp,lives:state.lives,correctTotal:state.correctTotal,gameStarted:state.gameStarted})')}));const before=await snapshot();
 for(const id of ['aquaria','glomerulus','nephros']){
  await choice.locator(`[data-char="${id}"]`).click();await expect(choice).toHaveAttribute('data-preview-character',id);
  const actual=await page.evaluate(id=>({story:(0,eval)(`CHARACTER_INTROS[${JSON.stringify(id)}].text`),name:(0,eval)(`characters[${JSON.stringify(id)}].name`)}),id);
  await expect(choice.locator('#nqcProfileStory')).toHaveText(actual.story);await expect(choice.locator('#nqcProfileName')).toHaveText(actual.name);
  await expect(choice.locator('#nqcProfileStory')).toBeVisible();await expect(choice.locator('#nqcProfileStory')).not.toHaveJSProperty('hidden',true);await expect(choice.locator('details')).toHaveCount(0);
  expect(await snapshot()).toEqual(before);await expect(page.locator('#charIntroOverlay')).toHaveCount(0);await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
 }
 await choice.getByRole('button',{name:'Fechar escolha de classe'}).click();expect(await snapshot()).toEqual(before);expect(await page.evaluate(()=>(window as any)._pendingDiff)).toBeNull();
});
