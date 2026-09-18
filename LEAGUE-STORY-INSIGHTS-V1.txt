// LEAGUE STORY INSIGHTS V1
// Adds richer league-wide stories to the simplified League Stats screen.
// Uses one fast RPC and does not alter scoring, predictions or existing stats logic.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const lsiSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let lsiLeagueId = null;
let lsiData = null;
let lsiLoading = false;
let lsiTimer = null;

const lsiEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function lsiStatsActive(){
  return !!document.querySelector('#nav button[data-v="stats"].active');
}

function lsiLeagueActive(){
  return lsiStatsActive() &&
    !!document.querySelector('.sfTab[data-sf-mode="league"].active');
}

function lsiCallLabel(v){
  return v === 'home' ? 'home win' : v === 'away' ? 'away win' : 'draw';
}

function lsiName(x){
  return x?.team_name || x?.display_name || 'Player';
}

async function lsiContext(){
  if(lsiLeagueId) return lsiLeagueId;

  const { data:{ session } } = await lsiSb.auth.getSession();
  if(!session) return null;

  const { data, error } = await lsiSb
    .from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id', session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error) throw error;
  lsiLeagueId = data?.[0]?.league_id || null;
  return lsiLeagueId;
}

async function lsiLoad(){
  if(lsiData || lsiLoading) return lsiData;
  const leagueId = await lsiContext();
  if(!leagueId) return null;

  lsiLoading = true;
  try{
    const { data, error } = await lsiSb.rpc('get_league_story_insights',{
      p_league_id: leagueId
    });
    if(error) throw error;
    lsiData = data || {};
    return lsiData;
  }finally{
    lsiLoading = false;
  }
}

function lsiRow(title, sub, value, valueSub=''){
  return `<div class="sfRow">
    <span><b>${title}</b><small>${sub}</small></span>
    <span class="sfValue">${value}${valueSub ? `<small>${valueSub}</small>` : ''}</span>
  </div>`;
}

function lsiCrowd(d){
  const u=d.most_unanimous, split=d.most_divided, trap=d.consensus_disaster, lone=d.lone_wolf;
  let rows='';

  if(u){
    rows += lsiRow(
      '📣 Most unanimous',
      `${lsiEsc(u.home_team)} v ${lsiEsc(u.away_team)} · MW${lsiEsc(u.matchweek)}`,
      `${lsiEsc(u.consensus_pct)}%`,
      `H ${u.home_calls} · D ${u.draw_calls} · A ${u.away_calls}`
    );
  }

  if(split){
    rows += lsiRow(
      '⚖️ Perfectly divided',
      `${lsiEsc(split.home_team)} v ${lsiEsc(split.away_team)} · MW${lsiEsc(split.matchweek)}`,
      `${split.home_calls} / ${split.draw_calls} / ${split.away_calls}`,
      'home / draw / away'
    );
  }

  if(trap){
    rows += lsiRow(
      '🪤 Consensus trap',
      `${lsiEsc(trap.home_team)} v ${lsiEsc(trap.away_team)} · finished ${lsiEsc(trap.actual_home)}–${lsiEsc(trap.actual_away)}`,
      `${lsiEsc(trap.consensus_pct)}%`,
      `backed ${lsiCallLabel(trap.majority_call)}`
    );
  }

  if(lone){
    rows += lsiRow(
      '🐺 Lone wolf',
      `${lsiEsc(lone.home_team)} v ${lsiEsc(lone.away_team)} · MW${lsiEsc(lone.matchweek)}`,
      '1 correct',
      `${lsiEsc(lone.actual_home)}–${lsiEsc(lone.actual_away)}`
    );
  }

  return rows ? `<div class="sfCard lsiCard">
    <div class="sfHead"><h3>🧠 Crowd wisdom</h3><span>When the league agreed — and when it really didn’t</span></div>
    <div class="sfRows">${rows}</div>
  </div>` : '';
}

function lsiSharp(d){
  const goal=d.best_goal_reader, score=d.closest_score_reader, exact=d.best_exact_conversion;
  let rows='';

  if(goal){
    rows += lsiRow(
      '⚽ Best goal reader',
      lsiEsc(lsiName(goal)),
      `${lsiEsc(goal.avg_total_goal_error)}`,
      'avg total-goal error'
    );
  }

  if(score){
    rows += lsiRow(
      '🎯 Closest score reader',
      lsiEsc(lsiName(score)),
      `${lsiEsc(score.avg_score_distance)}`,
      'avg score distance'
    );
  }

  if(exact){
    rows += lsiRow(
      '🔬 Exact converter',
      lsiEsc(lsiName(exact)),
      `${lsiEsc(exact.exact_conversion_pct)}%`,
      `${exact.exacts} exacts from ${exact.correct_outcomes} correct outcomes`
    );
  }

  return rows ? `<div class="sfCard lsiCard">
    <div class="sfHead"><h3>🎯 Sharpest eyes</h3><span>Accuracy beyond the normal points table</span></div>
    <div class="sfRows">${rows}</div>
  </div>` : '';
}

function lsiPeople(d){
  const contra=d.top_contrarian, twins=d.prediction_twins, steady=d.most_consistent, wild=d.most_volatile;
  let rows='';

  if(contra){
    rows += lsiRow(
      '🦹 Best contrarian',
      lsiEsc(lsiName(contra)),
      `${contra.contrarian_hits}/${contra.contrarian_picks}`,
      `${lsiEsc(contra.hit_pct)}% right when going against the crowd`
    );
  }

  if(twins){
    rows += lsiRow(
      '👯 Prediction twins',
      `${lsiEsc(twins.team_a || twins.display_a)} + ${lsiEsc(twins.team_b || twins.display_b)}`,
      `${lsiEsc(twins.same_score_pct)}%`,
      `${twins.same_score}/${twins.shared} identical scorelines`
    );
  }

  if(steady){
    rows += lsiRow(
      '🧊 Mr Consistent',
      lsiEsc(lsiName(steady)),
      `${lsiEsc(steady.avg_mw)} pts`,
      `avg MW · variation ${lsiEsc(steady.mw_volatility)}`
    );
  }

  if(wild){
    rows += lsiRow(
      '🎢 Rollercoaster',
      lsiEsc(lsiName(wild)),
      `${lsiEsc(wild.avg_mw)} pts`,
      `avg MW · variation ${lsiEsc(wild.mw_volatility)}`
    );
  }

  return rows ? `<div class="sfCard lsiCard">
    <div class="sfHead"><h3>🎭 League personalities</h3><span>Patterns that make your group different</span></div>
    <div class="sfRows">${rows}</div>
  </div>` : '';
}

function lsiHtml(d){
  return `${lsiCrowd(d)}${lsiSharp(d)}${lsiPeople(d)}`;
}

function lsiPlace(){
  if(!lsiLeagueActive() || !lsiData) return;

  const host=document.querySelector('.sfHost');
  if(!host) return;

  host.querySelector('.lsiHost')?.remove();

  const cards=[...host.querySelectorAll('.sfCard')];
  const records=cards.find(c => (c.querySelector('h3')?.textContent || '').includes('League records'));
  const target=records || cards[cards.length-1];
  if(!target) return;

  const wrap=document.createElement('div');
  wrap.className='lsiHost';
  wrap.innerHTML=lsiHtml(lsiData);

  target.insertAdjacentElement('beforebegin',wrap);
}

async function lsiPrepare(){
  if(!lsiStatsActive()) return;
  try{
    await lsiLoad();
    lsiPlace();
  }catch(e){
    console.warn('League story insights:',e);
  }
}

function lsiSchedule(delay=120){
  clearTimeout(lsiTimer);
  lsiTimer=setTimeout(()=>{
    if(lsiStatsActive()){
      lsiPrepare();
      if(lsiLeagueActive()) lsiPlace();
    }
  },delay);
}

document.addEventListener('click',e=>{
  if(e.target.closest?.('#nav button[data-v="stats"],.sfTab[data-sf-mode="league"]')){
    lsiSchedule(180);
  }
});

const lsiMain=document.getElementById('main');
if(lsiMain){
  new MutationObserver(()=>lsiSchedule(180))
    .observe(lsiMain,{childList:true,subtree:true});
}

lsiSchedule(900);
