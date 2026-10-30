import { expect, type Locator, type Page } from '@playwright/test';

/** Device contract, independent of whether the expected presentation mounted. */
export async function desktopCinemaEligible(page: Page) {
  return page.evaluate(() => matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches);
}

/** Selection always opens the explicit native confirmation before any automatic film. */
export async function characterIntro(page: Page) {
  const normal = await page.evaluate(() => !(window as any).NQPilot?.active &&
    !(typeof (window as any).isProgressSandbox === 'function' && (window as any).isProgressSandbox()));
  const confirming = await page.locator('#charIntroOverlay').isVisible();
  const cinematic = !confirming && normal && await desktopCinemaEligible(page);
  return {
    cinematic,
    overlay: page.locator(cinematic ? '#nqEntryCinema[open]' : '#charIntroOverlay'),
    start: page.locator(cinematic ? '#nqEntryCinema[open] .nq-entry-cinema__skip' : '#charIntroOverlay [data-action="closeIntroAndStart"]'),
    cancel: page.locator(cinematic ? '#nqEntryCinema[open] .nq-entry-cinema__close' : '#charIntroOverlay [data-action="cancelCharacterIntro"]'),
  };
}

/** Confirm via the real native control, then dismiss the optional presentation through Escape. */
export async function confirmCharacterStart(page: Page) {
  const intro=await characterIntro(page);
  const normal=await page.evaluate(()=>!(window as any).NQPilot?.active&&
    !(typeof(window as any).isProgressSandbox==='function'&&(window as any).isProgressSandbox()));
  const expectedFilm=normal&&await desktopCinemaEligible(page)&&await page.evaluate(()=>{
    const w=window as any,id=(0,eval)('_lastSelectedCharacter'),config=w.NQ_ENTRY_CINEMA_CONFIG,
      entry=config.entries[id];let owner=null;try{owner=(0,eval)('authUser?.id||null');}catch{}
    return !w.NQEntrySeen.has({owner,place:'hero',character:id,
      version:(entry.narrativeVersion||config.heroVersion)+'-story-v1',domain:'normal'});
  });
  await intro.start.click();
  if(expectedFilm){
    const cinema=page.locator('#nqEntryCinema[open]');
    await expect(cinema).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(cinema).toBeHidden();
  }else if(normal&&await desktopCinemaEligible(page)){
    await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
  }
}

export async function bossPresentation(page: Page) {
  const cinematic = await desktopCinemaEligible(page);
  return {
    cinematic,
    root: page.locator(cinematic ? '#nqBossStatic' : '#nqBossEncounter'),
    image: page.locator(cinematic ? '#nqBossStatic .nq-static-art:not([aria-hidden="true"])' : '#arquiBossImageDesktop'),
    hp: page.locator(cinematic ? '#nqStaticHpTrack' : '#bossHpContainer'),
    fill: page.locator(cinematic ? '#nqStaticHpFill' : '#bossHpFill'),
    stage: page.locator(cinematic ? '#nqStaticStage' : '#bossQuestionNum'),
    stageText: (progress: number) => cinematic ? 'Etapa ' + (progress + 1) + '/10' : 'FASE FINAL ' + (progress + 1) + '/10',
  };
}

/** Walk the desktop ending before asserting the authoritative native results. */
export async function finishBossCinema(page: Page, stopAtFilm = false) {
  if (await desktopCinemaEligible(page)) {
    const ending = page.locator('#nqVictoryCinema[open]');
    const results = page.locator('#victoryModal');
    const chest = page.locator('#autoChestPopup');
    const loot = page.locator('#chestModal.show');
    const narrative = page.locator('.evolution-popup:visible,.narrative-popup:visible').last();
    const native = page.locator('.nq-overlay:visible,[aria-modal="true"]:visible');
    for (let attempt = 0; attempt < 12 && !await results.isVisible(); attempt++) {
      await expect.poll(async () => await ending.isVisible() || await results.isVisible() ||
        await chest.isVisible() || await loot.isVisible() || await narrative.isVisible() || await native.count() > 0).toBe(true);
      if (await ending.isVisible()) {
        if (stopAtFilm) {
          await expect.poll(() => page.evaluate(() => (window as any).NQVictoryCinema.inspection.stage)).toBe('playing');
          return;
        }
        const skip = ending.locator('.nq-victory-cinema__skip');
        if (await skip.isVisible()) await skip.click();
        await ending.waitFor({ state: 'hidden' });
      } else if (await chest.isVisible()) {
        await chest.getByRole('button', { name: 'Abrir baú', exact: true }).click();
        await chest.waitFor({ state: 'detached' });
      } else if (await loot.isVisible()) {
        await loot.getByRole('button').last().click();
      } else if (await narrative.isVisible()) {
        await narrative.getByRole('button').last().click();
      } else {
        const buttons = page.locator('.nq-overlay button,[aria-modal="true"] button');
        const hit = await buttons.evaluateAll(nodes => nodes.map((node, index) => {
          const box = node.getBoundingClientRect(), top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          return box.width && box.height && !node.closest('[hidden],[inert]') && (top === node || node.contains(top)) ? index : -1;
        }).filter(index => index >= 0).at(-1) ?? -1);
        expect(hit, 'native reward must have an exposed control').toBeGreaterThanOrEqual(0);
        await buttons.nth(hit).click();
      }
    }
    await expect(results).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).NQVictoryBridge.inspection.deliveredCount)).toBe(1);
  }
}

/** Walks the character cards with the real control; the film starts after the last one. */
export async function advanceToFilm(dialog: Locator) {
  const next = dialog.getByRole('button', { name: 'Avançar', exact: true });
  await expect(async () => {
    if (await next.isVisible()) await next.click({ timeout: 500 }).catch(() => {});
    await expect(next).toBeHidden({ timeout: 250 });
  }).toPass({ timeout: 20000 });
}
