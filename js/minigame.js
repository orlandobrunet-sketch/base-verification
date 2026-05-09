// NefroQuest — Minigame: Julgamento Rápido
// Plain script — shares global scope with game.js

    // ===== MINIGAME: JULGAMENTO RÁPIDO =====
    // Data loaded from data/rapid-quiz.js

    let _minigameTriggerCount = 0;
    let _shownMinigameIds = new Set(); // anti-repetição na sessão
    const MINIGAME_TRIGGER_AT = [25, 50, 75]; // 3 triggers GARANTIDOS

    function maybeTriggerMinigame(atCorrectTotal) {
      if (!MINIGAME_TRIGGER_AT.includes(atCorrectTotal)) return;
      if (_minigameTriggerCount >= MINIGAME_TRIGGER_AT.length) return;
      const triggerIdx = MINIGAME_TRIGGER_AT.indexOf(atCorrectTotal);
      _minigameTriggerCount++;
      setTimeout(() => showMinigameIntroPopup(atCorrectTotal, triggerIdx), 1500);
    }

    const _minigameIntros = [
      { title:"A Pedra do Julgamento", icon:"⚡", chapter:"Evento Especial · Capítulo V",
        text:"Ao cruzar as Montanhas do SRAA, uma pedra ancestral emerge das névoas, gravada com runas douradas! Dez afirmações sobre nefrologia aguardam seu julgamento. A Pedra recompensa o sábio — e expõe o ignorante.",
        reward:"Ouro, XP e itens raros para o mestre do conhecimento!" },
      { title:"O Tribunal das Verdades Renais", icon:"⚖️", chapter:"Evento Especial · Capítulo X",
        text:"No Vulcão da Rabdomiólise, um tribunal etéreo se materializa! Espíritos dos grandes nefrologistas exigem que você prove ser digno. Dez verdades e mentiras se misturam — apenas o erudito as separa.",
        reward:"Recompensas elevadas aguardam quem vencer o Tribunal!" },
      { title:"O Oráculo do Abismo", icon:"🔮", chapter:"Evento Especial · Capítulo XV",
        text:"No Abismo da Hipercalemia, um oráculo antigo bloqueia seu avanço rumo ao Arqui-Nefromante! 'Prove o domínio da verdade nefrológica,' ecoa entre as paredes. Este é o último teste antes da batalha final.",
        reward:"O Oráculo oferece o maior tesouro para o digno!" }
    ];

    function showMinigameIntroPopup(atCorrectTotal, triggerIdx) {
      const intro = _minigameIntros[triggerIdx] || _minigameIntros[0];
      const popup = document.createElement('div');
      popup.className = 'narrative-popup';
      popup.id = 'minigameIntroPopup';
      popup.innerHTML = `
        <div class='narrative-card' style="border-color:#4ade80;box-shadow:0 0 40px rgba(74,222,128,0.35);">
          <div class='narr-chapter' style="color:#4ade80;">${intro.chapter}</div>
          <h3 style="color:#a7f3d0;">${intro.icon} ${intro.title}</h3>
          <div class='narr-text' style="color:#d1fae5;font-style:italic;">${intro.text}</div>
          <div style="background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.35);border-radius:10px;padding:10px 14px;margin:14px 0;text-align:center;">
            <div style="font-size:0.7rem;color:#4ade80;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">🎁 Prêmio Disponível</div>
            <div style="font-size:0.8rem;color:#a7f3d0;">${intro.reward}</div>
          </div>
          <div class='narr-progress'>
            <strong>${state.correctTotal}</strong> acertos · Nível <strong>${state.level}</strong>
          </div>
          <button class='btn gold' id='acceptMinigameBtn' style="background:linear-gradient(135deg,#065f46,#059669);border-color:#4ade80;color:#ecfdf5;width:100%;">⚡ Aceitar o Desafio!</button>
        </div>`;
      document.body.appendChild(popup);
      document.getElementById('acceptMinigameBtn')?.addEventListener('click', () => {
        popup.remove();
        showRapidQuizMinigame();
      });
    }

    function showRapidQuizMinigame(standalone) {
      standalone = !!standalone;
      const POOL_SIZE = 10;
      // Selecionar 10 questões evitando repetição na sessão
      let availableIdx = RAPID_QUIZ_QUESTIONS.map((_,i)=>i).filter(i => !_shownMinigameIds.has(i));
      if (availableIdx.length < POOL_SIZE) {
        _shownMinigameIds.clear();
        availableIdx = RAPID_QUIZ_QUESTIONS.map((_,i)=>i);
      }
      // Fisher-Yates parcial
      for (let i = availableIdx.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIdx[i], availableIdx[j]] = [availableIdx[j], availableIdx[i]];
      }
      const selectedIdx = availableIdx.slice(0, POOL_SIZE);
      selectedIdx.forEach(i => _shownMinigameIds.add(i));
      const pool = selectedIdx.map(i => RAPID_QUIZ_QUESTIONS[i]);

      let currentIdx = 0;
      let correctCount = 0;
      let timerInterval = null;
      let _answered = false;
      const TIME_PER_Q = 8;

      const overlay = document.createElement('div');
      overlay.className = 'minigame-overlay';
      overlay.id = 'rapidQuizOverlay';
      document.body.appendChild(overlay);

      window._exitMinigame = function() {
        if (timerInterval) clearInterval(timerInterval);
        overlay.remove();
        delete window.mgAnswer;
        delete window._exitMinigame;
      };

      function _renderMinigameQuestion() {
        if (currentIdx >= pool.length) { showResults(); return; }
        const q = pool[currentIdx];
        let timeLeft = TIME_PER_Q;
        _answered = false;
        if (timerInterval) clearInterval(timerInterval);

        overlay.innerHTML = `
          <div class="minigame-card">
            ${standalone ? '<button data-action="_exitMinigame" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#64748b;font-size:1.1rem;cursor:pointer;line-height:1;" title="Sair">✕</button>' : ''}
            <div class="minigame-title">⚡ Julgamento Rápido</div>
            <div class="minigame-subtitle">Verdadeiro ou Falso? ${TIME_PER_Q}s por afirmação</div>
            <div class="minigame-progress">${currentIdx + 1} / ${pool.length}</div>
            <div class="minigame-timer"><div class="minigame-timer-fill" id="mgTimerFill" style="width:100%"></div></div>
            <div class="minigame-stmt" id="mgStmt">${escapeHtml(q.q)}</div>
            <div class="minigame-tf-btns">
              <button class="minigame-true-btn" id="mgTrue" data-action="mgAnswer" data-arg="true" data-arg-type="boolean">✓ VERDADEIRO</button>
              <button class="minigame-false-btn" id="mgFalse" data-action="mgAnswer" data-arg="false" data-arg-type="boolean">✗ FALSO</button>
            </div>
            <div id="mgFeedback" style="min-height:32px;font-size:0.75rem;color:#94a3b8;text-align:center;line-height:1.4;"></div>
          </div>`;

        timerInterval = setInterval(() => {
          timeLeft -= 0.1;
          const fill = document.getElementById('mgTimerFill');
          if (fill) fill.style.width = Math.max(0, (timeLeft / TIME_PER_Q * 100)) + '%';
          if (timeLeft <= 0) {
            clearInterval(timerInterval);
            mgAnswer(null);
          }
        }, 100);
      }

      window.mgAnswer = function(userAns) {
        if (_answered) return; // previne double-click / double-fire por timer
        _answered = true;
        if (timerInterval) clearInterval(timerInterval);
        const q = pool[currentIdx];
        const isCorrect = userAns === q.ans;
        if (isCorrect) correctCount++;
        const fb = document.getElementById('mgFeedback');
        const trueBtn = document.getElementById('mgTrue');
        const falseBtn = document.getElementById('mgFalse');
        if (trueBtn) trueBtn.disabled = true;
        if (falseBtn) falseBtn.disabled = true;
        if (userAns !== null) {
          const clickedBtn = userAns ? trueBtn : falseBtn;
          const correctBtn = q.ans ? trueBtn : falseBtn;
          if (clickedBtn) clickedBtn.style.opacity = isCorrect ? '1' : '0.5';
          if (!isCorrect && correctBtn) correctBtn.style.boxShadow = '0 0 14px rgba(74,222,128,0.85)';
        }
        if (fb) {
          fb.style.color = isCorrect ? '#4ade80' : '#fb7185';
          fb.textContent = (userAns === null ? '⏱️ Tempo esgotado! ' : (isCorrect ? '✓ Correto! ' : '✗ Incorreto! ')) + q.exp;
        }
        currentIdx++;
        // Resposta antecipada: avança em 1000ms quando usuário clica; timeout = 1800ms
        setTimeout(_renderMinigameQuestion, userAns !== null ? 1000 : 1800);
      };

      function _getItemReward(score) {
        if (score < 8) return null;
        const slotKeys = ['weapon','armor','relic'];
        const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
        const slotPool = items[slot];
        const tiers = score >= 9 ? ['epic','legendary'] : ['rare','epic'];
        const candidates = slotPool.filter(i => tiers.includes(i.rar));
        const item = candidates.length
          ? candidates[Math.floor(Math.random()*candidates.length)]
          : slotPool[Math.floor(Math.random()*slotPool.length)];
        return { slot, item: Object.assign({}, item) };
      }

      function showResults() {
        const total = pool.length;
        const pct = correctCount / total;
        const baseGold = 30 + correctCount * 20;
        const baseXP   = 10 + correctCount * 8;
        const mult = pct >= 0.8 ? 1.5 : 1;
        const goldReward = standalone ? 0 : Math.round(baseGold * mult);
        const xpReward   = standalone ? 0 : Math.round(baseXP * mult);
        const itemReward = standalone ? null : _getItemReward(correctCount);

        if (!standalone) {
          state.gold += goldReward;
          gainXP(xpReward);
        }

        const emojis = ['😓','😓','🤔','🤔','🙂','🙂','😊','🌟','🌟','🏆','🏆'];
        const emoji = emojis[correctCount] || '🏆';
        const msg = correctCount >= 9 ? 'Maestria absoluta! Você domina a nefrologia!' :
                    correctCount >= 7 ? 'Excelente! Conhecimento de mestre!' :
                    correctCount >= 5 ? 'Bom! Continue aprimorando.' :
                    correctCount >= 3 ? 'Pratique mais esses tópicos.' :
                    'Revise os conceitos. Você chega lá!';

        const itemHtml = itemReward ? `
          <div style="background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.45);border-radius:10px;padding:10px 14px;margin:8px 0;text-align:center;">
            <div style="font-size:0.7rem;color:#4ade80;font-weight:700;letter-spacing:1px;margin-bottom:4px;">🎁 ITEM CONQUISTADO</div>
            <div style="font-size:0.9rem;color:#a7f3d0;font-weight:700;">${itemReward.item.n}</div>
            <div style="font-size:0.7rem;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;">${itemReward.item.rar} · ATK ${itemReward.item.atk} · DEF ${itemReward.item.def} · KNO ${itemReward.item.kno}</div>
          </div>` : '';

        const rewardHtml = standalone
          ? `<div class="minigame-reward" style="color:#94a3b8;">Modo Livre — sem recompensas de jogo</div>`
          : `<div class="minigame-reward">+${goldReward} 🪙  +${xpReward} XP</div>${itemHtml}`;

        let standaloneBest = '';
        if (standalone) {
          const bestKey = 'nefroquest-minigame-best';
          const prev = parseInt(localStorage.getItem(bestKey) || '0', 10);
          if (correctCount > prev) {
            localStorage.setItem(bestKey, String(correctCount));
            standaloneBest = `<div style="font-size:0.72rem;color:#fbbf24;text-align:center;margin-bottom:10px;">⭐ Novo recorde pessoal!</div>`;
          } else if (prev > 0) {
            standaloneBest = `<div style="font-size:0.72rem;color:#94a3b8;text-align:center;margin-bottom:10px;">Recorde pessoal: ${prev}/10</div>`;
          }
        }

        const continueBtnAttrs = standalone
          ? `data-remove-id="rapidQuizOverlay"`
          : `data-remove-id="rapidQuizOverlay" data-action-seq="renderHUD,updateBadges,saveGame"`;

        overlay.innerHTML = `
          <div class="minigame-card">
            <div class="minigame-title">⚡ Resultado</div>
            <div class="minigame-result">${emoji} ${correctCount}/${total} corretas</div>
            ${rewardHtml}
            ${standaloneBest}
            <p style="color:#94a3b8;font-size:0.75rem;text-align:center;margin-bottom:16px">${msg}</p>
            <button class="diff-confirm-btn" id="mgContinueBtn" ${continueBtnAttrs}>${standalone ? '✓ Fechar' : 'Continuar a Jornada'}</button>
          </div>`;

        if (itemReward) {
          document.getElementById('mgContinueBtn')?.addEventListener('click', () => {
            setTimeout(() => {
              try { equipOrSell(itemReward.slot, itemReward.item, m => log(m)); } catch(e) { _track('error_equip_item_reward', { msg: String(e) }); }
            }, 400);
          }, { once: true });
        }

        if (!standalone) {
          log('⚡ Julgamento Rápido: ' + correctCount + '/' + total + ' corretas → +' + goldReward + ' ouro +' + xpReward + ' XP' + (itemReward ? ' + ' + itemReward.item.n : ''));
        }
      }

      _renderMinigameQuestion();
    }
    window.showRapidQuizMinigame = showRapidQuizMinigame;
    window.showStandaloneMinigame = function() { showRapidQuizMinigame(true); };

    function checkNarrative(){
      // Popup especial de intro do boss ao atingir 90 acertos
      if (state.correctTotal === BOSS_START_CORRECT && !state.bossIntroShown) {
        state.bossIntroShown = true;
        state.narrativeShown = BOSS_START_CORRECT; // marca capítulo 90 como visto
        _track('boss_entered', { level: state.level, score: state.score, difficulty: state.difficulty });
        showBossIntroPopup();
        return; // não mostra narrativa comum ao mesmo tempo
      }
      // Narrativa de 100 acertos é substituída pelo modal de vitória (checkGameCompletion)
      if (state.correctTotal >= 100) return;
      const stage = narrativeStages.find(s => s.at === state.correctTotal && state.narrativeShown < s.at);
      if(!stage) return;
      state.narrativeShown = stage.at;
      showNarrativePopup(stage);
      // Chance de minigame após narrativa em checkpoints específicos
      maybeTriggerMinigame(stage.at);
    }

    function showBattleFinalPopup() {
      const popup = document.createElement('div');
      popup.id = 'battleFinalPopup';
      popup.style.cssText = `
        position:fixed;inset:0;z-index:99999;
        background:rgba(0,0,0,0.88);
        display:flex;align-items:center;justify-content:center;
        animation:fadeIn 0.5s ease;
        padding:16px;
      `;
      popup.innerHTML = `
        <div style="
          max-width:560px;width:100%;
          background:linear-gradient(160deg,#0a0118 0%,#120230 60%,#0a0118 100%);
          border:2px solid rgba(168,85,247,0.7);
          border-radius:18px;
          padding:24px 20px 20px;
          text-align:center;
          box-shadow:0 0 60px rgba(168,85,247,0.4),0 0 120px rgba(88,28,135,0.2);
        ">
          <div style="font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:4px;color:rgba(192,132,252,0.7);text-transform:uppercase;margin-bottom:8px;">Questão Final</div>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(1rem,4vw,1.4rem);font-weight:900;letter-spacing:3px;color:#e9d5ff;text-shadow:0 0 20px rgba(216,180,254,0.9);margin:0 0 16px;">⚔ GOLPE FINAL ⚔</h2>
          <!-- Imagem battle_final cortada (esconde texto amarelo no fundo) -->
          <div style="border-radius:12px;overflow:hidden;border:2px solid rgba(168,85,247,0.5);box-shadow:0 0 30px rgba(168,85,247,0.4);height:340px;">
            <img src="assets/battle_final.png" alt="Batalha Final" style="width:100%;height:370px;object-fit:cover;object-position:center top;display:block;">
          </div>
          <p style="font-family:'Philosopher',serif;font-size:0.88rem;color:#c4b5fd;line-height:1.7;font-style:italic;margin:16px 0 20px;padding:0 4px;">
            Este é o momento decisivo. Uma única resposta separa a vitória da derrota eterna.<br>
            <strong style="color:#e9d5ff;">O destino dos rins do reino está em suas mãos.</strong>
          </p>
          <button data-remove-id="battleFinalPopup" style="
            background:linear-gradient(135deg,#4c1d95,#7c3aed);
            color:#e9d5ff;border:2px solid rgba(168,85,247,0.6);
            border-radius:10px;padding:12px 32px;
            font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;
            letter-spacing:2px;cursor:pointer;text-transform:uppercase;
            box-shadow:0 0 20px rgba(124,58,237,0.5);
          ">ENFRENTAR O DESTINO</button>
        </div>
      `;
      document.body.appendChild(popup);
    }

    function showBossIntroPopup() {
      playSound('boss');
      const popup = document.createElement('div');
      popup.id = 'bossIntroPopup';
      popup.style.cssText = `
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.92);
        display: flex; align-items: flex-start; justify-content: center;
        animation: fadeIn 0.6s ease;
        padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        overflow-y: auto;
        box-sizing: border-box;
      `;
      popup.innerHTML = `
        <div style="
          max-width: 540px; width: 100%;
          max-height: 88svh; max-height: 88dvh;
          overflow-y: auto;
          background: linear-gradient(160deg, #0a0118 0%, #120230 50%, #0a0118 100%);
          border: 2px solid rgba(168,85,247,0.7);
          border-radius: 18px;
          padding: 28px 24px 24px;
          text-align: center;
          box-shadow: 0 0 60px rgba(168,85,247,0.4), 0 0 120px rgba(88,28,135,0.2), inset 0 0 60px rgba(0,0,0,0.6);
          position: relative;
          margin: auto 0;
        ">
          <!-- Capítulo -->
          <div style="font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:4px;color:rgba(192,132,252,0.7);text-transform:uppercase;margin-bottom:6px;">Capítulo Final</div>
          <!-- Título -->
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(1.1rem,4vw,1.6rem);font-weight:900;letter-spacing:3px;color:#e9d5ff;text-shadow:0 0 20px rgba(216,180,254,0.9),0 0 40px rgba(168,85,247,0.6);margin:0 0 16px;">
            &#9760; O Confronto Final &#9760;
          </h2>
          <!-- Imagem do Nefromante -->
          <div style="margin:0 0 16px;border-radius:12px;overflow:hidden;border:2px solid rgba(168,85,247,0.6);box-shadow:0 0 30px rgba(168,85,247,0.5),0 0 60px rgba(88,28,135,0.3);">
            <img src="assets/nefromancer.png" alt="Arqui-Nefromante" style="width:100%;display:block;object-fit:cover;max-height:220px;object-position:center 20%;">
          </div>
          <!-- Nome do boss -->
          <div style="font-family:'Cinzel',serif;font-size:1.1rem;font-weight:900;letter-spacing:4px;color:#a855f7;text-shadow:0 0 20px rgba(168,85,247,0.9),0 0 40px rgba(168,85,247,0.5);margin-bottom:14px;">ARQUI-NEFROMANTE</div>
          <!-- Texto de lore -->
          <div style="font-family:'Philosopher',serif;font-size:0.88rem;color:#c4b5fd;line-height:1.75;font-style:italic;margin-bottom:20px;padding:0 4px;">
            Após noventa batalhas, você finalmente chega ao <strong style="color:#e9d5ff;">Trono da Uremia</strong> — o coração sombrio do reino corrompido. Diante de você ergue-se o <strong style="color:#e9d5ff;">Arqui-Nefromante</strong>, senhor da insuficiência renal eterna, cujos feitiços de azotemia e hiperfiltração maligna destruíram milhares de néfrons.
            <br><br>
            Ele sorri com desprezo: <em style="color:#f3e8ff;">"Você chegou longe demais para um simples médico. Mas o conhecimento que carrega não é suficiente para me derrotar."</em>
            <br><br>
            O Batalhão da Resistência une suas forças ao seu lado. <strong style="color:#fbbf24;">Dez questões</strong> separam a vitória da derrota eterna. Cada resposta correta é um golpe que enfraquece o Arqui-Nefromante. Cada erro, uma abertura para sua magia sombria.
            <br><br>
            <strong style="color:#ffd700;">O destino dos rins do reino está em suas mãos.</strong>
          </div>
          <!-- Estatísticas do jogador -->
          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;">
            <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:8px;padding:8px 14px;">
              <div style="font-size:1.2rem;font-weight:700;color:#e9d5ff;">${state.correctTotal}</div>
              <div style="font-size:0.6rem;color:rgba(192,132,252,0.7);text-transform:uppercase;letter-spacing:1px;">Acertos</div>
            </div>
            <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:8px;padding:8px 14px;">
              <div style="font-size:1.2rem;font-weight:700;color:#e9d5ff;">${state.level}</div>
              <div style="font-size:0.6rem;color:rgba(192,132,252,0.7);text-transform:uppercase;letter-spacing:1px;">Nível</div>
            </div>
            <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:8px;padding:8px 14px;">
              <div style="font-size:1.2rem;font-weight:700;color:#ffd700;">${state.score.toLocaleString('pt-BR')}</div>
              <div style="font-size:0.6rem;color:rgba(255,215,0,0.6);text-transform:uppercase;letter-spacing:1px;">Pontos</div>
            </div>
          </div>
          <!-- Botão -->
          <button data-remove-id="bossIntroPopup" style="
            font-family:'Cinzel',serif;
            background: linear-gradient(180deg, #7c3aed 0%, #5b21b6 50%, #3b0764 100%);
            border: 2px solid #a855f7;
            border-radius: 12px;
            color: #f3e8ff;
            font-size: 0.95rem;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
            padding: 14px 32px;
            cursor: pointer;
            box-shadow: 0 0 25px rgba(168,85,247,0.6), 0 4px 15px rgba(0,0,0,0.5);
            transition: all 0.2s;
            width: 100%;
            animation: arquiGolpeGlow 2s ease-in-out infinite alternate;
          ">&#9876; Iniciar Batalha Final</button>
        </div>
      `;
      document.body.appendChild(popup);
      // Fechar ao clicar fora
      popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });
      log('💀 O Arqui-Nefromante aguarda no Trono da Uremia. A batalha final começa!');
    }

    function showNarrativePopup(stage){
      const popup = document.createElement('div');
      popup.className='narrative-popup';
      const isFinale = stage.at >= 100;
      const isBoss = stage.boss === true;
      const bossImgHtml = isBoss ? `
        <div style="text-align:center;margin:15px 0;">
          <img src="assets/nefromancer.png" alt="Arqui-Nefromante" style="width:100%;max-width:500px;border-radius:12px;border:3px solid #a855f7;box-shadow:0 0 30px rgba(168,85,247,0.6),0 0 60px rgba(168,85,247,0.3);">
        </div>
        <div style="text-align:center;margin-bottom:10px;">
          <span style="font-size:1.5rem;color:#a855f7;font-weight:900;text-shadow:0 0 20px rgba(168,85,247,0.8);letter-spacing:2px;">ARQUI-NEFROMANTE</span>
        </div>` : '';
      popup.innerHTML=`
        <div class='narrative-card' ${isBoss ? 'style="border-color:#a855f7;box-shadow:0 0 40px rgba(168,85,247,0.4);"' : ''}>
          <div class='narr-chapter' ${isBoss ? 'style="color:#a855f7;"' : ''}>${stage.ch}</div>
          <h3>${isFinale ? '🏆 ' : isBoss ? '💀 ' : '📖 '}${stage.title}</h3>
          ${bossImgHtml}
          <div class='narr-text' ${isBoss ? 'style="color:#e9d5ff;font-style:italic;"' : ''}>${stage.text}</div>
          <div class='narr-progress'>
            <strong>${state.correctTotal}</strong> acertos · Nível <strong>${state.level}</strong> · ${state.queue.length - state.idx} cartas restantes
          </div>
          <button class='btn ${isBoss ? 'sec' : 'gold'}' data-close-closest=".narrative-popup" ${isBoss ? 'style="background:linear-gradient(180deg,#a855f7,#7c3aed);border-color:#6d28d9;color:#fff;text-shadow:0 0 10px rgba(168,85,247,0.5);"' : ''}>${isFinale ? '🏆 Glória Eterna!' : isBoss ? '⚔️ Enfrentar o Arqui-Nefromante!' : 'Continuar a Jornada'}</button>
        </div>
      `;
      document.body.appendChild(popup);
      popup.addEventListener('click',(e)=>{if(e.target===popup) popup.remove();});
      if(isFinale){
        log('🏆 VITÓRIA! Você derrotou o Arqui-Nefromante e salvou os rins do reino!');
      } else if(isBoss){
        playSound('boss');
        log(`💀 ${stage.ch}: ${stage.title}`);
      } else {
        log(`📖 ${stage.ch}: ${stage.title}`);
      }
    }


    function resetGame(){
      Object.assign(state,{level:1,xp:0,xpToNext:200,score:0,lives:3,maxLives:3,streak:0,gold:0,difficulty:"normal",legendaryAbilityUsed:{},current:null,answered:false,bonusUses:0,correctTotal:0,narrativeShown:0,gameOver:false,gameStarted:false,extraLifeGiven:false,gameCompleted:false,completedGame:false,chestsOpened:0});
      state.character=null;
      state.equipment={
        weapon:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        armor:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        relic:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0}
      };
      ui.journal.innerHTML='';
      log('📖 Clique em NOVO JOGO para iniciar sua jornada!');
      shuffleQueue();
      renderHUD();
      updateBadges();
      // Não renderizar questão quando jogo não foi iniciado
      if(state.gameStarted) renderQuestion();
      else { ui.question.textContent=''; ui.options.innerHTML=''; ui.feedback.textContent=''; ui.feedback.className='feedback'; ui.refs.innerHTML=''; ui.nextBtn.classList.add('hidden'); }
    }

    ui.nextBtn.addEventListener('click',() => renderQuestion());
    // Event delegation para opções — 1 listener reutilizado em vez de 4 por pergunta
    ui.options.addEventListener('click', (e) => {
      const btn = e.target.closest('button.option');
      if (!btn || btn.dataset.idx === undefined) return;
      answer(parseInt(btn.dataset.idx), btn);
    });
    ui.newBtn.addEventListener('click',()=>{
      showNewGameConfirm();
    });

    function showNewGameConfirm(fromWelcome) {
      document.getElementById('diffSelectorOverlay')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'diffSelectorOverlay';
      overlay.className = 'diff-selector-overlay';
      let selectedDiff = state.difficulty || 'normal';

      function renderDiff() {
        const defs = {
          easy:     { icon:'🌊', name:'Fácil',    lives:5, label:'❤❤❤❤❤', desc:'5 vidas · Questões equilibradas · Ideal para começar', hc: false },
          normal:   { icon:'⚕️', name:'Médio',    lives:4, label:'❤❤❤❤',  desc:'4 vidas · Distribuição mista · Residência médica', hc: false },
          hard:     { icon:'⚔️', name:'Difícil',  lives:3, label:'❤❤❤',   desc:'3 vidas · Questões difíceis priorizadas · Prova de título', hc: false },
          hardcore: { icon:'💀', name:'Hardcore', lives:1, label:'❤',      desc:'1 vida · Somente questões difíceis · Badge exclusivo', hc: true }
        };
        overlay.innerHTML = `
          <div class="diff-selector-card">
            <div class="diff-selector-title">⚔️ Escolha a Dificuldade</div>
            <div class="diff-warning" style="text-align:center;color:#ef4444;font-size:0.72rem;margin-bottom:12px">
              ⚠️ Todo o progresso atual será perdido.
            </div>
            <div class="diff-grid">
              ${Object.entries(defs).map(([k,d]) => `
                <div class="diff-card${d.hc?' hardcore':''}${selectedDiff===k?' selected':''}" data-action="_selectDiffCard" data-pass-this="1" data-diff-key="${k}">
                  <div class="diff-icon">${d.icon}</div>
                  <div class="diff-name">${d.name}</div>
                  <div class="diff-lives">${d.label}</div>
                  <div class="diff-desc">${d.desc}</div>
                  ${d.hc ? '<div class="diff-hardcore-badge">🏆 BADGE EXCLUSIVO</div>' : ''}
                </div>`).join('')}
            </div>
            <button class="diff-confirm-btn" id="diffConfirmBtn" data-action="_confirmDiff" data-arg="${fromWelcome ? 'true' : 'false'}" data-arg-type="boolean">CONFIRMAR DIFICULDADE</button>
            <button class="diff-cancel-btn" data-remove-id="diffSelectorOverlay">CANCELAR</button>
          </div>`;
        window._pendingDiff = selectedDiff;
      }

      overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
      document.body.appendChild(overlay);
      renderDiff();
    }
    // forgeBtn agora usa data-action="showMobileActionConfirm" data-arg="forge" no HTML
    ui.bonusBtn.addEventListener('click',buyBonusQuestion);
    ui.boardBtn.addEventListener('click',()=>{ renderBoard().catch(() => {}); ui.boardModal.classList.remove('hidden'); });
    ui.closeBoard.addEventListener('click',()=>ui.boardModal.classList.add('hidden'));
    const boardRefreshBtn = document.getElementById('boardRefresh');
    if (boardRefreshBtn) boardRefreshBtn.addEventListener('click', () => { renderBoard(true); });

    // Sistema de Registro de Nome
    function saveScore() {
      const playerName = document.getElementById('playerName').value.trim() || 'Anônimo';
      state.lastSubmittedName = playerName;
      
      if (pendingScore) {
        boardPush(pendingScore.score, pendingScore.level, playerName);
        pendingScore = null;
      }
      
      document.getElementById('nameModal').classList.remove('show');
      finishGameUI();
    }
    
    function skipSaveScore() {
      if (pendingScore) {
        boardPush(pendingScore.score, pendingScore.level, 'Anônimo');
        pendingScore = null;
      }
      
      document.getElementById('nameModal').classList.remove('show');
      finishGameUI();
    }
    
    function showSessionWrongAnswers() {
      document.querySelectorAll('.session-review-popup').forEach(el => el.remove());
      const wrongs = _sessionWrongAnswers;
      if (!wrongs.length) return;
      const optLetters = ['A','B','C','D'];
      const modal = document.createElement('div');
      modal.className = 'modal show session-review-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.88);display:flex;align-items:flex-start;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:12px 16px calc(env(safe-area-inset-bottom,0px)+80px);box-sizing:border-box;';
      modal.innerHTML = `
        <div style="max-width:560px;width:100%;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(251,113,133,0.3);margin:auto 0;">
          <h2 style="color:#fb7185;font-family:'Cinzel',serif;text-align:center;margin-bottom:6px;">📋 ERROS DA JORNADA</h2>
          <p style="color:var(--txt-dim);text-align:center;font-size:0.8rem;margin-bottom:20px;">${wrongs.length} questão${wrongs.length>1?'es':''} errada${wrongs.length>1?'s':''} nesta sessão</p>
          <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
            ${wrongs.map((q, qi) => {
              const opts = q.o || [];
              return `<div style="background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.25);border-radius:10px;padding:14px;">
                <div style="color:var(--txt-dim);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${qi+1}/${wrongs.length}</div>
                <p style="color:var(--txt);font-size:0.87rem;line-height:1.6;margin-bottom:10px;">${escapeHtml(q.q)}</p>
                <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
                  ${opts.map((o, i) => {
                    const isCorrect = i === q.a;
                    const bg     = isCorrect ? 'rgba(52,211,153,0.15)' : 'transparent';
                    const border  = isCorrect ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)';
                    const color   = isCorrect ? '#34d399' : 'var(--txt-dim)';
                    return `<div style="background:${bg};border:${border};border-radius:6px;padding:6px 10px;font-size:0.8rem;color:${color};">${optLetters[i]}. ${escapeHtml(o)}${isCorrect?' ✓':''}</div>`;
                  }).join('')}
                </div>
                ${q.e ? `<div style="font-size:0.78rem;color:#94a3b8;line-height:1.6;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">${escapeHtml(q.e)}</div>` : ''}
              </div>`;
            }).join('')}
          </div>
          <button class="btn gold" data-close-closest=".modal" style="width:100%;">Fechar</button>
        </div>`;
      document.body.appendChild(modal);
    }

    function finishGameUI() {
      ui.question.textContent=`Fim da jornada! Pontos: ${state.score} • Nível: ${state.level}.`;
      ui.options.innerHTML='';
      const cost=bonusCost();
      if(state.gold>=cost && state.bonusUses < 1){
        ui.feedback.className='feedback';
        ui.feedback.textContent=`Você pode gastar ${cost} ouro para comprar 1 Pergunta Bônus e continuar a jornada com 1 vida.`;
        ui.bonusBtn.textContent=`Pergunta bônus (${cost} ouro)`;
        ui.bonusBtn.classList.remove('hidden');
      } else {
        ui.feedback.className='feedback';
        ui.feedback.textContent=`As ${state.maxLives||3} vidas acabaram. Junte mais ouro em outra corrida para comprar Perguntas Bônus.`;
        ui.bonusBtn.classList.add('hidden');
      }
      // Botão de revisão de erros da sessão
      if (_sessionWrongAnswers.length > 0) {
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'btn sec';
        reviewBtn.style.cssText = 'margin-top:10px;width:100%;background:rgba(251,113,133,0.12);border-color:rgba(251,113,133,0.35);color:#fb7185;';
        reviewBtn.textContent = `📋 Revisar ${_sessionWrongAnswers.length} erro${_sessionWrongAnswers.length>1?'s':''} da jornada`;
        reviewBtn.onclick = showSessionWrongAnswers;
        ui.options.appendChild(reviewBtn);
      }
      // Botão compartilhar resultado
      const _shareBtn = document.createElement('button');
      _shareBtn.className = 'btn sec';
      _shareBtn.style.cssText = 'margin-top:8px;width:100%;';
      _shareBtn.textContent = '📤 Compartilhar Resultado';
      _shareBtn.onclick = () => _shareResult('campanha', { score: state.score, level: state.level, correct: state.correctTotal, total: state.correctTotal + _sessionWrongAnswers.length, pct: state.correctTotal > 0 ? Math.round((state.correctTotal/(state.correctTotal+_sessionWrongAnswers.length))*100) : 0 });
      ui.options.appendChild(_shareBtn);
      // Botões permanecem ativos após fim de jornada — popup informa o estado
      state.gameOver=true;
      // Esconder barra de status mobile quando jogo termina
      const _msbGO = document.getElementById('mobileStatusBar');
      if(_msbGO) _msbGO.classList.remove('active');
      renderRefs(["kdigo_ckd","kdigo_aki","kdigo_gn","kdigo_tx","dapa","empa"]);
      renderHUD();
      updateBadges(); renderBoard().catch(() => {});
    }
