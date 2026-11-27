import { Page, expect } from '@playwright/test';

/** True quando rodando contra o deploy real (não localhost) */
export const isLiveEnv = (process.env.BASE_URL || '').includes('nefroquest.com');

type GameFixtureOptions = {
  authUser?: ({ id: string } & Record<string, unknown>) | null;
  replaceSnapshot?: boolean;
  asGuest?: boolean;
  /** Opt in after seeding storage on a lightweight page of the same origin. */
  navigateToApp?: boolean;
};

/**
 * Injeta save + premium no localStorage, recarrega e entra no jogo via
 * continueGame(). O app não auto-resume a partir do save: a welcome screen
 * mostra "Continuar Jornada" (data-action="continueGame"), que carrega o banco
 * de questões e renderiza a primeira pergunta. Chamamos continueGame()
 * diretamente (mais robusto que clicar e esperar o banco lazy-load de ~1.4MB).
 *
 * character DEVE ser uma chave válida atual (glomerulus/aquaria/nephros) —
 * 'guerreiro' (chave antiga) faz characters[c].name lançar em continueGame.
 */
export async function injectGameState(page: Page, overrides: Record<string, unknown> = {}, options: GameFixtureOptions = {}) {
  if (options.asGuest && options.authUser) throw new Error('asGuest requires an anonymous fixture');
  const base = {
    schemaVersion: 2,
    level: 5, xp: 150, xpToNext: 400, score: 2500,
    lives: 3, streak: 2, gold: 80, bonusUses: 0,
    correctTotal: 15, narrativeShown: 0, bossIntroShown: false,
    gameOver: false, gameStarted: true,
    difficulty: 'normal',
    character: 'glomerulus',
    // equipment omitido de propósito → restoreGame mantém o default de 6 slots.
    idx: 0, queueIds: [], recentIds: [],
    chestsOpened: 2, timestamp: Date.now(),
  };
  await page.evaluate(({ save, replaceSnapshot }) => {
    // Uma nova fixture escolhida pelo teste substitui o snapshot anterior.
    // O caminho padrão continua legado, para exercitar sua migração real.
    if (replaceSnapshot) localStorage.removeItem('nefroquest-save-v7');
    localStorage.setItem('nefroquest-save', JSON.stringify(save));
    localStorage.setItem('nefroquest-premium', '1');
  }, {
    save: {
      ...base, ...overrides,
      ...(options.authUser !== undefined ? { saveOwner: options.authUser?.id ?? null } : {}),
    },
    replaceSnapshot: options.replaceSnapshot ?? false,
  });
  // O jogo fica pronto pelo DOM e pelas condições de enterGame/waitForGame.
  // Analytics/iframes externos podem continuar pendentes sem bloquear a fixture.
  if (options.navigateToApp) {
    await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  } else {
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  // A identidade da fixture precisa existir quando loadGame fixa o dono do
  // progresso; trocá-la depois de continuar é uma mudança de conta real.
  if (options.authUser !== undefined) {
    await page.evaluate(user => { (window as any).authUser = user; }, options.authUser);
  }
  if (options.asGuest) {
    // A entrada nativa sinaliza visitante antes de continuar; apenas ocultar o
    // portal não impede que um callback inicial de autenticação o reabra.
    await page.waitForFunction(() => typeof (window as any).playAsGuest === 'function');
    await page.evaluate(() => (window as any).playAsGuest());
  }
  await enterGame(page);
}

/**
 * Entra no jogo a partir do save no localStorage (após um load/reload).
 * Dispensa a landing screen (que senão fica sobreposta interceptando cliques),
 * dispara continueGame() — que carrega o banco de questões e renderiza a
 * primeira pergunta — e espera a tela de jogo. Reutilizável por testes que
 * recarregam a página (o app não auto-resume a partir do save).
 */
let continuationSequence = 0;

export async function enterGame(page: Page) {
  await page.evaluate(() => {
    document.getElementById('landingScreen')?.classList.add('hidden');
    document.getElementById('welcomeScreen')?.classList.add('hidden');
  });
  await page.waitForFunction(() => typeof (window as any).continueGame === 'function', null, { timeout: 15_000 });
  const key = '__nqFixtureContinuation', token = `${Date.now()}:${++continuationSequence}`;
  let completion: Awaited<ReturnType<Page['waitForFunction']>> | undefined;
  try {
    // Retain the actual action in its document. Returning its pending Promise
    // over CDP can lose an otherwise unreachable Promise during collection.
    await page.evaluate(({ key, token }) => {
      const w = window as any, source = w.continueGame;
      const marker: any = { token, source, status: 'pending', promise: null, error: null };
      Object.defineProperty(w, key, { value: marker, configurable: true });
      try { marker.promise = Promise.resolve(source.call(w)); }
      catch (error) { marker.promise = Promise.reject(error); }
      marker.promise.then(() => { marker.status = 'fulfilled'; }, (error: unknown) => {
        let name = 'Error', message = 'The continuation rejected with an unreadable value.';
        try {
          const value = error as { name?: unknown; message?: unknown } | null;
          if (typeof value?.name === 'string') name = value.name;
          message = typeof value?.message === 'string' ? value.message : String(error);
        } catch { /* Keep the rejection,without serializing the rejected object. */ }
        marker.error = { name, message }; marker.status = 'rejected';
      });
    }, { key, token });
    completion = await page.waitForFunction(({ key, token }) => {
      const w = window as any, marker = w[key];
      if (!marker || marker.token !== token)
        throw new Error('Fixture document changed before continuation completed.');
      if (w.continueGame !== marker.source)
        throw new Error('Fixture continuation source changed before completion.');
      return marker.status === 'pending' ? false : { status: marker.status, error: marker.error };
    }, { key, token }, { timeout: 0 }); // The caller's existing test deadline remains authoritative.
    const result = await completion.jsonValue() as { status: string; error: { name: string; message: string } | null };
    if (result.status === 'rejected') {
      const error = new Error(result.error!.message); error.name = result.error!.name;
      throw error;
    }
    await waitForGame(page);
  } finally {
    try { await completion?.dispose(); } catch { /* Preserve the action's result. */ }
    try {
      await page.evaluate(({ key, token }) => {
        const w = window as any;
        if (w[key]?.token === token) delete w[key];
      }, { key, token });
    } catch { /* A replaced/closed document must not hide the original failure. */ }
  }
}

/**
 * Injeta estado de boss mode (correctTotal = 90). Vidas altas dão folga para
 * testes que precisam sondar a alternativa correta (erro custa vida no boss).
 */
export async function injectBossState(page: Page) {
  return injectGameState(page, {
    correctTotal: 90, level: 12, score: 45000, bossIntroShown: true,
    lives: 99, maxLives: 99,
  });
}

/** Aguarda a tela de jogo principal (após injectGameState/continueGame). */
export async function waitForGame(page: Page) {
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#question')).not.toBeEmpty({ timeout: 10_000 });
}

/** Simula apenas a consulta do plano gratuito pelo resolvedor real. */
export async function confirmFreePlan(page: Page) {
  const access = await page.evaluate(async () => {
    const run = (0, eval);
    const owner = (window as any).authUser;
    if (!owner?.id || !owner.email) throw new Error('A fixture do plano exige ID e email.');
    const original = run('_supaClient');
    const setClient = run('(client) => { _supaClient = client; }');
    const fixture = {
      from(table: string) {
        if (table !== 'profiles' && table !== 'access_whitelist') {
          throw new Error('Consulta inesperada na fixture do plano: ' + table);
        }
        return { select: () => ({ eq: (column: string, value: string) => ({
          async single() {
            if (table !== 'profiles' || column !== 'id' || value !== owner.id) throw new Error('Perfil incorreto.');
            return { data: { is_premium: false, premium_expires_at: null }, error: null };
          },
          async maybeSingle() {
            if (table !== 'access_whitelist' || column !== 'email' || value !== owner.email) throw new Error('Lista de acesso incorreta.');
            return { data: null, error: null };
          },
        }) }) };
      },
    };
    setClient(fixture);
    try { return await run('_awaitPremiumAccess({ refresh: true })'); }
    finally { setClient(original); }
  });
  expect(access).toBe('free');
}

/** Clica na primeira opção disponível */
export async function pickFirstOption(page: Page) {
  const option = page.locator('#options .option').first();
  await expect(option).toBeEnabled({ timeout: 5_000 });
  await option.click();
}

/** Responde e avança */
export async function answerAndAdvance(page: Page) {
  await pickFirstOption(page);
  // O save-base começa com 80 de ouro. Se a alternativa sorteada for a
  // correta, a recompensa pode cruzar o marco de 100 e abrir a explicação
  // modal antes da próxima carta. O teste deve percorrer essa UI real em vez
  // de tentar clicar através do overlay.
  const goldMilestone = page.locator('#goldMilestonePopup');
  try {
    await goldMilestone.waitFor({ state: 'visible', timeout: 900 });
    await goldMilestone.getByRole('button', { name: 'Entendido!' }).click();
  } catch {
    // Sem marco nesta resposta: segue diretamente para a próxima carta.
  }
  const nextBtn = page.locator('#nextBtn:not(.hidden)');
  await expect(nextBtn).toBeVisible({ timeout: 5_000 });
  await nextBtn.click();
}
