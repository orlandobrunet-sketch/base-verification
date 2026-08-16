// NefroQuest — Central de Comando do aprendizado
// Página interna, orientada por dados locais reais e pelos contratos existentes do jogo.

(function () {
  'use strict';

  const DASH_TABS = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'skills', label: 'Competências' },
    { id: 'mapa', label: 'Mapa clínico' },
    { id: 'achievements', label: 'Conquistas' },
    { id: 'library', label: 'Grimório' },
    { id: 'ranking', label: 'Ranking' },
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
    { id: 1, name: 'Vórtice do Néfron', required: 20, image: 'assets/badges/badge1-384.jpg' },
    { id: 2, name: 'Sábio do Microscópio', required: 40, image: 'assets/badges/badge2-384.jpg' },
    { id: 3, name: 'Guardião das Águas', required: 60, image: 'assets/badges/badge3-384.jpg' },
    { id: 4, name: 'Árbitro dos Rins', required: 80, image: 'assets/badges/badge4-384.jpg' },
    { id: 5, name: 'Ascendido do NefroQuest', required: 100, image: 'assets/badges/badge5-384.jpg' },
  ];

  // Conquistas de pressa, madrugada e maratona não são mais rebaixadas aqui —
  // foram removidas de ACHIEVEMENTS_LIST (js/achievements.js). Rebaixar não
  // bastava: elas continuavam sendo avaliadas, celebradas e contadas.

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
  let _libraryCache = null;
  let _tabMediaQuery = null;

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

  function _safeHttpsUrl(value) {
    try {
      const url = new URL(String(value || ''), window.location.href);
      return url.protocol === 'https:' ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function _safeAccent(value) {
    const color = String(value || '').trim();
    return /^(#[0-9a-f]{3,8}|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\))$/i.test(color) ? color : '';
  }

  function _readArray(key) {
    const value = _readJson(key, []);
    return Array.isArray(value) ? value : [];
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
      lock: '<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 016 0v3"/>',
    };
    return `<svg ${common}>${paths[name] || paths.overview}</svg>`;
  }

  function _readSave() {
    const save = _readJson('nefroquest-save', null);
    if (!save || typeof save !== 'object' || Array.isArray(save) || save.gameOver === true) return null;
    const characterId = save.character || save.selectedCharacter;
    if (!_number(save.level, 0) || !Object.prototype.hasOwnProperty.call(CHARACTER_META, characterId)) return null;
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
      if (typeof getDetailedStats === 'function') {
        const stats = getDetailedStats();
        return stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : _emptyStats();
      }
    } catch (error) {
      // O fallback abaixo mantém o estado vazio explícito.
    }
    const stored = _readJson('nefroquest-detailed-stats', _emptyStats());
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : _emptyStats();
  }

  function _readCoreSkills(stats) {
    try {
      if (typeof window.getCoreSkillsStats === 'function') {
        const skills = window.getCoreSkillsStats(stats);
        return Array.isArray(skills) ? skills : [];
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
    const index = Math.max(0, Math.min(Math.trunc(_number(study.index, 0)), study.questions.length));
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

  function _eligibleAxisWeakness(axisStats) {
    return (axisStats || [])
      .filter(axis => axis.accuracy != null && _number(axis.total, 0) >= 5)
      .sort((left, right) => {
        const accuracyDelta = left.accuracy - right.accuracy;
        if (accuracyDelta) return accuracyDelta;
        return right.total - left.total;
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

  function _readWeekActivity(stats) {
    const activity = stats.dailyActivity && typeof stats.dailyActivity === 'object' ? stats.dailyActivity : {};
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = _localDateKey(date);
      const entry = activity[key] && typeof activity[key] === 'object' ? activity[key] : {};
      const count = Math.max(0, _number(entry.count, 0));
      const correct = Math.max(0, _number(entry.correct, 0));
      days.push({
        key,
        label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        count,
        correct,
      });
    }
    return days;
  }

  function _buildActions(data) {
    const actions = [];

    if (data.studyState && data.studyState.remaining > 0) {
      actions.push({
        kind: 'study',
        kicker: 'Sessão em andamento',
        title: `Retomar ${data.studyState.remaining} ${data.studyState.remaining === 1 ? 'questão restante' : 'questões restantes'}`,
        detail: 'Sessão salva nas últimas 24 horas.',
        action: '_dashContinueStudy',
        actionLabel: 'Retomar estudo',
      });
    }

    if (data.overdueReviews > 0) {
      actions.push({
        kind: 'review',
        kicker: 'Memória ativa',
        title: `${data.overdueReviews} ${data.overdueReviews === 1 ? 'revisão agendada vencida' : 'revisões agendadas vencidas'}`,
        detail: 'Cards já programados pelo seu histórico.',
        action: '_dashStartSRStudy',
        actionLabel: 'Revisar agora',
      });
    }

    if (data.axisWeakness) {
      const needsAttention = data.axisWeakness.accuracy < 70;
      actions.push({
        kind: 'gap',
        kicker: needsAttention ? 'Ponto de atenção' : 'Manutenção sugerida',
        title: data.axisWeakness.label,
        detail: `${Math.round(data.axisWeakness.accuracy)}% em ${data.axisWeakness.total} respostas${needsAttention ? '' : ' · menor resultado relativo'}`,
        action: '_dashGoAxisWeakness',
        actionLabel: 'Treinar este tema',
      });
    }

    actions.push({
      kind: 'journey',
      kicker: data.save ? 'Jornada ativa' : 'Comece por aqui',
      title: data.save ? 'Voltar à sua jornada' : 'Escolher guardião e iniciar',
      detail: data.save ? 'Retorne ao ponto em que parou.' : 'Defina seu personagem e o modo de desafio.',
      action: data.save ? '_dashResumeJourney' : '_dashStartJourney',
      actionLabel: data.save ? 'Retomar jornada' : 'Começar jornada',
    });

    if (actions.length < 3 && data.totalQuestions > 0) {
      actions.push({
        kind: 'practice',
        kicker: 'Explorar',
        title: 'Estudo livre',
        detail: 'Escolha os temas que quer praticar.',
        action: '_dashExploreSkills',
        actionLabel: 'Escolher temas',
      });
    }

    return actions.slice(0, 3).map((action, index) => ({ ...action, primary: index === 0 }));
  }

  function _collectData(topicsLoadError) {
    const save = _readSave();
    const stats = _readDetailedStats();
    const coreSkills = _readCoreSkills(stats);
    const axisStats = _readAxisStats(stats);
    const weakness = _eligibleWeakness(coreSkills);
    const axisWeakness = _eligibleAxisWeakness(axisStats);
    const strength = _eligibleStrength(coreSkills);
    const level = save ? Math.max(1, _number(save.level, 1)) : null;
    const xp = save ? Math.max(0, _number(save.xp, 0)) : 0;
    const xpToNext = Math.max(1,
      typeof window.xpForLevel === 'function'
        ? window.xpForLevel(level || 1)
        : _number(save && save.xpToNext, 200)
    );
    const totalQuestions = Math.max(0, _number(stats.totalQuestions, 0));
    const totalCorrect = Math.max(0, _number(stats.totalCorrect, 0));
    const characterId = save && CHARACTER_META[save.character || save.selectedCharacter]
      ? (save.character || save.selectedCharacter)
      : null;
    const character = characterId ? CHARACTER_META[characterId] : null;
    const evolutionLevel = Math.min(10, Math.max(1, level || 1));
    const avatar = character
      ? `assets/classes/${character.folder}/nivel_${String(evolutionLevel).padStart(2, '0')}.${character.ext}`
      : null;
    const nextBadge = BADGE_MILESTONES.find(badge => _number(save && save.correctTotal, 0) < badge.required) || null;

    const data = {
      save,
      stats,
      coreSkills,
      axisStats,
      weakness,
      axisWeakness,
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
      nextAvatar: character && level < 10
        ? `assets/classes/${character.folder}/nivel_${String(evolutionLevel + 1).padStart(2, '0')}.${character.ext}`
        : null,
      nextBadge,
      journeyCorrect: Math.max(0, _number(save && save.correctTotal, 0)),
      studyState: _readStudyState(),
      overdueReviews: _countOverdueReviews(),
      weekActivity: _readWeekActivity(stats),
      topicsLoadError: !!topicsLoadError,
    };
    data.actions = _buildActions(data);
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
    const mobileNav = window.matchMedia && window.matchMedia('(max-width: 61.25rem)').matches;
    const profile = state === 'ready' && _dashboardData
      ? (_dashboardData.save
        ? `<div class="nqd-profile">
            <span class="nqd-profile-avatar"><img src="${_escape(_dashboardData.avatar)}" alt=""></span>
            <span class="nqd-profile-copy"><strong class="nqd-profile-name">${_escape(_playerName())}</strong><small class="nqd-profile-level">${_escape(_plainUserTitle(_dashboardData.totalCorrect))}</small></span>
          </div>`
        : `<div class="nqd-profile is-new">
            <span class="nqd-profile-avatar" aria-hidden="true">✦</span>
            <span class="nqd-profile-copy"><strong class="nqd-profile-name">Novo jogador</strong><small class="nqd-profile-level">Escolha seu guardião</small></span>
          </div>`)
      : '';
    return `
      <div class="nqd-shell">
        <aside class="nqd-rail">
          <div class="nqd-rail-header">
            <div class="nqd-brand-row">
              <span class="nqd-brand" aria-label="NefroQuest">Nefro<em>Quest</em></span>
              <button type="button" class="nqd-brand-close" data-action="closeDashboard" aria-label="Voltar ao jogo">${_svg('back')}</button>
            </div>
          </div>
          <span class="nqd-rail-kicker">Central de Comando</span>
          ${state === 'ready' ? `
            ${profile}
            <nav class="nqd-nav" aria-label="Áreas da Central de Comando" role="navigation">
              <div role="tablist" aria-orientation="${mobileNav ? 'horizontal' : 'vertical'}">${_navMarkup()}</div>
            </nav>
          ` : ''}
          <div class="nqd-rail-footer"><button type="button" class="nqd-back" data-action="closeDashboard">${_svg('back')}<span>Voltar ao jogo</span></button></div>
        </aside>
        <main class="nqd-main">
          <div class="nqd-content">${bodyMarkup}</div>
        </main>
      </div>
    `;
  }

  function _loadingMarkup() {
    return _shellMarkup(`
      <div class="nqd-loading" role="status" aria-live="polite">
        <span class="nqd-loading-line" aria-hidden="true"></span>
        <h2>Preparando sua Central…</h2>
      </div>
    `, 'loading');
  }

  function _actionsMarkup(actions) {
    return actions.map(item => `
      <article class="nqd-next-action${item.primary ? ' is-primary' : ''}" data-action-kind="${_escape(item.kind)}">
        <div class="nqd-next-action-copy">
          <small>${_escape(item.kicker)}</small>
          <strong>${_escape(item.title)}</strong>
          <p>${_escape(item.detail)}</p>
        </div>
        ${item.action ? `<button type="button" class="${item.primary ? 'nqd-primary-action' : 'nqd-text-action'}" data-action="${item.action}"${item.primary ? ' data-nqd-primary="true"' : ''}><span>${_escape(item.actionLabel)}</span>${_svg('arrow')}</button>` : ''}
      </article>
    `).join('');
  }

  function _weekPulseMarkup(days) {
    const max = Math.max(1, ...(days || []).map(day => day.count));
    return `
      <div class="nqd-pulse-bars" aria-label="Decisões registradas nos últimos sete dias">
        ${(days || []).map(day => {
          const height = day.count ? Math.max(12, Math.round((day.count / max) * 100)) : 4;
          return `<span class="nqd-pulse-day" style="--pulse:${height}%" title="${_escape(day.label)}: ${day.count} ${day.count === 1 ? 'decisão' : 'decisões'}"><i aria-hidden="true"></i><small>${_escape(day.label)}</small><strong>${day.count}</strong></span>`;
        }).join('')}
      </div>
    `;
  }

  function _milestoneMarkup(data) {
    const badge = data.nextBadge || BADGE_MILESTONES[BADGE_MILESTONES.length - 1];
    const isComplete = !data.nextBadge;
    const progress = Math.min(data.journeyCorrect, badge.required);
    const remaining = Math.max(0, badge.required - data.journeyCorrect);
    return `
      <div class="nqd-milestone${isComplete ? ' is-complete' : ''}">
        <div class="nqd-reward-portrait">
          <img src="${_escape(badge.image)}" alt="" width="384" height="384" decoding="async">
        </div>
        <div class="nqd-reward-copy">
          <small>${isComplete ? 'Caminho concluído' : 'Próxima insígnia'}</small>
          <h3>${_escape(badge.name)}</h3>
          <p>${isComplete ? 'Os cinco selos da jornada são seus.' : `Faltam ${remaining} ${remaining === 1 ? 'acerto' : 'acertos'} para conquistar.`}</p>
          ${_meterMarkup(progress, badge.required, `Progresso para ${badge.name}`, true)}
          <span>${progress} / ${badge.required} acertos na jornada</span>
        </div>
      </div>
    `;
  }

  function _tabOverview(data) {
    const journey = data.save ? `
      <div class="nqd-journey-layout">
        <div class="nqd-journey-portrait"><img src="${_escape(data.avatar)}" alt="${_escape(data.character.name)}" width="230" height="230"></div>
        <div class="nqd-journey-body">
          <span class="nqd-state">Jornada ativa</span>
          <h2 class="nqd-journey-title">${_escape(data.character.name)}</h2>
          <p class="nqd-journey-subtitle">${_escape(data.character.title)}</p>
          <div class="nqd-level-line">
            <span><small>Nível</small><strong>${data.level}</strong></span>
            <span><small>XP</small><strong>${_formatNumber(data.xp)} / ${_formatNumber(data.xpToNext)}</strong></span>
          </div>
          ${_meterMarkup(Math.min(data.xp, data.xpToNext), data.xpToNext, 'Experiência do personagem', true)}
          ${data.nextAvatar ? `<div class="nqd-next-form"><img src="${_escape(data.nextAvatar)}" alt="" width="230" height="230" loading="lazy"><span><small>Próxima forma</small><strong>Nível ${data.level + 1}</strong></span></div>` : '<div class="nqd-next-form is-complete"><span><small>Forma máxima</small><strong>Nível 10</strong></span></div>'}
        </div>
      </div>` : `
      <div class="nqd-journey-empty">
        <span class="nqd-state">Primeira jornada</span>
        <h2 class="nqd-journey-title">Seu guardião ainda não foi escolhido.</h2>
        <p>Comece a jornada para definir personagem, dificuldade e ritmo de estudo.</p>
        <div class="nqd-guardian-preview" aria-label="Guardiões disponíveis">
          ${Object.values(CHARACTER_META).map(character => `<img src="assets/classes/${character.folder}/nivel_01.${character.ext}" alt="${_escape(character.name)}" width="230" height="230" loading="lazy">`).join('')}
        </div>
      </div>`;
    return `
      <section class="nqd-pane nq-dash-pane active" id="nqdPane-overview" role="tabpanel" aria-labelledby="nqdTab-overview" data-dash-pane="overview">
        <div class="nqd-section-header">
          <div><h1 class="nqd-title-lg">Sala de Conduta</h1>
          <p class="nqd-section-copy">Uma decisão clara para continuar aprendendo.</p></div>
        </div>
        ${data.topicsLoadError ? '<div class="nqd-notice" role="status">Alguns dados não carregaram. Exibindo seu progresso salvo.</div>' : ''}
        <div class="nqd-command-grid">
          <article class="nqd-journey">${journey}</article>
          <section class="nqd-next-actions" aria-labelledby="nqdActionsTitle">
            <header><span class="nqd-eyebrow">Prioridade</span><h2 id="nqdActionsTitle">Agora</h2></header>
            <div class="nqd-next-actions-list">${_actionsMarkup(data.actions)}</div>
          </section>
        </div>

        <div class="nqd-overview-details">
          <section class="nqd-learning-pulse">
            <header class="nqd-section-header"><div><h2 class="nqd-section-title">Pulso de aprendizagem</h2><p>Últimos sete dias, sem metas artificiais.</p></div></header>
            <div class="nqd-summary-strip" style="--columns:2">
              <div class="nqd-metric"><strong class="nqd-metric-value">${_formatNumber(data.totalQuestions)}</strong><small class="nqd-metric-label">respostas registradas</small></div>
              <div class="nqd-metric"><strong class="nqd-metric-value">${data.accuracy == null ? '—' : `${data.accuracy}%`}</strong><small class="nqd-metric-label">precisão observada</small></div>
            </div>
            ${_weekPulseMarkup(data.weekActivity)}
            ${data.strength ? `<p class="nqd-strength"><span>Melhor desempenho observado</span><strong>${_escape(data.strength.label)}</strong><small>${Math.round(data.strength.accuracy)}% · ${data.strength.totalAnswered} respostas</small></p>` : ''}
          </section>
          <section class="nqd-section nqd-reward-section">
            <header class="nqd-section-header"><div><h2 class="nqd-section-title">Próxima conquista</h2></div></header>
            ${_milestoneMarkup(data)}
          </section>
        </div>
      </section>
    `;
  }

  function _errorPatternsMarkup() {
    const data = _readJson('nefroquest-error-reasons', { counts: {} });
    const rows = Object.entries((data && data.counts) || {})
      .filter(([, count]) => _number(count, 0) > 0)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3);

    if (!rows.length) {
      return '<div class="nqd-empty-inline"><strong>Seus padrões aparecerão aqui.</strong><span>Ao errar, registre o motivo da decisão.</span></div>';
    }

    return `<div class="nqd-error-ledger">${rows.map(([reason, count]) => `
      <div><span>${_escape(ERROR_REASON_LABELS[reason] || reason)}</span><strong>${_formatNumber(count)}</strong></div>
    `).join('')}</div>`;
  }

  function _tabSkills(data) {
    const skillOrder = { attention: 0, consolidating: 1, sample: 2, consistent: 3 };
    const orderedSkills = [...data.coreSkills].sort((left, right) => {
      const stateFor = skill => {
        const answered = _number(skill.totalAnswered, 0);
        if (answered < 5 || skill.accuracy == null) return 'sample';
        if (skill.accuracy < 50) return 'attention';
        if (skill.accuracy < 70 || answered < 10) return 'consolidating';
        return 'consistent';
      };
      return skillOrder[stateFor(left)] - skillOrder[stateFor(right)];
    });
    const rows = orderedSkills.length ? orderedSkills.map(skill => {
      const answered = _number(skill.totalAnswered, 0);
      const accuracy = skill.accuracy == null ? null : Math.round(skill.accuracy);
      const skillState = answered < 5 || accuracy == null ? 'sample' : accuracy < 50 ? 'attention' : accuracy < 70 || answered < 10 ? 'consolidating' : 'consistent';
      return `
        <article class="nqd-skill-row" data-state="${skillState}">
          <div class="nqd-skill-identity">
            <h3 class="nqd-skill-name">${_escape(skill.label)}</h3>
            <span class="nqd-state">${skillState === 'sample' ? 'Amostra inicial' : skillState === 'attention' ? 'Requer atenção' : skillState === 'consolidating' ? 'Em consolidação' : 'Consistente na amostra'}</span>
          </div>
          <div class="nqd-skill-measure">
            <div class="nqd-skill-values"><strong>${accuracy == null ? '—' : `${accuracy}%`}</strong><span>${answered} ${answered === 1 ? 'resposta' : 'respostas'}</span></div>
            ${accuracy == null ? '<span class="nqd-no-sample">Sem precisão calculada</span>' : _meterMarkup(accuracy, 100, `Precisão observada em ${skill.label}`)}
          </div>
        </article>
      `;
    }).join('') : '<div class="nqd-empty"><strong>Competências ainda sem amostra.</strong><p>Elas aparecerão aqui após suas primeiras respostas.</p></div>';

    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-skills" role="tabpanel" aria-labelledby="nqdTab-skills" data-dash-pane="skills" hidden>
        <div class="nqd-section-header"><div><h1 class="nqd-title-lg">Competências</h1><p class="nqd-section-copy">Áreas amplas do seu raciocínio, sempre acompanhadas pelo tamanho da amostra.</p></div></div>
        <section class="nqd-skill-priority${data.axisWeakness ? '' : ' is-forming'}">
          ${data.axisWeakness ? `
            <div><span class="nqd-eyebrow nqd-eyebrow--clinical">${data.axisWeakness.accuracy < 70 ? 'Foco recomendado' : 'Manutenção sugerida'}</span><h2>${_escape(data.axisWeakness.label)}</h2><p>${Math.round(data.axisWeakness.accuracy)}% em ${data.axisWeakness.total} respostas. O treino abre somente este tema.</p></div>
            <button type="button" class="nqd-primary-action" data-action="_dashGoAxisWeakness" data-nqd-primary="true">Treinar este tema${_svg('arrow')}</button>
          ` : `
            <div><span class="nqd-eyebrow">Calibrando seu perfil</span><h2>Complete cinco respostas em um tema para receber uma recomendação.</h2><p>Ausência de amostra não é tratada como desempenho zero.</p></div>
            <button type="button" class="nqd-primary-action" data-action="_dashExploreSkills" data-nqd-primary="true">Escolher temas${_svg('arrow')}</button>
          `}
        </section>
        <section class="nqd-section nqd-skill-list-section" aria-label="Desempenho por competência ampla"><header><h2>Visão por competência</h2></header><div class="nqd-skill-list">${rows}</div></section>
        <section class="nqd-section nqd-error-patterns"><header class="nqd-section-header"><div><h2 class="nqd-section-title">Como você erra</h2></div></header>${_errorPatternsMarkup()}</section>
      </section>
    `;
  }

  function _mapStatus(stat) {
    const total = _number(stat && stat.t, 0);
    const correct = _number(stat && stat.c, 0);
    if (!total) return { key: 'unseen', label: 'Sem amostra', rank: 3 };
    if (total < 5) return { key: 'sample', label: 'Amostra inicial', rank: 2 };
    const accuracy = correct / total;
    if (accuracy < 0.5) return { key: 'attention', label: 'Requer atenção', rank: 0 };
    if (accuracy < 0.7 || total < 10) return { key: 'consolidating', label: 'Em consolidação', rank: 1 };
    return { key: 'consistent', label: 'Consistente na amostra', rank: 4 };
  }

  function _tabMapa() {
    const competencies = typeof NQ_COMPETENCIES !== 'undefined' && Array.isArray(NQ_COMPETENCIES) ? NQ_COMPETENCIES : [];
    const statsRaw = typeof nqGetCompStats === 'function' ? nqGetCompStats() : _readJson('nefroquest-comp-stats', {});
    const stats = statsRaw && typeof statsRaw === 'object' && !Array.isArray(statsRaw) ? statsRaw : {};
    const mappedResponses = Object.values(stats).reduce((sum, entry) => sum + Math.max(0, _number(entry && entry.t, 0)), 0);
    const groups = new Map();
    competencies.forEach(comp => {
      if (!groups.has(comp.cat)) groups.set(comp.cat, []);
      groups.get(comp.cat).push(comp);
    });
    const axisLabels = new Map((_dashboardData.axisStats || []).map(axis => [axis.cat, axis.label]));
    const allAxes = typeof NEFRO_AXES !== 'undefined' && Array.isArray(NEFRO_AXES) ? NEFRO_AXES : [];
    allAxes.forEach(axis => axisLabels.set(axis.cat, axis.label));

    const groupEntries = [...groups.entries()].map(([cat, comps]) => {
      const ordered = [...comps].sort((left, right) => _mapStatus(stats[left.id]).rank - _mapStatus(stats[right.id]).rank);
      const explored = ordered.filter(comp => _number((stats[comp.id] || {}).t, 0) > 0).length;
      const statuses = [...new Set(ordered.map(comp => _mapStatus(stats[comp.id]).key))];
      const priority = Math.min(...ordered.map(comp => _mapStatus(stats[comp.id]).rank));
      const label = axisLabels.get(cat) || cat;
      return { cat, label, ordered, explored, statuses, priority };
    }).sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label, 'pt-BR'));

    const content = groupEntries.length ? groupEntries.map((group, groupIndex) => {
      const searchable = [group.label, ...group.ordered.map(comp => comp.label)].join(' ').toLocaleLowerCase('pt-BR');
      return `<details class="nqd-map-group" data-map-group data-map-status="${_escape(group.statuses.join(' '))}" data-map-label="${_escape(group.label.toLocaleLowerCase('pt-BR'))}" data-search="${_escape(searchable)}"${groupIndex === 0 ? ' open' : ''}>
        <summary class="nqd-map-summary">
          <span class="nqd-map-lumen" aria-hidden="true"></span>
          <span><strong>${_escape(group.label)}</strong><small data-map-summary-count data-default="${group.explored} de ${group.ordered.length} com amostra">${group.explored} de ${group.ordered.length} com amostra</small></span>
          <span class="nqd-map-summary-state">${group.priority <= 1 ? 'Prioridade' : group.explored ? 'Em curso' : 'Por explorar'}</span>
        </summary>
        <div class="nqd-map-group-body">
          <div class="nqd-map-group-action"><button type="button" class="nqd-action" data-action="_dashTrainCategories" data-arg="${_escape(group.cat)}">Praticar este tema${_svg('arrow')}</button></div>
          <div class="nqd-map-nodes">${group.ordered.map(comp => {
          const stat = stats[comp.id] || { c: 0, t: 0 };
          const status = _mapStatus(stat);
          const total = _number(stat.t, 0);
          const correct = _number(stat.c, 0);
          const accuracy = total ? Math.round((correct / total) * 100) : null;
          return `
            <article class="nqd-map-node is-${status.key}" data-state="${status.key}" data-search="${_escape(comp.label.toLocaleLowerCase('pt-BR'))}">
              <span class="nqd-map-node-mark" aria-hidden="true"></span>
              <h3>${_escape(comp.label)}</h3>
              <span class="nqd-state">${status.label}</span>
              <p>${total ? `${accuracy}% · ${total} ${total === 1 ? 'resposta' : 'respostas'}` : 'Ainda sem respostas'}</p>
            </article>
          `;
        }).join('')}</div>
        </div>
      </details>`;
    }).join('') : '<div class="nqd-empty"><strong>Mapa indisponível.</strong><p>As competências não puderam ser carregadas neste dispositivo.</p></div>';

    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-mapa" role="tabpanel" aria-labelledby="nqdTab-mapa" data-dash-pane="mapa" hidden>
        <div class="nqd-section-header"><div><h1 class="nqd-title-lg">Mapa de prática clínica</h1><p class="nqd-section-copy">Temas granulares, organizados pela necessidade de prática.</p></div></div>
        ${!mappedResponses && _dashboardData && _dashboardData.totalQuestions > 0 ? '<div class="nqd-notice" role="status">O detalhamento por tema começa com suas próximas respostas. Seu histórico amplo continua em Competências.</div>' : ''}
        <div class="nqd-map-toolbar">
          <label class="nqd-search">${_svg('search')}<span class="nqd-sr-only">Buscar tema clínico</span><input id="nqDashMapSearch" type="search" placeholder="Buscar tema clínico" autocomplete="off"></label>
          <label class="nqd-map-filter"><span>Estado</span><select id="nqDashMapFilter">
            <option value="all">Todos</option><option value="attention">Requer atenção</option><option value="consolidating">Em consolidação</option><option value="sample">Amostra inicial</option><option value="unseen">Sem amostra</option><option value="consistent">Consistente</option>
          </select></label>
        </div>
        <p class="nqd-map-result" id="nqDashMapResult" aria-live="polite"></p>
        <div class="nqd-map-route">${content}</div>
        <div class="nqd-empty" id="nqDashMapEmpty" hidden><strong>Nenhum tema encontrado.</strong><p>Limpe a busca ou altere o estado.</p></div>
      </section>
    `;
  }

  function _achievementProgress(id, stats) {
    const history = Array.isArray(stats.questionHistory) ? stats.questionHistory.filter(item => item && typeof item === 'object') : [];
    const byTopic = stats.byTopic && typeof stats.byTopic === 'object' && !Array.isArray(stats.byTopic) ? stats.byTopic : {};
    const topicCorrect = matcher => Object.entries(byTopic).reduce((sum, [topic, entry]) => matcher(topic.toLowerCase()) ? sum + _number(entry && entry.correct, 0) : sum, 0);
    // Sem medidores de velocidade, de madrugada ou de maratona: as conquistas
    // que os consumiam foram removidas de ACHIEVEMENTS_LIST por premiarem
    // comportamento nocivo ao aprendizado médico.
    const maps = {
      hd_master: { value: topicCorrect(topic => topic.includes('hemodiálise') || topic.includes('hd')), target: 50 },
      transplant_expert: { value: topicCorrect(topic => topic.includes('transplante')), target: 30 },
      glomerulo_sage: { value: topicCorrect(topic => topic.includes('glomerul') || topic.includes('nefrite')), target: 40 },
      century_club: { value: _number(stats.totalQuestions, 0), target: 100 },
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
    if (['hd_master', 'perfectionist_drc', 'transplant_expert', 'glomerulo_sage', 'accuracy_master'].includes(id)) return 'Prática clínica';
    if (['nephron_guardian', 'century_club'].includes(id)) return 'Consistência';
    if (['grimoire_master', 'laurel_wreath_knowledge', 'acid_base_master'].includes(id)) return 'Conhecimento';
    return 'Jornada';
  }

  function _achievementIconMarkup(achievement, isUnlocked) {
    const name = _escape(achievement && achievement.name);
    if (achievement && achievement.imgIcon) {
      return `<img src="${_escape(achievement.imgIcon)}" alt="" loading="lazy" decoding="async" width="128" height="128">`;
    }
    return `<span aria-hidden="true">${_escape(achievement && achievement.icon ? achievement.icon : '✦')}</span><span class="nqd-sr-only">Símbolo de ${name}${isUnlocked ? ', conquistada' : ''}</span>`;
  }

  function _badgePathMarkup(correctTotal) {
    const nextBadge = BADGE_MILESTONES.find(badge => correctTotal < badge.required) || null;
    return `
      <ol class="nqd-badge-path" tabindex="0" aria-label="Caminho de cinco selos da jornada">
        ${BADGE_MILESTONES.map(badge => {
          const isUnlocked = correctTotal >= badge.required;
          const isCurrent = nextBadge && badge.id === nextBadge.id;
          const state = isUnlocked ? 'unlocked' : isCurrent ? 'current' : 'locked';
          return `
            <li class="nqd-badge-node is-${state}" data-state="${state}"${isCurrent ? ' aria-current="step"' : ''}>
              <span class="nqd-badge-art"><img src="${badge.image}" alt="" decoding="async" width="384" height="384"></span>
              <span class="nqd-badge-node-copy"><strong>${_escape(badge.name)}</strong><small>${badge.required} acertos</small></span>
              <span class="nqd-sr-only">${isUnlocked ? 'Conquistado' : isCurrent ? 'Próximo selo' : 'Bloqueado'}</span>
            </li>
          `;
        }).join('')}
      </ol>
    `;
  }

  function _tabAchievements(data) {
    const achievements = typeof ACHIEVEMENTS_LIST !== 'undefined' && Array.isArray(ACHIEVEMENTS_LIST) ? ACHIEVEMENTS_LIST : [];
    const achievementIds = new Set(achievements.map(achievement => achievement.id));
    const storedUnlockedRaw = typeof getUnlockedAchievements === 'function' ? getUnlockedAchievements() : _readArray('nefroquest-achievements');
    const storedUnlocked = storedUnlockedRaw instanceof Set ? [...storedUnlockedRaw] : (Array.isArray(storedUnlockedRaw) ? storedUnlockedRaw : []);
    const unlocked = new Set(storedUnlocked.filter(id => achievementIds.has(id)));
    const correctTotal = Math.max(0, _number(data.save && data.save.correctTotal, 0));
    const nextBadge = BADGE_MILESTONES.find(badge => correctTotal < badge.required) || null;
    const featuredBadge = nextBadge || BADGE_MILESTONES[BADGE_MILESTONES.length - 1];
    const featuredValue = Math.min(correctTotal, featuredBadge.required);
    const remaining = Math.max(0, featuredBadge.required - correctTotal);

    const cardModels = achievements.map(achievement => {
      const isUnlocked = unlocked.has(achievement.id);
      const progress = _achievementProgress(achievement.id, data.stats);
      const value = progress ? Math.max(0, Math.min(progress.value, progress.target)) : 0;
      const state = isUnlocked ? 'unlocked' : progress && value > 0 ? 'progress' : progress ? 'not-started' : 'special';
      const ratio = progress && progress.target ? value / progress.target : -1;
      return { achievement, isUnlocked, progress, value, state, ratio };
    }).sort((left, right) => {
      const order = { progress: 0, 'not-started': 1, special: 2, unlocked: 3 };
      return order[left.state] - order[right.state] || right.ratio - left.ratio;
    });

    const cards = cardModels.length ? cardModels.map(({ achievement, isUnlocked, progress, value, state }) => {
      const promoted = !isUnlocked;
      return `
        <article class="nqd-achievement${isUnlocked ? ' is-unlocked' : ' is-locked'}" data-state="${isUnlocked ? 'unlocked' : state}" data-achievement-status="${state}" data-achievement-promoted="${promoted}">
          <span class="nqd-achievement-mark">${_achievementIconMarkup(achievement, isUnlocked)}</span>
          <div class="nqd-achievement-body">
            <span class="nqd-state">${isUnlocked ? 'Conquistada' : _escape(_achievementCategory(achievement.id))}</span>
            <h3 class="nqd-achievement-title">${_escape(achievement.name)}</h3>
            ${progress && progress.target > 0 && !isUnlocked ? `<div class="nqd-achievement-progress"><span>${_formatNumber(value)} / ${_formatNumber(progress.target)}</span>${_meterMarkup(value, progress.target, `Progresso de ${achievement.name}`, true)}</div>` : ''}
            ${!isUnlocked ? `<details class="nqd-achievement-detail"><summary>Como conquistar</summary><p>${_escape(achievement.description)}</p></details>` : `<p class="nqd-achievement-copy">${_escape(achievement.description)}</p>`}
          </div>
        </article>
      `;
    }).join('') : '<div class="nqd-empty"><strong>Selos indisponíveis.</strong><p>O catálogo de conquistas não pôde ser carregado.</p></div>';

    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-achievements" role="tabpanel" aria-labelledby="nqdTab-achievements" data-dash-pane="achievements" hidden>
        <div class="nqd-section-header"><div><h1 class="nqd-title-lg">Conquistas</h1><p class="nqd-section-copy">Seu caminho deixa marcas. Escolha o próximo selo.</p></div></div>

        <section class="nqd-achievement-spotlight${nextBadge ? '' : ' is-complete'}" aria-labelledby="nqdAchievementSpotlightTitle">
          <div class="nqd-achievement-spotlight-art"><img src="${featuredBadge.image}" alt="" decoding="async" width="384" height="384"></div>
          <div class="nqd-achievement-spotlight-copy">
            <span class="nqd-eyebrow nqd-eyebrow--reward">${nextBadge ? 'Próximo selo da jornada' : 'Trilha de selos completa'}</span>
            <h2 id="nqdAchievementSpotlightTitle">${_escape(featuredBadge.name)}</h2>
            <p>${nextBadge ? `Faltam <strong>${_formatNumber(remaining)} acertos</strong> nesta jornada para revelar este selo.` : 'Os cinco selos da jornada foram conquistados.'}</p>
            ${_meterMarkup(featuredValue, featuredBadge.required, `Progresso para ${featuredBadge.name}`, true)}
            <small>${_formatNumber(featuredValue)} de ${featuredBadge.required} acertos</small>
            <button type="button" class="nqd-primary-action" data-action="${data.save ? '_dashResumeJourney' : '_dashStartJourney'}" data-nqd-primary="true">${data.save ? 'Continuar jornada' : 'Começar jornada'}${_svg('arrow')}</button>
          </div>
        </section>

        <div class="nqd-badge-path-header"><h2>Caminho dos 100 acertos</h2><span>na jornada atual</span></div>
        ${_badgePathMarkup(correctTotal)}

        <div class="nqd-achievement-catalog-header">
          <div><span class="nqd-eyebrow nqd-eyebrow--reward">Desafios do perfil</span><h2>Conquistas especiais</h2></div>
          <div class="nqd-achievement-summary" aria-label="${unlocked.size} de ${achievements.length} conquistas especiais conquistadas"><strong>${unlocked.size > 0 ? unlocked.size : '—'}</strong><span>de ${achievements.length}</span></div>
        </div>
        <div class="nqd-achievement-filters" role="group" aria-label="Filtrar conquistas especiais">
          <button type="button" class="nqd-achievement-filter is-active" data-achievement-filter="active" aria-pressed="true">Objetivos</button>
          <button type="button" class="nqd-achievement-filter" data-achievement-filter="unlocked" aria-pressed="false">Conquistadas</button>
          <button type="button" class="nqd-achievement-filter" data-achievement-filter="all" aria-pressed="false">Todas</button>
        </div>
        <p class="nqd-sr-only" id="nqdAchievementFilterStatus" role="status" aria-live="polite"></p>
        <div class="nqd-achievement-grid">${cards}</div>
        <div class="nqd-empty" id="nqdAchievementFilterEmpty" hidden><strong>Nenhuma conquista nesta seleção.</strong><p>Escolha outro filtro para ver seus desafios.</p></div>
      </section>
    `;
  }

  function _libraryItems() {
    if (_libraryCache) return _libraryCache;
    const storedRefs = new Set(_readArray('nq-unlocked-refs'));
    const storedArticles = new Set(_readArray('unlockedArticles'));
    const favorites = new Set(_readArray('nq-bib-favorites'));
    const items = [];
    const bank = Array.isArray(window.questionBank) ? window.questionBank : [];
    const axisLabels = new Map((_dashboardData && Array.isArray(_dashboardData.axisStats) ? _dashboardData.axisStats : [])
      .map(axis => [axis.cat, axis.label]));
    const themeFallbacks = {
      acido_base: 'Ácido-Base',
      dialise: 'Diálise & DP',
      diagnostico: 'Diagnóstico',
      drc: 'DRC',
      eletrólitos: 'Distúrbios Eletrolíticos',
      farmacologia: 'Farmacologia',
      genetica: 'Genética Renal',
      glomerular: 'Glomerulopatias',
      hipertensao: 'Hipertensão',
      infeccao: 'Infecção Renal',
      litíase: 'Litíase Renal',
      lra: 'LRA & Nefrotoxicidade',
      nefrologia_geral: 'Nefrologia Geral',
      nefropatia_diabetica: 'Nefropatia Diabética',
      oncologia_renal: 'Oncologia Renal',
      transplante: 'Transplante Renal',
      uti: 'UTI / Crítico',
    };
    const linkedThemes = new Map();
    const reachableRefKeys = new Set();
    bank.forEach(question => {
      const keys = Array.isArray(question.r)
        ? question.r
        : (Array.isArray(question.refs) ? question.refs : []);
      const category = question.c || question.cat || '';
      keys.filter(Boolean).forEach(key => {
        reachableRefKeys.add(key);
        if (!category) return;
        if (!linkedThemes.has(key)) linkedThemes.set(key, new Set());
        linkedThemes.get(key).add(axisLabels.get(category) || themeFallbacks[category] || category);
      });
    });
    const totalRefs = typeof refsDB === 'object' && refsDB
      ? (reachableRefKeys.size ? [...reachableRefKeys].filter(key => Object.prototype.hasOwnProperty.call(refsDB, key)).length : Object.keys(refsDB).length)
      : 0;
    const totalArticles = typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles) ? nefroArticles.length : 0;
    const unlockedRefs = new Set(typeof refsDB === 'object' && refsDB
      ? [...storedRefs].filter(key => Object.prototype.hasOwnProperty.call(refsDB, key) && (!reachableRefKeys.size || reachableRefKeys.has(key)))
      : []);
    const unlockedArticles = new Set(typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)
      ? [...storedArticles].map(Number).filter(index => Number.isInteger(index) && index >= 0 && index < nefroArticles.length)
      : []);

    if (typeof refsDB === 'object' && refsDB) {
      Object.entries(refsDB).forEach(([key, ref]) => {
        if (!unlockedRefs.has(key)) return;
        const rawType = String(ref.tipo || '').trim();
        const type = /^refer[eê]ncia$/i.test(rawType) || !rawType ? 'Fonte clínica' : rawType;
        const themes = linkedThemes.has(key) ? [...linkedThemes.get(key)] : [];
        items.push({
          key,
          kind: 'source',
          kindLabel: 'Fonte clínica',
          type,
          title: ref.label || key,
          source: ref.journal || '',
          authors: '',
          year: ref.ano || '',
          rarity: '',
          badge: ref.badge || '',
          badgeColor: _safeAccent(ref.badgeColor),
          icon: ref.icon || '📖',
          themes,
          summary: ref.resumo || '',
          conclusion: ref.conclusao || '',
          impact: ref.impacto || '',
          curiosity: ref.curiosidade || '',
          url: _safeHttpsUrl(ref.url),
          favorite: favorites.has(key),
        });
      });
    }

    if (typeof nefroArticles !== 'undefined' && Array.isArray(nefroArticles)) {
      [...unlockedArticles].filter(Number.isInteger).sort((a, b) => a - b).forEach(index => {
        const article = nefroArticles[index];
        if (!article) return;
        const key = `__art_${index}`;
        const rarity = String(article.raridade || '').trim().toLocaleLowerCase('pt-BR');
        items.push({
          key,
          kind: 'scroll',
          kindLabel: 'Pergaminho',
          type: 'Artigo',
          title: article.titulo || 'Artigo',
          source: article.jornal || article.autores || '',
          authors: article.autores || '',
          year: article.ano || '',
          rarity,
          badge: '',
          badgeColor: '',
          icon: (window.rarityScrollIcons && window.rarityScrollIcons[rarity]) || '📜',
          themes: [],
          summary: article.resumo || '',
          conclusion: article.conclusao || '',
          impact: article.impacto || '',
          curiosity: article.curiosidade || '',
          url: '',
          favorite: favorites.has(key),
        });
      });
    }

    _libraryCache = { items, favorites, unlockedRefs, unlockedArticles, totalRefs, totalArticles };
    return _libraryCache;
  }

  function _libraryRarityLabel(value) {
    if (!value) return '';
    const normalized = String(value).toLocaleLowerCase('pt-BR');
    return normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1);
  }

  function _sortLibraryItems(items, mode) {
    const list = [...items];
    const byTitle = (a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
    const year = item => {
      const parsed = Number.parseInt(item.year, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };
    list.sort((a, b) => {
      if (mode === 'oldest' || mode === 'recent') {
        const yearA = year(a);
        const yearB = year(b);
        if (yearA == null && yearB != null) return 1;
        if (yearA != null && yearB == null) return -1;
        if (yearA !== yearB) return mode === 'oldest' ? yearA - yearB : yearB - yearA;
      }
      if (mode === 'type') {
        const typeOrder = a.type.localeCompare(b.type, 'pt-BR', { sensitivity: 'base' });
        if (typeOrder) return typeOrder;
      }
      return byTitle(a, b);
    });
    return list;
  }

  function _libraryCards(items) {
    if (!items.length) return '<div class="nqd-empty" data-library-empty><strong>Seu Grimório aguarda a primeira descoberta.</strong><p>Acerte questões e abra baús para reunir conhecimento clínico.</p></div>';
    return items.map((item, index) => {
      const detailId = `nqdLibraryDetail-${index}`;
      const titleId = `nqdLibraryTitle-${index}`;
      const rarityLabel = _libraryRarityLabel(item.rarity);
      const themes = Array.isArray(item.themes) ? item.themes : [];
      const theme = themes.join(' · ');
      const stateLabel = rarityLabel || item.type || item.kindLabel;
      const meta = [
        item.year ? String(item.year) : '',
        theme,
      ].filter(Boolean);
      const accentStyle = item.badgeColor ? ` style="--library-accent:${item.badgeColor}"` : '';
      const searchable = [
        item.title,
        item.source,
        item.authors,
        item.year,
        item.type,
        rarityLabel,
        theme,
        item.impact,
      ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
      return `
      <article class="nqd-library-item" data-library-item data-library-kind="${_escape(item.kind)}" data-library-year="${_escape(item.year)}" data-library-type="${_escape(item.type)}" data-library-rarity="${_escape(item.rarity)}" data-library-theme="${_escape(theme)}" data-library-favorite="${item.favorite ? 'true' : 'false'}" data-library-title="${_escape(item.title)}" data-search="${_escape(searchable)}"${accentStyle}>
        <div class="nqd-library-main">
          <div class="nqd-library-insignia" aria-hidden="true">${_escape(item.icon)}</div>
          <div>
            <span class="nqd-state">${_escape(stateLabel)}</span>
            <h3 class="nqd-library-title" id="${titleId}">${_escape(item.title)}</h3>
            ${meta.length ? `<p class="nqd-library-copy">${_escape(meta.join(' · '))}</p>` : ''}
            ${item.impact ? `<p class="nqd-library-impact">${_escape(item.impact)}</p>` : ''}
          </div>
        </div>
        <div class="nqd-library-actions">
          <button type="button" class="nqd-favorite${item.favorite ? ' is-active' : ''}" data-action="_dashToggleFavorite" data-pass-this="1" data-library-key="${_escape(item.key)}" aria-pressed="${item.favorite ? 'true' : 'false'}" aria-label="${item.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"><span>${item.favorite ? '★ Salvo' : '☆ Salvar'}</span></button>
          <button type="button" class="nqd-action" data-action="_dashToggleArticle" data-pass-this="1" aria-expanded="false" aria-controls="${detailId}"><span>Ler resumo</span>${_svg('arrow')}</button>
        </div>
        <div class="nqd-library-detail nqd-library-copy" id="${detailId}" role="region" aria-labelledby="${titleId}" hidden>
          ${item.authors ? `<p><strong>Autores</strong> ${_escape(item.authors)}</p>` : ''}
          ${item.source ? `<p><strong>Publicação</strong> ${_escape(item.source)}</p>` : ''}
          ${item.summary ? `<p>${_escape(item.summary)}</p>` : '<p>Esta entrada não possui resumo cadastrado.</p>'}
          ${item.conclusion ? `<p><strong>Conclusão:</strong> ${_escape(item.conclusion)}</p>` : ''}
          ${item.curiosity ? `<p class="nqd-library-curiosity"><strong>Curiosidade</strong> ${_escape(item.curiosity)}</p>` : ''}
          ${item.url ? `<a href="${_escape(item.url)}" target="_blank" rel="noopener noreferrer">Abrir publicação</a>` : ''}
        </div>
      </article>
    `;
    }).join('');
  }

  function _tabLibrary() {
    const library = _libraryItems();
    const totalUnlocked = library.items.length;
    const scrollCount = library.items.filter(item => item.kind === 'scroll').length;
    const sourceCount = library.items.filter(item => item.kind === 'source').length;
    const favoriteCount = library.items.filter(item => item.favorite).length;
    const sortedItems = _sortLibraryItems(library.items, 'recent');
    const themes = [...new Set(library.items.flatMap(item => item.themes || []))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const rarities = [...new Set(library.items.map(item => item.rarity).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const shelfItems = sortedItems.slice(0, 24);
    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-library" role="tabpanel" aria-labelledby="nqdTab-library" data-dash-pane="library" hidden>
        <div class="nqd-section-header"><div><h1 class="nqd-title-lg">Grimório de Conhecimento</h1><p class="nqd-section-copy">O que você encontrou ao decidir casos e abrir baús.</p></div></div>
        <div class="nqd-library-overview">
          <div class="nqd-library-summary">
            <small>Acervo descoberto</small><strong>${totalUnlocked > 0 ? `${totalUnlocked} ${totalUnlocked === 1 ? 'descoberta reunida' : 'descobertas reunidas'}` : 'Seu Grimório começa vazio'}</strong>
            <span>${scrollCount} ${scrollCount === 1 ? 'pergaminho' : 'pergaminhos'} · ${sourceCount} ${sourceCount === 1 ? 'fonte clínica' : 'fontes clínicas'}</span>
          </div>
          <div class="nqd-library-shelf" aria-label="Estante com ${shelfItems.length} descobertas visíveis">
            ${shelfItems.length ? shelfItems.map((item, index) => `<span class="nqd-library-spine is-${_escape(item.kind)}" data-rarity="${_escape(item.rarity)}" title="${_escape(item.title)}" style="--spine-index:${index};${item.badgeColor ? `--library-accent:${item.badgeColor};` : ''}"><i aria-hidden="true">${_escape(item.icon)}</i></span>`).join('') : '<span class="nqd-library-shelf-empty">Sua primeira descoberta acenderá esta estante.</span>'}
          </div>
        </div>
        ${library.items.length ? `
          <div class="nqd-library-tabs" role="tablist" aria-label="Coleções do Grimório">
            <button type="button" role="tab" id="nqDashLibraryTab-scrolls" aria-selected="true" aria-controls="nqDashLibraryCollection" tabindex="0" data-library-collection="scrolls"><span>Pergaminhos</span><strong data-library-count>${scrollCount}</strong></button>
            <button type="button" role="tab" id="nqDashLibraryTab-sources" aria-selected="false" aria-controls="nqDashLibraryCollection" tabindex="-1" data-library-collection="sources"><span>Fontes clínicas</span><strong data-library-count>${sourceCount}</strong></button>
            <button type="button" role="tab" id="nqDashLibraryTab-favorites" aria-selected="false" aria-controls="nqDashLibraryCollection" tabindex="-1" data-library-collection="favorites"><span>Favoritos</span><strong data-library-count>${favoriteCount}</strong></button>
          </div>
          <div class="nqd-library-tools">
            <label class="nqd-search">${_svg('search')}<span class="nqd-sr-only">Buscar no Grimório</span><input id="nqDashLibrarySearch" type="search" placeholder="Buscar título, autor ou ano" autocomplete="off"></label>
            <label class="nqd-library-filter"><span>Filtrar</span><select id="nqDashLibraryFilter">
              <option value="all">Todos</option>
              ${rarities.map(rarity => `<option value="rarity:${_escape(rarity)}" data-library-filter-for="scrolls">${_escape(_libraryRarityLabel(rarity))}</option>`).join('')}
              ${themes.map(theme => `<option value="theme:${_escape(theme)}" data-library-filter-for="sources" hidden>${_escape(theme)}</option>`).join('')}
            </select></label>
            <label class="nqd-library-sort"><span>Ordenar</span><select id="nqDashLibrarySort">
              <option value="recent" selected>Publicação mais recente</option>
              <option value="oldest">Publicação mais antiga</option>
              <option value="title">Título A–Z</option>
              <option value="type">Tipo</option>
            </select></label>
          </div>
        ` : ''}
        <div class="nqd-library-collection" id="nqDashLibraryCollection" ${library.items.length ? 'role="tabpanel" aria-labelledby="nqDashLibraryTab-scrolls"' : 'role="region" aria-label="Acervo descoberto"'}>
          <p class="nqd-library-collection-status" id="nqDashLibraryCollectionCount" aria-live="polite"></p>
          <div class="nqd-library-list" id="nqDashLibraryList">${_libraryCards(sortedItems)}</div>
          <div class="nqd-empty nqd-library-no-results" id="nqDashLibraryNoResults" hidden><strong>Nada encontrado nesta coleção.</strong><p>Tente outro termo ou escolha uma coleção diferente.</p></div>
        </div>
      </section>
    `;
  }

  function _tabRanking(data) {
    const gameStats = _readJson('nefroquest-stats', {});
    const bestScore = Math.max(0, _number(gameStats && gameStats.bestScore, 0));
    return `
      <section class="nqd-pane nq-dash-pane" id="nqdPane-ranking" role="tabpanel" aria-labelledby="nqdTab-ranking" data-dash-pane="ranking" hidden>
        <div class="nqd-section-header"><div><h1 class="nqd-title-lg">Ranking da Ordem</h1><p class="nqd-section-copy">Compare seu resultado com os 50 maiores registros disponíveis.</p></div></div>
        <div class="nqd-ranking-personal">
          <span class="nqd-eyebrow">Seu registro local</span>${bestScore > 0
            ? `<strong>${_formatNumber(bestScore)}</strong><small>melhor pontuação de partida</small><span>${_formatNumber(data.totalCorrect)} acertos acumulados</span>`
            : `<strong>${_formatNumber(data.totalCorrect)}</strong><small>acertos acumulados</small><span>nenhuma partida pontuada ainda</span>`}
        </div>
        <div class="nqd-ranking-controls">
          <div class="nqd-segmented" role="group" aria-label="Modo do ranking">
            <button type="button" class="nq-dash-lb-tab${_dashLbMode === 'record' ? ' is-active active' : ''}" data-action="_dashSetLbMode" data-arg="record" aria-pressed="${_dashLbMode === 'record'}">Melhor partida</button>
            <button type="button" class="nq-dash-lb-tab${_dashLbMode === 'global' ? ' is-active active' : ''}" data-action="_dashSetLbMode" data-arg="global" aria-pressed="${_dashLbMode === 'global'}">Total de acertos</button>
          </div>
          <label class="nqd-search">${_svg('search')}<span class="nqd-sr-only">Buscar jogador</span><input id="nqDashLbSearch" type="search" placeholder="Buscar jogador" autocomplete="off"></label>
        </div>
        <div class="nqd-ranking-wrap nqd-ranking-table-wrap" id="nqDashLbWrap" aria-live="polite"><div class="nqd-ranking-state">O ranking será carregado ao abrir esta área.</div></div>
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
      _tabRanking(data),
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
    const tabButtons = [...root.querySelectorAll('[data-dash-tab]')];
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

    if (tabId === 'ranking' && !_rankingLoaded) _loadRanking(false);
  }

  function _handleDashboardKeydown(event) {
    // A Central cobre o jogo inteiro; nenhuma tecla pode acionar a pergunta
    // que continua montada atrás desta página interna.
    event.stopPropagation();
    if (event.key === 'Escape') {
      // Esc num campo de busca preenchido limpa o campo — comportamento nativo
      // de input[type=search]. Fechar a Central inteira aqui custava ao usuário
      // a aba e o filtro por um reflexo motor correto.
      const alvo = event.target;
      if (alvo && typeof alvo.matches === 'function' && alvo.matches('input[type="search"]') && alvo.value !== '') {
        event.preventDefault();
        alvo.value = '';
        alvo.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      event.preventDefault();
      closeDashboard();
      return;
    }

    if (event.key === 'Tab') {
      const root = document.getElementById('nqDashboard');
      if (!root) return;
      const focusable = [...root.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')]
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

    const current = event.target.closest && event.target.closest('[data-dash-tab]');
    if (!current) return;
    const visibleTabs = [...document.querySelectorAll('#nqDashboard [data-dash-tab]')].filter(tab => tab.offsetParent !== null);
    const orientation = current.closest('[role="tablist"]')?.getAttribute('aria-orientation') || 'vertical';
    const index = visibleTabs.indexOf(current);
    if (index < 0) return;
    let nextIndex = null;
    if ((orientation === 'horizontal' && event.key === 'ArrowRight') || (orientation === 'vertical' && event.key === 'ArrowDown')) nextIndex = (index + 1) % visibleTabs.length;
    if ((orientation === 'horizontal' && event.key === 'ArrowLeft') || (orientation === 'vertical' && event.key === 'ArrowUp')) nextIndex = (index - 1 + visibleTabs.length) % visibleTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = visibleTabs.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    _switchTab(visibleTabs[nextIndex].dataset.dashTab, true);
  }

  function _setAchievementFilter(root, filter, announce) {
    const allowed = new Set(['active', 'unlocked', 'all']);
    const selected = allowed.has(filter) ? filter : 'active';
    let visible = 0;
    root.querySelectorAll('.nqd-achievement-filter').forEach(button => {
      const active = button.dataset.achievementFilter === selected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    root.querySelectorAll('[data-achievement-status]').forEach(card => {
      const matches = selected === 'all'
        || (selected === 'unlocked' && card.dataset.achievementStatus === 'unlocked')
        || (selected === 'active' && card.dataset.achievementPromoted === 'true' && visible < 4);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    const empty = root.querySelector('#nqdAchievementFilterEmpty');
    if (empty) empty.hidden = visible > 0;
    const status = root.querySelector('#nqdAchievementFilterStatus');
    if (status && announce) status.textContent = `${visible} ${visible === 1 ? 'conquista exibida' : 'conquistas exibidas'}.`;
  }

  function _wireDashboard(root) {
    root.querySelectorAll('[data-dash-tab]').forEach(button => {
      button.addEventListener('click', () => _switchTab(button.dataset.dashTab, false));
    });

    root.querySelectorAll('.nqd-achievement-filter').forEach(button => {
      button.addEventListener('click', () => _setAchievementFilter(root, button.dataset.achievementFilter, true));
    });
    _setAchievementFilter(root, 'active', false);

    _tabMediaQuery = window.matchMedia('(max-width: 61.25rem)');
    const syncOrientation = () => {
      const tablist = root.querySelector('.nqd-nav [role="tablist"]');
      if (tablist) tablist.setAttribute('aria-orientation', _tabMediaQuery.matches ? 'horizontal' : 'vertical');
    };
    syncOrientation();
    _tabMediaQuery.addEventListener?.('change', syncOrientation);
    root._nqdOrientationListener = syncOrientation;

    root.querySelector('#nqDashMapSearch')?.addEventListener('input', () => _applyMapView(root));
    root.querySelector('#nqDashMapFilter')?.addEventListener('change', () => _applyMapView(root));
    root.querySelectorAll('[data-map-group]').forEach(group => {
      group.addEventListener('toggle', () => {
        if (!group.open) return;
        root.querySelectorAll('[data-map-group][open]').forEach(other => {
          if (other !== group) other.open = false;
        });
      });
    });
    _applyMapView(root);

    const librarySearch = root.querySelector('#nqDashLibrarySearch');
    if (librarySearch) {
      librarySearch.addEventListener('input', () => _applyLibraryView(root));
    }

    const librarySort = root.querySelector('#nqDashLibrarySort');
    if (librarySort) {
      librarySort.addEventListener('change', () => _applyLibraryView(root));
    }

    const libraryFilter = root.querySelector('#nqDashLibraryFilter');
    if (libraryFilter) libraryFilter.addEventListener('change', () => _applyLibraryView(root));

    const libraryTabs = [...root.querySelectorAll('[data-library-collection]')];
    libraryTabs.forEach((button, index) => {
      button.addEventListener('click', () => _setLibraryCollection(root, button));
      button.addEventListener('keydown', event => {
        let nextIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % libraryTabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + libraryTabs.length) % libraryTabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = libraryTabs.length - 1;
        if (nextIndex == null) return;
        event.preventDefault();
        event.stopPropagation();
        _setLibraryCollection(root, libraryTabs[nextIndex]);
        libraryTabs[nextIndex].focus();
      });
    });

    if (libraryTabs.length) {
      _syncLibraryTools(root, 'scrolls');
      _applyLibraryView(root);
    }
  }

  function _applyMapView(root) {
    const groups = [...root.querySelectorAll('[data-map-group]')];
    if (!groups.length) return;
    const query = (root.querySelector('#nqDashMapSearch')?.value || '').trim().toLocaleLowerCase('pt-BR');
    const filter = root.querySelector('#nqDashMapFilter')?.value || 'all';
    let visibleGroups = 0;
    let visibleNodes = 0;
    groups.forEach(group => {
      const groupLabelMatches = !!query && (group.dataset.mapLabel || '').includes(query);
      const nodes = [...group.querySelectorAll('.nqd-map-node')];
      let groupVisibleNodes = 0;
      nodes.forEach(node => {
        const matchesQuery = !query || groupLabelMatches || (node.dataset.search || '').includes(query);
        const matchesFilter = filter === 'all' || node.dataset.state === filter;
        node.hidden = !(matchesQuery && matchesFilter);
        if (!node.hidden) {
          groupVisibleNodes += 1;
          visibleNodes += 1;
        }
      });
      group.hidden = groupVisibleNodes === 0;
      if (!group.hidden) visibleGroups += 1;
      const count = group.querySelector('[data-map-summary-count]');
      if (count) count.textContent = query || filter !== 'all' ? `${groupVisibleNodes} de ${nodes.length} nesta seleção` : count.dataset.default;
      const states = nodes.filter(node => !node.hidden).map(node => node.dataset.state);
      const summaryState = group.querySelector('.nqd-map-summary-state');
      if (summaryState && states.length) {
        summaryState.textContent = states.includes('attention') ? 'Prioridade'
          : states.includes('consolidating') ? 'Em curso'
            : states.includes('sample') ? 'Amostra inicial'
              : states.includes('consistent') ? 'Consistente' : 'Por explorar';
      }
    });
    if (visibleGroups && !groups.some(group => !group.hidden && group.open)) {
      const first = groups.find(group => !group.hidden);
      if (first) first.open = true;
    }
    const result = root.querySelector('#nqDashMapResult');
    if (result) result.textContent = `${visibleNodes} ${visibleNodes === 1 ? 'tema clínico' : 'temas clínicos'} em ${visibleGroups} ${visibleGroups === 1 ? 'área' : 'áreas'}`;
    const empty = root.querySelector('#nqDashMapEmpty');
    if (empty) empty.hidden = visibleNodes > 0;
  }

  function _setLibraryCollection(root, selected) {
    if (!root || !selected) return;
    root.querySelectorAll('[data-library-collection]').forEach(button => {
      const active = button === selected;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const collection = root.querySelector('#nqDashLibraryCollection');
    if (collection) collection.setAttribute('aria-labelledby', selected.id);
    _syncLibraryTools(root, selected.dataset.libraryCollection);
    _applyLibraryView(root);
  }

  function _syncLibraryTools(root, collection) {
    const search = root.querySelector('#nqDashLibrarySearch');
    if (search) {
      search.placeholder = collection === 'sources'
        ? 'Buscar título, tema ou ano'
        : collection === 'favorites' ? 'Buscar nos favoritos' : 'Buscar título, autor ou ano';
    }
    const filter = root.querySelector('#nqDashLibraryFilter');
    if (!filter) return;
    [...filter.options].forEach(option => {
      const target = option.dataset.libraryFilterFor;
      option.hidden = !!target && target !== collection;
    });
    const selected = filter.options[filter.selectedIndex];
    if (selected && selected.hidden) filter.value = 'all';
    filter.closest('label')?.toggleAttribute('hidden', collection === 'favorites');
  }

  function _applyLibraryView(root) {
    if (!root) return;
    const list = root.querySelector('#nqDashLibraryList');
    if (!list) return;
    const activeTab = root.querySelector('[data-library-collection][aria-selected="true"]');
    const collection = activeTab ? activeTab.dataset.libraryCollection : 'scrolls';
    const query = (root.querySelector('#nqDashLibrarySearch')?.value || '').trim().toLocaleLowerCase('pt-BR');
    const sort = root.querySelector('#nqDashLibrarySort')?.value || 'recent';
    const filter = root.querySelector('#nqDashLibraryFilter')?.value || 'all';
    const items = [...list.querySelectorAll('[data-library-item]')];
    const title = item => item.dataset.libraryTitle || '';
    const year = item => {
      const parsed = Number.parseInt(item.dataset.libraryYear, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const compare = (a, b) => {
      if (sort === 'recent' || sort === 'oldest') {
        const aYear = year(a);
        const bYear = year(b);
        if (aYear == null && bYear != null) return 1;
        if (aYear != null && bYear == null) return -1;
        if (aYear !== bYear) return sort === 'oldest' ? aYear - bYear : bYear - aYear;
      }
      if (sort === 'type') {
        const byType = (a.dataset.libraryType || '').localeCompare(b.dataset.libraryType || '', 'pt-BR', { sensitivity: 'base' });
        if (byType) return byType;
      }
      return title(a).localeCompare(title(b), 'pt-BR', { sensitivity: 'base' });
    };
    items.sort(compare).forEach(item => list.appendChild(item));

    let visible = 0;
    items.forEach(item => {
      const inCollection = collection === 'favorites'
        ? item.dataset.libraryFavorite === 'true'
        : item.dataset.libraryKind === (collection === 'sources' ? 'source' : 'scroll');
      const matches = !query || (item.dataset.search || '').includes(query);
      const matchesFilter = filter === 'all'
        || (filter.startsWith('rarity:') && item.dataset.libraryRarity === filter.slice(7))
        || (filter.startsWith('theme:') && (item.dataset.libraryTheme || '').split(' · ').includes(filter.slice(6)));
      item.hidden = !(inCollection && matches && matchesFilter);
      if (!item.hidden) visible += 1;
    });

    const labels = { scrolls: 'pergaminho', sources: 'fonte clínica', favorites: 'favorito' };
    const status = root.querySelector('#nqDashLibraryCollectionCount');
    if (status) {
      const label = labels[collection] || 'item';
      status.textContent = `${visible} ${label}${visible === 1 ? '' : 's'}${query ? ' encontrado' + (visible === 1 ? '' : 's') : ''}`;
    }
    const noResults = root.querySelector('#nqDashLibraryNoResults');
    if (noResults) noResults.hidden = visible > 0;
  }

  async function openDashboard() {
    _injectStyles();
    if (typeof window.playSound === 'function') window.playSound('click');
    const previous = document.getElementById('nqDashboard');
    if (previous) {
      previous.querySelector('[role="tab"][aria-selected="true"], [data-action="closeDashboard"]')?.focus({ preventScroll: true });
      return;
    }
    _lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.querySelectorAll('.profile-popup.open').forEach(popup => popup.classList.remove('open'));
    _activeTab = 'overview';
    _rankingLoaded = false;
    _libraryCache = null;
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

  function closeDashboard(options) {
    const root = document.getElementById('nqDashboard');
    if (!root) return;
    const restoreFocus = !(options && options.restoreFocus === false);
    root.removeEventListener('keydown', _handleDashboardKeydown);
    window.clearTimeout(_rankingSearchTimer);
    _rankingSearchTimer = null;
    _rankingRequestId += 1;
    if (_tabMediaQuery && root._nqdOrientationListener) {
      _tabMediaQuery.removeEventListener?.('change', root._nqdOrientationListener);
    }
    _tabMediaQuery = null;
    root.remove();
    _unlockBackground();
    const focusTarget = restoreFocus && _lastFocusedElement && _lastFocusedElement.isConnected
      && _lastFocusedElement.getClientRects().length
      && !_lastFocusedElement.closest('[hidden], [inert]')
      ? _lastFocusedElement
      : restoreFocus ? [...document.querySelectorAll('[data-action="openDashboard"]')].find(element => element.getClientRects().length && !element.closest('[hidden], [inert]')) : null;
    _lastFocusedElement = null;
    if (focusTarget) {
      window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    }
  }

  function _clickAfterClose(selector) {
    const target = document.querySelector(selector);
    closeDashboard({ restoreFocus: false });
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

  function _focusStudyMode() {
    window.requestAnimationFrame(() => {
      document.querySelector('#studyModePage [data-action="exitStudyMode"], #studyModePage button')?.focus({ preventScroll: true });
    });
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

  async function _dashGoAxisWeakness() {
    const weakness = _eligibleAxisWeakness(_readAxisStats(_readDetailedStats()));
    if (!weakness) {
      if (typeof _toast === 'function') _toast('Ainda não há amostra suficiente para indicar um tema de treino.', 'info');
      return;
    }
    if (!(await _ensureTopics())) return;
    if (!_selectStudyCategories([weakness.cat])) {
      if (typeof _toast === 'function') _toast('O seletor de temas não está disponível agora.', 'error');
      return;
    }
    if (typeof window.startStudyMode !== 'function') {
      if (typeof _toast === 'function') _toast('O modo de estudo não está disponível.', 'error');
      return;
    }
    closeDashboard({ restoreFocus: false });
    window.startStudyMode();
    _focusStudyMode();
  }

  const _dashGoWeakness = _dashGoAxisWeakness;

  async function _dashTrainCategories(category) {
    if (!(await _ensureTopics())) return;
    if (!_selectStudyCategories([category])) {
      if (typeof _toast === 'function') _toast('O seletor de temas não está disponível agora.', 'error');
      return;
    }
    if (typeof window.startStudyMode !== 'function') {
      if (typeof _toast === 'function') _toast('O modo de estudo não está disponível.', 'error');
      return;
    }
    closeDashboard({ restoreFocus: false });
    window.startStudyMode();
    _focusStudyMode();
  }

  async function _dashExploreSkills() {
    if (!(await _ensureTopics())) return;
    if (typeof window.showAxesSelector !== 'function') {
      if (typeof _toast === 'function') _toast('O seletor de temas não está disponível.', 'error');
      return;
    }
    closeDashboard({ restoreFocus: false });
    window.showAxesSelector();
    window.requestAnimationFrame(() => {
      const selector = document.querySelector('.study-mode-popup');
      const firstControl = selector && selector.querySelector('button, [tabindex]:not([tabindex="-1"])');
      if (firstControl) firstControl.focus({ preventScroll: true });
    });
  }

  async function _dashContinueStudy() {
    if (!(await _ensureTopics())) return;
    if (typeof window.resumeSavedStudyMode === 'function' && window.resumeSavedStudyMode()) {
      closeDashboard({ restoreFocus: false });
      _focusStudyMode();
      return;
    }
    if (typeof _toast === 'function') _toast('A sessão salva não pôde ser restaurada.', 'error');
  }

  function _dashStartSRStudy() {
    if (typeof window.startScheduledSRStudyMode !== 'function') {
      if (typeof _toast === 'function') _toast('A revisão espaçada não está disponível.', 'error');
      return;
    }
    closeDashboard({ restoreFocus: false });
    window.startScheduledSRStudyMode();
    _focusStudyMode();
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
    const favorites = new Set(_readArray('nq-bib-favorites'));
    if (favorites.has(key)) favorites.delete(key);
    else favorites.add(key);
    try { localStorage.setItem('nq-bib-favorites', JSON.stringify([...favorites])); } catch (error) { return; }
    const isFavorite = favorites.has(key);
    element.classList.toggle('is-active', isFavorite);
    element.setAttribute('aria-pressed', String(isFavorite));
    element.setAttribute('aria-label', isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    const label = element.querySelector('span');
    if (label) label.textContent = isFavorite ? '★ Salvo' : '☆ Salvar';
    const article = element.closest('.nqd-library-item');
    const focusWasInside = !!(article && article.contains(document.activeElement));
    if (article) article.dataset.libraryFavorite = String(isFavorite);
    if (_libraryCache) {
      _libraryCache.favorites = favorites;
      const item = _libraryCache.items.find(entry => entry.key === key);
      if (item) item.favorite = isFavorite;
    }
    const pane = document.querySelector('#nqdPane-library');
    const count = pane ? pane.querySelectorAll('[data-library-item][data-library-favorite="true"]').length : favorites.size;
    const favoriteTabCount = document.querySelector('[data-library-collection="favorites"] [data-library-count]');
    if (favoriteTabCount) favoriteTabCount.textContent = String(count);
    if (pane) {
      _applyLibraryView(pane);
      if (focusWasInside && article && article.hidden) {
        pane.querySelector('[data-library-collection="favorites"]')?.focus({ preventScroll: true });
      }
    }
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

    const authId = window.authUser && window.authUser.id;
    const current = authId ? ranked.find(({ row }) => row.user_id === authId) : null;
    if (!normalized && current) {
      const context = document.createElement('p');
      context.className = 'nqd-ranking-context';
      const ahead = current.rank > 1 ? ranked[current.rank - 2] : null;
      const currentValue = _number(isGlobal ? current.row.total_correct : current.row.score, 0);
      const aheadValue = ahead ? _number(isGlobal ? ahead.row.total_correct : ahead.row.score, 0) : currentValue;
      context.textContent = current.rank === 1
        ? 'Você ocupa o primeiro lugar entre os registros disponíveis.'
        : aheadValue > currentValue
          ? `Você está em ${current.rank}º · faltam ${(aheadValue - currentValue + 1).toLocaleString('pt-BR')} ${isGlobal ? 'acertos' : 'pontos'} para ultrapassar a posição anterior.`
          : `Você está em ${current.rank}º com o mesmo total da posição anterior; o nível também participa do desempate.`;
      wrap.appendChild(context);
    }

    if (!normalized && ranked.length >= 3) {
      const podium = document.createElement('ol');
      podium.className = 'nqd-ranking-podium';
      podium.setAttribute('aria-label', 'Três primeiros colocados');
      ranked.slice(0, 3).forEach(entry => {
        const item = document.createElement('li');
        item.dataset.rank = String(entry.rank);
        const rankLabel = document.createElement('span');
        rankLabel.textContent = `${entry.rank}º`;
        const player = document.createElement('strong');
        player.textContent = entry.row.player_name || 'Anônimo';
        const score = document.createElement('small');
        score.textContent = `${_formatNumber(isGlobal ? entry.row.total_correct : entry.row.score)} ${isGlobal ? 'acertos' : 'pontos'}`;
        item.append(rankLabel, player, score);
        podium.appendChild(item);
      });
      wrap.appendChild(podium);
    }

    const table = document.createElement('table');
    table.className = 'nqd-ranking-table';
    const caption = document.createElement('caption');
    caption.textContent = isGlobal ? 'Ranking por acertos acumulados' : 'Ranking por recorde de partida';
    table.appendChild(caption);
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['#', 'Jogador', isGlobal ? 'Acertos' : 'Pontos', isGlobal ? 'Nível máximo' : 'Nível'].forEach(label => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
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
    wrap.innerHTML = '<div class="nqd-ranking-skeleton" role="status" aria-label="Carregando ranking"><span></span><span></span><span></span></div>';
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
  window._dashGoAxisWeakness = _dashGoAxisWeakness;
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
