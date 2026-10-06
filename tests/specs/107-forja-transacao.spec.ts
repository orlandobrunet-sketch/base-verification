import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';


test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const SLOTS = ['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot'];
const VAZIOS = Object.fromEntries(SLOTS.map(slot => [slot, { n: 'Vazio', rar: 'common', atk: 0, def: 0, kno: 0, luck: 0 }]));
const OCUPADOS = Object.fromEntries(SLOTS.map(slot => [slot, { n: `Anterior ${slot}`, rar: 'common', atk: 1, def: 2, kno: 3, luck: 4 }]));
const VENDA: Record<string, number> = { common: 20, uncommon: 40, rare: 80, epic: 150, legendary: 300 };

async function abrir(page: Page, gold = 5000, ocupado = true) {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, {
    schemaVersion: 6,
    gold,
    equipment: ocupado ? OCUPADOS : VAZIOS,
    obtainedItems: ocupado ? Object.values(OCUPADOS).map(item => item.n) : [],
  });
  await page.waitForLoadState('load');
  await page.evaluate(() => {
    (0, eval)('_doSaveGame()');
    (0, eval)('Math.random = () => 0');
  });
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().click();
  await expect(page.locator('#forjaPage')).toHaveAttribute('data-nq-ui', 'lumen');
}

async function estado(page: Page) {
  return page.evaluate(() => JSON.parse((0, eval)(`JSON.stringify({
    gold:state.gold,equipment:state.equipment,obtainedItems:state.obtainedItems,
    forjaPending:state.forjaPending,allItemsCollectedNotified:state.allItemsCollectedNotified,
    level:state.level,xp:state.xp,score:state.score,lives:state.lives,maxLives:state.maxLives,
    streak:state.streak,difficulty:state.difficulty,correctTotal:state.correctTotal,
    xpToNext:state.xpToNext,bonusUses:state.bonusUses,narrativeShown:state.narrativeShown,
    bossIntroShown:state.bossIntroShown,battleFinalShown:state.battleFinalShown,
    chestsOpened:state.chestsOpened,legendaryAbilityUsed:state.legendaryAbilityUsed,
    extraLifeGiven:state.extraLifeGiven,chestCorrectCount:state.chestCorrectCount,
    chestTarget:state.chestTarget,character:state.character,gameStarted:state.gameStarted,
    gameOver:state.gameOver,gameCompleted:state.gameCompleted,completedGame:state.completedGame,
    idx:state.idx,queueIds:state.queue.map(q=>q.id)
  })`)));
}
const save = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save') || 'null'));
const rawSave = (page: Page) => page.evaluate(() => localStorage.getItem('nefroquest-save'));

async function falharArmazenamento(page: Page) {
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).__nqRestoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(key, value) {
      if (key === 'nefroquest-save') throw new DOMException('Falha simulada no save', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
}

async function restaurarArmazenamento(page: Page) {
  await page.evaluate(() => { (window as any).__nqRestoreStorage?.(); delete (window as any).__nqRestoreStorage; });
}

function progressoSemForja(value: Record<string, any>) {
  const { gold, equipment, obtainedItems, forjaPending, allItemsCollectedNotified, ...progresso } = value;
  return progresso;
}

test('reload recupera exatamente o sorteio pago e permite uma única resolução', async ({ page }) => {
  await abrir(page);
  const antes = await estado(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const pago = await estado(page);
  expect(pago.gold).toBe(4700);
  expect(pago.forjaPending).not.toBeNull();
  expect(progressoSemForja(pago)).toEqual(progressoSemForja(antes));
  const persistido = await save(page);
  expect(persistido.gold).toBe(4700);
  expect(persistido.forjaPending).toEqual(pago.forjaPending);
  expect(persistido.equipment).toEqual(antes.equipment);
  expect(persistido.obtainedItems).toEqual(pago.obtainedItems);

  await page.reload();
  await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
  await page.evaluate(async () => {
    document.getElementById('landingScreen')?.classList.add('hidden');
    await (window as any).continueGame();
  });
  await expect(page.locator('#forjaPage')).toBeVisible();
  const retomado = await estado(page);
  expect(retomado.gold).toBe(pago.gold);
  expect(retomado.forjaPending).toEqual(pago.forjaPending);
  expect(retomado.equipment).toEqual(pago.equipment);
  expect(retomado.obtainedItems).toEqual(pago.obtainedItems);
  await expect(page.locator('[data-action="decidirForja"][data-arg="substituir"]')).toBeFocused();

  await page.evaluate(() => {
    (0, eval)("decidirForja('substituir'); decidirForja('manter'); decidirForja('substituir')");
  });
  const concluido = await estado(page);
  expect(concluido.gold).toBe(4720);
  expect(concluido.forjaPending).toBeNull();
  expect(concluido.equipment[pago.forjaPending.slot]).toEqual(pago.forjaPending.novo);
  const salvo = await save(page);
  expect(salvo.gold).toBe(concluido.gold);
  expect(salvo.equipment).toEqual(concluido.equipment);
  expect(salvo.forjaPending).toBeNull();
});

for (const ocupado of [true, false]) {
  test(`compra única com clique duplo em espaço ${ocupado ? 'ocupado' : 'vazio'} e nova compra deliberada`, async ({ page }) => {
    await abrir(page, 5000, ocupado);
    const antes = await estado(page);
    await page.getByRole('button', { name: 'Forjar item comum', exact: true }).dblclick();
    const pago = await estado(page);
    expect(pago.gold).toBe(4700);
    expect(progressoSemForja(pago)).toEqual(progressoSemForja(antes));
    const savePago = await rawSave(page);
    await page.evaluate(() => { (0, eval)("forjarNaPagina('comum'); forjarNaPagina('lendario')"); });
    expect(await estado(page)).toEqual(pago);
    expect(await rawSave(page)).toBe(savePago);
    if (ocupado) {
      expect(pago.forjaPending).not.toBeNull();
      await page.evaluate(() => { (0, eval)("decidirForja('manter'); decidirForja('manter')"); });
    } else {
      expect(pago.forjaPending).toBeNull();
      expect(pago.obtainedItems).toHaveLength(1);
      expect(SLOTS.filter(slot => pago.equipment[slot].n !== 'Vazio')).toHaveLength(1);
    }
    const concluido = await estado(page);
    expect(concluido.gold).toBe(ocupado ? 4700 + VENDA[pago.forjaPending.novo.rar] : 4700);
    expect(concluido.equipment).toEqual(pago.equipment);
    expect(concluido.forjaPending).toBeNull();
    const saveConcluido = await rawSave(page);
    await page.evaluate(() => { (0, eval)("forjarNaPagina('comum'); forjarNaPagina('comum'); forjarNaPagina('lendario'); decidirForja('manter')"); });
    expect(await estado(page)).toEqual(concluido);
    expect(await rawSave(page)).toBe(saveConcluido);
    await expect(page.getByRole('button', { name: 'Forjar item comum', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Forjar item lendário', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Forjar outro item', exact: true }).click();
    expect(await estado(page)).toEqual(concluido);
    expect(await rawSave(page)).toBe(saveConcluido);
    await expect(page.getByRole('button', { name: 'Forjar item comum', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
    const segundo = await estado(page);
    expect(segundo.gold).toBe(concluido.gold - 300);
    expect(segundo.obtainedItems).toHaveLength(concluido.obtainedItems.length + 1);
    expect(progressoSemForja(segundo)).toEqual(progressoSemForja(antes));
    expect((await save(page)).gold).toBe(segundo.gold);
  });
}

test('duas invocações imediatas em espaço vazio cobram e equipam uma vez', async ({ page }) => {
  await abrir(page, 5000, false);
  const antes = await estado(page);
  await page.evaluate(() => { (0, eval)("forjarNaPagina('comum'); forjarNaPagina('comum')"); });
  const concluido = await estado(page);
  expect(concluido.gold).toBe(4700);
  expect(concluido.forjaPending).toBeNull();
  expect(concluido.obtainedItems).toHaveLength(1);
  expect(SLOTS.filter(slot => concluido.equipment[slot].n !== 'Vazio')).toHaveLength(1);
  expect(progressoSemForja(concluido)).toEqual(progressoSemForja(antes));
  expect((await save(page)).equipment).toEqual(concluido.equipment);
});

for (const [tipo, nome, custo] of [
  ['comum', 'Forjar item comum', 300],
  ['lendario', 'Forjar item lendário', 1000],
] as const) {
  test(`espaço vazio: ${tipo} equipa e persiste imediatamente`, async ({ page }) => {
    await abrir(page, custo, false);
    const antes = await estado(page);
    await page.getByRole('button', { name: nome, exact: true }).click();
    const depois = await estado(page);
    expect(depois.gold).toBe(0);
    expect(depois.forjaPending).toBeNull();
    const equipados = SLOTS.filter(slot => depois.equipment[slot].n !== 'Vazio');
    expect(equipados).toHaveLength(1);
    if (tipo === 'lendario') {
      expect(['weapon', 'armor', 'relic']).toContain(equipados[0]);
      expect(depois.equipment[equipados[0]].rar).toBe('legendary');
    }
    expect(progressoSemForja(depois)).toEqual(progressoSemForja(antes));
    expect((await save(page)).equipment).toEqual(depois.equipment);
    expect((await save(page)).gold).toBe(0);
    await page.reload();
    await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
    await page.evaluate(() => {
      document.getElementById('landingScreen')?.classList.add('hidden');
      return (window as any).continueGame();
    });
    await expect(page.locator('#mainApp')).toBeVisible();
    expect((await estado(page)).equipment).toEqual(depois.equipment);
    expect((await estado(page)).gold).toBe(0);
  });
}

test('ouro insuficiente e sair antes de forjar preservam o estado completo', async ({ page }) => {
  await abrir(page, 299);
  const antes = await estado(page);
  const persistido = await rawSave(page);
  await expect(page.getByRole('button', { name: 'Forjar item comum', exact: true })).toBeDisabled();
  await expect(page.locator('#forjaMotivo-comum')).toHaveText('Faltam 1 de ouro.');
  await page.evaluate(() => { (0, eval)("forjarNaPagina('comum'); forjarNaPagina('lendario')"); });
  expect(await estado(page)).toEqual(antes);
  expect(await rawSave(page)).toBe(persistido);
  await page.getByRole('button', { name: '← Voltar à jornada', exact: true }).click();
  expect(await estado(page)).toEqual(antes);
});

test('falha ao gravar o sorteio reverte ouro, equipamento e histórico', async ({ page }) => {
  await abrir(page);
  const antes = await estado(page);
  const persistido = await rawSave(page);
  await falharArmazenamento(page);
  try {
    await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
    await expect(page.locator('#forjaResultado [role="alert"]')).toContainText('Seu ouro e equipamento foram mantidos');
    expect(await estado(page)).toEqual(antes);
    expect(await rawSave(page)).toBe(persistido);
    await expect(page.locator('[data-action="decidirForja"]')).toHaveCount(0);
  } finally {
    await restaurarArmazenamento(page);
  }
  await expect(page.getByRole('button', { name: 'Forjar item comum', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Forjar outro item', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const retentativa = await estado(page);
  expect(retentativa.gold).toBe(antes.gold - 300);
  expect(retentativa.forjaPending).not.toBeNull();
  expect(progressoSemForja(retentativa)).toEqual(progressoSemForja(antes));
  expect((await save(page)).forjaPending).toEqual(retentativa.forjaPending);
});

test('falha na resolução mantém a pendência e a tentativa seguinte vende uma vez', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const pago = await estado(page);
  const persistido = await rawSave(page);
  await falharArmazenamento(page);
  try {
    await page.locator('[data-action="decidirForja"][data-arg="substituir"]').click();
    await expect(page.locator('#forjaResultado [role="alert"]')).toContainText('nenhuma venda foi efetuada');
    expect(await estado(page)).toEqual(pago);
    expect(await rawSave(page)).toBe(persistido);
  } finally {
    await restaurarArmazenamento(page);
  }
  await page.locator('[data-action="decidirForja"][data-arg="manter"]').click();
  const concluido = await estado(page);
  expect(concluido.gold).toBe(pago.gold + VENDA[pago.forjaPending.novo.rar]);
  expect(concluido.equipment).toEqual(pago.equipment);
  expect(concluido.forjaPending).toBeNull();
  await expect(page.locator('#forjaResultado .nq-forja-item h3')).toHaveText(pago.forjaPending.atual.n);
  await expect(page.locator('#forjaResultado > p')).toContainText(`${pago.forjaPending.novo.n} vendido`);
  expect((await save(page)).gold).toBe(concluido.gold);
});

test('save v6 conserva os seis itens e o progresso na migração para v7', async ({ page }) => {
  await abrir(page, 876);
  const atual = await estado(page);
  expect(atual.equipment).toEqual(OCUPADOS);
  expect(atual.obtainedItems).toEqual(Object.values(OCUPADOS).map(item => item.n));
  expect(atual.forjaPending).toBeNull();
  expect(atual.gold).toBe(876);
  expect(atual.level).toBe(5);
  expect(atual.xp).toBe(150);
  expect(atual.score).toBe(2500);
  expect(atual.lives).toBe(3);
  expect(atual.streak).toBe(2);
  expect(atual.correctTotal).toBe(15);
  expect(atual.difficulty).toBe('normal');
  const persistido = await save(page);
  expect(persistido.schemaVersion).toBe(7);
  expect(persistido.equipment).toEqual(OCUPADOS);
  expect(persistido.gold).toBe(876);
  expect(persistido.forjaPending).toBeNull();
  expect(persistido.queueIds).toEqual(atual.queueIds);
  expect(persistido.idx).toBe(atual.idx);
});

test('Forja no sandbox altera apenas a demonstração e não escreve o save real', async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => (window as any).beginProgressSandbox('forja-test'));
  const real = await rawSave(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const pago = await estado(page);
  expect(pago.gold).toBe(4700);
  expect(pago.forjaPending).not.toBeNull();
  await page.locator('[data-action="decidirForja"][data-arg="manter"]').click();
  expect((await estado(page)).gold).toBe(4700 + VENDA[pago.forjaPending.novo.rar]);
  expect((await estado(page)).forjaPending).toBeNull();
  expect(await rawSave(page)).toBe(real);
});

test('journal formata nomes sem interpretar HTML, e atributos não acionam respostas', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: '← Voltar à jornada', exact: true }).click();
  const antes = await estado(page);
  await page.evaluate(() => { (0, eval)('log("Equipou **<img src=x onerror=alert(1)>** com sucesso.")'); });
  const linha = page.locator('#journal p').first();
  await expect(linha.locator('strong')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(linha.locator('img')).toHaveCount(0);
  await expect(linha).not.toContainText('**');
  const atributo = page.locator('#mainApp button.stat-badge').first();
  await expect(atributo).toHaveAttribute('aria-describedby', 'nqStatTipAtk');
  await atributo.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  expect(await estado(page)).toEqual(antes);
});

async function conferirItemSemCortes(page: Page) {
  const falhas = await page.evaluate(() => {
    const falhas: string[] = [];
    for (const el of document.querySelectorAll('#forjaResultado .nq-forja-item h3, #forjaResultado .nq-forja-arte, #forjaResultado .nq-forja-arte img, #forjaResultado .nq-forja-emoji')) {
      const cartao = el.closest('.nq-forja-item');
      if (!cartao) continue;
      const limite = cartao.getBoundingClientRect();
      const conferir = (r: DOMRect, tipo: string) => {
        if (r.width && (r.left < -1 || r.right > innerWidth + 1 || r.left < limite.left - 1 || r.right > limite.right + 1 || r.top < limite.top - 1 || r.bottom > limite.bottom + 1)) {
          falhas.push(`${tipo}: ${el.tagName} ${(el.textContent || '').trim().slice(0, 60)}`);
        }
      };
      conferir(el.getBoundingClientRect(), 'elemento');
      if (el.matches('h3, .nq-forja-emoji')) {
        const range = document.createRange();
        range.selectNodeContents(el);
        for (const r of range.getClientRects()) conferir(r, 'texto');
      }
    }
    return falhas;
  });
  expect(falhas, 'arte ou texto saiu do cartão/viewport').toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}
for (const largura of [320, 390]) {
  test(`arte e nome cabem no cartão em ${largura}px com texto a 200%`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 700 });
    await abrir(page, 5000, true);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
    await expect(page.locator('#forjaResultado .nq-forja-item-novo h3')).toBeVisible();
    await conferirItemSemCortes(page);
    await page.locator('[data-action="decidirForja"][data-arg="substituir"]').click();
    await expect(page.locator('#forjaResultado .nq-forja-item-final h3')).toBeVisible();
    await conferirItemSemCortes(page);
    await expect(page.getByRole('button', { name: 'Forjar outro item', exact: true })).toBeVisible();
  });
}
