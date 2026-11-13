import {test, expect, type Page, type TestInfo} from '@playwright/test';
import {confirmCharacterStart} from '../helpers/cinema';

// Native Guest actions against the actual published bank and revision catalog.
// The only fixture is the persisted reading preference; no controller is replaced.
const observations = new WeakMap<Page, {errors: string[]; nonGet: string[]}>();
test.setTimeout(90000);

async function fonts(page: Page) {
  const loaded = await page.evaluate(async () => {
    const body = await document.fonts.load('400 16px "Source Sans 3"');
    const heading = await document.fonts.load('600 24px "Alegreya"');
    await document.fonts.ready;
    return {body: body.filter(face => face.status === 'loaded').map(face => face.family.replaceAll('"', '')),
      heading: heading.filter(face => face.status === 'loaded').map(face => face.family.replaceAll('"', ''))};
  });
  expect(loaded.body, 'Geometry and screenshots require the real body font').toContain('Source Sans 3');
  expect(loaded.heading, 'Screenshots require the real heading font').toContain('Alegreya');
}

async function prepare(page: Page, info: TestInfo, reading: boolean) {
  await page.setViewportSize(info.project.name === 'mobile' ? {width: 390, height: 844} : {width: 1280, height: 800});
  await page.goto('/jogar/', {waitUntil: 'domcontentloaded'});
  await page.locator('[data-portal-route="guest"]').click();
  if (await page.locator('#identityOverlay').isVisible())
    await page.locator('[data-action="_pickIdentity"][data-arg="combat"]').click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
  await page.waitForFunction(() => typeof (window as any)._loadTopics === 'function');
  await page.evaluate(() => (window as any)._loadTopics());
  await page.waitForFunction(() => (window as any).questionBank?.length === 741 && !!(window as any).questionRevisionCatalog);
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  expect(await page.evaluate(() => document.body.classList.contains('reading-mode'))).toBe(reading);
  await fonts(page);
}
async function startCampaign(page: Page) {
  await page.locator('#welcomeScreen [data-action="startNewFromWelcome"]').click();
  await page.locator('.difficulty-card[data-diff-key="normal"]').click();
  await page.locator('#diffConfirmBtn').click();
  await page.locator('#charSelectModal [data-action="selectCharacter"][data-arg="nephros"]').click();
  await confirmCharacterStart(page);
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
  await expect(page.locator('#options .option:enabled')).toHaveCount(4);
}
async function startStudy(page: Page) {
  await page.locator('[data-atrium-route="modes"]').click();
  await page.locator('[data-mode-route="study"]:visible').click();
  await page.getByRole('button', {name: 'Iniciar estudo livre', exact: true}).click();
  await expect(page.locator('#studyOptions button:enabled')).toHaveCount(4);
}

async function beginProbe(page: Page, study: boolean) {
  await page.evaluate(study => {
    const w = window as any;
    const group = document.querySelector(study ? '#studyOptions' : '#options')!;
    const parent = document.querySelector(study ? '#studyQuestionArea' : '#mainApp .panel.right')!;
    const buttons = [...group.querySelectorAll<HTMLElement>(study ? '.study-option-btn' : '.option')];
    const sample = () => {
      const g = group.getBoundingClientRect(), p = parent.getBoundingClientRect();
      return {groupX: g.left - p.left, groupWidth: g.width,
        buttons: buttons.map(button => { const b = button.getBoundingClientRect(); return {
          x: b.left - g.left, y: b.top - g.top, width: b.width, height: b.height,
        }; }),
        geometryAnimations: group.getAnimations({subtree: true}).flatMap(animation => {
          const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() || [];
          return frames.flatMap(frame => ['transform', 'translate', 'scale', 'rotate', 'width', 'height', 'padding', 'margin']
            .filter(key => Object.hasOwn(frame, key)));
        })};
    };
    const report = w.__readingGeometry = {before: sample(), samples: [] as any[], done: false};
    let answeredAt: number | null = null;
    const frame = (time: number) => {
      if (!group.isConnected) { report.done = true; return; }
      if (group.querySelector(study ? '.is-wrong' : '.wrong')) {
        answeredAt ??= time;
        report.samples.push(sample());
      }
      if (answeredAt !== null && time - answeredAt >= 480) report.done = true;
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, study);
}
async function assertStable(page: Page, info: TestInfo, name: string) {
  await page.waitForFunction(() => (window as any).__readingGeometry?.done);
  const report = await page.evaluate(() => (window as any).__readingGeometry);
  expect(report.samples.length, 'Sample the native wrong-answer frames, not only the settled end state').toBeGreaterThan(2);
  for (const sample of report.samples) {
    expect(Math.abs(sample.groupX - report.before.groupX)).toBeLessThanOrEqual(.75);
    expect(Math.abs(sample.groupWidth - report.before.groupWidth)).toBeLessThanOrEqual(.75);
    expect(sample.geometryAnimations).toEqual([]);
    for (let index = 0; index < sample.buttons.length; index++) {
      for (const key of ['x', 'y', 'width', 'height'])
        expect(Math.abs(sample.buttons[index][key] - report.before.buttons[index][key]), `Alternative ${index + 1}: ${key}`).toBeLessThanOrEqual(.75);
    }
  }
  await info.attach(name, {contentType: 'application/json', body: JSON.stringify(report)});
}
async function snapshot(page: Page, info: TestInfo, name: string) {
  await info.attach(name, {contentType: 'image/png', body: await page.screenshot({fullPage: true})});
}
async function opacityOnly(page: Page, selector: string, reduced: boolean) {
  const motion = await page.locator(selector).evaluate(element => {
    const style = getComputedStyle(element);
    return {name: style.animationName, duration: style.animationDuration,
      frames: element.getAnimations().filter(animation => (animation.effect as KeyframeEffect | null)?.target === element)
        .flatMap(animation => (animation.effect as KeyframeEffect).getKeyframes())};
  });
  if (reduced) expect(motion.name).toBe('none');
  else {
    expect(motion.name).toBe('fadeIn');
    expect(motion.duration).toBe('0.2s');
    for (const frame of motion.frames)
      expect(Object.keys(frame).filter(key => !['offset', 'computedOffset', 'easing', 'composite', 'opacity'].includes(key))).toEqual([]);
  }
}

for (const motion of ['no-preference', 'reduce'] as const) {
  test.describe('reading stability: ' + motion, () => {
    test.use({serviceWorkers: 'block', contextOptions: {reducedMotion: motion}});
    test.beforeEach(async ({page, context, baseURL}) => {
      const origin = new URL(baseURL || 'http://localhost:5500').origin;
      const report = {errors: [] as string[], nonGet: [] as string[]}; observations.set(page, report);
      page.on('pageerror', error => report.errors.push(error.message));
      await context.routeWebSocket('**/*', socket => socket.close());
      await context.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (request.method() !== 'GET') { report.nonGet.push(request.method() + ' ' + url.origin + url.pathname); return route.abort(); }
        const font = ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname) && url.protocol === 'https:';
        return url.origin === origin || font ? route.continue() : route.abort();
      });
      await page.addInitScript(reading => localStorage.setItem('nefroquest-reading-mode', reading ? '1' : '0'), motion === 'reduce');
    });
    test.afterEach(async ({page}, info) => {
      await info.attach('reading-stability-runtime', {contentType: 'application/json', body: JSON.stringify(observations.get(page))});
      expect(observations.get(page)?.errors).toEqual([]);
      expect(observations.get(page)?.nonGet).toEqual([]);
    });

    test('campaign correction keeps alternatives still and preserves feedback, bound grading and next-question action', async ({page}, info) => {
      await prepare(page, info, motion === 'reduce'); await startCampaign(page);
      await fonts(page);
      const before = await page.evaluate(() => {
        const s = (0, eval)('state'), w = window as any;
        return {id: s.current.id, answer: s.current.a, options: s.current.o, explanation: s.current.e,
          binding: w.questionRevisionCatalog.current(s.current.id, 'main').binding};
      });
      const wrong = (before.answer + 1) % 4, control = page.locator('#options .option').nth(wrong);
      await control.focus();
      await snapshot(page, info, 'campaign-before-wrong-real-fonts');
      await beginProbe(page, false);
      if (motion === 'no-preference') await page.keyboard.press(String.fromCharCode(65 + wrong));
      else await control.click();
      await expect(page.locator('#feedback.bad')).toBeVisible();
      await assertStable(page, info, 'campaign-native-wrong-geometry');
      await expect(page.locator('#options .option:disabled')).toHaveCount(4);
      await expect(page.locator('#options .opt-body')).toHaveText(before.options);
      await expect(page.locator('#feedback .fb-snip')).toHaveText(before.explanation);
      expect(await page.locator('#options .option.wrong .opt-key').evaluate(element => getComputedStyle(element, '::after').content)).toContain('×');
      expect(await page.locator('#options .option.correct .opt-key').evaluate(element => getComputedStyle(element, '::after').content)).toContain('✓');
      if (page.viewportSize()!.width <= 768) {
        await expect(page.locator('#question')).toHaveCSS('text-align', 'left');
        await expect(page.locator('#feedback .fb-snip')).toHaveCSS('text-align', 'left');
      }
      await opacityOnly(page, '#feedback', motion === 'reduce');
      await snapshot(page, info, 'campaign-wrong-correction-real-fonts');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.answered === true);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!));
      expect(saved.questionAnswer.correct).toBe(false);
      expect(saved.questionRevisionBinding).toEqual(before.binding);
      await page.locator('#nextBtn').click();
      await page.waitForFunction(id => (0, eval)('!_loadingNextQuestion && !!state.current && !state.answered') && (0, eval)('state.current.id') !== id, before.id);
      const correct = await page.evaluate(() => (0, eval)('state.current.a'));
      await page.locator('#options .option').nth(correct).click();
      await expect(page.locator('#feedback.good .nql-answer-consequence')).toContainText('XP');
      await expect(page.locator('#options .option.correct')).toHaveCount(1);
    });

    test('study reading follows the campaign mobile scale and its correction keeps the native alternatives and focus stable', async ({page}, info) => {
      await prepare(page, info, motion === 'reduce'); await startStudy(page); await fonts(page);
      if (page.viewportSize()!.width <= 768) {
        const reference = await page.locator('#question').evaluate(element => {
          const style = getComputedStyle(element); return {size: style.fontSize, weight: style.fontWeight};
        });
        await expect(page.locator('.nq-study-question-title')).toHaveCSS('font-size', reference.size);
        await expect(page.locator('.nq-study-question-title')).toHaveCSS('font-weight', reference.weight);
        await expect(page.locator('.nq-study-question-title')).toHaveCSS('text-align', 'left');
      }
      const current = await page.evaluate(() => (0, eval)('_studyPresentations[studyModeIndex]'));
      const wrong = (current.a + 1) % 4, control = page.locator('#studyOptions button').nth(wrong);
      await control.focus();
      await snapshot(page, info, 'study-before-wrong-real-fonts');
      await beginProbe(page, true);
      if (motion === 'no-preference') await page.keyboard.press(String.fromCharCode(65 + wrong));
      else await control.click();
      await expect(page.locator('#studyFeedback')).toBeFocused();
      await expect(page.locator('.nq-study-feedback-card.is-wrong')).toBeVisible();
      await assertStable(page, info, 'study-native-wrong-geometry');
      await expect(page.locator('#studyFeedback')).toBeFocused();
      await expect(page.locator('#studyOptions button:disabled')).toHaveCount(4);
      await expect(page.locator('.nq-study-option-text')).toHaveText(current.o);
      await expect(page.locator('.nq-study-feedback-copy')).toHaveText(current.e);
      await expect(page.locator('#studyWrong')).toHaveText('1');
      await expect(page.locator('#studyCorrect')).toHaveText('0');
      await opacityOnly(page, '.nq-study-feedback-card', motion === 'reduce');
      await snapshot(page, info, 'study-wrong-correction-real-fonts');
      await page.locator('[data-action="nextStudyQuestion"]').click();
      await expect(page.locator('#studyQuestionArea')).toBeFocused();
      await expect(page.locator('#studyProgress')).toHaveText('2');
      const correct = await page.evaluate(() => (0, eval)('_studyPresentations[studyModeIndex].a'));
      await page.locator('#studyOptions button').nth(correct).click();
      await expect(page.locator('.nq-study-feedback-card.is-correct')).toBeVisible();
      await expect(page.locator('#studyCorrect')).toHaveText('1');
      await expect(page.locator('#studyWrong')).toHaveText('1');
      await page.getByRole('button', {name: 'Pausar e voltar', exact: true}).click();
      await expect(page.locator('#studyModePage')).toHaveCount(0);
      await expect(page.locator('#welcomeScreen')).toBeVisible();
      expect(await page.evaluate(() => document.body.classList.contains('nq-studying'))).toBe(false);
    });
  });
}
