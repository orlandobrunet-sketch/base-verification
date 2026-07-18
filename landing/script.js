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
      requestScrollUpdate();
    }, { threshold: 0.12 });
    finaleObserver.observe(finale);
  }

  if (boss && 'IntersectionObserver' in window) {
    var bossObserver = new IntersectionObserver(function (entries) {
      bossVisible = entries.some(function (entry) { return entry.isIntersecting; });
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
    var chatPlayed = false;

    function playChat() {
      if (chatPlayed) return;
      chatPlayed = true;

      if (reduced) {
        bubbles.forEach(function (bubble) { bubble.classList.add('show'); });
        if (typing) typing.classList.add('hide');
        return;
      }

      window.setTimeout(function () {
        if (typing) typing.classList.add('hide');
        if (bubbles[0]) bubbles[0].classList.add('show');
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
