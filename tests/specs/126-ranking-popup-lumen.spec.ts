import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const records = Array.from({ length: 24 }, (_, i) => ({
  player_name: i === 14 ? 'Ana da coleção' : `Explorador ${String(i + 1).padStart(2, '0')}`,
  character_name: ['Dr. Nephros', 'Dra. Aquaria', 'Dr. Glomerulus'][i % 3],
  score: 900 - i * 17, level: 12 - i % 8, chests_opened: i % 5,
  played_at: '2026-10-01T12:00:00Z',
  total_correct: 800 - i * 10, total_games: 12 + i, best_level: 12 - i % 8,
}));

async function openRanking(page: Page, beforeOpening?: () => Promise<void>) {
  const requests = { records: 0, profiles: 0, writes: [] as string[] };
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      requests.writes.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname.startsWith('/rest/v1/leaderboard')) {
      requests.records++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(records) });
    }
    if (url.pathname.startsWith('/rest/v1/profiles_stats')) {
      requests.profiles++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(records) });
    }
    return url.hostname === 'localhost' ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => (window as any).playAsGuest());
  await page.evaluate(() => (0, eval)('state.lastSubmittedName = "Ana da coleção"'));
  await beforeOpening?.();
  await page.locator('[data-atrium-route="ranking"]').click();
  await expect(page.locator('#boardBody tr')).toHaveCount(records.length);
  return requests;
}

test('Escape keeps the static popup reusable and restores focus to its opener', async ({ page }) => {
  await openRanking(page);
  const popup = page.locator('#boardModal .board-modal');
  await expect(popup).toHaveAttribute('role', 'dialog');
  await expect(popup).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('.board-tab-btn[data-arg="record"]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#boardModal .auth-close-btn')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#closeBoard')).toBeFocused();
  await page.keyboard.press('Tab');
  // The close icon precedes the tabs in the preserved popup's DOM.
  await expect(page.locator('#boardModal .auth-close-btn')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#boardModal')).toBeHidden();
  await expect(popup).toHaveCount(1);
  await expect(page.locator('[data-atrium-route="ranking"]')).toBeFocused();
  await page.locator('[data-atrium-route="ranking"]').click();
  await expect(popup).toBeVisible();
  await page.locator('#closeBoard').click();
  await expect(page.locator('#boardModal')).toBeHidden();
  await expect(page.locator('[data-atrium-route="ranking"]')).toBeFocused();
});

test('Escape in the atrium preserves the ranking before its first opening and after closing', async ({ page }) => {
  const popup = page.locator('#boardModal .board-modal');
  const opener = page.locator('[data-atrium-route="ranking"]');
  const requests = await openRanking(page, async () => {
    await expect(page.locator('#boardModal')).toBeHidden();
    await expect(popup).toHaveCount(1);
    await opener.focus();
    await page.keyboard.press('Escape');
    await expect(popup, 'Escape outside the popup removed its static panel before opening').toHaveCount(1);
    await expect(opener).toBeFocused();
  });
  await expect(popup).toBeVisible();
  await expect(page.locator('.board-tab-btn[data-arg="record"]')).toBeFocused();
  await page.locator('#closeBoard').click();
  await expect(page.locator('#boardModal')).toBeHidden();
  await expect(opener).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popup, 'Escape in the atrium removed the panel after it had been closed').toHaveCount(1);
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(popup).toBeVisible();
  await expect(page.locator('#boardBody tr')).toHaveCount(records.length);
  await page.locator('#boardSearch').fill('Ana da coleção');
  await expect(page.locator('#boardBody tr')).toHaveCount(1);
  await expect(page.locator('#boardBody')).toContainText('Ana da coleção');
  await page.locator('#boardRefresh').click();
  await expect.poll(() => requests.records).toBeGreaterThan(1);
  await expect(page.locator('#boardLoading')).toBeHidden();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  // A redraw can drop focus onto body. Escape must still close the static
  // popup through its close function rather than remove its panel.
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await expect(page.locator('body')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#boardModal')).toBeHidden();
  await expect(popup).toHaveCount(1);
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(popup).toBeVisible();
  await expect(page.locator('#boardSearch')).toHaveValue('Ana da coleção');
  await expect(page.locator('#boardBody tr')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#boardModal')).toBeHidden();
  await expect(opener).toBeFocused();
  expect(requests.writes).toEqual([]);
});

test('search, own position, both tabs and refresh keep their original data behavior', async ({ page }) => {
  const requests = await openRanking(page);
  await page.locator('#boardSearch').fill('Ana da coleção');
  await expect(page.locator('#boardBody tr')).toHaveCount(1);
  await expect(page.locator('#boardBody')).toContainText('Ana da coleção');
  await page.locator('#boardMyPos').click();
  await expect(page.locator('#boardSearch')).toHaveValue('');
  await expect(page.locator('#boardBody tr')).toHaveCount(records.length);
  await expect(page.locator('#boardBody tr.rank-me')).toBeInViewport();
  await page.locator('.board-tab-btn[data-arg="global"]').click();
  await expect(page.locator('#boardHead')).toContainText('Acertos');
  await expect(page.locator('#boardBody')).toContainText('800');
  expect(requests.profiles).toBe(1);
  await page.locator('.board-tab-btn[data-arg="record"]').click();
  await expect(page.locator('#boardHead')).toContainText('Pontos');
  await expect(page.locator('#boardBody')).toContainText('900');
  const beforeRefresh = requests.records;
  await page.locator('#boardRefresh').click();
  await expect.poll(() => requests.records).toBeGreaterThan(beforeRefresh);
  await expect(page.locator('#boardBody tr')).toHaveCount(records.length);
  expect(requests.writes).toEqual([]);
});

for (const width of [320, 390]) {
  test(`popup can scroll at ${width}px and 200% text without losing controls`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'This scenario fixes its own viewport.');
    await page.setViewportSize({ width, height: 700 });
    await openRanking(page);
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
    const dimensions = await page.locator('#boardModal .board-modal').evaluate(panel => {
      const box = panel.getBoundingClientRect();
      return { left: box.left, right: box.right, max: innerWidth, scrollable: panel.scrollHeight > panel.clientHeight };
    });
    expect(dimensions.left).toBeGreaterThanOrEqual(0);
    expect(dimensions.right).toBeLessThanOrEqual(dimensions.max);
    expect(dimensions.scrollable).toBe(true);
    for (const button of await page.locator('#boardModal button').all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.locator('#boardRefresh').click();
    await expect(page.locator('#boardRefresh')).toBeInViewport();
    await page.locator('#closeBoard').click();
    await expect(page.locator('#boardModal')).toBeHidden();
    await page.locator('[data-atrium-route="ranking"]').click();
    await expect(page.locator('#boardModal .board-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#boardModal')).toBeHidden();
  });
}
