const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const root=path.resolve(__dirname,'../..');
const make=()=>({dataset:{},children:[],append(...n){this.children.push(...n);},setAttribute(k,v){this[k]=v;}});
let captured=[];const title={after:n=>captured.push(n)},section={querySelector:()=>title},card={querySelector:()=>section};
const sandbox={window:{},document:{createElement:make,createDocumentFragment:make},Math:Object.create(Math)};sandbox.Math.random=()=>.5;
const context=vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'data/refs.js'),'utf8')+'\nwindow.auditRefs=refsDB;',context);
let source=fs.readFileSync(path.join(root,'js/minigame-acidbase.js'),'utf8');
source=source.replace('window.showAcidBaseMinigame = showAcidBaseMinigame;','window.auditCases=CASES;window.auditSources=_appendCaseSources;window.showAcidBaseMinigame = showAcidBaseMinigame;');vm.runInContext(source,context);
function sources(id){captured=[];sandbox.window.auditSources(card,{id});return captured.flatMap(n=>n.children);}
const expected={aldric:['bicaricu2_2025'],mara:['metabolic_alkalosis_emmett_2020'],theron:['aha_acc_pe_2026'],vance:['berend_normal_gap_2017','palmer_rta_2021'],kael:[],vorgath:['extrip_ethylene_glycol'],selene:['hyperglycemic_crises_consensus_2024'],edrin:['kdigo_ckd_2024','palmer_rta_2021'],liora:['palmer_rta_2021'],borius:['palmer_rta_2021','kdigo_ckd_2024','ukka_hyperkalemia_2026'],isolde:['gitelman_kdigo_2017','metabolic_alkalosis_emmett_2020'],corvin:['endocrine_society_primary_aldosteronism_2025'],ophelia:['acmt_salicylate_2015','extrip_salicylates_2015'],helena:['aasld_ascites_sbp_2021'],brann:['d_lactic_kowlgi_2015','drug_induced_acidosis_pham_2015'],nara:['metabolic_alkalosis_emmett_2020'],galen:['surviving_sepsis_2026'],maelis:['drug_induced_acidosis_pham_2015','neurocritical_cerebral_edema_2020'],ivar:['metabolic_alkalosis_emmett_2020','ats_ohs_2019'],mireth:['ers_ats_niv_2017','metabolic_alkalosis_emmett_2020']};
test('every case renders its verified specific sources alongside the common acid-base source',()=>{
 assert.deepEqual(Array.from(sandbox.window.auditCases,c=>c.id).sort(),Object.keys(expected).sort());
 for(const[id,extra]of Object.entries(expected)){
  const rendered=sources(id),ids=rendered.map(n=>n.dataset.abSourceId);
  assert.deepEqual(ids,['acid_base_achanti_2023',...extra],id);assert.equal(new Set(ids).size,ids.length,id);
  for(const node of rendered){const ref=sandbox.window.auditRefs[node.dataset.abSourceId],a=node.children[0].children[0];
   assert.ok(ref,id);assert.match(a.href,/^https:\/\//);assert.equal(a.textContent,ref.label);assert.equal(a.rel,'noopener noreferrer');assert.equal(a.target,'_blank');
  }
 }
});
test('all hundred acts preserve five-act structure and traceable case-level bibliography',()=>{
 let acts=0,notes=0;for(const meta of sandbox.window.auditCases){const c=meta.build();assert.equal(c.acts.length,5,meta.id);acts+=c.acts.length;notes+=c.acts.filter(a=>a.grimoire).length;assert.ok(sources(meta.id).length>=1,meta.id);}
 assert.equal(acts,100);assert.equal(notes,80);
});

test('editorial consumer parser matches the real rendered source selection for all20 cases',async()=>{
 const {parseChamberSources}=await import('../../scripts/editorial-batch/chamber.mjs');
 const bindings=parseChamberSources(fs.readFileSync(path.join(root,'js/minigame-acidbase.js'),'utf8'));
 for(const meta of sandbox.window.auditCases)assert.deepEqual(bindings.get(meta.id),sources(meta.id).map(n=>n.dataset.abSourceId),meta.id);
});
