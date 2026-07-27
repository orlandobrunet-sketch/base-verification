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
    await expect(page.locator('#landingScreen > .landing-content')).toBeHidden();
    await expect(page.locator('.mobile-sound-controls')).toBeHidden();

    const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLLinkElement).href).pathname + new URL((link as HTMLLinkElement).href).search)
    );
    expect(stylesheets).toContain('/styles/lumen/portal.css?v=13.22');
    await expect(page.locator('script[src="js/portal.js?v=13.20"]')).toHaveCount(1);

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
