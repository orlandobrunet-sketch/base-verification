// NefroQuest — Boss Battle (Confronto Final), Character Selection
// Plain script — shares global scope with game.js

    // ============================================================
    //  CONFRONTO FINAL — BOSS BATTLE MODE
    //  Ativa quando o jogador tem >= 90 acertos corretos
    //  As últimas 10 questões certas derrotam o Arqui-Nefromante
    // ============================================================

    const BOSS_START_CORRECT = 90;   // a partir deste acerto começa a batalha
    const BOSS_END_CORRECT   = 100;  // total de acertos para vencer

    /** Verifica se estamos na fase de Confronto Final */
    function isBossBattle() {
      return state.gameStarted &&
             state.correctTotal >= BOSS_START_CORRECT &&
             !state.gameCompleted;
    }

    /** Quantos ataques foram desferidos no boss (0-10) */
    function getBossProgress() {
      return Math.max(0, Math.min(10, state.correctTotal - BOSS_START_CORRECT));
    }

    /** HP do boss em % (100% → 0%) */
    function getBossHP() {
      return Math.max(0, 100 - getBossProgress() * 10);
    }

    function _getBossNarrText(progress) {
      if (progress >= 9) return '"Não... é impossível! Você vai acabar comigo!"';
      if (progress >= 6) return '"Sua sabedoria me corrói... mas a Uremia Eterna não será derrotada!"';
      if (progress >= 3) return '"Você ousou ferir-me com o conhecimento... Mas seu fim se aproxima!"';
      return '"Após noventa batalhas, você chega ao Trono da Uremia. O Arqui-Nefromante ergue-se diante de você."';
    }

    /**
     * Atualiza TODA a UI do Confronto Final.
     * Chamada após renderQuestion() e após cada resposta.
     */
    function updateBossUI() {
      const inBoss = isBossBattle();

      // ── Modo no body ──
      document.body.classList.toggle('boss-battle-mode', inBoss);
      // Classe especial para as últimas 10 questões (arqui-nefromante-final)
      document.body.classList.toggle('arqui-nefromante-final', inBoss);

      // ── Elementos boss ──
      const elHpBox          = document.getElementById('bossHpContainer');
      const elQNum           = document.getElementById('bossQuestionNum');
      const elBattleScene    = document.getElementById('bossBattleScene');
      const elPartyPanel     = document.getElementById('bossPartyPanel');
      const elHint           = document.getElementById('golpeFinalHint');
      const elStarsTop       = document.getElementById('finalMeterStarsTop');
      const elTitleMobile    = document.getElementById('arquiBossTitleMobile');
      const isMobile         = window.matchMedia('(max-width: 768px)').matches;
      const isArqui          = document.body.classList.contains('arqui-nefromante-final');
      const show = (el, v, disp) => { if(el) el.style.display = v ? (disp||'') : 'none'; };

      show(elHpBox,       inBoss);
      show(elQNum,        inBoss);
      // No modo arqui-nefromante-final, a cena de batalha fica oculta (heróis no painel esquerdo)
      show(elBattleScene, inBoss && !isArqui, 'flex');
      show(elPartyPanel,  false); // oculto — substituído por hero+equip+log no painel esquerdo
      show(elHint,        inBoss);
      // Estrelas no topo: no mobile arqui-nefromante-final ficam abaixo da HP bar (via CSS order)
      // Estrelas no topo: ocultar no desktop arqui-nefromante-final (as estrelas ficam dentro da barra HP)
      show(elStarsTop,    inBoss && !(isArqui && !isMobile), 'flex');
      // Título mobile: visível apenas no mobile em modo arqui-nefromante-final
      show(elTitleMobile, inBoss && isArqui && isMobile);

      if (!inBoss) {
        // Garante que elementos boss ficam ocultos fora do boss mode
        const nb = document.getElementById('bossNarrativeBox');
        const bl = document.getElementById('bossLogSection');
        const mc = document.getElementById('finalMeterContainer');
        const sd = document.getElementById('arquiStarsDesktop');
        const sm = document.getElementById('arquiStarsMobile');
        if (nb) nb.style.display = 'none';
        if (bl) bl.style.display = 'none';
        if (mc) mc.style.display = 'none';
        if (sd) sd.style.display = 'none';
        if (sm) sm.style.display = 'none';
        document.body.classList.remove('boss-battle-mode', 'arqui-nefromante-final');
        return;
      }

      const progress = getBossProgress();
      const hp       = getBossHP();

      // ── Narrativa do boss (painel esquerdo) ──
      const bossNarr = document.getElementById('bossNarrativeBox');
      if (bossNarr) {
        bossNarr.innerHTML = `
          <h3>☠ Confronto Final</h3>
          <p id="bossNarrText">${_getBossNarrText(progress)}</p>`;
      }

      // ── Log de batalha (painel esquerdo) ──
      const bossLogEl = document.getElementById('bossLogEntries');
      if (bossLogEl && state.bossLog && state.bossLog.length) {
        bossLogEl.innerHTML = [...state.bossLog].reverse()
          .slice(0, 12)
          .map(e => `<div class="boss-log-entry ${e.cls}">${e.txt}</div>`)
          .join('');
      }

      // ── HP Bar ──
      const hpFill  = document.getElementById('bossHpFill');
      const hpPct   = document.getElementById('bossHpPct');
      if (hpFill) hpFill.style.width = hp + '%';
      if (hpPct)  hpPct.textContent = `HP ${hp}%`;

      // Muda cor da barra conforme HP diminui
      if (hpFill) {
        hpFill.classList.toggle('boss-hp-fill--high', hp > 60);
        hpFill.classList.toggle('boss-hp-fill--med',  hp > 30 && hp <= 60);
        hpFill.classList.toggle('boss-hp-fill--low',  hp <= 30);
      }

      // ── Contador de questão ──
      const qNum = progress + 1;
      if (elQNum) {
        elQNum.textContent = progress >= 10
          ? 'FASE FINAL 10/10 — VITÓRIA!'
          : `FASE FINAL ${qNum}/10`;
      }

      // ── Botão Próxima: "ATACAR (responder)" nas questões 91-99, "GOLPE FINAL" apenas na última (100ª) ──
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn) nextBtn.textContent = progress >= 9 ? 'GOLPE FINAL' : 'ATACAR (PRÓXIMA PERGUNTA)';

      // ── Hint do botão ──
      if (elHint) {
        elHint.textContent = hp <= 10
          ? 'VITÓRIA GARANTIDA COM RESPOSTA CORRETA'
          : 'ATIVADO APÓS SELECIONAR A RESPOSTA CORRETA';
        elHint.classList.toggle('boss-hint--critical', hp <= 10);
      }

      // ── Medidor de estrelas (topo da página) ──
      const buildStars = (container) => {
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 10; i++) {
          const s = document.createElement('span');
          const isLastAndFilled = (i === 9 && progress >= 10);
          if (isLastAndFilled) {
            s.className = 'final-star star-last-gold';
          } else if (i < progress) {
            s.className = 'final-star filled';
          } else {
            s.className = 'final-star';
          }
          s.textContent = '★';
          container.appendChild(s);
        }
      };
      buildStars(elStarsTop);

      // ── Medidor de estrelas mobile (abaixo da HP bar) — oculto no arqui-nefromante-final (stars vão dentro da barra) ──
      const elStarsMobile = document.getElementById('arquiStarsMobile');
      if (elStarsMobile) {
        show(elStarsMobile, false);
      }

      // ── Medidor de estrelas desktop (abaixo da HP bar) ──
      const elStarsDesktop = document.getElementById('arquiStarsDesktop');
      if (elStarsDesktop) {
        buildStars(elStarsDesktop);
      }

      // ── Estrelas HP dentro da barra (desktop e mobile no modo arqui-nefromante-final) ──
      const elHpStarsDesktop = document.getElementById('arquiHpStarsDesktop');
      const elHpTrack = document.getElementById('bossHpTrack');
      if (elHpStarsDesktop && isArqui) {
        // Atualiza a largura do fundo roxo via CSS custom property (100% → 0% conforme progress)
        const hpWidthPct = Math.max(0, 100 - (progress * 10));
        if (elHpTrack) elHpTrack.style.setProperty('--hp-width', hpWidthPct + '%');
        // Renderiza as 10 estrelas + label HP dentro da barra
        elHpStarsDesktop.innerHTML = '';
        // Label HP à esquerda
        const hpLbl = document.createElement('span');
        hpLbl.style.cssText = 'font-family:"Philosopher",sans-serif;font-size:0.72rem;font-weight:700;color:#e9d5ff;letter-spacing:1.5px;position:relative;z-index:2;white-space:nowrap;margin-right:6px;text-shadow:0 0 8px rgba(216,180,254,0.9),0 0 16px rgba(168,85,247,0.6);';
        hpLbl.textContent = 'HP ' + hpWidthPct + '%';
        elHpStarsDesktop.appendChild(hpLbl);
        // Estrelas
        for (let i = 0; i < 10; i++) {
          const s = document.createElement('span');
          s.className = 'arqui-hp-star';
          if (i < progress) {
            s.classList.add('filled');
            if (i === progress - 1) s.classList.add('last-filled');
          }
          s.textContent = '★';
          elHpStarsDesktop.appendChild(s);
        }
      }

      // ── Medidor de estrelas (fundo do painel direito) ──
      const elStarsBottom = document.getElementById('finalMeterStars');
      const elMeterContainer = document.getElementById('finalMeterContainer');
      show(elMeterContainer, inBoss);
      buildStars(elStarsBottom);

      const meterResult = document.getElementById('finalMeterResult');
      if (meterResult) {
        if (progress >= 10) {
          meterResult.textContent = 'FINALIZADO';
          meterResult.classList.add('meter-result--active');
        } else if (hp <= 10) {
          meterResult.textContent = 'VITÓRIA GARANTIDA';
          meterResult.classList.add('meter-result--active');
        } else {
          meterResult.textContent = '';
          meterResult.classList.remove('meter-result--active');
        }
      }
      const meterHint = document.getElementById('finalMeterHint');
      if (meterHint) meterHint.textContent = 'ATIVADO APÓS A RESPOSTA CORRETA';

      // ── Boss image swap ──
      const bossImgEl      = document.getElementById('arquiBossImgEl');
      const bossGolpeText  = document.getElementById('bossGolpeFinalText');
      const bossImgWrapEl  = bossImgEl ? bossImgEl.closest('.boss-img-wrap') : null;
      if (bossImgEl && bossGolpeText) {
        if (progress >= 9) {
          // Última questão: esconde imagem, mostra "GOLPE FINAL"
          if (bossImgWrapEl) bossImgWrapEl.style.display = 'none';
          bossGolpeText.style.display = 'flex';
          // Popup battle_final — exibe apenas uma vez
          if (!state.battleFinalShown) {
            state.battleFinalShown = true;
            setTimeout(() => showBattleFinalPopup(), 200);
          }
        } else if (progress === 8) {
          // Penúltima questão: mostra clash_final
          if (bossImgWrapEl) bossImgWrapEl.style.display = '';
          bossGolpeText.style.display = 'none';
          if (bossImgEl.getAttribute('src') !== 'assets/clash_final.png') {
            bossImgEl.src = 'assets/clash_final.png';
            bossImgEl.style.objectPosition = 'center center';
          }
        } else {
          // Questões normais: mostra nefromancer
          if (bossImgWrapEl) bossImgWrapEl.style.display = '';
          bossGolpeText.style.display = 'none';
          if (bossImgEl.getAttribute('src') !== 'assets/nefromancer.png') {
            bossImgEl.src = 'assets/nefromancer.png';
            bossImgEl.style.objectPosition = 'center 30%';
          }
        }
      }

      // ── Heróis na party panel, battle scene e strip mobile ──
      const heroData = {
        nephros:    { party: 'partyHero1Img', battle: 'battleHero1', strip: 'arquiStripHero1', folder: 'clerigo_renal',        ext: 'jpg' },
        aquaria:    { party: 'partyHero2Img', battle: 'battleHero2', strip: 'arquiStripHero2', folder: 'maga_metabolica',      ext: 'jpg' },
        glomerulus: { party: 'partyHero3Img', battle: 'battleHero3', strip: 'arquiStripHero3', folder: 'guerreiro_glomerular', ext: 'png' }
      };
      const selChar = state.character;
      const lv = Math.min(state.level, 10);

      Object.entries(heroData).forEach(([key, info]) => {
        const isSelected = (key === selChar);
        const lvToUse = isSelected ? lv : Math.min(lv, 5);
        const src = `assets/classes/${info.folder}/nivel_${String(lvToUse).padStart(2, '0')}.${info.ext}`;

        const partyEl  = document.getElementById(info.party);
        const battleEl = document.getElementById(info.battle);
        const stripEl  = document.getElementById(info.strip);
        if (partyEl) {
          partyEl.src = src;
          partyEl.classList.toggle('hero-selected', isSelected);
        }
        if (battleEl) {
          battleEl.src = src;
          battleEl.classList.toggle('hero-selected', isSelected);
        }
        if (stripEl) {
          stripEl.src = src;
          stripEl.classList.toggle('hero-selected', isSelected);
        }
      });

      // Estado crítico de HP
      document.body.classList.toggle('boss-hp-critical', hp <= 30);

      // ── Imagem boss retangular desktop: troca para batalha na questão 9 (progress === 8) ──
      const arquiBossImgEl = bossImgEl; // reutiliza o querySelector já feito acima (L-7)
      if (arquiBossImgEl && isArqui) {
        if (progress >= 9) {
          arquiBossImgEl.src = 'assets/battle_final.png';
          arquiBossImgEl.style.objectPosition = 'center top';
          arquiBossImgEl.style.clipPath = 'inset(0 0 9% 0)';
        } else {
          arquiBossImgEl.src = 'assets/nefromancer.png';
          arquiBossImgEl.style.objectPosition = 'center 30%';
        }
      }

      // ── Popup Golpe Final na última questão (progress === 9 = questão 10/10) ──
      if (progress === 9 && isArqui) {
        const popup = document.getElementById('arquiQ9Popup');
        if (popup && !popup._shown) {
          popup._shown = true;
          popup.style.display = 'flex';
        }
      }
    }

    /**
     * Injeta os ícones de letra (A/B/C/D) nas opções em boss mode.
     * Deve ser chamada APÓS renderQuestion() preencher as options.
     */
    function applyBossOptionBadges() {
      // No modo arqui-nefromante-final: garantir que o prefixo A) B) C) D)
      // esteja no texto como texto simples (igual página normal), sem badge circular
      if (!isBossBattle()) return;
      const opts = document.querySelectorAll('#options .option');
      const letters = ['A','B','C','D'];
      opts.forEach((btn, i) => {
        // Remover badge circular caso exista de execução anterior
        btn.querySelectorAll('.boss-letter-badge').forEach(b => b.remove());
        // Garantir que o texto já começa com "A) " — se foi removido, restaurar
        const textNode = [...btn.childNodes].find(n => n.nodeType === 3);
        if (textNode) {
          const prefix = (letters[i] || String.fromCharCode(65+i)) + ') ';
          if (!textNode.textContent.trim().startsWith(prefix.trim())) {
            textNode.textContent = prefix + textNode.textContent.replace(/^[A-D]\)\s*/, '');
          }
        }
      });
    }

    /**
     * Anima a estrela recém-conquistada com efeito "pop".
     * Chamado após acerto correto em boss mode.
     */
    function animateLastBossStar() {
      if (!isBossBattle()) return;
      const progress = getBossProgress();   // já foi incrementado
      const idx = progress - 1;
      // Anima nas três barras (topo, fundo e mobile)
      ['finalMeterStarsTop', 'finalMeterStars', 'arquiStarsMobile', 'arquiStarsDesktop'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const stars = el.querySelectorAll('.final-star');
        if (stars[idx]) {
          stars[idx].classList.add('pop');
          setTimeout(() => stars[idx]?.classList.remove('pop'), 600);
        }
      });
    }

    // ── Demo / Preview mode ─────────────────────────────────────

    /**
     * Inicia diretamente o Confronto Final para revisão rápida.
     * Usa o primeiro personagem, seta correctTotal=90 e salta para o jogo.
     */
    function startBossPreview() {
      // Escolhe Dr. Nephros como personagem padrão
      state.character = 'nephros';
      // Inicializa estado
      Object.assign(state, {
        level: 12, xp: 0, xpToNext: 500,
        score: 24970, lives: 3, streak: 0, gold: 500,
        current: null, answered: false, bonusUses: 0,
        correctTotal: 90, narrativeShown: 90, bossIntroShown: true,
        gameOver: false, gameStarted: true,
        extraLifeGiven: false, gameCompleted: false,
        completedGame: false, chestsOpened: 3
      });
      state.equipment = {
        weapon: { n:'Lança Glomerular',  rar:'epic',  atk:8, def:3, kno:6, luck:4 },
        armor:  { n:'Égide Dialítica',   rar:'epic',  atk:2, def:7, kno:3, luck:1 },
        relic:  { n:'Orbe da Cistatina', rar:'epic',  atk:2, def:2, kno:6, luck:2 }
      };
      state.heroName = 'Previewer';

      // Fecha welcome
      document.getElementById('welcomeScreen')?.classList.add('hidden');
      document.getElementById('mainApp')?.classList.remove('hidden');
      document.getElementById('actionDock')?.classList.remove('hidden');

      ui.journal.innerHTML = '';
      log('⚔️ [PREVIEW] Confronto Final iniciado — correctTotal=90.');

      shuffleQueue();
      renderHUD();
      updateBadges();
      renderQuestion();
      updateBossUI();
      applyBossOptionBadges();
      saveGame();

      // Toca som de boss
      setTimeout(() => playSound('boss'), 400);
    }

    // ============================================================
    // ============ SISTEMA DE NARRATIVA PROGRESSIVA ============
    const narrativeStages = [
      {at:5, ch:"Capítulo I", title:"O Chamado das Águas", text:"Nos corredores sombrios do Hospital dos Néfrons Perdidos, um pergaminho antigo cai em suas mãos. Nele, um alerta: o Arqui-Nefromante está corrompendo os rins do reino, transformando néfrons saudáveis em pedra. Apenas um médico corajoso pode impedi-lo. Sua jornada começa agora."},
      {at:10, ch:"Capítulo II", title:"As Criptas da Creatinina", text:"Você desce às Criptas da Creatinina, onde os primeiros sinais da corrupção são visíveis. Túbulos proximais enegrecidos, glomérulos encolhidos... O Arqui-Nefromante deixou rastros de ureia cristalizada. Cada questão que você domina purifica um néfron. Continue — os rins precisam de você."},
      {at:15, ch:"Capítulo III", title:"A Floresta dos Eletrólitos", text:"A Floresta dos Eletrólitos é um lugar traiçoeiro. Sódio e potássio flutuam como espíritos desequilibrados. Você encontra um velho mestre nefrologista que sussurra: 'O equilíbrio ácido-base é a chave. Sem ele, nenhum rim sobrevive.' Suas respostas corretas restauram a harmonia iônica."},
      {at:20, ch:"Capítulo IV", title:"O Lago da Filtração", text:"No Lago da Filtração, a água cristalina está turva. A barreira glomerular foi danificada — proteínas escapam para a urina como ouro derramado. Você precisa reconstruir os podócitos, um por um. Cada acerto é um passo para restaurar a membrana basal. A proteinúria diminui."},
      {at:25, ch:"Capítulo V", title:"As Montanhas do SRAA", text:"As Montanhas do Sistema Renina-Angiotensina-Aldosterona são imponentes. No topo, a angiotensina II sopra ventos de vasoconstrição sobre o reino. Você empunha o Escudo do IECA e avança. Com cada resposta certa, a pressão intraglomerular cede. Os néfrons respiram aliviados."},
      {at:30, ch:"Capítulo VI", title:"O Deserto da Diálise", text:"O Deserto da Diálise é árido e implacável. Aqui vivem os pacientes que perderam a batalha contra a DRC. Mas há esperança: as máquinas de hemodiálise brilham como oásis. Você aprende seus segredos — clearance, Kt/V, ultrafiltração. Cada conhecimento salva uma vida."},
      {at:35, ch:"Capítulo VII", title:"A Caverna dos Imunocomplexos", text:"Nas profundezas da Caverna dos Imunocomplexos, depósitos de IgA e complemento brilham nas paredes como cristais malignos. Glomerulonefrites se escondem em cada sombra. Você identifica padrões — mesangial, membranoso, crescêntico. Seu conhecimento é sua arma mais poderosa."},
      {at:40, ch:"Capítulo VIII", title:"A Torre do Transplante", text:"A Torre do Transplante se ergue no horizonte, brilhante e cheia de promessas. Mas o caminho é guardado por rejeições hiperagudas e crises de ciclosporina. Você estuda compatibilidade HLA, imunossupressão, e infecções oportunistas. Um rim novo aguarda quem provar ser digno."},
      {at:45, ch:"Capítulo IX", title:"O Labirinto Cardiorrenal", text:"O Labirinto Cardiorrenal é onde coração e rim se entrelaçam em destino compartilhado. SGLT2i, finerenona, ARM — as armas modernas estão ao seu alcance. Cada corredor revela uma síndrome diferente. Tipo 1, tipo 2, tipo 3... Você navega com precisão. A tríade terapêutica se completa."},
      {at:50, ch:"Capítulo X", title:"O Vulcão da Rabdomiólise", text:"O Vulcão da Rabdomiólise entra em erupção! Mioglobina incandescente desce pelas encostas, obstruindo túbulos e destruindo néfrons. Você ordena hidratação agressiva, alcalinização da urina, e monitoramento de CPK. A lava esfria. Os rins sobrevivem — por enquanto."},
      {at:55, ch:"Capítulo XI", title:"O Pântano da Acidose", text:"O Pântano da Acidose Tubular é traiçoeiro. pH urinário que não baixa, hipocalemia persistente, nefrocalcinose... Você diferencia tipo 1, tipo 2 e tipo 4 com maestria. Citrato de potássio na mão, bicarbonato no bolso. O equilíbrio ácido-base é restaurado, néfron por néfron."},
      {at:60, ch:"Capítulo XII", title:"As Muralhas de KDIGO", text:"As Muralhas de KDIGO protegem o conhecimento acumulado de gerações de nefrologistas. TFG, albuminúria, mapa de calor de risco — tudo se conecta. Você estuda as diretrizes como um guerreiro estuda mapas de batalha. G1 a G5, A1 a A3. A estratificação é sua bússola."},
      {at:65, ch:"Capítulo XIII", title:"O Templo dos SGLT2i", text:"No Templo dos SGLT2i, os pergaminhos sagrados do DAPA-CKD e EMPA-KIDNEY revelam verdades revolucionárias. Nefroproteção independente de diabetes! O 'dip' inicial da TFG não é dano — é proteção. Você empunha a dapagliflozina como uma espada de luz contra a progressão renal."},
      {at:70, ch:"Capítulo XIV", title:"A Ponte dos Podócitos", text:"A Ponte dos Podócitos conecta o mundo glomerular ao tubular. Cada podócito é um guardião da barreira de filtração. FSGS, nefropatia membranosa, GESF... Você aprende a reconhecer padrões na microscopia eletrônica. PLA2R brilha como um farol diagnóstico. A ponte se fortalece."},
      {at:75, ch:"Capítulo XV", title:"O Abismo da Hipercalemia", text:"O Abismo da Hipercalemia se abre sob seus pés! Ondas T apiculadas, QRS alargado — o coração do reino está em perigo. Gluconato de cálcio para estabilizar, insulina com glicose para redistribuir, resina para eliminar. Você age rápido. O ECG normaliza. O reino respira."},
      {at:80, ch:"Capítulo XVI", title:"A Fortaleza da Finerenona", text:"A Fortaleza da Finerenona é a última adição ao arsenal nefroprotetor. ARM não esteroidal, sem a ginecomastia da espironolactona. FIDELIO-DKD e FIGARO-DKD provam seu valor. A tríade está completa: IECA/BRA + SGLT2i + Finerenona. O Arqui-Nefromante treme."},
      {at:85, ch:"Capítulo XVII", title:"O Santuário da Peritoneal", text:"No Santuário da Diálise Peritoneal, o peritônio é a membrana sagrada. Você aprende sobre trocas osmóticas, icodextrina, peritonite e esclerose encapsulante. Cada paciente é único — adequação, clearance, ultrafiltração. O santuário brilha com conhecimento aplicado."},
      {at:90, ch:"Capítulo XVIII", title:"O Portal do Xenotransplante", text:"Um portal brilhante se abre: o futuro do transplante renal! Rins suínos geneticamente editados, 10 modificações genéticas para vencer a rejeição hiperaguda. Montgomery e Riella mostram o caminho. A fila de transplante pode ter seus dias contados. O futuro é agora."},
      {at:93, ch:"⚡ Feitiço do Arqui-Nefromante", title:"A Névoa da Azotemia", stun:true, text:"O Arqui-Nefromante ergue o cajado e grita: 'AZOTEMIA NEBULOSA!' — um raio de ureia cristalizada te atinge em cheio! A névoa tóxica invade seus sentidos. Seus equipamentos ficam paralisados pelo veneno urêmico... você sente as pernas pesadas, a mente turva. Mas a chama do conhecimento ainda pulsa dentro de você. Resista — a recuperação começa em breve!"},
      {at:95, ch:"Capítulo XIX", title:"O Confronto com o Arqui-Nefromante", text:"Finalmente, você chega ao Trono da Uremia, onde o Arqui-Nefromante aguarda. Ele lança feitiços de azotemia, hiperfiltração maligna e nefrotoxicidade. Mas você está preparado — cada questão respondida foi um feitiço aprendido. A batalha final começa!"},
      {at:98, ch:"⚔️ Recuperação do Herói", title:"A Chama dos Néfrons", stunRecovery:true, text:"O veneno urêmico começa a ser filtrado pelos seus próprios néfrons purificados! A névoa se dissipa. Seus equipamentos voltam a brilhar — a força retorna! O Arqui-Nefromante recua, visivelmente abalado: 'Im-impossível... nenhum nefrologista sobrevive ao meu Feitiço da Azotemia!' Você sorri. Restam apenas 2 acertos. O golpe final está ao alcance — não deixe escapar!"},
      {at:99, ch:"Capítulo XX", title:"A Última Prova", text:"O Arqui-Nefromante ergue seu cajado sombrio. Rins corrompidos orbitam ao seu redor como satélites de pura destruição renal. Seus golens de uremia avançam. Ele ri: 'Você acha que pode me derrotar? Eu sou a Insuficiência Renal Eterna!' Mas você sente o poder de todo o conhecimento acumulado pulsando em suas veias. Uma última questão. Uma última resposta. O destino dos rins do reino depende de você.", boss:true},
      {at:100, ch:"Epílogo", title:"Os Rins Foram Salvos!", text:"Com um último golpe de conhecimento puro, o Arqui-Nefromante é derrotado! Os néfrons do reino voltam a filtrar com perfeição. A creatinina normaliza, a proteinúria desaparece, o equilíbrio hidroeletrolítico é restaurado. Você é coroado(a) como o(a) Grande Guardião(ã) dos Rins. A nefrologia está salva — graças a você!"}
    ];


    // ============================================================
    // ============ BOSS STUN MECHANIC (questões 93–97) ============
    // O Arqui-Nefromante atordoa o herói na questão 93.
    // Equipamentos ficam bloqueados (visual + stats zerados) até a questão 98.
    // ============================================================

    function applyBossStun() {
      state.bossStunActive = true;
      document.body.classList.add('boss-stun-active');
      const app = document.getElementById('mainApp');
      if (app) {
        app.classList.add('boss-stun-shake');
        // Remove a animação de shake após ela completar (não fica tremendo eternamente)
        setTimeout(() => app.classList.remove('boss-stun-shake'), 1200);
      }
      renderEquip();
      if (typeof _toast === 'function')
        _toast('⚡ Atordoado! Equipamentos bloqueados até 98 acertos.', 'warning', 4000);
    }

    function removeStun() {
      state.bossStunActive = false;
      document.body.classList.remove('boss-stun-active');
      const app = document.getElementById('mainApp');
      if (app) app.classList.remove('boss-stun-shake');
      if (typeof renderEquip === 'function') renderEquip();
    }

    // ============ NARRATIVAS DE INÍCIO POR PERSONAGEM ============
    const CHARACTER_INTROS = {
      nephros:   { ch: 'Dr. Nephros · Guardião dos Néfrons',   text: 'O Reino dos Néfrons está sob ameaça. O Arqui-Nefromante corrompe cada túbulo com ignorância clínica — hipercalemia subestimada, DRC diagnosticada tarde, néfrons perdidos para sempre. Você enxerga o que outros ignoram: cada questão correta é um néfron preservado. A jornada começa agora.' },
      aquaria:   { ch: 'Dra. Aquaria · Mestra das Águas',      text: 'Onde outros veem números, você vê correntes. O Arqui-Nefromante semeia desequilíbrio — hiponatremia que destrói neurônios, acidose que afoga tecidos. Seu domínio é o equilíbrio hidroeletrolítico. Cada resposta certa é uma maré controlada. O reino aguarda sua maestria.' },
      glomerulus:{ ch: 'Dr. Glomerulus · Lâmina dos Glomérulos', text: 'A guerra acontece no nível celular. IgA se deposita, podócitos são apagados, glomérulos perdidos não se regeneram. O Arqui-Nefromante conta com a ignorância dos clínicos. Seu raciocínio é sua arma, as diretrizes são sua armadura. Cada questão correta é um glomérulo preservado.' }
    };

    function selectCharacter(charId) {
      state.character = charId;
      document.getElementById('charSelectModal').classList.remove('show');
      showCharacterIntroModal(charId);
    }

    function showCharacterIntroModal(charId) {
      document.getElementById('charIntroOverlay')?.remove();
      const intro = CHARACTER_INTROS[charId];
      const popup = document.createElement('div');
      popup.className = 'narrative-popup';
      popup.id = 'charIntroOverlay';
      popup.innerHTML = `
        <div class='narrative-card'>
          <div class='narr-chapter'>⚔️ Início da Jornada</div>
          <h3>📖 ${intro.ch}</h3>
          <div class='narr-text'>${intro.text}</div>
          <button class='btn gold' data-action="closeIntroAndStart">⚔️ Iniciar Jornada</button>
        </div>`;
      document.body.appendChild(popup);
      playSound('click');
    }

    function closeIntroAndStart() {
      const overlay = document.getElementById('charIntroOverlay');
      if (overlay) overlay.remove();
      startGameWithCharacter().catch(err => {
        console.error('startGameWithCharacter error:', err);
        _toast('Erro ao iniciar o jogo. Recarregue a página.', 'error');
      });
    }
    
    async function startGameWithCharacter() {
      // Convidados usam _showGuestHook (hook suave em 15 questões), não o paywall global
      if (!_guestMode && !isPremium() && getGameStats().questionsAnsweredAllTime >= FREE_QUESTIONS_LIMIT) {
        showPricingModal();
        return;
      }
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
      const char = characters[state.character];

      _sessionWrongAnswers = [];
      _minigameTriggerCount = 0;
      _boardPushedThisSession = false; // reset rate limit a cada novo jogo
      const _diffLives = {easy:5, normal:4, hard:3, hardcore:1};
      const _chosenDiff = state.difficulty || 'normal';
      const _startLives = _diffLives[_chosenDiff] || 3;
      Object.assign(state,{level:1,xp:0,xpToNext:200,score:0,lives:_startLives,maxLives:_startLives,streak:0,gold:0,difficulty:_chosenDiff,legendaryAbilityUsed:{},current:null,answered:false,bonusUses:0,correctTotal:0,narrativeShown:0,bossIntroShown:false,battleFinalShown:false,gameOver:false,gameStarted:true,extraLifeGiven:false,gameCompleted:false,completedGame:false,chestsOpened:0,bossLog:[],bossStunActive:false});
      removeStun(); // garante limpeza de resíduo de partida anterior
      chestCost = 100;
      state.equipment={
        weapon:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        armor:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        relic:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0}
      };
      ui.journal.innerHTML='';
      const _q9p = document.getElementById('arquiQ9Popup');
      if (_q9p) { _q9p._shown = false; _q9p.style.display = 'none'; }
      log(`🎭 ${char.name}, ${char.title}, inicia sua jornada no Reino Sombrio do Néfron!`);
      shuffleQueue();
      renderHUD();
      updateBadges();
      renderQuestion();
      saveGame();
      // Garantir que a música da jornada está tocando (fallback caso dismissWelcome não tenha iniciado)
      if (musicEnabled && !musicStarted) startBgMusic();
    }
