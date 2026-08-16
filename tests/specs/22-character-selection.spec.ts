import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Página 6 — Escolha de Classe (Lúmen)
 *
 * A seleção de personagem é a primeira decisão irreversível da jornada e, até
 * a v14.51, era servida na moldura do baú de recompensa (`chest-modal`).
 * Esta suíte fixa dois grupos de contrato:
 *
 *  1. o que já existia e NÃO pode regredir — as três classes, seus bônus
 *     reais (consumidos por total() em js/game.js) e o encadeamento
 *     escolha → intro → início da jornada, acionado de três pontos;
 *  2. o que o redesign passa a exigir — retrato imediato (não lazy), título
 *     único por classe entre card e narrativa, operação por teclado,
 *     360×800 sem vazamento e ausência de violação séria de acessibilidade.
 */

/** Abre a escolha de classe pelo caminho real: dificuldade confirmada. */
async function openCharSelect(page: Page) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any)._confirmDiff === 'function');
  await page.evaluate(() => {
    (window as any)._pendingDiff = 'normal';
    (window as any)._confirmDiff(false);
  });
  await expect(page.locator('#charSelectModal')).toBeVisible();
}

test.describe('Escolha de Classe', () => {
  test('apresenta exatamente as três classes da jornada', async ({ page }) => {
    await openCharSelect(page);
    const cards = page.locator('#charSelectModal [data-action="selectCharacter"]');
    await expect(cards).toHaveCount(3);
    const ids = await cards.evaluateAll(els => els.map(e => e.getAttribute('data-arg')));
    expect(ids.sort()).toEqual(['aquaria', 'glomerulus', 'nephros']);
  });

  test('o retrato de cada classe chega imediatamente, sem carregamento tardio', async ({ page }) => {
    await openCharSelect(page);
    const portraits = page.locator('#charSelectModal [data-action="selectCharacter"] img');
    await expect(portraits).toHaveCount(3);

    // A primeira imagem que decide a escolha não pode depender de scroll.
    const lazy = await portraits.evaluateAll(imgs =>
      imgs.filter(i => (i as HTMLImageElement).loading === 'lazy').map(i => (i as HTMLImageElement).src)
    );
    expect(lazy).toEqual([]);

    await expect.poll(async () =>
      portraits.evaluateAll(imgs => imgs.every(i => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0)),
      { timeout: 15_000 }
    ).toBe(true);
  });

  // Caixa-preta: o título que o card promete tem de ser o título que a narrativa
  // entrega. Antes da v14.51 glomerulus era "Cientista Renal" no card e
  // "Lâmina dos Glomérulos" na intro (js/boss.js CHARACTER_INTROS).
  for (const id of ['nephros', 'aquaria', 'glomerulus']) {
    test(`o título de ${id} é o mesmo no card e na narrativa de abertura`, async ({ page }) => {
      await openCharSelect(page);
      const card = page.locator(`#charSelectModal [data-arg="${id}"]`);
      const titulo = (await card.locator('[data-char-title]').innerText()).trim();
      expect(titulo.length, 'o card precisa declarar um título').toBeGreaterThan(0);

      await card.click();
      await expect(page.locator('#charIntroOverlay')).toContainText(titulo);
    });
  }

  // Fonte de verdade: o objeto `characters` em js/game.js (bônus consumidos por
  // total(), que alimenta XP, ouro, sorteio de item, dano ao boss e escudo).
  const BONUS_ESPERADO: Record<string, string[]> = {
    nephros: ['Conhecimento'],
    aquaria: ['Defesa'],
    glomerulus: ['Ataque', 'Conhecimento'],
  };

  test('cada card declara o bônus que a mecânica realmente aplica', async ({ page }) => {
    await openCharSelect(page);
    for (const [id, rotulos] of Object.entries(BONUS_ESPERADO)) {
      const card = page.locator(`#charSelectModal [data-arg="${id}"]`);
      for (const rotulo of rotulos) await expect(card).toContainText(rotulo);
    }
  });

  test('escolher uma classe registra o personagem e abre a narrativa de início', async ({ page }) => {
    await openCharSelect(page);
    await page.locator('#charSelectModal [data-arg="aquaria"]').click();

    await expect(page.locator('#charSelectModal')).not.toBeVisible();
    await expect(page.locator('#charIntroOverlay')).toBeVisible();
    expect(await page.evaluate(() => (window as any).state?.character)).toBe('aquaria');
    await expect(page.locator('#charIntroOverlay')).toContainText('Iniciar Jornada');
  });

  test('é inteiramente operável por teclado, com foco visível', async ({ page }) => {
    await openCharSelect(page);
    const cards = page.locator('#charSelectModal [data-action="selectCharacter"]');

    for (let i = 0; i < 3; i++) {
      const alcancavel = await cards.nth(i).evaluate(el => {
        const t = el.getAttribute('tabindex');
        return el.matches('button, a[href], input, select, textarea') || (t !== null && Number(t) >= 0);
      });
      expect(alcancavel, `card ${i} precisa ser alcançável por teclado`).toBe(true);
    }

    await cards.first().focus();
    const anel = await cards.first().evaluate(el => {
      const s = getComputedStyle(el);
      return s.outlineStyle !== 'none' || s.boxShadow !== 'none';
    });
    expect(anel, 'o card focado precisa de indicação visível').toBe(true);

    await page.keyboard.press('Enter');
    await expect(page.locator('#charIntroOverlay')).toBeVisible();
  });

  test('em 360×800 nada vaza horizontalmente e os alvos têm 44px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openCharSelect(page);

    const vazou = await page.locator('#charSelectModal').evaluate(el => el.scrollWidth > el.clientWidth + 1);
    expect(vazou, 'a escolha de classe não pode rolar horizontalmente em 360px').toBe(false);

    const pequenos = await page.locator('#charSelectModal [data-action], #charSelectModal button').evaluateAll(els =>
      els
        .filter(e => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .filter(e => {
          const r = e.getBoundingClientRect();
          return r.height < 44 || r.width < 44;
        })
        .map(e => `${e.tagName}.${e.className}`)
    );
    expect(pequenos).toEqual([]);
  });

  // 1366×768 é a régua de desktop do projeto. Com retrato 1:1 a trilha dos dez
  // estágios — o elemento que gera desejo — caía abaixo da dobra.
  test('em 1366×768 a trilha dos dez estágios cabe na primeira dobra', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openCharSelect(page);

    const cortados = await page.locator('#charSelectModal .nqc-path-label').evaluateAll((els, altura) =>
      els.filter(e => e.getBoundingClientRect().bottom > (altura as number)).length
    , 768);
    expect(cortados, 'nenhuma trilha pode ficar abaixo da dobra em 1366×768').toBe(0);
  });

  test('respeita prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCharSelect(page);
    const animado = await page.locator('#charSelectModal *').evaluateAll(els =>
      els
        .filter(e => {
          const s = getComputedStyle(e);
          return (s.animationName !== 'none' && s.animationDuration !== '0s') || parseFloat(s.transitionDuration) > 0;
        })
        .map(e => e.className)
    );
    expect(animado).toEqual([]);
  });

  test('não apresenta violações sérias ou críticas de acessibilidade', async ({ page }) => {
    await openCharSelect(page);
    const r = await new AxeBuilder({ page }).include('#charSelectModal').analyze();
    const graves = r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(graves, graves.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
  });
});
