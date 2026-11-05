import { createHash } from 'node:crypto';
import { validarEixos } from './editorial-axes.mjs';
import { parseReferenceCards, referenceDigest } from './references.mjs';

export const CHAMBER_SOURCE = 'js/minigame-acidbase.js';
export const CHAMBER_CASES = ['aldric','mara','theron','vance','kael','vorgath','selene','edrin','liora','borius','isolde','corvin','ophelia','helena','brann','nara','galen','maelis','ivar','mireth'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = (a,b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
export const chamberLFDigest = text => createHash('sha256').update(text.replace(/\r\n?/g,'\n'),'utf8').digest('hex');
const fields = ['label','url','journal','ano','tipo','badge','badgeColor','impacto','icon','resumo','conclusao','curiosidade'];

// Read only the deliberately narrow source-selection grammar. Never evaluate PR JS.
// Unknown code in this block fails closed and needs an explicit parser review.
export function parseChamberSources(source) {
  if (typeof source !== 'string' || source.length > 1024*1024) throw Error('Chamber source unavailable or too large');
  const catalog = /const CASES = \[([\s\S]*?)\n\s*\];/.exec(source);
  if (!catalog) throw Error('Chamber catalog missing');
  const cases = [...catalog[1].matchAll(/^\s*\{\s*id:'([a-z]+)',[^\n]*\bbuild:_build[A-Za-z]+\s*\},?\s*$/gm)].map(m=>m[1]);
  if (cases.length !== CHAMBER_CASES.length || !same(cases, CHAMBER_CASES)) throw Error('Chamber catalog must contain the reviewed 20 distinct cases');
  const bindings = /function _appendCaseSources\(card, kase\) \{[\s\S]*?\n\s*const ids = (\[[^\n]*\]);\r?\n([\s\S]*?)\n\s*const section = card\.querySelector\('\.ab-refs'\);/.exec(source);
  if (!bindings) throw Error('Chamber source-selection block missing');
  const literals = text => {
    if (!/^'\w+'(?:\s*,\s*'\w+')*$/.test(text)) throw Error('Unsupported chamber reference literal');
    return [...text.matchAll(/'(\w+)'/g)].map(m=>m[1]);
  };
  const initial = literals(bindings[1].slice(1,-1));
  const byCase = new Map(cases.map(id=>[id,[...initial]]));
  for (const line of bindings[2].split(/\r?\n/).map(s=>s.trim()).filter(Boolean)) {
    const statement = /^if \((.+)\) ids\.push\((.+)\);$/.exec(line);
    if (!statement) throw Error('Unsupported chamber reference statement');
    const condition = statement[1]; let ids;
    if (/^kase\.id === '[a-z]+'(?: \|\| kase\.id === '[a-z]+')*$/.test(condition)) ids=[...condition.matchAll(/'([a-z]+)'/g)].map(m=>m[1]);
    else {
      const group = /^\[(.+)\]\.includes\(kase\.id\)$/.exec(condition);
      if (!group) throw Error('Unsupported chamber reference condition');
      ids=literals(group[1]);
    }
    const refs=literals(statement[2]);
    for (const id of ids) {
      if (!byCase.has(id)) throw Error('Unknown chamber reference consumer '+id);
      byCase.get(id).push(...refs);
    }
  }
  for (const [id,refs] of byCase) if (new Set(refs).size !== refs.length) throw Error('Duplicate chamber reference for '+id);
  return byCase;
}

export function validateChamberManifest(value, manifestPath) {
  const errors=[], prefix=manifestPath+': chamber_only';
  if (value.reference_only === true || value.change_type !== 'medical_editorial' || value.refs_policy !== 'declared' || value.expected_question_delta !== 0 || !object(value.questions) || Object.keys(value.questions).length) errors.push(prefix+': requires medical_editorial, declared refs, zero delta and empty questions; cannot combine reference_only');
  const review=value.chamber;
  if (!object(review)) return [...errors,prefix+': chamber review required'];
  for (const field of ['source_lf_sha256','report_lf_sha256']) if (!/^[a-f0-9]{64}$/.test(review[field] || '')) errors.push(prefix+': invalid '+field);
  if (typeof review.report_path !== 'string' || !/^docs\/superpowers\/specs\/[A-Za-z0-9_-]+\.md$/.test(review.report_path)) errors.push(prefix+': invalid report_path');
  if (!object(review.cases) || !same(Object.keys(review.cases), CHAMBER_CASES)) errors.push(prefix+': exactly 20 reviewed cases required');
  for (const [id,item] of Object.entries(review.cases || {})) {
    const axes=validarEixos(id,item,manifestPath);errors.push(...axes.errors);
    if (axes.publicacao !== 'LIBERADA') errors.push(prefix+': '+id+': own approval must be LIBERADA');
    if (!Array.isArray(item?.references) || !item.references.length || item.references.some(ref=>typeof ref!=='string'||!/^\w+$/.test(ref)) || new Set(item.references).size!==item.references.length) errors.push(prefix+': '+id+': unique case references required');
  }
  if (!object(value.references) || !Object.keys(value.references).length) errors.push(prefix+': added reference cards required');
  for (const [id,item] of Object.entries(value.references || {})) {
    if (!/^\w+$/.test(id) || !object(item) || item.action !== 'add' || !/^sha256:[a-f0-9]{64}$/.test(item.after_sha256 || '')) errors.push(prefix+': '+id+': exact added card hash required');
    if (!Array.isArray(item?.consumers) || !item.consumers.length || item.consumers.some(c=>!CHAMBER_CASES.includes(c)) || new Set(item.consumers).size!==item.consumers.length) errors.push(prefix+': '+id+': unique actual chamber consumers required');
  }
  return errors;
}

export function validateChamberBatch(input) {
  const errors=[], consumers=new Map(), issue=(message)=>errors.push({code:'CHAMBER_SCOPE',message});
  const {manifest,beforeTopicsText,afterTopicsText,beforeRefsText,afterRefsText,chamberSource,chamberReport}=input;
  if (beforeTopicsText !== afterTopicsText || input.changedPaths.includes('data/topics.js')) issue('Chamber-only batch must preserve topics.js bytes');
  if (!input.changedPaths.includes(CHAMBER_SOURCE) || !input.changedPaths.includes('data/refs.js')) issue('Chamber-only batch requires actual chamber and reference changes');
  const review=manifest.chamber;
  if (typeof chamberSource!=='string' || chamberLFDigest(chamberSource)!==review.source_lf_sha256) issue('Reviewed chamber source hash mismatch');
  let ownReview;
  if (typeof chamberReport!=='string' || chamberReport.length>1024*1024 || chamberLFDigest(chamberReport)!==review.report_lf_sha256) issue('Exact own clinical report unavailable or hash mismatch');
  else {
    const blocks=[...chamberReport.matchAll(/```nq-chamber-review\r?\n([\s\S]*?)\r?\n```/g)];
    try {if(blocks.length!==1)throw Error();ownReview=JSON.parse(blocks[0][1]);}catch{issue('Clinical report must contain one structured own-review block');}
  }
  if (!object(ownReview) || typeof ownReview.reviewer!=='string' || !ownReview.reviewer.trim() || ownReview.source_lf_sha256!==review.source_lf_sha256 || ownReview.references_lf_sha256!==chamberLFDigest(afterRefsText) || !object(ownReview.cases) || !same(Object.keys(ownReview.cases),CHAMBER_CASES)) issue('Clinical own review must match exact source, registry and all20 cases');
  let bindings;
  try {bindings=parseChamberSources(chamberSource);} catch(error) {issue(error.message);return{errors,consumers};}
  const before=parseReferenceCards(beforeRefsText).cards, after=parseReferenceCards(afterRefsText).cards;
  for (const [id,card] of before) if (!after.has(id)||referenceDigest(card)!==referenceDigest(after.get(id))) issue('Chamber-only batch cannot update/remove existing shared card '+id);
  const added=[...after.keys()].filter(id=>!before.has(id));
  if (!same(added,Object.keys(manifest.references))) issue('Added cards must exactly equal declared chamber references');
  for (const [id,refs] of bindings) {
    if (!same(refs,review.cases[id]?.references || [])) issue('Actual reference selection differs from reviewed case '+id);
    const actual=ownReview?.cases?.[id],declared=review.cases[id],axes=validarEixos(id,actual,review.report_path);
    if(axes.errors.length || axes.publicacao!=='LIBERADA' || ['evidencia','pendencia','veredito','publicacao'].some(field=>actual?.[field]!==declared?.[field]) || !Array.isArray(actual?.references) || !same(actual.references,refs)) issue('Own clinical report approval/bindings differ from declaration for '+id);
    for (const ref of refs) {
      if (!after.has(ref)) issue('Case '+id+' consumes missing reference '+ref);
      if (!consumers.has(ref)) consumers.set(ref,new Set());consumers.get(ref).add('chamber:'+id);
    }
  }
  for (const [id,item] of Object.entries(manifest.references)) {
    const card=after.get(id);
    if (!card || referenceDigest(card)!==item.after_sha256) {issue('Exact added card hash mismatch '+id);continue;}
    if (Object.keys(card).length!==fields.length || fields.some(field=>!Object.hasOwn(card,field)||(field==='ano'?!Number.isInteger(card[field]):typeof card[field]!=='string')) || !/^https:\/\//.test(card.url)) issue('Added card requires all 12 typed fields and HTTPS '+id);
    const actual=[...(consumers.get(id)||[])].map(c=>c.slice(8));
    if (!same(item.consumers,actual)) issue('Declared reference consumers differ from actual chamber consumers '+id);
  }
  return {errors,consumers};
}
