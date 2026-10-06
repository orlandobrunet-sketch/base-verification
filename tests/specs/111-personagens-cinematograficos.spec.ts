import {test,expect} from '@playwright/test';
import {injectGameState} from '../helpers/game';

test.use({serviceWorkers:'block',reducedMotion:'reduce'});
const classes={nephros:'clerigo_renal',aquaria:'maga_metabolica',glomerulus:'guerreiro_glomerular'};
for(const [id,folder] of Object.entries(classes)) test('retratos cinematográficos carregam nos dez níveis de '+id,async({page})=>{
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  await page.goto('/jogar/');
  await injectGameState(page,{character:id});
  for(let level=1;level<=10;level++){
    await page.evaluate(level=>(0,eval)(`state.level=${level};renderHUD()`),level);
    const asset=`assets/classes-cinema/${folder}/nivel_${String(level).padStart(2,'0')}.webp`;
    await expect(page.locator('#heroImg')).toHaveAttribute('src',asset+'?v=15.85');
    await expect.poll(()=>page.locator('#heroImg').evaluate((el,asset)=>{const img=el as HTMLImageElement;return img.complete&&img.currentSrc.includes(asset)&&img.naturalWidth===768&&img.naturalHeight===768;},asset)).toBe(true);
  }
  await page.evaluate(()=>(0,eval)('state.level=16;renderHUD()'));
  await expect(page.locator('#heroImg')).toHaveAttribute('src',`assets/classes-cinema/${folder}/nivel_10.webp?v=15.85`);
  await expect(page.locator('#heroClass')).not.toBeEmpty();
});
