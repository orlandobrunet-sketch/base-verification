export type AchadoVisual = {
  tipo: string;
  seletor: string;
  texto: string;
  detalhe: string;
};
export type AuditoriaVisual = {
  status: 'aprovado' | 'falhou' | 'inconclusivo';
  falhas: AchadoVisual[];
  inconclusivos: AchadoVisual[];
  medidos: { geometria: number; contraste: number };
  ignorados: number;
};

/**
 * Triagem conservadora, serializável com page.evaluate(auditarVisual, seletor).
 * "Aprovado" vale apenas para as medidas implementadas, não para WCAG inteira.
 * Não rasteriza imagens/degradês nem mede o contorno dos glifos.
 */
export function auditarVisual(seletor: string): AuditoriaVisual {
  const resultado: AuditoriaVisual = {
    status: 'inconclusivo', falhas: [], inconclusivos: [],
    medidos: { geometria: 0, contraste: 0 }, ignorados: 0,
  };
  const nome = (el: Element) => el.id ? `#${el.id}` : el.tagName.toLowerCase() +
    [...el.classList].slice(0, 2).map(c => '.' + c).join('');
  const registrar = (lista: AchadoVisual[], el: Element, tipo: string, detalhe: string) => {
    lista.push({ tipo, seletor: nome(el), texto: (el.textContent || '').trim().slice(0, 80), detalhe });
  };
  const raizes = document.querySelectorAll(seletor);
  if (raizes.length !== 1) {
    resultado.inconclusivos.push({ tipo: 'raiz-invalida', seletor, texto: '', detalhe: `Esperada uma raiz; encontradas ${raizes.length}.` });
    return resultado;
  }
  const raiz = raizes[0];
  const visivel = (el: Element) => {
    if (!el.getClientRects().length) return false;
    for (let n: Element | null = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0) return false;
    }
    return true;
  };
  if (!visivel(raiz)) {
    registrar(resultado.inconclusivos, raiz, 'raiz-invisivel', 'A raiz precisa estar aberta e visível antes de medir.');
    return resultado;
  }
  const largura = window.innerWidth, altura = window.innerHeight;
  const intersecao = (a: DOMRect, b: DOMRect) =>
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const recorta = (s: string) => /^(hidden|clip|auto|scroll)$/.test(s);
  const rola = (el: Element, eixo: 'x' | 'y') => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    let emPainelFixo = false;
    for (let n: Element | null = el; n; n = n.parentElement) {
      if (getComputedStyle(n).position === 'fixed') { emPainelFixo = true; break; }
    }
    return eixo === 'y'
      ? /^(auto|scroll)$/.test(s.overflowY) && el.scrollHeight > el.clientHeight && (!emPainelFixo || (r.top >= 0 && r.bottom <= altura + 1))
      : /^(auto|scroll)$/.test(s.overflowX) && el.scrollWidth > el.clientWidth && (!emPainelFixo || (r.left >= 0 && r.right <= largura + 1));
  };
  const textos: Array<{ el: Element; caixas: DOMRect[] }> = [];
  const cores = (valor: string): number[] | null => {
    // Outros espaços de cor ficam explícitos, sem tratá-los como sRGB.
    const rgb = valor.match(/^rgba?\(([^)]+)\)$/);
    const srgb = valor.match(/^color\(srgb\s+([^)]+)\)$/);
    if (!rgb && !srgb) return null;
    const numeros = (rgb || srgb)![1].match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number);
    if (!numeros || numeros.length < 3 || valor.includes('%')) return null;
    return [...numeros.slice(0, 3).map(v => srgb ? v * 255 : v), numeros[3] ?? 1];
  };
  const sobre = (a: number[], b: number[]) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]));
  const lum = (c: number[]) => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);

  for (const el of [raiz, ...raiz.querySelectorAll('*')]) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!visivel(el) || el.closest('.sr-only, .nqd-sr-only, [aria-hidden="true"]') ||
      (r.width <= 2 && r.height <= 2 && cs.position === 'absolute' && (cs.clip !== 'auto' || cs.clipPath !== 'none'))) {
      resultado.ignorados++; continue;
    }
    const nos = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && /[\p{L}\p{N}]/u.test(n.textContent || ''));
    const controle = el.matches('button, a[href], input, select, textarea, [role="button"], [data-action]');
    if (!nos.length && !controle) continue;
    resultado.medidos.geometria++;
    const caixas = nos.flatMap(n => {
      const range = document.createRange();
      const text = n.textContent || '';
      range.setStart(n, text.length - text.trimStart().length);
      range.setEnd(n, text.trimEnd().length);
      return [...range.getClientRects()].filter(b => b.width > 0 && b.height > 0);
    });
    const medidas = controle ? [r, ...caixas] : caixas;
    let rolagemX = false, rolagemY = false, fixo = cs.position === 'fixed';
    let cortado = false, textoNaViewport = true;
    // Uma rolagem precisa estar entre o texto e a fronteira que o corta.
    // A rolagem do documento não resgata conteúdo de um painel fixed.
    for (let n: Element | null = el; n; n = n.parentElement) {
      const s = getComputedStyle(n), b = n.getBoundingClientRect();
      rolagemX ||= rola(n, 'x'); rolagemY ||= rola(n, 'y');
      // A caixa externa de um controle não é conteúdo cortado por ele mesmo.
      const locais = n === el ? caixas : medidas;
      const foraX = locais.some(t => t.left < b.left + n.clientLeft - 1 || t.right > b.left + n.clientLeft + n.clientWidth + 1);
      const foraY = locais.some(t => t.top < b.top + n.clientTop - 1 || t.bottom > b.top + n.clientTop + n.clientHeight + 1);
      if ((recorta(s.overflowX) && foraX) || (recorta(s.overflowY) && foraY)) textoNaViewport = false;
      if ((recorta(s.overflowX) && foraX && !rolagemX && cs.textOverflow !== 'ellipsis') ||
          (recorta(s.overflowY) && foraY && !rolagemY)) {
        if (!cortado) registrar(resultado.falhas, el, 'conteudo-cortado', `Conteúdo fora da área visível de ${nome(n)}, sem rolagem acessível nesse eixo.`);
        cortado = true;
      }
      if (s.position === 'fixed') { fixo = true; break; }
    }
    if (fixo && medidas.some(t => t.top < -1 || t.bottom > altura + 1) && !rolagemY) {
      registrar(resultado.falhas, el, 'corte-vertical-na-viewport', `Conteúdo fixo ultrapassa a altura ${altura}px sem região de rolagem acessível.`);
    }
    if (medidas.some(t => t.left < -1 || t.right > largura + 1) && !rolagemX) {
      registrar(resultado.falhas, el, 'transbordamento-horizontal', `Conteúdo ultrapassa a largura ${largura}px sem região de rolagem acessível.`);
    }
    // Fora da dobra normal é alcançável por rolagem: não é falha vertical.
    const naTela = caixas.filter(b => b.left >= 0 && b.right <= largura && b.top >= 0 && b.bottom <= altura);
    if (!nos.length) continue;
    if (!textoNaViewport || !naTela.length) {
      registrar(resultado.inconclusivos, el, 'texto-fora-do-recorte', 'Role até o texto e meça novamente para avaliar contraste e sobreposição.');
      continue;
    }
    textos.push({ el, caixas: naTela });
    if (el.closest(':disabled, [aria-disabled="true"]')) { resultado.ignorados++; continue; }
    let motivo = '';
    // Irmãos podem pintar entre o texto transparente e seus ancestrais.
    // A lista de ancestrais sozinha não representa essas camadas.
    for (const caixa of naTela) {
      const pilha = document.elementsFromPoint((caixa.left + caixa.right) / 2, (caixa.top + caixa.bottom) / 2);
      if (pilha.some(n => n !== el && !n.contains(el) && !el.contains(n))) {
        motivo = 'Outra camada intersecta o texto; verificar composição e oclusão.';
      }
    }
    const camadas: number[][] = [];
    let fundoEncontrado = false;
    for (let n: Element | null = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (Number(s.opacity) !== 1 || s.filter !== 'none' || s.mixBlendMode !== 'normal' || s.clipPath !== 'none' ||
          (s.backdropFilter && s.backdropFilter !== 'none')) motivo ||= 'Composição com opacidade, filtro, mistura ou recorte exige inspeção visual.';
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(n, pseudo);
        if (ps.content !== 'none' && ps.content !== 'normal' && ps.display !== 'none') motivo ||= 'Pseudo-elemento pode pintar sobre o fundo/texto.';
      }
      if (!fundoEncontrado) {
        if (s.backgroundImage !== 'none') motivo ||= 'Imagem ou degradê: as cores de fundo ocultas não comprovam contraste.';
        const cor = cores(s.backgroundColor);
        if (!cor) motivo ||= 'Espaço de cor não suportado.';
        else { camadas.push(cor); if (cor[3] === 1) fundoEncontrado = true; }
      }
    }
    const fg = cores(cs.color);
    const fill = (cs as CSSStyleDeclaration & { webkitTextFillColor?: string }).webkitTextFillColor;
    if (!fg || (fill && fill !== cs.color) || cs.backgroundClip === 'text' || cs.textShadow !== 'none') motivo ||= 'Pintura do texto não é uma cor sRGB simples.';
    if (motivo) { registrar(resultado.inconclusivos, el, 'contraste-inconclusivo', motivo); continue; }
    let fundo = [255, 255, 255]; // Canvas padrão do navegador, sem tema forçado.
    if (matchMedia('(forced-colors: active)').matches) {
      registrar(resultado.inconclusivos, el, 'cores-forcadas', 'Tema do sistema exige inspeção própria.'); continue;
    }
    for (let i = camadas.length - 1; i >= 0; i--) fundo = sobre(camadas[i], fundo);
    const efetiva = sobre(fg!, fundo), a = lum(efetiva), b = lum(fundo);
    const razao = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    const px = parseFloat(cs.fontSize), peso = parseInt(cs.fontWeight, 10);
    const exigido = px >= 24 || (px >= 18.66 && peso >= 700) ? 3 : 4.5;
    resultado.medidos.contraste++;
    if (razao < exigido) registrar(resultado.falhas, el, 'contraste-insuficiente', `${razao.toFixed(2)}:1; mínimo ${exigido}:1.`);
  }
  // Range mede linhas de texto, evitando confundir caixas de pai e filho.
  // Interseção de linhas é suspeita, não prova colisão dos pixels dos glifos.
  for (let i = 0; i < textos.length; i++) for (let j = i + 1; j < textos.length; j++) {
    const a = textos[i], b = textos[j];
    if (a.caixas.some(x => b.caixas.some(y => intersecao(x, y)))) {
      registrar(resultado.inconclusivos, a.el, 'sobreposicao-de-texto', `Retângulos de texto intersectam ${nome(b.el)}; conferir pixels e intenção visual.`);
    }
  }
  if (!resultado.medidos.geometria) registrar(resultado.inconclusivos, raiz, 'sem-conteudo-mensuravel', 'Nenhum texto ou controle visual mensurável.');
  resultado.status = resultado.falhas.length ? 'falhou' : resultado.inconclusivos.length ? 'inconclusivo' : 'aprovado';
  return resultado;
}
