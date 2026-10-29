import { expect, type Page } from '@playwright/test';
/** Follow the visible native CTA or desktop patient pages; never bypass unlocks. */
export async function openChamberCase(page:Page,id:string){
 const next=page.locator(`[data-ab-next="${id}"]:visible`);if(await next.count()){await next.click();return;}
 const target=page.locator(`[data-ab-case="${id}"]`);
 const tab=page.getByRole('tab',{name:'20 pacientes',exact:true});
 if(await tab.isVisible()){await tab.click();const paging=page.getByRole('navigation',{name:'Página',exact:true});
  for(let i=0;i<5&&!await target.isVisible();i++){const back=paging.getByRole('button',{name:'Anterior',exact:true});if(await back.isEnabled())await back.click();else break;}
  for(let i=0;i<5&&!await target.isVisible();i++){const forward=paging.getByRole('button',{name:'Próxima',exact:true});if(await forward.isEnabled())await forward.click();else break;}
 }
 await expect(target).toBeVisible();await target.click();
}
