import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';
import {attachFailureEvidence} from '../helpers/failure-evidence';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
test.afterEach(async({page},info)=>{
 if(info.status!==info.expectedStatus)await attachFailureEvidence(page,info);
});
test('Sequência no painel exibe só a quantidade sem mudar os multiplicadores da pontuação',async({page})=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await routeTechnicalQuestionBank(page,Array.from({length:4},(_,i)=>({qid:'streak-display-'+i,t:'Sequência técnica',q:'Questão de sequência '+i,opts:['A','B','C','D'],ans:i,exp:'Explicação técnica',cat:'geral',diff:'medium',refs:[]})));
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await page.locator('[data-portal-route="guest"]').click();await injectGameState(page,{streak:0});
 const streakCount=page.locator('#streak');
 await expect(page.locator('#guardianStreakMultiplier')).toHaveCount(0);
 for(const [streak,value]of [[0,1],[2,1],[3,1.25],[5,1.5],[7,1.75],[10,2],[15,2.5]] as const){
  const mult=await page.evaluate(n=>(0,eval)(`state.streak=${n};renderHUD();getStreakMultiplier(state.streak).mult`),streak);
  await expect(streakCount).toHaveText(String(streak));
  expect(mult).toBe(value);
 }
 const wrong=await page.evaluate(()=>(0,eval)('(state.current.a+1)%state.current.o.length'));await page.locator('#options .option').nth(wrong).click();
 expect(await page.evaluate(()=>(0,eval)('state.streak'))).toBe(0);await expect(streakCount).toHaveText('0');
});
