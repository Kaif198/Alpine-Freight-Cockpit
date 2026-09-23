import xml.etree.ElementTree as ET
from scraper.network import get
from scraper.schemas import Fx

NAME = 'European Central Bank'
URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?cb2af92b4b962bb8feefc7c75f2213f4'
DAYS = 3


def fetch() -> bytes:
    return get(URL)


def parse(raw: bytes) -> list[Fx]:
    root = ET.fromstring(raw)
    records = []
    for parent in root.iter():
        if 'time' in parent.attrib:
            for node in parent:
                if 'currency' in node.attrib:
                    records.append(Fx(currency=node.attrib['currency'], date=parent.attrib['time'], per_eur=float(node.attrib['rate'])))
    if not records or len({x.currency for x in records}) != len(records):
        raise ValueError('Missing or duplicate ECB rates')
    return records

