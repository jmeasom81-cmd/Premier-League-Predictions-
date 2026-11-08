// Personalised Home and Honours V1. Data is read-only; trophies are awarded server-side.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const sb=window.plpSupabase||createClient('https://jzrbaeyvwagrwukntjbk.supabase.co','sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8');
const defs=[
 ['matchweek_champion','Matchweek Champion','🏆','gold','Most matchweek points'],
 ['exact_master','Exact Master','🎯','ruby','Most exact scores in one week'],
 ['league_leader','League Leader','👑','gold','Top of the league at week end'],
 ['biggest_climber','Biggest Climber','📈','emerald','Biggest positive rise in places'],
 ['consistency_shield','Consistency Shield','🛡️','blue','Most correct outcomes'],
 ['precision_trophy','Precision Trophy','💎','violet','Best qualifying exact conversion'],
 ['bold_call','Bold Call','⚡','amber','Rarest successful match outcome'],
 ['final_day_hero','Final Day Hero','🚀','ice','Most points on the final day']
];
const coming=[
 ['Early Bird','All picks well ahead of the deadline'],
 ['Mr Reliable','Every personal prediction in before lock'],
 ['Matchday Regular','Meaningful visits on multiple matchdays'],
 ['The Explorer','Discover and use different pages'],
 ['Club Loyalist','Return on separate days during the week']
];
const index=Object.fromEntries(defs.map(d=>[d[0],d]));

function trophyArtwork(category){
 const shapes={
  matchweek_champion:'<path d="M30 15H70V39C70 58 60 67 50 67S30 58 30 39Z"/><path d="M30 24H17V33C17 44 26 49 35 49M70 24H83V33C83 44 74 49 65 49" stroke="currentColor" stroke-width="7" fill="none"/><path d="M50 66V81M30 85H70" stroke="currentColor" stroke-width="8" fill="none"/><path d="m50 26 4 8 9 1-7 7 2 9-8-4-8 4 2-9-7-7 9-1Z" fill="#fff" opacity=".9"/>',
  exact_master:'<circle cx="50" cy="43" r="32"/><circle cx="50" cy="43" r="22" fill="#fff" opacity=".25"/><circle cx="50" cy="43" r="12" fill="#fff" opacity=".85"/><circle cx="50" cy="43" r="5"/><path d="M50 74V84M29 87H71" stroke="currentColor" stroke-width="8" fill="none"/>',
  league_leader:'<path d="M12 31 30 44 40 19 52 43 70 18 75 44 88 29 81 70H20Z"/><rect x="21" y="74" width="59" height="12" rx="3"/><circle cx="38" cy="57" r="4" fill="#fff"/><circle cx="61" cy="57" r="4" fill="#fff"/>',
  biggest_climber:'<path d="M17 65 45 36 61 51 84 24" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"/><path d="M62 25H85V47" fill="none" stroke="currentColor" stroke-width="11"/><path d="M21 85H78" fill="none" stroke="currentColor" stroke-width="8"/>',
  consistency_shield:'<path d="M50 11 83 23V49C83 70 67 82 50 91 33 82 17 70 17 49V23Z"/><path d="M31 51 44 64 71 35" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>',
  precision_trophy:'<path d="M50 10 80 29V66L50 89 20 66V29Z"/><path d="M20 29 50 48 80 29M50 48V89M20 66 50 48 80 66" stroke="#fff" fill="none" stroke-width="4" opacity=".7"/><circle cx="50" cy="48" r="7" fill="#fff"/>',
  bold_call:'<path d="M56 9 23 54H47L40 92 80 40H55Z"/><path d="M15 16 22 24M78 78 87 87" fill="none" stroke="currentColor" stroke-width="7"/>',
  final_day_hero:'<path d="M49 9C30 33 27 43 30 56c-13-2-18-11-18-11-12 30 7 47 38 47s51-26 35-47c-2 13-9 19-14 21C78 41 67 24 49 9Z"/><path d="M51 44C39 60 35 69 39 77c4 8 8 9 13 9 14 0 17-13 7-27-1 8-5 10-8 12 1-11 2-19 0-27Z" fill="#fff" opacity=".66"/>'
 };
 return '<svg class="phSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="78" height="78" fill="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[category]||shapes.matchweek_champion)+'</svg>';
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const num=n=>Number(n||0);
let cached=null,cacheAt=0,fetching=null,activeTab='cabinet',activeFilter='football',handledLink=false,scheduled=null;
let selectedMemberId=null,selectedCategory=null,selectedAwardId=null,selectionFrom='league';
function styles(){
 if(document.getElementById('plp-honours-style'))return;
 const e=document.createElement('style');e.id='plp-honours-style';
 e.textContent=[
 '.phHero{background:linear-gradient(125deg,#251447,#4a298d);color:#fff;padding:17px;border-radius:19px;margin:12px 0;box-shadow:0 12px 24px #24124225}',
 '.phHero h2{font-size:23px;color:#fff;margin:5px 0 12px;line-height:1.2}',
 '.phHero.phUnderHero{padding:13px 14px;margin:10px 0;border-radius:15px;background:linear-gradient(135deg,#39216b,#264980);box-shadow:0 7px 18px #18122c18}',
 '.phHero.phUnderHero h2{font-size:17px;margin:5px 0 9px}',
 '.phHero.phUnderHero .phMetric strong{font-size:21px}',
 '.phHero.phCompactHonours{padding:12px 15px;box-shadow:0 6px 17px #24124212;margin:7px 0 10px;background:linear-gradient(135deg,#382166,#214c78)}',
 '.phHero.phCompactHonours h2{font-size:18px;margin:4px 0 8px}',
 '.phHonoursLine{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px;align-items:center;font-weight:650;margin:0 0 4px}',
 '.phHonoursLine b{font-size:17px}',
 '.phHero.phCompactHonours .phInfo{margin:6px 0 10px;font-size:11px}',
 '.phHero.phCompactHonours .phActions{gap:6px}',
 '.phEyebrow{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;opacity:.8}',
 '.phMetrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}',
 '.phMetric{padding:10px 4px;border-radius:12px;text-align:center;background:#ffffff19}',
 '.phMetric strong{display:block;font-size:24px;color:#fff}.phMetric span{display:block;font-size:10px;opacity:.8}',
 '.phInfo{font-size:12px;line-height:1.5;margin:10px 0}',
 '.phActions{display:flex;gap:7px;flex-wrap:wrap}',
 '.phBtn{border:0;border-radius:10px;padding:10px 12px;color:#351a65;background:white;font-size:12px;font-weight:850;cursor:pointer}',
 '.phBtn.alt{background:#ffffff23;color:white;border:1px solid #ffffff33}',
 '.phHomeCard{background:var(--card,#fff);border:1px solid var(--line,#e3dce8);border-radius:16px;margin:11px 0;padding:13px}',
 '.phHomeCard h3{margin:0 0 10px;font-size:15px}',
 '.phRivalRow{display:flex;justify-content:space-between;padding:8px 5px;gap:10px;font-size:12px;border-bottom:1px solid #d7cfdd66}',
 '.phRivalRow.me{background:#f1ecff;color:#3d2084;border-radius:9px;font-weight:850}',
 '.phShelf{display:flex;gap:8px;overflow-x:auto}.phMini{border-radius:10px;background:#251930;color:#fff;padding:9px;text-align:center;flex:1;min-width:85px;font-size:10px}',
 '.phMini .phSymbol{font-size:30px}.phMini b{display:block;color:#fff;font-size:10px}',
 '.phOverlay{position:fixed;z-index:19990;inset:0;background:#0a0717e8;display:flex;justify-content:center;align-items:stretch}',
 '.phPanel{width:min(100%,650px);height:100%;overflow-y:auto;padding:16px 14px 35px;background:linear-gradient(150deg,#151125,#322044);color:#f8f4ff}',
 '.phHeader{display:flex;justify-content:space-between;align-items:start;gap:9px}.phHeader h2{color:white;font-size:23px;margin:5px 0}.phSub{color:#c8b6da;font-size:11px}',
 '.phClose{background:#47305b;border:1px solid #745b85;color:#fff;border-radius:10px;padding:10px;cursor:pointer}',
 '.phTabs{display:flex;gap:6px;overflow-x:auto;margin:14px 0}.phTab{border:1px solid #685277;border-radius:10px;padding:10px;background:#352647;color:#e9ddef;font-weight:800;font-size:11px;flex:1;white-space:nowrap}',
 '.phTab.selected{background:#f4eaff;color:#352049}.phCounts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}',
 '.phCount{text-align:center;background:#48305e;border-radius:12px;padding:12px 3px}.phCount b{display:block;font-size:25px;color:#fff}.phCount span{font-size:10px;color:#d1c0de}',
 '.phSection{font-size:15px;margin:20px 0 10px;color:#fff;font-weight:900}',
 '.phGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
 '.phTrophy{background:linear-gradient(140deg,#3a2b48,#161324);border:1px solid #655578;border-radius:13px;padding:11px 8px;text-align:center;min-width:0}',
 '.phTrophy b{color:#fff;display:block;font-size:12px;margin-top:7px}.phTrophy p{color:#d3c2dd;font-size:11px;line-height:1.45;margin:5px 0}',
 '.phTrophy small{color:#c0b1d0;font-size:10px}.phTrophy .phSymbol{display:block;font-size:49px;line-height:1.45;filter:drop-shadow(0 4px 10px #0008)}',
 '.phSvg{filter:drop-shadow(0 5px 7px #0008);max-width:100%;height:78px}.phMini .phSvg{height:48px;width:48px}.phTrophy.gold .phSvg,.phMini.gold .phSvg{color:#f5ce6a}.phTrophy.ruby .phSvg,.phMini.ruby .phSvg{color:#fa8798}.phTrophy.emerald .phSvg,.phMini.emerald .phSvg{color:#58e2b3}.phTrophy.blue .phSvg,.phMini.blue .phSvg{color:#84c7ff}.phTrophy.violet .phSvg,.phMini.violet .phSvg{color:#cea1ff}.phTrophy.amber .phSvg,.phMini.amber .phSvg{color:#ffc076}.phTrophy.ice .phSvg,.phMini.ice .phSvg{color:#8eeaf4}',
 '.phTrophy.gold{border-color:#bd9b54}.phTrophy.emerald{border-color:#32aa86}.phTrophy.blue{border-color:#6796e7}.phTrophy.ruby{border-color:#d56b81}',
 '.phTrophy.ice{border-color:#6bd6e3}.phTrophy.violet{border-color:#ad7bde}.phTrophy.amber{border-color:#cb9454}',
 '.phTrophy.locked{opacity:.45;filter:grayscale(1)}.phQty{display:inline-block;border-radius:10px;padding:4px 10px;background:#624476;font-size:11px;margin:6px 0}',
 '.phHallRow{display:flex;justify-content:space-between;gap:6px;border-bottom:1px solid #57456b;padding:11px 1px;font-size:12px}.phHallRow b{color:#fff}.phHallRow span{color:#d9c9e4}',
 '.phGameRow{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #57456b;padding:9px 0;font-size:12px}.phGameRow b{color:#fff;white-space:nowrap}.phGameRow small{display:block;color:#bea9d4}',
 '.phHelp{font-size:11px;color:#bfaed1;line-height:1.5;margin-top:12px}',
 
'.phSwitcher{position:sticky;top:-16px;z-index:10;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:10px 0;background:linear-gradient(#1b142d 85%,#1b142deb);margin:7px 0 5px}',
'.phSwitch{border:1px solid #6b537c;border-radius:10px;background:#3a294c;color:#fff;font-weight:800;font-size:10px;min-height:42px;padding:8px 2px;white-space:nowrap;cursor:pointer}',
'.phSwitch.selected{background:#f5eafc;color:#322049;border-color:#f5eafc}',
'.phFilterBar{display:flex;gap:7px;margin:14px 0}.phFilter{background:#3e2c55;color:#f3eafb;border:1px solid #67557a;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:800}.phFilter.selected{background:#f2e9fc;color:#342044}',
'.phBack{display:block;background:#45335b;color:#fff;border:1px solid #78608f;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:800;margin:12px 0;text-align:left;cursor:pointer}',
'.phTrophyAction{width:100%;display:block;cursor:pointer;font-family:inherit}.phTrophyAction:active,.phHallAction:active,.phLeagueCategory:active{transform:scale(.985)}',
'.phTrophyAction:focus-visible,.phSwitch:focus-visible,.phHallAction:focus-visible{outline:3px solid #e8c36c;outline-offset:2px}',
'.phHallAction{width:100%;text-align:left;cursor:pointer;border-left:0;border-right:0;border-top:0;background:transparent;color:inherit;font-family:inherit;align-items:center}',
'.phHallAction small{display:block;margin-top:3px;color:#bba8cd;font-size:10px;font-weight:400}',
'.phChevron{font-size:21px;color:#efdfab;font-weight:950;vertical-align:middle}',
'.phLeagueCategory{display:flex;align-items:center;gap:9px;background:#30233e;color:#f9f3ff;text-align:left;padding:9px 8px;border-radius:12px;border:1px solid #604a78;width:100%;margin:7px 0;cursor:pointer;font-family:inherit}',
'.phLeagueCategoryArt{flex:0 0 52px;height:52px;display:grid;place-items:center}.phLeagueCategoryArt .phSvg{width:44px;height:44px}.phLeagueCategoryArt.gold{color:#efc665}.phLeagueCategoryArt.ruby{color:#fe8a9d}.phLeagueCategoryArt.emerald{color:#59d5a7}.phLeagueCategoryArt.blue{color:#85b6f0}.phLeagueCategoryArt.violet{color:#cc9cf5}.phLeagueCategoryArt.amber{color:#ffbe6a}.phLeagueCategoryArt.ice{color:#6ce3e3}',
'.phLeagueCategoryInfo{flex:1;min-width:0}.phLeagueCategoryInfo b{display:block;color:#fff;font-size:12px}.phLeagueCategoryInfo small{display:block;color:#c0acd5;font-size:10px;margin:2px 0}.phLeagueCategoryInfo span{display:block;color:#eee0f7;font-size:10px;line-height:1.3}',
'.phAwardRow{display:flex;text-align:left;align-items:center;justify-content:space-between;gap:8px;background:#302341;color:#fff;border:1px solid #604b77;border-radius:10px;width:100%;padding:11px 10px;margin:6px 0;font-family:inherit;cursor:pointer}',
'.phAwardRow b{font-size:12px;color:#fff}.phAwardRow small{display:block;font-size:11px;color:#d9c5e6;line-height:1.4;margin-top:4px}',
'.phAwardHero{text-align:center;border:1px solid #715e82;background:linear-gradient(135deg,#48336b,#292043);border-radius:16px;padding:18px;margin:12px 0}.phAwardHero .phSymbol{display:block;color:#ffd073}.phAwardHero .phSymbol svg{height:102px;width:102px}.phAwardHero h2{color:#fff;font-size:22px}.phAwardHero p{color:#d8c5e9;font-size:12px}',
'.phAwardExplanation{background:#453257;border-radius:12px;padding:14px;color:#fff;font-size:15px;line-height:1.45;font-weight:700}',

 '@media(min-width:650px){.phOverlay{align-items:center;padding:15px}.phPanel{height:auto;max-height:92dvh;border-radius:18px}.phGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}'
 ].join('');
 document.head.appendChild(e);
}
async function load(force=false){
 if(!force&&cached&&Date.now()-cacheAt<60000)return cached;
 if(fetching)return fetching;
 fetching=(async()=>{
  const {data:auth}=await sb.auth.getSession();const uid=auth?.session?.user?.id;
  if(!uid)return null;
  const mem=await sb.from('league_members').select('league_id,role').eq('user_id',uid).eq('status','active').limit(1);
  if(mem.error||!mem.data?.length)return null;
  const lid=mem.data[0].league_id;
  const r=await Promise.all([
   sb.from('trophy_awards').select('id,user_id,category,matchweek,metric,context,season').eq('league_id',lid).is('revoked_at',null),
   sb.from('league_standings_with_ai').select('entrant_id,entrant_type,manager_name,team_name,total_points,exact_scores,correct_outcomes').eq('league_id',lid),
   sb.rpc('get_league_history',{p_league_id:lid,p_limit:200}),
   sb.rpc('get_current_match_centre',{p_league_id:lid}),
   sb.from('league_members').select('user_id,role').eq('league_id',lid).eq('status','active')
  ]);
  if(r[0].error)throw r[0].error;if(r[1].error)throw r[1].error;
  const ids=(r[4].data||[]).map(m=>m.user_id);
  const prof=ids.length?await sb.from('profiles').select('user_id,display_name,team_name').in('user_id',ids):{data:[]};
  const profiles=Object.fromEntries((prof.data||[]).map(x=>[x.user_id,x]));
  cached={uid,lid,profiles,role:mem.data[0].role,
   awards:r[0].data||[],history:r[2].data||[],fixtures:r[3].data||[],
   standings:(r[1].data||[]).sort((a,b)=>num(b.total_points)-num(a.total_points)||num(b.exact_scores)-num(a.exact_scores)||num(b.correct_outcomes)-num(a.correct_outcomes)||String(a.manager_name).localeCompare(String(b.manager_name)))};
  cacheAt=Date.now();return cached;
 })();
 try{return await fetching}finally{fetching=null}
}
function who(d,id){return d.profiles[id]?.display_name||d.standings.find(s=>String(s.entrant_id)===String(id))?.manager_name||'Player'}
function awardName(cat){return index[cat]?.[1]||cat}
function awardType(cat){return index[cat]||defs[0]}
function myAwards(d){return d.awards.filter(a=>a.user_id===d.uid)}
function latestWeek(d){return Math.max(0,...d.awards.map(a=>num(a.matchweek)))}
function weekly(d,week){
 let points=0,exacts=0,correct=0,played=0;const matches=[];
 for(const f of d.history.filter(f=>num(f.matchweek)===week&&f.result_home_score!=null)){
  const p=(f.predictions||[]).find(p=>String(p.user_id)===d.uid);
  if(!p||p.home_score==null||p.away_score==null)continue;
  const pts=num(p.points);points+=pts;exacts+=pts===3?1:0;correct+=pts>0?1:0;played++;
  matches.push({name:f.home_team+' v '+f.away_team,guess:p.home_score+'–'+p.away_score,score:f.result_home_score+'–'+f.result_away_score,pts});
 }
 return {points,exacts,correct,played,matches};
}
function homeVisible(){
 const main=document.getElementById('main');
 // The main app knows which view is open. Other Home modules may hide or replace
 // legacy headings, so use navigation state rather than fragile heading matching.
 return !!main && !!document.querySelector('#nav button[data-v="home"].active');
}
function placeHonours(main,el){
 const host=main.querySelector(':scope > .hfHost');
 if(host){
  // Home Focus hides other top-level Home cards. Insert the trophy feature *inside*
  // the visible Home Focus container and keep it below the existing club hero.
  const header=el.querySelector('.phHero');
  if(header){
   header.classList.add('phUnderHero');
   const heading=header.querySelector('h2');
   // The compact honours panel already has its own heading; do not replace it.
  }
  const hero=host.querySelector('.hfHero');
  if(hero)hero.insertAdjacentElement('afterend',el);
  else host.prepend(el);
  el.classList.remove('hfLegacyHidden');
  return;
 }
 // Fallback for loading before Home Focus is ready.
 main.prepend(el);
}
function renderHome(d){
 const main=document.getElementById('main');
 if(!homeVisible())return;
 const existing=document.getElementById('ph-personal-home');
 if(existing){
  // Home Focus may load after the first Home render. Re-home the honours without
  // recreating the page or sending another network request.
  const host=main.querySelector(':scope > .hfHost');
  if(host&&existing.parentElement!==host)placeHonours(main,existing);
  return;
 }
 const rank=d.standings.findIndex(x=>x.entrant_type==='human'&&String(x.entrant_id)===d.uid);
 const week=latestWeek(d),stats=weekly(d,week),awards=myAwards(d);
 const count=awards.filter(a=>a.category!=='league_leader').length,crowns=awards.length-count;
 // Focus on the very next upcoming matchweek, never combine MW11 and MW12 into
 // a frightening "20 predictions missing" message.
 const open=d.fixtures.filter(f=>f.result_home_score==null&&Date.parse(f.prediction_lock_at)>Date.now()&&f.matchweek!=null).sort((a,b)=>Date.parse(a.prediction_lock_at)-Date.parse(b.prediction_lock_at));
 const nextRound=open.length?Math.min(...open.map(f=>num(f.matchweek))):null;
 const roundFixtures=open.filter(f=>num(f.matchweek)===nextRound);
 const missing=roundFixtures.filter(f=>f.your_home_score==null||f.your_away_score==null);
 const nextLock=roundFixtures[0];
 const date=nextLock?new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(nextLock.prediction_lock_at)):'Not scheduled';
 const start=rank===0?0:Math.max(0,rank-1);
 const rivals=d.standings.slice(start,Math.min(d.standings.length,start+3));
 const rows=rivals.map(x=>'<div class="phRivalRow '+(String(x.entrant_id)===d.uid?'me':'')+'"><span>'+(d.standings.indexOf(x)+1)+'. '+esc(x.manager_name||x.team_name)+'</span><b>'+num(x.total_points)+' pts</b></div>').join('');
 const shelf=awards.slice().sort((a,b)=>b.matchweek-a.matchweek).slice(0,3).map(a=>'<div class="phMini '+awardType(a.category)[3]+'"><span class="phSymbol">'+trophyArtwork(a.category)+'</span><b>'+esc(awardName(a.category))+'</b>MW'+a.matchweek+'</div>').join('');
 const el=document.createElement('section');el.id='ph-personal-home';
 el.innerHTML='<div class="phHero phUnderHero phCompactHonours"><div class="phEyebrow">🏆 SEASON 2026/27 · YOUR HONOURS</div>'+
 '<h2>Your trophy collection</h2>'+
 '<div class="phHonoursLine"><span><b>'+count+'</b> performance trophies</span><span>👑 <b>'+crowns+'</b> leader crowns</span><span>⚽ <b>'+stats.points+'</b> MW'+week+' pts</span></div>'+
 (nextRound?'<p class="phInfo">Next: <b>MW'+nextRound+'</b> · <b>'+missing.length+'/'+roundFixtures.length+'</b> picks to make · first lock '+esc(date)+'</p>':'<p class="phInfo">All upcoming picks accounted for.</p>')+
 '<div class="phActions"><button class="phBtn" data-ph-open="cabinet">🏆 View my cabinet</button><button class="phBtn alt" data-ph-open="story">My weekly story</button></div></div>'+
 '<div class="phHomeCard"><h3>⚔️ Your nearest rivals</h3>'+rows+'</div>'+
 '<div class="phHomeCard"><h3>🏆 Your latest trophies</h3><div class="phShelf">'+(shelf||'No trophies yet — every week is a new chance!')+'</div><button class="phBtn" style="margin-top:11px;background:#432a7b;color:#fff" data-ph-open="hall">View Hall of Fame</button></div>';
 el.onclick=e=>{const b=e.target.closest('[data-ph-open]');if(b)open(b.dataset.phOpen)};
 placeHonours(main,el);
}

function ownedBy(d,uid){
 return d.awards.filter(a=>String(a.user_id)===String(uid));
}
function statsFor(d,uid){
 const list=ownedBy(d,uid),sports=list.filter(a=>a.category!=='league_leader');
 return {list,sports,crowns:list.length-sports.length,types:new Set(sports.map(a=>a.category)).size};
}
function awardDetailText(a){
 const x=a.context||{},v=num(a.metric);
 switch(a.category){
  case 'matchweek_champion':return v+' points in Matchweek '+a.matchweek;
  case 'exact_master':return v+' exact score'+(v===1?'':'s')+' in Matchweek '+a.matchweek;
  case 'league_leader':return 'Finished Matchweek '+a.matchweek+' top of the overall league on '+v+' points';
  case 'biggest_climber':return 'Climbed '+v+' league places: '+num(x.before)+'th → '+num(x.after)+'th';
  case 'consistency_shield':return v+' correct match outcomes';
  case 'precision_trophy':return v+'% exact-score conversion ('+num(x.exacts)+' exacts from '+num(x.scoring_picks)+' scoring predictions)';
  case 'bold_call':return (x.home_team||'')+' v '+(x.away_team||'')+' · '+(x.predicted_score||'')+' (final '+(x.actual_score||'')+'); '+num(x.backed_by)+' player'+(num(x.backed_by)===1?'':'s')+' backed that result';
  case 'final_day_hero':return v+' points on the matchweek’s final playing day';
  default:return v+' points';
 }
}
function card(category,awards){
 const def=awardType(category),count=awards.length;
 const weeks=awards.map(a=>num(a.matchweek)).sort((a,b)=>a-b);
 const detail=count?'Won in Matchweek'+(count===1?' ':'s ')+weeks.join(', '):def[4];
 const inside='<span class="phSymbol">'+trophyArtwork(category)+'</span><b>'+esc(def[1])+'</b>'+
 (count?'<span class="phQty">× '+count+'</span>':'')+'<p>'+esc(detail)+'</p>'+
 (count?'<small>Tap for award details ›</small>':'<small>Not yet earned</small>');
 if(!count)return '<div class="phTrophy '+def[3]+' locked" aria-label="'+esc(def[1])+': not earned">'+inside+'</div>';
 return '<button type="button" class="phTrophy phTrophyAction '+def[3]+'" data-ph-category="'+esc(category)+'" aria-label="Open '+esc(def[1])+' trophies">'+inside+'</button>';
}
function countersFor(s){
 return '<div class="phCounts"><div class="phCount"><b>'+s.sports.length+'</b><span>Performance trophies</span></div>'+
 '<div class="phCount"><b>'+s.crowns+'</b><span>Leader crowns</span></div>'+
 '<div class="phCount"><b>'+s.types+'/7</b><span>Trophy types</span></div></div>';
}
function cabinet(d,uid=d.uid){
 const s=statsFor(d,uid);
 const tabs='<div class="phFilterBar">'+[['football','Football honours'],['engagement','Engagement']].map(x=>'<button type="button" class="phFilter '+(activeFilter===x[0]?'selected':'')+'" data-ph-filter="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
 const grid=activeFilter==='engagement'
  ?coming.map(x=>'<div class="phTrophy locked"><span class="phSymbol">'+trophyArtwork('consistency_shield')+'</span><b>'+esc(x[0])+'</b><p>'+esc(x[1])+'</p><small>Coming soon · genuine activity tracking</small></div>').join('')
  :defs.filter(x=>x[0]!=='league_leader').map(x=>card(x[0],s.sports.filter(a=>a.category===x[0]))).join('');
 const isMe=String(uid)===String(d.uid);
 return (isMe?'':'<button type="button" class="phBack" data-ph-tab="league">← All league cabinets</button>')+
 '<p class="phHelp">'+(isMe?'Your earned trophies from completed matchweeks.':'Viewing '+esc(who(d,uid))+'’s collection — trophy holders are visible to all league members.')+'</p>'+
 countersFor(s)+tabs+
 '<div class="phSection">'+(activeFilter==='engagement'?'Participation awards — preview':'Performance trophy shelf')+'</div><div class="phGrid">'+grid+'</div>'+
 (activeFilter==='football'?'<div class="phSection">👑 League Leader crowns</div><div class="phGrid">'+card('league_leader',s.list.filter(a=>a.category==='league_leader'))+'</div>':'')+
 '<p class="phHelp">Tap an earned trophy to see every matchweek and why it was awarded. Tied winners receive separate trophies. Engagement awards do not affect football points.</p>';
}
function membersWithAwards(d){
 const human=d.standings.filter(x=>x.entrant_type==='human');
 return human.map(row=>({id:row.entrant_id,name:who(d,row.entrant_id),...statsFor(d,row.entrant_id)}))
 .sort((a,b)=>b.sports.length-a.sports.length||b.types-a.types||b.crowns-a.crowns||a.name.localeCompare(b.name));
}
function leagueCabinet(d){
 const people=membersWithAwards(d);
 const categories=defs.map(def=>{
  const all=d.awards.filter(a=>a.category===def[0]),peopleById=new Map();
  for(const a of all)peopleById.set(a.user_id,(peopleById.get(a.user_id)||0)+1);
  const holders=[...peopleById].sort((a,b)=>b[1]-a[1]||who(d,a[0]).localeCompare(who(d,b[0]))).map(([id,count])=>who(d,id)+(count>1?' ×'+count:''));
  return '<button type="button" class="phLeagueCategory" data-ph-league-category="'+def[0]+'">'+
   '<span class="phLeagueCategoryArt '+def[3]+'">'+trophyArtwork(def[0])+'</span><span class="phLeagueCategoryInfo">'+
   '<b>'+esc(def[1])+'</b><small>'+all.length+' awarded · '+peopleById.size+' holder'+(peopleById.size===1?'':'s')+'</small>'+
   '<span>'+esc(holders.length?holders.join(', '):'No winners yet')+'</span></span><span class="phChevron">›</span></button>';
 }).join('');
 return '<p class="phHelp"><strong>The league trophy cabinet is open to every active player.</strong> Browse all '+people.length+' members, see who holds every award, and tap a name to inspect their cabinet.</p>'+
 '<div class="phSection">🏆 Who holds each trophy?</div><div class="phLeagueCategories">'+categories+'</div>'+
 '<div class="phSection">👥 Every player’s cabinet</div>'+
 people.map((p,i)=>'<button type="button" class="phHallRow phHallAction" data-ph-member="'+esc(p.id)+'">'+
  '<span><b>'+(i+1)+'. '+esc(p.name)+'</b><small> '+p.types+' trophy types</small></span>'+
  '<span>🏆 '+p.sports.length+' · 👑 '+p.crowns+' <span class="phChevron">›</span></span></button>').join('');
}
function hall(d){
 const people=membersWithAwards(d);
 return '<div class="phSection">🏛️ Hall of Fame</div><p class="phHelp">Performance honours rank the players. Weeks at the top count as separate crowns. Select any name to view their complete trophy collection.</p>'+
 people.map((p,i)=>'<button type="button" class="phHallRow phHallAction" data-ph-member="'+esc(p.id)+'">'+
 '<span><b>'+(i+1)+'. '+esc(p.name)+'</b><small> '+p.types+'/7 types collected</small></span>'+
 '<span>🏆 '+p.sports.length+' · 👑 '+p.crowns+' <span class="phChevron">›</span></span></button>').join('')+
 '<button type="button" class="phBack" data-ph-tab="league">Browse the full league cabinet ›</button>';
}
function categoryBreakdown(d,category){
 const def=awardType(category),own=selectedMemberId;
 const arr=d.awards.filter(a=>a.category===category && (own===null||String(a.user_id)===String(own)))
  .sort((a,b)=>b.matchweek-a.matchweek||who(d,a.user_id).localeCompare(who(d,b.user_id)));
 const title=def[2]+' '+def[1],subtitle=own===null?'All winners across the league':'Trophies earned by '+who(d,own);
 return '<button type="button" class="phBack" data-ph-back>← Back</button>'+
 '<div class="phSection">'+esc(title)+'</div><p class="phHelp">'+esc(def[4])+' · '+esc(subtitle)+'</p>'+
 (arr.length?arr.map(a=>'<button type="button" class="phAwardRow" data-ph-award="'+esc(a.id)+'">'+
 '<span><b>MW'+a.matchweek+' · '+esc(who(d,a.user_id))+'</b><small>'+esc(awardDetailText(a))+'</small></span><span class="phChevron">›</span></button>').join(''):'<p class="phHelp">No qualifying trophies awarded.</p>');
}
function individualAward(d){
 const a=d.awards.find(a=>String(a.id)===String(selectedAwardId));
 if(!a)return '<button class="phBack" data-ph-back>← Back</button><p class="phHelp">Award not found.</p>';
 const def=awardType(a.category);
 const others=d.awards.filter(x=>x.category===a.category&&x.matchweek===a.matchweek).map(x=>who(d,x.user_id));
 return '<button type="button" class="phBack" data-ph-back>← Back to trophies</button>'+
 '<div class="phAwardHero"><div class="phSymbol">'+trophyArtwork(a.category)+'</div><h2>'+esc(def[1])+'</h2>'+
 '<p>Matchweek '+a.matchweek+' · Season '+esc(a.season)+'</p></div>'+
 '<div class="phSection">Awarded to '+esc(who(d,a.user_id))+'</div>'+
 '<div class="phAwardExplanation">'+esc(awardDetailText(a))+'</div>'+
 '<p class="phHelp">'+esc(def[4])+'. '+(others.length>1?'Joint winners: '+esc(others.join(', '))+'.':'This award was won outright.')+'</p>'+
 '<button type="button" class="phBack" data-ph-tab="league">Browse all league trophies ›</button>';
}
function story(d){
 const week=latestWeek(d),w=weekly(d,week),awards=myAwards(d).filter(a=>a.matchweek===week);
 const rows=w.matches.map(x=>'<div class="phGameRow"><div>'+esc(x.name)+'<small>Your pick '+esc(x.guess)+' · Actual '+esc(x.score)+'</small></div><b>'+x.pts+' pts</b></div>').join('');
 return '<div class="phSection">Your Matchweek '+week+' review</div>'+
 '<div class="phCounts"><div class="phCount"><b>'+w.points+'</b><span>Points</span></div><div class="phCount"><b>'+w.exacts+'</b><span>Exact scores</span></div><div class="phCount"><b>'+w.correct+'</b><span>Scoring picks</span></div></div>'+
 '<div class="phSection">Your trophies from this round</div>'+
 (awards.length?'<div class="phGrid">'+[...new Set(awards.map(a=>a.category))].map(cat=>card(cat,awards.filter(a=>a.category===cat))).join('')+'</div>':'<p class="phHelp">No trophies this week — another matchweek is another chance!</p>')+
 '<div class="phSection">Match-by-match breakdown</div>'+rows+
 '<button class="phBack" style="margin-top:15px" data-ph-link="weekly">🔗 Copy this story’s WhatsApp link</button>';
}
function close(){
 const node=document.getElementById('ph-overlay');if(!node)return;
 document.body.style.overflow=node.dataset.previous||'';node.remove();
 selectedAwardId=null;selectedCategory=null;selectedMemberId=null;
}
function activeMemberId(d){return activeTab==='player'?(selectedMemberId||d.uid):d.uid}
function tabGo(tab,d){
 if(!['cabinet','league','hall','story','player'].includes(tab))return;
 activeTab=tab; selectedCategory=null;selectedAwardId=null;
 if(tab==='cabinet')selectedMemberId=null;
 redraw(d);
}
function redraw(d){
 const ov=document.getElementById('ph-overlay');if(!ov)return;
 const tabNames={cabinet:'🏆 My Cabinet',league:'🏟️ League Cabinet',hall:'👑 Hall of Fame',story:'⚽ Weekly Review',player:'🏆 '+who(d,selectedMemberId)};
 const title=selectedAwardId?'Trophy details':selectedCategory?'Trophy winners':tabNames[activeTab]||tabNames.cabinet;
 const content=selectedAwardId?individualAward(d):selectedCategory?categoryBreakdown(d,selectedCategory):
 activeTab==='cabinet'?cabinet(d):activeTab==='league'?leagueCabinet(d):activeTab==='hall'?hall(d):
 activeTab==='player'?cabinet(d,selectedMemberId||d.uid):story(d);
 ov.innerHTML='<div class="phPanel" role="dialog" aria-modal="true" aria-label="Trophy collection">'+
 '<div class="phHeader"><div><div class="phEyebrow">Premier League Predictions · 2026/27</div><h2>'+esc(title)+'</h2><div class="phSub">Verified historical awards · shared with league members</div></div><button type="button" class="phClose" data-ph-close aria-label="Close trophy cabinet">✕</button></div>'+
 '<nav class="phSwitcher" aria-label="Trophy cabinet sections">'+
 [['cabinet','🏆 Mine'],['league','🏟️ League'],['hall','👑 Hall'],['story','⚽ Review']].map(x=>
 '<button type="button" class="phSwitch '+((activeTab===x[0]||(activeTab==='player'&&x[0]==='league'))?'selected':'')+'" data-ph-tab="'+x[0]+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<div class="phPanelBody">'+content+'</div></div>';
 const panel=ov.querySelector('.phPanel');
 if(panel)panel.scrollTop=0;
 ov.onclick=e=>{
  const btn=e.target.closest('button');
  if(!btn){if(e.target===ov)close();return}
  if(btn.hasAttribute('data-ph-close')){close();return}
  if(btn.hasAttribute('data-ph-back')){
    if(selectedAwardId){selectedAwardId=null;redraw(d);return}
    if(selectedCategory){selectedCategory=null;redraw(d);return}
    tabGo('league',d);return;
  }
  if(btn.dataset.phTab){tabGo(btn.dataset.phTab,d);return}
  if(btn.dataset.phMember){
    const valid=d.standings.some(s=>s.entrant_type==='human'&&String(s.entrant_id)===String(btn.dataset.phMember));
    if(!valid)return;
    selectedMemberId=btn.dataset.phMember; activeTab='player'; selectedCategory=null;selectedAwardId=null;
    redraw(d);return;
  }
  if(btn.dataset.phLeagueCategory){
    selectedMemberId=null;selectedCategory=btn.dataset.phLeagueCategory;selectedAwardId=null;
    redraw(d);return;
  }
  if(btn.dataset.phFilter){activeFilter=btn.dataset.phFilter;redraw(d);return}
  if(btn.dataset.phCategory){
    selectedMemberId=activeTab==='player'?selectedMemberId:d.uid;
    selectedCategory=btn.dataset.phCategory;selectedAwardId=null;
    redraw(d);return;
  }
  if(btn.dataset.phAward){selectedAwardId=btn.dataset.phAward;redraw(d);return}
  if(btn.dataset.phLink){
    const url=location.origin+location.pathname+'?open='+encodeURIComponent(btn.dataset.phLink);
    if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>alert('WhatsApp link copied.')).catch(()=>prompt('Copy link:',url));
    else prompt('Copy link:',url);
  }
 };
}
async function open(tab='cabinet'){
 styles();
 activeTab=['cabinet','league','hall','story'].includes(tab)?tab:'cabinet';
 selectedMemberId=null;selectedCategory=null;selectedAwardId=null;
 let ov=document.getElementById('ph-overlay');
 if(!ov){ov=document.createElement('div');ov.id='ph-overlay';ov.className='phOverlay';ov.dataset.previous=document.body.style.overflow;document.body.appendChild(ov)}
 document.body.style.overflow='hidden';ov.innerHTML='<div class="phPanel">Loading league trophies…</div>';
 try{const d=await load();if(d)redraw(d);else ov.innerHTML='<div class="phPanel">Sign in as a league member to view trophy awards. <button class="phClose" onclick="window.closePLPTrophies()">Close</button></div>'}
 catch(e){console.warn('Trophies unavailable:',e);ov.innerHTML='<div class="phPanel">Unable to load trophies at present. <button class="phClose" onclick="window.closePLPTrophies()">Close</button></div>'}
}

function scan(){
 if(scheduled)return;
 scheduled=setTimeout(async()=>{
  scheduled=null;
  if(!homeVisible())return;
  try{
   const d=await load();if(!d)return;renderHome(d);
   if(!handledLink){
    const requested=new URLSearchParams(location.search).get('open');
    if(['trophies','weekly','match','hall'].includes(requested)){
     handledLink=true;
     if(requested==='match')window.openPLPMatchCentre?.();
     else open(requested==='trophies'?'cabinet':requested==='weekly'?'story':'hall');
    }
   }
  }catch(e){console.warn('Personal homepage:',e)}
 },180);
}
window.openPLPTrophyCabinet=()=>open('cabinet');
window.openPLPTrophyHall=()=>open('hall');
window.openPLPWeeklyStory=()=>open('story');
window.closePLPTrophies=close;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('ph-overlay'))close()});
styles();
const main=document.getElementById('main');
if(main)new MutationObserver(scan).observe(main,{childList:true,subtree:true});
setTimeout(scan,600);
window.addEventListener('focus',()=>{cacheAt=0;scan()});
