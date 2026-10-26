import { test, expect, type Page } from '@playwright/test';
import { characterIntro } from '../helpers/cinema';
import { normalBytes, openPilotChoice, pilotState, setupPilotPage } from '../helpers/pilot';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

async function choose(page: Page) {
  await openPilotChoice(page, 'normal');
  await page.locator('#diffConfirmBtn').click();
  await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="glomerulus"]').click();
  const intro = await characterIntro(page);
  await expect(intro.overlay).toBeVisible();
  return intro;
}

async function audio(page: Page) {
  return page.evaluate(() => ({
    owners: (window as any).NQNativeCinemaAudio.inspection.owners,
    preferences: Object.fromEntries(['nefroquest-sound', 'nefroquest-music', 'nefroquest-sfx-vol',
      'nefroquest-music-vol', 'nefroquest-audio-preferences-version'].map(key => [key, localStorage.getItem(key)])),
    musicVolumes: (0, eval)('[wmTrack, bgA, bgB].map(track => track.volume)'),
    sfxVolumes: (0, eval)('Object.values(SFX).map(track => track.volume)'),
  }));
}

test('escolha provisória cancela sem iniciar nem alterar o save em cada dispositivo', async ({ page }) => {
  await setupPilotPage(page, true);
  const before = await normalBytes(page);
  const state = await pilotState(page);
  const intro = await choose(page);
  expect(await normalBytes(page)).toEqual(before);
  expect(await pilotState(page)).toEqual(state);
  if (intro.cinematic) {
    await expect(page.locator('#charIntroOverlay')).toHaveCount(0);
    await expect(intro.overlay).toHaveAttribute('data-stage', 'story');
  } else await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
  await intro.cancel.click();
  await expect(intro.overlay).toBeHidden();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  expect(await normalBytes(page)).toEqual(before);
  expect(await pilotState(page)).toEqual(state);
  expect((await audio(page)).owners).toBe(0);
});

test('filme real inicia mudo; opt-in, pausa, mute e fechamento controlam o gate sem alterar preferências', async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('nefroquest-sound', 'on');
    localStorage.setItem('nefroquest-music', 'on');
    localStorage.setItem('nefroquest-sfx-vol', '0.37');
    localStorage.setItem('nefroquest-music-vol', '0.21');
    localStorage.setItem('nefroquest-audio-preferences-version', '15.91');
  });
  await setupPilotPage(page);
  const preferences = (await audio(page)).preferences;
  const intro = await choose(page);
  if (!intro.cinematic) {
    await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
    await intro.start.click();
    await page.waitForFunction(() => (window as any).state.gameStarted && !!(window as any).state.current);
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
    expect((await audio(page)).owners).toBe(0);
    expect((await audio(page)).preferences).toEqual(preferences);
    return;
  }
  await intro.overlay.locator('.nq-entry-cinema__next').click();
  const video = intro.overlay.locator('video');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState >= 2 && !el.paused)).toBe(true);
  await expect(video).toHaveJSProperty('muted', true);
  expect((await audio(page)).owners).toBe(0);
  const media = await video.evaluate((el: HTMLVideoElement) => ({ source: el.currentSrc, time: el.currentTime,
    expected: new URL((window as any).NQ_ENTRY_CINEMA_CONFIG.entries.glomerulus.media.source, location.href).href }));
  expect(media.source).toBe(media.expected);
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(media.time);
  const committed = await normalBytes(page);
  const sound = intro.overlay.locator('.nq-entry-cinema__sound');
  const play = intro.overlay.locator('.nq-entry-cinema__play');
  const ledger: unknown[] = [];
  const check = async (stage: string, owners: number) => {
    await expect.poll(async () => (await audio(page)).owners).toBe(owners);
    const observed = await audio(page);
    expect(observed.preferences).toEqual(preferences);
    expect(observed.sfxVolumes.every((value: number) => Math.abs(value - (owners ? 0 : .37)) < .000001)).toBe(true);
    if (owners) expect(observed.musicVolumes.every((value: number) => value === 0)).toBe(true);
    ledger.push({ stage, ...observed });
  };
  await sound.click();
  await expect(video).toHaveJSProperty('muted', false);
  await expect(video).toHaveJSProperty('volume', .69);
  await check('opt-in', 1);
  await play.click();
  await expect(video).toHaveJSProperty('paused', true);
  await check('pause', 0);
  await play.click();
  await expect(video).toHaveJSProperty('paused', false);
  await check('resume', 1);
  await sound.click();
  await expect(video).toHaveJSProperty('muted', true);
  await check('mute', 0);
  await sound.click();
  await check('second opt-in', 1);
  await intro.cancel.click();
  await expect(intro.overlay).toBeHidden();
  await expect(page.locator('#nqEntryCinema video')).toHaveCount(0);
  await check('close', 0);
  await expect(page.locator('#mainApp')).toBeVisible();
  expect(await normalBytes(page)).toEqual(committed);
  expect(await pilotState(page)).toMatchObject({ gameStarted: true, character: 'glomerulus', answered: false, correctTotal: 0 });
  await info.attach('cinema-media-and-native-gate', { body: JSON.stringify({ media, ledger,
    evidence: 'Real media element playback and native output gate observations; no acoustic listening claim.' }, null, 2), contentType: 'application/json' });
});
