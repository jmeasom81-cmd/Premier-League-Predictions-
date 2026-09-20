// UI CLEANUP V1
// Compact Home + consolidate owner/admin tools in the More tab.

(function(){
  let timer=null;

  function addCss(){
    if(document.getElementById('uc-v1-css'))return;
    const s=document.createElement('style');
    s.id='uc-v1-css';
    s.textContent=`
      /* Home */
      .hmCard .hmMsg:not(.private) .hmBody{
        display:-webkit-box!important;-webkit-box-orient:vertical;
        -webkit-line-clamp:3;overflow:hidden
      }
      .hmCard .hmMsg:not(.private) details[open] .hmBody{
        display:block!important;-webkit-line-clamp:unset;overflow:visible
      }
      .forecastHomeCard{padding:12px!important}
      .forecastHomeCard .forecastHomeText{
        margin:6px 0 8px!important;display:-webkit-box;
        -webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden
      }
      .forecastHomeCard .forecastHomeChips{display:none!important}

      .ucNoticeSummary{
        display:flex;justify-content:space-between;gap:10px;align-items:center;
        background:#f5f3f8;border-radius:12px;padding:10px 11px;margin-top:8px
      }
      .ucNoticeSummary b{font-size:10px;color:#302944}
      .ucNoticeSummary small{display:block;font-size:7.5px;color:#817b89;margin-top:2px}
      .ucNoticeSummary button{
        border:0;border-radius:9px;padding:7px 9px;background:#eee8f7;
        color:#58379a;font-size:8px;font-weight:950
      }
      .ucStaticNoticeHidden{display:none!important}

      /* More / owner */
      .ucOwnerHub{
        border-color:#d9cfee!important;
        background:linear-gradient(145deg,#f9f7ff,#fff)!important
      }
      .ucOwnerTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
      .ucOwnerTop h2{margin:0;font-size:16px;color:#241153}
      .ucOwnerTop p{margin:4px 0 0;font-size:8.5px;color:#756f7d;line-height:1.4}
      .ucOwnerTag{
        border-radius:999px;padding:5px 7px;background:#eee7ff;color:#5c38a5;
        font-size:7px;font-weight:950;text-transform:uppercase;white-space:nowrap
      }
      .ucGroup{margin-top:12px}
      .ucGroupTitle{
        font-size:8px;font-weight:950;color:#817a8d;text-transform:uppercase;
        letter-spacing:.08em;margin-bottom:6px
      }
      .ucToolGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .ucTool{
        border:1px solid #e3deeb;border-radius:11px;background:#fff;
        padding:9px 8px;text-align:left;color:#342c43;min-height:52px
      }
      .ucTool b{display:block;font-size:9.5px}
      .ucTool span{display:block;font-size:7px;color:#8a8492;margin-top:2px;line-height:1.25}
      .ucTool.comm{background:#f4fbf8;border-color:#d5ece2}
      .ucTool.insight{background:#f7f3ff;border-color:#e2d8f5}
      .ucTool.control{background:#faf8f4;border-color:#ece5d7}

      .engAdminCard.ucSourceHidden,
      .waAdminCard.ucSourceHidden,
      .wrAdminCard.ucSourceHidden,
      .drAdminCard.ucSourceHidden,
      .pcAdminCard.ucSourceHidden{display:none!important}

      .ucAdvancedHidden{display:none!important}
      .ucAdvancedOpen{display:block!important}

      .ucVerifiedHidden{display:none!important}
      .ucVerifySummary{
        display:flex;justify-content:space-between;gap:8px;align-items:center;
        background:#f5f4f8;border-radius:10px;padding:8px 9px;margin:8px 0
      }
      .ucVerifySummary span{font-size:8px;color:#716b7d}
      .ucVerifySummary button{
        border:0;border-radius:8px;background:#ece8f4;color:#563895;
        padding:6px 8px;font-size:7.5px;font-weight:950
      }
    `;
    document.head.appendChild(s);
  }

  function homeActive(){
    return !!document.querySelector('#nav button[data-v="home"].active');
  }

  function moreActive(){
    return !!document.querySelector('#nav button[data-v="more"].active');
  }

  function cardByHeading(text){
    return [...document.querySelectorAll('#main .card')].find(card=>{
      const h=card.querySelector('.section h2,h2');
      return h && (h.textContent||'').includes(text);
    })||null;
  }

  function tidyHome(){
    if(!homeActive())return;
    const notice=cardByHeading('Notice Board');
    if(!notice)return;

    const staticNotices=[...notice.children].filter(el=>
      el.classList?.contains('noticebox') &&
      !el.classList.contains('forecastNotice')
    );
    if(!staticNotices.length)return;

    let summary=notice.querySelector('.ucNoticeSummary');
    if(!summary){
      summary=document.createElement('div');
      summary.className='ucNoticeSummary';
      summary.innerHTML=`
        <div><b>League rules & info</b><small>${staticNotices.length} permanent notice${staticNotices.length===1?'':'s'}</small></div>
        <button type="button">View info</button>
      `;
      const section=notice.querySelector('.section');
      if(section)section.insertAdjacentElement('afterend',summary);
      else notice.prepend(summary);

      summary.querySelector('button').onclick=()=>{
        const open=summary.dataset.open==='1';
        summary.dataset.open=open?'0':'1';
        staticNotices.forEach(n=>n.classList.toggle('ucStaticNoticeHidden',open));
        summary.querySelector('button').textContent=open?'View info':'Hide info';
      };
    }

    if(summary.dataset.open!=='1'){
      staticNotices.forEach(n=>n.classList.add('ucStaticNoticeHidden'));
    }
  }

  function clickOriginal(selector){
    const el=document.querySelector(selector);
    if(el){el.click();return true}
    return false;
  }

  function tool(key,title,sub,cls){
    return `<button type="button" class="ucTool ${cls||''}" data-uc-tool="${key}">
      <b>${title}</b><span>${sub}</span>
    </button>`;
  }

  function toggleAdvanced(card,button){
    if(!card)return;
    const opening=!card.classList.contains('ucAdvancedOpen');
    card.classList.toggle('ucAdvancedOpen',opening);
    card.classList.toggle('ucAdvancedHidden',!opening);
    if(button){
      const b=button.querySelector('b');
      if(b)b.textContent=opening?'↩ Hide section':button.dataset.title;
    }
    if(opening)setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'start'}),60);
  }

  function compactVerification(card){
    if(!card)return;

    const rows=[...card.querySelectorAll('.person')];
    const verified=rows.filter(r=>(r.textContent||'').includes('✅ Verified'));
    const awaiting=rows.filter(r=>(r.textContent||'').includes('⚠️ Awaiting'));

    verified.forEach(r=>r.classList.add('ucVerifiedHidden'));

    if(!verified.length || card.querySelector('.ucVerifySummary'))return;

    const box=document.createElement('div');
    box.className='ucVerifySummary';
    box.innerHTML=`<span><b>${awaiting.length}</b> awaiting · ${verified.length} verified hidden</span><button type="button">Show verified</button>`;
    const notice=card.querySelector(':scope > .notice');
    if(notice)notice.insertAdjacentElement('afterend',box);
    else card.prepend(box);

    box.querySelector('button').onclick=()=>{
      const open=box.dataset.open==='1';
      box.dataset.open=open?'0':'1';
      verified.forEach(r=>r.classList.toggle('ucVerifiedHidden',open));
      box.querySelector('button').textContent=open?'Show verified':'Hide verified';
    };
  }

  function buildOwnerHub(){
    if(!moreActive())return;
    const main=document.getElementById('main');
    if(!main)return;

    const injected={
      engagement:main.querySelector('.engAdminCard'),
      reminder:main.querySelector('.waAdminCard'),
      review:main.querySelector('.wrAdminCard'),
      daily:main.querySelector('.drAdminCard'),
      changes:main.querySelector('.pcAdminCard')
    };
    if(!Object.values(injected).some(Boolean))return;

    Object.values(injected).forEach(el=>el?.classList.add('ucSourceHidden'));

    const verification=cardByHeading('Results verification');
    const coverage=cardByHeading('Reminder coverage');
    const manual=cardByHeading('Admin · Results');
    const backup=cardByHeading('Season Backup');
    const notice=cardByHeading('Admin · Notice');

    [verification,coverage,manual,backup,notice].forEach(card=>{
      if(card && !card.classList.contains('ucAdvancedOpen'))card.classList.add('ucAdvancedHidden');
    });
    compactVerification(verification);

    let hub=main.querySelector('.ucOwnerHub');
    if(!hub){
      hub=document.createElement('div');
      hub.className='card ucOwnerHub';
      hub.innerHTML=`
        <div class="ucOwnerTop">
          <div><h2>🛠️ Owner tools</h2><p>Private league controls grouped in one place.</p></div>
          <span class="ucOwnerTag">Only you</span>
        </div>

        <div class="ucGroup">
          <div class="ucGroupTitle">Communications</div>
          <div class="ucToolGrid">
            ${tool('reminder','📲 Outstanding picks','Create reminder message','comm')}
            ${tool('daily','📣 Daily recap','Today’s league roundup','comm')}
            ${tool('review','📰 Matchweek review','Weekly winners & movers','comm')}
          </div>
        </div>

        <div class="ucGroup">
          <div class="ucGroupTitle">Insights</div>
          <div class="ucToolGrid">
            ${tool('engagement','📈 Engagement','Who is using the app','insight')}
            ${tool('changes','🧠 Prediction changes','Did changing picks help?','insight')}
          </div>
        </div>

        <div class="ucGroup">
          <div class="ucGroupTitle">Controls & maintenance</div>
          <div class="ucToolGrid">
            ${tool('verify','🛡️ Results check','Only items needing attention','control')}
            ${tool('coverage','🔔 Reminder coverage','Who has notifications enabled','control')}
            ${tool('manual','🧯 Manual result rescue','Emergency override only','control')}
            ${tool('backup','📦 Season backup','Download recovery copy','control')}
            ${tool('notice','📌 Post notice','League Notice Board update','control')}
          </div>
        </div>
      `;

      const profile=cardByHeading('Your profile');
      if(profile)profile.insertAdjacentElement('afterend',hub);
      else main.prepend(hub);
    }

    const direct={
      reminder:()=>clickOriginal('.waAdminCard [data-wa-open]'),
      daily:()=>clickOriginal('.drAdminCard [data-dr-open]'),
      review:()=>clickOriginal('.wrAdminCard [data-wr-open]'),
      engagement:()=>clickOriginal('.engAdminCard [data-eng-open]'),
      changes:()=>clickOriginal('.pcAdminCard [data-pc-open]')
    };

    Object.entries(direct).forEach(([key,fn])=>{
      const b=hub.querySelector(`[data-uc-tool="${key}"]`);
      if(b&&!b.dataset.wired){b.dataset.wired='1';b.onclick=fn}
    });

    const advanced={verify:verification,coverage,manual,backup,notice};
    Object.entries(advanced).forEach(([key,card])=>{
      const b=hub.querySelector(`[data-uc-tool="${key}"]`);
      if(!b||!card||b.dataset.wired)return;
      b.dataset.wired='1';
      b.dataset.title=b.querySelector('b')?.textContent||'Open';
      b.onclick=()=>toggleAdvanced(card,b);
    });
  }

  function run(){
    addCss();
    tidyHome();
    buildOwnerHub();
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(run,130);
  }

  addCss();
  setTimeout(run,700);

  const main=document.getElementById('main');
  if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});

  const nav=document.getElementById('nav');
  if(nav)new MutationObserver(schedule).observe(nav,{
    childList:true,subtree:true,attributes:true,attributeFilter:['class','style']
  });

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#nav button'))setTimeout(run,150);
  },true);

  setInterval(run,2500);
})();
