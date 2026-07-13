const CARD_DECLARATION = /^  ([a-z0-9_]+)\s*:\s*\{/gm;

export function parseReferenceIds(source, pathLabel = 'data/refs.js') {
  const ids = new Set();
  for (const match of source.matchAll(CARD_DECLARATION)) {
    const id = match[1];
    if (ids.has(id)) throw new Error(`${pathLabel}: duplicate reference id ${id}`);
    ids.add(id);
  }
  if (ids.size === 0) throw new Error(`${pathLabel}: no reference cards found`);
  return ids;
}

export function referenceConsumers(questionMap) {
  const consumers = new Map();
  for (const [qid, question] of questionMap) {
    if (!Array.isArray(question.refs)) continue;
    for (const referenceId of question.refs) {
      if (!consumers.has(referenceId)) consumers.set(referenceId, new Set());
      consumers.get(referenceId).add(qid);
    }
  }
  return consumers;
}
