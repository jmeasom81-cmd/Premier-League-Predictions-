// LIVE VIDIPRINTER V1.2
// Persistent Match Centre story feed: goals, VAR reversals, score corrections and full time.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const lvSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let lvLeagueId=null;
let lvEvents=[];
let lvLoadedAt=0;
let lvLoading=null;
let lvShowAll=false;
let lvTimer=null;

const lvEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function lvCss(){
  if(document.getElementById('lv-v1-css'))return;
  const s=document.createElement('style');
  s.id='lv-v1-css';
  s.textContent=`
    .lvPanel{
      background:#17131f;color:#f7f5fb;border-radius:16px;
      padding:11px 12px;margin:0 0 11px;
      border:1px solid rgba(255,255,255,.07);
      box-shadow:0 8px 22px rgba(20,16,32,.12)
    }
    .lvHead{display:flex;justify-content:space-between;gap:10px;align-items:center}
    .lvHeadLeft{min-width:0}
    .lvKicker{
      display:flex;align-items:center;gap:6px;font-size:8px;font-weight:950;
      letter-spacing:.12em;text-transform:uppercase;color:#bfb6ce
    }
    .lvDot{width:7px;height:7px;border-radius:50%;background:#ff4f63;box-shadow:0 0 0 3px rgba(255,79,99,.13)}
    .lvTitle{font-size:13px;font-weight:950;margin-top:3px}
    .lvHead small{font-size:7.5px;color:#9c94aa;text-align:right;line-height:1.35}
    .lvEmpty{
      margin-top:9px;border-top:1px solid rgba(255,255,255,.08);
      padding-top:9px;font-size:9px;line-height:1.4;color:#aaa2b7
    }
    .lvList{margin-top:8px}
    .lvEvent{
      position:relative;padding:9px 0 9px 15px;
      border-top:1px solid rgba(255,255,255,.08)
    }
    .lvEvent:first-child{border-top:0}
    .lvEvent::before{
      content:"";position:absolute;left:1px;top:14px;width:7px;height:7px;
      border-radius:50%;background:#8f879b
    }
    .lvEvent.goal::before{background:#ff5064}
    .lvEvent.no_goal::before{background:#ffbf47}
    .lvEvent.correction::before{background:#ffbf47}
    .lvEvent.full_time::before{background:#56c89d}
    .lvEvent.overturned{opacity:.48}
    .lvEvent.overturned .lvHeadline{text-decoration:line-through}
    .lvTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .lvHeadline{font-size:10.5px;font-weight:950;line-height:1.25}
    .lvStatus{
      border-radius:999px;padding:3px 6px;font-size:6.8px;font-weight:950;
      text-transform:uppercase;white-space:nowrap
    }
    .lvStatus.checking{background:#3a3020;color:#ffd788}
    .lvStatus.var{background:#38252a;color:#ff9ba7}
    .lvStatus.ft{background:#18382e;color:#86e2be}
    .lvScore{font-size:8.5px;color:#c1bacb;margin-top:3px;font-weight:850}
    .lvImpact{font-size:9.5px;color:#fff;margin-top:5px;line-height:1.35;font-weight:850}
    .lvImpact2{font-size:7.5px;color:#9f97aa;margin-top:3px}
    .lvMore{
      width:100%;border:0;border-top:1px solid rgba(255,255,255,.08);
      background:transparent;color:#bba9e9;padding:8px 0 1px;
      margin-top:2px;font-size:8.5px;font-weight:950
    }
    .lvPulse .lvDot{animation:lvPulse 1.3s infinite}
    @keyframes lvPulse{0%,100%{transform:scale(.85);opacity:.75}50%{transform:scale(1.2);opacity:1}}
  `;
  document.head.appendChild(s);
}

async function lvContext(){
  if(lvLeagueId)return lvLeagueId;
  const {data:{session}}=await lvSb.auth.getSession();
  if(!session)return null;
  const {data,error}=await lvSb.from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);
  if(error)throw error;
  lvLeagueId=data?.[0]?.league_id||null;
  return lvLeagueId;
}

async function lvLoad(force=false){
  if(!force&&Date.now()-lvLoadedAt<4000)return lvEvents;
  if(lvLoading)return lvLoading;
  lvLoading=(async()=>{
    const leagueId=await lvContext();
    if(!leagueId)return [];
    const {data,error}=await lvSb.rpc('get_live_vidiprinter',{
      p_league_id:leagueId,
      p_limit:40
    });
    if(error)throw error;
    lvEvents=Array.isArray(data)?data:[];
    lvLoadedAt=Date.now();
    return lvEvents;
  })();
  try{return await lvLoading}finally{lvLoading=null}
}

function lvMinute(e){
  if(e.event_type==='full_time')return 'FT';
  const n=Number(e.minute||0);
  if(!n)return '';
  return n>=90?'90+′':`${n}′`;
}

function lvTime(v){
  try{
    return new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'
    }).format(new Date(v));
  }catch{return ''}
}

function lvStatus(e){
  if(e.event_status==='overturned')return '<span class="lvStatus var">Overturned</span>';
  if(e.event_type==='no_goal')return '<span class="lvStatus var">VAR / no goal</span>';
  if(e.event_type==='correction')return '<span class="lvStatus var">Corrected</span>';
  if(e.event_type==='full_time')return '<span class="lvStatus ft">Final</span>';
  if(e.event_status==='provisional')return '<span class="lvStatus checking">Checking</span>';
  return '';
}

function lvEventHtml(e){
  const score=(e.home_score!=null&&e.away_score!=null)
    ?`${lvEsc(e.home_team)} ${lvEsc(e.home_score)}–${lvEsc(e.away_score)} ${lvEsc(e.away_team)}`
    :'';
  const minute=lvMinute(e);
  const stamp=lvTime(e.created_at);
  const meta=[minute,score,stamp].filter(Boolean).join(' · ');

  return `<div class="lvEvent ${lvEsc(e.event_type)} ${e.event_status==='overturned'?'overturned':''}">
    <div class="lvTop">
      <div class="lvHeadline">${lvEsc(e.headline)}</div>
      ${lvStatus(e)}
    </div>
    <div class="lvScore">${lvEsc(meta)}</div>
    ${e.impact_primary?`<div class="lvImpact">${lvEsc(e.impact_primary)}</div>`:''}
    ${e.impact_secondary?`<div class="lvImpact2">${lvEsc(e.impact_secondary)}</div>`:''}
  </div>`;
}

function lvMarkup(){
  const events=lvEvents||[];
  const hasChecking=events.some(e=>e.event_status==='provisional');
  const shown=lvShowAll?events:events.slice(0,3);
  const signature=[
    lvShowAll?'all':'latest',
    ...events.map(e=>[
      e.id,e.event_type,e.event_status,e.minute,
      e.home_score,e.away_score,e.impact_primary,e.impact_secondary
    ].join(':'))
  ].join('|');

  return `<section class="lvPanel ${hasChecking?'lvPulse':''}" data-lv-panel data-lv-signature="${lvEsc(signature)}">
    <div class="lvHead">
      <div class="lvHeadLeft">
        <div class="lvKicker"><span class="lvDot"></span> Live feed</div>
        <div class="lvTitle">Matchday story as it happens</div>
      </div>
      <small>Goals · VAR · league impact<br>updates automatically</small>
    </div>
    ${shown.length
      ?`<div class="lvList">${shown.map(lvEventHtml).join('')}</div>`
      :'<div class="lvEmpty">Waiting for the next score change. When a goal lands, the feed will show the immediate prediction-league impact here.</div>'}
    ${events.length>3?`<button type="button" class="lvMore" data-lv-more>${lvShowAll?'Show latest 3':`View all updates (${events.length})`}</button>`:''}
  </section>`;
}

function lvWirePanel(root=document){
  root.querySelector('[data-lv-more]')?.addEventListener('click',()=>{
    lvShowAll=!lvShowAll;
    lvInsert();
  },{once:true});
}

function lvInsert(){
  const body=document.querySelector('.mc3Overlay .mc3Body');
  if(!body)return;

  // Preferred path: Match Centre owns a permanent slot, so refreshing the
  // match cards never removes the Live Feed for a browser paint.
  const slot=body.querySelector('[data-lv-slot]');
  if(slot){
    const wrap=document.createElement('div');
    wrap.innerHTML=lvMarkup();
    const fresh=wrap.firstElementChild;
    const old=slot.querySelector('[data-lv-panel]');
    if(old?.dataset.lvSignature===fresh.dataset.lvSignature){
      lvWirePanel(slot);
      return;
    }
    slot.innerHTML='';
    slot.appendChild(fresh);
    lvWirePanel(slot);
    return;
  }

  // Fallback for an older cached Match Centre.
  const old=body.querySelector('[data-lv-panel]');
  const wrap=document.createElement('div');
  wrap.innerHTML=lvMarkup();
  const fresh=wrap.firstElementChild;

  if(old){
    if(old.dataset.lvSignature===fresh.dataset.lvSignature)return;
    old.replaceWith(fresh);
  }else{
    const provider=body.querySelector('.mc3Fresh');
    if(provider)provider.insertAdjacentElement('afterend',fresh);
    else body.prepend(fresh);
  }
  lvWirePanel(body);
}

async function lvRefresh(force=false){
  if(!document.querySelector('.mc3Overlay'))return;
  try{
    await lvLoad(force);
    lvInsert();
  }catch(e){
    console.warn('Live Feed:',e);
  }
}

function lvSchedule(){
  clearTimeout(lvTimer);
  lvTimer=setTimeout(()=>lvRefresh(false),180);
}

lvCss();
window.getPLPLiveVidiprinterHtml=()=>lvMarkup();
window.wirePLPLiveVidiprinter=()=>lvWirePanel(document);

const lvObserver=new MutationObserver(()=>{
  const overlay=document.querySelector('.mc3Overlay');
  if(!overlay)return;
  lvSchedule();
});
lvObserver.observe(document.body,{childList:true,subtree:true});

document.addEventListener('click',e=>{
  if(e.target.closest?.('.mcNav,[data-mc3-refresh]')){
    lvLoadedAt=0;
    setTimeout(()=>lvRefresh(true),700);
  }
},true);

setInterval(()=>{
  if(document.querySelector('.mc3Overlay')){
    lvLoadedAt=0;
    lvRefresh(true);
  }
},5000);

setTimeout(()=>lvRefresh(true),1200);
