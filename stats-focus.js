// STATS FOCUS V1.1 - stable scroll fix
// Simplified Stats UX: My Stats first, League Stats second.
// Presentation-only layer: reuses existing Supabase RPCs and does not change scoring, locks or stored predictions.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sfSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let sfCtx=null;
let sfProfiles=null;
let sfDashboard=null;
let sfDrama=null;
let sfSelfEvidence=null;
let sfLeagueEvidence=null;
let sfLoadedAt=0;
let sfEvidenceAt=0;
let sfBusy=false;
let sfTimer=null;
let sfMode='self';
let sfWasActive=false;

const sfEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const sfNum=v=>Number(v||0);
const sfPct=v=>`${Math.round(Number(v||0))}%`;
const sfOrd=n=>{
  n=Number(n||0);
  if(!n)return '–';
  const s=['th','st','nd','rd'],v=n%100;
  return `${n}${s[(v-20)%10]||s[v]||s[0]}`;
};
const sfPlural=(n,one,many=one+'s')=>Number(n)===1?one:many;
const sfName=p=>p?.team_name||p?.display_name||'Player';
const sfBadge=p=>p?.badge||'⚽';

function sfCss(){
  if(document.getElementById('sf-v1-css'))return;
  const s=document.createElement('style');
  s.id='sf-v1-css';
  s.textContent=`
    .sfHost{margin-bottom:14px}
    .sfLegacyHidden,.ljs2-playerHost,.sdHost{display:none!important}
    .sfTabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;background:#eceaf3;border:1px solid #dfdce8;padding:4px;border-radius:15px;margin-bottom:12px;position:sticky;top:6px;z-index:9;box-shadow:0 5px 18px rgba(30,20,70,.08)}
    .sfTab{border:0;background:transparent;color:#6e697b;border-radius:11px;padding:10px 8px;font-size:11px;font-weight:950;cursor:pointer}
    .sfTab.active{background:#fff;color:#241153;box-shadow:0 3px 10px rgba(35,20,80,.10)}
    .sfCard{background:#fff;border:1px solid #e8e7ef;border-radius:18px;padding:15px;margin-bottom:12px;box-shadow:0 8px 24px rgba(25,18,65,.055)}
    .sfHero{background:linear-gradient(145deg,#fff,#f8f5ff);border-color:#ded5f1}
    .sfHead{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:11px}
    .sfHead h2,.sfHead h3{margin:0;color:#241153}.sfHead h2{font-size:18px}.sfHead h3{font-size:15px}
    .sfHead span{font-size:9px;color:#807b8d;text-align:right;line-height:1.3}
    .sfGrid4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
    .sfGrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
    .sfGrid2{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
    .sfStat{background:#f6f5fa;border-radius:13px;padding:10px 7px;text-align:center;min-width:0}
    .sfStat b{display:block;font-size:20px;line-height:1.05;color:#241153;overflow:hidden;text-overflow:ellipsis}
    .sfStat span{display:block;font-size:8px;line-height:1.25;margin-top:4px;text-transform:uppercase;letter-spacing:.04em;color:#7c7789;font-weight:900}
    .sfStat small{display:block;font-size:8px;color:#9994a4;margin-top:3px;line-height:1.2}
    .sfPills{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
    .sfPill{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:6px 8px;background:#f1eef8;color:#554d67;font-size:8.5px;font-weight:900}
    .sfPill.good{background:#e5f8f2;color:#08775c}.sfPill.bad{background:#fdebed;color:#a72e3d}.sfPill.gold{background:#fff5d5;color:#7b5a00}
    .sfStory{margin-top:9px;background:#f8f7fb;border:1px solid #ece9f2;border-radius:13px;padding:10px 11px;font-size:10px;line-height:1.45;color:#514b5e}
    .sfStory b{color:#241153}
    .sfForm{display:flex;gap:7px;flex-wrap:wrap;margin:4px 0 10px}
    .sfPick{width:44px;height:44px;border-radius:13px;background:#efedf4;display:grid;place-items:center;font-weight:950;font-size:15px;color:#625c6e;position:relative}
    .sfPick.exact{background:#dcf7ee;color:#08775c}.sfPick.one{background:#fff2c8;color:#7b5a00}
    .sfPick small{position:absolute;bottom:3px;font-size:6px;font-weight:950;letter-spacing:.03em}
    .sfRows{display:grid;gap:0}.sfRow{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 1px;border-top:1px solid #eeecf3}.sfRow:first-child{border-top:0}
    .sfRow>span:first-child{min-width:0;font-size:10px;color:#4e485a}.sfRow>span:first-child b{display:block;color:#241153;font-size:10.5px}.sfRow small{display:block;color:#918c9a;font-size:8px;margin-top:2px;line-height:1.3}
    .sfValue{text-align:right;font-weight:950;color:#241153;font-size:12px;white-space:nowrap}
    .sfCall{border:1px solid #ebe8f0;background:#faf9fc;border-radius:13px;padding:10px}
    .sfCall h4{font-size:9px;margin:0 0 5px;color:#6d6878;text-transform:uppercase;letter-spacing:.04em}.sfCall b{font-size:16px;color:#241153}.sfCall p{font-size:8.5px;color:#8a8593;margin:3px 0 0;line-height:1.35}
    .sfMiniTitle{font-size:9px;font-weight:950;color:#756f82;text-transform:uppercase;letter-spacing:.055em;margin:13px 0 6px}
    .sfRank{display:flex;justify-content:space-between;gap:9px;align-items:center;padding:9px 0;border-top:1px solid #efedf3}.sfRank:first-child{border-top:0}
    .sfRankName{font-size:10px;color:#453f50;min-width:0}.sfRankName b{display:block;color:#241153;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sfRankName small{font-size:8px;color:#928d9a}
    .sfRankValue{text-align:right;font-size:12px;font-weight:950;color:#241153;white-space:nowrap}.sfRankValue small{display:block;font-size:7.5px;color:#918c99;font-weight:800;margin-top:2px}
    .sfSectionNote{font-size:8.5px;line-height:1.4;color:#858090;margin:-4px 0 9px}
    .sfDetails{margin-top:9px;border-top:1px solid #eeecf3;padding-top:9px}.sfDetails summary{cursor:pointer;color:#4b269d;font-size:9px;font-weight:950;list-style:none}.sfDetails summary::-webkit-details-marker{display:none}.sfDetails summary:after{content:'  ›';font-size:14px;vertical-align:-1px}.sfDetails[open] summary:after{content:'  ⌄'}
    .sfFixture{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid #efedf3}.sfFixture:first-child{border-top:0}.sfFixtureMain{min-width:0;font-size:9.5px;color:#514b5e}.sfFixtureMain b{display:block;color:#241153;font-size:10px}.sfFixtureMain small{display:block;color:#918c9b;font-size:8px;margin-top:2px}.sfPts{font-size:11px;font-weight:950;color:#655f70;white-space:nowrap}.sfPts.exact{color:#08775c}.sfPts.one{color:#8a6500}
    .sfSplit{height:9px;display:flex;overflow:hidden;border-radius:999px;background:#eee}.sfSplit i{display:block;height:100%}.sfSplit .h{background:#6a47ba}.sfSplit .d{background:#c19a2a}.sfSplit .a{background:#23927b}
    .sfDramaGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sfDrama{border-radius:14px;padding:11px;background:#faf9fc;border:1px solid #ece9f2}.sfDrama.bad{background:#fffafa;border-color:#efd6da}.sfDrama.good{background:#f9fffc;border-color:#d6eade}.sfDrama h4{margin:0 0 4px;font-size:11px;color:#241153}.sfDrama p{margin:0;font-size:8.5px;line-height:1.4;color:#777180}.sfDrama b.big{display:block;font-size:21px;margin-top:8px;color:#241153}
    .sfEmpty{border:1px dashed #ddd9e5;background:#faf9fc;border-radius:13px;padding:12px;text-align:center;font-size:9px;line-height:1.45;color:#85808e}
    .sfLoading{padding:22px 12px;text-align:center;color:#777180;font-size:10px}
    .sfError{background:#fff0f2;border:1px solid #efc9cf;color:#9a3541;border-radius:13px;padding:11px;font-size:9.5px;line-height:1.4}
    @media(max-width:520px){.sfGrid4{grid-template-columns:repeat(2,1fr)}.sfGrid3{grid-template-columns:repeat(3,1fr)}.sfDramaGrid{grid-template-columns:1fr}.sfStat b{font-size:18px}}
  `;
  document.head.appendChild(s);
}

function sfActive(){
  return !!document.querySelector('#nav button[data-v="stats"].active');
}

async function sfContext(){
  if(sfCtx)return sfCtx;
  const {data:{session}}=await sfSb.auth.getSession();
  if(!session)return null;
  const {data,error}=await sfSb.from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);
  if(error)throw error;
  if(!data?.length)return null;
  sfCtx={userId:session.user.id,leagueId:data[0].league_id};
  return sfCtx;
}

async function sfLoadCore(force=false){
  const c=await sfContext();
  if(!c)return null;
  if(!force&&sfProfiles&&sfDashboard&&Date.now()-sfLoadedAt<20000){
    return {profiles:sfProfiles,dashboard:sfDashboard,drama:sfDrama};
  }
  const [p,d,r]=await Promise.all([
    sfSb.rpc('get_player_stats_profiles',{p_league_id:c.leagueId}),
    sfSb.rpc('get_stats_dashboard',{p_league_id:c.leagueId}),
    sfSb.rpc('get_stats_drama',{p_league_id:c.leagueId})
  ]);
  if(p.error)throw p.error;
  if(d.error)throw d.error;
  sfProfiles=p.data||{};
  sfDashboard=d.data||{};
  sfDrama=r.error?null:(r.data||{});
  sfLoadedAt=Date.now();
  return {profiles:sfProfiles,dashboard:sfDashboard,drama:sfDrama};
}

async function sfLoadSelfEvidence(force=false){
  const c=await sfContext();
  if(!c)return null;
  if(!force&&sfSelfEvidence&&Date.now()-sfEvidenceAt<20000)return sfSelfEvidence;
  const {data,error}=await sfSb.rpc('get_player_stats_evidence',{
    p_league_id:c.leagueId,
    p_user_id:c.userId
  });
  if(error)throw error;
  sfSelfEvidence=data||{};
  sfEvidenceAt=Date.now();
  return sfSelfEvidence;
}

async function sfMapLimit(items,limit,worker){
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

async function sfLoadLeagueEvidence(force=false){
  const c=await sfContext();
  if(!c||!sfProfiles)return [];
  if(!force&&sfLeagueEvidence&&Date.now()-sfEvidenceAt<120000)return sfLeagueEvidence;
  const players=sfProfiles.players||[];
  const rows=await sfMapLimit(players,6,async p=>{
    const {data,error}=await sfSb.rpc('get_player_stats_evidence',{
      p_league_id:c.leagueId,
      p_user_id:p.user_id
    });
    if(error)throw error;
    return {player:p,evidence:data||{}};
  });
  sfLeagueEvidence=rows.filter(Boolean);
  sfEvidenceAt=Date.now();
  return sfLeagueEvidence;
}

function sfPlayer(){
  const c=sfCtx;
  return (sfProfiles?.players||[]).find(x=>String(x.user_id)===String(c?.userId))||null;
}

function sfStat(value,label,sub=''){
  return `<div class="sfStat"><b>${sfEsc(value)}</b><span>${sfEsc(label)}</span>${sub?`<small>${sfEsc(sub)}</small>`:''}</div>`;
}
function sfPill(text,kind=''){
  return `<span class="sfPill ${kind}">${sfEsc(text)}</span>`;
}
function sfRank(p,value,label=''){
  if(!p)return '';
  return `<div class="sfRank"><div class="sfRankName"><b>${sfEsc(sfBadge(p))} ${sfEsc(sfName(p))}</b>${p.display_name&&p.display_name!==p.team_name?`<small>${sfEsc(p.display_name)}</small>`:''}</div><div class="sfRankValue">${sfEsc(value)}${label?`<small>${sfEsc(label)}</small>`:''}</div></div>`;
}
function sfCall(label,c,key){
  const calls=sfNum(c?.calls),scored=sfNum(c?.scored),pct=sfNum(c?.scoring_pct);
  return `<div class="sfCall"><h4>${sfEsc(label)}</h4><b>${scored}/${calls} scored</b><p>${Math.round(pct)}% earned prediction points</p></div>`;
}
function sfFixtureRow(x){
  const actual=x.actual_home==null||x.actual_away==null?'–':`${x.actual_home}–${x.actual_away}`;
  const pred=x.has_prediction===false?'Missed':(x.predicted_home==null||x.predicted_away==null?'–':`${x.predicted_home}–${x.predicted_away}`);
  const pts=sfNum(x.points);
  return `<div class="sfFixture"><div class="sfFixtureMain"><b>${sfEsc(x.home_team)} ${sfEsc(actual)} ${sfEsc(x.away_team)}</b><small>Predicted ${sfEsc(pred)} · MW${sfEsc(x.matchweek||'')}</small></div><span class="sfPts ${pts===3?'exact':pts===1?'one':''}">${pts===3?'3 pts':pts===1?'1 pt':'0 pts'}</span></div>`;
}

function sfFindStrongestCall(p){
  const calls=p?.call_accuracy||{};
  const vals=[['home','Home wins',calls.home],['draw','Draws',calls.draw],['away','Away wins',calls.away]]
    .filter(x=>sfNum(x[2]?.calls)>0)
    .sort((a,b)=>sfNum(b[2]?.scoring_pct)-sfNum(a[2]?.scoring_pct)||sfNum(b[2]?.calls)-sfNum(a[2]?.calls));
  return vals[0]||null;
}

function sfUkDay(v){
  if(!v)return '';
  try{
    return new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/London',
      year:'numeric',month:'2-digit',day:'2-digit'
    }).format(new Date(v));
  }catch{return ''}
}

function sfDroughtStats(evidence){
  const picks=[...(evidence?.all_fixtures||[])]
    .filter(x=>x.has_prediction!==false&&x.kickoff_at)
    .sort((a,b)=>new Date(a.kickoff_at)-new Date(b.kickoff_at));

  let run0=0,longest0=0;
  for(const x of picks){
    if(sfNum(x.points)===0){
      run0++;
      longest0=Math.max(longest0,run0);
    }else{
      run0=0;
    }
  }

  const days=new Map();
  for(const x of picks){
    const day=sfUkDay(x.kickoff_at);
    if(!day)continue;
    if(!days.has(day))days.set(day,{day,hasExact:false});
    if(sfNum(x.points)===3||x.is_exact===true)days.get(day).hasExact=true;
  }

  let runDays=0,longestDays=0;
  for(const d of [...days.values()].sort((a,b)=>a.day.localeCompare(b.day))){
    if(!d.hasExact){
      runDays++;
      longestDays=Math.max(longestDays,runDays);
    }else{
      runDays=0;
    }
  }

  return {
    longest_scoreless_games:longest0,
    longest_no_exact_days:longestDays
  };
}

function sfSelfHtml(p,e){
  const mws=p.matchweeks||[];
  const closed=sfNum(sfProfiles?.closed_matchweeks);
  const avg=Number(p.avg_points_per_matchweek||0);
  const best=p.best_matchweek;
  const recent=(e?.recent_form||e?.all_fixtures||[]).slice(0,5);
  const recentForPills=(p.recent_picks||[]).slice(0,5);
  const calls=p.call_accuracy||{};
  const st=p.prediction_style||{};
  const totalStyle=sfNum(st.home)+sfNum(st.draw)+sfNum(st.away);
  const stylePct=n=>totalStyle?Math.round(sfNum(n)*100/totalStyle):0;
  const strongest=sfFindStrongestCall(p);
  const vs=Math.round(Number(p.points_vs_league_average||0));
  const exactVs=Math.round(Number(p.exacts_vs_league_average||0));
  const high=sfNum(p.highest_position),low=sfNum(p.lowest_position);
  const drought=sfDroughtStats(e);

  const formPills=recentForPills.length?recentForPills.map(x=>`<div class="sfPick ${sfNum(x.points)===3?'exact':sfNum(x.points)===1?'one':''}">${sfNum(x.points)}<small>${sfNum(x.points)===3?'EXACT':sfNum(x.points)===1?'1 PT':'0'}</small></div>`).join(''):'<div class="sfEmpty">Your form line will build as fixtures finish.</div>';

  const story=strongest
    ? `Your strongest calls so far are <b>${sfEsc(strongest[1].toLowerCase())}</b> at ${Math.round(sfNum(strongest[2]?.scoring_pct))}% scoring. You predict <b>${stylePct(st.home)}% home wins</b>, <b>${stylePct(st.draw)}% draws</b> and <b>${stylePct(st.away)}% away wins</b>.`
    : 'Your prediction style will become clearer as more fixtures are scored.';

  return `
    <div class="sfCard sfHero">
      <div class="sfHead"><h2>👤 My season</h2><span>${sfEsc(sfName(p))}</span></div>
      <div class="sfGrid4">
        ${sfStat(sfOrd(p.current_position),'Position')}
        ${sfStat(p.points??0,'Points')}
        ${sfStat(p.exacts??0,'Exact scores')}
        ${sfStat(sfPct(p.scoring_pct),'Picks scoring')}
      </div>
      <div class="sfPills">
        ${sfNum(p.current_position)===1?sfPill('🏆 League leader','good'):sfPill(`${p.gap_to_leader??0} ${sfPlural(p.gap_to_leader,'pt')} behind leader`)}
        ${sfNum(p.current_position)>1?sfPill(`${p.gap_to_above??0} ${sfPlural(p.gap_to_above,'pt')} to next place`):''}
        ${sfPill(`${Math.abs(vs)} ${sfPlural(Math.abs(vs),'pt')} ${vs>=0?'above':'below'} league avg`,vs>=0?'good':'bad')}
        ${exactVs!==0?sfPill(`${Math.abs(exactVs)} ${sfPlural(Math.abs(exactVs),'exact')} ${exactVs>0?'above':'below'} avg`,exactVs>0?'good':'bad'):sfPill('Level with league exact avg')}
      </div>
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>🔥 My form</h3><span>Last five completed picks</span></div>
      <div class="sfForm">${formPills}</div>
      <div class="sfGrid3">
        ${sfStat(p.last5_points??0,'Last 5 pts')}
        ${sfStat(`${p.last5_scoring??0}/5`,'Picks scoring')}
        ${sfStat(p.last5_exacts??0,'Exacts')}
      </div>
      <div class="sfPills">
        ${sfPill(`Current run ${sfNum(p.current_scoring_streak)>=2?sfNum(p.current_scoring_streak):'—'}`)}
        ${sfPill(`Best scoring run ${p.longest_scoring_streak??0}`)}
        ${sfNum(p.longest_exact_streak)>=2?sfPill(`Best exact run ${p.longest_exact_streak}`,'gold'):''}
      </div>
      ${recent.length?`<details class="sfDetails"><summary>View last 5 matches</summary><div>${recent.map(sfFixtureRow).join('')}</div></details>`:''}
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>🎯 My prediction style</h3><span>What you call · how well it lands</span></div>
      <div class="sfGrid2">
        ${sfCall('Home wins',calls.home,'home')}
        ${sfCall('Draws',calls.draw,'draw')}
        ${sfCall('Away wins',calls.away,'away')}
        <div class="sfCall"><h4>Exact scores</h4><b>${p.exacts??0}/${p.predictions_scored??0}</b><p>${Math.round(sfNum(p.exact_pct))}% exactly right</p></div>
      </div>
      <div class="sfStory">${story}</div>
      ${closed>=5?`<div class="sfMiniTitle">Club reads</div><div class="sfGrid2"><div class="sfCall"><h4>Best club to call</h4><b>${sfEsc(p.best_club?.club||'Building…')}</b><p>${p.best_club?`${p.best_club.points} pts · ${p.best_club.scoring_pct}% scoring`:'Needs more results'}</p></div><div class="sfCall"><h4>Nemesis club</h4><b>${sfEsc(p.nemesis_club?.club||'Building…')}</b><p>${p.nemesis_club?`${p.nemesis_club.points} pts · ${p.nemesis_club.scoring_pct}% scoring`:'Needs more results'}</p></div></div>`:`<div class="sfSectionNote" style="margin-top:10px">Club reads become more useful after five completed matchweeks.</div>`}
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>🏆 My matchweeks</h3><span>${closed} completed ${sfPlural(closed,'round')}</span></div>
      <div class="sfGrid4">
        ${sfStat(avg.toFixed(1).replace('.0',''),'Avg pts / MW')}
        ${sfStat(best?.points??'–','Best MW',best?`MW${best.matchweek}`:'')}
        ${sfStat(p.matchweek_wins??0,'MW wins')}
        ${sfStat(`${p.weeks_above_average??0}/${closed||0}`,'Above avg')}
      </div>
      ${mws.length?`<details class="sfDetails"><summary>View matchweek history</summary><div class="sfRows">${mws.map(x=>`<div class="sfRow"><span><b>MW${sfEsc(x.matchweek)}</b><small>${sfEsc(x.exacts)} ${sfPlural(x.exacts,'exact')} · weekly ${sfOrd(x.weekly_position)}</small></span><span class="sfValue">${sfEsc(x.points)} pts<small>League ${sfOrd(x.league_position)}</small></span></div>`).join('')}</div></details>`:''}
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>🥇 My records</h3><span>Season bests</span></div>
      <div class="sfRows">
        <div class="sfRow"><span><b>Best league position</b><small>Highest point reached this season</small></span><span class="sfValue">${sfOrd(high)}</span></div>
        <div class="sfRow"><span><b>Lowest league position</b><small>Lowest point reached this season</small></span><span class="sfValue">${sfOrd(low)}</span></div>
        <div class="sfRow"><span><b>Best scoring streak</b><small>Consecutive fixtures earning points</small></span><span class="sfValue">${p.longest_scoring_streak??0}</span></div>
        <div class="sfRow"><span><b>Best exact streak</b><small>Consecutive exact scorelines</small></span><span class="sfValue">${p.longest_exact_streak??0}</span></div>
        <div class="sfRow"><span><b>Longest run without a point</b><small>Consecutive submitted predictions earning 0 points</small></span><span class="sfValue">${drought.longest_scoreless_games} games</span></div>
        <div class="sfRow"><span><b>Longest run without an exact</b><small>Consecutive fixture days with a prediction but no 3-pointer</small></span><span class="sfValue">${drought.longest_no_exact_days} days</span></div>
        <div class="sfRow"><span><b>Missed predictions</b><small>Completed fixtures without a sealed pick</small></span><span class="sfValue">${p.missed??0}</span></div>
      </div>
    </div>`;
}

function sfPredictionLeaders(players){
  const withStyle=players.filter(p=>p.prediction_style);
  const maxBy=key=>[...withStyle].sort((a,b)=>sfNum(b.prediction_style?.[key])-sfNum(a.prediction_style?.[key])||sfNum(b.points)-sfNum(a.points))[0]||null;
  const goals=[...withStyle].filter(p=>p.prediction_style?.avg_goals!=null);
  return {
    home:maxBy('home'),
    draw:maxBy('draw'),
    away:maxBy('away'),
    highGoals:[...goals].sort((a,b)=>Number(b.prediction_style.avg_goals)-Number(a.prediction_style.avg_goals))[0]||null,
    lowGoals:[...goals].sort((a,b)=>Number(a.prediction_style.avg_goals)-Number(b.prediction_style.avg_goals))[0]||null
  };
}

function sfLeagueAggregates(evidenceRows){
  const clubs=new Map();
  const fixtures=new Map();
  const droughts=[];

  function club(name){
    if(!clubs.has(name))clubs.set(name,{club:name,points:0,picks:0,scoring:0,exacts:0});
    return clubs.get(name);
  }

  for(const pack of evidenceRows||[]){
    const drought=sfDroughtStats(pack?.evidence||{});
    droughts.push({
      ...(pack?.player||{}),
      longest_scoreless_games:drought.longest_scoreless_games,
      longest_no_exact_days:drought.longest_no_exact_days
    });
    for(const x of pack?.evidence?.all_fixtures||[]){
      if(x.has_prediction===false)continue;
      const pts=sfNum(x.points);
      for(const name of [x.home_team,x.away_team].filter(Boolean)){
        const c=club(name);c.points+=pts;c.picks++;if(pts>0)c.scoring++;if(pts===3)c.exacts++;
      }
      const key=x.fixture_id||`${x.matchweek}|${x.home_team}|${x.away_team}`;
      if(!fixtures.has(key))fixtures.set(key,{key,matchweek:x.matchweek,home_team:x.home_team,away_team:x.away_team,picks:0,home:0,draw:0,away:0,exacts:0,scoring:0});
      const f=fixtures.get(key);f.picks++;if(pts===3)f.exacts++;if(pts>0)f.scoring++;
      const call=x.predicted_call||((x.predicted_home==null||x.predicted_away==null)?null:(x.predicted_home>x.predicted_away?'home':x.predicted_home<x.predicted_away?'away':'draw'));
      if(call&&f[call]!=null)f[call]++;
    }
  }

  const clubRows=[...clubs.values()].map(c=>({...c,avg:c.picks?c.points/c.picks:0,scoring_pct:c.picks?c.scoring*100/c.picks:0}));
  const fixtureRows=[...fixtures.values()].filter(f=>f.picks>=3).map(f=>{
    const hp=f.home/f.picks*100,dp=f.draw/f.picks*100,ap=f.away/f.picks*100;
    const splitGap=Math.abs(hp-33.333)+Math.abs(dp-33.333)+Math.abs(ap-33.333);
    return {...f,home_pct:hp,draw_pct:dp,away_pct:ap,splitGap};
  });

  const maxZero=Math.max(0,...droughts.map(x=>sfNum(x.longest_scoreless_games)));
  const maxNoExact=Math.max(0,...droughts.map(x=>sfNum(x.longest_no_exact_days)));
  const zeroHolders=droughts.filter(x=>sfNum(x.longest_scoreless_games)===maxZero&&maxZero>0);
  const noExactHolders=droughts.filter(x=>sfNum(x.longest_no_exact_days)===maxNoExact&&maxNoExact>0);
  const longestScoreless=zeroHolders[0]?{...zeroHolders[0],tied_count:zeroHolders.length}:null;
  const longestNoExact=noExactHolders[0]?{...noExactHolders[0],tied_count:noExactHolders.length}:null;

  return {
    clubs:clubRows,
    fixtures:fixtureRows,
    mostRewarding:[...clubRows].sort((a,b)=>b.points-a.points||b.avg-a.avg)[0]||null,
    leastRewarding:[...clubRows].filter(x=>x.picks>0).sort((a,b)=>a.points-b.points||a.avg-b.avg)[0]||null,
    exactMagnet:[...clubRows].sort((a,b)=>b.exacts-a.exacts||b.points-a.points)[0]||null,
    mostExactsFixture:[...fixtureRows].sort((a,b)=>b.exacts-a.exacts||b.scoring-a.scoring)[0]||null,
    mostDivided:[...fixtureRows].sort((a,b)=>a.splitGap-b.splitGap)[0]||null,
    longestScoreless,
    longestNoExact
  };
}

function sfDramaSummary(d){
  const bad=d?.what_could_have_been||{};
  const good=d?.lucky_or_psychic||{};
  const badChanges=bad.changed_predictions_lost||[];
  const badLate=bad.late_goal_losses||[];
  const goodChanges=good.changed_predictions_won||[];
  const goodLate=good.late_goal_wins||[];
  const first=good.first_call_exacts||[];
  const topFirst=first[0];
  return `<div class="sfCard"><div class="sfHead"><h3>🎭 Fine margins</h3><span>The stories behind the points</span></div><div class="sfDramaGrid"><div class="sfDrama bad"><h4>💔 What could have been</h4><p>Changed picks, late heartbreak and one-goal near misses.</p><b class="big">${sfNum(bad.one_goal_from_exact_count)}</b><p>predictions one goal from turning 1 point into an exact 3.</p></div><div class="sfDrama good"><h4>🔮 Lucky or psychic?</h4><p>Inspired changes, late rescues and calls nailed from the start.</p><b class="big">${sfNum(goodChanges.length)+sfNum(goodLate.length)}</b><p>recorded decisions or late swings that gained points.</p></div></div><details class="sfDetails"><summary>See fine-margin stories</summary><div class="sfMiniTitle">Regrets</div>${badChanges.slice(0,2).map(x=>`<div class="sfRow"><span><b>${sfEsc(x.display_name||x.team_name||'Player')}</b><small>Changed ${sfEsc(x.before)} → ${sfEsc(x.after)} · ${sfEsc(x.fixture)}</small></span><span class="sfValue">−${sfEsc(x.points_lost||0)} pt</span></div>`).join('')||'<div class="sfEmpty">No costly completed changes yet.</div>'}${badLate.slice(0,2).map(x=>`<div class="sfRow"><span><b>${sfEsc(x.display_name||x.team_name||'Player')}</b><small>${sfEsc(x.minute)}\' late goal · ${sfEsc(x.fixture)}</small></span><span class="sfValue">−${sfEsc(x.points_lost||0)} pt</span></div>`).join('')}<div class="sfMiniTitle">Inspired</div>${goodChanges.slice(0,2).map(x=>`<div class="sfRow"><span><b>${sfEsc(x.display_name||x.team_name||'Player')}</b><small>Changed ${sfEsc(x.before)} → ${sfEsc(x.after)} · ${sfEsc(x.fixture)}</small></span><span class="sfValue">+${sfEsc(x.points_gained||0)} pt</span></div>`).join('')||'<div class="sfEmpty">No point-winning completed changes yet.</div>'}${goodLate.slice(0,2).map(x=>`<div class="sfRow"><span><b>${sfEsc(x.display_name||x.team_name||'Player')}</b><small>${sfEsc(x.minute)}\' late goal · ${sfEsc(x.fixture)}</small></span><span class="sfValue">+${sfEsc(x.points_gained||0)} pt</span></div>`).join('')}${topFirst?`<div class="sfStory">🎯 <b>${sfEsc(topFirst.display_name||topFirst.team_name||'Player')}</b> leads “called it from the start” with <b>${sfEsc(topFirst.exact_from_first_save||0)} exacts</b>.</div>`:''}</details></div>`;
}

function sfLeagueHtml(agg=null){
  const d=sfDashboard||{};
  const players=sfProfiles?.players||[];
  const dashboardPlayers=d.players||[];
  const ins=d.league_insights||{};
  const rec=d.records||{};
  const form=d.form||{};
  const ai=d.ai||{};
  const behavior=sfPredictionLeaders(players);
  const top=[...players].sort((a,b)=>sfNum(a.current_position)-sfNum(b.current_position)||sfNum(b.points)-sfNum(a.points))[0]||null;
  const exact=[...players].sort((a,b)=>sfNum(b.exacts)-sfNum(a.exacts)||sfNum(b.points)-sfNum(a.points))[0]||null;
  const accuracy=[...dashboardPlayers].filter(x=>sfNum(x.predictions_scored)>0).sort((a,b)=>sfNum(b.outcome_pct)-sfNum(a.outcome_pct)||sfNum(b.points)-sfNum(a.points))[0]||null;
  const hot=form.hot?.[0]||null;
  const totalPreds=players.reduce((a,p)=>a+sfNum(p.predictions_scored),0);
  const totalExacts=players.reduce((a,p)=>a+sfNum(p.exacts),0);
  const closed=sfNum(sfProfiles?.closed_matchweeks);
  const popular=ins.most_popular_scoreline;
  const fooled=ins.fixture_that_fooled_most;
  const bestCalled=ins.most_correctly_called_fixture;
  const predictable=ins.most_predictable_club;
  const chaos=ins.least_predictable_club;

  const clubHtml=agg?`
    <div class="sfRows">
      ${agg.mostRewarding?`<div class="sfRow"><span><b>💰 Most rewarding club</b><small>Most prediction points earned in its matches</small></span><span class="sfValue">${sfEsc(agg.mostRewarding.club)}<small>${agg.mostRewarding.points} pts · ${agg.mostRewarding.avg.toFixed(2)} per pick</small></span></div>`:''}
      ${agg.leastRewarding?`<div class="sfRow"><span><b>😩 Least rewarding club</b><small>Fewest prediction points earned in its matches</small></span><span class="sfValue">${sfEsc(agg.leastRewarding.club)}<small>${agg.leastRewarding.points} pts · ${agg.leastRewarding.avg.toFixed(2)} per pick</small></span></div>`:''}
      ${predictable?`<div class="sfRow"><span><b>✅ Most predictable club</b><small>Highest correct-outcome rate</small></span><span class="sfValue">${sfEsc(predictable.club)}<small>${sfEsc(predictable.correct_pct)}% correct</small></span></div>`:''}
      ${chaos?`<div class="sfRow"><span><b>🤯 Hardest club to predict</b><small>Lowest correct-outcome rate</small></span><span class="sfValue">${sfEsc(chaos.club)}<small>${sfEsc(chaos.correct_pct)}% correct</small></span></div>`:''}
      ${agg.exactMagnet?`<div class="sfRow"><span><b>🎯 Exact-score magnet</b><small>Club whose matches produced the most exacts</small></span><span class="sfValue">${sfEsc(agg.exactMagnet.club)}<small>${agg.exactMagnet.exacts} exacts</small></span></div>`:''}
    </div>`:`<div class="sfEmpty">Calculating club points from the league's sealed prediction history…</div>`;

  const divided=agg?.mostDivided;
  const maxExact=agg?.mostExactsFixture;

  return `
    <div class="sfCard sfHero">
      <div class="sfHead"><h2>🌍 Our league</h2><span>Season snapshot</span></div>
      <div class="sfGrid4">
        ${sfStat(players.length,'Players')}
        ${sfStat(d.completed_matches??0,'Matches scored')}
        ${sfStat(totalPreds,'Predictions')}
        ${sfStat(totalExacts,'Exact predictions')}
      </div>
      ${closed<5?'<div class="sfStory"><b>Early-season sample.</b> The personality and club sections will become more meaningful as more matchweeks are completed.</div>':''}
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>🏆 League leaders</h3><span>Right now</span></div>
      ${sfRank(top,`${top?.points??0} pts`,'League leader')}
      ${sfRank(exact,`${exact?.exacts??0} exacts`,'Most exact scores')}
      ${sfRank(accuracy,`${accuracy?.outcome_pct??0}%`,'Best outcome accuracy')}
      ${hot?sfRank(hot,`${hot.points??0} pts`,`Best recent form · last ${d.form_window_matchweeks||3} MW`):''}
    </div>

    ${form.hot?.length||form.cold?.length?`<div class="sfCard"><div class="sfHead"><h3>🔥 Form</h3><span>Recent completed matchweeks</span></div><div class="sfGrid2"><div><div class="sfMiniTitle" style="margin-top:0">Hot</div>${(form.hot||[]).slice(0,3).map(x=>sfRank(x,`${x.points??0} pts`)).join('')||'<div class="sfEmpty">Building…</div>'}</div><div><div class="sfMiniTitle" style="margin-top:0">Cold</div>${(form.cold||[]).slice(0,3).map(x=>sfRank(x,`${x.points??0} pts`)).join('')||'<div class="sfEmpty">Building…</div>'}</div></div></div>`:''}

    <div class="sfCard">
      <div class="sfHead"><h3>🧠 How our league predicts</h3><span>Prediction personalities</span></div>
      <div class="sfRows">
        ${behavior.home?`<div class="sfRow"><span><b>🏠 Most home wins predicted</b><small>${sfEsc(sfName(behavior.home))}</small></span><span class="sfValue">${sfNum(behavior.home.prediction_style.home)}</span></div>`:''}
        ${behavior.away?`<div class="sfRow"><span><b>✈️ Most away wins predicted</b><small>${sfEsc(sfName(behavior.away))}</small></span><span class="sfValue">${sfNum(behavior.away.prediction_style.away)}</span></div>`:''}
        ${behavior.draw?`<div class="sfRow"><span><b>🤝 Most draws predicted</b><small>${sfEsc(sfName(behavior.draw))}</small></span><span class="sfValue">${sfNum(behavior.draw.prediction_style.draw)}</span></div>`:''}
        ${behavior.highGoals?`<div class="sfRow"><span><b>⚽ Highest predicted goals</b><small>${sfEsc(sfName(behavior.highGoals))}</small></span><span class="sfValue">${Number(behavior.highGoals.prediction_style.avg_goals).toFixed(2)}<small>goals / match</small></span></div>`:''}
        ${behavior.lowGoals?`<div class="sfRow"><span><b>🔒 Lowest predicted goals</b><small>${sfEsc(sfName(behavior.lowGoals))}</small></span><span class="sfValue">${Number(behavior.lowGoals.prediction_style.avg_goals).toFixed(2)}<small>goals / match</small></span></div>`:''}
        ${popular?`<div class="sfRow"><span><b>🎲 Favourite scoreline</b><small>Most commonly predicted by the league</small></span><span class="sfValue">${sfEsc(popular.home)}–${sfEsc(popular.away)}</span></div>`:''}
      </div>
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>⚽ Club insights</h3><span>Which teams help — and hurt — our scores?</span></div>
      ${clubHtml}
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>🎭 Matches that defined us</h3><span>Best calls · biggest traps</span></div>
      <div class="sfRows">
        ${fooled?`<div class="sfRow"><span><b>😱 Nobody saw it coming</b><small>${sfEsc(fooled.home_team)} v ${sfEsc(fooled.away_team)}</small></span><span class="sfValue">${sfEsc(fooled.correct_pct)}%<small>called correctly</small></span></div>`:''}
        ${bestCalled?`<div class="sfRow"><span><b>👏 Everyone knew it</b><small>${sfEsc(bestCalled.home_team)} v ${sfEsc(bestCalled.away_team)}</small></span><span class="sfValue">${sfEsc(bestCalled.correct_pct)}%<small>called correctly</small></span></div>`:''}
        ${maxExact&&maxExact.exacts>0?`<div class="sfRow"><span><b>🎯 Most exact scores</b><small>${sfEsc(maxExact.home_team)} v ${sfEsc(maxExact.away_team)} · MW${sfEsc(maxExact.matchweek)}</small></span><span class="sfValue">${maxExact.exacts}<small>exact predictions</small></span></div>`:''}
      </div>
      ${divided?`<div class="sfMiniTitle">Most divided fixture</div><div class="sfStory"><b>${sfEsc(divided.home_team)} v ${sfEsc(divided.away_team)}</b><div class="sfSplit" style="margin:8px 0 5px"><i class="h" style="width:${divided.home_pct}%"></i><i class="d" style="width:${divided.draw_pct}%"></i><i class="a" style="width:${divided.away_pct}%"></i></div>Home ${Math.round(divided.home_pct)}% · Draw ${Math.round(divided.draw_pct)}% · Away ${Math.round(divided.away_pct)}%</div>`:''}
    </div>

    <div class="sfCard">
      <div class="sfHead"><h3>📚 League records</h3><span>Season bests</span></div>
      ${rec.highest_matchweek_score?sfRank(rec.highest_matchweek_score,`${rec.highest_matchweek_score.points} pts`,`Highest MW score · MW${rec.highest_matchweek_score.matchweek}`):''}
      ${rec.most_exacts_in_matchweek?sfRank(rec.most_exacts_in_matchweek,`${rec.most_exacts_in_matchweek.exacts} exacts`,`Most exacts in a MW · MW${rec.most_exacts_in_matchweek.matchweek}`):''}
      ${rec.longest_scoring_streak?sfRank(rec.longest_scoring_streak,rec.longest_scoring_streak.longest_scoring_streak??0,'Longest scoring streak'):''}
      ${rec.longest_exact_streak?sfRank(rec.longest_exact_streak,rec.longest_exact_streak.longest_exact_streak??0,'Longest exact streak'):''}
      ${agg?.longestScoreless?sfRank(
        agg.longestScoreless,
        `${agg.longestScoreless.longest_scoreless_games} games${sfNum(agg.longestScoreless.tied_count)>1?` · ${agg.longestScoreless.tied_count} tied`:''}`,
        'Longest run without a point'
      ):''}
      ${agg?.longestNoExact?sfRank(
        agg.longestNoExact,
        `${agg.longestNoExact.longest_no_exact_days} days${sfNum(agg.longestNoExact.tied_count)>1?` · ${agg.longestNoExact.tied_count} tied`:''}`,
        'Longest exact drought · fixture days'
      ):''}
    </div>

    ${sfDrama?sfDramaSummary(sfDrama):''}

    <div class="sfCard">
      <div class="sfHead"><h3>🤖 Humans vs AI</h3><span>${sfEsc(ai.team_name||'Expected Goals FC')}</span></div>
      <div class="sfGrid3">
        ${sfStat(ai.points??0,'AI points')}
        ${sfStat(ai.exacts??0,'AI exacts')}
        ${sfStat(ai.humans_currently_beating_ai??0,'Humans ahead')}
      </div>
    </div>`;
}

function sfFindStatsHeader(){
  return [...document.querySelectorAll('#main > .card')].find(card=>{
    const h=card.querySelector('.section h2');
    return h&&h.textContent.replace('📊','').trim()==='Stats';
  })||null;
}

function sfPrepareHeader(card){
  if(!card)return;
  const notes=card.querySelectorAll('.notice');
  if(notes[0])notes[0].innerHTML='Your season first. Switch to <b>League Stats</b> for leaders, prediction personalities, club insights and the stories behind the points.';
  const unlock=card.querySelector('.unlockRow');
  if(unlock)unlock.style.display='none';
  if(notes[1])notes[1].style.display='none';
}

function sfHideLegacy(header){
  const main=document.getElementById('main');
  if(!main)return;
  main.querySelectorAll('.ljs2-playerHost,.sdHost').forEach(x=>{x.classList.add('sfLegacyHidden');x.style.display='none'});
  [...main.children].forEach(el=>{
    if(el===header||el.classList.contains('sfHost'))return;
    if(!el.classList.contains('card'))return;
    const h=el.querySelector('.section h2');
    const title=(h?.textContent||'').replace(/[📊🏆🔥🧊🎯🌍🤖]/g,'').trim().toLowerCase();
    if(['your season','season leaders','who’s hot?','who\'s hot?','who’s not?','who\'s not?','records','league insights','humans vs ai'].includes(title)){el.classList.add('sfLegacyHidden');el.style.display='none'}
  });
}

function sfTabs(){
  return `<div class="sfTabs" role="tablist" aria-label="Statistics view"><button class="sfTab ${sfMode==='self'?'active':''}" data-sf-mode="self" role="tab" aria-selected="${sfMode==='self'}">👤 My Stats</button><button class="sfTab ${sfMode==='league'?'active':''}" data-sf-mode="league" role="tab" aria-selected="${sfMode==='league'}">🌍 League Stats</button></div>`;
}

async function sfRender(host){
  if(!host?.isConnected)return;
  const keepHeight=Math.max(0,Math.round(host.getBoundingClientRect().height||0));
  if(keepHeight>120)host.style.minHeight=keepHeight+'px';
  host.innerHTML=sfTabs()+`<div class="sfLoading">Building ${sfMode==='self'?'your stats':'league stats'}…</div>`;
  try{
    await sfLoadCore(false);
    if(!host.isConnected)return;
    if(sfMode==='self'){
      const p=sfPlayer();
      if(!p){host.innerHTML=sfTabs()+'<div class="sfError">Couldn’t find your player stats yet.</div>';return}
      const e=await sfLoadSelfEvidence(false).catch(()=>null);
      host.innerHTML=sfTabs()+sfSelfHtml(p,e);
      // Quietly prepare the heavier league analysis while the user reads My Stats.
      sfLoadLeagueEvidence(false).catch(()=>{});
    }else{
      // Build League Stats once, after its evidence is ready, instead of drawing twice.
      const evidence=await sfLoadLeagueEvidence(false).catch(()=>[]);
      if(!host.isConnected||sfMode!=='league')return;
      const agg=sfLeagueAggregates(evidence);
      host.innerHTML=sfTabs()+sfLeagueHtml(agg);
    }
  }catch(e){
    if(host.isConnected)host.innerHTML=sfTabs()+`<div class="sfError">Couldn’t load the new stats view yet.<br>${sfEsc(e.message||String(e))}</div>`;
  }finally{
    if(host?.isConnected)host.style.minHeight='';
  }
}

async function sfInject(force=false){
  const active=sfActive();
  if(!active){sfWasActive=false;return}
  if(!sfWasActive){sfMode='self';sfWasActive=true}
  if(sfBusy)return;
  const main=document.getElementById('main');
  const header=sfFindStatsHeader();
  if(!main||!header)return;
  sfPrepareHeader(header);
  sfHideLegacy(header);

  let host=main.querySelector('.sfHost');
  if(!host){
    host=document.createElement('div');
    host.className='sfHost';
    header.insertAdjacentElement('afterend',host);
  }else if(header.nextElementSibling!==host){
    header.insertAdjacentElement('afterend',host);
  }

  if(host.dataset.sfRendered==='1'&&!force)return;
  sfBusy=true;
  try{
    await sfRender(host);
    host.dataset.sfRendered='1';
  }finally{sfBusy=false}
}

function sfSchedule(force=false,delay=220){
  clearTimeout(sfTimer);
  sfTimer=setTimeout(()=>sfInject(force),delay);
}

document.addEventListener('click',e=>{
  const btn=e.target.closest?.('[data-sf-mode]');
  if(!btn)return;
  const mode=btn.dataset.sfMode;
  if(!['self','league'].includes(mode)||mode===sfMode)return;
  sfMode=mode;
  const host=document.querySelector('.sfHost');
  if(host){host.dataset.sfRendered='0';sfRender(host)}
  window.scrollTo({top:Math.max(0,(document.querySelector('.sfHost')?.getBoundingClientRect().top||0)+window.scrollY-8),behavior:'smooth'});
});

const sfMain=document.getElementById('main');
if(sfMain)new MutationObserver(()=>{if(sfActive())sfHideLegacy(sfFindStatsHeader());sfSchedule(false,180)}).observe(sfMain,{childList:true,subtree:true});
window.addEventListener('focus',()=>{sfLoadedAt=0;sfEvidenceAt=0});

sfCss();
sfSchedule(true,900);
