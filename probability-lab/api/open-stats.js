/* StatsBomb football-only open data: on-demand compact research summary.
   No bookmaker feeds, user accounts, personal data, or gambling transactions.
   Only an explicit allowlist of official Premier League open-data match IDs. */
const MATCH_IDS=new Set([3754159,3753994,3754041,3754042,3754123,3754149,3754199,3754229,3754308,3754333,3753989,3754055,3754207,3754134,3753992,3754314,3754342,3754026,3754033,3754070,3754108,3754158,3754210,3754225,3754092,3754018,3754165,3754320,3754037,3754063,3754132,3754170,3754184,3754192,3754332,3753990,3754228,3754154,3754242,3754282,3754307,3754284,3754086,3754294,3754310,3754206,3754187,3754009,3754216,3754227,3754024,3754137,3754155,3754172,3754295,3754322,3754048,3753986,3754152,3754209,3754016,3754022,3754030,3754035,3754116,3754241,3754262,3753982,3754299,3754075,3754087,3754118,3754144,3754175,3754176,3754243,3754272,3754043,3754064,3754100,3754124,3753973,3753977,3753980,3754052,3754181,3754224,3754002,3754053,3753988,3754196,3754313,3754081,3754220,3754061,3754151,3754164,3754177,3754249,3754277,3754289,3754318,3753976,3753991,3754005,3754232,3754349,3754050,3754231,3754280,3754327,3754334,3754239,3754324,3754012,3754049,3754121,3754236,3754321,3754331,3754147,3754214,3754261,3754031,3754039,3754139,3754244,3754264,3754274,3754350,3754253,3754281,3754080,3754120,3754127,3754290,3754292,3754303,3754306,3754316,3754103,3754252,3753997,3754089,3754094,3754095,3754201,3754275,3754317,3754340,3754111,3754163,3753975,3754084,3754110,3754179,3754200,3754271,3754341,3754348,3754161,3754202,3754345,3754004,3754027,3754125,3754168,3754250,3754260,3754338,3754032,3754062,3754065,3754071,3754142,3754183,3754305,3753981,3754021,3754088,3754114,3754140,3754036,3754058,3754069,3754101,3754122,3754251,3754319,3754346,3754226,3754045,3753998,3754019,3754056,3754130,3754173,3754195,3754291,3754326,3753974,3754014,3754054,3754057,3754248,3754279,3754285,3754287,3754309,3754343,3754296,3754051,3754259,3754025,3754044,3754136,3754153,3754166,3754188,3754219,3754013,3754117,3754255,3754276,3754072,3754096,3754162,3754182,3754218,3754328,3754046,3754143,3754073,3754085,3754113,3754135,3754160,3754215,3754286,3754347,3754038,3754047,3754093,3754235,3754028,3754150,3754157,3754178,3754186,3754304,3753979,3754109,3753972,3753996,3754185,3754208,3754211,3754247,3754283,3754301,3754258,3754265,3754351,3754000,3754156,3754194,3754238,3754293,3754297,3754311,3754029,3754082,3754191,3753983,3754006,3754090,3754098,3754167,3754223,3754273,3754015,3754119,3754230,3754234,3754017,3754091,3754126,3754133,3754263,3754288,3754269,3754102,3753999,3754067,3754115,3754193,3754198,3754245,3754256,3754302,3754060,3754074,3754171,3753995,3754076,3754079,3754099,3754278,3754330,3754335,3754105,3754266,3753978,3754001,3754008,3754174,3754197,3754212,3754323,3754339,3754011,3754040,3754222,3754010,3754068,3754077,3754146,3754169,3754217,3754298,3754329,3754106,3754148,3754003,3754213,3754240,3754257,3754315,3754325,3754336,3754221,3754337,3753984,3754007,3754023,3754083,3754204,3754205,3754246,3754268,3754129,3754059,3754189,3754233,3753987,3754104,3754131,3754180,3754190,3754254,3754020,3754066,3754312,3753993,3754034,3754203,3754267,3754270,3754344,3754107,3754145,3753985,3754112,3754141,3754078,3754097,3754128,3754138,3754237,3754300,3749257,3749603,3749274,3749462,3749068,3749453,3749431,3749448,3749246,3749403,3749465,3749642,3749276,3749631,3749052,3749233,3749133,3749153,3749117,3749310,3749522,3749278,3749360,3749590,3749192,3749434,3749196,3749346,3749526,3749079,3749253,3749528,3749552,3749296,3749454,3749108,3749358,3749493]);
const SOURCE="StatsBomb Open Data";
const MAX_EVENT_BYTES=15000000;
const positiveNumber=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const nameOf=v=>v&&typeof v.name==='string'?v.name:'';
function aggregate(events){
 const teams=new Map(),players=new Map();
 const stats=name=>{
  if(!teams.has(name))teams.set(name,{team:name,shots:0,onTarget:0,xg:0,xgShots:0,passes:0,completedPasses:0,corners:0,fouls:0,yellow:0,red:0,penalties:0});
  return teams.get(name);
 };
 const cards=(t,card)=>{
  const c=nameOf(card).toLowerCase();
  if(c.includes('yellow'))t.yellow++;
  if(c.includes('red')||c.includes('second yellow'))t.red++;
 };
 for(const e of events){
  if(!e||!e.team||!e.type)continue;
  const team=nameOf(e.team),type=nameOf(e.type);if(!team)continue;
  const t=stats(team);
  if(type==='Shot'){
   t.shots++;
   const outcome=nameOf(e.shot?.outcome);
   if(['Goal','Saved','Saved to Post'].includes(outcome))t.onTarget++;
   const xg=positiveNumber(e.shot?.statsbomb_xg);
   if(xg!==null){t.xg+=xg;t.xgShots++}
   if(nameOf(e.shot?.type)==='Penalty')t.penalties++;
   const player=nameOf(e.player);
   if(player){
    const k=team+'|'+player;
    if(!players.has(k))players.set(k,{player,team,shots:0,goals:0,xg:0,xgShots:0});
    const p=players.get(k);p.shots++;if(outcome==='Goal')p.goals++;
    if(xg!==null){p.xg+=xg;p.xgShots++}
   }
  } else if(type==='Pass'){
   t.passes++;
   if(!e.pass?.outcome)t.completedPasses++;
   if(nameOf(e.pass?.type)==='Corner')t.corners++;
  } else if(type==='Foul Committed'){
   t.fouls++;if(e.foul_committed?.card)cards(t,e.foul_committed.card);
  } else if(type==='Bad Behaviour'){
   if(e.bad_behaviour?.card)cards(t,e.bad_behaviour.card);
  }
 }
 const round=n=>Math.round(n*100)/100;
 const teamRows=[...teams.values()].map(t=>({...t,xg:t.xgShots?round(t.xg):null,passCompletion:t.passes?Math.round(t.completedPasses/t.passes*1000)/10:null}));
 const leaders=[...players.values()].sort((a,b)=>b.shots-a.shots||b.xg-a.xg).slice(0,8).map(p=>({...p,xg:p.xgShots?round(p.xg):null}));
 return {teams:teamRows,leaders};
}
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const raw=req.query?.match;
 const id=Number(raw);
 if(!Number.isSafeInteger(id)||!MATCH_IDS.has(id))return res.status(404).json({error:'Match is not in the verified StatsBomb Premier League Open Data index.'});
 const ctrl=new AbortController();
 const timeout=setTimeout(()=>ctrl.abort(),18000);
 try{
  const url='https://raw.githubusercontent.com/hudl/open-data/master/data/events/'+id+'.json';
  const upstream=await fetch(url,{signal:ctrl.signal,headers:{accept:'application/json'}});
  if(!upstream.ok)throw Error('Open event data unavailable ('+upstream.status+').');
  const len=Number(upstream.headers.get('content-length'));
  if(Number.isFinite(len)&&len>MAX_EVENT_BYTES)throw Error('Match event file exceeds safety limit.');
  const body=await upstream.text();
  if(body.length>MAX_EVENT_BYTES)throw Error('Match event file exceeds safety limit.');
  const events=JSON.parse(body);
  if(!Array.isArray(events)||!events.length)throw Error('No valid event data returned.');
  const summary=aggregate(events);
  if(!summary.teams.length)throw Error('Match has no recognised team events.');
  res.setHeader('Cache-Control','public, s-maxage=604800, stale-while-revalidate=86400');
  return res.status(200).json({matchId:id,source:SOURCE,sourceUrl:'https://github.com/hudl/open-data',eventCount:events.length,statDefinitions:{shots:'Shot events',onTarget:'Goals and saved shot outcomes',xg:'Sum of StatsBomb shot xG, where available',corners:'Pass events marked Corner',passes:'Pass events including set pieces; completion when no outcome is recorded'},...summary});
 }catch(e){
  console.warn('StatsBomb open event summary unavailable',id,e.message);
  return res.status(502).json({error:'Football-only match event data could not be loaded. Please retry later.'});
 }finally{clearTimeout(timeout)}
}
