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
    const {data:ms,error}=await drSb.from('league_members').select('league_id,status').eq('user_id',uid).eq('status','active');if(error)throw error;
    for(const m of ms||[]){const {data:l}=await drSb.from('leagues').select('id,name,created_by').eq('id',m.league_id).single();if(String(l?.created_by)===String(uid)){drOwner=true;drLeagueId=l.id;drLeagueName=l.name||'';return true}}
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
