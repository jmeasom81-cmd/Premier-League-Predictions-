import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const uxSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let uxLeagueId = null;
let tableRefreshing = false;
let highlightRefreshing = false;
let liveRefreshing = false;
let liveRows = [];
let liveHistory = [];
let liveFetchedAt = 0;
let livePreviousActive = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function addUxCss(){
  document.getElementById('plp-live-scroll-css')?.remove();

  const st=document.createElement('style');
  st.id='plp-live-scroll-css';
  st.textContent=`
    /* Existing photographic background behaviour. */
    body.clubBgOn::before,
    .plpClubCrestLayer{
      display:none!important;
    }

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

    /* Live navigation appears only while a PL match is actually live. */
    #nav.plpLiveNavReady:not(.resultsHubReady){
      grid-template-columns:repeat(8,1fr)!important;
    }
    #nav.resultsHubReady.plpLiveNavReady{
      grid-template-columns:repeat(9,1fr)!important;
    }
    #nav .plpLiveNav{
      color:#d23545;
    }
    #nav .plpLiveNav.active{
      color:#d23545!important;
    }
    #nav .plpLiveNav i{
      position:relative;
    }
    #nav .plpLiveNav i::after{
      content:"";
      position:absolute;
      width:6px;
      height:6px;
      border-radius:50%;
      background:#e23d4f;
      right:-4px;
      top:-1px;
      box-shadow:0 0 0 3px rgba(226,61,79,.12);
      animation:plpLivePulse 1.3s infinite;
    }
    @keyframes plpLivePulse{
      0%,100%{transform:scale(.9);opacity:.7}
      50%{transform:scale(1.25);opacity:1}
    }

    /* Compact discovery card on Home. */
    .plpLiveHome{
      border:1px solid #f0bdc5!important;
      background:linear-gradient(135deg,rgba(255,240,243,.96),rgba(255,255,255,.94))!important;
      position:relative;
      overflow:hidden;
    }
    .plpLiveHome::before{
      content:"";
      position:absolute;
      width:90px;
      height:90px;
      border-radius:50%;
      right:-30px;
      top:-35px;
      background:rgba(210,53,69,.07);
    }
    .plpLiveHomeTop{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      position:relative;
    }
    .plpLiveHomeTitle{
      display:flex;
      align-items:center;
      gap:7px;
      font-size:16px;
      font-weight:950;
      color:#8f1f2d;
    }
    .plpLiveDot{
      width:8px;
      height:8px;
      border-radius:50%;
      background:#d23545;
      box-shadow:0 0 0 4px rgba(210,53,69,.11);
      animation:plpLivePulse 1.3s infinite;
      flex:0 0 auto;
    }
    .plpLiveHomeText{
      font-size:11px;
      color:#5d5260;
      margin:7px 0 10px;
      line-height:1.4;
      position:relative;
    }
    .plpLiveOpen{
      border:0;
      border-radius:11px;
      padding:9px 11px;
      background:#d23545;
      color:#fff;
      font-size:11px;
      font-weight:950;
      position:relative;
    }

    /* Full Live Centre. */
    .lcOverlay{
      position:fixed;
      inset:0;
      z-index:9700;
      background:#f6f6fb;
      overflow:auto;
      padding-bottom:30px;
    }
    .lcShell{
      max-width:760px;
      margin:auto;
      min-height:100vh;
    }
    .lcHead{
      background:linear-gradient(135deg,#351153,#171044 68%,#5a1736);
      color:#fff;
      padding:calc(15px + env(safe-area-inset-top)) 14px 20px;
      border-radius:0 0 28px 28px;
      position:sticky;
      top:0;
      z-index:3;
      box-shadow:0 8px 25px rgba(25,18,65,.18);
    }
    .lcHeadTop{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
    }
    .lcEyebrow{
      display:flex;
      align-items:center;
      gap:7px;
      font-size:9px;
      font-weight:950;
      letter-spacing:.12em;
      text-transform:uppercase;
      opacity:.82;
    }
    .lcHeadDot{
      width:7px;
      height:7px;
      border-radius:50%;
      background:#ff6070;
      box-shadow:0 0 0 4px rgba(255,96,112,.12);
      animation:plpLivePulse 1.3s infinite;
    }
    .lcTitle{
      font-size:24px;
      line-height:1.05;
      font-weight:950;
      margin-top:6px;
    }
    .lcSub{
      font-size:11px;
      opacity:.76;
      margin-top:4px;
      line-height:1.35;
    }
    .lcClose{
      border:0;
      border-radius:10px;
      padding:8px 11px;
      background:rgba(255,255,255,.14);
      color:#fff;
      font-weight:950;
    }
    .lcBody{
      padding:13px;
    }
    .lcLoading,
    .lcEmpty{
      background:#fff;
      border:1px solid #e8e7ef;
      border-radius:18px;
      padding:25px 18px;
      text-align:center;
      color:#716f82;
      font-size:12px;
      line-height:1.5;
    }
    .lcSummary{
      background:linear-gradient(135deg,#271052,#43206a);
      color:#fff;
      border-radius:20px;
      padding:15px;
      margin-bottom:12px;
      box-shadow:0 8px 24px rgba(25,18,65,.14);
    }
    .lcSummaryTop{
      display:flex;
      justify-content:space-between;
      align-items:flex-end;
      gap:8px;
      margin-bottom:10px;
    }
    .lcSummaryTop h2{
      margin:0;
      font-size:17px;
    }
    .lcSummaryTop span{
      font-size:8.5px;
      opacity:.68;
      text-transform:uppercase;
      font-weight:900;
    }
    .lcSummaryGrid{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:7px;
    }
    .lcSummaryStat{
      border-radius:13px;
      background:rgba(255,255,255,.11);
      padding:10px 5px;
      text-align:center;
    }
    .lcSummaryStat b{
      display:block;
      font-size:21px;
    }
    .lcSummaryStat span{
      font-size:7.5px;
      opacity:.74;
      text-transform:uppercase;
      font-weight:900;
    }
    .lcSummaryNote{
      margin-top:10px;
      border-radius:11px;
      padding:8px 9px;
      background:rgba(255,255,255,.1);
      font-size:10px;
      line-height:1.4;
    }
    .lcGame{
      background:#fff;
      border:1px solid #e8e7ef;
      border-radius:19px;
      padding:14px;
      margin-bottom:12px;
      box-shadow:0 8px 24px rgba(25,18,65,.06);
    }
    .lcGameTop{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
    }
    .lcMeta{
      font-size:8.5px;
      color:#716f82;
      font-weight:900;
      text-transform:uppercase;
    }
    .lcLivePill{
      display:inline-flex;
      align-items:center;
      gap:5px;
      border-radius:999px;
      padding:5px 8px;
      background:#fde9ec;
      color:#b52c3c;
      font-size:9px;
      font-weight:950;
    }
    .lcLivePill::before{
      content:"";
      width:6px;
      height:6px;
      border-radius:50%;
      background:#d23545;
      animation:plpLivePulse 1.3s infinite;
    }
    .lcFixture{
      display:grid;
      grid-template-columns:1fr auto 1fr;
      gap:9px;
      align-items:center;
      margin:12px 0 9px;
    }
    .lcTeam{
      font-size:13px;
      font-weight:950;
      line-height:1.2;
    }
    .lcTeam.away{
      text-align:right;
    }
    .lcScoreWrap{
      text-align:center;
    }
    .lcScore{
      font-size:31px;
      font-weight:950;
      white-space:nowrap;
      line-height:1;
    }
    .lcMinute{
      font-size:8.5px;
      color:#b52c3c;
      font-weight:950;
      margin-top:4px;
      text-transform:uppercase;
    }
    .lcMine{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:10px;
      border-radius:13px;
      padding:10px 11px;
      background:#f7f6fb;
      margin-top:8px;
    }
    .lcMineText{
      font-size:10px;
      color:#504b5e;
      font-weight:800;
      line-height:1.35;
    }
    .lcMineText b{
      display:block;
      color:#241153;
      font-size:11px;
      margin-bottom:2px;
    }
    .lcPts{
      border-radius:999px;
      padding:6px 8px;
      font-size:9px;
      font-weight:950;
      white-space:nowrap;
    }
    .lcPts.exact{background:#dff9f1;color:#08775c}
    .lcPts.one{background:#fff3c9;color:#7b5a00}
    .lcPts.zero{background:#fde9ec;color:#b52c3c}
    .lcPts.none{background:#ecebf1;color:#716f82}
    .lcMiniStats{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:6px;
      margin-top:9px;
    }
    .lcMiniStat{
      border-radius:11px;
      background:#f7f6fb;
      padding:8px 5px;
      text-align:center;
    }
    .lcMiniStat b{
      display:block;
      font-size:17px;
    }
    .lcMiniStat span{
      display:block;
      font-size:7.5px;
      color:#716f82;
      text-transform:uppercase;
      font-weight:850;
    }
    .lcDetails{
      margin-top:9px;
      border:1px solid #eceaf2;
      border-radius:13px;
      overflow:hidden;
    }
    .lcDetails summary{
      list-style:none;
      cursor:pointer;
      padding:10px 11px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      font-size:10px;
      font-weight:950;
      background:#faf9fd;
      color:#4f4760;
    }
    .lcDetails summary::-webkit-details-marker{display:none}
    .lcDetails summary::after{
      content:"›";
      font-size:17px;
      color:#716f82;
      transition:transform .15s ease;
    }
    .lcDetails[open] summary::after{
      transform:rotate(90deg);
    }
    .lcPeople{
      border-top:1px solid #eceaf2;
    }
    .lcPerson{
      display:grid;
      grid-template-columns:1fr auto auto;
      gap:8px;
      align-items:center;
      padding:9px 10px;
      border-top:1px solid #f0eff4;
    }
    .lcPerson:first-child{border-top:0}
    .lcPersonName{
      min-width:0;
      font-size:10.5px;
      font-weight:950;
      color:#2f2940;
    }
    .lcPersonName small{
      display:block;
      margin-top:2px;
      font-size:8px;
      color:#827e8d;
      font-weight:750;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .lcPick{
      font-size:10px;
      font-weight:950;
      color:#4b4658;
      white-space:nowrap;
    }
    .lcFooter{
      text-align:center;
      color:#858293;
      font-size:8.5px;
      line-height:1.45;
      margin:2px 0 14px;
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

      #nav.plpLiveNavReady button{
        font-size:6.1px!important;
      }
      #nav.plpLiveNavReady button i{
        font-size:15px!important;
      }

      .lcBody{padding:11px}
      .lcTitle{font-size:22px}
      .lcSummaryGrid{gap:5px}
      .lcSummaryStat b{font-size:18px}
      .lcSummaryStat span{font-size:6.8px}
      .lcTeam{font-size:12px}
      .lcScore{font-size:28px}
      .lcPerson{grid-template-columns:minmax(0,1fr) auto auto;padding:8px 9px}
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

function isHomeOpen(){
  return !!document.querySelector('#nav button[data-v="home"].active');
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

/* -------------------------------------------------------------------------
   LIVE CENTRE
   Read-only live scores from FPL + provisional points from existing picks.
   Nothing here writes a result or changes saved predictions.
   ------------------------------------------------------------------------- */

function cleanTeam(s){
  return String(s||'')
    .toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
}

function canonicalTeam(s){
  const n=cleanTeam(s);
  const aliases={
    'afc bournemouth':'bournemouth',
    'bournemouth':'bournemouth',
    'brighton and hove albion':'brighton',
    'brighton':'brighton',
    'manchester city':'mancity',
    'man city':'mancity',
    'manchester united':'manutd',
    'man united':'manutd',
    'man utd':'manutd',
    'nottingham forest':'forest',
    'nott m forest':'forest',
    'nottm forest':'forest',
    'tottenham hotspur':'spurs',
    'tottenham':'spurs',
    'spurs':'spurs',
    'newcastle united':'newcastle',
    'newcastle':'newcastle',
    'leeds united':'leeds',
    'leeds':'leeds',
    'coventry city':'coventry',
    'coventry':'coventry',
    'hull city':'hull',
    'hull':'hull',
    'ipswich town':'ipswich',
    'ipswich':'ipswich',
    'aston villa':'villa',
    'villa':'villa',
    'crystal palace':'palace',
    'palace':'palace',
    'west ham united':'westham',
    'west ham':'westham',
    'wolverhampton wanderers':'wolves',
    'wolves':'wolves',
    'arsenal':'arsenal',
    'everton':'everton',
    'sunderland':'sunderland',
    'brentford':'brentford',
    'liverpool':'liverpool',
    'fulham':'fulham',
    'chelsea':'chelsea',
    'burnley':'burnley'
  };
  return aliases[n] || n.replace(/\b(fc|afc)\b/g,'').replace(/ /g,'');
}

function fixtureKey(home,away){
  return `${canonicalTeam(home)}|${canonicalTeam(away)}`;
}

function outcome(h,a){
  return +h>+a?'H':+h<+a?'A':'D';
}

function provisionalPoints(p,homeScore,awayScore){
  if(!p || p.home_score===null || p.home_score===undefined ||
     p.away_score===null || p.away_score===undefined) return null;

  const ph=Number(p.home_score);
  const pa=Number(p.away_score);
  const h=Number(homeScore);
  const a=Number(awayScore);

  if(ph===h && pa===a) return 3;
  if(outcome(ph,pa)===outcome(h,a)) return 1;
  return 0;
}

function liveMinute(row){
  const m=Number(row.minutes||0);
  if(!m) return 'LIVE';
  if(m>=90) return '90′+';
  return `${m}′`;
}

function currentPointsPill(pts){
  if(pts===null) return `<span class="lcPts none">No pick</span>`;
  if(pts===3) return `<span class="lcPts exact">3 pts now</span>`;
  if(pts===1) return `<span class="lcPts one">1 pt now</span>`;
  return `<span class="lcPts zero">0 pts now</span>`;
}

async function fetchLiveData(force=false){
  if(liveRefreshing) return {rows:liveRows,history:liveHistory};

  if(!force && liveFetchedAt && Date.now()-liveFetchedAt<20000){
    return {rows:liveRows,history:liveHistory};
  }

  liveRefreshing=true;
  try{
    const lid=await getLeagueId();
    if(!lid) return {rows:[],history:[]};

    const [feedRes,histRes]=await Promise.all([
      uxSb.functions.invoke('live-score-feed'),
      uxSb.rpc('get_league_history',{p_league_id:lid,p_limit:200})
    ]);

    if(feedRes.error) throw feedRes.error;
    if(histRes.error) throw histRes.error;

    const feed=feedRes.data||{};
    if(feed.ok!==true) throw new Error(feed.error||'Live score feed unavailable');

    const history=histRes.data||[];
    const byPair=new Map(history.map(h=>[fixtureKey(h.home_team,h.away_team),h]));

    liveRows=(feed.live||[]).map(row=>({
      ...row,
      appFixture:byPair.get(fixtureKey(row.home_team,row.away_team))||null
    }));

    liveHistory=history;
    liveFetchedAt=Date.now();

    return {rows:liveRows,history:liveHistory};
  }finally{
    liveRefreshing=false;
  }
}

function leagueSummary(rows){
  const people=new Map();
  let exactNow=0;

  for(const row of rows){
    const h=row.appFixture;
    if(!h) continue;

    for(const p of h.predictions||[]){
      const id=String(p.user_id||`${p.team_name||''}|${p.display_name||''}`);
      if(!people.has(id)){
        people.set(id,{
          id,
          name:p.team_name||p.display_name||'Player',
          display:p.display_name||'',
          points:0,
          submitted:0,
          exact:0
        });
      }
      const person=people.get(id);
      const pts=provisionalPoints(p,row.home_score,row.away_score);
      if(pts===null) continue;
      person.submitted++;
      person.points+=pts;
      if(pts===3){
        person.exact++;
        exactNow++;
      }
    }
  }

  const submitted=[...people.values()].filter(p=>p.submitted>0);
  const onCourse=submitted.filter(p=>p.points>0).length;
  const missingOut=submitted.filter(p=>p.points===0).length;

  return {people:submitted,onCourse,missingOut,exactNow};
}

function fixtureAnalysis(row){
  const h=row.appFixture;
  const preds=(h?.predictions||[]).filter(
    p=>p.home_score!==null && p.home_score!==undefined &&
       p.away_score!==null && p.away_score!==undefined
  );

  const scored=preds.map(p=>({
    ...p,
    livePoints:provisionalPoints(p,row.home_score,row.away_score)
  }));

  const exact=scored.filter(p=>p.livePoints===3).length;
  const points=scored.filter(p=>p.livePoints>0).length;
  const zero=scored.filter(p=>p.livePoints===0).length;

  return {scored,exact,points,zero};
}

function liveGameMarkup(row,userId){
  const h=row.appFixture;
  const a=fixtureAnalysis(row);
  const mine=(h?.predictions||[]).find(p=>String(p.user_id)===String(userId))||null;
  const myPts=provisionalPoints(mine,row.home_score,row.away_score);

  const myPick=mine && mine.home_score!==null && mine.home_score!==undefined
    ? `${mine.home_score}–${mine.away_score}`
    : null;

  const people=[...a.scored].sort((x,y)=>
    (Number(y.livePoints)||0)-(Number(x.livePoints)||0) ||
    String(x.team_name||x.display_name||'').localeCompare(String(y.team_name||y.display_name||''))
  );

  return `<section class="lcGame">
    <div class="lcGameTop">
      <div class="lcMeta">MW${esc(row.matchweek||h?.matchweek||'')} · provisional</div>
      <div class="lcLivePill">${esc(liveMinute(row))}</div>
    </div>

    <div class="lcFixture">
      <div class="lcTeam">${esc(h?.home_team||row.home_team)}</div>
      <div class="lcScoreWrap">
        <div class="lcScore">${esc(row.home_score)}–${esc(row.away_score)}</div>
        <div class="lcMinute">Live score</div>
      </div>
      <div class="lcTeam away">${esc(h?.away_team||row.away_team)}</div>
    </div>

    <div class="lcMine">
      <div class="lcMineText">
        <b>Your prediction</b>
        ${myPick ? `${esc(myPick)} · if it finished now` : 'No prediction recorded for this match'}
      </div>
      ${currentPointsPill(myPts)}
    </div>

    <div class="lcMiniStats">
      <div class="lcMiniStat"><b>${a.exact}</b><span>Exact now</span></div>
      <div class="lcMiniStat"><b>${a.points}</b><span>Scoring</span></div>
      <div class="lcMiniStat"><b>${a.zero}</b><span>Missing out</span></div>
    </div>

    ${h ? `<details class="lcDetails">
      <summary>League detail · ${a.scored.length} submitted pick${a.scored.length===1?'':'s'}</summary>
      <div class="lcPeople">
        ${people.length ? people.map(p=>`
          <div class="lcPerson">
            <div class="lcPersonName">
              ${esc(p.badge||'⚽')} ${esc(p.team_name||p.display_name||'Player')}
              <small>${esc(p.display_name||'')}</small>
            </div>
            <div class="lcPick">${esc(p.home_score)}–${esc(p.away_score)}</div>
            ${currentPointsPill(p.livePoints)}
          </div>
        `).join('') : `<div class="lcPerson"><div class="lcPersonName">No submitted predictions</div></div>`}
      </div>
    </details>` : `
      <div class="lcFooter" style="margin-top:10px">
        Prediction detail is temporarily unavailable for this fixture.
      </div>
    `}
  </section>`;
}

async function renderLiveOverlay(force=false){
  const overlay=document.querySelector('.lcOverlay');
  if(!overlay) return;

  const body=overlay.querySelector('.lcBody');
  if(!body) return;

  if(force || !liveRows.length){
    body.innerHTML=`<div class="lcLoading">Refreshing live scores…</div>`;
  }

  try{
    const {rows}=await fetchLiveData(force);
    const {data:{session}}=await uxSb.auth.getSession();
    const userId=session?.user?.id||'';

    if(!rows.length){
      body.innerHTML=`<div class="lcEmpty">
        <b>No Premier League matches are live right now.</b><br>
        When a match starts, this screen will show the current score and how every prediction is performing.
      </div>`;
      return;
    }

    const s=leagueSummary(rows);

    body.innerHTML=`
      <section class="lcSummary">
        <div class="lcSummaryTop">
          <h2>If it finished now…</h2>
          <span>${rows.length} live match${rows.length===1?'':'es'}</span>
        </div>
        <div class="lcSummaryGrid">
          <div class="lcSummaryStat"><b>${s.onCourse}</b><span>On course</span></div>
          <div class="lcSummaryStat"><b>${s.exactNow}</b><span>Exact picks</span></div>
          <div class="lcSummaryStat"><b>${s.missingOut}</b><span>Missing out</span></div>
        </div>
        <div class="lcSummaryNote">
          These points are <b>provisional</b>. A single goal can change everything — nothing is added to the league table until the final result is confirmed.
        </div>
      </section>

      ${rows.map(row=>liveGameMarkup(row,userId)).join('')}

      <div class="lcFooter">
        Live scores refresh automatically about every 30 seconds. Provisional points are for fun and are not saved as results.
      </div>
    `;
  }catch(e){
    console.warn('Live Centre render:',e);
    body.innerHTML=`<div class="lcEmpty">
      <b>Live scores are temporarily unavailable.</b><br>
      We’ll keep trying automatically. Your saved predictions are unaffected.
    </div>`;
  }
}

async function openLiveCentre(){
  addUxCss();

  let overlay=document.querySelector('.lcOverlay');
  if(overlay) overlay.remove();

  const nav=document.getElementById('nav');
  livePreviousActive=nav?.querySelector('button.active')||null;

  if(nav){
    for(const b of nav.querySelectorAll('button')) b.classList.remove('active');
    nav.querySelector('.plpLiveNav')?.classList.add('active');
  }

  document.querySelector('.rhOverlay')?.remove();

  overlay=document.createElement('div');
  overlay.className='lcOverlay';
  overlay.innerHTML=`<div class="lcShell">
    <div class="lcHead">
      <div class="lcHeadTop">
        <div>
          <div class="lcEyebrow"><span class="lcHeadDot"></span>Live now</div>
          <div class="lcTitle">Live Prediction Centre</div>
          <div class="lcSub">Current scores · your pick · provisional points · league progress</div>
        </div>
        <button class="lcClose" type="button">✕</button>
      </div>
    </div>
    <div class="lcBody"><div class="lcLoading">Loading live scores…</div></div>
  </div>`;

  overlay.querySelector('.lcClose').onclick=closeLiveCentre;
  document.body.appendChild(overlay);
  document.body.style.overflow='hidden';

  await renderLiveOverlay(true);
}

function closeLiveCentre(){
  document.querySelector('.lcOverlay')?.remove();
  document.body.style.overflow='';

  const nav=document.getElementById('nav');
  if(nav){
    nav.querySelector('.plpLiveNav')?.classList.remove('active');
    if(livePreviousActive && document.contains(livePreviousActive)){
      livePreviousActive.classList.add('active');
    }else{
      nav.querySelector('button[data-v="home"]')?.classList.add('active');
    }
  }
  livePreviousActive=null;
}

function ensureLiveNav(show){
  const nav=document.getElementById('nav');
  if(!nav) return;

  let b=nav.querySelector('.plpLiveNav');

  if(show){
    nav.classList.add('plpLiveNavReady');

    if(!b){
      b=document.createElement('button');
      b.className='plpLiveNav';
      b.innerHTML='<i>⚡</i>Live';
      b.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        openLiveCentre();
      });

      const ai=nav.querySelector('button[data-v="ai"]');
      nav.insertBefore(b,ai||nav.lastElementChild);
    }
  }else{
    nav.classList.remove('plpLiveNavReady');
    b?.remove();
  }
}

function injectLiveHome(){
  const main=document.getElementById('main');
  if(!main) return;

  let card=main.querySelector('.plpLiveHome');

  if(!isHomeOpen() || !liveRows.length){
    card?.remove();
    return;
  }

  if(card) return;

  const summary=leagueSummary(liveRows);

  card=document.createElement('div');
  card.className='card plpLiveHome';
  card.innerHTML=`
    <div class="plpLiveHomeTop">
      <div class="plpLiveHomeTitle"><span class="plpLiveDot"></span>Live now</div>
      <span class="tiny">${liveRows.length} match${liveRows.length===1?'':'es'}</span>
    </div>
    <div class="plpLiveHomeText">
      ${summary.onCourse} player${summary.onCourse===1?' is':'s are'} currently on course for points ·
      ${summary.exactNow} exact pick${summary.exactNow===1?'':'s'} right now.
    </div>
    <button type="button" class="plpLiveOpen">Open Live Centre</button>
  `;
  card.querySelector('.plpLiveOpen').onclick=openLiveCentre;

  const latest=main.querySelector('.rhLatestHome');
  const status=main.querySelector('.predictionStatus.plpEnhancer');

  if(latest) latest.insertAdjacentElement('beforebegin',card);
  else if(status) status.insertAdjacentElement('afterend',card);
  else main.prepend(card);
}

async function syncLiveState(force=false){
  try{
    await fetchLiveData(force);
    ensureLiveNav(liveRows.length>0);
    injectLiveHome();

    if(document.querySelector('.lcOverlay')){
      await renderLiveOverlay(false);
    }
  }catch(e){
    console.warn('Live score sync:',e);
    /* Keep any already-visible Live state if a single refresh fails. */
  }
}

function scheduleEnhance(){
  clearTimeout(scheduleEnhance.t);

  scheduleEnhance.t=setTimeout(()=>{
    addUxCss();

    if(isTableOpen()) refreshTable();
    refreshHistoryLinks();
    injectLiveHome();
  },120);
}

addUxCss();

window.openPLPLiveCentre=openLiveCentre;
window.closePLPLiveCentre=closeLiveCentre;

window.addEventListener('resize',scheduleEnhance);
window.addEventListener('focus',()=>{
  scheduleEnhance();
  syncLiveState(true);
});

const main=document.getElementById('main');

if(main){
  new MutationObserver(scheduleEnhance)
    .observe(main,{childList:true,subtree:true});
}

const nav=document.getElementById('nav');
if(nav){
  new MutationObserver(()=>{
    setTimeout(()=>{
      if(liveRows.length) ensureLiveNav(true);
      injectLiveHome();
    },80);
  }).observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}

document.addEventListener('click',e=>{
  if(e.target.closest('#nav button[data-v]')){
    document.querySelector('.lcOverlay')?.remove();
    document.body.style.overflow='';
    livePreviousActive=null;

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

setInterval(()=>{
  syncLiveState(true);
},30000);

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
setTimeout(()=>syncLiveState(true),700);
