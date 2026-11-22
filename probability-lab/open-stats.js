/* Football-only StatsBomb Open Data Explorer.
   Historical season coverage is intentionally limited and explicitly labelled.
   Browser requests only a tiny summary from our same-domain open-data API.
   This feature never imports betting data or modifies personal/competition records. */
(function(){
'use strict';
const $=id=>document.getElementById(id),core=window.PLLab,esc=core?.esc||((s)=>String(s));
if(!core||!$('osSeason'))return;
let catalog=null,season='2015/16',team='Leicester City',selectedId=null,loading=false;
const cache=new Map(),asText=v=>String(v??'');
const clear=(target,text)=>{$(target).textContent=text;};
function msg(text,isError){
 const node=$('osMessage');
 node.textContent=text;
 node.className='os-message'+(isError?' bad':'');
}
function list(){
 return catalog?.seasons?.[season]||[];
}
function teamNames(){
 const found=new Set();
 for(const r of list()){found.add(r[2]);found.add(r[3])}
 return [...found].sort((a,b)=>a.localeCompare(b));
}
function setOptions(id,choices,selectedValue,valueGetter,captionGetter){
 const el=$(id),previous=selectedValue??el.value;
 el.replaceChildren();
 for(const item of choices){
  const opt=document.createElement('option');
  opt.value=valueGetter(item);
  opt.textContent=captionGetter(item);
  el.appendChild(opt);
 }
 if(choices.some(x=>valueGetter(x)===previous))el.value=previous;
 else if(choices.length)el.value=valueGetter(choices[0]);
}
function chooseSeason(){
 season=$('osSeason').value;
 const teams=teamNames();
 const suggested=teams.find(n=>core.norm(n)===core.norm(team))||teams.find(n=>core.norm(n)==='leicester city')||teams[0];
 setOptions('osClub',teams,suggested,n=>n,n=>n);
 team=$('osClub').value;
 chooseTeam();
 $('osCoverage').textContent=season==='2015/16'?
  '2015/16 · complete Premier League match index · 380 matches':
  '2003/04 · Arsenal matches only · 38 matches (not a complete league season)';
}
function chooseTeam(){
 team=$('osClub').value;
 const matches=list().filter(x=>x[2]===team||x[3]===team);
 setOptions('osMatch',matches,null,x=>String(x[0]),x=>x[1]+' · '+x[2]+' '+x[4]+'–'+x[5]+' '+x[3]);
 selectedId=Number($('osMatch').value)||null;
 $('osMatchCount').textContent=matches.length+' archived matches for '+team;
 clear('osSingleResult','Choose a match and select Analyse match to view verified football event statistics.');
 clear('osFormResult','Select Analyse last five to calculate a labelled, small-sample team summary.');
}
function safeNum(v,d=0){return typeof v==='number'&&Number.isFinite(v)?v.toFixed(d):'—'}
function statRow(name,a,b,unit=''){
 const disp=v=>v==null?'—':typeof v==='number'?safeNum(v,unit===' xG'?2:unit==='%'?1:0)+unit:esc(asText(v));
 return '<tr><th>'+esc(name)+'</th><td>'+disp(a)+'</td><td>'+disp(b)+'</td></tr>';
}
function matchSummary(match,summary){
 const byName=new Map(summary.teams.map(t=>[core.norm(t.team),t]));
 const home=byName.get(core.norm(match[2]))||null,away=byName.get(core.norm(match[3]))||null;
 if(!home||!away)return '<div class="notice">This match has incomplete team event coverage. Data has not been estimated.</div>';
 const metrics=[
  ['Shots','shots'],['Shots on target (event-based)','onTarget'],['Expected goals (StatsBomb xG)','xg',' xG'],
  ['Passes','passes'],['Completed passes','completedPasses'],['Pass completion','passCompletion','%'],
  ['Corners','corners'],['Fouls committed','fouls'],['Yellow cards','yellow'],['Red cards','red']];
 const table=metrics.map(([label,k,unit])=>statRow(label,home[k],away[k],unit)).join('');
 const leaders=summary.leaders||[];
 return '<div class="os-score"><div><b>'+esc(match[2])+'</b><div class="os-small">Home</div></div><strong>'+match[4]+'–'+match[5]+'</strong><div><b>'+esc(match[3])+'</b><div class="os-small">Away</div></div></div>'+
 '<p class="hint">'+esc(match[1])+' · '+safeNum(summary.eventCount)+' event records · Historical match, not a current fixture</p>'+
 '<div class="tablewrap"><table><thead><tr><th>Official open-data measure</th><th>'+esc(match[2])+'</th><th>'+esc(match[3])+'</th></tr></thead><tbody>'+table+'</tbody></table></div>'+
 (leaders.length?'<h3 style="margin-top:18px">Players with the most shots</h3><div class="tablewrap"><table><thead><tr><th>Player</th><th>Team</th><th>Shots</th><th>Goals</th><th>xG</th></tr></thead><tbody>'+leaders.slice(0,8).map(p=>'<tr><td>'+esc(p.player)+'</td><td>'+esc(p.team)+'</td><td>'+safeNum(p.shots)+'</td><td>'+safeNum(p.goals)+'</td><td>'+safeNum(p.xg,2)+'</td></tr>').join('')+'</tbody></table></div>':'')+
 '<p class="fine">xG is summed from individual StatsBomb shot events. "On target" uses shot outcomes Goal, Saved or Saved to Post and may differ from other providers. Passes include some set pieces; event-based statistics are not automatically equivalent to official league tables.</p>';
}
async function getMatch(id){
 if(cache.has(id))return cache.get(id);
 const response=await fetch('/api/open-stats?match='+encodeURIComponent(String(id)),{headers:{accept:'application/json'}});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||'Unable to retrieve open football data.');
 if(!Array.isArray(data.teams)||!data.teams.length||data.matchId!==id)throw Error('Unexpected event summary.');
 cache.set(id,data);return data;
}
function setBusy(flag){loading=flag;$('osAnalyzeMatch').disabled=flag;$('osAnalyzeForm').disabled=flag}
async function single(){
 if(loading||!selectedId)return;
 const match=list().find(x=>x[0]===selectedId);if(!match)return;
 setBusy(true);msg('Analysing official open football events for the selected match…');
 try{
  const stats=await getMatch(selectedId);
  $('osSingleResult').innerHTML=matchSummary(match,stats);
  msg('Historical match analysis loaded. No betting-related data was requested.');
 }catch(e){msg(e.message,true);clear('osSingleResult','No statistics were changed. Try a different historical match or retry later.')}
 finally{setBusy(false)}
}
async function recent(){
 if(loading||!catalog)return;
 const selected=team,rows=list().filter(x=>x[2]===selected||x[3]===selected).slice(0,5);
 if(!rows.length)return;
 setBusy(true);
 const results=[];const failures=[];
 for(let i=0;i<rows.length;i++){
  msg('Analysing '+(i+1)+' of '+rows.length+' historical matches for '+selected+'…');
  try{
   const stats=await getMatch(rows[i][0]);
   const t=stats.teams.find(x=>core.norm(x.team)===core.norm(selected));
   if(t)results.push({match:rows[i],stats:t});
   else failures.push(rows[i][1]+' (team event data unavailable)');
  }catch(e){failures.push(rows[i][1])}
 }
 const metrics=[['Shots','shots'],['Shots on target','onTarget'],['xG','xg'],['Passes','passes'],['Completed passes','completedPasses'],['Corners','corners'],['Fouls committed','fouls'],['Yellow cards','yellow'],['Red cards','red']];
 if(!results.length){$('osFormResult').textContent='No valid team summaries could be loaded. The server may be temporarily unable to reach the open-data provider.';msg('No matches loaded. Please retry later.',true);setBusy(false);return}
 let body='<p class="hint">Actual '+results.length+'/'+rows.length+' recent 2015/16 or 2003/04 open-data matches for '+esc(selected)+'. <b>Not current form.</b> Values below are per-game means based only on successfully loaded matches.</p>'+
 '<div class="tablewrap"><table><thead><tr><th>Measure</th><th>Mean / match</th><th>Data coverage</th></tr></thead><tbody>';
 for(const [label,key] of metrics){
  const vals=results.map(r=>r.stats[key]).filter(v=>typeof v==='number'&&Number.isFinite(v));
  const mean=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
  body+='<tr><td>'+esc(label)+'</td><td>'+safeNum(mean,key==='xg'?2:1)+'</td><td>'+vals.length+'/'+results.length+'</td></tr>';
 }
 body+='</tbody></table></div><p class="fine">'+results.map(r=>esc(r.match[1]+' '+(r.match[2]===selected?r.match[3]:r.match[2]))).join(' · ')+'</p>';
 if(failures.length)body+='<p class="hint">Excluded '+failures.length+' matches whose event data could not be loaded. Missing results are not treated as zero.</p>';
 $('osFormResult').innerHTML=body;
 msg('Loaded '+results.length+' valid historical match summaries; '+failures.length+' unavailable.');
 setBusy(false);
}
async function init(){
 msg('Loading official StatsBomb match index…');
 try{
  const res=await fetch('/open-stats-catalog.json',{cache:'force-cache'});
  if(!res.ok)throw Error('Historical match index unavailable.');
  const index=await res.json();
  if(!index.seasons||index.seasons['2015/16']?.length!==380||index.seasons['2003/04']?.length!==38)throw Error('Historical match index failed coverage checks.');
  catalog=index;
  $('osSeason').value='2015/16';
  chooseSeason();
  $('osAnalyzeMatch').addEventListener('click',single);
  $('osAnalyzeForm').addEventListener('click',recent);
  $('osSeason').addEventListener('change',chooseSeason);
  $('osClub').addEventListener('change',chooseTeam);
  $('osMatch').addEventListener('change',()=>{selectedId=Number($('osMatch').value)||null;});
  msg('Official football-only match index loaded: 380 games in 2015/16, plus 38 Arsenal games in 2003/04. Choose a fixture to analyse.');
 }catch(e){msg(e.message+' Results-only analysis is still available.',true);$('osAnalyzeMatch').disabled=true;$('osAnalyzeForm').disabled=true}
}
init();
window.PLLabOpenStats={getCachedMatches:()=>cache.size};
})();