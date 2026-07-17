const MANIFEST_PATTERN = /^docs\/editorial\/review-batches\/[^/]+\.json$/;
const ACTIONS = new Set(['rebuild', 'refs_only', 'retire', 'add', 'technical_only', 'reviewed_unchanged']);
const CHANGE_TYPES = new Set(['medical_editorial', 'technical_only']);
const REF_POLICIES = new Set(['unchanged', 'declared']);
const REVIEW_STATES = new Set(['required', 'unavailable']);
const REQUIRED = ['batch', 'change_type', 'expected_version', 'allowed_files', 'questions', 'expected_question_delta', 'refs_policy', 'external_review'];

export function findChangedManifest(changedPaths) {
  const matches = changedPaths.filter((path) => MANIFEST_PATTERN.test(path));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one changed editorial JSON manifest; found ${matches.length}`);
  }
  return matches[0];
}

export function validateManifest(value, manifestPath) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { manifest: value, errors: [`${manifestPath}: manifest must be an object`] };
  }
  for (const field of REQUIRED) if (!(field in value)) errors.push(`${manifestPath}: missing ${field}`);
  if (typeof value.batch !== 'string' || !value.batch.trim()) errors.push(`${manifestPath}: batch must be non-empty`);
  if (!CHANGE_TYPES.has(value.change_type)) errors.push(`${manifestPath}: unsupported change_type`);
  if (typeof value.expected_version !== 'string' || !/^\d+\.\d+$/.test(value.expected_version)) errors.push(`${manifestPath}: invalid expected_version`);
  if (!Array.isArray(value.allowed_files) || value.allowed_files.length === 0) {
    errors.push(`${manifestPath}: allowed_files must be a non-empty array`);
  } else {
    if (new Set(value.allowed_files).size !== value.allowed_files.length) errors.push(`${manifestPath}: allowed_files contains duplicates`);
    const normalizedPath = manifestPath.replaceAll('\\', '/');
    if (normalizedPath.includes('/') && !value.allowed_files.includes(normalizedPath)) errors.push(`${manifestPath}: allowed_files must include the manifest`);
  }
  if (!Number.isInteger(value.expected_question_delta)) errors.push(`${manifestPath}: expected_question_delta must be an integer`);
  if (!REF_POLICIES.has(value.refs_policy)) errors.push(`${manifestPath}: unsupported refs_policy`);
  if (value.refs_policy === 'declared' && (!value.references || typeof value.references !== 'object' || Array.isArray(value.references))) {
    errors.push(`${manifestPath}: references object is required when refs_policy is declared`);
  }

  if (!value.questions || typeof value.questions !== 'object' || Array.isArray(value.questions) || Object.keys(value.questions).length === 0) {
    errors.push(`${manifestPath}: questions must be a non-empty object`);
  } else {
    for (const [qid, declaration] of Object.entries(value.questions)) {
      if (!/^[a-f0-9]{8}$/.test(qid)) errors.push(`${manifestPath}: invalid qid ${qid}`);
      if (!declaration || typeof declaration !== 'object' || !ACTIONS.has(declaration.action)) errors.push(`${manifestPath}: invalid action for ${qid}`);
      if (typeof declaration?.preserve_fsrs !== 'boolean') errors.push(`${manifestPath}: preserve_fsrs must be boolean for ${qid}`);
      if (['retire', 'add'].includes(declaration?.action) && declaration.preserve_fsrs !== false) {
        errors.push(`${manifestPath}: ${declaration.action} requires preserve_fsrs false for ${qid}`);
      }
      if (declaration?.action === 'reviewed_unchanged' && declaration.preserve_fsrs !== true) {
        errors.push(`${manifestPath}: reviewed_unchanged requires preserve_fsrs true for ${qid}`);
      }
    }
  }

  const review = value.external_review;
  if (!review || typeof review !== 'object' || !REVIEW_STATES.has(review.greptile)) {
    errors.push(`${manifestPath}: invalid external_review.greptile`);
  } else if (review.greptile === 'unavailable' && (typeof review.fallback_reviewer !== 'string' || !review.fallback_reviewer.trim())) {
    errors.push(`${manifestPath}: fallback_reviewer is required when Greptile is unavailable`);
  }
  return { manifest: value, errors };
}
