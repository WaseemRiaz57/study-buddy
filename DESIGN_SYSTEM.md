# StudyBuddy marketing design system — "Lamplight"

The public marketing surface (homepage first, then About / Careers / other public pages)
uses this system. The authenticated dashboard keeps its own UI for now.

## Idea

Studying at a desk late at night: dark blue-black ink, warm paper-white type, and one
fluorescent highlighter. The highlighter is the only saturated colour on the page and it
always *means* something — the important line, the primary action, the current step.

## Colour tokens (`app/landing.css`, scoped to `.lamp`)

| Token            | Hex                      | Role                                              |
| ---------------- | ------------------------ | ------------------------------------------------- |
| `--lamp-ink`     | `#0F1420`                | Page background (blue-black fountain-pen ink)     |
| `--lamp-desk`    | `#151B29`                | Raised surfaces: the notes sheet, plan columns    |
| `--lamp-paper`   | `#EDE8DC`                | Primary text, warm off-white                      |
| `--lamp-graphite`| `#949AA8`                | Secondary text, captions                          |
| `--lamp-rule`    | `rgb(237 232 220 / .12)` | Hairlines, borders, ruled-paper lines             |
| `--lamp-marker`  | `#E6F04A`                | Highlighter. Primary buttons, highlights, focus   |

Rules
- Marker never fills large areas. Max one marker button per viewport.
- Text on marker is always `--lamp-ink` (contrast 13:1).
- Graphite on ink passes AA for body copy (6.6:1). Don't go dimmer for text.

## Typography

- **Display:** Newsreader (variable, optical sizes) — headlines, pull quotes, wordmark.
  Weight 400–500, tight tracking (−0.02em) at display sizes, `opsz` follows size.
- **Text/UI:** Instrument Sans — body, nav, buttons, labels.
- No monospace, no all-caps eyebrows. Labels are sentence case.

Scale (fluid, `clamp`) — ratio ≈ 1.25 on mobile, ≈ 1.333 on desktop:

| Step       | Size                               | Use                     |
| ---------- | ---------------------------------- | ----------------------- |
| `display`  | `clamp(3rem, 8.4vw, 7.5rem)` / 0.95 | Hero headline           |
| `h2`       | `clamp(2.25rem, 4.6vw, 4rem)` / 1.02 | Section headlines       |
| `h3`       | `1.5rem` / 1.2                      | Row titles, plan names  |
| `lead`     | `clamp(1.125rem, 1.6vw, 1.3rem)` / 1.55 | Intro paragraphs   |
| `body`     | `1rem` / 1.6                        | Default                 |
| `small`    | `0.875rem` / 1.5                    | Captions, meta          |

Line length: 34–62ch for paragraphs (`max-w-[60ch]`).

## Layout

- Content width 1240px, gutters `clamp(1.25rem, 4vw, 3rem)`.
- Left-aligned everywhere. Centre alignment only for the closing call to action.
- Section rhythm: `clamp(6rem, 14vw, 11rem)` vertical padding.
- 12-column grid on desktop; headlines usually span 7–8 columns, copy 5.

Breakpoints (Tailwind defaults): `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
The pinned scroll story is desktop-only (`lg+`); below that it becomes a stacked list.

## Components

- **Buttons**
  - Primary: marker fill, ink text, radius 999px, 48px tall, 0 24px padding.
    Hover: marker brightens + a 2px ink inset underline slides in. Press: translateY(1px).
  - Secondary: transparent, paper text, 1px rule border. Hover: border → paper.
  - Text link: paper text with a marker underline that grows from left on hover.
- **Radius:** 2px on paper-like surfaces (notes sheet), 14px on plan columns, 999px on
  buttons. Radius follows the object, not a single global value.
- **Shadow:** only the notes sheet casts one (it's a physical object on the desk):
  `0 40px 80px -40px rgb(0 0 0 / .7)`. Nothing else has shadows.
- **Rows instead of cards:** feature lists are ruled rows (title / description / where it
  lives). Hover reveals a marker sweep behind the title.
- **Focus:** 2px marker outline, 3px offset, on every interactive element.

## Motion

- One orchestrated moment: on load, hero headline lines rise in and the highlighter
  sweeps across three key lines of the notes sheet (≈1.6s total).
- Scroll-linked: the session story (pinned, progress bar + panel swap) and a gentle
  3D settle of the notes sheet as the hero scrolls away.
- No per-section fade-ups, no infinite floating blobs, no particles.
- Easing `cubic-bezier(0.2, 0.7, 0.1, 1)`; durations 200ms (UI), 600–900ms (reveal).
- `prefers-reduced-motion`: all of the above resolve to their end state instantly.

## Performance budget

- No WebGL/Spline/particles on public pages. Fonts via `next/font` (self-hosted, swap).
- Homepage is a server component; client islands: nav, hero sheet tilt, session story,
  testimonials. Target LCP < 2.0s on mid-tier mobile, CLS ≈ 0.

## Copy voice

Plain, specific, second person. Name features by what students do ("Turn a lecture PDF
into notes"), not system terms. No made-up stats. No prices on the homepage — plan
tiers describe limits; prices live in the upgrade flow.
