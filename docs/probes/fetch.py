"""One-off research capture, not the production pipeline."""
import sys, json, hashlib
from datetime import datetime, timezone
from pathlib import Path
import requests

url, name = sys.argv[1:]
folder = Path(__file__).parent / 'responses'
stamp = datetime.now(timezone.utc).isoformat()
try:
    response = requests.get(url, timeout=20, headers={'User-Agent': 'AlpineFreightCockpit/1.0 (portfolio research; contact: CONTACT_EMAIL_PENDING)'})
    response.raise_for_status()
    (folder / name).write_bytes(response.content)
    result = dict(requested_url=url, final_url=response.url, fetched_at=stamp, completed_at=datetime.now(timezone.utc).isoformat(), status=response.status_code, content_type=response.headers.get('Content-Type'), bytes=len(response.content), sha256=hashlib.sha256(response.content).hexdigest(), file=name)
except requests.RequestException as error:
    result = dict(requested_url=url, fetched_at=stamp, error=str(error), file=None)
(folder / (name + '.meta.json')).write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result))
