'use strict';
const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');const assert=require('node:assert/strict');
test('optional real PostgreSQL runner parses without running or downloading database',()=>{
 const result=spawnSync(process.execPath,['--check',path.join(__dirname,'real-pg-concurrency.cjs')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const source=fs.readFileSync(path.join(__dirname,'real-pg-concurrency.cjs'),'utf8');
 assert.match(source,/delete childEnv.PGSERVICE/);assert.match(source,/unix_socket_directories/);
 assert.match(source,/observedConcurrentRowLock/);assert.match(source,/PGHOSTADDR:'127\.0\.0\.1'/);
});
test('real PostgreSQL multi-connection concurrency execution',{
 skip:'Manual integration gate: PostgreSQL 17.12 cloud run passed 3/3 on 2026-11-15; binaries were temporary and are not installed. See REAL-POSTGRES-STATUS.md and saved evidence. This unit suite does not start PostgreSQL.'
},()=>{});
