# Methodology & assumptions

This is an independent portfolio demonstration, not an operational freight quotation system. Published observations are real; all 3PL partners, bids, performance and their derived commercial results are synthetic.

## Published data and provenance

European Commission Weekly Oil Bulletin prices are retail diesel including taxes, converted from EUR per 1,000 litres to EUR per litre by division by 1,000. The latest 27 observed weeks are retained for Austria, Germany, Italy, Poland, Hungary, France, the Netherlands and Czechia. This is a retail fuel signal, not a carrier's procurement cost.

ECB reference rates express foreign-currency units per EUR. A foreign-currency amount converts to EUR by dividing by the corresponding rate. All scenario bids are already in EUR; exchange rates provide context and do not change those bids.

The U.S. Bureau of Transportation Statistics Freight Transportation Services Index is a seasonally adjusted quantity index (2000 = 100). The latest 27 observations are shown for context only. It is not a European road freight price and is never used in the fair-rate model.

Each published dataset records its exact source URL and actual UTC fetch time. Select a source label to inspect them. An age exceeding the expected refresh interval plus one day triggers a stale badge. A failed refresh preserves the previous good file and marks the manifest stale. The pipeline checks robots.txt, identifies itself, spaces requests at least two seconds apart, uses a 20-second request timeout, and retries up to three times with exponential backoff. Publisher crawl delays take precedence when longer.

## Unavailable carrier surcharges

DHL Freight's robots policy permitted the investigated path, but repeated HTML requests timed out. DSV's public website terms restrict republication; no DSV observations are included. DB Schenker's investigated legacy page returned 404. There is currently **no verified carrier HTML dataset**. Following the instruction to continue, the app exposes this limitation and uses the explicitly synthetic surcharge reference below. This falls short of the original requirement for a working carrier HTML source.

## Geography and distances

Natural Earth provides public-domain country boundaries and named populated-place coordinates. Eight lanes originate in Salzburg and end in Hamburg, Milan, Warsaw, Budapest, Lyon, Rotterdam, Prague and Munich. Great-circle distances use the haversine formula with mean Earth radius 6,371.0088 km, rounded to one decimal. These are **straight-line approximations, not road distances**. Curves on the map are schematic. The reproducible extraction is in `docs/probes/prepare-geography.py`.

## Reproducible synthetic scenario

The generator uses Python's random generator with seed **198** and a fixed reference date of **14 September 2026**. This date is a scenario anchor, not a live fetch timestamp. There are five fictional partners, 40 partner–lane bids and 1,040 performance rows (5 partners × 8 lanes × 26 weeks). The generator source is the definitive specification for all distribution parameters.

Partner profiles deliberately span the trade-off: Tauern Freight is balanced; Danube Link Logistics focuses on Central and Eastern Europe; Summit Meridian is premium and reliable; Velora Transit focuses on Western Europe; Lowpass Cargo is inexpensive and less reliable. Names, initials and colours are original demo identities, not actual logistics companies.

The base bid is `(240 + straight_line_km × 1.45) × partner_multiplier × uniform(0.94, 1.09)`, rounded to cents. Partner multipliers, in the order above, are 1.00, 0.95, 1.26, 1.06 and 0.78. Fuel surcharge is uniform from 14% to 22%, rounded to two decimals. Weekly capacity is an integer from 12 to 32 loads. Transit days are `max(1, round(distance / 550) + choice(0, 1))`. These are scenario assumptions, not market observations.

Performance draws use bounded Gaussian variation around partner-specific OTIF, damage and response profiles. Claims use discrete weighted sampling. Partner mean profiles (OTIF %, damage %, response hours) are Tauern (97.1, 0.38, 6.5), Danube (94.8, 0.65, 9.0), Summit (99.3, 0.12, 3.0), Velora (96.6, 0.40, 7.5), Lowpass (86.0, 1.65, 20.0). OTIF uses a per-lane uniform(-1,1) bias and a weekly `(week_index - 12) × 0.025` trend; Gaussian standard deviation 1.15; clamp 0–100. Damage standard deviation 0.12, lower bound zero. Response standard deviation is 17% of its mean, lower bound 0.5 hours. All round to two decimals. Claims take 0, 1, 2, 3 with probabilities 0.90, 0.08, 0.015, 0.005 for four partners; Lowpass uses 0.50, 0.28, 0.17, 0.05. OTIF and damage are percentages; response is hours; claims are counts per partner–lane–week. No shipment denominator exists, so claims are not presented as a shipment-normalised rate.

## Fair-rate reference

For each lane, current diesel is the average of the most recent observations for its origin and destination countries. Baseline diesel is the mean of each country's earliest four retained weeks, averaged across the two countries. Both countries must have data; otherwise the model reports unavailable.

`base_per_km = median(all five synthetic base bids / lane distance)`

`fuel_factor = 1 + 0.30 × (current_diesel / baseline_diesel − 1)`

`fair_rate = lane_distance × base_per_km × fuel_factor × (1 + reference_surcharge / 100)`

`all_in_bid = base_bid × (1 + bid_fuel_surcharge / 100)`

`deviation_percent = (all_in_bid / fair_rate − 1) × 100`

The 30% fuel-cost share is a modelling assumption. In the absence of an approved carrier observation, `reference_surcharge` is the median of the lane's five synthetic bid surcharges. The UI explicitly identifies this fallback. Base cost and surcharge are derived from synthetic bids, so the entire fair-rate result is labelled Synthetic. Distance cancels algebraically when using a per-lane median base rate; this model does not independently estimate road-haulage market cost.

Classification: below −5% is Below benchmark; −5% through +5% is Fair; above +5% through +12% is Watch; above +12% is Overpriced. Deviations round to eight decimal places before boundary comparisons to avoid floating-point boundary errors. This is a simplified negotiation reference, not an independent market quote.

## Partner scorecard

All components are clamped to 0–100. Default weights are OTIF 40%, damage 20%, claims 10%, response 10%, price 20%. User weights are normalised to sum to 100%; an all-zero choice is rejected.

- OTIF component: `(mean_OTIF − 70) / 30 × 100`.
- Damage component: `100 − 40 × mean_damage_percent`.
- Claims component: `100 − 100 × mean_claims_per_partner_lane_week`.
- Response component: `100 − mean_response_hours / 24 × 100`.
- Price component: mean across lanes of `cheapest_all_in_bid_on_lane / partner_all_in_bid × 100`.

The overall score is the weighted mean of these components. Weekly trends repeat the same calculation for each week's performance while holding the current synthetic price component fixed. They are not historical tender prices. Scores use equal-weight observations, not shipment-weighted averages.

## Whole-load volume allocation

The browser solves an integer linear program with `javascript-lp-solver`. Each partner's weekly whole-load quantity is a non-negative integer. Quantities must sum exactly to requested demand, stay within capacity, and be at most `floor(demand × maximum_share)`. Partners below the minimum score receive zero. Defaults are score 72 and maximum share 60%.

Default scenario demand is `floor(35% × sum of the lane's synthetic bid capacities)`. It is a transparent scenario assumption rather than a claimed real shipment volume. The user can change it.

For reliability preference `r` from 0 to 1, minimise the sum of quantities multiplied by:

`(1 − r) × all_in_bid + r × mean_eligible_all_in_bid × 5 × (1 − partner_score / 100)`

The factor 5 calibrates the score penalty; it is an explicit modelling choice. At zero the objective is pure cost. At one it is purely the score penalty. Displayed cost always uses actual synthetic bids, never the penalty. At intermediate settings it is a trade-off objective, not necessarily the cheapest feasible allocation. Infeasible cases display a reason without a fabricated solution. Binding capacity and share constraints are shown per allocated partner.

## Annual comparison

The baseline distributes whole loads round-robin as equally as possible across all five partners while respecting their capacities, including partners below the recommended score threshold. It does not apply the recommended share limit. Identical weekly demand and rates repeat for 52 weeks, with no seasonality or escalation.

`annual_cost = weekly_cost × 52`; `savings = baseline_annual_cost − recommended_annual_cost`.

Negative savings are shown as additional reliability investment. Overview totals cover the eight default scenarios; changing an individual allocation is exploratory and does not silently overwrite the portfolio defaults.

## Verification and limitations

Parsers are tested against captured real source responses, not invented fixtures. Failure tests check last-good-file preservation. Analytics tests cover benchmark boundaries, missing country data, score weights, infeasible demand, zero capacity, integer constraints and comparison with exhaustive small-case enumeration. Browser checks and audit results are recorded separately in `docs/verification`.

This release has no working carrier HTML feed, no routing-based road distances and no shipment-level operational records. Published-data availability depends on third parties. The later white-redesign request authorised authentic branding. Official Red Bull, DHL, DSV, European Commission and ECB assets were obtained from their own websites; their provenance is recorded in the source register. No imitation logo is generated.

Independent portfolio demo built by Mohammed Kaif Ahmed. Not affiliated with, endorsed by, or produced for Red Bull GmbH. Red Bull and the Red Bull logo are trademarks of Red Bull GmbH. All 3PL partners, bids, and performance data are synthetic.
