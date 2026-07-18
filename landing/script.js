/* NefroQuest · Atlas Vivo — progressive interactions */
(function () {
  'use strict';

  var root = document.documentElement;
  var nav = document.getElementById('nav');
  var mobileCta = document.querySelector('.mobile-cta');
  var boss = document.querySelector('.boss');
  var finale = document.querySelector('.finale');
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
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

  /* Fluxo Vivo: pointer, teclado e tour automático controlam o mesmo néfron. */
  if (heroLab) {
    var nephron = heroLab.querySelector('[data-nephron]');
    var nephronPath = heroLab.querySelector('[data-nephron-path]');
    var nephronProbe = heroLab.querySelector('[data-nephron-probe]');
    var atlasLens = heroLab.querySelector('[data-atlas-lens]');
    var nephronNodes = Array.prototype.slice.call(heroLab.querySelectorAll('[data-nephron-node]'));
    var stageItems = Array.prototype.slice.call(heroLab.querySelectorAll('[data-stage]'));
    var stageLabel = heroLab.querySelector('[data-stage-label]');
    var stageNames = ['Filtração', 'Interpretação', 'Retenção', 'Conquista'];
    var stageProgress = [.07, .34, .64, .92];
    var pathLength = nephronPath && typeof nephronPath.getTotalLength === 'function' ? nephronPath.getTotalLength() : 0;
    var heroPointerFrame = 0;
    var heroPointerActive = false;
    var heroVisible = true;
    var autoStage = 0;

    function positionProbe(progress) {
      if (!nephronPath || !nephronProbe || !pathLength) return;
      var point = nephronPath.getPointAtLength(pathLength * Math.max(0, Math.min(1, progress)));
      nephronProbe.setAttribute('cx', point.x.toFixed(2));
      nephronProbe.setAttribute('cy', point.y.toFixed(2));
    }

    function selectStage(index, progress) {
      var selected = Math.max(0, Math.min(3, index));
      autoStage = selected;
      nephronNodes.forEach(function (node, nodeIndex) {
        node.classList.toggle('is-active', nodeIndex === selected);
      });
      stageItems.forEach(function (item, itemIndex) {
        item.classList.toggle('is-current', itemIndex === selected);
        item.classList.toggle('is-complete', itemIndex < selected);
      });
      if (stageLabel) stageLabel.textContent = stageNames[selected];
      heroLab.style.setProperty('--stage-progress', ((selected + 1) * 25) + '%');
      positionProbe(typeof progress === 'number' ? progress : stageProgress[selected]);
    }

    function moveLens(clientX, clientY, radius) {
      if (!nephron || !atlasLens || typeof nephron.createSVGPoint !== 'function') return;
      var matrix = nephron.getScreenCTM();
      if (!matrix) return;
      var point = nephron.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      var local = point.matrixTransform(matrix.inverse());
      atlasLens.setAttribute('cx', local.x.toFixed(1));
      atlasLens.setAttribute('cy', local.y.toFixed(1));
      atlasLens.setAttribute('r', radius || 96);
    }

    heroLab.addEventListener('pointermove', function (event) {
      if (reduced || event.pointerType === 'touch') return;
      heroPointerActive = true;
      if (heroPointerFrame) return;
      heroPointerFrame = window.requestAnimationFrame(function () {
        var rect = heroLab.getBoundingClientRect();
        var x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        var y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        heroLab.style.setProperty('--flow-x', ((x - .5) * 18).toFixed(1) + 'px');
        heroLab.style.setProperty('--flow-y', ((y - .5) * 14).toFixed(1) + 'px');
        selectStage(Math.min(3, Math.floor(x * 4)), x);
        moveLens(event.clientX, event.clientY, 98);
        heroPointerFrame = 0;
      });
    });

    heroLab.addEventListener('pointerleave', function () {
      heroPointerActive = false;
      heroLab.style.setProperty('--flow-x', '0px');
      heroLab.style.setProperty('--flow-y', '0px');
      if (atlasLens) atlasLens.setAttribute('r', 0);
    });

    stageItems.forEach(function (item, index) {
      function activate() { selectStage(index); }
      item.addEventListener('pointerenter', activate);
      item.addEventListener('focus', activate);
    });

    if ('IntersectionObserver' in window) {
      var heroLabObserver = new IntersectionObserver(function (entries) {
        heroVisible = entries.some(function (entry) { return entry.isIntersecting; });
      }, { threshold: .08 });
      heroLabObserver.observe(heroLab);
    }

    selectStage(0);
    window.setInterval(function () {
      if (reduced || heroPointerActive || !heroVisible) return;
      selectStage((autoStage + 1) % 4);
    }, 2400);
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
  function updateScrollState() {
    var y = window.scrollY || window.pageYOffset;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, y / max));

    if (nav) {
      nav.classList.toggle('is-stuck', y > 36);
      nav.style.setProperty('--scroll-progress', progress.toFixed(4));
    }

    if (mobileCta) {
      mobileCta.classList.toggle('is-visible', y > window.innerHeight * 0.72 && !bossVisible && !finaleVisible);
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

  bindFlowScene(boss, boss && boss.querySelector('.boss-stage'), 22);
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
    }
  }

  if (typeof reduceQuery.addEventListener === 'function') {
    reduceQuery.addEventListener('change', onMotionPreferenceChange);
  }
})();
