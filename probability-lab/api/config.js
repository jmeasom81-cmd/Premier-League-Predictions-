// Public configuration status only. Never returns credentials or account data.
export default function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Cache-Control','public, s-maxage=60');
  return res.status(200).json({
    footballDataConfigured:Boolean(process.env.FOOTBALL_DATA_API_KEY),
    bookmakerOddsConfigured:Boolean(process.env.THE_ODDS_API_KEY)
  });
}