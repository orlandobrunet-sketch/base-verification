'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const b=require('../../../../tools/build-question-revision-manifest.cjs');
const D='docs/editorial/reviews/2026-11-15-editorial-continuation';
const root=path.resolve(__dirname,'../../../..');
const fileHash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const sodium=require('./sodium-candidates-A4.json');
const sustain=require('./sustain6-candidates-A1.json');
const sodiumReport=D+'/candidate-independent-review-A4.json';
const sustainReport=D+'/sustain6-independent-A1.json';
const actualSodium=JSON.parse(fs.readFileSync(path.join(root,sodiumReport),'utf8'));
const actualSustain=JSON.parse(fs.readFileSync(path.join(root,sustainReport),'utf8'));
const topics=b.load('data/topics.js','topics'),refs=b.load('data/refs.js','refsDB');
const before=Object.fromEntries(topics.map(q=>[q.qid,q]));
const declaration=(id,object,report,scope,shape,action,old)=>({action,before_sha256:old===null?null:b.digest(old),after_sha256:b.digest(object),
  independent_report:report,independent_report_sha256:fileHash(report),reviewer_pointer:shape==='sodium'?'/reviewer/id':'/reviewer',version_pointer:scope+'/version',gate_pointer:scope+'/gate',
  ...(action==='update'&&before[id]?{eliminatories_pointer:scope+(shape==='sodium'?'/eliminatories/checks':'/eliminatories'),appeal_pointer:scope+'/advogadoDoRecurso/'+(shape==='sodium'?'outcome':'result'),preserve_fsrs_pointer:scope+(shape==='sodium'?'/implementationObservation/fsrs':'/preserveFSRS')}:{coverage_pointer:scope+'/wholeCardFieldCoverage'})});
const questions={};
for(const [id,row]of Object.entries(sodium.questions)){
  if(b.digest(actualSodium.questions[id].version.fullLiteral)!==row.candidate.sha256)throw Error(id);
  questions[id]=declaration(id,row.candidate.fullLiteral,sodiumReport,'/questions/'+id,'sodium','update',before[id]);
}
for(const row of sustain.questions){
  const id=row.qid;
  if(b.digest(actualSustain.questions[id].version.fullLiteral)!=='sha256:'+row.candidate.sortedCompactPythonSHA256)throw Error(id);
  questions[id]=declaration(id,row.candidate.fullLiteral,sustainReport,'/questions/'+id,'sustain','update',before[id]);
}
const references={
  sustain6:{...declaration('sustain6',sustain.reference.candidate.fullLiteral,sustainReport,'/reference','sustain','update',refs.sustain6),before_consumers:['1a93346d','516ec2a6'],after_consumers:['1a93346d','516ec2a6']},
  hyponatremia_verbalis2013:{...declaration('hyponatremia_verbalis2013',sodium.references.hyponatremia_verbalis2013.candidate.fullLiteral,sodiumReport,'/references/hyponatremia_verbalis2013','sodium','add',null),before_consumers:[],after_consumers:['21a99f07','d9257155','e94a6488']}
};
const bundle={schema:'NQ_1725_INDEPENDENT_GATE_BUNDLE_v1',baseCommit:'ca1184916b53cddfc7581df17ed75ff3a029c14f',baseRelease:'17.24',release:'17.25',
  candidateFiles:Object.fromEntries(['sodium-candidates-A4.json','sodium-author-A4.json','sustain6-candidates-A1.json'].map(name=>[D+'/'+name,fileHash(D+'/'+name)])),questions,references};
const target=D+'/independent-gate-bundle-1725.json';
fs.writeFileSync(path.join(root,target),JSON.stringify(bundle,null,2)+'\n');
console.log(JSON.stringify({path:target,sha256:fileHash(target),questionCount:Object.keys(questions).length,referenceCount:Object.keys(references).length,runtimeWritten:false}));
