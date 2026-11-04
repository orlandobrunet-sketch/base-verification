import {test,expect,type Page} from '@playwright/test';

test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
async function open(page:Page){
 await page.evaluate(()=>{document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).showAcidBaseMinigame();});
 const cinema=page.locator('#nqEntryCinema[open]');if(await cinema.count()){await page.keyboard.press('Escape');await expect(cinema).toHaveCount(0);}
}
test.beforeEach(async({page})=>{await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());await page.goto('/jogar/',{waitUntil:'load'});});

test('balance can be paused by keyboard and remembers preference without changing progress',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await open(page);const before=await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'));
 const art=page.locator('[data-ab-lab]'),pause=page.getByRole('button',{name:'Pausar animação',exact:true});
 await expect(art).toHaveAttribute('data-motion','running');
 await expect.poll(()=>art.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
 await pause.focus();await page.keyboard.press('Space');
 await expect(page.getByRole('button',{name:'Retomar animação',exact:true})).toBeFocused();
 await expect(art).toHaveAttribute('data-motion','paused');
 expect(await art.evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='paused'))).toBe(true);
 await page.locator('[data-ab-close]').click();await open(page);
 await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','paused');
 await page.getByRole('button',{name:'Retomar animação',exact:true}).click();
 await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','running');
 expect(await page.evaluate(()=>localStorage.getItem('nq-acidbase-progress'))).toBe(before);
});

test('reduced motion is static and follows a changed system preference',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);
 const art=page.locator('[data-ab-lab]');await expect(art).toHaveAttribute('data-motion','paused');
 await expect(page.getByRole('button',{name:'Movimento reduzido',exact:true})).toBeDisabled();
 expect(await art.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await expect(page.getByRole('button',{name:'Pausar animação',exact:true})).toBeEnabled();
 await expect(art).toHaveAttribute('data-motion','running');
});

test('hidden overview suspends the balance and an act removes the decoration',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await open(page);const art=page.locator('[data-ab-lab]');await expect(art).toHaveAttribute('data-motion','running');
 await page.getByRole('tab',{name:'20 pacientes',exact:true}).click();await expect(art).toHaveAttribute('data-motion','paused');
 await page.getByRole('tab',{name:'Visão geral',exact:true}).click();await expect(art).toHaveAttribute('data-motion','running');
 await page.locator('[data-ab-next]').click();await page.locator('[data-ab-start-acts]').click();
 await expect(art).toHaveCount(0);await expect(page.locator('.ab-prompt')).toBeFocused();
});

test('large text and narrow screens keep readable content without horizontal overflow',async({page})=>{
 for(const [width,font]of[[1440,16],[1159,16],[1100,32],[390,16],[320,32]]){
  await page.setViewportSize({width,height:900});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);await open(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.locator('.ab-lead')).toBeVisible();
  const desktop=await page.evaluate(()=>matchMedia('(min-width:961px) and (pointer:fine)').matches);
  const art=page.locator('[data-ab-lab]');if(!desktop)await expect(art).not.toBeVisible();
  else {await expect(page.locator('[data-ab-next]')).toBeVisible();await expect(page.locator('[data-ab-motion-toggle]')).toBeVisible();}
 }
});

test('document visibility events suspend and resume the balance',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await open(page);const art=page.locator('[data-ab-lab]');await expect(art).toHaveAttribute('data-motion','running');
 // Headless Chromium keeps every tab visible. Exercise the actual visibility
 // handler with a controlled document-hidden state, without claiming OS observation.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(art).toHaveAttribute('data-motion','paused');
 await page.evaluate(()=>{delete (document as any).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await expect(art).toHaveAttribute('data-motion','running');
});
test('closing the hub aborts motion listeners and disconnects its visibility observer',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Touch keeps native layout.');
 await page.evaluate(()=>{
  const tracked:{signals:AbortSignal[],disconnected:number}={signals:[],disconnected:0};(window as any).__motionLifecycle=tracked;
  const add=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type:any,callback:any,options:any){
   if(options?.signal&&(this===document&&type==='visibilitychange'||this instanceof MediaQueryList&&type==='change'||this instanceof HTMLButtonElement&&this.hasAttribute('data-ab-motion-toggle')&&type==='click'))tracked.signals.push(options.signal);
   return add.call(this,type,callback,options);
  } as typeof add;
  const Original=IntersectionObserver;
  window.IntersectionObserver=class extends Original{
   tracked=false;
   observe(target:Element){if(target.hasAttribute('data-ab-lab'))this.tracked=true;super.observe(target);}
   disconnect(){if(this.tracked)tracked.disconnected++;super.disconnect();}
  };
 });
 await open(page);await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','running');
 const count=await page.evaluate(()=>(window as any).__motionLifecycle.signals.length);expect(count).toBeGreaterThan(0);
 await page.locator('[data-ab-close]').click();
 expect(await page.evaluate(()=>(window as any).__motionLifecycle.signals.every((s:AbortSignal)=>s.aborted))).toBe(true);
 expect(await page.evaluate(()=>(window as any).__motionLifecycle.disconnected)).toBe(1);
 await open(page);await expect(page.locator('[data-ab-lab]')).toHaveAttribute('data-motion','running');
 expect(await page.evaluate(n=>(window as any).__motionLifecycle.signals.slice(n).some((s:AbortSignal)=>!s.aborted),count)).toBe(true);
});
