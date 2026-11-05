const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
let source=fs.readFileSync(path.join(root,'js/minigame-acidbase.js'),'utf8');
source=source.replace(/function _rand\(min, max\)\{[^\n]+\}/,'function _rand(min,max){return window.pick(min,max);}');
source=source.replace('window.showAcidBaseMinigame = showAcidBaseMinigame;','window.cases=CASES;window.showAcidBaseMinigame = showAcidBaseMinigame;');
let ints={},fractions={},i=0,j=0,domains=[];
const window={pick:(min,max)=>{domains.push({min,max});const value=ints[i++]??Math.floor((min+max)/2);assert.ok(value>=min&&value<=max,'fixture must stay within real generator domain');return value;}};
const math=Object.create(Math);math.random=()=>fractions[j++]??0.5;
vm.runInNewContext(source,{window,Math:math});
function build(id,a={},b={}){ints=a;fractions=b;i=0;j=0;domains=[];return window.cases.find(c=>c.id===id).build();}

test('every Mireth pair lies beyond the entire compensation interval taught by the act',()=>{
 build('mireth');const [h,d]=domains;let checked=0;
 for(let bicarbonate=h.min;bicarbonate<=h.max;bicarbonate++)for(let offset=d.min;offset<=d.max;offset++){
  const c=build('mireth',{0:bicarbonate,1:offset}),act=c.acts[1];
  assert.ok(c.gas.PaCO2>act.target+act.tolerance,JSON.stringify(c.gas));
  assert.ok(c.gas.PaCO2>40+0.7*(bicarbonate-24)+5,'robust to alternate compensation estimate');checked++;
 }
 assert.equal(checked,(h.max-h.min+1)*(d.max-d.min+1));
});

test('Ophelia never calls a normal or acidemic generated pH alkalemia',()=>{
 build('ophelia');const [h,,d]=domains;let checked=0;
 for(let bicarbonate=h.min;bicarbonate<=h.max;bicarbonate++)for(let offset=d.min;offset<=d.max;offset++){
  const c=build('ophelia',{0:bicarbonate,2:offset});
  assert.ok(c.gas.PaCO2<c.acts[1].target-c.acts[1].tolerance);
  if(c.gas.pH<=7.45)assert.doesNotMatch(c.acts[0].prompt,/pH.{0,35}alcal[eê]mico/i);checked++;
 }
 assert.equal(checked,35);
});

test('Vance correction does not label every generated pH acidemia',()=>{
 let checked=0;
 for(let h=12;h<=18;h++){
  const expected=1.5*h+8;
  for(let co=Math.floor(expected-1.5);co<=Math.floor(expected+2.5-1e-8);co++){
   const left=Math.max(expected-2,co-.5),right=Math.min(expected+2,co+.5);if(right<=left)continue;
   const c=build('vance',{0:h},{2:((left+right)/2-expected+2)/4});assert.equal(c.gas.PaCO2,co);
   if(c.gas.pH>=7.35)assert.doesNotMatch(c.acts[0].explainCorrect,/<strong>acidemia<\/strong>/i);checked++;
  }
 }
 assert.equal(checked,32);
});

test('Aldric bicarbonate discussion uses current trial and does not assume all pH exceed its threshold',()=>{
 const c=build('aldric',{0:8},{2:.99}),act=c.acts[4];assert.ok(c.gas.pH<=7.20);
 assert.match(act.grimoire.body,/BICARICU-2/);
 assert.doesNotMatch(JSON.stringify(act),/não atinge o limiar|só (tem benefício de|reduz) mortalidade/i);
 assert.match(act.grimoire.body,/não demonstrou redução.*mortalidade/i);
});

test('Selene documents ketosis and uses current potassium and bicarbonate safety thresholds',()=>{
 const c=build('selene');const text=JSON.stringify(c);
 assert.match(c.narrative,/hidroxibutirato[^<]*<strong>6,2 mmol\/L/);
 assert.doesNotMatch(text,/3,3|6,9/);
 assert.match(c.acts[4].grimoire.body,/3,5/);assert.match(c.acts[4].grimoire.body,/7,0/);
 assert.match(c.acts[4].options.find(o=>o.correct).label,/guiada/);
 for(const k of [4.6,4.9,5,5.6]){
  const fraction=(k-4.6)/1;const sample=build('selene',{}, {1:Math.min(.999999,fraction)});
  assert.ok(sample.gas.K>=4.6&&sample.gas.K<=5.6);
  assert.match(sample.acts[4].explainCorrect,k<5?/repor/:/não repor/);
 }
});

test('Edrin uses individualized alkali decisions across all generated bicarbonate values',()=>{
 for(let h=14;h<=19;h++){
  const c=build('edrin',{0:h});const text=JSON.stringify(c.acts[4])+c.summary;
  assert.doesNotMatch(text,/retarda.{0,30}progressão|alvo.{0,15}[≥=].{0,8}22/);
  assert.match(c.acts[4].options.find(o=>o.correct).label,/individualiz/i);
  assert.match(c.acts[4].explainCorrect,/pressão arterial|PA/);
  assert.match(c.acts[4].explainCorrect,/potássio|K⁺/);
 }
});

test('Corvin distinguishes screening from selective confirmation and localization',()=>{
 const c=build('corvin'),act=c.acts[4];
 assert.match(act.explainCorrect,/rastreio|rastreamento/);
 assert.match(act.grimoire.body,/nem todo|não é universal/);
 assert.doesNotMatch(act.explainCorrect,/imagem definem/);
 assert.match(act.options.find(o=>o.correct).label,/aldosterona/);
});

test('Liora distinguishes renal hypokalemic causes from diarrhea without diagnosing from urine pH alone',()=>{
 const c=build('liora'),cards=c.acts[3];
 assert.equal(cards.cards.find(c=>c.id==='diarreia_l').correct,false);
 assert.equal(cards.cards.find(c=>c.id==='atr4_l').correct,false);
 assert.match(cards.prompt,/hipocal/i);
 assert.match(c.acts[2].grimoire.body,/isolado|isoladamente/);
 assert.doesNotMatch(c.acts[4].explainWrong.Espironolactona,/desnecessário.*já está baixo/);
});

test('Brann never rewards cards explicitly reporting high L-lactate in the normal L-lactate task',()=>{
 const c=build('brann'),act=c.acts[3];
 for(const card of act.cards)if(/L(?:-lactato)?\s+(?:MUITO\s+)?alto|L-lactato elevado/i.test(card.pre.lab))assert.equal(card.correct,false,card.id);
 assert.equal(act.cards.find(c=>c.id==='metformina_b').correct,false);
 assert.equal(act.cards.find(c=>c.id==='dlactato_b').correct,true);
});

test('mixed disorder card tasks distinguish contributing components from complete combinations',()=>{
 for(const id of ['galen','helena','ivar']){
  const act=build(id).acts[3];assert.match(act.prompt,/componente/i,id);
  assert.doesNotMatch(act.prompt,/Rejeite as que dão um distúrbio isolado/,id);
 }
});

test('all twenty cases offer four distinct choices and one best answer in every MC act',()=>{
 for(const meta of window.cases)for(const act of build(meta.id).acts)if(act.kind==='mc'){
  assert.equal(act.options.length,4,meta.id+':'+act.prompt);
  assert.equal(new Set(act.options.map(o=>o.label)).size,4);
  assert.equal(act.options.filter(o=>o.correct).length,1);
 }
});

test('Maelis treatment respects the neurological indication rather than ordering a universal fluid switch',()=>{
 const c=build('maelis'),act=c.acts[4];
 assert.match(act.options.find(o=>o.correct).label,/neurológ/i);
 assert.doesNotMatch(act.options.find(o=>o.correct).label,/balanceado/i);
 assert.match(act.explainCorrect,/sódio|tonicidade/);
});

test('Edrin renal physiology note does not say excreting acid acidifies the blood',()=>{
 const note=build('edrin').acts[3].grimoire.body;
 assert.doesNotMatch(note,/rim acidifica o sangue/i);
 assert.match(note,/elimina ácido|eliminar ácido/);
});

test('Edrin does not call every measured gap normal or prescribe universal alkali in its cards',()=>{
 const c=build('edrin',{2:16});
 assert.doesNotMatch(c.acts[2].prompt+c.acts[2].explainCorrect,/parec(?:e|ia) normal/i);
 assert.doesNotMatch(JSON.stringify(c.acts[3].cards.find(c=>c.id==='ckd_e')),/indica álcali oral/i);
});
test('Vorgath explains the formula rather than treating a measured salicylate assay as an osmolar component',()=>{
 const c=build('vorgath'),act=c.acts[3];
 assert.doesNotMatch(JSON.stringify(act),/molécula medida|mas não eleva o gap osmolar/);
 assert.match(act.grimoire.body,/nestas cartas|nessas cartas/);
});
test('Isolde uses renal chloride loss without claiming saline can never help salt depletion',()=>{
 const c=build('isolde');
 assert.match(c.acts[2].options.find(o=>o.correct).label,/perda renal/i);
 assert.doesNotMatch(JSON.stringify(c),/SF 0,9% NÃO corrige|salina não corrige|salina-resistente NORMOTENSA/);
 assert.match(c.acts[4].grimoire.body,/volume|volemia/);
 const occult=c.acts[3].cards.find(c=>c.id==='diuretico_oculto_i');assert.ok(occult);assert.equal(occult.correct,true);assert.doesNotMatch(JSON.stringify(occult),/laxante/i);
});
test('chronic component questions state longitudinal evidence in the case narrative',()=>{
 for(const id of ['ivar','helena'])assert.match(build(id).narrative,/crônica previamente documentada/,id);
});
test('Ivar selects PAP by assessment and distinguishes CPAP from NIV',()=>{
 const c=build('ivar'),act=c.acts[4];
 assert.match(act.options.find(o=>o.correct).label,/PAP/);
 assert.match(act.grimoire.body,/CPAP/);assert.match(act.grimoire.body,/condicional/);
 assert.doesNotMatch(act.explainWrong['O₂ em alto fluxo isolado, sem suporte ventilatório'],/drive/);
});
test('every Nara pair describes relative respiratory alkalosis when beyond compensation tolerance',()=>{
 let associated=0,within=0;
 for(let h=30;h<=34;h++)for(let co=38;co<=44;co++){
  const c=build('nara',{0:h,1:co}),a=c.acts[1];
  if(co<a.target-a.tolerance){assert.match(a.explainCorrect,/alcalose respiratória associada/);associated++;}
  else{assert.match(a.explainCorrect,/dentro da faixa/);within++;}
  assert.doesNotMatch(c.acts[4].explainCorrect,/manter a PaCO₂ perto do basal crônico/);
 }
 assert.ok(associated>0&&within>0);
});

test('Borius treatment follows generated potassium urgency without permanent universal RAAS withdrawal',()=>{
 for(const k of [5.6,5.9,6,6.4,6.5,6.6]){
  const c=build('borius',{}, {1:Math.min(.999999,k-5.6)}),a=c.acts[4];
  assert.match(a.options.find(o=>o.correct).label,/ECG/);
  if(c.gas.K>=6)assert.match(a.explainCorrect,/ECG urgente/);
  if(c.gas.K>=6.5)assert.match(a.explainCorrect,/emergencial/);
  assert.match(a.grimoire.body,/reintrodu|reavalia/i);
  assert.doesNotMatch(JSON.stringify(c),/única ATR|= ATR tipo 4/);
 }
});
test('Vance urine gap note does not classify every renal cause as impaired ammonium excretion',()=>{
 const a=build('vance').acts[3];assert.match(a.grimoire.body,/proximal.*negativo/i);
 assert.doesNotMatch(a.grimoire.body,/acetazolamida — UAG positivo/);
 assert.doesNotMatch(JSON.stringify(a.cards.find(c=>c.id==='salina')),/dilucional/);
});
test('Mara compensation note agrees with the numeric exercise tolerance',()=>{
 const a=build('mara').acts[1];assert.equal(a.tolerance,5);assert.match(a.grimoire.body,/±5/);
});
test('Theron does not invent an undisplayed PaO2 or attribute immediate buffering exclusively to the kidney',()=>{
 const c=build('theron');assert.doesNotMatch(c.acts[4].explainCorrect,/PaO₂ ~59/);
 assert.match(c.acts[0].explainCorrect,/tampão/);
 assert.doesNotMatch(JSON.stringify(c.acts[3]),/Qualquer pneumopatia/);
});
test('Kael distinguishes a conditional opioid antidote from unidentified sedation',()=>{
 const c=build('kael'),a=c.acts[3].cards.find(c=>c.id==='opioides');
 assert.doesNotMatch(a.reveal.why,/deste caso/);assert.match(a.reveal.why,/se|quando/i);
 assert.match(c.summary,/isolada/);
});

test('Ophelia first-act feedback never states alkalemia for a generated normal pH',()=>{
 let normal=0;for(let h=14;h<=18;h++)for(let d=6;d<=12;d++){
  const c=build('ophelia',{0:h,2:d});if(c.gas.pH<=7.45){assert.doesNotMatch(c.acts[0].explainCorrect,/> 7,45|alcalemia/);normal++;}
 }
 assert.ok(normal>0);
});
test('Ophelia airway advice allows indispensable intubation while preserving compensatory ventilation',()=>{
 const a=build('ophelia').acts[4];assert.match(a.grimoire.body,/indispensável/);assert.match(a.grimoire.body,/ventilação-minuto/);
 assert.doesNotMatch(a.grimoire.body,/NUNCA/);assert.match(a.grimoire.body,/via aérea|aspiração/);
});
test('Mireth does not mandate NIV solely because measured CO2 is high',()=>{
 const a=build('mireth').acts[4];assert.doesNotMatch(a.options.find(o=>o.correct).label,/VNI se hipoventila/);
 assert.match(a.grimoire.body,/via aérea/);assert.match(a.grimoire.body,/selecion|conforme/);
});
test('Galen distinguishes suspected lactate elevation from a supplied measurement',()=>{
 const c=build('galen');assert.match(c.summary,/medir|dosar|investigar/);
 assert.doesNotMatch(c.summary,/>\d+, lactato\)/);
 assert.match(c.acts[4].grimoire.body,/reavalia/);
});
test('no chamber case teaches that type4 is the only possible hyperkalemic tubular acidosis',()=>{
 for(const meta of window.cases)assert.doesNotMatch(JSON.stringify(build(meta.id)),/[Úú]nica ATR/,meta.id);
});

test('primary-disorder feedback never uses pH direction as an obligatory definition of a process',()=>{
 for(const meta of window.cases)assert.doesNotMatch(JSON.stringify(build(meta.id).acts[0].explainWrong),/teria pH|[Aa]lcalose teria pH/,meta.id);
});
test('Ophelia compensation distractor uses Winter instead of assuming every pH is alkaline',()=>{
 const w=build('ophelia').acts[0].explainWrong['Nenhum — a PaCO₂ baixa é só compensação'];
 assert.doesNotMatch(w,/deixaria o pH alcalino/);assert.match(w,/Winter|esperad/);
});
test('Mara acetazolamide distractor is justified by volume and potassium deficits rather than universal restriction',()=>{
 const w=build('mara').acts[4].explainWrong['Acetazolamida IV em bolus'];
 assert.doesNotMatch(w,/só é indicada/);assert.match(w,/potássio|K⁺/);
});
test('Vorgath does not invent kidney injury from an unmeasured creatinine or mandate dialysis from the gap alone',()=>{
 const c=build('vorgath'),a=c.acts[4];assert.doesNotMatch(a.explainCorrect,/gap osmolar \+ IRA|indicar <strong>hemodiálise/);
 assert.match(a.explainCorrect,/função renal/);assert.match(a.explainCorrect,/critérios/);
 assert.match(c.summary,/suspeita|hipótese|compatível/);
});
test('Corvin distinguishes a favored screening hypothesis from confirmed aldosteronism',()=>{
 const c=build('corvin');assert.match(c.summary,/sugere/);
 assert.match(c.acts[2].explainWrong['Bartter/Gitelman (tubulopatia normotensa)'],/habitual|geralmente/);
});

test('Maelis iatrogenic card task uses an explicit drug-related diarrhea context',()=>{
 const a=build('maelis').acts[3],card=a.cards.find(c=>c.id==='diarreia_m');
 assert.equal(card.correct,true);assert.match(card.pre.clinical,/laxante|medicamento|fármaco/i);
 assert.doesNotMatch(JSON.stringify(a),/prefira cristaloide balanceado|dilucional|rim acidifica bem/);
 assert.match(a.grimoire.body,/neurológ|tonicidade/);
});
test('Corvin describes the available medication history and includes ENaC in the differential command',()=>{
 const c=build('corvin');assert.doesNotMatch(c.narrative,/hipertensão resistente/);
 assert.match(c.acts[3].prompt,/ENaC/);assert.match(c.narrative,/três/);
});
