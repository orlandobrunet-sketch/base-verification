import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';
import {attachFailureEvidence} from '../helpers/failure-evidence';

test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
test.afterEach(async({page},info)=>{
  if(info.status!==info.expectedStatus)await attachFailureEvidence(page,info);
});

for(const surface of ['boss','chapter','stun'] as const){
  test(`End stays in the ${surface} reader immediately after 200% text enlargement`,async({page,context,baseURL},info)=>{
    const audit={errors:[] as string[],nonGET:[] as string[],sockets:0};
    const origin=new URL(baseURL!).origin;
    page.on('pageerror',error=>audit.errors.push(error.message));
    await context.route('**/*',route=>{
      const request=route.request(),url=new URL(request.url());
      if(request.method()!=='GET'){
        audit.nonGET.push(request.method()+' '+url.pathname);
        return route.abort();
      }
      return url.origin===origin?route.continue():route.abort();
    });
    await context.routeWebSocket('**/*',socket=>{audit.sockets++;socket.close()});
    await page.addInitScript(()=>{
      const events:unknown[]=[];
      const identify=(target:EventTarget|null)=>target instanceof Element
        ?{tag:target.tagName,id:target.id,classes:[...target.classList].slice(0,8),reader:!!target.closest('.nqboss-reading,.nqnarr-reading')}
        :{kind:target===window?'window':target===document?'document':'other'};
      for(const capture of [true,false])for(const type of ['keydown','keyup']){
        window.addEventListener(type,event=>{
          if((event as KeyboardEvent).key!=='End')return;
          events.push({type,phase:capture?'capture':'bubble',trusted:event.isTrusted,
            defaultPrevented:event.defaultPrevented,target:identify(event.target),
            active:identify(document.activeElement),hasFocus:document.hasFocus()});
          if(events.length>8)events.splice(0,events.length-8);
        },{capture,passive:true});
      }
      (window as any).__readerEnd290=events;
    });
    await routeTechnicalQuestionBank(page,Array.from({length:6},(_,index)=>({
      qid:'reader-end-'+index,q:'Technical navigation sample '+index,
      opts:['A','B','C','D'],ans:index%4,exp:'Technical feedback',
      cat:'geral',diff:'medium',refs:[],
    })));
    await page.setViewportSize({width:1100,height:700});
    await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
    await injectGameState(page,surface==='stun'
      ?{gold:0,correctTotal:93,level:12,score:45000,bossIntroShown:true,narrativeShown:90}
      :{gold:0},{asGuest:true});
    expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches)).toBe(true);
    await page.locator('#forgeBtn:visible, .mdock-btn.forge-item:visible').first().focus();
    await page.evaluate(surface=>{
      if(surface==='boss')(0,eval)('showBossIntroPopup()');
      else if(surface==='stun')(0,eval)('checkNarrative()');
      else (0,eval)('showNarrativePopup(narrativeStages[9])');
    },surface);
    const card=page.locator(surface==='boss'?'.nqboss-card'
      :surface==='stun'?'.nqstun-card':'.nqnarr-card[data-nq-chapter]');
    await expect(card).toBeVisible();
    if(surface==='stun')await expect.poll(()=>page.evaluate(()=>(0,eval)('state.bossStunActive'))).toBe(true);
    const reader=card.getByRole('region');
    await reader.focus();
    let resize:unknown=null,final:unknown=null,events:any[]=[];
    try{
      resize=await reader.evaluate(element=>{
        document.documentElement.style.fontSize='32px';
        const rect=element.getBoundingClientRect();
        return{rootFont:getComputedStyle(document.documentElement).fontSize,
          readerFont:getComputedStyle(element).fontSize,scrollTop:element.scrollTop,
          scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,
          rect:{top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height}};
      });
      expect(resize,'enlarged text is ready in the same rendering task').toMatchObject({rootFont:'32px',readerFont:'32px',scrollTop:0});
      expect((resize as any).scrollHeight).toBeGreaterThan((resize as any).clientHeight);
      await page.keyboard.press('End');
      await expect.poll(()=>reader.evaluate(element=>
        element.scrollHeight<=element.clientHeight||element.scrollTop>0)).toBe(true);
      await expect.poll(()=>reader.evaluate(element=>
        Math.abs(element.scrollTop-(element.scrollHeight-element.clientHeight))<=1)).toBe(true);
      expect(await page.evaluate(()=>document.scrollingElement?.scrollTop)).toBe(0);
      events=await page.evaluate(()=>(window as any).__readerEnd290);
      expect(events).toHaveLength(4);
      for(const event of events){
        expect(event).toMatchObject({trusted:true,defaultPrevented:false,
          target:{reader:true},active:{reader:true},hasFocus:true});
      }
      expect(audit).toEqual({errors:[],nonGET:[],sockets:0});
    }finally{
      final=await reader.evaluate(element=>({rootFont:getComputedStyle(document.documentElement).fontSize,
        readerFont:getComputedStyle(element).fontSize,scrollTop:element.scrollTop,
        scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,
        documentScrollTop:document.scrollingElement?.scrollTop}));
      events=await page.evaluate(()=>(window as any).__readerEnd290);
      await info.attach('reader-end-audit',{contentType:'application/json',
        body:JSON.stringify({surface,resize,final,events,...audit})});
    }
  });
}
