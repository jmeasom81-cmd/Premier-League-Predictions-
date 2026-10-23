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


// End-of-round league standings history and customizable matchweek table.
const sfMWCols=[
 ['points','Points','Main'],['position','End position','Main'],['move','Places moved','Main'],
 ['exacts','Exacts','Main'],['picks','Picks','Main'],['rate','Scoring %','Main'],
 ['total','Season points','Positions'],['weekly','Weekly rank','Positions'],
 ['average','League avg','Positions'],['vsavg','vs average','Positions'],
 ['winner','MW winner','Positions'],['topthree','Weekly top 3','Positions'],
 ['scored','Scoring picks','Prediction accuracy'],['onepoint','1-point picks','Prediction accuracy'],
 ['exactrate','Exact rate','Prediction accuracy'],['ptspick','Pts per pick','Prediction accuracy'],
 ['near','Near-exacts','Prediction accuracy'],
 ['games','Matches scored','Participation'],['missed','Missed picks','Participation'],
 ['zero','Zero-point picks','Participation'],['exactpoints','3-point returns','Points split'],
 ['outcomepoints','1-point returns','Points split'],
 ['home','Home wins picked','Calls'],['draw','Draws picked','Calls'],['away','Away wins picked','Calls'],
 ['predgoals','Predicted goals','Goals'],['realgoals','Actual goals','Goals'],
 ['goalbias','Goals difference','Goals'],['error','Avg score error','Goals']
];
const sfMWPresets={
 essentials:['points','position','move','exacts','picks','rate'],
 accuracy:['points','exacts','scored','rate','exactrate','ptspick','near','zero'],
 rankings:['points','position','move','total','weekly','average','vsavg','winner','topthree'],
 all:sfMWCols.map(x=>x[0])
};
let sfMWUser='',sfMWSelected=new Set(sfMWPresets.essentials),sfMWRange='all';
const sfMWN=v=>Number(v)||0,sfMW1=v=>Math.round(v*10)/10;
const sfMWPct=(a,b)=>b?sfMW1(a*100/b)+'%':'—';
const sfMWSigned=n=>(n>0?'+':'')+sfMW1(n);
function sfMWPrefs(uid){
 if(sfMWUser===uid)return;
 sfMWUser=uid;let saved=null;
 try{saved=JSON.parse(localStorage.getItem('plp_mw_stats_'+uid)||'null')}catch{}
 const keys=new Set(sfMWCols.map(c=>c[0]));
 sfMWSelected=new Set(Array.isArray(saved)&&saved.some(c=>keys.has(c))?saved.filter(c=>keys.has(c)):sfMWPresets.essentials);
}
function sfMWSave(){
 try{localStorage.setItem('plp_mw_stats_'+sfMWUser,JSON.stringify([...sfMWSelected]))}catch{}
}
function sfMWRows(p,e){
 const weeks=[...(p.matchweeks||[])].filter(w=>sfMWN(w.matchweek)>0&&sfMWN(w.league_position)>0).sort((a,b)=>sfMWN(a.matchweek)-sfMWN(b.matchweek));
 const evidence=Array.isArray(e?.all_fixtures)?e.all_fixtures:null;
 const fs=new Map();
 for(const f of evidence||[]){const mw=sfMWN(f.matchweek);if(!fs.has(mw))fs.set(mw,[]);fs.get(mw).push(f)}
 const averages=new Map();
 for(const player of sfProfiles?.players||[])for(const w of player.matchweeks||[]){
   const mw=sfMWN(w.matchweek),val=averages.get(mw)||{total:0,count:0};
   val.total+=sfMWN(w.points);val.count++;averages.set(mw,val);
 }
 let cumulative=0,prior=null;
 return weeks.map(w=>{
   const week=sfMWN(w.matchweek),points=sfMWN(w.points),pos=sfMWN(w.league_position);
   const matches=fs.get(week)||[],picks=matches.filter(f=>f.has_prediction===true),n=picks.length,ex=sfMWN(w.exacts);
   const scoring=picks.filter(f=>sfMWN(f.points)>0).length;
   const pred=picks.reduce((s,f)=>s+sfMWN(f.predicted_home)+sfMWN(f.predicted_away),0);
   const actual=picks.reduce((s,f)=>s+sfMWN(f.actual_home)+sfMWN(f.actual_away),0);
   const err=picks.reduce((s,f)=>s+Math.abs(sfMWN(f.predicted_home)-sfMWN(f.actual_home))+Math.abs(sfMWN(f.predicted_away)-sfMWN(f.actual_away)),0);
   const avg=averages.get(week),mean=avg?.count?avg.total/avg.count:null;
   cumulative+=points;
   const data={
     points,position:sfOrd(pos),move:prior===null?'—':sfMWSigned(prior-pos),
     exacts:ex,picks:evidence?n:'—',rate:evidence?sfMWPct(scoring,n):'—',
     total:cumulative,weekly:sfOrd(w.weekly_position),
     average:mean===null?'—':sfMW1(mean),vsavg:mean===null?'—':sfMWSigned(points-mean),
     winner:sfMWN(w.weekly_position)===1?'Yes':'—',topthree:sfMWN(w.weekly_position)<=3?'Yes':'—',
     scored:evidence?scoring:'—',onepoint:evidence?scoring-picks.filter(f=>sfMWN(f.points)===3).length:'—',
     exactrate:evidence?sfMWPct(picks.filter(f=>sfMWN(f.points)===3).length,n):'—',
     ptspick:evidence&&n?sfMW1(points/n):'—',
     near:evidence?picks.filter(f=>Math.abs(sfMWN(f.predicted_home)-sfMWN(f.actual_home))+Math.abs(sfMWN(f.predicted_away)-sfMWN(f.actual_away))===1).length:'—',
     games:evidence?matches.length:'—',missed:evidence?matches.filter(f=>f.has_prediction!==true).length:'—',
     zero:evidence?picks.filter(f=>sfMWN(f.points)===0).length:'—',
     exactpoints:3*ex,outcomepoints:points-3*ex,
     home:evidence?picks.filter(f=>sfMWN(f.predicted_home)>sfMWN(f.predicted_away)).length:'—',
     draw:evidence?picks.filter(f=>sfMWN(f.predicted_home)===sfMWN(f.predicted_away)).length:'—',
     away:evidence?picks.filter(f=>sfMWN(f.predicted_home)<sfMWN(f.predicted_away)).length:'—',
     predgoals:evidence?pred:'—',realgoals:evidence?actual:'—',
     goalbias:evidence?sfMWSigned(pred-actual):'—',error:evidence&&n?sfMW1(err/n):'—'
   };
   prior=pos;return {week,points,pos,data};
 });
}
function sfMWTable(rows){
 if(!rows.length)return '<div class="sfMWEmpty">Matchweek history appears after the first full round has finished. Unfinished rounds are not assigned a final position.</div>';
 const cols=sfMWCols.filter(x=>sfMWSelected.has(x[0]));
 return '<div class="sfMWScroll" tabindex="0" role="region" aria-label="Scrollable matchweek statistics"><table class="sfMWTable"><thead><tr><th scope="col" class="sfMWFirst">MW</th>'+
 cols.map(c=>'<th scope="col">'+sfEsc(c[1])+'</th>').join('')+'</tr></thead><tbody>'+
 rows.map(r=>'<tr><th scope="row" class="sfMWFirst">MW'+r.week+'</th>'+
 cols.map(c=>{
   const value=r.data[c[0]];
   const cls=c[0]==='move'?(String(value).startsWith('+')?'sfMWUp':String(value).startsWith('-')?'sfMWDown':''):'';
   return '<td class="'+cls+'">'+sfEsc(value??'—')+'</td>';
 }).join('')+'</tr>').join('')+'</tbody></table></div><p class="sfMWNote">Swipe sideways for more columns. Positions are from the <b>end of each completed matchweek</b>.</p>';
}
function sfMWPlot(rows){
 if(!rows.length)return '<div class="sfMWEmpty">The position graph will begin once matchweek 1 is complete.</div>';
 const series=sfMWRange==='last8'?rows.slice(-8):sfMWRange==='last15'?rows.slice(-15):rows;
 const count=Math.max(1,sfMWN(sfProfiles?.players?.length),...rows.map(r=>r.pos));
 const W=Math.max(310,48+series.length*36),H=260,L=37,R=15,T=25,B=41;
 const x=i=>series.length===1?(L+W-R)/2:L+i*(W-L-R)/(series.length-1);
 const y=pos=>T+(pos-1)*(H-T-B)/Math.max(count-1,1);
 const ticks=[...new Set([1,Math.round((count+1)/2),count])];
 let svg='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+sfEsc(series.map(r=>'MW'+r.week+': '+sfOrd(r.pos)).join(', '))+'">';
 for(const v of ticks)svg+='<line x1="'+L+'" y1="'+y(v)+'" x2="'+(W-R)+'" y2="'+y(v)+'" stroke="#e6e1ef" stroke-dasharray="4 4"/><text x="'+(L-7)+'" y="'+(y(v)+4)+'" font-size="10" fill="#7c728d" text-anchor="end">'+v+'</text>';
 svg+='<path d="'+series.map((r,i)=>(i?'L':'M')+x(i)+' '+y(r.pos)).join(' ')+'" fill="none" stroke="#5633b1" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>';
 series.forEach((r,i)=>{
   svg+='<circle cx="'+x(i)+'" cy="'+y(r.pos)+'" r="4.5" fill="#5633b1" stroke="white" stroke-width="2"><title>MW'+r.week+' — '+sfOrd(r.pos)+' position, '+r.points+' pts that week</title></circle>';
   svg+='<text x="'+x(i)+'" y="'+(H-18)+'" text-anchor="middle" font-size="9.5" fill="#777087">'+r.week+'</text>';
 });
 svg+='<text x="'+L+'" y="12" font-size="10" fill="#79728b">Best ↑</text><text x="'+(W-R)+'" y="'+(H-3)+'" font-size="9" fill="#79728b" text-anchor="end">Matchweek →</text></svg>';
 const first=series[0],last=series[series.length-1],diff=first.pos-last.pos;
 return '<div class="sfMWChart" role="region" tabindex="0" aria-label="Scrollable final league position chart">'+svg+'</div>'+
 '<div class="sfMWFoot"><span>First: '+sfOrd(first.pos)+'</span><span>Latest: '+sfOrd(last.pos)+'</span>'+
 '<span class="'+(diff>0?'sfMWUp':diff<0?'sfMWDown':'')+'">'+(diff>0?'↑ '+diff+' places':diff<0?'↓ '+Math.abs(diff)+' places':'No net change')+'</span></div>'+
 '<p class="sfMWNote">Only <b>fully completed</b> matchweeks. 1st place is at the top, and each dot is that week’s final position.</p>';
}
function sfMWHtml(p,e){
 sfMWPrefs(String(p.user_id));
 const rows=sfMWRows(p,e);
 const groups=[...new Set(sfMWCols.map(x=>x[2]))];
 return '<section class="sfMWWrap">'+
 '<div class="sfCard"><div class="sfHead"><h3>📋 My matchweek table</h3><span>'+rows.length+' completed rounds</span></div>'+
 '<p class="sfMWNote">Points, final position and your choice of extra statistics for every finished matchweek.</p>'+
 '<div class="sfMWButtons">'+[['essentials','Essentials'],['accuracy','Accuracy'],['rankings','Rankings'],['all','All stats']].map(a=>'<button type="button" data-sfmw-preset="'+a[0]+'">'+a[1]+'</button>').join('')+'</div>'+
 '<details class="sfMWPicker"><summary>⚙️ Choose your columns <span data-sfmw-count></span></summary><div class="sfMWPickerInner">'+
 groups.map(group=>'<div class="sfMWGroup"><b>'+sfEsc(group)+'</b><div class="sfMWChecks">'+
 sfMWCols.filter(c=>c[2]===group).map(c=>'<label><input type="checkbox" data-sfmw-col="'+c[0]+'">'+sfEsc(c[1])+'</label>').join('')+'</div></div>').join('')+
 '<p class="sfMWNote">Columns are saved for you on this device; MW always remains visible.</p></div></details>'+
 '<div class="sfMWTableTarget">'+sfMWTable(rows)+'</div></div>'+
 '<div class="sfCard"><div class="sfHead"><h3>📈 My league position</h3><span>End of each matchweek</span></div>'+
 '<div class="sfMWButtons">'+[['all','All weeks'],['last15','Last 15'],['last8','Last 8']].map(a=>'<button type="button" data-sfmw-range="'+a[0]+'">'+a[1]+'</button>').join('')+'</div>'+
 '<div class="sfMWGraphTarget">'+sfMWPlot(rows)+'</div></div></section>';
}
function sfMWCss(){
 if(document.getElementById('sf-mw-data-style'))return;
 const s=document.createElement('style');s.id='sf-mw-data-style';
 s.textContent=[
 '.sfMWNote{font-size:10px;color:#7a7486;line-height:1.5;margin:7px 0 10px}',
 '.sfMWButtons{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}',
 '.sfMWButtons button{border:1px solid #ddd7e9;border-radius:999px;background:#f4f1fa;color:#4b3879;padding:8px 10px;font-size:10px;font-weight:900}',
 '.sfMWButtons button.on{background:#4b269d;border-color:#4b269d;color:white}',
 '.sfMWPicker{border:1px solid #e7e3ed;background:#faf9fc;border-radius:12px;margin:10px 0}',
 '.sfMWPicker summary{list-style:none;padding:12px;font-size:11px;font-weight:900;color:#4b269d;cursor:pointer}.sfMWPicker summary::-webkit-details-marker{display:none}',
 '.sfMWPicker summary span{float:right;color:#827a90;font-size:10px}.sfMWPickerInner{padding:0 12px 12px}',
 '.sfMWGroup{padding:9px 0;border-top:1px solid #eeebf2}.sfMWGroup b{font-size:10px;color:#585064}',
 '.sfMWChecks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:9px}',
 '.sfMWChecks label{font-size:10px;line-height:1.3;color:#4a4254;display:flex;align-items:flex-start;gap:6px}',
 '.sfMWChecks input{accent-color:#4b269d;margin:1px 0 0;flex:none}',
 '.sfMWScroll,.sfMWChart{overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;border:1px solid #e7e3eb;border-radius:12px;background:white}',
 '.sfMWTable{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0}',
 '.sfMWTable th,.sfMWTable td{white-space:nowrap;padding:11px 12px!important;border-bottom:1px solid #efecf3;text-align:center;font-size:10.5px}',
 '.sfMWTable thead th{background:#f2eff8;color:#513e77;font-size:9px;font-weight:900}',
 '.sfMWTable .sfMWFirst{position:sticky;left:0;z-index:2;background:white;text-align:left;font-weight:950;color:#241153;box-shadow:2px 0 4px #21104712}',
 '.sfMWTable thead .sfMWFirst{z-index:3;background:#f2eff8}',
 '.sfMWTable tbody tr:nth-child(even) td,.sfMWTable tbody tr:nth-child(even) .sfMWFirst{background:#faf9fd}',
 '.sfMWTable tbody tr:last-child td,.sfMWTable tbody tr:last-child th{border-bottom:none}',
 '.sfMWUp{color:#08775c!important;font-weight:900}.sfMWDown{color:#b52c3c!important;font-weight:900}',
 '.sfMWChart svg{display:block;max-width:none}.sfMWFoot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:9px;margin-top:10px;font-size:10px;color:#746c81}',
 '.sfMWEmpty{font-size:11px;color:#827b8d;border:1px dashed #ddd7e5;border-radius:12px;padding:15px;line-height:1.5}',
 '@media(min-width:600px){.sfMWChecks{grid-template-columns:repeat(3,minmax(0,1fr))}}'
 ].join('');
 document.head.appendChild(s);
}
function sfMWBind(host,p,e){
 sfMWCss();
 const section=host.querySelector('.sfMWWrap');if(!section)return;
 const rows=sfMWRows(p,e);
 const sync=()=>{
   section.querySelector('[data-sfmw-count]').textContent=sfMWSelected.size+' selected';
   section.querySelectorAll('[data-sfmw-col]').forEach(c=>c.checked=sfMWSelected.has(c.dataset.sfmwCol));
   section.querySelectorAll('[data-sfmw-preset]').forEach(b=>{
     const arr=sfMWPresets[b.dataset.sfmwPreset];
     b.classList.toggle('on',arr.length===sfMWSelected.size&&arr.every(x=>sfMWSelected.has(x)));
   });
   section.querySelectorAll('[data-sfmw-range]').forEach(b=>b.classList.toggle('on',b.dataset.sfmwRange===sfMWRange));
 };
 section.addEventListener('change',ev=>{
   const check=ev.target.closest('[data-sfmw-col]');if(!check)return;
   if(check.checked)sfMWSelected.add(check.dataset.sfmwCol);else sfMWSelected.delete(check.dataset.sfmwCol);
   sfMWSave();section.querySelector('.sfMWTableTarget').innerHTML=sfMWTable(rows);sync();
 });
 section.addEventListener('click',ev=>{
   const preset=ev.target.closest('[data-sfmw-preset]');
   if(preset){sfMWSelected=new Set(sfMWPresets[preset.dataset.sfmwPreset]);sfMWSave();section.querySelector('.sfMWTableTarget').innerHTML=sfMWTable(rows);sync();return}
   const range=ev.target.closest('[data-sfmw-range]');
   if(range){sfMWRange=range.dataset.sfmwRange;section.querySelector('.sfMWGraphTarget').innerHTML=sfMWPlot(rows);sync()}
 });
 sync();
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


// League season awards and all-member weekly breakdown; uses existing sealed evidence.
const sfLAColumns=[
 ['points','Group pts','Core'],['average','Avg pts','Core'],['exacts','Exacts','Core'],
 ['top','Weekly leader','Core'],['fixtures','Fixtures','Core'],['accuracy','Scoring %','Core'],
 ['max','Best points','Rankings'],['min','Lowest points','Rankings'],['spread','Points gap','Rankings'],
 ['climbers','Climbers','Rankings'],['fallers','Fallers','Rankings'],
 ['picks','Picks made','Predictions'],['misses','Missed picks','Predictions'],['zeros','Zero scores','Predictions'],
 ['scoring','Scoring picks','Accuracy'],['outcomes','1-pointers','Accuracy'],
 ['exactpct','Exact %','Accuracy'],['ptsper','Pts / pick','Accuracy'],
 ['nearmiss','Near exacts','Accuracy'],['predgoals','Predicted goals','Goal calls'],
 ['realgoals','Actual goals','Goal calls'],['bias','Goal bias','Goal calls']
];
const sfLAPresets={
 basic:['points','average','exacts','top','fixtures','accuracy'],
 ranking:['points','average','top','max','min','spread','climbers','fallers'],
 accuracy:['points','picks','scoring','accuracy','exacts','exactpct','zeros','misses','nearmiss'],
 all:sfLAColumns.map(x=>x[0])
};
let sfLASelected=null,sfLAPrefKey='',sfLAGood=true,sfLABad=true;
const sfLAN=n=>Number.isFinite(Number(n))?Number(n):0;
const sfLAOne=n=>Math.round(n*10)/10;
const sfLAPct=(a,b)=>b?sfLAOne(a*100/b)+'%':'—';
const sfLASign=n=>(n>0?'+':'')+sfLAOne(n);
function sfLAPrefs(){
 const key=String(sfCtx?.leagueId||'league');
 if(sfLAPrefKey===key&&sfLASelected)return;
 sfLAPrefKey=key;
 let saved=null;try{saved=JSON.parse(localStorage.getItem('plp-league-mw:'+key)||'null')}catch{}
 const known=new Set(sfLAColumns.map(x=>x[0]));
 sfLASelected=new Set(Array.isArray(saved?.cols)&&saved.cols.some(x=>known.has(x))
  ?saved.cols.filter(x=>known.has(x)):sfLAPresets.basic);
 sfLAGood=saved?.good!==false;sfLABad=saved?.bad!==false;
}
function sfLASave(){
 try{localStorage.setItem('plp-league-mw:'+sfLAPrefKey,JSON.stringify({
  cols:[...sfLASelected],good:sfLAGood,bad:sfLABad}))}catch{}
}
function sfLAData(packs){
 const people=sfProfiles?.players||[];
 const weeks=[...new Set(people.flatMap(p=>(p.matchweeks||[]).map(w=>sfLAN(w.matchweek)).filter(Boolean)))].sort((a,b)=>a-b);
 const evidenceByPlayer=new Map(packs.map(pack=>[String(pack.player?.user_id),pack.evidence?.all_fixtures]));
 const complete=people.length>0&&people.every(p=>Array.isArray(evidenceByPlayer.get(String(p.user_id))));
 const byWeek=new Map(weeks.map(w=>[w,[]]));
 if(complete)for(const p of people)for(const f of evidenceByPlayer.get(String(p.user_id))){
   const week=sfLAN(f.matchweek);if(byWeek.has(week))byWeek.get(week).push({...f,user_id:p.user_id});
 }
 let prev=null;
 const rows=weeks.map(week=>{
   const members=people.map(p=>{
     const w=(p.matchweeks||[]).find(x=>sfLAN(x.matchweek)===week)||{};
     return {...p,roundPts:sfLAN(w.points),roundExacts:sfLAN(w.exacts),
       roundOutcomes:sfLAN(w.outcomes),roundRank:sfLAN(w.weekly_position),leagueRank:sfLAN(w.league_position)};
   });
   const rank=[...members].sort((a,b)=>b.roundPts-a.roundPts||b.roundExacts-a.roundExacts||b.roundOutcomes-a.roundOutcomes||sfName(a).localeCompare(sfName(b)));
   const poorest=[...rank].reverse();
   const movement=members.map(p=>({...p,delta:(prev?.has(String(p.user_id))&&p.leagueRank>0)?
      prev.get(String(p.user_id))-p.leagueRank:null}));
   prev=new Map(members.map(p=>[String(p.user_id),p.leagueRank]));
   const climbers=movement.filter(p=>p.delta>0).sort((a,b)=>b.delta-a.delta||b.roundPts-a.roundPts);
   const fallers=movement.filter(p=>p.delta<0).sort((a,b)=>a.delta-b.delta||a.roundPts-b.roundPts);
   const all=byWeek.get(week)||[],picks=all.filter(f=>f.has_prediction===true);
   const exact=picks.filter(f=>sfLAN(f.points)===3),scoring=picks.filter(f=>sfLAN(f.points)>0);
   const misses=all.filter(f=>f.has_prediction!==true);
   const fixtures=new Map();
   for(const f of all){
     const key=String(f.fixture_id||week+'|'+f.home_team+'|'+f.away_team);
     if(!fixtures.has(key))fixtures.set(key,{key,name:(f.home_team||'Home')+' v '+(f.away_team||'Away'),score:f.actual_home!=null&&f.actual_away!=null?sfLAN(f.actual_home)+'–'+sfLAN(f.actual_away):'',picks:0,scoring:0,exacts:0});
     const fixture=fixtures.get(key);
     if(f.has_prediction===true){fixture.picks++;if(sfLAN(f.points)>0)fixture.scoring++;if(sfLAN(f.points)===3)fixture.exacts++}
   }
   const fixtureList=[...fixtures.values()];
   const hardest=fixtureList.filter(x=>x.picks>=2).sort((a,b)=>a.scoring/a.picks-b.scoring/b.picks||a.exacts-b.exacts)[0];
   const bestExact=fixtureList.filter(x=>x.picks>0).sort((a,b)=>b.exacts-a.exacts)[0];
   const near=picks.filter(f=>Math.abs(sfLAN(f.predicted_home)-sfLAN(f.actual_home))+Math.abs(sfLAN(f.predicted_away)-sfLAN(f.actual_away))===1).length;
   const predgoals=picks.reduce((a,f)=>a+sfLAN(f.predicted_home)+sfLAN(f.predicted_away),0);
   const realgoals=picks.reduce((a,f)=>a+sfLAN(f.actual_home)+sfLAN(f.actual_away),0);
   const total=members.reduce((a,p)=>a+p.roundPts,0);
   const avg=members.length?total/members.length:0;
   const max=rank[0]?.roundPts??0,min=poorest[0]?.roundPts??0;
   return {week,members,rank,poorest,climbers,fallers,hardest,bestExact,
     total,avg,misses:misses.length,zeros:picks.length-scoring.length,complete,
     values:{
       points:total,average:sfLAOne(avg),exacts:complete?exact.length:members.reduce((a,p)=>a+p.roundExacts,0),
       top:rank[0]?sfName(rank[0]):'—',fixtures:complete?fixtureList.length:'—',
       accuracy:complete?sfLAPct(scoring.length,picks.length):'—',
       max,min,spread:max-min,climbers:climbers.length,fallers:fallers.length,
       picks:complete?picks.length:'—',misses:complete?misses.length:'—',zeros:complete?picks.length-scoring.length:'—',
       scoring:complete?scoring.length:'—',outcomes:complete?scoring.length-exact.length:'—',
       exactpct:complete?sfLAPct(exact.length,picks.length):'—',
       ptsper:complete&&picks.length?sfLAOne(total/picks.length):'—',nearmiss:complete?near:'—',
       predgoals:complete?predgoals:'—',realgoals:complete?realgoals:'—',
       bias:complete?sfLASign(predgoals-realgoals):'—'
     }
   };
 });
 return {people,weeks,rows,complete};
}
function sfLAImprovement(player,completedWeeks){
 // Require a meaningful historic baseline: the last four completed matchweeks
 // versus every completed matchweek in this league, including those same four.
 if(!Array.isArray(completedWeeks)||completedWeeks.length<5)return null;
 const byWeek=new Map((player.matchweeks||[]).map(w=>[sfLAN(w.matchweek),sfLAN(w.points)]));
 const season=completedWeeks.reduce((sum,w)=>sum+(byWeek.get(w)||0),0)/completedWeeks.length;
 const recent=completedWeeks.slice(-4).reduce((sum,w)=>sum+(byWeek.get(w)||0),0)/4;
 return {recent,season,improvement:recent-season};
}
function sfLACards(data){
 const players=data.people,recent=data.weeks.slice(-3);
 const categories=[
  {icon:'🏆',title:'Overall leader',desc:'Most season points',score:p=>sfLAN(p.points),format:v=>v+' pts'},
  {icon:'🎯',title:'Exact-score king',desc:'Most perfect scorelines',score:p=>sfLAN(p.exacts),format:v=>v+' exacts'},
  {icon:'✅',title:'Most reliable',desc:'Scoring rate · minimum 10 picks',score:p=>sfLAN(p.scoring_pct),
   qualify:p=>sfLAN(p.predictions_scored)>=10,format:v=>sfLAOne(v)+'%'},
  {icon:'🥇',title:'Matchweek champion',desc:'Most weekly wins',score:p=>sfLAN(p.matchweek_wins),format:v=>v+' wins'},
  {icon:'🔥',title:'Best recent form',desc:'Last '+recent.length+' completed matchweeks',score:p=>(p.matchweeks||[]).filter(w=>recent.includes(sfLAN(w.matchweek))).reduce((a,w)=>a+sfLAN(w.points),0),format:v=>v+' pts',ready:recent.length>0},
  {icon:'📈',title:'Most improved',desc:'Last 4 MW average vs full-season average',
    qualify:p=>(sfLAImprovement(p,data.weeks)?.improvement??0)>0,
    score:p=>sfLAImprovement(p,data.weeks)?.improvement??null,
    format:v=>'+'+v.toFixed(2)+' pts/MW',
    detail:p=>{
      const result=sfLAImprovement(p,data.weeks);
      return result?'Last 4: '+result.recent.toFixed(2)+' · season: '+result.season.toFixed(2):'';
    },ready:data.weeks.length>=5}
 ];
 return '<div class="sfLACards">'+categories.map(cat=>{
   let eligible=players.filter(p=>!cat.qualify||cat.qualify(p)),note=cat.desc;
   if(cat.qualify&&!eligible.length&&cat.title==='Most reliable'){
     eligible=players.filter(p=>sfLAN(p.predictions_scored)>0);
     note='Early-season rate (fewer than 10 picks)';
   }
   const ranked=eligible.map(p=>({...p,metric:cat.score(p)})).filter(p=>p.metric!=null&&Number.isFinite(p.metric))
      .sort((a,b)=>b.metric-a.metric||sfLAN(b.points)-sfLAN(a.points)||sfName(a).localeCompare(sfName(b))).slice(0,3);
   return '<div class="sfLAward"><div class="sfLAwardTitle">'+cat.icon+' <strong>'+sfEsc(cat.title)+'</strong></div>'+
    '<p>'+sfEsc(note)+'</p>'+
    (cat.ready===false||!ranked.length?'<div class="sfLNote">Awaiting enough completed matchweeks</div>':
    ranked.map((p,i)=>'<div class="sfLAwardLine'+(i===0?' champion':'')+'">'+
      '<span>'+['🥇','🥈','🥉'][i]+'</span><div class="sfLANameBlock"><b>'+sfEsc(sfName(p))+'</b>'+
      (cat.detail?'<small>'+sfEsc(cat.detail(p))+'</small>':'')+
      '</div><strong>'+sfEsc(cat.format(p.metric))+'</strong></div>').join(''))+
    '</div>';
 }).join('')+'</div>';
}
function sfLATable(data){
 if(!data.rows.length)return '<div class="sfEmpty">Weekly breakdown will begin after the first completed matchweek.</div>';
 const cols=sfLAColumns.filter(c=>sfLASelected.has(c[0]));
 return '<div class="sfLAScroll" tabindex="0" role="region" aria-label="Scroll horizontally through weekly league statistics">'+
 '<table class="sfLATable"><thead><tr><th scope="col" class="sfLAFirst">MW</th>'+
 cols.map(c=>'<th scope="col">'+sfEsc(c[1])+'</th>').join('')+'</tr></thead><tbody>'+
 data.rows.map(row=>'<tr><th scope="row" class="sfLAFirst">MW'+row.week+'</th>'+
 cols.map(c=>'<td>'+sfEsc(row.values[c[0]]??'—')+'</td>').join('')+'</tr>').join('')+
 '</tbody></table></div><p class="sfLNote">Scroll sideways to see more columns. Figures use fully completed matchweeks only.</p>';
}
function sfLARecords(data){
 if(!data.rows.length)return '<div class="sfEmpty">Weekly records start when the first matchweek is completed.</div>';
 if(!sfLAGood&&!sfLABad)return '<div class="sfEmpty">Switch Good records or Bad records on to see the weekly stories.</div>';
 return [...data.rows].reverse().map(w=>{
   const top=w.rank[0],worst=w.poorest.slice(0,3);
   const tied=w.rank.filter(x=>x.roundPts===top?.roundPts&&x.roundExacts===top?.roundExacts&&x.roundOutcomes===top?.roundOutcomes);
   const exactKing=[...w.members].sort((a,b)=>b.roundExacts-a.roundExacts||b.roundPts-a.roundPts)[0];
   return '<details class="sfLAWeek" data-sfla-week="'+w.week+'"><summary><span><b>MW'+w.week+'</b><small>'+sfLAOne(w.avg)+' league avg · '+w.total+' group pts</small></span>'+
     '<strong>'+sfEsc(top?.roundPts??0)+' best pts ⌄</strong></summary><div class="sfLAStory">'+
     (sfLAGood?'<div class="sfLAStoryBox"><b>🏅 The good</b>'+
       '<p><strong>Weekly champion:</strong> '+sfEsc(tied.map(sfName).join(', '))+' · '+(top?.roundPts??0)+' pts</p>'+
       '<p><strong>Top three:</strong> '+w.rank.slice(0,3).map((p,i)=>['🥇','🥈','🥉'][i]+' '+sfEsc(sfName(p))+' ('+p.roundPts+' pts)').join(' · ')+'</p>'+
       '<p><strong>Exact-score star:</strong> '+(exactKing?.roundExacts?sfEsc(sfName(exactKing))+' · '+exactKing.roundExacts+' exacts':'No exacts this week')+'</p>'+
       (w.climbers.length?'<p><strong>Biggest climb:</strong> '+sfEsc(sfName(w.climbers[0]))+' ↑ '+w.climbers[0].delta+' places</p>':'')+
       (w.complete&&w.bestExact?.exacts?'<p><strong>Best exact-score fixture:</strong> '+sfEsc(w.bestExact.name)+' ('+sfEsc(w.bestExact.score)+') · '+w.bestExact.exacts+' exacts</p>':'')+
       '</div>':'')+
     (sfLABad?'<div class="sfLAStoryBox bad"><b>😬 The bad</b>'+
       '<p><strong>Lowest three:</strong> '+worst.map(p=>sfEsc(sfName(p))+' ('+p.roundPts+' pts)').join(' · ')+'</p>'+
       (w.fallers.length?'<p><strong>Biggest fall:</strong> '+sfEsc(sfName(w.fallers[0]))+' ↓ '+Math.abs(w.fallers[0].delta)+' places</p>':'')+
       (w.complete?'<p><strong>Blanks:</strong> '+w.zeros+' incorrect picks · '+w.misses+' missed predictions</p>':'')+
       (w.complete&&w.hardest?'<p><strong>Toughest match:</strong> '+sfEsc(w.hardest.name)+' ('+sfEsc(w.hardest.score)+') · only '+w.hardest.scoring+'/'+w.hardest.picks+' picks scored</p>':'')+
       '</div>':'')+'</div></details>';
 }).join('');
}
function sfLAHtml(packs){
 sfLAPrefs();
 const data=sfLAData(packs),groups=[...new Set(sfLAColumns.map(c=>c[2]))];
 return '<section class="sfLAHost">'+
 '<div class="sfCard sfLAHero"><div class="sfHead"><h2>🏅 Season so far</h2><span>Six awards · top three each</span></div>'+
 '<p class="sfLNote">Six different ways to lead the league. Human members only.</p>'+sfLACards(data)+'</div>'+
 '<div class="sfCard"><div class="sfHead"><h3>📊 Our league, week by week</h3><span>'+data.rows.length+' completed</span></div>'+
 '<p class="sfLNote">How the whole group performed across each finished round.</p>'+
 '<div class="sfLAPresets">'+[['basic','Essentials'],['ranking','Rankings'],['accuracy','Accuracy'],['all','All stats']].map(a=>
 '<button type="button" data-sfla-preset="'+a[0]+'">'+a[1]+'</button>').join('')+'</div>'+
 '<details class="sfLAChooser"><summary>⚙️ Choose table columns <span data-sfla-counter></span></summary><div class="sfLAChooserInner">'+
 groups.map(g=>'<div class="sfLAColGroup"><b>'+sfEsc(g)+'</b><div class="sfLAChecks">'+
 sfLAColumns.filter(c=>c[2]===g).map(c=>'<label><input type="checkbox" data-sfla-col="'+c[0]+'">'+sfEsc(c[1])+'</label>').join('')+'</div></div>').join('')+
 '<p class="sfLNote">Your choices are remembered on this device.</p></div></details>'+
 '<div class="sfLATableTarget">'+sfLATable(data)+'</div></div>'+
 '<div class="sfCard"><div class="sfHead"><h3>🏆 Matchweek records</h3><span>Good & bad · select a week</span></div>'+
 '<p class="sfLNote">Open a matchweek to see the best and worst performers, records and standout fixtures.</p>'+
 '<div class="sfLAToggles"><label><input type="checkbox" data-sfla-good> 🏅 Good records</label><label><input type="checkbox" data-sfla-bad> 😬 Bad records</label></div>'+
 '<div class="sfLARecordsTarget">'+sfLARecords(data)+'</div>'+
 (!data.complete?'<p class="sfLNote">Some detailed prediction evidence is unavailable; completed-week points and standings remain available.</p>':'')+
 '</div></section>';
}
function sfLAStyle(){
 if(document.getElementById('sf-league-week-summary-style'))return;
 const style=document.createElement('style');style.id='sf-league-week-summary-style';
 style.textContent=[
 '.sfLAHost{margin-bottom:13px}.sfLAHero{background:linear-gradient(140deg,#fff,#faf7ff);border-color:#dfd6ef}',
 '.sfLNote{font-size:10px;line-height:1.45;color:#797188;margin:6px 0 10px}',
 '.sfLACards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
 '.sfLAward{background:#fff;border:1px solid #e7e1ef;border-radius:14px;padding:10px 8px;min-width:0}',
 '.sfLAwardTitle{font-size:11px;line-height:1.35;color:#241153}.sfLAward p{min-height:23px;color:#8a8193;font-size:9px;line-height:1.35;margin:4px 0 8px}',
 '.sfLAwardLine{display:flex;align-items:center;gap:4px;border-top:1px solid #f0edf4;padding:7px 0;min-width:0}',
 '.sfLAwardLine.champion{background:#f2edfa;border:1px solid #e7daf7;border-radius:10px;padding:8px 5px;margin-bottom:3px}',
 '.sfLAwardLine>span{font-size:10px}.sfLAwardLine>b{flex:1;min-width:0;font-size:9.5px;color:#4e4662;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
 '.sfLAwardLine.champion>b{color:#241153}.sfLAwardLine>strong{font-size:9.5px;white-space:nowrap;color:#241153}',
 '.sfLANameBlock{flex:1;min-width:0}.sfLANameBlock>b{display:block;font-size:9.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#4e4662}.sfLAwardLine.champion .sfLANameBlock>b{color:#241153}.sfLANameBlock>small{display:block;font-size:8.5px;color:#827a92;line-height:1.2;margin-top:3px;white-space:normal}',
 '.sfLAwardLine:has(.sfLANameBlock small){align-items:center}.sfLAwardLine:has(.sfLANameBlock small)>strong{font-size:8.8px}',
 '.sfLAPresets{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.sfLAPresets button{border:1px solid #ded8e9;border-radius:99px;background:#f5f2fb;color:#4e397b;font-size:10px;font-weight:900;padding:8px 10px}',
 '.sfLAPresets button.on{background:#4b269d;color:white;border-color:#4b269d}',
 '.sfLAChooser{background:#faf9fd;border:1px solid #e7e2ee;border-radius:12px;margin:10px 0}.sfLAChooser summary{cursor:pointer;padding:12px;font-size:11px;font-weight:900;color:#4b269d;list-style:none}',
 '.sfLAChooser summary::-webkit-details-marker{display:none}.sfLAChooser summary span{float:right;font-size:10px;color:#81768d}',
 '.sfLAChooserInner{padding:0 12px 12px}.sfLAColGroup{padding:9px 0;border-top:1px solid #eeebf2}.sfLAColGroup b{font-size:10px;color:#564d67}',
 '.sfLAChecks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:8px}.sfLAChecks label{font-size:10px;color:#51465f;display:flex;gap:6px;align-items:flex-start;line-height:1.3}',
 '.sfLAChecks input,.sfLAToggles input{accent-color:#4b269d;flex:none;margin:1px 0 0}',
 '.sfLAScroll{overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;background:#fff;border:1px solid #e5e0ea;border-radius:12px}',
 '.sfLATable{border-collapse:separate;border-spacing:0;min-width:100%;width:max-content}.sfLATable th,.sfLATable td{font-size:10px;white-space:nowrap;text-align:center;padding:11px 12px!important;border-bottom:1px solid #eeebf2}',
 '.sfLATable thead th{background:#f2eef9;color:#4f3d74;font-weight:900;font-size:9px}.sfLATable .sfLAFirst{position:sticky;left:0;z-index:2;background:#fff;text-align:left;color:#241153;font-weight:900;box-shadow:2px 0 5px #25154115}',
 '.sfLATable thead .sfLAFirst{z-index:3;background:#f2eef9}.sfLATable tbody tr:nth-child(even) td,.sfLATable tbody tr:nth-child(even) .sfLAFirst{background:#faf9fd}.sfLATable tbody tr:last-child td,.sfLATable tbody tr:last-child th{border-bottom:0}',
 '.sfLAToggles{display:flex;flex-wrap:wrap;gap:8px;margin:11px 0}.sfLAToggles label{display:flex;align-items:center;gap:6px;padding:9px 10px;border-radius:11px;background:#f5f2fa;font-size:10px;font-weight:900;color:#4e3e6e}',
 '.sfLAWeek{border:1px solid #e9e3ef;border-radius:12px;margin:8px 0;background:white;overflow:hidden}.sfLAWeek summary{list-style:none;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#241153;cursor:pointer}',
 '.sfLAWeek summary::-webkit-details-marker{display:none}.sfLAWeek summary b{font-size:11px}.sfLAWeek summary small{display:block;color:#8b8395;font-size:9px;margin-top:4px}.sfLAWeek summary strong{font-size:10px;white-space:nowrap}',
 '.sfLAStory{padding:0 11px 12px}.sfLAStoryBox{background:#f8fcfa;border:1px solid #e2eee7;border-radius:12px;padding:10px;margin-top:8px}.sfLAStoryBox.bad{background:#fffafa;border-color:#f0e3e4}',
 '.sfLAStoryBox>b{font-size:11px;color:#241153}.sfLAStoryBox p{font-size:10px;color:#5b5365;line-height:1.55;margin:8px 0 0}',
 '@media(min-width:650px){.sfLACards{grid-template-columns:repeat(3,minmax(0,1fr))}.sfLAChecks{grid-template-columns:repeat(3,minmax(0,1fr))}}'
 ].join('');
 document.head.appendChild(style);
}
function sfLABind(host,packs){
 sfLAStyle();
 const panel=host.querySelector('.sfLAHost');if(!panel)return;
 const data=sfLAData(packs);
 const sync=()=>{
   panel.querySelector('[data-sfla-counter]').textContent=sfLASelected.size+' selected';
   panel.querySelectorAll('[data-sfla-col]').forEach(el=>el.checked=sfLASelected.has(el.dataset.sflaCol));
   panel.querySelector('[data-sfla-good]').checked=sfLAGood;panel.querySelector('[data-sfla-bad]').checked=sfLABad;
   panel.querySelectorAll('[data-sfla-preset]').forEach(b=>{
     const a=sfLAPresets[b.dataset.sflaPreset];b.classList.toggle('on',a.length===sfLASelected.size&&a.every(c=>sfLASelected.has(c)));
   });
 };
 panel.addEventListener('change',e=>{
   const col=e.target.closest('[data-sfla-col]');
   if(col){
     if(col.checked)sfLASelected.add(col.dataset.sflaCol);else sfLASelected.delete(col.dataset.sflaCol);
     sfLASave();panel.querySelector('.sfLATableTarget').innerHTML=sfLATable(data);sync();return;
   }
   if(e.target.matches('[data-sfla-good]'))sfLAGood=e.target.checked;
   else if(e.target.matches('[data-sfla-bad]'))sfLABad=e.target.checked;
   else return;
   const opened=[...panel.querySelectorAll('.sfLAWeek[open]')].map(x=>x.dataset.sflaWeek);
   sfLASave();panel.querySelector('.sfLARecordsTarget').innerHTML=sfLARecords(data);
   panel.querySelectorAll('.sfLAWeek').forEach(x=>{x.open=opened.includes(x.dataset.sflaWeek)});
   sync();
 });
 panel.addEventListener('click',e=>{
   const preset=e.target.closest('[data-sfla-preset]');if(!preset)return;
   sfLASelected=new Set(sfLAPresets[preset.dataset.sflaPreset]);sfLASave();
   panel.querySelector('.sfLATableTarget').innerHTML=sfLATable(data);sync();
 });
 sync();
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
  const intro='Your season first. Switch to <b>League Stats</b> for leaders, prediction personalities, club insights and the stories behind the points.';
  if(notes[0]&&notes[0].innerHTML!==intro)notes[0].innerHTML=intro;
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
      host.innerHTML=sfTabs()+sfSelfHtml(p,e)+sfMWHtml(p,e);
      sfMWBind(host,p,e);
      // Quietly prepare the heavier league analysis while the user reads My Stats.
      sfLoadLeagueEvidence(false).catch(()=>{});
    }else{
      // Build League Stats once, after its evidence is ready, instead of drawing twice.
      const evidence=await sfLoadLeagueEvidence(false).catch(()=>[]);
      if(!host.isConnected||sfMode!=='league')return;
      const agg=sfLeagueAggregates(evidence);
      host.innerHTML=sfTabs()+sfLAHtml(evidence)+sfLeagueHtml(agg);
      sfLABind(host,evidence);
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
