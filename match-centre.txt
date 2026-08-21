import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const MC_URL = 'https://jzrbaeyvwagrwukntjbk.supabase.co';
const MC_KEY = 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8';
const mc = createClient(MC_URL, MC_KEY);

const UK = 'Europe/London';
let leagueId = null;
let historyCache = [];
let historyFetchedAt = 0;
let injecting = false;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function fmt(i, opts={}) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK,
    weekday:'short',
    day:'numeric',
    month:'short',
    hour:'2-digit',
    minute:'2-digit',
    ...opts
  }).format(new Date(i));
}

function pct(n,d) {
  return d ? Math.round((n/d)*100) : 0;
}

function outcome(h,a) {
  return h>a ? 'H' : h<a ? 'A' : 'D';
}

function outcomeText(code,f) {
  return code==='H' ? `${f.home_team} win` : code==='A' ? `${f.away_team} win` : 'Draw';
}

function pointsLabel(p) {
  return p===3 ? '3 pts · EXACT' : p===1 ? '1 pt' : '0 pts';
}

function addStyles() {
  if (document.getElementById('plp-match-centre-css')) return;
  const st=document.createElement('style');
  st.id='plp-match-centre-css';
  st.textContent=`
  .mcBtn{background:#241153!important;color:#fff!important}
  .mcOverlay{position:fixed;inset:0;background:#f6f6fb;z-index:9999;overflow:auto;padding-bottom:30px}
  .mcShell{max-width:760px;margin:auto;min-height:100vh}
  .mcHead{background:linear-gradient(135deg,#241153,#151044 72%,#2b176f);color:#fff;padding:calc(14px + env(safe-area-inset-top)) 14px 20px;border-radius:0 0 26px 26px;position:sticky;top:0;z-index:3;box-shadow:0 8px 25px rgba(25,18,65,.18)}
  .mcBack{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:10px;padding:8px 10px;font-weight:900}
  .mcHeadTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .mcEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
  .mcFixture{font-size:21px;font-weight:950;line-height:1.12;margin-top:8px}
  .mcSub{font-size:11px;opacity:.76;margin-top:4px}
  .mcBody{padding:13px}
  .mcCard{background:#fff;border:1px solid #e8e7ef;border-radius:18px;padding:14px;margin-bottom:12px;box-shadow:0 8px 24px rgba(25,18,65,.06)}
  .mcHero{background:linear-gradient(135deg,#f3efff,#fff);border-color:#d8ccf3}
  .mcResultHero{background:linear-gradient(135deg,#e8fff8,#fff);border-color:#b8eedc}
  .mcTitleRow{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px}
  .mcTitleRow h2{font-size:16px;margin:0}
  .mcTitleRow span{font-size:10px;color:#716f82}
  .mcScore{font-size:38px;font-weight:950;text-align:center;margin:8px 0}
  .mcScore small{font-size:11px;display:block;color:#716f82;font-weight:800;margin-bottom:3px}
  .mcGrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
  .mcStat{background:#f5f4fa;border-radius:13px;padding:10px 5px;text-align:center}
  .mcStat b{display:block;font-size:20px}
  .mcStat span{font-size:8.5px;color:#716f82;font-weight:850;text-transform:uppercase}
  .mcOutcome{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}
  .mcOutcome>div{border-radius:12px;background:#f5f4fa;padding:9px 5px;text-align:center}
  .mcOutcome b{display:block;font-size:18px}
  .mcOutcome span{font-size:9px;color:#716f82}
  .mcBar{height:9px;background:#eceaf2;border-radius:999px;display:flex;overflow:hidden;margin:9px 0 5px}
  .mcBar .h{background:#5d39b6}.mcBar .d{background:#c69b1d}.mcBar .a{background:#2585aa}
  .mcTalking{display:grid;gap:7px}
  .mcTalk{background:#f8f7fb;border-radius:12px;padding:9px 10px;font-size:11px;line-height:1.4}
  .mcTalk b{color:#241153}
  .mcGroup{border:1px solid #e8e7ef;border-radius:14px;margin:8px 0;overflow:hidden}
  .mcGroupHead{display:flex;justify-content:space-between;align-items:center;background:#f7f6fb;padding:10px 11px}
  .mcGroupScore{font-size:20px;font-weight:950}
  .mcGroupCount{font-size:10px;color:#716f82;font-weight:900}
  .mcPerson{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 11px;border-top:1px solid #eeeef4}
  .mcPerson:first-child{border-top:0}
  .mcPerson b{font-size:11px}
  .mcTiny{font-size:8.5px;color:#716f82;margin-top:2px}
  .mcPoints{font-size:10px;font-weight:950;white-space:nowrap;border-radius:999px;padding:5px 7px;background:#efeff5}
  .mcPoints.exact{background:#dff9f1;color:#08775c}
  .mcPoints.one{background:#fff3c9;color:#7b5a00}
  .mcPoints.zero{background:#fde9ec;color:#b52c3c}
  .mcChip{display:inline-block;border-radius:999px;background:#f0edf9;padding:5px 8px;font-size:9px;margin:3px 3px 0 0;color:#4f4073;font-weight:850}
  .mcBanner{border-radius:14px;padding:11px 12px;margin-bottom:12px;font-size:11px;line-height:1.4;background:#edf8ff;border:1px solid #c8e6f4;color:#315369}
  .mcBanner.live{background:#fff7d9;border-color:#f1d98d;color:#705600}
  .mcAI{background:linear-gradient(135deg,#f5f0ff,#fbf9ff);border-color:#d8ccf3}
  .mcAiScore{font-size:26px;font-weight:950;margin:6px 0}
  .mcLoader{text-align:center;padding:70px 20px;color:#716f82}
  @media(max-width:520px){.mcBody{padding:11px}.mcFixture{font-size:19px}.mcPerson{padding:8px 9px}}
  `;
  document.head.appendChild(st);
}

async function getLeagueId() {
  if (leagueId) return leagueId;
  const {data:{session}}=await mc.auth.getSession();
  if(!session) return null;
  const {data,error}=await mc.from('league_members').select('league_id,status').eq('user_id',session.user.id);
  if(error) throw error;
  leagueId=(data||[]).find(x=>x.status==='active')?.league_id||null;
  return leagueId;
}

async function getHistory(force=false) {
  const lid=await getLeagueId();
  if(!lid) return [];
  if(!force && historyCache.length && Date.now()-historyFetchedAt<20000) return historyCache;
  const {data,error}=await mc.rpc('get_league_history',{p_league_id:lid,p_limit:200});
  if(error) throw error;
  historyCache=data||[];
  historyFetchedAt=Date.now();
  return historyCache;
}

function buttonFor(id,label='📊 Match Centre') {
  const b=document.createElement('button');
  b.className='btn secondary small mcBtn';
  b.textContent=label;
  b.onclick=()=>window.openPLPMatchCentre(id);
  return b;
}

async function injectButtons() {
  if(injecting) return;
  injecting=true;
  try{
    const hist=await getHistory();
    if(!hist.length) return;

    for(const h of hist){
      const fixture=document.getElementById(`fixture-${h.fixture_id}`);
      if(fixture && !fixture.querySelector('.mcBtn')){
        const actions=fixture.querySelector('.insightActions')||fixture.querySelector('.factions');
        if(actions) actions.appendChild(buttonFor(h.fixture_id));
      }
    }

    const cards=[...document.querySelectorAll('.historyFixture')];
    if(cards.length){
      for(const card of cards){
        if(card.querySelector('.mcBtn')) continue;
        const title=(card.querySelector('.historyHead span')?.textContent||'').trim();
        const match=hist.find(h=>`${h.home_team} v ${h.away_team}`===title);
        if(match){
          const wrap=document.createElement('div');
          wrap.style.marginTop='8px';
          wrap.appendChild(buttonFor(match.fixture_id,'📊 View Match Centre'));
          card.appendChild(wrap);
        }
      }
    }
  }catch(e){
    console.warn('Match Centre button injection:',e);
  }finally{
    injecting=false;
  }
}

function analyse(d){
  const f=d.fixture;
  const all=d.predictions||[];
  const picks=all.filter(x=>x.has_prediction);
  const n=picks.length;
  const missing=all.length-n;

  const out={H:0,D:0,A:0};
  const scoreMap=new Map();
  let sumH=0,sumA=0,over25=0,btts=0,homeCS=0,awayCS=0;

  for(const p of picks){
    out[outcome(+p.home_score,+p.away_score)]++;
    sumH+=+p.home_score; sumA+=+p.away_score;
    if(+p.home_score + +p.away_score >= 3) over25++;
    if(+p.home_score>0 && +p.away_score>0) btts++;
    if(+p.away_score===0) homeCS++;
    if(+p.home_score===0) awayCS++;
    const key=`${p.home_score}–${p.away_score}`;
    if(!scoreMap.has(key)) scoreMap.set(key,[]);
    scoreMap.get(key).push(p);
  }

  const groups=[...scoreMap.entries()].map(([score,people])=>({score,people,count:people.length}))
    .sort((a,b)=>b.count-a.count||a.score.localeCompare(b.score));

  const consensus=[['H',out.H],['D',out.D],['A',out.A]].sort((a,b)=>b[1]-a[1])[0];
  const consensusPct=pct(consensus[1],n);
  const avgH=n?sumH/n:0,avgA=n?sumA/n:0;

  let exact=0,correct=0,totalPoints=0,zero=0;
  if(d.result){
    for(const p of picks){
      const pts=+p.points||0;
      totalPoints+=pts;
      if(pts===3) exact++;
      if(pts>0) correct++;
      if(pts===0) zero++;
    }
  }

  return {
    f,all,picks,n,missing,out,groups,consensusCode:consensus[0],
    consensusPct,avgH,avgA,over25,btts,homeCS,awayCS,
    exact,correct,totalPoints,zero
  };
}

function preMatchTalking(a){
  const {f,n,out,groups,consensusCode,consensusPct,over25,btts,homeCS,awayCS,picks}=a;
  const t=[];
  if(!n) return ['No submitted predictions to analyse.'];

  if(consensusPct===100){
    t.push(`<b>Unanimous:</b> every submitted prediction backs ${esc(outcomeText(consensusCode,f))}.`);
  }else if(consensusPct>=75){
    t.push(`<b>Strong consensus:</b> ${consensusPct}% back ${esc(outcomeText(consensusCode,f))}.`);
  }else if(consensusPct<55){
    t.push(`<b>Split room:</b> there is no clear outcome consensus.`);
  }else{
    t.push(`<b>League lean:</b> ${consensusPct}% back ${esc(outcomeText(consensusCode,f))}.`);
  }

  if(groups[0]){
    t.push(`<b>Crowd favourite:</b> ${esc(groups[0].score)} is the most popular exact score (${groups[0].count} pick${groups[0].count===1?'':'s'}).`);
  }
  if(pct(over25,n)>=75){
    t.push(`<b>Goals expected:</b> ${pct(over25,n)}% predict at least 3 total goals.`);
  }
  if(pct(homeCS,n)>=50){
    t.push(`<b>Clean-sheet club:</b> ${pct(homeCS,n)}% expect ${esc(f.home_team)} to keep a clean sheet.`);
  }else if(pct(awayCS,n)>=50){
    t.push(`<b>Clean-sheet club:</b> ${pct(awayCS,n)}% expect ${esc(f.away_team)} to keep a clean sheet.`);
  }
  if(pct(btts,n)>=70){
    t.push(`<b>Both to score:</b> ${pct(btts,n)}% expect goals at both ends.`);
  }

  const under=picks.filter(p=>+p.home_score + +p.away_score <= 2);
  if(under.length===1 && n>=5){
    t.push(`<b>Lone low-scorer:</b> ${esc(under[0].team_name||under[0].display_name)} is the only player expecting 2 goals or fewer.`);
  }
  const awayAvoid=picks.filter(p=>outcome(+p.home_score,+p.away_score)!=='H');
  if(!awayAvoid.length && n>=3){
    t.push(`<b>No upset takers:</b> nobody has ${esc(f.away_team)} avoiding defeat.`);
  }
  return t.slice(0,6);
}

function resultTalking(d,a){
  if(!d.result) return [];
  const r=d.result,f=a.f,n=a.n,picks=a.picks;
  const actual=outcome(+r.home_score,+r.away_score);
  const t=[];
  if(a.exact>0){
    const names=picks.filter(p=>+p.points===3).map(p=>p.team_name||p.display_name);
    t.push(`<b>🎯 Bullseye:</b> ${a.exact} player${a.exact===1?'':'s'} called ${r.home_score}–${r.away_score} exactly${names.length<=3?` — ${names.map(esc).join(', ')}`:''}.`);
  }else{
    t.push(`<b>🎯 No bullseyes:</b> nobody landed the exact ${r.home_score}–${r.away_score}.`);
  }
  const correctPct=pct(a.correct,n);
  if(correctPct===0) t.push(`<b>😵 Nobody saw it coming:</b> every submitted prediction missed the result.`);
  else if(correctPct<=25) t.push(`<b>😲 Big surprise:</b> only ${correctPct}% earned points from this match.`);
  else if(correctPct>=80) t.push(`<b>✅ Well read:</b> ${correctPct}% of the league earned points.`);
  else t.push(`<b>📈 Hit rate:</b> ${correctPct}% of the league earned at least a point.`);

  const consensusRight=a.consensusCode===actual;
  t.push(`<b>${consensusRight?'✅':'❌'} Consensus:</b> the league’s pre-match call (${esc(outcomeText(a.consensusCode,f))}) ${consensusRight?'was right':'was wrong'}.`);

  const nonExact=picks.filter(p=>+p.points!==3 && p.goal_distance!==null && p.goal_distance!==undefined);
  if(nonExact.length){
    const min=Math.min(...nonExact.map(p=>+p.goal_distance));
    const closest=nonExact.filter(p=>+p.goal_distance===min);
    if(closest.length<=4) t.push(`<b>🤏 Closest miss:</b> ${closest.map(p=>esc(p.team_name||p.display_name)).join(', ')} finished ${min} goal${min===1?'':'s'} away from the exact score.`);
  }

  t.push(`<b>🏆 Points awarded:</b> this one match handed out ${a.totalPoints} league point${a.totalPoints===1?'':'s'}.`);
  return t.slice(0,6);
}

function groupHtml(g,result){
  return `<div class="mcGroup">
    <div class="mcGroupHead">
      <span class="mcGroupScore">${esc(g.score)}</span>
      <span class="mcGroupCount">${g.count} pick${g.count===1?'':'s'}</span>
    </div>
    ${g.people.map(p=>`<div class="mcPerson">
      <span><b>${esc(p.badge||'⚽')} ${esc(p.team_name||p.display_name||'Player')}</b><div class="mcTiny">${esc(p.display_name||'')}</div></span>
      ${result?`<span class="mcPoints ${+p.points===3?'exact':+p.points===1?'one':'zero'}">${pointsLabel(+p.points||0)}</span>`:''}
    </div>`).join('')}
  </div>`;
}

function performanceHtml(a){
  const rows=[...a.picks].sort((x,y)=>(+y.points||0)-(+x.points||0)||(+x.goal_distance||99)-(+y.goal_distance||99)||String(x.team_name).localeCompare(String(y.team_name)));
  const noPicks=a.all.filter(x=>!x.has_prediction);
  return `<div class="mcCard">
    <div class="mcTitleRow"><h2>🏁 How everyone did</h2><span>3 exact · 1 outcome · 0 miss</span></div>
    ${rows.map((p,i)=>`<div class="mcPerson">
      <span><b>${i+1}. ${esc(p.badge||'⚽')} ${esc(p.team_name||p.display_name||'Player')}</b>
      <div class="mcTiny">${esc(p.display_name||'')} · predicted ${p.home_score}–${p.away_score}</div></span>
      <span class="mcPoints ${+p.points===3?'exact':+p.points===1?'one':'zero'}">${pointsLabel(+p.points||0)}</span>
    </div>`).join('')}
    ${noPicks.map(p=>`<div class="mcPerson"><span><b>${esc(p.badge||'⚽')} ${esc(p.team_name||p.display_name||'Player')}</b><div class="mcTiny">${esc(p.display_name||'')}</div></span><span class="mcPoints zero">No pick</span></div>`).join('')}
  </div>`;
}

function renderMatchCentre(d){
  const a=analyse(d),f=a.f,r=d.result,now=Date.now(),started=now>=new Date(f.kickoff_at).getTime();
  const homePct=pct(a.out.H,a.n),drawPct=pct(a.out.D,a.n),awayPct=pct(a.out.A,a.n);
  const preTalk=preMatchTalking(a),postTalk=resultTalking(d,a);

  const ai=d.ai && d.ai.has_prediction ? d.ai : null;

  return `<div class="mcShell">
    <div class="mcHead">
      <div class="mcHeadTop"><button class="mcBack" onclick="closePLPMatchCentre()">← Back</button><span class="mcEyebrow">MATCH CENTRE · MW${f.matchweek}</span></div>
      <div class="mcFixture">${esc(f.home_team)} v ${esc(f.away_team)}</div>
      <div class="mcSub">${fmt(f.kickoff_at)} · predictions revealed after lock</div>
    </div>
    <div class="mcBody">
      ${r
        ? `<div class="mcCard mcResultHero"><div class="mcScore"><small>FINAL SCORE</small>${r.home_score} – ${r.away_score}</div>
            <div class="mcGrid3"><div class="mcStat"><b>${a.exact}</b><span>Exacts</span></div><div class="mcStat"><b>${pct(a.correct,a.n)}%</b><span>Scored points</span></div><div class="mcStat"><b>${a.totalPoints}</b><span>League points</span></div></div></div>`
        : `<div class="mcBanner ${started?'live':''}">${started?'⚽ Match underway — the predictions stay visible and this screen will switch to performance mode as soon as the final result lands.':'🔓 Predictions are locked. Everyone can now compare picks before kick-off.'}</div>`}

      <div class="mcCard mcHero">
        <div class="mcTitleRow"><h2>🔮 What the league thinks</h2><span>${a.n} submitted${a.missing?` · ${a.missing} no pick${a.missing===1?'':'s'}`:''}</span></div>
        <div class="mcOutcome">
          <div><b>${homePct}%</b><span>${esc(f.home_team)} win</span></div>
          <div><b>${drawPct}%</b><span>Draw</span></div>
          <div><b>${awayPct}%</b><span>${esc(f.away_team)} win</span></div>
        </div>
        <div class="mcBar"><span class="h" style="width:${homePct}%"></span><span class="d" style="width:${drawPct}%"></span><span class="a" style="width:${awayPct}%"></span></div>
        <div class="mcGrid3" style="margin-top:10px">
          <div class="mcStat"><b>${a.avgH.toFixed(1)}–${a.avgA.toFixed(1)}</b><span>Average pick</span></div>
          <div class="mcStat"><b>${a.groups.length}</b><span>Scorelines</span></div>
          <div class="mcStat"><b>${a.groups[0]?.score||'—'}</b><span>Most popular</span></div>
        </div>
      </div>

      <div class="mcCard">
        <div class="mcTitleRow"><h2>${r?'🗣️ Match verdict':'🗣️ Talking points'}</h2><span>Generated from league picks</span></div>
        <div class="mcTalking">${(r?postTalk:preTalk).map(x=>`<div class="mcTalk">${x}</div>`).join('')}</div>
      </div>

      ${ai?`<div class="mcCard mcAI"><div class="mcTitleRow"><h2>${esc(ai.badge||'🤖')} ${esc(ai.team_name||'AI')}</h2><span>${r?pointsLabel(+ai.points||0):'AI prediction'}</span></div>
        <div class="mcAiScore">${ai.home_score} – ${ai.away_score}</div>
        ${ai.reasoning?`<div class="mcTiny" style="font-size:10px;line-height:1.45">${esc(ai.reasoning)}</div>`:''}
      </div>`:''}

      ${r?performanceHtml(a):''}

      <div class="mcCard">
        <div class="mcTitleRow"><h2>${r?'📋 What everyone predicted':'👥 Everyone’s predictions'}</h2><span>Grouped by exact score</span></div>
        ${a.groups.map(g=>groupHtml(g,r)).join('')}
        ${a.missing?`<div class="mcGroup"><div class="mcGroupHead"><span class="mcGroupScore">No pick</span><span class="mcGroupCount">${a.missing}</span></div>
          ${a.all.filter(x=>!x.has_prediction).map(p=>`<div class="mcPerson"><span><b>${esc(p.badge||'⚽')} ${esc(p.team_name||p.display_name||'Player')}</b><div class="mcTiny">${esc(p.display_name||'')}</div></span></div>`).join('')}</div>`:''}
      </div>

      <div class="mcCard">
        <div class="mcTitleRow"><h2>⚙️ Prediction patterns</h2><span>Fun extras</span></div>
        <span class="mcChip">${pct(a.over25,a.n)}% predict 3+ goals</span>
        <span class="mcChip">${pct(a.btts,a.n)}% both teams score</span>
        <span class="mcChip">${pct(a.homeCS,a.n)}% ${esc(f.home_team)} clean sheet</span>
        <span class="mcChip">${pct(a.awayCS,a.n)}% ${esc(f.away_team)} clean sheet</span>
        <span class="mcChip">${a.consensusPct}% consensus: ${esc(outcomeText(a.consensusCode,f))}</span>
      </div>
    </div>
  </div>`;
}

window.openPLPMatchCentre=async function(id){
  addStyles();
  let overlay=document.getElementById('plp-match-centre');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='plp-match-centre';
    overlay.className='mcOverlay';
    document.body.appendChild(overlay);
  }
  overlay.style.display='block';
  overlay.innerHTML='<div class="mcLoader">Building Match Centre…</div>';
  document.body.style.overflow='hidden';
  try{
    const {data,error}=await mc.rpc('get_fixture_match_centre',{p_fixture_id:id});
    if(error) throw error;
    overlay.innerHTML=renderMatchCentre(data);
  }catch(e){
    overlay.innerHTML=`<div class="mcShell"><div class="mcHead"><button class="mcBack" onclick="closePLPMatchCentre()">← Back</button></div><div class="mcBody"><div class="mcCard"><b>Match Centre unavailable</b><p style="font-size:12px;color:#716f82">${esc(e.message||String(e))}</p></div></div></div>`;
  }
};

window.closePLPMatchCentre=function(){
  const overlay=document.getElementById('plp-match-centre');
  if(overlay) overlay.style.display='none';
  document.body.style.overflow='';
};

function scheduleInject(){
  clearTimeout(scheduleInject.t);
  scheduleInject.t=setTimeout(injectButtons,120);
}

addStyles();
const main=document.getElementById('main');
if(main) new MutationObserver(scheduleInject).observe(main,{childList:true,subtree:true});
window.addEventListener('focus',()=>{historyFetchedAt=0;scheduleInject()});
setInterval(()=>{historyFetchedAt=0;scheduleInject()},30000);
scheduleInject();
