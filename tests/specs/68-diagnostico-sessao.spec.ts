import { test, expect, type Page } from '@playwright/test';
import { medirContraste } from '../helpers/contraste';

/**
 * Diagnóstico da sessão no resultado de Estudo e Revisão.
 *
 * Antes: uma falha de rede ou do servidor APAGAVA o cartão — falha e
 * "não há diagnóstico" ficavam iguais — e a cota local era gasta antes da
 * chamada, então a falha custava um dos três diagnósticos do dia.
 *
 * Agora cada estado é distinguível, a cota local só sobe no sucesso, a recusa
 * do servidor alinha o contador e redesenhar o resultado não chama a IA de
 * novo.
 */

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

type Resposta = { status: number; corpo?: unknown } | 'rede';

type Rota = Parameters<Parameters<Page['route']>[1]>[0];

async function chegarAoResultado(page: Page, opcoes: { logado?: boolean; respostas?: Resposta[]; usados?: number; rota?: (route: Rota) => Promise<void> } = {}) {
  const pedidos: string[] = [];
  const fila = [...(opcoes.respostas ?? [{ status: 200, corpo: { diagnosis: 'Revise **distúrbios do potássio**.' } }])];
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.route('**/functions/v1/ai-diagnosis', async route => {
    pedidos.push(route.request().method());
    if (opcoes.rota) return opcoes.rota(route);
    const r = fila.length > 1 ? fila.shift()! : fila[0];
    if (r === 'rede') return route.abort('failed');
    return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.corpo ?? {}) });
  });
  await page.goto('/jogar/');
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async ({ logado, usados }) => {
    if (usados !== undefined) {
      localStorage.setItem('nq-diag-quota', JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: usados }));
    }
    if (logado) {
      (0, eval)(`authUser = {id:'00000000-0000-4000-8000-000000000001',user_metadata:{},app_metadata:{}}`);
      (window as any).getAuthToken = async () => 'token-ficticio';
    }
    await (window as any).startFreeStudyMode();
    (0, eval)('studyModeQuestions = studyModeQuestions.slice(0, 1); showStudyModePage();');
  }, { logado: opcoes.logado ?? true, usados: opcoes.usados });
  await page.locator('#studyOptions button').first().click();
  await page.getByRole('button', { name: 'Ver Resultados' }).click();
  await expect(page.getByRole('heading', { name: 'Estudo concluído' })).toBeVisible();
  return { pedidos, card: page.locator('#aiDiagnosisCard') };
}

const cotaUsada = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('nq-diag-quota') || '{}').count ?? 0);

test('sucesso mostra o diagnóstico e gasta um do limite diário', async ({ page }) => {
  const { pedidos, card } = await chegarAoResultado(page);
  await expect(card).toHaveAttribute('data-estado', 'pronto');
  await expect(card.getByRole('heading', { name: 'Diagnóstico da sessão' })).toBeVisible();
  await expect(card.locator('.ai-diagnosis-body strong')).toHaveText('distúrbios do potássio');
  await expect(card.locator('.ai-diagnosis-quota')).toHaveText('2/3 diagnósticos restantes hoje');
  expect(await cotaUsada(page)).toBe(1);
  expect(pedidos).toHaveLength(1);
});

for (const falha of [{ nome: 'erro do servidor', r: { status: 502, corpo: { error: 'AI service unavailable' } } as Resposta },
  { nome: 'falha de rede', r: 'rede' as Resposta },
  { nome: 'resposta vazia', r: { status: 200, corpo: { diagnosis: '' } } as Resposta }]) {
  test(`${falha.nome} fica visível, não gasta cota e permite tentar de novo`, async ({ page }) => {
    const { pedidos, card } = await chegarAoResultado(page, {
      respostas: [falha.r, { status: 200, corpo: { diagnosis: 'Diagnóstico da nova tentativa.' } }],
    });
    // Falha não pode parecer ausência de diagnóstico: o cartão fica e diz o que houve.
    await expect(card).toHaveAttribute('data-estado', 'falha');
    await expect(card).toContainText('não pôde ser gerado agora');
    await expect(card.locator('.ai-diagnosis-quota')).toHaveText('3/3 diagnósticos restantes hoje');
    expect(await cotaUsada(page)).toBe(0);

    const tentar = card.getByRole('button', { name: 'Tentar novamente' });
    await tentar.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('data-estado', 'pronto');
    await expect(card).toContainText('Diagnóstico da nova tentativa.');
    await expect(card, 'o foco se perdeu quando o botão sumiu').toBeFocused();
    expect(await cotaUsada(page)).toBe(1);
    expect(pedidos).toHaveLength(2);
  });
}

test('recusa por cota do servidor alinha o contador local', async ({ page }) => {
  const { card } = await chegarAoResultado(page, { respostas: [{ status: 429, corpo: { error: 'quota_exceeded' } }] });
  await expect(card).toHaveAttribute('data-estado', 'recusado');
  await expect(card).toContainText('Limite diário de 3 diagnósticos atingido');
  await expect(card.getByRole('button', { name: 'faça upgrade para Premium' })).toBeVisible();
  await expect(card.locator('.ai-diagnosis-quota')).toHaveText('0/3 diagnósticos restantes hoje');
  await expect(card.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);
});

test('sessão expirada pede novo login em vez de parecer falha genérica', async ({ page }) => {
  const { card } = await chegarAoResultado(page, { respostas: [{ status: 401, corpo: { error: 'unauthorized' } }] });
  await expect(card).toHaveAttribute('data-estado', 'sessao');
  await expect(card.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  expect(await cotaUsada(page)).toBe(0);
});

test('sem cota local, a IA não é chamada', async ({ page }) => {
  const { pedidos, card } = await chegarAoResultado(page, { usados: 3 });
  await expect(card).toHaveAttribute('data-estado', 'sem-cota');
  await expect(card).toContainText('Limite diário de 3 diagnósticos atingido');
  expect(pedidos).toHaveLength(0);
});

test('visitante vê o caminho para a conta e nenhuma chamada sai', async ({ page }) => {
  const { pedidos, card } = await chegarAoResultado(page, { logado: false });
  await expect(card).toHaveAttribute('data-estado', 'visitante');
  await expect(card.getByRole('button', { name: 'Criar conta gratuita' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(card.locator('.ai-diagnosis-quota')).toHaveCount(0);
  expect(pedidos).toHaveLength(0);
});

test('redesenhar o resultado não chama a IA de novo — nem durante o pedido', async ({ page }) => {
  let liberar!: () => void;
  const segura = new Promise<void>(r => { liberar = r; });
  const { pedidos, card } = await chegarAoResultado(page, {
    rota: async route => {
      await segura;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ diagnosis: 'Único diagnóstico.' }) });
    },
  });
  await expect(card).toHaveAttribute('data-estado', 'carregando');
  await expect(card).toHaveAttribute('aria-busy', 'true');
  // Redesenho com o pedido em andamento.
  await page.evaluate(() => (0, eval)('showStudyModeResults()'));
  await expect(card).toHaveAttribute('data-estado', 'carregando');
  liberar();
  await expect(card).toHaveAttribute('data-estado', 'pronto');
  // Redesenho depois do resultado.
  await page.evaluate(() => (0, eval)('showStudyModeResults()'));
  await expect(card).toHaveAttribute('data-estado', 'pronto');
  await expect(card).toContainText('Único diagnóstico.');
  expect(pedidos).toHaveLength(1);
  expect(await cotaUsada(page)).toBe(1);
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200% e mantém contraste`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 700 });
    const { card } = await chegarAoResultado(page, { respostas: [{ status: 502 }] });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await expect(card).toHaveAttribute('data-estado', 'falha');
    const medida = await card.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { dentro: r.left >= -1 && r.right <= innerWidth + 1, semRolagem: document.documentElement.scrollWidth <= innerWidth + 1 };
    });
    expect(medida, 'o cartão transborda a largura').toEqual({ dentro: true, semRolagem: true });
    const botao = card.getByRole('button', { name: 'Tentar novamente' });
    const caixa = await botao.boundingBox();
    expect(caixa!.height, 'alvo de toque abaixo de 44px').toBeGreaterThanOrEqual(44);
    for (const alvo of ['#aiDiagnosisTitle', '.ai-diagnosis-quota', '.ai-diagnosis-status']) {
      expect(await page.evaluate(medirContraste, `#aiDiagnosisCard ${alvo}`)).toEqual([]);
    }
  });
}
