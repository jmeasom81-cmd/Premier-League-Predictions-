// STATS EVIDENCE V1 - explain every player stat + form/streak fixture evidence
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sevSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const SEV_STYLE='sev-v1-style';
let sevCtx=null;
let sevBusy=false;
let sevTimer=null;
let sevProfiles=null;
let sevJourney=null;
let sevProfilesAt=0;
let sevJourneyAt=0;
const sevEvidence=new Map();

const sevEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

const sevOrd=n=>{
  n=+n||0;
  const s=['th','st','nd','rd'],v=n%100;
  return `${n}${s[(v-20)%10]||s[v]||s[0]}`;
};

function sevCss(){
  if(document.getElementById(SEV_STYLE))return;
  const s=document.createElement('style');
  s.id=SEV_STYLE;
  s.textContent=`
  .sev-click{cursor:pointer;position:relative;outline:none}
  .sev-click:after{content:'›';position:absolute;right:6px;top:5px;font-size:12px;color:#8e88a1;opacity:.7}
  .sev-click:focus{box-shadow:0 0 0 2px rgba(90,53,177,.18)}
  .sev-hint{font-size:9px;color:#817d8d;margin-top:8px;line-height:1.4}
  .sev-hint b{color:#5a35b1}
  .sev-form{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:8px}
  .sev-pick{border-radius:11px;text-align:center;padding:8px 3px;font-weight:950;font-size:15px;background:#f0eff5;color:#625e70}
  .sev-pick.exact{background:#e5f8f2;color:#08775c}.sev-pick.one{background:#fff3cf;color:#7b5a00}.sev-pick.zero{background:#fdebed;color:#a52b3a}
  .sev-pick small{display:block;font-size:7px;margin-top:2px;opacity:.75}
  .sev-summary3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
  .sev-summary4{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:7px}
  .sev-stat{background:#f6f5fa;border-radius:12px;padding:9px 5px;text-align:center;min-width:0}
  .sev-stat b{display:block;font-size:18px}.sev-stat span{font-size:8px;color:#797586;font-weight:900;text-transform:uppercase}
  .sev-subtitle{display:flex;justify-content:space-between;gap:8px;align-items:flex-end;margin:13px 0 6px}
  .sev-subtitle h4{font-size:12px;margin:0}.sev-subtitle small{font-size:8.5px;color:#858190;text-align:right}
  .sev-result{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #eeecf3}
  .sev-result:last-child{border-bottom:0}.sev-result b{font-size:11px}.sev-result small{display:block;color:#858190;font-size:8.5px;line-height:1.4;margin-top:2px}
  .sev-points{font-size:9px;font-weight:950;border-radius:999px;padding:5px 8px;white-space:nowrap;background:#fdebed;color:#a52b3a}
  .sev-points.one{background:#fff3cf;color:#7b5a00}.sev-points.exact{background:#e5f8f2;color:#08775c}.sev-points.missed{background:#f0eff5;color:#686474}
  .sev-modal{position:fixed;inset:0;z-index:3000;background:rgba(19,15,35,.48);display:flex;align-items:flex-end;justify-content:center;padding:12px}
  .sev-modal[hidden]{display:none}
  .sev-sheet{width:min(720px,100%);max-height:84vh;overflow:auto;background:#fff;border-radius:22px 22px 14px 14px;padding:16px;box-shadow:0 18px 55px rgba(0,0,0,.24)}
  .sev-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;position:sticky;top:-16px;background:#fff;padding:4px 0 10px;z-index:2}
  .sev-head h3{margin:0;font-size:18px}.sev-head p{font-size:10px;color:#817d8d;margin:4px 0 0;line-height:1.4}
  .sev-close{border:0;background:#efeff5;border-radius:12px;width:40px;height:40px;font-size:22px;color:#3f3a4e;flex:0 0 40px}
  .sev-calc{background:#f7f5fc;border:1px solid #e8e3f2;border-radius:13px;padding:10px 11px;font-size:10px;line-height:1.5;color:#514b60;margin-bottom:10px}
  .sev-calc b{color:#241153}
  .sev-mini-table{border:1px solid #ebe8f2;border-radius:13px;overflow:hidden;margin:8px 0 10px}
  .sev-mini-row{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:7px;padding:8px 9px;border-bottom:1px solid #eeecf3;align-items:center;font-size:10px}
  .sev-mini-row:last-child{border-bottom:0}.sev-mini-row.me{background:#f3efff}.sev-mini-row small{font-size:8px;color:#858190}
  .sev-empty{padding:13px;text-align:center;font-size:10px;color:#817d8d}
  @media(max-width:520px){.sev-sheet{padding:14px}.sev-mini-row{grid-template-columns:30px minmax(0,1fr) auto}}
  `;
  document.head.appendChild(s);
}

function sevStatsActive(){
  return !!document.querySelector('#nav button[data-v="stats"].active');
}

async function sevContext(){
  if(sevCtx)return sevCtx;
  const {data:{session}}=await sevSb.auth.getSession();
  if(!session)return null;
  const {data,error}=await sevSb.from('league_members')
    .select('league_id,status')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .limit(1);
  if(error)throw error;
  if(!data?.length)return null;
  sevCtx={leagueId:data[0].league_id,userId:session.user.id};
  return sevCtx;
}

async function sevLoadProfiles(force=false){
  const c=await sevContext();
  if(!c)return null;
  if(!force&&sevProfiles&&Date.now()-sevProfilesAt<15000)return sevProfiles;
  const {data,error}=await sevSb.rpc('get_player_stats_profiles',{p_league_id:c.leagueId});
  if(error)throw error;
  sevProfiles=data||{};
  sevProfilesAt=Date.now();
  return sevProfiles;
}

async function sevLoadJourney(force=false){
  const c=await sevContext();
  if(!c)return null;
  if(!force&&sevJourney&&Date.now()-sevJourneyAt<30000)return sevJourney;
  const {data,error}=await sevSb.rpc('get_league_journey',{p_league_id:c.leagueId});
  if(error)throw error;
  sevJourney=data||{};
  sevJourneyAt=Date.now();
  return sevJourney;
}

async function sevLoadEvidence(userId,force=false){
  const c=await sevContext();
  if(!c||!userId)return null;
  const old=sevEvidence.get(userId);
  if(!force&&old&&Date.now()-old.at<15000)return old.data;
  const {data,error}=await sevSb.rpc('get_player_stats_evidence',{
    p_league_id:c.leagueId,
    p_user_id:userId
  });
  if(error)throw error;
  const out=data||{};
  sevEvidence.set(userId,{at:Date.now(),data:out});
  return out;
}

function sevSelectedUser(host){
  return host?.querySelector('[data-stats-user]')?.value||null;
}

function sevPlayer(profiles,userId){
  return (profiles?.players||[]).find(x=>String(x.user_id)===String(userId))||null;
}

function sevDate(i){
  if(!i)return '';
  return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/London',day:'numeric',month:'short'
  }).format(new Date(i));
}

function sevPointsClass(x){
  if(!x?.has_prediction&&x?.has_prediction!==undefined)return 'missed';
  return +x?.points===3?'exact':+x?.points===1?'one':'';
}

function sevFixtureRow(x){
  const actual=x.actual_home==null||x.actual_away==null?'–':`${x.actual_home}–${x.actual_away}`;
  const pick=x.has_prediction===false?'No prediction':(
    x.predicted_home==null||x.predicted_away==null?'No prediction':`${x.predicted_home}–${x.predicted_away}`
  );
  const pts=+x.points||0;
  const label=x.has_prediction===false?'Missed':pts===3?'+3 exact':pts===1?'+1 outcome':'0 pts';
  return `<div class="sev-result">
    <div><b>${sevEsc(x.home_team)} ${sevEsc(actual)} ${sevEsc(x.away_team)}</b>
      <small>Prediction ${sevEsc(pick)} · MW${sevEsc(x.matchweek||'')} · ${sevEsc(sevDate(x.kickoff_at))}</small>
    </div>
    <span class="sev-points ${sevPointsClass(x)}">${label}</span>
  </div>`;
}

function sevRowsHtml(rows){
  if(!rows?.length)return '<div class="sev-empty">No fixtures match this stat yet.</div>';
  return rows.map(sevFixtureRow).join('');
}

function sevEnsureModal(){
  let m=document.getElementById('sev-modal');
  if(m)return m;
  m=document.createElement('div');
  m.id='sev-modal';
  m.className='sev-modal';
  m.hidden=true;
  m.innerHTML=`<div class="sev-sheet" role="dialog" aria-modal="true" aria-labelledby="sev-title">
    <div class="sev-head"><div><h3 id="sev-title"></h3><p id="sev-sub"></p></div><button class="sev-close" type="button" aria-label="Close">×</button></div>
    <div id="sev-body"></div>
  </div>`;
  document.body.appendChild(m);
  m.querySelector('.sev-close').addEventListener('click',()=>sevClose());
  m.addEventListener('click',e=>{if(e.target===m)sevClose()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)sevClose()});
  return m;
}

function sevClose(){
  const m=document.getElementById('sev-modal');
  if(m)m.hidden=true;
}

function sevOpen(title,sub,calc,rows=[],extra=''){
  const m=sevEnsureModal();
  m.querySelector('#sev-title').textContent=title;
  m.querySelector('#sev-sub').textContent=sub||'';
  m.querySelector('#sev-body').innerHTML=`${calc?`<div class="sev-calc">${calc}</div>`:''}${extra}${sevRowsHtml(rows)}`;
  m.hidden=false;
  m.querySelector('.sev-sheet').scrollTop=0;
}

function sevStandingsExtra(profiles,userId,mode='points'){
  const rows=(profiles?.players||[]).slice().sort((a,b)=>(+a.current_position||999)-(+b.current_position||999));
  if(!rows.length)return '';
  const idx=Math.max(0,rows.findIndex(x=>String(x.user_id)===String(userId)));
  const wanted=new Set([0,Math.max(0,idx-2),Math.max(0,idx-1),idx,Math.min(rows.length-1,idx+1),Math.min(rows.length-1,idx+2)]);
  const chosen=[...wanted].sort((a,b)=>a-b).map(i=>rows[i]).filter(Boolean);
  return `<div class="sev-mini-table">${chosen.map(x=>`<div class="sev-mini-row ${String(x.user_id)===String(userId)?'me':''}">
    <b>${sevOrd(x.current_position)}</b>
    <span><b>${sevEsc(x.team_name||x.display_name||'Player')}</b><small>${sevEsc(x.display_name||'')}</small></span>
    <b>${mode==='exacts'?(x.exacts??0)+' exact':(x.points??0)+' pts'}</b>
  </div>`).join('')}</div>`;
}

function sevMatchweekAverages(profiles){
  const by=new Map();
  for(const p of profiles?.players||[]){
    for(const m of p.matchweeks||[]){
      if(!by.has(+m.matchweek))by.set(+m.matchweek,[]);
      by.get(+m.matchweek).push(+m.points||0);
    }
  }
  const out=new Map();
  for(const [mw,arr] of by)out.set(mw,arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0);
  return out;
}

function sevJourneyCheckpoints(journey,userId){
  const cps=[];
  for(const cp of journey?.matchweeks||[]){
    const p=(cp.positions||[]).find(x=>String(x.entrant_id)===String(userId));
    if(p)cps.push({label:cp.label||`MW${cp.matchweek||''}`,position:+p.position||0,points:+p.points||0});
  }
  return cps;
}

function sevCheckpointExtra(rows,targetPos){
  const matches=rows.filter(x=>+x.position===+targetPos);
  if(!matches.length)return '';
  return `<div class="sev-mini-table">${matches.map(x=>`<div class="sev-mini-row">
    <b>${sevOrd(x.position)}</b><span><b>${sevEsc(x.label)}</b><small>Recorded checkpoint</small></span><b>${x.points} pts</b>
  </div>`).join('')}</div>`;
}

function sevFormCard(card,evidence){
  const recent=evidence?.recent_form||[];
  const curScore=evidence?.current_scoring_streak||[];
  const bestScore=evidence?.longest_scoring_streak||[];
  const curExact=evidence?.current_exact_streak||[];
  const bestExact=evidence?.longest_exact_streak||[];
  const pts=recent.reduce((a,x)=>a+(+x.points||0),0);
  const scoring=recent.filter(x=>(+x.points||0)>0).length;
  const exacts=recent.filter(x=>x.is_exact).length;
  const tiles=recent.length?recent.map(x=>{
    const p=+x.points||0;
    return `<div class="sev-pick ${p===3?'exact':p===1?'one':'zero'}">${p}<small>${p===3?'EXACT':p===1?'1 PT':'0'}</small></div>`;
  }).join(''):'<div class="sev-empty">Form will build as results are scored.</div>';

  card.innerHTML=`
    <div class="ljs2-title" style="margin-top:0"><h3>🔥 Current form</h3><small>Latest five scored fixtures</small></div>
    <div class="sev-form">${tiles}</div>
    <div class="sev-summary3">
      <div class="sev-stat sev-click" data-sev-key="last5_points"><b>${pts}</b><span>Last 5 pts</span></div>
      <div class="sev-stat sev-click" data-sev-key="last5_scoring"><b>${scoring}/${recent.length||5}</b><span>Scored</span></div>
      <div class="sev-stat sev-click" data-sev-key="last5_exacts"><b>${exacts}</b><span>Last 5 exacts</span></div>
    </div>
    <div class="sev-summary4">
      <div class="sev-stat sev-click" data-sev-key="current_scoring"><b>${curScore.length}</b><span>Current scoring streak</span></div>
      <div class="sev-stat sev-click" data-sev-key="best_scoring"><b>${bestScore.length}</b><span>Best scoring streak</span></div>
      <div class="sev-stat sev-click" data-sev-key="current_exact"><b>${curExact.length}</b><span>Current exact streak</span></div>
      <div class="sev-stat sev-click" data-sev-key="best_exact"><b>${bestExact.length}</b><span>Best exact streak</span></div>
    </div>
    ${recent.length?`<div class="sev-subtitle"><h4>Results behind the form</h4><small>Newest first</small></div>${recent.map(sevFixtureRow).join('')}`:''}
    <div class="sev-hint"><b>Tap any number</b> to see exactly how it is calculated.</div>
  `;
}

function sevLabel(el){
  return (el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
}

function sevKeyFor(el){
  if(el.dataset.sevKey)return el.dataset.sevKey;
  const t=sevLabel(el);
  const card=el.closest('.ljs2-card');
  const ct=sevLabel(card||el);

  if(el.classList.contains('ljs2-stat')){
    const lab=sevLabel(el.querySelector('span')||el);
    if(lab==='live position')return 'position';
    if(lab==='points')return 'points';
    if(lab==='exacts')return 'exacts';
    if(lab==='scoring picks')return ct.includes('current form')?'last5_scoring':'scoring_pct';
    if(lab==='pts / pick')return 'points_per_pick';
    if(lab==='missed')return 'missed';
    if(lab==='mw wins')return 'mw_wins';
    if(lab==='top 3s')return 'top3';
    if(lab==='above avg')return 'above_avg';
  }

  if(el.classList.contains('ljs2-pill')){
    if(t.includes('ahead of '))return 'ahead_pct';
    if(t.includes(' pts vs avg'))return 'points_vs_avg';
    if(t.includes(' exacts vs avg'))return 'exacts_vs_avg';
    if(t.includes(' pts to place above'))return 'gap_above';
    if(t.includes(' pts off leader'))return 'gap_leader';
    if(t.includes('last completed mw'))return 'last_mw_move';
    if(t.includes('avg pts / mw'))return 'avg_mw';
    if(/^home \d+%/.test(t))return 'dna_home';
    if(/^draw \d+%/.test(t))return 'dna_draw';
    if(/^away \d+%/.test(t))return 'dna_away';
    if(t.startsWith('favourite '))return 'favourite_score';
    if(t.includes('predicted goals/match'))return 'pred_goals_avg';
    if(t.includes('actual goals/match'))return 'actual_goals_avg';
    if(t.includes('goal bias'))return 'goal_bias';
  }

  if(el.classList.contains('ljs2-box')){
    const h=sevLabel(el.querySelector('h4')||el);
    if(h==='season high')return 'season_high';
    if(h==='season low')return 'season_low';
    if(h==='home calls')return 'call_home';
    if(h==='draw calls')return 'call_draw';
    if(h==='away calls')return 'call_away';
    if(h==='exact rate')return 'exact_rate';
    if(h==='best club to call')return 'best_club';
    if(h==='nemesis club')return 'nemesis_club';
  }

  if(el.classList.contains('ljs2-bar')){
    const first=sevLabel(el.querySelector('span')||el);
    if(first==='exact scores')return 'exact_points';
    if(first==='outcomes')return 'outcome_points';
    if(first==='scoring picks')return 'scoring_fixtures';
  }

  if(el.classList.contains('ljs2-row')){
    if(t.includes('best round'))return 'best_round';
    if(t.includes('lowest round'))return 'worst_round';
    const m=t.match(/\bmw\s*(\d+)\b/i);
    if(m)return `mw:${m[1]}`;
  }
  return '';
}

function sevMark(host){
  host.querySelectorAll('.ljs2-stat,.ljs2-pill,.ljs2-box,.ljs2-bar,.ljs2-row,.sev-stat').forEach(el=>{
    const key=sevKeyFor(el);
    if(!key)return;
    el.dataset.sevKey=key;
    el.classList.add('sev-click');
    if(!el.hasAttribute('tabindex'))el.tabIndex=0;
    el.setAttribute('role','button');
    el.setAttribute('aria-label',`${(el.textContent||'Stat').replace(/\s+/g,' ').trim()} — show details`);
  });
}

function sevAddHint(host){
  const playerCard=host.querySelector('.ljs2-player');
  if(!playerCard||playerCard.querySelector('.sev-hint'))return;
  const hint=document.createElement('div');
  hint.className='sev-hint';
  hint.innerHTML='<b>Every stat is explainable.</b> Tap a stat, comparison, round or insight to see the evidence behind it.';
  playerCard.appendChild(hint);
}

function sevSyncHeadline(host,p){
  if(!p)return;
  const values={
    'live position':sevOrd(p.current_position),
    'points':p.points??0,
    'exacts':p.exacts??0,
    'scoring picks':`${p.scoring_pct??0}%`,
    'pts / pick':p.points_per_prediction??0,
    'missed':p.missed??0,
    'mw wins':p.matchweek_wins??0,
    'top 3s':p.top_three_finishes??0,
    'above avg':p.weeks_above_average??0
  };
  host.querySelectorAll('.ljs2-stat').forEach(el=>{
    const lab=sevLabel(el.querySelector('span')||el);
    if(Object.prototype.hasOwnProperty.call(values,lab)){
      const b=el.querySelector('b');
      if(b)b.textContent=values[lab];
    }
  });
}

function sevByMw(evidence,mw){
  return (evidence?.all_fixtures||[]).filter(x=>+x.matchweek===+mw);
}

function sevAllPred(evidence){
  return (evidence?.all_fixtures||[]).filter(x=>x.has_prediction!==false);
}

async function sevDetail(key,userId){
  const [profiles,evidence,journey]=await Promise.all([
    sevLoadProfiles(true),sevLoadEvidence(userId,true),sevLoadJourney(false)
  ]);
  const p=sevPlayer(profiles,userId);
  if(!p||!evidence)return;

  const all=evidence.all_fixtures||[];
  const preds=all.filter(x=>x.has_prediction!==false);
  const scored=preds.filter(x=>(+x.points||0)>0);
  const exact=preds.filter(x=>x.is_exact);
  const outcome=preds.filter(x=>!x.is_exact&&x.is_correct_outcome);
  const missed=all.filter(x=>x.has_prediction===false);
  const mws=p.matchweeks||[];
  const mwAvg=sevMatchweekAverages(profiles);
  const checkpoints=sevJourneyCheckpoints(journey,userId);

  switch(key){
    case 'position':
      return sevOpen('Live position',p.team_name||p.display_name,
        `<b>${sevOrd(p.current_position)}</b> in a league of ${p.player_count||0} human players. Ranking uses points, then exact scores, then correct outcomes.`,
        [],sevStandingsExtra(profiles,userId,'points'));
    case 'points':
      return sevOpen('Points',`${p.points??0} total points`,
        `<b>${p.points??0} points</b> = ${p.exact_points??0} from exact scores + ${p.outcome_points??0} from non-exact correct outcomes. Exact = 3, outcome = 1.`,
        scored);
    case 'exacts':
      return sevOpen('Exact scores',`${p.exacts??0} exact predictions`,
        `<b>${p.exacts??0}</b> predictions matched the final score exactly. Each is worth 3 points.`,
        exact);
    case 'scoring_pct':
      return sevOpen('Scoring picks',`${p.scoring_pct??0}%`,
        `<b>${p.scoring_picks??0}</b> scoring predictions ÷ <b>${p.predictions_scored??0}</b> submitted predictions × 100 = <b>${p.scoring_pct??0}%</b>.`,
        preds);
    case 'points_per_pick':
      return sevOpen('Points per pick',`${p.points_per_prediction??0} points`,
        `<b>${p.points??0}</b> total points ÷ <b>${p.predictions_scored??0}</b> submitted predictions = <b>${p.points_per_prediction??0}</b> points per pick.`,
        preds);
    case 'missed':
      return sevOpen('Missed predictions',`${p.missed??0} missed`,
        `A missed prediction is a completed fixture where no sealed prediction existed at the deadline.`,
        missed);
    case 'ahead_pct':
      return sevOpen('Ahead of the league',`Ahead of ${p.beating_percent??0}%`,
        `With position <b>${sevOrd(p.current_position)}</b> among ${p.player_count||0} players, this measures the proportion of league players currently below this player.`,
        [],sevStandingsExtra(profiles,userId,'points'));
    case 'points_vs_avg':
      return sevOpen('Points vs league average',`${(+p.points_vs_league_average||0)>=0?'+':''}${p.points_vs_league_average??0}`,
        `Player: <b>${p.points??0}</b> points. League average: <b>${p.league_average?.points??0}</b>. Difference: <b>${(+p.points_vs_league_average||0)>=0?'+':''}${p.points_vs_league_average??0}</b>.`,
        [],sevStandingsExtra(profiles,userId,'points'));
    case 'exacts_vs_avg':
      return sevOpen('Exacts vs league average',`${(+p.exacts_vs_league_average||0)>=0?'+':''}${p.exacts_vs_league_average??0}`,
        `Player: <b>${p.exacts??0}</b> exacts. League average: <b>${p.league_average?.exacts??0}</b>. Difference: <b>${(+p.exacts_vs_league_average||0)>=0?'+':''}${p.exacts_vs_league_average??0}</b>.`,
        [],sevStandingsExtra(profiles,userId,'exacts'));
    case 'gap_above':
      return sevOpen('Gap to the place above',`${p.gap_to_above??0} points`,
        `Points needed to draw level with the team immediately above in the current ranked order. Tie-breakers can still determine the final position when points are level.`,
        [],sevStandingsExtra(profiles,userId,'points'));
    case 'gap_leader':
      return sevOpen('Gap to leader',`${p.gap_to_leader??0} points`,
        `Current leader's points minus this player's points = <b>${p.gap_to_leader??0}</b>.`,
        [],sevStandingsExtra(profiles,userId,'points'));
    case 'season_high':
      return sevOpen('Season high',sevOrd(p.highest_position),
        `Best recorded league position from completed matchweek checkpoints plus the current live position.`,
        [],sevCheckpointExtra(checkpoints,p.highest_position));
    case 'season_low':
      return sevOpen('Season low',sevOrd(p.lowest_position),
        `Lowest recorded league position from completed matchweek checkpoints plus the current live position.`,
        [],sevCheckpointExtra(checkpoints,p.lowest_position));
    case 'last5_points':
      return sevOpen('Last 5 points',`${(evidence.recent_form||[]).reduce((a,x)=>a+(+x.points||0),0)} points`,
        `Total points earned across the latest five submitted predictions.`,
        evidence.recent_form||[]);
    case 'last5_scoring':
      return sevOpen('Last 5 scoring picks',`${(evidence.recent_form||[]).filter(x=>+x.points>0).length}/${(evidence.recent_form||[]).length||5}`,
        `A scoring pick earned either 3 points for an exact score or 1 point for the correct outcome.`,
        evidence.recent_form||[]);
    case 'last5_exacts':
      return sevOpen('Last 5 exacts',`${(evidence.recent_form||[]).filter(x=>x.is_exact).length}`,
        `Exact-score predictions among the latest five submitted predictions.`,
        evidence.recent_form||[]);
    case 'current_scoring':
      return sevOpen('Current scoring streak',`${(evidence.current_scoring_streak||[]).length} matches`,
        `Consecutive submitted predictions scoring 1 or 3 points, counting backwards from the latest completed fixture. A 0-point prediction ends the streak.`,
        evidence.current_scoring_streak||[]);
    case 'best_scoring':
      return sevOpen('Best scoring streak',`${(evidence.longest_scoring_streak||[]).length} matches`,
        `Longest run this season of consecutive predictions scoring 1 or 3 points.`,
        evidence.longest_scoring_streak||[]);
    case 'current_exact':
      return sevOpen('Current exact-score streak',`${(evidence.current_exact_streak||[]).length} matches`,
        `Consecutive exact-score predictions counting backwards from the latest completed fixture.`,
        evidence.current_exact_streak||[]);
    case 'best_exact':
      return sevOpen('Best exact-score streak',`${(evidence.longest_exact_streak||[]).length} matches`,
        `Longest run this season of consecutive exact-score predictions.`,
        evidence.longest_exact_streak||[]);
    case 'mw_wins':{
      const wins=mws.filter(x=>+x.weekly_position===1);
      const rows=wins.flatMap(x=>sevByMw(evidence,x.matchweek));
      return sevOpen('Matchweek wins',`${wins.length} win${wins.length===1?'':'s'}`,
        `A Matchweek Win means finishing <b>1st</b> for points in that completed matchweek, using the usual tie-breaks.`,
        rows,`<div class="sev-mini-table">${wins.map(x=>`<div class="sev-mini-row"><b>MW${x.matchweek}</b><span><b>${x.points} pts</b><small>${x.exacts} exact${+x.exacts===1?'':'s'}</small></span><b>${sevOrd(x.weekly_position)}</b></div>`).join('')||'<div class="sev-empty">No matchweek wins yet.</div>'}</div>`);
    }
    case 'top3':{
      const top=mws.filter(x=>+x.weekly_position<=3);
      const rows=top.flatMap(x=>sevByMw(evidence,x.matchweek));
      return sevOpen('Top 3 finishes',`${top.length} finish${top.length===1?'':'es'}`,
        `Completed matchweeks where this player ranked 1st, 2nd or 3rd for that round.`,
        rows,`<div class="sev-mini-table">${top.map(x=>`<div class="sev-mini-row"><b>MW${x.matchweek}</b><span><b>${x.points} pts</b><small>${x.exacts} exact${+x.exacts===1?'':'s'}</small></span><b>${sevOrd(x.weekly_position)}</b></div>`).join('')||'<div class="sev-empty">No top-three finishes yet.</div>'}</div>`);
    }
    case 'above_avg':{
      const good=mws.filter(x=>(+x.points||0)>(mwAvg.get(+x.matchweek)||0));
      const rows=good.flatMap(x=>sevByMw(evidence,x.matchweek));
      return sevOpen('Matchweeks above average',`${good.length} matchweek${good.length===1?'':'s'}`,
        `Counts completed matchweeks where this player's points were above the human league average for that same round.`,
        rows,`<div class="sev-mini-table">${good.map(x=>`<div class="sev-mini-row"><b>MW${x.matchweek}</b><span><b>${x.points} pts</b><small>League avg ${(mwAvg.get(+x.matchweek)||0).toFixed(1)}</small></span><b>+${(x.points-(mwAvg.get(+x.matchweek)||0)).toFixed(1)}</b></div>`).join('')||'<div class="sev-empty">No above-average completed matchweeks yet.</div>'}</div>`);
    }
    case 'last_mw_move':{
      const last=mws[mws.length-1],prev=mws[mws.length-2];
      const move=last&&prev?(+prev.league_position)-(+last.league_position):0;
      return sevOpen('Last completed matchweek movement',last?`MW${last.matchweek}`:'No completed round',
        prev&&last?`Moved from <b>${sevOrd(prev.league_position)}</b> after MW${prev.matchweek} to <b>${sevOrd(last.league_position)}</b> after MW${last.matchweek}: ${move>0?'up '+move:move<0?'down '+Math.abs(move):'no net movement'}.`:`Needs at least two completed matchweeks.`,
        last?sevByMw(evidence,last.matchweek):[]);
    }
    case 'avg_mw':{
      const avg=mws.length?mws.reduce((a,x)=>a+(+x.points||0),0)/mws.length:0;
      return sevOpen('Average points per matchweek',avg.toFixed(2),
        `<b>${mws.reduce((a,x)=>a+(+x.points||0),0)}</b> points across <b>${mws.length}</b> completed matchweeks = <b>${avg.toFixed(2)}</b> per matchweek.`,
        []);
    }
    case 'best_round':{
      const mw=p.best_matchweek?.matchweek;
      return sevOpen('Best round',mw?`Matchweek ${mw}`:'Building',
        mw?`Highest completed matchweek score: <b>${p.best_matchweek.points} points</b>, ${p.best_matchweek.exacts} exact${+p.best_matchweek.exacts===1?'':'s'}, weekly position ${sevOrd(p.best_matchweek.position)}.`:'No completed matchweek yet.',
        mw?sevByMw(evidence,mw):[]);
    }
    case 'worst_round':{
      const mw=p.worst_matchweek?.matchweek;
      return sevOpen('Lowest round',mw?`Matchweek ${mw}`:'Building',
        mw?`Lowest completed matchweek score: <b>${p.worst_matchweek.points} points</b>, ${p.worst_matchweek.exacts} exact${+p.worst_matchweek.exacts===1?'':'s'}, weekly position ${sevOrd(p.worst_matchweek.position)}.`:'No completed matchweek yet.',
        mw?sevByMw(evidence,mw):[]);
    }
    case 'exact_points':
      return sevOpen('Points from exact scores',`${p.exact_points??0} points`,
        `${p.exacts??0} exact score${+p.exacts===1?'':'s'} × 3 points = <b>${p.exact_points??0}</b>.`,
        exact);
    case 'outcome_points':
      return sevOpen('Points from correct outcomes',`${p.outcome_points??0} points`,
        `Non-exact correct home/draw/away calls earn 1 point each.`,
        outcome);
    case 'scoring_fixtures':
      return sevOpen('Scoring predictions',`${p.scoring_picks??0}/${p.predictions_scored??0}`,
        `Every fixture where the prediction earned either 3 or 1 point.`,
        scored);
    case 'call_home':
    case 'call_draw':
    case 'call_away':{
      const call=key.replace('call_','');
      const rows=preds.filter(x=>x.predicted_call===call);
      const good=rows.filter(x=>+x.points>0).length;
      return sevOpen(`${call[0].toUpperCase()+call.slice(1)} calls`,`${good}/${rows.length} scored`,
        `<b>${good}</b> scoring picks from <b>${rows.length}</b> predictions calling a ${call} result = <b>${rows.length?Math.round(good*1000/rows.length)/10:0}%</b>.`,
        rows);
    }
    case 'exact_rate':
      return sevOpen('Exact-score rate',`${p.exact_pct??0}%`,
        `<b>${p.exacts??0}</b> exact scores ÷ <b>${p.predictions_scored??0}</b> submitted predictions × 100 = <b>${p.exact_pct??0}%</b>.`,
        exact);
    case 'best_club':{
      const club=p.best_club?.club;
      const rows=club?preds.filter(x=>x.home_team===club||x.away_team===club):[];
      return sevOpen('Best club to call',club||'Building',
        club?`Among clubs with at least two appearances in this player's scored history, <b>${sevEsc(club)}</b> currently has the best points-per-fixture record: ${p.best_club.avg_points} pts/match, ${p.best_club.scoring_pct}% scoring picks.`:'Needs more fixtures before this becomes meaningful.',
        rows);
    }
    case 'nemesis_club':{
      const club=p.nemesis_club?.club;
      const rows=club?preds.filter(x=>x.home_team===club||x.away_team===club):[];
      return sevOpen('Nemesis club',club||'Building',
        club?`Among clubs with at least two appearances, <b>${sevEsc(club)}</b> currently has this player's lowest points-per-fixture record: ${p.nemesis_club.avg_points} pts/match, ${p.nemesis_club.scoring_pct}% scoring picks.`:'Needs more fixtures before this becomes meaningful.',
        rows);
    }
    case 'dna_home':
    case 'dna_draw':
    case 'dna_away':{
      const call=key.replace('dna_','');
      const rows=preds.filter(x=>x.predicted_call===call);
      return sevOpen(`${call[0].toUpperCase()+call.slice(1)} prediction tendency`,`${rows.length} calls`,
        `<b>${rows.length}</b> of ${preds.length} submitted predictions called a ${call} result = <b>${preds.length?Math.round(rows.length*1000/preds.length)/10:0}%</b>.`,
        rows);
    }
    case 'favourite_score':{
      const fav=p.most_predicted_score;
      const rows=fav?preds.filter(x=>+x.predicted_home===+fav.home&&+x.predicted_away===+fav.away):[];
      return sevOpen('Favourite predicted score',fav?`${fav.home}–${fav.away}`:'Building',
        fav?`This scoreline has been predicted <b>${fav.uses}</b> time${+fav.uses===1?'':'s'} — more than any other exact scoreline used by this player.`:'No prediction history yet.',
        rows);
    }
    case 'pred_goals_avg':{
      const vals=preds.map(x=>(+x.predicted_home||0)+(+x.predicted_away||0));
      const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
      return sevOpen('Average predicted goals',avg.toFixed(2),
        `Total predicted goals ÷ submitted predictions = <b>${avg.toFixed(2)}</b> goals per match.`,
        preds);
    }
    case 'actual_goals_avg':{
      const vals=all.map(x=>(+x.actual_home||0)+(+x.actual_away||0));
      const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
      return sevOpen('Average actual goals',avg.toFixed(2),
        `Total actual goals across scored fixtures ÷ scored fixtures = <b>${avg.toFixed(2)}</b> goals per match.`,
        all);
    }
    case 'goal_bias':{
      const pv=preds.map(x=>(+x.predicted_home||0)+(+x.predicted_away||0));
      const av=all.map(x=>(+x.actual_home||0)+(+x.actual_away||0));
      const pa=pv.length?pv.reduce((a,b)=>a+b,0)/pv.length:0;
      const aa=av.length?av.reduce((a,b)=>a+b,0)/av.length:0;
      const diff=pa-aa;
      return sevOpen('Goal bias',`${diff>=0?'+':''}${diff.toFixed(2)}`,
        `Average predicted goals <b>${pa.toFixed(2)}</b> minus average actual goals <b>${aa.toFixed(2)}</b> = <b>${diff>=0?'+':''}${diff.toFixed(2)}</b>. Positive means the player tends to predict more goals than actually occur.`,
        preds);
    }
    default:
      if(key.startsWith('mw:')){
        const mw=+key.split(':')[1];
        const row=mws.find(x=>+x.matchweek===mw);
        return sevOpen(`Matchweek ${mw}`,row?`${row.points} points · weekly ${sevOrd(row.weekly_position)}`:'Matchweek detail',
          row?`League position after this completed round: <b>${sevOrd(row.league_position)}</b>. Exacts: <b>${row.exacts}</b>.`:'Fixture-level evidence for this round.',
          sevByMw(evidence,mw));
      }
  }
}

async function sevEnhance(force=false){
  if(!sevStatsActive()||sevBusy)return;
  const host=document.querySelector('.ljs2-playerHost');
  if(!host)return;
  const userId=sevSelectedUser(host);
  if(!userId)return;
  const formHeading=[...host.querySelectorAll('h3')].find(h=>(h.textContent||'').includes('Current form'));
  const formCard=formHeading?.closest('.ljs2-card');
  if(!formCard)return;

  sevBusy=true;
  try{
    const [profiles,evidence]=await Promise.all([sevLoadProfiles(force),sevLoadEvidence(userId,force)]);
    if(!host.isConnected||sevSelectedUser(host)!==userId)return;
    const p=sevPlayer(profiles,userId);
    sevSyncHeadline(host,p);
    sevFormCard(formCard,evidence);
    sevAddHint(host);
    sevMark(host);
  }catch(e){
    console.warn('Stats Evidence',e);
  }finally{
    sevBusy=false;
  }
}

function sevSchedule(force=false){
  clearTimeout(sevTimer);
  sevTimer=setTimeout(()=>sevEnhance(force),140);
}

document.addEventListener('click',e=>{
  const el=e.target.closest?.('.sev-click,[data-sev-key]');
  if(!el||!document.querySelector('.ljs2-playerHost')?.contains(el))return;
  const key=sevKeyFor(el);
  const host=document.querySelector('.ljs2-playerHost');
  const userId=sevSelectedUser(host);
  if(key&&userId)sevDetail(key,userId).catch(err=>console.warn('Stats detail',err));
});

document.addEventListener('keydown',e=>{
  if(!['Enter',' '].includes(e.key))return;
  const el=e.target.closest?.('.sev-click,[data-sev-key]');
  if(!el||!document.querySelector('.ljs2-playerHost')?.contains(el))return;
  e.preventDefault();
  el.click();
});

document.addEventListener('change',e=>{
  if(e.target?.matches?.('[data-stats-user]')){
    sevSchedule(true);
  }
});

const sevMain=document.getElementById('main');
if(sevMain)new MutationObserver(()=>sevSchedule(false)).observe(sevMain,{childList:true,subtree:true});

window.addEventListener('focus',()=>sevSchedule(true));
setInterval(()=>{if(sevStatsActive())sevEnhance(true)},20000);

sevCss();
sevEnsureModal();
sevSchedule(true);
