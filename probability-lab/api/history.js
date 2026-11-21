// Secure, season-aware historical EPL results. Secrets never reach the browser.
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const token=process.env.FOOTBALL_DATA_API_KEY;
  if(!token)return res.status(503).json({error:'Add FOOTBALL_DATA_API_KEY in Vercel to enable automatic historical results.'});
  const now=new Date(), current=now.getUTCFullYear()-(now.getUTCMonth()<6?1:0);
  const requested=String(req.query?.seasons||current+','+(current-1)).split(',').map(Number);
  const seasons=[...new Set(requested)].filter(x=>Number.isInteger(x)&&x>=2000&&x<=current).sort((a,b)=>a-b);
  if(!seasons.length||seasons.length>3)return res.status(400).json({error:'Choose one to three valid season-start years.'});
  const messages=[],rows=[];
  // Serial requests respect football-data.org free plan quotas; failures are reported clearly.
  for(const season of seasons){
    try{
      const url='https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED&season='+season;
      const r=await fetch(url,{headers:{'X-Auth-Token':token,'Accept':'application/json'},signal:AbortSignal.timeout(10000)});
      if(!r.ok){messages.push('Season '+season+': provider HTTP '+r.status);continue}
      const j=await r.json(), matches=Array.isArray(j.matches)?j.matches:[];
      for(const m of matches){
        const h=m.score?.fullTime?.home,a=m.score?.fullTime?.away;
        if(m.status!=='FINISHED'||!Number.isInteger(h)||!Number.isInteger(a))continue;
        const home=m.homeTeam?.name||m.homeTeam?.shortName,away=m.awayTeam?.name||m.awayTeam?.shortName;
        if(!home||!away)continue;
        rows.push({date:(m.utcDate||'').slice(0,10),home,away,hg:h,ag:a,season});
      }
      messages.push('Season '+season+': '+matches.length+' provider matches, '+rows.filter(x=>x.season===season).length+' completed');
    }catch(e){messages.push('Season '+season+': temporarily unavailable')}
  }
  if(!rows.length)return res.status(502).json({error:'No completed results returned. '+messages.join('; ')});
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  const unique=new Map();
  for(const r of rows)unique.set(r.season+'|'+r.date+'|'+r.home+'|'+r.away,r);
  res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=600');
  return res.status(200).json({matches:[...unique.values()],seasons,messages,partial:messages.some(x=>x.includes('unavailable')||x.includes('HTTP')),source:'football-data.org',fetchedAt:new Date().toISOString()});
}