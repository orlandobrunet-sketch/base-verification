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
      }
    ];
    
    function getUnlockedAchievements() {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    }
    
    function saveUnlockedAchievements(unlocked) {
      try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked)); } catch(e) {}
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
    
    function showAchievementsModal() {
      // Remover popup anterior se existir
      document.querySelectorAll('.achievements-popup').forEach(el => el.remove());
      
      const unlocked = getUnlockedAchievements();
      
      const _achIsMobile = window.innerWidth < 769;
      const modal = document.createElement('div');
      modal.className = 'modal show achievements-popup';
      // No mobile: overflow-y auto no container + align-items flex-start para scroll completo
      // No PC: centralizado com max-height 85vh
      modal.style.cssText = _achIsMobile
        ? 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:flex-start;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:12px 12px calc(env(safe-area-inset-bottom,0px)+80px);box-sizing:border-box;'
        : 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(6px);padding:32px 16px;';
      const _achContentStyle = _achIsMobile
        ? 'max-width:550px;width:100%;max-height:calc(100svh - 100px);max-height:calc(100dvh - 100px);overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:20px 16px;box-shadow:0 0 40px rgba(255,215,0,0.3);'
        : 'max-width:550px;max-height:calc(100vh - 64px);overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(255,215,0,0.3);';
      modal.innerHTML = `
        <div class="modal-content" style="${_achContentStyle}">
          <h2 style="color:var(--gold);margin-bottom:12px;font-family:'MedievalSharp','Cinzel',serif;">🏆 CONQUISTAS 🏆</h2>
          
          <div style="margin-bottom:20px;">
            <div style="display:inline-block;background:rgba(255,215,0,0.15);border:2px solid rgba(255,215,0,0.4);border-radius:50%;width:80px;height:80px;line-height:80px;">
              <span style="font-size:1.8rem;color:var(--gold);font-weight:bold;">${unlocked.length}/${ACHIEVEMENTS_LIST.length}</span>
            </div>
            <div style="color:var(--txt-dim);font-size:0.85rem;margin-top:8px;">Desbloqueadas</div>
          </div>
          
          <!-- Badges de Progressão -->
          <div style="margin-bottom:20px;">
            <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Badges de Progressão</div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;max-width:320px;margin:0 auto;">
              ${BADGES.map(badge => {
                const isUnlocked = state.correctTotal >= badge.required;
                const badgeLabel = isUnlocked ? `${badge.name}` : `${badge.name} (${badge.required} acertos)`;
                return `
                  <div title="${badge.name} (${badge.required} acertos)"
                    data-action="_showBadgeTip" data-pass-this="1" data-badge-label="${escapeHtml(badge.name)} (${badge.required} acertos)"
                    style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;cursor:pointer;
                    border:2px solid ${isUnlocked ? 'var(--gold)' : 'var(--blue-dark)'};
                    box-shadow:${isUnlocked ? '0 0 12px rgba(255,215,0,0.4)' : 'none'};
                  ">
                    <img src="assets/badges/badge${badge.id}.png" alt="${badge.name}"
                      style="width:100%;height:100%;object-fit:cover;
                        filter:${isUnlocked ? 'none' : 'grayscale(60%) brightness(0.7)'};
                        opacity:${isUnlocked ? '1' : '0.7'};
                    ">
                    ${!isUnlocked ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem;background:rgba(0,0,0,0.15);">🔒</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
            <div style="font-size:0.7rem;color:var(--txt-dim);margin-top:8px;">
              ${BADGES.filter(b => state.correctTotal >= b.required).length}/${BADGES.length} badges desbloqueados
            </div>
          </div>

          <div style="display:grid;gap:10px;padding:4px;">
            ${ACHIEVEMENTS_LIST.map(ach => {
              const isUnlocked = unlocked.includes(ach.id);
              return `
                <div style="
                  background:${isUnlocked ? 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.1))' : 'rgba(0,0,0,0.3)'};
                  border:2px solid ${isUnlocked ? '#34d399' : '#374151'};
                  border-radius:10px;
                  padding:12px;
                  display:flex;
                  align-items:center;
                  gap:12px;
                  ${!isUnlocked ? 'opacity:0.5;' : ''}
                  ${isUnlocked ? 'box-shadow:0 0 15px rgba(52,211,153,0.2);' : ''}
                ">
                  <div style="font-size:2.2rem;flex-shrink:0;${!isUnlocked ? 'filter:grayscale(1) brightness(0.6);' : ''}">
                    ${ach.imgIcon
                      ? `<img src="${ach.imgIcon}" alt="${ach.name}" style="width:48px;height:48px;object-fit:contain;${!isUnlocked ? 'filter:grayscale(1) brightness(0.5);' : 'filter:drop-shadow(0 0 8px rgba(255,215,0,0.7));'}">`
                      : ach.icon
                    }
                  </div>
                  <div style="flex:1;text-align:left;">
                    <div style="color:${isUnlocked ? '#34d399' : 'var(--txt)'};font-weight:bold;font-size:0.9rem;display:flex;align-items:center;gap:6px;">
                      ${ach.name}
                      ${isUnlocked ? '<span style="color:#34d399;font-size:0.8rem;">✓</span>' : '<span style="color:#6b7280;font-size:0.7rem;">🔒</span>'}
                    </div>
                    <div style="color:var(--txt-dim);font-size:0.75rem;margin-top:2px;">${ach.description}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <button class="btn gold" style="margin-top:20px;" data-close-closest=".modal">Continuar</button>
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

