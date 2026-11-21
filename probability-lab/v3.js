/* Premier League Probability Lab — Offline Research Toolkit v3
   All information is saved locally; no credentials or gambling transactions. */
(function(){
'use strict';
const core=window.PLLab;
if(!core){console.warn('Probability Lab core unavailable');return}
const get=id=>document.getElementById(id),norm=core.norm,esc=core.esc;
const pct=n=>Number.isFinite(n)?(n*100).toFixed(1)+'%':'—';
const fixed=n=>Number.isFinite(n)?n.toFixed(2):'—';
const number=n=>Number.isFinite(n)?n.toFixed(1):'—';
const localDate=iso=>{try{return new Date(iso).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return iso||'Unknown'}};
const dateText=iso=>iso?iso.slice(0,10):'Date missing';
const teamMatch=(a,b)=>norm(a)===norm(b);
const ordered=(r)=>r.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.order||0)-(b.order||0));
const unique=(arr)=>[...new Set(arr)];
let currentHome='Arsenal',currentAway='Manchester City';
let scenarioHome=1,scenarioAway=1,illustrativeHome=1.55,illustrativeAway=1.15;

function setAlert(id,message){const e=get(id);if(e)e.textContent=message;}
function renderOptions(id,selected){
 const el=get(id);if(!el)return;
 const teams=core.getTeams();
 el.innerHTML=teams.map(t=>'<option value="'+esc(t)+'"'+(teamMatch(t,selected)?' selected':'')+'>'+esc(t)+'</option>').join('');
 const matched=teams.find(t=>teamMatch(t,selected));el.value=matched||(teams[0]||'');
}
function renderSelectors(){
 ['manualFixtureHome','matchIntelHome','scenarioHome'].forEach(id=>renderOptions(id,id==='manualFixtureHome'||id==='matchIntelHome'||id==='scenarioHome'?currentHome:currentAway));
 ['manualFixtureAway','matchIntelAway','scenarioAway'].forEach(id=>renderOptions(id,currentAway));
}
function venueRows(team,side,range){
 const all=ordered(core.getData().filter(r=>side==='home'?teamMatch(r.home,team):side==='away'?teamMatch(r.away,team):teamMatch(r.home,team)||teamMatch(r.away,team)));
 return range==='all'?all:all.slice(-Number(range));
}
function asTeam(r,team){
 const isHome=teamMatch(r.home,team),gf=isHome?r.hg:r.ag,ga=isHome?r.ag:r.hg;
 return{gf,ga,outcome:gf>ga?'W':gf===ga?'D':'L',opponent:isHome?r.away:r.home,home:isHome,date:dateText(r.date),score:r.hg+'–'+r.ag};
}
function describeForm(team,side,n){
 const rows=venueRows(team,side,n),d=rows.map(r=>asTeam(r,team));
 const t=d.length,w=d.filter(r=>r.outcome==='W').length,l=d.filter(r=>r.outcome==='L').length,draws=t-w-l,gf=t?d.reduce((s,r)=>s+r.gf,0)/t:0,ga=t?d.reduce((s,r)=>s+r.ga,0)/t:0;
 return{team,rows:d,t,w,l,draws,gf,ga,winRate:t?w/t:null,btts:t?d.filter(r=>r.gf>0&&r.ga>0).length/t:null,over25:t?d.filter(r=>r.gf+r.ga>2).length/t:null,clean:t?d.filter(r=>r.ga===0).length/t:null};
}
function renderIntel(){
 if(!get('matchIntelHome'))return;
 const h=get('matchIntelHome').value,a=get('matchIntelAway').value,n=Number(get('matchIntelRange').value)||10;
 if(teamMatch(h,a)){get('matchIntelBody').innerHTML='<div class="v3-cta">Choose two different teams.</div>';return}
 const home=describeForm(h,'home',n),away=describeForm(a,'away',n);
 function teamPanel(m,venue){
  if(!m.t)return '<div class="v3-team"><h3>'+esc(m.team)+' · '+venue+'</h3><div class="v3-cta">No matching results. Import more match data to examine venue-specific form.</div></div>';
  const rows=[['Win frequency',m.winRate],['Both scored',m.btts],['Over 2.5 goals',m.over25],['Clean sheets',m.clean]];
  return '<div class="v3-team"><h3>'+esc(m.team)+' · '+venue+'</h3><div class="v3-figures"><div class="v3-figure"><small>Matches</small><b>'+m.t+'</b></div><div class="v3-figure"><small>GF / match</small><b>'+fixed(m.gf)+'</b></div><div class="v3-figure"><small>GA / match</small><b>'+fixed(m.ga)+'</b></div></div><p class="hint">'+m.w+' wins · '+m.draws+' draws · '+m.l+' defeats</p>'+rows.map(([label,val])=>'<div class="v3-bars"><label>'+label+'</label><span class="rail"><i style="width:'+pct(val)+'"></i></span><b>'+pct(val)+'</b></div>').join('')+'</div>';
 }
 let out='<div class="v3-sideby">'+teamPanel(home,'home matches')+teamPanel(away,'away matches')+'</div>';
 const hd=ordered(core.getData().filter(r=>(teamMatch(r.home,h)&&teamMatch(r.away,a))||(teamMatch(r.home,a)&&teamMatch(r.away,h)))).slice(-10);
 const hWin=hd.filter(r=>asTeam(r,h).outcome==='W').length,aWin=hd.filter(r=>asTeam(r,a).outcome==='W').length,ties=hd.length-hWin-aWin;
 out+='<div class="panel" style="margin-top:15px"><h2>Historical head-to-head</h2><p class="hint">Up to the last 10 meetings found in your dataset. This is descriptive history, not a forecast.</p>';
 if(hd.length){out+='<div class="v3-h2h"><div class="v3-figure"><small>'+esc(h)+' wins</small><b>'+hWin+'</b></div><div class="v3-figure"><small>Draws</small><b>'+ties+'</b></div><div class="v3-figure"><small>'+esc(a)+' wins</small><b>'+aWin+'</b></div></div>';
 out+=hd.slice().reverse().map(r=>'<div class="v3-match-row"><div><strong>'+esc(r.home)+' v '+esc(r.away)+'</strong><div class="v3-kickoff">'+esc(dateText(r.date))+'</div></div><b>'+r.hg+'–'+r.ag+'</b></div>').join('');
 }else out+='<div class="v3-cta">No previous meetings between these clubs in the loaded history.</div>';
 out+='</div>';
 const m=core.modelFor(h,a);
 out+='<div class="panel"><h2>Model assessment</h2>';
 if(m){const p=m.probabilities,s=m.sample;out+='<div class="v3-figures"><div class="v3-figure"><small>'+esc(h)+' win</small><b>'+pct(p.home)+'</b></div><div class="v3-figure"><small>Draw</small><b>'+pct(p.draw)+'</b></div><div class="v3-figure"><small>'+esc(a)+' win</small><b>'+pct(p.away)+'</b></div></div><p class="hint">Uses '+s.hh+' recorded home matches for '+esc(h)+' and '+s.aa+' recorded away matches for '+esc(a)+' in the full imported dataset. These may extend beyond the recent-form filters above.</p>';
 const caution=s.hh<8||s.aa<8?'Very limited home/away sample — model error may be substantial.':s.hh<16||s.aa<16?'Moderate sample — estimates remain uncertain.':'Larger observed team sample, although the model still ignores injuries, lineups and tactical changes.';
 out+='<div class="v3-alert">'+esc(caution)+' An apparent difference between home and away form is not automatically a reliable prediction of the fixture.</div>';
 }else out+='<div class="v3-cta">No valid team-level model yet. Need 25+ completed results and at least three relevant home/away games for each club.</div>';
 out+='</div>';
 out+='<div class="v3-buttonline"><button id="matchReportExport" class="btn secondary">Download match comparison</button><button id="matchUseScenario" class="btn secondary">Open Scenario Studio</button></div>';
 get('matchIntelBody').innerHTML=out;
 const exportBtn=get('matchReportExport');if(exportBtn)exportBtn.onclick=()=>downloadIntel(home,away,hd,m);
 const studioBtn=get('matchUseScenario');if(studioBtn)studioBtn.onclick=()=>{currentHome=h;currentAway=a;renderSelectors();renderScenario();document.querySelector('[data-tab="scenario"]')?.click()};
}
function download(filename,text,type){
 const url=URL.createObjectURL(new Blob([text],{type:type||'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),700);
}
function downloadIntel(home,away,head,m){
 const lines=['Premier League Probability Lab — match research report','Generated '+new Date().toISOString(),'Source: local imported historical results (not independently verified)','',home.team+' (home venue)','Matches: '+home.t,'W-D-L: '+home.w+'-'+home.draws+'-'+home.l,'Goals for per match: '+fixed(home.gf),'Goals against per match: '+fixed(home.ga),'Win frequency: '+pct(home.winRate),'',away.team+' (away venue)','Matches: '+away.t,'W-D-L: '+away.w+'-'+away.draws+'-'+away.l,'Goals for per match: '+fixed(away.gf),'Goals against per match: '+fixed(away.ga),'Win frequency: '+pct(away.winRate),'','Previous meetings: '+head.length];
 for(const r of head)lines.push(dateText(r.date)+' '+r.home+' '+r.hg+'-'+r.ag+' '+r.away);
 if(m){lines.push('','Historical model: home '+pct(m.probabilities.home)+', draw '+pct(m.probabilities.draw)+', away '+pct(m.probabilities.away))}
 lines.push('','Statistical research only. Models are uncertain and do not imply profitable betting.');
 download('match-research-'+norm(home.team).replace(/\s/g,'-')+'-vs-'+norm(away.team).replace(/\s/g,'-')+'.txt',lines.join('\n'));
}

function renderFixtureDesk(){
 if(!get('manualFixtureHome'))return;
 renderOptions('manualFixtureHome',get('manualFixtureHome').value||currentHome);
 renderOptions('manualFixtureAway',get('manualFixtureAway').value||currentAway);
 const arr=core.getManualFixtures().slice().sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 if(!arr.length){get('manualFixtureList').innerHTML='<div class="v3-cta">No personal fixtures saved yet. Add an upcoming match and its UK local kick-off to create an independent analysis workspace. A manually entered fixture is not a verified official schedule.</div>';return}
 get('manualFixtureList').innerHTML=arr.map((f,i)=>'<div class="v3-match-row"><div><b>'+esc(f.home)+' v '+esc(f.away)+'</b><div class="v3-kickoff">'+esc(localDate(f.date))+' · User-entered, unverified</div></div><button class="v3-smallbutton" data-remove-fixture="'+i+'">Remove</button></div>').join('');
 get('manualFixtureList').querySelectorAll('[data-remove-fixture]').forEach(btn=>btn.onclick=()=>{const f=arr[Number(btn.dataset.removeFixture)];if(!f)return;core.deleteManualFixture(f.home,f.away,f.date);setAlert('manualFixtureStatus','Fixture removed. Saved forecasts, if any, are retained for independent research.')});
}
function addFixture(){
 const home=get('manualFixtureHome').value,away=get('manualFixtureAway').value,kickoff=get('manualFixtureDate').value;
 if(!kickoff){setAlert('manualFixtureStatus','Choose the match date and kick-off time first.');return}
 const d=new Date(kickoff);
 const result=core.addManualFixture(home,away,d.toISOString?(!Number.isNaN(d.getTime())?d.toISOString():''):null);
 setAlert('manualFixtureStatus',result.ok?'Saved a user-entered fixture. It is now available in the Match Lab, Odds Comparison and Forecast Journal.':result.error);
 if(result.ok){get('manualFixtureDate').value='';renderFixtureDesk()}
}

function scenarioModel(){
 const h=get('scenarioHome')?.value||currentHome,a=get('scenarioAway')?.value||currentAway;
 const real=!teamMatch(h,a)&&core.modelFor(h,a);
 const x=real?real.probabilities.lh:Number(get('scenarioBaseH')?.value||illustrativeHome),y=real?real.probabilities.la:Number(get('scenarioBaseA')?.value||illustrativeAway);
 return{h,a,real,meanH:x,meanA:y};
}
function renderScenario(){
 if(!get('scenarioHome'))return;
 const s=scenarioModel();
 const demo=!s.real;
 get('scenarioDemoFields').style.display=demo?'grid':'none';
 if(teamMatch(s.h,s.a)){get('scenarioAnalysis').innerHTML='<div class="v3-cta">Choose two different clubs.</div>';return}
 const x=s.meanH*scenarioHome,y=s.meanA*scenarioAway;
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<=0||y<=0||x>7||y>7){get('scenarioAnalysis').innerHTML='<div class="v3-cta">Expected goals must be between 0.1 and 5.0.</div>';return}
 const p=core.evaluateMeans(x,y),base=core.evaluateMeans(s.meanH,s.meanA);
 get('scenarioFactorH').textContent=Math.round(scenarioHome*100)+'%';
 get('scenarioFactorA').textContent=Math.round(scenarioAway*100)+'%';
 const fmtDelta=(n)=>(n>=0?'+':'')+(n*100).toFixed(1)+' pp';
 let out='<div class="v3-feature-note"><strong>'+(demo?'ILLUSTRATIVE SCENARIO — not based on these clubs':'DATA-INFORMED SCENARIO — not an independent forecast')+'</strong><p>'+(demo?'No qualifying club data is loaded, so the starting expected goals are manually editable examples.':'Starting goal averages come from the historical Poisson model. Modifiers are assumptions you control, not verified injuries or lineup information.')+'</p></div>';
 out+='<div class="v3-figures"><div class="v3-figure"><small>Home win</small><b>'+pct(p.home)+'</b><em>Change '+fmtDelta(p.home-base.home)+'</em></div><div class="v3-figure"><small>Draw</small><b>'+pct(p.draw)+'</b><em>Change '+fmtDelta(p.draw-base.draw)+'</em></div><div class="v3-figure"><small>Away win</small><b>'+pct(p.away)+'</b><em>Change '+fmtDelta(p.away-base.away)+'</em></div></div>';
 out+='<div class="v3-dist"><i style="width:'+pct(p.home)+'"></i><i style="width:'+pct(p.draw)+'"></i><i style="width:'+pct(p.away)+'"></i></div>';
 out+='<div class="statrow"><span>Assumed home goals</span><b>'+fixed(x)+'</b></div><div class="statrow"><span>Assumed away goals</span><b>'+fixed(y)+'</b></div><div class="statrow"><span>Over 2.5 goals</span><b>'+pct(p.over)+' ('+fmtDelta(p.over-base.over)+')</b></div><div class="statrow"><span>Both teams to score</span><b>'+pct(p.btts)+' ('+fmtDelta(p.btts-base.btts)+')</b></div>';
 out+='<h3 style="margin-top:20px">Most probable exact scores</h3>';
 out+=p.scores.slice(0,5).map(r=>'<div class="v3-forecastline"><span>'+r.h+'–'+r.a+'</span><div class="track"><i style="width:'+pct(Math.min(1,r.p*4))+'"></i></div><b>'+pct(r.p)+'</b></div>').join('');
 const fav=([p.home,p.draw,p.away]).indexOf(Math.max(p.home,p.draw,p.away));
 let same=0,changes=[];
 for(const hmod of [.85,1,1.15])for(const amod of [.85,1,1.15]){const q=core.evaluateMeans(x*hmod,y*amod),v=[q.home,q.draw,q.away];if(v.indexOf(Math.max(...v))===fav)same++;changes.push(q)}
 const minH=Math.min(...changes.map(q=>q.home)),maxH=Math.max(...changes.map(q=>q.home));
 const minD=Math.min(...changes.map(q=>q.draw)),maxD=Math.max(...changes.map(q=>q.draw));
 const minA=Math.min(...changes.map(q=>q.away)),maxA=Math.max(...changes.map(q=>q.away));
 out+='<div class="v3-alert"><b>Assumption sensitivity, not a confidence interval:</b> Across nine alternative inputs (each side’s expected goals adjusted −15%, unchanged or +15%), the most likely outcome stays the same in '+same+'/9 cases. Home probabilities range '+pct(minH)+'–'+pct(maxH)+'; draw '+pct(minD)+'–'+pct(maxD)+'; away '+pct(minA)+'–'+pct(maxA)+'. These ranges do not quantify real-world uncertainty or prediction accuracy.</div>';
 get('scenarioAnalysis').innerHTML=out;
}
function resetScenario(){
 scenarioHome=1;scenarioAway=1;
 get('scenarioShiftH').value='100';get('scenarioShiftA').value='100';
 renderScenario();
}

function renderQuality(){
 const target=get('qualityInspector');if(!target)return;
 const rows=core.getData(),dated=rows.filter(r=>r.date&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&!Number.isNaN(Date.parse(r.date))),teams=unique(rows.flatMap(r=>[norm(r.home),norm(r.away)])),seen=new Set();let duplicates=0;
 for(const r of dated){const key=r.date+'|'+norm(r.home)+'|'+norm(r.away);if(seen.has(key))duplicates++;else seen.add(key)}
 const latest=dated.length?dated.map(r=>r.date).sort().at(-1):null;
 const earliest=dated.length?dated.map(r=>r.date).sort()[0]:null;
 const future=dated.filter(r=>r.date>new Date().toISOString().slice(0,10)).length;
 const n=rows.length,undated=n-dated.length;
 let msg='';
 if(!n)msg='<div class="v3-cta">No historical data loaded. You can still add fixtures, explore the scenario sandbox and enter quoted odds. Import a real CSV when you have one.</div>';
 else {
  const stats=[['Results',n],['Clubs',teams.length],['With dates',dated.length],['Potential duplicates',duplicates],['Undated',undated],['Future-dated',future]];
  msg='<div class="v3-figures">'+stats.map(([name,val])=>'<div class="v3-figure"><small>'+name+'</small><b>'+val+'</b></div>').join('')+'</div>';
  msg+='<p class="hint">Date range: '+(earliest||'unknown')+' to '+(latest||'unknown')+'. Team and match coverage may be incomplete; imported data is not independently verified.</p>';
  const flags=[];
  if(undated)flags.push(undated+' undated rows cannot be included in trustworthy chronological backtesting.');
  if(duplicates)flags.push(duplicates+' repeated fixture/date records may distort team statistics. Consider deduplicating your source CSV.');
  if(future)flags.push(future+' match results have future dates. Check the imported dates.');
  if(n<80)flags.push('Fewer than 80 total results make model calibration and comparisons unreliable.');
  if(!flags.length)flags.push('No basic structural problems found. This does not verify results against official records or confirm the model is accurate.');
  msg+='<div class="v3-alert">'+flags.map(x=>'• '+esc(x)).join('<br>')+'</div>';
 }
 target.innerHTML=msg;
}
function exportResults(){
 const rows=core.getData();if(!rows.length){setAlert('backupStatus','There are no imported results to export.');return}
 const csv=[['Date','HomeTeam','AwayTeam','FTHG','FTAG'].join(',')];
 function q(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
 for(const r of rows)csv.push([r.date||'',r.home,r.away,r.hg,r.ag].map(q).join(','));
 download('premier-league-history-export.csv',csv.join('\r\n'),'text/csv;charset=utf-8');
}
const keys=['pllab_history_v1','pllab_manual_fixtures_v3','pllab_manual_odds_v3','pllab_research_journal_v2'];
function makeBackup(){
 const records={};
 for(const key of keys){try{const val=JSON.parse(localStorage.getItem(key)||'[]');records[key]=Array.isArray(val)?val:[]}catch(e){records[key]=[]}}
 download('probability-lab-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({schema:'probability-lab-offline-backup',version:3,createdAt:new Date().toISOString(),records},null,2),'application/json');
 setAlert('backupStatus','A JSON backup download was generated. Store it somewhere safe; browser storage is device-specific.');
}
function restoreBackup(file){
 if(!file)return;
 if(file.size>3*1024*1024){setAlert('backupStatus','Backup is too large (maximum 3 MB).');return}
 const reader=new FileReader();
 reader.onload=()=>{
  let parsed;
  try{parsed=JSON.parse(String(reader.result))}catch(e){setAlert('backupStatus','Invalid JSON file. No existing data has been changed.');return}
  if(parsed?.schema!=='probability-lab-offline-backup'||parsed.version!==3||!parsed.records){
   setAlert('backupStatus','Not a Probability Lab version 3 backup. No changes made.');return}
  const r=parsed.records;
  if(!keys.every(k=>Array.isArray(r[k]))){setAlert('backupStatus','Backup sections are missing or invalid. No changes made.');return}
  const [history,fixtures,odds,journal]=keys.map(k=>r[k]);
  if(history.length>7600||fixtures.length>150||odds.length>150||journal.length>100){setAlert('backupStatus','Backup exceeds the app storage limits. No changes made.');return}
  function validHistory(x){return x&&typeof x.home==='string'&&typeof x.away==='string'&&Number.isInteger(x.hg)&&Number.isInteger(x.ag)&&x.hg>=0&&x.ag>=0&&x.hg<=20&&x.ag<=20&&(!x.date||typeof x.date==='string')}
  function validFixture(x){return x&&typeof x.home==='string'&&typeof x.away==='string'&&typeof x.date==='string'&&Number.isFinite(Date.parse(x.date))}
  function validOdds(x){return x&&typeof x.fixture==='string'&&typeof x.provider==='string'&&[x.h,x.d,x.a].every(n=>Number.isFinite(n)&&n>1&&n<=500)}
  function validJournal(x){return x&&typeof x.home==='string'&&typeof x.away==='string'&&typeof x.kickoff==='string'&&[x.homeProb,x.drawProb,x.awayProb].every(n=>Number.isFinite(n)&&n>=0&&n<=1)}
  if(!history.every(validHistory)||!fixtures.every(validFixture)||!odds.every(validOdds)||!journal.every(validJournal)){
   setAlert('backupStatus','Invalid or unsafe records found. No changes made.');return}
  if(!window.confirm('Replace this browser’s Probability Lab history, fixtures, odds and journal with the selected backup?')){setAlert('backupStatus','Restore cancelled.');return}
  try{for(const k of keys)localStorage.setItem(k,JSON.stringify(r[k]));window.location.reload()}catch(e){setAlert('backupStatus','Browser storage unavailable. Restore not completed.')}
 };
 reader.readAsText(file);
}
function renderGuide(){
 const rows=core.getData().length,fixtures=core.getManualFixtures().length,odds=core.getManualOdds().length;
 get('gettingStarted').innerHTML='<div class="v3-number-steps"><div class="v3-step"><small>01 · SET UP MATCHES</small><b>Build a fixture workspace</b><p>Enter upcoming clubs and a verified kick-off. The app works even without a live fixture API.</p><button class="btn secondary" data-v3-go="desk">Add a fixture</button></div><div class="v3-step"><small>02 · ADD EVIDENCE</small><b>Import real match results</b><p>Use a CSV with Date, HomeTeam, AwayTeam, FTHG and FTAG. Your history stays on this device.</p><button class="btn secondary" data-v3-go="data">Import results</button></div><div class="v3-step"><small>03 · ANALYSE</small><b>Explore models and prices</b><p>Compare club form, run goal scenarios and enter decimal odds to inspect market-implied probabilities.</p><button class="btn secondary" data-v3-go="intel">Research a match</button></div></div><p class="v2-meta">Current local data: '+rows+' results, '+fixtures+' personal fixtures, '+odds+' saved manual odds quotes. API keys are not needed for these activities.</p>';
 get('gettingStarted').querySelectorAll('[data-v3-go]').forEach(b=>b.onclick=()=>document.querySelector('[data-tab="'+b.dataset.v3Go+'"]')?.click());
}

function wilson95(success,n){
 if(!n)return null;
 const z=1.96,p=success/n,z2=z*z,den=1+z2/n;
 const center=(p+z2/(2*n))/den,margin=z*Math.sqrt((p*(1-p)+z2/(4*n))/n)/den;
 return[Math.max(0,center-margin),Math.min(1,center+margin)];
}
function renderSeasons(){
 const target=get('seasonTrendTable');if(!target)return;
 const rows=core.getData().filter(r=>r.date&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&Number.isFinite(Date.parse(r.date)));
 if(!rows.length){target.innerHTML='<div class="v3-cta">Import dated match results to see actual seasonal scoring, home advantage and draw frequencies.</div>';return}
 const buckets={};
 for(const r of rows){
  const year=Number(r.date.slice(0,4)),month=Number(r.date.slice(5,7));
  const declared=typeof r.season==='string'&&/^\d{4}[/\-]\d{2,4}$/.test(r.season)?Number(r.season.slice(0,4)):null;
  const season=declared===null?year-(month<7?1:0):declared;
  if(!buckets[season])buckets[season]={season,n:0,home:0,draw:0,away:0,goals:0,btts:0,over:0};
  const t=buckets[season];t.n++;t.goals+=r.hg+r.ag;
  if(r.hg>r.ag)t.home++;else if(r.hg===r.ag)t.draw++;else t.away++;
  if(r.hg>0&&r.ag>0)t.btts++;if(r.hg+r.ag>2)t.over++;
 }
 const data=Object.values(buckets).sort((a,b)=>b.season-a.season);
 const table='<div class="tablewrap"><table class="v3-table"><thead><tr><th>Season*</th><th>Games</th><th>Home</th><th>Draw</th><th>Away</th><th>Goals / game</th><th>BTTS</th><th>Over 2.5</th></tr></thead><tbody>'+data.map(x=>'<tr><td>'+x.season+'–'+String(x.season+1).slice(-2)+'</td><td>'+x.n+'</td><td>'+pct(x.home/x.n)+'</td><td>'+pct(x.draw/x.n)+'</td><td>'+pct(x.away/x.n)+'</td><td>'+(x.goals/x.n).toFixed(2)+'</td><td>'+pct(x.btts/x.n)+'</td><td>'+pct(x.over/x.n)+'</td></tr>').join('')+'</tbody></table></div>';
 const overall=rows.length,d=rows.filter(x=>x.hg===x.ag).length,home=rows.filter(x=>x.hg>x.ag).length,away=overall-home-d;
 const ci=wilson95(d,overall);
 const homeCi=wilson95(home,overall);
 target.innerHTML=table+'<p class="hint">*Uses source season labels where supplied (important for the delayed 2019/20 finish); otherwise infers seasons using July boundaries. Partially imported seasons are not complete league statistics. A full league season usually has 380 matches.</p>'+
  '<div class="v3-sideby"><div class="v3-team"><h3>Observed draw frequency</h3><div class="v3-figure"><small>All imported dated results</small><b>'+pct(d/overall)+'</b><em>Approx. 95% Wilson interval: '+pct(ci[0])+'–'+pct(ci[1])+'</em></div></div><div class="v3-team"><h3>Observed home-win frequency</h3><div class="v3-figure"><small>All imported dated results</small><b>'+pct(home/overall)+'</b><em>Approx. 95% Wilson interval: '+pct(homeCi[0])+'–'+pct(homeCi[1])+'</em></div></div></div>'+
  '<p class="fine">Wilson intervals describe sampling uncertainty if matches were independent and representative. They are not forward-looking predictive intervals, and systematic changes in the league are not captured.</p>';
}

function refresh(){
 renderQuality();
 renderSeasons();
 renderGuide();
 renderFixtureDesk();
 renderIntel();
 renderScenario();
}
function onTab(id,callback){const b=document.querySelector('[data-tab="'+id+'"]');if(b)b.addEventListener('click',callback)}
function start(){
 renderSelectors();refresh();
 get('manualFixtureAdd').addEventListener('click',addFixture);
 for(const id of ['matchIntelHome','matchIntelAway','matchIntelRange'])get(id).addEventListener('change',renderIntel);
 for(const id of ['scenarioHome','scenarioAway','scenarioBaseH','scenarioBaseA'])get(id).addEventListener('input',renderScenario);
 get('scenarioShiftH').addEventListener('input',e=>{scenarioHome=Number(e.target.value)/100;renderScenario()});
 get('scenarioShiftA').addEventListener('input',e=>{scenarioAway=Number(e.target.value)/100;renderScenario()});
 get('scenarioReset').addEventListener('click',resetScenario);
 get('backupDownload').addEventListener('click',makeBackup);
 get('resultsExport').addEventListener('click',exportResults);
 get('backupUpload').addEventListener('change',e=>restoreBackup(e.target.files?.[0]));
 onTab('desk',renderFixtureDesk);onTab('intel',renderIntel);onTab('scenario',renderScenario);onTab('data',renderQuality);
 get('addOdds')?.addEventListener('click',()=>window.PLLabV2?.renderOddsLens());
 get('clearManualOdds')?.addEventListener('click',()=>window.PLLabV2?.renderOddsLens());
 core.onUpdate(refresh);
}
start();
window.PLLabV3={refresh};
})();