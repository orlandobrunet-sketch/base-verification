// NefroQuest — Central de Comando do aprendizado
// Página interna, orientada por dados locais reais e pelos contratos existentes do jogo.

(function () {
  'use strict';

  const DASH_TABS = [
    { id: 'overview', label: 'Visão geral', eyebrow: 'Sala de Conduta' },
    { id: 'skills', label: 'Skills', eyebrow: 'Prontuário de Domínio' },
    { id: 'mapa', label: 'Mapa', eyebrow: 'Atlas de Domínio' },
    { id: 'achievements', label: 'Conquistas', eyebrow: 'Gabinete de Selos' },
    { id: 'library', label: 'Biblioteca', eyebrow: 'Arquivo de Evidências' },
    { id: 'ranking', label: 'Ranking', eyebrow: 'Registro da Ordem' },
  ];

  const CHARACTER_META = {
    nephros: {
      name: 'Dr. Nephros',
      title: 'Guardião dos Néfrons',
      folder: 'clerigo_renal',
      ext: 'jpg',
    },
    aquaria: {
      name: 'Dra. Aquaria',
      title: 'Mestra das Águas',
      folder: 'maga_metabolica',
      ext: 'jpg',
    },
    glomerulus: {
      name: 'Dr. Glomerulus',
      title: 'Cientista Renal',
      folder: 'guerreiro_glomerular',
      ext: 'png',
    },
  };

  const BADGE_MILESTONES = [
    { name: 'Vórtice do Néfron', required: 20 },
    { name: 'Sábio do Microscópio', required: 40 },
    { name: 'Guardião das Águas', required: 60 },
    { name: 'Árbitro dos Rins', required: 80 },
    { name: 'Ascendido do NefroQuest', required: 100 },
  ];

  const ERROR_REASON_LABELS = {
    knowledge: 'Lacuna de conhecimento',
    between_two: 'Discriminação fina',
    confusion: 'Confusão de conceitos',
    anchoring: 'Ancoragem',
    misread: 'Erro de leitura',
    guess: 'Chute',
  };

  let _lastFocusedElement = null;
  let _previousBodyOverflow = '';
  let _inertedElements = [];
  let _activeTab = 'overview';
  let _dashboardData = null;
  let _dashLbMode = 'record';
  let _lbFullData = [];
  let _rankingLoaded = false;
  let _rankingRequestId = 0;
  let _rankingSearchTimer = null;

  const ACID_BASE_CASE_IDS = new Set([
    'aldric', 'mara', 'theron', 'vance', 'kael', 'vorgath', 'selene', 'edrin', 'liora', 'borius',
    'isolde', 'corvin', 'ophelia', 'helena', 'brann', 'nara', 'galen', 'maelis', 'ivar', 'mireth',
  ]);

  function _injectStyles() {
    // O sistema visual vive em styles/lumen/dashboard.css. Mantido por
    // compatibilidade com integrações que chamavam este inicializador.
  }

  function _escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function _number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function _formatNumber(value) {
    return _number(value, 0).toLocaleString('pt-BR');
  }

  function _meterMarkup(value, max, label, gold) {
    const safeMax = Math.max(1, _number(max, 1));
    const safeValue = Math.max(0, Math.min(_number(value, 0), safeMax));
    const progress = Math.round((safeValue / safeMax) * 10000) / 100;
    return `<div class="nqd-meter${gold ? ' nqd-meter--gold' : ''}" role="progressbar" aria-label="${_escape(label)}" aria-valuemin="0" aria-valuemax="${safeMax}" aria-valuenow="${safeValue}"><span style="--progress:${progress}%"></span></div>`;
  }

  function _formatDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? dateString
      : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function _localDateKey(date) {
    const d = date || new Date();
    const offset = d.getTimezoneOffset() * 60 * 1000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
  }

  function _startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  function _svg(name) {
    const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
    const paths = {
      overview: '<path d="M4 5h16v14H4zM8 9h8M8 13h5"/>',
      skills: '<path d="M4 18V9m5 9V5m5 13v-7m5 7V3"/>',
      mapa: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2zM9 4v14m6-12v14"/>',
      achievements: '<path d="M8 4h8v5a4 4 0 01-8 0zM6 6H4v2a3 3 0 003 3m11-5h2v2a3 3 0 01-3 3M12 13v5m-4 2h8"/>',
      library: '<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM8 4v16"/>',
      ranking: '<path d="M5 20V10h4v10zm5 0V4h4v16zm5 0v-7h4v7"/>',
      back: '<path d="M19 12H5m6-6l-6 6 6 6"/>',
      arrow: '<path d="M5 12h14m-5-5l5 5-5 5"/>',
      check: '<path d="M5 12l4 4L19 6"/>',
      search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
      refresh: '<path d="M20 7v5h-5M4 17v-5h5M18 11a7 7 0 00-12-3M6 13a7 7 0 0012 3"/>',
    };
    return `<svg ${common}>${paths[name] || paths.overview}</svg>`;
  }

  function _readSave() {
    const save = _readJson('nefroquest-save', null);
    if (!save || typeof save !== 'object' || save.gameOver === true) return null;
    if (!_number(save.level, 0) || !(save.character || save.selectedCharacter)) return null;
    if (save.lives != null && _number(save.lives, 0) <= 0) return null;
    return save;
  }

  function _emptyStats() {
    return {
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      byTopic: {},
      byCategory: {},
      questionHistory: [],
      dailyActivity: {},
      timeStats: { totalTime: 0, questionCount: 0 },
      mostMissed: {},
    };
  }

  function _readDetailedStats() {
    try {
      if (typeof getDetailedStats === 'function') return getDetailedStats() || _emptyStats();
    } catch (error) {
      // O fallback abaixo mantém o estado vazio explícito.
    }
    return _readJson('nefroquest-detailed-stats', _emptyStats()) || _emptyStats();
  }

  function _readCoreSkills(stats) {
    try {
      if (typeof window.getCoreSkillsStats === 'function') {
        return window.getCoreSkillsStats(stats) || [];
      }
    } catch (error) {
      return [];
    }
    return [];
  }

  function _readAxisStats(stats) {
    const axes = typeof NEFRO_AXES !== 'undefined' && Array.isArray(NEFRO_AXES) ? NEFRO_AXES : [];
    return axes.map(axis => {
      const entry = (stats.byCategory || {})[axis.cat] || {};
      const correct = _number(entry.correct, 0);
      const wrong = _number(entry.wrong, 0);
      const total = _number(entry.total, correct + wrong) || (correct + wrong);
      return {
        id: axis.id,
        cat: axis.cat,
        label: axis.label,
        correct,
        wrong,
        total,
        accuracy: total ? (correct / total) * 100 : null,
      };
    });
  }

  function _readStudyState() {
    const study = _readJson('nefroquest-study-state', null);
    if (!study || !Array.isArray(study.questions) || !study.questions.length) return null;
    const savedAt = _number(study.savedAt, 0);
    if (!savedAt || Date.now() - savedAt > 24 * 60 * 60 * 1000) return null;
    const index = Math.max(0, Math.min(_number(study.index, 0), study.questions.length));
    return { ...study, index, remaining: Math.max(0, study.questions.length - index) };
  }

  function _countOverdueReviews() {
    const cards = _readJson('nefroquest-sr-data', {});
    const boundary = _startOfToday();
    const bank = Array.isArray(window.questionBank) ? window.questionBank : [];
    const validIds = new Set(bank.map(question => String(question.id || question.qid || '')).filter(Boolean));
    if (!validIds.size) return 0;
    return Object.entries(cards || {}).filter(([qid, card]) => {
      if (!validIds.has(String(qid))) return false;
      if (!card || typeof card !== 'object') return false;
      const due = _number(card.due, NaN);
      return Number.isFinite(due) && due <= boundary;
    }).length;
  }

  function _eligibleWeakness(coreSkills) {
    return (coreSkills || [])
      .filter(skill => _number(skill.totalAnswered, 0) >= 5 && skill.accuracy != null)
      .sort((left, right) => {
        const accuracyDelta = left.accuracy - right.accuracy;
        if (accuracyDelta) return accuracyDelta;
        return right.totalAnswered - left.totalAnswered;
      })[0] || null;
  }

  function _eligibleStrength(coreSkills) {
    return (coreSkills || [])
      .filter(skill => _number(skill.totalAnswered, 0) >= 5 && skill.accuracy != null)
      .sort((left, right) => {
        const accuracyDelta = right.accuracy - left.accuracy;
        if (accuracyDelta) return accuracyDelta;
        return right.totalAnswered - left.totalAnswered;
      })[0] || null;
  }

  function _readDailyActivity(stats) {
    const activity = stats.dailyActivity || {};
    const dates = Object.keys(activity).sort().reverse();
    const todayKey = _localDateKey();
    const today = activity[todayKey] || null;
    const lastKey = dates[0] || null;
    return {
      today,
      last: lastKey ? { date: lastKey, ...activity[lastKey] } : null,
    };
  }

  function _buildPlan(data) {
    const plan = [];

    if (data.save) {
      plan.push({
        kind: 'resume',
        kicker: 'Jornada ativa',
        title: 'Retomar o ponto em que você parou',
        detail: `Nível ${data.level} · ${_formatNumber(data.save.correctTotal || 0)} acertos na jornada`,
        action: '_dashResumeJourney',
        actionLabel: 'Retomar jornada',
      });
    } else {
      plan.push({
        kind: 'journey',
        kicker: 'Jornada',
        title: 'Iniciar uma nova jornada clínica',
        detail: 'Escolha o modo e o personagem para começar.',
      });
    }

    if (data.studyState && data.studyState.remaining > 0) {
      plan.push({
        kind: 'study',
        kicker: 'Sessão em andamento',
        title: `Retomar ${data.studyState.remaining} ${data.studyState.remaining === 1 ? 'questão restante' : 'questões restantes'}`,
        detail: 'Sessão salva nas últimas 24 horas.',
        action: '_dashContinueStudy',
        actionLabel: 'Retomar estudo',
      });
    }

    if (data.overdueReviews > 0) {
      plan.push({
        kind: 'review',
        kicker: 'Memória ativa',
        title: `${data.overdueReviews} ${data.overdueReviews === 1 ? 'revisão agendada vencida' : 'revisões agendadas vencidas'}`,
        detail: 'Cards já programados pelo seu histórico.',
        action: '_dashStartSRStudy',
        actionLabel: 'Revisar agora',
      });
    }

    if (data.weakness) {
      plan.push({
        kind: 'gap',
        kicker: 'Ponto de atenção',
        title: data.weakness.label,
        detail: `${Math.round(data.weakness.accuracy)}% em ${data.weakness.totalAnswered} respostas`,
        action: '_dashGoWeakness',
        actionLabel: 'Treinar este eixo',
      });
    }

    if (plan.length < 3 && !data.studyState && data.totalQuestions > 0) {
      plan.push({
        kind: 'practice',
        kicker: 'Amostra clínica',
        title: 'Ampliar seu prontuário de domínio',
        detail: 'Mais respostas tornam o perfil de aprendizagem mais útil.',
        action: '_dashExploreSkills',
        actionLabel: 'Estudo livre',
      });
    }

    return plan.slice(0, 3);
  }

  function _collectData(topicsLoadError) {
    const save = _readSave();
    const stats = _readDetailedStats();
    const coreSkills = _readCoreSkills(stats);
    const axisStats = _readAxisStats(stats);
    const weakness = _eligibleWeakness(coreSkills);
    const strength = _eligibleStrength(coreSkills);
    const level = save ? Math.max(1, _number(save.level, 1)) : 1;
    const xp = save ? Math.max(0, _number(save.xp, 0)) : 0;
    const xpToNext = save
      ? Math.max(1, _number(save.xpToNext, typeof window.xpForLevel === 'function' ? window.xpForLevel(level) : 200))
      : Math.max(1, typeof window.xpForLevel === 'function' ? window.xpForLevel(1) : 200);
    const totalQuestions = Math.max(0, _number(stats.totalQuestions, 0));
    const totalCorrect = Math.max(0, _number(stats.totalCorrect, 0));
    const characterId = save && CHARACTER_META[save.character || save.selectedCharacter]
      ? (save.character || save.selectedCharacter)
      : 'nephros';
    const character = CHARACTER_META[characterId];
    const evolutionLevel = Math.min(10, Math.max(1, level));
    const avatar = `assets/classes/${character.folder}/nivel_${String(evolutionLevel).padStart(2, '0')}.${character.ext}`;
    const nextBadge = BADGE_MILESTONES.find(badge => _number(save && save.correctTotal, 0) < badge.required) || null;

    const data = {
      save,
      stats,
      coreSkills,
      axisStats,
      weakness,
      strength,
      level,
      xp,
      xpToNext,
      totalQuestions,
      totalCorrect,
      accuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : null,
      characterId,
      character,
      avatar,
      nextBadge,
      studyState: _readStudyState(),
      overdueReviews: _countOverdueReviews(),
      activity: _readDailyActivity(stats),
      topicsLoadError: !!topicsLoadError,
    };
    data.plan = _buildPlan(data);
    return data;
  }

  function _plainUserTitle(totalCorrect) {
    if (totalCorrect >= 1500) return 'Grão-Mestre da Uremia';
    if (totalCorrect >= 800) return 'Conselheiro Renal';
    if (totalCorrect >= 400) return 'Patrono dos Glomérulos';
    if (totalCorrect >= 150) return 'Erudito do Equilíbrio';
    if (totalCorrect >= 50) return 'Escriba dos Rins';
    if (totalCorrect >= 15) return 'Nefro-Iniciado';
    return 'Aspirante da Guilda';
  }

  function _playerName() {
    const user = window.authUser;
    const metadata = user && user.user_metadata;
    return (metadata && (metadata.full_name || metadata.name || metadata.nickname)) || 'Jogador local';
  }

  function _navMarkup() {
    return DASH_TABS.map((tab, index) => `
      <button type="button"
        class="nqd-nav-item nq-dash-tab${index === 0 ? ' is-active active' : ''}"
        id="nqdTab-${tab.id}"
        role="tab"
        aria-selected="${index === 0 ? 'true' : 'false'}"
        aria-controls="nqdPane-${tab.id}"
        tabindex="${index === 0 ? '0' : '-1'}"
        data-dash-tab="${tab.id}">
        <span class="nqd-nav-icon">${_svg(tab.id)}</span>
        <span class="nqd-nav-label">${tab.label}</span>
      </button>
    `).join('');
  }

  function _shellMarkup(bodyMarkup, state) {
    return `
      <div class="nqd-shell">
        <aside class="nqd-rail">
          <div class="nqd-rail-header">
            <div class="nqd-brand-row">
              <span class="nqd-brand" aria-label="NefroQuest">Nefro<em>Quest</em></span>
            </div>
          </div>
          <span class="nqd-rail-kicker">Central de Comando</span>
          ${state === 'ready' ? `
            <div class="nqd-profile">
              <span class="nqd-profile-avatar"><img src="${_escape(_dashboardData.avatar)}" alt="${_escape(_dashboardData.character.name)}"></span>
              <span class="nqd-profile-copy"><strong class="nqd-profile-name">${_escape(_playerName())}</strong><small class="nqd-profile-level">${_escape(_plainUserTitle(_dashboardData.totalCorrect))}</small></span>
            </div>
            <nav class="nqd-nav" aria-label="Áreas da Central de Comando" role="navigation">
              <div role="tablist" aria-orientation="vertical">${_navMarkup()}</div>
            </nav>
          ` : ''}
          <div class="nqd-rail-footer"><button type="button" class="nqd-back" data-action="closeDashboard">${_svg('back')}<span>Voltar ao jogo</span></button></div>
        </aside>
        <main class="nqd-main">
          <header class="nqd-topbar">
            <div class="nqd-topbar-copy">
              <span class="nqd-meta">Atlas NQ · Inteligência de aprendizagem</span>
              <strong class="nqd-page-title">Central de Comando</strong>
            </div>
            <button type="button" class="nqd-close" data-action="closeDashboard" aria-label="Fechar Central de Comando">
              ${_svg('back')}<span class="nqd-sr-only">Voltar</span>
            </button>
          </header>
          <div class="nqd-content">${bodyMarkup}</div>
        </main>
      </div>
    `;
  }

  function _loadingMarkup() {
    return _shellMarkup(`
      <div class="nqd-loading" role="status" aria-live="polite">
        <span class="nqd-loading-line" aria-hidden="true"></span>
        <h2>Organizando seu prontuário de aprendizagem…</h2>
        <small>Progresso, competências e evidências locais.</small>
      </div>
    `, 'loading');
  }

  function _planMarkup(plan) {
    return plan.map((item, index) => `
      <article class="nqd-plan-item" data-plan-kind="${_escape(item.kind)}">
        <div class="nqd-plan-item-copy">
          <small>${_escape(item.kicker)}</small>
          <strong>${_escape(item.title)}</strong>
          <p>${_escape(item.detail)}</p>
        </div>
        ${item.action ? `<button type="button" class="nqd-text-action" data-action="${item.action}"><span>${_escape(item.actionLabel)}</span>${_svg('arrow')}</button>` : ''}
      </article>
    `).join('');
  }

  function _activityMarkup(data) {
    if (!data.activity.last) {
      return `
        <div class="nqd-empty-inline">
          <strong>Sem atividade registrada ainda.</strong>
          <span>Suas respostas passarão a formar este resumo clínico.</span>
        </div>
      `;
    }

    const entry = data.activity.today
      ? { date: _localDateKey(), ...data.activity.today }
      : data.activity.last;
    const count = _number(entry.count, 0);
    const correct = _number(entry.correct, 0);
    const accuracy = count ? Math.round((correct / count) * 100) : 0;
    return `
      <div class="nqd-activity-strip" style="--columns:3">
        <span class="nqd-metric"><small class="nqd-metric-label">${data.activity.today ? 'Hoje' : `Último · ${_formatDate(entry.date)}`}</small><strong class="nqd-metric-value">${count} ${count === 1 ? 'resposta' : 'respostas'}</strong></span>
        <span class="nqd-metric"><small class="nqd-metric-label">Acertos</small><strong class="nqd-metric-value">${correct}</strong></span>
        <span class="nqd-metric"><small class="nqd-metric-label">Precisão</small><strong class="nqd-metric-value">${accuracy}%</strong></span>
      </div>
    `;
  }

  function _attentionMarkup(data) {
    if (!data.weakness) {
      return `
        <div class="nqd-attention is-forming">
          <span class="nqd-state">Amostra insuficiente</span>
          <p><strong>Seu perfil clínico ainda está em formação.</strong></p>
          <p>Responda ao menos 5 questões em uma competência central para receber uma indicação de atenção.</p>
        </div>
      `;
    }

    return `
      <div class="nqd-attention">
        <span class="nqd-state">Ponto de atenção</span>
        <p><strong>${_escape(data.weakness.label)}</strong></p>
        <p>${Math.round(data.weakness.accuracy)}% de acerto em ${data.weakness.totalAnswered} respostas. Esta é a menor precisão entre as competências com amostra válida.</p>
        <button type="button" class="nqd-action" data-action="_dashGoWeakness">Treinar este eixo${_svg('arrow')}</button>
      </div>
    `;
  }

  function _milestoneMarkup(data) {
    if (data.level >= 10) {
      return `
        <div class="nqd-milestone is-complete">
          <div class="nqd-milestone-line"><span><small>Marco atual</small><strong>Nível máximo</strong></span><span>Nível 10 alcançado</span></div>
          <p class="nqd-milestone-complete">A evolução continua pelos acertos, competências e selos da jornada.</p>
          ${data.nextBadge ? `<div class="nqd-brief-block"><span>${_svg('achievements')}</span><p><strong>${_escape(data.nextBadge.name)}</strong><small>${_number(data.save && data.save.correctTotal, 0)} de ${data.nextBadge.required} acertos na jornada</small></p></div>` : ''}
        </div>`;
    }
    const xpRemaining = Math.max(0, data.xpToNext - data.xp);
    const badgeProgress = _number(data.save && data.save.correctTotal, 0);
    return `
      <div class="nqd-milestone">
        <div class="nqd-milestone-line">
          <span><small>Próximo marco</small><strong>Nível ${data.level + 1}</strong></span>
          <span>${_formatNumber(xpRemaining)} XP restantes</span>
        </div>
        ${_meterMarkup(Math.min(data.xp, data.xpToNext), data.xpToNext, 'Progresso para o próximo nível', true)}
        ${data.nextBadge ? `
          <div class="nqd-brief-block">
            <span>${_svg('achievements')}</span>
            <p><strong>${_escape(data.nextBadge.name)}</strong><small>${badgeProgress} de ${data.nextBadge.required} acertos na jornada</small></p>
          </div>
        ` : '<p class="nqd-milestone-complete">Todos os selos de acertos da jornada foram alcançados.</p>'}
      </div>
    `;
  }

  function _tabOverview(data) {
    const primaryAction = data.save ? '_dashResumeJourney' : '_dashStartJourney';
    const primaryLabel = data.save ? 'Retomar jornada' : 'Começar jornada';
    const totalCorrect = data.totalCorrect;
    const totalWrong = Math.max(0, _number(data.stats.totalWrong, data.totalQuestions - totalCorrect));
    return `
      <section class="nqd-pane nq-dash-pane active" id="nqdPane-overview" role="tabpanel" aria-labelledby="nqdTab-overview" data-dash-pane="overview">
        <div class="nqd-section-header">
          <div><span class="nqd-eyebrow">Átrio da jornada · seu ponto de retorno</span>
          <h1 class="nqd-title-lg">Sala de Conduta</h1>
          <p class="nqd-section-copy">Leia o que importa agora, escolha uma conduta e continue aprendendo.</p></div>
        </div>
        ${data.topicsLoadError ? '<div class="nqd-notice" role="status">O banco de questões não pôde ser atualizado. A Central está mostrando apenas os dados disponíveis neste dispositivo.</div>' : ''}
        <div class="nqd-command-grid">
          <article class="nqd-journey">
            <div class="nqd-journey-layout"><div class="nqd-journey-portrait">
              <img src="${_escape(data.avatar)}" alt="${_escape(data.character.name)}">
            </div>
            <div class="nqd-journey-body">
              <span class="nqd-state">${data.save ? 'Jornada ativa' : 'Nova jornada'}</span>
              <h2 class="nqd-journey-title">${_escape(data.character.name)}</h2>
              <p class="nqd-journey-subtitle">${_escape(data.character.title)}</p>
              <div class="nqd-level-line">
                <span><small>Nível</small><strong>${data.level}</strong></span>
                <span><small>XP</small><strong>${_formatNumber(data.xp)} / ${_formatNumber(data.xpToNext)}</strong></span>
              </div>
              ${_meterMarkup(Math.min(data.xp, data.xpToNext), data.xpToNext, 'Experiência do personagem', true)}
              <div class="nqd-journey-actions"><button type="button" class="nqd-primary-action" data-action="${primaryAction}" data-nqd-primary="true">${primaryLabel}${_svg('arrow')}</button></div>
            </div></div>
          </article>

          <section class="nqd-plan" aria-labelledby="nqdPlanTitle">
            <header class="nqd-plan-header"><span class="nqd-eyebrow">Conduta recomendada</span><h2 class="nqd-plan-title" id="nqdPlanTitle">Plano de hoje</h2></header>
            <div class="nqd-plan-list">${_planMarkup(data.plan)}</div>
          </section>
        </div>

        <div class="nqd-conduct-spine" aria-label="Ciclo de aprendizagem"><span class="nqd-conduct-step is-complete"><strong>Decidir</strong><small>conduta ativa</small></span><span class="nqd-conduct-step is-current"><strong>Reter</strong><small>memória</small></span><span class="nqd-conduct-step"><strong>Consolidar</strong><small>revisão</small></span><span class="nqd-conduct-step"><strong>Dominar</strong><small>evolução</small></span></div>

        <div class="nqd-overview-details">
          <section class="nqd-section">
            <header class="nqd-section-header"><div><span class="nqd-eyebrow">Leitura acionável</span><h2 class="nqd-section-title">Progresso clínico</h2></div></header>
            <div class="nqd-summary-strip" style="--columns:4">
              <div class="nqd-metric"><small class="nqd-metric-label">Respondidas</small><strong class="nqd-metric-value">${_formatNumber(data.totalQuestions)}</strong></div>
              <div class="nqd-metric"><small class="nqd-metric-label">Acertos</small><strong class="nqd-metric-value">${_formatNumber(totalCorrect)}</strong></div>
              <div class="nqd-metric"><small class="nqd-metric-label">Erros registrados</small><strong class="nqd-metric-value">${_formatNumber(totalWrong)}</strong></div>
              <div class="nqd-metric"><small class="nqd-metric-label">Precisão</small><strong class="nqd-metric-value">${data.accuracy == null ? '—' : `${data.accuracy}%`}</strong></div>
            </div>
            ${_attentionMarkup(data)}
            ${data.strength ? `<p class="nqd-strength"><span>Força observada</span><strong>${_escape(data.strength.label)}</strong> · ${Math.round(data.strength.accuracy)}% em ${data.strength.totalAnswered} respostas</p>` : ''}
          </section>
          <section class="nqd-section">
            <header class="nqd-section-header"><div><span class="nqd-eyebrow">Continuidade real</span><h2 class="nqd-section-title">Marco e atividade</h2></div></header>
            ${_milestoneMarkup(data)}
            <div class="nqd-activity"><h3>Atividade registrada</h3>${_activityMarkup(data)}</div>
          </section>
        </div>
      </section>
    `;
  }

  function _errorPatternsMarkup() {
    const data = _readJson('nefroquest-error-reasons', { counts: {} });
    const rows = Object.entries((data && data.counts) || {})
      .filter(([, count]) => _number(count, 0) > 0)
      .sort((left, right) => right[1] - left[1]);

    if (!rows.length) {
      return '<div class="nqd-empty-inline"><strong>Nenhum padrão nomeado ainda.</strong><span>Ao errar, você pode registrar o motivo da decisão para formar este retrato metacognitivo.</span></div>';
    }

    return `<div class="nqd-error-ledger">${rows.map(([reason, count]) => `
      <div><span>${_escape(ERROR_REASON_LABELS[reason] || reason)}</span><strong>${_formatNumber(count)}</strong></div>
    `).join('')}</div>`;
  }

  function _tabSkills(data) {
    const rows = data.coreSkills.length ? data.coreSkills.map(skill => {
      const answered = _number(skill.totalAnswered, 0);
      const accuracy = skill.accuracy == null ? null : Math.round(skill.accuracy);
      const sample = answered < 5 ? 'Amostra inicial' : 'Amostra válida';
      return `
        <article class="nqd-skill-row" data-state="${answered < 5 ? 'insufficient' : 'measured'}">
          <div>
            <span class="nqd-state${answered < 5 ? ' is-muted' : ''}">${sample}</span>
            <h3 class="nqd-skill-name">${_escape(skill.label)}</h3>
            <p class="nqd-skill-sample">${answered} respostas</p>
          </div>
          <div class="nqd-skill-measure">
            <div class="nqd-skill-values"><span>${_formatNumber(skill.correct)} acertos</span><strong>${accuracy == null ? '—' : `${accuracy}%`}</strong></div>
            ${_meterMarkup(accuracy == null ? 0 : accuracy, 100, `Precisão em ${skill.label}`)}
          </div>
          <p class="nqd-skill-note">${skill.categories && skill.categories.length ? skill.categories.map(cat => _escape((data.axisStats.find(axis => axis.cat === cat) || {}).label || cat)).join(' · ') : _escape(skill.desc || '')}</p>
        </article>
      `;
    }).join('') : '<div class="nqd-empty"><strong>Prontuário ainda sem amostra.</strong><p>As competências aparecerão aqui após suas primeiras respostas.</p></div>';

    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-skills" role="tabpanel" aria-labelledby="nqdTab-skills" data-dash-pane="skills" hidden>
        <div class="nqd-section-header"><div><span class="nqd-eyebrow">Leitura pedagógica · sem notas simuladas</span><h1 class="nqd-title-lg">Prontuário de Domínio</h1><p class="nqd-section-copy">Cinco competências centrais, com amostra e precisão calculadas a partir das suas respostas.</p></div></div>
        <div class="nqd-skills-layout">
          <section class="nqd-radar-panel">
            <header class="nqd-section-heading"><div><span class="nqd-eyebrow">Visão complementar</span><h2 class="nqd-section-title">Precisão observada</h2></div></header>
            <div id="nqDashRadarContainer" class="nqd-radar" role="img" aria-label="Gráfico de precisão por competência"></div>
            <p>O gráfico compara a precisão nas respostas registradas. A amostra ao lado indica quando essa leitura ainda é inicial.</p>
            ${data.weakness ? `<button type="button" class="nqd-action nq-dash-weakness" data-action="_dashGoWeakness">Treinar ${_escape(data.weakness.label)}${_svg('arrow')}</button>` : '<span class="nqd-state is-muted">Responda ao menos 5 questões em uma competência para identificar atenção</span>'}
          </section>
          <section class="nqd-section"><header class="nqd-section-heading"><div><span class="nqd-eyebrow">Evidência por eixo</span><h2 class="nqd-section-title">Leitura das competências</h2></div></header><div class="nqd-skill-list">${rows}</div></section>
        </div>
        <section class="nqd-section nqd-error-patterns"><header class="nqd-section-header"><div><span class="nqd-eyebrow">Metacognição</span><h2 class="nqd-section-title">Padrões de raciocínio nomeados</h2></div></header>${_errorPatternsMarkup()}</section>
      </section>
    `;
  }

  function _mapStatus(stat) {
    const total = _number(stat && stat.t, 0);
    const correct = _number(stat && stat.c, 0);
    if (!total) return { key: 'none', label: 'Não explorada' };
    if (total < 3) return { key: 'sample', label: 'Amostra inicial' };
    if (total >= 5 && correct / total >= 0.7) return { key: 'mastered', label: 'Domínio' };
    return { key: 'progress', label: 'Em progresso' };
  }

  function _tabMapa() {
    const competencies = typeof NQ_COMPETENCIES !== 'undefined' && Array.isArray(NQ_COMPETENCIES) ? NQ_COMPETENCIES : [];
    const stats = typeof nqGetCompStats === 'function' ? nqGetCompStats() : _readJson('nefroquest-comp-stats', {});
    const groups = new Map();
    competencies.forEach(comp => {
      if (!groups.has(comp.cat)) groups.set(comp.cat, []);
      groups.get(comp.cat).push(comp);
    });
    const axisLabels = new Map((_dashboardData.axisStats || []).map(axis => [axis.cat, axis.label]));
    const allAxes = typeof NEFRO_AXES !== 'undefined' && Array.isArray(NEFRO_AXES) ? NEFRO_AXES : [];
    allAxes.forEach(axis => axisLabels.set(axis.cat, axis.label));

    const content = groups.size ? [...groups.entries()].map(([cat, comps]) => `
      <section class="nqd-map-group">
        <header class="nqd-map-group-title">
          <div><span>Domínio clínico</span><h2>${_escape(axisLabels.get(cat) || cat)}</h2></div>
          <button type="button" class="nqd-action" data-action="_dashTrainCategories" data-arg="${_escape(cat)}">Estudar domínio${_svg('arrow')}</button>
        </header>
        <div class="nqd-map-nodes">${comps.map(comp => {
          const stat = stats[comp.id] || { c: 0, t: 0 };
          const status = _mapStatus(stat);
          const total = _number(stat.t, 0);
          const correct = _number(stat.c, 0);
          const accuracy = total ? Math.round((correct / total) * 100) : null;
          return `
            <article class="nqd-map-node is-${status.key}" data-state="${status.key === 'sample' ? 'none' : status.key}">
              <span class="nqd-state">${status.label}</span>
              <h3>${_escape(comp.label)}</h3>
              <p>${total ? `${correct} acertos em ${total} respostas${accuracy == null ? '' : ` · ${accuracy}%`}` : 'Nenhuma resposta classificada nesta competência.'}</p>
            </article>
          `;
        }).join('')}</div>
      </section>
    `).join('') : '<div class="nqd-empty"><strong>Atlas indisponível.</strong><p>As competências não puderam ser carregadas neste dispositivo.</p></div>';

    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-mapa" role="tabpanel" aria-labelledby="nqdTab-mapa" data-dash-pane="mapa" hidden>
        <div class="nqd-section-header"><div><span class="nqd-eyebrow">Competências observadas · sem trilhas artificiais</span><h1 class="nqd-title-lg">Atlas de Domínio</h1><p class="nqd-section-copy">Cada território reflete apenas respostas já classificadas pelo motor de competências.</p></div></div>
        <div class="nqd-map-legend"><span class="is-none">Não explorada</span><span class="is-sample">Amostra inicial</span><span class="is-progress">Em progresso</span><span class="is-mastered">Domínio</span></div>
        <div class="nqd-map-groups">${content}</div>
      </section>
    `;
  }

  function _achievementProgress(id, stats) {
    const history = Array.isArray(stats.questionHistory) ? stats.questionHistory : [];
    const byTopic = stats.byTopic || {};
    const topicCorrect = matcher => Object.entries(byTopic).reduce((sum, [topic, entry]) => matcher(topic.toLowerCase()) ? sum + _number(entry.correct, 0) : sum, 0);
    const countFast = history.filter(item => _number(item.time, 0) > 0 && _number(item.time, 0) < 30).length;
    const countNight = history.filter(item => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return false;
      return date.getHours() >= 22 || date.getHours() < 6;
    }).length;
    const today = stats.dailyActivity && stats.dailyActivity[_localDateKey()];
    const maps = {
      hd_master: { value: topicCorrect(topic => topic.includes('hemodiálise') || topic.includes('hd')), target: 50 },
      speed_demon: { value: countFast, target: 10 },
      transplant_expert: { value: topicCorrect(topic => topic.includes('transplante')), target: 30 },
      glomerulo_sage: { value: topicCorrect(topic => topic.includes('glomerul') || topic.includes('nefrite')), target: 40 },
      century_club: { value: _number(stats.totalQuestions, 0), target: 100 },
      night_scholar: { value: countNight, target: 20 },
      marathon_runner: { value: _number(today && today.count, 0), target: 50 },
      laurel_wreath_knowledge: { value: _number(localStorage.getItem('nefroquest_total_accumulated_knowledge'), 0), target: 1000 },
    };
    if (id === 'nephron_guardian') {
      let current = 0;
      let best = _number(stats.bestStreak, 0);
      history.forEach(item => {
        current = item.correct ? current + 1 : 0;
        best = Math.max(best, current);
      });
      return { value: best, target: 100 };
    }
    if (id === 'acid_base_master') {
      const acid = _readJson('nq-acidbase-progress', {});
      const completed = new Set((Array.isArray(acid.completed) ? acid.completed : []).filter(caseId => ACID_BASE_CASE_IDS.has(caseId)));
      return { value: completed.size, target: ACID_BASE_CASE_IDS.size };
    }
    if (id === 'grimoire_master') {
      const library = _libraryItems();
      return {
        value: library.unlockedRefs.size + library.unlockedArticles.size,
        target: library.totalRefs + library.totalArticles,
      };
    }
    return maps[id] || null;
  }

  function _achievementCategory(id) {
    if (['hd_master', 'perfectionist_drc', 'transplant_expert', 'glomerulo_sage', 'accuracy_master'].includes(id)) return 'Domínio clínico';
    if (['nephron_guardian', 'speed_demon', 'night_scholar', 'marathon_runner', 'century_club'].includes(id)) return 'Consistência';
    if (['grimoire_master', 'laurel_wreath_knowledge', 'acid_base_master'].includes(id)) return 'Conhecimento';
    return 'Jornada';
  }

  function _tabAchievements(data) {
    const achievements = typeof ACHIEVEMENTS_LIST !== 'undefined' && Array.isArray(ACHIEVEMENTS_LIST) ? ACHIEVEMENTS_LIST : [];
    const achievementIds = new Set(achievements.map(achievement => achievement.id));
    const storedUnlocked = typeof getUnlockedAchievements === 'function' ? getUnlockedAchievements() : _readJson('nefroquest-achievements', []);
    const unlocked = new Set([...storedUnlocked].filter(id => achievementIds.has(id)));
    const categories = new Map();
    achievements.forEach(achievement => {
      const category = _achievementCategory(achievement.id);
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push(achievement);
    });

    const groups = categories.size ? [...categories.entries()].map(([category, items]) => `
      <section class="nqd-achievement-group">
        <header><span>Registro</span><h2>${_escape(category)}</h2></header>
        <div class="nqd-achievement-grid">${items.map(achievement => {
          const isUnlocked = unlocked.has(achievement.id);
          const progress = _achievementProgress(achievement.id, data.stats);
          const value = progress ? Math.min(progress.value, progress.target) : 0;
          return `
            <article class="nqd-achievement${isUnlocked ? ' is-unlocked' : ' is-locked'}" data-state="${isUnlocked ? 'unlocked' : 'locked'}">
              <span class="nqd-achievement-mark">${isUnlocked ? _svg('check') : _svg('achievements')}</span>
              <div><span class="nqd-state">${isUnlocked ? 'Desbloqueada' : 'Não conquistada'}</span><h3 class="nqd-achievement-title">${_escape(achievement.name)}</h3><p class="nqd-achievement-copy">${_escape(achievement.description)}</p>
              ${progress && progress.target > 0 ? `<div class="nqd-achievement-progress"><span>${_formatNumber(value)} / ${_formatNumber(progress.target)}</span>${_meterMarkup(value, progress.target, `Progresso de ${achievement.name}`, true)}</div>` : ''}
              </div>
            </article>
          `;
        }).join('')}</div>
      </section>
    `).join('') : '<div class="nqd-empty"><strong>Selos indisponíveis.</strong><p>O catálogo de conquistas não pôde ser carregado.</p></div>';

    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-achievements" role="tabpanel" aria-labelledby="nqdTab-achievements" data-dash-pane="achievements" hidden>
        <div class="nqd-section-header"><div><span class="nqd-eyebrow">Marcos reais · sem ordem cronológica inventada</span><h1 class="nqd-title-lg">Gabinete de Selos</h1><p class="nqd-section-copy">Conquistas desbloqueadas, requisitos e progresso apenas quando o dado é mensurável.</p></div></div>
        <div class="nqd-achievement-summary"><strong>${unlocked.size}</strong><span>de ${achievements.length} conquistas desbloqueadas</span></div>
        <div class="nqd-achievement-groups">${groups}</div>
      </section>
    `;
  }

  function _libraryItems() {
    const storedRefs = new Set(_readJson('nq-unlocked-refs', []));
    const storedArticles = new Set(_readJson('unlockedArticles', []));
    const favorites = new Set(_readJson('nq-bib-favorites', []));
    const items = [];
    const reachableRefKeys = new Set(Array.isArray(window.questionBank)
      ? window.questionBank.flatMap(question => Array.isArray(question.r) ? question.r : []).filter(Boolean)
      : []);
    const totalRefs = typeof refsDB === 'object' && refsDB
      ? (reachableRefKeys.size ? [...reachableRefKeys].filter(key => Object.prototype.hasOwnProperty.call(refsDB, key)).length : Object.keys(refsDB).length)
      : 0;
    const totalArticles = typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles) ? nefroArticles.length : 0;
    const unlockedRefs = new Set(typeof refsDB === 'object' && refsDB
      ? [...storedRefs].filter(key => Object.prototype.hasOwnProperty.call(refsDB, key) && (!reachableRefKeys.size || reachableRefKeys.has(key)))
      : []);
    const unlockedArticles = new Set(typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)
      ? [...storedArticles].filter(index => Number.isInteger(index) && index >= 0 && index < nefroArticles.length)
      : []);

    if (typeof refsDB === 'object' && refsDB) {
      Object.entries(refsDB).forEach(([key, ref]) => {
        if (!unlockedRefs.has(key)) return;
        items.push({
          key,
          type: 'Referência',
          title: ref.label || key,
          source: ref.journal || '',
          year: ref.ano || '',
          summary: ref.resumo || '',
          conclusion: ref.conclusao || '',
          url: ref.url || '',
          favorite: favorites.has(key),
        });
      });
    }

    if (typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)) {
      [...unlockedArticles].filter(Number.isInteger).sort((a, b) => a - b).forEach(index => {
        const article = nefroArticles[index];
        if (!article) return;
        const key = `__art_${index}`;
        items.push({
          key,
          type: 'Artigo',
          title: article.titulo || 'Artigo',
          source: article.jornal || article.autores || '',
          year: article.ano || '',
          summary: article.resumo || '',
          conclusion: article.conclusao || '',
          url: '',
          favorite: favorites.has(key),
        });
      });
    }

    return { items, favorites, unlockedRefs, unlockedArticles, totalRefs, totalArticles };
  }

  function _libraryCards(items) {
    if (!items.length) return '<div class="nqd-empty" data-library-empty><strong>Nenhuma evidência desbloqueada ainda.</strong><p>Referências são liberadas ao responder questões; artigos aparecem nos baús da jornada.</p></div>';
    return items.map((item, index) => {
      const detailId = `nqdLibraryDetail-${index}`;
      return `
      <article class="nqd-library-item" data-library-item data-search="${_escape(`${item.title} ${item.source} ${item.year}`.toLowerCase())}">
        <div>
          <span class="nqd-state">${_escape(item.type)}</span>
          <h3 class="nqd-library-title">${_escape(item.title)}</h3>
          <p class="nqd-library-copy">${_escape([item.source, item.year].filter(Boolean).join(' · '))}</p>
        </div>
        <div class="nqd-library-actions">
          <button type="button" class="nqd-favorite${item.favorite ? ' is-active' : ''}" data-action="_dashToggleFavorite" data-pass-this="1" data-library-key="${_escape(item.key)}" aria-label="${item.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"><span>${item.favorite ? 'Salva' : 'Salvar'}</span></button>
          <button type="button" class="nqd-action" data-action="_dashToggleArticle" data-pass-this="1" aria-expanded="false" aria-controls="${detailId}"><span>Ler resumo</span>${_svg('arrow')}</button>
        </div>
        <div class="nqd-library-detail nqd-library-copy" id="${detailId}" hidden>
          ${item.summary ? `<p>${_escape(item.summary)}</p>` : '<p>Esta entrada não possui resumo cadastrado.</p>'}
          ${item.conclusion ? `<p><strong>Conclusão:</strong> ${_escape(item.conclusion)}</p>` : ''}
          ${item.url ? `<a href="${_escape(item.url)}" target="_blank" rel="noopener noreferrer">Abrir fonte</a>` : ''}
        </div>
      </article>
    `;
    }).join('');
  }

  function _tabLibrary() {
    const library = _libraryItems();
    const totalUnlocked = library.items.length;
    const totalAvailable = library.totalRefs + library.totalArticles;
    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-library" role="tabpanel" aria-labelledby="nqdTab-library" data-dash-pane="library" hidden>
        <div class="nqd-section-header"><div><span class="nqd-eyebrow">Conteúdo já conquistado · fontes reais</span><h1 class="nqd-title-lg">Arquivo de Evidências</h1><p class="nqd-section-copy">Referências e artigos desbloqueados na sua jornada, sem itens demonstrativos.</p></div></div>
        <div class="nqd-library-summary">
          <span><small>Desbloqueados</small><strong>${totalUnlocked}</strong></span>
          <span><small>Referências</small><strong>${library.unlockedRefs.size} / ${library.totalRefs}</strong></span>
          <span><small>Artigos</small><strong>${library.unlockedArticles.size} / ${library.totalArticles}</strong></span>
          <span><small>Favoritos</small><strong>${library.items.filter(item => item.favorite).length}</strong></span>
        </div>
        ${totalAvailable ? `
          <label class="nqd-search">${_svg('search')}<span class="nqd-sr-only">Buscar no arquivo</span><input id="nqDashLibrarySearch" type="search" placeholder="Buscar por título, fonte ou ano" autocomplete="off"></label>
        ` : ''}
        <div class="nqd-library-list" id="nqDashLibraryList">${_libraryCards(library.items)}</div>
        <div class="nqd-empty nqd-library-no-results" id="nqDashLibraryNoResults" hidden><strong>Nenhum resultado nesta busca.</strong><p>Tente outro título, fonte ou ano.</p></div>
      </section>
    `;
  }

  function _tabRanking() {
    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-ranking" role="tabpanel" aria-labelledby="nqdTab-ranking" data-dash-pane="ranking" hidden>
        <div class="nqd-section-header"><div><span class="nqd-eyebrow">Comparação contextual · dados sincronizados</span><h1 class="nqd-title-lg">Registro da Ordem</h1><p class="nqd-section-copy">Veja sua posição sem transformar o aprendizado em uma corrida cega.</p></div></div>
        <div class="nqd-ranking-controls">
          <div class="nqd-segmented" aria-label="Modo do ranking">
            <button type="button" class="nq-dash-lb-tab${_dashLbMode === 'record' ? ' is-active active' : ''}" data-action="_dashSetLbMode" data-arg="record" aria-pressed="${_dashLbMode === 'record'}">Recordes</button>
            <button type="button" class="nq-dash-lb-tab${_dashLbMode === 'global' ? ' is-active active' : ''}" data-action="_dashSetLbMode" data-arg="global" aria-pressed="${_dashLbMode === 'global'}">Perfil global</button>
          </div>
          <label class="nqd-search">${_svg('search')}<span class="nqd-sr-only">Buscar jogador</span><input id="nqDashLbSearch" type="search" placeholder="Buscar jogador" autocomplete="off"></label>
          <button type="button" class="nqd-action" data-action="_dashRefreshRanking">${_svg('refresh')}Atualizar</button>
        </div>
        <div class="nqd-ranking-wrap nqd-ranking-table-wrap" id="nqDashLbWrap" aria-live="polite"><div class="nqd-ranking-state">Selecione esta área para carregar o ranking.</div></div>
      </section>
    `;
  }

  function _readyMarkup(data) {
    const panes = [
      _tabOverview(data),
      _tabSkills(data),
      _tabMapa(),
      _tabAchievements(data),
      _tabLibrary(),
      _tabRanking(),
    ].join('');
    return _shellMarkup(panes, 'ready');
  }

  function _errorMarkup() {
    return _shellMarkup(`
      <div class="nqd-error" role="alert">
        <span>Central indisponível</span>
        <h1>Não foi possível organizar os dados deste dispositivo.</h1>
        <p>Seu progresso não foi alterado. Feche esta área e tente novamente.</p>
        <button type="button" class="nqd-primary-action" data-action="closeDashboard" data-nqd-primary="true">Voltar ao jogo${_svg('back')}</button>
      </div>
    `, 'error');
  }

  function _lockBackground(root) {
    _previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    _inertedElements = [];
    [...document.body.children].forEach(element => {
      if (element === root || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;
      _inertedElements.push({
        element,
        inert: !!element.inert,
        ariaHidden: element.getAttribute('aria-hidden'),
      });
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
  }

  function _unlockBackground() {
    _inertedElements.forEach(record => {
      record.element.inert = record.inert;
      if (record.ariaHidden == null) record.element.removeAttribute('aria-hidden');
      else record.element.setAttribute('aria-hidden', record.ariaHidden);
    });
    _inertedElements = [];
    document.body.style.overflow = _previousBodyOverflow;
  }

  function _switchTab(tabId, moveFocus) {
    const root = document.getElementById('nqDashboard');
    if (!root || !DASH_TABS.some(tab => tab.id === tabId)) return;
    _activeTab = tabId;
    const tabButtons = [...root.querySelectorAll('[role="tab"]')];
    tabButtons.forEach(button => {
      const active = button.dataset.dashTab === tabId;
      button.classList.toggle('is-active', active);
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll('[data-dash-pane]').forEach(pane => {
      const active = pane.dataset.dashPane === tabId;
      pane.hidden = !active;
      pane.classList.toggle('active', active);
    });

    const activeButton = tabButtons.find(button => button.dataset.dashTab === tabId && button.offsetParent !== null)
      || tabButtons.find(button => button.dataset.dashTab === tabId);
    if (moveFocus && activeButton) activeButton.focus({ preventScroll: true });
    if (activeButton && window.matchMedia('(max-width: 61.25rem)').matches) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      activeButton.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    }

    if (tabId === 'skills') window.setTimeout(() => _drawRadar(), 0);
    if (tabId === 'ranking' && !_rankingLoaded) _loadRanking(false);
  }

  function _handleDashboardKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDashboard();
      return;
    }

    if (event.key === 'Tab') {
      const root = document.getElementById('nqDashboard');
      if (!root) return;
      const focusable = [...root.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.tabIndex >= 0 && element.offsetParent !== null && !element.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
      return;
    }

    const current = event.target.closest && event.target.closest('[role="tab"]');
    if (!current) return;
    const visibleTabs = [...document.querySelectorAll('#nqDashboard [role="tab"]')].filter(tab => tab.offsetParent !== null);
    const index = visibleTabs.indexOf(current);
    if (index < 0) return;
    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % visibleTabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + visibleTabs.length) % visibleTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = visibleTabs.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    _switchTab(visibleTabs[nextIndex].dataset.dashTab, true);
  }

  function _wireDashboard(root) {
    root.querySelectorAll('[data-dash-tab]').forEach(button => {
      button.addEventListener('click', () => _switchTab(button.dataset.dashTab, false));
    });

    const librarySearch = root.querySelector('#nqDashLibrarySearch');
    if (librarySearch) {
      librarySearch.addEventListener('input', () => {
        const query = librarySearch.value.trim().toLocaleLowerCase('pt-BR');
        let visible = 0;
        root.querySelectorAll('[data-library-item]').forEach(item => {
          const matches = !query || (item.dataset.search || '').includes(query);
          item.hidden = !matches;
          if (matches) visible += 1;
        });
        const noResults = root.querySelector('#nqDashLibraryNoResults');
        if (noResults) noResults.hidden = visible > 0 || !query;
      });
    }
  }

  function _drawDashboardRadar(container, skills) {
    const size = 340;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    canvas.style.width = `${size}px`;
    canvas.style.maxWidth = '100%';
    canvas.style.aspectRatio = '1';
    canvas.setAttribute('aria-hidden', 'true');
    container.replaceChildren(canvas);

    const context = canvas.getContext('2d');
    if (!context || !skills.length) return;
    context.scale(ratio, ratio);

    const center = size / 2;
    const radius = 108;
    const labelRadius = 139;
    const angleFor = index => -Math.PI / 2 + (Math.PI * 2 * index) / skills.length;
    const pointFor = (index, factor) => ({
      x: center + Math.cos(angleFor(index)) * radius * factor,
      y: center + Math.sin(angleFor(index)) * radius * factor,
    });

    context.lineJoin = 'round';
    context.lineCap = 'round';
    [0.25, 0.5, 0.75, 1].forEach((level, levelIndex) => {
      context.beginPath();
      skills.forEach((_, index) => {
        const point = pointFor(index, level);
        if (!index) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
      context.strokeStyle = levelIndex === 3 ? 'rgba(157, 215, 226, 0.32)' : 'rgba(157, 215, 226, 0.14)';
      context.lineWidth = 1;
      context.stroke();
    });

    skills.forEach((_, index) => {
      const edge = pointFor(index, 1);
      context.beginPath();
      context.moveTo(center, center);
      context.lineTo(edge.x, edge.y);
      context.strokeStyle = 'rgba(157, 215, 226, 0.14)';
      context.stroke();
    });

    context.beginPath();
    skills.forEach((skill, index) => {
      const accuracy = skill.accuracy == null ? 0 : Math.max(0, Math.min(100, _number(skill.accuracy, 0)));
      const point = pointFor(index, accuracy / 100);
      if (!index) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fillStyle = 'rgba(119, 211, 222, 0.16)';
    context.strokeStyle = '#9fdbe4';
    context.lineWidth = 2;
    context.fill();
    context.stroke();

    skills.forEach((skill, index) => {
      const accuracy = skill.accuracy == null ? 0 : Math.max(0, Math.min(100, _number(skill.accuracy, 0)));
      const valuePoint = pointFor(index, accuracy / 100);
      context.beginPath();
      context.arc(valuePoint.x, valuePoint.y, 3.5, 0, Math.PI * 2);
      context.fillStyle = '#e3c970';
      context.fill();

      const angle = angleFor(index);
      const x = center + Math.cos(angle) * labelRadius;
      const y = center + Math.sin(angle) * labelRadius;
      context.fillStyle = '#b8c6d8';
      context.font = '600 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      context.textAlign = Math.cos(angle) > 0.25 ? 'left' : Math.cos(angle) < -0.25 ? 'right' : 'center';
      context.textBaseline = Math.sin(angle) > 0.5 ? 'top' : Math.sin(angle) < -0.5 ? 'bottom' : 'middle';
      context.fillText(`${String(index + 1).padStart(2, '0')} · ${accuracy || 0}%`, x, y);
    });
  }

  function _drawRadar() {
    const container = document.getElementById('nqDashRadarContainer');
    if (!container || container.dataset.rendered === 'true') return;
    if (!_dashboardData) return;
    container.dataset.rendered = 'true';
    const summary = _dashboardData.coreSkills.map(skill => {
      const value = skill.accuracy == null ? 'sem amostra' : `${Math.round(skill.accuracy)}% em ${_number(skill.totalAnswered, 0)} respostas`;
      return `${skill.label}: ${value}`;
    }).join('; ');
    container.setAttribute('aria-label', `Precisão observada por competência. ${summary}`);
    _drawDashboardRadar(container, _dashboardData.coreSkills);
  }

  async function openDashboard() {
    _injectStyles();
    if (typeof window.playSound === 'function') window.playSound('click');
    const previous = document.getElementById('nqDashboard');
    if (previous) closeDashboard();
    document.querySelectorAll('.profile-popup.open').forEach(popup => popup.classList.remove('open'));
    _lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    _activeTab = 'overview';
    _rankingLoaded = false;
    window.clearTimeout(_rankingSearchTimer);
    _rankingSearchTimer = null;

    const root = document.createElement('section');
    root.id = 'nqDashboard';
    root.className = 'nq-command-center';
    root.dataset.nqUi = 'lumen';
    root.dataset.dashboardState = 'loading';
    root.setAttribute('aria-label', 'Central de Comando do aprendizado');
    root.innerHTML = _loadingMarkup();
    document.body.appendChild(root);
    root.addEventListener('keydown', _handleDashboardKeydown);
    _lockBackground(root);
    root.querySelector('[data-action="closeDashboard"]')?.focus({ preventScroll: true });

    let topicsLoadError = false;
    try {
      if (typeof window._loadTopics === 'function') {
        try {
          await window._loadTopics();
        } catch (error) {
          topicsLoadError = true;
          console.error('[NQ] Falha ao atualizar questões para a Central de Comando', error);
        }
      }
      if (!root.isConnected) return;
      _dashboardData = _collectData(topicsLoadError);
      root.innerHTML = _readyMarkup(_dashboardData);
      root.dataset.dashboardState = 'ready';
      _wireDashboard(root);
      window.requestAnimationFrame(() => {
        const firstTab = root.querySelector('[role="tab"][aria-selected="true"]');
        if (firstTab) firstTab.focus({ preventScroll: true });
      });
    } catch (error) {
      console.error('[NQ] Falha ao montar a Central de Comando', error);
      if (!root.isConnected) return;
      root.innerHTML = _errorMarkup();
      root.dataset.dashboardState = 'error';
      root.querySelector('[data-action="closeDashboard"]')?.focus({ preventScroll: true });
    }
  }

  function closeDashboard() {
    const root = document.getElementById('nqDashboard');
    if (!root) return;
    root.removeEventListener('keydown', _handleDashboardKeydown);
    window.clearTimeout(_rankingSearchTimer);
    _rankingSearchTimer = null;
    _rankingRequestId += 1;
    root.remove();
    document.getElementById('nqRadarTooltip')?.remove();
    _unlockBackground();
    const focusTarget = _lastFocusedElement;
    _lastFocusedElement = null;
    if (focusTarget && focusTarget.isConnected) {
      window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    }
  }

  function _clickAfterClose(selector) {
    const target = document.querySelector(selector);
    closeDashboard();
    window.requestAnimationFrame(() => {
      if (target && target.isConnected) target.click();
      else if (typeof _toast === 'function') _toast('Esta ação não está disponível agora.', 'info');
    });
  }

  function _dashResumeJourney() {
    const mainApp = document.getElementById('mainApp');
    const welcome = document.getElementById('welcomeScreen');
    const gameAlreadyVisible = mainApp
      && !mainApp.classList.contains('hidden')
      && (!welcome || welcome.classList.contains('hidden'));
    if (gameAlreadyVisible) {
      closeDashboard();
      return;
    }
    _clickAfterClose('#welcomeContinueBtn');
  }

  function _dashStartJourney() {
    _clickAfterClose('[data-action="startNewFromWelcome"]');
  }

  function _selectStudyCategories(categories) {
    const selected = window._studySelectedAxes;
    const axes = typeof NEFRO_AXES !== 'undefined' && Array.isArray(NEFRO_AXES) ? NEFRO_AXES : [];
    if (!(selected instanceof Set)) return false;
    selected.clear();
    const categorySet = new Set(categories || []);
    axes.forEach(axis => {
      if (!categorySet.size || categorySet.has(axis.cat)) selected.add(axis.id);
    });
    return selected.size > 0;
  }

  async function _ensureTopics() {
    if (typeof topics !== 'undefined' && Array.isArray(topics) && topics.length) return true;
    if (typeof window._loadTopics !== 'function') return false;
    try {
      await window._loadTopics();
      return typeof topics !== 'undefined' && Array.isArray(topics) && topics.length > 0;
    } catch (error) {
      if (typeof _toast === 'function') _toast('Não foi possível carregar as questões.', 'error');
      return false;
    }
  }

  async function _dashGoWeakness() {
    const stats = _readDetailedStats();
    const weakness = _eligibleWeakness(_readCoreSkills(stats));
    if (!weakness) {
      if (typeof _toast === 'function') _toast('Ainda não há amostra suficiente para indicar um ponto de atenção.', 'info');
      return;
    }
    if (!(await _ensureTopics())) return;
    _selectStudyCategories(weakness.categories || []);
    closeDashboard();
    if (typeof window.startStudyMode === 'function') window.startStudyMode();
    else if (typeof _toast === 'function') _toast('O modo de estudo não está disponível.', 'error');
  }

  async function _dashTrainCategories(category) {
    if (!(await _ensureTopics())) return;
    _selectStudyCategories([category]);
    closeDashboard();
    if (typeof window.startStudyMode === 'function') window.startStudyMode();
  }

  async function _dashExploreSkills() {
    if (!(await _ensureTopics())) return;
    _selectStudyCategories([]);
    closeDashboard();
    if (typeof window.startStudyMode === 'function') window.startStudyMode();
  }

  async function _dashContinueStudy() {
    if (!(await _ensureTopics())) return;
    closeDashboard();
    if (typeof window.resumeSavedStudyMode === 'function' && window.resumeSavedStudyMode()) return;
    if (typeof _toast === 'function') _toast('A sessão salva não pôde ser restaurada.', 'error');
  }

  function _dashStartSRStudy() {
    closeDashboard();
    if (typeof window.startScheduledSRStudyMode === 'function') window.startScheduledSRStudyMode();
    else if (typeof _toast === 'function') _toast('A revisão espaçada não está disponível.', 'error');
  }

  function _dashToggleArticle(element) {
    const article = element && element.closest ? element.closest('.nqd-library-item') : null;
    if (!article) return;
    article.classList.toggle('is-expanded');
    const expanded = article.classList.contains('is-expanded');
    element.setAttribute('aria-expanded', String(expanded));
    const label = element.querySelector('span');
    if (label) label.textContent = expanded ? 'Ocultar resumo' : 'Ler resumo';
    const detail = article.querySelector('.nqd-library-detail');
    if (detail) detail.hidden = !expanded;
  }

  function _dashToggleFavorite(element) {
    const key = element && element.dataset ? element.dataset.libraryKey : '';
    if (!key) return;
    const favorites = new Set(_readJson('nq-bib-favorites', []));
    if (favorites.has(key)) favorites.delete(key);
    else favorites.add(key);
    try { localStorage.setItem('nq-bib-favorites', JSON.stringify([...favorites])); } catch (error) { return; }
    element.classList.toggle('is-active', favorites.has(key));
    element.setAttribute('aria-label', favorites.has(key) ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    const label = element.querySelector('span');
    if (label) label.textContent = favorites.has(key) ? 'Salva' : 'Salvar';
    const count = document.querySelectorAll('#nqdPane-library .nqd-favorite.is-active').length;
    const metric = document.querySelector('#nqdPane-library .nqd-library-summary span:last-child strong');
    if (metric) metric.textContent = String(count);
  }

  function _renderLbRows(wrap, data, query, mode) {
    const isGlobal = mode === 'global';
    const normalized = (query || '').trim().toLocaleLowerCase('pt-BR');
    const ranked = (data || []).map((row, rankIndex) => ({ row, rank: rankIndex + 1 }));
    const filtered = ranked.filter(({ row }) => {
      const haystack = `${row.player_name || ''} ${row.character_name || ''}`.toLocaleLowerCase('pt-BR');
      return !normalized || haystack.includes(normalized);
    });
    wrap.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'nqd-ranking-state';
      empty.textContent = normalized ? 'Nenhum jogador corresponde a esta busca.' : 'Ainda não há registros neste ranking.';
      wrap.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'nqd-ranking-table';
    const caption = document.createElement('caption');
    caption.textContent = isGlobal ? 'Ranking por acertos acumulados' : 'Ranking por recorde de partida';
    table.appendChild(caption);
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Posição', 'Jogador', isGlobal ? 'Acertos' : 'Score', isGlobal ? 'Nível máximo' : 'Nível'].forEach(label => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const authId = window.authUser && window.authUser.id;
    filtered.forEach(({ row, rank: originalRank }) => {
      const tr = document.createElement('tr');
      const isCurrentUser = !!(authId && row.user_id === authId);
      if (isCurrentUser) {
        tr.className = 'is-user';
        tr.setAttribute('aria-current', 'true');
      }
      const rank = document.createElement('td');
      rank.textContent = String(originalRank);
      const player = document.createElement('td');
      const playerName = document.createElement('strong');
      playerName.textContent = row.player_name || 'Anônimo';
      player.appendChild(playerName);
      if (!isGlobal && row.character_name) {
        const character = document.createElement('small');
        character.textContent = row.character_name;
        player.appendChild(character);
      }
      const score = document.createElement('td');
      score.textContent = _formatNumber(isGlobal ? row.total_correct : row.score);
      const level = document.createElement('td');
      level.textContent = String(_number(isGlobal ? row.best_level : row.level, 1));
      [rank, player, score, level].forEach(cell => tr.appendChild(cell));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    const updated = document.createElement('p');
    updated.className = 'nqd-ranking-updated';
    updated.textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    wrap.appendChild(updated);
  }

  function _wireRankingSearch() {
    const search = document.getElementById('nqDashLbSearch');
    if (!search || search.dataset.wired) return;
    search.dataset.wired = 'true';
    search.addEventListener('input', () => {
      window.clearTimeout(_rankingSearchTimer);
      const requestedMode = _dashLbMode;
      _rankingSearchTimer = window.setTimeout(() => {
        if (requestedMode !== _dashLbMode) return;
        const wrap = document.getElementById('nqDashLbWrap');
        if (wrap) _renderLbRows(wrap, _lbFullData, search.value, requestedMode);
      }, 160);
    });
  }

  async function _loadRanking(force) {
    const wrap = document.getElementById('nqDashLbWrap');
    if (!wrap) return;
    const requestedMode = _dashLbMode;
    const requestId = ++_rankingRequestId;
    wrap.innerHTML = '<div class="nqd-ranking-state" role="status">Carregando registros…</div>';
    try {
      let rows;
      if (requestedMode === 'global') {
        if (typeof window._profileGlobalFetch !== 'function') throw new Error('Perfil global indisponível');
        rows = await window._profileGlobalFetch();
      } else {
        if (typeof boardFetch !== 'function') throw new Error('Ranking indisponível');
        rows = await boardFetch(!!force);
      }
      if (requestId !== _rankingRequestId || requestedMode !== _dashLbMode || !wrap.isConnected) return;
      _lbFullData = Array.isArray(rows) ? rows.slice(0, 50) : [];
      _rankingLoaded = true;
      if (!_lbFullData.length) {
        wrap.innerHTML = `<div class="nqd-ranking-state"><strong>Nenhum registro disponível.</strong><span>${requestedMode === 'global' ? 'Termine uma partida autenticado para construir seu perfil global.' : 'A primeira partida concluída inicia este registro.'}</span></div>`;
      } else {
        const search = document.getElementById('nqDashLbSearch');
        _renderLbRows(wrap, _lbFullData, search ? search.value : '', requestedMode);
      }
      _wireRankingSearch();
    } catch (error) {
      if (requestId !== _rankingRequestId || requestedMode !== _dashLbMode || !wrap.isConnected) return;
      _rankingLoaded = false;
      wrap.innerHTML = '<div class="nqd-ranking-state is-error"><strong>Não foi possível carregar o ranking.</strong><span>Verifique sua conexão e tente atualizar.</span></div>';
    }
  }

  function _dashSetLbMode(mode) {
    if (!['record', 'global'].includes(mode)) return;
    _dashLbMode = mode;
    window.clearTimeout(_rankingSearchTimer);
    _rankingSearchTimer = null;
    document.querySelectorAll('#nqdPane-ranking .nq-dash-lb-tab').forEach(button => {
      const active = button.dataset.arg === mode;
      button.classList.toggle('is-active', active);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const search = document.getElementById('nqDashLbSearch');
    if (search) search.value = '';
    _loadRanking(false);
  }

  function _dashRefreshRanking() {
    _loadRanking(true);
  }

  function getUserTitle(totalCorrect) {
    if (totalCorrect >= 1500) return 'Grão-Mestre da Uremia 👑';
    if (totalCorrect >= 800) return 'Conselheiro Renal 🫁';
    if (totalCorrect >= 400) return 'Patrono dos Glomérulos 🧪';
    if (totalCorrect >= 150) return 'Erudito do Equilíbrio 📚';
    if (totalCorrect >= 50) return 'Escriba dos Rins ✍️';
    if (totalCorrect >= 15) return 'Nefro-Iniciado 🛡️';
    return 'Aspirante da Guilda 🧭';
  }

  window.openDashboard = openDashboard;
  window.closeDashboard = closeDashboard;
  window._dashRefreshRanking = _dashRefreshRanking;
  window._dashGoWeakness = _dashGoWeakness;
  window._dashStartSRStudy = _dashStartSRStudy;
  window._dashToggleArticle = _dashToggleArticle;
  window._dashSetLbMode = _dashSetLbMode;
  window._dashResumeJourney = _dashResumeJourney;
  window._dashStartJourney = _dashStartJourney;
  window._dashTrainCategories = _dashTrainCategories;
  window._dashExploreSkills = _dashExploreSkills;
  window._dashContinueStudy = _dashContinueStudy;
  window._dashToggleFavorite = _dashToggleFavorite;
  window.getUserTitle = getUserTitle;
})();
