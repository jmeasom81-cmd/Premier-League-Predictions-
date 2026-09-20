// SEASON FORECAST V1.2
// Final Premier League table forecast: just for fun.
// Editable until Fri 16 Oct 2026, 22:00 UK. Weekly score never accumulates.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let ctx=null,data=null,loadedAt=0,loading=null,order=[],dirty=false,previousActive=null,timer=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ord=n=>{n=Number(n||0);if(!n)return'–';const s=['th','st','nd','rd'],v=n%100;return`${n}${s[(v-20)%10]||s[v]||s[0]}`};

function fmtDeadline(iso){
  try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}
  catch{return ''}
}
function countdown(iso){
  const ms=new Date(iso).getTime()-Date.now();
  if(ms<=0)return'Locked';
  const mins=Math.floor(ms/60000),d=Math.floor(mins/1440),h=Math.floor((mins%1440)/60),m=mins%60;
  return d?`${d}d ${h}h`:h?`${h}h ${m}m`:`${m}m`;
}

const DOMAINS={
'Arsenal':'arsenal.com','Aston Villa':'avfc.co.uk','AFC Bournemouth':'afcb.co.uk','Brentford':'brentfordfc.com',
'Brighton & Hove Albion':'brightonandhovealbion.com','Chelsea':'chelseafc.com','Coventry City':'ccfc.co.uk',
'Crystal Palace':'cpfc.co.uk','Everton':'evertonfc.com','Fulham':'fulhamfc.com','Hull City':'wearehullcity.co.uk',
'Ipswich Town':'itfc.co.uk','Leeds United':'leedsunited.com','Liverpool':'liverpoolfc.com','Manchester City':'mancity.com',
'Manchester United':'manutd.com','Newcastle United':'newcastleunited.com','Nottingham Forest':'nottinghamforest.co.uk',
'Sunderland':'safc.com','Tottenham Hotspur':'tottenhamhotspur.com'
};
const crest=t=>DOMAINS[t]?`https://www.google.com/s2/favicons?sz=128&domain_url=https://${encodeURIComponent(DOMAINS[t])}`:'';

function css(){
  if(document.getElementById('forecast-v1-css'))return;
  const s=document.createElement('style');s.id='forecast-v1-css';s.textContent=`
  #nav.forecastNavReady{grid-template-columns:repeat(8,1fr)!important}
  #nav.forecastNavReady.resultsHubReady{grid-template-columns:repeat(9,1fr)!important}
  #nav.forecastNavReady.mcNavReady{grid-template-columns:repeat(9,1fr)!important}
  #nav.forecastNavReady.resultsHubReady.mcNavReady{grid-template-columns:repeat(10,1fr)!important}
  #nav .forecastNav{color:#6b36a8}#nav .forecastNav.active{color:#6b36a8!important}
  .fcOverlay{position:fixed;inset:0;background:#f5f4f9;z-index:9870;overflow:auto;padding-bottom:105px}
  .fcShell{max-width:760px;margin:auto;min-height:100vh}
  .fcHead{position:sticky;top:0;z-index:5;color:#fff;background:linear-gradient(135deg,#351153,#5a269b 58%,#873e9f);padding:calc(15px + env(safe-area-inset-top)) 14px 20px;border-radius:0 0 28px 28px;box-shadow:0 8px 25px rgba(25,18,65,.18)}
  .fcHeadTop{display:flex;justify-content:space-between;gap:10px}.fcEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.75}.fcTitle{font-size:24px;font-weight:950;margin-top:5px}.fcSub{font-size:10px;opacity:.78;margin-top:4px}.fcClose{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:10px;padding:8px 11px;font-weight:950}
  .fcBody{padding:12px}.fcCard{background:#fff;border:1px solid #e6e2ed;border-radius:19px;padding:14px;margin-bottom:12px;box-shadow:0 8px 24px rgba(25,18,65,.055)}.fcHero{background:linear-gradient(145deg,#fbf8ff,#fff);border-color:#dfd3f1}
  .fcTitleRow{display:flex;justify-content:space-between;gap:8px;align-items:flex-end;margin-bottom:10px}.fcTitleRow h2,.fcTitleRow h3{margin:0;color:#241153}.fcTitleRow h2{font-size:18px}.fcTitleRow h3{font-size:15px}.fcTitleRow span{font-size:8px;color:#817c8c;text-align:right}
  .fcIntro{font-size:10.5px;color:#575160;line-height:1.5}.fcIntro b{color:#241153}
  .fcRules{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:11px 0}.fcRule{background:#f4f1fa;border-radius:12px;padding:8px 3px;text-align:center}.fcRule b{display:block;color:#4b269d;font-size:15px}.fcRule span{display:block;color:#817b89;font-size:6.8px;font-weight:900;text-transform:uppercase}
  .fcMainBtn{width:100%;border:0;border-radius:13px;background:#5a2ca0;color:#fff;padding:12px;font-size:11px;font-weight:950}.fcMainBtn:disabled{opacity:.5}
  .fcPills{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.fcPill{border-radius:999px;padding:6px 8px;background:#eeeaf6;color:#5c4d72;font-size:8px;font-weight:950}.fcPill.good{background:#e5f8f2;color:#08775c}.fcPill.warn{background:#fff2ca;color:#765900}
  .fcScore{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.fcScore .big{font-size:36px;color:#4b269d;line-height:1}.fcScore .big small{font-size:14px;color:#8a8493}.fcScore p{margin:5px 0 0;font-size:9px;color:#817c8c}.fcMw{text-align:right}.fcMw b{display:block;font-size:17px;color:#241153}.fcMw span{font-size:7px;color:#8f8998;text-transform:uppercase;font-weight:900}
  .fcList{display:grid;gap:6px}.fcRow{display:grid;grid-template-columns:30px 30px minmax(0,1fr) auto;gap:7px;align-items:center;border:1px solid #ebe8f0;border-radius:14px;padding:7px}.fcPlace{width:28px;height:28px;border-radius:9px;background:#f0edf6;color:#4b269d;display:grid;place-items:center;font-size:10px;font-weight:950}.fcCrest{width:28px;height:28px;object-fit:contain}.fcClub{min-width:0;font-size:10px;font-weight:950;color:#2f2940;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fcClub small{display:block;color:#918b99;font-size:7.2px;margin-top:1px}
  .fcControls{display:flex;gap:3px;align-items:center}.fcMove{width:27px;height:27px;border:0;border-radius:8px;background:#f0edf6;color:#5a36a2;font-weight:950}.fcSelect{width:43px;height:27px;border:1px solid #dfdae8;border-radius:8px;background:#fff;font-size:8px;font-weight:900}.fcLocked .fcControls{display:none}
  .fcSave{position:sticky;bottom:82px;z-index:4;margin-top:10px;padding:8px;background:rgba(245,244,249,.94);backdrop-filter:blur(7px);border-radius:15px}.fcSavedNote{text-align:center;font-size:8px;color:#817c8c;line-height:1.4;margin-top:6px}
  .fcLeadRow{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px 0;border-top:1px solid #efedf3}.fcLeadRow:first-child{border-top:0}.fcLeadRank{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#f1eef7;color:#5a36a2;font-size:8px;font-weight:950}.fcLeadName{font-size:10px;font-weight:950;color:#2f2940;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fcLeadName small{display:block;font-size:7px;color:#8f8997}.fcLeadScore{font-size:13px;color:#4b269d;font-weight:950;text-align:right}.fcLeadScore small{display:block;font-size:7px;color:#948e9b}
  .fcLoading,.fcEmpty{text-align:center;padding:24px 12px;color:#817b89;font-size:9px;line-height:1.5}
  .forecastHomeCard{position:relative;overflow:hidden;background:linear-gradient(135deg,#482071,#7137a3 64%,#8d4aac)!important;border:0!important;color:#fff!important}.forecastHomeCard::after{content:"🔮";position:absolute;right:-8px;bottom:-22px;font-size:92px;opacity:.11}.forecastHomeTop{position:relative;z-index:1;display:flex;justify-content:space-between;gap:8px}.forecastHomeEyebrow{font-size:8px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;opacity:.75}.forecastHomeTitle{font-size:17px;font-weight:950;margin-top:3px}.forecastHomeCountdown{text-align:right;background:rgba(255,255,255,.13);border-radius:10px;padding:6px 8px;font-size:8px;font-weight:900}.forecastHomeCountdown b{display:block;font-size:12px}.forecastHomeText{position:relative;z-index:1;font-size:9.5px;line-height:1.45;opacity:.92;margin:9px 0}.forecastHomeChips{position:relative;z-index:1;display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px}.forecastHomeChip{font-size:7px;font-weight:900;border-radius:999px;background:rgba(255,255,255,.12);padding:5px 7px}.forecastHomeBtn{position:relative;z-index:1;border:0;border-radius:10px;background:#fff;color:#4b2377;padding:8px 10px;font-size:9px;font-weight:950}
  .forecastNotice{border-left-color:#6b36a8!important;background:linear-gradient(135deg,#f8f3ff,#f3ecff)!important}
  .forecastNotice h3{color:#35204f!important}
  .forecastNotice .forecastNoticeMeta{font-size:9px;color:#756b80;margin-top:5px;font-weight:850}
  .forecastNotice .forecastNoticeBtn{margin-top:8px}
  @media(max-width:520px){#nav.forecastNavReady.resultsHubReady.mcNavReady button{font-size:5.4px!important}#nav.forecastNavReady.resultsHubReady.mcNavReady button i{font-size:14px!important}.fcBody{padding:10px}.fcRow{grid-template-columns:28px 28px minmax(0,1fr) auto;gap:5px}}
  `;
  document.head.appendChild(s);
}

async function context(){
  if(ctx)return ctx;
  const {data:{session}}=await sb.auth.getSession();if(!session)return null;
  const {data:rows,error}=await sb.from('league_members').select('league_id,status,joined_at').eq('user_id',session.user.id).eq('status','active').order('joined_at',{ascending:false}).limit(1);
  if(error)throw error;if(!rows?.length)return null;
  ctx={userId:session.user.id,leagueId:rows[0].league_id};return ctx;
}

async function load(force=false){
  const c=await context();if(!c)return null;
  if(!force&&data&&Date.now()-loadedAt<20000)return data;
  if(loading)return loading;
  loading=(async()=>{const {data:d,error}=await sb.rpc('get_season_forecast_dashboard',{p_league_id:c.leagueId});if(error)throw error;data=d;loadedAt=Date.now();if(data?.entry?.predicted_order&&!dirty)order=[...data.entry.predicted_order];return data})();
  try{return await loading}finally{loading=null}
}

const currentMap=()=>new Map((data?.current_table||[]).map(x=>[x.club_name,x]));
function preview(){
  const m=currentMap();let total=0;
  order.forEach((club,i)=>{const a=Number(m.get(club)?.position||0),dist=a?Math.abs(i+1-a):99;total+=dist<=4?5-dist:0});
  return total;
}
function rules(){return`<div class="fcRules"><div class="fcRule"><b>5</b><span>Exact</span></div><div class="fcRule"><b>4</b><span>±1</span></div><div class="fcRule"><b>3</b><span>±2</span></div><div class="fcRule"><b>2</b><span>±3</span></div><div class="fcRule"><b>1</b><span>±4</span></div></div>`}

function intro(){
  return`<div class="fcCard fcHero"><div class="fcTitleRow"><h2>🔮 Predict the final table</h2><span>Just for fun</span></div><div class="fcIntro">Rank all <b>20 Premier League clubs</b> from champions to 20th. Change your forecast as often as you like until <b>${esc(fmtDeadline(data.competition.lock_at))}</b>.</div>${rules()}<div class="fcIntro">Maximum score: <b>100 points</b>. After every fully completed matchweek the score is recalculated from scratch — it never accumulates.</div><div class="fcPills"><span class="fcPill warn">⏳ ${esc(countdown(data.competition.lock_at))} to enter</span><span class="fcPill">${Number(data.submitted_count||0)} locked in</span></div><button class="fcMainBtn" data-join style="margin-top:12px">Join the Forecast challenge</button></div>`;
}

function scoreCard(){
  const submitted=!!data.entry?.submitted_at,locked=!!data.competition?.locked;
  return`<div class="fcCard fcHero"><div class="fcScore"><div><div style="font-size:8px;font-weight:950;color:#817c8c;text-transform:uppercase">${Number(data.latest_completed_matchweek||0)>=38?'FINAL SCORE':'IF THE SEASON ENDED TODAY'}</div><b class="big">${preview()}<small>/100</small></b><p>${submitted?'Your saved forecast':'Draft preview'} against the latest fully completed table.</p></div><div class="fcMw"><b>MW${esc(data.latest_completed_matchweek||'–')}</b><span>Snapshot</span></div></div><div class="fcPills">${submitted?'<span class="fcPill good">✓ Forecast locked in</span>':'<span class="fcPill warn">Draft — not locked in</span>'}${locked?'<span class="fcPill">🔒 Final lock reached</span>':`<span class="fcPill">✏️ ${esc(countdown(data.competition.lock_at))} left</span>`}</div></div>`;
}

function row(team,i,locked){
  const cur=currentMap().get(team),img=crest(team);
  return`<div class="fcRow"><div class="fcPlace">${i+1}</div>${img?`<img class="fcCrest" src="${esc(img)}" alt="">`:'<div>⚽</div>'}<div class="fcClub">${esc(team)}<small>Currently ${cur?ord(cur.position):'–'} · ${cur?.points??0} pts</small></div><div class="fcControls"><button class="fcMove" data-up="${i}" ${locked||i===0?'disabled':''}>↑</button><button class="fcMove" data-down="${i}" ${locked||i===order.length-1?'disabled':''}>↓</button><select class="fcSelect" data-move="${i}" ${locked?'disabled':''}>${order.map((_,x)=>`<option value="${x}" ${x===i?'selected':''}>${x+1}</option>`).join('')}</select></div></div>`;
}

function forecastCard(){
  const locked=!!data.competition?.locked;
  return`<div class="fcCard ${locked?'fcLocked':''}"><div class="fcTitleRow"><h3>${locked?'🔒 Your final forecast':'🏆 Your predicted final table'}</h3><span>${locked?'Read only':dirty?'Unsaved changes':'Move any club'}</span></div><div class="fcList">${order.map((t,i)=>row(t,i,locked)).join('')}</div>${!locked?`<div class="fcSave"><button class="fcMainBtn" data-save>${data.entry?.submitted_at?(dirty?'Save forecast changes':'Forecast saved ✓'):'Lock in my forecast'}</button><div class="fcSavedNote">${data.entry?.submitted_at?'You can still reopen and change it before the deadline.':'This confirms your entry. You can still edit before the final lock.'}</div></div>`:''}</div>`;
}

function leaderboard(){
  if(!data.competition?.locked)return`<div class="fcCard"><div class="fcTitleRow"><h3>👥 Forecast field</h3><span>Private until lock</span></div><div class="fcIntro"><b>${Number(data.submitted_count||0)}</b> player${Number(data.submitted_count||0)===1?' has':'s have'} locked in a forecast. The leaderboard opens after the deadline.</div></div>`;
  const rows=data.leaderboard||[];
  return`<div class="fcCard"><div class="fcTitleRow"><h3>🏆 Forecast leaderboard</h3><span>MW${esc(data.latest_completed_matchweek||'–')}</span></div>${rows.length?rows.map(x=>`<div class="fcLeadRow"><div class="fcLeadRank">${x.rank}</div><div class="fcLeadName">${esc(x.badge||'⚽')} ${esc(x.team_name||x.display_name||'Player')}<small>${esc(x.display_name||'')}</small></div><div class="fcLeadScore">${x.score}<small>/100</small></div></div>`).join(''):'<div class="fcEmpty">No completed Forecast entries.</div>'}</div>`;
}

function bodyHtml(){
  if(!data)return'<div class="fcLoading">Loading Forecast…</div>';
  if(!data.active)return'<div class="fcEmpty">Forecast is not active.</div>';
  if(!data.entry)return intro();
  return`${scoreCard()}<div class="fcCard"><div class="fcTitleRow"><h3>🎯 Scoring</h3><span>Never cumulative</span></div>${rules()}<div class="fcIntro">Each fully completed matchweek replaces the previous snapshot score. MW38 becomes the final result.</div></div>${forecastCard()}${leaderboard()}`;
}
function render(){const b=document.querySelector('.fcOverlay .fcBody');if(!b)return;b.innerHTML=bodyHtml();wire()}

function move(from,to){
  if(data?.competition?.locked)return;
  from=Number(from);to=Number(to);if(from===to||from<0||to<0||from>=order.length||to>=order.length)return;
  const [x]=order.splice(from,1);order.splice(to,0,x);dirty=true;render();
}
async function join(){
  const c=await context(),b=document.querySelector('[data-join]');if(b){b.disabled=true;b.textContent='Joining…'}
  try{const {error}=await sb.rpc('join_season_forecast',{p_league_id:c.leagueId});if(error)throw error;data=null;loadedAt=0;dirty=false;await load(true);render();injectHome()}catch(e){alert(e.message||String(e))}
}
async function save(){
  const c=await context(),b=document.querySelector('[data-save]');if(b){b.disabled=true;b.textContent='Saving…'}
  try{const {error}=await sb.rpc('save_season_forecast',{p_league_id:c.leagueId,p_order:order,p_submit:true});if(error)throw error;dirty=false;data=null;loadedAt=0;await load(true);render();injectHome()}catch(e){alert(e.message||String(e))}
}
function wire(){
  const ov=document.querySelector('.fcOverlay');if(!ov)return;
  ov.querySelector('[data-join]')?.addEventListener('click',join);
  ov.querySelector('[data-save]')?.addEventListener('click',save);
  ov.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>move(+b.dataset.up,+b.dataset.up-1)));
  ov.querySelectorAll('[data-down]').forEach(b=>b.addEventListener('click',()=>move(+b.dataset.down,+b.dataset.down+1)));
  ov.querySelectorAll('[data-move]').forEach(s=>s.addEventListener('change',()=>move(+s.dataset.move,+s.value)));
}

async function openForecast(){
  css();document.querySelector('.fcOverlay')?.remove();document.querySelector('.mc3Overlay')?.remove();document.body.style.overflow='';
  const nav=document.getElementById('nav');previousActive=nav?.querySelector('button.active:not(.forecastNav)')||null;
  if(nav){nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));nav.querySelector('.forecastNav')?.classList.add('active')}
  const ov=document.createElement('div');ov.className='fcOverlay';ov.innerHTML=`<div class="fcShell"><div class="fcHead"><div class="fcHeadTop"><div><div class="fcEyebrow">2026/27 · Just for fun</div><div class="fcTitle">🔮 Final Table Forecast</div><div class="fcSub">Predict all 20 finishing positions · 100 points available</div></div><button class="fcClose">✕</button></div></div><div class="fcBody"><div class="fcLoading">Loading Forecast…</div></div></div>`;
  ov.querySelector('.fcClose').onclick=closeForecast;document.body.appendChild(ov);document.body.style.overflow='hidden';
  try{await load(true);if(data?.entry?.predicted_order&&!dirty)order=[...data.entry.predicted_order];render()}catch(e){ov.querySelector('.fcBody').innerHTML=`<div class="fcEmpty"><b>Forecast could not load.</b><br>${esc(e.message||String(e))}</div>`}
}
function closeForecast(){
  document.querySelector('.fcOverlay')?.remove();document.body.style.overflow='';
  const nav=document.getElementById('nav');if(nav){nav.querySelector('.forecastNav')?.classList.remove('active');if(previousActive&&document.contains(previousActive))previousActive.classList.add('active');else nav.querySelector('button[data-v="home"]')?.classList.add('active')}previousActive=null;
}
function ensureNav(){
  const nav=document.getElementById('nav');if(!nav||nav.style.display==='none')return;
  nav.classList.add('forecastNavReady');let b=nav.querySelector('.forecastNav');
  if(!b){b=document.createElement('button');b.className='forecastNav';b.innerHTML='<i>🔮</i>Forecast';b.onclick=e=>{e.preventDefault();e.stopPropagation();openForecast()};const ai=nav.querySelector('button[data-v="ai"]');nav.insertBefore(b,ai||nav.lastElementChild)}
}

function homeMarkup(){
  const lock=data.competition?.lock_at,entry=data.entry,submitted=!!entry?.submitted_at,locked=!!data.competition?.locked;
  let title='Can you predict the final table?',text='Rank all 20 Premier League clubs from 1st to 20th. Score it all season — just for fun.',button='Join Forecast';
  if(entry&&!submitted){title='Your Forecast is waiting';text='Finish arranging all 20 clubs and lock in your prediction before the deadline.';button='Continue forecast'}
  else if(submitted&&!locked){title='Your Forecast is locked in';text=`Current snapshot: ${data.current_score}/100 after MW${data.latest_completed_matchweek}. You can still change it before the final lock.`;button='View / edit forecast'}
  else if(submitted&&locked){title='Forecast competition is live';text=`Current score: ${data.current_score}/100 after MW${data.latest_completed_matchweek}.`;button='Open leaderboard'}
  return`<div class="hfCard forecastHomeCard"><div class="forecastHomeTop"><div><div class="forecastHomeEyebrow">🔮 Final Table Forecast</div><div class="forecastHomeTitle">${esc(title)}</div></div><div class="forecastHomeCountdown"><b>${esc(countdown(lock))}</b>${locked?'entries closed':'until lock'}</div></div><div class="forecastHomeText">${esc(text)}</div><div class="forecastHomeChips"><span class="forecastHomeChip">5 pts exact</span><span class="forecastHomeChip">4 pts ±1</span><span class="forecastHomeChip">100 pts max</span><span class="forecastHomeChip">Fri 16 Oct · 10pm</span></div><button class="forecastHomeBtn" data-home-forecast>${esc(button)} →</button></div>`;
}
async function injectHome(){
  try{
    if(!document.querySelector('#nav button[data-v="home"].active'))return;
    const host=document.querySelector('.hfHost');if(!host)return;
    if(!data||Date.now()-loadedAt>30000)await load(false);if(!data?.active)return;

    const old=host.querySelector('.forecastHomeCard');
    const wrap=document.createElement('div');
    wrap.innerHTML=homeMarkup();
    const card=wrap.firstElementChild;

    // The main-page MutationObserver also watches this card. Replacing an
    // unchanged card caused an endless replace -> mutation -> replace loop.
    if(old && old.outerHTML===card.outerHTML)return;

    const y=window.scrollY;
    if(old)old.replaceWith(card);
    else{
      const pred=host.querySelector('.hfPrediction')?.closest('.hfCard')||host.querySelector('.hfLiveSlot');
      if(pred)pred.insertAdjacentElement('afterend',card);
      else host.appendChild(card);
    }

    card.querySelector('[data-home-forecast]')?.addEventListener('click',openForecast);
    if(old)requestAnimationFrame(()=>window.scrollTo(0,y));
  }catch(e){console.warn('Forecast home:',e)}
}

function noticeMarkup(){
  const locked=!!data?.competition?.locked;
  const entry=data?.entry;
  const submitted=!!entry?.submitted_at;
  const lockAt=data?.competition?.lock_at||'2026-10-16T21:00:00Z';

  let title='🔮 Final Table Forecast is open';
  let body='Rank all 20 Premier League clubs from 1st to 20th. Just for fun — 100 points available.';
  let button='Enter Forecast';

  if(entry&&!submitted){
    title='🔮 Finish your Final Table Forecast';
    body='You’ve joined, but your table is not locked in yet. Finish it before Friday 16 October at 10pm.';
    button='Continue Forecast';
  }else if(submitted&&!locked){
    title='🔮 You’re in the Final Table Forecast';
    body='Your table is saved. Change it as often as you like until Friday 16 October at 10pm.';
    button='Edit Forecast';
  }else if(locked){
    title='🔮 Final Table Forecast — entries locked';
    body='The deadline has passed. Follow your score and the Forecast leaderboard as the season unfolds.';
    button='View Forecast';
  }

  const signature=[title,body,button,locked,submitted,countdown(lockAt)].join('|');

  return `<div class="noticebox rules forecastNotice" data-fc-notice-signature="${esc(signature)}">
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    <div class="forecastNoticeMeta">${locked?'Entries closed':`${esc(countdown(lockAt))} until final lock`} · 5 pts exact · 4 pts ±1 · 3 pts ±2 · 2 pts ±3 · 1 pt ±4</div>
    <div class="noticeaction forecastNoticeBtn"><button class="btn link small" data-notice-forecast>${esc(button)}</button></div>
  </div>`;
}

function injectNoticeImmediate(){
  try{
    if(!document.querySelector('#nav button[data-v="home"].active'))return;

    const noticeCard=[...document.querySelectorAll('#main .card')].find(el=>{
      const h=el.querySelector('.section h2');
      return !!h&&(h.textContent||'').includes('Notice Board');
    });
    if(!noticeCard)return;

    const wrap=document.createElement('div');
    wrap.innerHTML=noticeMarkup();
    const fresh=wrap.firstElementChild;
    const existing=noticeCard.querySelector('.forecastNotice');

    if(existing?.dataset.fcNoticeSignature===fresh.dataset.fcNoticeSignature)return;

    const empty=[...noticeCard.querySelectorAll('.notice')].find(el=>
      (el.textContent||'').trim().toLowerCase()==='no current notices.'
    );
    if(empty)empty.style.display='none';

    if(existing)existing.replaceWith(fresh);
    else{
      const section=noticeCard.querySelector('.section');
      if(section)section.insertAdjacentElement('afterend',fresh);
      else noticeCard.prepend(fresh);
    }

    fresh.querySelector('[data-notice-forecast]')?.addEventListener('click',openForecast);
  }catch(e){console.warn('Forecast notice immediate:',e)}
}

async function refreshForecastDecorations(){
  injectNoticeImmediate();
  try{
    if(!data||Date.now()-loadedAt>30000)await load(false);
    injectNoticeImmediate();
    await injectHome();
  }catch(e){console.warn('Forecast decorations:',e)}
}

function schedule(){clearTimeout(timer);timer=setTimeout(()=>{ensureNav();injectNoticeImmediate();refreshForecastDecorations()},120)}

css();window.openPLPForecast=openForecast;window.closePLPForecast=closeForecast;
const nav=document.getElementById('nav');if(nav)new MutationObserver(schedule).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
const main=document.getElementById('main');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest?.('#nav button[data-v]')){document.querySelector('.fcOverlay')?.remove();document.body.style.overflow='';previousActive=null;setTimeout(schedule,100)}},true);
window.addEventListener('focus',()=>{data=null;loadedAt=0;schedule()});
setInterval(()=>{if(document.querySelector('.fcOverlay')){data=null;loadedAt=0;load(true).then(()=>{if(data?.entry?.predicted_order&&!dirty)order=[...data.entry.predicted_order];render()}).catch(()=>{})}else{injectNoticeImmediate();refreshForecastDecorations()}},60000);
setTimeout(async()=>{try{ensureNav();injectNoticeImmediate();await load(false);injectNoticeImmediate();await injectHome()}catch(e){console.warn('Forecast startup:',e)}},500);
