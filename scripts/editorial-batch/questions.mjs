function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function canonical(value) {
  return JSON.stringify(stableValue(value));
}

export function parseQuestions(source, pathLabel = 'data/topics.js') {
  const questions = new Map();

  for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line.startsWith('{')) continue;
    if (!(line.endsWith('},') || line.endsWith('}'))) {
      throw new Error(`${pathLabel}:${index + 1}: malformed one-line question object`);
    }

    let value;
    try {
      value = JSON.parse(line.endsWith('},') ? line.slice(0, -1) : line);
    } catch (error) {
      throw new Error(`${pathLabel}:${index + 1}: invalid question JSON: ${error.message}`);
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${pathLabel}:${index + 1}: question must be an object`);
    }
    if (typeof value.qid !== 'string' || value.qid.length === 0) {
      throw new Error(`${pathLabel}:${index + 1}: question has no valid qid`);
    }
    if (questions.has(value.qid)) {
      throw new Error(`${pathLabel}:${index + 1}: duplicate qid ${value.qid}`);
    }
    questions.set(value.qid, value);
  }

  if (questions.size === 0) {
    throw new Error(`${pathLabel}: no question objects found`);
  }
  return questions;
}

export function changedQuestionIds(beforeMap, afterMap) {
  const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  return [...ids]
    .filter((qid) => canonical(beforeMap.get(qid)) !== canonical(afterMap.get(qid)))
    .sort();
}

export function equalExceptRefs(before, after) {
  if (!before || !after) return false;
  const beforeCopy = structuredClone(before);
  const afterCopy = structuredClone(after);
  delete beforeCopy.refs;
  delete afterCopy.refs;
  return canonical(beforeCopy) === canonical(afterCopy);
}
