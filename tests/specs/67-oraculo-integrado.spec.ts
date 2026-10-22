import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/** Tela dedicada: questão e conversa juntas, com retorno ao estado original. */

test.use({ serviceWorkers: 'block' });

const QUESTAO = {
  q: 'Paciente com DRC estágio 4 e hipercalemia de 6,2 mEq/L. Qual a conduta inicial?',
  opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'Explicação', correctOption: 'A',
};

async function abrirOraculo(page: Page, opcoes: { logado: boolean; largura?: number; resposta?: { status: number; corpo: unknown } }) {
  await page.setViewportSize({ width: opcoes.largura ?? 1280, height: (opcoes.largura ?? 1280) === 390 ? 844 : 800 });
  await page.route('**/*', (rota) => {
    const url = rota.request().url();
    return new URL(url).hostname === 'localhost' ? rota.continue() : rota.abort();
  });
  if (opcoes.resposta) {
    await page.route('**/functions/v1/ai-mentor', (rota) => rota.fulfill({
      status: opcoes.resposta!.status, contentType: 'application/json', body: JSON.stringify(opcoes.resposta!.corpo),
    }));
  }
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(({ logado, questao }) => {
    const g = window as any;
    if (logado) g.authUser = { id: 't1', email: 't@e.com', app_metadata: {} };
    g.setMentorQuestion?.(questao);
    g.openMentorModal?.();
  }, { logado: opcoes.logado, questao: QUESTAO });
  await expect(page.locator('#mentorPanel')).toBeVisible({ timeout: 15000 });
}

const perguntar = async (page: Page) => {
  await page.locator('#mentorInput').fill('Por que a hipercalemia causa arritmia?');
  await page.locator('#mentorInput').press('Enter');
};

test.describe('Oráculo em tela dedicada', () => {
  test('mostra o contexto ao lado da conversa e isola os controles da questão original', async ({ page }) => {
    await abrirOraculo(page, { logado: true });
    const painel = page.locator('#mentorPanel');
    await expect(page.locator('#oraclePage')).toHaveAttribute('role', 'main');
    await expect(page.locator('#oracleCase')).toContainText(QUESTAO.q);
    await expect(page.locator('#oracleCase .nq-oracle-options li')).toHaveCount(4);
    expect(await page.locator('#mainApp').evaluate(el => (el as HTMLElement).inert)).toBe(true);
    const caso = (await page.locator('#oracleCase').boundingBox())!;
    const chat = (await painel.boundingBox())!;
    expect(caso.x + caso.width).toBeLessThan(chat.x);
    expect(await page.locator('#oraclePage').evaluate(el => getComputedStyle(el).position)).toBe('fixed');
  });

  test('sem conta, não há campo — há o caminho para ter acesso', async ({ page }) => {
    await abrirOraculo(page, { logado: false, largura: 390 });
    const painel = page.locator('#mentorPanel');
    await expect(painel.locator('#mentorInput')).toHaveCount(0);
    await expect(painel.locator('.mentor-access-panel')).toBeVisible();
    await expect(painel.locator('[data-action="closeMentorModalAndRegister"]')).toBeVisible();
    await expect(painel.locator('[data-action="closeMentorModalAndLogin"]')).toBeVisible();
  });

  test('o limite diário informado é o mesmo que o contador mostra', async ({ page }) => {
    /* A mensagem local trazia "limite diário de 3 perguntas" — o número do
     * DIAGNÓSTICO. O contrato do Oráculo é 5, igual no cliente e na Edge
     * Function. A mesma tela informava dois limites diferentes. */
    await abrirOraculo(page, { logado: true });
    await page.evaluate(() => {
      const hoje = new Date().toISOString().slice(0, 10);
      localStorage.setItem('nq-mentor-quota', JSON.stringify({ date: hoje, count: 99 }));
    });
    await perguntar(page);

    const aviso = page.locator('.mentor-msg-system').last();
    await expect(aviso).toContainText(/limite diário de 5 perguntas/i, { timeout: 10000 });
    await expect(aviso, 'o limite anunciado é o do diagnóstico, não o do Oráculo').not.toContainText('3 perguntas');
  });

  test('a cota recusada pelo servidor corrige o contador; falha de servidor não gasta cota', async ({ page }) => {
    // Contrato preservado da entrega anterior: recusa por cota ≠ indisponível.
    await abrirOraculo(page, {
      logado: true,
      resposta: { status: 429, corpo: { error: 'quota_exceeded', message: 'Limite diário atingido.' } },
    });
    await perguntar(page);
    await expect(page.locator('#mentorPanel')).toContainText(/limite diário atingido/i, { timeout: 15000 });
    await expect(page.locator('#mentorQuotaBar')).toContainText('0/5');
  });

  test('falha do servidor mantém a cota e convida a tentar de novo', async ({ page }) => {
    await abrirOraculo(page, { logado: true, resposta: { status: 500, corpo: { error: 'boom' } } });
    await perguntar(page);
    await expect(page.locator('#mentorPanel')).toContainText(/indisponível/i, { timeout: 15000 });
    await expect(page.locator('#mentorQuotaBar'), 'instabilidade não pode consumir perguntas').toContainText('5/5');
  });

  test('Escape e "Voltar à questão" devolvem o foco a quem abriu', async ({ page }) => {
    await abrirOraculo(page, { logado: true });
    await page.evaluate(() => (window as any).closeMentorModal());
    await page.evaluate(() => {
      const botao = document.createElement('button');
      botao.id = 'origemFalsa';
      botao.textContent = 'abrir';
      document.getElementById('mainApp')?.appendChild(botao);
      botao.focus();
      (window as any).openMentorModal();
    });
    await expect(page.locator('#mentorPanel')).toBeVisible();

    await page.locator('#oraclePage [data-action="closeMentorModal"]').first().click();
    await expect(page.locator('#mentorPanel')).not.toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('origemFalsa');

    await page.evaluate(() => { (document.getElementById('origemFalsa') as HTMLElement).focus(); (window as any).openMentorModal(); });
    await expect(page.locator('#mentorPanel')).toBeVisible();
    await page.locator('#mentorInput').press('Escape');
    await expect(page.locator('#mentorPanel')).not.toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('origemFalsa');
  });

  test('cabe em 320px com texto a 200%', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '32px';
      });
    });
    await abrirOraculo(page, { logado: true, largura: 320 });
    const transborda = await page.locator('#mentorPanel').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.right > window.innerWidth + 1 || r.left < -1;
    });
    expect(transborda, 'o painel do Oráculo transborda a tela').toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });
});
