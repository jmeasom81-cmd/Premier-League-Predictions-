// PREDICTION COACH V1
// Personal, evidence-based coaching inside the Predict tab.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const pcSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let pcCtx=null;
let pcData=null;
let pcBusy=false;
let pcMode='predictions';
let pcApplying=false;
let pcObsTimer=null;

const pcEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function pcCss(){
  if(document.getElementById('pc-v1-css'))return;
  const s=document.createElement('style');
  s.id='pc-v1-css';
  s.textContent=`
    .pcTabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:rgba(255,255,255,.94);border:1px solid #e7e4ef;border-radius:15px;padding:5px;margin-bottom:11px;box-shadow:0 6px 20px rgba(25,18,65,.05)}
    .pcTab{border:0;border-radius:10px;padding:9px 8px;background:transparent;color:#716c7d;font-size:10px;font-weight:950}
    .pcTab.active{background:#4b269d;color:#fff;box-shadow:0 4px 12px rgba(75,38,157,.18)}
    .pcTeaser{border:1px solid #d9cef5;background:linear-gradient(135deg,#f7f3ff,#fff);border-radius:16px;padding:12px 13px;margin-bottom:11px}
    .pcTeaserTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .pcTeaserTitle{font-size:11px;font-weight:950;color:#241153}
    .pcTeaserText{font-size:9.7px;line-height:1.42;color:#5f596b;margin-top:5px}
    .pcTeaserBtn{border:0;border-radius:9px;padding:7px 9px;background:#eee7ff;color:#4b269d;font-size:8.5px;font-weight:950;white-space:nowrap}
    .pcHero{background:linear-gradient(135deg,#241153,#5a30b4);color:#fff;border-radius:20px;padding:16px;margin-bottom:11px;box-shadow:0 10px 28px rgba(36,17,83,.15)}
    .pcHeroTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    .pcHero h2{margin:0;font-size:19px;color:#fff}
    .pcHero p{font-size:9.7px;line-height:1.45;margin:5px 0 0;color:rgba(255,255,255,.82)}
    .pcHeroBadge{font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;background:rgba(255,255,255,.13);padding:6px 7px;border-radius:999px;white-space:nowrap}
    .pcFour{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:13px}
    .pcMini{background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:9px}
    .pcMini span{display:block;font-size:7.5px;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.66)}
    .pcMini b{display:block;font-size:12px;margin-top:3px;color:#fff}
    .pcCard{background:rgba(255,255,255,.97);border:1px solid #e7e4ef;border-radius:18px;padding:14px;margin-bottom:11px;box-shadow:0 8px 24px rgba(25,18,65,.05)}
    .pcCardHead{display:flex;justify-content:space-between;gap:9px;align-items:flex-start;margin-bottom:8px}
    .pcCardHead h3{font-size:15px;color:#241153;margin:0}
    .pcCardHead small{font-size:8px;color:#817d8d;text-align:right;line-height:1.35}
    .pcClub{border-top:1px solid #efedf3;padding:9px 0;display:flex;justify-content:space-between;gap:10px;align-items:center}
    .pcClub:first-of-type{border-top:0}
    .pcClubName{font-size:10.5px;font-weight:950;color:#342b4a}
    .pcClubMeta{font-size:8.5px;color:#817d8d;margin-top:2px;line-height:1.35}
    .pcClubScore{text-align:right;white-space:nowrap}
    .pcClubScore b{display:block;font-size:12px;color:#241153}
    .pcClubScore span{font-size:8px;color:#817d8d}
    .pcTip{border-top:1px solid #efedf3;padding:10px 0;display:grid;grid-template-columns:29px 1fr;gap:8px}
    .pcTip:first-of-type{border-top:0}
    .pcTipIcon{width:28px;height:28px;border-radius:10px;background:#f0ebff;display:grid;place-items:center;font-size:15px}
    .pcTip b{font-size:10.5px;color:#241153}
    .pcTip p{font-size:9.2px;line-height:1.45;color:#625d6d;margin:3px 0 0}
    .pcWatch{background:#fff9e8;border:1px solid #efd998;border-radius:13px;padding:10px;margin-top:7px}
    .pcWatch.good{background:#edfdf7;border-color:#bee8da}
    .pcWatch b{font-size:10px;color:#342b4a}
    .pcWatch p{font-size:9px;line-height:1.4;color:#6b6472;margin:3px 0 0}
    .pcChangeGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}
    .pcChangeStat{background:#f7f6fa;border-radius:11px;padding:9px;text-align:center}
    .pcChangeStat b{display:block;font-size:15px;color:#241153}
    .pcChangeStat span{font-size:7.5px;color:#817d8d;text-transform:uppercase}
    .pcNote{font-size:8.5px;line-height:1.4;color:#817d8d;margin-top:7px}
    .pcLoading{text-align:center;padding:25px 10px;font-size:10px;color:#817d8d}
    @media(max-width:420px){.pcHero h2{font-size:17px}.pcFour{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(s);
}

function pcPredictActive(){
  return !!document.querySelector('#nav button[data-v="predict"].active');
}

async function pcContext(){
  if(pcCtx)return pcCtx;
  const {data:{session}}=await pcSb.auth.getSession();
  if(!session)return null;

  const {data,error}=await pcSb
    .from('league_members')
    .select('league_id,role,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error)throw error;
  const m=data?.[0];
  if(!m||m.role==='visitor')return null;

  pcCtx={leagueId:m.league_id,userId:session.user.id};
  return pcCtx;
}

async function pcLoad(force=false){
  if(pcBusy)return pcData;
  if(pcData&&!force)return pcData;

  pcBusy=true;
  try{
    const c=await pcContext();
    if(!c)return null;

    const {data,error}=await pcSb.rpc('get_my_prediction_coach',{
      p_league_id:c.leagueId
    });
    if(error)throw error;

    pcData=data||{};
    return pcData;
  }finally{
    pcBusy=false;
  }
}

function pcTabsHtml(active){
  return `<div class="pcTabs" data-pc-tabs>
    <button type="button" class="pcTab ${active==='predictions'?'active':''}" data-pc-mode="predictions">✍️ Predictions</button>
    <button type="button" class="pcTab ${active==='coach'?'active':''}" data-pc-mode="coach">🧠 Prediction Coach</button>
  </div>`;
}

function pcCallLabel(k){
  return k==='home'?'Home wins':k==='draw'?'Draws':'Away wins';
}

function pcValidCalls(d){
  const c=d?.call_accuracy||{};
  return ['home','draw','away']
    .map(k=>({key:k,...(c[k]||{})}))
    .filter(x=>Number(x.calls||0)>=5)
    .sort((a,b)=>Number(a.scoring_pct||0)-Number(b.scoring_pct||0));
}

function pcBuildTips(d){
  const tips=[];
  const season=d?.season||{};
  const recent=d?.recent||{};
  const changes=d?.changes||{};
  const calls=pcValidCalls(d);
  const fav=d?.favourite_score||null;
  const submitted=Number(season.submitted||0);
  const missed=Number(season.missed||0);
  const seasonPct=Number(season.scoring_pct||0);
  const recentPct=Number(recent.scoring_pct||0);
  const predGoals=Number(season.predicted_goals_avg);
  const actualGoals=Number(season.actual_goals_avg);

  if(missed>0){
    tips.push({
      icon:'⏳',
      title:'Protect the easy points first',
      text:`You've missed ${missed} completed ${missed===1?'pick':'picks'} so far. No tactical improvement can recover a fixture that locks blank, so completing every prediction remains priority one.`
    });
  }

  if(Number(changes.changed_fixtures||0)>=3&&Number(changes.net_effect||0)<=-2){
    const loss=Math.abs(Number(changes.net_effect||0));
    tips.push({
      icon:'🧠',
      title:'Your first instinct has been stronger',
      text:`Across ${changes.changed_fixtures} fixtures you changed, the first saved scores would have earned ${loss} more point${loss===1?'':'s'} than the final choices. Change when you have a clear reason, not just because the deadline is getting closer.`
    });
  }else if(Number(changes.changed_fixtures||0)>=3&&Number(changes.net_effect||0)>=2){
    tips.push({
      icon:'🔄',
      title:'Your changes have added value',
      text:`Your changed predictions are net +${changes.net_effect} points versus your first saved scores. Your revisions have worked so far — keep them evidence-led rather than changing for the sake of it.`
    });
  }

  if(calls.length>=2){
    const weak=calls[0],strong=calls[calls.length-1];
    if(Number(strong.scoring_pct)-Number(weak.scoring_pct)>=10){
      tips.push({
        icon:'🎯',
        title:`Re-check your ${pcCallLabel(weak.key).toLowerCase()}`,
        text:`Only ${weak.scored}/${weak.calls} ${pcCallLabel(weak.key).toLowerCase()} have scored (${Math.round(weak.scoring_pct)}%), compared with ${strong.scored}/${strong.calls} for ${pcCallLabel(strong.key).toLowerCase()} (${Math.round(strong.scoring_pct)}%). Slow down on your weakest call type and check the form/H2H before locking it in.`
      });
    }
  }

  if(submitted>=15&&Number.isFinite(predGoals)&&Number.isFinite(actualGoals)){
    const delta=predGoals-actualGoals;
    if(delta<=-0.35){
      tips.push({
        icon:'⚽',
        title:'You lean towards lower scores',
        text:`Your predictions average ${predGoals.toFixed(2)} total goals, while the completed matches you've predicted average ${actualGoals.toFixed(2)}. Consider whether you're shaving a goal off too often in open-looking fixtures.`
      });
    }else if(delta>=0.35){
      tips.push({
        icon:'🥅',
        title:'You lean towards higher scores',
        text:`Your predictions average ${predGoals.toFixed(2)} total goals versus ${actualGoals.toFixed(2)} in the completed matches. In tighter fixtures, consider whether you're adding one goal too many.`
      });
    }
  }

  if(fav&&Number(fav.uses||0)>=5&&Number(fav.exact_pct||0)<=10){
    tips.push({
      icon:'🔢',
      title:`Watch the ${fav.home}–${fav.away} habit`,
      text:`${fav.home}–${fav.away} is your most-used scoreline (${fav.uses} times), but it has landed exactly ${fav.exacts||0} time${Number(fav.exacts||0)===1?'':'s'}. Make sure it isn't becoming a default answer.`
    });
  }

  if(Number(recent.picks||0)>=8&&seasonPct>0){
    if(recentPct>=seasonPct+15){
      tips.push({
        icon:'📈',
        title:'Your recent reads are improving',
        text:`${Math.round(recentPct)}% of your last ${recent.picks} picks have scored, versus ${Math.round(seasonPct)}% across the season. Keep the process that's working rather than chasing more changes.`
      });
    }else if(recentPct<=seasonPct-10){
      tips.push({
        icon:'🔄',
        title:'Reset the process, not the scorelines',
        text:`${Math.round(recentPct)}% of your last ${recent.picks} picks have scored versus ${Math.round(seasonPct)}% across the season. A short dip is a good reason to check form and H2H more carefully — not to make wilder predictions.`
      });
    }
  }

  return tips.slice(0,4);
}

function pcBigOpportunity(d){
  const tips=pcBuildTips(d);
  if(tips.length)return tips[0].title;
  const b=d?.bogey_clubs?.[0];
  if(b)return `${b.club} fixtures`;
  return 'Keep building the sample';
}

function pcStrength(d){
  const b=d?.banker_clubs?.[0];
  if(b&&Number(b.scoring_pct||0)>=60)return b.club;
  const calls=pcValidCalls(d);
  if(calls.length)return pcCallLabel(calls[calls.length-1].key);
  return 'Still emerging';
}

function pcTeaserText(d){
  const watch=Array.isArray(d?.bogey_watch)?d.bogey_watch:[];
  const grouped=new Map();
  watch.forEach(x=>{
    const key=x.fixture_id;
    if(!grouped.has(key))grouped.set(key,[]);
    grouped.get(key).push(x.club);
  });

  const double=[...grouped.entries()].find(([,clubs])=>clubs.length>=2);
  if(double){
    const row=watch.find(x=>x.fixture_id===double[0]);
    return `Bogey-club warning: ${row.home_team} v ${row.away_team} contains ${double[1].join(' and ')} — two clubs you've scored poorly on so far.`;
  }

  if(watch.length){
    const x=watch[0];
    return `${x.club} is one of your current bogey clubs and appears in ${x.home_team} v ${x.away_team}. Worth an extra form/H2H check before you lock it in.`;
  }

  const changes=d?.changes||{};
  if(Number(changes.changed_fixtures||0)>=3&&Number(changes.net_effect||0)<0){
    return `Your first saved predictions are currently outperforming your changed choices by ${Math.abs(changes.net_effect)} points.`;
  }

  const bank=d?.banker_watch?.[0];
  if(bank){
    return `${bank.club} is one of your strongest-read clubs so far and appears in ${bank.home_team} v ${bank.away_team}.`;
  }

  return `Your coach has analysed ${d?.season?.submitted||0} completed predictions and will highlight the strongest patterns worth acting on.`;
}

function pcEnsurePredictionsUi(){
  if(!pcPredictActive()||pcMode!=='predictions')return;
  const main=document.getElementById('main');
  if(!main)return;

  let tabs=main.querySelector('[data-pc-tabs]');
  if(!tabs){
    const wrap=document.createElement('div');
    wrap.innerHTML=pcTabsHtml('predictions');
    tabs=wrap.firstElementChild;
    main.prepend(tabs);
  }

  if(pcData){
    let teaser=main.querySelector('.pcTeaser');
    if(!teaser){
      teaser=document.createElement('div');
      teaser.className='pcTeaser';
      tabs.insertAdjacentElement('afterend',teaser);
    }
    teaser.innerHTML=`<div class="pcTeaserTop">
      <div>
        <div class="pcTeaserTitle">🧠 Coach says</div>
        <div class="pcTeaserText">${pcEsc(pcTeaserText(pcData))}</div>
      </div>
      <button type="button" class="pcTeaserBtn" data-pc-mode="coach">View coach →</button>
    </div>`;
  }else{
    pcLoad(false).then(()=>{
      if(pcMode==='predictions')pcEnsurePredictionsUi();
    }).catch(e=>console.warn('Prediction Coach:',e));
  }
}

function pcClubRows(rows){
  if(!rows?.length){
    return `<div class="pcNote">Not enough completed matches yet. A club needs at least 4 matches in your sample before the coach labels it.</div>`;
  }

  return rows.map((x,i)=>`<div class="pcClub">
    <div>
      <div class="pcClubName">${i+1}. ${pcEsc(x.club)}</div>
      <div class="pcClubMeta">${x.scoring_matches}/${x.matches} matches scored · ${x.exacts} exact${Number(x.exacts)===1?'':'s'}</div>
    </div>
    <div class="pcClubScore">
      <b>${x.points} pts</b>
      <span>${Math.round(Number(x.scoring_pct||0))}% scoring</span>
    </div>
  </div>`).join('');
}

function pcWatchHtml(d){
  const bogeys=Array.isArray(d?.bogey_watch)?d.bogey_watch:[];
  const bankers=Array.isArray(d?.banker_watch)?d.banker_watch:[];

  const byFixture=new Map();
  bogeys.forEach(x=>{
    if(!byFixture.has(x.fixture_id))byFixture.set(x.fixture_id,{...x,clubs:[]});
    byFixture.get(x.fixture_id).clubs.push(x.club);
  });

  const rows=[...byFixture.values()].slice(0,2);
  let html='';

  rows.forEach(x=>{
    html+=`<div class="pcWatch">
      <b>⚠️ ${pcEsc(x.home_team)} v ${pcEsc(x.away_team)}</b>
      <p>${pcEsc(x.clubs.join(' & '))} ${x.clubs.length>1?'are both':'is'} in your bogey-club list. Treat this as a prompt to check the evidence carefully, not as a reason to avoid a particular result.</p>
    </div>`;
  });

  if(!rows.length&&bankers.length){
    const x=bankers[0];
    html+=`<div class="pcWatch good">
      <b>✅ Familiar territory: ${pcEsc(x.club)}</b>
      <p>${pcEsc(x.club)} appears in ${pcEsc(x.home_team)} v ${pcEsc(x.away_team)}. You've scored in ${Math.round(Number(x.scoring_pct||0))}% of completed matches involving them so far.</p>
    </div>`;
  }

  if(!html){
    html=`<div class="pcNote">No strong club-specific warning in the currently open fixtures.</div>`;
  }

  return html;
}

function pcChangesHtml(d){
  const c=d?.changes||{};
  const n=Number(c.changed_fixtures||0);
  if(!n){
    return `<div class="pcNote">You haven't made enough genuine score changes yet for this comparison.</div>`;
  }

  const net=Number(c.net_effect||0);
  const verdict=net>0
    ? `Your final changes are <b>+${net} points</b> versus your first saved scores.`
    : net<0
      ? `Your final changes are <b>${net} points</b> versus your first saved scores.`
      : `Your changes are exactly level with your first saved scores.`;

  return `<div class="pcChangeGrid">
    <div class="pcChangeStat"><b>${n}</b><span>Changed</span></div>
    <div class="pcChangeStat"><b>${c.improved||0}</b><span>Improved</span></div>
    <div class="pcChangeStat"><b>${c.worsened||0}</b><span>Worsened</span></div>
  </div>
  <div class="pcNote">${verdict} This compares the first score you saved with the score that was locked. It doesn't mean changing is inherently good or bad — it shows what has happened to you so far.</div>`;
}

function pcRenderCoach(force=false){
  if(!pcPredictActive())return;
  pcMode='coach';
  const main=document.getElementById('main');
  if(!main)return;

  main.innerHTML=`${pcTabsHtml('coach')}<div class="pcCard"><div class="pcLoading">🧠 Building your personal coach…</div></div>`;

  pcLoad(force).then(d=>{
    if(!d||pcMode!=='coach'||!pcPredictActive())return;

    const season=d.season||{};
    const recent=d.recent||{};
    const tips=pcBuildTips(d);
    const bogey=d.bogey_clubs?.[0]?.club||'Still emerging';
    const strength=pcStrength(d);

    main.innerHTML=`${pcTabsHtml('coach')}
      <div class="pcHero">
        <div class="pcHeroTop">
          <div>
            <h2>🧠 ${pcEsc(d.display_name||'Your')}’s Prediction Coach</h2>
            <p>Personal patterns from your own completed predictions. Use them to challenge your thinking — not as a formula for what score to enter.</p>
          </div>
          <span class="pcHeroBadge">Private</span>
        </div>
        <div class="pcFour">
          <div class="pcMini"><span>Biggest opportunity</span><b>${pcEsc(pcBigOpportunity(d))}</b></div>
          <div class="pcMini"><span>Strongest read</span><b>${pcEsc(strength)}</b></div>
          <div class="pcMini"><span>Bogey club</span><b>${pcEsc(bogey)}</b></div>
          <div class="pcMini"><span>Recent scoring</span><b>${recent.scoring||0}/${recent.picks||0} picks</b></div>
        </div>
      </div>

      <div class="pcCard">
        <div class="pcCardHead"><h3>📅 This Matchweek</h3><small>Personal watchlist</small></div>
        ${pcWatchHtml(d)}
      </div>

      <div class="pcCard">
        <div class="pcCardHead"><h3>👹 Bogey clubs</h3><small>Minimum 4 completed matches</small></div>
        ${pcClubRows(d.bogey_clubs||[])}
      </div>

      <div class="pcCard">
        <div class="pcCardHead"><h3>⭐ Clubs you read well</h3><small>Minimum 4 completed matches</small></div>
        ${pcClubRows(d.banker_clubs||[])}
      </div>

      <div class="pcCard">
        <div class="pcCardHead"><h3>🎯 Ways to find more points</h3><small>Evidence from your season</small></div>
        ${tips.length?tips.map(t=>`<div class="pcTip">
          <div class="pcTipIcon">${t.icon}</div>
          <div><b>${pcEsc(t.title)}</b><p>${pcEsc(t.text)}</p></div>
        </div>`).join(''):`<div class="pcNote">No strong weakness has cleared the evidence threshold yet. Keep predicting and the coach will become more specific.</div>`}
      </div>

      <div class="pcCard">
        <div class="pcCardHead"><h3>🔄 First instinct vs changes</h3><small>First saved score → locked score</small></div>
        ${pcChangesHtml(d)}
      </div>

      <div class="pcCard">
        <div class="pcCardHead"><h3>📊 Current direction</h3><small>Last ${recent.picks||0} completed picks</small></div>
        <div class="pcChangeGrid">
          <div class="pcChangeStat"><b>${recent.points||0}</b><span>Points</span></div>
          <div class="pcChangeStat"><b>${recent.scoring||0}/${recent.picks||0}</b><span>Scored</span></div>
          <div class="pcChangeStat"><b>${recent.exacts||0}</b><span>Exacts</span></div>
        </div>
        <div class="pcNote">Season scoring rate: ${Math.round(Number(season.scoring_pct||0))}%. Recent scoring rate: ${Math.round(Number(recent.scoring_pct||0))}%. Early-season samples can move quickly, so the coach only turns stronger patterns into advice.</div>
      </div>`;
  }).catch(e=>{
    if(pcMode==='coach'){
      main.innerHTML=`${pcTabsHtml('coach')}<div class="pcCard"><div class="pcNote">Couldn’t load Prediction Coach yet: ${pcEsc(e.message||String(e))}</div></div>`;
    }
  });
}

document.addEventListener('click',e=>{
  const coachBtn=e.target.closest?.('[data-pc-mode]');
  if(coachBtn){
    const mode=coachBtn.dataset.pcMode;
    if(mode==='coach'){
      e.preventDefault();
      pcRenderCoach(false);
      return;
    }
    if(mode==='predictions'){
      e.preventDefault();
      pcMode='predictions';
      document.querySelector('#nav button[data-v="predict"]')?.click();
      setTimeout(pcEnsurePredictionsUi,100);
      return;
    }
  }

  const navBtn=e.target.closest?.('#nav button[data-v]');
  if(navBtn)pcMode='predictions';
});

window.addEventListener('focus',()=>{
  pcData=null;
  if(pcPredictActive()){
    if(pcMode==='coach')pcRenderCoach(true);
    else pcEnsurePredictionsUi();
  }
});

new MutationObserver(()=>{
  if(pcApplying)return;
  clearTimeout(pcObsTimer);
  pcObsTimer=setTimeout(()=>{
    if(!pcPredictActive())return;
    pcApplying=true;
    try{
      if(pcMode==='predictions')pcEnsurePredictionsUi();
    }finally{
      pcApplying=false;
    }
  },150);
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

pcCss();
setTimeout(()=>{
  if(pcPredictActive())pcEnsurePredictionsUi();
},700);
