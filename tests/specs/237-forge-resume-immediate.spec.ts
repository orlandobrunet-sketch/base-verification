import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const slots = ['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot'];
const equipment = Object.fromEntries(slots.map(slot => [slot,
  { n: 'Anterior ' + slot, rar: 'common', atk: 1, def: 2, kno: 3, luck: 4 },
]));
const authors = Array.from({ length: 6 }, (_, index) => ({
  qid: 'forge-resume-technical-' + index, cat: 'geral',
  q: 'Marcador técnico da retomada ' + index, opts: ['Um', 'Dois', 'Três', 'Quatro'],
  ans: index % 4, exp: 'Fixture técnica de persistência e navegação.',
}));

async function snapshot(page: Page) {
  return page.evaluate(() => (0, eval)(`JSON.parse(JSON.stringify({
    gold:state.gold,equipment:state.equipment,forjaPending:state.forjaPending,
    obtainedItems:state.obtainedItems,character:state.character,level:state.level,
    xp:state.xp,score:state.score,lives:state.lives,correctTotal:state.correctTotal,
    answered:state.answered,currentId:state.current?.id
  }))`));
}

test('retomar entrega imediatamente a decisão já paga sem liberar a questão ou cobrar outra vez', async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const writes: string[] = [];
  await context.route('**/*', route => {
    const request = route.request();
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push(request.method() + ' ' + new URL(request.url()).pathname);
      return route.abort();
    }
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
    return new URL(request.url()).origin === origin ? route.continue() : route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  await routeTechnicalQuestionBank(page, authors);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await injectGameState(page, { schemaVersion: 6, gold: 5000, equipment,
    obtainedItems: Object.values(equipment).map(item => item.n) });
  await page.evaluate(() => {
    (0, eval)('_doSaveGame()');
    (0, eval)('Math.random = () => 0');
    (window as any).showForjaModal();
  });
  await page.getByRole('button', { name: 'Forjar item aleatório', exact: true }).click();
  const paid = await snapshot(page);
  expect(paid.gold).toBe(4700);
  expect(paid.forjaPending).not.toBeNull();
  expect(paid.forjaPending.atual.rar).toBe('common');
  const persistedPaid = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!));
  expect(persistedPaid).toMatchObject({ gold: 4700, forjaPending: paid.forjaPending, equipment: paid.equipment });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => { (window as any).playAsGuest(); await (window as any)._loadTopics(); });
  const frozen = Date.now() + 1000;
  await page.clock.install({ time: frozen - 1000 });
  await page.clock.pauseAt(frozen);
  await page.evaluate(async () => { await (window as any).continueGame(); });
  // No timer has advanced: the paid choice must already own the interface.
  expect(await page.evaluate(() => Date.now())).toBe(frozen);
  await expect(page.locator('#forjaPage')).toBeVisible();
  await expect(page.locator('#mainApp')).toBeHidden();
  await expect(page.locator('[data-action="decidirForja"][data-arg="substituir"]')).toBeFocused();
  expect(await snapshot(page)).toEqual(paid);
  await page.keyboard.press('1');
  expect(await snapshot(page)).toEqual(paid);

  await page.locator('[data-action="decidirForja"][data-arg="substituir"]').click();
  const decided = await snapshot(page);
  expect(decided.gold).toBe(4720);
  expect(decided.forjaPending).toBeNull();
  expect(decided.equipment[paid.forjaPending.slot]).toEqual(paid.forjaPending.novo);
  const { gold, equipment: equipped, forjaPending, ...progress } = decided;
  const { gold: paidGold, equipment: oldEquipment, forjaPending: pending, ...paidProgress } = paid;
  expect(progress).toEqual(paidProgress);
  await page.evaluate(() => { (window as any).decidirForja('substituir'); (window as any).decidirForja('manter'); });
  await page.clock.fastForward(1000);
  expect(await snapshot(page)).toEqual(decided);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!));
  expect(saved).toMatchObject({ gold: 4720, equipment: decided.equipment, forjaPending: null });
  await expect(page.locator('#mainApp')).toBeHidden();
  await expect(page.locator('#forjaResultado')).toBeFocused();
  expect(writes).toEqual([]);
});
