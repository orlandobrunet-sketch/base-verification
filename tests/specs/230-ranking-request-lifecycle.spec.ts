import { test, expect, type Page, type Route } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

const names = ['Ágata ouro', 'Bruno prata', 'Cora bronze', 'Davi quarto', 'Ana quinta'];
const records = names.map((player_name, index) => ({
  player_name, user_id: 'rank-' + index, character_name: 'Dr. Nephros',
  score: 900 - index * 10, level: 5, chests_opened: 2, best_streak: 8,
  played_at: '2026-11-11T12:00:00Z',
}));
const profiles = names.map((player_name, index) => ({
  player_name, user_id: 'rank-' + index, character_name: 'Dra. Aquaria',
  total_correct: 80 - index * 5, best_level: 6, total_games: 10,
  updated_at: '2026-11-11T12:00:00Z',
}));

async function prepare(page: Page, hold: 'record' | 'global' | null = null) {
  const pending: Record<'record' | 'global', Route[]> = { record: [], global: [] };
  const writes: string[] = [];
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push(request.method() + ' ' + url.pathname);
      return route.abort();
    }
    const mode = url.pathname.startsWith('/rest/v1/leaderboard') ? 'record'
      : url.pathname.startsWith('/rest/v1/profiles_stats') ? 'global' : null;
    if (mode) {
      if (mode === hold) { pending[mode].push(route); return; }
      return route.fulfill({ status: 200, json: mode === 'record' ? records : profiles });
    }
    if (['image', 'font', 'media'].includes(request.resourceType())) return route.abort();
    return url.hostname === 'localhost' ? route.continue() : route.abort();
  });
  await routeTechnicalQuestionBank(page, [{
    qid: 'ranking-lifecycle-technical', q: 'Marcador técnico do ranking',
    opts: ['Um', 'Dois', 'Três', 'Quatro'], ans: 0, exp: 'Fixture técnica.',
  }]);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => (window as any).playAsGuest());
  const opener = page.locator('[data-atrium-route="ranking"]');
  await opener.click();
  const modal = page.locator('#boardModal');
  await expect(modal).toBeVisible();
  if (hold !== 'record') await expect(page.locator('#boardBody tr')).toHaveCount(5);
  const release = async (mode: 'record' | 'global', fail = false) => {
    await expect.poll(() => pending[mode].length).toBeGreaterThan(0);
    const route = pending[mode].shift()!;
    if (fail) await route.abort();
    else await route.fulfill({ status: 200, json: mode === 'record' ? records : profiles });
    await settle(page);
  };
  return { opener, modal, pending, writes, release };
}

async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test('a busca mantém a posição quinta e a medalha de prata nos dois modos', async ({ page }) => {
  const { writes } = await prepare(page);
  for (const mode of ['record', 'global']) {
    if (mode === 'global') await page.locator('.board-tab-btn[data-arg="global"]').click();
    await page.locator('#boardSearch').fill('Ana quinta');
    await expect(page.locator('#boardBody tr')).toHaveCount(1);
    await expect(page.locator('#boardBody .rank-badge')).toHaveText('5');
    await expect(page.locator('#boardBody .rank-badge')).toHaveClass(/\brn\b/);
    await page.locator('#boardSearch').fill('Bruno prata');
    await expect(page.locator('#boardBody .player-name-text')).toHaveText('Bruno prata');
    await expect(page.locator('#boardBody .rank-badge')).toHaveText('🥈');
    await expect(page.locator('#boardBody tr')).toHaveClass(/\brank-2\b/);
    await page.locator('#boardSearch').fill('');
    await expect(page.locator('#boardBody tr')).toHaveCount(5);
  }
  expect(writes).toEqual([]);
});

for (const fail of [false, true]) {
  test(`um recorde atrasado ${fail ? 'com falha' : 'com sucesso'} não substitui o Perfil Global`, async ({ page }) => {
    const { pending, release, writes } = await prepare(page, 'record');
    await expect.poll(() => pending.record.length).toBe(1);
    await page.locator('.board-tab-btn[data-arg="global"]').click();
    await expect(page.locator('#boardBody .score-cell').first()).toHaveText('80');
    await release('record', fail);
    await expect(page.locator('.nq-toast').filter({ hasText: /ranking/i })).toHaveCount(0);
    await expect(page.locator('#boardHead')).toContainText('Acertos');
    await expect(page.locator('#boardBody .score-cell').first()).toHaveText('80');
    await expect(page.locator('#boardBody tr')).toHaveCount(5);
    await expect(page.locator('#boardLoading')).toBeHidden();
    expect(writes).toEqual([]);
  });
}

test('uma falha atrasada de Perfil Global não apaga o Recorde já atualizado', async ({ page }) => {
  const { pending, release, writes } = await prepare(page, 'global');
  await page.locator('.board-tab-btn[data-arg="global"]').click();
  await expect.poll(() => pending.global.length).toBe(1);
  await page.locator('.board-tab-btn[data-arg="record"]').click();
  await expect(page.locator('#boardBody .score-cell').first()).toHaveText('900');
  await release('global', true);
  await expect(page.locator('.nq-toast').filter({ hasText: /ranking/i })).toHaveCount(0);
  await expect(page.locator('#boardHead')).toContainText('Pontos');
  await expect(page.locator('#boardBody .score-cell').first()).toHaveText('900');
  await expect(page.locator('#boardBody tr')).toHaveCount(5);
  expect(writes).toEqual([]);
});

test('uma falha atual de Perfil Global mostra erro sem inventar um ranking vazio', async ({ page }) => {
  const { release, writes } = await prepare(page, 'global');
  await page.locator('.board-tab-btn[data-arg="global"]').click();
  await release('global', true);
  await expect(page.locator('#boardBody')).toContainText(/não foi possível carregar o ranking/i);
  await expect(page.locator('#boardBody')).not.toContainText(/ninguém montou|jogue para acumular/i);
  await expect(page.locator('#boardLoading')).toBeHidden();
  expect(writes).toEqual([]);
});

for (const close of ['button', 'escape']) {
  test(`fechar por ${close} ignora a resposta pendente e permite reabrir imediatamente`, async ({ page }) => {
    const { opener, modal, pending, release, writes } = await prepare(page, 'record');
    await expect.poll(() => pending.record.length).toBe(1);
    const before = await page.locator('#boardBody').innerHTML();
    const updatedBefore = await page.locator('#boardLastUpdate').textContent();
    await page.evaluate(() => { (window as any).__sharedRankingRead = (window as any).boardFetch(); });
    if (close === 'button') await page.locator('#closeBoard').click();
    else await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(opener).toBeFocused();
    await release('record');
    expect(await page.evaluate(async () => (await (window as any).__sharedRankingRead).map((row: any) => row.player_name))).toEqual(names);
    expect(await page.locator('#boardBody').innerHTML()).toBe(before);
    expect(await page.locator('#boardLastUpdate').textContent()).toBe(updatedBefore);
    await expect(opener).toBeFocused();
    await opener.click();
    await expect(modal).toBeVisible();
    await expect(page.locator('#boardBody tr')).toHaveCount(5);
    await expect(page.locator('#boardLoading')).toBeHidden();
    expect(writes).toEqual([]);
  });
}

test('uma busca pendente não renderiza dados do modo anterior durante a troca', async ({ page }) => {
  const { pending, release, writes } = await prepare(page, 'global');
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.locator('#boardSearch').fill('Bruno prata');
  await page.locator('.board-tab-btn[data-arg="global"]').click();
  await expect.poll(() => pending.global.length).toBe(1);
  await page.clock.fastForward(250);
  await expect(page.locator('#boardLoading')).toBeVisible();
  await expect(page.locator('#boardBody tr')).toHaveCount(0);
  await page.locator('#boardSearch').fill('Ana quinta');
  await page.clock.fastForward(250);
  await expect(page.locator('#boardBody tr')).toHaveCount(0);
  // Restore animation frames before letting the controlled response finish.
  await page.clock.resume();
  await release('global');
  await expect(page.locator('#boardBody .player-name-text')).toHaveText('Ana quinta');
  await expect(page.locator('#boardBody .score-cell')).toHaveText('60');
  await expect(page.locator('#boardBody .rank-badge')).toHaveText('5');
  expect(writes).toEqual([]);
});
