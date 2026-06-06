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

            <!-- v11.66 -->
            <div style="background:linear-gradient(135deg,rgba(56,189,248,0.18),rgba(56,189,248,0.06));border:2px solid rgba(56,189,248,0.6);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(56,189,248,0.9);color:#04222e;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.66</span>
                <span style="color:#e0f2fe;font-weight:bold;font-size:0.95rem;">Correção de Siglas e Conteúdo</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Siglas em português 🇧🇷</strong> — Varredura do banco de questões padronizando siglas: DRPAD (Doença Renal Policística Autossômica Dominante), LECO (litotripsia extracorpórea), TFGe, GESF, SRAA e "doença renal terminal", substituindo variantes e siglas em inglês.</li>
                <li><strong>Cálculo coraliforme reescrito 🪨</strong> — Questão sobre conduta no cálculo coraliforme atualizada com diretrizes de urolitíase (EAU/AUA), priorizando a nefrolitotomia percutânea.</li>
              </ul>
            </div>

            <!-- v11.60 -->
            <div style="background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(168,85,247,0.06));border:2px solid rgba(168,85,247,0.6);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(168,85,247,0.9);color:#fff;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.60</span>
                <span style="color:#e9d5ff;font-weight:bold;font-size:0.95rem;">Ajustes de Experiência</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Confronto Final em duas partes ☠️</strong> — A narrativa de abertura do Arqui-Nefromante agora é dividida em dois passos (sem barra de rolagem), com a imagem do boss fixa.</li>
                <li><strong>Julgamento Rápido mais justo ⏱️</strong> — Tempo por afirmação aumentado para 12 segundos.</li>
                <li><strong>Conquistas e Oráculo 🏆</strong> — Badges de conquista redimensionados e botão do Oráculo simplificado para "Consultar Oráculo".</li>
              </ul>
            </div>

            <!-- v11.57 -->
            <div style="background:linear-gradient(135deg,rgba(251,191,36,0.18),rgba(56,189,248,0.06));border:2px solid rgba(251,191,36,0.6);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(251,191,36,0.9);color:#1a0e00;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.57</span>
                <span style="color:#fef3c7;font-weight:bold;font-size:0.95rem;">Avaliação de Questões e Ajustes</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Avaliação Interativa ⭐</strong> — As estrelas de Qualidade (amarelo) e Aprendizado (azul) agora preenchem ao passar o mouse e fixam ao clicar, sem mensagem de confirmação. A nota é salva ao avançar de questão.</li>
                <li><strong>Sinalizar Questão 🚩</strong> — O botão de bandeira virou um link discreto "sinalizar questão problemática" na área de feedback (fica vermelho ao passar o mouse) — e voltou a funcionar.</li>
                <li><strong>Botão Início Legível 🏠</strong> — Corrigida a cor do rótulo dos botões Início e Grimório, que estavam ilegíveis.</li>
              </ul>
            </div>

            <!-- v11.56 -->
            <div style="background:linear-gradient(135deg,rgba(56,189,248,0.18),rgba(56,189,248,0.06));border:2px solid rgba(56,189,248,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(56,189,248,0.9);color:#04222e;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.56</span>
                <span style="color:#e0f2fe;font-weight:bold;font-size:0.95rem;">Correção da Tela de Novidades</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Changelog restaurado 📜</strong> — Corrigido erro de sintaxe que impedia esta própria tela de novidades de abrir. Tudo funcionando novamente.</li>
              </ul>
            </div>

            <!-- v11.55 -->
            <div style="background:linear-gradient(135deg,rgba(16,185,129,0.18),rgba(16,185,129,0.06));border:2px solid rgba(16,185,129,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(16,185,129,0.9);color:#062d1c;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.55</span>
                <span style="color:#ecfdf5;font-weight:bold;font-size:0.95rem;">Estabilidade e Dívida Técnica Resolvida</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Estabilidade no Áudio (FSM) 🎵</strong> — Implementação de Máquina de Estados Finita para o sistema de áudio, eliminando condições de corrida sutis e contornando bloqueios rígidos de autoplay nos navegadores.</li>
                <li><strong>Idempotência no Ranking 🏆</strong> — Novo FSM com timeout defensivo de 10 segundos no controle de envios ao leaderboard, blindando contra duplicidades de registros em conexões instáveis.</li>
                <li><strong>Mitigação de XSS (Superfície Limpa) 🛡️</strong> — Migração total de renderizadores baseados em HTML bruto para criação estruturada com a API DOM ('document.createElement') e 'textContent' no ranking, dashboard e painel de controle.</li>
                <li><strong>Observabilidade e Telemetria 📊</strong> — Roteador unificado de exceções pegando erros silenciosos anteriores e canalizando logs contextuais detalhados para Sentry e GA4.</li>
                <li><strong>Setup Rápido de E2E 🛠️</strong> — Provisionamento direto de navegadores via script 'npm run setup:e2e' e separação de smoke-tests obrigatórios na automação CI.</li>
              </ul>
            </div>

            <!-- v11.54 -->
            <div style="background:linear-gradient(135deg,rgba(251,191,36,0.18),rgba(251,191,36,0.06));border:2px solid rgba(251,191,36,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(251,191,36,0.9);color:#1a0e00;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.54</span>
                <span style="color:#fef3c7;font-weight:bold;font-size:0.95rem;">Interface RPG e Ajustes Mobile</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Mockup de Comparação Concluído ⚔️</strong> — Nova tela de substituição de equipamentos redesenhada com duas colunas (imagem à esquerda, atributos alinhados à direita), com nome e raridade agrupados no cabeçalho do item. Destaque dourado e brilho animado no novo item.</li>
                <li><strong>Botões Alinhados 💰</strong> — Botão de manter o item atual com tamanho ajustado para evitar quebras de linhas na navegação móvel.</li>
                <li><strong>Ajustes de Som Mobile 🔊</strong> — Sliders de volume ocultados no mobile para manter apenas os botões de ligar/desligar em formato de quadradinho discreto.</li>
                <li><strong>Remoção de Bordas no Mobile 📱</strong> — Bordas e sombras externas dos painéis desativadas nas telas móveis, proporcionando um visual mais limpo.</li>
                <li><strong>Dashboard Direto 📊</strong> — Botão "Dashboard" direto na tela inicial de boas-vindas do jogo.</li>
              </ul>
            </div>

            <!-- v11.52 -->
            <div style="background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(168,85,247,0.06));border:2px solid rgba(168,85,247,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(168,85,247,0.9);color:#fff;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.52</span>
                <span style="color:#e9d5ff;font-weight:bold;font-size:0.95rem;">Correção Científica e Referências</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Questão de Glúten na NIgA 🔬</strong> — Reformulação da questão sobre restrição de glúten na nefropatia por IgA primária, especificando paciente sem doença celíaca para precisão acadêmica.</li>
                <li><strong>Atualização de Diretrizes KDIGO 📚</strong> — Integração das diretrizes KDIGO 2025 de IgAN/IgAV e diretrizes ACG 2023 de Doença Celíaca nas referências e explicações.</li>
              </ul>
            </div>

            <!-- v11.50 -->
            <div style="background:linear-gradient(135deg,rgba(96,165,250,0.18),rgba(96,165,250,0.06));border:2px solid rgba(96,165,250,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(96,165,250,0.9);color:#0f172a;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.50</span>
                <span style="color:#eff6ff;font-weight:bold;font-size:0.95rem;">Sincronização de Objetivos e Cores</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Objetivos da Home Reativos 🔄</strong> — Os capítulos da jornada lateral na home agora atualizam-se reativamente com base no nível do herói.</li>
                <li><strong>Revitalização do Dourado Lendário 🎨</strong> — Melhoria na legibilidade e saturação dos tons dourados no Grimório, evitando tons cinzentos em fundos escuros.</li>
              </ul>
            </div>

            <!-- v11.48 -->
            <div style="background:linear-gradient(135deg,rgba(52,211,153,0.18),rgba(52,211,153,0.06));border:2px solid rgba(52,211,153,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(52,211,153,0.9);color:#0f172a;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.48</span>
                <span style="color:#eff6ff;font-weight:bold;font-size:0.95rem;">Consistência & Nuvem Hardened</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Sincronização Imediata (Supabase) 🔄</strong> — Salvamento instantâneo em eventos-chave (fim de jogo, escolha de dificuldade, conclusão de minijogos e background) para evitar inconsistência de progresso inter-dispositivos.</li>
                <li><strong>Isolamento de Contas no Logout 🔒</strong> — Limpeza total de chaves do localStorage ao deslogar para garantir privacidade e segurança em ambientes compartilhados.</li>
                <li><strong>Bloqueio de Clique Externo nos Modais 🛡️</strong> — Todos os modais principais (como Forja, Lore, Sinalização e Modos de Jogo) agora apenas fecham via botão específico de fechar, evitando perdas acidentais de foco.</li>
              </ul>
            </div>

            <!-- v11.47 -->
            <div style="background:linear-gradient(135deg,rgba(96,165,250,0.18),rgba(96,165,250,0.06));border:2px solid rgba(96,165,250,0.7);border-radius:10px;padding:16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <span style="background:rgba(96,165,250,0.9);color:#0f172a;font-size:0.75rem;font-weight:900;padding:3px 10px;border-radius:20px;font-family:'Cinzel',serif;">v11.47</span>
                <span style="color:#eff6ff;font-weight:bold;font-size:0.95rem;">Ascensão da Usabilidade</span>
              </div>
              <ul style="margin:0;padding-left:18px;color:#c8d8f0;font-size:0.82rem;line-height:1.8;">
                <li><strong>Estudo Livre Offline 📡</strong> — Estude de qualquer lugar sem internet; suas respostas são salvas localmente e sincronizadas automaticamente ao restabelecer a conexão</li>
                <li><strong>Atalhos de Teclado ⌨️</strong> — Responda com facilidade usando as teclas 1-4 ou A-D e avance usando Enter ou Espaço</li>
                <li><strong>Dano Flutuante e Tátil 🎮</strong> — Feedbacks de combate dinâmicos na barra de vida e vibrações táteis calibradas para respostas certas, erradas e níveis</li>
                <li><strong>Histórico Completo & Explorer 🔍</strong> — Nova aba no painel para pesquisar por termos (ex: IgA, Lupus, iSGLT2) e revisar erros recentes</li>
                <li><strong>Previsão de Revisões (SRS) 📈</strong> — Planeje suas sessões com base em um gráfico de revisões pendentes para os próximos 7 dias</li>
                <li><strong>Ajustes Finos de Layout 📱</strong> — Correção de espaçamento inferior (safe area) no mobile e destaque visual para o seu principal Ponto Fraco</li>
              </ul>
            </div>

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
