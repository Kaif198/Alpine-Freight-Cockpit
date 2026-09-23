import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, CircleAlert, ExternalLink, Info, X } from 'lucide-react'
import { isStale } from '../lib/analytics'
import { formatDate } from '../lib/data'
import type { Meta } from '../lib/types'

export const DISCLAIMER = 'Independent portfolio demo built by Mohammed Kaif Ahmed. Not affiliated with, endorsed by, or produced for Red Bull GmbH. Red Bull and the Red Bull logo are trademarks of Red Bull GmbH. All 3PL partners, bids, and performance data are synthetic.'
export function Synthetic({small=false}:{small?:boolean}) { return <span className={`synthetic ${small?'small':''}`} title="Calculated from fictional, seeded tender data">Synthetic</span> }
export function Badge({children,tone='muted'}:{children:ReactNode;tone?:string}) { return <span className={`badge ${tone}`}>{children}</span> }
export function Source({meta,onClick,stale=false}:{meta:Meta;onClick:()=>void;stale?:boolean}) { const logo=meta.source_name.includes('Commission')?'/brand/ec-logo.svg':meta.source_name.includes('Central Bank')?'/brand/ecb-logo.svg':null; return <div className="source-line"><button onClick={onClick}>{logo?<img src={logo} alt=""/>:<Info size={14}/>}<span>{meta.source_name}<small className="source-date">Fetched {formatDate(meta.fetched_at)} · View source</small></span><ArrowUpRight size={12}/></button>{(stale||isStale(meta))&&<Badge tone="warning">Stale</Badge>}</div> }
export function Empty({title,children}:{title:string;children?:ReactNode}) { return <div className="empty"><CircleAlert size={25}/><h3>{title}</h3><p>{children}</p></div> }
export function Panel({title,eyebrow,action,children,className=''}:{title:string;eyebrow?:string;action?:ReactNode;children:ReactNode;className?:string}) { return <section className={`panel ${className}`}><div className="panel-head"><div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{action}</div>{children}</section> }
export interface Detail {title:string;source?:Meta;details:[string,string][];extra?:ReactNode}
export function DetailDialog({detail,close}:{detail:Detail|null;close:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{if(detail)ref.current?.showModal();else ref.current?.close()},[detail])
  return <dialog ref={ref} onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close()}} className="detail-dialog" aria-labelledby="detail-title">{detail&&<div className="dialog-inner"><div className="dialog-title"><span className="eyebrow">Behind the numbers</span><button className="icon-button" onClick={close} aria-label="Close details"><X size={20}/></button></div><h2 id="detail-title">{detail.title}</h2><dl>{detail.details.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{detail.source&&/^https:\/\//.test(detail.source.source_url)&&<a className="button primary" href={detail.source.source_url} target="_blank" rel="noreferrer">Open original source<ExternalLink size={14}/></a>}{detail.extra}</div>}</dialog>
}
export function Sparkline({values,colour='var(--yellow)',label}:{values:number[];colour?:string;label:string}) {
  if(!values.length)return <span className="muted">No history</span>
  const lo=Math.min(...values)-2, hi=Math.max(...values)+2
  const points=values.map((v,i)=>`${i/(values.length-1||1)*150},${38-(v-lo)/(hi-lo)*32}`).join(' ')
  return <svg viewBox="0 0 150 44" className="sparkline" role="img" aria-label={label}><title>{label}</title><polyline points={points} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round"/></svg>
}
export function AnimatedNumber({value,format}:{value:number;format:(n:number)=>string}) {
  const [shown,setShown]=useState(value)
  const initial=useRef(true)
  useEffect(()=>{
    if(!initial.current){setShown(value);return}
    initial.current=false
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const start=performance.now(); let frame=0
    const step=(now:number)=>{const fraction=Math.min(1,(now-start)/220);setShown(value*(1-(1-fraction)**3));if(fraction<1)frame=requestAnimationFrame(step)}
    frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame)
  },[value])
  return <span>{format(shown)}</span>
}
