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


## Version 3: API-free workflows

- **Fixture Desk:** enter real upcoming fixtures manually, including kickoff date/time (local browser time); save and remove them. User-entered fixtures are flagged as unverified.
- **Match Insights:** compares the home club's recent home results to the away club's recent away results, displaying sample sizes, W/D/L, goals, BTTS, clean sheets and head-to-head meetings.
- **Scenario Studio:** use transparent goal-rate adjustments to explore home/draw/away, goals, and exact-score probability sensitivity. If there isn't enough real club history, the goal means are explicitly illustrative.
- **Season trends:** group imported dated matches by July–June seasons, with observed 1X2 percentages, goals and Wilson intervals for sample-frequency estimates. Partially imported seasons must not be interpreted as full league statistics.
- **Data quality:** report missing dates, potentially duplicated fixtures, future-dated results, coverage and dataset size. With an optional Div CSV column, import only rows marked E0, PL, EPL, or Premier League.
- **Offline persistence:** manual fixtures and manually quoted odds survive page refresh in this browser; odds quotes include a capture timestamp.
- **Portable backup:** download/restore validated local JSON containing historic results, saved manually entered fixtures and odds, and original pre-match prediction journal snapshots; export results in CSV format.
- **Graceful setup:** /api/config reports only boolean API readiness (never credentials). The app runs offline without attempting failing feed calls until configured.

Never interpret numerical model-versus-bookmaker differences as proven profitable prices or guarantees. Model performance is evaluated by strictly prior-dated data; same-day matches are excluded from the training history during backtests.

### Verification

The standalone app scripts were syntax-checked and exercised together using simulated populated/empty match histories. Expected outcomes from the core Poisson probability matrix were checked to sum to approximately 100%. This is not a full end-to-end browser or sportsbook integration test; validate provider subscriptions and rendering in production when keys are available.
