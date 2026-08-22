/*
  Premier League Predictions - Results collapse/expand layer
  Groups completed results by matchweek and keeps the Results tab manageable
  as the season grows. Loaded after results-hub.js.
*/
(() => {
  const STYLE_ID = 'plp-results-collapse-css';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .rhArchiveTools{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        margin:0 0 10px;
      }
      .rhArchiveTools .rhArchiveLabel{
        font-size:10px;
        color:#716f82;
        font-weight:850;
      }
      .rhArchiveButtons{
        display:flex;
        gap:6px;
        flex-wrap:wrap;
      }
      .rhArchiveBtn{
        border:0;
        border-radius:10px;
        background:#efeff6;
        color:#343047;
        padding:7px 9px;
        font-size:9px;
        font-weight:900;
      }

      .rhWeek{
        margin-bottom:12px;
        border:1px solid #e8e7ef;
        border-radius:18px;
        overflow:hidden;
        background:rgba(255,255,255,.82);
        box-shadow:0 7px 20px rgba(25,18,65,.05);
      }
      .rhWeekHead{
        width:100%;
        border:0;
        background:rgba(255,255,255,.96);
        color:#17152c;
        padding:13px 14px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        text-align:left;
        cursor:pointer;
      }
      .rhWeek.latest .rhWeekHead{
        background:linear-gradient(135deg,#f3efff,#fff);
      }
      .rhWeekTitle{
        font-size:15px;
        font-weight:950;
      }
      .rhWeekMeta{
        font-size:9px;
        color:#716f82;
        margin-top:2px;
        font-weight:800;
      }
      .rhWeekChevron{
        font-size:17px;
        color:#4b269d;
        transition:transform .18s ease;
      }
      .rhWeek.open .rhWeekChevron{
        transform:rotate(180deg);
      }
      .rhWeekGames{
        display:none;
        padding:10px;
        border-top:1px solid #ecebf2;
      }
      .rhWeek.open .rhWeekGames{
        display:block;
      }

      /* Result cards become compact rows until individually expanded. */
      .rhWeek .rhGame{
        margin-bottom:8px!important;
        padding:11px!important;
        box-shadow:none!important;
        background:rgba(255,255,255,.94)!important;
      }
      .rhWeek .rhGame:last-child{
        margin-bottom:0!important;
      }
      .rhWeek .rhGame .rhFixture{
        margin:7px 0 5px!important;
      }
      .rhWeek .rhGame .rhScore{
        font-size:24px!important;
      }

      .rhGameDetails{
        display:none;
      }
      .rhGame.resultOpen .rhGameDetails{
        display:block;
      }
      .rhGameToggle{
        width:100%;
        border:0;
        background:#f5f4fa;
        color:#4f4073;
        border-radius:10px;
        padding:8px 10px;
        margin-top:7px;
        font-size:9.5px;
        font-weight:900;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        cursor:pointer;
      }
      .rhGameToggle .rhToggleChevron{
        transition:transform .18s ease;
      }
      .rhGame.resultOpen .rhGameToggle .rhToggleChevron{
        transform:rotate(180deg);
      }

      @media(max-width:520px){
        .rhWeekHead{padding:11px 12px}
        .rhWeekGames{padding:8px}
        .rhWeek .rhGame{padding:10px!important}
        .rhArchiveTools{align-items:flex-start}
      }
    `;
    document.head.appendChild(st);
  }

  function matchweekFromCard(card) {
    const txt = card.querySelector('.rhMeta')?.textContent || '';
    const m = txt.match(/MW\s*(\d+)/i);
    return m ? Number(m[1]) : 0;
  }

  function prepareGame(card, openByDefault) {
    if (card.dataset.rhGamePrepared === '1') return;
    card.dataset.rhGamePrepared = '1';

    const detailNodes = [
      card.querySelector('.rhFun'),
      card.querySelector('.rhLine'),
      card.querySelector('.rhActions')
    ].filter(Boolean);

    if (!detailNodes.length) return;

    const details = document.createElement('div');
    details.className = 'rhGameDetails';

    detailNodes.forEach(node => details.appendChild(node));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'rhGameToggle';
    toggle.innerHTML = `
      <span>Prediction performance & match links</span>
      <span class="rhToggleChevron">⌄</span>
    `;

    toggle.addEventListener('click', () => {
      card.classList.toggle('resultOpen');
      const isOpen = card.classList.contains('resultOpen');
      toggle.firstElementChild.textContent = isOpen
        ? 'Hide prediction performance'
        : 'Prediction performance & match links';
    });

    card.appendChild(toggle);
    card.appendChild(details);

    if (openByDefault) {
      card.classList.add('resultOpen');
      toggle.firstElementChild.textContent = 'Hide prediction performance';
    }
  }

  function makeWeek(week, cards, latestWeek) {
    const wrap = document.createElement('section');
    wrap.className = `rhWeek${week === latestWeek ? ' latest open' : ''}`;
    wrap.dataset.matchweek = String(week);

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'rhWeekHead';
    head.innerHTML = `
      <span>
        <span class="rhWeekTitle">Matchweek ${week || '—'}</span>
        <span class="rhWeekMeta">${cards.length} completed ${cards.length === 1 ? 'match' : 'matches'}</span>
      </span>
      <span class="rhWeekChevron">⌄</span>
    `;

    const games = document.createElement('div');
    games.className = 'rhWeekGames';

    cards.forEach((card, index) => {
      // Only the newest result in the latest matchweek opens automatically.
      prepareGame(card, week === latestWeek && index === 0);
      games.appendChild(card);
    });

    head.addEventListener('click', () => {
      wrap.classList.toggle('open');
    });

    wrap.appendChild(head);
    wrap.appendChild(games);
    return wrap;
  }

  function addArchiveTools(body) {
    const tools = document.createElement('div');
    tools.className = 'rhArchiveTools';
    tools.innerHTML = `
      <div class="rhArchiveLabel">Tap a matchweek or result to expand it</div>
      <div class="rhArchiveButtons">
        <button type="button" class="rhArchiveBtn rhExpandAll">Expand all</button>
        <button type="button" class="rhArchiveBtn rhCollapseAll">Collapse all</button>
      </div>
    `;

    tools.querySelector('.rhExpandAll').addEventListener('click', () => {
      body.querySelectorAll('.rhWeek').forEach(w => w.classList.add('open'));
    });

    tools.querySelector('.rhCollapseAll').addEventListener('click', () => {
      body.querySelectorAll('.rhWeek').forEach(w => w.classList.remove('open'));
    });

    return tools;
  }

  function organiseResults() {
    addStyles();

    const body = document.querySelector('.rhOverlay .rhBody');
    if (!body || body.dataset.rhGrouped === '1') return;

    const cards = [...body.children].filter(el => el.classList?.contains('rhGame'));
    if (!cards.length) return;

    body.dataset.rhGrouped = '1';

    const groups = new Map();
    for (const card of cards) {
      const mw = matchweekFromCard(card);
      if (!groups.has(mw)) groups.set(mw, []);
      groups.get(mw).push(card);
    }

    // The Results hub already renders newest first, so the highest/current
    // matchweek should be first. Sorting explicitly keeps this stable.
    const weeks = [...groups.keys()].sort((a,b) => b-a);
    const latestWeek = weeks[0];

    body.innerHTML = '';
    body.appendChild(addArchiveTools(body));

    weeks.forEach(week => {
      body.appendChild(makeWeek(week, groups.get(week), latestWeek));
    });
  }

  let timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(organiseResults, 90);
  }

  new MutationObserver(schedule).observe(document.body, {
    childList:true,
    subtree:true
  });

  document.addEventListener('click', e => {
    if (e.target.closest('.resultsHubNav')) {
      setTimeout(schedule, 180);
    }
  }, true);

  addStyles();
  schedule();
})();
