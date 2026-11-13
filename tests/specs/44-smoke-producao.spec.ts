import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke de produção — SOMENTE LEITURA.
 *
 * Roda contra o host real quando BASE_URL aponta para nefroquest.com, e é
 * pulado no ambiente local (onde os outros specs já cobrem tudo isto com mais
 * profundidade). Nenhum cenário aqui envia pontuação, cria conta, grava no
 * Supabase ou dispara pagamento: um smoke que suja a produção não pode ser
 * rodado quando dá vontade, e um smoke que não pode ser rodado não serve.
 *
 * O que ele cobre é a fronteira que só existe no host real: versão publicada,
 * coerência entre HTML/JS/CSS servidos, cabeçalhos de segurança, e o app
 * abrindo em desktop e celular sem erro de console.
 */

const EM_PRODUCAO = (process.env.BASE_URL || '').includes('nefroquest.com');

test.describe('Smoke de produção (somente leitura)', () => {
  test.skip(!EM_PRODUCAO, 'roda apenas com BASE_URL apontando para nefroquest.com');

  async function versaoPublicada(page: Page): Promise<string> {
    const resposta = await page.request.get('/version.json?cb=' + Date.now());
    expect(resposta.ok(), 'version.json precisa responder').toBe(true);
    return (await resposta.json()).version;
  }

  test('version.json, Service Worker e Sentry declaram a MESMA versão', async ({ page }) => {
    const versao = await versaoPublicada(page);

    const sw = await (await page.request.get('/sw.js?cb=' + Date.now())).text();
    const cache = sw.match(/nefroquest-v([0-9.]+)/)?.[1];
    expect(cache, 'o cache do Service Worker precisa acompanhar a versão').toBe(versao);

    for (const caminho of ['/', '/jogar/']) {
      const html = await (await page.request.get(caminho + '?cb=' + Date.now())).text();
      const sentry = html.match(/release:\s*'nefroquest@([0-9.]+)'/)?.[1];
      expect(sentry, `o release do Sentry em ${caminho} precisa acompanhar a versão`).toBe(versao);
    }
  });

  test('todo asset versionado no HTML existe e responde', async ({ page }) => {
    const html = await (await page.request.get('/jogar/?cb=' + Date.now())).text();
    const versionados = [...html.matchAll(/(?:src|href)="((?:js|styles|style)[^"]*\?v=[0-9.]+)"/g)].map((m) => m[1]);
    expect(versionados.length, 'o HTML precisa referenciar assets versionados').toBeGreaterThan(5);

    const quebrados: string[] = [];
    for (const asset of versionados) {
      const r = await page.request.get('/' + asset.replace(/^\//, ''));
      if (!r.ok()) quebrados.push(`${asset} → ${r.status()}`);
    }
    expect(quebrados, `assets versionados que não respondem: ${quebrados.join(', ')}`).toEqual([]);
  });

  test('o app abre para visitante, sem erro de console', async ({ page, baseURL }, info) => {
    const ownOrigin = new URL(baseURL!).origin;
    const externalHosts = ['challenges.cloudflare.com', 'googletagmanager.com',
      'google-analytics.com', 'analytics.google.com', 'sentry-cdn.com', 'sentry.io'];
    const erros: { message: string; source: string; thirdParty: boolean }[] = [];
    const safeMessage = (text: string) => text.replace(/https?:\/\/[^\s"'<>]+/g, value => {
      try { return new URL(value).origin; } catch { return '[URL]'; }
    }).slice(0, 200);
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      let source = 'unknown', thirdParty = false;
      try {
        const url = new URL(message.location().url);
        const extension = ['chrome-extension:', 'moz-extension:'].includes(url.protocol);
        thirdParty = url.origin !== ownOrigin && (extension || externalHosts.some(host =>
          url.hostname === host || url.hostname.endsWith('.' + host)));
        // Keep the source needed for diagnosis without third-party paths or tokens.
        source = url.origin === ownOrigin ? url.origin + url.pathname : url.origin;
      } catch { /* Unknown source stays a failure, including generic network errors. */ }
      erros.push({ message: safeMessage(message.text()), source, thirdParty });
    });
    page.on('pageerror', (error) => erros.push({
      message: 'pageerror: ' + safeMessage(String(error.message)), source: 'pageerror', thirdParty: false,
    }));

    await page.goto('/jogar/', { waitUntil: 'load' });
    await expect(page.locator('#landingScreen')).toBeVisible({ timeout: 20000 });

    // Classify known external sources by URL: generic ERR_FAILED/NAME_NOT_RESOLVED
    // messages alone do not identify their origin. Own-origin errors always fail,
    // even if their message mentions analytics, Sentry or a network failure.
    const nossos = erros.filter(error => !error.thirdParty);
    await info.attach('host-console-diagnostics', { contentType: 'application/json', body: JSON.stringify(erros) });
    expect(nossos, `erros de console próprios: ${JSON.stringify(nossos)}`).toEqual([]);
  });

  test('a tipografia do sistema resolve — nada cai no serif padrão', async ({ page }) => {
    await page.goto('/jogar/', { waitUntil: 'load' });
    await page.evaluate(() => (document as any).fonts.ready);

    const tokens = await page.evaluate(() => {
      const b = getComputedStyle(document.body);
      return { corpo: b.getPropertyValue('--nql-font-body').trim(), aplicada: b.fontFamily };
    });
    expect(tokens.corpo, '--nql-font-body não resolve em produção').not.toBe('');
    expect(tokens.aplicada, 'o body caiu no serif padrão do navegador').not.toMatch(/Times/i);
  });

  test('o cabeçalho tem estilo — marca e atalho de acessibilidade', async ({ page }) => {
    await page.goto('/jogar/', { waitUntil: 'load' });
    await page.evaluate(() => (document as any).fonts.ready);

    const marca = page.locator('.nql-brand').first();
    await expect(marca).toHaveCount(1);
    expect(await marca.evaluate((el) => getComputedStyle(el).textDecorationLine),
      'a marca sublinhada significa regra-base ausente').toBe('none');

    const skip = page.locator('.nql-skip-link').first();
    const deslocado = await skip.evaluate((el) => getComputedStyle(el).transform);
    expect(deslocado, 'o atalho precisa ficar fora da tela até receber foco').not.toBe('none');
  });

  test('abre em viewport de celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/jogar/', { waitUntil: 'load' });
    await expect(page.locator('#landingScreen')).toBeVisible({ timeout: 20000 });

    const rolagemHorizontal = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(rolagemHorizontal, 'a página não pode rolar na horizontal no celular').toBe(false);
  });

  test('os cabeçalhos de segurança do host estão presentes', async ({ page }) => {
    const r = await page.request.get('/jogar/?cb=' + Date.now());
    const h = r.headers();
    // Registrado como medição, não como exigência: o GitHub Pages não permite
    // definir header de resposta, e a ausência de CSP já está no roadmap como
    // etapa própria. O que este cenário garante é que a página responde e serve
    // HTML — se um dia o host mudar, o diagnóstico começa aqui.
    expect(r.ok(), 'a página do app precisa responder').toBe(true);
    expect(h['content-type'] ?? '', 'o app precisa ser servido como HTML').toContain('text/html');
  });
});
