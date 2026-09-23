"""Fetch approved sources; failed refreshes never overwrite the last good file."""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scraper.schemas import Meta
from scraper.sources import diesel, ecb


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def atomic_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    temporary.replace(path)


def refresh(name, source, directory, manifest, fixture=None):
    path = directory / f'{name}.json'
    try:
        raw = source.fetch() if fixture is None else fixture.read_bytes()
        records = source.parse(raw)
        if not records:
            raise ValueError('Source returned no valid records')
        fetched = now()
        if fixture is not None:
            provenance = json.loads(Path(str(fixture) + '.meta.json').read_text(encoding='utf-8-sig'))
            fetched = provenance['fetched_at']
        meta = Meta(source_name=source.NAME, source_url=source.URL, fetched_at=fetched, is_synthetic=False, expected_refresh_days=source.DAYS)
        atomic_json(path, {'meta': meta.model_dump(), 'records': [r.model_dump() for r in records]})
        manifest[name] = dict(status='fresh', fetched_at=fetched, source_url=source.URL, record_count=len(records), checked_at=now(), error=None)
        print(f'{name}: OK | {len(records)} records | {fetched}')
        return True
    except Exception as error:
        old = json.loads(path.read_text(encoding='utf-8')) if path.exists() else None
        manifest[name] = dict(status='stale' if old else 'unavailable', fetched_at=old['meta']['fetched_at'] if old else None, source_url=source.URL, record_count=len(old['records']) if old else 0, checked_at=now(), error=str(error))
        print(f'{name}: {manifest[name]["status"].upper()} | {error}')
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fixtures', action='store_true', help='Reparse saved research responses using their ORIGINAL fetch timestamps')
    args = parser.parse_args()
    directory = ROOT / 'data'
    manifest_path = directory / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    sources = [('diesel', diesel, 'ec-history.xlsx'), ('fx', ecb, 'ecb-daily.xml')]
    for module_name, fixture_name in [('dhl', 'dhl-surcharges.html'), ('freight', 'bts-series.json')]:
        try:
            from importlib import import_module
            source = import_module(f'scraper.sources.{module_name}')
            sources.append((module_name, source, fixture_name))
        except ModuleNotFoundError:
            continue
    success = True
    for name, source, filename in sources:
        fixture = ROOT / 'docs/probes/responses' / filename if args.fixtures else None
        success = refresh(name, source, directory, manifest, fixture) and success
    atomic_json(manifest_path, manifest)
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())
