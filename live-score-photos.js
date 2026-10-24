// MATCHDAY PHOTOS + VIDEOS V2
// Owner posts photos and short clips; active members see a private gallery.
// All media is held in a private Supabase bucket and read with short-lived signed URLs.
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const lspSb=createClient('https://jzrbaeyvwagrwukntjbk.supabase.co','sb_publishable_OVczf1AxPQfYdwynkVlwaQ_9fdB9ij8');
const lspBucket='live-score-photos';
let lspCtx=null,lspUid=null,lspGallery=null,lspAt=0,lspFetchPromise=null,lspUploadBusy=false,lspTimer=null,lspSelected=null;
let lspMediaIndex=0;
const lspEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lspArr=v=>Array.isArray(v)?v:[];
const lspTime=v=>{try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return ''}};
const lspPhotos=()=>lspArr(lspGallery?.photos);
const lspFixtures=()=>lspArr(lspGallery?.fixtures);
const lspPhotoById=id=>lspPhotos().find(p=>p.id===id);
const lspPhotoUrl=p=>p?.signed_url||'';
const lspIsVideo=p=>p?.media_type==='video';
const lspVideoLimit=45*1024*1024;

function lspStyle(){
 if(document.getElementById('lsp-style'))return;
 const s=document.createElement('style');s.id='lsp-style';s.textContent=[
 '.lspPanel{background:#fff;border:1px solid #e2d9ef;border-radius:17px;padding:12px;margin:10px 0;box-shadow:0 4px 15px #25163c0a}',
 '.lspHead{display:flex;align-items:flex-start;justify-content:space-between;gap:9px}',
 '.lspHead h2{margin:0;color:#261b45;font-size:16px;font-weight:900}',
 '.lspHint{font-size:11px;color:#706982;line-height:1.4;margin:6px 0}',
 '.lspCount{font-size:10px;color:#6944a6;font-weight:850;background:#f0eafa;border-radius:24px;padding:5px 9px;white-space:nowrap}',
 '.lspBtn{background:#4b269d;color:#fff;border:0;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:850;cursor:pointer}',
 '.lspBtn:disabled{opacity:.55;cursor:default}.lspBtn.alt{background:#f0ebfa;color:#4b269d}.lspBtn.danger{background:#fff0f0;color:#9b303d}',
 '.lspStrip{display:flex;gap:10px;overflow-x:auto;overscroll-behavior-inline:contain;padding:4px 2px 7px;scroll-snap-type:x proximity}',
 '.lspThumb{background:#fcfbff;border:1px solid #e8e1f5;border-radius:12px;flex:0 0 min(58vw,195px);overflow:hidden;cursor:pointer;text-align:left;scroll-snap-align:start;padding:0}',
 '.lspThumb img{width:100%;height:125px;object-fit:cover;background:#eeebf3;display:block}',
'.lspVideoTile{height:125px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#2d1757,#6948ad);color:#fff;font-weight:850}',
'.lspVideoTile b{font-size:36px}.lspVideoTile small{font-size:11px;color:#eee8ff}',
'.lspVideoPlayer{max-height:63dvh;width:100%;object-fit:contain;display:block;border-radius:11px;background:#111}',
'.lspUploading{border:1px solid #ded4ec;background:#f7f4fc;padding:10px;border-radius:10px;margin:10px 0}',
'.lspProgress{display:block;width:100%;height:9px;accent-color:#4b269d}',
 '.lspThumbText{padding:9px;font-size:11px;line-height:1.35;color:#352b47}',
 '.lspThumbText strong{display:block;margin-bottom:4px}.lspCaption{display:block;color:#746d82;margin-top:4px;font-size:10px}',
 '.lspBackdrop{position:fixed;inset:0;z-index:15500;background:#100d20bf;display:flex;align-items:flex-end;justify-content:center}',
 '.lspModal{background:#fff;border-radius:20px 20px 0 0;padding:17px 15px 22px;width:min(100%,640px);max-height:94dvh;overflow:auto;color:#291b43}',
 '.lspModalHead{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-bottom:10px}',
 '.lspModalHead h2{font-size:18px;margin:0;line-height:1.2}',
 '.lspField{display:block;font-weight:800;font-size:12px;margin:12px 0 6px}',
 '.lspSelect,.lspInput{display:block;width:100%;padding:12px;font-size:14px;border:1px solid #d8d3e2;border-radius:10px;background:#fff;color:#291b43}',
 '.lspActions{display:flex;flex-wrap:wrap;gap:8px;margin:13px 0}',
 '.lspNotice{font-size:11px;color:#625a6c;line-height:1.5;padding:9px;border-radius:10px;background:#f3f0fa}',
 '.lspStatus{color:#176a50;background:#e9faf2;padding:9px;font-size:12px;border-radius:10px;margin-top:10px}',
 '.lspError{color:#a33235;background:#fff0f0;padding:9px;font-size:12px;border-radius:10px;margin-top:10px}',
 '.lspZoom{max-height:62dvh;max-width:100%;object-fit:contain;display:block;border-radius:11px;margin:auto;background:#eeeaf3}',
 '.lspViewerCaption{white-space:pre-wrap;font-size:13px;line-height:1.45;color:#443b53;padding:8px 0}',
 '@media(min-width:600px){.lspBackdrop{align-items:center;padding:20px}.lspModal{border-radius:20px;max-height:90dvh}}'
 ].join('');document.head.appendChild(s);
}
async function lspContext(){
 const {data:{session}}=await lspSb.auth.getSession();
 const uid=session?.user?.id;
 if(!uid){lspCtx=null;lspUid=null;lspGallery=null;return null}
 if(lspCtx&&lspUid===uid)return lspCtx;
 const {data,error}=await lspSb.from('league_members').select('league_id,status,joined_at')
  .eq('user_id',uid).eq('status','active').order('joined_at',{ascending:false}).limit(1);
 if(error||!data?.length)return null;
 lspUid=uid;lspCtx={uid,leagueId:data[0].league_id};lspGallery=null;lspAt=0;return lspCtx;
}
async function lspLoad(force=false){
 if(lspFetchPromise)return lspFetchPromise;
 if(!force&&lspGallery&&Date.now()-lspAt<25000){lspMount();return}
 lspFetchPromise=(async()=>{
  const ctx=await lspContext();if(!ctx)return;
  const {data,error}=await lspSb.rpc('get_live_score_photo_gallery',{p_league_id:ctx.leagueId});
  if(error)throw error;
  const newGallery=data||{fixtures:[],photos:[]};
  const old=new Map(lspPhotos().map(p=>[p.id,p]));
  const photos=lspArr(newGallery.photos);
  await Promise.all(photos.map(async p=>{
   const previous=old.get(p.id);
   if(previous?.signed_url&&previous.signed_at&&Date.now()-previous.signed_at<45*60*1000){
    p.signed_url=previous.signed_url;p.signed_at=previous.signed_at;return;
   }
   try{
    const {data:signed,error:err}=await lspSb.storage.from(lspBucket).createSignedUrl(p.storage_path,3600);
    if(err)throw err;
    p.signed_url=signed?.signedUrl||'';p.signed_at=Date.now();
   }catch(e){console.warn('Could not sign photo URL',e);p.signed_url=''}
  }));
  lspGallery=newGallery;lspAt=Date.now();lspMount();
 })().catch(e=>console.warn('Matchday pictures:',e)).finally(()=>{lspFetchPromise=null});
 return lspFetchPromise;
}
function lspMarkup(){
 const photos=lspPhotos(),owner=!!lspGallery?.is_owner;
 if(!owner&&!photos.length)return '';
 return '<section class="lspPanel" data-lsp-panel>'+
 '<div class="lspHead"><div><h2>📸 Matchday photos &amp; videos</h2><div class="lspHint">Images and clips alongside live scores · tap to view or play</div></div>'+
 '<span class="lspCount">'+photos.length+' item'+(photos.length===1?'':'s')+'</span></div>'+
 (photos.length?
 '<div class="lspStrip">'+photos.map(p=>
  '<button type="button" class="lspThumb" data-lsp-view="'+lspEsc(p.id)+'">'+
   (lspIsVideo(p)?'<div class="lspVideoTile"><b>▶</b><small>Play video'+(p.duration_seconds?' · '+Number(p.duration_seconds)+'s':'')+'</small></div>':  lspPhotoUrl(p)?'<img src="'+lspEsc(lspPhotoUrl(p))+'" loading="lazy" alt="'+lspEsc(p.home_team+' v '+p.away_team)+' photo">':'<div class="lspNotice">Photo unavailable</div>')+
   '<div class="lspThumbText"><strong>'+lspEsc(p.home_team)+' v '+lspEsc(p.away_team)+'</strong>'+
   (p.caption?'<span class="lspCaption">'+lspEsc(p.caption)+'</span>':'')+
   '<span class="lspCaption">'+lspEsc(lspTime(p.created_at))+'</span></div></button>'
 ).join('')+'</div>':
 '<p class="lspHint">No photos or videos yet. Add your first matchday moment below.</p>')+
 (owner?'<button class="lspBtn" data-lsp-action="add">+ Add photos or videos</button>'+
  '<p class="lspHint">Only the league owner can upload or remove matchday media.</p>':'')+
 '</section>';
}
function lspMount(){
 if(!lspGallery)return;
 for(const selector of ['.mc3Overlay .mc3Body','.lcOverlay .lcBody']){
  const body=document.querySelector(selector);if(!body)continue;
  let slot=body.querySelector('.lspSlot');
  if(!slot){
   slot=document.createElement('div');slot.className='lspSlot';
   const anchor=body.querySelector('.mc3Fresh,.lcSummary');
   if(anchor)anchor.insertAdjacentElement('afterend',slot);
   else body.prepend(slot);
  }
  const photos=lspPhotos(),signature=JSON.stringify([
   !!lspGallery.is_owner,
   ...photos.map(p=>[p.id,p.caption,p.signed_url,p.media_type,p.duration_seconds]),
  ]);
  if(slot.dataset.lspSignature===signature)continue;
  slot.innerHTML=lspMarkup();
  slot.dataset.lspSignature=signature;
 }
}
function lspDialogBase(title,body){
 document.getElementById('lsp-dialog')?.remove();
 const d=document.createElement('div');d.id='lsp-dialog';d.className='lspBackdrop';
 d.innerHTML='<section class="lspModal" role="dialog" aria-modal="true" aria-label="'+lspEsc(title)+'">'+
 '<div class="lspModalHead"><h2>'+lspEsc(title)+'</h2><button type="button" class="lspBtn alt" data-lsp-action="close">✕ Close</button></div>'+body+'</section>';
 document.body.appendChild(d);return d;
}
function lspOpenAdd(){
 if(!lspGallery?.is_owner)return;
 const fixtures=lspFixtures();
 if(!fixtures.length){alert('No matchday fixtures are available for photos right now.');return}
 const now=Date.now();
 const nearest=[...fixtures].sort((a,b)=>Math.abs(new Date(a.kickoff_at)-now)-Math.abs(new Date(b.kickoff_at)-now))[0];
 lspSelected=fixtures.some(f=>f.id===lspSelected)?lspSelected:nearest.id;
 const choices=fixtures.map(f=>'<option value="'+lspEsc(f.id)+'" '+(f.id===lspSelected?'selected':'')+'>'+
  lspEsc(f.home_team)+' v '+lspEsc(f.away_team)+' · '+lspEsc(lspTime(f.kickoff_at))+'</option>').join('');
 lspDialogBase('📸 Add photos or videos',
  '<p class="lspNotice">Choose a match, then add photos or a video from your phone. Only active league members can view them.</p>'+
  '<label class="lspField" for="lsp-fixture">Attach pictures to match</label><select id="lsp-fixture" class="lspSelect">'+choices+'</select>'+
  '<label class="lspField" for="lsp-caption">Caption (optional)</label>'+
  '<input id="lsp-caption" class="lspInput" maxlength="240" placeholder="Goal celebration, matchday moment…">'+
  '<div class="lspActions"><button type="button" class="lspBtn" data-lsp-action="pick-gallery">🖼️ Choose photos</button>'+
  '<button type="button" class="lspBtn alt" data-lsp-action="pick-camera">📷 Take photo</button>'+ 
  '<button type="button" class="lspBtn alt" data-lsp-action="pick-video">🎬 Choose video</button></div>'+
  '<input type="file" id="lsp-gallery-files" accept="image/*" multiple hidden>'+
  '<input type="file" id="lsp-camera-file" accept="image/*" capture="environment" hidden>'+ 
  '<input type="file" id="lsp-video-file" accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm" hidden>'+
  '<p class="lspHint">Up to 8 photos (resized automatically), or one video at a time: MP4/WebM/MOV, up to 45 MB and 90 seconds. Videos upload in chunks; keep this screen open until complete. Media does not affect scores or points.</p>'+
  '<div id="lsp-upload-status" aria-live="polite"></div>'
 );
}
async function lspCompress(file){
 if(!file||!file.type.startsWith('image/'))throw new Error('Please select pictures, not videos or documents.');
 if(file.size>24*1024*1024)throw new Error('This picture is too large (maximum original size 24 MB).');
 let bmp=null,objectUrl=null,img=null;
 try{
  if(typeof createImageBitmap==='function'){try{bmp=await createImageBitmap(file)}catch(_){}}
  if(!bmp){
   objectUrl=URL.createObjectURL(file);
   img=new Image();img.src=objectUrl;
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('This phone cannot open the selected image. Try a JPG or PNG.'))});
  }
  const width=bmp?bmp.width:img.naturalWidth,height=bmp?bmp.height:img.naturalHeight;
  if(!width||!height)throw new Error('Could not read picture dimensions.');
  const scale=Math.min(1,1800/Math.max(width,height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));
  canvas.height=Math.max(1,Math.round(height*scale));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Photo processing is unavailable in this browser.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bmp||img,0,0,canvas.width,canvas.height);
  const result=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.84));
  if(!result)throw new Error('Could not prepare this picture.');
  if(result.size>6*1024*1024)throw new Error('The compressed picture exceeds the storage limit.');
  return result;
 }finally{
  if(bmp?.close)bmp.close();
  if(objectUrl)URL.revokeObjectURL(objectUrl);
 }
}

function lspVideoFormat(file){
 const name=String(file?.name||'').toLowerCase();
 const mime=String(file?.type||'').toLowerCase();
 if(mime==='video/mp4'||name.endsWith('.mp4')||name.endsWith('.m4v'))
   return {type:'video/mp4',ext:'mp4'};
 if(mime==='video/webm'||name.endsWith('.webm'))
   return {type:'video/webm',ext:'webm'};
 if(mime==='video/quicktime'||name.endsWith('.mov'))
   return {type:'video/quicktime',ext:'mov'};
 throw Error('Choose an MP4, WebM or MOV video. Other formats are not supported.');
}
async function lspVideoMetadata(file){
 if(!file||!file.size)throw Error('Choose a video from your gallery.');
 if(file.size>lspVideoLimit)throw Error('This video is over 45 MB. Trim or compress it in your phone gallery first.');
 const format=lspVideoFormat(file);
 return new Promise((resolve,reject)=>{
  const preview=document.createElement('video');
  let done=false;
  const url=URL.createObjectURL(file);
  const finish=(err,duration)=>{
   if(done)return;done=true;
   clearTimeout(timeout);
   preview.pause();
   preview.removeAttribute('src');
   preview.load();
   URL.revokeObjectURL(url);
   err?reject(err):resolve({...format,duration_seconds:Math.ceil(duration)});
  };
  const timeout=setTimeout(()=>finish(Error('Could not read the video. Try saving it as MP4 first.')),15000);
  preview.preload='metadata';preview.muted=true;preview.playsInline=true;
  preview.onloadedmetadata=()=>{
    const d=preview.duration;
    if(!Number.isFinite(d)||d<=0)return finish(Error('Could not read the video length. Try another MP4 file.'));
    if(d>90)return finish(Error('This video is longer than 90 seconds. Trim it before uploading.'));
    finish(null,d);
  };
  preview.onerror=()=>finish(Error('This video cannot be previewed on your phone. Try MP4 (H.264).'));
  preview.src=url;
 });
}
async function lspResumableVideoUpload(file,path,mime){
 const {data:{session}}=await lspSb.auth.getSession();
 if(!session?.access_token)throw Error('Your session has expired. Please sign in again.');
 let tus;
 try{
  tus=await import('https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/+esm');
 }catch(e){throw Error('Could not start the video uploader. Please reconnect and try again.')}
 return new Promise((resolve,reject)=>{
  const upload=new tus.Upload(file,{
   endpoint:'https://jzrbaeyvwagrwukntjbk.storage.supabase.co/storage/v1/upload/resumable',
   headers:{authorization:'Bearer '+session.access_token,'x-upsert':'false'},
   retryDelays:[0,3000,5000,10000,20000],
   uploadDataDuringCreation:true,
   removeFingerprintOnSuccess:true,
   chunkSize:6*1024*1024,
   metadata:{
    bucketName:lspBucket,
    objectName:path,
    contentType:mime,
    cacheControl:'86400'
   },
   onError:err=>reject(err),
   onProgress:(sent,total)=>{
    const percent=Math.min(100,Math.round(100*sent/total));
    lspStatus('Uploading video… '+percent+'% ('+(sent/1024/1024).toFixed(1)+' MB of '+(total/1024/1024).toFixed(1)+' MB)');
   },
   onSuccess:()=>resolve()
  });
  upload.start();
 });
}

function lspStatus(message,error=false){
 const host=document.getElementById('lsp-upload-status');
 if(host)host.innerHTML='<div class="'+(error?'lspError':'lspStatus')+'">'+lspEsc(message)+'</div>';
}
async function lspUpload(files,media='photo'){
 if(lspUploadBusy||!files?.length)return;
 const ctx=await lspContext();
 if(!ctx||!lspGallery?.is_owner){lspStatus('Only the league owner can upload media.',true);return}
 const fixtureId=document.getElementById('lsp-fixture')?.value;
 if(!lspFixtures().some(f=>f.id===fixtureId)){lspStatus('Choose a match first.',true);return}
 const caption=(document.getElementById('lsp-caption')?.value||'').trim().slice(0,240);
 const selected=[...files];
 if(selected.length>(media==='video'?1:8)){lspStatus(media==='video'?'Choose one video at a time.':'Choose no more than 8 pictures at once.',true);return}
 lspSelected=fixtureId;lspUploadBusy=true;
 let added=0;
 try{
  for(const [i,file] of selected.entries()){
   lspStatus((media==='video'?'Preparing video':'Preparing picture')+' '+(i+1)+' of '+selected.length+'…');
   const details=media==='video'?await lspVideoMetadata(file):null;
   const jpeg=media==='video'?null:await lspCompress(file);
   const ext=details?.ext||'jpg';
   const path=ctx.leagueId+'/'+fixtureId+'/'+ctx.uid+'/'+crypto.randomUUID()+'.'+ext;
   if(media==='video'){
    await lspResumableVideoUpload(file,path,details.type);
   }else{
    const {error:uploadError}=await lspSb.storage.from(lspBucket).upload(path,jpeg,{
     contentType:'image/jpeg',cacheControl:'86400',upsert:false
    });
    if(uploadError)throw uploadError;
   }
   const {error:metaError}=await lspSb.from('live_score_photos').insert({
    league_id:ctx.leagueId,fixture_id:fixtureId,uploaded_by:ctx.uid,storage_path:path,caption,
    media_type:media==='video'?'video':'photo',
    duration_seconds:details?.duration_seconds||null
   });
   if(metaError){
    await lspSb.storage.from(lspBucket).remove([path]);
    throw metaError;
   }
   added++;
  }
  lspStatus(added+' '+(media==='video'?'video': 'picture')+(added===1?'':'s')+' added! League members can now '+(media==='video'?'play': 'view')+(added===1?' it':' them')+'.');
 }catch(e){
  lspStatus((added?added+' saved; ':'')+(e.message||'Upload failed'),true);
 }finally{
  lspUploadBusy=false;lspAt=0;await lspLoad(true);
  for(const id of ['lsp-gallery-files','lsp-camera-file','lsp-video-file']){
   const input=document.getElementById(id);if(input)input.value='';
  }
 }
}
function lspOpenViewer(id){
 const photos=lspPhotos();
 const i=photos.findIndex(p=>p.id===id);if(i<0)return;
 lspMediaIndex=i;lspRenderViewer();
}
function lspRenderViewer(){
 const photos=lspPhotos(),p=photos[lspMediaIndex];if(!p)return;
 const image=lspPhotoUrl(p);
 const body=(image?(lspIsVideo(p)?'<video class="lspVideoPlayer" src="'+lspEsc(image)+'" controls playsinline preload="metadata"></video>':
 '<img class="lspZoom" src="'+lspEsc(image)+'" alt="'+lspEsc(p.home_team)+' v '+lspEsc(p.away_team)+' picture">'):
 '<p class="lspNotice">The photo could not be opened. Please try refreshing.</p>')+
 '<p class="lspViewerCaption"><strong>'+lspEsc(p.home_team)+' v '+lspEsc(p.away_team)+'</strong>'+
 (p.caption?'\n'+lspEsc(p.caption):'')+'</p>'+
 '<div class="lspActions">'+
 (photos.length>1?'<button class="lspBtn alt" data-lsp-action="prev">← Previous</button>'+
 '<span class="lspHint">'+(lspMediaIndex+1)+' of '+photos.length+'</span>'+
 '<button class="lspBtn alt" data-lsp-action="next">Next →</button>':'')+
 (lspGallery?.is_owner?'<button class="lspBtn danger" data-lsp-action="delete" data-lsp-id="'+lspEsc(p.id)+'">Remove '+(lspIsVideo(p)?'video':'picture')+'</button>':'')+
 '</div><div id="lsp-upload-status"></div>';
 lspDialogBase(lspIsVideo(p)?'🎬 Matchday video':'Matchday photo',body);
}
async function lspDelete(id){
 const p=lspPhotoById(id),ctx=await lspContext();
 if(!p||!ctx||!lspGallery?.is_owner)return;
 if(!confirm('Remove this '+(lspIsVideo(p)?'video':'picture')+' from the league gallery for everyone?'))return;
 lspStatus('Removing picture…');
 const {error:storageError}=await lspSb.storage.from(lspBucket).remove([p.storage_path]);
 if(storageError){lspStatus(storageError.message||'Could not remove picture',true);return}
 const {error}=await lspSb.from('live_score_photos').delete().eq('id',p.id).eq('league_id',ctx.leagueId);
 if(error){lspStatus('Image removed but its gallery entry could not be cleared: '+error.message,true);return}
 document.getElementById('lsp-dialog')?.remove();
 lspAt=0;await lspLoad(true);
}
async function lspClick(e){
 const btn=e.target.closest?.('[data-lsp-action],[data-lsp-view]');if(!btn)return;
 e.preventDefault();
 if(btn.dataset.lspView){lspOpenViewer(btn.dataset.lspView);return}
 const action=btn.dataset.lspAction;
 if(action==='add'){lspOpenAdd();return}
 if(action==='close'){document.getElementById('lsp-dialog')?.remove();return}
 if(action==='pick-gallery'){document.getElementById('lsp-gallery-files')?.click();return}
 if(action==='pick-camera'){document.getElementById('lsp-camera-file')?.click();return}
 if(action==='pick-video'){document.getElementById('lsp-video-file')?.click();return}
 if(action==='prev'){lspMediaIndex=(lspMediaIndex+lspPhotos().length-1)%lspPhotos().length;lspRenderViewer();return}
 if(action==='next'){lspMediaIndex=(lspMediaIndex+1)%lspPhotos().length;lspRenderViewer();return}
 if(action==='delete')await lspDelete(btn.dataset.lspId);
}
function lspSchedule(){
 clearTimeout(lspTimer);
 lspTimer=setTimeout(()=>{
  if(!document.querySelector('.mc3Overlay,.lcOverlay'))return;
  if(lspGallery)lspMount();
  lspLoad(false);
 },330);
}
lspStyle();
document.addEventListener('click',e=>{lspClick(e).catch(err=>console.warn('Live photos action',err))});
document.addEventListener('change',e=>{
 if(['lsp-gallery-files','lsp-camera-file','lsp-video-file'].includes(e.target?.id)){
  lspUpload(e.target.files,e.target.id==='lsp-video-file'?'video':'photo')
    .catch(err=>lspStatus(err.message||'Upload failed',true));
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.getElementById('lsp-dialog'))document.getElementById('lsp-dialog')?.remove();
});
const lspObserve=new MutationObserver(lspSchedule);
lspObserve.observe(document.body,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.querySelector('.mc3Overlay,.lcOverlay'))lspLoad(true)});
window.addEventListener('focus',()=>{if(document.querySelector('.mc3Overlay,.lcOverlay'))lspLoad(true)});
lspSb.auth.onAuthStateChange(()=>{lspCtx=null;lspUid=null;lspGallery=null;lspAt=0;setTimeout(lspSchedule,300)});
setInterval(()=>{if(document.querySelector('.mc3Overlay,.lcOverlay')&&!document.getElementById('lsp-dialog'))lspLoad(true)},60000);
window.refreshPLPLivePhotos=()=>lspLoad(true);
setTimeout(lspSchedule,900);
