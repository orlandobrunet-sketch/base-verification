import { test, expect, type Locator, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

const authors = Array.from({ length: 3 }, (_, index) => ({
  qid: 'mode-focus-' + index, cat: 'geral',
  q: `Questão técnica ${index}. ` + 'Texto longo para conferir leitura e navegação sem perder o contexto. '.repeat(10),
  opts: ['A', 'B', 'C', 'D'].map(label => `${label}: alternativa técnica. ` + 'Detalhe para comparação. '.repeat(5) + 'identificador'.repeat(12)),
  ans: index, exp: 'Explicação técnica para conferir a correção. '.repeat(12),
}));

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });

async function prepare(page: Page, offline = false) {
  await page.route('**/*', route => {
    const request = route.request();
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort();
    return ['localhost', '127.0.0.1'].includes(new URL(request.url()).hostname) ? route.continue() : route.abort();
  });
  await routeTechnicalQuestionBank(page, authors);
  await page.goto(offline ? '/offline.html' : '/jogar/', { waitUntil: 'domcontentloaded' });
  if (offline) await expect(page.locator('.nq-off-btn')).toHaveCount(4);
  else {
    await page.locator('[data-portal-route="guest"]').click();
    await page.evaluate(async () => { await (window as any)._loadTopics(); await (window as any).startExamMode(); });
  }
}

async function focusedAndRevealed(target: Locator) {
  await expect(target).toBeFocused();
  await expect.poll(() => target.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.top >= -1 && rect.top < innerHeight - 32 && rect.left >= -1 && rect.left < innerWidth;
  })).toBe(true);
}

async function begin(page: Page) {
  await page.getByLabel('Quantidade de questões', { exact: true }).fill('2');
  await page.getByLabel('Tempo total em minutos', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Começar prova', exact: true }).click();
  await expect(page.locator('#examOpts button')).toHaveCount(4);
}

async function noHorizontalOverflow(page: Page, selector: string) {
  const clipped = await page.locator(selector).evaluate(root => [...root.querySelectorAll('h1,h2,p,button,input,summary,li')]
    .filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
    }).map(element => element.tagName + ':' + element.textContent?.slice(0, 25)));
  expect(clipped).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('Prova revela o foco da introdução, questão, registro, avanço e resultado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 560 });
  await prepare(page);
  await focusedAndRevealed(page.locator('#examTitulo'));
  await begin(page);
  await focusedAndRevealed(page.locator('#examQuestaoTitulo'));
  await page.locator('#examOpts button').first().click();
  await focusedAndRevealed(page.locator('#examCorrecao'));
  await page.getByRole('button', { name: 'Próxima questão', exact: true }).click();
  await focusedAndRevealed(page.locator('#examQuestaoTitulo'));
  await page.locator('#examOpts button').last().click();
  await focusedAndRevealed(page.locator('#examCorrecao'));
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click();
  await focusedAndRevealed(page.locator('#examResultadoTitulo'));
});

test('Prova revela confirmação e cancelamento de saída com texto ampliado', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 560 });
  await prepare(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await noHorizontalOverflow(page, '#examPage');
  await begin(page);
  await noHorizontalOverflow(page, '#examPage');
  await page.getByRole('button', { name: 'Encerrar prova', exact: true }).click();
  await focusedAndRevealed(page.locator('[data-action="_examCancelarSaida"]'));
  await page.getByRole('button', { name: 'Continuar a prova', exact: true }).click();
  await focusedAndRevealed(page.locator('[data-action="_exitExam"]'));
  await page.locator('#examOpts button').first().click();
  await page.getByRole('button', { name: 'Próxima questão', exact: true }).click();
  await page.locator('#examOpts button').first().click();
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click();
  for (const summary of await page.locator('#examResultado details summary').all()) await summary.click();
  await noHorizontalOverflow(page, '#examPage');
});

test('Offline oferece região principal, revela correção e volta ao título da próxima questão', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 560 });
  await prepare(page, true);
  await expect(page.getByRole('main', { name: 'Estudo Offline', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Estudo Offline', exact: true })).toBeVisible();
  await page.locator('.nq-off-btn').first().click();
  await focusedAndRevealed(page.locator('#nqOffFeedbackArea'));
  await page.getByRole('button', { name: 'Próxima Questão', exact: true }).click();
  await focusedAndRevealed(page.locator('#nqOffQuestionTitle'));
  await expect(page.locator('#nqOffQuestionTitle')).toHaveText('Questão 2');
});

test('Offline preserva atalhos modificados e mantém a ativação do controle focado', async ({ page }) => {
  await prepare(page, true);
  for (const shortcut of ['Control+a', 'Alt+a', 'Meta+a']) {
    await page.keyboard.press(shortcut);
    expect(await page.evaluate(() => (0, eval)('isAnswered'))).toBe(false);
  }
  await page.keyboard.press('a');
  expect(await page.evaluate(() => (0, eval)('isAnswered'))).toBe(true);
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'offlineConsultationControl'; button.textContent = 'Consultar atualização publicada';
    button.onclick = () => { button.dataset.activated = 'true'; };
    document.querySelector('.nq-off-header')!.appendChild(button);
  });
  const control = page.locator('#offlineConsultationControl');
  await control.focus(); await page.keyboard.press('Enter');
  await expect(control).toHaveAttribute('data-activated', 'true');
  expect(await page.evaluate(() => (0, eval)('currentIndex'))).toBe(0);
  await control.evaluate(element => element.removeAttribute('data-activated'));
  await page.keyboard.press('Space');
  await expect(control).toHaveAttribute('data-activated', 'true');
  expect(await page.evaluate(() => (0, eval)('currentIndex'))).toBe(0);
});

test('Offline restaura uma resposta sem mover o foco para a correção', async ({ page }) => {
  await prepare(page, true);
  await page.locator('.nq-off-btn').first().click();
  const before = await page.evaluate(() => localStorage.getItem('nefroquest-offline-study-state'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#nqOffFeedbackArea')).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-offline-study-state'))).toBe(before);
});

test('Offline mantém texto longo e controles acessíveis em320px com fonte200%', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 560 });
  await prepare(page, true);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await noHorizontalOverflow(page, '.nq-off-container');
  await page.locator('.nq-off-btn').first().click();
  await noHorizontalOverflow(page, '.nq-off-container');
  await focusedAndRevealed(page.locator('#nqOffFeedbackArea'));
  await page.getByRole('button', { name: 'Próxima Questão', exact: true }).click();
  await focusedAndRevealed(page.locator('#nqOffQuestionTitle'));
});
