"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";
const links=[{href:"/admin",label:"Desk"},{href:"/admin/view",label:"Places"},{href:"/admin/spots",label:"Manage"},{href:"/admin/comments",label:"Comments"},{href:"/admin/activity",label:"Activity"}];
export function AdminNav(){const path=usePathname()||"";return <header className="sticky top-0 z-40 nav-glass"><div className="page-shell flex min-h-[64px] items-center gap-3"><Link href="/admin" className="flex shrink-0 items-center gap-2.5"><div className="mark-wrap text-white">◌</div><span><span className="block text-[9px] font-extrabold uppercase tracking-[.18em] text-[var(--muted)]">Officer workspace</span><span className="block font-display text-[1.06rem] leading-none">DAET Pulse</span></span></Link><nav className="nav-scroll ml-auto">{links.map(l=>{const active=l.href==="/admin"?path==="/admin":path.startsWith(l.href);return <Link key={l.href} href={l.href} className={`admin-nav-item ${active?"active":""}`}>{l.label}</Link>})}<LogoutButton/></nav></div></header>}
