// STATS RICH LEAGUE V1
// Uses ONLY the existing proven Stats RPCs.
// Renders when it can see the League Stats "League records" card.
// No dependency on the new get_league_story_insights RPC.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let ctx=null;
let dataCache=null;
let loadPromise=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

const num=v=>Number(v||0);

async function getCtx(){
  if(ctx)return ctx;
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return null;
  const {data,error}=await sb.from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);
  if(error)throw error;
  if(!data?.length)return null;
  ctx={leagueId:data[0].league_id,userId:session.user.id};
  return ctx;
}

async function mapLimit(items,limit,worker){
  const out=new Array(items.length);
  let next=0;
  async function run(){
    while(next<items.length){
      const i=next++;
      try{out[i]=await worker(items[i],i)}catch(e){out[i]=null}
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
  return out;
}

async function loadData(){
  if(dataCache)return dataCache;
  if(loadPromise)return loadPromise;

  loadPromise=(async()=>{
    const c=await getCtx();
    if(!c)return null;

    const {data:profiles,error:pErr}=await sb.rpc('get_player_stats_profiles',{
      p_league_id:c.leagueId
    });
    if(pErr)throw pErr;

    const players=profiles?.players||[];
    const packs=await mapLimit(players,6,async p=>{
      const {data,error}=await sb.rpc('get_player_stats_evidence',{
        p_league_id:c.leagueId,
        p_user_id:p.user_id
      });
      if(error)throw error;
      return {player:p,evidence:data||{}};
    });

    dataCache={profiles:profiles||{},packs:packs.filter(Boolean)};
    return dataCache;
  })();

  try{return await loadPromise}
  finally{loadPromise=null}
}

function playerName(p){
  return p?.team_name||p?.display_name||'Player';
}

function callFromScores(h,a){
  if(h==null||a==null)return null;
  return +h>+a?'home':+h<+a?'away':'draw';
}

function actualCall(x){
  return callFromScores(x.actual_home,x.actual_away);
}

function analyse(d){
  const players=d?.profiles?.players||[];
  const packs=d?.packs||[];
  const fixtures=new Map();
  const playerRows=[];

  for(const pack of packs){
    const p=pack.player||{};
    const rows=(pack.evidence?.all_fixtures||[]).filter(x=>x.has_prediction!==false);

    let totalGoalError=0,scoreDistance=0,valid=0,correct=0,exacts=0,contrarian=0,contrarianHits=0;
    const calls=[];

    for(const x of rows){
      if(x.predicted_home==null||x.predicted_away==null||x.actual_home==null||x.actual_away==null)continue;
      valid++;
      totalGoalError+=Math.abs((+x.predicted_home + +x.predicted_away)-(+x.actual_home + +x.actual_away));
      scoreDistance+=Math.abs(+x.predicted_home-+x.actual_home)+Math.abs(+x.predicted_away-+x.actual_away);
      if(x.is_correct_outcome)correct++;
      if(x.is_exact)exacts++;

      const key=x.fixture_id||`${x.matchweek}|${x.home_team}|${x.away_team}`;
      if(!fixtures.has(key)){
        fixtures.set(key,{
          key,matchweek:x.matchweek,home_team:x.home_team,away_team:x.away_team,
          actual_home:x.actual_home,actual_away:x.actual_away,picks:[]
        });
      }
      const predCall=x.predicted_call||callFromScores(x.predicted_home,x.predicted_away);
      fixtures.get(key).picks.push({
        user_id:p.user_id,
        team_name:p.team_name,
        display_name:p.display_name,
        predCall,
        ph:+x.predicted_home,pa:+x.predicted_away,
        exact:!!x.is_exact,correct:!!x.is_correct_outcome
      });
      calls.push({key,predCall,correct:!!x.is_correct_outcome});
    }

    playerRows.push({
      ...p,
      valid,
      avgTotalGoalError:valid?totalGoalError/valid:999,
      avgScoreDistance:valid?scoreDistance/valid:999,
      correct,
      exacts,
      exactConversion:correct?exacts*100/correct:0,
      calls,
      contrarian,
      contrarianHits
    });
  }

  const fixtureRows=[...fixtures.values()].map(f=>{
    const n=f.picks.length;
    const home=f.picks.filter(p=>p.predCall==='home').length;
    const draw=f.picks.filter(p=>p.predCall==='draw').length;
    const away=f.picks.filter(p=>p.predCall==='away').length;
    const max=Math.max(home,draw,away);
    const leaders=[['home',home],['draw',draw],['away',away]].filter(x=>x[1]===max);
    const majorityCall=leaders.length===1?leaders[0][0]:null;
    const actual=callFromScores(f.actual_home,f.actual_away);
    const correct=f.picks.filter(p=>p.correct).length;
    const exacts=f.picks.filter(p=>p.exact).length;
    const consensus=n?max*100/n:0;
    const hp=n?home*100/n:0,dp=n?draw*100/n:0,ap=n?away*100/n:0;
    const splitGap=Math.abs(hp-33.333)+Math.abs(dp-33.333)+Math.abs(ap-33.333);
    return {...f,n,home,draw,away,majorityCall,actual,correct,exacts,consensus,hp,dp,ap,splitGap};
  }).filter(f=>f.n>=3);

  // Contrarian totals after fixture majority is known.
  const fixtureByKey=new Map(fixtureRows.map(f=>[f.key,f]));
  for(const pr of playerRows){
    let c=0,h=0;
    for(const pick of pr.calls){
      const f=fixtureByKey.get(pick.key);
      if(!f?.majorityCall)continue;
      if(pick.predCall!==f.majorityCall){
        c++;
        if(pick.correct)h++;
      }
    }
    pr.contrarian=c;
    pr.contrarianHits=h;
  }

  // Prediction twins.
  const pairMap=new Map();
  for(const f of fixtureRows){
    const picks=f.picks;
    for(let i=0;i<picks.length;i++){
      for(let j=i+1;j<picks.length;j++){
        const a=picks[i],b=picks[j];
        const ids=[String(a.user_id),String(b.user_id)].sort();
        const key=ids.join('|');
        if(!pairMap.has(key))pairMap.set(key,{a:a,b:b,shared:0,sameScore:0,sameOutcome:0});
        const pair=pairMap.get(key);
        pair.shared++;
        if(a.ph===b.ph&&a.pa===b.pa)pair.sameScore++;
        if(a.predCall===b.predCall)pair.sameOutcome++;
      }
    }
  }

  const pairs=[...pairMap.values()]
    .filter(x=>x.shared>=20)
    .map(x=>({...x,sameScorePct:x.sameScore*100/x.shared,sameOutcomePct:x.sameOutcome*100/x.shared}));

  const validPlayers=playerRows.filter(p=>p.valid>=10);

  const mostUnanimous=[...fixtureRows].sort((a,b)=>b.consensus-a.consensus||b.n-a.n)[0]||null;
  const mostDivided=[...fixtureRows].sort((a,b)=>a.splitGap-b.splitGap||b.n-a.n)[0]||null;
  const consensusDisaster=[...fixtureRows].filter(f=>f.majorityCall&&f.majorityCall!==f.actual)
    .sort((a,b)=>b.consensus-a.consensus||b.n-a.n)[0]||null;
  const loneWolf=[...fixtureRows].filter(f=>f.correct===1).sort((a,b)=>b.n-a.n)[0]||null;
  const exactParty=[...fixtureRows].sort((a,b)=>b.exacts-a.exacts||b.n-a.n)[0]||null;

  const bestGoal=[...validPlayers].sort((a,b)=>a.avgTotalGoalError-b.avgTotalGoalError||b.valid-a.valid)[0]||null;
  const closestScore=[...validPlayers].sort((a,b)=>a.avgScoreDistance-b.avgScoreDistance||b.valid-a.valid)[0]||null;
  const exactConverter=[...validPlayers].filter(p=>p.correct>=5)
    .sort((a,b)=>b.exactConversion-a.exactConversion||b.exacts-a.exacts)[0]||null;
  const contrarian=[...validPlayers].filter(p=>p.contrarian>=3)
    .sort((a,b)=>b.contrarianHits-a.contrarianHits||
      (b.contrarianHits/b.contrarian)-(a.contrarianHits/a.contrarian))[0]||null;
  const twins=[...pairs].sort((a,b)=>b.sameScorePct-a.sameScorePct||b.sameScore-a.sameScore)[0]||null;

  const withMw=players.filter(p=>Array.isArray(p.matchweeks)&&p.matchweeks.length>=3).map(p=>{
    const vals=p.matchweeks.map(x=>num(x.points));
    const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
    const variance=vals.reduce((a,b)=>a+(b-avg)**2,0)/vals.length;
    return {...p,mwAvg:avg,mwVol:Math.sqrt(variance)};
  });
  const consistent=[...withMw].sort((a,b)=>a.mwVol-b.mwVol||b.mwAvg-a.mwAvg)[0]||null;
  const volatile=[...withMw].sort((a,b)=>b.mwVol-a.mwVol||b.mwAvg-a.mwAvg)[0]||null;

  return {
    mostUnanimous,mostDivided,consensusDisaster,loneWolf,exactParty,
    bestGoal,closestScore,exactConverter,contrarian,twins,consistent,volatile
  };
}

function row(title,sub,value,valueSub=''){
  return `<div class="sfRow">
    <span><b>${title}</b><small>${sub}</small></span>
    <span class="sfValue">${value}${valueSub?`<small>${valueSub}</small>`:''}</span>
  </div>`;
}

function callLabel(x){
  return x==='home'?'home win':x==='away'?'away win':'draw';
}

function build(a){
  let crowd='';
  if(a.mostUnanimous)crowd+=row(
    '📣 Most unanimous',
    `${esc(a.mostUnanimous.home_team)} v ${esc(a.mostUnanimous.away_team)} · MW${esc(a.mostUnanimous.matchweek)}`,
    `${Math.round(a.mostUnanimous.consensus)}%`,
    `H ${a.mostUnanimous.home} · D ${a.mostUnanimous.draw} · A ${a.mostUnanimous.away}`
  );
  if(a.mostDivided)crowd+=row(
    '⚖️ Most divided',
    `${esc(a.mostDivided.home_team)} v ${esc(a.mostDivided.away_team)} · MW${esc(a.mostDivided.matchweek)}`,
    `${a.mostDivided.home} / ${a.mostDivided.draw} / ${a.mostDivided.away}`,
    'home / draw / away'
  );
  if(a.consensusDisaster)crowd+=row(
    '🪤 Consensus disaster',
    `${esc(a.consensusDisaster.home_team)} v ${esc(a.consensusDisaster.away_team)} · finished ${esc(a.consensusDisaster.actual_home)}–${esc(a.consensusDisaster.actual_away)}`,
    `${Math.round(a.consensusDisaster.consensus)}%`,
    `backed ${callLabel(a.consensusDisaster.majorityCall)}`
  );
  if(a.loneWolf)crowd+=row(
    '🐺 Lone wolf',
    `${esc(a.loneWolf.home_team)} v ${esc(a.loneWolf.away_team)}`,
    '1 correct',
    `${esc(a.loneWolf.actual_home)}–${esc(a.loneWolf.actual_away)}`
  );

  let eyes='';
  if(a.bestGoal)eyes+=row(
    '⚽ Best goal reader',esc(playerName(a.bestGoal)),
    a.bestGoal.avgTotalGoalError.toFixed(2),'avg total-goal error'
  );
  if(a.closestScore)eyes+=row(
    '🎯 Closest score reader',esc(playerName(a.closestScore)),
    a.closestScore.avgScoreDistance.toFixed(2),'avg score distance'
  );
  if(a.exactConverter)eyes+=row(
    '🔬 Exact converter',esc(playerName(a.exactConverter)),
    `${Math.round(a.exactConverter.exactConversion)}%`,
    `${a.exactConverter.exacts} exacts from ${a.exactConverter.correct} correct outcomes`
  );
  if(a.exactParty)eyes+=row(
    '🎉 Exact-score party',
    `${esc(a.exactParty.home_team)} v ${esc(a.exactParty.away_team)} · ${esc(a.exactParty.actual_home)}–${esc(a.exactParty.actual_away)}`,
    `${a.exactParty.exacts}`,'exact predictions'
  );

  let people='';
  if(a.contrarian)people+=row(
    '🦹 Contrarian king',esc(playerName(a.contrarian)),
    `${a.contrarian.contrarianHits}/${a.contrarian.contrarian}`,
    `${Math.round(a.contrarian.contrarianHits*100/a.contrarian.contrarian)}% right against crowd`
  );
  if(a.twins)people+=row(
    '👯 Prediction twins',
    `${esc(playerName(a.twins.a))} + ${esc(playerName(a.twins.b))}`,
    `${Math.round(a.twins.sameScorePct)}%`,
    `${a.twins.sameScore}/${a.twins.shared} identical exact scores`
  );
  if(a.consistent)people+=row(
    '🧊 Mr Consistent',esc(playerName(a.consistent)),
    `${a.consistent.mwAvg.toFixed(1)} pts`,
    `avg MW · variation ${a.consistent.mwVol.toFixed(2)}`
  );
  if(a.volatile)people+=row(
    '🎢 Rollercoaster',esc(playerName(a.volatile)),
    `${a.volatile.mwAvg.toFixed(1)} pts`,
    `avg MW · variation ${a.volatile.mwVol.toFixed(2)}`
  );

  return `
    <div class="sfCard"><div class="sfHead"><h3>🧠 Crowd wisdom</h3><span>Where everyone agreed — and where they didn’t</span></div><div class="sfRows">${crowd}</div></div>
    <div class="sfCard"><div class="sfHead"><h3>🎯 Sharpest eyes</h3><span>Accuracy beyond ordinary points</span></div><div class="sfRows">${eyes}</div></div>
    <div class="sfCard"><div class="sfHead"><h3>🎭 League personalities</h3><span>The patterns behind your group</span></div><div class="sfRows">${people}</div></div>`;
}

function leagueRecordsCard(host){
  return [...host.querySelectorAll('.sfCard')].find(c=>
    (c.querySelector('h3')?.textContent||'').includes('League records')
  )||null;
}

async function tryRender(){
  const host=document.querySelector('.sfHost');
  if(!host)return;

  // This text exists only in the League Stats view.
  const records=leagueRecordsCard(host);
  if(!records)return;

  host.querySelectorAll('.lsiStableHost,.lsiHost,.srlHost').forEach(x=>x.remove());

  let d;
  try{d=await loadData()}
  catch(e){
    console.warn('Stats Rich League:',e);
    return;
  }
  if(!d)return;

  const currentHost=document.querySelector('.sfHost');
  const currentRecords=currentHost&&leagueRecordsCard(currentHost);
  if(!currentHost||!currentRecords||currentHost.querySelector('.srlHost'))return;

  const a=analyse(d);
  const wrap=document.createElement('div');
  wrap.className='srlHost';
  wrap.innerHTML=build(a);
  currentRecords.insertAdjacentElement('beforebegin',wrap);
}

// No fragile tab-state dependency: simply watch for League Records to exist.
const main=document.getElementById('main');
if(main){
  new MutationObserver(()=>setTimeout(tryRender,120))
    .observe(main,{childList:true,subtree:true});
}

document.addEventListener('click',()=>{
  setTimeout(tryRender,180);
  setTimeout(tryRender,700);
},true);

setInterval(tryRender,900);
setTimeout(tryRender,1000);
