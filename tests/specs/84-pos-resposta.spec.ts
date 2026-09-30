import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.goto('/jogar/');
  await injectGameState(page, { gold: 0, streak: 0 });
});
async function respond(page: Page, correct: boolean) {
  const q = await page.evaluate(() => (0, eval)('state.current'));
  const idx = correct ? q.a : (q.a + 1) % q.o.length;
  await page.locator('#options .option').nth(idx).click();
  await expect(page.locator('#nqlQuestionRatingToggle')).toBeVisible();
  return { ...q, idx };
}
async function captureSubmissions(page: Page) {
  await page.evaluate(() => {
    (window as any).__reviewWrites = [];
    (window as any).__reviewClient = { from: (table: string) => ({
      insert: (rows: unknown[]) => { (window as any).__reviewWrites.push({ table, rows }); return Promise.resolve({ error: null }); }
    }) };
    (0, eval)('_supaClient = window.__reviewClient');
  });
}
for (const correct of [true, false]) {
  test(`explicação integral e ações opcionais após ${correct ? 'acerto' : 'erro'}`, async ({ page }) => {
    await expect(page.locator('#nqlQuestionReview')).toHaveCount(0);
    const q = await respond(page, correct);
    await expect(page.locator('#feedback .fb-snip')).toHaveText(q.e);
    await expect(page.locator('#feedback .nql-answer-result')).toHaveText(correct ? '✓Resposta correta' : '×Resposta incorreta');
    await expect(page.locator('#feedback button, #feedback .star-rating, #feedback .fb-rest')).toHaveCount(0);
    await expect(page.locator('#nqlQuestionRating')).toBeHidden();
    if (!correct) await expect(page.locator('#nqlQuestionReflection')).toBeHidden();
    await page.locator('.nql-review-report').click();
    await expect(page.locator('#flagPopup')).toBeVisible();
    await page.locator('[data-remove-id="flagPopup"]').click();
    await expect(page.locator('#nqlQuestionRating')).toBeHidden();
    await page.locator('#nextBtn').click();
    await expect(page.locator('#nqlQuestionReview')).toHaveCount(0);
    await expect(page.locator('#mainApp')).not.toHaveAttribute('data-lumen-debrief');
    await expect(page.locator('.nql-choice-instruction')).toHaveText('Escolha uma alternativa.');
    await expect(page.locator('#nextBtn')).toBeHidden();
  });
}
test('notas pelo teclado e dificuldade persistem na questão correta ao avançar', async ({ page }) => {
  const q = await respond(page, true);
  await captureSubmissions(page);
  const toggle = page.locator('#nqlQuestionRatingToggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toBeFocused();
  const quality = page.getByRole('button', { name: 'Qualidade: 4 de 5', exact: true });
  const learning = page.getByRole('button', { name: 'Aprendizado: 5 de 5', exact: true });
  await quality.focus(); await page.keyboard.press('Space');
  await learning.focus(); await page.keyboard.press('Enter');
  await page.locator('.qr-diff-btn[data-diff="hard"]').click();
  await toggle.click(); await toggle.click();
  await expect(quality).toHaveAttribute('aria-pressed', 'true');
  await expect(learning).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.qr-diff-btn[data-diff="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#nextBtn').click();
  const saved = await page.evaluate(() => ({
    ratings: JSON.parse(localStorage.getItem('nefroquest-rated-questions') || '{}'),
    difficulty: JSON.parse(localStorage.getItem('nefroquest-difficulty-votes') || '{}'),
    writes: (window as any).__reviewWrites,
  }));
  expect(saved.ratings[q.qid || q.id]).toEqual({ quality: 4, learning: 5 });
  expect(saved.difficulty[q.qid || q.id]).toBe('hard');
  expect(saved.writes.find((w: any) => w.table === 'question_ratings').rows[0]).toMatchObject({ question_id: q.qid || q.id, rating_quality: 4, rating_learning: 5 });
  expect(saved.writes.find((w: any) => w.table === 'question_difficulty_votes').rows[0]).toMatchObject({ question_id: q.qid || q.id, vote: 'hard' });
  await expect(page.locator('#nqlQuestionReview')).toHaveCount(0);
});
test('reflexão salva o erro escolhido e transfere o foco para a orientação', async ({ page }) => {
  const q = await respond(page, false);
  await captureSubmissions(page);
  const toggle = page.locator('#nqlQuestionReflectionToggle');
  await toggle.click();
  const chip = page.locator('.err-reflect-chip').first();
  const reason = await chip.getAttribute('data-reason');
  await chip.focus(); await page.keyboard.press('Enter');
  const lesson = page.locator('.err-reflect-lesson');
  await expect(lesson).toBeFocused();
  await expect(lesson).not.toBeEmpty();
  await toggle.click(); await toggle.click();
  await expect(lesson).toBeVisible();
  const saved = await page.evaluate(() => ({
    data: JSON.parse(localStorage.getItem('nefroquest-error-reasons') || '{}'),
    writes: (window as any).__reviewWrites,
  }));
  expect(saved.data.log).toHaveLength(1);
  expect(saved.data.log[0]).toMatchObject({ qid: q.id, idx: q.idx, reason });
  expect(saved.writes.find((w: any) => w.table === 'question_error_reasons').rows[0]).toMatchObject({ question_id: q.id, chosen_idx: q.idx, reason });
});
test('painéis abertos são acessíveis e cabem em 320px com texto ampliado', async ({ page }) => {
  await respond(page, false);
  await page.locator('#nqlQuestionRatingToggle').click();
  await page.locator('#nqlQuestionReflectionToggle').click();
  const audit = await new AxeBuilder({ page }).include('#feedback').include('#nqlQuestionReview').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  for (const selector of ['#feedback', '#nqlQuestionReview', '#nqlQuestionRating', '#nqlQuestionReflection']) {
    expect(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth + 1), selector).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page.getByRole('button', { name: 'Qualidade: 5 de 5', exact: true })).toBeVisible();
});

test('fim da partida mantém próxima pergunta oculta e defesa mantém o aviso', async ({ page }) => {
  await page.evaluate(() => {
    const random = Math.random;
    try {
      Math.random = () => 0;
      (0, eval)('state.equipment.armor.def = 2');
      (0, eval)('answer((state.current.a + 1) % state.current.o.length, document.querySelectorAll("#options .option")[(state.current.a + 1) % state.current.o.length])');
    } finally { Math.random = random; }
  });
  await expect(page.locator('.nql-answer-consequence')).toContainText('defesa absorveu');
  await expect(page.locator('#nqlQuestionRatingToggle')).toBeVisible();
  await page.locator('#nextBtn').click();
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  await page.evaluate(() => {
    const random = Math.random;
    try {
      Math.random = () => 0.99;
      (0, eval)('state.lives = 1; answer((state.current.a + 1) % state.current.o.length, document.querySelectorAll("#options .option")[(state.current.a + 1) % state.current.o.length])');
    } finally { Math.random = random; }
  });
  await expect(page.locator('#nameModal')).toBeVisible();
  expect(await page.evaluate(() => (0, eval)('state.lives'))).toBe(0);
  await expect(page.locator('#nextBtn')).toBeHidden();
});
test('avançar antes da avaliação atrasada não injeta controles na pergunta seguinte', async ({ page }) => {
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  await page.evaluate(() => (0, eval)('answer(state.current.a, document.querySelectorAll("#options .option")[state.current.a]); renderQuestion();'));
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  await expect(page.locator('#nqlQuestionReview')).toHaveCount(0);
  await expect(page.locator('#qRatingContainer')).toHaveCount(0);
  await expect(page.locator('#mainApp')).toHaveAttribute('data-lumen-state', 'reasoning');
});
