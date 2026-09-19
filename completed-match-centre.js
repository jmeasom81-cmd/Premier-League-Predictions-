// COMPLETED MATCH CENTRE V1
// Makes Results -> Match Centre open the specific completed fixture,
// while preserving the global live Match Centre when called without a fixture id.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cmcSb = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const cmcLiveOpen = window.openPLPMatchCentre;

let cmcLeagueId = null;
let cmcUserId = null;

const cmcEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function cmcOutcome(h,a){
  return Number(h)>Number(a)?'H':Number(h)<Number(a)?'A':'D';
}

function cmcPoints(p,rh,ra){
  if(!p || p.home_score==null || p.away_score==null || rh==null || ra==null) return null;
  const ph=Number(p.home_score), pa=Number(p.away_score);
  rh=Number(rh); ra=Number(ra);
  if(ph===rh && pa===ra) return 3;
  return cmcOutcome(ph,pa)===cmcOutcome(rh,ra) ? 1 : 0;
}

function cmcFmt(v){
  try{
    return new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/London',
      weekday:'short',day:'numeric',month:'short',
      hour:'2-digit',minute:'2-digit'
    }).format(new Date(v));
  }catch{return ''}
}

function cmcCss(){
  if(document.getElementById('cmc-v1-css')) return;
  const s=document.createElement('style');
  s.id='cmc-v1-css';
  s.textContent=`
    .cmcOverlay{
      position:fixed;inset:0;z-index:9995;background:#f6f6fb;
      overflow:auto;padding-bottom:35px
    }
    .cmcShell{max-width:760px;margin:auto;min-height:100vh}
    .cmcHead{
      position:sticky;top:0;z-index:4;
      background:linear-gradient(135deg,#351153,#171044 68%,#4d1a55);
      color:#fff;padding:calc(15px + env(safe-area-inset-top)) 14px 20px;
      border-radius:0 0 28px 28px;box-shadow:0 8px 25px rgba(25,18,65,.18)
    }
    .cmcHeadTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    .cmcEyebrow{font-size:9px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;opacity:.78}
    .cmcTitle{font-size:23px;font-weight:950;margin-top:5px}
    .cmcSub{font-size:10px;opacity:.76;margin-top:4px}
    .cmcClose{border:0;border-radius:10px;padding:8px 11px;background:rgba(255,255,255,.14);color:#fff;font-weight:950}
    .cmcBody{padding:12px}
    .cmcLoading,.cmcError{
      background:#fff;border:1px solid #e8e7ef;border-radius:18px;
      padding:24px 16px;text-align:center;color:#716f82;font-size:11px
    }
    .cmcCard{
      background:#fff;border:1px solid #e8e7ef;border-radius:19px;
      padding:14px;margin-bottom:11px;box-shadow:0 8px 24px rgba(25,18,65,.055)
    }
    .cmcMeta{font-size:8.5px;color:#716f82;font-weight:900;text-transform:uppercase}
    .cmcFixture{
      display:grid;grid-template-columns:1fr auto 1fr;gap:9px;
      align-items:center;margin:13px 0 8px
    }
    .cmcTeam{font-size:13px;font-weight:950;line-height:1.2}
    .cmcTeam.away{text-align:right}
    .cmcScore{text-align:center;font-size:31px;font-weight:950;line-height:1}
    .cmcFT{text-align:center;font-size:8px;color:#08775c;font-weight:950;text-transform:uppercase;margin-top:4px}
    .cmcMine{
      display:flex;justify-content:space-between;align-items:center;gap:10px;
      background:#f7f6fb;border-radius:13px;padding:10px 11px;margin-top:10px
    }
    .cmcMineText{font-size:10px;color:#504b5e;line-height:1.35;font-weight:800}
    .cmcMineText b{display:block;color:#241153;font-size:11px}
    .cmcPts{border-radius:999px;padding:6px 8px;font-size:9px;font-weight:950;white-space:nowrap}
    .cmcPts.exact{background:#dff9f1;color:#08775c}
    .cmcPts.one{background:#fff3c9;color:#7b5a00}
    .cmcPts.zero{background:#fde9ec;color:#b52c3c}
    .cmcPts.none{background:#ecebf1;color:#716f82}
    .cmcStats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
    .cmcStat{background:#f7f6fb;border-radius:11px;padding:9px 5px;text-align:center}
    .cmcStat b{display:block;font-size:18px;color:#241153}
    .cmcStat span{font-size:7px;text-transform:uppercase;color:#817d8d;font-weight:900}
    .cmcSection{display:flex;justify-content:space-between;gap:8px;align-items:end;margin-bottom:8px}
    .cmcSection h3{margin:0;font-size:15px;color:#241153}
    .cmcSection span{font-size:8px;color:#817d8d}
    .cmcPeople{border:1px solid #eceaf2;border-radius:13px;overflow:hidden}
    .cmcPerson{
      display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;
      align-items:center;padding:9px 10px;border-top:1px solid #efedf3
    }
    .cmcPerson:first-child{border-top:0}
    .cmcName{min-width:0;font-size:10px;color:#2f2940;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cmcName small{display:block;color:#8f8997;font-size:7.3px;font-weight:800;margin-top:1px}
    .cmcPick{font-size:11px;font-weight:950;color:#342e43}
    .cmcPerson .cmcPts{min-width:54px;text-align:center}
  `;
  document.head.appendChild(s);
}

async function cmcContext(){
  if(cmcLeagueId && cmcUserId) return true;

  const {data:{session}}=await cmcSb.auth.getSession();
  if(!session) return false;
  cmcUserId=session.user.id;

  const {data,error}=await cmcSb.from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',cmcUserId)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error) throw error;
  if(!data?.length) return false;
  cmcLeagueId=data[0].league_id;
  return true;
}

function cmcPill(pts){
  if(pts==null) return '<span class="cmcPts none">No pick</span>';
  if(pts===3) return '<span class="cmcPts exact">3 pts</span>';
  if(pts===1) return '<span class="cmcPts one">1 pt</span>';
  return '<span class="cmcPts zero">0 pts</span>';
}

async function cmcLoadFixture(fixtureId){
  if(!await cmcContext()) throw new Error('Please sign in again.');

  const [histSet,ctxSet]=await Promise.allSettled([
    cmcSb.rpc('get_league_history',{p_league_id:cmcLeagueId,p_limit:200}),
    cmcSb.rpc('get_match_centre_context',{p_league_id:cmcLeagueId})
  ]);

  if(histSet.status!=='fulfilled' || histSet.value.error){
    throw histSet.status==='fulfilled' ? histSet.value.error : histSet.reason;
  }

  const row=(histSet.value.data||[]).find(x=>String(x.fixture_id)===String(fixtureId));
  if(!row) throw new Error('That completed match could not be found.');

  let predictions=Array.isArray(row.predictions)?[...row.predictions]:[];

  if(ctxSet.status==='fulfilled' && !ctxSet.value.error){
    const ai=(ctxSet.value.data?.ai_picks||[]).filter(x=>String(x.fixture_id)===String(fixtureId));
    for(const p of ai){
      predictions.push({
        ...p,
        user_id:null,
        entrant_type:'ai',
        display_name:p.manager_name||'AI · ChatGPT',
        team_name:p.team_name||'Expected Goals FC',
        badge:p.badge||'🤖'
      });
    }
  }

  return {...row,predictions};
}

function cmcRender(row){
  const rh=row.result_home_score, ra=row.result_away_score;
  const people=(row.predictions||[])
    .filter(p=>p.home_score!=null && p.away_score!=null)
    .map(p=>({...p,calcPoints:p.points!=null?Number(p.points):cmcPoints(p,rh,ra)}))
    .sort((a,b)=>(b.calcPoints??-1)-(a.calcPoints??-1) ||
      String(a.team_name||a.display_name||'').localeCompare(String(b.team_name||b.display_name||'')));

  const mine=people.find(p=>String(p.user_id||'')===String(cmcUserId))||null;
  const exact=people.filter(p=>p.calcPoints===3).length;
  const scoring=people.filter(p=>p.calcPoints===3||p.calcPoints===1).length;
  const missed=people.filter(p=>p.calcPoints===0).length;

  return `
    <div class="cmcCard">
      <div class="cmcMeta">MW${cmcEsc(row.matchweek)} · ${cmcEsc(cmcFmt(row.kickoff_at))}</div>
      <div class="cmcFixture">
        <div class="cmcTeam">${cmcEsc(row.home_team)}</div>
        <div>
          <div class="cmcScore">${cmcEsc(rh)}–${cmcEsc(ra)}</div>
          <div class="cmcFT">Full time</div>
        </div>
        <div class="cmcTeam away">${cmcEsc(row.away_team)}</div>
      </div>

      <div class="cmcMine">
        <div class="cmcMineText">
          <b>Your prediction</b>
          ${mine?`${cmcEsc(mine.home_score)}–${cmcEsc(mine.away_score)}`:'No prediction recorded for this match'}
        </div>
        ${cmcPill(mine?.calcPoints ?? null)}
      </div>

      <div class="cmcStats">
        <div class="cmcStat"><b>${exact}</b><span>Exact</span></div>
        <div class="cmcStat"><b>${scoring}</b><span>Scoring</span></div>
        <div class="cmcStat"><b>${people.length}</b><span>Picks</span></div>
      </div>
    </div>

    <div class="cmcCard">
      <div class="cmcSection"><h3>League picks</h3><span>${people.length} predictions</span></div>
      <div class="cmcPeople">
        ${people.map(p=>`
          <div class="cmcPerson">
            <div class="cmcName">${cmcEsc(p.badge||'⚽')} ${cmcEsc(p.team_name||p.display_name||'Player')}
              <small>${cmcEsc(p.display_name||'')}</small>
            </div>
            <div class="cmcPick">${cmcEsc(p.home_score)}–${cmcEsc(p.away_score)}</div>
            ${cmcPill(p.calcPoints)}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function cmcOpenCompleted(fixtureId){
  cmcCss();

  document.querySelector('.cmcOverlay')?.remove();

  const ov=document.createElement('div');
  ov.className='cmcOverlay';
  ov.innerHTML=`
    <div class="cmcShell">
      <div class="cmcHead">
        <div class="cmcHeadTop">
          <div>
            <div class="cmcEyebrow">Completed match</div>
            <div class="cmcTitle">📊 Match Result</div>
            <div class="cmcSub">Final score · predictions · points</div>
          </div>
          <button class="cmcClose" type="button">✕</button>
        </div>
      </div>
      <div class="cmcBody"><div class="cmcLoading">Loading match result…</div></div>
    </div>
  `;

  ov.querySelector('.cmcClose').onclick=()=>ov.remove();
  document.body.appendChild(ov);

  try{
    const row=await cmcLoadFixture(fixtureId);
    ov.querySelector('.cmcBody').innerHTML=cmcRender(row);
  }catch(e){
    ov.querySelector('.cmcBody').innerHTML=`<div class="cmcError"><b>Couldn’t open this result.</b><br>${cmcEsc(e.message||String(e))}</div>`;
  }
}

window.openPLPMatchCentre = function(fixtureId){
  if(fixtureId) return cmcOpenCompleted(fixtureId);
  if(typeof cmcLiveOpen==='function') return cmcLiveOpen();
};

window.openPLPCompletedMatch = cmcOpenCompleted;
