import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
});

async function abrir(page: Page, level = 5) {
  await injectGameState(page, { level, correctTotal: (level - 1) * 10 + 4, xp: 150, character: 'nephros' });
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
}

test('preview da próxima forma declara os dois requisitos e devolve foco sem responder a questão', async ({ page }, testInfo) => {
  await abrir(page);
  const snapshot = () => page.evaluate(() => JSON.stringify((0, eval)('({idx:state.idx,level:state.level,xp:state.xp,correctTotal:state.correctTotal,lives:state.lives,score:state.score})')));
  const before = await snapshot();
  const nodes = page.locator('.nqd-form-node');
  await expect(nodes).toHaveCount(3);
  await expect(nodes.nth(2).locator('svg')).toHaveCount(1);
  const next = nodes.nth(1);
  if (testInfo.project.name === 'mobile') await next.tap();
  else await next.click();
  const dialog = page.locator('.nqd-form-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('src', 'assets/classes-cinema/clerigo_renal/nivel_06.webp');
  await expect(dialog).toContainText('50 acertos na jornada — faltam 6');
  await expect(dialog).toContainText('XP restante até esta forma: 199');
  await page.keyboard.press('1');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Fechar arte ampliada' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(next).toBeFocused();
  await expect(page.locator('#nqDashboard')).toBeVisible();
  expect(await snapshot()).toBe(before);
});

test('a silhueta abre a arte real e o XP acumulado até a forma seguinte', async ({ page }) => {
  await abrir(page);
  await page.locator('.nqd-form-node').nth(2).click();
  const dialog = page.locator('.nqd-form-dialog');
  await expect(dialog.locator('img')).toHaveAttribute('src', 'assets/classes-cinema/clerigo_renal/nivel_07.webp');
  await expect(dialog).toContainText('60 acertos na jornada — faltam 16');
  await expect(dialog).toContainText('XP restante até esta forma: 601');
  await dialog.getByRole('button', { name: 'Fechar arte ampliada' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.nqd-form-node').nth(2)).toBeFocused();
});

test('arte ampliada em 320px e texto200% preserva leitura e fechamento após rolar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await abrir(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.locator('.nqd-form-node').nth(1).click();
  const dialog = page.locator('.nqd-form-dialog');
  const close = dialog.getByRole('button', { name: 'Fechar arte ampliada' });
  await dialog.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const geometry = await dialog.evaluate(el => {
    const close = el.querySelector('.nqd-form-close')!;
    const r = close.getBoundingClientRect();
    const title = el.querySelector('h2')!, box = title.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(title);
    return { width: el.clientWidth, scrollWidth: el.scrollWidth, closeWidth: r.width, closeHeight: r.height,
      hit: close.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)),
      clipping: [...range.getClientRects()].some(line => line.width && (line.left < box.left - 1 || line.right > box.right + 1)) };
  });
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
  expect(geometry.closeWidth).toBeGreaterThanOrEqual(44);
  expect(geometry.closeHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.hit).toBe(true);
  expect(geometry.clipping).toBe(false);
  await close.click();
  await expect(dialog).toHaveCount(0);
});

for (const [level, expected] of [[1, ['1', '2', '3']], [9, ['9', '10']], [10, ['10']]] as const) {
  test(`nível ${level} mostra apenas as formas existentes`, async ({ page }) => {
    await abrir(page, level);
    const levels = await page.locator('.nqd-form-node').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.formLevel));
    expect(levels).toEqual(expected);
    await page.locator('.nqd-form-node').first().click();
    await expect(page.locator('.nqd-form-dialog')).toContainText(level === 1 ? 'Forma inicial' : 'forma atual');
    await expect(page.locator('.nqd-form-dialog')).not.toContainText('XP restante');
  });
}

test('contorno de desempenho fecha a última aresta e fica contínuo com os sete eixos', async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => {
    (window as any).closeDashboard();
    const ids = ['glomerulopatias', 'hidroeletrolitico_acidobase', 'drc_nefroprotecao', 'nefrologia_geral_diagnostico', 'lra_critico', 'dialise', 'transplante'];
    const values = [84, 73, 74, 76, 76, 84, 82];
    (window as any).getCoreSkillsStats = () => ids.map((id, index) => ({ id, label: id, totalAnswered: 100, accuracy: values[index] }));
    (window as any).openDashboard();
  });
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
  await page.getByRole('tab', { name: 'Competências', exact: true }).click();
  const mobile = page.locator('.nqd-skill-radar-mobile');
  if (await mobile.isVisible()) await mobile.locator('summary').click();
  const canvas = page.locator('.nqd-radar:visible canvas');
  await expect(canvas).toBeVisible();
  const missing = () => canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d')!;
    const ratio = el.width / 380;
    const values = [84, 73, 74, 76, 76, 84, 82];
    const points = values.map((value, index) => {
      const angle = -Math.PI / 2 + 2 * Math.PI * index / values.length;
      return { x: 190 + Math.cos(angle) * 108 * value / 100, y: 190 + Math.sin(angle) * 108 * value / 100 };
    });
    const failures: string[] = [];
    for (let index = 0; index < points.length; index += 1) {
      const a = points[index], b = points[(index + 1) % points.length];
      for (const fraction of [.2, .4, .6, .8]) {
        const x = Math.round((a.x + (b.x - a.x) * fraction) * ratio);
        const y = Math.round((a.y + (b.y - a.y) * fraction) * ratio);
        const pixels = ctx.getImageData(x - 2, y - 2, 5, 5).data;
        let cyan = false;
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (Math.abs(pixels[offset] - 159) < 20 && Math.abs(pixels[offset + 1] - 219) < 20 && Math.abs(pixels[offset + 2] - 228) < 20 && pixels[offset + 3] > 180) cyan = true;
        }
        if (!cyan) failures.push(`${index}:${fraction}`);
      }
    }
    return failures;
  });
  await expect.poll(missing, { message: 'todas as arestas, inclusive última→primeira, precisam ter o contorno ciano contínuo' }).toEqual([]);
});
