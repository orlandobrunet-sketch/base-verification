import { test, expect, type Page } from '@playwright/test';
import { medirContraste } from '../helpers/contraste';

/**
 * Página de contato no lugar do endereço publicado.
 *
 * contato@nefroquest.com aparecia no rodapé da landing e na política de
 * privacidade, mas o domínio não tem MX: toda mensagem se perdia. O
 * proprietário pediu um formulário que não exponha o e-mail pessoal — o envio
 * vai pela Edge Function send-contact, simulada aqui.
 */
test.use({ serviceWorkers: 'block' });

const FUNCAO = '**/functions/v1/send-contact';

async function abrir(page: Page, resposta: { status?: number; falhar?: boolean } = {}) {
  const enviados: any[] = [];
  await page.route('**/*', async r => {
    const url = new URL(r.request().url());
    if (url.pathname.endsWith('/functions/v1/send-contact')) {
      enviados.push(r.request().postDataJSON());
      if (resposta.falhar) return r.abort();
      return r.fulfill({ status: resposta.status ?? 200, contentType: 'application/json', body: '{"success":true}' });
    }
    return url.hostname === 'localhost' ? r.continue() : r.abort();
  });
  await page.goto('/contato/');
  return enviados;
}

async function preencher(page: Page) {
  await page.getByLabel('Nome').fill('Maria');
  await page.getByLabel(/Seu e-mail/).fill('maria@exemplo.com');
  await page.getByLabel('Mensagem').fill('Achei um erro na questão 12.');
}

test('não há endereço de e-mail publicado em nenhuma das páginas', async ({ page }) => {
  for (const caminho of ['/', '/privacy-policy.html', '/contato/']) {
    const resposta = await page.request.get(caminho);
    const html = await resposta.text();
    expect(html, caminho).not.toContain('contato@nefroquest.com');
    expect(html, caminho).not.toMatch(/mailto:/);
    expect(html, caminho).not.toMatch(/@(outlook|gmail|hotmail)\.com/);
  }
});

test('rodapé da landing e privacidade levam ao formulário', async ({ page }) => {
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  for (const caminho of ['/', '/privacy-policy.html']) {
    await page.goto(caminho, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href="/contato/"]').first(), caminho).toBeAttached();
  }
});

test('envia e confirma, sem expor o destino', async ({ page }) => {
  const enviados = await abrir(page);
  await preencher(page);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.getByRole('status')).toContainText('Mensagem enviada');
  expect(enviados).toHaveLength(1);
  expect(enviados[0]).toMatchObject({ name: 'Maria', email: 'maria@exemplo.com' });
  expect(enviados[0].message).toContain('Achei um erro na questão 12.');
  await expect(page.getByLabel('Mensagem')).toHaveValue('');
});

test('campo faltando é apontado e nada é enviado', async ({ page }) => {
  const enviados = await abrir(page);
  await page.getByLabel('Nome').fill('Maria');
  await page.getByLabel(/Seu e-mail/).fill('maria-sem-arroba');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.getByRole('status')).toContainText('e-mail válido');
  await expect(page.getByLabel(/Seu e-mail/)).toBeFocused();
  await expect(page.getByLabel(/Seu e-mail/)).toHaveAttribute('aria-invalid', 'true');
  expect(enviados).toHaveLength(0);
});

test('falha do servidor e sem conexão são ditas, e a mensagem continua escrita', async ({ page }) => {
  await abrir(page, { status: 502 });
  await preencher(page);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.getByRole('status')).toContainText('Não conseguimos enviar agora (erro 502)');
  await expect(page.getByLabel('Mensagem')).toHaveValue('Achei um erro na questão 12.');

  await page.unrouteAll();
  await abrir(page, { falhar: true });
  await preencher(page);
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.getByRole('status')).toContainText('Sem conexão');
  await expect(page.getByLabel('Mensagem')).toHaveValue('Achei um erro na questão 12.');
});

test('robô que preenche a isca não gera envio', async ({ page }) => {
  const enviados = await abrir(page);
  await preencher(page);
  await page.locator('#site').fill('http://spam.example');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await expect(page.getByRole('status')).toContainText('Mensagem enviada');
  expect(enviados).toHaveLength(0);
});

for (const largura of [320, 390]) {
  test(`cabe em ${largura}px com texto a 200%, contraste e alvos de 44px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
    await page.setViewportSize({ width: largura, height: 800 });
    await abrir(page);
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
    const larguraDoc = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(larguraDoc, 'rolagem horizontal').toBeLessThanOrEqual(largura);
    for (const alvo of await page.locator('main :is(input:not(#site), textarea, button)').all()) {
      const caixa = (await alvo.boundingBox())!;
      expect(caixa.height, 'alvo de toque').toBeGreaterThanOrEqual(44);
    }
    const falhas = await page.evaluate(medirContraste, 'body');
    expect(falhas, JSON.stringify(falhas.map((f: any) => `${f.texto} ${f.razao}`))).toEqual([]);
  });
}
