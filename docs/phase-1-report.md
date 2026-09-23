# Phase 1 report — Alpine Freight Cockpit

**Outcome: source discovery is documented, but the Phase 1 exit criteria are not yet met.** No application development has started.

## What was built

- Cloned the supplied empty GitHub repository into the selected workspace.
- Created [sources.md](sources.md) with exact discovered URLs, response formats, refresh frequencies, robots checks, short terms quotations, observed samples, verdicts and limitations.
- Added dependency-free PowerShell probes and saved original EU/ECB files, robots policies, response metadata and hashes.
- Preserved the user's supplied instructions in [build-brief.md](build-brief.md) for the subsequent phases.

## What was verified

- EU diesel XLSX downloaded successfully and inspected as actual OOXML: Austria 2,197 EUR per 1,000 litres, dated 14 September 2026. The legacy query filename is not the observation date.
- ECB XML downloaded successfully and parsed: 29 rates dated 22 September 2026; USD 1.1463 per EUR.
- EU and ECB reuse notices inspected, and their relevant data paths are not excluded by the saved robots policies. ECB requests must observe a five-second interval.
- DHL Freight and DSV Road HTML rates are visible in opened publisher pages. The regional and effective-date distinctions are recorded, without adopting these observations as production records.
- Drewry's latest public WCI commentary contains a visible value, but its terms limit downloaded material to personal/internal use.
- All ten successful saved HTTP responses match their recorded hashes. DHL's policy timeout is recorded rather than treated as a successful access check.

## Actual validation output

Command: `& './docs/probes/verify.ps1'`

```text
RECORDED FAILURE: https://www.dhl.com/robots.txt -- The request was canceled due to the configured HttpClient.Timeout of 20 seconds elapsing.
PASS: drewry-robots.txt HTTP 200; SHA-256 matches
PASS: dsv-robots.txt HTTP 200; SHA-256 matches
PASS: ec-bulletin.html HTTP 200; SHA-256 matches
PASS: ec-legal.html HTTP 200; SHA-256 matches
PASS: ec-prices-with-taxes.xlsx HTTP 200; SHA-256 matches
PASS: ec-robots.txt HTTP 200; SHA-256 matches
PASS: ecb-daily.xml HTTP 200; SHA-256 matches
PASS: ecb-legal.html HTTP 200; SHA-256 matches
PASS: ecb-rates.html HTTP 200; SHA-256 matches
PASS: ecb-robots.txt HTTP 200; SHA-256 matches
ECB XML: date=2026-09-22; currencies=29; USD per EUR=1.1463
EC workbook: date=2026-09-14; country=Austria; diesel=2197 EUR/1000 l
Evidence summary: 10 successful HTTP responses verified; 1 recorded access failure(s).
Application tests: NOT RUN -- Phase 1 contains no application or test suite.
Application build: NOT RUN -- Phase 1 contains no application or build configuration.
Phase 1 exit gate: NOT MET -- no road-surcharge source approved for automated public use.
```

The evidence-check command exited 0 after fixing its timestamp conversion for PowerShell's automatically decoded JSON dates. That means the saved evidence is internally consistent; it does not mean the blocked source gate or any application tests passed.

## Unverified or blocked

- DHL robots policy: one direct 20-second request timed out. This is not proof of a ban. Direct data-response capture and public-use scope remain unresolved.
- DSV: inspected terms restrict copying/republication; no production scraper or public dataset was created.
- Drewry: public visibility does not resolve its personal/internal-use restriction. No alternative index was selected.
- Exact origin-fetch timestamps and byte-for-byte responses for the web-tool carrier/index observations are unavailable. The register identifies them as provisional research evidence.
- No verified historical diesel or FX series yet. No parser tests, pipeline, synthetic generator, analytics, UI, browser checks, screenshots, Lighthouse audit, scheduled refresh or deployment exists.
- The requested Python 3.11 runtime was not found on the current command path. No replacement runtime or package was installed during this probes-only phase.
- No official Red Bull logo was supplied in the repository. The brief requires the user's file before Phase 5.
- Changes are local; no commit or push was performed.

## What is needed from the user

Approve investigation of alternative public road-surcharge and freight-index sources, or provide the necessary permissions/licensed feeds for the named sources. Retrying DHL policy verification can also be approved. No alternate source will be silently substituted.

Once a usable road-surcharge source is verified and the source register is approved, Phase 2 can begin. The user's brief explicitly requires a stop and approval at each phase boundary; this checkpoint comes from that brief, not from a skill or an automatic approval rejection.
