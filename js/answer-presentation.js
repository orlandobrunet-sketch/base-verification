/* Presentation only: authorial content and answer identities never change. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const META = '_answerPresentation';
  const META_KEYS = ['version', 'sourceRevision', 'sourceQuestion', 'order', 'optionIds'];
  const UINT32_RANGE = 0x100000000;
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

  // Persistence is JSON data. Reject getters, holes, cycles and values JSON would silently discard.
  function copy(value, ancestors = new Set()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object' || ancestors.has(value)) throw new TypeError('JSON data required.');
    const tag = Object.prototype.toString.call(value);
    if (tag !== '[object Object]' && tag !== '[object Array]') throw new TypeError('JSON data required.');
    ancestors.add(value);
    const result = Array.isArray(value) ? [] : {};
    const keys = Object.keys(value);
    if (Array.isArray(value) && (keys.length !== value.length ||
        keys.some((key, index) => key !== String(index)))) throw new TypeError('Dense arrays required.');
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !own(descriptor, 'value')) throw new TypeError('Accessors are not snapshots.');
      Object.defineProperty(result, key, {value: copy(descriptor.value, ancestors),
        writable: true, enumerable: true, configurable: true});
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

  // Synchronous SHA-256 keeps the same content revision in browsers and saved JSON.
  // This identifies content; it does not authenticate a browser save or authorize rewards.
  function revision(source) {
    const encoded = unescape(encodeURIComponent(canonical(source)));
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
        const second = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) +
          (a & b ^ a & c ^ b & c)) | 0;
        h = g; g = f; f = e; e = (d + first) | 0; d = c; c = b; b = a; a = (first + second) | 0;
      }
      [a, b, c, d, e, f, g, h].forEach((value, index) => { hash[index] = (hash[index] + value) | 0; });
    }
    return 'sha256:' + hash.map(value => (value >>> 0).toString(16).padStart(8, '0')).join('');
  }

  function validIdentity(q) {
    return object(q) && own(q, 'id') &&
      ((typeof q.id === 'string' && q.id.trim() !== '') || (typeof q.id === 'number' && Number.isFinite(q.id))) &&
      typeof q.q === 'string' && q.q.trim() !== '';
  }

  function validMC(q) {
    return validIdentity(q) &&
      Array.isArray(q.o) && q.o.length >= 2 && q.o.length <= 6 &&
      q.o.every(option => typeof option === 'string' && option.trim() !== '') &&
      Number.isSafeInteger(q.a) && q.a >= 0 && q.a < q.o.length;
  }

  function plainText(value) {
    return String(value || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, ' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function letterReference(text) {
    // Prefixes are case-insensitive, but the captured authored letter must be
    // uppercase. Otherwise Portuguese "resposta à/é" becomes a false option A/E.
    const prefixed = /\b(?:alternativas?|op(?:cao|coes)|itens?|letras?|respostas?|gabarito)(?:\s+(?:corret[oa]s?|incorret[oa]s?|e|eh|sao)){0,3}\s*[:\-]?\s*["'“”(]?([A-F])\b/gi;
    return [...text.matchAll(prefixed)].some(match => /^[A-F]$/.test(match[1])) ||
      /\(\s*[A-F]\s*\)|["'“”]\s*[A-F]\s*["'“”]/.test(text) ||
      /\b[A-F](?:\s+(?:[Ee]|[Oo][Uu])\s+|\s*[/+,]\s*)[A-F]\b/.test(text) ||
      /(?:^|[\n;])\s*[A-F]\s*[).:\-](?:\s|$)/i.test(text) ||
      /\b[A-F]\s+(?:(?:esta|e|eh)\s+(?:a\s+|uma\s+)?(?:correta|incorreta|melhor|verdadeira|falsa|errada|certa)|(?:correta|incorreta|errada|certa))\b/.test(text);
  }

  function eligibility(q, {format = 'single_mc'} = {}) {
    const reasons = [];
    try {
      const source = own(q || {}, META) ? restore(q)?._answerPresentation.sourceQuestion : copy(q);
      if (format !== 'single_mc') reasons.push('format_excluded:' + format);
      if (!validMC(source)) reasons.push('invalid_single_mc');
      else {
        const options = source.o.map(option => plainText(option).trim());
        if (options.every(option => /^(?:verdadeiro|falso|true|false|v|f|sim|nao|yes|no|certo|errado)$/i.test(option))) {
          reasons.push('boolean_options');
        }
        if (options.every(option => /^[\s\d.,+\-−–%<>=/]+(?:\s*(?:mg|g|kg|ml|l|mmol|meq|min|h|s|dias?|horas?)(?:\/[\w²^]+)?)?$/i.test(option))) {
          reasons.push('numeric_options');
        }
        const text = [source.q, source.e, ...source.o].map(plainText).join('\n');
        if (/\b(?:todas?|nenhuma|ambas|as demais)\b[^\n.!?]{0,45}\b(?:anteriores|acima|abaixo|precedentes|seguintes)\b/i.test(text) ||
            /\b(?:primeira|segunda|terceira|quarta|quinta|sexta|ultima)\s+(?:alternativa|opcao|resposta)\b/i.test(text)) {
          reasons.push('order_reference');
        }
        if (letterReference(text)) {
          reasons.push('letter_reference');
        }
      }
    } catch (_) { if (!reasons.includes('invalid_single_mc')) reasons.push('invalid_single_mc'); }
    return {eligible: reasons.length === 0, reasons};
  }

  function randomIndex(bound, random) {
    if (random !== undefined) {
      if (typeof random !== 'function') throw new TypeError('random must be a function.');
      const sample = random();
      if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new RangeError('random must return [0, 1).');
      return Math.floor(sample * bound);
    }
    const crypto = root.crypto || root.window?.crypto;
    const limit = UINT32_RANGE - UINT32_RANGE % bound;
    let value;
    do {
      if (crypto && typeof crypto.getRandomValues === 'function') {
        const buffer = new Uint32Array(1);
        crypto.getRandomValues(buffer);
        value = buffer[0];
      } else {
        const sample = Math.random();
        if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new RangeError('Invalid random sample.');
        value = Math.floor(sample * UINT32_RANGE);
      }
    } while (value >= limit);
    return value % bound;
  }

  const identityOrder = length => Array.from({length}, (_, index) => index);
  const ids = (sourceRevision, length) => identityOrder(length).map(index => 'nqa1:' + sourceRevision + ':o' + index);

  function present(q, {preserveOrder = false, random, format = 'single_mc'} = {}) {
    try {
      if (own(q || {}, META)) return restore(q);
      const source = copy(q);
      if (!validIdentity(source)) return null;
      if (format !== 'single_mc') return source;
      if (!validMC(source)) return null;
      const order = identityOrder(source.o.length);
      if (!preserveOrder && eligibility(source, {format}).eligible) {
        for (let index = order.length - 1; index > 0; index--) {
          const next = randomIndex(index + 1, random);
          [order[index], order[next]] = [order[next], order[index]];
        }
      }
      const sourceRevision = revision(source);
      return {...copy(source), o: order.map(index => source.o[index]), a: order.indexOf(source.a),
        [META]: {version: VERSION, sourceRevision, sourceQuestion: source,
          order, optionIds: ids(sourceRevision, source.o.length)}};
    } catch (_) { return null; }
  }

  function restore(q, authoredQuestion) {
    try {
      const saved = copy(q);
      if (!validIdentity(saved)) return null;
      if (!own(saved, META)) {
        if (authoredQuestion !== undefined && canonical(saved) !== canonical(copy(authoredQuestion))) return null;
        return saved;
      }
      const meta = saved[META];
      if (!object(meta) || Object.keys(meta).length !== META_KEYS.length ||
          !META_KEYS.every(key => own(meta, key)) || meta.version !== VERSION ||
          !validMC(meta.sourceQuestion) || own(meta.sourceQuestion, META) ||
          typeof meta.sourceRevision !== 'string' || meta.sourceRevision !== revision(meta.sourceQuestion) ||
          !Array.isArray(meta.order) || meta.order.length !== meta.sourceQuestion.o.length ||
          !meta.order.every(index => Number.isSafeInteger(index) && index >= 0 && index < meta.order.length) ||
          new Set(meta.order).size !== meta.order.length ||
          canonical(meta.optionIds) !== canonical(ids(meta.sourceRevision, meta.order.length))) return null;
      const source = meta.sourceQuestion;
      if (authoredQuestion !== undefined && canonical(source) !== canonical(copy(authoredQuestion))) return null;
      if (!eligibility(source).eligible && meta.order.some((index, display) => index !== display)) return null;
      const expected = {...copy(source), o: meta.order.map(index => source.o[index]), a: meta.order.indexOf(source.a), [META]: meta};
      return canonical(saved) === canonical(expected) ? saved : null;
    } catch (_) { return null; }
  }

  function originalIndex(q, display) {
    if (!Number.isSafeInteger(display) || display < 0) return null;
    const saved = restore(q);
    if (!saved || !Array.isArray(saved.o) || display >= saved.o.length) return null;
    return own(saved, META) ? saved[META].order[display] : display;
  }

  function optionId(q, display) {
    const index = originalIndex(q, display);
    if (index === null) return null;
    const saved = restore(q);
    if (own(saved, META)) return saved[META].optionIds[index];
    if (!validMC(saved)) return null;
    return ids(revision(saved), saved.o.length)[index];
  }

  const api = Object.freeze({VERSION, present, restore, originalIndex, optionId, snapshot: restore, eligibility});
  if (root.window) root.window.NQAnswers = api;
  else root.NQAnswers = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis === 'object' ? globalThis : this);
