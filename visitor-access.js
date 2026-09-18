// VISITOR ACCESS V1
// Email-specific read-only spectator mode for Premier League Predictions.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const vaSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const VA_KEY='plp_visitor_invite';
let vaCode=(new URLSearchParams(location.search).get('visit')||'').trim().toUpperCase();
let vaVisitor=false;
let vaMembership=null;
let vaVisitorNames=[];
let vaApplying=false;
let vaObsTimer=null;

localStorage.removeItem(VA_KEY);

function vaCss(){
  if(document.getElementById('va-v1-css'))return;
  const s=document.createElement('style');
  s.id='va-v1-css';
  s.textContent=`
    .vaGate{position:fixed;inset:0;z-index:20000;background:linear-gradient(180deg,#f6f6fb,#efedf7);overflow:auto;padding:22px 14px}
    .vaGateInner{max-width:520px;margin:0 auto}
    .vaCard{background:#fff;border:1px solid #e7e4ef;border-radius:22px;padding:18px;box-shadow:0 16px 45px rgba(34,20,70,.10)}
    .vaBadge{width:54px;height:54px;border-radius:18px;display:grid;place-items:center;background:#eee8ff;font-size:27px;margin-bottom:12px}
    .vaCard h1{font-size:22px;margin:0 0 5px;color:#241153}
    .vaCard p{font-size:11px;line-height:1.5;color:#716f82}
    .vaLeague{background:#f7f4ff;border:1px solid #ddd3f4;border-radius:13px;padding:10px 11px;margin:11px 0;font-size:11px}
    .vaField{margin:10px 0}
    .vaField label{display:block;font-size:9px;font-weight:950;color:#716f82;text-transform:uppercase;margin-bottom:5px}
    .vaField input{width:100%;border:1px solid #d9d8e5;border-radius:11px;padding:11px 12px;background:#fff}
    .vaBtn{width:100%;border:0;border-radius:11px;padding:11px 13px;font-weight:950;margin-top:7px}
    .vaBtn.primary{background:#4b269d;color:#fff}
    .vaBtn.secondary{background:#efeff6;color:#343047}
    .vaMsg{border-radius:11px;padding:10px 11px;font-size:10px;line-height:1.45;margin:9px 0}
    .vaMsg.good{background:#e8fff8;color:#08775c}
    .vaMsg.bad{background:#fff0f2;color:#b52c3c}
    .vaFine{font-size:9px;color:#858293;line-height:1.45;margin-top:10px}
    body.plpVisitor #nav{display:flex!important;grid-template-columns:none!important;justify-content:space-around}
    body.plpVisitor #nav button{flex:1}
    body.plpVisitor #nav button[data-v="predict"],
    body.plpVisitor #nav button[data-v="ai"],
    body.plpVisitor #nav button[data-v="chat"]{display:none!important}
    body.plpVisitor .reminderHero,
    body.plpVisitor #ppc-personal-countdown{display:none!important}
    .vaHomeCard{border-color:#d9cef5!important;background:linear-gradient(135deg,rgba(246,242,255,.97),rgba(255,255,255,.95))!important}
    .vaPill{font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:#5b38a8;background:#eee7ff;border-radius:999px;padding:5px 7px;white-space:nowrap}
  `;
  document.head.appendChild(s);
}

function vaEsc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function vaGate(preview){
  let g=document.getElementById('va-gate');
  if(g)return g;

  g=document.createElement('div');
  g.id='va-gate';
  g.className='vaGate';
  g.innerHTML=`<div class="vaGateInner"><div class="vaCard">
    <div class="vaBadge">👀</div>
    <h1>Visitor access</h1>
    <p>You've been invited to follow the private predictions league without entering predictions yourself.</p>
    <div class="vaLeague"><b>${vaEsc(preview?.league_name||'Predictions League')}</b><br>Invite for ${vaEsc(preview?.invited_name||'Visitor')} · ${vaEsc(preview?.invited_email_masked||'invited email')}</div>
    <div id="va-msg"></div>
    <div class="vaField"><label>Email</label><input id="va-email" type="email" autocomplete="email" placeholder="Use the email this invite was sent to"></div>
    <div class="vaField"><label>Password</label><input id="va-pass" type="password" minlength="8" autocomplete="current-password" placeholder="At least 8 characters"></div>
    <button class="vaBtn primary" id="va-create">Create visitor account</button>
    <button class="vaBtn secondary" id="va-signin">Already have an account? Sign in</button>
    <div class="vaFine">Visitor access is read-only. You can view the league table, results, player stats and Match Centre, but you won't appear in the standings or affect predictions.</div>
  </div></div>`;

  document.body.appendChild(g);

  const msg=(t,good=false)=>{
    const el=g.querySelector('#va-msg');
    if(el)el.innerHTML=`<div class="vaMsg ${good?'good':'bad'}">${vaEsc(t)}</div>`;
  };

  const validate=async()=>{
    const email=g.querySelector('#va-email').value.trim();
    const password=g.querySelector('#va-pass').value;

    if(!email||password.length<8){
      msg('Enter the invited email and a password of at least 8 characters.');
      return null;
    }

    const {data,error}=await vaSb.rpc('check_visitor_invite_email',{
      p_code:vaCode,
      p_email:email
    });

    if(error){
      msg(error.message);
      return null;
    }

    if(!data){
      msg('That email does not match this visitor invitation.');
      return null;
    }

    return {email,password};
  };

  g.querySelector('#va-create').onclick=async()=>{
    const v=await validate();
    if(!v)return;

    const redirect=`${location.origin}${location.pathname}?visit=${encodeURIComponent(vaCode)}`;
    const {data,error}=await vaSb.auth.signUp({
      email:v.email,
      password:v.password,
      options:{emailRedirectTo:redirect}
    });

    if(error){
      msg(error.message);
      return;
    }

    if(data.session){
      msg('Account created. Finishing visitor access…',true);
      await vaCompleteInvite();
    }else{
      msg('Account created — check your email to confirm it, then return using the visitor link.',true);
    }
  };

  g.querySelector('#va-signin').onclick=async()=>{
    const v=await validate();
    if(!v)return;

    const {error}=await vaSb.auth.signInWithPassword({
      email:v.email,
      password:v.password
    });

    if(error){
      msg(error.message);
      return;
    }

    msg('Signed in. Finishing visitor access…',true);
    await vaCompleteInvite();
  };

  return g;
}

function vaShowGateMessage(text,good=false){
  const g=document.getElementById('va-gate');
  if(!g)return;
  const el=g.querySelector('#va-msg');
  if(el)el.innerHTML=`<div class="vaMsg ${good?'good':'bad'}">${vaEsc(text)}</div>`;
}

async function vaPreview(){
  if(!vaCode)return null;
  const {data,error}=await vaSb.rpc('preview_visitor_invite',{p_code:vaCode});
  if(error)throw error;
  return Array.isArray(data)?data[0]:data;
}

async function vaCompleteInvite(){
  if(!vaCode)return false;

  const {data:{session}}=await vaSb.auth.getSession();
  if(!session)return false;

  const {error}=await vaSb.rpc('accept_visitor_invite',{p_code:vaCode});

  if(error){
    vaShowGateMessage(error.message,false);
    return false;
  }

  localStorage.removeItem(VA_KEY);
  vaCode='';

  history.replaceState({},'',`${location.origin}${location.pathname}`);
  location.reload();
  return true;
}

async function vaHandleInvite(){
  if(!vaCode)return false;

  try{
    const p=await vaPreview();

    if(!p?.is_valid){
      vaGate(p||{});
      vaShowGateMessage('This visitor invitation is invalid, expired or has already been used.');
      return true;
    }

    const {data:{session}}=await vaSb.auth.getSession();

    if(session){
      vaGate(p);
      vaShowGateMessage('Finishing visitor access…',true);
      await vaCompleteInvite();
    }else{
      vaGate(p);
    }

    return true;
  }catch(e){
    vaGate({});
    vaShowGateMessage(e.message||String(e));
    return true;
  }
}

async function vaGetMembership(){
  const {data:{session}}=await vaSb.auth.getSession();
  if(!session)return null;

  const {data,error}=await vaSb
    .from('league_members')
    .select('league_id,role,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error)throw error;
  return data?.[0]||null;
}

async function vaLoadVisitorNames(){
  if(!vaMembership?.league_id)return;

  const {data:members,error}=await vaSb
    .from('league_members')
    .select('user_id')
    .eq('league_id',vaMembership.league_id)
    .eq('status','active')
    .eq('role','visitor');

  if(error||!members?.length){
    vaVisitorNames=[];
    return;
  }

  const ids=members.map(x=>x.user_id);
  const {data:profiles}=await vaSb
    .from('profiles')
    .select('display_name,team_name')
    .in('user_id',ids);

  vaVisitorNames=(profiles||[])
    .flatMap(x=>[x.display_name,x.team_name])
    .filter(Boolean)
    .map(x=>String(x).trim().toLowerCase());
}

function vaCardByHeading(text){
  return [...document.querySelectorAll('#main .card')].find(card=>{
    const h=card.querySelector('h2');
    return (h?.textContent||'').trim().toLowerCase()===text.toLowerCase();
  });
}

function vaHideVisitorsFromProgress(){
  const card=vaCardByHeading('Predictions in');
  if(!card||!vaVisitorNames.length)return;

  card.querySelectorAll('.person').forEach(row=>{
    const t=(row.textContent||'').toLowerCase();
    if(vaVisitorNames.some(n=>n&&t.includes(n))){
      row.style.display='none';
    }
  });
}

function vaApplyResults(){
  if(!vaVisitor)return;

  const o=document.querySelector('.rhOverlay');
  if(!o)return;

  const mine=o.querySelector('.rhTab[data-mode="mine"]');
  const all=o.querySelector('.rhTab[data-mode="all"]');

  if(mine)mine.style.display='none';
  if(all&&!all.classList.contains('active'))all.click();

  const sub=o.querySelector('.rhSub');
  if(sub)sub.textContent='Explore every completed result and revealed prediction';
}

function vaApplyHome(){
  const home=document.querySelector('#nav button[data-v="home"].active');
  const main=document.getElementById('main');
  if(!main)return;

  vaHideVisitorsFromProgress();

  if(!vaVisitor||!home)return;

  main.querySelectorAll('.banner').forEach(b=>{
    const t=(b.textContent||'').toLowerCase();
    if(t.includes('prediction')||t.includes("you're up to date")){
      b.style.display='none';
    }
  });

  vaCardByHeading('Predictions in')?.style.setProperty('display','none','important');

  main.querySelectorAll('.card').forEach(card=>{
    const labels=[...card.querySelectorAll('.stat span')]
      .map(x=>(x.textContent||'').trim().toUpperCase());

    if(labels.includes('POINTS')&&labels.includes('EXACT')&&labels.includes('POSITION')){
      card.style.display='none';
    }
  });

  if(!main.querySelector('.vaHomeCard')){
    const card=document.createElement('div');
    card.className='card vaHomeCard';
    card.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <div>
        <div class="section" style="margin-bottom:4px"><h2>👀 Visitor mode</h2></div>
        <div class="notice">Follow the league, results, player stats and Match Centre. You are not entered as a player and won't affect any league statistics.</div>
      </div>
      <span class="vaPill">Read only</span>
    </div>`;
    main.prepend(card);
  }
}

function vaApplyStats(){
  if(!vaVisitor||!document.querySelector('#nav button[data-v="stats"].active'))return;

  vaCardByHeading('Your season')?.style.setProperty('display','none','important');

  const intro=document.querySelector('.ljs2-player .notice');
  if(intro)intro.textContent='Choose any player to explore their season.';
}

function vaApplyMore(){
  if(!vaVisitor||!document.querySelector('#nav button[data-v="more"].active'))return;

  const main=document.getElementById('main');
  if(!main)return;

  ['Your profile','Prediction reminders','Invite a player'].forEach(x=>{
    vaCardByHeading(x)?.style.setProperty('display','none','important');
  });

  const role=document.querySelector('.roleTag');
  if(role)role.textContent='Visitor';

  if(!main.querySelector('.vaMoreCard')){
    const c=document.createElement('div');
    c.className='card vaMoreCard';
    c.innerHTML=`<div class="section"><h2>👀 Visitor access</h2><span class="roleTag">Visitor</span></div>
      <p class="notice">Your account is read-only for this league. You can follow the competition but cannot submit predictions, invite players or change league data.</p>`;
    main.prepend(c);
  }
}

function vaApplyNav(){
  if(!vaVisitor)return;

  const nav=document.getElementById('nav');
  if(!nav)return;

  document.body.classList.add('plpVisitor');

  ['predict','ai','chat'].forEach(v=>{
    const b=nav.querySelector(`button[data-v="${v}"]`);
    if(b)b.style.display='none';
  });

  const active=nav.querySelector('button.active');
  if(active&&['predict','ai','chat'].includes(active.dataset?.v||'')){
    nav.querySelector('button[data-v="home"]')?.click();
  }

  const id=document.querySelector('#hdr .identity small');
  if(id)id.textContent='Visitor';
}

function vaApplyUi(){
  if(vaApplying)return;
  vaApplying=true;

  try{
    vaApplyNav();
    vaApplyHome();
    vaApplyStats();
    vaApplyMore();
    vaApplyResults();

    if(vaVisitor){
      const ppc=document.getElementById('ppc-personal-countdown');
      if(ppc)ppc.style.display='none';
    }
  }finally{
    vaApplying=false;
  }
}

async function vaDetect(){
  try{
    vaMembership=await vaGetMembership();
    vaVisitor=!!vaMembership&&vaMembership.role==='visitor';

    await vaLoadVisitorNames();
    vaApplyUi();
    return vaVisitor;
  }catch(e){
    console.warn('Visitor access:',e);
    return false;
  }
}

vaCss();

await vaHandleInvite();
await vaDetect();

vaSb.auth.onAuthStateChange(()=>{
  setTimeout(async()=>{
    if(vaCode)await vaCompleteInvite();
    else await vaDetect();
  },250);
});

new MutationObserver(()=>{
  clearTimeout(vaObsTimer);
  vaObsTimer=setTimeout(vaApplyUi,120);
}).observe(document.body,{
  childList:true,
  subtree:true,
  attributes:true,
  attributeFilter:['class']
});

setInterval(vaApplyUi,1800);
