// DAILY WHATSAPP RECAP V1 - owner-only single-day performance broadcast
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const drSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const DR_APP='https://jmeasom81-cmd.github.io/Premier-League-Predictions-/';
let drOwner=false,drLeagueId=null,drLeagueName='',drData=null,drStyle='friendly',drInjectTimer=null,drInitBusy=false;

const drEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const drArr=v=>Array.isArray(v)?v:[];
const drName=x=>x?.display_name||x?.team_name||'Player';
const drTeam=x=>x?.team_name||x?.display_name||'Player';
const drOrdinal=n=>{n=Number(n)||0;const s=['th','st','nd','rd'],v=n%100;return `${n}${s[(v-20)%10]||s[v]||s[0]}`};
const drDateObj=v=>new Date(`${v}T12:00:00Z`);
function drDateLong(v){return v?new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long'}).format(drDateObj(v)):''}
function drDateShort(v){return v?new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short'}).format(drDateObj(v)):''}
function drTodayUK(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const o=Object.fromEntries(p.map(x=>[x.type,x.value]));return `${o.year}-${o.month}-${o.day}`}
const drScoreWord=n=>Number(n)===1?'exact':'exacts';

function drCss(){
  if(document.getElementById('plp-daily-recap-css'))return;
  const s=document.createElement('style');s.id='plp-daily-recap-css';s.textContent=`
  .drAdminTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.drTag{font-size:9px;font-weight:950;border-radius:999px;padding:5px 8px;background:#e9f7ef;color:#08775c;white-space:nowrap}
  .drOverlay{position:fixed;inset:0;z-index:3500;background:rgba(18,14,36,.55);display:flex;align-items:flex-end;justify-content:center;padding:10px}.drShell{width:min(720px,100%);max-height:92vh;overflow:auto;background:#f6f6fb;border-radius:24px 24px 14px 14px;box-shadow:0 22px 65px rgba(0,0,0,.28)}
  .drHead{position:sticky;top:0;z-index:4;background:linear-gradient(135deg,#241153,#4b269d);color:#fff;padding:16px;border-radius:24px 24px 0 0}.drHeadTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.drEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.7}.drTitle{font-size:20px;font-weight:950;margin-top:3px}.drSub{font-size:10px;opacity:.78;margin-top:3px;line-height:1.4}.drClose{border:0;background:rgba(255,255,255,.14);color:#fff;width:40px;height:40px;border-radius:12px;font-size:20px}
  .drBody{padding:12px}.drPanel{background:#fff;border:1px solid #e7e4ef;border-radius:17px;padding:13px;margin-bottom:10px}.drPanelHead{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:9px}.drPanelHead h2{font-size:14px;margin:0}.drPanelHead span{font-size:9px;color:#817d8d}.drSelect{width:100%;border:1px solid #ddd9e9;border-radius:11px;padding:10px;background:#fff;color:#252137;font-size:11px;font-weight:800}
  .drSummary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:8px}.drStat{background:#f6f5fa;border-radius:12px;padding:9px 5px;text-align:center}.drStat b{display:block;font-size:18px}.drStat span{font-size:8px;color:#797586;font-weight:900;text-transform:uppercase}.drStar{background:linear-gradient(135deg,#fff7d9,#fffdf3);border:1px solid #f1d98d;border-radius:14px;padding:12px;margin-top:9px}.drStar b{font-size:14px}.drStar p{font-size:10px;color:#625c48;margin:4px 0 0;line-height:1.45}
  .drFeature{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #eeecf3}.drFeature:last-child{border-bottom:0}.drFeature b{font-size:11px}.drFeature small{display:block;font-size:8.5px;color:#858190;margin-top:2px}.drMetric{font-size:11px;font-weight:950;color:#5f3aaa;white-space:nowrap}.drUp{color:#08775c}.drDown{color:#b52c3c}.drFixture{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:8px 0;border-bottom:1px solid #eeecf3;align-items:center}.drFixture:last-child{border-bottom:0}.drFixture b{font-size:10px}.drFixture span{font-size:11px;font-weight:950}
  .drStyles{display:flex;gap:6px;flex-wrap:wrap}.drStyleBtn{border:1px solid #ded9ec;background:#f8f7fb;color:#5f5a6b;border-radius:999px;padding:7px 9px;font-size:9px;font-weight:900}.drStyleBtn.active{background:#4b269d;color:#fff;border-color:#4b269d}.drText{width:100%;min-height:310px;border:1px solid #d9d8e5;border-radius:12px;padding:11px;resize:vertical;background:#fff;font-size:11px;line-height:1.5;color:#252137}.drActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.drBtn{border:0;border-radius:11px;padding:10px;font-size:10px;font-weight:950}.drBtn.copy{background:#efeff6;color:#343047}.drBtn.whatsapp{background:#08775c;color:#fff}.drFoot{font-size:9px;color:#817d8d;line-height:1.45;padding:2px 2px 8px}.drEmpty{background:#fff;border:1px solid #e7e4ef;border-radius:16px;padding:18px;text-align:center;font-size:11px;color:#777487;line-height:1.5}
  @media(max-width:520px){.drText{min-height:340px}}
  `;document.head.appendChild(s);
}

async function drInitOwner(){
  if(drOwner&&drLeagueId)return true;if(drInitBusy)return false;drInitBusy=true;
  try{
    const {data:{session}}=await drSb.auth.getSession();if(!session)return false;const uid=session.user.id;
    const {data:ms,error}=await drSb.from('league_members').select('league_id,status,role').eq('user_id',uid).eq('status','active');if(error)throw error;
    for(const m of ms||[]){const {data:l}=await drSb.from('leagues').select('id,name,created_by').eq('id',m.league_id).maybeSingle();if(m.role==='admin'||String(l?.created_by)===String(uid)){drOwner=true;drLeagueId=m.league_id;drLeagueName=l?.name||'';return true}}
    return false;
  }catch(e){console.warn('Daily recap owner check:',e);return false}finally{drInitBusy=false}
}
async function drLoad(day=null){if(!await drInitOwner())throw new Error('League owner only');const {data,error}=await drSb.rpc('get_owner_daily_recap',{p_league_id:drLeagueId,p_day:day||null});if(error)throw error;drData=data||{};return drData}
function drWinnerMovement(d,w){return !w?null:drArr(d.biggest_climbers).find(x=>String(x.display_name)===String(w.display_name)||String(x.team_name)===String(w.team_name))||null}
function drTopLines(d,limit=5,compact=false){return drArr(d.day_top_five).slice(0,limit).map(x=>{const ex=Number(x.exacts||0),extra=ex?` · ${ex} ${drScoreWord(ex)}`:'';return compact?`${x.position}. ${drName(x)} ${Number(x.points||0)} pts${extra}`:`${x.position}. ${x.badge||'⚽'} ${drName(x)} — *${Number(x.points||0)} pts*${extra}`}).join('\n')}
function drTableLines(d,compact=false){return drArr(d.top_three_after).map(x=>compact?`${x.position}. ${drTeam(x)} ${Number(x.points||0)}`:`${x.position}. ${x.badge||'⚽'} ${drTeam(x)} — ${Number(x.points||0)} pts`).join('\n')}
function drMoverLine(d,compact=false){const a=drArr(d.biggest_climbers);if(!a.length)return'';if(a.length===1){const x=a[0];return compact?`${drName(x)} +${x.places} (${drOrdinal(x.from)}→${drOrdinal(x.to)})`:`${x.badge||'📈'} ${drName(x)} climbed *${x.places} places* (${drOrdinal(x.from)} → ${drOrdinal(x.to)}).`}return a.map(x=>compact?`${drName(x)} +${x.places}`:`${x.badge||'📈'} ${drName(x)} +${x.places} (${drOrdinal(x.from)} → ${drOrdinal(x.to)})`).join(compact?' / ':'\n')}
function drExactLine(d){const a=drArr(d.exact_stars),s=d.day_stats||{},total=Number(s.total_exacts||0);if(!total)return'🎯 No exact scores today.';if(!a.length)return`🎯 ${total} exact scores across the league.`;const high=Number(a[0].exacts||0);if(a.length===1)return`🎯 ${total} exact scores across the league — ${drName(a[0])} led the way with ${high}.`;return`🎯 ${total} exact scores across the league — ${a.map(drName).join(' & ')} shared the daily high of ${high}.`}

function drBuildMessage(d,style='friendly'){
  const date=drDateLong(d.selected_date),title=String(d.selected_date)===drTodayUK()?'Today':date,w=drArr(d.day_winners)[0],s=d.day_stats||{},fixtures=Number(d.fixtures_count||0),mover=drWinnerMovement(d,w),top=drTopLines(d,style==='short'?3:5,style==='short'),table=drTableLines(d,style==='short'),move=drMoverLine(d,style==='short'),avg=Number(s.average_points||0),exacts=Number(s.total_exacts||0);
  if(!fixtures||!w)return'No completed results are available for this day yet.';
  const starFriendly=`${drName(w)} had a superb ${String(d.selected_date)===drTodayUK()?'day':date} — *${Number(w.points||0)} points from ${Number(w.submitted||fixtures)} matches*, with *${Number(w.exacts||0)} ${drScoreWord(w.exacts)}* and ${Number(w.scoring_picks||0)} scoring picks.`;
  const starBanter=`${drName(w)} has gone absolutely nuclear ${String(d.selected_date)===drTodayUK()?'today':`on ${date}`} 😳 *${Number(w.points||0)} points*, *${Number(w.exacts||0)} ${drScoreWord(w.exacts)}* and ${Number(w.scoring_picks||0)}/${Number(w.submitted||fixtures)} predictions scoring.`;
  const winnerMove=mover?`${drTeam(w)} went from *${drOrdinal(mover.from)} → ${drOrdinal(mover.to)}* — up ${Number(mover.places||0)} places.`:'';
  if(style==='short')return[`⚽ PL Predictions — ${title} recap`,'',`🌟 ${drName(w)}: ${Number(w.points||0)} pts · ${Number(w.exacts||0)} ${drScoreWord(w.exacts)}`,mover?`🚀 ${drName(w)}: ${drOrdinal(mover.from)}→${drOrdinal(mover.to)} (+${mover.places})`:move?`📈 ${move}`:null,'',top?`Top today:\n${top}`:null,'',`🎯 ${exacts} exacts · ${avg} avg pts`,table?`🏆 Table: ${table}`:null,'',DR_APP].filter(x=>x!==null).join('\n');
  if(style==='banter')return[`⚽ *Premier League Predictions — ${title} Recap*`,'',starBanter,winnerMove?`🚀 ${winnerMove} Subtle. 😂`:null,'',`🔥 *Today's damage*`,top||null,'',drExactLine(d),`The league averaged *${avg} points* across ${fixtures} matches.`,move&&!mover?`📈 *Biggest mover*\n${move}`:null,'',table?`🏆 *League table after ${String(d.selected_date)===drTodayUK()?'today':date}*\n${table}`:null,'',`Anyone who had a quiet one can blame the fixtures. Obviously. 👀`,'',`📲 *Open the app:*`,DR_APP].filter(x=>x!==null).join('\n');
  return[`⚽ *Premier League Predictions — ${title} Recap*`,'',`🌟 *Star of the day*`,starFriendly,winnerMove?`🚀 ${winnerMove}`:null,'',`📊 *Top performers*`,top||null,'',drExactLine(d),`• League average: *${avg} pts*`,`• ${Number(s.players_scoring||0)} of ${Number(d.players_count||0)} players scored points`,move&&!mover?`📈 *Biggest climber*\n${move}`:null,'',table?`🏆 *Top 3 after ${String(d.selected_date)===drTodayUK()?'today':date}*\n${table}`:null,'',`📲 *Open the app:*`,DR_APP].filter(x=>x!==null).join('\n');
}

async function drCopy(text,button){try{await navigator.clipboard.writeText(text)}catch{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}if(button){const old=button.textContent;button.textContent='✓ Copied';setTimeout(()=>button.textContent=old,1300)}}
function drClose(){document.querySelector('.drOverlay')?.remove();document.body.style.overflow=''}
function drApplyStyle(style){drStyle=style;const o=document.querySelector('.drOverlay');if(!o||!drData)return;o.querySelectorAll('.drStyleBtn').forEach(b=>b.classList.toggle('active',b.dataset.drStyle===style));const t=o.querySelector('.drText');if(t)t.value=drBuildMessage(drData,style)}
function drWinnerCard(d){const w=drArr(d.day_winners)[0];if(!w)return'';const m=drWinnerMovement(d,w);return`<div class="drStar"><b>🌟 ${drEsc(drName(w))} — ${Number(w.points||0)} pts</b><p>${Number(w.exacts||0)} ${drScoreWord(w.exacts)} · ${Number(w.scoring_picks||0)}/${Number(w.submitted||d.fixtures_count||0)} scoring picks${m?` · climbed ${Number(m.places||0)} places (${drOrdinal(m.from)} → ${drOrdinal(m.to)})`:''}</p></div>`}
function drTopHtml(d){return drArr(d.day_top_five).map(x=>`<div class="drFeature"><div><b>${x.position}. ${drEsc(x.badge||'⚽')} ${drEsc(drName(x))}</b><small>${Number(x.scoring_picks||0)}/${Number(x.submitted||d.fixtures_count||0)} scoring · ${Number(x.exacts||0)} ${drScoreWord(x.exacts)}</small></div><span class="drMetric">${Number(x.points||0)} pts</span></div>`).join('')}
function drMoversHtml(d){const up=drArr(d.biggest_climbers),down=drArr(d.biggest_falls);if(!up.length&&!down.length)return'<div class="drEmpty">Movement will appear once there is an earlier result day to compare with.</div>';return`${up.map(x=>`<div class="drFeature"><div><b>📈 ${drEsc(drName(x))}</b><small>${drOrdinal(x.from)} → ${drOrdinal(x.to)}</small></div><span class="drMetric drUp">+${Number(x.places||0)}</span></div>`).join('')}${down.map(x=>`<div class="drFeature"><div><b>📉 ${drEsc(drName(x))}</b><small>${drOrdinal(x.from)} → ${drOrdinal(x.to)}</small></div><span class="drMetric drDown">-${Number(x.places||0)}</span></div>`).join('')}`}
function drFixturesHtml(d){return drArr(d.fixtures).map(x=>`<div class="drFixture"><b>${drEsc(x.home_team)} v ${drEsc(x.away_team)}</b><span>${Number(x.home_score)}–${Number(x.away_score)}</span></div>`).join('')}
function drDayOptions(d){return drArr(d.available_days).map(x=>`<option value="${drEsc(x.date)}" ${String(x.date)===String(d.selected_date)?'selected':''}>${drEsc(drDateShort(x.date))} · ${Number(x.fixtures_count||0)} result${Number(x.fixtures_count)===1?'':'s'}</option>`).join('')}

async function drRender(day=null){
  const body=document.querySelector('.drOverlay .drBody');if(!body)return;body.innerHTML='<div class="drEmpty">Building the daily recap from sealed league predictions…</div>';
  try{
    const d=await drLoad(day),fixtures=Number(d.fixtures_count||0);if(!fixtures){body.innerHTML=`<div class="drPanel"><div class="drPanelHead"><h2>Choose result day</h2><span>Completed results</span></div><select class="drSelect" data-dr-day>${drDayOptions(d)}</select></div><div class="drEmpty"><b>No completed results on this date.</b><br>Choose another result day.</div>`;body.querySelector('[data-dr-day]')?.addEventListener('change',e=>drRender(e.target.value));return}
    const s=d.day_stats||{};body.innerHTML=`
      <div class="drPanel"><div class="drPanelHead"><h2>Choose result day</h2><span>${drEsc(drLeagueName||d.league||'')}</span></div><select class="drSelect" data-dr-day>${drDayOptions(d)}</select></div>
      <div class="drPanel"><div class="drPanelHead"><h2>${String(d.selected_date)===drTodayUK()?"Today's recap":`${drDateLong(d.selected_date)} recap`}</h2><span>${fixtures} completed result${fixtures===1?'':'s'}</span></div><div class="drSummary"><div class="drStat"><b>${Number(s.highest_points||0)}</b><span>Best score</span></div><div class="drStat"><b>${Number(s.total_exacts||0)}</b><span>League exacts</span></div><div class="drStat"><b>${Number(s.average_points||0)}</b><span>Average pts</span></div></div>${drWinnerCard(d)}</div>
      <div class="drPanel"><div class="drPanelHead"><h2>Top 5 today</h2><span>Humans only</span></div>${drTopHtml(d)}</div>
      <div class="drPanel"><div class="drPanelHead"><h2>League movement</h2><span>Before day → after day</span></div>${drMoversHtml(d)}</div>
      <div class="drPanel"><div class="drPanelHead"><h2>Today's results</h2><span>${fixtures} matches</span></div>${drFixturesHtml(d)}</div>
      <div class="drPanel"><div class="drPanelHead"><h2>Message style</h2><span>Edit afterwards if you want</span></div><div class="drStyles"><button type="button" class="drStyleBtn active" data-dr-style="friendly">🙂 Friendly</button><button type="button" class="drStyleBtn" data-dr-style="short">⚡ Short</button><button type="button" class="drStyleBtn" data-dr-style="banter">😄 League banter</button></div></div>
      <div class="drPanel"><div class="drPanelHead"><h2>WhatsApp daily recap</h2><span>Ready to edit/send</span></div><textarea class="drText" aria-label="Generated daily WhatsApp recap">${drEsc(drBuildMessage(d,'friendly'))}</textarea><div class="drActions"><button type="button" class="drBtn copy" data-dr-copy>Copy recap</button><button type="button" class="drBtn whatsapp" data-dr-whatsapp>📲 Open WhatsApp</button></div></div>
      <div class="drFoot">Nothing is sent automatically. Daily performance uses sealed predictions and completed results for the selected UK calendar day. AI is excluded. You can edit the message before opening WhatsApp.</div>`;
    body.querySelector('[data-dr-day]')?.addEventListener('change',e=>drRender(e.target.value));body.querySelectorAll('[data-dr-style]').forEach(b=>b.addEventListener('click',()=>drApplyStyle(b.dataset.drStyle)));body.querySelector('[data-dr-copy]')?.addEventListener('click',e=>drCopy(body.querySelector('.drText')?.value||'',e.currentTarget));body.querySelector('[data-dr-whatsapp]')?.addEventListener('click',()=>{const message=body.querySelector('.drText')?.value?.trim();if(!message)return;const url=`https://wa.me/?text=${encodeURIComponent(message)}`;const w=window.open(url,'_blank','noopener');if(!w)location.href=url});
  }catch(e){console.warn('Daily recap:',e);body.innerHTML=`<div class="drEmpty"><b>Couldn’t build the daily recap.</b><br>${drEsc(e.message||String(e))}</div>`}
}

async function drOpen(){if(!await drInitOwner())return;document.querySelector('.drOverlay')?.remove();const o=document.createElement('div');o.className='drOverlay';o.innerHTML=`<div class="drShell"><div class="drHead"><div class="drHeadTop"><div><div class="drEyebrow">Private league owner</div><div class="drTitle">Daily WhatsApp Recap</div><div class="drSub">Single-day winner · top performers · exacts · movers · current table</div></div><button type="button" class="drClose" aria-label="Close">✕</button></div></div><div class="drBody"></div></div>`;document.body.appendChild(o);document.body.style.overflow='hidden';o.querySelector('.drClose').addEventListener('click',drClose);o.addEventListener('click',e=>{if(e.target===o)drClose()});drStyle='friendly';await drRender()}

async function drInject(){
  if(!await drInitOwner())return;const main=document.getElementById('main'),onMore=!!document.querySelector('#nav button[data-v="more"].active');if(!main||!onMore||main.querySelector('.drAdminCard'))return;
  const card=document.createElement('div');card.className='card drAdminCard';card.innerHTML=`<div class="drAdminTop"><div><div class="section" style="margin-bottom:3px"><h2>📣 Daily WhatsApp recap</h2></div><div class="notice">Send a single-day performance roundup after the day's matches — winner, top scorers, exacts and league movement.</div></div><span class="drTag">Only you</span></div><button type="button" class="btn good" style="margin-top:10px" data-dr-open>Generate daily recap</button>`;
  const wr=main.querySelector('.wrAdminCard'),wa=main.querySelector('.waAdminCard');if(wr?.nextSibling)main.insertBefore(card,wr.nextSibling);else if(wr)main.appendChild(card);else if(wa?.nextSibling)main.insertBefore(card,wa.nextSibling);else if(wa)main.appendChild(card);else{const first=main.querySelector('.card');if(first?.nextSibling)main.insertBefore(card,first.nextSibling);else main.appendChild(card)}card.querySelector('[data-dr-open]').addEventListener('click',drOpen);
}

drCss();new MutationObserver(()=>{clearTimeout(drInjectTimer);drInjectTimer=setTimeout(drInject,180)}).observe(document.body,{childList:true,subtree:true});setInterval(drInject,1900);setTimeout(drInject,900);


// Owner-only shareable daily reports for individual league players.
const prStats=[
 ['summary','Points, picks & remaining games'],['position','Daily ranking and gap to leader'],
 ['scoring','Correct outcomes & hit rate'],['exact','Exact scores'],
 ['compare','League-average comparison'],['near','Near misses'],
 ['blanks','Scoreless and missing picks'],['podium','Top three players'],['rival','Compare with a rival'],['streak','Scoring streak'],['goals','Goals prediction accuracy'],
 ['types','Home/draw/away calls'],['best','Best and toughest calls'],
 ['matches','Match-by-match breakdown'],['weeks','Week-by-week performance']
];
let prDay='',prPlayer='',prRival='',prData=null,prStyle='friendly',prPreset='detailed',prRequest=0;
let prScope='day',prWeek=null,prFrom=null,prTo=null,prWeeks=[];
let prChecked=new Set(['summary','position','scoring','exact','compare','near','blanks','podium','rival','streak','best','weeks','matches']);
const prN=v=>Number.isFinite(Number(v))?Number(v):0;
const prList=v=>Array.isArray(v)?v:[];
const prOutcome=(h,a)=>h>a?'H':h<a?'A':'D';
const prPct=(a,b)=>b?Math.round(100*a/b)+'%':'—';
const prDayFmt=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v))?v:drTodayUK();
function prCSS(){
 if(document.getElementById('player-day-report-css'))return;
 const s=document.createElement('style');s.id='player-day-report-css';
 s.textContent=[
 '.prOpen{margin-top:8px;width:100%;background:#4b269d}',
 '.prOverlay{position:fixed;inset:0;z-index:3600;background:#171126aa;display:flex;align-items:flex-end;justify-content:center;padding:8px}',
 '.prShell{width:min(740px,100%);max-height:94dvh;overflow:auto;background:#f7f6fb;border-radius:24px 24px 12px 12px}',
 '.prHead{position:sticky;top:0;z-index:3;padding:15px;background:linear-gradient(120deg,#241153,#4b269d);color:white;display:flex;justify-content:space-between;gap:12px;border-radius:24px 24px 0 0}',
 '.prHead b{font-size:19px}.prHead p{font-size:10px;opacity:.8;margin:5px 0}.prClose{height:40px;width:40px;border:0;border-radius:12px;background:#ffffff26;color:white;font-size:21px}',
 '.prBody{padding:12px}.prCard{padding:12px;margin-bottom:10px;background:white;border:1px solid #e7e4ef;border-radius:15px}',
 '.prCard h3{font-size:13px;margin:0 0 9px}.prFields{display:grid;grid-template-columns:1fr 1fr;gap:9px}',
 '.prField label{font-size:10px;font-weight:850;display:block;margin-bottom:5px;color:#665d79}.prField select,.prField input{width:100%;min-width:0;padding:10px 7px;border:1px solid #d8d3e5;border-radius:10px;font-size:12px;background:white;color:#231733}',
 '.prChips{display:flex;gap:6px;flex-wrap:wrap}.prChip{border:1px solid #d8d3e5;background:#f5f3fa;color:#4b337c;border-radius:99px;padding:8px 10px;font-size:10px;font-weight:850}.prChip.on{background:#4b269d;color:white;border-color:#4b269d}',
 '.prOptions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.prOptions label{display:flex;align-items:flex-start;gap:6px;font-size:10.5px;line-height:1.4}.prOptions input{accent-color:#4b269d;margin-top:2px}',
 '.prKpis{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.prKpis div{background:#f5f3fa;border-radius:10px;padding:9px 4px;text-align:center}.prKpis b{font-size:17px;display:block}.prKpis small{font-size:9px;color:#766b85}',
 '.prText{width:100%;min-height:300px;border:1px solid #d9d2e7;border-radius:12px;padding:10px;font-size:12px;line-height:1.5;resize:vertical;color:#211c2d}',
 '.prActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.prActions button{border:0;border-radius:11px;background:#efecf5;color:#343047;padding:11px;font-size:11px;font-weight:900}.prActions button:last-child{background:#08775c;color:white}',
 '.prNote{font-size:10px;line-height:1.5;color:#797080;margin-top:8px}',
 '@media(max-width:360px){.prOptions{grid-template-columns:1fr}.prKpis b{font-size:14px}}'
 ].join('');
 document.head.appendChild(s);
}
async function prMembers(){
 const {data,error}=await drSb.from('league_members').select('user_id,status').eq('league_id',drLeagueId).eq('status','active');
 if(error)throw error;
 const ids=prList(data).map(x=>x.user_id);
 if(!ids.length)return [];
 const {data:profiles,error:ep}=await drSb.from('profiles').select('user_id,display_name,team_name,badge').in('user_id',ids);
 if(ep)throw ep;
 const map=new Map(prList(profiles).map(x=>[String(x.user_id),x]));
 return ids.map(id=>({...(map.get(String(id))||{}),user_id:id})).sort((a,b)=>drName(a).localeCompare(drName(b)));
}
async function prLoad(rawDay,playerId){
 if(!await drInitOwner())throw Error('League owner access required');
 const requested=prDayFmt(rawDay);
 const [scope,members,daily]=await Promise.all([
   drSb.rpc('get_owner_message_scope',{p_league_id:drLeagueId,p_day:requested,p_fixture_id:null}),
   prMembers(),
   drSb.rpc('get_owner_daily_recap',{p_league_id:drLeagueId,p_day:requested})
 ]);
 if(scope.error)throw scope.error;
 const data=scope.data||{},day=data.selected_date||requested;
 const person=members.find(x=>String(x.user_id)===String(playerId))||members[0];
 if(!person)throw Error('No league members found');
 const fixtures=prList(data.fixtures),byId=new Map(fixtures.map(x=>[String(x.fixture_id),x]));
 const scored=prList(data.scored_rows).filter(f=>f.result_home_score!=null&&f.result_away_score!=null);
 const totals=new Map(members.map(x=>[String(x.user_id),{...x,points:0,correct:0,exacts:0,submitted:0}]));
 const games=[];
 for(const f of scored){
   const actualH=prN(f.result_home_score),actualA=prN(f.result_away_score);
   let ownPick=null;
   for(const p of prList(f.predictions)){
     const member=totals.get(String(p.user_id));
     if(!member||p.home_score==null||p.away_score==null)continue;
     const h=prN(p.home_score),a=prN(p.away_score);
     const pts=h===actualH&&a===actualA?3:prOutcome(h,a)===prOutcome(actualH,actualA)?1:0;
     member.points+=pts;member.correct+=pts>0?1:0;member.exacts+=pts===3?1:0;member.submitted++;
     if(String(p.user_id)===String(person.user_id))ownPick={h,a,pts};
   }
   const meta=byId.get(String(f.fixture_id))||{};
   games.push({
     home:f.home_team||meta.home_team||'Home',away:f.away_team||meta.away_team||'Away',
     h:actualH,a:actualA,pick:ownPick,live:(meta.score_state||f.score_state)==='live',
     kickoff:meta.kickoff_at||f.kickoff_at||'',goalError:ownPick?Math.abs(ownPick.h-actualH)+Math.abs(ownPick.a-actualA):null
   });
 }
 games.sort((a,b)=>String(a.kickoff).localeCompare(String(b.kickoff)));
 const me=totals.get(String(person.user_id));
 const leaderboard=[...totals.values()].sort((a,b)=>b.points-a.points||b.exacts-a.exacts||b.correct-a.correct||drName(a).localeCompare(drName(b)));
 const scores=[...totals.values()].map(x=>x.points);
 const rank=1+scores.filter(x=>x>me.points).length;
 const dayBest=Math.max(0,...scores);
 const ties=scores.filter(x=>x===me.points).length;
 const average=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)*10/scores.length)/10:0;
 const number=prN(data.day_total_fixtures??fixtures.length);
 const remaining=Math.max(0,number-games.length);
 const days=prList(daily.data?.available_days).map(x=>x.date).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));
 return {members,me,leaderboard,day,days:[...new Set([drTodayUK(),day,...days])].sort().reverse(),games,rank,ties,dayBest,average,number,remaining,live:games.some(x=>x.live),updatedAt:new Date().toISOString()};
}

function prCurrentWeek(weeks){
 const now=Date.now();
 const started=prList(weeks).filter(x=>x.first_kickoff&&new Date(x.first_kickoff).getTime()<=now);
 if(started.length)return Math.max(...started.map(x=>prN(x.matchweek)));
 return prN(weeks[0]?.matchweek)||1;
}
function prPeriodName(d){
 if(d.scope==='week')return 'Matchweek '+d.from+(d.remaining===0&&!d.live?' — complete':' — so far');
 if(d.scope==='range')return 'Matchweeks '+d.from+'–'+d.to+(d.remaining===0&&!d.live?' — complete':' — so far');
 return drDateLong(d.day);
}
function prWeekOptions(value){
 return prWeeks.map(x=>{
   const n=prN(x.matchweek);
   const first=x.first_kickoff?drDateShort(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(x.first_kickoff))):'';
   const label='MW '+n+(first?' · from '+first:'')+' · '+prN(x.completed)+'/'+prN(x.total)+' final';
   return '<option value="'+n+'"'+(n===prN(value)?' selected':'')+'>'+drEsc(label)+'</option>';
 }).join('');
}
async function prLoadPeriod(playerId){
 if(!await drInitOwner())throw Error('League owner access required');
 const members=await prMembers();
 const person=members.find(x=>String(x.user_id)===String(playerId))||members[0];
 if(!person)throw Error('No league members found');
 const initializingWeeks=!prWeeks.length;
 if(initializingWeeks){
   const r=await drSb.rpc('get_owner_player_matchweek_period',{p_league_id:drLeagueId,p_from_matchweek:null,p_to_matchweek:null});
   if(r.error)throw r.error;
   prWeeks=prList(r.data?.weeks);
 }
 if(!prWeeks.length)throw Error('No matchweeks are available yet.');
 const allowed=prWeeks.map(x=>prN(x.matchweek));
 if(initializingWeeks&&prScope==='range'&&prTo===Math.min(...allowed)){
   prTo=prCurrentWeek(prWeeks);
   prFrom=Math.max(Math.min(...allowed),prTo-2);
 }
 if(!allowed.includes(prN(prWeek)))prWeek=prCurrentWeek(prWeeks);
 if(!allowed.includes(prN(prTo)))prTo=prWeek;
 if(!allowed.includes(prN(prFrom)))prFrom=Math.max(Math.min(...allowed),prTo-2);
 if(prScope==='week'){prFrom=prWeek;prTo=prWeek}
 if(prFrom>prTo)prFrom=prTo;
 const response=await drSb.rpc('get_owner_player_matchweek_period',{
   p_league_id:drLeagueId,p_from_matchweek:prFrom,p_to_matchweek:prTo
 });
 if(response.error)throw response.error;
 const json=response.data||{};
 prWeeks=prList(json.weeks).length?json.weeks:prWeeks;
 const scored=prList(json.games);
 const totals=new Map(members.map(x=>[String(x.user_id),{...x,points:0,correct:0,exacts:0,submitted:0}]));
 const games=[];
 for(const f of scored){
   const h=prN(f.result_home_score),a=prN(f.result_away_score);
   let pick=null;
   for(const p of prList(f.predictions)){
     const st=totals.get(String(p.user_id));
     if(!st||p.home_score==null||p.away_score==null)continue;
     const ph=prN(p.home_score),pa=prN(p.away_score);
     const pts=ph===h&&pa===a?3:prOutcome(ph,pa)===prOutcome(h,a)?1:0;
     st.points+=pts;st.correct+=pts>0?1:0;st.exacts+=pts===3?1:0;st.submitted++;
     if(String(p.user_id)===String(person.user_id))pick={h:ph,a:pa,pts};
   }
   games.push({
     home:f.home_team||'Home',away:f.away_team||'Away',h,a,pick,
     live:f.score_state==='live',matchweek:prN(f.matchweek),
     kickoff:f.kickoff_at||'',goalError:pick?Math.abs(pick.h-h)+Math.abs(pick.a-a):null
   });
 }
 games.sort((a,b)=>a.kickoff.localeCompare(b.kickoff));
 const me=totals.get(String(person.user_id));
 const leaderboard=[...totals.values()].sort((a,b)=>b.points-a.points||b.exacts-a.exacts||b.correct-a.correct||drName(a).localeCompare(drName(b)));
 const scores=leaderboard.map(x=>x.points),dayBest=Math.max(0,...scores);
 const number=prN(json.fixtures_count);
 return {
   members,me,leaderboard,games,rank:1+scores.filter(x=>x>me.points).length,
   dayBest,ties:scores.filter(x=>x===me.points).length,
   average:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)*10/scores.length)/10:0,
   number,remaining:Math.max(0,number-games.length),live:games.some(x=>x.live),
   day:prDay||drTodayUK(),days:[],scope:prScope,from:prFrom,to:prTo,
   weeks:prWeeks.filter(x=>prN(x.matchweek)>=prFrom&&prN(x.matchweek)<=prTo),
   updatedAt:new Date().toISOString()
 };
}
function prMessage(d){
 const me=d.me,submitted=d.games.filter(x=>x.pick),zeros=submitted.filter(x=>x.pick.pts===0),missing=d.games.filter(x=>!x.pick);
 const near=submitted.filter(x=>x.goalError===1&&x.pick.pts!==3);
 const rival=d.leaderboard.find(x=>String(x.user_id)===String(prRival)&&String(x.user_id)!==String(me.user_id));
 let streak=0,longest=0;
 for(const game of d.games){streak=game.pick&&game.pick.pts>0?streak+1:0;longest=Math.max(longest,streak)}
 const heading=prPeriodName(d);
 const lines=['⚽ *Premier League Predictions*','*'+drName(me)+' — '+heading+'*'];
 if(d.live)lines.push('🔴 Live results: all points are provisional.');
 const section=(key,head,body)=>{if(prChecked.has(key))lines.push('',head,body)};
 if(!d.number&&!d.games.length)return 'No fixtures have been scheduled for '+heading+'. Choose another reporting period.';
 if(d.number&&!d.games.length)return '⚽ *Premier League Predictions*\n*'+drName(me)+' — '+heading+'*\n\n⏳ '+d.number+' fixture'+(d.number===1?' is':'s are')+' scheduled, but no score has been recorded yet. Statistics will build as results arrive.\n\n📲 '+DR_APP;
 section('summary',d.scope&&d.scope!=='day'?'🏅 *Period performance*':'🏅 *Today*',me.points+' points · '+me.submitted+'/'+d.games.length+' scored fixtures predicted'+(d.remaining?' · '+d.remaining+' still awaiting scores':''));
 section('position',d.scope&&d.scope!=='day'?'🏆 *Period ranking*':'🏆 *Daily position*',drOrdinal(d.rank)+' of '+d.members.length+(d.ties>1?' (joint on points)':'')+' · '+(d.dayBest-me.points)+' behind today’s top score');
 section('scoring','✅ *Scoring picks*',me.correct+'/'+me.submitted+' returned points ('+prPct(me.correct,me.submitted)+')');
 section('exact','🎯 *Exact scores*',me.exacts+' exact'+(me.exacts===1?'':'s')+' · '+prPct(me.exacts,me.submitted)+' exact hit rate · '+(me.correct-me.exacts)+' other correct outcomes');
 section('compare','📊 *League comparison*','League average '+d.average+' pts · '+drName(me)+' '+(me.points>=d.average?'+':'')+(Math.round((me.points-d.average)*10)/10)+' pts against average');
 section('podium',d.scope&&d.scope!=='day'?'🥇 *Period leaders*':'🥇 *Daily leaders*',d.leaderboard.slice(0,3).map(x=>drOrdinal(1+d.leaderboard.filter(y=>y.points>x.points).length)+'. '+drName(x)+' — '+x.points+' pts · '+x.exacts+' exact'+(x.exacts===1?'':'s')).join('\n'));
 if(rival)section('rival','⚔️ *Head to head*',drName(me)+' '+me.points+'–'+rival.points+' '+drName(rival)+' points · exacts '+me.exacts+'–'+rival.exacts+' · '+(me.points===rival.points?'Level on points':me.points>rival.points?drName(me)+' ahead by '+(me.points-rival.points):drName(rival)+' ahead by '+(rival.points-me.points)));
 section('streak','🔥 *Scoring streak*','Longest scoring run: '+longest+' scoring prediction'+(longest===1?'':'s')+' in a row · current run: '+streak);
 section('near','😬 *One-goal near misses*',near.length?near.map(x=>x.home+' v '+x.away+': '+x.pick.h+'–'+x.pick.a+' (actual '+x.h+'–'+x.a+')').join('\n'):'None today');
 section('blanks','🥶 *Zeroes and missed picks*',zeros.length+' predicted games earned zero'+(missing.length?' · '+missing.length+' scored fixture'+(missing.length===1?'':'s')+' without a recorded pick':''));
 if(submitted.length){
   const goalP=submitted.reduce((n,x)=>n+x.pick.h+x.pick.a,0),goalA=submitted.reduce((n,x)=>n+x.h+x.a,0);
   const err=Math.round(submitted.reduce((n,x)=>n+x.goalError,0)*10/submitted.length)/10;
   section('goals','🥅 *Goals accuracy*','Predicted '+goalP+' goals · actual '+goalA+' · average scoreline error '+err+' goals');
   const split={H:0,D:0,A:0};
   submitted.forEach(x=>split[prOutcome(x.pick.h,x.pick.a)]++);
   section('types','🔮 *Calls made*',split.H+' home wins · '+split.D+' draws · '+split.A+' away wins');
   const best=[...submitted].sort((a,b)=>b.pick.pts-a.pick.pts||a.goalError-b.goalError)[0];
   const worst=[...submitted].sort((a,b)=>a.pick.pts-b.pick.pts||b.goalError-a.goalError)[0];
   section('best','⭐ *Standout calls*','Best: '+best.home+' v '+best.away+' '+best.pick.h+'–'+best.pick.a+' ('+best.pick.pts+' pts)'+
     (best!==worst?'\nToughest: '+worst.home+' v '+worst.away+' '+worst.pick.h+'–'+worst.pick.a+' ('+worst.pick.pts+' pts)':''));
 }
 if(d.scope==='week'||d.scope==='range'){
   const weeks=prList(d.weeks);
   section('weeks','🗓️ *Week-by-week breakdown*',weeks.map(w=>{
     const m=d.games.filter(x=>x.matchweek===prN(w.matchweek)),picked=m.filter(x=>x.pick);
     const points=picked.reduce((sum,x)=>sum+x.pick.pts,0),exacts=picked.filter(x=>x.pick.pts===3).length;
     const total=prN(w.total);
     return 'MW'+w.matchweek+': '+points+' pts · '+exacts+' exacts · '+picked.length+'/'+m.length+' scored games predicted · '+m.length+'/'+total+' scored';
   }).join('\n'));
 }
 const displayGames=d.scope==='range'&&d.games.length>30?d.games.slice(-30):d.games;
 section('matches','📋 *Match by match*',displayGames.map(x=>(d.scope==='range'?'MW'+x.matchweek+' · ':'')+x.home+' '+x.h+'–'+x.a+' '+x.away+(x.live?' (LIVE)':'')+
   '\n  '+(x.pick?'Picked '+x.pick.h+'–'+x.pick.a+' · '+x.pick.pts+' pts':'No recorded prediction')).join('\n')+
   (displayGames.length<d.games.length?'\n…plus '+(d.games.length-displayGames.length)+' earlier scored games not listed to keep WhatsApp readable.':'')||'No scores available yet');
 if(d.remaining)lines.push('','⏳ '+d.remaining+' fixture'+(d.remaining===1?'':'s')+' awaiting scores in the chosen period. Their predictions are not revealed.');
 if(prStyle==='banter'&&d.games.length)lines.push('',me.exacts?'🎯 Actual football oracle behaviour. 👀':me.points?'⚽ The bragging rights are still in play. 😂':'😬 A quiet day for the crystal ball.');
 if(prStyle==='serious')lines[0]='*Premier League Predictions — Player Report*';
 lines.push('','📲 '+DR_APP);
 return lines.join('\n').replace(/\n{3,}/g,'\n\n');
}

function prPeriodControls(d){
 const mode=d.scope||'day';
 const chips=[['day','📅 Single date'],['week','⚽ Matchweek to date'],['range','📊 Matchweek range']];
 return '<div class="prCard"><h3>Choose reporting period</h3><div class="prChips">'+chips.map(x=>
   '<button type="button" class="prChip'+(mode===x[0]?' on':'')+'" data-pr-scope="'+x[0]+'">'+x[1]+'</button>').join('')+
   '</div><p class="prNote">'+(mode==='week'?'Includes all scores recorded so far in one matchweek, even before every match has finished.':
     mode==='range'?'Combines points and statistics across all selected matchweeks, including unfinished ones.':
     'Report on a specific calendar date.')+'</p></div>';
}
function prSelectFields(d){
 const mode=d.scope||'day';
 if(mode==='day')return '<div class="prField"><label>Matchday date (UK)</label><input type="date" data-pr-date value="'+drEsc(d.day)+'"></div>';
 if(mode==='week')return '<div class="prField"><label>Choose matchweek</label><select data-pr-week>'+prWeekOptions(d.from)+'</select></div>';
 return '</div><div class="prFields" style="margin-top:9px"><div class="prField"><label>From matchweek</label><select data-pr-from>'+prWeekOptions(d.from)+'</select></div>'+
 '<div class="prField"><label>To matchweek</label><select data-pr-to>'+prWeekOptions(d.to)+'</select></div>';
}
function prRender(){
 const d=prData,el=document.querySelector('.prOverlay .prBody');if(!d||!el)return;
 const me=d.me;
 el.innerHTML=prPeriodControls(d)+'<div class="prCard"><div class="prFields">'+
 '<div class="prField"><label>Choose player</label><select data-pr-player>'+d.members.map(x=>
   '<option value="'+drEsc(x.user_id)+'"'+(String(x.user_id)===String(me.user_id)?' selected':'')+'>'+drEsc((x.badge||'⚽')+' '+drName(x))+'</option>').join('')+'</select></div>'+
 prSelectFields(d)+'</div></div>'+
 '<div class="prNote">'+(d.scope&&d.scope!=='day'?prPeriodName(d)+' · ':'')+d.games.length+' scored matches · '+d.remaining+' awaiting results'+(d.live?' · live points provisional':'')+'</div>'+
 '<div class="prField"><label>Compare with another player (optional)</label><select data-pr-rival><option value="">No comparison</option>'+
 d.members.filter(x=>String(x.user_id)!==String(me.user_id)).map(x=>'<option value="'+drEsc(x.user_id)+'"'+(String(x.user_id)===String(prRival)?' selected':'')+'>'+drEsc((x.badge||'⚽')+' '+drName(x))+'</option>').join('')+'</select></div>'+
 (d.scope&&d.scope!=='day'?'':'<div class="prField"><label>Recent days with results</label><select data-pr-days><option value="">Choose a date…</option>'+
 d.days.map(x=>'<option value="'+drEsc(x)+'">'+drEsc(drDateShort(x))+'</option>').join('')+'</select></div>')+'</div>'+
 '<div class="prCard"><h3>'+(d.scope&&d.scope!=='day'?'Selected period':'Daily')+' snapshot</h3><div class="prKpis">'+
 [[me.points,'Points'],[me.exacts,'Exacts'],[me.correct+'/'+me.submitted,'Scoring picks'],[d.games.length?drOrdinal(d.rank):'—',d.scope&&d.scope!=='day'?'Period rank':'Day rank']].map(x=>'<div><b>'+drEsc(x[0])+'</b><small>'+drEsc(x[1])+'</small></div>').join('')+'</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px"><small class="prNote">Updated '+drEsc(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'}).format(new Date(d.updatedAt)))+' UK</small><button type="button" class="prChip" data-pr-refresh>↻ Refresh latest scores</button></div></div>'+
 '<div class="prCard"><h3>Report length</h3><div class="prChips">'+
 [['quick','⚡ Quick'],['detailed','📊 Detailed'],['custom','⚙️ Custom']].map(x=>'<button type="button" class="prChip'+(prPreset===x[0]?' on':'')+'" data-pr-preset="'+x[0]+'">'+x[1]+'</button>').join('')+
 '</div><h3 style="margin-top:14px">Tone</h3><div class="prChips">'+
 [['friendly','🙂 Friendly'],['banter','😄 Banter'],['serious','📋 Straight stats']].map(x=>'<button type="button" class="prChip'+(prStyle===x[0]?' on':'')+'" data-pr-style="'+x[0]+'">'+x[1]+'</button>').join('')+
 '</div></div><div class="prCard"><h3>Include these stats</h3><div class="prOptions">'+
 prStats.map(x=>'<label><input type="checkbox" data-pr-stat="'+x[0]+'"'+(prChecked.has(x[0])?' checked':'')+'>'+drEsc(x[1])+'</label>').join('')+
 '</div></div><div class="prCard"><h3>Editable player report</h3><textarea class="prText" data-pr-message>'+drEsc(prMessage(d))+
 '</textarea><div class="prActions"><button type="button" data-pr-copy>📋 Copy</button><button type="button" data-pr-wa>📲 WhatsApp</button></div>'+
 '<p class="prNote">Nothing is sent automatically. Changing a selection regenerates the report; you can edit it before sharing.</p></div>'+
 '<p class="prNote">Uses sealed predictions and scored fixtures only; upcoming predictions remain hidden. Rankings compare active league members.</p>';
 el.querySelectorAll('[data-pr-scope]').forEach(b=>b.onclick=()=>{
   prScope=b.dataset.prScope;
   if(prScope==='range'){
     if(!prTo)prTo=prWeek||prCurrentWeek(prWeeks);
     if(!prFrom||prFrom===prTo)prFrom=Math.max(prN(prWeeks[0]?.matchweek)||1,prTo-2);
   }
   prRefresh(d.day,me.user_id);
 });
 el.querySelector('[data-pr-week]')?.addEventListener('change',e=>{prWeek=prN(e.target.value);prFrom=prWeek;prTo=prWeek;prRefresh(d.day,me.user_id)});
 el.querySelector('[data-pr-from]')?.addEventListener('change',e=>{prFrom=prN(e.target.value);if(prFrom>prTo)prTo=prFrom;prRefresh(d.day,me.user_id)});
 el.querySelector('[data-pr-to]')?.addEventListener('change',e=>{prTo=prN(e.target.value);if(prTo<prFrom)prFrom=prTo;prRefresh(d.day,me.user_id)});
 el.querySelector('[data-pr-player]').onchange=e=>{if(String(e.target.value)===String(prRival))prRival='';prRefresh(d.day,e.target.value)};
 el.querySelector('[data-pr-rival]').onchange=e=>{prRival=e.target.value;prRender()};
 el.querySelector('[data-pr-refresh]').onclick=()=>prRefresh(d.day,me.user_id);
 el.querySelector('[data-pr-date]')?.addEventListener('change',e=>prRefresh(e.target.value,me.user_id));
 el.querySelector('[data-pr-days]')?.addEventListener('change',e=>{if(e.target.value)prRefresh(e.target.value,me.user_id)});
 el.querySelectorAll('[data-pr-preset]').forEach(b=>b.onclick=()=>{
   prPreset=b.dataset.prPreset;
   if(prPreset==='quick')prChecked=new Set(['summary','position','scoring','exact','blanks']);
   if(prPreset==='detailed')prChecked=new Set(['summary','position','scoring','exact','compare','near','blanks','podium','rival','streak','best','weeks','matches']);
   prRender();
 });
 el.querySelectorAll('[data-pr-style]').forEach(b=>b.onclick=()=>{prStyle=b.dataset.prStyle;prRender()});
 el.querySelectorAll('[data-pr-stat]').forEach(b=>b.onchange=e=>{
   prPreset='custom';if(e.target.checked)prChecked.add(e.target.dataset.prStat);else prChecked.delete(e.target.dataset.prStat);
   prRender();
 });
 el.querySelector('[data-pr-copy]').onclick=e=>drCopy(el.querySelector('[data-pr-message]').value,e.currentTarget);
 el.querySelector('[data-pr-wa]').onclick=()=>{
   const msg=el.querySelector('[data-pr-message]').value.trim();if(!msg)return;
   const link='https://wa.me/?text='+encodeURIComponent(msg);
   const opened=window.open(link,'_blank','noopener');if(!opened)location.href=link;
 };
}
async function prRefresh(date,player){
 const el=document.querySelector('.prOverlay .prBody');if(!el)return;
 const request=++prRequest;
 el.innerHTML='<div class="drEmpty">Loading individual league statistics…</div>';
 try{
   const next=prScope==='day'?await prLoad(date,player):await prLoadPeriod(player);
   if(request!==prRequest||!el.isConnected)return;
   prData=next;prDay=next.day;prPlayer=next.me.user_id;prRender();
 }catch(e){
   if(request!==prRequest||!el.isConnected)return;
   console.warn('Player daily report:',e);
   el.innerHTML='<div class="drEmpty">Could not load statistics.<p>'+drEsc(e?.message||String(e))+'</p><button type="button" class="drBtn copy" data-pr-retry>Try again</button></div>';
   el.querySelector('[data-pr-retry]').onclick=()=>prRefresh(date,player);
 }
}
async function prOpen(){
 if(!await drInitOwner()){alert('Individual player reports are available to league admins. If you are an admin, please sign out and back in.');return;}
 document.querySelector('.prOverlay')?.remove();
 const o=document.createElement('div');o.className='prOverlay';
 o.innerHTML='<div class="prShell"><div class="prHead"><div><b>👤 Individual Player Stats</b><p>Daily · matchweek to date · multiple matchweeks · WhatsApp or copy</p></div><button type="button" class="prClose" aria-label="Close">✕</button></div><div class="prBody"></div></div>';
 document.body.appendChild(o);document.body.style.overflow='hidden';
 const close=()=>{++prRequest;o.remove();document.body.style.overflow=''};
 o.querySelector('.prClose').onclick=close;o.onclick=e=>{if(e.target===o)close()};
 prPreset='detailed';prStyle='friendly';prRival='';prChecked=new Set(['summary','position','scoring','exact','compare','near','blanks','podium','rival','streak','best','weeks','matches']);
 await prRefresh(prDay||drTodayUK(),prPlayer);
 if(prScope==='day'&&prData&&prData.number===0&&prData.day===drTodayUK()){
   const latest=prData.days.find(x=>x!==drTodayUK());if(latest)await prRefresh(latest,prPlayer);
 }
}
function prInject(){
 const card=document.querySelector('#main .drAdminCard');
 if(!card||card.querySelector('[data-pr-open]'))return;
 const btn=document.createElement('button');btn.type='button';btn.className='btn prOpen';btn.dataset.prOpen='';
 btn.textContent='👤 Individual player daily stats';btn.onclick=prOpen;card.appendChild(btn);
}
window.openPLPPlayerDayReport=prOpen;
prCSS();setInterval(prInject,1700);setTimeout(prInject,1000);
