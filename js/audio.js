// NefroQuest — Audio System
// Loaded before game.js; all functions become global.

    // ============ SISTEMA DE SOM RPG/MEDIEVAL ============
    const SFX = {
      correct: new Audio('assets/sounds/correct.wav'),
      wrong: new Audio('assets/sounds/wrong.wav'),
      levelup: new Audio('assets/sounds/levelup.wav'),
      forge: new Audio('assets/sounds/forge.wav'),
      chest: new Audio('assets/sounds/chest.wav'),
      streak: new Audio('assets/sounds/streak.wav'),
      click: new Audio('assets/sounds/click.wav'),
      boss: new Audio('assets/sounds/boss.wav'),
      victory: new Audio('assets/sounds/victory.wav')
    };
    // Pre-load all SFX
    Object.values(SFX).forEach(a => { a.load(); a.volume = 0.5; });
    
    // ============ MÚSICA DA TELA DE BOAS-VINDAS ============
    // Loop suave: fade-in 3s no início, fade-out automático 4s antes do fim, reinicia com fade-in
    const WELCOME_MUSIC_URL = 'assets/audio/welcome-theme.mp3';
    let WELCOME_MUSIC_VOL = 0.24;
    const WM_FADEIN_MS   = 3500;  // fade-in de 3.5 segundos — sobe suavemente
    const WM_FADEOUT_MS  = 4000;  // fade-out de 4 segundos antes do fim
    const WM_LOOP_GAP_MS = 800;   // pausa mínima entre loops após fade-out

    const wmTrack = new Audio();
    wmTrack.preload = 'auto';  // pré-carrega para evitar delay ao iniciar
    wmTrack.loop = false;
    wmTrack.volume = 0;        // volume 0 antes de qualquer coisa
    wmTrack.src = WELCOME_MUSIC_URL; // src após volume=0 para garantir ordem
    wmTrack.load();            // força início do carregamento (como bgA.load())

    let welcomeMusicState = 'idle'; // 'idle' | 'starting' | 'playing' | 'paused' | 'failed' | 'stopped'
    let bgMusicState = 'idle';      // 'idle' | 'starting' | 'playing' | 'paused' | 'failed' | 'stopped'

    function transitionWelcomeMusic(newState) {
      console.log(`[AudioFSM] Welcome Music State: ${welcomeMusicState} -> ${newState}`);
      welcomeMusicState = newState;
    }

    function transitionBgMusic(newState) {
      console.log(`[AudioFSM] BG Music State: ${bgMusicState} -> ${newState}`);
      bgMusicState = newState;
    }

    Object.defineProperty(window, 'welcomeMusicStarted', {
      get: () => ['starting', 'playing'].includes(welcomeMusicState),
      set: (val) => {
        if (!val) {
          transitionWelcomeMusic('stopped');
        } else {
          transitionWelcomeMusic('starting');
        }
      },
      configurable: true
    });

    Object.defineProperty(window, 'musicStarted', {
      get: () => ['starting', 'playing'].includes(bgMusicState),
      set: (val) => {
        if (!val) {
          transitionBgMusic('stopped');
        } else {
          transitionBgMusic('starting');
        }
      },
      configurable: true
    });

    let _wmFadeInterval = null;
    let _wmFadeOutInterval = null;
    let _wmLoopTimeout = null;
    let _wmFadeOutTimeout = null;
    let _wmStopRequested = false;

    function _wmClearTimers() {
      if (_wmFadeInterval)    { if (_wmFadeInterval.cancel) _wmFadeInterval.cancel(); else clearInterval(_wmFadeInterval); _wmFadeInterval = null; }
      if (_wmFadeOutInterval) { if (_wmFadeOutInterval.cancel) _wmFadeOutInterval.cancel(); else clearInterval(_wmFadeOutInterval); _wmFadeOutInterval = null; }
      if (_wmLoopTimeout)     { clearTimeout(_wmLoopTimeout);      _wmLoopTimeout = null; }
      if (_wmFadeOutTimeout)  { clearTimeout(_wmFadeOutTimeout);   _wmFadeOutTimeout = null; }
    }

    // Fade-in suave — time-based via performance.now(), rAF para imunidade a throttling de aba
    function _wmFadeIn(onDone) {
      wmTrack.volume = 0.01;
      const t0 = performance.now();
      let rafId;
      function _tick() {
        if (_wmStopRequested) { _wmFadeInterval = null; return; }
        const t = Math.min(1, (performance.now() - t0) / WM_FADEIN_MS);
        wmTrack.volume = WELCOME_MUSIC_VOL * Math.sqrt(t); // ease-out
        if (t >= 1) {
          wmTrack.volume = WELCOME_MUSIC_VOL;
          _wmFadeInterval = null;
          if (onDone) onDone();
        } else {
          rafId = requestAnimationFrame(_tick);
        }
      }
      rafId = requestAnimationFrame(_tick);
      _wmFadeInterval = { cancel: () => cancelAnimationFrame(rafId) };
    }

    // Fade-out suave — time-based, rAF
    function _wmFadeOut(onDone) {
      const startVol = wmTrack.volume;
      const t0 = performance.now();
      let rafId;
      function _tick() {
        if (_wmStopRequested) {
          _wmFadeOutInterval = null;
          wmTrack.volume = 0; wmTrack.pause();
          return;
        }
        const t = Math.min(1, (performance.now() - t0) / WM_FADEOUT_MS);
        wmTrack.volume = Math.max(0, startVol * (1 - t * t)); // ease-in
        if (t >= 1) {
          _wmFadeOutInterval = null;
          wmTrack.volume = 0;
          wmTrack.pause();
          if (onDone) onDone();
        } else {
          rafId = requestAnimationFrame(_tick);
        }
      }
      rafId = requestAnimationFrame(_tick);
      _wmFadeOutInterval = { cancel: () => cancelAnimationFrame(rafId) };
    }

    // Agenda o fade-out automático quando a faixa estiver tocando
    function _wmScheduleFadeOut() {
      if (_wmFadeOutTimeout) { clearTimeout(_wmFadeOutTimeout); _wmFadeOutTimeout = null; }
      // Aguarda a duração ficar disponível
      const trySchedule = () => {
        if (_wmStopRequested || !welcomeMusicStarted) return;
        const dur = wmTrack.duration;
        if (!dur || !isFinite(dur)) {
          // Tenta novamente em 200ms
          _wmFadeOutTimeout = setTimeout(trySchedule, 200);
          return;
        }
        const remaining = dur - wmTrack.currentTime;
        const fadeStart = remaining - (WM_FADEOUT_MS / 1000);
        if (fadeStart <= 0) {
          // Já está na zona de fade-out
          _wmStartFadeOutAndLoop();
        } else {
          _wmFadeOutTimeout = setTimeout(() => {
            if (!_wmStopRequested && welcomeMusicStarted) _wmStartFadeOutAndLoop();
          }, fadeStart * 1000);
        }
      };
      trySchedule();
    }

    function _wmStartFadeOutAndLoop() {
      _wmClearTimers();
      _wmFadeOut(() => {
        if (_wmStopRequested || !welcomeMusicStarted) return;
        // Pequena pausa antes de reiniciar
        _wmLoopTimeout = setTimeout(() => {
          if (!_wmStopRequested && welcomeMusicStarted) _wmPlayOnce();
        }, WM_LOOP_GAP_MS);
      });
    }

    function _wmPlayOnce() {
      if (_wmStopRequested || !welcomeMusicStarted) return;
      wmTrack.volume = 0.01;
      if (wmTrack.readyState >= 1) wmTrack.currentTime = 0;
      wmTrack.muted = true; // muted-first também nos loops (garante replay sem gesto)
      transitionWelcomeMusic('starting');
      wmTrack.play().then(() => {
        if (_wmStopRequested) {
          wmTrack.pause();
          wmTrack.muted = false;
          transitionWelcomeMusic('stopped');
          return;
        }
        wmTrack.muted = false;
        transitionWelcomeMusic('playing');
        _wmFadeIn(() => {
          if (!_wmStopRequested) _wmScheduleFadeOut();
        });
      }).catch((err) => {
        wmTrack.muted = false;
        transitionWelcomeMusic('failed');
        console.warn("[AudioFSM] _wmPlayOnce failed:", err);
      });
    }

    // Evento 'ended' como safety net (caso o fade-out não tenha pausado a tempo)
    wmTrack.addEventListener('ended', () => {
      if (_wmStopRequested || welcomeMusicState !== 'playing') return;
      _wmClearTimers();
      _wmLoopTimeout = setTimeout(() => {
        if (!_wmStopRequested && welcomeMusicState === 'playing') _wmPlayOnce();
      }, WM_LOOP_GAP_MS);
    });

    function startWelcomeMusic(fromUserGesture = false) {
      if (!musicEnabled) return;
      if (welcomeMusicState === 'playing' || welcomeMusicState === 'starting') {
        // Já iniciada mas pode estar pausada (gap entre loops ou pause de visibility) — retomar imediatamente
        if (wmTrack.paused && !_wmStopRequested) {
          _wmClearTimers();
          wmTrack.currentTime = 0;
          wmTrack.volume = 0.01;
          wmTrack.muted = !fromUserGesture;
          transitionWelcomeMusic('starting');
          wmTrack.play().then(() => {
            if (_wmStopRequested) {
              wmTrack.pause();
              wmTrack.muted = false;
              wmTrack.volume = 0;
              transitionWelcomeMusic('stopped');
              return;
            }
            wmTrack.muted = false;
            transitionWelcomeMusic('playing');
            _wmFadeIn(() => { if (!_wmStopRequested) _wmScheduleFadeOut(); });
          }).catch((err) => {
            wmTrack.muted = false;
            transitionWelcomeMusic('failed');
            console.warn("[AudioFSM] startWelcomeMusic (resume) failed:", err);
          });
        }
        return;
      }
      _wmStopRequested = false;
      transitionWelcomeMusic('starting');
      wmTrack.volume = 0;
      wmTrack.muted = !fromUserGesture; // muted-first apenas se não for gesto do usuário
      if (wmTrack.readyState >= 1) wmTrack.currentTime = 0;
      wmTrack.play().then(() => {
        if (_wmStopRequested) {
          wmTrack.pause();
          wmTrack.muted = false;
          wmTrack.volume = 0;
          transitionWelcomeMusic('stopped');
          return;
        }
        wmTrack.muted = false;
        wmTrack.volume = 0.01;
        transitionWelcomeMusic('playing');
        _wmFadeIn(() => { if (!_wmStopRequested) _wmScheduleFadeOut(); });
      }).catch((err) => {
        wmTrack.muted = false;
        transitionWelcomeMusic('failed');
        console.warn("[AudioFSM] startWelcomeMusic failed:", err);
      });
    }

    function stopWelcomeMusic(withFade, onComplete) {
      _wmStopRequested = true;   // cancela qualquer play() pendente antes de tudo
      _wmClearTimers();
      if (welcomeMusicState !== 'playing' && welcomeMusicState !== 'starting' && wmTrack.paused) {
        transitionWelcomeMusic('stopped');
        if (onComplete) onComplete();
        return;
      }
      wmTrack.muted = false; // garantir desmutado ao parar
      if (!withFade) {
        wmTrack.pause();
        wmTrack.currentTime = 0;
        wmTrack.volume = 0;
        transitionWelcomeMusic('stopped');
        if (onComplete) onComplete();
        return;
      }
      // Fade-out suave — time-based, rAF
      const startVol = wmTrack.volume;
      const t0 = performance.now();
      let rafId;
      function _tick() {
        const t = Math.min(1, (performance.now() - t0) / WM_FADEOUT_MS);
        wmTrack.volume = Math.max(0, startVol * (1 - t));
        if (t >= 1) {
          _wmFadeInterval = null;
          wmTrack.pause();
          wmTrack.currentTime = 0;
          wmTrack.volume = 0;
          transitionWelcomeMusic('stopped');
          if (onComplete) onComplete();
        } else {
          rafId = requestAnimationFrame(_tick);
        }
      }
      rafId = requestAnimationFrame(_tick);
      _wmFadeInterval = { cancel: () => cancelAnimationFrame(rafId) };
    }

    // Background Music - Double-buffer crossfade loop
    const MUSIC_URL = 'assets/sounds/bgmusic.mp3';
    let MUSIC_VOL = 0.14;
    const XFADE_TIME = 1.5; // crossfade equal-power
    
    const bgA = new Audio(MUSIC_URL);
    const bgB = new Audio(MUSIC_URL);
    bgA.volume = MUSIC_VOL; bgB.volume = 0;
    bgA.load(); bgB.load();
    // Fallback: se crossfade não disparar, 'ended' garante o loop
    // _crossfading guard evita que 'ended' e crossfadeTo() toquem simultaneamente (eco)
    bgA.addEventListener('ended', () => { if(musicEnabled && musicStarted && !_crossfading) { bgA.currentTime=0; bgA.muted=true; bgA.play().then(()=>{ bgA.muted=false; bgA.volume=MUSIC_VOL; scheduleXfade(bgA); }).catch(()=>{ bgA.muted=false; }); } });
    bgB.addEventListener('ended', () => { if(musicEnabled && musicStarted && !_crossfading) { bgB.currentTime=0; bgB.muted=true; bgB.play().then(()=>{ bgB.muted=false; bgB.volume=MUSIC_VOL; scheduleXfade(bgB); }).catch(()=>{ bgB.muted=false; }); } });
    
    let soundEnabled = true, musicEnabled = true;
    let sfxVolume = 0.5;
    let musicVolume = 0.14;
    let prevSfxVolume = 0.5;
    let prevMusicVolume = 0.14;

    try {
      soundEnabled = localStorage.getItem('nefroquest-sound') !== 'off';
      musicEnabled = localStorage.getItem('nefroquest-music') !== 'off';
      musicVolume = parseFloat(localStorage.getItem('nefroquest-music-vol') || '0.14');
      sfxVolume = parseFloat(localStorage.getItem('nefroquest-sfx-vol') || '0.5');
      prevMusicVolume = musicVolume;
      prevSfxVolume = sfxVolume;
      MUSIC_VOL = musicVolume;
      WELCOME_MUSIC_VOL = musicVolume * 1.71;
      if (WELCOME_MUSIC_VOL > 1.0) WELCOME_MUSIC_VOL = 1.0;
    } catch(e) {}

    let activeTrack = bgA;
    let xfadeInterval = null;
    let _crossfading = false; // guard contra race condition ended + crossfade simultâneos

    function setMusicVolume(val) {
      musicVolume = val;
      localStorage.setItem('nefroquest-music-vol', val);
      MUSIC_VOL = val;
      WELCOME_MUSIC_VOL = val * 1.71;
      if (WELCOME_MUSIC_VOL > 1.0) WELCOME_MUSIC_VOL = 1.0;

      if (val === 0) {
        musicEnabled = false;
        localStorage.setItem('nefroquest-music', 'off');
      } else {
        musicEnabled = true;
        localStorage.setItem('nefroquest-music', 'on');
      }

      if (bgA) bgA.volume = MUSIC_VOL;
      if (bgB) bgB.volume = MUSIC_VOL;
      if (wmTrack) {
        if (welcomeMusicStarted && !wmTrack.paused) {
          wmTrack.volume = WELCOME_MUSIC_VOL;
        }
      }

      document.querySelectorAll('.volume-slider.music-vol').forEach(s => s.value = val);
      updateAudioIcons();
    }
    window.setMusicVolume = setMusicVolume;

    // Ajustar volumes padrão dos SFX
    Object.values(SFX).forEach(a => { a.load(); a.volume = sfxVolume; });

    function setSfxVolume(val) {
      sfxVolume = val;
      localStorage.setItem('nefroquest-sfx-vol', val);

      if (val === 0) {
        soundEnabled = false;
        localStorage.setItem('nefroquest-sound', 'off');
      } else {
        soundEnabled = true;
        localStorage.setItem('nefroquest-sound', 'on');
      }

      Object.values(SFX).forEach(audio => {
        audio.volume = val;
      });

      document.querySelectorAll('.volume-slider.sfx-vol').forEach(s => s.value = val);
      updateAudioIcons();
    }
    window.setSfxVolume = setSfxVolume;

    function updateAudioIcons() {
      const musicIconText = musicEnabled ? (musicVolume < 0.35 ? '🎵' : '🎶') : '🔇';
      ['musicIcon', 'mobileMusIcon', 'welcomeMusicIcon', 'mobileSoundMusicIcon', 'lndMusicIcon'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = musicIconText;
      });

      const sfxIconText = soundEnabled ? (sfxVolume < 0.35 ? '🔉' : '🔊') : '🔇';
      ['soundIcon', 'welcomeSoundIcon', 'mobileSoundSfxIcon', 'lndSfxIcon'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = sfxIconText;
      });

      ['musicToggle', 'soundToggle', 'mobileMusToggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          if ((id.includes('music') && !musicEnabled) || (id.includes('sound') && !soundEnabled)) {
            el.classList.add('muted');
          } else {
            el.classList.remove('muted');
          }
        }
      });
    }
    window.updateAudioIcons = updateAudioIcons;

    // Audio unlock — iOS Safari requires each HTMLAudioElement to be play()'d during
    // a user gesture before it can be played programmatically (e.g. from timers).
    // We unlock bgB here (bgA is unlocked by startBgMusic which is called from gesture;
    // wmTrack is unlocked by startWelcomeMusic which uses muted-first on gesture).
    let _audioUnlocked = false;
    function _unlockAll() {
      if (_audioUnlocked) return;
      _audioUnlocked = true;
      // Pre-unlock bgB so crossfadeTo() succeeds without user gesture
      bgB.muted = true;
      bgB.play().then(() => { bgB.pause(); bgB.currentTime = 0; bgB.muted = false; }).catch(() => { bgB.muted = false; });
      // Silent AudioContext buffer — unlocks Web Audio and HTMLAudioElement on iOS 13+
      try {
        const _ac = new (window.AudioContext || window.webkitAudioContext)();
        const _buf = _ac.createBuffer(1, 1, 22050);
        const _src = _ac.createBufferSource();
        _src.buffer = _buf; _src.connect(_ac.destination); _src.start(0);
        _ac.resume().finally(() => _ac.close().catch(() => {}));
      } catch(e) {}
    }
    
    function scheduleXfade(track) {
      // Quando faltam XFADE_TIME segundos, iniciar crossfade para o outro track
      if (xfadeInterval) clearInterval(xfadeInterval);
      function _startCheck() {
        const checkInterval = setInterval(() => {
          if (!musicStarted || !musicEnabled) { clearInterval(checkInterval); return; }
          if (!isFinite(track.duration)) return;
          const remaining = track.duration - track.currentTime;
          if (remaining <= XFADE_TIME && remaining > 0) {
            clearInterval(checkInterval);
            crossfadeTo(track === bgA ? bgB : bgA);
          }
        }, 100);
        xfadeInterval = checkInterval;
      }
      if (isFinite(track.duration)) { _startCheck(); }
      else { track.addEventListener('durationchange', function _onDur() { if(isFinite(track.duration)){ track.removeEventListener('durationchange',_onDur); _startCheck(); } }); }
    }
    
    function crossfadeTo(nextTrack) {
      if (_crossfading) return; // previne double-trigger (race condition ended + scheduleXfade)
      _crossfading = true;
      const prevTrack = activeTrack;
      nextTrack.currentTime = 0;
      nextTrack.volume = 0;
      // muted-first: crossfadeTo é chamado de timer, nunca de gesto do usuário
      nextTrack.muted = true;
      transitionBgMusic('starting');
      nextTrack.play().then(() => {
        nextTrack.muted = false;
        transitionBgMusic('playing');
      }).catch((err) => {
        nextTrack.muted = false;
        transitionBgMusic('failed');
        console.warn("[AudioFSM] crossfadeTo play failed:", err);
      });

      // Time-based equal-power crossfade — rAF, imune a throttling de aba inativa
      const XFADE_MS = XFADE_TIME * 1000;
      const t0 = performance.now();
      let rafId;
      function _tick() {
        const t = Math.min(1, (performance.now() - t0) / XFADE_MS);
        prevTrack.volume = MUSIC_VOL * Math.cos(t * Math.PI / 2);
        nextTrack.volume  = MUSIC_VOL * Math.sin(t * Math.PI / 2);
        if (t >= 1) {
          prevTrack.pause();
          prevTrack.currentTime = 0;
          prevTrack.volume = MUSIC_VOL;
          nextTrack.volume = MUSIC_VOL;
          activeTrack = nextTrack;
          _crossfading = false;
          scheduleXfade(nextTrack);
        } else {
          if (bgMusicState === 'playing') {
            rafId = requestAnimationFrame(_tick);
          } else {
            // Cancel crossfade if stopped/paused
            _crossfading = false;
          }
        }
      }
      rafId = requestAnimationFrame(_tick);
    }
    
    function playSound(name) {
      if (!soundEnabled || !SFX[name]) return;
      const s = SFX[name];
      s.currentTime = 0;
      s.play().catch(() => {});
    }
    
    function startBgMusic() {
      if (!musicEnabled || bgMusicState === 'playing' || bgMusicState === 'starting') return;
      activeTrack = bgA;
      bgA.currentTime = 0;
      bgA.volume = 0;
      bgA.muted = true; // muted-first para bypass de autoplay policy
      transitionBgMusic('starting');
      bgA.play().then(() => {
        bgA.muted = false;
        bgA.volume = MUSIC_VOL;
        transitionBgMusic('playing');
        scheduleXfade(bgA);
      }).catch((err) => {
        bgA.muted = false;
        console.warn("[AudioFSM] startBgMusic failed, scheduling retry:", err);
        // Retry único após 800ms — cobre timing de OAuth redirect e focus tardio
        setTimeout(() => {
          if (!musicEnabled || bgMusicState === 'playing' || bgMusicState === 'starting') return;
          bgA.muted = true;
          bgA.play().then(() => {
            bgA.muted = false;
            bgA.volume = MUSIC_VOL;
            transitionBgMusic('playing');
            scheduleXfade(bgA);
          }).catch((err2) => {
            bgA.muted = false;
            transitionBgMusic('failed');
            console.error("[AudioFSM] startBgMusic retry failed:", err2);
            if (typeof _track === 'function') _track('error_bg_music_start_fail', {});
          });
        }, 800);
      });
    }
    
    function stopBgMusic() {
      bgA.pause(); bgB.pause();
      bgA.currentTime = 0; bgB.currentTime = 0;
      if (xfadeInterval) clearInterval(xfadeInterval);
      transitionBgMusic('stopped');
    }
    
    function toggleSound() {
      soundEnabled = !soundEnabled;
      localStorage.setItem('nefroquest-sound', soundEnabled ? 'on' : 'off');
      if (soundEnabled) {
        setSfxVolume(sfxVolume > 0 ? sfxVolume : (prevSfxVolume > 0 ? prevSfxVolume : 0.5));
        playSound('click');
      } else {
        prevSfxVolume = sfxVolume;
        setSfxVolume(0);
      }
    }
    
    function toggleMusic() {
      musicEnabled = !musicEnabled;
      localStorage.setItem('nefroquest-music', musicEnabled ? 'on' : 'off');
      if (musicEnabled) {
        setMusicVolume(musicVolume > 0 ? musicVolume : (prevMusicVolume > 0 ? prevMusicVolume : 0.14));
        const ws = document.getElementById('welcomeScreen');
        if (ws && !ws.classList.contains('hidden')) {
          startWelcomeMusic(true);
        } else {
          startBgMusic();
        }
      } else {
        prevMusicVolume = musicVolume;
        setMusicVolume(0);
        stopWelcomeMusic(false);
        stopBgMusic();
      }
    }
    
    // Ouvinte para os sliders de volume analógico
    document.addEventListener('input', function(e) {
      const target = e.target;
      if (target && target.classList.contains('volume-slider')) {
        const val = parseFloat(target.value);
        if (target.classList.contains('music-vol')) {
          setMusicVolume(val);
        } else if (target.classList.contains('sfx-vol')) {
          setSfxVolume(val);
        }
      }
    });

    // Initialize sound/music UI
    (function() {
      // Sincronizar sliders no carregamento inicial
      document.querySelectorAll('.volume-slider.music-vol').forEach(s => s.value = musicEnabled ? musicVolume : 0);
      document.querySelectorAll('.volume-slider.sfx-vol').forEach(s => s.value = soundEnabled ? sfxVolume : 0);

      updateAudioIcons();

      // Iniciar música automaticamente ao carregar a página
      if (musicEnabled) {
        startWelcomeMusic();

        // Fallback se ainda estiver carregando
        if (wmTrack.readyState < 2) {
          const _onPlayable = () => {
            if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
          };
          wmTrack.addEventListener('canplay', _onPlayable, { once: true });
          wmTrack.addEventListener('canplaythrough', _onPlayable, { once: true });
        }
        // Fallback para browsers que bloqueiam autoplay: retenta no primeiro gesto até sucesso.
        // Remove-se automaticamente após desbloquear para não processar todos os cliques.
        function _tryWelcomeMusic() {
          _unlockAll();
          if (!musicEnabled) return;
          const ws = document.getElementById('welcomeScreen');
          if (ws && ws.classList.contains('hidden')) {
            // Jogo já iniciado — listeners não são mais necessários
            document.removeEventListener('touchstart', _tryWelcomeMusic, { capture: true });
            document.removeEventListener('click',      _tryWelcomeMusic, { capture: true });
            return;
          }
          // Se a track está pausada apesar de "started", reset para permitir novo start
          if (welcomeMusicState === 'playing' && wmTrack.paused && !_wmStopRequested) {
            _wmClearTimers();
            transitionWelcomeMusic('paused');
          }
          if (welcomeMusicState === 'playing' && !wmTrack.paused) {
            // Música tocando com sucesso — remove listeners
            document.removeEventListener('touchstart', _tryWelcomeMusic, { capture: true });
            document.removeEventListener('click',      _tryWelcomeMusic, { capture: true });
            return;
          }
          startWelcomeMusic(true);
        }
        document.addEventListener('touchstart', _tryWelcomeMusic, { capture: true, passive: true });
        document.addEventListener('click',      _tryWelcomeMusic, { capture: true });
      }

      // Retoma música quando a aba volta ao foco (tab switch, OAuth popup, etc.)
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState !== 'visible') return;
        // Welcome music
        if (welcomeMusicState === 'playing' && wmTrack.paused && !_wmStopRequested && musicEnabled) {
          wmTrack.muted = true;
          transitionWelcomeMusic('starting');
          wmTrack.play().then(function() {
            wmTrack.muted = false;
            transitionWelcomeMusic('playing');
          }).catch(function(err) {
            wmTrack.muted = false;
            transitionWelcomeMusic('failed');
            console.warn("[AudioFSM] welcome music visibility resume failed:", err);
          });
        }
        // Background music
        if (bgMusicState === 'playing' && musicEnabled && activeTrack && activeTrack.paused) {
          activeTrack.muted = true;
          transitionBgMusic('starting');
          activeTrack.play().then(function() {
            activeTrack.muted = false;
            activeTrack.volume = MUSIC_VOL;
            transitionBgMusic('playing');
          }).catch(function(err) {
            activeTrack.muted = false;
            transitionBgMusic('failed');
            console.warn("[AudioFSM] bg music visibility resume failed:", err);
          });
        }
      });
    })();
