import os
import time
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser
import requests

USER_AGENT = f'AlpineFreightCockpit/1.0 (non-commercial portfolio; contact: {os.getenv("SCRAPER_CONTACT", "CONTACT_EMAIL_PENDING")})'
_last_request: dict[str, float] = {}
_policies: dict[str, RobotFileParser] = {}


def _request(url: str, delay: float = 2) -> bytes:
    host = urlsplit(url).netloc
    for attempt in range(3):
        time.sleep(max(0, delay - (time.monotonic() - _last_request.get(host, 0))))
        try:
            _last_request[host] = time.monotonic()
            response = requests.get(url, headers={'User-Agent': USER_AGENT}, timeout=20)
            response.raise_for_status()
            return response.content
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError('Unreachable')


def get(url: str) -> bytes:
    parts = urlsplit(url)
    origin = f'{parts.scheme}://{parts.netloc}'
    if origin not in _policies:
        robot = RobotFileParser()
        robot.parse(_request(origin + '/robots.txt').decode('utf-8').splitlines())
        _policies[origin] = robot
    policy = _policies[origin]
    if not policy.can_fetch(USER_AGENT, url):
        raise PermissionError(f'robots.txt disallows {url}')
    delay = max(2, policy.crawl_delay(USER_AGENT) or policy.crawl_delay('*') or 0)
    return _request(url, delay)
