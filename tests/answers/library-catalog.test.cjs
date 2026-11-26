'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const catalog = require('../../js/library-catalog.js');
const { load, digest } = require('../../tools/build-question-revision-manifest.cjs');
const articles = load('data/articles.js', 'nefroArticles');
const refs = load('data/refs.js', 'refsDB');
const copy = value => JSON.parse(JSON.stringify(value));
const payload = card => Object.fromEntries(Object.entries(card).filter(([field]) => field !== 'titulo'));
const contents = () => [
  ...Object.entries(refs).filter(([key]) => !catalog.isRetiredReference(key)).map(([key, card]) => ({ key, kind: 'source', title: card.label, source: card.journal, year: card.ano,
    url: card.url || '',
    summary: card.resumo, conclusion: card.conclusao, impact: card.impacto, curiosity: card.curiosidade,
    unlocked: false, discovered: false, favorite: false })),
  ...articles.map((card, index) => ({ key: '__art_' + index, kind: 'scroll', title: card.titulo, source: card.jornal, year: card.ano,
    url: card.url || '',
    summary: card.resumo, conclusion: card.conclusao, impact: card.impacto, curiosity: card.curiosidade,
    unlocked: false, discovered: false, favorite: false }))
];

test('verified titles add presentation metadata without replacing catalogue identities', () => {
  const raw = contents();
  const contentsByKey = new Map(raw.map(item => [item.key, item]));
  const collapsed = catalog.collapseLibraryItems(raw, { articles });
  const titles = [
    [['__art_27'], 'content:__art_27', 'Ensaio SPRINT — Controle intensivo versus padrão da pressão arterial', 'A Randomized Trial of Intensive versus Standard Blood-Pressure Control', 'https://www.nejm.org/doi/full/10.1056/NEJMoa1511939'],
    [['__art_10'], 'content:__art_10', 'KDIGO 2012 — Avaliação e manejo da doença renal crônica', 'KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease', 'https://kdigo.org/wp-content/uploads/2017/02/KDIGO_2012_CKD_GL.pdf'],
    [['hypernatremia_yun_2023'], 'content:hypernatremia_yun_2023', 'Hipernatremia em adultos — Avaliação e manejo', 'Evaluation and management of hypernatremia in adults: clinical perspectives', 'https://www.kjim.org/journal/view.php?number=170760'],
    [['dapa', '__art_14'], 'work:dapa_ckd', 'DAPA-CKD — Dapagliflozina em pacientes com doença renal crônica', 'Dapagliflozin in Patients with Chronic Kidney Disease', 'https://www.nejm.org/doi/full/10.1056/NEJMoa2024816'],
    [['empa_kidney', '__art_16'], 'work:empa_kidney', 'EMPA-KIDNEY — Empagliflozina em pacientes com doença renal crônica', 'Empagliflozin in Patients with Chronic Kidney Disease', 'https://www.nejm.org/doi/full/10.1056/NEJMoa2204233'],
    [['credence', '__art_21'], 'work:credence', 'CREDENCE — Canagliflozina e desfechos renais em pacientes com diabetes tipo 2 e nefropatia', 'Canagliflozin and Renal Outcomes in Type 2 Diabetes and Nephropathy', 'https://www.nejm.org/doi/full/10.1056/NEJMoa1811744'],
  ];
  assert.equal(collapsed.filter(item => item.displayTitle).length, 9);
  for (const [keys, work, display, original, publication] of titles) {
    for (const key of keys) {
      const item = collapsed.find(entry => entry.key === key);
      assert.equal(item.displayTitle, display);
      assert.equal(item.originalTitle, original);
      assert.equal(item.publicationUrl, publication);
      assert.equal(item.title, contentsByKey.get(key).title);
      assert.equal(item.summary, contentsByKey.get(key).summary);
      assert.equal(item.url, contentsByKey.get(key).url);
      assert.deepEqual(item.aliases, key === '__art_14' ? ['__art_14', '__art_22'] : [key]);
      assert.equal(catalog.workKey(item), work);
      assert.equal(item.locked, true);
      assert.equal(item.discovered, false);
    }
  }
});

test('localized bibliography applies only to the pinned variant and publication', () => {
  const raw = contents();
  const scroll = raw.find(item => item.key === '__art_27');
  const yun = raw.find(item => item.key === 'hypernatremia_yun_2023');
  const dapa = raw.find(item => item.key === 'dapa');
  for (const variant of [
    { ...scroll, key: '__art_36', aliases: ['__art_27'] },
    { ...scroll, source: 'N Engl J Med 2021. DOI: 10.1056/NEJMoa1901281' },
    { ...scroll, year: 2021 },
    { ...scroll, kind: 'source' },
    { ...scroll, title: 'Another record' },
    { ...scroll, retired: true },
    { ...yun, url: 'https://pubmed.ncbi.nlm.nih.gov/26551272/' },
    { ...dapa, url: refs.credence.url },
  ]) {
    const [item] = catalog.collapseLibraryItems([variant], { articles });
    assert.equal(item.displayTitle, undefined);
    assert.equal(item.originalTitle, undefined);
    assert.equal(item.publicationUrl, undefined);
  }
});

test('only the two declared pairs have identical complete non-title payloads; physical data stays stable', () => {
  assert.equal(articles.length, 191);
  for (const [a, b, expected] of [[14, 22, 'sha256:c04055f5f992e678fd5bc3585d0e952043ef69246bc71333deeeebf5617cb7b4'],
    [15, 23, 'sha256:28a0c8cb00d73f725eac1609975e9e0e8567a27fd138ac3d528a37a1639192d7']]) {
    assert.deepEqual(payload(articles[a]), payload(articles[b]));
    assert.equal(digest(payload(articles[a])), expected);
    assert.notEqual(articles[a].titulo, articles[b].titulo);
  }
  const before = JSON.stringify(articles);
  assert.equal(catalog.articleCount(articles), 189);
  assert.equal(JSON.stringify(articles), before);
});

test('either legacy index grants only its identical content and removes both copies from the reward pool', () => {
  for (const [a, b] of [[14, 22], [15, 23]]) {
    for (const stored of [[a], [b], [String(b)], [a, b, a]]) {
      assert.equal(catalog.articleUnlocked(a, articles, stored), true);
      assert.equal(catalog.articleUnlocked(b, articles, stored), true);
      const available = catalog.availableArticleIndices(articles, stored);
      assert.equal(available.length, 188);
      assert.equal(available.includes(a) || available.includes(b), false);
      assert.equal(catalog.unlockedArticleCount(articles, stored), 1);
      assert.equal(catalog.articleUnlocked(a === 14 ? 15 : 14, articles, stored), false);
    }
    assert.equal(catalog.articleUnlocked(a, articles, []), false);
  }
});

test('all logical works exhaust exactly 189 reward entries without fabricated indices or duplicate credits', () => {
  const stored = [], input = [];
  while (catalog.availableArticleIndices(articles, stored).length) {
    const next = catalog.availableArticleIndices(articles, stored)[0];
    assert.equal(stored.includes(next), false);
    stored.push(next); input.push(next);
  }
  assert.equal(stored.length, 189);
  assert.equal(stored.includes(22) || stored.includes(23), false);
  assert.deepEqual(stored, input);
  assert.equal(catalog.unlockedArticleCount(articles, stored), 189);
  assert.equal(catalog.unlockedArticleCount(articles, [...stored.slice(0, -1), 14, 22, 15, 23, null, false, '', -1, 191, '999999999999999999999']), 188);
});

test('alias fails closed after any non-title content edit or unavailable source record', () => {
  const changed = copy(articles); changed[22].conclusao += ' changed';
  assert.equal(catalog.articleCount(changed), 190);
  assert.equal(catalog.articleUnlocked(14, changed, [22]), false);
  assert.equal(catalog.availableArticleIndices(changed, [22]).includes(14), true);
  assert.equal(catalog.articleCount(articles.slice(0, 20)), 20);
});

test('untrusted storage values never count as index zero, a valid article, or a second discovery', () => {
  const values = [null, false, true, '', ' ', -1, 0.5, NaN, Infinity, {}, [], 191, '1e2', '0x0', '999999999999999999999'];
  assert.equal(catalog.unlockedArticleCount(articles, values), 0);
  assert.equal(catalog.unlockedArticleCount(articles, { length: 191 }), 0);
  assert.equal(catalog.unlockedArticleCount(articles, ['0', 0, ' 0 ']), 1);
});

test('legacy favorites remain represented and removal deletes only the aliases of that exact content', () => {
  const favorites = new Set(['__art_22', '__art_14', 'dapa', '__art_15', 'unrelated']);
  assert.equal(catalog.favoriteFor('__art_14', favorites, articles), true);
  const next = catalog.toggleFavorite('__art_22', favorites, articles);
  assert.deepEqual([...next], ['dapa', '__art_15', 'unrelated']);
  assert.equal(favorites.has('__art_22'), true);
  assert.deepEqual([...catalog.toggleFavorite('__art_23', [], articles)], ['__art_15']);
  assert.deepEqual([...catalog.toggleFavorite('dapa', next, articles)], ['__art_15', 'unrelated']);
});

test('one work retains distinct clinical payloads, locks and favorites independently', () => {
  const raw = contents();
  raw.find(item => item.key === 'dapa').unlocked = true;
  raw.find(item => item.key === 'dapa').discovered = true;
  raw.find(item => item.key === '__art_22').favorite = true;
  const collapsed = catalog.collapseLibraryItems(raw, { articles, favorites: ['dapa', '__art_22'] });
  assert.equal(collapsed.length, raw.length - 2);
  const work = catalog.groupLibraryItems(collapsed).find(group => group.key === 'work:dapa_ckd');
  assert.equal(work.variants.length, 2);
  const source = work.variants.find(item => item.key === 'dapa');
  const scroll = work.variants.find(item => item.key === '__art_14');
  assert.equal(source.unlocked, true);
  assert.equal(source.favorite, true);
  assert.equal(scroll.unlocked, false);
  assert.equal(scroll.favorite, true);
  assert.notEqual(source.summary, scroll.summary);
  assert.equal(source.summary, refs.dapa.resumo);
  assert.equal(scroll.summary, articles[14].resumo);
  assert.deepEqual(catalog.groupLibraryItems(work.variants.filter(item => !item.unlocked))[0].variants.map(item => item.key), ['__art_14']);

  const oldSave = contents();
  const oldScroll = oldSave.find(item => item.key === '__art_22');
  oldScroll.unlocked = true;
  oldScroll.discovered = true;
  const alias = catalog.collapseLibraryItems(oldSave, { articles }).find(item => item.key === '__art_14');
  assert.equal(alias.title, articles[22].titulo);
  assert.equal(alias.displayTitle, source.displayTitle);
  assert.equal(alias.originalTitle, source.originalTitle);
  assert.equal(alias.publicationUrl, source.publicationUrl);
  assert.equal(alias.summary, articles[22].resumo);
});

test('verified work map groups the current catalog while preserving every nonidentical variant and access state', () => {
  const raw = contents(), before = JSON.stringify(raw);
  const collapsed = catalog.collapseLibraryItems(raw, { articles, favorites: [] });
  assert.equal(catalog.works.length, 33);
  assert.equal(catalog.groupLibraryItems(collapsed).length, raw.length - 39);
  for (const item of collapsed) {
    const original = raw.find(old => old.key === item.key);
    for (const field of ['summary', 'conclusion', 'impact', 'curiosity']) assert.equal(item[field], original[field]);
    assert.equal(item.unlocked, false);
    assert.equal(item.discovered, false);
  }
  assert.equal(JSON.stringify(raw), before);
  assert.equal(Object.isFrozen(catalog.works), true);
  assert.equal(catalog.works.every(work => Object.isFrozen(work) && Object.isFrozen(work.members)), true);
});

test('repaired Captopril/MDRD works group without unlocking variants or conflating distinct experimental papers', () => {
  const data = catalog.collapseLibraryItems(contents(), { articles });
  const item = key => data.find(item => item.key === key);
  assert.equal(catalog.workKey(item('sharp_study')), catalog.workKey(item('__art_26')));
  assert.notEqual(item('sharp_study').summary, item('__art_26').summary);
  assert.equal(catalog.workKey(item('kdigo_ckd')), catalog.workKey(item('kdigo_ckd_2024')));
  assert.equal(catalog.workKey(item('kdigo_ckd')), catalog.workKey(item('__art_18')));
  assert.equal(catalog.articleUnlocked(26, articles, []), false);
  assert.notEqual(catalog.workKey(item('advocate_retraction_2026')), catalog.workKey(item('__art_35')));
  assert.equal(catalog.workKey(item('__art_9')), catalog.workKey(item('__art_40')));
  assert.equal(catalog.articleUnlocked(9, articles, [40]), false);
  assert.equal(catalog.workKey(item('lewis_ieca_dn_1993')), catalog.workKey(item('__art_6')));
  assert.equal(catalog.workKey(item('__art_7')), catalog.workKey(item('__art_122')));
  assert.equal(catalog.workKey(item('__art_7')), catalog.workKey(item('__art_132')));
  assert.equal(catalog.workKey(item('__art_43')), catalog.workKey(item('__art_125')));
  assert.notEqual(catalog.workKey(item('__art_7')), catalog.workKey(item('__art_43')));
  assert.notEqual(catalog.workKey(item('__art_5')), catalog.workKey(item('__art_117')));
  assert.equal(catalog.articleUnlocked(122, articles, [7]), false);
  assert.equal(catalog.articleUnlocked(132, articles, [7]), false);
  assert.equal(catalog.articleUnlocked(125, articles, [43]), false);
  assert.equal(catalog.workKey(item('fidelio_dkd')), catalog.workKey(item('__art_15')));
  assert.notEqual(item('fidelio_dkd').summary, item('__art_15').summary);
});

test('future publication metadata edits cannot silently keep an old work binding', () => {
  const item = contents().find(item => item.key === 'dapa');
  assert.equal(catalog.workKey(item), 'work:dapa_ckd');
  assert.equal(catalog.workKey({ ...item, source: 'A different publication' }), 'content:dapa');
});

test('collection achievement uses 189 distinct scrolls, rejects duplicate storage credit, and does not write progress', () => {
  const values = new Map(), writes = [];
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => writes.push([key, value]) };
  const context = vm.createContext({ window: { NQLibraryCatalog: catalog, questionBank: [{ r: ['dapa'] }] },
    localStorage: storage, nqProgressStorage: () => storage, nefroArticles: articles, refsDB: refs,
    document: { addEventListener() {}, getElementById() { return null; }, createElement() { return {}; }, head: { appendChild() {} } }, console });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/achievements.js'), 'utf8') + '\n;globalThis.progress=getGrimoireAchievementProgress;', context);
  values.set('nq-unlocked-refs', '["dapa"]');
  const all = catalog.availableArticleIndices(articles, []);
  values.set('unlockedArticles', JSON.stringify(all.map(index => index === 14 ? 22 : index === 15 ? 23 : index)));
  assert.equal(context.progress().complete, true);
  assert.equal(context.progress().target, 190);
  values.set('unlockedArticles', JSON.stringify([...all.slice(0, -1), 14, 22, 15, 23]));
  assert.equal(context.progress().complete, false);
  assert.deepEqual(writes, []);
});
