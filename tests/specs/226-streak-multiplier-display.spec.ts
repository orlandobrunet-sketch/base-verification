import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test('multiplicador só aparece quando efetivo, usa decimal PT-BR e some ao errar',async({page})=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await routeTechnicalQuestionBank(page,Array.from({length:4},(_,i)=>({qid:'streak-display-'+i,t:'Sequência técnica',q:'Questão de sequência '+i,opts:['A','B','C','D'],ans:i,exp:'Explicação técnica',cat:'geral',diff:'medium',refs:[]})));
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page,{streak:0});
 const multiplier=page.locator('#guardianStreakMultiplier');
 for(const streak of [0,1,2]){await page.evaluate(n=>(0,eval)(`state.streak=${n};renderHUD()`),streak);await expect(multiplier).toHaveText('');await expect(multiplier).toBeHidden();}
 for(const [streak,value]of [[3,'1,25'],[5,'1,5'],[7,'1,75'],[10,'2'],[15,'2,5']] as const){
  await page.evaluate(n=>(0,eval)(`state.streak=${n};renderHUD()`),streak);await expect(multiplier).toHaveText('×'+value);
  // O painel desktop é ocultado pelo layout mobile, mas o elemento deve sair do estado hidden.
  expect(await multiplier.evaluate(el=>el.hidden)).toBe(false);
 }
 const wrong=await page.evaluate(()=>(0,eval)('(state.current.a+1)%state.current.o.length'));await page.locator('#options .option').nth(wrong).click();
 expect(await page.evaluate(()=>(0,eval)('state.streak'))).toBe(0);await expect(multiplier).toHaveText('');await expect(multiplier).toBeHidden();
});
