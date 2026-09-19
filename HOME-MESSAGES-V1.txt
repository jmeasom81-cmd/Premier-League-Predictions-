// HOME MESSAGES V1
// Private player messages + owner reply inbox + 7-day league broadcasts.
// Mirrors Daily Recap and Matchweek Review when copied/shared.
// Prediction reminder WhatsApp messages are deliberately excluded.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const hmSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let hmCtx=null;
let hmMessages=[];
let hmReplies=[];
let hmLoadedAt=0;
let hmBusy=false;
let hmTimer=null;

const hmEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function hmCss(){
  if(document.getElementById('hm-v1-css'))return;
  const s=document.createElement('style');
  s.id='hm-v1-css';
  s.textContent=`
    .hmCard{border-color:#dcd3ef!important;background:linear-gradient(145deg,#fff,#fbf9ff)!important}
    .hmHead{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:8px}
    .hmHead h3{margin:0;color:#241153;font-size:15px}
    .hmHead span{font-size:8px;color:#8a8493;text-align:right}
    .hmMsg{
      border:1px solid #e8e3f1;border-radius:14px;padding:11px;margin-top:8px;
      background:#fff
    }
    .hmMsg.private{
      border-color:#d8c8f2;background:linear-gradient(135deg,#f8f4ff,#fff)
    }
    .hmTag{
      display:inline-flex;border-radius:999px;padding:4px 7px;font-size:7px;
      font-weight:950;text-transform:uppercase;letter-spacing:.06em;
      background:#eee8fa;color:#5d399a
    }
    .hmTag.broadcast{background:#e7f6ff;color:#176b96}
    .hmTitle{font-size:12px;font-weight:950;color:#2f2247;margin-top:6px}
    .hmBody{
      white-space:pre-wrap;font-size:9.5px;line-height:1.48;color:#5c5664;margin-top:5px
    }
    .hmReplyBox{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;margin-top:9px}
    .hmReplyInput{
      min-width:0;border:1px solid #d9d3e4;border-radius:10px;padding:9px 10px;
      background:#fff;font-size:10px;color:#2b2633
    }
    .hmReplyBtn{
      border:0;border-radius:10px;background:#5b34a4;color:#fff;
      padding:9px 10px;font-size:9px;font-weight:950
    }
    .hmReplyBtn:disabled{opacity:.55}
    .hmPrivacy{font-size:7.5px;color:#8b8492;margin-top:5px}
    .hmSent{
      margin-top:8px;border-radius:10px;padding:8px 9px;background:#e9faf4;
      color:#08775c;font-size:8.5px;font-weight:900
    }
    .hmLong details{margin-top:6px}
    .hmLong summary{font-size:8.5px;color:#5b34a4;font-weight:950;cursor:pointer}
    .hmLong details .hmBody{margin-top:7px}

    .hmOwnerCard{border-color:#bfe5d6!important;background:linear-gradient(145deg,#f1fff9,#fff)!important}
    .hmReplyRow{border-top:1px solid #e7eee9;padding:9px 0}
    .hmReplyRow:first-of-type{border-top:0}
    .hmReplyTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .hmReplyName{font-size:10px;font-weight:950;color:#243b34}
    .hmReplyName small{display:block;font-size:7px;color:#829188;margin-top:1px}
    .hmNew{
      border-radius:999px;padding:4px 6px;background:#dff9f1;color:#08775c;
      font-size:7px;font-weight:950;text-transform:uppercase
    }
    .hmReplyText{
      margin-top:6px;border-radius:10px;background:#fff;border:1px solid #dfe9e4;
      padding:8px 9px;font-size:10px;line-height:1.4;color:#343c39;word-break:break-word
    }
    .hmReplyActions{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
    .hmMiniBtn{
      border:0;border-radius:8px;padding:6px 8px;background:#edf3f0;color:#31594c;
      font-size:8px;font-weight:950
    }
    .hmMiniBtn.read{background:#e4f7ef;color:#08775c}
    .hmToast{
      position:fixed;left:50%;bottom:92px;transform:translateX(-50%);
      z-index:10050;background:#241153;color:#fff;border-radius:12px;
      padding:9px 12px;font-size:9px;font-weight:900;
      box-shadow:0 8px 24px rgba(0,0,0,.18);max-width:86vw;text-align:center
    }
  `;
  document.head.appendChild(s);
}

function hmHomeActive(){
  return !!document.querySelector('#nav button[data-v="home"].active');
}

async function hmContext(){
  if(hmCtx)return hmCtx;
  const {data:{session}}=await hmSb.auth.getSession();
  if(!session)return null;

  const {data,error}=await hmSb.from('league_members')
    .select('league_id,status,role,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error)throw error;
  if(!data?.length)return null;

  hmCtx={
    userId:session.user.id,
    leagueId:data[0].league_id,
    role:data[0].role,
    isAdmin:data[0].role==='admin'
  };
  return hmCtx;
}

async function hmLoad(force=false){
  const c=await hmContext();
  if(!c)return;
  if(!force && Date.now()-hmLoadedAt<15000)return;

  const calls=[
    hmSb.rpc('get_my_home_messages',{p_league_id:c.leagueId})
  ];
  if(c.isAdmin){
    calls.push(hmSb.rpc('get_owner_home_message_replies',{p_league_id:c.leagueId}));
  }

  const settled=await Promise.allSettled(calls);

  const m=settled[0];
  if(m.status==='fulfilled'&&!m.value.error)hmMessages=Array.isArray(m.value.data)?m.value.data:[];
  else if(m.status==='fulfilled'&&m.value.error)throw m.value.error;

  if(c.isAdmin&&settled[1]){
    const r=settled[1];
    if(r.status==='fulfilled'&&!r.value.error)hmReplies=Array.isArray(r.value.data)?r.value.data:[];
  }else hmReplies=[];

  hmLoadedAt=Date.now();
}

function hmMessageBody(m){
  const body=String(m.body||'');
  if(body.length<=320)return `<div class="hmBody">${hmEsc(body)}</div>`;
  const preview=body.slice(0,250).trimEnd()+'…';
  return `<div class="hmLong">
    <div class="hmBody">${hmEsc(preview)}</div>
    <details><summary>Read full message</summary><div class="hmBody">${hmEsc(body)}</div></details>
  </div>`;
}

function hmMessageHtml(m){
  const isPrivate=!!m.private;
  const reply=m.my_reply;
  const source=m.source_type||'';
  const label=isPrivate?'Private message from James':
    source==='weekly_review'?'Matchweek review':
    source==='daily_recap'?'Daily recap':'League update';

  let replyHtml='';
  if(m.reply_enabled){
    if(reply){
      replyHtml=`<div class="hmSent">✓ Reply sent to James</div>`;
    }else{
      replyHtml=`<div class="hmReplyBox">
        <input class="hmReplyInput" type="tel" autocomplete="tel"
          placeholder="Enter your mobile number / reply"
          data-hm-input="${hmEsc(m.id)}">
        <button class="hmReplyBtn" data-hm-reply="${hmEsc(m.id)}">Send to James</button>
      </div>
      <div class="hmPrivacy">🔒 Your reply is only visible to James.</div>`;
    }
  }

  return `<div class="hmMsg ${isPrivate?'private':''}" data-hm-message="${hmEsc(m.id)}">
    <span class="hmTag ${isPrivate?'':'broadcast'}">${hmEsc(label)}</span>
    <div class="hmTitle">${hmEsc(m.title)}</div>
    ${hmMessageBody(m)}
    ${replyHtml}
  </div>`;
}

function hmMessagesCard(){
  if(!hmMessages.length)return '';
  return `<div class="hfCard hmCard">
    <div class="hmHead"><h3>📬 Messages</h3><span>${hmMessages.length===1?'1 active message':`${hmMessages.length} active messages`}</span></div>
    ${hmMessages.map(hmMessageHtml).join('')}
  </div>`;
}

function hmTime(v){
  try{
    return new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/London',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'
    }).format(new Date(v));
  }catch{return ''}
}

function hmRepliesCard(){
  if(!hmReplies.length)return '';
  return `<div class="hfCard hmOwnerCard">
    <div class="hmHead"><h3>📥 Replies to you</h3><span>${hmReplies.filter(x=>!x.read).length} new</span></div>
    ${hmReplies.map(r=>`<div class="hmReplyRow" data-hm-reply-row="${hmEsc(r.reply_id)}">
      <div class="hmReplyTop">
        <div class="hmReplyName">${hmEsc(r.badge||'⚽')} ${hmEsc(r.display_name||r.team_name||'Player')}
          <small>${hmEsc(r.team_name||'')} · ${hmEsc(hmTime(r.updated_at||r.created_at))}</small>
        </div>
        ${r.read?'':'<span class="hmNew">New</span>'}
      </div>
      <div class="hmReplyText">${hmEsc(r.reply_text)}</div>
      <div class="hmReplyActions">
        <button class="hmMiniBtn" data-hm-copy-reply="${hmEsc(r.reply_id)}">Copy reply</button>
        ${r.read?'':`<button class="hmMiniBtn read" data-hm-read="${hmEsc(r.reply_id)}">✓ Mark read</button>`}
      </div>
    </div>`).join('')}
  </div>`;
}

function hmInject(){
  if(!hmHomeActive())return;
  const host=document.querySelector('.hfHost');
  if(!host)return;

  host.querySelector('.hmCard')?.remove();
  host.querySelector('.hmOwnerCard')?.remove();

  const anchor=host.querySelector('.hfPrediction')?.closest('.hfCard') ||
               host.querySelector('.forecastHomeCard') ||
               host.querySelector('.hfLiveSlot');

  const wrap=document.createElement('div');
  wrap.innerHTML=hmMessagesCard()+hmRepliesCard();
  const cards=[...wrap.children];

  let after=anchor;
  for(const card of cards){
    if(after){
      after.insertAdjacentElement('afterend',card);
      after=card;
    }else{
      host.prepend(card);
      after=card;
    }
  }

  hmWire();
}

function hmToast(text){
  document.querySelector('.hmToast')?.remove();
  const t=document.createElement('div');
  t.className='hmToast';
  t.textContent=text;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2200);
}

async function hmSubmitReply(messageId){
  const input=document.querySelector(`[data-hm-input="${CSS.escape(messageId)}"]`);
  const btn=document.querySelector(`[data-hm-reply="${CSS.escape(messageId)}"]`);
  const text=input?.value?.trim()||'';

  if(text.length<3){
    hmToast('Please enter your mobile number or reply.');
    input?.focus();
    return;
  }

  if(btn){btn.disabled=true;btn.textContent='Sending…'}
  try{
    const {error}=await hmSb.rpc('reply_home_message',{
      p_message_id:messageId,
      p_reply_text:text
    });
    if(error)throw error;
    hmLoadedAt=0;
    await hmLoad(true);
    hmInject();
    hmToast('✓ Sent privately to James');
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Send to James'}
    hmToast(e.message||'Could not send reply');
  }
}

async function hmMarkRead(replyId){
  try{
    const {error}=await hmSb.rpc('mark_home_message_reply_read',{p_reply_id:replyId});
    if(error)throw error;
    hmLoadedAt=0;
    await hmLoad(true);
    hmInject();
  }catch(e){
    hmToast(e.message||'Could not update reply');
  }
}

async function hmCopyText(text){
  try{await navigator.clipboard.writeText(text)}
  catch{
    const t=document.createElement('textarea');
    t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();
  }
}

function hmWire(){
  document.querySelectorAll('[data-hm-reply]').forEach(btn=>{
    if(btn.dataset.hmWired)return;
    btn.dataset.hmWired='1';
    btn.addEventListener('click',()=>hmSubmitReply(btn.dataset.hmReply));
  });

  document.querySelectorAll('[data-hm-read]').forEach(btn=>{
    if(btn.dataset.hmWired)return;
    btn.dataset.hmWired='1';
    btn.addEventListener('click',()=>hmMarkRead(btn.dataset.hmRead));
  });

  document.querySelectorAll('[data-hm-copy-reply]').forEach(btn=>{
    if(btn.dataset.hmWired)return;
    btn.dataset.hmWired='1';
    btn.addEventListener('click',async()=>{
      const row=btn.closest('.hmReplyRow');
      const text=row?.querySelector('.hmReplyText')?.textContent||'';
      await hmCopyText(text);
      hmToast('✓ Reply copied');
    });
  });
}

function hmCleanWhatsApp(text){
  let out=String(text||'').trim();
  out=out.replace(/\*/g,'');
  out=out.replace(/https:\/\/jmeasom81-cmd\.github\.io\/Premier-League-Predictions-\/?/gi,'');
  out=out.replace(/\n{3,}/g,'\n\n').trim();
  return out;
}

function hmSplitAnnouncement(text,fallbackTitle){
  const clean=hmCleanWhatsApp(text);
  const lines=clean.split('\n');
  const first=lines.findIndex(x=>x.trim());
  if(first<0)return {title:fallbackTitle,body:''};

  let title=lines[first].trim();
  let rest=[...lines.slice(0,first),...lines.slice(first+1)].join('\n').trim();

  if(title.length>110 || !/Premier League|Predictions|Review|Recap/i.test(title)){
    rest=clean;
    title=fallbackTitle;
  }
  return {title,body:rest||clean};
}

async function hmPublishBroadcast(rawText,sourceType,fallbackTitle){
  const c=await hmContext();
  if(!c?.isAdmin)return;

  const {title,body}=hmSplitAnnouncement(rawText,fallbackTitle);
  if(!body||body.length<5)return;

  const {error}=await hmSb.rpc('publish_owner_home_announcement',{
    p_league_id:c.leagueId,
    p_title:title,
    p_body:body,
    p_source_type:sourceType
  });
  if(error)throw error;

  hmLoadedAt=0;
  hmToast('✓ Also posted to everyone’s Home page for 7 days');
}

window.publishPLPHomeAnnouncement=async function(title,body,sourceType='owner_broadcast'){
  const c=await hmContext();
  if(!c?.isAdmin)throw new Error('League owner only');
  const {error}=await hmSb.rpc('publish_owner_home_announcement',{
    p_league_id:c.leagueId,
    p_title:title,
    p_body:body,
    p_source_type:sourceType
  });
  if(error)throw error;
  hmLoadedAt=0;
  return true;
};

function hmHandleOwnerShare(target){
  // Matchweek Review: general league message -> mirror to Home.
  if(target.closest?.('.wrOverlay [data-wr-copy], .wrOverlay [data-wr-whatsapp]')){
    const text=document.querySelector('.wrOverlay .waText')?.value||'';
    setTimeout(()=>hmPublishBroadcast(text,'weekly_review','📰 Matchweek review')
      .catch(e=>console.warn('Home broadcast:',e)),30);
    return;
  }

  // Daily Recap: general league message -> mirror to Home.
  if(target.closest?.('.drOverlay [data-dr-copy], .drOverlay [data-dr-whatsapp]')){
    const text=document.querySelector('.drOverlay .drText')?.value||'';
    setTimeout(()=>hmPublishBroadcast(text,'daily_recap','⚽ Daily league recap')
      .catch(e=>console.warn('Home broadcast:',e)),30);
    return;
  }

  // Deliberately DO NOT hook:
  // .waOverlay [data-wa-copy] / [data-wa-whatsapp]
  // .twr* individual prediction reminders
}

async function hmRefresh(force=false){
  if(hmBusy)return;
  hmBusy=true;
  try{
    await hmLoad(force);
    hmInject();
  }catch(e){
    console.warn('Home messages:',e);
  }finally{
    hmBusy=false;
  }
}

function hmSchedule(){
  clearTimeout(hmTimer);
  hmTimer=setTimeout(()=>hmRefresh(false),120);
}

hmCss();

document.addEventListener('click',e=>{
  hmHandleOwnerShare(e.target);
  if(e.target.closest?.('#nav button[data-v]'))setTimeout(hmSchedule,120);
},true);

const hmMain=document.getElementById('main');
if(hmMain)new MutationObserver(hmSchedule).observe(hmMain,{childList:true,subtree:true});

const hmNav=document.getElementById('nav');
if(hmNav)new MutationObserver(hmSchedule).observe(hmNav,{
  childList:true,subtree:true,attributes:true,attributeFilter:['class','style']
});

window.addEventListener('focus',()=>{
  hmLoadedAt=0;
  hmSchedule();
});

setInterval(()=>{
  if(hmHomeActive()){
    hmLoadedAt=0;
    hmRefresh(true);
  }
},20000);

setTimeout(()=>hmRefresh(true),800);
