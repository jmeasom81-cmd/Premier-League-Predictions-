// Owner-only live score editing panel for Match Centre.
// The database enforces ownership and allows edits only during a match.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const ownerScoreSb=createClient(
 'https://jzrbaeyvwagrwukntjbk.supabase.co',
 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);
let ownerScoreBusy=false;
const osEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const osGet=()=>typeof window.getPLPManualLiveContext==='function'
 ?window.getPLPManualLiveContext():{manual:null,rows:[]};
const osFixtures=()=>Array.isArray(osGet().manual?.eligible)?osGet().manual.eligible:[];
const osMatch=id=>osFixtures().find(x=>String(x.fixture_id)===String(id));
const osClock=iso=>{
 try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}
 catch{return ''}
};

function osStyles(){
 if(document.getElementById('os-live-style'))return;
 const el=document.createElement('style');el.id='os-live-style';el.textContent=[
 '.osBackdrop{position:fixed;z-index:17500;inset:0;background:rgba(15,10,39,.76);display:flex;align-items:flex-end;justify-content:center}',
 '.osPanel{background:#fff;color:#2f2442;width:min(100%,570px);border-radius:19px 19px 0 0;padding:18px 16px 22px;max-height:93dvh;overflow-y:auto;box-shadow:0 0 40px rgba(13,4,45,.24)}',
 '.osPanelHead{display:flex;align-items:center;justify-content:space-between;gap:10px}',
 '.osPanelHead h2{font-size:20px;color:#281352;margin:0}',
 '.osClose{padding:9px 11px;background:#f1edf8;color:#4b269d;border-radius:10px;border:0;font-size:12px;font-weight:900}',
 '.osExplain{font-size:12px;line-height:1.5;color:#6f6879;margin:9px 0 14px}',
 '.osLabel{display:block;font-size:12px;font-weight:900;margin:12px 0 6px}',
 '.osSelect,.osInput{display:block;width:100%;border:1px solid #d7d0e4;background:#fff;border-radius:11px;padding:11px;color:#322645;font-size:14px}',
 '.osScores{display:grid;grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr);gap:12px;align-items:end}',
 '.osScores input{text-align:center;font-size:26px;font-weight:900;height:57px}',
 '.osHelp{font-size:11px;line-height:1.45;color:#685d78;margin:10px 0}',
 '.osActions{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0 4px}',
 '.osButton{padding:12px 14px;border:0;border-radius:11px;background:#4b269d;color:white;font-weight:900;font-size:12px;cursor:pointer}',
 '.osButton:disabled{opacity:.5}.osButton.revert{background:#fff0ef;color:#a02e37}',
 '.osWarn{background:#f2fff8;color:#166b50;padding:9px 10px;border-radius:10px;font-size:11px;line-height:1.45}',
 '.osError{color:#a12838;background:#fff0f0;border-radius:10px;font-size:12px;padding:10px;margin-top:8px}',
 '@media(min-width:600px){.osBackdrop{align-items:center;padding:18px}.osPanel{border-radius:19px;max-height:90dvh}}'
 ].join('');document.head.appendChild(el);
}
function osDefaultScore(fixtureId){
 const x=osMatch(fixtureId);
 const row=osGet().rows.find(r=>String(r.fixture_id)===String(fixtureId));
 return {
  home:x?.manual_active?x.home_score:row?.home_score,
  away:x?.manual_active?x.away_score:row?.away_score
 };
}
function osUpdateForm(){
 const fixtureId=document.getElementById('os-fixture')?.value;
 const match=osMatch(fixtureId);
 if(!match)return;
 const current=osDefaultScore(fixtureId);
 const home=document.getElementById('os-home'),away=document.getElementById('os-away');
 if(home)home.value=current.home??'0';
 if(away)away.value=current.away??'0';
 const note=document.getElementById('os-note');if(note)note.value='';
 const revert=document.querySelector('#os-dialog [data-os-revert]');
 if(revert)revert.hidden=!match.manual_active;
 const hint=document.getElementById('os-current');
 if(hint)hint.innerText=match.manual_active
  ?'Your manual score is currently shown to the league, instead of the automatic provider score.'
  :'The automatic provider is in control. Saving here will temporarily override it.';
 const error=document.getElementById('os-error');if(error)error.textContent='';
}
function osOpen(preferredId){
 const c=osGet(),fixtures=osFixtures();
 if(!c.manual?.is_owner||!fixtures.length)return;
 osStyles();document.getElementById('os-dialog')?.remove();
 const selected=fixtures.some(f=>String(f.fixture_id)===String(preferredId))
  ?String(preferredId):String(fixtures[0].fixture_id);
 const el=document.createElement('div');el.id='os-dialog';el.className='osBackdrop';
 el.innerHTML='<div class="osPanel" role="dialog" aria-modal="true" aria-label="Owner live score control">'+
  '<div class="osPanelHead"><h2>✏️ Live Score Control</h2>'+
  '<button type="button" class="osClose" data-os-close>✕ Close</button></div>'+
  '<p class="osExplain">Only you can update these scores. All players will see them in Match Centre, and provisional points will be recalculated.</p>'+
  '<label class="osLabel" for="os-fixture">Choose match</label>'+
  '<select class="osSelect" id="os-fixture">'+fixtures.map(f=>
   '<option value="'+osEsc(f.fixture_id)+'" '+(String(f.fixture_id)===selected?'selected':'')+'>'+
   osEsc(f.home_team)+' v '+osEsc(f.away_team)+' · '+osClock(f.kickoff_at)+'</option>'
  ).join('')+'</select>'+
  '<div class="osScores"><label class="osLabel" for="os-home">Home goals'+
  '<input class="osInput" id="os-home" type="number" inputmode="numeric" min="0" max="30"></label>'+
  '<strong style="text-align:center;padding-bottom:15px">–</strong>'+
  '<label class="osLabel" for="os-away">Away goals'+
  '<input class="osInput" id="os-away" type="number" inputmode="numeric" min="0" max="30"></label></div>'+
  '<label class="osLabel" for="os-note">Update note (optional)</label>'+
  '<input class="osInput" type="text" maxlength="180" id="os-note" placeholder="Goal, VAR correction, etc.">'+
  '<p class="osHelp" id="os-current"></p><div id="os-error" role="alert"></div>'+
  '<div class="osActions"><button type="button" class="osButton" data-os-save>✓ Save live score</button>'+
  '<button type="button" class="osButton revert" data-os-revert hidden>↩ Return to automatic</button></div>'+
  '<p class="osWarn">These updates are <b>provisional</b>. They never change official final results or anyone’s saved predictions. Manual scores stop applying once the result is confirmed or the live window ends.</p>'+
  '</div>';
 document.body.appendChild(el);
 osUpdateForm();
}
function osError(message){
 const area=document.getElementById('os-error');
 if(area)area.innerHTML='<div class="osError">'+osEsc(message)+'</div>';
}
async function osSubmit(revert=false){
 if(ownerScoreBusy)return;
 const current=osGet();
 if(!current.manual?.is_owner){osError('Only the league owner can make live score changes.');return}
 const fixtureId=document.getElementById('os-fixture')?.value;
 const fixture=osMatch(fixtureId);
 if(!fixture){osError('This fixture is no longer available for updates. Refresh Match Centre.');return}
 const rawHome=document.getElementById('os-home')?.value.trim();
 const rawAway=document.getElementById('os-away')?.value.trim();
 if(!revert && (!/^\d{1,2}$/.test(rawHome)||!/^\d{1,2}$/.test(rawAway)||+rawHome>30||+rawAway>30)){
  osError('Enter whole-number scores between 0 and 30 for both teams.');return;
 }
 if(revert && !confirm('Return this match to automatic score updates?'))return;
 ownerScoreBusy=true;
 const buttons=[...document.querySelectorAll('#os-dialog .osActions button')];
 buttons.forEach(b=>b.disabled=true);
 try{
  const {error}=revert
   ?await ownerScoreSb.rpc('admin_clear_live_score',{p_fixture_id:fixtureId})
   :await ownerScoreSb.rpc('admin_update_live_score',{
      p_fixture_id:fixtureId,p_home_score:Number(rawHome),p_away_score:Number(rawAway),
      p_note:document.getElementById('os-note')?.value?.trim()||''
   });
  if(error)throw error;
  document.getElementById('os-dialog')?.remove();
  if(typeof window.refreshPLPMatchCentreAfterScore==='function')
   await window.refreshPLPMatchCentreAfterScore();
 }catch(e){osError(e.message||'Live score could not be saved.')}
 finally{ownerScoreBusy=false;buttons.forEach(b=>b.disabled=false)}
}
osStyles();
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-plp-owner-live-open],[data-os-save],[data-os-revert],[data-os-close]');
 if(!button)return;
 e.preventDefault();
 if(button.hasAttribute('data-plp-owner-live-open')){
  osOpen(button.getAttribute('data-plp-owner-live-open'));return;
 }
 if(button.hasAttribute('data-os-close')){document.getElementById('os-dialog')?.remove();return}
 if(button.hasAttribute('data-os-save')){osSubmit(false);return}
 if(button.hasAttribute('data-os-revert')){osSubmit(true)}
});
document.addEventListener('change',e=>{if(e.target?.id==='os-fixture')osUpdateForm()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.getElementById('os-dialog'))document.getElementById('os-dialog')?.remove()
});
