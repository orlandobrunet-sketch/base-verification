// NefroQuest — Audio preferences and playback. Loaded before game.js.
// Saved preferences never grant permission to start music in a new page session.
const SFX = Object.fromEntries(['correct', 'wrong', 'levelup', 'forge', 'chest', 'streak', 'click', 'boss', 'victory']
  .map(name => [name, new Audio('assets/sounds/' + name + '.mp3')]));
function _audioRead(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
}
function _audioSave(key, value) {
  try { localStorage.setItem(key, String(value)); return true; }
  catch (_) { return false; /* Preferences remain usable in memory. */ }
}
function _audioVolume(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
}
let soundEnabled = _audioRead('nefroquest-sound', 'on') !== 'off';
let musicEnabled = _audioRead('nefroquest-music', 'on') !== 'off';
let sfxVolume = _audioVolume(_audioRead('nefroquest-sfx-vol', '0.5'), 0.5);
let musicVolume = _audioVolume(_audioRead('nefroquest-music-vol', '0.14'), 0.14);
// Before 15.91 the mute button overwrote volume with zero. Migrate that exact
// legacy combination once; zero selected with the new controls stays zero.
const AUDIO_PREFERENCES_VERSION_KEY = 'nefroquest-audio-preferences-version';
const AUDIO_PREFERENCES_VERSION = '15.91';
function _saveAudioPreferencesVersion() {
  if (_audioRead(AUDIO_PREFERENCES_VERSION_KEY, null) !== null) return;
  // A blocked volume write must not leave a marker that disables migration retry.
  const musicSaved = _audioSave('nefroquest-music-vol', musicVolume);
  const sfxSaved = _audioSave('nefroquest-sfx-vol', sfxVolume);
  if (musicSaved && sfxSaved) _audioSave(AUDIO_PREFERENCES_VERSION_KEY, AUDIO_PREFERENCES_VERSION);
}
if (_audioRead(AUDIO_PREFERENCES_VERSION_KEY, null) === null) {
  if (!musicEnabled && musicVolume === 0) {
    musicVolume = 0.14;
  }
  if (!soundEnabled && sfxVolume === 0) {
    sfxVolume = 0.5;
  }
  _saveAudioPreferencesVersion();
}
let MUSIC_VOL = musicVolume;
let WELCOME_MUSIC_VOL = Math.min(1, musicVolume * 1.71);
const wmTrack = new Audio('assets/audio/welcome-theme.mp3');
const bgA = new Audio('assets/sounds/bgmusic.mp3');
const bgB = new Audio('assets/sounds/bgmusic.mp3');
[wmTrack, bgA, bgB].forEach(track => { track.preload = 'none'; track.volume = 0; });
Object.values(SFX).forEach(track => { track.preload = 'none'; track.volume = sfxVolume; });
let welcomeMusicState = 'idle', bgMusicState = 'idle';
let _musicRequested = false;
let _wmRun = 0, _bgRun = 0;
let _wmTimer = null, _wmRaf = null, _bgTimer = null, _bgRaf = null;
let activeTrack = bgA, _crossfading = false;
// Each track has an envelope independent of the user's master volume.
// Updating the slider applies the latest volume immediately, including while
// play() is pending and throughout fade-in, fade-out and crossfade callbacks.
const _musicEnvelopes = new Map([[wmTrack, 0], [bgA, 0], [bgB, 0]]);
function _applyMusicVolume() {
  _musicEnvelopes.forEach((gain, track) => {
    track.volume = _audioVolume(gain * (track === wmTrack ? WELCOME_MUSIC_VOL : MUSIC_VOL), 0);
  });
}
function _setMusicEnvelope(track, gain) {
  _musicEnvelopes.set(track, _audioVolume(gain, 0));
  _applyMusicVolume();
}
function transitionWelcomeMusic(value) { welcomeMusicState = value; updateAudioIcons(); }
function transitionBgMusic(value) { bgMusicState = value; updateAudioIcons(); }
Object.defineProperty(window, 'welcomeMusicStarted', {
  configurable: true, get: () => ['starting', 'playing'].includes(welcomeMusicState),
  set: value => { if (!value) stopWelcomeMusic(false); }
});
Object.defineProperty(window, 'musicStarted', {
  configurable: true, get: () => ['starting', 'playing'].includes(bgMusicState),
  set: value => { if (!value) stopBgMusic(); }
});
function _musicAllowed() { return musicEnabled && _musicRequested; }
function _fadeTrack(track, duration, envelopeAt, valid, done, kind) {
  const started = performance.now();
  const tick = () => {
    if (!valid()) return;
    const progress = Math.min(1, (performance.now() - started) / duration);
    _setMusicEnvelope(track, envelopeAt(progress));
    if (progress === 1) {
      if (kind === 'welcome') _wmRaf = null; else _bgRaf = null;
      if (done) done();
    }
    else if (kind === 'welcome') _wmRaf = requestAnimationFrame(tick);
    else _bgRaf = requestAnimationFrame(tick);
  };
  tick();
}
function _welcomeLoop(run) {
  if (run !== _wmRun || !_musicAllowed()) return;
  const duration = wmTrack.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    _wmTimer = setTimeout(() => _welcomeLoop(run), 250);
    return;
  }
  const remaining = Math.max(0, (duration - wmTrack.currentTime) * 1000);
  const fadeDuration = Math.min(4000, remaining);
  _wmTimer = setTimeout(() => {
    const from = _musicEnvelopes.get(wmTrack);
    _fadeTrack(wmTrack, Math.max(1, fadeDuration), progress => from * (1 - progress),
      () => run === _wmRun && _musicAllowed(), () => {
        wmTrack.pause();
        _wmTimer = setTimeout(() => {
          if (run !== _wmRun || !_musicAllowed()) return;
          transitionWelcomeMusic('paused');
          startWelcomeMusic();
        }, 800);
      }, 'welcome');
  }, Math.max(0, remaining - fadeDuration));
}
function startWelcomeMusic(_fromUserGesture = false) {
  if (!_musicAllowed() || welcomeMusicStarted) return;
  stopBgMusic();
  const run = ++_wmRun;
  clearTimeout(_wmTimer); cancelAnimationFrame(_wmRaf);
  wmTrack.currentTime = 0; _setMusicEnvelope(wmTrack, 0); wmTrack.muted = false;
  transitionWelcomeMusic('starting');
  wmTrack.play().then(() => {
    if (run !== _wmRun || !_musicAllowed()) return;
    _applyMusicVolume();
    transitionWelcomeMusic('playing');
    _fadeTrack(wmTrack, 3500, progress => Math.sqrt(progress),
      () => run === _wmRun && _musicAllowed(), () => _welcomeLoop(run), 'welcome');
  }).catch(() => { if (run === _wmRun) transitionWelcomeMusic('failed'); });
}
function stopWelcomeMusic(_withFade = false, onComplete) {
  ++_wmRun; clearTimeout(_wmTimer); cancelAnimationFrame(_wmRaf);
  wmTrack.pause(); _setMusicEnvelope(wmTrack, 0);
  transitionWelcomeMusic('stopped');
  if (typeof onComplete === 'function') onComplete();
}
function _scheduleBg(run) {
  clearTimeout(_bgTimer);
  if (run !== _bgRun || !_musicAllowed()) return;
  const remaining = activeTrack.duration - activeTrack.currentTime;
  if (Number.isFinite(remaining) && remaining > 0 && remaining <= 1.5) {
    _crossfadeBg(run); return;
  }
  _bgTimer = setTimeout(() => _scheduleBg(run), 200);
}
function _crossfadeBg(run) {
  if (_crossfading || run !== _bgRun || !_musicAllowed()) return;
  _crossfading = true;
  const previous = activeTrack, next = previous === bgA ? bgB : bgA;
  next.currentTime = 0; _setMusicEnvelope(next, 0); next.muted = false;
  next.play().then(() => {
    if (run !== _bgRun || !_musicAllowed()) return;
    _applyMusicVolume();
    const started = performance.now();
    const tick = () => {
      if (run !== _bgRun || !_musicAllowed()) return;
      const progress = Math.min(1, (performance.now() - started) / 1500);
      _musicEnvelopes.set(previous, Math.cos(progress * Math.PI / 2));
      _musicEnvelopes.set(next, Math.sin(progress * Math.PI / 2));
      _applyMusicVolume();
      if (progress === 1) {
        previous.pause(); _setMusicEnvelope(previous, 0); activeTrack = next; _crossfading = false;
        _scheduleBg(run);
      } else _bgRaf = requestAnimationFrame(tick);
    };
    tick();
  }).catch(() => {
    if (run !== _bgRun) return;
    _crossfading = false;
    // Keep the current track; ended retries only within a session requested by the user.
  });
}
[bgA, bgB].forEach(track => track.addEventListener('ended', () => {
  if (!_musicAllowed() || track !== activeTrack || _crossfading) return;
  transitionBgMusic('paused'); startBgMusic();
}));
wmTrack.addEventListener('ended', () => {
  if (!_musicAllowed() || welcomeMusicState !== 'playing') return;
  clearTimeout(_wmTimer); cancelAnimationFrame(_wmRaf);
  transitionWelcomeMusic('paused'); startWelcomeMusic();
});
function startBgMusic() {
  if (!_musicAllowed() || musicStarted) return;
  stopWelcomeMusic(false);
  const run = ++_bgRun;
  clearTimeout(_bgTimer); cancelAnimationFrame(_bgRaf);
  activeTrack = bgA; _crossfading = false;
  bgA.currentTime = 0; _setMusicEnvelope(bgA, 1); bgA.muted = false;
  transitionBgMusic('starting');
  bgA.play().then(() => {
    if (run !== _bgRun || !_musicAllowed()) return;
    _applyMusicVolume();
    transitionBgMusic('playing'); _scheduleBg(run);
  }).catch(() => { if (run === _bgRun) transitionBgMusic('failed'); });
}
function stopBgMusic() {
  ++_bgRun; clearTimeout(_bgTimer); cancelAnimationFrame(_bgRaf); _crossfading = false;
  [bgA, bgB].forEach(track => { track.pause(); _musicEnvelopes.set(track, 0); });
  _applyMusicVolume();
  transitionBgMusic('stopped');
}
function playSound(name) {
  if (!soundEnabled || !SFX[name] || sfxVolume === 0) return;
  SFX[name].currentTime = 0; SFX[name].volume = sfxVolume;
  SFX[name].play().catch(() => {});
}
function setMusicVolume(value) {
  musicVolume = _audioVolume(value, musicVolume);
  MUSIC_VOL = musicVolume; WELCOME_MUSIC_VOL = Math.min(1, musicVolume * 1.71);
  _audioSave('nefroquest-music-vol', musicVolume); _saveAudioPreferencesVersion();
  _applyMusicVolume();
  updateAudioIcons();
}
function setSfxVolume(value) {
  sfxVolume = _audioVolume(value, sfxVolume); _audioSave('nefroquest-sfx-vol', sfxVolume); _saveAudioPreferencesVersion();
  Object.values(SFX).forEach(track => { track.volume = sfxVolume; });
  updateAudioIcons();
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  _audioSave('nefroquest-sound', soundEnabled ? 'on' : 'off'); _saveAudioPreferencesVersion();
  if (!soundEnabled) Object.values(SFX).forEach(track => track.pause());
  updateAudioIcons();
}
function toggleMusic() {
  const failed = welcomeMusicState === 'failed' || bgMusicState === 'failed';
  if (!_musicRequested || failed) {
    musicEnabled = true; _musicRequested = true; _audioSave('nefroquest-music', 'on'); _saveAudioPreferencesVersion();
    const welcome = document.getElementById('welcomeScreen');
    const game = document.getElementById('mainApp');
    if (game && !game.classList.contains('hidden') && welcome?.classList.contains('hidden')) startBgMusic();
    else startWelcomeMusic(true);
  } else {
    musicEnabled = false; _musicRequested = false; _audioSave('nefroquest-music', 'off'); _saveAudioPreferencesVersion();
    stopWelcomeMusic(false); stopBgMusic();
  }
  updateAudioIcons();
}
function updateAudioIcons() {
  const active = _musicAllowed();
  const musicFailed = welcomeMusicState === 'failed' || bgMusicState === 'failed';
  document.querySelectorAll('[data-action="toggleMusic"]').forEach(button => {
    button.setAttribute('aria-pressed', String(active && !musicFailed));
    button.setAttribute('aria-label', (active && !musicFailed ? 'Pausar' : 'Reproduzir') + ' música');
  });
  document.querySelectorAll('[data-action="toggleSound"]').forEach(button => {
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.setAttribute('aria-label', soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros');
  });
  ['musicIcon', 'mobileMusIcon', 'welcomeMusicIcon', 'mobileSoundMusicIcon', 'lndMusicIcon'].forEach(id => {
    const icon = document.getElementById(id); if (icon) icon.textContent = active && musicVolume > 0 ? '♪' : '♩';
  });
  ['soundIcon', 'welcomeSoundIcon', 'mobileSoundSfxIcon', 'lndSfxIcon'].forEach(id => {
    const icon = document.getElementById(id); if (icon) icon.textContent = soundEnabled && sfxVolume > 0 ? '◖' : '◌';
  });
  document.querySelectorAll('.music-vol').forEach(slider => { slider.value = String(musicVolume); });
  document.querySelectorAll('.sfx-vol').forEach(slider => { slider.value = String(sfxVolume); });
  document.querySelectorAll('[data-audio-value="music"]').forEach(output => { output.textContent = Math.round(musicVolume * 100) + '%'; });
  document.querySelectorAll('[data-audio-value="sfx"]').forEach(output => { output.textContent = Math.round(sfxVolume * 100) + '%'; });
  document.querySelectorAll('[data-audio-state="music"]').forEach(output => {
    output.textContent = musicFailed ? 'Indisponível · tente novamente' : active ? 'Ativada nesta sessão' : 'Pausada · toque para reproduzir';
  });
  document.querySelectorAll('[data-audio-state="sfx"]').forEach(output => { output.textContent = soundEnabled ? 'Ativados' : 'Desativados'; });
}
function _closeAudioControls(restoreFocus = false) {
  document.querySelectorAll('.nq-audio-controls').forEach(wrapper => {
    const button = wrapper.querySelector('.nq-audio-button'), panel = wrapper.querySelector('.nq-audio-panel');
    if (!panel || panel.hidden) return;
    panel.hidden = true; button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus({ preventScroll: true });
  });
}
function _initAudioControls() {
  const contexts = [
    ['mobileSoundControls', 'mobileSoundMusicIcon', 'mobileSoundSfxIcon'],
    ['welcomeSoundControls', 'welcomeMusicIcon', 'welcomeSoundIcon'],
    ['soundControlsBar', 'musicIcon', 'soundIcon'],
    ['lndSoundControls', 'lndMusicIcon', 'lndSfxIcon']
  ];
  contexts.forEach(([hostId, musicIcon, soundIcon]) => {
    const host = document.getElementById(hostId); if (!host) return;
    host.querySelectorAll('.volume-slider-container, .lnd-sound-btn').forEach(old => old.remove());
    // Landing controls predate slider containers.
    host.querySelectorAll(':scope > [data-action="toggleMusic"], :scope > [data-action="toggleSound"]').forEach(old => old.remove());
    const wrapper = document.createElement('div'); wrapper.className = 'nq-audio-controls'; wrapper.dataset.nqUi = 'lumen';
    const panelId = hostId + 'AudioPanel';
    wrapper.innerHTML = '<button type="button" class="nq-audio-button" aria-label="Preferências de áudio" aria-expanded="false" aria-controls="' + panelId + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4 6 8H3v8h3l5 4V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg></button>' +
      '<div class="nq-audio-panel" id="' + panelId + '" role="region" aria-label="Preferências de áudio" hidden>' +
      '<div class="nq-audio-heading"><strong>Áudio</strong><button type="button" class="nq-audio-close" aria-label="Fechar preferências de áudio">×</button></div>' +
      '<div class="nq-audio-row"><button type="button" class="nq-audio-toggle"' + (hostId === 'soundControlsBar' ? ' id="musicToggle"' : '') + ' data-action="toggleMusic"><span id="' + musicIcon + '" aria-hidden="true">♪</span><span>Música</span><span class="nq-audio-switch" aria-hidden="true"></span></button><span class="nq-audio-state" data-audio-state="music"></span>' +
      '<label class="nq-audio-volume" for="' + panelId + 'Music">Volume da música <output data-audio-value="music"></output></label><input id="' + panelId + 'Music" type="range" class="nq-audio-range music-vol" min="0" max="1" step="0.01" aria-label="Volume da música"></div>' +
      '<div class="nq-audio-row"><button type="button" class="nq-audio-toggle"' + (hostId === 'soundControlsBar' ? ' id="soundToggle"' : '') + ' data-action="toggleSound"><span id="' + soundIcon + '" aria-hidden="true">◖</span><span>Efeitos</span><span class="nq-audio-switch" aria-hidden="true"></span></button><span class="nq-audio-state" data-audio-state="sfx"></span>' +
      '<label class="nq-audio-volume" for="' + panelId + 'Sfx">Volume dos efeitos <output data-audio-value="sfx"></output></label><input id="' + panelId + 'Sfx" type="range" class="nq-audio-range sfx-vol" min="0" max="1" step="0.01" aria-label="Volume dos efeitos"></div>' +
      '<p class="nq-audio-note">Volume salvo. A música começa quando você toca em reproduzir.</p></div>';
    host.prepend(wrapper);
    const button = wrapper.querySelector('.nq-audio-button'), panel = wrapper.querySelector('.nq-audio-panel');
    button.addEventListener('click', () => {
      const opening = panel.hidden; _closeAudioControls();
      if (opening) {
        document.dispatchEvent(new CustomEvent('nq:header-open', { detail: { kind: 'audio', owner: wrapper } }));
        panel.hidden = false; button.setAttribute('aria-expanded', 'true');
      }
    });
    wrapper.querySelector('.nq-audio-close').addEventListener('click', () => _closeAudioControls(true));
  });
  updateAudioIcons();
}
document.addEventListener('input', event => {
  const slider = event.target;
  if (!(slider instanceof HTMLInputElement) || !slider.matches('.nq-audio-range')) return;
  if (slider.classList.contains('music-vol')) setMusicVolume(slider.value);
  else if (slider.classList.contains('sfx-vol')) setSfxVolume(slider.value);
});
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.nq-audio-controls')) _closeAudioControls();
});
document.addEventListener('focusin', event => {
  if (!event.target.closest('.nq-audio-controls')) _closeAudioControls();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !document.querySelector('.nq-audio-panel:not([hidden])')) return;
  event.preventDefault(); event.stopImmediatePropagation(); _closeAudioControls(true);
}, true);
document.addEventListener('nq:header-open', event => {
  if (event.detail?.kind !== 'audio') _closeAudioControls();
});
// No load/canplay/first-click/visibility handler starts music.
_initAudioControls();
Object.assign(window, { setMusicVolume, setSfxVolume, toggleSound, toggleMusic, updateAudioIcons, playSound,
  startWelcomeMusic, stopWelcomeMusic, startBgMusic, stopBgMusic });
