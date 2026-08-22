import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const RH_URL='https://jzrbaeyvwagrwukntjbk.supabase.co';
const RH_KEY='sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8';
const rh=createClient(RH_URL,RH_KEY);

let leagueId=null;
let resultsCache=[];
let fetchedAt=0;
let injecting=false;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function fmt(i){
  return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short',
    hour:'2-digit',minute:'2-digit'
  }).format(new Date(i));
}

function addStyles(){
  if(document.getElementById('plp-results-hub-css')) return;
  const st=document.createElement('style');
  st.id='plp-results-hub-css';
  st.textContent=`
    #nav.resultsHubReady{grid-template-columns:repeat(8,1fr)!important}
    #nav .resultsHubNav{color:#777487}
    #nav .resultsHubNav.active{color:var(--p2)}
    .rhOverlay{position:fixed;inset:0;z-index:9500;background:#f6f6fb;overflow:auto;padding-bottom:90px}
    .rhShell{max-width:760px;margin:auto;min-height:100vh}
    .rhHead{background:linear-gradient(135deg,#241153,#151044 72%,#2b176f);color:#fff;padding:calc(16px + env(safe-area-inset-top)) 15px 22px;border-radius:0 0 28px 28px;position:sticky;top:0;z-index:3;box-shadow:0 8px 25px rgba(25,18,65,.18)}
    .rhHeadTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .rhBack{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:10px;padding:8px 11px;font-weight:900}
    .rhEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
    .rhTitle{font-size:23px;line-height:1.05;font-weight:950;margin-top:5px}
    .rhSub{font-size:11px;opacity:.75;margin-top:4px}
    .rhBody{padding:13px}
    .rhGame{background:#fff;border:1px solid #e8e7ef;border-radius:18px;padding:14px;margin-bottom:12px;box-shadow:0 8px 24px rgba(25,18,65,.06)}
    .rhGame.latest{background:linear-gradient(135deg,#f3efff,#fff);border-color:#d8ccf3}
    .rhMeta{font-size:9px;color:#716f82;font-weight:850;text-transform:uppercase;letter-spacing:.03em}
    .rhFixture{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:9px 0 7px}
    .rhTeam{font-size:13px;font-weight:950}
    .rhTeam.away{text-align:right}
    .rhScore{font-size:27px;font-weight:950;white-space:nowrap}
    .rhFT{text-align:center;font-size:8px;font-weight:950;color:#08775c;text-transform:uppercase}
    .rhFun{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
    .rhStat{background:#f5f4fa;border-radius:12px;padding:8px 5px;text-align:center}
    .rhStat b{display:block;font-size:17px}
    .rhStat span{font-size:8px;color:#716f82;font-weight:850;text-transform:uppercase}
    .rhLine{font-size:11px;line-height:1.4;color:#504b5e;background:#faf9fd;border-radius:11px;padding:8px 9px;margin-top:8px}
    .rhActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
    .rhPrimary{border:0;border-radius:11px;padding:9px 11px;background:#241153;color:#fff;font-size:11px;font-weight:950}
    .rhLink{display:inline-flex;align-items:center;text-decoration:none;border-radius:11px;padding:9px 11px;background:#edf8ff;color:#176b96;font-size:11px;font-weight:950}
    .rhEmpty{background:#fff;border-radius:18px;padding:20px;text-align:center;color:#716f82}
    .rhLatestHome{border-color:#d8ccf3!important;background:linear-gradient(135deg,rgba(245,240,255,.94),rgba(255,255,255,.92))!important}
    .rhLatestHome .rhFixture{margin:6px 0}
    .rhHomeTitle{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px}
    .rhHomeTitle h2{font-size:17px;margin:0}
    @media(max-width:520px){
      #nav button{font-size:6.8px!important}
      #nav button i{font-size:16px!important}
      .rhBody{padding:11px}
      .rhFun{gap:5px}
      .rhStat b{font-size:16px}
    }
  `;
  document.head.appendChild(st);
}

async function getLeagueId(){
  if(leagueId) return leagueId;
  const {data:{session}}=await rh.auth.getSession();
  if(!session) return null;
  const {data,error}=await rh.from('league_members').select('league_id,status').eq('user_id',session.user.id);
  if(error) throw error;
  leagueId=(data||[]).find(x=>x.status==='active')?.league_id||null;
  return leagueId;
}

async function getResults(force=false){
  const lid=await getLeagueId();
  if(!lid) return [];
  if(!force && resultsCache.length && Date.now()-fetchedAt<20000) return resultsCache;
  const {data,error}=await rh.rpc('get_league_history',{p_league_id:lid,p_limit:200});
  if(error) throw error;
  resultsCache=(data||[])
    .filter(x=>x.result_home_score!==null && x.result_home_score!==undefined)
    .sort((a,b)=>new Date(b.kickoff_at)-new Date(a.kickoff_at));
  fetchedAt=Date.now();
  return resultsCache;
}

function analysisFor(h){
  const preds=(h.predictions||[]).filter(p=>p.home_score!==null && p.home_score!==undefined);
  const total=preds.length;
  const exact=preds.filter(p=>+p.points===3).length;
  const correct=preds.filter(p=>+p.points>0).length;
  const zero=preds.filter(p=>+p.points===0).length;

  const scoreMap=new Map();
  for(const p of preds){
    const k=`${p.home_score}–${p.away_score}`;
    scoreMap.set(k,(scoreMap.get(k)||0)+1);
  }
  const popular=[...scoreMap.entries()].sort((a,b)=>b[1]-a[1])[0];

  const actualOutcome=+h.result_home_score>+h.result_away_score?'H':+h.result_home_score<+h.result_away_score?'A':'D';
  const predictedOutcome=p=>{
    const ph=+p.home_score,pa=+p.away_score;
    return ph>pa?'H':ph<pa?'A':'D';
  };
  const actualBackers=preds.filter(p=>predictedOutcome(p)===actualOutcome).length;

  let line='';
  if(exact){
    line=`🎯 ${exact} ${exact===1?'player nailed':'players nailed'} the exact ${h.result_home_score}–${h.result_away_score}.`;
  }else if(total){
    line=`😬 Nobody landed the exact ${h.result_home_score}–${h.result_away_score}.`;
  }
  if(total && actualBackers===total){
    line += ` Every submitted pick got the outcome right.`;
  }else if(total && actualBackers===0){
    line += ` Nobody predicted the outcome.`;
  }else if(total){
    line += ` ${actualBackers}/${total} got the outcome right.`;
  }

  return {total,exact,correct,zero,popular,line};
}

function youtubeUrl(h){
  if(h.highlight_url) return h.highlight_url;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${h.home_team} ${h.away_team} Premier League highlights Sky Sports`
  )}`;
}

function gameMarkup(h,latest=false){
  const a=analysisFor(h);
  return `<div class="rhGame ${latest?'latest':''}">
    <div class="rhMeta">MW${esc(h.matchweek)} · ${esc(fmt(h.kickoff_at))}</div>
    <div class="rhFixture">
      <div class="rhTeam">${esc(h.home_team)}</div>
      <div><div class="rhScore">${esc(h.result_home_score)}–${esc(h.result_away_score)}</div><div class="rhFT">Full time</div></div>
      <div class="rhTeam away">${esc(h.away_team)}</div>
    </div>
    <div class="rhFun">
      <div class="rhStat"><b>${a.exact}</b><span>Exact</span></div>
      <div class="rhStat"><b>${a.correct}</b><span>Scored points</span></div>
      <div class="rhStat"><b>${a.total}</b><span>Picks</span></div>
    </div>
    ${a.line?`<div class="rhLine">${esc(a.line)}</div>`:''}
    <div class="rhActions">
      <button class="rhPrimary" onclick="window.openPLPMatchCentre&&window.openPLPMatchCentre('${esc(h.fixture_id)}')">📊 Match Centre</button>
      <a class="rhLink" href="${esc(youtubeUrl(h))}" target="_blank" rel="noopener">${h.highlight_url?'▶ Watch highlights':'▶ Find highlights'}</a>
    </div>
  </div>`;
}

async function openResults(){
  addStyles();
  let overlay=document.querySelector('.rhOverlay');
  if(overlay) overlay.remove();

  const nav=document.getElementById('nav');
  if(nav){
    for(const b of nav.querySelectorAll('button')) b.classList.remove('active');
    nav.querySelector('.resultsHubNav')?.classList.add('active');
  }

  overlay=document.createElement('div');
  overlay.className='rhOverlay';
  overlay.innerHTML=`<div class="rhShell">
    <div class="rhHead">
      <div class="rhHeadTop">
        <div><div class="rhEyebrow">James's Predictions League</div><div class="rhTitle">Results & Match Centre</div><div class="rhSub">Every final score · predictions · points · fun analysis · highlights</div></div>
        <button class="rhBack" onclick="window.closePLPResults()">✕</button>
      </div>
    </div>
    <div class="rhBody"><div class="rhEmpty">Loading results…</div></div>
  </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow='hidden';

  try{
    const rows=await getResults(true);
    const body=overlay.querySelector('.rhBody');
    body.innerHTML=rows.length
      ? rows.map((h,i)=>gameMarkup(h,i===0)).join('')
      : `<div class="rhEmpty">No completed Premier League results yet.</div>`;
  }catch(e){
    overlay.querySelector('.rhBody').innerHTML=`<div class="rhEmpty">Could not load results.<br>${esc(e.message||String(e))}</div>`;
  }
}

function closeResults(){
  document.querySelector('.rhOverlay')?.remove();
  document.body.style.overflow='';
  const nav=document.getElementById('nav');
  if(nav){
    nav.querySelector('.resultsHubNav')?.classList.remove('active');
    nav.querySelector('button[data-v="home"]')?.classList.add('active');
  }
}

function addNavButton(){
  const nav=document.getElementById('nav');
  if(!nav || nav.querySelector('.resultsHubNav')) return;
  nav.classList.add('resultsHubReady');

  const b=document.createElement('button');
  b.className='resultsHubNav';
  b.innerHTML='<i>⚽</i>Results';
  b.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    openResults();
  });

  const ai=nav.querySelector('button[data-v="ai"]');
  nav.insertBefore(b,ai||nav.lastElementChild);
}

function isHome(){
  return !!document.querySelector('#nav button[data-v="home"].active');
}

async function injectLatestHome(){
  if(injecting || !isHome()) return;
  const main=document.getElementById('main');
  if(!main || main.querySelector('.rhLatestHome')) return;
  injecting=true;
  try{
    const rows=await getResults();
    if(!rows.length || !isHome()) return;
    const h=rows[0],a=analysisFor(h);

    const card=document.createElement('div');
    card.className='card rhLatestHome';
    card.innerHTML=`<div class="rhHomeTitle"><h2>⚽ Latest result</h2><span class="tiny">MW${esc(h.matchweek)} · Full time</span></div>
      <div class="rhFixture">
        <div class="rhTeam">${esc(h.home_team)}</div>
        <div><div class="rhScore">${esc(h.result_home_score)}–${esc(h.result_away_score)}</div><div class="rhFT">Full time</div></div>
        <div class="rhTeam away">${esc(h.away_team)}</div>
      </div>
      ${a.line?`<div class="rhLine">${esc(a.line)}</div>`:''}
      <div class="rhActions">
        <button class="rhPrimary">📊 Match Centre</button>
        <button class="btn secondary small rhAllResults">All results</button>
        <a class="rhLink" href="${esc(youtubeUrl(h))}" target="_blank" rel="noopener">${h.highlight_url?'▶ Highlights':'▶ Find highlights'}</a>
      </div>`;

    card.querySelector('.rhPrimary').onclick=()=>window.openPLPMatchCentre?.(h.fixture_id);
    card.querySelector('.rhAllResults').onclick=openResults;

    const status=main.querySelector('.predictionStatus.plpEnhancer');
    if(status) status.insertAdjacentElement('afterend',card);
    else main.prepend(card);
  }catch(e){
    console.warn('Latest result card:',e);
  }finally{
    injecting=false;
  }
}

function enhance(){
  addStyles();
  addNavButton();
  injectLatestHome();
}

window.openPLPResults=openResults;
window.closePLPResults=closeResults;

const main=document.getElementById('main');
if(main){
  new MutationObserver(()=>setTimeout(enhance,80)).observe(main,{childList:true,subtree:true});
}
const nav=document.getElementById('nav');
if(nav){
  new MutationObserver(()=>setTimeout(enhance,80)).observe(nav,{attributes:true,subtree:true,attributeFilter:['class']});
}

document.addEventListener('click',e=>{
  if(e.target.closest('#nav button[data-v]')){
    document.querySelector('.rhOverlay')?.remove();
    document.body.style.overflow='';
    setTimeout(enhance,120);
  }
},true);

try{
  rh.channel('plp-results-hub')
    .on('postgres_changes',{event:'*',schema:'public',table:'results'},()=>{
      resultsCache=[];fetchedAt=0;
      setTimeout(()=>{
        document.querySelector('.rhLatestHome')?.remove();
        enhance();
        if(document.querySelector('.rhOverlay')) openResults();
      },400);
    })
    .subscribe();
}catch(e){
  console.warn('Results hub realtime:',e);
}

setInterval(()=>{
  addNavButton();
  if(isHome()) injectLatestHome();
},15000);

enhance();
