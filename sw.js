self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={};try{data=event.data?event.data.json():{}}catch(_){data={body:event.data?.text?.()||''}}
 const title=data.title||'Premier League Predictions';
 const options={body:data.body||'',tag:data.tag||'plp',renotify:true,data:{url:data.url||'?open=predict'}};
 event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const raw=event.notification.data?.url||'?open=predict';
 const target=new URL(raw,self.registration.scope).href;
 event.waitUntil((async()=>{
  const list=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of list){if(c.url.startsWith(self.registration.scope)){await c.focus();if('navigate'in c)await c.navigate(target);return}}
  if(clients.openWindow)await clients.openWindow(target);
 })());
});
