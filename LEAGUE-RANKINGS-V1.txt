// LEAGUE RANKINGS V1
// Full-league comparison charts for the Premier League Predictions app.
// Uses existing proven Stats RPCs only. No scoring, lock or stored prediction changes.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const lrSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let lrCtx=null;
let lrData=null;
let lrLoadPromise=null;
let lrTimer=null;
let lrCategory='accuracy';
let lrMetric='outcome';
let lrView='chart';

const lrEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const lrNum=v=>Number(v||0);
const lrName=p=>p?.team_name||p?.display_name||'Player';
const lrBadge=p=>p?.badge||'⚽';

function lrCss(){
  if(document.getElementById('lr-v1-css'))return;
  const s=document.createElement('style');
  s.id='lr-v1-css';
  s.textContent=`
    .lrCard{background:#fff;border:1px solid #e8e7ef;border-radius:18px;padding:15px;margin-bottom:12px;box-shadow:0 8px 24px rgba(25,18,65,.055)}
    .lrHead{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:11px}
    .lrHead h3{margin:0;color:#241153;font-size:15px}
    .lrHead span{font-size:8.5px;color:#817c8c;text-align:right;line-height:1.3}
    .lrCats{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;background:#f0eef5;padding:4px;border-radius:14px;margin-bottom:9px}
    .lrCat{border:0;background:transparent;border-radius:10px;padding:8px 3px;color:#746f7d;font-size:7.6px;font-weight:950;line-height:1.15}
    .lrCat.active{background:#fff;color:#241153;box-shadow:0 3px 9px rgba(35,20,80,.08)}
    .lrMetrics{display:flex;gap:5px;overflow:auto;padding:1px 0 7px;scrollbar-width:none}
    .lrMetrics::-webkit-scrollbar{display:none}
    .lrMetric{border:1px solid #e3dfeb;background:#faf9fc;color:#716b7b;border-radius:999px;padding:7px 9px;font-size:7.8px;font-weight:900;white-space:nowrap}
    .lrMetric.active{background:#4b269d;border-color:#4b269d;color:#fff}
    .lrTopline{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:2px 0 10px}
    .lrExplainer{font-size:8.5px;color:#817c8c;line-height:1.4;max-width:72%}
    .lrToggle{display:grid;grid-template-columns:1fr 1fr;background:#f0eef5;border-radius:10px;padding:3px;gap:2px}
    .lrToggle button{border:0;background:transparent;border-radius:8px;padding:6px 7px;font-size:7.5px;font-weight:950;color:#807a89}
    .lrToggle button.active{background:#fff;color:#241153}
    .lrRows{display:grid;gap:7px}
    .lrRow{display:grid;grid-template-columns:minmax(0,108px) minmax(0,1fr) 58px;gap:8px;align-items:center}
    .lrWho{min-width:0;font-size:8.5px;color:#4e4858;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lrWho small{display:block;font-size:6.9px;color:#9a95a2;font-weight:800;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lrBarTrack{height:13px;border-radius:999px;background:#eeeaf4;overflow:hidden;position:relative}
    .lrBar{height:100%;border-radius:999px;background:linear-gradient(90deg,#6b47ba,#4b269d);min-width:2px}
    .lrVal{text-align:right;font-size:9.5px;font-weight:950;color:#241153;white-space:nowrap}
    .lrVal small{display:block;font-size:6.7px;color:#9b96a4;font-weight:800;margin-top:1px}
    .lrRank{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;font-size:7px;font-weight:950;background:#f0edf6;color:#5c4d77;margin-right:4px}
    .lrRow:first-child .lrRank{background:#fff2c8;color:#7b5a00}
    .lrNote{margin-top:10px;padding:9px 10px;border-radius:12px;background:#f8f7fb;color:#716b7d;font-size:8px;line-height:1.42}
    .lrTableWrap{overflow:auto}
    .lrTable{width:100%;border-collapse:collapse;font-size:8.5px}
    .lrTable th{font-size:7px;color:#918b99;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:7px 4px;border-bottom:1px solid #e9e6ef}
    .lrTable th:last-child,.lrTable td:last-child{text-align:right}
    .lrTable td{padding:8px 4px;border-bottom:1px solid #efedf3;color:#554f5e}
    .lrTable td b{color:#241153;font-size:8.8px}
    .lrTable tr:last-child td{border-bottom:0}
    .lrEmpty{border:1px dashed #ddd9e5;background:#faf9fc;border-radius:13px;padding:13px;text-align:center;font-size:8.5px;color:#85808e;line-height:1.45}
    .lrLoading{padding:20px 10px;text-align:center;font-size:9px;color:#817c8c}
    @media(max-width:520px){
      .lrCard{padding:13px}
      .lrCats{grid-template-columns:repeat(5,1fr)}
      .lrCat{font-size:7px;padding:8px 2px}
      .lrRow{grid-template-columns:minmax(0,92px) minmax(0,1fr) 54px;gap:6px}
      .lrWho{font-size:7.8px}
      .lrVal{font-size:8.7px}
      .lrBarTrack{height:12px}
    }
  `;
  document.head.appendChild(s);
}

function lrCall(h,a){
  if(h==null||a==null)return null;
  return Number(h)>Number(a)?'home':Number(h)<Number(a)?'away':'draw';
}

async function lrContext(){
  if(lrCtx)return lrCtx;
  const {data:{session}}=await lrSb.auth.getSession();
  if(!session)return null;

  const {data,error}=await lrSb.from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error)throw error;
  if(!data?.length)return null;
  lrCtx={leagueId:data[0].league_id,userId:session.user.id};
  return lrCtx;
}

async function lrMapLimit(items,limit,worker){
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

async function lrLoad(){
  if(lrData)return lrData;
  if(lrLoadPromise)return lrLoadPromise;

  lrLoadPromise=(async()=>{
    const c=await lrContext();
    if(!c)return null;

    const [profilesRes,dramaRes]=await Promise.all([
      lrSb.rpc('get_player_stats_profiles',{p_league_id:c.leagueId}),
      lrSb.rpc('get_stats_drama',{p_league_id:c.leagueId})
    ]);

    if(profilesRes.error)throw profilesRes.error;

    const profiles=profilesRes.data||{};
    const players=profiles.players||[];

    const packs=await lrMapLimit(players,6,async p=>{
      const {data,error}=await lrSb.rpc('get_player_stats_evidence',{
        p_league_id:c.leagueId,
        p_user_id:p.user_id
      });
      if(error)throw error;
      return {player:p,evidence:data||{}};
    });

    lrData=lrAnalyse(profiles,packs.filter(Boolean),dramaRes.error?null:dramaRes.data);
    return lrData;
  })();

  try{return await lrLoadPromise}
  finally{lrLoadPromise=null}
}

function lrAnalyse(profiles,packs,drama){
  const fixtures=new Map();
  const playerMap=new Map();

  function ps(player){
    const id=String(player?.user_id||'');
    if(!playerMap.has(id))playerMap.set(id,{
      player,
      totalRows:0,
      submitted:0,
      points:0,
      scoring:0,
      exacts:0,
      drawCalls:0,
      drawHits:0,
      withinOneTotal:0,
      scoreDistance:0,
      validScoreRows:0,
      oneFromExact:0,
      predGoals:0,
      actualGoals:0,
      goalRows:0,
      fixturePicks:[]
    });
    return playerMap.get(id);
  }

  for(const pack of packs){
    const p=pack.player||{};
    const stat=ps(p);
    const rows=pack?.evidence?.all_fixtures||[];

    for(const x of rows){
      stat.totalRows++;
      if(x.has_prediction===false || x.predicted_home==null || x.predicted_away==null)continue;

      stat.submitted++;
      const pts=lrNum(x.points);
      stat.points+=pts;
      if(pts>0)stat.scoring++;
      if(pts===3 || x.is_exact)stat.exacts++;

      const pcall=x.predicted_call||lrCall(x.predicted_home,x.predicted_away);
      const acall=lrCall(x.actual_home,x.actual_away);

      if(pcall==='draw'){
        stat.drawCalls++;
        if(acall==='draw')stat.drawHits++;
      }

      const key=String(x.fixture_id||`${x.matchweek}|${x.home_team}|${x.away_team}`);
      if(!fixtures.has(key))fixtures.set(key,{
        key,home_team:x.home_team,away_team:x.away_team,matchweek:x.matchweek,picks:[]
      });

      fixtures.get(key).picks.push({
        user_id:p.user_id,
        call:pcall,
        correct:!!x.is_correct_outcome || pts>0,
        ph:Number(x.predicted_home),
        pa:Number(x.predicted_away)
      });

      stat.fixturePicks.push({key,call:pcall,correct:!!x.is_correct_outcome || pts>0});

      if(x.actual_home!=null && x.actual_away!=null){
        const predTotal=Number(x.predicted_home)+Number(x.predicted_away);
        const actualTotal=Number(x.actual_home)+Number(x.actual_away);
        const totalErr=Math.abs(predTotal-actualTotal);
        const dist=Math.abs(Number(x.predicted_home)-Number(x.actual_home))+
                   Math.abs(Number(x.predicted_away)-Number(x.actual_away));

        stat.validScoreRows++;
        stat.scoreDistance+=dist;
        if(totalErr<=1)stat.withinOneTotal++;
        if(dist===1)stat.oneFromExact++;

        stat.predGoals+=predTotal;
        stat.actualGoals+=actualTotal;
        stat.goalRows++;
      }
    }
  }

  const fixtureMajority=new Map();
  for(const [key,f] of fixtures){
    let h=0,d=0,a=0;
    for(const p of f.picks){
      if(p.call==='home')h++;
      else if(p.call==='draw')d++;
      else if(p.call==='away')a++;
    }
    const max=Math.max(h,d,a);
    const winners=[['home',h],['draw',d],['away',a]].filter(x=>x[1]===max);
    fixtureMajority.set(key,winners.length===1?winners[0][0]:null);
  }

  const rows=[...playerMap.values()].map(s=>{
    let contra=0,contraHits=0;
    for(const pick of s.fixturePicks){
      const majority=fixtureMajority.get(pick.key);
      if(!majority||!pick.call||pick.call===majority)continue;
      contra++;
      if(pick.correct)contraHits++;
    }

    const mw=Array.isArray(s.player?.matchweeks)?s.player.matchweeks:[];
    const mwPoints=mw.map(x=>lrNum(x.points));
    const mwAvg=mwPoints.length?mwPoints.reduce((a,b)=>a+b,0)/mwPoints.length:0;
    const mwStd=mwPoints.length?Math.sqrt(mwPoints.reduce((a,b)=>a+Math.pow(b-mwAvg,2),0)/mwPoints.length):null;

    return {
      player:s.player,
      submitted:s.submitted,
      totalRows:s.totalRows,
      outcomePct:s.submitted?s.scoring*100/s.submitted:0,
      ppp:s.submitted?s.points/s.submitted:0,
      completionPct:s.totalRows?s.submitted*100/s.totalRows:0,
      exactRate:s.submitted?s.exacts*100/s.submitted:0,
      exactConversion:s.scoring?s.exacts*100/s.scoring:0,
      exacts:s.exacts,
      scoring:s.scoring,
      withinOnePct:s.validScoreRows?s.withinOneTotal*100/s.validScoreRows:0,
      avgScoreDistance:s.validScoreRows?s.scoreDistance/s.validScoreRows:999,
      oneFromExactPct:s.validScoreRows?s.oneFromExact*100/s.validScoreRows:0,
      drawAccuracy:s.drawCalls?s.drawHits*100/s.drawCalls:0,
      drawCalls:s.drawCalls,
      contrarianPct:contra?contraHits*100/contra:0,
      contrarianPicks:contra,
      contrarianHits:contraHits,
      recentPoints:lrNum(s.player?.last5_points),
      matchweekWins:lrNum(s.player?.matchweek_wins),
      scoringStreak:lrNum(s.player?.longest_scoring_streak),
      exactStreak:lrNum(s.player?.longest_exact_streak),
      consistency:mwStd,
      mwAvg,
      predGoalsAvg:s.goalRows?s.predGoals/s.goalRows:0,
      actualGoalsAvg:s.goalRows?s.actualGoals/s.goalRows:0,
      goalsBias:s.goalRows?(s.predGoals-s.actualGoals)/s.goalRows:0,
      homeShare:lrNum(s.player?.prediction_style?.home),
      drawShare:lrNum(s.player?.prediction_style?.draw),
      awayShare:lrNum(s.player?.prediction_style?.away),
      profilePredGoals:lrNum(s.player?.prediction_style?.avg_goals),
      changesNet:0
    };
  });

  // Fine Margins data gives us known point-winning/lost changes.
  const byName=new Map();
  for(const r of rows){
    for(const key of [
      String(r.player?.display_name||'').toLowerCase(),
      String(r.player?.team_name||'').toLowerCase()
    ].filter(Boolean)) byName.set(key,r);
  }

  const won=drama?.lucky_or_psychic?.changed_predictions_won||[];
  const lost=drama?.what_could_have_been?.changed_predictions_lost||[];

  for(const x of won){
    const r=byName.get(String(x.display_name||x.team_name||'').toLowerCase());
    if(r)r.changesNet+=lrNum(x.points_gained);
  }
  for(const x of lost){
    const r=byName.get(String(x.display_name||x.team_name||'').toLowerCase());
    if(r)r.changesNet-=lrNum(x.points_lost);
  }

  return rows;
}

const LR_METRICS={
  accuracy:{
    label:'Accuracy',
    metrics:[
      {key:'outcome',label:'Outcome accuracy',field:'outcomePct',higher:true,min:1,fmt:v=>`${v.toFixed(1)}%`,sub:r=>`${r.scoring}/${r.submitted} scoring`},
      {key:'ppp',label:'Points / prediction',field:'ppp',higher:true,min:1,fmt:v=>v.toFixed(2),sub:r=>`${r.submitted} picks`},
      {key:'completion',label:'Completion rate',field:'completionPct',higher:true,min:1,fmt:v=>`${v.toFixed(1)}%`,sub:r=>`${r.submitted}/${r.totalRows} completed`},
      {key:'draws',label:'Draw accuracy',field:'drawAccuracy',higher:true,minDraws:3,fmt:v=>`${v.toFixed(1)}%`,sub:r=>`${r.drawCalls} draw calls`},
      {key:'contrarian',label:'Contrarian success',field:'contrarianPct',higher:true,minContrarian:3,fmt:v=>`${v.toFixed(1)}%`,sub:r=>`${r.contrarianHits}/${r.contrarianPicks} right`}
    ]
  },
  exacts:{
    label:'Exacts',
    metrics:[
      {key:'exactRate',label:'Exact rate',field:'exactRate',higher:true,min:1,fmt:v=>`${v.toFixed(1)}%`,sub:r=>`${r.exacts}/${r.submitted} exact`},
      {key:'exactConversion',label:'Exact conversion',field:'exactConversion',higher:true,minScoring:5,fmt:v=>`${v.toFixed(1)}%`,sub:r=>`${r.exacts}/${r.scoring} correct outcomes`},
      {key:'oneFrom',label:'One goal from exact',field:'oneFromExactPct',higher:true,min:1,fmt:v=>`${v.toFixed(1)}%`,sub:r=>'score distance = 1'},
      {key:'exactStreak',label:'Longest exact streak',field:'exactStreak',higher:true,min:0,fmt:v=>`${Math.round(v)}`,sub:r=>'consecutive exacts'}
    ]
  },
  goals:{
    label:'Goals',
    metrics:[
      {key:'withinOne',label:'Within 1 total goal',field:'withinOnePct',higher:true,min:1,fmt:v=>`${v.toFixed(1)}%`,sub:r=>'of completed picks'},
      {key:'distance',label:'Score precision',field:'avgScoreDistance',higher:false,maxBad:900,fmt:v=>`${v.toFixed(2)}`,sub:r=>'avg goals away'},
      {key:'predGoals',label:'Predicted goals / match',field:'predGoalsAvg',higher:true,min:1,fmt:v=>v.toFixed(2),sub:r=>`actual ${r.actualGoalsAvg.toFixed(2)}`},
      {key:'bias',label:'Goals bias',field:'goalsBias',higher:true,allowNegative:true,fmt:v=>`${v>=0?'+':''}${v.toFixed(2)}`,sub:r=>vBias(r)}
    ]
  },
  form:{
    label:'Form',
    metrics:[
      {key:'recent',label:'Last 5 points',field:'recentPoints',higher:true,min:0,fmt:v=>`${Math.round(v)} pts`,sub:r=>'recent completed picks'},
      {key:'mwWins',label:'Matchweek wins',field:'matchweekWins',higher:true,min:0,fmt:v=>`${Math.round(v)}`,sub:r=>'top-scoring rounds'},
      {key:'consistent',label:'Consistency',field:'consistency',higher:false,allowNull:false,fmt:v=>v.toFixed(2),sub:r=>`${r.mwAvg.toFixed(1)} avg MW pts`},
      {key:'scoreStreak',label:'Scoring streak',field:'scoringStreak',higher:true,min:0,fmt:v=>`${Math.round(v)}`,sub:r=>'longest run scoring'}
    ]
  },
  style:{
    label:'Style',
    metrics:[
      {key:'home',label:'Home wins picked',field:'homeShare',higher:true,min:0,fmt:v=>`${Math.round(v)}`,sub:r=>'predictions'},
      {key:'drawStyle',label:'Draws picked',field:'drawShare',higher:true,min:0,fmt:v=>`${Math.round(v)}`,sub:r=>'predictions'},
      {key:'away',label:'Away wins picked',field:'awayShare',higher:true,min:0,fmt:v=>`${Math.round(v)}`,sub:r=>'predictions'},
      {key:'changeNet',label:'Net points from changes',field:'changesNet',higher:true,allowNegative:true,fmt:v=>`${v>=0?'+':''}${Math.round(v)} pts`,sub:r=>'known changed picks'}
    ]
  }
};

function vBias(r){
  const v=r.goalsBias;
  if(Math.abs(v)<0.05)return 'almost perfectly neutral';
  return v>0?'predicts more goals than reality':'predicts fewer goals than reality';
}

function lrMetricDef(){
  const cat=LR_METRICS[lrCategory]||LR_METRICS.accuracy;
  return cat.metrics.find(x=>x.key===lrMetric)||cat.metrics[0];
}

function lrRowsFor(def){
  let rows=(lrData||[]).filter(r=>{
    if(def.minDraws && r.drawCalls<def.minDraws)return false;
    if(def.minContrarian && r.contrarianPicks<def.minContrarian)return false;
    if(def.minScoring && r.scoring<def.minScoring)return false;
    const v=r[def.field];
    if(v==null || !Number.isFinite(Number(v)))return false;
    if(def.maxBad!=null && Number(v)>=def.maxBad)return false;
    return true;
  });

  rows.sort((a,b)=>{
    const av=Number(a[def.field]),bv=Number(b[def.field]);
    if(av===bv)return lrName(a.player).localeCompare(lrName(b.player));
    return def.higher?bv-av:av-bv;
  });
  return rows;
}

function lrBarWidth(rows,def,row){
  if(!rows.length)return 0;
  const vals=rows.map(r=>Number(r[def.field]));
  const min=Math.min(...vals),max=Math.max(...vals);
  const v=Number(row[def.field]);
  if(max===min)return 100;

  if(def.higher){
    if(def.allowNegative){
      return 18 + 82*((v-min)/(max-min));
    }
    return Math.max(5,100*(v/max));
  }
  return 18 + 82*((max-v)/(max-min));
}

function lrExplainer(def){
  const map={
    outcome:'How often a submitted prediction earns at least one point.',
    ppp:'Average league points earned per submitted prediction.',
    completion:'How many completed fixtures had a prediction saved.',
    draws:'When a player predicts a draw, how often the match actually finishes level.',
    contrarian:'Success rate when a player backs a different outcome from the league majority.',
    exactRate:'Exact scores as a percentage of all submitted completed predictions.',
    exactConversion:'Of correct outcomes, how often the player also nailed the exact score.',
    oneFrom:'How often the complete scoreline was only one goal away from exact.',
    exactStreak:'Longest run of consecutive exact-score predictions.',
    withinOne:'Percentage of matches where predicted total goals were within one of reality.',
    distance:'Average combined home/away score error. Lower is better; bars are inverted so longer still means better.',
    predGoals:'Average total goals predicted in each completed match.',
    bias:'Predicted-goals average minus actual-goals average. Positive = more optimistic about goals.',
    recent:'Points earned from the player’s latest five completed predictions.',
    mwWins:'Number of matchweeks finished as the top scorer.',
    consistent:'Variation in matchweek points. Lower is steadier; bars are inverted so longer means more consistent.',
    scoreStreak:'Longest run of consecutive predictions that earned points.',
    home:'How many completed predictions were home wins.',
    drawStyle:'How many completed predictions were draws.',
    away:'How many completed predictions were away wins.',
    changeNet:'Known points gained minus points lost from changed predictions recorded in Fine Margins.'
  };
  return map[def.key]||'League-wide ranking.';
}

function lrChartHtml(rows,def){
  if(!rows.length)return '<div class="lrEmpty">Not enough data for this ranking yet.</div>';
  return `<div class="lrRows">${rows.map((r,i)=>{
    const v=Number(r[def.field]);
    return `<div class="lrRow">
      <div class="lrWho"><span class="lrRank">${i+1}</span>${lrEsc(lrBadge(r.player))} ${lrEsc(lrName(r.player))}
        ${r.player?.display_name&&r.player?.display_name!==r.player?.team_name?`<small>${lrEsc(r.player.display_name)}</small>`:''}
      </div>
      <div class="lrBarTrack"><div class="lrBar" style="width:${lrBarWidth(rows,def,r).toFixed(1)}%"></div></div>
      <div class="lrVal">${lrEsc(def.fmt(v))}<small>${lrEsc(def.sub(r))}</small></div>
    </div>`;
  }).join('')}</div>`;
}

function lrTableHtml(rows,def){
  if(!rows.length)return '<div class="lrEmpty">Not enough data for this ranking yet.</div>';
  return `<div class="lrTableWrap"><table class="lrTable">
    <thead><tr><th>#</th><th>Team</th><th>${lrEsc(def.label)}</th></tr></thead>
    <tbody>${rows.map((r,i)=>{
      const v=Number(r[def.field]);
      return `<tr><td><b>${i+1}</b></td><td><b>${lrEsc(lrBadge(r.player))} ${lrEsc(lrName(r.player))}</b>${r.player?.display_name&&r.player?.display_name!==r.player?.team_name?`<div style="font-size:6.8px;color:#999">${lrEsc(r.player.display_name)}</div>`:''}</td><td><b>${lrEsc(def.fmt(v))}</b><div style="font-size:6.8px;color:#999">${lrEsc(def.sub(r))}</div></td></tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function lrCategoryTabs(){
  return `<div class="lrCats">${Object.entries(LR_METRICS).map(([key,c])=>
    `<button class="lrCat ${lrCategory===key?'active':''}" data-lr-cat="${key}">${lrEsc(c.label)}</button>`
  ).join('')}</div>`;
}

function lrMetricTabs(){
  const cat=LR_METRICS[lrCategory]||LR_METRICS.accuracy;
  if(!cat.metrics.some(x=>x.key===lrMetric))lrMetric=cat.metrics[0].key;
  return `<div class="lrMetrics">${cat.metrics.map(m=>
    `<button class="lrMetric ${lrMetric===m.key?'active':''}" data-lr-metric="${m.key}">${lrEsc(m.label)}</button>`
  ).join('')}</div>`;
}

function lrContent(){
  const def=lrMetricDef();
  const rows=lrRowsFor(def);
  return `
    ${lrCategoryTabs()}
    ${lrMetricTabs()}
    <div class="lrTopline">
      <div class="lrExplainer">${lrEsc(lrExplainer(def))}</div>
      <div class="lrToggle">
        <button data-lr-view="chart" class="${lrView==='chart'?'active':''}">Bars</button>
        <button data-lr-view="table" class="${lrView==='table'?'active':''}">Table</button>
      </div>
    </div>
    ${lrView==='chart'?lrChartHtml(rows,def):lrTableHtml(rows,def)}
    <div class="lrNote">Rankings use completed prediction evidence only. Where a stat can be misleading on a tiny sample — such as draws or contrarian picks — a minimum sample is required before a player appears.</div>`;
}

function lrFindLeagueHost(){
  const host=document.querySelector('.sfHost');
  if(!host)return null;
  const records=[...host.querySelectorAll('.sfCard')].find(c=>
    (c.querySelector('h3')?.textContent||'').includes('League records')
  );
  if(!records)return null;
  return {host,records};
}

function lrRenderInto(card){
  const body=card.querySelector('.lrBody');
  if(!body)return;
  body.innerHTML=lrContent();
}

function lrWire(card){
  card.addEventListener('click',e=>{
    const cat=e.target.closest?.('[data-lr-cat]');
    if(cat){
      lrCategory=cat.dataset.lrCat;
      lrMetric=(LR_METRICS[lrCategory]||LR_METRICS.accuracy).metrics[0].key;
      lrRenderInto(card);
      return;
    }

    const metric=e.target.closest?.('[data-lr-metric]');
    if(metric){
      lrMetric=metric.dataset.lrMetric;
      lrRenderInto(card);
      return;
    }

    const view=e.target.closest?.('[data-lr-view]');
    if(view){
      lrView=view.dataset.lrView;
      lrRenderInto(card);
    }
  });
}

async function lrInject(){
  const found=lrFindLeagueHost();
  if(!found)return;

  if(found.host.querySelector('.lrLeagueRankings'))return;

  let card=document.createElement('div');
  card.className='lrCard lrLeagueRankings';
  card.innerHTML=`<div class="lrHead"><h3>📊 League rankings</h3><span>Every team · top to bottom</span></div><div class="lrBody"><div class="lrLoading">Building the league rankings…</div></div>`;
  found.records.insertAdjacentElement('beforebegin',card);
  lrWire(card);

  try{
    await lrLoad();
    if(!card.isConnected)return;
    lrRenderInto(card);
  }catch(e){
    console.warn('League Rankings:',e);
    if(card.isConnected)card.querySelector('.lrBody').innerHTML='<div class="lrEmpty">League rankings could not load yet.</div>';
  }
}

function lrSchedule(delay=160){
  clearTimeout(lrTimer);
  lrTimer=setTimeout(lrInject,delay);
}

lrCss();

const lrMain=document.getElementById('main');
if(lrMain){
  new MutationObserver(()=>lrSchedule(180)).observe(lrMain,{childList:true,subtree:true});
}

document.addEventListener('click',e=>{
  if(e.target.closest?.('#nav button[data-v="stats"],.sfTab[data-sf-mode="league"]')){
    lrSchedule(250);
    setTimeout(lrInject,800);
  }
},true);

setInterval(lrInject,1200);
setTimeout(lrInject,1000);
