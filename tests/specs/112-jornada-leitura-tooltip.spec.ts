import { test, expect, type Locator, type Page } from '@playwright/test';
import { injectGameState } from '../helpers/game';

test.use({ serviceWorkers: 'block', reducedMotion: 'reduce' });

const BADGES = '.equip-total-attributes .stat-badge';
const TIP = 'body > .stat-tip-floating';
const WIDTHS = [320, 390, 1100];
const LONG_MESSAGE = 'O personagem recebeu um equipamento e prosseguiu na jornada. ' +
  'Esta mensagem de teste ocupa várias linhas para conferir a leitura integral do registro. ' +
  'Nenhuma parte deve depender de uma segunda área de rolagem.';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())));
  });
}

async function openGame(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 });
  await page.route('**/*', route => {
    const hostname = new URL(route.request().url()).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1'
      ? route.continue() : route.abort();
  });
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await injectGameState(page, { gold: 0, streak: 0 });
  await expect(page.locator('#question')).not.toBeEmpty();
  await settle(page);
}

async function openCharacter(page: Page) {
  const open = page.locator('.mobile-bottom-dock [data-action="openMobileDrawer"]');
  if (await open.isVisible() && !await page.locator('.panel.left').evaluate(panel => panel.classList.contains('mobile-open'))) {
    await open.click();
    await expect(page.locator('.panel.left')).toHaveClass(/mobile-open/);
  }
  await expect(page.locator(BADGES).first()).toBeVisible();
  await settle(page);
}

async function fontScale(page: Page, percent: number) {
  await page.evaluate(value => {
    document.documentElement.style.fontSize = value === 200 ? '32px' : '16px';
  }, percent);
  await settle(page);
}

async function setJournalMessages(page: Page, count: number) {
  // Esta fixture mede geometria. O caso separado abaixo exercita log() real.
  await page.locator('#journal').evaluate((journal, data) => {
    const messages = Array.from({ length: data.count }, (_, index) => {
      const p = document.createElement('p');
      p.textContent = 'Evento ' + (index + 1) + ': ' + data.message;
      return p;
    });
    journal.replaceChildren(...messages);
  }, { count, message: LONG_MESSAGE });
  await settle(page);
}

async function journalMetrics(page: Page) {
  return page.locator('.log[role="log"]').evaluate(log => {
    const journal = log.querySelector('#journal') as HTMLElement;
    const box = log.getBoundingClientRect();
    const cut: string[] = [];
    for (const p of Array.from(journal.querySelectorAll('p'))) {
      const range = document.createRange();
      range.selectNodeContents(p);
      for (const rect of Array.from(range.getClientRects())) {
        if (!rect.width || !rect.height) continue;
        if (rect.left < box.left - 1 || rect.right > box.right + 1 ||
            rect.top < box.top - 1 || rect.bottom > box.bottom + 1) {
          cut.push(p.textContent || '');
          break;
        }
      }
    }
    return {
      height: box.height,
      cut,
      regions: [log, journal].map(element => ({
        overflowY: getComputedStyle(element).overflowY,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      })),
    };
  });
}

async function expectDescription(page: Page, badge: Locator) {
  expect(await badge.evaluate(element => element.tagName)).toBe('BUTTON');
  await expect(badge).toHaveAttribute('type', 'button');
  const box = (await badge.boundingBox())!;
  expect(box.width, 'atributo: alvo de toque').toBeGreaterThanOrEqual(44);
  expect(box.height, 'atributo: alvo de toque').toBeGreaterThanOrEqual(44);
  const source = badge.locator('.stat-tip');
  const id = await source.getAttribute('id');
  expect(id, 'a descrição precisa de ID estável').toBeTruthy();
  await expect(badge).toHaveAttribute('aria-describedby', id!);
  await expect(page.locator('[id="' + id + '"]')).toHaveCount(1);
  const description = await source.evaluate(element =>
    Array.from(element.childNodes)
      .filter(node => !(node instanceof Element && node.matches('strong, br')))
      .map(node => node.textContent || '').join(' ').replace(/\s+/g, ' ').trim());
  expect(description).not.toBe('');
  await expect(badge).toHaveAccessibleDescription(new RegExp(escapeRegex(description)));
}

async function expectTooltip(page: Page, badge: Locator) {
  const floating = page.locator(TIP);
  await expect(floating).toBeVisible();
  await expect(floating).toHaveAttribute('data-nq-ui', 'lumen');
  await expect(floating).toHaveCSS('pointer-events', 'auto');
  await expect(floating).toHaveCSS('font-family', /Source Sans 3/);
  await expect(floating.locator('strong').first()).toHaveCSS('font-family', /Alegreya/);
  await expect(floating).toHaveText((await badge.locator('.stat-tip').textContent()) || '');

  const badgeBox = (await badge.boundingBox())!;
  const metrics = await floating.evaluate((element, owner) => {
    const tip = element as HTMLElement;
    const rect = tip.getBoundingClientRect();
    const style = getComputedStyle(tip);
    const app = document.getElementById('mainApp')!;
    const drawer = document.querySelector('.panel.left')!;
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--nql-surface-solid)';
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    app.appendChild(probe);
    const surface = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const alpha = (color: string) => {
      if (color === 'transparent') return 0;
      const match = color.match(/^rgba?\(([^)]+)\)$/);
      if (!match) return null;
      const values = match[1].split(',').map(Number);
      return values.length === 4 ? values[3] : 1;
    };
    const points = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + 4, rect.top + rect.height / 2],
      [rect.right - 4, rect.top + rect.height / 2],
    ];
    return {
      parentIsBody: tip.parentElement === document.body,
      position: style.position,
      left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
      overlap: Math.max(0, Math.min(rect.right, owner.x + owner.width) - Math.max(rect.left, owner.x)) *
        Math.max(0, Math.min(rect.bottom, owner.y + owner.height) - Math.max(rect.top, owner.y)),
      scrollWidth: tip.scrollWidth, clientWidth: tip.clientWidth,
      background: style.backgroundColor, surface, surfaceAlpha: alpha(surface),
      textAlpha: alpha(style.color),
      fontSize: parseFloat(style.fontSize),
      rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      zIndex: Number(style.zIndex) || 0,
      drawerZIndex: Number(getComputedStyle(drawer).zIndex) || 0,
      paintedOnTop: points.every(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return hit === tip || !!hit && tip.contains(hit);
      }),
    };
  }, badgeBox);
  expect(metrics.parentIsBody).toBe(true);
  expect(metrics.position).toBe('fixed');
  expect(metrics.left).toBeGreaterThanOrEqual(8);
  expect(metrics.top).toBeGreaterThanOrEqual(8);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth - 8);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight - 8);
  expect(metrics.overlap, 'a dica não pode cobrir o atributo que a abriu').toBe(0);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.background).toBe(metrics.surface);
  expect(metrics.surfaceAlpha).not.toBeNull();
  expect(metrics.surfaceAlpha!).toBeGreaterThanOrEqual(.9);
  expect(metrics.textAlpha).not.toBeNull();
  expect(metrics.textAlpha!).toBeGreaterThanOrEqual(.9);
  expect(metrics.fontSize).toBeGreaterThanOrEqual(metrics.rootFontSize * .875);
  expect(metrics.zIndex).toBeGreaterThan(metrics.drawerZIndex);
  expect(metrics.paintedOnTop, 'a gaveta ou outra camada cobre a dica').toBe(true);
}

async function expectRightContainment(page: Page, selector: string) {
  await expect(page.locator('.panel.right')).toHaveCSS('border-top-width', '1px');
  await expect(page.locator('.panel.right')).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const metrics = await page.locator(selector).evaluate(element => {
    const panel = element.closest('.panel.right')!;
    const panelBox = panel.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const cut: string[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!(node.textContent || '').trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        if (!rect.width || !rect.height) continue;
        if (rect.left < box.left - 1 || rect.right > box.right + 1 ||
            rect.top < box.top - 1 || rect.bottom > box.bottom + 1) {
          cut.push((node.textContent || '').trim().slice(0, 60));
          break;
        }
      }
    }
    return {
      left: box.left, right: box.right, panelLeft: panelBox.left, panelRight: panelBox.right,
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
      panelScrollWidth: panel.scrollWidth, panelClientWidth: panel.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
      cut,
    };
  });
  expect(metrics.left).toBeGreaterThanOrEqual(metrics.panelLeft - 1);
  expect(metrics.right).toBeLessThanOrEqual(metrics.panelRight + 1);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
  expect(metrics.panelScrollWidth).toBeLessThanOrEqual(metrics.panelClientWidth + 1);
  expect(metrics.pageOverflow).toBeLessThanOrEqual(1);
  expect(metrics.cut, selector + ': texto cortado dentro da caixa').toEqual([]);
}

for (const width of WIDTHS) {
  test('Jornada cresce com quatro mensagens, sem rolagem própria, em ' + width + 'px', async ({ page }, testInfo) => {
    await openGame(page, width);
    await openCharacter(page);
    for (const percent of [100, 200]) {
      await test.step('texto a ' + percent + '%', async () => {
        await fontScale(page, percent);
        await setJournalMessages(page, 1);
        const before = await journalMetrics(page);
        await setJournalMessages(page, 4);
        await expect(page.locator('#journal p')).toHaveCount(4);
        const after = await journalMetrics(page);
        expect(after.height, 'as mensagens precisam aumentar a altura do registro')
          .toBeGreaterThan(before.height + 20);
        expect(after.cut).toEqual([]);
        for (const region of after.regions) {
          expect(region.overflowY).not.toMatch(/auto|scroll/);
          expect(region.scrollHeight).toBeLessThanOrEqual(region.clientHeight + 1);
          expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth + 1);
        }
        await page.locator('#journal p').last().scrollIntoViewIfNeeded();
        await expect(page.locator('#journal p').last()).toBeInViewport();
      });
    }
    await testInfo.attach('jornada-' + width + 'px-200', {
      body: await page.screenshot(), contentType: 'image/png',
    });
  });
}

test('registro destaca nomes como texto seguro e mantém as últimas quatro entradas', async ({ page }) => {
  await openGame(page, 1100);
  await page.evaluate(() => {
    document.getElementById('journal')!.replaceChildren();
    (window as any).__nqJournalInjected = false;
    const emit = (0, eval)('log') as (message: string) => void;
    emit('Primeiro registro');
    emit('Segundo registro');
    emit('Equipou **Armadura <img src=x onerror="window.__nqJournalInjected=true">** & <script>window.__nqJournalInjected=true</script>.');
    emit('Quarto registro');
    emit('Quinto registro');
  });
  const rows = page.locator('#journal p');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toHaveText('Quinto registro');
  await expect(rows.nth(1)).toHaveText('Quarto registro');
  await expect(rows.nth(3)).toHaveText('Segundo registro');
  await expect(rows.nth(2).locator('strong')).toHaveText('Armadura <img src=x onerror="window.__nqJournalInjected=true">');
  await expect(rows.nth(2)).toContainText('& <script>window.__nqJournalInjected=true</script>.');
  await expect(rows.nth(2)).not.toContainText('**');
  await expect(page.locator('#journal img, #journal script, #journal iframe')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__nqJournalInjected)).toBe(false);
});

test('os quatro atributos mantêm hover, leitura da própria dica e foco por Tab', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'hover fino usa o projeto desktop');
  await openGame(page, 1280);
  const badges = page.locator(BADGES);
  await expect(badges).toHaveCount(4);
  for (const percent of [100, 200]) {
    await fontScale(page, percent);
    for (const badge of await badges.all()) {
      // A rolagem deve terminar antes do hover: rolar fora da dica fecha o portal.
      await badge.scrollIntoViewIfNeeded();
      await settle(page);
      await expectDescription(page, badge);
      await badge.hover();
      await expectTooltip(page, badge);
      await page.locator(TIP).hover();
      await expectTooltip(page, badge);
      await page.keyboard.press('Escape');
      await expect(page.locator(TIP)).toBeHidden();
      await page.mouse.move(2, 2);
      await badge.hover();
      await expectTooltip(page, badge);
      await page.keyboard.press('Escape');
      const box = (await badge.boundingBox())!;
      await page.mouse.move(box.x + box.width * .65, box.y + box.height * .65);
      await expect(page.locator(TIP), 'Escape deve continuar fechando enquanto o atributo permanece sob o ponteiro')
        .toBeHidden();
      await page.mouse.move(2, 2);
    }
    await badges.first().focus();
    for (let index = 0; index < 4; index++) {
      const badge = badges.nth(index);
      await expect(badge).toBeFocused();
      await expectTooltip(page, badge);
      await page.keyboard.press('Escape');
      await expect(page.locator(TIP)).toBeHidden();
      await expect(badge).toBeFocused();
      await page.keyboard.press('Tab');
    }
    await expect(page.locator(TIP)).toBeHidden();
  }
});

for (const width of [320, 390]) {
  test('os quatro atributos abrem por toque acima da gaveta em ' + width + 'px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'toque real exige o contexto móvel');
    await openGame(page, width);
    await openCharacter(page);
    const badges = page.locator(BADGES);
    await expect(badges).toHaveCount(4);
    for (const percent of [100, 200]) {
      await fontScale(page, percent);
      for (const badge of await badges.all()) {
        await badge.scrollIntoViewIfNeeded();
        await expectDescription(page, badge);
        await badge.tap();
        await expectTooltip(page, badge);
        await page.touchscreen.tap(2, 2);
        await expect(page.locator(TIP)).toBeHidden();
      }
    }
    await badges.first().scrollIntoViewIfNeeded();
    await badges.first().tap();
    await testInfo.attach('tooltip-gaveta-' + width + 'px-200', {
      body: await page.screenshot(), contentType: 'image/png',
    });
  });
}

test('rolar uma dica longa a 200% mantém sua leitura; rolar a gaveta fecha a dica', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'cenário de gaveta e toque real');
  await openGame(page, 320);
  await openCharacter(page);
  await fontScale(page, 200);
  const badge = page.locator(BADGES).first();
  await badge.locator('.stat-tip').evaluate(source => {
    source.appendChild(document.createTextNode(
      ' Texto de teste para exercitar uma dica longa e sua rolagem interna. '.repeat(24)));
  });
  await badge.scrollIntoViewIfNeeded();
  await expectDescription(page, badge);
  await badge.tap();
  await expectTooltip(page, badge);
  const floating = page.locator(TIP);
  expect(await floating.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await floating.tap();
  await expect(floating, 'tocar a própria dica deve conservar sua leitura').toBeVisible();
  await expect(badge, 'o portal visual não deve retirar o foco do atributo').toBeFocused();
  const box = (await floating.boundingBox())!;
  const input = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const startY = box.y + box.height * .8;
  const endY = box.y + box.height * .2;
  try {
    await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
    for (let step = 1; step <= 8; step++) {
      await input.send('Input.dispatchTouchEvent', {
        type: 'touchMove', touchPoints: [{ x, y: startY + (endY - startY) * step / 8 }],
      });
    }
    await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await input.detach();
  }
  await expect.poll(() => floating.evaluate(element => element.scrollTop),
    { message: 'o gesto de deslizar deve rolar o conteúdo da dica' }).toBeGreaterThan(0);
  await expect(floating, 'o gesto dentro da dica não deve fechá-la').toBeVisible();
  await floating.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect.poll(() => floating.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(floating, 'a própria rolagem da dica não deve fechá-la').toBeVisible();
  await expectTooltip(page, badge);
  const moved = await page.locator('.panel.left').evaluate(element => {
    const before = element.scrollTop;
    element.scrollTop = before === 0 ? element.scrollHeight : 0;
    return element.scrollTop !== before;
  });
  expect(moved, 'a fixture precisa exercitar a rolagem externa da gaveta').toBe(true);
  await expect(floating).toBeHidden();
});

for (const correct of [true, false]) {
  test('pergunta e explicação integrais, justificadas e contidas após ' + (correct ? 'acerto' : 'erro'), async ({ page }, testInfo) => {
    await openGame(page, 1100);
    const question = await page.evaluate(() => (0, eval)('state.current'));
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      for (const percent of [100, 200]) {
        await fontScale(page, percent);
        await expect(page.locator('#question')).toHaveCSS('text-align', 'justify');
        await expect(page.locator('#question')).toHaveCSS('text-align-last', 'start');
        await expectRightContainment(page, '#question');
      }
    }
    const index = correct ? question.a : (question.a + 1) % question.o.length;
    await page.locator('#options .option').nth(index).click();
    await expect(page.locator('#nqlQuestionRatingToggle')).toBeVisible();
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      for (const percent of [100, 200]) {
        await fontScale(page, percent);
        const explanation = page.locator('#feedback .fb-snip');
        await expect(explanation).toHaveText(question.e);
        await expect(explanation).toHaveCSS('text-align', 'justify');
        await expect(explanation).toHaveCSS('text-align-last', 'start');
        await expect(explanation).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        for (const side of ['top', 'right', 'bottom', 'left']) {
          await expect(explanation).toHaveCSS('border-' + side + '-width', '0px');
        }
        await expect(page.locator('#feedback .nql-answer-result'))
          .toHaveText(correct ? '✓Resposta correta' : '×Resposta incorreta');
        await expectRightContainment(page, '#feedback');
        await expectRightContainment(page, '#feedback .fb-snip');
      }
    }
    await testInfo.attach('explicacao-' + (correct ? 'acerto' : 'erro') + '-200', {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
    });
    await page.locator('#nextBtn').click();
    await expect(page.locator('#nqlQuestionReview')).toHaveCount(0);
    await expect(page.locator('#nextBtn')).toBeHidden();
    await expect(page.locator('.nql-choice-instruction')).toHaveText('Escolha uma alternativa.');
  });
}


test('a dica fecha quando a superfície do atributo fica indisponível', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'mudanças programáticas e foco não exigem toque');
  await openGame(page, 390);
  await openCharacter(page);
  const badge = page.locator(BADGES).first();
  const setBoundary = (kind: string, active: boolean) => page.evaluate(({ kind, active }) => {
    const app = document.getElementById('mainApp')!;
    const drawer = app.querySelector('.panel.left')!;
    const owner = app.querySelector('.stat-badge') as HTMLElement;
    if (kind === 'drawer') drawer.classList.toggle('mobile-open', !active);
    if (kind === 'hidden') app.hidden = active;
    if (kind === 'inert') app.inert = active;
    if (kind === 'stun') document.body.classList.toggle('boss-stun-active', active);
    if (kind === 'offscreen') owner.style.transform = active ? 'translateX(-200vw)' : '';
  }, { kind, active });
  for (const kind of ['drawer', 'hidden', 'inert', 'stun', 'offscreen']) {
    await test.step(kind, async () => {
      await badge.scrollIntoViewIfNeeded();
      await expect.poll(() => badge.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth;
      })).toBe(true);
      await badge.evaluate(element => (element as HTMLElement).blur());
      await badge.focus();
      await expect(page.locator(TIP)).toBeVisible();
      await setBoundary(kind, true);
      await expect(page.locator(TIP)).toBeHidden();
      await setBoundary(kind, false);
    });
  }
});

test('modal ou painel de áudio aberto programaticamente fecha e bloqueia a dica', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'contrato de visibilidade sem gesto');
  await openGame(page, 1280);
  const badge = page.locator(BADGES).first();
  for (const kind of ['aria-modal', 'legacy', 'audio']) {
    await test.step(kind, async () => {
      await page.evaluate(kind => {
        const surface = document.createElement('section');
        surface.id = 'nqTooltipBlockingFixture';
        surface.hidden = true;
        surface.style.cssText = 'display:none;position:fixed;top:12px;right:12px;width:120px;height:80px';
        if (kind === 'aria-modal') {
          surface.setAttribute('role', 'dialog');
          surface.setAttribute('aria-modal', 'true');
        } else if (kind === 'legacy') {
          surface.className = 'modal show';
          surface.setAttribute('role', 'region');
        } else {
          surface.className = 'nq-audio-panel';
          surface.setAttribute('role', 'region');
        }
        document.body.append(surface);
      }, kind);
      await badge.evaluate(element => (element as HTMLElement).blur());
      await badge.focus();
      await expect(page.locator(TIP)).toBeVisible();
      await page.locator('#nqTooltipBlockingFixture').evaluate(element => {
        (element as HTMLElement).hidden = false;
        (element as HTMLElement).style.display = 'block';
      });
      await expect(page.locator(TIP)).toBeHidden();
      await badge.evaluate(element => (element as HTMLElement).blur());
      await badge.focus();
      await expect(page.locator(TIP), 'foco não reabre a dica sob superfície bloqueante').toBeHidden();
      await page.locator('#nqTooltipBlockingFixture').evaluate(element => element.remove());
      await badge.evaluate(element => (element as HTMLElement).blur());
      await badge.focus();
      await expect(page.locator(TIP)).toBeVisible();
    });
  }
});

test('Escape fecha apenas a dica ativa e conserva o foco no atributo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'isolamento do teclado');
  await openGame(page, 1280);
  await page.evaluate(() => {
    const dormant = document.createElement('section');
    dormant.id = 'nqTooltipDormantModal';
    dormant.className = 'modal';
    dormant.hidden = true;
    dormant.setAttribute('aria-modal', 'true');
    document.body.prepend(dormant);
  });
  const badge = page.locator(BADGES).first();
  await badge.focus();
  await expect(page.locator(TIP)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator(TIP)).toBeHidden();
  await expect(badge).toBeFocused();
  // O Escape global antigo remove o primeiro .modal, inclusive um modal oculto.
  await expect(page.locator('#nqTooltipDormantModal')).toHaveCount(1);
  await page.locator('#nqTooltipDormantModal').evaluate(element => element.remove());
});

test('preview de equipamento e dica de atributo se excluem por hover', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'integração de hover com preview fixado');
  await openGame(page, 1280);
  const equipment = page.locator('#equipList .slot-diablo[data-slot="weapon"]');
  const preview = page.locator('#nqEquipmentPreview');
  await expect(preview).toHaveCount(1);
  await equipment.click();
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('data-pinned', 'true');
  await page.locator(BADGES).first().hover();
  await expect(preview).toBeHidden();
  await expect(page.locator(TIP)).toBeVisible();
  await equipment.hover();
  await expect(preview).toBeVisible();
  await expect(page.locator(TIP)).toBeHidden();
});

test('a redução padrão preserva o modo de leitura e a ampliação do usuário', async ({ page }) => {
  await openGame(page, 1100);
  const sizes = () => page.evaluate(() => ({
    question: parseFloat(getComputedStyle(document.getElementById('question')!).fontSize),
    option: parseFloat(getComputedStyle(document.querySelector('#options .opt-body')!).fontSize),
  }));
  for (const width of [320, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    await fontScale(page, 100);
    await page.evaluate(() => document.body.classList.remove('reading-mode'));
    const standard = await sizes();
    await page.evaluate(() => document.body.classList.add('reading-mode'));
    const reading = await sizes();
    expect(reading.question).toBeGreaterThan(standard.question);
    expect(reading.option).toBeGreaterThan(standard.option);
    await fontScale(page, 200);
    const enlargedReading = await sizes();
    expect(enlargedReading.question).toBeCloseTo(reading.question * 2, 1);
    expect(enlargedReading.option).toBeCloseTo(reading.option * 2, 1);
    await page.evaluate(() => document.body.classList.remove('reading-mode'));
    const enlargedStandard = await sizes();
    expect(enlargedStandard.question).toBeCloseTo(standard.question * 2, 1);
    expect(enlargedStandard.option).toBeCloseTo(standard.option * 2, 1);
  }
});

test('o título do personagem permanece integral com texto ampliado', async ({ page }, testInfo) => {
  await openGame(page, 1100);
  const title = page.locator('.nql-hero-heading .class');
  const originalTitle = await title.textContent();
  expect(originalTitle).toBeTruthy();
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 844 });
    await openCharacter(page);
    for (const percent of [100, 200]) {
      await test.step(width + 'px, texto a ' + percent + '%', async () => {
        await fontScale(page, percent);
        await expect(title).toHaveText(originalTitle!);
        const metrics = await page.locator('.nql-hero-heading').evaluate(heading => {
          const box = heading.getBoundingClientRect();
          const cut: string[] = [];
          const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!(node.textContent || '').trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            if (Array.from(range.getClientRects()).some(rect => rect.width && rect.height &&
              (rect.left < box.left - 1 || rect.right > box.right + 1 ||
               rect.top < box.top - 1 || rect.bottom > box.bottom + 1))) {
              cut.push(node.textContent || '');
            }
          }
          return { scrollWidth: heading.scrollWidth, clientWidth: heading.clientWidth, cut };
        });
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
        expect(metrics.cut, 'nome, classe e título precisam caber no card do personagem').toEqual([]);
      });
    }
    if (width === 320) {
      await title.scrollIntoViewIfNeeded();
      await testInfo.attach('personagem-320px-200', {
        body: await page.screenshot(), contentType: 'image/png',
      });
    }
  }
});
