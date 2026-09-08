import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchAnalytics } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { LivePulse } from "@/components/LivePulse";
export const dynamic="force-dynamic";
export default async function AdminHome(){if(!isAdminRequest())redirect("/admin/login");const data=hasPublicEnv()?await fetchAnalytics({privileged:true}):{totalReviews:0,avgRating:0,spotsCount:0,sentiment:{negative:0,mixed:0,positive:0},wording:{negative:0,mixed:0,positive:0},bySpot:[],recent:[]};return <div className="page-shell pb-12"><section className="admin-hero"><div><p className="eyebrow">Officer workspace</p><h1 className="mt-3">Read the town pulse.</h1><p className="mt-3 max-w-xl text-sm">Monitor visitor sentiment, destinations, and recent voices from one calm operating view.</p></div><div className="hidden text-right sm:block"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/50">Live dataset</p><p className="mt-1 font-display text-3xl">{data.totalReviews}</p><p className="text-[10px] text-white/55">visitor pulses</p></div></section><div className="mt-7"><LivePulse initial={data} endpoint="/api/admin/analytics"/></div></div>}
