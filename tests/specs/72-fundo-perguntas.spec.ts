import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * Na tela de perguntas, o cenário é ambiente, não conteúdo.
 *
 * O proprietário relatou que o fundo "destoa, parece muita informação, cansa":
 * a ilustração aparecia viva e saturada atrás do enunciado, com partículas
 * flutuando. Ascension substitui a ilustração por gradientes escuros:
 * nenhum download anatômico, filtro ou movimento é necessário. O contrato
 * mede os pixels compostos pelo Chromium, incluindo a .bg-overlay, com
 * luminância relativa máxima de 0.05 (5% do branco), média de 0.02 e
 * amplitude de 0.025; a cor permanece discreta (croma RGB até 0.12).
 * Esses limites medem o resultado visual, não o parâmetro brightness de
 * uma imagem antiga. Nenhuma métrica ausente/NaN pode ser aprovação.
 * O contraste conservador do texto é verificado contra o pixel mais claro
 * do cenário e as superfícies RGBA de leitura; fontes/reflow
 * continuam cobertos pelo spec19 e pela auditoria visual independente.
 * Boss e Confronto Final têm fundos próprios.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

test('o fundo da tela de perguntas fica em segundo plano', async ({ page }, testInfo) => {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await expect(page.locator('#mainApp')).toBeVisible();

  const fundo = await page.evaluate(() => {
    const layer = document.querySelector('.bg-layer')!;
    const overlay = document.querySelector('.bg-overlay')!;
    const styles = [layer, overlay].map(element => {
      const style = getComputedStyle(element);
      return {
        image: style.backgroundImage, filter: style.filter,
        animation: style.animationName, opacity: style.opacity,
      };
    });
    return { styles, particulas: getComputedStyle(document.querySelector('.particles')!).display };
  });
  expect(fundo.particulas).toBe('none');
  for (const style of fundo.styles) {
    expect(style.image).toContain('gradient(');
    expect(style.image, 'the anatomical image must not return').not.toMatch(/url\(/i);
    expect(style.filter).toBe('none');
    expect(style.animation).toBe('none');
    expect(Number(style.opacity)).toBe(1);
  }

  // Visibility hides foreground paint only during this native capture; it
  // preserves layout and the :has(#mainApp:not(.hidden)) background selector.
  // No rescaling, masks, CDP capture or external PNG library is involved.
  const screenshot = await page.screenshot({
    style: 'body > :not(.bg-layer):not(.bg-overlay) { visibility: hidden !important; } ' +
      'body > :not(.bg-layer):not(.bg-overlay) * { visibility: hidden !important; }',
  });
  const pixels = await page.evaluate(async dataURL => {
    const image = new Image();
    image.src = dataURL;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const luminance = (rgb: number[]) => rgb.map(value => value / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    let min = Infinity, max = -Infinity, sum = 0, maxChroma = 0, opaque = 0;
    for (let index = 0; index < rgba.length; index += 4) {
      const rgb = [rgba[index], rgba[index + 1], rgba[index + 2]];
      const value = luminance(rgb);
      min = Math.min(min, value);
      max = Math.max(max, value);
      sum += value;
      maxChroma = Math.max(maxChroma, (Math.max(...rgb) - Math.min(...rgb)) / 255);
      if (rgba[index + 3] === 255) opaque++;
    }
    return {
      width: canvas.width, height: canvas.height, scale: devicePixelRatio,
      count: rgba.length / 4, opaque, min, max, mean: sum / (rgba.length / 4), maxChroma,
    };
  }, 'data:image/png;base64,' + screenshot.toString('base64'));
  expect(pixels.count).toBeGreaterThan(0);
  expect(pixels.opaque).toBe(pixels.count);
  // Fractional device scales can round the native bitmap by one physical px.
  expect(Math.abs(pixels.width - page.viewportSize()!.width * pixels.scale)).toBeLessThanOrEqual(1);
  expect(Math.abs(pixels.height - page.viewportSize()!.height * pixels.scale)).toBeLessThanOrEqual(1);
  for (const metric of [pixels.min, pixels.max, pixels.mean, pixels.maxChroma]) {
    expect(Number.isFinite(metric), 'every rendered metric must be finite').toBe(true);
  }
  expect(pixels.min).toBeGreaterThan(0);
  expect(pixels.max, 'dark scenario, including the brightest edge').toBeLessThanOrEqual(.05);
  expect(pixels.mean).toBeLessThanOrEqual(.02);
  expect(pixels.max - pixels.min, 'subtle light variation').toBeLessThanOrEqual(.025);
  expect(pixels.max - pixels.min, 'the gradient must actually be rendered').toBeGreaterThan(.0001);
  expect(pixels.maxChroma, 'subtle absolute color variation').toBeLessThanOrEqual(.12);

  const textContrast = await page.evaluate(backgroundMax => {
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => value / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const color = (value: string) => {
      if (!/^rgba?\(/.test(value)) throw new Error('Unsupported color: ' + value);
      const rgba = value.match(/[\d.]+/g)!.map(Number);
      return [...rgba.slice(0, 3), rgba[3] ?? 1];
    };
    return Array.from(document.querySelectorAll('#question, #options .opt-body')).map(element => {
      let max = backgroundMax;
      const ancestors: Element[] = [];
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) ancestors.push(ancestor);
      for (const ancestor of ancestors.reverse()) {
        const style = getComputedStyle(ancestor);
        if (Number(style.opacity) !== 1 || style.filter !== 'none' || style.mixBlendMode !== 'normal' ||
            style.backdropFilter !== 'none') {
          throw new Error('Unsupported text composition: ' + ancestor.tagName);
        }
        // Reading surfaces currently have only RGBA colors. Reject a new
        // image/gradient rather than partially parsing its colors or assuming
        // an interpolation space. The separate scene is rasterized above.
        if (style.backgroundImage !== 'none') {
          throw new Error('Unmodeled reading-surface background: ' + style.backgroundImage);
        }
        // A conservative bound includes every ancestor surface. Relative
        // luminance is convex in sRGB, so alpha*L(color)+(1-alpha)*L(backdrop)
        // bounds the luminance of the actual alpha-composited channels.
        // Keeping the prior maximum also includes transparent/unpainted areas.
        const rgba = color(style.backgroundColor);
        if (rgba[3] > 0) max = Math.max(max, rgba[3] * luminance(rgba) + (1 - rgba[3]) * max);
      }
      const foreground = color(getComputedStyle(element).color);
      if (foreground[3] !== 1) throw new Error('Text color must be opaque');
      const foregroundLuminance = luminance(foreground);
      if (foregroundLuminance <= max) throw new Error('Text must be lighter than its dark background');
      return { selector: element.id || element.className, minimum: (foregroundLuminance + .05) / (max + .05) };
    });
  }, pixels.max);
  expect(textContrast).toHaveLength(5);
  for (const text of textContrast) {
    expect(Number.isFinite(text.minimum)).toBe(true);
    expect(text.minimum, text.selector + ': conservative contrast').toBeGreaterThanOrEqual(4.5);
  }
  await expect(page.locator('#mainApp')).toBeVisible();
  await testInfo.attach('rendered-question-background', { body: screenshot, contentType: 'image/png' });
  await testInfo.attach('rendered-background-metrics', {
    body: JSON.stringify({ fundo, pixels, textContrast }, null, 2), contentType: 'application/json',
  });
});
