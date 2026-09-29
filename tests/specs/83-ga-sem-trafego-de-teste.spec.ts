import { test, expect } from '@playwright/test';

/**
 * Os testes não contam como visitantes no Google Analytics.
 *
 * Medido em 28/09: com uma rodada da CI em andamento, o GA4 mostrava 825
 * usuários ativos em 30 minutos, concentrados nos datacenters do GitHub nos
 * EUA — contra 4 em Curitiba. Cada teste abria o jogo e o gtag enviava
 * page_view. O bloqueio fica em playwright.config.ts (host-resolver-rules);
 * este teste reprova se alguma batida chegar ao Google.
 */
test('abrir o jogo e a landing não entrega nenhuma batida ao Google Analytics', async ({ page }) => {
  const entregues: string[] = [];
  page.on('requestfinished', r => {
    if (/google-analytics\.com|googletagmanager\.com|analytics\.google\.com/.test(r.url())) entregues.push(r.url().slice(0, 80));
  });
  for (const caminho of ['/', '/jogar/']) {
    await page.goto(caminho, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
  }
  expect(entregues, 'o navegador de teste falou com o Google Analytics').toEqual([]);
  // O app continua funcionando sem o script do Google: gtag existe (definido
  // no próprio HTML) e registrar um evento não lança erro.
  expect(await page.evaluate(() => { (window as any)._track?.('teste_sem_ga'); return typeof (window as any).gtag; })).toBe('function');
});

/* A 15.37 trocou o ID do gtag pelo ID do fluxo da propriedade (G-903Y6240FZ)
 * e a coleta parou: para esse ID o Google responde 404 no gtag.js — ele é só o
 * destino interno da tag G-0TS171XV3K. A tag carregada precisa ser a do Google. */
test('as páginas carregam a tag do Google, não o ID do fluxo', async ({ request }) => {
  for (const caminho of ['/', '/jogar/']) {
    const html = await (await request.get(caminho)).text();
    const ids = [...html.matchAll(/gtag\/js\?id=(G-[A-Z0-9]+)|gtag\('config', '(G-[A-Z0-9]+)'/g)].map(m => m[1] || m[2]);
    expect(ids.length, caminho).toBeGreaterThan(0);
    expect(new Set(ids), caminho).toEqual(new Set(['G-0TS171XV3K']));
  }
});
