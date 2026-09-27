import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';

/**
 * Popups de celebração, aviso e baú como diálogos de verdade.
 *
 * Inventário medido antes (390px): nenhum dos 14 tinha papel de diálogo; em 13
 * o foco ficava atrás, na jornada. "Vida extra" mostrava "Você ganhou +1 vida!"
 * em preto sobre azul-escuro: na tela de jogo o body pintava a cor com
 * var(--nql-text), que só existe dentro de [data-nq-ui="lumen"] — cor inválida,
 * texto preto em todo popup preso ao body (o mesmo do pergaminho, na raiz).
 * Ainda: quatro textos abaixo de 4,5:1, alvos de 20–36px e o título da
 * evolução cortado a 200%.
 */
test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

/* Cada cenário fixa a própria viewport (390px) e o próprio texto (normal ou
 * 200%): no projeto mobile ele se repetiria idêntico. A duplicata somava
 * minutos à Full E2E, que passou do limite de 60 min no #819. Mesmo padrão da
 * spec 52. */
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
});

const POPUPS: [string, string][] = [
  ['Oráculo antes da resposta', '_showOracleAnswerFirst()'],
  ['Oráculo no confronto', '_showOracleBlockedNarrative()'],
  ['conclusão da jornada', 'showGameCompletionModal()'],
  ['vida extra', 'showExtraLifeModal()'],
  ['evolução', "showEvolutionPopup(6, 'Título de teste', 'assets/classes/glomerulus_6.png')"],
  ['equipamento encontrado', "showForgePopup({n:'Gorro de CTI',rar:'rare',atk:1,def:2,kno:1,luck:0}, 'helmet', ['ATK 1','DEF 2'], 'Equipamento Encontrado!')"],
  ['marco de ouro', 'showGoldMilestonePopup()'],
  ['baú surpresa', 'triggerChestRewardPopup()'],
  ['pergaminho', 'showChestModal(nefroArticles[0], 1, 40)'],
  ['confirmar ação', "showActionConfirmPopup('forge')"],
  ['desafio do minigame', 'showMinigameIntroPopup(10, 0)'],
  ['confronto final', 'showBattleFinalPopup()'],
  ['chefe', 'showBossIntroPopup()'],
  ['narrativa', 'showNarrativePopup(1)'],
  ['conquistas', 'showAchievementsModal()'],
  ['reportar erro', 'flagQuestion()'],
  // Segunda leva (15.28): as sobreposições que ainda não eram diálogos.
  // O Ritual (15.29, spec 76) e o Julgamento Rápido (15.31, spec 77) saíram
  // desta lista: viraram páginas.
  ['identidade', '_showIdentityChooser()'],
  ['lore do herói', 'showHeroLore()'],
  ['ácido-base', 'showAcidBaseMinigame()'],
  ['intro do personagem', "showCharacterIntroModal('glomerulus')"],
  ['resumo de referência', "_showResumoModal({label:'KDIGO 2024', autores:'Autores', jornal:'Kidney Int', ano:'2024', resumo:'Resumo de teste.', conclusao:'Conclusão.', impacto:'Impacto.', link:''})"],
];

async function abrir(page: Page, expr: string, grande = false) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/*', r => new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  if (grande) await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
  await page.evaluate(e => (0, eval)(e), expr);
  const dialogo = page.locator('[data-nq-dialogo] [role="dialog"], [data-nq-dialogo][role="dialog"]').last();
  await expect(dialogo).toBeVisible();
  // Animações de entrada (escala 0,9 → 1) podem ainda não ter começado no
  // primeiro quadro: espera dois quadros e só então pelo fim delas.
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || (a.effect as any)?.getTiming?.().iterations === Infinity));
  return dialogo;
}

for (const [nome, expr] of POPUPS) {
  test(`${nome}: diálogo com foco, texto legível e alvos de toque`, async ({ page }) => {
    const dialogo = await abrir(page, expr);
    await expect(dialogo).toHaveAttribute('aria-modal', 'true');
    // Foco entra e o Tab não escapa para a jornada atrás.
    const dentro = () => page.locator('[data-nq-dialogo]').last().evaluate(el => el.contains(document.activeElement));
    expect(await dentro(), 'foco ficou atrás do popup').toBe(true);
    for (const tecla of ['Tab', 'Tab', 'Tab', 'Shift+Tab']) {
      await page.keyboard.press(tecla);
      expect(await dentro(), `foco escapou com ${tecla}`).toBe(true);
    }
    const pretos = await dialogo.evaluate(el => [...el.querySelectorAll('p, h1, h2, h3, span, div, strong, em, li')]
      .filter(n => [...n.childNodes].some(c => c.nodeType === 3 && (c.textContent || '').trim()) && getComputedStyle(n).color === 'rgb(0, 0, 0)')
      .map(n => (n.textContent || '').trim().slice(0, 30)));
    expect(pretos, 'texto herdando preto').toEqual([]);
    const falhas = await page.evaluate(medirContraste, '[data-nq-dialogo]');
    expect(falhas, JSON.stringify(falhas.map((f: any) => `${f.texto} ${f.razao}`))).toEqual([]);
    const pequenos = await dialogo.evaluate(el => [...el.querySelectorAll('button, [role="button"]')]
      .filter(b => !b.classList.contains('chest-img-clickable'))
      .filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height < 44; })
      .map(b => (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 20)));
    expect(pequenos, 'alvo de toque abaixo de 44px').toEqual([]);
  });
}

test('ao fechar, o foco volta a quem abriu o popup', async ({ page }) => {
  await abrir(page, 'showExtraLifeModal()');
  await page.locator('[data-nq-dialogo] button').last().click();
  await expect(page.locator('[data-nq-dialogo]')).toHaveCount(0);
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

test('Escape fecha o popup que tem botão de fechar', async ({ page }) => {
  await abrir(page, 'showGoldMilestonePopup()');
  await page.keyboard.press('Escape');
  await expect(page.locator('#goldMilestonePopup')).toHaveCount(0);
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

test('o pergaminho (escondido por classe) também devolve o foco', async ({ page }) => {
  await abrir(page, 'showChestModal(nefroArticles[0], 1, 40)');
  await page.keyboard.press('Escape');
  await expect(page.locator('#chestModal')).not.toHaveClass(/show/);
  await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
});

for (const [nome, expr] of POPUPS) {
  test(`${nome}: nada cortado com texto a 200%`, async ({ page }) => {
    const dialogo = await abrir(page, expr, true);
    const cortes = await dialogo.evaluate(el => {
      const fora: string[] = [];
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!(n.textContent || '').trim() || !n.parentElement) continue;
        const cs = getComputedStyle(n.parentElement);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const g = document.createRange(); g.selectNodeContents(n);
        for (const x of g.getClientRects()) if (x.width && (x.right > innerWidth + 1 || x.left < -1)) { fora.push((n.textContent || '').trim().slice(0, 25)); break; }
      }
      return fora;
    });
    expect(cortes).toEqual([]);
  });
}

for (const [nome, expr] of POPUPS.filter(([nome]) => nome.startsWith('Oráculo'))) {
  for (const fechar of ['Escape', 'ação']) {
    test(nome + ': fechar por ' + fechar + ' devolve o foco', async ({ page }) => {
      const dialogo = await abrir(page, expr);
      if (fechar === 'Escape') await page.keyboard.press('Escape');
      else await dialogo.locator('button').last().click();
      await expect(page.locator('[data-nq-dialogo]')).toHaveCount(0);
      await expect(page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first()).toBeFocused();
    });
  }
}

