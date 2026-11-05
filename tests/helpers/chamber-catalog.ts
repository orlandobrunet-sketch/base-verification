import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Read actual authorship in a disposable VM. Never expose a test API in the game.
const source=readFileSync(path.resolve(__dirname,'../../js/minigame-acidbase.js'),'utf8');
const exposed=source.replace('window.showAcidBaseMinigame = showAcidBaseMinigame;','window.auditCases = CASES; window.showAcidBaseMinigame = showAcidBaseMinigame;');
if(exposed===source)throw new Error('Cannot inspect chamber catalog');
const math=Object.create(Math);math.random=()=>0.5;
const window:any={};vm.runInNewContext(exposed,{window,Math:math});
export const chamberCatalog:any[]=window.auditCases.map((c:any)=>({...c,...c.build()}));
