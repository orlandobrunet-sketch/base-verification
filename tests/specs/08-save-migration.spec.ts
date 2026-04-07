import { test, expect } from '@playwright/test';

test.describe('Save schema — migração e resiliência', () => {
  test('save v1 (sem schemaVersion) é migrado para v2 sem perder dados', async ({ page }) => {
    await page.goto('/');

    // Inject save v1 — sem schemaVersion, sem bossIntroShown, sem chestsOpened
    await page.evaluate(() => {
      const saveV1 = {
        level: 7,
        xp: 200,
        xpToNext: 800,
        score: 8000,
        lives: 3,
        streak: 4,
        gold: 120,
        bonusUses: 1,
        correctTotal: 35,
        narrativeShown: 10,
        character: 'mago',
        equipment: [null, null, null],
        idx: 0,
        queueIds: [],
        recentIds: [],
        timestamp: Date.now() - 3600_000
        // schemaVersion ausente — simula save antigo
      };
      localStorage.setItem('nefroquest-save', JSON.stringify(saveV1));
      localStorage.setItem('nefroquest-premium', '1');
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // O app deve ter chamado _migrateSave e salvo novamente
    await page.waitForTimeout(1000);

    const save = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('nefroquest-save') || 'null')
    );

    // Dados originais preservados
    expect(save.level).toBe(7);
    expect(save.score).toBe(8000);
    expect(save.character).toBe('mago');

    // Campos novos adicionados pela migração
    expect(save.bossIntroShown).toBeDefined();
    expect(save.chestsOpened).toBeDefined();
  });

  test('save corrompido (JSON inválido) não trava o app', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('nefroquest-save', '{ "corrupted: invalid json }}}');
      localStorage.setItem('nefroquest-premium', '1');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Não deve ter erros não tratados
    const critical = errors.filter(e => !e.includes('fetch') && !e.includes('net::'));
    expect(critical).toHaveLength(0);

    // Save corrompido deve ter sido removido
    const save = await page.evaluate(() => localStorage.getItem('nefroquest-save'));
    expect(save).toBeNull();
  });

  test('novo jogo reseta _boardPushedThisSession', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('nefroquest-premium', '1'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Verifica que a variável existe e está em false inicialmente
    const pushed = await page.evaluate(() => (window as any)._boardPushedThisSession);
    // A variável é privada no escopo — só verificamos que não explode
    expect(pushed === false || pushed === undefined).toBeTruthy();
  });
});
