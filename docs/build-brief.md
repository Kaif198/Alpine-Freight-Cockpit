0. Your role and non-negotiable rules

You are a senior full-stack engineer and product designer building a portfolio demo for a candidate applying to the Logistics Specialist, Global Logistics role at Red Bull in Elsbethen, Austria.

The tool must look like something a logistics specialist in that team would genuinely use, and every number in it must be either verifiably real or clearly labelled as synthetic.

Anti-hallucination rules. These override everything else in this prompt.

Never invent a URL, API endpoint, CSS selector, file format, library, or data value. Before writing any scraper for a source, fetch that source live, inspect the real response, and quote a real sample value with its timestamp in your report.
If a source is unreachable, blocked by robots.txt, behind a login, or its terms forbid automated access, stop and report it. Do not substitute a different source or fake data without asking me first.
Before adding any npm or pip package, confirm it exists and check its latest version by running npm view <pkg> version or pip index versions <pkg>. Pin exact versions.
Synthetic data is allowed only for the fictional 3PL partners, their bids, and their performance history. It must come from a seeded generator script, and every synthetic figure in the UI carries a visible "Synthetic" tag.
Every scraped figure carries its source name, source URL, and fetch timestamp, shown in the UI on hover or in a details panel.
Never claim something works until you have run it. At the end of each phase, run the tests and the build, paste the actual output, and list anything unverified.
Stop at the end of every phase and give me a short report: what was built, what was verified, what is unverified, what you need from me. Wait for my approval before starting the next phase.
If a requirement in this prompt is ambiguous or technically impossible, say so and propose an option. Do not silently work around it.
1. Product context

The Red Bull Logistics Specialist role covers four responsibilities. The dashboard maps directly onto them:

JD responsibility	Dashboard feature
Management of 3PL partners, monitoring inbound and outbound deliveries	3PL Scorecard
Tendering and benchmarking, pricing and performance benchmarks, allocation of shipping volumes	Tender Benchmark and Volume Allocation
Process and project management, automation, ERP data	Automated daily data pipeline, Methodology page
Stakeholder management with local subsidiaries	Overview page written for a non-technical reader

The user of this tool: a logistics specialist in Elsbethen preparing for a European road freight tender, who needs to answer three questions:

Is each 3PL bid fair given current market conditions (diesel, fuel surcharges, FX)?
Which partners are actually performing?
How should volume be split across partners on each lane?

Product name: Alpine Freight Cockpit.

2. Branding and visual identity

Logo. The official Red Bull logo will be supplied by me as a file at web/public/brand/redbull-logo.svg (or .png).

Use only that file. Never redraw, trace, recreate, or generate the logo in code.
Do not alter its colours, proportions, or add effects to it.
Place it in the top-left of the header at a modest size, with clear space around it.
If the file is missing when you reach Phase 5, stop and ask me for it. Do not create a placeholder that imitates it.

Disclaimer. Show this in the footer of every page, and on the Overview page beneath the title:

Independent portfolio demo built by Mohammed Kaif Ahmed. Not affiliated with, endorsed by, or produced for Red Bull GmbH. Red Bull and the Red Bull logo are trademarks of Red Bull GmbH. All 3PL partners, bids, and performance data are synthetic.

Palette. Use these as design tokens. They are chosen to feel on-brand; do not describe them as official brand values anywhere.

Token	Hex	Use
navy-900	
#0A1A33	App background (dark mode default)
navy-700	
#13294B	Cards, panels
navy-500	
#22406E	Borders, hover states
red-500	
#DB0A40	Primary accent, alerts, overpriced flags
yellow-400	
#FFC906	Highlights, recommended option, key numbers
silver-300	
#C4CAD4	Secondary text
white	
#F5F6F8	Primary text
green-500	
#1FB57A	Good performance, fair price

Also build a light theme from the same tokens, toggled from the header, with the preference stored in localStorage (wrapped in try/catch).

Typography. Google Fonts only:

Display and headings: Barlow Condensed, 600 and 700, uppercase for section titles.
Body and data: Inter, 400, 500, 600, with tabular numerals for all figures.
Always define fallback stacks.

Visual language.

Energy through angles: subtle diagonal section dividers and card corner cuts at 8 to 12 degrees.
Alpine motif: a faint topographic contour-line pattern in the header background, drawn as an inline SVG pattern.
A route map of European lanes originating from Salzburg, with animated dashed lines along each lane.
Motion is purposeful and quick: 150 to 250 ms transitions, number count-up on first load, no looping decorative animation. Respect prefers-reduced-motion.
3. Architecture

Why static: the app must never sleep, expire, or need a paid server. A scheduled job refreshes data and commits it; the front end is static.

alpine-freight-cockpit/
  scraper/            Python 3.11 data pipeline
    sources/          one module per data source
    schemas.py        pydantic models for every dataset
    run.py            entry point, runs all sources
    tests/            pytest with saved HTML/CSV/XML fixtures
  synthetic/
    generate.py       seeded generator for 3PLs, bids, performance
  data/               JSON output, committed by the pipeline
    manifest.json     one entry per dataset: status, fetched_at, source_url, record_count
  web/                React + Vite + TypeScript + Tailwind
    src/lib/          pure analytics functions, fully unit tested
    src/pages/
    src/components/
  .github/workflows/
    refresh-data.yml  daily cron, runs scraper, commits data/ if changed
  docs/
    sources.md        verified source register
    methodology.md    every formula and assumption
  README.md

Data contract rules.

Every dataset file has a top-level meta object: source_name, source_url, fetched_at (ISO 8601 UTC), is_synthetic (bool), schema_version.
If a source fails on a run, keep the last good file, set its manifest status to stale, and record the error. Never overwrite good data with empty data.
The UI shows a yellow "Stale" badge on any dataset older than its expected refresh interval plus one day.
4. Phases
Phase 1: Source discovery and verification

No application code in this phase. Probes and documentation only.

Investigate these candidate sources. For each, fetch it live and record the findings in docs/sources.md:

Diesel retail prices by EU country: the European Commission Weekly Oil Bulletin. Find the official downloadable data file (not the HTML article page).
EUR exchange rates: the European Central Bank euro foreign exchange reference rates. Prefer the official data file or API over scraping HTML.
Road freight fuel surcharges: public fuel surcharge pages published by at least two of DHL Freight, DSV Road, and DB Schenker. These are the genuinely scraped HTML sources.
A public container or freight index: one index whose latest value is publicly visible without login.

For each source, record in a table:

Exact URL used
Format (CSV, XML, JSON, XLSX, HTML)
Update frequency, as observed or stated by the publisher
robots.txt result for that path
Terms of use note, quoting the relevant line if any
One real sample value with its fetch timestamp
Verdict: Use / Use with caution / Reject, with a reason

Exit criteria: docs/sources.md complete, at least one working source in each of categories 1 to 3, and a report to me. Stop and wait for approval.

Phase 2: Scraper and data pipeline
One module per approved source. Each module exposes fetch() -> raw and parse(raw) -> list[Model].
Polite scraping: a descriptive User-Agent including a contact email placeholder, a minimum 2 second delay between requests to the same host, a 20 second timeout, and 3 retries with exponential backoff.
Validate every parsed record with pydantic. Reject records that fail rather than coercing them.
run.py writes each dataset to data/<name>.json and updates data/manifest.json.
Tests: save one real response per source as a fixture and test the parser against it. Add a test that a malformed response produces a stale status, not a crash or empty file.
GitHub Actions workflow: daily at 06:00 UTC plus manual trigger, installs pinned dependencies, runs tests, runs the pipeline, commits data/ only if it changed.

Exit criteria: pytest passes, python scraper/run.py produces valid files for every approved source, and the workflow file is valid. Paste real output. Stop and wait.

Phase 3: Synthetic domain data
synthetic/generate.py with a fixed seed, so output is identical on every run.
5 fictional 3PL partners with clearly invented names (for example "Tauern Freight", "Danube Link Logistics"). No real company names.
8 lanes out of Salzburg or Elsbethen to real European cities, for example Hamburg, Milan, Warsaw, Budapest, Lyon, Rotterdam, Prague, Munich. Store origin and destination coordinates and the road distance in km. State in methodology.md how distances were obtained, and do not invent them: use a documented routing source or mark them as straight-line approximations.
Bids: per partner per lane, a base rate in EUR per full truckload, a fuel surcharge percentage, transit days, and weekly capacity in loads.
Performance history: 26 weeks per partner per lane covering OTIF %, damage rate %, claims count, and tender response time in hours. Build in realistic variation, including one partner that is cheap but unreliable and one that is expensive but excellent.
Document every assumption and distribution in docs/methodology.md.

Exit criteria: generator runs, output validates against the schemas, and methodology.md explains every field. Stop and wait.

Phase 4: Analytics engine

Pure TypeScript functions in web/src/lib/, with no UI code and full unit tests (Vitest).

Fair rate benchmark. For each bid, compute a market-adjusted fair rate from the lane distance, current diesel price in the relevant countries against a stated baseline, and the published fuel surcharge levels. Output the percentage deviation of each bid from its fair rate, bucketed as Fair (within 5%), Watch (5 to 12%), or Overpriced (over 12%). Write the exact formula in methodology.md and explain that this is a simplified benchmark model.
3PL scorecard. A weighted score from 0 to 100 combining OTIF, damage rate, claims, response time, and price competitiveness. Default weights are documented and adjustable in the UI. Show each partner's trend over 26 weeks.
Volume allocation. For each lane, split weekly volume across partners to minimise total cost subject to each partner's capacity, a minimum scorecard threshold, and a maximum share per partner (default 60%, for supply resilience). One slider trades off cost against reliability. Use a linear programming library that runs in the browser; verify it exists on npm and works before relying on it. If none is suitable, implement a documented greedy heuristic and label it as such.
Tender savings summary. Total annual cost under the recommended allocation compared with a naive allocation (for example, an equal split), with the assumptions behind the annualisation stated.

Exit criteria: all functions covered by tests, including edge cases (a partner with zero capacity, all partners below threshold, a missing diesel value). Paste test output. Stop and wait.

Phase 5: UI and UX

Read the brand section again before starting. Build these pages:

Overview. Written for a manager, not an analyst. Four headline KPI cards (annual tender value, potential savings, lanes flagged as overpriced, the best-performing partner), the route map, and a three-sentence plain-English summary generated from the data, not hardcoded.
Market Pulse. Diesel price trend by country, current fuel surcharge levels by carrier, EUR exchange rates, and the freight index. Each chart shows its source and fetch time. Stale datasets show the badge.
Tender Benchmark. A table of lanes by partners, with each cell coloured Fair, Watch, or Overpriced and a tooltip explaining the calculation for that exact cell. Sortable and filterable by lane and partner.
3PL Scorecard. One card per partner with a score ring, key metrics, and a 26-week sparkline. A weights panel that updates scores live.
Volume Allocation. Choose a lane, see the recommended split as a stacked bar, move the cost against reliability slider, and watch the split and cost update instantly. Show which constraint is binding.
Methodology. Renders methodology.md and sources.md, so a reviewer can check every number.

UX requirements.

Mobile-first and fully responsive; the benchmark table scrolls horizontally inside its own container on small screens.
Loading skeletons, empty states, and error states for every data-driven component.
WCAG AA contrast in both themes, full keyboard navigation, visible focus states, and aria labels on every chart.
Every synthetic value carries the "Synthetic" tag; every real value can reveal its source.

Exit criteria: npm run build succeeds with no TypeScript errors, all pages work on a 375 px wide viewport and on desktop, and screenshots of every page are included in the report. Stop and wait.

Phase 6: Quality, deployment, and presentation
Lint, typecheck, and all tests pass in CI.
Lighthouse scores of 90 or above for performance, accessibility, and best practices on the Overview page. Paste the real scores.
Deploy the web/ build to Vercel, with the data read from the committed JSON.
README.md with: a one-paragraph pitch, screenshots, the architecture diagram, how to run locally, the data sources table, the disclaimer, and a "What is real and what is synthetic" section.
A 60-second demo script in docs/demo-script.md that I can use in an interview: the problem, one live walkthrough (an overpriced bid, then how the allocation fixes it), and the automation behind it.

Exit criteria: a live URL, a final report listing every verified item and every known limitation.

5. Definition of done
Every real number traces to a verified source with a timestamp.
Every synthetic number is labelled.
No invented URLs, selectors, packages, or values anywhere in the codebase.
Data refreshes automatically every day without any server.
A recruiter can open the link on a phone and understand what the tool does within 10 seconds.