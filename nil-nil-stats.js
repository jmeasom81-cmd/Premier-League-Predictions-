// 0–0 STATISTICS — member-visible, official-results-only goalless draw analysis.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const nnSb=createClient(
 'https://jzrbaeyvwagrwukntjbk.supabase.co',
 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);
let nnUser=null,nnLeague=null,nnData=null,nnLoadedAt=0,nnPending=null;
let nnRankMode='points',nnClubMode='nil_picks',nnChosenPlayer=null;
const nnArray=x=>Array.isArray(x)?x:[];
const nnN=x=>Number(x||0);
const nnName=x=>x?.display_name||x?.team_name||'Player';
const nnEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nnPercent=(n,d)=>d?Math.round(100*n/d)+'%':'—';
const nnExactPercent=x=>nnN(x.nil_picks)?nnPercent(x.exact_nil,x.nil_picks):'—';
const nnDay=x=>{
 try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric'}).format(new Date(x))}
 catch{return ''}
};
function nnStyle(){
 if(document.getElementById('nn-style'))return;
 const el=document.createElement('style');el.id='nn-style';el.textContent=[
 '.nnRoot{font-size:12px;color:#302747}',
 '.nnHero{border:1px solid #ded5ec;background:linear-gradient(145deg,#2e195d,#6840a8);color:white;border-radius:18px;padding:18px;margin:12px 0}',
 '.nnHero h2{margin:0;font-size:21px;color:white;font-weight:950}',
 '.nnHero p{color:#e6ddf5;font-size:11px;line-height:1.5;margin:7px 0 0}',
 '.nnSummary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:13px}',
 '.nnMetric{background:#ffffff1e;border:1px solid #ffffff33;border-radius:12px;padding:10px 5px;text-align:center}',
 '.nnMetric b{display:block;font-size:21px;color:#fff}.nnMetric small{display:block;font-size:9px;line-height:1.25;color:#ece6f8;margin-top:4px}',
 '.nnCard{background:#fff;border:1px solid #e8e3f0;border-radius:16px;padding:14px;margin:12px 0;box-shadow:0 6px 14px #1a123710}',
 '.nnHead{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}',
 '.nnHead h3{font-size:15px;font-weight:900;color:#2c1a50;margin:0}',
 '.nnTag{font-size:9px;border-radius:20px;background:#f2edfb;color:#533197;padding:6px 9px;font-weight:950;white-space:nowrap}',
 '.nnHint{font-size:10px;color:#7c7189;line-height:1.55;margin:6px 0}',
 '.nnRankModes{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}',
 '.nnMode{border:1px solid #e2d9ed;background:#f8f6fb;color:#62547a;border-radius:10px;padding:8px 10px;font-weight:850;font-size:10px;cursor:pointer}',
 '.nnMode.active{background:#55319b;border-color:#55319b;color:#fff}',
 '.nnTableWrap{overflow-x:auto;border:1px solid #ede8f4;border-radius:12px}',
 '.nnTable{border-collapse:collapse;width:100%;font-size:10px;min-width:320px}',
 '.nnTable th{font-size:9px;text-align:right;color:#6f6480;background:#f6f3fa;padding:9px 6px;white-space:nowrap}',
 '.nnTable th:first-child{text-align:left}',
 '.nnTable td{padding:9px 6px;border-top:1px solid #efeaf4;text-align:right;color:#3b3050;vertical-align:middle}',
 '.nnTable td:first-child{text-align:left}',
 '.nnTable td b{font-size:11px;color:#2a184e}',
 '.nnTable td small{display:block;font-size:8.5px;color:#857b91;margin-top:4px}',
 '.nnTable tr.nnMine{background:#f1eafa}',
 '.nnSublist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}',
 '.nnHonor{border:1px solid #e6e0ef;background:#faf8fe;border-radius:12px;padding:11px}',
 '.nnHonor strong{font-size:12px;color:#2b1b4b;display:block;margin-bottom:8px}',
 '.nnHonor p{font-size:10px;color:#61566e;margin:6px 0;line-height:1.4}',
 '.nnHonor p b{color:#4d2595}',
 '.nnRow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid #f0edf5}',
 '.nnRow:last-child{border-bottom:0}',
 '.nnRow strong{font-size:11px;color:#2e2050}.nnRow small{font-size:9px;display:block;color:#8a8295;margin-top:3px}',
 '.nnRow b{color:#4c2691;white-space:nowrap;font-size:13px}',
 '.nnSelect{width:100%;border:1px solid #ded6e9;border-radius:11px;font-size:13px;padding:11px;background:white;color:#2d194f;margin-top:5px}',
 '.nnTriples{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0}',
 '.nnTile{border-radius:11px;background:#f7f4fa;padding:9px 6px;text-align:center}',
 '.nnTile b{font-size:18px;font-weight:950;color:#38206c;display:block}',
 '.nnTile small{font-size:8px;color:#756b81;display:block;margin-top:5px;line-height:1.3}',
 '.nnNote{border-radius:10px;background:#f1f7f4;color:#35654d;padding:10px;font-size:10px;line-height:1.5}',
 '.nnResult{padding:11px 0;border-bottom:1px solid #eeeaf4}',
 '.nnResult:last-child{border-bottom:0}',
 '.nnResult strong{font-size:12px;color:#2b1c4e;display:block}',
 '.nnResult small{font-size:9px;color:#7c718a;line-height:1.45;display:block;margin-top:6px}',
 '.nnClubs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
 '.nnClub{border:1px solid #e9e4f1;border-radius:12px;padding:10px;background:#fcfbfe}',
 '.nnClub strong{font-size:11px;display:block;color:#311e59}.nnClub small{font-size:9px;color:#817788;display:block;margin-top:5px}',
 '.nnClub b{color:#4b269d;font-size:16px;display:block;margin-top:7px}',
 '.nnAction{border:1px solid #dacdf0;background:#f5f1fc;color:#542d96;font-size:10px;font-weight:900;border-radius:10px;padding:8px 11px;cursor:pointer}',
 '.nnEmpty{padding:12px;border:1px dashed #ddd5e9;border-radius:10px;color:#807789;font-size:11px;text-align:center}',
 '@media(max-width:360px){.nnSublist{grid-template-columns:1fr}.nnClub{padding:8px}}',
 '@media(min-width:620px){.nnClubs{grid-template-columns:repeat(4,minmax(0,1fr))}}'
 ].join('');
 document.head.appendChild(el);
}
async function nnContext(){
 const {data:{session}}=await nnSb.auth.getSession();
 const uid=session?.user?.id;
 if(!uid){nnUser=null;nnLeague=null;nnData=null;throw Error('Sign in to view 0–0 Stats')}
 if(nnUser===uid&&nnLeague)return nnLeague;
 const {data,error}=await nnSb.from('league_members').select('league_id,joined_at,status')
  .eq('user_id',uid).eq('status','active').order('joined_at',{ascending:false}).limit(1);
 if(error)throw error;
 if(!data?.length)throw Error('No active league membership found');
 nnUser=uid;nnLeague=data[0].league_id;nnData=null;nnLoadedAt=0;
 return nnLeague;
}
async function nnLoad(force=false){
 const league=await nnContext();
 if(!force&&nnData&&Date.now()-nnLoadedAt<35000)return nnData;
 if(nnPending)return nnPending;
 nnPending=(async()=>{
  const {data,error}=await nnSb.rpc('get_nil_nil_stats',{p_league_id:league});
  if(error)throw error;
  nnData=data||{};nnLoadedAt=Date.now();
  return nnData;
 })().finally(()=>{nnPending=null});
 return nnPending;
}
const nnPlayers=()=>nnArray(nnData?.players);
const nnClubs=()=>nnArray(nnData?.clubs);
const nnNilResults=()=>nnArray(nnData?.nil_results);
function nnCompare(a,b,mode=nnRankMode){
 if(mode==='attempts')return nnN(b.nil_picks)-nnN(a.nil_picks)||
   nnN(b.exact_nil)-nnN(a.exact_nil)||nnN(b.nil_points)-nnN(a.nil_points)||
   nnName(a).localeCompare(nnName(b));
 if(mode==='exacts')return nnN(b.exact_nil)-nnN(a.exact_nil)||
   nnN(b.nil_points)-nnN(a.nil_points)||nnN(b.nil_picks)-nnN(a.nil_picks)||
   nnName(a).localeCompare(nnName(b));
 if(mode==='accuracy')return (nnN(b.nil_picks)>=2?nnN(b.exact_pct):-1)-
   (nnN(a.nil_picks)>=2?nnN(a.exact_pct):-1)||
   nnN(b.exact_nil)-nnN(a.exact_nil)||nnN(b.nil_picks)-nnN(a.nil_picks)||
   nnName(a).localeCompare(nnName(b));
 return nnN(b.nil_points)-nnN(a.nil_points)||
   nnN(b.exact_nil)-nnN(a.exact_nil)||nnN(b.nil_picks)-nnN(a.nil_picks)||
   nnName(a).localeCompare(nnName(b));
}
function nnLeaders(players,kind='nil_points',ascending=false){
 const p=players.filter(x=>nnN(x.nil_picks)>0);
 return [...p].sort((a,b)=>(ascending?1:-1)*(nnN(a[kind])-nnN(b[kind]))||
    nnN(b.nil_picks)-nnN(a.nil_picks)||nnName(a).localeCompare(nnName(b)))
  .slice(0,3).map((x,i)=>
   '<p>'+(i+1)+'. <b>'+nnEsc(nnName(x))+'</b> · '+nnN(x[kind])+
    (kind==='nil_points'?' pts':kind==='exact_nil'?' exact':' picks')+'</p>'
  ).join('')||'<p>Not enough data yet.</p>';
}
function nnHero(){
 const completed=nnN(nnData?.completed_matches);
 const actual=nnN(nnData?.actual_nil_matches);
 const nil=nnN(nnData?.nil_picks),exact=nnN(nnData?.exact_nil);
 return '<div class="nnHero"><h2>🥅 0–0 Stats</h2>'+
  '<p>The goalless draw: boring on the pitch, brilliant if you predicted it. Who in our league knows when nothing will happen?</p>'+
  '<div class="nnSummary">'+
   '<div class="nnMetric"><b>'+actual+'</b><small>Real 0–0 results</small></div>'+
   '<div class="nnMetric"><b>'+nil+'</b><small>0–0 predictions</small></div>'+
   '<div class="nnMetric"><b>'+exact+'</b><small>Exact 0–0 hits</small></div>'+
  '</div><p>'+completed+' completed games · '+nnPercent(actual,completed)+' finished goalless · '+
    nnN(nnData?.nil_points)+' total points earned from 0–0 predictions this season.</p></div>';
}
function nnHonours(){
 const players=nnPlayers();
 return '<section class="nnCard"><div class="nnHead"><h3>🏅 The goalless honours</h3><span class="nnTag">Our players</span></div>'+
 '<div class="nnSublist">'+
 '<div class="nnHonor"><strong>🏆 Most points from 0–0</strong>'+nnLeaders(players,'nil_points')+'</div>'+
 '<div class="nnHonor"><strong>🎯 Most exact 0–0s</strong>'+nnLeaders(players,'exact_nil')+'</div>'+
 '<div class="nnHonor"><strong>😴 Biggest 0–0 believer</strong>'+nnLeaders(players,'nil_picks')+'</div>'+
 '<div class="nnHonor"><strong>😬 Most failed 0–0 calls</strong>'+nnLeaders(players,'lost_nil')+'</div>'+
 '</div><p class="nnHint">A 0–0 pick earns 3 points when the game ends 0–0, 1 point for any other draw, or 0 if either side wins.</p></section>';
}
function nnPlayerTable(){
 const order=[...nnPlayers()].sort((a,b)=>nnCompare(a,b));
 const sections=[
  ['points','0–0 points'],['attempts','Most picked'],['exacts','Most exact'],['accuracy','Exact %']
 ];
 return '<section class="nnCard"><div class="nnHead"><h3>📊 0–0 player league table</h3>'+
  '<span class="nnTag">'+nnN(nnData?.player_count)+' players</span></div>'+
  '<p class="nnHint">All players included. See who calls the nil-nil and who earns the points.</p>'+
  '<div class="nnRankModes">'+sections.map(([id,label])=>
    '<button type="button" data-nn-rank="'+id+'" class="nnMode '+(nnRankMode===id?'active':'')+
    '" aria-pressed="'+(nnRankMode===id?'true':'false')+'">'+label+'</button>').join('')+'</div>'+
  '<div class="nnTableWrap"><table class="nnTable"><thead><tr>'+
  '<th>Player</th><th>0–0 picks</th><th>Exact</th><th>Draw pts</th><th>0–0 pts</th></tr></thead><tbody>'+
  order.map((p,i)=>
    '<tr class="'+(p.user_id===nnUser?'nnMine':'')+'"><td><b>'+(i+1)+'. '+
    nnEsc(p.badge||'⚽')+' '+nnEsc(nnName(p))+'</b><small>'+
    (nnN(p.nil_picks)?nnExactPercent(p)+' exact accuracy':'No 0–0 picks')+'</small></td>'+
    '<td>'+nnN(p.nil_picks)+'</td><td>'+nnN(p.exact_nil)+'</td><td>'+
    nnN(p.draw_nil)+'</td><td><b>'+nnN(p.nil_points)+'</b></td></tr>'
  ).join('')+'</tbody></table></div>'+
  '<p class="nnHint">“Draw pts” = 1-point returns from predicting 0–0 when the match ended another draw. Exact % is only ranked with at least two attempts.</p></section>';
}
function nnSpotlight(){
 const players=nnPlayers();
 const selected=players.find(x=>x.user_id===nnChosenPlayer)||
  players.find(x=>x.user_id===nnUser)||players[0];
 if(!selected)return '';
 nnChosenPlayer=selected.user_id;
 const n=nnN(selected.nil_picks);
 return '<section class="nnCard"><div class="nnHead"><h3>👤 Nil-nil player spotlight</h3>'+
 '<span class="nnTag">Personal record</span></div>'+
 '<label for="nn-person" class="nnHint">Choose a player</label>'+
 '<select id="nn-person" class="nnSelect">'+[...players].sort((a,b)=>nnName(a).localeCompare(nnName(b)))
  .map(x=>'<option value="'+nnEsc(x.user_id)+'" '+(x.user_id===selected.user_id?'selected':'')+'>'+
   nnEsc(nnName(x))+'</option>').join('')+'</select>'+
 '<div class="nnTriples"><div class="nnTile"><b>'+nnN(selected.nil_picks)+'</b><small>0–0 picks</small></div>'+
  '<div class="nnTile"><b>'+nnN(selected.nil_points)+'</b><small>Points earned</small></div>'+
  '<div class="nnTile"><b>'+nnExactPercent(selected)+'</b><small>Exact hit rate</small></div></div>'+
 '<div class="nnRow"><div><strong>🎯 Called the goalless draw</strong><small>Correct 0–0 predictions</small></div><b>'+nnN(selected.exact_nil)+'</b></div>'+
 '<div class="nnRow"><div><strong>🤝 Predicted 0–0, got another draw</strong><small>One point each</small></div><b>'+nnN(selected.draw_nil)+'</b></div>'+
 '<div class="nnRow"><div><strong>😬 Predicted 0–0, someone won</strong><small>Zero points each</small></div><b>'+nnN(selected.lost_nil)+'</b></div>'+
 '<div class="nnRow"><div><strong>👀 Missed actual 0–0s</strong><small>Predicted a different score</small></div><b>'+nnN(selected.wrong_on_nil)+'</b></div>'+
 '<div class="nnRow"><div><strong>📉 0–0 prediction tendency</strong><small>Share of '+nnN(selected.predictions)+' submitted predictions in completed matches</small></div>'+
  '<b>'+nnPercent(n,nnN(selected.predictions))+'</b></div>'+
 '<div class="nnNote">'+(n?nnEsc(nnName(selected))+' has earned '+
  nnN(selected.nil_points)+' points from '+n+' nil-nil predictions.':
  nnEsc(nnName(selected))+' hasn’t predicted a 0–0 in a completed fixture yet.')+
 '</div></section>';
}
function nnClubTable(){
 const sortModes=[['nil_picks','Most predicted 0–0'],['actual_nil','Most actual 0–0']];
 const sorted=[...nnClubs()].sort((a,b)=>
  nnN(b[nnClubMode])-nnN(a[nnClubMode])||
  nnN(b.nil_picks)-nnN(a.nil_picks)||a.club.localeCompare(b.club));
 return '<section class="nnCard"><div class="nnHead"><h3>⚽ Which clubs scream 0–0?</h3>'+
  '<span class="nnTag">All '+nnClubs().length+' teams</span></div>'+
  '<p class="nnHint">Number of goalless predictions involving each club, compared with how often its games really finished 0–0.</p>'+
  '<div class="nnRankModes">'+sortModes.map(([mode,name])=>
   '<button type="button" data-nn-club-sort="'+mode+'" class="nnMode '+(nnClubMode===mode?'active':'')+
   '" aria-pressed="'+(nnClubMode===mode?'true':'false')+'">'+name+'</button>').join('')+'</div>'+
  '<div class="nnClubs">'+sorted.map((c,i)=>
   '<div class="nnClub"><strong>'+String(i+1)+'. '+nnEsc(c.club)+'</strong>'+
     '<b>'+nnN(c[nnClubMode])+'</b>'+
     '<small>'+nnN(c.nil_picks)+' goalless predictions</small>'+
     '<small>'+nnN(c.actual_nil)+' real 0–0s in '+nnN(c.completed_matches)+' matches</small></div>'
  ).join('')+'</div>'+
  '<p class="nnHint">Each match belongs to two clubs here. Club-level predictions therefore appear for both participating teams, not twice in league totals.</p></section>';
}
function nnMatchResults(){
 const games=nnNilResults();
 return '<section class="nnCard"><div class="nnHead"><h3>🥅 Every actual 0–0</h3>'+
 '<span class="nnTag">'+games.length+' matches</span></div>'+
 '<p class="nnHint">Official goalless draws and the players who correctly predicted them.</p>'+
 (games.length?games.map(f=>'<div class="nnResult"><strong>'+nnEsc(f.home_team)+' 0–0 '+
   nnEsc(f.away_team)+'</strong><small>MW'+nnN(f.matchweek)+' · '+nnDay(f.kickoff_at)+
   ' · '+nnN(f.exact_predictors)+' exact prediction'+(nnN(f.exact_predictors)===1?'':'s')+
   ' · '+nnN(f.other_draw_predictors)+' predicted another draw</small>'+
   '<small><b>Called it:</b> '+(nnArray(f.exact_players).length?
    nnArray(f.exact_players).map(p=>nnEsc(nnName(p))).join(', '):
    'Nobody got the exact score')+'</small></div>'
 ).join(''):'<div class="nnEmpty">No official 0–0 results yet.</div>')+
 '</section>';
}
function nnPopularCalls(){
 const games=nnArray(nnData?.bold_calls).slice(0,8);
 if(!games.length)return '';
 return '<section class="nnCard"><div class="nnHead"><h3>🔮 The boldest 0–0 predictions</h3>'+
 '<span class="nnTag">Completed fixtures</span></div>'+
 '<p class="nnHint">Games where the largest number of our members backed 0–0, whether or not they were right.</p>'+
 games.map(f=>
 '<div class="nnResult"><strong>'+nnEsc(f.home_team)+' '+
 nnN(f.actual_home)+'–'+nnN(f.actual_away)+' '+nnEsc(f.away_team)+'</strong>'+
 '<small>'+nnN(f.nil_picks)+' members predicted 0–0 · '+nnN(f.scoring_nil_picks)+
 ' earned points · '+(f.actual_nil?'🎯 Exact goalless result':'Actual result shown above')+'</small></div>'
 ).join('')+'</section>';
}
function nnDrawPage(){
 return '<div class="nnRoot">'+nnHero()+nnHonours()+
  '<div id="nn-player-table">'+nnPlayerTable()+'</div>'+
  '<div id="nn-spotlight">'+nnSpotlight()+'</div>'+
  '<div id="nn-clubs">'+nnClubTable()+'</div>'+
  nnMatchResults()+nnPopularCalls()+
  '<div class="nnCard"><div class="nnHead"><h3>About these numbers</h3>'+
   '<button type="button" data-nn-refresh class="nnAction">↻ Refresh stats</button></div>'+
   '<p class="nnHint">Only completed matches with official results and the saved predictions for their current fixture cycles are counted. Pending and live games are excluded. All statistics update as official results arrive.</p></div></div>';
}
async function nnRender(host,tabs){
 nnStyle();
 try{
  await nnLoad(false);
  if(!host?.isConnected||!document.querySelector('#nav button[data-v="stats"].active'))return;
  host.innerHTML=tabs+nnDrawPage();
 }catch(err){
  if(host?.isConnected)host.innerHTML=tabs+'<div class="sfError">Could not load 0–0 Stats: '+
    nnEsc(err?.message||'Please refresh and try again.')+'</div>';
 }
}
function nnRerender(selector,renderer){
 const elem=document.querySelector(selector);if(elem)elem.innerHTML=renderer();
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-nn-rank],[data-nn-club-sort],[data-nn-refresh]');
 if(!b||!document.querySelector('.sfHost .nnRoot'))return;
 if(b.dataset.nnRank){
  if(!['points','attempts','exacts','accuracy'].includes(b.dataset.nnRank))return;
  nnRankMode=b.dataset.nnRank;nnRerender('#nn-player-table',nnPlayerTable);return;
 }
 if(b.dataset.nnClubSort){
  if(!['nil_picks','actual_nil'].includes(b.dataset.nnClubSort))return;
  nnClubMode=b.dataset.nnClubSort;nnRerender('#nn-clubs',nnClubTable);return;
 }
 if(b.hasAttribute('data-nn-refresh')){
  b.disabled=true;b.textContent='Refreshing…';
  nnLoad(true).then(()=>{const root=document.querySelector('.sfHost .nnRoot');
    if(root)root.outerHTML=nnDrawPage();
  }).catch(err=>alert('Could not refresh stats: '+err.message))
   .finally(()=>{if(b.isConnected){b.disabled=false;b.textContent='↻ Refresh stats'}});
 }
});
document.addEventListener('change',e=>{
 if(e.target?.id==='nn-person'){
  nnChosenPlayer=e.target.value;nnRerender('#nn-spotlight',nnSpotlight);
 }
});
window.renderPLPNilNilStats=nnRender;
nnStyle();
