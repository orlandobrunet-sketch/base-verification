'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const builder=require('../../tools/build-question-revision-manifest.cjs');
const revisions=require('../../js/question-revisions.js'),answers=require('../../js/answer-presentation.js');
const authors=builder.load('data/topics.js','topics'),references=builder.load('data/refs.js','refsDB');
const manifest=require('../../data/question-revision-manifest.js'),history=require('../../data/question-revision-history.js');
const profiles=['main','exam','study','offline'];
const sources=Object.fromEntries(profiles.map(profile=>[profile,authors.map((q,i)=>builder.sources(q,i)[profile])]));
const catalog=revisions.createCatalog({manifest,history,authors,sources,references});

test('the complete published17.27 history prefix remains unchanged after editorial consolidation',()=>{
 assert.equal(builder.digest(history.slice(0,181)),'sha256:b726b3d1b54ccdd3cf75f5b8b6a9fde4f4c0c0bd90f6135c603ab4be6b6b9ed4');
});

for(const pair of [
 {qid:'4c7d3db3',destination:'cfeef8e1',author:'sha256:3361cb21168c754cadd3fc5e0af3597cfe78d14ddf0e430350dedc0cfde908f1',record:'sha256:b1293a3bf2d74b4c3171cb3da8742fdf494771bcce59c830005fad9395bdc5af'},
 {qid:'87f96e78',destination:'d2a32c19',author:'sha256:9394aa69ca94fd66400258ef6c7507e2927f486d64737da47ada2bc467abafe9',record:'sha256:527481a36def56878461385ed03a2416b24af4a3724ed7f43e2db1117548b07f'},
 {qid:'75d13f79',destination:'67bdd826',author:'sha256:13ba98a4ee9075c47e04b437f74852572b0aaf812298e936bfedcf88001e1dcd',record:'sha256:e0c37b675e2539defe21b7613ef3443421ac4c02bc69326f3cc30521cdd7f82a'},
 {qid:'82d7373c',destination:'82728652',author:'sha256:f7d763644fc86dedae2a2c72acfbcad2f215c5216c2d2579bcb0a73505aa0ad0',record:'sha256:f25ac91384048f1dc0067869329a38db8e703a3ea8e6ecaad9b42afbe1e2151c'},
 {qid:'c4e8b495',destination:'47ac614f',author:'sha256:30e6f4b01cbeb0da933dc0d98f0c50899ba41579f5ee9da58d4de790f7d71028',record:'sha256:473f6766f1ce809f41839ee9008e619709c703b64bef4abcfbb5de437050c6c3'},
 {qid:'13e53210',destination:'40c5f770',author:'sha256:d9875997a6a59b45052ab254e00649686a8038b4a6065ae979607a962d4ff5ae',record:'sha256:071bfd054a10d208b178b9037461775376291b0af096a8c0cd541c11ebb3dfc1'},
 {qid:'50166346',destination:'0334d0d1',author:'sha256:1d4b5ad8f2bdacad8bbbfc4b25d820d112b820cf13ca583056f1d35d9d88020d',record:'sha256:4c57e6b1af96411a14651b6ee9412ec09946edd3f214bb92e2e8b7c204d500d1'},
 {qid:'d10de245',destination:'51814977',author:'sha256:fb3d2189d2dacbce038784c47c1a9b6fdb7dcdd8317dc840448c9cd37930048e',record:'sha256:0f5466967d51a8859d7bb1b95bc78da89140ded38c6604d41bbfc0cb30b23478'},
 {qid:'5906012f',destination:'3d8fc3fe',author:'sha256:4c508ac001ca2e1fef0d76c2c330ea24084bcd7f491438005573d6b5797b9dcc',record:'sha256:8f2221e2be7962af268c37d4817c34e9ec54dc9046766c41f30488c469d10f1d'},
 {qid:'a4ffbe05',destination:'9fd2cfdb',author:'sha256:b2d317f00dc9a01a41da98c642ff5b7c14e3fcc350598bc8eb16aeeed923418e',record:'sha256:4ba284e4ddadb10df2c56bf39632c8e0ac1ef48251f64287cbd9ea8f00dd7c3f'},
 {qid:'f847386a',destination:'3a0f4a34',author:'sha256:696e7e8bf885f7f3b5440820c70eb893f445a9c19147542c80712249515845bc',record:'sha256:579033b60d021171c2a49b8225b77e2728ed1cbaede52db03928910815ba1a01'},
 {qid:'471c0013',destination:'0a2634fc',author:'sha256:3fa9a79805aea3503510a1aca85f4377408c633743f54f212dc7fa63d7dcdcfd',record:'sha256:07d633e2e4def77e7e2e470acc73f4a81bd3433721ad46d5ef52c3985ab5f39a'},
 {qid:'ea7fe551',destination:'9eafbe49',author:'sha256:96fafb74c857bda87fb4fa29cf1c70bf3ce559a5739be6bf44c55574846aea03',record:'sha256:bb7841d6fd72dc1e9746ce0d6fe9631a8f17b366743fe51399ff0b3384accf7c'},
 {qid:'5f9a6fe1',destination:'e56795a6',author:'sha256:055c2c796e5447616bdb99ad5775170561c1b98bccd678254cdda7589fe0899f',record:'sha256:dea67484e8298b56ad081af3b39e7b5bb41d47957df4d492e8e1a1f4a75726e5'},
 {qid:'b2c513e8',destination:'709ad94a',author:'sha256:90fdb473d909418157c2df5ddfbdc9ba2c6cb05b62ec448faf85994d110b7d3d',record:'sha256:1578ea5624feae8cef0d8c41cf404363aa5d99069e969cafd6a7c001ca98e306'},
 {qid:'ee219394',destination:'40c5f770',author:'sha256:308ef4cedd93233f938cc089e6846977eaac798316cc6ec8104ca745312ac2d5',record:'sha256:0b5c85ecda93629f471e072c0d06e92bb02dbcc5a9118de52f141d9f6d2fade8'},
 {qid:'96c0c85d',destination:'0e1a838d',author:'sha256:69f48722cf25315a1716631fdab6ff6ab99cdb97e5aea0ebcf0b63460d8742ac',record:'sha256:75e6e23291ab456cb91e7bacd70a97b6d930d7cd36bbcf2318341c28b8c88103'},
 {qid:'a5c73397',destination:'0e1a838d',author:'sha256:1b49243816a799eb384607286a491cf1b9b64bde4bdd7add7df16f5719c8b178',record:'sha256:a9a15b8faabab436fff76f2ba66e2abed2687831ef651a88ae0f1830ff5566e1'},
])test('retired '+pair.qid+' remains authenticated under its original identity in all four modes',()=>{
 const row=history.find(q=>q.qid===pair.qid&&q.release==='17.27');assert(row);
 assert.equal(row.authorRevision,pair.author);
 assert.equal(row.recordRevision,pair.record);
 assert(!authors.some(q=>q.qid===row.qid));
 for(const profile of profiles){
  assert.equal(catalog.current(row.qid,profile),null);
  const prior=catalog.retired(row.qid,profile),current=catalog.replacement(row.qid,profile);
  assert.deepEqual(prior.author,row.author);assert.deepEqual(prior.references,row.references);
  assert.equal(current.binding.qid,pair.destination);assert.equal(current.historical,false);
  const old=answers.present(row.sources[profile],{preserveOrder:true});
  assert.equal(catalog.inspect(old,{profile,binding:row.bindings[profile]}).status,'known');
  assert.equal(catalog.inspect(old,{profile,binding:current.binding}).status,'unknown');
  assert.equal(catalog.inspect(answers.present(current.source),{profile,binding:row.bindings[profile]}).status,'unknown');
 }
});

test('previous answers retain old cards even when the only update is a shared reference',()=>{
 const qid='9f887485',prior=history.find(q=>q.qid===qid&&q.release==='17.27');assert(prior);
 const current=catalog.current(qid,'exam');assert(current);
 assert.equal(builder.digest(current.author),prior.authorRevision);
 assert.notEqual(current.binding.recordRevision,prior.recordRevision);
 const resolved=catalog.inspect(answers.present(prior.sources.exam),{profile:'exam',binding:prior.bindings.exam});
 assert.equal(resolved.status,'known');assert.equal(resolved.value.historical,true);
 assert.deepEqual(resolved.value.references,prior.references);
 assert.notDeepEqual(resolved.value.references,current.references);
});

test('the withdrawn CMV citation stays authenticated in old answers without remaining an active source',()=>{
 assert.equal(Object.hasOwn(references,'cmv_kdigo_tx'),false);
 assert(references.cmv_consensus_tts_2025);
 assert(!authors.some(q=>q.refs.includes('cmv_kdigo_tx')));
 for(const qid of ['26c87114','86b6b9c9','6d6d8d57','2c86b3a0']){
  const prior=history.find(q=>q.qid===qid&&q.release==='17.27');assert(prior);
  assert.equal(builder.digest(prior.references.cmv_kdigo_tx),'sha256:ca06aa6a0a767a7a3b2285c51fd355e0e7bfca771019f310d18cd0f4107ae2cd');
  for(const profile of profiles){
   const result=catalog.inspect(answers.present(prior.sources[profile],{preserveOrder:true}),{profile,binding:prior.bindings[profile]});
   assert.equal(result.status,'known');assert.equal(result.value.historical,true);
   assert.deepEqual(result.value.references,prior.references);
   const current=catalog.current(qid,profile);assert(current);
   assert(current.author.refs.includes('cmv_consensus_tts_2025'));
   assert.notEqual(current.binding.recordRevision,prior.recordRevision);
  }
 }
});
