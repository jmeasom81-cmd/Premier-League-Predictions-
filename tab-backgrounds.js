import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sbTabs = createClient(
  'https://jzrbaeyvwagrwukntjbk.supabase.co',
  'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8'
);

const VALID_TABS = ['home','predict','table','stats','ai','chat','more'];
const backgrounds = new Map();
let activeTab = 'home';

function addStyles(){
  if(document.getElementById('plp-tab-photo-css')) return;
  const s=document.createElement('style');
  s.id='plp-tab-photo-css';
  s.textContent=`
    body.clubBgOn::before{display:none!important}
    .plpTabPhotoLayer,.plpClubCrestLayer{position:fixed;inset:0;pointer-events:none;z-index:0;transform:translateZ(0)}
    .plpTabPhotoLayer{background-repeat:no-repeat;background-size:cover;background-position:center center;opacity:.30;filter:saturate(.9) contrast(.96);transition:background-image .22s ease-out}
    .plpClubCrestLayer{background-image:var(--club-crest);background-repeat:no-repeat;background-position:center 59%;background-size:min(124vw,880px);opacity:.12;filter:saturate(.75) contrast(.95)}
    body>.app{position:relative!important;z-index:1!important;background:rgba(246,246,251,.46)!important;min-height:100vh}
    body.clubBgOn header::before{width:260px!important;height:260px!important;right:-48px!important;bottom:-56px!important;opacity:.18!important}
    #plp-match-centre.mcOverlay{background:rgba(246,246,251,.70)!important}
    #plp-match-centre .mcShell{position:relative;z-index:1}
    @media(max-width:520px){
      .plpTabPhotoLayer{opacity:.27}
      .plpClubCrestLayer{background-size:140vw;background-position:center 62%;opacity:.11}
      body>.app{background:rgba(246,246,251,.43)!important}
      body.clubBgOn header::before{width:220px!important;height:220px!important;right:-40px!important;bottom:-46px!important}
    }
  `;
  document.head.appendChild(s);
}

function ensureLayers(){
  let photo=document.getElementById('plp-tab-photo-layer');
  if(!photo){
    photo=document.createElement('div');
    photo.id='plp-tab-photo-layer';
    photo.className='plpTabPhotoLayer';
    document.body.insertBefore(photo,document.body.firstChild);
  }
  let crest=document.getElementById('plp-club-crest-layer');
  if(!crest){
    crest=document.createElement('div');
    crest.id='plp-club-crest-layer';
    crest.className='plpClubCrestLayer';
    photo.after(crest);
  }
  return {photo,crest};
}

function tabFrom(raw){
  const t=String(raw||'').toLowerCase().replace(/[^a-z]/g,'');
  if(t.startsWith('home')) return 'home';
  if(t.startsWith('predict')) return 'predict';
  if(t.startsWith('table')) return 'table';
  if(t.startsWith('stats')) return 'stats';
  if(t==='ai'||t.startsWith('expectedgoals')) return 'ai';
  if(t.startsWith('chat')) return 'chat';
  if(t.startsWith('more')||t.startsWith('history')||t.startsWith('admin')||t.startsWith('profile')) return 'more';
  return null;
}

function inferTab(){
  const active=[...document.querySelectorAll('nav .active,.nav .active,.bottomNav .active,[aria-current="page"],button.active,a.active')];
  for(const el of active){
    const tab=tabFrom(el.textContent||el.getAttribute('aria-label'));
    if(tab) return tab;
  }
  const text=(document.getElementById('main')?.innerText||'').slice(0,550).toLowerCase();
  if(text.includes('expected goals fc')||text.includes('managed by chatgpt')) return 'ai';
  if(text.includes('league table')) return 'table';
  if(text.includes('statistics')||text.includes('stats dashboard')||text.includes('point efficiency')) return 'stats';
  if(text.includes('league chat')||text.includes('chat room')) return 'chat';
  if(text.includes('your predictions')||text.includes('enter your score')) return 'predict';
  if(text.includes('notice board')||text.includes('prediction status')) return 'home';
  if(text.includes('admin')||text.includes('history')) return 'more';
  return activeTab;
}

function applyTab(tab){
  if(!VALID_TABS.includes(tab)) return;
  activeTab=tab;
  const row=backgrounds.get(tab);
  const {photo}=ensureLayers();
  if(!row){ photo.style.backgroundImage='none'; return; }
  photo.style.backgroundImage=`linear-gradient(rgba(246,246,251,.08),rgba(246,246,251,.18)),url("${row.data_uri}")`;
  photo.style.backgroundPosition=`center center, ${row.position||'center center'}`;
  photo.style.backgroundSize='cover, cover';
  document.body.dataset.photoTab=tab;
}

async function loadBackgrounds(){
  try{
    const {data,error}=await sbTabs.from('tab_backgrounds').select('tab_key,data_uri,position');
    if(error) throw error;
    for(const row of data||[]) backgrounds.set(row.tab_key,row);
    applyTab(inferTab()||'home');
  }catch(e){ console.warn('Tab photo backgrounds:',e); }
}

function hookTabs(){
  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a');
    if(!el) return;
    const tab=tabFrom(el.textContent||el.getAttribute('aria-label'));
    if(tab) setTimeout(()=>applyTab(tab),45);
  },true);

  const main=document.getElementById('main');
  if(main) new MutationObserver(()=>{
    clearTimeout(hookTabs.t);
    hookTabs.t=setTimeout(()=>{
      const tab=inferTab();
      if(tab!==activeTab) applyTab(tab);
    },90);
  }).observe(main,{childList:true,subtree:true});

  window.addEventListener('focus',()=>applyTab(inferTab()||activeTab));
}

addStyles();
ensureLayers();
hookTabs();
loadBackgrounds();
