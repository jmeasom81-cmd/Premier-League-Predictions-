// STATS CLARITY V1 - simplify player stats into clear football-language summaries
// Works for every selected human player and keeps Stats Evidence tap-through details.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const scSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let scCtx=null,scProfiles=null,scProfilesAt=0,scBusy=false,scTimer=null;

const scEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const scOrd=n=>{
  n=+n||0;
  const s=['th','st','nd','rd'],v=n%100;
  return `${n}${s[(v-20)%10]||s[v]||s[0]}`;
};
const scRound=n=>{
  const x=Number(n||0);
  if(Math.abs(x)<0.05)return 0;
  return Math.round(x);
};
const scPlural=(n,one,many=one+'s')=>Number(n)===1?one:many;

function scCss(){
  if(document.getElementById('sc-v1-css'))return;
  const s=document.createElement('style');
  s.id='sc-v1-css';
  s.textContent=`
    .scv1-sub{display:block;font-size:7.5px!important;line-height:1.25;margin-top:2px;color:#8a8695!important;text-transform:none!important;font-weight:750!important}
    .scv1-story{background:#f7f5fc;border:1px solid #e6e0f2;border-radius:13px;padding:10px 11px;margin-top:8px;font-size:10px;line-height:1.45;color:#514b60}
    .scv1-story b{color:#241153}
    .scv1-run{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
    .scv1-run .ljs2-pill{padding:7px 9px}
    .scv1-note{background:#fff8df;border:1px solid #f0dda2;border-radius:13px;padding:10px 11px;margin-top:12px;font-size:9.5px;line-height:1.45;color:#62583b}
    .scv1-note b{color:#654d00}
  `;
  document.head.appendChild(s);
}

function scActive(){
  return !!document.querySelector('#nav button[data-v="stats"].active');
}

async function scContext(){
  if(scCtx)return scCtx;
  const {data:{session}}=await scSb.auth.getSession();
  if(!session)return null;
  const {data,error}=await scSb.from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);
  if(error)throw error;
  if(!data?.length)return null;
  scCtx={userId:session.user.id,leagueId:data[0].league_id};
  return scCtx;
}

async function scLoadProfiles(force=false){
  const c=await scContext();
  if(!c)return null;
  if(!force&&scProfiles&&Date.now()-scProfilesAt<12000)return scProfiles;
  const {data,error}=await scSb.rpc('get_player_stats_profiles',{p_league_id:c.leagueId});
  if(error)throw error;
  scProfiles=data||{};
  scProfilesAt=Date.now();
  return scProfiles;
}

function scSelected(host){
  return host?.querySelector('[data-stats-user]')?.value||'';
}

function scPlayer(data,userId){
  return (data?.players||[]).find(x=>String(x.user_id)===String(userId))||null;
}

function scStat(value,label,key,sub=''){
  return `<div class="ljs2-stat sev-click" data-sev-key="${scEsc(key)}" tabindex="0" role="button">
    <b>${scEsc(value)}</b><span>${scEsc(label)}</span>${sub?`<span class="scv1-sub">${scEsc(sub)}</span>`:''}
  </div>`;
}

function scPill(text,key,kind='neutral'){
  return `<span class="ljs2-pill ${kind} sev-click" data-sev-key="${scEsc(key)}" tabindex="0" role="button">${scEsc(text)}</span>`;
}

function scPatchPlayer(host,p){
  const card=host.querySelector('.ljs2-player');
  if(!card)return;

  const grid=card.querySelector('.ljs2-grid');
  if(grid){
    grid.innerHTML=[
      scStat(scOrd(p.current_position),'Position','position'),
      scStat(p.points??0,'Points','points'),
      scStat(p.exacts??0,'Exact scores','exacts'),
      scStat(`${p.scoring_picks??0}/${p.predictions_scored??0}`,'Picks scoring','scoring_fixtures',`${Math.round(+p.scoring_pct||0)}% earned points`),
      scStat(p.longest_scoring_streak??0,'Best scoring run','best_scoring',`${scPlural(p.longest_scoring_streak,'match','matches')}`),
      scStat(p.missed??0,'Missed picks','missed')
    ].join('');
  }

  const against=[...card.querySelectorAll('.ljs2-title')].find(x=>(x.textContent||'').includes('Against the league'));
  const pills=against?.nextElementSibling;
  if(pills?.classList.contains('ljs2-pills')){
    const pos=+p.current_position||0, count=+p.player_count||0;
    const vs=scRound(p.points_vs_league_average);
    const ev=scRound(p.exacts_vs_league_average);
    const arr=[];

    if(pos===1){
      arr.push(scPill('🏆 League leader','position','good'));
      if(count>1)arr.push(scPill(`Beating all ${count-1} rivals`,'ahead_pct','good'));
    }else{
      arr.push(scPill(`${scOrd(pos)} of ${count||'–'}`,'position','neutral'));
      arr.push(scPill(`${p.gap_to_leader??0} ${scPlural(p.gap_to_leader,'pt')} behind leader`,'gap_leader','neutral'));
      arr.push(scPill(`${p.gap_to_above??0} ${scPlural(p.gap_to_above,'pt')} to next place`,'gap_above','neutral'));
    }

    if(vs!==0)arr.push(scPill(`${Math.abs(vs)} ${scPlural(Math.abs(vs),'pt')} ${vs>0?'above':'below'} league avg`,'points_vs_avg',vs>0?'good':'bad'));
    else arr.push(scPill('Level with league avg','points_vs_avg','neutral'));

    if(ev!==0)arr.push(scPill(`${Math.abs(ev)} ${scPlural(Math.abs(ev),'exact')} ${ev>0?'above':'below'} avg`,'exacts_vs_avg',ev>0?'good':'bad'));
    else arr.push(scPill('Level on exacts','exacts_vs_avg','neutral'));

    pills.innerHTML=arr.join('');
  }

  const boxes=card.querySelectorAll('.ljs2-two .ljs2-box');
  boxes.forEach(box=>{
    const h=(box.querySelector('h4')?.textContent||'').toLowerCase();
    const para=box.querySelector('p');
    if(h.includes('season high')&&para)para.textContent='Best position reached';
    if(h.includes('season low')&&para)para.textContent='Lowest position reached';
  });
}

function scPatchForm(host,p){
  const card=[...host.querySelectorAll('.ljs2-card')].find(c=>{
    const h=c.querySelector('h3');
    return h&&(/current form|last 5 predictions/i).test(h.textContent||'');
  });
  if(!card)return;

  const title=card.querySelector('.ljs2-title');
  if(title){
    const h=title.querySelector('h3'),sm=title.querySelector('small');
    if(h)h.textContent='🔥 Last 5 predictions';
    if(sm)sm.textContent='Most recent completed picks';
  }

  const s3=card.querySelector('.sev-summary3');
  if(s3){
    s3.innerHTML=[
      scStat(p.last5_points??0,'Pts from last 5','last5_points'),
      scStat(`${p.last5_scoring??0}/5`,'Picks scoring','last5_scoring'),
      scStat(p.last5_exacts??0,'Exact scores','last5_exacts')
    ].join('');
  }

  const s4=card.querySelector('.sev-summary4');
  if(s4){
    const cur=+p.current_scoring_streak||0;
    const best=+p.longest_scoring_streak||0;
    const bestExact=+p.longest_exact_streak||0;
    const items=[
      scStat(cur>=2?cur:'—','Current scoring run','current_scoring',cur>=2?`${cur} straight scoring picks`:'No active run of 2+'),
      scStat(best,'Best scoring run','best_scoring',`${best} straight scoring picks`)
    ];
    if(bestExact>=2)items.push(scStat(bestExact,'Best exact run','best_exact',`${bestExact} exacts in a row`));
    s4.innerHTML=items.join('');
  }

  const oldGrid=card.querySelector('.ljs2-grid');
  if(oldGrid&&!card.querySelector('.sev-summary3')){
    oldGrid.style.display='none';
  }

  const hint=[...card.querySelectorAll('.sev-hint')].find(x=>(x.textContent||'').includes('Tap any number'));
  if(hint)hint.innerHTML='<b>Tap a stat</b> to see the matches behind it.';
}

function scPatchMatchweek(host,p,data){
  const card=[...host.querySelectorAll('.ljs2-card')].find(c=>(c.querySelector('h3')?.textContent||'').includes('Matchweek performance'));
  if(!card)return;
  const closed=+data.closed_matchweeks||0;
  const grid=card.querySelector('.ljs2-grid');
  if(grid){
    grid.innerHTML=[
      scStat(p.matchweek_wins??0,'Round wins','mw_wins'),
      scStat(p.top_three_finishes??0,'Top 3 rounds','top3'),
      scStat(`${p.weeks_above_average??0}/${closed||0}`,'Above league avg','above_avg')
    ].join('');
  }

  const pills=card.querySelector('.ljs2-pills');
  if(pills){
    const mws=p.matchweeks||[];
    const last=mws[mws.length-1];
    const mv=+p.last_mw_movement||0;
    const moveText=last
      ? `MW${last.matchweek}: ${mv>0?`climbed ${mv}`:mv<0?`fell ${Math.abs(mv)}`:'no table move'}`
      : 'No completed round yet';
    pills.innerHTML=
      scPill(moveText,'last_mw_move','neutral')+
      scPill(`${Number(p.avg_points_per_matchweek||0).toFixed(1).replace('.0','')} pts per completed MW`,'avg_mw','neutral');
  }

  card.querySelectorAll('.ljs2-row').forEach(row=>{
    const b=row.querySelector('span b');
    const label=(b?.textContent||'').trim();
    const right=[...row.children].find((x,i)=>i===1);
    if(label==='Best round'&&p.best_matchweek&&right){
      right.innerHTML=`<b>${p.best_matchweek.points} pts</b><small>${scOrd(p.best_matchweek.position)} that week</small>`;
    }
    if(label==='Lowest round'&&p.worst_matchweek&&right){
      right.innerHTML=`<b>${p.worst_matchweek.points} pts</b><small>${scOrd(p.worst_matchweek.position)} that week</small>`;
    }
  });

  const titleSmall=card.querySelector('.ljs2-title small');
  if(titleSmall)titleSmall.textContent=`${closed} completed ${scPlural(closed,'round')}`;
}

function scCallBox(label,key,c){
  const calls=+c?.calls||0, scored=+c?.scored||0, pct=+c?.scoring_pct||0;
  return `<div class="ljs2-box sev-click" data-sev-key="${key}" tabindex="0" role="button">
    <h4>${label}</h4><b>${scored}/${calls} scored</b><p>${Math.round(pct)}% earned points</p>
  </div>`;
}

function scFindTitle(card,text){
  return [...card.querySelectorAll('.ljs2-title')].find(x=>(x.querySelector('h3')?.textContent||'').includes(text));
}

function scPatchBreakdown(host,p,data){
  const card=[...host.querySelectorAll('.ljs2-card')].find(c=>(c.querySelector('h3')?.textContent||'').includes('How the points were won'));
  if(!card)return;

  const pointsTitle=scFindTitle(card,'How the points were won');
  if(pointsTitle?.querySelector('small')){
    pointsTitle.querySelector('small').textContent=`${p.predictions_scored??0} completed picks`;
  }

  const callTitle=scFindTitle(card,'Call accuracy');
  const callGrid=callTitle?.nextElementSibling;
  if(callGrid?.classList.contains('ljs2-two')){
    const calls=p.call_accuracy||{};
    callGrid.innerHTML=[
      scCallBox('Home win calls','call_home',calls.home||{}),
      scCallBox('Draw calls','call_draw',calls.draw||{}),
      scCallBox('Away win calls','call_away',calls.away||{}),
      `<div class="ljs2-box sev-click" data-sev-key="exact_rate" tabindex="0" role="button">
        <h4>Exact scores</h4><b>${p.exacts??0}/${p.predictions_scored??0}</b><p>${Math.round(+p.exact_pct||0)}% exactly right</p>
      </div>`
    ].join('');
  }

  const clubTitle=scFindTitle(card,'Club reads');
  const clubBody=clubTitle?.nextElementSibling;
  const dnaTitle=scFindTitle(card,'Prediction DNA');
  const dnaBody=dnaTitle?.nextElementSibling;
  const closed=+data.closed_matchweeks||0;

  let note=card.querySelector('.scv1-note');
  if(closed<5){
    if(clubTitle)clubTitle.style.display='none';
    if(clubBody)clubBody.style.display='none';
    if(dnaTitle)dnaTitle.style.display='none';
    if(dnaBody)dnaBody.style.display='none';
    if(!note){
      note=document.createElement('div');
      note.className='scv1-note';
      note.innerHTML='<b>More detailed patterns unlock after MW5.</b> Club reads and prediction tendencies need a bigger sample before they are worth showing.';
      callGrid?.after(note);
    }
  }else{
    if(clubTitle)clubTitle.style.display='';
    if(clubBody)clubBody.style.display='';
    if(dnaTitle)dnaTitle.style.display='';
    if(dnaBody)dnaBody.style.display='';
    note?.remove();

    if(dnaBody?.classList.contains('ljs2-pills')){
      const st=p.prediction_style||{};
      const sum=(+st.home||0)+(+st.draw||0)+(+st.away||0);
      const pct=n=>sum?Math.round((+n||0)*100/sum):0;
      const fav=p.most_predicted_score;
      dnaBody.innerHTML=
        scPill(`Home win ${pct(st.home)}%`,'dna_home')+
        scPill(`Draw ${pct(st.draw)}%`,'dna_draw')+
        scPill(`Away win ${pct(st.away)}%`,'dna_away')+
        (fav?scPill(`Favourite score ${fav.home}–${fav.away} (${fav.uses}×)`,'favourite_score'):'');
    }

    if(clubTitle?.querySelector('small'))clubTitle.querySelector('small').textContent='Based on the season so far';
    if(dnaTitle?.querySelector('small'))dnaTitle.querySelector('small').textContent='Simple prediction tendencies';
  }
}

async function scApply(force=false){
  if(!scActive()||scBusy)return;
  const host=document.querySelector('.ljs2-playerHost');
  if(!host)return;
  const userId=scSelected(host);
  if(!userId)return;

  scBusy=true;
  try{
    const data=await scLoadProfiles(force);
    if(!data||!host.isConnected||scSelected(host)!==userId)return;
    const p=scPlayer(data,userId);
    if(!p)return;

    scPatchPlayer(host,p);
    scPatchForm(host,p);
    scPatchMatchweek(host,p,data);
    scPatchBreakdown(host,p,data);
  }catch(e){
    console.warn('Stats Clarity',e);
  }finally{
    scBusy=false;
  }
}

function scSchedule(force=false,delay=240){
  clearTimeout(scTimer);
  scTimer=setTimeout(()=>scApply(force),delay);
}

document.addEventListener('change',e=>{
  if(e.target?.matches?.('[data-stats-user]'))scSchedule(true,350);
});

const scMain=document.getElementById('main');
if(scMain){
  new MutationObserver(()=>scSchedule(false,420)).observe(scMain,{childList:true,subtree:true});
}

window.addEventListener('focus',()=>scSchedule(true,250));
setInterval(()=>{if(scActive())scApply(true)},20000);

scCss();
scSchedule(true,700);
