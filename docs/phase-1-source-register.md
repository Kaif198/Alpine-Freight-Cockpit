# Alpine Freight Cockpit — source verification register

Phase 1 investigation: 22 September 2026 UTC (23 September in Asia/Calcutta).

**Status: investigation documented; Phase 1 exit gate NOT met.** Official diesel and FX files were downloaded and inspected. Road-surcharge candidates were inspected, but none is cleared for the automated public demo yet. No production scraper, application, synthetic data, or deployment has been created. No alternative source has been substituted.

## Evidence conventions

- Direct HTTP probes are saved under `docs/probes/responses/`. Each `.meta.json` records the exact requested and final URL, UTC request timestamp, status, byte count, and SHA-256, or the actual error.
- `fetched_at` in those records is request-start time; `completed_at` is completion time. Neither is the publisher's observation date.
- The web research tool also opened publisher HTML pages during this session. It does not expose an exact origin-fetch timestamp or raw HTTP response. Those observations are explicitly provisional, with `fetched_at: unavailable`; they must not be promoted to timestamped production data.
- Search snippets are discovery aids only. Samples below came from opened pages or downloaded files, not snippets. Opening pages showed newer values than search snippets for DSV and ECB.
- A robots allowance does not grant republication rights. A timeout is not a robots denial, but does leave the policy unverified.

## Source register

| Category / publisher | Exact data URL and format | Refresh frequency | robots.txt result for path | Terms note | Real sample and retrieval evidence | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| EU retail diesel — European Commission Weekly Oil Bulletin | [Official XLSX](https://energy.ec.europa.eu/document/download/264c2d0f-f161-4ea3-a777-78faae59bea0_en?filename=Weekly%20Oil%20Bulletin%20Weekly%20prices%20with%20Taxes%20-%202024-02-19.xlsx), discovered in the [bulletin page](https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en). XLSX, verified ZIP/OOXML contents. | Weekly; page describes Wednesday submissions and Thursday circulation. | [Policy](https://energy.ec.europa.eu/robots.txt): HTTP 200; wildcard group does not disallow the bulletin or `/document/download/` paths. Saved `ec-robots.txt`. | [EU legal notice](https://commission.europa.eu/legal-notice_en): “reuse is allowed, provided appropriate credit is given and changes are indicated.” EU-owned content generally CC BY 4.0; exceptions include logos and third-party works. | Austria automotive diesel: **2,197 EUR / 1,000 litres**, observation date **2026-09-14**. `Sheet1!A3=Austria`, `C3=2197`, `C2=1000 l`, `A2=46279`. Fetched **2026-09-22T21:58:24.9731061Z**. HTTP 200, 14,237 bytes. | **Use.** Preserve units, observation date, tax basis, attribution and transformations. |
| EUR FX — European Central Bank | [Official daily XML](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?cb2af92b4b962bb8feefc7c75f2213f4), linked from the [reference-rate page](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html). XML. | Working days, around 16:00 CET, excluding TARGET closing days (publisher statement). | [Policy](https://www.ecb.europa.eu/robots.txt): HTTP 200; XML path not disallowed; **Crawl-delay: 5**. Saved `ecb-robots.txt`. | [ECB copyright](https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html): “it must appear accurately and the ECB must be cited as the source.” Identify transformations; rates are informational. | **1 EUR = 1.1463 USD**, observation date **2026-09-22**. Raw sample: `<Cube currency='USD' rate='1.1463'/>`. Fetched **2026-09-22T21:58:25.2835061Z**. HTTP 200, 1,547 bytes; 29 currency records. | **Use.** Reference rates, not executable transaction prices. Honor the five-second host delay. |
| Road fuel surcharge — DHL Freight, Netherlands site | [Road surcharge page](https://www.dhl.com/nl-en/home/freight/help-center-for-european-road-and-rail/dhl-freight-surcharges.html). HTML opened using web research. | Monthly, observed from the 2026 history table. | [Policy](https://www.dhl.com/robots.txt): direct request **timed out after 20 seconds**, started **2026-09-22T21:56:52.0716539Z**. Policy unknown; no direct scraper attempted after failure. Error saved as `dhl-robots.txt.meta.json`. | [DHL terms](https://www.dhl.com/nl-en/home/footer/terms-of-use.html): “The material may be used for information and non-commercial purposes only.” Other conditions prohibit modification, require copyright credit, and restrict trademark copying. | Opened HTML shows **Europe 17.50%**, **Netherlands 29.50%**, effective **September 2026**. Web observation during 21:55–21:59 UTC; exact `fetched_at` unavailable. This is discovery evidence, not approved pipeline data. | **Use with caution — HOLD.** Access policy and direct raw-response capture unresolved. Confirm reproduction/derived-use scope before public integration. |
| Road fuel surcharge — DSV Road Spain | [Road fuel-surcharge page](https://www.dsv.com/es-es/nuestras-soluciones/modos-de-transporte/transporte-por-carretera/servicios-online-y-tasas). HTML opened using web research. | Weekly, explicitly stated on the page. | [Policy](https://www.dsv.com/robots.txt): HTTP 200; wildcard group has sitemap entries and no disallows. Saved `dsv-robots.txt`. | [DSV legal notice](https://www.dsv.com/es-es/sobre-dsv/legal-notice), Content: “Usted no podrá copiar el Contenido del presente sitio web salvo para fines privados no comerciales”. Further republication requires permission subject to applicable-law exceptions. | Opened HTML shows **25.5% for 21–27 September 2026**, and a future **27% for 28 September–4 October 2026**. Web observation during 21:55–21:59 UTC; exact `fetched_at` unavailable. | **Reject for the planned public pipeline pending permission.** Technical visibility alone does not resolve the stated private-use/republication restrictions. Work on this source stopped. |
| Public container index — Drewry World Container Index | [Public WCI commentary](https://www.drewry.co.uk/maritime-research-opinion-browser/world-container-index-assessed-by-drewry). HTML; headline/commentary visible in opened page without login, charts embedded separately. | Weekly; page describes its Thursday assessment. | [Policy](https://www.drewry.co.uk/robots.txt): HTTP 200; commentary path not disallowed; **Crawl-delay: 10**. Saved `drewry-robots.txt`. | [Terms](https://www.drewry.co.uk/terms), User Conduct: “User may use downloaded material only for User's personal, internal use.” | Opened page reports **USD 4,500 per 40-foot container**, assessment date **2026-09-17**. Web observation during 21:55–21:59 UTC; exact `fetched_at` unavailable. | **Reject for public republication pending permission.** Public visibility is verified, public-demo reuse is not. The page also advertises registration for its index hub; no login or embedded-chart bypass attempted. |

## Diesel file observations

The download's query filename contains `2024-02-19`, but its worksheet date is **2026-09-14**. The linking page labels the release **17 September 2026**. Do not infer data freshness from the filename or page release date: parse the date inside the workbook. This was verified by opening the XLSX ZIP with built-in .NET tools and inspecting its XML; no spreadsheet package was installed.

The diesel column is explicitly labelled automotive gas oil, and its unit is 1,000 litres. Austria's per-litre display would be `2197 / 1000 = 2.197 EUR/L`, a derived conversion that must retain original units in provenance. There are 27 country rows and two aggregate rows; aggregates must not become fictitious countries. The workbook is a tax-inclusive retail reference, not a verified negotiated fleet pump price.

The publisher also links a historical workbook. It has **not** been downloaded or validated in this phase. Therefore a diesel trend chart is not yet supported by verified history; do not manufacture a trend from the single current snapshot.

## FX observations

The actual XML uses nested `Cube` elements in the ECB namespace and a dated parent element. Its base currency is EUR. PLN, HUF, CZK and other currency figures are units of the foreign currency per EUR; converting a foreign-currency bid into EUR requires division. The daily file is verified; historical XML is linked by the page but not downloaded or tested.

## Surcharge and index scope

- DHL's Europe and Netherlands series differ. They are published carrier-product references, not a universal tariff for Salzburg-origin full truckloads.
- DSV Spain is also market-specific. A parser would need effective-from and effective-to dates so an announced future surcharge does not replace the currently applicable rate.
- DSV and DHL Express/parcel/air surcharges were not adopted as substitutes for road-freight surcharges.
- Two named carrier candidates were investigated (DHL Freight and DSV Road). DB Schenker was not investigated as an additional candidate after the source blockers were identified; no assumption is made about its current endpoints.
- Drewry WCI is ocean-container context, not an input that can be silently treated as a European road-freight price index.

## Decisions required

1. Approve investigation of alternative public road-surcharge and freight-index sources, or provide permission/licensed feeds for the named sources. This approval was requested; no replacement has been selected.
2. Resolve DHL policy/raw-response verification before treating it as a working automated source. The timeout has not been labelled a ban and no bypass has been attempted.
3. Approve Phase 2 only after the source gate is resolved. EC and ECB are ready for that phase; the surcharge category is not.

## Later-phase ambiguities recorded now

- The prompt permits synthetic figures only for partners, bids and performance, while later analytics need weekly demand, a base EUR/km benchmark and a diesel baseline. These must be derived from verified observations or explicitly approved as labelled modelling assumptions before implementation.
- Distance must use a verified routing source or clearly labelled straight-line approximations. No distances or coordinates were invented here.
- Classification is ambiguous for bids more than 5% below the fair rate. Define the under-benchmark treatment in Phase 4 rather than silently classifying cheap bids as overpriced.
- Only the user-supplied `web/public/brand/redbull-logo.svg` or `.png` is allowed under the brief. That file is absent in this empty repository. It is needed before Phase 5; no imitation or substitute has been created.

## Phase 1 verification scope

See [phase-1-report.md](phase-1-report.md) and [probes/verification-output.txt](probes/verification-output.txt) for actual local check output. Application build and application tests are not available: Phase 1 explicitly prohibits application code. No packages were added, so there are no unverified package versions. Production scrapers, parser tests, CI, synthetic records, analytics, UI, accessibility, screenshots and deployment remain unbuilt and unverified.
