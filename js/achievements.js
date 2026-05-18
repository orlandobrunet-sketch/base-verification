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
      {
        id: 'speed_demon',
        name: 'Raio X',
        description: 'Responda 10 questões em menos de 30 segundos cada',
        icon: '⚡',
        condition: (stats) => {
          const fastAnswers = stats.questionHistory.filter(q => q.time > 0 && q.time < 30);
          return fastAnswers.length >= 10;
        }
      },
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
      {
        id: 'night_scholar',
        name: 'Estudioso Noturno',
        description: 'Responda 20 questões entre 22h e 6h',
        icon: '🌙',
        condition: (stats) => {
          const nightQuestions = stats.questionHistory.filter(q => {
            const hour = new Date(q.date).getHours();
            return hour >= 22 || hour < 6;
          });
          return nightQuestions.length >= 20;
        }
      },
      {
        id: 'marathon_runner',
        name: 'Maratonista do Conhecimento',
        description: 'Responda 50 questões em um único dia',
        icon: '🏃',
        condition: (stats) => {
          const today = new Date().toDateString();
          const todayQuestions = stats.questionHistory.filter(q => 
            new Date(q.date).toDateString() === today
          );
          return todayQuestions.length >= 50;
        }
      },
      {
        id: 'arqui_nefromante_slayer',
        name: 'Campeão da Nefrologia',
        description: 'Derrote o Arqui-Nefromante e vença o jogo',
        icon: '🏆',
        imgIcon: 'assets/titulodecampeao.png',
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
        id: 'grimoire_master',
        name: 'Guardião do Grimório Eterno',
        description: 'Desbloqueie todas as referências e artigos do Grimório de Conhecimento',
        icon: '📚',
        condition: () => {
          try {
            const unlockedRefs = new Set(JSON.parse(localStorage.getItem('nq-unlocked-refs') || '[]'));
            const totalRefs = typeof refsDB === 'object' && refsDB !== null ? Object.keys(refsDB).length : 0;
            if (totalRefs === 0 || unlockedRefs.size < totalRefs) return false;
            const unlockedArts = JSON.parse(localStorage.getItem('unlockedArticles') || '[]');
            const totalArts = typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles) ? nefroArticles.length : 0;
            if (totalArts === 0 || unlockedArts.length < totalArts) return false;
            return true;
          } catch { return false; }
        }
      }
    ];
    
    function getUnlockedAchievements() {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    }
    
    function saveUnlockedAchievements(unlocked) {
      try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked)); } catch(e) {}
      _scheduleCloudSync();
    }
    
    function checkAchievements() {
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
      notification.className = 'ach-notification';

      const iconHtml = achievement.imgIcon
        ? `<img src="${achievement.imgIcon}" alt="${achievement.name}" class="ach-notification-img">`
        : `<div class="ach-notification-icon">${achievement.icon}</div>`;
      notification.innerHTML = `
        <div style="text-align:center;">
          ${iconHtml}
          <div class="ach-notification-title">🏆 Conquista Desbloqueada!</div>
          <div class="ach-notification-name">${achievement.name}</div>
          <div class="ach-notification-desc">${achievement.description}</div>
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
      }, 5000);
    }
    
    function closeAchievementsModal() {
      document.querySelectorAll('.achievements-popup').forEach(el => el.remove());
    }

    function showAchievementsModal() {
      closeAchievementsModal();

      const unlocked = getUnlockedAchievements();

      const badgesHTML = BADGES.map(badge => {
        const isUnlocked = state.correctTotal >= badge.required;
        return `<div class="ach-badge-slot${isUnlocked ? ' unlocked' : ''}"
            title="${escapeHtml(badge.name)} (${badge.required} acertos)"
            data-action="_showBadgeTip" data-pass-this="1"
            data-badge-label="${escapeHtml(badge.name)} (${badge.required} acertos)">
          <img src="assets/badges/badge${badge.id}.png" alt="${escapeHtml(badge.name)}">
          ${!isUnlocked ? '<span class="ach-badge-lock">🔒</span>' : ''}
        </div>`;
      }).join('');

      const achRowsHTML = ACHIEVEMENTS_LIST.map(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        const iconHtml = ach.imgIcon
          ? `<img src="${ach.imgIcon}" alt="${escapeHtml(ach.name)}" class="ach-row-img${!isUnlocked ? ' locked' : ''}">`
          : `<span class="ach-row-icon">${ach.icon}</span>`;
        return `<div class="ach-row${isUnlocked ? ' unlocked' : ' locked'}">
          <div class="ach-row-left">${iconHtml}</div>
          <div class="ach-row-body">
            <div class="ach-row-name">${escapeHtml(ach.name)} ${isUnlocked ? '<span class="ach-check">✓</span>' : '<span class="ach-lock-icon">🔒</span>'}</div>
            <div class="ach-row-desc">${escapeHtml(ach.description)}</div>
          </div>
        </div>`;
      }).join('');

      const badgesUnlocked = BADGES.filter(b => state.correctTotal >= b.required).length;

      const modal = document.createElement('div');
      modal.className = 'achievements-popup';
      modal.setAttribute('data-action', 'closeAchievementsModal');
      modal.innerHTML = `
        <div class="ach-box">
          <button class="ach-close" data-action="closeAchievementsModal" aria-label="Fechar">✕</button>
          <h3 class="ach-title">🏆 Conquistas</h3>

          <div class="ach-counter">
            <div class="ach-counter-num">${unlocked.length}/${ACHIEVEMENTS_LIST.length}</div>
            <div class="ach-counter-label">desbloqueadas</div>
          </div>

          <div class="ach-badges-label">Badges de Progressão</div>
          <div class="ach-badges-row">${badgesHTML}</div>
          <div class="ach-badges-count">${badgesUnlocked}/${BADGES.length} badges desbloqueados</div>

          <div class="ach-list">${achRowsHTML}</div>

          <button class="btn gold ach-continue-btn" data-action="closeAchievementsModal">Continuar</button>
        </div>
      `;

      document.body.appendChild(modal);
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
    
    // Variável para tracking de tempo
    let questionStartTime = 0;
    // Erros da sessão atual (reset a cada nova partida)
    let _sessionWrongAnswers = [];
    
    // Modificar a função answer original para incluir tracking
    const originalAnswer = answer;
    window.answer = function(i, btn) {
      if (!state.gameStarted || state.answered || !state.current) return;

      const timeSpent = questionStartTime > 0 ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
      const isCorrect = i === state.current.a;
      
      // Tracking de estatísticas
      trackQuestionAnswer(state.current, isCorrect, timeSpent);

      // Acumular erros da sessão para revisão no fim de partida
      if (!isCorrect && state.current) _sessionWrongAnswers.push(state.current);

      // Marcar questão como dominada após resposta correta
      if (isCorrect && state.current && state.current.id) {
        _masteredSet.add(state.current.id);
        try { localStorage.setItem(MASTERED_KEY, JSON.stringify([..._masteredSet])); } catch(e) {}
      }

      // Desbloquear refs do Grimório ao acertar
      if (isCorrect && state.current?.r?.length) {
        _unlockRefsFromQuestion(state.current.r);
      }

      // Chamar função original
      originalAnswer(i, btn);
      
      // Verificar conquistas
      checkAchievements();
    };
    
    // Modificar renderQuestion para iniciar timer
    const originalRenderQuestion = renderQuestion;
    window.renderQuestion = function() {
      questionStartTime = Date.now();
      originalRenderQuestion();
    };
    
    // Filtros de modo de estudo são aplicados via filterQuestionsByMode() dentro do shuffleQueue

