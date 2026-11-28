import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {medirContraste} from '../helpers/contraste';
test.use({serviceWorkers:'block',contextOptions: { reducedMotion:'reduce' }});
for(const path of ['/privacy-policy.html','/404.html','/offline.html'])test('apoio legível em 320 px com texto ampliado: '+path,async({page},info)=>{test.skip(info.project.name!=='chromium');await page.setViewportSize({width:320,height:844});await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto(path);await page.addStyleTag({content:'html{font-size:32px!important}'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.evaluate(medirContraste,'body')).toEqual([]);});

test('a 404 mantém os caminhos de volta acima da ilustração em tela curta', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const origin = new URL(baseURL || 'http://localhost:5500').origin;
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto('/404.html');

  const heading = page.getByRole('heading', { name: 'Página não encontrada', level: 1 });
  const atrium = page.getByRole('link', { name: 'Voltar ao Átrio' });
  const home = page.getByRole('link', { name: 'Página inicial' });
  await expect(heading).toBeInViewport({ ratio: 1 });
  await expect(atrium).toBeInViewport({ ratio: 1 });
  await expect(home).toBeInViewport({ ratio: 1 });
  await expect(atrium).toHaveAttribute('href', '/jogar/');
  await expect(home).toHaveAttribute('href', '/');

  const [atriumBox, homeBox, mapBox] = await Promise.all([
    atrium.boundingBox(), home.boundingBox(), page.locator('.map').boundingBox(),
  ]);
  expect(atriumBox!.height).toBeGreaterThanOrEqual(44);
  expect(homeBox!.height).toBeGreaterThanOrEqual(44);
  expect(mapBox!.y).toBeGreaterThanOrEqual(homeBox!.y + homeBox!.height);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'NefroQuest' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(atrium).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(home).toBeFocused();
});

test('novidades mantém histórico, rolagem por teclado e fechamento',async({page})=>{await page.setViewportSize({width:320,height:844});await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/');await injectGameState(page,{}, {asGuest:true});await page.evaluate(()=>(window as any).showChangelog());await expect(page.getByRole('dialog')).toHaveCount(1);const card=page.getByRole('dialog',{name:'Novidades'});await expect(card).toBeVisible();await page.addStyleTag({content:'html{font-size:32px!important}'});expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await expect(card.getByText('Baú de Relíquias Redesenhado',{exact:true})).toBeVisible();await card.getByRole('region').focus();await page.keyboard.press('End');await expect.poll(()=>card.getByRole('region').evaluate(el=>el.scrollTop>0)).toBe(true);await card.getByRole('button',{name:'Fechar',exact:true}).click();await expect(card).toHaveCount(0);});
