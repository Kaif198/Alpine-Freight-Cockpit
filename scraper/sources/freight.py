import json
from scraper.network import get
from scraper.schemas import FreightIndex

NAME = 'U.S. Bureau of Transportation Statistics'
URL = 'https://data.bts.gov/api/v3/views/bw6n-ddqk/query.json'
DAYS = 35


def fetch() -> bytes:
    return get(URL)


def parse(raw: bytes) -> list[FreightIndex]:
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError('Expected BTS record list')
    records = [FreightIndex(name='Freight Transportation Services Index',date=r['obs_date'][:10],value=float(r['tsi_freight']),unit='Index 2000=100, seasonally adjusted',region='United States') for r in data if r.get('tsi_freight') is not None]
    if not records:
        raise ValueError('No freight index records')
    return sorted(records,key=lambda x:x.date)[-27:]

