import{test,expect,type Page}from'@playwright/test';test.use({serviceWorkers:'block',reducedMotion:'no-preference'});
import{confirmCharacterStart}from'../helpers/cinema';
import{medirContraste}from'../helpers/contraste';
async function setup(page:Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.addInitScript(()=>{for(const[k,v]of Object.entries({'nefroquest-sound':'on','nefroquest-music':'on','nefroquest-sfx-vol':'.37','nefroquest-music-vol':'.21','nefroquest-audio-preferences-version':'15.91'}))if(localStorage.getItem(k)===null)localStorage.setItem(k,v);});
 await page.goto('/cinema-preview.html');
}
const prefs=(page:Page)=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>/nefroquest-(sound|music|sfx|audio)/.test(k)).sort().map(k=>[k,localStorage.getItem(k)]))));
async function open(page:Page,key:string){await page.evaluate(key=>{const w=window as any;w.__keep=true;w.__done=[];w.__closed=[];const event=key==='victory'?'nq-victory-cinema-closed':'nq-entry-cinema-closed';document.addEventListener(event,(e:CustomEvent)=>w.__closed.push(e.detail),{once:true});if(key==='victory')w.NQVictoryCinema.open({contextKey:'interruption',isCurrent:()=>w.__keep,onDone:(reason:any)=>w.__done.push(reason)});else w.NQEntryCinema.open({key:'interruption',kind:'battle',artKey:'battle',title:'O Trono da Uremia',media:w.NQ_BATTLE_INTRO_CONFIG,isCurrent:()=>w.__keep,onDone:(d:any)=>w.__done.push(d.reason)});},key);const d=page.locator('dialog[open]');await expect(d).toBeVisible();if(key==='victory')await expect.poll(()=>page.evaluate(()=>(window as any).NQVictoryCinema.inspection.elapsed)).toBeGreaterThan(700);else await expect.poll(()=>d.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.7);return d;}
for(const key of ['battle','victory'])for(const exit of ['close','skip','escape','external-close','context-lost','navigation'])test(`${key}: ${exit} releases one source and native gate exactly once`,async({page})=>{
 await setup(page);const before=await prefs(page),d=await open(page,key),bed=d.locator('audio[data-nq-movie-music]');await expect(bed).toHaveCount(1);await expect(bed).toHaveJSProperty('paused',true);
 await d.getByRole('button',{name:'Ativar som',exact:true}).click();await expect.poll(()=>bed.evaluate((a:HTMLAudioElement)=>!a.paused&&!a.muted&&a.volume>0)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(1);
 expect(await page.evaluate(()=>(0,eval)('[wmTrack,bgA,bgB,...Object.values(SFX)].every(a=>a.volume===0)'))).toBe(true);
 if(key==='battle')await expect(d.locator('video')).toHaveJSProperty('muted',true);
 const range=d.locator('input[type=range]');await range.focus();await page.keyboard.press('Home');for(let i=0;i<(key==='victory'?20:20);i++)await page.keyboard.press('ArrowRight');
 await expect.poll(()=>bed.evaluate((a:HTMLAudioElement)=>a.volume)).toBeCloseTo(.11,3);
 if(exit==='navigation'){
  await page.evaluate(()=>window.addEventListener('pagehide',()=>sessionStorage.setItem('qa-pagehide',JSON.stringify({owners:(window as any).NQNativeCinemaAudio.inspection.owners,beds:document.querySelectorAll('audio[data-nq-movie-music]').length})),{once:true}));
  await page.goto('/cinema-preview.html?after-navigation');expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('qa-pagehide')!))).toEqual({owners:0,beds:0});
 }else{
  if(exit==='close')await d.locator(key==='victory'?'.nq-victory-cinema__close':'.nq-entry-cinema__close').click();
  if(exit==='skip')await d.getByRole('button',{name:key==='victory'?'Ver resultados':'Pular introdução',exact:true}).click();
  if(exit==='escape'){await page.keyboard.press('Escape');await page.keyboard.press('Escape');}
  if(exit==='external-close')await d.evaluate((n:HTMLDialogElement)=>n.close());
  if(exit==='context-lost')await page.evaluate(()=>(window as any).__keep=false);
  await expect(d).toBeHidden();await expect(page.locator('audio[data-nq-movie-music]')).toHaveCount(0);await expect(page.locator('dialog video')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as any).__closed.length)).toBe(1);expect(await page.evaluate(()=>(window as any).__done.length)).toBe(exit==='context-lost'?0:1);
  await expect.poll(()=>page.evaluate(()=>(0,eval)('Object.values(SFX).every(a=>Math.abs(a.volume-.37)<1e-6)'))).toBe(true);
 }
 await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);expect(await prefs(page)).toBe(before);
});
for(const key of ['battle','victory'])test(`${key}: media failure cleans up without orphan output`,async({page})=>{
 await setup(page);await page.route(key==='victory'?'**/victory-jornada.webp':'**/NefroQuest-camera-isolada-teste-04.mp4',r=>r.abort());
 await page.locator(`[data-preview="${key}"]`).click();await expect(page.locator('dialog[open]')).toHaveCount(0,{timeout:15000});await expect(page.locator('audio[data-nq-movie-music]')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);
});
test.beforeEach(async({page})=>{test.skip(!await page.evaluate(()=>matchMedia('(min-width:769px) and (hover:hover) and (pointer:fine)').matches&&!matchMedia('(any-pointer:coarse)').matches&&navigator.maxTouchPoints===0),'Desktop cinematic player only');});
for(const key of ['battle','victory'])test(`${key}: repeated opens and exits never accumulate players`,async({page})=>{
 await setup(page);const before=await prefs(page);
 for(const action of ['skip','escape','close']){
  await page.evaluate(()=>localStorage.removeItem('nefroquest-cinema-sound'));const d=await open(page,key);await d.getByRole('button',{name:'Ativar som',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(1);
  await expect(page.locator('audio[data-nq-movie-music]')).toHaveCount(1);
  if(key==='victory'){await d.getByRole('button',{name:'Rever',exact:true}).click();await expect(d.locator('audio')).toHaveJSProperty('muted',false);await expect.poll(()=>page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(1);await expect(d.locator('audio')).toHaveCount(1);}
  if(action==='skip')await d.getByRole('button',{name:key==='victory'?'Ver resultados':'Pular introdução',exact:true}).click();
  if(action==='escape')await page.keyboard.press('Escape');
  if(action==='close')await d.locator(key==='victory'?'.nq-victory-cinema__close':'.nq-entry-cinema__close').click();
  await expect(d).toBeHidden();await expect(page.locator('audio[data-nq-movie-music],dialog video')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).__done.length)).toBe(1);expect(await page.evaluate(()=>(window as any).__closed.length)).toBe(1);
 }
 expect(await prefs(page)).toBe(before);expect(await page.evaluate(()=>(window as any).NQNativeCinemaAudio.inspection.owners)).toBe(0);
});
test('same character may start again without replaying an already seen film',async({page})=>{
 await setup(page);await page.goto('/jogar/');await page.waitForFunction(()=>typeof(window as any)._confirmDiff==='function');
 await page.evaluate(()=>document.getElementById('landingScreen')?.classList.add('hidden'));
 for(let i=0;i<2;i++){
  await page.evaluate(()=>(0,eval)('_pendingDiff="normal";_confirmDiff(false)'));
  await page.locator('#charSelectModal [data-arg="nephros"]').click();await confirmCharacterStart(page);
  await expect(page.locator('#question')).not.toBeEmpty();await expect(page.locator('#nqEntryCinema[open]')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as any).NQEntryBridge.inspection.automaticOpened)).toBe(1);
  if(i===0)await page.locator('[data-action="goToWelcomeFromGame"]:visible').first().click();
 }
 expect(await page.evaluate(()=>(window as any).state.correctTotal)).toBe(0);
});
test('dark reading cards and cinema controls fit at1100 with enlarged text',async({page})=>{
 await setup(page);await page.setViewportSize({width:1100,height:740});await page.locator('[data-preview="nephros"]').click();const d=page.locator('dialog[open]'),card=d.locator('.nq-movie-prologue');
 await expect.poll(()=>card.locator('.nq-prologue-copy').evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
 await d.getByRole('button',{name:'Pausar',exact:true}).click();await page.evaluate(()=>document.documentElement.style.fontSize='32px');
 await expect(card.locator('.nq-prologue-copy')).toBeVisible();expect(await card.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
 expect(await page.evaluate(medirContraste,'.nq-movie-prologue')).toEqual([]);
 for(const control of await d.locator('button:visible,input:visible').all()){const b=(await control.boundingBox())!;expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(1101);expect(b.y+b.height).toBeLessThanOrEqual(741);}
 await page.keyboard.press('Escape');await expect(d).toBeHidden();
});
