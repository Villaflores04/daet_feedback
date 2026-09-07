# DAET Pulse — single-file UI brief for design review

Read this one file. Do not rebuild the app. Suggest CSS + layout + copy only.
Keep emoji as the official sentiment. Keep the dark civic look. Mobile-first tourists in Daet, Philippines.

## What this product is
Public no-login tourism desk. Visitor picks ONE emoji (official mood), optional stars, short comment.
Official map: 😞 negative · 😐 mixed · 🙂 positive · 🤩 positive (still stored as negative|mixed|positive).
Stars never override emoji. Do not add login, reactions, booking, light beach theme, or AI.

Public routes: `/` home · `/spots` catalog · `/spots/[slug]` pulse form · `/dashboard` town pulse.
Public nav has no admin link.

## Design tokens (do not invent a new palette)

```
ink    #07131c   page background
tide   #0c2433   cards / glass
sand   #f4efe4   body text
gold   #e8c572   CTA / selected / labels
foam   #d7f3ea   success / positive
coral  #e07a5f   error / negative

display font: Fraunces (serif headlines)
body font:    Manrope
```

```css
html, body { background: #07131c; color: #f4efe4; }
body {
  font-family: Manrope, system-ui, sans-serif;
  background-image:
    radial-gradient(1200px 500px at 10% -10%, rgba(232,197,114,.16), transparent 55%),
    radial-gradient(900px 600px at 110% 10%, rgba(80,180,170,.14), transparent 50%),
    linear-gradient(180deg, #07131c 0%, #0a1c28 45%, #07131c 100%);
}
.font-display { font-family: Fraunces, Georgia, serif; }
.glass {
  background: rgba(12,36,51,.62);
  border: 1px solid rgba(244,239,228,.08);
  backdrop-filter: blur(18px);
}
.btn-gold { background:#e8c572; color:#07131c; border-radius:999px; font-weight:600; }
.btn-ghost { border:1px solid rgba(255,255,255,.15); border-radius:999px; color:#f4efe4; }
```

Tailwind classes used in the app: `bg-ink` `bg-gold` `text-sand` `text-gold` `text-foam` `text-coral` `font-display` `glass` `rounded-3xl` `rounded-full`.

## Public header (Places is primary)

```
Municipality of Daet
DAET Pulse                    [ Places (gold) ]  [ Town pulse (ghost) ]
```

## Home structure
Hero image overlay (dark left → transparent right).
H1 display: “The town, told by the people who just left the sand.”
Body: no-account emoji pulse for Daet.
CTAs: gold “Leave a pulse” → /spots · ghost “Town pulse” → /dashboard
Side stat: live optional average + pulse count.
Then featured place cards.

## Catalog card
Cover image (or tide fallback if missing).
Category + barangay.
Name (Fraunces).
One-line description.
Small optional numeric average + “N pulses” (not the official mood).

## Spot page (mobile: FORM FIRST, then comments)
Cover + name + barangay + description.
Then pulse form. Then list of pulses.

## Pulse form — most important UI
Must look like an emoji instrument, not a 5-star review widget.

```
Visitor pulse                         [ Set public name ]
{spot name}

How did your visit feel?
Kumusta ang experience mo?

[ 😞          ] [ 😐        ] [ 🙂         ] [ 🤩              ]
  Negative        Mixed         Positive        Very positive
  Hindi maganda   Okay lang     Maganda         Natuwa
  (none selected by default)
  selected = gold ring + gold fill + “✓ selected”

Optional: give a numeric score — not the official mood.
★ ★ ★ ★ ★   (empty by default, gold when chosen)

Add a short comment / Mag-iwan ng maikling komento
[ textarea 8–600 ]

[ Publish pulse ]   full-width sand button

After server 201 only:
“Your pulse is counted ✓”
“Naitala ang iyong pulse.”
show saved emoji + label + comment
link: See how visitors are feeling across Daet →
```

Emoji buttons today: `min-h-[92px]`, 2-col on phone / 4-col on sm+.
Star buttons: 48×48. Publish: full width `min-h-12`.

## Town pulse dashboard
3 stats: Pulses · Optional average · Places

Block labeled OFFICIAL
  Emoji Mood
  “Official visitor sentiment based on the selected emoji.”
  rows: Thriving / Okay lang / Needs care
  format: 62% (124)  plus bar  (never % alone)

Block labeled SECONDARY
  Comment Wording Mood
  keyword list only, not AI
  same 62% (124) format

Note under charts:
Emoji Mood = selected emoji. Wording Mood = fixed EN/FIL keywords. Calculated separately.

Place ranking: empty copy = “No pulses yet. Be the first visitor to share how this place felt.”
Latest pulses: name + face + plain-text comment (no HTML).

## Constraints for your suggestions
- Dark civic, not light, not tropical cliché
- Outdoor phone glare: raise contrast if needed
- One-thumb: keep form above comments on mobile
- Do not move stars above emoji
- Do not add reaction row
- Do not invent new sentiment categories in the database
- Return: proposed CSS + class changes + a short before/after for the form and dashboard only
