import { test, expect, type Page } from '@playwright/test';
import { medirContraste } from '../helpers/contraste';
import { auditarVisual } from '../helpers/auditoria-visual';
import { injectGameState } from '../helpers/game';

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

/* O Oráculo tem uma tela própria (#oraclePage, role=main). O caso é
 * recolhível no mobile; o cabeçalho, o resumo, a conversa e o envio pertencem
 * à mesma tela. Fechar preserva o DOM, a conversa e o rascunho; mudar ou
 * invalidar o contexto é que descarta a tela anterior. */
// injectGameState volta em domcontentloaded; medir estilo exige folhas e fontes prontas.
async function naQuestao(page: Page) {
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
}

const ALTERNATIVAS_FICTICIAS = ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'];

async function percorreTela(page: Page, alvos: string[]) {
  for (const alvo of alvos) {
    await page.keyboard.press('Tab');
    await expect(page.locator(alvo)).toBeFocused();
    expect(await page.locator('#oraclePage').evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 400 }]) {
  for (const status of [200, 429, 503]) {
    test(`Oráculo: envio alcançável e resposta ${status} em ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      let requests = 0;
      await page.route('**/functions/v1/ai-mentor', route => {
        requests++;
        return route.fulfill({ status, json: { reply: 'Resposta fictícia para teste de apresentação.' } });
      });
      await naQuestao(page);
      await page.evaluate(opts => {
        (0, eval)(`authUser = {id:'00000000-0000-4000-8000-000000000001',user_metadata:{},app_metadata:{}}`);
        (window as any).getAuthToken = async () => null;
        (window as any).setMentorQuestion({ q: 'Contexto fictício de apresentação. '.repeat(18), opts, ans: 0, exp: '' });
        (window as any).openMentorModal();
      }, ALTERNATIVAS_FICTICIAS);
      await expect(page.locator('#oraclePage')).toHaveAttribute('role', 'main');
      await expect(page.locator('#mentorInput')).toBeFocused();
      await expect(page.locator('#oracleCase .nq-oracle-options li')).toHaveCount(4);
      // Alcançável: rolando até o campo, ele cabe inteiro na tela — nada o corta.
      const campo = page.locator('.mentor-input-row');
      await campo.scrollIntoViewIfNeeded();
      await expect.poll(async () => {
        const box = await campo.boundingBox();
        return box && box.y >= 0 && box.y + box.height <= viewport.height + 1
          && box.x >= 0 && box.x + box.width <= viewport.width + 1;
      }).toBe(true);
      const largura = await page.locator('#oraclePage').evaluate(el => {
        const r = el.getBoundingClientRect();
        return { dentro: r.left >= -1 && r.right <= window.innerWidth + 1,
          semRolagem: document.documentElement.scrollWidth <= window.innerWidth + 1 };
      });
      expect(largura, 'a tela do Oráculo transborda a largura').toEqual({ dentro: true, semRolagem: true });
      await page.locator('#mentorInput').fill('Mensagem fictícia');
      await page.getByRole('button', { name: 'Enviar', exact: true }).click();
      const resposta = status === 200 ? 'Resposta fictícia' : status === 429 ? 'Limite diário atingido' : 'Oráculo indisponível';
      await expect(page.locator('#mentorChat')).toContainText(resposta);
      await expect(page.locator('#mentorInput')).toBeEnabled();
      expect(requests).toBe(1);
      if (status === 429) await expect(page.getByRole('button', { name: 'Faça upgrade para Premium' })).toBeVisible();
      // O mobile oculta os textos auxiliares de desktop; medir os rótulos
      // visíveis evita aprovar contraste de um elemento que ninguém vê.
      await expect(page.locator('.mentor-input-row label')).toBeVisible();
      await expect(page.locator('#mentorQuotaBar')).toBeVisible();
      await expect(page.locator('#oracleCase > summary')).toBeVisible();
      expect(await page.evaluate(medirContraste, '.mentor-input-row label, #mentorQuotaBar, #oracleCase > summary')).toEqual([]);
      // A auditoria mantém o escopo original da conversa. O helper legado
      // mede Range de descendentes de <details> fechado como se estivessem
      // pintados; por isso o caso tem um percurso explícito, aberto, abaixo.
      const auditoria = await page.evaluate(auditarVisual, '#mentorPanel');
      await testInfo.attach('auditoria-visual', { body: JSON.stringify(auditoria, null, 2), contentType: 'application/json' });
      expect(auditoria.medidos.geometria).toBeGreaterThan(0);
      expect(auditoria.falhas).toEqual([]);
      // Fundos complexos continuam explícitos no anexo, não viram aprovação.
      const caso = page.locator('#oracleCase');
      await caso.locator('summary').click();
      await expect(caso).toHaveAttribute('open');
      await expect(caso.locator('.nq-oracle-question')).toBeVisible();
      const ultimaAlternativa = caso.locator('.nq-oracle-options li').last();
      await ultimaAlternativa.scrollIntoViewIfNeeded();
      await expect(ultimaAlternativa).toBeInViewport({ ratio: 1 });
      await caso.locator('summary').click();
      await expect(caso).not.toHaveAttribute('open');
      await campo.scrollIntoViewIfNeeded();
      if (status === 200) await testInfo.attach('oracle-functional-view', {
        body: await page.screenshot({ fullPage: false }), contentType: 'image/png',
      });
      // Chromium inclui na ordem de Tab regiões roláveis sem controles
      // focáveis internos. A conversa continua sendo uma parada útil de
      // teclado quando a resposta ocupa mais altura que a região do log.
      const logTemParadaNativa = await page.locator('#mentorChat').evaluate(el =>
        el.scrollHeight > el.clientHeight + 1 && !el.querySelector(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        ));
      await expect(page.locator('#mentorChat')).toHaveAttribute('role', 'log');
      await page.locator('.nq-oracle-back').focus();
      await percorreTela(page, [
        '#oracleCase > summary',
        ...(status === 429 ? ['#mentorChat [data-action="closeMentorModalAndUpgrade"]'] : []),
        ...(logTemParadaNativa ? ['#mentorChat'] : []),
        '#mentorInput', '#mentorPanel .mentor-send-btn',
      ]);
      await page.locator('#mentorInput').fill('Rascunho preservado');
      await page.keyboard.press('Escape');
      await expect(page.locator('#oraclePage')).toBeHidden();
      expect(await page.locator('#oraclePage').evaluate(el => (el as HTMLElement).inert)).toBe(true);
      await expect(page.locator('#mentorPanel')).toHaveCount(1);
      await page.evaluate(() => (window as any).openMentorModal());
      await expect(page.locator('#mentorInput')).toHaveValue('Rascunho preservado');
      await expect(page.locator('#mentorChat')).toContainText(resposta);
      expect(requests).toBe(1);
    });
  }
}

test('Oráculo visitante: login acessível por teclado', async ({ page }) => {
  await naQuestao(page);
  await page.evaluate(opts => {
    (window as any).setMentorQuestion({ q: 'Contexto fictício.', opts, ans: 0, exp: '' });
    (window as any).openMentorModal();
  }, ALTERNATIVAS_FICTICIAS);
  await expect(page.locator('#oraclePage')).toHaveAttribute('role', 'main');
  await expect(page.locator('#mentorInput')).toHaveCount(0);
  await expect(page.locator('.nq-oracle-back')).toBeFocused();
  const caseSummary = page.locator('#oracleCase > summary');
  await percorreTela(page, [
    ...(await caseSummary.isVisible() ? ['#oracleCase > summary'] : []),
    '#mentorPanel [data-action="closeMentorModalAndRegister"]',
    '#mentorPanel [data-action="closeMentorModalAndLogin"]',
  ]);
  await expect(page.getByRole('button', { name: 'Fazer login', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#oraclePage')).toBeHidden();
  expect(await page.locator('#oraclePage').evaluate(el => (el as HTMLElement).inert)).toBe(true);
  await expect(page.locator('#authModal')).toBeVisible();
});

for (const invalid of [
  { name: 'sem alternativas', opts: [], ans: 0 },
  { name: 'sem gabarito', opts: ALTERNATIVAS_FICTICIAS },
  { name: 'com gabarito fora das alternativas', opts: ALTERNATIVAS_FICTICIAS, ans: 4 },
]) {
  test(`Oráculo: contexto ${invalid.name} não abre nem envia uma consulta`, async ({ page }) => {
    await naQuestao(page);
    let requests = 0;
    await page.route('**/functions/v1/ai-mentor', route => { requests++; return route.abort(); });
    await page.evaluate(opts => {
      (0, eval)(`authUser = {id:'00000000-0000-4000-8000-000000000001',user_metadata:{},app_metadata:{}}`);
      (window as any).setMentorQuestion({ q: 'Contexto fictício válido.', opts, ans: 0, exp: '' });
      (window as any).openMentorModal();
    }, ALTERNATIVAS_FICTICIAS);
    await expect(page.locator('#mentorInput')).toBeVisible();
    await page.locator('#mentorInput').fill('Rascunho que não pode sair');
    await page.evaluate(invalid => {
      (window as any).setMentorQuestion({ q: 'Contexto fictício inválido.', ...invalid });
      (window as any).openMentorModal();
      (window as any)._sendMentorMessage();
    }, invalid);
    await expect(page.locator('#oraclePage')).toHaveCount(0);
    expect(await page.locator('#mainApp').evaluate(el => (el as HTMLElement).inert)).toBe(false);
    expect(requests).toBe(0);
  });
}

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
