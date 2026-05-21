// NefroQuest — Dashboard 2 (Beta) · "O Painel Clínico do Reino" (Opção 3)
// Desenvolvido em paralelo sem afetar o dashboard original.

(function () {
  // ── Estilos Isolados da Opção 3 ───────────────────────────────────────────
  function _injectV2Styles() {
    if (document.getElementById('nq-dash-v2-styles')) return;
    const s = document.createElement('style');
    s.id = 'nq-dash-v2-styles';
    s.textContent = `
      /* ── Overlay Principal ────────────────────────────────────────────────── */
      .nqd2-overlay {
        position: fixed;
        inset: 0;
        background: rgba(4, 7, 18, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        z-index: 11000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
        overflow-y: auto;
      }

      /* ── Painel de Duas Colunas ───────────────────────────────────────────── */
      .nqd2-panel {
        position: relative;
        width: 100%;
        max-width: 1040px;
        max-height: 93vh;
        background: rgba(13, 19, 39, 0.72);
        border: 1.5px solid rgba(240, 192, 64, 0.28);
        border-radius: 24px;
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.03) inset,
          0 30px 60px rgba(0,0,0,0.85),
          0 0 40px rgba(240, 192, 64, 0.08),
          0 0 80px rgba(139, 92, 246, 0.06);
        display: grid;
        grid-template-columns: 310px 1fr;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
      }

      /* Ornamento decorativo superior (pseudo-elemento) */
      .nqd2-panel::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, rgba(240, 192, 64, 0.6) 20%, rgba(240, 192, 64, 0.8) 50%, rgba(240, 192, 64, 0.6) 80%, transparent);
        border-radius: 24px 24px 0 0;
        pointer-events: none;
        z-index: 2;
      }

      /* ── Coluna Esquerda: Relicário do Nefrologista (Status & Radar) ───────── */
      .nqd2-sidebar {
        background: rgba(9, 13, 26, 0.85);
        border-right: 1.5px solid rgba(240, 192, 64, 0.18);
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow-y: auto;
        box-sizing: border-box;
      }

      /* Card do Herói */
      .nqd2-hero-card {
        text-align: center;
        background: linear-gradient(135deg, rgba(240, 192, 64, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%);
        border: 1px solid rgba(240, 192, 64, 0.22);
        border-radius: 16px;
        padding: 18px 14px;
        position: relative;
        overflow: hidden;
      }
      .nqd2-hero-card::after {
        content: '⚜';
        position: absolute;
        bottom: -15px;
        right: -10px;
        font-size: 5rem;
        color: rgba(240, 192, 64, 0.03);
        pointer-events: none;
      }
      .nqd2-hero-avatar {
        width: 92px;
        height: 92px;
        border-radius: 50%;
        border: 2.5px solid #ffbf00;
        object-fit: cover;
        box-shadow: 0 0 20px rgba(240, 192, 64, 0.25);
        margin: 0 auto 12px;
        display: block;
      }
      .nqd2-hero-avatar-ph {
        width: 92px;
        height: 92px;
        border-radius: 50%;
        border: 2px solid rgba(240, 192, 64, 0.3);
        background: linear-gradient(135deg, #16223f, #0b1122);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        margin: 0 auto 12px;
        box-shadow: 0 0 15px rgba(240, 192, 64, 0.15);
      }
      .nqd2-hero-name {
        font-family: 'Cinzel', serif;
        font-size: 1.15rem;
        color: #ffbf00;
        font-weight: 700;
        margin-bottom: 4px;
        text-shadow: 0 0 10px rgba(240, 192, 64, 0.25);
        letter-spacing: 0.5px;
      }
      .nqd2-hero-title {
        font-size: 0.76rem;
        color: #8892b0;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }
      .nqd2-hero-pills {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px;
      }
      .nqd2-hpill {
        font-size: 0.72rem;
        color: #e2e8f0;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 3px 9px;
        font-weight: 500;
      }
      .nqd2-hpill em {
        color: #ffbf00;
        font-style: normal;
        font-weight: 700;
        margin-right: 4px;
      }

      /* Selos de Aprovação Científica */
      .nqd2-seals-title {
        font-family: 'Cinzel', serif;
        font-size: 0.72rem;
        color: rgba(240, 192, 64, 0.85);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        text-align: center;
        margin-bottom: 2px;
      }
      .nqd2-seals-grid {
        display: flex;
        justify-content: space-around;
        gap: 8px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(240, 192, 64, 0.12);
        border-radius: 16px;
        padding: 14px 10px;
      }
      .nqd2-seal {
        position: relative;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: radial-gradient(circle, #5a4100 0%, #201500 100%);
        border: 2px solid rgba(240, 192, 64, 0.3);
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .nqd2-seal.unlocked {
        background: radial-gradient(circle, #ffe366 0%, #b8860b 100%);
        border-color: #ffd700;
        box-shadow: 0 0 15px rgba(240, 192, 64, 0.45), inset 0 0 8px rgba(255,255,255,0.4);
      }
      .nqd2-seal.unlocked:hover {
        transform: scale(1.15) rotate(5deg);
        box-shadow: 0 0 25px rgba(240, 192, 64, 0.75), inset 0 0 12px rgba(255,255,255,0.6);
      }
      .nqd2-seal.locked {
        opacity: 0.32;
        filter: grayscale(1) brightness(0.65);
      }
      .nqd2-seal-icon {
        font-size: 1.55rem;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
      }
      .nqd2-seal-tooltip {
        position: absolute;
        bottom: calc(100% + 12px);
        left: 50%;
        transform: translateX(-50%) scale(0.9);
        background: #090e1c;
        border: 1px solid #ffbf00;
        color: #e2e8f0;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.68rem;
        width: 170px;
        text-align: center;
        pointer-events: none;
        opacity: 0;
        transition: all 0.2s ease;
        z-index: 1000;
        box-shadow: 0 8px 24px rgba(0,0,0,0.7);
        font-family: 'Inter', sans-serif;
        line-height: 1.4;
      }
      .nqd2-seal-tooltip::after {
        content: '';
        position: absolute;
        top: 100%; left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #ffbf00;
      }
      .nqd2-seal:hover .nqd2-seal-tooltip {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }

      /* ── Coluna Direita: Grimório de Informações ─────────────────────────── */
      .nqd2-content {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Header e Abas */
      .nqd2-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 26px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: linear-gradient(90deg, rgba(240, 192, 64, 0.03) 0%, rgba(139, 92, 246, 0.02) 50%, transparent 100%);
        flex-shrink: 0;
      }
      .nqd2-title {
        font-family: 'Cinzel Decorative', 'Cinzel', serif;
        font-size: 0.98rem;
        color: #ffbf00;
        letter-spacing: 2.8px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 12px;
        text-shadow: 0 0 15px rgba(240, 192, 64, 0.35);
      }
      .nqd2-title-icon {
        font-size: 1.25rem;
        filter: drop-shadow(0 0 8px rgba(240, 192, 64, 0.6));
      }
      .nqd2-close-btn {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        color: #a0aec0;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 1.3rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
        line-height: 1;
      }
      .nqd2-close-btn:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.4);
        color: #f87171;
        transform: rotate(90deg);
      }

      /* Barra de Abas */
      .nqd2-tabs {
        display: flex;
        gap: 4px;
        padding: 10px 26px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0,0,0,0.1);
        flex-shrink: 0;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .nqd2-tabs::-webkit-scrollbar { display: none; }
      .nqd2-tab {
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        color: #718096;
        font-family: 'Cinzel', serif;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 10px 20px 11px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .nqd2-tab:hover {
        color: #e2e8f0;
      }
      .nqd2-tab.active {
        color: #ffbf00;
        border-bottom-color: #ffbf00;
        text-shadow: 0 0 12px rgba(240, 192, 64, 0.35);
      }

      /* Corpo com Scroll */
      .nqd2-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px 26px 30px;
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: rgba(240,192,64,0.2) transparent;
      }
      .nqd2-body::-webkit-scrollbar { width: 5px; }
      .nqd2-body::-webkit-scrollbar-track { background: transparent; }
      .nqd2-body::-webkit-scrollbar-thumb {
        background: rgba(240, 192, 64, 0.22);
        border-radius: 3px;
      }
      .nqd2-pane { display: none; }
      .nqd2-pane.active { display: block; }

      /* Títulos de Seção */
      .nqd2-stitle {
        font-family: 'Cinzel', serif;
        font-size: 0.72rem;
        color: #ffbf00;
        text-transform: uppercase;
        letter-spacing: 1.8px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 700;
      }
      .nqd2-stitle::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, rgba(240, 192, 64, 0.28), transparent);
      }

      /* ── KPI Grid ───────────────────────────────────────────────────────── */
      .nqd2-kpis {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }
      .nqd2-kpi {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 16px 12px 14px;
        text-align: center;
        transition: all 0.2s;
        cursor: default;
      }
      .nqd2-kpi:hover {
        background: rgba(255, 255, 255, 0.035);
        border-color: rgba(240, 192, 64, 0.2);
        transform: translateY(-2px);
      }
      .nqd2-kpi-icon {
        font-size: 1.4rem;
        margin-bottom: 6px;
        line-height: 1;
      }
      .nqd2-kpi-val {
        font-size: 1.4rem;
        font-weight: 700;
        font-family: 'Cinzel', serif;
        color: #ffbf00;
        margin-bottom: 5px;
        line-height: 1.1;
      }
      .nqd2-kpi-lbl {
        font-size: 0.62rem;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }

      /* Gráfico de Evolução */
      .nqd2-chart-container {
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(240, 192, 64, 0.12);
        border-radius: 16px;
        padding: 16px 20px 10px;
        margin-bottom: 24px;
      }

      /* Progresso das Conquistas */
      .nqd2-prog-bar-container {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .nqd2-prog-bar {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 4px;
        overflow: hidden;
      }
      .nqd2-prog-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1);
      }
      .nqd2-prog-lbl {
        font-size: 0.76rem;
        color: #ffbf00;
        font-family: 'Cinzel', serif;
        font-weight: 700;
        white-space: nowrap;
        min-width: 32px;
        text-align: right;
      }

      /* ── Radar Chart (Skills Tab) ───────────────────────────────────────── */
      .nqd2-radar-card {
        display: flex;
        justify-content: center;
        margin-bottom: 22px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(139, 92, 246, 0.22);
        border-radius: 20px;
        box-shadow: inset 0 0 15px rgba(0,0,0,0.4);
      }
      .nqd2-radar-card canvas { max-width: 310px; width: 100%; }

      /* Alerta de Ponto Fraco (Bounty Real) */
      .nqd2-bounty-card {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(20, 10, 10, 0.4) 100%);
        border: 1.5px dashed rgba(239, 68, 68, 0.45);
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 24px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.05);
      }
      .nqd2-bounty-card:hover {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(20, 10, 10, 0.5) 100%);
        border-color: rgba(239, 68, 68, 0.65);
        transform: translateY(-1.5px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.12);
      }
      .nqd2-bounty-header {
        font-family: 'Cinzel', serif;
        font-size: 0.74rem;
        color: #ef4444;
        font-weight: 700;
        letter-spacing: 1.5px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nqd2-bounty-body {
        font-size: 0.8rem;
        color: #cbd5e1;
        line-height: 1.55;
        margin-bottom: 12px;
      }
      .nqd2-bounty-action {
        font-family: 'Cinzel', serif;
        font-size: 0.7rem;
        color: #ffbf00;
        font-weight: 700;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* Lista de Eixos */
      .nqd2-axes-list { display: flex; flex-direction: column; gap: 6px; }
      .nqd2-axis {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        transition: all 0.15s;
      }
      .nqd2-axis:hover {
        background: rgba(255, 255, 255, 0.035);
        border-color: rgba(240, 192, 64, 0.15);
      }
      .nqd2-axis.na { opacity: 0.38; }
      .nqd2-axis-ico { font-size: 1.15rem; width: 24px; text-align: center; flex-shrink: 0; }
      .nqd2-axis-lbl { flex: 1; font-size: 0.82rem; color: #e2e8f0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .nqd2-axis-bar-wrap { width: 84px; height: 6px; background: rgba(255, 255, 255, 0.06); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
      .nqd2-axis-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
      .nqd2-axis-pct { font-size: 0.8rem; font-weight: 700; min-width: 38px; text-align: right; }
      .nqd2-axis-cnt { font-size: 0.68rem; color: #718096; min-width: 44px; text-align: right; }

      /* ── Conquistas (Achievements) ───────────────────────────────────────── */
      .nqd2-ach-header-card {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 18px;
        background: linear-gradient(135deg, rgba(240, 192, 64, 0.08), rgba(240, 192, 64, 0.02));
        border: 1.5px solid rgba(240, 192, 64, 0.22);
        border-radius: 16px;
        margin-bottom: 24px;
      }
      .nqd2-ach-ring {
        width: 66px;
        height: 66px;
        border-radius: 50%;
        background: rgba(240, 192, 64, 0.06);
        border: 2.5px solid rgba(240, 192, 64, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 0 15px rgba(240,192,64,0.15);
      }
      .nqd2-ach-ringval {
        font-family: 'Cinzel', serif;
        font-size: 1.15rem;
        color: #ffbf00;
        font-weight: 700;
        line-height: 1;
      }
      .nqd2-ach-ringval small { font-size: 0.65rem; color: #718096; }
      .nqd2-ach-title {
        font-family: 'Cinzel', serif;
        font-size: 0.85rem;
        color: #ffbf00;
        margin-bottom: 5px;
        font-weight: 700;
      }
      .nqd2-ach-grid { display: grid; gap: 8px; }
      .nqd2-ach-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid;
        transition: all 0.2s;
      }
      .nqd2-ach-card:hover { transform: translateX(3px); }
      .nqd2-ach-card.on {
        background: linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%);
        border-color: rgba(52, 211, 153, 0.25);
        box-shadow: 0 4px 12px rgba(52, 211, 153, 0.04);
      }
      .nqd2-ach-card.off {
        background: rgba(0, 0, 0, 0.16);
        border-color: rgba(255, 255, 255, 0.04);
        opacity: 0.42;
      }
      .nqd2-ach-ico { font-size: 2rem; flex-shrink: 0; width: 44px; text-align: center; }
      .nqd2-ach-ico img { width: 44px; height: 44px; object-fit: contain; }
      .nqd2-ach-name { font-size: 0.88rem; font-weight: 700; margin-bottom: 3px; }
      .nqd2-ach-card.on .nqd2-ach-name { color: #34d399; }
      .nqd2-ach-card.off .nqd2-ach-name { color: #cbd5e1; }
      .nqd2-ach-desc { font-size: 0.72rem; color: #718096; line-height: 1.4; }
      .nqd2-ach-check { margin-left: auto; font-size: 1.15rem; color: #34d399; flex-shrink: 0; }

      /* ── Ranking (Mural do Reino) ───────────────────────────────────────── */
      .nqd2-lb-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .nqd2-lb-search {
        flex: 1;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 8px 14px;
        font-size: 0.82rem;
        color: #e2e8f0;
        outline: none;
        transition: all 0.2s;
      }
      .nqd2-lb-search:focus {
        border-color: rgba(240, 192, 64, 0.35);
        box-shadow: 0 0 10px rgba(240, 192, 64, 0.1);
      }
      .nqd2-lb-search::placeholder { color: #4a5568; }
      .nqd2-lb-table-wrap {
        background: rgba(0,0,0,0.18);
        border: 1px solid rgba(255,255,255,0.04);
        border-radius: 14px;
        overflow: hidden;
      }
      .nqd2-lb-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
      }
      .nqd2-lb-table th {
        color: rgba(240, 192, 64, 0.8);
        text-transform: uppercase;
        font-size: 0.64rem;
        letter-spacing: 1.2px;
        font-family: 'Cinzel', serif;
        padding: 10px 14px;
        text-align: left;
        border-bottom: 1.5px solid rgba(240, 192, 64, 0.18);
        background: rgba(0,0,0,0.2);
        font-weight: 700;
      }
      .nqd2-lb-table td {
        padding: 11px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        color: #cbd5e1;
        vertical-align: middle;
      }
      .nqd2-lb-table tr:last-child td { border-bottom: none; }
      .nqd2-lb-table tr:hover td { background: rgba(255, 255, 255, 0.015); }
      .nqd2-lb-table tr.lb-me td {
        background: rgba(240, 192, 64, 0.05);
        color: #ffbf00;
      }
      .nqd2-rank { font-weight: 700; font-size: 0.95rem; }
      .nqd2-rank.r1 { color: #ffd700; text-shadow: 0 0 8px rgba(255,215,0,0.4); }
      .nqd2-rank.r2 { color: #cbd5e1; }
      .nqd2-rank.r3 { color: #cd7f32; }
      .nqd2-lb-score {
        color: #ffbf00;
        font-weight: 700;
        font-family: 'Cinzel', serif;
        text-align: right;
      }
      .nqd2-lb-spin {
        text-align: center;
        padding: 44px 20px;
        color: #718096;
        font-size: 0.88rem;
      }
      .nqd2-lb-ts {
        font-size: 0.65rem;
        color: #718096;
        text-align: right;
        margin-top: 12px;
      }

      /* ── Responsivo ──────────────────────────────────────────────────────── */
      @media (max-width: 820px) {
        .nqd2-panel {
          grid-template-columns: 1fr;
          max-height: 96svh;
          border-radius: 20px 20px 0 0;
        }
        .nqd2-overlay { padding: 0; align-items: flex-end; }
        .nqd2-sidebar {
          border-right: none;
          border-bottom: 1.5px solid rgba(240, 192, 64, 0.18);
          max-height: 280px;
          padding: 18px 20px;
        }
        .nqd2-hero-card { display: grid; grid-template-columns: 74px 1fr; gap: 14px; text-align: left; padding: 12px 14px; }
        .nqd2-hero-avatar, .nqd2-hero-avatar-ph { width: 74px; height: 74px; margin: 0; }
        .nqd2-hero-name { font-size: 1rem; margin-top: 4px; }
        .nqd2-hero-title { margin-bottom: 8px; }
        .nqd2-hero-pills { justify-content: flex-start; }
        .nqd2-seals-grid { padding: 8px 10px; }
        .nqd2-seal { width: 46px; height: 46px; }
        .nqd2-seal-icon { font-size: 1.25rem; }
        .nqd2-header { padding: 18px 20px 10px; }
        .nqd2-tabs { padding: 6px 20px 0; }
        .nqd2-body { padding: 18px 20px 80px; }
        .nqd2-kpis { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .nqd2-axis-bar-wrap { width: 54px; }
        .nqd2-axis-cnt { display: none; }
        .nqd2-title { font-size: 0.8rem; letter-spacing: 1.8px; }
      }
      
      @keyframes nqd2-gaze {
        from { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)) brightness(1); }
        to { filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.7)) brightness(1.15); }
      }
    `;
    document.head.appendChild(s);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function _colorForV2(pct) {
    if (pct == null) return '#718096';
    return pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185';
  }

  const _BADGE_RUNES_V2 = { 1: 'ᚠ', 2: 'ᚨ', 3: 'ᛊ', 4: 'ᛟ', 5: 'ᛏ' };

  function _badgeHtmlV2(badge) {
    const on = (state.correctTotal || 0) >= badge.required;
    const rune = _BADGE_RUNES_V2[badge.id] || '✦';
    return `
      <div class="nq-dash-badge-wrap ${on ? 'on' : ''}" title="${escapeHtml(badge.name)} — ${badge.required} acertos"
        style="display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;cursor:default;">
        <div class="badge-slot ${on ? 'unlocked' : ''}" data-badge="${badge.id}" style="width:100%;">
          <div class="badge-shield"><span class="badge-rune">${rune}</span></div>
          ${on ? '' : '<span class="badge-lock">🔒</span>'}
        </div>
        <div class="nq-dash-badge-lbl" style="font-size:0.48rem;color:#718096;text-align:center;line-height:1.2;font-family:'Cinzel',serif;${on ? 'color:#ffd700;' : ''}">${escapeHtml(badge.name)}</div>
      </div>`;
  }

  function _buildActivityChartV2(stats) {
    const hist = (stats.questionHistory || []).slice().reverse();
    if (hist.length < 3) return null;
    const days = {};
    hist.forEach(h => {
      const d = (h.date || '').slice(0, 10);
      if (!d) return;
      if (!days[d]) days[d] = { c: 0, t: 0 };
      days[d].t++;
      if (h.correct) days[d].c++;
    });
    const sorted = Object.keys(days).sort().slice(-7);
    if (sorted.length < 2) return null;
    const pts = sorted.map(d => ({
      d,
      pct: Math.round(days[d].c / days[d].t * 100),
      total: days[d].t
    }));
    const H = 64, W = 400;
    const step = W / Math.max(pts.length - 1, 1);
    const y = p => (H - p.pct / 100 * H).toFixed(1);
    const x = i => (i * step).toFixed(1);
    const polyline = pts.map((p, i) => `${x(i)},${y(p)}`).join(' ');
    const areaBot = `${x(pts.length - 1)},${H} 0,${H}`;
    const areaPts = pts.map((p, i) => `${x(i)},${y(p)}`).join(' ') + ' ' + areaBot;
    
    const dots = pts.map((p, i) => {
      const c = _colorForV2(p.pct);
      return `<circle cx="${x(i)}" cy="${y(p)}" r="4.5" fill="${c}" stroke="#0b0f1d" stroke-width="2.5" style="filter:drop-shadow(0 0 5px ${c})"/>`;
    }).join('');

    const labels = pts.map((p, i) => {
      const c = _colorForV2(p.pct);
      const yVal = parseFloat(y(p));
      const formattedDate = p.d.slice(8) + '/' + p.d.slice(5, 7); // dd/mm
      return `<text x="${x(i)}" y="${H + 18}" text-anchor="middle" fill="#718096" font-size="9" font-family="'Inter', sans-serif">${formattedDate}</text>`
           + `<text x="${x(i)}" y="${(yVal - 10).toFixed(1)}" text-anchor="middle" fill="${c}" font-size="10.5" font-family="'Cinzel', serif" font-weight="700">${p.pct}%</text>`
           + `<text x="${x(i)}" y="${(yVal + 3).toFixed(1)}" text-anchor="middle" fill="#718096" font-size="8" font-family="'Inter', sans-serif" opacity="0.6" dy="8">${p.total}q</text>`;
    }).join('');

    return `<svg viewBox="-20 -25 440 115" style="width:100%;display:block;overflow:visible;">
      <defs>
        <linearGradient id="v2AreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffbf00" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#ffbf00" stop-opacity="0.00"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPts}" fill="url(#v2AreaGradient)"/>
      <polyline points="${polyline}" fill="none" stroke="#ffbf00" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 8px rgba(255,191,0,0.45))" />
      ${dots}${labels}
    </svg>`;
  }

  function _drawRadarV2(axisStats) {
    const canvas = document.getElementById('nqDashV2Radar');
    if (!canvas || !axisStats.length) return;
    if (typeof drawRadarChart === 'function') {
      drawRadarChart(canvas, axisStats);
      _enableRadarTooltipV2(canvas, axisStats);
    }
  }

  function _enableRadarTooltipV2(radarCanvas, axisStats) {
    let tooltip = document.getElementById('nqDashV2RadarTip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'nqDashV2RadarTip';
      tooltip.style.cssText = 'position:fixed;pointer-events:none;background:#090e1c;border:1px solid #ffbf00;color:#e2e8f0;padding:5px 12px;border-radius:8px;font-size:0.72rem;font-family:\'Inter\',sans-serif;white-space:nowrap;z-index:99999;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.6);';
      document.body.appendChild(tooltip);
    }

    const n = axisStats.length;
    const w = radarCanvas.width, h = radarCanvas.height;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 36;
    const pts = axisStats.map((ax, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + (r + 22) * Math.cos(a), y: cy + (r + 22) * Math.sin(a), label: ax.label, accuracy: ax.accuracy };
    });

    radarCanvas.addEventListener('mousemove', e => {
      const rect = radarCanvas.getBoundingClientRect();
      const scaleX = radarCanvas.width / rect.width;
      const scaleY = radarCanvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const found = pts.find(pt => Math.hypot(mx - pt.x, my - pt.y) < 24);
      if (found) {
        const pct = found.accuracy != null ? found.accuracy.toFixed(0) + '%' : '—';
        tooltip.textContent = `${found.label} — ${pct} acerto`;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY - 12) + 'px';
      } else {
        tooltip.style.display = 'none';
      }
    });

    radarCanvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    // Limpa quando o canvas for deletado
    const obs = new MutationObserver(() => {
      if (!document.contains(radarCanvas)) { tooltip.remove(); obs.disconnect(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ── Renderização das Abas (Grimório Clínico) ─────────────────────────────
  function _tabOverviewV2(stats, axisStats) {
    const accuracy = stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
    
    const unlockedBadges = BADGES.filter(b => (state.correctTotal || 0) >= b.required).length;
    const badgePct = Math.round((unlockedBadges / BADGES.length) * 100);
    const actChart = _buildActivityChartV2(stats);
    const acColor = _colorForV2(accuracy);

    // Stats acumulados de todas as partidas
    const gStats = typeof getGameStats === 'function' ? getGameStats() : {};
    const gamesPlayed = gStats.gamesPlayed || 0;
    const bestScore   = gStats.bestScore || 0;
    const bestLevel   = gStats.bestLevel || 0;

    // Métricas adicionais
    let maxStreak = 0, curS = 0;
    [...(stats.questionHistory || [])].reverse().forEach(q => {
      if (q.correct) { curS++; maxStreak = Math.max(maxStreak, curS); }
      else curS = 0;
    });

    const daysSet = new Set((stats.questionHistory || []).map(h => (h.date || '').slice(0, 10)).filter(Boolean));
    const daysActive = daysSet.size;

    return `
      <!-- Grid de KPIs: Histórico de Campanha -->
      <div class="nqd2-stitle">Jornada no Reino — Geral</div>
      <div class="nqd2-kpis" style="margin-bottom:18px;">
        <div class="nqd2-kpi">
          <div class="nqd2-kpi-icon">🛡️</div>
          <div class="nqd2-kpi-val">${gamesPlayed}</div>
          <div class="nqd2-kpi-lbl">Partidas</div>
        </div>
        <div class="nqd2-kpi">
          <div class="nqd2-kpi-icon">🏆</div>
          <div class="nqd2-kpi-val">${bestScore.toLocaleString('pt-BR')}</div>
          <div class="nqd2-kpi-lbl">Recorde</div>
        </div>
        <div class="nqd2-kpi">
          <div class="nqd2-kpi-icon">⚡</div>
          <div class="nqd2-kpi-val">${bestLevel}</div>
          <div class="nqd2-kpi-lbl">Maior Nível</div>
        </div>
      </div>

      <!-- Grid de KPIs: Estatísticas Clínicas -->
      <div class="nqd2-stitle">Performance Científica — Acumulado</div>
      <div class="nqd2-kpis" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <div class="nqd2-kpi">
          <div class="nqd2-kpi-icon">📚</div>
          <div class="nqd2-kpi-val">${stats.totalQuestions}</div>
          <div class="nqd2-kpi-lbl">Questões</div>
        </div>
        <div class="nqd2-kpi">
          <div class="nqd2-kpi-icon">🎯</div>
          <div class="nqd2-kpi-val" style="color:${acColor};">${accuracy}%</div>
          <div class="nqd2-kpi-lbl">Acerto</div>
        </div>
        <div class="nqd2-kpi">
          <div class="nqd2-kpi-icon">🔥</div>
          <div class="nqd2-kpi-val" style="color:#ffd700;">${maxStreak}</div>
          <div class="nqd2-kpi-lbl">Streak</div>
        </div>
        <div class="nqd2-kpi">
          <div class="nqd2-kpi-icon">📅</div>
          <div class="nqd2-kpi-val" style="color:#818cf8;">${daysActive}</div>
          <div class="nqd2-kpi-lbl">Dias</div>
        </div>
      </div>

      <!-- Evolução dos últimos 7 dias -->
      ${actChart ? `
        <div class="nqd2-stitle">Homeostase no Tempo (Últimos 7 dias)</div>
        <div class="nqd2-chart-container">${actChart}</div>
      ` : ''}

      <!-- Badges de Progressão -->
      <div class="nqd2-stitle">Títulos e Progressão</div>
      <div class="nqd2-prog-bar-container">
        <div class="nqd2-prog-bar">
          <div class="nqd2-prog-fill" style="width:${badgePct}%; background: linear-gradient(90deg, #b8860b, #ffd700);"></div>
        </div>
        <div class="nqd2-prog-lbl">${unlockedBadges}/${BADGES.length}</div>
      </div>
      
      <div class="nqd2-ach-grid" style="grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 8px;">
        ${BADGES.map(_badgeHtmlV2).join('')}
      </div>
    `;
  }

  function _tabSkillsV2(axisStats) {
    const worstAxis = axisStats.length > 0 ? axisStats[0] : null;

    // Eixos sem dados (alinhados alfabeticamente)
    const withData = new Set(axisStats.map(a => a.id));
    const noData = (typeof NEFRO_AXES !== 'undefined' ? NEFRO_AXES : []).filter(a => !withData.has(a.id));

    return `
      <div class="nqd2-stitle">Radar de Domínio Renal</div>
      ${axisStats.length >= 3 ? `
        <div class="nqd2-radar-card">
          <canvas id="nqDashV2Radar" width="310" height="310"></canvas>
        </div>
      ` : `<p style="color:#718096; text-align:center; padding:32px; font-size:0.84rem;">
              Responda questões em pelo menos 3 eixos clínicos diferentes para gerar seu Radar de Domínio.
           </p>`}

      <!-- Alerta Real de Ponto Fraco -->
      ${worstAxis && worstAxis.accuracy < 100 ? `
        <div class="nqd2-bounty-card" data-action="_dashV2GoWeakness">
          <div class="nqd2-bounty-header">
            <span>⚔️</span> BOUNTY REAL: PONTO FRACO DO REINO
          </div>
          <div class="nqd2-bounty-body">
            Detectamos lacunas no território clínico de <strong style="color:#ffbf00;">${worstAxis.icon} ${escapeHtml(worstAxis.label)}</strong>. 
            Sua proficiência de homeostase caiu para <span style="color:#fb7185; font-weight:700;">${worstAxis.accuracy.toFixed(0)}%</span>!
            Treine esta especialidade imediatamente no Modo de Estudo para selar esta vulnerabilidade e receba a benção do KDIGO.
          </div>
          <div class="nqd2-bounty-action">
            <span>🛡️</span> CLIQUE PARA TREINAR EIXO AGORA E EXPULSAR A UREMIA
          </div>
        </div>
      ` : ''}

      <div class="nqd2-stitle">Proficiência de Homeostase por Eixo</div>
      <div class="nqd2-axes-list">
        ${axisStats.length > 0
          ? axisStats.map(a => {
              const pct = a.accuracy != null ? a.accuracy.toFixed(0) : '0';
              const c = _colorForV2(a.accuracy);
              return `<div class="nqd2-axis">
                <div class="nqd2-axis-ico">${a.icon}</div>
                <div class="nqd2-axis-lbl">${escapeHtml(a.label)}</div>
                <div class="nqd2-axis-bar-wrap">
                  <div class="nqd2-axis-bar-fill" style="width:${pct}%; background: linear-gradient(90deg, #ff8c00, #ffbf00); box-shadow:0 0 5px rgba(255,191,0,0.3)"></div>
                </div>
                <div class="nqd2-axis-pct" style="color:${c};">${pct}%</div>
                <div class="nqd2-axis-cnt">${a.correct}/${a.total}</div>
              </div>`;
            }).join('')
          : `<p style="color:#718096; text-align:center; padding:28px; font-size:0.84rem;">
                Inicie partidas no NefroQuest para ver seu progresso detalhado de eixos!
             </p>`}
             
        ${noData.map(a => `
          <div class="nqd2-axis na">
            <div class="nqd2-axis-ico">${a.icon}</div>
            <div class="nqd2-axis-lbl" style="color:#718096;">${escapeHtml(a.label)}</div>
            <div class="nqd2-axis-bar-wrap"><div class="nqd2-axis-bar-fill" style="width:0%; background:#2d3748;"></div></div>
            <div class="nqd2-axis-pct" style="color:#718096;">—</div>
            <div class="nqd2-axis-cnt">0/0</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function _tabAchievementsV2() {
    const unlocked = getUnlockedAchievements();
    const unlockedBadges = BADGES.filter(b => (state.correctTotal || 0) >= b.required).length;
    const achPct = Math.round((unlocked.length / ACHIEVEMENTS_LIST.length) * 100);

    return `
      <!-- Ring de Progresso e Estatísticas -->
      <div class="nqd2-ach-header-card">
        <div class="nqd2-ach-ring">
          <div class="nqd2-ach-ringval">${unlocked.length}<small>/${ACHIEVEMENTS_LIST.length}</small></div>
        </div>
        <div style="flex:1;">
          <div class="nqd2-ach-title">Grimório de Conquistas</div>
          <div class="nqd2-prog-bar-container" style="margin-bottom:0;">
            <div class="nqd2-prog-bar" style="height:8px;">
              <div class="nqd2-prog-fill" style="width:${achPct}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
            </div>
            <div class="nqd2-prog-lbl" style="color:#34d399;">${achPct}%</div>
          </div>
        </div>
      </div>

      <div class="nqd2-stitle">Conquistas Clínicas do Grimório</div>
      <div class="nqd2-ach-grid">
        ${ACHIEVEMENTS_LIST.map(ach => {
          const on = unlocked.includes(ach.id);
          const icoHtml = ach.imgIcon
            ? `<div class="nqd2-ach-ico"><img src="${ach.imgIcon}" alt="${escapeHtml(ach.name)}"
                style="${on ? 'filter:drop-shadow(0 0 8px rgba(240,192,64,0.45));' : 'filter:grayscale(1) brightness(0.3);'}"></div>`
            : `<div class="nqd2-ach-ico" style="${on ? 'color:#ffd700;' : 'filter:grayscale(1) brightness(0.35);'}">${ach.icon}</div>`;
          
          return `<div class="nqd2-ach-card ${on ? 'on' : 'off'}">
            ${icoHtml}
            <div style="flex:1; min-width:0;">
              <div class="nqd2-ach-name">${escapeHtml(ach.name)}</div>
              <div class="nqd2-ach-desc">${escapeHtml(ach.description)}</div>
            </div>
            ${on ? '<div class="nqd2-ach-check">✓</div>' : ''}
          </div>`;
        }).join('')}
      </div>
    `;
  }

  function _tabRankingV2() {
    return `
      <div class="nqd2-lb-head">
        <input type="search" class="nqd2-lb-search" id="nqDashV2LbSearch" placeholder="Buscar jogador no Reino…">
        <button type="button" class="btn gold" style="font-size:0.68rem; padding:6px 14px; white-space:nowrap;" data-action="_dashV2RefreshRanking">↻ Atualizar</button>
      </div>
      <div class="nqd2-lb-table-wrap" id="nqDashV2LbWrap">
        <div class="nqd2-lb-spin">Carregando pergaminho de rankings…</div>
      </div>
    `;
  }

  // ── Controle de Rankings / Mural ─────────────────────────────────────────
  let _lbV2Data = [];

  function _renderRankingRowsV2(data, query) {
    const q = (query || '').trim().toLowerCase();
    const filtered = data.filter(r =>
      !q || (r.player_name || '').toLowerCase().includes(q) || (r.character_name || '').toLowerCase().includes(q)
    );
    if (!filtered.length) {
      return '<div class="nqd2-lb-spin" style="padding:24px;">Nenhum aventureiro correspondente encontrado.</div>';
    }
    const rl = ['🥇', '🥈', '🥉'];
    const rc = ['r1', 'r2', 'r3'];
    return `<table class="nqd2-lb-table">
      <thead><tr>
        <th style="width:40px; text-align:center;">Pos</th>
        <th>Aventureiro</th>
        <th style="text-align:right;">Score Real</th>
        <th style="text-align:center; width:60px;">Nível</th>
      </tr></thead>
      <tbody>
        ${filtered.map((r, i) => {
          const me = state.lastSubmittedName && r.player_name === state.lastSubmittedName;
          return `<tr class="${me ? 'lb-me' : ''}">
            <td style="text-align:center;"><span class="nqd2-rank ${i < 3 ? rc[i] : ''}">${i < 3 ? rl[i] : i + 1}</span></td>
            <td style="${me ? 'color:#ffbf00; font-weight:700;' : ''}">
              ${escapeHtml(r.player_name || 'Anônimo')}
              <span style="color:#718096; font-size:0.68rem; margin-left:6px;">${escapeHtml(r.character_name || '')}</span>
            </td>
            <td class="nqd2-lb-score">${(r.score || 0).toLocaleString('pt-BR')}</td>
            <td style="text-align:center; color:#718096; font-weight:600;">${r.level || 1}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <div class="nqd2-lb-ts" style="padding:10px 14px 10px 0;">
      Última consulta: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </div>`;
  }

  async function _loadRankingV2(force) {
    const wrap = document.getElementById('nqDashV2LbWrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="nqd2-lb-spin">Consultando o Mural do Reino…</div>';
    try {
      const data = await boardFetch(!!force);
      _lbV2Data = (data || []).slice(0, 50);
      if (!_lbV2Data.length) {
        wrap.innerHTML = '<div class="nqd2-lb-spin">O pergaminho de pontuações está em branco.</div>';
        return;
      }
      wrap.innerHTML = _renderRankingRowsV2(_lbV2Data, '');
      
      // Busca Instantânea
      const searchEl = document.getElementById('nqDashV2LbSearch');
      if (searchEl && !searchEl.dataset.wired) {
        searchEl.dataset.wired = '1';
        let t;
        searchEl.addEventListener('input', () => {
          clearTimeout(t);
          t = setTimeout(() => {
            const w = document.getElementById('nqDashV2LbWrap');
            if (w) w.innerHTML = _renderRankingRowsV2(_lbV2Data, searchEl.value);
          }, 200);
        });
      }
    } catch (e) {
      if (wrap) wrap.innerHTML = '<div class="nqd2-lb-spin" style="color:#fb7185;">Falha ao obter rankings do reino.</div>';
    }
  }

  // ── Abertura e Fechamento Principal ──────────────────────────────────────
  function openDashboardV2() {
    _injectV2Styles();
    document.getElementById('nqDashboardV2')?.remove();
    document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));

    const stats = getDetailedStats();
    const axisStats = getAxisStats(stats);

    const charData = state.character && typeof characters !== 'undefined' && characters[state.character]
      ? characters[state.character] : null;
    const charLv = Math.min(Math.max(state.level || 1, 1), 10);
    const lvStr = String(charLv).padStart(2, '0');
    const avatarSrc = charData ? `assets/classes/${charData.folder}/nivel_${lvStr}.jpg` : null;

    // Cálculo das conquistas e acertos
    const correctCount = state.correctTotal || 0;

    // Determina o estado dos selos do reino
    const kdigoUnlocked = correctCount >= 50;
    const sbnUnlocked   = correctCount >= 20;
    const kdoqiUnlocked = correctCount >= 80;

    const overlay = document.createElement('div');
    overlay.id = 'nqDashboardV2';
    overlay.className = 'nqd2-overlay';

    overlay.innerHTML = `
      <div class="nqd2-panel">
        <!-- Coluna Esquerda: Status do Aventureiro -->
        <div class="nqd2-sidebar">
          <!-- Card do Herói -->
          <div class="nqd2-hero-card">
            ${avatarSrc
              ? `<img class="nqd2-hero-avatar" src="${avatarSrc}" alt="${escapeHtml(charData.name)}" loading="lazy">`
              : `<div class="nqd2-hero-avatar-ph">⚕️</div>`}
            <div class="nqd2-hero-name">${charData ? escapeHtml(charData.name) : 'Aventureiro'}</div>
            <div class="nqd2-hero-title">${charData ? escapeHtml(charData.title) : 'Nefrologista do Reino'}</div>
            <div class="nqd2-hero-pills">
              <div class="nqd2-hpill"><em>Lv.</em>${state.level || 1}</div>
              <div class="nqd2-hpill"><em>💰</em>${state.gold || 0}</div>
              <div class="nqd2-hpill"><em>✅</em>${correctCount}/100</div>
            </div>
          </div>

          <!-- Sinetes Acadêmicos -->
          <div>
            <div class="nqd2-seals-title">Sinetes de Credenciamento</div>
            <div class="nqd2-seals-grid">
              <!-- Selo SBN -->
              <div class="nqd2-seal ${sbnUnlocked ? 'unlocked' : 'locked'}">
                <span class="nqd2-seal-icon">🦁</span>
                <div class="nqd2-seal-tooltip">
                  <strong>Selo Imperial SBN</strong><br>
                  Outorgado aos membros oficiais da guilda. Exige 20+ acertos na jornada.<br>
                  Status: ${sbnUnlocked ? '✅ Desbloqueado' : '🔒 Bloqueado'}
                </div>
              </div>
              
              <!-- Selo KDIGO -->
              <div class="nqd2-seal ${kdigoUnlocked ? 'unlocked' : 'locked'}">
                <span class="nqd2-seal-icon">⚜️</span>
                <div class="nqd2-seal-tooltip">
                  <strong>Selo Clínico KDIGO</strong><br>
                  Excelência máxima em diretrizes clínicas e filtração. Exige 50+ acertos.<br>
                  Status: ${kdigoUnlocked ? '✅ Desbloqueado' : '🔒 Bloqueado'}
                </div>
              </div>

              <!-- Selo KDOQI -->
              <div class="nqd2-seal ${kdoqiUnlocked ? 'unlocked' : 'locked'}">
                <span class="nqd2-seal-icon">👑</span>
                <div class="nqd2-seal-tooltip">
                  <strong>Selo Sagrado DOQI</strong><br>
                  Reconhecimento de mestre supremo da diálise e eletrólitos. Exige 80+ acertos.<br>
                  Status: ${kdoqiUnlocked ? '✅ Desbloqueado' : '🔒 Bloqueado'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Grimório Principal -->
        <div class="nqd2-content">
          <div class="nqd2-header">
            <div class="nqd2-title">
              <span class="nqd2-title-icon">🔬</span>
              Dashboard Real (Beta)
            </div>
            <button type="button" class="nqd2-close-btn" data-action="closeDashboardV2" aria-label="Fechar">×</button>
          </div>

          <div class="nqd2-tabs">
            <button type="button" class="nqd2-tab active" data-dash2-tab="overview">Visão Geral</button>
            <button type="button" class="nqd2-tab" data-dash2-tab="skills">Clínica & Eixos</button>
            <button type="button" class="nqd2-tab" data-dash2-tab="achievements">Grimório</button>
            <button type="button" class="nqd2-tab" data-dash2-tab="ranking">Ranking Real</button>
          </div>

          <div class="nqd2-body">
            <div class="nqd2-pane active" data-dash2-pane="overview">
              ${_tabOverviewV2(stats, axisStats)}
            </div>
            <div class="nqd2-pane" data-dash2-pane="skills">
              ${_tabSkillsV2(axisStats)}
            </div>
            <div class="nqd2-pane" data-dash2-pane="achievements">
              ${_tabAchievementsV2()}
            </div>
            <div class="nqd2-pane" data-dash2-pane="ranking">
              ${_tabRankingV2()}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Controle de Abas
    overlay.querySelectorAll('[data-dash2-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.dash2Tab;
        overlay.querySelectorAll('[data-dash2-tab]').forEach(b => b.classList.toggle('active', b.dataset.dash2Tab === tab));
        overlay.querySelectorAll('[data-dash2-pane]').forEach(p => p.classList.toggle('active', p.dataset.dash2Pane === tab));
        if (tab === 'skills') setTimeout(() => _drawRadarV2(axisStats), 50);
        if (tab === 'ranking') _loadRankingV2(false);
      });
    });

    // Fechar ao clicar no backdrop
    overlay.addEventListener('click', e => { if (e.target === overlay) closeDashboardV2(); });

    if (typeof playSound === 'function') playSound('click');
  }

  function closeDashboardV2() {
    document.getElementById('nqDashboardV2')?.remove();
  }

  function _dashV2RefreshRanking() {
    _loadRankingV2(true);
  }

  function _dashV2GoWeakness() {
    closeDashboardV2();
    if (typeof setStudyMode === 'function') setStudyMode('weakness');
    else if (typeof _toast === 'function') _toast('Abra o Modo de Estudo para reconquistar seu ponto fraco.', 'info');
  }

  // Exportar para o escopo global
  window.openDashboardV2         = openDashboardV2;
  window.closeDashboardV2        = closeDashboardV2;
  window._dashV2RefreshRanking   = _dashV2RefreshRanking;
  window._dashV2GoWeakness       = _dashV2GoWeakness;
})();
