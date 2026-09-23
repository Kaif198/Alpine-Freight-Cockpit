export interface Meta { source_name: string; source_url: string; fetched_at: string; is_synthetic: boolean; schema_version: string; expected_refresh_days: number; note?: string }
export interface Dataset<T> { meta: Meta; records: T[] }
export interface City { name: string; country: string; longitude: number; latitude: number }
export interface Lane { id: string; origin: City; destination: City; distance_km: number; distance_method: string }
export interface Partner { id: string; name: string; initials: string; colour: string; specialty: string }
export interface Bid { partner_id: string; lane_id: string; base_eur: number; fuel_percent: number; transit_days: number; weekly_capacity: number }
export interface Performance { partner_id: string; lane_id: string; week: string; otif: number; damage: number; claims: number; response_hours: number }
export interface Diesel { country: string; date: string; eur_per_litre: number }
export interface Fx { currency: string; date: string; per_eur: number }
export interface Surcharge { carrier: string; scope: string; date: string; percent: number }
export interface FreightIndex { name: string; date: string; value: number; unit: string; region: string }
export interface MapFeature { properties: { name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }
export interface Geography { meta: Meta; features: MapFeature[] }
export interface ManifestEntry { status: string; fetched_at: string | null; source_url: string; record_count: number; checked_at: string; error: string | null }
export interface AppData { lanes: Dataset<Lane>; partners: Dataset<Partner>; bids: Dataset<Bid>; performance: Dataset<Performance>; diesel: Dataset<Diesel>; fx: Dataset<Fx>; freight: Dataset<FreightIndex>; dhl: Dataset<Surcharge> | null; map: Geography; manifest: Record<string, ManifestEntry>; brand: { logo: string | null } }
export interface Weights { otif: number; damage: number; claims: number; response: number; price: number }
export interface PartnerScore { partner: Partner; score: number; otif: number; damage: number; claims: number; response: number; price: number; trend: number[] }
export interface AllocationRow { bid: Bid; score: number; loads: number; cost: number; constraints: string[] }
export interface Allocation { feasible: boolean; rows: AllocationRow[]; totalCost: number; weightedScore: number; reason: string; demand: number }
