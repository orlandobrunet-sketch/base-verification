'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const catalog=require('../../js/library-catalog.js'),source=fs.readFileSync(path.join(__dirname,'../../js/utils.js'),'utf8');
const loader=source.slice(source.indexOf('let _promessaGrimorio = null;'),source.indexOf('window.carregarDadosGrimorio = carregarDadosGrimorio;'));
function fixture({staticSource='js/library-catalog.js?v=99.49',failCatalog=false}={}){
  const requests=[],ctx={Promise,Error,Map};ctx.window=ctx;
  ctx.document={querySelector:()=>staticSource?{getAttribute:()=>staticSource}:null,createElement:()=>({remove(){}}),head:{appendChild(script){
    requests.push(script.src);queueMicrotask(()=>{
      if(script.src.includes('library-catalog.js')){if(failCatalog){script.onerror();return;}ctx.NQLibraryCatalog=catalog;}
      if(script.src.includes('refs.js'))ctx.refsDB={};
      if(script.src.includes('articles.js'))ctx.nefroArticles=[];
      script.onload();
    });
  }}};
  vm.createContext(ctx);vm.runInContext(loader+'\n;globalThis.load=carregarDadosGrimorio;',ctx);
  return{ctx,requests,setFail:value=>{failCatalog=value;}};
}
test('reference-only loading remains independent from the mandatory library module and articles',async()=>{
  const{ctx,requests}=fixture({staticSource:null,failCatalog:true});await ctx.load({refsOnly:true});
  assert.equal(requests.length,1);assert.match(requests[0],/^data\/refs\.js\?release=/);assert.equal(ctx.NQLibraryCatalog,undefined);assert.equal(ctx.nefroArticles,undefined);
});
test('full library retry recovers the real catalog from its existing HTML URL after a load failure',async()=>{
  const f=fixture({failCatalog:true});await assert.rejects(f.ctx.load(),/99.49/);f.setFail(false);await f.ctx.load();
  assert.equal(f.ctx.NQLibraryCatalog,catalog);assert.equal(f.requests.filter(url=>url==='js/library-catalog.js?v=99.49').length,2);
  assert.equal(f.requests.filter(url=>url.includes('refs.js')).length,1);assert.equal(f.requests.filter(url=>url.includes('articles.js')).length,1);
});
test('completed promises cannot mask a lost catalog, and concurrent retry callers share its new script',async()=>{
  const f=fixture();await f.ctx.load();f.ctx.NQLibraryCatalog=undefined;
  await Promise.all([f.ctx.load(),f.ctx.load(),f.ctx.load()]);assert.equal(f.ctx.NQLibraryCatalog,catalog);
  assert.equal(f.requests.filter(url=>url.includes('library-catalog.js')).length,2);assert.equal(f.requests.length,4);
});
test('completed full and per-source promises recheck data and only reload the missing source',async()=>{
  const f=fixture();await f.ctx.load();f.ctx.refsDB=null;await f.ctx.load();
  assert.equal(f.requests.filter(url=>url.includes('refs.js')).length,2);assert.equal(f.requests.filter(url=>url.includes('articles.js')).length,1);assert.equal(f.requests.filter(url=>url.includes('library-catalog.js')).length,1);
});
test('missing HTML catalog URL fails closed without guessing an unversioned module URL',async()=>{
  const f=fixture({staticSource:null});await assert.rejects(f.ctx.load(),/módulo da biblioteca/);assert.equal(f.ctx.NQLibraryCatalog,undefined);assert(f.requests.every(url=>!url.includes('library-catalog.js')));
  await f.ctx.load({refsOnly:true});assert.equal(typeof f.ctx.refsDB,'object');
});
