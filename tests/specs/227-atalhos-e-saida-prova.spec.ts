import { expect, test, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const bank = Array.from({ length: 12 }, (_, index) => ({
  qid: 'atalhos-tecnicos-' + index,
  t: 'Controle técnico',
  q: 'Questão técnica ' + (index + 1),
  opts: ['Alternativa um', 'Alternativa dois', 'Alternativa três', 'Alternativa quatro'],
  ans: index % 4,
  exp: 'Feedback técnico',
}));

test.beforeEach(async ({ page, baseURL }) => {
  const localOrigin = new URL(baseURL!).origin;
  await page.route('**/*', route => {
    const request = route.request();
    return new URL(request.url()).origin === localOrigin && request.method() === 'GET'
      ? route.continue()
      : route.abort();
  });
  await routeTechnicalQuestionBank(page, bank);
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#welcomeScreen')).toBeVisible();
});

async function openMode(page: Page, mode: 'study' | 'exam') {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator(`[data-mode-route="${mode}"]:visible`).click();
}

const browserShortcuts = ['Control+a', 'Alt+b', 'Meta+c', 'Control+1', 'Alt+2', 'Meta+3'];

test('atalhos com modificadores não registram alternativa da Jornada', async ({ page }) => {
  await page.locator('[data-action="startNewFromWelcome"]:visible').click();
  await page.locator('#diffConfirmBtn').click();
  await page.locator('#charSelectModal [data-char="aquaria"]').click();
  await page.locator('[data-action="startCharacterPreview"]').click();
  const option = page.locator('#mainApp:not(.hidden) #options .option:visible').first();
  const skipIntro = page.locator('#nqEntryCinema[open] [data-nq-entry-skip]');
  await expect(option.or(skipIntro).first()).toBeVisible();
  if (await skipIntro.isVisible()) await skipIntro.click();
  await expect(option).toBeEnabled();

  // Clicar fora das opções reproduz o foco em um elemento não interativo.
  await page.locator('#question').click();
  const answered = () => page.evaluate(() => (0, eval)('state.answered'));
  for (const shortcut of browserShortcuts) {
    await page.keyboard.press(shortcut);
    expect(await answered(), shortcut).toBe(false);
  }

  await option.focus();
  await page.keyboard.press('Control+a');
  expect(await answered()).toBe(false);
  await page.keyboard.press('1');
  expect(await answered()).toBe(true);
});

test('atalhos com modificadores não registram alternativa do Estudo', async ({ page }) => {
  await openMode(page, 'study');
  await page.getByRole('button', { name: 'Iniciar estudo livre', exact: true }).click();
  const option = page.locator('#studyOptions button').first();
  await expect(option).toBeEnabled();

  // Clicar no rótulo deixa o foco fora dos controles de resposta.
  await page.locator('.nq-study-question-meta span').first().click();
  const answered = () => page.evaluate(() => (0, eval)('studyModeCorrect + studyModeWrong'));
  for (const shortcut of browserShortcuts) {
    await page.keyboard.press(shortcut);
    expect(await answered(), shortcut).toBe(0);
  }

  await option.focus();
  await page.keyboard.press('Control+a');
  expect(await answered()).toBe(0);
  await page.keyboard.press('a');
  expect(await answered()).toBe(1);
  await expect(page.locator('#studyFeedback')).toBeVisible();
});

type PendingLoad = { reject: (error: Error) => void };

async function holdExamLoader(page: Page) {
  await page.evaluate(() => {
    const runtime = window as typeof window & {
      _loadTopics: () => Promise<void>;
      pendingExamLoads: PendingLoad[];
    };
    runtime.pendingExamLoads = [];
    runtime._loadTopics = () => new Promise<void>((_, reject) => {
      runtime.pendingExamLoads.push({ reject });
    });
  });
}

async function startExamLoad(page: Page) {
  const start = page.locator('#examPage [data-action="_examComecar"]');
  await start.click();
  await expect(start).toBeDisabled();
}

async function rejectExamLoad(page: Page, index: number) {
  await page.evaluate(async index => {
    const runtime = window as typeof window & { pendingExamLoads: PendingLoad[] };
    runtime.pendingExamLoads[index].reject(new Error('Falha de carregamento controlada'));
    await Promise.resolve();
  }, index);
}

test('falha de carregamento não reabre a Prova depois de Voltar', async ({ page }) => {
  await openMode(page, 'exam');
  await holdExamLoader(page);
  await startExamLoad(page);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.locator('#examPage')).toHaveCount(0);
  await rejectExamLoad(page, 0);
  await expect(page.locator('#examPage')).toHaveCount(0);
  await expect(page.locator('#welcomeScreen')).toBeVisible();
});

test('falha de uma Prova fechada não interrompe o carregamento da seguinte', async ({ page }) => {
  await openMode(page, 'exam');
  await holdExamLoader(page);
  await startExamLoad(page);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await openMode(page, 'exam');
  await page.getByLabel('Tempo total em minutos', { exact: true }).fill('7');
  await startExamLoad(page);
  await rejectExamLoad(page, 0);
  await expect(page.locator('#examPage [role="alert"]')).toHaveCount(0);
  await expect(page.getByLabel('Tempo total em minutos', { exact: true })).toHaveValue('7');
  await expect(page.getByLabel('Tempo total em minutos', { exact: true })).toBeDisabled();

  // O erro do carregamento atual continua acionando a recuperação.
  await rejectExamLoad(page, 1);
  await expect(page.locator('#examPage [role="alert"]')).toBeVisible();
  await expect(page.getByLabel('Tempo total em minutos', { exact: true })).toHaveValue('7');
  await expect(page.getByRole('button', { name: 'Começar prova', exact: true })).toBeEnabled();
});
