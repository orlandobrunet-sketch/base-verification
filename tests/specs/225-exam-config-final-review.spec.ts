import {test,expect,type Page} from '@playwright/test';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';
import {medirContraste} from '../helpers/contraste';
import {injectGameState} from '../helpers/game';
const authors=Array.from({length:4},(_,i)=>({qid:'exam-config-'+i,t:'Configuração técnica',q:'Questão técnica '+i,opts:['Texto A '+i,'Texto B '+i,'Texto C '+i,'Texto D '+i],ans:i,exp:'Explicação reservada '+i,cat:'geral',diff:'medium',refs:[]}));
const KEY='nefroquest-exam-state';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test.beforeEach(async({page},info)=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await routeTechnicalQuestionBank(page,authors);await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
 const cold=info.title.includes('carregamento');
 if(cold){await page.locator('[data-portal-route="guest"]').focus();await page.keyboard.press('Enter');}
 else await page.locator('[data-portal-route="guest"]').click();
 await page.evaluate(async cold=>{if(!cold)await (window as any)._loadTopics();await (window as any).startExamMode();},cold);
});
async function begin(page:Page,count=2,minutes=3){await page.getByLabel('Quantidade de questões',{exact:true}).fill(String(count));await page.getByLabel('Tempo total em minutos',{exact:true}).fill(String(minutes));await page.getByRole('button',{name:'Começar prova',exact:true}).click();await expect(page.locator('#examOpts button')).toHaveCount(4);}
const saved=(page:Page)=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEY);
async function noCorrection(page:Page){
 await expect(page.locator('#examPage .nq-exam-veredito,#examPage .nq-exam-opcao-certa,#examPage .nq-exam-opcao-errada,#examPage .nq-exam-explicacao')).toHaveCount(0);
 await expect(page.locator('#examPage')).not.toContainText('Explicação reservada');
 await expect(page.locator('#examPage')).not.toContainText('Resposta correta');
}
test('configuração escolhe quantidade e duração antes de iniciar o relógio',async({page})=>{
 expect(await page.evaluate(()=>(0,eval)('_examState'))).toBeNull();expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBeNull();
 await begin(page);const s=await saved(page);expect(s.questions).toHaveLength(2);expect(s.questionCount).toBe(2);expect(s.durationSec).toBe(180);
 await expect(page.locator('#examTimer')).toContainText(/2:5\d|3:00/);expect(s.questionRevisionBindings).toHaveLength(2);
});
test('nenhuma correção aparece após responder, inclusive no DOM fechado',async({page})=>{
 // Este RED não depende dos controles novos: exercita a revelação legada.
 await page.getByRole('button',{name:'Começar prova',exact:true}).click();const q=(await saved(page)).questions[0];
 await page.locator('#examOpts button').nth((q.a+1)%4).click();await noCorrection(page);
 await expect(page.locator('#examCorrecao')).toBeFocused();await expect(page.locator('#examCorrecao')).toContainText('Resposta registrada');
 await expect(page.locator('#examOpts .nq-exam-marca')).toHaveText(['Sua resposta']);
});
test('retomada conserva duração, alternativa e correção apenas no fim',async({page})=>{
 await begin(page);let s=await saved(page);const q=s.questions[0],wrong=(q.a+1)%4;await page.locator('#examOpts button').nth(wrong).click();s=await saved(page);
 const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);await page.reload({waitUntil:'domcontentloaded'});
 // O visitante já está persistido: o reload restaura o Átrio, não o Portal.
 await expect(page.locator('#welcomeScreen')).toBeVisible();await expect(page.locator('#landingScreen')).toBeHidden();
 expect(await page.evaluate(()=>localStorage.getItem('nq_guest_mode'))).toBe('1');
 await page.locator('[data-atrium-route="modes"]').click();await page.locator('[data-mode-route="exam"]:visible').click();
 await expect(page.locator('#examPage')).toContainText('3 minutos');await page.getByRole('button',{name:'Retomar prova',exact:true}).click();await noCorrection(page);
 expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);expect((await saved(page)).startTime).toBe(s.startTime);
 await expect(page.locator('#examOpts .nq-exam-marca')).toHaveText(['Sua resposta']);await page.getByRole('button',{name:'Próxima questão',exact:true}).click();
 const next=(await saved(page)).questions[1];await page.locator('#examOpts button').nth(next.a).click();await noCorrection(page);await page.getByRole('button',{name:'Ver resultado',exact:true}).click();
 await expect(page.locator('#examResultado')).toBeVisible();await expect(page.locator('.nq-exam-erros')).toContainText(q.e);await expect(page.locator('.nq-exam-erros')).toContainText(q.o[wrong]);
 await expect(page.locator('.nq-exam-revisao-demais')).toContainText(next.e);await expect(page.locator('.nq-exam-opcao-certa')).toHaveCount(2);
});
for(const [count,minutes]of [[0,3],[1.5,3],[5,3],[2,0],[2,241]])test(`configuração inválida ${count}/${minutes} não inicia tentativa`,async({page})=>{
 await page.getByLabel('Quantidade de questões',{exact:true}).fill(String(count));await page.getByLabel('Tempo total em minutos',{exact:true}).fill(String(minutes));await page.getByRole('button',{name:'Começar prova',exact:true}).click();
 await expect(page.getByRole('alert')).toBeVisible();expect(await page.evaluate(()=>(0,eval)('_examState'))).toBeNull();expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBeNull();await expect(page.locator('#examTimer')).toHaveCount(0);
});
for(const minutes of [180,240]){
 test(`prova longa de${minutes}min retoma após duas horas e conclui preservando respostas`,async({page})=>{
  await begin(page,2,minutes);const initial=await saved(page);const wrong=(initial.questions[0].a+1)%initial.questions[0].o.length;
  await page.locator('#examOpts button').nth(wrong).click();await page.getByRole('button',{name:'Sair e continuar depois',exact:true}).click();
  const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);await page.clock.setFixedTime(new Date(initial.startTime+(minutes-30)*60000));
  await page.evaluate(()=>(window as any).startExamMode());await expect(page.getByRole('button',{name:'Retomar prova',exact:true})).toBeVisible();await page.getByRole('button',{name:'Retomar prova',exact:true}).click();
  await noCorrection(page);await expect(page.locator('#examTimer')).toHaveText('30:00 restantes');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);
  const restored=await page.evaluate(()=>(0,eval)('JSON.parse(JSON.stringify(_examState))'));expect(restored.durationSec).toBe(minutes*60);expect(restored.questions).toEqual(initial.questions);expect(restored.answers[0].chosen).toBe(wrong);expect(restored.startTime).toBe(initial.startTime);
  await page.getByRole('button',{name:'Próxima questão',exact:true}).click();const next=(await saved(page)).questions[1];await page.locator('#examOpts button').nth(next.a).click();await page.getByRole('button',{name:'Ver resultado',exact:true}).click();
  await expect(page.locator('#examResultado')).toContainText('1 de 2');await expect(page.locator('.nq-study-result-metrics dd').nth(3)).toHaveText(`${minutes-30}m0s`);await expect(page.locator('.nq-exam-erros')).toContainText(initial.questions[0].e);
 });
 test(`prova longa de${minutes}min vencida mantém registro e resultado no limite escolhido`,async({page})=>{
  await begin(page,2,minutes);const initial=await saved(page);await page.locator('#examOpts button').nth(initial.questions[0].a).click();await page.getByRole('button',{name:'Sair e continuar depois',exact:true}).click();const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);
  await page.clock.setFixedTime(new Date(initial.startTime+minutes*60000));await page.evaluate(()=>(window as any).startExamMode());
  await expect(page.locator('#examResultado')).toBeVisible();await expect(page.locator('#examResultado')).toContainText(`${minutes} minutos terminou`);await expect(page.locator('#examResultado')).toContainText('1 questão ficou sem resposta');await expect(page.locator('.nq-study-result-metrics dd').nth(3)).toHaveText(`${minutes}m0s`);expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);expect(await page.evaluate(()=>(0,eval)('_examState.answers[0].correct'))).toBe(true);
 });
}
test('save legado sem configuração mantém90min e não é regravado ao consultar',async({page})=>{
 await begin(page,1,3);await page.evaluate(key=>{(window as any)._examFechar();const s=JSON.parse(localStorage.getItem(key)!);delete s.durationSec;delete s.questionCount;localStorage.setItem(key,JSON.stringify(s));},KEY);
 const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);await page.evaluate(()=>(window as any).startExamMode());await page.getByRole('button',{name:'Retomar prova',exact:true}).click();
 expect(await page.evaluate(()=>(0,eval)('_examState.durationSec'))).toBe(5400);await expect(page.locator('#examTimer')).toContainText(/89:5\d|90:00/);expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);
});
test('duração inválida no save fica preservada e sem relógio',async({page})=>{
 await begin(page);await page.evaluate(key=>{(window as any)._examFechar();const s=JSON.parse(localStorage.getItem(key)!);s.durationSec=7201;localStorage.setItem(key,JSON.stringify(s));},KEY);
 const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);await page.evaluate(()=>(window as any).startExamMode());await expect(page.getByRole('heading',{name:'Prova preservada',exact:true})).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);await expect(page.locator('#examTimer')).toHaveCount(0);
});
test('resultado prematuro não revela respostas e o prazo impede resposta tardia',async({page})=>{
 await begin(page);await page.evaluate(()=>(window as any).showExamResults());await expect(page.locator('#examResultado')).toHaveCount(0);await noCorrection(page);
 const s=await saved(page);await page.clock.setFixedTime(new Date(s.startTime+s.durationSec*1000));await page.evaluate(()=>(window as any)._examAnswer(0));
 await expect(page.locator('#examResultado')).toBeVisible();await expect(page.locator('#examResultado')).toContainText('3 minutos terminou');await expect(page.locator('.nq-study-result-metrics')).toContainText('0 de 2');
});
test('último avanço de tentativa retomada já respondida preserva registro',async({page})=>{
 await begin(page,1);const s=await saved(page);await page.locator('#examOpts button').nth(s.questions[0].a).click();await page.evaluate(()=>(window as any)._examFechar());const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);
 await page.evaluate(()=>(window as any).startExamMode());await page.getByRole('button',{name:'Retomar prova',exact:true}).click();await noCorrection(page);await page.getByRole('button',{name:'Ver resultado',exact:true}).click();
 await expect(page.locator('#examResultado')).toContainText('100%');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);await page.getByRole('button',{name:'Voltar ao menu',exact:true}).click();expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);
});
test('prova de120min expirada fora do app oferece resultado sem apagar o save',async({page})=>{
 await begin(page,1,120);const s=await saved(page);await page.getByRole('button',{name:'Sair e continuar depois',exact:true}).click();const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);
 await page.clock.setFixedTime(new Date(s.startTime+7201000));await page.evaluate(()=>(window as any).startExamMode());
 await expect(page.locator('#examResultado')).toBeVisible();await expect(page.locator('#examResultado')).toContainText('120 minutos terminou');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);
});
test('prazo no avanço mantém as restantes sem resposta',async({page})=>{
 await begin(page);const s=await saved(page);await page.locator('#examOpts button').nth(s.questions[0].a).click();await page.clock.setFixedTime(new Date(s.startTime+180000));await page.evaluate(()=>(window as any)._examNext());
 await expect(page.locator('#examResultado')).toBeVisible();await expect(page.locator('#examResultado')).toContainText('1 questão ficou sem resposta');expect(await page.evaluate(()=>(0,eval)('_examState.answers[1].answered'))).toBe(false);
});
test('quantidade divergente no save fica preservada',async({page})=>{
 await begin(page);await page.evaluate(key=>{(window as any)._examFechar();const s=JSON.parse(localStorage.getItem(key)!);s.questionCount=3;localStorage.setItem(key,JSON.stringify(s));},KEY);const raw=await page.evaluate(key=>localStorage.getItem(key),KEY);
 await page.evaluate(()=>(window as any).startExamMode());await expect(page.getByRole('heading',{name:'Prova preservada',exact:true})).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);await expect(page.locator('#examTimer')).toHaveCount(0);
});
test('falha de carregamento mantém configuração e retry só inicia depois de conferir banco',async({page})=>{
 const abort=(r:any)=>r.abort();await page.route('**/data/topics.js*',abort);
 await page.getByLabel('Quantidade de questões',{exact:true}).fill('2');await page.getByLabel('Tempo total em minutos',{exact:true}).fill('3');await page.getByRole('button',{name:'Começar prova',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Não foi possível carregar');await expect(page.getByLabel('Quantidade de questões',{exact:true})).toHaveValue('2');await expect(page.getByLabel('Tempo total em minutos',{exact:true})).toHaveValue('3');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBeNull();expect(await page.evaluate(()=>(0,eval)('_examState'))).toBeNull();
 await page.unroute('**/data/topics.js*',abort);await page.getByRole('button',{name:'Começar prova',exact:true}).click();await expect(page.locator('#examOpts button')).toHaveCount(4);const s=await saved(page);expect(s.questions).toHaveLength(2);expect(s.durationSec).toBe(180);
});
test('início duplicado durante carregamento não cancela a primeira tentativa',async({page})=>{
 let release=()=>{};const gate=new Promise<void>(r=>{release=r;});let requested=0;page.on('request',r=>{if(new URL(r.url()).pathname.endsWith('/data/topics.js'))requested++;});
 await page.route('**/data/topics.js*',async route=>{await gate;await route.fallback();});
 await page.getByLabel('Quantidade de questões',{exact:true}).fill('2');await page.getByLabel('Tempo total em minutos',{exact:true}).fill('3');
 const button=page.locator('[data-action="_examComecar"]');
 try{await button.click();await expect(button).toBeDisabled();expect(await page.evaluate(()=>(0,eval)('_examState'))).toBeNull();await page.evaluate(()=>(window as any)._examComecar());}finally{release();}
 await expect(page.locator('#examOpts button')).toHaveCount(4);const s=await saved(page);expect(s.questions).toHaveLength(2);expect(s.durationSec).toBe(180);expect(requested).toBe(1);
});
test('configuração não muda durante carregamento da tentativa iniciada',async({page})=>{
 let release=()=>{};const gate=new Promise<void>(r=>{release=r;});await page.route('**/data/topics.js*',async route=>{await gate;await route.fallback();});
 await page.getByLabel('Quantidade de questões',{exact:true}).fill('2');await page.getByLabel('Tempo total em minutos',{exact:true}).fill('3');
 try{await page.getByRole('button',{name:'Começar prova',exact:true}).click();await expect(page.getByLabel('Quantidade de questões',{exact:true})).toBeDisabled();await expect(page.getByLabel('Tempo total em minutos',{exact:true})).toBeDisabled();}finally{release();}
 await expect(page.locator('#examOpts button')).toHaveCount(4);const s=await saved(page);expect(s.questions).toHaveLength(2);expect(s.durationSec).toBe(180);
});
test('teclado nos campos configura sem responder a jornada escondida',async({page})=>{
 await page.evaluate(()=>(window as any)._examFechar());await injectGameState(page);await page.evaluate(()=>(window as any).startExamMode());
 const count=page.getByLabel('Quantidade de questões',{exact:true}),time=page.getByLabel('Tempo total em minutos',{exact:true});await count.fill('1');await count.press('ArrowUp');await expect(count).toHaveValue('2');await time.fill('3');await time.press('4');await expect(time).toHaveValue('34');
 expect(await page.evaluate(()=>(0,eval)('state.answered'))).toBe(false);expect(await page.evaluate(()=>(0,eval)('_examState'))).toBeNull();await time.press('Tab');await expect(page.getByRole('button',{name:'Começar prova',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#examOpts button')).toHaveCount(4);expect((await saved(page)).durationSec).toBe(2040);expect((await saved(page)).questions).toHaveLength(2);
});
test('relógio retrocedido não concede saldo maior nem revela resultado',async({page})=>{
 await begin(page);const s=await saved(page);await page.clock.setFixedTime(new Date(s.startTime-60000));await page.evaluate(()=>(window as any)._updateExamTimer());await expect(page.locator('#examTimer')).toHaveText('3:00 restantes');await expect(page.locator('#examResultado')).toHaveCount(0);expect((await saved(page)).startTime).toBe(s.startTime);await noCorrection(page);
});
for(const legacy of [false,true])test(`tentativa concluída${legacy?' legada':''} mantém tempo registrado ao consultar após o prazo e retenção`,async({page})=>{
 await begin(page,1,3);const s=await saved(page);await page.locator('#examOpts button').nth(s.questions[0].a).click();
 const raw=await page.evaluate(({key,legacy})=>{(window as any)._examFechar();const finished=JSON.parse(localStorage.getItem(key)!);finished.idx=finished.questions.length;finished.savedAt=finished.startTime+2000;if(legacy){delete finished.durationSec;delete finished.questionCount;}const raw=JSON.stringify(finished);localStorage.setItem(key,raw);return raw;},{key:KEY,legacy});
 await page.clock.setFixedTime(new Date(s.startTime+121*60000));await page.evaluate(()=>(window as any).startExamMode());
 await expect(page.locator('#examResultado')).toBeVisible();await expect(page.locator('#examResultado .nq-exam-aviso')).toHaveCount(0);await expect(page.locator('.nq-study-result-metrics dd').nth(3)).toHaveText('0m2s');await expect(page.locator('#examResultado')).toContainText('100%');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(raw);
});
for(const width of [320,390,1280])test(`configuração,pergunta e resultado legíveis em${width}px e fonte ampliada`,async({page},info)=>{
 await page.setViewportSize({width,height:740});
 async function inspect(stage:string){for(const font of [16,32]){
  await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',font);
  await page.locator('#examPage').evaluate(async el=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
  const clipped=await page.locator('#examPage').evaluate(el=>[...el.querySelectorAll('p,h1,h2,button,input,li')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&(r.left<-.5||r.right>innerWidth+.5)}).map(n=>n.tagName+':'+n.textContent?.slice(0,25)));
  expect(clipped).toEqual([]);expect(await page.locator('#examPage').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  for(const control of await page.locator('#examPage button,#examPage input,#examPage summary').all()){if(await control.isVisible())expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);}
  expect(await page.evaluate(medirContraste,'#examPage')).toEqual([]);
  if(process.env.NQ_CAPTURE_DIR)await page.screenshot({path:process.env.NQ_CAPTURE_DIR+`/exam-${stage}-${width}-${font}-${info.project.name}.png`,fullPage:true});
 }}
 await inspect('setup');await begin(page);let s=await saved(page);await page.locator('#examOpts button').nth((s.questions[0].a+1)%4).click();await noCorrection(page);await inspect('question');
 await page.getByRole('button',{name:'Próxima questão',exact:true}).click();s=await saved(page);await page.locator('#examOpts button').nth(s.questions[1].a).click();await page.getByRole('button',{name:'Ver resultado',exact:true}).click();
 await page.locator('.nq-exam-erros summary').click();await page.locator('.nq-exam-revisao-demais summary').click();await expect(page.locator('.nq-exam-opcao-certa')).toHaveCount(2);await expect(page.locator('.nq-exam-opcao-errada')).toHaveCount(1);await inspect('result');
});
