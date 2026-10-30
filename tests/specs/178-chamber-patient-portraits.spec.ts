import { openChamberCase } from '../helpers/chamber';
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
test.use({ serviceWorkers:'block', reducedMotion:'reduce' });
const source=readFileSync(path.resolve(__dirname,'../../js/minigame-acidbase.js'),'utf8');
const catalog=source.slice(source.indexOf('const CASES = ['),source.indexOf('// Helper p/'));
const people=[...catalog.matchAll(/id:'([^']+)'[^\n]*character:'([^']+)'/g)].map(m=>({id:m[1],name:m[2]}));
const screens=path.resolve(__dirname,'../test-results/visual-screens');mkdirSync(screens,{recursive:true});
async function prepare(page:Page){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('/jogar/',{waitUntil:'load'});await page.waitForFunction(()=>typeof(window as any).showAcidBaseMinigame==='function');
 // Disposable visual-access fixture, not a change to unlock rules or real saves.
 await page.evaluate(ids=>{localStorage.setItem('nq-acidbase-progress',JSON.stringify({completed:ids}));document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');},people.map(x=>x.id));
 await open(page);
}
async function open(page:Page){await page.evaluate(()=>(window as any).showAcidBaseMinigame());const d=page.locator('#nqEntryCinema[open]');if(await d.count())await page.keyboard.press('Escape');await expect(page.locator('#acidBaseOverlay')).toBeVisible();}
async function portrait(page:Page,id:string,name:string){
 const figure=page.locator(`[data-ab-portrait="${id}"]`),img=figure.locator('img');await expect(figure).toBeVisible();await expect(page.locator('.ab-patient-portrait')).toHaveCount(1);
 await expect(img).toHaveAttribute('src',`assets/chamber/patients/${id}.webp`);await expect(img).toHaveAttribute('alt','Retrato ilustrado de '+name);
 const geometry=await img.evaluate((el:HTMLImageElement)=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{width:el.naturalWidth,height:el.naturalHeight,ratio:r.width/r.height,fit:s.objectFit,animation:s.animationName,transform:s.transform};});
 expect(geometry.width).toBe(768);expect(geometry.height).toBe(960);expect(geometry.ratio).toBeCloseTo(.8,2);expect(geometry.fit).toBe('contain');expect(geometry.animation).toBe('none');expect(geometry.transform).toBe('none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
test('all20 native case identities keep the matching real portrait in intro and act',async({page})=>{
 test.setTimeout(150000);test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Desktop portraits; touch absence has its own tests.');await page.setViewportSize({width:1440,height:960});await prepare(page);expect(people).toHaveLength(20);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const p of people){await openChamberCase(page,p.id);await expect(page.locator('.ab-context .ab-title')).toHaveText(p.name);await portrait(page,p.id,p.name);await expect(page.locator('.ab-context .ab-title')).toBeFocused();await page.screenshot({path:path.join(screens,'patient-'+p.id+'.png'),fullPage:true});await page.locator('[data-ab-start-acts]').click();await portrait(page,p.id,p.name);await expect(page.locator('.ab-prompt')).toBeFocused();await page.locator('[data-ab-close]').click();await open(page);}
 expect(errors).toEqual([]);
});
test('real portrait and long identity remain readable at200percent text',async({page})=>{
 test.skip(!await page.evaluate(()=>matchMedia('(pointer:fine)').matches),'Desktop text reflow; native touch tested separately.');await page.setViewportSize({width:1100,height:800});await prepare(page);await page.evaluate(()=>document.documentElement.style.fontSize='32px');await openChamberCase(page,'mireth');await portrait(page,'mireth','Sacerdotisa Mireth');await expect(page.locator('[data-ab-start-acts]')).toBeVisible();await page.screenshot({path:path.join(screens,'patient-mireth-1100-font200.png'),fullPage:true});
});
