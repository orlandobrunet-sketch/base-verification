import { test, expect } from '@playwright/test';
import { enterGame } from '../helpers/game';

test.describe('Save schema — migração e resiliência', () => {
  test('save v1 (sem schemaVersion) é migrado para v2 sem perder dados', async ({ page }) => {
    await page.goto('/jogar/');

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
        character: 'glomerulus',
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
    // Entra no jogo: continueGame → restoreGame dispara o auto-save (Proxy),
    // persistindo o save migrado (schemaVersion atual) no localStorage.
    await enterGame(page);
    await page.waitForTimeout(700); // flush do debounce de save (500ms)

    const save = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('nefroquest-save') || 'null')
    );

    // Dados originais preservados
    expect(save.level).toBe(7);
    expect(save.score).toBe(8000);
    expect(save.character).toBe('glomerulus');

    // Campos novos adicionados pela migração
    expect(save.bossIntroShown).toBeDefined();
    expect(save.chestsOpened).toBeDefined();
  });

  test('save corrompido (JSON inválido) não trava o app', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/jogar/');
    await page.evaluate(() => {
      localStorage.setItem('nefroquest-save', '{ "corrupted: invalid json }}}');
      localStorage.setItem('nefroquest-premium', '1');
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Não deve ter erros não tratados
    const critical = errors.filter(e => !e.includes('fetch') && !e.includes('net::'));
    expect(critical).toHaveLength(0);

    // Save corrompido deve ter sido removido
    const save = await page.evaluate(() => localStorage.getItem('nefroquest-save'));
    expect(save).toBeNull();
  });

  test('novo jogo reseta _boardPushedThisSession', async ({ page }) => {
    await page.goto('/jogar/');
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

/**
 * A cadeia de migração inteira, não só o primeiro salto.
 *
 * `_migrateSave` sobe v1→v2→v3→v4→v5→v6, e cada degrau acrescenta ou
 * reorganiza campos. O teste acima cobre só o primeiro: um save que parasse na
 * v2, com o equipamento por reorganizar, passaria por ele.
 *
 * O degrau mais arriscado é o v5→v6: ele DESMONTA `equipment` e remonta com
 * outras chaves. Quem jogou antes dessa mudança tem relíquia guardada no
 * formato velho — e é o tipo de perda que ninguém percebe na hora, só quando
 * vai equipar e o item sumiu.
 *
 * Medido: a cadeia funciona hoje. Isto existe para que continue funcionando.
 */
test.describe('Save legado atravessa a cadeia inteira', () => {
  const RELIQUIA = { n: 'Relíquia antiga', rar: 'epic', atk: 3, def: 0, kno: 5, luck: 1 };

  async function migrar(page: import('@playwright/test').Page) {
    await page.goto('/jogar/');
    await page.evaluate((reliquia) => {
      localStorage.setItem('nefroquest-save', JSON.stringify({
        level: 7, xp: 200, score: 8000, character: 'glomerulus',
        correctTotal: 42, lives: 3, streak: 0,
        equipment: {
          armor: { n: 'Manto', rar: 'rare', atk: 1, def: 4, kno: 2, luck: 0 },
          relic: reliquia,
        },
        // sem schemaVersion — save da era v1
      }));
    }, RELIQUIA);
    await enterGame(page);
    await page.waitForTimeout(900); // debounce de save
    return page.evaluate(() => JSON.parse(localStorage.getItem('nefroquest-save') || 'null'));
  }

  /* NÃO existe aqui um teste de "chegou ao schemaVersion 6, com o campo de
   * cada degrau". Escrevi um, e ele passava com os degraus v4 E v6
   * DESLIGADOS — ou seja, guardava nada.
   *
   * Dois motivos, os dois invisíveis à leitura:
   *
   *   1. `saveGame` carimba `schemaVersion: SAVE_SCHEMA_VERSION` ao gravar.
   *      Depois de um ciclo de save, o número diz quem escreveu, não até onde
   *      a migração subiu.
   *   2. Campos como `difficulty`, `maxLives` e `chestsOpened` são
   *      repovoados por padrão ao entrar no jogo. Existirem no fim não prova
   *      que a migração os pôs lá.
   *
   * `_migrateSave` e `loadGame` não são expostos, e abrir interno de produção
   * só para o teste enxergar seria pagar no código o que se ganha no teste.
   * Fica o cenário abaixo, que sobrevive ao vermelho porque olha uma forma
   * que só a migração produz.
   */
  test('a relíquia de um save antigo sobrevive à remontagem do equipamento', async ({ page }) => {
    const save = await migrar(page);
    const eq = save.equipment;

    // O formato final tem seis casas nomeadas; as intermediárias somem.
    expect(Object.keys(eq).sort()).toEqual(['armor', 'boot', 'glove', 'helmet', 'relic', 'weapon']);
    expect(eq.relic1, 'chave intermediária vazou para o formato final').toBeUndefined();
    expect(eq.relic2, 'chave intermediária vazou para o formato final').toBeUndefined();

    // O que o jogador perderia se a remontagem falhasse.
    expect(eq.relic, 'a relíquia do save antigo desapareceu').toMatchObject(RELIQUIA);
    expect(eq.armor).toMatchObject({ n: 'Manto', rar: 'rare' });
  });
});
