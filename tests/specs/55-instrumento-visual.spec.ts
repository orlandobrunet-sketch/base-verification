import { test, expect, type Page } from '@playwright/test';
import { auditarVisual } from '../helpers/auditoria-visual';
import { medirContraste } from '../helpers/contraste';
import { medirGeometria } from '../helpers/geometria';

// Controles sintéticos: nenhuma rede, banco clínico ou servidor necessário.
async function medir(page: Page, html: string, css = '') {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#fff;color:#000;font:16px Arial}#raiz{padding:8px}${css}</style><main id="raiz">${html}</main>`);
  return page.evaluate(auditarVisual, '#raiz');
}

test('raiz ausente, ambígua, invisível ou vazia nunca aprova', async ({ page }) => {
  await page.setContent('<div class="duplicada"></div><div class="duplicada"></div><div id="oculta" hidden>Texto</div><div id="vazia"></div>');
  for (const seletor of ['#ausente', '.duplicada', '#oculta', '#vazia']) {
    expect((await page.evaluate(auditarVisual, seletor)).status).toBe('inconclusivo');
  }
});

test('helpers antigos também recusam raiz ausente', async ({ page }) => {
  await page.setContent('<div id="oculta" style="opacity:0">Texto invisível</div>');
  for (const helper of [medirContraste, medirGeometria]) {
    await expect(page.evaluate(helper, '#ausente')).rejects.toThrow(/raiz/i);
    await expect(page.evaluate(helper, '#oculta')).rejects.toThrow(/raiz/i);
  }
});

test('mede texto da própria raiz: controle positivo e negativo de contraste', async ({ page }) => {
  const passa = await medir(page, 'Texto diretamente na raiz');
  expect(passa.status).toBe('aprovado');
  expect(passa.medidos.contraste).toBe(1);
  const falha = await medir(page, 'Texto diretamente na raiz', '#raiz{color:#eee}');
  expect(falha.status).toBe('falhou');
  expect(falha.falhas.some(f => f.tipo === 'contraste-insuficiente')).toBe(true);
});

test('cor preta encoberta por degradê branco nunca oferece aprovação', async ({ page }) => {
  const r = await medir(page, 'Texto branco', '#raiz{color:white;background:black linear-gradient(white,white)}');
  expect(r.status).toBe('inconclusivo');
  expect(r.medidos.contraste).toBe(0);
  expect(r.inconclusivos.some(i => i.tipo === 'contraste-inconclusivo')).toBe(true);
});

test('filete de 1px não vira falso defeito e permanece inconclusivo', async ({ page }) => {
  const r = await medir(page, 'Texto legível abaixo do filete', '#raiz{padding-top:20px;color:white;background:black linear-gradient(white,white) top/100% 1px no-repeat}');
  expect(r.status).toBe('inconclusivo');
  expect(r.falhas).toEqual([]);
});

test('fundo sólido opaco bloqueia a imagem do ancestral', async ({ page }) => {
  const r = await medir(page, '<p style="background:black;color:white">Texto</p>', '#raiz{background:linear-gradient(white,black)}');
  expect(r.status).toBe('aprovado');
  expect(r.medidos.contraste).toBe(1);
});

test('transparência da cor compõe com fundo sólido; opacidade de grupo é inconclusiva', async ({ page }) => {
  expect((await medir(page, '<p style="color:rgba(0,0,0,.1)">Texto</p>')).status).toBe('falhou');
  expect((await medir(page, '<p style="opacity:.5">Texto</p>')).status).toBe('inconclusivo');
});

test('sRGB fracionário é medido; outros espaços de cor não são reinterpretados', async ({ page }) => {
  expect((await medir(page, '<p style="color:color(srgb 1 1 1);background:black">Texto</p>')).status).toBe('aprovado');
  expect((await medir(page, '<p style="color:oklch(60% .2 20)">Texto</p>')).status).toBe('inconclusivo');
});

test('texto pintado por degradê e pseudo-elemento exigem inspeção', async ({ page }) => {
  expect((await medir(page, '<p>Texto</p>', 'p{background:linear-gradient(red,blue);background-clip:text;color:transparent}')).status).toBe('inconclusivo');
  expect((await medir(page, '<p>Texto</p>', 'p::before{content:"";position:absolute;inset:0;background:white}')).status).toBe('inconclusivo');
});

test('camada irmã por baixo do texto impede aprovação por fundo ancestral encoberto', async ({ page }) => {
  const r = await medir(page, '<div class="capa"></div><p>Texto branco</p>', '#raiz{position:relative;background:black;color:white}.capa{position:absolute;inset:0;background:white}p{position:relative}');
  expect(r.status).toBe('inconclusivo');
  expect(r.medidos.contraste).toBe(0);
});

test('helper legado inclui o texto da própria raiz', async ({ page }) => {
  await medir(page, 'Texto de baixo contraste', '#raiz{color:#eee}');
  expect(await page.evaluate(medirContraste, '#raiz')).toHaveLength(1);
});

test('controle fixo totalmente abaixo da tela é detectado', async ({ page }) => {
  const r = await medir(page, '<button style="position:absolute;top:700px">Enviar</button>', '#raiz{position:fixed;inset:0}');
  expect(r.falhas.some(f => f.tipo === 'corte-vertical-na-viewport')).toBe(true);
});

test('conteúdo abaixo da dobra normal não é defeito de corte', async ({ page }) => {
  const r = await medir(page, '<p style="margin-top:700px">Texto abaixo da dobra</p>');
  expect(r.falhas).toEqual([]);
  expect(r.status).toBe('inconclusivo');
});

test('rolagem interna acessível resgata conteúdo de modal fixo', async ({ page }) => {
  const r = await medir(page, '<div style="height:900px"><button style="margin-top:700px">Enviar</button></div>', '#raiz{position:fixed;top:20px;height:300px;overflow:auto}');
  expect(r.falhas).toEqual([]);
  await page.locator('button').click(); // alcançável via rolagem de verdade
});

test('região rolável abaixo da dobra normal pode ser trazida à tela', async ({ page }) => {
  const r = await medir(page, '<div style="height:100px;overflow:auto;margin-top:700px"><div style="height:800px"><button style="margin-top:650px">Enviar</button></div></div>');
  expect(r.falhas).toEqual([]);
  await page.locator('button').click();
});

test('overflow hidden e clip detectam linhas truncadas na vertical', async ({ page }) => {
  for (const overflow of ['hidden', 'clip']) {
    const r = await medir(page, `<div style="height:18px;overflow:${overflow}">Primeira linha<br>Segunda linha</div>`);
    expect(r.falhas.some(f => f.tipo === 'conteudo-cortado')).toBe(true);
  }
});

test('rolagem externa não resgata texto cortado dentro de caixa hidden', async ({ page }) => {
  const r = await medir(page, '<div style="height:16px;overflow:hidden">Linha<br>Outra linha</div><div style="height:900px"></div>', '#raiz{height:200px;overflow:auto}');
  expect(r.falhas.some(f => f.tipo === 'conteudo-cortado')).toBe(true);
});

test('sobreposição usa linhas de texto; pai e filho inline não duplicam caixas', async ({ page }) => {
  const normal = await medir(page, '<p>Texto <strong>com destaque</strong> na mesma linha</p>');
  expect(normal.status).toBe('aprovado');
  const sobreposto = await medir(page, '<p id="um">Texto sobreposto</p><p id="dois">Outro texto</p>', 'p{position:absolute;left:20px;top:20px}');
  expect(sobreposto.status).toBe('inconclusivo');
  expect(sobreposto.inconclusivos.some(i => i.tipo === 'sobreposicao-de-texto')).toBe(true);
});

test('texto só para leitor de tela, decoração e controle desabilitado não viram falha de contraste', async ({ page }) => {
  const r = await medir(page, '<span class="sr-only">Leitor de tela</span><span aria-hidden="true">Decoração</span><button disabled style="color:#eee">Inativo</button>');
  expect(r.falhas).toEqual([]);
  expect(r.medidos.contraste).toBe(0);
  expect(r.ignorados).toBeGreaterThanOrEqual(3);
});

test('borda e barra de rolagem do textarea não cortam a própria caixa externa', async ({ page }) => {
  const r = await medir(page, '<textarea style="width:120px;height:50px;overflow:scroll;border:4px solid black"></textarea>');
  expect(r.falhas).toEqual([]);
});
