// Private owner <-> player direct inbox. Messages are private server-side, not league chat.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const dmSb=createClient('https://jzrbaeyvwagrwukntjbk.supabase.co','sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8');
let dmCtx=null,dmUserId=null,dmInbox=null,dmUpdatedAt=0,dmLoading=false,dmOverlay=null,dmPeer=null,dmThread=null,dmThreadVersion='',dmSending=false,dmTimer=null,dmSearchText='';
const dmEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dmArr=a=>Array.isArray(a)?a:[];
const dmTime=s=>{try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(s))}catch{return ''}};
const dmName=p=>String(p?.display_name||p?.team_name||'Player');
const dmFirst=p=>dmName(p).trim().split(/\s+/)[0];

function dmCss(){
 if(document.getElementById('dm-inbox-style'))return;
 const s=document.createElement('style');s.id='dm-inbox-style';
 s.textContent=[
 '.dmHomeCard{border:1px solid #d7caef;background:linear-gradient(130deg,#fcfaff,#fff);border-radius:17px;padding:14px;margin-bottom:12px;box-shadow:0 8px 24px #2010470e}',
 '.dmHomeTop{display:flex;align-items:center;justify-content:space-between;gap:8px}',
 '.dmHomeTop h2{font-size:16px;color:#261253;margin:0;font-weight:950}',
 '.dmCounter{border-radius:22px;background:#e4f8ef;color:#08775c;padding:5px 9px;font-size:10px;font-weight:900}',
 '.dmDescription{font-size:11px;line-height:1.55;color:#686174;margin:7px 0 10px}',
 '.dmBtn{border:0;border-radius:11px;background:#4b269d;color:white;font-weight:900;font-size:12px;padding:10px 13px;cursor:pointer}',
 '.dmBtn:disabled{opacity:.55}.dmBtn.alt{background:#f0eafa;color:#4b269d}',
 '.dmThreadPreview{display:flex;gap:10px;align-items:center;width:100%;background:#fff;border:1px solid #e6e0f2;border-radius:12px;padding:10px;margin-top:7px;cursor:pointer;text-align:left}',
 '.dmThreadPreview b{font-size:12px;color:#261253}.dmThreadPreview small{display:block;font-size:10px;color:#6c6479;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60vw}',
 '.dmUnread{font-size:10px;font-weight:900;border-radius:30px;background:#4b269d;color:white;padding:4px 7px}',
 '.dmBackdrop{position:fixed;inset:0;z-index:13500;background:#0e0a26b8;display:flex;align-items:flex-end;justify-content:center}',
 '.dmPanel{width:min(100%,620px);background:#fff;border-radius:21px 21px 0 0;padding:14px 14px 20px;max-height:95dvh;display:flex;flex-direction:column;box-shadow:0 0 45px #100a3d48}',
 '.dmPanelHead{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:3px 2px 11px}',
 '.dmPanelHead h2{font-size:18px;line-height:1.15;color:#261253;margin:0;flex:1}',
 '.dmClose{border:0;background:#f2f0f8;color:#4b269d;border-radius:10px;font-size:13px;font-weight:900;padding:8px 11px;cursor:pointer}',
 '.dmList{overflow-y:auto;min-height:120px;flex:1}',
 '.dmFind{padding:11px 12px;border-radius:12px;border:1px solid #dcd7eb;width:100%;font-size:14px;margin:0 0 10px}',
 '.dmContact{display:flex;align-items:center;justify-content:space-between;width:100%;border:1px solid #ebe7f2;background:#fff;border-radius:12px;padding:12px;margin:7px 0;text-align:left;cursor:pointer;color:#30263f}',
 '.dmContact strong{font-size:13px}.dmContact small{font-size:10px;color:#827b8d;display:block;margin-top:3px}',
 '.dmBubbles{overflow-y:auto;flex:1;min-height:140px;display:flex;flex-direction:column;gap:8px;padding:9px 4px 14px;background:#fbfaff;border-radius:12px}',
 '.dmBubble{max-width:87%;align-self:flex-start;background:#eeebf5;color:#2d2640;border-radius:14px 14px 14px 3px;padding:10px 12px;font-size:13px;line-height:1.5;word-break:break-word;white-space:pre-wrap}',
 '.dmBubble.mine{background:#4b269d;color:#fff;align-self:flex-end;border-radius:14px 14px 3px 14px}',
 '.dmStamp{font-size:9px;opacity:.75;margin-top:5px;white-space:normal}',
 '.dmCompose{display:flex;align-items:flex-end;gap:7px;padding-top:11px}',
 '.dmText{border:1px solid #d5cee4;border-radius:12px;font:inherit;font-size:13px;resize:none;min-height:44px;max-height:125px;flex:1;min-width:0;padding:10px 11px}',
 '.dmError{background:#fff0ee;color:#a53532;border-radius:10px;padding:8px;margin:7px 0;font-size:11px}',
 '.dmNavDot{font-size:9px;position:absolute;right:2px;top:0;background:#edb936;color:#171027;border-radius:20px;min-width:15px;height:15px;display:flex;align-items:center;justify-content:center;font-weight:900}',
 '@media(min-width:600px){.dmBackdrop{align-items:center;padding:18px}.dmPanel{border-radius:20px;max-height:90dvh}}'
 ].join('');
 document.head.appendChild(s);
}
async function dmContext(){
 const {data:{session}}=await dmSb.auth.getSession();
 const uid=session?.user?.id;
 if(!uid){dmCtx=null;dmUserId=null;dmInbox=null;return null}
 if(dmCtx&&dmUserId===uid)return dmCtx;
 const {data,error}=await dmSb.from('league_members').select('league_id,status,joined_at')
 .eq('user_id',uid).eq('status','active').order('joined_at',{ascending:false}).limit(1);
 if(error||!data?.length)return null;
 dmCtx={uid,leagueId:data[0].league_id};dmUserId=uid;dmInbox=null;dmUpdatedAt=0;return dmCtx;
}
async function dmLoad(force=false){
 if(dmLoading||(!force&&Date.now()-dmUpdatedAt<9000))return;
 dmLoading=true;
 try{
  const c=await dmContext();if(!c)return;
  const {data,error}=await dmSb.rpc('get_my_league_direct_inbox',{p_league_id:c.leagueId});
  if(error)throw error;dmInbox=data||null;dmUpdatedAt=Date.now();dmRenderHome();
 }catch(e){console.warn('Direct inbox load:',e)}
 finally{dmLoading=false}
}
function dmPreview(p){
 const own=p.last_sender_id===dmCtx?.uid;
 return '<button type="button" class="dmThreadPreview" data-dm-open="'+dmEsc(p.user_id)+'">'+
  '<div style="font-size:19px">'+dmEsc(p.badge||'⚽')+'</div>'+
  '<div style="flex:1;min-width:0"><b>'+dmEsc(dmName(p))+'</b>'+
  '<small>'+dmEsc((own?'You: ':'')+(p.last_body||''))+'</small></div>'+
  (Number(p.unread)>0?'<span class="dmUnread">'+Number(p.unread)+'</span>':'')+
  '</button>';
}
function dmCard(){
 const d=dmInbox;
 const isOwner=!!d?.is_owner;
 const threads=dmArr(d?.threads);
 const unread=Number(d?.unread_total||0);
 return '<div id="dm-home-card" class="dmHomeCard" aria-label="Private direct messages">'+
  '<div class="dmHomeTop"><h2>✉️ Private messages</h2>'+
  '<span class="dmCounter">'+(unread?unread+' unread':'Private inbox')+'</span></div>'+
  '<p class="dmDescription">'+(isOwner?
   'Message any league member directly — no phone number needed. Only you and that player can read the conversation.':
   'Your private conversation with James, the league organiser. Replies are only visible to you both.')+'</p>'+
  '<button class="dmBtn" data-dm-action="inbox">'+(isOwner?'Message a player':'Message James')+'</button>'+
  (threads.length?'<div style="margin-top:9px">'+threads.slice(0,3).map(dmPreview).join('')+
   (threads.length>3?'<button class="dmBtn alt" style="margin-top:8px;width:100%" data-dm-action="inbox">View all conversations →</button>':'')+'</div>':'')+
  '</div>';
}
function dmHomeActive(){return !!document.querySelector('#nav button[data-v="home"].active')}
function dmRenderHome(){
 const main=document.getElementById('main');
 if(!main||!dmInbox)return;
 const nav=document.querySelector('#nav button[data-v="home"]');
 if(nav){
  nav.style.position='relative';
  let dot=nav.querySelector('.dmNavDot');const n=Number(dmInbox.unread_total||0);
  if(n){if(!dot){dot=document.createElement('span');dot.className='dmNavDot';nav.appendChild(dot)}dot.textContent=n>9?'9+':String(n)}
  else dot?.remove();
 }
 if(!dmHomeActive()){main.querySelector('#dm-home-card')?.remove();return}
 const host=main.querySelector('.hfHost')||main;
 const html=dmCard();
 let card=host.querySelector('#dm-home-card');
 if(!card){const wrap=document.createElement('div');wrap.innerHTML=html;host.prepend(wrap.firstElementChild)}
 else if(card.outerHTML!==html){card.outerHTML=html}
}
function dmModal(){
 let el=document.getElementById('dm-modal');
 if(!el){el=document.createElement('div');el.className='dmBackdrop';el.id='dm-modal';
 el.innerHTML='<div class="dmPanel" role="dialog" aria-modal="true" aria-label="Private messages">'+
  '<div class="dmPanelHead" id="dm-modal-head"></div><div class="dmList" id="dm-modal-content"></div>'+
  '<div id="dm-modal-compose"></div></div>';
 document.body.appendChild(el)}
 return el;
}
function dmOpenContacts(){
 dmPeer=null;dmThread=null;dmThreadVersion='';dmSearchText='';
 dmRenderContacts();
}
function dmRenderContacts(){
 const el=dmModal(),head=el.querySelector('#dm-modal-head'),body=el.querySelector('#dm-modal-content'),compose=el.querySelector('#dm-modal-compose');
 head.innerHTML='<h2>✉️ Private messages</h2><button class="dmClose" data-dm-action="close">✕</button>';
 compose.innerHTML='';
 if(dmInbox?.is_owner){
  body.innerHTML='<p class="dmDescription">Choose a player. Messages are private to you and that person.</p>'+
   '<input class="dmFind" id="dm-find" type="search" placeholder="Find a player (e.g. Jack or Connail)…" value="'+dmEsc(dmSearchText)+'">'+
   '<div id="dm-contacts"></div>';
  dmDrawRoster();
  body.querySelector('#dm-find')?.focus();
 }else{
  body.innerHTML='<p class="dmDescription">Your conversation with James is private.</p>'+
   '<button class="dmContact" data-dm-open="'+dmEsc(dmInbox?.owner_id||'')+'"><strong>💬 Message James</strong><span>→</span></button>';
 }
}
function dmDrawRoster(){
 const list=document.getElementById('dm-contacts');if(!list)return;
 const candidates=dmArr(dmInbox?.roster);
 const q=dmSearchText.toLowerCase();
 const roster=candidates.filter(p=>(dmName(p)+' '+(p.team_name||'')).toLowerCase().includes(q));
 const threadMap=new Map(dmArr(dmInbox?.threads).map(t=>[t.user_id,t]));
 roster.sort((a,b)=>{
  const at=threadMap.get(a.user_id),bt=threadMap.get(b.user_id);
  if(Boolean(at)!==Boolean(bt))return at?-1:1;
  return dmName(a).localeCompare(dmName(b));
 });
 list.innerHTML=roster.map(p=>{
  const t=threadMap.get(p.user_id);
  return '<button class="dmContact" data-dm-open="'+dmEsc(p.user_id)+'"><span><strong>'+
   dmEsc(p.badge||'⚽')+' '+dmEsc(dmName(p))+'</strong><small>'+
   dmEsc(t?String(t.last_body||'').slice(0,90):(p.team_name||'Start a new conversation'))+
   '</small></span><span>'+(!t?'→':t.unread?'<b class="dmUnread">'+Number(t.unread)+'</b>':'→')+'</span></button>';
 }).join('')||'<p class="dmDescription">No matching players.</p>';
}
async function dmOpenPeer(peerId){
 const c=await dmContext();if(!c||!peerId)return;
 const isOwner=Boolean(dmInbox?.is_owner);
 if(!isOwner&&peerId!==dmInbox?.owner_id)return;
 if(isOwner&&!dmArr(dmInbox?.roster).some(x=>x.user_id===peerId))return;
 dmPeer=peerId;
 const el=dmModal();
 el.querySelector('#dm-modal-head').innerHTML='<button class="dmClose" data-dm-action="back">←</button><h2>💬 Conversation</h2><button class="dmClose" data-dm-action="close">✕</button>';
 el.querySelector('#dm-modal-content').innerHTML='<p class="dmDescription">Loading messages…</p>';
 el.querySelector('#dm-modal-compose').innerHTML='';
 await dmRefreshThread(true);
}
async function dmRefreshThread(force=false){
 if(!dmPeer||!document.getElementById('dm-modal'))return;
 const c=await dmContext();if(!c)return;
 const peer=dmPeer;
 const {data,error}=await dmSb.rpc('get_my_league_direct_thread',{p_league_id:c.leagueId,p_other_user_id:peer,p_limit:150});
 if(error){dmShowError(error.message);return}
 if(peer!==dmPeer)return;
 dmThread=data||{};
 await dmSb.rpc('mark_my_league_direct_thread_read',{p_league_id:c.leagueId,p_other_user_id:peer});
 const el=document.getElementById('dm-modal');if(!el)return;
 const title=el.querySelector('#dm-modal-head h2');
 if(title)title.textContent='💬 '+String(dmThread.peer_name||'Player');
 const messages=dmArr(dmThread.messages),version=messages.map(x=>x.id).join('|');
 const body=el.querySelector('#dm-modal-content');
 if(body&&version!==dmThreadVersion){
  body.className='dmBubbles';
  body.innerHTML=messages.length?messages.map(m=>
   '<div class="dmBubble '+(m.mine?'mine':'')+'">'+dmEsc(m.body)+
    '<div class="dmStamp">'+dmTime(m.created_at)+(m.mine&&m.read_at?' · Read':'')+'</div></div>'
  ).join(''):'<p class="dmDescription">No messages yet. Say hello!</p>';
  body.scrollTop=body.scrollHeight;
  dmThreadVersion=version;
 }
 const compose=el.querySelector('#dm-modal-compose');
 if(compose&&!compose.querySelector('#dm-compose')){
  compose.innerHTML='<div id="dm-error"></div><div class="dmCompose">'+
  '<textarea class="dmText" id="dm-compose" rows="2" maxlength="1500" placeholder="Write a private message…"></textarea>'+
  '<button class="dmBtn" data-dm-action="send">Send</button></div>'+
  '<p class="dmDescription">🔒 Only you and '+dmEsc(dmThread.peer_name||'this player')+' can see these messages.</p>';
 }
 await dmLoad(true);
}
function dmShowError(text){
 const el=document.getElementById('dm-error');
 if(el)el.innerHTML='<div class="dmError">'+dmEsc(text)+'</div>';
 else alert(text);
}
async function dmSend(){
 if(dmSending||!dmPeer)return;
 const input=document.getElementById('dm-compose'),text=input?.value.trim()||'';
 if(!text||text.length>1500){dmShowError('Enter a message up to 1,500 characters.');return}
 const c=await dmContext();if(!c)return;
 const btn=document.querySelector('#dm-modal [data-dm-action="send"]');
 dmSending=true;if(btn){btn.disabled=true;btn.textContent='Sending…'}
 const peer=dmPeer;
 try{
  const {error}=await dmSb.rpc('send_league_direct_message',{p_league_id:c.leagueId,p_recipient_user_id:peer,p_body:text});
  if(error)throw error;
  if(input)input.value='';
  dmThreadVersion='';await dmRefreshThread(true);
 }catch(e){dmShowError(e.message||'Message could not be sent')}
 finally{dmSending=false;if(btn){btn.disabled=false;btn.textContent='Send'}}
}
async function dmHandleClick(e){
 const b=e.target.closest?.('[data-dm-action], [data-dm-open]');if(!b)return;
 e.preventDefault();
 if(b.dataset.dmOpen){await dmOpenPeer(b.dataset.dmOpen);return}
 const action=b.dataset.dmAction;
 if(action==='close'){document.getElementById('dm-modal')?.remove();dmPeer=null;return}
 if(action==='back'){dmOpenContacts();return}
 if(action==='inbox'){await dmLoad(true);dmOpenContacts();if(!dmInbox?.is_owner&&dmInbox?.owner_id)await dmOpenPeer(dmInbox.owner_id);return}
 if(action==='send')await dmSend();
}
function dmOnInput(e){
 if(e.target?.id==='dm-find'){dmSearchText=e.target.value;dmDrawRoster()}
}
dmCss();
document.addEventListener('click',e=>{dmHandleClick(e).catch(err=>console.warn('Direct messages:',err))});
document.addEventListener('input',dmOnInput);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('dm-modal')){document.getElementById('dm-modal').remove();dmPeer=null}});
const main=document.getElementById('main');
if(main)new MutationObserver(()=>{clearTimeout(dmTimer);dmTimer=setTimeout(()=>{if(dmInbox)dmRenderHome();else dmLoad(false)},220)}).observe(main,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){dmLoad(true);if(dmPeer)dmRefreshThread(true)}});
window.addEventListener('focus',()=>{dmLoad(true);if(dmPeer)dmRefreshThread(true)});
dmSb.auth.onAuthStateChange(()=>{dmCtx=null;dmUserId=null;dmInbox=null;dmUpdatedAt=0;setTimeout(()=>dmLoad(true),450)});
setInterval(async()=>{if(dmHomeActive()||document.getElementById('dm-modal')){await dmLoad(true);if(dmPeer)await dmRefreshThread(true)}},15000);
setTimeout(()=>dmLoad(true),1100);
