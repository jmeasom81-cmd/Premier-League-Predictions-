// Optional fixtures feed; the football-data.org token stays server-side.
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const key=process.env.FOOTBALL_DATA_API_KEY;
  if(!key) return res.status(503).json({error:'Add FOOTBALL_DATA_API_KEY to Vercel to fetch upcoming fixtures.'});
  try{
    const r=await fetch('https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED',{
      headers:{'X-Auth-Token':key,'Accept':'application/json'},
      signal:AbortSignal.timeout(10000)
    });
    if(!r.ok) return res.status(502).json({error:'Fixture provider returned '+r.status+'. Check token and access rights.'});
    const j=await r.json();
    const matches=(j.matches||[]).slice(0,40).map(m=>({
      utcDate:m.utcDate,id:m.id,status:m.status,
      homeTeam:{name:m.homeTeam?.name||'',shortName:m.homeTeam?.shortName||''},
      awayTeam:{name:m.awayTeam?.name||'',shortName:m.awayTeam?.shortName||''}
    }));
    res.setHeader('Cache-Control','public, s-maxage=1200, stale-while-revalidate=300');
    return res.status(200).json({matches,fetchedAt:new Date().toISOString(),source:'football-data.org'});
  }catch(e){return res.status(502).json({error:'Fixtures temporarily unavailable.'})}
}