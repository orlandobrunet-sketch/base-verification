/* Published question identity only. Content hashes are not signatures or reward authorization. */
(function (root) {
  'use strict';
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const profiles = ['main', 'exam', 'study', 'offline'];
  const hashPattern = /^sha256:[a-f0-9]{64}$/;
  function copy(value, ancestors = new Set()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object' || ancestors.has(value)) throw new TypeError('JSON data required.');
    const tag = Object.prototype.toString.call(value);
    if (tag !== '[object Object]' && tag !== '[object Array]') throw new TypeError('JSON data required.');
    ancestors.add(value);
    const result = Array.isArray(value) ? [] : {};
    const keys = Object.keys(value);
    if (Array.isArray(value) && (keys.length !== value.length || keys.some((key, index) => key !== String(index)))) {
      throw new TypeError('Dense arrays required.');
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !own(descriptor, 'value')) throw new TypeError('Accessors are not snapshots.');
      Object.defineProperty(result, key, {value: copy(descriptor.value, ancestors), enumerable: true,
        writable: true, configurable: true});
    }
    ancestors.delete(value);
    return result;
  }
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (object(value)) return '{' + Object.keys(value).sort().map(key =>
      JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
    return JSON.stringify(value);
  }
  function digest(value) {
    const encoded = unescape(encodeURIComponent(canonical(copy(value))));
    const words = [];
    for (let index = 0; index < encoded.length; index++) {
      words[index >> 2] = (words[index >> 2] || 0) | encoded.charCodeAt(index) << (24 - (index % 4) * 8);
    }
    const bits = encoded.length * 8;
    words[bits >> 5] = (words[bits >> 5] || 0) | 0x80 << (24 - bits % 32);
    words[((bits + 64 >> 9) << 4) + 15] = bits;
    const constants = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
      0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74,
      0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
      0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
      0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138,
      0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1,
      0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
      0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb,
      0xbef9a3f7, 0xc67178f2];
    const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const rotate = (value, count) => value >>> count | value << (32 - count);
    for (let block = 0; block < words.length; block += 16) {
      const schedule = [];
      let [a, b, c, d, e, f, g, h] = hash;
      for (let index = 0; index < 64; index++) {
        if (index < 16) schedule[index] = words[block + index] || 0;
        else {
          const x = schedule[index - 15], y = schedule[index - 2];
          schedule[index] = (schedule[index - 16] + (rotate(x, 7) ^ rotate(x, 18) ^ x >>> 3) +
            schedule[index - 7] + (rotate(y, 17) ^ rotate(y, 19) ^ y >>> 10)) | 0;
        }
        const first = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) +
          (e & f ^ ~e & g) + constants[index] + schedule[index]) | 0;
        const second = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + (a & b ^ a & c ^ b & c)) | 0;
        h = g; g = f; f = e; e = (d + first) | 0; d = c; c = b; b = a; a = (first + second) | 0;
      }
      [a, b, c, d, e, f, g, h].forEach((value, index) => { hash[index] = (hash[index] + value) | 0; });
    }
    return 'sha256:' + hash.map(value => (value >>> 0).toString(16).padStart(8, '0')).join('');
  }
  function referencesFor(author, references) {
    const result = {};
    for (const id of author.refs || author.r || []) {
      if (typeof id !== 'string') throw new TypeError('Reference IDs required.');
      Object.defineProperty(result, id, {value: own(references, id) ? copy(references[id]) : null,
        enumerable: true, writable: true, configurable: true});
    }
    return result;
  }
  function record(author, references) {
    const authorRevision = digest(author), referenceRevisions = {};
    for (const id of Object.keys(references)) {
      Object.defineProperty(referenceRevisions, id, {value: references[id] === null ? null : digest(references[id]),
        enumerable: true, writable: true, configurable: true});
    }
    return {authorRevision, referenceRevisions, recordRevision: digest({authorRevision, referenceRevisions})};
  }
  function helper() {
    const answers = root.window?.NQAnswers || root.NQAnswers;
    if (answers) return answers;
    if (typeof module === 'object' && module.exports) return require('./answer-presentation.js');
    throw new TypeError('NQAnswers unavailable.');
  }
  function bindingValid(binding, qid, profile) {
    return object(binding) && Object.keys(binding).length === 4 && binding.version === 1 &&
      binding.qid === qid && binding.profile === profile && hashPattern.test(binding.recordRevision);
  }
  function createVerifier({manifest, history = []} = {}) {
    const answers = helper(), entries = new Map();
    manifest = copy(manifest); history = copy(history);
    if (manifest?.version !== 1 || typeof manifest.release !== 'string' || !object(manifest.current) || !Array.isArray(history)) {
      throw new TypeError('Published manifest required.');
    }
    function add(entry) {
      const key = entry.qid + '\n' + entry.profile;
      const list = entries.get(key) || [];
      const duplicate = list.find(item => item.recordRevision === entry.recordRevision);
      if (duplicate) {
        if (duplicate.sourceRevision !== entry.sourceRevision) throw new TypeError('Conflicting source profile.');
        if (!entry.historical) list[list.indexOf(duplicate)] = entry;
      } else list.push(entry);
      entries.set(key, list);
    }
    for (const qid of Object.keys(manifest.current)) {
      const value = manifest.current[qid];
      if (!qid.trim() || !object(value) || !hashPattern.test(value.authorRevision) || !hashPattern.test(value.recordRevision) ||
          !object(value.referenceRevisions) || !object(value.sourceRevisions) ||
          Object.values(value.referenceRevisions).some(hash => hash !== null && !hashPattern.test(hash)) ||
          value.recordRevision !== digest({authorRevision: value.authorRevision, referenceRevisions: value.referenceRevisions})) {
        throw new TypeError('Invalid published record.');
      }
      for (const profile of Object.keys(value.sourceRevisions)) {
        if (!profiles.includes(profile) || !hashPattern.test(value.sourceRevisions[profile])) throw new TypeError('Invalid published profile.');
        add({...value, qid, profile, sourceRevision: value.sourceRevisions[profile], release: manifest.release,
          historical: false, policy: {material: false, pending: 'current', answered: 'current'}});
      }
    }
    for (const archived of history) {
      if (!object(archived) || typeof archived.qid !== 'string' || !object(archived.author) ||
          archived.author.qid !== archived.qid || typeof archived.release !== 'string' ||
          !object(archived.sources) || !object(archived.references) ||
          archived.policy?.material !== true || archived.policy.pending !== 'update-required') {
        throw new TypeError('Invalid published history.');
      }
      const refs = referencesFor(archived.author, archived.references), identity = record(archived.author, refs);
      for (const profile of Object.keys(archived.sources)) {
        const source = answers.restore(archived.sources[profile]);
        if (!profiles.includes(profile) || !source || source._answerPresentation || String(source.id) !== archived.qid ||
            !answers.present(source, {preserveOrder: true})) {
          throw new TypeError('Invalid archived profile.');
        }
        add({...identity, qid: archived.qid, profile, sourceRevision: digest(source), source,
          author: archived.author, references: refs, release: archived.release, historical: true,
          policy: {material: true, pending: 'update-required', answered: 'historical'}});
      }
    }
    function result(entry, question) {
      return {...(question ? {question: copy(question)} : {}),
        ...(entry.source ? {source: copy(entry.source)} : {}),
        ...(entry.author ? {author: copy(entry.author)} : {}),
        ...(entry.references ? {references: copy(entry.references)} : {}),
        binding: {version: 1, qid: entry.qid, profile: entry.profile, recordRevision: entry.recordRevision},
        sourceRevision: entry.sourceRevision, release: entry.release, historical: entry.historical, policy: copy(entry.policy)};
    }
    function choose(list, binding, qid, profile, question) {
      if (binding !== undefined && !bindingValid(binding, qid, profile)) return {status: 'unknown', candidates: []};
      if (binding !== undefined) list = list.filter(entry => entry.recordRevision === binding.recordRevision);
      if (!list.length) return {status: 'unknown', candidates: []};
      if (list.length !== 1) return {status: 'ambiguous', candidates: list.map(entry => result(entry, question))};
      return {status: 'known', value: result(list[0], question), candidates: []};
    }
    function inspect(snapshot, {profile, binding} = {}) {
      try {
        if (!profiles.includes(profile)) return {status: 'unknown', candidates: []};
        const question = answers.restore(snapshot);
        if (!question) return {status: 'unknown', candidates: []};
        const source = question._answerPresentation?.sourceQuestion || question;
        const sourceRevision = question._answerPresentation?.sourceRevision || digest(source), qid = String(question.id);
        const candidates = (entries.get(qid + '\n' + profile) || []).filter(entry =>
          entry.sourceRevision === sourceRevision && (!entry.source || answers.restore(question, entry.source)));
        return choose(candidates, binding, qid, profile, question);
      } catch (_) { return {status: 'unknown', candidates: []}; }
    }
    function inspectLegacy(qid, {profile, binding} = {}) {
      if (!profiles.includes(profile)) return {status: 'unknown', candidates: []};
      return choose(entries.get(String(qid) + '\n' + profile) || [], binding, String(qid), profile);
    }
    return Object.freeze({inspect, inspectLegacy,
      restoreKnown(snapshot, options) { const checked = inspect(snapshot, options); return checked.status === 'known' ? checked.value : null; },
      resolveLegacy(qid, options) { const checked = inspectLegacy(qid, options); return checked.status === 'known' ? checked.value : null; },
      current(qid, profile) { const entry = (entries.get(String(qid) + '\n' + profile) || []).find(item => !item.historical); return entry ? result(entry) : null; }});
  }
  function createCatalog({manifest, history = [], authors, sources, references} = {}) {
    const verifier = createVerifier({manifest, history}), answers = helper();
    const authorMap = new Map(), sourceMap = new Map();
    if (!Array.isArray(authors) || !object(sources)) throw new TypeError('Published runtime sources required.');
    if (own(sources, 'study') && !object(references)) throw new TypeError('Study reference registry required.');
    for (const author of copy(authors)) {
      if (typeof author.qid !== 'string' || authorMap.has(author.qid)) throw new TypeError('Unique stable authored IDs required.');
      authorMap.set(author.qid, author);
    }
    for (const profile of Object.keys(sources)) {
      if (!profiles.includes(profile) || !Array.isArray(sources[profile])) throw new TypeError('Runtime profile required.');
      for (const input of sources[profile]) {
        const source = answers.restore(input), qid = String(source?.id), expected = verifier.current(qid, profile);
        const author = authorMap.get(qid), manifestRecord = manifest.current[qid];
        if (!source || source._answerPresentation || !expected || !author ||
            digest(source) !== expected.sourceRevision || digest(author) !== manifestRecord.authorRevision ||
            sourceMap.has(qid + '\n' + profile)) throw new TypeError('Runtime source differs from published manifest.');
        const refs = references === undefined ? undefined : referencesFor(author, references);
        if (refs && record(author, refs).recordRevision !== expected.binding.recordRevision) throw new TypeError('Runtime reference cards differ from published manifest.');
        sourceMap.set(qid + '\n' + profile, {source, author, ...(refs ? {references: refs} : {})});
      }
    }
    function hydrate(value, profile) {
      const runtime = value.historical ? value : {...value, ...copy(sourceMap.get(value.binding.qid + '\n' + profile) || null)};
      if (!runtime.author || !runtime.source) return null;
      return runtime;
    }
    function inspect(snapshot, options = {}) {
      const checked = verifier.inspect(snapshot, options);
      if (checked.status === 'known') {
        const value = hydrate(checked.value, options.profile);
        return value ? {...checked, value} : {status: 'unavailable', candidates: []};
      }
      if (checked.status === 'ambiguous') {
        const candidates = checked.candidates.map(value => hydrate(value, options.profile));
        if (candidates.some(value => !value)) return {status: 'unavailable', candidates: []};
        return {...checked, candidates};
      }
      return checked;
    }
    function current(qid, profile) { const value = verifier.current(qid, profile); return value ? hydrate(value, profile) : null; }
    function inspectLegacy(qid, options = {}) {
      const checked = verifier.inspectLegacy(qid, options);
      if (checked.status === 'known') {
        const value = hydrate(checked.value, options.profile);
        return value ? {...checked, value} : {status: 'unavailable', candidates: []};
      }
      if (checked.status === 'ambiguous') return {...checked, candidates: checked.candidates.map(value => hydrate(value, options.profile)).filter(Boolean)};
      return checked;
    }
    return Object.freeze({current, inspect, inspectLegacy,
      resolve(snapshot, options) { const checked = inspect(snapshot, options); return checked.status === 'known' ? checked.value : null; },
      restoreKnown(snapshot, options) { return verifier.restoreKnown(snapshot, options); },
      resolveLegacy(qid, options) { const checked = inspectLegacy(qid, options); return checked.status === 'known' ? checked.value : null; }});
  }
  const api = Object.freeze({VERSION: 1, digest, createVerifier, createCatalog});
  if (root.window) root.window.NQQuestionRevisions = api;
  else root.NQQuestionRevisions = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis === 'object' ? globalThis : this);
