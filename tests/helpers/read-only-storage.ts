import { expect, type Page } from '@playwright/test';

// state Proxy → 500 ms → saveGame → 300 ms → _doSaveGame.
// Use runFor, not fastForward: both stages must run in order. Install the
// Playwright clock before navigation so it owns the fixture's pending timers.
export async function drainJourneyAutosave(page: Page) {
  await page.clock.runFor(801);
  await expect.poll(() => page.evaluate(() => (0, eval)('_saveTimer'))).toBeNull();
}

/** Preserve every byte and detect even a write subsequently undone by the UI. */
export async function watchReadOnlyStorage(page: Page, keys: string[]) {
  const observation = await page.evaluateHandle(keys => {
    const before = keys.map(key => localStorage.getItem(key));
    const writes: string[] = [];
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    const clear = Storage.prototype.clear;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && keys.includes(String(key))) writes.push(`setItem:${key}`);
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (this === localStorage && keys.includes(String(key))) writes.push(`removeItem:${key}`);
      return removeItem.call(this, key);
    };
    Storage.prototype.clear = function () {
      if (this === localStorage) writes.push('clear');
      return clear.call(this);
    };
    return { before, writes, keys };
  }, keys);
  return async () => {
    // A keyboard/click regression can schedule a save without writing yet.
    await drainJourneyAutosave(page);
    const { before, after, writes } = await observation.evaluate(({ before, writes, keys }) => ({
      before, after: keys.map(key => localStorage.getItem(key)), writes,
    }));
    expect(after).toEqual(before);
    expect(writes, 'A consulta não deve gravar nos dados preservados').toEqual([]);
  };
}
