# NefroQuest — Visual Style Guide

## Identidade

**RPG medieval médico premium.** Sério, gamificado, não infantil. O visual comunica competência clínica e imersão épica ao mesmo tempo. Referência de tom: um livro de magia de medicina do século XV, não um app de quiz SaaS.

Elementos que definem a identidade:
- Fundo escuro profundo (azul-preto, não preto puro)
- Dourado como cor de destaque principal (não amarelo, não laranja)
- Tipografia serifada ornamental (Cinzel) como base
- Bordas e molduras com detalhe medieval
- Partículas e brilhos sutis — atmosfera, não poluição visual

---

## Paleta

### Cores de fundo

| Variável | Hex | Uso |
|----------|-----|-----|
| `--bg-deep` | `#060810` | Fundo mais escuro — base da tela |
| `--bg-surface` | `#0d1225` | Superfícies e cards |
| `--bg-panel` | `#0f1830` | Painéis laterais |

### Cores de destaque

| Variável | Hex | Uso |
|----------|-----|-----|
| `--gold-bright` | `#f0c040` | Títulos, ornamentos, bordas principais |
| `--gold-dim` | `#a07820` | Bordas secundárias, detalhes |
| `--purple-vivid` | `#7c3aed` | Acentos: streak, XP bar, brilhos |
| `--purple-dim` | `#3d1d6e` | Backgrounds de acentos roxos |
| `--blue-crystal` | `#4a9eff` | Diamantes, highlights, links |
| `--red-hp` | `#cc2222` | Vida, erros, alertas críticos |
| `--parchment` | `#e8d9a0` | Texto em cards pergaminho |

### Texto

| Variável | Hex | Uso |
|----------|-----|-----|
| `--txt-primary` | `#d0e4f8` | Texto principal |
| `--txt-secondary` | `#7090b0` | Texto secundário, labels |
| `--txt-dim` | `#7e9ec8` | Texto desabilitado, hints |

---

## Tipografia

| Fonte | Uso | Estilo |
|-------|-----|--------|
| Cinzel Decorative | Títulos grandes (NefroQuest, títulos de tela) | Todas maiúsculas, dourado |
| Cinzel | Títulos de modal, labels de UI, ornamentos | Capitalizado ou caps, dourado |
| Philosopher | Corpo de jogo: texto de questões, descrições, explicações | Normal, legível |
| Cinzel Bold | Números de HUD: pontos, nível, contadores | Negrito, alinhado |

Não usar fontes fora dessas quatro. Não usar fontes do sistema como fallback primário em elementos visíveis.

---

## O que não fazer

- Visual SaaS genérico: cards brancos com sombra cinza, botões azuis planos
- Bootstrap padrão ou Material Design sem customização profunda
- Dashboard corporativo: tabelas com zebra cinza, cabeçalhos azul-escuro padrão
- Gradientes de cor sólida para fundo (ex: azul → roxo genérico)
- Ícones emoji como elemento visual principal em componentes de destaque
- Bordas `border-radius: 4px` sem ornamento em elementos RPG
- Texto branco puro `#ffffff` — usar `--txt-primary` (`#d0e4f8`)
- Fundo preto puro `#000000` — usar `--bg-deep` (`#060810`)

---

## Bordas Ornamentais (CSS-first)

Molduras medievais sem depender de imagens externas. Padrão:

```css
.frame-gold {
  border: 2px solid rgba(209, 157, 76, 0.9);
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(255, 215, 130, 0.2) inset,
    0 22px 60px rgba(0, 0, 0, 0.72);
}

/* Borda interna decorativa */
.frame-gold::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(255, 215, 130, 0.35);
  border-radius: 10px;
  pointer-events: none;
}
```

Para painéis escuros:
```css
.frame-dark {
  border: 1px solid rgba(42, 74, 122, 0.6);
  background: rgba(2, 8, 30, 0.88);
  border-radius: 12px;
}
```

---

## PNG com Transparência

Quando usar PNG com transparência (logo, ícones, molduras decorativas):
- Transparência real: canal alpha correto no arquivo, sem fundo sólido nem quadriculado falso
- Verificar em fundo escuro (`#060810`) antes de usar — não só em fundo branco
- Para molduras decorativas: o interior deve ser totalmente transparente para que o fundo do app apareça
- Nunca simular transparência com cor de fundo que "combina" — use alpha real

---

## Layout Desktop

Aproveitar o espaço horizontal. Padrões:
- **Game screen:** 3 colunas — painel de personagem (esquerda) / questão (centro) / action dock (direita)
- **Landing:** card centralizado com max-width, colunas do hall visíveis nas laterais
- **Modais:** max-width entre 560px e 800px, centralizados, fundo com overlay semitransparente
- **Welcome screen:** conteúdo centralizado, hall visível nas laterais

Não colapsar tudo em coluna única no desktop. O espaço lateral é parte do visual.

---

## Layout Mobile

- Manter excelência visual atual — não degradar para "versão simplificada"
- Touch targets mínimos: 44px de altura para botões e itens de menu
- Scroll vertical natural dentro de telas — sem scroll horizontal
- Fontes com `clamp()` para escalar entre mobile e desktop
- Partículas e elementos decorativos mantidos, mas com menor intensidade se necessário para performance

---

## Telas de Referência (mockups aprovados)

| Tela | Elementos chave |
|------|----------------|
| Landing/Login | Card com moldura dourada, logo Cinzel Decorative, botões Google + Email + Guest, lista de features no footer, hall medieval ao fundo |
| Welcome/Menu | Conteúdo centralizado, título com ornamento "✦ Reino dos Néfrons ✦", stats do jogador, botões de jogo |
| Game screen (desktop) | 3 colunas: portrait + stats / questão com opções A–E / action dock vertical |
| Dificuldade | Modal com grid 2×2, 4 cards com corações indicando dificuldade, borda dourada no selecionado |
| Modos de Jogo | Lista vertical com ícone octagonal, título e descrição por modo, "Ponto Fraco" em destaque vermelho |

---

## Imagem de Fundo

`assets/bg-hall.jpg` — hall medieval azul com colunas. Aplicada em `#landingScreen` e `#welcomeScreen`. Regras:
- `filter: brightness(0.72) saturate(1.15)` no `.bg-layer` para o jogo principal
- Overlay uniforme `rgba(4, 6, 18, 0.48)` nas telas de login/menu para legibilidade
- Não usar gradiente radial como overlay — cria banding visível
- Hall deve ser visível nas laterais em desktop, não completamente coberto
