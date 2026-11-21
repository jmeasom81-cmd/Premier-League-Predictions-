/* Match Stats Studio: private, browser-only CSV import and comparative analysis.
   Football-Data.co.uk CSV files are downloaded manually from the provider.
   No automatic polling/scraping, account credentials, betting transactions or servers. */
(function(){
'use strict';
const core=window.PLLab, $=id=>document.getElementById(id);
if(!core||!$('fdImportFiles'))return;
const KEY='pllab_match_stats_v5',MAX_ROWS=7600,MAX_FILE_BYTES=2200000;
const fields=['hthg','htag','hs','as','hst','ast','hc','ac','hf','af','hy','ay','hr','ar'];
const columns=['HTHG','HTAG','HS','AS','HST','AST','HC','AC','HF','AF','HY','AY','HR','AR'];
const labels={hthg:'Half-time goals',hs:'Shots',hst:'Shots on target',hc:'Corners',hf:'Fouls',hy:'Yellow cards',hr:'Red cards'};
const normal=core.norm,escape=core.esc;
let data=[],lastImport=null;
function status(message,isError){$('fdImportStatus').textContent=message;$('fdImportStatus').className=isError?'fd-message bad':'fd-message good'}
function key(r){return r.date+'|'+normal(r.home)+'|'+normal(r.away)}
function validStored(r){
 if(!r||!/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')||!r.home||!r.away||!normal(r.home)||!normal(r.away)||!Number.isInteger(r.hg)||!Number.isInteger(r.ag)||r.hg<0||r.ag<0||r.hg>30||r.ag>30)return false;
 return fields.every(k=>r[k]==null||(Number.isInteger(r[k])&&r[k]>=0&&r[k]<=150));
}
try{const old=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(old))data=old.slice(-MAX_ROWS).filter(validStored)}catch(_){}
function dateFrom(value){
 const raw=String(value||'').trim();
 let m,year,month,day;
 if((m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw))){year=+m[1];month=+m[2];day=+m[3]}
 else if((m=/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/.exec(raw))){
  day=+m[1];month=+m[2];year=+m[3];if(year<100)year+=year>=70?1900:2000;
 }else return null;
 const parsed=new Date(Date.UTC(year,month-1,day));
 if(parsed.getUTCFullYear()!==year||parsed.getUTCMonth()!==month-1||parsed.getUTCDate()!==day)return null;
 return year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
function parseCSV(text){
 const out=[],row=[];let token='',quoted=false;
 text=String(text||'').replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){
   if(quoted&&text[i+1]==='"'){token+='"';i++}else quoted=!quoted;
  }else if(c===','&&!quoted){row.push(token);token=''}
  else if((c==='\r'||c==='\n')&&!quoted){
   if(c==='\r'&&text[i+1]==='\n')i++;
   row.push(token);if(row.some(x=>x.trim()!==''))out.push(row.slice());row.length=0;token='';
  }else token+=c;
 }
 if(quoted)throw Error('CSV contains an unmatched quotation mark.');
 row.push(token);if(row.some(x=>x.trim()!==''))out.push(row);
 return out;
}
function guessSeason(date,file){
 let year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
 // Football-Data's COVID-delayed 2019/20 season finished in July 2020.
 if(year===2020&&month===7)return'2019/20';
 const match=/(?:^|[^\d])(\d{2})(\d{2})(?:[^\d]|$)/.exec(file||'');
 if(match){const start=2000+Number(match[1]),end=2000+Number(match[2]);
  if(end===start+1&&start>=1993&&start<=2030)return start+'/'+match[2]}
 const s=year-(month<7?1:0);return s+'/'+String((s+1)%100).padStart(2,'0');
}
function val(str,limit){
 if(str==null||String(str).trim()==='')return null;
 const n=Number(String(str).trim());
 return Number.isInteger(n)&&n>=0&&n<=limit?n:null;
}
function parseFile(source,fileName){
 const input=parseCSV(source);
 if(input.length<2)throw Error(fileName+': no valid CSV records.');
 const head=input[0].map(x=>x.trim().replace(/^\uFEFF/,'').toUpperCase()),index=name=>head.indexOf(name);
 const required=['DATE','HOMETEAM','AWAYTEAM','FTHG','FTAG'];
 if(required.some(n=>index(n)<0))throw Error(fileName+': missing required columns: '+required.filter(n=>index(n)<0).join(', ')+'.');
 if(columns.every(n=>index(n)<0))throw Error(fileName+': only full-time results found, without any extra match-stat columns.');
 const col=(row,name)=>index(name)>=0?row[index(name)]:null;
 const parsed=[];let skipped=0,nonEpl=0;
 for(const row of input.slice(1)){
  const division=String(col(row,'DIV')||'E0').trim().toUpperCase();
  if(!['E0','PL','EPL','PREMIER LEAGUE'].includes(division)){nonEpl++;continue}
  const date=dateFrom(col(row,'DATE')),home=String(col(row,'HOMETEAM')||'').trim(),away=String(col(row,'AWAYTEAM')||'').trim();
  const hg=val(col(row,'FTHG'),30),ag=val(col(row,'FTAG'),30);
  if(!date||!home||!away||normal(home)===normal(away)||hg==null||ag==null){skipped++;continue}
  const r={date,home,away,hg,ag,season:guessSeason(date,fileName),source:'Football-Data.co.uk (manual CSV)'};
  fields.forEach((name,i)=>{r[name]=val(col(row,columns[i]),150)});
  if(fields.every(name=>r[name]===null)){skipped++;continue}
  parsed.push(r);
 }
 if(!parsed.length)throw Error(fileName+': no completed Premier League matches with additional statistics.');
 return{rows:parsed,skipped,nonEpl};
}
function seasonURL(value){
 const [start,end]=value.split('-');
 if(!/^\d{4}$/.test(start)||!/^\d{4}$/.test(end)||Number(end)!==Number(start)+1)return null;
 if(+start<2010||+start>2025)return null;
 const code=start.slice(-2)+end.slice(-2);
 return 'https://www.football-data.co.uk/mmz4281/'+code+'/E0.csv';
}
function updateDownload(){
 const value=$('fdSourceSeason').value,url=seasonURL(value);
 const link=$('fdDownloadLink');
 if(!url){link.removeAttribute('href');link.textContent='Select a season';return}
 link.href=url;link.textContent='Download '+value.replace('-','/')+' Premier League CSV';
 // Highlight selection inside the page rather than invoking Android's
 // system <select> picker, which was closing the embedded web browser.
 document.querySelectorAll('[data-fd-season]').forEach(b=>{
  const selected=b.dataset.fdSeason===value;
  b.setAttribute('aria-pressed',String(selected));
  b.classList.toggle('active',selected);
 });
}
function buildSeasonButtons(){
 const recent=$('fdSeasonButtonsRecent'),older=$('fdSeasonButtonsOlder');
 if(!recent||!older)return;
 for(let year=2025;year>=2010;year--){
  const value=year+'-'+(year+1);
  const label=year+'/'+String(year+1).slice(-2);
  const b=document.createElement('button');
  b.type='button';
  b.className='fd-season-choice';
  b.dataset.fdSeason=value;
  b.textContent=label;
  b.setAttribute('aria-pressed','false');
  b.addEventListener('click',()=>{
   $('fdSourceSeason').value=value;
   updateDownload();
  });
  (year>=2020?recent:older).appendChild(b);
 }
 updateDownload();
}
function fmt(x,digits=1){return Number.isFinite(x)?x.toFixed(digits):'—'}
function countCoverage(rows,field){return rows.filter(x=>x[field]!=null).length}
function matchingRecords(){
 const prior=new Map(core.getData().filter(x=>x.date&&x.home&&x.away).map(r=>[key(r),r]));
 let linked=0,conflicts=0;
 const matched=data.filter(r=>{
  const ref=prior.get(key(r));
  if(!ref)return true; // Allow source-only scorelines in the stats explorer.
  if(ref.hg!==r.hg||ref.ag!==r.ag){conflicts++;return false}
  linked++;return true;
 });
 return {matched,linked,conflicts,sourceOnly:data.length-linked-conflicts,history:prior.size};
}
function renderOverview(){
 const joined=matchingRecords(),rows=joined.matched;
 $('fdRecordCount').textContent=data.length.toLocaleString('en-GB');
 $('fdLinkedCount').textContent=joined.linked.toLocaleString('en-GB');
 $('fdSourceOnly').textContent=joined.sourceOnly.toLocaleString('en-GB');
 $('fdConflictCount').textContent=joined.conflicts.toLocaleString('en-GB');
 $('fdStatsSourceDetails').textContent=data.length?
  'Imported '+data.length.toLocaleString('en-GB')+' match-stat records. '+joined.linked.toLocaleString('en-GB')+' scorelines matched our results history; '+joined.sourceOnly.toLocaleString('en-GB')+' do not yet have an identical fixture in that history. '+joined.conflicts+' disputed result(s) excluded from comparisons. All data is stored in this browser.':
  'No Football-Data match-stat files have been imported on this device. Results-only analysis remains available in the other tabs.';
 const coverage=['hthg','hs','hst','hc','hf','hy','hr'].map(k=>{
  const n=countCoverage(rows,k),p=rows.length?Math.round(n/rows.length*100):0;
  return '<div class="fd-cover"><div class="minirow"><span>'+escape(labels[k])+'</span><b>'+n.toLocaleString('en-GB')+' / '+rows.length.toLocaleString('en-GB')+' ('+p+'%)</b></div><div class="progress"><span style="width:'+p+'%"></span></div></div>'
 }).join('');
 $('fdCoverage').innerHTML=rows.length?coverage:'<p class="hint">The coverage report appears as soon as you import a CSV.</p>';
}
function renderSeasonTable(){
 const target=$('fdSeasonTable');if(!target)return;
 const rows=matchingRecords().matched;
 if(!rows.length){target.innerHTML='<p class="hint">Import match statistics to see season averages.</p>';return}
 const groups=new Map();
 for(const r of rows){
  const season=typeof r.season==='string'&&r.season? r.season : guessSeason(r.date,'');
  if(!groups.has(season))groups.set(season,[]);
  groups.get(season).push(r);
 }
 function totalMean(arr,a,b){
  const eligible=arr.filter(r=>Number.isFinite(r[a])&&Number.isFinite(r[b]));
  return eligible.length?{n:eligible.length,x:eligible.reduce((sum,r)=>sum+r[a]+r[b],0)/eligible.length}:{n:0,x:null};
 }
 function percentHT(arr){
  const eligible=arr.filter(r=>Number.isInteger(r.hthg)&&Number.isInteger(r.htag));
  return eligible.length?{n:eligible.length,x:eligible.filter(r=>r.hthg===r.htag).length*100/eligible.length}:{n:0,x:null}
 }
 function displayStat(z,isPercent){
  if(!z.n)return '—';
  return '<b>'+z.x.toFixed(1)+(isPercent?'%':'')+'</b><span class="fine"> · '+z.n+' games</span>';
 }
 target.innerHTML='<table class="fd-season-table"><thead><tr><th>Season</th><th>All recorded</th><th>Shots / game</th><th>On target / game</th><th>Corners / game</th><th>Yellow cards / game</th><th>Half-time draws</th></tr></thead><tbody>'+
 [...groups.entries()].sort((a,b)=>b[0].localeCompare(a[0])).map(([season,g])=>'<tr><th scope="row">'+escape(season)+'</th><td>'+g.length+'</td><td>'+displayStat(totalMean(g,'hs','as'))+'</td><td>'+displayStat(totalMean(g,'hst','ast'))+'</td><td>'+displayStat(totalMean(g,'hc','ac'))+'</td><td>'+displayStat(totalMean(g,'hy','ay'))+'</td><td>'+displayStat(percentHT(g),true)+'</td></tr>').join('')+
 '</tbody></table>';
}

function teams(){
 const t=new Map();
 data.forEach(r=>[r.home,r.away].forEach(v=>{const k=normal(v);if(k&&!t.has(k))t.set(k,core.getTeams().find(x=>normal(x)===k)||v)}));
 return [...t.values()].sort((a,b)=>a.localeCompare(b));
}
function refreshSelectors(){
 const clubs=teams();
 for(const id of ['fdHomeClub','fdAwayClub']){
  const sel=$(id),previous=sel.value,defaultClub=id==='fdHomeClub'?'Arsenal':'Liverpool';
  sel.innerHTML=clubs.map(t=>'<option value="'+escape(t)+'">'+escape(t)+'</option>').join('');
  sel.value=clubs.find(t=>normal(t)===normal(previous))||clubs.find(t=>normal(t)===normal(defaultClub))||clubs[id==='fdHomeClub'?0:1]||clubs[0]||'';
 }
}
function matchRowsForClub(team,mode){
 if(!team)return [];
 const normTeam=normal(team),period=$('fdMatchWindow').value;
 const m=matchingRecords().matched.filter(r=>{
  const h=normal(r.home)===normTeam,a=normal(r.away)===normTeam;
  return mode==='home'?h:mode==='away'?a:h||a
 }).sort((a,b)=>b.date.localeCompare(a.date));
 if(period==='all')return m;
 return m.slice(0,Math.max(1,Number(period)||10));
}
function valsForTeam(rows,club){
 const n=normal(club),out=[];
 for(const r of rows){const isHome=normal(r.home)===n;
  if(!isHome&&normal(r.away)!==n)continue;
  out.push({date:r.date,score:(isHome?r.hg:r.ag)+'–'+(isHome?r.ag:r.hg),
   result:(isHome?r.hg:r.ag)>(isHome?r.ag:r.hg)?'W':r.hg===r.ag?'D':'L',
   goals:isHome?r.hg:r.ag,conceded:isHome?r.ag:r.hg,
   htGoals:isHome?r.hthg:r.htag,htConceded:isHome?r.htag:r.hthg,
   shot:isHome?r.hs:r.as,target:isHome?r.hst:r.ast,
   corner:isHome?r.hc:r.ac,foul:isHome?r.hf:r.af,
   yellow:isHome?r.hy:r.ay,red:isHome?r.hr:r.ar,
   opponent:isHome?r.away:r.home,venue:isHome?'H':'A'});
 }
 return out;
}
function average(rows,field){
 const a=rows.map(x=>x[field]).filter(Number.isFinite);
 return{n:a.length,avg:a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
}
function rate(rows,filter){
 const eligible=rows.filter(filter.test),success=eligible.filter(filter.ok).length;
 return {n:eligible.length,avg:eligible.length?success/eligible.length:null};
}
function metricRows(rows){
 const vals={};
 for(const name of ['shot','target','corner','foul','yellow','red','goals','conceded','htGoals'])vals[name]=average(rows,name);
 vals.accuracy={
  n:rows.filter(x=>x.shot!=null&&x.target!=null&&x.shot>0).length,
  avg:null};
 const withShots=rows.filter(x=>x.shot!=null&&x.target!=null&&x.shot>0);
 if(withShots.length)vals.accuracy.avg=withShots.reduce((sum,x)=>sum+(x.target/x.shot),0)/withShots.length;
 vals.firstLead=rate(rows,{test:x=>x.htGoals!=null&&x.htConceded!=null,ok:x=>x.htGoals>x.htConceded});
 vals.leadHeld=rate(rows,{test:x=>x.htGoals!=null&&x.htConceded!=null&&x.htGoals>x.htConceded,ok:x=>x.goals>x.conceded});
 vals.recovery=rate(rows,{test:x=>x.htGoals!=null&&x.htConceded!=null&&x.htGoals<x.htConceded,ok:x=>x.goals>=x.conceded});
 return vals;
}
function tableRow(name,h,a,isRate){
 const show=v=>v?.avg==null?'—':isRate?fmt(v.avg*100,0)+'%':fmt(v.avg,2);
 const ns=v=>v?.n?' <span class="fine">('+v.n+')</span>':'';
 return '<tr><th scope="row">'+escape(name)+'</th><td>'+show(h)+ns(h)+'</td><td>'+show(a)+ns(a)+'</td></tr>';
}
function renderCompare(){
 const h=$('fdHomeClub').value,a=$('fdAwayClub').value,modeH=$('fdHomeVenue').value,modeA=$('fdAwayVenue').value;
 if(!data.length||!h||!a){$('fdComparison').innerHTML='<div class="empty">Import a Football-Data CSV to compare actual shots, corners, fouls, cards and first-half performances.</div>';$('fdRecentGames').innerHTML='';return}
 const homeRows=matchRowsForClub(h,modeH),awayRows=matchRowsForClub(a,modeA);
 const hstats=metricRows(valsForTeam(homeRows,h)),astats=metricRows(valsForTeam(awayRows,a));
 const columns=[
 ['Shots / match','shot'],['Shots on target / match','target'],['Shot accuracy · per-match mean','accuracy',true],
 ['Corners / match','corner'],['Fouls / match','foul'],['Yellow cards / match','yellow'],['Red cards / match','red'],
 ['Full-time goals / match','goals'],['Goals conceded / match','conceded'],['First-half goals / match','htGoals'],
 ['Leading at half-time','firstLead',true],['Half-time leads converted into wins','leadHeld',true],
 ['Avoided defeat after trailing at half-time','recovery',true]];
 $('fdCompareTitle').textContent=h+' ('+homeRows.length+' matches) vs '+a+' ('+awayRows.length+' matches)';
 $('fdComparison').innerHTML='<div class="tablewrap"><table><thead><tr><th>Statistic</th><th>'+escape(h)+'</th><th>'+escape(a)+'</th></tr></thead><tbody>'+
 columns.map(x=>tableRow(x[0],hstats[x[1]],astats[x[1]],x[2])).join('')+'</tbody></table></div>'+
 '<p class="fine">Samples in brackets show matches actually containing each statistic. Shot accuracy averages each match’s on-target share; it is not a weighted season percentage. Inferred half-time patterns are descriptive, not proven prediction edges.</p>';
 const recent=homeRows.slice(0,7);
 $('fdRecentGames').innerHTML=recent.length?'<div class="tablewrap"><table><thead><tr><th>Date</th><th>Opponent</th><th>Venue</th><th>FT</th><th>HT</th><th>Shots (team)</th><th>On target</th><th>Corners</th></tr></thead><tbody>'+
 recent.map(r=>{const v=valsForTeam([r],h)[0];return '<tr><td>'+escape(r.date)+'</td><td>'+escape(v.opponent)+'</td><td>'+v.venue+'</td><td>'+escape(v.score)+'</td><td>'+((v.htGoals==null||v.htConceded==null)?'—':v.htGoals+'–'+v.htConceded)+'</td><td>'+fmt(v.shot,0)+'</td><td>'+fmt(v.target,0)+'</td><td>'+fmt(v.corner,0)+'</td></tr>'}).join('')+'</tbody></table></div>':'<p class="hint">No imported matches for that selection.</p>';
}
function renderIntel(){
 const target=$('fdIntelExtras');if(!target)return;
 if(!data.length){target.innerHTML='<div class="panel"><h3>Extra match statistics</h3><p class="hint">Shots, shots on target, half-time performance, corners and cards will appear after importing Football-Data CSV files in Match Statistics.</p><button class="btn secondary" id="fdOpenStats">Open Match Statistics</button></div>'}
 else{
 const h=$('matchIntelHome')?.value||$('fdHomeClub').value,a=$('matchIntelAway')?.value||$('fdAwayClub').value;
 if(!h||!a){target.innerHTML='';return}
 const home=valsForTeam(matchRowsForClub(h,'home').slice(0,10),h),away=valsForTeam(matchRowsForClub(a,'away').slice(0,10),a);
 const hs=metricRows(home),as=metricRows(away);
 target.innerHTML='<div class="panel"><h3>Extra historical evidence · shots and chances</h3><p class="hint">Venue-specific imported figures. These are observations, not additional inputs to the live prediction model yet.</p>'+
 '<div class="tablewrap"><table><thead><tr><th>Measure</th><th>'+escape(h)+' home</th><th>'+escape(a)+' away</th></tr></thead><tbody>'+
 [['Shots / match','shot'],['Shots on target / match','target'],['Corners / match','corner'],['First-half goals / match','htGoals']].map(x=>tableRow(x[0],hs[x[1]],as[x[1]],false)).join('')+
 '</tbody></table></div><button class="btn secondary" id="fdOpenStats">See full statistics</button></div>';
 }
 $('fdOpenStats')?.addEventListener('click',()=>document.querySelector('[data-tab="advanced"]')?.click());
}
function render(){
 renderOverview();renderSeasonTable();refreshSelectors();renderCompare();renderIntel();
}
function chooseFiles(){
 const input=$('fdImportFiles');if(!input.files?.length){status('Choose one or more Premier League CSV files before importing.',true);return}
 const files=Array.from(input.files);
 if(files.length>20||files.some(f=>f.size>MAX_FILE_BYTES)){status('Choose at most 20 season CSV files, each smaller than 2.2 MB.',true);return}
 const button=$('fdImportButton');button.disabled=true;status('Reading '+files.length+' file(s) locally…');
 (async()=>{
 try{
  const lists=await Promise.all(files.map(async f=>parseFile(await f.text(),f.name)));
  const incoming=lists.flatMap(x=>x.rows),dedup=new Map(data.map(r=>[key(r),r]));
  for(const row of incoming)dedup.set(key(row),row);
  const merged=[...dedup.values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(merged.length>MAX_ROWS)throw Error('More than '+MAX_ROWS+' rows. Please import fewer seasons.');
  // Storage write must succeed before we replace the in-memory dataset.
  localStorage.setItem(KEY,JSON.stringify(merged));
  const added=merged.length-data.length;
  data=merged;lastImport=new Date().toISOString();
  const invalid=lists.reduce((n,x)=>n+x.skipped,0),excluded=lists.reduce((n,x)=>n+x.nonEpl,0);
  status('Imported '+incoming.length.toLocaleString('en-GB')+' match-stat rows from '+files.length+' CSV file(s). '+added+' added (duplicates updated); '+data.length.toLocaleString('en-GB')+' stored. '+invalid+' incomplete rows skipped; '+excluded+' non-Premier League rows excluded.');
  input.value='';render();
 }catch(e){status('Import failed: '+e.message+'. Your saved statistics have not been replaced.',true)}
 finally{button.disabled=false}
 })();
}
function clearRecords(){
 if(!data.length)return status('No extra match statistics to clear.');
 if(!window.confirm('Delete the imported shots, half-time and other match statistics from this browser? Your Premier League results and predictions will remain unchanged.'))return;
 try{localStorage.removeItem(KEY);data=[];render();status('Extra match statistics cleared. Your existing goals and results history is unaffected.')}
 catch(_){status('Storage unavailable. Could not clear imported records.',true)}
}
buildSeasonButtons();
$('fdImportButton').addEventListener('click',chooseFiles);
$('fdClearExtra').addEventListener('click',clearRecords);
['fdHomeClub','fdAwayClub','fdMatchWindow','fdHomeVenue','fdAwayVenue'].forEach(id=>$(id).addEventListener('change',renderCompare));
['matchIntelHome','matchIntelAway'].forEach(id=>$(id)?.addEventListener('change',renderIntel));
core.onUpdate(renderIntel);
render();
window.PLLabMatchStats={getData:()=>data.slice(),parseFile,coverage:matchingRecords,render};
})();