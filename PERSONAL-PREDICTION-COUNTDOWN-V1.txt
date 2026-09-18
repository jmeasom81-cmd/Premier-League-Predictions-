// PERSONAL PREDICTION COUNTDOWN V1
// Shows each signed-in player a personal countdown only when THEY have missing predictions
// that will lock within the next 24 hours.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ppcSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let ppcCtx = null;
let ppcData = null;
let ppcServerOffset = 0;
let ppcFetchBusy = false;
let ppcFetchTimer = null;
let ppcMutTimer = null;

function ppcCss() {
  if (document.getElementById('ppc-v1-css')) return;
  const s = document.createElement('style');
  s.id = 'ppc-v1-css';
  s.textContent = `
    .ppcBanner{position:relative;overflow:hidden;border-radius:18px;padding:14px 15px;margin-bottom:13px;border:1px solid #efd58a;background:linear-gradient(135deg,#fff8df,#fffdf4);box-shadow:0 8px 24px rgba(25,18,65,.06)}
    .ppcBanner.urgent{border-color:#efb36e;background:linear-gradient(135deg,#fff0df,#fff8ef)}
    .ppcBanner.danger{border-color:#efb7bf;background:linear-gradient(135deg,#fff0f2,#fff7f8)}
    .ppcTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .ppcEyebrow{font-size:9px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;color:#8a6500;margin-bottom:3px}
    .ppcBanner.urgent .ppcEyebrow{color:#9a5400}.ppcBanner.danger .ppcEyebrow{color:#b52c3c}
    .ppcTitle{font-size:16px;font-weight:950;line-height:1.2;color:#241153}
    .ppcClock{font-size:24px;font-weight:950;letter-spacing:.02em;line-height:1;color:#241153;white-space:nowrap;text-align:right}
    .ppcClock small{display:block;font-size:7.5px;letter-spacing:.08em;text-transform:uppercase;color:#817d8d;margin-top:4px}
    .ppcText{font-size:10.5px;line-height:1.45;color:#5f596b;margin-top:9px}
    .ppcFixture{font-weight:900;color:#342b4a}.ppcMeta{font-size:9px;color:#817d8d;margin-top:5px}
    .ppcActions{display:flex;gap:7px;align-items:center;margin-top:10px;flex-wrap:wrap}
    .ppcBtn{border:0;border-radius:10px;padding:9px 11px;background:#4b269d;color:#fff;font-size:10px;font-weight:950;cursor:pointer}
    .ppcBadge{font-size:8.5px;font-weight:900;border-radius:999px;padding:6px 8px;background:rgba(75,38,157,.08);color:#5d477f}
    .ppcPulse{position:absolute;right:-35px;top:-35px;width:95px;height:95px;border-radius:50%;background:rgba(181,44,60,.06);pointer-events:none}
    .ppcBanner.danger .ppcPulse{animation:ppcPulse 1.4s ease-in-out infinite}
    @keyframes ppcPulse{0%,100%{transform:scale(.9);opacity:.45}50%{transform:scale(1.12);opacity:1}}
    @media(max-width:520px){.ppcClock{font-size:21px}.ppcTitle{font-size:15px}}
  `;
  document.head.appendChild(s);
}

function ppcCurrentView() {
  return document.querySelector('#nav button[data-v].active')?.dataset?.v || '';
}

async function ppcContext() {
  if (ppcCtx) return ppcCtx;
  const { data: { session } } = await ppcSb.auth.getSession();
  if (!session) return null;

  const { data, error } = await ppcSb
    .from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data?.length) return null;

  ppcCtx = { userId: session.user.id, leagueId: data[0].league_id };
  return ppcCtx;
}

async function ppcFetch(force = false) {
  if (ppcFetchBusy) return;
  const view = ppcCurrentView();
  if (!['home', 'predict'].includes(view) && !force) return;

  ppcFetchBusy = true;
  try {
    const c = await ppcContext();
    if (!c) return;

    const { data, error } = await ppcSb.rpc('get_my_prediction_deadline', {
      p_league_id: c.leagueId
    });
    if (error) throw error;

    ppcData = data || null;

    if (ppcData?.server_now) {
      ppcServerOffset = new Date(ppcData.server_now).getTime() - Date.now();
    }

    ppcRender();
  } catch (e) {
    console.warn('Personal prediction countdown:', e);
  } finally {
    ppcFetchBusy = false;
  }
}

function ppcNow() { return Date.now() + ppcServerOffset; }
function ppcRemainingMs() {
  if (!ppcData?.next_lock_at) return 0;
  return new Date(ppcData.next_lock_at).getTime() - ppcNow();
}

function ppcClockText(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  return `${m}m ${String(s).padStart(2,'0')}s`;
}

function ppcTimeLabel(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
}

function ppcRiskClass(ms) {
  if (ms <= 60 * 60 * 1000) return 'danger';
  if (ms <= 4 * 60 * 60 * 1000) return 'urgent';
  return '';
}

function ppcFixtureText() {
  const a = Array.isArray(ppcData?.fixtures) ? ppcData.fixtures : [];
  if (!a.length) return '';
  if (a.length === 1) return `${a[0].home_team} v ${a[0].away_team}`;
  if (a.length === 2) return `${a[0].home_team} v ${a[0].away_team} and 1 other match`;
  return `${a[0].home_team} v ${a[0].away_team} and ${a.length - 1} other matches`;
}

function ppcGoPredict() {
  const btn = document.querySelector('#nav button[data-v="predict"]');
  if (btn) btn.click();

  const fixtureId = ppcData?.fixtures?.[0]?.fixture_id;
  if (fixtureId) {
    setTimeout(() => {
      document.getElementById(`fixture-${fixtureId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 220);
  }
}

function ppcRender() {
  const main = document.getElementById('main');
  if (!main) return;

  const view = ppcCurrentView();
  const old = document.getElementById('ppc-personal-countdown');

  if (!['home', 'predict'].includes(view) || !ppcData?.has_risk) {
    old?.remove();
    return;
  }

  const ms = ppcRemainingMs();

  if (ms <= 0) {
    old?.remove();
    clearTimeout(ppcFetchTimer);
    ppcFetchTimer = setTimeout(() => ppcFetch(true), 1200);
    return;
  }

  const nextCount = Number(ppcData.missing_at_next_lock || 0);
  const total24 = Number(ppcData.missing_24h || 0);
  const name = ppcData.first_name || 'You';
  const fixture = ppcFixtureText();
  const lockLabel = ppcTimeLabel(ppcData.next_lock_at);

  let banner = old;
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'ppc-personal-countdown';
    banner.className = 'ppcBanner';
    main.prepend(banner);
  }

  banner.className = `ppcBanner ${ppcRiskClass(ms)}`.trim();
  banner.innerHTML = `
    <div class="ppcPulse"></div>
    <div class="ppcTop">
      <div>
        <div class="ppcEyebrow">Prediction deadline</div>
        <div class="ppcTitle">⏳ ${name}, don't miss out</div>
      </div>
      <div class="ppcClock" data-ppc-clock>${ppcClockText(ms)}
        <small>until next lock</small>
      </div>
    </div>

    <div class="ppcText">
      ${nextCount === 1
        ? `<span class="ppcFixture">${fixture}</span> is still missing.`
        : `<b>${nextCount} predictions</b> are still missing at your next deadline.`
      }
      If ${nextCount === 1 ? 'it' : 'they'} lock without a prediction, ${nextCount === 1 ? 'that match' : 'those matches'} will score <b>0 points</b>.
    </div>

    <div class="ppcMeta">Next lock: ${lockLabel}${total24 > nextCount ? ` · ${total24} missing inside the next 24 hours` : ''}</div>

    <div class="ppcActions">
      <button type="button" class="ppcBtn" data-ppc-predict>
        ${view === 'predict' ? 'Go to missing match' : 'Make prediction'}
      </button>
      ${total24 > 1 ? `<span class="ppcBadge">${total24} picks need attention</span>` : ''}
    </div>
  `;

  banner.querySelector('[data-ppc-predict]')?.addEventListener('click', ppcGoPredict);
}

function ppcTick() {
  const clock = document.querySelector('[data-ppc-clock]');
  if (!clock || !ppcData?.has_risk) return;

  const ms = ppcRemainingMs();
  if (ms <= 0) {
    ppcRender();
    return;
  }

  clock.innerHTML = `${ppcClockText(ms)}<small>until next lock</small>`;

  const banner = document.getElementById('ppc-personal-countdown');
  if (banner) banner.className = `ppcBanner ${ppcRiskClass(ms)}`.trim();
}

function ppcScheduleFetch(delay = 500, force = false) {
  clearTimeout(ppcFetchTimer);
  ppcFetchTimer = setTimeout(() => ppcFetch(force), delay);
}

document.addEventListener('click', e => {
  if (e.target.closest?.('#nav button[data-v]')) {
    ppcScheduleFetch(180, true);
  }

  if (e.target.closest?.('.fixture .btn.small')) {
    ppcScheduleFetch(900, true);
  }
});

window.addEventListener('focus', () => ppcScheduleFetch(150, true));

const ppcMain = document.getElementById('main');
if (ppcMain) {
  new MutationObserver(() => {
    clearTimeout(ppcMutTimer);
    ppcMutTimer = setTimeout(() => {
      ppcRender();
      ppcScheduleFetch(700, false);
    }, 180);
  }).observe(ppcMain, { childList: true, subtree: true });
}

ppcCss();
setInterval(ppcTick, 1000);
setInterval(() => ppcFetch(false), 45000);
setTimeout(() => ppcFetch(true), 700);
