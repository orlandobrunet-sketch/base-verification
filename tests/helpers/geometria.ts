/**
 * Defeitos de geometria que se pode afirmar por medida, não por olhar.
 *
 * Capturas `fullPage` já me enganaram três vezes nesta varredura (área morta
 * no rodapé, caixas cinzas que eram esqueletos de carregamento, e um rótulo
 * "cortado" que medido estava inteiro). Aqui não há imagem: só retângulos.
 */
export type FalhaDeGeometria = {
  tipo: 'transborda-a-tela' | 'texto-cortado' | 'alvo-pequeno' | 'sobreposicao-de-texto';
  sel: string;
  detalhe: string;
  texto: string;
};

export function medirGeometria(seletorRaiz: string): FalhaDeGeometria[] {
  const raiz = document.querySelector(seletorRaiz);
  if (!raiz) return [];

  const nomear = (el: Element) => {
    const bruto = typeof el.className === 'string' ? el.className : '';
    const cls = bruto.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };

  const visivel = (el: Element) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    let n: Element | null = el;
    while (n && n !== document.documentElement) {
      if (parseFloat(getComputedStyle(n).opacity) < 0.05) return false;
      n = n.parentElement;
    }
    return true;
  };

  /** Ancestral que oferece rolagem — transbordar dentro dele é intencional. */
  const rolaEmAlgumAncestral = (el: Element, eixo: 'x' | 'y') => {
    let n: Element | null = el.parentElement;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      const valor = eixo === 'x' ? cs.overflowX : cs.overflowY;
      if (valor === 'auto' || valor === 'scroll') return true;
      n = n.parentElement;
    }
    return false;
  };

  const largura = window.innerWidth;
  const achados: FalhaDeGeometria[] = [];

  for (const el of Array.from(raiz.querySelectorAll('*'))) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (!visivel(el)) continue;
    // Texto só para leitor de tela é 1x1 de propósito.
    if (el.closest('.nqd-sr-only, .sr-only, [aria-hidden="true"]')) continue;
    // O mesmo idioma sem a classe: 1x1 recortado. É assim que "Equipamentos"
    // fica escondido no layout de combate — deliberado, não corte acidental.
    if (r.width <= 2 && r.height <= 2) {
      const c = getComputedStyle(el);
      if (c.position === 'absolute' && (c.clipPath !== 'none' || c.clip !== 'auto')) continue;
    }

    // Inteiramente fora da tela é gaveta recolhida / painel fechado, não corte.
    // Sem esta linha, um painel off-canvas rendia trinta "defeitos" de uma vez.
    if (r.right <= 0 || r.left >= largura) continue;

    const cs = getComputedStyle(el);
    const texto = (el.textContent || '').trim().slice(0, 40);

    // Sai da tela pela horizontal sem que nada ofereça rolagem.
    if ((r.right > largura + 1 || r.left < -1) && !rolaEmAlgumAncestral(el, 'x')) {
      achados.push({
        tipo: 'transborda-a-tela', sel: nomear(el),
        detalhe: `esquerda=${Math.round(r.left)} direita=${Math.round(r.right)} tela=${largura}`,
        texto,
      });
    }

    // Conteúdo maior que a caixa, sem rolagem e sem reticências: some sem aviso.
    const temTextoProprio = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && (n.textContent || '').trim(),
    );
    if (
      temTextoProprio &&
      el.scrollWidth > el.clientWidth + 2 &&
      cs.overflowX === 'hidden' &&
      cs.textOverflow !== 'ellipsis'
    ) {
      achados.push({
        tipo: 'texto-cortado', sel: nomear(el),
        detalhe: `conteudo=${el.scrollWidth} caixa=${el.clientWidth}`,
        texto,
      });
    }

    // Alvo de toque pequeno demais para o dedo.
    if (el.matches('button, a[href], [role="button"], input[type="checkbox"], input[type="radio"]')) {
      if (r.height < 24 || r.width < 24) {
        achados.push({
          tipo: 'alvo-pequeno', sel: nomear(el),
          detalhe: `${Math.round(r.width)}x${Math.round(r.height)}`,
          texto,
        });
      }
    }
  }
  return achados;
}
