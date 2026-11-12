import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

// A CI usa as fontes de reserva sem depender da rede. O modo local também
// confere zero rolagem com as mesmas fontes reais do protótipo aprovado.
const realFonts = process.env.NQ_REAL_FONTS === '1';
const authors = Array.from({ length: 4 }, (_, i) => ({
  qid: 'chest-layout-' + i, t: 'Layout técnico', q: 'Questão técnica de apoio ' + i,
  opts: ['Opção A', 'Opção B', 'Opção C', 'Opção D'], ans: 0,
  exp: 'Explicação técnica de apoio.', cat: 'geral', diff: 'medium', refs: [],
}));
const layouts = [
  { width: 1440, height: 900, font: 16 },
  { width: 1366, height: 768, font: 16 },
  { width: 1280, height: 720, font: 16 },
  { width: 320, height: 740, font: 32 },
];
test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

async function progress(page: Page) {
  return page.evaluate(() => ({
    state: (0, eval)('JSON.stringify(state)'),
    persisted: ['nefroquest-stats', 'nefroquest-detailed-stats', 'nefroquest-sr-data', 'unlockedArticles']
      .map(key => [key, localStorage.getItem(key)]),
  }));
}

for (const layout of layouts) for (const name of ['AKIKI', 'PRESERVE']) {
  test(`${name}: leitura completa em ${layout.width}x${layout.height}, fonte ${layout.font}`, async ({ page }, info) => {
    await page.setViewportSize({ width: layout.width, height: layout.height });
    await page.route('**/*', route => {
      const host = new URL(route.request().url()).hostname;
      return ['localhost', '127.0.0.1'].includes(host) ||
        (realFonts && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host)) ? route.continue() : route.abort();
    });
    await routeTechnicalQuestionBank(page, authors);
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
    await injectGameState(page);
    await page.waitForFunction(() => (0, eval)('_continueGamePending === false'));
    await page.evaluate(async font => { document.documentElement.style.fontSize = font + 'px'; await document.fonts.ready; }, layout.font);
    const before = await progress(page);
    const original = await page.evaluate(name => {
      const article = (0, eval)('nefroArticles').find((article: any) => article.titulo.includes(name));
      if (!article) throw new Error('Artigo ausente: ' + name);
      (0, eval)('showChestModal')(article, 1, 40);
      return article;
    }, name);
    const card = page.locator('#chestModal .nqreader-card');
    await expect(card.getByRole('heading', { name: original.titulo, exact: true })).toBeVisible();
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
    await expect(card.locator('.nqreader-section')).toHaveCount(4);
    expect(await card.locator('.nqreader-sections p').allTextContents()).toEqual(
      ['resumo', 'conclusao', 'curiosidade', 'impacto'].map(key => original[key]));
    await expect(card.locator('.nqscroll-authors')).toHaveText(original.autores);
    await expect(card.locator('.nqscroll-journal')).toHaveText(original.jornal);

    const geometry = await card.evaluate(root => {
      const reading = root.querySelector('.nqnarr-reading')!;
      const box = (node: Element) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      return {
        card: box(root), reading: { ...box(reading), overflow: reading.scrollHeight - reading.clientHeight },
        footer: box(root.querySelector('.nqnarr-footer')!),
        sections: [...root.querySelectorAll('.nqreader-section')].map(box),
        fonts: [...root.querySelectorAll('.nqreader-sections p')].map(p => getComputedStyle(p).fontSize),
        lineHeights: [...root.querySelectorAll('.nqreader-sections p')].map(p => getComputedStyle(p).lineHeight),
        loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
        horizontalOverflow: root.scrollWidth > root.clientWidth || reading.scrollWidth > reading.clientWidth,
      };
    });
    const metrics = JSON.stringify({ realFonts, project: info.project.name, layout, name, ...geometry });
    mkdirSync(info.outputDir, { recursive: true });
    const metricsPath = info.outputPath('reading-geometry.json');
    writeFileSync(metricsPath, metrics);
    await info.attach('reading-geometry', { contentType: 'application/json', path: metricsPath });
    expect(geometry.horizontalOverflow).toBe(false);
    if (layout.font === 16) {
      expect(geometry.card.width).toBe(1160);
      expect(geometry.fonts).toEqual(['16px', '16px', '16px', '16px']);
      expect(geometry.lineHeights).toEqual(['27.2px', '27.2px', '27.2px', '27.2px']);
      expect(geometry.sections[1].x).toBeGreaterThanOrEqual(geometry.sections[0].right);
      expect(geometry.sections[2].x).toBe(geometry.sections[1].x);
      expect(geometry.sections[3].x).toBe(geometry.sections[1].x);
      expect(geometry.sections[2].y).toBeGreaterThanOrEqual(geometry.sections[1].bottom);
      expect(geometry.sections[3].y).toBeGreaterThanOrEqual(geometry.sections[2].bottom);
      expect(geometry.footer.height).toBeLessThanOrEqual(85);
      if (realFonts) {
        expect(geometry.loadedFonts).toContain('Source Sans 3');
        expect(geometry.loadedFonts).toContain('Alegreya');
        expect(geometry.reading.overflow).toBeLessThanOrEqual(1);
      }
    }
    const button = card.getByRole('button', { name: 'Continuar', exact: true });
    const b = (await button.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(48);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(layout.width);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.y + b.height).toBeLessThanOrEqual(layout.height);
    const reading = card.getByRole('region', { name: 'Leitura do pergaminho' });
    await reading.focus();
    if (geometry.reading.overflow > 1) {
      await reading.press('End');
      await expect.poll(() => reading.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#chestModal')).not.toBeVisible();
    expect(await progress(page)).toEqual(before);
  });
}
