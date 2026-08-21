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
  document.getElementById('plp-live-scroll-css')?.remove();

  const st=document.createElement('style');
  st.id='plp-live-scroll-css';
  st.textContent=`
    /* Club crest: header only. */
    body.clubBgOn::before,
    .plpClubCrestLayer{
      display:none!important;
    }

    /* Remove both decorative football-player silhouettes. */
    .predictionStatus.plpEnhancer::after,
    header::after{
      display:none!important;
      content:none!important;
      background-image:none!important;
    }

    /* Favourite-club crest stays only at the top. */
    body.clubBgOn header::before{
      display:block!important;
      width:245px!important;
      height:245px!important;
      right:-46px!important;
      bottom:-58px!important;
      opacity:.18!important;
      background-size:contain!important;
      background-position:center!important;
    }

    /* Strong, fixed full-screen tab photograph. */
    .plpTabPhotoLayer{
      position:fixed!important;
      inset:0!important;
      z-index:0!important;
      pointer-events:none!important;
      opacity:.70!important;
      filter:saturate(.98) contrast(.98) brightness(.94)!important;
      background-size:cover!important;
      background-repeat:no-repeat!important;
      background-position:0% 0%!important;
      will-change:background-position;
      transition:background-image .2s ease-out!important;
    }

    /* Remove the old pale veil which was hiding the photo. */
    body>.app{
      position:relative!important;
      z-index:1!important;
      background:rgba(246,246,251,.04)!important;
      min-height:100vh!important;
    }

    /* Content remains readable while the photo is clearly visible. */
    main .card,
    main .fixture,
    main .mwSelect,
    main .aiBox,
    main .historyFixture{
      background:rgba(255,255,255,.88)!important;
      backdrop-filter:blur(1.5px);
      -webkit-backdrop-filter:blur(1.5px);
    }

    .predictionStatus.plpEnhancer.good{background:rgba(232,255,248,.93)!important}
    .predictionStatus.plpEnhancer.calm{background:rgba(243,239,255,.93)!important}
    .predictionStatus.plpEnhancer.attention{background:rgba(255,247,217,.93)!important}
    .predictionStatus.plpEnhancer.urgent{background:rgba(255,240,242,.93)!important}

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

    @media(max-width:520px){
      .plpTabPhotoLayer{opacity:.74!important}
      body>.app{background:rgba(246,246,251,.02)!important}

      body.clubBgOn header::before{
        width:220px!important;
        height:220px!important;
        right:-42px!important;
        bottom:-52px!important;
        opacity:.19!important;
      }

      main .card,
      main .fixture,
      main .mwSelect,
      main .aiBox,
      main .historyFixture{
        background:rgba(255,255,255,.86)!important;
      }
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

    const h2=[...document.querySelectorAll('#main .card h2')]
      .find(x=>x.textContent.trim()==='League table');

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

      stamp.textContent=`Live table · refreshed ${new Date().toLocaleTimeString(
        'en-GB',{hour:'2-digit',minute:'2-digit'}
      )}`;
    }
  }catch(e){
    console.warn('Live table refresh:',e);
  }finally{
    tableRefreshing=false;
  }
}

function youtubeSearch(home,away){
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${home} ${away} Premier League highlights Sky Sports`
  )}`;
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
      a.textContent=f.highlight_url
        ? '▶ YouTube highlights'
        : '▶ Find YouTube highlights';

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

  const maxScroll=Math.max(
    1,
    document.documentElement.scrollHeight-window.innerHeight
  );

  const progress=Math.max(
    0,
    Math.min(1,window.scrollY/maxScroll)
  );

  const pct=Math.round(progress*100);

  /*
    cover fills the phone screen.
    Start at top/left and travel to bottom/right as the user scrolls.
    Landscape photos therefore reveal their full width progressively;
    portrait/square photos reveal their full height progressively.
  */
  layer.style.setProperty(
    'background-position',
    `${pct}% ${pct}%`,
    'important'
  );
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
    addUxCss();
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

if(main){
  new MutationObserver(scheduleEnhance)
    .observe(main,{childList:true,subtree:true});
}

document.addEventListener('click',e=>{
  if(e.target.closest('#nav button')){
    setTimeout(()=>{
      window.scrollTo({top:0});
      addUxCss();
      updatePhotoReveal();
    },100);
  }
},true);

setInterval(()=>{
  if(isTableOpen()) refreshTable();
  refreshHistoryLinks();
},15000);

try{
  uxSb.channel('plp-live-results')
    .on('postgres_changes',{
      event:'*',
      schema:'public',
      table:'results'
    },()=>{
      setTimeout(refreshTable,250);
      setTimeout(refreshHistoryLinks,500);
    })
    .subscribe();
}catch(e){
  console.warn('Realtime results:',e);
}

scheduleEnhance();
