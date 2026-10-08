// NefroQuest — Achievement System
// Plain script — shares global scope with game.js

    // ============ SISTEMA DE CONQUISTAS/ACHIEVEMENTS ============
    const ACHIEVEMENTS_KEY = 'nefroquest-achievements';
    
    const ACHIEVEMENTS_LIST = [
      {
        id: 'hd_master',
        name: 'Mestre da Hemodiálise',
        description: 'Acerte 50 questões sobre Hemodiálise',
        icon: '💉',
        condition: (stats) => {
          const hdTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('hemodiálise') || t.toLowerCase().includes('hd')
          );
          return hdTopics.reduce((sum, t) => sum + (stats.byTopic[t]?.correct || 0), 0) >= 50;
        }
      },
      {
        id: 'nephron_guardian',
        name: 'Guardião dos Néfrons',
        description: 'Acerte 100 questões consecutivas sem errar',
        icon: '🛡️',
        condition: (stats) => {
          // Usar bestStreak se disponível; recomputa apenas se necessário (evita O(n) por resposta)
          if ((stats.bestStreak || 0) >= 100) return true;
          let maxStreak = 0, cur = 0;
          for (const q of (stats.questionHistory || [])) {
            if (q.correct) { cur++; if (cur > maxStreak) maxStreak = cur; }
            else cur = 0;
          }
          return maxStreak >= 100;
        }
      },
      // 'speed_demon' (10 questões em menos de 30s cada) removida: premiava
      // velocidade sobre compreensão. Ver nota ao fim da lista.
      {
        id: 'perfectionist_drc',
        name: 'Perfeccionista da DRC',
        description: 'Acerte todas as questões do tema DRC (mínimo 20)',
        icon: '💎',
        condition: (stats) => {
          const drcTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('drc') || t.toLowerCase().includes('doença renal crônica')
          );
          return drcTopics.some(t => {
            const data = stats.byTopic[t];
            return data.total >= 20 && data.wrong === 0;
          });
        }
      },
      {
        id: 'transplant_expert',
        name: 'Expert em Transplante',
        description: 'Acerte 30 questões sobre Transplante Renal',
        icon: '🏥',
        condition: (stats) => {
          const txTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('transplante')
          );
          return txTopics.reduce((sum, t) => sum + (stats.byTopic[t]?.correct || 0), 0) >= 30;
        }
      },
      {
        id: 'glomerulo_sage',
        name: 'Sábio das Glomerulopatias',
        description: 'Acerte 40 questões sobre Glomerulopatias',
        icon: '🔬',
        condition: (stats) => {
          const glomTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('glomerul') || t.toLowerCase().includes('nefrite')
          );
          return glomTopics.reduce((sum, t) => sum + (stats.byTopic[t]?.correct || 0), 0) >= 40;
        }
      },
      {
        id: 'century_club',
        name: 'Clube dos 100',
        description: 'Responda 100 questões (certas ou erradas)',
        icon: '💯',
        condition: (stats) => stats.totalQuestions >= 100
      },
      {
        id: 'accuracy_master',
        name: 'Mestre da Precisão',
        description: 'Mantenha 90% de acerto em pelo menos 50 questões',
        icon: '🎯',
        condition: (stats) => {
          return stats.totalQuestions >= 50 && 
                 (stats.totalCorrect / stats.totalQuestions) >= 0.9;
        }
      },
      // 'night_scholar' (20 questões entre 22h e 6h) e 'marathon_runner'
      // (50 questões num único dia) removidas: premiavam virar noite e
      // sessão-maratona. Ver nota ao fim da lista.
      {
        id: 'arqui_nefromante_slayer',
        name: 'Campeão da Nefrologia',
        description: 'Derrote o Arqui-Nefromante e vença o jogo',
        icon: '🏆',
        imgIcon: 'assets/achievements/campeao.webp',
        condition: (stats) => {
          return !!localStorage.getItem('nefroquest-arqui-defeated');
        }
      },
      {
        id: 'hardcore_champion',
        name: 'Lenda Hardcore',
        description: 'Vença o jogo no modo Hardcore (1 vida, somente difíceis)',
        icon: '💀',
        condition: (stats) => {
          return !!localStorage.getItem('nefroquest-hardcore-completed');
        }
      },
      {
        id: 'acid_base_master',
        name: 'Alquimista Renal',
        description: 'Conclua todos os casos da Câmara do Equilíbrio (minigame ácido-base)',
        icon: '⚗️',
        condition: () => {
          try {
            const p = JSON.parse(localStorage.getItem('nq-acidbase-progress') || '{}');
            const done = new Set(p.completed || []);
            // IDs em sync com CASES em js/minigame-acidbase.js
            const allCases = ['aldric', 'mara', 'theron', 'vance', 'kael', 'vorgath', 'selene', 'edrin', 'liora', 'borius', 'isolde', 'corvin', 'ophelia', 'helena', 'brann', 'nara', 'galen', 'maelis', 'ivar', 'mireth'];
            return allCases.every(id => done.has(id));
          } catch { return false; }
        }
      },
      {
        id: 'grimoire_master',
        name: 'Guardião do Grimório Eterno',
        description: 'Desbloqueie todas as referências e artigos do Grimório de Conhecimento',
        icon: '📚',
        condition: () => {
          try {
            const unlockedRefs = new Set(JSON.parse(localStorage.getItem('nq-unlocked-refs') || '[]'));
            const reachableRefs = new Set(Array.isArray(window.questionBank)
              ? window.questionBank.flatMap(question => Array.isArray(question.r) ? question.r : []).filter(Boolean)
              : []);
            const validRefs = typeof refsDB === 'object' && refsDB !== null
              ? [...reachableRefs].filter(key => Object.prototype.hasOwnProperty.call(refsDB, key))
              : [];
            if (validRefs.length === 0 || !validRefs.every(key => unlockedRefs.has(key))) return false;
            const unlockedArts = JSON.parse(localStorage.getItem('unlockedArticles') || '[]');
            const totalArts = typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles) ? nefroArticles.length : 0;
            if (totalArts === 0 || unlockedArts.length < totalArts) return false;
            return true;
          } catch { return false; }
        }
      },
      {
        id: 'laurel_wreath_knowledge',
        name: 'Coroa de Louros de Esculápio',
        description: 'Alcance 1.000 ou mais de Conhecimento Acumulado no Oráculo',
        icon: '🌿',
        condition: () => {
          try {
            const totalAccumulatedKnowledge = parseInt(localStorage.getItem('nefroquest_total_accumulated_knowledge') || '0', 10);
            return totalAccumulatedKnowledge >= 1000;
          } catch { return false; }
        }
      }
    ];
    
    // Apresentação compartilhada; IDs e condições acima continuam sendo a regra.
    const NQ_ACHIEVEMENT_ART = {
      hd_master: 'hemodialise', nephron_guardian: 'guardiao',
      perfectionist_drc: 'cristal', transplant_expert: 'transplante',
      glomerulo_sage: 'microscopio', century_club: 'centenario',
      accuracy_master: 'precisao', hardcore_champion: 'hardcore',
      acid_base_master: 'alquimia', grimoire_master: 'grimorio',
      laurel_wreath_knowledge: 'louros', arqui_nefromante_slayer: 'campeao',
    };

    function getAchievementArtwork(id) {
      return NQ_ACHIEVEMENT_ART[id] ? `assets/achievements/${NQ_ACHIEVEMENT_ART[id]}.webp` : '';
    }

    let _nqAchievementArtworkDialog = null;

    function closeAchievementArtwork(options) {
      const dialog = _nqAchievementArtworkDialog;
      _nqAchievementArtworkDialog = null;
      if (!dialog) return;
      // A limpeza de conta remove o dialog sem devolver foco à jornada encerrada.
      if (!(options && options.restoreFocus === false)) dialog.close();
      dialog.remove();
    }

    function showAchievementArtwork({ name, description, source, status, acquired = false, progress = null }) {
      if (!source || !name) return;
      closeAchievementArtwork();
      const dialog = document.createElement('dialog');
      dialog.className = `nq-ach-detail ${acquired ? 'is-unlocked' : 'is-locked'}`;
      dialog.dataset.acquired = String(acquired);
      dialog.setAttribute('aria-labelledby', 'nqAchievementArtworkTitle');
      dialog.setAttribute('aria-describedby', 'nqAchievementArtworkRequirement');
      const value = progress ? Math.max(0, Math.min(Number(progress.value) || 0, Number(progress.target) || 0)) : 0;
      const target = progress ? Math.max(0, Number(progress.target) || 0) : 0;
      dialog.innerHTML = `
        <div class="nq-ach-detail-reading" tabindex="0" role="region" aria-label="Arte e requisito da conquista">
          <div class="nq-ach-detail-art"><img src="${escapeHtml(source)}" alt="" decoding="async" width="512" height="512"></div>
          <div class="nq-ach-detail-copy">
            <p class="nq-ach-detail-state">${escapeHtml(status || 'A conquistar')}</p>
            <h2 id="nqAchievementArtworkTitle">${escapeHtml(name)}</h2>
            <p id="nqAchievementArtworkRequirement">${escapeHtml(description || '')}</p>
            ${target ? `<div class="nq-ach-detail-progress"><span>${value.toLocaleString('pt-BR')} de ${target.toLocaleString('pt-BR')}</span><div role="progressbar" aria-label="${escapeHtml('Progresso de ' + name)}" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${value}"><span style="width:${value / target * 100}%"></span></div></div>` : ''}
          </div>
        </div>
        <footer><button type="button" data-action="closeAchievementArtwork">Voltar à coleção</button></footer>`;
      dialog.addEventListener('keydown', event => event.stopPropagation());
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeAchievementArtwork(); });
      document.body.appendChild(dialog);
      _nqAchievementArtworkDialog = dialog;
      // O diálogo nativo isola o fundo e restaura o foco sem alterar a jornada.
      dialog.showModal();
    }

    function getUnlockedAchievements() {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    }
    
    function saveUnlockedAchievements(unlocked) {
      if (typeof isProgressSandbox === 'function' && isProgressSandbox()) return;
      try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked)); } catch(e) {
        if (typeof _toast === 'function') _toast('Conquista desbloqueada, mas não foi possível salvar localmente — armazenamento cheio.', 'warning', 6000);
        if (typeof _track === 'function') _track('error_localstorage_achievements', {});
      }
      _scheduleCloudSync();
    }
    
    function checkAchievements() {
      if (typeof isProgressSandbox === 'function' && isProgressSandbox()) return;
      const stats = getDetailedStats();
      const unlocked = getUnlockedAchievements();
      const newUnlocked = [];
      
      ACHIEVEMENTS_LIST.forEach(achievement => {
        if (!unlocked.includes(achievement.id) && achievement.condition(stats)) {
          unlocked.push(achievement.id);
          newUnlocked.push(achievement);
        }
      });
      
      if (newUnlocked.length > 0) {
        saveUnlockedAchievements(unlocked);
        newUnlocked.forEach(ach => showAchievementNotification(ach));
      }
    }
    
    function showAchievementNotification(achievement) {
      playSound('levelup');

      const notification = document.createElement('div');
      notification.className = 'ach-notification nq-ach-celebration';
      notification.setAttribute('role', 'status');
      notification.setAttribute('aria-live', 'polite');

      const artwork = getAchievementArtwork(achievement.id) || achievement.imgIcon;
      const iconHtml = artwork
        ? `<img src="${escapeHtml(artwork)}" alt="" class="ach-notification-img" width="512" height="512">`
        : `<div class="ach-notification-icon">${achievement.icon}</div>`;
      notification.innerHTML = `
        <div class="nq-ach-celebration-inner">
          ${iconHtml}
          <div><div class="ach-notification-title">Nova conquista</div>
          <div class="ach-notification-name">${escapeHtml(achievement.name)}</div>
          <div class="ach-notification-desc">${escapeHtml(achievement.description)}</div></div>
        </div>
      `;

      let stack = document.getElementById('nqAchievementCelebrations');
      if (!stack) {
        stack = document.createElement('div');
        stack.id = 'nqAchievementCelebrations';
        document.body.appendChild(stack);
      }
      stack.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('is-leaving');
        setTimeout(() => { notification.remove(); if (!stack.children.length) stack.remove(); }, 350);
      }, 5000);
    }
    
    function closeAchievementsModal() {
      closeAchievementArtwork();
      document.querySelectorAll('.achievements-popup').forEach(el => el.remove());
    }


    // Ícones vetoriais aprovados para o acervo; não altera critérios de conquista.
    const NQ_ACHIEVEMENT_ICONS = {
  "hd_master": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"M25 12h14v35H25Z\"/><path d=\"M25 17h14M25 42h14M29 12V7h6v5M29 47v6h6v-6M25 23H13v18H7M39 35h12V18h6\"/><path class=\"detail\" d=\"M29 22h6M29 27h6M29 32h6M29 37h6\"/><circle class=\"spark\" cx=\"13\" cy=\"27\" r=\"2\"/><circle class=\"spark\" cx=\"51\" cy=\"30\" r=\"2\"/></svg>",
  "nephron_guardian": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"M9 12 32 5l23 7v18c0 15-23 27-23 27S9 45 9 30Z\"/><g transform=\"translate(7 7) scale(.78)\"><path class=\"volume\" d=\"M28 16c-10-8-19 3-17 16 1 11 11 18 18 11 5-5 1-10-4-12-5-3 6-8 3-15Z\"/><path class=\"detail\" d=\"M22 21c-6-2-8 4-7 10 1 5 4 9 8 9M28 28c7-1 8 7 10 12\"/></g><path class=\"detail\" d=\"M15 17v12c0 9 11 18 17 21\"/></svg>",
  "perfectionist_drc": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"m18 9 28 0 10 16-24 31L8 25Z\"/><path class=\"detail\" d=\"M8 25h48M18 9l-3 16 17 31 17-31-3-16M24 9l8 16 8-16\"/><path class=\"spark\" d=\"m51 4 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z\"/></svg>",
  "transplant_expert": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><g transform=\"translate(-2 7) scale(.76)\"><path class=\"volume\" d=\"M28 16c-10-8-19 3-17 16 1 11 11 18 18 11 5-5 1-10-4-12-5-3 6-8 3-15Z\"/><path class=\"detail\" d=\"M22 21c-6-2-8 4-7 10 1 5 4 9 8 9M28 28c7-1 8 7 10 12\"/></g><g transform=\"translate(65 7) scale(-.76 .76)\"><path class=\"volume\" d=\"M28 16c-10-8-19 3-17 16 1 11 11 18 18 11 5-5 1-10-4-12-5-3 6-8 3-15Z\"/><path class=\"detail\" d=\"M22 21c-6-2-8 4-7 10 1 5 4 9 8 9M28 28c7-1 8 7 10 12\"/></g><path d=\"M23 12c7-6 16-6 23 0M41 7l5 5-6 1M41 51c-7 6-16 6-23 0M23 50l-5 1 5 5\"/><path class=\"detail\" d=\"M32 23v16M27 31h10\"/></svg>",
  "glomerulo_sage": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"m28 10 8 5-11 18-8-5Z\"/><path d=\"m30 9 5-2 6 4-2 6M25 31l-3 5M18 38h18M35 22c12 5 13 19 4 26M12 52h40M20 51v-6h23v6\"/><path class=\"detail\" d=\"M15 37v4M27 42h8\"/></svg>",
  "century_club": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path d=\"M25 51C9 46 8 27 17 13M39 51c16-5 17-24 8-38\"/><path class=\"volume\" d=\"M15 21c-7-1-9-6-8-10 6 1 9 4 8 10ZM12 32c-7 0-10-5-10-9 6 0 10 3 10 9ZM17 43c-7 3-12 0-14-4 6-3 11-2 14 4ZM49 21c7-1 9-6 8-10-6 1-9 4-8 10ZM52 32c7 0 10-5 10-9-6 0-10 3-10 9ZM47 43c7 3 12 0 14-4-6-3-11-2-14 4Z\"/><path class=\"detail\" d=\"M27 54h10\"/><text x=\"32\" y=\"37\" text-anchor=\"middle\" class=\"number\">100</text></svg>",
  "accuracy_master": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><circle class=\"volume\" cx=\"30\" cy=\"34\" r=\"21\"/><circle cx=\"30\" cy=\"34\" r=\"13\"/><circle class=\"detail\" cx=\"30\" cy=\"34\" r=\"5\"/><path d=\"m30 34 22-22M45 9v10h10M47 6l-2 3M55 16l3-3\"/><path class=\"spark\" d=\"m30 31 3 3-3 3-3-3Z\"/></svg>",
  "arqui_nefromante_slayer": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"m9 25 8 7 6-13 9 11 9-11 6 13 8-7-6 23H15Z\"/><path d=\"M15 43h34M18 52h28M32 12V5\"/><circle class=\"spark\" cx=\"32\" cy=\"8\" r=\"3\"/><path class=\"detail\" d=\"m28 36 4-4 4 4-4 4Z\"/></svg>",
  "hardcore_champion": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"M20 48C7 40 10 25 21 18c-1 9 7 10 8 0 1-6-1-9 5-15-1 11 13 18 13 29 0 10-5 15-10 18Z\"/><path class=\"detail\" d=\"M24 48c-6-6-1-12 4-16 1 7 6 6 7 1 7 9 4 15-2 19\"/><path d=\"M18 56h28\"/></svg>",
  "acid_base_master": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"M24 9h16M27 9v18L13 47c-3 5 0 8 6 8h26c6 0 9-3 6-8L37 27V9\"/><path d=\"M22 35h20M18 46c9-5 18 5 28 0\"/><circle class=\"detail\" cx=\"28\" cy=\"40\" r=\"2\"/><circle class=\"spark\" cx=\"37\" cy=\"46\" r=\"2\"/><path class=\"detail\" d=\"M13 14h7M16 10v8M46 22h7M49 18v8\"/></svg>",
  "grimoire_master": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"M10 14c8-3 14-1 22 3 8-4 14-6 22-3v34c-9-2-15-1-22 3-7-4-13-5-22-3Z\"/><path d=\"M32 18v32\"/><path class=\"detail\" d=\"M16 22c4-1 7 0 10 2M16 29c4-1 7 0 10 2M16 36c4-1 7 0 10 2M38 24c5-5 11 1 9 7-1 4-5 7-8 4-2-3 2-4 3-5 2-2-3-2-4-6Z\"/></svg>",
  "laurel_wreath_knowledge": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path d=\"M25 51C9 46 8 27 17 13M39 51c16-5 17-24 8-38\"/><path class=\"volume\" d=\"M15 21c-7-1-9-6-8-10 6 1 9 4 8 10ZM12 32c-7 0-10-5-10-9 6 0 10 3 10 9ZM17 43c-7 3-12 0-14-4 6-3 11-2 14 4ZM49 21c7-1 9-6 8-10-6 1-9 4-8 10ZM52 32c7 0 10-5 10-9-6 0-10 3-10 9ZM47 43c7 3 12 0 14-4-6-3-11-2-14 4Z\"/><path class=\"volume\" d=\"m24 28 4 5 4-9 4 9 4-5-3 15H27Z\"/><path class=\"detail\" d=\"M28 47h8M32 17v-5M29 14h6\"/></svg>"
};
    const NQ_MILESTONE_ICONS = ["<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path d=\"M46 17c-13-14-35 1-29 17 5 15 26 13 30 1 4-11-8-20-16-14-7 5-3 15 4 13\"/><g transform=\"translate(12 14) scale(.55)\"><path class=\"volume\" d=\"M28 16c-10-8-19 3-17 16 1 11 11 18 18 11 5-5 1-10-4-12-5-3 6-8 3-15Z\"/><path class=\"detail\" d=\"M22 21c-6-2-8 4-7 10 1 5 4 9 8 9M28 28c7-1 8 7 10 12\"/></g><path class=\"detail\" d=\"M12 44c11 14 33 11 42-3\"/></svg>","<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"m28 10 8 5-11 18-8-5Z\"/><path d=\"m30 9 5-2 6 4-2 6M25 31l-3 5M18 38h18M35 22c12 5 13 19 4 26M12 52h40M20 51v-6h23v6\"/><path class=\"detail\" d=\"M15 37v4M27 42h8\"/></svg>","<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"M32 7C27 19 14 30 14 40a18 18 0 0 0 36 0C50 30 37 19 32 7Z\"/><path class=\"detail\" d=\"M20 40c7-5 17 5 24 0M20 47c7-5 17 5 24 0\"/></svg>","<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path d=\"M32 10v44M15 54h34M11 23h42M18 23l-9 17h18ZM46 23 37 40h18Z\"/><circle class=\"spark\" cx=\"32\" cy=\"15\" r=\"4\"/><path class=\"detail\" d=\"M9 40c3 6 15 6 18 0M37 40c3 6 15 6 18 0\"/></svg>","<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><path class=\"volume\" d=\"M20 46V28l12-12 12 12v18Z\"/><path d=\"M15 51h34M23 56h18M32 8V3M13 14l-4-4M51 14l4-4M8 31H3M56 31h5\"/><path class=\"detail\" d=\"M26 46V32l6-6 6 6v14\"/></svg>"];
    window._nqAchievementBadgeTip = function(button) {
      const detail = button.closest('.nqach-card')?.querySelector('.nqach-marco-detail');
      if (!detail) return;
      detail.hidden = false;
      detail.textContent = button.dataset.badgeLabel || '';
    };

    function showAchievementsModal() {
      closeAchievementsModal();

      /* Só conta o que ainda existe.
       *
       * O array salvo guarda identificadores conquistados um dia, e algumas
       * conquistas foram removidas de propósito — 'speed_demon' premiava
       * responder rápido, 'night_scholar' e 'marathon_runner' premiavam virar
       * noite. Elas saíram da lista, mas continuam no save de quem as ganhou.
       *
       * As LINHAS do modal já eram imunes, porque são geradas a partir da lista
       * atual. O CONTADOR não era: `unlocked.length` incluía os removidos e
       * exibia coisas como "14/12" — mais conquistas do que existem.
       *
       * A Central já filtrava assim; aqui o filtro faltava. Filtrar na
       * exibição, e não no save, é deliberado: ninguém perde registro do que
       * conquistou, e nada é apagado do histórico de quem jogou. */
      const _idsAtuais = new Set(ACHIEVEMENTS_LIST.map(a => a.id));
      const unlocked = getUnlockedAchievements().filter(id => _idsAtuais.has(id));


      const badgesHTML = BADGES.map((badge, index) => {
        const reached = state.correctTotal >= badge.required;
        return `<li class="nqach-milestone${reached ? ' reached' : ''}">
          <button class="nqach-rune" data-action="_nqAchievementBadgeTip" data-pass-this="1"
            aria-label="${escapeHtml(badge.name)} — ${badge.required} acertos — ${reached ? 'Conquistado' : 'A conquistar'}"
            title="${escapeHtml(badge.name)}" data-badge-label="${escapeHtml(badge.name)} — ${badge.required} acertos">
            ${NQ_MILESTONE_ICONS[index] || ''}
          </button><strong>${badge.required}</strong><span>acertos</span><span class="nqach-milestone-state">${reached ? '✓ Conquistado' : 'A conquistar'}</span><small>${escapeHtml(badge.name)}</small>
        </li>`;
      }).join('');
      const rowsHTML = ACHIEVEMENTS_LIST.map(achievement => {
        const achieved = unlocked.includes(achievement.id);
        return `<li class="nqach-achievement${achieved ? ' unlocked' : ''}" data-achievement-id="${achievement.id}">
          <div class="nqach-emblem">${NQ_ACHIEVEMENT_ICONS[achievement.id] || ''}</div>
          <div class="nqach-goal"><h3>${escapeHtml(achievement.name)}</h3><p>${escapeHtml(achievement.description)}</p>
            <span class="nqach-status">${achieved ? '' : '<span class="nqach-lock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="11" width="12" height="10" rx="2"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/></svg></span>'}${achieved ? 'Desbloqueada' : 'A conquistar'}</span>
          </div>
        </li>`;
      }).join('');
      const modal = document.createElement('div');
      modal.className = 'achievements-popup nqnarr-overlay nqach-overlay';
      modal.innerHTML = `<section class="nqnarr-card nqach-card">
        <div class="nqnarr-reading" role="region" tabindex="0" aria-label="Marcos e requisitos das conquistas">
          <header class="nqach-intro"><div><p class="nqnarr-chapter">Trajetória do Guardião</p><h2>Conquistas</h2></div>
            <p class="nqach-count"><strong>${unlocked.length} de ${ACHIEVEMENTS_LIST.length}</strong><span>desbloqueadas</span></p>
          </header>
          <section class="nqach-journey"><h3>Marcos da jornada</h3><ol class="nqach-milestones">${badgesHTML}</ol><p class="nqach-marco-detail" role="status" hidden></p></section>
          <section class="nqach-collection"><h3>Seu acervo de conquistas</h3><ul class="nqach-achievement-list">${rowsHTML}</ul></section>
        </div>
        <footer class="nqnarr-footer"><button class="nqnarr-primary" data-action="closeAchievementsModal">Continuar</button></footer>
      </section>`;

      document.body.appendChild(modal);

      nqDialogo(modal);
      playSound('click');
    }
    
    // Adicionar animações CSS
    const achievementStyles = document.createElement('style');
    achievementStyles.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 10px 40px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.2); }
        50% { box-shadow: 0 10px 40px rgba(255,215,0,0.5), 0 0 30px rgba(255,215,0,0.4); }
      }
    `;
    document.head.appendChild(achievementStyles);

    // ============ INTEGRAÇÃO COM O SISTEMA EXISTENTE ============
    
    // Variável para tracking de tempo (gerenciada por game.js)
    window.questionStartTime = 0;
    // Erros da sessão atual (reset a cada nova partida)
    window._sessionWrongAnswers = [];
    
    // Filtros de modo de estudo são aplicados via filterQuestionsByMode() dentro do shuffleQueue

