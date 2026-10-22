import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

// Apresentação apenas: fixtures descartáveis, sem clicar em forjar/equipar/vender.
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function abrir(page: Page, width: number, gold = 5000) {
  await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    return ['localhost', '127.0.0.1'].includes(url.hostname) && ['GET', 'HEAD'].includes(request.method())
      ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold, character: 'nephros' });
  await page.evaluate(() => document.fonts.ready);
  const origin = page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first();
  await origin.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#forjaPage')).toBeVisible();
  return origin;
}

const economia = (page: Page) => page.evaluate(() => (0, eval)(
  'JSON.stringify({gold:state.gold,equipment:state.equipment,obtainedItems:state.obtainedItems,forjaPending:state.forjaPending})',
) as string);

async function semCortes(page: Page) {
  const violations = await page.locator('#forjaPage').evaluate(root => {
    const result: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) result.push('overflow horizontal');
    for (const el of root.querySelectorAll('button,summary,p,h1,h2,h3,article')) {
      const rect = el.getBoundingClientRect();
      if (rect.width && (rect.left < -1 || rect.right > innerWidth + 1)) result.push(el.className || el.tagName);
      if (el.matches('button,summary') && rect.width && rect.height < 44) result.push('alvo menor que44px');
    }
    return result;
  });
  expect(violations).toEqual([]);
}

test('shell amplo e escolhas sobem no desktop sem alterar custos ou ações', async ({ page }) => {
  await abrir(page, 1440);
  const before = await economia(page);
  const root = page.locator('#forjaPage');
  await expect(root.getByRole('heading', { name: 'Forja', level: 1 })).toBeVisible();
  await expect(root.locator('.nq-forja-ouro')).toContainText('5000');
  await expect(root.locator('.nq-forja-guardiao, .nq-forja-bigorna')).toHaveCount(0);
  const shell = (await root.locator('.nq-forja-shell').boundingBox())!;
  const options = (await root.locator('.nq-forja-opcoes').boundingBox())!;
  expect(shell.width).toBeGreaterThan(1200);
  expect(options.y).toBeLessThan(450);
  for (const [kind, cost, title] of [['comum', '300', 'Forjar item aleatório'], ['lendario', '1000', 'Forjar item lendário']]) {
    const option = root.locator(`[data-forge-kind="${kind}"]`);
    await expect(option.locator('.nq-forja-custo')).toHaveText(`${cost} de ouro`);
    await expect(option.getByRole('button', { name: title, exact: true })).toHaveAttribute('data-action', 'forjarNaPagina');
    await expect(option.getByRole('button', { name: title, exact: true })).toHaveAttribute('data-arg', kind);
  }
  await root.getByText('Equipamento atual', { exact: true }).click();
  await expect(root.locator('.nq-forja-grade .nq-forja-item')).toHaveCount(6);
  await semCortes(page);
  expect(await economia(page)).toBe(before);
});

for (const width of [320, 390, 1440]) {
  test(`texto ampliado200% permanece acessível em${width}px sem transação`, async ({ page }) => {
    await abrir(page, width);
    const before = await economia(page);
    await semCortes(page);
    if (width < 500) expect((await page.locator('.nq-forja-opcoes').boundingBox())!.y).toBeLessThan(550);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await page.locator('#forjaEquipTitulo').click();
    await semCortes(page);
    for (const selector of ['.nq-forja-ouro', '.nq-forja-convite p', '.nq-forja-opcao > p', '.nq-forja-rota', '.nq-forja-custo', '.btn', '.nq-forja-vazio']) {
      expect(await page.evaluate(medirContraste, `#forjaPage ${selector}`), selector).toEqual([]);
    }
    expect(await economia(page)).toBe(before);
  });
}

for (const width of [390, 1440]) {
  test(`teclado e saída preservam foco e economia em${width}px`, async ({ page }) => {
    const origin = await abrir(page, width);
    const before = await economia(page);
    await page.keyboard.press('Tab');
    const common = page.getByRole('button', { name: 'Forjar item aleatório', exact: true });
    await expect(common).toBeFocused();
    expect(await common.evaluate(el => el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none')).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Forjar item lendário', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#forjaPage')).toHaveCount(0);
    await expect(origin).toBeFocused();
    expect(await economia(page)).toBe(before);
  });
}

test('bloqueios de saldo e descrições continuam explícitos', async ({ page }) => {
  await abrir(page, 390, 100);
  const before = await economia(page);
  await expect(page.getByRole('button', { name: 'Forjar item aleatório', exact: true })).toBeDisabled();
  await expect(page.locator('#forjaMotivo-comum')).toHaveText('Faltam 200 de ouro.');
  await expect(page.getByRole('button', { name: 'Forjar item lendário', exact: true })).toBeDisabled();
  await expect(page.locator('#forjaMotivo-lendario')).toHaveText('Faltam 900 de ouro.');
  await semCortes(page);
  expect(await economia(page)).toBe(before);
});

test('decisão sintética preserva resultado e bloqueios, inclusive com texto ampliado', async ({ page }) => {
  await abrir(page, 320);
  await page.evaluate(() => (0, eval)(`
    state.equipment.weapon = {n:'Arma atual de teste com nome longo',rar:'common',atk:1,def:1,kno:1,luck:1};
    state.forjaPending = {slot:'weapon',atual:state.equipment.weapon,novo:{n:'Equipamento recém-forjado de teste com nome longo',rar:'rare',atk:3,def:2,kno:1,luck:2},custo:300};
    _renderForja(); _forjaFocarResultado();
  `));
  const before = await economia(page);
  await expect(page.locator('#forjaResultado')).toHaveCount(1);
  await expect(page.locator('#forjaResultado')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#forjaResultado [data-arg="substituir"]')).toBeFocused();
  await expect(page.getByRole('button', { name: '← Voltar à jornada', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Forjar item aleatório', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#forjaPage')).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await semCortes(page);
  expect(await economia(page)).toBe(before);
});

test('conclusão sintética conserva recibo e ação de nova forja', async ({ page }) => {
  await abrir(page, 1440);
  await page.evaluate(() => (0, eval)(`
    _forja.ultimo = {item:{n:'Equipamento final de teste',rar:'rare',atk:3,def:2,kno:1,luck:2},slot:'weapon',msg:'Equipamento de teste mantido.',custo:300,venda:20};
    _renderForja(); _forjaFocarResultado();
  `));
  const before = await economia(page);
  const result = page.locator('#forjaResultado');
  await expect(result).toBeFocused();
  await expect(result.getByRole('heading', { name: 'Forja concluída' })).toBeVisible();
  await expect(result.locator('.nq-forja-recibo')).toContainText('300 ouro');
  await expect(result.locator('.nq-forja-recibo')).toContainText('+20 ouro');
  await expect(result.locator('.nq-forja-recibo')).toContainText('5000 ouro');
  await expect(result.getByRole('button', { name: 'Forjar outro item', exact: true })).toHaveAttribute('data-action', 'forjarOutroItem');
  await semCortes(page);
  expect(await economia(page)).toBe(before);
});

test('arte oficial carrega inteira e preserva a bigorna nos recortes desktop e mobile', async ({page}) => {
  await abrir(page, 1440);
  const before = await economia(page);
  const source = await page.locator('.nq-forja-banner').evaluate(async el => {
    const url = getComputedStyle(el).backgroundImage.match(/url\("?([^"\)]+)"?\)/)![1];
    const image = new Image(); image.src = url; await image.decode();
    return {url, width:image.naturalWidth, height:image.naturalHeight};
  });
  expect(new URL(source.url).pathname).toBe('/assets/scenes/forge-panorama-dark.webp');
  expect([source.width,source.height]).toEqual([2172,724]);
  for (const width of [1440,1024,740,390,320]) {
    await page.setViewportSize({width,height:width<500?844:900});
    const crop = await page.locator('.nq-forja-banner').evaluate(el => {
      const s=getComputedStyle(el),b=el.getBoundingClientRect();
      const scale=s.backgroundSize==='cover'?Math.max(b.width/2172,b.height/724):170/724;
      const [px,py]=s.backgroundPosition.split(' ').map(v=>parseFloat(v)/100);
      const x=(b.width-2172*scale)*px,y=(b.height-724*scale)*py;
      // Região conservadora da bigorna completa e sua base, conferida no PNG oficial.
      const anvil={left:x+1200*scale,right:x+1720*scale,top:y+250*scale,bottom:y+480*scale};
      return {width:b.width,height:b.height,anvil,opacity:s.opacity,
        overlayOpacity:getComputedStyle(el,'::before').opacity,
        copyTop:el.querySelector('.nq-forja-resultado')!.getBoundingClientRect().top-b.top,
        optionsTop:document.querySelector('.nq-forja-opcoes')!.getBoundingClientRect().top};
    });
    expect(crop.anvil.left).toBeGreaterThanOrEqual(0);expect(crop.anvil.right).toBeLessThanOrEqual(crop.width);
    expect(crop.anvil.top).toBeGreaterThanOrEqual(0);expect(crop.anvil.bottom).toBeLessThanOrEqual(crop.height);
    expect(crop.opacity).toBe('1');expect(crop.overlayOpacity).toBe('1');
    if(width<=760)expect(crop.copyTop).toBeGreaterThanOrEqual(crop.anvil.bottom+24);
    if(width<500)expect(crop.optionsTop).toBeLessThan(550);
    else expect(crop.optionsTop).toBeLessThan(450);
    await semCortes(page);
  }
  expect(await economia(page)).toBe(before);
});

test('arte oficial mantém leitura a200% em320,390 e1440px sem ação econômica', async ({page}) => {
  await abrir(page,1440);
  const before=await economia(page);
  for(const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>{document.documentElement.style.fontSize='32px';});
    await semCortes(page);
    await expect(page.getByRole('button',{name:'Forjar item aleatório',exact:true})).toHaveAttribute('data-arg','comum');
    await expect(page.getByRole('button',{name:'Forjar item lendário',exact:true})).toHaveAttribute('data-arg','lendario');
    expect(await page.locator('.nq-forja-banner').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
  }
  expect(await economia(page)).toBe(before);
});
