import Link from "next/link";

const steps = [
  { n:"01", emoji:"🙂", title:"Choose a feeling", text:"Pick the emoji that best describes your experience. This is the official pulse used by the town mood." },
  { n:"02", emoji:"✎", title:"Explain the feeling", text:"Add a short comment. Its wording is analyzed as a separate secondary signal that helps explain the pulse." },
  { n:"03", emoji:"◔", title:"See the living picture", text:"Your pulse changes the public dashboard, destination mood fingerprints, and recent visitor voices." },
  { n:"04", emoji:"👍", title:"Join the conversation", text:"Agree or disagree with another visitor's experience, then reply with your own perspective." }
];

export default function HowItWorksPage(){
  return <div className="page-shell pb-12">
    <section className="how-hero">
      <div><p className="eyebrow">DAET Pulse</p><h1 className="mt-3">One feeling. One story. One living picture.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">DAET Pulse turns simple visitor emotions into a shared view of how places are being experienced across Daet.</p></div>
      <Link href="/spots" className="btn-primary">Leave a pulse →</Link>
    </section>
    <section className="how-grid">
      {steps.map(s=><article className="how-card" key={s.n}><span className="how-number">{s.n}</span><div className="how-icon">{s.emoji}</div><h2>{s.title}</h2><p>{s.text}</p></article>)}
    </section>
    <section className="surface how-clarity">
      <div><p className="eyebrow">Signal hierarchy</p><h2>What each signal means</h2></div>
      <div className="clarity-grid">
        <div><span>OFFICIAL</span><strong>🙂 Emoji pulse</strong><p>The visitor's selected feeling is the primary sentiment measurement.</p></div>
        <div><span>SECONDARY</span><strong>“Words”</strong><p>Comment wording helps explain whether written experiences sound positive, mixed, or in need of care.</p></div>
        <div><span>COMMUNITY</span><strong>👍 / 👎 + replies</strong><p>Other visitors can say whether the experience matches theirs and add context.</p></div>
      </div>
    </section>
  </div>;
}
