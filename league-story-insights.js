// LEAGUE STORY INSIGHTS V2
// Stable renderer for richer League Stats.
// Inserts once per League Stats render and never repeatedly removes/rebuilds itself.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const lsiSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let lsiLeagueId = null;
let lsiData = null;
let lsiLoadPromise = null;

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function statsActive(){
  return !!document.querySelector('#nav button[data-v="stats"].active');
}

function leagueTabActive(){
  return !!document.querySelector('.sfTab[data-sf-mode="league"].active');
}

async function getLeagueId(){
  if(lsiLeagueId) return lsiLeagueId;

  const {data:{session}} = await lsiSb.auth.getSession();
  if(!session) return null;

  const {data,error} = await lsiSb
    .from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error) throw error;
  lsiLeagueId = data?.[0]?.league_id || null;
  return lsiLeagueId;
}

async function loadInsights(){
  if(lsiData) return lsiData;
  if(lsiLoadPromise) return lsiLoadPromise;

  lsiLoadPromise = (async()=>{
    const leagueId = await getLeagueId();
    if(!leagueId) return null;

    const {data,error} = await lsiSb.rpc('get_league_story_insights',{
      p_league_id:leagueId
    });

    if(error) throw error;
    lsiData = data || {};
    return lsiData;
  })();

  try{
    return await lsiLoadPromise;
  }finally{
    lsiLoadPromise = null;
  }
}

function row(title,sub,value,valueSub=''){
  return `<div class="sfRow">
    <span><b>${title}</b><small>${sub}</small></span>
    <span class="sfValue">${value}${valueSub?`<small>${valueSub}</small>`:''}</span>
  </div>`;
}

function callLabel(v){
  return v==='home'?'home win':v==='away'?'away win':'draw';
}

function playerName(x){
  return x?.team_name || x?.display_name || 'Player';
}

function crowdCard(d){
  const u=d?.most_unanimous;
  const split=d?.most_divided;
  const trap=d?.consensus_disaster;
  const lone=d?.lone_wolf;

  let rows='';

  if(u){
    rows += row(
      '📣 Most unanimous',
      `${esc(u.home_team)} v ${esc(u.away_team)} · MW${esc(u.matchweek)}`,
      `${esc(u.consensus_pct)}%`,
      `H ${u.home_calls} · D ${u.draw_calls} · A ${u.away_calls}`
    );
  }

  if(split){
    rows += row(
      '⚖️ Most divided',
      `${esc(split.home_team)} v ${esc(split.away_team)} · MW${esc(split.matchweek)}`,
      `${split.home_calls} / ${split.draw_calls} / ${split.away_calls}`,
      'home / draw / away'
    );
  }

  if(trap){
    rows += row(
      '🪤 Consensus disaster',
      `${esc(trap.home_team)} v ${esc(trap.away_team)} · finished ${esc(trap.actual_home)}–${esc(trap.actual_away)}`,
      `${esc(trap.consensus_pct)}%`,
      `backed ${callLabel(trap.majority_call)}`
    );
  }

  if(lone){
    rows += row(
      '🐺 Lone wolf',
      `${esc(lone.home_team)} v ${esc(lone.away_team)} · MW${esc(lone.matchweek)}`,
      '1 correct',
      `${esc(lone.actual_home)}–${esc(lone.actual_away)}`
    );
  }

  if(!rows) return '';

  return `<div class="sfCard lsiStoryCard">
    <div class="sfHead"><h3>🧠 Crowd wisdom</h3><span>Where the league agreed — and where it really didn’t</span></div>
    <div class="sfRows">${rows}</div>
  </div>`;
}

function accuracyCard(d){
  const goal=d?.best_goal_reader;
  const score=d?.closest_score_reader;
  const exact=d?.best_exact_conversion;
  const exactFixture=d?.most_exacts_fixture;

  let rows='';

  if(goal){
    rows += row(
      '⚽ Best goal reader',
      esc(playerName(goal)),
      esc(goal.avg_total_goal_error),
      'avg total-goal error'
    );
  }

  if(score){
    rows += row(
      '🎯 Closest score reader',
      esc(playerName(score)),
      esc(score.avg_score_distance),
      'avg score distance'
    );
  }

  if(exact){
    rows += row(
      '🔬 Exact converter',
      esc(playerName(exact)),
      `${esc(exact.exact_conversion_pct)}%`,
      `${exact.exacts} exacts from ${exact.correct_outcomes} correct outcomes`
    );
  }

  if(exactFixture){
    rows += row(
      '🎉 Exact-score party',
      `${esc(exactFixture.home_team)} v ${esc(exactFixture.away_team)} · ${esc(exactFixture.actual_home)}–${esc(exactFixture.actual_away)}`,
      `${exactFixture.exacts}`,
      'exact predictions'
    );
  }

  if(!rows) return '';

  return `<div class="sfCard lsiStoryCard">
    <div class="sfHead"><h3>🎯 Sharpest eyes</h3><span>Accuracy beyond ordinary league points</span></div>
    <div class="sfRows">${rows}</div>
  </div>`;
}

function personalitiesCard(d){
  const contra=d?.top_contrarian;
  const twins=d?.prediction_twins;
  const steady=d?.most_consistent;
  const wild=d?.most_volatile;

  let rows='';

  if(contra){
    rows += row(
      '🦹 Contrarian king',
      esc(playerName(contra)),
      `${contra.contrarian_hits}/${contra.contrarian_picks}`,
      `${esc(contra.hit_pct)}% right against the crowd`
    );
  }

  if(twins){
    rows += row(
      '👯 Prediction twins',
      `${esc(twins.team_a||twins.display_a)} + ${esc(twins.team_b||twins.display_b)}`,
      `${esc(twins.same_score_pct)}%`,
      `${twins.same_score}/${twins.shared} identical exact score picks`
    );
  }

  if(steady){
    rows += row(
      '🧊 Mr Consistent',
      esc(playerName(steady)),
      `${esc(steady.avg_mw)} pts`,
      `avg MW · variation ${esc(steady.mw_volatility)}`
    );
  }

  if(wild){
    rows += row(
      '🎢 Rollercoaster',
      esc(playerName(wild)),
      `${esc(wild.avg_mw)} pts`,
      `avg MW · variation ${esc(wild.mw_volatility)}`
    );
  }

  if(!rows) return '';

  return `<div class="sfCard lsiStoryCard">
    <div class="sfHead"><h3>🎭 League personalities</h3><span>The patterns that make your group different</span></div>
    <div class="sfRows">${rows}</div>
  </div>`;
}

function buildHtml(d){
  return crowdCard(d)+accuracyCard(d)+personalitiesCard(d);
}

function findInsertionPoint(host){
  const cards=[...host.querySelectorAll(':scope > .sfCard')];

  const records=cards.find(c =>
    (c.querySelector('h3')?.textContent||'').includes('League records')
  );

  if(records) return {mode:'before',node:records};

  const humans=cards.find(c =>
    (c.querySelector('h3')?.textContent||'').includes('Humans vs AI')
  );

  if(humans) return {mode:'before',node:humans};

  return cards.length ? {mode:'after',node:cards[cards.length-1]} : null;
}

async function renderIfReady(){
  if(!statsActive() || !leagueTabActive()) return;

  const host=document.querySelector('.sfHost');
  if(!host) return;

  if(host.querySelector('.lsiStableHost')) return;

  const point=findInsertionPoint(host);
  if(!point) return;

  let d;
  try{
    d=await loadInsights();
  }catch(e){
    console.warn('League Story Insights:',e);
    return;
  }

  if(!d || !statsActive() || !leagueTabActive()) return;

  const currentHost=document.querySelector('.sfHost');
  if(!currentHost || currentHost.querySelector('.lsiStableHost')) return;

  const freshPoint=findInsertionPoint(currentHost);
  if(!freshPoint) return;

  const wrap=document.createElement('div');
  wrap.className='lsiStableHost';
  wrap.innerHTML=buildHtml(d);

  if(freshPoint.mode==='before'){
    freshPoint.node.insertAdjacentElement('beforebegin',wrap);
  }else{
    freshPoint.node.insertAdjacentElement('afterend',wrap);
  }
}

document.addEventListener('click',e=>{
  if(e.target.closest?.('#nav button[data-v="stats"],.sfTab[data-sf-mode="league"]')){
    setTimeout(renderIfReady,250);
    setTimeout(renderIfReady,800);
  }
},true);

// Simple, stable check. Does nothing once the cards already exist.
setInterval(renderIfReady,700);

setTimeout(renderIfReady,1000);
