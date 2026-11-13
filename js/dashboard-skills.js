/* NefroQuest — Atlas de competências. Apresentação dos dados já calculados pelo jogo. */
(function () {
  'use strict';

  const STATE_LABELS = {
    attention: 'Requer atenção',
    consolidating: 'Em consolidação',
    consistent: 'Consistente na amostra',
    sample: 'Amostra inicial',
    unseen: 'Sem amostra',
    invalid: 'Dados a conferir',
  };
  const SYMBOLS = {
    glomerulopatias: '<circle cx="16" cy="16" r="10"/><path d="M8 12l8-5 8 5v8l-8 5-8-5zM8 12l16 8M24 12L8 20M16 7v18"/><circle cx="16" cy="16" r="3"/>',
    hidroeletrolitico_acidobase: '<path d="M16 4c-4 6-9 10-9 16a9 9 0 0018 0c0-6-5-10-9-16zM8 20c3-3 5 3 8 0s5 3 8 0M12 14l3-4"/>',
    drc_nefroprotecao: '<path d="M16 4l10 4v8c0 6-5 10-10 13C11 26 6 22 6 16V8zM11 16l4 4 7-8"/>',
    nefrologia_geral_diagnostico: '<circle cx="14" cy="14" r="9"/><path d="M21 21l7 7M14 9v10M9 14h10"/>',
    lra_critico: '<path d="M3 17h6l4-10 6 20 4-10h6M18 4l-4 9h7l-5 10"/>',
    dialise: '<rect x="7" y="5" width="7" height="22" rx="3"/><rect x="19" y="5" width="7" height="22" rx="3"/><path d="M10 10h1m-1 5h1m-1 5h1m11-10h1m-1 5h1m-1 5h1M14 9h5M14 23h5"/>',
    transplante: '<path d="M17 26V15C17 7 23 4 29 4c0 9-4 14-12 14M16 23C7 23 3 18 3 10c8 0 13 5 13 13M11 16l6 7M23 10l-6 8"/>',
  };

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
  }

  function count(value) {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  }

  function number(value) {
    return Number(value).toLocaleString('pt-BR');
  }

  function responses(value) {
    return `${number(value)} ${value === 1 ? 'resposta' : 'respostas'}`;
  }

  function icon(id, extraClass) {
    return `<svg class="nqs-glyph${extraClass ? ` ${extraClass}` : ''}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${SYMBOLS[id] || SYMBOLS.nefrologia_geral_diagnostico}</svg>`;
  }

  function arrow() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14m-5-5l5 5-5 5"/></svg>';
  }

  function normalize(source) {
    return (Array.isArray(source) ? source : []).filter(skill => skill && typeof skill === 'object').map((skill, index) => {
      const id = /^[a-z0-9_-]+$/i.test(String(skill.id || '')) ? String(skill.id) : `area-${index}`;
      const total = skill.totalAnswered;
      const accuracy = skill.accuracy;
      // Validação de apresentação: não substitui nem recalcula as estatísticas de origem.
      const validCounts = count(total) && count(skill.correct) && count(skill.wrong) && skill.correct + skill.wrong === total;
      const validAccuracy = total === 0 ? accuracy == null : typeof accuracy === 'number' && Number.isFinite(accuracy)
        && accuracy >= 0 && accuracy <= 100
        && Math.abs(accuracy * total - skill.correct * 100) < Math.max(1, total) * .0001;
      const valid = validCounts && validAccuracy;
      const measured = valid && total >= 5 && accuracy != null;
      const value = measured ? Math.round(accuracy) : null;
      const state = !valid ? 'invalid' : !total ? 'unseen' : !measured ? 'sample'
        : value < 50 ? 'attention' : value < 70 || total < 10 ? 'consolidating' : 'consistent';
      return {
        id, label: String(skill.label || 'Área de estudo'), index, valid, measured, state, value, accuracy,
        total, correct: skill.correct, wrong: skill.wrong,
        categories: (Array.isArray(skill.subcategories) ? skill.subcategories : [])
          .filter(category => category && typeof category.cat === 'string' && category.cat.length && typeof category.label === 'string'),
      };
    });
  }

  function point(index, size, radius) {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / size;
    return { x: 280 + Math.cos(angle) * radius, y: 280 + Math.sin(angle) * radius };
  }

  function xy(p) { return `${p.x.toFixed(2)},${p.y.toFixed(2)}`; }

  function chartMarkup(skills, selected) {
    const measured = skills.filter(skill => skill.measured);
    const ready = measured.length >= 3;
    const complete = ready && measured.length === skills.length;
    const title = !ready ? 'Unindo seus primeiros pontos' : complete ? 'Seu perfil observado' : 'Seu perfil observado é parcial';
    const context = !ready ? 'O perfil visual aparece quando três áreas tiverem pelo menos cinco respostas.'
      : complete ? 'A forma mostra a porcentagem de acertos nas respostas registradas.'
        : 'As áreas sem amostra suficiente ficam sem ponto. Os intervalos permanecem abertos.';
    const ringMarkup = [0.25, 0.5, 0.75, 1].map(ratio => {
      const polygon = skills.map((_, index) => xy(point(index, skills.length, 170 * ratio))).join(' ');
      return `<polygon class="nqs-orbit-grid" points="${polygon}"/>`;
    }).join('');
    const axisMarkup = skills.map((skill, index) => {
      const end = point(index, skills.length, 184);
      return `<g class="nqs-axis${selected === index ? ' is-selected' : ''}" data-nqs-axis="${index}"><path class="nqs-axis-line" d="M280 280L${end.x.toFixed(2)} ${end.y.toFixed(2)}"/></g>`;
    }).join('');
    const vertices = ready ? skills.map((skill, index) => skill.measured ? point(index, skills.length, 170 * skill.accuracy / 100) : null) : [];
    // Os intervalos de eixos sem amostra nunca são fechados com pontos em zero.
    const shape = complete ? `<polygon class="nqs-profile-fill" points="${vertices.map(xy).join(' ')}"/>` : '';
    const segments = ready ? vertices.map((vertex, index) => {
      const next = vertices[(index + 1) % vertices.length];
      return vertex && next ? `<path class="nqs-profile-line" pathLength="1" d="M${vertex.x.toFixed(2)} ${vertex.y.toFixed(2)}L${next.x.toFixed(2)} ${next.y.toFixed(2)}"/>` : '';
    }).join('') : '';
    const dots = ready ? vertices.map((vertex, index) => vertex ? `<g class="nqs-vertex${selected === index ? ' is-selected' : ''}" data-nqs-vertex="${index}"><circle class="nqs-vertex-halo" cx="${vertex.x.toFixed(2)}" cy="${vertex.y.toFixed(2)}" r="12"/><circle class="nqs-vertex-point" cx="${vertex.x.toFixed(2)}" cy="${vertex.y.toFixed(2)}" r="4"/></g>` : '').join('') : '';
    const nodes = skills.map((skill, index) => {
      const position = point(index, skills.length, 225);
      const description = skill.measured ? `${skill.value}% de acertos, ${responses(skill.total)}` : STATE_LABELS[skill.state];
      return `<button type="button" class="nqs-orbit-node${index === selected ? ' is-selected' : ''}" data-nqs-select="${index}" data-skill-id="${escape(skill.id)}" aria-pressed="${index === selected}" aria-controls="nqsDetail-${index}" aria-label="${escape(skill.label)}, ${escape(description)}. Ver área" style="--nqs-node-x:${position.x / 5.6}%;--nqs-node-y:${position.y / 5.6}%">${icon(skill.id)}<span class="nqs-node-name">${escape(skill.label)}</span></button>`;
    }).join('');
    return `<figure class="nqs-instrument${ready ? '' : ' is-forming'}" aria-labelledby="nqsProfileTitle" aria-describedby="nqsProfileContext">
      <figcaption class="nqs-instrument-heading"><h3 id="nqsProfileTitle">${title}</h3><p id="nqsProfileContext">${context}</p></figcaption>
      <div class="nqs-astrolabe">
        <svg class="nqs-chart" viewBox="0 0 560 560" aria-hidden="true" focusable="false">
          <circle class="nqs-outer-orbit" cx="280" cy="280" r="226"/>
          <circle class="nqs-outer-orbit nqs-outer-orbit--inner" cx="280" cy="280" r="202"/>
          <circle class="nqs-orbit-engraving" cx="280" cy="280" r="211" pathLength="70"/>
          <path class="nqs-orbit-light" pathLength="1" d="M280 69a211 211 0 01182.73 316.5"/>
          ${ringMarkup}${axisMarkup}${shape}${segments}
          <path class="nqs-center-star" d="M280 265l3 12 12 3-12 3-3 12-3-12-12-3 12-3z"/>
          ${dots}
        </svg>
        <div class="nqs-orbit-controls" role="group" aria-label="Selecionar área no atlas">${nodes}</div>
        ${ready ? '' : '<span class="nqs-forming-note">O atlas está se formando</span>'}
      </div>
      <p class="nqs-chart-key"><span aria-hidden="true"></span>${ready ? 'Centro: 0% de acertos. Contorno: 100%.' : 'Os selos representam as áreas acompanhadas.'}</p>
      <p class="nqs-chart-instruction">Selecione um selo para explorar a área.</p>
    </figure>`;
  }

  function sealMarkup(skill) {
    return `<span class="nqs-seal" aria-hidden="true"><svg class="nqs-seal-ring" viewBox="0 0 68 68" focusable="false"><circle class="nqs-seal-track" cx="34" cy="34" r="30"/>${skill.measured ? `<circle class="nqs-seal-value" cx="34" cy="34" r="30" pathLength="100" stroke-dasharray="${skill.value} 100"/>` : '<circle class="nqs-seal-unmeasured" cx="34" cy="34" r="25"/>'}</svg>${icon(skill.id)}</span>`;
  }

  function cardMarkup(skill, selected) {
    return `<button type="button" class="nqs-area${selected === skill.index ? ' is-selected' : ''}" data-nqs-select="${skill.index}" data-nqs-card data-skill-id="${escape(skill.id)}" data-state="${skill.state}" aria-pressed="${selected === skill.index}" aria-controls="nqsDetail-${skill.index}">
      ${sealMarkup(skill)}
      <span class="nqs-area-copy"><span class="nqs-area-name">${escape(skill.label)}</span><span class="nqs-area-sample">${skill.valid ? responses(skill.total) : 'Registros inconsistentes'}</span><span class="nqs-area-state">${STATE_LABELS[skill.state]}</span></span>
      <span class="nqs-area-score">${skill.measured ? `${skill.value}<small>%</small>` : '<span aria-hidden="true">—</span>'}<span class="nqd-sr-only">${skill.measured ? ' de acertos na amostra' : 'Percentual não exibido'}</span></span>
      <span class="nqs-area-marker" aria-hidden="true">${arrow()}</span>
    </button>`;
  }

  function detailMarkup(skill, selected) {
    const statusCopy = skill.state === 'invalid' ? 'Os registros desta área não permitem exibir um resultado confiável agora.'
      : skill.state === 'unseen' ? 'Esta área ainda não tem respostas registradas. Escolha um tema abaixo para começar.'
        : skill.state === 'sample' ? 'O percentual aparece a partir de cinco respostas. Continue explorando esta área.'
          : skill.state === 'attention' ? 'Esta amostra pede uma nova passagem pelos temas da área.'
            : skill.state === 'consolidating' ? 'Continue praticando para ampliar a amostra e observar seu desempenho.'
              : 'Há consistência nas respostas desta amostra. Revisitar os temas ajuda a continuar aprendendo.';
    const categories = skill.categories.map(category => `<li><span>${escape(category.label)}</span><button type="button" class="nqs-study-action" data-action="_dashTrainCategories" data-arg="${escape(category.cat)}" aria-label="Estudar ${escape(category.label)}">Estudar${arrow()}</button></li>`).join('');
    return `<section class="nqs-detail" id="nqsDetail-${skill.index}" data-nqs-detail="${skill.index}" data-skill-id="${escape(skill.id)}" data-state="${skill.state}" aria-labelledby="nqsDetailTitle-${skill.index}"${selected === skill.index ? '' : ' hidden'}>
      <header class="nqs-detail-header">${sealMarkup(skill)}<p>Área selecionada</p><h3 id="nqsDetailTitle-${skill.index}">${escape(skill.label)}</h3></header>
      <div class="nqs-detail-result">${skill.measured ? `<p class="nqs-detail-value">${skill.value}<span>%</span></p><p class="nqs-detail-count"><strong>de acertos na amostra</strong><span>${number(skill.correct)} ${skill.correct === 1 ? 'acerto' : 'acertos'} em ${responses(skill.total)}</span></p>` : `<p class="nqs-detail-pending">${skill.valid ? skill.total ? responses(skill.total) : 'Seu primeiro passo começa aqui' : 'Resultado indisponível'}</p>`}</div>
      <p class="nqs-state-label"><span aria-hidden="true"></span>${STATE_LABELS[skill.state]}</p>
      <p class="nqs-detail-copy">${statusCopy}</p>
      ${categories ? `<div class="nqs-detail-study"><h4>Continue nesta área</h4><ul>${categories}</ul></div>` : '<button type="button" class="nqs-explore-action" data-action="_dashExploreSkills">Escolher temas de estudo' + arrow() + '</button>'}
      <p class="nqs-detail-footnote">O resultado descreve as respostas registradas, incluindo repetições. Não é uma medida de domínio clínico.</p>
    </section>`;
  }

  function render(coreSkills) {
    const skills = normalize(coreSkills);
    if (!skills.length) return '<section class="nqs-unavailable"><h2>Seu atlas está indisponível</h2><p>Não foi possível carregar as áreas de competências. Reabra esta página para tentar novamente.</p></section>';
    const measured = skills.filter(skill => skill.measured);
    const priority = { attention: 0, consolidating: 1, consistent: 2, sample: 3, unseen: 4, invalid: 5 };
    const selected = [...skills].sort((a, b) => priority[a.state] - priority[b.state])[0].index;
    return `<div class="nqs-component" data-nqs-component data-nqs-current="${escape(skills[selected].id)}">
      <section class="nqs-atlas" aria-labelledby="nqsAtlasTitle">
        <header class="nqs-atlas-header"><div><h1 id="nqsAtlasTitle">Competências</h1><p>Explore suas áreas e escolha onde continuar.</p>${!measured.length ? `<button type="button" class="nqs-explore-action" data-action="_dashExploreSkills" data-nqd-primary="true">Escolher temas${arrow()}</button>` : ''}</div><p class="nqs-coverage"><strong>${measured.length}<span> / ${skills.length}</span></strong><span>áreas com amostra suficiente</span></p></header>
        <div class="nqs-observatory">${chartMarkup(skills, selected)}<div class="nqs-detail-slot">${skills.map(skill => detailMarkup(skill, selected)).join('')}</div></div>
      </section>
      <section class="nqs-areas" aria-labelledby="nqsAreasTitle"><header class="nqs-areas-header"><h2 id="nqsAreasTitle">Suas áreas de conhecimento</h2><p>Explore os resultados e escolha onde continuar.</p></header><div class="nqs-area-grid" role="group" aria-label="Selecionar área de conhecimento">${skills.map(skill => cardMarkup(skill, selected)).join('')}</div></section>
      <details class="nqs-reading-guide"><summary>Como ler seu atlas${arrow()}</summary><div><p>Os percentuais mostram acertos nas respostas registradas em cada área, incluindo repetições. Áreas amplas reúnem vários temas.</p><p>Uma área aparece no gráfico a partir de cinco respostas. A forma completa exige amostra em todas as áreas. Sem respostas suficientes, o resultado fica em aberto.</p><p>“Requer atenção”: menos de 50% de acertos. “Em consolidação”: de 50% a menos de 70%, ou de cinco a nove respostas. “Consistente na amostra”: pelo menos 70% em dez ou mais respostas. Os percentuais são arredondados para exibição e para estes intervalos. Estes estados descrevem a amostra e não certificam habilidade clínica.</p></div></details>
      <p class="nqd-sr-only" data-nqs-announcement aria-live="polite" aria-atomic="true"></p>
    </div>`;
  }

  function mount(root) {
    const component = root?.querySelector('[data-nqs-component]');
    if (!component) return function () {};
    component._nqsCleanup?.();
    const controls = [...component.querySelectorAll('[data-nqs-select]')];
    const cards = [...component.querySelectorAll('[data-nqs-card]')];
    const pane = component.closest('[role="tabpanel"]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeDetail = null;
    const stopDetailMotion = () => {
      activeDetail?.classList.remove('is-selecting');
      activeDetail = null;
    };
    const motionAllowed = () => !document.hidden && !reducedMotion.matches
      && component.isConnected && !component.closest('[hidden], [inert]');
    const select = index => {
      const card = cards.find(item => item.dataset.nqsSelect === index);
      if (!card || card.getAttribute('aria-pressed') === 'true') return;
      stopDetailMotion();
      component.dataset.nqsCurrent = card.dataset.skillId;
      controls.forEach(control => {
        const active = control.dataset.nqsSelect === index;
        control.classList.toggle('is-selected', active);
        control.setAttribute('aria-pressed', String(active));
      });
      component.querySelectorAll('[data-nqs-axis], [data-nqs-vertex]').forEach(item => {
        item.classList.toggle('is-selected', (item.dataset.nqsAxis ?? item.dataset.nqsVertex) === index);
      });
      component.querySelectorAll('[data-nqs-detail]').forEach(detail => { detail.hidden = detail.dataset.nqsDetail !== index; });
      if (motionAllowed()) {
        activeDetail = component.querySelector(`[data-nqs-detail="${index}"]`);
        activeDetail?.classList.add('is-selecting');
      }
      const announcement = component.querySelector('[data-nqs-announcement]');
      if (announcement) announcement.textContent = `${card.querySelector('.nqs-area-name').textContent}. ${card.querySelector('.nqs-area-score').textContent}. ${card.querySelector('.nqs-area-sample').textContent}. ${card.querySelector('.nqs-area-state').textContent}. Detalhes atualizados no atlas.`;
    };
    const onClick = event => {
      const control = event.target.closest?.('[data-nqs-select]');
      if (control && component.contains(control)) select(control.dataset.nqsSelect);
    };
    const onKeydown = event => {
      const control = event.target.closest?.('[data-nqs-select]');
      if (!control || !component.contains(control) || event.altKey || event.ctrlKey || event.metaKey) return;
      const group = control.hasAttribute('data-nqs-card') ? cards : controls.filter(item => !item.hasAttribute('data-nqs-card'));
      const current = group.indexOf(control);
      let next;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = group.length - 1;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % group.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current + group.length - 1) % group.length;
      else return;
      event.preventDefault();
      group[next].focus({ preventScroll: true });
      select(group[next].dataset.nqsSelect);
    };
    const onMotionBoundary = () => { if (!motionAllowed()) stopDetailMotion(); };
    const onAnimationEnd = event => {
      if (event.target === activeDetail && event.animationName === 'nqs-select-detail') stopDetailMotion();
    };
    const onDetailFocus = event => {
      if (activeDetail?.contains(event.target)) stopDetailMotion();
    };
    component.addEventListener('click', onClick);
    component.addEventListener('keydown', onKeydown);
    component.addEventListener('animationend', onAnimationEnd);
    component.addEventListener('focusin', onDetailFocus);
    document.addEventListener('visibilitychange', onMotionBoundary);
    reducedMotion.addEventListener?.('change', onMotionBoundary);
    const paneObserver = new MutationObserver(onMotionBoundary);
    if (pane) paneObserver.observe(pane, {attributes: true, attributeFilter: ['hidden', 'inert']});
    const cleanup = () => {
      stopDetailMotion();
      paneObserver.disconnect();
      component.removeEventListener('click', onClick);
      component.removeEventListener('keydown', onKeydown);
      component.removeEventListener('animationend', onAnimationEnd);
      component.removeEventListener('focusin', onDetailFocus);
      document.removeEventListener('visibilitychange', onMotionBoundary);
      reducedMotion.removeEventListener?.('change', onMotionBoundary);
      component._nqsCleanup = null;
    };
    component._nqsCleanup = cleanup;
    return cleanup;
  }

  function activate(root) {
    const component = root?.querySelector('[data-nqs-component]');
    if (component) component.classList.add('is-revealed');
  }

  window.NQDashboardSkills = Object.freeze({ render, mount, activate });
})();
