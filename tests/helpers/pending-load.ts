import { expect, type Page } from '@playwright/test';

/** Reproduz um recurso não essencial pendente, sem depender da rede externa. */
export async function keepLoadPending(page: Page) {
  await page.route('**/__e2e_pending_resource__.png', () => {
    // Intencional: não responder até o encerramento da página pelo runner.
  });
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const image = new Image();
      image.hidden = true;
      image.src = '/__e2e_pending_resource__.png';
      document.body.appendChild(image);
    }, { once: true });
  });
}

export async function expectLoadPending(page: Page) {
  await expect(page.locator('img[src="/__e2e_pending_resource__.png"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.readyState)).toBe('interactive');
}
