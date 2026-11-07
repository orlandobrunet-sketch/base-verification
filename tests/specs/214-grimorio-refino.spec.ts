import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ serviceWorkers: 'block', contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', route => route.request().method() === 'GET'
    && new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.routeWebSocket('**/*', socket => socket.close());
  await page.goto('/jogar/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-portal-route="guest"]').click();
  await page.evaluate(async () => {
    await (window as any)._loadTopics({ refsOnly: true });
    await (window as any).carregarDadosGrimorio();
    const refs = (0, eval)('refsDB'), articles = (0, eval)('nefroArticles');
    const keys = [...new Set((window as any).questionBank.flatMap((q: any) => q.r || q.refs || []))].filter((k: any) => refs[k]).slice(0, 4);
    const rarities = new Map();
    articles.forEach((article: any, index: number) => { if (!rarities.has(article.raridade)) rarities.set(article.raridade, index); });
    localStorage.setItem('nq-unlocked-refs', JSON.stringify(keys));
    localStorage.setItem('unlockedArticles', JSON.stringify([...rarities.values()]));
    localStorage.setItem('nq-bib-favorites', JSON.stringify([keys[0], '__art_' + [...rarities.values()][0]]));
  });
  await page.locator('[data-atrium-route="library"]').click();
  await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state', 'ready');
});


test('catálogo inteiro preserva bloqueios e contador pessoal, inclusive no admin', async ({ page }) => {
 const stored=await page.evaluate(()=>['nq-unlocked-refs','unlockedArticles','nq-bib-favorites'].map(k=>localStorage.getItem(k)));
 const entries=page.locator('[data-library-entry]'); const total=await entries.count();
 await expect(page.locator('[data-library-entry]:visible')).toHaveCount(total);
 await expect(page.locator('.nqd-library-summary')).toHaveText('Referências descobertas até o momento: 8/'+total);
 await expect(page.locator('#nqDashLibraryDiscovery')).toHaveCount(0);
 await expect(page.locator('#nqDashLibraryFilter option[value="guideline"]')).toHaveCount(0);
 expect(await page.locator('.nqd-library-locked-item').count()).toBeGreaterThan(0);
 await expect(page.locator('.nqd-library-locked-item .nqd-favorite')).toHaveCount(0);
 await page.keyboard.press('Escape');await page.evaluate(()=>{(window as any).isAdminUser=()=>true;});
 await page.locator('[data-atrium-route="library"]').click();
 await expect(page.locator('[data-library-item]:visible')).toHaveCount(total);
 await expect(page.locator('.nqd-library-summary')).toHaveText('Referências descobertas até o momento: 8/'+total);
 await expect(page.locator('#nqDashLibraryCollectionCount')).not.toContainText('prévia administrativa');
 expect(await page.evaluate(()=>['nq-unlocked-refs','unlockedArticles','nq-bib-favorites'].map(k=>localStorage.getItem(k)))).toEqual(stored);
 const starKey=await page.locator('[data-library-item]:visible .nqd-favorite[aria-pressed="false"]').first().getAttribute('data-library-key');
 const star=page.locator('.nqd-favorite[data-library-key="'+starKey+'"]');
 const was=await star.getAttribute('aria-pressed');
 await star.click();await expect(page.locator('[data-library-entry]:visible')).toHaveCount(total);
 await expect(page.locator('#nqDashLibraryTab-all')).toHaveAttribute('aria-selected','true');
 await star.click();await expect(star).toHaveAttribute('aria-pressed',was!);
 expect(await page.evaluate(()=>['nq-unlocked-refs','unlockedArticles','nq-bib-favorites'].map(k=>localStorage.getItem(k)))).toEqual(stored);
});

test('estrela conserva Todos, filtros, busca e ordem; favoritos persistem sem conceder descobertas', async ({ page }) => {
 const storage=()=>page.evaluate(()=>['nq-unlocked-refs','unlockedArticles'].map(k=>localStorage.getItem(k)));
 const saved=await storage();const ids=()=>page.locator('[data-library-entry]:visible').evaluateAll(es=>es.map(e=>e.getAttribute('data-library-title')));
 await page.locator('[data-library-rarity-filter="comum"]').click();
 await page.locator('#nqDashLibrarySort').selectOption('title');
 const card=page.locator('[data-library-item]:visible').first();const title=await card.getAttribute('data-library-title');
 await page.locator('#nqDashLibrarySearch').fill(title!);
 const before=await ids();const star=card.locator('.nqd-favorite');const initially=await star.getAttribute('aria-pressed');
 await star.click(); expect(await ids()).toEqual(before);
 await expect(page.locator('#nqDashLibraryTab-all')).toHaveAttribute('aria-selected','true');
 await expect(page.locator('#nqDashLibrarySort')).toHaveValue('title');
 await expect(page.locator('#nqDashLibrarySearch')).toHaveValue(title!);
 if(initially==='true'){await star.click();expect(await ids()).toEqual(before);}
 await page.getByRole('tab',{name:'Favoritos'}).click();await expect(page.locator('[data-library-entry]:visible')).toHaveCount(1);
 await page.keyboard.press('Escape');await page.locator('[data-atrium-route="library"]').click();
 await expect(page.locator('[data-library-entry]:visible')).toHaveCount(1);
 await page.locator('[data-library-item]:visible .nqd-favorite').click();
 await expect(page.locator('[data-library-entry]:visible')).toHaveCount(0);
 await page.getByRole('tab',{name:'Todos'}).click();expect(await ids()).toEqual(before);
 await expect(page.locator('[data-library-item]:visible .nqd-favorite')).toHaveAttribute('aria-pressed','false');
 await page.locator('#nqDashLibrarySearch').fill('');
 const theme=await page.locator('[data-library-item][data-library-kind="source"]').evaluateAll(es=>es.map(e=>e.getAttribute('data-library-theme')).find(Boolean)!.split(' · ')[0]);
 expect(theme).toBeTruthy();await page.locator('#nqDashLibraryFilter').selectOption('theme:'+theme);
 const themed=await ids(); const themedStar=page.locator('[data-library-item]:visible .nqd-favorite').first();
 expect(await themedStar.count()).toBe(1);
 await themedStar.click();expect(await ids()).toEqual(themed);
 await expect(themedStar).toBeFocused();
 await expect(page.locator('#nqDashLibraryFilter')).toHaveValue('theme:'+theme);
 expect(await storage()).toEqual(saved);
});

test('caixa única refluente mantém busca em Favoritos e controles acessíveis sem arte',async({page})=>{
 await expect(page.locator('.nqd-library-controls')).toHaveCount(1);
 await expect(page.getByText('Seu acervo cresce durante a jornada: acerte questões ou abra baús para descobrir novos artigos',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Favoritos'}).click();await expect(page.locator('#nqDashLibrarySearch')).toBeVisible();await expect(page.locator('#nqDashLibrarySort')).toBeVisible();
 await page.getByRole('tab',{name:'Todos'}).click();
 await page.setViewportSize({width:320,height:740});await page.evaluate(()=>{document.documentElement.style.fontSize='32px'});
 expect(await page.locator('.nqd-main').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.locator('[data-library-rarity-filter="raro"]').focus();await page.keyboard.press('Space');
 await expect(page.locator('[data-library-rarity-filter="raro"]')).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>{document.documentElement.style.fontSize='16px'});
 await page.route('**/assets/achievements/grimorio.webp',r=>r.abort());await page.locator('[data-atrium-route="library"]').click();
 await expect(page.locator('.nqd-grimoire-art')).toBeHidden();
 await expect(page.locator('.nqd-grimoire-header')).toHaveClass(/has-no-art/);
 await expect(page.locator('.nqd-grimoire-art-region')).toBeHidden();
 await expect(page.locator('.nqd-library-summary')).toBeVisible();
 await expect(page.locator('#nqDashLibrarySearch')).toBeVisible();
 expect(await page.locator('.nqd-grimoire-header').evaluate(e=>e.getBoundingClientRect().height)).toBeLessThan(272);
});

test('estrela não alarga resultados filtrados e sobrevive ao recarregamento', async ({page}) => {
 const visible=()=>page.locator('[data-library-entry]:visible').evaluateAll(es=>es.map(e=>e.getAttribute('data-library-title')));
 for (const rarity of ['comum','raro']) {
  await page.locator('[data-library-rarity-filter="'+rarity+'"]').click();
  const before=await visible();
  await page.locator('[data-library-item]:visible .nqd-favorite').first().click();
  expect(await visible()).toEqual(before);
  await expect(page.locator('#nqDashLibraryTab-all')).toHaveAttribute('aria-selected','true');
 }
 const favorites=await page.evaluate(()=>localStorage.getItem('nq-bib-favorites'));
 await page.reload({waitUntil:'domcontentloaded'});
 if(await page.locator('[data-portal-route="guest"]').isVisible()) await page.locator('[data-portal-route="guest"]').click();
 await page.evaluate(()=> (window as any).openDashboard({tab:'library'}));
 await expect(page.locator('#nqDashboard')).toHaveAttribute('data-dashboard-state','ready');
 expect(await page.evaluate(()=>localStorage.getItem('nq-bib-favorites'))).toEqual(favorites);
 await page.getByRole('tab',{name:'Favoritos'}).click();
 await expect(page.locator('[data-library-entry]:visible')).toHaveCount(JSON.parse(favorites!).length);
});
