// Late Entry Rescue - owner controlled; missing predictions only.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const LR=createClient('https://jzrbaeyvwagrwukntjbk.supabase.co','sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8');
let ctx=null,sessionId=null,mine=[],overview=null,day=null,checkedAt=0,fetching=false,busy=false,timer=null,deepHandled=false;
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const array=x=>Array.isArray(x)?x:[];
const clock=x=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'}).format(new Date(x));
const ukDay=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=k=>p.find(x=>x.type===k).value;return v('year')+'-'+v('month')+'-'+v('day')};
const appLink=()=>location.origin+location.pathname+'?late=1';

function styles(){
 if(document.getElementById('lr-style'))return;
 const s=document.createElement('style');s.id='lr-style';
 s.textContent=[
 '.lrCard{border:1px solid #d9cef2;background:linear-gradient(135deg,#f9f6ff,#fff)}',
 '.lrPlayer{border:1px solid #b8e2ce;background:linear-gradient(135deg,#edfff5,#fff)}',
 '.lrHead{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}',
 '.lrHead h2{font-size:17px;margin:0}.lrTag{font-size:10px;border-radius:25px;background:#e9defe;color:#4b269d;font-weight:800;padding:6px 8px;white-space:nowrap}',
 '.lrSmall{color:#6f6980;font-size:12px;line-height:1.5;margin:8px 0}',
 '.lrRow{display:flex;flex-wrap:wrap;gap:8px;margin:9px 0}',
 '.lrButton{border:0;border-radius:10px;background:#4b269d;color:#fff;padding:10px 12px;font-size:12px;font-weight:850;cursor:pointer}',
 '.lrButton:disabled{opacity:.5;cursor:default}.lrButton.alt{background:#eeeaf8;color:#453572}.lrButton.wa{background:#12816a}.lrButton.close{background:#feecec;color:#b52c3c}',
 '.lrDate{border:1px solid #e3dfeb;padding:9px;border-radius:10px;font-size:12px;background:white}',
 '.lrNote{border-radius:11px;background:#eef8f3;color:#22664c;padding:10px;font-size:12px;line-height:1.5}',
 '.lrPerson{border:1px solid #e8e1f5;background:white;border-radius:12px;padding:10px;margin-top:10px}',
 '.lrPerson strong{font-size:13px}.lrPerson small{display:block;font-size:11px;color:#706a7e;margin-top:5px;line-height:1.5}',
 '.lrOverlay{position:fixed;z-index:14000;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(20,15,38,.75)}',
 '.lrModal{background:#fff;border-radius:20px 20px 0 0;padding:18px 16px;width:min(100%,620px);max-height:94dvh;overflow:auto}',
 '.lrMatch{border:1px solid #e8e1f5;border-radius:12px;padding:12px;margin:10px 0}',
 '.lrScore{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:8px}',
 '.lrScore label{font-size:11px;color:#706a7e}.lrScore input{display:block;margin-top:3px;text-align:center;width:70px;height:44px;border:1px solid #cfc9df;border-radius:10px;font-size:20px}',
 '.lrErr{color:#b52c3c;background:#fff1f1;border-radius:10px;padding:10px;font-size:12px}',
 '@media(min-width:600px){.lrOverlay{align-items:center;padding:18px}.lrModal{border-radius:20px;max-height:90dvh}}'
 ].join('');
 document.head.appendChild(s);
}
async function context(){
 const {data:{session}}=await LR.auth.getSession();
 const id=session?.user?.id;
 if(!id){ctx=null;sessionId=null;mine=[];overview=null;return null}
 if(ctx&&sessionId===id)return ctx;
 const {data,error}=await LR.from('league_members').select('league_id,role,status,joined_at')
  .eq('user_id',id).eq('status','active').order('joined_at',{ascending:false}).limit(1);
 if(error||!data?.length)return null;
 sessionId=id;ctx={userId:id,leagueId:data[0].league_id,admin:data[0].role==='admin'};
 overview=null;mine=[];checkedAt=0;return ctx;
}
async function getMine(force=false){
 if(fetching||(!force&&Date.now()-checkedAt<12000))return;
 fetching=true;
 try{
  if(!await context())return;
  const {data,error}=await LR.rpc('get_my_late_rescue');
  if(error)throw error;
  mine=array(data?.fixtures);checkedAt=Date.now();
 }catch(e){console.warn('Late entry status',e)}
 finally{fetching=false}
}
async function getOverview(){
 const c=await context();if(!c?.admin)return;
 const {data,error}=await LR.rpc('admin_late_rescue_overview',{p_league_id:c.leagueId,p_day:day||ukDay()});
 if(error)throw error;overview=data||null;
}
function adminCard(){
 return '<section class="card lrCard" id="lr-admin"><div class="lrHead"><h2>⏰ Late Entry Rescue</h2><span class="lrTag">Admin only</span></div>'+
 '<p class="lrSmall">Reopen <b>missing predictions only</b> after the regular deadline. Players save their own scores. Every permission expires at kick-off and existing picks stay locked.</p>'+
 '<div class="lrRow"><input type="date" class="lrDate" id="lr-date" aria-label="Match date" value="'+safe(day||ukDay())+'">'+
 '<button class="lrButton alt" data-lr="refresh">Check missing</button></div><div id="lr-admin-body">Checking live predictions…</div></section>';
}
function reminder(p){
 const f=array(p.fixtures).filter(x=>x.rescued),name=String(p.display_name||'there').trim().split(/\s+/)[0];
 return ['Hi '+name+'! ⚽','','I’ve reopened your missing Premier League predictions. You can now enter your scores in the app:',
  '',...f.map(x=>'⚽ '+x.home_team+' v '+x.away_team+' ('+clock(x.kickoff_at)+')'),
  '','Only your outstanding matches are reopened. They will lock again automatically at kick-off.',
  '','📲 Enter your scores:',appLink()].join('\n');
}
function adminBody(){
 if(!overview)return '<p class="lrSmall">Checking live predictions…</p>';
 const p=array(overview.players),n=Number(overview.missing_count||0),r=Number(overview.rescued_count||0);
 const targets=p.filter(x=>x.rescued_count>0),fixtures=array(overview.fixtures);
 return '<div class="lrNote">'+(fixtures.length
 ?'<b>'+n+' missing picks</b> · '+p.length+' players · '+r+' reopened'
 :'<b>No eligible matches on this date.</b> Games must be past their normal prediction deadline but not yet kicked off.')+'</div>'+
 '<div class="lrRow"><button class="lrButton" data-lr="open" '+(n===r||!n?'disabled':'')+'>🔓 Open '+(n-r)+' missing picks</button>'+
 '<button class="lrButton close" data-lr="close" '+(!r?'disabled':'')+'>🔒 Close rescue</button></div>'+
 (targets.length?'<div class="lrRow"><button class="lrButton alt" data-lr="copyall">Copy '+targets.length+' personalised reminders</button></div>':'')+
 targets.map(x=>{
  const f=array(x.fixtures).filter(y=>y.rescued);
  return '<div class="lrPerson"><strong>⚽ '+safe(x.display_name)+'</strong> <span class="lrTag">'+f.length+' outstanding</span>'+
   '<small>'+f.map(y=>safe(y.home_team)+' v '+safe(y.away_team)+' · '+clock(y.kickoff_at)).join(' · ')+'</small>'+
   '<div class="lrRow"><button class="lrButton alt" data-lr="copy" data-player="'+safe(x.user_id)+'">Copy message</button>'+
   '<button class="lrButton wa" data-lr="wa" data-player="'+safe(x.user_id)+'">WhatsApp '+safe(x.display_name)+'</button></div></div>'
 }).join('')+
 (!targets.length&&p.length?'<p class="lrSmall">Open the missing picks to create individual WhatsApps for the affected players only.</p>':'');
}
function playerCard(){
 return '<section class="card lrPlayer" id="lr-player"><div class="lrHead"><h2>⚽ Late predictions reopened</h2><span class="lrTag">'+mine.length+' open</span></div>'+
 '<p class="lrSmall">The league owner has reopened your missing '+(mine.length===1?'prediction':'predictions')+'. Submit before kick-off.</p>'+
 '<button class="lrButton" data-lr="modal">Enter my missing scores →</button></section>';
}
function render(){
 const main=document.getElementById('main'),nav=document.getElementById('nav');
 if(!main||!ctx||!nav||nav.style.display==='none')return;
 const tab=nav.querySelector('button.active')?.dataset.v;
 if(ctx.admin&&tab==='more'){
  if(!main.querySelector('#lr-admin')){
   const wrap=document.createElement('div');wrap.innerHTML=adminCard();main.prepend(wrap.firstElementChild);
  }
  const body=main.querySelector('#lr-admin-body');
  const serialized=JSON.stringify(overview);
  if(body&&body.dataset.state!==serialized){body.innerHTML=adminBody();body.dataset.state=serialized}
 }else main.querySelector('#lr-admin')?.remove();
 if(['home','predict'].includes(tab)&&mine.length){
  if(!main.querySelector('#lr-player')){
   const wrap=document.createElement('div');wrap.innerHTML=playerCard();main.prepend(wrap.firstElementChild);
  }
 }else main.querySelector('#lr-player')?.remove();
}
function modal(){
 if(!mine.length)return;
 document.getElementById('lr-overlay')?.remove();
 const el=document.createElement('div');el.className='lrOverlay';el.id='lr-overlay';
 el.innerHTML='<section class="lrModal" role="dialog" aria-modal="true" aria-label="Missing predictions">'+
 '<div class="lrHead"><h2 style="margin:0">⚽ Your reopened predictions</h2><button class="lrButton alt" data-lr="dismiss">✕</button></div>'+
 '<p class="lrSmall">Enter only your missing scores. They close automatically at the kick-off of each game.</p><div id="lr-msg"></div>'+
 mine.map(f=>'<div class="lrMatch"><strong>'+safe(f.home_team)+' v '+safe(f.away_team)+'</strong>'+
 '<div class="lrSmall">Kick-off '+clock(f.kickoff_at)+'</div>'+
 '<div class="lrScore"><label>Home<input inputmode="numeric" type="number" min="0" max="20" data-lr-home="'+safe(f.fixture_id)+'" aria-label="'+safe(f.home_team)+' predicted goals"></label>'+
 '<strong>–</strong><label>Away<input inputmode="numeric" type="number" min="0" max="20" data-lr-away="'+safe(f.fixture_id)+'" aria-label="'+safe(f.away_team)+' predicted goals"></label></div></div>').join('')+
 '<button class="lrButton" data-lr="save" style="width:100%;margin-top:8px">Save entered predictions</button>'+
 '<p class="lrSmall">You may leave both boxes blank to skip a match for now. Once a rescued prediction is saved, it is locked.</p></section>';
 document.body.appendChild(el);
}
async function save(){
 if(busy)return;
 const msg=document.getElementById('lr-msg'),button=document.querySelector('#lr-overlay [data-lr="save"]'),items=[];
 for(const f of mine){
  const h=document.querySelector('[data-lr-home="'+f.fixture_id+'"]')?.value.trim();
  const a=document.querySelector('[data-lr-away="'+f.fixture_id+'"]')?.value.trim();
  if(h===''&&a==='')continue;
  if(!/^\d{1,2}$/.test(h)||!/^\d{1,2}$/.test(a)||+h>20||+a>20){
   if(msg)msg.innerHTML='<div class="lrErr">Enter both whole-number scores, 0–20, or leave both blank.</div>';
   return;
  }
  items.push({id:f.fixture_id,h:+h,a:+a});
 }
 if(!items.length){if(msg)msg.innerHTML='<div class="lrErr">Enter at least one score.</div>';return}
 busy=true;if(button){button.disabled=true;button.textContent='Saving…'}
 let saved=0,errorMessage='';
 for(const item of items){
  const {error}=await LR.rpc('save_prediction',{p_fixture_id:item.id,p_home_score:item.h,p_away_score:item.a});
  if(error){errorMessage=error.message||'Could not save';break}
  saved++;
 }
 checkedAt=0;await getMine(true);render();busy=false;
 if(errorMessage){if(msg)msg.innerHTML='<div class="lrErr">'+safe(errorMessage)+' · '+saved+' saved. Reopen to check the remainder.</div>';if(button){button.textContent='Try remaining picks';button.disabled=false}return}
 if(!mine.length){
  const modal=document.querySelector('#lr-overlay .lrModal');
  if(modal)modal.innerHTML='<div class="lrHead"><h2>✅ All predictions saved</h2><button class="lrButton alt" data-lr="done">Done</button></div><p class="lrSmall">Your rescued picks have been submitted.</p>';
 }else modal();
}
async function copy(x){
 try{await navigator.clipboard.writeText(x)}
 catch{const el=document.createElement('textarea');el.value=x;el.style.position='fixed';el.style.left='-5000px';document.body.appendChild(el);el.select();document.execCommand('copy');el.remove()}
}
function whatsapp(x){const url='https://wa.me/?text='+encodeURIComponent(x);if(!window.open(url,'_blank','noopener'))location.href=url}
async function action(e){
 const b=e.target.closest?.('[data-lr]');if(!b)return;
 e.preventDefault();
 const t=b.dataset.lr;
 if(t==='dismiss'||t==='done'){document.getElementById('lr-overlay')?.remove();if(t==='done')location.reload();return}
 if(t==='modal'){await getMine(true);if(mine.length)modal();return}
 if(t==='save'){await save();return}
 if(t==='refresh'){day=document.getElementById('lr-date')?.value||ukDay();overview=null;await getOverview();render();return}
 if(t==='open'||t==='close'){
  if(busy)return;
  const c=await context();if(!c?.admin)return;
  day=document.getElementById('lr-date')?.value||ukDay();
  const open=t==='open';
  if(!confirm(open?
   'Reopen only missing, locked predictions for '+day+'? They will close at each kick-off.':
   'Close all unused Late Entry Rescue permissions for '+day+'?'))return;
  busy=true;b.disabled=true;
  try{
   const {data,error}=await LR.rpc('admin_set_late_rescue',{p_league_id:c.leagueId,p_day:day,p_open:open});
   if(error)throw error;
   await getOverview();render();
   alert((open?'Reopened ':'Closed ')+Number(data?.changed||0)+' prediction slots.'+(open?' Individual WhatsApps are ready below.':''));
  }catch(err){alert(err.message||String(err))}
  finally{busy=false;b.disabled=false}
  return;
 }
 const targets=array(overview?.players).filter(p=>p.rescued_count>0);
 if(t==='copyall'){if(targets.length){await copy(targets.map(reminder).join('\n\n——————\n\n'));b.textContent='✓ Copied'}return}
 const p=targets.find(x=>x.user_id===b.dataset.player);if(!p)return;
 if(t==='copy'){await copy(reminder(p));b.textContent='✓ Copied'}
 if(t==='wa')whatsapp(reminder(p));
}
async function refresh(force=false){
 const c=await context();if(!c)return;
 await getMine(force);
 if(c.admin&&document.querySelector('#nav button.active')?.dataset.v==='more'&&(!overview||force)){
  try{await getOverview()}catch(e){console.warn('Late rescue owner overview',e)}
 }
 render();
 if(new URLSearchParams(location.search).has('late')&&!deepHandled&&mine.length){deepHandled=true;modal()}
}
document.addEventListener('click',e=>action(e).catch(err=>console.warn('Late rescue',err)));
document.addEventListener('change',e=>{if(e.target?.id==='lr-date'){day=e.target.value;overview=null;refresh(true)}});
styles();
const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>refresh(false).catch(()=>{}),300)});
observer.observe(document.body,{childList:true,subtree:true});
LR.auth.onAuthStateChange(()=>{ctx=null;sessionId=null;overview=null;checkedAt=0;setTimeout(()=>refresh(true),300)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true)});
setTimeout(()=>refresh(true),750);
