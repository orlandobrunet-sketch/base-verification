const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
let source=fs.readFileSync(path.join(root,'js/minigame-acidbase.js'),'utf8');
source=source.replace(/function _rand\(min, max\)\{[^\n]+\}/,'function _rand(min,max){return window.pick(min,max);}');
source=source.replace('window.showAcidBaseMinigame = showAcidBaseMinigame;','window.catalog=CASES;window.showAcidBaseMinigame=showAcidBaseMinigame;');
let choices={},fractions={},i=0,j=0,draws=[],debug;
const math=Object.create(Math);math.random=()=>fractions[j++]??.5;
const window={NQ_ACIDBASE_DEBUG:true,pick:(min,max)=>{draws.push({min,max});const x=choices[i++]??Math.floor((min+max)/2);assert.ok(x>=min&&x<=max);return x;}};
vm.runInNewContext(source,{window,Math:math,console:{info:(_,data)=>{debug=data;}}});
function build(id,a={},b={}){choices=a;fractions=b;i=0;j=0;draws=[];debug=null;const c=window.catalog.find(m=>m.id===id).build();return{...c,debug,draws:[...draws]};}
const r1=x=>Math.round(x*10)/10,r2=x=>Math.round(x*100)/100;
function roundedBins(low,high){
 const bins=[];for(let n=Math.floor(low+.5);n<=Math.ceil(high+.5)-1;n++){
  const left=Math.max(low,n-.5),right=Math.min(high,n+.5);
  if(right>left)bins.push({value:n,fraction:((left+right)/2-low)/(high-low)});
 }return bins;
}
function verify(id,c){
 const g=c.gas,ag=g.Na-g.Cl-g.HCO3;
 for(const value of Object.values(g))assert.ok(Number.isFinite(value),id);
 assert.equal(g.pH,r2(6.1+Math.log10(g.HCO3/(.03*g.PaCO2))),id);
 for(const a of c.acts.filter(a=>a.kind==='num')){
  const prompt=a.prompt.toLocaleLowerCase();
  if(prompt.includes('ânion gap'))assert.equal(a.target,prompt.includes('corrigido')?Math.round(ag+2.5*(4-g.alb)):ag,id);
  if(prompt.includes('delta ratio'))assert.equal(a.target,r1((ag-12)/(24-g.HCO3)),id);
 }
 const first=c.acts.find(a=>a.kind==='num');
 if(['aldric','vance','vorgath','selene','edrin','liora','borius','brann','maelis'].includes(id)){
  assert.equal(first.target,r1(1.5*g.HCO3+8),id);assert.ok(Math.abs(g.PaCO2-first.target)<=2,id+': compensation');
  if(id!=='vance')assert.ok(g.pH<7.35,id+': acidemia');
 }
 if(['mara','isolde','corvin'].includes(id)){
  assert.equal(first.target,r1(.7*g.HCO3+21),id);assert.ok(Math.abs(g.PaCO2-first.target)<=5,id);assert.ok(g.pH>7.45,id);
 }
 if(id==='theron'){assert.equal(first.target,r1(24-2*(40-g.PaCO2)/10));assert.ok(Math.abs(g.HCO3-first.target)<=2);assert.ok(g.pH>7.45);}
 if(id==='kael'){assert.equal(first.target,r1(24+(g.PaCO2-40)/10));assert.ok(Math.abs(g.HCO3-first.target)<=2);assert.ok(g.pH<7.35);}
 if(id==='helena'){assert.equal(first.target,r1(24-.4*(40-g.PaCO2)));assert.ok(g.HCO3>first.target+2);assert.ok(g.pH>7.45);}
 if(id==='ivar'){assert.equal(first.target,r1(24+.35*(g.PaCO2-40)));assert.ok(g.HCO3>first.target+2);assert.ok(g.PaCO2>40);}
 if(id==='mireth'){assert.equal(first.target,r1(.7*g.HCO3+21));assert.ok(g.PaCO2>first.target+5);}
 if(id==='ophelia'||id==='galen'){assert.ok(ag>12);assert.ok(g.PaCO2<1.5*g.HCO3+8-2);assert.ok(id==='galen'?(ag-12)/(24-g.HCO3)>2:true);}
 if(id==='nara'){assert.ok(g.HCO3>24);assert.ok(g.pH>7.45);assert.equal(first.target,r1(.7*g.HCO3+21));}
}

test('all rounded pH and compensation domains preserve the authored clinical classification',()=>{
 const counts={};
 const continuous={aldric:[2,-2,2],mara:[2,-2,2],theron:[0,-1,1],vance:[2,-2,2],kael:[0,-1,1],vorgath:[2,-2,2],selene:[2,-2,2],edrin:[3,0,2],liora:[3,0,2],borius:[2,0,2],isolde:[2,-2,2],corvin:[2,-2,2],brann:[2,0,2],maelis:[2,0,2]};
 for(const[id,[randomIndex,low,high]]of Object.entries(continuous)){
  const domain=build(id).draws[0];let count=0;
  for(let x=domain.min;x<=domain.max;x++){
   const initial=build(id,{0:x}),base=initial.acts.find(a=>a.kind==='num').target;
   for(const bin of roundedBins(base+low,base+high)){const c=build(id,{0:x},{[randomIndex]:bin.fraction});assert.equal(['theron','kael'].includes(id)?c.gas.HCO3:c.gas.PaCO2,bin.value,id);verify(id,c);count++;}
  }counts[id]=count;
 }
 for(const id of ['helena','nara','ivar','mireth']){
  const[a,b]=build(id).draws;let count=0;
  for(let x=a.min;x<=a.max;x++)for(let y=b.min;y<=b.max;y++){verify(id,build(id,{0:x,1:y}));count++;}counts[id]=count;
 }
 {const[h,,d]=build('ophelia').draws;let count=0;
  for(let x=h.min;x<=h.max;x++)for(let y=d.min;y<=d.max;y++)for(const ag of roundedBins(24-x,(24-x)*1.6)){const c=build('ophelia',{0:x,2:y},{0:ag.fraction});assert.equal(c.gas.Na-c.gas.Cl-c.gas.HCO3,12+ag.value);verify('ophelia',c);count++;}counts.ophelia=count;
 }
 {const[gap,,offset]=build('galen').draws;let count=0;
  for(let ag=gap.min;ag<=gap.max;ag++)for(let d=offset.min;d<=offset.max;d++){
   const delta=ag-12;
   for(const h of roundedBins(24-delta/2.5,24-delta/4)){
    const raw=24-delta/2.5+h.fraction*(delta/2.5-delta/4),fraction=(delta/(24-raw)-2.5)/1.5;
    const c=build('galen',{0:ag,2:d},{0:fraction});assert.equal(c.gas.HCO3,h.value);verify('galen',c);count++;
   }
  }counts.galen=count;
 }
 assert.equal(Object.keys(counts).length,20);console.log('Exhaustive determining domains:',JSON.stringify(counts));
});

test('all Edrin gap and albumin pairs produce the displayed corrected anion gap',()=>{
 let count=0;
 for(let ag=12;ag<=16;ag++)for(let albumin10=24;albumin10<=31;albumin10++){
  const alb=albumin10/10,left=Math.max(2.4,alb-.05),right=Math.min(3.1,alb+.05),fraction=((left+right)/2-2.4)/.7;
  const c=build('edrin',{2:ag},{0:fraction});assert.equal(c.gas.alb,alb);verify('edrin',c);assert.ok(c.acts[2].target>12);count++;
 }assert.equal(count,40);
});

test('all Vorgath sodium, glucose, BUN and osmolar gap combinations agree with the numeric answer',()=>{
 let count=0;
 for(let na=138;na<=144;na++)for(let glucose=80;glucose<=110;glucose++)for(let bun=10;bun<=18;bun++)for(let gap=22;gap<=40;gap++){
  const c=build('vorgath',{1:na,3:glucose,4:bun,5:gap});
  const calculated=2*na+glucose/18+bun/2.8,measured=c.debug.osmMed;
  assert.ok(Math.abs(measured-calculated-c.acts[2].target)<=.5+1e-9);
  assert.equal(c.acts[2].target,gap);count++;
 }assert.equal(count,7*31*9*19);console.log('Osmolar combinations:',count);
});
