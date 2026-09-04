/**
 * Contraste WCAG medido no navegador, compondo a opacidade dos ancestrais.
 *
 * Por que não usar só o axe: ele detecta isto de forma intermitente. Quando não
 * consegue determinar o fundo com certeza devolve "incomplete" em vez de
 * "violation", e o mesmo defeito apareceu em 2 de 3 execuções idênticas. Os
 * NÚMEROS, quando aparecem, são sempre os mesmos — o defeito é constante, só a
 * detecção oscila. Um contrato precisa de medida determinística.
 *
 * Função normal (não string com eval): é serializada pelo Playwright, então não
 * há camada de escape entre o que se lê aqui e o que roda no navegador.
 */
export type FalhaDeContraste = {
  sel: string;
  razao: number;
  exigido: number;
  px: number;
  peso: number;
  opacidade: number;
  cor: string;
  texto: string;
};

export function medirContraste(seletorRaiz: string): FalhaDeContraste[] {
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const numeros = (s: string) => {
    const out: number[] = [];
    let atual = '';
    for (const ch of String(s)) {
      if ((ch >= '0' && ch <= '9') || ch === '.') atual += ch;
      else { if (atual) out.push(Number(atual)); atual = ''; }
    }
    if (atual) out.push(Number(atual));
    return out;
  };
  /**
   * O navegador devolve DUAS escalas: "rgb(121, 145, 167)" em 0–255 e
   * "color(srgb 0.95 0.63 0.67)" em 0–1. Ler a segunda como se fosse a
   * primeira dá quase preto, e o instrumento acusa defeito onde não existe —
   * foi assim que "Treinar este tema" apareceu como ilegível sendo claro.
   */
  const canal = (s: string) => {
    const bruto = String(s);
    const n = numeros(bruto);
    if (n.length < 3 || !n.slice(0, 3).every((v) => isFinite(v))) return null;
    const escala = bruto.indexOf('color(') === 0 ? 255 : 1;
    return n.slice(0, 3).map((v) => v * escala);
  };
  const alfa = (s: string) => {
    const n = numeros(s);
    return n.length >= 4 ? n[3] : 1;
  };
  const sobre = (fg: number[], bg: number[], a: number) => fg.map((v, i) => a * v + (1 - a) * bg[i]);
  const razaoEntre = (a: number[], b: number[]) => {
    const l1 = lum(a);
    const l2 = lum(b);
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  };

  const PAGINA = canal(getComputedStyle(document.body).backgroundColor) || [14, 20, 31];

  /** As paradas de cor de um degradê, na ordem em que o CSS as declara. */
  const paradasDe = (imagem: string): number[][] => {
    const paradas: number[][] = [];
    const re = /rgba?\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(imagem))) {
      const c = canal('rgb(' + m[1] + ')');
      const a = alfa('rgba(' + m[1] + ')');
      if (c && a > 0.5) paradas.push(c);
    }
    return paradas;
  };

  /**
   * Fundos possíveis atrás do texto — plural de propósito.
   *
   * `backgroundColor` não enxerga `background-image`, então texto escuro sobre
   * degradê dourado media como escuro-sobre-escuro: foi assim que "Entrar no
   * NefroQuest" apareceu a 1,03:1 sendo perfeitamente legível. Ignorar o
   * gradiente tampouco serve — cegava a medição dentro de quase todo modal.
   *
   * A saída é avaliar contra TODAS as paradas do degradê e ficar com a mais
   * favorável ao texto. Se nem a melhor passa, a falha é certa em qualquer
   * ponto da faixa; e nenhum texto legível é acusado por causa da pior.
   *
   * Devolve vazio só quando há imagem de verdade (sem paradas de cor legíveis),
   * onde não medir é mais honesto que medir errado.
   */
  const fundosDe = (el: Element): number[][] => {
    const pilha: Array<[number[], number]> = [];
    let n: Element | null = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      const imagem = cs.backgroundImage;
      if (imagem && imagem !== 'none') {
        const candidatos = paradasDe(imagem);
        /* A cor de fundo do próprio elemento entra como mais um candidato
         * quando é opaca. Nem todo background-image cobre a caixa: o cartão da
         * pergunta desenha um filete de 1px no topo com
         * `linear-gradient(...) top / 100% 1px no-repeat`, sobre um fundo
         * quase preto. Lendo só as paradas do degradê, o enunciado — creme
         * sobre escuro, perfeitamente legível — media 2,06:1.
         *
         * Como o veredito usa o candidato MAIS FAVORÁVEL, somar a cor real do
         * cartão desfaz esse engano sem esconder defeito: só passa quando
         * alguma camada de fato existente atrás do texto passa. */
        const propria = canal(cs.backgroundColor);
        if (propria && alfa(cs.backgroundColor) >= 0.85) candidatos.push(propria);
        if (candidatos.length === 0) return [];
        // As camadas translúcidas já acumuladas continuam valendo por cima.
        return candidatos.map((candidato) => {
          let cor = candidato;
          for (let i = pilha.length - 1; i >= 0; i--) cor = sobre(pilha[i][0], cor, pilha[i][1]);
          return cor;
        });
      }
      const bg = cs.backgroundColor;
      const a = alfa(bg);
      const c = canal(bg);
      if (a > 0 && c) pilha.push([c, a]);
      if (a >= 0.999) break;
      n = n.parentElement;
    }
    let cor = PAGINA;
    for (let i = pilha.length - 1; i >= 0; i--) cor = sobre(pilha[i][0], cor, pilha[i][1]);
    return [cor];
  };

  /**
   * Opacidade acumulada. Cada ancestral com opacity < 1 mistura o elemento
   * INTEIRO com o que está atrás. Ignorar isso mede uma cor que ninguém vê.
   */
  const opacidadeAcumulada = (el: Element) => {
    let a = 1;
    let n: Element | null = el;
    while (n && n !== document.documentElement) {
      a *= parseFloat(getComputedStyle(n).opacity) || 0;
      n = n.parentElement;
    }
    return a;
  };

  const nomear = (el: Element) => {
    const bruto = typeof el.className === 'string' ? el.className : '';
    const cls = bruto.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };

  const raiz = document.querySelector(seletorRaiz);
  if (!raiz) return [];

  const achados: FalhaDeContraste[] = [];
  for (const el of Array.from(raiz.querySelectorAll('*'))) {
    const texto = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3 && (n.textContent || '').trim())
      .map((n) => (n.textContent || '').trim())
      .join(' ');
    if (!texto) continue;
    // Emoji e símbolos trazem a própria cor; `color` não os pinta. Medi-los
    // acusava "⚜️" e "🏰" como texto preto ilegível.
    if (!/[\p{L}\p{N}]/u.test(texto)) continue;

    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // Fora da viewport é painel fechado / gaveta recolhida, não defeito de cor.
    if (r.right < 0 || r.left > window.innerWidth) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    // Texto só para leitor de tela e decoração não são lidos com os olhos.
    if (el.closest('.nqd-sr-only, .sr-only, [aria-hidden="true"]')) continue;
    // Controle desabilitado é isento de contraste mínimo (WCAG 1.4.3): o
    // apagamento é justamente o que comunica que ele não responde agora. Sem
    // esta linha, o botão "Próxima" antes de responder aparecia como defeito.
    if (el.closest(':disabled, [aria-disabled="true"], .disabled')) continue;

    const opac = opacidadeAcumulada(el);
    if (opac < 0.05) continue;

    // Texto pintado com degradê (background-clip: text) não usa `color` para
    // nada — os glifos recebem o gradiente. Medir `color` aqui acusava o
    // título "NefroQuest" do modal de preços, que é dourado e bem visível.
    const recorteEmTexto = (cs as any).webkitBackgroundClip === 'text' || cs.backgroundClip === 'text';
    const preenchimento = (cs as any).webkitTextFillColor;
    if (recorteEmTexto && preenchimento && alfa(preenchimento) < 0.05) continue;

    const fg = canal(cs.color);
    if (!fg) continue;

    const fundos = fundosDe(el);
    if (fundos.length === 0) continue;
    const px = parseFloat(cs.fontSize);
    const peso = parseInt(cs.fontWeight, 10) || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const exigido = grande ? 3 : 4.5;
    // A parada mais favorável ao texto: acusar só quando nem a melhor passa.
    let razao = 0;
    for (const fundo of fundos) {
      const efetiva = sobre(sobre(fg, fundo, alfa(cs.color)), fundo, opac);
      razao = Math.max(razao, razaoEntre(efetiva, fundo));
    }

    if (razao + 0.005 < exigido) {
      achados.push({
        sel: nomear(el),
        razao: Math.round(razao * 100) / 100,
        exigido,
        px: Math.round(px * 10) / 10,
        peso,
        opacidade: Math.round(opac * 100) / 100,
        cor: cs.color,
        texto: texto.slice(0, 44),
      });
    }
  }
  return achados;
}
