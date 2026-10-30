// Admin-only Outstanding Predictions centre.
// Uses server-side admin_outstanding_predictions: shows submission status, never sealed scores.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const opSb = createClient('https://jzrbaeyvwagrwukntjbk.supabase.co', 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8');
const OP_TZ = 'Europe/London';
const opState = {
  leagueId:null, season:null, fixtures:[], scope:'day', day:null, week:null,
  from:null, to:null, report:null, filter:'outstanding', individual:null,
  root:null, loading:false, loadedAt:null
};
function opEsc(v) {
  return String(v==null?'':v).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function opUKDate(value) {
  if(!value)return '';
  const pieces=Intl.DateTimeFormat('en-GB',{timeZone:OP_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  const part=k=>pieces.find(p=>p.type===k)?.value||'';
  return part('year')+'-'+part('month')+'-'+part('day');
}
function opDateLabel(value) {
  if(!value)return 'Unknown date';
  return new Intl.DateTimeFormat('en-GB',{timeZone:OP_TZ,weekday:'short',day:'numeric',month:'short'}).format(new Date(value));
}
function opTime(value) {
  if(!value)return '';
  return new Intl.DateTimeFormat('en-GB',{timeZone:OP_TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));
}
function opLong(value) {return opDateLabel(value)+' '+opTime(value);}
function opToday() {return opUKDate(new Date());}
function opPlusDays(date,days) {
  const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10);
}
function opArr(v){return Array.isArray(v)?v:[];}
function opCss() {
  if(document.getElementById('op-styles'))return;
  const css=document.createElement('style');css.id='op-styles';
  css.textContent=[
    '.opScreen{position:fixed;inset:0;z-index:10080;background:#f5f4fa;overflow-y:auto;overscroll-behavior:contain;color:#1c1933;padding-bottom:calc(25px + env(safe-area-inset-bottom));font-family:Inter,system-ui,sans-serif}',
    '.opWrap{max-width:760px;margin:auto;padding:0 13px 30px}',
    '.opHead{background:linear-gradient(135deg,#241153,#5236a3);color:#fff;padding:calc(16px + env(safe-area-inset-top)) 16px 18px;margin:0 -13px 14px;border-radius:0 0 19px 19px}',
    '.opHeadTop{display:flex;gap:10px;align-items:center}.opHead h2{font-size:22px;line-height:1.15;margin:0}.opSub{font-size:12px;opacity:.84;margin-top:6px}',
    '.opCard{background:#fff;border:1px solid #e6e3ee;border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 5px 17px rgba(32,16,74,.035)}',
    '.opLabel{font-size:12px;font-weight:850;margin-bottom:7px}.opDim{font-size:12px;color:#77718a;line-height:1.4}',
    '.opScopes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:12px}',
    '.opScopes button{border:1px solid #dfdbe9;border-radius:11px;background:#f7f6fc;padding:12px 5px;font-size:12px;font-weight:800;color:#4b4660}',
    '.opScopes button.active{background:#432382;color:#fff;border-color:#432382}',
    '.opControl{width:100%;min-width:0;padding:12px 10px;border:1px solid #d7d2e2;border-radius:10px;background:white;color:#211a32;font-size:14px}',
    '.opDateControls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}',
    '.opBtn{border:0;border-radius:10px;padding:11px 13px;font-size:13px;font-weight:800;background:#eae5f5;color:#38266e;cursor:pointer}',
    '.opBtn.primary{background:#4d2898;color:#fff}.opBtn.wa{background:#128c7e;color:#fff}.opBtn.secondary{background:#f0eef4;color:#3b3450}',
    '.opBtn:disabled{opacity:.55;cursor:not-allowed}.opActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
    '.opMetrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
    '.opMetric{background:#f5f3fa;padding:10px 7px;border-radius:12px;text-align:center}.opMetric strong{display:block;font-size:24px}.opMetric small{display:block;font-size:10px;color:#6e6980;line-height:1.2}',
    '.opFilter{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.opFilter button{border:1px solid #e3dfeb;border-radius:999px;background:#f8f7fa;color:#5c5667;padding:8px 10px;font-size:11px;font-weight:800}.opFilter button.active{background:#31195f;color:white}',
    '.opPerson{border:1px solid #e6e3ee;border-radius:12px;padding:11px;margin:9px 0}.opPersonTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}',
    '.opPerson strong{font-size:14px}.opCount{font-size:12px;font-weight:900;color:#9d5700;white-space:nowrap}.opCount.done{color:#08775c}',
    '.opFixtures{font-size:11px;line-height:1.6;color:#655e74;margin:7px 0}.opPerson .opActions{margin-top:7px}',
    '.opText{width:100%;min-height:160px;box-sizing:border-box;border:1px solid #ddd7e9;border-radius:11px;padding:12px;background:#fbfaff;color:#241c35;font:12px/1.55 ui-monospace,monospace;resize:vertical}',
    '.opHint{background:#f0f8f6;border:1px solid #cfebe2;border-radius:11px;padding:10px;font-size:12px;line-height:1.5;color:#275c4b;margin-top:9px}',
    '.opError{color:#a52d43;background:#fff1f4;border:1px solid #f5d4dc;border-radius:11px;padding:11px;font-size:12px}',
    '.opToast{position:fixed;bottom:15px;left:50%;transform:translateX(-50%);background:#2a2241;color:#fff;border-radius:12px;padding:10px 15px;font-size:13px;z-index:10100;box-shadow:0 5px 25px #0003}',
    '@media(min-width:650px){.opScopes{grid-template-columns:repeat(4,minmax(0,1fr))}}'
  ].join('');
  document.head.appendChild(css);
}
function opToast(msg) {
  const old=document.querySelector('.opToast');if(old)old.remove();
  const t=document.createElement('div');t.className='opToast';t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),3200);
}
function opFixturesOfSeason(){
  return opState.fixtures.filter(f=>f.season===opState.season);
}
async function opConnect() {
  const {data:{session},error:authError}=await opSb.auth.getSession();
  if(authError||!session)throw new Error('Please sign in before opening Admin.');
  const {data:mem,error:memError}=await opSb.from('league_members')
    .select('league_id,role,status').eq('user_id',session.user.id)
    .eq('status','active').eq('role','admin').limit(1);
  if(memError)throw memError;
  if(!mem?.length)throw new Error('Only the league administrator can see outstanding predictions.');
  opState.leagueId=mem[0].league_id;
  const {data:fixtures,error:fixturesError}=await opSb.from('fixtures')
    .select('id,season,matchweek,kickoff_at,status').eq('league_id',opState.leagueId)
    .eq('status','scheduled').order('kickoff_at',{ascending:true});
  if(fixturesError)throw fixturesError;
  opState.fixtures=opArr(fixtures);
  const today=opToday();
  const closest=opState.fixtures.find(f=>opUKDate(f.kickoff_at)>=today)||opState.fixtures[opState.fixtures.length-1];
  opState.season=closest?.season||'2026/27';
  const seasonFixtures=opFixturesOfSeason();
  const first=seasonFixtures.find(f=>opUKDate(f.kickoff_at)>=today)||seasonFixtures[0];
  opState.day=first?opUKDate(first.kickoff_at):today;
  opState.week=first?.matchweek||1;
  opState.from=opState.day;
  opState.to=opPlusDays(opState.day,7);
}
function opChooseHtml() {
  const all=opFixturesOfSeason();
  const days=[...new Set(all.map(f=>opUKDate(f.kickoff_at)))];
  const weeks=[...new Set(all.map(f=>f.matchweek))].sort((a,b)=>a-b);
  const seasons=[...new Set(opState.fixtures.map(f=>f.season))];
  const scopeButtons=[['day','Game day'],['week','Matchweek'],['two_weeks','2 matchweeks'],['dates','Custom dates']]
    .map(v=>'<button type="button" data-op-scope="'+v[0]+'" class="'+(opState.scope===v[0]?'active':'')+'">'+v[1]+'</button>').join('');
  let picker='';
  if(opState.scope==='day') {
    picker='<label class="opLabel" for="op-day">Choose a game day</label><select id="op-day" class="opControl">'+
      days.map(d=>'<option value="'+opEsc(d)+'" '+(d===opState.day?'selected':'')+'>'+opEsc(opDateLabel(d+'T12:00:00Z'))+' ('+all.filter(f=>opUKDate(f.kickoff_at)===d).length+' games)</option>').join('')+'</select>';
  } else if(opState.scope==='week'||opState.scope==='two_weeks') {
    picker='<label class="opLabel" for="op-week">Starting matchweek</label><select id="op-week" class="opControl">'+
      weeks.map(w=>'<option value="'+w+'" '+(w===opState.week?'selected':'')+'>Matchweek '+w+(opState.scope==='two_weeks'&&w<38?' & '+(w+1):'')+'</option>').join('')+'</select>';
  } else {
    picker='<div class="opDateControls"><div><label class="opLabel" for="op-from">From (inclusive)</label><input class="opControl" type="date" id="op-from" value="'+opEsc(opState.from)+'"></div>'+
      '<div><label class="opLabel" for="op-to">To (inclusive)</label><input class="opControl" type="date" id="op-to" value="'+opEsc(opState.to)+'"></div></div>';
  }
  return '<div class="opCard"><div class="opLabel">Select the fixtures to check</div>'+
    '<div class="opScopes">'+scopeButtons+'</div>'+
    '<div style="margin-bottom:10px"><label class="opLabel" for="op-season">Season</label><select id="op-season" class="opControl">'+
    seasons.map(s=>'<option '+(s===opState.season?'selected':'')+' value="'+opEsc(s)+'">'+opEsc(s)+'</option>').join('')+'</select></div>'+
    picker+'<div class="opActions"><button type="button" class="opBtn primary" id="op-refresh">↻ Refresh live status</button></div></div>';
}
function opBuildShell() {
  const root=opState.root;if(!root)return;
  root.innerHTML='<div class="opWrap"><div class="opHead"><div class="opHeadTop">'+
    '<button class="opBtn secondary" id="op-close" type="button">← Back</button>'+
    '<div><h2>Outstanding Predictions</h2><div class="opSub">Private admin · all league players · live status</div></div></div></div>'+
    opChooseHtml()+
    '<section id="op-results"><div class="opCard opDim">Checking saved predictions…</div></section>'+
    '<section id="op-messages"></section>'+
    '</div>';
  root.querySelector('#op-close').onclick=opClose;
  root.querySelectorAll('[data-op-scope]').forEach(b=>b.onclick=()=>{
    opState.scope=b.dataset.opScope;
    opBuildShell();opRefresh();
  });
  root.querySelector('#op-season').onchange=e=>{
    opState.season=e.target.value;
    const f=opFixturesOfSeason()[0];
    if(f){opState.day=opUKDate(f.kickoff_at);opState.week=f.matchweek;opState.from=opState.day;opState.to=opPlusDays(opState.day,7);}
    opBuildShell();opRefresh();
  };
  const day=root.querySelector('#op-day');if(day)day.onchange=e=>{opState.day=e.target.value;opRefresh();};
  const week=root.querySelector('#op-week');if(week)week.onchange=e=>{opState.week=Number(e.target.value);opRefresh();};
  const start=root.querySelector('#op-from'),end=root.querySelector('#op-to');
  if(start)start.onchange=e=>{opState.from=e.target.value;opRefresh();};
  if(end)end.onchange=e=>{opState.to=e.target.value;opRefresh();};
  root.querySelector('#op-refresh').onclick=()=>opRefresh();
}
function opCurrentLabel() {
  if(opState.scope==='day')return opDateLabel(opState.day+'T12:00:00Z');
  if(opState.scope==='week')return 'Matchweek '+opState.week;
  if(opState.scope==='two_weeks')return 'Matchweeks '+opState.week+'–'+Math.min(38,opState.week+1);
  return 'Dates '+opState.from+' to '+opState.to;
}
async function opRefresh(silent=false) {
  if(opState.loading||!opState.leagueId)return false;
  opState.loading=true;
  const button=opState.root?.querySelector('#op-refresh');
  if(button)button.disabled=true;
  if(!silent) {
    const target=opState.root?.querySelector('#op-results');
    if(target)target.innerHTML='<div class="opCard opDim">Refreshing saved predictions…</div>';
  }
  try {
    const {data,error}=await opSb.rpc('admin_outstanding_predictions',{
      p_league_id:opState.leagueId, p_season:opState.season,p_scope:opState.scope,
      p_game_date:opState.scope==='day'?opState.day:null,
      p_matchweek:['week','two_weeks'].includes(opState.scope)?opState.week:null,
      p_start_date:opState.scope==='dates'?opState.from:null,
      p_end_date:opState.scope==='dates'?opState.to:null
    });
    if(error)throw error;
    opState.report=data||{players:[],fixtures:[]};
    opState.loadedAt=new Date();
    const still=opArr(opState.report.players).some(p=>p.user_id===opState.individual&&p.missing_open>0);
    if(!still)opState.individual=opArr(opState.report.players).find(p=>p.missing_open>0)?.user_id||null;
    opRenderResults();
    opRenderMessages();
    return true;
  }catch(e){
    const target=opState.root?.querySelector('#op-results');
    if(target&&!silent)target.innerHTML='<div class="opCard opError">'+opEsc(e.message||String(e))+'</div>';
    else opToast('Could not refresh: '+(e.message||e));
    return false;
  }finally{
    opState.loading=false;
    if(button)button.disabled=false;
  }
}
function opHasMissing(p){return (Number(p.missing_open)||0)+(Number(p.missing_soon)||0)+(Number(p.missing_locked)||0)>0;}
function opPlayersFiltered() {
  const all=opArr(opState.report?.players);
  if(opState.filter==='outstanding')return all.filter(p=>p.missing_open>0);
  if(opState.filter==='complete')return all.filter(p=>p.completed===p.total);
  if(opState.filter==='waiting')return all.filter(p=>opHasMissing(p)&&p.missing_open===0);
  return all;
}
function opRenderResults() {
  const target=opState.root?.querySelector('#op-results');if(!target)return;
  const report=opState.report||{},players=opArr(report.players),fixtures=opArr(report.fixtures);
  const outstanding=players.filter(p=>p.missing_open>0);
  const complete=players.filter(p=>p.completed===p.total);
  const missingPicks=players.reduce((s,p)=>s+(Number(p.missing_open)||0),0);
  const upcoming=players.reduce((s,p)=>s+(Number(p.missing_soon)||0),0);
  const closed=players.reduce((s,p)=>s+(Number(p.missing_locked)||0),0);
  let html='<div class="opCard"><div class="opLabel">'+opEsc(opCurrentLabel())+' · '+fixtures.length+' fixtures</div>';
  if(!fixtures.length){
    html+='<div class="opDim">No scheduled fixtures found for this selection. Choose another period.</div></div>';
    target.innerHTML=html;return;
  }
  html+='<div class="opMetrics">'+
    '<div class="opMetric"><strong style="color:#a14621">'+outstanding.length+'</strong><small>Players outstanding</small></div>'+
    '<div class="opMetric"><strong style="color:#08775c">'+complete.length+'</strong><small>Fully complete</small></div>'+
    '<div class="opMetric"><strong>'+missingPicks+'</strong><small>Open picks missing</small></div></div>';
  html+='<p class="opDim" style="margin-bottom:0">'+players.length+' active members. '+upcoming+' picks not yet open; '+closed+' missed after lock. '+
    'Locked or unopened fixtures are not included in WhatsApp reminders.</p>'+
    '<div class="opDim" style="margin-top:7px">Checked '+opEsc(opLong(opState.loadedAt))+' · UK time</div></div>';
  html+='<div class="opCard"><div class="opLabel">Player status</div><div class="opFilter">'+
    [['outstanding','Outstanding ('+outstanding.length+')'],['all','All ('+players.length+')'],['complete','Complete ('+complete.length+')'],['waiting','Unopened / locked']]
    .map(([id,label])=>'<button type="button" data-op-filter="'+id+'" class="'+(opState.filter===id?'active':'')+'">'+opEsc(label)+'</button>').join('')+
    '</div>';
  const list=opPlayersFiltered();
  if(!list.length)html+='<div class="opDim">Nobody in this category.</div>';
  html+=list.map(p=>{
    const miss=opArr(p.missing_fixtures);
    const count=Number(p.missing_open)||0;
    const status=count?count+' outstanding':p.completed===p.total?'All complete':p.missing_soon?'Not yet open':'Deadline passed';
    const info=miss.length?miss.slice(0,4).map(f=>opEsc(f.home_team+' v '+f.away_team)+' · '+opEsc(opLong(f.prediction_lock_at))).join('<br>')+(miss.length>4?'<br>…and '+(miss.length-4)+' more':''):
      (p.missing_soon?String(p.missing_soon)+' awaiting opening':'')+
      (p.missing_locked?' · '+p.missing_locked+' missed after deadline':'');
    return '<div class="opPerson"><div class="opPersonTop"><div><strong>'+opEsc(p.display_name)+'</strong>'+
      '<div class="opDim">'+p.completed+' / '+p.total+' saved</div></div>'+
      '<span class="opCount '+(!opHasMissing(p)?'done':'')+'">'+opEsc(status)+'</span></div>'+
      (info?'<div class="opFixtures">'+info+'</div>':'')+
      (count?'<div class="opActions"><button type="button" class="opBtn wa" data-op-individual="'+opEsc(p.user_id)+'">WhatsApp '+opEsc(p.display_name.split(/\s/)[0])+'</button>'+
      '<button type="button" class="opBtn secondary" data-op-copy-person="'+opEsc(p.user_id)+'">Copy message</button></div>':'')+
      '</div>';
  }).join('');
  target.innerHTML=html+'</div>';
  target.querySelectorAll('[data-op-filter]').forEach(b=>b.onclick=()=>{opState.filter=b.dataset.opFilter;opRenderResults();});
  target.querySelectorAll('[data-op-individual]').forEach(b=>b.onclick=()=>opShare('individual',b.dataset.opIndividual));
  target.querySelectorAll('[data-op-copy-person]').forEach(b=>b.onclick=()=>opCopy('individual',b.dataset.opCopyPerson));
}
function opGroupMessage(onlyOutstanding) {
  const d=opState.report||{},players=opArr(d.players),fixtures=opArr(d.fixtures);
  const missing=players.filter(p=>p.missing_open>0);
  const open=fixtures.filter(f=>f.state==='open');
  if(!onlyOutstanding) {
    return ['⚽ *Premier League Predictions — '+opCurrentLabel()+'*',
      '','Quick league-wide reminder for everyone, whether you have already predicted or not.',
      '',open.length?open.length+' fixtures are open for predictions.':'No fixtures are currently open for predictions.',
      open.length?'⏰ Next lock: '+opLong(open[0].prediction_lock_at):'',
      '','✅ Already completed yours? Nice one — nothing else to do.',
      '⏳ Still have picks outstanding? Please get them submitted before their individual lock times.',
      '','📲 '+window.location.origin+window.location.pathname].filter(Boolean).join('\n');
  }
  if(!missing.length)return '✅ All available predictions are completed for '+opCurrentLabel()+'. No outstanding reminder needed.';
  return ['⏳ *Outstanding predictions — '+opCurrentLabel()+'*','',
    'The following players still have predictions to submit:',
    ...missing.map(p=>'• '+p.display_name+' — *'+p.missing_open+' missing*'+(p.next_lock?' · next deadline '+opLong(p.next_lock):'')),
    '','⏰ These are the next individual deadlines. Different fixtures may lock at different times.',
    '✅ Already completed everything? You are not on this list.',
    '','📲 '+window.location.origin+window.location.pathname].join('\n');
}
function opPersonalMessage(p) {
  if(!p||p.missing_open<=0)return 'No open predictions outstanding.';
  const lines=['⚽ *Premier League Predictions*','',
    'Hi '+p.display_name.split(/\s+/)[0]+'! Just a nudge — you still have *'+p.missing_open+
    ' prediction'+(p.missing_open===1?'':'s')+' outstanding* for '+opCurrentLabel()+'.','',
    ...opArr(p.missing_fixtures).map(f=>'• '+f.home_team+' v '+f.away_team+' — locks '+opLong(f.prediction_lock_at)),
    '','If a game locks before you predict it, you miss the chance to score points.',
    '','📲 '+window.location.origin+window.location.pathname];
  return lines.join('\n');
}
function opMessage(kind,id) {
  if(kind==='all')return opGroupMessage(false);
  if(kind==='outstanding')return opGroupMessage(true);
  const p=opArr(opState.report?.players).find(p=>p.user_id===id);
  return opPersonalMessage(p);
}
function opRenderMessages() {
  const target=opState.root?.querySelector('#op-messages');if(!target)return;
  const players=opArr(opState.report?.players).filter(p=>p.missing_open>0);
  const open=opArr(opState.report?.fixtures).some(f=>f.state==='open');
  const people=players.map(p=>'<option value="'+opEsc(p.user_id)+'" '+(p.user_id===opState.individual?'selected':'')+'>'+opEsc(p.display_name)+' ('+p.missing_open+' missing)</option>').join('');
  target.innerHTML='<div class="opCard"><h3 style="margin:0 0 8px;font-size:17px">📣 WhatsApp reminders</h3>'+
    '<p class="opDim">Choose who the message addresses. No messages are sent automatically; WhatsApp opens with a draft for you to review and choose the recipient or group.</p>'+
    '<div class="opLabel">1. Whole league — including players who are complete</div>'+
    '<div class="opActions"><button class="opBtn wa" id="op-all-share">Open WhatsApp</button><button class="opBtn secondary" id="op-all-copy">Copy</button></div>'+
    '<hr style="border:0;border-top:1px solid #ebe7ef;margin:17px 0">'+
    '<div class="opLabel">2. Outstanding players only ('+players.length+')</div>'+
    '<div class="opDim">Draft a group message naming only players who have missing, currently open predictions.</div>'+
    '<div class="opActions"><button class="opBtn wa" id="op-missing-share" '+(!players.length?'disabled':'')+'>Open WhatsApp</button>'+
    '<button class="opBtn secondary" id="op-missing-copy" '+(!players.length?'disabled':'')+'>Copy</button></div>'+
    '<hr style="border:0;border-top:1px solid #ebe7ef;margin:17px 0">'+
    '<div class="opLabel">3. Individual player reminders</div>'+
    '<select class="opControl" id="op-person">'+(people||'<option value="">Nobody outstanding</option>')+'</select>'+
    '<div class="opActions"><button class="opBtn wa" id="op-person-share" '+(!players.length?'disabled':'')+'>Open WhatsApp</button>'+
    '<button class="opBtn secondary" id="op-person-copy" '+(!players.length?'disabled':'')+'>Copy</button></div>'+
    '<div class="opHint">WhatsApp cannot privately target particular members of a group from this app. For targeted reminders, open each individual draft and select that person in WhatsApp.</div>'+
    '<div class="opLabel" style="margin-top:14px">Preview message</div>'+
    '<select id="op-preview-kind" class="opControl" aria-label="Preview reminder type"><option value="outstanding">Outstanding group message</option><option value="all">All members group message</option><option value="individual">Individual message</option></select>'+
    '<div style="margin-top:8px"><textarea readonly class="opText" id="op-preview"></textarea></div></div>';
  const bind=(selector,callback)=>{const el=target.querySelector(selector);if(el)el.onclick=callback;};
  bind('#op-all-share',()=>opShare('all'));
  bind('#op-all-copy',()=>opCopy('all'));
  bind('#op-missing-share',()=>opShare('outstanding'));
  bind('#op-missing-copy',()=>opCopy('outstanding'));
  bind('#op-person-share',()=>opShare('individual',opState.individual));
  bind('#op-person-copy',()=>opCopy('individual',opState.individual));
  target.querySelector('#op-person').onchange=e=>{opState.individual=e.target.value;opPreview();};
  target.querySelector('#op-preview-kind').onchange=opPreview;
  if(!open)target.querySelector('#op-missing-share').disabled=true;
  opPreview();
}
function opPreview(){
  const root=opState.root;
  const t=root?.querySelector('#op-preview'),s=root?.querySelector('#op-preview-kind');
  if(t&&s)t.value=opMessage(s.value,opState.individual);
}
async function opShare(kind,id) {
  // Reserve a browser tab before the network refresh, avoiding popup blockers.
  const tab=window.open('about:blank','_blank');
  const ok=await opRefresh(true);
  if(!ok){if(tab)tab.close();return;}
  const player=opArr(opState.report?.players).find(p=>p.user_id===id);
  if(kind==='individual'&&(!player||!player.missing_open)){if(tab)tab.close();opToast('That player has now completed their picks.');return;}
  if(kind==='outstanding'&&!opArr(opState.report?.players).some(p=>p.missing_open>0)){if(tab)tab.close();opToast('Everyone has completed their open picks.');return;}
  const url='https://api.whatsapp.com/send?text='+encodeURIComponent(opMessage(kind,id));
  if(tab){tab.location.href=url;}else{window.location.href=url;}
}
async function opCopy(kind,id) {
  const ok=await opRefresh(true);if(!ok)return;
  const player=opArr(opState.report?.players).find(p=>p.user_id===id);
  if(kind==='individual'&&(!player||!player.missing_open)){opToast('That player no longer has outstanding picks.');return;}
  if(kind==='outstanding'&&!opArr(opState.report?.players).some(p=>p.missing_open>0)){opToast('Nobody outstanding.');return;}
  const text=opMessage(kind,id);
  try{await navigator.clipboard.writeText(text);opToast('Reminder copied.');}
  catch(_){
    const t=opState.root?.querySelector('#op-preview');if(t){t.value=text;t.focus();t.select();document.execCommand('copy');opToast('Reminder copied or selected.');}
  }
}
function opClose() {
  opState.root?.remove();opState.root=null;
  document.body.style.overflow='';
}
async function opOpen(){
  if(opState.root)return;
  opCss();
  const root=document.createElement('div');root.className='opScreen';root.setAttribute('role','dialog');
  root.setAttribute('aria-label','Outstanding Predictions administration');
  document.body.appendChild(root);opState.root=root;
  document.body.style.overflow='hidden';
  root.innerHTML='<div class="opWrap"><div class="opCard" style="margin-top:28px">Loading admin reporting…</div></div>';
  try {
    if(!opState.leagueId)await opConnect();
    opBuildShell();await opRefresh();
  }catch(e){
    root.innerHTML='<div class="opWrap"><div class="opCard" style="margin-top:30px"><div class="opError">'+opEsc(e.message||String(e))+'</div>'+
      '<button class="opBtn secondary" id="op-error-back" style="margin-top:12px">Back</button></div></div>';
    root.querySelector('#op-error-back').onclick=opClose;
  }
}
window.outstandingOpen=opOpen;
