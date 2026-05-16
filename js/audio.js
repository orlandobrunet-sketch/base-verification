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
    const WELCOME_MUSIC_VOL = 0.30;
    const WM_FADEIN_MS   = 3500;  // fade-in de 3.5 segundos — sobe suavemente
    const WM_FADEOUT_MS  = 4000;  // fade-out de 4 segundos antes do fim
    const WM_LOOP_GAP_MS = 800;   // pausa mínima entre loops após fade-out

    const wmTrack = new Audio();
    wmTrack.preload = 'auto';  // pré-carrega para evitar delay ao iniciar
    wmTrack.loop = false;
    wmTrack.volume = 0;        // volume 0 antes de qualquer coisa
    wmTrack.src = WELCOME_MUSIC_URL; // src após volume=0 para garantir ordem
    wmTrack.load();            // força início do carregamento (como bgA.load())

    let welcomeMusicStarted = false;
    let _wmFadeInterval = null;
    let _wmFadeOutInterval = null;
    let _wmLoopTimeout = null;
    let _wmFadeOutTimeout = null;
    let _wmStopRequested = false;

    function _wmClearTimers() {
      if (_wmFadeInterval)    { if (_wmFadeInterval.cancel) _wmFadeInterval.cancel(); else clearInterval(_wmFadeInterval); _wmFadeInterval = null; }
      if (_wmFadeOutInterval) { clearInterval(_wmFadeOutInterval); _wmFadeOutInterval = null; }
      if (_wmLoopTimeout)     { clearTimeout(_wmLoopTimeout);      _wmLoopTimeout = null; }
      if (_wmFadeOutTimeout)  { clearTimeout(_wmFadeOutTimeout);   _wmFadeOutTimeout = null; }
    }

    // Fade-in suave usando curva ease-out (raiz quadrada) para soar natural
    // Usa setInterval em vez de requestAnimationFrame — RAF pode ser throttled em páginas
    // recém-carregadas via redirect OAuth (Brave PC), causando o áudio "congelar".
    function _wmFadeIn(onDone) {
      wmTrack.volume = 0.01;
      const steps = Math.round(WM_FADEIN_MS / 30);
      let step = 0;
      const iv = setInterval(() => {
        if (_wmStopRequested) { clearInterval(iv); _wmFadeInterval = null; return; }
        step++;
        const t = Math.min(1, step / steps);
        wmTrack.volume = WELCOME_MUSIC_VOL * Math.sqrt(t);
        if (step >= steps) {
          clearInterval(iv);
          wmTrack.volume = WELCOME_MUSIC_VOL;
          _wmFadeInterval = null;
          if (onDone) onDone();
        }
      }, 30);
      _wmFadeInterval = { cancel: () => clearInterval(iv) };
    }

    // Fade-out suave usando curva ease-in (quadrática) para soar natural
    function _wmFadeOut(onDone) {
      const startVol = wmTrack.volume;
      const steps = Math.round(WM_FADEOUT_MS / 30);
      let step = 0;
      _wmFadeOutInterval = setInterval(() => {
        if (_wmStopRequested) {
          clearInterval(_wmFadeOutInterval); _wmFadeOutInterval = null;
          wmTrack.volume = 0; wmTrack.pause();
          return;
        }
        step++;
        const t = step / steps;
        wmTrack.volume = Math.max(0, startVol * (1 - t * t));
        if (step >= steps) {
          clearInterval(_wmFadeOutInterval); _wmFadeOutInterval = null;
          wmTrack.volume = 0;
          wmTrack.pause();
          if (onDone) onDone();
        }
      }, 30);
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
      wmTrack.play().then(() => {
        if (_wmStopRequested) { wmTrack.pause(); wmTrack.muted = false; return; }
        wmTrack.muted = false;
        _wmFadeIn(() => {
          if (!_wmStopRequested) _wmScheduleFadeOut();
        });
      }).catch(() => { wmTrack.muted = false; });
    }

    // Evento 'ended' como safety net (caso o fade-out não tenha pausado a tempo)
    wmTrack.addEventListener('ended', () => {
      if (_wmStopRequested || !welcomeMusicStarted) return;
      _wmClearTimers();
      _wmLoopTimeout = setTimeout(() => {
        if (!_wmStopRequested && welcomeMusicStarted) _wmPlayOnce();
      }, WM_LOOP_GAP_MS);
    });

    function startWelcomeMusic() {
      if (!musicEnabled) return;
      if (welcomeMusicStarted) {
        // Já iniciada mas pode estar pausada (gap entre loops) — retomar imediatamente
        if (wmTrack.paused && !_wmStopRequested) {
          _wmClearTimers();
          wmTrack.currentTime = 0;
          wmTrack.volume = 0.01;
          wmTrack.muted = true;
          wmTrack.play().then(() => {
            wmTrack.muted = false;
            _wmFadeIn(() => { if (!_wmStopRequested) _wmScheduleFadeOut(); });
          }).catch(() => { wmTrack.muted = false; });
        }
        return;
      }
      _wmStopRequested = false;
      welcomeMusicStarted = true; // marca antes do play() para bloquear re-entradas
      wmTrack.volume = 0;
      wmTrack.muted = true; // muted-first: browsers allow muted autoplay (bypass autoplay policy pós-redirect)
      if (wmTrack.readyState >= 1) wmTrack.currentTime = 0;
      wmTrack.play().then(() => {
        if (_wmStopRequested) { wmTrack.pause(); wmTrack.muted = false; wmTrack.volume = 0; welcomeMusicStarted = false; return; }
        wmTrack.muted = false;
        wmTrack.volume = 0.01;
        _wmFadeIn(() => { if (!_wmStopRequested) _wmScheduleFadeOut(); });
      }).catch(() => { wmTrack.muted = false; welcomeMusicStarted = false; }); // libera retry apenas se bloqueado
    }

    function stopWelcomeMusic(withFade, onComplete) {
      _wmStopRequested = true;   // cancela qualquer play() pendente antes de tudo
      _wmClearTimers();
      if (!welcomeMusicStarted && wmTrack.paused) { if (onComplete) onComplete(); return; }
      wmTrack.muted = false; // garantir desmutado ao parar
      if (!withFade) {
        wmTrack.pause();
        wmTrack.currentTime = 0;
        wmTrack.volume = 0;
        welcomeMusicStarted = false;
        if (onComplete) onComplete();
        return;
      }
      // Fade-out suave
      const startVol = wmTrack.volume;
      const steps = Math.round(WM_FADEOUT_MS / 50);
      let step = 0;
      _wmFadeInterval = setInterval(() => {
        step++;
        wmTrack.volume = Math.max(0, startVol * (1 - step / steps));
        if (step >= steps) {
          clearInterval(_wmFadeInterval); _wmFadeInterval = null;
          wmTrack.pause();
          wmTrack.currentTime = 0;
          wmTrack.volume = 0;
          welcomeMusicStarted = false;
          if (onComplete) onComplete();
        }
      }, 50);
    }

    // Background Music - Double-buffer crossfade loop
    const MUSIC_URL = 'assets/sounds/bgmusic.mp3';
    const MUSIC_VOL = 0.14;
    const XFADE_TIME = 1.5; // crossfade equal-power
    
    const bgA = new Audio(MUSIC_URL);
    const bgB = new Audio(MUSIC_URL);
    bgA.volume = MUSIC_VOL; bgB.volume = 0;
    bgA.load(); bgB.load();
    // Fallback: se crossfade não disparar, 'ended' garante o loop
    bgA.addEventListener('ended', () => { if(musicEnabled && musicStarted) { bgA.currentTime=0; bgA.muted=true; bgA.play().then(()=>{ bgA.muted=false; bgA.volume=MUSIC_VOL; scheduleXfade(bgA); }).catch(()=>{ bgA.muted=false; }); } });
    bgB.addEventListener('ended', () => { if(musicEnabled && musicStarted) { bgB.currentTime=0; bgB.muted=true; bgB.play().then(()=>{ bgB.muted=false; bgB.volume=MUSIC_VOL; scheduleXfade(bgB); }).catch(()=>{ bgB.muted=false; }); } });
    
    let soundEnabled = true, musicEnabled = true;
    try { soundEnabled = localStorage.getItem('nefroquest-sound') !== 'off'; musicEnabled = localStorage.getItem('nefroquest-music') !== 'off'; } catch(e) {}
    let musicStarted = false;
    let activeTrack = bgA;
    let xfadeInterval = null;

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
        _ac.resume().then(() => _ac.close()).catch(() => {});
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
      const prevTrack = activeTrack;
      nextTrack.currentTime = 0;
      nextTrack.volume = 0;
      // muted-first: crossfadeTo is called from a timer, never from a user gesture
      nextTrack.muted = true;
      nextTrack.play().then(() => { nextTrack.muted = false; }).catch(() => { nextTrack.muted = false; });
      
      const steps = 30;
      const stepTime = Math.round((XFADE_TIME * 1000) / steps); // ms por passo de fade
      let step = 0;
      
      const fadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        // Equal-power crossfade
        prevTrack.volume = MUSIC_VOL * Math.cos(progress * Math.PI / 2);
        nextTrack.volume = MUSIC_VOL * Math.sin(progress * Math.PI / 2);
        
        if (step >= steps) {
          clearInterval(fadeInterval);
          prevTrack.pause();
          prevTrack.currentTime = 0;
          prevTrack.volume = MUSIC_VOL;
          nextTrack.volume = MUSIC_VOL;
          activeTrack = nextTrack;
          scheduleXfade(nextTrack);
        }
      }, stepTime);
    }
    
    function playSound(name) {
      if (!soundEnabled || !SFX[name]) return;
      const s = SFX[name];
      s.currentTime = 0;
      s.play().catch(() => {});
    }
    
    function startBgMusic() {
      if (!musicEnabled || musicStarted) return;
      activeTrack = bgA;
      bgA.currentTime = 0;
      bgA.volume = 0;
      bgA.muted = true; // muted-first para bypass de autoplay policy
      bgA.play().then(() => {
        bgA.muted = false;
        bgA.volume = MUSIC_VOL;
        musicStarted = true;
        scheduleXfade(bgA);
      }).catch(() => { bgA.muted = false; });
    }
    
    function stopBgMusic() {
      bgA.pause(); bgB.pause();
      bgA.currentTime = 0; bgB.currentTime = 0;
      if (xfadeInterval) clearInterval(xfadeInterval);
      musicStarted = false;
    }
    
    function toggleSound() {
      soundEnabled = !soundEnabled;
      localStorage.setItem('nefroquest-sound', soundEnabled ? 'on' : 'off');
      const icon = document.getElementById('soundIcon');
      const wIcon = document.getElementById('welcomeSoundIcon');
      const mSfxIcon = document.getElementById('mobileSoundSfxIcon');
      const label = document.getElementById('soundLabel');
      const toggle = document.getElementById('soundToggle');
      if (soundEnabled) {
        if(icon) icon.textContent = '🔊'; if(label) label.textContent = 'SFX'; if(toggle) toggle.classList.remove('muted');
        if(wIcon) wIcon.textContent = '🔊';
        if(mSfxIcon) mSfxIcon.textContent = '🔊';
        playSound('click');
      } else {
        if(icon) icon.textContent = '🔇'; if(label) label.textContent = 'Mudo'; if(toggle) toggle.classList.add('muted');
        if(wIcon) wIcon.textContent = '🔇';
        if(mSfxIcon) mSfxIcon.textContent = '🔇';
      }
    }
    
    function toggleMusic() {
      musicEnabled = !musicEnabled;
      localStorage.setItem('nefroquest-music', musicEnabled ? 'on' : 'off');
      const icon = document.getElementById('musicIcon');
      const label = document.getElementById('musicLabel');
      const toggle = document.getElementById('musicToggle');
      const mobileIcon = document.getElementById('mobileMusIcon');
      const wMusicIcon = document.getElementById('welcomeMusicIcon');
      const mMusicIcon = document.getElementById('mobileSoundMusicIcon');
      if (musicEnabled) {
        if(icon) icon.textContent = '🎵'; if(label) label.textContent = 'Música'; if(toggle) toggle.classList.remove('muted');
        if(mobileIcon) mobileIcon.textContent = '🎵';
        if(wMusicIcon) wMusicIcon.textContent = '🎵';
        if(mMusicIcon) mMusicIcon.textContent = '🎵';
        // Tocar música correta conforme a tela ativa
        const ws = document.getElementById('welcomeScreen');
        if (ws && !ws.classList.contains('hidden')) {
          startWelcomeMusic();
        } else {
          startBgMusic();
        }
      } else {
        if(icon) icon.textContent = '🔇'; if(label) label.textContent = 'Mudo'; if(toggle) toggle.classList.add('muted');
        if(mobileIcon) mobileIcon.textContent = '🔇';
        if(wMusicIcon) wMusicIcon.textContent = '🔇';
        if(mMusicIcon) mMusicIcon.textContent = '🔇';
        stopWelcomeMusic(false);
        stopBgMusic();
      }
    }
    
    // Initialize sound/music UI
    (function() {
      if (!soundEnabled) {
        const icon = document.getElementById('soundIcon');
        const wSoundIcon = document.getElementById('welcomeSoundIcon');
        const mSfxIcon = document.getElementById('mobileSoundSfxIcon');
        const label = document.getElementById('soundLabel');
        const toggle = document.getElementById('soundToggle');
        if (icon) icon.textContent = '🔇';
        if (wSoundIcon) wSoundIcon.textContent = '🔇';
        if (mSfxIcon) mSfxIcon.textContent = '🔇';
        if (label) label.textContent = 'Mudo';
        if (toggle) toggle.classList.add('muted');
      }
      if (!musicEnabled) {
        const icon = document.getElementById('musicIcon');
        const wMusicIcon = document.getElementById('welcomeMusicIcon');
        const mMusicIcon = document.getElementById('mobileSoundMusicIcon');
        const label = document.getElementById('musicLabel');
        const toggle = document.getElementById('musicToggle');
        const mobileIcon = document.getElementById('mobileMusIcon');
        if (icon) icon.textContent = '🔇';
        if (wMusicIcon) wMusicIcon.textContent = '🔇';
        if (mMusicIcon) mMusicIcon.textContent = '🔇';
        if (label) label.textContent = 'Mudo';
        if (toggle) toggle.classList.add('muted');
        if (mobileIcon) mobileIcon.textContent = '🔇';
      }

      // Iniciar música automaticamente ao carregar a página
      // Aguarda áudio estar carregado para evitar AbortError
      if (musicEnabled) {
        if (wmTrack.readyState >= 4) {
          startWelcomeMusic();
        } else {
          wmTrack.addEventListener('canplaythrough', function() {
            if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
          }, { once: true });
        }
        // Fallback para browsers que bloqueiam autoplay: retenta em cada gesto até sucesso.
        // { once: true } foi removido intencionalmente — se play() falhar na 1ª gesture (iOS),
        // o próximo gesto do usuário tenta de novo. A guard de welcomeScreen.hidden impede
        // re-trigger depois que o jogo começou e stopWelcomeMusic() zerou welcomeMusicStarted.
        function _tryWelcomeMusic() {
          _unlockAll();
          if (!musicEnabled || welcomeMusicStarted) return;
          const ws = document.getElementById('welcomeScreen');
          if (ws && ws.classList.contains('hidden')) return; // jogo já iniciado
          startWelcomeMusic();
        }
        document.addEventListener('touchstart', _tryWelcomeMusic, { capture: true, passive: true });
        document.addEventListener('click',      _tryWelcomeMusic, { capture: true });
      }

      // Retoma música quando a aba volta ao foco (tab switch, OAuth popup, etc.)
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState !== 'visible') return;
        // Welcome music
        if (welcomeMusicStarted && wmTrack.paused && !_wmStopRequested && musicEnabled) {
          wmTrack.muted = true;
          wmTrack.play().then(function() {
            wmTrack.muted = false;
          }).catch(function() { wmTrack.muted = false; });
        }
        // Background music
        if (musicStarted && musicEnabled && activeTrack && activeTrack.paused) {
          activeTrack.muted = true;
          activeTrack.play().then(function() {
            activeTrack.muted = false;
            activeTrack.volume = MUSIC_VOL;
          }).catch(function() { activeTrack.muted = false; });
        }
      });
    })();
