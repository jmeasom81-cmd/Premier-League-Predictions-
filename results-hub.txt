import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const RH_URL='https://jzrbaeyvwagrwukntjbk.supabase.co';
const RH_KEY='sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8';
const rh=createClient(RH_URL,RH_KEY);

let leagueId=null;
let resultsCache=[];
let fetchedAt=0;
let injecting=false;
let currentMode='mine';

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
    .rhHead{background:linear-gradient(135deg,#241153,#151044 72%,#2b176f);color:#fff;padding:calc(16px + env(safe-area-inset-top)) 15px 18px;border-radius:0 0 28px 28px;position:sticky;top:0;z-index:3;box-shadow:0 8px 25px rgba(25,18,65,.18)}
    .rhHeadTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .rhBack{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:10px;padding:8px 11px;font-weight:900}
    .rhEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
    .rhTitle{font-size:23px;line-height:1.05;font-weight:950;margin-top:5px}
    .rhSub{font-size:11px;opacity:.75;margin-top:4px}
    .rhTabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:13px;background:rgba(255,255,255,.1);padding:5px;border-radius:14px}
    .rhTab{border:0;border-radius:10px;padding:9px 8px;background:transparent;color:rgba(255,255,255,.72);font-size:11px;font-weight:950}
    .rhTab.active{background:#fff;color:#241153;box-shadow:0 4px 12px rgba(0,0,0,.14)}
    .rhBody{padding:13px}
    .rhSummary{background:linear-gradient(135deg,#241153,#3a2074);color:#fff;border-radius:20px;padding:15px;margin-bottom:12px;box-shadow:0 8px 24px rgba(25,18,65,.14)}
    .rhSummaryTitle{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-bottom:10px}
    .rhSummaryTitle h2{font-size:17px;margin:0}
    .rhSummaryTitle span{font-size:9px;opacity:.7;font-weight:850;text-transform:uppercase}
    .rhSummaryGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
    .rhSummaryStat{background:rgba(255,255,255,.11);border-radius:13px;padding:10px 4px;text-align:center}
    .rhSummaryStat b{display:block;font-size:21px}
    .rhSummaryStat span{font-size:7.5px;font-weight:900;text-transform:uppercase;opacity:.72}
    .rhWeekPulse{font-size:10px;line-height:1.35;margin-top:10px;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.1)}
    .rhWeek{background:#fff;border:1px solid #e8e7ef;border-radius:18px;margin-bottom:11px;box-shadow:0 8px 24px rgba(25,18,65,.05);overflow:hidden}
    .rhWeek summary{list-style:none;cursor:pointer;padding:13px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px}
    .rhWeek summary::-webkit-details-marker{display:none}
    .rhWeekLeft{min-width:0}
    .rhWeekTitle{font-size:14px;font-weight:950}
    .rhWeekSub{font-size:9px;color:#716f82;font-weight:800;margin-top:2px}
    .rhWeekChevron{font-size:14px;color:#716f82;transition:transform .15s ease}
    .rhWeek[open] .rhWeekChevron{transform:rotate(90deg)}
    .rhWeekBody{border-top:1px solid #eeeef4;padding:4px 12px 10px}
    .rhMineGame{padding:11px 2px;border-top:1px solid #f0eff4}
    .rhMineGame:first-child{border-top:0}
    .rhMineMeta{font-size:8.5px;color:#777487;font-weight:850;text-transform:uppercase}
    .rhMineFixture{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin:6px 0}
    .rhMineTeam{font-size:12px;font-weight:950}
    .rhMineTeam.away{text-align:right}
    .rhMineScore{text-align:center;font-size:23px;font-weight:950;white-space:nowrap}
    .rhMineScore small{display:block;font-size:7.5px;color:#08775c;text-transform:uppercase}
    .rhMineResult{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f7f6fb;border-radius:12px;padding:8px 9px}
    .rhMinePick{font-size:10px;color:#504b5e;font-weight:800}
    .rhPts{white-space:nowrap;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:950;background:#ecebf1;color:#655f70}
    .rhPts.exact{background:#dff9f1;color:#08775c}
    .rhPts.one{background:#fff3c9;color:#7b5a00}
    .rhPts.zero{background:#fde9ec;color:#b52c3c}
    .rhPts.none{background:#eeeeF3;color:#777487}
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
      .rhSummaryGrid{gap:5px}
      .rhSummaryStat b{font-size:18px}
      .rhSummaryStat span{font-size:6.7px}
    }
  `;
  document.head.appendChild(st);
}

async function getSession(){
  const {data:{session}}=await rh.auth.getSession();
  return session||null;
}

async function getLeagueId(){
  if(leagueId) return leagueId;
  const session=await getSession();
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

function myPrediction(h,userId){
  return (h.predictions||[]).find(p=>String(p.user_id)===String(userId))||null;
}

function userStats(rows,userId){
  let points=0,exact=0,outcomes=0,missed=0,noPick=0;
  for(const h of rows){
    const p=myPrediction(h,userId);
    if(!p || p.home_score===null || p.home_score===undefined){
      noPick++;
      continue;
    }
    const pts=Number(p.points)||0;
    points+=pts;
    if(pts===3) exact++;
    else if(pts===1) outcomes++;
    else missed++;
  }
  return {points,exact,outcomes,missed,noPick};
}

function pointsMarkup(p){
  if(!p || p.home_score===null || p.home_score===undefined){
    return `<span class="rhPts none">No pick</span>`;
  }
  const pts=Number(p.points)||0;
  if(pts===3) return `<span class="rhPts exact">+3 pts · Exact</span>`;
  if(pts===1) return `<span class="rhPts one">+1 pt · Outcome</span>`;
  return `<span class="rhPts zero">0 pts</span>`;
}

function myGameMarkup(h,userId){
  const p=myPrediction(h,userId);
  const pick=(!p || p.home_score===null || p.home_score===undefined)
    ? 'No prediction submitted'
    : `Your prediction: ${esc(p.home_score)}–${esc(p.away_score)}`;

  return `<div class="rhMineGame">
    <div class="rhMineMeta">${esc(fmt(h.kickoff_at))}</div>
    <div class="rhMineFixture">
      <div class="rhMineTeam">${esc(h.home_team)}</div>
      <div class="rhMineScore">${esc(h.result_home_score)}–${esc(h.result_away_score)}<small>Full time</small></div>
      <div class="rhMineTeam away">${esc(h.away_team)}</div>
    </div>
    <div class="rhMineResult">
      <div class="rhMinePick">${pick}</div>
      ${pointsMarkup(p)}
    </div>
  </div>`;
}

function myResultsMarkup(rows,userId){
  if(!rows.length) return `<div class="rhEmpty">No completed Premier League results yet.</div>`;

  const season=userStats(rows,userId);
  const weeks=new Map();
  for(const h of rows){
    const key=Number(h.matchweek)||0;
    if(!weeks.has(key)) weeks.set(key,[]);
    weeks.get(key).push(h);
  }
  const ordered=[...weeks.entries()].sort((a,b)=>b[0]-a[0]);
  const [latestWeek,latestRows]=ordered[0];
  const latest=userStats(latestRows,userId);

  const weekMarkup=ordered.map(([mw,weekRows],idx)=>{
    const s=userStats(weekRows,userId);
    const bits=[`${s.points} pts`];
    if(s.exact) bits.push(`${s.exact} exact`);
    if(s.outcomes) bits.push(`${s.outcomes} outcome${s.outcomes===1?'':'s'}`);
    if(s.missed) bits.push(`${s.missed} missed`);
    if(s.noPick) bits.push(`${s.noPick} no pick${s.noPick===1?'':'s'}`);
    return `<details class="rhWeek" ${idx===0?'open':''}>
      <summary>
        <div class="rhWeekLeft">
          <div class="rhWeekTitle">Gameweek ${esc(mw)}</div>
          <div class="rhWeekSub">${esc(bits.join(' · '))}</div>
        </div>
        <div class="rhWeekChevron">›</div>
      </summary>
      <div class="rhWeekBody">${weekRows.map(h=>myGameMarkup(h,userId)).join('')}</div>
    </details>`;
  }).join('');

  return `<div class="rhSummary">
    <div class="rhSummaryTitle"><h2>My season</h2><span>Completed matches</span></div>
    <div class="rhSummaryGrid">
      <div class="rhSummaryStat"><b>${season.points}</b><span>Total pts</span></div>
      <div class="rhSummaryStat"><b>${season.exact}</b><span>Exact</span></div>
      <div class="rhSummaryStat"><b>${season.outcomes}</b><span>Outcomes</span></div>
      <div class="rhSummaryStat"><b>${season.missed}</b><span>Missed</span></div>
    </div>
    <div class="rhWeekPulse">Latest completed gameweek: <b>GW${esc(latestWeek)} · ${latest.points} pts</b>${latest.noPick?` · ${latest.noPick} no pick${latest.noPick===1?'':'s'}`:''}</div>
  </div>${weekMarkup}`;
}

async function renderResultsBody(overlay,rows){
  const body=overlay.querySelector('.rhBody');
  if(!body) return;

  if(currentMode==='all'){
    body.innerHTML=rows.length
      ? rows.map((h,i)=>gameMarkup(h,i===0)).join('')
      : `<div class="rhEmpty">No completed Premier League results yet.</div>`;
    return;
  }

  const session=await getSession();
  if(!session){
    body.innerHTML=`<div class="rhEmpty">Sign in to see My Results.</div>`;
    return;
  }
  body.innerHTML=myResultsMarkup(rows,session.user.id);
}

function bindTabs(overlay,rows){
  overlay.querySelectorAll('.rhTab').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const mode=btn.dataset.mode;
      if(!mode || mode===currentMode) return;
      currentMode=mode;
      overlay.querySelectorAll('.rhTab').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));
      const body=overlay.querySelector('.rhBody');
      if(body) body.innerHTML=`<div class="rhEmpty">Loading…</div>`;
      await renderResultsBody(overlay,rows);
    });
  });
}

async function openResults(){
  addStyles();
  currentMode='mine';
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
        <div><div class="rhEyebrow">James's Predictions League</div><div class="rhTitle">Results</div><div class="rhSub">See how you did, then explore every result and prediction</div></div>
        <button class="rhBack" onclick="window.closePLPResults()">✕</button>
      </div>
      <div class="rhTabs">
        <button class="rhTab active" data-mode="mine">👤 My Results</button>
        <button class="rhTab" data-mode="all">⚽ All Results</button>
      </div>
    </div>
    <div class="rhBody"><div class="rhEmpty">Loading results…</div></div>
  </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow='hidden';

  try{
    const rows=await getResults(true);
    bindTabs(overlay,rows);
    await renderResultsBody(overlay,rows);
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
        <button class="btn secondary small rhAllResults">My results</button>
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
