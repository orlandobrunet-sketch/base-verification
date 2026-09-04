import { test, expect, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';
import { medirContraste } from '../helpers/contraste';
import { medirGeometria } from '../helpers/geometria';

/**
 * Os popups que vivem fora da Central de Comando.
 *
 * Dois defeitos, achados medindo em vez de olhando:
 *
 * 1. O SELETOR DE TEMA NUNCA ABRIA. `showTopicSelector` usava `returnFocus`
 *    sem declarar — a irmã `showAxesSelector` declara, aqui a linha faltava.
 *    Dava ReferenceError antes de qualquer coisa aparecer. Estava assim em
 *    produção, alcançável de quatro lugares (modos de jogo, lembrete de
 *    estudo, "← Voltar" do seletor de eixos e a entrada em modo estudo).
 *
 * 2. Alvos de toque menores que o dedo e texto abaixo do contraste mínimo:
 *    o ✕ do modal de preços media 18x22 e o da Forja 16x26, contra o mínimo
 *    de 24x24; "Já tenho conta — Entrar" tinha 15px de altura e 3,06:1.
 */

const POPUPS = [
  { fn: 'openAccountModal', nome: 'Conta' },
  { fn: 'openAuthModal', nome: 'Entrar' },
  { fn: 'openPlanModal', nome: 'Plano' },
  { fn: 'openRitual', nome: 'Ritual' },
  { fn: 'showAxesSelector', nome: 'Eixos' },
  { fn: 'showForjaModal', nome: 'Forja' },
  { fn: 'showHeroLore', nome: 'Lore do herói' },
  { fn: 'showPaywallModal', nome: 'Paywall' },
  { fn: 'showPricingModal', nome: 'Preços' },
  { fn: 'showPrivacyPolicy', nome: 'Privacidade' },
] as const;

/**
 * Elementos grandes e visíveis na tela. Comparar este conjunto antes e depois
 * de abrir diz QUAL elemento é o popup — adivinhar pelo maior z-index escolhia
 * o painel lateral e media a gaveta fechada em vez do que abriu.
 */
function visiveis(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) continue;
    if ((el as HTMLElement).hidden) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 80) continue;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < 0 || cx > window.innerWidth || cy < 0 || cy > window.innerHeight) continue;
    const bruto = typeof (el as any).className === 'string' ? (el as any).className : '';
    const sel = el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + bruto.trim().split(/\s+/).slice(0, 2).join('.');
    if (!out[sel] || r.width * r.height > out[sel]) out[sel] = r.width * r.height;
  }
  return out;
}

async function entrarNoJogo(page: Page) {
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page);
  await page.waitForLoadState('load');
  await page.evaluate(() => (document as any).fonts.ready);
  await expect(page.locator('#mainApp')).toBeVisible({ timeout: 15_000 });
}

test.describe('Popups fora da Central', () => {
  test('o seletor de tema abre pelo caminho do usuário', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'O defeito é de escopo, não de viewport.');
    test.setTimeout(120_000);

    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(String(e.message)));

    await entrarNoJogo(page);
    await page.evaluate(() => (window as any).openGameModesPopup());
    const botao = page.locator('[data-action-seq="closeGameModesPopup,showTopicSelector"]');
    await expect(botao).toHaveCount(1);
    await botao.first().click();
    await page.waitForTimeout(1200);

    expect(erros, `abrir o seletor de tema quebrou: ${erros.join(' | ')}`).toEqual([]);
    await expect(
      page.locator('.study-mode-popup'),
      'o popup de escolha do modo de estudo não apareceu',
    ).toHaveCount(1);
  });

  for (const largura of [1280, 390]) {
    test(`popups legíveis e clicáveis em ${largura}px`, async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium', 'A medição fixa a própria viewport.');
      test.setTimeout(600_000);
      await page.setViewportSize({ width: largura, height: largura === 390 ? 844 : 800 });

      const falhas: string[] = [];
      const naoAbriram: string[] = [];

      for (const popup of POPUPS) {
        await entrarNoJogo(page);
        const antes = await page.evaluate(visiveis);
        const abriu = await page.evaluate((fn) => {
          const f = (window as any)[fn];
          if (typeof f !== 'function') return 'não existe';
          try { f(); return 'ok'; } catch (e: any) { return 'lançou: ' + e.message; }
        }, popup.fn);
        if (abriu !== 'ok') { falhas.push(`${popup.nome}: ${abriu}`); continue; }

        await page.waitForTimeout(1200);
        const depois = await page.evaluate(visiveis);
        const novos = Object.keys(depois).filter((k) => !(k in antes));
        if (novos.length === 0) { naoAbriram.push(popup.nome); continue; }
        const seletor = novos.sort((a, b) => depois[b] - depois[a])[0];

        for (const c of await page.evaluate(medirContraste, seletor)) {
          falhas.push(`${popup.nome}: "${c.texto}" ${c.razao}:1 (mínimo ${c.exigido}:1, ${c.px}px)`);
        }
        for (const g of await page.evaluate(medirGeometria, seletor)) {
          falhas.push(`${popup.nome}: ${g.tipo} em ${g.sel} (${g.detalhe}) "${g.texto}"`);
        }
      }

      // Um popup que não abre não é "sem defeito" — é sem medição. Dizer isso
      // em voz alta evita que a suíte fique verde por não ter olhado.
      expect(naoAbriram, `popups que não abriram e portanto não foram medidos: ${naoAbriram.join(', ')}`).toEqual([]);
      expect(falhas, `defeitos medidos em ${largura}px:\n${falhas.join('\n')}`).toEqual([]);
    });
  }
});
