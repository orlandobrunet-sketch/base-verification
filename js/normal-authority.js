(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NQNormalAuthority = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const ARTICLES = 'unlockedArticles', KNOWLEDGE = 'nefroquest_total_accumulated_knowledge';
  const owns = key => key === ARTICLES || key === KNOWLEDGE;
  function create(options) {
    const createAuthority = options.createAuthority || globalThis.NQOwnerAuthority?.createAuthority;
    if (typeof createAuthority !== 'function') throw new Error('Owner authority module must load first');
    const authority = createAuthority(options), backing = options.storage;
    let transaction = null, ready = false;
    const fail = code => { throw Object.assign(new Error(code), {code}); };
    function guard() { if (!ready || !authority.writable) fail('UNAVAILABLE'); }
    function read() { guard(); return transaction ? copy(transaction) : authority.load(); }
    function normalizeSave(save, previous) {
      if (!save || save.saveOwner !== options.owner) fail('INVALID_OWNER');
      const result = copy(save);
      result.journeyId ||= result.classBenefits?.journeyId || previous?.journeyId;
      if (!result.journeyId) fail('JOURNEY_ID_REQUIRED');
      if (previous && result.journeyId !== previous.journeyId) fail('NEW_JOURNEY_REQUIRES_TRANSITION');
      return result;
    }
    function mutate(fn) {
      guard();
      if (transaction) { const before=copy(transaction); try { const result=fn(transaction); if(result?.then)fail('ASYNC_REDUCER'); return copy(transaction); } catch(error) { transaction=before; throw error; } }
      return authority.commit(fn);
    }
    const progressStorage = Object.freeze({
      getItem(key) {
        key=String(key); if (!owns(key)) return backing.getItem(key);
        const e=read(); if (!e) return null;
        return key===ARTICLES ? JSON.stringify(e.collections.articles) : String(e.collections.knowledge);
      },
      setItem(key,value) {
        key=String(key); value=String(value);
        if (!owns(key)) {guard();return backing.setItem(key,value);}
        let parsed;
        if(key===ARTICLES) {
          parsed=JSON.parse(value);
          if(!Array.isArray(parsed)||parsed.some(n=>!Number.isSafeInteger(n)||n<0)||new Set(parsed).size!==parsed.length) fail('INVALID_ARTICLES');
        } else {
          if(!/^(0|[1-9][0-9]*)$/.test(value)||!Number.isSafeInteger(Number(value))) fail('INVALID_KNOWLEDGE');
          parsed=Number(value);
        }
        mutate(e=>{e.collections[key===ARTICLES?'articles':'knowledge']=parsed;});
      },
      removeItem(key) {
        key=String(key);
        if(!owns(key)){guard();return backing.removeItem(key);}
        this.setItem(key,key===ARTICLES?'[]':'0');
      }
    });
    return Object.freeze({
      authority, storage:progressStorage,
      async bootstrap({migration={},newSave=null,collections={articles:[],knowledge:0}}={}) {
        if(ready) return read();
        if(!await authority.acquire()) fail('LEASE_UNAVAILABLE');
        try {
          let e=authority.resumeLegacySources();
          if(!e)e=authority.load();
          if(!e) {
            const raw=backing.getItem(migration.canonicalKey || 'nefroquest-save-v7');
            if(raw!==null) {
              const legacy=JSON.parse(raw);
              const journeyId=migration.journeyId || legacy?.journeyId || legacy?.classBenefits?.journeyId || options.newJourneyId?.();
              e=authority.migrate({...migration,journeyId});
            } else e=authority.initialize(newSave?normalizeSave(newSave):null,collections);
          }
          e=authority.resumeAuxiliaryProjection();
          if(e.save && !e.save.journeyId) fail('JOURNEY_ID_REQUIRED');
          ready=true;return e;
        } catch(error) {await authority.release();throw error;}
      },
      envelope:read,
      loadSave(){const e=read();return e?.save?copy(e.save):null;},
      beginTransaction(){guard();if(transaction)return false;transaction=authority.load();return !!transaction;},
      commit(save,mutateEnvelope) {
        guard();if(!transaction) fail('TRANSACTION_REQUIRED');
        const draft=copy(transaction);
        draft.save=normalizeSave(save,draft.save);
        if(mutateEnvelope) {const out=mutateEnvelope(draft);if(out?.then)fail('ASYNC_REDUCER');}
        const result=authority.commit(e=>{e.save=draft.save;e.collections=draft.collections;e.receipts=draft.receipts;});
        transaction=null;return result;
      },
      rollback(){transaction=null;},
      save(save){guard();if(transaction)fail('TRANSACTION_OPEN');return authority.commit(e=>{e.save=normalizeSave(save,e.save);});},
      mutate,
      chestReceipts(){return copy(read().receipts);},
      stageChest() {
        guard();if(!transaction)fail('TRANSACTION_REQUIRED');
        const journeyId=transaction.save?.journeyId;
        if(!journeyId)fail('JOURNEY_ID_REQUIRED');
        const n=transaction.receipts.filter(r=>r.journeyId===journeyId).length+1;
        const id=journeyId+':chest:'+n;
        const receipt={id,journeyId,phase:'earned'};
        transaction.receipts.push(receipt);
        return copy(receipt);
      },
      updateChest(id,update) {
        const current=read().receipts.find(r=>r.id===id);
        if(current?.phase==='consumed')return false;
        mutate(e=>{
          const r=e.receipts.find(r=>r.id===id);
          if(!r||r.journeyId!==e.save?.journeyId)fail('UNKNOWN_RECEIPT');
          const result=update(r,e);if(result?.then)fail('ASYNC_REDUCER');
        });
        return true;
      },
      async release(){transaction=null;ready=false;await authority.release();},
      retireLegacySources(){guard();if(transaction)fail('TRANSACTION_OPEN');return authority.retireLegacySources();},
      reset(...args){guard();if(transaction)fail('TRANSACTION_OPEN');return authority.resetProgress(...args);},
      startJourney(save,...args){guard();if(transaction)fail('TRANSACTION_OPEN');return authority.startJourney(normalizeSave(save),...args);},
      exportCloud(...args){guard();if(transaction)fail('TRANSACTION_OPEN');return authority.exportCloud(...args);},
      importCloud(...args){guard();if(transaction)fail('TRANSACTION_OPEN');return authority.importCloud(...args);},
      get writable(){return ready&&authority.writable;},
      get inTransaction(){return !!transaction;}
    });
  }
  function peek({storage,owner}) {
    const key='nefroquest-owner-authority-v1:'+encodeURIComponent(JSON.stringify(owner));
    try {
      const raw=storage.getItem(key);if(raw===null)return {exists:false,save:null};
      const e=JSON.parse(raw);
      if(!e || e.protocol!==1 || e.owner!==owner || !Number.isSafeInteger(e.resetEpoch) ||
        (e.save!==null && (!e.save || e.save.saveOwner!==owner || !e.save.character))) return {exists:true,save:null};
      return {exists:true,save:e.save===null?null:copy(e.save)};
    } catch(error) {return {exists:true,save:null};}
  }
  function retiredSourcesMatch({storage,owner}) {
    try {
      const key='nefroquest-owner-authority-v1:'+encodeURIComponent(JSON.stringify(owner));
      const e=JSON.parse(storage.getItem(key)||'null'),source=e?.source,guard=source?.guard;
      if(e?.protocol!==1||e.owner!==owner||source?.retirement?.status!=='retired'||source.retirement.owner!==owner||source.custodyTransition||!guard)return false;
      const marker=JSON.parse(guard.saveRaw||'null');
      if(marker?.save!==null||marker.resetReason!=='logout'||marker.saveOwner!==owner||guard.legacyRaw!==null||guard.articlesRaw!==null||guard.knowledgeRaw!==null)return false;
      const keys=source.keys||{};
      return storage.getItem(keys.canonicalKey||'nefroquest-save-v7')===guard.saveRaw &&
        storage.getItem(keys.legacyKey||'nefroquest-save')===null &&
        storage.getItem(keys.articlesKey||'unlockedArticles')===null &&
        storage.getItem(keys.knowledgeKey||'nefroquest_total_accumulated_knowledge')===null;
    } catch(error) {return false;}
  }
  return Object.freeze({create,peek,retiredSourcesMatch});
});
