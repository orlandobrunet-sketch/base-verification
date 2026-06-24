'use strict';
// PED-2 — Mapa de Competências NefroQuest
// Classificação automática por correspondência de palavras-chave (texto normalizado: lowercase + sem acentos NFD).
// Cada categoria tem competências específicas (checadas primeiro) e uma fallback (usada quando nenhuma específica bate).

const NQ_COMPETENCIES = [

  // ──────────────── ÁCIDO-BASE (54 q) ──────────────────────────────────────
  { id:'ab_disturbio_misto', cat:'acido_base', label:'Distúrbios mistos e ânion gap',
    icon:'⚖️',
    keywords:['disturbio misto','anion gap','ag corrigido','delta-delta','delta gap','triplo disturbio','anion gap aumentado','hiato anionico','aniongap'] },

  { id:'ab_atr', cat:'acido_base', label:'Acidose tubular renal (ATR)',
    icon:'🧪',
    keywords:['acidose tubular','atr ','(atr)','tipo 1','tipo 2','tipo 4','citrato de potassio','nefrocalcinose','ph urinario','incapaz de acidificar','acidificacao urinaria'] },

  { id:'ab_alcalose', cat:'acido_base', label:'Alcalose metabólica',
    icon:'⬆️',
    keywords:['alcalose metabolica','hipocloremia','perda de hcl','sonda nasogastrica','contracao volumetrica','geracao de alcalose','manutencao da alcalose','alcalose hipocloremical'] },

  { id:'ab_gasometria', cat:'acido_base', label:'Interpretar gasometria arterial',
    icon:'🩸', fallback:true,
    keywords:['gasometria','paco2','compensacao esperada','compensacao respiratoria','compensacao metabolica','formula de winter','winter','disturbio primario','excesso de base','hipercapnia','hipocapnia','acidose respiratoria','alcalose respiratoria','hco3'] },

  // ──────────────── ELETRÓLITOS (118 q) ─────────────────────────────────────
  { id:'el_sodio', cat:'eletrólitos', label:'Distúrbios do sódio',
    icon:'🧂',
    keywords:['hiponatremia','hipernatremia','sodio serico','siadh','diabetes insipidus','aquaporina','vasopressina','desmopressina','osmolalidade','mielinolise','correcao de sodio','velocidade de correcao de sodio','desidratacao hipertonica','intoxicacao hidrica','correcao rapida de sodio'] },

  { id:'el_potassio', cat:'eletrólitos', label:'Distúrbios do potássio',
    icon:'⚡',
    keywords:['hipocalemia','hipercalemia','potassio serico','quelante de potassio','patiromer','ciclosilicato','kayexalate','onda t','bloqueio de membrana com calcio','gluconato de calcio hipercalemia','redistribuicao de potassio'] },

  { id:'el_mineral_osseo', cat:'eletrólitos', label:'Metabolismo mineral e ósseo na DRC',
    icon:'🦴',
    keywords:['fgf23','klotho','hiperparatireoidismo secundario','paratormonio','pth ','calcitriol','vitamina d','osteodistrofia','calcificacao vascular','cinacalcet','sevelamer','quelante de fosforo','rmdo ','mineral osseo','metabolismo osseo'] },

  { id:'el_calcio_fosforo', cat:'eletrólitos', label:'Cálcio, fósforo e magnésio',
    icon:'💊', fallback:true,
    keywords:['hipocalcemia','hipercalcemia','calcio serico','hipofosfatemia','hiperfosfatemia','fosfato serico','magnesio','hipomagnesemia','hipermagnesemia','fosfaturia','calciuria','calcio total','calcio ionizado'] },

  // ──────────────── DIÁLISE (95 q) ──────────────────────────────────────────
  { id:'di_dp', cat:'dialise', label:'Diálise peritoneal e peritonite',
    icon:'🫙',
    keywords:['dialise peritoneal','dp ','(dp)','peritonite','efluente peritoneal','cateter de tenckhoff','capd','dpac','dpa ','ultrafiltração peritoneal','membrana peritoneal','falha de membrana peritoneal','leucocitos no efluente','ispd','peritoneal'] },

  { id:'di_urgencias', cat:'dialise', label:'Urgências e complicações em diálise',
    icon:'🚨',
    keywords:['hipotensao intradíalítica','hipotensao intra','camibra','embolia gasosa','sindrome de desequilibrio','coagulacao do circuito','reacao de hipersensibilidade dialise','intradialítica'] },

  { id:'di_indicacoes', cat:'dialise', label:'Indicações e início da diálise',
    icon:'⏱️',
    keywords:['indicacao de dialise','iniciar dialise','momento de inicio da dialise','criterio de inicio','urgencia dialitica','emergencia dialitica','sobrecarga de volume refrataria','uremia sintomatica'] },

  { id:'di_hemodialise', cat:'dialise', label:'Hemodiálise: adequação e modalidades',
    icon:'🩺', fallback:true,
    keywords:['hemodialise','kt/v','reducao de ureia','adequacao da hemodialise','fistula arteriovenosa','acesso vascular','cateter de hemodialise','bioimpedancia','angulo de fase','hdf ','hemodiafiltração','convince','ultrafiltração','fluxo de sangue'] },

  // ──────────────── GLOMERULAR (208 q) ──────────────────────────────────────
  { id:'gl_vasculite', cat:'glomerular', label:'Vasculite ANCA e anti-GBM',
    icon:'🔬',
    keywords:['anca','vasculite','granulomatose com poliangiite','poliangiite microscopica','mpo ','pr3 ','wegener','anti-gbm','anti gbm','goodpasture','rituxvas','rave ','pexivas','rituximabe vasculite','ciclofosfamida vasculite','rins vasculite'] },

  { id:'gl_lupus', cat:'glomerular', label:'Nefrite lúpica',
    icon:'🦋',
    keywords:['nefrite lupica','lupus ','les ','belimumabe','voclosporina','obinutuzumabe','classe iii','classe iv','classe v','biopsia em lupus','anticorpos antinucleares','anti-dsdna','complemento lupus'] },

  { id:'gl_c3g', cat:'glomerular', label:'C3G, MPGN e doenças do complemento',
    icon:'🧬',
    keywords:['c3g','glomerulopatia por c3','mpgn','via alternativa do complemento','eculizumabe','fator h','fator i','c3 nefritico','properidin','fator b','hipocomplementemia','deposito de c3'] },

  { id:'gl_gesf', cat:'glomerular', label:'GESF — glomeruloesclerose segmentar e focal',
    icon:'🎯',
    keywords:['gesf','glomeruloesclerose segmentar','focal ','justa medular','justamedulares','tip lesion','colapsante','perihilar','fsgs','sparsentan','atrasentan'] },

  { id:'gl_igan', cat:'glomerular', label:'Nefropatia por IgA',
    icon:'💉',
    keywords:['nefropatia por iga','(niga)','iga nefropatia','deposito de iga','testing','nefigard','protect trial','oxford score','hematuria macroscopica recorrente','daptomicina igan','budesonida igan'] },

  { id:'gl_mn', cat:'glomerular', label:'Nefropatia membranosa',
    icon:'🏛️',
    keywords:['nefropatia membranosa','membranosa','anti-pla2r','pla2r','thsd7a','rituximabe membranosa','mentor trial','ciclosporina membranosa'] },

  { id:'gl_nefrotico', cat:'glomerular', label:'Síndrome nefrótica e DLM',
    icon:'💧',
    keywords:['sindrome nefrotica','doenca de lesoes minimas','dlm ','sindrome nefrotica infantil','corticoide em nefrotico','remissao nefrotica','recidiva nefrotica','ciclofosfamida nefrotico'] },

  { id:'gl_imunossupressao', cat:'glomerular', label:'Imunossupressão em glomerulopatias',
    icon:'🛡️', fallback:true,
    keywords:['micofenolato glomerular','mmf glomerular','ciclosporina glomerular','tacrolimus glomerular','remissao completa glomerular','remissao parcial glomerular','inducao glomerular','manutencao glomerular','imunossupressao glomerular'] },

  // ──────────────── DRC (136 q) ─────────────────────────────────────────────
  { id:'drc_isglt2_glp1', cat:'drc', label:'iSGLT2 e GLP-1 na DRC',
    icon:'💊',
    keywords:['sglt2','dapagliflozina','empagliflozina','canagliflozina','glp-1','semaglutida','liraglutida','empa-kidney','dapa-ckd','credence','flow estudo','isglt2 drc','sglt-2'] },

  { id:'drc_complicacoes', cat:'drc', label:'Complicações da DRC',
    icon:'⚠️',
    keywords:['anemia da drc','eritropoetina','agente estimulador de eritropoiese','esa ','ferro na drc','ferritina drc','saturacao de transferrina','hiperparatireoidismo secundario drc','osteodistrofia renal','fgf23 drc','mineral osseo drc'] },

  { id:'drc_cardiovascular', cat:'drc', label:'Risco cardiovascular na DRC',
    icon:'❤️',
    keywords:['cardiovascular na drc','risco cardiovascular drc','estatina drc','sharp','ldl na drc','dislipidemia drc','calcificacao vascular drc','evento cardiovascular drc','hipolipemiante drc'] },

  { id:'drc_farmacologia', cat:'drc', label:'Farmacologia e ajuste de dose na DRC',
    icon:'💉',
    keywords:['ajuste de dose','nefrotoxicidade drc','ieca drc','bra drc','antagonista aldosterona drc','finerenona','sraa drc','metformina drc','aines drc','contraste drc','dose na drc','medicamento na drc'] },

  { id:'drc_estadiamento', cat:'drc', label:'Estadiamento e progressão da DRC',
    icon:'📊', fallback:true,
    keywords:['estadiamento drc','tfg ','taxa de filtracao glomerular','albuminuria','progressao da drc','kdigo drc','categorias g','categorias a','ckd-epi','cria 2','estadio g','estadio a','proteinuria drc'] },

  // ──────────────── LRA (61 q) ──────────────────────────────────────────────
  { id:'lra_contraste', cat:'lra', label:'Nefrotoxicidade por contraste e drogas',
    icon:'☠️',
    keywords:['contraste iodado','nefrotoxicidade por contraste','hidratacao pre-contraste','n-acetilcisteina','bicarbonato e contraste','aminoglicosideo','nefrotoxicidade por aminoglicosideo','anfotericina nefrotoxica','cisplatina rim','vancomicina nefrotox'] },

  { id:'lra_shr', cat:'lra', label:'Síndrome hepatorrenal e LRA em cirrose',
    icon:'🫀',
    keywords:['sindrome hepatorenal','shr ','(shr)','hepatorenal','cirrose e lra','midodrina hepatorenal','noradrenalina hepatorenal','terlipressina','albumina cirrose lra'] },

  { id:'lra_terapia', cat:'lra', label:'Terapia de substituição renal na LRA',
    icon:'🏥',
    keywords:['terapia de substituicao renal','tsr ','tsr continua','tsrc','dialise na lra','cvvh ','cvvhdf','ultrafiltração continua','crrt ','dose de tsr','timing dialise lra','momento de dialise lra'] },

  { id:'lra_causas', cat:'lra', label:'Causas e diagnóstico de LRA',
    icon:'🔍', fallback:true,
    keywords:['pre-renal','pos-renal','intrinseca','nta ','necrose tubular','nefrite intersticial aguda','nia ','obstrucao urinaria','isquemia renal','sepse e lra','mioglobina','mioglobinuria','rabdomiolise','lra por'] },

  // ──────────────── TRANSPLANTE (63 q) ──────────────────────────────────────
  { id:'tx_rejeicao', cat:'transplante', label:'Rejeição do enxerto',
    icon:'⚔️',
    keywords:['rejeicao','rejeição hiperaguda','rejeição aguda','rejeição cronica','mediada por anticorpo','dsa ','anticorpo especifico do doador','c4d ','banff','nefropatia cronica do enxerto','disfuncao cronica do enxerto'] },

  { id:'tx_infeccao', cat:'transplante', label:'Infecções no transplantado',
    icon:'🦠',
    keywords:['cmv ','citomegalovirus','bk virus','bkv ','poliomavirus','pneumocystis','pcp ','profilaxia pos transplante','infeccao oportunista','toxoplasma tx','fungica tx','candida tx'] },

  { id:'tx_complicacoes', cat:'transplante', label:'Complicações cirúrgicas e metabólicas',
    icon:'🔧',
    keywords:['linfocele','trombose vascular enxerto','estenose da arteria renal','fistula urinaria tx','hematoma peri enxerto','funcao retardada do enxerto','delayed graft function','dgf ','nodat','diabetes pos transplante','hipertensao pos transplante'] },

  { id:'tx_imunossupressao', cat:'transplante', label:'Imunossupressão pós-transplante',
    icon:'💊', fallback:true,
    keywords:['tacrolimus tx','ciclosporina tx','micofenolato tx','prednisona tx','sirolimus tx','everolimus tx','minimizacao de imunossupressor','retirada de esteroide tx','nivel serico tx','esquema imunossupressor','imunossupressao pos-transplante'] },

  // ──────────────── NEFROPATIA DIABÉTICA (46 q) ─────────────────────────────
  { id:'nd_isglt2_glp1', cat:'nefropatia_diabetica', label:'iSGLT2 e GLP-1 na nefropatia diabética',
    icon:'💊',
    keywords:['sglt2 diabet','dapagliflozina diabet','empagliflozina diabet','semaglutida diabet','glp-1 diabet','empa-kidney','dapa-ckd','credence','flow estudo','liraglutida diabet','nefroprotecao sglt2'] },

  { id:'nd_controle_pa', cat:'nefropatia_diabetica', label:'Controle de PA e SRAA na ND',
    icon:'❤️',
    keywords:['meta de pa diabet','pressao arterial diabet','ieca diabet','bra diabet','renoprotetor','sraa diabet','bproad','alvo de pa diabet','reducao de albuminuria diabet','progressao da nd'] },

  { id:'nd_patofisiologia', cat:'nefropatia_diabetica', label:'Patofisiologia e diagnóstico da ND',
    icon:'🔬', fallback:true,
    keywords:['nefropatia diabetica','microalbuminuria diabet','macroalbuminuria','historia natural da nd','hiperfiltração glomerular','hipertrofia glomerular','expansao mesangial','kimmelstiel','estadio da nd'] },

  // ──────────────── GENÉTICA (44 q) ─────────────────────────────────────────
  { id:'gen_pkd', cat:'genetica', label:'Doença policística renal',
    icon:'🫐',
    keywords:['polici','pkd ','pkd1','pkd2','adpkd','arpkd','tolvaptan','cisto renal hereditario','rim policistico','hepatica policistica'] },

  { id:'gen_alport', cat:'genetica', label:'Síndrome de Alport',
    icon:'🧬',
    keywords:['alport','col4a','colageno iv','hematuria familiar','gene col4','surdez e hematuria'] },

  { id:'gen_fabry', cat:'genetica', label:'Doença de Fabry',
    icon:'🔴',
    keywords:['fabry','alfa-galactosidase','globotriaosilceramida','gl3 ','angioqueratoma','acroparestesia','terapia de reposicao enzimatica agalsidase','migalastat'] },

  { id:'gen_outras', cat:'genetica', label:'Outras doenças genéticas renais',
    icon:'🧬', fallback:true,
    keywords:['nefronoftise','bardet-biedl','tuberosa','angiomiolipoma','von hippel','nail-patella','ciliopatia','mutacao genetica','hereditaria','genetica renal','sequenciamento genetico','genotipo renal','variante genetica'] },

  // ──────────────── HIPERTENSÃO (30 q) ──────────────────────────────────────
  { id:'ha_crise', cat:'hipertensao', label:'Emergência e urgência hipertensiva',
    icon:'🚨',
    keywords:['emergencia hipertensiva','urgencia hipertensiva','hipertensao maligna','crise hipertensiva','nitroprussiato','labetalol ev','nicardipina ev','papiledem','microangiopatia trombotica hipertensiva','encefalopatia hipertensiva'] },

  { id:'ha_tratamento', cat:'hipertensao', label:'Tratamento anti-hipertensivo na DRC',
    icon:'💊',
    keywords:['ieca hipertensao','bra hipertensao','antagonista aldosterona ha','espironolactona ha','finerenona ha','clortalidona','bloqueio duplo sraa','calcio antagonista ha','amlodipina ha','tiazidico ha','betabloqueador ha'] },

  { id:'ha_metas', cat:'hipertensao', label:'Metas de PA na DRC',
    icon:'🎯', fallback:true,
    keywords:['meta de pa','alvo de pa','pas < ','pad < ','mmhg','reducao de pa','bproad','sprint','kdigo pa','controle de pa','pressao arterial alvo','pas abaixo'] },

  // ──────────────── FARMACOLOGIA (37 q) ─────────────────────────────────────
  { id:'farm_nefrotoxicos', cat:'farmacologia', label:'Agentes nefrotóxicos',
    icon:'☠️',
    keywords:['nefrotoxicidade','nefrotoxica','aminoglicosideo','anfotericina','aines farm','ibuprofeno farm','diclofenac farm','naproxeno','cisplatina','metotrexato renal','litio renal','colistina farm','vancomicina nefrotox','contraste farm'] },

  { id:'farm_imunossupressores', cat:'farmacologia', label:'Imunossupressores: uso e toxicidade',
    icon:'🧪',
    keywords:['tacrolimus farm','ciclosporina farm','micofenolato farm','sirolimus farm','azatioprina','toxicidade de imunossupressor','interacao medicamentosa imunossupressor','calcineurina'] },

  { id:'farm_ajuste_renal', cat:'farmacologia', label:'Ajuste de dose em DRC e diálise',
    icon:'⚖️', fallback:true,
    keywords:['ajuste de dose','dose em drc','dose em dialise','metformina farm','insulina na drc','anticoagulante na drc','heparina drc','antibiotico em hemodialise','dose pos-hd','monitoramento farmacocinetico','ajuste renal'] },

  // ──────────────── LITÍASE (24 q) ──────────────────────────────────────────
  { id:'lit_prevencao', cat:'litíase', label:'Prevenção e tratamento da litíase',
    icon:'🚫',
    keywords:['prevencao de calculo','recorrencia de calculo','tiazidico litiase','hidroclorotiazida litiase','citrato de potassio litiase','alopurinol litiase','alcalinizacao urinaria','nostone','dieta para litiase','expulsao do calculo'] },

  { id:'lit_tipos', cat:'litíase', label:'Tipos de cálculos e diagnóstico',
    icon:'💎', fallback:true,
    keywords:['calculo renal','nefrolitiase','oxalato de calcio','fosfato de calcio calculo','acido urico calculo','estruvita','cistinuria','calculo de cistina','composicao do calculo','tomografia calculo','hipercalciuria','hiperuricosuria','colica renal'] },

  // ──────────────── INFECÇÃO (21 q) ─────────────────────────────────────────
  { id:'inf_itu', cat:'infeccao', label:'ITU, pielonefrite e bacteriúria',
    icon:'🦠', fallback:true,
    keywords:['itu ','infeccao urinaria','pielonefrite','cistite','bacteriuria assintomatica','uropatogeno','profilaxia itu','nitrofurantoina','fosfomicina','mrsa dialise','escherichia coli','infeccao do trato urinario'] },

  // ──────────────── NEFROLOGIA GERAL (37 q) ─────────────────────────────────
  { id:'ng_biopsia', cat:'nefrologia_geral', label:'Biópsia renal e histopatologia',
    icon:'🔬',
    keywords:['biopsia renal','tecnica de biopsia','amostras corticais','imunofluorescencia','microscopia eletronica','imunohistoquimica','indicacao de biopsia','complicacao de biopsia','glomérulos na biopsia','microscopia optica biopsia'] },

  { id:'ng_tubular', cat:'nefrologia_geral', label:'Doenças tubulointersticiais',
    icon:'🧬',
    keywords:['nefrite intersticial','nefrite tubulointersticial','sindrome de fanconi','doenca tubular','transporte tubular','reabsorcao tubular','glucosuria','aminoaciduria','funcao tubular'] },

  { id:'ng_semiologia', cat:'nefrologia_geral', label:'Semiologia renal e propedêutica',
    icon:'🩺', fallback:true,
    keywords:['semiologia renal','historia clinica renal','exame fisico renal','fena ','feua ','cilindro urinario','acantocito','dismorfismo eritrocitario','creatinina urinaria','depuracao de creatinina','proteinuria na semiologia','microalbuminuria semiologia'] },

  // ──────────────── UTI (17 q) ──────────────────────────────────────────────
  { id:'uti_eletrólitos', cat:'uti', label:'Distúrbios eletrolíticos no paciente crítico',
    icon:'⚡',
    keywords:['hiponatremia critico','hipercalemia grave','hipocalemia critica','hipofosfatemia uti','reposicao de fosforo uti','sindrome de realimentacao','hipomagnesemia critica','eletrólito critico'] },

  { id:'uti_lra', cat:'uti', label:'LRA e TRS no paciente crítico',
    icon:'🏥', fallback:true,
    keywords:['lra uti','lra critico','injuria renal aguda uti','tsr uti','cvvh uti','timing de dialise uti','dialise uti','furosemida uti','oliguria uti','sepse lra uti'] },

  // ──────────────── ONCOLOGIA RENAL (8 q) ───────────────────────────────────
  { id:'onco_renal', cat:'oncologia_renal', label:'Neoplasias renais e rim no mieloma',
    icon:'🎗️', fallback:true,
    keywords:['rim do mieloma','cast nephropathy','mieloma multiplo rim','paraproteina','cadeia leve','bence-jones','carcinoma de celulas renais','tumor de wilms','nefrectomia','doenca paraproteinemica'] },

];

// ── Normalizador: minúsculas + sem acentos ───────────────────────────────────
function _nqNorm(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ── Índice qid → [compId, ...] (construído lazily) ──────────────────────────
var _nqCompIndex = null;

function _nqMatchComps(text, cat) {
  // Testa competências específicas primeiro; fallback só se nenhuma bater
  var specific = NQ_COMPETENCIES.filter(function(c) {
    return c.cat === cat && !c.fallback && c.keywords.some(function(kw) { return text.includes(kw); });
  });
  if (specific.length > 0) return specific.map(function(c) { return c.id; });
  var fb = NQ_COMPETENCIES.find(function(c) { return c.cat === cat && c.fallback; });
  return fb ? [fb.id] : [];
}

function _nqIndexArr(arr) {
  (arr || []).forEach(function(t) {
    var qid = t.qid || t.id;
    if (!qid || _nqCompIndex[qid]) return;
    var text = _nqNorm((t.t || '') + ' ' + (t.q || ''));
    var cat  = t.cat || t.c || '';
    _nqCompIndex[qid] = _nqMatchComps(text, cat);
  });
}

// Chamado após topics.js carregar (em game.js _loadTopics onload)
function nqBuildCompIndex() {
  _nqCompIndex = {};
  if (typeof topics !== 'undefined') _nqIndexArr(topics);
  if (typeof RAPID_QUIZ_QUESTIONS !== 'undefined') _nqIndexArr(RAPID_QUIZ_QUESTIONS);
}

// Retorna array de comp IDs para um qid (índice deve ter sido construído)
function nqGetCompIds(qid) {
  return (_nqCompIndex && _nqCompIndex[qid]) || [];
}

// Classifica por texto livre (para questões sem qid, ex: minigame ácido-base)
function nqClassifyText(text, cat) {
  return _nqMatchComps(_nqNorm(text), cat || '');
}

// ── Persistência de stats de competência (persiste entre jogos) ─────────────
var NQ_COMP_STATS_KEY = 'nefroquest-comp-stats';

function nqGetCompStats() {
  try { return JSON.parse(localStorage.getItem(NQ_COMP_STATS_KEY) || '{}'); }
  catch (e) { return {}; }
}

function nqSaveCompStats(stats) {
  try { localStorage.setItem(NQ_COMP_STATS_KEY, JSON.stringify(stats)); } catch (e) {}
}

// Registra uma resposta e atualiza stats da(s) competência(s) da questão
function nqRecordAnswer(qid, isCorrect, cat, questionText) {
  var ids = nqGetCompIds(qid);
  if (!ids || ids.length === 0) ids = nqClassifyText(questionText, cat);
  if (!ids || ids.length === 0) return;
  var stats = nqGetCompStats();
  ids.forEach(function(id) {
    if (!stats[id]) stats[id] = { c: 0, t: 0 };
    stats[id].t++;
    if (isCorrect) stats[id].c++;
  });
  nqSaveCompStats(stats);
}

// Retorna nível de domínio: 'none' | 'progress' | 'mastered'
function nqDomainLevel(stat) {
  if (!stat || stat.t < 3) return 'none';
  if (stat.t >= 5 && (stat.c / stat.t) >= 0.70) return 'mastered';
  return 'progress';
}

// Labels de categorias para a UI
var NQ_CAT_LABELS = {
  'acido_base':         '⚗️ Ácido-Base',
  'eletrólitos':        '⚡ Eletrólitos',
  'dialise':            '🩺 Diálise',
  'glomerular':         '🔬 Glomerular',
  'drc':                '📊 DRC',
  'lra':                '⚡ LRA',
  'transplante':        '🏥 Transplante',
  'nefropatia_diabetica':'🍬 Nefropatia Diabética',
  'genetica':           '🧬 Genética',
  'hipertensao':        '❤️ Hipertensão',
  'farmacologia':       '💊 Farmacologia',
  'litíase':            '💎 Litíase',
  'infeccao':           '🦠 Infecção',
  'nefrologia_geral':   '🩺 Nefrologia Geral',
  'uti':                '🏥 UTI',
  'oncologia_renal':    '🎗️ Oncologia Renal',
};

// Ordem de exibição das categorias no dashboard
var NQ_CAT_ORDER = [
  'drc','glomerular','dialise','lra','transplante','eletrólitos',
  'acido_base','nefropatia_diabetica','hipertensao','farmacologia',
  'genetica','litíase','infeccao','nefrologia_geral','uti','oncologia_renal'
];
