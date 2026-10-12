import { expect, type Page, type TestInfo } from '@playwright/test';

export type PilotClass = 'nephros' | 'glomerulus' | 'aquaria';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'hardcore';
export const PILOT_KEY = 'nefroquest-pilot-v1';
export const NORMAL_KEYS = [
  'nefroquest-save-v7', 'nefroquest-save', 'nefroquest-stats',
  'nefroquest-detailed-stats', 'nefroquest-mastered', 'nefroquest-all-answered-qids',
  'nefroquest-sr', 'nefroquest-achievements', 'nefroquest-announced-badges',
  'nefroquest-badge-history', 'nefroquest-journey-count', 'nefroquest-arqui-defeated',
  'nefroquest-hardcore-completed', 'unlockedArticles', 'nefroquest-unlocked-refs',
  'nefroquest-knowledge', 'nefroquest-gold-milestone-shown',
  'nefroquest-sr-data', 'nq-unlocked-refs', 'nefroquest_total_accumulated_knowledge',
  'nefroquest-study-state', 'nefroquest-exam-state', 'nq_last_study',
  'nq-acidbase-progress', 'nefroquest-comp-stats', 'nefroquest-error-reasons',
  'nefroquest-minigame-notified', 'nefroquest-minigame-best',
  'nefroquest-recommended-difficulty', 'nefroquest-ritual-done',
];

// Technical markers exercise the real deck/answer engine without reviewing or
// modifying any clinical question. This response exists only inside this test.
const TECHNICAL_TOPICS = Array.from({ length: 120 }, (_, n) => ({
  t: 'Fixture técnica do piloto', qid: `pilot-tech-${String(n + 1).padStart(3, '0')}`,
  q: `Marcador técnico ${n + 1}: selecione a alternativa A.`,
  opts: ['Marcador A', 'Marcador B', 'Marcador C', 'Marcador D'],
  ans: 0, exp: 'O marcador esperado nesta fixture técnica é A.',
  diff: ['easy', 'medium', 'hard'][n % 3], cat: 'geral', refs: [],
}));

export const normalSave = {
  schemaVersion: 7, saveOwner: null, level: 3, xp: 27, xpToNext: 264,
  score: 761, lives: 4, maxLives: 4, streak: 1, gold: 641,
  difficulty: 'normal', correctTotal: 23, character: 'nephros',
  selectedCharacter: 'nephros', gameStarted: true, gameOver: false,
  idx: 0, queueIds: [], recentIds: [], chestsOpened: 2, narrativeShown: 1,
  bossIntroShown: false, obtainedItems: ['Marcador normal exclusivo'],
  allItemsCollectedNotified: false, timestamp: 1000,
};

const pilotRuntimeErrors = new WeakMap<Page, Array<{ kind: string; message: string }>>();

function recordPilotRuntimeErrors(page: Page) {
  if (pilotRuntimeErrors.has(page)) return;
  const errors: Array<{ kind: string; message: string }> = [];
  pilotRuntimeErrors.set(page, errors);
  const record = (kind: string, message: string) => {
    errors.push({ kind, message: message.slice(0, 1500) });
    if (errors.length > 30) errors.shift();
  };
  page.on('pageerror', error => record('pageerror', error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error') record('console.error', message.text());
  });
}

export async function attachPilotFailureDiagnostics(page: Page, testInfo: TestInfo) {
  if (testInfo.status === testInfo.expectedStatus) return;
  let snapshot: unknown;
  try {
    snapshot = await page.evaluate(key => {
      const read = (expression: string) => {
        try { return (0, eval)(expression); }
        catch (error) { return { unavailable: String(error) }; }
      };
      const node = (id: string) => {
        const element = document.getElementById(id);
        if (!element) return { present: false };
        const style = getComputedStyle(element), rect = element.getBoundingClientRect();
        return { present: true, hidden: element.hidden, className: element.className,
          display: style.display, visibility: style.visibility,
          width: rect.width, height: rect.height, ariaHidden: element.getAttribute('aria-hidden') };
      };
      const api = (window as any).NQPilot;
      let persisted: any = null;
      try { persisted = JSON.parse(localStorage.getItem(key) || 'null'); }
      catch (error) { persisted = { parseError: String(error) }; }
      const save = persisted?.save;
      return {
        url: location.href,
        binding: api?.captureBinding(),
        pilot: api && { active: api.active, writable: api.writable, status: api.status,
          error: api.error, owner: api.owner, journeyId: api.journeyId,
          peek: api.peek(read('typeof authUser !== "undefined" ? authUser?.id || null : null')) },
        state: read(`({journeyDomain:state.journeyDomain,gameStarted:state.gameStarted,
          gameOver:state.gameOver,gameCompleted:state.gameCompleted,character:state.character,
          difficulty:state.difficulty,lives:state.lives,currentId:state.current?.id,
          answered:state.answered,classBenefits:state.classBenefits})`),
        transient: read(`({progressEpoch:_progressEpoch,loadingNextQuestion:_loadingNextQuestion,
          continuePending:_continueGamePending,pilotResumePending:_pilotResumePending})`),
        persisted: persisted && { journeyId: persisted.journeyId, revision: persisted.revision,
          parseError: persisted.parseError, classBenefits: persisted.classBenefits,
          progressKeys: Object.keys(persisted.progress || {}),
          save: save && { gameStarted: save.gameStarted, gameOver: save.gameOver,
            gameCompleted: save.gameCompleted, currentQuestionId: save.currentQuestionId,
            character: save.character, difficulty: save.difficulty, lives: save.lives,
            answered: save.answered } },
        screens: Object.fromEntries(['mainApp', 'welcomeScreen', 'landingScreen',
          'charSelectModal', 'charIntroOverlay', 'characterPilotBanner', 'leavePilotBtn',
          'resumePilotBtn'].map(id => [id, node(id)])),
        loadedScripts: [...document.scripts].filter(script => script.src).map(script => {
          const url = new URL(script.src); return url.pathname + url.search;
        }),
      };
    }, PILOT_KEY);
  } catch (error) { snapshot = { unavailable: String(error) }; }
  await testInfo.attach('pilot-runtime-failure', {
    contentType: 'application/json',
    body: JSON.stringify({ status: testInfo.status, snapshot,
      errors: pilotRuntimeErrors.get(page) || [] }, null, 2),
  });
}

export async function setupPilotPage(page: Page, seedNormal = false) {
  recordPilotRuntimeErrors(page);
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return ['localhost', '127.0.0.1'].includes(host) ? route.continue() : route.abort();
  });
  await page.route('**/data/topics.js*', route => route.fulfill({
    status: 200, contentType: 'application/javascript',
    body: `const topics = ${JSON.stringify(TECHNICAL_TOPICS)};`,
  }));
  await page.addInitScript(({ seed, save }) => {
    if (sessionStorage.getItem('pilot-fixture-ready')) return;
    sessionStorage.setItem('pilot-fixture-ready', '1');
    localStorage.setItem('pwa-dismissed', '1');
    if (seed) {
      localStorage.setItem('nefroquest-save', JSON.stringify(save));
      localStorage.setItem('nefroquest-stats', JSON.stringify({
        questionsAnsweredAllTime: 7, gamesPlayed: 3, bestLevel: 3,
      }));
      localStorage.setItem('nefroquest-mastered', '["normal-marker"]');
      localStorage.setItem('unlockedArticles', '["normal-article"]');
      localStorage.setItem('nefroquest-badge-history', '["normal-badge"]');
      localStorage.setItem('nefroquest-journey-count', '3');
      const progress = {
        'nefroquest-all-answered-qids': '["normal-marker"]',
        'nefroquest-sr-data': '{"normal-marker":{"due":4102444800000,"stability":3,"difficulty":5,"reps":2}}',
        'nq-unlocked-refs': '["normal-reference"]',
        'nefroquest_total_accumulated_knowledge': '713',
        'nefroquest-study-state': '{"questions":["normal-marker"],"index":0,"correct":0,"wrong":0,"savedAt":1000}',
        'nefroquest-exam-state': '{"questions":[{"id":"normal-marker","q":"Marcador normal","o":["A","B"],"a":0}],"idx":0,"answers":[],"startTime":1000}',
        'nq_last_study': '2026-10-01',
        'nq-acidbase-progress': '{"normal-marker":{"completed":true}}',
        'nefroquest-comp-stats': '{"normal-marker":{"correct":2,"wrong":1}}',
        'nefroquest-error-reasons': '{"counts":{"normal-marker":2},"log":[]}',
        'nefroquest-achievements': '["normal-marker"]',
        'nefroquest-announced-badges': '["normal-marker"]',
        'nefroquest-arqui-defeated': '1', 'nefroquest-hardcore-completed': '1',
        'nefroquest-gold-milestone-shown': '1', 'nefroquest-minigame-notified': '1',
        'nefroquest-minigame-best': '11', 'nefroquest-recommended-difficulty': 'hard',
        'nefroquest-ritual-done': 'normal-ritual-history',
      };
      for (const [key, value] of Object.entries(progress)) localStorage.setItem(key, value);
    }
  }, { seed: seedNormal, save: normalSave });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function' &&
    typeof (window as any).NQPilot === 'object');
  const guest = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
  if (await guest.isVisible()) await guest.click();
  await expect(page.locator('#welcomeScreen')).toBeVisible();
}

export async function openPilotChoice(page: Page, difficulty: Difficulty = 'normal') {
  await page.locator('#welcomeScreen [data-action="startNewFromWelcome"]').click();
  await expect(page.locator('#diffSelectorOverlay')).toBeVisible();
  await page.locator(`#diffSelectorOverlay .difficulty-card[data-diff-key="${difficulty}"]`).click();
  await expect(page.locator('#characterPilotOptIn')).toHaveCount(0);
}

function freshTechnicalSave(character: PilotClass, difficulty: Difficulty) {
  const lives = { easy: 5, normal: 4, hard: 3, hardcore: 1 }[difficulty];
  return {
    schemaVersion: 7, saveOwner: null, level: 1, xp: 0, xpToNext: 200,
    score: 0, lives, maxLives: lives, streak: 0, gold: 0, difficulty, character,
    gameStarted: true, gameOver: false, gameCompleted: false, completedGame: false,
    correctTotal: 0, bonusUses: 0, narrativeShown: 0, bossIntroShown: false,
    battleFinalShown: false, extraLifeGiven: false, chestsOpened: 0,
    obtainedItems: [], allItemsCollectedNotified: false, forjaPending: null,
    chestCorrectCount: 0, chestTarget: 5, legendaryAbilityUsed: {}, bossLog: [],
    bossStunActive: false, journeyDomain: 'normal', classBenefits: null,
    questionOrigin: 'campaign', journeyAnswerOrdinal: 0, pilotLastAnswer: null,
    pilotJourneyAccounted: false, answered: false,
    queueIds: TECHNICAL_TOPICS.map(question => question.qid), idx: 1,
    currentQuestionId: TECHNICAL_TOPICS[0].qid, recentIds: [], timestamp: 1000,
    equipment: Object.fromEntries(['helmet', 'glove', 'armor', 'weapon', 'relic', 'boot']
      .map(slot => [slot, { n: 'Vazio', rar: 'common', atk: 0, def: 0, kno: 0, luck: 0 }])),
  };
}

// The legacy v1 storage key contains a schema-8 envelope. Seed an already-started
// historical journey once; all validation, locking, restoration and answers use
// the real module and UI. Reload never reseeds this record.
export async function seedLegacyPilot(page: Page, character: PilotClass = 'nephros', difficulty: Difficulty = 'normal'): Promise<any> {
  if (difficulty === 'hardcore') throw new Error('The legacy pilot never supports Hardcore');
  return page.evaluate(({ character, save }) => {
    const pilot = (window as any).NQPilot;
    if (pilot.active) throw new Error('Release the current journey before seeding a legacy pilot');
    const owner = (0, eval)('typeof authUser !== "undefined" ? authUser?.id || null : null');
    const previous = JSON.parse(localStorage.getItem(pilot.KEY) || 'null');
    const compatible = pilot.peek(owner).valid && previous?.owner === owner;
    const journeyId = crypto.randomUUID();
    const ledger = { version: 1, journeyId, lockedClass: character, ruleset: 'class-boons-v1',
      windowAnswers: 0, seenQids: [], creditedEvents: [], xpGranted: 0, goldGranted: 0, shieldSpent: false };
    const progress = compatible ? { ...previous.progress } : {};
    delete progress['nefroquest-announced-badges'];
    progress['nefroquest-journey-count'] = String(Number(progress['nefroquest-journey-count'] || 0) + 1);
    const record = { schemaVersion: 8, domain: 'pilot', ruleset: 'class-boons-v1', journeyId, owner,
      revision: compatible ? previous.revision + 1 : 1,
      save: { ...save, schemaVersion: 8, saveOwner: owner, journeyDomain: 'pilot', classBenefits: ledger },
      classBenefits: ledger, progress, createdAt: Date.now(), updatedAt: Date.now() };
    localStorage.setItem(pilot.KEY, JSON.stringify(record));
    (window as any).refreshCharacterPilotUI();
    if (!pilot.peek(owner).resumable) throw new Error('The legacy fixture failed real envelope validation');
    return record;
  }, { character, save: freshTechnicalSave(character, difficulty) });
}

export async function startPilot(page: Page, character: PilotClass = 'nephros', difficulty: Difficulty = 'normal') {
  await seedLegacyPilot(page, character, difficulty);
  await expect(page.locator('#resumePilotBtn')).toBeVisible();
  await expect(page.locator('#resumePilotBtn')).toBeEnabled();
  await page.locator('#resumePilotBtn').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await expect(page.locator('#characterPilotBanner')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
  expect((await pilotState(page)).classBenefits).toMatchObject({ lockedClass: character, windowAnswers: 0 });
}

export async function startNormal(page: Page, character: PilotClass = 'nephros') {
  // Explicit historical baseline: new eligible journeys have automatic bonuses,
  // while a saved schema-7 journey must continue without retroactive benefits.
  await page.evaluate(save => {
    save.saveOwner = (0, eval)('typeof authUser !== "undefined" ? authUser?.id || null : null');
    const raw = JSON.stringify(save);
    localStorage.setItem('nefroquest-save-v7', raw);
    localStorage.setItem('nefroquest-save', raw);
    (0, eval)('refreshWelcomeSave()');
  }, freshTechnicalSave(character, 'normal'));
  await page.locator('#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
  expect((await pilotState(page)).classBenefits).toBeNull();
}

export async function startNormalCharacter(page: Page, character: PilotClass = 'nephros', difficulty: Difficulty = 'normal') {
  await openPilotChoice(page, difficulty);
  await page.locator('#diffConfirmBtn').click();
  await expect(page.locator('#charSelectModal')).toHaveClass(/show/);
  await page.locator(`#charSelectModal [data-action="selectCharacter"][data-arg="${character}"]`).click();
  await page.locator('#charIntroOverlay [data-action="closeIntroAndStart"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
  expect((await pilotState(page)).classBenefits).toMatchObject({
    ruleset: 'normal-character-initial-v1', lockedClass: character, windowAnswers: 0,
  });
  expect(await page.evaluate(() => (window as any).NQPilot.active)).toBe(false);
}

export async function resumeNormalCharacter(page: Page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).continueGame === 'function');
  const guest = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
  if (await guest.isVisible()) await guest.click();
  await page.locator('#welcomeScreen [data-action="continueGame"]').click();
  await expect(page.locator('#mainApp')).toBeVisible();
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !_loadingNextQuestion'));
}

export async function pilotState(page: Page): Promise<any> {
  return page.evaluate(() => JSON.parse((0, eval)(`JSON.stringify({
    level:state.level,xp:state.xp,xpToNext:state.xpToNext,score:state.score,
    gold:state.gold,lives:state.lives,streak:state.streak,correctTotal:state.correctTotal,
    character:state.character,difficulty:state.difficulty,answered:state.answered,
    gameStarted:state.gameStarted,gameOver:state.gameOver,gameCompleted:state.gameCompleted,
    completedGame:state.completedGame,pilotJourneyAccounted:state.pilotJourneyAccounted,
    questionOrigin:state.questionOrigin,
    journeyDomain:state.journeyDomain,classBenefits:state.classBenefits,
    pilotLastAnswer:state.pilotLastAnswer,characterLastAnswer:state.characterLastAnswer,
    equipment:state.equipment,obtainedItems:state.obtainedItems,forjaPending:state.forjaPending,
    legendaryAbilityUsed:state.legendaryAbilityUsed,currentId:state.current?.id,
    currentDifficulty:state.current?._d,
    theta:typeof calculateUserTheta==='function'?calculateUserTheta('geral'):null
  })`)));
}

export async function pilotEnvelope(page: Page): Promise<any> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), PILOT_KEY);
}

export async function normalBytes(page: Page): Promise<Record<string, string | null>> {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), NORMAL_KEYS);
}

export async function changeState(page: Page, values: Record<string, unknown>) {
  // Scenarios such as cap, final life, and equipment are controlled inputs;
  // bonus application/ledger/window/transaction functions are never replaced.
  await page.evaluate(overrides => Object.assign((0, eval)('state'), overrides), values);
}

export async function answerTechnical(page: Page, correct = true, dom = false) {
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !!state.current && !state.answered && !_loadingNextQuestion'));
  if (dom) {
    const index = await page.evaluate(ok => (0, eval)(ok ? 'state.current.a' : '(state.current.a+1)%state.current.o.length'), correct);
    await page.locator('#options .option').nth(index).click();
  } else {
    await page.evaluate(ok => {
      const random = Math.random;
      try {
        // Avoid random pre-existing armor blocks; the actual handler still runs.
        Math.random = () => 0.999;
        (0, eval)(`answer(${ok ? 'state.current.a' : '(state.current.a+1)%state.current.o.length'},
          document.querySelectorAll('#options .option')[${ok ? 'state.current.a' : '(state.current.a+1)%state.current.o.length'}])`);
      } finally { Math.random = random; }
    }, correct);
  }
  return pilotState(page);
}

export async function advanceTechnical(page: Page, repeatedId?: string) {
  await page.waitForFunction(() => !(0, eval)('_loadingNextQuestion'));
  await page.evaluate(id => {
    if (id) {
      // Replay a bank identity through the actual queue/draw/render path.
      const state = (0, eval)('state');
      const q = (window as any).questionBank.find((question: any) => question.id === id);
      state.queue.splice(state.idx, state.queue.length - state.idx, q);
    }
    (0, eval)('renderQuestion()');
  }, repeatedId || null);
  await page.waitForFunction(() => (0, eval)('!state.answered && !_loadingNextQuestion'));
}

export async function resumePilot(page: Page, expectedScreen: 'main' | 'forge' = 'main') {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).resumePilotGame === 'function');
  const guest = page.locator('#landingScreen [data-action="playAsGuest"]:visible').first();
  if (await guest.isVisible()) await guest.click();
  await expect(page.locator('#resumePilotBtn')).toBeVisible();
  await page.locator('#resumePilotBtn').click();
  if (expectedScreen === 'forge') {
    await expect(page.locator('#forjaPage')).toBeVisible();
    await expect(page.locator('#mainApp')).toBeHidden();
  } else {
    await expect(page.locator('#mainApp')).toBeVisible();
  }
  await page.waitForFunction(() => (0, eval)('state.gameStarted && !_loadingNextQuestion'));
}

export async function installBackendRecorder(page: Page) {
  await page.evaluate(() => {
    const windowAny = window as any;
    windowAny.__pilotBackendWrites = [];
    windowAny.__pilotBackendReads = [];
    const result = Promise.resolve({ data: null, error: null });
    const chain: any = {
      then: result.then.bind(result), single: () => result, maybeSingle: () => result,
      eq: () => chain, order: () => chain, limit: () => chain,
      select: () => chain,
    };
    windowAny.__pilotBackend = { from: (table: string) => {
      windowAny.__pilotBackendReads.push(table);
      return { ...chain, insert: (payload: unknown) => {
        windowAny.__pilotBackendWrites.push({ table, payload }); return result;
      }, upsert: (payload: unknown) => {
        windowAny.__pilotBackendWrites.push({ table, payload }); return result;
      } };
    } };
    (0, eval)('_supaClient = window.__pilotBackend');
  });
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const table = new URL(request.url()).pathname.split('/').pop();
    if (request.method() === 'POST' || request.method() === 'PATCH') {
      const payload = request.postDataJSON();
      await page.evaluate(write => (window as any).__pilotBackendWrites.push(write), { table, payload });
    } else {
      await page.evaluate(name => (window as any).__pilotBackendReads.push(name), table);
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}
