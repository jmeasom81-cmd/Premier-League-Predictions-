// STATS DRAMA V1
// Shared league-wide Stats stories: regrets, near misses, inspired changes and late-goal swings.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sdSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let sdCtx=null;
let sdData=null;
let sdBusy=false;
let sdTimer=null;

const sdEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function sdCss(){
  if(document.getElementById('stats-drama-v1-css')) return;

  const s=document.createElement('style');
  s.id='stats-drama-v1-css';
  s.textContent=`
    .sdWrap{margin-bottom:13px}
    .sdHeading{display:flex;justify-content:space-between;gap:10px;align-items:flex-end;margin:4px 2px 9px}
    .sdHeading h2{font-size:17px;margin:0;color:#241153}
    .sdHeading span{font-size:8.5px;color:#858190;text-align:right}
    .sdGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .sdCard{background:rgba(255,255,255,.97);border:1px solid #e7e4ef;border-radius:18px;padding:14px;box-shadow:0 8px 24px rgba(25,18,65,.055)}
    .sdCard.regret{border-color:#efcfd5;background:linear-gradient(180deg,#fffafa,#fff)}
    .sdCard.lucky{border-color:#d7e9df;background:linear-gradient(180deg,#f9fffc,#fff)}
    .sdTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .sdTop h3{font-size:15px;margin:0;color:#241153}
    .sdTop small{display:block;font-size:8.5px;color:#858190;margin-top:3px;line-height:1.35}
    .sdMini{font-size:8px;font-weight:950;border-radius:999px;padding:5px 7px;white-space:nowrap}
    .sdCard.regret .sdMini{background:#fdebed;color:#a52b3a}
    .sdCard.lucky .sdMini{background:#e5f8f2;color:#08775c}
    .sdSection{margin-top:13px}
    .sdSectionTitle{font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;color:#716c7d;margin-bottom:6px}
    .sdStory{border-top:1px solid #eeecf3;padding:8px 0}
    .sdStory:first-of-type{border-top:0;padding-top:2px}
    .sdStoryMain{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .sdStoryText{font-size:10.5px;line-height:1.42;color:#403a4d}
    .sdStoryText b{color:#241153}
    .sdImpact{font-size:11px;font-weight:950;white-space:nowrap}
    .sdImpact.bad{color:#b52c3c}.sdImpact.good{color:#08775c}
    .sdMeta{font-size:8.5px;color:#858190;margin-top:3px;line-height:1.35}
    .sdStat{background:#f6f5fa;border-radius:12px;padding:10px;margin-top:8px}
    .sdStat b{font-size:22px;display:block;color:#241153}
    .sdStat span{font-size:9px;color:#716c7d;line-height:1.35}
    .sdLeaderboard{display:grid;gap:5px}
    .sdLeader{display:flex;justify-content:space-between;gap:8px;align-items:center;background:#f8f7fb;border-radius:10px;padding:8px 9px}
    .sdLeader span{font-size:9.5px;color:#514b5e}
    .sdLeader b{font-size:11px;color:#241153;white-space:nowrap}
    .sdEmpty{font-size:9.5px;color:#817d8d;line-height:1.45;background:#f7f6fa;border-radius:11px;padding:9px}
    .sdTracking{font-size:8.5px;color:#817d8d;line-height:1.4;margin-top:8px}
    @media(max-width:620px){.sdGrid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function sdActive(){
  return !!document.querySelector('#nav button[data-v="stats"].active');
}

async function sdContext(){
  if(sdCtx) return sdCtx;

  const {data:{session}}=await sdSb.auth.getSession();
  if(!session) return null;

  const {data,error}=await sdSb
    .from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error) throw error;
  if(!data?.length) return null;

  sdCtx={leagueId:data[0].league_id};
  return sdCtx;
}

async function sdLoad(force=false){
  if(sdBusy) return sdData;
  if(sdData&&!force) return sdData;

  sdBusy=true;
  try{
    const c=await sdContext();
    if(!c) return null;

    const {data,error}=await sdSb.rpc('get_stats_drama',{
      p_league_id:c.leagueId
    });

    if(error) throw error;
    sdData=data||{};
    return sdData;
  }finally{
    sdBusy=false;
  }
}

function sdChangeStory(x,good){
  const impact=Number(good?x.points_gained:x.points_lost)||0;

  return `<div class="sdStory">
    <div class="sdStoryMain">
      <div class="sdStoryText">
        ${sdEsc(x.badge||'⚽')} <b>${sdEsc(x.display_name||x.team_name||'Player')}</b>
        changed <b>${sdEsc(x.before)}</b> → <b>${sdEsc(x.after)}</b>
        for ${sdEsc(x.fixture)}. It finished <b>${sdEsc(x.result)}</b>.
      </div>
      <div class="sdImpact ${good?'good':'bad'}">${good?'+':'−'}${impact} pt${impact===1?'':'s'}</div>
    </div>
    <div class="sdMeta">MW${sdEsc(x.matchweek)}</div>
  </div>`;
}

function sdLateStory(x,good){
  const impact=Number(good?x.points_gained:x.points_lost)||0;
  const min=Number(x.minute)||0;
  const label=min>=90?`${min}' very late goal`:`${min}' late goal`;

  return `<div class="sdStory">
    <div class="sdStoryMain">
      <div class="sdStoryText">
        ${sdEsc(x.badge||'⚽')} <b>${sdEsc(x.display_name||x.team_name||'Player')}</b> had
        <b>${sdEsc(x.prediction)}</b>. A ${sdEsc(label)} moved the score
        ${sdEsc(x.score_before)} → <b>${sdEsc(x.final_score)}</b> in ${sdEsc(x.fixture)}.
      </div>
      <div class="sdImpact ${good?'good':'bad'}">${good?'+':'−'}${impact} pt${impact===1?'':'s'}</div>
    </div>
    <div class="sdMeta">MW${sdEsc(x.matchweek)} · late-goal swing</div>
  </div>`;
}

function sdNearMissStory(x){
  return `<div class="sdStory">
    <div class="sdStoryText">
      ${sdEsc(x.badge||'⚽')} <b>${sdEsc(x.display_name||x.team_name||'Player')}</b> went
      ${sdEsc(x.prediction)} for ${sdEsc(x.fixture)} — it finished <b>${sdEsc(x.result)}</b>.
    </div>
    <div class="sdMeta">MW${sdEsc(x.matchweek)} · one goal from an exact</div>
  </div>`;
}

function sdRegretCard(d){
  const box=d?.what_could_have_been||{};
  const changes=Array.isArray(box.changed_predictions_lost)?box.changed_predictions_lost:[];
  const late=Array.isArray(box.late_goal_losses)?box.late_goal_losses:[];
  const near=Array.isArray(box.one_goal_from_exact)?box.one_goal_from_exact:[];
  const count=Number(box.one_goal_from_exact_count)||0;

  return `<div class="sdCard regret">
    <div class="sdTop">
      <div>
        <h3>💔 What Could Have Been</h3>
        <small>The decisions and fine margins that left points behind.</small>
      </div>
      <span class="sdMini">REGRETS</span>
    </div>

    <div class="sdSection">
      <div class="sdSectionTitle">Changed it… and paid the price</div>
      ${changes.length
        ? changes.slice(0,3).map(x=>sdChangeStory(x,false)).join('')
        : `<div class="sdEmpty">No completed prediction change has cost points yet.</div>`}
    </div>

    <div class="sdSection">
      <div class="sdSectionTitle">Late heartbreak</div>
      ${late.length
        ? late.slice(0,3).map(x=>sdLateStory(x,false)).join('')
        : `<div class="sdEmpty">Late-goal tracking is now live. When an 80'+ goal changes someone's prediction points, the story will appear here.</div>`}
    </div>

    <div class="sdStat">
      <b>${count}</b>
      <span>league predictions have been just <strong>one goal away</strong> from turning a 1-point outcome into an exact 3-pointer.</span>
    </div>

    ${near.length?`<div class="sdSection">
      <div class="sdSectionTitle">Recent near misses</div>
      ${near.slice(0,3).map(sdNearMissStory).join('')}
    </div>`:''}
  </div>`;
}

function sdLuckyCard(d){
  const box=d?.lucky_or_psychic||{};
  const changes=Array.isArray(box.changed_predictions_won)?box.changed_predictions_won:[];
  const late=Array.isArray(box.late_goal_wins)?box.late_goal_wins:[];
  const first=Array.isArray(box.first_call_exacts)?box.first_call_exacts:[];

  return `<div class="sdCard lucky">
    <div class="sdTop">
      <div>
        <h3>🔮 Lucky or Psychic?</h3>
        <small>Inspired switches, late rescues and calls that looked clever from the start.</small>
      </div>
      <span class="sdMini">GENIUS?</span>
    </div>

    <div class="sdSection">
      <div class="sdSectionTitle">Inspired changes</div>
      ${changes.length
        ? changes.slice(0,3).map(x=>sdChangeStory(x,true)).join('')
        : `<div class="sdEmpty">No completed prediction change has gained points yet.</div>`}
    </div>

    <div class="sdSection">
      <div class="sdSectionTitle">Late rescue</div>
      ${late.length
        ? late.slice(0,3).map(x=>sdLateStory(x,true)).join('')
        : `<div class="sdEmpty">When an 80'+ goal turns a prediction into points, it will be recorded here.</div>`}
    </div>

    <div class="sdSection">
      <div class="sdSectionTitle">Called it from the start</div>
      ${first.length?`<div class="sdLeaderboard">
        ${first.slice(0,5).map((x,i)=>`<div class="sdLeader">
          <span>${i+1}. ${sdEsc(x.badge||'⚽')} ${sdEsc(x.display_name||x.team_name||'Player')}</span>
          <b>${Number(x.exact_from_first_save)||0} exact${Number(x.exact_from_first_save)===1?'':'s'}</b>
        </div>`).join('')}
      </div>`:`<div class="sdEmpty">This leaderboard will build as more exact scores land.</div>`}
    </div>
  </div>`;
}

function sdHtml(d){
  return `<div class="sdWrap">
    <div class="sdHeading">
      <h2>🎭 Fine Margins</h2>
      <span>Shared league stories · everyone sees the same section</span>
    </div>
    <div class="sdGrid">
      ${sdRegretCard(d)}
      ${sdLuckyCard(d)}
    </div>
    <div class="sdTracking">Late-goal stories use recorded live-score changes from 80 minutes onward. Prediction-change stories use the saved audit history and locked prediction.</div>
  </div>`;
}

function sdPlace(host){
  const playerHost=document.querySelector('#main .ljs2-playerHost');
  if(playerHost){
    playerHost.insertAdjacentElement('beforebegin',host);
    return;
  }

  const statsHead=[...document.querySelectorAll('#main .card .section h2')]
    .find(x=>x.textContent.replace('📊','').trim()==='Stats');

  if(statsHead){
    statsHead.closest('.card')?.insertAdjacentElement('afterend',host);
  }
}

async function sdInject(force=false){
  if(!sdActive()) return;

  const main=document.getElementById('main');
  if(!main) return;

  let host=main.querySelector('.sdHost');

  if(host){
    const playerHost=main.querySelector('.ljs2-playerHost');
    if(playerHost&&host.nextElementSibling!==playerHost){
      playerHost.insertAdjacentElement('beforebegin',host);
    }
    if(!force) return;
  }

  if(!host){
    host=document.createElement('div');
    host.className='sdHost';
    host.innerHTML=`<div class="sdCard"><div class="sdEmpty">Building the league's fine-margin stories…</div></div>`;
    sdPlace(host);
    if(!host.isConnected) return;
  }

  try{
    const d=await sdLoad(force);
    if(host.isConnected&&d) host.innerHTML=sdHtml(d);
  }catch(e){
    if(host.isConnected){
      host.innerHTML=`<div class="sdCard"><div class="sdEmpty">Couldn’t load Fine Margins yet.<br>${sdEsc(e.message||String(e))}</div></div>`;
    }
  }
}

sdCss();

setTimeout(()=>sdInject(false),900);

new MutationObserver(()=>{
  clearTimeout(sdTimer);
  sdTimer=setTimeout(()=>sdInject(false),180);
}).observe(document.body,{childList:true,subtree:true});

window.addEventListener('focus',()=>{
  if(sdActive()){
    sdData=null;
    sdInject(true);
  }
});

setInterval(()=>{
  if(sdActive()){
    sdData=null;
    sdInject(true);
  }
},60000);
