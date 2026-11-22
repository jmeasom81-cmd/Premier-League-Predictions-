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

## Automatic Predictions database connection (v4)

The app automatically loads football-only results and upcoming fixtures from /api/predictions-feed on startup. A Refresh from Predictions control is available in Overview and Data & Methods.

The source is the existing Premier League Predictions Supabase database. The server returns completed Premier League records from historical_league_matches (excluding Championship), completed scored fixtures via the fixtures/results join, and future scheduled fixtures. This feed does not contain user accounts, player predictions, membership, emails, or IDs.

Protection: Vercel stores a sensitive PLP_FEED_TOKEN environment variable. The independent Supabase Edge Function probability-lab-football-feed verifies the request token against a SHA-256 digest before performing strictly whitelisted read-only queries. The browser never receives credentials. Source tables and existing RLS policies are unchanged.

Statistical caution: these football facts reflect what was recorded in our Predictions application, including some manually entered and third-party fallback scores; this is not independent official verification. Scheduled kick-offs can change. The Vercel proxy caches for around five minutes. The client merges incoming matches with stored history using normalized club names and date, prioritising source database corrections on conflicts.

On failure, local imported history remains accessible. The historical dataset and upcoming fixtures can still be edited via existing CSV/Fixture Desk controls.

Verification: source SQL counts show 380 Premier League historical results from 2025/26 and 106 completed 2026/27 results. Basic RLS status was rechecked. The newest Vercel release built READY and a simulated app startup loaded 486 matches, displayed connection status and saved data. Direct authenticated HTTP round-trip testing of the live Edge feed was not possible from the test environment, so verify the Connected badge in the deployed app.

## Historical Premier League archive (v5)

The Data & Methods page now provides a one-click 5/10/15 season importer. OpenFootball (CC0-1.0 public-domain license) supplied the static scorelines in /history-packs/.

Available packages: 2020/21–2024/25 (5 seasons), 2015/16–2024/25 (10 seasons), and 2010/11–2024/25 (15 seasons). Each pack was checked to contain precisely 380 completed Premier League results per season and no duplicate date/team pairs. No football API token or subscription is required to import them.

The import merges with existing local data by match date plus normalized home/away team names. It does not overwrite live Predictions database corrections on overlapping fixtures, and repeated imports are idempotent. The browser's history limit is 7,600 rows to allow 5,700 archived scores plus later seasons. Use the app's backup/export tool if switching devices or browsers.

The probability model's team-specific goal estimates now use up to the last three years of dated matches available before the estimated fixture; earlier seasons are retained for historical trend exploration and chronological audit. The app's audit evaluates at most the latest 1,200 fixtures for responsiveness, without including same-day results in training.

Season statistics preferentially use the provided archive season label, which correctly groups late matches from the Covid-delayed 2019/20 season in July 2020. Fallback seasonal inference from date alone is less reliable for unusual schedules.

Testing: all 15 seasons independently validated (5,700 results and zero fixture/date duplicates). A simulated combined app startup started with 486 results and then tested imports of 5, 10, 15, and a repeated 15 seasons. Result totals were 2,386, 4,286, 6,186, and 6,186. The direct public production UI still requires browser-level visual verification.

## Rich historical match statistics (Match Statistics Studio)

The new **Match Statistics** tab allows individuals to manually download English Premier League season CSVs from the original football-data.co.uk website and import one or more CSV files into their own browser. The site lists available Premier League seasons from 2010/11 through 2025/26. We do not poll, scrape, automatically bulk-download, mirror or republish the original provider files; Football-Data's published fair data usage policy limits automated download to twice a week and states the data is for personal/academic research (https://www.football-data.co.uk/contact.php).

Supported fields: full-time and half-time home/away goals, shots, shots on target, corners, fouls, yellow and red cards. The importer handles BOM, quoted commas, dd/mm/yy and dd/mm/yyyy dates, and skips non-E0 leagues, future unscored fixtures and rows without additional match stats. Missing values stay null and are excluded from the relevant averages.

The imported detailed records are stored in localStorage key pllab_match_stats_v5, separate from the shared Predictions result history and the earlier OpenFootball CC0 archives. Records are deduplicated by fixture date and normalized home/away clubs. Score disagreements with an already loaded result are counted and excluded from comparison rather than silently changing the core match score. Statistics-only records without a corresponding history match are labelled as such.

The comparison screen contrasts two clubs using matching home/away venues and their last 5, 10, 20, 40 or all imported matches. It shows statistical averages and the sample count for each metric; half-time lead conversion and recovery use only matches with both half-time scores. The Match Insights page also displays venue-specific shots, on-target efforts, corners and first-half goals. These are descriptive statistics and are not yet new inputs to the Poisson prediction probabilities.

Portable backup/restore includes the new stats array alongside all previously supported sections, with a 7600-record limit and a 7 MB file-size cap. Existing version-3 backups without the additional key remain compatible.

Functional testing: a 2025/26 CSV-format sample (380 completed Premier League rows) was parsed into 380 detailed records and cross-checked against the OpenFootball archive, with 380 matched scores, no mismatches and no extra records on repeated import. An entire simulated application startup plus import populated the detailed comparisons and Match Insights without a thrown JavaScript exception. Live graphical browser and original-host CSV download still need user-device verification.

## Football-only StatsBomb Open Data Lab (November 2026)

The Match Statistics screen now contains a football-only **Open Data Lab** that is completely separate from the optional CSV importer. It uses [Hudl StatsBomb Open Data](https://github.com/hudl/open-data), not bookmaker feeds or football-data.co.uk, so users can continue to keep Gamban protection enabled.

- Official historical match index is at `open-stats-catalog.json`, containing exactly **380 Premier League games from 2015/16** and **38 Arsenal games from 2003/04**. This is **not** a 15-season advanced-statistics archive. Users can browse all indexed fixtures and select a historic club.
- `/api/open-stats?match=<approved-id>` is a GET-only same-domain serverless endpoint. It will only request a match ID on the hardcoded verified allowlist, downloads the corresponding `data/events/<id>.json` from the official Hudl StatsBomb GitHub open-data repository, and returns a compact aggregate rather than transferring huge event files to mobile clients. It times out after 18 seconds and limits event-file size to 15 MB. Event file access could fail or change; the app shows a non-destructive error.
- `open-stats.js` shows shots, approximate on-target shots, StatsBomb expected goals (sum of shot event `statsbomb_xg`), passes, completed passes, corners, fouls, yellow/red cards and top shooters for the selected archived game. The "last five" button computes a clearly marked historical five-game *sample*, excluding failed matches and null xG data rather than using zeros.
- Source attribution and the original StatsBomb logo from the source repo are displayed in the interface, according to the public open-data README instructions. The repo's own `LICENSE.pdf` and terms govern any external redistribution or new uses.
- StatsBomb source data is for descriptive historical analysis. No post-match event metrics are added to a pre-match prediction model. Betting data, betting endpoints and gambler-protection bypasses are not involved.
- Viewer mode `?viewer=1` can freely explore these READ-only analyses. These requests cannot modify Predictions game data, user accounts, the shared feed, or browser history.
- Tests: source metadata verified for 380+38 fixtures, API aggregate tested with expected xG/shot/pass/card sample events and 404/405 requests, and frontend match and 5-game analysis checked using deterministic service mocks. Live server-to-GitHub connectivity should be checked on Vercel after deployment.

