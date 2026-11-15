import { test, expect, type Page } from '@playwright/test';
import { routeTechnicalQuestionBank } from '../helpers/technical-question-bank';
import { attachFailureEvidence } from '../helpers/failure-evidence';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
const audits = new WeakMap<Page, { errors: string[]; nonGET: string[]; sockets: number }>();

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin, audit = { errors: [] as string[], nonGET: [] as string[], sockets: 0 };
  audits.set(page, audit);
  page.on('pageerror', error => audit.errors.push(error.message));
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET') { audit.nonGET.push(request.method() + ' ' + url.pathname); return route.abort(); }
    return url.origin === origin && !['image', 'media', 'font'].includes(request.resourceType()) ? route.continue() : route.abort();
  });
  await page.context().routeWebSocket('**/*', socket => { audit.sockets++; socket.close(); });
  await routeTechnicalQuestionBank(page, [{ qid: 'dialog-focus-technical', t: 'Interface técnica', cat: 'geral', diff: 'medium',
    q: 'Marcador técnico de interface.', opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'Fixture técnica, sem questão clínica.', refs: [] }]);
  await page.goto('/jogar/', { waitUntil: 'load' });
  await page.locator('[data-portal-route="guest"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await page.evaluate(() => {
    const pilot = (window as any).NQPilot;
    return typeof (window as any).nqDialogo === 'function' && typeof pilot?.captureBinding === 'function' &&
      pilot.matchesBinding(pilot.captureBinding()) && (window as any).authUser === null;
  })).toBe(true);
});

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) await attachFailureEvidence(page, info);
  const audit = audits.get(page);
  await info.attach('dialog-focus-audit', { contentType: 'application/json', body: JSON.stringify(audit) });
  expect(audit).toEqual({ errors: [], nonGET: [], sockets: 0 });
});

async function openTechnicalDialog(page: Page, id: string) {
  await page.evaluate(id => {
    const root = document.createElement('section'); root.id = id;
    root.style.cssText = `position:fixed;left:20px;top:${id === 'oldTechnicalDialog' ? 20 : 200}px;width:280px;background:#111;color:white;padding:16px;z-index:2147483000`;
    root.innerHTML = `<h2>Diálogo técnico</h2><p id="${id}Status">Estado técnico inicial</p><button id="${id}Button">Continuar</button>`;
    document.body.append(root);
    (window as any).nqDialogo(root);
  }, id);
}

async function updateOldDialog(page: Page) {
  await page.evaluate(() => { document.getElementById('oldTechnicalDialogStatus')!.textContent = 'Atualização técnica tardia'; });
}

test('atualizar um diálogo anterior conserva o foco no novo diálogo', async ({ page }) => {
  await openTechnicalDialog(page, 'oldTechnicalDialog');
  await openTechnicalDialog(page, 'newTechnicalDialog');
  await expect(page.locator('#newTechnicalDialogButton')).toBeFocused();
  await updateOldDialog(page);
  await expect(page.locator('#newTechnicalDialogButton')).toBeFocused();
});

test('remover o controle focado ainda recupera o foco perdido no body', async ({ page }) => {
  await openTechnicalDialog(page, 'oldTechnicalDialog');
  await expect(page.locator('#oldTechnicalDialogButton')).toBeFocused();
  const fallen = await page.evaluate(() => {
    document.getElementById('oldTechnicalDialogButton')!.remove();
    const fellToBody = document.activeElement === document.body;
    const replacement = document.createElement('button'); replacement.id = 'oldTechnicalReplacement';
    replacement.textContent = 'Próximo controle técnico'; document.getElementById('oldTechnicalDialog')!.append(replacement);
    return fellToBody;
  });
  expect(fallen).toBe(true);
  await expect(page.locator('#oldTechnicalReplacement')).toBeFocused();
});

test('atualizar o diálogo conserva outro controle escolhido fora da raiz', async ({ page }) => {
  await openTechnicalDialog(page, 'oldTechnicalDialog');
  await page.evaluate(() => {
    const input = document.createElement('input'); input.id = 'outsideTechnicalControl'; input.type = 'text';
    input.style.cssText = 'position:fixed;top:420px;left:20px;width:260px;height:44px;z-index:2147483001'; document.body.append(input);
  });
  await page.locator('#outsideTechnicalControl').click();
  await expect(page.locator('#outsideTechnicalControl')).toBeFocused();
  await updateOldDialog(page);
  await expect(page.locator('#outsideTechnicalControl')).toBeFocused();
});
