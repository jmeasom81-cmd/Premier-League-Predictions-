// Public football-only data endpoint. Credentials stay on the server.
// Reads an authenticated, tightly scoped Supabase Edge Function; never accesses
// accounts, player predictions, profiles, or leagues directly.
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 const token=process.env.PLP_FEED_TOKEN;
 if(!token)return res.status(503).json({error:'Predictions connection is not configured'});
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),13500);
 try{
  const upstream=await fetch('https://jzrbaeyvwagrwukntjbk.supabase.co/functions/v1/probability-lab-football-feed',{
    method:'GET',
    headers:{'x-plp-feed-token':token,'accept':'application/json'},
    signal:controller.signal
  });
  if(!upstream.ok){
    console.warn('Football-only upstream returned',upstream.status);
    return res.status(502).json({error:'Predictions football feed temporarily unavailable. HTTP '+upstream.status});
  }
  const body=await upstream.json();
  if(body.source!=='premier-league-predictions'||!Array.isArray(body.completedMatches)||!Array.isArray(body.fixtures))throw Error('Unexpected upstream response');
  // Safety check: pass through the football-only schema rather than an entire
  // privileged source response.
  const results=body.completedMatches.slice(0,1500).filter(x=>x&&x.date&&x.home&&x.away&&Number.isInteger(x.hg)&&Number.isInteger(x.ag)).map(x=>({
    date:String(x.date).slice(0,10),home:String(x.home).slice(0,100),away:String(x.away).slice(0,100),
    hg:x.hg,ag:x.ag,season:String(x.season||'').slice(0,20),source:String(x.source||'Predictions database').slice(0,80)
  }));
  const fixtures=body.fixtures.slice(0,500).filter(x=>x&&x.date&&x.home&&x.away).map(x=>({
    date:String(x.date).slice(0,30),home:String(x.home).slice(0,100),away:String(x.away).slice(0,100),
    provisional:Boolean(x.provisional),source:'Predictions database'
  }));
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=120');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).json({
    source:'Premier League Predictions database',
    generatedAt:body.generatedAt,
    historicalPremierLeague:body.historicalPremierLeague,
    completedCurrentSeason:body.completedCurrentSeason,
    completedMatches:results,
    fixtures,
    notice:'Football-only read-only feed. Schedules and scores may change in the Predictions app.'
  });
 }catch(error){console.error('Football feed proxy error:',error.name);return res.status(502).json({error:'Predictions connection temporarily unavailable. Try Refresh.'})}
 finally{clearTimeout(timer)}
}
