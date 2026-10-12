import {test,expect,type Page} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {medirContraste} from '../helpers/contraste';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});

const reviewRecords = [
 {q:'Questão de teste: preserve <texto>, acentos e pontuação.',o:['Alternativa A com texto longo de teste. '.repeat(9),'Alternativa B com texto longo de teste. '.repeat(7),'Alternativa C com texto longo de teste. '.repeat(8),'Alternativa D com texto longo de teste. '.repeat(6)],a:2,chosen:0,e:'Explicação de teste, sem alteração do texto original.\n\n' + 'Detalhe preservado para exercitar a leitura completa. '.repeat(18)},
 {q:'Questão antiga de teste sem alternativa escolhida registrada.',o:['Primeira alternativa de teste. '.repeat(7),'Segunda alternativa de teste. '.repeat(9),'Terceira alternativa de teste. '.repeat(6),'Quarta alternativa de teste. '.repeat(8)],a:0,e:'Explicação antiga preservada.\n\n' + 'Este parágrafo longo exercita a mesma área de rolagem. '.repeat(18)},
 {q:'Questão de teste com índice escolhido inválido.',o:['Opção A de teste. '.repeat(8),'Opção B de teste. '.repeat(9),'Opção C de teste. '.repeat(6),'Opção D de teste. '.repeat(7)],a:3,chosen:999,e:'Explicação final preservada.\n\n' + 'O texto continua até o fim sem ficar sob o botão. '.repeat(18) + '\nFim da explicação de teste.'},
];

async function abrirReview(page: Page, width: number, height: number, fontSize: number) {
 await page.setViewportSize({width,height});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
 await injectGameState(page);
 await page.waitForLoadState('load');
 await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',fontSize);
 await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
 await page.evaluate(records=>{
  (0,eval)(`_sessionWrongAnswers.splice(0, _sessionWrongAnswers.length, ...${JSON.stringify(records)})`);
  (window as any).showSessionWrongAnswers();
 },reviewRecords);
 return page.getByRole('dialog',{name:'Erros da Jornada'});
}

for (const viewport of [
 {width:1280,height:800,fontSize:16},{width:390,height:844,fontSize:16},
 {width:320,height:568,fontSize:16},{width:320,height:568,fontSize:32},
]) test(`Erros da Jornada preserva textos e uma única leitura em ${viewport.width}px com texto a ${viewport.fontSize/16*100}%`,async({page})=>{
 const card=await abrirReview(page,viewport.width,viewport.height,viewport.fontSize);
 await expect(card).toBeVisible();
 await expect(card.locator('#sessionReviewCount')).toHaveText('3 questões erradas nesta sessão');
 const reading=card.getByRole('region',{name:'Revisão dos erros da sessão'});
 await expect(reading).toBeFocused();
 const recordsBefore=await page.evaluate(()=>(0,eval)('JSON.stringify(_sessionWrongAnswers)'));
 const articles=card.locator('.nqreview-question-card');
 await expect(articles).toHaveCount(reviewRecords.length);
 for(let index=0;index<reviewRecords.length;index++){
  const record=reviewRecords[index],article=articles.nth(index);
  expect(await article.locator('.nqreview-question').textContent()).toBe(record.q);
  expect(await article.locator('.nqreview-option-text').allTextContents()).toEqual(record.o);
  expect(await article.locator('.nqreview-explanation p').textContent()).toBe(record.e);
  expect(await article.locator('.nqreview-letter').allTextContents()).toEqual(['A','B','C','D']);
  await expect(article.locator('.is-correct')).toHaveCount(1);
  await expect(article.locator('.is-correct')).toHaveAttribute('data-option-index',String(record.a));
  await expect(article.locator('.nqreview-status--correct')).toHaveText('Resposta correta');
  await expect(article.locator('.nqreview-status--chosen')).toHaveCount(index===0?1:0);
  await expect(article.locator('.nqreview-unrecorded')).toHaveCount(index===0?0:1);
  if(index===0){
   await expect(article.locator('.is-chosen')).toHaveAttribute('data-option-index','0');
   await expect(article.locator('.nqreview-status--chosen')).toHaveText('Sua resposta');
  }
  const columns=await article.locator('.nqreview-option').evaluateAll(options=>options.map(option=>{
   const letter=option.querySelector('.nqreview-letter')!.getBoundingClientRect();
   const text=option.querySelector('.nqreview-option-content')!.getBoundingClientRect();
   return {letterLeft:letter.left,letterRight:letter.right,textLeft:text.left};
  }));
  expect(Math.max(...columns.map(c=>c.letterLeft))-Math.min(...columns.map(c=>c.letterLeft))).toBeLessThanOrEqual(1);
  expect(Math.max(...columns.map(c=>c.textLeft))-Math.min(...columns.map(c=>c.textLeft))).toBeLessThanOrEqual(1);
  expect(columns.every(c=>c.textLeft>=c.letterRight+4),'letras em uma coluna separada do texto').toBe(true);
 }
 const geometry=await card.evaluate(el=>{
  const title=el.querySelector('h2')!,count=el.querySelector('#sessionReviewCount')!;
  const reading=el.querySelector('.nqreview-reading')!,footer=el.querySelector('.nqreview-footer')!;
  const scrolling=[el.parentElement!,el,...el.querySelectorAll('*')].filter(node=>{
   const style=getComputedStyle(node);
   return /auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+1;
  });
  return {headerAligned:Math.abs(title.getBoundingClientRect().left-count.getBoundingClientRect().left)<=1,
   titleFont:parseFloat(getComputedStyle(title).fontSize),rootFont:parseFloat(getComputedStyle(document.documentElement).fontSize),
   singleScroll:scrolling.length===1&&scrolling[0]===reading,
   readingBottom:reading.getBoundingClientRect().bottom,footerTop:footer.getBoundingClientRect().top,
   horizontalContained:el.scrollWidth<=el.clientWidth};
 });
 expect(geometry.headerAligned).toBe(true);
 expect(geometry.titleFont).toBeLessThanOrEqual(geometry.rootFont*1.3);
 expect(geometry.singleScroll,'somente a lista de questões rola').toBe(true);
 expect(geometry.horizontalContained).toBe(true);
 expect(geometry.readingBottom).toBeLessThanOrEqual(geometry.footerTop+1);
 await reading.focus();await page.keyboard.press('End');
 await expect.poll(()=>reading.evaluate(el=>Math.abs(el.scrollTop+el.clientHeight-el.scrollHeight))).toBeLessThanOrEqual(1);
 const end=await card.evaluate(el=>({
  textBottom:el.querySelector('.nqreview-question-card:last-child .nqreview-explanation p')!.getBoundingClientRect().bottom,
  footerTop:el.querySelector('.nqreview-footer')!.getBoundingClientRect().top,
 }));
 expect(end.textBottom,'fim da explicação permanece acima do rodapé').toBeLessThanOrEqual(end.footerTop-8);
 const close=card.getByRole('button',{name:'Fechar',exact:true}),button=(await close.boundingBox())!;
 expect(button.x).toBeGreaterThanOrEqual(0);expect(button.x+button.width).toBeLessThanOrEqual(viewport.width);
 expect(button.y).toBeGreaterThanOrEqual(0);expect(button.y+button.height).toBeLessThanOrEqual(viewport.height);
 expect(button.height).toBeGreaterThanOrEqual(44);
 for(const key of ['Tab','Tab','Shift+Tab']){await page.keyboard.press(key);expect(await card.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
 const contrast=await page.evaluate(medirContraste,'.nqreview-card');expect(contrast,JSON.stringify(contrast)).toEqual([]);
 if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:`${process.env.NQ_CAPTURE_DIR}/erros-jornada-${test.info().project.name}-${viewport.width}-${viewport.fontSize}.png`});
 await close.click();await expect(card).toHaveCount(0);
 expect(await page.evaluate(()=>(0,eval)('JSON.stringify(_sessionWrongAnswers)'))).toBe(recordsBefore);
 await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});
for(const fn of ['showPrivacyPolicy','showStatsModal','showSessionWrongAnswers'])test(fn+' mantém leitura, foco e fechamento em 320 px',async({page},info)=>{test.skip(info.project.name!=='chromium');await page.setViewportSize({width:320,height:844});await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/');await injectGameState(page);await page.evaluate(fn=>{if(fn==='showStatsModal')(0,eval)('getDetailedStats=(()=>{const original=getDetailedStats;return()=>({...original(),totalQuestions:5,totalCorrect:2,byTopic:{"Tema de teste com título extenso":{total:5,correct:2,wrong:3}},questionHistory:[{date:"2026-10-03",correct:false},{date:"2026-10-04",correct:true},{date:"2026-10-05",correct:false}]});})()');if(fn==='showSessionWrongAnswers')(0,eval)('_sessionWrongAnswers.push({q:"Questão de teste",o:["A","B","C","D"],a:0,chosen:1,e:"Explicação completa de teste."})');(window as any)[fn]();},fn);const card=page.getByRole('dialog');await expect(card).toHaveCount(1);await expect(card).toBeVisible();await expect(fn==='showSessionWrongAnswers'?card.getByRole('region',{name:'Revisão dos erros da sessão'}):card.getByRole('region')).toBeFocused();await page.addStyleTag({content:'html{font-size:32px!important}'});expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await card.evaluate(el=>el.setAttribute('data-final-popup','1'));expect(await card.evaluate(el=>{const errors:string[]=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let n=walker.nextNode();n;n=walker.nextNode()){if(!(n.textContent||'').trim())continue;const range=document.createRange();range.selectNodeContents(n);if([...range.getClientRects()].some(r=>r.width&&(r.left<0||r.right>innerWidth)))errors.push((n.textContent||'').trim());}return errors;})).toEqual([]);const contrast=await page.evaluate(medirContraste,'[data-final-popup]');expect(contrast,JSON.stringify(contrast)).toEqual([]);for(let i=0;i<5;i++){await page.keyboard.press('Tab');expect(await card.evaluate(el=>el.contains(document.activeElement))).toBe(true);}await page.keyboard.press('Escape');await expect(card).toHaveCount(0);});
