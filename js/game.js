    // Create floating particles
    (function(){
      const c=document.getElementById('particles');
      for(let i=0;i<20;i++){
        const p=document.createElement('div');
        p.className='particle';
        p.style.left=Math.random()*100+'%';
        p.style.top=Math.random()*100+'%';
        p.style.animationDelay=Math.random()*4+'s';
        p.style.animationDuration=(3+Math.random()*4)+'s';
        c.appendChild(p);
      }
    })();

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
    function _wmFadeIn(onDone) {
      wmTrack.volume = 0.01;
      const startTime = performance.now();
      let rafId = null;
      function tick(now) {
        if (_wmStopRequested) { if (rafId) cancelAnimationFrame(rafId); _wmFadeInterval = null; return; }
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / WM_FADEIN_MS);
        // curva ease-out sqrt: sobe rápido no início, desacelera no fim
        wmTrack.volume = WELCOME_MUSIC_VOL * Math.sqrt(t);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
          _wmFadeInterval = { cancel: () => cancelAnimationFrame(rafId) };
        } else {
          wmTrack.volume = WELCOME_MUSIC_VOL;
          _wmFadeInterval = null;
          if (onDone) onDone();
        }
      }
      rafId = requestAnimationFrame(tick);
      _wmFadeInterval = { cancel: () => cancelAnimationFrame(rafId) };
    }

    // Fade-out suave usando curva ease-in (quadrática) para soar natural
    function _wmFadeOut(onDone) {
      const startVol = wmTrack.volume;
      const steps = Math.round(WM_FADEOUT_MS / 30);
      let step = 0;
      _wmFadeOutInterval = setInterval(() => {
        step++;
        const t = step / steps;
        // curva ease-in: desce devagar no início, acelera no fim
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
      wmTrack.muted = false;
      wmTrack.play().then(() => {
        if (_wmStopRequested) { wmTrack.pause(); return; }
        _wmFadeIn(() => {
          if (!_wmStopRequested) _wmScheduleFadeOut();
        });
      }).catch(() => {});
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
      if (!musicEnabled || welcomeMusicStarted) return;
      _wmStopRequested = false;
      wmTrack.volume = 0.01;
      wmTrack.muted = false;
      if (wmTrack.readyState >= 1) wmTrack.currentTime = 0;
      wmTrack.play().then(() => {
        welcomeMusicStarted = true;
        _wmFadeIn(() => { if (!_wmStopRequested) _wmScheduleFadeOut(); });
      }).catch(() => {});
    }

    function stopWelcomeMusic(withFade, onComplete) {
      if (!welcomeMusicStarted) { if (onComplete) onComplete(); return; }
      _wmStopRequested = true;
      _wmClearTimers();
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
    const MUSIC_URL = 'assets/sounds/bgmusic.mp3?v=2';
    const MUSIC_VOL = 0.14;
    const XFADE_TIME = 1.5; // crossfade equal-power
    
    const bgA = new Audio(MUSIC_URL);
    const bgB = new Audio(MUSIC_URL);
    bgA.volume = MUSIC_VOL; bgB.volume = 0;
    bgA.load(); bgB.load();
    // Fallback: se crossfade não disparar, 'ended' garante o loop
    bgA.addEventListener('ended', () => { if(musicEnabled && musicStarted) { bgA.currentTime=0; bgA.play().catch(()=>{}); scheduleXfade(bgA); } });
    bgB.addEventListener('ended', () => { if(musicEnabled && musicStarted) { bgB.currentTime=0; bgB.play().catch(()=>{}); scheduleXfade(bgB); } });
    
    let soundEnabled = localStorage.getItem('nefroquest-sound') !== 'off';
    let musicEnabled = localStorage.getItem('nefroquest-music') !== 'off';
    let musicStarted = false;
    let activeTrack = bgA;
    let xfadeInterval = null;
    
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
      nextTrack.play().catch(() => {});
      
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
      bgA.volume = MUSIC_VOL;
      bgA.play().then(() => {
        musicStarted = true;
        scheduleXfade(bgA);
      }).catch(() => {});
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
      }
    })();

    // ============ SISTEMA DE STREAK MULTIPLICADOR ============
    function getStreakMultiplier(streak) {
      if (streak >= 15) return { mult: 2.5, label: 'x2.5', css: 'streak-x5', fire: '🔥🔥🔥' };
      if (streak >= 10) return { mult: 2.0, label: 'x2', css: 'streak-x4', fire: '🔥🔥' };
      if (streak >= 7) return { mult: 1.75, label: 'x1.75', css: 'streak-x3', fire: '🔥' };
      if (streak >= 5) return { mult: 1.5, label: 'x1.5', css: 'streak-x2', fire: '🔥' };
      if (streak >= 3) return { mult: 1.25, label: 'x1.25', css: 'streak-x2', fire: '' };
      return { mult: 1, label: '', css: '', fire: '' };
    }
    

    // ============ SISTEMA DE BADGES ============
    const BADGES = [
      {id: 1, name: 'Vórtice do Néfron', required: 20},
      {id: 2, name: 'Sábio do Microscópio', required: 40},
      {id: 3, name: 'Guardião das Águas', required: 60},
      {id: 4, name: 'Árbitro dos Rins', required: 80},
      {id: 5, name: 'Ascendido do NefroQuest', required: 100}
    ];
    
    function updateBadges() {
      BADGES.forEach(badge => {
        const slot = document.querySelector(`.badge-slot[data-badge="${badge.id}"]`);
        if (!slot) return;
        if (state.correctTotal >= badge.required) {
          if (!slot.classList.contains('unlocked')) {
            slot.classList.add('unlocked');
            log(`🏆 Badge desbloqueado: ${badge.name}!`);
            playSound('chest');
          }
        }
      });
    }
    
    // ── Analytics ────────────────────────────────────────────────────────────
    // Wrapper sobre gtag (GA4). Adicione outros destinos aqui se necessário.
    // Funil principal: game_started → question_answered → boss_entered
    //                  → game_completed / paywall_shown → premium_converted
    function _track(event, params = {}) {
      try {
        if (typeof gtag === 'function') {
          gtag('event', event, params);
        }
        // Descomente para debug local:
        // console.debug('[analytics]', event, params);
      } catch(e) { /* silencia erros de analytics */ }
    }
    // ─────────────────────────────────────────────────────────────────────────

    function checkGameCompletion() {
      if (state.correctTotal >= 100 && !state.gameCompleted) {
        state.gameCompleted = true;
        localStorage.setItem('nefroquest-arqui-defeated', '1');
        if (state.difficulty === 'hardcore') {
          localStorage.setItem('nefroquest-hardcore-completed', '1');
        }
        _track('game_completed', { difficulty: state.difficulty, level: state.level, score: state.score });
        checkAchievements();
        showGameCompletionModal();
      }
    }
    
    function showGameCompletionModal() {
      const modal = document.createElement('div');
      modal.className = 'modal show';
      modal.id = 'victoryModal';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(8px);overflow-y:auto;padding:32px 16px;';
      modal.innerHTML = `
        <div style="max-width:600px;width:100%;text-align:center;position:relative;">
          <img src="assets/victory.jpg" alt="Vitória" style="width:100%;border-radius:16px;border:3px solid var(--gold);box-shadow:0 0 40px rgba(218,165,32,0.5);margin-bottom:20px;">
          <div style="background:linear-gradient(180deg,rgba(18,25,46,0.95),rgba(11,20,40,0.98));border:2px solid var(--gold);border-radius:14px;padding:24px;margin-top:-30px;position:relative;z-index:2;">
            <h2 style="color:var(--gold);font-size:1.8rem;margin-bottom:8px;text-shadow:0 0 20px rgba(218,165,32,0.5);">PARABÉNS, HERÓI!</h2>
            <p style="color:#e2c97e;font-size:1rem;margin-bottom:16px;">Você purificou o Reino e venceu o NefroQuest!</p>
            <div style="display:flex;justify-content:center;gap:20px;margin-bottom:20px;flex-wrap:wrap;">
              <div style="background:rgba(218,165,32,0.15);border:1px solid rgba(218,165,32,0.3);border-radius:10px;padding:12px 18px;">
                <div style="font-size:1.4rem;font-weight:700;color:var(--gold);">${state.score}</div>
                <div style="font-size:0.7rem;color:var(--txt-dim);text-transform:uppercase;">Pontos</div>
              </div>
              <div style="background:rgba(218,165,32,0.15);border:1px solid rgba(218,165,32,0.3);border-radius:10px;padding:12px 18px;">
                <div style="font-size:1.4rem;font-weight:700;color:var(--gold);">${state.level}</div>
                <div style="font-size:0.7rem;color:var(--txt-dim);text-transform:uppercase;">Nível</div>
              </div>
              <div style="background:rgba(218,165,32,0.15);border:1px solid rgba(218,165,32,0.3);border-radius:10px;padding:12px 18px;">
                <div style="font-size:1.4rem;font-weight:700;color:var(--gold);">100</div>
                <div style="font-size:0.7rem;color:var(--txt-dim);text-transform:uppercase;">Acertos</div>
              </div>
              <div style="background:rgba(218,165,32,0.15);border:1px solid rgba(218,165,32,0.3);border-radius:10px;padding:12px 18px;">
                <div style="font-size:1.4rem;font-weight:700;color:var(--gold);">${state.gold}</div>
                <div style="font-size:0.7rem;color:var(--txt-dim);text-transform:uppercase;">Ouro</div>
              </div>
            </div>
            <p style="color:var(--txt-dim);font-size:0.85rem;margin-bottom:20px;">Você recebeu o <strong style="color:var(--gold);">Título de Campeão</strong>! Este badge ficará visível no Leaderboard.</p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
              <button class="btn sec" data-action="continueAfterCompletion" style="flex:1;min-width:120px;">Continuar Jogando</button>
              <button class="btn gold" data-action="finishGameCompletely" style="flex:1;min-width:120px;">Encerrar Jornada</button>
              <button class="btn sec" data-action="shareVictory" data-pass-this="1" style="flex:1;min-width:120px;background:linear-gradient(180deg,#3b82f6,#2563eb);border-color:#1d4ed8;color:#fff;">📤 Compartilhar</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('victory');
    }

    function shareVictory(btn) {
      const text = `🏆 Completei o NefroQuest: Ascension!\n\n✅ 100 questões de nefrologia respondidas\n📊 ${state.score} pontos · Nível ${state.level}\n🎮 Derrotei o Arqui-Nefromante!\n\nTeste seus conhecimentos: https://nefroquest.com`;
      if (navigator.share) {
        navigator.share({ title: 'NefroQuest: Ascension - Vitória!', text: text, url: 'https://nefroquest.com' }).catch(()=>{});
      } else {
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✅ Copiado!';
          setTimeout(() => { btn.textContent = '📤 Compartilhar'; }, 2000);
        }).catch(() => {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        });
      }
    }
    
    function finishGameCompletely() {
      state.completedGame = true;
      saveGame();
      document.querySelector('.modal.show')?.remove();
      finishGame();
    }
    
    function continueAfterCompletion() {
      state.completedGame = true;
      document.getElementById('victoryModal')?.remove();
      document.querySelector('.modal.show')?.remove();
      log('🏆 Campeão! Você continua sua jornada lendária!');
      renderHUD();
      saveGame();
    }

    // ============ SISTEMA DE VIDA EXTRA ============
    function checkExtraLife() {
      // Ganha vida extra a cada 5 níveis (5, 10, 15, 20...)
      if (state.level % 5 === 0 && state.lives < (state.maxLives || 3) && !state.extraLifeGiven) {
        state.lives++;
        state.extraLifeGiven = true;
        showExtraLifeModal();
      } else if (state.level % 5 !== 0) {
        state.extraLifeGiven = false;
      }
    }
    
    function showExtraLifeModal() {
      const modal = document.createElement('div');
      modal.className = 'modal show';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(6px);padding:32px 16px;overflow-y:auto;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;max-height:88vh;overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;">
          <h2 style="color:var(--ok);margin-bottom:16px;">💚 VIDA EXTRA! 💚</h2>
          <p style="font-size:1.05rem;line-height:1.6;margin-bottom:20px;">
            Os Deuses do Néfron reconhecem sua dedicação!<br>
            <strong>Você ganhou +1 vida!</strong>
          </p>
          <p style="color:var(--txt-dim);margin-bottom:24px;">
            Continue sua jornada com renovada energia e sabedoria.
          </p>
          <button class="btn gold" data-close-closest=".modal">Continuar</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('levelup');
    }

    // ============ POPUP DE EVOLUÇÃO DO PERSONAGEM ============
    function showEvolutionPopup(newLevel, newTitle, newImage) {
      // Remover popup anterior se existir
      document.querySelectorAll('.evolution-popup').forEach(el => el.remove());
      const evolutionTexts = {
        2: "A jornada começa a revelar seus segredos. Seus olhos enxergam o que antes era invisível.",
        3: "Suas células começam a brilhar com conhecimento. Você sente o poder da filtração fluindo em suas veias!",
        4: "Cada questão respondida forja sua mente. O Reino Sombrio do Néfron recua diante de sua luz.",
        5: "Os néfrons reconhecem sua maestria! Você transcende para um novo patamar de sabedoria renal.",
        6: "O equilíbrio ácido-base se dobra à sua vontade. Você é mais do que um estudante — é um guardador.",
        7: "As forças da homeostase se curvam diante de você. Seu domínio sobre o equilíbrio é inegável!",
        8: "Os Glomérulos Antigos reconhecem seu poder. Você penetra nos mistérios das glomerulopatias.",
        9: "Sua aura de conhecimento renal irradia por todo o reino. Pacientes e colegas buscam sua sabedoria.",
        10: "Você alcança a harmonia perfeita entre reabsorção e secreção. Os Deuses do Néfron sorriem para você!",
        11: "As trevas da DRC avançada recuam. Você domina diálise, transplante e as fronteiras da nefroproteção.",
        12: "Seu conhecimento sobre diálise e transplante é incomparável. Você é uma lenda viva!",
        13: "O Arqui-Nefromante sente sua presença. Cada resposta correta enfraquece suas defesas.",
        14: "Você está à beira da transcendência. O poder da homeostase absoluta pulsa em suas mãos.",
        15: "O Arqui-Nefromante treme! Você está pronto para o confronto final. Sua ascensão está completa!"
      };
      
      // Narrativas de lore específicas por personagem
      const loreNarratives = {
        2: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os primeiros ritos do Néfron foram superados. Você começa a ver padrões onde outros veem caos.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As primeiras ondas do saber te envolvem. Sua sensibilidade para o equilíbrio hídrico desperta.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os primeiros dados se organizam em sua mente. O método científico começa a guiar seus passos.</em>'
        },
        3: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os antigos pergaminhos se revelam... Você agora compreende os segredos da filtração glomerular.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas ancestrais sussurram seu nome... Você domina os mistérios da homeostase hídrica.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os dados se alinham perfeitamente... Sua mente científica alcança novos horizontes.</em>'
        },
        4: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As Cripta da Creatinina revelou seus segredos. Você avance para os domínios da proteinúria e da lesão tubular.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os rios do sódio e potássio obedecem à sua voz. Você é guaraniã das correntes vitais.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus modelos preditivos começam a ganhar precisão. A ciência renal curva-se à sua mente analítica.</em>'
        },
        5: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Conselho dos Néfrons reconhece sua dedicação. Você é digno de portar o título de Guardião.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As correntes vitais fluem através de você. Sua conexão com as águas da vida se fortalece.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Suas pesquisas revolucionam o campo. A comunidade científica celebra suas descobertas.</em>'
        },
        6: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Templo do Equilíbrio Ácido-Base abre suas portas. Você lê o pH urinário como um texto sagrado.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As marés do sódio e do bicarbonato respondem ao seu toque. Você é a guaraniã do equilíbrio.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus algoritmos de classificação renal são adotados por todo o reino. A ciência te reconhece.</em>'
        },
        7: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As forças da natureza renal se curvam à sua vontade. Você transcende os limites do conhecimento comum.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você dança entre eletrólitos e osmolaridade com graça divina. O equilíbrio é sua essência.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus experimentos desafiam paradigmas. Você está à beira de uma grande revelação.</em>'
        },
        8: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As Catacumbas das Glomerulopatias se abrem. Você decifra biopsias como um arquélogo do rim.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas profundas da síndrome nefrótica revelam seus segredos. Você é a guaraniã da barreira de filtração.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus estudos sobre podocitopatas são citados em todo o reino. A ciência renal te deve uma dívida.</em>'
        },
        9: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Oraculo do Transplante te convoca. Você domina imunossupressores e rejeicões com mãos firmes.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você navega pelas águas turvas da diálise peritoneal com destreza. Cada cateter é uma nova história.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus dados sobre sobrevida em diálise redefinem protocolos. O reino renal te ouve com atenção.</em>'
        },
        10: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Os Deuses do Néfron concedem sua bênção. Você alcançou a harmonia perfeita entre ciência e arte.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas primordiais reconhecem você como sua mestra. Seu poder é incontestável.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Sua tese redefine a nefrologia moderna. Você é uma referência mundial.</em>'
        },
        11: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As Fortalezas da DRC Avançada caem diante de você. Cada paciente em diálise é uma vitória da sua dedicação.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você domina as águas da ultrafiltracão e da osmose. A hemofiltração obedece à sua vontade.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seus ensaios clínicos são apresentados em congressos internacionais. O mundo renal te escuta.</em>'
        },
        12: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Lendas serão escritas sobre sua jornada. Você domina tanto o coração quanto os rins.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Seu nome ecoa pelos corredores dos hospitais. Você é a esperança dos pacientes renais.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Prêmios internacionais aguardam por você. Sua contribuição é inestimável.</em>'
        },
        13: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Arqui-Nefromante enviou seus emissários. Você os derrotou com cada resposta certa. A batalha final se aproxima.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas do destino convergem para você. Você sente o peso e a glória da jornada que percorreu.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Sua meta-análise final está quase completa. Os dados apontam para uma verdade que mudará a nefrologia.</em>'
        },
        14: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Você está à beira da transcendência. O Arqui-Nefromante treme, mas ainda resiste. Prepare-se para o golpe final.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As águas primordiais cantam seu nome. Você é a encarnação da homeostase perfeita. A vitória é sua.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O último dado foi coletado. Sua tese está pronta para mudar o mundo. A defesa é amanhã.</em>'
        },
        15: {
          'nephros': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">O Arqui-Nefromante sente seu poder crescente. O confronto final se aproxima... Você está pronto.</em>',
          'aquaria': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">As forças das trevas tremem diante de sua luz. Você é a última esperança contra o caos renal.</em>',
          'glomerulus': '<em style="color:#a0aec0;font-size:0.85rem;display:block;margin-top:12px;font-style:italic;">Todos os dados convergem para este momento. A batalha final determinará o futuro da nefrologia.</em>'
        }
      };
      
      const charId = state.character || 'nephros';
      const loreText = (loreNarratives[newLevel] && loreNarratives[newLevel][charId]) || '';
      
      const text = evolutionTexts[newLevel] || "Você evoluiu! Continue sua jornada rumo à maestria nefrológica.";
      
      const modal = document.createElement('div');
      modal.className = 'modal show evolution-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(6px);padding:32px 16px;overflow-y:auto;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;max-height:88vh;overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;">
          <h2 style="color:var(--gold);margin-bottom:12px;">⚡ EVOLUÇÃO! ⚡</h2>
          <div style="margin:20px auto;width:120px;height:120px;border-radius:50%;overflow:hidden;border:3px solid var(--gold);box-shadow:0 0 20px rgba(255,215,0,0.5);">
            <img src="${newImage}" style="width:100%;height:100%;object-fit:cover;" alt="${newTitle}">
          </div>
          <h3 style="color:var(--ok);margin-bottom:8px;font-size:1.3rem;">${newTitle}</h3>
          ${loreText ? loreText.replace('margin-top:12px', 'margin-top:12px;margin-bottom:20px') : `<em style="color:#a0aec0;font-size:0.85rem;display:block;margin:12px 20px 20px;font-style:italic;">${text}</em>`}
          <button class="btn gold" data-close-closest=".modal">Continuar Jornada</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('levelup');
    }

    // ============ SISTEMA DE SAVE/LOAD (localStorage) ============
    const SAVE_KEY = 'nefroquest-save';
    const STATS_KEY = 'nefroquest-stats';
    const MASTERED_KEY = 'nefroquest-mastered';
    // Schema version — incrementar ao adicionar campos obrigatórios ao saveData
    // Histórico: 1 = original  2 = bossIntroShown + chestsOpened  3 = legendaryAbilityUsed  4 = difficulty + maxLives
    const SAVE_SCHEMA_VERSION = 4;
    // Chave Web3Forms — obtenha grátis em https://web3forms.com (cadastre orlandobrunet@gmail.com)
    const FLAG_API_KEY = 'd88c1c48-5d9c-48f2-b506-53ac0ac71396';

    // ============ FREEMIUM ============
    const ADMIN_EMAIL = 'orlandobrunet@gmail.com';
    // Reconhece admin via JWT custom claim (app_metadata.is_admin).
    // Fallback por email cobre sessões antigas/offline; segurança real está no RLS.
    function isAdminUser() {
      if (!authUser) return false;
      if (authUser.app_metadata?.is_admin === true) return true;
      if (authUser.email === ADMIN_EMAIL) return true;
      return false;
    }
    const FREE_QUESTIONS_LIMIT = 50;
    const PREMIUM_KEY = 'nefroquest-premium';
    const WHITELIST_KEY = 'nefroquest-whitelist';
    const _lang = (navigator.language || 'pt').startsWith('pt') ? 'pt' : 'en';
    const PRICE_MONTHLY  = _lang === 'pt' ? 'R$14,90' : 'US$14.90';
    const PRICE_LIFETIME = _lang === 'pt' ? 'R$199,00' : 'US$199.00';
    
    // ── Cache de stats (evita JSON.parse a cada resposta) ──
    let _statsCache = null;
    function getGameStats() {
      if (_statsCache) return Object.assign({}, _statsCache);
      const def = {gamesPlayed:0,bestLevel:0,bestScore:0,questionsAnsweredAllTime:0};
      try { _statsCache = Object.assign({}, def, JSON.parse(localStorage.getItem(STATS_KEY) || '{}')); }
      catch(e) { _statsCache = def; }
      return Object.assign({}, _statsCache);
    }
    function _invalidateStatsCache() { _statsCache = null; }

    function updateGameStats() {
      const stats = getGameStats();
      stats.gamesPlayed++;
      if (state.level > stats.bestLevel) stats.bestLevel = state.level;
      if (state.score > stats.bestScore) stats.bestScore = state.score;
      try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch(e) {}
      _invalidateStatsCache();
    }

    // ── Cache de isPremium (evita 2x localStorage por resposta) ──
    let _isPremiumCache = null;
    function isPremium() {
      if (isAdminUser()) return true;
      if (_isPremiumCache !== null) return _isPremiumCache;
      _isPremiumCache = localStorage.getItem(PREMIUM_KEY) === '1' || localStorage.getItem(WHITELIST_KEY) === '1';
      return _isPremiumCache;
    }
    function _invalidatePremiumCache() { _isPremiumCache = null; }

    async function _loadPremiumFromDB() {
      if (!_supaClient || !authUser) return;
      if (isAdminUser()) return;
      try {
        const { data: profile } = await _supaClient
          .from('profiles')
          .select('is_premium')
          .eq('id', authUser.id)
          .single();
        if (profile?.is_premium) {
          localStorage.setItem(PREMIUM_KEY, '1');
          localStorage.removeItem(WHITELIST_KEY);
          _invalidatePremiumCache();
          return;
        } else {
          localStorage.removeItem(PREMIUM_KEY);
        }
        // Check whitelist
        const { data: wl } = await _supaClient
          .from('access_whitelist')
          .select('email')
          .eq('email', authUser.email)
          .maybeSingle();
        if (wl?.email) localStorage.setItem(WHITELIST_KEY, '1');
        else localStorage.removeItem(WHITELIST_KEY);
        _invalidatePremiumCache();
      } catch(e) {}
    }

    function _incrementQuestionsAnswered() {
      const stats = getGameStats();
      stats.questionsAnsweredAllTime = (stats.questionsAnsweredAllTime || 0) + 1;
      try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch(e) {}
      _invalidateStatsCache();
    }
    
    // Debounce do saveGame para evitar escritas excessivas no localStorage
    let _saveTimer = null;
    function saveGame() {
      if (!state.gameStarted || state.gameOver) return;
      if (_saveTimer) return; // já agendado
      _saveTimer = setTimeout(() => {
        _saveTimer = null;
        _doSaveGame();
      }, 300);
    }
    function _doSaveGame() {
      if (!state.gameStarted || state.gameOver) return;
      const saveData = {
        level: state.level,
        xp: state.xp,
        xpToNext: state.xpToNext,
        score: state.score,
        lives: state.lives,
        streak: state.streak,
        gold: state.gold,
        bonusUses: state.bonusUses,
        correctTotal: state.correctTotal,
        narrativeShown: state.narrativeShown,
        bossIntroShown: state.bossIntroShown || false,
        battleFinalShown: state.battleFinalShown || false,
        character: state.character,
        equipment: JSON.parse(JSON.stringify(state.equipment)),
        idx: state.idx,
        queueIds: state.queue.map(q => q.id),
        recentIds: _recentIds,
        chestsOpened: state.chestsOpened,
        difficulty: state.difficulty || 'normal',
        maxLives: state.maxLives || 3,
        legendaryAbilityUsed: {...state.legendaryAbilityUsed},
        extraLifeGiven: state.extraLifeGiven || false,
        timestamp: Date.now(),
        schemaVersion: SAVE_SCHEMA_VERSION
      };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } catch(e) {}
    }

    function _migrateSave(save) {
      const v = save.schemaVersion || 1;
      // v1 → v2: garantir campos adicionados depois do lançamento
      if (v < 2) {
        save.bossIntroShown  = save.bossIntroShown  ?? false;
        save.chestsOpened    = save.chestsOpened    ?? 0;
        save.schemaVersion   = 2;
      }
      if (v < 3) {
        save.legendaryAbilityUsed = save.legendaryAbilityUsed ?? {};
        save.schemaVersion = 3;
      }
      if (v < 4) {
        save.difficulty = save.difficulty ?? 'normal';
        save.maxLives   = save.maxLives   ?? 3;
        save.schemaVersion = 4;
      }
      return save;
    }

    function loadGame() {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      try {
        const save = JSON.parse(raw);
        return _migrateSave(save);
      } catch(e) {
        console.warn('[NefroQuest] Save corrompido — descartando:', e);
        localStorage.removeItem(SAVE_KEY);
        return null;
      }
    }
    
    function deleteSave() {
      localStorage.removeItem(SAVE_KEY);
    }
    
    function restoreGame(save) {
      if (!save || !save.character) return false;
      
      state.character = save.character;
      state.level = save.level || 1;
      state.xp = save.xp || 0;
      state.xpToNext = xpForLevel(save.level || 1); // sempre recalculado pelo nível, ignora valor salvo
      state.score = save.score || 0;
      state.lives = save.lives || 3;
      state.streak = save.streak || 0;
      state.gold = save.gold || 0;
      state.bonusUses = save.bonusUses || 0;
      state.correctTotal = save.correctTotal || 0;
      state.narrativeShown = save.narrativeShown || 0;
      state.bossIntroShown = save.bossIntroShown || false;
      state.battleFinalShown = save.battleFinalShown || false;
      state.chestsOpened = save.chestsOpened || 0;
      state.difficulty = save.difficulty || 'normal';
      state.maxLives = save.maxLives || 3;
      chestCost = Math.min(100 + state.chestsOpened * 15, 250);
      state.legendaryAbilityUsed = save.legendaryAbilityUsed || {};
      state.extraLifeGiven = save.extraLifeGiven || false;
      state.gameCompleted = !!localStorage.getItem('nefroquest-arqui-defeated');
      state.gameOver = false;
      state.gameStarted = true;
      state.answered = false;
      state.current = null;
      
      if (save.equipment) {
        state.equipment = save.equipment;
      }
      
      // Restore queue order
      if (save.queueIds && save.queueIds.length > 0) {
        const bankMap = {};
        questionBank.forEach(q => bankMap[q.id] = q);
        state.queue = save.queueIds.map(id => bankMap[id]).filter(Boolean);
        state.idx = save.idx || 0;
        if (save.recentIds) _recentIds = save.recentIds.slice(-HISTORY_SIZE);
      } else {
        shuffleQueue();
      }
      
      return true;
    }
    
    // Auto-save every 30 seconds — armazenado para permitir cleanup
    const _autoSaveInterval = setInterval(() => { saveGame(); }, 30000);

    // ============ WELCOME SCREEN LOGIC ============
    function initWelcomeScreen() {
      // Gerar partículas flutuantes animadas
      (function spawnParticles() {
        const container = document.getElementById('welcomeParticles');
        if (!container) return;
        const colors = ['gold','blue','white','purple'];
        const sizes = [6,8,10,12,16,20];
        const count = 28;
        for (let i = 0; i < count; i++) {
          const p = document.createElement('div');
          const color = colors[Math.floor(Math.random()*colors.length)];
          const size = sizes[Math.floor(Math.random()*sizes.length)];
          const left = Math.random()*100;
          const delay = Math.random()*12;
          const duration = 6 + Math.random()*10;
          const drift = (Math.random()-0.5)*120;
          p.className = `wp ${color}`;
          p.style.cssText = `width:${size}px;height:${size}px;left:${left}%;bottom:-${size}px;` +
            `--drift:${drift}px;animation-duration:${duration}s;animation-delay:${delay}s;`;
          container.appendChild(p);
        }
      })();

      const save = loadGame();
      const stats = getGameStats();
      const board = boardGet();
      
      // Show stats if player has history
      if (stats.gamesPlayed > 0 || board.length > 0) {
        document.getElementById('welcomeStats').style.display = 'grid';
        document.getElementById('wsBestScore').textContent = stats.bestScore || (board.length ? board[0].score : 0);
        document.getElementById('wsGamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('wsBestLevel').textContent = stats.bestLevel;
      }
      
      refreshWelcomeSave();
    }

    function refreshWelcomeSave() {
      const save = loadGame();
      const savedInfoEl = document.getElementById('welcomeSavedInfo');
      const continueBtn = document.getElementById('welcomeContinueBtn');
      if (save && save.character && save.lives > 0) {
        if (continueBtn) continueBtn.style.display = 'block';
        const charData = characters[save.character];
        const charName = charData ? charData.name : 'Desconhecido';
        document.getElementById('wsSavedChar').textContent = charName;
        document.getElementById('wsSavedLevel').textContent = save.level || 1;
        document.getElementById('wsSavedLives').textContent = '❤'.repeat(save.lives || 0);
        document.getElementById('wsSavedScore').textContent = save.score || 0;
        document.getElementById('wsSavedTime').textContent = getTimeAgo(save.timestamp) || '';
        if (charData) {
          const ext = save.character === 'glomerulus' ? 'png' : 'jpg';
          const lvNum = Math.min(10, Math.max(1, save.level || 1));
          document.getElementById('wsSavedAvatar').src = `assets/classes/${charData.folder}/nivel_${String(lvNum).padStart(2,'0')}.${ext}`;
          document.getElementById('wsSavedAvatar').alt = charName;
        }
        if (savedInfoEl) {
          savedInfoEl.style.display = 'block';
          savedInfoEl.style.opacity = '1';
        }
      } else {
        if (savedInfoEl) savedInfoEl.style.display = 'none';
        if (continueBtn) continueBtn.style.display = 'none';
      }
    }

    function getTimeAgo(ts) {
      if (!ts) return '';
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'agora mesmo';
      if (mins < 60) return `há ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `há ${hours}h`;
      const days = Math.floor(hours / 24);
      return `há ${days} dia${days > 1 ? 's' : ''}`;
    }
    
    function dismissWelcome() {
      _track('game_started', { difficulty: state.difficulty || 'normal', character: state.selectedCharacter });
      const ws = document.getElementById('welcomeScreen');
      ws.style.opacity = '0';
      ws.style.transition = 'opacity 0.5s';
      // Esconder welcome screen após 500ms (transição visual)
      setTimeout(() => {
        ws.classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('actionDock').classList.remove('hidden');
      }, 500);
      // Fade-out da welcome music; só inicia bgMusic após o fade-out COMPLETO
      stopWelcomeMusic(true, () => {
        if (musicEnabled) startBgMusic();
      });
    }
    
    function continueGame() {
      const save = loadGame();
      if (!save) { startNewFromWelcome(); return; }
      
      if (restoreGame(save)) {
        dismissWelcome();
        ui.journal.innerHTML = '';
        log(`🔄 Jornada restaurada! ${characters[state.character].name}, Nível ${state.level}.`);
        renderHUD();
        updateBadges();
        renderQuestion();
        // Se retomou no Confronto Final, ativa o modo boss imediatamente
        updateBossUI();
        applyBossOptionBadges();
        playSound('click');
      } else {
        startNewFromWelcome();
      }
    }
    
    function startNewFromWelcome() {
      playSound('click');
      // Mostra seletor de dificuldade sem fechar a welcome ainda
      // O confirm button do overlay faz dismissWelcome + deleteSave
      showNewGameConfirm(true /* fromWelcome */);
    }
    
    function showLeaderboardFromWelcome() {
      playSound('click');
      renderBoard();
      ui.boardModal.classList.remove('hidden');
    }

    // Data loaded from data/refs.js

    // Artigos de nefrologia para os baús
    // Data loaded from data/articles.js
    
    // Estado dos baús desbloqueados
    let unlockedArticles = (() => { try { return JSON.parse(localStorage.getItem('unlockedArticles') || '[]'); } catch(e) { return []; } })();

    // Data loaded from data/topics.js
    const items = {
      weapon:[
        {n:"Bisturi de Plantão",rar:"common",atk:1,def:0,kno:1,luck:0},
        {n:"Lâmina da Alça",rar:"common",atk:2,def:0,kno:1,luck:0},
        {n:"Estilete Tubular",rar:"common",atk:2,def:1,kno:0,luck:0},
        {n:"Lança Glomerular",rar:"rare",atk:4,def:1,kno:2,luck:1},
        {n:"Espada Nefroprotetora",rar:"epic",atk:7,def:2,kno:3,luck:2},
        {n:"Excalibur do Néfron",rar:"legendary",atk:11,def:3,kno:4,luck:3},
        {n:"Cetro do Néfron Eterno",rar:"legendary",atk:12,def:2,kno:5,luck:4}
    ],
      armor:[
        {n:"Jaleco de Plantão",rar:"common",atk:0,def:2,kno:1,luck:0},
        {n:"Avental Protetor",rar:"common",atk:0,def:1,kno:1,luck:1},
        {n:"Luvas de Látex Reforçadas",rar:"common",atk:1,def:2,kno:0,luck:0},
        {n:"Manto Renocortical",rar:"rare",atk:1,def:4,kno:2,luck:1},
        {n:"Égide Dialítica",rar:"epic",atk:2,def:7,kno:3,luck:1},
        {n:"Armadura Primeva",rar:"legendary",atk:3,def:11,kno:4,luck:2},
        {n:"Armadura da Homeostase Perfeita",rar:"legendary",atk:4,def:12,kno:5,luck:3}
      ],
      relic:[
        {n:"Anel Albuminúrico",rar:"common",atk:0,def:0,kno:2,luck:1},
        {n:"Estetoscópio Básico",rar:"common",atk:0,def:1,kno:2,luck:0},
        {n:"Prancheta Clínica",rar:"common",atk:1,def:0,kno:2,luck:0},
        {n:"Termômetro Digital",rar:"common",atk:0,def:0,kno:1,luck:2},
        {n:"Sigilo KDIGO",rar:"rare",atk:1,def:1,kno:4,luck:1},
        {n:"Orbe da Cistatina",rar:"epic",atk:2,def:2,kno:6,luck:2},
        {n:"Relíquia do Título",rar:"legendary",atk:3,def:3,kno:8,luck:4},
        {n:"Amuleto do Rim Imortal",rar:"legendary",atk:4,def:4,kno:9,luck:5},
        {n:"Elmo do Filtrador Supremo",rar:"legendary",atk:5,def:5,kno:10,luck:3}
      ]
    };

    const rarityWeight=["common","common","common","rare","rare","epic","legendary"];
    const rarityPower={common:1,rare:2,epic:3,legendary:4};

    function buildDeck() {
      const deck=[];
      for(let i=0;i<topics.length;i++){
        const t=topics[i];
        const d=t.diff==='hard'?Math.min(12,8+Math.floor(i/30)):Math.min(12,4+Math.floor(i/25));
        // Usar campos completos: opts, ans, exp (não abreviados)
        const opts = t.opts || t.o || [];
        const ans  = (t.ans !== undefined) ? t.ans : (t.a !== undefined ? t.a : 0);
        const exp  = t.exp || t.e || '';
        // Shuffle desabilitado (Fase 1): 259 explicações referenciam "alternativa A/B/C/D"
        // que ficariam incorretas após o embaralhamento. Reativar quando as
        // explicações forem reescritas para referenciar o conteúdo, não a letra.
        deck.push({id:t.qid||(String(i+1)),d,_d:t.diff||t.d||'medium',q:t.q,o:opts,a:ans,e:exp,r:t.refs||t.r||[],c:t.cat||t.c||'geral'});
      }
      return deck;
    }

    const questionBank=buildDeck();

    // Definições de Personagens
    const characters = {
      nephros: {
        id: 'nephros',
        name: 'Dr. Nephros',
        title: 'Guardião dos Néfrons',
        folder: 'clerigo_renal',
        bonusAtk: 0, bonusDef: 0, bonusKno: 2, bonusLuck: 0
      },
      aquaria: {
        id: 'aquaria',
        name: 'Dra. Aquaria',
        title: 'Mestra das Águas',
        folder: 'maga_metabolica',
        bonusAtk: 0, bonusDef: 2, bonusKno: 0, bonusLuck: 0
      },
      glomerulus: {
        id: 'glomerulus',
        name: 'Dr. Glomerulus',
        title: 'Cientista Renal',
        folder: 'guerreiro_glomerular',
        bonusAtk: 2, bonusDef: 0, bonusKno: 1, bonusLuck: 0
      }
    };

    // ============ STATE — Schema centralizado ============
    // Ao adicionar campos: 1) adicione aqui  2) incremente SAVE_SCHEMA_VERSION
    //                      3) adicione migração em _migrateSave()
    //
    // Campo              Tipo          Descrição
    // ─────────────────────────────────────────────────────
    // level              number        Nível atual do jogador (1–∞)
    // xp                 number        XP acumulado no nível atual
    // xpToNext           number        XP necessário para o próximo nível
    // score              number        Pontuação total da sessão
    // lives              number        Vidas restantes
    // maxLives           number        Vidas máximas (ajustado por dificuldade)
    // streak             number        Sequência atual de acertos
    // gold               number        Ouro acumulado
    // difficulty         string        'easy'|'normal'|'hard'|'hardcore'
    // legendaryAbilityUsed object      Habilidades lendárias usadas (por equipamento)
    // current            object|null   Questão atual renderizada
    // answered           boolean       Se a questão atual já foi respondida
    // queue              array         Fila de questões embaralhadas
    // idx                number        Índice na fila
    // bonusUses          number        Usos de pergunta bônus restantes
    // correctTotal       number        Total de acertos corretos acumulados
    // narrativeShown     number        Último checkpoint narrativo exibido
    // bossIntroShown     boolean       Se o popup de intro do boss já foi exibido
    // gameOver           boolean       Se o jogo terminou (sem vidas)
    // bossLog            array         Log de eventos da batalha final
    // gameStarted        boolean       Se o jogo foi iniciado
    // chestsOpened       number        Total de baús abertos na sessão
    // character          string|null   ID do personagem selecionado
    // equipment          object        Slots weapon/armor/relic com atributos
    // selectedCharacter  string|null   Alias de character (usado em alguns fluxos)
    // hp/maxHp           number        HP do boss (usado em boss mode)
    // ─────────────────────────────────────────────────────
    const state={
      level:1,xp:0,xpToNext:200,score:0,lives:3,maxLives:3,streak:0,gold:0,difficulty:"normal",legendaryAbilityUsed:{},
      current:null,answered:false,queue:[],idx:0,bonusUses:0,
      correctTotal:0, narrativeShown:0, bossIntroShown:false, battleFinalShown:false, gameOver:false, bossLog:[],
      gameStarted: false, chestsOpened:0,
      character: null,
      equipment:{
        weapon:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        armor:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        relic:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0}
      }
    };

    const $=id=>document.getElementById(id);
    // Escapa caracteres HTML para evitar XSS em innerHTML com dados dinâmicos
    function escapeHtml(s) {
      if (s == null) return '';
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function _firstSentence(text, maxLen) {
      if (!text) return '';
      maxLen = maxLen || 140;
      const dot = text.search(/\.\s+[A-ZÁÉÍÓÚÀÂÊÔÇÃ]/);
      const cut = dot > 30 && dot < maxLen ? dot + 1 : Math.min(text.length, maxLen);
      return text.substring(0, cut).trim();
    }

    // ── Spaced Repetition (SM-2) ──────────────────────────────────────────
    const SR_KEY = 'nefroquest-sr-data';
    function _loadSRData() {
      try { return JSON.parse(localStorage.getItem(SR_KEY) || '{}'); } catch { return {}; }
    }
    function _saveSRData(d) {
      try { localStorage.setItem(SR_KEY, JSON.stringify(d)); } catch {}
    }
    function updateSRData(qid, isCorrect) {
      if (!qid) return;
      const data = _loadSRData();
      const today = new Date().setHours(0,0,0,0);
      const card = data[qid] || { ef: 2.5, interval: 1, reps: 0, due: today };
      const q = isCorrect ? 4 : 1;
      card.ef = Math.max(1.3, card.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (isCorrect) {
        card.reps++;
        card.interval = card.reps === 1 ? 1 : card.reps === 2 ? 6 : Math.ceil(card.interval * card.ef);
      } else {
        card.reps = 0;
        card.interval = 1;
      }
      card.due = today + card.interval * 86400000;
      data[qid] = card;
      _saveSRData(data);
    }
    function getSRDueQuestions(qs) {
      const data = _loadSRData();
      const today = new Date().setHours(0,0,0,0);
      return qs.filter(q => !q.qid || !data[q.qid] || data[q.qid].due <= today);
    }
    function getSRDueCount() {
      const selectedCats = new Set();
      NEFRO_AXES.forEach(ax => { if (_studySelectedAxes.has(ax.id)) selectedCats.add(ax.cat); });
      return getSRDueQuestions(topics.filter(q => selectedCats.has(q.cat))).length;
    }
    function startSRStudyMode() {
      if (_studySelectedAxes.size === 0) { alert('Selecione pelo menos um eixo!'); return; }
      const selectedCats = new Set();
      NEFRO_AXES.forEach(ax => { if (_studySelectedAxes.has(ax.id)) selectedCats.add(ax.cat); });
      const due = getSRDueQuestions(topics.filter(q => selectedCats.has(q.cat)));
      if (due.length === 0) {
        alert('Nenhuma questão para revisar hoje! Volte amanhã ou use o estudo livre.');
        return;
      }
      studyModeQuestions = shuffle(due);
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      showStudyModePage();
    }

    const ui={
      heroImg:$("heroImg"),heroClass:$("heroClass"),heroTitle:$("heroTitle"),xpFill:$("xpFill"),xpTxt:$("xpTxt"),
      storyTitle:$("storyTitle"),storyGoal:$("storyGoal"),
      level:$("level"),score:$("score"),lives:$("lives"),record:$("record"),gold:$("gold"),streak:$("streak"),
      equipList:$("equipList"),journal:$("journal"),question:$("question"),options:$("options"),feedback:$("feedback"),refs:$("refs"),
      nextBtn:$("nextBtn"),newBtn:$("newBtn"),forgeBtn:$("forgeBtn"),bonusBtn:$("bonusBtn"),boardBtn:$("boardBtn"),
      boardModal:$("boardModal"),boardBody:$("boardBody"),closeBoard:$("closeBoard"),
      dockForgeBtn:$("forgeBtn"),dockChestBtn:$("chestBtn"),dockLegBtn:$("legendaryForgeBtn"),dockChestCost:$("chestCostBadge"),actionDock:$("actionDock")
    };

    // === SUPABASE LEADERBOARD ===
    const SUPA_URL = 'https://wviutasgroltjuyxpevc.supabase.co';
    const SUPA_KEY = 'sb_publishable_kUxWMU36-PEaNuhEqTy3Zw_-A5ep67_';

    // ===== SUPABASE AUTH =====
    let _supaClient = null;
    let authUser = null;
    let _guestMode = false;
    let _guestHookShown = false;

    (function initSupaAuth() {
      if (localStorage.getItem('nq_guest_mode') === '1') _guestMode = true;
      if (typeof supabase === 'undefined') { console.warn('Supabase SDK não carregado'); return; }
      _supaClient = supabase.createClient(SUPA_URL, SUPA_KEY);

      _supaClient.auth.onAuthStateChange(async (event, session) => {
        const candidateUser = session?.user ?? null;
        if (event === 'PASSWORD_RECOVERY') {
          authUser = candidateUser;
          showUpdatePasswordModal();
          return;
        }
        authUser = candidateUser;
        if (authUser) {
          if (_guestMode) {
            _guestMode = false;
            _guestHookShown = false;
            localStorage.removeItem('nq_guest_mode');
          }
          _loadPremiumFromDB();
          checkFirstTimeOnboarding();
          // Se havia plano pendente (usuário clicou em pagar antes de fazer login)
          _resumePendingPayment();
        } else { localStorage.removeItem(PREMIUM_KEY); localStorage.removeItem(WHITELIST_KEY); _invalidatePremiumCache(); }
        updateWelcomeUserBadge();
      });

      _supaClient.auth.getSession().then(({ data: { session } }) => {
        authUser = session?.user ?? null;
        if (authUser) _loadPremiumFromDB();
        else { localStorage.removeItem(PREMIUM_KEY); _invalidatePremiumCache(); }
        updateWelcomeUserBadge();
      });
    })();

    function _authDisplayName() {
      if (!authUser) return null;
      return authUser.user_metadata?.full_name
        || authUser.user_metadata?.name
        || authUser.email?.split('@')[0]
        || 'Aventureiro';
    }

    function updateWelcomeUserBadge() {
      if (authUser) {
        const email = authUser.email || '';
        const loginBtn = document.getElementById('welcomeLoginBtn');
        if (loginBtn) loginBtn.style.display = 'none';
        document.querySelectorAll('.profile-btn').forEach(b => b.classList.add('visible'));
        document.querySelectorAll('[id$="ProfileEmail"]').forEach(el => { el.textContent = email; });
        const mobileTopEmail = document.getElementById('mobileTopProfileEmail');
        if (mobileTopEmail) mobileTopEmail.textContent = email;
        const _showAdmin = isAdminUser();
        document.querySelectorAll('.admin-item').forEach(el => el.classList.toggle('visible', _showAdmin));
        const landing = document.getElementById('landingScreen');
        if (landing && !landing.classList.contains('hidden')) {
          landing.classList.add('hidden');
          document.getElementById('welcomeScreen').classList.remove('hidden');
          refreshWelcomeSave();
          if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
        }
      } else if (_guestMode) {
        document.querySelectorAll('.profile-btn').forEach(b => b.classList.add('visible'));
        document.querySelectorAll('[id$="ProfileEmail"]').forEach(el => { el.textContent = '👤 Convidado'; });
        const landing = document.getElementById('landingScreen');
        if (landing && !landing.classList.contains('hidden')) {
          landing.classList.add('hidden');
          document.getElementById('welcomeScreen').classList.remove('hidden');
          refreshWelcomeSave();
          if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
        }
      } else {
        document.querySelectorAll('.profile-btn').forEach(b => b.classList.remove('visible'));
      }
    }

    function openAuthModal() {
      document.getElementById('authModal').classList.add('show');
      _setAuthMsg('', '');
    }
    function closeAuthModal() {
      document.getElementById('authModal').classList.remove('show');
    }
    let _windowJustFocused = false;
    window.addEventListener('focus', () => { _windowJustFocused = true; setTimeout(() => { _windowJustFocused = false; }, 300); });
    function closeAuthOutside(e) {
      if (_windowJustFocused) return; // ignora clique de reativação da janela
      if (e.target.id === 'authModal') closeAuthModal();
    }
    function switchAuthTab(tab) {
      const isEntrar = tab === 'entrar';
      document.getElementById('tabEntrar').classList.toggle('active', isEntrar);
      document.getElementById('tabCadastrar').classList.toggle('active', !isEntrar);
      document.getElementById('authFormEntrar').style.display = isEntrar ? 'block' : 'none';
      document.getElementById('authFormCadastrar').style.display = isEntrar ? 'none' : 'block';
      document.getElementById('authFormForgot').style.display = 'none';
      _setAuthMsg('', '');
    }
    function showForgotPassword() {
      document.getElementById('authFormEntrar').style.display = 'none';
      document.getElementById('authFormCadastrar').style.display = 'none';
      document.getElementById('authFormForgot').style.display = 'block';
      _setAuthMsg('', '');
    }
    async function authForgotPassword() {
      if (!_supaClient) return;
      const email = document.getElementById('authForgotEmail').value.trim();
      if (!email) { _setAuthMsg('Digite seu email.', 'error'); return; }
      const btn = document.getElementById('authForgotBtn');
      btn.disabled = true; btn.textContent = 'Enviando...';
      const { error } = await _supaClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://nefroquest.com'
      });
      btn.disabled = false; btn.textContent = 'Enviar Link de Redefinição';
      if (error) { _setAuthMsg(error.message, 'error'); }
      else { _setAuthMsg('Link enviado! Verifique seu email.', 'success'); }
    }
    function authKeyPress(e) {
      if (e.key !== 'Enter') return;
      const entrarVisible = document.getElementById('authFormEntrar').style.display !== 'none';
      entrarVisible ? authEmailLogin() : authEmailRegister();
    }
    function _setAuthMsg(msg, type) {
      const el = document.getElementById('authMsg');
      el.textContent = msg;
      el.className = 'auth-msg' + (type ? ' ' + type : '');
      el.style.display = msg ? 'block' : 'none';
    }
    async function loginWithGoogle() {
      if (!_supaClient) return;
      const { error } = await _supaClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) _setAuthMsg(error.message, 'error');
    }
    async function authEmailLogin() {
      if (!_supaClient) return;
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      if (!email || !password) { _setAuthMsg('Preencha email e senha.', 'error'); return; }
      const btn = document.getElementById('authLoginBtn');
      btn.disabled = true; btn.textContent = 'Entrando...';
      const { error } = await _supaClient.auth.signInWithPassword({ email, password });
      btn.disabled = false; btn.textContent = 'Entrar na Jornada';
      if (error) {
        const msg = error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos.'
          : error.message === 'Email not confirmed'
            ? 'Email não confirmado. Verifique sua caixa de entrada e clique no link de ativação.'
            : error.message;
        _setAuthMsg(msg, 'error');
      } else { closeAuthModal(); }
    }
    async function authEmailRegister() {
      if (!_supaClient) return;
      const name = document.getElementById('authDisplayName').value.trim();
      const specialty = document.getElementById('authSpecialty').value;
      const email = document.getElementById('authEmailReg').value.trim();
      const password = document.getElementById('authPasswordReg').value;
      const passwordConfirm = document.getElementById('authPasswordConfirm').value;
      if (!name || !email || !password || !passwordConfirm) { _setAuthMsg('Preencha todos os campos.', 'error'); return; }
      if (password.length < 6) { _setAuthMsg('Senha deve ter pelo menos 6 caracteres.', 'error'); return; }
      if (password !== passwordConfirm) { _setAuthMsg('As senhas não coincidem.', 'error'); return; }
      const btn = document.getElementById('authRegBtn');
      btn.disabled = true; btn.textContent = 'Criando conta...';
      const { error } = await _supaClient.auth.signUp({
        email, password,
        options: {
          data: { full_name: name, specialty },
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });
      btn.disabled = false; btn.textContent = 'Criar Conta';
      if (error) { _setAuthMsg(error.message, 'error'); }
      else {
        _setAuthMsg('Conta criada! Verifique seu email para confirmar.', 'success');
        const resendEl = document.getElementById('authResendWrap');
        if (resendEl) { resendEl.style.display = 'block'; resendEl.dataset.email = email; }
      }
    }
    async function authResendConfirmation() {
      if (!_supaClient) return;
      const el = document.getElementById('authResendWrap');
      const email = el ? el.dataset.email : '';
      if (!email) return;
      const btn = document.getElementById('authResendBtn');
      btn.disabled = true; btn.textContent = 'Reenviando...';
      const { error } = await _supaClient.auth.resend({ type: 'signup', email });
      btn.disabled = false; btn.textContent = 'Reenviar email';
      _setAuthMsg(error ? error.message : 'Email reenviado! Verifique sua caixa de entrada e o spam.', error ? 'error' : 'success');
    }
    async function authLogout() {
      if (!_supaClient) return;
      await _supaClient.auth.signOut();
      authUser = null;
      _guestMode = false;
      _guestHookShown = false;
      localStorage.removeItem('nq_guest_mode');
      localStorage.removeItem(PREMIUM_KEY);
      localStorage.removeItem(WHITELIST_KEY);
      _invalidatePremiumCache(); _invalidateStatsCache();
      updateWelcomeUserBadge();
      // Return to landing screen
      document.getElementById('welcomeScreen').classList.add('hidden');
      document.getElementById('landingScreen').classList.remove('hidden');
      document.getElementById('mainApp')?.classList.add('hidden');
    }

    function playAsGuest() {
      _guestMode = true;
      localStorage.setItem('nq_guest_mode', '1');
      const landing = document.getElementById('landingScreen');
      const welcome = document.getElementById('welcomeScreen');
      if (landing) landing.classList.add('hidden');
      if (welcome) welcome.classList.remove('hidden');
      updateWelcomeUserBadge();
    }

    function _showGuestHook() {
      if (!_guestMode || _guestHookShown || authUser) return;
      _guestHookShown = true;
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);';
      overlay.innerHTML = `
        <div style="background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid rgba(255,215,0,0.5);border-radius:16px;padding:28px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 0 60px rgba(255,215,0,0.15);">
          <div style="font-size:2rem;margin-bottom:8px;">🏆</div>
          <h2 style="color:var(--gold);font-family:'Cinzel',serif;margin-bottom:6px;font-size:1.2rem;">Nível 2 desbloqueado!</h2>
          <p style="color:var(--txt-dim);font-size:0.85rem;margin-bottom:20px;line-height:1.6;">Crie uma conta gratuita para salvar seu XP, equipamentos e sequência — e aparecer no ranking.</p>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;text-align:left;">
            <div style="color:#c8d8f0;font-size:0.82rem;">✅ Progresso salvo em qualquer dispositivo</div>
            <div style="color:#c8d8f0;font-size:0.82rem;">✅ Aparecer no ranking global</div>
            <div style="color:#c8d8f0;font-size:0.82rem;">✅ Streak e conquistas permanentes</div>
          </div>
          <button id="guestHookSignup" style="width:100%;padding:13px;background:linear-gradient(135deg,#fbbf24,#f59e0b);border:none;border-radius:10px;color:#1a0e00;font-weight:900;font-size:0.95rem;cursor:pointer;font-family:'Cinzel',serif;letter-spacing:1px;margin-bottom:10px;">🔑 Criar conta — é grátis</button>
          <button id="guestHookContinue" style="width:100%;padding:11px;background:transparent;border:1px solid rgba(255,255,255,0.2);border-radius:10px;color:var(--txt-dim);font-size:0.82rem;cursor:pointer;">Continuar sem salvar →</button>
        </div>
      `;
      document.body.appendChild(overlay);
      document.getElementById('guestHookSignup').onclick = () => {
        overlay.remove();
        openAuthModal();
      };
      document.getElementById('guestHookContinue').onclick = () => overlay.remove();
    }

    // ===== REDEFINIÇÃO DE SENHA =====
    function showUpdatePasswordModal() {
      let modal = document.getElementById('updatePasswordModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'updatePasswordModal';
        modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:10000;align-items:flex-start;justify-content:center;backdrop-filter:blur(10px);padding:32px 16px;overflow-y:auto;';
        modal.innerHTML = `
          <div class="modal-panel" style="max-width:400px;margin:auto 0;">
            <h2>🔑 Nova Senha</h2>
            <p style="color:#a0b8d0;font-size:0.85rem;margin-bottom:16px;text-align:center;line-height:1.6">Digite sua nova senha para retomar a jornada.</p>
            <div class="form-group">
              <label>Nova Senha</label>
              <input id="newPassword" type="password" placeholder="mín. 6 caracteres">
            </div>
            <div class="form-group">
              <label>Confirmar Senha</label>
              <input id="newPasswordConfirm" type="password" placeholder="repita a senha">
            </div>
            <div id="updatePwMsg" style="display:none;margin-bottom:12px;font-size:0.83rem;border-radius:6px;padding:8px 12px;"></div>
            <div class="modal-actions">
              <button data-action="saveNewPassword" style="background:linear-gradient(135deg,#c8960b,#ffd700);color:#1a0e00;border:none;font-weight:700;font-family:'Cinzel',serif;">Salvar Nova Senha</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      } else { modal.style.display = 'flex'; }
    }
    async function saveNewPassword() {
      const pwd = document.getElementById('newPassword').value;
      const confirm = document.getElementById('newPasswordConfirm').value;
      const msg = document.getElementById('updatePwMsg');
      const showMsg = (text, ok) => {
        msg.style.display = 'block';
        msg.style.background = ok ? 'rgba(74,222,128,0.15)' : 'rgba(251,113,133,0.15)';
        msg.style.color = ok ? '#4ade80' : '#fb7185';
        msg.textContent = text;
      };
      if (pwd.length < 6) { showMsg('Senha deve ter pelo menos 6 caracteres.', false); return; }
      if (pwd !== confirm) { showMsg('As senhas não coincidem.', false); return; }
      const { error } = await _supaClient.auth.updateUser({ password: pwd });
      if (error) { showMsg(error.message, false); }
      else {
        showMsg('Senha atualizada com sucesso!', true);
        setTimeout(() => { document.getElementById('updatePasswordModal').style.display = 'none'; }, 1500);
      }
    }

    // ===== ONBOARDING =====
    const ONBOARDED_KEY = 'nefroquest-onboarded';
    function checkFirstTimeOnboarding() {
      // Popup de onboarding removido — informações exibidas diretamente na tela de login
    }
    function showOnboardingModal() {
      // Popup de onboarding removido — informações exibidas diretamente na tela de login
    }

    // ===== LANDING SCREEN =====
    function landingLoginGoogle() {
      loginWithGoogle();
    }
    function landingLoginEmail() {
      document.getElementById('landingScreen').classList.add('hidden');
      document.getElementById('welcomeScreen').classList.remove('hidden');
      refreshWelcomeSave();
      if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
      showPricingModal();
    }
    function landingPlayGuest() {
      document.getElementById('landingScreen').classList.add('hidden');
      document.getElementById('welcomeScreen').classList.remove('hidden');
      refreshWelcomeSave();
      if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
    }
    function showLandingMsg(msg) {
      const el = document.getElementById('landingMsg');
      if (!el) return;
      el.textContent = msg;
      el.style.display = 'block';
    }

    // ===== PROFILE POPUP =====
    function toggleProfilePopup(ctx) {
      const ids = { game: 'gameProfilePopup', welcome: 'welcomeProfilePopup', landing: 'landingProfilePopup', mobile: 'mobileProfilePopup', mobileTop: 'mobileTopProfilePopup' };
      const popup = document.getElementById(ids[ctx] || 'welcomeProfilePopup');
      if (!popup) return;
      const isOpen = popup.classList.contains('open');
      // Close all popups first
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      if (!isOpen) popup.classList.add('open');
    }
    // Close profile popup when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.profile-btn') && !e.target.closest('#mobileMenuBtn') && !e.target.closest('#mobileProfilePopup')) {
        document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      }
    });

    let _boardCache = null;
    let _boardCacheTime = 0;
    const BOARD_CACHE_TTL = 30000; // 30s
    const BOARD_LOCAL_KEY = 'nefroquest-leaderboard';

    // Rate limiting: 1 push por sessão de jogo (evita flood no leaderboard)
    let _boardPushedThisSession = false;

    async function boardFetch(forceRefresh = false) {
      const now = Date.now();
      if (!forceRefresh && _boardCache && (now - _boardCacheTime) < BOARD_CACHE_TTL) return _boardCache;
      try {
        const res = await fetch(`${SUPA_URL}/rest/v1/leaderboard?select=*&order=score.desc,level.desc&limit=50`, {
          headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        _boardCache = data;
        _boardCacheTime = now;
        try { localStorage.setItem(BOARD_LOCAL_KEY, JSON.stringify({ data, ts: now })); } catch(e) {}
        return data;
      } catch(e) {
        console.warn('Leaderboard fetch error:', e);
        if (_boardCache) return _boardCache;
        try {
          const raw = localStorage.getItem(BOARD_LOCAL_KEY);
          if (raw) {
            const { data: localData, ts } = JSON.parse(raw);
            // Usar cache local apenas se < 5 min (stale-while-revalidate offline)
            if (localData && Array.isArray(localData) && (Date.now() - (ts||0)) < 5*60*1000) {
              return localData;
            }
          }
        } catch(e2) {}
        return [];
      }
    }

    async function boardPush(score, level, playerName) {
      // Rate limiting: 1 push por sessão de jogo
      if (_boardPushedThisSession) return;
      // Sanity check: score e level devem ser números positivos razoáveis
      if (typeof score !== 'number' || score < 0 || score > 9_999_999) return;
      if (typeof level !== 'number' || level < 1 || level > 999) return;

      _boardPushedThisSession = true;
      const charName = state.character ? characters[state.character].name : 'Desconhecido';
      const userId = authUser?.id || null;
      const payload = {
        player_name: (playerName || 'Anônimo').substring(0, 40), // limite de tamanho
        character_name: charName,
        score: Math.floor(score),
        level: Math.floor(level),
        chests_opened: Math.max(0, state.chestsOpened || 0),
        best_streak: Math.max(0, state.streak || 0),
        played_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {})
      };
      try {
        // Upsert por user_id quando autenticado (evita entradas duplicadas no ranking)
        const prefer = userId
          ? 'resolution=merge-duplicates,return=minimal'
          : 'return=minimal';
        await fetch(`${SUPA_URL}/rest/v1/leaderboard`, {
          method: 'POST',
          headers: {
            'apikey': SUPA_KEY,
            'Authorization': `Bearer ${await (async()=>{ try { return (await _supaClient?.auth?.getSession())?.data?.session?.access_token || SUPA_KEY; } catch { return SUPA_KEY; } })()}`,
            'Content-Type': 'application/json',
            'Prefer': prefer
          },
          body: JSON.stringify(payload)
        });
        _boardCache = null; // invalidar cache local
      } catch(e) {
        console.warn('Leaderboard push error:', e);
        _boardPushedThisSession = false; // permitir retry em caso de erro de rede
      }
    }

    // Manter compatibilidade com boardGet síncrono (usa cache)
    const boardGet = () => _boardCache || [];
    const boardSave = () => {}; // no-op, Supabase é o storage
    const best = () => { const s = getGameStats(); return s.bestScore || 0; };

    function log(m){const p=document.createElement('p');p.textContent=m;ui.journal.prepend(p);while(ui.journal.children.length>4)ui.journal.lastChild.remove()}
    function total(){
      const base=Object.values(state.equipment).reduce((a,i)=>(a.atk+=i.atk,a.def+=i.def,a.kno+=i.kno,a.luck+=i.luck,a),{atk:0,def:0,kno:0,luck:0});
      if(state.character && characters[state.character]){
        const c=characters[state.character];
        base.atk+=c.bonusAtk||0; base.def+=c.bonusDef||0;
        base.kno+=c.bonusKno||0; base.luck+=c.bonusLuck||0;
      }
      return base;
    }
    function legendaryCount(){return Object.values(state.equipment).filter(i=>i.rar==='legendary').length;}

    function heroMeta(){
      // Títulos personalizados por personagem com gênero correto
      const charTitles = {
        nephros: {
          16: ["Arquimago do Néfron", '', 'l5', "O Soberano da Homeostase"],
          12: ["Lenda Cardiorrenal", '', 'l4', "O Mestre do Equilíbrio Vital"],
          8:  ["Mestre das Glomerulopatias", '', 'l3', "O Guardador dos Glomérulos"],
          5:  ["Guardião da Nefroproteção", '', 'l2', "O Defensor dos Néfrons"],
          3:  ["Sacerdote Renal", '', 'l1', "O Curandeiro dos Túbulos"],
          1:  ["Noviço da Filtração", '', '', "O Iniciante das Águas"]
        },
        aquaria: {
          16: ["Arquimaga do Néfron", '', 'l5', "A Soberana da Homeostase"],
          12: ["Lenda Cardiorrenal", '', 'l4', "A Mestra do Equilíbrio Vital"],
          8:  ["Mestra das Glomerulopatias", '', 'l3', "A Guardiã dos Glomérulos"],
          5:  ["Guardiã da Nefroproteção", '', 'l2', "A Defensora dos Néfrons"],
          3:  ["Sacerdotisa das Águas", '', 'l1', "A Curandeira dos Túbulos"],
          1:  ["Noviça da Filtração", '', '', "A Iniciante das Águas"]
        },
        glomerulus: {
          16: ["Arquicientista do Néfron", '', 'l5', "O Soberano da Ciência Renal"],
          12: ["Lenda da Pesquisa Renal", '', 'l4', "O Mestre da Análise Vital"],
          8:  ["Doutor das Glomerulopatias", '', 'l3', "O Decodificador dos Glomérulos"],
          5:  ["Pesquisador da Nefroproteção", '', 'l2', "O Investigador dos Néfrons"],
          3:  ["Cientista Renal Júnior", '', 'l1', "O Analista dos Túbulos"],
          1:  ["Estudante de Nefrologia", '', '', "O Aprendiz da Ciência Renal"]
        }
      };
      
      const charId = state.character || 'nephros';
      const titles = charTitles[charId] || charTitles.nephros;
      
      // Calcular imagem de evolução baseada no nível (1-10)
      const char = characters[charId];
      const evolutionLevel = Math.min(10, Math.max(1, state.level));
      const ext = charId === 'glomerulus' ? 'png' : 'jpg';
      const charImg = `assets/classes/${char.folder}/nivel_${evolutionLevel.toString().padStart(2,'0')}.${ext}`;
      
      for(const [lv, data] of Object.entries(titles).sort((a,b) => b[0]-a[0])) {
        if(state.level >= parseInt(lv)) {
          data[1] = charImg;
          return data;
        }
      }
      const fallback = titles[1];
      fallback[1] = charImg;
      return fallback;
    }

    const chapters = [
      { lv:1,  title:"Prólogo — As Criptas da Creatinina",       goal:"Estude os fundamentos da nefrologia e sobreviva às primeiras cartas da jornada." },
      { lv:4,  title:"Capítulo II — O Vale da Albuminúria",       goal:"Consolide a estratificação de risco renal e domine a terapia nefroprotetora essencial." },
      { lv:8,  title:"Capítulo III — Torre das Glomerulopatias",  goal:"Domine os sinais de gravidade glomerular e tome decisões de intervenção com precisão." },
      { lv:12, title:"Capítulo IV — Trono Cardiorrenal",          goal:"Integre as terapias complexas do síndrome cardiorrenal e mantenha consistência clínica avançada." },
      { lv:15, title:"Capítulo Final — O Arqui-Nefromante",       goal:"Alcance o domínio supremo da nefrologia e derrote o Arqui-Nefromante de uma vez por todas." }
    ];

    function chapterMeta(){
      let current=chapters[0];
      for(const c of chapters){ if(state.level>=c.lv) current=c; }
      return current;
    }

    const itemIcons = {
      // Armas
      'Bisturi de Plantão':            'assets/images/bisturi_plantao.png',
      'Lâmina da Alça':                'assets/items/lamina_alca.jpg',
      'Estilete Tubular':              'assets/images/estilete_tubular.png',
      'Lança Glomerular':              'assets/items/lanca_glomerular.jpg',
      'Espada Nefroprotetora':         'assets/items/espada_nefroprotetora.jpg',
      'Excalibur do Néfron':           'assets/items/excalibur_nefron.jpg',
      'Cetro do Néfron Eterno':        'assets/images/cetro_nefron.png',
      // Armaduras
      'Jaleco de Plantão':             'assets/items/jaleco_plantao.jpg',
      'Avental Protetor':              'assets/images/avental_protetor.png',
      'Luvas de Látex Reforçadas':     'assets/images/luvas_latex.png',
      'Manto Renocortical':            'assets/items/manto_renocortical.jpg',
      'Égide Dialítica':               'assets/items/egide_dialitica.jpg',
      'Armadura Primeva':              'assets/items/armadura_primeva.jpg',
      'Armadura da Homeostase Perfeita':'assets/items/armadura_homeostase_perfeita.jpg',
      // Relíquias
      'Anel Albuminúrico':             'assets/items/anel_albuminurico.jpg',
      'Estetoscópio Básico':           'assets/images/estetoscopio_basico.png',
      'Prancheta Clínica':             'assets/images/prancheta_clinica.png',
      'Termômetro Digital':            'assets/images/termometro_digital.png',
      'Sigilo KDIGO':                  'assets/items/sigilo_kdigo.jpg',
      'Orbe da Cistatina':             'assets/items/orbe_cistatina.jpg',
      'Relíquia do Título':            'assets/items/reliquia_titulo.jpg',
      'Amuleto do Rim Imortal':        'assets/images/amuleto_rim.png',
      'Elmo do Filtrador Supremo':     'assets/images/elmo_filtrador.png'
    };
    const itemDescriptions = {
      "Bisturi de Plantão": "O bisturi básico de todo interno. Com ele, você corta através da confusão clínica e inicia sua jornada na nefrologia.",
      "Lâmina da Alça": "Forjada na Alça de Henle, esta arma canaliza o poder da concentração urinária para atacar os males renais.",
      "Lança Glomerular": "Imbuída com a força dos glomérulos, perfura as barreiras da doença com precisão cirúrgica.",
      "Espada Nefroprotetora": "Uma lâmina lendária que corta através da fibrose e protege os néfrons da destruição.",
      "Excalibur do Néfron": "A arma suprema dos guardiões renais. Apenas os mais sábios podem empunhar seu poder de cura absoluta.",
      "Túnica de Residência": "O manto básico de todo residente. Oferece proteção mínima, mas representa o início da jornada.",
      "Jaleco de Plantão": "Testado em incontáveis plantões, absorve o cansaço e protege contra os golpes da exaustão.",
      "Manto Renocortical": "Tecido com fibras do córtex renal, oferece defesa contra toxinas e agressões metabólicas.",
      "Égide Dialítica": "Armadura forjada nas chamas da diálise. Purifica ataques tóxicos antes que atinjam seu portador.",
      "Armadura Primeva": "A armadura ancestral dos Nefromantes. Concede imunidade contra todas as formas de injúria renal aguda.",
      "Armadura da Homeostase Perfeita": "A armadura suprema dos mestres da nefrologia. Forjada com cristais de equilíbrio eletrolítico, mantém a homeostase perfeita em qualquer batalha.",
      "Insígnia do Plantão": "Um símbolo de dedicação médica. Aumenta o conhecimento através da experiência clínica diária.",
      "Anel Albuminúrico": "Detecta a presença de proteinúria no ar. Quanto maior a albuminúria, mais brilha sua gema.",
      "Sigilo KDIGO": "Selo sagrado das diretrizes KDIGO. Concede sabedoria ancestral sobre manejo de doença renal crônica.",
      "Orbe da Cistatina": "Uma esfera cristalina que mede a verdadeira filtração glomerular. Revela segredos ocultos da função renal.",
      "Relíquia do Título": "O cálice sagrado dos nefrologistas titulados. Concede maestria absoluta sobre todos os mistérios renais."
    };
    const slotLabels = {weapon:'Arma', armor:'Armadura', relic:'Relíquia'};
    const defaultIcons = {weapon:'assets/items/caneta_interno.jpg', armor:'assets/items/egide_dialitica.jpg', relic:'assets/items/insignia_plantao.jpg'};

    const statTips = {
      atk: {icon:'⚔️', name:'Ataque', desc:'Aumenta pontos ganhos por acerto. Quanto maior, mais pontos por questão correta.'},
      def: {icon:'🛡️', name:'Defesa', desc:'Chance de bloquear perda de vida ao errar. DEF × 1.4% de chance de absorver o golpe.'},
      kno: {icon:'📚', name:'Conhecimento', desc:'Aumenta XP ganho por acerto. +1 XP extra por ponto de conhecimento.'},
      luck: {icon:'🍀', name:'Sorte', desc:'Aumenta ouro ganho e chance de itens raros na forja e drops.'}
    };
    const _ACTIVE_LEGS = new Set(['Excalibur do N\u00e9fron','Armadura Primeva','Amuleto do Rim Imortal','Rel\u00edquia do T\u00edtulo']);
    const _PASSIVE_LEGS = new Set(['Cetro do N\u00e9fron Eterno','Armadura da Homeostase Perfeita','Elmo do Filtrador Supremo']);
    const _LEG_LABELS = {
      'Excalibur do N\u00e9fron':'\u2694\ufe0f Anula 1 dano',
      'Armadura Primeva':'\ud83d\udee1\ufe0f Salva \u00faltima vida',
      'Amuleto do Rim Imortal':'\ud83d\udc9c Revive 1\u00d7',
      'Rel\u00edquia do T\u00edtulo':'\ud83d\udcd6 Pular 1 quest\u00e3o',
      'Cetro do N\u00e9fron Eterno':'\ud83d\udcb0 +30 ouro (streak\u22655)',
      'Armadura da Homeostase Perfeita':'\ud83d\udee1\ufe0f DEF amplificado',
      'Elmo do Filtrador Supremo':'\u2728 +25% ouro sempre',
    };

    function renderEquip(){
      const st=total();
      ui.equipList.innerHTML=Object.entries(state.equipment).map(([k,v])=>{
        const isEmpty = v.n === 'Vazio';
        const icon = isEmpty ? '' : (itemIcons[v.n] || defaultIcons[k]);
        const desc = isEmpty ? 'Slot vazio. Forje itens para equipar!' : (itemDescriptions[v.n] || '');
        const isActive = _ACTIVE_LEGS.has(v.n);
        const isPassive = _PASSIVE_LEGS.has(v.n);
        const wasUsed = !!(state.legendaryAbilityUsed && state.legendaryAbilityUsed[v.n]);
        const glowCls = (v.rar==='legendary') ? (isPassive ? 'legendary-passive' : (wasUsed ? 'legendary-used' : 'legendary-active')) : '';
        const slotCls = (isActive && !wasUsed) ? 'slot has-active-ability' : (isActive && wasUsed) ? 'slot has-used-ability' : 'slot';
        const abilityBadge = (isActive||isPassive) ? `<div style="font-size:0.6rem;color:${wasUsed?'#64748b':isPassive?'rgba(255,215,0,0.7)':'#ffd700'};margin-top:2px">${wasUsed?'\u2713 usada':_LEG_LABELS[v.n]||''}</div>` : '';
        const imgHtml = isEmpty 
          ? `<div class='slot-icon' style='display:flex;align-items:center;justify-content:center;background:rgba(10,15,30,0.8);border:2px dashed var(--blue-dark);color:#3a5a8a;font-size:1.5rem'>?</div>`
          : `<img class='slot-icon ${glowCls} item-with-tooltip' loading='lazy' src='${icon}' alt="${v.n.replace(/"/g,'&quot;')}" data-item-name="${v.n.replace(/"/g,'&quot;')}" data-item-desc="${desc.replace(/"/g,'&quot;')}"/>`;
        return `<div class='${slotCls}'>
          ${imgHtml}
          <div class='slot-info'>
            <div class='slot-name'><span class='rar-${v.rar}'>${v.n}</span>${abilityBadge}</div>
            <div class='slot-stats'>
              <span class='stat-badge'>⚔️${v.atk}<span class='stat-tip'><strong>${statTips.atk.icon} ${statTips.atk.name}</strong><br>${statTips.atk.desc}</span></span>
              <span class='stat-badge'>🛡️${v.def}<span class='stat-tip'><strong>${statTips.def.icon} ${statTips.def.name}</strong><br>${statTips.def.desc}</span></span>
              <span class='stat-badge'>📚${v.kno}<span class='stat-tip'><strong>${statTips.kno.icon} ${statTips.kno.name}</strong><br>${statTips.kno.desc}</span></span>
              <span class='stat-badge'>🍀${v.luck}<span class='stat-tip'><strong>${statTips.luck.icon} ${statTips.luck.name}</strong><br>${statTips.luck.desc}</span></span>
            </div>
          </div>
        </div>`;
      }).join('');
      const totalHTML = `<strong style='color:var(--gold)'>Atributos Totais:</strong>
        <span class='stat-badge'>⚔️${st.atk}<span class='stat-tip'><strong>${statTips.atk.icon} ${statTips.atk.name}</strong><br>${statTips.atk.desc}</span></span>
        <span class='stat-badge'>🛡️${st.def}<span class='stat-tip'><strong>${statTips.def.icon} ${statTips.def.name}</strong><br>${statTips.def.desc}</span></span>
        <span class='stat-badge'>📚${st.kno}<span class='stat-tip'><strong>${statTips.kno.icon} ${statTips.kno.name}</strong><br>${statTips.kno.desc}</span></span>
        <span class='stat-badge'>🍀${st.luck}<span class='stat-tip'><strong>${statTips.luck.icon} ${statTips.luck.name}</strong><br>${statTips.luck.desc}</span></span>`;
      // Synergy banner when all 3 slots are legendary
      const _synergyActive = legendaryCount()===3;
      const synergyBanner = _synergyActive
        ? `<div style='text-align:center;margin-top:6px;padding:5px 10px;background:linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,140,0,0.1));border-radius:8px;border:1px solid rgba(255,215,0,0.5);font-size:0.7rem;color:#ffd700;animation:legendaryPassiveGlow 3s ease-in-out infinite'>✨ Sinergia Lendária — +20% XP</div>`
        : '';
      // Desktop: no final da lista de equipamentos
      ui.equipList.innerHTML+=`<div style='text-align:center;margin-top:8px;padding:6px 10px;background:rgba(42,74,122,0.2);border-radius:8px;border:1px solid rgba(42,74,122,0.4);font-size:0.75rem;color:#b0c4e8'>${totalHTML}</div>${synergyBanner}`;
      // Mobile: logo abaixo do herói
      const equipTotalMobile = document.getElementById('equipTotalMobile');
      if(equipTotalMobile) {
        equipTotalMobile.innerHTML = totalHTML;
        equipTotalMobile.style.display = window.innerWidth <= 768 ? 'block' : 'none';
      }
    }

    function renderHUD(){
      const [c,img,cls,title]=heroMeta();
      const chapter=chapterMeta();
      ui.heroClass.textContent=c;
      ui.heroTitle.textContent=title;
      // Badge de campeão ao lado do nome quando completou o jogo
      const existingChampBadge = document.getElementById('championBadgeHUD');
      if(state.completedGame || state.gameCompleted) {
        if(!existingChampBadge) {
          const champBadge = document.createElement('img');
          champBadge.id = 'championBadgeHUD';
          champBadge.src = 'assets/badges/champion.png';
          champBadge.alt = 'Campeão';
          champBadge.title = 'Campeão do NefroQuest';
          champBadge.style.cssText = 'width:28px;height:28px;border-radius:50%;border:2px solid var(--gold);box-shadow:0 0 10px rgba(218,165,32,0.5);position:absolute;top:5px;right:5px;';
          const heroCard = ui.heroImg.closest('.hero-card');
          if(heroCard) { heroCard.style.position='relative'; heroCard.appendChild(champBadge); }
        }
      } else if(existingChampBadge) { existingChampBadge.remove(); }
      ui.heroImg.src=img; ui.heroImg.className=`portrait ${cls}`;
      ui.storyTitle.textContent=chapter.title;
      ui.storyGoal.textContent=`Objetivo: ${chapter.goal}`;
      ui.level.textContent=state.level; ui.score.textContent=state.score;
      const _ml=state.maxLives||3; ui.lives.innerHTML='<span style="color:#ef4444">❤</span>'.repeat(Math.max(0,state.lives))+'<span style="color:#555">♡</span>'.repeat(Math.max(0,_ml-Math.max(0,state.lives)));
      ui.record.textContent=best(); ui.gold.textContent=state.gold;
      // Streak visual com multiplicador
      const sm = getStreakMultiplier(state.streak);
      const streakTile = ui.streak.closest('.tile');
      if(streakTile) {
        streakTile.className = 'tile tile-streak';
        ui.streak.textContent = state.streak;
      } else {
        ui.streak.textContent = state.streak;
      }
      ui.xpFill.style.width=`${Math.min(100,(state.xp/state.xpToNext)*100)}%`;
      const _qDone = state.idx;
      const _qTotal = state.queue.length;
      ui.xpTxt.textContent=`XP ${state.xp}/${state.xpToNext}`;
      const _qCtr = document.getElementById('questionCounterTxt');
      if (_qCtr) _qCtr.textContent = `${state.correctTotal}/${topics.length} questões`;
      // Barra de progresso do ciclo
      const _cpf = document.getElementById('cycleProgressFill');
      const _cpt = document.getElementById('cycleProgressTxt');
      if (_cpf) _cpf.style.width = (_qTotal > 0 ? (_qDone/_qTotal*100).toFixed(1) : 0) + '%';
      if (_cpt) _cpt.textContent = `Questão ${_qDone} de ${_qTotal}`;
      renderEquip();
      // Atualizar dock de ações (usando elementos cacheados no objeto ui)
      const {dockForgeBtn:forgeBtn, dockChestBtn:chestBtn, dockLegBtn:legBtn, dockChestCost:chestCostBadge} = ui;
      // Botões sempre ativos — popup de confirmação informa custo e disponibilidade
      if(forgeBtn){ forgeBtn.classList.remove('disabled'); forgeBtn.style.pointerEvents='auto'; forgeBtn.style.opacity='1'; }
      if(legBtn){ legBtn.classList.remove('disabled'); legBtn.style.pointerEvents='auto'; legBtn.style.opacity='1'; }
      if(chestBtn){ chestBtn.classList.remove('disabled'); chestBtn.style.pointerEvents='auto'; chestBtn.style.opacity='1'; }

      // Badges ! removidos — popup de confirmação já informa custo e disponibilidade

      // === BARRA DE STATUS MOBILE (ouro/streak/vidas) ===
      const msbGoldEl = document.getElementById('msbGold');
      const msbStreakEl = document.getElementById('msbStreak');
      const msbLivesEl = document.getElementById('msbLivesIcons');
      if(msbGoldEl) msbGoldEl.textContent = state.gold;
      if(msbStreakEl) msbStreakEl.textContent = state.streak;
      if(msbLivesEl) {
        const lives = Math.max(0, state.lives);
        const maxLives = state.maxLives || 3;
        msbLivesEl.innerHTML =
          '<span style="color:#ef4444">❤</span>'.repeat(Math.min(lives, maxLives)) +
          '<span style="color:#555">♡</span>'.repeat(Math.max(0, maxLives - lives));
      }
    }

     // ── Sistema de randomização com histórico ──────────────────────────────
    // Mantém os IDs das últimas N questões vistas para impedir repetição
    // mesmo na virada de ciclo. Tamanho do histórico = 20% do banco.
    const HISTORY_SIZE = Math.max(30, Math.floor(questionBank.length * 0.20));
    let _recentIds = []; // fila circular dos últimos IDs vistos
    let _masteredSet = (() => {
      try {
        const raw = JSON.parse(localStorage.getItem(MASTERED_KEY) || "[]");
        // Migração: IDs antigos eram number — descartar apenas tipos não-string
        const valid = raw.filter(id => typeof id === "string" && id.length > 0);
        return new Set(valid);
      }
      catch(e) { return new Set(); }
    })();

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function shuffleQueue() {
      // Separar por dificuldade e embaralhar cada grupo
      // Dentro de cada grupo: não-dominadas primeiro, dominadas por último
      function splitMastered(arr) {
        const fresh    = shuffle(arr.filter(q => !_masteredSet.has(q.id)));
        const mastered = shuffle(arr.filter(q =>  _masteredSet.has(q.id)));
        return [...fresh, ...mastered];
      }
      const easy   = splitMastered(questionBank.filter(q => q._d === 'easy'));
      const medium = splitMastered(questionBank.filter(q => q._d === 'medium'));
      const hard   = splitMastered(questionBank.filter(q => q._d === 'hard'));
      // Proporção por dificuldade do modo de jogo
      // easy:     2e:2m:1h | normal: 1e:2m:2h | hard: 0e:1m:3h | hardcore: somente hard
      const diff = state.difficulty || 'normal';
      const interleaved = [];
      const ei = [...easy], mi = [...medium], hi = [...hard];
      if (diff === 'hardcore') {
        // Somente questões difíceis
        interleaved.push(...hi);
      } else {
        while (ei.length || mi.length || hi.length) {
          if (diff === 'easy') {
            if (ei.length) interleaved.push(ei.shift());
            if (ei.length) interleaved.push(ei.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
          } else if (diff === 'hard') {
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
            if (hi.length) interleaved.push(hi.shift());
            if (hi.length) interleaved.push(hi.shift());
          } else {
            // normal
            if (ei.length) interleaved.push(ei.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
            if (mi.length) interleaved.push(mi.shift());
            if (hi.length) interleaved.push(hi.shift());
          }
        }
      }
      // Mover para o final qualquer questão que esteja no histórico recente
      // (evita repetição imediata na virada de ciclo)
      const blocked = new Set(_recentIds);
      const front = interleaved.filter(q => !blocked.has(q.id));
      const back  = shuffle(interleaved.filter(q =>  blocked.has(q.id)));
      state.queue = [...front, ...back];
      state.idx = 0;
    }

    function drawQuestion() {
      if (state.idx >= state.queue.length) { finishDeck(); return null; }
      const q = state.queue[state.idx++];
      // Registrar no histórico recente
      _recentIds.push(q.id);
      if (_recentIds.length > HISTORY_SIZE) _recentIds.shift();
      return q;
    }
    function renderRefs(keys){
      const list = keys.map(k => refsDB[k]).filter(Boolean);
      if(!list.length){ ui.refs.innerHTML=''; return; }

      // Determinar cor de acento baseada no badge dominante
      const hasRCT = list.some(r => r.badge === 'RCT');
      const accentColor = hasRCT ? '#10b981' : '#6366f1';

      const cardsHTML = list.map((ref, i) => {
        const accent = ref.badgeColor || '#6366f1';
        const impactoClass = (ref.impacto && (ref.impacto.includes('↓') || ref.impacto.includes('superior') || ref.impacto.includes('reduz'))) ? 'green' :
                             (ref.impacto && (ref.impacto.includes('não') || ref.impacto.includes('n\u00e3o'))) ? 'amber' : '';
        const copyText = [ref.label, ref.journal, ref.ano].filter(Boolean).join('. ');
        return `
          <div class="ref-card" style="--ref-accent:${accent}">
            <div class="ref-card-top">
              <span class="ref-icon">${ref.icon || '📄'}</span>
              <span class="ref-title">${escapeHtml(ref.label)}</span>
              <span class="ref-badge" style="background:${accent}">${escapeHtml(ref.badge || 'REF')}</span>
            </div>
            <div class="ref-meta">
              <span class="ref-journal">${escapeHtml(ref.journal || '')}</span>
              ${ref.ano ? `<span class="ref-year">${escapeHtml(String(ref.ano))}</span>` : ''}
              ${ref.tipo ? `<span class="ref-tipo">${escapeHtml(ref.tipo)}</span>` : ''}
            </div>
            ${ref.impacto ? `<div class="ref-impacto ${impactoClass}">${escapeHtml(ref.impacto)}</div>` : ''}
            <button class="ref-copy-btn" data-action="_copyRefBtn" data-pass-this="1" data-copy-text="${escapeHtml(copyText)}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              copiar referência
            </button>
          </div>`;
      }).join('');

      ui.refs.innerHTML = `
        <div class="refs-header">Evidência Científica</div>
        <div class="ref-cards">${cardsHTML}</div>
      `;
    }

    function _copyRef(btn, text) {
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '✓ copiado';
        btn.style.color = '#6ee7b7';
        btn.style.borderColor = 'rgba(110,231,183,0.4)';
        setTimeout(() => {
          btn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> copiar referência';
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 2000);
      }).catch(() => {});
    }

    function renderQuestion(){
      // Mostrar barra de status mobile apenas na tela de perguntas
      const _msb = document.getElementById('mobileStatusBar');
      if(_msb) _msb.classList.add('active');
      state.answered=false;
      const q=drawQuestion();
      if(!q) return;
      state.current=q;
      ui.question.textContent=q.q;
      ui.options.innerHTML='';
      ui.feedback.className='feedback';
      ui.feedback.textContent='Escolha a melhor alternativa clínica.';
      renderRefs(q.r);
      ui.nextBtn.classList.add('hidden');
      ui.bonusBtn.classList.add('hidden');
      if (!q.o || !Array.isArray(q.o)) return;
      q.o.forEach((opt,i)=>{
        const b=document.createElement('button');
        b.className='option'; b.type='button';
        b.dataset.idx=i;
        b.textContent=`${String.fromCharCode(65+i)}) ${opt}`;
        ui.options.appendChild(b);
      });
      // Relíquia do Título: botão de pular questão (1× por jogo)
      const _skipBtn = document.getElementById('skipQuestionBtn');
      if(state.equipment?.relic?.n === 'Relíquia do Título' && !state.legendaryAbilityUsed?.['Relíquia do Título']) {
        if(!_skipBtn) {
          const sb = document.createElement('button');
          sb.id = 'skipQuestionBtn';
          sb.className = 'skip-question-btn visible';
          sb.innerHTML = '📖 Pular esta questão (Relíquia do Título — 1×)';
          sb.onclick = () => {
            state.legendaryAbilityUsed['Relíquia do Título'] = true;
            sb.remove();
            log('📖 Relíquia do Título usada — questão pulada sem penalidade.');
            renderEquip();
            renderQuestion();
          };
          ui.options.parentElement.insertBefore(sb, ui.options.nextSibling);
        } else {
          _skipBtn.classList.add('visible');
        }
      } else if(_skipBtn) {
        _skipBtn.remove();
      }
      // ── Confronto Final: atualiza UI do boss e injeta badges ──
      updateBossUI();
      applyBossOptionBadges();
    }

    function flagQuestion() {
      const q = state.current;
      if (!q) return;
      document.getElementById('flagPopup')?.remove();
      const qNum = q.id || '?';
      const qText = (q.q || '').substring(0, 300);
      const popup = document.createElement('div');
      popup.id = 'flagPopup';
      popup.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);padding:32px 16px;';
      popup.innerHTML = `
        <div style="background:linear-gradient(180deg,#1a2a4a,#0e1830);border:2px solid #6366f1;border-radius:14px;padding:24px;max-width:500px;width:100%;box-shadow:0 0 40px rgba(99,102,241,0.3);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="color:#a5b4fc;font-family:'Cinzel',serif;font-size:1rem;letter-spacing:1px;">🚩 Sinalizar Erro na Questão</h3>
            <button data-remove-id="flagPopup" style="background:none;border:none;color:#64748b;font-size:1.4rem;cursor:pointer;line-height:1;">×</button>
          </div>
          <p style="font-size:0.78rem;color:#64748b;margin-bottom:6px;">Questão #${qNum}</p>
          <p style="font-size:0.82rem;color:#94a3b8;background:rgba(30,40,70,0.5);border-radius:8px;padding:10px;margin-bottom:14px;font-style:italic;line-height:1.5;">"${escapeHtml(qText)}"</p>
          <label style="font-size:0.82rem;color:#93b4e8;display:block;margin-bottom:6px;">Descreva o problema:</label>
          <div style="margin-bottom:10px;">
  <div style="color:var(--txt-dim);font-size:0.75rem;margin-bottom:6px;">Tipo de problema:</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;" id="flagCategoryChips">
    <button type="button" class="flag-chip selected" data-cat="resposta_incorreta" style="padding:4px 10px;border-radius:20px;border:1px solid rgba(251,113,133,0.6);background:rgba(251,113,133,0.15);color:#fca5a5;font-size:0.75rem;cursor:pointer;">❌ Resposta incorreta</button>
    <button type="button" class="flag-chip" data-cat="desatualizada" style="padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:var(--txt-dim);font-size:0.75rem;cursor:pointer;">📅 Desatualizada</button>
    <button type="button" class="flag-chip" data-cat="ambigua" style="padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:var(--txt-dim);font-size:0.75rem;cursor:pointer;">🤔 Ambígua</button>
    <button type="button" class="flag-chip" data-cat="erro_texto" style="padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:var(--txt-dim);font-size:0.75rem;cursor:pointer;">✏️ Erro de texto</button>
    <button type="button" class="flag-chip" data-cat="outra" style="padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:var(--txt-dim);font-size:0.75rem;cursor:pointer;">💬 Outra</button>
  </div>
</div>
          <textarea id="flagComment" rows="3" placeholder="Ex: A alternativa B está incorreta pois... / O gabarito deveria ser..."
            style="width:100%;background:rgba(10,20,40,0.8);border:1px solid var(--blue-dark);border-radius:8px;color:#d5e2ff;font-size:0.85rem;padding:10px;resize:vertical;font-family:'Philosopher',serif;outline:none;box-sizing:border-box;"></textarea>
          <div id="flagStatus" style="min-height:20px;margin-top:8px;font-size:0.78rem;text-align:center;"></div>
          <button data-action="submitFlag" data-arg="${qNum}" data-arg-type="number" id="flagSendBtn"
            style="width:100%;margin-top:10px;background:linear-gradient(180deg,#4f46e5,#3730a3);border:2px solid #6366f1;color:#fff;border-radius:8px;padding:12px;font-family:'Cinzel',serif;font-size:0.82rem;font-weight:700;letter-spacing:1px;cursor:pointer;text-transform:uppercase;">
            📧 Enviar
          </button>
        </div>`;
      document.body.appendChild(popup);
      document.getElementById('flagCategoryChips')?.addEventListener('click', e => {
        const chip = e.target.closest('.flag-chip');
        if (!chip) return;
        document.querySelectorAll('.flag-chip').forEach(c => {
          c.style.background = 'transparent';
          c.style.borderColor = 'rgba(255,255,255,0.15)';
          c.style.color = 'var(--txt-dim)';
          c.classList.remove('selected');
        });
        chip.classList.add('selected');
        chip.style.background = 'rgba(251,113,133,0.15)';
        chip.style.borderColor = 'rgba(251,113,133,0.6)';
        chip.style.color = '#fca5a5';
      });
      popup.addEventListener('click', e => { if(e.target===popup) popup.remove(); });
      setTimeout(() => document.getElementById('flagComment')?.focus(), 100);
    }

    async function submitFlag(qNum) {
      const comment = (document.getElementById('flagComment')?.value || '').trim();
      const selectedCat = document.querySelector('.flag-chip.selected')?.dataset?.cat || 'outra';
      const catLabels = { resposta_incorreta:'Resposta incorreta', desatualizada:'Desatualizada', ambigua:'Ambígua', erro_texto:'Erro de texto', outra:'Outra' };
      const catLabel = catLabels[selectedCat] || 'Outra';
      const q = state.current;
      const qText = (q?.q || '').substring(0, 500);
      const btn = document.getElementById('flagSendBtn');
      const status = document.getElementById('flagStatus');

      btn.disabled = true;
      btn.textContent = 'Enviando...';
      status.style.color = '#93b4e8';
      status.textContent = '';

      const body = {
        access_key: FLAG_API_KEY,
        subject: `[NefroQuest] ${catLabel} — Questão #${qNum}`,
        from_name: 'NefroQuest — Sinalização de Erro',
        message:
          `Questão #${qNum}\n\n` +
          `Tipo: ${catLabel}\n\n` +
          `ENUNCIADO:\n"${qText}"\n\n` +
          `COMENTÁRIO DO JOGADOR:\n${comment || '(sem comentário adicional)'}`,
      };

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) {
          status.style.color = '#4ade80';
          status.textContent = '✅ Erro enviado! Obrigado pelo feedback.';
          setTimeout(() => document.getElementById('flagPopup')?.remove(), 2000);
          log('🚩 Erro na questão #' + qNum + ' sinalizado com sucesso!');
        } else {
          throw new Error(data.message || 'Falha no envio');
        }
      } catch (err) {
        status.style.color = '#f87171';
        status.textContent = '❌ Falha ao enviar. Verifique a chave da API.';
        btn.disabled = false;
        btn.textContent = '📧 Enviar';
        console.error('[Flag]', err);
      }
    }

    function xpForLevel(lv) {
      // xpToNext = 200 * 1.15^(lv-1), garante ~10 questões no nível 1
      return Math.floor(200 * Math.pow(1.15, lv - 1));
    }
    function gainXP(x){
      state.xp+=x; let up=0;
      while(state.xp>=state.xpToNext){
        state.xp-=state.xpToNext; state.level++; state.xpToNext=xpForLevel(state.level); up++;
        if (_guestMode && state.level === 2) _showGuestHook();
        _track('level_up', { level: state.level, difficulty: state.difficulty });
      }
      return up;
    }

    function allItemsMaxed(){
      // Verifica se todos os 3 slots têm qualquer item legendary equipado
      return Object.keys(items).every(slot => state.equipment[slot]?.rar === 'legendary');
    }

     function rollItem(diff,luck){
      // Coletar nomes de itens já equipados
      const equipped = Object.values(state.equipment).map(e=>e.n);
      
      // Tentar até 20 vezes para não repetir item
      for(let attempt=0; attempt<20; attempt++){
        const slots=Object.keys(items),slot=slots[Math.floor(Math.random()*slots.length)];
        const bonus=Math.min(2,Math.floor((luck+diff)/8));
        const pool=[...rarityWeight,...(bonus?["rare","epic"].slice(0,bonus):[])];        const rar=pool[Math.floor(Math.random()*pool.length)];
        const cand=items[slot].filter(i=>i.rar===rar && !equipped.includes(i.n));
        if(cand.length>0) return{slot,item:cand[Math.floor(Math.random()*cand.length)]};
      }
      // Fallback: qualquer item
      const slots=Object.keys(items),slot=slots[Math.floor(Math.random()*slots.length)];
      const allItems=items[slot];
      return{slot,item:allItems[Math.floor(Math.random()*allItems.length)]};
    }

    const _rarSellVal = {common:20,uncommon:40,rare:80,epic:150,legendary:300};
    const _rarLabel = {common:'Comum',uncommon:'Incomum',rare:'Raro',epic:'Épico',legendary:'Lendário'};
    function _itemSellVal(it){ return _rarSellVal[it.rar]||20; }

    function showEquipComparePopup(slot, oldItem, newItem, onReplace, onKeep) {
      const def = defaultIcons[slot] || '';
      function _statRow(label, oldV, newV) {
        const diff = newV - oldV;
        const diffStr = diff > 0 ? `<span class="pos">+${diff}</span>` : diff < 0 ? `<span class="neg">${diff}</span>` : `<span>—</span>`;
        return `<span>${label} <b>${oldV}</b></span><span>${label} <b>${newV}</b> ${diffStr}</span>`;
      }
      const ov = el => `
        <div class="equip-compare-slot">
          <div class="equip-compare-label">Equipado</div>
          <img src="${itemIcons[el.n]||def}" onerror="this.src='${def}'" alt="${el.n}">
          <div class="ecp-name">${el.n}</div>
          <div class="ecp-rar ${el.rar}">${_rarLabel[el.rar]||el.rar}</div>
          <div class="ecp-stats">
            <span>⚔️ ATK <b>${el.atk}</b></span>
            <span>🛡️ DEF <b>${el.def}</b></span>
            <span>📚 CONH <b>${el.kno}</b></span>
            <span>🍀 SORTE <b>${el.luck}</b></span>
          </div>
        </div>`;
      const nv = el => `
        <div class="equip-compare-slot" style="border-color:rgba(255,215,0,0.4)">
          <div class="equip-compare-label" style="color:#ffd700">Novo item</div>
          <img src="${itemIcons[el.n]||def}" onerror="this.src='${def}'" alt="${el.n}">
          <div class="ecp-name">${el.n}</div>
          <div class="ecp-rar ${el.rar}">${_rarLabel[el.rar]||el.rar}</div>
          <div class="ecp-stats">
            ${['atk','def','kno','luck'].map(s => {
              const icons = {atk:'⚔️',def:'🛡️',kno:'📚',luck:'🍀'};
              const diff = el[s] - oldItem[s];
              const cls = diff>0?'pos':diff<0?'neg':'';
              const diffStr = diff>0?`+${diff}`:diff<0?`${diff}`:'';
              return `<span>${icons[s]} <b>${el[s]}</b>${diffStr?' <span class="'+cls+'">('+diffStr+')</span>':''}</span>`;
            }).join(' ')}
          </div>
        </div>`;
      const sellVal = _itemSellVal(newItem);
      document.getElementById('equipCompareOverlay')?.remove();
      const overlay = document.createElement('div');
      overlay.className = 'equip-compare-overlay';
      overlay.id = 'equipCompareOverlay';
      overlay.innerHTML = `
        <div class="equip-compare-card">
          <div class="equip-compare-title">⚔️ Substituir ${slotLabels[slot]||slot}?</div>
          <div class="equip-compare-body">
            ${ov(oldItem)}
            <div class="equip-compare-arrow">→</div>
            ${nv(newItem)}
          </div>
          <div class="equip-compare-actions">
            <button class="equip-compare-replace" id="ecpReplace">⬆️ Substituir</button>
            <button class="equip-compare-keep" id="ecpKeep">💰 Manter atual (vender por ${sellVal}🪙)</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#ecpReplace').onclick = () => { overlay.remove(); onReplace(); };
      overlay.querySelector('#ecpKeep').onclick   = () => { overlay.remove(); onKeep(); };
    }

    function equipOrSell(slot, item, onDone) {
      // Items always go into their designated slot type
      const currentItem = state.equipment[slot];
      if (!currentItem || currentItem.n === 'Vazio') {
        // Slot empty — equip directly
        state.equipment[slot] = item;
        const msg = `⬆️ Equipou **${item.n}** (${item.rar}) no slot ${slotLabels[slot]||slot}.`;
        if (onDone) onDone(msg); else return msg;
        return;
      }
      // Slot occupied — show comparison popup
      showEquipComparePopup(slot, currentItem, item,
        () => {
          // Replace: sell old
          const val = _itemSellVal(currentItem);
          state.gold += val;
          state.equipment[slot] = item;
          const msg = `⬆️ ${slotLabels[slot]}: **${currentItem.n}** → **${item.n}**. ${currentItem.n} convertido em ${val}💰.`;
          if (onDone) onDone(msg);
          renderHUD(); updateBadges(); saveGame();
        },
        () => {
          // Keep old: sell new
          const val = _itemSellVal(item);
          state.gold += val;
          const msg = `💰 ${item.n} (${item.rar}) vendido por ${val}💰 — ${slotLabels[slot]} atual mantida.`;
          if (onDone) onDone(msg);
          renderHUD(); updateBadges(); saveGame();
        }
      );
    }

    // ============ PAYWALL ============
    function showPaywallModal() {
      let modal = document.getElementById('paywallModal');
      if (modal) { modal.classList.add('show'); return; }
      _track('paywall_shown', { questions_answered: state.correctTotal, level: state.level });
      modal = document.createElement('div');
      modal.id = 'paywallModal';
      modal.className = 'show';
      const guestBtns = !authUser ? `
        <button class="btn" style="background:rgba(96,165,250,0.12);border:2px solid rgba(96,165,250,0.5);color:var(--blue)" data-action="paywallRegister">📝 Criar conta gratuita</button>
        <button class="btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2)" data-action="paywallLogin">Já tenho conta — Entrar</button>
      ` : '';
      modal.innerHTML = `
        <div class="paywall-content">
          <div style="font-size:2.6rem;margin-bottom:12px;">🏰</div>
          <h2>Jornada Gratuita Concluída</h2>
          <p>Você respondeu <strong style="color:#ffd700">${FREE_QUESTIONS_LIMIT} questões gratuitas</strong>.<br>
          Desbloqueie o acesso completo para continuar sua jornada nefrológica!</p>
          <div class="paywall-price">
            <div class="price-amount">${PRICE_LIFETIME}</div>
            <div class="price-desc">Acesso vitalício · Todas as questões · Futuras atualizações</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="btn gold" data-action="paywallUpgrade">✨ Desbloquear Acesso Premium</button>
            ${guestBtns}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    function paywallUpgrade() {
      // Abre modal de escolha de plano para upgrade
      document.getElementById('paywallModal')?.classList.remove('show');
      showPricingModal();
    }
    function paywallLogin() {
      document.getElementById('paywallModal')?.classList.remove('show');
      openAuthModal();
      switchAuthTab('entrar');
    }
    function paywallRegister() {
      document.getElementById('paywallModal')?.classList.remove('show');
      openAuthModal();
      switchAuthTab('cadastrar');
    }

    // ============ PRICING MODAL ============
    function showPricingModal() {
      document.getElementById('pricingModal')?.remove();
      const modal = document.createElement('div');
      modal.id = 'pricingModal';
      modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.94);z-index:9998;align-items:center;justify-content:center;backdrop-filter:blur(10px);padding:32px 16px;overflow-y:auto;';
      const isPt = _lang === 'pt';
      const tagline = isPt
        ? 'Domine a Nefrologia com o método que funciona — questões clínicas reais, RPG e ciência de ponta.'
        : 'Master Nephrology with a method that works — real clinical questions, RPG & cutting-edge science.';
      modal.innerHTML = `
        <div class="pricing-wrap" style="position:relative;">
          <button class="pricing-close-btn" data-action="closePricingModal">✕</button>
          <div class="pricing-ornament">✦ Reino dos Néfrons ✦</div>
          <h2>NefroQuest</h2>
          <div class="pricing-sub-title">Ascension</div>
          <p>${tagline}</p>
          <div class="pricing-stats-row">
            <div class="pricing-stat-pill">🧠 <strong>${questionBank.length}</strong> questões de nefrologia</div>
            <div class="pricing-stat-pill">🔄 Atualizado <strong>constantemente</strong></div>
            <div class="pricing-stat-pill">🏥 Foco em <strong>residência &amp; título</strong></div>
          </div>
          <div class="pricing-cards">
            <div class="pricing-card">
              <div class="pricing-icon">🎓</div>
              <h3>Gratuito</h3>
              <div class="pricing-amount">${isPt ? 'R$0' : 'US$0'}</div>
              <div class="pricing-period">${isPt ? 'para sempre' : 'forever'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>${FREE_QUESTIONS_LIMIT} questões de nefrologia</li>
                <li>Todos os personagens</li>
                <li>Ranking global</li>
                <li class="pf-no">Modo de Estudo por tema</li>
                <li class="pf-no">${questionBank.length} questões completas</li>
                <li class="pf-no">Atualizações e novos conteúdos</li>
              </ul>
              <button class="pricing-choose-btn btn-free" data-action="pricingChoose" data-arg="free">${isPt ? 'Começar Grátis' : 'Start Free'}</button>
            </div>
            <div class="pricing-card featured">
              <div class="pricing-badge">⭐ ${isPt ? 'MAIS POPULAR' : 'MOST POPULAR'}</div>
              <div class="pricing-icon">⚡</div>
              <h3>${isPt ? 'Mensal' : 'Monthly'}</h3>
              <div class="pricing-amount">${PRICE_MONTHLY}</div>
              <div class="pricing-period">${isPt ? 'por mês · cancele quando quiser' : 'per month · cancel anytime'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>${questionBank.length} questões de nefrologia</li>
                <li>Modo de Estudo por tema</li>
                <li>Jornada RPG completa</li>
                <li>Ranking global</li>
                <li>Novos conteúdos todo mês</li>
                <li>Apoia o desenvolvimento da ferramenta</li>
              </ul>
              <button class="pricing-choose-btn btn-monthly" data-action="pricingChoose" data-arg="monthly">${isPt ? 'Assinar Agora' : 'Subscribe Now'}</button>
            </div>
            <div class="pricing-card">
              <div class="pricing-icon">👑</div>
              <h3>${isPt ? 'Vitalício' : 'Lifetime'}</h3>
              <div class="pricing-amount">${PRICE_LIFETIME}</div>
              <div class="pricing-period">${isPt ? 'pagamento único · acesso forever' : 'one-time payment · access forever'}</div>
              <hr class="pricing-divider">
              <ul class="pricing-features">
                <li>Tudo do plano Mensal</li>
                <li>Todas as futuras atualizações</li>
                <li>Melhor custo-benefício</li>
                <li>Acesso vitalício garantido</li>
                <li>Maior contribuição ao projeto</li>
                <li>Formação de nefrologistas para sempre</li>
              </ul>
              <button class="pricing-choose-btn btn-lifetime" data-action="pricingChoose" data-arg="lifetime">${isPt ? 'Compra Única' : 'Buy Once'}</button>
            </div>
          </div>
          <button class="pricing-login-link" data-action="_pricingToLogin">${isPt ? 'Já tenho conta — Entrar' : 'I have an account — Sign in'}</button>
        </div>`;
      document.body.appendChild(modal);
    }
    function closePricingModal() {
      document.getElementById('pricingModal')?.remove();
      // Se não autenticado, volta para a landing — sem opção de jogar sem conta
      if (!authUser && !_guestMode) {
        document.getElementById('welcomeScreen')?.classList.add('hidden');
        document.getElementById('landingScreen')?.classList.remove('hidden');
      }
    }

    // ── Banner promocional a cada 10 questões (free) ──
    let _lastPromoBannerAt = 0;
    function _checkPromoBanner() {
      if (isPremium()) return;
      const total = getGameStats().questionsAnsweredAllTime || 0;
      if (total < 10) return;
      if (total >= FREE_QUESTIONS_LIMIT) return; // paywall já cuida disso
      if (total % 10 !== 0) return;
      if (total === _lastPromoBannerAt) return;
      _lastPromoBannerAt = total;
      _showPromoBanner(total);
    }
    function _showPromoBanner(count) {
      document.getElementById('promoBannerOverlay')?.remove();
      const remaining = FREE_QUESTIONS_LIMIT - count;
      const overlay = document.createElement('div');
      overlay.id = 'promoBannerOverlay';
      overlay.className = 'promo-banner-overlay';
      overlay.innerHTML = `
        <div class="promo-banner">
          <div class="promo-banner-icon">🧠</div>
          <div class="promo-banner-body">
            <div class="promo-banner-title">Você está dominando a Nefrologia!</div>
            <div class="promo-banner-text">
              Restam <strong style="color:#ffd700">${remaining} questões</strong> gratuitas.
              Desbloqueie <strong style="color:#c8d8f0">${questionBank.length} questões</strong>, modo de estudo por tema
              e atualizações constantes — por menos de um café por mês.
            </div>
          </div>
          <button class="promo-banner-cta" data-remove-id="promoBannerOverlay" data-action="showPricingModal">Ver Planos</button>
          <button class="promo-banner-close" data-remove-id="promoBannerOverlay">✕</button>
        </div>`;
      document.body.appendChild(overlay);
      setTimeout(() => document.getElementById('promoBannerOverlay')?.remove(), 12000);
    }

    // ── Mercado Pago checkout ──
    let _pendingPaymentPlan = null; // plan pendente enquanto user faz login/cadastro

    function pricingChoose(tier) {
      closePricingModal();
      if (tier === 'free') {
        if (!authUser) { openAuthModal(); switchAuthTab('cadastrar'); }
        return;
      }
      // Plano pago: requer login
      if (!authUser) {
        _pendingPaymentPlan = tier;
        openAuthModal();
        switchAuthTab('cadastrar');
        _setAuthMsg('Crie sua conta para continuar para o pagamento.', 'success');
        return;
      }
      _initPayment(tier);
    }

    function _resumePendingPayment() {
      if (!_pendingPaymentPlan) return;
      const plan = _pendingPaymentPlan;
      _pendingPaymentPlan = null;
      // Pequeno delay para fechar modal de auth antes de redirecionar
      setTimeout(() => _initPayment(plan), 400);
    }

    async function _initPayment(plan) {
      if (!authUser) { showPricingModal(); return; }

      // Mostrar loading
      const loadingEl = _showPaymentLoading(plan);

      try {
        const session = await _supaClient.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) throw new Error('Sessão inválida');

        const res = await fetch(`${SUPA_URL}/functions/v1/swift-function`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json();

        if (!res.ok || !data.checkout_url) {
          throw new Error(data.error || 'Erro ao criar checkout');
        }

        loadingEl?.remove();
        // Redirecionar para Mercado Pago
        window.location.href = data.checkout_url;

      } catch (err) {
        loadingEl?.remove();
        _showPaymentError(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
      }
    }

    function _showPaymentLoading(plan) {
      const el = document.createElement('div');
      el.id = 'paymentLoadingOverlay';
      el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
      const label = plan === 'lifetime' ? 'Plano Vitalício' : 'Plano Mensal';
      el.innerHTML = `
        <div style="width:48px;height:48px;border:3px solid rgba(255,215,0,0.2);border-top-color:#ffd700;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <div style="font-family:'Cinzel',serif;color:#ffd700;font-size:0.9rem;letter-spacing:1px;">Preparando ${label}…</div>
        <div style="color:#6080a0;font-size:0.78rem;">Você será redirecionado para o Mercado Pago</div>`;
      document.body.appendChild(el);
      return el;
    }

    function _showPaymentError(msg) {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a0a0a;border:1px solid rgba(220,50,50,0.5);color:#ff8080;padding:14px 24px;border-radius:10px;font-size:0.85rem;z-index:10001;max-width:340px;text-align:center;';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }

    // Detecta retorno do Mercado Pago e exibe feedback
    (function _checkPaymentReturn() {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('payment');
      const plan   = params.get('plan');
      if (!status) return;

      // Limpar params da URL sem recarregar
      const clean = window.location.pathname;
      window.history.replaceState({}, '', clean);

      if (status === 'approved') {
        _showPaymentSuccess(plan);
      } else if (status === 'pending') {
        _showPaymentPending();
      }
      // failed: não mostra nada, usuário já viu a tela do MP
    })();

    function _showPaymentSuccess(plan) {
      _track('premium_converted', { plan });
      const el = document.createElement('div');
      el.id = 'paymentSuccessOverlay';
      el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:10000;display:flex;align-items:center;justify-content:center;padding:32px 16px;';
      const label = plan === 'lifetime' ? 'Vitalício' : 'Mensal';
      el.innerHTML = `
        <div style="text-align:center;max-width:420px;">
          <div style="font-size:3rem;margin-bottom:16px;">👑</div>
          <h2 style="font-family:'Cinzel Decorative',serif;color:#ffd700;font-size:1.6rem;margin-bottom:8px;">Pagamento Confirmado!</h2>
          <p style="color:#a0c8e0;font-size:0.9rem;line-height:1.6;margin-bottom:24px;">
            Bem-vindo ao Plano ${label}!<br>
            Seu acesso a <strong style="color:#ffd700">${questionBank.length} questões</strong> foi ativado.<br>
            Aguarde alguns instantes enquanto sincronizamos seu acesso.
          </p>
          <button data-remove-id="paymentSuccessOverlay" data-action="_pollPremiumActivation"
            style="background:linear-gradient(135deg,#b8860b,#ffd700);color:#1a0e00;border:none;padding:14px 32px;border-radius:10px;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;letter-spacing:1px;cursor:pointer;">
            ⚔ Começar Jornada Premium
          </button>
        </div>`;
      document.body.appendChild(el);
      // Inicia polling automaticamente após 2s
      setTimeout(_pollPremiumActivation, 2000);
    }

    function _showPaymentPending() {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0d1a2e;border:1px solid rgba(255,200,0,0.4);color:#ffd060;padding:16px 24px;border-radius:10px;font-size:0.85rem;z-index:10001;max-width:360px;text-align:center;line-height:1.5;';
      el.innerHTML = '⏳ <strong>Pagamento em processamento.</strong><br>Assim que aprovado seu acesso será ativado automaticamente.';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 8000);
    }

    let _premiumPollCount = 0;
    let _premiumPolling = false; // evita chains concorrentes
    async function _pollPremiumActivation() {
      if (!authUser || !_supaClient) return;
      if (_premiumPolling) return; // já existe uma chain ativa
      _premiumPolling = true;
      _premiumPollCount = 0;
      try { await _doPremiumPoll(); } catch { _premiumPolling = false; }
    }
    async function _doPremiumPoll() {
      if (!authUser || !_supaClient || _premiumPollCount >= 10) {
        _premiumPolling = false;
        return;
      }
      _premiumPollCount++;
      try {
        const { data: profile } = await _supaClient
          .from('profiles')
          .select('is_premium')
          .eq('id', authUser.id)
          .single();
        if (profile?.is_premium) {
          localStorage.setItem(PREMIUM_KEY, '1');
          _invalidatePremiumCache();
          document.getElementById('paymentSuccessOverlay')?.remove();
          updateWelcomeUserBadge();
          _premiumPolling = false;
          return;
        }
      } catch(e) {
        console.warn('Premium poll error:', e);
      }
      // Backoff exponencial: tentativas 1-3→3s, 4-6→5s, 7-10→8s
      const delay = _premiumPollCount <= 3 ? 3000 : _premiumPollCount <= 6 ? 5000 : 8000;
      setTimeout(_doPremiumPoll, delay);
    }

    // ============ ACCOUNT MODAL ============
    const ACCT_KEY = 'nefroquest-account';
    function openAccountModal() {
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('accountModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accountModal';
        modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9998;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:32px 16px;';
        modal.innerHTML = `
          <div class="modal-panel">
            <button class="modal-panel-x" data-action="closeAccountModal" aria-label="Fechar">&times;</button>
            <h2>👤 Minha Conta</h2>
            <div class="form-group">
              <label>Nome completo</label>
              <input id="acctName" type="text" placeholder="Seu nome">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input id="acctEmail" type="email" placeholder="seu@email.com" disabled style="opacity:0.5">
            </div>
            <div class="form-group">
              <label>Telefone / WhatsApp</label>
              <input id="acctPhone" type="tel" placeholder="+55 (11) 99999-9999">
            </div>
            <div class="form-group">
              <label>Especialidade</label>
              <input id="acctSpec" type="text" placeholder="ex: Nefrologia, Clínica Médica...">
            </div>
            <div class="form-group">
              <label>Cidade</label>
              <input id="acctCity" type="text" placeholder="Sua cidade">
            </div>
            <div class="modal-actions">
              <button data-action="closeAccountModal" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Cancelar</button>
              <button data-action="saveAccountData" style="background:linear-gradient(135deg,#1a4080,#2a5fa0);color:#e0f0ff;border:none;">Salvar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      // Populate
      const saved = (() => { try { return JSON.parse(localStorage.getItem(ACCT_KEY) || '{}'); } catch(e) { return {}; } })();
      document.getElementById('acctName').value  = authUser?.user_metadata?.full_name || saved.name || '';
      document.getElementById('acctEmail').value = authUser?.email || '';
      document.getElementById('acctPhone').value = saved.phone || '';
      document.getElementById('acctSpec').value  = saved.spec  || '';
      document.getElementById('acctCity').value  = saved.city  || '';
      modal.style.display = 'flex';
    }
    function closeAccountModal() {
      const m = document.getElementById('accountModal');
      if (m) m.style.display = 'none';
    }
    async function saveAccountData() {
      const data = {
        name:  document.getElementById('acctName').value.trim(),
        phone: document.getElementById('acctPhone').value.trim(),
        spec:  document.getElementById('acctSpec').value.trim(),
        city:  document.getElementById('acctCity').value.trim(),
      };
      try { localStorage.setItem(ACCT_KEY, JSON.stringify(data)); } catch(e) {}
      // Salvar no Supabase
      if (_supaClient && authUser) {
        try {
          const { error: profileError } = await _supaClient.from('profiles').upsert({
            id:        authUser.id,
            full_name: data.name,
            phone:     data.phone,
            specialty: data.spec,
            city:      data.city,
          });
          if (profileError) console.warn('Erro ao salvar perfil:', profileError.message);
          const { error: userError } = await _supaClient.auth.updateUser({ data: { full_name: data.name, specialty: data.spec } });
          if (userError) console.warn('Erro ao atualizar auth user:', userError.message);
        } catch(e) {
          console.warn('saveAccountData falhou (Supabase):', e);
        }
      }
      closeAccountModal();
    }

    // ============ PLAN MODAL ============
    function openPlanModal() {
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('planModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'planModal';
        modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9998;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:32px 16px;';
        modal.innerHTML = `<div class="modal-panel" id="planModalContent"></div>`;
        document.body.appendChild(modal);
      }
      const stats = getGameStats();
      const answered = stats.questionsAnsweredAllTime || 0;
      let badgeClass = 'free', badgeLabel = '🎓 Plano Gratuito', detailHtml = '';
      if (isAdminUser()) {
        badgeClass = 'admin'; badgeLabel = '🛡 Admin — Acesso Total';
        detailHtml = `<p class="plan-stat">Conta de administrador com acesso irrestrito.</p>`;
      } else if (isPremium()) {
        badgeClass = 'premium'; badgeLabel = '👑 Premium';
        detailHtml = `<p class="plan-stat">Acesso completo a todas as questões.</p>`;
      } else {
        const pct = Math.min(100, Math.round(answered / FREE_QUESTIONS_LIMIT * 100));
        const remaining = Math.max(0, FREE_QUESTIONS_LIMIT - answered);
        detailHtml = `
          <p class="plan-stat">${answered} de ${FREE_QUESTIONS_LIMIT} questões gratuitas respondidas.</p>
          <div class="plan-bar-wrap"><div class="plan-bar" style="width:${pct}%"></div></div>
          <p class="plan-stat" style="font-size:0.78rem;color:#708090">${remaining} questões restantes no plano gratuito.</p>
          <button class="btn gold" style="width:100%;margin-top:4px" data-action-seq="closePlanModal,showPricingModal">✨ Fazer Upgrade</button>
        `;
      }
      document.getElementById('planModalContent').innerHTML = `
        <button class="modal-panel-x" data-action="closePlanModal" aria-label="Fechar">&times;</button>
        <h2>⭐ Seu Plano</h2>
        <div style="text-align:center">
          <div class="plan-badge ${badgeClass}">${badgeLabel}</div>
        </div>
        ${detailHtml}
        <div class="modal-actions" style="margin-top:14px">
          <button data-action="closePlanModal" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button>
        </div>
      `;
      modal.style.display = 'flex';
    }
    function closePlanModal() {
      const m = document.getElementById('planModal');
      if (m) m.style.display = 'none';
    }

    // ============ ADMIN PANEL ============
    function adminJumpToBoss() {
      if (!isAdminUser()) return;
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      // Garante que o jogo está iniciado com um personagem
      if (!state.gameStarted) {
        if (!state.selectedCharacter) state.selectedCharacter = 'guerreiro';
        state.gameStarted = true;
        document.getElementById('welcomeScreen')?.classList.add('hidden');
        document.getElementById('mainApp')?.classList.remove('hidden');
      }
      state.correctTotal = BOSS_START_CORRECT;
      state.bossIntroShown = true;
      state.battleFinalShown = false;
      renderQuestion();
      // Show boss intro popup
      setTimeout(() => showBossIntroPopup(), 50);
    }

    function openAdminPanel() {
      if (!isAdminUser()) return;
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('adminModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9998;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:32px 16px;';
        modal.innerHTML = `
          <div class="modal-panel" style="max-width:500px">
            <button class="modal-panel-x" data-action="closeAdminPanel" aria-label="Fechar">&times;</button>
            <h2>🛡 Administração — Lista de Acesso</h2>
            <p style="color:#a0b8d0;font-size:0.82rem;margin-bottom:14px">Emails com acesso completo (lista de amigos / convidados).</p>
            <div class="whitelist-input-row">
              <input id="wlEmailInput" type="email" placeholder="email@exemplo.com">
              <button class="btn gold" style="white-space:nowrap;padding:8px 16px" data-action="adminAddWhitelist">+ Adicionar</button>
            </div>
            <div id="wlList" class="whitelist-list"><div class="whitelist-empty">Carregando...</div></div>
            <div class="modal-actions" style="margin-top:16px">
              <button data-action="closeAdminPanel" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
      adminLoadWhitelist();
    }
    function closeAdminPanel() {
      const m = document.getElementById('adminModal');
      if (m) m.style.display = 'none';
    }

    // ── Analytics Panel ───────────────────────────────────────────────────────
    function openAnalyticsPanel() {
      if (!isAdminUser()) return;
      document.querySelectorAll('.profile-popup.open').forEach(p => p.classList.remove('open'));
      let modal = document.getElementById('analyticsModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'analyticsModal';
        modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9998;align-items:flex-start;justify-content:center;backdrop-filter:blur(8px);padding:20px 16px;overflow-y:auto;';
        modal.innerHTML = `
          <div class="modal-panel" style="max-width:560px;width:100%;margin:auto 0;">
            <button class="modal-panel-x" data-action="closeAnalyticsPanel" aria-label="Fechar">&times;</button>
            <h2>📊 Analytics — NefroQuest</h2>
            <p style="color:#8a9cc0;font-size:0.78rem;margin-bottom:16px;">Dados em tempo real do Supabase + funil de eventos no GA4.</p>

            <!-- Métricas do ranking -->
            <div id="analyticsStats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;">
              <div style="background:rgba(255,255,255,0.04);border:1px solid var(--blue-dark);border-radius:10px;padding:12px;text-align:center;">
                <div id="anTotalPlayers" style="font-size:1.6rem;font-weight:700;color:var(--gold);">—</div>
                <div style="font-size:0.68rem;color:#8a9cc0;margin-top:2px;">jogadores</div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid var(--blue-dark);border-radius:10px;padding:12px;text-align:center;">
                <div id="anAvgScore" style="font-size:1.6rem;font-weight:700;color:var(--blue);">—</div>
                <div style="font-size:0.68rem;color:#8a9cc0;margin-top:2px;">score médio</div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid var(--blue-dark);border-radius:10px;padding:12px;text-align:center;">
                <div id="anMaxScore" style="font-size:1.6rem;font-weight:700;color:var(--ok);">—</div>
                <div style="font-size:0.68rem;color:#8a9cc0;margin-top:2px;">recorde</div>
              </div>
            </div>

            <!-- Distribuição de níveis -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;margin-bottom:18px;">
              <div style="font-size:0.72rem;color:#8a9cc0;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Distribuição de Níveis</div>
              <div id="anLevelChart" style="font-size:0.78rem;color:#c8d8f0;">Carregando…</div>
            </div>

            <!-- Top 5 scores -->
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;margin-bottom:18px;">
              <div style="font-size:0.72rem;color:#8a9cc0;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Top 5 Jogadores</div>
              <div id="anTop5" style="font-size:0.82rem;color:#c8d8f0;">Carregando…</div>
            </div>

            <!-- Link GA4 -->
            <div style="background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.3);border-radius:10px;padding:14px;margin-bottom:18px;">
              <div style="font-size:0.72rem;color:#8a9cc0;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Funil de Eventos (GA4)</div>
              <p style="font-size:0.78rem;color:#a0b8d0;margin-bottom:10px;line-height:1.5;">
                Eventos instrumentados: <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">game_started</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">question_answered</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">boss_entered</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">game_completed</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">paywall_shown</code>
                <code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.72rem;">premium_converted</code>
              </p>
              <a href="https://analytics.google.com" target="_blank" rel="noopener"
                style="display:inline-flex;align-items:center;gap:6px;background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.4);color:var(--blue);border-radius:8px;padding:8px 14px;font-size:0.78rem;font-weight:600;text-decoration:none;cursor:pointer;">
                🔗 Abrir Google Analytics 4
              </a>
            </div>

            <div class="modal-actions">
              <button data-action="closeAnalyticsPanel" style="background:rgba(255,255,255,0.06);color:#c8d8f0;border:1px solid var(--blue-dark);">Fechar</button>
              <button data-action="loadAnalyticsData" style="background:rgba(96,165,250,0.12);color:var(--blue);border:1px solid rgba(96,165,250,0.4);">↺ Atualizar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
      loadAnalyticsData();
    }

    function closeAnalyticsPanel() {
      const m = document.getElementById('analyticsModal');
      if (m) m.style.display = 'none';
    }

    async function loadAnalyticsData() {
      if (!_supaClient) return;
      try {
        // Busca dados do leaderboard
        const { data, error } = await _supaClient
          .from('leaderboard')
          .select('player_name, score, level')
          .order('score', { ascending: false })
          .limit(200);
        if (error) throw error;
        if (!data || data.length === 0) {
          document.getElementById('anTotalPlayers').textContent = '0';
          document.getElementById('anAvgScore').textContent = '0';
          document.getElementById('anMaxScore').textContent = '0';
          document.getElementById('anLevelChart').textContent = 'Sem dados ainda.';
          document.getElementById('anTop5').textContent = 'Sem dados ainda.';
          return;
        }

        // Métricas gerais
        const total = data.length;
        const avgScore = Math.round(data.reduce((s, r) => s + (r.score || 0), 0) / total);
        const maxScore = data[0].score || 0;
        document.getElementById('anTotalPlayers').textContent = total.toLocaleString('pt-BR');
        document.getElementById('anAvgScore').textContent = avgScore.toLocaleString('pt-BR');
        document.getElementById('anMaxScore').textContent = maxScore.toLocaleString('pt-BR');

        // Distribuição de níveis em faixas
        const bands = [
          { label: 'Lv 1–5',   min: 1,  max: 5  },
          { label: 'Lv 6–10',  min: 6,  max: 10 },
          { label: 'Lv 11–20', min: 11, max: 20 },
          { label: 'Lv 21–50', min: 21, max: 50 },
          { label: 'Lv 51+',   min: 51, max: 999 },
        ];
        const maxBandCount = Math.max(...bands.map(b => data.filter(r => r.level >= b.min && r.level <= b.max).length), 1);
        document.getElementById('anLevelChart').innerHTML = bands.map(b => {
          const count = data.filter(r => r.level >= b.min && r.level <= b.max).length;
          const pct = Math.round(count / maxBandCount * 100);
          return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="width:62px;font-size:0.72rem;color:#8a9cc0;flex-shrink:0;">${b.label}</span>
            <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:14px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--blue-dark),var(--blue));border-radius:4px;transition:width 0.5s;"></div>
            </div>
            <span style="font-size:0.72rem;color:#c8d8f0;width:28px;text-align:right;">${count}</span>
          </div>`;
        }).join('');

        // Top 5
        const medals = ['🥇','🥈','🥉','4º','5º'];
        document.getElementById('anTop5').innerHTML = data.slice(0, 5).map((r, i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="width:24px;font-size:0.85rem;">${medals[i]}</span>
            <span style="flex:1;color:#e8efff;">${escapeHtml((r.player_name||'Anônimo').slice(0,28))}</span>
            <span style="color:var(--gold);font-weight:700;">${(r.score||0).toLocaleString('pt-BR')}</span>
            <span style="color:#8a9cc0;font-size:0.72rem;">Lv${r.level||1}</span>
          </div>
        `).join('');
      } catch(e) {
        const err = '<div style="color:#fb7185;font-size:0.78rem;">Erro ao carregar dados.</div>';
        ['anLevelChart','anTop5'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = err; });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    async function adminLoadWhitelist() {
      const list = document.getElementById('wlList');
      if (!list || !_supaClient) return;
      list.innerHTML = '<div class="whitelist-empty">Carregando...</div>';
      try {
        const { data, error } = await _supaClient
          .from('access_whitelist')
          .select('email, added_at')
          .order('added_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
          list.innerHTML = '<div class="whitelist-empty">Nenhum email na lista ainda.</div>';
          return;
        }
        list.innerHTML = '';
        data.forEach(r => {
          const item = document.createElement('div');
          item.className = 'whitelist-item';
          const span = document.createElement('span');
          span.textContent = r.email;
          const btn = document.createElement('button');
          btn.textContent = 'Remover';
          btn.addEventListener('click', () => adminRemoveWhitelist(r.email));
          item.appendChild(span);
          item.appendChild(btn);
          list.appendChild(item);
        });
      } catch(e) {
        list.innerHTML = '<div class="whitelist-empty" style="color:#fb7185">Erro ao carregar. Verifique a tabela no Supabase.</div>';
      }
    }
    async function adminAddWhitelist() {
      if (!isAdminUser()) return;
      const input = document.getElementById('wlEmailInput');
      const email = input?.value.trim().toLowerCase();
      if (!email || !email.includes('@')) { alert('Digite um email válido.'); return; }
      if (!_supaClient) return;
      try {
        const { error } = await _supaClient
          .from('access_whitelist')
          .upsert({ email, added_at: new Date().toISOString() });
        if (error) throw error;
        if (input) input.value = '';
        adminLoadWhitelist();
      } catch(e) {
        alert('Erro ao adicionar: ' + (e.message || e));
      }
    }
    async function adminRemoveWhitelist(email) {
      if (!isAdminUser()) return;
      if (!_supaClient) return;
      if (!confirm(`Remover acesso de ${email}?`)) return;
      try {
        const { error } = await _supaClient
          .from('access_whitelist')
          .delete()
          .eq('email', email);
        if (error) throw error;
        adminLoadWhitelist();
      } catch(e) {
        alert('Erro ao remover: ' + (e.message || e));
      }
    }

    function answer(i,btn){
      if(!state.gameStarted) return;
      if(state.answered) return;
      state.answered=true;
      const st=total();
      const all=[...document.querySelectorAll('.option')];
      all.forEach(b=>b.disabled=true);
      const c=state.current.a;
      all[c].classList.add('correct');

      if(i===c){
        state.streak++;
        state.correctTotal++;
        const sm = getStreakMultiplier(state.streak);
        const baseXp=5+state.current.d*2+Math.min(state.streak,5)*1+Math.floor(st.kno/3);
        let xp=Math.floor(baseXp * sm.mult);
        const baseG=8+state.current.d*3+Math.floor(st.luck/3);
        let g=Math.floor(baseG * sm.mult);
        // Legendary passive: Elmo do Filtrador Supremo +25% gold
        if(state.equipment?.relic?.n==='Elmo do Filtrador Supremo') g=Math.floor(g*1.25);
        // Legendary passive: Cetro do Néfron Eterno - streak bonus gold
        if(state.equipment?.weapon?.n==='Cetro do Néfron Eterno' && state.streak>=5) g+=30;
        // Legendary synergy: all 3 slots legendary = +20% XP
        const _synergy = legendaryCount()===3;
        if(_synergy) xp=Math.floor(xp*1.2);
        const baseScore=80+state.current.d*15+state.streak*5+st.atk;
        state.score+=Math.floor(baseScore * sm.mult);
        const prevGold = state.gold;
        state.gold+=g;
        checkGoldMilestone(prevGold);
        const prevLevel = state.level;
        const lv=gainXP(xp);

        if(state.level>=15&&legendaryCount()>=2){
          log('👑 Objetivo final desbloqueado! Você está pronto para vencer o Arqui-Nefromante.');
        }
        ui.feedback.className='feedback good';
        const multText = sm.label ? ` (${sm.label})` : '';
        const synergyText = _synergy ? ' ✨+20% sinergia' : '';
        { const _snip = escapeHtml(_firstSentence(state.current.e));
          const _full = escapeHtml(state.current.e || '');
          const _hasMore = _full.length > _snip.length;
          ui.feedback.innerHTML = `<strong>✅ Correto!</strong> +${xp} XP${multText}${synergyText}, +${g} ouro.${lv?` <strong>Level up x${lv}!</strong>`:''}<br><span>${_snip}${_hasMore?`<span style="display:none;" class="fb-rest"> ${_full.substring(_snip.length)}</span><button class="fb-more-btn" style="background:none;border:none;color:#93c5fd;cursor:pointer;font-size:0.8rem;padding:0 0 0 4px;" onclick="this.previousElementSibling.style.display='inline';this.style.display='none';">ver mais ▾</button>`:''}</span>`;
        }
        // Boss log
        if (isBossBattle()) {
          const dmg = Math.floor(st.atk * 8 + st.kno * 5 + state.streak * 5);
          const hpBefore = Math.min(100, getBossHP() + 10);
          const hpAfter  = getBossHP();
          state.bossLog = state.bossLog || [];
          state.bossLog.push({cls:'hit', txt:`⚔️ Você causou <strong>${dmg} de dano!</strong>`});
          state.bossLog.push({cls:'', txt:`HP: ${hpBefore}% → ${hpAfter}%`});
          const loreLines = ['😤 "Fraco demais para derrotar a Azotemia Eterna!"','😠 "Impossível... como você conhece os néfrons?"','😡 "Sua sabedoria me enfraquece... mas não me vencerá!"','😰 "N-não... meu poder está se dissipando!"','💀 "Você... venceu. Mas a Uremia... sempre volta..."'];
          if (state.bossLog.length % 4 === 0) state.bossLog.push({cls:'lore', txt: loreLines[Math.floor(state.bossLog.length/4) % loreLines.length]});
        }
        // Sons e popup de evolução
        if(lv) {
          playSound('levelup');
          // Verificar se houve mudança de imagem/título
          const [newClass, newImg, newCls, newTitle] = heroMeta();
          setTimeout(() => showEvolutionPopup(state.level, newTitle, newImg), 600);
          // Verificar vida extra
          checkExtraLife();
        } else { playSound('correct'); }
        if(state.streak >= 5) playSound('streak');
        // Verificar narrativa a cada 5 acertos
        checkNarrative();
        // Auto-save após acerto
        saveGame();
        checkGameCompletion();
      } else {
        state.streak=0;
        btn.classList.add('wrong');
        // Legendary passive: Armadura da Homeostase Perfeita: DEF 2.0% vs 1.4%
        const defMult = (state.equipment?.armor?.n==='Armadura da Homeostase Perfeita') ? 0.020 : 0.014;
        const shield=Math.min(.50, st.def * defMult);
        let blocked=Math.random()<shield;
        let legendaryBlockMsg = '';
        // Legendary active: Excalibur do Néfron (auto-blocks 1st life loss)
        if(!blocked && state.equipment?.weapon?.n==='Excalibur do Néfron' && !state.legendaryAbilityUsed['Excalibur do Néfron']) {
          state.legendaryAbilityUsed['Excalibur do Néfron'] = true;
          blocked = true;
          legendaryBlockMsg = '⚔️ Excalibur do Néfron anulou o dano! (1× por jogo)';
          renderEquip();
        }
        // Legendary active: Armadura Primeva (blocks hit when on last life)
        if(!blocked && state.lives<=1 && state.equipment?.armor?.n==='Armadura Primeva' && !state.legendaryAbilityUsed['Armadura Primeva']) {
          state.legendaryAbilityUsed['Armadura Primeva'] = true;
          blocked = true;
          legendaryBlockMsg = '🛡️ Armadura Primeva salvou sua última vida! (1× por jogo)';
          renderEquip();
        }
        if(!blocked) state.lives--;
        state.score=Math.max(0,state.score-(28-Math.min(20,st.def)));
        ui.feedback.className='feedback bad';
        { const _prefix = legendaryBlockMsg || (blocked ? '🛡️ Errou, mas sua defesa absorveu.' : '❌ Incorreta.');
          const _snip2 = escapeHtml(_firstSentence(state.current.e));
          const _full2 = escapeHtml(state.current.e || '');
          const _hasMore2 = _full2.length > _snip2.length;
          ui.feedback.innerHTML = `<strong>${escapeHtml(_prefix)}</strong><br><span>${_snip2}${_hasMore2?`<span style="display:none;" class="fb-rest"> ${_full2.substring(_snip2.length)}</span><button class="fb-more-btn" style="background:none;border:none;color:#93c5fd;cursor:pointer;font-size:0.8rem;padding:0 0 0 4px;" onclick="this.previousElementSibling.style.display='inline';this.style.display='none';">ver mais ▾</button>`:''}</span>`;
        }
        log('⚠️ Você falhou nessa carta. Ajuste a estratégia e continue.');
        playSound('wrong');
        // Boss log para erro
        if (isBossBattle()) {
          state.bossLog = state.bossLog || [];
          state.bossLog.push({cls:'miss', txt:`❌ Resposta errada!`});
          if (!blocked) {
            state.bossLog.push({cls:'miss', txt:`💥 O Nefromante contra-atacou!`});
          }
        }
        saveGame();
      }

      _incrementQuestionsAnswered();
      _checkPromoBanner();
      // ── Analytics: question answered ──
      _track('question_answered', {
        correct: i === state.current.a,
        difficulty: state.current.d,
        is_boss: isBossBattle(),
        boss_progress: isBossBattle() ? getBossProgress() : undefined,
        streak: state.streak,
        level: state.level,
      });
      renderHUD();
      updateBadges();
      if(state.lives<=0) {
        // Legendary active: Amuleto do Rim Imortal - revive once
        if(state.equipment?.relic?.n==='Amuleto do Rim Imortal' && !state.legendaryAbilityUsed['Amuleto do Rim Imortal']) {
          state.legendaryAbilityUsed['Amuleto do Rim Imortal'] = true;
          state.lives = 1;
          renderEquip();
          const revNotif = document.createElement('div');
          revNotif.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9990;background:linear-gradient(135deg,#1a0a2a,#2a1040);border:2px solid var(--gold);border-radius:16px;padding:24px 28px;text-align:center;animation:scaleIn 0.4s;box-shadow:0 0 50px rgba(255,215,0,0.3);';
          revNotif.innerHTML='<div style="font-size:2rem;margin-bottom:8px">💜</div><div style="color:var(--gold);font-family:Cinzel,serif;font-size:1rem;margin-bottom:6px">Amuleto do Rim Imortal</div><div style="color:#c8d8f0;font-size:0.82rem">Você foi revivido com 1 vida!<br><span style="color:#64748b;font-size:0.72rem">(1× por jogo)</span></div>';
          document.body.appendChild(revNotif);
          setTimeout(()=>revNotif.remove(), 3000);
          renderHUD(); saveGame(); return;
        }
        finishGame();
      } else if (!isPremium() && getGameStats().questionsAnsweredAllTime >= FREE_QUESTIONS_LIMIT) {
        showPricingModal();
      } else {
        ui.nextBtn.classList.remove('hidden');
        // ── Confronto Final: atualiza barra de HP, estrelas e botão ──
        updateBossUI();
        animateLastBossStar();
        // Muda texto do botão Próxima: "ATACAR" nas questões 91-99, "GOLPE FINAL" na última
        if(isBossBattle()) ui.nextBtn.textContent = getBossProgress() >= 9 ? 'GOLPE FINAL' : 'ATACAR (PRÓXIMA PERGUNTA)';
      }
    }

    function finishDeck(){
      // Re-embaralhar automaticamente o baralho com nova ordem aleatória
      // (evitando repetir a última questão do ciclo anterior)
      shuffleQueue();
      // Notificar o jogador com mensagem temporária no feedback
      ui.feedback.className = 'feedback good';
      ui.feedback.textContent = '✅ Baralho completo! Embaralhando novamente...';
      // Avançar para a próxima questão após breve pausa
      setTimeout(() => {
        ui.feedback.textContent = '';
        ui.feedback.className = 'feedback';
        renderQuestion();
      }, 1800);
    }

    function bonusCost(){ return 1500; }

    // Variável temporária para guardar score ao final
    let pendingScore = null;
    
    function finishGame(){
      // Atualizar estatísticas e limpar save
      updateGameStats();
      deleteSave();
      pendingScore = {score: state.score, level: state.level};

      // Se usuário autenticado, pular modal de nome
      if (authUser) {
        const name = _authDisplayName();
        boardPush(pendingScore.score, pendingScore.level, name);
        pendingScore = null;
        finishGameUI();
        return;
      }

      // Guardar score e abrir modal de nome (convidado)
      document.getElementById('nameModal').classList.add('show');
      const input = document.getElementById('playerName');
      input.value = state.lastSubmittedName || '';
      input.focus();
      input.onkeypress = (e) => {
        if (e.key === 'Enter') saveScore();
      };
    }

    function buyBonusQuestion(){
      if(state.bonusUses >= 1){ log('🚫 Você já usou sua pergunta bônus nesta jornada!'); return; }
      const cost=bonusCost();
      if(state.gold<cost||state.lives>0) return;
      state.gold-=cost;
      state.bonusUses++;
      state.lives=1;
      state.gameOver=false;
      log(`✨ Pergunta Bônus comprada por ${cost} ouro. A jornada continua.`);
      renderHUD();
      updateBadges();
      renderQuestion();
    }

    // === POPUP DE CONFIRMAÇÃO MOBILE (Forjar / Lendário / Baú) ===
    function showActionConfirmPopup(type) {
      // Remove popup anterior se existir
      const existing = document.getElementById('mobileActionConfirm');
      if(existing) existing.remove();

      const configs = {
        forge: {
          title: '🔨 Forjar Item',
          desc: 'Forja um item aleatório para seu equipamento. A raridade depende do seu nível e sorte.',
          cost: 300,
          costColor: '#fb923c',
          btnClass: '',
          btnLabel: 'FORJAR AGORA',
          action: () => _forgeItemDirect()
        },
        legendary: {
          title: '⭐ Forjar Lendário',
          desc: 'Garante um item lendário para um slot aleatório. Poder máximo!',
          cost: 1000,
          costColor: '#d8b4fe',
          btnClass: 'legendary',
          btnLabel: 'FORJAR LENDÁRIO',
          action: () => _forgeLegendaryDirect()
        },
        chest: {
          title: '📦 Abrir Baú',
          desc: 'Desbloqueia um artigo científico de nefrologia e ganha +Conhecimento.',
          cost: chestCost,
          costColor: '#fbbf24',
          btnClass: 'chest',
          btnLabel: 'ABRIR BAÚ',
          action: () => _openChestDirect()
        }
      };

      const cfg = configs[type];
      if(!cfg) return;

      const canAfford = state.gold >= cfg.cost;
      const popup = document.createElement('div');
      popup.id = 'mobileActionConfirm';
      popup.className = 'mobile-action-confirm';
      popup.innerHTML = `
        <div class="mac-title">${cfg.title}</div>
        <div class="mac-desc">${cfg.desc}</div>
        <div class="mac-cost" style="color:${cfg.costColor}">💰 ${cfg.cost} ouro</div>
        <div class="mac-gold-avail">Seu ouro: <strong style="color:${canAfford?'#ffd700':'#ef4444'}">${state.gold}</strong>${canAfford ? ' ✓' : ' — insuficiente'}</div>
        <div class="mac-btns">
          <button class="mac-btn mac-cancel" data-remove-id="mobileActionConfirm">CANCELAR</button>
          <button class="mac-btn mac-confirm ${cfg.btnClass}" ${canAfford?'':'disabled style="opacity:0.4;pointer-events:none;"'}
            data-remove-id="mobileActionConfirm" data-action="_mobileCallback" data-arg="${type}">
            ${cfg.btnLabel}
          </button>
        </div>
      `;

      // Fechar ao clicar fora
      setTimeout(() => {
        document.addEventListener('click', function closeConfirm(e) {
          if(!popup.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', closeConfirm);
          }
        });
      }, 100);

      document.body.appendChild(popup);
    }

    // Expor popup no escopo global para uso via onclick no HTML
    window.showMobileActionConfirm = showActionConfirmPopup;
    window.closeChestModal = closeChestModal;

    // Modal da Forja — duas opções: item comum e lendário
    function showForjaModal() {
      const existing = document.getElementById('forjaModal');
      if(existing) existing.remove();

      const goldForge = 300, goldLeg = 1000;
      const canForge = state.gold >= goldForge;
      const canLeg   = state.gold >= goldLeg;

      const modal = document.createElement('div');
      modal.id = 'forjaModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);padding:24px 16px;';
      modal.innerHTML = `
        <div style="
          background:linear-gradient(160deg,rgba(18,26,54,0.99),rgba(10,16,38,0.99));
          border:1px solid rgba(255,215,0,0.35);border-radius:18px;
          padding:28px 24px 20px;min-width:310px;max-width:380px;width:90%;
          max-height:calc(100vh - 48px);overflow-y:auto;
          box-shadow:0 8px 48px rgba(0,0,0,0.9),0 0 0 1px rgba(255,215,0,0.08) inset;
        ">
          <h3 style="color:#fb923c;font-family:'Cinzel',serif;font-size:1.15rem;text-align:center;margin:0 0 6px;letter-spacing:1px;">🔥 FORJA</h3>
          <p style="color:#6b7db8;font-family:'Philosopher',serif;font-size:0.78rem;text-align:center;margin:0 0 20px;">Escolha o tipo de forjamento</p>

          <div style="display:flex;flex-direction:column;gap:12px;">

            <!-- Forjar Item Comum -->
            <div style="
              background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,${canForge?'0.4':'0.18'});
              border-radius:12px;padding:14px 16px;
              ${!canForge?'opacity:0.5;':''}
            ">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="color:#fb923c;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;">⚒️ Item Comum</span>
                <span style="color:#ffd700;font-family:'Cinzel',serif;font-size:0.75rem;">💰 300</span>
              </div>
              <p style="color:#9aabcc;font-family:'Philosopher',serif;font-size:0.73rem;margin:0 0 10px;line-height:1.4;">Forja um item aleatório. A raridade depende do seu nível e sorte.</p>
              <button data-remove-id="forjaModal" data-action="_mobileCallback" data-arg="forge"
                ${canForge?'':'disabled'}
                style="width:100%;padding:8px;background:${canForge?'linear-gradient(135deg,rgba(251,146,60,0.35),rgba(200,100,30,0.3))':'rgba(255,255,255,0.04)'};
                border:1px solid rgba(251,146,60,${canForge?'0.6':'0.2'});border-radius:8px;
                color:${canForge?'#fb923c':'#555'};font-family:'Cinzel',serif;font-size:0.7rem;
                font-weight:700;letter-spacing:1px;cursor:${canForge?'pointer':'not-allowed'};">
                FORJAR AGORA
              </button>
            </div>

            <!-- Forjar Lendário -->
            <div style="
              background:rgba(192,132,252,0.08);border:1px solid rgba(192,132,252,${canLeg?'0.4':'0.18'});
              border-radius:12px;padding:14px 16px;
              ${!canLeg?'opacity:0.5;':''}
            ">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="color:#d8b4fe;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;">⭐ Item Lendário</span>
                <span style="color:#ffd700;font-family:'Cinzel',serif;font-size:0.75rem;">💰 1000</span>
              </div>
              <p style="color:#9aabcc;font-family:'Philosopher',serif;font-size:0.73rem;margin:0 0 10px;line-height:1.4;">Garante um item lendário para um slot aleatório. Poder máximo!</p>
              <button data-remove-id="forjaModal" data-action="_mobileCallback" data-arg="legendary"
                ${canLeg?'':'disabled'}
                style="width:100%;padding:8px;background:${canLeg?'linear-gradient(135deg,rgba(192,132,252,0.3),rgba(140,80,220,0.25))':'rgba(255,255,255,0.04)'};
                border:1px solid rgba(192,132,252,${canLeg?'0.6':'0.2'});border-radius:8px;
                color:${canLeg?'#d8b4fe':'#555'};font-family:'Cinzel',serif;font-size:0.7rem;
                font-weight:700;letter-spacing:1px;cursor:${canLeg?'pointer':'not-allowed'};">
                FORJAR LENDÁRIO
              </button>
            </div>

          </div>

          <div style="color:#4a5878;font-family:'Philosopher',serif;font-size:0.72rem;text-align:center;margin-top:14px;">
            Ouro disponível: <strong style="color:#ffd700;">${state.gold}</strong>
          </div>

          <button data-remove-id="forjaModal"
            style="margin-top:14px;width:100%;padding:7px;background:rgba(255,255,255,0.07);
            border:1px solid rgba(255,255,255,0.35);border-radius:8px;color:#c0cfe8;
            font-family:'Cinzel',serif;font-size:0.68rem;cursor:pointer;letter-spacing:1px;">
            FECHAR
          </button>
        </div>
      `;

      modal.addEventListener('click', e => { if(e.target === modal) modal.remove(); });
      document.body.appendChild(modal);
    }
    window.showForjaModal = showForjaModal;

    // Callbacks das ações (chamados pelo popup)
    window._mobileActionCallbacks = {
      forge: () => _forgeItemDirect(),
      legendary: () => _forgeLegendaryDirect(),
      chest: () => _openChestDirect()
    };

    // Funções internas diretas (sem interceptação)
    function _forgeItemDirect(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if(allItemsMaxed()){ log('🏆 Você já possui todos os equipamentos lendários!'); return; }
      const cost=300;
      if(state.gold<cost){ log('🧱 Ouro insuficiente! Precisa de 300 ouro para forjar.'); return; }
      state.gold-=cost;
      const st=total();
      const rolled=rollItem(state.level, st.luck);
      const gains=[`⚔️ ATK ${rolled.item.atk}`, `🛡️ DEF ${rolled.item.def}`, `📚 CONH ${rolled.item.kno}`, `🍀 SORTE ${rolled.item.luck}`];
      playSound('forge');
      equipOrSell(rolled.slot, rolled.item, (msg) => {
        showForgePopup(rolled.item, rolled.slot, gains);
        log(`🔨 Forja concluída! ${msg}`);
        renderHUD();
        updateBadges();
        saveGame();
      });
    }

    function _forgeLegendaryDirect(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if(allItemsMaxed()){ log('🏆 Você já possui todos os equipamentos lendários!'); return; }
      const cost=1000;
      if(state.gold<cost){ log('🧱 Ouro insuficiente! Precisa de 1000 ouro para forjar lendário.'); return; }
      state.gold-=cost;
      const keys=Object.keys(state.equipment);
      const slot=keys[Math.floor(Math.random()*keys.length)];
      const legendaryItems = items[slot].filter(i => i.rar === 'legendary');
      if(legendaryItems.length === 0){ log('Sem itens lendários para este slot.'); state.gold+=cost; return; }
      const legendaryItem = legendaryItems[Math.floor(Math.random()*legendaryItems.length)];
      const legendaryItemCopy = {...legendaryItem};
      const gains = [`⚔️ ATK ${legendaryItem.atk}`, `🛡️ DEF ${legendaryItem.def}`, `📚 CONH ${legendaryItem.kno}`, `🍀 SORTE ${legendaryItem.luck}`];
      playSound('forge');
      renderHUD();
      equipOrSell(slot, legendaryItemCopy, (msg) => {
        showForgePopup(legendaryItemCopy, slot, gains);
        log(`🔨 Forja Lendária! ${msg}`);
        renderHUD(); updateBadges(); saveGame();
      });
    }

    function _openChestDirect(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if (state.correctTotal < CHEST_MIN_CORRECT) {
        log(`📚 Você precisa de pelo menos ${CHEST_MIN_CORRECT} acertos para abrir um baú! (Atual: ${state.correctTotal})`);
        return;
      }
      if (state.gold < chestCost) {
        log('💰 Ouro insuficiente! Você precisa de ' + chestCost + ' ouro.');
        return;
      }
      const availableArticles = nefroArticles.filter((_, idx) => !unlockedArticles.includes(idx));
      if (availableArticles.length === 0) {
        log('🎉 Você já desbloqueou todos os artigos!');
        return;
      }
      state.gold -= chestCost;
      const randomArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
      const articleIndex = nefroArticles.indexOf(randomArticle);
      unlockedArticles.push(articleIndex);
      localStorage.setItem('unlockedArticles', JSON.stringify(unlockedArticles));
      state.chestsOpened++;
      const knoGain = state.chestsOpened;
      if(state.equipment.relic) state.equipment.relic.kno = (state.equipment.relic.kno || 0) + knoGain;
      const chestPoints = 30 + state.chestsOpened * 10;
      state.score += chestPoints;
      showChestModal(randomArticle, knoGain, chestPoints);
      playSound('chest');
      log(`📚 Baús abertos: ${state.chestsOpened} — +${knoGain} Conhecimento, +${chestPoints} pontos!`);
      chestCost = Math.min(chestCost + 15, 250);
      log('📦 Artigo desbloqueado: ' + randomArticle.titulo);
      renderHUD();
      updateBadges();
      saveGame();
    }

    function forgeItem(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if(allItemsMaxed()){ log('🏆 Você já possui todos os equipamentos lendários!'); return; }
      const cost=300;
      if(state.gold<cost){ log('🧱 Ouro insuficiente! Precisa de 300 ouro para forjar.'); return; }
      state.gold-=cost;
      const st=total();
      const rolled=rollItem(state.level, st.luck);
      const gains=[`⚔️ ATK ${rolled.item.atk}`, `🛡️ DEF ${rolled.item.def}`, `📚 CONH ${rolled.item.kno}`, `🍀 SORTE ${rolled.item.luck}`];
      playSound('forge');
      renderHUD();
      equipOrSell(rolled.slot, rolled.item, (msg) => {
        showForgePopup(rolled.item, rolled.slot, gains);
        log(`🔨 Forja concluída! ${msg}`);
        renderHUD(); updateBadges(); saveGame();
      });
    }

    function forgeLegendary(){
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if(allItemsMaxed()){ log('🏆 Você já possui todos os equipamentos lendários!'); return; }
      const cost=1000;
      if(state.gold<cost){ log('🧱 Ouro insuficiente! Precisa de 1000 ouro para forjar lendário.'); return; }
      state.gold-=cost;
      const keys=Object.keys(state.equipment);
      const slot=keys[Math.floor(Math.random()*keys.length)];
      const legendaryItems = items[slot].filter(i => i.rar === 'legendary');
      if(legendaryItems.length === 0){ log('Sem itens lendários para este slot.'); state.gold+=cost; return; }
      const legendaryItem = legendaryItems[Math.floor(Math.random()*legendaryItems.length)];
      const legendaryItemCopy = {...legendaryItem};
      const gains = [`⚔️ ATK ${legendaryItem.atk}`, `🛡️ DEF ${legendaryItem.def}`, `📚 CONH ${legendaryItem.kno}`, `🍀 SORTE ${legendaryItem.luck}`];
      playSound('forge');
      renderHUD();
      equipOrSell(slot, legendaryItemCopy, (msg) => {
        showForgePopup(legendaryItemCopy, slot, gains);
        log(`🔨 Forja Lendária! ${msg}`);
        renderHUD(); updateBadges(); saveGame();
      });
    }

    function showForgePopup(item, slot, gains){
      const icon = itemIcons[item.n] || defaultIcons[slot];
      const desc = itemDescriptions[item.n] || '';
      const rarLabels = {common:'Comum', uncommon:'Incomum', rare:'Raro', epic:'Épico', legendary:'Lendário'};
      const popup = document.createElement('div');
      popup.className='forge-popup';
      popup.innerHTML=`
        <div class='forge-card'>
          <h3>🔨 Forja Concluída!</h3>
          <img src='${icon}' alt='${item.n}'/>
          <p class='rar-${item.rar}' style='font-size:1.1rem;font-weight:700'>${item.n}</p>
          <p style='font-size:0.72rem;color:var(--txt-dim);margin-bottom:2px'>${slotLabels[slot]} &nbsp;·&nbsp; <span class='rar-${item.rar}'>${rarLabels[item.rar]||item.rar}</span></p>
          ${desc ? `<p style='font-size:0.78rem;color:#a0b4cc;font-style:italic;margin:8px 0 10px;padding:8px 10px;background:rgba(255,255,255,0.05);border-left:3px solid var(--gold);border-radius:0 6px 6px 0;line-height:1.5'>${desc}</p>` : ''}
          <div class='forge-stats'>
            ${gains.length>0 ? gains.join(' &nbsp;·&nbsp; ') : '🔄 Nenhum atributo melhorou desta vez...'}
          </div>
          <p style='font-size:0.75rem;color:var(--txt-dim);margin-top:6px'>⚔️${item.atk} · 🛡️${item.def} · 📚${item.kno} · 🍀${item.luck}</p>
          <button class='btn gold' data-close-closest=".forge-popup">Continuar</button>
        </div>
      `;
      document.body.appendChild(popup);
      popup.addEventListener('click',(e)=>{if(e.target===popup) popup.remove();});
    }

    // ============================================================
    //  CONFRONTO FINAL — BOSS BATTLE MODE
    //  Ativa quando o jogador tem >= 90 acertos corretos
    //  As últimas 10 questões certas derrotam o Arqui-Nefromante
    // ============================================================

    const BOSS_START_CORRECT = 90;   // a partir deste acerto começa a batalha
    const BOSS_END_CORRECT   = 100;  // total de acertos para vencer

    /** Verifica se estamos na fase de Confronto Final */
    function isBossBattle() {
      return state.gameStarted &&
             state.correctTotal >= BOSS_START_CORRECT &&
             !state.gameCompleted;
    }

    /** Quantos ataques foram desferidos no boss (0-10) */
    function getBossProgress() {
      return Math.max(0, Math.min(10, state.correctTotal - BOSS_START_CORRECT));
    }

    /** HP do boss em % (100% → 0%) */
    function getBossHP() {
      return Math.max(0, 100 - getBossProgress() * 10);
    }

    function _getBossNarrText(progress) {
      if (progress >= 9) return '"Não... é impossível! Você vai acabar comigo!"';
      if (progress >= 6) return '"Sua sabedoria me corrói... mas a Uremia Eterna não será derrotada!"';
      if (progress >= 3) return '"Você ousou ferir-me com o conhecimento... Mas seu fim se aproxima!"';
      return '"Após noventa batalhas, você chega ao Trono da Uremia. O Arqui-Nefromante ergue-se diante de você."';
    }

    /**
     * Atualiza TODA a UI do Confronto Final.
     * Chamada após renderQuestion() e após cada resposta.
     */
    function updateBossUI() {
      const inBoss = isBossBattle();

      // ── Modo no body ──
      document.body.classList.toggle('boss-battle-mode', inBoss);
      // Classe especial para as últimas 10 questões (arqui-nefromante-final)
      document.body.classList.toggle('arqui-nefromante-final', inBoss);

      // ── Elementos boss ──
      const elHpBox          = document.getElementById('bossHpContainer');
      const elQNum           = document.getElementById('bossQuestionNum');
      const elBattleScene    = document.getElementById('bossBattleScene');
      const elPartyPanel     = document.getElementById('bossPartyPanel');
      const elHint           = document.getElementById('golpeFinalHint');
      const elStarsTop       = document.getElementById('finalMeterStarsTop');
      const elTitleMobile    = document.getElementById('arquiBossTitleMobile');
      const isMobile         = window.matchMedia('(max-width: 768px)').matches;
      const isArqui          = document.body.classList.contains('arqui-nefromante-final');
      const show = (el, v, disp) => { if(el) el.style.display = v ? (disp||'') : 'none'; };

      show(elHpBox,       inBoss);
      show(elQNum,        inBoss);
      // No modo arqui-nefromante-final, a cena de batalha fica oculta (heróis no painel esquerdo)
      show(elBattleScene, inBoss && !isArqui, 'flex');
      show(elPartyPanel,  false); // oculto — substituído por hero+equip+log no painel esquerdo
      show(elHint,        inBoss);
      // Estrelas no topo: no mobile arqui-nefromante-final ficam abaixo da HP bar (via CSS order)
      // Estrelas no topo: ocultar no desktop arqui-nefromante-final (as estrelas ficam dentro da barra HP)
      show(elStarsTop,    inBoss && !(isArqui && !isMobile), 'flex');
      // Título mobile: visível apenas no mobile em modo arqui-nefromante-final
      show(elTitleMobile, inBoss && isArqui && isMobile);

      if (!inBoss) {
        // Garante que elementos boss ficam ocultos fora do boss mode
        const nb = document.getElementById('bossNarrativeBox');
        const bl = document.getElementById('bossLogSection');
        if (nb) nb.style.display = 'none';
        if (bl) bl.style.display = 'none';
        return;
      }

      const progress = getBossProgress();
      const hp       = getBossHP();

      // ── Narrativa do boss (painel esquerdo) ──
      const bossNarr = document.getElementById('bossNarrativeBox');
      if (bossNarr) {
        bossNarr.innerHTML = `
          <h3>☠ Confronto Final</h3>
          <p id="bossNarrText">${_getBossNarrText(progress)}</p>`;
      }

      // ── Log de batalha (painel esquerdo) ──
      const bossLogEl = document.getElementById('bossLogEntries');
      if (bossLogEl && state.bossLog && state.bossLog.length) {
        bossLogEl.innerHTML = [...state.bossLog].reverse()
          .slice(0, 12)
          .map(e => `<div class="boss-log-entry ${e.cls}">${e.txt}</div>`)
          .join('');
      }

      // ── HP Bar ──
      const hpFill  = document.getElementById('bossHpFill');
      const hpPct   = document.getElementById('bossHpPct');
      if (hpFill) hpFill.style.width = hp + '%';
      if (hpPct)  hpPct.textContent = `HP ${hp}%`;

      // Muda cor da barra conforme HP diminui
      if (hpFill) {
        if (hp > 60)      hpFill.style.background = 'linear-gradient(90deg,#4c1d95,#7c3aed,#a855f7,var(--purple))';
        else if (hp > 30) hpFill.style.background = 'linear-gradient(90deg,#831843,#be185d,#ec4899)';
        else              hpFill.style.background = 'linear-gradient(90deg,#7f1d1d,#dc2626,#f87171)';
      }

      // ── Contador de questão ──
      const qNum = progress + 1;
      if (elQNum) {
        elQNum.textContent = progress >= 10
          ? 'QUESTÃO FINAL 10/10 — VITÓRIA!'
          : `QUESTÃO FINAL ${qNum}/10`;
      }

      // ── Botão Próxima: "ATACAR (responder)" nas questões 91-99, "GOLPE FINAL" apenas na última (100ª) ──
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn) nextBtn.textContent = progress >= 9 ? 'GOLPE FINAL' : 'ATACAR (PRÓXIMA PERGUNTA)';

      // ── Hint do botão ──
      if (elHint) {
        elHint.textContent = hp <= 10
          ? 'VITÓRIA GARANTIDA COM RESPOSTA CORRETA'
          : 'ATIVADO APÓS SELECIONAR A RESPOSTA CORRETA';
        elHint.style.color = hp <= 10 ? '#ffd700' : '';
      }

      // ── Medidor de estrelas (topo da página) ──
      const buildStars = (container) => {
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 10; i++) {
          const s = document.createElement('span');
          const isLastAndFilled = (i === 9 && progress >= 10);
          if (isLastAndFilled) {
            s.className = 'final-star star-last-gold';
          } else if (i < progress) {
            s.className = 'final-star filled';
          } else {
            s.className = 'final-star';
          }
          s.textContent = '★';
          container.appendChild(s);
        }
      };
      buildStars(elStarsTop);

      // ── Medidor de estrelas mobile (abaixo da HP bar) — oculto no arqui-nefromante-final (stars vão dentro da barra) ──
      const elStarsMobile = document.getElementById('arquiStarsMobile');
      if (elStarsMobile) {
        show(elStarsMobile, false);
      }

      // ── Medidor de estrelas desktop (abaixo da HP bar) ──
      const elStarsDesktop = document.getElementById('arquiStarsDesktop');
      if (elStarsDesktop) {
        buildStars(elStarsDesktop);
      }

      // ── Estrelas HP dentro da barra (desktop e mobile no modo arqui-nefromante-final) ──
      const elHpStarsDesktop = document.getElementById('arquiHpStarsDesktop');
      const elHpTrack = document.getElementById('bossHpTrack');
      if (elHpStarsDesktop && isArqui) {
        // Atualiza a largura do fundo roxo via CSS custom property (100% → 0% conforme progress)
        const hpWidthPct = Math.max(0, 100 - (progress * 10));
        if (elHpTrack) elHpTrack.style.setProperty('--hp-width', hpWidthPct + '%');
        // Renderiza as 10 estrelas + label HP dentro da barra
        elHpStarsDesktop.innerHTML = '';
        // Label HP à esquerda
        const hpLbl = document.createElement('span');
        hpLbl.style.cssText = 'font-family:"Philosopher",sans-serif;font-size:0.72rem;font-weight:700;color:#e9d5ff;letter-spacing:1.5px;position:relative;z-index:2;white-space:nowrap;margin-right:6px;text-shadow:0 0 8px rgba(216,180,254,0.9),0 0 16px rgba(168,85,247,0.6);';
        hpLbl.textContent = 'HP ' + hpWidthPct + '%';
        elHpStarsDesktop.appendChild(hpLbl);
        // Estrelas
        for (let i = 0; i < 10; i++) {
          const s = document.createElement('span');
          s.className = 'arqui-hp-star';
          if (i < progress) {
            s.classList.add('filled');
            if (i === progress - 1) s.classList.add('last-filled');
          }
          s.textContent = '★';
          elHpStarsDesktop.appendChild(s);
        }
      }

      // ── Medidor de estrelas (fundo do painel direito) ──
      const elStarsBottom = document.getElementById('finalMeterStars');
      const elMeterContainer = document.getElementById('finalMeterContainer');
      show(elMeterContainer, inBoss);
      buildStars(elStarsBottom);

      const meterResult = document.getElementById('finalMeterResult');
      if (meterResult) {
        if (progress >= 10) {
          meterResult.textContent = 'FINALIZADO';
          meterResult.style.color = '#ffd700';
        } else if (hp <= 10) {
          meterResult.textContent = 'VITÓRIA GARANTIDA';
          meterResult.style.color = '#ffd700';
        } else {
          meterResult.textContent = '';
        }
      }
      const meterHint = document.getElementById('finalMeterHint');
      if (meterHint) meterHint.textContent = 'ATIVADO APÓS A RESPOSTA CORRETA';

      // ── Boss image swap ──
      const bossImgEl      = document.getElementById('arquiBossImgEl');
      const bossGolpeText  = document.getElementById('bossGolpeFinalText');
      const bossImgWrapEl  = bossImgEl ? bossImgEl.closest('.boss-img-wrap') : null;
      if (bossImgEl && bossGolpeText) {
        if (progress >= 9) {
          // Última questão: esconde imagem, mostra "GOLPE FINAL"
          if (bossImgWrapEl) bossImgWrapEl.style.display = 'none';
          bossGolpeText.style.display = 'flex';
          // Popup battle_final — exibe apenas uma vez
          if (!state.battleFinalShown) {
            state.battleFinalShown = true;
            setTimeout(() => showBattleFinalPopup(), 200);
          }
        } else if (progress === 8) {
          // Penúltima questão: mostra clash_final
          if (bossImgWrapEl) bossImgWrapEl.style.display = '';
          bossGolpeText.style.display = 'none';
          if (bossImgEl.getAttribute('src') !== 'assets/clash_final.png') {
            bossImgEl.src = 'assets/clash_final.png';
            bossImgEl.style.objectPosition = 'center center';
          }
        } else {
          // Questões normais: mostra nefromancer
          if (bossImgWrapEl) bossImgWrapEl.style.display = '';
          bossGolpeText.style.display = 'none';
          if (bossImgEl.getAttribute('src') !== 'assets/nefromancer.png') {
            bossImgEl.src = 'assets/nefromancer.png';
            bossImgEl.style.objectPosition = 'center 30%';
          }
        }
      }

      // ── Heróis na party panel, battle scene e strip mobile ──
      const heroData = {
        nephros:    { party: 'partyHero1Img', battle: 'battleHero1', strip: 'arquiStripHero1', folder: 'clerigo_renal',        ext: 'jpg' },
        aquaria:    { party: 'partyHero2Img', battle: 'battleHero2', strip: 'arquiStripHero2', folder: 'maga_metabolica',      ext: 'jpg' },
        glomerulus: { party: 'partyHero3Img', battle: 'battleHero3', strip: 'arquiStripHero3', folder: 'guerreiro_glomerular', ext: 'png' }
      };
      const selChar = state.character;
      const lv = Math.min(state.level, 10);

      Object.entries(heroData).forEach(([key, info]) => {
        const isSelected = (key === selChar);
        const lvToUse = isSelected ? lv : Math.min(lv, 5);
        const src = `assets/classes/${info.folder}/nivel_${String(lvToUse).padStart(2, '0')}.${info.ext}`;

        const partyEl  = document.getElementById(info.party);
        const battleEl = document.getElementById(info.battle);
        const stripEl  = document.getElementById(info.strip);
        if (partyEl) {
          partyEl.src = src;
          partyEl.classList.toggle('hero-selected', isSelected);
        }
        if (battleEl) {
          battleEl.src = src;
          battleEl.classList.toggle('hero-selected', isSelected);
        }
        if (stripEl) {
          stripEl.src = src;
          stripEl.classList.toggle('hero-selected', isSelected);
        }
      });

      // Estado crítico de HP
      document.body.classList.toggle('boss-hp-critical', hp <= 30);

      // ── Imagem boss retangular desktop: troca para batalha na questão 9 (progress === 8) ──
      const arquiBossImgEl = document.getElementById('arquiBossImgEl');
      if (arquiBossImgEl && isArqui) {
        if (progress >= 9) {
          arquiBossImgEl.src = 'assets/battle_final.png';
          arquiBossImgEl.style.objectPosition = 'center top';
          arquiBossImgEl.style.clipPath = 'inset(0 0 9% 0)';
        } else {
          arquiBossImgEl.src = 'assets/nefromancer.png';
          arquiBossImgEl.style.objectPosition = 'center 30%';
        }
      }

      // ── Popup Golpe Final na última questão (progress === 9 = questão 10/10) ──
      if (progress === 9 && isArqui) {
        const popup = document.getElementById('arquiQ9Popup');
        if (popup && !popup._shown) {
          popup._shown = true;
          popup.style.display = 'flex';
        }
      }
    }

    /**
     * Injeta os ícones de letra (A/B/C/D) nas opções em boss mode.
     * Deve ser chamada APÓS renderQuestion() preencher as options.
     */
    function applyBossOptionBadges() {
      // No modo arqui-nefromante-final: garantir que o prefixo A) B) C) D)
      // esteja no texto como texto simples (igual página normal), sem badge circular
      if (!isBossBattle()) return;
      const opts = document.querySelectorAll('#options .option');
      const letters = ['A','B','C','D'];
      opts.forEach((btn, i) => {
        // Remover badge circular caso exista de execução anterior
        btn.querySelectorAll('.boss-letter-badge').forEach(b => b.remove());
        // Garantir que o texto já começa com "A) " — se foi removido, restaurar
        const textNode = [...btn.childNodes].find(n => n.nodeType === 3);
        if (textNode) {
          const prefix = (letters[i] || String.fromCharCode(65+i)) + ') ';
          if (!textNode.textContent.trim().startsWith(prefix.trim())) {
            textNode.textContent = prefix + textNode.textContent.replace(/^[A-D]\)\s*/, '');
          }
        }
      });
    }

    /**
     * Anima a estrela recém-conquistada com efeito "pop".
     * Chamado após acerto correto em boss mode.
     */
    function animateLastBossStar() {
      if (!isBossBattle()) return;
      const progress = getBossProgress();   // já foi incrementado
      const idx = progress - 1;
      // Anima nas três barras (topo, fundo e mobile)
      ['finalMeterStarsTop', 'finalMeterStars', 'arquiStarsMobile', 'arquiStarsDesktop'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const stars = el.querySelectorAll('.final-star');
        if (stars[idx]) {
          stars[idx].classList.add('pop');
          setTimeout(() => stars[idx]?.classList.remove('pop'), 600);
        }
      });
    }

    // ── Demo / Preview mode ─────────────────────────────────────

    /**
     * Inicia diretamente o Confronto Final para revisão rápida.
     * Usa o primeiro personagem, seta correctTotal=90 e salta para o jogo.
     */
    function startBossPreview() {
      // Escolhe Dr. Nephros como personagem padrão
      state.character = 'nephros';
      // Inicializa estado
      Object.assign(state, {
        level: 12, xp: 0, xpToNext: 500,
        score: 24970, lives: 3, streak: 0, gold: 500,
        current: null, answered: false, bonusUses: 0,
        correctTotal: 90, narrativeShown: 90, bossIntroShown: true,
        gameOver: false, gameStarted: true,
        extraLifeGiven: false, gameCompleted: false,
        completedGame: false, chestsOpened: 3
      });
      state.equipment = {
        weapon: { n:'Lança Glomerular',  rar:'epic',  atk:8, def:3, kno:6, luck:4 },
        armor:  { n:'Égide Dialítica',   rar:'epic',  atk:2, def:7, kno:3, luck:1 },
        relic:  { n:'Orbe da Cistatina', rar:'epic',  atk:2, def:2, kno:6, luck:2 }
      };
      state.heroName = 'Previewer';

      // Fecha welcome
      document.getElementById('welcomeScreen')?.classList.add('hidden');
      document.getElementById('mainApp')?.classList.remove('hidden');
      document.getElementById('actionDock')?.classList.remove('hidden');

      ui.journal.innerHTML = '';
      log('⚔️ [PREVIEW] Confronto Final iniciado — correctTotal=90.');

      shuffleQueue();
      renderHUD();
      updateBadges();
      renderQuestion();
      updateBossUI();
      applyBossOptionBadges();
      saveGame();

      // Toca som de boss
      setTimeout(() => playSound('boss'), 400);
    }

    // ============================================================
    // ============ SISTEMA DE NARRATIVA PROGRESSIVA ============
    const narrativeStages = [
      {at:5, ch:"Capítulo I", title:"O Chamado das Águas", text:"Nos corredores sombrios do Hospital dos Néfrons Perdidos, um pergaminho antigo cai em suas mãos. Nele, um alerta: o Arqui-Nefromante está corrompendo os rins do reino, transformando néfrons saudáveis em pedra. Apenas um médico corajoso pode impedi-lo. Sua jornada começa agora."},
      {at:10, ch:"Capítulo II", title:"As Criptas da Creatinina", text:"Você desce às Criptas da Creatinina, onde os primeiros sinais da corrupção são visíveis. Túbulos proximais enegrecidos, glomérulos encolhidos... O Arqui-Nefromante deixou rastros de ureia cristalizada. Cada questão que você domina purifica um néfron. Continue — os rins precisam de você."},
      {at:15, ch:"Capítulo III", title:"A Floresta dos Eletrólitos", text:"A Floresta dos Eletrólitos é um lugar traiçoeiro. Sódio e potássio flutuam como espíritos desequilibrados. Você encontra um velho mestre nefrologista que sussurra: 'O equilíbrio ácido-base é a chave. Sem ele, nenhum rim sobrevive.' Suas respostas corretas restauram a harmonia iônica."},
      {at:20, ch:"Capítulo IV", title:"O Lago da Filtração", text:"No Lago da Filtração, a água cristalina está turva. A barreira glomerular foi danificada — proteínas escapam para a urina como ouro derramado. Você precisa reconstruir os podócitos, um por um. Cada acerto é um passo para restaurar a membrana basal. A proteinúria diminui."},
      {at:25, ch:"Capítulo V", title:"As Montanhas do SRAA", text:"As Montanhas do Sistema Renina-Angiotensina-Aldosterona são imponentes. No topo, a angiotensina II sopra ventos de vasoconstrição sobre o reino. Você empunha o Escudo do IECA e avança. Com cada resposta certa, a pressão intraglomerular cede. Os néfrons respiram aliviados."},
      {at:30, ch:"Capítulo VI", title:"O Deserto da Diálise", text:"O Deserto da Diálise é árido e implacável. Aqui vivem os pacientes que perderam a batalha contra a DRC. Mas há esperança: as máquinas de hemodiálise brilham como oásis. Você aprende seus segredos — clearance, Kt/V, ultrafiltração. Cada conhecimento salva uma vida."},
      {at:35, ch:"Capítulo VII", title:"A Caverna dos Imunocomplexos", text:"Nas profundezas da Caverna dos Imunocomplexos, depósitos de IgA e complemento brilham nas paredes como cristais malignos. Glomerulonefrites se escondem em cada sombra. Você identifica padrões — mesangial, membranoso, crescêntico. Seu conhecimento é sua arma mais poderosa."},
      {at:40, ch:"Capítulo VIII", title:"A Torre do Transplante", text:"A Torre do Transplante se ergue no horizonte, brilhante e cheia de promessas. Mas o caminho é guardado por rejeições hiperagudas e crises de ciclosporina. Você estuda compatibilidade HLA, imunossupressão, e infecções oportunistas. Um rim novo aguarda quem provar ser digno."},
      {at:45, ch:"Capítulo IX", title:"O Labirinto Cardiorrenal", text:"O Labirinto Cardiorrenal é onde coração e rim se entrelaçam em destino compartilhado. SGLT2i, finerenona, ARM — as armas modernas estão ao seu alcance. Cada corredor revela uma síndrome diferente. Tipo 1, tipo 2, tipo 3... Você navega com precisão. A tríade terapêutica se completa."},
      {at:50, ch:"Capítulo X", title:"O Vulcão da Rabdomiólise", text:"O Vulcão da Rabdomiólise entra em erupção! Mioglobina incandescente desce pelas encostas, obstruindo túbulos e destruindo néfrons. Você ordena hidratação agressiva, alcalinização da urina, e monitoramento de CPK. A lava esfria. Os rins sobrevivem — por enquanto."},
      {at:55, ch:"Capítulo XI", title:"O Pântano da Acidose", text:"O Pântano da Acidose Tubular é traiçoeiro. pH urinário que não baixa, hipocalemia persistente, nefrocalcinose... Você diferencia tipo 1, tipo 2 e tipo 4 com maestria. Citrato de potássio na mão, bicarbonato no bolso. O equilíbrio ácido-base é restaurado, néfron por néfron."},
      {at:60, ch:"Capítulo XII", title:"As Muralhas de KDIGO", text:"As Muralhas de KDIGO protegem o conhecimento acumulado de gerações de nefrologistas. TFG, albuminúria, mapa de calor de risco — tudo se conecta. Você estuda as diretrizes como um guerreiro estuda mapas de batalha. G1 a G5, A1 a A3. A estratificação é sua bússola."},
      {at:65, ch:"Capítulo XIII", title:"O Templo dos SGLT2i", text:"No Templo dos SGLT2i, os pergaminhos sagrados do DAPA-CKD e EMPA-KIDNEY revelam verdades revolucionárias. Nefroproteção independente de diabetes! O 'dip' inicial da TFG não é dano — é proteção. Você empunha a dapagliflozina como uma espada de luz contra a progressão renal."},
      {at:70, ch:"Capítulo XIV", title:"A Ponte dos Podócitos", text:"A Ponte dos Podócitos conecta o mundo glomerular ao tubular. Cada podócito é um guardião da barreira de filtração. FSGS, nefropatia membranosa, GESF... Você aprende a reconhecer padrões na microscopia eletrônica. PLA2R brilha como um farol diagnóstico. A ponte se fortalece."},
      {at:75, ch:"Capítulo XV", title:"O Abismo da Hipercalemia", text:"O Abismo da Hipercalemia se abre sob seus pés! Ondas T apiculadas, QRS alargado — o coração do reino está em perigo. Gluconato de cálcio para estabilizar, insulina com glicose para redistribuir, resina para eliminar. Você age rápido. O ECG normaliza. O reino respira."},
      {at:80, ch:"Capítulo XVI", title:"A Fortaleza da Finerenona", text:"A Fortaleza da Finerenona é a última adição ao arsenal nefroprotetor. ARM não esteroidal, sem a ginecomastia da espironolactona. FIDELIO-DKD e FIGARO-DKD provam seu valor. A tríade está completa: IECA/BRA + SGLT2i + Finerenona. O Arqui-Nefromante treme."},
      {at:85, ch:"Capítulo XVII", title:"O Santuário da Peritoneal", text:"No Santuário da Diálise Peritoneal, o peritônio é a membrana sagrada. Você aprende sobre trocas osmóticas, icodextrina, peritonite e esclerose encapsulante. Cada paciente é único — adequação, clearance, ultrafiltração. O santuário brilha com conhecimento aplicado."},
      {at:90, ch:"Capítulo XVIII", title:"O Portal do Xenotransplante", text:"Um portal brilhante se abre: o futuro do transplante renal! Rins suínos geneticamente editados, 10 modificações genéticas para vencer a rejeição hiperaguda. Montgomery e Riella mostram o caminho. A fila de transplante pode ter seus dias contados. O futuro é agora."},
      {at:95, ch:"Capítulo XIX", title:"O Confronto com o Arqui-Nefromante", text:"Finalmente, você chega ao Trono da Uremia, onde o Arqui-Nefromante aguarda. Ele lança feitiços de azotemia, hiperfiltração maligna e nefrotoxicidade. Mas você está preparado — cada questão respondida foi um feitiço aprendido. A batalha final começa!"},
      {at:99, ch:"Capítulo XX", title:"A Última Prova", text:"O Arqui-Nefromante ergue seu cajado sombrio. Rins corrompidos orbitam ao seu redor como satélites de pura destruição renal. Seus golens de uremia avançam. Ele ri: 'Você acha que pode me derrotar? Eu sou a Insuficiência Renal Eterna!' Mas você sente o poder de todo o conhecimento acumulado pulsando em suas veias. Uma última questão. Uma última resposta. O destino dos rins do reino depende de você.", boss:true},
      {at:100, ch:"Epílogo", title:"Os Rins Foram Salvos!", text:"Com um último golpe de conhecimento puro, o Arqui-Nefromante é derrotado! Os néfrons do reino voltam a filtrar com perfeição. A creatinina normaliza, a proteinúria desaparece, o equilíbrio hidroeletrolítico é restaurado. Você é coroado(a) como o(a) Grande Guardião(ã) dos Rins. A nefrologia está salva — graças a você!"}
    ];


    // ===== MINIGAME: JULGAMENTO RÁPIDO =====
    // Data loaded from data/rapid-quiz.js

    let _minigameTriggerCount = 0;
    let _shownMinigameIds = new Set(); // anti-repetição na sessão
    const MINIGAME_TRIGGER_AT = [25, 50, 75]; // 3 triggers GARANTIDOS

    function maybeTriggerMinigame(atCorrectTotal) {
      if (!MINIGAME_TRIGGER_AT.includes(atCorrectTotal)) return;
      if (_minigameTriggerCount >= MINIGAME_TRIGGER_AT.length) return;
      const triggerIdx = MINIGAME_TRIGGER_AT.indexOf(atCorrectTotal);
      _minigameTriggerCount++;
      setTimeout(() => showMinigameIntroPopup(atCorrectTotal, triggerIdx), 1500);
    }

    const _minigameIntros = [
      { title:"A Pedra do Julgamento", icon:"⚡", chapter:"Evento Especial · Capítulo V",
        text:"Ao cruzar as Montanhas do SRAA, uma pedra ancestral emerge das névoas, gravada com runas douradas! Dez afirmações sobre nefrologia aguardam seu julgamento. A Pedra recompensa o sábio — e expõe o ignorante.",
        reward:"Ouro, XP e itens raros para o mestre do conhecimento!" },
      { title:"O Tribunal das Verdades Renais", icon:"⚖️", chapter:"Evento Especial · Capítulo X",
        text:"No Vulcão da Rabdomiólise, um tribunal etéreo se materializa! Espíritos dos grandes nefrologistas exigem que você prove ser digno. Dez verdades e mentiras se misturam — apenas o erudito as separa.",
        reward:"Recompensas elevadas aguardam quem vencer o Tribunal!" },
      { title:"O Oráculo do Abismo", icon:"🔮", chapter:"Evento Especial · Capítulo XV",
        text:"No Abismo da Hipercalemia, um oráculo antigo bloqueia seu avanço rumo ao Arqui-Nefromante! 'Prove o domínio da verdade nefrológica,' ecoa entre as paredes. Este é o último teste antes da batalha final.",
        reward:"O Oráculo oferece o maior tesouro para o digno!" }
    ];

    function showMinigameIntroPopup(atCorrectTotal, triggerIdx) {
      const intro = _minigameIntros[triggerIdx] || _minigameIntros[0];
      const popup = document.createElement('div');
      popup.className = 'narrative-popup';
      popup.id = 'minigameIntroPopup';
      popup.innerHTML = `
        <div class='narrative-card' style="border-color:#4ade80;box-shadow:0 0 40px rgba(74,222,128,0.35);">
          <div class='narr-chapter' style="color:#4ade80;">${intro.chapter}</div>
          <h3 style="color:#a7f3d0;">${intro.icon} ${intro.title}</h3>
          <div class='narr-text' style="color:#d1fae5;font-style:italic;">${intro.text}</div>
          <div style="background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.35);border-radius:10px;padding:10px 14px;margin:14px 0;text-align:center;">
            <div style="font-size:0.7rem;color:#4ade80;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">🎁 Prêmio Disponível</div>
            <div style="font-size:0.8rem;color:#a7f3d0;">${intro.reward}</div>
          </div>
          <div class='narr-progress'>
            <strong>${state.correctTotal}</strong> acertos · Nível <strong>${state.level}</strong>
          </div>
          <button class='btn gold' id='acceptMinigameBtn' style="background:linear-gradient(135deg,#065f46,#059669);border-color:#4ade80;color:#ecfdf5;width:100%;">⚡ Aceitar o Desafio!</button>
        </div>`;
      document.body.appendChild(popup);
      document.getElementById('acceptMinigameBtn')?.addEventListener('click', () => {
        popup.remove();
        showRapidQuizMinigame();
      });
    }

    function showRapidQuizMinigame(standalone) {
      standalone = !!standalone;
      const POOL_SIZE = 10;
      // Selecionar 10 questões evitando repetição na sessão
      let availableIdx = RAPID_QUIZ_QUESTIONS.map((_,i)=>i).filter(i => !_shownMinigameIds.has(i));
      if (availableIdx.length < POOL_SIZE) {
        _shownMinigameIds.clear();
        availableIdx = RAPID_QUIZ_QUESTIONS.map((_,i)=>i);
      }
      // Fisher-Yates parcial
      for (let i = availableIdx.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIdx[i], availableIdx[j]] = [availableIdx[j], availableIdx[i]];
      }
      const selectedIdx = availableIdx.slice(0, POOL_SIZE);
      selectedIdx.forEach(i => _shownMinigameIds.add(i));
      const pool = selectedIdx.map(i => RAPID_QUIZ_QUESTIONS[i]);

      let currentIdx = 0;
      let correctCount = 0;
      let timerInterval = null;
      let _answered = false;
      const TIME_PER_Q = 8;

      const overlay = document.createElement('div');
      overlay.className = 'minigame-overlay';
      overlay.id = 'rapidQuizOverlay';
      document.body.appendChild(overlay);

      window._exitMinigame = function() {
        if (timerInterval) clearInterval(timerInterval);
        overlay.remove();
        delete window.mgAnswer;
        delete window._exitMinigame;
      };

      function _renderMinigameQuestion() {
        if (currentIdx >= pool.length) { showResults(); return; }
        const q = pool[currentIdx];
        let timeLeft = TIME_PER_Q;
        _answered = false;
        if (timerInterval) clearInterval(timerInterval);

        overlay.innerHTML = `
          <div class="minigame-card">
            ${standalone ? '<button data-action="_exitMinigame" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#64748b;font-size:1.1rem;cursor:pointer;line-height:1;" title="Sair">✕</button>' : ''}
            <div class="minigame-title">⚡ Julgamento Rápido</div>
            <div class="minigame-subtitle">Verdadeiro ou Falso? ${TIME_PER_Q}s por afirmação</div>
            <div class="minigame-progress">${currentIdx + 1} / ${pool.length}</div>
            <div class="minigame-timer"><div class="minigame-timer-fill" id="mgTimerFill" style="width:100%"></div></div>
            <div class="minigame-stmt" id="mgStmt">${escapeHtml(q.q)}</div>
            <div class="minigame-tf-btns">
              <button class="minigame-true-btn" id="mgTrue" data-action="mgAnswer" data-arg="true" data-arg-type="boolean">✓ VERDADEIRO</button>
              <button class="minigame-false-btn" id="mgFalse" data-action="mgAnswer" data-arg="false" data-arg-type="boolean">✗ FALSO</button>
            </div>
            <div id="mgFeedback" style="min-height:32px;font-size:0.75rem;color:#94a3b8;text-align:center;line-height:1.4;"></div>
          </div>`;

        timerInterval = setInterval(() => {
          timeLeft -= 0.1;
          const fill = document.getElementById('mgTimerFill');
          if (fill) fill.style.width = Math.max(0, (timeLeft / TIME_PER_Q * 100)) + '%';
          if (timeLeft <= 0) {
            clearInterval(timerInterval);
            mgAnswer(null);
          }
        }, 100);
      }

      window.mgAnswer = function(userAns) {
        if (_answered) return; // previne double-click / double-fire por timer
        _answered = true;
        if (timerInterval) clearInterval(timerInterval);
        const q = pool[currentIdx];
        const isCorrect = userAns === q.ans;
        if (isCorrect) correctCount++;
        const fb = document.getElementById('mgFeedback');
        const trueBtn = document.getElementById('mgTrue');
        const falseBtn = document.getElementById('mgFalse');
        if (trueBtn) trueBtn.disabled = true;
        if (falseBtn) falseBtn.disabled = true;
        if (userAns !== null) {
          const clickedBtn = userAns ? trueBtn : falseBtn;
          const correctBtn = q.ans ? trueBtn : falseBtn;
          if (clickedBtn) clickedBtn.style.opacity = isCorrect ? '1' : '0.5';
          if (!isCorrect && correctBtn) correctBtn.style.boxShadow = '0 0 14px rgba(74,222,128,0.85)';
        }
        if (fb) {
          fb.style.color = isCorrect ? '#4ade80' : '#fb7185';
          fb.textContent = (userAns === null ? '⏱️ Tempo esgotado! ' : (isCorrect ? '✓ Correto! ' : '✗ Incorreto! ')) + q.exp;
        }
        currentIdx++;
        // Resposta antecipada: avança em 1000ms quando usuário clica; timeout = 1800ms
        setTimeout(_renderMinigameQuestion, userAns !== null ? 1000 : 1800);
      };

      function _getItemReward(score) {
        if (score < 8) return null;
        const slotKeys = ['weapon','armor','relic'];
        const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
        const slotPool = items[slot];
        const tiers = score >= 9 ? ['epic','legendary'] : ['rare','epic'];
        const candidates = slotPool.filter(i => tiers.includes(i.rar));
        const item = candidates.length
          ? candidates[Math.floor(Math.random()*candidates.length)]
          : slotPool[Math.floor(Math.random()*slotPool.length)];
        return { slot, item: Object.assign({}, item) };
      }

      function showResults() {
        const total = pool.length;
        const pct = correctCount / total;
        const baseGold = 30 + correctCount * 20;
        const baseXP   = 10 + correctCount * 8;
        const mult = pct >= 0.8 ? 1.5 : 1;
        const goldReward = standalone ? 0 : Math.round(baseGold * mult);
        const xpReward   = standalone ? 0 : Math.round(baseXP * mult);
        const itemReward = standalone ? null : _getItemReward(correctCount);

        if (!standalone) {
          state.gold += goldReward;
          gainXP(xpReward);
        }

        const emojis = ['😓','😓','🤔','🤔','🙂','🙂','😊','🌟','🌟','🏆','🏆'];
        const emoji = emojis[correctCount] || '🏆';
        const msg = correctCount >= 9 ? 'Maestria absoluta! Você domina a nefrologia!' :
                    correctCount >= 7 ? 'Excelente! Conhecimento de mestre!' :
                    correctCount >= 5 ? 'Bom! Continue aprimorando.' :
                    correctCount >= 3 ? 'Pratique mais esses tópicos.' :
                    'Revise os conceitos. Você chega lá!';

        const itemHtml = itemReward ? `
          <div style="background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.45);border-radius:10px;padding:10px 14px;margin:8px 0;text-align:center;">
            <div style="font-size:0.7rem;color:#4ade80;font-weight:700;letter-spacing:1px;margin-bottom:4px;">🎁 ITEM CONQUISTADO</div>
            <div style="font-size:0.9rem;color:#a7f3d0;font-weight:700;">${itemReward.item.n}</div>
            <div style="font-size:0.7rem;color:#6ee7b7;text-transform:uppercase;letter-spacing:1px;">${itemReward.item.rar} · ATK ${itemReward.item.atk} · DEF ${itemReward.item.def} · KNO ${itemReward.item.kno}</div>
          </div>` : '';

        const rewardHtml = standalone
          ? `<div class="minigame-reward" style="color:#94a3b8;">Modo Livre — sem recompensas de jogo</div>`
          : `<div class="minigame-reward">+${goldReward} 🪙  +${xpReward} XP</div>${itemHtml}`;

        let standaloneBest = '';
        if (standalone) {
          const bestKey = 'nefroquest-minigame-best';
          const prev = parseInt(localStorage.getItem(bestKey) || '0', 10);
          if (correctCount > prev) {
            localStorage.setItem(bestKey, String(correctCount));
            standaloneBest = `<div style="font-size:0.72rem;color:#fbbf24;text-align:center;margin-bottom:10px;">⭐ Novo recorde pessoal!</div>`;
          } else if (prev > 0) {
            standaloneBest = `<div style="font-size:0.72rem;color:#94a3b8;text-align:center;margin-bottom:10px;">Recorde pessoal: ${prev}/10</div>`;
          }
        }

        const continueBtnAttrs = standalone
          ? `data-remove-id="rapidQuizOverlay"`
          : `data-remove-id="rapidQuizOverlay" data-action-seq="renderHUD,updateBadges,saveGame"`;

        overlay.innerHTML = `
          <div class="minigame-card">
            <div class="minigame-title">⚡ Resultado</div>
            <div class="minigame-result">${emoji} ${correctCount}/${total} corretas</div>
            ${rewardHtml}
            ${standaloneBest}
            <p style="color:#94a3b8;font-size:0.75rem;text-align:center;margin-bottom:16px">${msg}</p>
            <button class="diff-confirm-btn" id="mgContinueBtn" ${continueBtnAttrs}>${standalone ? '✓ Fechar' : 'Continuar a Jornada'}</button>
          </div>`;

        if (itemReward) {
          document.getElementById('mgContinueBtn')?.addEventListener('click', () => {
            setTimeout(() => {
              try { equipOrSell(itemReward.slot, itemReward.item, m => log(m)); } catch(e) {}
            }, 400);
          }, { once: true });
        }

        if (!standalone) {
          log('⚡ Julgamento Rápido: ' + correctCount + '/' + total + ' corretas → +' + goldReward + ' ouro +' + xpReward + ' XP' + (itemReward ? ' + ' + itemReward.item.n : ''));
        }
      }

      _renderMinigameQuestion();
    }
    window.showRapidQuizMinigame = showRapidQuizMinigame;
    window.showStandaloneMinigame = function() { showRapidQuizMinigame(true); };

    function checkNarrative(){
      // Popup especial de intro do boss ao atingir 90 acertos
      if (state.correctTotal === BOSS_START_CORRECT && !state.bossIntroShown) {
        state.bossIntroShown = true;
        state.narrativeShown = BOSS_START_CORRECT; // marca capítulo 90 como visto
        _track('boss_entered', { level: state.level, score: state.score, difficulty: state.difficulty });
        showBossIntroPopup();
        return; // não mostra narrativa comum ao mesmo tempo
      }
      // Narrativa de 100 acertos é substituída pelo modal de vitória (checkGameCompletion)
      if (state.correctTotal >= 100) return;
      const stage = narrativeStages.find(s => s.at === state.correctTotal && state.narrativeShown < s.at);
      if(!stage) return;
      state.narrativeShown = stage.at;
      showNarrativePopup(stage);
      // Chance de minigame após narrativa em checkpoints específicos
      maybeTriggerMinigame(stage.at);
    }

    function showBattleFinalPopup() {
      const popup = document.createElement('div');
      popup.id = 'battleFinalPopup';
      popup.style.cssText = `
        position:fixed;inset:0;z-index:99999;
        background:rgba(0,0,0,0.88);
        display:flex;align-items:center;justify-content:center;
        animation:fadeIn 0.5s ease;
        padding:16px;
      `;
      popup.innerHTML = `
        <div style="
          max-width:560px;width:100%;
          background:linear-gradient(160deg,#0a0118 0%,#120230 60%,#0a0118 100%);
          border:2px solid rgba(168,85,247,0.7);
          border-radius:18px;
          padding:24px 20px 20px;
          text-align:center;
          box-shadow:0 0 60px rgba(168,85,247,0.4),0 0 120px rgba(88,28,135,0.2);
        ">
          <div style="font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:4px;color:rgba(192,132,252,0.7);text-transform:uppercase;margin-bottom:8px;">Questão Final</div>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(1rem,4vw,1.4rem);font-weight:900;letter-spacing:3px;color:#e9d5ff;text-shadow:0 0 20px rgba(216,180,254,0.9);margin:0 0 16px;">⚔ GOLPE FINAL ⚔</h2>
          <!-- Imagem battle_final cortada (esconde texto amarelo no fundo) -->
          <div style="border-radius:12px;overflow:hidden;border:2px solid rgba(168,85,247,0.5);box-shadow:0 0 30px rgba(168,85,247,0.4);height:340px;">
            <img src="assets/battle_final.png" alt="Batalha Final" style="width:100%;height:370px;object-fit:cover;object-position:center top;display:block;">
          </div>
          <p style="font-family:'Philosopher',serif;font-size:0.88rem;color:#c4b5fd;line-height:1.7;font-style:italic;margin:16px 0 20px;padding:0 4px;">
            Este é o momento decisivo. Uma única resposta separa a vitória da derrota eterna.<br>
            <strong style="color:#e9d5ff;">O destino dos rins do reino está em suas mãos.</strong>
          </p>
          <button data-remove-id="battleFinalPopup" style="
            background:linear-gradient(135deg,#4c1d95,#7c3aed);
            color:#e9d5ff;border:2px solid rgba(168,85,247,0.6);
            border-radius:10px;padding:12px 32px;
            font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;
            letter-spacing:2px;cursor:pointer;text-transform:uppercase;
            box-shadow:0 0 20px rgba(124,58,237,0.5);
          ">ENFRENTAR O DESTINO</button>
        </div>
      `;
      document.body.appendChild(popup);
    }

    function showBossIntroPopup() {
      playSound('boss');
      const popup = document.createElement('div');
      popup.id = 'bossIntroPopup';
      popup.style.cssText = `
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.92);
        display: flex; align-items: flex-start; justify-content: center;
        animation: fadeIn 0.6s ease;
        padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
        overflow-y: auto;
        box-sizing: border-box;
      `;
      popup.innerHTML = `
        <div style="
          max-width: 540px; width: 100%;
          max-height: 88svh; max-height: 88dvh;
          overflow-y: auto;
          background: linear-gradient(160deg, #0a0118 0%, #120230 50%, #0a0118 100%);
          border: 2px solid rgba(168,85,247,0.7);
          border-radius: 18px;
          padding: 28px 24px 24px;
          text-align: center;
          box-shadow: 0 0 60px rgba(168,85,247,0.4), 0 0 120px rgba(88,28,135,0.2), inset 0 0 60px rgba(0,0,0,0.6);
          position: relative;
          margin: auto 0;
        ">
          <!-- Capítulo -->
          <div style="font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:4px;color:rgba(192,132,252,0.7);text-transform:uppercase;margin-bottom:6px;">Capítulo Final</div>
          <!-- Título -->
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(1.1rem,4vw,1.6rem);font-weight:900;letter-spacing:3px;color:#e9d5ff;text-shadow:0 0 20px rgba(216,180,254,0.9),0 0 40px rgba(168,85,247,0.6);margin:0 0 16px;">
            &#9760; O Confronto Final &#9760;
          </h2>
          <!-- Imagem do Nefromante -->
          <div style="margin:0 0 16px;border-radius:12px;overflow:hidden;border:2px solid rgba(168,85,247,0.6);box-shadow:0 0 30px rgba(168,85,247,0.5),0 0 60px rgba(88,28,135,0.3);">
            <img src="assets/nefromancer.png" alt="Arqui-Nefromante" style="width:100%;display:block;object-fit:cover;max-height:220px;object-position:center 20%;">
          </div>
          <!-- Nome do boss -->
          <div style="font-family:'Cinzel',serif;font-size:1.1rem;font-weight:900;letter-spacing:4px;color:#a855f7;text-shadow:0 0 20px rgba(168,85,247,0.9),0 0 40px rgba(168,85,247,0.5);margin-bottom:14px;">ARQUI-NEFROMANTE</div>
          <!-- Texto de lore -->
          <div style="font-family:'Philosopher',serif;font-size:0.88rem;color:#c4b5fd;line-height:1.75;font-style:italic;margin-bottom:20px;padding:0 4px;">
            Após noventa batalhas, você finalmente chega ao <strong style="color:#e9d5ff;">Trono da Uremia</strong> — o coração sombrio do reino corrompido. Diante de você ergue-se o <strong style="color:#e9d5ff;">Arqui-Nefromante</strong>, senhor da insuficiência renal eterna, cujos feitiços de azotemia e hiperfiltração maligna destruíram milhares de néfrons.
            <br><br>
            Ele sorri com desprezo: <em style="color:#f3e8ff;">"Você chegou longe demais para um simples médico. Mas o conhecimento que carrega não é suficiente para me derrotar."</em>
            <br><br>
            O Batalhão da Resistência une suas forças ao seu lado. <strong style="color:#fbbf24;">Dez questões</strong> separam a vitória da derrota eterna. Cada resposta correta é um golpe que enfraquece o Arqui-Nefromante. Cada erro, uma abertura para sua magia sombria.
            <br><br>
            <strong style="color:#ffd700;">O destino dos rins do reino está em suas mãos.</strong>
          </div>
          <!-- Estatísticas do jogador -->
          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;">
            <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:8px;padding:8px 14px;">
              <div style="font-size:1.2rem;font-weight:700;color:#e9d5ff;">${state.correctTotal}</div>
              <div style="font-size:0.6rem;color:rgba(192,132,252,0.7);text-transform:uppercase;letter-spacing:1px;">Acertos</div>
            </div>
            <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);border-radius:8px;padding:8px 14px;">
              <div style="font-size:1.2rem;font-weight:700;color:#e9d5ff;">${state.level}</div>
              <div style="font-size:0.6rem;color:rgba(192,132,252,0.7);text-transform:uppercase;letter-spacing:1px;">Nível</div>
            </div>
            <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:8px;padding:8px 14px;">
              <div style="font-size:1.2rem;font-weight:700;color:#ffd700;">${state.score.toLocaleString('pt-BR')}</div>
              <div style="font-size:0.6rem;color:rgba(255,215,0,0.6);text-transform:uppercase;letter-spacing:1px;">Pontos</div>
            </div>
          </div>
          <!-- Botão -->
          <button data-remove-id="bossIntroPopup" style="
            font-family:'Cinzel',serif;
            background: linear-gradient(180deg, #7c3aed 0%, #5b21b6 50%, #3b0764 100%);
            border: 2px solid #a855f7;
            border-radius: 12px;
            color: #f3e8ff;
            font-size: 0.95rem;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
            padding: 14px 32px;
            cursor: pointer;
            box-shadow: 0 0 25px rgba(168,85,247,0.6), 0 4px 15px rgba(0,0,0,0.5);
            transition: all 0.2s;
            width: 100%;
            animation: arquiGolpeGlow 2s ease-in-out infinite alternate;
          ">&#9876; Iniciar Batalha Final</button>
        </div>
      `;
      document.body.appendChild(popup);
      // Fechar ao clicar fora
      popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });
      log('💀 O Arqui-Nefromante aguarda no Trono da Uremia. A batalha final começa!');
    }

    function showNarrativePopup(stage){
      const popup = document.createElement('div');
      popup.className='narrative-popup';
      const isFinale = stage.at >= 100;
      const isBoss = stage.boss === true;
      const bossImgHtml = isBoss ? `
        <div style="text-align:center;margin:15px 0;">
          <img src="assets/nefromancer.png" alt="Arqui-Nefromante" style="width:100%;max-width:500px;border-radius:12px;border:3px solid #a855f7;box-shadow:0 0 30px rgba(168,85,247,0.6),0 0 60px rgba(168,85,247,0.3);">
        </div>
        <div style="text-align:center;margin-bottom:10px;">
          <span style="font-size:1.5rem;color:#a855f7;font-weight:900;text-shadow:0 0 20px rgba(168,85,247,0.8);letter-spacing:2px;">ARQUI-NEFROMANTE</span>
        </div>` : '';
      popup.innerHTML=`
        <div class='narrative-card' ${isBoss ? 'style="border-color:#a855f7;box-shadow:0 0 40px rgba(168,85,247,0.4);"' : ''}>
          <div class='narr-chapter' ${isBoss ? 'style="color:#a855f7;"' : ''}>${stage.ch}</div>
          <h3>${isFinale ? '🏆 ' : isBoss ? '💀 ' : '📖 '}${stage.title}</h3>
          ${bossImgHtml}
          <div class='narr-text' ${isBoss ? 'style="color:#e9d5ff;font-style:italic;"' : ''}>${stage.text}</div>
          <div class='narr-progress'>
            <strong>${state.correctTotal}</strong> acertos · Nível <strong>${state.level}</strong> · ${state.queue.length - state.idx} cartas restantes
          </div>
          <button class='btn ${isBoss ? 'sec' : 'gold'}' data-close-closest=".narrative-popup" ${isBoss ? 'style="background:linear-gradient(180deg,#a855f7,#7c3aed);border-color:#6d28d9;color:#fff;text-shadow:0 0 10px rgba(168,85,247,0.5);"' : ''}>${isFinale ? '🏆 Glória Eterna!' : isBoss ? '⚔️ Enfrentar o Arqui-Nefromante!' : 'Continuar a Jornada'}</button>
        </div>
      `;
      document.body.appendChild(popup);
      popup.addEventListener('click',(e)=>{if(e.target===popup) popup.remove();});
      if(isFinale){
        log('🏆 VITÓRIA! Você derrotou o Arqui-Nefromante e salvou os rins do reino!');
      } else if(isBoss){
        playSound('boss');
        log(`💀 ${stage.ch}: ${stage.title}`);
      } else {
        log(`📖 ${stage.ch}: ${stage.title}`);
      }
    }

    let _lastBoardFetch = 0;
    async function renderBoard(forceRefresh = false){
      const now = Date.now();
      if (!forceRefresh && now - _lastBoardFetch < 5000) return;
      _lastBoardFetch = now;
      const loading = document.getElementById('boardLoading');
      const updateEl = document.getElementById('boardLastUpdate');
      if (loading) loading.classList.remove('hidden');
      ui.boardBody.innerHTML = '';
      const data = await boardFetch(forceRefresh);
      if (loading) loading.classList.add('hidden');
      const b = data.slice(0, 20);
      const rankClass = ['r1','r2','r3'];
      const rankLabel = ['🥇','🥈','🥉'];
      const charAvatars = {
        'Dr. Nephros': 'assets/classes/clerigo_renal/nivel_01.jpg',
        'Dra. Aquaria': 'assets/classes/maga_metabolica/nivel_01.jpg',
        'Dr. Glomerulus': 'assets/classes/guerreiro_glomerular/nivel_01.png'
      };
      if (b.length) {
        ui.boardBody.innerHTML = b.map((r, i) => {
          const rc = i < 3 ? rankClass[i] : 'rn';
          const rl = i < 3 ? rankLabel[i] : (i + 1);
          const avatar = charAvatars[r.character_name] || 'assets/classes/clerigo_renal/nivel_01.jpg';
          const dateStr = r.played_at ? new Date(r.played_at).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit'}) : '-';
          const isMe = state.lastSubmittedName && r.player_name === state.lastSubmittedName;
          return `<tr class="rank-${i+1 <= 3 ? i+1 : 'n'}${isMe ? ' rank-me' : ''}">
            <td class="col-rank"><span class="rank-badge ${rc}">${rl}</span></td>
            <td class="col-player"><div class="player-cell"><img class="player-avatar" src="${avatar}" alt="" loading="lazy"><span class="player-name-text">${escapeHtml(r.player_name)||'An\u00f4nimo'}</span></div></td>
            <td class="col-char">${escapeHtml(r.character_name)||'Desconhecido'}</td>
            <td class="col-score score-cell">${(r.score||0).toLocaleString('pt-BR')}</td>
            <td class="col-level level-cell">${r.level||1}</td>
            <td class="col-chests chests-cell">${r.chests_opened||0}</td>
            <td class="col-date date-cell">${dateStr}</td>
          </tr>`;
        }).join('');
      } else {
        ui.boardBody.innerHTML = '<tr><td colspan="7" class="board-empty">Nenhum aventureiro registrou pontuação ainda.<br>Seja o primeiro a entrar para a história!</td></tr>';
      }
      if (updateEl) updateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}`;
    }
    window.renderBoard = renderBoard;

    function resetGame(){
      Object.assign(state,{level:1,xp:0,xpToNext:200,score:0,lives:3,maxLives:3,streak:0,gold:0,difficulty:"normal",legendaryAbilityUsed:{},current:null,answered:false,bonusUses:0,correctTotal:0,narrativeShown:0,gameOver:false,gameStarted:false,extraLifeGiven:false,gameCompleted:false,completedGame:false,chestsOpened:0});
      state.character=null;
      state.equipment={
        weapon:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        armor:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        relic:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0}
      };
      ui.journal.innerHTML='';
      log('📖 Clique em NOVO JOGO para iniciar sua jornada!');
      shuffleQueue();
      renderHUD();
      updateBadges();
      // Não renderizar questão quando jogo não foi iniciado
      if(state.gameStarted) renderQuestion();
      else { ui.question.textContent=''; ui.options.innerHTML=''; ui.feedback.textContent=''; ui.feedback.className='feedback'; ui.refs.innerHTML=''; ui.nextBtn.classList.add('hidden'); }
    }

    ui.nextBtn.addEventListener('click',() => renderQuestion());
    // Event delegation para opções — 1 listener reutilizado em vez de 4 por pergunta
    ui.options.addEventListener('click', (e) => {
      const btn = e.target.closest('button.option');
      if (!btn || btn.dataset.idx === undefined) return;
      answer(parseInt(btn.dataset.idx), btn);
    });
    ui.newBtn.addEventListener('click',()=>{
      showNewGameConfirm();
    });

    function showNewGameConfirm(fromWelcome) {
      document.getElementById('diffSelectorOverlay')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'diffSelectorOverlay';
      overlay.className = 'diff-selector-overlay';
      let selectedDiff = state.difficulty || 'normal';

      function renderDiff() {
        const defs = {
          easy:     { icon:'🌊', name:'Fácil',    lives:5, label:'❤❤❤❤❤', desc:'5 vidas · Questões equilibradas · Ideal para começar', hc: false },
          normal:   { icon:'⚕️', name:'Médio',    lives:4, label:'❤❤❤❤',  desc:'4 vidas · Distribuição mista · Residência médica', hc: false },
          hard:     { icon:'⚔️', name:'Difícil',  lives:3, label:'❤❤❤',   desc:'3 vidas · Questões difíceis priorizadas · Prova de título', hc: false },
          hardcore: { icon:'💀', name:'Hardcore', lives:1, label:'❤',      desc:'1 vida · Somente questões difíceis · Badge exclusivo', hc: true }
        };
        overlay.innerHTML = `
          <div class="diff-selector-card">
            <div class="diff-selector-title">⚔️ Escolha a Dificuldade</div>
            <div class="diff-warning" style="text-align:center;color:#ef4444;font-size:0.72rem;margin-bottom:12px">
              ⚠️ Todo o progresso atual será perdido.
            </div>
            <div class="diff-grid">
              ${Object.entries(defs).map(([k,d]) => `
                <div class="diff-card${d.hc?' hardcore':''}${selectedDiff===k?' selected':''}" data-action="_selectDiffCard" data-pass-this="1" data-diff-key="${k}">
                  <div class="diff-icon">${d.icon}</div>
                  <div class="diff-name">${d.name}</div>
                  <div class="diff-lives">${d.label}</div>
                  <div class="diff-desc">${d.desc}</div>
                  ${d.hc ? '<div class="diff-hardcore-badge">🏆 BADGE EXCLUSIVO</div>' : ''}
                </div>`).join('')}
            </div>
            <button class="diff-confirm-btn" id="diffConfirmBtn" data-action="_confirmDiff" data-arg="${fromWelcome ? 'true' : 'false'}" data-arg-type="boolean">CONFIRMAR DIFICULDADE</button>
            <button class="diff-cancel-btn" data-remove-id="diffSelectorOverlay">CANCELAR</button>
          </div>`;
        window._pendingDiff = selectedDiff;
      }

      overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
      document.body.appendChild(overlay);
      renderDiff();
    }
    // forgeBtn agora usa data-action="showMobileActionConfirm" data-arg="forge" no HTML
    ui.bonusBtn.addEventListener('click',buyBonusQuestion);
    ui.boardBtn.addEventListener('click',()=>{ renderBoard(); ui.boardModal.classList.remove('hidden'); });
    ui.closeBoard.addEventListener('click',()=>ui.boardModal.classList.add('hidden'));
    const boardRefreshBtn = document.getElementById('boardRefresh');
    if (boardRefreshBtn) boardRefreshBtn.addEventListener('click', () => { renderBoard(true); });

    // Sistema de Registro de Nome
    function saveScore() {
      const playerName = document.getElementById('playerName').value.trim() || 'Anônimo';
      state.lastSubmittedName = playerName;
      
      if (pendingScore) {
        boardPush(pendingScore.score, pendingScore.level, playerName);
        pendingScore = null;
      }
      
      document.getElementById('nameModal').classList.remove('show');
      finishGameUI();
    }
    
    function skipSaveScore() {
      if (pendingScore) {
        boardPush(pendingScore.score, pendingScore.level, 'Anônimo');
        pendingScore = null;
      }
      
      document.getElementById('nameModal').classList.remove('show');
      finishGameUI();
    }
    
    function showSessionWrongAnswers() {
      document.querySelectorAll('.session-review-popup').forEach(el => el.remove());
      const wrongs = _sessionWrongAnswers;
      if (!wrongs.length) return;
      const optLetters = ['A','B','C','D'];
      const modal = document.createElement('div');
      modal.className = 'modal show session-review-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.88);display:flex;align-items:flex-start;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:12px 16px calc(env(safe-area-inset-bottom,0px)+80px);box-sizing:border-box;';
      modal.innerHTML = `
        <div style="max-width:560px;width:100%;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(251,113,133,0.3);margin:auto 0;">
          <h2 style="color:#fb7185;font-family:'Cinzel',serif;text-align:center;margin-bottom:6px;">📋 ERROS DA JORNADA</h2>
          <p style="color:var(--txt-dim);text-align:center;font-size:0.8rem;margin-bottom:20px;">${wrongs.length} questão${wrongs.length>1?'es':''} errada${wrongs.length>1?'s':''} nesta sessão</p>
          <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
            ${wrongs.map((q, qi) => {
              const opts = q.o || [];
              return `<div style="background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.25);border-radius:10px;padding:14px;">
                <div style="color:var(--txt-dim);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${qi+1}/${wrongs.length}</div>
                <p style="color:var(--txt);font-size:0.87rem;line-height:1.6;margin-bottom:10px;">${escapeHtml(q.q)}</p>
                <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
                  ${opts.map((o, i) => {
                    const isCorrect = i === q.a;
                    const bg     = isCorrect ? 'rgba(52,211,153,0.15)' : 'transparent';
                    const border  = isCorrect ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)';
                    const color   = isCorrect ? '#34d399' : 'var(--txt-dim)';
                    return `<div style="background:${bg};border:${border};border-radius:6px;padding:6px 10px;font-size:0.8rem;color:${color};">${optLetters[i]}. ${escapeHtml(o)}${isCorrect?' ✓':''}</div>`;
                  }).join('')}
                </div>
                ${q.e ? `<div style="font-size:0.78rem;color:#94a3b8;line-height:1.6;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">${escapeHtml(q.e)}</div>` : ''}
              </div>`;
            }).join('')}
          </div>
          <button class="btn gold" data-close-closest=".modal" style="width:100%;">Fechar</button>
        </div>`;
      document.body.appendChild(modal);
    }

    function finishGameUI() {
      ui.question.textContent=`Fim da jornada! Pontos: ${state.score} • Nível: ${state.level}.`;
      ui.options.innerHTML='';
      const cost=bonusCost();
      if(state.gold>=cost && state.bonusUses < 1){
        ui.feedback.className='feedback';
        ui.feedback.textContent=`Você pode gastar ${cost} ouro para comprar 1 Pergunta Bônus e continuar a jornada com 1 vida.`;
        ui.bonusBtn.textContent=`Pergunta bônus (${cost} ouro)`;
        ui.bonusBtn.classList.remove('hidden');
      } else {
        ui.feedback.className='feedback';
        ui.feedback.textContent=`As ${state.maxLives||3} vidas acabaram. Junte mais ouro em outra corrida para comprar Perguntas Bônus.`;
        ui.bonusBtn.classList.add('hidden');
      }
      // Botão de revisão de erros da sessão
      if (_sessionWrongAnswers.length > 0) {
        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'btn sec';
        reviewBtn.style.cssText = 'margin-top:10px;width:100%;background:rgba(251,113,133,0.12);border-color:rgba(251,113,133,0.35);color:#fb7185;';
        reviewBtn.textContent = `📋 Revisar ${_sessionWrongAnswers.length} erro${_sessionWrongAnswers.length>1?'s':''} da jornada`;
        reviewBtn.onclick = showSessionWrongAnswers;
        ui.options.appendChild(reviewBtn);
      }
      // Botão compartilhar resultado
      const _shareBtn = document.createElement('button');
      _shareBtn.className = 'btn sec';
      _shareBtn.style.cssText = 'margin-top:8px;width:100%;';
      _shareBtn.textContent = '📤 Compartilhar Resultado';
      _shareBtn.onclick = () => _shareResult('campanha', { score: state.score, level: state.level, correct: state.correctTotal, total: state.correctTotal + _sessionWrongAnswers.length, pct: state.correctTotal > 0 ? Math.round((state.correctTotal/(state.correctTotal+_sessionWrongAnswers.length))*100) : 0 });
      ui.options.appendChild(_shareBtn);
      // Botões permanecem ativos após fim de jornada — popup informa o estado
      state.gameOver=true;
      // Esconder barra de status mobile quando jogo termina
      const _msbGO = document.getElementById('mobileStatusBar');
      if(_msbGO) _msbGO.classList.remove('active');
      renderRefs(["kdigo_ckd","kdigo_aki","kdigo_gn","kdigo_tx","dapa","empa"]);
      renderHUD();
      updateBadges(); renderBoard();
    }
    // ============ NARRATIVAS DE INÍCIO POR PERSONAGEM ============
    const CHARACTER_INTROS = {
      nephros:   { ch: 'Dr. Nephros · Guardião dos Néfrons',   text: 'O Reino dos Néfrons está sob ameaça. O Arqui-Nefromante corrompe cada túbulo com ignorância clínica — hipercalemia subestimada, DRC diagnosticada tarde, néfrons perdidos para sempre. Você enxerga o que outros ignoram: cada questão correta é um néfron preservado. A jornada começa agora.' },
      aquaria:   { ch: 'Dra. Aquaria · Mestra das Águas',      text: 'Onde outros veem números, você vê correntes. O Arqui-Nefromante semeia desequilíbrio — hiponatremia que destrói neurônios, acidose que afoga tecidos. Seu domínio é o equilíbrio hidroeletrolítico. Cada resposta certa é uma maré controlada. O reino aguarda sua maestria.' },
      glomerulus:{ ch: 'Dr. Glomerulus · Lâmina dos Glomérulos', text: 'A guerra acontece no nível celular. IgA se deposita, podócitos são apagados, glomérulos perdidos não se regeneram. O Arqui-Nefromante conta com a ignorância dos clínicos. Seu raciocínio é sua arma, as diretrizes são sua armadura. Cada questão correta é um glomérulo preservado.' }
    };

    function selectCharacter(charId) {
      state.character = charId;
      document.getElementById('charSelectModal').classList.remove('show');
      showCharacterIntroModal(charId);
    }

    function showCharacterIntroModal(charId) {
      document.getElementById('charIntroOverlay')?.remove();
      const intro = CHARACTER_INTROS[charId];
      const popup = document.createElement('div');
      popup.className = 'narrative-popup';
      popup.id = 'charIntroOverlay';
      popup.innerHTML = `
        <div class='narrative-card'>
          <div class='narr-chapter'>⚔️ Início da Jornada</div>
          <h3>📖 ${intro.ch}</h3>
          <div class='narr-text'>${intro.text}</div>
          <button class='btn gold' data-action="closeIntroAndStart">⚔️ Iniciar Jornada</button>
        </div>`;
      document.body.appendChild(popup);
      playSound('click');
    }

    function closeIntroAndStart() {
      const overlay = document.getElementById('charIntroOverlay');
      if (overlay) {
        overlay.remove(); startGameWithCharacter();
      } else {
        startGameWithCharacter();
      }
    }
    
    function startGameWithCharacter() {
      if (!isPremium() && getGameStats().questionsAnsweredAllTime >= FREE_QUESTIONS_LIMIT) {
        showPricingModal();
        return;
      }
      const char = characters[state.character];

      _sessionWrongAnswers = [];
      _minigameTriggerCount = 0;
      _boardPushedThisSession = false; // reset rate limit a cada novo jogo
      const _diffLives = {easy:5, normal:4, hard:3, hardcore:1};
      const _chosenDiff = state.difficulty || 'normal';
      const _startLives = _diffLives[_chosenDiff] || 3;
      Object.assign(state,{level:1,xp:0,xpToNext:200,score:0,lives:_startLives,maxLives:_startLives,streak:0,gold:0,difficulty:_chosenDiff,legendaryAbilityUsed:{},current:null,answered:false,bonusUses:0,correctTotal:0,narrativeShown:0,bossIntroShown:false,battleFinalShown:false,gameOver:false,gameStarted:true,extraLifeGiven:false,gameCompleted:false,completedGame:false,chestsOpened:0,bossLog:[]});
      chestCost = 100;
      state.equipment={
        weapon:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        armor:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0},
        relic:{n:"Vazio",rar:"common",atk:0,def:0,kno:0,luck:0}
      };
      ui.journal.innerHTML='';
      const _q9p = document.getElementById('arquiQ9Popup');
      if (_q9p) { _q9p._shown = false; _q9p.style.display = 'none'; }
      log(`🎭 ${char.name}, ${char.title}, inicia sua jornada no Reino Sombrio do Néfron!`);
      shuffleQueue();
      renderHUD();
      updateBadges();
      renderQuestion();
      saveGame();
      // Garantir que a música da jornada está tocando (fallback caso dismissWelcome não tenha iniciado)
      if (musicEnabled && !musicStarted) startBgMusic();
    }

    // ============ MILESTONE DE OURO ============
    const GOLD_MILESTONE = 100;
    let _goldMilestoneShown = false;

    function checkGoldMilestone(prevGold) {
      if (_goldMilestoneShown) return;
      if (prevGold < GOLD_MILESTONE && state.gold >= GOLD_MILESTONE) {
        _goldMilestoneShown = true;
        setTimeout(showGoldMilestonePopup, 600);
      }
    }

    function showGoldMilestonePopup() {
      document.getElementById('goldMilestonePopup')?.remove();
      const popup = document.createElement('div');
      popup.id = 'goldMilestonePopup';
      popup.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);padding:32px 16px;';
      popup.innerHTML = `
        <div style="background:linear-gradient(160deg,#1a2a0a,#0e1830,#2a1a00);border:2px solid #ffd700;border-radius:16px;padding:26px 24px;max-width:420px;width:100%;box-shadow:0 0 50px rgba(255,215,0,0.25);text-align:center;animation:scaleIn 0.35s;">
          <div style="font-size:2.4rem;margin-bottom:8px;">💰</div>
          <h3 style="color:#ffd700;font-family:'Cinzel',serif;font-size:1.05rem;letter-spacing:1px;margin-bottom:6px;">${GOLD_MILESTONE} de Ouro!</h3>
          <p style="color:#c8d8f0;font-size:0.85rem;line-height:1.6;margin-bottom:18px;">
            Você já pode abrir um baú! Ou continue acumulando ouro para forjar itens poderosos:
          </p>
          <div style="display:flex;flex-direction:column;gap:10px;text-align:left;">
            <div style="background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.5);border-radius:10px;padding:12px 14px;">
              <span style="color:#ffd700;font-weight:700;">🪙 Abrir Baú</span>
              <span style="color:#94a3b8;font-size:0.8rem;"> — ${chestCost} ouro</span>
              <p style="color:#cbd5e1;font-size:0.78rem;margin:4px 0 0;">✅ Disponível agora! Obtenha um artigo ou item aleatório.</p>
            </div>
            <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 14px;">
              <span style="color:#a5b4fc;font-weight:700;">⚒️ Forjar Item Comum</span>
              <span style="color:#94a3b8;font-size:0.8rem;"> — 300 ouro</span>
              <p style="color:#cbd5e1;font-size:0.78rem;margin:4px 0 0;">Acumule mais <strong style="color:#a5b4fc;">+${300 - GOLD_MILESTONE} ouro</strong> para forjar um equipamento.</p>
            </div>
            <div style="background:rgba(234,179,8,0.06);border:1px solid rgba(234,179,8,0.2);border-radius:10px;padding:12px 14px;">
              <span style="color:#fbbf24;font-weight:700;">👑 Forjar Item Lendário</span>
              <span style="color:#94a3b8;font-size:0.8rem;"> — 1000 ouro</span>
              <p style="color:#cbd5e1;font-size:0.78rem;margin:4px 0 0;">Acumule mais <strong style="color:#fbbf24;">+${1000 - GOLD_MILESTONE} ouro</strong> para o item mais poderoso.</p>
            </div>
          </div>
          <button data-remove-id="goldMilestonePopup"
            style="margin-top:20px;width:100%;background:linear-gradient(180deg,#b8860b,#7a5a00);border:2px solid #ffd700;color:#fff8dc;border-radius:8px;padding:11px;font-family:'Cinzel',serif;font-size:0.82rem;font-weight:700;letter-spacing:1px;cursor:pointer;text-transform:uppercase;">
            Entendido!
          </button>
        </div>`;
      document.body.appendChild(popup);
      popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
      playSound('chest');
    }

    // Sistema de Baús
    let chestCost = 100;
    const CHEST_MIN_CORRECT = 3;
    
    function openChest() {
      if(state.gameOver){ log('🚫 Jornada encerrada. Inicie um novo jogo!'); return; }
      if (state.correctTotal < CHEST_MIN_CORRECT) {
        log(`📚 Você precisa de pelo menos ${CHEST_MIN_CORRECT} acertos para abrir um baú! (Atual: ${state.correctTotal})`);
        return;
      }
      if (state.gold < chestCost) {
        log('💰 Ouro insuficiente! Você precisa de ' + chestCost + ' ouro.');
        return;
      }
      
      const availableArticles = nefroArticles.filter((_, idx) => !unlockedArticles.includes(idx));
      
      if (availableArticles.length === 0) {
        log('🎉 Você já desbloqueou todos os artigos!');
        return;
      }
      
      state.gold -= chestCost;
      const randomArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
      const articleIndex = nefroArticles.indexOf(randomArticle);
      
      unlockedArticles.push(articleIndex);
      localStorage.setItem('unlockedArticles', JSON.stringify(unlockedArticles));
      
      // Conhecimento progressivo: baú N dá +N conhecimento
      state.chestsOpened++;
      const knoGain = state.chestsOpened;
      if(state.equipment.relic) state.equipment.relic.kno = (state.equipment.relic.kno || 0) + knoGain;
      
      // Pontos por abrir baú (sem XP para não bagunçar progressão)
      const chestPoints = 30 + state.chestsOpened * 10;
      state.score += chestPoints;
      
      showChestModal(randomArticle, knoGain, chestPoints);
      playSound('chest');
      log(`📚 Baús abertos: ${state.chestsOpened} — +${knoGain} Conhecimento, +${chestPoints} pontos!`);
      chestCost = Math.min(chestCost + 15, 250);
      
      log('📦 Artigo desbloqueado: ' + randomArticle.titulo);
      renderHUD();
      updateBadges();
      saveGame();
    }
    
    function showChestModal(article, knoGain, chestPoints) {
      knoGain = knoGain || 1;
      chestPoints = chestPoints || 0;
      const modal = document.getElementById('chestModal');
      const articleDiv = document.getElementById('chestArticle');
      
      articleDiv.innerHTML = `
        <div style="text-align:center;margin-bottom:12px;padding:10px;background:rgba(0,255,100,0.1);border:1px solid rgba(0,255,100,0.3);border-radius:8px;">
          <span style="font-size:1.3rem;">📚</span>
          <span style="color:#4ade80;font-weight:bold;font-size:1.1rem;"> +${knoGain} Conhecimento!</span>
          <span style="color:var(--blue);font-weight:bold;font-size:1.1rem;"> +${chestPoints} Pontos!</span>
          <span style="color:var(--txt-dim);font-size:0.85rem;"> (Baús abertos: ${state.chestsOpened})</span>
        </div>
        <div class="article-card">
          <h3>📜 ${escapeHtml(article.titulo)} (${escapeHtml(String(article.ano))})</h3>
          <p style="font-size:0.78rem;color:var(--gold);margin-bottom:4px">✍️ <em>${escapeHtml(article.autores)}</em></p>
          <p style="font-size:0.72rem;color:var(--txt-dim);margin-bottom:10px">📖 ${escapeHtml(article.jornal)}</p>
          <p><span class="label">📚 Resumo:</span><br>${escapeHtml(article.resumo)}</p>
          <p><span class="label">🎯 Conclusão Principal:</span><br>${escapeHtml(article.conclusao)}</p>
          <p><span class="label">💡 Curiosidade:</span><br>${escapeHtml(article.curiosidade)}</p>
          <p><span class="label">⭐ Impacto na Nefrologia:</span><br>${escapeHtml(article.impacto)}</p>
        </div>
      `;
      
      modal.classList.add('show');
    }
    
    function closeChestModal() {
      document.getElementById('chestModal').classList.remove('show');
    }
    

    // ============ SISTEMA DE ESTATÍSTICAS E DESEMPENHO ============
    const STATS_STORAGE_KEY = 'nefroquest-detailed-stats';
    const DETAILED_STATS_SCHEMA_VERSION = 1;

    function _defaultDetailedStats() {
      return {
        schemaVersion: DETAILED_STATS_SCHEMA_VERSION,
        totalQuestions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        byTopic: {},
        byCategory: {},
        questionHistory: [],
        timeStats: { totalTime: 0, questionCount: 0 },
        mostMissed: {}
      };
    }

    function _migrateDetailedStats(s) {
      const v = s.schemaVersion || 0;
      // v0 → v1: adicionar schemaVersion
      if (v < 1) {
        s.schemaVersion = 1;
      }
      // v1 → v2: futuras migrações aqui
      return s;
    }

    function getDetailedStats() {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) return _defaultDetailedStats();
      try {
        const parsed = JSON.parse(raw);
        return _migrateDetailedStats(parsed);
      } catch(e) {
        return _defaultDetailedStats();
      }
    }

    function saveDetailedStats(stats) {
      if (!stats.schemaVersion) stats.schemaVersion = DETAILED_STATS_SCHEMA_VERSION;
      try { localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats)); } catch(e) {}
    }
    
    function trackQuestionAnswer(question, isCorrect, timeSpent) {
      const stats = getDetailedStats() || {};
      if (!stats.byTopic)    stats.byTopic    = {};
      if (!stats.byCategory) stats.byCategory = {};
      if (!stats.mostMissed) stats.mostMissed = {};
      if (!stats.questionHistory) stats.questionHistory = [];
      if (!stats.timeStats)  stats.timeStats  = { totalTime: 0, questionCount: 0 };
      if (!stats.totalQuestions) stats.totalQuestions = 0;
      if (!stats.totalCorrect)   stats.totalCorrect   = 0;
      if (!stats.totalWrong)     stats.totalWrong     = 0;
      const topic = question.t || 'Geral';
      const cat = question.c || question.cat || 'geral';
      
      // Atualizar totais
      stats.totalQuestions++;
      if (isCorrect) {
        stats.totalCorrect++;
      } else {
        stats.totalWrong++;
      }
      
      // Atualizar por tema
      if (!stats.byTopic[topic]) {
        stats.byTopic[topic] = { correct: 0, wrong: 0, total: 0 };
      }
      stats.byTopic[topic].total++;
      if (isCorrect) stats.byTopic[topic].correct++;
      else stats.byTopic[topic].wrong++;

      // Atualizar por categoria
      if (!stats.byCategory[cat]) {
        stats.byCategory[cat] = { correct: 0, wrong: 0, total: 0 };
      }
      stats.byCategory[cat].total++;
      if (isCorrect) stats.byCategory[cat].correct++;
      else stats.byCategory[cat].wrong++;
      
      // Atualizar questões mais erradas
      if (!isCorrect) {
        const qKey = question.q.substring(0, 50);
        if (!stats.mostMissed[qKey]) {
          stats.mostMissed[qKey] = { question: question.q, topic: topic, count: 0 };
        }
        stats.mostMissed[qKey].count++;
      }
      
      // Atualizar tempo
      if (timeSpent > 0) {
        stats.timeStats.totalTime += timeSpent;
        stats.timeStats.questionCount++;
      }
      
      // Histórico (últimas 100)
      stats.questionHistory.unshift({
        topic: topic,
        correct: isCorrect,
        time: timeSpent,
        date: new Date().toISOString()
      });
      if (stats.questionHistory.length > 100) {
        stats.questionHistory = stats.questionHistory.slice(0, 100);
      }
      
      saveDetailedStats(stats);
    }
    
    // Eixos da nefrologia — um eixo por categoria do banco (17 no total)
    const NEFRO_AXES = [
      { id: 'drc',                  icon: '🪴', label: 'DRC & KDIGO',              cat: 'drc' },
      { id: 'lra',                  icon: '⚠️', label: 'LRA & Nefrotoxicidade',    cat: 'lra' },
      { id: 'glomerular',           icon: '🔬', label: 'Glomerulopatias',           cat: 'glomerular' },
      { id: 'eletrólitos',          icon: '⚡', label: 'Distúrbios Eletrolíticos',  cat: 'eletrólitos' },
      { id: 'acido_base',           icon: '🧪', label: 'Ácido-Base',               cat: 'acido_base' },
      { id: 'dialise',              icon: '💉', label: 'Diálise & DP',              cat: 'dialise' },
      { id: 'transplante',          icon: '🫀', label: 'Transplante Renal',         cat: 'transplante' },
      { id: 'hipertensao',          icon: '❤️', label: 'Hipertensão',               cat: 'hipertensao' },
      { id: 'nefropatia_diabetica', icon: '🩸', label: 'Nefropatia Diabética',      cat: 'nefropatia_diabetica' },
      { id: 'infeccao',             icon: '🦠', label: 'Infecção Renal',            cat: 'infeccao' },
      { id: 'litíase',              icon: '💎', label: 'Litíase Renal',             cat: 'litíase' },
      { id: 'farmacologia',         icon: '💊', label: 'Farmacologia',              cat: 'farmacologia' },
      { id: 'genetica',             icon: '🧬', label: 'Genética Renal',            cat: 'genetica' },
      { id: 'uti',                  icon: '🏥', label: 'UTI / Crítico',             cat: 'uti' },
      { id: 'diagnostico',          icon: '🔭', label: 'Diagnóstico',               cat: 'diagnostico' },
      { id: 'oncologia_renal',      icon: '🎗️', label: 'Oncologia Renal',           cat: 'oncologia_renal' },
      { id: 'nefrologia_geral',     icon: '📚', label: 'Nefrologia Geral',          cat: 'nefrologia_geral' },
    ];

    function drawRadarChart(canvas, axes) {
      if (!canvas || !axes.length) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const r = Math.min(cx, cy) - 36;
      const n = axes.length;
      ctx.clearRect(0, 0, W, H);
      // Rings at 25%, 50%, 75%, 100%
      [0.25, 0.5, 0.75, 1].forEach(pct => {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * pct * Math.cos(a), y = cy + r * pct * Math.sin(a);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = pct === 1 ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      // Spokes
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        ctx.strokeStyle = 'rgba(96,165,250,0.15)';
        ctx.stroke();
      }
      // Data polygon
      ctx.beginPath();
      axes.forEach((ax, i) => {
        const pct = ax.total > 0 ? ax.correct / ax.total : 0;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * pct * Math.cos(a), y = cy + r * pct * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(168,85,247,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(168,85,247,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Dots + labels
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      axes.forEach((ax, i) => {
        const pct = ax.total > 0 ? ax.correct / ax.total : 0;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const dx = cx + r * pct * Math.cos(a), dy = cy + r * pct * Math.sin(a);
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        const lx = cx + (r + 22) * Math.cos(a), ly = cy + (r + 22) * Math.sin(a);
        ctx.fillText(ax.icon, lx, ly);
      });
    }

    function getAxisStats(stats) {
      return NEFRO_AXES.map(axis => {
        const d = (stats.byCategory || {})[axis.cat] || { correct: 0, wrong: 0, total: 0 };
        const { correct, wrong, total } = d;
        const accuracy = total > 0 ? ((correct / total) * 100) : null;
        return { ...axis, correct, wrong, total, accuracy };
      }).filter(a => a.total > 0)
        .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100)); // piores primeiro
    }

    // ── Notificações de estudo ──────────────────────────────────────────────
    async function enableStudyReminders() {
      if (!('Notification' in window)) {
        alert('Seu navegador não suporta notificações.'); return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Permissão negada. Ative nas configurações do navegador.'); return;
      }
      localStorage.setItem('nq_notif_enabled', '1');
      // Tentar registrar periodic sync
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
          await reg.periodicSync.register('nq-study-reminder', { minInterval: 20 * 60 * 60 * 1000 }).catch(() => {});
        }
      }
      alert('✅ Lembretes de estudo ativados!');
    }
    function disableStudyReminders() {
      localStorage.removeItem('nq_notif_enabled');
      alert('Lembretes desativados.');
    }
    function toggleStudyReminders() {
      if (localStorage.getItem('nq_notif_enabled')) {
        disableStudyReminders();
      } else {
        enableStudyReminders();
      }
    }
    function _checkStudyReminder() {
      if (Notification.permission !== 'granted') return;
      if (!localStorage.getItem('nq_notif_enabled')) return;
      const lastStudy = parseInt(localStorage.getItem('nq_last_study') || '0');
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      if (lastStudy < yesterday) {
        const banner = document.createElement('div');
        banner.id = 'studyReminderBanner';
        banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(139,92,246,0.95);color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:0.85rem;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.4);max-width:320px;width:90%;';
        banner.innerHTML = '📚 Você não estudou hoje ainda!<br><button onclick="this.parentElement.remove();showTopicSelector();" style="margin-top:8px;background:#fff;color:#7c3aed;border:none;padding:6px 16px;border-radius:8px;font-weight:bold;cursor:pointer;">Estudar agora</button> <button onclick="this.parentElement.remove();" style="margin-top:8px;background:transparent;color:#e9d5ff;border:1px solid rgba(255,255,255,0.3);padding:6px 12px;border-radius:8px;cursor:pointer;">Depois</button>';
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 15000);
      }
    }

    function showStatsModal() {
      document.querySelectorAll('.stats-popup').forEach(el => el.remove());

      const stats = getDetailedStats();
      const avgTime = stats.timeStats.questionCount > 0 
        ? Math.round(stats.timeStats.totalTime / stats.timeStats.questionCount) 
        : 0;
      const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
        : 0;

      const axisStats = getAxisStats(stats);

      // Todos os tópicos praticados, ordenados por pior desempenho
      const allTopicData = Object.entries(stats.byTopic)
        .map(([topic, data]) => ({
          topic,
          accuracy: data.total > 0 ? ((data.correct / data.total) * 100) : null,
          total: data.total,
          correct: data.correct,
          wrong: data.wrong
        }))
        .filter(t => t.total > 0)
        .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));
      
      const modal = document.createElement('div');
      modal.className = 'modal show stats-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:32px 16px calc(env(safe-area-inset-bottom,0px)+16px);box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;max-height:88vh;overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(59,130,246,0.3);">
          <h2 style="color:var(--gold);margin-bottom:16px;font-family:'Cinzel',serif;">📊 ESTATÍSTICAS</h2>
          
          <!-- Resumo geral -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#34d399;font-weight:bold;">${stats.totalQuestions}</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Questões</div>
            </div>
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#34d399;font-weight:bold;">${accuracy}%</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Acerto</div>
            </div>
            <div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:var(--blue);font-weight:bold;">${avgTime}s</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">T. Médio</div>
            </div>
            <div style="background:rgba(251,113,133,0.12);border:1px solid rgba(251,113,133,0.35);border-radius:10px;padding:12px 6px;">
              <div style="font-size:1.5rem;color:#fb7185;font-weight:bold;">${stats.totalWrong}</div>
              <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Erros</div>
            </div>
          </div>

          <!-- Radar Chart -->
          ${axisStats.length >= 3 ? `
          <div style="text-align:center;margin-bottom:16px;">
            <h3 style="color:var(--gold);margin-bottom:10px;font-size:0.9rem;font-family:'Cinzel',serif;letter-spacing:1px;">RADAR DE DESEMPENHO</h3>
            <canvas id="nqRadarChart" width="280" height="280" style="max-width:100%;"></canvas>
          </div>` : ''}
          <!-- Desempenho por Eixo -->
          <div style="text-align:left;margin-bottom:16px;">
            <h3 style="color:var(--gold);margin-bottom:10px;font-size:0.9rem;font-family:'Cinzel',serif;letter-spacing:1px;">DESEMPENHO POR EIXO</h3>
            ${axisStats.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${axisStats.map(a => {
                const pct = a.accuracy !== null ? a.accuracy.toFixed(0) : 0;
                const color = a.accuracy >= 70 ? '#34d399' : a.accuracy >= 50 ? '#fbbf24' : '#fb7185';
                const bgColor = a.accuracy >= 70 ? 'rgba(52,211,153,0.08)' : a.accuracy >= 50 ? 'rgba(251,191,36,0.08)' : 'rgba(251,113,133,0.08)';
                const borderColor = a.accuracy >= 70 ? 'rgba(52,211,153,0.3)' : a.accuracy >= 50 ? 'rgba(251,191,36,0.3)' : 'rgba(251,113,133,0.3)';
                return `
                  <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:10px 12px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:1.1rem;">${a.icon}</span>
                        <span style="color:var(--txt);font-size:0.85rem;font-weight:600;">${a.label}</span>
                      </div>
                      <div style="text-align:right;">
                        <span style="color:${color};font-weight:bold;font-size:0.95rem;">${pct}%</span>
                        <span style="color:var(--txt-dim);font-size:0.7rem;margin-left:6px;">${a.correct}/${a.total}</span>
                      </div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);height:5px;border-radius:3px;overflow:hidden;">
                      <div style="background:${color};height:100%;width:${pct}%;transition:width 0.5s;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            ` : '<p style="color:var(--txt-dim);text-align:center;padding:16px;font-size:0.85rem;">Jogue para ver seu desempenho por eixo!</p>'}
          </div>

          <!-- Tópicos com pior desempenho -->
          ${allTopicData.length > 0 ? `
          <div style="text-align:left;margin-bottom:16px;">
            <h3 style="color:var(--gold);margin-bottom:10px;font-size:0.9rem;font-family:'Cinzel',serif;letter-spacing:1px;">TÓPICOS A REFORÇAR</h3>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;">
              ${allTopicData.slice(0, 6).map(t => {
                const pct = t.accuracy !== null ? t.accuracy.toFixed(0) : 0;
                const color = t.accuracy >= 70 ? '#34d399' : t.accuracy >= 50 ? '#fbbf24' : '#fb7185';
                return `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:rgba(255,255,255,0.04);border-radius:6px;">
                    <span style="color:var(--txt);font-size:0.78rem;flex:1;">${escapeHtml(t.topic)}</span>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <div style="width:60px;background:rgba(0,0,0,0.4);height:4px;border-radius:2px;overflow:hidden;">
                        <div style="background:${color};height:100%;width:${pct}%;"></div>
                      </div>
                      <span style="color:${color};font-weight:bold;font-size:0.78rem;min-width:32px;text-align:right;">${pct}%</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}
          

          ${(() => {
            const hist = (stats.questionHistory || []).slice().reverse();
            if (hist.length < 3) return '';
            const days = {};
            hist.forEach(h => {
              const d = (h.date || '').slice(0,10);
              if (!d) return;
              if (!days[d]) days[d] = {correct:0,total:0};
              days[d].total++;
              if (h.correct) days[d].correct++;
            });
            const sorted = Object.keys(days).sort().slice(-7);
            if (sorted.length < 2) return '';
            const pts = sorted.map(d => ({ d, pct: Math.round(days[d].correct/days[d].total*100) }));
            const max = 100, h2 = 55, w = 400/(pts.length-1);
            const polyline = pts.map((p,i) => `${(i*w).toFixed(1)},${(h2 - p.pct/max*h2).toFixed(1)}`).join(' ');
            const dots = pts.map((p,i) => `<circle cx="${(i*w).toFixed(1)}" cy="${(h2 - p.pct/max*h2).toFixed(1)}" r="5" fill="${p.pct>=70?'#34d399':p.pct>=50?'#fbbf24':'#fb7185'}" />`).join('');
            const labels = pts.map((p,i) => `<text x="${(i*w).toFixed(1)}" y="${h2+16}" text-anchor="middle" fill="#64748b" font-size="11">${p.d.slice(5)}</text><text x="${(i*w).toFixed(1)}" y="${(h2 - p.pct/max*h2 - 8).toFixed(1)}" text-anchor="middle" fill="${p.pct>=70?'#34d399':p.pct>=50?'#fbbf24':'#fb7185'}" font-size="11" font-weight="bold">${p.pct}%</text>`).join('');
            return '<div style="text-align:left;margin-bottom:16px;">'
              + '<h3 style="color:var(--gold);margin-bottom:8px;font-size:0.9rem;font-family:\'Cinzel\',serif;letter-spacing:1px;">EVOLUÇÃO (ÚLTIMOS 7 DIAS)</h3>'
              + '<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;">'
              + '<svg viewBox="-8 -14 416 90" style="width:100%;display:block;">'
              + '<polyline points="' + polyline + '" fill="none" stroke="#6366f1" stroke-width="3" stroke-linejoin="round"/>'
              + dots + labels
              + '</svg>'
              + '</div>'
              + '</div>';
          })()}
          <button class="btn sec" data-action="confirmResetProgress"  style="margin-right:8px;background:rgba(251,113,133,0.15);border-color:rgba(251,113,133,0.4);color:#fb7185;font-size:0.78rem;">🗑️ Resetar Progresso</button>
          <button class="btn gold" data-close-closest=".modal">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);
      const radarCanvas = document.getElementById('nqRadarChart');
      if (radarCanvas && axisStats.length >= 3) {
        drawRadarChart(radarCanvas, axisStats);
        // Tooltip ao passar o mouse nos ícones do radar
        const _rTip = document.createElement('div');
        _rTip.style.cssText = 'position:fixed;pointer-events:none;background:#0e1830;border:1px solid rgba(139,92,246,0.5);color:#d5e2ff;padding:4px 10px;border-radius:7px;font-size:0.78rem;white-space:nowrap;z-index:99999;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.6);';
        document.body.appendChild(_rTip);
        const _rN = axisStats.length;
        const _rW = radarCanvas.width, _rH = radarCanvas.height;
        const _rCx = _rW / 2, _rCy = _rH / 2;
        const _rR = Math.min(_rCx, _rCy) - 36;
        const _rPts = axisStats.map((ax, i) => {
          const a = (i / _rN) * Math.PI * 2 - Math.PI / 2;
          return { x: _rCx + (_rR + 22) * Math.cos(a), y: _rCy + (_rR + 22) * Math.sin(a), label: ax.label, accuracy: ax.accuracy };
        });
        radarCanvas.addEventListener('mousemove', e => {
          const rect = radarCanvas.getBoundingClientRect();
          const scaleX = radarCanvas.width / rect.width;
          const scaleY = radarCanvas.height / rect.height;
          const mx = (e.clientX - rect.left) * scaleX;
          const my = (e.clientY - rect.top) * scaleY;
          const found = _rPts.find(pt => Math.hypot(mx - pt.x, my - pt.y) < 24);
          if (found) {
            const pct = found.accuracy != null ? found.accuracy.toFixed(0) + '%' : '—';
            _rTip.textContent = `${found.label} — ${pct} acerto`;
            _rTip.style.display = 'block';
            _rTip.style.left = (e.clientX + 14) + 'px';
            _rTip.style.top = (e.clientY - 12) + 'px';
          } else {
            _rTip.style.display = 'none';
          }
        });
        radarCanvas.addEventListener('mouseleave', () => { _rTip.style.display = 'none'; });
        // Limpa o tooltip quando o modal for removido do DOM
        const _rObs = new MutationObserver(() => {
          if (!document.contains(radarCanvas)) { _rTip.remove(); _rObs.disconnect(); }
        });
        _rObs.observe(document.body, { childList: true, subtree: false });
      }
      playSound('click');
    }

    function confirmResetProgress() {
      if (!confirm('⚠️ Apagar todo o histórico de estatísticas, questões dominadas e save atual?\n\nEsta ação não pode ser desfeita.')) return;
      localStorage.removeItem(STATS_STORAGE_KEY);
      localStorage.removeItem(MASTERED_KEY);
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(ACHIEVEMENTS_KEY);
      localStorage.removeItem(STUDY_SAVE_KEY);
      localStorage.removeItem(EXAM_SAVE_KEY);
      localStorage.removeItem('unlockedArticles');
      localStorage.removeItem('nefroquest-arqui-defeated');
      localStorage.removeItem('nefroquest-minigame-notified');
      localStorage.removeItem(SR_KEY);
      unlockedArticles = [];
      _masteredSet = new Set();
      chestCost = 100;
      _invalidateStatsCache();
      document.querySelectorAll('.stats-popup').forEach(el => el.remove());
      alert('✅ Progresso resetado. Começando do zero!');
    }

    // ============ MODO DE ESTUDO POR TEMA ============
    let selectedTopic = 'all';
    let studyMode = 'all'; // 'all', 'topic', 'review'
    
    function extractTopics() {
      const topicsSet = new Set();
      topics.forEach(q => {
        if (q.t) topicsSet.add(q.t);
      });
      return Array.from(topicsSet).sort();
    }
    
    // Eixos selecionados no Modo de Estudo
    let _studySelectedAxes = new Set();

    function showTopicSelector() {
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());
      _studySelectedAxes = new Set(NEFRO_AXES.map(a => a.id)); // todos selecionados por padrão

      const stats = getDetailedStats();

      const modal = document.createElement('div');
      modal.className = 'modal show study-mode-popup';
      const _isMobile = window.innerWidth <= 768;
modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:' + (_isMobile ? 'flex-start' : 'center') + ';justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:' + (_isMobile ? '12px 12px calc(env(safe-area-inset-bottom,0px)+80px)' : '32px 16px') + ';box-sizing:border-box;';

      function renderAxesHTML() {
        return NEFRO_AXES.map(axis => {
          const sel = _studySelectedAxes.has(axis.id);
          const axisData = getAxisStats(stats).find(a => a.id === axis.id);
          const qCount = topics.filter(q => q.cat === axis.cat).length;
          const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
          const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
          return `
            <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
              style="cursor:pointer;padding:8px 10px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.4rem;">${axis.icon}</span>
              <div style="flex:1;text-align:left;">
                <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
                <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
              </div>
              <div style="text-align:right;">
                <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
                <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
              </div>
              <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      modal.innerHTML = `
        <div class="modal-content" style="max-width:460px;width:100%;max-height:calc(100vh - 48px);overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:18px 20px;box-shadow:0 0 40px rgba(139,92,246,0.3);">
          <h2 style="color:var(--gold);margin-bottom:6px;font-family:'Cinzel',serif;">📖 MODO DE ESTUDO</h2>
          <p style="color:var(--txt-dim);font-size:0.82rem;margin-bottom:18px;">Selecione os eixos que deseja praticar</p>

          <div style="margin-bottom:12px;">
            <p style="color:var(--txt-dim);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Trilhas rápidas</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
              <button class="btn sec" data-action="_selectTrail" data-arg="residencia" style="font-size:0.74rem;padding:5px 10px;">🏥 Residência</button>
              <button class="btn sec" data-action="_selectTrail" data-arg="titulo" style="font-size:0.74rem;padding:5px 10px;">📋 Prova de Título</button>
              <button class="btn sec" data-action="_selectTrail" data-arg="eletrolitos" style="font-size:0.74rem;padding:5px 10px;">⚡ Eletrólitos & AB</button>
            </div>
          </div>

          <div id="axisCardList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:14px;">
            ${renderAxesHTML()}
          </div>

          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px;">
            <button class="btn sec" data-action="_studySelectAll" data-arg="true" data-arg-type="boolean" style="font-size:0.78rem;padding:7px 14px;">✓ Todos</button>
            <button class="btn sec" data-action="_studySelectAll" data-arg="false" data-arg-type="boolean" style="font-size:0.78rem;padding:7px 14px;">✗ Nenhum</button>
          </div>

          <div id="srDueCount" style="text-align:center;margin-bottom:10px;color:var(--txt-dim);font-size:0.8rem;"></div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button class="btn sec" data-close-closest=".modal">Cancelar</button>
            <button class="btn" style="background:rgba(139,92,246,0.15);border-color:#8b5cf6;color:#c4b5fd;" data-action="startSRStudyMode" title="Mostra apenas as questões com revisão vencida hoje. Erros voltam em 1 dia; acertos espaçam progressivamente (2 → 5 → 10 dias...). Ideal para manter o que você já aprendeu.">📅 Revisão Espaçada</button>
            <button class="btn gold" data-action="startStudyMode" title="Apresenta todas as questões dos eixos selecionados em ordem aleatória, sem prioridade por histórico. Ideal para explorar um tema novo.">📚 Estudo Livre</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      // Update SR due count after render (needs _studySelectedAxes to be set)
      const srEl = document.getElementById('srDueCount');
      if (srEl) {
        const due = getSRDueCount();
        srEl.textContent = due > 0 ? `📅 ${due} questão(ões) para revisar hoje` : '✓ Sem revisões pendentes hoje';
      }
      playSound('click');
    }

    function _studyToggleAxis(id) {
      if (_studySelectedAxes.has(id)) _studySelectedAxes.delete(id);
      else _studySelectedAxes.add(id);
      // Re-render cards
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      list.innerHTML = NEFRO_AXES.map(axis => {
        const sel = _studySelectedAxes.has(axis.id);
        const axisData = getAxisStats(stats).find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.4rem;">${axis.icon}</span>
            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    function _studySelectAll(sel) {
      if (sel) NEFRO_AXES.forEach(a => _studySelectedAxes.add(a.id));
      else _studySelectedAxes.clear();
      // Re-render todos os cards
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      list.innerHTML = NEFRO_AXES.map(axis => {
        const selected = _studySelectedAxes.has(axis.id);
        const axisData = getAxisStats(stats).find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${selected ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.4rem;">${axis.icon}</span>
            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${selected ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${selected ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${selected ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    const _TRAILS = {
      residencia:  ['lra', 'eletrólitos', 'hipertensao', 'infeccao', 'glomerular', 'acido_base'],
      titulo:      ['glomerular', 'transplante', 'dialise', 'genetica', 'drc', 'acido_base', 'nefropatia_diabetica', 'farmacologia'],
      eletrolitos: ['eletrólitos', 'acido_base'],
    };

    function _selectTrail(trailId) {
      const ids = _TRAILS[trailId];
      if (!ids) return;
      _studySelectedAxes.clear();
      ids.forEach(id => _studySelectedAxes.add(id));
      const list = document.getElementById('axisCardList');
      if (!list) return;
      const stats = getDetailedStats();
      list.innerHTML = NEFRO_AXES.map(axis => {
        const sel = _studySelectedAxes.has(axis.id);
        const axisData = getAxisStats(stats).find(a => a.id === axis.id);
        const qCount = topics.filter(q => q.cat === axis.cat).length;
        const pct = axisData ? axisData.accuracy.toFixed(0) + '%' : '—';
        const color = axisData ? (axisData.accuracy >= 70 ? '#34d399' : axisData.accuracy >= 50 ? '#fbbf24' : '#fb7185') : 'var(--txt-dim)';
        return `
          <div data-action="_studyToggleAxis" data-arg="${axis.id}" id="axis-card-${axis.id}"
            style="cursor:pointer;padding:12px 14px;border-radius:10px;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.1)'};background:${sel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.4rem;">${axis.icon}</span>
            <div style="flex:1;text-align:left;">
              <div style="color:var(--txt);font-weight:600;font-size:0.9rem;">${axis.label}</div>
              <div style="color:var(--txt-dim);font-size:0.7rem;margin-top:2px;">${qCount} questões</div>
            </div>
            <div style="text-align:right;">
              <div style="color:${color};font-weight:bold;font-size:0.85rem;">${pct}</div>
              <div style="color:var(--txt-dim);font-size:0.65rem;">acerto</div>
            </div>
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${sel ? '#8b5cf6' : 'rgba(255,255,255,0.3)'};background:${sel ? '#8b5cf6' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${sel ? '<span style="color:#fff;font-size:0.7rem;">&#10003;</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    // Estado do modo de estudo
    const STUDY_SAVE_KEY = 'nefroquest-study-state';
    const STUDY_TTL_MS   = 24 * 60 * 60 * 1000; // 24h

    function _saveStudyState() {
      if (!studyModeActive || !studyModeQuestions.length) return;
      try {
        localStorage.setItem(STUDY_SAVE_KEY, JSON.stringify({
          questions: studyModeQuestions.map(q => q.qid || q.id || q.q.substring(0, 40)),
          index: studyModeIndex,
          correct: studyModeCorrect,
          wrong: studyModeWrong,
          savedAt: Date.now()
        }));
      } catch(e) {}
    }

    function _loadStudyState() {
      try {
        const raw = localStorage.getItem(STUDY_SAVE_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s?.questions?.length) return null;
        if (Date.now() - s.savedAt > STUDY_TTL_MS) { localStorage.removeItem(STUDY_SAVE_KEY); return null; }
        return s;
      } catch(e) { return null; }
    }

    function _clearStudyState() {
      try { localStorage.removeItem(STUDY_SAVE_KEY); } catch(e) {}
    }

    let studyModeActive = false;
    let studyModeQuestions = [];
    let studyModeIndex = 0;
    let studyModeCorrect = 0;
    let studyModeWrong = 0;
    
    function startStudyMode() {
      if (_studySelectedAxes.size === 0) {
        alert('Selecione pelo menos um eixo para estudar!');
        return;
      }

      // Verificar sessão salva
      const saved = _loadStudyState();
      if (saved) {
        // Reconstituir questions a partir dos qids salvos
        const savedIds = new Set(saved.questions);
        const restored = topics.filter(q => savedIds.has(q.qid || q.id || q.q.substring(0, 40)));
        if (restored.length > 0 && confirm(`Você tem uma sessão de estudo em andamento (${saved.index}/${saved.questions.length} questões). Continuar?`)) {
          studyModeQuestions = restored;
          studyModeIndex = Math.min(saved.index, restored.length - 1);
          studyModeCorrect = saved.correct || 0;
          studyModeWrong = saved.wrong || 0;
          studyModeActive = true;
          showStudyModePage();
          return;
        } else {
          _clearStudyState();
        }
      }

      // Coletar categorias dos eixos selecionados
      const selectedCats = new Set();
      NEFRO_AXES.forEach(axis => {
        if (_studySelectedAxes.has(axis.id)) selectedCats.add(axis.cat);
      });

      // Filtrar questões pelas categorias selecionadas
      studyModeQuestions = topics.filter(q => selectedCats.has(q.cat));
      
      if (studyModeQuestions.length === 0) {
        alert('Nenhuma questão encontrada para os temas selecionados.');
        return;
      }
      
      // Embaralhar questões
      studyModeQuestions = shuffle(studyModeQuestions);
      studyModeIndex = 0;
      studyModeCorrect = 0;
      studyModeWrong = 0;
      studyModeActive = true;
      
      // Fechar popup de seleção
      document.querySelectorAll('.study-mode-popup').forEach(el => el.remove());

      // Abrir página de estudo (sem música — modo de estudo é silencioso)
      showStudyModePage();
    }
    
    function showStudyModePage() {
      // Esconder o jogo principal
      document.querySelector('.app').classList.add('hidden');
      document.querySelector('.welcome-screen')?.classList.add('hidden');
      
      // Remover página anterior se existir
      document.getElementById('studyModePage')?.remove();
      
      const page = document.createElement('div');
      page.id = 'studyModePage';
      page.style.cssText = 'position:fixed;inset:0;z-index:1000;background:linear-gradient(180deg,#0a1020 0%,#060d18 100%);overflow-y:auto;';
      page.innerHTML = `
        <div style="max-width:900px;margin:0 auto;padding:20px;min-height:100%;padding-bottom:100px;">
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:8px;flex-wrap:nowrap;">
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <button class="btn sec" data-action="exitStudyMode" style="font-size:0.78rem;padding:6px 12px;white-space:nowrap;">
                ← Voltar
              </button>
              <!-- Contadores ao lado do botão Voltar -->
              <div style="display:inline-flex;gap:8px;align-items:center;background:rgba(10,15,30,0.6);border:1px solid rgba(255,215,0,0.15);border-radius:16px;padding:4px 10px;white-space:nowrap;">
                <span style="color:#34d399;font-weight:bold;font-size:0.9rem;" id="studyCorrect">${studyModeCorrect}</span><span style="color:#34d399;font-size:0.75rem;">✓</span>
                <span style="color:rgba(255,215,0,0.2);font-size:0.85rem;">|</span>
                <span style="color:#fb7185;font-weight:bold;font-size:0.9rem;" id="studyWrong">${studyModeWrong}</span><span style="color:#fb7185;font-size:0.75rem;">✗</span>
              </div>
            </div>
            <div style="text-align:center;flex:1;">
              <h1 style="font-family:'MedievalSharp','Cinzel',serif;color:var(--gold);font-size:1.1rem;margin:0;">📖 Modo de Estudo</h1>
            </div>
            <div style="color:var(--txt-dim);font-size:0.85rem;flex-shrink:0;">
              <span id="studyProgress">${studyModeIndex + 1}</span>/${studyModeQuestions.length}
            </div>
          </div>
          
          <!-- Question Area -->
          <div id="studyQuestionArea" style="background:linear-gradient(180deg,#1a1228,#12192e);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 30px rgba(30,60,120,0.3);">
            <!-- Questão será renderizada aqui -->
          </div>
        </div>
      `;
      document.body.appendChild(page);
      
      renderStudyQuestion();
    }
    
    function renderStudyQuestion() {
      if (studyModeIndex >= studyModeQuestions.length) {
        showStudyModeResults();
        return;
      }
      
      const q = studyModeQuestions[studyModeIndex];
      const area = document.getElementById('studyQuestionArea');
      
      area.innerHTML = `
        <div style="margin-bottom:16px;">
          <span style="background:rgba(139,92,246,0.2);color:#a78bfa;padding:4px 10px;border-radius:4px;font-size:0.75rem;">
            ${escapeHtml(q.t || 'Geral')}
          </span>
        </div>
        
        <h3 style="color:var(--txt);font-size:1.1rem;line-height:1.6;margin-bottom:24px;">
          ${escapeHtml(q.q)}
        </h3>

        <div id="studyOptions" style="display:grid;gap:10px;">
          ${q.opts.map((opt, idx) => `
            <button class="study-option-btn" data-action="answerStudyQuestion" data-arg="${idx}" data-arg-type="number"
                    style="background:linear-gradient(180deg,#1e293b,#0f172a);border:2px solid #334155;border-radius:10px;padding:14px 18px;text-align:left;color:var(--txt);font-size:0.95rem;cursor:pointer;transition:all 0.2s;"
                    onmouseover="this.style.borderColor='var(--blue)';this.style.background='linear-gradient(180deg,#1e3a5f,#0f172a)'"
                    onmouseout="this.style.borderColor='#334155';this.style.background='linear-gradient(180deg,#1e293b,#0f172a)'">
              <span style="color:var(--blue);font-weight:bold;margin-right:8px;">${String.fromCharCode(65 + idx)})</span>
              ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
        
        <div id="studyFeedback" style="display:none;margin-top:20px;"></div>
      `;
      
      document.getElementById('studyProgress').textContent = studyModeIndex + 1;
    }
    
    function answerStudyQuestion(selectedIdx) {
      if (studyModeIndex >= studyModeQuestions.length) return;
      const q = studyModeQuestions[studyModeIndex];
      const isCorrect = selectedIdx === q.ans;
      
      // Desabilitar botões
      document.querySelectorAll('.study-option-btn').forEach((btn, idx) => {
        btn.disabled = true;
        btn.style.cursor = 'default';
        btn.onmouseover = null;
        btn.onmouseout = null;
        
        if (idx === q.ans) {
          btn.style.borderColor = '#34d399';
          btn.style.background = 'rgba(52,211,153,0.15)';
        } else if (idx === selectedIdx && !isCorrect) {
          btn.style.borderColor = '#fb7185';
          btn.style.background = 'rgba(251,113,133,0.15)';
        }
      });
      
      // Atualizar contadores
      updateSRData(q.qid, isCorrect);
      localStorage.setItem('nq_last_study', Date.now().toString());
      if (isCorrect) {
        studyModeCorrect++;
        document.getElementById('studyCorrect').textContent = studyModeCorrect;
      } else {
        studyModeWrong++;
        document.getElementById('studyWrong').textContent = studyModeWrong;
      }
      
      // Mostrar feedback
      const feedback = document.getElementById('studyFeedback');
      feedback.style.display = 'block';
      feedback.innerHTML = `
        <div style="background:${isCorrect ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)'};border:2px solid ${isCorrect ? '#34d399' : '#fb7185'};border-radius:10px;padding:16px;">
          <div style="color:${isCorrect ? '#34d399' : '#fb7185'};font-weight:bold;margin-bottom:8px;">
            ${isCorrect ? '✓ Correto!' : '✗ Incorreto'}
          </div>
          <div style="color:var(--txt);font-size:0.9rem;line-height:1.5;">
            ${escapeHtml(q.exp || 'A resposta correta é a alternativa ' + String.fromCharCode(65 + q.ans) + '.')}
          </div>
          ${(q.refs||[]).length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${(q.refs||[]).map(k => refsDB[k] ? `<a href="${refsDB[k].url}" target="_blank" rel="noopener" style="color:var(--blue);font-size:0.72rem;text-decoration:none;border:1px solid rgba(96,165,250,0.3);padding:2px 9px;border-radius:12px;white-space:nowrap;">🔗 ${escapeHtml(refsDB[k].label)}</a>` : '').filter(Boolean).join('')}</div>` : ''}
        </div>
        
        <div style="text-align:center;margin-top:16px;">
          <button class="btn gold" data-action="nextStudyQuestion">
            ${studyModeIndex + 1 < studyModeQuestions.length ? 'Próxima Questão →' : 'Ver Resultados'}
          </button>
        </div>
      `;
      
      playSound(isCorrect ? 'correct' : 'wrong');
    }
    
    function nextStudyQuestion() {
      studyModeIndex++;
      _saveStudyState();
      renderStudyQuestion();
    }
    
    function showStudyModeResults() {
      const total = studyModeQuestions.length;
      const accuracy = total > 0 ? Math.round((studyModeCorrect / total) * 100) : 0;
      
      const area = document.getElementById('studyQuestionArea');
      area.innerHTML = `
        <div style="text-align:center;">
          <h2 style="color:var(--gold);font-family:'MedievalSharp','Cinzel',serif;margin-bottom:20px;">
            🎉 Estudo Concluído! 🎉
          </h2>
          
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
            <div style="background:rgba(59,130,246,0.15);border:2px solid rgba(59,130,246,0.4);border-radius:10px;padding:16px;">
              <div style="font-size:2rem;color:#3b82f6;font-weight:bold;">${total}</div>
              <div style="font-size:0.8rem;color:var(--txt-dim);">Questões</div>
            </div>
            <div style="background:rgba(52,211,153,0.15);border:2px solid rgba(52,211,153,0.4);border-radius:10px;padding:16px;">
              <div style="font-size:2rem;color:#34d399;font-weight:bold;">${studyModeCorrect}</div>
              <div style="font-size:0.8rem;color:var(--txt-dim);">Acertos</div>
            </div>
            <div style="background:rgba(251,113,133,0.15);border:2px solid rgba(251,113,133,0.4);border-radius:10px;padding:16px;">
              <div style="font-size:2rem;color:#fb7185;font-weight:bold;">${studyModeWrong}</div>
              <div style="font-size:0.8rem;color:var(--txt-dim);">Erros</div>
            </div>
          </div>
          
          <div style="background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.3);border-radius:10px;padding:20px;margin-bottom:24px;">
            <div style="font-size:2.5rem;color:var(--gold);font-weight:bold;">${accuracy}%</div>
            <div style="color:var(--txt-dim);">Taxa de Acerto</div>
          </div>
          
          <div style="display:flex;gap:12px;justify-content:center;">
            <button class="btn sec" data-action="exitStudyMode">← Voltar</button>
            <button class="btn gold" data-action="restartStudyMode">Estudar Novamente</button>
          </div>
        </div>
      `;
      
      playSound('victory');
    }
    
    function restartStudyMode() {
      _clearStudyState();
      studyModeQuestions = shuffle(studyModeQuestions);
      studyModeIndex = 0;
      studyModeCorrect = 0;
      studyModeWrong = 0;
      renderStudyQuestion();
    }
    
    function exitStudyMode() {
      _clearStudyState();
      studyModeActive = false;
      document.getElementById('studyModePage')?.remove();
      document.querySelector('.app').classList.remove('hidden');
      
      // Se não tinha jogo iniciado, mostrar welcome
      if (!state.gameStarted) {
        document.querySelector('.welcome-screen')?.classList.remove('hidden');
        refreshWelcomeSave();
      }
    }
    
    function setStudyMode(mode, topic = null) {
      studyMode = mode;
      selectedTopic = topic || 'all';
      
      let message = '';
      if (mode === 'all') {
        message = '🎲 Modo: Todas as questões';
      } else if (mode === 'review') {
        message = '🔄 Modo: Revisão de erros';
      } else if (mode === 'topic') {
        message = `📖 Modo: ${topic}`;
      }
      
      log(message);
      
      // Reiniciar jogo com novo modo
      if (state.gameStarted) {
        if (confirm('Deseja reiniciar o jogo com o novo modo de estudo?')) {
          startNewFromWelcome();
        }
      }
    }
    
    function filterQuestionsByMode(allQuestions) {
      if (studyMode === 'all') {
        return allQuestions;
      } else if (studyMode === 'review') {
        const stats = getDetailedStats();
        const missedTopics = Object.keys(stats.mostMissed).map(k => stats.mostMissed[k].topic);
        return allQuestions.filter(q => missedTopics.includes(q.t));
      } else if (studyMode === 'topic' && selectedTopic !== 'all') {
        return allQuestions.filter(q => q.t === selectedTopic);
      }
      return allQuestions;
    }

    // ============ SISTEMA DE CONQUISTAS/ACHIEVEMENTS ============
    const ACHIEVEMENTS_KEY = 'nefroquest-achievements';
    
    const ACHIEVEMENTS_LIST = [
      {
        id: 'hd_master',
        name: 'Mestre da Hemodiálise',
        description: 'Acerte 50 questões sobre Hemodiálise',
        icon: '💉',
        condition: (stats) => {
          const hdTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('hemodiálise') || t.toLowerCase().includes('hd')
          );
          return hdTopics.reduce((sum, t) => sum + (stats.byTopic[t]?.correct || 0), 0) >= 50;
        }
      },
      {
        id: 'nephron_guardian',
        name: 'Guardião dos Néfrons',
        description: 'Acerte 100 questões consecutivas sem errar',
        icon: '🛡️',
        condition: (stats) => {
          // Verificar streak máximo no histórico
          let maxStreak = 0;
          let currentStreak = 0;
          stats.questionHistory.slice().reverse().forEach(q => {
            if (q.correct) {
              currentStreak++;
              maxStreak = Math.max(maxStreak, currentStreak);
            } else {
              currentStreak = 0;
            }
          });
          return maxStreak >= 100;
        }
      },
      {
        id: 'speed_demon',
        name: 'Raio X',
        description: 'Responda 10 questões em menos de 30 segundos cada',
        icon: '⚡',
        condition: (stats) => {
          const fastAnswers = stats.questionHistory.filter(q => q.time > 0 && q.time < 30);
          return fastAnswers.length >= 10;
        }
      },
      {
        id: 'perfectionist_drc',
        name: 'Perfeccionista da DRC',
        description: 'Acerte todas as questões do tema DRC (mínimo 20)',
        icon: '💎',
        condition: (stats) => {
          const drcTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('drc') || t.toLowerCase().includes('doença renal crônica')
          );
          return drcTopics.some(t => {
            const data = stats.byTopic[t];
            return data.total >= 20 && data.wrong === 0;
          });
        }
      },
      {
        id: 'transplant_expert',
        name: 'Expert em Transplante',
        description: 'Acerte 30 questões sobre Transplante Renal',
        icon: '🏥',
        condition: (stats) => {
          const txTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('transplante')
          );
          return txTopics.reduce((sum, t) => sum + (stats.byTopic[t]?.correct || 0), 0) >= 30;
        }
      },
      {
        id: 'glomerulo_sage',
        name: 'Sábio das Glomerulopatias',
        description: 'Acerte 40 questões sobre Glomerulopatias',
        icon: '🔬',
        condition: (stats) => {
          const glomTopics = Object.keys(stats.byTopic).filter(t => 
            t.toLowerCase().includes('glomerul') || t.toLowerCase().includes('nefrite')
          );
          return glomTopics.reduce((sum, t) => sum + (stats.byTopic[t]?.correct || 0), 0) >= 40;
        }
      },
      {
        id: 'century_club',
        name: 'Clube dos 100',
        description: 'Responda 100 questões (certas ou erradas)',
        icon: '💯',
        condition: (stats) => stats.totalQuestions >= 100
      },
      {
        id: 'accuracy_master',
        name: 'Mestre da Precisão',
        description: 'Mantenha 90% de acerto em pelo menos 50 questões',
        icon: '🎯',
        condition: (stats) => {
          return stats.totalQuestions >= 50 && 
                 (stats.totalCorrect / stats.totalQuestions) >= 0.9;
        }
      },
      {
        id: 'night_scholar',
        name: 'Estudioso Noturno',
        description: 'Responda 20 questões entre 22h e 6h',
        icon: '🌙',
        condition: (stats) => {
          const nightQuestions = stats.questionHistory.filter(q => {
            const hour = new Date(q.date).getHours();
            return hour >= 22 || hour < 6;
          });
          return nightQuestions.length >= 20;
        }
      },
      {
        id: 'marathon_runner',
        name: 'Maratonista do Conhecimento',
        description: 'Responda 50 questões em um único dia',
        icon: '🏃',
        condition: (stats) => {
          const today = new Date().toDateString();
          const todayQuestions = stats.questionHistory.filter(q => 
            new Date(q.date).toDateString() === today
          );
          return todayQuestions.length >= 50;
        }
      },
      {
        id: 'arqui_nefromante_slayer',
        name: 'Campeão da Nefrologia',
        description: 'Derrote o Arqui-Nefromante e vença o jogo',
        icon: '🏆',
        imgIcon: 'assets/titulodecampeao.png',
        condition: (stats) => {
          return !!localStorage.getItem('nefroquest-arqui-defeated');
        }
      },
      {
        id: 'hardcore_champion',
        name: 'Lenda Hardcore',
        description: 'Vença o jogo no modo Hardcore (1 vida, somente difíceis)',
        icon: '💀',
        condition: (stats) => {
          return !!localStorage.getItem('nefroquest-hardcore-completed');
        }
      }
    ];
    
    function getUnlockedAchievements() {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    }
    
    function saveUnlockedAchievements(unlocked) {
      try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked)); } catch(e) {}
    }
    
    function checkAchievements() {
      const stats = getDetailedStats();
      const unlocked = getUnlockedAchievements();
      const newUnlocked = [];
      
      ACHIEVEMENTS_LIST.forEach(achievement => {
        if (!unlocked.includes(achievement.id) && achievement.condition(stats)) {
          unlocked.push(achievement.id);
          newUnlocked.push(achievement);
        }
      });
      
      if (newUnlocked.length > 0) {
        saveUnlockedAchievements(unlocked);
        newUnlocked.forEach(ach => showAchievementNotification(ach));
      }
    }
    
    function showAchievementNotification(achievement) {
      playSound('levelup');
      
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1a1228 0%, #2a1a3a 100%);
        border: 2px solid var(--gold);
        border-radius: 12px;
        padding: 20px;
        max-width: 350px;
        z-index: 20000;
        box-shadow: 0 10px 40px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.2);
        animation: slideInRight 0.5s ease-out, pulse 2s ease-in-out infinite;
      `;
      
      const iconHtml = achievement.imgIcon
        ? `<img src="${achievement.imgIcon}" alt="${achievement.name}" style="width:72px;height:72px;object-fit:contain;margin-bottom:10px;animation:bounce 1s ease-in-out infinite;filter:drop-shadow(0 0 12px rgba(255,215,0,0.8));">`
        : `<div style="font-size:3rem;margin-bottom:10px;animation:bounce 1s ease-in-out infinite;">${achievement.icon}</div>`;
      notification.innerHTML = `
        <div style="text-align:center;">
          ${iconHtml}
          <div style="color:var(--gold);font-weight:bold;font-size:1.1rem;margin-bottom:8px;font-family:'Cinzel',serif;">
            🏆 Conquista Desbloqueada!
          </div>
          <div style="color:var(--txt);font-weight:bold;margin-bottom:6px;">${achievement.name}</div>
          <div style="color:var(--txt-dim);font-size:0.85rem;line-height:1.4;">${achievement.description}</div>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
      }, 5000);
    }
    
    function showAchievementsModal() {
      // Remover popup anterior se existir
      document.querySelectorAll('.achievements-popup').forEach(el => el.remove());
      
      const unlocked = getUnlockedAchievements();
      
      const _achIsMobile = window.innerWidth < 769;
      const modal = document.createElement('div');
      modal.className = 'modal show achievements-popup';
      // No mobile: overflow-y auto no container + align-items flex-start para scroll completo
      // No PC: centralizado com max-height 85vh
      modal.style.cssText = _achIsMobile
        ? 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:flex-start;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:12px 12px calc(env(safe-area-inset-bottom,0px)+80px);box-sizing:border-box;'
        : 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(6px);padding:32px 16px;';
      const _achContentStyle = _achIsMobile
        ? 'max-width:550px;width:100%;max-height:calc(100svh - 100px);max-height:calc(100dvh - 100px);overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:20px 16px;box-shadow:0 0 40px rgba(255,215,0,0.3);'
        : 'max-width:550px;max-height:calc(100vh - 64px);overflow-y:auto;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(255,215,0,0.3);';
      modal.innerHTML = `
        <div class="modal-content" style="${_achContentStyle}">
          <h2 style="color:var(--gold);margin-bottom:12px;font-family:'MedievalSharp','Cinzel',serif;">🏆 CONQUISTAS 🏆</h2>
          
          <div style="margin-bottom:20px;">
            <div style="display:inline-block;background:rgba(255,215,0,0.15);border:2px solid rgba(255,215,0,0.4);border-radius:50%;width:80px;height:80px;line-height:80px;">
              <span style="font-size:1.8rem;color:var(--gold);font-weight:bold;">${unlocked.length}/${ACHIEVEMENTS_LIST.length}</span>
            </div>
            <div style="color:var(--txt-dim);font-size:0.85rem;margin-top:8px;">Desbloqueadas</div>
          </div>
          
          <!-- Badges de Progressão -->
          <div style="margin-bottom:20px;">
            <div style="font-size:0.75rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Badges de Progressão</div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;max-width:320px;margin:0 auto;">
              ${BADGES.map(badge => {
                const isUnlocked = state.correctTotal >= badge.required;
                const badgeLabel = isUnlocked ? `${badge.name}` : `${badge.name} (${badge.required} acertos)`;
                return `
                  <div title="${badge.name} (${badge.required} acertos)"
                    data-action="_showBadgeTip" data-pass-this="1" data-badge-label="${escapeHtml(badge.name)} (${badge.required} acertos)"
                    style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;cursor:pointer;
                    border:2px solid ${isUnlocked ? 'var(--gold)' : 'var(--blue-dark)'};
                    box-shadow:${isUnlocked ? '0 0 12px rgba(255,215,0,0.4)' : 'none'};
                  ">
                    <img src="assets/badges/badge${badge.id}.png" alt="${badge.name}"
                      style="width:100%;height:100%;object-fit:cover;
                        filter:${isUnlocked ? 'none' : 'grayscale(60%) brightness(0.7)'};
                        opacity:${isUnlocked ? '1' : '0.7'};
                    ">
                    ${!isUnlocked ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem;background:rgba(0,0,0,0.15);">🔒</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
            <div style="font-size:0.7rem;color:var(--txt-dim);margin-top:8px;">
              ${BADGES.filter(b => state.correctTotal >= b.required).length}/${BADGES.length} badges desbloqueados
            </div>
          </div>

          <div style="display:grid;gap:10px;padding:4px;">
            ${ACHIEVEMENTS_LIST.map(ach => {
              const isUnlocked = unlocked.includes(ach.id);
              return `
                <div style="
                  background:${isUnlocked ? 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.1))' : 'rgba(0,0,0,0.3)'};
                  border:2px solid ${isUnlocked ? '#34d399' : '#374151'};
                  border-radius:10px;
                  padding:12px;
                  display:flex;
                  align-items:center;
                  gap:12px;
                  ${!isUnlocked ? 'opacity:0.5;' : ''}
                  ${isUnlocked ? 'box-shadow:0 0 15px rgba(52,211,153,0.2);' : ''}
                ">
                  <div style="font-size:2.2rem;flex-shrink:0;${!isUnlocked ? 'filter:grayscale(1) brightness(0.6);' : ''}">
                    ${ach.imgIcon
                      ? `<img src="${ach.imgIcon}" alt="${ach.name}" style="width:48px;height:48px;object-fit:contain;${!isUnlocked ? 'filter:grayscale(1) brightness(0.5);' : 'filter:drop-shadow(0 0 8px rgba(255,215,0,0.7));'}">`
                      : ach.icon
                    }
                  </div>
                  <div style="flex:1;text-align:left;">
                    <div style="color:${isUnlocked ? '#34d399' : 'var(--txt)'};font-weight:bold;font-size:0.9rem;display:flex;align-items:center;gap:6px;">
                      ${ach.name}
                      ${isUnlocked ? '<span style="color:#34d399;font-size:0.8rem;">✓</span>' : '<span style="color:#6b7280;font-size:0.7rem;">🔒</span>'}
                    </div>
                    <div style="color:var(--txt-dim);font-size:0.75rem;margin-top:2px;">${ach.description}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <button class="btn gold" style="margin-top:20px;" data-close-closest=".modal">Continuar</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      playSound('click');
    }
    
    // Adicionar animações CSS
    const achievementStyles = document.createElement('style');
    achievementStyles.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes pulse {
        0%, 100% { box-shadow: 0 10px 40px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.2); }
        50% { box-shadow: 0 10px 40px rgba(255,215,0,0.5), 0 0 30px rgba(255,215,0,0.4); }
      }
    `;
    document.head.appendChild(achievementStyles);

    // ============ INTEGRAÇÃO COM O SISTEMA EXISTENTE ============
    
    // Variável para tracking de tempo
    let questionStartTime = 0;
    // Erros da sessão atual (reset a cada nova partida)
    let _sessionWrongAnswers = [];
    
    // Modificar a função answer original para incluir tracking
    const originalAnswer = answer;
    window.answer = function(i, btn) {
      if (!state.gameStarted || state.answered) return;
      
      const timeSpent = questionStartTime > 0 ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
      const isCorrect = i === state.current.a;
      
      // Tracking de estatísticas
      trackQuestionAnswer(state.current, isCorrect, timeSpent);

      // Acumular erros da sessão para revisão no fim de partida
      if (!isCorrect && state.current) _sessionWrongAnswers.push(state.current);

      // Marcar questão como dominada após resposta correta
      if (isCorrect && state.current && state.current.id) {
        _masteredSet.add(state.current.id);
        try { localStorage.setItem(MASTERED_KEY, JSON.stringify([..._masteredSet])); } catch(e) {}
      }

      // Chamar função original
      originalAnswer(i, btn);
      
      // Verificar conquistas
      checkAchievements();
    };
    
    // Modificar renderQuestion para iniciar timer
    const originalRenderQuestion = renderQuestion;
    window.renderQuestion = function() {
      questionStartTime = Date.now();
      originalRenderQuestion();
    };
    
    // Filtros de modo de estudo são aplicados via filterQuestionsByMode() dentro do shuffleQueue

    // ============ MODO PROVA SIMULADA ============
    const EXAM_QUESTION_COUNT = 60;
    const EXAM_DURATION_SEC   = 90 * 60; // 90 minutos
    const EXAM_SAVE_KEY = 'nefroquest-exam-state';
    const EXAM_TTL_MS   = 2 * 60 * 60 * 1000; // 2 horas

    let _examState = null; // {questions, idx, answers, startTime, timerInterval}

    function _saveExamState() {
      if (!_examState) return;
      try {
        const { questions, idx, answers, startTime } = _examState;
        localStorage.setItem(EXAM_SAVE_KEY, JSON.stringify({ questions, idx, answers, startTime, savedAt: Date.now() }));
      } catch(e) {}
    }

    function _loadExamState() {
      try {
        const raw = localStorage.getItem(EXAM_SAVE_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s?.startTime || !s?.questions?.length) return null;
        if (Date.now() - s.savedAt > EXAM_TTL_MS) { localStorage.removeItem(EXAM_SAVE_KEY); return null; }
        const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
        if (elapsed >= EXAM_DURATION_SEC) { localStorage.removeItem(EXAM_SAVE_KEY); return null; }
        return s;
      } catch(e) { return null; }
    }

    function _clearExamState() {
      try { localStorage.removeItem(EXAM_SAVE_KEY); } catch(e) {}
    }

    function startExamMode() {
      if (_examState) { showExamQuestion(); return; }

      // Verificar se existe prova salva (refresh/fechar browser)
      const saved = _loadExamState();
      if (saved) {
        const elapsed = Math.floor((Date.now() - saved.startTime) / 1000);
        const remaining = EXAM_DURATION_SEC - elapsed;
        const m = Math.floor(remaining / 60);
        if (confirm(`Você tem uma prova em andamento (${m} min restantes). Continuar de onde parou?`)) {
          _examState = { questions: saved.questions, idx: saved.idx, answers: saved.answers, startTime: saved.startTime, timerInterval: null };
          document.getElementById('welcomeScreen')?.classList.add('hidden');
          _renderExamUI();
          return;
        } else {
          _clearExamState();
        }
      }

      // Sortear 60 questões únicas do banco
      const pool = shuffle([...questionBank]);
      const questions = pool.slice(0, EXAM_QUESTION_COUNT);

      _examState = {
        questions,
        idx: 0,
        answers: [],   // {qId, correct, cat, answered}
        startTime: Date.now(),
        timerInterval: null
      };

      document.getElementById('welcomeScreen')?.classList.add('hidden');
      _renderExamUI();
    }

    function _renderExamUI() {
      document.querySelectorAll('.exam-overlay').forEach(e => e.remove());
      const overlay = document.createElement('div');
      overlay.className = 'exam-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;background:#0a0e1a;overflow-y:auto;display:flex;flex-direction:column;';
      overlay.id = 'examOverlay';
      document.body.appendChild(overlay);
      _examState.timerInterval = setInterval(_updateExamTimer, 1000);
      showExamQuestion();
    }

    function _updateExamTimer() {
      const elapsed = Math.floor((Date.now() - _examState.startTime) / 1000);
      const remaining = EXAM_DURATION_SEC - elapsed;
      const el = document.getElementById('examTimer');
      if (!el) return;
      if (remaining <= 0) {
        clearInterval(_examState.timerInterval);
        _clearExamState();
        // Marcar questões restantes como não respondidas
        while (_examState.answers.length < _examState.questions.length) {
          _examState.answers.push({ qId: _examState.questions[_examState.answers.length].id, correct: false, cat: _examState.questions[_examState.answers.length].c || 'geral', answered: false });
        }
        showExamResults();
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      const urgent = remaining < 600;
      el.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
      el.style.color = urgent ? '#fb7185' : '#34d399';
    }

    function showExamQuestion() {
      const overlay = document.getElementById('examOverlay');
      if (!overlay) return;
      const {questions, idx, answers} = _examState;
      if (idx >= questions.length) { showExamResults(); return; }
      const q = questions[idx];
      const answered = answers[idx];
      const elapsed = Math.floor((Date.now() - _examState.startTime) / 1000);
      const remaining = EXAM_DURATION_SEC - elapsed;
      const m = Math.floor(remaining / 60), s = remaining % 60;

      overlay.innerHTML = `
        <div style="max-width:700px;width:100%;margin:0 auto;padding:20px 16px 100px;box-sizing:border-box;">
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;background:rgba(20,30,50,0.9);border-radius:12px;padding:12px 16px;border:1px solid var(--blue-dark);">
            <div style="font-family:'Cinzel',serif;color:var(--gold);font-size:0.9rem;">📝 Prova Simulada</div>
            <div style="display:flex;gap:16px;align-items:center;">
              <div id="examTimer" style="font-weight:bold;color:#34d399;">⏱ ${m}:${s.toString().padStart(2,'0')}</div>
              <div style="color:var(--txt-dim);font-size:0.85rem;">${idx+1} / ${questions.length}</div>
            </div>
          </div>
          <!-- Barra de progresso -->
          <div style="background:rgba(0,0,0,0.4);height:4px;border-radius:2px;margin-bottom:16px;overflow:hidden;">
            <div style="background:var(--gold);height:100%;width:${((idx)/questions.length*100).toFixed(1)}%;transition:width 0.3s;"></div>
          </div>
          <!-- Questão -->
          <div style="background:rgba(20,30,50,0.8);border:1px solid var(--blue-dark);border-radius:12px;padding:18px;margin-bottom:14px;">
            <div style="color:var(--txt-dim);font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Questão ${idx+1}</div>
            <p style="color:var(--txt);font-size:0.92rem;line-height:1.7;margin:0;">${escapeHtml(q.q)}</p>
          </div>
          <!-- Opções -->
          <div id="examOpts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
            ${q.o.map((opt, i) => {
              let bg = 'rgba(20,30,50,0.7)', border = '1px solid var(--blue-dark)', color = 'var(--txt)';
              if (answered) {
                if (i === q.a) { bg='rgba(52,211,153,0.15)'; border='1px solid #34d399'; color='#34d399'; }
                else if (i === answered.chosen) { bg='rgba(251,113,133,0.15)'; border='1px solid #fb7185'; color='#fb7185'; }
              }
              return `<button data-action="_examAnswer" data-arg="${i}" data-arg-type="number" ${answered?'disabled':''} style="text-align:left;background:${bg};border:${border};border-radius:10px;padding:12px 14px;color:${color};font-size:0.87rem;cursor:${answered?'default':'pointer'};transition:all 0.15s;line-height:1.5;">${escapeHtml(opt)}</button>`;
            }).join('')}
          </div>
          ${answered ? `
            <div style="background:rgba(20,30,50,0.8);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;margin-bottom:14px;font-size:0.82rem;color:#94a3b8;line-height:1.6;">
              <strong style="color:${answered.correct?'#34d399':'#fb7185'};">${answered.correct?'✅ Correto':'❌ Incorreto'}</strong><br>
              ${escapeHtml(q.e)}
            </div>
            <button data-action="_examNext" style="width:100%;background:linear-gradient(180deg,#4f46e5,#3730a3);border:2px solid #6366f1;color:#fff;border-radius:10px;padding:13px;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;cursor:pointer;letter-spacing:1px;">
              ${idx+1 < questions.length ? 'PRÓXIMA →' : 'VER RESULTADO'}
            </button>` : ''}
          <!-- Botão sair -->
          <button data-action="_exitExam" style="margin-top:10px;width:100%;background:none;border:1px solid #374151;color:#64748b;border-radius:8px;padding:8px;font-size:0.78rem;cursor:pointer;">Encerrar prova</button>
        </div>`;
    }

    function _examAnswer(chosen) {
      const {questions, idx} = _examState;
      const q = questions[idx];
      const correct = chosen === q.a;
      _examState.answers[idx] = { qId: q.id, correct, cat: q.c || 'geral', chosen, answered: true };
      _saveExamState();
      showExamQuestion();
    }

    function _examNext() {
      _examState.idx++;
      if (_examState.idx >= _examState.questions.length) { showExamResults(); }
      else { showExamQuestion(); }
    }

    function _exitExam() {
      if (!confirm('Encerrar a prova? O progresso será perdido.')) return;
      clearInterval(_examState.timerInterval);
      _clearExamState();
      _examState = null;
      document.querySelectorAll('.exam-overlay').forEach(e => e.remove());
      document.getElementById('welcomeScreen')?.classList.remove('hidden');
      refreshWelcomeSave();
      if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
    }

    function showExamResults() {
      clearInterval(_examState.timerInterval);
      const {questions, answers, startTime} = _examState;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const totalAnswered = answers.filter(a => a.answered).length;
      const totalCorrect  = answers.filter(a => a.correct).length;
      const pct = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0;
      const elMin = Math.floor(elapsed / 60), elSec = elapsed % 60;

      // Desempenho por categoria
      const byCat = {};
      answers.forEach(a => {
        if (!a.answered) return;
        if (!byCat[a.cat]) byCat[a.cat] = {correct:0,total:0};
        byCat[a.cat].total++;
        if (a.correct) byCat[a.cat].correct++;
      });
      const catLabels = {
        glomerular:'Glomerulopatias',nefrologia_geral:'Nefrologia Geral',
        'eletrólitos':'Eletrólitos',lra:'LRA',drc:'DRC',
        nefropatia_diabetica:'Nefropatia Diabética',dialise:'Diálise',
        transplante:'Transplante',hipertensao:'Hipertensão',
        acido_base:'Ácido-Base','litíase':'Litíase',infeccao:'Infecção',
        farmacologia:'Farmacologia',genetica:'Genética',uti:'UTI / Crítico',
        diagnostico:'Diagnóstico',oncologia_renal:'Oncologia Renal',geral:'Geral'
      };
      const catRows = Object.entries(byCat)
        .sort((a,b) => (a[1].correct/a[1].total) - (b[1].correct/b[1].total))
        .map(([cat,d]) => {
          const p = Math.round(d.correct/d.total*100);
          const c = p>=70?'#34d399':p>=50?'#fbbf24':'#fb7185';
          return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:6px;">
            <span style="flex:1;font-size:0.8rem;color:var(--txt);">${catLabels[cat]||cat}</span>
            <div style="width:60px;background:rgba(0,0,0,0.4);height:4px;border-radius:2px;overflow:hidden;flex-shrink:0;"><div style="background:${c};height:100%;width:${p}%;"></div></div>
            <span style="color:${c};font-weight:bold;font-size:0.78rem;min-width:36px;text-align:right;">${p}% (${d.correct}/${d.total})</span>
          </div>`;
        }).join('');

      const overlay = document.getElementById('examOverlay');
      if (!overlay) return;
      overlay.innerHTML = `
        <div style="max-width:600px;width:100%;margin:0 auto;padding:24px 16px 40px;box-sizing:border-box;">
          <h2 style="color:var(--gold);font-family:'Cinzel',serif;text-align:center;margin-bottom:20px;">📋 Resultado da Prova</h2>
          <!-- Placar geral -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
            <div style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.35);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:1.8rem;font-weight:bold;color:${pct>=60?'#34d399':pct>=40?'#fbbf24':'#fb7185'};">${pct}%</div>
              <div style="font-size:0.68rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Acerto</div>
            </div>
            <div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.35);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:1.8rem;font-weight:bold;color:var(--blue);">${totalCorrect}/${totalAnswered}</div>
              <div style="font-size:0.68rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Corretas</div>
            </div>
            <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:1.8rem;font-weight:bold;color:#fbbf24;">${elMin}m${elSec}s</div>
              <div style="font-size:0.68rem;color:var(--txt-dim);text-transform:uppercase;letter-spacing:0.5px;">Tempo</div>
            </div>
          </div>
          <!-- Mensagem -->
          <div style="background:rgba(20,30,50,0.8);border:1px solid var(--blue-dark);border-radius:10px;padding:14px;text-align:center;margin-bottom:20px;">
            <p style="color:var(--txt);font-size:0.9rem;margin:0;">
              ${pct>=70?'🏆 Excelente! Aprovado com distinção.':pct>=60?'✅ Aprovado! Continue estudando para aperfeiçoar.':pct>=40?'⚠️ Abaixo da média. Revise os tópicos em vermelho.':'❌ Resultado insuficiente. Use o Modo de Estudo para reforçar.'}
            </p>
          </div>
          <!-- Por categoria -->
          <div style="text-align:left;margin-bottom:20px;">
            <h3 style="color:var(--gold);font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:1px;margin-bottom:10px;">DESEMPENHO POR CATEGORIA</h3>
            <div style="display:flex;flex-direction:column;gap:6px;">${catRows}</div>
          </div>
          <!-- Revisão de erros -->
          ${(() => {
            const wrongItems = questions.map((q, i) => ({q, ans: answers[i]})).filter(({ans}) => ans && ans.answered && !ans.correct);
            if (!wrongItems.length) return '<div style="text-align:center;color:#34d399;margin-bottom:20px;font-size:0.85rem;">🎉 Sem erros para revisar!</div>';
            const optLetters = ['A','B','C','D'];
            return `
            <div style="text-align:left;margin-bottom:20px;">
              <h3 style="color:#fb7185;font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:1px;margin-bottom:4px;">📋 REVISÃO DE ERROS (${wrongItems.length})</h3>
              <button data-action="_toggleErrorsList" data-pass-this="1"
                style="background:none;border:1px solid rgba(251,113,133,0.4);color:#fb7185;border-radius:6px;padding:6px 14px;font-size:0.78rem;cursor:pointer;margin-bottom:10px;">▼ Ver erros</button>
              <div style="display:none;flex-direction:column;gap:10px;">
                ${wrongItems.map(({q, ans}) => {
                  const opts = q.o || [];
                  return `<div style="background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.3);border-radius:10px;padding:14px;">
                    <p style="color:var(--txt);font-size:0.85rem;line-height:1.6;margin-bottom:10px;">${escapeHtml(q.q)}</p>
                    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
                      ${opts.map((o, i) => {
                        const isCorrect = i === q.a;
                        const isChosen  = i === ans.chosen;
                        const bg    = isCorrect ? 'rgba(52,211,153,0.15)' : isChosen ? 'rgba(251,113,133,0.15)' : 'transparent';
                        const border= isCorrect ? '1px solid #34d399' : isChosen ? '1px solid #fb7185' : '1px solid rgba(255,255,255,0.1)';
                        const color = isCorrect ? '#34d399' : isChosen ? '#fb7185' : 'var(--txt-dim)';
                        const mark  = isCorrect ? ' ✓' : isChosen ? ' ✗' : '';
                        return `<div style="background:${bg};border:${border};border-radius:6px;padding:7px 10px;font-size:0.8rem;color:${color};">${optLetters[i]}. ${escapeHtml(o)}${mark}</div>`;
                      }).join('')}
                    </div>
                    <div style="font-size:0.78rem;color:#94a3b8;line-height:1.6;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">${escapeHtml(q.e || '')}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>`;
          })()}
          <div style="display:flex;gap:10px;margin-top:0;">
            <button data-action="_shareExamResult" data-args='[${pct},${totalCorrect},${totalAnswered}]' style="flex:1;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;border-radius:10px;padding:11px;font-size:0.82rem;font-weight:600;cursor:pointer;">📤 Compartilhar</button>
            <button data-action="_finishExam" style="flex:2;background:linear-gradient(180deg,#b8860b,#7a5a00);border:2px solid var(--gold);color:#fff8dc;border-radius:10px;padding:11px;font-family:'Cinzel',serif;font-size:0.85rem;font-weight:700;cursor:pointer;letter-spacing:1px;">VOLTAR AO MENU</button>
          </div>
        </div>`;
    }

    function _finishExam() {
      _clearExamState();
      _examState = null;
      document.querySelectorAll('.exam-overlay').forEach(e => e.remove());
      document.getElementById('welcomeScreen')?.classList.remove('hidden');
      refreshWelcomeSave();
      if (musicEnabled && !welcomeMusicStarted) startWelcomeMusic();
    }

    // ============ CHANGELOG v5.0 ============
    function showChangelog() {
      document.querySelectorAll('.changelog-popup').forEach(el => el.remove());
      const modal = document.createElement('div');
      modal.className = 'modal show changelog-popup';
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100svh;height:100dvh;background:rgba(0,0,0,0.85);display:flex;align-items:flex-start;justify-content:center;z-index:10000;backdrop-filter:blur(6px);overflow-y:auto;padding:12px 16px calc(env(safe-area-inset-bottom,0px)+80px);box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width:540px;width:calc(100% - 32px);max-height:none;overflow-y:visible;text-align:center;background:linear-gradient(180deg,#12192e,#0b1428);border:2px solid var(--blue-dark);border-radius:14px;padding:24px;box-shadow:0 0 40px rgba(255,215,0,0.3);margin:auto 0;">
          <h2 style="color:var(--gold);margin-bottom:4px;font-family:'MedievalSharp','Cinzel',serif;">📜 NOVIDADES 📜</h2>
          <div style="color:var(--txt-dim);font-size:0.75rem;margin-bottom:20px;">O que há de novo no NefroQuest: Ascension</div>

          <div style="text-align:left;padding:4px;">

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

          <button class="btn gold" style="margin-top:20px;" data-close-closest=".modal">Fechar</button>
        </div>
      `;
      document.body.appendChild(modal);
      playSound('click');
    }

    resetGame();
    initWelcomeScreen();
    setTimeout(_checkStudyReminder, 3000);

    // Botão de preview só visível para desenvolvimento (?dev=1)
    if (new URLSearchParams(window.location.search).get('dev') === '1') {
      const previewBtn = document.getElementById('bossPreviewBtn');
      if (previewBtn) previewBtn.style.display = '';
    }

    // Acesso direto ao Confronto Final via ?boss=1 (link de teste)
    if (new URLSearchParams(window.location.search).get('boss') === '1') {
      // Aguarda o DOM estar pronto e inicia o boss preview automaticamente
      setTimeout(() => {
        startBossPreview();
      }, 300);
    }

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

    // ============ MOBILE DRAWER & BOTTOM DOCK ============
    (function initMobile() {
      const overlay    = document.getElementById('mobileOverlay');
      const leftPanel  = document.querySelector('.panel.left');
      const bottomDock = document.getElementById('mobileBottomDock');
      function isMobile() { return window.innerWidth <= 768; }
      function openDrawer() {
        // No modo arqui-nefromante-final (mobile), mostrar o herói individual normalmente
        const isArquiFinal = document.body.classList.contains('arqui-nefromante-final');
        const heroSection  = leftPanel.querySelector('.hero');
        const partyPanel   = document.getElementById('bossPartyPanel');
        const hudSection   = leftPanel.querySelector('.hud');
        const storySection = leftPanel.querySelector('.story');
        const logSection   = leftPanel.querySelector('.log');
        const equipSection = leftPanel.querySelector('.equip');
        const badgesSection = leftPanel.querySelector('.badges-container');
        if (isArquiFinal) {
          // Forçar display nos elementos normais do herói (sobrescreve o !important do boss mode)
          if (heroSection)   heroSection.setAttribute('style', 'display:block!important');
          if (hudSection)    hudSection.setAttribute('style', 'display:grid!important;grid-template-columns:repeat(3,1fr)!important');
          if (storySection)  storySection.setAttribute('style', 'display:block!important');
          if (logSection)    logSection.setAttribute('style', 'display:block!important');
          if (equipSection)  equipSection.setAttribute('style', 'display:block!important');
          if (badgesSection) badgesSection.setAttribute('style', 'display:block!important');
          if (partyPanel)    partyPanel.setAttribute('style', 'display:none!important');
          // Marcar para restaurar ao fechar
          leftPanel._arquiDrawerOpen = true;
        }
        // Mover o panel.left para o body para escapar do stacking context do .app (display:none)
        if (leftPanel.parentElement !== document.body) {
          leftPanel._originalParent = leftPanel.parentElement;
          leftPanel._originalNextSibling = leftPanel.nextSibling;
          document.body.appendChild(leftPanel);
        }
        // Aplicar estilos inline para garantir visibilidade independente do media query
        leftPanel.style.cssText = [
          'position: fixed',
          'top: 0',
          'left: 0',
          'width: 100vw',
          'height: 100vh',
          'z-index: 9600',
          'overflow-y: auto',
          'border-radius: 0',
          'padding-bottom: 160px',
          'background: linear-gradient(180deg, #1e3a5f 0%, #162d4a 50%, #0f2035 100%)',
          'border: 2px solid #3a6a9a',
          'transform: translateX(0)',
          'display: block'
        ].join(';');
        leftPanel.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (!leftPanel.querySelector('.drawer-close-btn')) {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'drawer-close-btn';
          closeBtn.innerHTML = '&#10005; Fechar';
          closeBtn.onclick = closeDrawer;
          closeBtn.style.cssText = 'display:inline-flex!important;width:auto!important;padding:7px 18px!important;background:rgba(255,215,0,0.10)!important;border:1px solid rgba(255,215,0,0.30)!important;border-radius:8px!important;color:#ffd700!important;font-size:0.65rem!important;font-weight:700!important;cursor:pointer!important;text-transform:uppercase!important;letter-spacing:1px!important;margin:12px 16px 20px!important;align-self:flex-start!important;';
          leftPanel.appendChild(closeBtn);
        }
      }
      function closeDrawer() {
        leftPanel.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        // Remover estilos inline
        leftPanel.style.cssText = '';
        // Devolver o panel.left ao seu pai original
        if (leftPanel._originalParent) {
          if (leftPanel._originalNextSibling) {
            leftPanel._originalParent.insertBefore(leftPanel, leftPanel._originalNextSibling);
          } else {
            leftPanel._originalParent.appendChild(leftPanel);
          }
          leftPanel._originalParent = null;
          leftPanel._originalNextSibling = null;
        }
        // Restaurar estado do boss mode: remover estilos inline e deixar CSS tomar conta
        if (leftPanel._arquiDrawerOpen) {
          leftPanel._arquiDrawerOpen = false;
          const heroSection   = leftPanel.querySelector('.hero');
          const hudSection    = leftPanel.querySelector('.hud');
          const storySection  = leftPanel.querySelector('.story');
          const logSection    = leftPanel.querySelector('.log');
          const equipSection  = leftPanel.querySelector('.equip');
          const badgesSection = leftPanel.querySelector('.badges-container');
          const partyPanel    = document.getElementById('bossPartyPanel');
          // Remover atributos style inline para que o CSS do boss mode volte a controlar
          if (heroSection)   heroSection.removeAttribute('style');
          if (hudSection)    hudSection.removeAttribute('style');
          if (storySection)  storySection.removeAttribute('style');
          if (logSection)    logSection.removeAttribute('style');
          if (equipSection)  equipSection.removeAttribute('style');
          if (badgesSection) badgesSection.removeAttribute('style');
          if (partyPanel)    partyPanel.removeAttribute('style');
        }
      }
      // Expor globalmente para o botão do bottom dock
      window.openMobileDrawer = openDrawer;
      window._applyMobileState = function() { applyMobileState(); };
      function applyMobileState() {
        const heroBtn = document.getElementById('mobileHeroBtn');
        if (isMobile()) {
          const mainAppVisible = !document.getElementById('mainApp').classList.contains('hidden');
          const welcomeVisible = !document.getElementById('welcomeScreen').classList.contains('hidden');
          bottomDock.style.display = mainAppVisible ? 'flex' : 'none';
          if (heroBtn) heroBtn.style.display = mainAppVisible ? 'flex' : 'none';
        } else {
          bottomDock.style.display = 'none';
          if (heroBtn) heroBtn.style.display = 'none';
          closeDrawer();
        }
      }
      overlay.addEventListener('click', closeDrawer);
      // Fechar drawer ao clicar em botão dentro do painel esquerdo
      leftPanel.addEventListener('click', function(e) {
        if (isMobile() && e.target.closest('button') && !e.target.closest('.forge-popup') && !e.target.closest('.narrative-popup')) {
          setTimeout(closeDrawer, 200);
        }
      });
      window.addEventListener('resize', applyMobileState);
      const mainAppEl = document.getElementById('mainApp');
      const welcomeEl = document.getElementById('welcomeScreen');
      const observer = new MutationObserver(function() {
        if (isMobile()) {
          const mainAppVisible = !mainAppEl.classList.contains('hidden');
          const welcomeVisible = !welcomeEl.classList.contains('hidden');
          const _heroBtn = document.getElementById('mobileHeroBtn');
          bottomDock.style.display = mainAppVisible ? 'flex' : 'none';
          if (_heroBtn) _heroBtn.style.display = mainAppVisible ? 'flex' : 'none';
          if (mainAppVisible) closeDrawer();
          if (welcomeVisible) refreshWelcomeSave();
        }
      });
      observer.observe(mainAppEl, { attributes: true, attributeFilter: ['class'] });
      observer.observe(welcomeEl, { attributes: true, attributeFilter: ['class'] });
      applyMobileState();
      // Garantir que o dock apareça mesmo se innerWidth ainda não estava calculado
      setTimeout(applyMobileState, 100);
      setTimeout(applyMobileState, 500);
    })();

    // === LORE DO PERSONAGEM (clique no retrato) ===
    const heroLores = {
      nephros: {
        p1: "Dr. Nephros nasceu às margens do Rio Glomerular, filho de um humilde filtrador de toxinas e de uma sábia guardiã da homeostase. Desde criança, enquanto outros brincavam, ele estudava a maré dos eletrólitos e sussurrava segredos com os néfrons do vale.",
        p2: "Quando o Arqui-Nefromante corrompeu as águas do Reino e transformou néfrons saudáveis em escória fibrótica, Nephros jurou em nome do KDIGO que percorreria cada cripta e cada túbulo até restaurar o equilíbrio — ou morrer tentando."
      },
      aquaria: {
        p1: "Dra. Aquaria cresceu no coração do Lago Osmótico, onde aprendeu a dançar com as moléculas de água antes mesmo de aprender a caminhar. Dizem que ela pode sentir a osmolaridade do ar e prever uma hiponatremia antes que qualquer exame confirme.",
        p2: "Quando o Arqui-Nefromante desviou as correntes do Lago e transformou a água pura em veneno urêmico, Aquaria pegou seu cetro de diuréticos e partiu. Ela não luta por glória — luta porque nenhum rim merece sofrer em silêncio."
      },
      glomerulus: {
        p1: "Dr. Glomerulus é o tipo de cientista que prefere uma biópsia renal a um jantar de gala. Criado em um laboratório subterrâneo por um excêntrico nefropatologista, aprendeu a ler padrões de imunofluorescência como outros leem poesia — com paixão e precisão.",
        p2: "Quando o Arqui-Nefromante começou a semear depósitos de imunocomplexos pelo reino, Glomerulus reconheceu o padrão: era um padrão mesangial tipo III com crescentes. Pegou seu microscópio de combate e declarou guerra. A ciência seria sua espada."
      }
    };

    function showHeroLore() {
      if (window.innerWidth > 768) return;
      if (!state.character || !heroLores[state.character]) return;
      const char = characters[state.character];
      const lore = heroLores[state.character];
      const img = ui.heroImg ? ui.heroImg.src : '';
      const existing = document.getElementById('heroLoreModal');
      if(existing) existing.remove();
      const modal = document.createElement('div');
      modal.id = 'heroLoreModal';
      modal.className = 'hero-lore-modal';
      modal.innerHTML = `
        <div class="hero-lore-card">
          <img class="lore-portrait" src="${img}" alt="${char.name}">
          <div class="lore-name">${char.name}</div>
          <div class="lore-title">${char.title}</div>
          <div class="lore-text">
            <p>${lore.p1}</p>
            <p>${lore.p2}</p>
          </div>
          <button class="lore-close" data-remove-id="heroLoreModal">FECHAR</button>
        </div>
      `;
      modal.addEventListener('click', function(e) {
        if(e.target === modal) modal.remove();
      });
      document.body.appendChild(modal);
    }

     // === SWIPE PARA PRÓXIMA QUESTÃO + NAVEGAÇÃO HERÓI (mobile) ===
    (function initSwipe() {
      var sx = 0, sy = 0, tracking = false;

      function isDrawerOpen() {
        var lp = document.querySelector('.panel.left');
        return lp && lp.classList.contains('mobile-open');
      }

      // Usar o elemento de conteúdo principal como alvo do swipe
      function getSwipeTarget() {
        return document.querySelector('.panel.right') || document.body;
      }

      function onTouchStart(e) {
        if (e.touches.length !== 1) return;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        tracking = true;
      }

      function onTouchEnd(e) {
        if (!tracking) return;
        tracking = false;
        var t = e.changedTouches[0];
        var dx = t.clientX - sx;
        var dy = t.clientY - sy;
        var adx = Math.abs(dx), ady = Math.abs(dy);
        // Ignorar movimentos pequenos ou predominantemente verticais
        if (adx < 40) return;
        if (ady > adx * 0.8) return;

        if (isDrawerOpen()) {
          // Drawer aberto: swipe esquerda fecha
          if (dx < 0) {
            var ov = document.getElementById('mobileOverlay');
            if (ov) ov.click();
          }
          return;
        }

        if (dx < 0) {
          // Swipe esquerda → próxima questão
          var btn = document.getElementById('nextBtn');
          if (btn && !btn.classList.contains('hidden')) {
            setTimeout(function() { btn.click(); }, 150);
          }
        } else {
          // Swipe direita → abrir herói
          if (typeof window.openMobileDrawer === 'function') {
            window.openMobileDrawer();
          }
        }
      }

      // Registrar no document E no panel.right para máxima compatibilidade
      document.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('touchend', onTouchEnd, { passive: true });

      // Também registrar no panel.right quando disponível
      function attachToPanel() {
        var panel = document.querySelector('.panel.right');
        if (panel) {
          panel.addEventListener('touchstart', onTouchStart, { passive: true });
          panel.addEventListener('touchend', onTouchEnd, { passive: true });
        }
      }
      if (document.readyState === 'complete') {
        attachToPanel();
      } else {
        window.addEventListener('load', attachToPanel);
      }
    })();

    // ============ CRONÔMETRO ============
    (function() {
      var _timerSec = 0;
      var _timerRunning = false;
      var _timerInterval = null;
      var _timerEnabled = false; // desligado por padrão

      var PLAY_SVG  = '<polygon points="5,3 19,12 5,21"/>';
      var PAUSE_SVG = '<rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>';

      function _pad(n) { return n < 10 ? '0' + n : '' + n; }

      function _updateDisplay() {
        var el = document.getElementById('timerDisplay');
        if (!el) return;
        var m = Math.floor(_timerSec / 60);
        var s = _timerSec % 60;
        el.textContent = _pad(m) + ':' + _pad(s);
      }

      function _setIcon(running) {
        var icon = document.getElementById('timerIcon');
        if (!icon) return;
        icon.innerHTML = running ? PAUSE_SVG : PLAY_SVG;
      }

      function _start() {
        if (_timerRunning) return;
        _timerRunning = true;
        _timerEnabled = true;
        var widget = document.getElementById('timerWidget');
        if (widget) widget.classList.add('running');
        _setIcon(true);
        _timerInterval = setInterval(function() {
          _timerSec++;
          _updateDisplay();
        }, 1000);
      }

      function _pause() {
        if (!_timerRunning) return;
        _timerRunning = false;
        clearInterval(_timerInterval);
        _timerInterval = null;
        var widget = document.getElementById('timerWidget');
        if (widget) widget.classList.remove('running');
        _setIcon(false);
      }

      function _reset() {
        _pause();
        _timerSec = 0;
        _updateDisplay();
        // Se o timer estava habilitado, reinicia automaticamente
        if (_timerEnabled) {
          setTimeout(_start, 50);
        }
      }

      // Expor toggle no escopo global
      window.timerToggle = function() {
        if (_timerRunning) {
          _pause();
          _timerEnabled = false;
        } else {
          _timerEnabled = true;
          _start();
        }
      };

      // Resetar e iniciar o timer a cada nova questão (se habilitado)
      var _origRQ = window.renderQuestion;
      window.renderQuestion = function() {
        _reset();
        if (_origRQ) _origRQ();
      };

      // Inicializar display
      _updateDisplay();
    })();
  
    // ============ MODO PONTO FRACO ============
    function startWeakPointStudy() {
      const stats = getDetailedStats();
      const weakAxes = NEFRO_AXES.filter(axis => {
        const d = (stats.byCategory || {})[axis.cat];
        return d && d.total >= 5 && (d.correct / d.total) < 0.5;
      });
      let axesToStudy;
      if (weakAxes.length === 0) {
        // Fallback: 3 categorias com menor acerto (mesmo que > 50%)
        const ranked = NEFRO_AXES.map(axis => {
          const d = (stats.byCategory || {})[axis.cat];
          return { axis, accuracy: (d && d.total > 0) ? d.correct/d.total : 1, total: d ? d.total : 0 };
        }).filter(x => x.total > 0).sort((a,b) => a.accuracy - b.accuracy).slice(0, 3);
        if (!ranked.length) { alert('Jogue mais questões para identificar seus pontos fracos!'); return; }
        axesToStudy = ranked.map(x => x.axis);
        const labels = axesToStudy.map(a => `• ${a.label}`).join('\n');
        if (!confirm(`Nenhuma categoria abaixo de 50%.\nEstudo nas 3 com menor acerto:\n${labels}\n\nContinuar?`)) return;
      } else {
        axesToStudy = weakAxes;
      }
      const cats = new Set(axesToStudy.map(a => a.cat));
      studyModeQuestions = shuffle(topics.filter(q => cats.has(q.cat)));
      if (!studyModeQuestions.length) { alert('Nenhuma questão encontrada nas categorias fracas.'); return; }
      _studySelectedAxes = new Set(axesToStudy.map(a => a.id));
      studyModeIndex = 0; studyModeCorrect = 0; studyModeWrong = 0; studyModeActive = true;
      document.querySelectorAll('.study-mode-popup,.welcome-screen').forEach(el => el.classList.add('hidden'));
      showStudyModePage();
    }

    // ============ COMPARTILHAMENTO DE RESULTADO ============
    function _shareResult(tipo, data) {
      const lines = [
        '🏆 NefroQuest: Ascension',
        tipo === 'campanha' ? `⚔️ Campanha — Nível ${data.level || '?'}` : `📝 Prova Simulada`,
        data.correct !== undefined ? `📊 Acerto: ${data.pct}%  |  ${data.correct}/${data.total} corretas` : `📊 Acerto: ${data.pct}%`,
        data.level ? `🎖️ Nível ${data.level}  |  ${data.score} pontos` : `⏱️ ${data.time}`,
        '',
        'Treine nefrologia em: nefroquest.vercel.app'
      ].join('\n');
      if (navigator.share) {
        navigator.share({ title: 'NefroQuest', text: lines }).catch(() => {});
      } else {
        navigator.clipboard.writeText(lines)
          .then(() => alert('✅ Resultado copiado para a área de transferência!'))
          .catch(() => alert(lines));
      }
    }

    function _shareExamResult(pct, correct, total) {
      const elapsed = _examState ? Math.floor((Date.now() - _examState.startTime) / 1000) : 0;
      const m = Math.floor(elapsed/60), s = elapsed%60;
      _shareResult('prova', { pct, correct, total, time: `${m}m${s}s` });
    }

    // ============ OFFLINE BADGE ============
    function _updateOnlineStatus() {
      const badge = document.getElementById('offlineBadge');
      if (badge) badge.style.display = navigator.onLine ? 'none' : 'block';
    }
    window.addEventListener('online',  _updateOnlineStatus);
    window.addEventListener('offline', _updateOnlineStatus);
    _updateOnlineStatus();

    // ============ PWA INSTALL BANNER ============
    let _pwaPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _pwaPrompt = e;
      if (!localStorage.getItem('pwa-dismissed')) {
        setTimeout(() => {
          const b = document.getElementById('pwaBanner');
          if (b) b.style.display = 'flex';
        }, 20000);
      }
    });
    function _installPWA() {
      if (!_pwaPrompt) return;
      _pwaPrompt.prompt();
      _pwaPrompt.userChoice.then(() => {
        _pwaPrompt = null;
        const b = document.getElementById('pwaBanner');
        if (b) b.style.display = 'none';
      });
    }
    function _dismissPWA() {
      localStorage.setItem('pwa-dismissed', '1');
      const b = document.getElementById('pwaBanner');
      if (b) b.style.display = 'none';
    }

    // ============ POPUP MODOS DE JOGO (mobile) ============
    function openGameModesPopup() {
      const el = document.getElementById('gameModesOverlay');
      if (el) el.classList.add('show');
    }
    function closeGameModesPopup() {
      const el = document.getElementById('gameModesOverlay');
      if (el) el.classList.remove('show');
    }
    function closeGameModesPopupOutside(e) {
      if (e.target === document.getElementById('gameModesOverlay')) closeGameModesPopup();
    }


    // Atualiza o box da jornada ao voltar à aba (mobile bfcache / visibilidade)
    window.addEventListener('pageshow', function(e) {
      const ws = document.getElementById('welcomeScreen');
      if (ws && !ws.classList.contains('hidden')) refreshWelcomeSave();
    });
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        const ws = document.getElementById('welcomeScreen');
        if (ws && !ws.classList.contains('hidden')) refreshWelcomeSave();
      }
    });

    // Wrappers expostos no window para serem chamáveis via data-action
    window._mobileCallback = function(type) {
      const cb = window._mobileActionCallbacks?.[type];
      if (typeof cb === 'function') cb();
    };
    window._pricingToLogin = function() {
      closePricingModal();
      openAuthModal();
      switchAuthTab('entrar');
    };
    window._toggleErrorsList = function(btn) {
      const sib = btn.nextElementSibling;
      if (!sib) return;
      sib.style.display = sib.style.display === 'none' ? 'flex' : 'none';
      btn.textContent = btn.textContent.includes('▼') ? '▲ Ocultar erros' : '▼ Ver erros';
    };
    window._selectDiffCard = function(card) {
      document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const btn = document.getElementById('diffConfirmBtn');
      if (btn) btn.disabled = false;
      window._pendingDiff = card.dataset.diffKey || '';
    };
    window._confirmDiff = function(fromWelcome) {
      const diff = window._pendingDiff;
      if (!diff) return;
      document.getElementById('diffSelectorOverlay')?.remove();
      state.difficulty = diff;
      deleteSave();
      if (fromWelcome === true) dismissWelcome();
      document.getElementById('charSelectModal').classList.add('show');
    };
    window._showBadgeTip = function(el) {
      const existing = el.querySelector('.badge-mobile-tip');
      if (existing) { existing.remove(); return; }
      document.querySelectorAll('.badge-mobile-tip').forEach(e => e.remove());
      const tip = document.createElement('div');
      tip.className = 'badge-mobile-tip';
      tip.textContent = el.dataset.badgeLabel || '';
      tip.style.cssText = 'position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#0e1830;border:1px solid var(--gold);border-radius:6px;padding:5px 8px;font-size:0.65rem;color:#d5e2ff;white-space:nowrap;z-index:99999;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.8);';
      el.style.overflow = 'visible';
      el.appendChild(tip);
      setTimeout(() => { tip.remove(); el.style.overflow = 'hidden'; }, 2500);
    };
    window._copyRefBtn = function(btn) {
      if (typeof _copyRef === 'function') _copyRef(btn, btn.dataset.copyText || '');
    };
    // Dispatcher gaps — funções async que precisam ser acessíveis via data-action
    window.saveNewPassword        = function() { return saveNewPassword(); };
    window.submitFlag             = function(q) { return submitFlag(q); };
    window._pollPremiumActivation = function() { return _pollPremiumActivation(); };
    window.saveAccountData        = function() { return saveAccountData(); };
    window.loadAnalyticsData      = function() { return loadAnalyticsData(); };
    window.adminAddWhitelist      = function() { return adminAddWhitelist(); };

    // ============ DISPATCHER CENTRAL (data-action / data-action-seq) ============
    // Substitui inline onclick="..." em HTML estático e em templates JS
    document.addEventListener('click', function(e) {
      const el = e.target.closest('[data-action], [data-action-seq], [data-close-closest], [data-remove-id]');
      if (!el) return;

      // DOM helpers (podem combinar com data-action para executar depois)
      const closeSel = el.dataset.closeClosest;
      if (closeSel) {
        if (el.dataset.stopPropagation) e.stopPropagation();
        el.closest(closeSel)?.remove();
      }
      const removeId = el.dataset.removeId;
      if (removeId) {
        if (el.dataset.stopPropagation) e.stopPropagation();
        document.getElementById(removeId)?.remove();
      }

      // Sequência de ações: data-action-seq="fn1,fn2"
      const seq = el.dataset.actionSeq;
      if (seq) {
        if (el.dataset.stopPropagation) e.stopPropagation();
        seq.split(',').forEach(fn => {
          const f = window[fn.trim()];
          if (typeof f === 'function') f();
        });
        return;
      }

      // Ação única: data-action="fn"  +  data-arg / data-args / data-pass-event / data-pass-this
      const action = el.dataset.action;
      if (!action) {
        return; // nada mais a fazer (close-closest / remove-id já rodaram)
      }
      if (el.dataset.stopPropagation) e.stopPropagation();

      const fn = window[action];
      if (typeof fn !== 'function') return;

      // data-args='[1,"foo",true]' — múltiplos argumentos via JSON
      if (el.dataset.args !== undefined) {
        try {
          const arr = JSON.parse(el.dataset.args);
          fn.apply(null, Array.isArray(arr) ? arr : [arr]);
        } catch { fn(); }
        return;
      }
      if (el.dataset.passEvent) {
        fn(e);
      } else if (el.dataset.passThis) {
        fn(el);
      } else if (el.dataset.arg !== undefined) {
        // data-arg-type="number" / "boolean" converte o valor
        let v = el.dataset.arg;
        const t = el.dataset.argType;
        if (t === 'number') v = Number(v);
        else if (t === 'boolean') v = v === 'true';
        fn(v);
      } else {
        fn();
      }
    });

    // Bind estático: arquiQ9CloseBtn (handler complexo removido do HTML)
    document.addEventListener('click', function(e) {
      if (e.target.id === 'arquiQ9CloseBtn') {
        const popup = document.getElementById('arquiQ9Popup');
        if (popup) popup.style.display = 'none';
      }
    });

