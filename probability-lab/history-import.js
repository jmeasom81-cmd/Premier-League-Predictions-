/* Premier League Probability Lab: local historic season archive importer.
   Bundled CC0 match records sourced from OpenFootball/football.json. */
(function(){
'use strict';
const core=window.PLLab,button=document.getElementById('loadArchiveHistory'),range=document.getElementById('historyArchiveRange'),state=document.getElementById('historyArchiveStatus'),summary=document.getElementById('historyArchiveSummary');
if(!core||!button||!range||!state||!summary)return;
const packs=[
 {name:'2010-11_to_2014-15.json',years:['2010-11','2011-12','2012-13','2013-14','2014-15']},
 {name:'2015-16_to_2019-20.json',years:['2015-16','2016-17','2017-18','2018-19','2019-20']},
 {name:'2020-21_to_2024-25.json',years:['2020-21','2021-22','2022-23','2023-24','2024-25']}
];
function seasonCount(){
 const rows=core.getData(),seasons=new Set();
 for(const r of rows){
  let y;
  if(typeof r.season==='string'&&/^\d{4}[/-]\d{2,4}$/.test(r.season))y=Number(r.season.slice(0,4));
  else if(/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')){y=Number(r.date.slice(0,4));if(Number(r.date.slice(5,7))<7)y--}
  if(Number.isInteger(y))seasons.add(y);
 }
 summary.textContent=rows.length.toLocaleString('en-GB')+' completed match records loaded across '+seasons.size+' season years. Historical source: OpenFootball (CC0); latest season: our Predictions database.';
}
async function downloadPack(pack){
 const response=await fetch('/history-packs/'+pack.name,{cache:'force-cache'});
 if(!response.ok)throw Error('Season archive '+pack.years[0]+' could not be loaded (HTTP '+response.status+').');
 const json=await response.json();
 if(json.schema!=='pllab-cc0-epl-history-v1'||json.source!=='openfootball/football.json'||json.license!=='CC0-1.0'||!json.seasons)throw Error('Unexpected historical archive format.');
 const cleaned=[];
 for(const year of pack.years){
  const list=json.seasons[year];
  if(!Array.isArray(list)||list.length!==380)throw Error(year+' does not contain 380 completed fixtures.');
  const seen=new Set();
  for(const r of list){
   if(!Array.isArray(r)||r.length!==5||typeof r[0]!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r[0])||
      typeof r[1]!=='string'||!r[1].trim()||typeof r[2]!=='string'||!r[2].trim()||
      !Number.isInteger(r[3])||!Number.isInteger(r[4])||r[3]<0||r[4]<0||r[3]>30||r[4]>30)throw Error('One or more '+year+' scores are invalid.');
   const key=r[0]+'|'+r[1].toLowerCase()+'|'+r[2].toLowerCase();
   if(seen.has(key))throw Error('Duplicate match found in '+year+'.');
   seen.add(key);
   cleaned.push({date:r[0],home:r[1],away:r[2],hg:r[3],ag:r[4],season:year,source:'OpenFootball CC0 · '+year});
  }
 }
 return cleaned;
}
let busy=false;
async function importYears(){
 if(busy)return;
 busy=true;button.disabled=true;
 const chosen=Number(range.value);
 const selected=packs.slice(-Math.max(1,Math.min(3,chosen/5)));
 const count=selected.length*1900;
 state.textContent='Preparing '+count.toLocaleString('en-GB')+' completed Premier League matches from '+(selected.length*5)+' previous seasons…';
 try{
  const result=await Promise.all(selected.map(downloadPack));
  const rows=result.flat();
  if(rows.length!==count)throw Error('One or more historical seasons were incomplete.');
  const after=core.mergeArchiveResults(rows);
  state.textContent='Imported '+rows.length.toLocaleString('en-GB')+' verified-format archive records. '+after.added.toLocaleString('en-GB')+' were new to the current dataset; '+after.total.toLocaleString('en-GB')+' results now loaded. '+(after.saved?'Saved in this browser.':'Browser storage could not save all the data: export a backup before leaving.');
  state.className='good';
  seasonCount();
 }catch(err){
  state.textContent='Import unavailable: '+(err instanceof Error?err.message:'Could not load the archive')+'. Existing match data has not been replaced.';
  state.className='warn';
 }finally{busy=false;button.disabled=false}
}
button.addEventListener('click',importYears);
document.querySelectorAll('[data-open-archive]').forEach(b=>b.addEventListener('click',()=>{
 const tab=document.querySelector('[data-tab="data"]');
 if(tab)tab.click();
 document.getElementById('archiveHistoryPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
}));
core.onUpdate(seasonCount);
seasonCount();
window.PLLabArchive={importYears};
})();