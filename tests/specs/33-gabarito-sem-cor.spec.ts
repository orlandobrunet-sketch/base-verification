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

  /* Acertar várias vezes seguidas atinge marcos de ouro, e o pop-up de marco
   * cobre o dock inteiro. O clique em "Próxima" então expira com trinta
   * segundos de espera, e a falha aparece como "timeout no #nextBtn" — que não
   * diz nada sobre a causa. Não é defeito do produto: a celebração existe de
   * propósito e o jogador a dispensa. O teste é que precisa dispensá-la também.
   *
   * Foi assim que este cenário quebrava de forma intermitente, dependendo de
   * quantas questões o teste precisava percorrer até errar uma. */
  async function dispensarCelebracoes(page: Page) {
    const overlays = page.locator('.nq-overlay:visible');
    for (let i = 0; i < 4 && await overlays.count() > 0; i++) {
      const botao = overlays.first().locator('button').first();
      if (await botao.count() === 0) break;
      await botao.click({ timeout: 4000 }).catch(() => { /* pode ter fechado sozinha */ });
      await page.waitForTimeout(200);
    }
  }

  /* Dispensar uma vez antes do clique não basta: a celebração aparece com
   * animação e pode entrar em cena DEPOIS da dispensa e ANTES do clique. Por
   * isso o clique insiste — dispensa, tenta, e repete se algo interceptar. */
  async function clicarProxima(page: Page) {
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      await dispensarCelebracoes(page);
      try {
        await page.locator('#nextBtn').click({ timeout: 5000 });
        return;
      } catch { /* provavelmente uma celebração entrou no caminho; dispensa e tenta de novo */ }
    }
    // Última tentativa sem rede de segurança: se falhar agora, a mensagem de
    // erro do Playwright nomeia quem está interceptando, que é o que interessa.
    await dispensarCelebracoes(page);
    await page.locator('#nextBtn').click();
  }

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
    await responder(page);

    // A primeira alternativa às vezes É a correta, e aí não existe `.wrong`.
    // Pular tornava o teste dependente do sorteio — ele passava sem provar
    // nada. Aqui avançamos até cair numa questão em que erramos.
    let tentativas = 0;
    while (await page.locator('#options .option.wrong').count() === 0 && tentativas < 6) {
      tentativas++;
      // Esperar o botão habilitar não basta: as alternativas antigas seguem no
      // DOM por um instante depois do clique. O sinal confiável de que a
      // questão trocou é o enunciado mudar.
      const enunciadoAntes = await page.locator('#question').textContent();
      await clicarProxima(page);
      await expect(page.locator('#question')).not.toHaveText(enunciadoAntes || '', { timeout: 8000 });
      await expect(page.locator('#options .option').first()).toBeEnabled({ timeout: 8000 });
      await responder(page);
    }
    expect(await page.locator('#options .option.wrong').count(),
      'não foi possível errar em 6 questões — cenário não exercitado').toBeGreaterThan(0);

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
    await injectGameState(page);
    const antes = await page.locator('#question').textContent();
    await responder(page);

    // Repique imediato: dentro da janela de guarda, não pode avançar.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const durante = await page.locator('#question').textContent();
    expect(durante, 'a explicação não pode ser pulada pelo Enter de reflexo').toBe(antes);
  });

  test('passada a janela de guarda, Enter continua avançando', async ({ page }) => {
    await page.goto('/jogar/');
    await injectGameState(page);
    const antes = await page.locator('#question').textContent();
    await responder(page);

    await page.waitForTimeout(900);
    await page.keyboard.press('Enter');
    await expect(page.locator('#question')).not.toHaveText(antes || '', { timeout: 5000 });
  });
});
