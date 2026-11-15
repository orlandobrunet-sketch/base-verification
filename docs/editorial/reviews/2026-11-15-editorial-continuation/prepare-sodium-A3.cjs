'use strict';
const fs=require('node:fs');
const path=require('node:path');
const b=require('../../../../tools/build-question-revision-manifest.cjs');
const draft=require('./sodium-candidates-A2.json');
draft.revision='sodium-A3';
draft.supersedes='A2: independent review correctly required medium in a4c85d32 and REVIEW taxonomy for the2013expert consensus. No A2 approval is inherited.';
const q=draft.questions.a4c85d32.candidate.fullLiteral;
q.diff='medium';
draft.questions.a4c85d32.candidate.sha256=b.digest(q);
const card=draft.references.hyponatremia_verbalis2013.candidate.fullLiteral;
card.tipo='Revisão';card.badge='REVIEW';card.badgeColor='#8b5cf6';card.icon='🔬';
draft.references.hyponatremia_verbalis2013.candidate.sha256=b.digest(card);
fs.writeFileSync(path.join(__dirname,'sodium-candidates-A3.json'),JSON.stringify(draft,null,2)+'\n');
const author=require('./sodium-author-A2.json');
author.stage='author assessment A3; independent exact review required';
author.supersedes='A2 author judgement on metadata is corrected: original hard not justified; expert consensus is not classified as formal guideline. A2 must not be applied.';
author.questions.a4c85d32.version=draft.questions.a4c85d32.candidate;
author.questions.a4c85d32.classification.intrinsicDifficulty='intermediária; campo diff corrigido de hard para medium';
author.questions.a4c85d32.nqEditorialScore.dimensions[2].score=2;
author.questions.a4c85d32.nqEditorialScore.total=19;
author.references.hyponatremia_verbalis2013.version=draft.references.hyponatremia_verbalis2013.candidate;
for(const row of author.references.hyponatremia_verbalis2013.wholeCardFieldCoverage){
  if(['tipo','badge','badgeColor','icon'].includes(row.field)) row.assessment='Taxonomia Revisão/REVIEW/#8b5cf6/🔬 para consenso de painel, nível de fonte explicitado no label/resumo; não diretriz formal nem revisão sistemática.';
}
author.limits=author.limits.filter(x=>!x.includes('hard legado')).concat('A3corrige as duas representações objetadas pelo revisor independente. Não é uma nova liberação automática deA2.');
fs.writeFileSync(path.join(__dirname,'sodium-author-A3.json'),JSON.stringify(author,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'sodium-author-A3.md'),'A3supersede A2. O parecer independente identificou corretamente dois reparos: dificuldade intermediária no caso de insuficiência cardíaca e classificação do consenso de2013comoREVIEW. Ambos foram corrigidos; os demais textos permanecem idênticos.\n\nO JSONA3traz os seis objetos integrais e os novos hashes. As avaliações de fonte, recurso e dez eliminatórios foram refeitas no mesmo escopo; score de a4=19, os demais mantêm18–19. O card tem revisão própria dos12campos e nenhum score de questão. A aplicação continua dependente da revisão independente exataA3.\n');
console.log(JSON.stringify({revision:draft.revision,changedQuestion:{qid:q.qid,hash:b.digest(q),diff:q.diff},changedReference:{id:'hyponatremia_verbalis2013',hash:b.digest(card),type:card.tipo},runtimeWritten:false}));
