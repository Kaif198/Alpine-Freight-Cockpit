import { cp, mkdir, access } from 'node:fs/promises'
import { resolve } from 'node:path'
await mkdir('public/data', { recursive: true })
await mkdir('public/docs', { recursive: true })
await cp(resolve('../data'), 'public/data', { recursive: true })
for (const file of ['methodology.md', 'sources.md']) await cp(resolve('../docs', file), resolve('public/docs', file))
let logo = null
for (const ext of ['svg', 'png']) {
  try { await access(`public/brand/redbull-logo.${ext}`); logo = `/brand/redbull-logo.${ext}`; break } catch { /* optional supplied file */ }
}
const { writeFile } = await import('node:fs/promises')
await writeFile('public/data/brand.json', JSON.stringify({ logo }))
console.log('Copied committed datasets and methodology; supplied logo:', logo ?? 'not provided')
