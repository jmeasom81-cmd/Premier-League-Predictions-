import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CLUB_BG_URL = 'https://jzrbaeyvwagrwukntjbk.supabase.co';
const CLUB_BG_KEY = 'sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8';
const clubBgSb = createClient(CLUB_BG_URL, CLUB_BG_KEY);

const CLUBS = [
  { key:'arsenal', label:'Arsenal', domain:'arsenal.com', aliases:['arsenal','gunners'] },
  { key:'aston-villa', label:'Aston Villa', domain:'avfc.co.uk', aliases:['aston villa','villa','avfc'] },
  { key:'bournemouth', label:'Bournemouth', domain:'afcb.co.uk', aliases:['bournemouth','afc bournemouth','afcb'] },
  { key:'brentford', label:'Brentford', domain:'brentfordfc.com', aliases:['brentford'] },
  { key:'brighton', label:'Brighton', domain:'brightonandhovealbion.com', aliases:['brighton','brighton and hove albion','bha'] },
  { key:'burnley', label:'Burnley', domain:'burnleyfootballclub.com', aliases:['burnley'] },
  { key:'chelsea', label:'Chelsea', domain:'chelseafc.com', aliases:['chelsea','cfc'] },
  { key:'coventry', label:'Coventry City', domain:'ccfc.co.uk', aliases:['coventry','coventry city','ccfc'] },
  { key:'crystal-palace', label:'Crystal Palace', domain:'cpfc.co.uk', aliases:['crystal palace','palace','cpfc'] },
  { key:'everton', label:'Everton', domain:'evertonfc.com', aliases:['everton','efc'] },
  { key:'fulham', label:'Fulham', domain:'fulhamfc.com', aliases:['fulham'] },
  { key:'hull', label:'Hull City', domain:'wearehullcity.co.uk', aliases:['hull','hull city','hull city afc'] },
  { key:'ipswich', label:'Ipswich Town', domain:'itfc.co.uk', aliases:['ipswich','ipswich town','itfc'] },
  { key:'leeds', label:'Leeds United', domain:'leedsunited.com', aliases:['leeds','leeds united','lufc'] },
  { key:'leicester', label:'Leicester City', domain:'lcfc.com', aliases:['leicester','leicester city','lcfc','foxes'] },
  { key:'liverpool', label:'Liverpool', domain:'liverpoolfc.com', aliases:['liverpool','lfc'] },
  { key:'man-city', label:'Manchester City', domain:'mancity.com', aliases:['manchester city','man city','mcfc'] },
  { key:'man-utd', label:'Manchester United', domain:'manutd.com', aliases:['manchester united','man united','man utd','man u','mufc'] },
  { key:'motherwell', label:'Motherwell', domain:'motherwellfc.co.uk', aliases:['motherwell','motherwell fc'] },
  { key:'newcastle', label:'Newcastle United', domain:'nufc.co.uk', aliases:['newcastle','newcastle united','nufc'] },
  { key:'norwich', label:'Norwich City', domain:'canaries.co.uk', aliases:['norwich','norwich city','canaries','ncfc'] },
  { key:'nottingham-forest', label:'Nottingham Forest', domain:'nottinghamforest.co.uk', aliases:['nottingham forest','nottm forest','forest','nffc'] },
  { key:'sheffield-wednesday', label:'Sheffield Wednesday', domain:'swfc.co.uk', aliases:['sheffield wednesday','sheff wednesday','sheff wed','wednesday','swfc','owls'] },
  { key:'sunderland', label:'Sunderland', domain:'safc.com', aliases:['sunderland','safc'] },
  { key:'tottenham', label:'Tottenham Hotspur', domain:'tottenhamhotspur.com', aliases:['tottenham','tottenham hotspur','spurs','coys','thfc'] },
  { key:'west-ham', label:'West Ham United', domain:'whufc.com', aliases:['west ham','west ham united','whufc'] },
  { key:'wolves', label:'Wolverhampton Wanderers', domain:'wolves.co.uk', aliases:['wolves','wolverhampton','wolverhampton wanderers','wwfc'] }
];

function normalise(s){
  return String(s||'')
    .toLowerCase()
    .replace(/&/g,'and')
    .replace(/[.’']/g,'')
    .replace(/\bfc\b/g,'')
    .replace(/\bafc\b/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

function findClub(text){
  const n=normalise(text);
  if(!n) return null;
  let exact=null;
  for(const c of CLUBS){
    for(const a of c.aliases){
      const na=normalise(a);
      if(n===na){ exact=c; break; }
    }
    if(exact) break;
  }
  if(exact) return exact;

  return CLUBS.find(c => c.aliases.some(a => {
    const na=normalise(a);
    return na.length >= 5 && (n.includes(na) || na.includes(n));
  })) || null;
}

function crestUrl(club){
  if(!club) return '';
  return `https://www.google.com/s2/favicons?sz=256&domain_url=https://${club.domain}`;
}

function addCss(){
  if(document.getElementById('plp-club-background-css')) return;
  const s=document.createElement('style');
  s.id='plp-club-background-css';
  s.textContent=`
    :root{--club-crest:none}
    body.clubBgOn{
      position:relative;
      background:#f6f6fb;
    }
    body.clubBgOn::before{
      content:"";
      position:fixed;
      inset:0;
      z-index:0;
      pointer-events:none;
      background-image:var(--club-crest);
      background-repeat:no-repeat;
      background-position:center 54%;
      background-size:min(78vw,560px);
      opacity:.075;
      filter:saturate(.78) contrast(.94);
      transform:translateZ(0);
    }
    body.clubBgOn>.app{
      position:relative;
      z-index:1;
      background:rgba(246,246,251,.72);
    }
    body.clubBgOn header::before{
      content:"";
      position:absolute;
      right:-14px;
      bottom:-28px;
      width:180px;
      height:180px;
      z-index:0;
      pointer-events:none;
      background-image:var(--club-crest);
      background-repeat:no-repeat;
      background-position:center;
      background-size:contain;
      opacity:.12;
      filter:grayscale(1) brightness(2.2);
    }
    body.clubBgOn header .head{position:relative;z-index:2}
    body.clubBgOn #plp-match-centre.mcOverlay{
      background:rgba(246,246,251,.86)!important;
    }
    body.clubBgOn #plp-match-centre.mcOverlay::before{
      content:"";
      position:fixed;
      inset:0;
      z-index:0;
      pointer-events:none;
      background-image:var(--club-crest);
      background-repeat:no-repeat;
      background-position:center 54%;
      background-size:min(78vw,560px);
      opacity:.075;
      filter:saturate(.78) contrast(.94);
    }
    body.clubBgOn #plp-match-centre .mcShell{
      position:relative;
      z-index:1;
    }
    .clubBgHint{
      font-size:9px;
      color:#716f82;
      margin-top:6px;
      line-height:1.4;
    }
    @media(max-width:520px){
      body.clubBgOn::before,
      body.clubBgOn #plp-match-centre.mcOverlay::before{
        background-size:88vw;
        background-position:center 57%;
        opacity:.07;
      }
      body.clubBgOn header::before{
        width:150px;
        height:150px;
        right:-22px;
        bottom:-24px;
        opacity:.11;
      }
    }
  `;
  document.head.appendChild(s);
}

async function preloadAndApply(club){
  if(!club){
    document.body.classList.remove('clubBgOn');
    document.documentElement.style.setProperty('--club-crest','none');
    document.body.dataset.club='';
    return;
  }
  const url=crestUrl(club);
  const img=new Image();
  img.referrerPolicy='no-referrer';
  img.onload=()=>{
    document.documentElement.style.setProperty('--club-crest',`url("${url}")`);
    document.body.classList.add('clubBgOn');
    document.body.dataset.club=club.key;
    document.body.dataset.clubLabel=club.label;
  };
  img.onerror=()=>{
    document.body.classList.remove('clubBgOn');
    document.documentElement.style.setProperty('--club-crest','none');
  };
  img.src=url;
}

let lastFavourite='';
let fetching=false;

async function refreshFromProfile(force=false){
  if(fetching) return;
  fetching=true;
  try{
    const {data:{session}}=await clubBgSb.auth.getSession();
    if(!session) return preloadAndApply(null);
    const {data,error}=await clubBgSb.from('profiles')
      .select('favourite_club')
      .eq('user_id',session.user.id)
      .single();
    if(error) throw error;
    const fav=data?.favourite_club||'';
    if(!force && fav===lastFavourite) return;
    lastFavourite=fav;
    await preloadAndApply(findClub(fav));
  }catch(e){
    console.warn('Club background:',e);
  }finally{
    fetching=false;
  }
}

function wireProfilePreview(){
  const input=document.getElementById('pc');
  if(!input || input.dataset.clubBgWired) return;
  input.dataset.clubBgWired='1';

  const hint=document.createElement('div');
  hint.className='clubBgHint';
  hint.textContent='Your favourite club also controls your app background.';
  input.parentElement?.appendChild(hint);

  input.addEventListener('input',()=>{
    preloadAndApply(findClub(input.value));
  });
}

function scheduleWire(){
  clearTimeout(scheduleWire.t);
  scheduleWire.t=setTimeout(wireProfilePreview,80);
}

addCss();
refreshFromProfile(true);

const main=document.getElementById('main');
if(main) new MutationObserver(scheduleWire).observe(main,{childList:true,subtree:true});

window.addEventListener('focus',()=>refreshFromProfile(true));
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible') refreshFromProfile(true);
});
setInterval(()=>refreshFromProfile(false),60000);
