import { describe, expect, it } from 'vitest'
import { allocate, allIn, annualSavings, benchmark, DEFAULT_WEIGHTS, equalSplit, isStale, median, scenarioDemand, scorePartners } from './analytics'
import type { Bid, Lane, Meta, Partner, Performance } from './types'

const bids: Bid[] = [100,120,160].map((price,i)=>({partner_id:`p${i}`,lane_id:'lane',base_eur:price,fuel_percent:20,transit_days:1,weekly_capacity:10}))
const scores = {p0:75,p1:85,p2:99}
const lane: Lane = {id:'lane',origin:{name:'Salzburg',country:'AT',latitude:47,longitude:13},destination:{name:'Munich',country:'DE',latitude:48,longitude:11},distance_km:100,distance_method:'test fixture'}
const diesel = ['AT','DE'].map(country=>({country,date:'2026-09-14',eur_per_litre:2}))

describe('benchmark',()=>{
  it('computes the documented fair-rate formula',()=>{ const b=benchmark(bids[1],lane,bids,diesel); expect(b.available).toBe(true); if(b.available){expect(b.fairRate).toBeCloseTo(144); expect(b.bucket).toBe('Fair');expect(b.reference).toContain('Synthetic')} })
  it('uses a real surcharge when supplied',()=>{const b=benchmark(bids[1],lane,bids,diesel,[{carrier:'test',scope:'test',date:'2026-09-14',percent:10}]);if(b.available)expect(b.fairRate).toBeCloseTo(132)})
  it('does not invent missing diesel',()=>expect(benchmark(bids[0],lane,bids,[]).available).toBe(false))
  it('separates inexpensive bids from overpriced ones',()=>{expect(benchmark(bids[0],lane,bids,diesel)).toMatchObject({bucket:'Below benchmark'}); expect(benchmark(bids[2],lane,bids,diesel)).toMatchObject({bucket:'Overpriced'})})
  it('classifies boundary and watch rates',()=>{expect(benchmark({...bids[1],base_eur:132},lane,bids,diesel)).toMatchObject({bucket:'Watch'});expect(benchmark({...bids[1],base_eur:126},lane,bids,diesel)).toMatchObject({bucket:'Fair'})})
})
describe('integer allocation',()=>{
  it('does not allocate to a partner with no measured score even at a zero threshold',()=>{const a=allocate(bids,{p1:85,p2:99},10,0,.6,0);expect(a.feasible).toBe(true);expect(a.rows.every(r=>r.bid.partner_id!=='p0')).toBe(true)})
  it('rejects non-finite share and reliability controls',()=>{expect(allocate(bids,scores,10,70,NaN).feasible).toBe(false);expect(allocate(bids,scores,10,70,.6,NaN).feasible).toBe(false)})
  it('minimises cost with a binding share constraint',()=>{const a=allocate(bids,scores,10,70,.6,0);expect(a.feasible).toBe(true);expect(a.rows.map(r=>r.loads)).toEqual([6,4]);expect(a.totalCost).toBe(1296);expect(a.rows[0].constraints).toContain('Maximum share')})
  it('excludes zero capacity',()=>{const a=allocate([{...bids[0],weekly_capacity:0},...bids.slice(1)],scores,10,70,.6,0);expect(a.rows.every(r=>r.bid.partner_id!=='p0')).toBe(true)})
  it('reports when all partners are below threshold',()=>expect(allocate(bids,scores,10,100).feasible).toBe(false))
  it('reports infeasibility caused by integer share caps',()=>expect(allocate(bids,scores,1,70,.6).feasible).toBe(false))
  it('raises reliability when the slider moves',()=>expect(allocate(bids,scores,10,70,.6,1).weightedScore).toBeGreaterThan(allocate(bids,scores,10,70,.6,0).weightedScore))
  it('handles zero and invalid demand',()=>{expect(allocate(bids,scores,0).feasible).toBe(true);expect(allocate(bids,scores,-1).feasible).toBe(false);expect(allocate(bids,scores,2.5).feasible).toBe(false)})
  it('agrees with exhaustive enumeration on a small problem',()=>{const a=allocate(bids,scores,5,0,.6,0);let best=Infinity;for(let x=0;x<=3;x++)for(let y=0;y<=3;y++)for(let z=0;z<=3;z++)if(x+y+z===5)best=Math.min(best,x*120+y*144+z*192);expect(a.totalCost).toBe(best)})
})
describe('scorecards and summaries',()=>{
  const partners: Partner[]=[{id:'p0',name:'Test',initials:'T',colour:'#fff',specialty:'Test'}]
  const history: Performance[]=[{partner_id:'p0',lane_id:'lane',week:'2026-09-14',otif:100,damage:0,claims:0,response_hours:1}]
  it('normalises weights and calculates trend',()=>{const a=scorePartners(partners,bids,history,DEFAULT_WEIGHTS);const b=scorePartners(partners,bids,history,{otif:80,damage:40,claims:20,response:20,price:40});expect(a[0].score).toBeCloseTo(b[0].score);expect(a[0].trend).toHaveLength(1)})
  it('rejects all-zero weights',()=>expect(()=>scorePartners(partners,bids,history,{otif:0,damage:0,claims:0,response:0,price:0})).toThrow())
  it('does not treat absent history as excellent',()=>expect(scorePartners(partners,bids,[])[0].score).toBe(0))
  it('computes fair medians and all-in values',()=>{expect(median([4,1,3,2])).toBe(2.5);expect(median([])).toBe(0);expect(allIn(bids[0])).toBe(120)})
  it('returns feasible equal baseline and negative savings honestly',()=>{expect(equalSplit(bids,3)).toBe(456);expect(equalSplit(bids,31)).toBeNull();expect(annualSavings(100,120).savings).toBe(-1040);expect(scenarioDemand(bids)).toBe(10)})
  it('detects stale data, excluding fixed synthetic scenarios',()=>{const meta={is_synthetic:false,fetched_at:'2026-01-01T00:00:00Z',expected_refresh_days:7} as Meta; expect(isStale(meta,Date.parse('2026-01-10'))).toBe(true);expect(isStale({...meta,is_synthetic:true},Date.parse('2026-01-10'))).toBe(false)})
})
