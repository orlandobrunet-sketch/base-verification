/* Local presentation history only. Never a journey save, reward or progress key.
 * Normal profiles are separated locally; this is NOT cross-device persistence.
 * Clearing browser site data removes this history. The caller alone decides
 * when genuine playback or an explicit user skip makes an entry eligible.
 */
(function (root, create) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = create;
  else {
    let storage = null;
    try { storage = root.localStorage; } catch (_) { /* Session-only fallback. */ }
    root.NQEntrySeen = create({storage, eventTarget: root});
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEntrySeen(options) {
  'use strict';
  const config = options && typeof options === 'object' ? options : {};
  const storage = config.storage;
  const events = config.eventTarget;
  const PREFIX = 'nefroquest-entry-cinema-seen-v1:';
  const RECORD = '{"schema":1,"seen":true}';
  const LIMIT = 128;
  const heroes = new Set(['nephros', 'aquaria', 'glomerulus']);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const known = new Set(), fallback = new Set(), checked = new Set();
  let readErrors = 0, writeErrors = 0, invalidRecords = 0;
  let lastWritePersisted = null, disposed = false;

  function remember(set, key) {
    set.delete(key);
    set.add(key);
    while (set.size > LIMIT) set.delete(set.values().next().value);
  }
  function normalize(input) {
    try {
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          !own(input, 'owner') || !own(input, 'place') || !own(input, 'character') ||
          !own(input, 'version') || (own(input, 'domain') && input.domain !== 'normal')) return null;
      const owner = input.owner, place = input.place, character = input.character, version = input.version;
      if (owner !== null && (typeof owner !== 'string' || !owner.length || owner.length > 256 ||
          owner.trim() !== owner || /[\u0000-\u001f\u007f]/.test(owner))) return null;
      if (place !== 'hero' && place !== 'chamber') return null;
      if (place === 'hero' ? !heroes.has(character) : character !== null) return null;
      if (typeof version !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(version)) return null;
      const identity = owner === null ? 'guest:browser' : 'owner:' + owner;
      return PREFIX + [identity, place, character === null ? '-' : character, version]
        .map(encodeURIComponent).join(':');
    } catch (_) { return null; }
  }
  function validRecord(raw) {
    if (typeof raw !== 'string' || raw.length > 256) return false;
    try {
      const value = JSON.parse(raw);
      return !!value && typeof value === 'object' && !Array.isArray(value) &&
        value.schema === 1 && value.seen === true &&
        Object.keys(value).length === 2 && own(value, 'schema') && own(value, 'seen');
    } catch (_) { return false; }
  }
  function has(input) {
    if (disposed) return false;
    const key = normalize(input);
    if (!key) return false;
    remember(checked, key);
    try {
      if (!storage || typeof storage.getItem !== 'function') throw new Error('Storage unavailable');
      const raw = storage.getItem(key);
      if (validRecord(raw)) {
        remember(known, key);
        fallback.delete(key);
        return true;
      }
      if (raw !== null) {
        invalidRecords++;
        known.delete(key); fallback.delete(key);
        return false;
      }
      // A failed write still suppresses repeated prompts in this page only.
      if (fallback.has(key)) return true;
      known.delete(key);
      return false;
    } catch (_) {
      readErrors++;
      return known.has(key) || fallback.has(key);
    }
  }
  function mark(input) {
    if (disposed) return false;
    const key = normalize(input);
    if (!key) return false;
    remember(checked, key);
    remember(known, key);
    try {
      if (!storage || typeof storage.setItem !== 'function') throw new Error('Storage unavailable');
      storage.setItem(key, RECORD);
      fallback.delete(key);
      lastWritePersisted = true;
    } catch (_) {
      writeErrors++;
      remember(fallback, key);
      lastWritePersisted = false;
    }
    return true;
  }
  function onStorage(event) {
    if (disposed || !event || (event.storageArea && storage && event.storageArea !== storage)) return;
    if (event.key === null) { known.clear(); fallback.clear(); return; }
    if (typeof event.key === 'string' && event.key.startsWith(PREFIX)) {
      known.delete(event.key); fallback.delete(event.key);
    }
  }
  try { events?.addEventListener?.('storage', onStorage); } catch (_) { /* Reads remain dynamic. */ }
  return Object.freeze({
    has, mark,
    inspect: () => Object.freeze({
      scope: 'local-browser-per-owner', crossDeviceSync: false,
      knownSeenCount: known.size, sessionFallbackCount: fallback.size,
      checkedKeyCount: checked.size, readErrors, writeErrors, invalidRecords,
      lastWritePersisted, disposed
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      try { events?.removeEventListener?.('storage', onStorage); } catch (_) {}
      known.clear(); fallback.clear(); checked.clear();
    }
  });
}));
