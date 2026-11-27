'use strict';
const fs = require('node:fs');
const path = require('node:path');
const b = require('../../../../tools/build-question-revision-manifest.cjs');
const draft = require('./sodium-candidates-A2.json');
const sources = [
  {id:'H14', publication:'Spasovski et al. 2014; EJE 170:G1–G47', doi:'10.1530/EJE-13-1020', url:'https://icuscenarios.com/wp-content/uploads/2023/02/European-hyponatremia-guidelines.pdf', identityUrl:'https://www.ese-hormones.org/publications/directory/ese-clinical-guideline-for-the-management-of-hyponatraemia/', access:'Cópia integral do documento primário aberta, 47 páginas; identidade confirmada no portal oficial ESE. OUP/DOI redirecionaram a página inacessível. Leitura focal das seções citadas, não alegação de auditoria de cada recomendação das 47 páginas.', locations:['Tabela 6, G15','5.9.2, G17','6.3.1, G22','7.1.1, G28','7.4.3, G34','7.5, G38']},
  {id:'H13', publication:'Verbalis et al. 2013; Am J Med 126(10 Suppl 1):S1–S42', doi:'10.1016/j.amjmed.2013.07.006', url:'https://cdn1.redemc.net/campus/wp-content/uploads/2019/08/guia-tto-hipona-rev-amjmed2013.pdf', access:'PDF primário integral aberto,42 páginas incluindo CME; lidos trechos S18–S24 e S29 para os candidatos. É painel de especialistas; apoio educacional da Otsuka declarado no documento. Não é a diretriz europeia de 2014.', locations:['Desmielinização osmótica, S18','Tabela 3/S20 e limites/rebaixamento S20–S21','Tolvaptana e cautelas, S23/S29','Potássio/tiazídicos, S24']},
  {id:'F21', publication:'SAMSCA U.S. Prescribing Information, revisão 04/2021', url:'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=5526617c-c7b9-4556-886d-729bbabbc566', access:'Texto regulatório integral aberto; advertência destacada e seções1,2,4,5 lidas. Contrachecagem de segurança, não classificada falsamente como ensaio ou diretriz de sociedade.', locations:['Boxed warning','2.1','4','5.1–5.4']}
];
const details = {
  a4c85d32: {
    op:'Integrar estado volêmico, sódio urinário e concentração urinária para reconhecer hiponatremia associada à insuficiência cardíaca.', competence:'Diagnóstico hidroeletrolítico contextualizado', bloom:'Aplicar', miller:'Sabe como', difficulty:'intermediária; campo histórico hard preservado neste lote; calibração quantitativa não inferida da redação',
    rationale:'Acrescenta congestão e coleta anterior a diuréticos, que afastam a suposição de volemia não informada.', sources:['H14'], locations:['5.9.2','Tabela6','6.3.1'],
    challenge:'Poderia ser depleção com sódio urinário baixo? Edema e turgência jugular tornam a congestão decisiva. Poderia ser SIADH coexistente? Não é a melhor explicação única desse conjunto e não há euvolemia. A coleta pré-diurético limita a interferência.',
    errors:['Classificar congestão como euvolemia/SIADH','Tomar baixo sódio urinário como prova isolada de hipovolemia','Ignorar que polidipsia isolada tende a diluir a urina'], scores:[2,2,1,2,2,1,2,2,2,2]
  },
  '3fa2737c': {
    op:'Reconhecer hiponatremia aguda gravemente sintomática após RTU e priorizar tratamento hipertônico monitorado.', competence:'Manejo inicial seguro de emergência hidroeletrolítica', bloom:'Aplicar', miller:'Sabe como', difficulty:'intermediária',
    rationale:'Confirma hipotonicidade, glicemia e início agudo; acrescenta convulsão e estabilização inicial. Não presume que toda solução de irrigação tenha a mesma tonicidade.', sources:['H14'], locations:['6.2/Tabela10','7.1.1'],
    challenge:'E toxicidade por outros solutos da irrigação? O quadro explicitamente hipotônico e convulsivo requer manejo da hiponatremia sem impedir investigação paralela. E furosemida se houver congestão? Pode ser adjuvante em contextos próprios, mas aguardar a diurese não substitui o resgate hipertônico. Não há choque não tratado no enunciado.',
    errors:['Tratar crise grave apenas com restrição','Adiar resgate até resposta diurética','Reservar salina3% após tentativa de isotônica'], scores:[2,2,2,1,2,1,2,2,2,2]
  },
  e94a6488: {
    op:'Identificar e conter hipercorreção de hiponatremia crônica em paciente com alto risco de desmielinização.', competence:'Segurança da correção hidroeletrolítica', bloom:'Aplicar', miller:'Sabe como', difficulty:'intermediária',
    rationale:'Quantifica correção e aquarese; não apresenta10mEq/Lcomo limite universal seguro para alcoolismo/hipocalemia. Estabilização hemodinâmica e apoio especializado são explícitos.', sources:['H13','H14'], locations:['H13Tabela3/S20–S21/S24','H147.5'],
    challenge:'Bastaria parar a salina? A aquarese de400mL/h pode continuar elevando o sódio; a alternativaAadiciona restrição, que não repõe a perda de água. É preciso abandonar a reposição deK? Não: a explicação mantém sua necessidade de controle e não a suspende automaticamente. Desmopressina/água não são receita domiciliar ou profilaxia universal.',
    errors:['Confundir suspensão de salina com interrupção de aquarese','Perseguir normalização do Na apesar de alto risco','Acrescentar aquarético à perda de água já excessiva'], scores:[2,2,2,2,2,1,2,2,1,2]
  },
  d9257155: {
    op:'Reconhecer síndrome de desmielinização osmótica após correção rápida de hiponatremia crônica.', competence:'Reconhecimento de complicação iatrogênica', bloom:'Aplicar', miller:'Sabe como', difficulty:'intermediária',
    rationale:'Substitui mera expansão do nome por evolução clínica bifásica; conceito correto e decisão permanecem reconhecíveis. Retira a afirmação de irreversibilidade inevitável.', sources:['H13'], locations:['Desmielinização osmótica/S18'],
    challenge:'Wernicke ou edema cerebral poderiam produzir alteração neurológica? A sequência de melhora após correção excessiva e deterioração motora tardia favorece desmielinização. Não se declara confirmação radiológica ou irreversibilidade. Hipertensão grave e sinais de deficiência de tiamina não foram dados.',
    errors:['Atribuir déficit tardio à hiponatremia inicial','Selecionar encefalopatia sem integrar tempo/iatrogenia','Confundir risco de sequela com desfecho inevitável'], scores:[2,2,2,2,2,1,2,2,2,2]
  },
  '21a99f07': {
    op:'Reconhecer condições de uso seguro da tolvaptana quando sua indicação para SIADH já foi selecionada.', competence:'Segurança farmacoterapêutica hidroeletrolítica', bloom:'Aplicar', miller:'Sabe como', difficulty:'intermediária',
    rationale:'Preserva núcleo do original: uso selecionado com monitorização, não primeira linha universal. Separa essa segurança de recomendar vaptanos a todos os pacientes e troca a referência europeia conflitante por painel pertinente.', sources:['H13','F21','H14'], locations:['H13S23/S29','F21boxedwarning/2/5.1','H147.4.3'],
    challenge:'A diretriz europeia contraindica/recomenda contra vaptanos nesse cenário? Há divergência real de posição terapêutica, registrada. O item não pergunta qual segunda linha escolher; pergunta segurança caso selecionado, apoiada em painel e bula. Não há emergência neurológica, hipovolemia ou ausência de acesso à água presumida como aceitável.',
    errors:['Adiar primeiro controle por uma semana','Manter restrição rigorosa com aquarese ativa','Combinar aquarético com salina hipertônica para acelerar resposta'], scores:[2,2,2,2,2,1,2,2,1,2]
  },
  e2aae4c7: {
    op:'Interpretar exames compatíveis com SIADH sem dispensar sua avaliação de exclusão.', competence:'Validade diagnóstica de distúrbios do sódio', bloom:'Aplicar', miller:'Sabe como', difficulty:'intermediária',
    rationale:'Alternativas paralelas sobre fechamento diagnóstico; não transforma urina concentrada ou natriúria em testes confirmatórios isolados.', sources:['H14'], locations:['Tabela6','6.3.1.5–6','5.8.2–3'],
    challenge:'Uma insuficiência adrenal secundária pode imitar todos os dados? Sim; por isso precisa ser avaliada. Exige atribuir a todo hipotireoidismo uma causa de hiponatremia? Não, a opção e a explicação delimitam disfunção clinicamente relevante. Vasopressina não resolve as exclusões.',
    errors:['Usar vasopressina como confirmação autossuficiente','Inventar corte confirmatório único de sódio urinário','Dispensar revisão de diuréticos pela urina concentrada'], scores:[2,2,2,2,2,1,2,2,1,2]
  }
};
const names = ['Alinhamento ao OP','Validade de conteúdo','Validade de construto','Qualidade do enunciado','Alternativas','Distratores','Explicação','Referências','Ausência de cara de IA','Valor pedagógico'];
const criteria = ['Mais de uma resposta defensável','Referência não sustenta o gabarito','Deriva de OP','Conduta insegura premiada','Distrator absurdo','Trivia sem consequência clínica','Explicação contradiz gabarito','Dado decisivo ausente','Protocolo local não informado','Desatualização relevante'];
const out = {schema:'NQ-author-exact-candidate-review-v2',date:'2026-11-15',reviewer:'/root',stage:'author assessment; independent review still required for this integration',integrationBase:draft.integrationBase,
  sourceAccess:sources,limits:['Não é revisão de741questões nem liberação dos cards compartilhadoshypona/verbalis2022.','Sem teste empírico de dificuldade ou processo de resposta; hard legado em a4c85d32 não é validação psicométrica.','DraftESE2026 localizado como draft-for-review; não tratado como diretriz final vigente.','A1 não é aplicável: taxonomia de cards inadequada; só A2 é candidata.'],
  questions:Object.fromEntries(Object.entries(details).map(([id,d])=>{
    const c=draft.questions[id].candidate; const total=d.scores.reduce((a,n)=>a+n,0);
    return [id,{version:c,op:d.op,classification:{primaryCompetence:d.competence,bloom:d.bloom,miller:d.miller,intrinsicDifficulty:d.difficulty},rationale:d.rationale,
      sourceClaims:{sourceIds:d.sources,locations:d.locations,clinicalErrors:d.errors},advogadoDoRecurso:{attempt:d.challenge,result:'Nenhum argumento plausível de anulação remanescente identificado pelo autor para A2; revisão independente deve repetir a tentativa.'},
      eliminatories:criteria.map((name,i)=>({number:i+1,name,triggered:false})),nqEditorialScore:{dimensions:names.map((name,i)=>({name,score:d.scores[i]})),total,band:'Excelente'},
      gate:{evidence:'VERIFICADA',pending:'NENHUMA',verdict:'aprovada',publicationAuthorization:'LIBERADA'},applicationHold:'Não aplicada; integração requer parecer independente do mesmohash. Esta decisão autoral não pode ser herdada por outra versão.',decisionTree:'§19: evidência verificada; sem eliminatório, recurso remanescente ou duplicata identificada; score≥18 → aprovada. Identidade/op/competência/conceito corretos preservados; manterqid/FSRS.',
      answerLengths:c.fullLiteral.opts.map(s=>({characters:[...s].length,words:s.split(/\s+/u).filter(Boolean).length})),preserveFSRS:true}];
  })),
  references:Object.fromEntries(Object.entries(draft.references).map(([id,r])=>[id,{referenceId:id,version:r.candidate,
    wholeCardFieldCoverage:Object.keys(r.candidate.fullLiteral).map(field=>({field,assessment: ['badge','badgeColor','icon'].includes(field)?'Taxonomia de Diretriz; painel de recomendações explicitamente descrito, sem atribuição a sociedade/GRADE.':field==='curiosidade'?'Vazio; nenhuma afirmação adicional.':['resumo','conclusao','impacto'].includes(field)?'Afirmações delimitadas às recomendações efetivamente lidas emH13; sem generalizar a toda hiponatremia.':'Identidade bibliográfica conferida no PDF primário/DOI.'})),
    sourceIds:['H13'],nqEditorialScore:null,gate:{evidence:'VERIFICADA',pending:'NENHUMA',verdict:'aprovada',publicationAuthorization:'LIBERADA'},applicationHold:'Aguarda revisão independente dos12campos deste hash; não alterahypona nem verbalis2022.'}]))};
for(const [id,q] of Object.entries(out.questions)) if(b.digest(q.version.fullLiteral)!==q.version.sha256) throw Error(id);
fs.writeFileSync(path.join(__dirname,'sodium-author-A2.json'),JSON.stringify(out,null,2)+'\n');
const md=['| Questão | OP | Evidência | Pendência | Veredito | Score | Eliminatório | Autorização autoral | Ação |','|---|---|---|---|---|---|---|---|',...Object.entries(out.questions).map(([id,q])=>`|${id}|${q.op}|VERIFICADA|NENHUMA|aprovada|${q.nqEditorialScore.total}|não|LIBERADA|Aguardar revisão independente exata|`),'','A2 é a única candidata. As autorizações são da avaliação autoral; não substituem o parecer independente exigido nesta integração. Nenhum dado de produção foi alterado.','',...sources.map(s=>`- [${s.id}: ${s.publication}](${s.url}). ${s.access}`),'',...Object.entries(out.questions).flatMap(([id,q])=>[`## ${id}`,`OP: ${q.op}. ${q.classification.bloom}/${q.classification.miller}; ${q.classification.intrinsicDifficulty}.`,q.rationale,`Advogado do Recurso: ${q.advogadoDoRecurso.attempt}`,q.advogadoDoRecurso.result,`Eliminatórios: os dez critérios foram checados e nenhum disparou. Score: ${q.nqEditorialScore.dimensions.map(d=>`${d.name}=${d.score}`).join('; ')}; total${q.nqEditorialScore.total}/20.`,`Decisão: ${q.decisionTree}`,`Hash: ${q.version.sha256}. Objeto completo, fontes/localizadores e ficha dos12campos do card noJSON.`,'' ])];
fs.writeFileSync(path.join(__dirname,'sodium-author-A2.md'),md.join('\n')+'\n');
console.log(JSON.stringify({file:'sodium-author-A2.json',questions:Object.keys(out.questions).length,references:Object.keys(out.references).length,runtimeWritten:false}));
