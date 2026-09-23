from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(strict=True, extra='forbid', allow_inf_nan=False)


class Meta(StrictModel):
    source_name: str
    source_url: str
    fetched_at: str
    is_synthetic: bool
    schema_version: str = '1.0'
    expected_refresh_days: int = 7
    note: str = ''


class Diesel(StrictModel):
    country: str
    date: str
    eur_per_litre: float = Field(gt=0, lt=20)


class Fx(StrictModel):
    currency: str = Field(pattern=r'^[A-Z]{3}$')
    date: str
    per_eur: float = Field(gt=0)


class Surcharge(StrictModel):
    carrier: str
    scope: str
    date: str
    percent: float = Field(ge=0, le=100)


class FreightIndex(StrictModel):
    name: str
    date: str
    value: float = Field(gt=0)
    unit: str
    region: str


class City(StrictModel):
    name: str
    country: str
    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)


class Lane(StrictModel):
    id: str
    origin: City
    destination: City
    distance_km: float = Field(gt=0)
    distance_method: Literal['great-circle approximation']


class Partner(StrictModel):
    id: str
    name: str
    initials: str
    colour: str
    specialty: str


class Bid(StrictModel):
    partner_id: str
    lane_id: str
    base_eur: float = Field(gt=0)
    fuel_percent: float = Field(ge=0, le=100)
    transit_days: int = Field(ge=1)
    weekly_capacity: int = Field(ge=0)


class Performance(StrictModel):
    partner_id: str
    lane_id: str
    week: str
    otif: float = Field(ge=0, le=100)
    damage: float = Field(ge=0, le=100)
    claims: int = Field(ge=0)
    response_hours: float = Field(gt=0)
