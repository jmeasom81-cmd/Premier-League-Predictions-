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
    /* Favourite club crest only in the purple header. */
    body.clubBgOn::before,
    .plpClubCrestLayer{
      display:none!important;
    }

    /* Remove decorative football-player silhouettes. */
    .predictionStatus.plpEnhancer::after,
    header::after{
      display:none!important;
      content:none!important;
      background-image:none!important;
    }

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

    /*
      THE PHOTO NEVER MOVES.
      It is fixed to the phone screen and the full image is always fitted inside
      the viewport. The page content scrolls independently over the top.
    */
    .plpTabPhotoLayer{
      position:fixed!important;
      inset:0!important;
      width:100vw!important;
      height:100vh!important;
      z-index:0!important;
      pointer-events:none!important;
      transform:none!important;
      opacity:.82!important;
      filter:saturate(1) contrast(.98) brightness(.92)!important;
      background-repeat:no-repeat!important;
      background-size:contain!important;
      background-position:center center!important;
      background-color:#f2f1f7!important;
      transition:background-image .18s ease-out!important;
    }

    body>.app{
      position:relative!important;
      z-index:1!important;
      background:transparent!important;
      min-height:100vh!important;
      padding-bottom:0!important;
    }

    header{
      position:relative!important;
      z-index:3!important;
    }

    main{
      position:relative!important;
      z-index:2!important;
      background:transparent!important;
    }

    /*
      This is the important new behaviour:
      add one full empty screen after the final piece of content.
      That gives enough scroll distance for EVERY card/text block and the header
      to disappear above the phone, leaving only the static photograph visible.
    */
    main::after{
      content:"";
      display:block;
      height:calc(100vh + 110px);
      pointer-events:none;
    }

    main .card,
    main .fixture,
    main .mwSelect,
    main .aiBox,
    main .historyFixture{
      background:rgba(255,255,255,.88)!important;
      backdrop-filter:blur(1px);
      -webkit-backdrop-filter:blur(1px);
      box-shadow:0 8px 24px rgba(25,18,65,.08)!important;
    }

    .predictionStatus.plpEnhancer.good{background:rgba(232,255,248,.94)!important}
    .predictionStatus.plpEnhancer.calm{background:rgba(243,239,255,.94)!important}
    .predictionStatus.plpEnhancer.attention{background:rgba(255,247,217,.94)!important}
    .predictionStatus.plpEnhancer.urgent{background:rgba(255,240,242,.94)!important}

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
      .plpTabPhotoLayer{
        opacity:.86!important;
        background-size:contain!important;
      }

      main .card,
      main .fixture,
      main .mwSelect,
      main .aiBox,
      main .historyFixture{
        background:rgba(255,255,255,.86)!important;
      }

      body.clubBgOn header::before{
        width:220px!important;
        height:220px!important;
        right:-42px!important;
        bottom:-52px!important;
        opacity:.19!important;
      }

      main::after{
        height:calc(100vh + 125px);
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

function scheduleEnhance(){
  clearTimeout(scheduleEnhance.t);

  scheduleEnhance.t=setTimeout(()=>{
    addUxCss();

    if(isTableOpen()) refreshTable();
    refreshHistoryLinks();
  },120);
}

addUxCss();

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
      scheduleEnhance();
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
