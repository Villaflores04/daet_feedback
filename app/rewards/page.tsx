"use client";
import Link from "next/link";
import { PublicChrome } from "@/components/public-chrome";
import { RewardPreview } from "@/components/reward-preview";
import { FEEDBACK_PREVIEW_POINTS } from "@/lib/rewards";

export default function RewardsPage() {
  const rewardsUrl = process.env.NEXT_PUBLIC_DAET_REWARDS_URL;
  return <PublicChrome><main id="main-content" className="page-width py-8 pb-24">
    <div className="max-w-2xl mx-auto space-y-6">
      <header><p className="eyebrow">DAET-CONNECT rewards</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">Your feedback has value.</h1><p className="mt-3 text-muted">A preview of how participation can earn points when the shared rewards service is connected.</p></header>
      <RewardPreview />
      <section className="rounded-2xl bg-white p-6 shadow-plate"><h2 className="text-lg font-semibold">How points work today</h2><ul className="mt-3 list-disc pl-5 space-y-2 text-muted"><li>Each successfully saved original feedback earns {FEEDBACK_PREVIEW_POINTS} demo points.</li><li>Replies and agree/disagree reactions do not earn points.</li><li>The preview balance stays in this browser. It is not a verified wallet and does not transfer to the future wallet.</li></ul></section>
      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6"><span className="text-xs font-semibold uppercase tracking-wider text-yellow-800">Future integration</span><h2 className="mt-2 text-lg font-semibold">Explore rewards, when available</h2><p className="mt-2 text-sm leading-6">Potential rewards may include promotions or discounts at participating hotels and coffee shops. Partners, eligibility, point values, and redemption rules are not confirmed. No rewards can be redeemed here yet.</p>
      {rewardsUrl?.startsWith("https://") ? <a className="primary-link mt-4" href={rewardsUrl}>View rewards ↗</a> : <p className="mt-4 text-sm font-semibold text-blue-700">Rewards service connection coming soon</p>}</section>
      <Link className="primary-link" href="/feedback">Give feedback</Link>
    </div>
  </main></PublicChrome>;
}
