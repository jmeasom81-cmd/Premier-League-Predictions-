// HOME FOCUS V1.1
// Personal football dashboard for Home.
// Replaces the old Home prediction-heavy layout while leaving Predict, Table, Stats and Live Centre untouched.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const hfSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let hfCtx = null;
let hfData = null;
let hfLoadedAt = 0;
let hfBusy = false;
let hfTimer = null;

const hfEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

const hfNum = v => Number(v || 0);

function hfOrd(n){
  n=Number(n||0);
  if(!n) return '–';
  const s=['th','st','nd','rd'],v=n%100;
  return `${n}${s[(v-20)%10]||s[v]||s[0]}`;
}

function hfPlural(n,one,many=one+'s'){
  return Number(n)===1?one:many;
}

function hfIsHome(){
  return !!document.querySelector('#nav button[data-v="home"].active');
}

function hfFmt(iso){
  if(!iso) return '';
  return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/London',
    weekday:'short',
    day:'numeric',
    month:'short',
    hour:'2-digit',
    minute:'2-digit'
  }).format(new Date(iso));
}

function hfCss(){
  if(document.getElementById('hf-v1-css')) return;
  const s=document.createElement('style');
  s.id='hf-v1-css';
  s.textContent=`
    body.hfHome main::after{height:105px!important}
    body.hfHome #main>.hfLegacyHidden{display:none!important}
    body.hfHome #main>.predictionStatus.plpEnhancer,
    body.hfHome #main>#ppc-personal-countdown,
    body.hfHome #main>.reminderHero,
    body.hfHome #main>.banner{display:none!important}

    .hfHost{margin-bottom:12px}
    .hfHero{
      position:relative;
      overflow:hidden;
      min-height:min(56vh,520px);
      border-radius:0 0 28px 28px;
      margin:-1px -1px 13px;
      padding:18px 17px 16px;
      display:flex;
      flex-direction:column;
      justify-content:flex-end;
      color:#fff;
      background:
        radial-gradient(circle at 50% 34%,rgba(255,255,255,.11),transparent 34%),
        linear-gradient(155deg,rgba(24,9,62,.90),rgba(65,31,124,.80) 56%,rgba(26,14,70,.91));
      box-shadow:0 14px 35px rgba(25,18,65,.18);
      backdrop-filter:blur(2px);
      -webkit-backdrop-filter:blur(2px);
    }
    .hfHero::before{
      content:"";
      position:absolute;
      width:min(67vw,310px);
      height:min(67vw,310px);
      left:50%;
      top:42%;
      transform:translate(-50%,-50%);
      background-image:var(--club-crest);
      background-repeat:no-repeat;
      background-position:center;
      background-size:contain;
      opacity:.82;
      filter:drop-shadow(0 16px 26px rgba(0,0,0,.23));
      pointer-events:none;
    }
    .hfHero.noClub::before{display:none}
    .hfHeroShade{
      position:absolute;inset:auto 0 0;height:47%;
      background:linear-gradient(transparent,rgba(12,5,35,.38) 24%,rgba(12,5,35,.78));
      pointer-events:none;
    }
    .hfHeroTop{
      position:absolute;top:16px;left:17px;right:17px;
      display:flex;justify-content:space-between;align-items:flex-start;gap:10px;z-index:2
    }
    .hfClubLabel{
      font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;
      color:rgba(255,255,255,.72)
    }
    .hfClubName{font-size:16px;font-weight:950;margin-top:2px;text-shadow:0 2px 8px rgba(0,0,0,.25)}
    .hfHeroBadge{
      font-size:8px;font-weight:950;border:1px solid rgba(255,255,255,.22);
      background:rgba(255,255,255,.11);padding:6px 8px;border-radius:999px;
      backdrop-filter:blur(5px)
    }
    .hfFallbackClub{
      position:absolute;left:50%;top:39%;transform:translate(-50%,-50%);
      text-align:center;z-index:1
    }
    .hfFallbackClub .ball{font-size:98px;line-height:1;filter:drop-shadow(0 15px 22px rgba(0,0,0,.2))}
    .hfFallbackClub p{margin:8px 0 0;font-size:11px;color:rgba(255,255,255,.78)}
    .hfHeroBottom{position:relative;z-index:2}
    .hfTeamName{font-size:24px;line-height:1.05;font-weight:950;text-shadow:0 2px 12px rgba(0,0,0,.35)}
    .hfManager{font-size:10px;color:rgba(255,255,255,.74);margin-top:4px}
    .hfHeroStats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}
    .hfHeroStat{
      border:1px solid rgba(255,255,255,.16);
      background:rgba(255,255,255,.10);
      border-radius:13px;padding:10px 6px;text-align:center;
      backdrop-filter:blur(6px)
    }
    .hfHeroStat b{display:block;font-size:21px;line-height:1}
    .hfHeroStat span{display:block;font-size:7.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.67);margin-top:4px}
    .hfGapRow{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
    .hfGap{font-size:8.5px;font-weight:900;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.14);padding:6px 8px;border-radius:999px}
    .hfHeroActions{display:flex;gap:7px;margin-top:11px;flex-wrap:wrap}
    .hfHeroBtn{
      border:0;border-radius:11px;padding:9px 11px;font-size:9.5px;font-weight:950;cursor:pointer;
      background:#fff;color:#2e175c
    }
    .hfHeroBtn.ghost{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.18)}

    .hfCard{
      background:rgba(255,255,255,.93);
      border:1px solid #e7e4ef;border-radius:18px;padding:14px;margin-bottom:12px;
      box-shadow:0 8px 24px rgba(25,18,65,.07);
      backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)
    }
    .hfPrediction{
      display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px
    }
    .hfPredictionIcon{
      width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:18px;
      background:#e6f8f1;color:#08775c
    }
    .hfPrediction.attention .hfPredictionIcon{background:#fff0c9;color:#795a00}
    .hfPrediction.urgent .hfPredictionIcon{background:#fde8ec;color:#b52c3c}
    .hfPredictionText b{font-size:11.5px;color:#241153;display:block}
    .hfPredictionText small{font-size:8.5px;color:#817c8c;line-height:1.35;display:block;margin-top:2px}
    .hfGo{
      border:0;border-radius:10px;background:#4b269d;color:#fff;
      padding:8px 9px;font-size:9px;font-weight:950;white-space:nowrap
    }

    .hfLiveSlot:empty{display:none}
    .hfLiveSlot .plpLiveHome{margin-bottom:12px!important}

    .hfHead{display:flex;justify-content:space-between;align-items:flex-end;gap:9px;margin-bottom:9px}
    .hfHead h3{margin:0;color:#241153;font-size:15px}
    .hfHead span{font-size:8.5px;color:#878290;text-align:right}
    .hfPulseRows{display:grid;gap:0}
    .hfPulse{
      display:flex;justify-content:space-between;gap:10px;align-items:center;
      border-top:1px solid #eeecf3;padding:10px 0
    }
    .hfPulse:first-child{border-top:0;padding-top:1px}
    .hfPulseText{font-size:10px;color:#504a5b;line-height:1.38;min-width:0}
    .hfPulseText b{display:block;color:#241153;font-size:10.5px}
    .hfPulseValue{text-align:right;color:#241153;font-size:11.5px;font-weight:950;white-space:nowrap}
    .hfPulseValue small{display:block;font-size:7.8px;font-weight:800;color:#918c9a;margin-top:2px}

    .hfLast{
      display:grid;grid-template-columns:minmax(0,1fr) repeat(3,auto);gap:8px;align-items:center
    }
    .hfLastTitle b{display:block;color:#241153;font-size:12px}
    .hfLastTitle small{display:block;color:#817c8c;font-size:8.5px;margin-top:2px}
    .hfLastStat{text-align:center;min-width:48px}
    .hfLastStat b{display:block;color:#241153;font-size:16px}
    .hfLastStat span{display:block;color:#918c9a;font-size:7.2px;text-transform:uppercase;font-weight:900;margin-top:2px}

    body.hfHome #main>.card.hfNoticeQuiet{display:none!important}

    @media(max-width:520px){
      .hfHero{min-height:min(53vh,470px);border-radius:0 0 25px 25px;padding:16px 14px 14px}
      .hfHeroTop{left:14px;right:14px}
      .hfHero::before{width:min(72vw,285px);height:min(72vw,285px)}
      .hfTeamName{font-size:21px}
      .hfPrediction{grid-template-columns:auto minmax(0,1fr) auto}
      .hfLast{grid-template-columns:minmax(0,1fr) repeat(3,44px);gap:5px}
      .hfLastStat{min-width:0}
    }
  `;
  document.head.appendChild(s);
}

async function hfContext(){
  if(hfCtx) return hfCtx;

  const {data:{session}}=await hfSb.auth.getSession();
  if(!session) return null;

  const {data,error}=await hfSb
    .from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error) throw error;
  if(!data?.length) return null;

  hfCtx={userId:session.user.id,leagueId:data[0].league_id};
  return hfCtx;
}

async function hfLoad(force=false){
  const c=await hfContext();
  if(!c) return null;

  if(!force && hfData && Date.now()-hfLoadedAt<30000) return hfData;

  const {data,error}=await hfSb.rpc('get_home_focus_dashboard',{
    p_league_id:c.leagueId
  });

  if(error) throw error;
  hfData=data||{};
  hfLoadedAt=Date.now();
  return hfData;
}

function hfGoView(v){
  if(typeof window.setViewGlobal==='function') return window.setViewGlobal(v);
  document.querySelector(`#nav button[data-v="${v}"]`)?.click();
}

function hfPredictionHtml(d){
  const p=d?.predictions||{};
  const missing=hfNum(p.missing_count);
  const open=hfNum(p.open_count);
  const saved=hfNum(p.saved_count);
  const next=p.next_lock_at;
  const hours=next?(new Date(next).getTime()-Date.now())/3600000:Infinity;

  let cls='',icon='✓',title='Predictions complete',sub='No open prediction needs your attention.';

  if(open>0 && missing===0){
    title=`All ${saved} open ${hfPlural(saved,'prediction')} saved`;
    sub='Nothing to do here — edit them any time before their individual locks.';
  }else if(missing>0){
    cls=hours<=6?'urgent':hours<=24?'attention':'';
    icon=hours<=6?'⏰':'✍️';
    title=`${missing} ${hfPlural(missing,'prediction')} still to make`;
    const fixture=p.next_home_team&&p.next_away_team?`${p.next_home_team} v ${p.next_away_team}`:'Next prediction';
    sub=`${fixture}${next?` · locks ${hfFmt(next)}`:''}`;
  }

  return `<div class="hfCard hfPrediction ${cls}">
    <div class="hfPredictionIcon">${icon}</div>
    <div class="hfPredictionText"><b>${hfEsc(title)}</b><small>${hfEsc(sub)}</small></div>
    <button type="button" class="hfGo" data-hf-go="predict">${missing>0?'Predict':'View'}</button>
  </div>`;
}

function hfHeroHtml(d){
  const p=d?.profile||{}, me=d?.me||{};
  const fav=p.favourite_club;
  const pos=hfNum(me.position);
  const gapLeader=hfNum(me.gap_to_leader);
  const gapAbove=hfNum(me.gap_to_above);

  return `<section class="hfHero ${fav?'':'noClub'}">
    <div class="hfHeroShade"></div>
    <div class="hfHeroTop">
      <div>
        <div class="hfClubLabel">${fav?'Your club':'Make Home yours'}</div>
        <div class="hfClubName">${hfEsc(fav||'Choose your favourite club')}</div>
      </div>
      <div class="hfHeroBadge">2026/27</div>
    </div>

    ${fav?'':`<div class="hfFallbackClub"><div class="ball">⚽</div><p>Add your favourite club to personalise Home.</p></div>`}

    <div class="hfHeroBottom">
      <div class="hfTeamName">${hfEsc(p.team_name||p.display_name||'My team')}</div>
      <div class="hfManager">${hfEsc(p.display_name||'Player')}</div>

      <div class="hfHeroStats">
        <div class="hfHeroStat"><b>${hfOrd(pos)}</b><span>Position</span></div>
        <div class="hfHeroStat"><b>${hfNum(me.points)}</b><span>Points</span></div>
        <div class="hfHeroStat"><b>${hfNum(me.exacts)}</b><span>Exacts</span></div>
      </div>

      <div class="hfGapRow">
        ${pos===1?'<span class="hfGap">🏆 League leader</span>':`<span class="hfGap">${gapLeader} ${hfPlural(gapLeader,'pt')} from leader</span>`}
        ${pos>1?`<span class="hfGap">${gapAbove} ${hfPlural(gapAbove,'pt')} to ${hfEsc(me.above_team||'next place')}</span>`:''}
      </div>

      <div class="hfHeroActions">
        ${fav?'':`<button type="button" class="hfHeroBtn" data-hf-go="more">Choose club</button>`}
        <button type="button" class="hfHeroBtn ${fav?'':'ghost'}" data-hf-go="table">League table</button>
        <button type="button" class="hfHeroBtn ghost" data-hf-go="stats">My stats</button>
      </div>
    </div>
  </section>`;
}

function hfPulseHtml(d){
  const leader=d?.leader||{};
  const s=d?.league_story||{};
  const rows=[];

  if(leader.team_name){
    rows.push(`<div class="hfPulse">
      <div class="hfPulseText"><b>🏆 League leader</b>${hfEsc(leader.team_name)}</div>
      <div class="hfPulseValue">${hfNum(leader.points)} pts<small>${hfNum(leader.exacts)} exacts</small></div>
    </div>`);
  }

  const divided=s.most_divided;
  if(divided){
    rows.push(`<div class="hfPulse">
      <div class="hfPulseText"><b>⚖️ Nobody could agree</b>${hfEsc(divided.home_team)} v ${hfEsc(divided.away_team)}</div>
      <div class="hfPulseValue">${divided.home_calls}–${divided.draw_calls}–${divided.away_calls}<small>H · D · A</small></div>
    </div>`);
  }

  const contra=s.top_contrarian;
  if(contra){
    rows.push(`<div class="hfPulse">
      <div class="hfPulseText"><b>🦹 Contrarian king</b>${hfEsc(contra.team_name||contra.display_name||'Player')}</div>
      <div class="hfPulseValue">${contra.contrarian_hits}/${contra.contrarian_picks}<small>${hfEsc(contra.hit_pct)}% against crowd</small></div>
    </div>`);
  }else if(s.most_exacts_fixture){
    const x=s.most_exacts_fixture;
    rows.push(`<div class="hfPulse">
      <div class="hfPulseText"><b>🎯 Exact-score party</b>${hfEsc(x.home_team)} v ${hfEsc(x.away_team)}</div>
      <div class="hfPulseValue">${hfNum(x.exacts)}<small>exact predictions</small></div>
    </div>`);
  }

  if(!rows.length) return '';

  return `<div class="hfCard">
    <div class="hfHead"><h3>⚡ League Pulse</h3><span>What’s happening in your league</span></div>
    <div class="hfPulseRows">${rows.slice(0,3).join('')}</div>
  </div>`;
}

function hfLastRoundHtml(d){
  const r=d?.last_round;
  if(!r) return '';

  return `<div class="hfCard">
    <div class="hfHead"><h3>↩️ Last round</h3><span>MW${hfEsc(r.matchweek)}</span></div>
    <div class="hfLast">
      <div class="hfLastTitle"><b>Matchweek ${hfEsc(r.matchweek)}</b><small>Your most recent completed round</small></div>
      <div class="hfLastStat"><b>${hfNum(r.points)}</b><span>Points</span></div>
      <div class="hfLastStat"><b>${hfNum(r.exacts)}</b><span>Exacts</span></div>
      <div class="hfLastStat"><b>${hfOrd(r.weekly_position)}</b><span>Round</span></div>
    </div>
  </div>`;
}

function hfHtml(d){
  return `${hfHeroHtml(d)}
    ${hfPredictionHtml(d)}
    <div class="hfLeagueFeedSlot"></div>
    <div class="hfLiveSlot"></div>
    ${hfPulseHtml(d)}
    ${hfLastRoundHtml(d)}`;
}

function hfIsNoticeCard(el){
  if(!el?.classList?.contains('card')) return false;
  const h=el.querySelector('.section h2');
  return !!h && (h.textContent||'').includes('Notice Board');
}

function hfPrepareLegacy(host){
  const main=document.getElementById('main');
  if(!main) return;

  [...main.children].forEach(el=>{
    if(el===host) return;
    if(el.classList?.contains('plpLiveHome')) return;

    if(hfIsNoticeCard(el)){
      const text=(el.textContent||'').toLowerCase();
      el.classList.toggle('hfNoticeQuiet',text.includes('no current notices'));
      el.classList.remove('hfLegacyHidden');
      return;
    }

    el.classList.add('hfLegacyHidden');
  });

  const live=main.querySelector('.plpLiveHome');
  const slot=host?.querySelector('.hfLiveSlot');
  if(live&&slot&&live.parentElement!==slot) slot.appendChild(live);
}

function hfWire(host){
  host.querySelectorAll('[data-hf-go]').forEach(b=>{
    if(b.dataset.hfWired) return;
    b.dataset.hfWired='1';
    b.addEventListener('click',()=>hfGoView(b.dataset.hfGo));
  });
}

async function hfApply(force=false){
  const main=document.getElementById('main');

  if(!hfIsHome()){
    document.body.classList.remove('hfHome');
    main?.querySelectorAll('.hfLegacyHidden').forEach(x=>x.classList.remove('hfLegacyHidden'));
    return;
  }

  if(!main || hfBusy) return;
  document.body.classList.add('hfHome');

  hfBusy=true;
  try{
    const d=await hfLoad(force);
    if(!d || !hfIsHome()) return;

    let host=main.querySelector('.hfHost');
    if(!host){
      host=document.createElement('div');
      host.className='hfHost';
      main.prepend(host);
    }else if(main.firstElementChild!==host){
      main.prepend(host);
    }

    const signature=JSON.stringify({
      p:d.profile,m:d.me,l:d.leader,r:d.last_round,pred:d.predictions,
      pulse:{
        divided:d.league_story?.most_divided,
        contra:d.league_story?.top_contrarian,
        exact:d.league_story?.most_exacts_fixture
      }
    });

    if(host.dataset.hfSignature!==signature || !host.innerHTML){
      host.innerHTML=hfHtml(d);
      host.dataset.hfSignature=signature;
      hfWire(host);
    }

    hfPrepareLegacy(host);
  }catch(e){
    console.warn('Home Focus:',e);
  }finally{
    hfBusy=false;
  }
}

function hfSchedule(force=false,delay=160){
  clearTimeout(hfTimer);
  hfTimer=setTimeout(()=>hfApply(force),delay);
}

hfCss();

const hfMain=document.getElementById('main');
if(hfMain){
  new MutationObserver(()=>hfSchedule(false,180))
    .observe(hfMain,{childList:true,subtree:true});
}

document.addEventListener('click',e=>{
  if(e.target.closest?.('#nav button[data-v]')) hfSchedule(false,160);
},true);

window.addEventListener('focus',()=>{
  hfLoadedAt=0;
  hfSchedule(true,180);
});

setInterval(()=>{
  if(hfIsHome()){
    hfLoadedAt=0;
    hfSchedule(true,60000);
  }
},60000);

hfSchedule(true,900);
