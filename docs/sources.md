# Verified source register

The cockpit combines three publisher datasets with a clearly labelled fictional tender scenario. Each published figure exposes its source and actual fetch time. The first live production refresh completed successfully on 22 September 2026 at 22:43 UTC. Carrier surcharges remain unavailable; no value is invented to fill the gap.

## Integrated publishers

| Source | Exact source and format | Cadence and access | Captured sample | Reuse and transformation |
| --- | --- | --- | --- | --- |
| European Commission Weekly Oil Bulletin | [Historical workbook](https://energy.ec.europa.eu/document/download/906e60ca-8b6a-44e7-8589-652854d2fd3f_en?filename=Weekly_Oil_Bulletin_Prices_History_maticni_4web.xlsx), XLSX, discovered on the [official bulletin page](https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en) | Weekly. Robots allows bulletin and download paths. | Austria diesel including taxes: **2.197 EUR/L**, observed 14 September 2026. Original capture **2026-09-22T22:05:42.4114125Z**. 216 retained records, eight countries, 27 weeks. | [EU legal notice](https://commission.europa.eu/legal-notice_en): credit and identification of changes required. EU-owned content generally CC BY 4.0 with exceptions. Divided EUR/1,000 L values by 1,000. |
| European Central Bank | [Daily reference-rate XML](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?cb2af92b4b962bb8feefc7c75f2213f4) | Working days around 16:00 CET. Robots allows path; five-second crawl delay respected. | **1 EUR = 1.1463 USD**, observed 22 September 2026. Original capture **2026-09-22T21:58:25.2835061Z**. 29 currency records. | [ECB notice](https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html): accuracy and ECB attribution required. Informational rates, not transaction prices. |
| U.S. Bureau of Transportation Statistics | [Official Socrata dataset API](https://data.bts.gov/api/v3/views/bw6n-ddqk/query.json), JSON; [API documentation](https://dev.socrata.com/foundry/data.bts.gov/bw6n-ddqk) | Monthly. Data-host robots allows API; minimum two-second host delay used. | Freight TSI **135.7**, July 2026. Captured **2026-09-22T22:14:27.886852+00:00**. Latest 27 months retained. | Public federal statistical series, attributed to BTS. [FRED series](https://fred.stlouisfed.org/series/TSIFRGHT) identifies public-domain status with citation requested. Seasonally adjusted quantity index, 2000 = 100. **U.S. context only; not an EU price input.** |

Observation date and fetch time are different. Source panels report actual dataset timestamps. Re-parsing saved fixtures retains original capture times. Failed refreshes keep last-good files and record the error and stale status in the manifest.

## Carrier research and exclusions

| Carrier / index | Investigated source | Evidence | Decision |
| --- | --- | --- | --- |
| DHL Freight | [Netherlands road and rail surcharges](https://www.dhl.com/nl-en/home/freight/help-center-for-european-road-and-rail/dhl-freight-surcharges.html), HTML | Robots captured **2026-09-22T22:11:30.927025+00:00**, path allowed. Surcharge HTML repeatedly timed out, including 23 September. Research browser showed Europe 17.50% for September 2026 without a timestamped raw response. | **Not integrated.** Research-browser evidence is insufficient for a repeatable parser. No observed figure enters the dataset. |
| DSV Road | [Spain road surcharge page](https://www.dsv.com/es-es/nuestras-soluciones/modos-de-transporte/transporte-por-carretera/servicios-online-y-tasas), HTML | Robots allows access. Research browser displayed 25.5% for 21–27 September 2026. [Terms](https://www.dsv.com/es-es/sobre-dsv/legal-notice) restrict copying to private non-commercial purposes. | **Excluded pending republication permission.** No real-company bids or performance are fabricated. |
| DB Schenker | Investigated legacy public surcharge candidate | Legacy page returned 404; robots request failed. No working raw source verified. | **Not integrated.** No parser relies on an assumed endpoint. |
| Drewry WCI | [Public index commentary](https://www.drewry.co.uk/maritime-research-opinion-browser/world-container-index-assessed-by-drewry), HTML | Research browser showed USD 4,500 per 40-foot container, assessment 17 September 2026. Robots allows commentary with ten-second delay. [Terms](https://www.drewry.co.uk/terms) limit downloaded material to personal/internal use. | **Excluded from public republication.** BTS provides explicitly identified freight context instead. |

The original working-carrier-HTML exit criterion has not been met. The user's instruction to continue allowed remaining work to proceed. The benchmark visibly identifies its synthetic median-bid surcharge fallback. No failed request has been described as a robots ban.

## Geographic evidence

Boundaries: [Natural Earth country GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson), captured **2026-09-22T22:07:22.1776150Z**. Coordinates: [Natural Earth populated places](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson), captured **2026-09-22T22:12:20.692574+00:00**. [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) place the map data in the public domain.

Salzburg is longitude 13.04002, latitude 47.810478. Haversine distances derived from verified city coordinates are **straight-line approximations**, not driving routes.

## Authentic brand assets

Following the user's explicit request for real branding in the white redesign, original logos were obtained from official sites. Asset URLs, timestamps and hashes are in `docs/brand-assets.json`. No mark was redrawn or recoloured.

- [Red Bull header logo](https://www.redbull.com/v3/resources/images/client/header/redbullcom-logo_double-with-text.svg), discovered on the official homepage.
- [DHL logo](https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg), discovered on its homepage.
- Exact inline DSV header SVG from the [official DSV homepage](https://www.dsv.com/en).
- [European Commission logo](https://energy.ec.europa.eu/themes/contrib/oe_theme/dist/ec/images/logo/logo-ec--mute.svg), discovered on the bulletin page.
- [ECB logo](https://www.ecb.europa.eu/shared/img/logo/logo_name.en.svg), discovered on the rates page.

Trademarks identify their respective organisations and do not imply affiliation or endorsement. Carrier logos appear only in carrier-source context. Fictional partner results do not use real carrier identities.

## Audit trail

Original responses and metadata are retained in `docs/probes/responses`. Metadata records exact requested and returned URLs, UTC times, status, content type, bytes and SHA-256, or the actual failure. Search snippets are discovery aids, not production data. Historical first-phase findings are preserved in `docs/phase-1-source-register.md`.
