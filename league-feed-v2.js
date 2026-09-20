// LEAGUE FEED V2
// Automatic matchday/matchweek stories, reactions, owner sharing and engagement.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const lfSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let lfCtx=null;
let lfMessages=[];
let lfReplies=[];
let lfLoadedAt=0;
let lfEnsureAt=0;
let lfBusy=false;
let lfTimer=null;
let lfViewObserver=null;
const lfViewed=new Set();
let lfEngLoadedAt=0;
let lfEngRows=[];
let lfEngTimer=null;

const lfEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function lfCss(){
  if(document.getElementById('lf-v1-css'))return;
  const s=document.createElement('style');
  s.id='lf-v1-css';
  s.textContent=`
    .hfLeagueFeedSlot:empty{display:none}
    .lfCard{
      border:1px solid #ded7ee!important;
      background:linear-gradient(145deg,#fff,#fbf9ff)!important
    }
    .lfHead{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:5px}
    .lfHead h3{margin:0;color:#241153;font-size:15px}
    .lfHead span{font-size:8px;color:#8a8493;text-align:right}
    .lfStory{border:1px solid #e9e4f0;border-radius:14px;padding:10px;margin-top:8px;background:#fff}
    .lfStory.private{border-color:#d8c8f2;background:linear-gradient(135deg,#f8f4ff,#fff)}
    .lfTop{display:flex;justify-content:space-between;gap:8px;align-items:center}
    .lfTag{
      display:inline-flex;border-radius:999px;padding:4px 7px;font-size:7px;
      font-weight:950;text-transform:uppercase;letter-spacing:.06em;
      background:#e7f6ff;color:#176b96
    }
    .lfStory.private .lfTag{background:#eee8fa;color:#5d399a}
    .lfDate{font-size:7.5px;color:#938d9b;white-space:nowrap}
    .lfTitle{font-size:11.5px;font-weight:950;color:#2f2247;margin-top:6px;line-height:1.3}
    .lfBody{white-space:pre-wrap;font-size:9px;line-height:1.46;color:#5c5664;margin-top:5px}
    .lfPreview>.lfBody{
      display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden
    }
    .lfPreview details{margin-top:5px}
    .lfPreview summary{font-size:8.2px;color:#5b34a4;font-weight:950;cursor:pointer}
    .lfPreview details .lfBody{margin-top:6px}
    .lfActions{
      display:flex;justify-content:space-between;align-items:center;
      gap:7px;flex-wrap:wrap;margin-top:8px
    }
    .lfReactions{display:flex;gap:4px;flex-wrap:wrap}
    .lfReact{
      border:1px solid #e6e0ed;background:#f8f6fb;border-radius:999px;
      padding:5px 7px;font-size:9px;line-height:1;font-weight:900;color:#514a5d
    }
    .lfReact.mine{background:#eee7ff;border-color:#cfc0ee;color:#4e2c91}
    .lfReact em{font-style:normal;font-size:7px;margin-left:2px;color:#7e7788}
    .lfShare{
      border:0;border-radius:9px;background:#e8f8ef;color:#16734d;
      padding:6px 8px;font-size:8px;font-weight:950
    }
    .lfDelete{
      border:0;border-radius:9px;background:#fff0f1;color:#a93445;
      padding:6px 8px;font-size:8px;font-weight:950
    }
    .lfOlder{margin-top:8px;border-top:1px solid #ece8f2;padding-top:7px}
    .lfOlder>summary{font-size:8.5px;font-weight:950;color:#5b34a4;cursor:pointer}
    .lfReplyBox{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;margin-top:9px}
    .lfReplyInput{
      min-width:0;border:1px solid #d9d3e4;border-radius:10px;padding:9px 10px;
      background:#fff;font-size:10px;color:#2b2633
    }
    .lfReplyBtn{
      border:0;border-radius:10px;background:#5b34a4;color:#fff;
      padding:9px 10px;font-size:9px;font-weight:950
    }
    .lfPrivacy{font-size:7.5px;color:#8b8492;margin-top:5px}
    .lfSent{
      margin-top:8px;border-radius:10px;padding:8px 9px;
      background:#e9faf4;color:#08775c;font-size:8.5px;font-weight:900
    }
    .lfOwnerCard{
      border:1px solid #bfe5d6!important;
      background:linear-gradient(145deg,#f1fff9,#fff)!important
    }
    .lfReply{border-top:1px solid #e7eee9;padding:9px 0}
    .lfReply:first-of-type{border-top:0}
    .lfReplyTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .lfReplyName{font-size:10px;font-weight:950;color:#243b34}
    .lfReplyName small{display:block;font-size:7px;color:#829188;margin-top:1px}
    .lfNew{
      border-radius:999px;padding:4px 6px;background:#dff9f1;color:#08775c;
      font-size:7px;font-weight:950;text-transform:uppercase
    }
    .lfReplyText{
      margin-top:6px;border-radius:10px;background:#fff;border:1px solid #dfe9e4;
      padding:8px 9px;font-size:10px;line-height:1.4;color:#343c39;word-break:break-word
    }
    .lfReplyBtns{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
    .lfMini{
      border:0;border-radius:8px;padding:6px 8px;background:#edf3f0;
      color:#31594c;font-size:8px;font-weight:950
    }
    .lfToast{
      position:fixed;left:50%;bottom:92px;transform:translateX(-50%);
      z-index:10050;background:#241153;color:#fff;border-radius:12px;
      padding:9px 12px;font-size:9px;font-weight:900;
      box-shadow:0 8px 24px rgba(0,0,0,.18);max-width:86vw;text-align:center
    }

    .lfEngPanel .engPanelHead{margin-bottom:4px}
    .lfEngStory{padding:9px 0;border-top:1px solid #f0eff4}
    .lfEngStory:first-of-type{border-top:0}
    .lfEngTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .lfEngTitle{font-size:9.5px;font-weight:950;color:#302846;min-width:0}
    .lfEngTitle small{display:block;font-size:7px;color:#8a8492;margin-top:2px;font-weight:800}
    .lfEngCounts{text-align:right;font-size:8px;color:#655d70;white-space:nowrap}
    .lfViewers{margin-top:5px}
    .lfViewers summary{font-size:8px;color:#5b34a4;font-weight:950;cursor:pointer}
    .lfViewer{
      display:flex;justify-content:space-between;gap:7px;padding:5px 0;
      font-size:8px;border-top:1px solid #f2f0f5
    }
    .lfViewer span:last-child{color:#8b8592;white-space:nowrap}

    /* Old Home Messages module is no longer loaded, but hide any cached old cards. */
    .hfHost>.hmCard,.hfHost>.hmOwnerCard{display:none!important}
  `;
  document.head.appendChild(s);
}

function lfHomeActive(){
  return !!document.querySelector('#nav button[data-v="home"].active');
}

async function lfContext(){
  if(lfCtx)return lfCtx;
  const {data:{session}}=await lfSb.auth.getSession();
  if(!session)return null;
  const {data,error}=await lfSb.from('league_members')
    .select('league_id,role,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);
  if(error)throw error;
  if(!data?.length)return null;
  lfCtx={
    userId:session.user.id,
    leagueId:data[0].league_id,
    isAdmin:data[0].role==='admin'
  };
  return lfCtx;
}

async function lfEnsure(){
  const c=await lfContext();
  if(!c||Date.now()-lfEnsureAt<45000)return;
  lfEnsureAt=Date.now();
  const {error}=await lfSb.rpc('ensure_auto_league_feed',{p_league_id:c.leagueId});
  if(error)console.warn('League Feed auto story check:',error);
}

async function lfLoad(force=false){
  const c=await lfContext();
  if(!c)return;
  if(!force&&Date.now()-lfLoadedAt<15000)return;
  await lfEnsure();

  const calls=[lfSb.rpc('get_my_home_messages',{p_league_id:c.leagueId})];
  if(c.isAdmin){
    calls.push(lfSb.rpc('get_owner_home_message_replies',{p_league_id:c.leagueId}));
  }
  const settled=await Promise.allSettled(calls);
  const a=settled[0];
  if(a.status==='fulfilled'&&!a.value.error){
    lfMessages=Array.isArray(a.value.data)?a.value.data:[];
  }else if(a.status==='fulfilled'&&a.value.error){
    throw a.value.error;
  }
  if(c.isAdmin&&settled[1]?.status==='fulfilled'&&!settled[1].value.error){
    lfReplies=Array.isArray(settled[1].value.data)?settled[1].value.data:[];
  }else{
    lfReplies=[];
  }
  lfLoadedAt=Date.now();
}

function lfDate(v){
  try{
    return new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short'
    }).format(new Date(v));
  }catch{return ''}
}

function lfDateTime(v){
  try{
    return new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/London',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'
    }).format(new Date(v));
  }catch{return ''}
}

function lfLabel(m){
  if(m.private)return 'Private message from James';
  if(m.source_type==='auto_matchweek'||m.source_type==='weekly_review')return 'Matchweek wrap';
  if(m.source_type==='auto_matchday'||m.source_type==='daily_recap')return 'Matchday recap';
  return 'League update';
}

function lfBody(m){
  const body=String(m.body||'');
  if(body.length<=240)return '<div class="lfBody">'+lfEsc(body)+'</div>';
  const p=body.slice(0,210).trimEnd()+'…';
  return '<div class="lfPreview"><div class="lfBody">'+lfEsc(p)+'</div>'+
    '<details><summary>Read full update</summary><div class="lfBody">'+lfEsc(body)+'</div></details></div>';
}

function lfReactionButtons(m){
  const counts=m.reaction_counts||{};
  return ['👍','👏','😂','😭','🔥'].map(r=>{
    const n=Number(counts[r]||0);
    return '<button type="button" class="lfReact '+(m.my_reaction===r?'mine':'')+
      '" data-lf-react="'+r+'" data-lf-id="'+lfEsc(m.id)+'">'+r+
      (n?' <em>'+n+'</em>':'')+'</button>';
  }).join('');
}

function lfStory(m){
  let reply='';
  if(m.reply_enabled){
    reply=m.my_reply
      ?'<div class="lfSent">✓ Reply sent to James</div>'
      :'<div class="lfReplyBox"><input class="lfReplyInput" type="tel" autocomplete="tel" placeholder="Enter your mobile number / reply" data-lf-input="'+lfEsc(m.id)+'">'+
       '<button class="lfReplyBtn" data-lf-reply="'+lfEsc(m.id)+'">Send to James</button></div>'+
       '<div class="lfPrivacy">🔒 Your reply is only visible to James.</div>';
  }

  const ownerBtns=lfCtx?.isAdmin
    ?((m.private?'':'<button type="button" class="lfShare" data-lf-share="'+lfEsc(m.id)+'">WhatsApp</button>')+
      '<button type="button" class="lfDelete" data-lf-delete="'+lfEsc(m.id)+'">Delete</button>')
    :'';

  const actions=(!m.private||ownerBtns)
    ?'<div class="lfActions"><div class="lfReactions">'+(m.private?'':lfReactionButtons(m))+'</div><div>'+ownerBtns+'</div></div>'
    :'';

  return '<article class="lfStory '+(m.private?'private':'')+'" data-lf-story="'+lfEsc(m.id)+'" data-lf-public="'+(m.private?'0':'1')+'">'+
    '<div class="lfTop"><span class="lfTag">'+lfEsc(lfLabel(m))+'</span><span class="lfDate">'+lfEsc(lfDate(m.created_at))+'</span></div>'+
    '<div class="lfTitle">'+lfEsc(m.title)+'</div>'+lfBody(m)+reply+actions+'</article>';
}

function lfFeedCard(){
  if(!lfMessages.length)return '';
  const priv=lfMessages.filter(x=>x.private);
  const pub=lfMessages.filter(x=>!x.private);
  const latest=pub.slice(0,2);
  const older=pub.slice(2);
  return '<div class="hfCard lfCard">'+
    '<div class="lfHead"><h3>🗞️ League Feed</h3><span>'+(pub.length?pub.length+' update'+(pub.length===1?'':'s')+' · 7 days':'Private messages')+'</span></div>'+
    priv.map(lfStory).join('')+
    latest.map(lfStory).join('')+
    (older.length?'<details class="lfOlder"><summary>Earlier updates ('+older.length+')</summary>'+older.map(lfStory).join('')+'</details>':'')+
    '</div>';
}

function lfRepliesCard(){
  if(!lfCtx?.isAdmin||!lfReplies.length)return '';
  return '<div class="hfCard lfOwnerCard"><div class="lfHead"><h3>📥 Replies to you</h3><span>'+
    lfReplies.filter(x=>!x.read).length+' new</span></div>'+
    lfReplies.map(r=>'<div class="lfReply">'+
      '<div class="lfReplyTop"><div class="lfReplyName">'+lfEsc(r.badge||'⚽')+' '+lfEsc(r.display_name||r.team_name||'Player')+
      '<small>'+lfEsc(r.team_name||'')+' · '+lfEsc(lfDateTime(r.updated_at||r.created_at))+'</small></div>'+
      (r.read?'':'<span class="lfNew">New</span>')+'</div>'+
      '<div class="lfReplyText">'+lfEsc(r.reply_text)+'</div>'+
      '<div class="lfReplyBtns"><button class="lfMini" data-lf-copy="'+lfEsc(r.reply_id)+'">Copy reply</button>'+
      (r.read?'':'<button class="lfMini" data-lf-read="'+lfEsc(r.reply_id)+'">✓ Mark read</button>')+
      '</div></div>').join('')+'</div>';
}

function lfInject(){
  if(!lfHomeActive())return;
  const host=document.querySelector('.hfHost');
  if(!host)return;

  let slot=host.querySelector('.hfLeagueFeedSlot');
  if(!slot){
    slot=document.createElement('div');
    slot.className='hfLeagueFeedSlot';
    const pred=host.querySelector('.hfPrediction')?.closest('.hfCard');
    if(pred)pred.insertAdjacentElement('afterend',slot);
    else host.prepend(slot);
  }

  const signature=JSON.stringify({
    messages:lfMessages.map(m=>({
      id:m.id,
      title:m.title,
      body:m.body,
      private:m.private,
      source_type:m.source_type,
      my_reaction:m.my_reaction,
      reaction_counts:m.reaction_counts,
      my_reply:m.my_reply,
      reply_enabled:m.reply_enabled,
      active_until:m.active_until
    })),
    replies:lfReplies.map(r=>({
      reply_id:r.reply_id,
      reply_text:r.reply_text,
      read:r.read,
      updated_at:r.updated_at
    }))
  });

  // Background refreshes must not rebuild the feed if nothing meaningful
  // changed. This keeps expanded stories open and stops Home jumping.
  if(slot.dataset.lfSignature===signature && slot.children.length){
    lfObserve();
    return;
  }

  const scrollY=window.scrollY;
  const openStories=[...slot.querySelectorAll('.lfStory details[open]')]
    .map(d=>d.closest('.lfStory')?.dataset.lfStory)
    .filter(Boolean);
  const olderOpen=!!slot.querySelector('.lfOlder[open]');

  slot.innerHTML=lfFeedCard()+lfRepliesCard();
  slot.dataset.lfSignature=signature;

  if(olderOpen){
    const older=slot.querySelector('.lfOlder');
    if(older)older.open=true;
  }
  for(const id of openStories){
    const story=[...slot.querySelectorAll('.lfStory')]
      .find(x=>x.dataset.lfStory===id);
    const details=story?.querySelector('details');
    if(details)details.open=true;
  }

  lfWire();
  lfObserve();

  // Preserve the exact reading position if a genuine new story/reaction
  // requires the feed to redraw.
  requestAnimationFrame(()=>window.scrollTo(0,scrollY));
}

function lfToast(text){
  document.querySelector('.lfToast')?.remove();
  const e=document.createElement('div');
  e.className='lfToast';e.textContent=text;document.body.appendChild(e);
  setTimeout(()=>e.remove(),2200);
}

async function lfReply(id){
  const input=document.querySelector('[data-lf-input="'+CSS.escape(id)+'"]');
  const text=input?.value?.trim()||'';
  if(text.length<3){lfToast('Please enter your reply.');input?.focus();return;}
  const {error}=await lfSb.rpc('reply_home_message',{p_message_id:id,p_reply_text:text});
  if(error){lfToast(error.message||'Could not send reply');return;}
  lfLoadedAt=0;await lfLoad(true);lfInject();lfToast('✓ Sent privately to James');
}

async function lfReact(id,reaction){
  const {error}=await lfSb.rpc('react_home_message',{p_message_id:id,p_reaction:reaction});
  if(error){lfToast(error.message||'Could not save reaction');return;}
  lfLoadedAt=0;lfEngLoadedAt=0;await lfLoad(true);lfInject();
  if(document.querySelector('.engOverlay'))lfScheduleEng();
}

function lfWhatsApp(id){
  if(!lfCtx?.isAdmin)return;
  const m=lfMessages.find(x=>String(x.id)===String(id));
  if(!m)return;
  const link='https://jmeasom81-cmd.github.io/Premier-League-Predictions-/';
  const text=m.title+'\n\n'+m.body+'\n\n📲 Open the app:\n'+link;
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener');
}

async function lfDelete(id){
  if(!lfCtx?.isAdmin)return;
  const m=lfMessages.find(x=>String(x.id)===String(id));
  const ok=window.confirm(
    'Remove this message from everyone\'s Home page?\n\n'+
    (m?.title||'League message')+
    '\n\nIt will stay removed and will not be recreated automatically.'
  );
  if(!ok)return;

  const {error}=await lfSb.rpc('archive_home_message',{p_message_id:id});
  if(error){lfToast(error.message||'Could not remove message');return;}

  lfLoadedAt=0;
  lfEngLoadedAt=0;
  await lfLoad(true);
  lfInject();
  lfToast('✓ Removed from Home');
}

async function lfMarkRead(id){
  const {error}=await lfSb.rpc('mark_home_message_reply_read',{p_reply_id:id});
  if(error){lfToast(error.message||'Could not update reply');return;}
  lfLoadedAt=0;await lfLoad(true);lfInject();
}

async function lfCopyReply(btn){
  const text=btn.closest('.lfReply')?.querySelector('.lfReplyText')?.textContent||'';
  try{await navigator.clipboard.writeText(text)}
  catch{
    const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();
  }
  lfToast('✓ Reply copied');
}

function lfWire(){
  document.querySelectorAll('[data-lf-reply]').forEach(b=>{
    b.onclick=()=>lfReply(b.dataset.lfReply);
  });
  document.querySelectorAll('[data-lf-react]').forEach(b=>{
    b.onclick=()=>lfReact(b.dataset.lfId,b.dataset.lfReact);
  });
  document.querySelectorAll('[data-lf-share]').forEach(b=>{
    b.onclick=()=>lfWhatsApp(b.dataset.lfShare);
  });
  document.querySelectorAll('[data-lf-delete]').forEach(b=>{
    b.onclick=()=>lfDelete(b.dataset.lfDelete);
  });
  document.querySelectorAll('[data-lf-read]').forEach(b=>{
    b.onclick=()=>lfMarkRead(b.dataset.lfRead);
  });
  document.querySelectorAll('[data-lf-copy]').forEach(b=>{
    b.onclick=()=>lfCopyReply(b);
  });
}

function lfObserve(){
  if(!('IntersectionObserver' in window))return;
  if(!lfViewObserver){
    lfViewObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting||entry.intersectionRatio<.3)continue;
        const id=entry.target.dataset.lfStory;
        if(!id||lfViewed.has(id))continue;
        lfViewed.add(id);lfViewObserver.unobserve(entry.target);
        lfSb.rpc('record_home_message_view',{p_message_id:id}).catch(()=>{});
      }
    },{threshold:[.3]});
  }
  document.querySelectorAll('.lfStory[data-lf-public="1"]').forEach(el=>{
    if(!lfViewed.has(el.dataset.lfStory))lfViewObserver.observe(el);
  });
}

function lfAgo(v){
  if(!v)return '';
  const s=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/1000));
  if(s<60)return 'now';if(s<3600)return Math.floor(s/60)+'m ago';
  if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago';
}

function lfReactionSummary(x){
  return ['👍','👏','😂','😭','🔥'].filter(r=>Number(x?.[r]||0)>0)
    .map(r=>r+' '+Number(x[r])).join(' · ')||'No reactions yet';
}

async function lfLoadEng(force=false){
  const c=await lfContext();
  if(!c?.isAdmin)return [];
  if(!force&&Date.now()-lfEngLoadedAt<15000)return lfEngRows;
  const {data,error}=await lfSb.rpc('get_owner_home_message_engagement',{p_league_id:c.leagueId});
  if(error)throw error;
  lfEngRows=Array.isArray(data)?data:[];lfEngLoadedAt=Date.now();return lfEngRows;
}

function lfEngHtml(rows){
  return '<div class="engPanel lfEngPanel"><div class="engPanelHead"><h2>🗞️ League Feed engagement</h2><span>Views & reactions</span></div>'+
    (rows.length?rows.slice(0,8).map(m=>{
      const viewers=Array.isArray(m.viewers)?m.viewers:[];
      return '<div class="lfEngStory"><div class="lfEngTop"><div class="lfEngTitle">'+lfEsc(m.title)+
        '<small>'+lfEsc(lfDate(m.created_at))+' · '+lfEsc(lfLabel(m))+'</small></div>'+
        '<div class="lfEngCounts"><b>'+Number(m.views||0)+'</b> viewed<br>'+lfEsc(lfReactionSummary(m.reactions||{}))+'</div></div>'+
        '<details class="lfViewers"><summary>Who viewed this ('+viewers.length+')</summary>'+
        (viewers.length?viewers.map(v=>'<div class="lfViewer"><span>'+lfEsc(v.badge||'⚽')+' '+lfEsc(v.display_name||v.team_name||'Player')+
          '</span><span>'+lfEsc(lfAgo(v.last_viewed_at))+'</span></div>').join(''):'<div class="lfViewer"><span>No views recorded yet</span><span></span></div>')+
        '</details></div>';
    }).join(''):'<div class="notice">Feed-view tracking will build as members see updates on Home.</div>')+
    '</div>';
}

async function lfInjectEng(){
  const body=document.querySelector('.engOverlay .engBody');
  if(!body)return;
  const c=await lfContext();if(!c?.isAdmin)return;
  try{
    const rows=await lfLoadEng(false);
    body.querySelector('.lfEngPanel')?.remove();
    const w=document.createElement('div');w.innerHTML=lfEngHtml(rows);
    const panel=w.firstElementChild;
    const recent=[...body.querySelectorAll('.engPanel')].find(x=>(x.textContent||'').includes('Recent activity'));
    if(recent)recent.insertAdjacentElement('beforebegin',panel);else body.appendChild(panel);
  }catch(e){console.warn('League Feed engagement:',e)}
}

function lfScheduleEng(){
  clearTimeout(lfEngTimer);lfEngTimer=setTimeout(lfInjectEng,350);
}

async function lfRefresh(force=false){
  if(lfBusy)return;lfBusy=true;
  try{await lfLoad(force);lfInject();if(document.querySelector('.engOverlay'))lfScheduleEng()}
  catch(e){console.warn('League Feed:',e)}
  finally{lfBusy=false}
}

function lfSchedule(){
  clearTimeout(lfTimer);lfTimer=setTimeout(()=>lfRefresh(false),140);
}

lfCss();
document.addEventListener('click',e=>{
  if(e.target.closest?.('#nav button[data-v]'))setTimeout(lfSchedule,140);
},true);

const main=document.getElementById('main');
if(main)new MutationObserver(lfSchedule).observe(main,{childList:true,subtree:true});

new MutationObserver(()=>{
  if(document.querySelector('.engOverlay'))lfScheduleEng();
}).observe(document.body,{childList:true,subtree:true});

window.addEventListener('focus',()=>{
  lfLoadedAt=0;lfEngLoadedAt=0;lfSchedule();lfScheduleEng();
});

setInterval(()=>{
  if(lfHomeActive()){lfLoadedAt=0;lfRefresh(true)}
  if(document.querySelector('.engOverlay')){lfEngLoadedAt=0;lfScheduleEng()}
},20000);

setTimeout(()=>lfRefresh(true),800);
