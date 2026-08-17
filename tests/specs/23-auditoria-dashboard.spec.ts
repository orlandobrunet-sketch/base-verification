import { test, expect, Page } from '@playwright/test';
import { saveBase, statsBase } from '../helpers/fixtures';

/**
 * Correções da auditoria multidisciplinar (v14.52).
 *
 * Cada cenário fixa um defeito que foi verificado por execução, não por leitura.
 * A ordem segue a severidade apurada na auditoria.
 */

const SAVE = saveBase();
const STATS = statsBase();

async function abrirCentral(page: Page, extra: Record<string, unknown> = {}) {
  await page.goto('/jogar/');
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(({ save, stats, extra }) => {
    localStorage.setItem('nefroquest-save', JSON.stringify({ ...save, ...(extra as object) }));
    localStorage.setItem('nefroquest-detailed-stats', JSON.stringify(stats));
    // A toolbar de busca do Mapa só é renderizada quando existe resposta
    // mapeada (v14.59) — sem isso não há o que filtrar e o campo não existe.
    localStorage.setItem('nefroquest-comp-stats', JSON.stringify({ ab_gasometria: { t: 6, c: 4 } }));
    localStorage.setItem('nefroquest-premium', '1');
  }, { save: SAVE, stats: STATS, extra });
  await page.reload();
  await page.waitForFunction(() => typeof (window as any).openDashboard === 'function');
  await page.evaluate(() => (window as any)._loadTopics?.());
  await page.evaluate(() => (window as any).openDashboard());
  await expect(page.locator('#nqDashboard')).toBeVisible();
}

test.describe('Correções da auditoria', () => {
  // ── Ética da recompensa ───────────────────────────────────────────────────
  // Premiavam velocidade sobre compreensão, virada de noite e maratona. Foram
  // apenas rebaixadas na rodada anterior: continuavam avaliadas e celebradas.
  test('não existe conquista que premie pressa, madrugada ou maratona', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => Array.isArray(eval('ACHIEVEMENTS_LIST')));

    const ids = await page.evaluate(() => eval('ACHIEVEMENTS_LIST').map((a: any) => a.id));
    for (const proibida of ['speed_demon', 'night_scholar', 'marathon_runner']) {
      expect(ids, `${proibida} não pode voltar à lista`).not.toContain(proibida);
    }

    // Nenhuma conquista pode se apoiar em tempo de resposta ou hora do dia.
    const suspeitas = await page.evaluate(() =>
      eval('ACHIEVEMENTS_LIST')
        .filter((a: any) => /segundo|madrugada|em um único dia|22h/i.test(a.description || ''))
        .map((a: any) => a.id)
    );
    expect(suspeitas).toEqual([]);
  });

  test('a Central não exibe medidor de progresso para conquistas removidas', async ({ page }) => {
    await abrirCentral(page);
    await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();
    const painel = page.locator('#nqdPane-achievements');
    await expect(painel).not.toContainText('Maratonista');
    await expect(painel).not.toContainText('Estudioso Noturno');
    await expect(painel).not.toContainText('No arquivo');
  });

  // ── Honestidade tipográfica ───────────────────────────────────────────────
  test('ausência de conquista não é exibida como zero no tipo de destaque', async ({ page }) => {
    await abrirCentral(page);
    await page.getByRole('tab', { name: 'Conquistas', exact: true }).click();
    await expect(page.locator('#nqdPane-achievements .nqd-achievement-summary strong')).toHaveText('—');
  });

  test('sem partida pontuada, o ranking destaca os acertos e não um zero', async ({ page }) => {
    await abrirCentral(page, { score: 0 });
    await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
    const pessoal = page.locator('#nqdPane-ranking .nqd-ranking-personal');
    await expect(pessoal.locator('strong')).not.toHaveText('0');
    await expect(pessoal).toContainText('nenhuma partida pontuada ainda');
  });

  test('o Grimório vazio não abre com um zero em tipo de display', async ({ page }) => {
    await abrirCentral(page);
    await page.getByRole('tab', { name: 'Grimório', exact: true }).click();
    const destaque = page.locator('#nqdPane-library strong').first();
    await expect(destaque).not.toHaveText(/^0/);
  });

  // ── Reflexo motor do usuário ──────────────────────────────────────────────
  test('Escape num campo de busca preenchido limpa o campo, sem fechar a Central', async ({ page }) => {
    await abrirCentral(page);
    await page.getByRole('tab', { name: 'Mapa clínico', exact: true }).click();

    const busca = page.locator('#nqDashMapSearch');
    await busca.fill('gasometria');
    await busca.press('Escape');

    await expect(page.locator('#nqDashboard')).toBeVisible();
    await expect(busca).toHaveValue('');

    // Com o campo já vazio, Escape volta a fechar.
    await busca.press('Escape');
    await expect(page.locator('#nqDashboard')).toBeHidden();
  });
});

// ── Classificador de competências ───────────────────────────────────────────
// Rodado sobre o banco real: são invariantes de conteúdo, não de interface.
test.describe('Classificador de competências', () => {
  test('keywords acentuadas casam — o texto e a keyword usam a mesma normalização', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any)._nqMatchComps === 'function');

    const mortas = await page.evaluate(() => {
      const norm = (window as any)._nqNorm;
      return eval('NQ_COMPETENCIES')
        .flatMap((c: any) => c.keywords)
        .filter((k: string) => norm(k) !== k && !norm(`x ${k} x`).includes(norm(k)))
        .length;
    });
    expect(mortas).toBe(0);

    // Prova direta: uma keyword acentuada tem de casar num texto normalizado.
    const casa = await page.evaluate(() => {
      const norm = (window as any)._nqNorm;
      return (window as any)._nqMatchComps(norm('paciente com rejeição aguda do enxerto'), 'transplante').length > 0;
    });
    expect(casa).toBe(true);
  });

  test('Síndrome de Bartter não é classificada como acidose tubular renal', async ({ page }) => {
    await page.goto('/jogar/');
    await page.waitForFunction(() => typeof (window as any)._nqMatchComps === 'function');
    await page.evaluate(() => (window as any)._loadTopics?.());
    await page.waitForFunction(() => { try { return Array.isArray(eval('topics')) && eval('topics').length > 0; } catch { return false; } });

    const rotulos = await page.evaluate(() => {
      const norm = (window as any)._nqNorm;
      const comps = eval('NQ_COMPETENCIES');
      return eval('topics')
        .filter((q: any) => /bartter/i.test(q.t || ''))
        .map((q: any) => ({
          t: q.t,
          labels: (window as any)._nqMatchComps(norm(`${q.t} ${q.q}`), q.cat)
            .map((id: string) => (comps.find((c: any) => c.id === id) || {}).label),
        }));
    });

    expect(rotulos.length, 'o banco precisa ter questões de Bartter').toBeGreaterThan(0);
    for (const item of rotulos) {
      expect(item.labels.join(' '), `"${item.t}" não pode cair em ATR — Bartter cursa com alcalose, não acidose`)
        .not.toContain('Acidose tubular renal');
    }
  });
});
