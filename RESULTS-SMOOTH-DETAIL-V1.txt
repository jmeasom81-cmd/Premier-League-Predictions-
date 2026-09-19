// RESULTS SMOOTH DETAIL V1
// Replaces Results -> Match Centre full-screen jump with an inline finished-match drawer.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const rsiSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

let rsiLeagueId=null;
let rsiUserId=null;
const rsiCache=new Map();

const rsiEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function rsiCss(){
  if(document.getElementById('rsi-v1-css'))return;
  const s=document.createElement('style');
  s.id='rsi-v1-css';
  s.textContent=`
    .rhGame .rhPrimary.rsiButton{display:inline-flex;align-items:center;gap:5px}
    .rhGame .rhPrimary.rsiButton .rsiArrow{display:inline-block;transition:transform .16s ease;font-size:10px;opacity:.75}
    .rhGame .rhPrimary.rsiButton.open .rsiArrow{transform:rotate(90deg)}
    .rsiDetail{
      display:none;
      margin-top:11px;
      border-top:1px solid #ece9f1;
      padding-top:10px
    }
    .rsiDetail.open{display:block;animation:rsiIn .16s ease-out}
    @keyframes rsiIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
    .rsiHead{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:7px}
    .rsiHead b{font-size:11px;color:#241153}
    .rsiHead span{font-size:8px;color:#817c8c;font-weight:850}
    .rsiLoading,.rsiError{
      background:#f8f7fb;border-radius:12px;padding:12px;
      text-align:center;color:#777184;font-size:9px;line-height:1.4
    }
    .rsiList{
      border:1px solid #eceaf2;
      border-radius:13px;
      overflow:hidden;
      background:#fff
    }
    .rsiRow{
      display:grid;
      grid-template-columns:minmax(0,1fr) auto auto;
      gap:8px;
      align-items:center;
      padding:8px 9px;
      border-top:1px solid #f0eef4
    }
    .rsiRow:first-child{border-top:0}
    .rsiRow.me{background:#f5f0ff}
    .rsiName{
      min-width:0;
      font-size:9.5px;
      color:#2f2940;
      font-weight:950;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis
    }
    .rsiName small{
      display:block;
      font-size:7px;
      color:#8f8997;
      font-weight:800;
      margin-top:1px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis
    }
    .rsiPick{font-size:10.5px;font-weight:950;color:#342e43;white-space:nowrap}
    .rsiPts{
      min-width:45px;
      text-align:center;
      border-radius:999px;
      padding:5px 6px;
      font-size:8px;
      font-weight:950;
      white-space:nowrap
    }
    .rsiPts.exact{background:#dff9f1;color:#08775c}
    .rsiPts.one{background:#fff3c9;color:#7b5a00}
    .rsiPts.zero{background:#fde9ec;color:#b52c3c}
    .rsiFoot{font-size:7.7px;color:#898391;text-align:center;margin-top:7px}
  `;
  document.head.appendChild(s);
}

async function rsiContext(){
  if(rsiLeagueId&&rsiUserId)return true;
  const {data:{session}}=await rsiSb.auth.getSession();
  if(!session)return false;
  rsiUserId=session.user.id;

  const {data,error}=await rsiSb
    .from('league_members')
    .select('league_id,status,joined_at')
    .eq('user_id',rsiUserId)
    .eq('status','active')
    .order('joined_at',{ascending:false})
    .limit(1);

  if(error)throw error;
  if(!data?.length)return false;
  rsiLeagueId=data[0].league_id;
  return true;
}

function rsiFixtureId(btn){
  if(btn.dataset.rsiFixtureId)return btn.dataset.rsiFixtureId;
  const raw=btn.getAttribute('onclick')||'';
  const m=raw.match(/openPLPMatchCentre\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  return m?.[1]||null;
}

function rsiPts(p){
  const n=Number(p.points||0);
  if(n===3)return '<span class="rsiPts exact">3 pts</span>';
  if(n===1)return '<span class="rsiPts one">1 pt</span>';
  return '<span class="rsiPts zero">0 pts</span>';
}

function rsiMarkup(d){
  const picks=(d?.predictions||[])
    .filter(p=>p.home_score!=null&&p.away_score!=null);

  return `
    <div class="rsiHead">
      <b>League picks</b>
      <span>${picks.length} prediction${picks.length===1?'':'s'}</span>
    </div>
    <div class="rsiList">
      ${picks.map(p=>`
        <div class="rsiRow ${String(p.user_id||'')===String(rsiUserId)?'me':''}">
          <div class="rsiName">
            ${rsiEsc(p.badge||'⚽')} ${rsiEsc(p.team_name||p.display_name||'Player')}
            <small>${rsiEsc(p.display_name||'')}${String(p.user_id||'')===String(rsiUserId)?' · You':''}</small>
          </div>
          <div class="rsiPick">${rsiEsc(p.home_score)}–${rsiEsc(p.away_score)}</div>
          ${rsiPts(p)}
        </div>
      `).join('')}
    </div>
    <div class="rsiFoot">Final points for this match</div>
  `;
}

function rsiCloseOthers(keep){
  document.querySelectorAll('.rhOverlay .rsiDetail.open').forEach(d=>{
    if(d===keep)return;
    d.classList.remove('open');
    const card=d.closest('.rhGame');
    const b=card?.querySelector('.rsiButton');
    if(b){
      b.classList.remove('open');
      b.innerHTML='📊 League picks <span class="rsiArrow">›</span>';
    }
  });
}

async function rsiToggle(btn){
  const fixtureId=rsiFixtureId(btn);
  const card=btn.closest('.rhGame');
  if(!fixtureId||!card)return;

  let detail=card.querySelector('.rsiDetail');
  if(!detail){
    detail=document.createElement('div');
    detail.className='rsiDetail';
    const actions=card.querySelector('.rhActions');
    if(actions)actions.insertAdjacentElement('afterend',detail);
    else card.appendChild(detail);
  }

  if(detail.classList.contains('open')){
    detail.classList.remove('open');
    btn.classList.remove('open');
    btn.innerHTML='📊 League picks <span class="rsiArrow">›</span>';
    return;
  }

  rsiCloseOthers(detail);
  detail.classList.add('open');
  btn.classList.add('open');
  btn.innerHTML='📊 Hide picks <span class="rsiArrow">›</span>';

  if(detail.dataset.loaded==='1')return;

  detail.innerHTML='<div class="rsiLoading">Loading league picks…</div>';

  try{
    if(!await rsiContext())throw new Error('Please sign in again.');

    let d=rsiCache.get(fixtureId);
    if(!d){
      const {data,error}=await rsiSb.rpc('get_completed_match_detail',{
        p_league_id:rsiLeagueId,
        p_fixture_id:fixtureId
      });
      if(error)throw error;
      d=data;
      rsiCache.set(fixtureId,d);
    }

    detail.innerHTML=rsiMarkup(d);
    detail.dataset.loaded='1';
  }catch(e){
    detail.innerHTML=`<div class="rsiError">Could not load league picks.<br>${rsiEsc(e.message||String(e))}</div>`;
  }
}

function rsiWire(){
  rsiCss();
  document.querySelectorAll('.rhOverlay .rhGame .rhPrimary').forEach(btn=>{
    if(btn.dataset.rsiWired)return;

    const fixtureId=rsiFixtureId(btn);
    if(!fixtureId)return;

    btn.dataset.rsiFixtureId=fixtureId;
    btn.dataset.rsiWired='1';
    btn.classList.add('rsiButton');
    btn.removeAttribute('onclick');
    btn.innerHTML='📊 League picks <span class="rsiArrow">›</span>';
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      rsiToggle(btn);
    });
  });
}

rsiCss();

const obs=new MutationObserver(()=>setTimeout(rsiWire,30));
obs.observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('click',e=>{
  if(e.target.closest?.('.rhTab'))setTimeout(rsiWire,60);
},true);

setTimeout(rsiWire,250);
