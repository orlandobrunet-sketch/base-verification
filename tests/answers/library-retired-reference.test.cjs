'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const catalog=require('../../js/library-catalog.js'),ROOT=path.join(__dirname,'../..');
const dashboard=fs.readFileSync(path.join(ROOT,'js/dashboard.js'),'utf8'),utils=fs.readFileSync(path.join(ROOT,'js/utils.js'),'utf8');
const OLD='cmv_kdigo_tx',NEW='cmv_consensus_tts_2025',INVALID='INVALID_OLD_MEDICAL_BODY_MUST_NEVER_RENDER';
const slice=(source,start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a);return source.slice(a,b);};
const oldCard={label:'Wrong former reference',resumo:INVALID,conclusao:INVALID,journal:'Wrong',ano:2022,tipo:'Diretriz',badge:'GUIDELINE'};
const newCard={label:'Real new publication',resumo:'Independent current content',conclusao:'Real',journal:'Real',ano:2025,tipo:'Consenso',badge:'CONSENSO'};
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

test('retirement metadata preserves only existing history and never aliases or unlocks the new work',()=>{
  const owned=[OLD],favorites=[OLD,NEW],before=JSON.stringify({owned,favorites});
  const [item]=catalog.historicalReferenceItems({unlockedRefs:owned,favorites});
  assert.equal(item.key,OLD);assert.equal(item.retired,true);assert.equal(item.historicalOwned,true);
  assert.equal(item.unlocked,false);assert.equal(item.discovered,false);assert.equal(item.locked,true);
  for(const field of['summary','resumo','conclusion','conclusao','impact','impacto','curiosity','curiosidade','url'])assert.equal(item[field],'');
  assert.match(item.title,/registro retirado/);assert.match(item.unlockHint,/histórico/);
  assert.equal(catalog.isRetiredReference(NEW),false);assert.equal(catalog.favoriteFor(NEW,[OLD],[]),false);
  assert.deepEqual(catalog.libraryAliases(OLD,[]),[OLD]);
  assert.deepEqual([...catalog.toggleFavorite(OLD,new Set(favorites),[])],[NEW]);
  assert.deepEqual([...catalog.toggleFavorite(OLD,[NEW],[])],[NEW]);
  assert.deepEqual(catalog.historicalReferenceItems({}),[]);
  assert.equal(JSON.stringify({owned,favorites}),before);
  const unsafe={key:OLD,unlocked:true,title:'Wrong',summary:INVALID};
  assert.deepEqual(catalog.collapseLibraryItems([unsafe],{articles:[],favorites:[OLD]}),[]);
});

function dashboardEnvironment({admin=false}={}){
  const saved={'nq-unlocked-refs':[OLD],'unlockedArticles':[],'nq-bib-favorites':[OLD]};
  const context=vm.createContext({Set,window:{NQLibraryCatalog:catalog,questionBank:[{r:[OLD,NEW],c:'transplante'}],isAdminUser:()=>admin},
    refsDB:{[OLD]:oldCard,[NEW]:newCard},nefroArticles:[],_libraryCache:null,_dashboardData:{axisStats:[]},_readArray:key=>saved[key]||[],
    _safeAccent:()=>'',_safeHttpsUrl:value=>value||'',_escape:escape,_svg:()=>'<svg></svg>'});
  vm.runInContext(slice(dashboard,'function _libraryItems()','function _tabLibrary()')+'\n;globalThis.items=_libraryItems;globalThis.cards=_libraryCards;',context);
  vm.runInContext(slice(dashboard,'function _libraryReadBlocked(','function _syncLibraryReadAction(').replace(/function _libraryReadBlocked/,'function checkRead'),context);
  return{context,saved};
}
test('native dashboard excludes retired content from active totals, even for admin and stale registry data',()=>{
  for(const admin of[false,true]){
    const{context,saved}=dashboardEnvironment({admin}),before=JSON.stringify(saved),model=context.items(),retired=model.items.find(i=>i.key===OLD),current=model.items.find(i=>i.key===NEW);
    assert.equal(model.totalRefs,1);assert.equal(model.totalWorks,1);assert.equal(model.discoveredWorks,0);
    assert.equal(model.discoveredRefs.has(OLD),false);assert.equal(model.unlockedRefs.has(OLD),false);
    assert.equal(retired.historicalOwned,true);assert.equal(retired.unlocked,false);assert.equal(current.discovered,false);assert.equal(current.unlocked,admin);
    const html=context.cards(model.items);assert.match(html,/Referência retirada · Histórico/);assert.match(html,/data-library-retired="true"/);assert.match(html,/aria-label="Remover dos favoritos"/);
    assert.equal(html.includes(INVALID),false);assert.equal(context.checkRead(retired),true);
    assert.equal(JSON.stringify(saved),before);
  }
});

test('native dashboard search and discovery filters display history separately without counting it as an active work',()=>{
  const{context}=dashboardEnvironment(),library=context.items(),entry={dataset:{libraryTitle:'cmv registro retirado',libraryType:'Histórico',libraryFavorite:'true',libraryDiscovered:'false',libraryRetired:'true',libraryHistoricalOwned:'true',search:'cmv histórico registro retirado'},hidden:false,hasAttribute:()=>false,querySelector:()=>null};
  const status={textContent:''},allCount={textContent:''},favCount={textContent:''},noResults={},empty={},search={value:'cmv'},discovery={value:'unlocked'},tab={dataset:{libraryCollection:'all'}},list={children:[entry],querySelectorAll:()=>[entry]};
  const elements={'#nqDashLibraryList':list,'[data-library-collection][aria-selected="true"]':tab,'#nqDashLibrarySearch':search,'#nqDashLibrarySort':{value:'recent'},'#nqDashLibraryDiscovery':discovery,'#nqDashLibraryTab-all [data-library-count]':allCount,'#nqDashLibraryTab-favorites [data-library-count]':favCount,'#nqDashLibraryCollectionCount':status,'[data-library-empty]':empty,'#nqDashLibraryNoResults':noResults};
  const pane={querySelector:key=>elements[key]||null};context._libraryFilterValue=()=> 'all';context._syncLibraryReadAction=()=>{};
  vm.runInContext(slice(dashboard,'function _applyLibraryView(','async function openDashboard(')+'\n;globalThis.apply=_applyLibraryView;',context);
  context.apply(pane);assert.equal(entry.hidden,false);assert.match(status.textContent,/0 obras.*1 registro histórico/);assert.equal(allCount.textContent,'1');assert.equal(noResults.hidden,true);
  discovery.value='locked';context.apply(pane);assert.equal(entry.hidden,true);
  tab.dataset.libraryCollection='favorites';context.apply(pane);assert.equal(entry.hidden,false);assert.match(status.textContent,/0 obras favoritas.*1 registro histórico/);
  search.value='no match';context.apply(pane);assert.equal(entry.hidden,true);assert.equal(noResults.hidden,false);
  assert.equal(library.items.find(i=>i.key===NEW).unlocked,false);
});

test('legacy reader blocks direct and registered historical source calls and does not award the retired key',()=>{
  const button={dataset:{arg:OLD},getClientRects:()=>[{}]},registered=new WeakMap([[button,oldCard]]),opened=[],writes=[],owned=new Set();
  const context=vm.createContext({Set,window:{NQLibraryCatalog:catalog,isAdminUser:()=>true},refsDB:{[OLD]:oldCard,[NEW]:newCard},
    document:{querySelectorAll:()=>[button]},_refResumoSources:registered,_getUnlockedRefs:()=>owned,_showResumoModal:card=>opened.push(card),
    _nqUtilsProgressStorage:()=>({setItem:(key,value)=>writes.push([key,value])}),UNLOCKED_REFS_KEY:'nq-unlocked-refs',_bibItems:null,console});
  vm.runInContext(slice(utils,'function openRefResumo(source)','function closeBibResumo()')+'\n;globalThis.open=openRefResumo;',context);
  vm.runInContext(slice(utils,'function _unlockRefsFromQuestion(','function _buildBibItems()')+'\n;globalThis.unlock=_unlockRefsFromQuestion;',context);
  context.open(button);context.open(OLD);context.unlock([OLD]);
  assert.deepEqual(opened,[]);assert.deepEqual(writes,[]);assert.equal(owned.has(OLD),false);assert.equal(owned.has(NEW),false);
});

test('legacy catalog renders a removable historical bookmark without the invalid body or active discovery credit',()=>{
  const favorites=new Set([OLD]),owned=new Set([OLD]),list={innerHTML:''},count={textContent:''},search={value:'cmv'};
  const context=vm.createContext({Set,window:{NQLibraryCatalog:catalog,isAdminUser:()=>true},refsDB:{[OLD]:oldCard,[NEW]:newCard},nefroArticles:[],
    _getUnlockedArticles:()=>[],_getUnlockedRefs:()=>owned,_getBibFavorites:()=>favorites,_bibArticleData:()=>[],_bibEnsureProgressBinding:()=>true,
    document:{getElementById:key=>({bibList:list,bibCount:count,bibSearch:search}[key]||null)},_bibActiveFilter:'favorites',_bibVisibleItems:[],escapeHtml:escape,rarityScrollIcons:{},console});
  vm.runInContext(slice(utils,'function _buildBibItems()','function openBibliotecaModal()')+'\n;globalThis.build=_buildBibItems;globalThis.render=_bibRenderList;',context);
  const retired=context.build().find(i=>i._bibKey===OLD);assert.equal(retired.locked,true);assert.equal(retired.resumo,'');
  context.render('cmv');assert.match(list.innerHTML,/HISTÓRICO/);assert.match(list.innerHTML,/Remover dos favoritos/);assert.match(list.innerHTML,/Resumo bloqueado/);assert.equal(list.innerHTML.includes(INVALID),false);assert.match(count.textContent,/0 resultados.*1 registro histórico/);
});

test('retired keys grant no collection achievement credit or target, including a stale registry and old question bank',()=>{
  const stored=new Map([['nq-unlocked-refs',JSON.stringify([OLD])],['unlockedArticles','[0]']]),writes=[];
  const storage={getItem:key=>stored.get(key)||null,setItem:(key,value)=>writes.push([key,value])};
  const context=vm.createContext({Set,window:{NQLibraryCatalog:catalog,questionBank:[{r:[OLD,NEW]}]},refsDB:{[OLD]:oldCard,[NEW]:newCard},nefroArticles:[{titulo:'Technical scroll'}],
    localStorage:storage,nqProgressStorage:()=>storage,document:{addEventListener(){},getElementById(){return null;},createElement(){return{};},head:{appendChild(){}}},console});
  vm.runInContext(fs.readFileSync(path.join(ROOT,'js/achievements.js'),'utf8')+'\n;globalThis.progress=getGrimoireAchievementProgress;',context);
  assert.equal(context.progress().target,2);assert.equal(context.progress().value,1);assert.equal(context.progress().complete,false);
  stored.set('nq-unlocked-refs',JSON.stringify([OLD,NEW]));assert.equal(context.progress().value,2);assert.equal(context.progress().complete,true);
  assert.deepEqual(writes,[]);
});

test('native saved-question references show a retired notice without an external link, invalid body or reader binding',()=>{
  const source=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8'),oldButton={dataset:{arg:OLD}},newButton={dataset:{arg:NEW}},registered=new WeakMap();
  const refs={innerHTML:'',querySelectorAll:()=>[oldButton,newButton]};
  const context=vm.createContext({Set,window:{NQLibraryCatalog:catalog},ui:{refs},refsDB:{[NEW]:newCard},escapeHtml:escape,usesLumenDebrief:()=>true,_refResumoSources:registered});
  vm.runInContext(slice(source,'function _refRarity(','function setLumenEvidenceAvailable(')+'\n;globalThis.render=renderRefs;',context);
  context.render([OLD,NEW],{[OLD]:oldCard,[NEW]:newCard});
  const notice=refs.innerHTML.match(/data-ref-retired="true"[\s\S]*?Resumo retirado/)[0];
  assert.equal(refs.innerHTML.includes(INVALID),false);assert.equal(refs.innerHTML.includes('Wrong former reference'),false);
  assert.equal(notice.includes('href='),false);assert.equal(notice.includes('data-action='),false);assert.match(notice,/disabled aria-disabled="true"/);
  assert.equal(registered.has(oldButton),false);assert.equal(registered.get(newButton),newCard);
  refs.querySelectorAll=()=>[oldButton];context.render([OLD],{});assert.match(refs.innerHTML,/Referência retirada/);assert.equal(registered.has(oldButton),false);
});

test('missing mandatory catalog fails closed for native cached dashboard, readers, question sources and achievements',()=>{
  const{context}=dashboardEnvironment({admin:true});context.items();context.window.NQLibraryCatalog=undefined;
  assert.equal(context.items().unavailable,true);assert.equal(context.items().items.length,0);assert.equal(context.checkRead({key:NEW,unlocked:true}),true);
  assert.match(context.cards([{key:OLD,unlocked:true,summary:INVALID}]),/indisponível/);
  const opened=[],writes=[],button={dataset:{arg:OLD}},registered=new WeakMap([[button,oldCard]]),refs={innerHTML:''};
  const native=vm.createContext({Set,window:{isAdminUser:()=>true},ui:{refs},refsDB:{[OLD]:oldCard,[NEW]:newCard},_refResumoSources:registered,
    _showResumoModal:value=>opened.push(value),_getUnlockedRefs:()=>new Set([OLD,NEW]),_bibEnsureProgressBinding:()=>true,
    _nqUtilsProgressStorage:()=>({setItem:(key,value)=>writes.push([key,value])}),UNLOCKED_REFS_KEY:'nq-unlocked-refs',_bibItems:null,console});
  vm.runInContext(slice(utils,'function openRefResumo(source)','function closeBibResumo()')+'\n;globalThis.open=openRefResumo;',native);
  vm.runInContext(slice(utils,'function _unlockRefsFromQuestion(','function _buildBibItems()')+'\n;globalThis.unlock=_unlockRefsFromQuestion;',native);
  vm.runInContext(slice(utils,'function openBibResumo(btn)','// Guarda apenas a fonte')+'\n;globalThis.openBib=openBibResumo;',native);
  native.open(button);native.open(NEW);native.openBib({dataset:{itemIdx:'0'}});native.unlock([OLD,NEW]);
  assert.deepEqual(opened,[]);assert.deepEqual(writes,[]);
  const game=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');vm.runInContext(slice(game,'function renderRefs(','function setLumenEvidenceAvailable(')+'\n;globalThis.render=renderRefs;',native);
  native.render([OLD],{[OLD]:oldCard});assert.match(refs.innerHTML,/Fontes indisponíveis/);assert.equal(refs.innerHTML.includes(INVALID),false);
  vm.runInContext(slice(fs.readFileSync(path.join(ROOT,'js/achievements.js'),'utf8'),'function getGrimoireAchievementProgress()','let _nqAchievementArtworkDialog')+'\n;globalThis.progress=getGrimoireAchievementProgress;',native);
  assert.equal(native.progress().complete,false);assert.equal(native.progress().value,0);assert.equal(native.progress().target,0);
});

test('missing mandatory catalog cannot spend or claim a chest through any native path',()=>{
  const game=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8'),messages=[],state={gameOver:false,gold:1000,score:1000,correctTotal:20,chestsOpened:2},popup={dataset:{}},entry={popup,binding:{}},pending=[entry];
  popup.remove=()=>{};
  const context=vm.createContext({window:{},state,_progressSandboxMode:null,isCharacterPilot:()=>false,log:message=>messages.push(message),_toast:message=>messages.push(message),_watchChestRewards(){},clearTimeout(){},_pendingChestRewards:pending,_chestRewardCurrent:()=>true});
  const extract=name=>{const start=game.indexOf('function '+name+'('),end=game.indexOf('\n    }',start+1)+6;assert(start>=0&&end>start,name);return game.slice(start,end);};
  vm.runInContext(slice(game,'function _atomicPurchasedChest(','function showForgePopup('),context);
  for(const name of ['openChest','claimChestReward','_animateAndClaimChest','_chestLibraryReady','_retryChestLibrary','_durableChestStore']) vm.runInContext(extract(name),context);
  vm.runInContext(extract('_withdrawChestReward'),context);
  const before=JSON.stringify(state);context._openChestDirect();context.openChest();context.claimChestReward();context._animateAndClaimChest({closest:()=>popup});
  assert.equal(JSON.stringify(state),before);assert.equal(pending[0],entry);assert.equal(entry.popup,null);assert.equal(popup.dataset.claiming,undefined);assert.equal(messages.length,4);assert(messages.every(message=>/indisponível/.test(message)));
});

test('catalog disappearing during the native chest animation preserves the same pending receipt and retry control',()=>{
  const game=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8'),messages=[],buttons=[{disabled:false}],classes=new Set(),attributes=new Set(),trigger={textContent:'Abrir baú'},dialog={classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)},setAttribute:key=>attributes.add(key),removeAttribute:key=>attributes.delete(key)};
  let removed=false;
  const popup={dataset:{},remove:()=>{removed=true;},querySelector:key=>key==='.nqch-dialog'?dialog:key==='.nqch-trigger'?trigger:{focus(){}},querySelectorAll:()=>buttons},entry={popup,binding:{},receipt:{}},pending=[entry];let callback;
  const context=vm.createContext({window:{NQLibraryCatalog:catalog,matchMedia:()=>({matches:false})},nefroArticles:[],state:{gameOver:false},log:message=>messages.push(message),_toast:message=>messages.push(message),_watchChestRewards(){},clearTimeout(){},_pendingChestRewards:pending,_chestRewardCurrent:()=>true,playSound(){},setTimeout:fn=>{callback=fn;return 1;}});
  vm.runInContext(slice(game,'function _chestLibraryReady()','function hasPendingChestReward()'),context);
  vm.runInContext(slice(game,'function _withdrawChestReward(entry)','function _retireChestRewardContext()'),context);
  vm.runInContext(slice(game,'function _animateAndClaimChest(trigger)','function claimChestReward()'),context);
  context._animateAndClaimChest({closest:()=>popup});assert.equal(popup.dataset.claiming,'1');assert.equal(buttons[0].disabled,true);
  context.window.NQLibraryCatalog=undefined;callback();
  assert.equal(pending[0],entry);assert.equal(entry.claimTimer,null);assert.equal(entry.popup,null);assert.equal(removed,true);assert.match(messages[0],/continua guardado/);
});
