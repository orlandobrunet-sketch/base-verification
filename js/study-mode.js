// NefroQuest — Study Mode (topic selector, trails, spaced-repetition UI)
// Loaded before game.js. All functions become global.

    function getSRDueCount() {
      const selectedCats = new Set();
      NEFRO_AXES.forEach(ax => { if (_studySelectedAxes.has(ax.id)) selectedCats.add(ax.cat); });
      return getSRDueQuestions(topics.filter(q => selectedCats.has(q.cat))).length;
    }
    /* Revisão a partir da Central, sem passar pelo seletor de eixos.
     *
     * `_studySelectedAxes` nasce vazio e só é preenchido quando o seletor abre.
     * Um botão de revisar na Central que chamasse startSRStudyMode() direto
     * cairia no aviso "Selecione pelo menos um eixo" — pedindo uma escolha que
     * a pessoa não fez porque nem viu a tela onde ela existe.
     *
     * Revisão vencida não é recorte temático: é o que a memória pede hoje,
     * venha de onde vier. Aqui todos os eixos entram e a sessão começa. */
    function startSRReviewAll() {
      _studySelectedAxes.clear();
      NEFRO_AXES.forEach(ax => _studySelectedAxes.add(ax.id));
      startSRStudyMode();
    }

    function startSRStudyMode() {
      if (_studySelectedAxes.size === 0) { _toast('Selecione pelo menos um eixo!', 'warning'); return; }
      const selectedCats = new Set();
      NEFRO_AXES.forEach(ax => { if (_studySelectedAxes.has(ax.id)) selectedCats.add(ax.cat); });
      const due = getSRDueQuestions(topics.filter(q => selectedCats.has(q.cat)));
      if (due.length === 0) {
        _toast('Sem revisões pendentes hoje. Volte amanhã ou use o Estudo Livre.', 'info', 4000);
        return;
      }
      studyModeQuestions = shuffle(due);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      _studyAxisStats = {};
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      showStudyModePage();
    }

    const NEFRO_AXES = [
      { id: 'drc',                  icon: '🪴', label: 'DRC',                      cat: 'drc' },
      { id: 'lra',                  icon: '⚠️', label: 'Lesão Renal Aguda',       cat: 'lra' },
      { id: 'glomerular',           icon: '🔬', label: 'Glomerulopatias',           cat: 'glomerular' },
      { id: 'eletrólitos',          icon: '⚡', label: 'Distúrbios Eletrolíticos',  cat: 'eletrólitos' },
      { id: 'acido_base',           icon: '🧪', label: 'Ácido-Base',               cat: 'acido_base' },
      { id: 'dialise',              icon: '💉', label: 'Diálise',                   cat: 'dialise' },
      { id: 'transplante',          icon: '🫀', label: 'Transplante Renal',         cat: 'transplante' },
      { id: 'hipertensao',          icon: '❤️', label: 'Hipertensão',               cat: 'hipertensao' },
      { id: 'nefropatia_diabetica', icon: '🩸', label: 'Nefropatia Diabética',      cat: 'nefropatia_diabetica' },
      { id: 'infeccao',             icon: '🦠', label: 'Infecção Renal',            cat: 'infeccao' },
      { id: 'litíase',              icon: '💎', label: 'Litíase Renal',             cat: 'litíase' },
      { id: 'farmacologia',         icon: '💊', label: 'Farmacologia',              cat: 'farmacologia' },
      { id: 'genetica',             icon: '🧬', label: 'Genética Renal',            cat: 'genetica' },
      { id: 'uti',                  icon: '🏥', label: 'UTI / Crítico',             cat: 'uti' },
      { id: 'oncologia_renal',      icon: '🎗️', label: 'Oncologia Renal',           cat: 'oncologia_renal' },
      { id: 'nefrologia_geral',     icon: '📚', label: 'Nefrologia Geral',          cat: 'nefrologia_geral' },
    ];

    // Eixos por DOMÍNIO CLÍNICO, não por agrupamento residual de categorias.
    //
    // O recorte anterior produzia três leituras clinicamente falsas: sódio e
    // potássio — as decisões mais tempo-críticas da especialidade — rotulados
    // como "Pesquisa"; LRA, que é uma doença, classificada como "terapia de
    // suporte" ao lado da máquina; e um eixo chamado "Diagnóstico" que media
    // litíase e oncologia, apoiado numa categoria `diagnostico` que não existe
    // no banco (0 questões).
    //
    // Glomerulopatia saiu de junto de transplante: as duas compartilham
    // imunossupressor, não competência — Banff, DSA, fase de CMV e nível de
    // calcineurínico não têm análogo glomerular. E glomerular é a maior
    // categoria do banco (142), não apêndice de um eixo de 44.
    //
    // A soma cobre as 16 categorias reais, sem sobra nem duplicata.
    const CORE_SKILLS = [
      {
        id: 'glomerulopatias',
        label: 'Glomerulopatias',
        categories: ['glomerular'],
        desc: 'Síndromes glomerulares, classificação histológica, imunofluorescência e terapia imunossupressora dirigida.'
      },
      {
        id: 'hidroeletrolitico_acidobase',
        label: 'Hidroeletrolítico e ácido-base',
        categories: ['eletrólitos', 'acido_base'],
        desc: 'Distúrbios do sódio, potássio, cálcio e magnésio; acidoses, alcaloses e interpretação de gasometria.'
      },
      {
        id: 'drc_nefroprotecao',
        label: 'DRC, nefroproteção e HAS',
        categories: ['drc', 'hipertensao', 'nefropatia_diabetica'],
        desc: 'Estadiamento e progressão da doença renal crônica, controle pressórico e terapia de nefroproteção.'
      },
      {
        id: 'nefrologia_geral_diagnostico',
        label: 'Nefrologia geral e diagnóstico',
        categories: ['nefrologia_geral', 'genetica', 'litíase', 'oncologia_renal', 'farmacologia', 'infeccao'],
        desc: 'Propedêutica e biópsia, doenças genéticas e císticas, litíase, oncologia renal, infecção e farmacologia renal.'
      },
      {
        id: 'lra_critico',
        label: 'LRA e paciente crítico',
        categories: ['lra', 'uti'],
        desc: 'Causas e diagnóstico da lesão renal aguda, nefrotoxicidade e manejo renal no paciente crítico.'
      },
      {
        id: 'dialise',
        label: 'Diálise',
        categories: ['dialise'],
        desc: 'Hemodiálise, hemodiafiltração, diálise peritoneal, acesso vascular, adequação e complicações.'
      },
      {
        id: 'transplante',
        label: 'Transplante renal',
        categories: ['transplante'],
        desc: 'Seleção e indução, imunossupressão de manutenção, rejeição, infecções oportunistas e função do enxerto.'
      }
    ];
    window.CORE_SKILLS = CORE_SKILLS;

    function getCoreSkillsStats(detailedStats) {
      // Contar totais do banco
      const totalBankByCat = {};
      if (typeof questionBank !== 'undefined' && Array.isArray(questionBank)) {
        questionBank.forEach(q => {
          const cat = q.c || 'geral';
          totalBankByCat[cat] = (totalBankByCat[cat] || 0) + 1;
        });
      } else {
        // Fallback estático se o banco não estiver carregado (baseado nos 1003 atuais)
        const staticTotals = {
          dialise: 96, hipertensao: 30, nefropatia_diabetica: 46, acido_base: 54,
          drc: 135, glomerular: 209, transplante: 66, 'eletrólitos': 118,
          genetica: 44, lra: 61, oncologia_renal: 8, nefrologia_geral: 37,
          'litíase': 24, farmacologia: 37, infeccao: 21, uti: 17
        };
        Object.assign(totalBankByCat, staticTotals);
      }

      return CORE_SKILLS.map(skill => {
        let correct = 0;
        let wrong = 0;
        let totalAnswered = 0;
        let totalBank = 0;

        skill.categories.forEach(cat => {
          const d = (detailedStats.byCategory || {})[cat] || { correct: 0, wrong: 0 };
          correct += d.correct || 0;
          wrong += d.wrong || 0;
          totalBank += totalBankByCat[cat] || 0;
        });

        totalAnswered = correct + wrong;
        
        // A acurácia das questões respondidas (para os cards de detalhe)
        const accuracy = totalAnswered > 0 ? (correct / totalAnswered * 100) : null;
        
        // A taxa de domínio / progresso sobre o total do jogo (para o gráfico de radar)
        const mastery = totalBank > 0 ? (correct / totalBank * 100) : 0;

        const subcategories = skill.categories.map(cat => {
          const d = (detailedStats.byCategory || {})[cat] || { correct: 0, wrong: 0 };
          const totAnswered = d.correct + d.wrong;
          const totBank = totalBankByCat[cat] || 0;
          const label = NEFRO_AXES.find(a => a.cat === cat)?.label || cat;
          return {
            cat,
            label: label.replace(' & KDIGO', ''),
            correct: d.correct,
            totalAnswered: totAnswered,
            totalBank: totBank,
            accuracy: totAnswered > 0 ? (d.correct / totAnswered * 100) : null,
            mastery: totBank > 0 ? (d.correct / totBank * 100) : 0
          };
        });

        return {
          id: skill.id,
          label: skill.label,
          desc: skill.desc,
          correct,
          wrong,
          totalAnswered,
          totalBank,
          accuracy,
          mastery,
          categories: skill.categories,
          subcategories
        };
      });
    }
    window.getCoreSkillsStats = getCoreSkillsStats;

    function drawRadarChart(container, coreStats) {
      if (!container) return;
      
      function _colorFor(pct) {
        if (pct == null) return 'var(--txt-dim)';
        return pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185';
      }

      container.innerHTML = '';
      container.className = 'nq-radar-container-wrap';
      container.style.cssText = 'position:relative; width:320px; height:320px; margin:0 auto; display:flex; justify-content:center; align-items:center;';


      // Injetar estilos do Tooltip se não existirem
      if (!document.getElementById('nqRadarTooltipStyles')) {
        const s = document.createElement('style');
        s.id = 'nqRadarTooltipStyles';
        s.textContent = `
          .nq-radar-tooltip {
            position: absolute;
            z-index: 100005;
            background: rgba(10, 15, 30, 0.98);
            border: 1px solid rgba(168, 85, 247, 0.45);
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 0.75rem;
            color: #cbd5e1;
            max-width: 260px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease;
            line-height: 1.4;
          }
          .nq-radar-tooltip.visible {
            opacity: 1;
          }
          .nq-radar-label {
            position: absolute;
            font-size: 0.72rem;
            font-family: 'Cinzel', serif;
            font-weight: bold;
            color: var(--gold);
            white-space: nowrap;
            cursor: help;
            transition: color 0.15s, text-shadow 0.15s;
            text-shadow: 0 1px 2px rgba(0,0,0,0.7);
          }
          .nq-radar-label:hover {
            color: #fff;
            text-shadow: 0 0 8px rgba(255,215,0,0.8);
          }
        `;
        document.head.appendChild(s);
      }

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      canvas.style.maxWidth = '320px';
      canvas.style.width = '100%';
      canvas.style.display = 'block';
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      const cx = 160, cy = 160;
      const r = 108; // raio calculado para caber perfeitamente no container de 320px com margem
      const n = coreStats.length;

      ctx.clearRect(0, 0, 320, 320);

      // Anéis concêntricos (25%, 50%, 75%, 100%)
      [0.25, 0.5, 0.75, 1].forEach(pct => {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * pct * Math.cos(a), y = cy + r * pct * Math.sin(a);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = pct === 1 ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Linhas dos eixos (spokes)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        ctx.strokeStyle = 'rgba(139,92,246,0.18)';
        ctx.stroke();
      }

      // Polígono dos dados
      ctx.beginPath();
      coreStats.forEach((skill, i) => {
        const pct = skill.mastery / 100;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * pct * Math.cos(a), y = cy + r * pct * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(168,85,247,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(168,85,247,0.85)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Nós de dados (dots)
      coreStats.forEach((skill, i) => {
        const pct = skill.mastery / 100;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const dx = cx + r * pct * Math.cos(a), dy = cy + r * pct * Math.sin(a);
        ctx.beginPath();
        ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.strokeStyle = '#080d1a';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });

      // Criar rótulos HTML radialmente
      coreStats.forEach((skill, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const labelR = r + 16;
        const x = cx + labelR * cos;
        const y = cy + labelR * sin;
        
        let translate = 'translate(-50%, -50%)';
        let textAlign = 'center';
        
        if (cos > 0.4) {
          translate = 'translate(0, -50%)';
          textAlign = 'left';
        } else if (cos < -0.4) {
          translate = 'translate(-100%, -50%)';
          textAlign = 'right';
        } else if (sin < -0.8) {
          translate = 'translate(-50%, -100%)';
          textAlign = 'center';
        } else if (sin > 0.8) {
          translate = 'translate(-50%, 0)';
          textAlign = 'center';
        }

        const labelDiv = document.createElement('div');
        labelDiv.className = 'nq-radar-label';
        labelDiv.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:${translate};text-align:${textAlign};`;
        
        const masteryStr = `${skill.mastery.toFixed(0)}%`;
        labelDiv.textContent = `${skill.label} (${masteryStr})`;
        
        const tooltipHtml = `
          <div style="font-weight:bold;color:var(--gold);margin-bottom:4px;font-family:'Cinzel',serif;">${skill.label}</div>
          <div style="font-size:0.68rem;color:var(--txt-dim);margin-bottom:8px;line-height:1.35;">${skill.desc}</div>
          <div style="font-size:0.72rem;color:#fff;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px;line-height:1.4;">
            Domínio: <strong class="nq-text-gold">${skill.mastery.toFixed(0)}%</strong> (${skill.correct}/${skill.totalBank} q.)<br>
            Acurácia: <strong style="color:${_colorFor(skill.accuracy)};">${skill.totalAnswered > 0 ? skill.accuracy.toFixed(0) + '%' : '—'}</strong> (${skill.correct}/${skill.totalAnswered} resp.)
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;min-width:200px;">
            ${skill.subcategories.map(sub => {
              const subPctStr = sub.totalAnswered > 0 ? `${sub.accuracy.toFixed(0)}%` : '—';
              const subCountStr = `(${sub.correct}/${sub.totalBank})`;
              const subColor = sub.totalAnswered > 0 ? _colorFor(sub.accuracy) : 'var(--txt-dim)';
              return `
                <div style="display:flex;justify-content:space-between;gap:12px;font-size:0.72rem;line-height:1.3;">
                  <span style="color:#e2e8f0;">• ${sub.label}</span>
                  <span style="color:#fff;font-weight:bold;">${sub.mastery.toFixed(0)}% <small style="color:var(--txt-dim);font-weight:normal;">${subCountStr}</small> &nbsp;<span style="color:${subColor};font-weight:bold;">${subPctStr}</span></span>
                </div>
              `;
            }).join('')}
          </div>
        `;
        labelDiv.dataset.tooltip = tooltipHtml;
        container.appendChild(labelDiv);
      });

      // Ligar eventos do Tooltip
      container.querySelectorAll('.nq-radar-label').forEach(label => {
        label.addEventListener('mouseenter', (e) => {
          const tooltipHtml = label.dataset.tooltip;
          let tooltip = document.getElementById('nqRadarTooltip');
          if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'nqRadarTooltip';
            tooltip.className = 'nq-radar-tooltip';
            document.body.appendChild(tooltip);
          }
          tooltip.innerHTML = tooltipHtml;
          tooltip.classList.add('visible');
        });
        
        label.addEventListener('mousemove', (e) => {
          const tooltip = document.getElementById('nqRadarTooltip');
          if (tooltip) {
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY + 15) + 'px';
          }
        });
        
        label.addEventListener('mouseleave', () => {
          const tooltip = document.getElementById('nqRadarTooltip');
          if (tooltip) {
            tooltip.classList.remove('visible');
          }
        });
      });

      const obs = new MutationObserver(() => {
        if (!document.contains(container)) {
          const tooltip = document.getElementById('nqRadarTooltip');
          if (tooltip) tooltip.remove();
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
    window.drawRadarChart = drawRadarChart;

    function getAxisStats(stats) {
      return NEFRO_AXES.map(axis => {
        const d = (stats.byCategory || {})[axis.cat] || { correct: 0, wrong: 0, total: 0 };
        const { correct, wrong, total } = d;
        const accuracy = total > 0 ? ((correct / total) * 100) : null;
        return { ...axis, correct, wrong, total, accuracy };
      }).filter(a => a.total > 0)
        .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100)); // piores primeiro
    }

    // ── Notificações de estudo ──────────────────────────────────────────────
    async function enableStudyReminders() {
      if (!('Notification' in window)) {
        _toast('Seu navegador não suporta notificações.', 'error'); return;
      }
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          _toast('Permissão negada. Ative nas configurações do navegador.', 'warning'); return;
        }
        localStorage.setItem('nq_notif_enabled', '1');
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if ('periodicSync' in reg) {
            await reg.periodicSync.register('nq-study-reminder', { minInterval: 20 * 60 * 60 * 1000 }).catch(() => {});
          }
        }
        _toast('Lembretes de estudo ativados!', 'success');
      } catch { _toast('Não foi possível ativar lembretes. Tente novamente.', 'error'); }
    }
    function disableStudyReminders() {
      localStorage.removeItem('nq_notif_enabled');
      _toast('Lembretes desativados.', 'info');
    }
    function toggleStudyReminders() {
      if (localStorage.getItem('nq_notif_enabled')) {
        disableStudyReminders();
      } else {
        enableStudyReminders();
      }
    }
    function _checkStudyReminder() {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (!localStorage.getItem('nq_notif_enabled')) return;
      const lastStudy = parseInt(localStorage.getItem('nq_last_study') || '0');
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      if (lastStudy < yesterday) {
        const banner = document.createElement('div');
        banner.id = 'studyReminderBanner';
        banner.style.cssText = 'position:fixed;bottom:calc(80px + env(safe-area-inset-bottom, 0px));left:50%;transform:translateX(-50%);background:rgba(139,92,246,0.95);color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:0.85rem;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.4);max-width:320px;width:90%;';
        banner.innerHTML = '📚 Você não estudou hoje ainda!<br><button data-close-closest="#studyReminderBanner" data-action="showTopicSelector" style="margin-top:8px;background:#fff;color:#7c3aed;border:none;padding:6px 16px;border-radius:8px;font-weight:bold;cursor:pointer;">Estudar agora</button> <button data-close-closest="#studyReminderBanner" style="margin-top:8px;background:transparent;color:#e9d5ff;border:1px solid rgba(255,255,255,0.3);padding:6px 12px;border-radius:8px;cursor:pointer;">Depois</button>';
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 15000);
      }
    }

    function showStatsModal() {
      document.querySelectorAll('.stats-popup').forEach(el => el.remove());

      const stats = getDetailedStats();
      const avgTime = stats.timeStats.questionCount > 0 
        ? Math.round(stats.timeStats.totalTime / stats.timeStats.questionCount) 
        : 0;
      const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
        : 0;

      const axisStats = getAxisStats(stats);

      // Todos os tópicos praticados, ordenados por pior desempenho
      const allTopicData = Object.entries(stats.byTopic)
        .map(([topic, data]) => ({
          topic,
          accuracy: data.total > 0 ? ((data.correct / data.total) * 100) : null,
          total: data.total,
          correct: data.correct,
          wrong: data.wrong
        }))
        .filter(t => t.total > 0)
        .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));
      
      const modal = document.createElement('div');
      modal.className = 'modal show stats-popup';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;max-height:88vh;overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(59,130,246,0.3);">
          <h2 style="color:var(--gold);margin-bottom:16px;font-family:'Cinzel',serif;">📊 ESTATÍSTICAS</h2>
          
          <!-- Resumo geral -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#34d399;font-weight:bold;">${stats.totalQuestions}</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Questões</div>
            </div>
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#34d399;font-weight:bold;">${accuracy}%</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Acerto</div>
            </div>
            <div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:var(--blue);font-weight:bold;">${avgTime}s</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">T. Médio</div>
            </div>
            <div style="background:rgba(251,113,133,0.12);border:1px solid rgba(251,113,133,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#fb7185;font-weight:bold;">${stats.totalWrong}</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Erros</div>
            </div>
          </div>

          <!-- Radar Chart -->
          <div style="text-align:center;margin-bottom:20px;display:flex;flex-direction:column;align-items:center;">
            <h3 class="nq-section-heading">RADAR DE DESEMPENHO</h3>
            <div id="nqRadarChartContainer"></div>
          </div>
          <!-- Desempenho por Eixo -->
          <div style="text-align:left;margin-bottom:16px;">
            <h3 class="nq-section-heading">DESEMPENHO POR EIXO</h3>
            ${axisStats.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${axisStats.map(a => {
                const pct = a.accuracy !== null ? a.accuracy.toFixed(0) : 0;
                const color = a.accuracy >= 70 ? '#34d399' : a.accuracy >= 50 ? '#fbbf24' : '#fb7185';
                const bgColor = a.accuracy >= 70 ? 'rgba(52,211,153,0.08)' : a.accuracy >= 50 ? 'rgba(251,191,36,0.08)' : 'rgba(251,113,133,0.08)';
                const borderColor = a.accuracy >= 70 ? 'rgba(52,211,153,0.3)' : a.accuracy >= 50 ? 'rgba(251,191,36,0.3)' : 'rgba(251,113,133,0.3)';
                return `
                  <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:10px 12px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:1.1rem;">${a.icon}</span>
                        <span style="color:var(--txt);font-size:0.85rem;font-weight:600;">${a.label}</span>
                      </div>
                      <div style="text-align:right;">
                        <span style="color:${color};font-weight:bold;font-size:0.95rem;">${pct}%</span>
                        <span style="color:var(--txt-dim);font-size:0.7rem;margin-left:6px;">${a.correct}/${a.total}</span>
                      </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);height:5px;border-radius:3px;overflow:hidden;">
                      <div style="background:${color};height:100%;width:${pct}%;transition:width 0.5s;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            ` : '<p style="color:var(--txt-dim);text-align:center;padding:16px;font-size:0.85rem;">Jogue para ver seu desempenho por eixo!</p>'}
          </div>

          <!-- Tópicos com pior desempenho -->
          ${allTopicData.length > 0 ? `
          <div style="text-align:left;margin-bottom:16px;">
            <h3 class="nq-section-heading">TÓPICOS A REFORÇAR</h3>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;">
              ${allTopicData.slice(0, 6).map(t => {
                const pct = t.accuracy !== null ? t.accuracy.toFixed(0) : 0;
                const color = t.accuracy >= 70 ? '#34d399' : t.accuracy >= 50 ? '#fbbf24' : '#fb7185';
                return `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:rgba(255,255,255,0.04);border-radius:6px;">
                    <span style="color:var(--txt);font-size:0.78rem;flex:1;">${escapeHtml(t.topic)}</span>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <div style="width:60px;background:rgba(0,0,0,0.4);height:4px;border-radius:2px;overflow:hidden;">
                        <div style="background:${color};height:100%;width:${pct}%;"></div>
                      </div>
                      <span style="color:${color};font-weight:bold;font-size:0.78rem;min-width:32px;text-align:right;">${pct}%</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}
          

          ${(() => {
            const hist = (stats.questionHistory || []).slice().reverse();
            if (hist.length < 3) return '';
            const days = {};
            hist.forEach(h => {
              const d = (h.date || '').slice(0,10);
              if (!d) return;
              if (!days[d]) days[d] = {correct:0,total:0};
              days[d].total++;
              if (h.correct) days[d].correct++;
            });
            const sorted = Object.keys(days).sort().slice(-7);
            if (sorted.length < 2) return '';
            const pts = sorted.map(d => ({ d, pct: Math.round(days[d].correct/days[d].total*100) }));
            const max = 100, h2 = 55, w = 400/(pts.length-1);
            const polyline = pts.map((p,i) => `${(i*w).toFixed(1)},${(h2 - p.pct/max*h2).toFixed(1)}`).join(' ');
            const dots = pts.map((p,i) => `<circle cx="${(i*w).toFixed(1)}" cy="${(h2 - p.pct/max*h2).toFixed(1)}" r="5" fill="${p.pct>=70?'#34d399':p.pct>=50?'#fbbf24':'#fb7185'}" />`).join('');
            const labels = pts.map((p,i) => `<text x="${(i*w).toFixed(1)}" y="${h2+16}" text-anchor="middle" fill="#64748b" font-size="11">${p.d.slice(5)}</text><text x="${(i*w).toFixed(1)}" y="${(h2 - p.pct/max*h2 - 8).toFixed(1)}" text-anchor="middle" fill="${p.pct>=70?'#34d399':p.pct>=50?'#fbbf24':'#fb7185'}" font-size="11" font-weight="bold">${p.pct}%</text>`).join('');
            return '<div style="text-align:left;margin-bottom:16px;">'
              + '<h3 class="nq-section-heading">EVOLUÇÃO (ÚLTIMOS 7 DIAS)</h3>'
              + '<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;">'
              + '<svg viewBox="-8 -14 416 90" style="width:100%;display:block;">'
              + '<polyline points="' + polyline + '" fill="none" stroke="#6366f1" stroke-width="3" stroke-linejoin="round"/>'
              + dots + labels
              + '</svg>'
              + '</div>'
              + '</div>';
          })()}
          <button class="btn sec" data-action="confirmResetProgress"  style="margin-right:8px;background:rgba(251,113,133,0.15);border-color:rgba(251,113,133,0.4);color:#fb7185;font-size:0.78rem;">🗑️ Resetar Progresso</button>
          <button class="btn gold" data-close-closest=".modal">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);
      const radarContainer = document.getElementById('nqRadarChartContainer');
      if (radarContainer) {
        drawRadarChart(radarContainer, getCoreSkillsStats(stats));
      }
      playSound('click');
    }

    function confirmResetProgress() {
      if (!confirm('⚠️ Apagar todo o histórico de estatísticas, questões dominadas e save atual?\n\nEsta ação não pode ser desfeita.')) return;
      localStorage.removeItem(STATS_STORAGE_KEY);
      localStorage.removeItem(MASTERED_KEY);
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(ACHIEVEMENTS_KEY);
      localStorage.removeItem(STUDY_SAVE_KEY);
      localStorage.removeItem(EXAM_SAVE_KEY);
      localStorage.removeItem('unlockedArticles');
      localStorage.removeItem('nefroquest-arqui-defeated');
      localStorage.removeItem('nefroquest-minigame-notified');
      localStorage.removeItem(SR_KEY);
      unlockedArticles = [];
      _masteredSet = new Set();
      chestCost = 100;
      _invalidateStatsCache();
      document.querySelectorAll('.stats-popup').forEach(el => el.remove());
      _toast('Progresso resetado. Começando do zero!', 'success');
    }

    // ============ MODO DE ESTUDO POR TEMA ============
    let selectedTopic = 'all';
    let studyMode = 'all'; // 'all', 'topic', 'review'
    
    function extractTopics() {
      const topicsSet = new Set();
      topics.forEach(q => {
        if (q.t) topicsSet.add(q.t);
      });
      return Array.from(topicsSet).sort();
    }
    
    // Eixos selecionados no Modo de Estudo
    let _studySelectedAxes = new Set();

    function _studyPopupFocusFallback(returnFocus) {
      if (returnFocus && returnFocus.isConnected && returnFocus.getClientRects().length && !returnFocus.closest('[hidden], [inert]')) {
        return returnFocus;
      }
      return [...document.querySelectorAll('[data-action="openDashboard"], [data-action="showTopicSelector"]')]
        .find(element => element.getClientRects().length && !element.closest('[hidden], [inert]')) || null;
    }

    let _studySurfaceOrigin = null;
    let _studyReturnDashboardTab = null;
    function setStudyReturnDashboard(tab) { _studyReturnDashboardTab = tab || "overview"; }

    function _mountStudySurface(surface, label, returnFocus) {
      const dashboard = document.getElementById("nqDashboard");
      if (dashboard) {
        setStudyReturnDashboard(dashboard.querySelector('[data-dash-tab][aria-selected="true"]')?.dataset.dashTab);
        window.closeDashboard?.({ restoreFocus: false });
      }
      if (!_studySurfaceOrigin) {
        _studySurfaceOrigin = {
          dashboardTab: _studyReturnDashboardTab,
          focus: returnFocus || document.activeElement,
          scroll: window.scrollY,
          elements: [...document.querySelectorAll('#mainApp, #welcomeScreen')].map(element => ({
            element, hidden: element.classList.contains('hidden'), inert: element.inert
          }))
        };
      }
      _studyReturnDashboardTab = null;
      _studySurfaceOrigin.elements.forEach(({ element }) => {
        element.classList.add('hidden');
        element.inert = true;
      });
      surface.classList.remove('modal', 'show');
      surface.classList.add('nq-study-surface');
      surface.removeAttribute('style');
      surface.setAttribute('role', 'main');
      surface.setAttribute('aria-label', label);
      surface.querySelector('.modal-content')?.classList.add('nq-study-content');
      surface.querySelector('.modal-content')?.classList.remove('modal-content');
      surface.addEventListener('keydown', event => {
        // Study owns its keyboard context; campaign shortcuts must not run below it.
        event.stopPropagation();
        if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"][data-action]')) {
          event.preventDefault();
          event.target.click();
        }
        if (event.key === 'Escape' && surface.classList.contains('study-mode-popup')) {
          event.preventDefault();
          closeStudySetup();
        }
      });
      document.body.appendChild(surface);
      document.body.classList.add('nq-studying');
      window.scrollTo(0, 0);
      window.requestAnimationFrame(() => surface.querySelector('button, [tabindex="0"]')?.focus({ preventScroll: true }));
    }

    function _restoreStudyOrigin() {
      const origin = _studySurfaceOrigin;
      _studySurfaceOrigin = null;
      document.body.classList.remove('nq-studying');
      if (!origin) return;
      origin.elements.forEach(({ element, hidden, inert }) => {
        element.classList.toggle('hidden', hidden);
        element.inert = inert;
      });
      window.scrollTo(0, origin.scroll);
      if (origin.dashboardTab && typeof window.openDashboard === "function") {
        void window.openDashboard({ tab: origin.dashboardTab });
      } else {
        _studyPopupFocusFallback(origin.focus)?.focus({ preventScroll: true });
      }
    }

    function closeStudySetup() {
      document.querySelectorAll('.study-mode-popup').forEach(element => element.remove());
      _restoreStudyOrigin();
    }

    async function showTopicSelector() {
      // Capture before loading so returning can restore the original control.
      const returnFocus = document.activeElement;
      if (typeof topics === 'undefined') {
        _toast('Carregando questões…', 'info', 30000);
        try { await window._loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      _studySelectedAxes.clear();
      NEFRO_AXES.forEach(a => _studySelectedAxes.add(a.id));

      const modal = document.createElement('div');
      modal.className = 'study-mode-popup';

      // Calcular SR due com todos os temas
      const totalDue = getSRDueQuestions(topics).length;
      const srLabel = totalDue > 0 ? `${totalDue} ${totalDue > 1 ? 'questões' : 'questão'} disponíveis para revisão` : 'Nenhuma questão disponível para revisão';

      const saved = _loadStudyState();
      const canResume = saved && saved.index < saved.questions.length;
      modal.innerHTML = `
        <div class="nq-study-content">
          <header class="nq-study-heading">
            <button class="btn sec" data-action="closeStudySetup">← Voltar</button>
            <div><h1>Estudo e Revisão</h1><p>Pratique por tema ou retome o que precisa rever. Sua jornada permanece salva.</p></div>
          </header>
          ${canResume ? '<section class="nq-study-resume"><div><h2>Sessão em andamento</h2><p>Continue de onde parou.</p></div><button class="btn gold" data-action="resumeSavedStudyMode">Retomar estudo</button></section>' : ''}
          <div class="nq-study-choices">
            <section><div><h2>Por tema</h2><p>Escolha os eixos e pratique até 20 questões dos assuntos selecionados.</p></div><button class="btn gold" data-action="showAxesSelector">Selecionar Temas</button></section>
            <section><div><h2>Estudo livre</h2><p>Uma sessão com 20 questões de todos os temas, sem configuração.</p></div><button class="btn sec" data-action="startFreeStudyMode">Iniciar estudo livre</button></section>
            <section><div><h2>Revisão espaçada</h2><p>Retome as questões selecionadas pelo seu histórico de revisão.</p><strong>${srLabel}</strong></div><button class="btn sec" data-action="startSRStudyAllMode" ${totalDue === 0 ? 'disabled' : ''}>Revisar agora</button></section>
          </div>
        </div>
      `;
      _mountStudySurface(modal, 'Escolha o modo de estudo', returnFocus);
      playSound('click');
    }

    function showAxesSelector() {
      const returnFocus = document.activeElement;
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      _studySelectedAxes.clear();
      NEFRO_AXES.forEach(a => _studySelectedAxes.add(a.id));

      const modal = document.createElement('div');
      modal.className = 'study-mode-popup';

      const stats = getDetailedStats();

      function renderAxesHTML() {
        const _allAxisStats = getAxisStats(stats);
        return NEFRO_AXES.map(axis => {
          const sel = _studySelectedAxes.has(axis.id);
          const axisData = _allAxisStats.find(a => a.id === axis.id);
          const qCount = topics.filter(q => q.cat === axis.cat).length;
          const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
          const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
          return `
            <div role="button" tabindex="0" aria-pressed="${sel}" data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
              style="cursor:pointer;padding:8px 10px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:10px;">

              <div style="flex:1;text-align:left;">
                <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
                <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
              </div>
              <div style="text-align:right;">
                <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
                <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
              </div>
              <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      modal.innerHTML = `
        <div class="modal-content" style="max-width:460px;width:100%;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:18px 20px;box-shadow:0 0 40px rgba(139,92,246,0.3);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <button class="btn sec" data-action="showTopicSelector" style="padding:4px 10px;font-size:0.78rem;">← Voltar</button>
            <h2 style="color:var(--blue);margin:0;font-family:'Cinzel',serif;font-size:1rem;flex:1;">Escolha os Temas</h2>
          </div>
          <p style="color:var(--txt-dim);font-size:0.78rem;margin:0 0 12px;">20 questões serão sorteadas dos temas selecionados</p>

          <div style="margin-bottom:10px;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:6px;">
              <button class="btn sec" data-action="_selectTrail" data-arg="residencia" style="font-size:0.72rem;padding:4px 9px;">🏥 Residência</button>
              <button class="btn sec" data-action="_selectTrail" data-arg="titulo" style="font-size:0.72rem;padding:4px 9px;">📋 Título</button>
              <button class="btn sec" data-action="_selectTrail" data-arg="eletrolitos" style="font-size:0.72rem;padding:4px 9px;">⚡ Eletrólitos & AB</button>
            </div>
          </div>

          <div class="modal-scroll-body">
            <div id="axisCardList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">
              ${renderAxesHTML()}
            </div>
          </div>

          <div style="display:flex;gap:8px;justify-content:center;margin:10px 0 12px;">
            <button class="btn sec" data-action="_studySelectAll" data-arg="true" data-arg-type="boolean" style="font-size:0.76rem;padding:6px 12px;">✓ Todos</button>
            <button class="btn sec" data-action="_studySelectAll" data-arg="false" data-arg-type="boolean" style="font-size:0.76rem;padding:6px 12px;">✗ Nenhum</button>
          </div>

          <button class="btn gold" data-action="startStudyMode" style="width:100%;padding:12px;">Iniciar Sessão</button>
        </div>
      `;
      _mountStudySurface(modal, 'Escolha os temas de estudo', returnFocus);
      playSound('click');
    }

    function _studyToggleAxis(id) {
      if (_studySelectedAxes.has(id)) _studySelectedAxes.delete(id);
      else _studySelectedAxes.add(id);
      // Re-render cards
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      const _axisStatsCache = getAxisStats(stats);
      list.innerHTML = NEFRO_AXES.map(axis => {
        const sel = _studySelectedAxes.has(axis.id);
        const axisData = _axisStatsCache.find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div role="button" tabindex="0" aria-pressed="${sel}" data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">

            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
      document.getElementById(`axis-card-${id}`)?.focus({ preventScroll: true });
    }

    function _studySelectAll(sel) {
      if (sel) NEFRO_AXES.forEach(a => _studySelectedAxes.add(a.id));
      else _studySelectedAxes.clear();
      // Re-render todos os cards
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      const _axisStatsCache2 = getAxisStats(stats);
      list.innerHTML = NEFRO_AXES.map(axis => {
        const selected = _studySelectedAxes.has(axis.id);
        const axisData = _axisStatsCache2.find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div role="button" tabindex="0" aria-pressed="${selected}" data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${selected ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">

            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${selected ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${selected ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${selected ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    const _TRAILS = {
      residencia:  ['lra', 'eletrólitos', 'hipertensao', 'infeccao', 'glomerular', 'acido_base'],
      titulo:      ['glomerular', 'transplante', 'dialise', 'genetica', 'drc', 'acido_base', 'nefropatia_diabetica', 'farmacologia'],
      eletrolitos: ['eletrólitos', 'acido_base'],
    };

    function _selectTrail(trailId) {
      const ids = _TRAILS[trailId];
      if (!ids) return;
      _studySelectedAxes.clear();
      ids.forEach(id => _studySelectedAxes.add(id));
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      const _axisStatsCache = getAxisStats(stats);
      list.innerHTML = NEFRO_AXES.map(axis => {
        const sel = _studySelectedAxes.has(axis.id);
        const axisData = _axisStatsCache.find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div role="button" tabindex="0" aria-pressed="${sel}" data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">

            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    // Estado do modo de estudo
    const STUDY_SAVE_KEY = 'nefroquest-study-state';
    const STUDY_TTL_MS   = 24 * 60 * 60 * 1000; // 24h

    function _saveStudyState(nextIndex = studyModeIndex) {
      if (!studyModeActive || !studyModeQuestions.length) return;
      try {
        localStorage.setItem(STUDY_SAVE_KEY, JSON.stringify({
          questions: studyModeQuestions.map(q => q.qid || q.id || q.q.substring(0, 40)),
          index: nextIndex,
          correct: studyModeCorrect,
          wrong: studyModeWrong,
          axisStats: _studyAxisStats,
          savedAt: Date.now()
        }));
      } catch(e) { console.error('[NQ] _saveStudyState failed', e); }
    }

    function _loadStudyState() {
      try {
        const raw = localStorage.getItem(STUDY_SAVE_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || typeof s !== 'object' || Array.isArray(s) || !Array.isArray(s.questions)) return null;
        const questions = s.questions.filter(id => typeof id === 'string' || typeof id === 'number');
        const savedAt = Number(s.savedAt);
        if (!questions.length || !Number.isFinite(savedAt) || savedAt <= 0) return null;
        if (Date.now() - savedAt > STUDY_TTL_MS) { localStorage.removeItem(STUDY_SAVE_KEY); return null; }

        const rawIndex = Number(s.index);
        const index = Number.isFinite(rawIndex)
          ? Math.max(0, Math.min(Math.trunc(rawIndex), questions.length))
          : 0;
        const axisStats = {};
        if (s.axisStats && typeof s.axisStats === 'object' && !Array.isArray(s.axisStats)) {
          Object.entries(s.axisStats).forEach(([cat, entry]) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
            axisStats[cat] = {
              correct: Math.max(0, Math.trunc(Number(entry.correct) || 0)),
              wrong: Math.max(0, Math.trunc(Number(entry.wrong) || 0))
            };
          });
        }

        return {
          ...s,
          questions,
          index,
          correct: Math.max(0, Math.trunc(Number(s.correct) || 0)),
          wrong: Math.max(0, Math.trunc(Number(s.wrong) || 0)),
          axisStats,
          savedAt
        };
      } catch(e) { return null; }
    }

    function _clearStudyState() {
      try { localStorage.removeItem(STUDY_SAVE_KEY); } catch(e) {}
    }

    function resumeSavedStudyMode() {
      const saved = _loadStudyState();
      if (!saved) return false;
      if (saved.index >= saved.questions.length) { _clearStudyState(); return false; }
      const byId = new Map(topics.map(question => [question.qid || question.id || question.q.substring(0, 40), question]));
      const restored = saved.questions.map(id => byId.get(id)).filter(Boolean);
      if (!restored.length) return false;
      studyModeQuestions = restored;
      const currentId = saved.questions[Math.min(saved.index, saved.questions.length - 1)];
      const currentIndex = restored.findIndex(question => (question.qid || question.id || question.q.substring(0, 40)) === currentId);
      studyModeIndex = currentIndex >= 0 ? currentIndex : Math.min(saved.index, restored.length - 1);
      studyModeCorrect = saved.correct;
      studyModeWrong = saved.wrong;
      _studyAxisStats = saved.axisStats;
      studyModeActive = true;
      showStudyModePage();
      return true;
    }

    let studyModeActive = false;
    let studyModeQuestions = [];
    let studyModeIndex = 0;
    let studyModeCorrect = 0;
    let studyModeWrong = 0;
    let _studyAxisStats = {};  // { cat: { correct, wrong } } — reset each session

    // ── Mentor quota (free: 5/day) + Diagnosis quota (free: 3/day) ──────────
    const MENTOR_QUOTA_KEY = 'nq-mentor-quota';
    const DIAG_QUOTA_KEY   = 'nq-diag-quota';
    const MENTOR_DAILY_LIMIT = 5;
    const DIAG_DAILY_LIMIT   = 3;
    let _mentorCurrentQ = null;
    let _mentorHistory = [];

    async function startFreeStudyMode() {
      if (typeof topics === 'undefined') {
        _toast('Carregando questões…', 'info', 30000);
        try { await window._loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }
      // Estudo Livre: 20 questões aleatórias de TODOS os temas, sem precisar selecionar eixos
      _studySelectedAxes.clear();
      NEFRO_AXES.forEach(a => _studySelectedAxes.add(a.id));
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      studyModeQuestions = shuffle([...topics]).slice(0, 20);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      _studyAxisStats = {};
      showStudyModePage();
    }

    async function startSRStudyAllMode() {
      if (typeof topics === 'undefined') {
        _toast('Carregando questões…', 'info', 30000);
        try { await window._loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }
      // Revisão Espaçada com todos os temas
      _studySelectedAxes.clear();
      NEFRO_AXES.forEach(a => _studySelectedAxes.add(a.id));
      const due = getSRDueQuestions(topics);
      if (due.length === 0) {
        _toast('Nenhuma revisão pendente hoje. Volte amanhã ou use o Estudo Livre.', 'info', 4000);
        return;
      }
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      studyModeQuestions = shuffle(due);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      _studyAxisStats = {};
      showStudyModePage('revisão espaçada');
    }

    async function startScheduledSRStudyMode() {
      if (typeof topics === 'undefined') {
        _toast('Carregando questões…', 'info', 30000);
        try { await window._loadTopics(); document.querySelector('.nq-toast')?.remove(); }
        catch { _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000); return; }
      }
      let cards = {};
      try { cards = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}'); } catch {}
      const today = new Date().setHours(0, 0, 0, 0);
      const dueIds = new Set(Object.entries(cards)
        .filter(([, card]) => card && typeof card === 'object' && Number.isFinite(Number(card.due)) && Number(card.due) <= today)
        .map(([qid]) => qid));
      const due = topics.filter(question => dueIds.has(String(question.qid || question.id || '')));
      if (!due.length) {
        _toast('Nenhuma revisão agendada está vencida.', 'info', 4000);
        return;
      }
      _studySelectedAxes.clear();
      NEFRO_AXES.forEach(axis => _studySelectedAxes.add(axis.id));
      document.querySelectorAll('.study-mode-popup').forEach(element => element.remove());
      studyModeQuestions = shuffle(due);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      _studyAxisStats = {};
      showStudyModePage('revisão agendada');
    }

    function _getMentorQuota() {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const stored = JSON.parse(localStorage.getItem(MENTOR_QUOTA_KEY) || '{}');
        if (stored.date !== today) return { date: today, count: 0 };
        return stored;
      } catch { return { date: today, count: 0 }; }
    }

    function _renderMentorMarkdown(text) {
      // Escapa HTML primeiro para evitar XSS
      let s = escapeHtml(text);
      // Títulos: ### → h4, ## → h3, # → h3
      s = s.replace(/^### (.+)$/gm, '<h4 style="color:var(--gold);margin:10px 0 4px;font-size:0.9rem;">$1</h4>');
      s = s.replace(/^## (.+)$/gm, '<h3 style="color:var(--blue);margin:12px 0 5px;font-size:0.95rem;">$1</h3>');
      s = s.replace(/^# (.+)$/gm, '<h3 style="color:var(--gold);margin:12px 0 5px;font-size:1rem;">$1</h3>');
      // Negrito e itálico
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Listas com -
      s = s.replace(/^- (.+)$/gm, '<li style="margin:2px 0;">$1</li>');
      s = s.replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:6px 0 6px 16px;padding:0;">$&</ul>');
      // Quebras de linha
      s = s.replace(/\n/g, '<br>');
      // Limpar <br> após tags de bloco
      s = s.replace(/<br>(<\/?(?:h[34]|ul|li))/g, '$1');
      return s;
    }

    function _canAskMentor() {
      if (isPremium()) return true;
      return _getMentorQuota().count < MENTOR_DAILY_LIMIT;
    }

    function _incrementMentorQuota() {
      if (isPremium()) return;
      const q = _getMentorQuota();
      q.count = (q.count || 0) + 1;
      localStorage.setItem(MENTOR_QUOTA_KEY, JSON.stringify(q));
    }

    /* O contador local não é a verdade — o servidor é.
     *
     * A cota vive em `ai_usage`, por usuário e por dia. Este contador é uma
     * cópia por dispositivo, e ele só sobe quando ESTE aparelho faz a
     * pergunta. Quem gastou as cinco no celular abre o notebook e lê
     * "5/5 perguntas restantes hoje" — e é recusado na primeira.
     *
     * Medido: a barra dizia 5/5 ao lado do aviso "Limite diário atingido",
     * na mesma tela. Quando o servidor recusa por cota, o local passa a
     * refletir isso. */
    function _esgotarMentorQuotaLocal() {
      if (isPremium()) return;
      const q = _getMentorQuota();
      q.count = MENTOR_DAILY_LIMIT;
      localStorage.setItem(MENTOR_QUOTA_KEY, JSON.stringify(q));
      const barra = document.getElementById('mentorQuotaBar');
      if (barra) barra.textContent = _mentorRemainingText();
    }

    function _mentorRemainingText() {
      if (isPremium()) return '';
      const { count } = _getMentorQuota();
      const rem = Math.max(0, MENTOR_DAILY_LIMIT - count);
      return `${rem}/${MENTOR_DAILY_LIMIT} perguntas restantes hoje`;
    }

    function _diagRemainingText() {
      if (isPremium()) return '';
      const { count } = _getDiagQuota();
      const rem = Math.max(0, DIAG_DAILY_LIMIT - count);
      return `${rem}/${DIAG_DAILY_LIMIT} diagnósticos restantes hoje`;
    }

    function _buildAxisBarsHtml() {
      const entries = Object.entries(_studyAxisStats);
      if (entries.length === 0) return '';
      const sorted = entries
        .map(([cat, s]) => {
          const axis = NEFRO_AXES.find(a => a.cat === cat);
          const total = s.correct + s.wrong;
          const pct = total > 0 ? Math.round((s.correct / total) * 100) : 0;
          return { label: axis ? `${axis.icon} ${axis.label}` : cat, pct };
        })
        .sort((a, b) => a.pct - b.pct);
      const bars = sorted.map(({ label, pct }) => {
        const color = pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185';
        return `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <div style="flex:0 0 150px;font-size:0.73rem;color:var(--txt-dim);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</div>
            <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:4px;height:12px;overflow:hidden;">
              <div style="width:${pct}%;background:${color};height:100%;border-radius:4px;"></div>
            </div>
            <div style="flex:0 0 34px;font-size:0.73rem;color:${color};font-weight:bold;">${pct}%</div>
          </div>`;
      }).join('');
      return `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px 16px 10px;margin-bottom:20px;text-align:left;">
          <div style="font-size:0.75rem;color:var(--txt-dim);margin-bottom:12px;text-align:center;letter-spacing:0.05em;text-transform:uppercase;">Desempenho por Eixo</div>
          ${bars}
        </div>`;
    }

    function _getDiagQuota() {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const stored = JSON.parse(localStorage.getItem(DIAG_QUOTA_KEY) || '{}');
        if (stored.date !== today) return { date: today, count: 0 };
        return stored;
      } catch { return { date: today, count: 0 }; }
    }

    function _canRunDiagnosis() {
      if (isPremium()) return true;
      return _getDiagQuota().count < DIAG_DAILY_LIMIT;
    }

    function _incrementDiagQuota() {
      if (isPremium()) return;
      const q = _getDiagQuota();
      q.count = (q.count || 0) + 1;
      localStorage.setItem(DIAG_QUOTA_KEY, JSON.stringify(q));
    }
    
    function startStudyMode(replaceSaved = false) {
      if (_studySelectedAxes.size === 0) {
        _toast('Selecione pelo menos um eixo para estudar!', 'warning');
        return;
      }

      const saved = _loadStudyState();
      if (saved && saved.index < saved.questions.length && replaceSaved !== true) {
        let surface = document.querySelector('.study-mode-popup');
        if (!surface) {
          surface = document.createElement('div');
          surface.className = 'study-mode-popup';
          surface.innerHTML = '<div class="nq-study-content"><button class="btn sec" data-action="closeStudySetup">← Voltar</button><h1>Estudo e Revisão</h1></div>';
          _mountStudySurface(surface, 'Escolha o modo de estudo', document.activeElement);
        }
        let notice = surface.querySelector('[data-study-resume-choice]');
        if (!notice) {
          notice = document.createElement('section');
          notice.className = 'nq-study-resume';
          notice.dataset.studyResumeChoice = '';
          notice.innerHTML = '<div><h2>Você tem um estudo em andamento</h2><p>Retome a sessão salva ou substitua por uma sessão com os temas selecionados.</p></div><div><button class="btn gold" data-action="resumeSavedStudyMode">Retomar estudo</button><button class="btn sec" data-action="startStudyMode" data-arg="true" data-arg-type="boolean">Iniciar nova sessão</button></div>';
          surface.querySelector('.nq-study-content').prepend(notice);
        }
        notice.querySelector('button').focus();
        return;
      }
      // Coletar categorias dos eixos selecionados
      const selectedCats = new Set();
      NEFRO_AXES.forEach(axis => {
        if (_studySelectedAxes.has(axis.id)) selectedCats.add(axis.cat);
      });

      // Filtrar questões pelas categorias selecionadas
      studyModeQuestions = topics.filter(q => selectedCats.has(q.cat));
      
      if (studyModeQuestions.length === 0) {
        _toast('Nenhuma questão encontrada para os temas selecionados.', 'warning');
        return;
      }
      
      // Embaralhar e limitar sessão a 20 questões
      studyModeQuestions = shuffle(studyModeQuestions).slice(0, 20);
      studyModeIndex = 0;
      studyModeCorrect = 0;
      studyModeWrong = 0;
      studyModeActive = true;
      _studyAxisStats = {};

      // Fechar popup de seleção
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());

      // Abrir página de estudo (sem música — modo de estudo é silencioso)
      showStudyModePage();
    }
    
    function showStudyModePage(sessionLabel) {
      document.querySelectorAll('.study-mode-popup').forEach(element => element.remove());
      
      // Remover página anterior se existir
      document.getElementById('studyModePage')?.remove();
      
      const page = document.createElement('div');
      page.id = 'studyModePage';
      page.innerHTML = `
        <div style="max-width:900px;margin:0 auto;padding:20px;min-height:100%;padding-bottom:100px;">
          <header class="nq-study-session-header">
            <button class="btn sec" data-action="exitStudyMode">Pausar e voltar</button>
            <h1>${sessionLabel === 'reforço' ? 'Sessão de reforço' : 'Estudo e Revisão'}</h1>
            <div class="nq-study-session-progress"><span id="studyProgress">${studyModeIndex + 1}</span>/${studyModeQuestions.length}</div>
            <div class="nq-study-session-score"><span><strong id="studyCorrect">${studyModeCorrect}</strong> acertos</span><span><strong id="studyWrong">${studyModeWrong}</strong> erros</span></div>
          </header>

          <!-- Question Area -->
          <div id="studyQuestionArea" style="background:linear-gradient(180deg,#1a1228,#12192e);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 30px rgba(30,60,120,0.3);">
            <!-- Questão será renderizada aqui -->
          </div>
        </div>
      `;
      _mountStudySurface(page, 'Sessão de estudo', document.activeElement);
      _saveStudyState();
      renderStudyQuestion();
    }
    
    function renderStudyQuestion() {
      if (studyModeIndex >= studyModeQuestions.length) {
        showStudyModeResults();
        return;
      }
      
      const q = studyModeQuestions[studyModeIndex];
      const area = document.getElementById('studyQuestionArea');
      
      area.innerHTML = `
        <div style="margin-bottom:16px;">
          <span style="background:rgba(139,92,246,0.2);color:#a78bfa;padding:4px 10px;border-radius:4px;font-size:0.75rem;">
            ${escapeHtml(q.t || 'Geral')}
          </span>
        </div>
        
        <h3 style="color:var(--txt);font-size:1.1rem;line-height:1.6;margin-bottom:24px;">
          ${escapeHtml(q.q)}
        </h3>

        <div id="studyOptions" style="display:grid;gap:10px;">
          ${q.opts.map((opt, idx) => `
            <button class="study-option-btn" data-action="answerStudyQuestion" data-arg="${idx}" data-arg-type="number"
                    data-kbd-hint="${idx + 1}"
                    style="display:flex; justify-content:space-between; align-items:center; background:linear-gradient(180deg,#1e293b,#0f172a);border:2px solid #334155;border-radius:10px;padding:14px 18px;text-align:left;color:var(--txt);font-size:0.95rem;cursor:pointer;transition:all 0.2s;"
                    onmouseover="this.style.borderColor='var(--blue)';this.style.background='linear-gradient(180deg,#1e3a5f,#0f172a)'"
                    onmouseout="this.style.borderColor='#334155';this.style.background='linear-gradient(180deg,#1e293b,#0f172a)'">
              <span>
                <span style="color:var(--blue);font-weight:bold;margin-right:8px;">${String.fromCharCode(65 + idx)})</span>
                ${escapeHtml(opt)}
              </span>
            </button>
          `).join('')}
        </div>
        
        <div id="studyFeedback" style="display:none;margin-top:20px;"></div>
      `;
      
      document.getElementById('studyProgress').textContent = studyModeIndex + 1;
    }
    
    function answerStudyQuestion(selectedIdx) {
      if (studyModeIndex >= studyModeQuestions.length) return;
      const q = studyModeQuestions[studyModeIndex];
      const isCorrect = selectedIdx === q.ans;
      
      // Desabilitar botões
      document.querySelectorAll('.study-option-btn').forEach((btn, idx) => {
        btn.disabled = true;
        btn.style.cursor = 'default';
        btn.onmouseover = null;
        btn.onmouseout = null;
        
        if (idx === q.ans) {
          btn.style.borderColor = '#34d399';
          btn.style.background = 'rgba(52,211,153,0.15)';
        } else if (idx === selectedIdx && !isCorrect) {
          btn.style.borderColor = '#fb7185';
          btn.style.background = 'rgba(251,113,133,0.15)';
        }
      });

      // Feedback visual e tátil
      let clickedBtn = document.querySelectorAll('.study-option-btn')[selectedIdx];
      let x, y;
      if (clickedBtn && typeof clickedBtn.getBoundingClientRect === 'function') {
        const rect = clickedBtn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      if (isCorrect) {
        if (typeof window.showFloatingFeedback === 'function') {
          window.showFloatingFeedback('✓ Correto!', true, x, y);
        }
        if (typeof window.triggerHapticFeedback === 'function') {
          window.triggerHapticFeedback('correct');
        }
      } else {
        if (typeof window.showFloatingFeedback === 'function') {
          window.showFloatingFeedback('✗ Incorreto', false, x, y);
        }
        if (typeof window.triggerHapticFeedback === 'function') {
          window.triggerHapticFeedback('wrong');
        }
      }
      
      // Atualizar contadores
      updateSRData(q.qid, isCorrect);
      localStorage.setItem('nq_last_study', Date.now().toString());
      if (typeof trackQuestionAnswer === 'function') {
        trackQuestionAnswer(q, isCorrect, 0);
      }
      if (isCorrect) {
        studyModeCorrect++;
        document.getElementById('studyCorrect').textContent = studyModeCorrect;
      } else {
        studyModeWrong++;
        document.getElementById('studyWrong').textContent = studyModeWrong;
      }

      // Rastrear desempenho por eixo temático
      if (q.cat) {
        _studyAxisStats[q.cat] = _studyAxisStats[q.cat] || { correct: 0, wrong: 0 };
        _studyAxisStats[q.cat][isCorrect ? 'correct' : 'wrong']++;
      }

      // Botão de mentor (apenas em erros)
      let mentorBtnInner = '';
      if (!isCorrect) {
        if (_canAskMentor()) {
          mentorBtnInner = `<button class="btn ghost" style="font-size:0.78rem;padding:7px 16px;margin:0;" data-action="openMentorModal">
                🔮 Consultar Oráculo
               </button>`;
        } else {
          mentorBtnInner = `<div style="font-size:0.75rem;color:var(--txt-dim);margin:0;">Limite diário de perguntas atingido — <button class="btn ghost" style="font-size:0.72rem;padding:4px 10px;" data-action="showPricingModal">Premium ilimitado</button></div>`;
        }
      }

      // Mostrar feedback
      const feedback = document.getElementById('studyFeedback');
      feedback.style.display = 'block';
      feedback.innerHTML = `
        <div style="background:${isCorrect ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)'};border:2px solid ${isCorrect ? '#34d399' : '#fb7185'};border-radius:10px;padding:16px;">
          <div style="color:${isCorrect ? '#34d399' : '#fb7185'};font-weight:bold;margin-bottom:8px;">
            ${isCorrect ? '✓ Correto!' : '✗ Incorreto'}
          </div>
          <div style="color:var(--txt);font-size:0.9rem;line-height:1.5;">
            ${escapeHtml(q.exp || 'A resposta correta é a alternativa ' + String.fromCharCode(65 + q.ans) + '.')}
          </div>
          ${(q.refs||[]).length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${(q.refs||[]).map(k => refsDB[k] ? `<a href="https://scholar.google.com/scholar?q=${encodeURIComponent(refsDB[k].label)}" target="_blank" rel="noopener" style="color:var(--blue);font-size:0.72rem;text-decoration:none;border:1px solid rgba(96,165,250,0.3);padding:2px 9px;border-radius:12px;white-space:nowrap;">🔗 ${escapeHtml(refsDB[k].label)}</a>` : '').filter(Boolean).join('')}</div>` : ''}
        </div>
        <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap;">
          ${mentorBtnInner}
          <button class="btn gold" data-action="nextStudyQuestion" style="margin:0;">
            ${studyModeIndex + 1 < studyModeQuestions.length ? 'Próxima Questão' : 'Ver Resultados'}
          </button>
        </div>
      `;

      // Guardar questão atual para o mentor
      _mentorCurrentQ = q;
      _mentorHistory = [];

      playSound(isCorrect ? 'correct' : 'wrong');
    }
    
    let _loadingStudyNext = false;
    function nextStudyQuestion() {
      if (_loadingStudyNext) return;
      _loadingStudyNext = true;
      setTimeout(() => { _loadingStudyNext = false; }, 400);

      studyModeIndex++;
      _saveStudyState();
      renderStudyQuestion();
      const area = document.getElementById('studyQuestionArea');
      area?.setAttribute('tabindex', '-1');
      area?.focus({ preventScroll: true });
      area?.scrollIntoView({ block: 'start' });
    }
    
    function showStudyModeResults() {
      const total = studyModeQuestions.length;
      const accuracy = total > 0 ? Math.round((studyModeCorrect / total) * 100) : 0;
      document.querySelector('#studyModePage [data-action="exitStudyMode"]')?.replaceChildren(document.createTextNode("Voltar"));

      document.getElementById("studyProgress").textContent = total;
      const area = document.getElementById('studyQuestionArea');
      area.innerHTML = `
        <div class="nq-study-results">
          <h2>Estudo concluído</h2>
          <p class="nq-study-result-intro">Confira seu resultado e os eixos praticados nesta sessão.</p>
          <dl class="nq-study-result-metrics">
            <div><dt>Questões</dt><dd>${total}</dd></div>
            <div><dt>Acertos</dt><dd>${studyModeCorrect}</dd></div>
            <div><dt>Erros</dt><dd>${studyModeWrong}</dd></div>
            <div><dt>Aproveitamento</dt><dd>${accuracy}%</dd></div>
          </dl>

          ${_buildAxisBarsHtml()}

          <div id="aiDiagnosisCard" class="ai-diagnosis-card ai-diagnosis-loading">
            <div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão
              ${!isPremium() ? `<span style="font-size:0.68rem;opacity:0.55;font-weight:normal;margin-left:8px;">${_diagRemainingText()}</span>` : ''}
            </div>
            <div class="ai-diagnosis-spinner"></div>
          </div>

          <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;">
            <button class="btn sec" data-action="exitStudyMode">← Voltar</button>
            <button class="btn gold" data-action="restartStudyMode">Estudar Novamente</button>
          </div>
        </div>
      `;

      playSound('victory');

      // Buscar diagnóstico IA em background — graceful degradation se falhar
      if (total > 0) {
        _fetchDiagnosis(total, studyModeCorrect, studyModeWrong, accuracy);
      } else {
        document.getElementById('aiDiagnosisCard')?.remove();
      }
    }

    async function _fetchDiagnosis(total, correct, wrong, accuracy) {
      const card = document.getElementById('aiDiagnosisCard');
      if (!card) return;

      const isGuest = typeof authUser === 'undefined' || authUser === null;
      if (isGuest) {
        card.classList.remove('ai-diagnosis-loading');
        card.innerHTML = `
          <div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão</div>
          <div class="ai-diagnosis-body" style="text-align:center;padding:16px 0;color:var(--txt-dim);">
            O Diagnóstico da Sessão requer uma conta ativa.<br>
            <span style="font-size:0.8rem;">Crie uma conta gratuita para obter análise de lacunas por IA, treinar seus pontos fracos e evoluir seu personagem.</span>
            <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;">
              <button class="btn gold" style="font-size:0.75rem;padding:6px 12px;" data-action="showRegisterFromDiagnosis">Criar Conta</button>
              <button class="btn sec" style="font-size:0.75rem;padding:6px 12px;" data-action="showLoginFromDiagnosis">Entrar</button>
            </div>
          </div>`;
        return;
      }

      if (!_canRunDiagnosis()) {
        card.innerHTML = `<div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão</div>
          <div style="color:var(--txt-dim);font-size:0.82rem;padding:8px 0;">Limite diário de diagnósticos atingido (${DIAG_DAILY_LIMIT}/dia). Volte amanhã ou <strong class="nq-text-gold">faça upgrade para Premium</strong> para uso ilimitado.</div>`;
        card.classList.remove('ai-diagnosis-loading');
        return;
      }
      _incrementDiagQuota();

      // Montar array de eixos com estatísticas
      const axes = Object.entries(_studyAxisStats).map(([cat, stats]) => {
        const axis = NEFRO_AXES.find(a => a.cat === cat);
        return { name: axis ? axis.label : cat, correct: stats.correct, wrong: stats.wrong };
      });

      try {
        const _diagToken = (typeof window.getAuthToken === 'function') ? (await window.getAuthToken()) : null;
        const res = await fetch(`${SUPA_URL}/functions/v1/ai-diagnosis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': `Bearer ${_diagToken || SUPA_KEY}` },
          body: JSON.stringify({ axes, totalCorrect: correct, totalWrong: wrong, accuracy }),
        });

        if (res.status === 429) {
          card.classList.remove('ai-diagnosis-loading');
          card.innerHTML = `<div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão</div><div class="ai-diagnosis-body" style="text-align:center;padding:16px 0;color:var(--txt-dim);">Limite diário atingido.<br><span style="font-size:0.8rem;">Volte amanhã ou <strong style="color:var(--gold);cursor:pointer;" data-action="showPaywallModal">faça upgrade para Premium</strong>.</span></div>`;
          return;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const { diagnosis } = await res.json();
        if (!diagnosis) throw new Error('empty');

        // Verificar se há pontos fracos para reforço (cat com acerto < 60%)
        const weakCats = _getWeakCats();
        const hasWeak = weakCats.length > 0;

        card.classList.remove('ai-diagnosis-loading');
        card.innerHTML = `
          <div class="ai-diagnosis-header">🤖 Diagnóstico da Sessão
            ${!isPremium() ? `<span style="font-size:0.68rem;opacity:0.55;font-weight:normal;margin-left:8px;">${_diagRemainingText()}</span>` : ''}
          </div>
          <div class="ai-diagnosis-body">${_renderMentorMarkdown(diagnosis)}</div>
          ${!isPremium() ? `<div style="font-size:0.7rem;color:var(--txt-dim);margin-top:10px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">🔮 Oráculo: ${_mentorRemainingText()} &nbsp;·&nbsp; 🤖 Diagnóstico: ${_diagRemainingText()}</div>` : ''}
          ${hasWeak ? `
          <div style="margin-top:14px;text-align:center;">
            <button class="btn reinforcement-btn" data-action="startReinforcementSession">
              🎯 Treinar pontos fracos <span style="font-size:0.72rem;opacity:0.7;">(${_countReinforcementQuestions(weakCats)} questões)</span>
            </button>
          </div>` : ''}
        `;
      } catch {
        card.remove();
      }
    }

    function _getWeakCats() {
      return Object.entries(_studyAxisStats)
        .filter(([, s]) => {
          const total = s.correct + s.wrong;
          return total > 0 && (s.correct / total) < 0.6;
        })
        .map(([cat]) => cat);
    }

    function _countReinforcementQuestions(weakCats) {
      const pool = topics.filter(q => weakCats.includes(q.cat));
      return Math.min(7, pool.length);
    }

    function startReinforcementSession() {
      const weakCats = _getWeakCats();
      if (weakCats.length === 0) {
        _toast('Nenhum ponto fraco identificado — sessão excelente!', 'success');
        return;
      }

      // Filtrar questões das categorias fracas, priorizando revisões pendentes
      const pool = topics.filter(q => weakCats.includes(q.cat));
      const due   = getSRDueQuestions(pool);
      // Se não há revisões pendentes, usa o pool completo
      const source = due.length >= 3 ? due : pool;
      const questions = shuffle(source).slice(0, 7);

      if (questions.length === 0) {
        _toast('Sem questões disponíveis para esses eixos.', 'warning');
        return;
      }

      // Lançar mini-sessão reutilizando o fluxo existente
      studyModeQuestions = questions;
      studyModeIndex     = 0;
      studyModeCorrect   = 0;
      studyModeWrong     = 0;
      studyModeActive    = true;
      _studyAxisStats    = {};
      _clearStudyState();

      // Label especial para sessão de reforço
      showStudyModePage('reforço');
    }

    window.startReinforcementSession = startReinforcementSession;
    window.showAxesSelector      = showAxesSelector;
    window.startSRReviewAll      = startSRReviewAll;
    window.startFreeStudyMode    = startFreeStudyMode;
    window.startSRStudyAllMode   = startSRStudyAllMode;
    window.startScheduledSRStudyMode = startScheduledSRStudyMode;
    window.startStudyMode        = startStudyMode;
    window.resumeSavedStudyMode  = resumeSavedStudyMode;
    window._studySelectedAxes    = _studySelectedAxes;
    
    function restartStudyMode() {
      _clearStudyState();
      studyModeQuestions = shuffle(studyModeQuestions);
      studyModeIndex = 0;
      studyModeCorrect = 0;
      studyModeWrong = 0;
      _studyAxisStats = {};
      showStudyModePage();
    }
    
    function exitStudyMode() {
      const nextIndex = studyModeIndex + (document.querySelector('#studyModePage [data-action="nextStudyQuestion"]') ? 1 : 0);
      if (nextIndex >= studyModeQuestions.length) _clearStudyState();
      else _saveStudyState(nextIndex);
      studyModeActive = false;
      document.getElementById('studyModePage')?.remove();
      _restoreStudyOrigin();
      
      // Se não tinha jogo iniciado, mostrar welcome
      if (!state.gameStarted) {
        document.querySelector('.welcome-screen')?.classList.remove('hidden');
        refreshWelcomeSave();
      }
    }

    // ── Oráculo: painel no fluxo, não sobreposição ──────────────────────────
    //
    // Era uma folha `position: fixed` no rodapé, com `aria-modal` e o resto da
    // página escurecido. Para perguntar SOBRE a questão, a pessoa perdia a
    // questão — por isso o próprio modal precisava reimprimir o enunciado num
    // quadro apertado, e a conversa cabia numa faixa fina entre o contexto
    // repetido e o campo.
    //
    // Agora o Oráculo entra na página, logo abaixo do veredito: o enunciado
    // continua legível acima, a conversa cresce com a rolagem natural e não há
    // enunciado duplicado. Não é um diálogo, é uma região do documento — daí
    // `role="region"` no lugar de `dialog`, e nenhuma armadilha de foco.
    let _mentorOrigemFoco = null;

    /** Onde o Oráculo mora em cada superfície, na ordem de preferência. */
    function _ancoraDoMentor() {
      const noEstudo = document.getElementById('studyFeedback');
      if (noEstudo && noEstudo.offsetParent !== null) return { pai: noEstudo.parentNode, depois: noEstudo };
      const refs = document.getElementById('refs');
      if (refs) return { pai: refs.parentNode, depois: refs };
      const feedback = document.getElementById('feedback');
      if (feedback) return { pai: feedback.parentNode, depois: feedback };
      return null;
    }

    function openMentorModal() {
      const q = _mentorCurrentQ;
      if (!q) return;

      document.getElementById('mentorPanel')?.remove();
      _mentorOrigemFoco = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      const isGuest = typeof authUser === 'undefined' || authUser === null;
      const painel = document.createElement('section');
      painel.id = 'mentorPanel';
      painel.className = 'mentor-panel';
      painel.setAttribute('role', 'region');
      painel.setAttribute('aria-label', 'Oráculo dos Néfrons');

      painel.innerHTML = `
        <div class="mentor-header">
          <div class="mentor-header-title">
            <div class="mentor-title-main">🔮 Oráculo dos Néfrons</div>
            <div class="mentor-title-sub">Sobre a questão acima</div>
          </div>
          <button type="button" class="mentor-close-btn" data-action="closeMentorModal" aria-label="Fechar o Oráculo e voltar à questão">✕</button>
        </div>
        <div class="mentor-chat" id="mentorChat" role="log" aria-live="polite"></div>
        ${isGuest ? `
          <div class="mentor-access-panel">
            <p>O Oráculo dos Néfrons precisa de uma conta ativa para analisar suas dúvidas. Crie a sua gratuitamente para salvar o progresso, entrar no ranking e consultar a IA.</p>
            <button type="button" class="btn gold" data-action="closeMentorModalAndRegister">Criar conta gratuita</button>
            <span>Já tem conta? <button type="button" class="mentor-inline-action" data-action="closeMentorModalAndLogin">Fazer login</button></span>
          </div>
        ` : `
          <div class="mentor-quota-bar" id="mentorQuotaBar">${_mentorRemainingText()}</div>
          <div class="mentor-input-row">
            <label class="nq-sr-only" for="mentorInput">Sua dúvida sobre esta questão</label>
            <textarea id="mentorInput" class="mentor-textarea"
              placeholder="O que você não entendeu? Qual foi o seu raciocínio?" rows="2"
              maxlength="400"></textarea>
            <button type="button" class="btn gold mentor-send-btn" data-action="_sendMentorMessage">Enviar</button>
          </div>
        `}
        <button type="button" class="mentor-voltar" data-action="closeMentorModal">← Voltar à questão</button>
      `;

      const ancora = _ancoraDoMentor();
      if (ancora) ancora.pai.insertBefore(painel, ancora.depois.nextSibling);
      else document.getElementById('mainApp')?.appendChild(painel);

      /* Escape fecha e devolve o foco. Sem armadilha: quem quiser sair pelo
       * Tab alcança o resto da página, que continua sendo parte do fluxo. */
      painel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMentorModal(); }
      });

      const input = document.getElementById('mentorInput');
      // Enter envia; Shift+Enter quebra linha.
      input?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _sendMentorMessage(); }
      });

      requestAnimationFrame(() => {
        painel.classList.add('visible');
        painel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        (input || painel.querySelector('button'))?.focus({ preventScroll: true });
      });
    }

    function closeMentorModal(restoreFocus = true) {
      const painel = document.getElementById('mentorPanel');
      if (!painel) return;
      const voltarPara = _mentorOrigemFoco;
      _mentorOrigemFoco = null;
      painel.remove();
      if (restoreFocus && voltarPara && voltarPara.isConnected) {
        voltarPara.focus({ preventScroll: true });
      }
    }

    async function _sendMentorMessage() {
      const q = _mentorCurrentQ;
      const input = document.getElementById('mentorInput');
      const chat = document.getElementById('mentorChat');
      if (!input || !chat || !q) return;

      const text = input.value.trim();
      if (!text) return;

      if (!_canAskMentor()) {
        /* O número vinha escrito à mão como 3 — o limite do DIAGNÓSTICO, não o
         * do Oráculo. O contrato real é 5, igual dos dois lados
         * (`MENTOR_DAILY_LIMIT` aqui, `MENTOR_LIMIT` na Edge Function). A
         * barra ao lado já dizia "5/5", então a mesma tela informava dois
         * limites diferentes. Sai da constante para não divergir de novo. */
        _appendMentorMsg(chat, 'system', `Você atingiu o limite diário de ${MENTOR_DAILY_LIMIT} perguntas. Faça upgrade para Premium para perguntas ilimitadas.`);
        return;
      }

      _appendMentorMsg(chat, 'user', text);
      input.value = '';
      input.disabled = true;

      const thinkingEl = _appendMentorMsg(chat, 'assistant', '...');
      thinkingEl.classList.add('mentor-thinking');

      try {
        const _mentorToken = (typeof window.getAuthToken === 'function') ? (await window.getAuthToken()) : null;
        const res = await fetch(`${SUPA_URL}/functions/v1/ai-mentor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': `Bearer ${_mentorToken || SUPA_KEY}` },
          body: JSON.stringify({
            questionText: q.q,
            options: q.opts,
            correctOption: q.opts?.[q.ans],
            explanation: q.exp,
            userQuestion: text,
            history: _mentorHistory,
          }),
        });

        const data = await res.json();
        if (res.status === 429) throw new Error('quota_exceeded');
        if (!res.ok || !data.reply) throw new Error(data.error || 'Erro ao contatar o mentor.');

        thinkingEl.classList.remove('mentor-thinking');
        thinkingEl.innerHTML = _renderMentorMarkdown(data.reply);

        // Update history for multi-turn
        _mentorHistory.push({ role: 'user', content: text });
        _mentorHistory.push({ role: 'assistant', content: data.reply });

        _incrementMentorQuota();

        const quotaBar = document.getElementById('mentorQuotaBar');
        if (quotaBar) quotaBar.textContent = _mentorRemainingText();

        // Update the mentor button in feedback if quota exhausted
        if (!_canAskMentor()) {
          document.querySelector('[data-action="openMentorModal"]')?.remove();
        }
      } catch (err) {
        _track('error_mentor_send', { msg: String(err) });
        thinkingEl.classList.remove('mentor-thinking');
        if (String(err).includes('quota_exceeded')) {
          // A recusa do servidor é a fonte: alinha o contador local antes de
          // desenhar, senão a barra segue prometendo perguntas que não há.
          _esgotarMentorQuotaLocal();
          thinkingEl.innerHTML = `Limite diário atingido. <button type="button" class="mentor-inline-action" data-action="closeMentorModalAndUpgrade">Faça upgrade para Premium</button> para perguntas ilimitadas.`;
        } else {
          thinkingEl.textContent = 'Oráculo indisponível no momento. Tente novamente em instantes.';
        }
        thinkingEl.style.color = '#fb7185';
      } finally {
        input.disabled = false;
        if (input.isConnected && input.closest('.mentor-panel')) input.focus();
      }
    }

    function _appendMentorMsg(chat, role, text) {
      const el = document.createElement('div');
      el.className = `mentor-msg mentor-msg-${role}`;
      el.textContent = text;
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
      return el;
    }

    function closeMentorModalAndRegister() {
      closeMentorModal(false);
      if (typeof window.openAuthModal === 'function') {
        window.openAuthModal();
        if (typeof window.switchAuthTab === 'function') window.switchAuthTab('cadastrar');
      }
    }
    function closeMentorModalAndLogin() {
      closeMentorModal(false);
      if (typeof window.openAuthModal === 'function') {
        window.openAuthModal();
        if (typeof window.switchAuthTab === 'function') window.switchAuthTab('entrar');
      }
    }
    function showRegisterFromDiagnosis() {
      if (typeof window.openAuthModal === 'function') {
        window.openAuthModal();
        if (typeof window.switchAuthTab === 'function') window.switchAuthTab('cadastrar');
      }
    }
    function showLoginFromDiagnosis() {
      if (typeof window.openAuthModal === 'function') {
        window.openAuthModal();
        if (typeof window.switchAuthTab === 'function') window.switchAuthTab('entrar');
      }
    }

    function closeMentorModalAndUpgrade() {
      closeMentorModal(false);
      if (typeof window.showPaywallModal === 'function') window.showPaywallModal();
    }
    window.closeMentorModalAndUpgrade = closeMentorModalAndUpgrade;

    // Expose to dispatcher
    window.openMentorModal   = openMentorModal;
    window.closeMentorModal  = closeMentorModal;
    window._sendMentorMessage = _sendMentorMessage;
    window.setMentorQuestion = function(q) { _mentorCurrentQ = q; _mentorHistory = []; };
    window.closeMentorModalAndRegister = closeMentorModalAndRegister;
    window.closeMentorModalAndLogin = closeMentorModalAndLogin;
    window.showRegisterFromDiagnosis = showRegisterFromDiagnosis;
    window.showLoginFromDiagnosis = showLoginFromDiagnosis;
