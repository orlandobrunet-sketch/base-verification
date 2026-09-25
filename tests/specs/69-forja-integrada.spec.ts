import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * A Forja saiu da sobreposição e virou página do personagem.
 *
 * Antes: caixa escura sobre o jogo que abria, em sequência, o popup de
 * comparação "Substituir?" e o cartão "Forja Concluída!". O equipamento atual
 * não aparecia, e os motivos de uma forja recusada (jornada encerrada, tudo
 * lendário) só iam para o diário, atrás da sobreposição.
 *
 * Agora: ouro, as duas forjas com o motivo de cada bloqueio, a decisão de
 * substituição e o resultado no fluxo, e os seis espaços de equipamento.
 */

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const OCUPADO = (n: string, v: number) => ({ n, rar: 'common', atk: v, def: v, kno: v, luck: v });
const TODOS_OCUPADOS = Object.fromEntries(
  ['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot'].map(s => [s, OCUPADO(`Item de teste ${s}`, 1)]),
);
const OCUPAR = `state.equipment = ${JSON.stringify(TODOS_OCUPADOS)}`;

/* `ajuste` roda no jogo antes de abrir: o save só restaura arma, armadura e
 * relíquia, e `gameOver` não sobrevive ao reload — então o estado vai direto. */
async function abrirForja(page: Page, opcoes: { gold?: number; ajuste?: string; largura?: number } = {}) {
  const largura = opcoes.largura ?? 1280;
  await page.setViewportSize({ width: largura, height: largura < 500 ? 700 : 800 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: opcoes.gold ?? 5000 });
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  if (opcoes.ajuste) await page.evaluate(a => (0, eval)(a), opcoes.ajuste);
  // Desktop abre pelo dock; celular, pelo dock móvel. Os dois chamam a mesma página.
  const botao = page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first();
  await botao.focus();
  await botao.press('Enter');
  await expect(page.locator('#forjaPage')).toBeVisible();
}

const ouro = (page: Page) => page.evaluate(() => (0, eval)('state.gold') as number);
const equipado = (page: Page, slot: string) => page.evaluate(s => (0, eval)(`state.equipment.${s}.n`) as string, slot);
const semPopups = async (page: Page) => {
  for (const sel of ['#forjaModal', '.forge-popup', '#equipCompareOverlay']) {
    await expect(page.locator(sel), `voltou a abrir ${sel}`).toHaveCount(0);
  }
};

test('é página, não sobreposição, e mostra ouro e os seis espaços', async ({ page }) => {
  await abrirForja(page);
  const pagina = page.locator('#forjaPage');
  await expect(pagina).toHaveAttribute('role', 'main');
  expect(await pagina.evaluate(el => getComputedStyle(el).position)).not.toBe('fixed');
  await expect(page.locator('#mainApp')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Forja', level: 1 })).toBeVisible();
  await expect(pagina.locator('.nq-forja-ouro')).toContainText('5000');
  await expect(pagina.locator('.nq-forja-grade .nq-forja-item')).toHaveCount(6);
  // Espaço vazio diz que está vazio, sem uma fileira de zeros.
  await expect(pagina.locator('.nq-forja-grade .nq-forja-vazio')).toHaveCount(6);
  await expect(pagina.locator('.nq-forja-grade .nq-forja-atributos')).toHaveCount(0);
  expect(await page.evaluate(medirContraste, '#forjaPage .nq-forja-vazio')).toEqual([]);
  await semPopups(page);
});

test('espaço vazio: forja, equipa e mostra o resultado na página', async ({ page }) => {
  await abrirForja(page);
  await page.getByRole('button', { name: 'Forjar item comum' }).click();
  const resultado = page.locator('#forjaResultado');
  await expect(resultado.getByRole('heading', { name: 'Forja concluída' })).toBeVisible();
  await expect(resultado).toBeFocused();
  expect(await ouro(page)).toBe(4700);
  await expect(page.locator('.nq-forja-ouro')).toContainText('4700');
  // O equipamento da página reflete o item novo.
  const nome = (await resultado.locator('.nq-forja-item h3').textContent())!.trim();
  await expect(page.locator('.nq-forja-grade')).toContainText(nome);
  await semPopups(page);
});

for (const escolha of ['manter', 'substituir'] as const) {
  test(`espaço ocupado: a comparação acontece na página (${escolha})`, async ({ page }) => {
    await abrirForja(page, { ajuste: OCUPAR });
    await page.getByRole('button', { name: 'Forjar item comum' }).click();

    const equipar = page.getByRole('button', { name: /^Equipar .+ vira 20 de ouro$/ });
    const manter = page.getByRole('button', { name: /^Manter Item de teste \w+.+ vira \d+ de ouro$/ });
    await expect(equipar).toBeFocused();
    await semPopups(page);

    // O recém-forjado vem primeiro, com selo "Novo"; o equipado fica como referência.
    const cartoes = page.locator('#forjaResultado .nq-forja-item');
    await expect(cartoes.first()).toHaveClass(/nq-forja-item-novo/);
    await expect(cartoes.first().locator('.nq-forja-selo')).toHaveText('Novo');
    await expect(cartoes.nth(1)).toHaveClass(/nq-forja-item-atual/);
    await expect(page.locator('#forjaResultado > p').first()).toContainText(/Ele (é|tem)/);

    // Com a decisão pendente, o ouro já foi gasto: não dá para sair nem forjar de novo.
    await expect(page.getByRole('button', { name: '← Voltar à jornada' })).toBeDisabled();
    await expect(page.locator('#forjaMotivoSaida')).toContainText('o ouro já foi gasto');
    await expect(page.getByRole('button', { name: 'Forjar item comum' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(page.locator('#forjaPage')).toBeVisible();

    const slot = await page.evaluate(() => (0, eval)('_forja.pendente.slot') as string);
    const novo = await page.evaluate(() => (0, eval)('_forja.pendente.novo.n') as string);
    const venda = Number((await manter.textContent())!.match(/vira (\d+) de ouro/)![1]);

    await (escolha === 'manter' ? manter : equipar).click();
    await expect(page.locator('#forjaResultado').getByRole('heading', { name: 'Forja concluída' })).toBeVisible();
    await expect(page.locator('#forjaResultado')).toBeFocused();
    if (escolha === 'manter') {
      expect(await equipado(page, slot)).toBe(`Item de teste ${slot}`);
      expect(await ouro(page)).toBe(5000 - 300 + venda);
    } else {
      expect(await equipado(page, slot)).toBe(novo);
      expect(await ouro(page)).toBe(5000 - 300 + 20);
    }
    await expect(page.getByRole('button', { name: '← Voltar à jornada' })).toBeEnabled();
    await semPopups(page);
  });
}

test('bloqueios dizem o motivo na página', async ({ page }) => {
  await abrirForja(page, { gold: 100 });
  await expect(page.getByRole('button', { name: 'Forjar item comum' })).toBeDisabled();
  await expect(page.locator('#forjaMotivo-comum')).toHaveText('Faltam 200 de ouro.');
  await expect(page.locator('#forjaMotivo-lendario')).toHaveText('Faltam 900 de ouro.');
  await expect(page.getByRole('button', { name: 'Forjar item comum' })).toHaveAttribute('aria-describedby', 'forjaMotivo-comum');
});

test('jornada encerrada não parece falta de ouro', async ({ page }) => {
  await abrirForja(page, { ajuste: 'state.gameOver = true' });
  await expect(page.locator('#forjaMotivo-comum')).toContainText('A jornada foi encerrada');
});

test('Escape e "Voltar" devolvem a jornada e o foco à Forja do dock', async ({ page }) => {
  await abrirForja(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#forjaPage')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('#forgeBtn')).toBeFocused();

  await page.locator('#forgeBtn').press('Enter');
  await expect(page.locator('#forjaPage')).toBeVisible();
  await page.getByRole('button', { name: '← Voltar à jornada' }).click();
  await expect(page.locator('#forjaPage')).toHaveCount(0);
  await expect(page.locator('#forgeBtn')).toBeFocused();
});

test('fora da Forja, o baú de equipamento continua com o popup de comparação', async ({ page }) => {
  // A página só troca a apresentação da Forja; os outros caminhos seguem iguais.
  await abrirForja(page, { ajuste: OCUPAR });
  await page.keyboard.press('Escape');
  await page.evaluate(() => (0, eval)(`equipOrSell('weapon', {n:'Outro item',rar:'rare',atk:5,def:5,kno:5,luck:5}, () => {})`));
  await expect(page.locator('#equipCompareOverlay')).toBeVisible();
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200%, contraste e alvos de toque`, async ({ page }) => {
    await abrirForja(page, { ajuste: OCUPAR, gold: 400, largura });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await page.getByRole('button', { name: 'Forjar item comum' }).click();
    await expect(page.getByRole('button', { name: /^Equipar / })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'rolagem horizontal').toBeLessThanOrEqual(1);
    // A superfície pode cortar em vez de rolar: cada item e botão precisa caber inteiro.
    const cortados = await page.evaluate(() => [...document.querySelectorAll('#forjaPage .nq-forja-item, #forjaPage button, #forjaPage p')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); })
      .map(el => (el.textContent || '').trim().slice(0, 40)));
    expect(cortados, 'elementos cortados na lateral').toEqual([]);
    for (const botao of await page.locator('#forjaPage button').all()) {
      const caixa = await botao.boundingBox();
      if (caixa) expect(caixa.height, `alvo de toque: ${await botao.textContent()}`).toBeGreaterThanOrEqual(44);
    }
    for (const sel of ['.nq-forja-ouro', '.nq-forja-custo', '.nq-forja-motivo', '.nq-forja-rotulo', '.nq-forja-atributos', '.nq-forja-item-topo p', '#forjaResultado > p', '.nq-forja-selo', '.nq-forja-btn-sub', '.nq-forja-item-novo h3']) {
      expect(await page.evaluate(medirContraste, `#forjaPage ${sel}`), sel).toEqual([]);
    }
  });
}
