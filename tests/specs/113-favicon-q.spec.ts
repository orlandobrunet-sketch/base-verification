import { test, expect } from '@playwright/test';

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium', 'Arquivos estáticos são os mesmos em todas as viewports.');
});

const PAGINAS = [
  '/', '/jogar/', '/contato/', '/privacy-policy.html', '/404.html',
  '/offline.html', '/clear-cache.html', '/landing/index.html',
  '/design-system/lumen-foundation/',
];

test('entrypoints usam a marca Q e não apontam para ícones ou splashes N', async ({ request }) => {
  const landing = await (await request.get('/')).text();
  const icoHref = landing.match(/href="(\/landing\/assets\/favicon-q\.ico\?v=\d+\.\d+)"/)?.[1];
  expect(icoHref).toMatch(/^\/landing\/assets\/favicon-q\.ico\?v=\d+\.\d+$/);
  for (const caminho of PAGINAS) {
    const resposta = await request.get(caminho);
    expect(resposta.ok(), caminho).toBe(true);
    const html = await resposta.text();
    const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
    expect(head, caminho).toContain('/landing/assets/favicon.svg');
    expect(head, caminho).toContain('/landing/assets/favicon-32x32.png');
    expect(head, caminho).toContain(icoHref!);
    expect(head, caminho).toContain('sizes="192x192" href="/landing/assets/favicon-192x192.png"');
    expect(head, caminho).not.toMatch(/assets\/images\/(?:favicon-|apple-touch-icon|splash-)/);
  }
});

test('manifest preserva rotas e declara apenas dimensões reais de Q', async ({ request }) => {
  const manifest = await (await request.get('/manifest.json')).json();
  expect(manifest.id).toBe('/');
  expect(manifest.start_url).toBe('/jogar/');
  expect(manifest.scope).toBe('/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.shortcuts.map((s: any) => s.url)).toEqual(['/jogar/?mode=study', '/jogar/?mode=rapidquiz']);
  expect(manifest.icons).toEqual([
    { src: '/landing/assets/favicon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/landing/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ]);
  for (const atalho of manifest.shortcuts) {
    expect(atalho.icons).toEqual([{ src: '/landing/assets/favicon-192x192.png', sizes: '192x192', type: 'image/png' }]);
  }
});

test('fallback ICO embute o PNG Q aprovado sem alterar nenhum pixel', async ({ request }) => {
  const aprovado = await request.get('/landing/assets/favicon-32x32.png');
  expect(aprovado.headers()['content-type']).toMatch(/image\/png/i);
  const png = await aprovado.body();
  const resposta = await request.get('/favicon.ico');
  expect(resposta.headers()['content-type']).toMatch(/image\/(?:x-icon|vnd\.microsoft\.icon)/i);
  const ico = await resposta.body();
  expect(ico.readUInt16LE(0)).toBe(0);
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(1);
  expect(ico[6]).toBe(32);
  expect(ico[7]).toBe(32);
  expect(ico.readUInt32LE(14)).toBe(png.length);
  const offset = ico.readUInt32LE(18);
  expect(offset).toBe(22);
  expect(ico.subarray(offset).equals(png)).toBe(true);
  const landing = await (await request.get('/')).text();
  const iconHref = landing.match(/href="(\/landing\/assets\/favicon-q\.ico\?v=\d+\.\d+)"/)?.[1];
  expect(iconHref).toBeTruthy();
  // O endereço distinto evita o ICO N sob a chave canônica do SW 15.89.
  expect(new URL(iconHref!, 'http://localhost').pathname).not.toBe('/favicon.ico');
  const explicit = await (await request.get(iconHref!)).body();
  expect(explicit.equals(ico)).toBe(true);
  const sw = await (await request.get('/sw.js')).text();
  expect(sw).toContain("'/landing/assets/favicon-q.ico'");
  expect(png.readUInt32BE(16)).toBe(32);
  expect(png.readUInt32BE(20)).toBe(32);

  const png192 = await (await request.get('/landing/assets/favicon-192x192.png')).body();
  const fallback = await (await request.get('/favicon.png')).body();
  expect(fallback.equals(png192)).toBe(true);
  expect(fallback.readUInt32BE(16)).toBe(192);
  expect(fallback.readUInt32BE(20)).toBe(192);
  const svg = await (await request.get('/landing/assets/favicon.svg')).text();
  expect(svg).toContain('>Q</text>');
  expect(svg).toContain('fill="#070a13"');
});
