import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';
import {routeTechnicalQuestionBank} from '../helpers/technical-question-bank';

test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});

for(const width of [390,1280]){
  test(`Ritual next action keeps its hit area still with the pointer on its lower edge at ${width}px`,async({page,context,baseURL},info)=>{
    const origin=new URL(baseURL!).origin;
    const audit={errors:[] as string[],nonGET:[] as string[],sockets:0};
    page.on('pageerror',error=>audit.errors.push(error.message));
    await context.route('**/*',route=>{
      const request=route.request();
      if(request.method()!=='GET'){audit.nonGET.push(request.method());return route.abort();}
      return new URL(request.url()).origin===origin?route.continue():route.abort();
    });
    await context.routeWebSocket('**/*',socket=>{audit.sockets++;socket.close();});
    await routeTechnicalQuestionBank(page,Array.from({length:12},(_,index)=>({
      qid:'ritual-pointer-'+index,q:'Technical interaction sample. Choose any option to test the next action.',
      opts:['Technical option A','Technical option B','Technical option C','Technical option D'],
      ans:index%4,exp:'Technical feedback.',diff:'medium',cat:'geral',refs:[],
    })));
    await page.setViewportSize({width,height:800});
    await page.goto('/jogar/',{waitUntil:'domcontentloaded'});
    await injectGameState(page,{},{asGuest:true});
    await page.evaluate(()=>(window as any).openRitual());
    await page.locator('#ritualStart').click();
    await page.locator('#ritualOpts button').first().click();
    const next=page.locator('#ritualNext');
    await expect(next).toBeVisible();
    await page.mouse.move(1,1);
    await next.scrollIntoViewIfNeeded();
    const box=await next.boundingBox();expect(box).not.toBeNull();
    await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height-.5);
    const samples=await next.evaluate(async element=>{
      const samples=[];
      for(let frame=0;frame<16;frame++){
        await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
        const rect=element.getBoundingClientRect();
        samples.push({y:rect.y,bottom:rect.bottom,hover:element.matches(':hover'),transform:getComputedStyle(element).transform});
      }
      return samples;
    });
    await info.attach('ritual-pointer-audit',{contentType:'application/json',body:JSON.stringify({width,samples,...audit})});
    expect(Math.max(...samples.map(s=>s.y))-Math.min(...samples.map(s=>s.y))).toBeLessThan(.1);
    await next.click();
    await expect(page.getByRole('heading',{name:'Questão 2 de 8',exact:true})).toBeFocused();
    expect(audit).toEqual({errors:[],nonGET:[],sockets:0});
  });
}
