// NefroQuest — Changelog Modal, tooltip listeners, URL helpers
// Plain script — shares global scope with game.js

    // ============ CHANGELOG v5.0 ============
    function showChangelog() {
      document.querySelectorAll('.changelog-popup').forEach(el => el.remove());
      const modal = document.createElement('div');
      modal.className = 'modal show changelog-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:flex-start;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:12px 16px calc(env(safe-area-inset-bottom,0px)+80px);box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:540px;width:calc(100% - 32px);max-height:none;overflow-y:visible;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(255,215,0,0.3);margin:auto 0;">
          <h2 style="color:var(--gold);margin-bottom:4px;font-family:'MedievalSharp','Cinzel',serif;">📜 NOVIDADES 📜</h2>
          <div style="color:var(--txt-dim);font-size:0.75rem;margin-bottom:16px;">O que há de novo no NefroQuest: Ascension</div>

          <div class="modal-scroll-body" style="text-align:left;">

            <!-- v11.45 -->
            <div style="background:linear-gradient(135deg,rgba(251,191,36,0.18),rgba(251,191,36,0.06));border:2px solid rgba(251,191,36,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(251,191,36,0.9);color:#1a0e00;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.45</span>
                <span style="color:#fef3c7;font-weight:bold;font-size:0.95rem;">Ascensão do Erudito</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Redesenho do Grimório & Raridade</strong> — Adicionados badges de raridade (Comum, Raro, Épico, Lendário) e pergaminhos temáticos personalizados para celebrar suas descobertas científicas</li>
                <li><strong>Encontros Automáticos com Baús</strong> — Baús de relíquias e manuscritos agora surgem organicamente durante suas respostas corretas, concedendo pergaminhos ou novos equipamentos sem custo de ouro</li>
                <li><strong>Conhecimento Acumulado Definitivo</strong> — Acompanhe todo o seu saber acumulado no dashboard e conquiste a nova Coroa de Louros de Esculápio (Conquista de 1.000+ pontos de conhecimento)</li>
                <li><strong>Ajustes Clínicos Finos</strong> — Correções e auditoria completa de diretrizes KDIGO 2025/2026 e trials nefrológicos para máxima fidelidade científica</li>
                <li><strong>Melhorias de Layout</strong> — Ajustes no layout de feedback para telas móveis e eliminação de quebras de palavras indesejadas no meio da linha</li>
              </ul>
            </div>

            <!-- v6.2 -->
            <div style="background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(168,85,247,0.06));border:2px solid rgba(168,85,247,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(168,85,247,0.9);color:#fff;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v6.2</span>
                <span style="color:#e9d5ff;font-weight:bold;font-size:0.95rem;">Correções & Estabilidade</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Baú de artigos corrigido</strong> — botão de abrir parou de funcionar em algumas situações; resolvido</li>
                <li><strong>Timer do cronômetro</strong> — contador não reiniciava corretamente ao avançar questão com "Próxima"; corrigido</li>
                <li><strong>Vidas extras por dificuldade</strong> — o limite de vidas não respeitava a dificuldade selecionada; ajustado</li>
                <li><strong>Textos cortados no baú</strong> — valores clínicos com símbolo &lt; (ex.: &lt;120 mmHg) sumiam do resumo dos artigos; corrigido</li>
                <li><strong>Sobreposição de popups</strong> — janelas de comparação de equipamentos podiam se acumular; corrigido</li>
                <li><strong>Novo ícone</strong> — favicon atualizado em todas as plataformas</li>
              </ul>
            </div>

            <!-- v6.1 -->
            <div style="background:linear-gradient(135deg,rgba(255,215,0,0.18),rgba(255,215,0,0.06));border:2px solid rgba(255,215,0,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(255,215,0,0.9);color:#1a0e00;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v6.1</span>
                <span style="color:#fef3c7;font-weight:bold;font-size:0.95rem;">Refinamento Científico</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Organização por subespecialidade</strong> — questões reagrupadas em 15 domínios clínicos (DRC, glomerular, diálise, transplante, genética, eletrólitos, ácido-base e outros) para estudo direcionado</li>
                <li><strong>Trials atualizados</strong> — resultados de EMPA-KIDNEY, DAPA-CKD, FLOW, FIDELIO-DKD, BPROAD, CONVINCE e outros com HR, IC95% e endpoints conforme publicação original</li>
                <li><strong>Guidelines KDIGO 2024/2025/2026</strong> — alvos pressóricos, limiares de TFGe, critérios de indução/manutenção imunossupressora e monitoramento de HIF-PHI alinhados às atualizações</li>
                <li><strong>Modo Ponto Fraco mais preciso</strong> — categorização refinada torna o diagnóstico de lacunas por domínio mais fiel ao desempenho real</li>
                <li><strong>Acesso público liberado</strong> — catálogo completo disponível após cadastro</li>
              </ul>
            </div>

            <!-- v6.0 -->
            <div style="background:linear-gradient(135deg,rgba(99,202,183,0.18),rgba(99,202,183,0.06));border:2px solid rgba(99,202,183,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(99,202,183,0.85);color:#fff;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v6.0</span>
                <span style="color:#ccfbf1;font-weight:bold;font-size:0.95rem;">Lançamento & Freemium</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Domínio próprio</strong> — app disponível em <a href="https://nefroquest.com" style="color:#63cab7;">nefroquest.com</a></li>
                <li><strong>Sistema freemium</strong> — 50 questões gratuitas, acesso premium desbloqueável</li>
                <li><strong>Tela de preços</strong> — planos Gratuito, Mensal e Vitalício com preços regionais</li>
                <li><strong>Painel admin</strong> — lista de acesso para convidados via whitelist</li>
                <li><strong>Minha Conta & Seu Plano</strong> — novos menus no perfil do usuário</li>
                <li><strong>Email de confirmação</strong> — cadastro requer validação por link</li>
                <li><strong>Google OAuth atualizado</strong> — domínio nefroquest.com autorizado</li>
              </ul>
            </div>

          </div>

          <button class="btn gold" style="margin-top:12px;" data-close-closest=".modal">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('click');
    }

    resetGame();
    initWelcomeScreen();
    setTimeout(_checkStudyReminder, 3000);

    // Botão de preview só visível para desenvolvimento (?dev=1)
    const _urlParams = new URLSearchParams(window.location.search);
    if (_urlParams.get('dev') === '1') {
      const previewBtn = document.getElementById('bossPreviewBtn');
      if (previewBtn) previewBtn.style.display = '';
    }

    // Acesso direto ao Confronto Final via ?boss=1 (link de teste)
    if (_urlParams.get('boss') === '1') {
      // Aguarda o DOM estar pronto e inicia o boss preview automaticamente
      setTimeout(() => {
        startBossPreview();
      }, 300);
    }

    // Shortcuts do PWA (manifest.json): /?mode=study e /?mode=rapidquiz
    // Limpa o param da URL para não disparar de novo em reloads.
    const _mode = _urlParams.get('mode');
    if (_mode === 'study' || _mode === 'rapidquiz') {
      const _clean = window.location.pathname;
      window.history.replaceState({}, '', _clean);
      setTimeout(() => {
        try {
          if (_mode === 'study' && typeof window.showTopicSelector === 'function') {
            window.showTopicSelector();
          } else if (_mode === 'rapidquiz' && typeof window.showRapidQuizMinigame === 'function') {
            window.showRapidQuizMinigame(true);
          }
        } catch (e) {
          console.error('[PWA shortcut] erro ao abrir modo:', _mode, e);
        }
      }, 500);
    }

    // Throttle para mousemove/mouseover — evita jank em 60fps
    let _mmLast = 0;
    const _MM_THROTTLE = 40; // ms
    // Posicionar tooltips via JS para evitar corte
    document.addEventListener('mouseover', function(e){
      const badge = e.target.closest('.stat-badge');
      if(!badge) return;
      const tip = badge.querySelector('.stat-tip');
      if(!tip) return;
      const rect = badge.getBoundingClientRect();
      tip.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - 310)) + 'px';
      tip.style.top = Math.max(10, rect.top - tip.offsetHeight - 8) + 'px';
      // Se não cabe acima, coloca abaixo
      if(rect.top - tip.offsetHeight - 8 < 10){
        tip.style.top = (rect.bottom + 8) + 'px';
      }
    });

    // Tooltip de item ao passar mouse
    let itemTooltip = null;
    document.addEventListener('mousemove', function(e){
      const now = Date.now();
      if (now - _mmLast < _MM_THROTTLE) return;
      _mmLast = now;
      const item = e.target.closest('.item-with-tooltip');
      if(item){
        if(!itemTooltip){
          itemTooltip = document.createElement('div');
          itemTooltip.className = 'item-tooltip';
          document.body.appendChild(itemTooltip);
        }
        const name = item.getAttribute('data-item-name');
        const desc = item.getAttribute('data-item-desc');
        itemTooltip.innerHTML = `<strong>${escapeHtml(name)}</strong>${escapeHtml(desc)}`;
        itemTooltip.style.display = 'block';
        const x = Math.min(e.clientX + 15, window.innerWidth - 290);
        const y = Math.max(10, e.clientY - 60);
        itemTooltip.style.left = x + 'px';
        itemTooltip.style.top = y + 'px';
      } else if(itemTooltip){
        itemTooltip.style.display = 'none';
      }
    });
