import { test, expect, type Page } from '@playwright/test';
import { medirContraste } from '../helpers/contraste';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  // Nenhuma conta, mensagem ou telemetria sai deste teste.
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost'
    ? route.continue() : route.abort());
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
});

async function contained(page: Page, selector: string, steps = 12) {
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < steps; i++) {
      await page.keyboard.press(key);
      expect(await page.locator(selector).evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
  }
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`Conta: rótulos, desistência e retorno de foco em ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.evaluate(() => (window as any).openAccountModal());
    await expect(page.getByLabel('Modo preferido')).toBeVisible();
    for (const id of ['acctNickname', 'acctName', 'acctEmail', 'acctPhone', 'acctSpec', 'acctCity', 'acctIdentity']) {
      expect(await page.locator('#' + id).evaluate((el: HTMLInputElement) => el.labels?.length)).toBe(1);
    }
    const trigger = page.locator('[data-action="confirmDeleteAccount"]');
    for (const cancel of ['button', 'Escape']) {
      await trigger.click();
      await contained(page, '.delete-account-confirm', 3);
      if (cancel === 'Escape') await page.keyboard.press('Escape');
      else await page.locator('.delete-account-confirm').getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(page.locator('.delete-account-confirm')).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.locator('#accountModal')).toBeVisible();
    }
  });
}

for (const failure of ['profile', 'auth', 'throw']) {
  test(`Conta: falha ${failure} mantém preenchimento e permite tentar novamente`, async ({ page }) => {
    await page.evaluate(failure => {
      (window as any).accountFailure = failure;
      (0, eval)(`authUser = {id:'00000000-0000-4000-8000-000000000001',user_metadata:{},app_metadata:{}};
        _supaClient = {from:()=>({upsert:async()=>{
          if(window.accountFailure==='throw') throw new Error('falha simulada');
          return {error:window.accountFailure==='profile'?{message:'falha simulada'}:null};
        }}),auth:{updateUser:async()=>({error:window.accountFailure==='auth'?{message:'falha simulada'}:null})}};`);
      (window as any).openAccountModal();
    }, failure);
    await page.locator('#acctName').fill('Pessoa de teste');
    await page.locator('#acctNickname').fill('Apelido de teste');
    await page.locator('[data-action="saveAccountData"]').click();
    await expect(page.locator('#accountSaveStatus')).toContainText('Tente salvar novamente');
    await expect(page.locator('#accountModal')).toBeVisible();
    await expect(page.locator('#acctName')).toHaveValue('Pessoa de teste');
    await expect(page.getByText('Perfil salvo com sucesso!', { exact: true })).toHaveCount(0);
    await page.evaluate(() => { (window as any).accountFailure = ''; });
    await page.locator('[data-action="saveAccountData"]').click();
    await expect(page.locator('#accountModal')).toBeHidden();
    await expect(page.getByText('Perfil salvo com sucesso!', { exact: true })).toBeVisible();
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 400 }]) {
  for (const status of [200, 429, 503]) {
    test(`Oráculo: envio alcançável e resposta ${status} em ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.route('**/functions/v1/ai-mentor', route => route.fulfill({ status, json: { reply: 'Resposta fictícia para teste de apresentação.' } }));
      await page.evaluate(() => {
        (0, eval)(`authUser = {id:'00000000-0000-4000-8000-000000000001',user_metadata:{},app_metadata:{}}`);
        (window as any).getAuthToken = async () => null;
        (window as any).setMentorQuestion({ q: 'Contexto fictício de apresentação. '.repeat(18), opts: [], ans: 0, exp: '' });
        (window as any).openMentorModal();
      });
      await expect(page.locator('#mentorInput')).toBeFocused();
      // A transição de entrada começa 20px abaixo da posição final.
      await expect.poll(async () => {
        const box = await page.locator('.mentor-input-row').boundingBox();
        return box && box.y >= 0 && box.y + box.height <= viewport.height + 1;
      }).toBe(true);
      await page.locator('#mentorInput').fill('Mensagem fictícia');
      await page.getByRole('button', { name: 'Enviar', exact: true }).click();
      await expect(page.locator('#mentorChat')).toContainText(status === 200 ? 'Resposta fictícia' : status === 429 ? 'Limite diário atingido' : 'Oráculo indisponível');
      await expect(page.locator('#mentorInput')).toBeEnabled();
      if (status === 429) await expect(page.getByRole('button', { name: 'Faça upgrade para Premium' })).toBeVisible();
      for (const label of ['.mentor-title-sub', '.mentor-context-label']) {
        await expect(page.locator(label)).toBeVisible();
        expect(await page.evaluate(medirContraste, label)).toEqual([]);
      }
      await contained(page, '#mentorOverlay', 4);
      await page.keyboard.press('Escape');
      await expect(page.locator('#mentorOverlay')).toHaveCount(0);
    });
  }
}

test('Oráculo visitante: login acessível por teclado', async ({ page }) => {
  await page.evaluate(() => {
    (window as any).setMentorQuestion({ q: 'Contexto fictício.', opts: [] });
    (window as any).openMentorModal();
  });
  await contained(page, '#mentorOverlay', 4);
  const login = page.getByRole('button', { name: 'Fazer Login', exact: true });
  await login.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mentorOverlay')).toHaveCount(0);
  await expect(page.locator('#authModal')).toBeVisible();
});

test('Classe: abertura real, teclado contido e cancelamento retorna ao início', async ({ page }) => {
  const start = page.locator('[data-action="startNewFromWelcome"]').first();
  await start.click();
  await page.locator('#diffSelectorOverlay button[data-diff-key="normal"]').click();
  await page.locator('#diffConfirmBtn').click();
  await expect(page.locator('.nqc-close')).toBeFocused();
  await contained(page, '#charSelectModal', 5);
  await page.keyboard.press('Escape');
  await expect(page.locator('#charSelectModal')).toBeHidden();
  await expect(start).toBeFocused();
});

test('Landing: etapas legíveis fora da sobreposição em três larguras', async ({ page }) => {
  await page.goto('/');
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const legends = page.locator('.class-evolution-legend');
    await expect(legends).toHaveCount(3);
    for (const legend of await legends.all()) {
      await legend.scrollIntoViewIfNeeded();
      await expect(legend).toBeVisible();
      await expect(legend).toContainText('01 Despertar · 05 Ascensão · 10 Maestria');
      const box = await legend.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
