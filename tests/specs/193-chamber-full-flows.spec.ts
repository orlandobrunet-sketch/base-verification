import {test,expect} from '@playwright/test';
import {openChamberCase} from '../helpers/chamber';
import {chamberCatalog} from '../helpers/chamber-catalog';

test.use({serviceWorkers:'block',contextOptions:{reducedMotion:'reduce'}});
for(const patient of chamberCatalog)test(`all five authored acts complete once for ${patient.id}`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.addInitScript(()=>Math.random=()=>0.5);
 await page.goto('/jogar/',{waitUntil:'load'});
 await page.evaluate(ids=>{localStorage.setItem('nq-acidbase-progress',JSON.stringify({completed:ids}));document.getElementById('landingScreen')?.classList.add('hidden');document.getElementById('welcomeScreen')?.classList.add('hidden');(window as any).showAcidBaseMinigame();},chamberCatalog.slice(0,chamberCatalog.findIndex(p=>p.id===patient.id)).map(p=>p.id));
 const cinema=page.locator('#nqEntryCinema[open]');if(await cinema.count()){await page.keyboard.press('Escape');await expect(cinema).toHaveCount(0);}
 const predecessors=chamberCatalog.slice(0,chamberCatalog.findIndex(p=>p.id===patient.id)).map(p=>p.id);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('nq-acidbase-progress')||'{}').completed)).not.toContain(patient.id);
 await openChamberCase(page,patient.id);await page.locator('[data-ab-start-acts]').click();
 expect(patient.acts).toHaveLength(5);
 for(const act of patient.acts){
  if(act.kind==='mc')await page.locator('.ab-option').filter({hasText:act.options.find((o:any)=>o.correct).label}).click();
  else if(act.kind==='num'){await page.locator('#abNumInput').fill(String(act.target));await page.locator('[data-ab-num-submit]').click();}
  else {
   const correct=new Set(act.cards.filter((c:any)=>c.correct).map((c:any)=>c.id));
   const nav=page.getByRole('navigation',{name:'Carta',exact:true});
   for(let n=0;n<act.cards.length;n++){
    for(const card of await page.locator('[data-ab-card-id]:visible').all())if(correct.has(await card.getAttribute('data-ab-card-id')))await card.click();
    if(!await nav.isVisible()||!await nav.getByRole('button',{name:'Próxima',exact:true}).isEnabled())break;
    await nav.getByRole('button',{name:'Próxima',exact:true}).click();
   }
   await page.locator('[data-ab-cards-submit]').click();
  }
  await expect(page.locator('.ab-next')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('.ab-next').click();
 }
 await expect(page.locator('.ab-summary-title')).toContainText('Diagnóstico Impecável');
 await expect(page.locator('.ab-summary-stats strong').first()).toHaveText('0');
 const sources=page.locator('[data-ab-source-id]');await expect(sources.first()).toBeAttached();
 await expect(sources.first().locator('a')).toHaveAttribute('href',/^https:\/\//);
 if(patient.id==='aldric')await expect(page.locator('[data-ab-source-id="bicaricu2_2025"] a')).toHaveAttribute('href','https://jamanetwork.com/journals/jama/fullarticle/2840824');
 const specificSources:Record<string,[string,string]>={selene:['hyperglycemic_crises_consensus_2024','https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/'],edrin:['kdigo_ckd_2024','https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf'],corvin:['endocrine_society_primary_aldosteronism_2025','https://www.endocrine.org/clinical-practice-guidelines/primary-aldosteronism-2']};
 if(specificSources[patient.id]){const[id,url]=specificSources[patient.id];await expect(page.locator(`[data-ab-source-id="${id}"] a`)).toHaveAttribute('href',url);}
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nq-acidbase-progress')||'{}'));
 expect(saved.completed).toEqual([...predecessors,patient.id]);
 await page.locator('[data-ab-back]').click();await expect(page.locator('#acidBaseOverlay')).toHaveAttribute('data-ab-tela','hub');
 const next=chamberCatalog[chamberCatalog.findIndex(p=>p.id===patient.id)+1];
 if(next)await expect(page.locator(`[data-ab-next="${next.id}"]`)).toBeAttached();
 expect(errors).toEqual([]);
});
