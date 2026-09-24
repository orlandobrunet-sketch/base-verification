import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * O Oráculo saiu da sobreposição e entrou na página.
 *
 * Era uma folha `position: fixed` no rodapé, com `aria-modal` e o resto da
 * página escurecido. Para perguntar SOBRE a questão, a pessoa perdia a
 * questão — tanto que o próprio diálogo precisava REIMPRIMIR o enunciado num
 * quadro apertado, e a conversa cabia numa faixa fina entre esse enunciado
 * duplicado e o campo de texto.
 *
 * Medido antes, em 390px: caixa de 337px de altura colada no rodapé, tudo
 * atrás escurecido e desfocado.
 *
 * Agora o painel entra logo abaixo do veredito: o enunciado continua legível
 * acima, a conversa cresce com a rolagem da própria página e não há enunciado
 * repetido. Não é diálogo, é região do documento.
 */

test.use({ serviceWorkers: 'block' });

const QUESTAO = {
  q: 'Paciente com DRC estágio 4 e hipercalemia de 6,2 mEq/L. Qual a conduta inicial?',
  opts: ['A', 'B', 'C', 'D'], ans: 0, exp: 'Explicação', correctOption: 'A',
};

async function abrirOraculo(page: Page, opcoes: { logado: boolean; largura?: number; resposta?: { status: number; corpo: unknown } }) {
  await page.setViewportSize({ width: opcoes.largura ?? 1280, height: (opcoes.largura ?? 1280) === 390 ? 844 : 800 });
  await page.route('**/*', (rota) => {
    const url = rota.request().url();
    return (new URL(url).hostname === 'localhost' || url.includes('ai-mentor')) ? rota.continue() : rota.abort();
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

test.describe('Oráculo dentro da página', () => {
  test('é região do fluxo, não sobreposição — e a questão continua visível', async ({ page }) => {
    await abrirOraculo(page, { logado: true, largura: 390 });
    const painel = page.locator('#mentorPanel');

    const medida = await painel.evaluate((el) => ({
      posicao: getComputedStyle(el).position,
      papel: el.getAttribute('role'),
      modal: el.getAttribute('aria-modal'),
    }));
    expect(medida.posicao, 'voltou a ser sobreposição').not.toBe('fixed');
    expect(medida.papel).toBe('region');
    expect(medida.modal, 'região do documento não é diálogo modal').toBeNull();

    // O enunciado precisa continuar na tela: é sobre ele que se pergunta.
    const questaoNaTela = await page.locator('#question').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    expect(questaoNaTela, 'a questão saiu da tela ao abrir o Oráculo').toBe(true);

    // E não pode haver enunciado duplicado dentro do painel.
    await expect(painel, 'o enunciado voltou a ser reimpresso dentro do painel')
      .not.toContainText(QUESTAO.q.slice(0, 40));
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
    // Sem armadilha de foco: quem abriu recebe o foco de volta ao fechar.
    await page.evaluate(() => {
      const botao = document.createElement('button');
      botao.id = 'origemFalsa';
      botao.textContent = 'abrir';
      document.getElementById('mainApp')?.appendChild(botao);
      botao.focus();
      (window as any).openMentorModal();
    });
    await expect(page.locator('#mentorPanel')).toBeVisible();

    await page.locator('#mentorPanel [data-action="closeMentorModal"]').first().click();
    await expect(page.locator('#mentorPanel')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('origemFalsa');

    await page.evaluate(() => { (document.getElementById('origemFalsa') as HTMLElement).focus(); (window as any).openMentorModal(); });
    await expect(page.locator('#mentorPanel')).toBeVisible();
    await page.locator('#mentorInput').press('Escape');
    await expect(page.locator('#mentorPanel')).toHaveCount(0);
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
