import solver from 'javascript-lp-solver'
import type { Allocation, Bid, Diesel, Lane, Meta, Partner, PartnerScore, Performance, Surcharge, Weights } from './types'

export const DEFAULT_WEIGHTS: Weights = { otif: 40, damage: 20, claims: 10, response: 10, price: 20 }
export const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
export function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); if (!sorted.length) return 0; const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2 }
export const allIn = (bid: Bid) => bid.base_eur * (1 + bid.fuel_percent / 100)
export function isStale(meta: Meta, now = Date.now()) { return !meta.is_synthetic && now - Date.parse(meta.fetched_at) > (meta.expected_refresh_days + 1) * 86400000 }
export function observationStale(meta: Meta, dates: string[], lagDays = 0, now = Date.now()) { return isStale(meta, now) || (!meta.is_synthetic && !!dates.length && now - Date.parse([...dates].sort().at(-1)!) > (meta.expected_refresh_days + 1 + lagDays) * 86400000) }

export function benchmark(bid: Bid, lane: Lane, laneBids: Bid[], diesel: Diesel[], surcharge: Surcharge[] = []) {
  const countries = [lane.origin.country, lane.destination.country]
  const current: number[] = [], baseline: number[] = []
  for (const country of countries) {
    const history = diesel.filter(d => d.country === country).sort((a, b) => a.date.localeCompare(b.date))
    if (!history.length) return { available: false as const, reason: `Missing diesel reference for ${country}` }
    current.push(history.at(-1)!.eur_per_litre)
    baseline.push(mean(history.slice(0, 4).map(x => x.eur_per_litre)))
  }
  if (!laneBids.length || lane.distance_km <= 0 || mean(baseline) <= 0) return { available: false as const, reason: 'Missing benchmark baseline' }
  const basePerKm = median(laneBids.map(b => b.base_eur / lane.distance_km))
  const fuelAdjustment = 1 + .3 * (mean(current) / mean(baseline) - 1)
  const referenceSurcharge = surcharge.length ? median(surcharge.map(s => s.percent)) : median(laneBids.map(b => b.fuel_percent))
  const fairRate = lane.distance_km * basePerKm * fuelAdjustment * (1 + referenceSurcharge / 100)
  const deviation = Number(((allIn(bid) / fairRate - 1) * 100).toFixed(8))
  const bucket = deviation < -5 ? 'Below benchmark' : deviation <= 5 ? 'Fair' : deviation <= 12 ? 'Watch' : 'Overpriced'
  return { available: true as const, fairRate, deviation, bucket, basePerKm, fuelAdjustment, referenceSurcharge, dieselCurrent: mean(current), dieselBaseline: mean(baseline), reference: surcharge.length ? 'Published surcharge reference' : 'Synthetic bid-median surcharge reference' }
}

export function scorePartners(partners: Partner[], bids: Bid[], history: Performance[], weights: Weights = DEFAULT_WEIGHTS): PartnerScore[] {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  if (!totalWeight || Object.values(weights).some(w => w < 0 || !Number.isFinite(w))) throw new Error('At least one positive, finite score weight is required')
  return partners.map(partner => {
    const rows = history.filter(h => h.partner_id === partner.id)
    const ownBids = bids.filter(b => b.partner_id === partner.id)
    const price = mean(ownBids.map(b => clamp(100 * Math.min(...bids.filter(x => x.lane_id === b.lane_id).map(allIn)) / allIn(b))))
    const calculate = (r: Performance[]) => {
      if (!r.length) return 0
      const otif = mean(r.map(p => p.otif)), damage = mean(r.map(p => p.damage)), claims = mean(r.map(p => p.claims)), response = mean(r.map(p => p.response_hours))
      return (clamp((otif - 70) / 30 * 100) * weights.otif + clamp(100 - damage * 40) * weights.damage + clamp(100 - claims * 100) * weights.claims + clamp(100 - response / 24 * 100) * weights.response + price * weights.price) / totalWeight
    }
    return { partner, score: calculate(rows), otif: mean(rows.map(p => p.otif)), damage: mean(rows.map(p => p.damage)), claims: rows.reduce((s, r) => s + r.claims, 0), response: mean(rows.map(p => p.response_hours)), price, trend: [...new Set(rows.map(r => r.week))].sort().map(week => calculate(rows.filter(r => r.week === week))) }
  }).sort((a, b) => b.score - a.score)
}

export function scenarioDemand(bids: Bid[]) { return Math.floor(bids.reduce((n, b) => n + b.weekly_capacity, 0) * .35) }

export function allocate(bids: Bid[], scores: Record<string, number>, demand: number, threshold = 72, maxShare = .6, reliability = .25): Allocation {
  const fail = (reason: string): Allocation => ({ feasible: false, rows: [], totalCost: 0, weightedScore: 0, demand, reason })
  if (!Number.isInteger(demand) || demand < 0 || !Number.isFinite(threshold) || threshold < 0 || threshold > 100 || !Number.isFinite(maxShare) || !Number.isFinite(reliability) || maxShare <= 0 || maxShare > 1 || reliability < 0 || reliability > 1) return fail('Invalid allocation settings')
  if (demand === 0) return { ...fail('No volume requested'), feasible: true }
  const eligible = bids.filter(b => b.weekly_capacity > 0 && Number.isFinite(scores[b.partner_id]) && scores[b.partner_id] >= threshold)
  const shareLimit = Math.floor(demand * maxShare)
  if (eligible.reduce((n, b) => n + Math.min(b.weekly_capacity, shareLimit), 0) < demand) return fail('Not enough eligible capacity. Lower the score threshold, increase maximum share, or reduce weekly volume.')
  const avgCost = mean(eligible.map(allIn))
  const constraints: Record<string, { equal?: number; max?: number }> = { demand: { equal: demand } }
  const variables: Record<string, Record<string, number>> = {}, ints: Record<string, 1> = {}
  eligible.forEach((b, i) => {
    const key = `p${i}`
    constraints[key] = { max: Math.min(b.weekly_capacity, shareLimit) }
    variables[key] = { demand: 1, [key]: 1, objective: (1 - reliability) * allIn(b) + reliability * avgCost * 5 * (1 - scores[b.partner_id] / 100) }
    ints[key] = 1
  })
  const result = solver.Solve({ optimize: 'objective', opType: 'min', constraints, variables, ints }) as { feasible: boolean; [key: string]: number | boolean }
  if (!result.feasible) return fail('No feasible allocation under these constraints')
  const rows = eligible.map((bid, i) => {
    const loads = Math.round(Number(result[`p${i}`] ?? 0))
    return { bid, loads, score: scores[bid.partner_id], cost: loads * allIn(bid), constraints: [loads === bid.weekly_capacity ? 'Capacity limit' : '', loads === shareLimit ? 'Maximum share' : ''].filter(Boolean) }
  }).filter(r => r.loads > 0)
  if (rows.reduce((sum, row) => sum + row.loads, 0) !== demand || rows.some(r => r.loads > r.bid.weekly_capacity || r.loads > shareLimit)) return fail('Solver result failed constraint validation')
  return { feasible: true, rows, totalCost: rows.reduce((s, r) => s + r.cost, 0), weightedScore: rows.reduce((s, r) => s + r.score * r.loads, 0) / demand, reason: 'Integer linear programming · globally optimised objective', demand }
}

export function equalSplit(bids: Bid[], demand: number): number | null {
  if (!Number.isInteger(demand) || demand < 0 || bids.reduce((s, b) => s + b.weekly_capacity, 0) < demand) return null
  const assigned = bids.map(() => 0)
  let remaining = demand
  while (remaining > 0) for (let i = 0; i < bids.length && remaining > 0; i++) if (assigned[i] < bids[i].weekly_capacity) { assigned[i]++; remaining-- }
  return assigned.reduce((s, count, i) => s + count * allIn(bids[i]), 0)
}
export function annualSavings(baseline: number, recommended: number, weeks = 52) { if (![baseline, recommended, weeks].every(Number.isFinite) || weeks < 0) throw new Error('Invalid annualisation inputs'); return { baseline: baseline * weeks, recommended: recommended * weeks, savings: (baseline - recommended) * weeks, percent: baseline > 0 ? (baseline - recommended) / baseline * 100 : 0 } }
