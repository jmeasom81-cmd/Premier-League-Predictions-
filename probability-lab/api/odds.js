// Server-side licensed odds source. Credentials are never sent to browsers.
export default async function handler(req, res) {
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.THE_ODDS_API_KEY;
  if(!key) return res.status(503).json({ error: 'Live odds are not connected yet. Add THE_ODDS_API_KEY to this Vercel project. Manual comparison remains available.' });
  try {
    const url = new URL('https://api.the-odds-api.com/v4/sports/soccer_epl/odds');
    url.searchParams.set('apiKey', key);
    url.searchParams.set('regions', 'uk');
    url.searchParams.set('markets', 'h2h');
    url.searchParams.set('oddsFormat', 'decimal');
    const r=await fetch(url,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(10000)});
    if(!r.ok) return res.status(502).json({error:'Odds provider returned '+r.status+'. Verify credentials, quota and subscription.'});
    const items=await r.json();
    if(!Array.isArray(items)) return res.status(502).json({error:'Unexpected odds data format'});
    const events=items.map(e=>({
      id:e.id,commence_time:e.commence_time,home_team:e.home_team,away_team:e.away_team,
      bookmakers:(e.bookmakers||[]).map(b=>({
        key:b.key,title:b.title,last_update:b.last_update,
        markets:(b.markets||[]).filter(m=>m.key==='h2h').map(m=>({
          key:m.key,last_update:m.last_update,
          outcomes:(m.outcomes||[]).filter(o=>Number(o.price)>1).map(o=>({name:o.name,price:Number(o.price)}))
        }))
      }))
    }));
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).json({events,fetchedAt:new Date().toISOString(),source:'The Odds API',region:'uk',market:'h2h'});
  } catch(e) {
    return res.status(502).json({error:'Odds temporarily unavailable. Please try again later.'});
  }
}