// Read-only owner preview of another member's personalised Home.
// Never impersonates the member or writes to their predictions/messages.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const phSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);
let phCtx=null,phCheckedAt=0,phOverlay=null,phMembers=[],phBusy=false,phOldOverflow='';
const phEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phNum=v=>Number(v||0);
function phOrd(n){n=Number(n||0);if(!n)return '–';return n+(n%100>=11&&n%100<=13?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th')}
function phDate(v){try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric'}).format(new Date(v))}catch{return ''}}
function phIsHome(){return !!document.querySelector('#nav button[data-v="home"].active')}

function phCss(){
 if(document.getElementById('ph-preview-css'))return;
 const css=document.createElement('style');css.id='ph-preview-css';
 css.textContent=
 '.phLauncher{width:100%;border:1px solid #c5b2ef;border-radius:13px;background:#f4efff;color:#38206a;'+
 'padding:11px 13px;margin:0 0 11px;text-align:left;font-size:12px;font-weight:900;cursor:pointer}'+
 '.phLauncher small{display:block;font-size:10px;font-weight:500;margin-top:3px;color:#655978}'+
 '.phShade{position:fixed;inset:0;z-index:30000;background:rgba(12,7,32,.84);'+
 'display:flex;justify-content:center;align-items:center;padding:8px}'+
 '.phPanel{display:flex;flex-direction:column;width:min(430px,100%);max-height:calc(100dvh - 16px);'+
 'background:#f7f6fb;border-radius:19px;overflow:hidden;box-shadow:0 20px 70px rgba(0,0,0,.4)}'+
 '.phBar{flex-shrink:0;background:#21114b;color:#fff;padding:12px;display:flex;gap:10px;'+
 'align-items:center;justify-content:space-between}'+
 '.phBar b{display:block;font-size:13px}.phBar small{display:block;font-size:10px;opacity:.75;margin-top:3px}'+
 '.phClose{border:1px solid #716287;border-radius:11px;background:#493372;color:white;'+
 'font-size:19px;min-width:42px;min-height:40px;cursor:pointer}'+
 '.phPicker{flex-shrink:0;padding:12px;background:white;border-bottom:1px solid #e7e1ef}'+
 '.phPicker label{display:block;font-size:11px;font-weight:800;color:#4c4360;margin-bottom:6px}'+
 '.phPicker select{width:100%;padding:11px;border:1px solid #b4aaca;border-radius:10px;font-size:14px;background:#fff;color:#231944}'+
 '.phScroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:12px 12px 24px}'+
 '.phHero{border-radius:17px;padding:18px 15px;color:#fff;background:linear-gradient(140deg,#291151,#533096);margin-bottom:12px}'+
 '.phHero .phClub{font-size:11px;opacity:.82;text-transform:uppercase;letter-spacing:.04em}'+
 '.phHero h2{margin:17px 0 3px;font-size:22px;line-height:1.15;overflow-wrap:anywhere}'+
 '.phHero .phManager{font-size:12px;opacity:.84}'+
 '.phStatGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:15px}'+
 '.phStat{background:rgba(255,255,255,.12);border-radius:10px;padding:10px 5px;text-align:center}'+
 '.phStat b{display:block;font-size:22px}.phStat span{display:block;font-size:10px;opacity:.9}'+
 '.phMini{font-size:11px;margin-top:9px;opacity:.94}'+
 '.phCard{background:white;border:1px solid #e5ddec;border-radius:16px;padding:14px;margin-bottom:11px}'+
 '.phCard h3{font-size:16px;color:#25144f;margin:0 0 9px}'+
 '.phCard p{font-size:13px;line-height:1.5;margin:5px 0;color:#494052}'+
 '.phFeature{border:1px solid #cbb2ed;border-radius:12px;background:#fbf8ff;padding:13px;margin:9px 0}'+
 '.phTag{font-size:10px;color:#593399;text-transform:uppercase;font-weight:900}'+
 '.phHeadline{font-size:15px;font-weight:900;color:#34214d;margin:6px 0 9px;overflow-wrap:anywhere}'+
 '.phBody{font-size:13.5px;line-height:1.65;color:#3e3650;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal}'+
 '.phDate{font-size:11px;color:#877e90;margin-top:6px}'+
 '.phOlder{border:1px solid #e4ddea;border-radius:11px;margin-top:8px;background:#fff}'+
 '.phOlder summary{cursor:pointer;padding:11px 12px;list-style:none;font-size:13px;font-weight:850;color:#2b2041}'+
 '.phOlder summary::-webkit-details-marker{display:none}'+
 '.phOlder[open] summary{border-bottom:1px solid #eee8f2}'+
 '.phOlder .phBody{padding:11px 12px 14px}'+
 '.phInfo{background:#e9f8f0;border:1px solid #bde3ce;border-radius:12px;padding:11px;font-size:12px;color:#12523b}'+
 '.phFoot{margin-top:14px;color:#766f86;font-size:11px;line-height:1.5}'+
 '.phError{padding:15px;color:#9e253b;white-space:pre-wrap}'+
 '.phSpinner{padding:28px 14px;text-align:center;font-size:13px;color:#675c76}';
 document.head.appendChild(css);
}

async function phContext(force=false){
 if(!force&&phCheckedAt&&Date.now()-phCheckedAt<30000)return phCtx;
 phCheckedAt=Date.now();phCtx=null;
 const {data:{session}}=await phSb.auth.getSession();
 if(!session)return null;
 const {data,error}=await phSb.from('league_members')
   .select('league_id,role,status,joined_at')
   .eq('user_id',session.user.id).eq('role','admin').eq('status','active')
   .order('joined_at',{ascending:false}).limit(1);
 if(error||!data?.length)return null;
 phCtx={leagueId:data[0].league_id,userId:session.user.id};
 return phCtx;
}

async function phAttach(){
 if(!phIsHome())return;
 const c=await phContext();if(!c)return;
 const host=document.querySelector('#main .hfHost');
 if(!host||host.querySelector('.phLauncher'))return;
 const btn=document.createElement('button');
 btn.type='button';btn.className='phLauncher';
 btn.innerHTML='👁️ Preview a player’s homepage'+
   '<small>Owner only · see Ross or any member’s personalised Home (read only)</small>';
 btn.addEventListener('click',phOpen);
 host.prepend(btn);
}

function phBody(m){
 return '<div class="phBody">'+phEsc(m?.body||'')+'</div>';
}

function phUpdates(d){
 const list=Array.isArray(d?.messages)?[...d.messages]:[];
 list.sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
 if(!list.length)return '<div class="phCard"><h3>📣 League messages</h3><p>No current league messages.</p></div>';
 const latest=list.find(m=>m.private)||list.find(m=>m.source_type==='owner_generator')||list[0];
 const older=list.filter(m=>m.id!==latest.id);
 return '<section class="phCard"><h3>📣 Latest from James</h3>'+
  '<div class="phFeature"><div class="phTag">'+phEsc(latest.private?'Private message':'League update from James')+'</div>'+
  '<div class="phHeadline">'+phEsc(latest.title)+'</div>'+phBody(latest)+
  '<div class="phDate">'+phEsc(phDate(latest.created_at))+'</div></div>'+
  (older.length?'<h3 style="font-size:13px;margin-top:15px">🕘 Older messages · newest first</h3>'+
   older.map(m=>'<details class="phOlder"><summary>'+phEsc(m.title)+
     '<div class="phDate">'+phEsc(phDate(m.created_at))+' · Tap to read full message ↓</div></summary>'+
     phBody(m)+'</details>').join(''):'')+
  '</section>';
}

function phRender(d){
 const profile=d.profile||{},me=d.me||{},pred=d.predictions||{},leader=d.leader||{},last=d.last_round||{};
 const missing=phNum(pred.missing_count),saved=phNum(pred.saved_count),open=phNum(pred.open_count);
 let predText=missing?missing+' open prediction'+(missing===1?'':'s')+' missing':
   open?'All '+saved+' current predictions saved':'No predictions currently need attention';
 const story=d.league_story||{};
 return '<div class="phHero"><div class="phClub">⚽ '+phEsc(profile.favourite_club||'Choose your club')+' supporter</div>'+
  '<h2>'+phEsc(profile.team_name||'My team')+'</h2>'+
  '<div class="phManager">'+phEsc(profile.display_name||'Player')+'</div>'+
  '<div class="phStatGrid">'+
    '<div class="phStat"><b>'+phOrd(me.position)+'</b><span>Position</span></div>'+
    '<div class="phStat"><b>'+phNum(me.points)+'</b><span>Points</span></div>'+
    '<div class="phStat"><b>'+phNum(me.exacts)+'</b><span>Exacts</span></div>'+
  '</div><div class="phMini">'+(me.position===1?'🏆 League leader':
    phNum(me.gap_to_leader)+' pts behind the leader')+'</div></div>'+
  phUpdates(d)+
  '<section class="phCard"><h3>✍️ Predictions</h3><div class="phInfo">'+phEsc(predText)+'</div>'+
    (pred.next_home_team&&pred.next_away_team?'<p>Next to complete: '+phEsc(pred.next_home_team)+' v '+phEsc(pred.next_away_team)+'</p>':'')+'</section>'+
  '<section class="phCard"><h3>💬 League WhatsApp group</h3><p>Direct group link shown on members’ Home.</p></section>'+
  '<section class="phCard"><h3>⚡ League Pulse</h3>'+
    (leader.team_name?'<p>🏆 League leader: <b>'+phEsc(leader.team_name)+'</b> · '+phNum(leader.points)+' points</p>':'')+
    (story.most_divided?'<p>⚖️ Most debated: '+phEsc(story.most_divided.home_team)+' v '+phEsc(story.most_divided.away_team)+'</p>':'')+
    '</section>'+
  (last.matchweek?'<section class="phCard"><h3>↩️ Last round (MW'+phNum(last.matchweek)+')</h3>'+
   '<p><b>'+phNum(last.points)+' points</b> · '+phNum(last.exacts)+' exacts · '+phOrd(last.weekly_position)+' for the round</p></section>':'')+
  '<div class="phFoot">Admin-only, read-only content preview based on the selected member’s saved data. Their actual browser may also show device-specific notifications and live-match widgets.</div>';
}

function phClose(){
 if(!phOverlay)return;
 phOverlay.remove();phOverlay=null;document.body.style.overflow=phOldOverflow;
}

async function phFetch(userId){
 if(!phCtx)throw Error('Admin session unavailable');
 const {data,error}=await phSb.rpc('get_owner_player_home_preview',{
   p_league_id:phCtx.leagueId,p_target_user_id:userId
 });
 if(error)throw error;
 if(!data||data.read_only!==true)throw Error('No preview data returned');
 return data;
}

function phFillMembers(selected){
 const select=phOverlay?.querySelector('#phPlayerSelect');if(!select)return;
 select.innerHTML=phMembers.map(m=>'<option value="'+phEsc(m.user_id)+'"'+
  (m.user_id===selected?' selected':'')+'>'+
  phEsc(m.display_name||m.team_name||'Member')+' · '+phEsc(m.team_name||'')+'</option>').join('');
}

async function phSelect(userId){
 if(!phOverlay||phBusy)return;
 phBusy=true;
 const area=phOverlay.querySelector('.phScroll'),select=phOverlay.querySelector('#phPlayerSelect');
 if(select)select.disabled=true;
 if(area)area.innerHTML='<div class="phSpinner">Loading player’s homepage…</div>';
 try{
  const data=await phFetch(userId);
  if(!phOverlay)return;
  phMembers=Array.isArray(data.members)?data.members:[];
  phFillMembers(userId);
  area.innerHTML=phRender(data);
  area.scrollTop=0;
 }catch(e){
  if(area)area.innerHTML='<div class="phError">Unable to load this preview: '+phEsc(e.message||e)+'</div>';
 }finally{
  phBusy=false;
  if(select)select.disabled=false;
 }
}

async function phOpen(){
 if(phOverlay)return;
 try{phCtx=await phContext(true);if(!phCtx)return}catch{return}
 phCss();phOldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 phOverlay=document.createElement('div');phOverlay.className='phShade';
 phOverlay.innerHTML='<div class="phPanel" role="dialog" aria-modal="true" aria-label="Read-only player homepage">'+
  '<div class="phBar"><div><b>👁️ View as player</b>'+
    '<small>League owner preview · read only</small></div>'+
    '<button class="phClose" type="button" aria-label="Close preview">×</button></div>'+
  '<div class="phPicker"><label for="phPlayerSelect">Whose homepage would you like to inspect?</label>'+
    '<select id="phPlayerSelect" disabled><option>Loading league members…</option></select></div>'+
  '<div class="phScroll"><div class="phSpinner">Loading player list…</div></div></div>';
 document.body.appendChild(phOverlay);
 phOverlay.querySelector('.phClose').onclick=phClose;
 phOverlay.addEventListener('click',e=>{if(e.target===phOverlay)phClose()});
 phOverlay.querySelector('#phPlayerSelect').addEventListener('change',e=>phSelect(e.target.value));
 try{
  const initial=await phFetch(phCtx.userId);
  if(!phOverlay)return;
  phMembers=Array.isArray(initial.members)?initial.members:[];
  const ross=phMembers.find(m=>String(m.display_name||'').toLowerCase()==='ross c');
  const selected=ross?.user_id||phMembers.find(m=>m.user_id!==phCtx.userId)?.user_id||phCtx.userId;
  await phSelect(selected);
 }catch(e){
  if(phOverlay)phOverlay.querySelector('.phScroll').innerHTML=
   '<div class="phError">Unable to load member preview: '+phEsc(e.message||e)+'</div>';
 }
}

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&phOverlay)phClose()});
document.addEventListener('click',e=>{
 if(e.target.closest?.('#nav button[data-v]'))setTimeout(phAttach,350);
},true);
window.addEventListener('focus',()=>{phCheckedAt=0;setTimeout(phAttach,400)});
window.openPLPHomePreview=phOpen;
phCss();setInterval(phAttach,2400);setTimeout(phAttach,1200);
