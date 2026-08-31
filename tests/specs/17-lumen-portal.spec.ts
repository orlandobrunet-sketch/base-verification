import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const portalPath = '/jogar/';

test.describe('Página 1 — Portal de Acesso Lúmen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(portalPath, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#landingScreen')).toBeVisible();
  });

  test('carrega a página real sem expor a landing legada', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Entre no seu atlas clínico.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Retome sua jornada' })).toBeVisible();
    const titleLines = await page.locator('#portalTitle').evaluate((title) =>
      Array.from(title.children).map((line) => ({
        top: line.getBoundingClientRect().top,
        rects: line.getClientRects().length,
        whiteSpace: getComputedStyle(line).whiteSpace,
      }))
    );
    expect(titleLines).toHaveLength(2);
    expect(titleLines.map((line) => line.rects)).toEqual([1, 1]);
    expect(titleLines[1].top).toBeGreaterThan(titleLines[0].top);
    expect(titleLines[0].whiteSpace).toBe('nowrap');
    await expect(page.locator('#landingScreen > .landing-content')).toBeHidden();
    await expect(page.locator('.mobile-sound-controls')).toBeHidden();

    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLLinkElement).href).pathname + new URL((link as HTMLLinkElement).href).search)
    );
    expect(stylesheets.some(s => s.startsWith('/styles/lumen/portal.css'))).toBe(true);
    await expect(page.locator('script[src^="js/portal.js?v="]')).toHaveCount(1);

    const skipLink = page.getByRole('link', { name: 'Ir para o acesso' });
    await skipLink.focus();
    await skipLink.click();
    await expect(page).toHaveURL(/\/jogar\/#portalMain$/);
    await expect(page.locator('#portalMain')).toBeFocused();
  });

  test('mantém a composição dentro da viewport nos breakpoints de aprovação', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 768, height: 900 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(metrics.scrollWidth, `${viewport.width}px criou overflow horizontal`).toBeLessThanOrEqual(metrics.clientWidth + 1);

      const firstAction = page.locator('[data-portal-route="google"]');
      await firstAction.scrollIntoViewIfNeeded();
      await expect(firstAction).toBeVisible();
      const box = await firstAction.boundingBox();
      expect(box?.width || 0).toBeGreaterThanOrEqual(Math.min(288, viewport.width - 68));
    }
  });

  test('não altera a geometria do painel ao explorar as rotas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const entry = page.locator('.nql-portal__entry');
    const initial = await entry.boundingBox();
    expect(initial).not.toBeNull();

    for (const route of ['google', 'email', 'guest']) {
      await page.locator(`[data-portal-route="${route}"]`).hover();
      const current = await entry.boundingBox();
      expect(Math.abs((current?.width || 0) - (initial?.width || 0)), `${route} alterou a largura`).toBeLessThan(1);
      expect(Math.abs((current?.height || 0) - (initial?.height || 0)), `${route} alterou a altura`).toBeLessThan(1);
    }
  });

  test('usa cor como orientação sem misturar as três rotas', async ({ page }) => {
    const portalSurface = await page.evaluate(() => ({
      page: getComputedStyle(document.querySelector('.nql-portal')!).backgroundImage,
      entryBorder: getComputedStyle(document.querySelector('.nql-portal__entry')!).borderTopColor,
      entryCurrent: getComputedStyle(document.querySelector('.nql-portal__entry')!, '::before').backgroundImage,
    }));
    expect(portalSurface.page).toContain('rgb(13, 31, 54)');
    expect(portalSurface.entryBorder).toBe('rgba(145, 223, 227, 0.5)');
    expect(portalSurface.entryCurrent).toContain('linear-gradient');

    const signatures = await page.locator('[data-portal-route]').evaluateAll((routes) =>
      routes.map((route) => {
        const style = getComputedStyle(route);
        return {
          route: (route as HTMLElement).dataset.portalRoute,
          accent: style.getPropertyValue('--nql-route-accent').trim(),
          rgb: style.getPropertyValue('--nql-route-rgb').trim(),
        };
      })
    );

    expect(new Set(signatures.map(({ accent }) => accent)).size).toBe(3);
    expect(signatures.find(({ route }) => route === 'google')?.accent).toBe('#91dfe3');
    expect(signatures.find(({ route }) => route === 'email')?.accent).toBe('#f1cf7a');
    expect(signatures.find(({ route }) => route === 'guest')?.accent).toBe('#69bde7');

    await page.locator('[data-portal-route="email"]').click();
    const authPalette = await page.evaluate(() => {
      const placeholder = getComputedStyle(document.querySelector('#authEmail')!, '::placeholder');
      const track = getComputedStyle(document.querySelector('.nql-portal-auth__track')!, '::before');
      return {
        placeholder: placeholder.color,
        track: track.backgroundImage,
        context: getComputedStyle(document.querySelector('.nql-portal-auth__context')!).backgroundImage,
        contextBorder: getComputedStyle(document.querySelector('.nql-portal-auth__context')!).borderRightColor,
        workspace: getComputedStyle(document.querySelector('.nql-portal-auth__workspace')!).backgroundImage,
        modalBorder: getComputedStyle(document.querySelector('.nql-portal-auth')!).borderTopColor,
        activeTab: getComputedStyle(document.querySelector('.auth-tab.active')!).backgroundImage,
      };
    });
    expect(authPalette.placeholder).toBe('rgb(140, 156, 182)');
    expect(authPalette.track).toContain('linear-gradient');
    expect(authPalette.context).toContain('radial-gradient');
    expect(authPalette.contextBorder).toBe('rgba(145, 223, 227, 0.24)');
    expect(authPalette.workspace).toContain('radial-gradient');
    expect(authPalette.modalBorder).toBe('rgba(145, 223, 227, 0.52)');
    expect(authPalette.activeTab).toContain('linear-gradient');
  });

  test('remove o conduto externo e anima apenas o divisor interno', async ({ page }) => {
    await expect(page.locator('.nql-hilar-port--bridge')).toHaveCount(0);

    const divider = await page.locator('.nql-portal__entry-head').evaluate((element) => {
      const style = getComputedStyle(element, '::after');
      return {
        animationName: style.animationName,
        content: style.content,
        height: style.height,
        bottom: style.bottom,
        overflow: getComputedStyle(element).overflow,
      };
    });

    expect(divider.content).not.toBe('none');
    expect(divider.animationName).toBe('nql-portal-entry-current');
    expect(divider.height).toBe('1px');
    expect(divider.bottom).toBe('0px');
    expect(divider.overflow).toBe('hidden');
  });

  test('ignora uma versão atrasada sem repetir a limpeza de cache', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('nq-sw-version', '13.24'));
    const clearCacheRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/clear-cache.html') clearCacheRequests.push(request.url());
    });
    await page.route('**/version.json', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: '13.23' }),
    }));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    expect(clearCacheRequests).toEqual([]);
    await expect(page).toHaveURL(/\/jogar\/$/);
    expect(await page.evaluate(() => localStorage.getItem('nq-sw-version'))).toBe('13.24');
  });

  test('atualiza em segundo plano sem abrir a página de limpeza', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('nq-sw-version', '13.23'));
    const clearCacheRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/clear-cache.html') clearCacheRequests.push(request.url());
    });
    await page.route('**/version.json', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: '13.24' }),
    }));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    expect(clearCacheRequests).toEqual([]);
    await expect(page).toHaveURL(/\/jogar\/$/);
    expect(await page.evaluate(() => localStorage.getItem('nq-sw-version'))).toBe('13.24');
  });

  test('abre login por email e preserva o deep link', async ({ page }) => {
    const emailRoute = page.locator('[data-portal-route="email"]');
    await emailRoute.click();

    const dialog = page.getByRole('dialog', { name: 'Portal de acesso' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#authEmail')).toBeFocused();
    await expect(dialog.locator('.cf-turnstile')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(emailRoute).toBeFocused();

    await page.goto('/jogar/?auth=login', { waitUntil: 'domcontentloaded' });
    await expect(dialog).toBeVisible();
    await expect(page).not.toHaveURL(/auth=login/);
    await expect(page.locator('#authEmail')).toBeFocused();
  });

  test('troca login, cadastro e recuperação sem redimensionar o diálogo', async ({ page }) => {
    await page.locator('[data-portal-route="email"]').click();
    const box = page.locator('#authBox');
    await expect(box).toHaveCSS('transform', 'none');
    const initial = await box.boundingBox();

    await page.locator('#tabEntrar').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tabCadastrar')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#authFormCadastrar')).toBeVisible();
    const register = await box.boundingBox();
    expect(Math.abs((register?.height || 0) - (initial?.height || 0))).toBeLessThan(1);

    await page.keyboard.press('Home');
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
    await expect(page.locator('#authFormForgot')).toBeVisible();
    await expect(page.locator('#authForgotEmail')).toBeFocused();
    const forgot = await box.boundingBox();
    expect(Math.abs((forgot?.height || 0) - (initial?.height || 0))).toBeLessThan(1);
  });

  test('mantém o modo visitante e seu limite explícito', async ({ page }) => {
    await page.locator('[data-portal-route="guest"]').click();
    await expect(page.locator('#landingScreen')).toBeHidden();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('nq_guest_mode'))).toBe('1');
  });

  test('mantém a sessão visitante em memória quando o armazenamento está bloqueado', async ({ page }) => {
    await page.addInitScript(() => {
      const originalGet = Storage.prototype.getItem;
      const originalSet = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key: string) {
        if (key === 'nq_guest_mode') throw new DOMException('Storage blocked', 'SecurityError');
        return originalGet.call(this, key);
      };
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'nq_guest_mode') throw new DOMException('Storage blocked', 'SecurityError');
        return originalSet.call(this, key, value);
      };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => typeof (window as typeof window & { playAsGuest?: () => void }).playAsGuest)).toBe('function');
    await page.locator('[data-portal-route="guest"]').click();
    await expect(page.locator('#landingScreen')).toBeHidden();
    await expect(page.locator('#welcomeScreen')).toBeVisible();
  });

  test('explica quando o serviço de autenticação não carrega', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'supabase', {
        configurable: false,
        get: () => undefined,
        set: () => undefined,
      });
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-portal-route="google"]').click();
    await expect(page.getByRole('dialog', { name: 'Portal de acesso' })).toBeVisible();
    await expect(page.locator('#authMsg')).toContainText('temporariamente indisponível');
    await expect(page.locator('#portalRouteStatus')).toContainText('Google indisponível');
  });

  test('mantém erros de cadastro visíveis em telas curtas', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.locator('[data-portal-route="email"]').click();
    await page.locator('#tabCadastrar').click();
    await page.locator('#authRegBtn').scrollIntoViewIfNeeded();
    await page.locator('#authRegBtn').click();

    const message = page.locator('#authMsg');
    await expect(message).toContainText('Preencha todos os campos');
    await expect(page.locator('#authDisplayName')).toBeFocused();
    await expect(page.locator('#authDisplayName')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#authDisplayName')).toHaveAttribute('aria-describedby', /authMsg/);
    const rect = await message.boundingBox();
    expect(rect?.y || -1).toBeGreaterThanOrEqual(0);
    expect((rect?.y || 0) + (rect?.height || 0)).toBeLessThanOrEqual(568);
  });

  test('oferece navegação por teclado e alvos mínimos', async ({ page }) => {
    for (const route of ['google', 'email', 'guest']) {
      const target = page.locator(`[data-portal-route="${route}"]`);
      const box = await target.boundingBox();
      expect(box?.height || 0, `${route} menor que 44px`).toBeGreaterThanOrEqual(44);
    }

    await page.locator('[data-portal-route="email"]').click();
    await expect(page.locator('#authEmail')).toBeFocused();
    await page.locator('#tabEntrar').focus();
    await page.keyboard.press('End');
    await expect(page.locator('#tabCadastrar')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tabEntrar')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#tabCadastrar')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('#tabEntrar')).toBeFocused();

    await page.evaluate(() => {
      (window as typeof window & { __nqLoginCalls: number; authEmailLogin: () => void }).__nqLoginCalls = 0;
      (window as typeof window & { __nqLoginCalls: number; authEmailLogin: () => void }).authEmailLogin = () => {
        (window as typeof window & { __nqLoginCalls: number }).__nqLoginCalls += 1;
      };
      (document.getElementById('authLoginBtn') as HTMLButtonElement).disabled = true;
    });
    await page.locator('#authEmail').focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => (window as typeof window & { __nqLoginCalls: number }).__nqLoginCalls)).toBe(0);
    await page.locator('#authLoginBtn').evaluate((button: HTMLButtonElement) => { button.disabled = false; });

    await expect(page.locator('#landingScreen')).toHaveAttribute('inert', '');
    await page.locator('#authLoginBtn').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('.auth-close-btn[data-action="closeAuthModal"]')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#authLoginBtn')).toBeFocused();
  });

  test('integra recuperação final e estados de segurança ao padrão Lúmen', async ({ page }) => {
    await page.evaluate(() => (window as typeof window & { showUpdatePasswordModal: () => void }).showUpdatePasswordModal());
    const resetDialog = page.getByRole('dialog', { name: 'Defina sua nova senha.' });
    await expect(resetDialog).toBeVisible();
    await expect(page.locator('#newPassword')).toBeFocused();
    await expect(page.locator('#newPassword')).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.locator('#newPassword')).toHaveAttribute('minlength', '6');
    await page.locator('#newPassword').fill('123');
    await page.locator('#newPasswordConfirm').fill('123');
    await page.locator('#updatePasswordSaveBtn').click();
    await expect(page.locator('#updatePwMsg')).toHaveRole('alert');
    await expect(page.locator('#updatePwMsg')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(resetDialog).toBeHidden();

    await page.locator('[data-portal-route="email"]').click();
    await page.evaluate(() => (window as typeof window & { nqTurnstileExpired: () => void }).nqTurnstileExpired());
    await expect(page.locator('#cfTurnstile')).toHaveAttribute('data-state', 'expired');
    await expect(page.locator('#cfTurnstileStatus')).toContainText('expirou');
    await expect(page.locator('#cfTurnstileRetry')).toBeVisible();
    await page.evaluate(() => (window as typeof window & { nqTurnstileError: () => void }).nqTurnstileError());
    await expect(page.locator('#cfTurnstile')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('#cfTurnstileStatus')).toContainText('Não foi possível carregar');
  });

  test('reconcilia sucesso do Turnstile recebido antes do auth.js', async ({ browser }) => {
    /* Contexto próprio com Service Worker BLOQUEADO.
     *
     * Este cenário depende de segurar o auth.js na rota do Playwright para
     * criar a corrida. Só que a interceptação de rota não alcança o que um
     * Service Worker responde do cache — e o SW registrado por um teste
     * anterior deste mesmo arquivo continuava controlando a página nova.
     *
     * Medido nas duas situações, na mesma máquina e sem contenção:
     *
     *   SW controlando  → auth.js já carregado, callback já trocado, fila []
     *   SW ausente      → callback ainda enfileirando,        fila ["ready"]
     *
     * O produto nunca esteve errado: a fila de eventos do Turnstile funciona.
     * Era o teste que media ora a corrida, ora um app inteiro já carregado.
     * `serviceWorkers: 'block'` remove a variável em vez de tentar desregistrar
     * e torcer — desregistrar não desfaz o controle da carga em andamento. */
    const raceContext = await browser.newContext({ serviceWorkers: 'block' });
    const racePage = await raceContext.newPage();
    let releaseAuth = () => {};
    const authGate = new Promise<void>((resolve) => { releaseAuth = resolve; });
    await racePage.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    await racePage.route('**/js/auth.js*', async (route) => {
      const response = await route.fetch();
      await authGate;
      await route.fulfill({ response });
    });

    const navigation = racePage.goto(portalPath, { waitUntil: 'domcontentloaded' });
    await racePage.locator('#cfTurnstile').waitFor({ state: 'attached' });
    await racePage.evaluate(() => (window as typeof window & { nqTurnstileReady: () => void }).nqTurnstileReady());
    const queued = await racePage.evaluate(() => (window as typeof window & { __nqTurnstileEvents: string[] }).__nqTurnstileEvents);
    expect(queued).toContain('ready');

    releaseAuth();
    await navigation;
    await expect(racePage.locator('#cfTurnstile')).toHaveAttribute('data-state', 'ready');
    await expect(racePage.locator('#cfTurnstileStatus')).toHaveText('Verificação de segurança concluída.');
    await expect(racePage.locator('#cfTurnstileRetry')).toBeHidden();
    await racePage.close();
    await raceContext.close();
  });

  test('respeita movimento reduzido sem remover o significado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const journeyAnimation = await page.locator('.nql-portal__journey-line span').evaluate((element) =>
      getComputedStyle(element).animationName
    );
    const dividerAnimation = await page.locator('.nql-portal__entry-head').evaluate((element) =>
      getComputedStyle(element, '::after').animationName
    );
    expect(journeyAnimation).toBe('none');
    expect(dividerAnimation).toBe('none');
    await expect(page.getByRole('heading', { name: 'Retome sua jornada' })).toBeVisible();
  });

  test('não apresenta violações axe sérias ou críticas', async ({ page }) => {
    const portalResults = await new AxeBuilder({ page })
      .include('#landingScreen')
      .analyze();
    expect(portalResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);

    await page.locator('[data-portal-route="email"]').click();
    const authResults = await new AxeBuilder({ page })
      .include('#authModal')
      .analyze();
    expect(authResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  });
});
