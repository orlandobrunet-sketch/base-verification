/* NefroQuest · Atlas Vivo — progressive interactions */
(function () {
  'use strict';

  var root = document.documentElement;
  var nav = document.getElementById('nav');
  var mobileCta = document.querySelector('.mobile-cta');
  var hero = document.querySelector('.hero');
  var boss = document.querySelector('.boss');
  var finale = document.querySelector('.finale');
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileViewport = window.matchMedia('(max-width: 640px)');
  var reduced = reduceQuery.matches;
  var bossVisible = false;
  var finaleVisible = false;
  var scrollTicking = false;
  var heroLab = document.querySelector('[data-nephron-lab]');

  function reveal(element) {
    element.classList.add('in');
  }

  function revealAll() {
    document.querySelectorAll('.reveal, .reveal-up').forEach(reveal);
    document.querySelectorAll('.chat-bubble').forEach(function (bubble) {
      bubble.classList.add('show');
    });
    var typing = document.querySelector('[data-typing]');
    if (typing) typing.classList.add('hide');
  }

  if (!reduced) root.classList.add('motion-ready');

  /* Hero enters as one deliberate opening sequence. */
  var heroReveals = document.querySelectorAll('.hero .reveal');
  window.requestAnimationFrame(function () {
    heroReveals.forEach(reveal);
  });

  /* Percorra o Fluxo: o cursor é magnetizado ao traçado real do néfron. */
  if (heroLab) {
    var nephronAtlas = heroLab.querySelector('[data-nephron-atlas]');
    var nephron = heroLab.querySelector('[data-nephron]');
    var nephronPath = heroLab.querySelector('[data-nephron-path]');
    var nephronProgress = heroLab.querySelector('[data-nephron-progress]');
    var nephronProbe = heroLab.querySelector('[data-nephron-probe]');
    var nephronProbeHalo = heroLab.querySelector('[data-nephron-probe-halo]');
    var nephronNodes = Array.prototype.slice.call(heroLab.querySelectorAll('[data-nephron-node]'));
    var flowEvents = Array.prototype.slice.call(heroLab.querySelectorAll('[data-flow-event]'));
    var flowControls = Array.prototype.slice.call(heroLab.querySelectorAll('[data-flow-stage]'));
    var flowInsight = heroLab.querySelector('[data-flow-insight]');
    var flowKicker = heroLab.querySelector('[data-flow-kicker]');
    var flowTitle = heroLab.querySelector('[data-flow-title]');
    var flowCopy = heroLab.querySelector('[data-flow-copy]');
    var flowCount = heroLab.querySelector('[data-flow-count]');
    var flowMechanism = heroLab.querySelector('[data-flow-mechanism]');
    var flowReward = heroLab.querySelector('[data-flow-reward]');
    var flowStages = [
      { kicker: '01 · Filtra', title: 'O desafio encontra o seu momento.', copy: 'O motor lê seu desempenho por tema e calibra a próxima questão.', mechanism: 'IRT · calibração por categoria', reward: 'Runa da decisão' },
      { kicker: '02 · Interpreta', title: 'O erro revela onde decidir.', copy: 'O comentário compara sua escolha ao ponto que muda o raciocínio.', mechanism: 'Comentário · Oráculo no contexto', reward: 'Runa do discernimento' },
      { kicker: '03 · Retém', title: 'O conhecimento volta antes de apagar.', copy: 'A revisão reaparece no intervalo certo, priorizando suas lacunas.', mechanism: 'FSRS · revisão espaçada', reward: 'Runa da memória' },
      { kicker: '04 · Conquista', title: 'Seu domínio clínico ganha forma.', copy: 'XP, classe e equipamentos revelam o que você domina — e o que ainda falta.', mechanism: 'Mapa de domínio · progressão RPG', reward: 'Brasão de maestria' }
    ];
    var stageProgress = [.07, .34, .64, .92];
    var pathLength = nephronPath && typeof nephronPath.getTotalLength === 'function' ? nephronPath.getTotalLength() : 0;
    var pathSamples = [];
    var currentProgress = stageProgress[0];
    var targetProgress = stageProgress[0];
    var selectedStage = -1;
    var pendingPointer = null;
    var heroFlowFrame = 0;
    var heroVisible = true;
    var userHasInteracted = false;
    var candidateStage = -1;
    var candidateSince = 0;
    var lumenPulseTimer = 0;
    var lumenPulseLast = 0;
    var lumenCarriersRunning = false;

    function buildPathSamples() {
      if (!pathLength) return;
      pathSamples = [];
      for (var sampleIndex = 0; sampleIndex < 128; sampleIndex += 1) {
        var progress = sampleIndex / 127;
        var point = nephronPath.getPointAtLength(pathLength * progress);
        pathSamples.push({ x: point.x, y: point.y, progress: progress });
      }
      flowControls.forEach(function (control, controlIndex) {
        var nodeX = Number(control.dataset.nodeX);
        var nodeY = Number(control.dataset.nodeY);
        var closest = pathSamples[0];
        var shortest = Infinity;
        pathSamples.forEach(function (sample) {
          var dx = sample.x - nodeX;
          var dy = sample.y - nodeY;
          var distance = dx * dx + dy * dy;
          if (distance < shortest) {
            shortest = distance;
            closest = sample;
          }
        });
        stageProgress[controlIndex] = closest.progress;
      });
    }

    function clientPointToSvg(clientX, clientY) {
      if (!nephron || typeof nephron.createSVGPoint !== 'function') return null;
      var matrix = nephron.getScreenCTM();
      if (!matrix) return null;
      var point = nephron.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      return point.matrixTransform(matrix.inverse());
    }

    function positionProbe(progress) {
      if (!nephronPath || !pathLength) return;
      var bounded = Math.max(0, Math.min(1, progress));
      var point = nephronPath.getPointAtLength(pathLength * bounded);
      [nephronProbe, nephronProbeHalo].forEach(function (element) {
        if (!element) return;
        element.setAttribute('cx', point.x.toFixed(2));
        element.setAttribute('cy', point.y.toFixed(2));
      });
      if (nephronProgress) nephronProgress.style.strokeDasharray = bounded.toFixed(3) + ' 1';
    }

    function focusCamera(progress) {
      if (!nephronAtlas || !nephron || !nephronPath || !pathLength || reduced) return;
      var atlasBounds = nephronAtlas.getBoundingClientRect();
      var viewBox = nephron.viewBox && nephron.viewBox.baseVal;
      if (!atlasBounds.width || !atlasBounds.height || !viewBox || !viewBox.width || !viewBox.height) return;
      var point = nephronPath.getPointAtLength(pathLength * Math.max(0, Math.min(1, progress)));
      var scale = Math.min(atlasBounds.width / viewBox.width, atlasBounds.height / viewBox.height);
      var renderedWidth = viewBox.width * scale;
      var renderedHeight = viewBox.height * scale;
      var focusX = (atlasBounds.width - renderedWidth) / 2 + (point.x - viewBox.x) * scale;
      var focusY = (atlasBounds.height - renderedHeight) / 2 + (point.y - viewBox.y) * scale;
      nephronAtlas.style.setProperty('--camera-x', focusX.toFixed(1) + 'px');
      nephronAtlas.style.setProperty('--camera-y', focusY.toFixed(1) + 'px');
      nephronAtlas.style.setProperty('--camera-zoom', mobileViewport.matches ? '1.09' : '1.14');
      nephronAtlas.classList.add('is-camera-focused');
    }

    function resetCamera() {
      if (!nephronAtlas) return;
      nephronAtlas.style.setProperty('--camera-zoom', '1');
      nephronAtlas.classList.remove('is-camera-focused');
    }

    function pauseLumen() {
      window.clearTimeout(lumenPulseTimer);
      lumenPulseTimer = 0;
      if (nephronAtlas) nephronAtlas.classList.remove('is-lumen-pulse');
      if (nephron && typeof nephron.pauseAnimations === 'function') nephron.pauseAnimations();
      lumenCarriersRunning = false;
    }

    function pulseLumen(force) {
      if (reduced || document.hidden || !heroVisible || !nephronAtlas) return;
      var now = performance.now();
      if (!lumenCarriersRunning && nephron && typeof nephron.unpauseAnimations === 'function') {
        nephron.unpauseAnimations();
        lumenCarriersRunning = true;
      }
      if (force || now - lumenPulseLast >= 900) {
        nephronAtlas.classList.remove('is-lumen-pulse');
        void nephronAtlas.offsetWidth;
        nephronAtlas.classList.add('is-lumen-pulse');
        lumenPulseLast = now;
      }
      window.clearTimeout(lumenPulseTimer);
      lumenPulseTimer = window.setTimeout(pauseLumen, 1300);
    }

    function stageForProgress(progress) {
      var nearest = 0;
      var distance = Infinity;
      stageProgress.forEach(function (stagePoint, index) {
        var currentDistance = Math.abs(stagePoint - progress);
        if (currentDistance < distance) {
          nearest = index;
          distance = currentDistance;
        }
      });
      return distance <= .032 ? nearest : -1;
    }

    function updateInsight(index) {
      if (!flowInsight || !flowStages[index]) return;
      var stage = flowStages[index];
      if (flowKicker) flowKicker.textContent = stage.kicker;
      if (flowTitle) flowTitle.textContent = stage.title;
      if (flowCopy) flowCopy.textContent = stage.copy;
      if (flowCount) flowCount.textContent = (index + 1) + ' / ' + flowStages.length;
      if (flowMechanism) flowMechanism.textContent = stage.mechanism;
      if (flowReward) flowReward.textContent = stage.reward;
      flowInsight.classList.remove('is-changing');
      void flowInsight.offsetWidth;
      flowInsight.classList.add('is-changing');
    }

    function selectStage(index, preserveTarget) {
      var selected = Math.max(0, Math.min(flowStages.length - 1, index));
      var changed = selected !== selectedStage;
      selectedStage = selected;
      heroLab.setAttribute('data-flow-stage', String(selected));
      nephronNodes.forEach(function (node, nodeIndex) {
        node.classList.toggle('is-active', nodeIndex === selected);
      });
      flowEvents.forEach(function (eventNode, eventIndex) {
        eventNode.classList.toggle('is-active', eventIndex === selected);
      });
      flowControls.forEach(function (control, controlIndex) {
        var isCurrent = controlIndex === selected;
        control.classList.toggle('is-current', isCurrent);
        control.setAttribute('aria-pressed', String(isCurrent));
        control.tabIndex = isCurrent ? 0 : -1;
      });
      if (!preserveTarget) targetProgress = stageProgress[selected];
      if (changed) {
        updateInsight(selected);
      }
      requestFlowFrame();
    }

    function cancelIntro() {
      if (userHasInteracted) return;
      userHasInteracted = true;
    }

    function findClosestProgress(clientX, clientY) {
      var local = clientPointToSvg(clientX, clientY);
      if (!local || !pathSamples.length) return null;
      var closest = pathSamples[0];
      var shortest = Infinity;
      pathSamples.forEach(function (sample) {
        var dx = sample.x - local.x;
        var dy = sample.y - local.y;
        var distance = dx * dx + dy * dy;
        if (distance < shortest) {
          shortest = distance;
          closest = sample;
        }
      });
      return shortest <= 1600 ? closest.progress : null;
    }

    function runFlowFrame() {
      heroFlowFrame = 0;
      if (!heroVisible || document.hidden) return;
      if (pendingPointer) {
        var closestProgress = findClosestProgress(pendingPointer.x, pendingPointer.y);
        pendingPointer = null;
        if (closestProgress !== null) {
          nephronAtlas.classList.add('is-tracing');
          targetProgress = closestProgress;
          var nextStage = stageForProgress(targetProgress);
          if (nextStage === selectedStage || nextStage < 0) {
            candidateStage = -1;
            candidateSince = 0;
            if (nextStage >= 0) focusCamera(stageProgress[nextStage]);
            else resetCamera();
          } else if (nextStage !== candidateStage) {
            candidateStage = nextStage;
            candidateSince = performance.now();
            resetCamera();
          } else if (performance.now() - candidateSince >= 110) {
            selectStage(candidateStage, true);
            focusCamera(stageProgress[candidateStage]);
            candidateStage = -1;
            candidateSince = 0;
          }
          pulseLumen(false);
        } else {
          nephronAtlas.classList.remove('is-tracing');
          targetProgress = stageProgress[selectedStage];
          candidateStage = -1;
          candidateSince = 0;
          resetCamera();
        }
      }
      if (candidateStage >= 0 && performance.now() - candidateSince >= 110) {
        selectStage(candidateStage, true);
        focusCamera(stageProgress[candidateStage]);
        candidateStage = -1;
        candidateSince = 0;
      }
      var distance = targetProgress - currentProgress;
      currentProgress = reduced ? targetProgress : currentProgress + distance * .12;
      if (Math.abs(distance) < .0008) currentProgress = targetProgress;
      positionProbe(currentProgress);
      if (pendingPointer || candidateStage >= 0 || Math.abs(targetProgress - currentProgress) >= .0008) requestFlowFrame();
    }

    function requestFlowFrame() {
      if (!heroFlowFrame) heroFlowFrame = window.requestAnimationFrame(runFlowFrame);
    }

    if (nephronAtlas) {
      nephronAtlas.addEventListener('pointermove', function (event) {
        if (reduced || event.pointerType === 'touch') return;
        cancelIntro();
        pendingPointer = { x: event.clientX, y: event.clientY };
        requestFlowFrame();
      });
      nephronAtlas.addEventListener('pointerleave', function () {
        nephronAtlas.classList.remove('is-tracing');
        pendingPointer = null;
        candidateStage = -1;
        candidateSince = 0;
        targetProgress = stageProgress[selectedStage];
        resetCamera();
        requestFlowFrame();
      });
    }

    flowControls.forEach(function (control, index) {
      function activate(event) {
        cancelIntro();
        selectStage(index, false);
        focusCamera(stageProgress[index]);
        pulseLumen(true);
        if (event && event.type === 'click') control.focus({ preventScroll: true });
      }
      control.addEventListener('pointerenter', activate);
      control.addEventListener('click', activate);
      control.addEventListener('focus', activate);
      control.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % flowControls.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + flowControls.length) % flowControls.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = flowControls.length - 1;
        else return;
        event.preventDefault();
        flowControls[next].focus();
      });
    });

    heroLab.addEventListener('focusout', function () {
      window.requestAnimationFrame(function () {
        if (!heroLab.contains(document.activeElement)) resetCamera();
      });
    });

    buildPathSamples();
    selectStage(0, false);
    pauseLumen();

    if ('IntersectionObserver' in window) {
      var heroLabObserver = new IntersectionObserver(function (entries) {
        heroVisible = entries.some(function (entry) { return entry.isIntersecting; });
        if (nephronAtlas) nephronAtlas.classList.toggle('is-paused', !heroVisible);
        if (!heroVisible) pauseLumen();
        if (heroVisible) requestFlowFrame();
      }, { threshold: .08 });
      heroLabObserver.observe(heroLab);
    }
    document.addEventListener('visibilitychange', function () {
      if (nephronAtlas) nephronAtlas.classList.toggle('is-paused', document.hidden || !heroVisible);
      if (document.hidden || !heroVisible) pauseLumen();
      if (!document.hidden && heroVisible) requestFlowFrame();
    });

  }

  /* Biblioteca Cinética: o acervo responde à posição do leitor, sem autoplay. */
  var guidelineFlow = document.querySelector('[data-guideline-flow]');
  if (guidelineFlow) {
    var guidelineTrack = guidelineFlow.querySelector('[data-guideline-track]');
    var guidelineCovers = Array.prototype.slice.call(guidelineFlow.querySelectorAll('[data-guideline-cover]'));
    var guidelineActive = guidelineFlow.querySelector('[data-guideline-active]');
    var finePointer = window.matchMedia('(pointer: fine)');
    var nativeArchive = window.matchMedia('(max-width: 760px), (pointer: coarse)');
    var archiveCurrent = 0;
    var archiveTarget = 0;
    var archiveStart = 0;
    var archiveEnd = 0;
    var archiveFrame = 0;
    var archiveMeasured = false;
    var activeCoverIndex = -1;

    function usesNativeArchive() {
      return reduced || !finePointer.matches || nativeArchive.matches;
    }

    function clampArchive(value) {
      return Math.max(Math.min(value, archiveStart), archiveEnd);
    }

    function setActiveCover(index) {
      if (index === activeCoverIndex || !guidelineCovers[index]) return;
      activeCoverIndex = index;
      guidelineCovers.forEach(function (cover, coverIndex) {
        cover.classList.toggle('is-center', coverIndex === index);
      });
      if (guidelineActive) guidelineActive.textContent = guidelineCovers[index].getAttribute('data-short-title') || '';
    }

    function updateNativeArchiveFocus() {
      var flowBounds = guidelineFlow.getBoundingClientRect();
      var middle = flowBounds.left + flowBounds.width / 2;
      var nearest = 0;
      var nearestDistance = Infinity;
      guidelineCovers.forEach(function (cover, index) {
        var bounds = cover.getBoundingClientRect();
        var distance = Math.abs(bounds.left + bounds.width / 2 - middle);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      setActiveCover(nearest);
    }

    function renderArchive() {
      archiveFrame = 0;
      if (usesNativeArchive() || !archiveMeasured) {
        updateNativeArchiveFocus();
        return;
      }
      archiveCurrent += (archiveTarget - archiveCurrent) * .16;
      if (Math.abs(archiveTarget - archiveCurrent) < .08) archiveCurrent = archiveTarget;
      guidelineFlow.style.setProperty('--archive-offset', archiveCurrent.toFixed(2) + 'px');

      var middle = guidelineFlow.clientWidth / 2;
      var nearest = 0;
      var nearestDistance = Infinity;
      guidelineCovers.forEach(function (cover, index) {
        var center = cover.offsetLeft + cover.offsetWidth / 2 + archiveCurrent;
        var distance = Math.max(-1, Math.min(1, (center - middle) / Math.max(1, middle * .82)));
        var magnitude = Math.abs(distance);
        cover.style.setProperty('--cover-rotate', (-distance * 19).toFixed(2) + 'deg');
        cover.style.setProperty('--cover-scale', (1 - magnitude * .13).toFixed(3));
        cover.style.setProperty('--cover-y', (magnitude * 20).toFixed(1) + 'px');
        if (Math.abs(center - middle) < nearestDistance) {
          nearest = index;
          nearestDistance = Math.abs(center - middle);
        }
      });
      setActiveCover(nearest);
      if (Math.abs(archiveTarget - archiveCurrent) >= .08) requestArchiveFrame();
    }

    function requestArchiveFrame() {
      if (!archiveFrame) archiveFrame = window.requestAnimationFrame(renderArchive);
    }

    function measureArchive() {
      if (!guidelineTrack || !guidelineCovers.length) return;
      var first = guidelineCovers[0];
      var last = guidelineCovers[guidelineCovers.length - 1];
      archiveStart = guidelineFlow.clientWidth / 2 - (first.offsetLeft + first.offsetWidth / 2);
      archiveEnd = guidelineFlow.clientWidth / 2 - (last.offsetLeft + last.offsetWidth / 2);
      archiveTarget = clampArchive(archiveTarget);
      archiveCurrent = clampArchive(archiveCurrent);
      archiveMeasured = true;
      requestArchiveFrame();
    }

    guidelineFlow.addEventListener('pointermove', function (event) {
      if (usesNativeArchive() || event.pointerType === 'touch') return;
      var bounds = guidelineFlow.getBoundingClientRect();
      var position = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
      archiveTarget = archiveStart + (archiveEnd - archiveStart) * position;
      requestArchiveFrame();
    });

    guidelineFlow.addEventListener('scroll', function () {
      if (usesNativeArchive()) window.requestAnimationFrame(updateNativeArchiveFocus);
    }, { passive: true });

    guidelineCovers.forEach(function (cover, index) {
      cover.addEventListener('focus', function () {
        setActiveCover(index);
        if (!usesNativeArchive()) {
          guidelineFlow.scrollLeft = 0;
          archiveTarget = clampArchive(guidelineFlow.clientWidth / 2 - (cover.offsetLeft + cover.offsetWidth / 2));
          requestArchiveFrame();
        } else {
          cover.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
        }
      });
      cover.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight') next = Math.min(guidelineCovers.length - 1, index + 1);
        else if (event.key === 'ArrowLeft') next = Math.max(0, index - 1);
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = guidelineCovers.length - 1;
        else return;
        event.preventDefault();
        if (usesNativeArchive()) guidelineCovers[next].focus();
        else guidelineCovers[next].focus({ preventScroll: true });
      });
    });

    window.addEventListener('resize', measureArchive, { passive: true });
    if (typeof finePointer.addEventListener === 'function') finePointer.addEventListener('change', measureArchive);
    if (typeof nativeArchive.addEventListener === 'function') nativeArchive.addEventListener('change', measureArchive);
    window.requestAnimationFrame(measureArchive);
  }

  /* Simulação do motor adaptativo: um controle real, não uma precisão fingida. */
  var irtDemo = document.querySelector('[data-irt-demo]');
  if (irtDemo) {
    var irtSlider = irtDemo.querySelector('input[type="range"]');
    var irtState = irtDemo.querySelector('[data-irt-state]');
    function updateIrtDemo() {
      var value = Number(irtSlider.value);
      var next = Math.min(94, value + 8);
      var state = value < 32 ? 'Reforço inteligente' : value > 74 ? 'Desafio de expansão' : 'Sua zona ideal';
      irtDemo.style.setProperty('--irt-user', value + '%');
      irtDemo.style.setProperty('--irt-next', next + '%');
      if (irtState) irtState.textContent = state;
      irtSlider.setAttribute('aria-valuetext', value + ' de 100 — ' + state);
    }
    irtSlider.addEventListener('input', updateIrtDemo);
    updateIrtDemo();
  }

  /* Remaining content reveals only as it becomes relevant. */
  var reveals = document.querySelectorAll('.reveal-up, .finale .reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    reveals.forEach(function (element) { revealObserver.observe(element); });
  } else {
    reveals.forEach(reveal);
  }

  /* Sticky navigation, reading progress and mobile action. */
  function isInViewport(section) {
    if (!section) return false;
    var bounds = section.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  }

  function updateScrollState() {
    var y = window.scrollY || window.pageYOffset;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, y / max));
    var immersiveSceneVisible = false;

    if (mobileCta && mobileViewport.matches) {
      immersiveSceneVisible = [hero, boss, finale].some(isInViewport);
    }

    if (nav) {
      nav.classList.toggle('is-stuck', y > 36);
      nav.style.setProperty('--scroll-progress', progress.toFixed(4));
    }

    if (mobileCta) {
      mobileCta.classList.toggle('is-visible', y > window.innerHeight * 0.72 && !immersiveSceneVisible && !bossVisible && !finaleVisible);
    }

    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  updateScrollState();

  if (finale && 'IntersectionObserver' in window) {
    var finaleObserver = new IntersectionObserver(function (entries) {
      finaleVisible = entries.some(function (entry) { return entry.isIntersecting; });
      finale.classList.toggle('is-active', finaleVisible && !reduced);
      requestScrollUpdate();
    }, { threshold: 0.12 });
    finaleObserver.observe(finale);
  }

  if (boss && 'IntersectionObserver' in window) {
    var bossObserver = new IntersectionObserver(function (entries) {
      bossVisible = entries.some(function (entry) { return entry.isIntersecting; });
      boss.classList.toggle('is-active', bossVisible && !reduced);
      requestScrollUpdate();
    }, { threshold: 0.12 });
    bossObserver.observe(boss);
  }

  /* Current section is reflected in the navigation. */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-34% 0px -56% 0px', threshold: 0 });

    navLinks.forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) sectionObserver.observe(target);
    });

    [document.querySelector('#duvidas'), finale].forEach(function (target) {
      if (target) sectionObserver.observe(target);
    });
  }

  /* Count only verified inventory values, keeping the written value as fallback. */
  var counters = document.querySelectorAll('[data-count]');
  function countUp(element) {
    var target = parseInt(element.getAttribute('data-count'), 10);
    var suffix = element.getAttribute('data-suffix') || '';
    var duration = 1100;
    var start = null;

    function format(value) {
      return value >= 1000 ? value.toLocaleString('pt-BR') : String(value);
    }

    function step(timestamp) {
      if (start === null) start = timestamp;
      var elapsed = Math.min(1, (timestamp - start) / duration);
      var eased = 1 - Math.pow(1 - elapsed, 3);
      element.textContent = format(Math.floor(target * eased)) + suffix;
      if (elapsed < 1) window.requestAnimationFrame(step);
      else element.textContent = format(target) + suffix;
    }

    window.requestAnimationFrame(step);
  }

  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.55 });
    counters.forEach(function (counter) { countObserver.observe(counter); });
  }

  /* Oracle demonstration: one orchestrated motion instead of scattered effects. */
  var chat = document.querySelector('.chat');
  if (chat) {
    var bubbles = chat.querySelectorAll('.chat-bubble');
    var typing = chat.querySelector('[data-typing]');
    var oracleCore = document.querySelector('.oracle-core');
    var chatPlayed = false;

    function playChat() {
      if (chatPlayed) return;
      chatPlayed = true;

      if (reduced) {
        bubbles.forEach(function (bubble) { bubble.classList.add('show'); });
        if (typing) typing.classList.add('hide');
        if (oracleCore) oracleCore.classList.add('is-answering');
        return;
      }

      if (oracleCore) oracleCore.classList.add('is-thinking');

      window.setTimeout(function () {
        if (typing) typing.classList.add('hide');
        if (bubbles[0]) bubbles[0].classList.add('show');
        if (oracleCore) {
          oracleCore.classList.remove('is-thinking');
          oracleCore.classList.add('is-answering');
        }
      }, 420);

      window.setTimeout(function () {
        if (bubbles[1]) bubbles[1].classList.add('show');
      }, 1300);
    }

    if ('IntersectionObserver' in window) {
      var chatObserver = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          playChat();
          chatObserver.disconnect();
        }
      }, { threshold: 0.3 });
      chatObserver.observe(chat);
    } else {
      playChat();
    }
  }

  /* Parallax sutil nas cenas grandes; o conteúdo não depende do ponteiro. */
  function bindFlowScene(scene, target, strength) {
    if (!scene || !target) return;
    var frame = 0;

    scene.addEventListener('pointermove', function (event) {
      if (reduced || event.pointerType === 'touch' || frame) return;
      frame = window.requestAnimationFrame(function () {
        var rect = scene.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) - .5;
        var y = ((event.clientY - rect.top) / rect.height) - .5;
        target.style.setProperty('--flow-x', (x * strength).toFixed(1) + 'px');
        target.style.setProperty('--flow-y', (y * strength * .7).toFixed(1) + 'px');
        frame = 0;
      });
    });

    scene.addEventListener('pointerleave', function () {
      target.style.setProperty('--flow-x', '0px');
      target.style.setProperty('--flow-y', '0px');
    });
  }

  bindFlowScene(boss, boss && boss.querySelector('.boss-backdrop'), 7);
  bindFlowScene(finale, finale && finale.querySelector('.finale-portal'), 14);

  /* Hooks into analytics when the host page provides gtag/dataLayer. */
  document.querySelectorAll('[data-cta]').forEach(function (link) {
    link.addEventListener('click', function () {
      var placement = link.getAttribute('data-cta') || 'unknown';
      var destination = link.getAttribute('href') || '';
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'landing_cta_clicked', {
          cta_placement: placement,
          link_url: destination
        });
      } else if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: 'landing_cta_clicked',
          cta_placement: placement,
          link_url: destination
        });
      }
    });
  });

  function onMotionPreferenceChange(event) {
    reduced = event.matches;
    if (reduced) {
      root.classList.remove('motion-ready');
      revealAll();
    } else {
      root.classList.add('motion-ready');
    }
  }

  if (typeof reduceQuery.addEventListener === 'function') {
    reduceQuery.addEventListener('change', onMotionPreferenceChange);
  }
})();
