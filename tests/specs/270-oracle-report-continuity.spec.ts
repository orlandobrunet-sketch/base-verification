import { test, expect, type Page, type Route } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block' });
const audits = new WeakMap<Page, { errors: string[]; unexpected: string[]; sockets: number }>();
const questionText = 'Questão técnica de continuidade';

test.beforeEach(async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const audit = { errors: [] as string[], unexpected: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await context.route('**/*', route => {
    const req = route.request(), url = new URL(req.url());
    if (url.pathname === '/assets/vendor/supabase-js-2.106.2/supabase.js') return route.abort();
    if (req.method() === 'GET' && (url.origin === origin ||
      ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin) &&
      ['font', 'stylesheet'].includes(req.resourceType()))) return route.continue();
    if (req.method() !== 'GET') audit.unexpected.push(req.method() + ' ' + url.pathname);
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, Array.from({ length: 4 }, (_, i) => ({
    qid: 'continuity-fixture-' + i, q: questionText + ' ' + i,
    opts: ['Opção técnica A', 'Opção técnica B', 'Opção técnica C', 'Opção técnica D'],
    ans: 0, exp: 'Explicação técnica usada apenas no teste.', cat: 'geral', diff: 'medium'
  })));
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0 }, { authUser: { id: 'continuity-test', app_metadata: {} } });
  const wrong = await page.evaluate(() => (0, eval)('(state.current.a+1)%state.current.o.length'));
  await page.locator(`#options .option[data-idx="${wrong}"]`).click();
  await expect(page.locator('#nextBtn')).toBeVisible();
});
test.afterEach(async ({ page }, info) => {
  await info.attach('oracle-report-audit', { contentType: 'application/json', body: JSON.stringify(audits.get(page)) });
  if (info.status === info.expectedStatus) expect(audits.get(page)).toEqual({ errors: [], unexpected: [], sockets: 0 });
});
async function openReport(page: Page) {
  await page.locator('.nql-review-report').click();
  await expect(page.locator('#flagComment')).toBeFocused();
}
for (const replyBeforeCancel of [false, true]) test(`relato novo conserva rascunho após sucesso ${replyBeforeCancel ? 'já recebido' : 'tardio'} do formulário anterior`, async ({ page }) => {
  let pending: Route | undefined;
  await page.route('**/functions/v1/send-flag', route => { pending = route; });
  await openReport(page);
  await page.locator('#flagComment').fill('Comentário do primeiro formulário');
  await page.locator('#flagSendBtn').click();
  await expect.poll(() => !!pending).toBe(true);
  if (replyBeforeCancel) {
    await pending!.fulfill({ json: { success: true } });
    await expect(page.locator('#flagStatus')).toContainText('Erro enviado');
  }
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await openReport(page);
  await page.getByRole('radio', { name: 'Outra', exact: true }).check();
  await page.locator('#flagComment').fill('Rascunho do formulário novo');
  if (!replyBeforeCancel) await pending!.fulfill({ json: { success: true } });
  // The original success callback closes after2000ms. Wait across that real boundary.
  await page.waitForTimeout(2200);
  await expect(page.locator('#flagPopup')).toBeVisible();
  await expect(page.locator('#flagComment')).toHaveValue('Rascunho do formulário novo');
  await expect(page.getByRole('radio', { name: 'Outra', exact: true })).toBeChecked();
  await expect(page.locator('#flagStatus')).toBeEmpty();
});
for (const status of [500, 429]) test(`Oráculo conserva a dúvida após recusa${status} e ao reabrir`, async ({ page }) => {
  const bodies: any[] = [];
  await page.route('**/functions/v1/ai-mentor', route => {
    bodies.push(route.request().postDataJSON());
    return bodies.length === 1
      ? route.fulfill({ status, json: { error: status === 429 ? 'quota_exceeded' : 'unavailable' } })
      : route.fulfill({ json: { reply: 'Resposta técnica da tentativa seguinte.' } });
  });
  const trigger = page.locator('[data-action="openOraculoFromJourney"]:visible').first();
  await trigger.click();
  const draft = 'Como continuar este exercício técnico?';
  await page.locator('#mentorInput').fill(draft);
  await page.locator('#mentorInput').press('Enter');
  await expect(page.locator('#mentorChat')).toContainText(status === 429 ? 'Limite diário atingido' : 'Oráculo indisponível');
  await expect(page.locator('#mentorInput')).toHaveValue(draft);
  await expect(page.locator('#mentorInput')).toBeFocused();
  await expect(page.locator('#mentorQuotaBar')).toContainText(status === 429 ? '0/5' : '5/5');
  await page.locator('#oraclePage [data-action="closeMentorModal"]').click();
  await trigger.click();
  await expect(page.locator('#mentorInput')).toHaveValue(draft);
  await expect(page.locator('#oracleCase')).toContainText(questionText);
  await page.locator('#mentorInput').press('Enter');
  if (status === 500) {
    await expect(page.locator('#mentorChat')).toContainText('Resposta técnica da tentativa seguinte.');
    expect(bodies).toHaveLength(2);
    expect(bodies[1].userQuestion).toBe(draft);
    expect(bodies[1].questionText).toBe(bodies[0].questionText);
    expect(bodies[1].history).toEqual([]);
    await expect(page.locator('#mentorInput')).toHaveValue('');
    await expect(page.locator('#mentorQuotaBar')).toContainText('4/5');
  } else {
    expect(bodies).toHaveLength(1);
    await expect(page.locator('#mentorInput')).toHaveValue(draft);
  }
});
