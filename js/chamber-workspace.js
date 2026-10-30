/* Desktop presentation only. Native nodes, handlers, answers and persistence stay owned by the minigame. */
(function () {
  'use strict';
  const media = matchMedia('(min-width:961px) and (pointer:fine)');
  const states = new WeakMap(), memories = new WeakMap();
  let serial = 0, resizeTimer;
  const eligible = () => media.matches && innerHeight >= 600 && parseFloat(getComputedStyle(document.documentElement).fontSize) <= 20;
  const visible = node => node?.isConnected && !node.closest('[hidden],.nql-hidden');
  function make(s, tag, cls, parent) {
    const node = document.createElement(tag); node.className = cls; parent?.append(node); s.owned.push(node); return node;
  }
  function move(s, node, parent) {
    if (!node) return;
    const mark = document.createComment('workspace'); node.before(mark); parent.append(node);
    s.undo.push(() => { if (mark.parentNode) mark.replaceWith(node); });
  }
  function conceal(s, node, value) {
    if (!node) return;
    if (!s.visibility.has(node)) s.visibility.set(node, node.inert);
    node.classList.toggle('nql-hidden', value); node.inert = value;
  }
  function reset(overlay) {
    const s = states.get(overlay); if (!s) return;
    s.observers.forEach(o => o.disconnect());
    s.readers.forEach(r => r.restore());
    [...s.undo].reverse().forEach(fn => fn());
    s.visibility.forEach((inert, node) => { node.classList.remove('nql-hidden'); node.inert = inert; });
    s.owned.forEach(node => node.remove());
    overlay.classList.remove('nq-chamber-workspace'); s.root.classList.remove('nql-intro');
    states.delete(overlay);
  }
  function fit(s) {
    if (!s.overlay.isConnected || states.get(s.overlay) !== s) return;
    s.readers.forEach(r => { if (visible(r.root)) r.reflow(); else r.hide(); });
  }
  function after(s) { requestAnimationFrame(() => fit(s)); }
  function tabs(s, host, items, initial, label, onSelect) {
    const nav = make(s, 'div', 'nql-tabs', host); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', label);
    const buttons = items.map((item, i) => {
      const b = make(s, 'button', 'nql-tab', nav); b.type = 'button'; b.textContent = item.label; b.id = 'nql-tab-' + (++serial);
      b.setAttribute('role', 'tab');
      if (!item.node.id) { item.node.id = 'nql-panel-' + (++serial); s.undo.push(() => item.node.removeAttribute('id')); }
      b.setAttribute('aria-controls', item.node.id);
      const oldRole = item.node.getAttribute('role'), oldLabel = item.node.getAttribute('aria-labelledby');
      item.node.setAttribute('role', 'tabpanel'); item.node.setAttribute('aria-labelledby', b.id);
      s.undo.push(() => { oldRole === null ? item.node.removeAttribute('role') : item.node.setAttribute('role', oldRole); oldLabel === null ? item.node.removeAttribute('aria-labelledby') : item.node.setAttribute('aria-labelledby', oldLabel); });
      b.onclick = () => select(i, true);
      b.onkeydown = e => {
        const keys = {ArrowRight:(i+1)%items.length,ArrowLeft:(i+items.length-1)%items.length,Home:0,End:items.length-1};
        if (e.key in keys) { e.preventDefault(); select(keys[e.key], true); }
      };
      return b;
    });
    let active = initial;
    function select(index, focus = false) {
      active = index;
      items.forEach((item, i) => { conceal(s, item.node, i !== index); buttons[i].setAttribute('aria-selected', String(i === index)); buttons[i].tabIndex = i === index ? 0 : -1; });
      if (focus) { buttons[index].focus({preventScroll:true}); window.scrollTo(0,0); }
      onSelect?.(index); after(s);
    }
    select(initial);
    return {nav,buttons,select,get active(){return active;},suspend(){items.forEach(item=>conceal(s,item.node,true));buttons.forEach(b=>{b.setAttribute('aria-selected','false');b.tabIndex=-1;});}};
  }
  function pager(s, host, nodes, perPage, label, start = 0) {
    const nav = make(s, 'nav', 'nql-pager', host); nav.setAttribute('aria-label', label);
    const back = make(s, 'button', '', nav), status = make(s, 'span', 'nql-page-status', nav), next = make(s, 'button', '', nav);
    back.type = next.type = 'button'; back.textContent = 'Anterior'; next.textContent = 'Próxima';
    status.setAttribute('aria-live','polite'); status.setAttribute('aria-atomic','true');
    const count = Math.ceil(nodes.length / perPage); let page = Math.min(start, count - 1);
    function show(index, focus = false) {
      page = index; nodes.forEach((node,i) => conceal(s,node,Math.floor(i/perPage)!==page));
      back.disabled = page === 0; next.disabled = page >= count - 1;
      status.textContent = label + ' ' + (page+1) + ' de ' + count + (perPage>1 ? ' · Casos '+(page*perPage+1)+'–'+Math.min(nodes.length,(page+1)*perPage) : '');
      if (focus) { (back.disabled ? next : back).focus({preventScroll:true}); window.scrollTo(0,0); }
      after(s);
    }
    back.onclick = () => show(Math.max(0,page-1),true); next.onclick = () => show(Math.min(count-1,page+1),true); show(page);
    return {nav,show,get page(){return page;}};
  }
  function reader(s, root, reserve = 80) {
    if (!root || !root.textContent.trim()) return;
    const originalText = root.textContent, originalHTML = root.innerHTML;
    const nav = make(s,'nav','nql-reader-controls'); nav.hidden = true; nav.setAttribute('aria-label','Páginas da leitura');
    const button = root.closest('button'); (button || root).before(nav);
    const back = make(s,'button','',nav), status = make(s,'span','nql-page-status',nav), next = make(s,'button','',nav);
    back.type=next.type='button';back.textContent='Anterior';next.textContent='Próxima página';status.setAttribute('aria-live','polite');
    let pages=[],index=0,conserved=true;
    function restore(){ if(pages.length){root.innerHTML=originalHTML;pages=[];} }
    function show(i){index=i;pages.forEach((p,n)=>{p.hidden=n!==i;});back.disabled=i===0;next.disabled=i===pages.length-1;status.textContent='Leitura '+(i+1)+' de '+pages.length;}
    function reflow(){
      restore();nav.hidden=true;
      const rect=root.getBoundingClientRect(), top=rect.top;
      const column=root.closest('.ab-body,.ab-context');
      const trailing=column?Math.max(0,column.getBoundingClientRect().bottom-rect.bottom):reserve;
      // Reserve the real trailing controls plus reader navigation and outer spacing.
      // The card frame (not the window) bounds a page; +8 keeps the original window-height calibration.
      const card=root.closest('.ab-card'),frame=card&&parseFloat(getComputedStyle(card).minHeight);
      const limit=frame?card.getBoundingClientRect().top+frame+8:innerHeight;
      const available=Math.max(100,limit-top-trailing-118);
      if(root.getBoundingClientRect().height<=available+1)return;
      const collected=[];let guard=0;
      while(root.childNodes.length&&root.getBoundingClientRect().height>available+1&&guard++<40){
        const boundary=root.getBoundingClientRect().top+available,walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node,endNode=null,endOffset=0;
        while((node=walker.nextNode())){
          for(const word of node.textContent.matchAll(/\S+\s*/g)){
            const r=document.createRange();r.setStart(node,word.index);r.setEnd(node,word.index+word[0].length);const rects=[...r.getClientRects()];
            if(rects.length&&rects[rects.length-1].bottom<=boundary+1){endNode=node;endOffset=word.index+word[0].length;}else if(rects.length)break;
          }
        }
        if(!endNode)break;
        const range=document.createRange();range.selectNodeContents(root);
        const heading=endNode.parentElement?.closest('.ab-ddx-reveal-label,.ab-ddx-clue-label,.ab-ddx-feedback-title,.ab-grimoire-title,.ab-ref-name');
        if(heading&&root.contains(heading))range.setEndBefore(heading);else range.setEnd(endNode,endOffset);
        const fragment=range.extractContents();
        if(!fragment.textContent.trim())break;
        const p=document.createElement('span');p.className='nql-reading-page';p.append(fragment);collected.push(p);
        // Empty structural remnants have no content; removing them avoids a blank next page.
        while(root.firstElementChild&&!root.firstElementChild.textContent.trim()&&!root.firstElementChild.querySelector('img,svg,input'))root.firstElementChild.remove();
      }
      const last=document.createElement('span');last.className='nql-reading-page';last.append(...root.childNodes);collected.push(last);pages=collected;root.append(...pages);
      conserved=pages.map(p=>p.textContent).join('').replace(/\s+/g,' ').trim()===originalText.replace(/\s+/g,' ').trim();
      if(!conserved){restore();nav.hidden=true;return;}
      nav.hidden=pages.length<2;show(Math.min(index,pages.length-1));
    }
    back.onclick=e=>{e.stopPropagation();show(Math.max(0,index-1));(back.disabled?next:back).focus({preventScroll:true});};
    next.onclick=e=>{e.stopPropagation();show(Math.min(pages.length-1,index+1));(next.disabled?back:next).focus({preventScroll:true});};
    s.readers.push({root,restore,reflow,hide(){nav.hidden=true;},get pages(){return pages.length||1;},get conserved(){return conserved;}});
  }
  function hub(s) {
    const layout=s.root.querySelector('.ab-hub-layout'), banner=layout.querySelector('.ab-hub-banner'), opening=layout.querySelector('.ab-hub-opening');
    const overview=make(s,'section','nql-hub-overview'),collection=make(s,'section','nql-hub-collection');layout.prepend(overview,collection);
    move(s,banner,overview);move(s,opening,overview);
    const completedNote=opening.querySelector('.ab-next-case p');
    if(completedNote&&!opening.querySelector('[data-ab-next]')){const original=completedNote.textContent;completedNote.textContent='Todos os casos foram concluídos. Abra a aba “20 pacientes” para jogar novamente com novos valores.';s.undo.push(()=>{completedNote.textContent=original;});}
    ['.ab-collection-heading','.ab-grid','.ab-hub-note'].forEach(q=>move(s,layout.querySelector(q),collection));
    const bar=make(s,'div','nql-hub-nav');layout.prepend(bar);
    tabs(s,bar,[{label:'Visão geral',node:overview},{label:'20 pacientes',node:collection}],0,'Câmara do Equilíbrio');
    const cards=[...collection.querySelectorAll('.ab-case')],ready=cards.findIndex(n=>n.classList.contains('ab-case-ready'));
    const paging=pager(s,collection,cards,4,'Página',Math.floor(Math.max(0,ready)/4));collection.querySelector('.ab-grid').before(paging.nav);
  }
  function context(s) {
    const context=s.root.querySelector('.ab-context');if(!context)return;
    const story=context.querySelector('.ab-narrative'),gas=context.querySelector('.ab-gas-grid'),heading=context.querySelector('.ab-patient-heading');
    const bar=make(s,'div','nql-context-tabs');heading.after(bar);
    const key=context.querySelector('.ab-title')?.textContent||'',mem=memories.get(s.overlay);
    const selection=tabs(s,bar,[{label:'História',node:story},{label:'Exames',node:gas}],mem.contextKey===key?mem.contextTab:1,'Informações do paciente',i=>{mem.contextKey=key;mem.contextTab=i;});
    reader(s,story,40);return selection;
  }
  function act(s,body) {
    const stable=[body.querySelector('.ab-act-count'),body.querySelector('.ab-progress'),body.querySelector('.ab-prompt')].filter(Boolean),grim=body.querySelector('#abGrimoirePanel'),grimBtn=body.querySelector('[data-ab-grimoire]'),feedback=body.querySelector('#abFeedback'),next=body.querySelector('.ab-next'),hasFeedback=feedback&&!feedback.hidden;
    const question=make(s,'section','nql-question'),comment=make(s,'section','nql-comment'),instructions=make(s,'section','nql-instructions'),tools=make(s,'div','nql-body-tools');
    const native=[...body.children].filter(n=>!s.owned.includes(n)&&!stable.includes(n)&&n!==grim&&n!==grimBtn&&n!==feedback&&n!==next);
    native.forEach(node=>move(s,node,node.matches('.ab-ddx-narrative,.ab-ddx-arquivista,.ab-ddx-instruction,.ab-ddx-judgment')?instructions:question));
    move(s,feedback,comment);stable[stable.length-1].after(tools);body.append(question,instructions,comment);if(grim)move(s,grim,body);if(next)move(s,next,body);
    const items=[{label:question.querySelector('.ab-ddx-table')?'Cartas':'Questão',node:question}];if(instructions.textContent.trim())items.push({label:'Orientações',node:instructions});if(hasFeedback)items.push({label:'Comentário',node:comment});else conceal(s,comment,true);
    let previous=hasFeedback?items.length-1:0,mode='regular';
    const control=tabs(s,tools,items,previous,'Conteúdo do ato',i=>{previous=i;if(mode==='grim'&&grim&&!grim.hidden){grim.hidden=true;grimBtn?.setAttribute('aria-expanded','false');}mode='regular';if(grim)conceal(s,grim,true);});
    if(!instructions.textContent.trim())conceal(s,instructions,true);
    if(grimBtn)move(s,grimBtn,tools);
    if(grim){conceal(s,grim,true);const observer=new MutationObserver(()=>{if(!grim.hidden){mode='grim';control.suspend();conceal(s,grim,false);after(s);}else if(mode==='grim'){mode='regular';control.select(previous);}});observer.observe(grim,{attributes:true,attributeFilter:['hidden']});s.observers.push(observer);}
    if(hasFeedback){const picked=question.querySelector('.ab-option.wrong')||question.querySelector('.ab-option.correct'),correct=question.querySelector('.ab-option.correct');if(picked&&correct){const summary=make(s,'p','nql-choice-summary',comment);summary.textContent='Sua resposta: '+picked.textContent.trim()+'. Resposta correta: '+correct.textContent.trim()+'.';comment.prepend(summary);}}
    const cards=[...question.querySelectorAll('.ab-ddx-table > .ab-ddx-card')];
    if(cards.length){const table=question.querySelector('.ab-ddx-table'),nav=pager(s,question,cards,1,'Carta');table.before(nav.nav);cards.forEach(card=>reader(s,card.querySelector('.ab-ddx-card-pre,.ab-ddx-card-reveal'),100));}
    reader(s,instructions,90);reader(s,feedback?.querySelector('.ab-feedback-body'),next?90:40);
    if(grim){const observer=new MutationObserver(()=>{const text=grim.querySelector('.ab-grimoire-body');if(text&&!s.readers.some(r=>r.root===text)){reader(s,text,next?90:40);after(s);}});observer.observe(grim,{childList:true});s.observers.push(observer);}
  }
  function summary(s,body){
    const text=body.querySelector('.ab-summary-text'),stats=body.querySelector('.ab-summary-stats'),refs=body.querySelector('.ab-refs'),actions=body.querySelector('.ab-summary-actions'),overview=make(s,'section','nql-summary-overview'),bar=make(s,'div','nql-summary-nav');
    move(s,text,overview);move(s,stats,overview);body.querySelector('.ab-summary-title').after(bar);body.append(overview);if(refs)move(s,refs,body);move(s,actions,body);
    const items=[{label:'Conclusão',node:overview}];if(refs)items.push({label:'Referências',node:refs});tabs(s,bar,items,0,'Resultado do caso');
    reader(s,text,160);
    if(refs){const cards=[...refs.querySelectorAll('.ab-ref-card')];if(cards.length){const nav=pager(s,refs,cards,1,'Referência');refs.querySelector('.ab-refs-title').after(nav.nav);cards.forEach(card=>reader(s,card.querySelector('.ab-ref-body'),105));}}
  }
  function mount(overlay){
    if(!overlay?.isConnected)return;const active=document.activeElement,hadFocus=overlay.contains(active);reset(overlay);if(!eligible()){if(hadFocus&&active?.isConnected)active.focus({preventScroll:true});return;}
    const root=overlay.querySelector('.ab-scroll');if(!root)return;
    const s={overlay,root,owned:[],undo:[],visibility:new Map(),readers:[],observers:[]};states.set(overlay,s);if(!memories.has(overlay))memories.set(overlay,{contextKey:'',contextTab:1});overlay.classList.add('nq-chamber-workspace');
    if(overlay.dataset.abTela==='hub')hub(s);
    else{const body=root.querySelector('.ab-body');if(body?.classList.contains('ab-body--intro'))root.classList.add('nql-intro');else{context(s);if(body?.classList.contains('ab-summary-view'))summary(s,body);else if(body)act(s,body);}}
    fit(s);after(s);
    if(hadFocus){const target=active?.isConnected&&visible(active)&&!active.closest('[inert]')?active:root.querySelector('.ab-prompt,.ab-summary-title,.ab-title');target?.focus({preventScroll:true});}
  }
  addEventListener('resize',()=>{clearTimeout(resizeTimer);const overlay=document.getElementById('acidBaseOverlay');if(overlay&&!eligible()){mount(overlay);return;}resizeTimer=setTimeout(()=>{const current=document.getElementById('acidBaseOverlay');if(current){const state=states.get(current);state?fit(state):mount(current);}},100);});
  const fontObserver = new MutationObserver(()=>{const overlay=document.getElementById('acidBaseOverlay');if(overlay&&!!states.get(overlay)!==eligible())mount(overlay);});
  fontObserver.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});
  window.NQChamberWorkspace=Object.freeze({mount,get inspection(){const overlay=document.getElementById('acidBaseOverlay'),s=states.get(overlay);return{active:!!s,readings:s?s.readers.map(r=>({pages:r.pages,textConserved:r.conserved})):[]};}});
})();
