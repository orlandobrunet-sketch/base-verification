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
      document.getElementById('minigameIntroPopup')?.remove();
      const intro = _minigameIntros[triggerIdx] || _minigameIntros[0];
      const symbols = [
  "<path class=\"nqinvite-rune\" pathLength=\"200\" d=\"m43 10-23 31h16l-7 21 23-32H36Z\"/>",
  "<path class=\"nqinvite-rune\" pathLength=\"200\" d=\"M36 11v44m-17 0h34M16 23h40M23 23l-9 17h18Zm26 0-9 17h18Z\"/>",
  "<circle class=\"nqinvite-rune\" pathLength=\"200\" cx=\"36\" cy=\"29\" r=\"20\"/><path class=\"nqinvite-rune\" pathLength=\"200\" d=\"M24 52h24l5 9H19Zm5-21 5-5 5 5-5 5Zm14-16v9m-5-4h10\"/>"
];
      const popup = document.createElement('div');
      popup.className = 'nq-overlay';
      popup.id = 'minigameIntroPopup';
      popup.innerHTML = `<section class="nqinvite-card" role="dialog" aria-modal="true" aria-labelledby="minigameInviteTitle" aria-describedby="minigameInviteStory">
          <div class="nqinvite-reading" role="region" aria-label="Convite e recompensa" tabindex="0">
          <div class="nqinvite-heading">
          <svg class="nqinvite-seal" viewBox="0 0 72 80" aria-hidden="true">
          <path class="nqinvite-border" d="M15 2h42l13 13v50L57 78H15L2 65V15Z"/>
          <g transform="translate(0 4)">${symbols[triggerIdx] || symbols[0]}</g>
          </svg>
          <div>
          <p class="nqinvite-chapter" >${intro.chapter}</p>
          <h2 id="minigameInviteTitle">${intro.title}</h2>
          </div>
          </div>
          <p class="nqinvite-story" id="minigameInviteStory">${intro.text}</p>
          <div class="nqinvite-reward">
          <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10h16v10H4Zm-1-4h18v4H3Zm9 0v14M12 6C2 6 5-2 12 6Zm0 0c10 0 7-8 0 0Z"/>
          </svg>
          <div>
          <h3>Prêmio disponível</h3>
          <p >${intro.reward}</p>
          </div>
          </div>
          <p class="nqinvite-progress">
          <span>
          <strong >${state.correctTotal}</strong> acertos</span>
          <span>Nível <strong >${state.level}</strong>
          </span>
          </p>
          </div>
          <footer class="nqinvite-footer">
          <button type="button" class="nqinvite-primary" id="acceptMinigameBtn">Aceitar o desafio!</button>
          <button type="button" class="nqinvite-secondary" data-remove-id="minigameIntroPopup">Continuar jornada</button>
          </footer>
          </section>`;
      document.body.appendChild(popup);
      nqDialogo(popup, { painel: popup.querySelector('.nqinvite-card') });
      popup.querySelector('#acceptMinigameBtn').addEventListener('click', () => {
        popup.remove();
        showRapidQuizMinigame();
      });
    }

    // Julgamento Rápido: página própria.
    //
    // Era uma camada fixa sobre o jogo, com defeitos medidos:
    // - o item conquistado (8+ acertos) só era entregue pelo botão "Continuar";
    //   fechar o resultado pelo ✕ ou pelo Escape perdia o item — nem equipado,
    //   nem vendido — e deixava o HUD com o ouro antigo;
    // - a explicação de cada afirmação sumia em 1 segundo, sem tempo de leitura;
    // - a resposta certa, ao errar, era indicada só por um brilho verde.
    // Agora é página (nqPaginaPropria); o cronômetro corre só enquanto a
    // afirmação está sem resposta, a explicação fica até o jogador avançar, a
    // correção diz em texto e concluir — por qualquer caminho — entrega tudo.
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
      let concluir = null; // definido no resultado: entrega o prêmio e fecha
      const TIME_PER_Q = 12;

      const { pagina, fechar } = nqPaginaPropria('rapidQuizPage', 'Julgamento Rápido', {
        classe: 'nq-exam nq-julgamento',
        aoTeclar: e => {
          if (e.key === 'Escape') { e.preventDefault(); return concluir ? concluir() : sair(); }
          if (_answered || concluir || e.ctrlKey || e.metaKey || e.altKey) return;
          const key = (e.key || '').toUpperCase();
          if (['V', '1', 'T', 'C'].includes(key)) { e.preventDefault(); responder(true); }
          else if (['F', '2', 'E'].includes(key)) { e.preventDefault(); responder(false); }
        },
      });
      const sair = () => { if (timerInterval) clearInterval(timerInterval); fechar(); };
      const desenhar = (html, foco) => {
        pagina.innerHTML = `<div class="nq-study-content nq-exam-intro">${html}</div>`;
        pagina.querySelector(foco)?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      };

      function _renderMinigameQuestion() {
        if (currentIdx >= pool.length) { showResults(); return; }
        const q = pool[currentIdx];
        let timeLeft = TIME_PER_Q;
        _answered = false;
        if (timerInterval) clearInterval(timerInterval);

        desenhar(`
          <div class="nq-exam-cabecalho">
            <p class="nq-exam-titulo">Julgamento Rápido · Verdadeiro ou falso? ${TIME_PER_Q} s por afirmação</p>
            <p class="nq-exam-relogio" id="mgRelogio" aria-hidden="true">${TIME_PER_Q} s</p>
            <div class="nq-exam-progresso" aria-hidden="true"><div id="mgTimerFill" style="width:100%"></div></div>
          </div>
          <article class="nq-exam-questao">
            <h1 id="mgQuestao" tabindex="-1">Afirmação ${currentIdx + 1} de ${pool.length}</h1>
            <p class="nq-exam-enunciado" id="mgStmt">${escapeHtml(q.q)}</p>
            <div class="nq-exam-opcoes">
              <button type="button" class="nq-exam-opcao" id="mgTrue"><span class="nq-exam-letra" aria-hidden="true">V</span><span>Verdadeiro</span></button>
              <button type="button" class="nq-exam-opcao" id="mgFalse"><span class="nq-exam-letra" aria-hidden="true">F</span><span>Falso</span></button>
            </div>
            <div id="mgFeedback" class="nq-exam-correcao" role="status" aria-live="polite" hidden></div>
            <div class="nq-exam-acoes">
              <button type="button" class="btn sec" id="mgSair">${standalone ? 'Sair' : 'Sair do desafio (sem recompensa)'}</button>
            </div>
          </article>`, '#mgQuestao');
        pagina.querySelector('#mgTrue').addEventListener('click', () => responder(true));
        pagina.querySelector('#mgFalse').addEventListener('click', () => responder(false));
        pagina.querySelector('#mgSair').addEventListener('click', sair);

        timerInterval = setInterval(() => {
          timeLeft -= 0.1;
          const fill = document.getElementById('mgTimerFill');
          if (fill) fill.style.width = Math.max(0, (timeLeft / TIME_PER_Q * 100)) + '%';
          const relogio = document.getElementById('mgRelogio');
          if (relogio) {
            relogio.textContent = Math.max(0, Math.ceil(timeLeft)) + ' s';
            relogio.classList.toggle('nq-exam-urgente', timeLeft <= 3);
          }
          if (timeLeft <= 0) {
            clearInterval(timerInterval);
            responder(null);
          }
        }, 100);
      }

      function responder(userAns) {
        if (_answered || !pagina.isConnected) return; // previne double-click / double-fire por timer
        _answered = true;
        if (timerInterval) clearInterval(timerInterval);
        const q = pool[currentIdx];
        const isCorrect = userAns === q.ans;

        const trueBtn = document.getElementById('mgTrue');
        const falseBtn = document.getElementById('mgFalse');
        [trueBtn, falseBtn].forEach(b => { if (b) b.disabled = true; });
        const correctBtn = q.ans ? trueBtn : falseBtn;
        const clickedBtn = userAns === null ? null : (userAns ? trueBtn : falseBtn);
        const marcar = (b, classe, texto) => {
          if (!b) return;
          b.classList.add('nq-exam-opcao-' + classe);
          b.lastElementChild.insertAdjacentHTML('beforeend', `<strong class="nq-exam-marca">${texto}</strong>`);
        };
        marcar(correctBtn, 'certa', isCorrect ? 'Sua escolha — correta' : 'Resposta correta');
        if (clickedBtn && !isCorrect) marcar(clickedBtn, 'errada', 'Sua escolha');

        let x, y;
        if (clickedBtn) {
          const rect = clickedBtn.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
        if (typeof nqRecordAnswer === 'function') nqRecordAnswer(q.qid, isCorrect, q.cat, q.q);
        if (isCorrect) correctCount++;
        if (typeof window.showFloatingFeedback === 'function') {
          window.showFloatingFeedback(isCorrect ? '✓ Correto!' : userAns === null ? '⏱️ Esgotado' : '✗ Incorreto', isCorrect, x, y);
        }
        if (typeof window.triggerHapticFeedback === 'function') {
          window.triggerHapticFeedback(isCorrect ? 'correct' : 'wrong');
        }

        const verdade = `A afirmação é ${q.ans ? 'verdadeira' : 'falsa'}.`;
        const veredito = userAns === null ? `Tempo esgotado. ${verdade}` : isCorrect ? `Correto. ${verdade}` : `Incorreto. ${verdade}`;
        const fb = document.getElementById('mgFeedback');
        if (fb) {
          fb.hidden = false;
          fb.classList.add(isCorrect ? 'nq-exam-acertou' : 'nq-exam-errou');
          fb.innerHTML = `<p class="nq-exam-veredito">${veredito}</p><p>${escapeHtml(q.exp || '')}</p>`;
        }
        currentIdx++;
        const ultimo = currentIdx >= pool.length;
        pagina.querySelector('#mgSair')?.insertAdjacentHTML('beforebegin',
          `<button type="button" class="btn gold" id="mgProxima">${ultimo ? 'Ver resultado' : 'Próxima afirmação'}</button>`);
        const proxima = pagina.querySelector('#mgProxima');
        proxima.addEventListener('click', _renderMinigameQuestion, { once: true });
        proxima.focus({ preventScroll: true });
      }

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
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
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

        const msg = correctCount >= 9 ? 'Maestria absoluta! Você domina a nefrologia!' :
                    correctCount >= 7 ? 'Excelente! Conhecimento de mestre!' :
                    correctCount >= 5 ? 'Bom! Continue aprimorando.' :
                    correctCount >= 3 ? 'Pratique mais esses tópicos.' :
                    'Revise os conceitos. Você chega lá!';

        let recorde = '';
        if (standalone) {
          const bestKey = 'nefroquest-minigame-best';
          let prev = 0;
          try { prev = parseInt(localStorage.getItem(bestKey) || '0', 10); } catch (e) {}
          if (correctCount > prev) {
            try { localStorage.setItem(bestKey, String(correctCount)); } catch (e) {}
            recorde = '<p class="nq-julgamento-destaque">Novo recorde pessoal!</p>';
          } else if (prev > 0) {
            recorde = `<p>Recorde pessoal: ${prev} de 10.</p>`;
          }
        }

        const premio = standalone
          ? '<p>Modo livre: sem recompensas de jogo.</p>'
          : `<p class="nq-julgamento-destaque">+${goldReward} de ouro · +${xpReward} XP</p>` +
            (itemReward ? `<div class="nq-exam-correcao nq-exam-acertou">
              <p class="nq-julgamento-destaque">Item conquistado: ${escapeHtml(itemReward.item.n)}</p>
              <p>${escapeHtml(itemReward.item.rar)} · ATK ${itemReward.item.atk} · DEF ${itemReward.item.def} · KNO ${itemReward.item.kno}</p>
              <p>Ele é equipado ou vendido quando você continua a jornada.</p></div>` : '');

        let concluido = false;
        concluir = () => {
          if (concluido) return;
          concluido = true;
          fechar();
          if (standalone) return;
          ['renderHUD', 'updateBadges', 'saveGame'].forEach(fn => { try { window[fn]?.(); } catch (e) {} });
          if (itemReward) {
            setTimeout(() => {
              try { equipOrSell(itemReward.slot, itemReward.item, m => log(m)); } catch(e) { _track('error_equip_item_reward', { msg: String(e) }); }
            }, 400);
          }
        };

        desenhar(`
          <h1 id="mgResultado" tabindex="-1">Resultado do Julgamento Rápido</h1>
          <p>Você acertou <strong>${correctCount} de ${total}</strong>. ${msg}</p>
          ${premio}
          ${recorde}
          <div class="nq-exam-acoes">
            <button type="button" class="btn gold" id="mgContinueBtn">${standalone ? 'Fechar' : 'Continuar a jornada'}</button>
          </div>`, '#mgResultado');
        pagina.querySelector('#mgContinueBtn').addEventListener('click', concluir);

        if (!standalone) {
          log('⚡ Julgamento Rápido: ' + correctCount + '/' + total + ' corretas → +' + goldReward + ' ouro +' + xpReward + ' XP' + (itemReward ? ' + ' + itemReward.item.n : ''));
        }
      }

      _renderMinigameQuestion();
    }
    window.showRapidQuizMinigame = showRapidQuizMinigame;
    window.showStandaloneMinigame = function() { showRapidQuizMinigame(true); };

    /* As etapas do Confronto Final só existem se o Confronto Final existir.
     *
     * Elas eram escolhidas apenas pelo contador de acertos, e o contador pode
     * estar alto sem a batalha estar acontecendo: o atalho de administrador
     * "pular para o chefe" grava correctTotal = 90 no save e reembaralha o
     * baralho, sem tocar em nível nem pontos. A partir daí, três acertos em
     * QUALQUER sessão futura levavam o contador a 93 e o feitiço da Azotemia
     * caía sobre alguém no começo da jornada — com o layout normal na tela,
     * porque isBossBattle() já respondia "não".
     *
     * isBossBattle() sempre soube a resposta certa (jogo começado, contador em
     * 90 ou mais, jornada não concluída). Faltava consultá-la. */
    function _ehEtapaDoConfrontoFinal(stage) {
      return stage.stun === true || stage.stunRecovery === true || stage.boss === true;
    }

    function checkNarrative(){
      const _noConfronto = typeof isBossBattle === 'function' ? isBossBattle() : true;

      // Popup especial de intro do boss ao atingir 90 acertos
      if (state.correctTotal === BOSS_START_CORRECT && !state.bossIntroShown && _noConfronto) {
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
      // Não marca como vista: se o Confronto Final começar de verdade mais
      // tarde, a etapa ainda tem de poder acontecer.
      if (_ehEtapaDoConfrontoFinal(stage) && !_noConfronto) return;
      state.narrativeShown = stage.at;
      showNarrativePopup(stage);
      // Chance de minigame após narrativa em checkpoints específicos
      maybeTriggerMinigame(stage.at);
    }

    function showBattleFinalPopup() {
      document.getElementById('battleFinalPopup')?.remove();
      const popup = document.createElement('div');
      popup.id = 'battleFinalPopup';
      popup.className = 'nq-overlay';
      popup.innerHTML = `
        <section class="nqfinal-card" role="dialog" aria-modal="true" aria-labelledby="battleFinalTitle" aria-describedby="battleFinalMessage">
          <div class="nqfinal-reading" role="region" aria-label="O momento decisivo" tabindex="0">
            <div class="nqfinal-art">
              <img src="assets/golpe-final-cinematico.webp" alt="Os três guardiões enfrentam o Arqui-Nefromante">
            </div>
            <div class="nqfinal-copy">
              <p class="nqfinal-chapter">Questão final</p>
              <h2 id="battleFinalTitle">Golpe final</h2>
              <p class="nqfinal-message" id="battleFinalMessage">Este é o momento decisivo. Uma única resposta separa a vitória da derrota eterna.</p>
              <p class="nqfinal-destiny">O destino dos rins do reino está em suas mãos.</p>
            </div>
          </div>
          <footer class="nqfinal-footer">
            <button type="button" class="nqfinal-primary" data-remove-id="battleFinalPopup">Enfrentar o destino</button>
          </footer>
        </section>`;
      document.body.appendChild(popup);
      nqDialogo(popup, { painel: popup.querySelector('.nqfinal-card') });
    }

    function showBossIntroPopup() {
      playSound('boss');
      document.getElementById('bossIntroPopup')?.remove();
      const popup = document.createElement('div');
      popup.id = 'bossIntroPopup';
      popup.className = 'nq-overlay';
      popup.innerHTML = `<section class="nqboss-card" role="dialog" aria-modal="true" aria-labelledby="bossIntroTitle" >
          <div class="nqboss-reading" role="region" aria-label="O momento decisivo" tabindex="0">
          <div class="nqboss-art">
          <img src="assets/arqui-nefromante-chegada.webp" alt="O Arqui-Nefromante diante do Trono da Uremia">
          </div>
          <div class="nqboss-copy">
          <p class="nqboss-chapter">Capítulo final</p>
          <h2 id="bossIntroTitle">O Confronto Derradeiro</h2>
          <div id="bossIntroArrival">
          <p class="nqboss-boss-name">Arqui-Nefromante</p>
          <p class="nqboss-story">Após noventa batalhas, você finalmente chega ao <strong>Trono da Uremia</strong> — o coração sombrio do reino corrompido. Diante de você ergue-se o <strong>Arqui-Nefromante</strong>, senhor da insuficiência renal eterna, cujos feitiços de azotemia e hiperfiltração maligna destruíram milhares de néfrons.</p>
          <blockquote>
          <p>Ele sorri com desprezo:</p>
          <p class="nqboss-quote">“Você chegou longe demais para um simples médico. Mas o conhecimento que carrega não é suficiente para me derrotar.”</p>
          </blockquote>
          </div>
          <div id="bossIntroChallenge" hidden>
          <p class="nqboss-story">
          <strong class="nqboss-gold">Dez questões</strong> separam a vitória da derrota eterna. Cada resposta correta é um golpe que enfraquece o Arqui-Nefromante. Cada erro, uma abertura para sua magia sombria.</p>
          <p class="nqboss-destiny">O destino dos rins do reino está em suas mãos.</p>
          <dl class="nqboss-stats">
          <div>
          <dt>Acertos</dt>
          <dd>${state.correctTotal}</dd>
          </div>
          <div>
          <dt>Nível</dt>
          <dd>${state.level}</dd>
          </div>
          <div>
          <dt>Pontos</dt>
          <dd>${state.score.toLocaleString('pt-BR')}</dd>
          </div>
          </dl>
          </div>
          </div>
          </div>
          <footer class="nqboss-footer">
          <span class="nqboss-step-indicator" id="bossIntroStep">1 de 2</span>
          <button type="button" class="nqboss-primary" id="bossIntroNext">Avançar</button>
          </footer>
          <button type="button" class="nqboss-close" data-remove-id="bossIntroPopup" aria-label="Fechar apresentação">
          <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18"/>
          </svg>
          </button>
          </section>`;
      document.body.appendChild(popup);
      nqDialogo(popup, { painel: popup.querySelector('.nqboss-card') });
      const next = popup.querySelector('#bossIntroNext');
      next.addEventListener('click', () => {
        if (popup.querySelector('#bossIntroArrival').hidden) { popup.remove(); return; }
        popup.querySelector('#bossIntroArrival').hidden = true;
        popup.querySelector('#bossIntroChallenge').hidden = false;
        popup.querySelector('#bossIntroStep').textContent = '2 de 2';
        next.textContent = 'Iniciar batalha final';
        popup.querySelector('.nqboss-reading').scrollTop = 0;
        next.focus({ preventScroll: true });
        if (typeof playSound === 'function') playSound('click');
      });
      log('💀 O Arqui-Nefromante aguarda no Trono da Uremia. A batalha final começa!');
    }

    function showNarrativePopup(stage){
      const popup = document.createElement('div');
      popup.className='narrative-popup';
      const isFinale = stage.at >= 100;
      const isBoss = stage.boss === true;
      const isStun = stage.stun === true;
      const isStunRecovery = stage.stunRecovery === true;

      const bossImgHtml = isBoss ? `
        <div style="text-align:center;margin:15px 0;">
          <img src="assets/nefromancer.png" alt="Arqui-Nefromante" style="width:100%;max-width:500px;border-radius:12px;border:3px solid #a855f7;box-shadow:0 0 30px rgba(168,85,247,0.6),0 0 60px rgba(168,85,247,0.3);">
        </div>
        <div style="text-align:center;margin-bottom:10px;">
          <span style="font-size:1.5rem;color:#a855f7;font-weight:900;text-shadow:0 0 20px rgba(168,85,247,0.8);letter-spacing:2px;">ARQUI-NEFROMANTE</span>
        </div>` : '';

      // Estilo e emoji por tipo
      const cardStyle = isStun
        ? 'border-color:#ef4444;box-shadow:0 0 40px rgba(239,68,68,0.5);'
        : isStunRecovery
          ? 'border-color:#22c55e;box-shadow:0 0 40px rgba(34,197,94,0.4);'
          : isBoss ? 'border-color:#a855f7;box-shadow:0 0 40px rgba(168,85,247,0.4);' : '';
      const chStyle = isStun ? 'color:#f87171;' : isStunRecovery ? 'color:#4ade80;' : isBoss ? 'color:#a855f7;' : '';
      const textStyle = isStun
        ? 'color:#fecaca;font-style:italic;'
        : isStunRecovery
          ? 'color:#bbf7d0;font-style:italic;'
          : isBoss ? 'style="color:#e9d5ff;font-style:italic;"' : '';
      const headEmoji = isFinale ? '🏆 ' : isStun ? '⚡ ' : isStunRecovery ? '💚 ' : isBoss ? '💀 ' : '📖 ';
      const btnLabel = isFinale ? '🏆 Glória Eterna!'
        : isStun ? '⚡ Suportar o impacto…'
        : isStunRecovery ? '💪 Retomar o combate!'
        : isBoss ? '⚔️ Enfrentar o Arqui-Nefromante!'
        : 'Continuar a Jornada';
      const btnStyle = isStun
        ? 'background:linear-gradient(180deg,#ef4444,#b91c1c);border-color:#991b1b;color:#fff;'
        : isStunRecovery
          ? 'background:linear-gradient(180deg,#22c55e,#15803d);border-color:#166534;color:#fff;'
          : isBoss ? 'background:linear-gradient(180deg,#a855f7,#7c3aed);border-color:#6d28d9;color:#fff;text-shadow:0 0 10px rgba(168,85,247,0.5);' : '';

      // Capítulos e feitiço: recortes visuais aprovados; regras do combate preservadas.
      if (!isFinale && !isBoss && !isStun && !isStunRecovery) {
        popup.classList.add('nqnarr-overlay');
        popup.innerHTML=`
          <section class="nqnarr-card" aria-describedby="nqNarrativeStory">
            <div class="nqnarr-reading" role="region" tabindex="0" aria-label="Narrativa e progresso">
              <p class="nqnarr-chapter">${stage.ch}</p>
              <div class="nqnarr-heading"><svg class="nqnarr-book" viewBox="0 0 80 88" aria-hidden="true"><path class="pages" d="M40 17C29 10 14 13 8 17v51c10-5 22-4 32 2 10-6 22-7 32-2V17c-6-4-21-7-32 0Z"/><path d="M5 22H3v52c13-5 24-4 37 2 13-6 24-7 37-2V22h-2"/><path class="spine" d="M40 19v48"/><path class="water" d="M14 29c7-4 14-3 19 0m-19 9c7-4 14-3 19 0m-19 9c7-4 14-3 19 0m14-18c5-3 12-4 19 0m-19 9c5-3 12-4 19 0m-19 9c5-3 12-4 19 0"/><path d="M30 81h20" opacity=".5"/></svg><h2>${stage.title}</h2></div>
              <div class="nqnarr-story" id="nqNarrativeStory">${stage.text}</div>
              <div class="nqnarr-progress">
                <div class="nqnarr-metric"><strong>${state.correctTotal}</strong><span>Acertos</span></div>
                <div class="nqnarr-metric"><strong>${state.level}</strong><span>Nível</span></div>
                <div class="nqnarr-metric"><strong>${state.queue.length - state.idx}</strong><span>Cartas restantes</span></div>
              </div>
            </div>
            <footer class="nqnarr-footer"><button class="nqnarr-primary" data-close-closest=".narrative-popup">Continuar a Jornada</button></footer>
            <button class="nqnarr-close" data-close-closest=".narrative-popup" aria-label="Fechar capítulo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </section>
        `;
      } else if (isStun) {
        popup.classList.add('nqnarr-overlay');
        popup.innerHTML=`
          <section class="nqnarr-card nqstun-card" aria-describedby="nqStunStory">
            <div class="nqnarr-reading" role="region" tabindex="0" aria-label="Narrativa e efeito do feitiço">
              <p class="nqnarr-chapter">${stage.ch.replace(/^⚡\s*/, '')}</p>
              <div class="nqnarr-heading"><svg class="nqstun-spell" viewBox="0 0 80 88" aria-hidden="true"><path class="staff" d="m35 36 11 43M34 39l8-2M37 50l7-2M40 61l7-2"/><path class="kidney" d="M34 10c-14-1-21 9-17 21 3 9 12 14 17 9 5-5 3-11-2-13-5-2-2-5 2-7 5-3 5-9 0-10Z"/><path class="mist" d="M7 46c12-7 25 6 36 2s17-9 29-2M11 58c12-7 25 6 36 2s12-7 24-2"/></svg><h2>${stage.title}</h2></div>
              <div class="nqnarr-story" id="nqStunStory">${stage.text}</div>
              <div class="nqstun-effect"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></svg><div><strong>Equipamentos bloqueados</strong><p>Durante as questões 93 a 97.</p></div></div>
            </div>
            <footer class="nqnarr-footer"><button class="nqnarr-primary" data-close-closest=".narrative-popup">Suportar o impacto…</button></footer>
            <button class="nqnarr-close" data-close-closest=".narrative-popup" aria-label="Fechar aviso de atordoamento"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </section>
        `;
      } else if (isStunRecovery) {
        popup.classList.add('nqnarr-overlay');
        popup.innerHTML=`
          <section class="nqnarr-card nqrecover-card" aria-describedby="nqRecoveryStory">
            <div class="nqnarr-reading" role="region" tabindex="0" aria-label="Narrativa e recuperação dos equipamentos">
              <p class="nqnarr-chapter">${stage.ch.replace(/^⚔️\s*/, '')}</p>
              <div class="nqnarr-heading"><svg class="nqrecover-flame" viewBox="0 0 80 88" aria-hidden="true"><path class="halo" d="M40 8C40 24 19 27 19 48c0 16 10 28 23 28 15 0 24-11 24-25 0-9-4-17-12-23 0 10-6 13-10 15 2-13 1-25-4-35Z"/><path class="core" d="M38 41c-9 0-14 7-12 16 2 6 8 10 12 7 4-3 3-7 0-9-4-2-2-4 1-6 3-2 2-6-1-8Z"/><path class="spark" d="M40 2v3m-20 8 3 4m38-5-3 4M9 42l4 1m58 0-4 1"/></svg><h2>${stage.title}</h2></div>
              <div class="nqnarr-story" id="nqRecoveryStory">${stage.text}</div>
              <div class="nqrecover-effect"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8-1m-4 9v2"/></svg><div><strong>Equipamentos restaurados</strong><p>Seus atributos voltam a funcionar.</p></div></div>
            </div>
            <footer class="nqnarr-footer"><button class="nqnarr-primary" data-close-closest=".narrative-popup">Retomar o combate!</button></footer>
            <button class="nqnarr-close" data-close-closest=".narrative-popup" aria-label="Fechar aviso de recuperação"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </section>
        `;
      } else if (isBoss && !isFinale) {
        popup.classList.add('nqlast-overlay');
        popup.innerHTML=`
          <section class="nqlast-card" aria-describedby="nqLastStory">
            <div class="nqlast-reading" role="region" tabindex="0" aria-label="O momento decisivo">
              <div class="nqlast-art"><img src="assets/golpe-final-cinematico.webp" alt="Os três guardiões enfrentam o Arqui-Nefromante"></div>
              <div class="nqlast-copy"><p class="nqlast-chapter">${stage.ch}</p><h2>${stage.title}</h2><p class="nqlast-message" id="nqLastStory">${stage.text}</p></div>
            </div>
            <footer class="nqlast-footer"><button class="nqlast-primary" data-close-closest=".narrative-popup">Enfrentar o Arqui-Nefromante!</button></footer>
            <button class="nqlast-close" data-close-closest=".narrative-popup" aria-label="Fechar capítulo final"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </section>
        `;
      } else {
        popup.innerHTML=`
          <div class='narrative-card' style="${cardStyle}">
            <button class="popup-x" data-close-closest=".narrative-popup" aria-label="Fechar">✕</button>
            <div class='narr-chapter' style="${chStyle}">${stage.ch}</div>
            <h3>${headEmoji}${stage.title}</h3>
            ${bossImgHtml}
            <div class='narr-text' style="${textStyle}">${stage.text}</div>
            <div class='narr-progress'>
              <strong>${state.correctTotal}</strong> acertos · Nível <strong>${state.level}</strong> · ${state.queue.length - state.idx} cartas restantes
            </div>
            <button class='btn sec' style="${btnStyle}" data-close-closest=".narrative-popup">${btnLabel}</button>
          </div>
        `;
      }
      document.body.appendChild(popup);
      nqDialogo(popup);
      // (fechar-ao-clicar-fora removido — usa o X)

      // Stun: acionar mecânica após popup aparecer
      if (isStun) {
        playSound('wrong');
        setTimeout(() => { if (typeof applyBossStun === 'function') applyBossStun(); }, 300);
        log('⚡ Atordoado pelo Arqui-Nefromante! Equipamentos bloqueados (93-97).');
      } else if (isStunRecovery) {
        playSound('levelup');
        setTimeout(() => { if (typeof removeStun === 'function') removeStun(); }, 300);
        log('💚 Recuperado! Equipamentos voltaram a funcionar.');
      } else if (isFinale) {
        log('🏆 VITÓRIA! Você derrotou o Arqui-Nefromante e salvou os rins do reino!');
      } else if (isBoss) {
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
        helmet:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        glove:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        armor:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        weapon:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        relic:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        boot:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0}
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
      if (document.getElementById('diffSelectorOverlay')) {
        if (typeof window._closeDifficultySelector === 'function') window._closeDifficultySelector(false);
        else document.getElementById('diffSelectorOverlay')?.remove();
      }
      const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const overlay = document.createElement('div');
      overlay.id = 'diffSelectorOverlay';
      overlay.className = 'diff-selector-overlay';
      overlay.setAttribute('role', 'presentation');
      overlay.setAttribute('data-nq-ui', 'lumen');
      overlay.setAttribute('data-lumen-state', 'reasoning');

      // Pré-seleciona a dificuldade recomendada pelo Ritual de Iniciação, se houver.
      let _rec = '';
      try { _rec = localStorage.getItem('nefroquest-recommended-difficulty') || ''; } catch (e) {}
      const difficultyKeys = ['easy','normal','hard','hardcore'];
      const ritualRecommendation = difficultyKeys.includes(_rec) ? _rec : '';
      const currentDifficulty = difficultyKeys.includes(state.difficulty) ? state.difficulty : 'normal';
      let selectedDiff = ritualRecommendation || currentDifficulty;
      let hasSavedJourney = !fromWelcome || Boolean(state.gameStarted);
      try { hasSavedJourney = hasSavedJourney || Boolean(localStorage.getItem('nefroquest-save')); } catch (e) {}

      const defs = {
        easy: {
          index: '01', name: 'Fácil', role: 'Ritmo de aquecimento', lives: 5,
          mix: [['Fáceis', 40], ['Médias', 40], ['Difíceis', 20]],
          mixShort: '40 · 40 · 20', adaptation: 'Ativa',
          desc: 'Mais margem para testar hipóteses enquanto o motor adaptativo acompanha seu desempenho.'
        },
        normal: {
          index: '02', name: 'Médio', role: 'Equilíbrio clínico', lives: 4,
          mix: [['Fáceis', 20], ['Médias', 40], ['Difíceis', 40]],
          mixShort: '20 · 40 · 40', adaptation: 'Ativa',
          desc: 'Distribuição equilibrada para manter ritmo, revisão e pressão clínica na mesma jornada.'
        },
        hard: {
          index: '03', name: 'Difícil', role: 'Pressão elevada', lives: 3,
          mix: [['Fáceis', 0], ['Médias', 25], ['Difíceis', 75]],
          mixShort: '0 · 25 · 75', adaptation: 'Ativa',
          desc: 'Prioriza decisões difíceis e reduz a margem para erro sem desligar a adaptação clínica.'
        },
        hardcore: {
          index: '04', name: 'Hardcore', role: 'Risco máximo', lives: 1,
          mix: [['Fáceis', 0], ['Médias', 0], ['Difíceis', 100]],
          mixShort: '0 · 0 · 100', adaptation: 'Desativada',
          desc: 'Somente questões difíceis. Um erro encerra a jornada e o motor adaptativo fica desativado.'
        }
      };

      const isolatedBackground = [];
      const isolateBackground = () => {
        Array.from(document.body.children).forEach(element => {
          if (element === overlay || ['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)) return;
          isolatedBackground.push({
            element,
            inert: Boolean(element.inert),
            ariaHidden: element.getAttribute('aria-hidden')
          });
          element.inert = true;
          element.setAttribute('aria-hidden', 'true');
        });
      };
      const restoreBackground = () => {
        isolatedBackground.splice(0).forEach(({ element, inert, ariaHidden }) => {
          element.inert = inert;
          if (ariaHidden === null) element.removeAttribute('aria-hidden');
          else element.setAttribute('aria-hidden', ariaHidden);
        });
      };

      let selectorClosed = false;
      const closeDifficultySelector = (restoreFocus = true) => {
        if (selectorClosed) return;
        selectorClosed = true;
        if (overlay.isConnected) overlay.remove();
        restoreBackground();
        if (window._closeDifficultySelector === closeDifficultySelector) delete window._closeDifficultySelector;
        window._pendingDiff = '';
        if (restoreFocus && returnFocus?.isConnected) {
          window.requestAnimationFrame(() => returnFocus.focus({ preventScroll: true }));
        }
      };
      window._closeDifficultySelector = closeDifficultySelector;

      function renderDiff() {
        const describedBy = hasSavedJourney ? 'diffSelectorDesc diffSelectorWarning' : 'diffSelectorDesc';
        overlay.innerHTML = `
          <div class="difficulty-modal nql-difficulty" role="dialog" aria-modal="true" aria-labelledby="diffSelectorTitle" aria-describedby="${describedBy}" tabindex="-1">
            <header class="difficulty-header nql-difficulty__header">
              <div class="nql-difficulty__route" aria-hidden="true"><span>CALIBRAÇÃO</span><span>RITMO CLÍNICO</span></div>
              <h2 class="difficulty-title" id="diffSelectorTitle">Calibre o ritmo da jornada.</h2>
              <p class="difficulty-subtitle" id="diffSelectorDesc">A dificuldade regula suas vidas e a mistura inicial de questões.</p>
              ${hasSavedJourney ? '<p class="difficulty-warning" id="diffSelectorWarning"><strong>Jornada ativa:</strong> ao continuar, o progresso atual será substituído.</p>' : ''}
            </header>

            <div class="nql-difficulty__body">
              <section class="nql-difficulty__selector" aria-labelledby="diffConduitTitle">
                <div class="nql-difficulty__section-head">
                  <p id="diffConduitTitle">Conduíte de exigência</p>
                  <span>Escolha 1 de 4</span>
                </div>
                <div class="difficulty-grid" role="radiogroup" aria-label="Dificuldade da jornada">
                  <span class="nql-difficulty__corruption" aria-hidden="true"></span>
                  ${Object.entries(defs).map(([k,d]) => {
                    const isRitualRecommendation = ritualRecommendation === k;
                    const isBaseline = !ritualRecommendation && k === 'normal';
                    const marker = isRitualRecommendation ? 'Indicado pelo Ritual' : (isBaseline ? 'Ponto de partida' : '');
                    return `
                    <button type="button" role="radio" aria-checked="${selectedDiff===k?'true':'false'}" tabindex="${selectedDiff===k?'0':'-1'}" class="difficulty-card nql-difficulty__option ${k}${selectedDiff===k?' selected':''}" data-action="_selectDiffCard" data-pass-this="1" data-diff-key="${k}" data-diff-name="${d.name}"${isRitualRecommendation ? ' data-recommended="true"' : ''}>
                      <span class="nql-difficulty__node" aria-hidden="true"><span></span></span>
                      <span class="nql-difficulty__option-copy">
                        <span class="nql-difficulty__option-line">
                          <span class="nql-difficulty__index">${d.index}</span>
                          <span class="difficulty-name">${d.name}</span>
                          ${marker ? `<span class="difficulty-chip${isRitualRecommendation ? ' is-ritual' : ''}">${marker}</span>` : ''}
                        </span>
                        <span class="difficulty-role">${d.role}</span>
                        <span class="difficulty-description">Proporção inicial ${d.mixShort}</span>
                      </span>
                      <span class="nql-difficulty__lives"><strong>${String(d.lives).padStart(2, '0')}</strong><span>${d.lives === 1 ? 'vida' : 'vidas'}</span></span>
                    </button>`;
                  }).join('')}
                </div>
              </section>

              <aside class="nql-difficulty__impact" aria-labelledby="diffImpactTitle">
                <div class="nql-difficulty__section-head">
                  <p id="diffImpactTitle">O que muda nesta jornada</p>
                  <span>Dados do modo</span>
                </div>
                <div class="nql-difficulty__impact-stack">
                  ${Object.entries(defs).map(([k,d]) => `
                    <section class="nql-difficulty__impact-panel ${k}" data-diff-key="${k}" aria-hidden="${selectedDiff===k?'false':'true'}">
                      <div class="nql-difficulty__impact-title">
                        <div><span>${d.role}</span><strong>${d.name}</strong></div>
                        <div><span>Margem de erro</span><strong>${String(d.lives).padStart(2, '0')} ${d.lives === 1 ? 'vida' : 'vidas'}</strong></div>
                      </div>
                      <div class="nql-difficulty__mix" aria-label="Proporção inicial de questões">
                        ${d.mix.map(([label,value]) => `
                          <div class="nql-difficulty__mix-row">
                            <span>${label}</span>
                            <span class="nql-difficulty__bar nql-difficulty__bar--${value}" aria-hidden="true"><i></i></span>
                            <strong>${value}%</strong>
                          </div>`).join('')}
                      </div>
                      <div class="nql-difficulty__adaptation">
                        <span>Motor adaptativo</span>
                        <strong>${d.adaptation}</strong>
                      </div>
                      <p>${d.desc}</p>
                    </section>`).join('')}
                </div>
              </aside>
            </div>

            <footer class="nql-difficulty__footer">
              <p>A escolha pode ser refeita ao iniciar uma nova jornada.</p>
              <div class="nql-difficulty__actions">
                <button type="button" class="difficulty-cancel" data-action="_closeDifficultySelector">Cancelar</button>
                <button type="button" class="difficulty-confirm" id="diffConfirmBtn" data-action="_confirmDiff" data-arg="${fromWelcome ? 'true' : 'false'}" data-arg-type="boolean">
                  <span>Continuar com</span><strong data-diff-confirm-name></strong><span aria-hidden="true">→</span>
                </button>
              </div>
            </footer>
            <span class="nql-visually-hidden" id="diffSelectionStatus" role="status" aria-live="polite"></span>
          </div>`;
        window._pendingDiff = selectedDiff;
      }

      function updateDifficultyPreview(key, announce = false) {
        const diff = defs[key] ? key : 'normal';
        const definition = defs[diff];
        selectedDiff = diff;
        overlay.dataset.selectedDifficulty = diff;
        overlay.querySelectorAll('.nql-difficulty__impact-panel').forEach(panel => {
          panel.setAttribute('aria-hidden', panel.dataset.diffKey === diff ? 'false' : 'true');
        });
        const confirm = overlay.querySelector('#diffConfirmBtn');
        const confirmName = confirm?.querySelector('[data-diff-confirm-name]');
        if (confirmName) confirmName.textContent = definition.name;
        if (confirm) confirm.setAttribute('aria-label', `Continuar com dificuldade ${definition.name}`);
        if (announce) {
          const status = overlay.querySelector('#diffSelectionStatus');
          if (status) status.textContent = `${definition.name} selecionado: ${definition.lives} ${definition.lives === 1 ? 'vida' : 'vidas'}.`;
        }
      }

      renderDiff();
      document.body.appendChild(overlay);
      updateDifficultyPreview(selectedDiff);
      overlay.querySelector('.difficulty-card[aria-checked="true"]')?.focus({ preventScroll: true });
      isolateBackground();

      overlay.addEventListener('nq:difficulty-change', event => {
        updateDifficultyPreview(event.detail?.difficulty, true);
      });

      overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closeDifficultySelector(true);
          return;
        }

        const currentCard = event.target.closest('.difficulty-card[role="radio"]');
        const cards = Array.from(overlay.querySelectorAll('.difficulty-card[role="radio"]'));
        if (currentCard && ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          const currentIndex = cards.indexOf(currentCard);
          let nextIndex = currentIndex;
          if (event.key === 'Home') nextIndex = 0;
          else if (event.key === 'End') nextIndex = cards.length - 1;
          else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % cards.length;
          else nextIndex = (currentIndex - 1 + cards.length) % cards.length;
          const nextCard = cards[nextIndex];
          window._selectDiffCard(nextCard);
          nextCard.focus();
          return;
        }

        if (event.key === 'Tab') {
          const modal = overlay.querySelector('.difficulty-modal');
          const focusable = Array.from(modal.querySelectorAll('button:not([disabled])'))
            .filter(element => element.tabIndex >= 0);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });

    }

    // ── Ritual de Iniciação (PED-3) ───────────────────────────────────────
    // Teste adaptativo curto (8 questões) que recomenda a dificuldade da jornada
    // conforme a base atual do usuário. ISOLADO: não afeta jornada, pontuação ou
    // streak. Ao concluir, semeia o FSRS com o resultado de cada questão (PED-3B)
    // para que a revisão espaçada parta de um estado calibrado. Resultado também
    // pré-seleciona o modo no grid de dificuldade.
    const RITUAL_LEN = 8;
    function _ritualEsc(s) {
      return (typeof escapeHtml === 'function') ? escapeHtml(s)
        : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
    }
    function _ritualPick(bandWanted, used) {
      const bank = (typeof questionBank !== 'undefined' && Array.isArray(questionBank)) ? questionBank
                 : (typeof topics !== 'undefined' && Array.isArray(topics) ? topics : []);
      const get = band => bank.filter(q => (q._d || q.diff) === band && !used.has(q.qid || q.id) && (q.o || q.opts));
      let pool = get(bandWanted);
      if (!pool.length) pool = get('medium');
      if (!pool.length) pool = get('easy');
      if (!pool.length) pool = get('hard');
      if (!pool.length) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // ── Ritual de Iniciação: página própria ──────────────────────────────────
    //
    // Era uma camada fixa sobre o jogo, com três defeitos medidos:
    // - depois de responder, as alternativas só bloqueavam o mouse
    //   (pointer-events): pelo teclado dava para responder outra, e a mesma
    //   questão contava duas vezes na recomendação;
    // - uma falha ao baixar o banco era engolida: o Ritual mostrava "0 de 8" e
    //   GRAVAVA "Fácil" como recomendação — falha virando resultado;
    // - a correção era só a cor da borda.
    // Agora é página (nqPaginaPropria), a resposta é única, a falha tem estado
    // próprio com nova tentativa e nada é gravado, e a correção diz em texto.
    async function openRitual() {
      if (typeof playSound === 'function') playSound('click');
      const { pagina, fechar } = nqPaginaPropria('ritualPage', 'Ritual de Iniciação', {
        classe: 'nq-exam nq-ritual',
        aoTeclar: e => { if (e.key === 'Escape') { e.preventDefault(); fechar(); } },
      });

      const used = new Set();
      const ritualResults = [];
      let step = 0, band = 'medium', correctCount = 0, hardCorrect = 0, hardFaced = 0, current = null;
      const letras = ['A', 'B', 'C', 'D', 'E'];
      const desenhar = (html, foco) => {
        pagina.innerHTML = `<div class="nq-study-content nq-exam-intro">${html}</div>`;
        pagina.querySelector(foco)?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      };

      function showIntro(erro = '') {
        desenhar(`
          <h1 id="ritualTitulo" tabindex="-1">Ritual de Iniciação</h1>
          <p>Responda <strong>${RITUAL_LEN} questões</strong> e o Ritual alinha a dificuldade da sua jornada ao seu nível atual: as questões se adaptam às suas respostas.</p>
          <p>Não conta para a sua jornada, pontuação ou ranking. É só um diagnóstico, e você pode refazer quando quiser.</p>
          ${erro ? `<p class="nq-exam-erro" role="alert">${erro}</p>` : ''}
          <div class="nq-exam-acoes">
            <button type="button" class="btn gold" id="ritualStart">Começar o Ritual</button>
            <button type="button" class="btn sec" id="ritualSair">Agora não</button>
          </div>`, erro ? '#ritualStart' : '#ritualTitulo');
        pagina.querySelector('#ritualStart').addEventListener('click', comecar);
        pagina.querySelector('#ritualSair').addEventListener('click', fechar);
      }

      async function comecar() {
        const botao = pagina.querySelector('#ritualStart');
        if (botao) { botao.disabled = true; botao.textContent = 'Preparando as questões…'; }
        try {
          if (typeof window._loadTopics === 'function') await window._loadTopics();
        } catch (e) {
          showIntro('Não foi possível carregar as questões. Verifique a conexão e tente de novo. Nada foi registrado.');
          return;
        }
        if (!pagina.isConnected) return;
        nextQuestion();
      }

      function nextQuestion() {
        if (step >= RITUAL_LEN) return showResult();
        current = _ritualPick(band, used);
        if (!current) {
          // Sem nenhuma questão respondida não há diagnóstico: um resultado
          // aqui seria "0 de 8 → Fácil" inventado.
          if (step === 0) return showIntro('Não há questões disponíveis para o Ritual agora. Tente de novo mais tarde. Nada foi registrado.');
          return showResult();
        }
        used.add(current.qid || current.id);
        step++;
        if (band === 'hard') hardFaced++;
        const opts = current.o || current.opts || [];
        const ans = (current.a !== undefined) ? current.a : current.ans;
        desenhar(`
          <p class="nq-exam-titulo">Ritual de Iniciação</p>
          <div class="nq-exam-progresso" role="progressbar" aria-label="Progresso do Ritual" aria-valuemin="0" aria-valuemax="${RITUAL_LEN}" aria-valuenow="${step - 1}">
            <div style="width:${((step - 1) / RITUAL_LEN * 100).toFixed(1)}%"></div>
          </div>
          <article class="nq-exam-questao">
            <h1 id="ritualQuestao" tabindex="-1">Questão ${step} de ${RITUAL_LEN}</h1>
            <p class="nq-exam-enunciado">${_ritualEsc(current.q || '')}</p>
            <div id="ritualOpts" class="nq-exam-opcoes">
              ${opts.map((opt, i) => `<button type="button" class="nq-exam-opcao" data-i="${i}">
                <span class="nq-exam-letra" aria-hidden="true">${letras[i]}</span><span>${_ritualEsc(opt)}</span></button>`).join('')}
            </div>
            <p id="ritualVeredito" class="nq-exam-veredito" role="status" aria-live="polite"></p>
          </article>`, '#ritualQuestao');
        pagina.querySelectorAll('#ritualOpts button').forEach(b =>
          b.addEventListener('click', () => answer(Number(b.dataset.i), ans), { once: true }));
      }

      function answer(escolha, ans) {
        const botoes = [...pagina.querySelectorAll('#ritualOpts button')];
        // Resposta única: desabilitar de verdade, não só para o mouse.
        if (botoes.some(b => b.disabled)) return;
        botoes.forEach(b => { b.disabled = true; });
        const isCorrect = escolha === ans;
        const marcar = (i, classe, texto) => {
          const b = botoes[i];
          if (!b) return;
          b.classList.add('nq-exam-opcao-' + classe);
          b.lastElementChild.insertAdjacentHTML('beforeend', `<strong class="nq-exam-marca">${texto}</strong>`);
        };
        marcar(ans, 'certa', isCorrect ? 'Sua escolha — correta' : 'Resposta correta');
        if (!isCorrect) marcar(escolha, 'errada', 'Sua escolha');
        pagina.querySelector('#ritualVeredito').textContent = isCorrect ? 'Correto.' : `Incorreto. A resposta certa é a ${letras[ans]}.`;
        ritualResults.push({ qid: current.qid || current.id, isCorrect });
        if (isCorrect) {
          correctCount++;
          if (band === 'hard') hardCorrect++;
          if (typeof playSound === 'function') playSound('correct');
          band = (band === 'easy') ? 'medium' : 'hard';
        } else {
          if (typeof playSound === 'function') playSound('wrong');
          band = (band === 'hard') ? 'medium' : 'easy';
        }
        setTimeout(() => { if (pagina.isConnected) nextQuestion(); }, 900);
      }

      function recommend() {
        let rec;
        if (correctCount <= 2) rec = 'easy';
        else if (correctCount <= 5) rec = 'normal';
        else if (correctCount <= 7) rec = 'hard';
        else rec = 'hardcore';
        if ((rec === 'hard' || rec === 'hardcore') && hardFaced === 0) rec = 'normal';
        if (rec === 'hardcore' && hardCorrect < 2) rec = 'hard';
        return rec;
      }

      function showResult() {
        const rec = recommend();
        try {
          localStorage.setItem('nefroquest-recommended-difficulty', rec);
          localStorage.setItem('nefroquest-ritual-done', String(Date.now()));
        } catch (e) {}
        // PED-3B: semear FSRS com o resultado de cada questão do Ritual
        if (typeof updateSRData === 'function') {
          ritualResults.forEach(r => { if (r.qid) updateSRData(r.qid, r.isCorrect); });
        }
        const LABEL = { easy: 'Fácil', normal: 'Médio', hard: 'Difícil', hardcore: 'Hardcore' };
        if (typeof playSound === 'function') playSound('levelup');
        desenhar(`
          <h1 id="ritualTitulo" tabindex="-1">Ritual concluído</h1>
          <p>Você acertou <strong>${correctCount} de ${step}</strong>.</p>
          <p>Dificuldade recomendada para sua jornada:</p>
          <p class="nq-ritual-recomendacao">${LABEL[rec]}</p>
          <div class="nq-exam-acoes">
            <button type="button" class="btn gold" id="ritualGo">Iniciar jornada nesse nível</button>
            <button type="button" class="btn sec" id="ritualSair">Voltar (a recomendação fica salva)</button>
          </div>`, '#ritualTitulo');
        pagina.querySelector('#ritualGo').addEventListener('click', () => {
          fechar();
          if (typeof startNewFromWelcome === 'function') startNewFromWelcome();
        });
        pagina.querySelector('#ritualSair').addEventListener('click', fechar);
      }

      showIntro();
    }
    window.openRitual = openRitual;
    // forgeBtn agora usa data-action="showMobileActionConfirm" data-arg="forge" no HTML
    ui.bonusBtn.addEventListener('click',buyBonusQuestion);
    if (ui.boardBtn) ui.boardBtn.addEventListener('click',()=>{ renderBoard().catch(() => {}); ui.boardModal.classList.remove('hidden'); });
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
          <p style="color:var(--txt-dim);text-align:center;font-size:0.8rem;margin-bottom:16px;">${wrongs.length} questão${wrongs.length>1?'es':''} errada${wrongs.length>1?'s':''} nesta sessão</p>
          <div class="modal-scroll-body" style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px;">
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
      document.body.classList.add('rd-game-over');
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
