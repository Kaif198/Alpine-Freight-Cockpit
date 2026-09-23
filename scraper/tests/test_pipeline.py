import json
from pathlib import Path
from types import SimpleNamespace
import pytest
from pydantic import ValidationError
from scraper.run import refresh
from scraper.schemas import Bid, Partner, Performance, Lane
from scraper.sources import diesel, ecb, freight

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / 'docs/probes/responses'


def test_diesel_real_fixture():
    rows = diesel.parse((FIXTURES/'ec-history.xlsx').read_bytes())
    assert len(rows) == 216
    assert next(r for r in rows if r.country=='AT' and r.date=='2026-09-14').eur_per_litre == 2.197
    assert len({r.date for r in rows}) == 27


def test_fx_real_fixture():
    rows = ecb.parse((FIXTURES/'ecb-daily.xml').read_bytes())
    assert len(rows) == 29
    assert next(r for r in rows if r.currency=='USD').per_eur == 1.1463


def test_freight_real_fixture():
    rows = freight.parse((FIXTURES/'bts-series.json').read_bytes())
    assert rows[-1].date == '2026-07-01'
    assert rows[-1].value == 135.7


@pytest.mark.parametrize('source',[diesel,ecb,freight])
def test_malformed_source_is_rejected(source):
    with pytest.raises(Exception):
        source.parse(b'<html>Maintenance</html>')


def test_failed_refresh_preserves_last_good_bytes(tmp_path):
    good={'meta':{'fetched_at':'2026-09-22T00:00:00Z'},'records':[{'currency':'USD','per_eur':1.1}]}
    path=tmp_path/'fx.json'
    path.write_text(json.dumps(good))
    original=path.read_bytes()
    broken=SimpleNamespace(NAME='test',URL='https://www.ecb.europa.eu',DAYS=3,fetch=lambda:b'<html>Error</html>',parse=ecb.parse)
    manifest={}
    assert not refresh('fx',broken,tmp_path,manifest)
    assert path.read_bytes()==original
    assert manifest['fx']['status']=='stale'
    assert manifest['fx']['record_count']==1


def test_initial_failure_is_unavailable(tmp_path):
    broken=SimpleNamespace(NAME='test',URL='https://www.ecb.europa.eu',DAYS=3,fetch=lambda:b'<bad>',parse=ecb.parse)
    manifest={}
    refresh('fx',broken,tmp_path,manifest)
    assert manifest['fx']['status']=='unavailable'
    assert not (tmp_path/'fx.json').exists()


def test_strict_domain_validation():
    with pytest.raises(ValidationError):
        Bid(partner_id='x',lane_id='y',base_eur='100',fuel_percent=10.0,transit_days=1,weekly_capacity=10)


@pytest.mark.parametrize('name,model',[('partners',Partner),('bids',Bid),('performance',Performance),('lanes',Lane)])
def test_generated_records_validate(name,model):
    data=json.loads((ROOT/f'data/{name}.json').read_text())
    assert data['records']
    for row in data['records']:
        model.model_validate(row)


def test_seed_is_reproducible():
    from synthetic.generate import generate
    files=[ROOT/f'data/{name}.json' for name in ['partners','bids','performance']]
    before=[p.read_bytes() for p in files]
    generate()
    assert before==[p.read_bytes() for p in files]
