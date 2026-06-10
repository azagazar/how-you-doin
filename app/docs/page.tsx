"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "authentication" | "create" | "ask" | "read-today" | "read-entries"

// ─── Code block ──────────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="relative group rounded-none border border-[#6a4f79] bg-[#1a1a2e] text-sm">
      <button
        onClick={copy}
        className="absolute top-2 right-2 font-display text-xs uppercase px-2 py-1 text-[#fde52f] opacity-0 group-hover:opacity-100 transition-opacity border border-[#fde52f]"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="p-4 overflow-x-auto text-[#e2e8f0] leading-relaxed whitespace-pre">
        {children}
      </pre>
    </div>
  )
}

// ─── Field row ────────────────────────────────────────────────────────────────

function Field({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <tr className="border-t border-[#6a4f79]/20">
      <td className="py-2 pr-4 font-mono text-sm text-[#6a4f79]">{name}</td>
      <td className="py-2 pr-4 font-mono text-xs text-[#938d8d]">{type}</td>
      <td className="py-2 pr-4 text-xs">
        {required
          ? <span className="bg-[#6a4f79] text-white px-1.5 py-0.5 text-[10px] uppercase font-display">required</span>
          : <span className="text-[#938d8d]">optional</span>}
      </td>
      <td className="py-2 font-serif text-sm text-[#423b35]">{desc}</td>
    </tr>
  )
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ id, method, path, description }: { id: string; method?: string; path?: string; description: string }) {
  return (
    <div id={id} className="pt-2 pb-4 border-b-4 border-[#6a4f79] mb-6">
      {method && path && (
        <div className="flex items-center gap-3 mb-2">
          <span className="font-display text-sm uppercase px-2 py-0.5 border border-[#6a4f79]"
            style={{ background: method === "GET" ? "#fde52f" : "#6a4f79", color: method === "GET" ? "#000" : "#fde52f" }}>
            {method}
          </span>
          <code className="font-mono text-sm text-[#6a4f79]">{path}</code>
        </div>
      )}
      <p className="font-serif text-[#423b35]">{description}</p>
    </div>
  )
}

// ─── API Key widget ───────────────────────────────────────────────────────────

function ApiKeyWidget() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      setLoggedIn(true)
      const res = await fetch("/api/v1/token", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const { api_key } = await res.json()
        setApiKey(api_key)
      }
      setLoading(false)
    })
  }, [])

  async function regenerate() {
    setRegenerating(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch("/api/v1/token", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const { api_key } = await res.json()
      setApiKey(api_key)
      setRevealed(true)
    }
    setRegenerating(false)
  }

  function copy() {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (loading) {
    return <div className="figma-card p-5 font-serif text-[#938d8d] text-sm">Loading…</div>
  }

  if (!loggedIn) {
    return (
      <div className="figma-card p-5 flex items-center justify-between">
        <span className="font-serif text-[#423b35]">Log in to see your personal API key.</span>
        <Link href="/login" className="figma-btn px-4 py-2 font-display text-lg uppercase">Log in</Link>
      </div>
    )
  }

  const display = apiKey
    ? revealed
      ? apiKey
      : apiKey.slice(0, 8) + "••••••••••••••••••••••••••••••••••••••••"
    : "—"

  return (
    <div className="figma-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg uppercase text-[#6a4f79]">Your API Key</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRevealed(r => !r)}
            className="font-display text-sm uppercase px-3 py-1.5 border border-[#6a4f79] text-[#6a4f79] hover:bg-[#6a4f79] hover:text-[#fde52f] transition-colors"
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button
            onClick={copy}
            className="font-display text-sm uppercase px-3 py-1.5 border border-[#6a4f79] text-[#6a4f79] hover:bg-[#6a4f79] hover:text-[#fde52f] transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="font-display text-sm uppercase px-3 py-1.5 bg-[#6a4f79] text-[#fde52f] border border-[#6a4f79] hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {regenerating ? "…" : "Regenerate"}
          </button>
        </div>
      </div>
      <code className="block font-mono text-sm bg-[#1a1a2e] text-[#e2e8f0] px-4 py-3 border border-[#6a4f79] break-all">
        {display}
      </code>
      <p className="font-serif text-xs text-[#938d8d]">
        Keep this key secret. Regenerating will immediately invalidate the old key.
      </p>
    </div>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ label, target, active }: { label: string; target: Section; active: boolean }) {
  return (
    <a
      href={`#${target}`}
      className={`block px-3 py-1.5 font-display text-base uppercase transition-colors ${
        active
          ? "bg-[#fde52f] text-black border-l-4 border-[#6a4f79]"
          : "text-[#423b35] hover:text-[#6a4f79]"
      }`}
    >
      {label}
    </a>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { label: string; section: Section; group?: string }[] = [
  { label: "Authentication", section: "authentication", group: "Getting Started" },
  { label: "Create", section: "create", group: "API" },
  { label: "Ask", section: "ask", group: "API" },
  { label: "Read Today", section: "read-today", group: "API" },
  { label: "Read Entries", section: "read-entries", group: "API" },
]

export default function DocsPage() {
  const [active, setActive] = useState<Section>("authentication")
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    function onScroll() {
      const sections = NAV_ITEMS.map(n => document.getElementById(n.section)).filter(Boolean) as HTMLElement[]
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].getBoundingClientRect().top <= 120) {
          setActive(sections[i].id as Section)
          return
        }
      }
      setActive("authentication")
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const BASE = "https://how-you-doin.vercel.app"

  return (
    <div className="h-dvh flex flex-col bg-[#ece7df]">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 lg:px-8 h-14 bg-[#ece7df] border-b border-[#6a4f79]">
        <Link href="/" className="font-display text-2xl uppercase leading-none text-black hover:opacity-70 transition-opacity">
          ← How You Doin&apos;?
        </Link>
        <span className="font-display text-xl uppercase text-[#6a4f79]">API Docs</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav — hidden on mobile, visible on lg */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-[#6a4f79] bg-[#f7f3ec] overflow-y-auto">
          <div className="p-4 space-y-5">
            {["Getting Started", "API"].map(group => (
              <div key={group}>
                <p className="font-display text-xs uppercase text-[#938d8d] mb-1 px-3">{group}</p>
                {NAV_ITEMS.filter(n => n.group === group).map(n => (
                  <NavItem key={n.section} label={n.label} target={n.section} active={active === n.section} />
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 lg:px-10 py-10 space-y-16">

            {/* Page title */}
            <div>
              <h1 className="font-display text-6xl uppercase leading-none text-black mb-2">API Reference</h1>
              <p className="font-serif text-lg text-[#423b35]">
                Build integrations with How You Doin&apos;? — read and write journal entries, and talk to Joey, from any tool or MCP client.
              </p>
            </div>

            {/* Authentication */}
            <section id="authentication" className="space-y-5">
              <SectionHeading
                id=""
                description="All endpoints require a personal API key passed as a Bearer token in the Authorization header."
              />
              <p className="font-display text-2xl uppercase text-black">Authentication</p>
              <Code>{`Authorization: Bearer hyd_your_api_key_here`}</Code>
              <ApiKeyWidget />
            </section>

            {/* Create */}
            <section id="create" className="space-y-5">
              <p className="font-display text-2xl uppercase text-black">Create</p>
              <SectionHeading
                id=""
                method="POST"
                path="/api/v1/entry"
                description="Create or update a journal entry for a given date. If an entry already exists for that date, it will be updated."
              />
              <p className="font-display text-sm uppercase text-[#6a4f79]">Request body</p>
              <table className="w-full text-left">
                <tbody>
                  <Field name="note" type="string" required desc="The journal text. Plain text or HTML." />
                  <Field name="date" type="string" desc="Date in YYYY-MM-DD. Defaults to today." />
                  <Field name="primary_energy" type="string" desc="One of: monica, chandler, ross, joey, phoebe, rachel" />
                  <Field name="secondary_energy" type="string" desc="A second energy from the same list." />
                </tbody>
              </table>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Example request</p>
              <Code>{`curl -X POST ${BASE}/api/v1/entry \\
  -H "Authorization: Bearer hyd_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "note": "Long day, but I got through it.",
    "primary_energy": "monica"
  }'`}</Code>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Response</p>
              <Code>{`{
  "ok": true,
  "action": "created",
  "entry": {
    "id": "3bb7b69a-...",
    "date": "2026-06-10",
    "primary_energy": "monica",
    "secondary_energy": null,
    "note": "Long day, but I got through it."
  }
}`}</Code>
            </section>

            {/* Ask */}
            <section id="ask" className="space-y-5">
              <p className="font-display text-2xl uppercase text-black">Ask</p>
              <SectionHeading
                id=""
                method="POST"
                path="/api/v1/ask-joey"
                description="Send a message to Joey. He'll respond based on the relevant journal entry. History is loaded automatically when the question requires it."
              />
              <p className="font-display text-sm uppercase text-[#6a4f79]">Request body</p>
              <table className="w-full text-left">
                <tbody>
                  <Field name="message" type="string" required desc="The question or message for Joey." />
                  <Field name="date" type="string" desc="Date context for Joey. Defaults to today." />
                  <Field name="include_history" type="boolean" desc="Force historical context. Auto-detected by default." />
                </tbody>
              </table>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Example request</p>
              <Code>{`curl -X POST ${BASE}/api/v1/ask-joey \\
  -H "Authorization: Bearer hyd_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "How has my week been?"}'`}</Code>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Response</p>
              <Code>{`{
  "reply": "Honestly? Looking at your week — Monday was full-on Monica, Tuesday you took it easy Joey-style. That's a nice balance. How are you feeling about it?",
  "context": {
    "date": "2026-06-10",
    "used_history": true,
    "entries_loaded": 5
  }
}`}</Code>
            </section>

            {/* Read Today */}
            <section id="read-today" className="space-y-5">
              <p className="font-display text-2xl uppercase text-black">Read</p>
              <SectionHeading
                id=""
                method="GET"
                path="/api/v1/today"
                description="Returns the current user's journal entry for today, including the couch story and reflection prompt for the selected energies."
              />
              <p className="font-display text-sm uppercase text-[#6a4f79]">Example request</p>
              <Code>{`curl ${BASE}/api/v1/today \\
  -H "Authorization: Bearer hyd_your_key"`}</Code>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Response — entry exists</p>
              <Code>{`{
  "date": "2026-06-10",
  "exists": true,
  "primary_energy": "monica",
  "secondary_energy": null,
  "note": "Long day, but I got through it.",
  "couch_story": {
    "dayTitle": "Getting Things Done",
    "story": "Monica's on the couch...",
    "reflection": "What's one thing you can let go of today?"
  }
}`}</Code>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Response — no entry yet</p>
              <Code>{`{
  "date": "2026-06-10",
  "exists": false,
  "primary_energy": null,
  "secondary_energy": null,
  "note": null,
  "couch_story": { "dayTitle": "...", "story": "...", "reflection": "..." }
}`}</Code>
            </section>

            {/* Read Entries */}
            <section id="read-entries" className="space-y-5">
              <SectionHeading
                id=""
                method="GET"
                path="/api/v1/entries"
                description="Returns a list of journal entries, newest first. Supports optional limit and date range filters."
              />
              <p className="font-display text-sm uppercase text-[#6a4f79]">Query parameters</p>
              <table className="w-full text-left">
                <tbody>
                  <Field name="limit" type="number" desc="Max entries to return. Default 10, max 50." />
                  <Field name="from" type="string" desc="Start date (YYYY-MM-DD), inclusive." />
                  <Field name="to" type="string" desc="End date (YYYY-MM-DD), inclusive." />
                </tbody>
              </table>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Example request</p>
              <Code>{`curl "${BASE}/api/v1/entries?limit=5&from=2026-06-01" \\
  -H "Authorization: Bearer hyd_your_key"`}</Code>
              <p className="font-display text-sm uppercase text-[#6a4f79]">Response</p>
              <Code>{`{
  "entries": [
    {
      "id": "3bb7b69a-...",
      "date": "2026-06-10",
      "primary_energy": "monica",
      "secondary_energy": null,
      "note": "Long day, but I got through it."
    }
  ],
  "total": 1
}`}</Code>
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}
