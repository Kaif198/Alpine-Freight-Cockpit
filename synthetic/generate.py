"""Deterministic fictional bids and partner history. Every output is synthetic."""
import json, random, sys
from datetime import date, timedelta
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scraper.schemas import Meta, Partner, Bid, Performance, Lane
from scraper.run import atomic_json

SEED = 198
ANCHOR = date(2026,9,14)


def generate():
    rng = random.Random(SEED)
    lanes = [Lane.model_validate(x) for x in json.loads((ROOT/'data/lanes.json').read_text())['records']]
    specifications = [
        ('tauern','Tauern Freight','TF','#DB0A40','Balanced network',1.00,97.1,0.38,6.5),
        ('danube','Danube Link Logistics','DL','#2468A0','Central & Eastern Europe',0.95,94.8,0.65,9.0),
        ('summit','Summit Meridian','SM','#68559B','Premium reliability',1.26,99.3,0.12,3.0),
        ('velora','Velora Transit','VT','#238269','Western Europe specialist',1.06,96.6,0.40,7.5),
        ('lowpass','Lowpass Cargo','LC','#B57026','Budget linehaul',0.78,86.0,1.65,20.0),
    ]
    partners=[]; bids=[]; history=[]
    for pid,name,initials,colour,specialty,multiplier,otif,damage,response in specifications:
        partners.append(Partner(id=pid,name=name,initials=initials,colour=colour,specialty=specialty).model_dump())
        for lane in lanes:
            bids.append(Bid(partner_id=pid,lane_id=lane.id,base_eur=round((240 + lane.distance_km*1.45)*multiplier*rng.uniform(.94,1.09),2),fuel_percent=round(rng.uniform(14,22),2),transit_days=max(1,round(lane.distance_km/550)+rng.choice([0,1])),weekly_capacity=rng.randint(12,32)).model_dump())
            lane_bias=rng.uniform(-1,1)
            for i in range(26):
                week=ANCHOR-timedelta(weeks=25-i)
                history.append(Performance(partner_id=pid,lane_id=lane.id,week=week.isoformat(),otif=round(min(100,max(0,rng.gauss(otif+lane_bias+(i-12)*.025,1.15))),2),damage=round(max(0,rng.gauss(damage,.12)),2),claims=rng.choices([0,1,2,3],[.90,.08,.015,.005] if pid!='lowpass' else [.5,.28,.17,.05])[0],response_hours=round(max(.5,rng.gauss(response,response*.17)),2)).model_dump())
    meta=Meta(source_name=f'Seeded fictional tender scenario (seed {SEED})',source_url='synthetic/generate.py',fetched_at=ANCHOR.isoformat()+'T00:00:00Z',is_synthetic=True,expected_refresh_days=36500,note='Fixed scenario reference date, not a live fetch. Fictional partners, bids, capacities and performance.').model_dump()
    for name,records in [('partners',partners),('bids',bids),('performance',history)]:
        atomic_json(ROOT/f'data/{name}.json',dict(meta=meta,records=records))
    print(f'Synthetic seed={SEED}: {len(partners)} partners, {len(bids)} bids, {len(history)} weekly performance records')


if __name__=='__main__':
    generate()
