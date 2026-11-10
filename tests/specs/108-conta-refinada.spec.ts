import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test('conta preserva preferências, cancelamento e fechamento da confirmação',async({page})=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 const owner={id:'00000000-0000-4000-8000-000000000001',user_metadata:{},app_metadata:{}};
 const accountKey='nefroquest-account:'+owner.id;
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{}, {authUser:owner});
 await page.evaluate(key=>{localStorage.setItem(key,JSON.stringify({name:'Pessoa',phone:'123',spec:'Nefrologia',city:'Recife'}));(window as any).openAccountModal();},accountKey);
 const card=page.getByRole('dialog',{name:'Minha Conta'});await expect(card.locator('#acctName')).toHaveValue('Pessoa');await expect(card.locator('#acctEmail')).toBeDisabled();await card.locator('#acctName').fill('Não salvar');await card.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(card).toBeHidden();
 await page.evaluate(()=>(window as any).openAccountModal());await expect(card.locator('#acctName')).toHaveValue('Pessoa');await card.getByRole('button',{name:'Excluir minha conta',exact:true}).click();const confirm=page.getByRole('dialog',{name:'Excluir Conta',exact:true});await expect(confirm).toBeVisible();await confirm.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(confirm).toHaveCount(0);await expect(card).toBeVisible();expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).name,accountKey)).toBe('Pessoa');await page.keyboard.press('Escape');await expect(card).toBeHidden();
});
