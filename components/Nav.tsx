"use client";
import Link from "next/link";
import { useState } from "react";

function Mark(){return <span className="brand-mark" aria-hidden="true"><i/><i/><i/></span>}

export function Nav(){
  const [open,setOpen]=useState(false);
  const items=[
    ["/","Home"],
    ["/spots","Explore places"],
    ["/dashboard","Town pulse"],
    ["/how-it-works","How it works"],
    ["/dashboard#voices","Visitor voices"]
  ];
  return <header className="sticky top-0 z-40 nav-glass">
    <div className="page-shell nav-inner">
      <Link href="/" className="brand-lockup" onClick={()=>setOpen(false)}>
        <Mark/><span className="brand-copy"><span className="brand-kicker">Municipality of Daet</span><span className="brand-name">DAET Pulse</span></span>
      </Link>
      <button type="button" className={`menu-toggle ${open?"open":""}`} aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span/><span/><span/></button>
      <nav className={`nav-links ${open?"open":""}`} aria-label="Main navigation">
        {items.map(([href,label],i)=><Link key={href} href={href} className={i===2?"nav-cta":"nav-link"} onClick={()=>setOpen(false)}>{label}{i===2&&" ↗"}</Link>)}
      </nav>
    </div>
  </header>
}

export function Footer(){return <footer className="page-shell pb-8 pt-6"><div className="surface-quiet flex flex-col gap-2 py-5 text-[11px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between"><p>DAET Pulse · Visitor sentiment for Daet, Camarines Norte</p><p>Visitors never need an account.</p></div></footer>}
