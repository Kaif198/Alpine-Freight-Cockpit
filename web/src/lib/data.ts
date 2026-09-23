import type { AppData, Dataset, ManifestEntry, Meta } from './types'

async function json(path: string, signal?: AbortSignal) {
  const response = await fetch(path, { signal })
  if (!response.ok) throw new Error(`Could not load ${path.split('/').at(-1)} (${response.status}). Please retry.`)
  return response.json()
}
export async function loadData(signal?: AbortSignal): Promise<AppData> {
  const names = ['lanes','partners','bids','performance','diesel','fx','freight','map','manifest','brand'] as const
  const values = await Promise.all(names.map(name => json(`/data/${name}.json`, signal)))
  const data = Object.fromEntries(names.map((name,i)=>[name,values[i]])) as Omit<AppData,'dhl'>
  for (const name of ['lanes','partners','bids','performance','diesel','fx','freight'] as const) {
    const value = data[name]
    if (!value?.meta?.source_name || !value.meta.fetched_at || !Array.isArray(value.records)) throw new Error(`Invalid ${name} dataset. The source contract could not be verified.`)
  }
  if (!data.map?.features || !Array.isArray(data.map.features)) throw new Error('Map dataset unavailable')
  const dhl = data.manifest.dhl?.record_count ? await json('/data/dhl.json',signal) : null
  return {...data,dhl}
}
export const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value))
export const euro = (value: number, compact = false) => new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:compact ? 2 : 0,notation:compact?'compact':'standard'}).format(value)
export const number = (value: number, digits = 0) => new Intl.NumberFormat('en-GB',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value)
export function csvExport(rows: (string | number)[][], name: string) {
  const text = rows.map(row=>row.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n')
  const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8;'}))
  const link=document.createElement('a'); link.href=url; link.download=name; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function sourcePayload(dataset: Dataset<unknown> | {meta:Meta}, status?: ManifestEntry) {
  return {title:dataset.meta.source_name,source:dataset.meta,details:[['Fetched (UTC)',new Date(dataset.meta.fetched_at).toISOString()],['Refresh interval',`${dataset.meta.expected_refresh_days} days`],['Status',status?.status ?? 'Published'],['Data type',dataset.meta.is_synthetic?'Synthetic scenario':'Publisher data'],['Notes',dataset.meta.note || 'See Methodology for transformations and scope.']] as [string,string][]}
}
