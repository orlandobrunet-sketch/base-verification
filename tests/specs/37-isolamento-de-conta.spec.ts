import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

/**
 * NQ-01, primeiro item: nenhuma conta herda dados de outra no mesmo aparelho.
 *
 * O logout chamava clearLocalProgress(), que limpava save, estatísticas e
 * conquistas — mas doze chaves ficavam para trás. Quem entrasse depois na mesma
 * máquina herdava histórico de questões respondidas, votos de dificuldade,
 * padrões de erro, avaliações, favoritos e conhecimento acumulado de quem saiu.
 *
 * A pior era 'nq-pending-leaderboard': uma pontuação ainda não enviada da conta
 * anterior seria publicada no ranking global pela conta seguinte.
 *
 * O teste não faz login real — exercita o contrato de limpeza diretamente, que
 * é onde o defeito vivia. Login de verdade é de outro nível de teste.
 */

// Tudo que pertence à CONTA e não pode sobreviver ao logout.
const CHAVES_DE_CONTA: Record<string, string> = {
  'nefroquest-save': '{"xp":9999}',
  'nefroquest-save-v7': '{"saveOwner":"anterior","character":"glomerulus","gold":9999}',
  'nefroquest-detailed-stats': '{"acertos":42}',
  'nefroquest-achievements': '["primeira"]',
  'nefroquest-sr-data': '{"1e5e88e9":{"stability":9}}',
  'nefroquest-all-answered-qids': '["1e5e88e9","66b811c3"]',
  'nefroquest-difficulty-votes': '{"1e5e88e9":"hard"}',
  'nefroquest-error-reasons': '{"1e5e88e9":"anchoring"}',
  'nefroquest-rated-questions': '["1e5e88e9"]',
  'nefroquest-recommended-difficulty': 'hard',
  'nefroquest-ritual-done': '1',
  'nefroquest_total_accumulated_knowledge': '820',
  'nefroquest-minigame-notified': '1',
  'nq-bib-favorites': '["cni_nephrotoxicity_naesens"]',
  'nq-pending-leaderboard': '{"score":7300,"player_name":"Conta Anterior"}',
  'nq-nickname-asked': '1',
  'nq_last_study': '2026-08-21',
  'unlockedArticles': '["a1"]',
  'nq-unlocked-refs': '["r1"]',
  'nq-acidbase-progress': '{"caso":7}',
  'nefroquest-arqui-defeated': '1',
  'nefroquest-hardcore-completed': '1',
  'nefroquest-badge-history': '{"1":1}',
  'nefroquest-journey-count': '3',
};

// Preferências do APARELHO — precisam sobreviver.
const CHAVES_DE_APARELHO: Record<string, string> = {
  'nefroquest-music': 'off',
  'nefroquest-music-vol': '0.15',
  'nefroquest-sound': 'off',
  'nefroquest-sfx-vol': '0.3',
  'nefroquest-audio-preferences-version': '15.91',
  'nq_notif_enabled': '1',
  'pwa-dismissed': '1',
  'nq-sw-version': '14.78',
  'nq-public-version': '2.0',
};

async function abrirApp(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof (window as any).clearLocalProgress === 'function');
}

test.describe('Isolamento de conta no mesmo aparelho', () => {
  test('a saída de uma conta não deixa nenhum dado pedagógico para a próxima', async ({ page }) => {
    await abrirApp(page);

    const sobreviventes = await page.evaluate((dados) => {
      for (const [chave, valor] of Object.entries(dados)) localStorage.setItem(chave, valor);
      (window as any).clearLocalProgress();
      return Object.keys(dados).filter((chave) => {
        const value = localStorage.getItem(chave);
        // The canonical key retains only a JSON null reset marker, never data.
        if (chave !== 'nefroquest-save-v7') return value !== null;
        const marker = JSON.parse(value || '{}');
        return marker.save !== null || 'character' in marker || 'forjaPending' in marker || 'gold' in marker;
      });
    }, CHAVES_DE_CONTA);

    expect(sobreviventes, `estas chaves de conta sobreviveram ao logout: ${sobreviventes.join(', ')}`).toEqual([]);
  });

  test('a pontuação pendente da conta anterior não pode ser publicada pela próxima', async ({ page }) => {
    await abrirApp(page);

    const pendente = await page.evaluate(() => {
      localStorage.setItem('nq-pending-leaderboard', JSON.stringify({ score: 7300, player_name: 'Conta Anterior' }));
      (window as any).clearLocalProgress();
      return localStorage.getItem('nq-pending-leaderboard');
    });

    expect(pendente, 'pontuação pendente sobrevivendo ao logout entra no ranking pela conta errada').toBeNull();
  });

  test('as preferências do aparelho sobrevivem — trocar de conta não devolve o som no máximo', async ({ page }) => {
    await abrirApp(page);

    const perdidas = await page.evaluate((dados) => {
      for (const [chave, valor] of Object.entries(dados)) localStorage.setItem(chave, valor);
      (window as any).clearLocalProgress();
      return Object.entries(dados)
        .filter(([chave, valor]) => localStorage.getItem(chave) !== valor)
        .map(([chave]) => chave);
    }, CHAVES_DE_APARELHO);

    expect(perdidas, `estas preferências do aparelho foram apagadas indevidamente: ${perdidas.join(', ')}`).toEqual([]);
  });

  test('versão das preferências de áudio pertence ao aparelho e sobrevive à limpeza de conta', async ({ page }) => {
    await abrirApp(page);
    const result = await page.evaluate(() => {
      const key = 'nefroquest-audio-preferences-version';
      localStorage.setItem(key, '99.0');
      localStorage.setItem('nefroquest-music', 'off');
      localStorage.setItem('nefroquest-music-vol', '0');
      (window as any).clearLocalProgress();
      return {
        classified: ((window as any).NQ_DEVICE_KEYS as string[]).includes(key),
        marker: localStorage.getItem(key),
        enabled: localStorage.getItem('nefroquest-music'),
        volume: localStorage.getItem('nefroquest-music-vol'),
      };
    });
    expect(result).toEqual({ classified: true, marker: '99.0', enabled: 'off', volume: '0' });
  });

  test('nenhuma chave do app fica fora da classificação conta/aparelho', async ({ page }) => {
    await abrirApp(page);

    // Um inventário que não acompanha o código é pior que nenhum: a chave nova
    // de amanhã entra sem ninguém decidir se ela pertence à conta ou ao
    // aparelho, e o vazamento volta calado. Aqui a falha é ruidosa.
    const naoClassificadas = await page.evaluate(({ conta, aparelho }) => {
      const conhecidas = new Set([...Object.keys(conta), ...Object.keys(aparelho)]);
      for (const chave of Object.keys(conta)) localStorage.setItem(chave, '1');
      for (const chave of Object.keys(aparelho)) localStorage.setItem(chave, '1');
      return Object.keys(localStorage).filter((chave) => {
        if (conhecidas.has(chave)) return false;
        // Ignora o que não é do app (extensões, Supabase, Sentry).
        return /^(nefroquest|nq[-_])/i.test(chave);
      });
    }, { conta: CHAVES_DE_CONTA, aparelho: CHAVES_DE_APARELHO });

    expect(
      naoClassificadas,
      `chaves do app sem classificação conta/aparelho: ${naoClassificadas.join(', ')} — decida a qual metade pertencem e acrescente à lista deste teste`,
    ).toEqual([]);
  });
});

test('save canônico da conta A não fica acessível à conta B nem ao visitante', async ({ page }) => {
  await abrirApp(page);
  const result = await page.evaluate(() => {
    const protectedSave = JSON.stringify({
      schemaVersion: 7, saveOwner: 'owner-A', saveRevision: 'test-revision',
      character: 'glomerulus', gold: 4700, lives: 3,
      forjaPending: { slot: 'weapon', novo: {n:'Item da conta A'}, atual: {n:'Anterior'} },
    });
    localStorage.setItem('nefroquest-save-v7', protectedSave);
    localStorage.setItem('nefroquest-save', protectedSave);
    (0, eval)("authUser = {id:'owner-B'}");
    const other = (0, eval)('loadGame()');
    (0, eval)('authUser = null');
    const guest = (0, eval)('loadGame()');
    (0, eval)("authUser = {id:'owner-A'}");
    const own = (0, eval)('loadGame()');
    return { other, guest, own, raw: localStorage.getItem('nefroquest-save-v7') };
  });
  expect(result.other).toBeNull();
  expect(result.guest).toBeNull();
  expect(result.own.forjaPending.novo.n).toBe('Item da conta A');
  expect(JSON.parse(result.raw!).saveOwner).toBe('owner-A');
  await expect(page.locator('#nqSaveRecovery')).toHaveCount(0);
});

test('logout de visitante sem SDK encerra estado e timers sem apagar preferências', async ({ page }) => {
  await abrirApp(page);
  const result = await page.evaluate(async () => {
    localStorage.setItem('nefroquest-music-vol', '0.17');
    (0, eval)("_supaClient = null; _guestMode = true; state.gameStarted = true; state.character = 'glomerulus'; state.gold = 4700; state.forjaPending = {slot:'weapon',novo:{n:'Pago'},atual:{n:'Anterior'}}; saveGame()");
    await (window as any).authLogout();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      save: JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null'),
      legacy: localStorage.getItem('nefroquest-save'),
      started: (0, eval)('state.gameStarted'),
      pending: (0, eval)('state.forjaPending'),
      gold: (0, eval)('state.gold'),
      music: localStorage.getItem('nefroquest-music-vol'),
      timers: (0, eval)('[_autoSaveTimer,_saveTimer,_cloudSyncTimer,_cloudLoadSyncTimer]'),
    };
  });
  expect(result.save).toMatchObject({save:null,saveOwner:null,resetReason:'logout'});
  const {save: marker, ...rest} = result;
  expect(rest).toEqual({ legacy:null, started:false, pending:null, gold:0, music:'0.17', timers:[null,null,null,null] });
  await expect(page.locator('#forjaPage')).toHaveCount(0);
});

test('resposta de nuvem atrasada após logout não recria save nem histórico', async ({ page }) => {
  await abrirApp(page);
  await page.evaluate(() => {
    (0, eval)("authUser = {id:'owner-A'}");
    (window as any).__cloudResolve = null;
    (0, eval)(`_supaClient = {from: () => ({select: () => ({eq: () => ({single: () => new Promise(resolve => {window.__cloudResolve = resolve;})})})})}`);
    (window as any).__cloudLoad = (0, eval)('_loadProgressFromCloud()');
  });
  const result = await page.evaluate(async () => {
    (window as any).clearLocalProgress();
    (0, eval)("authUser = {id:'owner-B'}");
    (window as any).__cloudResolve({data:{game_progress:{
      stats:{bestScore:9999}, achievements:['owner-A-badge'],
      save:{schemaVersion:6,character:'glomerulus',gold:5000,timestamp:Date.now()+10000}
    }}});
    await (window as any).__cloudLoad;
    return {
      save:JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null'),
      stats:localStorage.getItem('nefroquest-stats'),
      achievements:localStorage.getItem('nefroquest-achievements'),
      timer:(0, eval)('_cloudLoadSyncTimer')
    };
  });
  expect(result.save).toMatchObject({save:null,saveOwner:'owner-A',resetReason:'reset'});
  const {save: marker, ...rest} = result;
  expect(rest).toEqual({stats:null,achievements:null,timer:null});
});

async function abrirComSDKMock(page: Page, initialUser: any = null) {
  await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
  await page.addInitScript(initialUser => {
    const fixture: any = (window as any).__sdkFixture = {initialUser, callback:null, profiles:{}, uploads:[], reads:[], signOutCalls:0, nextUser:null};
    const client = {
      auth: {
        onAuthStateChange: (callback: any) => { fixture.callback = callback; return {data:{subscription:{unsubscribe(){}}}}; },
        getSession: async () => ({data:{session:fixture.initialUser ? {user:fixture.initialUser} : null}}),
        signOut: async () => {
          ++fixture.signOutCalls;
          if (fixture.holdSignOut) await new Promise(resolve => {fixture.finishSignOut = resolve;});
          await fixture.callback('SIGNED_OUT', null); return {error:null};
        },
        signInWithPassword: async () => { await fixture.callback('SIGNED_IN', {user:fixture.nextUser}); return {error:null}; },
      },
      from: (table: string) => ({
        select: (columns: string) => ({eq: (_key: string, owner: string) => ({
          single: async () => {
            fixture.reads.push({table,columns,owner});
            if (columns === 'game_progress' && fixture.profileError) return {data:null,error:{message:'Mock profile error'}};
            if (columns === 'game_progress' && fixture.profileMissing) return {data:null,error:null};
            return {data:columns==='game_progress' ? {game_progress:fixture.profiles[owner] || null} : {is_premium:false},error:null};
          },
          maybeSingle: async () => ({data:null}),
        })}),
        update: (payload: any) => ({eq: async (_key: string, owner: string) => {fixture.uploads.push({owner,payload}); return {error:null};}}),
      }),
    };
    (window as any).supabase = {createClient: () => client};
  }, initialUser);
  await abrirApp(page);
  await page.waitForFunction(() => !!(window as any).__sdkFixture?.callback);
}

const USER_A = {id:'owner-A',email:'a@test.invalid',app_metadata:{},user_metadata:{nickname:'Conta A'}};
const USER_B = {id:'owner-B',email:'b@test.invalid',app_metadata:{},user_metadata:{nickname:'Conta B'}};
const CLOUD_B = {schemaVersion:7,saveOwner:'owner-B',saveRevision:'cloud-B',character:'aquaria',gold:876,lives:4,level:3,timestamp:Date.now()+10000};

test('troca SDK encerra detalhe de conquista da conta anterior e mantém apenas o progresso de B', async ({ page }) => {
  await abrirComSDKMock(page);
  await injectGameState(page, { correctTotal: 32 }, { authUser: USER_A });
  await page.evaluate(() => {
    localStorage.setItem('nefroquest-achievements', JSON.stringify(['century_club']));
    localStorage.setItem('nefroquest-badge-history', JSON.stringify({ 2: { jornada: 1 } }));
    localStorage.setItem('nefroquest-journey-count', '3');
    (window as any).openDashboard({ tab: 'achievements' });
  });
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible();
  await page.getByRole('button', { name: /^Sábio do Microscópio.*40 acertos.*ampliar arte e requisito$/ }).click();
  const detail = page.getByRole('dialog', { name: 'Sábio do Microscópio' });
  await expect(detail).toContainText('desde a 1ª jornada');
  await expect(detail.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '32');

  await page.evaluate(async ({ user, save }) => {
    (window as any).__hiddenFocus = [];
    document.addEventListener('focusin', event => {
      const target = event.target as HTMLElement;
      if (target.closest('[hidden], [inert], .hidden')) (window as any).__hiddenFocus.push(target.id || target.className);
    });
    (window as any).__sdkFixture.profiles[user.id] = { save, achievements: ['first_blood'] };
    await (window as any).__sdkFixture.callback('SIGNED_IN', { user });
  }, { user: USER_B, save: { ...CLOUD_B, correctTotal: 7 } });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.saveOwner === 'owner-B');
  await expect(detail).toHaveCount(0);
  await expect(page.locator('#nqDashboard')).toHaveCount(0);
  expect(await page.evaluate(() => ({
    hiddenFocus: (window as any).__hiddenFocus,
    modalOpen: !!document.querySelector('dialog:modal'),
    save: JSON.parse(localStorage.getItem('nefroquest-save-v7')!),
    achievements: JSON.parse(localStorage.getItem('nefroquest-achievements')!),
    badgeHistory: localStorage.getItem('nefroquest-badge-history'),
  }))).toMatchObject({
    hiddenFocus: [], modalOpen: false,
    save: { saveOwner: 'owner-B', correctTotal: 7 },
    achievements: ['first_blood'], badgeHistory: null,
  });
  await page.evaluate(() => (window as any).openDashboard({ tab: 'achievements' }));
  await expect(page.locator('#nqDashboard[data-dashboard-state="ready"]')).toBeVisible();
  const badge = page.getByRole('button', { name: /^Sábio do Microscópio.*40 acertos.*ampliar arte e requisito$/ });
  await badge.click();
  await expect(detail).not.toContainText('desde a 1ª jornada');
  await expect(detail.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '7');
  await detail.getByRole('button', { name: 'Voltar à coleção' }).click();
  await expect(badge).toBeFocused();
});

test('callback SDK A→B limpa o histórico de A, importa e envia somente o save de B', async ({ page }) => {
  await abrirComSDKMock(page);
  await page.clock.install();
  await page.evaluate(async ({a,b,saveB}) => {
    (window as any).authUser = a;
    localStorage.setItem('nefroquest-save-v7', JSON.stringify({...saveB,saveOwner:a.id,character:'glomerulus',gold:4700}));
    localStorage.setItem('nefroquest-stats', JSON.stringify({bestScore:9999}));
    localStorage.setItem('nefroquest-achievements', JSON.stringify(['A-only']));
    localStorage.setItem('nq-bib-favorites', JSON.stringify(['A-private']));
    (window as any).__sdkFixture.profiles[b.id] = {save:saveB,stats:{bestScore:42},achievements:['B-only']};
    await (window as any).__sdkFixture.callback('SIGNED_IN', {user:b});
  }, {a:USER_A,b:USER_B,saveB:CLOUD_B});
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.saveOwner === 'owner-B');
  await page.clock.fastForward(2200);
  const result = await page.evaluate(() => ({
    save:JSON.parse(localStorage.getItem('nefroquest-save-v7')!),
    stats:JSON.parse(localStorage.getItem('nefroquest-stats')!),
    achievements:JSON.parse(localStorage.getItem('nefroquest-achievements')!),
    favorites:localStorage.getItem('nq-bib-favorites'),
    uploads:(window as any).__sdkFixture.uploads,
  }));
  expect(result.save).toMatchObject({saveOwner:'owner-B',character:'aquaria',gold:876});
  expect(result.stats.bestScore).toBe(42);
  expect(result.achievements).toEqual(['B-only']);
  expect(result.favorites).toBeNull();
  expect(result.uploads).toHaveLength(1);
  expect(result.uploads[0].owner).toBe('owner-B');
  expect(result.uploads[0].payload.game_progress.save).toMatchObject({saveOwner:'owner-B',gold:876});
  expect(result.uploads[0].payload.game_progress.achievements).toEqual(['B-only']);
});

test('falha de todas as gravações limpa histórico privado e cancela logout antes do SDK', async ({ page }) => {
  await abrirComSDKMock(page);
  const result = await page.evaluate(async user => {
    (window as any).authUser = user;
    const paidRaw = JSON.stringify({schemaVersion:7,saveOwner:user.id,character:'glomerulus',gold:4700,forjaPending:{novo:{n:'Pago'}}});
    localStorage.setItem('nefroquest-save-v7', paidRaw);
    localStorage.setItem('nefroquest-stats', '{"bestScore":9999}');
    localStorage.setItem('nq-bib-favorites', '["A-private"]');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function() {throw new DOMException('Todas as gravações falham','QuotaExceededError');};
    try {
      const logout = await (window as any).authLogout();
      const blockedSave = (0, eval)('loadGame()');
      await (0, eval)('_syncProgressToCloud()');
      return {
        logout,owner:(window as any).authUser?.id,signOutCalls:(window as any).__sdkFixture.signOutCalls,
        stats:localStorage.getItem('nefroquest-stats'),favorites:localStorage.getItem('nq-bib-favorites'),
        raw:localStorage.getItem('nefroquest-save-v7'),paidRaw,blockedSave,uploads:(window as any).__sdkFixture.uploads,
      };
    } finally {Storage.prototype.setItem = original;}
  }, USER_A);
  expect(result.logout).toBe(false);
  expect(result.owner).toBe('owner-A');
  expect(result.signOutCalls).toBe(0);
  expect(result.stats).toBeNull();
  expect(result.favorites).toBeNull();
  expect(result.raw).toBe(result.paidRaw);
  expect(result.blockedSave).toBeNull();
  expect(result.uploads).toEqual([]);
});

test('logout com falha do SDK não restaura sessão inicial sem novo login explícito', async ({ page }) => {
  await abrirComSDKMock(page, USER_A);
  await page.evaluate(() => (window as any).clearLocalProgress('logout'));
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__sdkFixture?.callback);
  await page.evaluate(async user => {
    await (window as any).__sdkFixture.callback('INITIAL_SESSION',{user});
  }, USER_A);
  expect(await page.evaluate(() => (window as any).authUser)).toBeNull();
  expect(await page.evaluate(() => (window as any).__sdkFixture.reads.filter((x:any)=>x.columns==='game_progress'))).toEqual([]);
  await page.evaluate(user => {
    (window as any).__sdkFixture.nextUser = user;
    (window as any).__sdkFixture.profiles[user.id] = {save:{schemaVersion:6,character:'glomerulus',gold:123,lives:3,timestamp:Date.now()+10000}};
    document.getElementById('authEmail')!.setAttribute('value', user.email);
    (document.getElementById('authEmail') as HTMLInputElement).value = user.email;
    (document.getElementById('authPassword') as HTMLInputElement).value = 'mock-only-password';
  }, USER_A);
  await page.evaluate(() => (window as any).authEmailLogin());
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.character === 'glomerulus');
  expect(await page.evaluate(() => (window as any).authUser?.id)).toBe('owner-A');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!).gold)).toBe(123);
});

test('nova jornada do mesmo dono bloqueia nuvem antiga sem enviar save null de volta', async ({ page }) => {
  await abrirComSDKMock(page);
  await page.clock.install();
  await page.evaluate(async user => {
    (window as any).authUser = user;
    (0, eval)('deleteSave()');
    // Isolate the loader's follow-up upload from the explicit new-game sync.
    (0, eval)('clearTimeout(_cloudSyncTimer); _cloudSyncTimer = null');
    (window as any).__sdkFixture.profiles[user.id] = {save:{schemaVersion:6,character:'glomerulus',gold:9000,lives:3,timestamp:Date.now()+10000}};
    await (0, eval)('_loadProgressFromCloud()');
  }, USER_A);
  await page.clock.fastForward(12000);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!).resetReason)).toBe('journey');
  expect(await page.evaluate(() => (0, eval)('loadGame()'))).toBeNull();
  expect(await page.evaluate(() => (window as any).__sdkFixture.uploads)).toEqual([]);
});

test('signOut pendente não envia tombstone ou histórico vazio e novo login restaura a própria conta', async ({ page }) => {
  await abrirComSDKMock(page);
  await page.clock.install();
  await page.evaluate(user => {
    (window as any).authUser = user;
    localStorage.setItem('nefroquest-save-v7',JSON.stringify({schemaVersion:7,saveOwner:user.id,character:'glomerulus',gold:4700,lives:3}));
    (window as any).__sdkFixture.holdSignOut = true;
    (window as any).__logoutPending = (window as any).authLogout();
  }, USER_A);
  await page.evaluate(async () => {
    await (0, eval)('_syncProgressToCloud()');
    (0, eval)('_scheduleCloudSync()');
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('beforeunload'));
  });
  await page.clock.fastForward(12000);
  expect(await page.evaluate(() => (window as any).__sdkFixture.uploads)).toEqual([]);
  expect(await page.evaluate(() => (window as any).__sdkFixture.signOutCalls)).toBe(1);
  await page.evaluate(async () => {
    (window as any).__sdkFixture.finishSignOut();
    await (window as any).__logoutPending;
  });
  await page.evaluate(user => {
    (window as any).__sdkFixture.nextUser = user;
    (window as any).__sdkFixture.profiles[user.id] = {save:{schemaVersion:6,character:'glomerulus',gold:123,lives:3,timestamp:Date.now()+10000}};
    (document.getElementById('authEmail') as HTMLInputElement).value = user.email;
    (document.getElementById('authPassword') as HTMLInputElement).value = 'mock-only-password';
  }, USER_A);
  await page.evaluate(() => (window as any).authEmailLogin());
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.character === 'glomerulus');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!).gold)).toBe(123);
});

test('login com nuvem vazia permite estudo sem jornada e mantém sessão no reload', async ({ page }) => {
  await abrirComSDKMock(page, USER_A);
  await page.evaluate(() => (window as any).clearLocalProgress('logout'));
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__sdkFixture?.callback);
  await page.clock.install();
  await page.evaluate(user => {
    (window as any).__sdkFixture.nextUser = user;
    (document.getElementById('authEmail') as HTMLInputElement).value = user.email;
    (document.getElementById('authPassword') as HTMLInputElement).value = 'mock-only-password';
  }, USER_A);
  await page.evaluate(() => (window as any).authEmailLogin());
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nefroquest-save-v7') || 'null')?.resetReason === 'empty');
  await page.evaluate(async () => {
    localStorage.setItem('nefroquest-stats','{"bestScore":42,"questionsAnsweredAllTime":1}');
    (0, eval)('_invalidateStatsCache()');
    await (0, eval)('_syncProgressToCloud()');
  });
  const uploads = await page.evaluate(() => (window as any).__sdkFixture.uploads);
  expect(uploads).toHaveLength(1);
  expect(uploads[0].owner).toBe('owner-A');
  expect(uploads[0].payload.game_progress.save).toBeNull();
  expect(uploads[0].payload.game_progress.stats.questionsAnsweredAllTime).toBe(1);
  await page.reload();
  await page.waitForFunction(() => (window as any).authUser?.id === 'owner-A');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!).resetReason)).toBe('empty');
});

for (const failure of ['profileError','profileMissing']) {
  test(`login com ${failure} preserva marcador logout e não envia estado vazio`, async ({ page }) => {
    await abrirComSDKMock(page, USER_A);
    await page.evaluate(() => (window as any).clearLocalProgress('logout'));
    await page.reload();
    await page.waitForFunction(() => !!(window as any).__sdkFixture?.callback);
    await page.clock.install();
    await page.evaluate(({user,failure}) => {
      (window as any).__sdkFixture[failure] = true;
      (window as any).__sdkFixture.nextUser = user;
      (document.getElementById('authEmail') as HTMLInputElement).value = user.email;
      (document.getElementById('authPassword') as HTMLInputElement).value = 'mock-only-password';
    }, {user:USER_A,failure});
    await page.evaluate(() => (window as any).authEmailLogin());
    await page.clock.fastForward(12000);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!).resetReason)).toBe('logout');
    expect(await page.evaluate(() => (window as any).__sdkFixture.uploads)).toEqual([]);
  });
}

test('visitante com Forja paga só passa à conta após escolha explícita, sem sync prévio', async ({ page }) => {
  await abrirComSDKMock(page);
  await page.clock.install();
  await page.setViewportSize({width:320,height:700});
  await page.evaluate(() => {document.documentElement.style.fontSize = '32px';});
  const fixture = await page.evaluate(async user => {
    const oldItem = {n:'Arma anterior',rar:'common',atk:1,def:2,kno:3,luck:4};
    const newItem = {n:'Arma paga do visitante',rar:'common',atk:2,def:0,kno:0,luck:0};
    const empty = {n:'Vazio',rar:'common',atk:0,def:0,kno:0,luck:0};
    const paid = {
      schemaVersion:7,saveOwner:null,saveRevision:'guest-paid',character:'glomerulus',
      gold:4700,lives:3,level:5,xp:150,score:2500,timestamp:Date.now(),
      equipment:{helmet:empty,glove:empty,armor:empty,weapon:oldItem,relic:empty,boot:empty},
      obtainedItems:[oldItem.n,newItem.n],
      forjaPending:{id:'guest-paid-choice',tipo:'comum',custo:300,slot:'weapon',novo:newItem,atual:oldItem},
    };
    const raw = JSON.stringify(paid);
    localStorage.setItem('nefroquest-save-v7',raw);
    localStorage.setItem('nefroquest-save',raw);
    (window as any).__sdkFixture.profiles[user.id] = {save:{schemaVersion:6,character:'aquaria',gold:9999,lives:4,timestamp:Date.now()+10000}};
    await (window as any).__sdkFixture.callback('SIGNED_IN',{user});
    return {paid,raw};
  }, USER_A);
  await expect(page.locator('#nqSaveRecovery')).toBeVisible();
  const clipped = await page.locator('#nqSaveRecovery').evaluate(dialog => {
    const failures: string[] = [];
    for (const element of dialog.querySelectorAll('h2,p,button')) {
      const range = document.createRange(); range.selectNodeContents(element);
      for (const box of range.getClientRects()) {
        if (box.width && (box.left < -1 || box.right > innerWidth + 1)) failures.push(element.tagName);
      }
    }
    return failures;
  });
  expect(clipped, 'texto/CTA da recuperação ultrapassou 320px a 200%').toEqual([]);
  await expect(page.getByRole('button',{name:'Usar jornada deste aparelho nesta conta',exact:true})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:'Usar jornada da conta',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Usar jornada deste aparelho nesta conta',exact:true})).toBeFocused();
  await page.clock.fastForward(12000);
  expect(await page.evaluate(() => localStorage.getItem('nefroquest-save-v7'))).toBe(fixture.raw);
  expect(await page.evaluate(() => (window as any).__sdkFixture.uploads)).toEqual([]);
  expect(await page.evaluate(() => (window as any).__sdkFixture.reads.filter((r:any)=>r.columns==='game_progress'))).toEqual([]);
  await page.getByRole('button',{name:'Usar jornada deste aparelho nesta conta',exact:true}).click();
  // Continue's focus/Forja handoff uses a 520ms timer.
  await page.clock.fastForward(800);
  await expect(page.locator('#forjaPage')).toBeVisible();
  const adopted = await page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save-v7')!));
  expect(adopted.saveOwner).toBe('owner-A');
  expect(adopted.gold).toBe(fixture.paid.gold);
  expect(adopted.forjaPending).toEqual(fixture.paid.forjaPending);
  expect(adopted.equipment).toEqual(fixture.paid.equipment);
  expect(await page.evaluate(() => (window as any).__sdkFixture.reads.filter((r:any)=>r.columns==='game_progress'))).toEqual([]);
});
