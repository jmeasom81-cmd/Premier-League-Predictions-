import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import handler from '../api/open-stats.js';

function response(){
 return {statusCode:200,headers:{},body:null,status(code){this.statusCode=code;return this},
  setHeader(key,value){this.headers[key]=value},json(body){this.body=body;return this}};
}
test('frontend shot-map code parses without a syntax exception',()=>{
 const code=readFileSync(new URL('../open-stats.js',import.meta.url),'utf8');
 assert.doesNotThrow(()=>new vm.Script(code,{filename:'open-stats.js'}));
 assert.match(code,/renderShotMaps\(match,summary\)/);
 assert.match(code,/Game-by-game expected goals/);
});
test('football-only API returns valid positions, real source xG and null for missing values',async()=>{
 const original=globalThis.fetch;
 const events=[
  {team:{name:'Manchester United'},type:{name:'Shot'},player:{name:'A & B'},minute:9,
   location:[105.33,40.42],shot:{statsbomb_xg:0.34,outcome:{name:'Goal'}}},
  {team:{name:'AFC Bournemouth'},type:{name:'Shot'},player:{name:'C'},minute:41,
   location:[-9,40],shot:{outcome:{name:'Off T'}}},
  {team:{name:'Manchester United'},type:{name:'Pass'},pass:{},location:[55,40]},
  {team:{name:'Manchester United'},type:{name:'Shot'},location:[109,41],
   shot:{statsbomb_xg:0,outcome:{name:'Saved'}}}
 ];
 globalThis.fetch=async()=>({ok:true,headers:{get:()=>String(JSON.stringify(events).length)},text:async()=>JSON.stringify(events)});
 try{
  const res=response();
  await handler({method:'GET',query:{match:'3754159'}},res);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.eventCount,4);
  assert.equal(res.body.shots.length,3);
  assert.deepEqual(res.body.shots[0].location,[105.3,40.4]);
  assert.equal(res.body.shots[0].xg,0.34);
  assert.equal(res.body.shots[0].isGoal,true);
  assert.equal(res.body.shots[1].location,null);
  assert.equal(res.body.shots[1].xg,null);
  assert.equal(res.body.shots[2].xg,0);
  assert.equal(res.body.teams.find(t=>t.team==='Manchester United').xg,0.34);
 }finally{globalThis.fetch=original;}
});
test('match lookup only responds to GET with approved match IDs',async()=>{
 const denied=response(),missing=response();
 await handler({method:'POST',query:{match:'3754159'}},denied);
 await handler({method:'GET',query:{match:'12345678'}},missing);
 assert.equal(denied.statusCode,405);
 assert.equal(missing.statusCode,404);
});
