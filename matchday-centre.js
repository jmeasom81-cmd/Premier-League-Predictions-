// MATCH CENTRE V2 - Fast live provider + freshness + manual refresh
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const mcSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let mcLeagueId=null;
let mcUserId=null;
let mcData=null;
let mcFetchedAt=0;
let mcLoading=false;
let mcPreviousActive=null;
let mcTimer=null;
const MC_TTL=12000;
const UK='Europe/London';

const mcEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mcNum=v=>Number(v??0);
const mcFmtTime=v=>new Intl.DateTimeFormat('en-GB',{timeZone:UK,hour:'2-digit',minute:'2-digit'}).format(new Date(v));
const mcFmtDay=v=>new Intl.DateTimeFormat('en-GB',{timeZone:UK,weekday:'short',day:'numeric',month:'short'}).format(new Date(v));

function mcCleanTeam(s){
  return String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
}
function mcCanonicalTeam(s){
  const n=mcCleanTeam(s);
  const aliases={
    'afc bournemouth':'bournemouth','bournemouth':'bournemouth',
    'brighton and hove albion':'brighton','brighton':'brighton',
    'manchester city':'mancity','man city':'mancity',
    'manchester united':'manutd','man united':'manutd','man utd':'manutd',
    'nottingham forest':'forest','nott m forest':'forest','nottm forest':'forest',
    'tottenham hotspur':'spurs','tottenham':'spurs','spurs':'spurs',
    'newcastle united':'newcastle','newcastle':'newcastle',
    'leeds united':'leeds','leeds':'leeds','coventry city':'coventry','coventry':'coventry',
    'hull city':'hull','hull':'hull','ipswich town':'ipswich','ipswich':'ipswich',
    'aston villa':'villa','villa':'villa','crystal palace':'palace','palace':'palace',
    'west ham united':'westham','west ham':'westham',
    'wolverhampton wanderers':'wolves','wolves':'wolves',
    'arsenal':'arsenal','everton':'everton','sunderland':'sunderland','brentford':'brentford',
    'liverpool':'liverpool','fulham':'fulham','chelsea':'chelsea','burnley':'burnley'
  };
  return aliases[n]||n.replace(/\b(fc|afc)\b/g,'').replace(/ /g,'');
}
const mcFixtureKey=(h,a)=>`${mcCanonicalTeam(h)}|${mcCanonicalTeam(a)}`;
const mcOutcome=(h,a)=>+h>+a?'H':+h<+a?'A':'D';
function mcPoints(p,h,a){
  if(!p||p.home_score===null||p.home_score===undefined||p.away_score===null||p.away_score===undefined)return null;
  const ph=+p.home_score,pa=+p.away_score,ah=+h,aa=+a;
  if(ph===ah&&pa===aa)return 3;
  if(mcOutcome(ph,pa)===mcOutcome(ah,aa))return 1;
  return 0;
}

function mcCss(){
  if(document.getElementById('mc-v2-css'))return;
  document.getElementById('mc-v1-css')?.remove();
  const s=document.createElement('style');
  s.id='mc-v2-css';
  s.textContent=`
    /* The old Live UI remains loaded for compatibility, but Match Centre owns the visible matchday experience. */
    #nav .plpLiveNav,.plpLiveHome{display:none!important}
    #nav.mcNavReady:not(.resultsHubReady){grid-template-columns:repeat(8,1fr)!important}
    #nav.mcNavReady.resultsHubReady{grid-template-columns:repeat(9,1fr)!important}
    #nav.mcNavReady.plpLiveNavReady:not(.resultsHubReady){grid-template-columns:repeat(8,1fr)!important}
    #nav.mcNavReady.resultsHubReady.plpLiveNavReady{grid-template-columns:repeat(9,1fr)!important}
    #nav .mcNav{color:#5a35b1}
    #nav .mcNav.active{color:#5a35b1!important}
    #nav .mcNav.livePhase{color:#c52f43!important}
    #nav .mcNav i{position:relative}
    #nav .mcNav.livePhase i::after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:#e23d4f;right:-4px;top:-1px;box-shadow:0 0 0 3px rgba(226,61,79,.12);animation:mcPulse 1.3s infinite}
    @keyframes mcPulse{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.25);opacity:1}}

    .mcHome{background:linear-gradient(135deg,rgba(246,242,255,.97),rgba(255,255,255,.95))!important;border:1px solid #d9cef1!important;position:relative;overflow:hidden}
    .mcHome.live{background:linear-gradient(135deg,rgba(255,239,242,.97),rgba(255,255,255,.95))!important;border-color:#efbec6!important}
    .mcHomeTop{display:flex;justify-content:space-between;gap:8px;align-items:center}.mcHomeTitle{font-size:16px;font-weight:950;color:#4b269d}.mcHome.live .mcHomeTitle{color:#9b2535}.mcHomeText{font-size:11px;color:#5d5768;line-height:1.45;margin:7px 0 10px}.mcHomeBtn{border:0;border-radius:11px;padding:9px 11px;background:#5a35b1;color:#fff;font-size:11px;font-weight:950}.mcHome.live .mcHomeBtn{background:#c93448}

    .mcOverlay{position:fixed;inset:0;z-index:9800;background:#f6f6fb;overflow:auto;padding-bottom:30px}.mcShell{max-width:760px;margin:auto;min-height:100vh}.mcHead{background:linear-gradient(135deg,#351153,#171044 68%,#4d1a55);color:#fff;padding:calc(15px + env(safe-area-inset-top)) 14px 20px;border-radius:0 0 28px 28px;position:sticky;top:0;z-index:5;box-shadow:0 8px 25px rgba(25,18,65,.18)}.mcHead.live{background:linear-gradient(135deg,#401249,#171044 65%,#7b1d35)}.mcHeadTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.mcEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.82;display:flex;gap:7px;align-items:center}.mcDot{width:7px;height:7px;border-radius:50%;background:#bda7f3}.mcHead.live .mcDot{background:#ff6070;box-shadow:0 0 0 4px rgba(255,96,112,.12);animation:mcPulse 1.3s infinite}.mcTitle{font-size:24px;line-height:1.05;font-weight:950;margin-top:6px}.mcSub{font-size:11px;opacity:.76;margin-top:4px;line-height:1.35}.mcClose{border:0;border-radius:10px;padding:8px 11px;background:rgba(255,255,255,.14);color:#fff;font-weight:950}.mcBody{padding:12px}.mcLoading,.mcEmpty{background:#fff;border:1px solid #e8e7ef;border-radius:18px;padding:24px 17px;text-align:center;color:#716f82;font-size:12px;line-height:1.5}

    .mcSectionTitle{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin:15px 2px 8px}.mcSectionTitle h2{margin:0;font-size:16px}.mcSectionTitle span{font-size:9px;color:#7d7988;font-weight:850}
    .mcGame{background:#fff;border:1px solid #e8e7ef;border-radius:19px;padding:14px;margin-bottom:11px;box-shadow:0 8px 24px rgba(25,18,65,.055)}.mcGameTop{display:flex;justify-content:space-between;gap:8px;align-items:center}.mcMeta{font-size:8.5px;color:#716f82;font-weight:900;text-transform:uppercase}.mcPill{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:950}.mcPill.locked{background:#eee9fb;color:#5a35b1}.mcPill.live{background:#fde9ec;color:#b52c3c}.mcPill.confirming{background:#fff3c9;color:#7b5a00}.mcPill.final{background:#e5f8f2;color:#08775c}.mcPill.live::before{content:"";width:6px;height:6px;border-radius:50%;background:#d23545;animation:mcPulse 1.3s infinite}
    .mcFixture{display:grid;grid-template-columns:1fr auto 1fr;gap:9px;align-items:center;margin:12px 0 9px}.mcTeam{font-size:13px;font-weight:950;line-height:1.2}.mcTeam.away{text-align:right}.mcScoreWrap{text-align:center;min-width:68px}.mcScore{font-size:31px;font-weight:950;white-space:nowrap;line-height:1}.mcKickoff{font-size:20px;font-weight:950;white-space:nowrap;line-height:1}.mcScoreSub{font-size:8px;color:#817c8c;font-weight:900;margin-top:4px;text-transform:uppercase}
    .mcMine{display:flex;justify-content:space-between;align-items:center;gap:10px;border-radius:13px;padding:10px 11px;background:#f7f6fb;margin-top:8px}.mcMineText{font-size:10px;color:#504b5e;font-weight:800;line-height:1.35}.mcMineText b{display:block;color:#241153;font-size:11px;margin-bottom:2px}.mcPts{border-radius:999px;padding:6px 8px;font-size:9px;font-weight:950;white-space:nowrap}.mcPts.exact{background:#dff9f1;color:#08775c}.mcPts.one{background:#fff3c9;color:#7b5a00}.mcPts.zero{background:#fde9ec;color:#b52c3c}.mcPts.none{background:#ecebf1;color:#716f82}
    .mcMini{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.mcMiniStat{border-radius:11px;background:#f7f6fb;padding:8px 5px;text-align:center}.mcMiniStat b{display:block;font-size:17px}.mcMiniStat span{display:block;font-size:7.5px;color:#716f82;text-transform:uppercase;font-weight:850}
    .mcDetails{margin-top:9px;border:1px solid #eceaf2;border-radius:13px;overflow:hidden}.mcDetails summary{list-style:none;cursor:pointer;padding:10px 11px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:10px;font-weight:950;background:#faf9fd;color:#4f4760}.mcDetails summary::-webkit-details-marker{display:none}.mcDetails summary::after{content:"›";font-size:17px;color:#716f82;transition:transform .15s}.mcDetails[open] summary::after{transform:rotate(90deg)}.mcPeople{border-top:1px solid #eceaf2}.mcPerson{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:9px 10px;border-top:1px solid #f0eff4}.mcPerson:first-child{border-top:0}.mcPersonName{font-size:10.5px;font-weight:950;color:#2f2940;min-width:0}.mcPersonName small{display:block;font-size:8px;color:#827e8d;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcPick{font-size:10px;font-weight:950;color:#4b4658;white-space:nowrap}

    .mcBreakdown{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.mcBreak{border-radius:11px;padding:9px 5px;text-align:center}.mcBreak.home{background:#e7f5ff;color:#176b96}.mcBreak.draw{background:#f2eff8;color:#62547c}.mcBreak.away{background:#fff0ea;color:#9a4b22}.mcBreak b{display:block;font-size:18px}.mcBreak span{font-size:7.5px;text-transform:uppercase;font-weight:900}.mcPopular{font-size:9.5px;color:#716f82;margin-top:8px;text-align:center}

    .mcTable{background:#fff;border:1px solid #ded8eb;border-radius:19px;padding:13px;margin-top:14px;box-shadow:0 8px 24px rgba(25,18,65,.06)}.mcTableHead{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:8px}.mcTableHead h2{margin:0;font-size:17px}.mcTableHead span{font-size:8.5px;color:#7d7988;text-align:right;font-weight:850}.mcTable table{width:100%;border-collapse:collapse}.mcTable th{font-size:8px;text-transform:uppercase;color:#817d8d;text-align:left;padding:7px 4px;border-bottom:1px solid #ece9f1}.mcTable th.num,.mcTable td.num{text-align:right}.mcTable td{font-size:10px;padding:8px 4px;border-bottom:1px solid #f0eef4;vertical-align:middle}.mcTable tr:last-child td{border-bottom:0}.mcTable tr.me{background:#f1ecff}.mcTeamCell{font-weight:900;max-width:160px}.mcTeamCell small{display:block;font-size:7.5px;color:#858190;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcLiveAdd{font-size:8px;font-weight:950;color:#08775c}.mcMove{font-size:9px;font-weight:950;white-space:nowrap}.mcMove.up{color:#08775c}.mcMove.down{color:#b52c3c}.mcMove.same{color:#817d8d}.mcTableNote{font-size:9px;color:#7d7988;line-height:1.4;margin-top:8px}

    .mcFreshBar{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#fff;border:1px solid #e5e2ec;border-radius:14px;padding:9px 10px;margin:0 0 10px;box-shadow:0 5px 16px rgba(25,18,65,.035)}
    .mcFreshBar.fast{border-color:#b9e8d9;background:#f2fff9}.mcFreshBar.fallback{border-color:#f1d99b;background:#fffaf0}
    .mcFreshInfo{min-width:0}.mcFreshInfo b{display:block;font-size:10px;color:#342e43}.mcFreshInfo span{display:block;font-size:8px;color:#7d7988;line-height:1.35;margin-top:2px}
    .mcRefreshBtn{border:0;border-radius:10px;padding:8px 9px;background:#eee9fb;color:#52319f;font-size:9px;font-weight:950;white-space:nowrap}.mcRefreshBtn:disabled{opacity:.55}

    .mcFooter{text-align:center;color:#858293;font-size:8.5px;line-height:1.45;margin:12px 0 16px}
    @media(max-width:520px){#nav.mcNavReady button{font-size:6.1px!important}#nav.mcNavReady button i{font-size:15px!important}.mcBody{padding:10px}.mcTitle{font-size:22px}.mcTeam{font-size:12px}.mcScore{font-size:28px}.mcTeamCell{max-width:130px}.mcTable td{font-size:9.5px}}
  `;
  document.head.appendChild(s);
}

async function mcContext(){
  if(mcLeagueId&&mcUserId)return true;
  try{
    const {data:{session}}=await mcSb.auth.getSession();
    if(!session)return false;
    mcUserId=session.user.id;
    const {data,error}=await mcSb.from('league_members').select('league_id,status,joined_at').eq('user_id',mcUserId).eq('status','active').order('joined_at',{ascending:false}).limit(1);
    if(error)throw error;
    if(!data?.length)return false;
    mcLeagueId=data[0].league_id;
    return true;
  }catch(e){console.warn('Match Centre context:',e);return false}
}

function mcAddAiToHistory(history,aiPicks){
  const byFixture=new Map();
  for(const p of aiPicks||[]){
    const id=String(p.fixture_id||'');
    if(!byFixture.has(id))byFixture.set(id,[]);
    byFixture.get(id).push({...p,user_id:null,entrant_type:'ai',display_name:p.manager_name});
  }
  return (history||[]).map(h=>{
    const ai=byFixture.get(String(h.fixture_id))||[];
    return {...h,predictions:[...(h.predictions||[]),...ai]};
  });
}

function mcBuildPhases(feed,history){
  const now=Date.now();
  const byPair=new Map((history||[]).map(h=>[mcFixtureKey(h.home_team,h.away_team),h]));
  const byId=new Map((history||[]).map(h=>[String(h.fixture_id),h]));
  const rows=[];
  const used=new Set();

  for(const f of feed.live||[]){
    const h=byPair.get(mcFixtureKey(f.home_team,f.away_team))||null;
    const id=String(h?.fixture_id||`feed:${f.external_fixture_id}`);
    if(used.has(id))continue;used.add(id);
    if(h?.result_home_score!==null&&h?.result_home_score!==undefined){
      rows.push({phase:'final',...f,appFixture:h,home_score:h.result_home_score,away_score:h.result_away_score});
    }else{
      rows.push({phase:'live',...f,appFixture:h});
    }
  }

  for(const f of feed.recent_final||[]){
    const h=byPair.get(mcFixtureKey(f.home_team,f.away_team))||null;
    const id=String(h?.fixture_id||`feed:${f.external_fixture_id}`);
    if(used.has(id))continue;used.add(id);
    const confirmed=h?.result_home_score!==null&&h?.result_home_score!==undefined;
    rows.push({phase:confirmed?'final':'confirming',...f,appFixture:h,home_score:confirmed?h.result_home_score:f.home_score,away_score:confirmed?h.result_away_score:f.away_score});
  }

  for(const h of history||[]){
    const id=String(h.fixture_id);
    if(used.has(id))continue;
    const ko=new Date(h.kickoff_at).getTime();
    const lock=new Date(h.prediction_lock_at).getTime();
    const hasResult=h.result_home_score!==null&&h.result_home_score!==undefined;
    const age=now-ko;
    if(!Number.isFinite(ko)||!Number.isFinite(lock))continue;

    if(!hasResult&&lock<=now&&ko>now){
      rows.push({phase:'locked',appFixture:h,home_team:h.home_team,away_team:h.away_team,matchweek:h.matchweek,kickoff_at:h.kickoff_at});
      used.add(id);
    }else if(!hasResult&&ko<=now&&age<4*60*60*1000){
      rows.push({phase:age>=105*60*1000?'confirming':'syncing',appFixture:h,home_team:h.home_team,away_team:h.away_team,matchweek:h.matchweek,kickoff_at:h.kickoff_at,home_score:null,away_score:null});
      used.add(id);
    }else if(hasResult&&age>=0&&age<4*60*60*1000){
      rows.push({phase:'final',appFixture:h,home_team:h.home_team,away_team:h.away_team,matchweek:h.matchweek,kickoff_at:h.kickoff_at,home_score:h.result_home_score,away_score:h.result_away_score});
      used.add(id);
    }
  }

  const rank={live:0,syncing:1,confirming:2,locked:3,final:4};
  rows.sort((a,b)=>(rank[a.phase]??9)-(rank[b.phase]??9)||new Date(a.kickoff_at)-new Date(b.kickoff_at));
  return rows;
}

async function mcFetch(force=false,providerForce=false){
  if(mcLoading)return mcData;
  if(!force&&mcData&&Date.now()-mcFetchedAt<MC_TTL)return mcData;
  if(!await mcContext())return null;
  mcLoading=true;
  try{
    const [feedSet,histSet,ctxSet]=await Promise.allSettled([
      mcSb.functions.invoke('live-score-feed',{body:{force:providerForce}}),
      mcSb.rpc('get_league_history',{p_league_id:mcLeagueId,p_limit:200}),
      mcSb.rpc('get_match_centre_context',{p_league_id:mcLeagueId})
    ]);
    let feed={ok:false,live:[],recent_final:[]};
    if(feedSet.status==='fulfilled'&&!feedSet.value.error&&feedSet.value.data?.ok===true)feed=feedSet.value.data;
    if(histSet.status!=='fulfilled'||histSet.value.error)throw(histSet.status==='fulfilled'?histSet.value.error:new Error('History unavailable'));
    if(ctxSet.status!=='fulfilled'||ctxSet.value.error)throw(ctxSet.status==='fulfilled'?ctxSet.value.error:new Error('Table unavailable'));
    const ctx=ctxSet.value.data||{};
    const history=mcAddAiToHistory(histSet.value.data||[],ctx.ai_picks||[]);
    const rows=mcBuildPhases(feed,history);
    mcData={feed,history,rows,standings:ctx.standings||[],current_user_id:ctx.current_user_id||mcUserId,fetched_at:feed.fetched_at||new Date().toISOString()};
    mcFetchedAt=Date.now();
    return mcData;
  }finally{mcLoading=false}
}

function mcHasScore(row){return row.home_score!==null&&row.home_score!==undefined&&row.away_score!==null&&row.away_score!==undefined}
function mcPreds(row){return (row.appFixture?.predictions||[]).filter(p=>p.home_score!==null&&p.home_score!==undefined&&p.away_score!==null&&p.away_score!==undefined)}
function mcMine(row){return mcPreds(row).find(p=>String(p.user_id||p.entrant_id)===String(mcUserId))||null}
function mcStatus(row){
  if(row.phase==='locked')return {label:'🔒 Locked In',cls:'locked'};
  if(row.phase==='live')return {label:row.minutes?`${row.minutes>=90?'90+':row.minutes}′ LIVE`:'LIVE',cls:'live'};
  if(row.phase==='syncing')return {label:'🔴 Live · syncing',cls:'live'};
  if(row.phase==='confirming')return {label:'🏁 FT · Confirming',cls:'confirming'};
  return {label:'✓ Final',cls:'final'};
}
function mcPointsPill(pts,phase){
  if(pts===null)return`<span class="mcPts none">No pick</span>`;
  const cls=pts===3?'exact':pts===1?'one':'zero';
  if(phase==='final')return`<span class="mcPts ${cls}">${pts} pt${pts===1?'':'s'}</span>`;
  return`<span class="mcPts ${cls}">${pts} pt${pts===1?'':'s'} if it ends now</span>`;
}
function mcBreakdown(row){
  const ps=mcPreds(row);
  let home=0,draw=0,away=0;
  const scores=new Map();
  for(const p of ps){
    const o=mcOutcome(p.home_score,p.away_score);if(o==='H')home++;else if(o==='D')draw++;else away++;
    const k=`${p.home_score}–${p.away_score}`;scores.set(k,(scores.get(k)||0)+1);
  }
  const popular=[...scores.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]||null;
  return {ps,home,draw,away,popular};
}
function mcPeople(row){
  const ps=mcPreds(row).map(p=>({...p,nowPoints:mcHasScore(row)?mcPoints(p,row.home_score,row.away_score):null}));
  if(mcHasScore(row))ps.sort((a,b)=>(b.nowPoints??-1)-(a.nowPoints??-1)||String(a.team_name||a.display_name).localeCompare(String(b.team_name||b.display_name)));
  else ps.sort((a,b)=>String(a.team_name||a.display_name).localeCompare(String(b.team_name||b.display_name)));
  return ps;
}

function mcGame(row){
  const h=row.appFixture;
  const s=mcStatus(row);
  const mine=mcMine(row);
  const myPick=mine?`${mine.home_score}–${mine.away_score}`:null;
  const myPts=mcHasScore(row)?(row.phase==='final'&&mine?.points!==null&&mine?.points!==undefined?Number(mine.points):mcPoints(mine,row.home_score,row.away_score)):null;
  const people=mcPeople(row);
  const b=mcBreakdown(row);
  const scored=mcHasScore(row)?people.filter(p=>p.nowPoints!==null):[];
  const exact=scored.filter(p=>p.nowPoints===3).length,scoring=scored.filter(p=>p.nowPoints>0).length,zero=scored.filter(p=>p.nowPoints===0).length;
  const centre=row.phase==='locked'
    ?`<div class="mcKickoff">${mcFmtTime(row.kickoff_at)}</div><div class="mcScoreSub">${mcEsc(mcFmtDay(row.kickoff_at))}</div>`
    :mcHasScore(row)?`<div class="mcScore">${mcEsc(row.home_score)}–${mcEsc(row.away_score)}</div><div class="mcScoreSub">${row.phase==='final'?'Final score':row.phase==='confirming'?'Awaiting app confirmation':'Current score'}</div>`
    :`<div class="mcKickoff">—</div><div class="mcScoreSub">Score syncing</div>`;

  return `<section class="mcGame">
    <div class="mcGameTop"><div class="mcMeta">MW${mcEsc(row.matchweek||h?.matchweek||'')} · ${mcEsc(mcFmtDay(row.kickoff_at))}</div><div class="mcPill ${s.cls}">${mcEsc(s.label)}</div></div>
    <div class="mcFixture"><div class="mcTeam">${mcEsc(h?.home_team||row.home_team)}</div><div class="mcScoreWrap">${centre}</div><div class="mcTeam away">${mcEsc(h?.away_team||row.away_team)}</div></div>
    <div class="mcMine"><div class="mcMineText"><b>Your prediction</b>${myPick?mcEsc(myPick):'No prediction recorded for this match'}${row.phase==='locked'?'<br><span style="font-size:8px;color:#817d8d">Locked and now visible to the league</span>':''}</div>${row.phase==='locked'?`<span class="mcPts none">Locked</span>`:mcPointsPill(myPts,row.phase)}</div>
    ${row.phase==='locked'?`<div class="mcBreakdown"><div class="mcBreak home"><b>${b.home}</b><span>Home win</span></div><div class="mcBreak draw"><b>${b.draw}</b><span>Draw</span></div><div class="mcBreak away"><b>${b.away}</b><span>Away win</span></div></div>${b.popular?`<div class="mcPopular">Most popular exact score: <b>${mcEsc(b.popular[0])}</b> · ${b.popular[1]} pick${b.popular[1]===1?'':'s'}</div>`:''}`:mcHasScore(row)?`<div class="mcMini"><div class="mcMiniStat"><b>${exact}</b><span>Exact now</span></div><div class="mcMiniStat"><b>${scoring}</b><span>Scoring</span></div><div class="mcMiniStat"><b>${zero}</b><span>Missing out</span></div></div>`:''}
    <details class="mcDetails"><summary>${row.phase==='locked'?'All locked predictions':'League detail'} · ${people.length} pick${people.length===1?'':'s'}</summary><div class="mcPeople">${people.length?people.map(p=>`<div class="mcPerson"><div class="mcPersonName">${mcEsc(p.badge||'⚽')} ${mcEsc(p.team_name||p.display_name||'Player')}<small>${p.entrant_type==='ai'?'AI · ':''}${mcEsc(p.display_name||p.manager_name||'')}</small></div><div class="mcPick">${mcEsc(p.home_score)}–${mcEsc(p.away_score)}</div>${row.phase==='locked'?'<span class="mcPts none">Locked</span>':mcPointsPill(row.phase==='final'&&p.points!==null&&p.points!==undefined?Number(p.points):p.nowPoints,row.phase)}</div>`).join(''):`<div class="mcPerson"><div class="mcPersonName">No predictions recorded</div></div>`}</div></details>
  </section>`;
}

function mcBaselineSorted(standings){
  return [...standings].sort((a,b)=>mcNum(b.total_points)-mcNum(a.total_points)||mcNum(b.exact_scores)-mcNum(a.exact_scores)||mcNum(b.correct_outcomes)-mcNum(a.correct_outcomes)||String(a.team_name||'').localeCompare(String(b.team_name||'')));
}
function mcProjectedTable(data){
  const active=(data.rows||[]).filter(r=>['live','confirming'].includes(r.phase)&&mcHasScore(r)&&r.appFixture&&!(r.appFixture.result_home_score!==null&&r.appFixture.result_home_score!==undefined));
  if(!active.length)return'';
  const base=mcBaselineSorted(data.standings||[]);
  const basePos=new Map(base.map((x,i)=>[String(x.entrant_id),i+1]));
  const map=new Map(base.map(x=>[String(x.entrant_id),{...x,live_points:0,live_exacts:0,live_outcomes:0}]));
  for(const row of active){
    for(const p of mcPreds(row)){
      const id=String(p.user_id||p.entrant_id||'');
      if(!id||!map.has(id))continue;
      const pts=mcPoints(p,row.home_score,row.away_score);if(pts===null)continue;
      const x=map.get(id);x.live_points+=pts;if(pts===3)x.live_exacts++;else if(pts===1)x.live_outcomes++;
    }
  }
  const projected=[...map.values()].map(x=>({...x,projected_points:mcNum(x.total_points)+x.live_points,projected_exacts:mcNum(x.exact_scores)+x.live_exacts,projected_outcomes:mcNum(x.correct_outcomes)+x.live_outcomes})).sort((a,b)=>b.projected_points-a.projected_points||b.projected_exacts-a.projected_exacts||b.projected_outcomes-a.projected_outcomes||String(a.team_name||'').localeCompare(String(b.team_name||'')));
  return `<section class="mcTable"><div class="mcTableHead"><h2>🔴 Live Table — As It Stands</h2><span>If every live/confirming score<br>stayed exactly as it is</span></div><table><thead><tr><th>#</th><th>Team</th><th class="num">Pts</th><th class="num">Live</th><th class="num">Move</th></tr></thead><tbody>${projected.map((x,i)=>{const pos=i+1,bp=basePos.get(String(x.entrant_id))||pos,mv=bp-pos,me=String(x.entrant_id)===String(data.current_user_id),mcls=mv>0?'up':mv<0?'down':'same',mtxt=mv>0?`↑${mv}`:mv<0?`↓${Math.abs(mv)}`:'—';return`<tr class="${me?'me':''}"><td><b>${pos}</b></td><td class="mcTeamCell">${mcEsc(x.badge||'⚽')} ${mcEsc(x.team_name||x.manager_name||'Team')}<small>${x.entrant_type==='ai'?'AI · ':''}${mcEsc(x.manager_name||'')}${me?' · YOU':''}</small></td><td class="num"><b>${x.projected_points}</b></td><td class="num"><span class="mcLiveAdd">+${x.live_points}</span></td><td class="num"><span class="mcMove ${mcls}">${mtxt}</span></td></tr>`}).join('')}</tbody></table><div class="mcTableNote">Provisional only. The official table is unchanged until results are confirmed. Exact scores and correct-outcome tie-breakers are also projected.</div></section>`;
}


function mcProviderBar(d){
  const f=d?.feed||{};
  const src=f.source_label|| (f.source==='api-football'?'API-Football':'Premier League/FPL');
  const ts=f.source_updated_at||f.fetched_at||d?.fetched_at;
  let stamp='just now';
  if(ts){
    try{stamp=new Intl.DateTimeFormat('en-GB',{timeZone:UK,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(ts))}catch{}
  }
  const fast=f.source==='api-football';
  const quota=(f.api_quota_remaining!==null&&f.api_quota_remaining!==undefined)
    ?` · ${mcEsc(f.api_quota_remaining)} API calls left today`
    :'';
  const detail=!fast&&f.source_detail?` · ${mcEsc(f.source_detail)}`:'';
  return `<div class="mcFreshBar ${fast?'fast':'fallback'}"><div class="mcFreshInfo"><b>${fast?'⚡':'↻'} ${mcEsc(src)}</b><span>Score source · updated ${mcEsc(stamp)}${quota}${detail}</span></div><button type="button" class="mcRefreshBtn" data-mc-refresh>↻ Refresh now</button></div>`;
}

function mcHeaderState(rows){
  if(rows.some(r=>r.phase==='live'||r.phase==='syncing'))return {eyebrow:'Live now',title:'Match Centre',sub:'Current scores · sealed picks · provisional points · live table',live:true};
  if(rows.some(r=>r.phase==='confirming'))return {eyebrow:'Full time',title:'Match Centre',sub:'Final whistle reached · waiting for official result confirmation',live:true};
  if(rows.some(r=>r.phase==='locked'))return {eyebrow:'Predictions locked',title:'Match Centre',sub:'Sealed picks are now visible before kickoff',live:false};
  return {eyebrow:'Recently final',title:'Match Centre',sub:'Confirmed results and settled prediction points',live:false};
}
function mcSection(rows,phase,title,sub){
  const r=rows.filter(x=>phase.includes(x.phase));if(!r.length)return'';
  return `<div class="mcSectionTitle"><h2>${title}</h2><span>${sub||`${r.length} match${r.length===1?'':'es'}`}</span></div>${r.map(mcGame).join('')}`;
}
async function mcRender(force=false,providerForce=false){
  const ov=document.querySelector('.mcOverlay');if(!ov)return;
  const body=ov.querySelector('.mcBody');if(!body)return;
  if(force)body.innerHTML='<div class="mcLoading">Building Match Centre…</div>';
  try{
    const d=await mcFetch(force,providerForce);if(!d)throw Error('Match Centre not ready');
    const rows=d.rows||[];
    const hs=mcHeaderState(rows);
    const head=ov.querySelector('.mcHead');head?.classList.toggle('live',hs.live);
    if(head){head.querySelector('.mcEyebrow').innerHTML=`<span class="mcDot"></span>${mcEsc(hs.eyebrow)}`;head.querySelector('.mcTitle').textContent=hs.title;head.querySelector('.mcSub').textContent=hs.sub}
    if(!rows.length){body.innerHTML='<div class="mcEmpty"><b>Nothing is locked or live right now.</b><br>Match Centre appears automatically from the four-hour prediction deadline through the live match and recent final result.</div>';return}
    body.innerHTML=`${mcProviderBar(d)}${mcSection(rows,['live','syncing'],'🔴 Live Now','Scores refresh automatically')}${mcSection(rows,['confirming'],'🏁 FT · Confirming','Provider says finished')}${mcSection(rows,['locked'],'🔒 Locked In','Predictions are sealed')}${mcProjectedTable(d)}${mcSection(rows,['final'],'✓ Recently Final','Officially confirmed')}<div class="mcFooter">Match Centre checks for fresh data about every 15 seconds while open. The score-source timestamp above shows when the provider last changed. Locked predictions are shown only after the deadline. Provisional points are never written to the official table.</div>`;
    const refresh=body.querySelector('[data-mc-refresh]');
    if(refresh)refresh.onclick=async()=>{refresh.disabled=true;refresh.textContent='Refreshing…';await mcRender(true,true)};
  }catch(e){console.warn('Match Centre render:',e);body.innerHTML='<div class="mcEmpty"><b>Match Centre is temporarily unavailable.</b><br>Your predictions and official results are unaffected. We’ll retry automatically.</div>'}
}

async function mcOpen(){
  mcCss();document.querySelector('.mcOverlay')?.remove();document.querySelector('.lcOverlay')?.remove();document.querySelector('.rhOverlay')?.remove();
  const nav=document.getElementById('nav');mcPreviousActive=nav?.querySelector('button.active:not(.mcNav)')||null;if(nav){nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));nav.querySelector('.mcNav')?.classList.add('active')}
  const ov=document.createElement('div');ov.className='mcOverlay';ov.innerHTML='<div class="mcShell"><div class="mcHead"><div class="mcHeadTop"><div><div class="mcEyebrow"><span class="mcDot"></span>Match Centre</div><div class="mcTitle">Match Centre</div><div class="mcSub">Locked picks · live scores · as-it-stands table</div></div><button class="mcClose" type="button">✕</button></div></div><div class="mcBody"><div class="mcLoading">Building Match Centre…</div></div></div>';
  ov.querySelector('.mcClose').onclick=mcClose;document.body.appendChild(ov);document.body.style.overflow='hidden';await mcRender(true,false);
}
function mcClose(){
  document.querySelector('.mcOverlay')?.remove();document.body.style.overflow='';const nav=document.getElementById('nav');if(nav){nav.querySelector('.mcNav')?.classList.remove('active');if(mcPreviousActive&&document.contains(mcPreviousActive))mcPreviousActive.classList.add('active');else nav.querySelector('button[data-v="home"]')?.classList.add('active')}mcPreviousActive=null;
}

function mcEnsureNav(data){
  const nav=document.getElementById('nav');if(!nav)return;
  const rows=data?.rows||[];const show=rows.length>0;let b=nav.querySelector('.mcNav');
  if(!show){nav.classList.remove('mcNavReady');b?.remove();return}
  nav.classList.add('mcNavReady');
  if(!b){b=document.createElement('button');b.className='mcNav';b.innerHTML='<i>⚽</i>Match';b.onclick=e=>{e.preventDefault();e.stopPropagation();mcOpen()};const ai=nav.querySelector('button[data-v="ai"]');nav.insertBefore(b,ai||nav.lastElementChild)}
  const live=rows.some(r=>['live','syncing','confirming'].includes(r.phase));b.classList.toggle('livePhase',live);b.title='Match Centre';
}
function mcHome(data){
  const main=document.getElementById('main');if(!main)return;let card=main.querySelector('.mcHome');const home=!!document.querySelector('#nav button[data-v="home"].active');const rows=data?.rows||[];
  if(!home||!rows.length){card?.remove();return}
  const live=rows.filter(r=>['live','syncing'].includes(r.phase)).length,locked=rows.filter(r=>r.phase==='locked').length,confirm=rows.filter(r=>r.phase==='confirming').length;
  let title='Match Centre',text='';if(live)text=`${live} match${live===1?' is':'es are'} live now. See sealed picks, provisional points and the league table as it stands.`;else if(confirm)text=`${confirm} match${confirm===1?' has':'es have'} reached full time and ${confirm===1?'is':'are'} awaiting official confirmation.`;else text=`${locked} fixture${locked===1?' has':'s have'} locked. Everyone’s sealed predictions are now visible before kickoff.`;
  if(!card){card=document.createElement('div');card.className='card mcHome';const latest=main.querySelector('.rhLatestHome'),status=main.querySelector('.predictionStatus.plpEnhancer');if(latest)latest.insertAdjacentElement('beforebegin',card);else if(status)status.insertAdjacentElement('afterend',card);else main.prepend(card)}
  card.classList.toggle('live',live>0||confirm>0);card.innerHTML=`<div class="mcHomeTop"><div class="mcHomeTitle">⚽ ${title}</div><span class="tiny">${live?'LIVE':confirm?'FT':locked?'LOCKED':''}</span></div><div class="mcHomeText">${mcEsc(text)}</div><button class="mcHomeBtn" type="button">Open Match Centre</button>`;card.querySelector('.mcHomeBtn').onclick=mcOpen;
}

async function mcSync(force=false,providerForce=false){
  try{const d=await mcFetch(force,providerForce);if(!d)return;mcEnsureNav(d);mcHome(d);if(document.querySelector('.mcOverlay'))await mcRender(false,false)}catch(e){console.warn('Match Centre sync:',e)}
}
function mcSchedule(){clearTimeout(mcTimer);mcTimer=setTimeout(()=>{mcCss();if(mcData){mcEnsureNav(mcData);mcHome(mcData)}},120)}

mcCss();window.openPLPMatchCentre=mcOpen;window.closePLPMatchCentre=mcClose;
window.addEventListener('focus',()=>mcSync(true,false));
const mcMain=document.getElementById('main');if(mcMain)new MutationObserver(mcSchedule).observe(mcMain,{childList:true,subtree:true});
const mcNav=document.getElementById('nav');if(mcNav)new MutationObserver(()=>setTimeout(()=>{if(mcData){mcEnsureNav(mcData);mcHome(mcData)}},70)).observe(mcNav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
document.addEventListener('click',e=>{if(e.target.closest('#nav button[data-v]')){document.querySelector('.mcOverlay')?.remove();document.body.style.overflow='';mcPreviousActive=null;setTimeout(mcSchedule,90)}},true);
setInterval(()=>mcSync(true,false),15000);
setTimeout(()=>mcSync(true,false),600);
