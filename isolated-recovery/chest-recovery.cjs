'use strict';
// Integration component. Deliberately not activated until normal save/reset/sync
// use the same authority. No UI, random generation, or external side effects.
const copy = value => JSON.parse(JSON.stringify(value));
const fail = code => { throw Object.assign(new Error(code), {code}); };
const integer = n => Number.isSafeInteger(n) && n >= 0;
const add = (a,b) => { if (!integer(a) || !integer(b) || !integer(a+b)) fail('INVALID_AMOUNT'); return a+b; };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function createChestRecovery(authority, binding) {
  const {owner, journeyId, resetEpoch} = binding;
  if (!journeyId || !integer(resetEpoch)) fail('INVALID_BINDING');
  function check(e) {
    if (!e || e.owner !== owner || e.resetEpoch !== resetEpoch || !e.save || e.save.journeyId !== journeyId) fail('STALE_JOURNEY');
  }
  function current() { const e=authority.load(); check(e); return e; }
  function receipt(e,id) { const r=e.receipts.find(r=>r.id===id); if (!r || r.journeyId!==journeyId) fail('UNKNOWN_RECEIPT'); return r; }
  function validReward(r) {
    if (!r || !integer(r.points)) fail('INVALID_REWARD');
    if (r.kind==='article') {
      if (!integer(r.articleIndex) || !integer(r.knowledge)) fail('INVALID_REWARD');
    } else if (r.kind==='equipment') {
      if (!['helmet','glove','armor','weapon','relic','boot'].includes(r.slot) || !r.item || typeof r.item.n!=='string' || !r.item.n || !integer(r.sellValue) || !integer(r.replacedSellValue)) fail('INVALID_REWARD');
    } else fail('INVALID_REWARD');
  }
  return Object.freeze({
    // Caller supplies answer mutation only after eligibility was validated. The
    // awarded answer and receipt enter storage in a single authority commit.
    earn(answerOrdinal, applyAnswer) {
      if (!integer(answerOrdinal) || !answerOrdinal) fail('INVALID_ORDINAL');
      const id=JSON.stringify([resetEpoch,journeyId,answerOrdinal]);
      const before=current(); if (before.receipts.some(r=>r.id===id)) return {id,state:before};
      const state=authority.commit(e=>{
        check(e);
        const result=applyAnswer(e.save);
        if (result && typeof result.then==='function') fail('ASYNC_ANSWER');
        check(e);
        e.receipts.push({id,journeyId,phase:'earned',answerOrdinal});
      });
      return {id,state};
    },
    pending() { return current().receipts.filter(r=>r.journeyId===journeyId && r.phase!=='consumed').map(copy); },
    prepare(id, roll) {
      const before=current(), existing=receipt(before,id);
      if (existing.phase!=='earned') return copy(existing);
      if (before.receipts.find(r=>r.journeyId===journeyId && r.phase!=='consumed')?.id!==id) fail('EARLIER_RECEIPT_PENDING');
      return copy(receipt(authority.commit(e=>{
        check(e);const r=receipt(e,id);
        const reward=roll(copy(e)); validReward(reward);
        r.reward=copy(reward);r.phase='prepared';
        if (reward.kind==='equipment') {
          if (!Array.isArray(e.save.obtainedItems)) e.save.obtainedItems=[];
          if (!e.save.obtainedItems.includes(reward.item.n)) e.save.obtainedItems.push(reward.item.n);
        }
      }),id));
    },
    consume(id,choice) {
      const before=current(), existing=receipt(before,id);
      if (existing.phase==='consumed') {
        if (existing.choice!==choice) fail('ALREADY_CONSUMED');
        return {duplicate:true,state:before};
      }
      const state=authority.commit(e=>{
        check(e);const r=receipt(e,id);if(r.phase!=='prepared') fail('NOT_PREPARED');
        const reward=r.reward;validReward(reward);const s=e.save;
        if(reward.kind==='article') {
          if(choice!=='accept') fail('INVALID_CHOICE');
          if(!e.collections.articles.includes(reward.articleIndex)) e.collections.articles.push(reward.articleIndex);
          e.collections.knowledge=add(e.collections.knowledge,reward.knowledge);
          s.chestsOpened=add(s.chestsOpened,1);
          if(s.equipment?.relic && s.equipment.relic.n!=='Vazio') s.equipment.relic.kno=add(s.equipment.relic.kno||0,reward.knowledge);
        } else {
          if(choice!=='equip' && choice!=='sell') fail('INVALID_CHOICE');
          if(choice==='equip' && !same(s.equipment?.[reward.slot]??null,reward.expectedItem??null)) fail('EQUIPMENT_CHANGED');
          if(choice==='equip') {s.gold=add(s.gold,reward.replacedSellValue);s.equipment={...s.equipment,[reward.slot]:copy(reward.item)};}
          else s.gold=add(s.gold,reward.sellValue);
        }
        s.score=add(s.score,reward.points);r.phase='consumed';r.choice=choice;
      });
      return {duplicate:false,state};
    }
  });
}
module.exports={createChestRecovery};
