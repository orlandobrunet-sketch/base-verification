/* Draft preparation only. Never writes runtime data or grants publication. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const b = require('../../../../tools/build-question-revision-manifest.cjs');
const base = 'ca1184916b53cddfc7581df17ed75ff3a029c14f';
const topics = b.load('data/topics.js', 'topics');
const refs = b.load('data/refs.js', 'refsDB');
const edits = {
  a4c85d32: {
    q: 'Homem de 65 anos com insuficiência cardíaca apresenta edema de membros inferiores, turgência jugular e hiponatremia hipotônica. Antes de receber diuréticos, o sódio urinário é 8 mEq/L e a osmolalidade urinária, 520 mOsm/kg. Qual diagnóstico melhor integra a volemia e os exames?',
    opts: ['Hiponatremia euvolêmica por secreção inapropriada de ADH.', 'Hiponatremia hipovolêmica por perdas gastrointestinais.', 'Hiponatremia hipervolêmica por insuficiência cardíaca.', 'Hiponatremia euvolêmica por polidipsia primária.'],
    refs: ['hypona'],
    exp: 'A congestão indica aumento do volume extracelular. Na insuficiência cardíaca, a redução do volume arterial efetivo pode estimular vasopressina e retenção de sódio: a urina fica concentrada e com pouco sódio. Perdas digestivas sugeririam depleção, enquanto polidipsia isolada costuma produzir urina diluída. SIADH exige euvolemia e exclusão de outras causas. O sódio urinário deve ser interpretado com cautela após diuréticos.'
  },
  '3fa2737c': {
    q: 'Homem de 70 anos tinha Na de 138 mEq/L antes de uma ressecção transuretral da próstata com irrigação hipotônica sem sódio. Após grande absorção da solução, apresenta convulsão, Na de 108 mEq/L, glicemia normal e osmolalidade sérica de 230 mOsm/kg. O procedimento foi interrompido e a via aérea, estabilizada. Qual é a conduta imediata para a hiponatremia?',
    opts: ['Iniciar restrição hídrica e aguardar a elevação espontânea do sódio.', 'Iniciar furosemida e aguardar a diurese antes de reavaliar o sódio.', 'Infundir NaCl 0,9% lentamente e reservar a solução a 3% para depois.', 'Administrar bólus de NaCl 3% com monitorização clínica e da natremia.'],
    refs: ['hypona'],
    exp: 'Trata-se de hiponatremia aguda hipotônica com manifestação neurológica grave após absorção da irrigação. A prioridade é NaCl 3% em bólus monitorados, buscando melhora dos sintomas com elevação inicial limitada do sódio, não normalização imediata. Restrição hídrica, diurético ou salina isotônica isolados não substituem esse tratamento. A tonicidade foi informada porque soluções de irrigação com outros osmóis podem produzir quadros diferentes.'
  },
  e94a6488: {
    q: 'Paciente com hiponatremia há mais de uma semana, uso de tiazídico, alcoolismo e K de 2,5 mEq/L recebeu NaCl 0,9% e reposição de potássio. Após suspensão do tiazídico, o Na subiu de 108 para 118 mEq/L em 10 horas, com diurese de 400 mL/h. Está hemodinamicamente estável. Com apoio especializado e monitorização intensiva, qual conduta é mais segura?',
    opts: ['Suspender a salina e manter restrição hídrica para limitar novas oscilações.', 'Manter a salina isotônica e repor o potássio para atingir Na de 125 no mesmo dia.', 'Trocar a salina por tolvaptana e reduzir a correção nas próximas 24 horas.', 'Suspender a salina e conter a aquarese com desmopressina e água livre monitoradas.'],
    refs: ['hyponatremia_verbalis2013'],
    exp: 'O aumento de 10 mEq/L em 10 horas já ultrapassa o limite de 8 mEq/L em 24 horas recomendado para alto risco de desmielinização. A aquarese pode manter a elevação mesmo sem salina. Cabe interromper a salina, controlar as perdas de água e considerar rebaixamento com desmopressina e água livre, sob acompanhamento especializado. A reposição de potássio continua exigindo controle, pois também pode elevar a natremia.'
  },
  d9257155: {
    q: 'Paciente com hiponatremia documentada há dez dias teve Na elevado de 104 para 120 mEq/L em 24 horas. Houve melhora inicial da confusão, mas três dias depois surgiram disartria, disfagia e tetraparesia. Qual complicação melhor explica essa evolução?',
    opts: ['Síndrome de desmielinização osmótica.', 'Encefalopatia hipertensiva com edema vasogênico.', 'Edema cerebral pela hiponatremia persistente.', 'Encefalopatia de Wernicke por carência de tiamina.'],
    refs: ['hyponatremia_verbalis2013'],
    exp: 'A melhora inicial seguida de novos déficits após correção excessiva da hiponatremia crônica é típica da síndrome de desmielinização osmótica. Pode haver acometimento pontino ou extrapontino; sequelas permanentes são possíveis, mas não inevitáveis. Edema pela hiponatremia explicaria melhor a fase anterior à correção. As outras encefalopatias não integram tão bem o vínculo temporal e a síndrome motora descrita.'
  },
  '21a99f07': {
    q: 'Em paciente euvolêmico com SIADH confirmada e hiponatremia persistente apesar da restrição hídrica, a equipe especializada considera tolvaptana. Não há necessidade de elevar o sódio em caráter emergencial. Qual afirmação sobre seu uso é mais segura, conforme a bula norte-americana de SAMSCA?',
    opts: ['O início ambulatorial é adequado se o primeiro controle do sódio ocorrer em uma semana.', 'A restrição hídrica rigorosa deve ser mantida nas primeiras 24 horas para aumentar a resposta.', 'O início deve ocorrer em hospital, com sódio monitorado e ingestão de água conforme a sede.', 'A associação com salina hipertônica é recomendada no início para tornar a resposta previsível.'],
    refs: ['samsca_fda_2021'],
    exp: 'A bula exige início ou reinício hospitalar, controle frequente do sódio e acesso à água conforme a sede. Restrição hídrica nas primeiras 24 horas aumenta o risco de hipercorreção; a associação com salina hipertônica não é recomendada. Isso não torna a tolvaptana primeira escolha universal nem tratamento de emergência. A pergunta delimita a fonte regulatória porque diretrizes diferem sobre seu lugar no tratamento da SIADH.'
  },
  e2aae4c7: {
    q: 'Mulher com hiponatremia hipotônica, euvolemia clínica, osmolalidade urinária de 620 mOsm/kg e sódio urinário de 68 mEq/L está em investigação de SIADH. Antes de concluir esse diagnóstico, qual avaliação ainda faz parte dos critérios?',
    opts: ['Excluir insuficiência adrenal, disfunção tireoidiana relevante, doença renal e uso de diuréticos.', 'Confirmar vasopressina elevada e usar esse achado para dispensar a avaliação hormonal.', 'Demonstrar sódio urinário acima de 60 mEq/L e usar esse corte como confirmação isolada.', 'Documentar urina concentrada e usar esse achado para dispensar a revisão dos fármacos.'],
    refs: ['hypona'],
    exp: 'Os exames são compatíveis com antidiurese, mas SIADH é diagnóstico de exclusão. É necessário avaliar causas adrenais, tireoidianas e renais e o uso recente de diuréticos. Insuficiência adrenal secundária pode simular o mesmo padrão; hiponatremia por hipotireoidismo costuma exigir doença clinicamente importante. Urina concentrada e sódio urinário elevado, isoladamente, não fecham o diagnóstico; dosar vasopressina não substitui essa avaliação.'
  }
};
const cards = {
  hyponatremia_verbalis2013: {
    label: 'Verbalis JG et al. — Diagnosis, Evaluation, and Treatment of Hyponatremia: Expert Panel Recommendations (2013)',
    url: 'https://doi.org/10.1016/j.amjmed.2013.07.006',
    journal: 'Am J Med 2013;126(10 Suppl 1):S1–S42',
    ano: 2013, tipo: 'Consenso de Especialistas', badge: 'CONSENSO', badgeColor: '#8b5cf6',
    impacto: 'Distingue metas e limites de correção da hiponatremia e orienta a resposta à hipercorreção.',
    icon: '📖',
    resumo: 'Painel de especialistas, não ensaio clínico. Na hiponatremia crônica com alto risco de desmielinização, recomenda meta de 4–6 mEq/L por dia e limite de 8 mEq/L em qualquer período de 24 horas. Alcoolismo, hipocalemia e desnutrição exigem cautela adicional. Para conter a hipercorreção, descreve suspensão das medidas que elevam o sódio, reposição de água livre e desmopressina, com monitorização próxima.',
    conclusao: 'O limite de correção depende do risco; aquarese e reposição de potássio também podem elevar a natremia. Não se deve perseguir normalização rápida.',
    curiosidade: ''
  },
  samsca_fda_2021: {
    label: 'FDA / Otsuka — SAMSCA (tolvaptan): Prescribing Information (revisão 04/2021)',
    url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=5526617c-c7b9-4556-886d-729bbabbc566',
    journal: 'SAMSCA — U.S. Prescribing Information; revisão 04/2021',
    ano: 2021, tipo: 'Bula Regulatória', badge: 'BULA', badgeColor: '#0ea5e9',
    impacto: 'Requisitos de segurança para iniciar tolvaptana no tratamento da hiponatremia nos Estados Unidos.',
    icon: '📋',
    resumo: 'Bula norte-americana de SAMSCA para hiponatremia euvolêmica ou hipervolêmica clinicamente significativa. Exige início e reinício em hospital, com sódio monitorado. Orienta evitar restrição hídrica nas primeiras 24 horas e permitir ingestão conforme a sede. Não é indicado para elevação urgente do sódio por sintomas neurológicos graves. Hipovolemia, anúria e incapacidade de responder à sede são contraindicações; a associação com salina hipertônica não é recomendada.',
    conclusao: 'Indicação regulatória selecionada não equivale a recomendação universal das diretrizes. A prevenção de hipercorreção é central.',
    curiosidade: ''
  }
};
const draft = {
  batch: 'EDITORIAL-PRIORITIES-2026-11-15', revision: 'sodium-A1', integrationBase: base,
  author: '/root', publicationAuthorization: 'BLOQUEADA',
  note: 'Rascunhos: exigem revisão formal independente da versão exata antes de qualquer alteração em data/.',
  questions: Object.fromEntries(Object.entries(edits).map(([id, patch]) => {
    const old = topics.find(q => q.qid === id); if (!old) throw Error(id);
    const candidate = {...old, ...patch};
    return [id, {before: {sha256: b.digest(old), fullLiteral: old}, candidate: {sha256: b.digest(candidate), fullLiteral: candidate}, preserveFSRS: true}];
  })),
  references: Object.fromEntries(Object.entries(cards).map(([id, card]) => {
    if (refs[id]) throw Error('Must be new reference: ' + id);
    return [id, {action: 'add', candidate: {sha256: b.digest(card), fullLiteral: card}, publicationAuthorization: 'BLOQUEADA'}];
  }))
};
fs.writeFileSync(path.join(__dirname, 'sodium-candidates-A1.json'), JSON.stringify(draft, null, 2) + '\n');
console.log(JSON.stringify({questions: Object.keys(draft.questions), references: Object.keys(cards), runtimeDataWritten: false}));
