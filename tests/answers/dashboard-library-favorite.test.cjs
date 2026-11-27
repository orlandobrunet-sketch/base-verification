'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalog = require('../../js/library-catalog.js');
const { load } = require('../../tools/build-question-revision-manifest.cjs');
const articles = load('data/articles.js', 'nefroArticles');
const source = fs.readFileSync(path.join(__dirname, '../../js/dashboard.js'), 'utf8');
const start = source.indexOf('function _dashToggleFavorite(');
const end = source.indexOf('function _rankingAvatar(', start);
assert(start >= 0 && end > start, 'native dashboard favorite handler must exist');

function environment({ key = '__art_122', unlocked = false, collection = 'all', saved = [key, '__art_132'] } = {}) {
  const values = new Map([['nq-bib-favorites', JSON.stringify(saved)]]), writes = [];
  const model = { key, unlocked, favorite: true };
  const label = { textContent: '★ Salvo' }, attributes = new Map(), classes = new Set(['is-active']);
  const document = { activeElement: null };
  const tab = { dataset: { libraryCollection: collection }, focus() { document.activeElement = tab; } };
  const article = { dataset: { libraryFavorite: 'true' }, hidden: false,
    contains: element => element === button };
  const button = { dataset: { libraryKey: key }, disabled: false,
    classList: { toggle(name, value) { if (value) classes.add(name); else classes.delete(name); } },
    setAttribute(name, value) { attributes.set(name, value); }, removeAttribute(name) { attributes.delete(name); },
    querySelector: selector => selector === 'span' ? label : null,
    closest: selector => selector === '[data-library-entry]' ? article : null,
    focus() { document.activeElement = button; } };
  const count = { textContent: '' };
  const pane = { querySelector: selector => selector === '[data-library-collection][aria-selected="true"]' ? tab : null,
    querySelectorAll: () => [] };
  document.activeElement = button;
  document.querySelector = selector => selector === '#nqdPane-library' ? pane : count;
  const context = vm.createContext({ Set, window: { NQLibraryCatalog: catalog }, document,
    localStorage: { setItem(key, value) { writes.push([key, value]); values.set(key, value); } },
    _readArray: key => JSON.parse(values.get(key) || '[]'),
    _libraryArticleData: () => articles, _libraryItem: itemKey => itemKey === key ? model : null,
    _libraryCache: { favorites: new Set(saved) },
    _applyLibraryView() { article.hidden = collection === 'favorites' && !model.favorite; } });
  vm.runInContext(source.slice(start, end) + '\n;globalThis.toggle = _dashToggleFavorite;', context);
  return { toggle: () => context.toggle(button), model, label, attributes, classes, document, tab, article, button,
    favorites: () => JSON.parse(values.get('nq-bib-favorites')), writes };
}

test('removing a locked historical favorite in Todos leaves no actionable save button or access write', () => {
  const env = environment();
  env.toggle();
  assert.deepEqual(env.favorites(), ['__art_132']);
  assert.equal(env.model.favorite, false);
  assert.equal(env.button.disabled, true);
  assert.equal(env.attributes.get('aria-disabled'), 'true');
  assert.equal(env.attributes.get('aria-pressed'), 'false');
  assert.equal(env.attributes.get('aria-label'), 'Favorito removido; conteúdo bloqueado');
  assert.equal(env.label.textContent, 'Favorito removido');
  assert.equal(env.classes.has('is-active'), false);
  assert.equal(env.article.hidden, false);
  assert.equal(env.document.activeElement, env.tab);
  assert.deepEqual(env.writes.map(([key]) => key), ['nq-bib-favorites']);
  env.toggle(); // A delegated/forged call must not re-add content that is still locked.
  assert.deepEqual(env.favorites(), ['__art_132']);
  assert.equal(env.writes.length, 1);
});

test('removing an aliased locked favorite from Favoritos removes only that content and returns focus to its tab', () => {
  const env = environment({ key: '__art_22', collection: 'favorites', saved: ['__art_22', '__art_14', '__art_132'] });
  env.toggle();
  assert.deepEqual(env.favorites(), ['__art_132']);
  assert.equal(env.article.hidden, true);
  assert.equal(env.document.activeElement, env.tab);
  assert.equal(env.button.disabled, true);
  env.toggle();
  assert.deepEqual(env.favorites(), ['__art_132']);
  assert.equal(env.writes.length, 1);
});

test('unlocked content remains available to remove and save again without changing its access', () => {
  const env = environment({ unlocked: true });
  env.toggle();
  assert.equal(env.button.disabled, false);
  assert.equal(env.attributes.has('aria-disabled'), false);
  assert.equal(env.label.textContent, '☆ Salvar');
  assert.equal(env.document.activeElement, env.button);
  env.toggle();
  assert.deepEqual(env.favorites(), ['__art_132', '__art_122']);
  assert.equal(env.label.textContent, '★ Salvo');
  assert.equal(env.model.unlocked, true);
  assert.deepEqual(env.writes.map(([key]) => key), ['nq-bib-favorites', 'nq-bib-favorites']);
});
