import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://jzrbaeyvwagrwukntjbk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8';
const sbEnhancer = createClient(SUPABASE_URL, SUPABASE_KEY);

const UK = 'Europe/London';
const STYLE_ID = 'plp-home-enhancer-style';

let busy = false;
let cached = null;
let fetchedAt = 0;

function fmt(i) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(i));
}

function hasPick(f) {
  return f.your_home_score !== null && f.your_home_score !== undefined &&
         f.your_away_score !== null && f.your_away_score !== undefined;
}

function fixtureState(f) {
  if (
    (f.result_home_score !== null && f.result_home_score !== undefined) ||
    f.fixture_status === 'completed'
  ) return 'done';
  if (f.fixture_status === 'postponed') return 'postponed';
  if (Date.now() >= new Date(f.prediction_lock_at).getTime()) return 'locked';
  if (Date.now() >= new Date(f.prediction_open_at).getTime()) return 'open';
  return 'soon';
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .predictionStatus.plpEnhancer{
      position:relative;overflow:hidden;border-radius:20px;padding:16px;
      margin-bottom:13px;border:1px solid var(--line);
      box-shadow:0 10px 28px rgba(25,18,65,.08)
    }
    .predictionStatus.plpEnhancer:after{
      content:"";position:absolute;right:-18px;bottom:-25px;width:145px;height:122px;
      opacity:.055;pointer-events:none;background-repeat:no-repeat;background-size:contain;
      background-position:center;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 180'%3E%3Cg fill='%23241153'%3E%3Ccircle cx='145' cy='30' r='17'/%3E%3Cpath d='M128 50c14-8 34-5 45 8l17 21-13 10-17-18-4 37 25 38-16 10-27-35-8 34-18-4 13-56-20 17-11-13 31-29z'/%3E%3Ccircle cx='192' cy='142' r='18' fill='none' stroke='%23241153' stroke-width='7'/%3E%3C/g%3E%3C/svg%3E")
    }
    .predictionStatus.plpEnhancer.good{background:linear-gradient(135deg,#e8fff8,#f8fffc);border-color:#b8eedc}
    .predictionStatus.plpEnhancer.calm{background:linear-gradient(135deg,#f3efff,#fbf9ff);border-color:#d8ccf3}
    .predictionStatus.plpEnhancer.attention{background:linear-gradient(135deg,#fff7d9,#fffdf3);border-color:#f1d98d}
    .predictionStatus.plpEnhancer.urgent{background:linear-gradient(135deg,#fff0f2,#fff9fa);border-color:#efc2c9}
    .predictionStatus .psEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
    .predictionStatus .psTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;position:relative;z-index:1}
    .predictionStatus .psTitle{font-size:19px;line-height:1.12;font-weight:950;margin:0 0 5px}
    .predictionStatus .psMeta{font-size:11px;line-height:1.45;color:#5d596d}
    .predictionStatus .psIcon{width:38px;height:38px;flex:0 0 38px;border-radius:13px;background:rgba(255,255,255,.72);display:grid;place-items:center;font-size:20px;border:1px solid rgba(255,255,255,.9)}
    .predictionStatus .psReminder{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:13px;padding-top:11px;border-top:1px solid rgba(80,72,112,.12)}
    .predictionStatus .psReminderMain{display:flex;align-items:flex-start;gap:8px;min-width:0}
    .predictionStatus .psDot{width:8px;height:8px;border-radius:50%;background:#aaa;margin-top:4px;flex:0 0 8px}
    .predictionStatus .psDot.on{background:var(--green);box-shadow:0 0 0 4px rgba(8,119,92,.10)}
    .predictionStatus .psReminder b{font-size:11px;display:block}
    .predictionStatus .psReminder .tiny{font-size:9px;line-height:1.35}
    .predictionStatus .psActions{position:relative;z-index:1;display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
    header{position:relative;overflow:hidden}
    header:after{
      content:"";position:absolute;right:-20px;bottom:-28px;width:205px;height:170px;
      opacity:.10;pointer-events:none;background-repeat:no-repeat;background-position:center;background-size:contain;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 180'%3E%3Cg fill='white'%3E%3Ccircle cx='145' cy='30' r='17'/%3E%3Cpath d='M128 50c14-8 34-5 45 8l17 21-13 10-17-18-4 37 25 38-16 10-27-35-8 34-18-4 13-56-20 17-11-13 31-29z'/%3E%3Ccircle cx='192' cy='142' r='18' fill='none' stroke='white' stroke-width='7'/%3E%3C/g%3E%3C/svg%3E")
    }
    header .head{position:relative;z-index:1}
  `;
  document.head.appendChild(style);
}

function isHome(main) {
  const headings = [...main.querySelectorAll('.section h2')].map(x => x.textContent || '');
  return headings.some(x => x.includes('Notice Board')) &&
         headings.some(x => x.includes('Predictions in'));
}

async function getLiveState(force = false) {
  if (!force && cached && Date.now() - fetchedAt < 15000) return cached;

  const { data: sessionData } = await sbEnhancer.auth.getSession();
  const session = sessionData?.session;
  if (!session) return null;

  const uid = session.user.id;
  const { data: memberships, error: memErr } = await sbEnhancer
    .from('league_members')
    .select('league_id,status')
    .eq('user_id', uid);

  if (memErr) throw memErr;
  const membership = (memberships || []).find(x => x.status === 'active');
  if (!membership) return null;

  const [{ data: fixtures, error: fixtureErr }, { data: profile, error: profileErr }] =
    await Promise.all([
      sbEnhancer.rpc('get_current_match_centre', { p_league_id: membership.league_id }),
      sbEnhancer.from('profiles')
        .select('prediction_reminders')
        .eq('user_id', uid)
        .single()
    ]);

  if (fixtureErr) throw fixtureErr;
  if (profileErr) throw profileErr;

  let devicePushOn = false;
  const supportsPush =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  if (supportsPush) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      devicePushOn = !!sub && !!profile?.prediction_reminders;
    } catch (_) {}
  }

  cached = {
    fixtures: fixtures || [],
    supportsPush,
    devicePushOn,
    notificationPermission: supportsPush ? Notification.permission : 'unsupported'
  };
  fetchedAt = Date.now();
  return cached;
}

function actionButton(label, className, action) {
  const b = document.createElement('button');
  b.className = className;
  b.textContent = label;
  b.addEventListener('click', action);
  return b;
}

function goPredict() {
  if (typeof window.setViewGlobal === 'function') return window.setViewGlobal('predict');
  document.querySelector('.nav button[data-v="predict"]')?.click();
}

function goMore() {
  if (typeof window.setViewGlobal === 'function') return window.setViewGlobal('more');
  document.querySelector('.nav button[data-v="more"]')?.click();
}

async function enhanceHome() {
  const main = document.getElementById('main');
  if (!main || !isHome(main) || busy) return;

  busy = true;
  try {
    injectStyles();
    const live = await getLiveState();
    if (!live || !isHome(main)) return;

    const open = live.fixtures
      .filter(f => fixtureState(f) === 'open')
      .sort((a, b) => new Date(a.prediction_lock_at) - new Date(b.prediction_lock_at));

    const unsaved = open.filter(f => !hasPick(f));
    const next = unsaved[0];
    const hours = next
      ? (new Date(next.prediction_lock_at).getTime() - Date.now()) / 3600000
      : Infinity;

    let tone = 'good';
    let icon = '✓';
    let title = "You're up to date";
    let meta = open.length
      ? 'All currently available predictions are saved.'
      : 'There are no predictions needing attention right now.';

    if (unsaved.length) {
      if (hours <= 6) {
        tone = 'urgent';
        icon = '⏰';
        title = `Urgent: ${unsaved.length} prediction${unsaved.length === 1 ? '' : 's'} still needed`;
        meta = `Next lock ${fmt(next.prediction_lock_at)}.`;
      } else if (hours <= 48) {
        tone = 'attention';
        icon = '⚠️';
        title = `${unsaved.length} prediction${unsaved.length === 1 ? '' : 's'} need attention`;
        meta = `Next lock ${fmt(next.prediction_lock_at)}.`;
      } else {
        tone = 'calm';
        icon = '⚽';
        title = `${unsaved.length} prediction${unsaved.length === 1 ? '' : 's'} available`;
        meta = `You have time — next lock ${fmt(next.prediction_lock_at)}.`;
      }
    }

    const oldReminder = main.querySelector('.reminderHero');
    const oldBanner = main.querySelector('.banner');
    const oldEnhancer = main.querySelector('.predictionStatus.plpEnhancer');
    oldReminder?.remove();
    oldBanner?.remove();
    oldEnhancer?.remove();

    const card = document.createElement('div');
    card.className = `predictionStatus plpEnhancer ${tone}`;

    const denied = live.notificationPermission === 'denied';
    const reminderLabel = live.devicePushOn
      ? 'Reminders on'
      : denied
        ? 'Reminders blocked'
        : live.supportsPush
          ? 'Reminders off'
          : 'Reminders unavailable';

    const reminderNote = live.devicePushOn
      ? '48h · 24h · 2h before deadline, only when you still have unsaved picks.'
      : denied
        ? 'Enable notifications for this site in your browser settings.'
        : live.supportsPush
          ? 'Get a nudge at 48h · 24h · 2h when predictions are still unsaved.'
          : 'This browser does not support web push reminders.';

    card.innerHTML = `
      <div class="psEyebrow">Prediction status</div>
      <div class="psTop">
        <div>
          <div class="psTitle">${icon} ${title}</div>
          <div class="psMeta">${meta}</div>
        </div>
        <div class="psIcon">${icon}</div>
      </div>
      <div class="psReminder">
        <div class="psReminderMain">
          <span class="psDot ${live.devicePushOn ? 'on' : ''}"></span>
          <div>
            <b>🔔 ${reminderLabel}</b>
            <div class="tiny">${reminderNote}</div>
          </div>
        </div>
        <div class="psReminderAction"></div>
      </div>
      <div class="psActions"></div>
    `;

    const reminderAction = card.querySelector('.psReminderAction');
    if (live.supportsPush && !denied) {
      if (live.devicePushOn) {
        reminderAction.appendChild(actionButton('Manage', 'btn secondary small', goMore));
      } else {
        reminderAction.appendChild(
          actionButton('Enable', 'btn good small', async () => {
            if (typeof window.enableReminders === 'function') {
              await window.enableReminders();
              cached = null;
              setTimeout(() => enhanceHome(), 400);
            } else {
              goMore();
            }
          })
        );
      }
    }

    if (unsaved.length) {
      const actions = card.querySelector('.psActions');
      actions.appendChild(
        actionButton(
          'Complete predictions',
          tone === 'urgent' ? 'btn danger' : 'btn',
          goPredict
        )
      );
    }

    main.insertBefore(card, main.firstChild);
  } catch (err) {
    console.warn('Home enhancer:', err);
  } finally {
    busy = false;
  }
}

function scheduleEnhance() {
  clearTimeout(scheduleEnhance.timer);
  scheduleEnhance.timer = setTimeout(enhanceHome, 80);
}

const main = document.getElementById('main');
if (main) {
  new MutationObserver(scheduleEnhance).observe(main, { childList: true, subtree: true });
}

window.addEventListener('focus', () => {
  cached = null;
  scheduleEnhance();
});

setInterval(() => {
  cached = null;
  scheduleEnhance();
}, 60000);

injectStyles();
scheduleEnhance();
