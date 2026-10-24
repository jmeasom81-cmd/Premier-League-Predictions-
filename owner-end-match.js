// Owner-only End Match control, mounted inside the existing Live Score Control.
// Uses the official result path; never runs without explicit final-whistle confirmation.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const emSb=createClient(
 'https://jzrbaeyvwagrwukntjbk.supabase.co',
 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);
const emEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emEligible=()=>window.getPLPManualLiveContext?.()?.manual?.eligible||[];
const emIsOwner=()=>window.getPLPManualLiveContext?.()?.manual?.is_owner===true;
let emPending=null,emBusy=false;
const emMinMs=100*60*1000;
const emMatch=id=>emEligible().find(f=>String(f.fixture_id)===String(id));
const emClock=v=>new Intl.DateTimeFormat('en-GB',{
 timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'
}).format(new Date(v));

function emStyle(){
 if(document.getElementById('em-style'))return;
 const el=document.createElement('style');
 el.id='em-style';
 el.textContent=[
  '.osButton.emFinish{background:#117357;color:#fff}.osButton.emFinish:disabled{background:#cbd9d1;color:#52685d}',
  '.emHint{font-size:11px;color:#6a6275;line-height:1.5;margin:9px 0 4px}',
  '.emConfirm{border:1px solid #b7d7c5;background:#f1fff7;border-radius:12px;padding:12px;margin-top:12px;color:#244535;font-size:12px;line-height:1.55}',
  '.emConfirm strong{font-size:14px}.emConfirm p{margin:9px 0}',
  '.emCheck{display:flex;align-items:flex-start;gap:9px;font-size:12px;font-weight:800;margin:12px 0;cursor:pointer}',
  '.emCheck input{height:18px;width:18px;min-width:18px;margin:2px 0;accent-color:#117357}',
  '.emControls{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
  '.emControls button{border:0;border-radius:10px;padding:11px 12px;font-size:12px;font-weight:900;background:#117357;color:#fff}',
  '.emControls button.emCancel{background:#ebe9f0;color:#4b3c5e}',
  '.emControls button:disabled{opacity:.5}'
 ].join('');
 document.head.appendChild(el);
}

function emError(message){
 const host=document.getElementById('os-error');
 if(host){
  host.innerHTML='<div class="osError">'+emEsc(message)+'</div>';
  host.scrollIntoView({block:'nearest'});
 }else alert(message);
}
function emResetConfirm(){
 emPending=null;
 const panel=document.getElementById('em-final-check');
 if(panel){panel.hidden=true;panel.innerHTML=''}
}
function emRefresh(){
 const modal=document.getElementById('os-dialog');
 if(!modal||!emIsOwner())return;
 const id=document.getElementById('os-fixture')?.value;
 const match=emMatch(id);
 const btn=modal.querySelector('[data-em-open]');
 const hint=modal.querySelector('#em-hint');
 if(!btn||!hint||!match)return;
 const unlock=new Date(match.kickoff_at).getTime()+emMinMs;
 const ready=Date.now()>=unlock;
 btn.disabled=!ready||emBusy;
 btn.title=ready?'Confirm actual full time and submit official score':'Available after 100 minutes from kick-off';
 hint.textContent=ready
  ?'Once the referee has blown for full time, you may end the match now instead of waiting for the automatic result.'
  :'End match available after '+emClock(unlock)+' (and only after the real final whistle).';
}
function emMount(){
 const modal=document.getElementById('os-dialog');
 if(!modal||!emIsOwner()||modal.querySelector('[data-em-open]'))return;
 const actions=modal.querySelector('.osActions');
 if(!actions)return;
 emStyle();
 const btn=document.createElement('button');
 btn.type='button';
 btn.className='osButton emFinish';
 btn.dataset.emOpen='';
 btn.textContent='🏁 End match';
 actions.appendChild(btn);
 const hint=document.createElement('p');
 hint.id='em-hint';hint.className='emHint';
 actions.insertAdjacentElement('afterend',hint);
 const confirm=document.createElement('div');
 confirm.id='em-final-check';confirm.hidden=true;
 hint.insertAdjacentElement('afterend',confirm);
 emRefresh();
}
function emOpenConfirm(){
 if(emBusy||!emIsOwner())return;
 const id=document.getElementById('os-fixture')?.value;
 const match=emMatch(id);
 if(!match){emError('This match is no longer available. Refresh Match Centre.');return}
 if(Date.now()<new Date(match.kickoff_at).getTime()+emMinMs){
  emError('Ending the game is only allowed at least 100 minutes after kick-off, once the actual final whistle has sounded.');
  return;
 }
 const home=document.getElementById('os-home')?.value?.trim()??'';
 const away=document.getElementById('os-away')?.value?.trim()??'';
 if(!/^\d{1,2}$/.test(home)||!/^\d{1,2}$/.test(away)||+home>20||+away>20){
  emError('Enter the final score for both teams (whole numbers 0–20).');
  return;
 }
 emPending={
  id,home:Number(home),away:Number(away),
  homeTeam:match.home_team,awayTeam:match.away_team
 };
 const panel=document.getElementById('em-final-check');
 if(!panel)return;
 panel.hidden=false;
 panel.innerHTML='<div class="emConfirm">'+
  '<strong>🏁 Confirm full time</strong>'+
  '<p>End <b>'+emEsc(emPending.homeTeam)+' '+emPending.home+'–'+emPending.away+
    ' '+emEsc(emPending.awayTeam)+'</b>?</p>'+
  '<p>This saves the <b>official result</b>, awards prediction points, updates the league standings and moves this fixture to Results.</p>'+
  '<p>Only confirm after the final whistle. Correcting an incorrectly closed game requires the results controls.</p>'+
  '<label class="emCheck"><input type="checkbox" id="em-whistle"><span>I confirm that the game has finished and the final score shown above is correct.</span></label>'+
  '<div class="emControls"><button type="button" data-em-commit>✓ Confirm &amp; end match</button>'+
  '<button type="button" class="emCancel" data-em-cancel>Cancel</button></div>'+
  '</div>';
 panel.scrollIntoView({block:'nearest',behavior:'smooth'});
}
async function emCommit(){
 if(emBusy||!emIsOwner()||!emPending)return;
 if(!document.getElementById('em-whistle')?.checked){
  emError('Tick the final-whistle confirmation before ending the game.');
  return;
 }
 const f={...emPending};
 // The user may have changed the fixture or scores since opening confirmation.
 if(document.getElementById('os-fixture')?.value!==f.id ||
    document.getElementById('os-home')?.value?.trim()!==String(f.home) ||
    document.getElementById('os-away')?.value?.trim()!==String(f.away)){
  emResetConfirm();
  emError('The selected match or score changed. Review the score and press End match again.');
  return;
 }
 emBusy=true;
 const btns=[...document.querySelectorAll('#os-dialog button')];
 btns.forEach(b=>b.disabled=true);
 try{
  const {data,error}=await emSb.rpc('admin_end_live_match',{
   p_fixture_id:f.id,
   p_home_score:f.home,p_away_score:f.away,
   p_confirmed_full_time:true
  });
  if(error)throw error;
  if(!data?.ok)throw Error('The result was not confirmed. Refresh and try again.');
  emPending=null;
  document.getElementById('os-dialog')?.remove();
  if(typeof window.refreshPLPMatchCentreAfterScore==='function'){
   await window.refreshPLPMatchCentreAfterScore();
  }
  alert('🏁 Full time! '+f.homeTeam+' '+f.home+'–'+f.away+' '+f.awayTeam+
    '. The official result is saved and league points have updated.');
 }catch(error){
  emError(error?.message||'Could not end match. Refresh and check the result before trying again.');
 }finally{
  emBusy=false;
  btns.forEach(b=>b.disabled=false);
  emRefresh();
 }
}
document.addEventListener('click',e=>{
 const el=e.target.closest?.('[data-em-open],[data-em-commit],[data-em-cancel]');
 if(!el)return;
 e.preventDefault();e.stopPropagation();
 if(el.hasAttribute('data-em-open')){emOpenConfirm();return}
 if(el.hasAttribute('data-em-cancel')){emResetConfirm();return}
 if(el.hasAttribute('data-em-commit'))emCommit();
},true);
document.addEventListener('change',e=>{
 if(e.target?.id==='os-fixture'){
  emResetConfirm();
  setTimeout(emRefresh,0);
 }
});
document.addEventListener('input',e=>{
 if((e.target?.id==='os-home'||e.target?.id==='os-away')&&emPending){
  emResetConfirm();
 }
});
const emObserver=new MutationObserver(()=>{
 if(document.getElementById('os-dialog'))emMount();
 else emPending=null;
});
emObserver.observe(document.body,{childList:true});
setInterval(()=>{if(document.getElementById('os-dialog'))emRefresh()},20000);
emStyle();
emMount();
