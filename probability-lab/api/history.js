// Current-season Premier League results from a licensed provider. Token stays server-side.
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const token=process.env.FOOTBALL_DATA_API_KEY;
  if(!token) return res.status(503).json({error:'Add FOOTBALL_DATA_API_KEY in Vercel to enable automatic historical results.'});
  try {
    const url='https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED';
    const r=await fetch(url,{headers:{'X-Auth-Token':token,'Accept':'application/json'},signal:AbortSignal.timeout(10000)});
    if(!r.ok)return res.status(502).json({error:'Football-data.org returned '+r.status+'. Check your token, plan and request quota.'});
    const j=await r.json();
    const matches=(j.matches||[]).filter(m=>m.status==='FINISHED'&&m.score&&m.score.fullTime&&
      Number.isInteger(m.score.fullTime.home)&&Number.isInteger(m.score.fullTime.away)).map(m=>({
      date:(m.utcDate||'').slice(0,10),
      home:m.homeTeam?.name||m.homeTeam?.shortName||'',
      away:m.awayTeam?.name||m.awayTeam?.shortName||'',
      hg:m.score.fullTime.home,ag:m.score.fullTime.away
    })).filter(m=>m.home&&m.away);
    res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=300');
    return res.status(200).json({matches,source:'football-data.org',fetchedAt:new Date().toISOString()});
  }catch(e){return res.status(502).json({error:'Completed results feed is temporarily unavailable.'})}
}