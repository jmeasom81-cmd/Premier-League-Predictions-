/* Premier League Probability Lab — research extensions v2.
   Consumes vetted data exposed by the base application, without server-side personal data. */
(function(){
'use strict';
const core=window.PLLab;
if(!core){console.warn('Probability Lab core not available');return}
const $=id=>document.getElementById(id);
const esc=core.esc;
const norm=core.norm;
const percent=x=>Number.isFinite(x)?(x*100).toFixed(1)+'%':'—';
const number=x=>Number.isFinite(x)?x.toFixed(2):'—';
const snapshotKey='pllab_research_journal_v2';
let journal=[];
let currentClub='Arsenal';
try{const old=JSON.parse(localStorage.getItem(snapshotKey)||'[]');if(Array.isArray(old))journal=old.filter(x=>x&&x.home&&x.away&&Number.isFinite(x.homeProb)&&Number.isFinite(x.drawProb)&&Number.isFinite(x.awayProb)).slice(-100)}catch(e){journal=[]}
function save(){if(window.PLLabViewerMode)return;try{localStorage.setItem(snapshotKey,JSON.stringify(journal))}catch(e){$('journalStatus').textContent='This browser could not save the journal. You can export the entries.'}}
function own(matches,club){return matches.filter(r=>norm(r.home)===norm(club)||norm(r.away)===norm(club))}
function details(r,club){const atHome=norm(r.home)===norm(club),gf=atHome?r.hg:r.ag,ga=atHome?r.ag:r.hg;return {result:gf>ga?'W':gf===ga?'D':'L',gf,ga,atHome,other:atHome?r.away:r.home,score:r.hg+'–'+r.ag,date:r.date||'Date unknown',btts:r.hg>0&&r.ag>0,over:r.hg+r.ag>2,clean:ga===0}}
function filteredClub(){
 const all=own(core.getData(),currentClub);
 const side=$('clubSide').value,horizon=$('clubRange').value;
 const rows=side==='all'?all:all.filter(r=>side==='home'?norm(r.home)===norm(currentClub):norm(r.away)===norm(currentClub));
 rows.sort((a,b)=>((a.date||'').localeCompare(b.date||''))||(a.order||0)-(b.order||0));
 return horizon==='all'?rows:rows.slice(-Number(horizon));
}
function clubOptions(){
 const teams=core.getTeams(),sel=$('clubPicker');
 if(!sel)return;
 if(!teams.some(x=>norm(x)===norm(currentClub)))currentClub=teams[0]||'Arsenal';
 sel.innerHTML=teams.map(t=>'<option value="'+esc(t)+'"'+(norm(t)===norm(currentClub)?' selected':'')+'>'+esc(t)+'</option>').join('');
}
function renderClub(){
 if(!$('clubPicker'))return;
 clubOptions();
 const games=filteredClub();
 if(!games.length){$('clubStats').innerHTML='<div class="v2-zero">No completed matches for this club in your imported history and selected filter. Import more data or change the filter.</div>';$('clubRecent').innerHTML='';$('clubForm').innerHTML='';$('clubSplit').innerHTML='';return}
 const rows=games.map(r=>details(r,currentClub)),n=rows.length,w=rows.filter(x=>x.result==='W').length,d=rows.filter(x=>x.result==='D').length,l=n-w-d,goals=rows.reduce((a,r)=>a+r.gf,0),against=rows.reduce((a,r)=>a+r.ga,0),last=rows.slice(-6);
 $('clubStats').innerHTML=[
  ['Points / match',((w*3+d)/n).toFixed(2)],['Win frequency',percent(w/n)],['Goals scored',(goals/n).toFixed(2)],['Goals conceded',(against/n).toFixed(2)],
  ['Both scored',percent(rows.filter(x=>x.btts).length/n)],['Over 2.5 goals',percent(rows.filter(x=>x.over).length/n)],['Clean sheets',percent(rows.filter(x=>x.clean).length/n)],['Matches analysed',String(n)]
 ].map(([label,value])=>'<div class="v2-stat"><small>'+label+'</small><strong>'+value+'</strong></div>').join('');
 $('clubForm').innerHTML='<div class="v2-form">'+last.map(x=>'<span title="'+esc(x.date)+'" class="'+(x.result==='W'?'win':x.result==='D'?'draw':'loss')+'">'+x.result+'</span>').join('')+'</div><div class="v2-mini"><span class="win" style="width:'+100*w/n+'%"></span><span class="draw" style="width:'+100*d/n+'%"></span><span class="loss" style="width:'+100*l/n+'%"></span></div><p class="fine">All selected results: '+w+' wins · '+d+' draws · '+l+' defeats. Form letters are ordered oldest to newest.</p>';
 $('clubRecent').innerHTML=rows.slice(-8).reverse().map(x=>'<div class="v2-match"><div><b>'+esc(currentClub)+'</b> '+(x.atHome?'v':'@')+' '+esc(x.other)+'<div class="fine">'+esc(x.date)+'</div></div><div class="result">'+x.gf+'–'+x.ga+' <span class="'+(x.result==='W'?'good':x.result==='D'?'warn':'bad')+'">'+x.result+'</span></div></div>').join('');
 const atHome=games.filter(r=>norm(r.home)===norm(currentClub)).map(r=>details(r,currentClub)),away=games.filter(r=>norm(r.away)===norm(currentClub)).map(r=>details(r,currentClub));
 function split(name,arr){if(!arr.length)return '<div class="statrow"><span>'+name+'</span><span class="muted">No matches</span></div>';return '<div class="statrow"><span>'+name+' ('+arr.length+')</span><span>W '+arr.filter(r=>r.result==='W').length+' · D '+arr.filter(r=>r.result==='D').length+' · L '+arr.filter(r=>r.result==='L').length+'</span></div><div class="statrow"><span>Goals per match</span><span>'+number(arr.reduce((s,r)=>s+r.gf,0)/arr.length)+' scored / '+number(arr.reduce((s,r)=>s+r.ga,0)/arr.length)+' conceded</span></div>'}
 $('clubSplit').innerHTML=split('At home',atHome)+split('Away',away)+'<p class="fine">Filters apply to the selected number of games. This section describes past matches and is not an independent estimate of future results.</p>';
}
function fixtureRows(){
 const now=Date.now();
 return core.getFixtures().filter(f=>f&&f.home&&f.away&&Number.isFinite(Date.parse(f.date))&&Date.parse(f.date)>now);
}
function upcomingOptions(){
 const list=fixtureRows(),select=$('journalFixture');if(!select)return;
 const old=select.value;
 select.innerHTML=list.map(f=>'<option value="'+esc(f.home+'|'+f.away+'|'+f.date)+'">'+esc(f.home)+' v '+esc(f.away)+' · '+new Date(f.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',timeZone:'Europe/London'})+'</option>').join('');
 if(list.some(f=>f.home+'|'+f.away+'|'+f.date===old))select.value=old;
 $('journalFixtureState').textContent=list.length?list.length+' future fixtures available ('+(core.isLiveFixtures()?'provider feed':'reference schedule')+').':'No confirmed future fixtures. Connect the fixtures feed or wait for an updated schedule.';
 $('saveJournal').disabled=!list.length;
}
function findResult(item){
 const target=(item.kickoff||'').slice(0,10);
 return core.getData().find(r=>norm(r.home)===norm(item.home)&&norm(r.away)===norm(item.away)&&r.date===target);
}
function scoreSnapshot(item,result){
 const q=[item.homeProb,item.drawProb,item.awayProb];
 const actual=result.hg>result.ag?0:result.hg===result.ag?1:2;
 return {actual, brier:q.reduce((s,p,i)=>s+(p-(i===actual?1:0))**2,0)/3,
  logloss:-Math.log(Math.max(.000001,q[actual]))};
}
function saveForecast(){if(window.PLLabViewerMode)return;
 const selected=$('journalFixture').value;
 const [home,away,kickoff]=selected.split('|');
 if(!home||!away||!kickoff||!Number.isFinite(Date.parse(kickoff))||Date.parse(kickoff)<=Date.now()){$('journalStatus').textContent='Choose a future fixture to save a pre-match forecast.';return}
 const m=core.modelFor(home,away);
 if(!m){$('journalStatus').textContent='No reliable forecast available yet: import sufficient genuine match history before recording.';return}
 if(journal.some(x=>x.home===home&&x.away===away&&x.kickoff===kickoff)){$('journalStatus').textContent='A forecast for that fixture is already saved; the original pre-match snapshot is preserved.';return}
 journal.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2),home,away,kickoff,recorded:new Date().toISOString(),homeProb:m.probabilities.home,drawProb:m.probabilities.draw,awayProb:m.probabilities.away,homeGoals:m.probabilities.lh,awayGoals:m.probabilities.la,dataCount:core.getData().length});
 journal=journal.slice(-100);save();renderJournal();$('journalStatus').textContent='Forecast recorded before kick-off. Future data imports will be checked against this snapshot.';
}
function renderJournal(){
 if(!$('journalEntries'))return;
 upcomingOptions();
 let settled=0,brier=0;
 const entries=journal.slice().reverse().map(item=>{
  const result=findResult(item),score=result?scoreSnapshot(item,result):null;
  if(score){settled++;brier+=score.brier}
  return '<article class="v2-entry"><div class="heading"><span>'+esc(item.home)+' v '+esc(item.away)+'</span><span class="'+(result?'good':'warn')+'">'+(result?'Final '+result.hg+'–'+result.ag:'Awaiting result')+'</span></div><div class="meta">Kick-off '+esc(new Date(item.kickoff).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}))+' · Recorded '+esc(new Date(item.recorded).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/London'}))+' · '+item.dataCount+' historical matches</div><div class="probs"><span>Home '+percent(item.homeProb)+'</span><span>Draw '+percent(item.drawProb)+'</span><span>Away '+percent(item.awayProb)+'</span>'+(score?'<span>Brier '+score.brier.toFixed(3)+'</span>':'')+'</div><div class="v2-row"><button data-delete="'+esc(item.id)+'" aria-label="Delete this saved forecast">Delete forecast</button></div></article>';
 });
 $('journalEntries').innerHTML=entries.length?entries.join(''):'<div class="v2-zero">No forecasts saved. Choose an upcoming match and record the model probabilities before kick-off.</div>';
 $('journalTotal').textContent=journal.length;
 $('journalSettled').textContent=settled;
 $('journalBrier').textContent=settled?(brier/settled).toFixed(3):'—';
 $('journalEntries').querySelectorAll('[data-delete]').forEach(b=>{b.onclick=()=>{journal=journal.filter(x=>x.id!==b.dataset.delete);save();renderJournal()}});
}
function exportJournal(){
 if(!journal.length){$('journalStatus').textContent='No forecasts to export.';return}
 const headers=['fixture','kickoff','recorded','home_pct','draw_pct','away_pct','data_count','result','brier'];
 const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 const lines=[headers.join(',')].concat(journal.map(x=>{const r=findResult(x),b=r?scoreSnapshot(x,r).brier.toFixed(4):'';return [x.home+' v '+x.away,x.kickoff,x.recorded,(x.homeProb*100).toFixed(2),(x.drawProb*100).toFixed(2),(x.awayProb*100).toFixed(2),x.dataCount,r?r.hg+'-'+r.ag:'',b].map(quote).join(',')}));
 const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='probability-lab-forecast-journal.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function calibratedForecasts(){
 const all=core.getData();
 if(all.length<85||all.some(r=>!r.date))return{status:'For valid chronological testing, import at least 85 completed matches with a Date for every row.'};
 const ordered=all.slice().sort((a,b)=>a.date.localeCompare(b.date));
 const bins=[{min:0,max:.4,count:0,pred:0,success:0},{min:.4,max:.5,count:0,pred:0,success:0},{min:.5,max:.6,count:0,pred:0,success:0},{min:.6,max:1.01,count:0,pred:0,success:0}];
 let n=0,brier=0,baseline=0,logloss=0,hit=0;
 for(let i=Math.max(60,ordered.length-1200);i<ordered.length;i++){
  const r=ordered[i],train=ordered.slice(0,i).filter(t=>t.date<r.date);
  if(train.length<40)continue; // no knowledge of matches on the same date
  const m=core.modelFor(r.home,r.away,train);
  if(!m)continue;
  const p=m.probabilities,arr=[p.home,p.draw,p.away],actual=r.hg>r.ag?0:r.hg===r.ag?1:2,counts=[0,0,0];
  for(const t of train)counts[t.hg>t.ag?0:t.hg===t.ag?1:2]++;
  const base=counts.map(c=>c/train.length);
  brier+=arr.reduce((s,x,k)=>s+(x-(k===actual?1:0))**2,0)/3;
  baseline+=base.reduce((s,x,k)=>s+(x-(k===actual?1:0))**2,0)/3;
  logloss+=-Math.log(Math.max(.0000001,arr[actual]));
  const favourite=arr.indexOf(Math.max(...arr)),strength=arr[favourite],bin=bins.find(b=>strength>=b.min&&strength<b.max)||bins[3];
  bin.count++;bin.pred+=strength;if(favourite===actual){bin.success++;hit++}
  n++;
 }
 if(n<25)return{status:'Only '+n+' matches have sufficient prior team history. Add another season of dated results to evaluate calibration.'};
 return{n,brier:brier/n,baseline:baseline/n,logloss:logloss/n,accuracy:hit/n,bins};
}
function renderCalibration(){
 if(!$('calibrationContent'))return;
 const c=calibratedForecasts();
 if(c.status){$('calibrationContent').innerHTML='<div class="v2-zero">'+esc(c.status)+'</div>';return}
 let html='<div class="v2-statgrid"><div class="v2-stat"><small>Tested forecasts</small><strong>'+c.n+'</strong></div><div class="v2-stat"><small>Model Brier ↓</small><strong>'+c.brier.toFixed(3)+'</strong></div><div class="v2-stat"><small>Baseline Brier ↓</small><strong>'+c.baseline.toFixed(3)+'</strong></div><div class="v2-stat"><small>Outcome accuracy</small><strong>'+percent(c.accuracy)+'</strong></div></div>';
 html+='<div class="v2-callout '+(c.brier>=c.baseline?'warn':'')+'">'+(c.brier<c.baseline?'The model scored better than the simple pre-match result-frequency baseline in this dataset.':'The model did not outperform a simple pre-match result-frequency baseline in this dataset.')+' Lower Brier scores mean better calibrated and more accurate probability forecasts overall. Log loss: '+c.logloss.toFixed(3)+'. This is not evidence of betting profitability.</div>';
 html+='<p class="hint">Walk-forward evaluation uses up to the most recent 1,200 fixtures; each forecast only sees earlier-dated results. Earlier seasons remain available in the season explorer.</p><h3 style="margin-top:18px">Favourite outcome calibration</h3><p class="hint">When the model said the most likely outcome had a given probability, how often did that outcome actually happen?</p>';
 html+='<div class="v2-calibration muted"><span>Confidence</span><span>Observed success</span><span>Predicted</span><span>Games</span></div>';
 for(const b of c.bins){const label=Math.round(b.min*100)+'–'+(b.max>1?'100':Math.round(b.max*100))+'%';if(!b.count){html+='<div class="v2-calibration"><span>'+label+'</span><span class="muted">No matches</span><span>—</span><span>0</span></div>';continue}html+='<div class="v2-calibration"><span>'+label+'</span><div class="track" title="Observed '+percent(b.success/b.count)+'"><i style="width:'+percent(b.success/b.count)+'"></i></div><span>'+percent(b.pred/b.count)+'</span><span>'+b.count+'</span></div><div class="fine">Observed '+percent(b.success/b.count)+' from '+b.count+' matches; sample'+(b.count<15?' too small for strong conclusions.':'.')+'</div>';}
 $('calibrationContent').innerHTML=html;
}
function oddsForFixture(){
 const selected=$('oddsFixture')?.value||'',parts=selected.split('|'),home=parts[0],away=parts[1];
 const odds=core.getOdds(),out=[];
 const ev=odds.find(x=>norm(x.home_team)===norm(home)&&norm(x.away_team)===norm(away));
 if(ev)for(const b of ev.bookmakers||[])for(const m of b.markets||[]){
  if(m.key==='h2h'){const outcome=(m.outcomes||[]),get=t=>{const o=outcome.find(x=>norm(x.name)===norm(t));return o?Number(o.price):null};const H=get(home),D=get('Draw'),A=get(away);if([H,D,A].every(x=>x>1))out.push({name:b.title,prices:[H,D,A],updated:m.last_update||b.last_update||'',market:'h2h'})}
  if(m.key==='totals'){const vals=m.outcomes||[],o=vals.find(x=>x.name==='Over'&&Number(x.point)===2.5),u=vals.find(x=>x.name==='Under'&&Number(x.point)===2.5);if(o&&u&&o.price>1&&u.price>1)out.push({name:b.title,prices:[Number(o.price),Number(u.price)],market:'totals',updated:m.last_update||b.last_update||''})}
 }
 for(const b of core.getManualOdds().filter(x=>x.fixture===selected))out.push({name:b.provider+' (manual)',prices:[b.h,b.d,b.a],market:'h2h',updated:''});
 return{home,away,out};
}
function renderOddsLens(){
 if(!$('oddsResearch'))return;
 const f=oddsForFixture(),m=core.modelFor(f.home,f.away);
 if(!m){$('oddsResearch').innerHTML='<div class="v2-zero">Load enough completed matches for both teams to calculate independent model probabilities before comparing prices.</div>';return}
 const p=m.probabilities,markets=[{label:'Home win',p:p.home},{label:'Draw',p:p.draw},{label:'Away win',p:p.away},{label:'Over 2.5 goals',p:p.over},{label:'Under 2.5 goals',p:1-p.over}];
 let h='<h3>Model-implied fair decimal prices</h3><div class="v2-statgrid">'+markets.slice(0,4).map(x=>'<div class="v2-stat"><small>'+x.label+'</small><strong>'+number(1/x.p)+'</strong><div class="fine">Estimated chance '+percent(x.p)+'</div></div>').join('')+'</div>';
 const rows=f.out.map(o=>{let ps=o.market==='totals'?[p.over,1-p.over]:[p.home,p.draw,p.away];const total=o.prices.reduce((s,x)=>s+1/x,0);
 return{...o,over:total-1,vals:o.prices.map((price,i)=>({price,prob:ps[i],implied:1/price,normalised:(1/price)/total,difference:ps[i]-(1/price)/total,ev:ps[i]*price-1}))}});
 const summary=rows.filter(r=>r.market==='h2h'),totals=rows.filter(r=>r.market==='totals');
 h+='<p class="hint">A theoretical expected-value percentage is calculated as model probability × decimal price − 1. It assumes our estimated probability is exactly right, which is unlikely. These figures describe disagreement, not a recommendation to bet.</p>';
 function marketTable(arr,labels,title){if(!arr.length)return '';return '<h3 style="margin-top:19px">'+title+'</h3><div class="tablewrap"><table class="v2-gridtable"><thead><tr><th>Provider / market</th><th>Selection</th><th>Quoted</th><th>No-vig</th><th>Model</th><th>Gap</th><th>Model EV*</th></tr></thead><tbody>'+arr.flatMap(r=>r.vals.map((v,i)=>'<tr><td>'+esc(r.name)+'</td><td>'+labels[i]+'</td><td>'+v.price.toFixed(2)+'</td><td>'+percent(v.normalised)+'</td><td>'+percent(v.prob)+'</td><td>'+(v.difference>=0?'+':'')+(100*v.difference).toFixed(1)+'pp</td><td class="'+(v.ev>=0?'good':'bad')+'">'+(v.ev>=0?'+':'')+percent(v.ev)+'</td></tr>')).join('')+'</tbody></table></div>'}
 h+=marketTable(summary,['Home','Draw','Away'],'Full-time result market');
 h+=marketTable(totals,['Over 2.5','Under 2.5'],'Total goals market · exactly 2.5');
 if(!rows.length)h+='<div class="v2-zero">No current bookmaker prices loaded for this match. Press “Fetch UK bookmaker odds”, or add manually quoted 1X2 odds above.</div>';
 h+='<div class="v2-callout warn"><b>Interpret with uncertainty.</b> Small differences can reverse when model error, injury news, incomplete data and bookmaker margin are considered. “Model EV” is not verified value. *A mathematical scenario, not a forecast of profit. No stake or bet-placement functionality.</div>';
 $('oddsResearch').innerHTML=h;
}
function refresh(){
 // Keep large history datasets light: offscreen panels are rendered only
 // when the corresponding tab is opened (or its controls are used).
 const active=document.querySelector('.content.active')?.id||'overview';
 if(active==='clubs')renderClub();
 else if(active==='journal')renderJournal();
 else if(active==='odds')renderOddsLens();
 // Model calibration is intentionally deferred to the Audit tab.
}
$('clubPicker').addEventListener('change',e=>{currentClub=e.target.value;renderClub()});
['clubSide','clubRange'].forEach(id=>$(id).addEventListener('change',renderClub));
$('saveJournal').addEventListener('click',saveForecast);
$('exportJournal').addEventListener('click',exportJournal);
$('refreshJournal').addEventListener('click',renderJournal);
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.tab==='clubs')renderClub();if(btn.dataset.tab==='journal')renderJournal();if(btn.dataset.tab==='audit')renderCalibration();if(btn.dataset.tab==='odds')renderOddsLens()}));
['oddsFixture','refreshOdds','addOdds','clearManualOdds'].forEach(id=>$(id)?.addEventListener('change',renderOddsLens));
core.onUpdate(refresh);
refresh();
window.PLLabV2={refresh,renderOddsLens};
})();