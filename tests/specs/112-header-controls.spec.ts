import { test, expect, type Page } from '@playwright/test';

async function prepare(page: Page, preferences: Record<string, string> = {}, blockWrites = false) {
  await page.addInitScript(({ preferences, blockWrites }) => {
    // Media calls are observable without producing sound or fetching audio.
    (window as any).__nqMediaCalls = [];
    (window as any).__nqAudioElements = [];
    const OriginalAudio = window.Audio;
    (window as any).Audio = function(src?: string) {
      const track = new OriginalAudio(src);
      (window as any).__nqAudioElements.push(track);
      return track;
    };
    const paused = new WeakMap<HTMLMediaElement, boolean>();
    const positions = new WeakMap<HTMLMediaElement, number>();
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true, get() { return positions.get(this) ?? 0; },
      set(value: number) { positions.set(this, value); }
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get() { return paused.get(this) ?? true; } });
    Object.defineProperty(HTMLMediaElement.prototype, 'duration', { configurable: true, get() { return (this as any).__nqDuration ?? 180; } });
    HTMLMediaElement.prototype.play = function() {
      (window as any).__nqMediaCalls.push(this.src);
      paused.set(this, false);
      if ((window as any).__nqDeferMedia) {
        return new Promise<void>(resolve => { (window as any).__nqResolveMedia = resolve; });
      }
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function() { paused.set(this, true); };
    if (!localStorage.getItem('nq_header_test_seed')) {
      localStorage.setItem('nq_header_test_seed', '1');
      localStorage.setItem('nefroquest-music', 'on');
      localStorage.setItem('nefroquest-music-vol', '0.65');
      localStorage.setItem('nefroquest-sound', 'on');
      localStorage.setItem('nefroquest-sfx-vol', '0.4');
      for (const [key, value] of Object.entries(preferences)) localStorage.setItem(key, value);
    }
    if (blockWrites) {
      Object.defineProperty(Storage.prototype, 'setItem', {
        configurable: true, value() { throw new DOMException('Blocked for this test', 'SecurityError'); }
      });
    }
  }, { preferences, blockWrites });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
  await page.evaluate(() => (window as any).playAsGuest());
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}
// Deterministic media clock, installed only after the app and guest UI loaded.
// Tests drive real input events while fake media/RAF/timers expose transition races.
async function mediaClock(page: Page) {
  await page.evaluate(() => {
    let now = performance.now(), sequence = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const timers = new Map<number, { callback: () => void; at: number }>();
    Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
    window.requestAnimationFrame = callback => { const id = ++sequence; frames.set(id, callback); return id; };
    window.cancelAnimationFrame = id => { frames.delete(id); };
    (window as any).setTimeout = (callback: () => void, delay = 0) => {
      const id = ++sequence; timers.set(id, { callback, at: now + delay }); return id;
    };
    window.clearTimeout = id => { timers.delete(id); };
    (window as any).__nqAdvanceMedia = (milliseconds: number) => {
      const target = now + milliseconds;
      while (now < target) {
        const step = Math.min(50, target - now);
        now += step;
        for (const track of (window as any).__nqAudioElements as HTMLAudioElement[]) {
          if (!track.paused) track.currentTime += step / 1000;
        }
        for (const [id, timer] of [...timers]) {
          if (timer.at <= now) { timers.delete(id); timer.callback(); }
        }
        const callbacks = [...frames.values()]; frames.clear();
        callbacks.forEach(callback => callback(now));
      }
    };
  });
}
async function setMusicInput(page: Page, value: string) {
  await page.locator('#welcomeSoundControlsAudioPanel .music-vol').evaluate((input, value) => {
    (input as HTMLInputElement).value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
async function allMusicVolumes(page: Page) {
  return page.evaluate(() => ((window as any).__nqAudioElements as HTMLAudioElement[])
    .filter(track => /welcome-theme|bgmusic/.test(track.src)).map(track => track.volume));
}

const audioButton = (page: Page) => page.locator('#welcomeSoundControls .nq-audio-button');
const audioPanel = (page: Page) => page.locator('#welcomeSoundControlsAudioPanel');
const menuButton = (page: Page) => page.locator('#welcomeProfileBtn');

test.describe('Preferências de áudio e menu compacto', () => {
  test('preferência salva, carga, metadados, foco e cliques comuns não iniciam música', async ({ page }) => {
    await prepare(page);
    await expect.poll(() => page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(0);
    await audioButton(page).click();
    await expect(audioPanel(page)).toBeVisible();
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0.65');
    await expect(audioPanel(page).locator('.sfx-vol')).toHaveValue('0.4');
    await page.evaluate(() => {
      (window as any).startWelcomeMusic(true);
      (window as any).startBgMusic();
      document.dispatchEvent(new Event('visibilitychange'));
      for (const track of (window as any).__nqAudioElements) {
        track.dispatchEvent(new Event('canplay'));
        track.dispatchEvent(new Event('canplaythrough'));
      }
      document.body.dispatchEvent(new Event('touchstart', { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect.poll(() => page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(0);
    await expect(audioPanel(page).getByRole('button', { name: 'Reproduzir música' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('mute preserva volume de música e efeitos e o reload continua silencioso', async ({ page }) => {
    await prepare(page);
    await audioButton(page).click();
    await audioPanel(page).getByRole('button', { name: 'Reproduzir música' }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(1);
    await audioPanel(page).getByRole('button', { name: 'Pausar música' }).click();
    await audioPanel(page).getByRole('button', { name: 'Desativar efeitos sonoros' }).click();
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0.65');
    await expect(audioPanel(page).locator('.sfx-vol')).toHaveValue('0.4');
    expect(await page.evaluate(() => ({
      music: localStorage.getItem('nefroquest-music'), musicVol: localStorage.getItem('nefroquest-music-vol'),
      sound: localStorage.getItem('nefroquest-sound'), soundVol: localStorage.getItem('nefroquest-sfx-vol')
    }))).toEqual({ music: 'off', musicVol: '0.65', sound: 'off', soundVol: '0.4' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
    await page.evaluate(() => (window as any).playAsGuest());
    await audioButton(page).click();
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0.65');
    await expect(audioPanel(page).locator('.sfx-vol')).toHaveValue('0.4');
    expect(await page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(0);
  });

  test('um play pendente não reativa música depois de pausar', async ({ page }) => {
    await prepare(page);
    await audioButton(page).click();
    await page.evaluate(() => { (window as any).__nqDeferMedia = true; });
    await audioPanel(page).getByRole('button', { name: 'Reproduzir música' }).click();
    await audioPanel(page).getByRole('button', { name: 'Pausar música' }).click();
    await page.evaluate(() => { (window as any).__nqResolveMedia(); });
    await expect(audioPanel(page).getByRole('button', { name: 'Reproduzir música' })).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => (window as any).__nqAudioElements
      .filter((track: HTMLAudioElement) => /welcome-theme|bgmusic/.test(track.src))
      .every((track: HTMLAudioElement) => track.paused))).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('nefroquest-music'))).toBe('off');
  });

  test('volume zero aplica antes e depois da resolução do play de fundo', async ({ page }) => {
    await prepare(page);
    await audioButton(page).click();
    await page.evaluate(() => {
      (window as any).__nqDeferMedia = true;
      document.getElementById('welcomeScreen')!.classList.add('hidden');
      document.getElementById('mainApp')!.classList.remove('hidden');
      (window as any).toggleMusic();
      (window as any).setMusicVolume(0);
    });
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
    await page.evaluate(() => { (window as any).__nqResolveMedia(); });
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
    expect(await page.evaluate(() => localStorage.getItem('nefroquest-music-vol'))).toBe('0');
  });

  test('slider zero silencia fade-in imediatamente e permanece zero no próximo RAF', async ({ page }) => {
    await prepare(page);
    await audioButton(page).click();
    await mediaClock(page);
    await page.evaluate(() => {
      (document.querySelector('#welcomeSoundControlsAudioPanel [data-action="toggleMusic"]') as HTMLButtonElement).click();
    });
    await page.evaluate(() => { (window as any).__nqAdvanceMedia(1000); });
    expect((await allMusicVolumes(page))[0]).toBeGreaterThan(0);
    await setMusicInput(page, '0');
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
    await page.evaluate(() => { (window as any).__nqAdvanceMedia(100); });
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
  });

  test('slider zero silencia imediatamente o fade-out e continua zero no próximo RAF', async ({ page }) => {
    await prepare(page);
    await audioButton(page).click();
    await mediaClock(page);
    await page.evaluate(() => {
      const track = (window as any).__nqAudioElements.find((track: HTMLAudioElement) => /welcome-theme/.test(track.src));
      track.__nqDuration = 20;
      (document.querySelector('#welcomeSoundControlsAudioPanel [data-action="toggleMusic"]') as HTMLButtonElement).click();
    });
    await page.evaluate(() => { (window as any).__nqAdvanceMedia(18000); });
    const fadingVolume = (await allMusicVolumes(page))[0];
    expect(fadingVolume).toBeGreaterThan(0);
    expect(fadingVolume).toBeLessThan(1);
    await setMusicInput(page, '0');
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
    await page.evaluate(() => { (window as any).__nqAdvanceMedia(200); });
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
  });

  test('slider zero silencia os dois buffers durante crossfade', async ({ page }) => {
    await prepare(page);
    await audioButton(page).click();
    await mediaClock(page);
    await page.evaluate(() => {
      for (const track of (window as any).__nqAudioElements) track.__nqDuration = 20;
      document.getElementById('welcomeScreen')!.classList.add('hidden');
      document.getElementById('mainApp')!.classList.remove('hidden');
      (window as any).toggleMusic();
    });
    await page.evaluate(() => { (window as any).__nqAdvanceMedia(18600); });
    await page.evaluate(() => { (window as any).__nqAdvanceMedia(200); });
    const playing = await page.evaluate(() => ((window as any).__nqAudioElements as HTMLAudioElement[])
      .filter(track => /bgmusic/.test(track.src)).filter(track => !track.paused).length);
    expect(playing).toBe(2);
    await page.evaluate(() => (window as any).setMusicVolume(0));
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
    await page.evaluate(() => { (window as any).__nqAdvanceMedia(200); });
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
  });

  test('mute legado off+zero recupera volume sem ativar som e permite reprodução explícita', async ({ page }) => {
    await prepare(page, {
      'nefroquest-music': 'off', 'nefroquest-music-vol': '0',
      'nefroquest-sound': 'off', 'nefroquest-sfx-vol': '0'
    });
    await audioButton(page).click();
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0.14');
    await expect(audioPanel(page).locator('.sfx-vol')).toHaveValue('0.5');
    expect(await page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(0);
    expect(await page.evaluate(() => [
      localStorage.getItem('nefroquest-music'), localStorage.getItem('nefroquest-sound'),
      localStorage.getItem('nefroquest-audio-preferences-version')
    ])).toEqual(['off', 'off', '15.91']);
    await audioPanel(page).getByRole('button', { name: 'Reproduzir música' }).click();
    await expect.poll(async () => (await allMusicVolumes(page))[0]).toBeGreaterThan(0);
    await audioPanel(page).getByRole('button', { name: 'Ativar efeitos sonoros' }).click();
    await page.evaluate(() => (window as any).playSound('correct'));
    expect(await page.evaluate(() => ((window as any).__nqAudioElements as HTMLAudioElement[])
      .find(track => /correct\.mp3/.test(track.src))!.volume)).toBe(0.5);
  });

  test('zero explícito da nova versão sobrevive mute, ativação e reload', async ({ page }) => {
    await prepare(page, {
      'nefroquest-music': 'off', 'nefroquest-music-vol': '0',
      'nefroquest-sound': 'off', 'nefroquest-sfx-vol': '0',
      'nefroquest-audio-preferences-version': '15.91'
    });
    await audioButton(page).click();
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0');
    await expect(audioPanel(page).locator('.sfx-vol')).toHaveValue('0');
    await audioPanel(page).getByRole('button', { name: 'Reproduzir música' }).click();
    expect(await allMusicVolumes(page)).toEqual([0, 0, 0]);
    await audioPanel(page).getByRole('button', { name: 'Pausar música' }).click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
    await page.evaluate(() => (window as any).playAsGuest());
    await audioButton(page).click();
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0');
    await expect(audioPanel(page).locator('.sfx-vol')).toHaveValue('0');
    expect(await page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(0);
  });

  test('gravação bloqueada mantém controles utilizáveis e não confirma migração incompleta', async ({ page }) => {
    await prepare(page, {
      'nefroquest-music': 'off', 'nefroquest-music-vol': '0',
      'nefroquest-sound': 'off', 'nefroquest-sfx-vol': '0'
    }, true);
    await audioButton(page).click();
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0.14');
    await expect(audioPanel(page).locator('.sfx-vol')).toHaveValue('0.5');
    expect(await page.evaluate(() => localStorage.getItem('nefroquest-audio-preferences-version'))).toBeNull();
    await audioPanel(page).locator('.music-vol').focus();
    await page.keyboard.press('ArrowRight');
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0.15');
    expect(await page.evaluate(() => localStorage.getItem('nefroquest-audio-preferences-version'))).toBeNull();
    expect(await page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(0);
  });

  test('teclado abre o áudio, alcança slider e Escape devolve foco', async ({ page }) => {
    await prepare(page);
    await audioButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(audioButton(page)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab'); // close
    await page.keyboard.press('Tab'); // music toggle
    await page.keyboard.press('Tab'); // music range
    await expect(audioPanel(page).locator('.music-vol')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(audioPanel(page).locator('.music-vol')).toHaveValue('0.66');
    await expect(audioPanel(page).locator('[data-audio-value="music"]')).toHaveText('66%');
    await page.keyboard.press('Escape');
    await expect(audioPanel(page)).toBeHidden();
    await expect(audioButton(page)).toBeFocused();
    await expect(audioButton(page)).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => (window as any).__nqMediaCalls.length)).toBe(0);
  });

  test('visitante vê conta/preferências, todas as ações admin continuam inacessíveis', async ({ page }) => {
    await prepare(page);
    await menuButton(page).click();
    const menu = page.locator('#welcomeProfilePopup');
    await expect(menu).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('group', { name: 'Conta', exact: true })).toBeVisible();
    await expect(menu.getByRole('group', { name: 'Preferências', exact: true })).toBeVisible();
    await expect(menu.locator('.admin-item')).toHaveCount(6);
    for (const item of await menu.locator('.admin-item').all()) await expect(item).toBeHidden();
    await expect(menu.locator('.profile-popup-admin-group')).toBeHidden();
    // Check presence only; do not invoke any admin or logout action.
    await expect(menu.locator('[data-action="authLogout"]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(menuButton(page)).toBeFocused();
  });

  test('foco fora e abertura de outro controle fecham o menu sem roubar foco', async ({ page }) => {
    await prepare(page);
    const menu = page.locator('#welcomeProfilePopup');
    await menuButton(page).click();
    await audioButton(page).focus();
    await expect(menu).toBeHidden();
    await expect(audioButton(page)).toBeFocused();
    await audioButton(page).click();
    await expect(audioPanel(page)).toBeVisible();
    await menuButton(page).click();
    await expect(audioPanel(page)).toBeHidden();
    await expect(menu).toBeVisible();
    await page.locator('#welcomeScreen .nql-brand').click({ trial: true });
    await page.mouse.click(8, 200);
    await expect(menu).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('controle por toque mantém sliders e toggles separados e dentro da tela', async ({ page, isMobile }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await prepare(page);
    if (isMobile) await audioButton(page).tap(); else await audioButton(page).click();
    const panel = audioPanel(page);
    await expect(panel).toBeVisible();
    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.x).toBeGreaterThanOrEqual(0);
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(375);
    for (const row of await panel.locator('.nq-audio-row').all()) {
      const toggleBox = await row.locator('button').boundingBox();
      const rangeBox = await row.locator('input[type="range"]').boundingBox();
      expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
      expect(rangeBox!.height).toBeGreaterThanOrEqual(44);
      expect(rangeBox!.y).toBeGreaterThanOrEqual(toggleBox!.y + toggleBox!.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376);
  });
});
