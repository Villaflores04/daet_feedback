import { REACTIONS, reactionsByPlace, tallyReactions } from "@/lib/pulse/fb-reactions";
import type { Channel, Pulse } from "@/lib/pulse/types";

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const TONE = { POS: "bg-pos", MIX: "bg-mix", NEG: "bg-neg" } as const;

function Split({ pos, mix, neg, total }: { pos: number; mix: number; neg: number; total: number }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-cool" role="img" aria-label={`${pct(pos, total)}% positive, ${pct(mix, total)}% mixed, ${pct(neg, total)}% negative`}>
      <span className="bg-pos" style={{ width: `${pct(pos, total)}%` }} />
      <span className="bg-mix" style={{ width: `${pct(mix, total)}%` }} />
      <span className="bg-neg" style={{ width: `${pct(neg, total)}%` }} />
    </div>
  );
}

/** Sentiment of feedback collected from Facebook, read from people's own reactions (not the site's four faces). */
export function OutsideReactions({ pulses, channels }: { pulses: Pulse[]; channels: Channel[] }) {
  const t = tallyReactions(pulses);
  const places = reactionsByPlace(pulses, channels);
  const max = Math.max(1, ...Object.values(t.counts));
  return (
    <div className="grid gap-4">
      <section className="rounded-2xl bg-plate p-4 shadow-plate sm:p-5" aria-label="Facebook reactions overview">
        <h3 className="text-lg font-semibold">Facebook reactions</h3>
        <p className="mt-1 text-sm text-muted">{t.total} reactions on {t.items} posts and comments. Like, Love and Care count as positive; Haha and Wow as mixed; Sad and Angry as negative.</p>
        {t.total ? (
          <>
            <div className="mt-3"><Split {...t} /></div>
            <p className="mt-2 flex flex-wrap gap-x-4 text-sm tabular-nums"><span>Positive {pct(t.pos, t.total)}%</span><span>Mixed {pct(t.mix, t.total)}%</span><span>Negative {pct(t.neg, t.total)}%</span></p>
            <ul className="mt-4 grid gap-2">
              {REACTIONS.map((r) => (
                <li key={r.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
                  <span><span aria-hidden>{r.glyph}</span> {r.label}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-cool"><span className={`block h-full ${TONE[r.mood]}`} style={{ width: `${(t.counts[r.id] / max) * 100}%` }} /></span>
                  <span className="text-right tabular-nums">{t.counts[r.id]}</span>
                </li>
              ))}
            </ul>
          </>
        ) : <p className="mt-3 text-sm">No reaction counts yet. They appear when a collector file with reactions is imported.</p>}
      </section>

      {places.length ? (
        <section className="rounded-2xl bg-plate p-4 shadow-plate sm:p-5" aria-label="Facebook reactions by place">
          <h3 className="text-lg font-semibold">By place</h3>
          <p className="mt-1 text-sm text-muted">Ranked by the share of positive reactions. Places with few reactions can swing a lot, so read the totals too.</p>
          <ul className="mt-3 grid gap-3">
            {places.map((p) => (
              <li key={p.channel.id} className="grid gap-1">
                <p className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{p.channel.name}</span><span className="tabular-nums text-muted">{p.total} reactions · {pct(p.pos, p.total)}% positive</span></p>
                <Split {...p} />
                <p className="text-xs text-muted">{REACTIONS.filter((r) => p.counts[r.id]).map((r) => `${r.glyph} ${p.counts[r.id]}`).join("  ")}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
