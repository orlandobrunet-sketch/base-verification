function singleMatch(source, expression, label) {
  const matches = [...source.matchAll(expression)];
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label}; found ${matches.length}`);
  return matches[0][1];
}

export function extractVersions({ versionJson, serviceWorker, indexHtml }) {
  let parsed;
  try {
    parsed = JSON.parse(versionJson);
  } catch (error) {
    throw new Error(`Invalid version.json: ${error.message}`);
  }
  if (typeof parsed.version !== 'string') throw new Error('version.json has no string version');
  return {
    json: parsed.version,
    cache: singleMatch(serviceWorker, /const CACHE = 'nefroquest-v([0-9.]+)'/g, 'service-worker cache version'),
    comment: singleMatch(serviceWorker, /NefroQuest Service Worker — v([0-9.]+)/g, 'service-worker comment version'),
    sentry: singleMatch(indexHtml, /release:\s*'nefroquest@([0-9.]+)'/g, 'Sentry release version'),
  };
}
