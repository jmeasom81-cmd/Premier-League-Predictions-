/* Premier League Probability Lab — spectator/viewer link.
   This is a client-side read-only presentation mode. The shared football feed
   already exposes only GET/read-only data and never accepts user edits.
   This UI mode is not an authentication or private-account permissions system. */
(function(){
'use strict';
var VIEW_LINK='https://premier-league-probability-lab.vercel.app/?viewer=1';
var button=document.getElementById('shareViewerLink');
var feedback=document.getElementById('shareViewerStatus');
if(button&&feedback){
 button.addEventListener('click',function(){
  function fallback(){
   feedback.textContent='Copy this viewer link: '+VIEW_LINK;
   var input=document.createElement('input');
   input.type='text';input.readOnly=true;input.value=VIEW_LINK;
   input.setAttribute('aria-label','Read-only visitor link');
   input.style.marginTop='10px';input.style.width='100%';
   if(!feedback.querySelector('input'))feedback.appendChild(input);
   try{input.focus();input.select()}catch(e){}
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
   navigator.clipboard.writeText(VIEW_LINK).then(function(){
     feedback.textContent='Copied. Share this link with Deesh. It opens in read-only mode.';
   }).catch(fallback);
  }else fallback();
 });
}
if(!window.PLLabViewerMode)return;
document.body.classList.add('pl-viewer-mode');
document.title='Premier League Probability Lab · Viewer';
var blocked=[
 'manualFixtureAdd','manualFixtureDate','manualFixtureHome','manualFixtureAway',
 'csvInput','syncHistory','clearData','downloadTemplate',
 'manualName','oddsHome','oddsDraw','oddsAway','addOdds','clearManualOdds','refreshOdds',
 'saveJournal','refreshJournal',
 'backupUpload',
 'fdImportFiles','fdImportButton','fdClearExtra'
];
blocked.forEach(function(id){
 var el=document.getElementById(id);
 if(el){el.disabled=true;el.setAttribute('aria-disabled','true')}
});
// These screens include edit/add/delete controls; hide them entirely.
['desk','odds','journal'].forEach(function(name){
 var tab=document.querySelector('[data-tab="'+name+'"]');
 var section=document.getElementById(name);
 if(tab)tab.style.display='none';
 if(section)section.style.display='none';
});
// Hide all navigational shortcuts to edit-only areas.
document.querySelectorAll('[data-goto]').forEach(function(el){
 if(['desk','odds','journal'].indexOf(el.getAttribute('data-goto'))>=0)el.style.display='none';
});
// Keep other views and the historical archive importer available for
// in-memory analysis; archive imports in viewer mode never save to storage.
var importControl=document.getElementById('loadArchiveHistory');
if(importControl)importControl.textContent='Explore selected seasons (temporary)';
var desc=document.getElementById('historyArchiveStatus');
if(desc)desc.textContent='Viewer mode: historical seasons can be loaded for this visit, but are not saved or shared. No changes to the Predictions competition.';
var backup=document.getElementById('backupUpload');
if(backup)backup.closest('.field')?.setAttribute('hidden','');
var extraInput=document.getElementById('fdImportFiles');
if(extraInput)extraInput.closest('.filebox')?.setAttribute('hidden','');
var csvInput=document.getElementById('csvInput');
if(csvInput)csvInput.closest('.filebox')?.setAttribute('hidden','');
var note=document.getElementById('importFeedback');
if(note)note.textContent='Viewer mode: you may refresh scores from the read-only football feed, but you cannot edit or delete records. This mode cannot alter the Predictions competition.';
// Keep filters, model input sliders, scorelines, season tables and free PDF/CSV
// exports accessible. No user account or private competition data is shared.
})();
