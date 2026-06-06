// NefroQuest — Dashboard (Perfil do Nefrologista)
// Acessível via menu admin enquanto o redesign está em progresso.

(function () {
  // ── Estilos injetados uma única vez ───────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('nq-dash-styles')) return;
    const s = document.createElement('style');
    s.id = 'nq-dash-styles';
    s.textContent = `
      /* ── Overlay ────────────────────────────────────────────────────────── */
      .nq-dash-overlay {
        position: fixed;
        inset: 0;
        background: rgba(4, 8, 20, 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 11000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
        overflow-y: auto;
      }

      /* ── Painel principal ───────────────────────────────────────────────── */
      .nq-dash-panel {
        position: relative;
        width: 100%;
        max-width: 880px;
        max-height: 92vh;
        background: linear-gradient(162deg, #0e1628 0%, #080d1a 100%);
        border: 1px solid rgba(255, 215, 0, 0.22);
        border-radius: 20px;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.04) inset,
          0 40px 80px rgba(0,0,0,0.6),
          0 0 60px rgba(255,215,0,0.08),
          0 0 120px rgba(124,58,237,0.06);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Ornamento de canto (pseudo-element) */
      .nq-dash-panel::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(255,215,0,0.5) 30%, rgba(192,132,252,0.4) 70%, transparent);
        border-radius: 20px 20px 0 0;
        pointer-events: none;
      }

      /* ── Header ──────────────────────────────────────────────────────────── */
      .nq-dash-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 26px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: linear-gradient(90deg, rgba(255,215,0,0.04) 0%, rgba(124,58,237,0.03) 50%, transparent 100%);
        flex-shrink: 0;
      }
      .nq-dash-title {
        font-family: 'Cinzel Decorative', 'Cinzel', serif;
        font-size: 0.92rem;
        color: var(--gold);
        letter-spacing: 2.5px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 10px;
        text-shadow: 0 0 20px rgba(255,215,0,0.4);
      }
      .nq-dash-title-icon {
        font-size: 1.2rem;
        filter: drop-shadow(0 0 8px rgba(255,215,0,0.7));
      }
      .nq-dash-close {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: var(--txt-dim);
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
        line-height: 1;
      }
      .nq-dash-close:hover {
        background: rgba(251,113,133,0.15);
        border-color: rgba(251,113,133,0.4);
        color: #fb7185;
        transform: rotate(90deg);
      }

      /* ── Abas ──────────────────────────────────────────────────────────── */
      .nq-dash-tabs {
        display: flex;
        gap: 2px;
        padding: 12px 26px 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        flex-shrink: 0;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .nq-dash-tabs::-webkit-scrollbar { display: none; }
      .nq-dash-tab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--txt-dim);
        font-family: 'Cinzel', serif;
        font-size: 0.68rem;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        padding: 8px 18px 11px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .nq-dash-tab:hover { color: var(--txt); }
      .nq-dash-tab.active {
        color: var(--gold);
        border-bottom-color: var(--gold);
        text-shadow: 0 0 12px rgba(255,215,0,0.3);
      }

      /* ── Corpo com scroll ────────────────────────────────────────────────── */
      .nq-dash-body {
        flex: 1;
        overflow-y: auto;
        padding: 22px 26px 28px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,215,0,0.18) transparent;
      }
      .nq-dash-body::-webkit-scrollbar { width: 4px; }
      .nq-dash-body::-webkit-scrollbar-track { background: transparent; }
      .nq-dash-body::-webkit-scrollbar-thumb {
        background: rgba(255,215,0,0.18);
        border-radius: 2px;
      }
      .nq-dash-pane { display: none; }
      .nq-dash-pane.active { display: block; }

      /* ── Hero card ─────────────────────────────────────────────────────── */
      .nq-dash-hero {
        display: grid;
        grid-template-columns: 88px 1fr;
        gap: 18px;
        align-items: center;
        background: linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(255,215,0,0.04) 100%);
        border: 1px solid rgba(255,215,0,0.18);
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 22px;
        position: relative;
        overflow: hidden;
      }
      .nq-dash-hero::after {
        content: '⚕';
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 4rem;
        opacity: 0.04;
        pointer-events: none;
      }
      .nq-dash-avatar {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        border: 2px solid var(--gold);
        object-fit: cover;
        box-shadow: 0 0 24px rgba(255,215,0,0.25), 0 0 48px rgba(255,215,0,0.08);
        flex-shrink: 0;
      }
      .nq-dash-avatar-ph {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        border: 2px solid rgba(255,215,0,0.3);
        background: linear-gradient(135deg, #1a2744, #0d1426);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.2rem;
        flex-shrink: 0;
      }
      .nq-dash-char-name {
        font-family: 'Cinzel', serif;
        font-size: 1.05rem;
        color: var(--gold);
        font-weight: 700;
        margin-bottom: 3px;
      }
      .nq-dash-char-title {
        font-size: 0.76rem;
        color: var(--txt-dim);
        margin-bottom: 10px;
        letter-spacing: 0.3px;
      }
      .nq-dash-char-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
      }
      .nq-dash-cs {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.76rem;
        color: var(--txt);
        background: rgba(255,255,255,0.05);
        border-radius: 20px;
        padding: 3px 9px;
      }
      .nq-dash-cs em { color: var(--txt-dim); font-style: normal; margin-right: 2px; }

      /* ── KPI grid ─────────────────────────────────────────────────────── */
      .nq-dash-kpis {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 22px;
      }
      .nq-dash-kpi {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 14px;
        padding: 16px 12px 13px;
        text-align: center;
        transition: border-color 0.2s, transform 0.15s;
        cursor: default;
      }
      .nq-dash-kpi:hover { transform: translateY(-1px); }
      .nq-dash-kpi-icon { font-size: 1.4rem; margin-bottom: 7px; line-height: 1; }
      .nq-dash-kpi-val {
        font-size: 1.4rem;
        font-weight: 700;
        font-family: 'Cinzel', serif;
        margin-bottom: 5px;
        line-height: 1;
      }
      .nq-dash-kpi-lbl {
        font-size: 0.62rem;
        color: var(--txt-dim);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* ── Section title ─────────────────────────────────────────────────── */
      .nq-dash-stitle {
        font-family: 'Cinzel', serif;
        font-size: 0.68rem;
        color: rgba(255,215,0,0.75);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .nq-dash-stitle::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, rgba(255,215,0,0.2), transparent);
      }

      /* ── Activity chart ────────────────────────────────────────────────── */
      .nq-dash-activity {
        background: rgba(0,0,0,0.22);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px;
        padding: 12px 16px 8px;
        margin-bottom: 22px;
      }

      /* ── Badges strip ─────────────────────────────────────────────────── */
      .nq-dash-badges-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-bottom: 22px;
        max-width: 420px;
        margin-left: auto;
        margin-right: auto;
      }
      /* Each cell: shield on top, label below */
      .nq-dash-badge-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }
      /* The .badge-slot inside uses the global shield CSS from style.css */
      .nq-dash-badge-wrap .badge-slot {
        width: 100%;
      }
      .nq-dash-badge-lbl {
        font-size: 0.48rem;
        color: var(--txt-dim);
        text-align: center;
        line-height: 1.2;
        font-family: 'Cinzel', serif;
      }
      .nq-dash-badge-wrap.on .nq-dash-badge-lbl { color: var(--gold-light); }

      /* Progress row */
      .nq-dash-prow {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .nq-dash-pbar {
        flex: 1;
        height: 6px;
        background: rgba(255,255,255,0.07);
        border-radius: 3px;
        overflow: hidden;
      }
      .nq-dash-pfill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .nq-dash-plbl {
        font-size: 0.72rem;
        color: var(--gold);
        font-family: 'Cinzel', serif;
        white-space: nowrap;
        min-width: 28px;
        text-align: right;
      }

      /* ── Skills: radar ────────────────────────────────────────────────── */
      .nq-dash-radar-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        padding: 8px;
        background: rgba(0,0,0,0.18);
        border: 1px solid rgba(124,58,237,0.15);
        border-radius: 16px;
      }
      .nq-dash-radar-wrap canvas { max-width: 320px; width: 100%; }

      /* Skills: axis rows */
      .nq-dash-axis {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: 9px;
        margin-bottom: 5px;
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.045);
        transition: background 0.15s;
      }
      .nq-dash-axis:hover { background: rgba(255,255,255,0.04); }
      .nq-dash-axis.na { opacity: 0.3; }
      .nq-dash-axis-ico { font-size: 1.05rem; width: 22px; text-align: center; flex-shrink: 0; }
      .nq-dash-axis-lbl { flex: 1; font-size: 0.79rem; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .nq-dash-axis-bar { width: 72px; height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
      .nq-dash-axis-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
      .nq-dash-axis-pct { font-size: 0.76rem; font-weight: 700; min-width: 34px; text-align: right; }
      .nq-dash-axis-cnt { font-size: 0.66rem; color: var(--txt-dim); min-width: 40px; text-align: right; }

      /* Weakness pill */
      .nq-dash-weakness {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(251,113,133,0.1);
        border: 1px solid rgba(251,113,133,0.3);
        border-radius: 20px;
        padding: 5px 14px;
        font-size: 0.7rem;
        color: #fb7185;
        margin-bottom: 16px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .nq-dash-weakness:hover { background: rgba(251,113,133,0.18); }

      /* ── Conquistas ───────────────────────────────────────────────────── */
      .nq-dash-ach-counter {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 18px;
        background: linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,215,0,0.02));
        border: 1px solid rgba(255,215,0,0.18);
        border-radius: 14px;
        margin-bottom: 20px;
      }
      .nq-dash-ach-ring {
        width: 62px;
        height: 62px;
        border-radius: 50%;
        background: rgba(255,215,0,0.08);
        border: 2px solid rgba(255,215,0,0.28);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .nq-dash-ach-ringval {
        font-family: 'Cinzel', serif;
        font-size: 1.05rem;
        color: var(--gold);
        font-weight: 700;
        line-height: 1;
      }
      .nq-dash-ach-ringval small { font-size: 0.6rem; color: var(--txt-dim); }
      .nq-dash-ach-lbl {
        font-family: 'Cinzel', serif;
        font-size: 0.8rem;
        color: var(--gold);
        margin-bottom: 6px;
      }
      .nq-dash-ach-grid { display: grid; gap: 7px; }
      .nq-dash-ach-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 11px 14px;
        border-radius: 10px;
        border: 1px solid;
        transition: transform 0.15s;
      }
      .nq-dash-ach-card:hover { transform: translateX(2px); }
      .nq-dash-ach-card.on {
        background: linear-gradient(135deg, rgba(52,211,153,0.09), rgba(16,185,129,0.04));
        border-color: rgba(52,211,153,0.28);
        box-shadow: 0 0 14px rgba(52,211,153,0.08);
      }
      .nq-dash-ach-card.off {
        background: rgba(0,0,0,0.18);
        border-color: rgba(255,255,255,0.05);
        opacity: 0.5;
      }
      .nq-dash-ach-ico { font-size: 2rem; flex-shrink: 0; width: 44px; text-align: center; }
      .nq-dash-ach-ico img { width: 44px; height: 44px; object-fit: contain; }
      .nq-dash-ach-name { font-size: 0.84rem; font-weight: 700; margin-bottom: 3px; }
      .nq-dash-ach-card.on  .nq-dash-ach-name { color: #34d399; }
      .nq-dash-ach-card.off .nq-dash-ach-name { color: var(--txt); }
      .nq-dash-ach-desc { font-size: 0.7rem; color: var(--txt-dim); line-height: 1.35; }
      .nq-dash-ach-check { margin-left: auto; font-size: 1.1rem; color: #34d399; flex-shrink: 0; }

      /* ── Mini leaderboard ─────────────────────────────────────────────── */
      .nq-dash-lb-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .nq-dash-lb-search {
        flex: 1;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.78rem;
        color: var(--txt);
        outline: none;
        transition: border-color 0.2s;
      }
      .nq-dash-lb-search:focus { border-color: rgba(255,215,0,0.3); }
      .nq-dash-lb-search::placeholder { color: var(--txt-dim); }
      .nq-dash-lb-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
      }
      .nq-dash-lb-table th {
        color: var(--txt-dim);
        text-transform: uppercase;
        font-size: 0.6rem;
        letter-spacing: 1px;
        font-family: 'Cinzel', serif;
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .nq-dash-lb-table td {
        padding: 9px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        color: var(--txt);
        vertical-align: middle;
      }
      .nq-dash-lb-table tr:last-child td { border-bottom: none; }
      .nq-dash-lb-table tr:hover td { background: rgba(255,255,255,0.02); }
      .nq-dash-lb-table tr.lb-me td { background: rgba(255,215,0,0.05); }
      .nq-dash-rank { font-weight: 700; font-size: 0.9rem; }
      .nq-dash-rank.r1 { color: #ffd700; }
      .nq-dash-rank.r2 { color: #c0c0c0; }
      .nq-dash-rank.r3 { color: #cd7f32; }
      .nq-dash-lb-score {
        color: var(--gold);
        font-weight: 700;
        font-family: 'Cinzel', serif;
        text-align: right;
      }
      .nq-dash-lb-spin {
        text-align: center;
        padding: 40px 20px;
        color: var(--txt-dim);
        font-size: 0.85rem;
      }
      .nq-dash-lb-ts {
        font-size: 0.62rem;
        color: var(--txt-dim);
        text-align: right;
        margin-top: 10px;
      }

      /* ── Engagement Grid (Heatmap) ────────────────────────────────────────── */
      .nq-dash-heatmap-wrap {
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 18px 20px;
        margin-bottom: 22px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      }
      .nq-dash-heatmap-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .nq-dash-heatmap-title {
        font-family: 'Cinzel Decorative', 'Cinzel', serif;
        font-size: 0.76rem;
        font-weight: bold;
        color: var(--gold);
        letter-spacing: 1px;
        text-shadow: 0 0 10px rgba(255,215,0,0.25);
      }
      .nq-dash-heatmap-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        justify-content: start;
        padding: 6px 4px 10px;
      }
      .nq-dash-heatmap-day {
        width: 10px;
        height: 10px;
        border-radius: 2.5px;
        cursor: help;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .nq-dash-heatmap-day:hover {
        transform: scale(1.35);
        z-index: 5;
        box-shadow: 0 0 6px rgba(255,255,255,0.3);
      }
      .nq-dash-heatmap-labels {
        display: flex;
        justify-content: space-between;
        padding: 4px 6px 0;
        margin-top: 4px;
        font-size: 0.65rem;
        color: var(--txt-dim);
        font-family: 'Philosopher', sans-serif;
      }
      .nq-dash-heatmap-legend {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 5px;
        margin-top: 12px;
        font-size: 0.65rem;
        color: var(--txt-dim);
        font-family: 'Philosopher', sans-serif;
      }
      .nq-dash-heatmap-legend-box {
        width: 10px;
        height: 10px;
        border-radius: 2.5px;
        cursor: help;
      }

      /* ── Responsive ────────────────────────────────────────────────────── */
      @media (max-width: 600px) {
        .nq-dash-overlay { padding: 0; align-items: flex-end; }
        .nq-dash-panel { max-height: 96svh; border-radius: 18px 18px 0 0; }
        .nq-dash-kpis { grid-template-columns: repeat(2, 1fr); }
        .nq-dash-hero { grid-template-columns: 68px 1fr; gap: 12px; }
        .nq-dash-avatar,
        .nq-dash-avatar-ph { width: 68px; height: 68px; }
        .nq-dash-header { padding: 16px 18px 12px; }
        .nq-dash-tabs { padding: 10px 18px 0; }
        .nq-dash-body { padding: 18px 18px calc(80px + env(safe-area-inset-bottom, 0px)); }
        .nq-dash-axis-bar { width: 48px; }
        .nq-dash-axis-cnt { display: none; }
        .nq-dash-title { font-size: 0.78rem; letter-spacing: 1.5px; }
      }

      /* ── History Explorer ── */
      .nq-hist-item {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.2s ease;
        margin-bottom: 10px;
      }
      .nq-hist-item:hover {
        border-color: rgba(255, 215, 0, 0.2);
        background: rgba(255, 255, 255, 0.035);
      }
      .nq-hist-item-header {
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }
      .nq-hist-item-title {
        font-family: 'Cinzel', serif;
        font-size: 0.8rem;
        font-weight: bold;
        color: #fff;
      }
      .nq-hist-item-badge {
        font-size: 0.65rem;
        font-weight: bold;
        padding: 3px 8px;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .nq-hist-item-badge.correct {
        background: rgba(52, 211, 153, 0.15);
        color: #34d399;
        border: 1px solid rgba(52, 211, 153, 0.3);
      }
      .nq-hist-item-badge.wrong {
        background: rgba(251, 113, 133, 0.15);
        color: #fb7185;
        border: 1px solid rgba(251, 113, 133, 0.3);
      }
      .nq-hist-item-details {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        background: rgba(0, 0, 0, 0.15);
        font-size: 0.8rem;
        line-height: 1.55;
        color: #cbd5e1;
      }
      .nq-hist-item-qtext {
        font-weight: 600;
        color: #fff;
        margin-bottom: 12px;
      }
      .nq-hist-item-opts {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }
      .nq-hist-item-opt {
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.75rem;
      }
      .nq-hist-item-opt.correct {
        background: rgba(52, 211, 153, 0.08);
        border: 1px solid rgba(52, 211, 153, 0.25);
        color: #34d399;
      }
      .nq-hist-item-opt.normal {
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.04);
        color: #94a3b8;
      }
      .nq-hist-item-exp {
        background: rgba(255, 215, 0, 0.02);
        border-left: 3px solid var(--gold);
        padding: 10px 12px;
        border-radius: 0 8px 8px 0;
        margin-top: 12px;
        font-size: 0.74rem;
        color: #e2e8f0;
      }

      /* Estilo do tooltip "i" na Jornada Ativa */
      .nq-dash-hero-info-tooltip {
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--txt-dim);
        font-size: 0.68rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: help;
        transition: all 0.2s ease;
        user-select: none;
        z-index: 5;
      }
      .nq-dash-hero-info-tooltip:hover {
        background: rgba(255, 215, 0, 0.15);
        border-color: var(--gold);
        color: var(--gold);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      }
      .nq-dash-hero-info-tooltip::after {
        content: "O progresso e nível acima pertencem apenas à corrida atual e serão resetados ao iniciar um novo jogo. Os acertos acumulados, conquistas e ranking abaixo pertencem ao seu perfil definitivo.";
        position: absolute;
        bottom: 24px;
        right: 0;
        width: 220px;
        background: #0f111a;
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 8px;
        padding: 8px 10px;
        color: #e2e8f0;
        font-size: 0.65rem;
        line-height: 1.4;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
        transform: translateY(4px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        z-index: 10;
        text-align: left;
        font-family: 'Philosopher', sans-serif;
      }
      .nq-dash-hero-info-tooltip:hover::after {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(s);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function _colorFor(pct) {
    if (pct == null) return 'var(--txt-dim)';
    return pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185';
  }

  const _BADGE_RUNES = { 1: 'ᚠ', 2: 'ᚨ', 3: 'ᛊ', 4: 'ᛟ', 5: 'ᛏ' };

  function _badgeHtml(badge) {
    const on = (state.correctTotal || 0) >= badge.required;
    const rune = _BADGE_RUNES[badge.id] || '✦';
    return `
      <div class="nq-dash-badge-wrap ${on ? 'on' : ''}" title="${escapeHtml(badge.name)} — ${badge.required} acertos">
        <div class="badge-slot ${on ? 'unlocked' : ''}" data-badge="${badge.id}">
          <div class="badge-shield"><span class="badge-rune">${rune}</span></div>
          ${on ? '' : '<span class="badge-lock">🔒</span>'}
        </div>
        <div class="nq-dash-badge-lbl">${escapeHtml(badge.name)}</div>
      </div>`;
  }

  function _buildEngagementHeatmap(stats) {
    const daysData = stats.dailyActivity || {};

    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    
    // Sunday of 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDayOfWeek - 364);
    startDate.setHours(0, 0, 0, 0);

    const totalDays = 371; // 53 weeks to show a full year + current week
    const gridDays = [];

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const dayStats = daysData[dateKey] || { count: 0, time: 0, correct: 0 };
      gridDays.push({
        date: current,
        dateKey,
        dayOfWeek: current.getDay(),
        ...dayStats
      });
    }

    function getLevel(count, time) {
      if (count === 0) return 0;
      if (count >= 25 || time >= 600) return 4;
      if (count >= 12 || time >= 240) return 3;
      if (count >= 5 || time >= 60) return 2;
      return 1;
    }

    const weeks = [];
    for (let i = 0; i < gridDays.length; i += 7) {
      weeks.push(gridDays.slice(i, i + 7));
    }

    const weekSquares = weeks.map(week => {
      const daySquares = week.map(day => {
        const lvl = getLevel(day.count, day.time);
        const dayName = day.date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const formattedDate = day.date.toLocaleDateString('pt-BR');
        let tooltip = `${formattedDate} (${dayName}): `;
        if (day.count === 0) {
          tooltip += 'Sem atividade';
        } else {
          const accuracy = Math.round(day.correct / day.count * 100);
          const min = Math.floor(day.time / 60);
          const sec = Math.round(day.time % 60);
          const timeStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
          tooltip += `${day.count} qts (${day.correct} acertos, ${accuracy}%) • ${timeStr} foco`;
        }

        let bgStyle = 'rgba(255, 255, 255, 0.03)';
        let shadow = 'none';
        if (lvl === 1) bgStyle = 'rgba(139, 92, 246, 0.25)';
        else if (lvl === 2) bgStyle = 'rgba(139, 92, 246, 0.55)';
        else if (lvl === 3) bgStyle = 'rgba(139, 92, 246, 0.85)';
        else if (lvl === 4) {
          bgStyle = 'var(--gold)';
          shadow = '0 0 6px rgba(255, 215, 0, 0.45)';
        }

        return `<div class="nq-dash-heatmap-day" style="background:${bgStyle}; box-shadow:${shadow};" title="${escapeHtml(tooltip)}"></div>`;
      }).join('');

      return `<div class="nq-dash-heatmap-week" style="display: flex; flex-direction: column; gap: 5px; width: 10px;">${daySquares}</div>`;
    }).join('');

    const startStr = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const endStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

    return `
      <div class="nq-dash-heatmap-wrap">
        <div class="nq-dash-heatmap-header">
          <div class="nq-dash-heatmap-title">Foco & Engajamento (Últimas 52 Semanas)</div>
        </div>
        <div class="nq-dash-heatmap-grid">
          ${weekSquares}
        </div>
        <div class="nq-dash-heatmap-labels">
          <span>${startStr}</span>
          <span style="color:var(--gold); font-weight:bold; letter-spacing: 0.5px;">Intensidade de Foco</span>
          <span>${endStr}</span>
        </div>
        <div class="nq-dash-heatmap-legend">
          <span style="margin-right:2px;">Atividade:</span>
          <div class="nq-dash-heatmap-legend-box" style="background:rgba(255,255,255,0.03);" title="Sem atividade"></div>
          <div class="nq-dash-heatmap-legend-box" style="background:rgba(139,92,246,0.25);" title="1-4 questões"></div>
          <div class="nq-dash-heatmap-legend-box" style="background:rgba(139,92,246,0.55);" title="5-11 questões"></div>
          <div class="nq-dash-heatmap-legend-box" style="background:rgba(139,92,246,0.85);" title="12-24 questões"></div>
          <div class="nq-dash-heatmap-legend-box" style="background:var(--gold); box-shadow:0 0 4px rgba(255,215,0,0.3);" title="25+ questões ou 10+ min de foco!"></div>
        </div>
      </div>
    `;
  }


  function _drawRadar() {
    // drawRadarChart(container, coreStats) recebe o CONTÊINER (limpa e desenha
    // o SVG dentro) — não um <canvas>. Usa o mesmo provedor do modo estudo
    // (getCoreSkillsStats) para o radar de 5 eixos.
    const container = document.getElementById('nqDashRadarContainer');
    if (!container) return;
    if (typeof drawRadarChart !== 'function'
        || typeof getCoreSkillsStats !== 'function'
        || typeof getDetailedStats !== 'function') {
      container.innerHTML = '<div style="color:var(--txt-dim);font-size:0.8rem;">Radar indisponível.</div>';
      return;
    }
    try {
      drawRadarChart(container, getCoreSkillsStats(getDetailedStats()));
    } catch (e) {
      container.innerHTML = '<div style="color:var(--txt-dim);font-size:0.8rem;">Não foi possível carregar o radar.</div>';
      if (typeof _track === 'function') _track('error_dash_radar', { msg: String(e) });
    }
  }

  // ── Render tabs ─────────────────────────────────────────────────────────
  function _tabOverview(stats, axisStats) {
    const charData = state.character && typeof characters !== 'undefined' && characters[state.character]
      ? characters[state.character] : null;
    const charLv = Math.min(Math.max(state.level || 1, 1), 10);
    const lvStr = String(charLv).padStart(2, '0');
    const avatarSrc = charData ? `assets/classes/${charData.folder}/nivel_${lvStr}.jpg` : null;

    // Stats acumulados de TODAS as partidas (STATS_KEY)
    const gStats = typeof getGameStats === 'function' ? getGameStats() : {};
    const gamesPlayed  = gStats.gamesPlayed  || 0;
    const bestScore    = gStats.bestScore     || 0;
    const bestLevel    = gStats.bestLevel     || 0;
    const totalAccumulatedKnowledge = parseInt(localStorage.getItem('nefroquest_total_accumulated_knowledge') || '0', 10);

    // Stats detalhados (STATS_STORAGE_KEY) — histórico de questões
    const accuracy = stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
    const avgTime = (stats.timeStats?.questionCount || 0) > 0
      ? Math.round(stats.timeStats.totalTime / stats.timeStats.questionCount) : 0;

    // Maior streak já atingido no histórico (últimas 100)
    let maxStreak = 0, curS = 0;
    [...(stats.questionHistory || [])].reverse().forEach(q => {
      if (q.correct) { curS++; maxStreak = Math.max(maxStreak, curS); }
      else curS = 0;
    });

    const daysSet = new Set((stats.questionHistory || []).map(h => (h.date || '').slice(0, 10)).filter(Boolean));
    const daysActive = daysSet.size;

    const unlockedBadges = BADGES.filter(b => (state.correctTotal || 0) >= b.required).length;
    const badgePct = Math.round((unlockedBadges / BADGES.length) * 100);
    const actChart = _buildEngagementHeatmap(stats);
    const acColor = _colorFor(accuracy);

    let userDisplayName = 'Aventureiro';
    if (window.authUser) {
      userDisplayName = window.authUser.user_metadata?.full_name 
        || window.authUser.user_metadata?.name 
        || window.authUser.email?.split('@')[0] 
        || 'Nefrologista';
    } else if (window._guestMode) {
      userDisplayName = 'Convidado';
    }
    
    const userTitle = getUserTitle(stats.totalCorrect || 0);

    // Calcular dados do SRS (Spaced Repetition System)
    const srsStats = (() => {
      let srData = {};
      try {
        srData = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      } catch (e) {}
      
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const totalBank = (typeof questionBank !== 'undefined' && Array.isArray(questionBank)) ? questionBank.length : 1003;
      
      let dueCount = 0;
      let learningCount = 0;
      let masteredCount = 0;
      
      Object.values(srData).forEach(card => {
        if (card.due <= todayStart) {
          dueCount++;
        }
        if (card.interval >= 15) {
          masteredCount++;
        } else {
          learningCount++;
        }
      });
      
      const newCount = Math.max(0, totalBank - Object.keys(srData).length);
      
      return {
        new: newCount,
        learning: learningCount,
        due: dueCount,
        mastered: masteredCount
      };
    })();

    // Calcular previsão de revisões para os próximos 7 dias
    const forecastHtml = (() => {
      const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      let srData = {};
      try {
        srData = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
      } catch (e) {}

      let maxForecastCount = 1;
      const forecastDays = [];

      for (let i = 0; i < 7; i++) {
        const targetTime = todayStart + i * oneDayMs;
        const targetDate = new Date(targetTime);
        let count = 0;
        
        Object.values(srData).forEach(card => {
          if (i === 0) {
            if (card.due <= todayStart) {
              count++;
            }
          } else {
            const cardDueStart = new Date(card.due).setHours(0, 0, 0, 0);
            if (cardDueStart === targetTime) {
              count++;
            }
          }
        });
        
        if (count > maxForecastCount) {
          maxForecastCount = count;
        }
        
        forecastDays.push({
          count: count,
          dayLabel: i === 0 ? 'Hoje' : weekdays[targetDate.getDay()],
          isToday: i === 0,
          label: i === 0 ? 'Hoje' : `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth()+1).toString().padStart(2, '0')}`
        });
      }

      return `
        <div style="background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:16px 20px; margin-bottom:22px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:var(--txt-dim); margin-bottom:12px; font-weight:700; text-align:center;">🔮 Previsão de Revisões (Próximos 7 dias)</div>
          <div style="display:flex; justify-content:space-between; gap:6px; align-items:flex-end; height:70px; padding-top:10px;">
            ${forecastDays.map(f => {
              const pct = Math.max(8, Math.min(100, (f.count / maxForecastCount) * 100));
              const barBg = f.isToday ? 'linear-gradient(180deg,#ef4444,#b91c1c)' : 'linear-gradient(180deg,#fbbf24,#d97706)';
              const barShadow = f.isToday ? '0 0 8px rgba(239,68,68,0.3)' : '0 0 8px rgba(251,191,36,0.2)';
              return `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
                  <div style="font-size:0.7rem; font-weight:700; color:${f.count > 0 ? (f.isToday ? '#f87171' : '#fbbf24') : 'var(--txt-dim)'}; margin-bottom:4px;">${f.count}</div>
                  <div style="width:100%; max-width:24px; height:${Math.round(pct * 0.45)}px; background:${barBg}; border-radius:3px 3px 0 0; box-shadow:${barShadow};" title="${f.label}: ${f.count} revisões"></div>
                  <div style="font-size:0.6rem; color:var(--txt-dim); margin-top:6px; font-weight:500;">${f.dayLabel}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    })();

    return `
      <!-- Card do Usuário (Perfil Definitivo) -->
      <div class="nq-dash-user-card" style="background:linear-gradient(135deg, rgba(255,215,0,0.08), rgba(124,58,237,0.08)); border:1px solid rgba(255,215,0,0.25); border-radius:14px; padding:16px; margin-bottom:20px; display:flex; align-items:center; gap:16px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
        <div style="font-size:2rem; background:rgba(255,215,0,0.1); border:2px solid var(--gold); border-radius:50%; width:56px; height:56px; display:flex; align-items:center; justify-content:center; flex-shrink:0; text-shadow:0 0 8px rgba(255,215,0,0.4);">
          🎓
        </div>
        <div style="flex:1;">
          <div style="font-family:'Cinzel',serif; font-size:1.05rem; color:var(--gold); font-weight:bold; line-height:1.2;">
            ${escapeHtml(userDisplayName)}
          </div>
          <div style="font-family:'Cinzel',serif; font-size:0.75rem; color:#cbd5e1; text-transform:uppercase; letter-spacing:1px; margin-top:4px;">
            Título: <strong style="color:var(--gold); font-weight:800;">${userTitle}</strong>
          </div>
          <div style="font-size:0.68rem; color:var(--txt-dim); margin-top:5px; line-height:1.3;">
            Status definitivo do usuário (acumulado de todas as suas partidas no NefroQuest)
          </div>
        </div>
      </div>

      <!-- Jornada Ativa (Personagem) -->
      <div class="nq-dash-stitle">Jornada Ativa (Personagem)</div>
      <div class="nq-dash-hero" style="margin-bottom:20px;">
        ${avatarSrc
          ? `<img class="nq-dash-avatar" src="${avatarSrc}" alt="${escapeHtml(charData.name)}" loading="lazy">`
          : `<div class="nq-dash-avatar-ph">⚕️</div>`}
        <div>
          <div class="nq-dash-char-name">${charData ? escapeHtml(charData.name) : 'Sem Personagem'}</div>
          <div class="nq-dash-char-title">${charData ? escapeHtml(charData.title) : 'Nenhum jogo ativo'}</div>
          <div class="nq-dash-char-stats">
            <div class="nq-dash-cs"><em>Nível</em>${state.level || 1}</div>
            <div class="nq-dash-cs"><em>Recorde</em>${bestScore.toLocaleString('pt-BR')}</div>
            <div class="nq-dash-cs"><em>💰</em>${state.gold || 0} ouro</div>
            <div class="nq-dash-cs"><em>✅</em>${state.correctTotal || 0}/100</div>
          </div>
        </div>
        <div class="nq-dash-hero-info-tooltip">i</div>
      </div>

      <!-- KPIs: linha 1 — dados de TODAS as partidas -->
      <div class="nq-dash-stitle">Histórico geral — todas as partidas</div>
      <div class="nq-dash-kpis" style="margin-bottom:14px; grid-template-columns: repeat(4, 1fr);">
        <div class="nq-dash-kpi" style="border-color:rgba(255,215,0,0.15);">
          <div class="nq-dash-kpi-icon">🎮</div>
          <div class="nq-dash-kpi-val" style="color:var(--gold);">${gamesPlayed}</div>
          <div class="nq-dash-kpi-lbl">Partidas jogadas</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(255,215,0,0.15);">
          <div class="nq-dash-kpi-icon">🏆</div>
          <div class="nq-dash-kpi-val" style="color:var(--gold);">${bestScore.toLocaleString('pt-BR')}</div>
          <div class="nq-dash-kpi-lbl">Recorde de score</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(255,215,0,0.15);">
          <div class="nq-dash-kpi-icon">⬆️</div>
          <div class="nq-dash-kpi-val" style="color:var(--gold);">${bestLevel}</div>
          <div class="nq-dash-kpi-lbl">Maior nível</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(255,215,0,0.15);">
          <div class="nq-dash-kpi-icon">📚</div>
          <div class="nq-dash-kpi-val" style="color:var(--gold);">${totalAccumulatedKnowledge.toLocaleString('pt-BR')}</div>
          <div class="nq-dash-kpi-lbl">Conhecimento Total</div>
        </div>
      </div>

      <!-- KPIs: linha 2 — stats de questões (acumulado) -->
      <div class="nq-dash-stitle">Desempenho em questões — acumulado</div>
      <div class="nq-dash-kpis">
        <div class="nq-dash-kpi" style="border-color:rgba(52,211,153,0.15);">
          <div class="nq-dash-kpi-icon">📝</div>
          <div class="nq-dash-kpi-val" style="color:#34d399;">${stats.totalQuestions}</div>
          <div class="nq-dash-kpi-lbl">Questões respondidas</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(${accuracy >= 70 ? '52,211,153' : accuracy >= 50 ? '251,191,36' : '251,113,133'},0.15);">
          <div class="nq-dash-kpi-icon">${accuracy >= 70 ? '🎯' : accuracy >= 50 ? '📈' : '📊'}</div>
          <div class="nq-dash-kpi-val" style="color:${acColor};">${accuracy}%</div>
          <div class="nq-dash-kpi-lbl">Taxa de acerto</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(52,211,153,0.15);">
          <div class="nq-dash-kpi-icon">✅</div>
          <div class="nq-dash-kpi-val" style="color:#34d399;">${stats.totalCorrect}</div>
          <div class="nq-dash-kpi-lbl">Acertos totais</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(251,113,133,0.15);">
          <div class="nq-dash-kpi-icon">❌</div>
          <div class="nq-dash-kpi-val" style="color:#fb7185;">${stats.totalWrong}</div>
          <div class="nq-dash-kpi-lbl">Erros totais</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(99,102,241,0.15);">
          <div class="nq-dash-kpi-icon">⚡</div>
          <div class="nq-dash-kpi-val" style="color:#818cf8;">${maxStreak}</div>
          <div class="nq-dash-kpi-lbl">Maior streak</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(251,191,36,0.15);">
          <div class="nq-dash-kpi-icon">⏱</div>
          <div class="nq-dash-kpi-val" style="color:#fbbf24;">${avgTime > 0 ? avgTime + 's' : '—'}</div>
          <div class="nq-dash-kpi-lbl">Tempo médio/questão</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(192,132,252,0.15);">
          <div class="nq-dash-kpi-icon">📅</div>
          <div class="nq-dash-kpi-val" style="color:var(--purple);">${daysActive}</div>
          <div class="nq-dash-kpi-lbl">Dias de estudo</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(96,165,250,0.15);">
          <div class="nq-dash-kpi-icon">📐</div>
          <div class="nq-dash-kpi-val" style="color:var(--blue);">${axisStats.length}</div>
          <div class="nq-dash-kpi-lbl">Eixos praticados</div>
        </div>
        <div class="nq-dash-kpi" style="border-color:rgba(124,58,237,0.15);">
          <div class="nq-dash-kpi-icon">🔬</div>
          <div class="nq-dash-kpi-val" style="color:var(--purple-light);">${Object.keys(stats.byTopic || {}).length}</div>
          <div class="nq-dash-kpi-lbl">Tópicos vistos</div>
        </div>
      </div>

      ${actChart}

      <!-- Widget de Repetição Espaçada (SRS) -->
      <div class="nq-dash-stitle">Repetição Espaçada (Foco em Memorização)</div>
      <div class="nq-dash-srs-widget" style="background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:16px 20px; margin-bottom:22px; display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; text-align:center; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <div style="border-right:1px solid rgba(255,255,255,0.06); padding:4px;">
          <div style="font-size:1.3rem; margin-bottom:4px;" title="Questões do banco que você ainda não viu">🆕</div>
          <div style="font-size:1.15rem; font-weight:700; color:#3b82f6; font-family:'Cinzel',serif;">${srsStats.new}</div>
          <div style="font-size:0.6rem; color:var(--txt-dim); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Novas</div>
        </div>
        <div style="border-right:1px solid rgba(255,255,255,0.06); padding:4px;">
          <div style="font-size:1.3rem; margin-bottom:4px;" title="Questões vistas recentemente e em processo de fixação">🌱</div>
          <div style="font-size:1.15rem; font-weight:700; color:#fbbf24; font-family:'Cinzel',serif;">${srsStats.learning}</div>
          <div style="font-size:0.6rem; color:var(--txt-dim); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Fixação</div>
        </div>
        <div style="border-right:1px solid rgba(255,255,255,0.06); padding:4px; cursor:pointer;" data-action="_dashStartSRStudy" title="Clique para revisar suas ${srsStats.due} questões agendadas hoje">
          <div style="font-size:1.3rem; margin-bottom:4px;">⏰</div>
          <div style="font-size:1.15rem; font-weight:700; color:#ef4444; font-family:'Cinzel',serif;">${srsStats.due}</div>
          <div style="font-size:0.6rem; color:var(--txt-dim); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; text-decoration:underline;">Revisar Hoje</div>
        </div>
        <div style="padding:4px;">
          <div style="font-size:1.3rem; margin-bottom:4px;" title="Questões retidas com alto intervalo de memorização">👑</div>
          <div style="font-size:1.15rem; font-weight:700; color:var(--gold); font-family:'Cinzel',serif;">${srsStats.mastered}</div>
          <div style="font-size:0.6rem; color:var(--txt-dim); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Retidas</div>
        </div>
      </div>

      ${forecastHtml}

      <div class="nq-dash-stitle">Badges de progressão</div>
      <div class="nq-dash-prow">
        <div class="nq-dash-pbar">
          <div class="nq-dash-pfill" style="width:${badgePct}%;background:linear-gradient(90deg,var(--gold-dark),var(--gold));"></div>
        </div>
        <div class="nq-dash-plbl">${unlockedBadges}/${BADGES.length}</div>
      </div>
      <div class="nq-dash-badges-grid">${BADGES.map(_badgeHtml).join('')}</div>
    `;
  }

  function _tabSkills(axisStats) {
    const stats = getDetailedStats();
    const coreStats = getCoreSkillsStats(stats);
    
    const worstSkill = coreStats
      .filter(s => s.totalAnswered > 0)
      .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100))[0] || null;

    return `
      <div class="nq-dash-stitle">Radar de competências</div>
      <div id="nqDashRadarContainer" style="margin-bottom:20px; min-height:340px; display:flex; justify-content:center; align-items:center;">
        <div style="color:var(--txt-dim); font-size:0.8rem;">Carregando radar...</div>
      </div>

      ${worstSkill ? `
        <button type="button" class="nq-dash-weakness" data-action="_dashGoWeakness">
          ⚠ Ponto fraco: ${escapeHtml(worstSkill.label)}
          — Acurácia: ${worstSkill.accuracy != null ? worstSkill.accuracy.toFixed(0) : 0}%
          &nbsp;→ Treinar agora
        </button>
      ` : ''}

      <div class="nq-dash-stitle">Desempenho por Competência</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${coreStats.map(skill => {
          const hasData = skill.totalAnswered > 0;
          const masteryPct = skill.mastery.toFixed(0);
          const accuracyPct = hasData ? skill.accuracy.toFixed(0) : '0';
          const c = hasData ? _colorFor(skill.accuracy) : '#374151';
          const isWorst = worstSkill && worstSkill.label === skill.label;
          return `
            <div class="nq-dash-skill-card" style="background:${isWorst ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.025)'}; border:${isWorst ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.05)'}; border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; box-shadow:${isWorst ? '0 0 12px rgba(239,68,68,0.15)' : 'none'}; position:relative;">
              ${isWorst ? `<span style="position:absolute; top:-10px; right:14px; background:linear-gradient(135deg, #ef4444, #b91c1c); color:#fff; font-size:0.58rem; font-weight:900; letter-spacing:1px; text-transform:uppercase; padding:2px 8px; border-radius:10px; border:1px solid rgba(239,68,68,0.5); box-shadow:0 2px 4px rgba(0,0,0,0.3);">⚠️ Ponto Fraco</span>` : ''}
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-family:'Cinzel',serif; font-size:0.8rem; font-weight:bold; color:var(--gold);">${escapeHtml(skill.label)}</span>
                <span style="font-size:0.78rem; font-weight:bold; color:#cbd5e1;">
                  ${masteryPct}% Dominado 
                  <small style="color:var(--txt-dim); font-weight:normal; font-size:0.68rem;">
                    (${skill.correct}/${skill.totalBank} q. • acurácia: <span style="color:${hasData ? c : 'var(--txt-dim)'}; font-weight:bold;">${hasData ? accuracyPct + '%' : '—'}</span>)
                  </small>
                </span>
              </div>
              <div style="width:100%; height:5px; background:rgba(255,255,255,0.06); border-radius:2.5px; overflow:hidden;">
                <div style="height:100%; width:${masteryPct}%; background:var(--gold); box-shadow: 0 0 4px var(--gold); border-radius:2.5px; transition:width 0.6s ease;"></div>
              </div>
              <div style="font-size:0.68rem; color:var(--txt-dim); line-height:1.35;">
                ${escapeHtml(skill.desc)}
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:2px;">
                ${skill.subcategories.map(sub => {
                  const subHasData = sub.totalAnswered > 0;
                  const subMasteryPct = sub.mastery.toFixed(0);
                  const subAccuracyPct = subHasData ? `${sub.accuracy.toFixed(0)}%` : '—';
                  const subColor = subHasData ? _colorFor(sub.accuracy) : 'var(--txt-dim)';
                  return `
                    <span style="font-size:0.62rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:2px 5px; color:#cbd5e1;">
                      ${escapeHtml(sub.label)}: <strong>${subMasteryPct}% Dom.</strong> <small style="color:var(--txt-dim);">(${sub.correct}/${sub.totalBank} • acurácia: <strong style="color:${subColor};">${subAccuracyPct}</strong>)</small>
                    </span>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function _tabAchievements() {
    const unlocked = getUnlockedAchievements();
    const unlockedBadges = BADGES.filter(b => (state.correctTotal || 0) >= b.required).length;
    const achPct = Math.round((unlocked.length / ACHIEVEMENTS_LIST.length) * 100);

    return `
      <div class="nq-dash-ach-counter">
        <div class="nq-dash-ach-ring">
          <div class="nq-dash-ach-ringval">${unlocked.length}<small>/${ACHIEVEMENTS_LIST.length}</small></div>
        </div>
        <div style="flex:1;">
          <div class="nq-dash-ach-lbl">Conquistas desbloqueadas</div>
          <div class="nq-dash-prow" style="margin-bottom:0;">
            <div class="nq-dash-pbar" style="height:7px;">
              <div class="nq-dash-pfill" style="width:${achPct}%;background:linear-gradient(90deg,#34d399,#10b981);"></div>
            </div>
            <div class="nq-dash-plbl" style="color:#34d399;">${achPct}%</div>
          </div>
        </div>
      </div>

      <div class="nq-dash-stitle">Badges de progressão</div>
      <div class="nq-dash-prow">
        <div class="nq-dash-pbar">
          <div class="nq-dash-pfill" style="width:${Math.round((unlockedBadges / BADGES.length) * 100)}%;background:linear-gradient(90deg,var(--gold-dark),var(--gold));"></div>
        </div>
        <div class="nq-dash-plbl">${unlockedBadges}/${BADGES.length}</div>
      </div>
      <div class="nq-dash-badges-grid" style="margin-bottom:22px;">${BADGES.map(_badgeHtml).join('')}</div>

      <div class="nq-dash-stitle">Conquistas de gameplay</div>
      <div class="nq-dash-ach-grid">
        ${ACHIEVEMENTS_LIST.map(ach => {
          const on = unlocked.includes(ach.id);
          const icoHtml = ach.imgIcon
            ? `<div class="nq-dash-ach-ico"><img src="${ach.imgIcon}" alt="${escapeHtml(ach.name)}"
                style="${on ? 'filter:drop-shadow(0 0 8px rgba(255,215,0,0.5));' : 'filter:grayscale(1) brightness(0.35);'}"></div>`
            : `<div class="nq-dash-ach-ico" style="${on ? '' : 'filter:grayscale(1) brightness(0.4);'}">${ach.icon}</div>`;
          return `<div class="nq-dash-ach-card ${on ? 'on' : 'off'}">
            ${icoHtml}
            <div style="flex:1;min-width:0;">
              <div class="nq-dash-ach-name">${escapeHtml(ach.name)}</div>
              <div class="nq-dash-ach-desc">${escapeHtml(ach.description)}</div>
            </div>
            ${on ? '<div class="nq-dash-ach-check">✓</div>' : ''}
          </div>`;
        }).join('')}
      </div>
    `;
  }

  function _tabRanking() {
    return `
      <div class="nq-dash-lb-head">
        <input type="search" class="nq-dash-lb-search" id="nqDashLbSearch" placeholder="Buscar jogador…">
        <button type="button" class="btn sec" style="font-size:0.68rem;padding:5px 13px;white-space:nowrap;" data-action="_dashRefreshRanking">↻ Atualizar</button>
      </div>
      <div id="nqDashLbWrap"><div class="nq-dash-lb-spin">Carregando ranking…</div></div>
    `;
  }

  // ── Load ranking ─────────────────────────────────────────────────────────
  let _lbFullData = [];

  function _renderLbRows(wrap, data, query) {
    wrap.innerHTML = '';
    const q = (query || '').trim().toLowerCase();
    const filtered = data.filter(r =>
      !q || (r.player_name || '').toLowerCase().includes(q) || (r.character_name || '').toLowerCase().includes(q)
    );
    if (!filtered.length) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'nq-dash-lb-spin';
      emptyDiv.style.padding = '24px';
      emptyDiv.textContent = 'Nenhum resultado encontrado.';
      wrap.appendChild(emptyDiv);
      return;
    }
    const rl = ['🥇', '🥈', '🥉'];
    const rc = ['r1', 'r2', 'r3'];

    const table = document.createElement('table');
    table.className = 'nq-dash-lb-table';

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    
    const thRank = document.createElement('th');
    thRank.style.width = '36px';
    thRank.textContent = '#';
    
    const thPlayer = document.createElement('th');
    thPlayer.textContent = 'Jogador';
    
    const thClass = document.createElement('th');
    thClass.style.display = 'none';
    thClass.textContent = 'Classe';
    
    const thScore = document.createElement('th');
    thScore.style.textAlign = 'right';
    thScore.textContent = 'Score';
    
    const thLevel = document.createElement('th');
    thLevel.style.textAlign = 'center';
    thLevel.style.width = '50px';
    thLevel.textContent = 'Nível';

    trHead.appendChild(thRank);
    trHead.appendChild(thPlayer);
    trHead.appendChild(thClass);
    trHead.appendChild(thScore);
    trHead.appendChild(thLevel);
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    filtered.forEach((r, i) => {
      const me = state.lastSubmittedName && r.player_name === state.lastSubmittedName;
      const tr = document.createElement('tr');
      if (me) tr.className = 'lb-me';

      // rank td
      const tdRank = document.createElement('td');
      const spanRank = document.createElement('span');
      spanRank.className = `nq-dash-rank ${i < 3 ? rc[i] : ''}`;
      spanRank.textContent = i < 3 ? rl[i] : String(i + 1);
      tdRank.appendChild(spanRank);
      tr.appendChild(tdRank);

      // player td
      const tdPlayer = document.createElement('td');
      if (me) {
        tdPlayer.style.color = 'var(--gold)';
        tdPlayer.style.fontWeight = '700';
      }
      tdPlayer.appendChild(document.createTextNode(r.player_name || 'Anônimo'));
      
      if (r.character_name) {
        const spanChar = document.createElement('span');
        spanChar.style.color = 'var(--txt-dim)';
        spanChar.style.fontSize = '0.68rem';
        spanChar.style.marginLeft = '4px';
        spanChar.textContent = r.character_name;
        tdPlayer.appendChild(spanChar);
      }
      tr.appendChild(tdPlayer);

      // class td (hidden)
      const tdClass = document.createElement('td');
      tdClass.style.display = 'none';
      tr.appendChild(tdClass);

      // score td
      const tdScore = document.createElement('td');
      tdScore.className = 'nq-dash-lb-score';
      tdScore.textContent = (r.score || 0).toLocaleString('pt-BR');
      tr.appendChild(tdScore);

      // level td
      const tdLevel = document.createElement('td');
      tdLevel.style.textAlign = 'center';
      tdLevel.style.color = 'var(--txt-dim)';
      tdLevel.textContent = r.level || 1;
      tr.appendChild(tdLevel);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    const tsDiv = document.createElement('div');
    tsDiv.className = 'nq-dash-lb-ts';
    tsDiv.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    wrap.appendChild(tsDiv);
  }

  async function _loadRanking(force) {
    const wrap = document.getElementById('nqDashLbWrap');
    if (!wrap) return;
    wrap.innerHTML = '<div class="nq-dash-lb-spin">Carregando ranking…</div>';
    try {
      const data = await boardFetch(!!force);
      _lbFullData = (data || []).slice(0, 50);
      if (!_lbFullData.length) {
        wrap.innerHTML = '<div class="nq-dash-lb-spin">Nenhuma pontuação registrada ainda.</div>';
        return;
      }
      _renderLbRows(wrap, _lbFullData, '');
      // Wire search
      const searchEl = document.getElementById('nqDashLbSearch');
      if (searchEl && !searchEl.dataset.wired) {
        searchEl.dataset.wired = '1';
        let _t;
        searchEl.addEventListener('input', () => {
          clearTimeout(_t);
          _t = setTimeout(() => {
            const w = document.getElementById('nqDashLbWrap');
            if (w) _renderLbRows(w, _lbFullData, searchEl.value);
          }, 200);
        });
      }
    } catch (e) {
      if (wrap) wrap.innerHTML = '<div class="nq-dash-lb-spin">Erro ao carregar ranking.</div>';
    }
  }

  function _tabHistory() {
    return `
      <div class="nq-dash-stitle">Histórico & Explorador de Questões</div>
      <div class="nq-dash-history-container" style="display:flex; flex-direction:column; gap:16px; height:100%;">
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; background:rgba(255,255,255,0.02); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:12px; width:100%;">
          <!-- Campo de Busca -->
          <div style="position:relative; flex:1; min-width:200px;">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--txt-dim); font-size:0.9rem;">🔍</span>
            <input type="text" id="nqHistorySearch" placeholder="Pesquisar por termo (ex: IgA, Lupus, iSGLT2)..." style="width:100%; padding:8px 12px 8px 36px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:0.85rem; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
          </div>
          <!-- Botão Buscar -->
          <button type="button" id="nqHistorySearchBtn" style="flex-shrink:0; padding:8px 18px; background:linear-gradient(180deg,#7c3aed,#5b21b6); border:1px solid #a855f7; border-radius:8px; color:#f3e8ff; font-size:0.82rem; font-weight:700; font-family:'Cinzel',serif; letter-spacing:0.5px; cursor:pointer;">🔍 Buscar</button>
          <!-- Filtro Apenas Erros Recentes -->
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.8rem; color:var(--txt-dim); user-select:none;">
            <input type="checkbox" id="nqHistoryErrorsOnly" style="cursor:pointer; width:16px; height:16px; accent-color:var(--gold);">
            Apenas Erros Recentes
          </label>
        </div>

        <!-- Lista de Questões -->
        <div id="nqHistoryList" style="flex:1; overflow-y:auto; max-height:420px; display:flex; flex-direction:column; gap:10px; padding-right:4px;">
          <div style="color:var(--txt-dim); font-size:0.85rem; text-align:center; padding:24px;">Carregando histórico...</div>
        </div>
      </div>
    `;
  }

  async function _initHistorySearchListeners(overlay) {
    const searchInput = overlay.querySelector('#nqHistorySearch');
    const errorsCheckbox = overlay.querySelector('#nqHistoryErrorsOnly');
    const searchBtn = overlay.querySelector('#nqHistorySearchBtn');
    const listContainer = overlay.querySelector('#nqHistoryList');
    if (!listContainer) return;

    // Garante o banco de questões carregado — necessário para casar os qids do
    // histórico com as questões reais (e exibir título/opções/explicação).
    if (typeof topics === 'undefined' && typeof window._loadTopics === 'function') {
      listContainer.innerHTML = `<div style="color:var(--txt-dim); font-size:0.85rem; text-align:center; padding:24px;">Carregando banco de questões…</div>`;
      try { await window._loadTopics(); } catch (e) {}
    }

    // Obter dados de histórico
    const stats = getDetailedStats();
    
    // Obter IDs respondidos
    let allAnsweredQids = [];
    try {
      allAnsweredQids = JSON.parse(localStorage.getItem('nefroquest-all-answered-qids') || '[]');
    } catch (e) {}

    // Fallbacks para compatibilidade retroativa
    const seenSet = new Set(allAnsweredQids);
    if (stats.questionHistory && Array.isArray(stats.questionHistory)) {
      stats.questionHistory.forEach(h => { if (h.qid) seenSet.add(h.qid); });
    }
    
    let srData = {};
    try {
      srData = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}');
    } catch (e) {}
    Object.keys(srData).forEach(qid => seenSet.add(qid));

    let mastered = [];
    try {
      mastered = JSON.parse(localStorage.getItem('nefroquest-mastered-ids') || '[]');
    } catch (e) {}
    mastered.forEach(qid => seenSet.add(qid));

    // Pegar questões reais. Usa SEMPRE `topics` (schema completo: qid, t, opts,
    // ans, cat, exp). O `questionBank` (deck do jogo) usa schema abreviado
    // (id/o/a/e/c, sem `qid`) e quebraria o casamento por qid + a exibição.
    const bank = (typeof topics !== 'undefined' && Array.isArray(topics)) ? topics : [];
    const answeredQuestions = bank.filter(q => seenSet.has(q.qid));

    // Mapear último resultado de acerto/erro
    const lastResultMap = {}; // qid -> boolean (correct)
    if (stats.questionHistory && Array.isArray(stats.questionHistory)) {
      for (let i = stats.questionHistory.length - 1; i >= 0; i--) {
        const h = stats.questionHistory[i];
        if (h.qid) {
          lastResultMap[h.qid] = h.correct;
        }
      }
    }
    // Mapear também se está no mastered (então o último resultado correto é true)
    mastered.forEach(qid => {
      if (lastResultMap[qid] === undefined) {
        lastResultMap[qid] = true;
      }
    });

    function renderList() {
      const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const errorsOnly = errorsCheckbox ? errorsCheckbox.checked : false;

      const filtered = answeredQuestions.filter(q => {
        // Filtro de erro
        const isCorrect = lastResultMap[q.qid] !== false; // Considera correto se não houver erro registrado
        if (errorsOnly && isCorrect) return false;

        // Filtro de busca textual
        if (query) {
          const matchQ = (q.q || '').toLowerCase().includes(query);
          const matchT = (q.t || '').toLowerCase().includes(query);
          const matchExp = (q.exp || q.e || '').toLowerCase().includes(query);
          if (!matchQ && !matchT && !matchExp) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = `<div style="color:var(--txt-dim); font-size:0.8rem; text-align:center; padding:32px;">Nenhuma questão encontrada no histórico para os filtros atuais.</div>`;
        return;
      }

      listContainer.innerHTML = filtered.map(q => {
        const isCorrect = lastResultMap[q.qid] !== false;
        const badgeClass = isCorrect ? 'correct' : 'wrong';
        const badgeText = isCorrect ? 'Acerto' : 'Erro';
        
        return `
          <div class="nq-hist-item" data-qid="${q.qid}">
            <div class="nq-hist-item-header">
              <div>
                <span style="font-size:0.6rem; text-transform:uppercase; letter-spacing:0.5px; background:rgba(255,215,0,0.08); color:var(--gold); border:1px solid rgba(255,215,0,0.15); padding:2px 6px; border-radius:4px; margin-right:8px;">${escapeHtml(q.cat || 'Geral')}</span>
                <span class="nq-hist-item-title">${escapeHtml(q.t || 'Sem título')}</span>
              </div>
              <span class="nq-hist-item-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="nq-hist-item-details" style="display:none;">
              <div class="nq-hist-item-qtext">${escapeHtml(q.q)}</div>
              <div class="nq-hist-item-opts">
                ${q.opts.map((opt, oIdx) => {
                  const isOptCorrect = oIdx === q.ans;
                  const optClass = isOptCorrect ? 'correct' : 'normal';
                  const prefix = String.fromCharCode(65 + oIdx) + ') ';
                  return `<div class="nq-hist-item-opt ${optClass}">${prefix}${escapeHtml(opt)}</div>`;
                }).join('')}
              </div>
              <div class="nq-hist-item-exp">
                <div style="margin-bottom:4px; font-weight:bold; color:var(--gold);">Explicação:</div>
                <div>${escapeHtml(q.exp || q.e || 'Sem explicação.')}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Toggle expansion on item click
    listContainer.addEventListener('click', e => {
      const header = e.target.closest('.nq-hist-item-header');
      if (header) {
        const item = header.parentElement;
        const details = item.querySelector('.nq-hist-item-details');
        if (details) {
          const isExpanded = item.classList.contains('expanded');
          item.classList.toggle('expanded');
          details.style.display = isExpanded ? 'none' : 'block';
        }
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', renderList);
      searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); renderList(); } });
    }
    if (searchBtn) searchBtn.addEventListener('click', renderList);
    if (errorsCheckbox) errorsCheckbox.addEventListener('change', renderList);

    // Initial render
    renderList();
  }

  // ── Main open ────────────────────────────────────────────────────────────
  async function openDashboard() {
    _injectStyles();
    document.getElementById('nqDashboard')?.remove();
    document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));

    // Criar o contêiner com estado de carregamento inicial
    const overlay = document.createElement('div');
    overlay.id = 'nqDashboard';
    overlay.className = 'nq-dash-overlay';
    overlay.innerHTML = `
      <div class="nq-dash-panel" style="display:flex; justify-content:center; align-items:center; min-height:400px;">
        <div style="text-align:center; color:var(--gold);">
          <div class="nq-dash-lb-spin" style="margin:0 auto 12px auto; width:30px; height:30px; border:3px solid rgba(255,215,0,0.15); border-top-color:var(--gold); border-radius:50%; animation:nq-dash-spin 0.8s linear infinite;"></div>
          <div style="font-family:'Cinzel',serif; font-size:0.9rem; font-weight:bold;">Carregando Perfil...</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Permitir fechar no backdrop mesmo enquanto carrega (desabilitado para evitar fechar por engano)
    // overlay.addEventListener('click', e => { if (e.target === overlay) closeDashboard(); });

    // Forçar carregamento das questões e sincronização
    if (typeof window._loadTopics === 'function') {
      try {
        await window._loadTopics();
      } catch (e) {
        console.error('[NQ] Failed to load topics for dashboard', e);
      }
    }
    if (typeof window.syncMasteredToDetailedStats === 'function') {
      window.syncMasteredToDetailedStats();
    }

    const stats = getDetailedStats();
    const axisStats = getAxisStats(stats);

    overlay.innerHTML = `
      <div class="nq-dash-panel">
        <div class="nq-dash-header">
          <div class="nq-dash-title">
            <span class="nq-dash-title-icon">⚔</span>
            Perfil do Nefrologista
          </div>
          <button type="button" class="nq-dash-close" data-action="closeDashboard" aria-label="Fechar">×</button>
        </div>

        <div class="nq-dash-tabs">
          <button type="button" class="nq-dash-tab active" data-dash-tab="overview">Visão Geral</button>
          <button type="button" class="nq-dash-tab" data-dash-tab="skills">Skills</button>
          <button type="button" class="nq-dash-tab" data-dash-tab="history">Histórico</button>
          <button type="button" class="nq-dash-tab" data-dash-tab="achievements">Conquistas</button>
          <button type="button" class="nq-dash-tab" data-dash-tab="ranking">Ranking</button>
        </div>

        <div class="nq-dash-body">
          <div class="nq-dash-pane active" data-dash-pane="overview">
            ${_tabOverview(stats, axisStats)}
          </div>
          <div class="nq-dash-pane" data-dash-pane="skills">
            ${_tabSkills(axisStats)}
          </div>
          <div class="nq-dash-pane" data-dash-pane="history">
            ${_tabHistory()}
          </div>
          <div class="nq-dash-pane" data-dash-pane="achievements">
            ${_tabAchievements()}
          </div>
          <div class="nq-dash-pane" data-dash-pane="ranking">
            ${_tabRanking()}
          </div>
        </div>
      </div>
    `;

    // Recriar listeners da aba
    overlay.querySelectorAll('[data-dash-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.dashTab;
        overlay.querySelectorAll('[data-dash-tab]').forEach(b => b.classList.toggle('active', b.dataset.dashTab === tab));
        overlay.querySelectorAll('[data-dash-pane]').forEach(p => p.classList.toggle('active', p.dataset.dashPane === tab));
        if (tab === 'skills') setTimeout(() => _drawRadar(axisStats), 50);
        if (tab === 'ranking') _loadRanking(false);
        if (tab === 'history') _initHistorySearchListeners(overlay);
      });
    });

    if (typeof playSound === 'function') playSound('click');
  }

  function closeDashboard() {
    document.getElementById('nqDashboard')?.remove();
  }

  function _dashRefreshRanking() {
    _loadRanking(true);
  }

  function getUserTitle(totalCorrect) {
    if (totalCorrect >= 1500) return 'Grão-Mestre da Uremia 👑';
    if (totalCorrect >= 800)  return 'Conselheiro Renal 🫁';
    if (totalCorrect >= 400)  return 'Patrono dos Glomérulos 🧪';
    if (totalCorrect >= 150)  return 'Erudito do Equilíbrio 📚';
    if (totalCorrect >= 50)   return 'Escriba dos Rins ✍️';
    if (totalCorrect >= 15)   return 'Nefro-Iniciado 🛡️';
    return 'Aspirante da Guilda 🧭';
  }

  async function _dashGoWeakness() {
    closeDashboard();

    if (typeof topics === 'undefined') {
      if (typeof _toast === 'function') _toast('Carregando questões…', 'info', 30000);
      try {
        await window._loadTopics();
        document.querySelector('.nq-toast')?.remove();
      } catch (e) {
        if (typeof _toast === 'function') _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000);
        return;
      }
    }

    const stats = getDetailedStats();
    const coreStats = getCoreSkillsStats(stats);
    const worstSkill = coreStats
      .filter(s => s.totalAnswered > 0)
      .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100))[0] || null;

    if (!worstSkill) {
      if (typeof _toast === 'function') _toast('Não há histórico suficiente para identificar um ponto fraco.', 'info');
      return;
    }

    // Definir eixos selecionados no modo de estudo
    if (typeof window._studySelectedAxes !== 'undefined') {
      window._studySelectedAxes.clear();
      worstSkill.categories.forEach(cat => {
        window._studySelectedAxes.add(cat);
      });
    }

    if (typeof window.startStudyMode === 'function') {
      window.startStudyMode();
    } else {
      if (typeof _toast === 'function') _toast('Erro ao iniciar o Modo de Estudo.', 'error');
    }
  }

  function _dashStartSRStudy() {
    closeDashboard();
    if (typeof window.startSRStudyAllMode === 'function') {
      window.startSRStudyAllMode();
    } else {
      if (typeof _toast === 'function') _toast('Erro ao iniciar a Revisão Espaçada.', 'error');
    }
  }

  window.openDashboard       = openDashboard;
  window.closeDashboard      = closeDashboard;
  window._dashRefreshRanking = _dashRefreshRanking;
  window._dashGoWeakness     = _dashGoWeakness;
  window._dashStartSRStudy   = _dashStartSRStudy;
  window.getUserTitle        = getUserTitle;
})();
