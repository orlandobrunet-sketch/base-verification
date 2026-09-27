import { test, expect, Page } from '@playwright/test';
import { injectBossState, injectGameState, pickFirstOption } from '../helpers/game';

/**
 * O gabarito não pode depender de cor, nem do mouse (v14.71).
 *
 * Três defeitos medidos na árvore de acessibilidade e no foco real:
 *
 *  1. No Confronto Final, qual alternativa era a correta era dito SÓ pela cor.
 *     As marcações "✓ correta" e "× sua escolha" existiam no modo normal e
 *     eram explicitamente excluídas do boss por
 *     `:not(.boss-battle-mode):not(.arqui-nefromante-final)`. Simulando
 *     deuteranopia, os dois sinais convergem e o contraste entre eles cai a
 *     2,46:1. E o texto de feedback ao errar nunca nomeia a correta — diz
 *     "Incorreta" e emenda a explicação. O médico daltônico ou cego saía do
 *     confronto sem saber qual conduta era a certa.
 *
 *  2. Responder desabilitava o botão focado e o foco caía no <body>. O leitor
 *     de tela perdia a posição e precisava navegar do zero até a explicação.
 *
 *  3. Com o foco no <body>, Enter avançava. Quem responde com Enter e aperta
 *     de novo por reflexo pulava a explicação inteira — o conteúdo pedagógico.
 *
 * Estes cenários afirmam o conteúdo RESOLVIDO pelo navegador e o foco REAL,
 * não a regra no arquivo.
 */

/** Conteúdo do pseudo-elemento como o navegador resolve, já sem aspas. */
async function conteudoDepois(page: Page, seletor: string, pseudo = '::after') {
  return page.locator(seletor).first().evaluate(
    (el, p) => getComputedStyle(el as Element, p).content.replace(/^["']|["']$/g, ''),
    pseudo,
  );
}

async function responder(page: Page) {
  await pickFirstOption(page);
  await expect(page.locator('#options .option.correct')).toBeVisible({ timeout: 5000 });
}

test.describe('Gabarito legível sem depender de cor', () => {
  test('no Confronto Final a alternativa correta se identifica por texto, não só por cor', async ({ page }) => {
    await page.goto('/jogar/');
    await injectBossState(page);
    await page.evaluate(() => document.body.classList.add('boss-battle-mode'));
    await responder(page);

    const marca = await conteudoDepois(page, '#options .option.correct');
    const chave = await conteudoDepois(page, '#options .option.correct .opt-key');

    expect(marca.toLowerCase(), 'a correta precisa dizer "correta" em texto no boss').toContain('correta');
    expect(chave, 'a chave da correta precisa trazer o ✓ no boss').toContain('✓');
  });

  test('no Confronto Final a escolha errada também é nomeada em texto', async ({ page }) => {
    await page.goto('/jogar/');
    // Percorrer várias questões acumula ouro e cruza o marco de 100, cuja
    // celebração cobre o dock inteiro e intercepta o clique em "Próxima". A
    // falha aparecia como "timeout no #nextBtn", que não diz nada sobre a
    // causa, e dependia de quantas questões o teste precisava até errar uma.
    //
    // O produto não tem defeito: a celebração existe de propósito e o jogador a
    // dispensa. Marcá-la como já vista é o mesmo caminho que o app usa, e
    // deixa o cenário determinístico em vez de disputar cliques com a animação.
    await page.evaluate(() => localStorage.setItem('nefroquest-gold-milestone-shown', '1'));
    await injectBossState(page);
    await page.evaluate(() => document.body.classList.add('boss-battle-mode'));
    // Errar de propósito: o gabarito da questão atual está em state.current.a.
    // Antes o teste clicava sempre na primeira alternativa e avançava até ela
    // sair errada — em até 6 questões, cada uma com animação e celebração no
    // caminho. Quando o sorteio demorava, estourava os 30s (intermitente
    // também no main, sem nenhuma mudança no produto).
    await expect(page.locator('#options .option').first()).toBeEnabled({ timeout: 8000 });
    const errada = await page.evaluate(() => {
      const q = (0, eval)('state.current');
      return (q.a + 1) % q.o.length;
    });
    await page.locator(`#options .option[data-idx="${errada}"]`).click();
    await expect(page.locator('#options .option.wrong')).toHaveCount(1, { timeout: 5000 });

    const marca = await conteudoDepois(page, '#options .option.wrong');
    expect(marca.toLowerCase(), 'a errada precisa dizer "sua escolha" em texto no boss').toContain('sua escolha');
  });

  test('o modo normal não perdeu as marcações que já tinha', async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    await responder(page);

    const marca = await conteudoDepois(page, '#options .option.correct');
    expect(marca.toLowerCase()).toContain('correta');
  });

  test('responder não joga o foco no corpo da página', async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    await responder(page);
    await page.waitForTimeout(300);

    const foco = await page.evaluate(() => {
      const a = document.activeElement;
      return { tag: a?.tagName || null, id: (a as HTMLElement)?.id || null };
    });
    expect(foco.tag, 'o foco não pode voltar ao <body> depois de responder').not.toBe('BODY');
  });

  test('Enter reflexo logo após responder não pula a explicação', async ({ page }) => {
    await page.goto('/jogar/');
    // O save-base tem 80 de ouro: acertar cruza o marco de 100 e a celebração
    // (um diálogo, com foco) recebe o Enter. Marcada como vista, como no app.
    await page.evaluate(() => localStorage.setItem('nefroquest-gold-milestone-shown', '1'));
    await injectGameState(page);
    const antes = await page.locator('#question').textContent();
    await expect(page.locator('#options .option').first()).toBeEnabled({ timeout: 5000 });

    // Repique imediato, no mesmo instante do clique. Esperar a marcação de
    // "correta" antes do Enter podia passar dos 700ms da janela sob carga, e
    // aí o avanço era o comportamento certo — o teste falhava à toa.
    await page.evaluate(() => {
      (document.querySelector('#options .option') as HTMLElement).click();
      (document.activeElement as HTMLElement | null)?.blur();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await page.waitForTimeout(150);
    const durante = await page.locator('#question').textContent();
    expect(durante, 'a explicação não pode ser pulada pelo Enter de reflexo').toBe(antes);
  });

  test('passada a janela de guarda, Enter continua avançando', async ({ page }) => {
    await page.goto('/jogar/');
    // Sem a celebração do marco de ouro: ela é um diálogo e receberia o Enter.
    await page.evaluate(() => localStorage.setItem('nefroquest-gold-milestone-shown', '1'));
    await injectGameState(page);
    const antes = await page.locator('#question').textContent();
    await responder(page);

    await page.waitForTimeout(900);
    await page.keyboard.press('Enter');
    await expect(page.locator('#question')).not.toHaveText(antes || '', { timeout: 5000 });
  });
});
