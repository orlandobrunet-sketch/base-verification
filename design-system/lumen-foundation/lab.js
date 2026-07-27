(() => {
  'use strict';

  const root = document.body;
  const liveRegion = document.getElementById('foundationLive');
  const calibrator = document.querySelector('[data-nql-calibrator]');
  const stateButtons = Array.from(document.querySelectorAll('[data-nql-state]'));
  const stateLabel = document.getElementById('calibratorState');
  const stateTitle = document.getElementById('calibratorTitle');
  const stateDescription = document.getElementById('calibratorDescription');

  const stateCopy = {
    unexplored: {
      label: 'Rota ainda não percorrida',
      title: 'O sistema orienta sem antecipar.',
      description: 'O pontilhado de baixa emissão mostra o que falta explorar sem sugerir resposta ou urgência.'
    },
    reasoning: {
      label: 'Raciocínio em curso',
      title: 'O sistema acompanha a decisão.',
      description: 'A corrente ciano sinaliza que o raciocínio está ativo sem competir com a leitura clínica.'
    },
    mastery: {
      label: 'Conhecimento consolidado',
      title: 'O avanço ganha permanência.',
      description: 'O dourado aparece apenas quando a retenção ou o domínio transformam progresso em conquista.'
    },
    corruption: {
      label: 'Risco identificado',
      title: 'O desvio fica visível e localizado.',
      description: 'O violeta marca conflito, chefe ou risco crítico. Ele nunca colore uma interface cotidiana inteira.'
    }
  };

  function announce(message) {
    if (!liveRegion) return;
    liveRegion.textContent = '';
    window.setTimeout(() => { liveRegion.textContent = message; }, 20);
  }

  function setLumenState(state, shouldAnnounce = true) {
    const copy = stateCopy[state];
    if (!copy) return;

    root.dataset.lumenState = state;
    stateLabel.textContent = copy.label;
    stateTitle.textContent = copy.title;
    stateDescription.textContent = copy.description;

    stateButtons.forEach((button) => {
      const selected = button.dataset.nqlState === state;
      button.setAttribute('aria-pressed', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });

    if (shouldAnnounce) announce(`${copy.label}. ${copy.title}`);
  }

  stateButtons.forEach((button, index) => {
    button.addEventListener('click', () => setLumenState(button.dataset.nqlState));
    button.addEventListener('keydown', (event) => {
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
      if (!keys.includes(event.key)) return;

      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % stateButtons.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + stateButtons.length) % stateButtons.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = stateButtons.length - 1;

      const nextButton = stateButtons[nextIndex];
      setLumenState(nextButton.dataset.nqlState);
      nextButton.focus();
    });
  });

  const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  calibrator?.addEventListener('pointermove', (event) => {
    if (!precisePointer.matches) return;
    const bounds = calibrator.getBoundingClientRect();
    const vertical = window.matchMedia('(max-width: 45rem)').matches;
    const ratio = vertical
      ? (event.clientY - bounds.top) / bounds.height
      : (event.clientX - bounds.left) / bounds.width;
    const index = Math.max(0, Math.min(stateButtons.length - 1, Math.floor(ratio * stateButtons.length)));
    const nextState = stateButtons[index].dataset.nqlState;
    if (root.dataset.lumenState !== nextState) setLumenState(nextState, false);
  });

  const motionToggle = document.getElementById('motionToggle');
  const motionLabel = motionToggle?.querySelector('.nql-button__label-long');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manuallyPaused = false;

  function syncMotionControl() {
    const systemReduced = reduceMotion.matches;
    const paused = systemReduced || manuallyPaused;
    root.dataset.motion = paused ? 'paused' : 'running';
    motionToggle?.setAttribute('aria-pressed', String(paused));
    if (motionLabel) {
      motionLabel.textContent = systemReduced ? 'Movimento reduzido' : (manuallyPaused ? 'Retomar fluxo' : 'Pausar fluxo');
    }
  }

  motionToggle?.addEventListener('click', () => {
    if (reduceMotion.matches) {
      announce('O movimento permanece reduzido pela preferência do sistema.');
      return;
    }
    manuallyPaused = !manuallyPaused;
    syncMotionControl();
    announce(manuallyPaused ? 'Movimento pausado.' : 'Movimento retomado.');
  });

  reduceMotion.addEventListener?.('change', syncMotionControl);
  syncMotionControl();

  const loadingButton = document.getElementById('loadingDemo');
  loadingButton?.addEventListener('click', () => {
    if (loadingButton.classList.contains('is-loading')) return;
    loadingButton.classList.add('is-loading');
    loadingButton.setAttribute('aria-busy', 'true');
    loadingButton.disabled = true;
    announce('Calibrando sessão.');

    window.setTimeout(() => {
      loadingButton.classList.remove('is-loading');
      loadingButton.setAttribute('aria-busy', 'false');
      loadingButton.disabled = false;
      announce('Sessão calibrada.');
    }, 900);
  });

  const demoForm = document.getElementById('foundationForm');
  const priorityInput = document.getElementById('priorityTopic');
  const priorityError = document.getElementById('priorityTopicError');
  const formStatus = document.getElementById('foundationFormStatus');
  const clearPriority = document.getElementById('clearPriority');

  function clearFieldError() {
    priorityInput?.removeAttribute('aria-invalid');
    if (priorityError) priorityError.hidden = true;
  }

  demoForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = priorityInput.value.trim();
    if (!value) {
      priorityInput.setAttribute('aria-invalid', 'true');
      priorityError.hidden = false;
      formStatus.textContent = '';
      priorityInput.focus();
      return;
    }

    clearFieldError();
    formStatus.textContent = `Prioridade salva: ${value}.`;
  });

  priorityInput?.addEventListener('input', () => {
    if (priorityInput.value.trim()) clearFieldError();
  });

  clearPriority?.addEventListener('click', () => {
    priorityInput.value = '';
    clearFieldError();
    formStatus.textContent = 'Campo limpo.';
    priorityInput.focus();
  });

  document.querySelectorAll('[data-nql-tabs]').forEach((tabs) => {
    const tabButtons = Array.from(tabs.querySelectorAll('[role="tab"]'));
    const panels = Array.from(tabs.querySelectorAll('[role="tabpanel"]'));

    function activateTab(nextTab, moveFocus = true) {
      tabButtons.forEach((tab) => {
        const active = tab === nextTab;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.id !== nextTab.getAttribute('aria-controls'); });
      if (moveFocus) nextTab.focus();
    }

    tabButtons.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab, false));
      tab.addEventListener('keydown', (event) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();

        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabButtons.length - 1;
        activateTab(tabButtons[nextIndex]);
      });
    });
  });

  document.querySelectorAll('.nql-branches').forEach((group) => {
    const branches = Array.from(group.querySelectorAll('.nql-branch'));
    branches.forEach((branch) => {
      branch.addEventListener('click', () => {
        branches.forEach((candidate) => {
          const selected = candidate === branch;
          candidate.setAttribute('aria-pressed', String(selected));
          const candidateLabel = candidate.querySelector('.nql-branch__state');
          if (candidateLabel) candidateLabel.textContent = selected ? 'Selecionada' : (candidateLabel.dataset.idleLabel || 'Disponível');
        });
        announce(`Alternativa ${branch.querySelector('.nql-branch__key')?.textContent || ''} selecionada.`);
      });
    });
  });

  const dialog = document.getElementById('foundationDialog');
  const dialogTitle = document.getElementById('foundationDialogTitle');
  const dialogOpen = document.getElementById('openFoundationDialog');
  let dialogOpener = null;

  function openDialog() {
    dialogOpener = document.activeElement;
    dialog.showModal();
    window.requestAnimationFrame(() => dialogTitle.focus());
  }

  function closeDialog(returnValue = '') {
    if (dialog.open) dialog.close(returnValue);
  }

  dialogOpen?.addEventListener('click', openDialog);
  dialog?.querySelectorAll('[data-nql-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => closeDialog('cancel'));
  });
  dialog?.querySelector('[data-nql-dialog-confirm]')?.addEventListener('click', () => {
    const selected = document.getElementById('dialogStage')?.value || 'Etapa inicial';
    closeDialog('confirm');
    announce(`Trilho confirmado: ${selected}.`);
  });
  dialog?.addEventListener('close', () => {
    if (dialogOpener instanceof HTMLElement && document.contains(dialogOpener)) dialogOpener.focus();
  });
  dialog?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = Array.from(dialog.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => element instanceof HTMLElement && element.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogTitle)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const observed = document.querySelectorAll('[data-observe]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, { rootMargin: '12% 0px', threshold: .04 });
    observed.forEach((element) => observer.observe(element));
  } else {
    observed.forEach((element) => element.classList.add('is-in-view'));
  }

  const animatedPorts = document.querySelectorAll('.nql-hilar--active');
  if ('IntersectionObserver' in window) {
    const portObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-port-live', entry.isIntersecting && entry.intersectionRatio >= .12);
      });
    }, { threshold: [0, .12] });
    animatedPorts.forEach((element) => portObserver.observe(element));
  } else {
    animatedPorts.forEach((element) => element.classList.add('is-port-live'));
  }

  setLumenState(root.dataset.lumenState || 'reasoning', false);
})();
