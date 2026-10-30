import{test,expect}from'@playwright/test';test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
const cards={nephros:['O Reino dos Néfrons está sob ameaça.','Você enxerga o que outros ignoram: cada questão correta é um néfron preservado.'],aquaria:['Onde outros veem números, você vê correntes.','Cada resposta certa é uma maré controlada.'],glomerulus:['A guerra acontece no nível celular.','Seu raciocínio é sua arma, as diretrizes são sua armadura.']};
for(const[key,copy]of Object.entries(cards))test('black cards stay readable, pause and lead into moving film: '+key,async({page})=>{
 await page.goto('/cinema-preview.html',{waitUntil:'domcontentloaded'});await page.locator('[data-preview="'+key+'"]').click();const d=page.locator('dialog[open]'),card=d.locator('.nq-movie-prologue'),text=card.locator('.nq-prologue-copy');await expect(card).toBeVisible();await expect(text).toHaveText(copy[0]);expect(await card.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(0, 0, 0)');
 expect(await card.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);await expect(d.locator('video')).toHaveJSProperty('paused',true);
 await d.getByRole('button',{name:'Pausar história',exact:true}).click();await page.waitForTimeout(4300);await expect(text).toHaveText(copy[0]);
 await d.getByRole('button',{name:'Avançar',exact:true}).click();await expect(text).toHaveText(copy[1]);await d.getByRole('button',{name:'Pular histórias',exact:true}).click();await expect(card).toHaveCount(0);
 await expect.poll(()=>d.locator('video').evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);await d.getByRole('button',{name:'Pular introdução',exact:true}).click();await expect(d).toBeHidden();
});

test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinema only; native touch presentation is preserved.');});
