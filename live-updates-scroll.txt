import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const uxSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let uxLeagueId = null;
let tableRefreshing = false;
let highlightRefreshing = false;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function addUxCss(){
  if(document.getElementById('plp-live-scroll-css')) return;
  const st=document.createElement('style');
  st.id='plp-live-scroll-css';
  st.textContent=`
    /* Reveal the whole tab photograph progressively as the page scrolls. */
    .plpTabPhotoLayer{
      background-size:100% auto!important;
      background-repeat:no-repeat!important;
      background-position:center top!important;
      will-change:background-position;
    }
    body.photoRevealOn>.app{
      min-height:max(100vh,180vh)!important;
    }
    body.photoRevealOn .plpClubCrestLayer{
      position:fixed!important;
    }
    .plpLiveStamp{
      font-size:8.5px;
      color:#716f82;
      margin-top:7px;
      text-align:right;
    }
    .plpHighlightsRow{
      display:flex;
      gap:7px;
      flex-wrap:wrap;
      margin-top:8px;
    }
    @media(min-width:761px){
      body.photoRevealOn>.app{min-height:140vh!important}
      .plpTabPhotoLayer{background-size:min(760px,100vw) auto!important;background-position:center top!important}
    }
  `;
  document.head.appendChild(st);
}

async function getLeagueId(){
  if(uxLeagueId) return uxLeagueId;
  const {data:{session}}=await uxSb.auth.getSession();
  if(!session) return null;
  const {data,error}=await uxSb.from('league_members')
    .select('league_id,status')
    .eq('user_id',session.user.id);
  if(error) throw error;
  uxLeagueId=(data||[]).find(x=>x.status==='active')?.league_id||null;
  return uxLeagueId;
}

function isTableOpen(){
  return !!document.querySelector('#nav button[data-v="table"].active');
}

function tableMarkup(rows){
  const sorted=[...rows].sort((a,b)=>
    (+b.total_points||0)-(+a.total_points||0) ||
    (+b.exact_scores||0)-(+a.exact_scores||0) ||
    (+b.correct_outcomes||0)-(+a.correct_outcomes||0) ||
    String(a.team_name||'').localeCompare(String(b.team_name||''))
  );
  return `<thead><tr><th>#</th><th>Team</th><th class="num">Pts</th><th class="num">Exact</th><th class="num">Correct</th></tr></thead>
  <tbody>${sorted.map((r,i)=>`<tr>
    <td><b>${i+1}</b></td>
    <td><b>${esc(r.badge||'⚽')} ${esc(r.team_name||r.manager_name||'Team')}</b>
      <div class="tiny">${r.entrant_type==='ai'?'AI · ':''}${esc(r.manager_name||'')}</div>
    </td>
    <td class="num"><b>${+r.total_points||0}</b></td>
    <td class="num">${+r.exact_scores||0}</td>
    <td class="num">${+r.correct_outcomes||0}</td>
  </tr>`).join('')}</tbody>`;
}

async function refreshTable(){
  if(tableRefreshing || !isTableOpen()) return;
  tableRefreshing=true;
  try{
    const lid=await getLeagueId();
    if(!lid) return;
    const {data,error}=await uxSb.from('league_standings_with_ai')
      .select('*')
      .eq('league_id',lid);
    if(error) throw error;

    const h2=[...document.querySelectorAll('#main .card h2')].find(x=>x.textContent.trim()==='League table');
    const card=h2?.closest('.card');
    const table=card?.querySelector('table');
    if(table){
      table.innerHTML=tableMarkup(data||[]);
      let stamp=card.querySelector('.plpLiveStamp');
      if(!stamp){
        stamp=document.createElement('div');
        stamp.className='plpLiveStamp';
        card.appendChild(stamp);
      }
      stamp.textContent=`Live table · refreshed ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
    }
  }catch(e){
    console.warn('Live table refresh:',e);
  }finally{
    tableRefreshing=false;
  }
}

function youtubeSearch(home,away){
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${home} ${away} Premier League highlights Sky Sports`)}`;
}

async function refreshHistoryLinks(){
  if(highlightRefreshing || !document.querySelector('.historyFixture')) return;
  highlightRefreshing=true;
  try{
    const lid=await getLeagueId();
    if(!lid) return;
    const {data,error}=await uxSb.from('fixtures')
      .select('home_team,away_team,status,highlight_url,highlight_title')
      .eq('league_id',lid)
      .eq('status','completed');
    if(error) throw error;

    const map=new Map((data||[]).map(f=>[`${f.home_team} v ${f.away_team}`,f]));
    for(const card of document.querySelectorAll('.historyFixture')){
      const title=(card.querySelector('.historyHead span')?.textContent||'').trim();
      const f=map.get(title);
      if(!f) continue;

      let row=card.querySelector('.plpHighlightsRow');
      if(!row){
        row=document.createElement('div');
        row.className='plpHighlightsRow';
        card.appendChild(row);
      }

      const existing=card.querySelector('a[href*="youtube.com"]');
      if(existing){
        existing.textContent='▶ YouTube highlights';
        continue;
      }

      const a=document.createElement('a');
      a.className='btn link small';
      a.target='_blank';
      a.rel='noopener';
      a.href=f.highlight_url || youtubeSearch(f.home_team,f.away_team);
      a.textContent=f.highlight_url?'▶ YouTube highlights':'▶ Find YouTube highlights';
      row.appendChild(a);
    }
  }catch(e){
    console.warn('History highlights:',e);
  }finally{
    highlightRefreshing=false;
  }
}

function updatePhotoReveal(){
  const layer=document.getElementById('plp-tab-photo-layer');
  if(!layer) return;
  document.body.classList.add('photoRevealOn');

  const maxScroll=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
  const progress=Math.max(0,Math.min(1,window.scrollY/maxScroll));
  layer.style.backgroundPosition=`center ${Math.round(progress*100)}%`;
}

let ticking=false;
function onScroll(){
  if(ticking) return;
  ticking=true;
  requestAnimationFrame(()=>{
    updatePhotoReveal();
    ticking=false;
  });
}

function scheduleEnhance(){
  clearTimeout(scheduleEnhance.t);
  scheduleEnhance.t=setTimeout(()=>{
    updatePhotoReveal();
    if(isTableOpen()) refreshTable();
    refreshHistoryLinks();
  },120);
}

addUxCss();
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',scheduleEnhance);
window.addEventListener('focus',scheduleEnhance);

const main=document.getElementById('main');
if(main) new MutationObserver(scheduleEnhance).observe(main,{childList:true,subtree:true});

document.addEventListener('click',e=>{
  if(e.target.closest('#nav button')) setTimeout(()=>{
    window.scrollTo({top:0});
    scheduleEnhance();
  },80);
},true);

/* Polling is a fallback even if database realtime is unavailable. */
setInterval(()=>{
  if(isTableOpen()) refreshTable();
  refreshHistoryLinks();
},15000);

/* Realtime makes the visible table react as soon as a result row changes. */
try{
  uxSb.channel('plp-live-results')
    .on('postgres_changes',{event:'*',schema:'public',table:'results'},()=>{
      setTimeout(refreshTable,250);
      setTimeout(refreshHistoryLinks,500);
    })
    .subscribe();
}catch(e){ console.warn('Realtime results:',e); }

scheduleEnhance();
