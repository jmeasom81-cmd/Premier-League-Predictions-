// OWNER MESSAGE GENERATOR V3
// Flexible owner-only WhatsApp/Home message generator using real league data.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const mgSb=createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const MG_APP='https://jmeasom81-cmd.github.io/Premier-League-Predictions-/';

let mgCtx=null;
let mgData=null;
let mgSeed=0;
let mgLastTitle='';
let mgLastMessage='';
let mgBusy=false;

const mgEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const mgArr=v=>Array.isArray(v)?v:[];
const mgNum=v=>Number(v||0);
const mgName=x=>x?.display_name||x?.team_name||'Player';
const mgTeam=x=>x?.team_name||x?.display_name||'Player';
const mgOrd=n=>{n=Number(n)||0;const v=n%100,s=['th','st','nd','rd'];return n+(s[(v-20)%10]||s[v]||s[0])};

function mgCss(){
  if(document.getElementById('mg-v1-css'))return;
  const s=document.createElement('style');
  s.id='mg-v1-css';
  s.textContent=`
    .mgOverlay{position:fixed;inset:0;z-index:10020;background:#f4f3f8;overflow:auto}
    .mgShell{max-width:760px;margin:auto;min-height:100vh;padding-bottom:34px}
    .mgHead{
      position:sticky;top:0;z-index:4;
      background:linear-gradient(135deg,#241153,#4f2994 60%,#8a2b66);
      color:#fff;padding:calc(14px + env(safe-area-inset-top)) 14px 17px;
      border-radius:0 0 25px 25px;box-shadow:0 9px 26px rgba(36,17,83,.22)
    }
    .mgHeadTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    .mgEyebrow{font-size:8px;font-weight:950;letter-spacing:.13em;text-transform:uppercase;opacity:.72}
    .mgTitle{font-size:22px;font-weight:950;line-height:1.05;margin-top:4px}
    .mgSub{font-size:9px;line-height:1.45;opacity:.8;margin-top:5px}
    .mgClose{border:0;border-radius:11px;background:rgba(255,255,255,.14);color:#fff;width:40px;height:40px;font-size:19px}
    .mgBody{padding:11px}
    .mgPanel{background:#fff;border:1px solid #e6e2ee;border-radius:17px;padding:12px;margin-bottom:9px}
    .mgPanelHead{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:9px}
    .mgPanelHead h2{font-size:13px;margin:0;color:#302747}
    .mgPanelHead span{font-size:8px;color:#87818f}
    .mgLabel{font-size:7.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:#7c7686;margin:10px 0 5px}
    .mgChoices{display:flex;gap:5px;flex-wrap:wrap}
    .mgChoice{
      border:1px solid #e0dbe8;background:#faf9fc;color:#554d60;
      border-radius:999px;padding:7px 9px;font-size:8.5px;font-weight:900
    }
    .mgChoice.active{background:#4f2994;color:#fff;border-color:#4f2994}
    .mgChoice.focus.active{background:#eae2ff;color:#4f2994;border-color:#cbb9ee}
    .mgSelect{width:100%;border:1px solid #ddd8e7;border-radius:10px;padding:9px;background:#fff;font-size:10px;font-weight:800}
    .mgToggleGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:5px}
    .mgToggle{
      border:1px solid #e5e1eb;border-radius:11px;padding:8px 9px;background:#faf9fc;
      display:flex;align-items:center;gap:7px;font-size:8.5px;font-weight:850;color:#50495a
    }
    .mgToggle input{accent-color:#5b34a4}
    .mgPrompt{
      width:100%;min-height:92px;border:1px solid #dcd7e6;border-radius:12px;
      padding:10px;background:#fff;color:#292431;font-family:inherit;
      font-size:10px;line-height:1.45;resize:vertical
    }
    .mgHint{font-size:7.8px;color:#87818f;line-height:1.45;margin-top:5px}
    .mgGenerate{
      width:100%;border:0;border-radius:12px;padding:11px;background:#5b34a4;color:#fff;
      font-size:10px;font-weight:950;margin-top:10px
    }
    .mgGenerate:disabled{opacity:.55}
    .mgOutput{display:none}
    .mgOutput.ready{display:block}
    .mgTitleInput,.mgText{
      width:100%;border:1px solid #dcd7e6;border-radius:11px;background:#fff;
      color:#292431;font-family:inherit
    }
    .mgTitleInput{padding:9px;font-size:10px;font-weight:900;margin-bottom:7px}
    .mgText{padding:10px;font-size:10px;line-height:1.52;min-height:290px;resize:vertical}
    .mgActions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
    .mgBtn{border:0;border-radius:10px;padding:9px;font-size:8.5px;font-weight:950}
    .mgBtn.regen{background:#f0edf6;color:#4f4264}
    .mgBtn.copy{background:#eceaf2;color:#373142}
    .mgBtn.wa{background:#08775c;color:#fff}
    .mgBtn.home{background:#f0e8ff;color:#5b34a4}
    .mgFoot{font-size:8px;color:#837d89;line-height:1.45;margin-top:7px}
    .mgLoading{padding:18px;text-align:center;color:#777181;font-size:10px}
    .mgToast{
      position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:10060;
      background:#241153;color:#fff;border-radius:11px;padding:9px 12px;font-size:9px;font-weight:900;
      box-shadow:0 8px 22px rgba(0,0,0,.2);max-width:86vw;text-align:center
    }
    .mgPreviewFacts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
    .mgFact{background:#f7f5fb;border-radius:10px;padding:8px 5px;text-align:center}
    .mgFact b{display:block;font-size:14px;color:#2e2147}.mgFact span{font-size:6.8px;color:#817a8b;text-transform:uppercase;font-weight:900}
    @media(max-width:520px){.mgText{min-height:330px}}
  `;
  document.head.appendChild(s);
}

async function mgContext(){
  if(mgCtx)return mgCtx;
  const {data:{session}}=await mgSb.auth.getSession();
  if(!session)return null;
  const {data,error}=await mgSb.from('league_members')
    .select('league_id,role,status,joined_at')
    .eq('user_id',session.user.id)
    .eq('status','active')
    .order('joined_at',{ascending:false});
  if(error)throw error;
  const admin=(data||[]).find(x=>x.role==='admin');
  if(!admin)throw new Error('League owner only');
  mgCtx={userId:session.user.id,leagueId:admin.league_id};
  return mgCtx;
}

function mgUKDay(v){
  try{
    return new Intl.DateTimeFormat('en-CA',{
      timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'
    }).format(new Date(v));
  }catch{return ''}
}

function mgDateLabel(v){
  if(!v)return '';
  try{
    const d=/^\d{4}-\d{2}-\d{2}$/.test(String(v))?new Date(v+'T12:00:00Z'):new Date(v);
    return new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short'
    }).format(d);
  }catch{return String(v)}
}

function mgPick(list,offset=0){
  if(!list.length)return '';
  return list[Math.abs((mgSeed+offset)%list.length)];
}

function mgEmoji(symbol,level){
  if(level==='none')return '';
  if(level==='light'&&['😂','😬','👀','🔥'].includes(symbol))return '';
  return symbol+' ';
}

function mgHistoryPredictions(row){
  return mgArr(row?.predictions).filter(x=>x&&x.user_id);
}

function mgHistoryScope(history,scope,base){
  const completed=mgArr(history).filter(x=>x.result_home_score!=null&&x.result_away_score!=null);
  if(scope==='last6'){
    const latestCompleted=Number(base?.matchweek||0);
    const weeks=[...new Set(
      completed
        .map(x=>Number(x.matchweek||0))
        .filter(mw=>mw>0&&(!latestCompleted||mw<=latestCompleted))
    )].sort((a,b)=>b-a).slice(0,6);
    return completed.filter(x=>weeks.includes(Number(x.matchweek||0)));
  }
  if(scope==='matchweek'){
    const mw=Number(base?.matchweek||0);
    return completed.filter(x=>Number(x.matchweek)===mw);
  }
  const day=String(base?.selected_date||'');
  return completed.filter(x=>mgUKDay(x.kickoff_at)===day);
}

function mgNearMisses(rows){
  const map=new Map();
  let total=0;
  for(const f of rows){
    const ah=Number(f.result_home_score),aa=Number(f.result_away_score);
    for(const p of mgHistoryPredictions(f)){
      if(p.home_score==null||p.away_score==null)continue;
      const dist=Math.abs(Number(p.home_score)-ah)+Math.abs(Number(p.away_score)-aa);
      if(dist!==1||Number(p.points)===3)continue;
      total++;
      const id=String(p.user_id),cur=map.get(id)||{...p,count:0};
      cur.count++;map.set(id,cur);
    }
  }
  const players=[...map.values()].sort((a,b)=>b.count-a.count||mgName(a).localeCompare(mgName(b)));
  return {total,players};
}

function mgRecentForm(rows){
  const map=new Map();
  for(const f of rows){
    for(const p of mgHistoryPredictions(f)){
      if(p.home_score==null||p.away_score==null)continue;
      const id=String(p.user_id);
      const cur=map.get(id)||{...p,points:0,exacts:0,scoring:0,submitted:0};
      const pts=Number(p.points||0);
      cur.points+=pts;cur.submitted++;
      if(pts===3)cur.exacts++;
      if(pts>0)cur.scoring++;
      map.set(id,cur);
    }
  }
  return [...map.values()].sort((a,b)=>b.points-a.points||b.exacts-a.exacts||mgName(a).localeCompare(mgName(b)));
}

function mgFixtureExactParty(rows){
  let best=null;
  for(const f of rows){
    const preds=mgHistoryPredictions(f);
    const exacts=preds.filter(p=>Number(p.points)===3).length;
    if(!best||exacts>best.exacts)best={...f,exacts};
  }
  return best;
}

async function mgLoad(scope,day=null,fixtureId=null,matchweek=null){
  const c=await mgContext();

  let base={};
  let history=[];
  let context={};
  let scoped=[];

  if(['week_so_far','preweek','preday'].includes(scope)){
    const response=await mgSb.rpc('get_owner_message_story_period',{
      p_league_id:c.leagueId,p_mode:scope,
      p_day:scope==='preday'?day||null:null,
      p_matchweek:scope!=='preday'?(Number(matchweek)||null):null
    });
    if(response.error)throw response.error;
    base=response.data||{};
    scoped=scope==='week_so_far'?mgArr(base.scored_rows):[];
  }else if(scope==='matchday'||scope==='match'){
    const scopeRes=await mgSb.rpc('get_owner_message_scope',{
      p_league_id:c.leagueId,
      p_day:day||null,
      p_fixture_id:scope==='match'?(fixtureId||null):null
    });
    if(scopeRes.error)throw scopeRes.error;
    base=scopeRes.data||{};

    const [histRes,ctxRes]=await Promise.all([
      mgSb.rpc('get_league_history',{p_league_id:c.leagueId,p_limit:200}),
      mgSb.rpc('get_match_centre_context',{p_league_id:c.leagueId})
    ]);
    if(histRes.error)throw histRes.error;
    if(ctxRes.error)throw ctxRes.error;
    history=mgArr(histRes.data);
    context=ctxRes.data||{};
    scoped=mgArr(base.scored_rows);

    if(scope==='matchday'&&base.selected_date){
      try{
        const daily=await mgSb.rpc('get_owner_daily_recap',{
          p_league_id:c.leagueId,
          p_day:base.selected_date
        });
        if(!daily.error&&daily.data){
          base={
            ...daily.data,
            ...base,
            biggest_climbers:mgArr(daily.data.biggest_climbers),
            biggest_falls:mgArr(daily.data.biggest_falls)
          };
        }
      }catch{}
    }
  }else if(scope==='prematch'){
    const [preRes,histRes,ctxRes]=await Promise.all([
      mgSb.rpc('get_owner_pre_match_analysis',{
        p_league_id:c.leagueId,
        p_fixture_id:fixtureId||null
      }),
      mgSb.rpc('get_league_history',{p_league_id:c.leagueId,p_limit:200}),
      mgSb.rpc('get_match_centre_context',{p_league_id:c.leagueId})
    ]);
    if(preRes.error)throw preRes.error;
    if(histRes.error)throw histRes.error;
    if(ctxRes.error)throw ctxRes.error;
    base=preRes.data||{};
    history=mgArr(histRes.data);
    context=ctxRes.data||{};
    scoped=[];
  }else{
    const common=[
      mgSb.rpc('get_owner_weekly_review',{p_league_id:c.leagueId}),
      mgSb.rpc('get_league_history',{p_league_id:c.leagueId,p_limit:200}),
      mgSb.rpc('get_match_centre_context',{p_league_id:c.leagueId})
    ];
    const results=await Promise.all(common);
    for(const x of results){if(x?.error)throw x.error}
    base=results[0].data||{};
    history=mgArr(results[1].data);
    context=results[2].data||{};
    scoped=mgHistoryScope(history,scope,base);
  }

  let changes=null;
  if(scope!=='prematch'){
    try{
      const r=await mgSb.rpc('get_owner_prediction_change_analytics',{p_league_id:c.leagueId});
      if(!r.error)changes=r.data||{};
    }catch{}
  }

  const near=mgNearMisses(scoped);
  const form=mgRecentForm(scoped);
  const exactParty=mgFixtureExactParty(scoped);
  const sampleMatchweeks=[...new Set(scoped.map(x=>Number(x.matchweek||0)).filter(Boolean))].sort((a,b)=>a-b);
  return {scope,base,history,context,scoped,near,form,exactParty,changes,sampleMatchweeks};
}
function mgScopeTitle(d){
  if(d.scope==='week_so_far')return 'Matchweek '+mgNum(d.base?.matchweek)+' so far';
  if(d.scope==='preweek')return 'Before Matchweek '+mgNum(d.base?.matchweek);
  if(d.scope==='preday')return 'Pre-matchday · '+mgDateLabel(d.base?.selected_date);
  if(d.scope==='prematch'){
    const f=d.base?.selected_fixture;
    return f?('Pre-match · '+f.home_team+' v '+f.away_team):'Pre-match prediction analysis';
  }
  if(d.scope==='match'){
    const f=d.base?.selected_fixture;
    return f?(f.home_team+' v '+f.away_team):'Individual match';
  }
  if(d.scope==='matchday')return 'Day so far · '+mgDateLabel(d.base.selected_date);
  if(d.scope==='matchweek')return 'Matchweek '+Number(d.base.matchweek||0);
  const n=d.sampleMatchweeks?.length||0;
  return 'Last '+(n||6)+' completed matchweek'+(n===1?'':'s');
}

function mgTopPerformers(d){
  if(d.scope==='prematch')return [];
  if(d.scope==='matchday'||d.scope==='match')return mgArr(d.base.day_top_five);
  if(d.scope==='matchweek'||d.scope==='week_so_far')return mgArr(d.base.week_top_five);
  return d.form.slice(0,5);
}

function mgBottomPerformers(d){
  if(d.scope==='prematch')return [];
  if(d.scope==='matchday'||d.scope==='match')return mgArr(d.base.day_bottom_five);
  if(d.scope==='week_so_far')return mgArr(d.base.week_bottom_five).filter(x=>mgNum(x.submitted)>0);
  return [...d.form]
    .filter(x=>mgNum(x.submitted)>0)
    .sort((a,b)=>mgNum(a.points)-mgNum(b.points)||mgNum(a.exacts)-mgNum(b.exacts)||mgName(a).localeCompare(mgName(b)))
    .slice(0,5);
}

function mgExacts(d){
  if(d.scope==='prematch')return {total:0,stars:[]};
  if(d.scope==='matchday'||d.scope==='match')return {
    total:mgNum(d.base.day_stats?.total_exacts),
    stars:mgArr(d.base.exact_stars)
  };
  if(d.scope==='matchweek'||d.scope==='week_so_far')return {
    total:mgNum(d.base.week_stats?.total_exacts),
    stars:mgArr(d.base.exact_stars)
  };
  const total=d.form.reduce((a,x)=>a+mgNum(x.exacts),0);
  const high=Math.max(0,...d.form.map(x=>mgNum(x.exacts)));
  return {total,stars:d.form.filter(x=>mgNum(x.exacts)===high&&high>0)};
}

function mgMovers(d){
  if(d.scope==='matchday'||d.scope==='matchweek'){
    return {up:mgArr(d.base.biggest_climbers),down:mgArr(d.base.biggest_falls)};
  }
  return {up:[],down:[]};
}

function mgTable(d){
  if(d.scope==='matchday'||d.scope==='match')return mgArr(d.base.top_three_after);
  if(['matchweek','week_so_far','preweek','preday'].includes(d.scope))return mgArr(d.base.top_three);
  return mgArr(d.context?.standings).slice(0,3);
}

function mgAverage(d){
  if(d.scope==='prematch')return 0;
  if(d.scope==='matchday'||d.scope==='match')return mgNum(d.base.day_stats?.average_points);
  if(d.scope==='matchweek'||d.scope==='week_so_far')return mgNum(d.base.week_stats?.average_points);
  if(!d.form.length)return 0;
  return Math.round(d.form.reduce((a,x)=>a+mgNum(x.points),0)*10/d.form.length)/10;
}
function mgSettings(){
  const o=document.querySelector('.mgOverlay');
  const active=key=>o?.querySelector('[data-mg-'+key+'].active')?.dataset['mg'+key[0].toUpperCase()+key.slice(1)]||'';
  const focuses=[...o.querySelectorAll('[data-mg-focus].active')].map(x=>x.dataset.mgFocus);
  return {
    scope:active('scope')||'matchday',
    length:active('length')||'medium',
    tone:active('tone')||'banter',
    detail:active('detail')||'medium',
    mood:active('mood')||'balanced',
    emoji:active('emoji')||'light',
    focuses:focuses.length?focuses:['auto'],
    prompt:o.querySelector('[data-mg-prompt]')?.value?.trim()||'',
    table:!!o.querySelector('[data-mg-extra="table"]')?.checked,
    topEarners:!!o.querySelector('[data-mg-extra="top-earners"]')?.checked,
    bottomEarners:!!o.querySelector('[data-mg-extra="bottom-earners"]')?.checked,
    random:!!o.querySelector('[data-mg-extra="random"]')?.checked,
    link:!!o.querySelector('[data-mg-extra="link"]')?.checked
  };
}

function mgPromptFlags(prompt=''){
  const q=String(prompt||'').toLowerCase();
  return {
    international:/international break|no matches for|no games for|fixture break|break coming/.test(q),
    blanks:/fired? blanks|blanked|blanking|zero points|no points/.test(q),
    movers:/biggest mover|big mover|climber|climbed|riser|rising/.test(q),
    falls:/dropping like flies|biggest fall|falling|dropping|sliding|plummet/.test(q),
    unlucky:/unlucky|near miss|near-miss|nearly|almost/.test(q),
    exacts:/exact|three pointer|3 pointer/.test(q),
    form:/form|last six|last 6|hot streak|cold streak/.test(q),
    table:/table|leader|top three|top 3|title race/.test(q),
    changes:/prediction change|changed pick|tinker|second thought/.test(q)
  };
}

function mgChooseFocus(s,d){
  if(['prematch','preweek','preday'].includes(d.scope))return ['predictions'];
  const manual=!s.focuses.includes('auto');
  const out=manual?[...s.focuses]:[];
  if(!manual){
    if(s.topEarners)out.push('performers');
    out.push('exacts');
    const mv=mgMovers(d);
    if(mv.up.length)out.push('movers');
    if(d.near.total)out.push('unlucky');
    if(d.scope==='last6')out.push('form');
    if(s.length!=='short')out.push('table');
  }
  if(s.bottomEarners)out.push('bottom');

  const f=mgPromptFlags(s.prompt);
  if(f.movers||f.falls)out.push('movers');
  if(f.unlucky)out.push('unlucky');
  if(f.exacts)out.push('exacts');
  if(f.form)out.push('form');
  if(f.table)out.push('table');
  if(f.changes)out.push('changes');

  return [...new Set(out)];
}
function mgLinePeople(rows,limit=3,metric='points'){
  return rows.slice(0,limit).map((x,i)=>{
    const name=mgName(x);
    if(metric==='near')return `${i+1}. ${name} — ${mgNum(x.count)} near miss${mgNum(x.count)===1?'':'es'}`;
    return `${i+1}. ${name} — ${mgNum(x.points)} pts${mgNum(x.exacts)?` · ${mgNum(x.exacts)} exact${mgNum(x.exacts)===1?'':'s'}`:''}`;
  }).join('\n');
}

function mgIntro(s,d){
  const scope=mgScopeTitle(d);
  if(d.scope==='week_so_far'){
    const b=d.base||{},done=mgNum(b.completed_count),live=mgNum(b.live_count),
      pending=mgNum(b.upcoming_count),total=mgNum(b.fixtures_count);
    let line='⚽ *Matchweek '+mgNum(b.matchweek)+' — so far*\n'+done+'/'+total+' full time';
    if(live)line+=' · '+live+' live';
    if(pending)line+=' · '+pending+' still to come';
    return line+'.'+(s.tone==='banter'?'\nThe table is moving and the excuses are warming up. 😄':'');
  }

  if(d.scope==='prematch'){
    const f=d.base?.selected_fixture;
    if(!f)return 'No locked pre-match fixture is available yet.';
    if(s.tone==='banter')return `🔒 Predictions are locked for ${f.home_team} v ${f.away_team}. Time to see who has been brave and who has played it safe. 👀`;
    if(s.tone==='serious')return `Pre-match prediction analysis: ${f.home_team} v ${f.away_team}.`;
    return `Predictions are locked for ${f.home_team} v ${f.away_team}. Here is how the league sees it before kickoff.`;
  }

  if(d.scope==='matchday'){
    const total=mgNum(d.base?.day_total_fixtures);
    const scored=mgNum(d.base?.day_scored_fixtures);
    const fixtures=mgArr(d.base?.fixtures);
    const remaining=fixtures.filter(x=>x.score_state==='pending').length;
    const live=fixtures.filter(x=>x.score_state==='live').length;
    let progress=`${scope}: ${scored} of ${total} match${total===1?'':'es'} have a score on the board`;
    if(live)progress+=` · ${live} live`;
    if(remaining)progress+=` · ${remaining} still to come`;
    progress+='.';
    if(s.tone==='banter')return progress+' Plenty has happened already. 😄';
    return progress;
  }

  if(d.scope==='match'){
    const f=d.base?.selected_fixture;
    if(!f)return 'Individual match analysis.';
    const has=f.home_score!=null&&f.away_score!=null;
    if(has){
      const status=f.score_state==='final'?'FT':f.score_state==='live'?'as it stands':'latest score';
      return `${f.home_team} ${f.home_score}–${f.away_score} ${f.away_team} — ${status}. Here is what it means for the prediction league.`;
    }
    return `${f.home_team} v ${f.away_team} — no score is available yet.`;
  }

  const banks={
    banter:[
      `${scope} has delivered. Some people cooked. Some people absolutely did not. 👀`,
      `${scope} is in the books — and the prediction gods have been busy again. 😂`,
      `${scope}: confidence was high. Accuracy was… selective. 😄`
    ],
    balanced:[
      `${scope} is complete — here are the main stories from the league.`,
      `Here’s the latest from ${scope.toLowerCase()}.`,
      `${scope} brought a few changes worth talking about.`
    ],
    serious:[
      `${scope} summary.`,
      `League update for ${scope.toLowerCase()}.`,
      `Performance summary: ${scope}.`
    ]
  };
  let line=mgPick(banks[s.tone]||banks.balanced,1);
  if(s.mood==='celebrate'&&s.tone!=='serious')line+=' Plenty to celebrate in this one.';
  if(s.mood==='stir'&&s.tone==='banter')line+=' Nobody hide the receipts.';
  return line;
}
function mgPerformersSection(s,d){
  const rows=mgTopPerformers(d);
  if(!rows.length)return '';
  const n=s.length==='short'?2:s.length==='medium'?3:5;
  const head=s.tone==='serious'?'Top performers':s.tone==='banter'?'🔥 Who turned up':'🌟 Top performers';
  let body=mgLinePeople(rows,n);
  if(s.tone==='banter'&&s.mood==='stir'&&rows[0]){
    body+=`\n${mgName(rows[0])} can enjoy the screenshots until the next set of fixtures.`;
  }
  return `${head}\n${body}`;
}


function mgBottomSection(s,d){
  const rows=mgBottomPerformers(d);
  if(!rows.length)return '';
  const n=s.length==='short'?2:s.length==='medium'?3:5;
  const head=s.tone==='serious'?'Lowest points return':s.tone==='banter'?'🥶 Toughest returns':'Lowest points earners';
  const body=rows.slice(0,n).map((x,i)=>`${i+1}. ${mgName(x)} — ${mgNum(x.points)} pts${mgNum(x.exacts)?` · ${mgNum(x.exacts)} exact${mgNum(x.exacts)===1?'':'s'}`:''}`).join('\n');
  return `${head}\n${body}`;
}

function mgPreMatchSection(s,d){
  const f=d.base?.selected_fixture;
  const st=d.base?.prediction_stats||{};
  const picks=mgArr(d.base?.predictions);
  const popular=mgArr(d.base?.popular_scores);
  if(!f)return 'No locked upcoming fixture is available for pre-match analysis.';
  const total=mgNum(st.picks_count);
  if(!total)return 'Predictions are locked, but no sealed picks are available to analyse yet.';
  const h=mgNum(st.home_count),dr=mgNum(st.draw_count),aw=mgNum(st.away_count);
  const pct=n=>Math.round(n*100/total);
  const top=popular[0];
  const lines=[];
  lines.push(`🔮 *League prediction split*`);
  lines.push(`${f.home_team}: ${h} (${pct(h)}%) · Draw: ${dr} (${pct(dr)}%) · ${f.away_team}: ${aw} (${pct(aw)}%)`);
  if(top)lines.push(`Most popular score: *${top.home_score}–${top.away_score}* — ${mgNum(top.picks)} pick${mgNum(top.picks)===1?'':'s'}`);
  lines.push(`${mgNum(st.unique_scorelines)} different scoreline${mgNum(st.unique_scorelines)===1?'':'s'} across ${total} locked picks.`);

  const groups={H:picks.filter(x=>x.outcome==='H'),D:picks.filter(x=>x.outcome==='D'),A:picks.filter(x=>x.outcome==='A')};
  const nonEmpty=[['H',h],['D',dr],['A',aw]].filter(x=>x[1]>0).sort((x,y)=>x[1]-y[1]);
  if(nonEmpty.length){
    const minority=nonEmpty[0][0];
    const names=groups[minority].slice(0,s.detail==='high'?6:3).map(mgName);
    const label=minority==='H'?f.home_team:minority==='A'?f.away_team:'the draw';
    if(names.length)lines.push(`Minority call — ${label}: ${names.join(', ')}${groups[minority].length>names.length?' + others':''}.`);
  }

  if(s.detail==='high'){
    const rare=popular.filter(x=>mgNum(x.picks)===1).slice(0,4);
    if(rare.length){
      const bits=[];
      for(const r of rare){
        const owner=picks.find(x=>Number(x.home_score)===Number(r.home_score)&&Number(x.away_score)===Number(r.away_score));
        if(owner)bits.push(`${mgName(owner)} ${r.home_score}–${r.away_score}`);
      }
      if(bits.length)lines.push(`One-off calls: ${bits.join(' · ')}`);
    }
  }

  if(mgNum(st.missing_count)>0)lines.push(`${mgNum(st.missing_count)} player${mgNum(st.missing_count)===1?' has':'s have'} no locked pick recorded.`);
  return lines.join('\n');
}
function mgMoverSection(s,d){
  const m=mgMovers(d);
  if(!m.up.length&&!m.down.length)return '';
  const bits=[];
  if(m.up.length){
    const x=m.up[0];
    bits.push(`${mgEmoji('🚀',s.emoji)}${mgName(x)}: ${mgOrd(x.from)} → ${mgOrd(x.to)} (+${mgNum(x.places)})`);
  }
  if(s.length!=='short'&&m.down.length){
    const x=m.down[0];
    bits.push(`${mgEmoji('📉',s.emoji)}${mgName(x)}: ${mgOrd(x.from)} → ${mgOrd(x.to)} (-${mgNum(x.places)})`);
  }
  const title=s.tone==='serious'?'League movement':s.tone==='banter'?'📈 Movers & shakers':'📈 Biggest movers';
  return title+'\n'+bits.join('\n');
}

function mgExactSection(s,d){
  const e=mgExacts(d);
  if(!e.total)return `${mgEmoji('🎯',s.emoji)}No exact scores in this sample.`;
  const names=e.stars.slice(0,3).map(mgName);
  let line=`${mgEmoji('🎯',s.emoji)}${e.total} exact score${e.total===1?'':'s'} landed.`;
  if(names.length===1)line+=` ${names[0]} led the exact-score count.`;
  else if(names.length>1)line+=` Best exact return: ${names.join(', ')}.`;
  if(s.detail==='high'&&d.exactParty?.exacts){
    line+=` Biggest exact-score party: ${d.exactParty.home_team} v ${d.exactParty.away_team} — ${d.exactParty.exacts} exact picks.`;
  }
  return line;
}

function mgUnluckySection(s,d){
  if(!d.near.total)return '';
  const n=s.length==='long'?4:2;
  const top=d.near.players.slice(0,n);
  const title=s.tone==='serious'?'Near misses':s.tone==='banter'?'😬 The nearly crew':'🍀 Unluckiest calls';
  let out=`${title}\n${mgLinePeople(top,n,'near')}`;
  if(s.tone==='banter'&&s.mood==='stir')out+='\nClose enough to hurt. Not close enough for the points.';
  return out;
}

function mgFormSection(s,d){
  if(!d.form.length)return '';
  const top=d.form.slice(0,s.length==='short'?2:4);
  const weeks=d.sampleMatchweeks?.length||0;
  const title=s.tone==='serious'
    ?`Current form — last ${weeks||6} matchweeks`
    :`🔥 Current form — last ${weeks||6} matchweeks`;
  let body=mgLinePeople(top,top.length);
  if(s.length==='long'){
    const cold=[...d.form].filter(x=>x.submitted>0).sort((a,b)=>a.points-b.points||a.exacts-b.exacts).slice(0,2);
    if(cold.length)body+=`\n\nQuiet patch:\n${cold.map(x=>`${mgName(x)} — ${mgNum(x.points)} pts from ${mgNum(x.submitted)} picks`).join('\n')}`;
  }
  return title+'\n'+body;
}

function mgTableSection(s,d){
  const rows=mgTable(d);
  if(!rows.length)return '';
  const line=rows.slice(0,3).map((x,i)=>`${x.position||i+1}. ${x.badge||'⚽'} ${mgTeam(x)} — ${mgNum(x.points??x.total_points)} pts`).join('\n');
  return (s.tone==='serious'?'Current top 3':'🏆 Top of the table')+'\n'+line;
}

function mgAllPredictionChanges(d){
  const out=[];
  for(const p of mgArr(d?.changes?.players)){
    for(const ch of mgArr(p?.changes)){
      out.push({
        ...ch,
        user_id:p.user_id,
        display_name:p.display_name,
        team_name:p.team_name,
        badge:p.badge
      });
    }
  }
  return out;
}

function mgScopedChanges(d){
  const fixtureIds=new Set((d.scoped||[]).map(x=>String(x.fixture_id||'')));
  const weeks=new Set((d.sampleMatchweeks||[]).map(Number));

  const rows=mgAllPredictionChanges(d).filter(x=>{
    if(mgNum(x.impact)===0)return false;
    if(d.scope==='matchweek')return Number(x.matchweek)===Number(d.base?.matchweek||0);
    if(d.scope==='last6')return weeks.has(Number(x.matchweek||0));
    if(d.scope==='matchday'||d.scope==='match')return fixtureIds.has(String(x.fixture_id||''));
    return true;
  });

  return {
    best:[...rows].filter(x=>mgNum(x.impact)>0)
      .sort((a,b)=>mgNum(b.impact)-mgNum(a.impact)||new Date(b.last_edit_at||0)-new Date(a.last_edit_at||0)),
    worst:[...rows].filter(x=>mgNum(x.impact)<0)
      .sort((a,b)=>mgNum(a.impact)-mgNum(b.impact)||new Date(b.last_edit_at||0)-new Date(a.last_edit_at||0))
  };
}

function mgChangeLine(prefix,x,s){
  if(!x)return '';
  const impact=mgNum(x.impact);
  const pts=(impact>0?'+':'')+impact+' pts';
  const fixture=x.fixture||'Fixture unavailable';
  const initial=x.initial||'?';
  const final=x.final||'?';
  const actual=x.actual||'?';

  if(s.length==='short'){
    return `${prefix}: ${mgTeam(x)} — ${fixture} · ${initial} → ${final} · FT ${actual} · ${pts}`;
  }

  return `${prefix}: ${mgTeam(x)}\n${fixture}\nInitial pick ${initial} → final pick ${final} · FT ${actual} · ${pts}`;
}

function mgChangeSection(s,d){
  const scoped=mgScopedChanges(d);
  const best=scoped.best[0];
  const worst=scoped.worst[0];
  if(!best&&!worst)return '';

  const lines=[];
  if(best){
    lines.push(mgChangeLine(
      `${mgEmoji('🧠',s.emoji)}Best rethink`,
      best,
      s
    ));
  }
  if(worst&&s.length!=='short'){
    lines.push(mgChangeLine(
      `${mgEmoji('🤦',s.emoji)}Costly rethink`,
      worst,
      s
    ));
  }

  return (s.tone==='serious'?'Prediction changes':'🧠 Second thoughts')+'\n'+lines.join('\n\n');
}

function mgPromptSection(s,d){
  const raw=String(s.prompt||'').trim();
  if(!raw)return '';
  const f=mgPromptFlags(raw);
  const lines=[];

  if(f.international){
    const opts=s.tone==='banter'
      ?[
        '🌍 And that is us parked for the international break — no Premier League points to win for a little while, so the bragging rights get an extended shelf life.',
        '🌍 International break time. The league table can stop moving for five minutes and everyone can pretend their next predictions will be more sensible.',
        '🌍 No league fixtures for a while thanks to the international break — plenty of time to study the form. Or wildly overthink it.'
      ]
      :[
        'The Premier League now pauses for the international break, so there will be no new league scoring for a while.',
        'An international break follows this round, giving the league a short pause before the next set of predictions.'
      ];
    lines.push(mgPick(opts,11));
  }

  if(f.blanks){
    const zero=[...d.form].filter(x=>mgNum(x.submitted)>0&&mgNum(x.points)===0);
    if(zero.length){
      const names=zero.slice(0,s.length==='long'?5:3).map(mgName);
      lines.push(`${s.tone==='banter'?'🥚 Fired blanks':'Scoreless'}: ${names.join(', ')} ${names.length===1?'finished':'finished'} the selected period without a point.`);
    }else if(s.tone==='banter'){
      lines.push('Nobody completely fired blanks in this sample — everyone managed to scrape something together.');
    }
  }

  if(f.movers){
    const up=mgMovers(d).up[0];
    if(up)lines.push(`${s.tone==='banter'?'🚀 Biggest mover':'Biggest mover'}: ${mgName(up)} climbed ${mgNum(up.places)} place${mgNum(up.places)===1?'':'s'} (${mgOrd(up.from)} → ${mgOrd(up.to)}).`);
  }

  if(f.falls){
    const falls=mgMovers(d).down.slice(0,s.length==='long'?3:2);
    if(falls.length){
      const desc=falls.map(x=>`${mgName(x)} -${mgNum(x.places)}`).join(', ');
      lines.push(`${s.tone==='banter'?'🪂 Dropping like flies':'Biggest drops'}: ${desc}.`);
    }
  }

  if(f.unlucky&&d.near.players.length){
    const x=d.near.players[0];
    lines.push(`${s.tone==='banter'?'😬 Cruel one':'Near-miss watch'}: ${mgName(x)} had ${mgNum(x.count)} prediction${mgNum(x.count)===1?'':'s'} finish one goal away from exact.`);
  }

  // For an instruction we don't explicitly recognise, keep the owner's angle visible
  // without pretending a language model interpreted more than it did.
  if(!lines.length){
    const cleaned=raw
      .replace(/^(please\s+)?(reference|mention|talk about|include)\s+/i,'')
      .replace(/\s+/g,' ')
      .slice(0,180);
    if(cleaned){
      lines.push(s.tone==='serious'
        ?`Additional talking point: ${cleaned}.`
        :`One more angle for the group: ${cleaned.replace(/[.!?]+$/,'')}.`);
    }
  }

  return lines.join('\n');
}

function mgRandomStat(s,d){
  const stats=[];
  if(d.scope==='prematch'){
    const st=d.base?.prediction_stats||{};
    const popular=mgArr(d.base?.popular_scores)[0];
    const f=d.base?.selected_fixture;
    if(mgNum(st.picks_count))stats.push(`${mgNum(st.picks_count)} locked picks are in for this fixture.`);
    if(mgNum(st.unique_scorelines))stats.push(`The league has used ${mgNum(st.unique_scorelines)} different scorelines.`);
    if(popular)stats.push(`The most popular score is ${popular.home_score}–${popular.away_score}, backed by ${mgNum(popular.picks)} player${mgNum(popular.picks)===1?'':'s'}.`);
    if(f&&mgNum(st.home_count)!==mgNum(st.away_count)){
      const side=mgNum(st.home_count)>mgNum(st.away_count)?f.home_team:f.away_team;
      const n=Math.max(mgNum(st.home_count),mgNum(st.away_count));
      stats.push(`${side} has the stronger win vote with ${n} pick${n===1?'':'s'}.`);
    }
    if(!stats.length)return '';
    return `${mgEmoji('📊',s.emoji)}Prediction stat: ${mgPick(stats,5)}`;
  }

  const e=mgExacts(d);
  const avg=mgAverage(d);
  if(e.total>=0)stats.push(`${e.total} exact scores were recorded in this sample.`);
  if(avg>=0)stats.push(`The average return was ${avg} points per player.`);
  if(d.near.total)stats.push(`There were ${d.near.total} one-goal-from-exact predictions — plenty of almosts.`);
  if(d.exactParty?.exacts)stats.push(`${d.exactParty.home_team} v ${d.exactParty.away_team} produced ${d.exactParty.exacts} exact predictions.`);
  if(d.scope==='last6'&&d.sampleMatchweeks?.length){
    stats.push(`This form sample covers ${d.sampleMatchweeks.length} completed matchweek${d.sampleMatchweeks.length===1?'':'s'}: MW${d.sampleMatchweeks.join(', MW')}.`);
  }
  const zero=d.form.filter(x=>mgNum(x.points)===0&&mgNum(x.submitted)>0).length;
  if(zero)stats.push(`${zero} player${zero===1?'':'s'} scored zero across this sample.`);
  if(!stats.length)return '';
  return `${mgEmoji('📊',s.emoji)}Random stat: ${mgPick(stats,5)}`;
}

function mgUKTime(v){
  if(!v)return '';
  try{return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'
  }).format(new Date(v))}
  catch{return ''}
}
function mgPrePeriodMessage(s,d){
  const b=d.base||{},week=d.scope==='preweek';
  const label=week?'Matchweek '+mgNum(b.matchweek):mgDateLabel(b.selected_date);
  const fixtures=mgArr(b.fixtures).filter(x=>new Date(x.kickoff_at).getTime()>Date.now())
    .sort((a,b)=>new Date(a.kickoff_at)-new Date(b.kickoff_at));
  if(!fixtures.length)return 'No upcoming games in this selection. Choose another matchweek or matchday.';
  const first=mgArr(b.top_three)[0],second=mgArr(b.top_three)[1];
  const banter=s.tone==='banter',balanced=s.tone==='balanced';
  const short=s.length==='short',long=s.length==='long';
  const top=short?2:long?fixtures.length:Math.min(5,fixtures.length);
  const opening=week?[
    '⚽ *'+label+' — fresh fixtures, fresh excuses!*',
    '🔥 *'+label+' is approaching. Everyone is suddenly a football expert.*',
    '👀 *'+label+' — let the prediction mind games begin!*'
  ]:[
    '⚽ *'+label+' — matchday incoming!*',
    '🔥 *'+label+' — prediction receipts at the ready!*',
    '👀 *'+label+' — the football is nearly here!*'
  ];
  const output=[];
  output.push(banter?mgPick(opening,1):
    '*'+label+(week?' — pre-matchweek':' — pre-matchday')+' preview*');
  const joke=week?[
    'There are '+fixtures.length+' matches ahead and '+mgNum(b.players_count)+' supposed experts. This can only go well. 😂',
    'New round, same confident scorelines and apparently no lessons learned from last weekend. 😄',
    'Another week of bold calls, questionable 4–0 predictions and heroic excuses.'
  ]:[
    fixtures.length+' games on the menu. Expect confidence before kick-off and selective memories by full time. 😂',
    'The fixtures are lined up. All we need now is someone to confidently predict a 5–0. 😄',
    'Plenty of football ahead. The group chat should be an interesting place by full time.'
  ];
  output.push(banter?mgPick(joke,2):'We have '+fixtures.length+' upcoming '+
    (fixtures.length===1?'fixture':'fixtures')+'. Plenty to discuss before kick-off.');
  if(!short||s.detail==='high'){
    const upcoming=fixtures.slice(0,top).map(f=>
      '• '+f.home_team+' v '+f.away_team+' · '+mgDateLabel(f.kickoff_at)+' '+mgUKTime(f.kickoff_at));
    output.push((banter?'📋 *Matches to get excited about*':'📋 *Upcoming fixtures*')+'\n'+
      upcoming.join('\n')+(fixtures.length>top?'\n+ '+(fixtures.length-top)+' more in the app':''));
  }
  if(first&&(s.table||!short||s.focuses.includes('table'))){
    const gap=second?Math.max(0,mgNum(first.points)-mgNum(second.points)):0;
    const jibes=[
      mgName(first)+' leads the league on '+mgNum(first.points)+' points. '+
        (second?mgName(second)+' is '+gap+' point'+(gap===1?'':'s')+' behind.':'Who can catch them?')+
        ' The bragging rights are on borrowed time. 👀',
      mgName(first)+' is the one to beat right now. '+
        (second?'Can '+mgName(second)+' close the gap this round?':'Will someone finally catch up?'),
      mgName(first)+' is sitting pretty at the top with '+mgNum(first.points)+
        ' pts. Enjoy it while it lasts! 😂'
    ];
    output.push('🏆 *League rivalries*\n'+(banter?mgPick(jibes,3):
      mgArr(b.top_three).slice(0,3).map((p,i)=>(i+1)+'. '+mgName(p)+
        ' — '+mgNum(p.points)+' pts').join('\n')));
  }
  if(!short){
    const next=fixtures.find(f=>f.prediction_lock_at && new Date(f.prediction_lock_at)>new Date());
    if(next){
      output.push((banter?'⏰ *No “I forgot” excuses!*':'⏰ *Next prediction deadline*')+
        '\n'+mgDateLabel(next.prediction_lock_at)+' · '+mgUKTime(next.prediction_lock_at)+
        ' UK time ('+next.home_team+' v '+next.away_team+').');
    }else{
      output.push('⏰ Check the app for each game’s prediction deadline.');
    }
  }
  if(banter){
    const challenges=s.mood==='stir'?[
      '🎤 Who’s brave enough to call the upset, and who’s going to pretend it was obvious afterwards?',
      '👀 Which big talker will go quiet when the points start rolling in?',
      '😂 Predictions in early, excuses prepared later. Who’s calling a wild score?'
    ]:[
      '🎤 Who’s backing an upset this '+(week?'week':'matchday')+'?',
      '👀 Who’s your banker, and who’s about to drop a shocker?',
      '💬 Give us your bold call before the games start!'
    ];
    output.push(mgPick(challenges,4));
  }else if(balanced){
    output.push('💬 Any bold calls or surprises? Get the debate going.');
  }
  if(s.prompt){
    output.push('🎙️ *Talking point*\n'+String(s.prompt).replace(/\s+/g,' ').slice(0,180));
  }
  if(s.random&&long&&banter){
    output.push('🍀 The only guarantee? Someone will blame the referee for missing an exact score.');
  }
  if(s.link)output.push('📲 Make your predictions:\n'+MG_APP);
  let message=output.filter(Boolean).join('\n\n');
  if(s.emoji==='none')message=message.replace(/[⚽🌟🔥📈🚀📉🎯😬🍀🏆🧠🤦📊👀😂😄🔒🔮🥶📋⏰🎤💬🎙️]/gu,'').replace(/^\s+/gm,'');
  return message.trim();
}

function mgBuild(s,d){
  if(d.scope==='preweek'||d.scope==='preday')return mgPrePeriodMessage(s,d);
  mgSeed++;
  const focus=mgChooseFocus(s,d);
  const sections=[];
  sections.push(mgIntro(s,d));
  if(s.prompt)sections.push(mgPromptSection(s,d));

  if(d.scope==='prematch'){
    sections.push(mgPreMatchSection(s,d));
    if(s.random)sections.push(mgRandomStat(s,d));
    if(s.table)sections.push(mgTableSection(s,d));
  }else{
    if(focus.includes('performers'))sections.push(mgPerformersSection(s,d));
    if(focus.includes('bottom'))sections.push(mgBottomSection(s,d));
    if(focus.includes('movers'))sections.push(mgMoverSection(s,d));
    if(focus.includes('exacts'))sections.push(mgExactSection(s,d));
    if(focus.includes('unlucky'))sections.push(mgUnluckySection(s,d));
    if(focus.includes('form'))sections.push(mgFormSection(s,d));
    if(focus.includes('changes'))sections.push(mgChangeSection(s,d));
    if((focus.includes('table')||s.table))sections.push(mgTableSection(s,d));
    if(s.random)sections.push(mgRandomStat(s,d));
  }

  let clean=sections.filter(Boolean);

  if(s.detail==='low'){
    clean=clean.map((x,i)=>{
      if(i===0)return x;
      const lines=x.split('\n');
      return lines.slice(0,Math.min(lines.length,2)).join('\n');
    });
  }

  const maxSections=s.length==='short'?4:s.length==='medium'?7:10;
  clean=clean.slice(0,maxSections);

  if(s.tone==='banter'&&s.length!=='short'){
    const closers=d.scope==='week_so_far'&&mgNum(d.base?.upcoming_count)>0
      ?['Plenty still to play for. 👀','More matches to come — watch this space. 😄','Tomorrow could shake it all up.']
      :d.scope==='prematch'
      ?['Kickoff will settle the arguments. 👀','Receipts saved. Let the football decide. 😄','Somebody is going to look very clever in a couple of hours. 😂']
      :s.mood==='stir'
        ?['Same time next round. Bring better guesses. 😄','Screenshots are encouraged. Excuses are not. 😂','The table remembers everything. 👀']
        :['On to the next one. 👀','Plenty of football left. 😄','We go again.'];
    clean.push(mgPick(closers,7));
  }

  if(s.link)clean.push(`📲 Open the app:\n${MG_APP}`);

  let message=clean.join('\n\n');
  if(s.emoji==='none')message=message.replace(/[⚽🌟🔥📈🚀📉🎯😬🍀🏆🧠🤦📊👀😂😄🔒🔮🥶]/g,'').replace(/^\s+/gm,'');
  return message.trim();
}
function mgTitleFor(d){
  if(d.scope==='prematch'){
    const f=d.base?.selected_fixture;
    return f?`${f.home_team} v ${f.away_team} · Pre-match picks`:'Pre-match prediction analysis';
  }
  if(d.scope==='match'){
    const f=d.base?.selected_fixture;
    return f?`${f.home_team} v ${f.away_team} · Match analysis`:'Individual match analysis';
  }
  if(d.scope==='matchday')return `${mgDateLabel(d.base.selected_date)} · Day so far`;
  if(d.scope==='week_so_far')return 'Matchweek '+mgNum(d.base?.matchweek)+' · So far';
  if(d.scope==='preweek')return 'Matchweek '+mgNum(d.base?.matchweek)+' · Pre-match banter';
  if(d.scope==='preday')return mgDateLabel(d.base?.selected_date)+' · Pre-match banter';
  if(d.scope==='matchweek')return `Matchweek ${Number(d.base.matchweek||0)} · League update`;
  const n=d.sampleMatchweeks?.length||0;
  return `Current form · Last ${n||6} matchweek${n===1?'':'s'}`;
}

function mgFactsHtml(d){
  if(d.scope==='preweek'||d.scope==='preday'){
    return '<div class="mgPreviewFacts"><div class="mgFact"><b>'+mgNum(d.base?.upcoming_count)+'</b><span>Upcoming</span></div>'+ 
      '<div class="mgFact"><b>'+mgNum(d.base?.players_count)+'</b><span>Players</span></div>'+ 
      '<div class="mgFact"><b>'+mgNum(mgArr(d.base?.top_three)[0]?.points)+'</b><span>Leader pts</span></div></div>';
  }
  if(d.scope==='week_so_far'){
    return '<div class="mgPreviewFacts"><div class="mgFact"><b>'+mgNum(d.base?.completed_count)+'</b><span>Full time</span></div>'+ 
      '<div class="mgFact"><b>'+mgNum(d.base?.live_count)+'</b><span>Live</span></div>'+ 
      '<div class="mgFact"><b>'+mgNum(d.base?.upcoming_count)+'</b><span>Still to come</span></div></div>';
  }
  if(d.scope==='prematch'){
    const st=d.base?.prediction_stats||{};
    const top=mgArr(d.base?.popular_scores)[0];
    return `<div class="mgPreviewFacts">
      <div class="mgFact"><b>${mgNum(st.picks_count)}</b><span>Locked picks</span></div>
      <div class="mgFact"><b>${mgNum(st.unique_scorelines)}</b><span>Scorelines</span></div>
      <div class="mgFact"><b>${top?`${top.home_score}–${top.away_score}`:'—'}</b><span>Most popular</span></div>
    </div>`;
  }
  const e=mgExacts(d);
  const top=mgTopPerformers(d)[0];
  const third=d.scope==='matchday'
    ?mgNum(d.base?.day_total_fixtures)-mgNum(d.base?.day_scored_fixtures)
    :d.near.total;
  const thirdLabel=d.scope==='matchday'?'Still to come':'Near misses';
  return `<div class="mgPreviewFacts">
    <div class="mgFact"><b>${mgNum(top?.points)}</b><span>Top score</span></div>
    <div class="mgFact"><b>${e.total}</b><span>Exacts</span></div>
    <div class="mgFact"><b>${Math.max(0,third)}</b><span>${thirdLabel}</span></div>
  </div>`;
}
function mgToast(t){
  document.querySelector('.mgToast')?.remove();
  const e=document.createElement('div');e.className='mgToast';e.textContent=t;document.body.appendChild(e);
  setTimeout(()=>e.remove(),2200);
}

async function mgCopy(){
  const box=document.querySelector('.mgText');if(!box)return;
  try{await navigator.clipboard.writeText(box.value)}
  catch{
    const t=document.createElement('textarea');t.value=box.value;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();
  }
  mgToast('✓ Message copied');
}

async function mgWhatsApp(){
  const text=document.querySelector('.mgText')?.value?.trim();
  if(!text)return;
  const title=document.querySelector('.mgTitleInput')?.value?.trim()||mgLastTitle||'League update';
  // Open a blank tab synchronously so browsers don't block WhatsApp after
  // the asynchronous Home save. Never claim WhatsApp itself was sent.
  const opened=window.open('about:blank','_blank');
  if(opened)opened.opener=null;
  try{
    const c=await mgContext();
    const {error}=await mgSb.rpc('publish_owner_home_announcement',{
      p_league_id:c.leagueId,p_title:title,p_body:text,p_source_type:'owner_generator'
    });
    if(error)throw error;
    mgToast('✓ Message saved to Home and league history');
  }catch(e){
    mgToast('⚠ Could not add to Home: '+(e.message||'try Publish to Home'));
  }
  const url='https://wa.me/?text='+encodeURIComponent(text);
  if(opened&&!opened.closed)opened.location.replace(url);
  else location.href=url;
}

async function mgPublishHome(){
  const c=await mgContext();
  const title=document.querySelector('.mgTitleInput')?.value?.trim()||mgLastTitle;
  const body=document.querySelector('.mgText')?.value?.trim()||mgLastMessage;
  if(!body)return;
  const btn=document.querySelector('[data-mg-home]');
  if(btn){btn.disabled=true;btn.textContent='Publishing…'}
  try{
    const {error}=await mgSb.rpc('publish_owner_home_announcement',{
      p_league_id:c.leagueId,
      p_title:title,
      p_body:body,
      p_source_type:'owner_generator'
    });
    if(error)throw error;
    mgToast('✓ Added to Home and message history');
    if(btn)btn.textContent='✓ Added to Home';
  }catch(e){
    mgToast(e.message||'Could not publish to Home');
    if(btn){btn.disabled=false;btn.textContent='🏠 Publish to Home'}
  }
}

function mgWireChoices(){
  const o=document.querySelector('.mgOverlay');if(!o)return;
  for(const key of ['scope','length','tone','detail','mood','emoji']){
    o.querySelectorAll('[data-mg-'+key+']').forEach(b=>b.addEventListener('click',()=>{
      o.querySelectorAll('[data-mg-'+key+']').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      if(key==='scope')mgScopeChanged();
    }));
  }
  o.querySelectorAll('[data-mg-focus]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.mgFocus==='auto'){
      o.querySelectorAll('[data-mg-focus]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    }else{
      o.querySelector('[data-mg-focus="auto"]')?.classList.remove('active');
      b.classList.toggle('active');
      if(!o.querySelector('[data-mg-focus].active'))o.querySelector('[data-mg-focus="auto"]')?.classList.add('active');
    }
  }));
}

async function mgPopulateScopeSelectors(dayOverride=null){
  const o=document.querySelector('.mgOverlay');if(!o)return;
  const scope=o.querySelector('[data-mg-scope].active')?.dataset.mgScope||'matchday';
  const c=await mgContext();

  if(['week_so_far','preweek','preday'].includes(scope)){
    const weekSelect=o.querySelector('[data-mg-week]');
    const predaySelect=o.querySelector('[data-mg-preday]');
    const requestedDay=scope==='preday'?predaySelect?.value||null:null;
    const requestedWeek=scope!=='preday'?(Number(weekSelect?.value)||null):null;
    const {data,error}=await mgSb.rpc('get_owner_message_story_period',{
      p_league_id:c.leagueId,p_mode:scope,
      p_day:requestedDay,p_matchweek:requestedWeek
    });
    if(error)throw error;
    if(scope==='preday'){
      const days=mgArr(data?.available_days).filter(x=>mgNum(x.upcoming_count)>0);
      const picked=days.some(x=>x.date===requestedDay)?requestedDay:data?.selected_date;
      predaySelect.innerHTML=days.map(x=>
        '<option value="'+mgEsc(x.date)+'" '+(String(x.date)===String(picked)?'selected':'')+'>'+
        mgEsc(mgDateLabel(x.date))+' · '+mgNum(x.upcoming_count)+' upcoming</option>'
      ).join('')||'<option value="">No upcoming dates</option>';
    }else{
      const weeks=mgArr(data?.available_weeks);
      const options=scope==='preweek'
        ?weeks.filter(x=>mgNum(x.upcoming_count)>0)
        :weeks.filter(x=>mgNum(x.completed_count)+mgNum(x.upcoming_count)>0);
      const nextFresh=options.find(x=>mgNum(x.completed_count)===0 &&
        mgNum(x.upcoming_count)===mgNum(x.fixtures_count));
      const preferred=options.some(x=>mgNum(x.matchweek)===requestedWeek)?requestedWeek:
        scope==='preweek'?(nextFresh?.matchweek||data?.matchweek):data?.matchweek;
      weekSelect.innerHTML=options.map(x=>
        '<option value="'+mgNum(x.matchweek)+'" '+(mgNum(x.matchweek)===mgNum(preferred)?'selected':'')+'>'+
        'Matchweek '+mgNum(x.matchweek)+' · '+mgNum(x.completed_count)+' finished · '+
        mgNum(x.upcoming_count)+' upcoming</option>'
      ).join('')||'<option value="">No matchweeks available</option>';
    }
    return;
  }

  if(scope==='matchday'||scope==='match'){
    const rawDay=dayOverride||o.querySelector('[data-mg-day]')?.value||'';
    const currentDay=/^\d{4}-\d{2}-\d{2}$/.test(String(rawDay))?String(rawDay):null;
    const {data,error}=await mgSb.rpc('get_owner_message_scope',{
      p_league_id:c.leagueId,p_day:currentDay,p_fixture_id:null
    });
    if(error)throw error;
    const days=mgArr(data?.available_days);
    const daySelect=o.querySelector('[data-mg-day]');
    const selected=String(data?.selected_date||currentDay||'');
    daySelect.innerHTML=days.map(x=>`<option value="${mgEsc(x.date)}" ${String(x.date)===selected?'selected':''}>${mgEsc(mgDateLabel(x.date))} · ${mgNum(x.fixtures_count)} match${mgNum(x.fixtures_count)===1?'':'es'}</option>`).join('');

    if(scope==='match'){
      const matchSelect=o.querySelector('[data-mg-match]');
      const fixtures=mgArr(data?.fixtures);
      matchSelect.innerHTML=fixtures.length?fixtures.map(x=>{
        const has=x.home_score!=null&&x.away_score!=null;
        const state=has?`${x.home_score}–${x.away_score}`:(x.score_state==='pending'?'Not started':x.score_state||'Awaiting score');
        return `<option value="${mgEsc(x.fixture_id)}">${mgEsc(x.home_team)} v ${mgEsc(x.away_team)} · ${mgEsc(state)}</option>`;
      }).join(''):'<option value="">No matches on this day</option>';
    }
    return;
  }

  if(scope==='prematch'){
    const {data,error}=await mgSb.rpc('get_owner_pre_match_analysis',{
      p_league_id:c.leagueId,p_fixture_id:null
    });
    if(error)throw error;
    const select=o.querySelector('[data-mg-prematch]');
    const fixtures=mgArr(data?.available_fixtures);
    select.innerHTML=fixtures.length?fixtures.map(x=>`<option value="${mgEsc(x.fixture_id)}">${mgEsc(x.home_team)} v ${mgEsc(x.away_team)} · MW${mgNum(x.matchweek)}</option>`).join(''):'<option value="">No locked upcoming fixtures yet</option>';
  }
}

async function mgScopeChanged(){
  const o=document.querySelector('.mgOverlay');if(!o)return;
  const scope=o.querySelector('[data-mg-scope].active')?.dataset.mgScope||'matchday';
  const dayWrap=o.querySelector('.mgDayWrap');
  const matchWrap=o.querySelector('.mgMatchWrap');
  const preWrap=o.querySelector('.mgPreMatchWrap');
  dayWrap.style.display=(scope==='matchday'||scope==='match')?'block':'none';
  matchWrap.style.display=scope==='match'?'block':'none';
  preWrap.style.display=scope==='prematch'?'block':'none';
  mgData=null;
  try{
    await mgPopulateScopeSelectors();
  }catch(e){
    console.warn('Message Generator scope:',e);
    if(dayWrap.style.display!=='none'){
      const s=o.querySelector('[data-mg-day]');
      if(s)s.innerHTML='<option value="">Could not load days — tap scope again</option>';
    }
    if(matchWrap.style.display!=='none'){
      const s=o.querySelector('[data-mg-match]');
      if(s)s.innerHTML='<option value="">Could not load matches</option>';
    }
    if(preWrap.style.display!=='none'){
      const s=o.querySelector('[data-mg-prematch]');
      if(s)s.innerHTML='<option value="">Could not load locked fixtures</option>';
    }
  }
}

async function mgGenerate(regen=false){
  if(mgBusy)return;
  const o=document.querySelector('.mgOverlay');if(!o)return;
  const btn=o.querySelector('[data-mg-generate]');
  const s=mgSettings();
  const day=(s.scope==='matchday'||s.scope==='match')?o.querySelector('[data-mg-day]')?.value||null:null;
  const fixture=s.scope==='match'
    ?o.querySelector('[data-mg-match]')?.value||null
    :s.scope==='prematch'
      ?o.querySelector('[data-mg-prematch]')?.value||null
      :null;
  if((s.scope==='match'||s.scope==='prematch')&&!fixture){mgToast('Choose a match first');return}
  mgBusy=true;
  if(btn){btn.disabled=true;btn.textContent='Building from league data…'}
  try{
    if(!mgData||mgData.scope!==s.scope||regen===false){
      mgData=await mgLoad(s.scope,day,fixture);
    }
    const out=mgBuild(s,mgData);
    mgLastTitle=mgTitleFor(mgData);mgLastMessage=out;
    const panel=o.querySelector('.mgOutput');
    panel.classList.add('ready');
    panel.querySelector('.mgFactsHost').innerHTML=mgFactsHtml(mgData);
    panel.querySelector('.mgTitleInput').value=mgLastTitle;
    panel.querySelector('.mgText').value=out;
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    console.warn('Message Generator:',e);
    mgToast(e.message||'Could not build message');
  }finally{
    mgBusy=false;
    if(btn){btn.disabled=false;btn.textContent='✨ Generate message'}
  }
}
async function mgOpen(){
  try{await mgContext()}catch(e){mgToast(e.message||'Owner only');return}
  document.querySelector('.mgOverlay')?.remove();
  mgData=null;mgSeed=Date.now()%997;
  const o=document.createElement('div');
  o.className='mgOverlay';
  o.innerHTML=`<div class="mgShell">
    <div class="mgHead"><div class="mgHeadTop">
      <div><div class="mgEyebrow">League owner · communications</div><div class="mgTitle">Message Generator</div>
      <div class="mgSub">Individual match · day so far · pre-match prediction analysis · matchweek · form. Nothing is sent automatically.</div></div>
      <button type="button" class="mgClose">✕</button>
    </div></div>

    <div class="mgBody">
      <div class="mgPanel">
        <div class="mgPanelHead"><h2>1 · What are we talking about?</h2><span>Scope</span></div>
        <div class="mgChoices">
          <button class="mgChoice" data-mg-scope="match">⚽ Individual match</button>
          <button class="mgChoice active" data-mg-scope="matchday">📅 Day so far</button>
          <button class="mgChoice" data-mg-scope="prematch">🔒 Pre-match</button>
          <button class="mgChoice" data-mg-scope="matchweek">Match week</button>
          <button class="mgChoice" data-mg-scope="last6">Last 6 game weeks · form</button>
        </div>
        <div class="mgDayWrap"><div class="mgLabel">Day</div><select class="mgSelect" data-mg-day><option value="">Loading…</option></select></div>
        <div class="mgMatchWrap" style="display:none"><div class="mgLabel">Match</div><select class="mgSelect" data-mg-match><option value="">Choose a day first</option></select></div>
        <div class="mgPreMatchWrap" style="display:none"><div class="mgLabel">Locked fixture</div><select class="mgSelect" data-mg-prematch><option value="">Loading…</option></select><div class="mgHint">Pre-match analysis uses sealed predictions after the 4-hour lock and before kickoff.</div></div>
      </div>

      <div class="mgPanel">
        <div class="mgPanelHead"><h2>2 · Shape the message</h2><span>Length & tone</span></div>
        <div class="mgLabel">Length</div>
        <div class="mgChoices">
          <button class="mgChoice" data-mg-length="short">Short</button>
          <button class="mgChoice active" data-mg-length="medium">Medium</button>
          <button class="mgChoice" data-mg-length="long">Long</button>
        </div>
        <div class="mgLabel">Tone</div>
        <div class="mgChoices">
          <button class="mgChoice active" data-mg-tone="banter">Fun & banter</button>
          <button class="mgChoice" data-mg-tone="balanced">Medium seriousness</button>
          <button class="mgChoice" data-mg-tone="serious">Serious</button>
        </div>
        <div class="mgLabel">Stat detail</div>
        <div class="mgChoices">
          <button class="mgChoice" data-mg-detail="low">Low</button>
          <button class="mgChoice active" data-mg-detail="medium">Medium</button>
          <button class="mgChoice" data-mg-detail="high">High</button>
        </div>
        <div class="mgLabel">Mood</div>
        <div class="mgChoices">
          <button class="mgChoice" data-mg-mood="celebrate">Celebrate</button>
          <button class="mgChoice active" data-mg-mood="balanced">Balanced</button>
          <button class="mgChoice" data-mg-mood="stir">Stir the pot 😄</button>
        </div>
      </div>

      <div class="mgPanel">
        <div class="mgPanelHead"><h2>3 · What should it focus on?</h2><span>Select several</span></div>
        <div class="mgChoices">
          <button class="mgChoice focus active" data-mg-focus="auto">✨ Auto pick stories</button>
          <button class="mgChoice focus" data-mg-focus="performers">🏅 Best performers</button>
          <button class="mgChoice focus" data-mg-focus="movers">📈 Biggest movers</button>
          <button class="mgChoice focus" data-mg-focus="unlucky">😬 Most unlucky</button>
          <button class="mgChoice focus" data-mg-focus="exacts">🎯 Exact heroes</button>
          <button class="mgChoice focus" data-mg-focus="form">🔥 Current form</button>
          <button class="mgChoice focus" data-mg-focus="table">🏆 Table battle</button>
          <button class="mgChoice focus" data-mg-focus="changes">🧠 Prediction changes</button>
        </div>

        <div class="mgLabel">Emoji level</div>
        <div class="mgChoices">
          <button class="mgChoice" data-mg-emoji="none">None</button>
          <button class="mgChoice active" data-mg-emoji="light">Light</button>
          <button class="mgChoice" data-mg-emoji="full">Full</button>
        </div>

        <div class="mgLabel">Extras</div>
        <div class="mgToggleGrid">
          <label class="mgToggle"><input type="checkbox" data-mg-extra="top-earners" checked> Top points earners</label>
          <label class="mgToggle"><input type="checkbox" data-mg-extra="bottom-earners"> Lowest points earners</label>
          <label class="mgToggle"><input type="checkbox" data-mg-extra="table" checked> Include top 3</label>
          <label class="mgToggle"><input type="checkbox" data-mg-extra="random" checked> Add random stat</label>
          <label class="mgToggle"><input type="checkbox" data-mg-extra="link" checked> Add app link</label>
        </div>

      </div>

      <div class="mgPanel">
        <div class="mgPanelHead"><h2>4 · Give it a steer</h2><span>Optional talking points</span></div>
        <textarea class="mgPrompt" data-mg-prompt placeholder="Type an instruction or just buzz words…&#10;&#10;Examples:&#10;Reference the international break so no matches for a while&#10;Fired blanks, biggest mover, dropping like flies"></textarea>
        <div class="mgHint">The generator will use recognised ideas to choose the right league facts and weave them into the selected tone. You can use a sentence or just a few phrases.</div>
        <button class="mgGenerate" data-mg-generate>✨ Generate message</button>
      </div>

      <div class="mgPanel mgOutput">
        <div class="mgPanelHead"><h2>Generated message</h2><span>Edit anything before sharing</span></div>
        <div class="mgFactsHost"></div>
        <div class="mgLabel">Home feed title</div>
        <input class="mgTitleInput" aria-label="Home message title">
        <textarea class="mgText" aria-label="Generated league message"></textarea>
        <div class="mgActions">
          <button class="mgBtn regen" data-mg-regen>↻ Generate again</button>
          <button class="mgBtn copy" data-mg-copy>Copy</button>
          <button class="mgBtn wa" data-mg-wa>📲 WhatsApp + Home</button>
          <button class="mgBtn home" data-mg-home>🏠 Publish to Home</button>
        </div>
        <div class="mgFoot">WhatsApp + Home publishes your exact edited message to the league feed, then opens WhatsApp to share it. Published reports remain available in the message history until removed.</div>
      </div>
    </div>
  </div>`;
  document.body.appendChild(o);
  document.body.style.overflow='hidden';
  o.querySelector('.mgClose').onclick=()=>{o.remove();document.body.style.overflow=''};
  mgWireChoices();
  o.querySelector('[data-mg-generate]').onclick=()=>mgGenerate(false);
  o.querySelector('[data-mg-regen]').onclick=()=>mgGenerate(true);
  o.querySelector('[data-mg-copy]').onclick=mgCopy;
  o.querySelector('[data-mg-wa]').onclick=mgWhatsApp;
  o.querySelector('[data-mg-home]').onclick=mgPublishHome;
  o.querySelector('[data-mg-day]').addEventListener('change',async e=>{
    mgData=null;
    const scope=o.querySelector('[data-mg-scope].active')?.dataset.mgScope;
    if(scope==='match'){try{await mgPopulateScopeSelectors(e.target.value)}catch(err){console.warn(err)}}
  });
  o.querySelector('[data-mg-match]').addEventListener('change',()=>{mgData=null});
  o.querySelector('[data-mg-prematch]').addEventListener('change',()=>{mgData=null});
  await mgScopeChanged();
}

mgCss();
window.openPLPMessageGenerator=mgOpen;
