"""Extract verified Natural Earth coordinates and boundaries; never invent road distances."""
import json, sys, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from scraper.schemas import City, Lane, Meta
from scraper.run import atomic_json

raw = ROOT / 'docs/probes/responses'
cities = json.loads((raw / 'cities.geojson').read_text(encoding='utf-8'))
names = ['Salzburg', 'Hamburg', 'Milan', 'Warsaw', 'Budapest', 'Lyon', 'Rotterdam', 'Prague', 'Munich']
country_codes = {'Austria':'AT','Germany':'DE','Italy':'IT','Poland':'PL','Hungary':'HU','France':'FR','Netherlands':'NL','Czechia':'CZ'}
chosen = {}
for feature in cities['features']:
    p = feature['properties']
    if p.get('NAME') in names and p.get('ADM0NAME') in country_codes:
        lon, lat = feature['geometry']['coordinates']
        chosen[p['NAME']] = City(name=p['NAME'], country=country_codes[p['ADM0NAME']], longitude=lon, latitude=lat)
assert len(chosen) == len(names), 'Missing or ambiguous named cities'

def distance(a, b):
    lat1, lat2 = map(math.radians, (a.latitude, b.latitude))
    delta_lat = lat2-lat1
    delta_lon = math.radians(b.longitude-a.longitude)
    h = math.sin(delta_lat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(delta_lon/2)**2
    return round(6371.0088 * 2 * math.atan2(math.sqrt(h),math.sqrt(1-h)),1)

records = [Lane(id=f'SZG-{name[:3].upper()}', origin=chosen['Salzburg'], destination=chosen[name], distance_km=distance(chosen['Salzburg'],chosen[name]), distance_method='great-circle approximation').model_dump() for name in names[1:]]
capture = json.loads((raw/'cities.geojson.meta.json').read_text())
meta = Meta(source_name='Natural Earth populated places', source_url=capture['requested_url'], fetched_at=capture['fetched_at'], is_synthetic=False, expected_refresh_days=365, note='Public-domain city centres; Haversine distances are straight-line approximations, not road distances. Earth mean-radius constant 6371.0088 km.').model_dump()
atomic_json(ROOT/'data/lanes.json',dict(meta=meta,records=records))
world=json.loads((raw/'countries.geojson').read_text(encoding='utf-8'))
features=[dict(type='Feature',properties={'name':f['properties']['NAME']},geometry=f['geometry']) for f in world['features'] if f['properties'].get('CONTINENT')=='Europe' or f['properties'].get('NAME')=='Turkey']
capture=json.loads((raw/'countries.geojson.meta.json').read_text())
meta=Meta(source_name='Natural Earth country boundaries',source_url=capture['requested_url'],fetched_at=capture['fetched_at'],is_synthetic=False,expected_refresh_days=365,note='Public-domain 1:110m boundaries; illustrative, not navigational.').model_dump()
atomic_json(ROOT/'data/map.json',dict(meta=meta,type='FeatureCollection',features=features))
print(f'Geography: {len(records)} lanes with sourced coordinates; {len(features)} map features')
