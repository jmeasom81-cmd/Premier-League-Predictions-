// MATCH CENTRE V3.2 - fast active-window matchday experience
// History is the reliable base. Live feed + projected table are optional enhancements.
// V3.2 uses a lightweight active-match RPC and parallel enhancement calls.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const mc3Sb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const MC3_UK='Europe/London';
const MC3_TTL=12000;

let mc3LeagueId=null;
let mc3UserId=null;
let mc3Data=null;
let mc3FetchedAt=0;
let mc3FetchPromise=null;
let mc3PreviousActive=null;
let mc3Timer=null;

const mc3Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const mc3Num=v=>Number(v??0);

function mc3SafeDate(v,opts){
  try{
    const d=new Date(v);
    if(!Number.isFinite(d.getTime()))return '—';
    return new Intl.DateTimeFormat('en-GB',{timeZone:MC3_UK,...opts}).format(d);
  }catch{return '—'}
}
const mc3FmtTime=v=>mc3SafeDate(v,{hour:'2-digit',minute:'2-digit'});
const mc3FmtDay=v=>mc3SafeDate(v,{weekday:'short',day:'numeric',month:'short'});

function mc3CleanTeam(s){
  return String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
}
function mc3CanonicalTeam(s){
  const n=mc3CleanTeam(s);
  const aliases={
    'afc bournemouth':'bournemouth','bournemouth':'bournemouth',
    'brighton and hove albion':'brighton','brighton':'brighton',
    'manchester city':'mancity','man city':'mancity',
    'manchester united':'manutd','man united':'manutd','man utd':'manutd',
    'nottingham forest':'forest','nott m forest':'forest','nottm forest':'forest',
    'tottenham hotspur':'spurs','tottenham':'spurs','spurs':'spurs',
    'newcastle united':'newcastle','newcastle':'newcastle',
    'leeds united':'leeds','leeds':'leeds',
    'coventry city':'coventry','coventry':'coventry',
    'hull city':'hull','hull':'hull',
    'ipswich town':'ipswich','ipswich':'ipswich',
    'aston villa':'villa','villa':'villa',
    'crystal palace':'palace','palace':'palace',
    'west ham united':'westham','west ham':'westham',
    'wolverhampton wanderers':'wolves','wolves':'wolves',
    'arsenal':'arsenal','everton':'everton','sunderland':'sunderland',
    'brentford':'brentford','liverpool':'liverpool','fulham':'fulham',
    'chelsea':'chelsea','burnley':'burnley'
  };
  return aliases[n]||n.replace(/\b(fc|afc)\b/g,'').replace(/ /g,'');
}
const mc3FixtureKey=(h,a)=>`${mc3CanonicalTeam(h)}|${mc3CanonicalTeam(a)}`;
const mc3Outcome=(h,a)=>+h>+a?'H':+h<+a?'A':'D';

function mc3Points(p,h,a){
  if(!p||p.home_score==null||p.away_score==null||h==null||a==null)return null;
  const ph=+p.home_score,pa=+p.away_score,ah=+h,aa=+a;
  if(ph===ah&&pa===aa)return 3;
  return mc3Outcome(ph,pa)===mc3Outcome(ah,aa)?1:0;
}

function mc3Css(){
  if(document.getElementById('mc3-css'))return;
  const s=document.createElement('style');
  s.id='mc3-css';
  s.textContent=`
    #nav .plpLiveNav,.plpLiveHome{display:none!important}
    #nav.mcNavReady:not(.resultsHubReady){grid-template-columns:repeat(8,1fr)!important}
    #nav.mcNavReady.resultsHubReady{grid-template-columns:repeat(9,1fr)!important}
    #nav .mcNav{color:#5a35b1}
    #nav .mcNav.active{color:#5a35b1!important}
    #nav .mcNav.livePhase{color:#c52f43!important}
    #nav .mcNav i{position:relative}
    #nav .mcNav.livePhase i::after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:#e23d4f;right:-4px;top:-1px;box-shadow:0 0 0 3px rgba(226,61,79,.12);animation:mc3Pulse 1.3s infinite}
    @keyframes mc3Pulse{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.25);opacity:1}}

    .mc3Overlay{position:fixed;inset:0;z-index:9900;background:#f6f6fb;overflow:auto;padding-bottom:30px}
    .mc3Shell{max-width:760px;margin:auto;min-height:100vh}
    .mc3Head{background:linear-gradient(135deg,#351153,#171044 68%,#4d1a55);color:#fff;padding:calc(15px + env(safe-area-inset-top)) 14px 20px;border-radius:0 0 28px 28px;position:sticky;top:0;z-index:5;box-shadow:0 8px 25px rgba(25,18,65,.18)}
    .mc3Head.live{background:linear-gradient(135deg,#401249,#171044 65%,#7b1d35)}
    .mc3HeadTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    .mc3Eyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.82;display:flex;gap:7px;align-items:center}
    .mc3Dot{width:7px;height:7px;border-radius:50%;background:#bda7f3}
    .mc3Head.live .mc3Dot{background:#ff6070;box-shadow:0 0 0 4px rgba(255,96,112,.12);animation:mc3Pulse 1.3s infinite}
    .mc3Title{font-size:24px;line-height:1.05;font-weight:950;margin-top:6px}
    .mc3Sub{font-size:11px;opacity:.76;margin-top:4px;line-height:1.35}
    .mc3Close{border:0;border-radius:10px;padding:8px 11px;background:rgba(255,255,255,.14);color:#fff;font-weight:950}
    .mc3Body{padding:12px}
    .mc3Loading,.mc3Empty,.mc3Warn{background:#fff;border:1px solid #e8e7ef;border-radius:18px;padding:24px 17px;text-align:center;color:#716f82;font-size:12px;line-height:1.5}
    .mc3Warn{background:#fffaf0;border-color:#eddca9;padding:12px 13px;margin-bottom:10px;font-size:10px;color:#78652e}

    .mc3Fresh{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#fff;border:1px solid #e5e2ec;border-radius:14px;padding:9px 10px;margin-bottom:10px}
    .mc3Fresh.ok{border-color:#b9e8d9;background:#f2fff9}
    .mc3Fresh.fallback{border-color:#f1d99b;background:#fffaf0}
    .mc3Fresh b{display:block;font-size:10px;color:#342e43}
    .mc3Fresh span{display:block;font-size:8px;color:#7d7988;line-height:1.35;margin-top:2px}
    .mc3Refresh{border:0;border-radius:10px;padding:8px 9px;background:#eee9fb;color:#52319f;font-size:9px;font-weight:950;white-space:nowrap}

    .mc3SectionTitle{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin:15px 2px 8px}
    .mc3SectionTitle h2{margin:0;font-size:16px}
    .mc3SectionTitle span{font-size:9px;color:#7d7988;font-weight:850}

    .mc3Game{background:#fff;border:1px solid #e8e7ef;border-radius:19px;padding:14px;margin-bottom:11px;box-shadow:0 8px 24px rgba(25,18,65,.055)}
    .mc3GameTop{display:flex;justify-content:space-between;gap:8px;align-items:center}
    .mc3Meta{font-size:8.5px;color:#716f82;font-weight:900;text-transform:uppercase}
    .mc3Pill{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:950}
    .mc3Pill.locked{background:#eee9fb;color:#5a35b1}
    .mc3Pill.live{background:#fde9ec;color:#b52c3c}
    .mc3Pill.confirming{background:#fff3c9;color:#7b5a00}
    .mc3Pill.final{background:#e5f8f2;color:#08775c}

    .mc3Fixture{display:grid;grid-template-columns:1fr auto 1fr;gap:9px;align-items:center;margin:12px 0 9px}
    .mc3Team{font-size:13px;font-weight:950;line-height:1.2}
    .mc3Team.away{text-align:right}
    .mc3ScoreWrap{text-align:center;min-width:68px}
    .mc3Score{font-size:31px;font-weight:950;white-space:nowrap;line-height:1}
    .mc3Kickoff{font-size:20px;font-weight:950;white-space:nowrap;line-height:1}
    .mc3ScoreSub{font-size:8px;color:#817c8c;font-weight:900;margin-top:4px;text-transform:uppercase}

    .mc3Mine{display:flex;justify-content:space-between;align-items:center;gap:10px;border-radius:13px;padding:10px 11px;background:#f7f6fb;margin-top:8px}
    .mc3MineText{font-size:10px;color:#504b5e;font-weight:800;line-height:1.35}
    .mc3MineText b{display:block;color:#241153;font-size:11px;margin-bottom:2px}
    .mc3Pts{border-radius:999px;padding:6px 8px;font-size:9px;font-weight:950;white-space:nowrap}
    .mc3Pts.exact{background:#dff9f1;color:#08775c}
    .mc3Pts.one{background:#fff3c9;color:#7b5a00}
    .mc3Pts.zero{background:#fde9ec;color:#b52c3c}
    .mc3Pts.none{background:#ecebf1;color:#716f82}

    .mc3Breakdown,.mc3Mini{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}
    .mc3Break,.mc3MiniStat{border-radius:11px;padding:9px 5px;text-align:center;background:#f7f6fb}
    .mc3Break.home{background:#e7f5ff;color:#176b96}
    .mc3Break.draw{background:#f2eff8;color:#62547c}
    .mc3Break.away{background:#fff0ea;color:#9a4b22}
    .mc3Break b,.mc3MiniStat b{display:block;font-size:18px}
    .mc3Break span,.mc3MiniStat span{font-size:7.5px;text-transform:uppercase;font-weight:900}
    .mc3Popular{font-size:9.5px;color:#716f82;margin-top:8px;text-align:center}

    .mc3Details{margin-top:9px;border:1px solid #eceaf2;border-radius:13px;overflow:hidden}
    .mc3Details summary{list-style:none;cursor:pointer;padding:10px 11px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:10px;font-weight:950;background:#faf9fd;color:#4f4760}
    .mc3Details summary::-webkit-details-marker{display:none}
    .mc3People{border-top:1px solid #eceaf2}
    .mc3Person{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:9px 10px;border-top:1px solid #f0eff4}
    .mc3Person:first-child{border-top:0}
    .mc3PersonName{font-size:10.5px;font-weight:950;color:#2f2940;min-width:0}
    .mc3PersonName small{display:block;font-size:8px;color:#827e8d;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mc3Pick{font-size:10px;font-weight:950;color:#4b4658;white-space:nowrap}

    .mc3Table{background:#fff;border:1px solid #ded8eb;border-radius:19px;padding:13px;margin-top:14px}
    .mc3TableHead{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:8px}
    .mc3TableHead h2{margin:0;font-size:17px}
    .mc3TableHead span{font-size:8.5px;color:#7d7988;text-align:right;font-weight:850}
    .mc3Table table{width:100%;border-collapse:collapse}
    .mc3Table th{font-size:8px;text-transform:uppercase;color:#817d8d;text-align:left;padding:7px 4px;border-bottom:1px solid #ece9f1}
    .mc3Table th.num,.mc3Table td.num{text-align:right}
    .mc3Table td{font-size:10px;padding:8px 4px;border-bottom:1px solid #f0eef4}
    .mc3Table tr.me{background:#f1ecff}
    .mc3TeamCell{font-weight:900;max-width:160px}
    .mc3TeamCell small{display:block;font-size:7.5px;color:#858190;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mc3Move{font-size:9px;font-weight:950}
    .mc3Move.up{color:#08775c}.mc3Move.down{color:#b52c3c}.mc3Move.same{color:#817d8d}
    .mc3LiveAdd{font-size:8px;font-weight:950;color:#08775c}
    .mc3TableNote,.mc3Footer{text-align:center;color:#858293;font-size:8.5px;line-height:1.45;margin-top:8px}

    @media(max-width:520px){
      #nav.mcNavReady button{font-size:6.1px!important}
      #nav.mcNavReady button i{font-size:15px!important}
      .mc3Body{padding:10px}.mc3Title{font-size:22px}.mc3Team{font-size:12px}.mc3Score{font-size:28px}
      .mc3Table td{font-size:9.5px}.mc3TeamCell{max-width:130px}
    }
  `;
  document.head.appendChild(s);
}

async function mc3Context(){
  if(mc3LeagueId&&mc3UserId)return true;
  try{
    const {data:{session}}=await mc3Sb.auth.getSession();
    if(!session)return false;
    mc3UserId=session.user.id;

    const {data,error}=await mc3Sb.from('league_members')
      .select('league_id,status,joined_at')
      .eq('user_id',mc3UserId)
      .eq('status','active')
      .order('joined_at',{ascending:false})
      .limit(1);

    if(error)throw error;
    if(!data?.length)return false;
    mc3LeagueId=data[0].league_id;
    return true;
  }catch(e){
    console.warn('Match Centre V3 context:',e);
    return false;
  }
}

function mc3AddAi(history,aiPicks){
  const byFixture=new Map();
  for(const p of aiPicks||[]){
    const id=String(p.fixture_id||'');
    if(!byFixture.has(id))byFixture.set(id,[]);
    byFixture.get(id).push({...p,user_id:null,entrant_type:'ai',display_name:p.manager_name});
  }
  return (history||[]).map(h=>({
    ...h,
    predictions:[...(Array.isArray(h.predictions)?h.predictions:[]),...(byFixture.get(String(h.fixture_id))||[])]
  }));
}

function mc3BuildRows(feed,history){
  const now=Date.now();
  const rows=[];
  const used=new Set();
  const byPair=new Map((history||[]).map(h=>[mc3FixtureKey(h.home_team,h.away_team),h]));

  for(const f of feed?.live||[]){
    const h=byPair.get(mc3FixtureKey(f.home_team,f.away_team))||null;
    const id=String(h?.fixture_id||`feed:${f.external_fixture_id||mc3FixtureKey(f.home_team,f.away_team)}`);
    if(used.has(id))continue;
    used.add(id);
    const confirmed=h?.result_home_score!=null;
    rows.push({
      phase:confirmed?'final':'live',
      ...f,
      appFixture:h,
      home_team:h?.home_team||f.home_team,
      away_team:h?.away_team||f.away_team,
      matchweek:h?.matchweek||f.matchweek,
      kickoff_at:h?.kickoff_at||f.kickoff_at||f.start_time,
      home_score:confirmed?h.result_home_score:f.home_score,
      away_score:confirmed?h.result_away_score:f.away_score
    });
  }

  for(const f of feed?.recent_final||[]){
    const h=byPair.get(mc3FixtureKey(f.home_team,f.away_team))||null;
    const id=String(h?.fixture_id||`feed:${f.external_fixture_id||mc3FixtureKey(f.home_team,f.away_team)}`);
    if(used.has(id))continue;
    used.add(id);
    const confirmed=h?.result_home_score!=null;
    rows.push({
      phase:confirmed?'final':'confirming',
      ...f,
      appFixture:h,
      home_team:h?.home_team||f.home_team,
      away_team:h?.away_team||f.away_team,
      matchweek:h?.matchweek||f.matchweek,
      kickoff_at:h?.kickoff_at||f.kickoff_at||f.start_time,
      home_score:confirmed?h.result_home_score:f.home_score,
      away_score:confirmed?h.result_away_score:f.away_score
    });
  }

  for(const h of history||[]){
    const id=String(h.fixture_id);
    if(used.has(id))continue;

    const ko=new Date(h.kickoff_at).getTime();
    const lock=new Date(h.prediction_lock_at).getTime();
    if(!Number.isFinite(ko)||!Number.isFinite(lock))continue;

    const hasResult=h.result_home_score!=null&&h.result_away_score!=null;
    const age=now-ko;

    if(!hasResult&&lock<=now&&ko>now){
      rows.push({
        phase:'locked',appFixture:h,
        home_team:h.home_team,away_team:h.away_team,matchweek:h.matchweek,kickoff_at:h.kickoff_at
      });
      used.add(id);
    }else if(!hasResult&&ko<=now&&age<4*60*60*1000){
      rows.push({
        phase:age>=105*60*1000?'confirming':'syncing',
        appFixture:h,home_team:h.home_team,away_team:h.away_team,
        matchweek:h.matchweek,kickoff_at:h.kickoff_at,
        home_score:null,away_score:null
      });
      used.add(id);
    }else if(hasResult&&age>=0&&age<4*60*60*1000){
      rows.push({
        phase:'final',appFixture:h,
        home_team:h.home_team,away_team:h.away_team,matchweek:h.matchweek,kickoff_at:h.kickoff_at,
        home_score:h.result_home_score,away_score:h.result_away_score
      });
      used.add(id);
    }
  }

  const rank={live:0,syncing:1,confirming:2,locked:3,final:4};
  rows.sort((a,b)=>(rank[a.phase]??9)-(rank[b.phase]??9)||
    (new Date(a.kickoff_at).getTime()||0)-(new Date(b.kickoff_at).getTime()||0));
  return rows;
}

async function mc3Fetch(force=false,providerForce=false){
  if(!force&&mc3Data&&Date.now()-mc3FetchedAt<MC3_TTL)return mc3Data;
  if(mc3FetchPromise)return mc3FetchPromise;

  mc3FetchPromise=(async()=>{
    if(!await mc3Context())return null;

    // History is essential. Everything else is optional.
    const histRes=await mc3Sb.rpc('get_active_match_centre_history',{p_league_id:mc3LeagueId});
    if(histRes.error)throw histRes.error;

    const mc3Timeout=(promise,ms,label)=>Promise.race([
      promise,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out')),ms))
    ]);

    let ctx={standings:[],ai_picks:[],current_user_id:mc3UserId};
    let feed={ok:false,live:[],recent_final:[],source:'history',source_label:'Prediction history'};

    const [ctxSet,feedSet]=await Promise.allSettled([
      mc3Timeout(
        mc3Sb.rpc('get_match_centre_context',{p_league_id:mc3LeagueId}),
        2200,
        'Match Centre context'
      ),
      mc3Timeout(
        mc3Sb.functions.invoke('live-score-feed',{body:{force:providerForce}}),
        2200,
        'Live score provider'
      )
    ]);

    if(ctxSet.status==='fulfilled'&&!ctxSet.value.error&&ctxSet.value.data){
      ctx={...ctx,...ctxSet.value.data};
    }else if(ctxSet.status==='rejected'){
      console.warn('Match Centre V3.2 context enhancement unavailable:',ctxSet.reason);
    }

    if(feedSet.status==='fulfilled'&&!feedSet.value.error&&feedSet.value.data?.ok===true){
      feed=feedSet.value.data;
    }else if(feedSet.status==='rejected'){
      console.warn('Match Centre V3.2 live feed unavailable:',feedSet.reason);
    }

    const history=mc3AddAi(histRes.data||[],ctx.ai_picks||[]);
    const rows=mc3BuildRows(feed,history);

    mc3Data={
      feed,history,rows,
      standings:ctx.standings||[],
      current_user_id:ctx.current_user_id||mc3UserId,
      fetched_at:feed.fetched_at||new Date().toISOString()
    };
    mc3FetchedAt=Date.now();
    return mc3Data;
  })();

  try{return await mc3FetchPromise}
  finally{mc3FetchPromise=null}
}

function mc3Preds(row){
  return (row.appFixture?.predictions||[]).filter(p=>p.home_score!=null&&p.away_score!=null);
}
function mc3HasScore(row){
  return row.home_score!=null&&row.away_score!=null;
}
function mc3Mine(row){
  return mc3Preds(row).find(p=>String(p.user_id||p.entrant_id)===String(mc3UserId))||null;
}
function mc3Status(row){
  if(row.phase==='locked')return {label:'🔒 Locked In',cls:'locked'};
  if(row.phase==='live')return {label:row.minutes?`${row.minutes>=90?'90+':row.minutes}′ LIVE`:'LIVE',cls:'live'};
  if(row.phase==='syncing')return {label:'🔴 Live · syncing',cls:'live'};
  if(row.phase==='confirming')return {label:'🏁 FT · Confirming',cls:'confirming'};
  return {label:'✓ Final',cls:'final'};
}
function mc3PointsPill(pts,phase){
  if(pts==null)return '<span class="mc3Pts none">No pick</span>';
  const cls=pts===3?'exact':pts===1?'one':'zero';
  if(phase==='final')return `<span class="mc3Pts ${cls}">${pts} pt${pts===1?'':'s'}</span>`;
  return `<span class="mc3Pts ${cls}">${pts} pt${pts===1?'':'s'} if it ends now</span>`;
}
function mc3Breakdown(row){
  const ps=mc3Preds(row);
  let home=0,draw=0,away=0;
  const scores=new Map();

  for(const p of ps){
    const o=mc3Outcome(p.home_score,p.away_score);
    if(o==='H')home++;else if(o==='D')draw++;else away++;
    const k=`${p.home_score}–${p.away_score}`;
    scores.set(k,(scores.get(k)||0)+1);
  }

  const popular=[...scores.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]||null;
  return {ps,home,draw,away,popular};
}
function mc3People(row){
  const ps=mc3Preds(row).map(p=>({
    ...p,
    nowPoints:mc3HasScore(row)?mc3Points(p,row.home_score,row.away_score):null
  }));

  ps.sort((a,b)=>{
    if(mc3HasScore(row)&&(b.nowPoints??-1)!==(a.nowPoints??-1))return (b.nowPoints??-1)-(a.nowPoints??-1);
    return String(a.team_name||a.display_name||'').localeCompare(String(b.team_name||b.display_name||''));
  });
  return ps;
}

function mc3Game(row){
  try{
    const h=row.appFixture||{};
    const status=mc3Status(row);
    const mine=mc3Mine(row);
    const people=mc3People(row);
    const b=mc3Breakdown(row);

    const myPick=mine?`${mine.home_score}–${mine.away_score}`:null;
    const myPts=mc3HasScore(row)
      ?(row.phase==='final'&&mine?.points!=null?Number(mine.points):mc3Points(mine,row.home_score,row.away_score))
      :null;

    const scored=mc3HasScore(row)?people.filter(p=>p.nowPoints!=null):[];
    const exact=scored.filter(p=>p.nowPoints===3).length;
    const scoring=scored.filter(p=>p.nowPoints>0).length;
    const zero=scored.filter(p=>p.nowPoints===0).length;

    const centre=row.phase==='locked'
      ?`<div class="mc3Kickoff">${mc3Esc(mc3FmtTime(row.kickoff_at))}</div><div class="mc3ScoreSub">${mc3Esc(mc3FmtDay(row.kickoff_at))}</div>`
      :mc3HasScore(row)
        ?`<div class="mc3Score">${mc3Esc(row.home_score)}–${mc3Esc(row.away_score)}</div><div class="mc3ScoreSub">${row.phase==='final'?'Final score':row.phase==='confirming'?'Awaiting confirmation':'Current score'}</div>`
        :`<div class="mc3Kickoff">—</div><div class="mc3ScoreSub">Score syncing</div>`;

    return `<section class="mc3Game">
      <div class="mc3GameTop">
        <div class="mc3Meta">MW${mc3Esc(row.matchweek||h.matchweek||'')} · ${mc3Esc(mc3FmtDay(row.kickoff_at))}</div>
        <div class="mc3Pill ${status.cls}">${mc3Esc(status.label)}</div>
      </div>

      <div class="mc3Fixture">
        <div class="mc3Team">${mc3Esc(h.home_team||row.home_team)}</div>
        <div class="mc3ScoreWrap">${centre}</div>
        <div class="mc3Team away">${mc3Esc(h.away_team||row.away_team)}</div>
      </div>

      <div class="mc3Mine">
        <div class="mc3MineText"><b>Your prediction</b>${myPick?mc3Esc(myPick):'No prediction recorded for this match'}${row.phase==='locked'?'<br><span style="font-size:8px;color:#817d8d">Locked and now visible to the league</span>':''}</div>
        ${row.phase==='locked'?'<span class="mc3Pts none">Locked</span>':mc3PointsPill(myPts,row.phase)}
      </div>

      ${row.phase==='locked'
        ?`<div class="mc3Breakdown">
            <div class="mc3Break home"><b>${b.home}</b><span>Home win</span></div>
            <div class="mc3Break draw"><b>${b.draw}</b><span>Draw</span></div>
            <div class="mc3Break away"><b>${b.away}</b><span>Away win</span></div>
          </div>
          ${b.popular?`<div class="mc3Popular">Most popular exact score: <b>${mc3Esc(b.popular[0])}</b> · ${b.popular[1]} pick${b.popular[1]===1?'':'s'}</div>`:''}`
        :mc3HasScore(row)
          ?`<div class="mc3Mini">
              <div class="mc3MiniStat"><b>${exact}</b><span>Exact now</span></div>
              <div class="mc3MiniStat"><b>${scoring}</b><span>Scoring</span></div>
              <div class="mc3MiniStat"><b>${zero}</b><span>Missing out</span></div>
            </div>`
          :''}

      <details class="mc3Details">
        <summary>${row.phase==='locked'?'All locked predictions':'League detail'} · ${people.length} pick${people.length===1?'':'s'}</summary>
        <div class="mc3People">
          ${people.length?people.map(p=>`
            <div class="mc3Person">
              <div class="mc3PersonName">${mc3Esc(p.badge||'⚽')} ${mc3Esc(p.team_name||p.display_name||'Player')}
                <small>${p.entrant_type==='ai'?'AI · ':''}${mc3Esc(p.display_name||p.manager_name||'')}</small>
              </div>
              <div class="mc3Pick">${mc3Esc(p.home_score)}–${mc3Esc(p.away_score)}</div>
              ${row.phase==='locked'
                ?'<span class="mc3Pts none">Locked</span>'
                :mc3PointsPill(row.phase==='final'&&p.points!=null?Number(p.points):p.nowPoints,row.phase)}
            </div>`).join('')
            :'<div class="mc3Person"><div class="mc3PersonName">No predictions recorded</div></div>'}
        </div>
      </details>
    </section>`;
  }catch(e){
    console.warn('Match Centre V3 game card:',e,row);
    return `<section class="mc3Game"><div class="mc3Empty">This fixture could not be drawn, but the rest of Match Centre is still available.</div></section>`;
  }
}

function mc3ProjectedTable(data){
  try{
    const active=(data.rows||[]).filter(r=>
      ['live','confirming'].includes(r.phase)&&mc3HasScore(r)&&r.appFixture&&
      r.appFixture.result_home_score==null
    );
    if(!active.length||!(data.standings||[]).length)return '';

    const base=[...(data.standings||[])].sort((a,b)=>
      mc3Num(b.total_points)-mc3Num(a.total_points)||
      mc3Num(b.exact_scores)-mc3Num(a.exact_scores)||
      mc3Num(b.correct_outcomes)-mc3Num(a.correct_outcomes)||
      String(a.team_name||'').localeCompare(String(b.team_name||''))
    );

    const basePos=new Map(base.map((x,i)=>[String(x.entrant_id),i+1]));
    const map=new Map(base.map(x=>[String(x.entrant_id),{...x,live_points:0,live_exacts:0,live_outcomes:0}]));

    for(const row of active){
      for(const p of mc3Preds(row)){
        const id=String(p.user_id||p.entrant_id||'');
        if(!id||!map.has(id))continue;
        const pts=mc3Points(p,row.home_score,row.away_score);
        if(pts==null)continue;
        const x=map.get(id);
        x.live_points+=pts;
        if(pts===3)x.live_exacts++;
        else if(pts===1)x.live_outcomes++;
      }
    }

    const projected=[...map.values()].map(x=>({
      ...x,
      projected_points:mc3Num(x.total_points)+x.live_points,
      projected_exacts:mc3Num(x.exact_scores)+x.live_exacts,
      projected_outcomes:mc3Num(x.correct_outcomes)+x.live_outcomes
    })).sort((a,b)=>
      b.projected_points-a.projected_points||
      b.projected_exacts-a.projected_exacts||
      b.projected_outcomes-a.projected_outcomes||
      String(a.team_name||'').localeCompare(String(b.team_name||''))
    );

    return `<section class="mc3Table">
      <div class="mc3TableHead"><h2>🔴 Live Table — As It Stands</h2><span>If the current score<br>stayed exactly as it is</span></div>
      <table>
        <thead><tr><th>#</th><th>Team</th><th class="num">Pts</th><th class="num">Live</th><th class="num">Move</th></tr></thead>
        <tbody>${projected.map((x,i)=>{
          const pos=i+1;
          const bp=basePos.get(String(x.entrant_id))||pos;
          const mv=bp-pos;
          const me=String(x.entrant_id)===String(data.current_user_id);
          const mcls=mv>0?'up':mv<0?'down':'same';
          const mtxt=mv>0?`↑${mv}`:mv<0?`↓${Math.abs(mv)}`:'—';
          return `<tr class="${me?'me':''}">
            <td><b>${pos}</b></td>
            <td class="mc3TeamCell">${mc3Esc(x.badge||'⚽')} ${mc3Esc(x.team_name||x.manager_name||'Team')}
              <small>${x.entrant_type==='ai'?'AI · ':''}${mc3Esc(x.manager_name||'')}${me?' · YOU':''}</small>
            </td>
            <td class="num"><b>${x.projected_points}</b></td>
            <td class="num"><span class="mc3LiveAdd">+${x.live_points}</span></td>
            <td class="num"><span class="mc3Move ${mcls}">${mtxt}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      <div class="mc3TableNote">Provisional only. The official table changes only after a result is confirmed.</div>
    </section>`;
  }catch(e){
    console.warn('Match Centre V3 projected table:',e);
    return '';
  }
}

function mc3ProviderBar(d){
  const f=d?.feed||{};
  const liveOk=f.ok===true;
  const src=f.source_label||(liveOk?'Live score provider':'Prediction history');
  const ts=f.source_updated_at||f.fetched_at||d?.fetched_at;
  let stamp='just now';
  if(ts){
    const x=mc3SafeDate(ts,{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    if(x!=='—')stamp=x;
  }

  return `<div class="mc3Fresh ${liveOk?'ok':'fallback'}">
    <div><b>${liveOk?'⚡':'↻'} ${mc3Esc(src)}</b>
      <span>${liveOk?'Live scores connected':'Locked picks available · live score provider will keep retrying'} · updated ${mc3Esc(stamp)}</span>
    </div>
    <button type="button" class="mc3Refresh" data-mc3-refresh>↻ Refresh</button>
  </div>`;
}

function mc3Header(rows){
  if(rows.some(r=>r.phase==='live'||r.phase==='syncing'))
    return {eyebrow:'Live now',sub:'Current scores · sealed picks · provisional points · live table',live:true};
  if(rows.some(r=>r.phase==='confirming'))
    return {eyebrow:'Full time',sub:'Final whistle reached · waiting for confirmation',live:true};
  if(rows.some(r=>r.phase==='locked'))
    return {eyebrow:'Predictions locked',sub:'Sealed picks are now visible before kickoff',live:false};
  return {eyebrow:'Recently final',sub:'Confirmed results and settled prediction points',live:false};
}
function mc3Section(rows,phases,title,sub){
  const r=rows.filter(x=>phases.includes(x.phase));
  if(!r.length)return '';
  return `<div class="mc3SectionTitle"><h2>${title}</h2><span>${sub}</span></div>${r.map(mc3Game).join('')}`;
}

async function mc3Render(force=false,providerForce=false){
  const ov=document.querySelector('.mc3Overlay');
  if(!ov)return;
  const body=ov.querySelector('.mc3Body');
  if(!body)return;

  if(force)body.innerHTML='<div class="mc3Loading">Building Match Centre…</div>';

  try{
    const d=await mc3Fetch(force,providerForce);
    if(!d)throw new Error('No active league found');

    const rows=d.rows||[];
    const hs=mc3Header(rows);
    const head=ov.querySelector('.mc3Head');
    head?.classList.toggle('live',hs.live);

    if(head){
      head.querySelector('.mc3Eyebrow').innerHTML=`<span class="mc3Dot"></span>${mc3Esc(hs.eyebrow)}`;
      head.querySelector('.mc3Sub').textContent=hs.sub;
    }

    if(!rows.length){
      body.innerHTML='<div class="mc3Empty"><b>Nothing is locked or live right now.</b><br>Match Centre appears from the four-hour prediction deadline through the live match and recent final result.</div>';
      return;
    }

    const lvHtml=typeof window.getPLPLiveVidiprinterHtml==='function'
      ?window.getPLPLiveVidiprinterHtml()
      :'';

    body.innerHTML=
      mc3ProviderBar(d)+
      '<div class="lvStableSlot" data-lv-slot>'+lvHtml+'</div>'+
      mc3Section(rows,['live','syncing'],'🔴 Live Now','Scores refresh automatically')+
      mc3Section(rows,['confirming'],'🏁 FT · Confirming','Provider says finished')+
      mc3Section(rows,['locked'],'🔒 Locked In','Predictions are sealed')+
      mc3ProjectedTable(d)+
      mc3Section(rows,['final'],'✓ Recently Final','Officially confirmed')+
      '<div class="mc3Footer">Match Centre refreshes automatically. Locked predictions come from the app database; live scores are an enhancement and cannot alter saved predictions or official results.</div>';

    if(typeof window.wirePLPLiveVidiprinter==='function'){
      window.wirePLPLiveVidiprinter();
    }

    const refresh=body.querySelector('[data-mc3-refresh]');
    if(refresh)refresh.onclick=async()=>{
      refresh.disabled=true;
      refresh.textContent='Refreshing…';
      mc3Data=null;
      await mc3Render(true,true);
    };
  }catch(e){
    console.warn('Match Centre V3 render:',e);

    // Last-chance history-only fallback. Do not take down the screen for an enhancement failure.
    try{
      if(await mc3Context()){
        const histRes=await mc3Sb.rpc('get_active_match_centre_history',{p_league_id:mc3LeagueId});
        if(!histRes.error){
          const history=histRes.data||[];
          const rows=mc3BuildRows({ok:false,live:[],recent_final:[]},history);
          if(rows.length){
            body.innerHTML=
              '<div class="mc3Warn"><b>Live score connection unavailable.</b><br>Showing the locked fixture and predictions directly from the league database.</div>'+
              mc3Section(rows,['live','syncing'],'🔴 Live Now','Score provider reconnecting')+
              mc3Section(rows,['confirming'],'🏁 FT · Confirming','Awaiting confirmation')+
              mc3Section(rows,['locked'],'🔒 Locked In','Predictions are sealed')+
              mc3Section(rows,['final'],'✓ Recently Final','Officially confirmed');
            return;
          }
        }
      }
    }catch(fallbackError){
      console.warn('Match Centre V3 fallback:',fallbackError);
    }

    body.innerHTML='<div class="mc3Empty"><b>Match Centre could not load this time.</b><br>Your predictions and official results are unaffected. Tap Match again to retry.</div>';
  }
}

async function mc3Open(){
  mc3Css();

  // Remove both legacy and V3 overlays so only one centre can exist.
  document.querySelector('.mcOverlay')?.remove();
  document.querySelector('.lcOverlay')?.remove();
  document.querySelector('.rhOverlay')?.remove();
  document.querySelector('.mc3Overlay')?.remove();

  const nav=document.getElementById('nav');
  mc3PreviousActive=nav?.querySelector('button.active:not(.mcNav)')||null;

  if(nav){
    nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    nav.querySelector('.mcNav')?.classList.add('active');
  }

  const ov=document.createElement('div');
  ov.className='mc3Overlay';
  ov.innerHTML=`<div class="mc3Shell">
    <div class="mc3Head">
      <div class="mc3HeadTop">
        <div>
          <div class="mc3Eyebrow"><span class="mc3Dot"></span>Match Centre</div>
          <div class="mc3Title">Match Centre</div>
          <div class="mc3Sub">Locked picks · live scores · as-it-stands table</div>
        </div>
        <button class="mc3Close" type="button">✕</button>
      </div>
    </div>
    <div class="mc3Body"><div class="mc3Loading">Building Match Centre…</div></div>
  </div>`;

  ov.querySelector('.mc3Close').onclick=mc3Close;
  document.body.appendChild(ov);
  document.body.style.overflow='hidden';
  await mc3Render(true,false);
}

function mc3Close(){
  document.querySelector('.mc3Overlay')?.remove();
  document.body.style.overflow='';

  const nav=document.getElementById('nav');
  if(nav){
    nav.querySelector('.mcNav')?.classList.remove('active');
    if(mc3PreviousActive&&document.contains(mc3PreviousActive))mc3PreviousActive.classList.add('active');
    else nav.querySelector('button[data-v="home"]')?.classList.add('active');
  }
  mc3PreviousActive=null;
}

function mc3EnsureNav(data){
  const nav=document.getElementById('nav');
  if(!nav)return;

  const rows=data?.rows||[];
  let b=nav.querySelector('.mcNav');

  if(!rows.length){
    nav.classList.remove('mcNavReady');
    b?.remove();
    return;
  }

  nav.classList.add('mcNavReady');

  if(!b){
    b=document.createElement('button');
    b.className='mcNav';
    b.innerHTML='<i>⚽</i>Match';
    b.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      mc3Open();
    };
    const ai=nav.querySelector('button[data-v="ai"]');
    nav.insertBefore(b,ai||nav.lastElementChild);
  }else{
    // Replace any earlier onclick owner with V3.
    b.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      mc3Open();
    };
  }

  const live=rows.some(r=>['live','syncing','confirming'].includes(r.phase));
  b.classList.toggle('livePhase',live);
  b.title='Match Centre';
}

async function mc3Sync(force=false){
  try{
    const d=await mc3Fetch(force,false);
    if(!d)return;
    mc3EnsureNav(d);
    if(document.querySelector('.mc3Overlay'))await mc3Render(false,false);
  }catch(e){
    console.warn('Match Centre V3 sync:',e);
  }
}

function mc3Schedule(){
  clearTimeout(mc3Timer);
  mc3Timer=setTimeout(()=>{
    if(mc3Data)mc3EnsureNav(mc3Data);
  },100);
}

mc3Css();
window.openPLPMatchCentre=mc3Open;
window.closePLPMatchCentre=mc3Close;

window.addEventListener('focus',()=>mc3Sync(true));

const mc3Main=document.getElementById('main');
if(mc3Main)new MutationObserver(mc3Schedule).observe(mc3Main,{childList:true,subtree:true});

document.addEventListener('click',e=>{
  if(e.target.closest?.('#nav button[data-v]')){
    document.querySelector('.mc3Overlay')?.remove();
    document.body.style.overflow='';
    mc3PreviousActive=null;
    setTimeout(mc3Schedule,80);
  }
},true);

setInterval(()=>mc3Sync(true),15000);
setTimeout(()=>mc3Sync(true),500);
