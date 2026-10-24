// PREMIER LEAGUE CLUB STATS — all clubs, all players, scored-result-only rankings.
// Rendered inside the Stats -> PL Clubs view.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const tpSb=createClient(
 'https://jzrbaeyvwagrwukntjbk.supabase.co',
 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);
let tpLeague=null,tpUser=null,tpData=null,tpFetched=0,tpInflight=null;
let tpChosen='Arsenal',tpPlayerId=null,tpMode='points',tpFilter='',tpAllOpen=false,tpTableSort='total';
const tpEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tpArr=x=>Array.isArray(x)?x:[];
const tpNumber=x=>Number(x||0);
const tpPct=(a,b)=>b?Math.round(100*a/b)+'%':'—';
const tpCompact=(n,digits=2)=>Number(n||0).toFixed(digits);
const tpName=p=>p?.display_name||p?.team_name||'Player';
const tpIcon=p=>p?.badge||'⚽';
const tpTeams=()=>tpArr(tpData?.teams);
const tpCurrent=()=>tpTeams().find(x=>x.club===tpChosen)||tpTeams()[0]||null;

function tpCss(){
 if(document.getElementById('tp-styles'))return;
 const s=document.createElement('style');s.id='tp-styles';
 s.textContent=[
 '.tpHost{font-size:12px}.tpHeader{background:linear-gradient(140deg,#f4f0ff,#fff);border:1px solid #ded4f0;border-radius:17px;padding:15px;margin:11px 0}',
 '.tpHeader h2{font-size:19px;color:#281551;margin:0}.tpHint{font-size:11px;color:#726b83;line-height:1.55;margin:7px 0}',
 '.tpLabel{font-size:10px;font-weight:900;text-transform:uppercase;color:#716781;letter-spacing:.04em}',
 '.tpTeams{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;max-height:247px;overflow-y:auto;padding:3px 2px 9px;overscroll-behavior:contain}',
 '.tpTeamButton{background:#fff;border:1px solid #e3ddeb;border-radius:12px;display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:10px;text-align:left;color:#332452;font-weight:850;font-size:11px;line-height:1.3;cursor:pointer;min-width:0}',
 '.tpTeamButton small{font-size:9px;color:#80798d;font-weight:700}.tpTeamButton.active{border-color:#5832a6;background:#eee9fb;box-shadow:inset 0 0 0 1px #5832a6}',
 '.tpSearch{width:100%;border:1px solid #dcd4eb;border-radius:10px;padding:11px 12px;margin:9px 0;font-size:13px;color:#251a3e;background:#fff}',
 '.tpCard{background:#fff;border:1px solid #e7e4ec;border-radius:16px;padding:13px;margin:12px 0;box-shadow:0 6px 18px #26134c09}',
 '.tpCard h3{color:#281551;font-size:15px;margin:0 0 4px}.tpSub{font-size:10px;color:#878093;line-height:1.4;margin:3px 0 10px}',
 '.tpStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:9px 0 4px}',
 '.tpStat{background:#f6f4fa;border-radius:11px;text-align:center;padding:10px 5px;min-width:0}',
 '.tpStat b{display:block;color:#291752;font-size:19px;line-height:1.2}.tpStat small{display:block;margin-top:5px;text-transform:uppercase;color:#777081;font-size:8px;font-weight:850;line-height:1.25}',
 '.tpHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin:3px 0 9px}',
 '.tpHead h3{margin:0}.tpChip{padding:5px 8px;border-radius:25px;font-size:9px;font-weight:900;color:#4b269d;background:#ede8f8;white-space:nowrap}',
 '.tpRanks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
 '.tpRankBox{background:#fbfafc;border:1px solid #ece9f2;border-radius:13px;padding:10px;min-width:0}',
 '.tpRankBox.good{background:#f4fff9;border-color:#d4eadf}.tpRankBox.bad{background:#fff8f8;border-color:#f0e0e0}',
 '.tpRankBox h4{font-size:11px;margin:0 0 8px;color:#2f2149}',
 '.tpRankEntry{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin:9px 0}',
 '.tpRankEntry strong{font-size:11px;color:#241342;display:block}.tpRankEntry small{display:block;font-size:9px;color:#777181;margin-top:3px}',
 '.tpRankEntry .tpValue{font-size:15px;font-weight:950;color:#392077;text-align:right;white-space:nowrap}',
 '.tpRow{display:flex;justify-content:space-between;align-items:center;gap:9px;border-top:1px solid #eeeaf3;padding:10px 0}',
 '.tpRow:first-child{border-top:0}.tpRow b{color:#30204e;font-size:11px}.tpRow small{display:block;font-size:9px;color:#867e92;line-height:1.4;margin-top:3px}',
 '.tpRowValue{text-align:right;color:#352067;font-size:12px;font-weight:900;white-space:nowrap}',
 '.tpDetails{margin-top:12px}.tpDetails summary{cursor:pointer;color:#4b269d;font-weight:900;font-size:12px;padding:9px 1px}',
 '.tpTable{width:100%;border-collapse:collapse;margin:9px 0;font-size:10px}.tpTable th{text-align:right;font-size:9px;color:#7c7487;font-weight:850;padding:9px 3px;border-bottom:1px solid #ddd8e7}',
 '.tpTable th:first-child{text-align:left}.tpTable td{text-align:right;padding:9px 3px;border-bottom:1px solid #f0edf4;vertical-align:middle;color:#3b2b56}',
 '.tpTable td:first-child{text-align:left;min-width:0}.tpTable b{color:#281750}.tpTable small{display:block;font-size:8.5px;color:#847f8c;margin-top:3px}',
 '.tpTable tr.tpNoPicks{opacity:.67}.tpTable tr.tpMe{background:#f4f0ff}',
 '.tpSelect{padding:10px;width:100%;border:1px solid #dcd6e7;border-radius:10px;color:#362455;background:#fff;font-size:12px}',
 '.tpSegments{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}.tpSegment{background:#f3f0f8;color:#695581;border:1px solid #e5dfed;font-size:10px;font-weight:900;border-radius:10px;padding:8px 9px;cursor:pointer}',
 '.tpSegment.active{background:#4b269d;color:#fff;border-color:#4b269d}',
 '.tpMiniBox{padding:11px;background:#faf9fc;border:1px solid #ede9f3;border-radius:12px;margin:9px 0;color:#5b5468;line-height:1.5;font-size:11px}',
 '.tpCall{font-size:10px;color:#48345f;background:#f2edf9;padding:10px;border-radius:11px;margin-top:9px;line-height:1.5}',
 '.tpEmpty{padding:17px 10px;font-size:11px;color:#857d8f;border-radius:10px;text-align:center;border:1px dashed #ddd8e7}',
 '.tpFixture{border-top:1px solid #eeeaf2;padding:10px 0;display:flex;justify-content:space-between;gap:9px;align-items:flex-start}',
 '.tpFixture:first-child{border-top:0}.tpFixture strong{display:block;font-size:11px;color:#2a1750}.tpFixture small{display:block;font-size:9px;color:#878093;margin-top:4px}',
 '.tpFixture b{font-size:13px;color:#39216e;white-space:nowrap;text-align:right}',
 '.tpRefresh{border:1px solid #dcd6e9;border-radius:9px;color:#4b269d;background:#f4f0fa;font-weight:900;padding:9px 12px;font-size:10px;cursor:pointer}',
 '.tpLeagueWrap{overflow-x:auto;max-width:100%;border-radius:12px;border:1px solid #e7e2f0}',
 '.tpLeagueTable{border-collapse:collapse;border-spacing:0;width:100%;min-width:335px;font-size:11px}',
 '.tpLeagueTable thead{background:#f0edf8;color:#5e5278}',
 '.tpLeagueTable th{padding:10px 5px;font-size:9px;text-align:right;white-space:nowrap;font-weight:900}',
 '.tpLeagueTable th:first-child{padding-left:10px;text-align:left;width:22px}',
 '.tpLeagueTable th:nth-child(2){text-align:left}',
 '.tpLeagueTable td{padding:10px 5px;border-top:1px solid #f0edf4;text-align:right;white-space:nowrap;color:#4a405a;font-weight:700}',
 '.tpLeagueTable td:first-child{padding-left:10px;text-align:left;font-weight:900}',
 '.tpLeagueTable td:nth-child(2){text-align:left;white-space:normal;min-width:130px;line-height:1.3}',
 '.tpLeagueTable td:last-child{padding-right:10px}',
 '.tpLeagueTable .tpPoints{font-weight:950;color:#392077;font-size:12px}',
 '.tpLeagueTable tbody tr.tpActiveClub{background:#f3edff}',
 '.tpLeagueTable tbody tr.tpLeadingClub{background:#f5fcf8}',
 '.tpTeamPick{color:#332250;text-align:left;border:0;padding:0;background:transparent;font:inherit;font-weight:850;cursor:pointer;line-height:1.3}',
 '.tpTeamPick:focus-visible{outline:2px solid #4b269d;outline-offset:3px;border-radius:3px}',
 '.tpTeamPick small{display:block;font-weight:600;color:#827991;font-size:9px;margin-top:3px}',
 '.tpTableFilters{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}',
 '.tpTableFilters button{border:1px solid #e4dded;background:#f6f3fa;color:#53426f;padding:8px 10px;font-weight:900;font-size:10px;border-radius:9px;cursor:pointer}',
 '.tpTableFilters button.active{color:#fff;background:#4b269d;border-color:#4b269d}',
 '@media(min-width:650px){.tpTeams{grid-template-columns:repeat(3,minmax(0,1fr))}}',
 '@media(max-width:370px){.tpRankBox{padding:8px}.tpRankEntry{flex-wrap:wrap}.tpStat b{font-size:17px}}'
 ].join('');
 document.head.appendChild(s);
}
async function tpContext(){
 const {data:{session}}=await tpSb.auth.getSession();
 if(!session?.user)return null;
 if(tpLeague&&tpUser===session.user.id)return tpLeague;
 const {data,error}=await tpSb.from('league_members').select('league_id,joined_at,status')
  .eq('user_id',session.user.id).eq('status','active')
  .order('joined_at',{ascending:false}).limit(1);
 if(error)throw error;
 if(!data?.length)return null;
 tpUser=session.user.id;tpLeague=data[0].league_id;
 tpData=null;tpFetched=0;
 return tpLeague;
}
async function tpLoad(force=false){
 const league=await tpContext();if(!league)throw Error('Sign in to view team statistics.');
 if(!force&&tpData&&Date.now()-tpFetched<45000)return tpData;
 if(tpInflight)return tpInflight;
 tpInflight=(async()=>{
  const {data,error}=await tpSb.rpc('get_team_player_stats',{p_league_id:league});
  if(error)throw error;
  tpData=data||{teams:[]};
  tpFetched=Date.now();
  const all=tpTeams();
  if(!all.some(x=>x.club===tpChosen))tpChosen=all.find(x=>x.club==='Arsenal')?.club||all[0]?.club||'';
  return tpData;
 })().finally(()=>{tpInflight=null});
 return tpInflight;
}

function tpLeagueSortValue(c,sort=tpTableSort){
 if(sort==='average')return tpNumber(c.league_picks)?tpNumber(c.league_points)/tpNumber(c.league_picks):0;
 if(sort==='exacts')return tpNumber(c.league_exacts);
 if(sort==='accuracy')return tpNumber(c.league_picks)?tpNumber(c.league_scoring)/tpNumber(c.league_picks):0;
 return tpNumber(c.league_points);
}
function tpClubLeagueTable(){
 const teams=tpTeams();
 const order=[...teams].sort((a,b)=>
  tpLeagueSortValue(b)-tpLeagueSortValue(a)||
  tpNumber(b.league_points)-tpNumber(a.league_points)||
  tpNumber(b.league_exacts)-tpNumber(a.league_exacts)||
  a.club.localeCompare(b.club)
 );
 const sortOpts=[
  ['total','Total points'],
  ['average','Points / pick'],
  ['exacts','Exact scores'],
  ['accuracy','Hit rate']
 ];
 const rows=order.map((club,index)=>{
  const avg=tpNumber(club.league_picks)?
   tpCompact(tpNumber(club.league_points)/tpNumber(club.league_picks)): '—';
  const hit=tpPct(tpNumber(club.league_scoring),tpNumber(club.league_picks));
  return '<tr class="'+(club.club===tpChosen?'tpActiveClub':index===0?'tpLeadingClub':'')+'">'+
   '<td>'+(index+1)+'</td>'+
   '<td><button type="button" class="tpTeamPick" data-tp-team="'+tpEsc(club.club)+'" '+
    'title="See all player stats for '+tpEsc(club.club)+'">'+tpEsc(club.club)+
    '<small>'+tpNumber(club.league_picks)+' picks · '+hit+' scored</small></button></td>'+
   '<td>'+tpNumber(club.scored_matches)+'</td>'+
   '<td class="tpPoints">'+tpNumber(club.league_points)+'</td>'+
   '<td>'+tpNumber(club.league_exacts)+'</td>'+
   '<td>'+avg+'</td></tr>';
 }).join('');
 return '<section class="tpCard" id="tp-club-league-table">'+
  '<div class="tpHead"><div><h3>🏆 Our Premier League Points Table</h3>'+
  '<p class="tpSub">All '+teams.length+' clubs ranked by the total prediction points earned by our league members in games involving each club.</p></div>'+
  '<span class="tpChip">'+tpEsc(tpData?.season||'Season')+'</span></div>'+
  '<div class="tpTableFilters" role="group" aria-label="Sort team points table">'+
   sortOpts.map(([value,label])=>
    '<button type="button" data-tp-table-sort="'+value+'" class="'+(tpTableSort===value?'active':'')+
    '" aria-pressed="'+(tpTableSort===value?'true':'false')+'">'+label+'</button>'
   ).join('')+'</div>'+
  '<div class="tpLeagueWrap"><table class="tpLeagueTable" aria-label="Premier League clubs ranked by members prediction points">'+
  '<thead><tr><th>#</th><th>Club</th><th title="Completed matches">P</th>'+
  '<th title="Combined prediction points earned">Pts</th>'+
  '<th title="Exact score predictions">Exact</th>'+
  '<th title="Average points earned per prediction">Avg</th></tr></thead>'+
  '<tbody>'+rows+'</tbody></table></div>'+
  '<p class="tpHint"><b>Pts</b> = everyone’s combined points (3 for an exact score, 1 for the right result). '+
  '<b>P</b> = completed matches involving the club; <b>Avg</b> = points per submitted prediction. '+
  'Only official final results count. Each match contributes to both clubs’ totals. '+
  'Tap a team for its player-by-player breakdown.</p></section>';
}

function tpClubChooser(){
 const clubs=tpTeams(),chosen=tpCurrent();
 return '<div class="tpCard" style="padding:13px"><div class="tpHead"><div><h3>⚽ All '+clubs.length+' teams</h3>'+
  '<p class="tpSub">Choose a club to see which league players earn the most and least points against its fixtures.</p></div>'+
  '<span class="tpChip">'+tpEsc(tpData?.season||'Season')+'</span></div>'+
  '<input type="search" class="tpSearch" id="tp-search" placeholder="Find a team…" aria-label="Search all teams" value="'+tpEsc(tpFilter)+'">'+
  '<div class="tpTeams" id="tp-team-list" aria-label="Choose a team">'+tpTeamButtons(clubs,chosen)+'</div>'+
  '<p class="tpHint" style="margin-bottom:0">Club names come from this season’s fixture list; naming variations are combined.</p>'+
  '</div>';
}
function tpTeamButtons(clubs,current){
 const filtered=clubs.filter(x=>x.club.toLowerCase().includes(tpFilter.toLowerCase().trim()));
 if(!filtered.length)return '<div class="tpEmpty">No matching teams.</div>';
 return filtered.map(x=>
  '<button type="button" class="tpTeamButton '+(x.club===current?.club?'active':'')+
   '" data-tp-team="'+tpEsc(x.club)+'" aria-pressed="'+(x.club===current?.club?'true':'false')+'">'+
    tpEsc(x.club)+'<small>'+tpNumber(x.scored_matches)+' results scored</small></button>'
 ).join('');
}
function tpStat(value,label){
 return '<div class="tpStat"><b>'+tpEsc(value)+'</b><small>'+tpEsc(label)+'</small></div>';
}
function tpPlayerLabel(p){
 return '<strong>'+tpEsc(tpIcon(p))+' '+tpEsc(tpName(p))+'</strong>'+
  '<small>'+tpNumber(p.picks)+' predictions · '+tpNumber(p.exacts)+' exact</small>';
}
function tpRankRows(players,key='points',max=3){
 return players.slice(0,max).map(p=>
  '<div class="tpRankEntry"><div>'+tpPlayerLabel(p)+'</div>'+
  '<div class="tpValue">'+tpNumber(p[key])+
  '<small style="display:block;font-size:9px;color:#7f788a;font-weight:700;margin-top:4px">'+tpCompact(p.avg_points)+' /pick</small>'+
  '</div></div>'
 ).join('')||'<div class="tpEmpty">No scored predictions yet.</div>';
}
function tpOrder(players,mode=tpMode){
 const present=players.filter(p=>tpNumber(p.picks)>0);
 const byName=(a,b)=>tpName(a).localeCompare(tpName(b));
 if(mode==='avg_points'){
  return [...present].sort((a,b)=>tpNumber(b.avg_points)-tpNumber(a.avg_points)||
    tpNumber(b.points)-tpNumber(a.points)||tpNumber(b.picks)-tpNumber(a.picks)||byName(a,b));
 }
 if(mode==='exacts'){
  return [...present].sort((a,b)=>tpNumber(b.exacts)-tpNumber(a.exacts)||
    tpNumber(b.points)-tpNumber(a.points)||byName(a,b));
 }
 if(mode==='scoring_pct'){
  return [...present].sort((a,b)=>tpNumber(b.scoring_pct)-tpNumber(a.scoring_pct)||
    tpNumber(b.picks)-tpNumber(a.picks)||tpNumber(b.points)-tpNumber(a.points)||byName(a,b));
 }
 return [...present].sort((a,b)=>tpNumber(b.points)-tpNumber(a.points)||
  tpNumber(b.exacts)-tpNumber(a.exacts)||tpNumber(b.picks)-tpNumber(a.picks)||byName(a,b));
}
function tpDisplayMetric(p,mode){
 if(mode==='avg_points')return tpCompact(p.avg_points);
 if(mode==='exacts')return String(tpNumber(p.exacts));
 if(mode==='scoring_pct')return tpNumber(p.scoring_pct)+'%';
 return String(tpNumber(p.points));
}
function tpRivalInsights(players){
 const scored=players.filter(p=>tpNumber(p.picks)>=2);
 const one=players.filter(p=>tpNumber(p.picks)>0);
 if(!one.length)return '<div class="tpEmpty">Player records appear after the first scored match.</div>';
 const top=(arr,key)=>arr.slice().sort((a,b)=>tpNumber(b[key])-tpNumber(a[key])||
     tpNumber(b.picks)-tpNumber(a.picks)||tpName(a).localeCompare(tpName(b)))[0];
 const highPct=[...scored].sort((a,b)=>tpNumber(b.scoring_pct)-tpNumber(a.scoring_pct)||
  tpNumber(b.picks)-tpNumber(a.picks))[0];
 const specialist=top(one,'exacts');
 const believer=top(one,'backed_wins'),skeptic=top(one,'predicted_losses');
 const scoreless=top(one,'blanks');
 const rows=[
  ['🎯 Exact-score specialist',specialist,specialist?.exacts,'exact scores in scored fixtures'],
  ['💚 Biggest backer',believer,believer?.backed_wins,'times backing '+tpChosen+' to win'],
  ['🙅 Biggest doubter',skeptic,skeptic?.predicted_losses,'times predicting a '+tpChosen+' defeat'],
  ['😬 Most unsuccessful picks',scoreless,scoreless?.blanks,'zero-point predictions'],
  ['🧠 Best outcome hit rate',highPct,highPct?.scoring_pct != null?tpNumber(highPct.scoring_pct)+'%':null,'scoring picks · minimum 2 predictions']
 ];
 return rows.filter(x=>x[1]&&Number.parseFloat(x[2])>0).map(([title,p,value,context])=>
  '<div class="tpRow"><div><b>'+tpEsc(title)+'</b><small>'+
  tpEsc(tpName(p))+' · '+tpEsc(context)+'</small></div>'+
  '<span class="tpRowValue">'+tpEsc(value)+'</span></div>'
 ).join('')||'<div class="tpEmpty">More matches will unlock the extra records.</div>';
}
function tpPersonal(club,players){
 const chosen=players.find(x=>String(x.user_id)===String(tpPlayerId))||
  players.find(x=>String(x.user_id)===String(tpUser))||players[0];
 if(!chosen)return '<div class="tpEmpty">No players available.</div>';
 tpPlayerId=chosen.user_id;
 const avgClub=club.league_picks?tpNumber(club.league_points)/tpNumber(club.league_picks):0;
 const diff=tpNumber(chosen.avg_points)-avgClub;
 const sample=tpNumber(chosen.picks)>0;
 const predicted=tpNumber(chosen.backed_wins)+tpNumber(chosen.predicted_draws)+tpNumber(chosen.predicted_losses);
 return '<div class="tpCard"><div class="tpHead"><h3>👤 Player spotlight</h3><span class="tpChip">Against '+tpEsc(club.club)+'</span></div>'+
 '<p class="tpSub">Pick any league member to examine their record against this team.</p>'+
 '<label class="tpLabel" for="tp-person">Player</label>'+
 '<select id="tp-person" class="tpSelect">'+players.slice().sort((a,b)=>tpName(a).localeCompare(tpName(b)))
  .map(x=>'<option value="'+tpEsc(x.user_id)+'" '+(String(x.user_id)===String(tpPlayerId)?'selected':'')+'>'+
   tpEsc(tpIcon(x))+' '+tpEsc(tpName(x))+'</option>').join('')+'</select>'+
 '<div class="tpStats">'+
  tpStat(chosen.points,'Total points')+
  tpStat(chosen.exacts,'Exact scores')+
  tpStat(chosen.picks+'/'+chosen.fixtures_scored,'Games predicted')+
 '</div>'+
 (sample?'<div class="tpCall"><b>'+tpEsc(tpName(chosen))+'</b> averages <b>'+
  tpCompact(chosen.avg_points)+' points per prediction</b> for '+tpEsc(club.club)+
  ', '+(diff===0?'matching':diff>0?'above':'below')+' the league\'s '+tpCompact(avgClub)+' average'+
  (diff?' by '+tpCompact(Math.abs(diff)):'')+' points per pick. '+tpNumber(chosen.missed)+
  ' scored fixtures missed.</div>':
  '<div class="tpMiniBox">No scored predictions against this team yet.</div>')+
 '<div class="tpRow"><div><b>✅ Scoring accuracy</b><small>1 or 3 points</small></div><div class="tpRowValue">'+
  (sample?tpNumber(chosen.scoring_pct)+'%':'—')+'</div></div>'+
 '<div class="tpRow"><div><b>🏠 Home / ✈️ away points</b><small>When '+tpEsc(club.club)+' played at home or away</small></div><div class="tpRowValue">'+
  tpNumber(chosen.home_points)+' / '+tpNumber(chosen.away_points)+'</div></div>'+
 '<div class="tpRow"><div><b>💚 Backed / 🤝 draw / 🙅 doubted</b><small>Predictions of a '+tpEsc(club.club)+' win, draw or defeat</small></div><div class="tpRowValue">'+
  tpNumber(chosen.backed_wins)+' / '+tpNumber(chosen.predicted_draws)+' / '+tpNumber(chosen.predicted_losses)+'</div></div>'+
 '<div class="tpRow"><div><b>⚽ Typical score prediction</b><small>Goals for and against '+tpEsc(club.club)+'</small></div><div class="tpRowValue">'+
 (sample?tpCompact(chosen.avg_goals_for,1)+'–'+tpCompact(chosen.avg_goals_against,1):'—')+'</div></div>'+
 '<div class="tpRow"><div><b>😬 Zero-point predictions</b><small>Games this player got wrong</small></div><div class="tpRowValue">'+
 tpNumber(chosen.blanks)+'</div></div>'+
 '</div>';
}
function tpFullTable(club,players){
 const ranked=tpOrder(players,tpMode),none=players.filter(p=>tpNumber(p.picks)===0)
 .sort((a,b)=>tpName(a).localeCompare(tpName(b)));
 const modes=[['points','Total points'],['avg_points','Pts / pick'],['exacts','Exacts'],['scoring_pct','Hit rate']];
 const total=ranked.length;
 const rows=[...ranked,...none].map((p,i)=>{
  const unranked=tpNumber(p.picks)===0;
  const rank=unranked?'—':String(1+ranked.filter(x=>tpNumber(x[tpMode])>tpNumber(p[tpMode])).length);
  return '<tr class="'+(unranked?'tpNoPicks ':'')+(tpUser===p.user_id?'tpMe':'')+'">'+
   '<td><b>'+rank+'. '+tpEsc(tpIcon(p))+' '+tpEsc(tpName(p))+'</b>'+
    '<small>'+tpEsc(p.team_name)+'</small></td>'+
   '<td>'+tpNumber(p.picks)+'</td>'+
   '<td><b>'+(unranked?'—':tpDisplayMetric(p,tpMode))+'</b></td>'+
   '<td>'+tpNumber(p.exacts)+'</td><td>'+(unranked?'—':tpNumber(p.scoring_pct)+'%')+'</td></tr>';
 }).join('');
 return '<div class="tpCard"><div class="tpHead"><h3>🏅 Full player rankings</h3>'+
 '<span class="tpChip">'+players.length+' players</span></div>'+
 '<p class="tpSub">Every league member is listed. Unsubmitted predictions are shown separately, not treated as zero-point attempts.</p>'+
 '<div class="tpSegments">'+modes.map(x=>'<button type="button" class="tpSegment '+(tpMode===x[0]?'active':'')+
  '" data-tp-mode="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
 '<details class="tpDetails" '+(tpAllOpen?'open':'')+' id="tp-full-ranking">'+
 '<summary>View all '+players.length+' players · '+total+' with scored picks</summary>'+
 '<div style="overflow-x:auto"><table class="tpTable"><thead><tr><th>Player</th><th>Picks</th><th>'+
 tpEsc(modes.find(x=>x[0]===tpMode)?.[1]||'Points')+'</th><th>Exact</th><th>Hit%</th></tr></thead>'+
 '<tbody>'+rows+'</tbody></table></div></details>'+
 '<p class="tpHint">Totals reward participation; use “Pts / pick” or “Hit rate” for a fairer comparison when players have different numbers of predictions.</p></div>';
}
function tpRecent(club){
 const matches=tpArr(club.recent_matches);
 return '<div class="tpCard"><div class="tpHead"><h3>📅 Recent '+tpEsc(club.club)+' games</h3>'+
 '<span class="tpChip">Official results</span></div>'+
 (matches.length?matches.map(m=>
  '<div class="tpFixture"><div><strong>'+tpEsc(m.home_team)+' '+tpNumber(m.actual_home)+
  '–'+tpNumber(m.actual_away)+' '+tpEsc(m.away_team)+'</strong>'+
  '<small>MW'+tpNumber(m.matchweek)+' · '+tpNumber(m.picks)+' predictions · '+tpPct(m.scoring,m.picks)+' scoring</small></div>'+
  '<div><b>'+tpNumber(m.points)+' pts</b><small>'+tpNumber(m.exacts)+' exact</small></div></div>'
 ).join(''):'<div class="tpEmpty">No official results for this team yet.</div>')+
 '<p class="tpHint">Latest five completed games involving this team. Points include every active player’s scored prediction.</p></div>';
}
function tpDetailHtml(){
 const c=tpCurrent();
 if(!c)return '<div class="tpEmpty">No team statistics available yet.</div>';
 const players=tpArr(c.players),eligible=tpOrder(players,'points');
 const worst=[...eligible].sort((a,b)=>tpNumber(a.points)-tpNumber(b.points)||
  tpNumber(a.picks)-tpNumber(b.picks)||tpName(a).localeCompare(tpName(b)));
 const avg=tpNumber(c.league_picks)?tpNumber(c.league_points)/tpNumber(c.league_picks):0;
 return '<div id="tp-team-detail">'+
  '<div class="tpCard" style="background:linear-gradient(145deg,#fff,#f8f5ff);border-color:#ded4f0">'+
   '<div class="tpHead"><div><h3 style="font-size:19px">⚽ '+tpEsc(c.club)+'</h3>'+
   '<p class="tpSub">'+tpNumber(c.scored_matches)+' results scored · '+tpNumber(c.season_matches)+' scheduled this season</p></div>'+
   '<span class="tpChip">'+tpNumber(c.wins)+'W '+tpNumber(c.draws)+'D '+tpNumber(c.losses)+'L</span></div>'+
   '<div class="tpStats">'+tpStat(c.league_points,'League points')+tpStat(tpCompact(avg),'Pts / pick')+tpStat(c.league_exacts,'Exact scores')+'</div>'+
   '<p class="tpHint">'+tpNumber(c.league_picks)+' predictions recorded · '+tpPct(c.league_scoring,c.league_picks)+
    ' scoring picks · '+tpNumber(c.league_missed)+' missing entries across completed games</p>'+
   '</div>'+
  '<div class="tpCard"><div class="tpHead"><h3>🏆 Who knows '+tpEsc(c.club)+' best?</h3>'+
    '<span class="tpChip">Total earned points</span></div>'+
   '<div class="tpRanks">'+
    '<div class="tpRankBox good"><h4>🥇 Most points</h4>'+tpRankRows(eligible,'points',3)+'</div>'+
    '<div class="tpRankBox bad"><h4>😬 Fewest points</h4>'+tpRankRows(worst,'points',3)+'</div>'+
   '</div>'+
   '<p class="tpHint">Only players with at least one scored prediction are ranked. Points totals are shown with games predicted; ties are possible.</p></div>'+
  '<div class="tpCard"><div class="tpHead"><h3>✨ Interesting player records</h3>'+
    '<span class="tpChip">'+tpEsc(c.club)+'</span></div>'+
    tpRivalInsights(players)+
   '<p class="tpHint">Supporter and doubter counts use matches with official results, not future predictions. Hit-rate honours require at least two attempts.</p></div>'+
  tpPersonal(c,players)+tpFullTable(c,players)+tpRecent(c)+
  '</div>';
}
function tpRefreshDetails(){
 const h=document.querySelector('.sfHost .tpHost');
 if(!h)return;
 const table=h.querySelector('#tp-club-league-table');
 if(table)table.outerHTML=tpClubLeagueTable();
 const detail=h.querySelector('#tp-team-detail');
 if(detail)detail.outerHTML=tpDetailHtml();
 const choice=h.querySelector('#tp-team-list');
 if(choice)choice.innerHTML=tpTeamButtons(tpTeams(),tpCurrent());
}
async function tpMain(host,tabsMarkup){
 tpCss();
 try{
  await tpLoad(false);
  if(!host.isConnected||!document.querySelector('#nav button[data-v="stats"].active'))return;
  if(!tpTeams().length){
   host.innerHTML=tabsMarkup+'<div class="tpEmpty">No fixture clubs are available in the league yet.</div>';
   return;
  }
  host.innerHTML=tabsMarkup+'<div class="tpHost">'+
   '<div class="tpHeader"><div class="tpHead"><div><h2>⚽ Premier League Club Stats</h2>'+
   '<p class="tpHint">All 20 Premier League clubs — compared using the prediction points earned by our league members.</p></div>'+
   '<button type="button" class="tpRefresh" data-tp-refresh>↻ Refresh</button></div>'+
   '<div class="tpStats">'+tpStat(tpTeams().length,'Teams')+
   tpStat(tpData?.completed_fixtures,'Completed games')+
   tpStat(tpData?.player_count,'League players')+'</div></div>'+
   tpClubLeagueTable()+tpClubChooser()+tpDetailHtml()+'</div>';
 }catch(err){
  if(host?.isConnected){
   host.innerHTML=tabsMarkup+'<div class="sfError">Could not load Premier League Club Stats: '+
    tpEsc(err.message||String(err))+
   '<br>Please try again or refresh the app.</div>';
  }
 }
}
window.renderPLPTeamStats=tpMain;
document.addEventListener('input',e=>{
 if(e.target?.id!=='tp-search')return;
 tpFilter=e.target.value;
 const choice=document.getElementById('tp-team-list');
 if(choice)choice.innerHTML=tpTeamButtons(tpTeams(),tpCurrent());
});
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-tp-team],[data-tp-mode],[data-tp-refresh],[data-tp-table-sort]');
 if(!button||!document.querySelector('.sfHost .tpHost'))return;
 e.preventDefault();
 if(button.dataset.tpTableSort){
  if(!['total','average','exacts','accuracy'].includes(button.dataset.tpTableSort))return;
  tpTableSort=button.dataset.tpTableSort;
  tpRefreshDetails();
  return;
 }
 if(button.dataset.tpTeam){
  tpChosen=button.dataset.tpTeam;
  tpPlayerId=null;tpRefreshDetails();
  document.getElementById('tp-team-detail')?.scrollIntoView({behavior:'smooth',block:'start'});
  return;
 }
 if(button.dataset.tpMode){
  tpMode=button.dataset.tpMode;
  tpRefreshDetails();return;
 }
 if(button.hasAttribute('data-tp-refresh')){
  const label=button.textContent;button.disabled=true;button.textContent='Refreshing…';
  tpLoad(true).then(()=>tpRefreshDetails()).catch(err=>alert('Refresh failed: '+err.message))
  .finally(()=>{if(button.isConnected){button.disabled=false;button.textContent=label}});
 }
});
document.addEventListener('change',e=>{
 if(e.target?.id==='tp-person'){
  tpPlayerId=e.target.value;
  tpRefreshDetails();
 }
});
document.addEventListener('toggle',e=>{
 if(e.target?.id==='tp-full-ranking')tpAllOpen=e.target.open;
},true);
window.addEventListener('focus',()=>{tpFetched=0});
tpCss();
