# How You Doin'?

A cozy journaling and emotional reflection app inspired by the comfort of daily conversations with friends. Instead of tracking mood on a clinical scale, users describe their day through personality-inspired **Energy Cards** — each one based on a *Friends* character.

> *"So… who showed up today?"*

---

## What it does

1. **Daily Check-In** — Select one or two energies (Monica, Chandler, Ross, Joey, Phoebe, Rachel) that best describe your day. Place them on the couch. Write a note. Save.
2. **Journal History** — Browse past entries. Tap any card to read the full entry.
3. **Entry Detail** — Full text, selected energies, the generated day story, edit or delete.
4. **Settings** — Switch language (EN / PL).

After saving an entry the app redirects to History with the new entry pre-selected.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, `"use client"` pages) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + custom utility classes |
| Components | shadcn/ui |
| Rich text editor | TipTap |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Local storage | `localStorage` (demo mode) |
| Deployment | Vercel |

---

## Screens

| Route | Description |
|---|---|
| `/login` | Entry point. Google OAuth or frictionless Demo mode. |
| `/onboarding` | First-run name input. |
| `/` | Today's check-in — couch selector, energy cards, journal editor, save. |
| `/history` | Chronological list of entries. Desktop: two-panel (list + detail). |
| `/entry/[id]` | Full entry detail on mobile. |
| `/settings` | Language toggle. |

---

## Auth modes

### Google OAuth
Sign in with Google via Supabase. Entries are stored in the cloud and persist across devices. Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars.

### Demo mode
No account required. Click **Explore Demo** on the login screen. All data is stored in `localStorage` under the key `hyd_demo_entries`. Nothing is sent to the server. Useful for portfolio visitors.

---

## Design system

Inspired by Monica's apartment — warm, nostalgic, never clinical.

| Token | Value | Usage |
|---|---|---|
| Background | `#ece7df` | App background |
| Card bg | `#f7f3ec` | Entry cards, form panels |
| Primary purple | `#6a4f79` | Buttons, borders, outlines |
| Accent yellow | `#fde52f` | Button text, section tags, quote bar |
| Espresso | `#4a2e22` | Body text, journal note text |
| Muted | `#938d8d` | Placeholder, empty state text |
| Energy badge | `#6fb6d4` bg / `#fde52f` text | History and detail energy labels |

**Fonts:** League Gothic (display/headings), Special Elite (body/serif), Cormorant Infant Medium Italic (date bar), Shadows Into Light Two (loader text).

**CSS utility classes** (defined in `app/globals.css`):
- `.figma-card` — card background + purple border (1px top/left/right, 4px bottom)
- `.figma-tag` — yellow badge shape (used for section tags)
- `.figma-btn` — purple button

---

## Key components

### ChemexLoader
`components/ChemexLoader.tsx` + `components/ChemexLoader.module.css`

A custom SVG animated loading screen shaped like a Chemex coffee maker.

- **Coffee fill** — rises from 0% to ~90% over ~3.5s (simulated), then to 100% when `complete={true}`.
- **Drip** — a falling drop that loops while loading. A clip path hides the portion that enters the rising coffee, so it merges seamlessly. CSS keyframe peaks at `opacity: 0.88` to match the fill's SVG opacity — avoids the drop appearing darker.
- **Text** — *"Brewing your day…"* with a breathing opacity animation.

```tsx
import { ChemexLoader, ChemexLoaderScreen } from "@/components/ChemexLoader"

// Full-screen overlay (used on login and main page)
<ChemexLoaderScreen complete={isReady} />

// Inline with real progress
<ChemexLoader progress={loadPercent} complete={loadPercent >= 100} />
```

The loader appears for a minimum of **2 seconds** even if data loads instantly, to avoid a jarring flash.

### CouchSelector
`components/CouchSelector.tsx` — renders the couch SVG and places energy character icons on the left/right seat based on selected energies.

### EnergyCard
`components/EnergyCard.tsx` — 3×2 grid of selectable cards. First tap = primary energy, second tap = secondary. Tap selected card to deselect.

### EnergyBadge
`components/EnergyBadge.tsx` — compact label shown in history cards and entry detail. Blue background (`#6fb6d4`), yellow text (`#fde52f`), no border.

### JournalEditor
`components/JournalEditor.tsx` — TipTap rich text editor with placeholder text.

### CouchStoryBlock
`components/CouchStoryBlock.tsx` — renders the generated day story and reflection prompt based on the selected energy combination.

---

## Energy system

Six energies, each mapped to a *Friends* character and a colour:

| Energy | Character | Colour |
|---|---|---|
| Monica | Getting Things Done | Sage Green |
| Chandler | Laughing Through It | Dusty Purple |
| Ross | Thinking About It Too Much | Dusty Blue |
| Joey | Enjoying The Moment | Coffee Brown |
| Phoebe | Trusting The Universe | Turquoise |
| Rachel | Growing Into Something New | Lavender Pink |

Each pair of energies generates a unique day title and story (`lib/couchStories.ts`).

---

## Internationalisation

Full EN / PL support. Language is stored in `localStorage` under `hyd_lang`. Translation files: `locales/en.json` and `locales/pl.json`. Accessed via the `useI18n()` hook.

---

## PWA

The app ships a web app manifest and service worker registration (`app/sw-register.tsx`). Icons at `/public/icons/icon-192.png` and `icon-512.png`. Can be installed to the home screen on mobile.

---

## Local development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Without these, Google OAuth will not work. Demo mode works without any env vars.

---

## Deployment

Deployed on **Vercel** via Git integration. Every push to `main` triggers a production deploy. The Supabase OAuth callback URL must be added to the allowed redirect list in the Supabase dashboard:

```
https://<your-vercel-domain>/auth/callback
```

---

## Project structure

```
how-you-doin/
├── app/
│   ├── page.tsx              # Today's check-in
│   ├── login/page.tsx        # Login (Google + Demo)
│   ├── onboarding/page.tsx   # Name input
│   ├── history/page.tsx      # Journal history list
│   ├── entry/[id]/page.tsx   # Entry detail (mobile)
│   ├── settings/page.tsx     # Language toggle
│   └── globals.css           # Tailwind + utility classes
├── components/
│   ├── ChemexLoader.tsx      # Loading animation
│   ├── CouchSelector.tsx     # Couch SVG interaction
│   ├── EnergyCard.tsx        # Selectable energy cards
│   ├── EnergyBadge.tsx       # Compact energy label
│   ├── JournalEditor.tsx     # TipTap editor
│   ├── CouchStoryBlock.tsx   # Generated day story
│   ├── EntryDetail.tsx       # Full entry view
│   └── BottomNav.tsx         # Mobile navigation
├── lib/
│   ├── storage.ts            # Entry CRUD (Supabase + localStorage)
│   ├── demo.ts               # Demo mode flag
│   ├── energies.ts           # Energy config
│   ├── couchStories.ts       # Story generation per energy combo
│   ├── i18n.tsx              # Translation hook
│   └── types.ts              # Shared types
└── locales/
    ├── en.json
    └── pl.json
```
