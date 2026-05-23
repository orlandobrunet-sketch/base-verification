import sys

with open('style.css', 'r', encoding='utf-8', newline='') as f:
    src = f.read()
src = src.replace('\r\n', '\n')

MARKER = '/* ============================================================\n   LANDING LOGIN — DESKTOP REDESIGN v2 (min-width: 901px)'
cut = src.index(MARKER)
base = src[:cut]

NEW_BLOCK = r"""/* ============================================================
   LANDING LOGIN — DESKTOP REDESIGN v2 (min-width: 901px)
   CSS-only override — appended no fim de style.css.
   NÃO altera background, logo, JS, nem conteúdo médico.

   ESTRUTURA DO GRID (desktop):
     Col 1 — ornament | title | sub | tagline | stats-section (1fr)
     Col 2 — landingMsg | btn-google | btn-email | btn-guest | landing-divider (trust card)
   landing-divider repurposed como trust card no col 2 row 5.
   Sem posicionamento absoluto.
   ============================================================ */

@media (min-width: 901px) {

  /* 0 — Contêiner */
  #landingScreen {
    position: fixed;
    inset: 0;
    min-height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  /* 1 — Painel central: grid 2 colunas × 5 linhas */
  #landingScreen .landing-content {
    --nq-gold:     #eec752;
    --nq-gold-dim: #927026;
    --nq-blue:     #75a3ff;
    --nq-text:     #d5e2f2;
    --nq-muted:    #8294b2;

    position: relative;
    z-index: 2;

    width: min(1160px, calc(100vw - 140px));
    min-height: 660px;
    max-height: calc(100vh - 80px);
    max-width: unset;

    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    grid-template-rows: auto auto auto auto 1fr;
    column-gap: 68px;
    row-gap: 0;
    align-items: start;

    padding: 50px 52px 46px 52px;
    margin: 0;
    gap: unset;
    column-gap: 68px;

    background:
      linear-gradient(180deg, rgba(13,17,39,.97), rgba(8,11,28,.96)),
      radial-gradient(circle at 50% 0%, rgba(255,255,255,.055), transparent 42%);
    border: 1px solid rgba(238,199,82,.46);
    border-radius: 24px;
    box-shadow:
      0 28px 80px rgba(0,0,0,.55),
      inset 0 1px 0 rgba(255,255,255,.05),
      inset 0 0 70px rgba(124,58,237,.035);

    text-align: left;
    box-sizing: border-box;
  }

  /* Borda interna decorativa */
  #landingScreen .landing-content::before {
    content: "";
    display: block;
    position: absolute;
    inset: 10px;
    border: 1px solid rgba(146,112,38,.20);
    border-radius: 18px;
    pointer-events: none;
    z-index: 0;
  }

  /* Linha divisória vertical */
  #landingScreen .landing-content::after {
    content: "";
    position: absolute;
    top: 44px;
    bottom: 44px;
    left: 55%;
    width: 1px;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(238,199,82,.15) 10%,
      rgba(238,199,82,.22) 50%,
      rgba(238,199,82,.15) 90%,
      transparent
    );
    pointer-events: none;
    z-index: 0;
  }

  /* 2 — Coluna esquerda */
  #landingScreen .landing-ornament,
  #landingScreen .landing-title,
  #landingScreen .landing-sub,
  #landingScreen .landing-tagline,
  #landingScreen .landing-stats-section { grid-column: 1; }

  /* 3 — Coluna direita */
  #landingScreen #landingMsg,
  #landingScreen .landing-btn-google,
  #landingScreen .landing-btn-email,
  #landingScreen .landing-btn-guest,
  #landingScreen .landing-divider    { grid-column: 2; }

  /* Trust card ocupa a linha 5 da col direita */
  #landingScreen .landing-divider    { grid-row: 5; }

  /* 4 — Ornamento */
  #landingScreen .landing-ornament {
    margin: 0 0 10px 0;
    color: var(--nq-gold);
    font-family: 'Cinzel', serif;
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .4em;
    text-transform: uppercase;
    opacity: .9;
    text-align: left;
  }

  /* 5 — Título (logo preservada) */
  #landingScreen .landing-title {
    margin: 0;
    color: var(--nq-gold);
    font-family: 'Cinzel Decorative', 'Cinzel', serif;
    font-size: clamp(2.9rem, 3.9vw, 4.3rem);
    font-weight: 900;
    line-height: .92;
    letter-spacing: .06em;
    text-transform: uppercase;
    text-shadow:
      0 2px 0 rgba(60,42,8,.85),
      0 0 28px rgba(238,199,82,.18);
    text-align: left;
  }

  /* 6 — Sub */
  #landingScreen .landing-sub {
    position: static;
    width: auto;
    margin: 10px 0 14px 0;
    color: var(--nq-gold);
    font-family: 'Cinzel', serif;
    font-size: 1.05rem;
    font-weight: 500;
    letter-spacing: .55em;
    text-transform: uppercase;
    opacity: .8;
    text-align: left;
  }
  #landingScreen .landing-sub::before,
  #landingScreen .landing-sub::after { display: none; }

  /* 7 — Tagline */
  #landingScreen .landing-tagline {
    margin: 0 0 18px 0;
    color: var(--nq-text);
    font-family: 'Philosopher', serif;
    font-size: 1.05rem;
    line-height: 1.5;
    opacity: .88;
    text-align: left;
  }

  /* 8 — Stats section (col 1, row 5, 1fr) */
  #landingScreen .landing-stats-section {
    grid-row: 5;
    align-self: stretch;
    margin: 0; padding: 0; border: 0; background: transparent; width: 100%;
  }

  /* Linha decorativa acima das features */
  #landingScreen .landing-stats-section::before {
    content: "";
    display: block;
    width: 52%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(146,112,38,.6), transparent);
    margin-bottom: 18px;
  }

  /* 3 feature cards */
  #landingScreen .landing-features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
    margin-bottom: 14px;
  }
  #landingScreen .landing-feature-item {
    padding: 12px 11px;
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(17,22,48,.76), rgba(11,15,36,.72));
    display: flex;
    align-items: flex-start;
    gap: 8px;
    text-align: left;
  }
  #landingScreen .landing-feature-icon {
    flex: 0 0 24px;
    width: 24px; height: 24px;
    display: inline-grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(124,58,237,.16);
    box-shadow: 0 0 0 1px rgba(146,112,38,.22);
    font-size: .88rem;
    line-height: 1;
  }
  #landingScreen .landing-feature-title {
    color: var(--nq-gold);
    font-family: 'Cinzel', serif;
    font-size: .65rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  #landingScreen .landing-feature-desc { display: none; }

  /* Card questões */
  #landingScreen .landing-stats-divider { display: none; }
  #landingScreen .landing-question-count {
    text-align: center;
    padding: 18px 22px 20px;
    border: 1px solid rgba(146,112,38,.42);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(15,20,45,.82), rgba(9,13,33,.76));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
  }
  #landingScreen .landing-question-count::before {
    content: "CONHECIMENTO É SEU MAIOR PODER";
    display: block;
    margin-bottom: 10px;
    color: var(--nq-gold);
    font-family: 'Cinzel', serif;
    font-size: .76rem;
    font-weight: 800;
    letter-spacing: .2em;
    text-transform: uppercase;
  }
  #landingScreen .landing-question-big {
    color: var(--nq-gold);
    font-family: 'Cinzel', serif;
    font-size: 1.9rem;
    font-weight: 900;
    line-height: 1;
    text-shadow: 0 0 16px rgba(238,199,82,.14);
  }
  #landingScreen .landing-question-big sup { font-size: .85rem; vertical-align: super; }
  #landingScreen .landing-question-label {
    margin-top: 4px;
    color: var(--nq-gold);
    font-family: 'Cinzel', serif;
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .2em;
    text-transform: uppercase;
  }
  #landingScreen .landing-question-caption {
    margin-top: 5px;
    color: var(--nq-muted);
    font-family: 'Philosopher', serif;
    font-size: .83rem;
  }

  /* 9 — Heading / msg de erro (col 2, row 1) */
  #landingScreen #landingMsg {
    display: block;
    align-self: end;
    min-height: 20px;
    margin: 0 0 12px 0;
    color: #fca5a5;
    font-family: 'Philosopher', serif;
    font-size: .88rem;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    width: auto;
    text-align: center;
  }
  #landingScreen #landingMsg:empty::before {
    content: "✦ ACESSO À SUA JORNADA ✦";
    display: block;
    color: var(--nq-gold);
    font-family: 'Cinzel', serif;
    font-size: .76rem;
    font-weight: 600;
    letter-spacing: .32em;
    text-transform: uppercase;
    text-align: center;
  }
  #landingScreen #landingMsg:not(:empty) {
    background: rgba(251,113,133,.10);
    border: 1px solid rgba(251,113,133,.30);
    border-radius: 8px;
    padding: 8px 12px;
  }

  /* 10 — Botões */
  #landingScreen .landing-btn-google,
  #landingScreen .landing-btn-email,
  #landingScreen .landing-btn-guest {
    position: relative;
    width: 100%;
    height: 58px;
    min-height: 58px;
    padding: 0 18px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    font-family: 'Cinzel', serif;
    font-size: .9rem;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: none;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, filter .18s ease;
  }
  /* Micro-separador acima de Email e Guest */
  #landingScreen .landing-btn-email,
  #landingScreen .landing-btn-guest { margin-top: 18px; }
  #landingScreen .landing-btn-email::before,
  #landingScreen .landing-btn-guest::before {
    content: "◆";
    position: absolute;
    top: -13px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(146,112,38,.55);
    font-size: .42rem;
    line-height: 1;
  }
  #landingScreen .landing-btn-google {
    color: #17120b;
    border: 1px solid rgba(255,246,220,.9);
    background: linear-gradient(180deg, #f8f1d9 0%, #e6d9ad 100%);
    box-shadow: 0 10px 24px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.78);
    margin-top: 0;
  }
  #landingScreen .landing-btn-email {
    color: var(--nq-blue);
    border: 1px solid rgba(117,163,255,.58);
    background: linear-gradient(180deg, rgba(16,25,58,.92), rgba(9,14,35,.88));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  #landingScreen .landing-btn-guest {
    color: rgba(202,190,228,.68);
    border: 1px solid rgba(255,255,255,.09);
    background: linear-gradient(180deg, rgba(29,31,54,.72), rgba(17,19,36,.68));
    margin-bottom: 0;
  }
  #landingScreen .landing-btn-google:hover,
  #landingScreen .landing-btn-email:hover,
  #landingScreen .landing-btn-guest:hover { transform: translateY(-2px); filter: brightness(1.06); }
  #landingScreen .landing-btn-google:hover {
    box-shadow: 0 12px 28px rgba(0,0,0,.3), 0 0 16px rgba(238,199,82,.14);
  }
  #landingScreen .landing-btn-email:hover {
    border-color: rgba(117,163,255,.82);
    box-shadow: 0 0 16px rgba(74,158,255,.13);
  }
  #landingScreen .landing-btn-guest:hover {
    border-color: rgba(124,58,237,.36);
    box-shadow: 0 0 14px rgba(124,58,237,.11);
  }

  /* 11 — Trust card: landing-divider repurposed (col 2, row 5) */
  #landingScreen .landing-divider {
    align-self: start;
    margin-top: 18px;

    /* Reset as divisor */
    width: 100%;
    height: auto;

    /* Trust card layout */
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 20px 18px;
    border: 1px solid rgba(255,255,255,.10);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(15,20,45,.72), rgba(10,14,35,.68));
    box-sizing: border-box;
    background-clip: padding-box;
  }
  /* Ícone do cadeado */
  #landingScreen .landing-divider::before {
    content: "🔒";
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 50px;
    width: 50px;
    height: 60px;
    border: 1px solid rgba(238,199,82,.36);
    border-radius: 9px 9px 18px 18px;
    background: linear-gradient(180deg, rgba(41,45,76,.96), rgba(19,22,44,.96));
    font-size: 1.45rem;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
    flex-shrink: 0;
  }
  /* Texto do trust card */
  #landingScreen .landing-divider::after {
    content: "SEUS DADOS, SUA CONFIANÇA\A Não compartilhamos suas informações.\A Login seguro, experiência protegida.";
    white-space: pre-line;
    flex: 1;
    color: var(--nq-text);
    font-family: 'Philosopher', serif;
    font-size: .84rem;
    line-height: 1.55;
  }

  /* 12 — Profile button */
  #landingScreen .profile-btn {
    position: fixed !important;
    top: 22px !important;
    right: 28px !important;
    width: 44px; height: 44px;
    border: 1px solid rgba(238,199,82,.46);
    border-radius: 8px;
    background: rgba(11,15,34,.78);
    color: var(--gold, #eec752);
    box-shadow: 0 6px 18px rgba(0,0,0,.26);
    z-index: 100;
  }
}

/* Notebooks menores (901–1450px) */
@media (min-width: 901px) and (max-width: 1450px) {
  #landingScreen .landing-content {
    width: min(1060px, calc(100vw - 100px));
    min-height: 620px;
    padding: 44px 46px 40px;
    column-gap: 56px;
  }
  #landingScreen .landing-title {
    font-size: clamp(2.5rem, 3.6vw, 3.6rem);
  }
  #landingScreen .landing-feature-item { padding: 10px 9px; }
  #landingScreen .landing-feature-title { font-size: .62rem; }
}
"""

result = base + NEW_BLOCK
result_crlf = result.replace('\n', '\r\n')

with open('style.css', 'w', encoding='utf-8', newline='') as f:
    f.write(result_crlf)

print("OK — landing redesign v2 applied")
