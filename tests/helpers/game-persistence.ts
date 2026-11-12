import type { Page } from '@playwright/test';

/** Instalar antes de navegar: observa autosaves reais, sem gravar ou cancelar. */
export async function installGameSaveObserver(page: Page) {
  await page.addInitScript(() => {
    const pending = new Set<number>();
    (window as any).__pendingGameAutosavesForTest = pending;
    const schedule = window.setTimeout, cancel = window.clearTimeout;
    window.setTimeout = function(handler: TimerHandler, delay?: number, ...args: any[]) {
      if (typeof handler !== 'function' || handler.name !== 'saveGame') return schedule.apply(this, [handler, delay, ...args]);
      const timer = schedule.call(this, function(...callbackArgs: any[]) {
        pending.delete(timer);
        return handler.apply(this, callbackArgs);
      }, delay, ...args);
      pending.add(timer);
      return timer;
    };
    window.clearTimeout = function(timer?: number) {
      if (timer !== undefined) pending.delete(timer);
      return cancel.call(this, timer);
    };
  });
}

/** O ID de _autoSaveTimer permanece preenchido depois da execução. */
export async function waitForPendingGameSave(page: Page) {
  await page.waitForFunction(() => (window as any).__pendingGameAutosavesForTest.size === 0 && (0, eval)('_saveTimer === null'), null, { timeout: 5000 });
}
