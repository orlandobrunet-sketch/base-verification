import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * Os três desfechos do Oráculo, do ponto de vista de quem pergunta.
 *
 * A função `ai-mentor` responde 401 (sem conta), 429 (cota do dia) ou 5xx
 * (indisponível). O NQ-03 pede que esses estados sejam verificados — são
 * justamente aqueles em que a pessoa fica parada sem saber o que fazer.
 *
 * O DEFEITO QUE ISTO FECHA: a cota vive em `ai_usage`, por usuário e por dia.
 * O contador da tela é uma cópia POR DISPOSITIVO, que só sobe quando este
 * aparelho pergunta. Quem gastou as cinco no celular abre o notebook e lê
 * "5/5 perguntas restantes hoje" — e é recusado na primeira.
 *
 * Medido antes do conserto, na mesma tela, ao mesmo tempo:
 *
 *     barra:  "5/5 perguntas restantes hoje"
 *     aviso:  "Limite diário atingido."
 *
 * Um número que contradiz a própria tela é pior que número nenhum.
 */

test.use({ serviceWorkers: 'block' });

const QUESTAO = { q: 'Paciente com hipercalemia grave.', o: ['A', 'B', 'C', 'D'], a: 0, e: 'Explicação', cat: 'Eletrólitos' };

async function abrirOraculo(page: Page, opcoes: { status: number; corpo: unknown; logado: boolean }) {
  await page.route('**/*', (rota) => {
    const url = rota.request().url();
    return (new URL(url).hostname === 'localhost' || url.includes('ai-mentor')) ? rota.continue() : rota.abort();
  });
  await page.route('**/functions/v1/ai-mentor', (rota) =>
    rota.fulfill({ status: opcoes.status, contentType: 'application/json', body: JSON.stringify(opcoes.corpo) }));

  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(({ logado, questao }) => {
    const g = window as any;
    // auth.js expõe authUser por defineProperty; dá para simular a sessão.
    if (logado) g.authUser = { id: 'teste-1', email: 'teste@exemplo.com', app_metadata: {} };
    g.setMentorQuestion?.(questao);
    g.openMentorModal?.();
  }, { logado: opcoes.logado, questao: QUESTAO });
  await expect(page.locator('.mentor-overlay')).toBeVisible({ timeout: 15000 });
}

async function perguntar(page: Page) {
  await page.locator('#mentorInput').fill('Por que a hipercalemia causa arritmia?');
  await page.locator('#mentorInput').press('Enter');
}

test.describe('Oráculo: o que a pessoa vê quando não dá certo', () => {
  test('sem conta, o Oráculo não deixa nem perguntar — e diz como ter acesso', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Um percurso basta para o contrato.');
    test.setTimeout(120000);
    await abrirOraculo(page, { status: 401, corpo: { error: 'unauthorized' }, logado: false });

    // Melhor que deixar perguntar e recusar depois: não há campo nenhum.
    await expect(page.locator('#mentorInput'), 'visitante não deveria ter campo de pergunta').toHaveCount(0);
    const painel = page.locator('.mentor-access-panel');
    await expect(painel).toBeVisible();
    await expect(painel).toContainText(/conta/i);
    await expect(painel.locator('[data-action="closeMentorModalAndRegister"]')).toBeVisible();
    await expect(painel.locator('[data-action="closeMentorModalAndLogin"]')).toBeVisible();
  });

  test('na cota esgotada, o contador para de prometer o que não existe', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Um percurso basta para o contrato.');
    test.setTimeout(120000);
    await abrirOraculo(page, {
      status: 429,
      corpo: { error: 'quota_exceeded', message: 'Limite diário atingido. Faça upgrade para Premium.' },
      logado: true,
    });
    await perguntar(page);

    const aviso = page.locator('.mentor-overlay');
    await expect(aviso).toContainText(/limite diário atingido/i, { timeout: 15000 });
    await expect(page.locator('[data-action="closeMentorModalAndUpgrade"]'), 'a recusa precisa oferecer a saída').toBeVisible();

    // O ponto: a barra não pode contradizer a recusa que está ao lado dela.
    const barra = page.locator('#mentorQuotaBar');
    await expect(barra, 'a tela recusa e promete cinco perguntas ao mesmo tempo').not.toContainText('5/5');
    await expect(barra).toContainText('0/5');
  });

  test('em falha do servidor, a mensagem convida a tentar de novo — e a cota é preservada', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Um percurso basta para o contrato.');
    test.setTimeout(120000);
    /* A contrapartida do conserto acima: zerar a cota local é certo quando o
     * servidor diz "acabou", e ERRADO quando ele só está fora do ar. Uma
     * instabilidade não pode consumir as perguntas de ninguém. */
    await abrirOraculo(page, { status: 500, corpo: { error: 'API key not configured' }, logado: true });
    await perguntar(page);

    await expect(page.locator('.mentor-overlay')).toContainText(/indisponível/i, { timeout: 15000 });
    await expect(page.locator('#mentorQuotaBar'), 'falha de servidor não pode gastar a cota').toContainText('5/5');
  });
});
