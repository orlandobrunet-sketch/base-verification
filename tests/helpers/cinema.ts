import { expect, type Page } from '@playwright/test';

/** Device contract, independent of whether the expected presentation mounted. */
export async function desktopCinemaEligible(page: Page) {
  return page.evaluate(() => matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches &&
    !matchMedia('(any-pointer:coarse)').matches && navigator.maxTouchPoints === 0);
}

/** Normal journeys use the desktop preflight; pilot/sandbox and mobile retain native UI. */
export async function characterIntro(page: Page) {
  const normal = await page.evaluate(() => !(window as any).NQPilot?.active &&
    !(typeof (window as any).isProgressSandbox === 'function' && (window as any).isProgressSandbox()));
  const cinematic = normal && await desktopCinemaEligible(page);
  return {
    cinematic,
    overlay: page.locator(cinematic ? '#nqEntryCinema[open]' : '#charIntroOverlay'),
    start: page.locator(cinematic ? '#nqEntryCinema[open] .nq-entry-cinema__skip' : '#charIntroOverlay [data-action="closeIntroAndStart"]'),
    cancel: page.locator(cinematic ? '#nqEntryCinema[open] .nq-entry-cinema__close' : '#charIntroOverlay [data-action="cancelCharacterIntro"]'),
  };
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
export async function finishBossCinema(page: Page) {
  if (await desktopCinemaEligible(page)) {
    const ending = page.locator('#nqVictoryCinema[open]');
    const results = page.locator('#victoryModal');
    const chest = page.locator('#autoChestPopup');
    const loot = page.locator('#chestModal.show');
    const narrative = page.locator('.evolution-popup:visible,.narrative-popup:visible').last();
    for (let attempt = 0; attempt < 12 && !await results.isVisible(); attempt++) {
      await expect.poll(async () => await ending.isVisible() || await results.isVisible() ||
        await chest.isVisible() || await loot.isVisible() || await narrative.isVisible()).toBe(true);
      if (await ending.isVisible()) {
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
      }
    }
    await expect(results).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).NQVictoryBridge.inspection.deliveredCount)).toBe(1);
  }
}
