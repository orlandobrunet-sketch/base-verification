    // Create floating particles
    (function(){
      const c=document.getElementById('particles');
      for(let i=0;i<20;i++){
        const p=document.createElement('div');
        p.className='particle';
        p.style.left=Math.random()*100+'%';
        p.style.top=Math.random()*100+'%';
        p.style.animationDelay=Math.random()*4+'s';
        p.style.animationDuration=(3+Math.random()*4)+'s';
        c.appendChild(p);
      }
    })();

    // ── Audio system ─────────────────────────── js/audio.js ──

    // ── Utility functions ──────────────────────── js/utils.js ──
    

    // ============ SISTEMA DE BADGES ============
    const BADGES = [
      {id: 1, name: 'Vórtice do Néfron', required: 20},
      {id: 2, name: 'Sábio do Microscópio', required: 40},
      {id: 3, name: 'Guardião das Águas', required: 60},
      {id: 4, name: 'Árbitro dos Rins', required: 80},
      {id: 5, name: 'Ascendido do NefroQuest', required: 100}
    ];
    
    function updateBadges() {
      BADGES.forEach(badge => {
        const slots = document.querySelectorAll(`.badge-slot[data-badge="${badge.id}"]`);
        if (state.correctTotal >= badge.required) {
          slots.forEach(slot => {
            if (!slot.classList.contains('unlocked')) {
              slot.classList.add('unlocked');
              const lock = slot.querySelector('.badge-lock');
              if (lock) lock.remove();
            }
          });
        }
      });

      const announced = (() => {
        try {
          return JSON.parse(localStorage.getItem('nefroquest-announced-badges') || '[]');
        } catch (e) {
          return [];
        }
      })();
      let changed = false;
      BADGES.forEach(badge => {
        if (state.correctTotal >= badge.required) {
          if (!announced.includes(badge.id)) {
            announced.push(badge.id);
            changed = true;
            log(`🏆 Badge desbloqueado: ${badge.name}!`);
            playSound('chest');
          }
        }
      });
      if (changed) {
        try {
          localStorage.setItem('nefroquest-announced-badges', JSON.stringify(announced));
        } catch (e) {}
      }
    }
    
    // ── Analytics ────────────────────────────────────────────────────────────
    // Wrapper sobre gtag (GA4). Adicione outros destinos aqui se necessário.
    // Funil principal: game_started → question_answered → boss_entered
    //                  → game_completed / paywall_shown → premium_converted
    // ─────────────────────────────────────────────────────────────────────────

    function checkGameCompletion() {
      if (state.correctTotal >= 100 && !state.gameCompleted) {
        state.gameCompleted = true;
        localStorage.setItem('nefroquest-arqui-defeated', '1');
        if (state.difficulty === 'hardcore') {
          localStorage.setItem('nefroquest-hardcore-completed', '1');
        }
        _track('game_completed', { difficulty: state.difficulty, level: state.level, score: state.score });
        checkAchievements();
        showGameCompletionModal();
      }
    }
    
    function showGameCompletionModal() {
      const modal = document.createElement('div');
      // Removido 'modal show' — conflitava com .nq-overlay (regra .modal define
      // width: 700px, fazendo o overlay virar card de meia tela).
      modal.className = 'nq-overlay victory-popup';
      modal.id = 'victoryModal';
      modal.style.cssText = 'background:rgba(0,0,0,0.92);z-index:9999;-webkit-backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);';
      modal.innerHTML = `
        <div class="victory-wrap">
          <img src="assets/victory.jpg" alt="Vitória" class="victory-img">
          <div class="victory-card">
            <h2 class="victory-title">PARABÉNS, HERÓI!</h2>
            <p class="victory-sub">Você purificou o Reino e venceu o NefroQuest!</p>
            <div class="victory-stats">
              <div class="victory-stat"><span class="victory-stat-val">${state.score.toLocaleString('pt-BR')}</span><span class="victory-stat-lbl">Pontos</span></div>
              <div class="victory-stat"><span class="victory-stat-val">${state.level}</span><span class="victory-stat-lbl">Nível</span></div>
              <div class="victory-stat"><span class="victory-stat-val">100</span><span class="victory-stat-lbl">Acertos</span></div>
              <div class="victory-stat"><span class="victory-stat-val">${state.gold}</span><span class="victory-stat-lbl">Ouro</span></div>
            </div>
            <p class="victory-champion-msg">Você recebeu o <strong>Título de Campeão</strong>! Este badge ficará visível no Leaderboard.</p>
            <div class="victory-btns">
              <button class="btn sec" data-action="continueAfterCompletion">Continuar Jogando</button>
              <button class="btn gold" data-action="finishGameCompletely">Encerrar Jornada</button>
              <button class="btn victory-share" data-action="shareVictory" data-pass-this="1">📤 Compartilhar</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('victory');
    }

    function shareVictory(btn) {
      const text = `🏆 Completei o NefroQuest: Ascension!\n\n✅ 100 questões de nefrologia respondidas\n📊 ${state.score} pontos · Nível ${state.level}\n🎮 Derrotei o Arqui-Nefromante!\n\nTeste seus conhecimentos: https://nefroquest.com`;
      if (navigator.share) {
        navigator.share({ title: 'NefroQuest: Ascension - Vitória!', text: text, url: 'https://nefroquest.com' }).catch(()=>{});
      } else {
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✅ Copiado!';
          setTimeout(() => { btn.textContent = '📤 Compartilhar'; }, 2000);
        }).catch(() => {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        });
      }
    }
    
    function finishGameCompletely() {
      state.completedGame = true;
      saveGame();
      document.querySelector('.modal.show')?.remove();
      finishGame();
    }
    
    function continueAfterCompletion() {
      state.completedGame = true;
      document.getElementById('victoryModal')?.remove();
      document.querySelector('.modal.show')?.remove();
      log('🏆 Campeão! Você continua sua jornada lendária!');
      renderHUD();
      saveGame();
    }

    // ============ SISTEMA DE VIDA EXTRA ============
    function checkExtraLife() {
      // Ganha vida extra a cada 5 níveis (5, 10, 15, 20...)
      if (state.level % 5 === 0 && state.lives < effectiveMaxLives() && !state.extraLifeGiven) {
        state.lives++;
        state.extraLifeGiven = true;
        showExtraLifeModal();
      } else if (state.level % 5 !== 0) {
        state.extraLifeGiven = false;
      }
    }
    
    function showExtraLifeModal() {
      const modal = document.createElement('div');
      // Removido 'modal show' — conflitava com .nq-overlay.
      modal.className = 'nq-overlay extra-life-popup';
      modal.style.cssText = 'background:rgba(0,0,0,0.85);z-index:9999;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;max-height:88vh;overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;">
          <h2 style="color:var(--ok);margin-bottom:16px;">💚 VIDA EXTRA! 💚</h2>
          <p style="font-size:1.05rem;line-height:1.6;margin-bottom:20px;">
            Os Deuses do Néfron reconhecem sua dedicação!<br>
            <strong>Você ganhou +1 vida!</strong>
          </p>
          <p style="color:var(--txt-dim);margin-bottom:24px;">
            Continue sua jornada com renovada energia e sabedoria.
          </p>
          <button class="btn gold" data-close-closest=".extra-life-popup">Continuar</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('levelup');
    }

    // ============ POPUP DE EVOLUÇÃO DO PERSONAGEM ============
    function showEvolutionPopup(newLevel, newTitle, newImage) {
      // Remover popup anterior se existir
      document.querySelectorAll('.evolution-popup').forEach(el => el.remove());
      const evolutionTexts = {
        2: "A jornada começa a revelar seus segredos. Seus olhos enxergam o que antes era invisível.",
        3: "Suas células começam a brilhar com conhecimento. Você sente o poder da filtração fluindo em suas veias!",
        4: "Cada questão respondida forja sua mente. O Reino Sombrio do Néfron recua diante de sua luz.",
        5: "Os néfrons reconhecem sua maestria! Você transcende para um novo patamar de sabedoria renal.",
        6: "O equilíbrio ácido-base se dobra à sua vontade. Você é mais do que um estudante — é um guardador.",
        7: "As forças da homeostase se curvam diante de você. Seu domínio sobre o equilíbrio é inegável!",
        8: "Os Glomérulos Antigos reconhecem seu poder. Você penetra nos mistérios das glomerulopatias.",
        9: "Sua aura de conhecimento renal irradia por todo o reino. Pacientes e colegas buscam sua sabedoria.",
        10: "Você alcança a harmonia perfeita entre reabsorção e secreção. Os Deuses do Néfron sorriem para você!",
        11: "As trevas da DRC avançada recuam. Você domina diálise, transplante e as fronteiras da nefroproteção.",
        12: "Seu conhecimento sobre diálise e transplante é incomparável. Você é uma lenda viva!",
        13: "O Arqui-Nefromante sente sua presença. Cada resposta correta enfraquece suas defesas.",
        14: "Você está à beira da transcendência. O poder da homeostase absoluta pulsa em suas mãos.",
        15: "O Arqui-Nefromante treme! Você está pronto para o confronto final. Sua ascensão está completa!"
      };
      
      // Narrativas de lore específicas por personagem
      const loreNarratives = {
        2: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os primeiros ritos do Néfron foram superados. Você começa a ver padrões onde outros veem caos.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As primeiras ondas do saber te envolvem. Sua sensibilidade para o equilíbrio hídrico desperta.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os primeiros dados se organizam em sua mente. O método científico começa a guiar seus passos.</em>'
        },
        3: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os antigos pergaminhos se revelam... Você agora compreende os segredos da filtração glomerular.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas ancestrais sussurram seu nome... Você domina os mistérios da homeostase hídrica.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os dados se alinham perfeitamente... Sua mente científica alcança novos horizontes.</em>'
        },
        4: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As Cripta da Creatinina revelou seus segredos. Você avance para os domínios da proteinúria e da lesão tubular.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os rios do sódio e potássio obedecem à sua voz. Você é guaraniã das correntes vitais.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus modelos preditivos começam a ganhar precisão. A ciência renal curva-se à sua mente analítica.</em>'
        },
        5: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Conselho dos Néfrons reconhece sua dedicação. Você é digno de portar o título de Guardião.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As correntes vitais fluem através de você. Sua conexão com as águas da vida se fortalece.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Suas pesquisas revolucionam o campo. A comunidade científica celebra suas descobertas.</em>'
        },
        6: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Templo do Equilíbrio Ácido-Base abre suas portas. Você lê o pH urinário como um texto sagrado.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As marés do sódio e do bicarbonato respondem ao seu toque. Você é a guaraniã do equilíbrio.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus algoritmos de classificação renal são adotados por todo o reino. A ciência te reconhece.</em>'
        },
        7: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As forças da natureza renal se curvam à sua vontade. Você transcende os limites do conhecimento comum.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você dança entre eletrólitos e osmolaridade com graça divina. O equilíbrio é sua essência.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus experimentos desafiam paradigmas. Você está à beira de uma grande revelação.</em>'
        },
        8: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As Catacumbas das Glomerulopatias se abrem. Você decifra biopsias como um arquélogo do rim.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas profundas da síndrome nefrótica revelam seus segredos. Você é a guaraniã da barreira de filtração.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus estudos sobre podocitopatas são citados em todo o reino. A ciência renal te deve uma dívida.</em>'
        },
        9: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Oraculo do Transplante te convoca. Você domina imunossupressores e rejeicões com mãos firmes.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você navega pelas águas turvas da diálise peritoneal com destreza. Cada cateter é uma nova história.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus dados sobre sobrevida em diálise redefinem protocolos. O reino renal te ouve com atenção.</em>'
        },
        10: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os Deuses do Néfron concedem sua bênção. Você alcançou a harmonia perfeita entre ciência e arte.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas primordiais reconhecem você como sua mestra. Seu poder é incontestável.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Sua tese redefine a nefrologia moderna. Você é uma referência mundial.</em>'
        },
        11: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As Fortalezas da DRC Avançada caem diante de você. Cada paciente em diálise é uma vitória da sua dedicação.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você domina as águas da ultrafiltracão e da osmose. A hemofiltração obedece à sua vontade.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus ensaios clínicos são apresentados em congressos internacionais. O mundo renal te escuta.</em>'
        },
        12: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Lendas serão escritas sobre sua jornada. Você domina tanto o coração quanto os rins.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seu nome ecoa pelos corredores dos hospitais. Você é a esperança dos pacientes renais.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Prêmios internacionais aguardam por você. Sua contribuição é inestimável.</em>'
        },
        13: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Arqui-Nefromante enviou seus emissários. Você os derrotou com cada resposta certa. A batalha final se aproxima.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas do destino convergem para você. Você sente o peso e a glória da jornada que percorreu.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Sua meta-análise final está quase completa. Os dados apontam para uma verdade que mudará a nefrologia.</em>'
        },
        14: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você está à beira da transcendência. O Arqui-Nefromante treme, mas ainda resiste. Prepare-se para o golpe final.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas primordiais cantam seu nome. Você é a encarnação da homeostase perfeita. A vitória é sua.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O último dado foi coletado. Sua tese está pronta para mudar o mundo. A defesa é amanhã.</em>'
        },
        15: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Arqui-Nefromante sente seu poder crescente. O confronto final se aproxima... Você está pronto.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As forças das trevas tremem diante de sua luz. Você é a última esperança contra o caos renal.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Todos os dados convergem para este momento. A batalha final determinará o futuro da nefrologia.</em>'
        }
      };
      
      const charId = state.character || 'nephros';
      const loreText = (loreNarratives[newLevel] && loreNarratives[newLevel][charId]) || '';
      
      const text = evolutionTexts[newLevel] || "Você evoluiu! Continue sua jornada rumo à maestria nefrológica.";
      
      const modal = document.createElement('div');
      // Removido 'modal show' — conflitava com .nq-overlay (a regra .modal
      // define width: 700px, fazendo o overlay virar um card de meia tela
      // em vez de cobrir a viewport inteira).
      modal.className = 'nq-overlay evolution-popup';
      modal.style.cssText = 'background:rgba(0,0,0,0.85);z-index:9999;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;max-height:88vh;overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;">
          <h2 style="color:var(--gold);margin-bottom:12px;">⚡ EVOLUÇÃO! ⚡</h2>
          <div style="margin:20px auto;width:120px;height:120px;border-radius:50%;overflow:hidden;border:3px solid var(--gold);box-shadow:0 0 20px rgba(255,215,0,0.5);">
            <img src="${newImage}" style="width:100%;height:100%;object-fit:cover;" alt="${newTitle}">
          </div>
          <h3 style="color:var(--ok);margin-bottom:8px;font-size:1.3rem;">${newTitle}</h3>
          ${loreText ? loreText.replace('margin-top:12px', 'margin-top:12px;margin-bottom:20px') : `<em style="color:#a0aec0;font-size:0.85rem;display:block;margin:12px 20px 20px;font-style:italic;">${text}</em>`}
          <button class="btn gold" data-close-closest=".evolution-popup">Continuar Jornada</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('levelup');
    }

    // ============ SISTEMA DE SAVE/LOAD (localStorage) ============
    const SAVE_KEY = 'nefroquest-save';
    const STATS_KEY = 'nefroquest-stats';
    const MASTERED_KEY = 'nefroquest-mastered';
    // Schema version — incrementar ao adicionar campos obrigatórios ao saveData
    // Histórico: 1 = original  2 = bossIntroShown + chestsOpened  3 = legendaryAbilityUsed  4 = difficulty + maxLives  5 = relic1 + relic2 double relics  6 = 6-slot diablo grid layout
    const SAVE_SCHEMA_VERSION = 6;

    // ============ FREEMIUM ============
    // Reconhece admin via JWT custom claim (app_metadata.is_admin).
    // Segurança real está no RLS.
    function isAdminUser() {
      if (!authUser) return false;
      if (authUser.app_metadata?.is_admin === true) return true;
      return false;
    }

    const FREE_QUESTIONS_LIMIT = 50;
    const PREMIUM_KEY = 'nefroquest-premium';
    const WHITELIST_KEY = 'nefroquest-whitelist';
    const IDENTITY_KEY = 'nq-identity'; // 'study' | 'combat'
    const _lang = (navigator.language || 'pt').startsWith('pt') ? 'pt' : 'en';
    // Expõe o idioma detectado para outros módulos (single source of truth).
    // Veja o helper t(pt, en) em utils.js para strings bilíngues.
    window.NQ_CONFIG = window.NQ_CONFIG || {};
    window.NQ_CONFIG.lang = _lang;
    const PRICE_MONTHLY  = _lang === 'pt' ? 'R$14,90' : 'US$14.90';
    const PRICE_LIFETIME = _lang === 'pt' ? 'R$199,00' : 'US$199.00';
    
    // ── Cache de stats (evita JSON.parse a cada resposta) ──
    let _statsCache = null;
    function getGameStats() {
      if (_statsCache) return Object.assign({}, _statsCache);
      const def = {gamesPlayed:0,bestLevel:0,bestScore:0,questionsAnsweredAllTime:0};
      try { _statsCache = Object.assign({}, def, JSON.parse(localStorage.getItem(STATS_KEY) || '{}')); }
      catch(e) { _statsCache = def; }
      return Object.assign({}, _statsCache);
    }
    function _invalidateStatsCache() { _statsCache = null; }

    let _storageWarnShown = false;
    function _warnStorageFull() {
      if (_storageWarnShown) return;
      _storageWarnShown = true;
      if (typeof _toast === 'function') _toast('Armazenamento cheio — estatísticas podem não ser salvas. Libere espaço no navegador.', 'warning', 7000);
      if (typeof _track === 'function') _track('error_localstorage_full', {});
    }

    function updateGameStats() {
      const stats = getGameStats();
      stats.gamesPlayed++;
      if (state.level > stats.bestLevel) stats.bestLevel = state.level;
      if (state.score > stats.bestScore) stats.bestScore = state.score;
      try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch(e) { _warnStorageFull(); }
      _invalidateStatsCache();
      _scheduleCloudSync();
    }

    // ── Geração de Assinatura Premium local para evitar bypass via console ──
    function _generatePremiumSignature(userId) {
      if (!userId) return '';
      const salt = 'nefro-gold-rpg-secret-2026';
      const str = userId + salt;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converte para inteiro de 32 bits
      }
      return hash.toString(36);
    }
    window._generatePremiumSignature = _generatePremiumSignature;
    window.isPremium = isPremium;
    window._invalidatePremiumCache = _invalidatePremiumCache;

    // ── Cache de isPremium (evita 2x localStorage por resposta) ──
    let _isPremiumCache = null;
    function isPremium() {
      if (isAdminUser()) return true;
      if (!authUser) return false; // sem conta ativa, localStorage não conta
      if (_isPremiumCache !== null) return _isPremiumCache;

      const sig = localStorage.getItem('nefroquest-premium-sig');
      const expectedSig = _generatePremiumSignature(authUser.id);
      const hasPremium = localStorage.getItem(PREMIUM_KEY) === '1' && sig === expectedSig;

      const wlSig = localStorage.getItem('nefroquest-whitelist-sig');
      const expectedWlSig = _generatePremiumSignature(authUser.email);
      const hasWhitelist = localStorage.getItem(WHITELIST_KEY) === '1' && wlSig === expectedWlSig;

      _isPremiumCache = hasPremium || hasWhitelist;
      return _isPremiumCache;
    }
    function _invalidatePremiumCache() { _isPremiumCache = null; }

    async function _loadPremiumFromDB() {
      if (!_supaClient || !authUser) return;
      if (isAdminUser()) return;
      try {
        const { data: profile } = await _supaClient
          .from('profiles')
          .select('is_premium')
          .eq('id', authUser.id)
          .single();
        if (profile?.is_premium) {
          localStorage.setItem(PREMIUM_KEY, '1');
          localStorage.setItem('nefroquest-premium-sig', _generatePremiumSignature(authUser.id));
          localStorage.removeItem(WHITELIST_KEY);
          localStorage.removeItem('nefroquest-whitelist-sig');
          _invalidatePremiumCache();
          return;
        } else {
          localStorage.removeItem(PREMIUM_KEY);
          localStorage.removeItem('nefroquest-premium-sig');
        }
        // Check whitelist
        const { data: wl } = await _supaClient
          .from('access_whitelist')
          .select('email')
          .eq('email', authUser.email)
          .maybeSingle();
        if (wl?.email) {
          localStorage.setItem(WHITELIST_KEY, '1');
          localStorage.setItem('nefroquest-whitelist-sig', _generatePremiumSignature(authUser.email));
        } else {
          localStorage.removeItem(WHITELIST_KEY);
          localStorage.removeItem('nefroquest-whitelist-sig');
        }
        _invalidatePremiumCache();
      } catch(e) {}
    }

    function _incrementQuestionsAnswered() {
      const stats = getGameStats();
      stats.questionsAnsweredAllTime = (stats.questionsAnsweredAllTime || 0) + 1;
      try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch(e) { _warnStorageFull(); }
      _invalidateStatsCache();
      if (_guestMode) _guestQuestionCount++;
    }
    
    // Debounce do saveGame para evitar escritas excessivas no localStorage
    let _saveTimer = null;
    function saveGame() {
      if (!state.gameStarted || state.gameOver) return;
      if (_saveTimer) return; // já agendado
      _saveTimer = setTimeout(() => {
        _saveTimer = null;
        _doSaveGame();
      }, 300);
    }
    function _doSaveGame() {
      if (!state.gameStarted || state.gameOver) return;
      const saveData = {
        level: state.level,
        xp: state.xp,
        xpToNext: state.xpToNext,
        score: state.score,
        lives: state.lives,
        streak: state.streak,
        gold: state.gold,
        bonusUses: state.bonusUses,
        correctTotal: state.correctTotal,
        narrativeShown: state.narrativeShown,
        bossIntroShown: state.bossIntroShown || false,
        battleFinalShown: state.battleFinalShown || false,
        character: state.character,
        equipment: JSON.parse(JSON.stringify(state.equipment)),
        idx: state.idx,
        queueIds: state.queue.map(q => q.id),
        recentIds: _recentIds,
        chestsOpened: state.chestsOpened,
        obtainedItems: Array.isArray(state.obtainedItems) ? state.obtainedItems.slice() : [],
        allItemsCollectedNotified: !!state.allItemsCollectedNotified,
        difficulty: state.difficulty || 'normal',
        maxLives: state.maxLives || 3,
        legendaryAbilityUsed: {...state.legendaryAbilityUsed},
        extraLifeGiven: state.extraLifeGiven || false,
        chestCorrectCount: state.chestCorrectCount || 0,
        chestTarget: state.chestTarget || 5,
        timestamp: Date.now(),
        schemaVersion: SAVE_SCHEMA_VERSION
      };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } catch(e) {
        _track('error_localstorage_full', { msg: String(e) });
        _toast('Aviso: progresso não salvo — armazenamento cheio. Libere espaço nas configurações do navegador.', 'warning', 6000);
      }
      _scheduleCloudSync();
    }

    function _migrateSave(save) {
      const v = save.schemaVersion || 1;
      // v1 → v2: garantir campos adicionados depois do lançamento
      if (v < 2) {
        save.bossIntroShown  = save.bossIntroShown  ?? false;
        save.chestsOpened    = save.chestsOpened    ?? 0;
        save.schemaVersion   = 2;
      }
      if (v < 3) {
        save.legendaryAbilityUsed = save.legendaryAbilityUsed ?? {};
        save.schemaVersion = 3;
      }
      if (v < 4) {
        save.difficulty = save.difficulty ?? 'normal';
        save.maxLives   = save.maxLives   ?? 3;
        save.schemaVersion = 4;
      }
      if (v < 5) {
        if (save.equipment) {
          const oldRelic = save.equipment.relic || {n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0};
          save.equipment.relic1 = oldRelic;
          save.equipment.relic2 = {n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0};
          delete save.equipment.relic;
        }
        save.schemaVersion = 5;
      }
      if (v < 6) {
        if (save.equipment) {
          const eq = save.equipment;
          const emptyItem = {n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0};
          
          let helmet = {...emptyItem};
          let glove = {...emptyItem};
          let relic = {...emptyItem};
          let armor = eq.armor ? {...eq.armor} : {...emptyItem};
          let weapon = eq.weapon ? {...eq.weapon} : {...emptyItem};
          let boot = {...emptyItem};

          const r1 = eq.relic1 || {...emptyItem};
          const r2 = eq.relic2 || {...emptyItem};

          if (r1.n === 'Elmo do Filtrador Supremo') {
            helmet = r1;
          } else if (r1.n !== 'Vazio') {
            relic = r1;
          }

          if (r2.n === 'Elmo do Filtrador Supremo') {
            helmet = r2;
          } else if (r2.n !== 'Vazio') {
            if (relic.n === 'Vazio') {
              relic = r2;
            }
          }

          if (armor.n === 'Luvas de Látex Reforçadas') {
            glove = armor;
            armor = {...emptyItem};
          }

          save.equipment = { helmet, glove, armor, weapon, relic, boot };
        }
        save.schemaVersion = 6;
      }
      return save;
    }

    function loadGame() {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      try {
        const save = JSON.parse(raw);
        return _migrateSave(save);
      } catch(e) {
        _track('error_save_corrupt', {msg: String(e)});
        localStorage.removeItem(SAVE_KEY);
        return null;
      }
    }
    
    function deleteSave() {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('nefroquest-announced-badges');
      _scheduleCloudSync();
    }

    function clearLocalProgress() {
      const keys = [
        SAVE_KEY,
        STATS_KEY,
        MASTERED_KEY,
        'nefroquest-detailed-stats',
        'nefroquest-achievements',
        'unlockedArticles',
        'nq-unlocked-refs',
        'nq-acidbase-progress',
        'nefroquest-sr-data',
        'nefroquest-arqui-defeated',
        'nefroquest-hardcore-completed',
        'nefroquest-minigame-best',
        'nefroquest-announced-badges'
      ];
      keys.forEach(k => localStorage.removeItem(k));
      _invalidateStatsCache();
    }
    window.clearLocalProgress = clearLocalProgress;

    // ============ CLOUD SYNC (progresso na nuvem para usuários logados) ============
    let _cloudSyncTimer = null;

    function _scheduleCloudSync() {
      if (!authUser || !_supaClient) return;
      if (_cloudSyncTimer) clearTimeout(_cloudSyncTimer);
      _cloudSyncTimer = setTimeout(_syncProgressToCloud, 10000);
    }

    function _buildCloudProgress() {
      let achievements = [], mastered = [], unlockedArticles = [], detailedStats = {}, save = null;
      let unlockedRefs = [], acidBaseProgress = {}, srData = {};
      try { achievements    = JSON.parse(localStorage.getItem('nefroquest-achievements') || '[]'); } catch(e) {}
      try { mastered        = JSON.parse(localStorage.getItem(MASTERED_KEY) || '[]'); } catch(e) {}
      try { unlockedArticles= JSON.parse(localStorage.getItem('unlockedArticles') || '[]'); } catch(e) {}
      try { detailedStats   = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY || 'nefroquest-detailed-stats') || '{}'); } catch(e) {}
      try { const r = localStorage.getItem(SAVE_KEY); save = r ? JSON.parse(r) : null; } catch(e) {}
      try { unlockedRefs    = JSON.parse(localStorage.getItem('nq-unlocked-refs') || '[]'); } catch(e) {}
      try { acidBaseProgress= JSON.parse(localStorage.getItem('nq-acidbase-progress') || '{}'); } catch(e) {}
      try { srData          = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}'); } catch(e) {}
      return {
        stats:            getGameStats(),
        achievements,
        mastered,
        unlockedArticles,
        unlockedRefs,
        arquiDefeated:    !!localStorage.getItem('nefroquest-arqui-defeated'),
        hardcoreCompleted:!!localStorage.getItem('nefroquest-hardcore-completed'),
        detailedStats,
        save,
        acidBaseProgress,
        srData,
        updatedAt:        new Date().toISOString()
      };
    }

    async function _syncProgressToCloud() {
      _cloudSyncTimer = null;
      if (!authUser || !_supaClient) return;
      try {
        await _supaClient
          .from('profiles')
          .update({ game_progress: _buildCloudProgress() })
          .eq('id', authUser.id);
      } catch(e) { _track('error_cloud_sync', { msg: String(e) }); }
    }

    function _mergeCloudProgress(cloud) {
      if (!cloud || typeof cloud !== 'object') return;

      // Stats: máximo por campo
      if (cloud.stats && typeof cloud.stats === 'object') {
        const local = getGameStats();
        const merged = {
          gamesPlayed:            Math.max(local.gamesPlayed || 0,            cloud.stats.gamesPlayed || 0),
          bestLevel:              Math.max(local.bestLevel || 0,              cloud.stats.bestLevel || 0),
          bestScore:              Math.max(local.bestScore || 0,              cloud.stats.bestScore || 0),
          questionsAnsweredAllTime: Math.max(local.questionsAnsweredAllTime || 0, cloud.stats.questionsAnsweredAllTime || 0)
        };
        try { localStorage.setItem(STATS_KEY, JSON.stringify(merged)); } catch(e) { console.error('[NQ] saveStats failed', e); }
        _invalidateStatsCache();
      }

      // Conquistas, questões dominadas, artigos — união dos dois sets
      const _mergeArray = (key, cloud) => {
        if (!Array.isArray(cloud) || !cloud.length) return;
        let local = [];
        try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}
        const merged = [...new Set([...local, ...cloud])];
        try { localStorage.setItem(key, JSON.stringify(merged)); } catch(e) { console.error('[NQ] _mergeArray write failed', e); }
      };
      _mergeArray('nefroquest-achievements', cloud.achievements);
      _mergeArray(MASTERED_KEY,              cloud.mastered);
      _mergeArray('unlockedArticles',        cloud.unlockedArticles);
      _mergeArray('nq-unlocked-refs',        cloud.unlockedRefs);

      // Flags booleanas: OR (true prevalece)
      if (cloud.arquiDefeated)     localStorage.setItem('nefroquest-arqui-defeated', '1');
      if (cloud.hardcoreCompleted) localStorage.setItem('nefroquest-hardcore-completed', '1');

      // Stats detalhadas: local prevalece se existir, nuvem preenche o que faltar
      if (cloud.detailedStats && typeof cloud.detailedStats === 'object') {
        let local = {};
        try { local = JSON.parse(localStorage.getItem('nefroquest-detailed-stats') || '{}'); } catch(e) {}
        if (!Object.keys(local).length) {
          try { localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(cloud.detailedStats)); } catch(e) { console.error('[NQ] saveDetailedStats (cloud merge) failed', e); }
        }
      }

      // Save em andamento: prevalece o mais recente (por timestamp)
      if (cloud.save && typeof cloud.save === 'object' && cloud.save.character) {
        let localTs = 0;
        try { const r = localStorage.getItem(SAVE_KEY); localTs = r ? (JSON.parse(r).timestamp || 0) : 0; } catch(e) {}
        if ((cloud.save.timestamp || 0) > localTs) {
          try { localStorage.setItem(SAVE_KEY, JSON.stringify(cloud.save)); } catch(e) { console.error('[NQ] saveSave (cloud merge) failed', e); }
        }
      }

      // Progresso do minijogo de ácido-base/câmara de equilíbrio
      if (cloud.acidBaseProgress && typeof cloud.acidBaseProgress === 'object') {
        let local = {};
        try { local = JSON.parse(localStorage.getItem('nq-acidbase-progress') || '{}'); } catch(e) {}
        const localCompleted = Array.isArray(local.completed) ? local.completed : [];
        const cloudCompleted = Array.isArray(cloud.acidBaseProgress.completed) ? cloud.acidBaseProgress.completed : [];
        const mergedCompleted = [...new Set([...localCompleted, ...cloudCompleted])];

        const localUses = local.grimoireUses && typeof local.grimoireUses === 'object' ? local.grimoireUses : {};
        const cloudUses = cloud.acidBaseProgress.grimoireUses && typeof cloud.acidBaseProgress.grimoireUses === 'object' ? cloud.acidBaseProgress.grimoireUses : {};
        const mergedUses = { ...localUses };
        Object.keys(cloudUses).forEach(k => {
          mergedUses[k] = Math.max(localUses[k] || 0, cloudUses[k] || 0);
        });

        const mergedAB = {
          completed: mergedCompleted,
          grimoireUses: mergedUses
        };
        try { localStorage.setItem('nq-acidbase-progress', JSON.stringify(mergedAB)); } catch(e) { console.error('[NQ] saveAcidBase (cloud merge) failed', e); }
      }

      // Dados de repetição espaçada (Spaced Repetition)
      if (cloud.srData && typeof cloud.srData === 'object') {
        let local = {};
        try { local = JSON.parse(localStorage.getItem('nefroquest-sr-data') || '{}'); } catch(e) {}
        const mergedSR = { ...cloud.srData, ...local };
        Object.keys(cloud.srData).forEach(qid => {
          const lCard = local[qid];
          const cCard = cloud.srData[qid];
          if (lCard && cCard) {
            if (cCard.reps > lCard.reps) {
              mergedSR[qid] = cCard;
            }
          } else if (cCard) {
            mergedSR[qid] = cCard;
          }
        });
        try { localStorage.setItem('nefroquest-sr-data', JSON.stringify(mergedSR)); } catch(e) { console.error('[NQ] saveSRData (cloud merge) failed', e); }
      }
    }

    async function _loadProgressFromCloud() {
      if (!authUser || !_supaClient) return;
      try {
        const { data: profile } = await _supaClient
          .from('profiles')
          .select('game_progress')
          .eq('id', authUser.id)
          .single();
        _mergeCloudProgress(profile?.game_progress);
        _refreshWelcomeStats(); // atualiza DOM após dados da nuvem chegarem (evita race condition)
        
        // Se após o merge local houver dados combinados mais recentes, agenda upload de volta
        setTimeout(() => {
          if (typeof _syncProgressToCloud === 'function') {
            _syncProgressToCloud().catch(() => {});
          }
        }, 2000);
      } catch(e) { _track('error_cloud_load', { msg: String(e) }); }
    }

    // Atualiza o bloco de estatísticas da welcome screen com dados atuais do localStorage.
    // Chamado após merge cloud→local para corrigir o caso em que localStorage estava vazio
    // quando a tela foi renderizada (ex: usuário limpou dados do navegador).
    function _refreshWelcomeStats() {
      const ws = document.getElementById('welcomeScreen');
      if (!ws || ws.classList.contains('hidden')) return;
      const stats = getGameStats();
      const board = boardGet();
      const statsEl = document.getElementById('welcomeStats');
      if (!statsEl) return;
      if (stats.gamesPlayed > 0 || board.length > 0) {
        statsEl.style.display = 'grid';
        const s = document.getElementById('wsBestScore');
        const g = document.getElementById('wsGamesPlayed');
        const l = document.getElementById('wsBestLevel');
        if (s) s.textContent = stats.bestScore || (board.length ? board[0].score : 0);
        if (g) g.textContent = stats.gamesPlayed;
        if (l) l.textContent = stats.bestLevel;
      }
      refreshWelcomeSave();
    }

    function restoreGame() {
      const save = loadGame();
      if (!save || !save.character) return false;
      
      state.character = save.character;
      state.level = save.level || 1;
      state.xp = save.xp || 0;
      state.xpToNext = xpForLevel(save.level || 1); // sempre recalculado pelo nível, ignora valor salvo
      state.score = save.score || 0;
      state.lives = save.lives || 3;
      state.streak = save.streak || 0;
      state.gold = save.gold || 0;
      state.bonusUses = save.bonusUses || 0;
      state.correctTotal = save.correctTotal || 0;
      state.narrativeShown = save.narrativeShown || 0;
      state.bossIntroShown = save.bossIntroShown || false;
      state.battleFinalShown = save.battleFinalShown || false;
      state.chestsOpened = save.chestsOpened || 0;
      state.obtainedItems = Array.isArray(save.obtainedItems) ? save.obtainedItems.slice() : [];
      state.allItemsCollectedNotified = !!save.allItemsCollectedNotified;
      state.difficulty = save.difficulty || 'normal';
      state.maxLives = save.maxLives || 3;
      chestCost = Math.min(100 + state.chestsOpened * 15, 250);
      state.legendaryAbilityUsed = save.legendaryAbilityUsed || {};
      state.extraLifeGiven = save.extraLifeGiven || false;
      state.chestCorrectCount = save.chestCorrectCount || 0;
      state.chestTarget = save.chestTarget || (Math.floor(Math.random() * 3) + 5);
      state.gameCompleted = !!localStorage.getItem('nefroquest-arqui-defeated');
      state.gameOver = false;
      state.gameStarted = true;
      state.answered = false;
      state.current = null;
      
      if (save.equipment) {
        state.equipment = save.equipment;
      }
      
      // Restore queue order
      if (save.queueIds && save.queueIds.length > 0) {
        const bankMap = {};
        questionBank.forEach(q => bankMap[q.id] = q);
        state.queue = save.queueIds.map(id => bankMap[id]).filter(Boolean);
        state.idx = save.idx || 0;
        if (save.recentIds) _recentIds = save.recentIds.slice(-HISTORY_SIZE);
      } else {
        shuffleQueue();
      }
      
      return true;
    }
    
    // Auto-save via Proxy debounce (500ms) — sem setInterval redundante

    // ============ WELCOME SCREEN LOGIC ============
    function initWelcomeScreen() {
      // Gerar partículas flutuantes animadas
      (function spawnParticles() {
        const container = document.getElementById('welcomeParticles');
        if (!container) return;
        const colors = ['gold','blue','white','purple'];
        const sizes = [6,8,10,12,16,20];
        const count = 28;
        for (let i = 0; i < count; i++) {
          const p = document.createElement('div');
          const color = colors[Math.floor(Math.random()*colors.length)];
          const size = sizes[Math.floor(Math.random()*sizes.length)];
          const left = Math.random()*100;
          const delay = Math.random()*12;
          const duration = 6 + Math.random()*10;
          const drift = (Math.random()-0.5)*120;
          p.className = `wp ${color}`;
          p.style.cssText = `width:${size}px;height:${size}px;left:${left}%;bottom:-${size}px;` +
            `--drift:${drift}px;animation-duration:${duration}s;animation-delay:${delay}s;`;
          container.appendChild(p);
        }
      })();

      const save = loadGame();
      const stats = getGameStats();
      const board = boardGet();

      // Show stats if player has history
      if (stats.gamesPlayed > 0 || board.length > 0) {
        document.getElementById('welcomeStats').style.display = 'grid';
        document.getElementById('wsBestScore').textContent = stats.bestScore || (board.length ? board[0].score : 0);
        document.getElementById('wsGamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('wsBestLevel').textContent = stats.bestLevel;
      }

      // Versão dinâmica — lê version.json para manter label sempre atualizado
      fetch('/version.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(({ version }) => {
          const el = document.getElementById('welcomeVersionLabel');
          if (el) el.textContent = 'v' + version;
          const lndEl = document.getElementById('landingVersionLabel');
          if (lndEl) lndEl.textContent = 'v' + version;
        })
        .catch(() => {});

      refreshWelcomeSave();
    }

    // ── IDENTITY CHOOSER ────────────────────────────────────────────────────
    function _getIdentity() { return localStorage.getItem(IDENTITY_KEY); }

    function _showIdentityChooser() {
      if (_getIdentity()) return;
      const overlay = document.createElement('div');
      overlay.id = 'identityOverlay';
      overlay.className = 'identity-overlay';
      overlay.innerHTML = `
        <div class="identity-modal" role="dialog" aria-modal="true" aria-labelledby="identityTitle">
          <div class="identity-ornament">&#10022; Reino dos Néfrons &#10022;</div>
          <h2 class="identity-title" id="identityTitle">Como você chega hoje?</h2>
          <p class="identity-sub">Sua escolha define o ponto de partida. Você pode mudar quando quiser nas configurações.</p>
          <div class="identity-paths">
            <button class="identity-path study" data-action="_pickIdentity" data-arg="study">
              <span class="identity-path-icon">📖</span>
              <span class="identity-path-name">Estudar</span>
              <span class="identity-path-desc">Revisar tópicos, trilhas temáticas e desafios rápidos</span>
            </button>
            <button class="identity-path combat" data-action="_pickIdentity" data-arg="combat">
              <span class="identity-path-icon">⚔️</span>
              <span class="identity-path-name">Combater</span>
              <span class="identity-path-desc">Avançar na jornada, subir de nível e derrotar o Arqui-Nefromante</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('visible'));
    }

    window._pickIdentity = function(v) {
      localStorage.setItem(IDENTITY_KEY, v);
      const overlay = document.getElementById('identityOverlay');
      if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
      }
      if (v === 'study') {
        playSound('click');
        setTimeout(() => showTopicSelector().catch(err => console.error('showTopicSelector:', err)), 350);
      } else {
        playSound('click');
      }
    };

    function refreshWelcomeSave() {
      const save = loadGame();
      const savedInfoEl = document.getElementById('welcomeSavedInfo');
      const continueBtn = document.getElementById('welcomeContinueBtn');
      if (save && save.character && save.lives > 0) {
        if (continueBtn) continueBtn.style.display = 'block';
        const charData = characters[save.character];
        const charName = charData ? charData.name : 'Desconhecido';
        document.getElementById('wsSavedChar').textContent = charName;
        document.getElementById('wsSavedLevel').textContent = save.level || 1;
        document.getElementById('wsSavedLives').textContent = '❤'.repeat(save.lives || 0);
        document.getElementById('wsSavedScore').textContent = save.score || 0;
        document.getElementById('wsSavedTime').textContent = getTimeAgo(save.timestamp) || '';
        if (charData) {
          const ext = save.character === 'glomerulus' ? 'png' : 'jpg';
          const lvNum = Math.min(10, Math.max(1, save.level || 1));
          document.getElementById('wsSavedAvatar').src = `assets/classes/${charData.folder}/nivel_${String(lvNum).padStart(2,'0')}.${ext}?v=11.98`;
          document.getElementById('wsSavedAvatar').alt = charName;
        }
        if (savedInfoEl) {
          savedInfoEl.style.display = 'block';
          savedInfoEl.style.opacity = '1';
        }
      } else {
        if (savedInfoEl) savedInfoEl.style.display = 'none';
        if (continueBtn) continueBtn.style.display = 'none';
      }
    }

    
    function dismissWelcome() {
      _track('game_started', { difficulty: state.difficulty || 'normal', character: state.selectedCharacter });
      const ws = document.getElementById('welcomeScreen');
      ws.style.opacity = '0';
      ws.style.transition = 'opacity 0.5s';
      // Esconder welcome screen após 500ms (transição visual)
      setTimeout(() => {
        ws.classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('actionDock').classList.remove('hidden');
      }, 500);
      // Para welcome music imediatamente (cancela qualquer play() pendente via _wmStopRequested)
      // e inicia bg music no contexto de gesto do usuário (sem delay de callback)
      stopWelcomeMusic(false);
      if (musicEnabled && !musicStarted) startBgMusic();
    }
    
    async function continueGame() {
      // Revalida premium do servidor a cada sessão — impede bypass via localStorage
      _loadPremiumFromDB().catch(() => {});

      const save = loadGame();
      if (!save) { startNewFromWelcome(); return; }

      if (!questionBank) {
        _toast('Carregando questões…', 'info', 30000);
        try {
          await _loadTopics();
          document.querySelector('.nq-toast')?.remove();
        } catch {
          _toast('Erro ao carregar questões. Recarregue a página.', 'error', 5000);
          return;
        }
      }

      if (restoreGame(save)) {
        dismissWelcome();
        ui.journal.innerHTML = '';
        log(`🔄 Jornada restaurada! ${characters[state.character].name}, Nível ${state.level}.`);
        renderHUD();
        updateBadges();
        renderQuestion();
        // Se retomou no Confronto Final, ativa o modo boss imediatamente
        updateBossUI();
        applyBossOptionBadges();
        playSound('click');
      } else {
        startNewFromWelcome();
      }
    }
    
    function startNewFromWelcome() {
      playSound('click');
      // Mostra seletor de dificuldade sem fechar a welcome ainda
      // O confirm button do overlay faz dismissWelcome + deleteSave
      showNewGameConfirm(true /* fromWelcome */);
    }
    
    function showLeaderboardFromWelcome() {
      playSound('click');
      renderBoard().catch(() => {});
      ui.boardModal.classList.remove('hidden');
    }

    // Data loaded from data/refs.js

    // Artigos de nefrologia para os baús
    // Data loaded from data/articles.js
    
    // Estado dos baús desbloqueados
    let unlockedArticles = (() => { try { return JSON.parse(localStorage.getItem('unlockedArticles') || '[]'); } catch(e) { return []; } })();

    // Data loaded from data/topics.js
    const items = {
      helmet:[
        {n:"Touca Plissada",rar:"common",atk:0,def:1,kno:1,luck:0},
        {n:"Máscara Tripla",rar:"common",atk:0,def:2,kno:0,luck:1},
        {n:"Viseira Facial",rar:"common",atk:0,def:1,kno:0,luck:1},
        {n:"Gorro de CTI",rar:"rare",atk:0,def:3,kno:1,luck:1},
        {n:"Máscara N95",rar:"epic",atk:0,def:5,kno:2,luck:1},
        {n:"Elmo do Filtrador Supremo",rar:"legendary",atk:5,def:5,kno:10,luck:3}
      ],
      glove:[
        {n:"Luvas de Látex Reforçadas",rar:"common",atk:1,def:2,kno:0,luck:0},
        {n:"Luvas Nitrílicas",rar:"common",atk:0,def:1,kno:0,luck:1},
        {n:"Luva Estéril de Cirurgia",rar:"rare",atk:2,def:2,kno:1,luck:1},
        {n:"Manopla de Diálise",rar:"epic",atk:3,def:4,kno:2,luck:1},
        {n:"Manoplas da Homeostase",rar:"legendary",atk:5,def:5,kno:4,luck:3}
      ],
      armor:[
        {n:"Jaleco de Plantão",rar:"common",atk:0,def:2,kno:1,luck:0},
        {n:"Avental Protetor",rar:"common",atk:0,def:1,kno:1,luck:1},
        {n:"Manto Renocortical",rar:"rare",atk:1,def:4,kno:2,luck:1},
        {n:"Égide Dialítica",rar:"epic",atk:2,def:7,kno:3,luck:1},
        {n:"Armadura Primeva",rar:"legendary",atk:3,def:11,kno:4,luck:2},
        {n:"Armadura da Homeostase Perfeita",rar:"legendary",atk:4,def:12,kno:5,luck:3}
      ],
      weapon:[
        {n:"Bisturi de Plantão",rar:"common",atk:1,def:0,kno:1,luck:0},
        {n:"Lâmina da Alça",rar:"common",atk:2,def:0,kno:1,luck:0},
        {n:"Estilete Tubular",rar:"common",atk:2,def:1,kno:0,luck:0},
        {n:"Lança Glomerular",rar:"rare",atk:4,def:1,kno:2,luck:1},
        {n:"Espada Nefroprotetora",rar:"epic",atk:7,def:2,kno:3,luck:2},
        {n:"Excalibur do Néfron",rar:"legendary",atk:11,def:3,kno:4,luck:3},
        {n:"Cetro do Néfron Eterno",rar:"legendary",atk:12,def:2,kno:5,luck:4}
      ],
      relic:[
        {n:"Anel Albuminúrico",rar:"common",atk:0,def:0,kno:2,luck:1},
        {n:"Estetoscópio Básico",rar:"common",atk:0,def:1,kno:2,luck:0},
        {n:"Prancheta Clínica",rar:"common",atk:1,def:0,kno:2,luck:0},
        {n:"Termômetro Digital",rar:"common",atk:0,def:0,kno:1,luck:2},
        {n:"Sigilo KDIGO",rar:"rare",atk:1,def:1,kno:4,luck:1},
        {n:"Orbe da Cistatina",rar:"epic",atk:2,def:2,kno:6,luck:2},
        {n:"Relíquia do Título",rar:"legendary",atk:3,def:3,kno:8,luck:4},
        {n:"Amuleto do Rim Imortal",rar:"legendary",atk:4,def:4,kno:9,luck:5},
        {n:"Ressurreição Plena",rar:"mythic",atk:3,def:3,kno:7,luck:4}
      ],
      boot:[
        {n:"Propés Descartáveis",rar:"common",atk:0,def:1,kno:0,luck:1},
        {n:"Galocha de CTI",rar:"common",atk:0,def:2,kno:0,luck:0},
        {n:"Tamanco Hospitalar",rar:"rare",atk:0,def:3,kno:0,luck:2},
        {n:"Botas da Pressão Controlada",rar:"epic",atk:1,def:6,kno:2,luck:2},
        {n:"Botas do Caminho Saudável",rar:"legendary",atk:2,def:9,kno:3,luck:4}
      ]
    };

    const rarityWeight=["common","common","common","rare","rare","epic","legendary"];
    const rarityPower={common:1,rare:2,epic:3,legendary:4};

    function buildDeck() {
      const deck=[];
      for(let i=0;i<topics.length;i++){
        const t=topics[i];
        const d=t.diff==='hard'?Math.min(12,8+Math.floor(i/30)):Math.min(12,4+Math.floor(i/25));
        // Usar campos completos: opts, ans, exp (não abreviados)
        const opts = t.opts || t.o || [];
        const ans  = (t.ans !== undefined) ? t.ans : (t.a !== undefined ? t.a : 0);
        const exp  = t.exp || t.e || '';
        // Shuffle desabilitado (Fase 1): 259 explicações referenciam "alternativa A/B/C/D"
        // que ficariam incorretas após o embaralhamento. Reativar quando as
        // explicações forem reescritas para referenciar o conteúdo, não a letra.
        deck.push({id:t.qid||(String(i+1)),d,_d:t.diff||t.d||'medium',q:t.q,o:opts,a:ans,e:exp,r:t.refs||t.r||[],c:t.cat||t.c||'geral'});
      }
      return deck;
    }

    let questionBank = null;
    let _questionStartTime = 0;


    // ── Lazy loading do topics.js (1.4 MB) ─────────────────────────────────
    let _topicsPromise = null;
    function _loadTopics() {
      if (questionBank) return Promise.resolve();
      if (_topicsPromise) return _topicsPromise;
      _topicsPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'data/topics.js';
        s.onload  = () => {
          questionBank = buildDeck();
          HISTORY_SIZE = Math.max(30, Math.floor(questionBank.length * 0.20));
          syncMasteredToDetailedStats();
          resolve();
        };
        s.onerror = () => reject(new Error('Falha ao carregar questões'));
        document.head.appendChild(s);
      });
      return _topicsPromise;
    }
    window._loadTopics = _loadTopics;
    // Inicia download no primeiro toque — head start antes do usuário clicar em jogar
    document.addEventListener('pointerdown', () => _loadTopics().catch(() => {}),
      { once: true, passive: true });
    // ────────────────────────────────────────────────────────────────────────

    // Definições de Personagens
    const characters = {
      nephros: {
        id: 'nephros',
        name: 'Dr. Nephros',
        title: 'Guardião dos Néfrons',
        folder: 'clerigo_renal',
        bonusAtk: 0, bonusDef: 0, bonusKno: 2, bonusLuck: 0
      },
      aquaria: {
        id: 'aquaria',
        name: 'Dra. Aquaria',
        title: 'Mestra das Águas',
        folder: 'maga_metabolica',
        bonusAtk: 0, bonusDef: 2, bonusKno: 0, bonusLuck: 0
      },
      glomerulus: {
        id: 'glomerulus',
        name: 'Dr. Glomerulus',
        title: 'Cientista Renal',
        folder: 'guerreiro_glomerular',
        bonusAtk: 2, bonusDef: 0, bonusKno: 1, bonusLuck: 0
      }
    };

    // ============ STATE — Schema centralizado ============
    // Ao adicionar campos: 1) adicione aqui  2) incremente SAVE_SCHEMA_VERSION
    //                      3) adicione migração em _migrateSave()
    //
    // Campo              Tipo          Descrição
    // ─────────────────────────────────────────────────────
    // level              number        Nível atual do jogador (1–∞)
    // xp                 number        XP acumulado no nível atual
    // xpToNext           number        XP necessário para o próximo nível
    // score              number        Pontuação total da sessão
    // lives              number        Vidas restantes
    // maxLives           number        Vidas máximas (ajustado por dificuldade)
    // streak             number        Sequência atual de acertos
    // gold               number        Ouro acumulado
    // difficulty         string        'easy'|'normal'|'hard'|'hardcore'
    // legendaryAbilityUsed object      Habilidades lendárias usadas (por equipamento)
    // current            object|null   Questão atual renderizada
    // answered           boolean       Se a questão atual já foi respondida
    // queue              array         Fila de questões embaralhadas
    // idx                number        Índice na fila
    // bonusUses          number        Usos de pergunta bônus restantes
    // correctTotal       number        Total de acertos corretos acumulados
    // narrativeShown     number        Último checkpoint narrativo exibido
    // bossIntroShown     boolean       Se o popup de intro do boss já foi exibido
    // gameOver           boolean       Se o jogo terminou (sem vidas)
    // bossLog            array         Log de eventos da batalha final
    // gameStarted        boolean       Se o jogo foi iniciado
    // chestsOpened       number        Total de baús abertos na sessão
    // character          string|null   ID do personagem selecionado
    // equipment          object        Slots weapon/armor/relic com atributos
    // selectedCharacter  string|null   Alias de character (usado em alguns fluxos)
    // hp/maxHp           number        HP do boss (usado em boss mode)
    // ─────────────────────────────────────────────────────
    // A2: Reactive state store — Proxy auto-invalidates stats cache and
    // debounces saveGame() 500 ms after the last mutation, so rapid bursts
    // (Object.assign, level-up sequences) collapse into a single write.
    let _autoSaveTimer = null;
    const _stateData = {
      level:1,xp:0,xpToNext:200,score:0,lives:3,maxLives:3,streak:0,gold:0,difficulty:"normal",legendaryAbilityUsed:{},
      current:null,answered:false,queue:[],idx:0,bonusUses:0,
      correctTotal:0, narrativeShown:0, bossIntroShown:false, battleFinalShown:false, gameOver:false, bossLog:[],
      gameStarted: false, chestsOpened:0, obtainedItems:[], allItemsCollectedNotified:false,
      chestCorrectCount:0,
      chestTarget: Math.floor(Math.random() * 3) + 5,
      character: null,
      equipment:{
        helmet:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        glove:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        armor:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        weapon:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        relic:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        boot:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0}
      }
    };
    const state = new Proxy(_stateData, {
      set(target, key, value) {
        target[key] = value;
        _invalidateStatsCache();
        clearTimeout(_autoSaveTimer);
        _autoSaveTimer = setTimeout(saveGame, 500);
        return true;
      }
    });

    const $=id=>document.getElementById(id);
    // Escapa caracteres HTML para evitar XSS em innerHTML com dados dinâmicos

    // ── Study-mode helpers ──────────────────── js/study-mode.js ──

    const ui={
      heroImg:$("heroImg"),heroClass:$("heroClass"),heroTitle:$("heroTitle"),xpFill:$("xpFill"),xpTxt:$("xpTxt"),
      storyTitle:$("storyTitle"),storyGoal:$("storyGoal"),
      level:$("level"),score:$("score"),lives:$("lives"),record:$("record"),gold:$("gold"),streak:$("streak"),
      equipList:$("equipList"),journal:$("journal"),question:$("question"),options:$("options"),feedback:$("feedback"),refs:$("refs"),
      oraculoBtn:$("oraculoBtn"),nextBtn:$("nextBtn"),newBtn:$("newBtn"),forgeBtn:$("forgeBtn"),bonusBtn:$("bonusBtn"),boardBtn:$("boardBtn"),
      boardModal:$("boardModal"),boardBody:$("boardBody"),closeBoard:$("closeBoard"),
      dockForgeBtn:$("forgeBtn"),dockChestBtn:$("chestBtn"),dockLegBtn:$("legendaryForgeBtn"),dockChestCost:$("chestCostBadge"),actionDock:$("actionDock"),
      dockNextBtn:$("dockNextBtn")
    };

    // === SUPABASE LEADERBOARD ===

    // ── Leaderboard ──────────────────────────── js/leaderboard.js ──
    const best = () => { const s = getGameStats(); return s.bestScore || 0; };

    function log(m){const p=document.createElement('p');p.textContent=m;ui.journal.prepend(p);while(ui.journal.children.length>4)ui.journal.lastChild.remove()}
    function total(){
      // Durante stun do boss, equipamentos ficam paralisados — apenas bônus do personagem contam
      const base = state.bossStunActive
        ? {atk:0, def:0, kno:0, luck:0}
        : Object.values(state.equipment).reduce((a,i)=>(a.atk+=i.atk,a.def+=i.def,a.kno+=i.kno,a.luck+=i.luck,a),{atk:0,def:0,kno:0,luck:0});
      if(state.character && characters[state.character]){
        const c=characters[state.character];
        base.atk+=c.bonusAtk||0; base.def+=c.bonusDef||0;
        base.kno+=c.bonusKno||0; base.luck+=c.bonusLuck||0;
      }
      return base;
    }
    function legendaryCount(){return Object.values(state.equipment).filter(i=>i.rar==='legendary').length;}

    function heroMeta(){
      // Títulos personalizados por personagem com gênero correto
      const charTitles = {
        nephros: {
          16: ["Arquimago do Néfron", '', 'l5', "O Soberano da Homeostase"],
          12: ["Lenda Cardiorrenal", '', 'l4', "O Mestre do Equilíbrio Vital"],
          8:  ["Mestre das Glomerulopatias", '', 'l3', "O Guardador dos Glomérulos"],
          5:  ["Guardião da Nefroproteção", '', 'l2', "O Defensor dos Néfrons"],
          3:  ["Sacerdote Renal", '', 'l1', "O Curandeiro dos Túbulos"],
          1:  ["Noviço da Filtração", '', '', "O Iniciante das Águas"]
        },
        aquaria: {
          16: ["Arquimaga do Néfron", '', 'l5', "A Soberana da Homeostase"],
          12: ["Lenda Cardiorrenal", '', 'l4', "A Mestra do Equilíbrio Vital"],
          8:  ["Mestra das Glomerulopatias", '', 'l3', "A Guardiã dos Glomérulos"],
          5:  ["Guardiã da Nefroproteção", '', 'l2', "A Defensora dos Néfrons"],
          3:  ["Sacerdotisa das Águas", '', 'l1', "A Curandeira dos Túbulos"],
          1:  ["Noviça da Filtração", '', '', "A Iniciante das Águas"]
        },
        glomerulus: {
          16: ["Arquicientista do Néfron", '', 'l5', "O Soberano da Ciência Renal"],
          12: ["Lenda da Pesquisa Renal", '', 'l4', "O Mestre da Análise Vital"],
          8:  ["Doutor das Glomerulopatias", '', 'l3', "O Decodificador dos Glomérulos"],
          5:  ["Pesquisador da Nefroproteção", '', 'l2', "O Investigador dos Néfrons"],
          3:  ["Cientista Renal Júnior", '', 'l1', "O Analista dos Túbulos"],
          1:  ["Estudante de Nefrologia", '', '', "O Aprendiz da Ciência Renal"]
        }
      };
      
      const charId = state.character || 'nephros';
      const titles = charTitles[charId] || charTitles.nephros;
      
      // Calcular imagem de evolução baseada no nível (1-10)
      const char = characters[charId];
      const evolutionLevel = Math.min(10, Math.max(1, state.level));
      const ext = charId === 'glomerulus' ? 'png' : 'jpg';
      const charImg = `assets/classes/${char.folder}/nivel_${evolutionLevel.toString().padStart(2,'0')}.${ext}?v=11.98`;
      
      // Subtítulo ÚNICO por nível (índice = nível; índice 0 não usado).
      // O rank (data[0]) continua por faixa; o subtítulo muda a cada nível.
      const charSubtitles = {
        nephros: ['',
          "O Iniciante das Águas","O Aprendiz dos Túbulos","O Curandeiro dos Túbulos",
          "O Zelador do Filtrado","O Defensor dos Néfrons","O Sentinela do Glomérulo",
          "O Guardião da Homeostase","O Guardador dos Glomérulos","O Protetor do Equilíbrio",
          "O Senhor da Filtração","O Arauto da Depuração","O Mestre do Equilíbrio Vital",
          "O Conselheiro dos Rins","O Sábio da Nefroproteção","O Soberano da Homeostase"],
        aquaria: ['',
          "A Iniciante das Águas","A Aprendiz das Marés","A Curandeira dos Túbulos",
          "A Canalizadora do Sódio","A Defensora dos Néfrons","A Domadora dos Eletrólitos",
          "A Tecelã do Equilíbrio","A Guardiã dos Glomérulos","A Senhora das Marés Renais",
          "A Feiticeira da Osmolaridade","A Arauta da Diurese","A Mestra do Equilíbrio Vital",
          "A Vidente do Potássio","A Sábia da Homeostase","A Soberana da Homeostase"],
        glomerulus: ['',
          "O Aprendiz da Ciência Renal","O Estudante dos Glomérulos","O Analista dos Túbulos",
          "O Investigador da Creatinina","O Investigador dos Néfrons","O Decifrador da Proteinúria",
          "O Estrategista da TFG","O Decodificador dos Glomérulos","O Erudito da Função Renal",
          "O Mestre dos Biomarcadores","O Arauto da Evidência","O Mestre da Análise Vital",
          "O Pioneiro da Nefrologia","O Sábio da Ciência Renal","O Soberano da Ciência Renal"]
      };
      const subs = charSubtitles[charId] || charSubtitles.nephros;
      const lvSubtitle = subs[Math.min(Math.max(1, state.level | 0), subs.length - 1)];

      let chosen = titles[1];
      for(const [lv, data] of Object.entries(titles).sort((a,b) => b[0]-a[0])) {
        if(state.level >= parseInt(lv)) { chosen = data; break; }
      }
      chosen[1] = charImg;
      if (lvSubtitle) chosen[3] = lvSubtitle;
      return chosen;
    }

    // Capítulos baseados em level (1-10) — Atualiza a narrativa conforme sobe de nível.
    const chapters = [
      { lvl:1, title:"Prólogo — O Chamado das Águas",            goal:"Domine os fundamentos da nefrologia e sobreviva às primeiras cartas da jornada." },
      { lvl:2, title:"Capítulo I — As Criptas da Creatinina",    goal:"Interprete função renal, creatinina e os marcadores básicos de lesão." },
      { lvl:3, title:"Capítulo II — O Vale da Albuminúria",      goal:"Consolide a estratificação de risco renal e a terapia nefroprotetora essencial." },
      { lvl:4, title:"Capítulo III — Torre das Glomerulopatias", goal:"Domine os sinais de gravidade glomerular e decisões de intervenção com precisão." },
      { lvl:5, title:"Capítulo IV — O Deserto da Diálise",       goal:"Entenda diálise, clearance, Kt/V e adequação terapêutica." },
      { lvl:6, title:"Capítulo V — Trono Cardiorrenal",          goal:"Integre as terapias do eixo cardiorrenal e a nefrologia avançada." },
      { lvl:7, title:"Capítulo Final — O Arqui-Nefromante",      goal:"Alcance o domínio supremo da nefrologia e derrote o Arqui-Nefromante." }
    ];

    function chapterMeta(){
      let current=chapters[0];
      for(const c of chapters){ if((state.level||1)>=c.lvl) current=c; }
      return current;
    }

    const itemIcons = {
      // Armas
      'Bisturi de Plantão':            'assets/items/bisturi_plantao.png',
      'Lâmina da Alça':                'assets/items/lamina_alca.png',
      'Estilete Tubular':              'assets/items/estilete_tubular.png',
      'Lança Glomerular':              'assets/items/lanca_glomerular.png',
      'Espada Nefroprotetora':         'assets/items/espada_nefroprotetora.png',
      'Excalibur do Néfron':           'assets/items/excalibur_nefron.png',
      'Cetro do Néfron Eterno':        'assets/items/cetro_nefron.png',
      // Armaduras
      'Jaleco de Plantão':             'assets/items/jaleco_plantao.png',
      'Avental Protetor':              'assets/items/avental_protetor.png',
      'Manto Renocortical':            'assets/items/manto_renocortical.png',
      'Égide Dialítica':               'assets/items/egide_dialitica.png',
      'Armadura Primeva':              'assets/items/armadura_primeva.png',
      'Armadura da Homeostase Perfeita':'assets/items/armadura_homeostase_perfeita.png',
      // Relíquias
      'Anel Albuminúrico':             'assets/items/anel_albuminurico.png',
      'Estetoscópio Básico':           'assets/items/estetoscopio_basico.png',
      'Prancheta Clínica':             'assets/items/prancheta_clinica.png',
      'Termômetro Digital':            'assets/items/termometro_digital.png',
      'Sigilo KDIGO':                  'assets/items/sigilo_kdigo.png',
      'Orbe da Cistatina':             'assets/items/orbe_cistatina.png',
      'Relíquia do Título':            'assets/items/reliquia_titulo.png',
      'Amuleto do Rim Imortal':        'assets/items/amuleto_rim.png',
      // Capacetes (Elmos / Máscaras)
      'Touca Plissada':                'assets/items/touca_plissada.png',
      'Máscara Tripla':                'assets/items/mascara_tripla.png',
      'Viseira Facial':                'assets/items/viseira_facial.png',
      'Gorro de CTI':                  'assets/items/gorro_cti.png',
      'Máscara N95':                   'assets/items/mascara_n95.png',
      'Elmo do Filtrador Supremo':     'assets/items/elmo_filtrador_supremo.png',
      // Luvas
      'Luvas de Látex Reforçadas':     'assets/items/luvas_latex_reforcadas.png',
      'Luvas Nitrílicas':              'assets/items/luvas_nitrilicas.png',
      'Luva Estéril de Cirurgia':      'assets/items/luva_esteril_cirurgia.png',
      'Manopla de Diálise':            'assets/items/manopla_dialise.png',
      'Manoplas da Homeostase':        'assets/items/manopla_homeostase.png',
      // Botas
      'Propés Descartáveis':           'assets/items/propes_descartaveis.png',
      'Galocha de CTI':                'assets/items/galocha_cti.png',
      'Tamanco Hospitalar':            'assets/items/tamanco_hospitalar.png',
      'Botas da Pressão Controlada':   'assets/items/botas_pressao_controlada.png',
      'Botas do Caminho Saudável':     'assets/items/botas_caminho_saudavel.png'
    };
    const itemDescriptions = {
      "Bisturi de Plantão": "O bisturi básico de todo interno. Com ele, você corta através da confusão clínica e inicia sua jornada na nefrologia.",
      "Lâmina da Alça": "Forjada na Alça de Henle, esta arma canaliza o poder da concentração urinária para atacar os males renais.",
      "Lança Glomerular": "Imbuída com a força dos glomérulos, perfura as barreiras da doença com precisão cirúrgica.",
      "Espada Nefroprotetora": "Uma lâmina lendária que corta através da fibrose e protege os néfrons da destruição.",
      "Excalibur do Néfron": "A arma suprema dos guardiões renais. Apenas os mais sábios podem empunhar seu poder de cura absoluta.",
      "Túnica de Residência": "O manto básico de todo residente. Oferece proteção mínima, mas representa o início da jornada.",
      "Jaleco de Plantão": "Testado em incontáveis plantões, absorve o cansaço e protege contra os golpes da exaustão.",
      "Manto Renocortical": "Tecido com fibras do córtex renal, oferece defesa contra toxinas e agressões metabólicas.",
      "Égide Dialítica": "Armadura forjada nas chamas da diálise. Purifica ataques tóxicos antes que atinjam seu portador.",
      "Armadura Primeva": "A armadura ancestral dos Nefromantes. Concede imunidade contra todas as formas de injúria renal aguda.",
      "Armadura da Homeostase Perfeita": "A armadura suprema dos mestres da nefrologia. Forjada com cristais de equilíbrio eletrolítico, mantém a homeostase perfeita em qualquer batalha.",
      "Insígnia do Plantão": "Um símbolo de dedicação médica. Aumenta o conhecimento através da experiência clínica diária.",
      "Anel Albuminúrico": "Detecta a presença de proteinúria no ar. Quanto maior a albuminúria, mais brilha sua gema.",
      "Sigilo KDIGO": "Selo sagrado das diretrizes KDIGO. Concede sabedoria ancestral sobre manejo de doença renal crônica.",
      "Orbe da Cistatina": "Uma esfera cristalina que mede a verdadeira filtração glomerular. Revela segredos ocultos da função renal.",
      "Relíquia do Título": "O cálice sagrado dos nefrologistas titulados. Concede maestria absoluta sobre todos os mistérios renais.",
      // Novos itens
      "Touca Plissada": "Proteção básica para os cabelos, mantendo o campo de batalha livre de contaminação.",
      "Máscara Tripla": "Filtração bacteriana simples contra gotículas infecciosas e névoas de toxinas.",
      "Viseira Facial": "Barreira física transparente que protege os olhos e o rosto de respingos biológicos.",
      "Gorro de CTI": "Gorro confortável e higiênico, usado por médicos em ambientes críticos.",
      "Máscara N95": "A barreira máxima contra aerossóis. Filtra 95% das partículas e ameaças aéreas.",
      "Elmo do Filtrador Supremo": "Elmo glorioso que aumenta drasticamente a taxa de filtração de recursos.",
      "Luvas de Látex Reforçadas": "Luvas flexíveis e aderentes, fornecendo excelente tato e destreza cirúrgica básica.",
      "Luvas Nitrílicas": "Luvas azuis resistentes e livres de látex, ideais para pacientes com alergias.",
      "Luva Estéril de Cirurgia": "Garante assepsia absoluta durante os procedimentos nefrológicos mais delicados.",
      "Manopla de Diálise": "Canaliza os fluxos de purificação diretamente nas mãos do portador.",
      "Manoplas da Homeostase": "Lendárias manoplas que controlam o equilíbrio de fluidos e eletrólitos com um toque.",
      "Propés Descartáveis": "Sapatilhas que cobrem os calçados para não levar impurezas ao templo da saúde.",
      "Galocha de CTI": "Calçado de borracha ultra resistente, impermeável a fluidos corporais e poções.",
      "Tamanco Hospitalar": "Ergonômico e lavável, ideal para longas caminhadas nas enfermarias.",
      "Botas da Pressão Controlada": "Equipadas com sensores que mantêm a circulação e o foco ideais sob pressão.",
      "Botas do Caminho Saudável": "Calçado sagrado que guia o médico e o paciente rumo à reabilitação renal completa."
    };
    const slotLabels = { helmet: 'Capacete', glove: 'Luva', armor: 'Armadura', weapon: 'Arma', relic: 'Relíquia', boot: 'Bota' };
    const defaultIcons = {
      helmet: 'assets/images/elmo_filtrador.png',
      glove: 'assets/images/luvas_latex.png',
      armor: 'assets/items/egide_dialitica.jpg',
      weapon: 'assets/items/caneta_interno.jpg',
      relic: 'assets/items/insignia_plantao.jpg',
      boot: 'assets/items/jaleco_plantao.jpg'
    };

    function getItemIcon(itemName, slotName) {
      if (!itemName || itemName === 'Vazio') return '';
      let icon = itemIcons[itemName] || defaultIcons[slotName] || '';
      if (slotName === 'armor' && icon) {
        const _charId = state.character || (state.selectedCharacter) || 'glomerulus';
        if (_charId === 'aquaria') {
          // Resolve a versão feminina da armadura substituindo a extensão
          icon = icon.replace(/\.(png|jpg|jpeg)$/, '_female.$1');
        }
      }
      return icon;
    }
    // Ícones TEMPORÁRIOS (emoji) para capacete/luva/bota sem arte própria —
    // evita imagem repetida/inadequada (ex.: bota usando a imagem do jaleco)
    // enquanto as imagens reais não são criadas. Mantém a arte só nos itens
    // cujo nome casa com a imagem existente. Ver ROADMAP "Arte de Equipamentos".
    const _TEMP_SLOT_EMOJI = { helmet: '⛑️', glove: '🧤', boot: '🥾' };
    const _ITEMS_KEEP_ART = new Set(['Elmo do Filtrador Supremo', 'Luvas de Látex Reforçadas']);
    // Equipamento inicial PADRÃO, ESPECÍFICO POR PERSONAGEM: os slots começam
    // visualmente "equipados" com gear gasto temático da classe (em vez do "?"),
    // com tooltip só do nome. Logicamente o slot continua vazio — a 1ª forja
    // substitui sem popup ("vai trocando"). Sem efeito em stats.
    // Propriedade 'img': caminho para arte real; 'e': emoji fallback.
    const STARTER_SETS = {
      glomerulus: { // Cientista Renal — guerreiro/cirurgião
        helmet: { n: 'Óculos de Proteção Simples', e: '👓', img: 'assets/items/starter/glom_helmet.png' },
        glove:  { n: 'Luvas de Látex Estéreis',    e: '🧤', img: 'assets/items/starter/glom_glove.png' },
        armor:  { n: 'Jaleco de Estudante',        e: '🥼', img: 'assets/items/starter/glom_armor.png' },
        weapon: { n: 'Bisturi de Luz Descalibrado', e: '🔪', img: 'assets/items/starter/glom_weapon.png' },
        relic:  { n: 'Crachá de Estudante',        e: '📛', img: 'assets/items/starter/glom_relic.png' },
        boot:   { n: 'Tênis de Plantão Confortável', e: '👟', img: 'assets/items/starter/glom_boot.png' },
      },
      aquaria: { // Mestra das Águas — maga metabólica (feminina)
        helmet: { n: 'Tiara de Linho Úmida',     e: '💧', img: 'assets/items/starter/aqua_helmet.png' },
        glove:  { n: 'Luvas de Seda Puídas',     e: '🧤', img: 'assets/items/starter/aqua_glove.png' },
        armor:  { n: 'Túnica Encharcada',        e: '🧥', img: 'assets/items/starter/aqua_armor.png' },
        weapon: { n: 'Cetro de Fluxo Simples',   e: '🪄', img: 'assets/items/starter/aqua_weapon.png' },
        relic:  { n: 'Frasco de Essência Vazio', e: '🔮', img: 'assets/items/starter/aqua_relic.png' },
        boot:   { n: 'Sandálias Surradas',       e: '👡', img: 'assets/items/starter/aqua_boot.png' },
      },
      nephros: { // Guardião dos Néfrons — clérigo/erudito
        helmet: { n: 'Capuz Puído',              e: '🧢', img: 'assets/items/starter/neph_helmet.png' },
        glove:  { n: 'Luvas de Lã Furadas',      e: '🧤', img: 'assets/items/starter/neph_glove.png' },
        armor:  { n: 'Manto de Noviço',          e: '🥋', img: 'assets/items/starter/neph_armor.png' },
        weapon: { n: 'Martelo de Reflexo Gasto', e: '🔨', img: 'assets/items/starter/neph_weapon.png' },
        relic:  { n: 'Manuscrito de Noviço',     e: '📜', img: 'assets/items/starter/neph_relic.png' },
        boot:   { n: 'Sandálias de Couro Gastas', e: '🥾', img: 'assets/items/starter/neph_boot.png' },
      },
    };

    const statTips = {
      atk: {icon:'⚔️', name:'Ataque', desc:'Aumenta pontos ganhos por acerto. Quanto maior, mais pontos por questão correta.'},
      def: {icon:'🛡️', name:'Defesa', desc:'Chance de bloquear perda de vida ao errar. DEF × 1.4% de chance de absorver o golpe.'},
      kno: {icon:'📚', name:'Conhecimento', desc:'Aumenta XP ganho por acerto. +1 XP extra por ponto de conhecimento.'},
      luck: {icon:'🍀', name:'Sorte', desc:'Aumenta ouro ganho e chance de itens raros na forja e drops.'}
    };

    // ── Galeria de Assets (admin) — audita TODAS as imagens do jogo ──────────
    function openAssetGallery() {
      if (typeof isAdminUser === 'function' && !isAdminUser()) return;
      document.getElementById('assetGalleryModal')?.remove();

      const rarMap = {
        common:    { label:'Comum',    color:'#94a3b8', bg:'rgba(148,163,184,0.10)', border:'rgba(148,163,184,0.35)' },
        rare:      { label:'Raro',     color:'#38bdf8', bg:'rgba(56,189,248,0.10)',  border:'rgba(56,189,248,0.45)' },
        epic:      { label:'Épico',    color:'#c084fc', bg:'rgba(192,132,252,0.10)', border:'rgba(192,132,252,0.45)' },
        legendary: { label:'Lendário', color:'#ffd700', bg:'rgba(255,215,0,0.10)',   border:'rgba(255,215,0,0.55)' }
      };
      // Títulos por nível (mesmos tiers de charTitles; níveis de evolução vão até 10)
      const charTiers = {
        nephros:    [[8,'Mestre das Glomerulopatias'],[5,'Guardião da Nefroproteção'],[3,'Sacerdote Renal'],[1,'Noviço da Filtração']],
        aquaria:    [[8,'Mestra das Glomerulopatias'],[5,'Guardiã da Nefroproteção'],[3,'Sacerdotisa das Águas'],[1,'Noviça da Filtração']],
        glomerulus: [[8,'Doutor das Glomerulopatias'],[5,'Pesquisador da Nefroproteção'],[3,'Cientista Renal Júnior'],[1,'Estudante de Nefrologia']]
      };
      const tierFor = (cid, lv) => { for (const [thr,name] of (charTiers[cid]||charTiers.nephros)) if (lv >= thr) return name; return ''; };
      const _imgTag = (src, alt) => `<img class="ag-img" src="${src}" alt="${alt}" loading="lazy" onerror="this.classList.add('ag-img-err');">`;

      let charsHtml = '';
      for (const cid of Object.keys(characters)) {
        const c = characters[cid];
        const ext = cid === 'glomerulus' ? 'png' : 'jpg';
        let cards = '';
        for (let lv = 1; lv <= 10; lv++) {
          const path = `assets/classes/${c.folder}/nivel_${String(lv).padStart(2,'0')}.${ext}`;
          cards += `<div class="ag-card">${_imgTag(path, c.name+' nível '+lv)}
            <div class="ag-card-body">
              <div class="ag-card-title">Nível ${lv}</div>
              <div class="ag-card-sub">${tierFor(cid, lv)}</div>
              <div class="ag-path">${path}</div>
            </div></div>`;
        }
        charsHtml += `<div class="ag-section">
          <h3 class="ag-h3">${c.name} — <span class="ag-dim">${c.title}</span></h3>
          <div class="ag-meta">pasta <code>${c.folder}</code> · ext <code>.${ext}</code> · bônus ATK ${c.bonusAtk} / DEF ${c.bonusDef} / CONH ${c.bonusKno} / SORTE ${c.bonusLuck}</div>
          <div class="ag-grid">${cards}</div></div>`;
      }

      let equipHtml = '';
      let totalItems = 0;
      for (const slot of ['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot']) {
        let cards = '';
        for (const it of items[slot]) {
          totalItems++;
          const path = itemIcons[it.n] || defaultIcons[slot] || '';
          const r = rarMap[it.rar] || rarMap.common;
          const desc = itemDescriptions[it.n] || '<span class="ag-nodesc">(sem descrição)</span>';
          const hasIcon = !!itemIcons[it.n];

          let imgHtml = '';
          let pathHtml = '';
          if (slot === 'armor' && path) {
            const femalePath = path.replace(/\.(png|jpg|jpeg)$/, '_female.$1');
            imgHtml = `
              <div class="ag-armor-imgs-container" style="display:flex; border-bottom:1px solid rgba(255,255,255,0.06);">
                <div style="flex:1; position:relative; border-right:1px solid rgba(255,255,255,0.06);">
                  ${_imgTag(path, it.n)}
                  <span style="position:absolute; bottom:2px; left:4px; font-size:9px; background:rgba(0,0,0,0.6); padding:1px 3px; border-radius:2px; color:#94a3b8;">Masc</span>
                </div>
                <div style="flex:1; position:relative;">
                  ${_imgTag(femalePath, it.n + ' (Feminina)')}
                  <span style="position:absolute; bottom:2px; left:4px; font-size:9px; background:rgba(0,0,0,0.6); padding:1px 3px; border-radius:2px; color:#c084fc;">Fem</span>
                </div>
              </div>`;
            pathHtml = `
              <div class="ag-path">Masc: ${path}${hasIcon ? '' : ' <span class="ag-nodesc">(padrão)</span>'}</div>
              <div class="ag-path" style="margin-top:2px; border-top:none; padding-top:0;">Fem: ${femalePath}${hasIcon ? '' : ' <span class="ag-nodesc">(padrão)</span>'}</div>`;
          } else {
            const displayPath = getItemIcon(it.n, slot);
            imgHtml = _imgTag(displayPath, it.n);
            pathHtml = `<div class="ag-path">${displayPath}${hasIcon ? '' : ' <span class="ag-nodesc">(ícone padrão)</span>'}</div>`;
          }

          cards += `<div class="ag-card" style="border-color:${r.border};">${imgHtml}
            <div class="ag-card-body">
              <div class="ag-card-title">${it.n}</div>
              <span class="ag-rar" style="color:${r.color};background:${r.bg};border-color:${r.border};">${r.label}</span>
              <div class="ag-stats">⚔️ ${it.atk} · 🛡️ ${it.def} · 📚 ${it.kno} · 🍀 ${it.luck}</div>
              <div class="ag-desc">${desc}</div>
              ${pathHtml}
            </div></div>`;
        }
        equipHtml += `<div class="ag-section">
          <h3 class="ag-h3">${slotLabels[slot]} <span class="ag-dim">(${items[slot].length})</span></h3>
          <div class="ag-grid">${cards}</div></div>`;
      }

      const modal = document.createElement('div');
      modal.id = 'assetGalleryModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.9);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding:20px 14px calc(env(safe-area-inset-bottom,0px)+40px);overflow-y:auto;box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-panel" style="max-width:940px;width:100%;margin:auto 0;">
          <button class="modal-panel-x" data-action="closeAssetGallery" aria-label="Fechar">&times;</button>
          <h2>🖼 Galeria de Assets (Admin)</h2>
          <p style="color:#8a9cc0;font-size:0.78rem;margin-bottom:18px;">Personagens (3 classes × 10 evoluções) e equipamentos (${totalItems} itens). Imagens ausentes aparecem destacadas em vermelho.</p>
          <h2 class="ag-section-h">⚔️ Personagens &amp; Evoluções</h2>
          ${charsHtml}
          <h2 class="ag-section-h">🛡 Equipamentos</h2>
          ${equipHtml}
          <div class="modal-actions" style="margin-top:18px;"><button data-action="closeAssetGallery" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button></div>
        </div>`;
      document.body.appendChild(modal);
      // (fechar-ao-clicar-fora removido — usa o X do painel)
    }
    function closeAssetGallery() { document.getElementById('assetGalleryModal')?.remove(); }
    window.openAssetGallery = openAssetGallery;
    window.closeAssetGallery = closeAssetGallery;
    const _ACTIVE_LEGS = new Set(['Excalibur do Néfron','Armadura Primeva','Amuleto do Rim Imortal','Relíquia do Título','Máscara N95','Ressurreição Plena','Espada Nefroprotetora','Orbe da Cistatina']);
    const _PASSIVE_LEGS = new Set(['Cetro do Néfron Eterno','Armadura da Homeostase Perfeita','Elmo do Filtrador Supremo','Égide Dialítica']);
    // PR C — itens com bônus passivo de +1 vida máxima. effectiveMaxLives() =
    // base (state.maxLives) + bônus do equipamento; usado só na exibição/limite
    // (NÃO no save/load, que guardam a base).
    const _LIFE_BONUS_ITEMS = new Set(['Égide Dialítica']);
    function _equipLifeBonus() {
      const eq = state.equipment || {};
      let bonus = 0;
      for (const slot in eq) { if (eq[slot] && _LIFE_BONUS_ITEMS.has(eq[slot].n)) bonus++; }
      return bonus;
    }
    function effectiveMaxLives() { return (state.maxLives || 3) + _equipLifeBonus(); }
    const _LEG_LABELS = {
      'Excalibur do Néfron':'⚔️ Anula 1 dano',
      'Armadura Primeva':'🛡️ Salva última vida',
      'Amuleto do Rim Imortal':'💜 Revive 1×',
      'Relíquia do Título':'📖 Pular 1 questão',
      'Cetro do Néfron Eterno':'💰 +30 ouro (streak≥5)',
      'Armadura da Homeostase Perfeita':'🛡️ DEF amplificado',
      'Elmo do Filtrador Supremo':'✨ +25% ouro sempre',
      'Máscara N95':'🧪 1º erro não tira vida',
      'Ressurreição Plena':'👑 Revive com vida cheia',
      'Espada Nefroprotetora':'🎯 50/50 em 1 difícil',
      'Orbe da Cistatina':'🔮 Dica do Oráculo (1 difícil)',
      'Égide Dialítica':'❤️ +1 vida máxima',
    };

    function renderEquip(){
      const st=total();
      const slotsHTML = ['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot'].map(k => {
        const v = state.equipment[k];
        const isEmpty = !v || v.n === 'Vazio';
        const icon = isEmpty ? '' : getItemIcon(v.n, k);
        const desc = isEmpty ? 'Slot vazio. Forje itens para equipar!' : (itemDescriptions[v.n] || '');
        const isActive = !isEmpty && _ACTIVE_LEGS.has(v.n);
        const isPassive = !isEmpty && _PASSIVE_LEGS.has(v.n);
        const wasUsed = !isEmpty && !!(state.legendaryAbilityUsed && state.legendaryAbilityUsed[v.n]);
        // Mantém o brilho lendário mesmo após usar.
        const glowCls = (!isEmpty && v.rar==='legendary') ? (isPassive ? 'legendary-passive' : (wasUsed ? 'legendary-used' : 'legendary-active')) : '';
        
        // Status inline (mesma linha do título, à direita): verde "(utilizar)"
        // antes de usar, vermelho "(usada)" depois. Só para lendárias ATIVAS.
        const statusInline = isActive
          ? (wasUsed
              ? `<span class='slot-ability-status used'>(usada)</span>`
              : `<span class='slot-ability-status ready'>(utilizar)</span>`)
          : '';
        // O que a habilidade faz vai para a legenda (tooltip), abaixo da descrição.
        const abilityLabel = (!isEmpty && (isActive || isPassive)) ? (_LEG_LABELS[v.n] || '') : '';
        const tipDesc = abilityLabel ? (desc ? `${desc} — ${abilityLabel}` : abilityLabel) : desc;
        
        const slotLabel = slotLabels[k] || k;
        
        let slotInnerHtml = '';
        if (isEmpty) {
          // Item inicial gasto (visual) temático da classe — tooltip só do nome.
          const _charId = state.character || (state.selectedCharacter) || 'glomerulus';
          const _set = STARTER_SETS[_charId] || STARTER_SETS.glomerulus;
          const _starter = _set[k] || { n: slotLabel, e: '?' };
          const _sName = _starter.n;
          const _sEmoji = _starter.e;
          const _sImg = _starter.img;
          // Usa imagem real se disponível, senão emoji fallback
          const _starterIcon = _sImg
            ? `<img class="slot-diablo-icon slot-starter-icon item-with-tooltip" loading="lazy" src="${_sImg}?v=11.98" alt="${escapeHtml(_sName)}" data-item-name="${escapeHtml(_sName)}" data-item-desc="" data-slot-label="${escapeHtml(slotLabel)}" onerror="this.outerHTML='<div class=\'slot-diablo-icon slot-temp-emoji slot-starter-icon item-with-tooltip\' data-item-name=\''+this.alt+'\' data-item-desc=\'\' data-slot-label=\'${escapeHtml(slotLabel)}\'>${_sEmoji}</div>'" />`
            : `<div class="slot-diablo-icon slot-temp-emoji slot-starter-icon item-with-tooltip" data-item-name="${escapeHtml(_sName)}" data-item-desc="" data-slot-label="${escapeHtml(slotLabel)}">${_sEmoji}</div>`;
          slotInnerHtml = `
            <div class="slot-diablo-filled slot-starter">
              ${_starterIcon}
            </div>`;
        } else {
          const _iconData = `data-item-name="${escapeHtml(v.n)}" data-item-desc="${escapeHtml(tipDesc)}" data-item-atk="${v.atk}" data-item-def="${v.def}" data-item-kno="${v.kno}" data-item-luck="${v.luck}" data-item-rarity="${v.rar}" data-slot-label="${escapeHtml(slotLabel)}"`;
          const _useTemp = _TEMP_SLOT_EMOJI[k] && !_ITEMS_KEEP_ART.has(v.n);
          const _iconEl = _useTemp
            ? `<div class="slot-diablo-icon slot-temp-emoji item-with-tooltip" ${_iconData}>${_TEMP_SLOT_EMOJI[k]}</div>`
            : `<img class="slot-diablo-icon item-with-tooltip" loading="lazy" src="${icon}" alt="${escapeHtml(v.n)}" ${_iconData} />`;
          slotInnerHtml = `
            <div class="slot-diablo-filled rar-border-${v.rar} ${glowCls}">
              ${_iconEl}
            </div>`;
        }
        
        const isDouble = (k === 'armor' || k === 'weapon') ? 'double' : 'relic';
        return `<div class="slot-diablo ${isDouble} ${isEmpty ? 'filled starter' : 'filled'}" data-slot="${k}">
          ${slotInnerHtml}
        </div>`;
      }).join('');

      const totalHTML = `<strong class='nq-text-gold'>Atributos Totais:</strong>
        <span class='stat-badge'>⚔️${st.atk}<span class='stat-tip'><strong>${statTips.atk.icon} ${statTips.atk.name}</strong><br>${statTips.atk.desc}</span></span>
        <span class='stat-badge'>🛡️${st.def}<span class='stat-tip'><strong>${statTips.def.icon} ${statTips.def.name}</strong><br>${statTips.def.desc}</span></span>
        <span class='stat-badge'>📚${st.kno}<span class='stat-tip'><strong>${statTips.kno.icon} ${statTips.kno.name}</strong><br>${statTips.kno.desc}</span></span>
        <span class='stat-badge'>🍀${st.luck}<span class='stat-tip'><strong>${statTips.luck.icon} ${statTips.luck.name}</strong><br>${statTips.luck.desc}</span></span>`;

      // Synergy banner when all 6 slots are legendary
      const _synergyActive = legendaryCount()===6;
      const synergyBanner = _synergyActive
        ? `<div style='text-align:center;margin-top:6px;padding:5px 10px;background:linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,140,0,0.1));border-radius:8px;border:1px solid rgba(255,215,0,0.5);font-size:0.7rem;color:#ffd700;animation:legendaryPassiveGlow 3s ease-in-out infinite'>✨ Sinergia Lendária — +20% XP</div>`
        : '';
      // Banner de stun: sobrepõe equipamentos quando o boss atordoou o herói
      const stunBanner = state.bossStunActive
        ? `<div class="equip-stun-overlay">⚡ Equipamentos paralisados pelo veneno urêmico!<br><span style="font-size:0.72rem;opacity:0.8;">Recuperação na questão 98</span></div>`
        : '';

      ui.equipList.innerHTML = stunBanner + `
        <div class="equip-grid-row">
          ${slotsHTML}
        </div>
        <div class="equip-total-attributes">
          ${totalHTML}
        </div>
        ${synergyBanner}
      `;
    }

    function renderHUD(){
      const [c,img,cls,title]=heroMeta();
      const chapter=chapterMeta();
      ui.heroClass.textContent=c;
      ui.heroTitle.textContent=title;
      // Badge de campeão ao lado do nome quando completou o jogo
      const existingChampBadge = document.getElementById('championBadgeHUD');
      if(state.completedGame || state.gameCompleted) {
        if(!existingChampBadge) {
          const champBadge = document.createElement('img');
          champBadge.id = 'championBadgeHUD';
          champBadge.src = 'assets/badges/champion.png';
          champBadge.alt = 'Campeão';
          champBadge.title = 'Campeão do NefroQuest';
          champBadge.style.cssText = 'width:28px;height:28px;border-radius:50%;border:2px solid var(--gold);box-shadow:0 0 10px rgba(218,165,32,0.5);position:absolute;top:5px;right:5px;';
          const heroCard = ui.heroImg.closest('.hero-card');
          if(heroCard) { heroCard.style.position='relative'; heroCard.appendChild(champBadge); }
        }
      } else if(existingChampBadge) { existingChampBadge.remove(); }
      ui.heroImg.src=img; ui.heroImg.className=`portrait ${cls}`;
      ui.storyTitle.textContent=chapter.title;
      ui.storyGoal.textContent=`Objetivo: ${chapter.goal}`;
      ui.level.textContent=state.level; ui.score.textContent=state.score;
      const _ml=effectiveMaxLives();
      const _livesHtml='<span style="color:#ef4444">❤</span>'.repeat(Math.max(0,state.lives))+'<span style="color:#555">♡</span>'.repeat(Math.max(0,_ml-Math.max(0,state.lives)));
      if(ui.lives.innerHTML!==_livesHtml) ui.lives.innerHTML=_livesHtml;
      ui.record.textContent=best(); ui.gold.textContent=state.gold;
      // Streak visual com multiplicador
      const sm = getStreakMultiplier(state.streak);
      const streakTile = ui.streak.closest('.tile');
      if(streakTile) {
        streakTile.className = 'tile tile-streak';
        ui.streak.textContent = state.streak;
      } else {
        ui.streak.textContent = state.streak;
      }
      ui.xpFill.style.width=`${Math.min(100,(state.xp/state.xpToNext)*100)}%`;
      const _qDone = state.idx;
      const _qTotal = state.queue.length;
      ui.xpTxt.textContent=`XP ${state.xp}/${state.xpToNext}`;
      const _qCtr = document.getElementById('questionCounterTxt');
      if (_qCtr) _qCtr.textContent = `${state.correctTotal}/${questionBank?.length ?? '+'} questões`;
      // Barra de progresso do ciclo
      const _cpf = document.getElementById('cycleProgressFill');
      const _cpt = document.getElementById('cycleProgressTxt');
      if (_cpf) _cpf.style.width = (_qTotal > 0 ? (_qDone/_qTotal*100).toFixed(1) : 0) + '%';
      if (_cpt) _cpt.textContent = `Questão ${_qDone} de ${_qTotal}`;
      renderEquip();
      // Atualizar dock de ações (usando elementos cacheados no objeto ui)
      const {dockForgeBtn:forgeBtn, dockChestBtn:chestBtn, dockLegBtn:legBtn, dockChestCost:chestCostBadge} = ui;
      // Botões sempre ativos — popup de confirmação informa custo e disponibilidade
      if(forgeBtn){ forgeBtn.classList.remove('disabled'); }
      if(legBtn){ legBtn.classList.remove('disabled'); }
      if(chestBtn){ chestBtn.classList.remove('disabled'); }

      // Badges ! removidos — popup de confirmação já informa custo e disponibilidade

      // === BARRA DE STATUS MOBILE (ouro/streak/vidas) ===
      const msbGoldEl = document.getElementById('msbGold');
      const msbStreakEl = document.getElementById('msbStreak');
      const msbLivesEl = document.getElementById('msbLivesIcons');
      if(msbGoldEl) msbGoldEl.textContent = state.gold;
      if(msbStreakEl) msbStreakEl.textContent = state.streak;
      if(msbLivesEl) {
        const lives = Math.max(0, state.lives);
        const maxLives = effectiveMaxLives();
        const msbHtml = '<span style="color:#ef4444">❤</span>'.repeat(Math.min(lives, maxLives)) +
          '<span style="color:#555">♡</span>'.repeat(Math.max(0, maxLives - lives));
        if(msbLivesEl.innerHTML !== msbHtml) msbLivesEl.innerHTML = msbHtml;
      }
    }

     // ── Sistema de randomização com histórico ──────────────────────────────
    // Mantém os IDs das últimas N questões vistas para impedir repetição
    // mesmo na virada de ciclo. Tamanho do histórico = 20% do banco.
    let HISTORY_SIZE = 30; // atualizado após topics.js carregar
    let _recentIds = []; // fila circular dos últimos IDs vistos
    let _masteredSet = (() => {
      try {
        const raw = JSON.parse(localStorage.getItem(MASTERED_KEY) || "[]");
        // Migração: IDs antigos eram number — descartar apenas tipos não-string
        const valid = raw.filter(id => typeof id === "string" && id.length > 0);
        return new Set(valid);
      }
      catch(e) { return new Set(); }
    })();


    function shuffleQueue() {
      if (!questionBank) return; // topics ainda não carregou
      // Separar por dificuldade e embaralhar cada grupo
      // Dentro de cada grupo: não-dominadas primeiro, dominadas por último
      function splitMastered(arr) {
        const fresh    = shuffle(arr.filter(q => !_masteredSet.has(q.id)));
        const mastered = shuffle(arr.filter(q =>  _masteredSet.has(q.id)));
        return [...fresh, ...mastered];
      }
      const easy   = splitMastered(questionBank.filter(q => q._d === 'easy'));
      const medium = splitMastered(questionBank.filter(q => q._d === 'medium'));
      const hard   = splitMastered(questionBank.filter(q => q._d === 'hard'));
      // Proporção por dificuldade do modo de jogo
      // easy:     2e:2m:1h | normal: 1e:2m:2h | hard: 0e:1m:3h | hardcore: somente hard
      const diff = state.difficulty || 'normal';
      const interleaved = [];
      const ei = [...easy], mi = [...medium], hi = [...hard];
      if (diff === 'hardcore') {
        // Somente questões difíceis
        interleaved.push(...hi);
      } else {
        while (ei.length || mi.length || hi.length) {
          if (diff === 'easy') {
            if (ei.length) interleaved.push(ei.shift());
            if (ei.length) interleaved.push(ei.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
          } else if (diff === 'hard') {
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
            if (hi.length) interleaved.push(hi.shift());
            if (hi.length) interleaved.push(hi.shift());
          } else {
            // normal
            if (ei.length) interleaved.push(ei.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
          }
        }
      }
      // Mover para o final qualquer questão que esteja no histórico recente
      // (evita repetição imediata na virada de ciclo)
      const blocked = new Set(_recentIds);
      const front = interleaved.filter(q => !blocked.has(q.id));
      const back  = shuffle(interleaved.filter(q =>  blocked.has(q.id)));
      state.queue = [...front, ...back];
      state.idx = 0;
    }

    function drawQuestion() {
      if (state.idx >= state.queue.length) { finishDeck(); return null; }
      const q = state.queue[state.idx++];
      // Registrar no histórico recente
      _recentIds.push(q.id);
      if (_recentIds.length > HISTORY_SIZE) _recentIds.shift();
      return q;
    }
    // Raridade derivada do tipo de evidência (badge) da referência.
    // GUIDELINE → Lendário · RCT/META → Épico · COORTE/REVIEW/REVISÃO → Raro · resto → Comum
    function _refRarity(badge) {
      const b = (badge || '').toUpperCase();
      if (b === 'GUIDELINE') return { label:'Lendário', color:'#ffd700', bg:'rgba(255,215,0,0.10)',  border:'rgba(255,215,0,0.55)' };
      if (b === 'RCT' || b === 'META') return { label:'Épico', color:'#c084fc', bg:'rgba(192,132,252,0.10)', border:'rgba(192,132,252,0.45)' };
      if (b === 'COORTE' || b === 'COHORT' || b === 'REVIEW' || b === 'REVISÃO') return { label:'Raro', color:'#38bdf8', bg:'rgba(56,189,248,0.10)', border:'rgba(56,189,248,0.45)' };
      return { label:'Comum', color:'#94a3b8', bg:'rgba(148,163,184,0.10)', border:'rgba(148,163,184,0.35)' };
    }

    function renderRefs(keys){
      const list = [...new Set(keys)].map(k => ({ key: k, ref: refsDB[k] })).filter(x => x.ref);
      if(!list.length){ ui.refs.innerHTML=''; return; }

      // Determinar cor de acento baseada no badge dominante
      const hasRCT = list.some(x => x.ref.badge === 'RCT');
      const accentColor = hasRCT ? '#10b981' : '#6366f1';

      const cardsHTML = list.map(({ key, ref }, i) => {
        const accent = ref.badgeColor || '#6366f1';
        const impactoClass = (ref.impacto && (ref.impacto.includes('↓') || ref.impacto.includes('superior') || ref.impacto.includes('reduz'))) ? 'green' :
                             (ref.impacto && (ref.impacto.includes('não') || ref.impacto.includes('n\u00e3o'))) ? 'amber' : '';
        const copyText = [ref.label, ref.journal, ref.ano].filter(Boolean).join('. ');
        const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(ref.label)}`;
        const rar = _refRarity(ref.badge);
        return `
          <div class="ref-card" style="--ref-accent:${accent}">
            <div class="ref-card-top">
              <span class="ref-icon">${ref.icon || '📄'}</span>
              <a class="ref-title" href="${scholarUrl}" target="_blank" rel="noopener noreferrer" title="Buscar no Google Scholar" style="color:inherit;text-decoration:none;">${escapeHtml(ref.label)} <span style="font-size:0.7em;opacity:0.55;">↗</span></a>
              <span class="ref-rarity" style="color:${rar.color};background:${rar.bg};border:1px solid ${rar.border};">${rar.label}</span>
              <span class="ref-badge" style="background:${accent}">${escapeHtml(ref.badge || 'REF')}</span>
            </div>
            <div class="ref-meta">
              <span class="ref-journal">${escapeHtml(ref.journal || '')}</span>
              ${ref.ano ? `<span class="ref-year">${escapeHtml(String(ref.ano))}</span>` : ''}
              ${ref.tipo ? `<span class="ref-tipo">${escapeHtml(ref.tipo)}</span>` : ''}
            </div>
            ${ref.impacto ? `<div class="ref-impacto ${impactoClass}">${escapeHtml(ref.impacto)}</div>` : ''}
            <div class="ref-actions">
              <button class="ref-resumo-btn" data-action="openRefResumo" data-arg="${escapeHtml(key)}">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                ver resumo
              </button>
              <button class="ref-copy-btn" data-action="_copyRefBtn" data-pass-this="1" data-copy-text="${escapeHtml(copyText)}">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                copiar
              </button>
            </div>
          </div>`;
      }).join('');

      ui.refs.innerHTML = `
        <div class="refs-header">Evidência Científica</div>
        <div class="ref-cards">${cardsHTML}</div>
      `;
    }

    function _copyRef(btn, text) {
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '✓ copiado';
        btn.classList.add('ref-copy-btn--copied');
        setTimeout(() => {
          btn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> copiar';
          btn.classList.remove('ref-copy-btn--copied');
        }, 2000);
      }).catch(() => {});
    }

    function _renderOptions(q) {
      ui.options.innerHTML = '';
      if (!q.o || !Array.isArray(q.o)) return;
      q.o.forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'option'; b.type = 'button';
        b.dataset.idx = i;
        b.setAttribute('data-kbd-hint', i + 1);
        const keySpan = document.createElement('span');
        keySpan.className = 'opt-key';
        keySpan.textContent = String.fromCharCode(65 + i);
        const bodySpan = document.createElement('span');
        bodySpan.className = 'opt-body';
        bodySpan.textContent = opt;
        b.appendChild(keySpan);
        b.appendChild(bodySpan);
        ui.options.appendChild(b);
      });
    }

    // Lifelines de itens ÉPICOS (uso único/jogo), disparados automaticamente
    // na 1ª questão DIFÍCIL em que o item estiver equipado. Sem botão extra —
    // o efeito acontece sozinho e o jogo flui.
    function _applyEpicLifelines(q) {
      if (!q || q._d !== 'hard') return;
      // 🎯 Filtro Glomerular (50/50) — Espada Nefroprotetora (épica): elimina 2 erradas
      if (state.equipment?.weapon?.n === 'Espada Nefroprotetora' && !state.legendaryAbilityUsed?.['Espada Nefroprotetora']) {
        const wrong = [];
        (q.o || []).forEach((_, i) => { if (i !== q.a) wrong.push(i); });
        let removed = 0;
        while (removed < 2 && wrong.length) {
          const idx = wrong.splice(Math.floor(Math.random() * wrong.length), 1)[0];
          const btn = ui.options.querySelector(`.option[data-idx="${idx}"]`);
          if (btn) { btn.disabled = true; btn.classList.add('opt-eliminated'); removed++; }
        }
        if (removed > 0) {
          state.legendaryAbilityUsed['Espada Nefroprotetora'] = true;
          renderEquip();
          if (typeof _toast === 'function') _toast('🎯 Filtro Glomerular: 2 alternativas erradas eliminadas! (1× por jogo)', 'success', 4000);
        }
      }
      // 🔮 Visão do Oráculo — Orbe da Cistatina (épica): revela uma pista antes de responder
      if (state.equipment?.relic?.n === 'Orbe da Cistatina' && !state.legendaryAbilityUsed?.['Orbe da Cistatina']) {
        const hint = (typeof _firstSentence === 'function') ? _firstSentence(q.e || '', 160) : (q.e || '').slice(0, 160);
        if (hint) {
          ui.feedback.className = 'feedback';
          ui.feedback.innerHTML = `<strong style="color:#c084fc;">🔮 Visão do Oráculo:</strong> ${escapeHtml(hint)}`;
          state.legendaryAbilityUsed['Orbe da Cistatina'] = true;
          renderEquip();
          if (typeof _toast === 'function') _toast('🔮 Visão do Oráculo revelou uma pista! (1× por jogo)', 'success', 4000);
        }
      }
    }

    function _updateSkipButton() {
      const existing = document.getElementById('skipQuestionBtn');
      const hasRelic = state.equipment?.relic?.n === 'Relíquia do Título';
      const alreadyUsed = state.legendaryAbilityUsed?.['Relíquia do Título'];
      if (hasRelic && !alreadyUsed) {
        if (!existing) {
          const sb = document.createElement('button');
          sb.id = 'skipQuestionBtn';
          sb.className = 'skip-question-btn visible';
          sb.innerHTML = '📖 Pular esta questão (Relíquia do Título — 1×)';
          sb.onclick = () => {
            state.legendaryAbilityUsed['Relíquia do Título'] = true;
            sb.remove();
            log('📖 Relíquia do Título usada — questão pulada sem penalidade.');
            renderEquip();
            renderQuestion();
          };
          ui.options.parentElement.insertBefore(sb, ui.options.nextSibling);
        } else {
          existing.classList.add('visible');
        }
      } else if (existing) {
        existing.remove();
      }
    }

    let _loadingNextQuestion = false;
    function renderQuestion(){
      if (_loadingNextQuestion) return;
      _loadingNextQuestion = true;
      setTimeout(() => { _loadingNextQuestion = false; }, 400);

      // Envia a avaliação da questão anterior antes de carregar a próxima.
      flushPendingRating();

      _questionStartTime = Date.now();
      const _msb = document.getElementById('mobileStatusBar');
      if (_msb) _msb.classList.add('active');
      state.answered = false;
      const q = drawQuestion();
      if (!q) return;
      state.current = q;
      ui.question.textContent = q.q;
      ui.feedback.className = 'feedback';
      ui.feedback.textContent = 'Escolha a melhor alternativa clínica.';
      renderRefs(q.r);
      ui.nextBtn.classList.add('hidden');
      ui.dockNextBtn?.classList.add('disabled');
      ui.bonusBtn.classList.add('hidden');
      if (ui.oraculoBtn) ui.oraculoBtn.classList.add('hidden');
      _renderOptions(q);
      _applyEpicLifelines(q);
      _updateSkipButton();
      updateBossUI();
      applyBossOptionBadges();
    }

    function flagQuestion() {
      const q = state.current;
      if (!q) return;
      document.getElementById('flagPopup')?.remove();
      const qNum = q.id || '?';
      const qText = (q.q || '').substring(0, 300);
      const popup = document.createElement('div');
      popup.id = 'flagPopup';
      popup.className = 'nq-overlay';
      popup.style.cssText = 'z-index:9999;background:rgba(0,0,0,0.75);';
      popup.innerHTML = `
        <div style="background:linear-gradient(180deg,#1a2a4a,#0e1830);border:2px solid #6366f1;border-radius:14px;padding:24px;max-width:500px;width:100%;box-shadow:0 0 40px rgba(99,102,241,0.3);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="color:#a5b4fc;font-family:'Cinzel',serif;font-size:1rem;letter-spacing:1px;">🚩 Sinalizar Erro na Questão</h3>
            <button data-remove-id="flagPopup" style="background:none;border:none;color:#64748b;font-size:1.4rem;cursor:pointer;line-height:1;">×</button>
          </div>
          <p style="font-size:0.78rem;color:#64748b;margin-bottom:6px;">Questão #${qNum}</p>
          <p style="font-size:0.82rem;color:#94a3b8;background:rgba(30,40,70,0.5);border-radius:8px;padding:10px;margin-bottom:14px;font-style:italic;line-height:1.5;">"${escapeHtml(qText)}"</p>
          <label style="font-size:0.82rem;color:#93b4e8;display:block;margin-bottom:6px;">Descreva o problema:</label>
          <div style="margin-bottom:10px;">
  <div style="color:var(--txt-dim);font-size:0.75rem;margin-bottom:6px;">Tipo de problema:</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;" id="flagCategoryChips">
    <button type="button" class="flag-chip selected" data-cat="resposta_incorreta">❌ Resposta incorreta</button>
    <button type="button" class="flag-chip" data-cat="desatualizada">📅 Desatualizada</button>
    <button type="button" class="flag-chip" data-cat="ambigua">🤔 Ambígua</button>
    <button type="button" class="flag-chip" data-cat="erro_texto">✏️ Erro de texto</button>
    <button type="button" class="flag-chip" data-cat="outra">💬 Outra</button>
  </div>
</div>
          <textarea id="flagComment" rows="3" placeholder="Ex: A alternativa B está incorreta pois... / O gabarito deveria ser..."
            style="width:100%;background:rgba(10,20,40,0.8);border:1px solid var(--blue-dark);border-radius:8px;color:#d5e2ff;font-size:0.85rem;padding:10px;resize:vertical;font-family:'Philosopher',serif;outline:none;box-sizing:border-box;"></textarea>
          <div id="flagStatus" class="flag-status"></div>
          <button data-action="submitFlag" data-arg="${qNum}" id="flagSendBtn"
            style="width:100%;margin-top:10px;background:linear-gradient(180deg,#4f46e5,#3730a3);border:2px solid #6366f1;color:#fff;border-radius:8px;padding:12px;font-family:'Cinzel',serif;font-size:0.82rem;font-weight:700;letter-spacing:1px;cursor:pointer;text-transform:uppercase;">
            📧 Enviar
          </button>
        </div>`;
      document.body.appendChild(popup);
      document.getElementById('flagCategoryChips')?.addEventListener('click', e => {
        const chip = e.target.closest('.flag-chip');
        if (!chip) return;
        document.querySelectorAll('.flag-chip').forEach(c => {
          c.classList.remove('selected');
        });
        chip.classList.add('selected');
      });
      // popup.addEventListener('click', e => { if(e.target===popup) popup.remove(); });
      setTimeout(() => document.getElementById('flagComment')?.focus(), 100);
    }

    async function submitFlag(qNum) {
      const comment = (document.getElementById('flagComment')?.value || '').trim();
      const selectedCat = document.querySelector('.flag-chip.selected')?.dataset?.cat || 'outra';
      const catLabels = { resposta_incorreta:'Resposta incorreta', desatualizada:'Desatualizada', ambigua:'Ambígua', erro_texto:'Erro de texto', outra:'Outra' };
      const catLabel = catLabels[selectedCat] || 'Outra';
      const q = state.current;
      const qText = (q?.q || '').substring(0, 500);
      const btn = document.getElementById('flagSendBtn');
      const status = document.getElementById('flagStatus');

      if (selectedCat === 'outra' && comment.length < 10) {
        status.className = 'flag-status flag-status--error';
        status.textContent = '❌ Para "Outra", descreva o problema (mín. 10 caracteres).';
        return;
      }
      if (!navigator.onLine) {
        status.className = 'flag-status flag-status--error';
        status.textContent = '📵 Sem conexão. Verifique sua rede e tente novamente.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Enviando...';
      status.className = 'flag-status flag-status--pending';
      status.textContent = '';

      const body = {
        subject: `[NefroQuest] ${catLabel} — Questão #${qNum}`,
        message:
          `Questão #${qNum}\n\n` +
          `Tipo: ${catLabel}\n\n` +
          `ENUNCIADO:\n"${qText}"\n\n` +
          `COMENTÁRIO DO JOGADOR:\n${comment || '(sem comentário adicional)'}`,
      };

      try {
        // Headers de auth obrigatórios (verify_jwt): sem apikey/Authorization o
        // Supabase rejeita com 401 antes de chegar na função. Quando logado,
        // envia o JWT da sessão (passa no verify_jwt mesmo que a função exija);
        // visitante cai na publishable key (requer verify_jwt=false na função).
        const _supaKey = (window.NQ_CONFIG && window.NQ_CONFIG.SUPA_KEY)
          || (typeof SUPA_KEY !== 'undefined' ? SUPA_KEY : '');
        let _authToken = _supaKey;
        try {
          const _sess = await (typeof _supaClient !== 'undefined' ? _supaClient : null)?.auth?.getSession();
          _authToken = _sess?.data?.session?.access_token || _supaKey;
        } catch {}
        const res = await fetch(`${SUPA_URL}/functions/v1/send-flag`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            apikey: _supaKey,
            Authorization: `Bearer ${_authToken}`,
          },
          body: JSON.stringify(body),
        });
        let data = {};
        try { data = await res.json(); } catch {}
        if (res.ok && data.success) {
          status.className = 'flag-status flag-status--success';
          status.textContent = '✅ Erro enviado! Obrigado pelo feedback.';
          setTimeout(() => document.getElementById('flagPopup')?.remove(), 2000);
          log('🚩 Erro na questão #' + qNum + ' sinalizado com sucesso!');
        } else {
          // Mostra o motivo real para diagnosticar (config/auth/serviço de e-mail).
          const code = res.status;
          const reason = (data && (data.error || data.message)) || '';
          let hint = 'Tente novamente em instantes.';
          if (code === 401 || code === 403) hint = 'Autenticação recusada pelo servidor.';
          else if (code === 500 && /config/i.test(reason)) hint = 'Serviço de e-mail não configurado (WEB3FORMS_KEY).';
          else if (code === 502) hint = 'Serviço de e-mail rejeitou o envio.';
          status.className = 'flag-status flag-status--error';
          status.textContent = `❌ Falha ao enviar (${code}). ${hint}`;
          btn.disabled = false;
          btn.textContent = '📧 Enviar';
          _track('error_flag_submit', { status: code, reason });
        }
      } catch (err) {
        // Erro de rede / função inexistente / CORS bloqueado.
        status.className = 'flag-status flag-status--error';
        status.textContent = '❌ Falha de conexão com o servidor. Verifique sua rede.';
        btn.disabled = false;
        btn.textContent = '📧 Enviar';
        _track('error_flag_submit', { msg: String(err) });
      }
    }

    const MAX_LEVEL = 10;
    function xpForLevel(lv) {
      // xpToNext = 200 * 1.15^(lv-1), garante ~10 questões no nível 1
      return Math.floor(200 * Math.pow(1.15, lv - 1));
    }
    // Teto de nível conforme o progresso (correctTotal). Garante que o nível
    // máximo (10) só é atingido em 90 acertos — exatamente quando a batalha do
    // boss começa (BOSS_START_CORRECT=90), 10 questões antes da vitória (100).
    // Cadência: 1 nível a cada 10 acertos (L1 em 0, L2 em 10, … L10 em 90).
    // O XP continua preenchendo a barra dentro de cada nível, mas não permite
    // ultrapassar o teto do progresso — evita "subir nível fácil demais".
    function levelCapForProgress() {
      return Math.min(MAX_LEVEL, 1 + Math.floor((state.correctTotal || 0) / 10));
    }
    function gainXP(x){
      state.xp+=x; let up=0;
      const cap = levelCapForProgress();
      while(state.xp>=state.xpToNext && state.level < cap){
        state.xp-=state.xpToNext; state.level++; state.xpToNext=xpForLevel(state.level); up++;
        if (_guestMode && !_guestHookShown && _guestQuestionCount >= GUEST_FREE_LIMIT) _showGuestHook();
        _track('level_up', { level: state.level, difficulty: state.difficulty });
      }
      // No teto: trava a barra cheia (não desperdiça XP além do cap; ele será
      // consumido quando o progresso liberar o próximo nível).
      if (state.level >= cap && state.xp > state.xpToNext) state.xp = state.xpToNext;
      return up;
    }

    function allItemsMaxed(){
      // Verifica se todos os 6 slots têm qualquer item legendary equipado
      const slots = ['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot'];
      return slots.every(slot => state.equipment[slot]?.rar === 'legendary');
    }

     function _markObtained(name){
      if(!Array.isArray(state.obtainedItems)) state.obtainedItems=[];
      if(!state.obtainedItems.includes(name)) state.obtainedItems=[...state.obtainedItems,name];
    }

     function rollItem(diff,luck){
      // Itens já vistos (equipados ou obtidos antes) nunca devem repetir
      const equipped = Object.values(state.equipment).map(e=>e.n);
      const obtained = Array.isArray(state.obtainedItems) ? state.obtainedItems : [];
      const seen = new Set([...equipped, ...obtained]);

      // Tentar até 20 vezes respeitando a raridade sorteada, sem repetir
      for(let attempt=0; attempt<20; attempt++){
        const slots=Object.keys(items),slot=slots[Math.floor(Math.random()*slots.length)];
        const bonus=Math.min(2,Math.floor((luck+diff)/8));
        const pool=[...rarityWeight,...(bonus?["rare","epic"].slice(0,bonus):[])];
        const rar=pool[Math.floor(Math.random()*pool.length)];
        const cand=items[slot].filter(i=>i.rar===rar && !seen.has(i.n));
        if(cand.length>0){
          const item=cand[Math.floor(Math.random()*cand.length)];
          _markObtained(item.n);
          return{slot,item};
        }
      }
      // Fallback: qualquer item ainda não visto, em qualquer slot/raridade
      const fresh=[];
      Object.keys(items).forEach(slot=>{
        items[slot].forEach(i=>{ if(!seen.has(i.n)) fresh.push({slot,item:i}); });
      });
      if(fresh.length>0){
        const pick=fresh[Math.floor(Math.random()*fresh.length)];
        _markObtained(pick.item.n);
        return pick;
      }
      // Pool de 23 itens esgotado: libera repetição (somente o que não está equipado)
      // Notifica o jogador uma única vez para que ele saiba que coletou tudo.
      if(!state.allItemsCollectedNotified){
        state.allItemsCollectedNotified = true;
        try { log('🏆 Você coletou todos os equipamentos do reino! Forjas agora podem repetir itens.'); } catch {}
        try { if (typeof _toast === 'function') _toast('🏆 Coleção completa! Todos os 23 equipamentos já foram forjados.', 'success', 5000); } catch {}
        try { _track('all_items_collected', { correctTotal: state.correctTotal }); } catch {}
      }
      const allFree=[];
      Object.keys(items).forEach(slot=>{
        items[slot].forEach(i=>{ if(!equipped.includes(i.n)) allFree.push({slot,item:i}); });
      });
      const finalPool = allFree.length>0 ? allFree : Object.keys(items).map(slot=>({slot,item:items[slot][0]}));
      return finalPool[Math.floor(Math.random()*finalPool.length)];
    }

    const _rarSellVal = {common:20,uncommon:40,rare:80,epic:150,legendary:300};
    const _rarLabel = {common:'Comum',uncommon:'Incomum',rare:'Raro',epic:'Épico',legendary:'Lendário',mythic:'Mítico'};
    function _itemSellVal(it){ return _rarSellVal[it.rar]||20; }

    function showEquipComparePopup(slot, oldItem, newItem, onReplace, onKeep) {
      const def = defaultIcons[slot] || '';
      const ov = el => `
        <div class="equip-compare-slot equipped">
          <div class="equip-compare-label">Equipado</div>
          <div class="ecp-header">
            <span class="ecp-name">${el.n}</span>
            <span class="ecp-rar ${el.rar}">${_rarLabel[el.rar]||el.rar}</span>
          </div>
          <div class="ecp-slot-body">
            <div class="ecp-img-wrapper">
              <img src="${getItemIcon(el.n, slot)}" onerror="this.src='${def}'" alt="${el.n}">
            </div>
            <div class="ecp-stats">
              <div class="ecp-stat-row">
                <span class="ecp-stat-label">⚔️ ATK</span>
                <span class="ecp-stat-value">${el.atk}</span>
              </div>
              <div class="ecp-stat-row">
                <span class="ecp-stat-label">🛡️ DEF</span>
                <span class="ecp-stat-value">${el.def}</span>
              </div>
              <div class="ecp-stat-row">
                <span class="ecp-stat-label">📚 CONH</span>
                <span class="ecp-stat-value">${el.kno}</span>
              </div>
              <div class="ecp-stat-row">
                <span class="ecp-stat-label">🍀 SORTE</span>
                <span class="ecp-stat-value">${el.luck}</span>
              </div>
            </div>
          </div>
        </div>`;
      const nv = el => `
        <div class="equip-compare-slot new-item">
          <div class="equip-compare-label">Novo item</div>
          <div class="ecp-header">
            <span class="ecp-name">${el.n}</span>
            <span class="ecp-rar ${el.rar}">${_rarLabel[el.rar]||el.rar}</span>
          </div>
          <div class="ecp-slot-body">
            <div class="ecp-img-wrapper">
              <img src="${getItemIcon(el.n, slot)}" onerror="this.src='${def}'" alt="${el.n}">
            </div>
            <div class="ecp-stats">
              ${['atk','def','kno','luck'].map(s => {
                const icons = {atk:'⚔️ ATK',def:'🛡️ DEF',kno:'📚 CONH',luck:'🍀 SORTE'};
                const diff = el[s] - oldItem[s];
                const cls = diff>0?'pos':diff<0?'neg':'';
                const diffStr = diff>0?`+${diff}`:diff<0?`${diff}`:'';
                return `
                  <div class="ecp-stat-row">
                    <span class="ecp-stat-label">${icons[s]}</span>
                    <span class="ecp-stat-value">
                      ${el[s]}
                      ${diffStr ? `<span class="ecp-stat-diff ${cls}">(${diffStr})</span>` : ''}
                    </span>
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>`;
      const sellVal = _itemSellVal(newItem);
      document.getElementById('equipCompareOverlay')?.remove();
      const overlay = document.createElement('div');
      overlay.className = 'equip-compare-overlay';
      overlay.id = 'equipCompareOverlay';
      overlay.innerHTML = `
        <div class="equip-compare-card">
          <div class="equip-compare-title">⚔️ Substituir ${slotLabels[slot]||slot}?</div>
          <div class="equip-compare-body">
            ${ov(oldItem)}
            <div class="equip-compare-arrow">→</div>
            ${nv(newItem)}
          </div>
          <div class="equip-compare-actions">
            <button class="equip-compare-replace" id="ecpReplace">⬆️ SUBSTITUIR</button>
            <button class="equip-compare-keep" id="ecpKeep">💰 MANTER ATUAL (VENDER)</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#ecpReplace').onclick = () => { overlay.remove(); onReplace(); };
      overlay.querySelector('#ecpKeep').onclick   = () => { overlay.remove(); onKeep(); };
    }

    function equipOrSell(slot, item, onDone) {
      const currentItem = state.equipment[slot];
      if (!currentItem || currentItem.n === 'Vazio') {
        state.equipment[slot] = item;
        const msg = `⬆️ Equipou **${item.n}** (${_rarLabel[item.rar] || item.rar}) no slot ${slotLabels[slot]||slot}.`;
        if (onDone) onDone(msg);
        renderHUD(); updateBadges(); saveGame();
        return;
      }
      
      showEquipComparePopup(slot, currentItem, item,
        () => {
          const val = _itemSellVal(currentItem);
          state.gold += val;
          state.equipment[slot] = item;
          const msg = `⬆️ ${slotLabels[slot]}: **${currentItem.n}** → **${item.n}**. ${currentItem.n} convertido em ${val}💰.`;
          if (onDone) onDone(msg);
          renderHUD(); updateBadges(); saveGame();
        },
        () => {
          const val = _itemSellVal(item);
          state.gold += val;
          const msg = `💰 ${item.n} (${_rarLabel[item.rar] || item.rar}) vendido por ${val}💰 — ${slotLabels[slot]} atual mantida.`;
          if (onDone) onDone(msg);
          renderHUD(); updateBadges(); saveGame();
        }
      );
    }


    function showFloatingFeedback(text, isCorrect, x, y) {
      const el = document.createElement('div');
      el.className = 'floating-text ' + (isCorrect ? 'correct' : 'wrong');
      el.textContent = text;
      if (x === undefined || y === undefined) {
        el.style.left = '50%';
        el.style.top = '40%';
      } else {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
      }
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
    window.showFloatingFeedback = showFloatingFeedback;

    function triggerScreenShake() {
      const app = document.getElementById('mainApp');
      if (!app) return;
      app.classList.remove('shake-screen');
      void app.offsetWidth; // forçar reflow
      app.classList.add('shake-screen');
      setTimeout(() => {
        app.classList.remove('shake-screen');
      }, 500);
    }
    window.triggerScreenShake = triggerScreenShake;

    function triggerHapticFeedback(type) {
      if (!navigator.vibrate) return;
      try {
        if (type === 'correct') {
          navigator.vibrate([40, 30, 40]);
        } else if (type === 'wrong') {
          navigator.vibrate(300);
        } else if (type === 'levelup') {
          navigator.vibrate([60, 40, 120, 40, 220]);
        }
      } catch (e) {}
    }
    window.triggerHapticFeedback = triggerHapticFeedback;


    function answer(i,btn){
      if(!state.gameStarted) return;
      if(state.answered) return;
      if(!state.current) return;
      state.answered=true;

      const timeSpent = _questionStartTime > 0 ? Math.floor((Date.now() - _questionStartTime) / 1000) : 0;
      const isCorrect = i === state.current.a;
      
      // Tracking de estatísticas
      trackQuestionAnswer(state.current, isCorrect, timeSpent);

      // Acumular erros da sessão para revisão no fim de partida
      if (!isCorrect && state.current && typeof _sessionWrongAnswers !== 'undefined') {
        _sessionWrongAnswers.push(state.current);
      }

      // Marcar questão como dominada após resposta correta
      if (isCorrect && state.current && state.current.id) {
        _masteredSet.add(state.current.id);
        try { localStorage.setItem(MASTERED_KEY, JSON.stringify([..._masteredSet])); } catch(e) { console.error('[NQ] saveMastered failed', e); }
      }

      // Desbloquear refs do Grimório ao acertar
      if (isCorrect && state.current?.r?.length) {
        if (typeof _unlockRefsFromQuestion === 'function') {
          _unlockRefsFromQuestion(state.current.r);
        }
      }
      const st=total();
      const all=[...ui.options.querySelectorAll('.option')];
      all.forEach(b=>b.disabled=true);
      const c=state.current.a;
      all[c].classList.add('correct');

      if(i===c){
        state.streak++;
        state.correctTotal++;
        state.chestCorrectCount = (state.chestCorrectCount || 0) + 1;
        if (state.chestCorrectCount >= state.chestTarget) {
          state.chestCorrectCount = 0;
          state.chestTarget = Math.floor(Math.random() * 3) + 5;
          setTimeout(() => { if (typeof triggerChestRewardPopup === 'function') triggerChestRewardPopup(); }, 1200);
        }
        const sm = getStreakMultiplier(state.streak);
        const baseXp=5+state.current.d*2+Math.min(state.streak,5)*1+Math.floor(st.kno/3);
        let xp=Math.floor(baseXp * sm.mult);
        const baseG=8+state.current.d*3+Math.floor(st.luck/3);
        let g=Math.floor(baseG * sm.mult);
        // Legendary passive: Elmo do Filtrador Supremo +25% gold
        if(state.equipment?.helmet?.n==='Elmo do Filtrador Supremo') g=Math.floor(g*1.25);
        // Legendary passive: Cetro do Néfron Eterno - streak bonus gold
        if(state.equipment?.weapon?.n==='Cetro do Néfron Eterno' && state.streak>=5) g+=30;
        // Legendary synergy: all 6 slots legendary = +20% XP
        const _synergy = legendaryCount()===6;
        if(_synergy) xp=Math.floor(xp*1.2);
        const baseScore=80+state.current.d*15+state.streak*5+st.atk;
        state.score+=Math.floor(baseScore * sm.mult);
        const prevGold = state.gold;
        state.gold+=g;
        checkGoldMilestone(prevGold);
        const prevLevel = state.level;
        const lv=gainXP(xp);

        if(state.level>=MAX_LEVEL&&legendaryCount()>=2){
          log('👑 Objetivo final desbloqueado! Você está pronto para vencer o Arqui-Nefromante.');
        }
        ui.feedback.className='feedback good';
        const multText = sm.label ? ` (${sm.label})` : '';
        const synergyText = _synergy ? ' ✨+20% sinergia' : '';
        { const _snip = escapeHtml(_firstSentence(state.current.e, 280));
          const _full = escapeHtml(state.current.e || '');
          const _hasMore = _full.length > _snip.length;
          ui.feedback.innerHTML = `<strong>✅ Correto!</strong> +${xp} XP${multText}${synergyText}, +${g} ouro.${lv?` <strong>Level up x${lv}!</strong>`:''}<br><span class="fb-snip">${_snip}<span style="display:none;" class="fb-rest"> ${_full.substring(_snip.length)}</span></span>${_hasMore?`<button class="fb-more-btn" style="display:block;background:none;border:none;color:#93c5fd;cursor:pointer;font-size:0.8rem;padding:4px 0 0 0;margin-top:2px;" data-action="_showMoreFb" data-pass-this="1">ver mais ▾</button>`:''}` ;
          if (window.innerWidth <= 768) setTimeout(() => ui.feedback.scrollIntoView({behavior:'smooth', block:'nearest'}), 80);
        }
        // Feedback de dano/XP flutuante
        let x, y;
        if (btn && typeof btn.getBoundingClientRect === 'function') {
          const rect = btn.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
        showFloatingFeedback(`+${xp} XP  +${g}💰`, true, x, y);

        // Boss log & damage animation
        if (isBossBattle()) {
          const dmg = Math.floor(st.atk * 8 + st.kno * 5 + state.streak * 5);
          
          // Dano flutuante sobre a imagem do Nefromante
          const bossImg = document.getElementById('arquiBossImgEl');
          let bx, by;
          if (bossImg && typeof bossImg.getBoundingClientRect === 'function') {
            const rect = bossImg.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              bx = rect.left + rect.width / 2 + window.scrollX;
              by = rect.top + rect.height / 2 + window.scrollY;
            }
          }
          if (bx !== undefined && by !== undefined) {
            showFloatingFeedback(`-${dmg} HP`, true, bx, by);
          } else {
            showFloatingFeedback(`-${dmg} HP`, true, x, y);
          }

          const hpBefore = Math.min(100, getBossHP() + 10);
          const hpAfter  = getBossHP();
          
          let attackAction = 'Você atacou';
          const cat = state.current.c || state.current.cat || 'geral';
          if (cat === 'glomerular') attackAction = 'Você conjurou Lâmina dos Glomérulos';
          else if (cat === 'eletrólitos') attackAction = 'Você manipulou a Corrente de Eletrólitos';
          else if (cat === 'acido_base') attackAction = 'Você equilibrou o pH com Feitiço Ácido-Base';
          else if (cat === 'dialise') attackAction = 'Você ativou a Barreira Dialítica';
          else if (cat === 'transplante') attackAction = 'Você canalizou a União de Enxerto HLA';
          else if (cat === 'drc') attackAction = 'Você lançou a Barreira de Retardo de DRC';
          else if (cat === 'lra') attackAction = 'Você mitigou a Injúria Renal Aguda (LRA)';
          else if (cat === 'hipertensao') attackAction = 'Você empunhou o Escudo de Controle Pressórico';
          else if (cat === 'nefropatia_diabetica') attackAction = 'Você anulou a Glicotoxicidade';
          else if (cat === 'litíase') attackAction = 'Você pulverizou os Cálculos Renais';
          else if (cat === 'farmacologia') attackAction = 'Você infundiu Nefroproteção Farmacológica';
          else if (cat === 'infeccao') attackAction = 'Você expurgou a Infecção Urinária';
          else if (cat === 'genetica') attackAction = 'Você decodificou a Síndrome Genética Renal';
          else if (cat === 'uti') attackAction = 'Você estabilizou o Rim Crítico na UTI';
          else attackAction = 'Você atacou com precisão clínica';

          state.bossLog = state.bossLog || [];
          state.bossLog.push({cls:'hit', txt:`⚔️ ${attackAction} e causou <strong>${dmg} de dano!</strong>`});
          state.bossLog.push({cls:'', txt:`HP: ${hpBefore}% → ${hpAfter}%`});
          const loreLines = ['😤 "Fraco demais para derrotar a Azotemia Eterna!"','😠 "Impossível... como você conhece os néfrons?"','😡 "Sua sabedoria me enfraquece... mas não me vencerá!"','😰 "N-não... meu poder está se dissipando!"','💀 "Você... venceu. Mas a Uremia... sempre volta..."'];
          if (state.bossLog.length % 4 === 0) state.bossLog.push({cls:'lore', txt: loreLines[Math.floor(state.bossLog.length/4) % loreLines.length]});
          
          // Animação visual de impacto no Boss
          const bossImgBox = document.querySelector('.battle-boss-side');
          if (bossImgBox) {
            bossImgBox.classList.add('boss-damaged');
            setTimeout(() => bossImgBox.classList.remove('boss-damaged'), 400);
          }
        }
        // Sons e popup de evolução
        if(lv) {
          playSound('levelup');
          triggerHapticFeedback('levelup');
          // Verificar se houve mudança de imagem/título
          const [newClass, newImg, newCls, newTitle] = heroMeta();
          setTimeout(() => showEvolutionPopup(state.level, newTitle, newImg), 600);
          // Verificar vida extra
          checkExtraLife();
        } else {
          playSound('correct');
          triggerHapticFeedback('correct');
        }
        if(state.streak >= 5) playSound('streak');
        // Verificar narrativa a cada 5 acertos
        checkNarrative();
        // Auto-save após acerto
        saveGame();
        checkGameCompletion();
      } else {
        state.streak=0;
        btn.classList.add('wrong');
        // Tremor de tela e vibrar erro (apenas se for boss)
        if (typeof isBossBattle === 'function' && isBossBattle()) {
          triggerScreenShake();
        }
        triggerHapticFeedback('wrong');

        let x, y;
        if (btn && typeof btn.getBoundingClientRect === 'function') {
          const rect = btn.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }

        // Legendary passive: Armadura da Homeostase Perfeita: DEF 2.0% vs 1.4%
        const defMult = (state.equipment?.armor?.n==='Armadura da Homeostase Perfeita') ? 0.020 : 0.014;
        const shield=Math.min(.50, st.def * defMult);
        let blocked=Math.random()<shield;
        let legendaryBlockMsg = '';
        // Legendary active: Excalibur do Néfron (auto-blocks 1st life loss)
        if(!blocked && state.equipment?.weapon?.n==='Excalibur do Néfron' && !state.legendaryAbilityUsed?.['Excalibur do Néfron']) {
          state.legendaryAbilityUsed['Excalibur do Néfron'] = true;
          blocked = true;
          legendaryBlockMsg = '⚔️ Excalibur do Néfron anulou o dano! (1× por jogo)';
          renderEquip();
        }
        // Legendary active: Armadura Primeva (blocks hit when on last life)
        if(!blocked && state.lives<=1 && state.equipment?.armor?.n==='Armadura Primeva' && !state.legendaryAbilityUsed?.['Armadura Primeva']) {
          state.legendaryAbilityUsed['Armadura Primeva'] = true;
          blocked = true;
          legendaryBlockMsg = '🛡️ Armadura Primeva salvou sua última vida! (1× por jogo)';
          renderEquip();
        }
        // Epic active: Máscara N95 (Segunda Chance — 1º erro não tira vida)
        if(!blocked && state.equipment?.helmet?.n==='Máscara N95' && !state.legendaryAbilityUsed?.['Máscara N95']) {
          state.legendaryAbilityUsed['Máscara N95'] = true;
          blocked = true;
          legendaryBlockMsg = '🧪 Máscara N95: Segunda Chance — seu 1º erro não tirou vida! (1× por jogo)';
          renderEquip();
        }
        if(!blocked) state.lives--;
        state.score=Math.max(0,state.score-(28-Math.min(20,st.def)));

        let lx, ly;
        const livesEl = document.getElementById('lives') || document.getElementById('msbLivesIcons');
        if (livesEl && typeof livesEl.getBoundingClientRect === 'function') {
          const rect = livesEl.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            lx = rect.left + rect.width / 2 + window.scrollX;
            ly = rect.top + rect.height / 2 + window.scrollY;
          }
        }
        if (lx === undefined || ly === undefined) {
          lx = x;
          ly = y;
        }

        if (blocked) {
          showFloatingFeedback('🛡️ Absorvido', true, lx, ly);
        } else {
          showFloatingFeedback('-1 ❤️', false, lx, ly);
        }

        ui.feedback.className='feedback bad';
        { const _prefix = legendaryBlockMsg || (blocked ? '🛡️ Errou, mas sua defesa absorveu.' : '❌ Incorreta.');
          const _snip2 = escapeHtml(_firstSentence(state.current.e, 280));
          const _full2 = escapeHtml(state.current.e || '');
          const _hasMore2 = _full2.length > _snip2.length;
          ui.feedback.innerHTML = `<strong>${escapeHtml(_prefix)}</strong><br><span class="fb-snip">${_snip2}<span style="display:none;" class="fb-rest"> ${_full2.substring(_snip2.length)}</span></span>${_hasMore2?`<button class="fb-more-btn" style="display:block;background:none;border:none;color:#93c5fd;cursor:pointer;font-size:0.8rem;padding:4px 0 0 0;margin-top:2px;" data-action="_showMoreFb" data-pass-this="1">ver mais ▾</button>`:''}` ;
          if (window.innerWidth <= 768) setTimeout(() => ui.feedback.scrollIntoView({behavior:'smooth', block:'nearest'}), 80);
        }
        renderErrorReflection(state.current.id, i);
        log('⚠️ Você falhou nessa carta. Ajuste a estratégia e continue.');
        playSound('wrong');
        // Boss log para erro
        if (isBossBattle()) {
          state.bossLog = state.bossLog || [];
          state.bossLog.push({cls:'miss', txt:`❌ Resposta errada!`});
          if (blocked) {
            if (legendaryBlockMsg) {
              state.bossLog.push({cls:'lore', txt: `${legendaryBlockMsg}`});
            } else {
              state.bossLog.push({cls:'lore', txt: `🛡️ O dano foi bloqueado!`});
            }
          } else {
            state.bossLog.push({cls:'miss', txt:`💥 O Nefromante contra-atacou!`});
            // Animação de dano no Herói (painel esquerdo)
            const leftPanel = document.querySelector('.panel.left');
            if (leftPanel) {
              leftPanel.classList.add('player-damaged');
              setTimeout(() => leftPanel.classList.remove('player-damaged'), 500);
            }
          }
        }
        saveGame();
        // Oráculo button: set journey question context for mentor, show button
        if (typeof window.setMentorQuestion === 'function') {
          const cur = state.current;
          window.setMentorQuestion({
            q: cur.q, opts: cur.o,
            ans: cur.a, exp: cur.e,
            correctOption: cur.o ? cur.o[cur.a] : ''
          });
        }
        if (ui.oraculoBtn) ui.oraculoBtn.classList.remove('hidden');
      }

      _incrementQuestionsAnswered();
      _checkPromoBanner();
      // ── Analytics: question answered ──
      _track('question_answered', {
        correct: i === state.current.a,
        difficulty: state.current.d,
        is_boss: isBossBattle(),
        boss_progress: isBossBattle() ? getBossProgress() : undefined,
        streak: state.streak,
        level: state.level,
      });
      renderHUD();
      updateBadges();
      if(state.lives<=0) {
        // Mythic active: Ressurreição Plena - revive com VIDA CHEIA (prioridade sobre o Amuleto)
        const hasMythicRevive = state.equipment?.relic?.n === 'Ressurreição Plena';
        if(hasMythicRevive && !state.legendaryAbilityUsed?.['Ressurreição Plena']) {
          state.legendaryAbilityUsed['Ressurreição Plena'] = true;
          state.lives = effectiveMaxLives();
          renderEquip();
          const mrev = document.createElement('div');
          mrev.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9990;background:linear-gradient(135deg,#1a1a2a,#3a3050);border:2px solid #fff;border-radius:16px;padding:24px 28px;text-align:center;animation:scaleIn 0.4s;box-shadow:0 0 60px rgba(255,255,255,0.4);';
          mrev.innerHTML='<div style="font-size:2rem;margin-bottom:8px">👑</div><div style="color:#fff;font-family:Cinzel,serif;font-size:1rem;margin-bottom:6px">Ressurreição Plena</div><div style="color:#e8e8f0;font-size:0.82rem">Você renasceu com VIDA CHEIA!<br><span style="color:#94a3b8;font-size:0.72rem">(1× por jogo)</span></div>';
          document.body.appendChild(mrev);
          setTimeout(()=>mrev.remove(), 3000);
          renderHUD(); saveGame(); return;
        }
        // Legendary active: Amuleto do Rim Imortal - revive once
        const hasAmulet = state.equipment?.relic?.n === 'Amuleto do Rim Imortal';
        if(hasAmulet && !state.legendaryAbilityUsed?.['Amuleto do Rim Imortal']) {
          state.legendaryAbilityUsed['Amuleto do Rim Imortal'] = true;
          state.lives = 1;
          renderEquip();
          const revNotif = document.createElement('div');
          revNotif.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9990;background:linear-gradient(135deg,#1a0a2a,#2a1040);border:2px solid var(--gold);border-radius:16px;padding:24px 28px;text-align:center;animation:scaleIn 0.4s;box-shadow:0 0 50px rgba(255,215,0,0.3);';
          revNotif.innerHTML='<div style="font-size:2rem;margin-bottom:8px">💜</div><div style="color:var(--gold);font-family:Cinzel,serif;font-size:1rem;margin-bottom:6px">Amuleto do Rim Imortal</div><div style="color:#c8d8f0;font-size:0.82rem">Você foi revivido com 1 vida!<br><span style="color:#64748b;font-size:0.72rem">(1× por jogo)</span></div>';
          document.body.appendChild(revNotif);
          setTimeout(()=>revNotif.remove(), 3000);
          renderHUD(); saveGame(); return;
        }
        finishGame();
      } else if (!_guestMode && !isPremium() && getGameStats().questionsAnsweredAllTime >= FREE_QUESTIONS_LIMIT) {
        // Convidados não bloqueiam aqui — usam _showGuestHook (hook suave em 15 questões)
        showPricingModal();
      } else {
        ui.nextBtn.classList.remove('hidden');
        if (ui.dockNextBtn) {
          ui.dockNextBtn.classList.remove('disabled');
          ui.dockNextBtn.classList.add('dock-next-ready');
          setTimeout(() => ui.dockNextBtn.classList.remove('dock-next-ready'), 600);
        }
        // ── Confronto Final: atualiza barra de HP, estrelas e botão ──
        updateBossUI();
        animateLastBossStar();
        // Botão mantém o título normal ("Próxima Carta") também no Confronto Final.
        if (isBossBattle()) ui.nextBtn.textContent = 'Próxima Carta';
      }

      if (typeof checkAchievements === 'function') {
        checkAchievements();
      }

      setTimeout(renderQuestionRatingUI, 50);
    }

    // ── Avaliação 5★ por questão (qualidade + aprendizado) ──────────────
    // Comportamento: estrelas escuras → preenchem ao passar o mouse (amarelo
    // para qualidade, azul para aprendizado) → cor fixada ao clicar. Sem
    // mensagem de confirmação. O envio é diferido (flush) ao avançar de
    // questão ou sair da página.
    const RATING_COLOR = { quality: '#fbbf24', learning: '#38bdf8' };
    const RATING_DARK = 'rgba(255,255,255,0.22)';
    let _pendingRating = null; // { qid, qtext, quality, learning, saved }

    async function flushPendingRating() {
      const p = _pendingRating;
      _pendingRating = null;
      if (!p || p.saved) return;
      // A tabela exige ambas as notas (1–5). Só persiste quando as duas existem.
      if (p.quality > 0 && p.learning > 0) {
        await submitQuestionRating(p.qid, p.qtext, p.quality, p.learning);
      }
    }

    function renderQuestionRatingUI() {
      const q = state.current;
      if (!q) return;
      const qid = q.qid || q.id;
      if (!qid) return;

      let rated = {};
      try {
        rated = JSON.parse(localStorage.getItem('nefroquest-rated-questions') || '{}');
      } catch (e) {}
      const prev = rated[qid] || null;

      let diffVotes = {};
      try { diffVotes = JSON.parse(localStorage.getItem('nefroquest-difficulty-votes') || '{}'); } catch (e) {}
      const prevDiff = diffVotes[qid] || '';
      const curDiff = q._d || q.diff || 'medium';

      _pendingRating = {
        qid,
        qtext: (q.q || '').substring(0, 200),
        quality: prev ? (prev.quality || 0) : 0,
        learning: prev ? (prev.learning || 0) : 0,
        saved: !!prev
      };

      const ratingDiv = document.createElement('div');
      ratingDiv.id = 'qRatingContainer';
      ratingDiv.className = 'q-rating-container';
      const starsFor = () => [1,2,3,4,5].map(v => `<span class="star-rating" data-value="${v}">★</span>`).join('');
      const diffBtn = (v, label) => `<button type="button" class="qr-diff-btn${prevDiff === v ? ' selected' : ''}" data-diff="${v}">${label}</button>`;
      ratingDiv.innerHTML = `
        <div class="qr-left">
          <div class="qr-title">Avalie esta questão</div>
          <div class="qr-sub">(feedback opcional)</div>
          <div class="qr-diff">
            <div class="qr-diff-btns">${diffBtn('easy','Fácil')}${diffBtn('medium','Médio')}${diffBtn('hard','Difícil')}</div>
          </div>
        </div>
        <div class="qr-right">
          <div class="qr-line">
            <span class="qr-label">Qualidade:</span>
            <div class="stars-row" data-rating-type="quality">${starsFor()}</div>
          </div>
          <div class="qr-line">
            <span class="qr-label">Aprendizado:</span>
            <div class="stars-row" data-rating-type="learning">${starsFor()}</div>
          </div>
          <button type="button" class="q-flag-link" data-action="flagQuestion">sinalizar questão problemática</button>
        </div>
      `;
      ui.feedback.appendChild(ratingDiv);

      ratingDiv.querySelectorAll('.stars-row').forEach(row => {
        const type = row.dataset.ratingType;
        const color = RATING_COLOR[type];
        const stars = [...row.querySelectorAll('.star-rating')];

        const paint = (n) => stars.forEach((s, i) => {
          const on = i < n;
          s.style.color = on ? color : RATING_DARK;
          s.style.textShadow = on ? `0 0 6px ${color}88` : 'none';
        });
        const selected = () => _pendingRating ? (_pendingRating[type] || 0) : 0;

        paint(selected());

        stars.forEach(star => {
          const val = parseInt(star.dataset.value);
          star.addEventListener('mouseenter', () => paint(val));
          star.addEventListener('click', () => {
            if (_pendingRating) { _pendingRating[type] = val; _pendingRating.saved = false; }
            paint(val);
          });
        });
        row.addEventListener('mouseleave', () => paint(selected()));
      });

      // Classificação de dificuldade pelo usuário (alimenta a reclassificação do banco)
      const diffBtns = [...ratingDiv.querySelectorAll('.qr-diff-btn')];
      diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const vote = btn.dataset.diff;
          diffBtns.forEach(b => b.classList.toggle('selected', b === btn));
          submitDifficultyVote(qid, vote, curDiff);
        });
      });
    }

    // ── PED-1: Raciocínio guiado no erro ──────────────────────────────────
    // Ao errar na jornada, o jogador pode nomear o PRÓPRIO erro de raciocínio
    // (metacognição). Categorias universais — não exigem metadados por questão.
    // O registro (local + Supabase) alimenta o card "Padrões de Raciocínio" no
    // dashboard e, agregado por questão/distrator no admin, prepara o
    // mapeamento automático de distratores no futuro.
    const ERROR_REASONS = {
      knowledge:   { chip: '🧠 Não sabia o conteúdo',                name: 'Lacuna de conhecimento', tip: 'O mais honesto dos erros. Releia a explicação acima com calma agora — este é o melhor momento para fixar; a questão voltará na sua revisão.' },
      between_two: { chip: '⚖️ Fiquei entre duas',                   name: 'Discriminação fina',     tip: 'Você sabia o tema; faltou o detalhe que separa as duas. Compare agora a alternativa que escolheu com a correta e nomeie a diferença em uma frase.' },
      confusion:   { chip: '🔀 Confundi conceitos parecidos',        name: 'Confusão de protótipos', tip: 'Entidades parecidas dividem a mesma gaveta mental. Estude-as em contraste explícito ("X cursa com A; Y cursa com B"), nunca isoladas.' },
      anchoring:   { chip: '⚓ Me fixei num dado e ignorei o resto', name: 'Ancoragem',              tip: 'O primeiro dado vira âncora e os demais são subvalorizados. Antídoto: antes de responder, pergunte-se "qual dado NÃO encaixa na minha hipótese?".' },
      misread:     { chip: '📖 Li rápido / não vi o que era pedido', name: 'Erro de leitura',        tip: 'Releia o comando da questão (a última frase) antes das alternativas e marque palavras como EXCETO, INCORRETA e "mais provável".' },
      guess:       { chip: '🎲 Chutei',                              name: 'Chute',                  tip: 'No jogo vale; no estudo é sinal de lacuna. Anote o tema e cobre-se dele depois — o chute só ensina quando vira pergunta.' }
    };

    // Momento visual calmo (sem shake/confete): o erro é convite reflexivo.
    function renderErrorReflection(qid, chosenIdx) {
      const wrap = document.createElement('div');
      wrap.className = 'err-reflect';
      wrap.dataset.qid = qid || '';
      wrap.dataset.idx = String(chosenIdx);
      wrap.innerHTML = `
        <div class="err-reflect-title">🪞 Por que você escolheu essa? <span class="err-reflect-sub">(opcional — te ajuda a conhecer seus padrões)</span></div>
        <div class="err-reflect-chips">${Object.entries(ERROR_REASONS).map(([k, r]) =>
          `<button type="button" class="err-reflect-chip" data-action="_pickErrorReason" data-pass-this="1" data-reason="${k}">${r.chip}</button>`).join('')}</div>`;
      ui.feedback.appendChild(wrap);
    }

    window._pickErrorReason = function(el) {
      const def = ERROR_REASONS[el.dataset.reason];
      const wrap = el.closest('.err-reflect');
      if (!def || !wrap) return;
      if (typeof playSound === 'function') playSound('click');
      submitErrorReason(wrap.dataset.qid, parseInt(wrap.dataset.idx, 10), el.dataset.reason);
      const lesson = document.createElement('div');
      lesson.className = 'err-reflect-lesson';
      lesson.innerHTML = `<strong>${def.name}.</strong> ${def.tip}`;
      wrap.querySelector('.err-reflect-chips').replaceWith(lesson);
    };

    async function submitErrorReason(qid, chosenIdx, reason) {
      try {
        const data = JSON.parse(localStorage.getItem('nefroquest-error-reasons') || '{"counts":{},"log":[]}');
        data.counts[reason] = (data.counts[reason] || 0) + 1;
        data.log.push({ qid, idx: chosenIdx, reason, ts: Date.now() });
        if (data.log.length > 300) data.log = data.log.slice(-300);
        localStorage.setItem('nefroquest-error-reasons', JSON.stringify(data));
      } catch (e) {}
      if (typeof _track === 'function') _track('error_reflection', { reason });
      if (typeof _supaClient !== 'undefined' && _supaClient) {
        try {
          await _supaClient.from('question_error_reasons').insert([{
            question_id: qid || null,
            chosen_idx: Number.isFinite(chosenIdx) ? chosenIdx : null,
            reason,
            player_email: (window.authUser && window.authUser.email) || 'anonimo',
            created_at: new Date().toISOString()
          }]);
        } catch (err) { console.error('[NQ] error reason insert', err); }
      }
    }

    // Registra o voto de dificuldade do usuário (local + Supabase). Uma vez por
    // questão por usuário (reenvia se mudar de opinião). Alimenta a
    // reclassificação inteligente do banco no painel admin.
    async function submitDifficultyVote(qid, vote, currentDiff) {
      if (!qid || !['easy', 'medium', 'hard'].includes(vote)) return;
      let votes = {};
      try { votes = JSON.parse(localStorage.getItem('nefroquest-difficulty-votes') || '{}'); } catch (e) {}
      if (votes[qid] === vote) return; // já votou isso — evita spam
      votes[qid] = vote;
      try { localStorage.setItem('nefroquest-difficulty-votes', JSON.stringify(votes)); } catch (e) {}
      if (typeof playSound === 'function') playSound('click');
      if (typeof _supaClient !== 'undefined' && _supaClient) {
        try {
          await _supaClient.from('question_difficulty_votes').insert([{
            question_id: qid,
            vote,
            current_diff: currentDiff || null,
            player_email: (window.authUser && window.authUser.email) || 'anonimo',
            created_at: new Date().toISOString()
          }]);
        } catch (err) { console.error('[NQ] difficulty vote error', err); }
      }
    }

    async function submitQuestionRating(qid, qtext, qualityVal, learningVal) {
      if (!qid) return;

      const ratingData = {
        question_id: qid,
        question_text: qtext,
        rating_quality: qualityVal,
        rating_learning: learningVal,
        player_email: (window.authUser && window.authUser.email) || 'anonimo',
        player_name: (window.authUser && window.authUser.user_metadata && (window.authUser.user_metadata.full_name || window.authUser.user_metadata.name)) || 'Visitante',
        created_at: new Date().toISOString()
      };

      // Guardar localmente (marca como avaliada — evita reenvio)
      try {
        const rated = JSON.parse(localStorage.getItem('nefroquest-rated-questions') || '{}');
        rated[qid] = { quality: qualityVal, learning: learningVal };
        localStorage.setItem('nefroquest-rated-questions', JSON.stringify(rated));
      } catch (e) {}

      if (typeof _supaClient !== 'undefined' && _supaClient) {
        try {
          const { error } = await _supaClient
            .from('question_ratings')
            .insert([ratingData]);
          if (error) console.error('[NQ] Rating save error', error);
        } catch (err) {
          console.error('[NQ] Rating save exception', err);
        }
      }
    }

    function finishDeck(){
      // Re-embaralhar automaticamente o baralho com nova ordem aleatória
      // (evitando repetir a última questão do ciclo anterior)
      shuffleQueue();
      // Notificar o jogador com mensagem temporária no feedback
      ui.feedback.className = 'feedback good';
      ui.feedback.textContent = '✅ Baralho completo! Embaralhando novamente...';
      // Avançar para a próxima questão após breve pausa
      setTimeout(() => {
        ui.feedback.textContent = '';
        ui.feedback.className = 'feedback';
        renderQuestion();
      }, 1800);
    }

    function bonusCost(){ return 1500; }

    // Variável temporária para guardar score ao final
    let pendingScore = null;
    
    function finishGame(){
      // Atualizar estatísticas e limpar save
      updateGameStats();
      deleteSave();
      pendingScore = {score: state.score, level: state.level};

      // Se usuário autenticado, pular modal de nome
      if (authUser) {
        const name = _authDisplayName();
        boardPush(pendingScore.score, pendingScore.level, name);
        if (typeof profileStatsPush === 'function') profileStatsPush();
        pendingScore = null;
        finishGameUI();
        if (typeof _syncProgressToCloud === 'function') {
          _syncProgressToCloud().catch(() => {});
        }
        return;
      }

      // Guardar score e abrir modal de nome (convidado)
      document.getElementById('nameModal').classList.add('show');
      const input = document.getElementById('playerName');
      input.value = state.lastSubmittedName || '';
      input.focus();
      input.onkeypress = (e) => {
        if (e.key === 'Enter') saveScore();
      };
    }

    function buyBonusQuestion(){
      if(state.bonusUses >= 1){ log('🚫 Você já usou sua pergunta bônus nesta jornada!'); return; }
      const cost=bonusCost();
      if(state.gold<cost||state.lives>0) return;
      document.body.classList.remove('rd-game-over');
      state.gold-=cost;
      state.bonusUses++;
      state.lives=1;
      state.gameOver=false;
      log(`✨ Pergunta Bônus comprada por ${cost} ouro. A jornada continua.`);
      renderHUD();
      updateBadges();
      renderQuestion();
    }

    // === POPUP DE CONFIRMAÇÃO MOBILE (Forjar / Lendário / Baú) ===
    function showActionConfirmPopup(type) {
      // Remove popup anterior se existir
      const existing = document.getElementById('mobileActionConfirm');
      if(existing) existing.remove();

      const configs = {
        forge: {
          title: '🔨 Forjar Item',
          desc: 'Forja um item aleatório para seu equipamento. A raridade depende do seu nível e sorte.',
          cost: 300,
          costColor: '#fb923c',
          btnClass: '',
          btnLabel: 'FORJAR AGORA',
          action: () => _forgeItemDirect()
        },
        legendary: {
          title: '⭐ Forjar Lendário',
          desc: 'Garante um item lendário para um slot aleatório. Poder máximo!',
          cost: 1000,
          costColor: '#d8b4fe',
          btnClass: 'legendary',
          btnLabel: 'FORJAR LENDÁRIO',
          action: () => _forgeLegendaryDirect()
        },
        chest: {
          title: '📦 Abrir Baú',
          desc: 'Desbloqueia um artigo científico de nefrologia e ganha +Conhecimento.',
          cost: chestCost,
          costColor: '#fbbf24',
          btnClass: 'chest',
          btnLabel: 'ABRIR BAÚ',
          action: () => _openChestDirect()
        }
      };

      const cfg = configs[type];
      if(!cfg) return;

      const canAfford = state.gold >= cfg.cost;
      const popup = document.createElement('div');
      popup.id = 'mobileActionConfirm';
      popup.className = 'mobile-action-confirm';
      popup.innerHTML = `
        <div class="mac-title">${cfg.title}</div>
        <div class="mac-desc">${cfg.desc}</div>
        <div class="mac-cost" style="color:${cfg.costColor}">💰 ${cfg.cost} ouro</div>
        <div class="mac-gold-avail">Seu ouro: <strong style="color:${canAfford?'#ffd700':'#ef4444'}">${state.gold}</strong>${canAfford ? ' ✓' : ' — insuficiente'}</div>
        <div class="mac-btns">
          <button class="mac-btn mac-cancel" data-remove-id="mobileActionConfirm">CANCELAR</button>
          <button class="mac-btn mac-confirm ${cfg.btnClass}" ${canAfford?'':'disabled style="opacity:0.4;pointer-events:none;"'}
            data-remove-id="mobileActionConfirm" data-action="_mobileCallback" data-arg="${type}">
            ${cfg.btnLabel}
          </button>
        </div>
      `;

      // Fechar ao clicar fora — listener único (evita acúmulo por taps rápidos)
      if (showActionConfirmPopup._listener) {
        document.removeEventListener('click', showActionConfirmPopup._listener);
      }
      setTimeout(() => {
        showActionConfirmPopup._listener = function closeConfirm(e) {
          if (!popup.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', showActionConfirmPopup._listener);
            showActionConfirmPopup._listener = null;
          }
        };
        document.addEventListener('click', showActionConfirmPopup._listener);
      }, 100);

      document.body.appendChild(popup);
    }

    // Expor popup no escopo global para uso via onclick no HTML
    window.showMobileActionConfirm = showActionConfirmPopup;
    window.closeChestModal = closeChestModal;

    // Modal da Forja — duas opções: item comum e lendário
    function showForjaModal() {
      const existing = document.getElementById('forjaModal');
      if(existing) existing.remove();

      const goldForge = 300, goldLeg = 1000;
      const canForge = state.gold >= goldForge;
      const canLeg   = state.gold >= goldLeg;

      const modal = document.createElement('div');
      modal.id = 'forjaModal';
      modal.className = 'nq-overlay';
      modal.style.cssText = 'z-index:9100;background:rgba(0,0,0,0.72);padding:24px 16px;';
      modal.innerHTML = `
        <div style="
          position:relative;
          background:linear-gradient(160deg,rgba(18,26,54,0.99),rgba(10,16,38,0.99));
          border:1px solid rgba(255,215,0,0.35);border-radius:18px;
          padding:28px 24px 20px;min-width:310px;max-width:380px;width:90%;
          max-height:calc(100vh - 48px);overflow-y:auto;
          box-shadow:0 8px 48px rgba(0,0,0,0.9),0 0 0 1px rgba(255,215,0,0.08) inset;
        ">
          <button type="button" data-remove-id="forjaModal" style="position: absolute; top: 12px; right: 16px; background: none; border: none; color: #6b7db8; font-size: 1.2rem; cursor: pointer; z-index: 10;">✕</button>
          <h3 style="color:#fb923c;font-family:'Cinzel',serif;font-size:1.15rem;text-align:center;margin:0 0 6px;letter-spacing:1px;">🔥 FORJA</h3>
          <p style="color:#6b7db8;font-family:'Philosopher',serif;font-size:0.78rem;text-align:center;margin:0 0 20px;">Escolha o tipo de forjamento</p>

          <div style="display:flex;flex-direction:column;gap:12px;">

            <!-- Forjar Item Comum -->
            <div style="
              background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,${canForge?'0.4':'0.18'});
              border-radius:12px;padding:14px 16px;
              ${!canForge?'opacity:0.5;':''}
            ">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="color:#fb923c;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;">⚒️ Item Comum</span>
                <span style="color:#ffd700;font-family:'Cinzel',serif;font-size:0.75rem;">💰 300</span>
              </div>
              <p style="color:#9aabcc;font-family:'Philosopher',serif;font-size:0.73rem;margin:0 0 10px;line-height:1.4;">Forja um item aleatório. A raridade depende do seu nível e sorte.</p>
              <button data-remove-id="forjaModal" data-action="_mobileCallback" data-arg="forge"
                ${canForge?'':'disabled'}
                style="width:100%;padding:8px;background:${canForge?'linear-gradient(135deg,rgba(251,146,60,0.35),rgba(200,100,30,0.3))':'rgba(255,255,255,0.04)'};
                border:1px solid rgba(251,146,60,${canForge?'0.6':'0.2'});border-radius:8px;
                color:${canForge?'#fb923c':'#555'};font-family:'Cinzel',serif;font-size:0.7rem;
                font-weight:700;letter-spacing:1px;cursor:${canForge?'pointer':'not-allowed'};">
                FORJAR AGORA
              </button>
            </div>

            <!-- Forjar Lendário -->
            <div style="
              background:rgba(192,132,252,0.08);border:1px solid rgba(192,132,252,${canLeg?'0.4':'0.18'});
              border-radius:12px;padding:14px 16px;
              ${!canLeg?'opacity:0.5;':''}
            ">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="color:#d8b4fe;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;">⭐ Item Lendário</span>
                <span style="color:#ffd700;font-family:'Cinzel',serif;font-size:0.75rem;">💰 1000</span>
              </div>
              <p style="color:#9aabcc;font-family:'Philosopher',serif;font-size:0.73rem;margin:0 0 10px;line-height:1.4;">Garante um item lendário para um slot aleatório. Poder máximo!</p>
              <button data-remove-id="forjaModal" data-action="_mobileCallback" data-arg="legendary"
                ${canLeg?'':'disabled'}
                style="width:100%;padding:8px;background:${canLeg?'linear-gradient(135deg,rgba(192,132,252,0.3),rgba(140,80,220,0.25))':'rgba(255,255,255,0.04)'};
                border:1px solid rgba(192,132,252,${canLeg?'0.6':'0.2'});border-radius:8px;
                color:${canLeg?'#d8b4fe':'#555'};font-family:'Cinzel',serif;font-size:0.7rem;
                font-weight:700;letter-spacing:1px;cursor:${canLeg?'pointer':'not-allowed'};">
                FORJAR LENDÁRIO
              </button>
            </div>

          </div>

          <div style="color:#4a5878;font-family:'Philosopher',serif;font-size:0.72rem;text-align:center;margin-top:14px;">
            Ouro disponível: <strong style="color:#ffd700;">${state.gold}</strong>
          </div>

          <button data-remove-id="forjaModal"
            style="margin-top:14px;width:100%;padding:7px;background:rgba(255,255,255,0.07);
            border:1px solid rgba(255,255,255,0.35);border-radius:8px;color:#c0cfe8;
            font-family:'Cinzel',serif;font-size:0.68rem;cursor:pointer;letter-spacing:1px;">
            FECHAR
          </button>
        </div>
      `;

      // modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });
      document.body.appendChild(modal);
    }
    window.showForjaModal = showForjaModal;

    function closeBoardModal() {
      document.getElementById('boardModal').classList.add('hidden');
    }
    function closeCharSelectModal() {
      document.getElementById('charSelectModal').classList.remove('show');
    }
    function closeNameModal() {
      document.getElementById('nameModal').classList.remove('show');
    }
    window.closeBoardModal = closeBoardModal;
    window.closeCharSelectModal = closeCharSelectModal;
    window.closeNameModal = closeNameModal;

    // Callbacks das ações (chamados pelo popup)
    window._mobileActionCallbacks = {
      forge: () => _forgeItemDirect(),
      legendary: () => _forgeLegendaryDirect(),
      chest: () => _openChestDirect()
    };

    // Funções internas diretas (sem interceptação)
    function _forgeItemDirect(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if(allItemsMaxed()){ log('🏆 Você já possui todos os equipamentos lendários!'); return; }
      const cost=300;
      if(state.gold<cost){ log('🧱 Ouro insuficiente! Precisa de 300 ouro para forjar.'); return; }
      state.gold-=cost;
      const st=total();
      const rolled=rollItem(state.level, st.luck);
      const gains=[`⚔️ ATK ${rolled.item.atk}`, `🛡️ DEF ${rolled.item.def}`, `📚 CONH ${rolled.item.kno}`, `🍀 SORTE ${rolled.item.luck}`];
      playSound('forge');
      equipOrSell(rolled.slot, rolled.item, (msg) => {
        showForgePopup(rolled.item, rolled.slot, gains);
        log(`🔨 Forja concluída! ${msg}`);
        renderHUD();
        updateBadges();
        saveGame();
      });
    }

    function _forgeLegendaryDirect(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if(allItemsMaxed()){ log('🏆 Você já possui todos os equipamentos lendários!'); return; }
      const cost=1000;
      if(state.gold<cost){ log('🧱 Ouro insuficiente! Precisa de 1000 ouro para forjar lendário.'); return; }
      state.gold-=cost;
      const equipped = Object.values(state.equipment).map(e=>e.n);
      const obtained = Array.isArray(state.obtainedItems) ? state.obtainedItems : [];
      const seen = new Set([...equipped, ...obtained]);
      // Slots que ainda têm algum lendário inédito
      const freshSlots = ['weapon', 'armor', 'relic'].filter(slot =>
        items[slot].some(i => i.rar === 'legendary' && !seen.has(i.n)));
      const keys = freshSlots.length>0 ? freshSlots : ['weapon', 'armor', 'relic'];
      const slot=keys[Math.floor(Math.random()*keys.length)];
      let legendaryItems = items[slot].filter(i => i.rar === 'legendary' && !seen.has(i.n));
      if(legendaryItems.length === 0) legendaryItems = items[slot].filter(i => i.rar === 'legendary' && !equipped.includes(i.n));
      if(legendaryItems.length === 0){ log('🏆 Você já forjou todos os lendários deste tipo!'); state.gold+=cost; return; }
      const legendaryItem = legendaryItems[Math.floor(Math.random()*legendaryItems.length)];
      _markObtained(legendaryItem.n);
      const legendaryItemCopy = {...legendaryItem};
      const gains = [`⚔️ ATK ${legendaryItem.atk}`, `🛡️ DEF ${legendaryItem.def}`, `📚 CONH ${legendaryItem.kno}`, `🍀 SORTE ${legendaryItem.luck}`];
      playSound('forge');
      equipOrSell(slot, legendaryItemCopy, (msg) => {
        showForgePopup(legendaryItemCopy, slot, gains);
        log(`🔨 Forja Lendária! ${msg}`);
        renderHUD(); updateBadges(); saveGame();
      });
    }

    function _openChestDirect(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if (state.correctTotal < CHEST_MIN_CORRECT) {
        log(`📚 Você precisa de pelo menos ${CHEST_MIN_CORRECT} acertos para abrir um baú! (Atual: ${state.correctTotal})`);
        return;
      }
      if (state.gold < chestCost) {
        log('💰 Ouro insuficiente! Você precisa de ' + chestCost + ' ouro.');
        return;
      }
      const availableArticles = nefroArticles.filter((_, idx) => !unlockedArticles.includes(idx));
      if (availableArticles.length === 0) {
        log('🎉 Você já desbloqueou todos os artigos!');
        return;
      }
      state.gold -= chestCost;
      const randomArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
      const articleIndex = nefroArticles.indexOf(randomArticle);
      unlockedArticles.push(articleIndex);
      localStorage.setItem('unlockedArticles', JSON.stringify(unlockedArticles));
      state.chestsOpened++;
      const knoGain = state.chestsOpened;
      if(state.equipment.relic && state.equipment.relic.n !== 'Vazio') { const r={...state.equipment.relic}; r.kno=(r.kno||0)+knoGain; state.equipment.relic=r; }
      const chestPoints = 30 + state.chestsOpened * 10;
      state.score += chestPoints;
      showChestModal(randomArticle, knoGain, chestPoints);
      playSound('chest');
      log(`📚 Baús abertos: ${state.chestsOpened} — +${knoGain} Conhecimento, +${chestPoints} pontos!`);
      chestCost = Math.min(chestCost + 15, 250);
      log('📦 Artigo desbloqueado: ' + randomArticle.titulo);
      renderHUD();
      updateBadges();
      saveGame();
    }

    function showForgePopup(item, slot, gains, title = '🔨 Forja Concluída!'){
      const icon = getItemIcon(item.n, slot);
      const desc = itemDescriptions[item.n] || '';
      const rarLabels = {common:'Comum', uncommon:'Incomum', rare:'Raro', epic:'Épico', legendary:'Lendário'};
      const popup = document.createElement('div');
      popup.className='forge-popup';
      popup.innerHTML=`
        <div class='forge-card'>
          <h3>${title}</h3>
          <img src='${icon}' alt='${item.n}'/>
          <p class='rar-${item.rar}' style='font-size:1.1rem;font-weight:700'>${item.n}</p>
          <p style='font-size:0.72rem;color:var(--txt-dim);margin-bottom:2px'>${slotLabels[slot]} &nbsp;·&nbsp; <span class='rar-${item.rar}'>${rarLabels[item.rar]||item.rar}</span></p>
          ${desc ? `<p class='nq-quote'>${desc}</p>` : ''}
          <div class='forge-stats'>
            ${gains.length>0 ? gains.join(' &nbsp;·&nbsp; ') : '🔄 Nenhum atributo melhorou desta vez...'}
          </div>
          <button class='btn gold' data-close-closest=".forge-popup">Continuar</button>
        </div>
      `;
      document.body.appendChild(popup);
      // popup.addEventListener('click',(e)=>{if(e.target===popup) popup.remove();});
    }


    // ============ MILESTONE DE OURO ============
    const GOLD_MILESTONE = 100;
    const GOLD_MILESTONE_KEY = 'nefroquest-gold-milestone-shown';
    // Persistido: o aviso aparece apenas na PRIMEIRA vez que o jogador chega a
    // 100 de ouro — nunca mais (mesmo após gastar e reacumular, ou recarregar).
    let _goldMilestoneShown = (() => { try { return localStorage.getItem(GOLD_MILESTONE_KEY) === '1'; } catch (e) { return false; } })();

    function checkGoldMilestone(prevGold) {
      if (_goldMilestoneShown) return;
      if (prevGold < GOLD_MILESTONE && state.gold >= GOLD_MILESTONE) {
        _goldMilestoneShown = true;
        try { localStorage.setItem(GOLD_MILESTONE_KEY, '1'); } catch (e) {}
        setTimeout(showGoldMilestonePopup, 600);
      }
    }

    function showGoldMilestonePopup() {
      document.getElementById('goldMilestonePopup')?.remove();
      const popup = document.createElement('div');
      popup.id = 'goldMilestonePopup';
      popup.className = 'nq-overlay';
      popup.style.cssText = 'z-index:9998;background:rgba(0,0,0,0.7);';
      popup.innerHTML = `
        <div style="position:relative;background:linear-gradient(160deg,#1a2a0a,#0e1830,#2a1a00);border:2px solid #ffd700;border-radius:16px;padding:26px 24px;max-width:440px;width:100%;box-shadow:0 0 50px rgba(255,215,0,0.25);text-align:center;animation:scaleIn 0.35s;">
          <button type="button" data-remove-id="goldMilestonePopup" style="position: absolute; top: 12px; right: 16px; background: none; border: none; color: #ffd700; font-size: 1.2rem; cursor: pointer; z-index: 10;">✕</button>
          <div style="font-size:2.4rem;margin-bottom:8px;">💰</div>
          <h3 style="color:#ffd700;font-family:'Cinzel',serif;font-size:1.05rem;letter-spacing:1px;margin-bottom:6px;">${GOLD_MILESTONE} de Ouro!</h3>
          <p style="color:#c8d8f0;font-size:0.85rem;line-height:1.6;margin-bottom:18px;">
            Você acumulou ouro! O ouro é um recurso precioso que pode ser utilizado de várias maneiras estratégicas na sua jornada:
          </p>
          <div style="display:flex;flex-direction:column;gap:10px;text-align:left;">
            <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 14px;">
              <span style="color:#a5b4fc;font-weight:700;">⚒️ Forja de Equipamentos</span>
              <span style="color:#94a3b8;font-size:0.8rem;"> — 300 / 1000 ouro</span>
              <p style="color:#cbd5e1;font-size:0.78rem;margin:4px 0 0;">Use a Forja para criar equipamentos comuns (300 ouro) ou lendários (1000 ouro) e fortalecer seus atributos.</p>
            </div>
            <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:12px 14px;">
              <span style="color:#fca5a5;font-weight:700;">❤️ Pergunta Bônus ao Final</span>
              <span style="color:#94a3b8;font-size:0.8rem;"> — 1500 ouro</span>
              <p style="color:#cbd5e1;font-size:0.78rem;margin:4px 0 0;">Caso perca todas as vidas no meio da jornada, use 1500 de ouro para comprar uma pergunta bônus (renascer) e continuar pontuando.</p>
            </div>
          </div>
          <button data-remove-id="goldMilestonePopup"
            style="margin-top:20px;width:100%;background:linear-gradient(180deg,#b8860b,#7a5a00);border:2px solid #ffd700;color:#fff8dc;border-radius:8px;padding:11px;font-family:'Cinzel',serif;font-size:0.82rem;font-weight:700;letter-spacing:1px;cursor:pointer;text-transform:uppercase;">
            Entendido!
          </button>
        </div>`;
      document.body.appendChild(popup);
      playSound('chest');
    }

    // Sistema de Baús
    let chestCost = 100;
    const CHEST_MIN_CORRECT = 3;
    
    function openChest() {
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if (state.correctTotal < CHEST_MIN_CORRECT) {
        log(`📚 Você precisa de pelo menos ${CHEST_MIN_CORRECT} acertos para abrir um baú! (Atual: ${state.correctTotal})`);
        return;
      }
      if (state.gold < chestCost) {
        log('💰 Ouro insuficiente! Você precisa de ' + chestCost + ' ouro.');
        return;
      }
      
      const availableArticles = nefroArticles.filter((_, idx) => !unlockedArticles.includes(idx));
      
      if (availableArticles.length === 0) {
        log('🎉 Você já desbloqueou todos os artigos!');
        return;
      }
      
      state.gold -= chestCost;
      const randomArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
      const articleIndex = nefroArticles.indexOf(randomArticle);
      
      unlockedArticles.push(articleIndex);
      localStorage.setItem('unlockedArticles', JSON.stringify(unlockedArticles));
      
      // Conhecimento progressivo: baú N dá +N conhecimento
      state.chestsOpened++;
      const knoGain = state.chestsOpened;
      if(state.equipment.relic && state.equipment.relic.n !== 'Vazio') { const r={...state.equipment.relic}; r.kno=(r.kno||0)+knoGain; state.equipment.relic=r; }
      
      // Pontos por abrir baú (sem XP para não bagunçar progressão)
      const chestPoints = 30 + state.chestsOpened * 10;
      state.score += chestPoints;
      
      showChestModal(randomArticle, knoGain, chestPoints);
      playSound('chest');
      log(`📚 Baús abertos: ${state.chestsOpened} — +${knoGain} Conhecimento, +${chestPoints} pontos!`);
      chestCost = Math.min(chestCost + 15, 250);
      
      log('📦 Artigo desbloqueado: ' + randomArticle.titulo);
      renderHUD();
      updateBadges();
      saveGame();
    }
    
    function triggerChestRewardPopup() {
      if(state.gameOver){ return; }
      const popup = document.createElement('div');
      popup.className = 'narrative-popup';
      popup.id = 'autoChestPopup';
      
      popup.innerHTML = `
        <style>
          @keyframes chestOpenAnim {
            0% { transform: scale(1) rotate(0deg); }
            15% { transform: scale(1.1) rotate(-8deg); }
            30% { transform: scale(1.1) rotate(8deg); }
            45% { transform: scale(1.15) rotate(-4deg); }
            60% { transform: scale(1.15) rotate(4deg); }
            75% { transform: scale(1.2) rotate(0deg); filter: drop-shadow(0 0 35px rgba(251, 191, 36, 0.95)); }
            100% { transform: scale(0); opacity: 0; }
          }
          /* Pulso no TEXTO (o keyframe global "pulse" anima box-shadow e criava
             uma barra retangular de sombra atravessando o card) */
          @keyframes chestCallPulse {
            0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(251,191,36,0.4); }
            50% { opacity: 0.72; text-shadow: 0 0 18px rgba(251,191,36,0.8); }
          }
          @keyframes chestFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-9px); }
          }
          @keyframes chestShadowSync {
            0%, 100% { transform: scaleX(1); opacity: 0.55; }
            50% { transform: scaleX(0.82); opacity: 0.35; }
          }
          .chest-img-clickable {
            width: 150px;
            cursor: pointer;
            display: block;
            margin: 14px auto 0;
            filter: drop-shadow(0 0 14px rgba(240, 192, 64, 0.35));
            transition: filter 0.2s;
            animation: chestFloat 2s ease-in-out infinite;
          }
          .chest-img-clickable svg { display: block; width: 100%; height: auto; }
          .chest-img-clickable:hover {
            filter: drop-shadow(0 0 24px rgba(240, 192, 64, 0.65));
          }
          .chest-img-clickable.opening {
            animation: chestOpenAnim 0.6s ease-in-out forwards;
            pointer-events: none;
          }
          .chest-ground-shadow {
            width: 130px; height: 18px; margin: 2px auto 0;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, transparent 72%);
            border-radius: 50%;
            animation: chestShadowSync 2s ease-in-out infinite;
          }
        </style>
        <div class="narrative-card" style="border-color: #fbbf24; box-shadow: 0 0 40px rgba(251, 191, 36, 0.45); overflow: visible !important;">
          <div class="narr-chapter" style="color: #fbbf24;">Encontro Inesperado</div>
          <h3>✨ Baú de Relíquias Ancestrais</h3>

          <div style="padding: 6px 0 14px; overflow: visible !important; display: block;">
            <div class="chest-img-clickable" role="button" aria-label="Abrir baú" data-action="_animateAndClaimChest" data-pass-this="1">
              <svg viewBox="0 0 200 162" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="nqChestWood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#2b1a58"/><stop offset="1" stop-color="#160d33"/>
                  </linearGradient>
                  <linearGradient id="nqChestLid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#3c2674"/><stop offset="1" stop-color="#211244"/>
                  </linearGradient>
                  <linearGradient id="nqChestGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#f6d36b"/><stop offset="0.5" stop-color="#d4a73c"/><stop offset="1" stop-color="#96701f"/>
                  </linearGradient>
                  <radialGradient id="nqChestAura" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stop-color="#ffd75e" stop-opacity="0.32"/><stop offset="1" stop-color="#ffd75e" stop-opacity="0"/>
                  </radialGradient>
                  <filter id="nqChestBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter>
                </defs>
                <ellipse cx="100" cy="86" rx="92" ry="62" fill="url(#nqChestAura)"/>
                <rect x="28" y="82" width="144" height="66" rx="7" fill="url(#nqChestWood)" stroke="#0b0620" stroke-width="2.5"/>
                <path d="M31 104h138M31 126h138" stroke="#0b0620" stroke-width="1.5" opacity="0.5"/>
                <path d="M28 82 v-16 q0 -38 38 -38 h68 q38 0 38 38 v16 z" fill="url(#nqChestLid)" stroke="#0b0620" stroke-width="2.5"/>
                <path d="M42 82 v-15 q0 -28 26 -30 M158 82 v-15 q0 -28 -26 -30" stroke="#0b0620" stroke-width="1.3" fill="none" opacity="0.4"/>
                <path d="M46 38 q22 -14 54 -15" stroke="#ffffff" stroke-width="5" fill="none" opacity="0.07" stroke-linecap="round"/>
                <path d="M85 27 q15 -11 30 0" fill="none" stroke="url(#nqChestGold)" stroke-width="7" stroke-linecap="round"/>
                <rect x="30" y="84" width="140" height="3.4" rx="1.7" fill="#ffd75e" opacity="0.85" filter="url(#nqChestBlur)"/>
                <rect x="24" y="142" width="152" height="13" rx="5" fill="url(#nqChestGold)" stroke="#5d4413" stroke-width="1.6"/>
                <rect x="24" y="74" width="152" height="13" rx="5" fill="url(#nqChestGold)" stroke="#5d4413" stroke-width="1.6"/>
                <rect x="50" y="87" width="13" height="55" rx="3" fill="url(#nqChestGold)" stroke="#5d4413" stroke-width="1.4"/>
                <rect x="137" y="87" width="13" height="55" rx="3" fill="url(#nqChestGold)" stroke="#5d4413" stroke-width="1.4"/>
                <circle cx="37" cy="80.5" r="2.1" fill="#7a5a18"/><circle cx="163" cy="80.5" r="2.1" fill="#7a5a18"/>
                <circle cx="56.5" cy="80.5" r="2.1" fill="#7a5a18"/><circle cx="143.5" cy="80.5" r="2.1" fill="#7a5a18"/>
                <circle cx="100" cy="93" r="21" fill="#1c1240" opacity="0.65" filter="url(#nqChestBlur)"/>
                <rect x="84" y="68" width="32" height="44" rx="9" fill="url(#nqChestGold)" stroke="#5d4413" stroke-width="2"/>
                <rect x="88.5" y="72.5" width="23" height="35" rx="6" fill="none" stroke="#7a5a18" stroke-width="1.2" opacity="0.7"/>
                <circle cx="100" cy="86" r="5" fill="#1c1240"/>
                <path d="M97.4 88.5 h5.2 l1.9 12.5 h-9 z" fill="#1c1240"/>
                <circle cx="100" cy="86" r="1.7" fill="#ffd75e" opacity="0.9"/>
                <path d="M152 34 l1.7 4.6 4.6 1.7 -4.6 1.7 -1.7 4.6 -1.7 -4.6 -4.6 -1.7 4.6 -1.7 z" fill="#ffe9a8" opacity="0.85"/>
                <path d="M44 52 l1.3 3.4 3.4 1.3 -3.4 1.3 -1.3 3.4 -1.3 -3.4 -3.4 -1.3 3.4 -1.3 z" fill="#ffe9a8" opacity="0.6"/>
                <path d="M165 62 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1 z" fill="#ffe9a8" opacity="0.45"/>
              </svg>
            </div>
            <div class="chest-ground-shadow"></div>
          </div>

          <div class="narr-text" style="color: #fff8dc; font-style: italic; line-height: 1.6; font-size: 0.88rem; text-align: center; margin-top: 15px;">
            Enquanto purifica os néfrons das correntes urêmicas, uma pulsação dourada sob as névoas chama sua atenção. Você encontrou um baú misterioso deixado pelos antigos patronos da nefrologia.<br><br>
            <strong style="color: #fbbf24; font-family: 'Cinzel', serif; display: block; font-size: 0.9rem; animation: chestCallPulse 1.5s ease-in-out infinite;">⚡ Toque no baú para abrir! ⚡</strong>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      playSound('chest');
    }
    window.triggerChestRewardPopup = triggerChestRewardPopup;

    function _animateAndClaimChest(img) {
      if (img.classList.contains('opening')) return;
      img.classList.add('opening');
      const card = img.closest('.narrative-card');
      if (card) {
        card.style.transition = 'opacity 0.6s';
        card.style.opacity = '0.75';
      }
      playSound('click');
      setTimeout(() => {
        const popup = document.getElementById('autoChestPopup');
        if (popup) popup.remove();
        claimChestReward();
      }, 600);
    }
    window._animateAndClaimChest = _animateAndClaimChest;

    function claimChestReward() {
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      
      // 50% scroll/article, 50% equipment
      const isScroll = Math.random() < 0.5;
      const availableArticles = nefroArticles.filter((_, idx) => !unlockedArticles.includes(idx));
      
      if (isScroll && availableArticles.length > 0) {
        const randomArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
        const articleIndex = nefroArticles.indexOf(randomArticle);
        
        unlockedArticles.push(articleIndex);
        localStorage.setItem('unlockedArticles', JSON.stringify(unlockedArticles));
        
        state.chestsOpened++;
        const knoGain = state.chestsOpened;
        if(state.equipment) {
          if (state.equipment.relic && state.equipment.relic.n !== 'Vazio') {
            const r = {...state.equipment.relic};
            r.kno = (r.kno || 0) + knoGain;
            state.equipment.relic = r;
          }
        }
        
        const chestPoints = 30 + state.chestsOpened * 10;
        state.score += chestPoints;
        
        const prevKnoTotal = parseInt(localStorage.getItem('nefroquest_total_accumulated_knowledge') || '0', 10);
        const newKnoTotal = prevKnoTotal + knoGain;
        localStorage.setItem('nefroquest_total_accumulated_knowledge', String(newKnoTotal));
        
        showChestModal(randomArticle, knoGain, chestPoints);
        playSound('chest');
        log(`📚 Baú aberto: ${randomArticle.titulo} — +${knoGain} Conhecimento, +${chestPoints} pontos!`);
        
        renderHUD();
        updateBadges();
        saveGame();
        
        if (typeof checkAchievements === 'function') {
          checkAchievements();
        }
      } else {
        const st = total();
        const rolled = rollItem(state.level, st.luck);
        if (!rolled) {
          log('🧱 Nenhum equipamento disponível.');
          return;
        }
        
        const chestPoints = 20 + state.chestsOpened * 5;
        state.score += chestPoints;
        
        equipOrSell(rolled.slot, rolled.item, (msg) => {
          showForgePopup(rolled.item, rolled.slot, [`⚔️ ATK ${rolled.item.atk}`, `🛡️ DEF ${rolled.item.def}`, `📚 CONH ${rolled.item.kno}`, `🍀 SORTE ${rolled.item.luck}`], '🛡️ Equipamento Encontrado!');
          log(`🎁 Baú de Equipamento! ${msg}`);
          renderHUD();
          updateBadges();
          saveGame();
        });
      }
    }
    window.claimChestReward = claimChestReward;
    
    function showChestModal(article, knoGain, chestPoints) {
      knoGain = knoGain || 1;
      chestPoints = chestPoints || 0;
      const modal = document.getElementById('chestModal');
      const articleDiv = document.getElementById('chestArticle');
      
      const titleEl = document.getElementById('chestTitle');
      if (titleEl) titleEl.textContent = '📜 Pergaminho Encontrado!';
      
      articleDiv.innerHTML = `
        <div style="text-align:center;margin-bottom:12px;padding:10px;background:rgba(0,255,100,0.1);border:1px solid rgba(0,255,100,0.3);border-radius:8px;">
          <span style="font-size:1.3rem;">📚</span>
          <span style="color:#4ade80;font-weight:bold;font-size:1.1rem;"> +${knoGain} Conhecimento!</span>
          <span style="color:var(--blue);font-weight:bold;font-size:1.1rem;"> +${chestPoints} Pontos!</span>
          <span style="color:var(--txt-dim);font-size:0.85rem;"> (Baús abertos: ${state.chestsOpened})</span>
        </div>
        <div class="article-card">
          <h3>📜 ${escapeHtml(article.titulo)} (${escapeHtml(String(article.ano))})</h3>
          <p style="font-size:0.78rem;color:var(--gold);margin-bottom:4px">✍️ <em>${escapeHtml(article.autores)}</em></p>
          <p style="font-size:0.72rem;color:var(--txt-dim);margin-bottom:10px">📖 ${escapeHtml(article.jornal)}</p>
          <p><span class="label">📚 Resumo:</span><br>${escapeHtml(article.resumo)}</p>
          <p><span class="label">🎯 Conclusão Principal:</span><br>${escapeHtml(article.conclusao)}</p>
          <p><span class="label">💡 Curiosidade:</span><br>${escapeHtml(article.curiosidade)}</p>
          <p><span class="label">⭐ Impacto na Nefrologia:</span><br>${escapeHtml(article.impacto)}</p>
        </div>
      `;
      
      modal.classList.add('show');
    }
    
    function closeChestModal() {
      document.getElementById('chestModal').classList.remove('show');
    }
    

    // ============ SISTEMA DE ESTATÍSTICAS E DESEMPENHO ============
    const STATS_STORAGE_KEY = 'nefroquest-detailed-stats';
    const DETAILED_STATS_SCHEMA_VERSION = 1;

    function _defaultDetailedStats() {
      return {
        schemaVersion: DETAILED_STATS_SCHEMA_VERSION,
        totalQuestions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        byTopic: {},
        byCategory: {},
        questionHistory: [],
        dailyActivity: {},
        timeStats: { totalTime: 0, questionCount: 0 },
        mostMissed: {}
      };
    }

    function _migrateDetailedStats(s) {
      const v = s.schemaVersion || 0;
      if (v < 1) {
        s.schemaVersion = 1;
      }
      if (!s.dailyActivity) {
        s.dailyActivity = {};
        if (Array.isArray(s.questionHistory)) {
          s.questionHistory.forEach(h => {
            if (h.date) {
              const dateStr = h.date.slice(0, 10);
              if (!s.dailyActivity[dateStr]) {
                s.dailyActivity[dateStr] = { count: 0, time: 0, correct: 0 };
              }
              s.dailyActivity[dateStr].count++;
              if (h.correct) s.dailyActivity[dateStr].correct++;
              if (h.time && h.time > 0) s.dailyActivity[dateStr].time += h.time;
            }
          });
        }
      }
      return s;
    }

    function getDetailedStats() {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) return _defaultDetailedStats();
      try {
        const parsed = JSON.parse(raw);
        return _migrateDetailedStats(parsed);
      } catch(e) {
        return _defaultDetailedStats();
      }
    }

    function saveDetailedStats(stats) {
      if (!stats.schemaVersion) stats.schemaVersion = DETAILED_STATS_SCHEMA_VERSION;
      try { localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats)); } catch(e) { console.error('[NQ] saveDetailedStats failed', e); }
    }
    
    function trackQuestionAnswer(question, isCorrect, timeSpent) {
      const stats = getDetailedStats() || {};
      if (!stats.byTopic)    stats.byTopic    = {};
      if (!stats.byCategory) stats.byCategory = {};
      if (!stats.mostMissed) stats.mostMissed = {};
      if (!stats.questionHistory) stats.questionHistory = [];
      if (!stats.dailyActivity) stats.dailyActivity = {};
      if (!stats.timeStats)  stats.timeStats  = { totalTime: 0, questionCount: 0 };
      if (!stats.totalQuestions) stats.totalQuestions = 0;
      if (!stats.totalCorrect)   stats.totalCorrect   = 0;
      if (!stats.totalWrong)     stats.totalWrong     = 0;
      const topic = question.t || 'Geral';
      const cat = question.c || question.cat || 'geral';
      
      // Atualizar totais
      stats.totalQuestions++;
      if (isCorrect) {
        stats.totalCorrect++;
      } else {
        stats.totalWrong++;
      }
      
      // Atualizar por tema
      if (!stats.byTopic[topic]) {
        stats.byTopic[topic] = { correct: 0, wrong: 0, total: 0 };
      }
      stats.byTopic[topic].total++;
      if (isCorrect) stats.byTopic[topic].correct++;
      else stats.byTopic[topic].wrong++;

      // Atualizar por categoria
      if (!stats.byCategory[cat]) {
        stats.byCategory[cat] = { correct: 0, wrong: 0, total: 0 };
      }
      stats.byCategory[cat].total++;
      if (isCorrect) stats.byCategory[cat].correct++;
      else stats.byCategory[cat].wrong++;
      
      // Atualizar questões mais erradas
      if (!isCorrect) {
        const qKey = question.q.substring(0, 50);
        if (!stats.mostMissed[qKey]) {
          stats.mostMissed[qKey] = { question: question.q, topic: topic, count: 0 };
        }
        stats.mostMissed[qKey].count++;
      }
      
      // Atualizar atividade diária persistente (YYYY-MM-DD local)
      const offset = new Date().getTimezoneOffset();
      const localDate = new Date(new Date().getTime() - (offset * 60 * 1000));
      const localDateStr = localDate.toISOString().split('T')[0];
      if (!stats.dailyActivity[localDateStr]) {
        stats.dailyActivity[localDateStr] = { count: 0, time: 0, correct: 0 };
      }
      stats.dailyActivity[localDateStr].count++;
      if (isCorrect) stats.dailyActivity[localDateStr].correct++;
      if (timeSpent && timeSpent > 0) stats.dailyActivity[localDateStr].time += timeSpent;
      
      // Atualizar tempo
      if (timeSpent > 0) {
        stats.timeStats.totalTime += timeSpent;
        stats.timeStats.questionCount++;
      }
      
      // ID da questão: no deck o qid fica em `id` (buildDeck: id = t.qid).
      const _qid = question.qid || question.id;

      // Histórico (últimas 100)
      stats.questionHistory.unshift({
        qid: _qid,
        topic: topic,
        correct: isCorrect,
        time: timeSpent,
        date: new Date().toISOString()
      });
      if (stats.questionHistory.length > 100) {
        stats.questionHistory = stats.questionHistory.slice(0, 100);
      }

      // Persistir ID no conjunto de todas as respondidas
      try {
        const answeredQids = JSON.parse(localStorage.getItem('nefroquest-all-answered-qids') || '[]');
        if (_qid && !answeredQids.includes(_qid)) {
          answeredQids.push(_qid);
          localStorage.setItem('nefroquest-all-answered-qids', JSON.stringify(answeredQids));
        }
      } catch (e) {
        console.error('[NQ] save all-answered-qids failed', e);
      }

      // Evitar duplo-registro na sincronização retroativa
      const qId = question.id || question.qid;
      if (isCorrect && qId) {
        stats.syncedMastered = stats.syncedMastered || [];
        if (!stats.syncedMastered.includes(qId)) {
          stats.syncedMastered.push(qId);
        }
      }
      
      saveDetailedStats(stats);
    }
    
    function syncMasteredToDetailedStats() {
      // Recarregar _masteredSet do localStorage para garantir que pegamos alterações da nuvem ou de outros scripts
      try {
        const raw = JSON.parse(localStorage.getItem(MASTERED_KEY) || "[]");
        const valid = raw.map(id => typeof id === 'number' ? String(id) : id).filter(id => typeof id === "string" && id.length > 0);
        _masteredSet = new Set(valid);
      } catch (e) {
        console.error('[NQ] Reloading _masteredSet failed', e);
      }

      if (!questionBank) return;

      const stats = getDetailedStats() || {};
      stats.syncedMastered = stats.syncedMastered || [];
      const syncedSet = new Set(stats.syncedMastered);
      let changed = false;

      const bankMap = {};
      questionBank.forEach(q => { bankMap[q.id] = q; });

      // Contar quantos itens do _masteredSet pertencem a cada categoria e tópico
      const masteredCountsByCat = {};
      const masteredCountsByTopic = {};
      
      _masteredSet.forEach(id => {
        const q = bankMap[id];
        if (q) {
          const cat = q.c || 'geral';
          const topic = q.t || 'Geral';
          masteredCountsByCat[cat] = (masteredCountsByCat[cat] || 0) + 1;
          masteredCountsByTopic[topic] = (masteredCountsByTopic[topic] || 0) + 1;
          
          // Adicionar também ao syncedMastered se não estiver lá
          if (!syncedSet.has(id)) {
            stats.syncedMastered.push(id);
            syncedSet.add(id);
            changed = true;
          }
        }
      });

      // Ajustar estatísticas por categoria para garantir que refletem pelo menos as questões masterizadas
      stats.byCategory = stats.byCategory || {};
      Object.keys(masteredCountsByCat).forEach(cat => {
        const requiredCorrect = masteredCountsByCat[cat];
        stats.byCategory[cat] = stats.byCategory[cat] || { correct: 0, wrong: 0, total: 0 };
        const currentCorrect = stats.byCategory[cat].correct || 0;
        if (currentCorrect < requiredCorrect) {
          const diff = requiredCorrect - currentCorrect;
          stats.byCategory[cat].correct = requiredCorrect;
          stats.byCategory[cat].total = (stats.byCategory[cat].total || 0) + diff;
          stats.totalCorrect = (stats.totalCorrect || 0) + diff;
          stats.totalQuestions = (stats.totalQuestions || 0) + diff;
          changed = true;
        }
      });

      // Ajustar estatísticas por tópico
      stats.byTopic = stats.byTopic || {};
      Object.keys(masteredCountsByTopic).forEach(topic => {
        const requiredCorrect = masteredCountsByTopic[topic];
        stats.byTopic[topic] = stats.byTopic[topic] || { correct: 0, wrong: 0, total: 0 };
        const currentCorrect = stats.byTopic[topic].correct || 0;
        if (currentCorrect < requiredCorrect) {
          const diff = requiredCorrect - currentCorrect;
          stats.byTopic[topic].correct = requiredCorrect;
          stats.byTopic[topic].total = (stats.byTopic[topic].total || 0) + diff;
          changed = true;
        }
      });

      if (changed) {
        saveDetailedStats(stats);
      }
    }
    window.syncMasteredToDetailedStats = syncMasteredToDetailedStats;
    
    // Eixos da nefrologia — um eixo por categoria do banco (17 no total)
    // ── Study mode UI ─────────────────────── js/study-mode.js ──
    
    function setStudyMode(mode, topic = null) {
      studyMode = mode;
      selectedTopic = topic || 'all';
      
      let message = '';
      if (mode === 'all') {
        message = '🎲 Modo: Todas as questões';
      } else if (mode === 'review') {
        message = '🔄 Modo: Revisão de erros';
      } else if (mode === 'topic') {
        message = `📖 Modo: ${topic}`;
      }
      
      log(message);
      
      // Reiniciar jogo com novo modo
      if (state.gameStarted) {
        if (confirm('Deseja reiniciar o jogo com o novo modo de estudo?')) {
          startNewFromWelcome();
        }
      }
    }
    
    function filterQuestionsByMode(allQuestions) {
      if (studyMode === 'all') {
        return allQuestions;
      } else if (studyMode === 'review') {
        const stats = getDetailedStats();
        const missedTopics = Object.keys(stats.mostMissed).map(k => stats.mostMissed[k].topic);
        return allQuestions.filter(q => missedTopics.includes(q.t));
      } else if (studyMode === 'topic' && selectedTopic !== 'all') {
        return allQuestions.filter(q => q.t === selectedTopic);
      }
      return allQuestions;
    }

    // ============ MODO PROVA SIMULADA ============

    function openOraculoFromJourney() {
      // No Confronto Final (últimas 10 questões) o Oráculo é silenciado.
      if (typeof isBossBattle === 'function' && isBossBattle()) {
        _showOracleBlockedNarrative();
        return;
      }
      // O Oráculo discute a questão EM TELA. Se ainda não foi respondida,
      // orienta o jogador a responder primeiro.
      if (state.current && !state.answered) {
        _showOracleAnswerFirst();
        return;
      }
      // Alimenta o mentor com a questão ATUAL sempre que abre — o handler de
      // resposta só fazia isso no ramo de ERRO, então ao ACERTAR o contexto
      // ficava preso na questão anterior.
      if (typeof window.setMentorQuestion === 'function' && state.current) {
        const cur = state.current;
        window.setMentorQuestion({
          q: cur.q, opts: cur.o,
          ans: cur.a, exp: cur.e,
          correctOption: cur.o ? cur.o[cur.a] : ''
        });
      }
      if (typeof window.openMentorModal === 'function') window.openMentorModal();
    }
    window.openOraculoFromJourney = openOraculoFromJourney;

    function _showOracleAnswerFirst() {
      document.getElementById('oracleAnswerFirstPopup')?.remove();
      const popup = document.createElement('div');
      popup.id = 'oracleAnswerFirstPopup';
      popup.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;animation:fadeIn 0.3s ease;';
      popup.innerHTML = `
        <div style="position:relative;max-width:420px;width:100%;background:linear-gradient(160deg,#101a33 0%,#0b1428 100%);border:2px solid rgba(168,85,247,0.6);border-radius:16px;padding:26px 22px;text-align:center;box-shadow:0 0 40px rgba(168,85,247,0.3);">
          <button class="popup-x" data-remove-id="oracleAnswerFirstPopup" aria-label="Fechar">✕</button>
          <div style="font-size:2rem;margin-bottom:10px;">🔮</div>
          <h3 style="font-family:'Cinzel',serif;color:#d8b4fe;font-size:1.02rem;letter-spacing:0.5px;margin:0 0 12px;">O Oráculo Aguarda</h3>
          <p style="font-family:'Philosopher',serif;color:#c8d8f0;font-size:0.9rem;line-height:1.6;margin:0 0 20px;">
            Tente responder primeiro a questão para discutirmos depois.
          </p>
          <button data-remove-id="oracleAnswerFirstPopup" style="font-family:'Cinzel',serif;background:linear-gradient(180deg,#7c3aed 0%,#5b21b6 100%);border:2px solid #a855f7;border-radius:10px;color:#f3e8ff;font-size:0.85rem;font-weight:700;letter-spacing:1px;padding:11px 26px;cursor:pointer;box-shadow:0 0 16px rgba(168,85,247,0.4);">Vou responder</button>
        </div>`;
      document.body.appendChild(popup);
      // (fechar-ao-clicar-fora removido — usa o X)
      if (typeof playSound === 'function') playSound('click');
    }

    function _showOracleBlockedNarrative() {
      document.getElementById('oracleBlockedPopup')?.remove();
      const popup = document.createElement('div');
      popup.id = 'oracleBlockedPopup';
      popup.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;animation:fadeIn 0.4s ease;';
      popup.innerHTML = `
        <div style="position:relative;max-width:440px;width:100%;background:linear-gradient(160deg,#0a0118 0%,#120230 50%,#0a0118 100%);border:2px solid rgba(168,85,247,0.7);border-radius:16px;padding:26px 22px;text-align:center;box-shadow:0 0 50px rgba(168,85,247,0.4),inset 0 0 50px rgba(0,0,0,0.6);">
          <button class="popup-x" data-remove-id="oracleBlockedPopup" aria-label="Fechar">✕</button>
          <div style="font-size:2rem;margin-bottom:10px;">🔮💀</div>
          <h3 style="font-family:'Cinzel',serif;color:#d8b4fe;font-size:1.05rem;letter-spacing:1px;margin:0 0 12px;text-shadow:0 0 18px rgba(168,85,247,0.7);">O Oráculo Silenciou</h3>
          <p style="font-family:'Philosopher',serif;color:#c4b5fd;font-size:0.88rem;line-height:1.65;font-style:italic;margin:0 0 20px;">
            No Trono da Uremia, a magia sombria do Arqui-Nefromante sufoca toda sabedoria externa. O Oráculo dos Néfrons não tem poder neste lugar — apenas o <strong style="color:#e9d5ff;">seu próprio conhecimento</strong> decidirá o destino do reino.
          </p>
          <button data-remove-id="oracleBlockedPopup" style="font-family:'Cinzel',serif;background:linear-gradient(180deg,#7c3aed 0%,#5b21b6 100%);border:2px solid #a855f7;border-radius:10px;color:#f3e8ff;font-size:0.85rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:11px 26px;cursor:pointer;box-shadow:0 0 18px rgba(168,85,247,0.5);">Enfrentar sozinho</button>
        </div>`;
      document.body.appendChild(popup);
      // (fechar-ao-clicar-fora removido — usa o X)
      if (typeof playSound === 'function') playSound('boss');
    }

    function goToWelcomeFromGame() {
      document.body.classList.remove('rd-game-over', 'boss-battle-mode', 'arqui-nefromante-final', 'boss-hp-critical');
      document.getElementById('mainApp')?.classList.add('hidden');
      document.querySelectorAll('.exam-overlay').forEach(e => e.remove());
      const ws = document.getElementById('welcomeScreen');
      if (ws) {
        ws.style.opacity = '';
        ws.style.transition = '';
        ws.classList.remove('hidden');
      }
      // Garantir que a barra de status mobile não sobreponha os menus da welcome screen
      document.getElementById('mobileStatusBar')?.classList.remove('active');
      refreshWelcomeSave();
      if (typeof startWelcomeMusic === 'function' && musicEnabled && !welcomeMusicStarted) startWelcomeMusic(true);
    }
    window.goToWelcomeFromGame = goToWelcomeFromGame;


    // ============ MOBILE DRAWER & BOTTOM DOCK ============
    (function initMobile() {
      const overlay    = document.getElementById('mobileOverlay');
      const leftPanel  = document.querySelector('.panel.left');
      const bottomDock = document.getElementById('mobileBottomDock');
      function isMobile() { return window.innerWidth <= 768; }
      function openDrawer() {
        // No modo arqui-nefromante-final (mobile), mostrar o herói individual normalmente
        const isArquiFinal = document.body.classList.contains('arqui-nefromante-final');
        const heroSection  = leftPanel.querySelector('.hero');
        const partyPanel   = document.getElementById('bossPartyPanel');
        const hudSection   = leftPanel.querySelector('.hud');
        const storySection = leftPanel.querySelector('.story');
        const logSection   = leftPanel.querySelector('.log');
        const equipSection = leftPanel.querySelector('.equip');
        const badgesSection = leftPanel.querySelector('.badges-container');
        if (isArquiFinal) {
          // Forçar display nos elementos normais do herói (sobrescreve o !important do boss mode)
          if (heroSection)   heroSection.setAttribute('style', 'display:block!important');
          if (hudSection)    hudSection.setAttribute('style', 'display:grid!important;grid-template-columns:repeat(3,1fr)!important');
          if (storySection)  storySection.setAttribute('style', 'display:block!important');
          if (logSection)    logSection.setAttribute('style', 'display:block!important');
          if (equipSection)  equipSection.setAttribute('style', 'display:block!important');
          if (badgesSection) badgesSection.setAttribute('style', 'display:block!important');
          if (partyPanel)    partyPanel.setAttribute('style', 'display:none!important');
          // Marcar para restaurar ao fechar
          leftPanel._arquiDrawerOpen = true;
        }
        // Mover o panel.left para o body para escapar do stacking context do .app (display:none)
        if (leftPanel.parentElement !== document.body) {
          leftPanel._originalParent = leftPanel.parentElement;
          leftPanel._originalNextSibling = leftPanel.nextSibling;
          document.body.appendChild(leftPanel);
        }
        // Aplicar estilos inline para garantir visibilidade independente do media query
        leftPanel.style.cssText = [
          'position: fixed',
          'top: 0',
          'left: 0',
          'width: 100vw',
          'height: 100vh',
          'z-index: 9600',
          'overflow-y: auto',
          'border-radius: 0',
          'padding-bottom: 160px',
          'background: linear-gradient(180deg, #1e3a5f 0%, #162d4a 50%, #0f2035 100%)',
          'border: 2px solid #3a6a9a',
          'transform: translateX(0)',
          'display: block'
        ].join(';');
        leftPanel.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (!leftPanel.querySelector('.drawer-close-btn')) {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'drawer-close-btn';
          closeBtn.innerHTML = '&#10005; Fechar';
          closeBtn.onclick = closeDrawer;
          closeBtn.style.cssText = 'display:inline-flex!important;width:auto!important;padding:7px 18px!important;background:rgba(255,215,0,0.10)!important;border:1px solid rgba(255,215,0,0.30)!important;border-radius:8px!important;color:#ffd700!important;font-size:0.65rem!important;font-weight:700!important;cursor:pointer!important;text-transform:uppercase!important;letter-spacing:1px!important;margin:12px 16px 20px!important;align-self:flex-start!important;';
          leftPanel.appendChild(closeBtn);
        }
      }
      function closeDrawer() {
        leftPanel.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        // Remover estilos inline
        leftPanel.style.cssText = '';
        // Devolver o panel.left ao seu pai original
        if (leftPanel._originalParent) {
          if (leftPanel._originalNextSibling) {
            leftPanel._originalParent.insertBefore(leftPanel, leftPanel._originalNextSibling);
          } else {
            leftPanel._originalParent.appendChild(leftPanel);
          }
          leftPanel._originalParent = null;
          leftPanel._originalNextSibling = null;
        }
        // Restaurar estado do boss mode: remover estilos inline e deixar CSS tomar conta
        if (leftPanel._arquiDrawerOpen) {
          leftPanel._arquiDrawerOpen = false;
          const heroSection   = leftPanel.querySelector('.hero');
          const hudSection    = leftPanel.querySelector('.hud');
          const storySection  = leftPanel.querySelector('.story');
          const logSection    = leftPanel.querySelector('.log');
          const equipSection  = leftPanel.querySelector('.equip');
          const badgesSection = leftPanel.querySelector('.badges-container');
          const partyPanel    = document.getElementById('bossPartyPanel');
          // Remover atributos style inline para que o CSS do boss mode volte a controlar
          if (heroSection)   heroSection.removeAttribute('style');
          if (hudSection)    hudSection.removeAttribute('style');
          if (storySection)  storySection.removeAttribute('style');
          if (logSection)    logSection.removeAttribute('style');
          if (equipSection)  equipSection.removeAttribute('style');
          if (badgesSection) badgesSection.removeAttribute('style');
          if (partyPanel)    partyPanel.removeAttribute('style');
        }
      }
      // Expor globalmente para o botão do bottom dock
      window.openMobileDrawer = openDrawer;
      // (window._applyMobileState removido em v10.90 — sem chamadores externos;
      //  applyMobileState() é chamado internamente direto)
      function applyMobileState() {
        const heroBtn = document.getElementById('mobileHeroBtn');
        if (isMobile()) {
          const mainAppVisible = !document.getElementById('mainApp').classList.contains('hidden');
          const welcomeVisible = !document.getElementById('welcomeScreen').classList.contains('hidden');
          bottomDock.style.display = mainAppVisible ? 'flex' : 'none';
          if (heroBtn) heroBtn.style.display = mainAppVisible ? 'flex' : 'none';
        } else {
          bottomDock.style.display = 'none';
          if (heroBtn) heroBtn.style.display = 'none';
          closeDrawer();
        }
      }
      overlay.addEventListener('click', closeDrawer);
      // Fechar drawer ao clicar em botão dentro do painel esquerdo
      leftPanel.addEventListener('click', function(e) {
        if (isMobile() && e.target.closest('button') && !e.target.closest('.forge-popup') && !e.target.closest('.narrative-popup')) {
          setTimeout(closeDrawer, 200);
        }
      });
      window.addEventListener('resize', applyMobileState);
      const mainAppEl = document.getElementById('mainApp');
      const welcomeEl = document.getElementById('welcomeScreen');
      const observer = new MutationObserver(function() {
        if (isMobile()) {
          const mainAppVisible = !mainAppEl.classList.contains('hidden');
          const welcomeVisible = !welcomeEl.classList.contains('hidden');
          const _heroBtn = document.getElementById('mobileHeroBtn');
          bottomDock.style.display = mainAppVisible ? 'flex' : 'none';
          if (_heroBtn) _heroBtn.style.display = mainAppVisible ? 'flex' : 'none';
          if (mainAppVisible) closeDrawer();
          if (welcomeVisible) refreshWelcomeSave();
          // Ocultar barra de status ao sair do jogo para qualquer tela
          if (!mainAppVisible) document.getElementById('mobileStatusBar')?.classList.remove('active');
        }
      });
      observer.observe(mainAppEl, { attributes: true, attributeFilter: ['class'] });
      observer.observe(welcomeEl, { attributes: true, attributeFilter: ['class'] });
      applyMobileState();
      // Garantir que o dock apareça mesmo se innerWidth ainda não estava calculado
      setTimeout(applyMobileState, 100);
      setTimeout(applyMobileState, 500);
    })();

    // === LORE DO PERSONAGEM (clique no retrato) ===
    const heroLores = {
      nephros: {
        p1: "Dr. Nephros nasceu às margens do Rio Glomerular, filho de um humilde filtrador de toxinas e de uma sábia guardiã da homeostase. Desde criança, enquanto outros brincavam, ele estudava a maré dos eletrólitos e sussurrava segredos com os néfrons do vale.",
        p2: "Quando o Arqui-Nefromante corrompeu as águas do Reino e transformou néfrons saudáveis em escória fibrótica, Nephros jurou em nome do KDIGO que percorreria cada cripta e cada túbulo até restaurar o equilíbrio — ou morrer tentando."
      },
      aquaria: {
        p1: "Dra. Aquaria cresceu no coração do Lago Osmótico, onde aprendeu a dançar com as moléculas de água antes mesmo de aprender a caminhar. Dizem que ela pode sentir a osmolaridade do ar e prever uma hiponatremia antes que qualquer exame confirme.",
        p2: "Quando o Arqui-Nefromante desviou as correntes do Lago e transformou a água pura em veneno urêmico, Aquaria pegou seu cetro de diuréticos e partiu. Ela não luta por glória — luta porque nenhum rim merece sofrer em silêncio."
      },
      glomerulus: {
        p1: "Dr. Glomerulus é o tipo de cientista que prefere uma biópsia renal a um jantar de gala. Criado em um laboratório subterrâneo por um excêntrico nefropatologista, aprendeu a ler padrões de imunofluorescência como outros leem poesia — com paixão e precisão.",
        p2: "Quando o Arqui-Nefromante começou a semear depósitos de imunocomplexos pelo reino, Glomerulus reconheceu o padrão: era um padrão mesangial tipo III com crescentes. Pegou seu microscópio de combate e declarou guerra. A ciência seria sua espada."
      }
    };

    function showHeroLore() {
      if (!state.character || !heroLores[state.character]) return;
      const char = characters[state.character];
      const lore = heroLores[state.character];
      const img = ui.heroImg ? ui.heroImg.src : '';
      const existing = document.getElementById('heroLoreModal');
      if(existing) existing.remove();

      // Usa total() (base + equipamento), a MESMA fonte do painel "Atributos
      // Totais" do herói — antes lia state.stats (sem equipamento) e divergia.
      const st = (typeof total === 'function') ? total() : (state.stats || {});
      const lvl = state.level || 1;
      const statsHtml = `
        <div class="lore-stats">
          <span class="lore-stat">Nível ${lvl}</span>
          <span class="lore-stat">⚔️ ${st.atk || 0}</span>
          <span class="lore-stat">🛡️ ${st.def || 0}</span>
          <span class="lore-stat">📚 ${st.kno || 0}</span>
          <span class="lore-stat">🍀 ${st.luck || 0}</span>
        </div>
      `;

      const modal = document.createElement('div');
      modal.id = 'heroLoreModal';
      modal.className = 'hero-lore-modal';
      modal.innerHTML = `
        <div class="hero-lore-card">
          <img class="lore-portrait" src="${img}" alt="${escapeHtml(char.name)}">
          <div class="lore-name">${escapeHtml(char.name)}</div>
          <div class="lore-title">${escapeHtml(char.title)}</div>
          ${state.gameStarted ? statsHtml : ''}
          <div class="lore-text">
            <p>${lore.p1}</p>
            <p>${lore.p2}</p>
          </div>
          <button class="lore-close" data-remove-id="heroLoreModal">FECHAR</button>
        </div>
      `;
      // modal.addEventListener('click', function(e) {
      //   if(e.target === modal) modal.remove();
      // });
      document.body.appendChild(modal);
    }
    window.showHeroLore = showHeroLore;

     // === SWIPE PARA PRÓXIMA QUESTÃO + NAVEGAÇÃO HERÓI (mobile) ===
    (function initSwipe() {
      var sx = 0, sy = 0, tracking = false;

      function isDrawerOpen() {
        var lp = document.querySelector('.panel.left');
        return lp && lp.classList.contains('mobile-open');
      }

      // Usar o elemento de conteúdo principal como alvo do swipe
      function getSwipeTarget() {
        return document.querySelector('.panel.right') || document.body;
      }

      function onTouchStart(e) {
        if (e.touches.length !== 1) return;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        tracking = true;
      }

      function onTouchEnd(e) {
        if (!tracking) return;
        tracking = false;
        var t = e.changedTouches[0];
        var dx = t.clientX - sx;
        var dy = t.clientY - sy;
        var adx = Math.abs(dx), ady = Math.abs(dy);
        // Ignorar movimentos pequenos ou predominantemente verticais
        if (adx < 40) return;
        if (ady > adx * 0.8) return;

        if (isDrawerOpen()) {
          // Drawer aberto: swipe esquerda fecha
          if (dx < 0) {
            var ov = document.getElementById('mobileOverlay');
            if (ov) ov.click();
          }
          return;
        }

        if (dx < 0) {
          // Swipe esquerda → próxima questão
          var btn = document.getElementById('nextBtn');
          if (btn && !btn.classList.contains('hidden')) {
            setTimeout(function() { btn.click(); }, 150);
          }
        } else {
          // Swipe direita → abrir herói
          if (typeof window.openMobileDrawer === 'function') {
            window.openMobileDrawer();
          }
        }
      }

      // Registrar no document E no panel.right para máxima compatibilidade
      document.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('touchend', onTouchEnd, { passive: true });

      // Também registrar no panel.right quando disponível
      function attachToPanel() {
        var panel = document.querySelector('.panel.right');
        if (panel) {
          panel.addEventListener('touchstart', onTouchStart, { passive: true });
          panel.addEventListener('touchend', onTouchEnd, { passive: true });
        }
      }
      if (document.readyState === 'complete') {
        attachToPanel();
      } else {
        window.addEventListener('load', attachToPanel);
      }
    })();

    // ============ CRONÔMETRO ============
    (function() {
      var _timerSec = 0;
      var _timerRunning = false;
      var _timerInterval = null;
      var _timerEnabled = false; // desligado por padrão

      var PLAY_SVG  = '<polygon points="5,3 19,12 5,21"/>';
      var PAUSE_SVG = '<rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>';

      function _pad(n) { return n < 10 ? '0' + n : '' + n; }

      function _updateDisplay() {
        var el = document.getElementById('timerDisplay');
        if (!el) return;
        var m = Math.floor(_timerSec / 60);
        var s = _timerSec % 60;
        el.textContent = _pad(m) + ':' + _pad(s);
      }

      function _setIcon(running) {
        var icon = document.getElementById('timerIcon');
        if (!icon) return;
        icon.innerHTML = running ? PAUSE_SVG : PLAY_SVG;
      }

      function _start() {
        if (_timerRunning) return;
        _timerRunning = true;
        _timerEnabled = true;
        var widget = document.getElementById('timerWidget');
        if (widget) widget.classList.add('running');
        _setIcon(true);
        _timerInterval = setInterval(function() {
          _timerSec++;
          _updateDisplay();
        }, 1000);
      }

      function _pause() {
        if (!_timerRunning) return;
        _timerRunning = false;
        clearInterval(_timerInterval);
        _timerInterval = null;
        var widget = document.getElementById('timerWidget');
        if (widget) widget.classList.remove('running');
        _setIcon(false);
      }

      function _reset() {
        _pause();
        _timerSec = 0;
        _updateDisplay();
        // Se o timer estava habilitado, reinicia automaticamente
        if (_timerEnabled) {
          setTimeout(_start, 50);
        }
      }

      // Expor toggle no escopo global
      window.timerToggle = function() {
        if (_timerRunning) {
          _pause();
          _timerEnabled = false;
        } else {
          _timerEnabled = true;
          _start();
        }
      };

      // Resetar e iniciar o timer a cada nova questão (se habilitado)
      var _origRQ = window.renderQuestion;
      window.renderQuestion = function() {
        _reset();
        if (_origRQ) _origRQ();
      };

      // Inicializar display
      _updateDisplay();
    })();
  
    // ============ MODO PONTO FRACO ============
    function startWeakPointStudy() {
      const stats = getDetailedStats();
      const weakAxes = NEFRO_AXES.filter(axis => {
        const d = (stats.byCategory || {})[axis.cat];
        return d && d.total >= 5 && (d.correct / d.total) < 0.5;
      });
      let axesToStudy;
      if (weakAxes.length === 0) {
        // Fallback: 3 categorias com menor acerto (mesmo que > 50%)
        const ranked = NEFRO_AXES.map(axis => {
          const d = (stats.byCategory || {})[axis.cat];
          return { axis, accuracy: (d && d.total > 0) ? d.correct/d.total : 1, total: d ? d.total : 0 };
        }).filter(x => x.total > 0).sort((a,b) => a.accuracy - b.accuracy).slice(0, 3);
        if (!ranked.length) { _toast('Jogue mais questões para identificar seus pontos fracos!', 'info', 4000); return; }
        axesToStudy = ranked.map(x => x.axis);
        const labels = axesToStudy.map(a => `• ${a.label}`).join('\n');
        if (!confirm(`Nenhuma categoria abaixo de 50%.\nEstudo nas 3 com menor acerto:\n${labels}\n\nContinuar?`)) return;
      } else {
        axesToStudy = weakAxes;
      }
      const cats = new Set(axesToStudy.map(a => a.cat));
      studyModeQuestions = shuffle(topics.filter(q => cats.has(q.cat)));
      if (!studyModeQuestions.length) { _toast('Nenhuma questão encontrada nas categorias fracas.', 'warning'); return; }
      _studySelectedAxes = new Set(axesToStudy.map(a => a.id));
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      document.querySelectorAll('.study-mode-popup,.welcome-screen').forEach(el => el.classList.add('hidden'));
      showStudyModePage();
    }

    // ============ COMPARTILHAMENTO DE RESULTADO ============
    function _shareResult(tipo, data) {
      const lines = [
        '🏆 NefroQuest: Ascension',
        tipo === 'campanha' ? `⚔️ Campanha — Nível ${data.level || '?'}` : `📝 Prova Simulada`,
        data.correct !== undefined ? `📊 Acerto: ${data.pct}%  |  ${data.correct}/${data.total} corretas` : `📊 Acerto: ${data.pct}%`,
        data.level ? `🎖️ Nível ${data.level}  |  ${data.score} pontos` : `⏱️ ${data.time}`,
        '',
        'Treine nefrologia em: nefroquest.vercel.app'
      ].join('\n');
      if (navigator.share) {
        navigator.share({ title: 'NefroQuest', text: lines }).catch(() => {});
      } else {
        navigator.clipboard.writeText(lines)
          .then(() => _toast('Resultado copiado para a área de transferência!', 'success'))
          .catch(() => _toast('Copie manualmente:\n' + lines.substring(0, 80) + '…', 'info', 5000));
      }
    }

    function _shareExamResult(pct, correct, total) {
      const elapsed = _examState ? Math.floor((Date.now() - _examState.startTime) / 1000) : 0;
      const m = Math.floor(elapsed/60), s = elapsed%60;
      _shareResult('prova', { pct, correct, total, time: `${m}m${s}s` });
    }

    // ============ OFFLINE BADGE ============
    function _updateOnlineStatus() {
      const badge = document.getElementById('offlineBadge');
      if (badge) badge.style.display = navigator.onLine ? 'none' : 'block';
      if (navigator.onLine) {
        if (typeof _syncProgressToCloud === 'function') {
          _syncProgressToCloud().catch(() => {});
        }
        if (typeof window.syncPendingLeaderboard === 'function') {
          window.syncPendingLeaderboard().catch(() => {});
        }
      }
    }
    window.addEventListener('online',  _updateOnlineStatus);
    window.addEventListener('offline', _updateOnlineStatus);

    // Garante role="dialog" e aria-modal em todos os modais criados dinamicamente
    const _origAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(node) {
      const result = _origAppendChild.call(this, node);
      if (node && node.classList && node.classList.contains('modal') && !node.getAttribute('role')) {
        node.setAttribute('role', 'dialog');
        node.setAttribute('aria-modal', 'true');
      }
      return result;
    };

    // Handler global para promises rejeitadas sem catch — evita falha silenciosa.
    // Sentry já captura automaticamente; este handler envia também pro GA4 (_track).
    window.addEventListener('unhandledrejection', function(e) {
      _track('error_unhandled_rejection', { msg: String(e.reason).slice(0, 200) });
    });

    // Handler global para erros JS síncronos não tratados (TypeError, ReferenceError,
    // etc). Sentry captura, mas GA4 precisa do _track explícito.
    window.addEventListener('error', function(e) {
      // Filtra ruído: erros de carga de recursos (img/script/css) chegam aqui
      // mas têm e.target em vez de e.message. São tratados em onerror inline
      // ou ignoráveis. Só logamos erros JS reais.
      if (!e.message) return;
      _track('error_uncaught', {
        msg: String(e.message).slice(0, 200),
        src: e.filename ? e.filename.slice(-60) : '',
        line: e.lineno || 0
      });
    });

    // ESC fecha o modal ou popup mais recente no topo
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape') return;
      // Fecha forge popup primeiro
      const forgePopup = document.querySelector('.forge-popup');
      if (forgePopup) { forgePopup.remove(); return; }
      // Fecha narrative popup
      const narrative = document.querySelector('.narrative-popup');
      if (narrative) { narrative.remove(); return; }
      // Fecha qualquer modal genérico
      const modal = document.querySelector('.modal');
      if (modal) { modal.remove(); return; }
      // Fecha game modes overlay
      const gm = document.getElementById('gameModesOverlay');
      if (gm && gm.style.display !== 'none' && gm.classList.contains('open')) { closeGameModesPopup(); return; }
    });

    // Atalhos de teclado para responder (1-4 ou A-D) e avançar (Enter/Space)
    document.addEventListener('keydown', function(e) {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // --- MINIGAME JULGAMENTO RÁPIDO ---
      const mgTrue = document.getElementById('mgTrue');
      const mgFalse = document.getElementById('mgFalse');
      if (mgTrue && !mgTrue.disabled && mgFalse && !mgFalse.disabled) {
        const key = e.key.toUpperCase();
        if (key === 'V' || key === '1' || key === 'T' || key === 'C') {
          e.preventDefault();
          mgTrue.click();
          return;
        } else if (key === 'F' || key === '2' || key === 'E') {
          e.preventDefault();
          mgFalse.click();
          return;
        }
      }

      // --- MODO DE ESTUDO ---
      const studyArea = document.getElementById('studyQuestionArea');
      if (studyArea && studyArea.offsetParent !== null) {
        const nextBtn = studyArea.querySelector('[data-action="nextStudyQuestion"]');
        if (nextBtn) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            nextBtn.click();
            return;
          }
        } else {
          let optIndex = -1;
          const key = e.key.toUpperCase();
          if (key === 'A' || key === '1') optIndex = 0;
          else if (key === 'B' || key === '2') optIndex = 1;
          else if (key === 'C' || key === '3') optIndex = 2;
          else if (key === 'D' || key === '4') optIndex = 3;
          
          if (optIndex >= 0) {
            const allOptions = studyArea.querySelectorAll('.study-option-btn');
            if (allOptions && allOptions[optIndex] && !allOptions[optIndex].disabled) {
              e.preventDefault();
              allOptions[optIndex].click();
              return;
            }
          }
        }
      }

      // --- MODO JORNADA / BOSS ---
      const mainApp = document.getElementById('mainApp');
      if (mainApp && !mainApp.classList.contains('hidden') && state.gameStarted) {
        if (state.answered) {
          const nextBtn = document.getElementById('nextBtn');
          if (nextBtn && !nextBtn.classList.contains('hidden')) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              nextBtn.click();
              return;
            }
          }
        } else if (state.current) {
          let optIndex = -1;
          const key = e.key.toUpperCase();
          if (key === 'A' || key === '1') optIndex = 0;
          else if (key === 'B' || key === '2') optIndex = 1;
          else if (key === 'C' || key === '3') optIndex = 2;
          else if (key === 'D' || key === '4') optIndex = 3;
          
          if (optIndex >= 0) {
            const allOptions = ui.options.querySelectorAll('.option');
            if (allOptions && allOptions[optIndex]) {
              e.preventDefault();
              allOptions[optIndex].click();
              return;
            }
          }
        }
      }
    });

    _updateOnlineStatus();

    // ============ PWA INSTALL BANNER ============
    let _pwaPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _pwaPrompt = e;
      if (!localStorage.getItem('pwa-dismissed')) {
        setTimeout(() => {
          const b = document.getElementById('pwaBanner');
          if (b) b.style.display = 'flex';
        }, 20000);
      }
    });
    function _installPWA() {
      if (!_pwaPrompt) return;
      _pwaPrompt.prompt();
      _pwaPrompt.userChoice.then(() => {
        _pwaPrompt = null;
        const b = document.getElementById('pwaBanner');
        if (b) b.style.display = 'none';
      });
    }
    function _dismissPWA() {
      localStorage.setItem('pwa-dismissed', '1');
      const b = document.getElementById('pwaBanner');
      if (b) b.style.display = 'none';
    }

    // ============ POPUP MODOS DE JOGO (mobile) ============
    function openGameModesPopup() {
      const el = document.getElementById('gameModesOverlay');
      if (el) el.classList.add('show');
    }
    function closeGameModesPopup() {
      const el = document.getElementById('gameModesOverlay');
      if (el) el.classList.remove('show');
    }
    function closeGameModesPopupOutside(e) {
      // closeGameModesPopupOutside desativado para cliques fora (evita fechar acidentalmente)
      // if (e.target === document.getElementById('gameModesOverlay')) closeGameModesPopup();
    }


    // Atualiza o box da jornada ao voltar à aba (mobile bfcache / visibilidade)
    window.addEventListener('pageshow', function(e) {
      const ws = document.getElementById('welcomeScreen');
      if (ws && !ws.classList.contains('hidden')) refreshWelcomeSave();
    });
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        const ws = document.getElementById('welcomeScreen');
        if (ws && !ws.classList.contains('hidden')) refreshWelcomeSave();
      } else {
        // Quando entra em background, força sincronização imediata
        flushPendingRating();
        if (typeof _syncProgressToCloud === 'function') {
          _syncProgressToCloud().catch(() => {});
        }
      }
    });

    // Garante o envio da avaliação pendente ao fechar/descarregar a página.
    window.addEventListener('pagehide', () => { flushPendingRating(); });

    // Wrappers expostos no window para serem chamáveis via data-action
    window._mobileCallback = function(type) {
      const cb = window._mobileActionCallbacks?.[type];
      if (typeof cb === 'function') cb();
    };
    window._pricingToLogin = function() {
      closePricingModal();
      openAuthModal();
      switchAuthTab('entrar');
    };
    window._toggleErrorsList = function(btn) {
      const sib = btn.nextElementSibling;
      if (!sib) return;
      sib.style.display = sib.style.display === 'none' ? 'flex' : 'none';
      btn.textContent = btn.textContent.includes('▼') ? '▲ Ocultar erros' : '▼ Ver erros';
    };
    window._selectDiffCard = function(card) {
      document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const btn = document.getElementById('diffConfirmBtn');
      if (btn) btn.disabled = false;
      window._pendingDiff = card.dataset.diffKey || '';
    };
    window._confirmDiff = function(fromWelcome) {
      const diff = window._pendingDiff;
      if (!diff) return;
      document.body.classList.remove('rd-game-over', 'boss-battle-mode', 'arqui-nefromante-final', 'boss-hp-critical');
      document.getElementById('diffSelectorOverlay')?.remove();
      state.difficulty = diff;
      deleteSave();
      if (typeof _syncProgressToCloud === 'function') {
        _syncProgressToCloud().catch(() => {});
      }
      // Revalida premium do servidor — impede bypass via localStorage
      _loadPremiumFromDB().catch(() => {});
      if (fromWelcome === true) dismissWelcome();
      document.getElementById('charSelectModal').classList.add('show');
    };
    window._showBadgeTip = function(el) {
      const existing = el.querySelector('.badge-mobile-tip');
      if (existing) { existing.remove(); return; }
      document.querySelectorAll('.badge-mobile-tip').forEach(e => e.remove());
      const tip = document.createElement('div');
      tip.className = 'badge-mobile-tip';
      tip.textContent = el.dataset.badgeLabel || '';
      tip.style.cssText = 'position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#0e1830;border:1px solid var(--gold);border-radius:6px;padding:5px 8px;font-size:0.65rem;color:#d5e2ff;white-space:nowrap;z-index:99999;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.8);';
      el.style.overflow = 'visible';
      el.appendChild(tip);
      setTimeout(() => { tip.remove(); el.style.overflow = 'hidden'; }, 2500);
    };
    window._copyRefBtn = function(btn) {
      if (typeof _copyRef === 'function') _copyRef(btn, btn.dataset.copyText || '');
    };
    // Dispatcher gaps — funções definidas em módulos separados, expostas via window.xxx em cada arquivo
    window.submitFlag  = submitFlag;
    window.flagQuestion = flagQuestion;
    window.getAuthToken = async function() {
      if (!_supaClient) return null;
      const { data: { session } } = await _supaClient.auth.getSession();
      return session?.access_token ?? null;
    };

    window._pickIdentity          = window._pickIdentity || function() {};

    // ============ POLÍTICA DE PRIVACIDADE ============
    function showPrivacyPolicy() {
      document.querySelectorAll('.privacy-popup').forEach(el => el.remove());
      const modal = document.createElement('div');
      modal.className = 'modal show privacy-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.88);display:flex;align-items:flex-start;justify-content:center;z-index:10000;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);overflow-y:auto;padding:12px 16px calc(env(safe-area-inset-bottom,0px)+40px);box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:560px;width:calc(100% - 32px);max-height:none;overflow-y:visible;text-align:left;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(96,165,250,0.2);margin:auto 0;">
          <h2 style="color:var(--gold);margin-bottom:4px;font-family:'MedievalSharp','Cinzel',serif;text-align:center;">📜 Política de Privacidade</h2>
          <div style="color:var(--txt-dim);font-size:0.72rem;margin-bottom:16px;text-align:center;">NefroQuest · Última atualização: maio de 2025</div>

          <div class="modal-scroll-body" style="color:#c8d8f0;font-size:0.83rem;line-height:1.75;display:flex;flex-direction:column;gap:16px;">

            <div>
              <div class="nq-section-label">1. Quem somos</div>
              <p style="margin:0;">O NefroQuest é uma plataforma educacional de nefrologia desenvolvida para médicos, residentes e estudantes de medicina. Contato: <span class="nq-text-blue">contato@nefroquest.com</span></p>
            </div>

            <div>
              <div class="nq-section-label">2. Dados coletados</div>
              <ul style="margin:0;padding-left:18px;">
                <li><strong>Conta:</strong> endereço de e-mail para autenticação.</li>
                <li><strong>Progresso:</strong> nível, XP, questões respondidas, estatísticas de desempenho e revisão espaçada — armazenados localmente e/ou no servidor para sincronização entre dispositivos.</li>
                <li><strong>Uso:</strong> eventos anônimos de navegação (questões respondidas, modos utilizados) via Sentry e Supabase para diagnóstico de erros.</li>
              </ul>
            </div>

            <div>
              <div class="nq-section-label">3. Uso de Inteligência Artificial</div>
              <p style="margin:0;">O NefroQuest utiliza <strong style="color:#e9d5ff;">Claude (Anthropic)</strong> para as funcionalidades de <em>Mentor IA</em> (dúvidas sobre questões) e <em>Diagnóstico de Sessão</em>. Ao usar esses recursos, o texto da questão e sua dúvida são enviados à Anthropic para geração da resposta. Não enviamos dados pessoais identificáveis à Anthropic. A Anthropic não usa dados de produção para treinar modelos sem consentimento explícito.</p>
            </div>

            <div>
              <div class="nq-section-label">4. Compartilhamento de dados</div>
              <p style="margin:0;">Não vendemos seus dados. Compartilhamos apenas com prestadores de serviços necessários para o funcionamento da plataforma: <strong>Supabase</strong> (autenticação e banco de dados), <strong>Anthropic</strong> (IA, somente conteúdo educacional), <strong>Sentry</strong> (monitoramento de erros) e <strong>Mercado Pago</strong> (processamento de pagamentos, quando aplicável).</p>
            </div>

            <div>
              <div class="nq-section-label">5. Seus direitos</div>
              <p style="margin:0;">Você pode solicitar a exclusão da sua conta e de todos os dados associados a qualquer momento entrando em contato pelo e-mail acima. O acesso ao app sem conta (modo visitante) não armazena dados no servidor.</p>
            </div>

            <div>
              <div class="nq-section-label">6. Cookies e armazenamento local</div>
              <p style="margin:0;">Utilizamos <code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;">localStorage</code> para salvar seu progresso de jogo localmente. Não utilizamos cookies de rastreamento ou publicidade.</p>
            </div>

            <div>
              <div class="nq-section-label">7. Menores de idade</div>
              <p style="margin:0;">O NefroQuest é destinado a adultos (estudantes de medicina, residentes e médicos). Não coletamos dados de menores de 18 anos intencionalmente.</p>
            </div>

            <div>
              <div class="nq-section-label">8. Alterações nesta política</div>
              <p style="margin:0;">Podemos atualizar esta política periodicamente. A data de atualização será revisada no topo do documento. O uso continuado após alterações implica aceite das novas condições.</p>
            </div>

          </div>

          <button data-close-closest=".privacy-popup" style="margin-top:14px;width:100%;background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.4);color:var(--blue);border-radius:8px;padding:10px;font-family:'Cinzel',serif;cursor:pointer;font-size:0.85rem;">Fechar</button>
        </div>
      `;
      // modal.addEventListener('click', function(e) {
      //   if (e.target === modal) modal.remove();
      // });
      document.body.appendChild(modal);
    }
    window.showPrivacyPolicy = showPrivacyPolicy;

    function _showMoreFb(btn) {
      const snip = btn.previousElementSibling; // .fb-snip span
      const rest = snip ? snip.querySelector('.fb-rest') : null;
      if (rest) rest.style.display = 'inline';
      btn.style.display = 'none';
    }
    window._showMoreFb = _showMoreFb;

    // ============ DISPATCHER CENTRAL (data-action / data-action-seq) ============
    // Substitui inline onclick="..." em HTML estático e em templates JS
    // Suporte a teclado (Enter/Space) para elementos role="button" com data-action
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target.closest('[role="button"][data-action]');
      if (!el) return;
      e.preventDefault();
      el.click();
    });

    document.addEventListener('click', function(e) {
      const el = e.target.closest('[data-action], [data-action-seq], [data-close-closest], [data-remove-id]');
      if (!el) return;

      // DOM helpers (podem combinar com data-action para executar depois)
      const closeSel = el.dataset.closeClosest;
      if (closeSel) {
        if (el.dataset.stopPropagation) e.stopPropagation();
        el.closest(closeSel)?.remove();
      }
      const removeId = el.dataset.removeId;
      if (removeId) {
        if (el.dataset.stopPropagation) e.stopPropagation();
        document.getElementById(removeId)?.remove();
      }

      // Sequência de ações: data-action-seq="fn1,fn2"
      const seq = el.dataset.actionSeq;
      if (seq) {
        if (el.dataset.stopPropagation) e.stopPropagation();
        seq.split(',').forEach(fn => {
          const f = window[fn.trim()];
          if (typeof f === 'function') f();
        });
        return;
      }

      // Ação única: data-action="fn"  +  data-arg / data-args / data-pass-event / data-pass-this
      const action = el.dataset.action;
      if (!action) {
        return; // nada mais a fazer (close-closest / remove-id já rodaram)
      }
      if (el.dataset.stopPropagation) e.stopPropagation();

      const fn = window[action];
      if (typeof fn !== 'function') return;

      // data-args='[1,"foo",true]' — múltiplos argumentos via JSON
      if (el.dataset.args !== undefined) {
        try {
          const arr = JSON.parse(el.dataset.args);
          fn.apply(null, Array.isArray(arr) ? arr : [arr]);
        } catch { fn(); }
        return;
      }
      if (el.dataset.passEvent) {
        fn(e);
      } else if (el.dataset.passThis) {
        fn(el);
      } else if (el.dataset.arg !== undefined) {
        // data-arg-type="number" / "boolean" converte o valor
        let v = el.dataset.arg;
        const t = el.dataset.argType;
        if (t === 'number') v = Number(v);
        else if (t === 'boolean') v = v === 'true';
        fn(v);
      } else {
        fn();
      }
    });

    window._closeArquiQ9Popup = function() {
      const popup = document.getElementById('arquiQ9Popup');
      if (popup) popup.style.display = 'none';
    };

    // ============ ATALHOS DE TECLADO (Acessibilidade Desktop) ============
    document.addEventListener('keydown', function(e) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return; // Ignorar quando o usuário estiver digitando
      }

      const key = e.key.toUpperCase();

      // Fechar popups narrativos com Enter ou Space se algum estiver na tela
      const overlayBtn = document.querySelector('#charIntroOverlay button') || 
                         document.querySelector('.narrative-popup button') ||
                         document.getElementById('arquiQ9CloseBtn');
      
      if (overlayBtn && (key === 'ENTER' || key === ' ')) {
        const visibleOverlay = overlayBtn.closest('.narrative-popup') || 
                              document.getElementById('charIntroOverlay') || 
                              document.getElementById('arquiQ9Popup');
        if (visibleOverlay && visibleOverlay.style.display !== 'none' && !visibleOverlay.classList.contains('hidden')) {
          e.preventDefault();
          overlayBtn.click();
          return;
        }
      }

      // 1. Caso 1: Modo Estudo (Revisão Espaçada / Reforço)
      const studyPage = document.getElementById('studyModePage');
      const isStudyPageActive = studyPage && !studyPage.classList.contains('hidden') && studyPage.style.display !== 'none';
      
      if (isStudyPageActive) {
        const feedback = document.getElementById('studyFeedback');
        const isAnswered = feedback && feedback.style.display === 'block';

        if (isAnswered) {
          if (key === 'ENTER' || key === ' ') {
            e.preventDefault();
            const nextBtn = studyPage.querySelector('[data-action="nextStudyQuestion"]');
            if (nextBtn) nextBtn.click();
          }
        } else {
          const optionKeys = ['1', '2', '3', '4', 'A', 'B', 'C', 'D'];
          const optIdx = optionKeys.indexOf(key) % 4;
          if (optIdx >= 0) {
            e.preventDefault();
            const btns = studyPage.querySelectorAll('.study-option-btn');
            if (btns && btns[optIdx] && !btns[optIdx].disabled) {
              btns[optIdx].click();
            }
          }
        }
        return;
      }

      // 2. Caso 2: Modo Campanha RPG (Jogo Normal)
      const mainApp = document.getElementById('mainApp');
      const welcome = document.getElementById('welcomeScreen');
      const isNormalGameActive = mainApp && !mainApp.classList.contains('hidden') && (!welcome || welcome.classList.contains('hidden'));

      if (isNormalGameActive) {
        const isAnswered = state.answered;

        if (isAnswered) {
          if (key === 'ENTER' || key === ' ') {
            e.preventDefault();
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn && !nextBtn.disabled && nextBtn.style.display !== 'none') {
              nextBtn.click();
            }
          }
        } else {
          const optionKeys = ['1', '2', '3', '4', 'A', 'B', 'C', 'D'];
          const optIdx = optionKeys.indexOf(key) % 4;
          if (optIdx >= 0) {
            e.preventDefault();
            const btns = document.querySelectorAll('#options .option');
            if (btns && btns[optIdx] && !btns[optIdx].disabled) {
              btns[optIdx].click();
            }
          }
        }
        return;
      }
    });

