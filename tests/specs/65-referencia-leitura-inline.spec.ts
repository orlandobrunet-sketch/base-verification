import { test, expect } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test('referência abre em popup, preserva os textos e fecha pelo teclado', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
  // O cenário de leitura não deve cruzar o marco de 100 de ouro.
  await injectGameState(page, { gold: 0 });
  await page.locator('#options button').first().click();
  const source = await page.evaluate(() => {
    return (0, eval)(`(() => {
      const key = Object.keys(refsDB).find(key => refsDB[key].resumo && refsDB[key].conclusao && refsDB[key].curiosidade);
      renderRefs([key]); setLumenEvidenceAvailable(true);
      return { key, ...refsDB[key] };
    })()`);
  });
  // O leitor não pode avançar a carta nem escrever no histórico/save/FSRS.
  // O Proxy agenda saveGame em 500 ms, seguido pelo save em 300 ms.
  // Conte a barreira após o retorno da fixture e aguarde o writer nativo;
  // nenhum campo do save é removido da comparação integral abaixo.
  const nativeSaveBarriers: unknown[] = [];
  const settleNativeSave = async () => {
    const afterFixture = await page.evaluate(() => Date.now());
    await page.waitForFunction(start => Date.now() - start >= 900 && (0, eval)('_saveTimer === null'), afterFixture);
    nativeSaveBarriers.push(await page.evaluate(start => ({
      elapsedAfterFixture: Date.now() - start, pendingNativeSave: (0, eval)('_saveTimer !== null')
    }), afterFixture));
  };
  await settleNativeSave();
  const snapshot = () => page.evaluate(() => (0, eval)(`JSON.stringify({
    current:state.current,answered:state.answered,idx:state.idx,score:state.score,
    lives:state.lives,correctTotal:state.correctTotal,questionAnswer:state.questionAnswer,
    characterLastAnswer:state.characterLastAnswer,journeyAnswerOrdinal:state.journeyAnswerOrdinal,
    errors:_sessionWrongAnswers,storage:Object.fromEntries(Object.entries(localStorage).sort(([a],[b])=>a.localeCompare(b)))
  })`));
  const before = await snapshot();
  const button = page.locator('.ref-resumo-btn').first();
  await button.click();
  await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  const reader = page.locator('.bib-resumo-modal [role="dialog"]');
  await expect(reader).toBeVisible();
  await expect(reader.locator('.nqreader-badge')).toHaveText(source.badge);
  if (source.tipo) await expect(reader.locator('.nqreader-type')).toHaveText(source.tipo);
  const detail = reader.locator('.nqnarr-reading');
  await expect(detail).toBeVisible();
  await expect(detail.locator('section').nth(0).locator('p')).toHaveText(source.resumo);
  await expect(detail.locator('section').nth(1).locator('p')).toHaveText(source.conclusao);
  await expect(detail.locator('section').nth(2).locator('p')).toHaveText(source.curiosidade);
  await detail.focus();
  await page.keyboard.press('Enter');
  expect(await snapshot()).toBe(before);
  const scrollBeforeSpace = await detail.evaluate(el => el.scrollTop);
  const hasScroll = await detail.evaluate(el => el.scrollHeight > el.clientHeight + 1);
  await page.keyboard.press('Space');
  if (hasScroll) await expect.poll(() => detail.evaluate(el => el.scrollTop)).toBeGreaterThan(scrollBeforeSpace);
  for (const key of ['1', '2', '3', '4', 'a', 'b', 'c', 'd']) await page.keyboard.press(key);
  expect(await snapshot()).toBe(before);
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    for (const percent of [100, 200]) {
      await test.step('referência em ' + width + 'px, texto a ' + percent + '%', async () => {
        await page.evaluate(async percent => {
          document.documentElement.style.fontSize = percent === 200 ? '32px' : '16px';
          await document.fonts.ready;
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        }, percent);
        const metrics = await detail.evaluate(el => {
          const box = el.getBoundingClientRect();
          const cut: string[] = [];
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!(node.textContent || '').trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            if (Array.from(range.getClientRects()).some(rect => rect.width && rect.height &&
              (rect.left < box.left - 1 || rect.right > box.right + 1))) {
              cut.push(node.textContent || '');
            }
          }
          return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, cut };
        });
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
        expect(metrics.cut, 'os títulos e parágrafos devem caber na largura do leitor').toEqual([]);
        const close = reader.getByRole('button', { name: 'Concluir leitura', exact: true });
        await expect(close).toBeInViewport();
        expect(await close.evaluate(el => {
          const r = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        }), 'fechar permanece alcançável com texto ampliado').toBe(true);
        await detail.evaluate(el => { el.scrollTop = el.scrollHeight; });
        await detail.locator('.nqreader-curiosidade p').scrollIntoViewIfNeeded();
        await expect(detail.locator('.nqreader-curiosidade p')).toBeInViewport();
        expect(await snapshot()).toBe(before);
      });
    }
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await expect(button).toBeFocused();
  expect(await snapshot()).toBe(before);
  // Fixture apenas do leitor: ausência de dados não inventa conteúdo ou tipo.
  await page.evaluate(() => (window as any)._showResumoModal({ label: 'Leitor sem resumo', resumo: '' }));
  await expect(reader.locator('.nqreader-resumo p')).toHaveText('Esta entrada não possui resumo cadastrado.');
  await expect(reader.locator('.nqreader-meta')).toHaveCount(0);
  await expect(reader).not.toHaveAttribute('data-reader-type');
  await expect(reader).not.toHaveAttribute('data-reader-rarity');
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  expect(await snapshot()).toBe(before);
  // A chamada legada por chave também mantém protegida uma carta ainda sem
  // resposta. Avançar aqui é uma ação explícita da fixture, fora do leitor.
  await page.evaluate(() => (window as any).renderQuestion());
  await expect(page.locator('#options .option')).toHaveCount(4);
  await settleNativeSave();
  const unanswered = await snapshot();
  expect(await page.evaluate(() => (window as any).state.answered)).toBe(false);
  await page.evaluate(key => (window as any).openRefResumo(key), source.key);
  await expect(reader).toBeVisible();
  await reader.getByRole('region').focus();
  for (const key of ['1', '2', '3', '4', 'a', 'b', 'c', 'd', 'Enter', 'Space']) await page.keyboard.press(key);
  expect(await snapshot()).toBe(unanswered);
  await page.keyboard.press('Escape');
  await expect(page.locator('.bib-resumo-modal')).toHaveCount(0);
  await test.info().attach('native-save-barriers', { body: JSON.stringify(nativeSaveBarriers), contentType: 'application/json' });
});
