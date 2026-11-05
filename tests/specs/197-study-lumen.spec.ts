import {test,expect,type Page} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {medirContraste} from '../helpers/contraste';
test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
async function enterStudy(page:Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/',{waitUntil:'domcontentloaded'});await injectGameState(page);await page.waitForLoadState('load');await page.evaluate(()=>(window as any).openGameModesPopup());await page.locator('[data-mode-route="study"]:visible').click();await page.getByRole('button',{name:'Iniciar estudo livre',exact:true}).click();await expect(page.locator('#studyOptions button')).toHaveCount(4);await page.evaluate(()=>document.fonts.ready);
}
async function readingFits(page:Page){
 await expect(page.locator('#studyQuestionArea')).toHaveCSS('background-image','none');for(const option of await page.locator('#studyOptions button').all())await expect(option).toHaveCSS('background-image','none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const clipped=await page.locator('#studyModePage h1,.nq-study-question-title,.nq-study-option-text,.nq-study-feedback-copy').evaluateAll(nodes=>nodes.flatMap(el=>{const r=document.createRange();r.selectNodeContents(el);return [...r.getClientRects()].some(b=>b.left<0||b.right>innerWidth+1)?[el.textContent]:[];}));expect(clipped).toEqual([]);
 expect(await page.evaluate(medirContraste,'#studyModePage')).toEqual([]);
}
for(const layout of [{width:1159,height:684,font:16},{width:320,height:740,font:32}])test(`study question and both correction states remain readable at ${layout.width}/${layout.font}`,async({page})=>{
 await page.setViewportSize({width:layout.width,height:layout.height});await enterStudy(page);await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',layout.font);await expect(page.locator('html')).toHaveCSS('font-size',layout.font+'px');
 expect(await page.locator('#studyModePage h1').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Alegreya');
 const first=await page.evaluate(()=>(0,eval)('_studyPresentations[studyModeIndex]'));
 await expect(page.locator('.nq-study-question-title')).toHaveText(first.q);await expect(page.locator('.nq-study-option-text')).toHaveText(first.o);await readingFits(page);for(let i=0;i<4;i++)await expect(page.locator('#studyOptions button').nth(i)).toHaveAccessibleName(new RegExp('^'+String.fromCharCode(65+i)+'\\)'));await test.info().attach('study-question',{body:await page.screenshot(),contentType:'image/png'});
 await page.locator('#studyOptions button').nth(first.a).click();await expect(page.locator('#studyFeedback')).toBeFocused();await expect(page.locator('.study-option-btn.is-correct')).toHaveCount(1);await expect(page.locator('#studyCorrect')).toHaveText('1');await expect(page.locator('.nq-study-feedback-copy')).toHaveText(first.e||'A resposta correta é a alternativa '+String.fromCharCode(65+first.a)+'.');await readingFits(page);await test.info().attach('study-correct',{body:await page.screenshot(),contentType:'image/png'});
 await page.locator('[data-action="nextStudyQuestion"]').click();await expect(page.locator('#studyProgress')).toHaveText('2');await expect(page.locator('#studyQuestionArea')).toBeFocused();const second=await page.evaluate(()=>(0,eval)('_studyPresentations[studyModeIndex]'));await page.locator('#studyOptions button').nth((second.a+1)%4).click();await expect(page.locator('.study-option-btn.is-wrong')).toHaveCount(1);await expect(page.locator('#studyWrong')).toHaveText('1');await readingFits(page);await test.info().attach('study-wrong',{body:await page.screenshot(),contentType:'image/png'});
 await page.getByRole('button',{name:'Pausar e voltar',exact:true}).click();await expect(page.locator('#mainApp')).toBeVisible();expect(await page.locator('#mainApp').evaluate((el:HTMLElement)=>el.inert)).toBe(false);
});
