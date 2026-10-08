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
const save = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null'));
const rawSave = (page: Page) => page.evaluate(() => localStorage.getItem('nefroquest-save-v7'));

async function falharArmazenamento(page: Page) {
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).__nqRestoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(key, value) {
      if (key === 'nefroquest-save-v7') throw new DOMException('Falha simulada no save', 'QuotaExceededError');
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
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
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

// Same-context pages share storage, including writes after the modern page
// closes. The legacy writer reproduces the v6 payload (no paid-choice field).
async function abaLegada(page: Page) {
  const legacy = await page.context().newPage();
  await legacy.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await legacy.route('**/legacy-storage-test.html', route => route.fulfill({contentType:'text/html',body:'<!doctype html><title>Legacy storage writer</title>'}));
  await legacy.goto('/legacy-storage-test.html');
  return legacy;
}

async function sobrescreverComoV6(legacy: Page, previous: Record<string, any>) {
  await legacy.evaluate(save => {
    const { forjaPending, saveOwner, saveRevision, ...old } = save;
    localStorage.setItem('nefroquest-save', JSON.stringify({ ...old, schemaVersion: 6, timestamp: Date.now() + 10000 }));
  }, previous);
}

async function reabrirJornada(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
  await page.evaluate(() => document.getElementById('landingScreen')?.classList.add('hidden'));
}

test('aba v6 não apaga o sorteio pago depois que a aba moderna fecha', async ({ page }) => {
  await abrir(page);
  const legacy = await abaLegada(page);
  const old = await save(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const paid = await save(page);
  const paidRaw = await rawSave(page);
  await page.close();
  await sobrescreverComoV6(legacy, old);
  const reopened = await legacy.context().newPage();
  await reopened.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await reabrirJornada(reopened);
  await expect(reopened.locator('#nqSaveRecovery')).toBeVisible();
  expect(await rawSave(reopened)).toBe(paidRaw);
  expect((await estado(reopened)).gameStarted).toBe(false);
  // No item, name or score is disclosed before a guest claims this journey.
  await expect(reopened.locator('#nqSaveRecovery')).not.toContainText(paid.forjaPending.novo.n);
  await reopened.getByRole('button', { name: 'Retomar jornada protegida', exact: true }).click();
  await expect(reopened.locator('#forjaPage')).toBeVisible();
  expect((await estado(reopened)).gold).toBe(paid.gold);
  expect((await estado(reopened)).forjaPending).toEqual(paid.forjaPending);
  expect((await estado(reopened)).equipment).toEqual(paid.equipment);
  await reopened.locator('[data-action="decidirForja"][data-arg="manter"]').click();
  const sold = await save(reopened);
  expect(sold.gold).toBe(paid.gold + VENDA[paid.forjaPending.novo.rar]);
  expect(sold.forjaPending).toBeNull();
  await reopened.evaluate(() => (0, eval)("decidirForja('manter')"));
  expect((await save(reopened)).gold).toBe(sold.gold);
});

test('logout legado de visitante exige escolha e descarte impede ressurreição tardia', async ({ page }) => {
  await abrir(page);
  const old = await save(page);
  const legacy = await abaLegada(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const paidRaw = await rawSave(page);
  await page.close();
  await legacy.evaluate(() => localStorage.removeItem('nefroquest-save'));
  const reopened = await legacy.context().newPage();
  await reopened.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await reabrirJornada(reopened);
  await expect(reopened.locator('#nqSaveRecovery')).toBeVisible();
  expect(await rawSave(reopened)).toBe(paidRaw);
  expect((await estado(reopened)).gameStarted).toBe(false);
  await reopened.getByRole('button', { name: 'Começar uma nova jornada', exact: true }).click();
  expect(await save(reopened)).toMatchObject({save:null,resetReason:'reset'});
  await sobrescreverComoV6(legacy, old);
  await reopened.reload();
  await reopened.waitForFunction(() => typeof (window as any).continueGame === 'function');
  expect(await reopened.evaluate(() => (0, eval)('loadGame()'))).toBeNull();
  await expect(reopened.locator('#nqSaveRecovery')).toHaveCount(0);
});

test('reset em outra aba cancela a Forja, autosave e save atrasado da aba moderna', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const other = await abaLegada(page);
  await page.evaluate(() => (0, eval)('state.score += 1; saveGame()'));
  await other.evaluate(() => localStorage.setItem('nefroquest-save-v7', 'null'));
  await expect(page.locator('#forjaPage')).toHaveCount(0);
  await page.waitForTimeout(900);
  expect(await rawSave(page)).toBe('null');
  expect((await estado(page)).gameStarted).toBe(false);
  expect((await estado(page)).forjaPending).toBeNull();
  expect(await page.evaluate(() => (0, eval)('_doSaveGame()'))).toBe(false);
  expect(await rawSave(page)).toBe('null');
});

test('espelho legado indisponível não desfaz compra canônica nem cria segunda cobrança', async ({ page }) => {
  await abrir(page);
  const before = await estado(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as any).__nqRestoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(key, value) {
      if (key === 'nefroquest-save') throw new DOMException('Espelho indisponível', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  try {
    await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
    const paid = await estado(page);
    expect(paid.gold).toBe(before.gold - 300);
    expect(paid.forjaPending).not.toBeNull();
    expect((await save(page)).forjaPending).toEqual(paid.forjaPending);
    await page.evaluate(() => (0, eval)("forjarNaPagina('comum')"));
    expect((await save(page)).gold).toBe(paid.gold);
  } finally { await restaurarArmazenamento(page); }
});

test('guard síncrono impede autosave obsoleto antes de chegar o evento storage', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const result = await page.evaluate(async () => {
    // A self-write does not dispatch storage in this page, reproducing the
    // interval before another tab's notification reaches a queued autosave.
    localStorage.setItem('nefroquest-save-v7', 'null');
    const saved = (0, eval)('_doSaveGame()');
    await Promise.resolve();
    return {saved,raw:localStorage.getItem('nefroquest-save-v7'),started:(0, eval)('state.gameStarted')};
  });
  expect(result).toEqual({saved:false,raw:'null',started:false});
  await expect(page.locator('#forjaPage')).toHaveCount(0);
});

test('logout legado antes do evento storage pausa visitante sem restaurar automaticamente', async ({ page }) => {
  await abrir(page);
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const paidRaw = await rawSave(page);
  const result = await page.evaluate(async () => {
    localStorage.removeItem('nefroquest-save');
    const saved = (0, eval)('_doSaveGame()');
    await Promise.resolve();
    return {saved,started:(0, eval)('state.gameStarted')};
  });
  expect(result).toEqual({saved:false,started:false});
  expect(await rawSave(page)).toBe(paidRaw);
  await expect(page.locator('#forjaPage')).toHaveCount(0);
  await expect(page.locator('#nqSaveRecovery')).toBeVisible();
});

test('nuvem v6 mais recente não perde escolha paga v7 e reenvia o save protegido', async ({ page }) => {
  await abrir(page);
  // A local test account with a mocked profiles endpoint; no backend requests.
  await page.evaluate(() => {
    (0, eval)("_stopLocalJourney(); authUser = { id: 'forja-owner-A' }");
    const local = JSON.parse(localStorage.getItem('nefroquest-save-v7')!);
    local.saveOwner = 'forja-owner-A';
    localStorage.setItem('nefroquest-save-v7', JSON.stringify(local));
    localStorage.setItem('nefroquest-save', JSON.stringify(local));
  });
  await page.evaluate(() => (window as any).continueGame());
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().click();
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).click();
  const paid = await save(page);
  const paidRaw = await rawSave(page);
  const uploads = await page.evaluate(async paid => {
    const uploads: any[] = [];
    const { forjaPending, saveOwner, saveRevision, ...legacy } = paid;
    (window as any).__nqUploads = uploads;
    (0, eval)(`_supaClient = { from: name => ({ update: payload => ({ eq: async (key, owner) => { window.__nqUploads.push({name, payload, key, owner}); } }) }) }`);
    (window as any)._mergeCloudProgress({ save: { ...legacy, schemaVersion: 6, timestamp: Date.now() + 10000 } });
    await (0, eval)('_syncProgressToCloud()');
    return uploads;
  }, paid);
  expect(await rawSave(page)).toBe(paidRaw);
  expect(uploads).toHaveLength(1);
  expect(uploads[0].owner).toBe('forja-owner-A');
  expect(uploads[0].payload.game_progress.save).toEqual(paid);
  expect((await estado(page)).forjaPending).toEqual(paid.forjaPending);
});

test('query de nuvem iniciada antes da compra não substitui a Forja paga por save v7', async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => {
    (0, eval)("_stopLocalJourney(); authUser = {id:'forja-owner-A'}");
    const local = JSON.parse(localStorage.getItem('nefroquest-save-v7')!);
    local.saveOwner = 'forja-owner-A';
    const raw = JSON.stringify(local);
    localStorage.setItem('nefroquest-save-v7',raw);
    localStorage.setItem('nefroquest-save',raw);
  });
  await page.evaluate(() => (window as any).continueGame());
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.clock.install();
  await page.evaluate(() => {
    (window as any).__lateCloudUploads = [];
    (0, eval)(`_supaClient = {from: () => ({
      select: () => ({eq: () => ({single: () => new Promise(resolve => {window.__lateCloudResolve = resolve;})})}),
      update: payload => ({eq: async () => {window.__lateCloudUploads.push(payload);}})
    })}`);
    (window as any).__lateCloudLoad = (0, eval)('_loadProgressFromCloud()');
  });
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().click();
  await page.getByRole('button',{name:'Forjar item comum',exact:true}).click();
  const paid = await save(page);
  const paidRaw = await rawSave(page);
  expect(paid.gold).toBe(4700);
  expect(paid.forjaPending).not.toBeNull();
  await page.evaluate(async paid => {
    (window as any).__lateCloudResolve({data:{game_progress:{stats:{bestScore:4242},achievements:['remote-monotonic'],save:{
      ...paid,gold:999,forjaPending:null,saveRevision:'remote-after-query',timestamp:Date.now()+100000
    }}}});
    await (window as any).__lateCloudLoad;
  }, paid);
  await page.clock.fastForward(2200);
  expect(await rawSave(page)).toBe(paidRaw);
  expect((await estado(page)).gold).toBe(4700);
  expect((await estado(page)).forjaPending).toEqual(paid.forjaPending);
  expect((await estado(page)).gameStarted).toBe(true);
  await expect(page.locator('#forjaPage')).toBeVisible();
  const uploads = await page.evaluate(() => (window as any).__lateCloudUploads);
  expect(uploads).toHaveLength(1);
  expect(uploads[0].game_progress.save).toEqual(paid);
  expect(uploads[0].game_progress.stats.bestScore).toBe(4242);
  expect(uploads[0].game_progress.achievements).toContain('remote-monotonic');
});

test('Pixel 7 compra, decide e volta por toque preservando o restante da jornada', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Contrato de toque no projeto Pixel 7.');
  await abrir(page);
  const before = await estado(page);
  await page.evaluate(() => {
    (window as any).__forjaPointerTypes = [];
    document.getElementById('forjaPage')!.addEventListener('pointerdown', event => {
      (window as any).__forjaPointerTypes.push((event as PointerEvent).pointerType);
    });
  });
  await page.getByRole('button', { name: 'Forjar item comum', exact: true }).tap();
  const paid = await estado(page);
  expect(paid.gold).toBe(before.gold - 300);
  expect(paid.forjaPending).not.toBeNull();
  await page.locator('[data-action="decidirForja"][data-arg="substituir"]').tap();
  const resolved = await estado(page);
  expect(resolved.forjaPending).toBeNull();
  expect(resolved.equipment[paid.forjaPending.slot]).toEqual(paid.forjaPending.novo);
  expect(progressoSemForja(resolved)).toEqual(progressoSemForja(before));
  await page.locator('[data-action="fecharForja"]').tap();
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('.mdock-btn.forge-item:visible')).toBeFocused();
  expect(await page.evaluate(() => (window as any).__forjaPointerTypes)).toEqual(['touch','touch','touch']);
  expect((await save(page)).gold).toBe(resolved.gold);
});
