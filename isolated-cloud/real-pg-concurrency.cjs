'use strict';
/* Explicit local-only runner. Usage: node real-pg-concurrency.cjs --pg-bin <approved PostgreSQL bin directory>
 * Creates its OWN ephemeral cluster. Never accepts DATABASE_URL or any existing data dir.
 * Does not download/install software, register services, change PATH/firewall, or access production.
 */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const bin=process.argv[process.argv.indexOf('--pg-bin')+1];
if(!process.argv.includes('--pg-bin')||!bin)throw Error('Supply --pg-bin pointing at approved existing PostgreSQL binaries');
const exe=n=>path.join(path.resolve(bin),n+(process.platform==='win32'?'.exe':''));
for(const n of ['initdb','pg_ctl','psql'])if(!fs.existsSync(exe(n)))throw Error('Missing required binary: '+n);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'nq-real-pg-')),data=path.join(root,'cluster'),password=crypto.randomBytes(32).toString('hex'),pwfile=path.join(root,'password.txt');
fs.writeFileSync(pwfile,password+'\n',{mode:0o600});
const children=new Set();let started=false;
function processRun(name,args,{input,env={}}={}){
 const childEnv={...process.env,...env};delete childEnv.PGSERVICE;delete childEnv.PGSERVICEFILE;
 const child=spawn(exe(name),args,{env:childEnv,windowsHide:true,stdio:['pipe','pipe','pipe']});children.add(child);
 let stdout='',stderr='';const listeners=[];
 child.stdout.on('data',d=>{stdout+=d;for(const f of [...listeners])f(stdout);});child.stderr.on('data',d=>stderr+=d);
 const done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>{children.delete(child);resolve({code,stdout,stderr});});});
 const waitFor=(marker,timeout=15000)=>new Promise((resolve,reject)=>{let timer;const f=s=>{if(s.includes(marker)){clearTimeout(timer);listeners.splice(listeners.indexOf(f),1);resolve(s);}};listeners.push(f);timer=setTimeout(()=>reject(Error('Missing output marker: '+marker)),timeout);f(stdout);done.then(r=>{if(!r.stdout.includes(marker)){clearTimeout(timer);reject(Error('Process ended before '+marker+': '+r.stderr));}}).catch(reject);});
 if(input!==undefined)child.stdin.end(input);
 return {child,done,waitFor};
}
async function run(name,args,opts){const result=await processRun(name,args,opts).done;if(result.code)throw Error(name+' failed: '+result.stderr);return result.stdout;}
async function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});});}
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
(async()=>{
 const port=await freePort();
 const psqlArgs=['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p',String(port),'-U','nq_test_admin','-d','postgres'];
 const environment={PGPASSWORD:password,PGCONNECT_TIMEOUT:'5',PGAPPNAME:'nq_observer',PGHOSTADDR:'127.0.0.1',PGSSLMODE:'disable',PGOPTIONS:'-c statement_timeout=15000 -c lock_timeout=12000'};
 const sql=(input,app='nq_observer')=>processRun('psql',psqlArgs,{input,env:{...environment,PGAPPNAME:app}});
 const query=async input=>{const r=await sql(input).done;if(r.code)throw Error(r.stderr);return r.stdout.trim();};
 const asOwner="SET ROLE authenticated;SET app.owner='u';";
 const initial={protocol:1,owner:'u',resetEpoch:0,save:{saveOwner:'u',journeyId:'j',character:'nephros',difficulty:'normal',score:10},collections:{articles:[1],knowledge:2},receipts:[{id:'r',journeyId:'j',phase:'prepared',reward:{kind:'article',articleIndex:2,points:40}}],tombstone:null};
 const payload=(state,base)=>({ownerAuthority:{format:'nq-owner-authority-v1',base:base===null?null:JSON.stringify(base),state}});
 const update=(p,v,conditional=true)=>`WITH changed AS (UPDATE profiles SET game_progress=${quote(JSON.stringify(p))}::jsonb,game_progress_version=${v+1} WHERE id='u'${conditional?' AND game_progress_version='+v:''} RETURNING id) SELECT 'ROWS='||count(*) FROM changed;`;
 try{
  await run('initdb',['-D',data,'-U','nq_test_admin','--auth=scram-sha-256','--pwfile='+pwfile,'--encoding=UTF8','--locale=C']);
  // Restrict startup to loopback; never register a Windows service.
  await run('pg_ctl',['-D',data,'-l',path.join(root,'postgres.log'),'-w','-t','30','-o',`-h 127.0.0.1 -p ${port} -c unix_socket_directories=''`,'start']);started=true;
  await query(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE TABLE profiles(id text PRIMARY KEY,game_progress jsonb DEFAULT '{}');INSERT INTO profiles VALUES('u','{}');ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;CREATE POLICY owner_only ON profiles FOR ALL TO authenticated USING(id=current_setting('app.owner')) WITH CHECK(id=current_setting('app.owner'));GRANT SELECT,UPDATE ON profiles TO authenticated;`);
  await query(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261111143230_protect_cloud_progress_version.sql'),'utf8'));
  await query(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261115150000_guard_owner_authority_progress.sql'),'utf8'));
  await query(asOwner+update(payload(initial,null),0));
  const consumed=structuredClone(initial);consumed.receipts[0].phase='consumed';consumed.receipts[0].choice='accept';consumed.collections.articles.push(2);consumed.collections.knowledge++;consumed.save.score+=40;
  const winner=sql(undefined,'nq_first');winner.child.stdin.write(asOwner+'BEGIN;'+update(payload(consumed,initial),1)+"SELECT 'FIRST_LOCK_HELD PID='||pg_backend_pid();\n");
  const firstMarker=await winner.waitFor('FIRST_LOCK_HELD PID=');
  const loser=sql(asOwner+"SELECT 'SECOND_PID='||pg_backend_pid();"+update(payload(consumed,initial),1),'nq_second');
  const secondMarker=await loser.waitFor('SECOND_PID=');
  const firstPid=Number(firstMarker.match(/FIRST_LOCK_HELD PID=(\d+)/)[1]),secondPid=Number(secondMarker.match(/SECOND_PID=(\d+)/)[1]);assert.notEqual(firstPid,secondPid);
  let blocked=false;for(let attempt=0;attempt<50;attempt++){
   if(await query("SELECT count(*) FROM pg_stat_activity WHERE application_name='nq_second' AND wait_event_type='Lock';")==='1'){blocked=true;break;}
   await new Promise(r=>setTimeout(r,50));
  }
  assert.equal(blocked,true,'second connection must actually wait for first row lock');
  winner.child.stdin.end('COMMIT;\n');assert.equal((await winner.done).code,0);
  const losingResult=await loser.done;assert.equal(losingResult.code,0);assert.match(losingResult.stdout,/ROWS=0/);
  const stored=JSON.parse(await query("SELECT game_progress::text FROM profiles WHERE id='u';"));assert.deepEqual(stored.ownerAuthority.state,consumed);
  assert.equal(await query("SELECT game_progress_version FROM profiles WHERE id='u';"),'2');
  const oldWriter=await sql(asOwner+update({save:{}},2)).done;assert.notEqual(oldWriter.code,0);assert.match(oldWriter.stderr,/downgrade/i);
  const reset={...structuredClone(consumed),resetEpoch:1,save:null,collections:{articles:[],knowledge:0},receipts:[],tombstone:{reason:'reset',epoch:1}};
  await query(asOwner+update(payload(reset,consumed),2));
  const stale=await sql(asOwner+update(payload(consumed,reset),3)).done;assert.notEqual(stale.code,0);assert.match(stale.stderr,/Stale reset epoch/);
  const other=await query("SET ROLE authenticated;SET app.owner='other';"+update(payload(reset,reset),3));assert.match(other,/ROWS=0/);
  // Exercise the actual browser module's multi-epoch proof against independent server sessions.
  const {createAuthority}=require('../js/owner-authority.js');
  async function makeAuthority(){const map=new Map(),a=createAuthority({storage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},locks:{request:async(k,o,fn)=>fn({})},owner:'u',currentOwner:()=> 'u',validateSave:s=>s.saveOwner==='u'&&!!s.journeyId});await a.acquire();a.initialize({saveOwner:'u',journeyId:'a',score:0});return a;}
  const local=await makeAuthority(),peer=await makeAuthority();
  const transitionResult={};
  try{
   await query("TRUNCATE profiles;INSERT INTO profiles(id,game_progress) VALUES('u','{}');");
   const initialExport=local.exportCloud();await query(asOwner+update({ownerAuthority:initialExport},0));
   const base=local.fingerprint();
   local.startJourney({saveOwner:'u',journeyId:'b',score:0});
   local.commit(d=>{d.save.score=10;d.collections.knowledge=1;d.receipts.push({id:'b1',journeyId:'b',phase:'consumed',reward:{points:10}});});
   local.resetProgress();local.startJourney({saveOwner:'u',journeyId:'c',score:0});
   local.commit(d=>{d.save.score=20;d.collections.knowledge=2;d.receipts.push({id:'c1',journeyId:'c',phase:'consumed',reward:{points:20}});});
   const proof=local.exportCloud({base});assert.equal(proof.transitionPath.length,7);
   const readRow=()=>query("SELECT json_build_object('progress',game_progress,'version',game_progress_version)::text FROM profiles WHERE id='u';");
   const before=await readRow();
   const corruptions=[p=>p.transitionPath.splice(1,1),p=>p.transitionPath[1].owner='x',p=>p.transitionPath[p.transitionPath.length-1]=structuredClone(initialExport.state),p=>p.transitionPath=null,p=>p.transitionPath=[],p=>p.base='{}'];
   for(const corrupt of corruptions){
    const bad=structuredClone(proof);corrupt(bad);assert.throws(()=>peer.importCloud(bad));
    const rejected=await sql(asOwner+update({ownerAuthority:bad},1)).done;
    assert.notEqual(rejected.code,0);assert.equal(await readRow(),before,'rejected proof must not alter state/version');
   }
   const denied=await query("SET ROLE authenticated;SET app.owner='other';"+update({ownerAuthority:proof},1));assert.match(denied,/ROWS=0/);assert.equal(await readRow(),before);
   const pathWinner=sql(undefined,'nq_path_first');pathWinner.child.stdin.write(asOwner+'BEGIN;'+update({ownerAuthority:proof},1)+"SELECT 'PATH_FIRST_LOCK_HELD PID='||pg_backend_pid();\n");
   const marker=await pathWinner.waitFor('PATH_FIRST_LOCK_HELD PID=');
   const pathLoser=sql(asOwner+"SELECT 'PATH_SECOND_PID='||pg_backend_pid();"+update({ownerAuthority:proof},1),'nq_path_second');
   const marker2=await pathLoser.waitFor('PATH_SECOND_PID=');
   const pid1=Number(marker.match(/PATH_FIRST_LOCK_HELD PID=(\d+)/)[1]),pid2=Number(marker2.match(/PATH_SECOND_PID=(\d+)/)[1]);assert.notEqual(pid1,pid2);
   let pathBlocked=false;for(let attempt=0;attempt<50;attempt++){
    if(await query("SELECT count(*) FROM pg_stat_activity WHERE application_name='nq_path_second' AND wait_event_type='Lock';")==='1'){pathBlocked=true;break;}
    await new Promise(r=>setTimeout(r,50));
   }
   assert.equal(pathBlocked,true);pathWinner.child.stdin.end('COMMIT;\n');assert.equal((await pathWinner.done).code,0);
   const lost=await pathLoser.done;assert.equal(lost.code,0);assert.match(lost.stdout,/ROWS=0/);
   let actual=JSON.parse(await readRow());assert.equal(actual.version,2);assert.deepEqual(actual.progress.ownerAuthority,proof);
   peer.importCloud(proof);assert.deepEqual(peer.exportCloud().state,proof.state);
   await query(asOwner+update({ownerAuthority:proof},2));peer.importCloud(proof);
   actual=JSON.parse(await readRow());assert.equal(actual.version,3);assert.deepEqual(actual.progress.ownerAuthority.state,peer.exportCloud().state);
   assert.equal(actual.progress.ownerAuthority.state.save.score,20);assert.equal(actual.progress.ownerAuthority.state.collections.knowledge,2);assert.equal(actual.progress.ownerAuthority.state.receipts.length,1);
   assert.equal(actual.progress.ownerAuthority.state.receipts[0].id,'c1');
   Object.assign(transitionResult,{pathLength:proof.transitionPath.length,rejectedCorruptions:corruptions.length,firstPid:pid1,secondPid:pid2,observedConcurrentRowLock:pathBlocked,exactReplayCreditsOnce:true,browserImportMatchesSQL:true,resetRemovedEarlierReward:true});
  }finally{await local.release();await peer.release();}
  const report={passed:true,postgresVersion:await query('SELECT version();'),firstPid,secondPid,observedConcurrentRowLock:blocked,transitionResult,
   assertions:['exactly one concurrent claim commits','second CAS returns zero rows','score/articles/knowledge/receipt credited once','legacy downgrade blocked','stale reset rejected','other owner blocked by RLS'],clusterDirectory:root};
  fs.writeFileSync(path.join(root,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{
  for(const child of children)child.kill();
  if(started||fs.existsSync(path.join(data,'postmaster.pid')))await run('pg_ctl',['-D',data,'-m','fast','-w','-t','30','stop']);
  fs.rmSync(pwfile,{force:true});
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
