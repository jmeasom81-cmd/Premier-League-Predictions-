# Premier League Probability Lab

A standalone research-only companion to the Premier League Predictions game. This is an independent odds/probability analysis web app, not a betting operator. The existing predictions code is untouched.

## Features

- Import genuine match-results CSV files (Date,HomeTeam,AwayTeam,FTHG,FTAG), processed locally, persisted in browser storage.
- Actual home/draw/away results, league goal trends, BTTS, and overs from imported match history.
- Transparent shrinkage-adjusted Poisson score model, market probabilities, and exact score heatmap.
- Manual decimal-odds comparison, normalization for bookmaker overround, and model-versus-market percentage-point gaps.
- Chronological walk-forward backtesting using model Brier score, log loss and a historical frequency baseline.
- Optional upcoming fixtures from football-data.org and UK bookmaker 1X2 quotes from The Odds API.

## Vercel deployment

Set Root Directory to probability-lab. The existing premier-league-predictions deployment is independent from this new project.

Optional environment variables (server-side only):

- THE_ODDS_API_KEY: obtains UK EPL h2h (1X2) pre-match quotes.
- FOOTBALL_DATA_API_KEY: obtains upcoming EPL fixtures from football-data.org.

No secrets belong in GitHub or client JavaScript. Without keys, manual odds entry, reference fixture lab and results CSV upload all work. Demo expected-goals figures are explicitly illustrative, not assertions about any club.

## Data rights and compliance

Use data only as licensed or permitted by their providers. Do not embed/redistribute football-data.co.uk CSV files without relevant permission; that website reserves commercial, bot, AI and automated-usage rights. A person's manual import is their responsibility. Before public/commercial release, review API redistribution clauses, UK advertising and affiliate compliance, and age-directed marketing restrictions. This app has no staking, checkout, operator referral links, payment or gambling functions.

No claim of profitable predictions is made.
