'use strict';
const fs = require('node:fs');
const path = require('node:path');
const b = require('../../../../tools/build-question-revision-manifest.cjs');
const author = require('./sustain6-candidates-A1.json');
const source = {id:'S1-root', publication:'Marso et al., SUSTAIN-6, NEJM2016;375:1834–1844',doi:'10.1056/NEJMoa1607141',
  fullText:'https://cronfa.swan.ac.uk/Record/cronfa30129/Download/0030129-12112016114729.pdf',
  access:'Aberta e lida independentemente cópia primária disponibilizada pela Swansea University:12páginas incluindo capa. Conferidos identidade/abstract/métodos, desfechos/estatística, resultados microvasculares/Tabela2 e discussão. EditorNEJM403; ACCSecurityWarning; PubMed27633186HHSonly. Essas falhas não são chamadas de leitura integral. A leitura integral pertinente foi da cópiaSwansea.',
  readLocations:['1834–1836:identidade,desenho,população,exclusões,desfechos e análise','1839–1840:resultadosmicrovasculares/Tabela2','1843:discussão/limitações'],
  scope:'Relato original do ensaio; não protocolo/appendix integral nem auditoria de outros estudos. ConsultaPMC pós-hoc recebeurecaptcha, portanto não é evidência independente lida nesta etapa. Nenhuma candidata ensina hipótese pós-hoc como fato.'};
const names=['Alinhamento ao OP','Validade de conteúdo','Validade de construto','Qualidade do enunciado','Alternativas','Distratores','Explicação','Referências','Ausência de cara de IA','Valor pedagógico'];
const crit=['Mais de uma resposta defensável','Referência não sustenta o gabarito','Deriva de objetivo','Conduta insegura premiada','Distrator absurdo','Trivia sem consequência clínica','Explicação contradiz gabarito','Dado decisivo ausente','Protocolo local não informado','Desatualização relevante'];
const checks={
  '1a93346d': {
    expected:'05c629efbe7265f8dfbcc901f3373460bc60f8630fce2965c63b68c5bc779a7e',
    op:'Interpretar o sinal ocular observado no SUSTAIN-6 sem converter associação de tratamento em mecanismo demonstrado.',
    competence:'Interpretação de evidência de segurança em diabetes/nefroproteção',
    why:'Preserva o sinal correto do original e seu contexto de retinopatia prévia. As alternativas agora são quatro interpretações do mesmo achado, sem catarata aguda/glaucoma/descolamento genéricos.',
    resource:'Tentei defenderCcomo explicação apenas pela retinopatia prévia: o relato mantém comparação randomizada entre grupos, portanto a prevalência de doença nos eventos não apaga o sinal. Dconfunde mecanismo com associação; o original explicitamente considera a causa incerta. Bnão decorre do benefício glicêmico. A não alega causalidade da queda daHbA1c nem toxicidade direta.',
    qidIdentity:'Mesmo OP/competência/conceito correto e pergunta reconhecível de segurança; expansão do contexto e correção da explicação não criam outro item. Preservarqid/FSRS.',
    claimLocations:['1834abstract','1839–1840microvascular/Tabela2','1843discussão'],
    distractorErrors:['Inferir benefício ocular a partir do benefício glicêmico','Atribuir todo o resultado a doença basal e negar comparação','Inferir mecanismo tóxico diretamente do resultado randomizado']
  },
  '516ec2a6': {
    expected:'5eea57f2bfdd4ea6f33b0726ce7ded4e689084b8b6889054891cee8a566b3fed',
    op:'Interpretar o composto renal secundário do SUSTAIN-6 pelo componente que conduziu seu resultado.',
    competence:'Interpretação de desfechos clínicos de nefroproteção',
    why:'Preserva a distinção entre sinal predominantemente albuminúrico e comprovação de benefício sobre falência renal. Não usa litíase/toxicidade direta como distratores fora do construto.',
    resource:'Tentei defenderB/C/Dporque filtração, creatinina e terapia substitutiva podem compor desfechos renais. Elas lhes atribuem primazia ou contribuição principal que o relato não demonstrou. A não afirma ausência definitiva de efeito em qualquer componente; limita a interpretação à contribuição principal descrita. Não exige generalizar aos pacientes em diálise excluídos.',
    qidIdentity:'Mesmo OP/competência/conceito albuminúrico e estudo; reescrita de distratores preserva identidade. Preservarqid/FSRS.',
    claimLocations:['1836Outcomes','1840Tabela2','1843discussão'],
    distractorErrors:['Trocar o primário cardiovascular por terapia renal substitutiva','Atribuir o composto principalmente à filtração','Atribuir o composto principalmente à duplicação da creatinina']
  }
};
const gate={evidence:'VERIFICADA',pending:'NENHUMA',verdict:'aprovada',publicationAuthorization:'LIBERADA'};
const questions=Object.fromEntries(author.questions.map(q=>{
  const d=checks[q.qid], c=q.candidate;
  if(!d || b.digest(c.fullLiteral)!=='sha256:'+d.expected || c.sortedCompactPythonSHA256!==d.expected) throw Error('Candidate changed: '+q.qid);
  return [q.qid,{version:{sha256:'sha256:'+d.expected,fullLiteral:c.fullLiteral},op:d.op,
    classification:{primaryCompetence:d.competence,bloom:'Analisar',miller:'Sabe como',intrinsicDifficulty:'intermediária; medium coerente com interpretação requerida'},
    confidence:'alta',justification:d.why,advogadoDoRecurso:{attempt:d.resource,result:'Nenhum argumento plausível de anulação remanescente identificado nesta versão.'},
    eliminatories:crit.map((name,i)=>({number:i+1,name,triggered:false})),nqEditorialScore:{dimensions:names.map((name,i)=>({name,score:i===8?1:2})),total:19,band:'Excelente'},
    gate,decisionTree:'§19: evidência permite avaliação; sem eliminatório; sem recurso remanescente; sem duplicata nas quatro dimensões entre os dois itens; score19 → aprovada.',
    sourceId:source.id,claimLocations:d.claimLocations,distractorErrors:d.distractorErrors,preserveFSRS:true,qidIdentity:d.qidIdentity,
    duplication:'As duas questões variam na decisão clínica e no perfil de dados: sinal ocular versus interpretação de composto renal. Busca do banco porSUSTAIN6/retinopatia+semaglutida retornou apenas esses doisIDs; isso é triagem, não prova de inexistência de todo overlap semântico.',
    mechanical:{fourAlternatives:c.fullLiteral.opts.length===4,uniqueAlternatives:new Set(c.fullLiteral.opts).size===4,answerUnchanged:c.fullLiteral.ans===q.before.fullLiteral.ans,sourceReferences:['sustain6']}}];
}));
const card=author.reference.candidate;
if(b.digest(card.fullLiteral)!=='sha256:6f6ed262373752793f550277a5a8b6883d91c00e2b1ca14ad82dda5036743117')throw Error('Cardchanged');
const fields={
  label:'Autor/acrônimo/ano conferidos na primeira página; nome reconhecível.',
  url:'DOI1607141 conferido na publicação;1603827pertence aLEADER. Link canônico correto, embora acesso direto tenha403.',
  journal:'Volume375,número19,páginas1834–1844 confirmados no fac-símile.',ano:'2016 confirmado no original.',
  tipo:'Desenho randomizado duplo-cego conferido emMethods; taxonomia adequada.',badge:'RCT, conforme contrato.',badgeColor:'#10b981, conforme contrato.',icon:'🔬, conforme contrato.',
  impacto:'Delimita sinal renal/ocular sem anunciar benefício de falência renal.',
  resumo:'População,randomização,doses de manutenção/tempo,desfechos,estimativas e exclusão de diálise conferidos nos localizadores dafonte; resultados secundários identificados. Não proclama superioridade confirmatória.',
  conclusao:'Interpretação conservadora compatível com desenho e discussão; não equivale a negar definitivamente qualquer benefício renal.',
  curiosidade:'Vazia; hipóteses e ensaios posteriores não verificados foram removidos.'
};
const out={schema:'NQ-independent-exact-candidate-review-v2',date:'2026-11-15',reviewer:'/root',independentOf:'/root/reference_metadata_1725',
  sourceAccess:[source],integrationBase:author.base,questions,
  reference:{referenceId:'sustain6',version:{sha256:b.digest(card.fullLiteral),fullLiteral:card.fullLiteral,sortedCompactPythonSHA256:card.sortedCompactPythonSHA256,orderedCompactPythonSHA256:card.orderedCompactPythonSHA256},
    wholeCardFieldCoverage:Object.entries(fields).map(([field,assessment])=>({field,assessment,sourceId:['badge','badgeColor','icon','curiosidade'].includes(field)?null:source.id})),
    gate,nqEditorialScore:null,confidence:'alta',
    consumerReview:{exactMainConsumers:['1a93346d','516ec2a6'],bothReviewedAbove:true,chamberConsumers:[],leaderCardUnchanged:true,automaticMergeRejected:true},
    note:'Aprovação deste card exato de12campos; não revisão clínica doLEADERnemdeoutroscards. Sem NQEditorialScore, que é rubrica de questão.',
    limitations:['Ensaio histórico, não afirmação de posição atual de toda a classe GLP1RA.','Campos opcionais/hipóteses não sustentados pela fonte exata foram removidos; qualquer edição material exige novo gate.']},
  disposition:'Somente esses dois objetos e esse card estãoLIBERADOSpor esta revisão. Originais e rascunhos autorais anteriores não recebem aprovação retroativa. A integração deve preservar versões publicadas antes da troca.'};
fs.writeFileSync(path.join(__dirname,'sustain6-independent-A1.json'),JSON.stringify(out,null,2)+'\n');
const md=['| Questão | OP | Evidência | Pendência | Veredito | Score | Eliminatório | Autorização | Ação |','|---|---|---|---|---|---|---|---|',...Object.entries(questions).map(([id,q])=>`|${id}|${q.op}|VERIFICADA|NENHUMA|aprovada|19/20|não|LIBERADA|Aplicar objeto exato, preservarqid/FSRS|`),'',`Fonte efetivamente aberta e lida: [cópia primáriaSwansea](${source.fullText}). ${source.access}`,'',...Object.entries(questions).flatMap(([id,q])=>[`## ${id}`,q.justification,`OP: ${q.op}. Analisar/Sabe como; intermediária.`,`Advogado do Recurso: ${q.advogadoDoRecurso.attempt}`,q.advogadoDoRecurso.result,`Dez eliminatórios checados: nenhum disparado. Score19/20: as nove dimensões restantes receberam2; ausência de cara deIA recebeu1 pela fórmula recorrente de discussão do estudo.`,`Decisão: ${q.decisionTree}`,q.qidIdentity,`Versão: ${q.version.sha256}. Texto integral noJSON; nenhuma edição pós-gate é coberta.`,'' ]),
  '## Card sustain6','VERIFICADA / NENHUMA / aprovada / LIBERADA. Os12campos foram conferidos separadamente noJSON. Não há score de questão para card. Somente os dois consumidores atuais foram aprovados. LEADER permanece outro estudo; nenhum merge automático.',`Versão: ${out.reference.version.sha256}.`];
fs.writeFileSync(path.join(__dirname,'sustain6-independent-A1.md'),md.join('\n')+'\n');
console.log(JSON.stringify({questions:Object.keys(questions),reference:'sustain6',gate,runtimeWritten:false}));
