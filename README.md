# How You Doin'?

A cozy journaling and emotional reflection app inspired by the comfort of daily conversations with friends. Instead of tracking mood on a clinical scale, users describe their day through personality-inspired **Energy Cards** — each one based on a *Friends* character.

> *"So… who showed up today?"*

---

## What it does

1. **Daily Check-In** — Select one or two energies (Monica, Chandler, Ross, Joey, Phoebe, Rachel) that best describe your day. Place them on the couch. Write a note. Save.
2. **Voice Input** — Tap the microphone button in the journal editor to dictate your note. Uses the browser's built-in Web Speech API (no paid service). Automatically switches between `pl-PL` and `en-US` based on the app language. Appends transcript to existing text without overwriting.
3. **Photo Snapshot** — Attach a photo to any day's entry. The photo is displayed inside an illustrated SVG frame that adapts to portrait or landscape orientation. Images are resized client-side before upload (max 1600 px, JPEG 85%).
4. **Joey — AI Couch Friend** — Chat with Joey (Claude-powered) about your day or journal history. Opens as a side panel on desktop, full-screen sheet on mobile. Joey uses hybrid semantic + keyword search over your past entries to answer questions about patterns and history.
5. **Journal History** — Browse past entries via a horizontal date timeline. Tap a date chip to jump directly to that day's entry, or scroll the entry list below.
6. **Entry Detail** — Full text, selected energies, the generated day story, edit or delete. Photo can be added, replaced, or removed from here too.
7. **Settings** — Switch language (EN / PL).
8. **External API** — A REST API (`/api/v1/`) and MCP server (`/api/mcp/`) let external agents and AI assistants read and write journal entries, ask Joey, and manage photos.

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
| Database | Supabase (PostgreSQL + pgvector) |
| File storage | Supabase Storage (`journal-photos` bucket) |
| AI — Joey chat | Anthropic claude-sonnet-4-6 (streaming) |
| AI — REST/MCP Joey | Anthropic claude-haiku-4-5 |
| AI — embeddings | OpenAI text-embedding-3-small |
| MCP server | `@modelcontextprotocol/sdk` + `mcp-handler` |
| Local storage | `localStorage` (demo mode + settings) |
| Deployment | Vercel |

---

## Screens

| Route | Description |
|---|---|
| `/login` | Entry point. Google OAuth or frictionless Demo mode. |
| `/onboarding` | First-run name input. |
| `/` | Today's check-in — couch selector, energy cards, journal editor, photo frame, save. |
| `/history` | Chronological list of entries. Desktop: two-panel (list + detail). |
| `/entry/[id]` | Full entry detail on mobile. |
| `/settings` | Language toggle. |
| `/docs` | Interactive API and MCP documentation. |

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
- `.hyd-frame-enter` / `.hyd-photo-enter` / `.hyd-photo-exit` — snapshot frame animations

---

## Key components

### ChemexLoader
`components/ChemexLoader.tsx` + `components/ChemexLoader.module.css`

A custom SVG animated loading screen shaped like a Chemex coffee maker.

- **Coffee fill** — rises from 0% to ~90% over ~3.5s (simulated), then to 100% when `complete={true}`.
- **Text** — *"Brewing your day…"* with a breathing opacity animation.

The loader appears for a minimum of **2 seconds** even if data loads instantly, to avoid a jarring flash.

### CouchSelector
`components/CouchSelector.tsx` — renders the couch SVG and places energy character icons on the left/right seat based on selected energies.

### EnergyCard
`components/EnergyCard.tsx` — 3×2 grid of selectable cards. First tap = primary energy, second tap = secondary. Tap selected card to deselect.

### EnergyBadge
`components/EnergyBadge.tsx` — compact label shown in history cards and entry detail. Blue background (`#6fb6d4`), yellow text (`#fde52f`), no border.

### DateNavigator
`components/DateNavigator.tsx` — horizontal date timeline on the Journal screen.

- Displays every day of the current month as a scrollable chip strip.
- **Four visual states:** selected (yellow `#fde52f`), has entry (warm white card + purple border), no entry (grey ghost), today (blue dot `#6fb6d4` regardless of selection).
- Auto-scrolls the selected or today chip into view on mount.

### JournalEditor
`components/JournalEditor.tsx` — TipTap rich text editor with placeholder text, built-in voice input, and a camera button to attach a photo.

- **Microphone button** — appears when the browser supports `SpeechRecognition` / `webkitSpeechRecognition`.
- **Camera button** — opens the file picker for photo attachment.
- **Language-aware** — uses `pl-PL` when the app is in Polish, `en-US` in English.
- **Non-destructive** — transcript is appended to existing text, never replaces it.

### SnapshotFrame
`components/SnapshotFrame.tsx` — inline SVG photo frame based on `public/branding/frame.svg`.

- Frame paths are inlined as JSX; a `<mask>` cuts the opening so the photo shows through.
- Detects photo orientation (`naturalWidth > naturalHeight`) and rotates the frame 90° CW for landscape photos — the photo itself stays upright in SVG root space.
- `xMidYMid slice` fill for both orientations.
- Animated entrance/exit (`hyd-frame-enter`, `hyd-photo-enter`, `hyd-photo-exit`).
- Replace and Delete controls below the frame.

### JoeyChat & JoeyInvite
`components/JoeyChat.tsx` — Streaming chat panel backed by `claude-sonnet-4-6`. Maintains conversation history for the session (ephemeral, not persisted).

`components/JoeyInvite.tsx` — Entry point for Joey:
- **Mobile** — full-width strip pinned above the bottom nav, blue (`#6fb6d4`), yellow text.
- **Desktop** — FAB (floating action button) fixed to the bottom-right corner.

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

## External API

All endpoints require a Bearer token (`hyd_…`). Generate one in the app under Settings → API Key (or `POST /api/v1/token`).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/today` | Today's entry + couch story |
| `GET` | `/api/v1/entries` | List entries (`limit`, `from`, `to` params) |
| `POST` | `/api/v1/entry` | Create or update an entry |
| `POST` | `/api/v1/ask-joey` | Ask Joey (uses hybrid search for history) |
| `POST` | `/api/v1/photo` | Upload a photo for a given date |
| `DELETE` | `/api/v1/photo` | Remove a photo for a given date |

Full documentation with request/response examples: `/docs`.

---

## MCP server

The app exposes an MCP server at `/api/mcp` for use with Claude Desktop and other MCP clients. Supports SSE and streamable HTTP transports. Authenticated with the same API key as the REST API.

**Available tools:**
- `journal_get_today` — read the entry for a given date
- `journal_save_entry` — create or update an entry
- `journal_list_entries` — list entries with optional date filter
- `joey_ask` — chat with Joey from an external client

Connect URL: `https://<your-domain>/api/mcp`

---

## Local development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in required vars (see below)

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
SUPABASE_SECRET_KEY=            # Supabase service_role key (server-side only)
JOEY_ANTHROPIC_API_KEY=         # Anthropic key for Joey (or ANTHROPIC_API_KEY)
OPENAI_API_KEY=                 # OpenAI key for hybrid search embeddings
JOURNAL_SKILL_SECRET=           # Shared secret for the /api/journal skill webhook
```

Without Supabase vars, Google OAuth will not work. Demo mode works without any env vars. Without the Anthropic key, Joey chat will return errors. Without the OpenAI key, `/api/v1/ask-joey` falls back to simple recent-entry lookup.

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
│   ├── page.tsx                    # Today's check-in
│   ├── login/page.tsx              # Login (Google + Demo)
│   ├── onboarding/page.tsx         # Name input
│   ├── history/page.tsx            # Journal history list
│   ├── entry/[id]/page.tsx         # Entry detail (mobile)
│   ├── settings/page.tsx           # Language toggle
│   ├── docs/page.tsx               # API + MCP documentation
│   ├── globals.css                 # Tailwind + utility classes + animations
│   └── api/
│       ├── joey/route.ts           # Streaming Joey chat (claude-sonnet-4-6)
│       ├── journal/route.ts        # Skill webhook (shared secret)
│       ├── auth/callback/route.ts  # OAuth callback
│       └── v1/
│           ├── today/route.ts      # GET today's entry
│           ├── entries/route.ts    # GET entries list
│           ├── entry/route.ts      # POST upsert entry
│           ├── ask-joey/route.ts   # POST ask Joey (haiku + hybrid search)
│           ├── photo/route.ts      # POST/DELETE photo
│           ├── token/route.ts      # GET/POST API key management
│           └── mcp/[transport]/route.ts  # MCP server
├── components/
│   ├── ChemexLoader.tsx            # Loading animation
│   ├── CouchSelector.tsx           # Couch SVG interaction
│   ├── EnergyCard.tsx              # Selectable energy cards
│   ├── EnergyBadge.tsx             # Compact energy label
│   ├── DateNavigator.tsx           # Horizontal date timeline
│   ├── JournalEditor.tsx           # TipTap editor + voice + camera
│   ├── SnapshotFrame.tsx           # SVG photo frame (portrait + landscape)
│   ├── CouchStoryBlock.tsx         # Generated day story
│   ├── EntryDetail.tsx             # Full entry view + photo management
│   ├── JoeyChat.tsx                # AI chat panel (streaming)
│   ├── JoeyInvite.tsx              # Joey entry point (mobile strip / desktop FAB)
│   ├── JoeyButton.tsx              # Reusable Joey CTA button
│   ├── BottomNav.tsx               # Mobile navigation
│   └── DesktopNav.tsx              # Desktop navigation
├── lib/
│   ├── storage.ts                  # Entry CRUD (Supabase + localStorage)
│   ├── photoStorage.ts             # Photo upload/delete via /api/v1/photo
│   ├── imageUtils.ts               # Client-side resize + orientation detection
│   ├── search.ts                   # hybridSearch (OpenAI embeddings + Supabase RPC)
│   ├── demo.ts                     # Demo mode flag + localStorage CRUD
│   ├── energies.ts                 # Energy config
│   ├── couchStories.ts             # Story generation per energy combo
│   ├── joey.ts                     # Joey system prompt builder
│   ├── api-auth.ts                 # Bearer token verification (SHA-256)
│   ├── supabase.ts                 # Supabase client singleton
│   ├── i18n.tsx                    # Translation hook
│   └── types.ts                    # Shared types
├── locales/
│   ├── en.json
│   └── pl.json
└── public/
    ├── branding/
    │   ├── frame.svg               # Source SVG for the photo frame
    │   └── couch.png
    └── icons/                      # PWA icons
```
