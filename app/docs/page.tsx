"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "api" | "mcp"
type ApiSection = "authentication" | "create" | "ask" | "read-today" | "read-entries"
type McpSection = "mcp-connect" | "mcp-tools"

// ─── Primitives ───────────────────────────────────────────────────────────────

function Code({ children, lang = "bash" }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group border border-[#6a4f79] bg-[#14121f]">
      <button
        onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
        className="absolute top-2 right-2 font-display text-[11px] uppercase px-2 py-1 text-[#fde52f] opacity-0 group-hover:opacity-100 transition-opacity border border-[#fde52f]/60 hover:border-[#fde52f]"
      >
        {copied ? "✓" : "Copy"}
      </button>
      <pre className="p-4 overflow-x-auto text-[13px] text-[#e2e8f0] leading-relaxed">{children}</pre>
    </div>
  )
}

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className="font-display text-xs uppercase px-2 py-0.5 border border-[#6a4f79] select-none"
      style={{ background: method === "GET" ? "#fde52f" : "#6a4f79", color: method === "GET" ? "#000" : "#fde52f" }}
    >
      {method}
    </span>
  )
}

function EndpointHeader({ method, path, summary }: { method: "GET" | "POST"; path: string; summary: string }) {
  return (
    <div className="pb-4 border-b-4 border-[#6a4f79] mb-5">
      <div className="flex items-center gap-3 mb-2">
        <MethodBadge method={method} />
        <code className="font-mono text-sm text-[#6a4f79]">{path}</code>
      </div>
      <p className="font-serif text-[#423b35]">{summary}</p>
    </div>
  )
}

function ParamRow({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <tr className="border-t border-[#6a4f79]/20">
      <td className="py-2 pr-4 font-mono text-sm text-[#6a4f79] whitespace-nowrap">{name}</td>
      <td className="py-2 pr-4 font-mono text-xs text-[#938d8d] whitespace-nowrap">{type}</td>
      <td className="py-2 pr-4 whitespace-nowrap">
        {required
          ? <span className="bg-[#6a4f79] text-white px-1.5 py-0.5 text-[10px] uppercase font-display tracking-wide">required</span>
          : <span className="text-[#938d8d] text-xs">optional</span>}
      </td>
      <td className="py-2 font-serif text-sm text-[#423b35]">{desc}</td>
    </tr>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-display text-xs uppercase text-[#6a4f79] tracking-widest mb-2">{children}</p>
}

// ─── Token widget ─────────────────────────────────────────────────────────────

function TokenWidget() {
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
      const res = await fetch("/api/v1/token", { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setApiKey((await res.json()).api_key)
      setLoading(false)
    })
  }, [])

  async function regenerate() {
    setRegenerating(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch("/api/v1/token", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) { setApiKey((await res.json()).api_key); setRevealed(true) }
    setRegenerating(false)
  }

  if (loading) return (
    <div className="border border-[#6a4f79] bg-[#f7f3ec] px-5 py-4 flex items-center gap-3">
      <span className="font-display text-sm uppercase text-[#938d8d]">Loading…</span>
    </div>
  )

  if (!loggedIn) return (
    <div className="border border-[#6a4f79] bg-[#f7f3ec] px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-display text-sm uppercase text-[#6a4f79] tracking-wide mb-0.5">Personal API Token</p>
        <p className="font-serif text-sm text-[#938d8d]">Log in to generate your token.</p>
      </div>
      <Link href="/login" className="flex-shrink-0 figma-btn px-4 py-2 font-display text-lg uppercase">
        Log in
      </Link>
    </div>
  )

  const display = apiKey
    ? revealed ? apiKey : `${apiKey.slice(0, 12)}${"•".repeat(36)}`
    : "—"

  return (
    <div className="border border-[#6a4f79] bg-[#f7f3ec] px-5 py-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase text-[#6a4f79] tracking-wide mb-0.5">Personal API Token</p>
          <p className="font-serif text-xs text-[#938d8d]">Use this as your <code className="font-mono">Authorization: Bearer</code> header on all requests.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setRevealed(r => !r)} className="font-display text-xs uppercase px-3 py-1.5 border border-[#6a4f79] text-[#6a4f79] hover:bg-[#6a4f79] hover:text-[#fde52f] transition-colors">{revealed ? "Hide" : "Reveal"}</button>
          <button onClick={() => { if (apiKey) { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 1800) } }} className="font-display text-xs uppercase px-3 py-1.5 border border-[#6a4f79] text-[#6a4f79] hover:bg-[#6a4f79] hover:text-[#fde52f] transition-colors">{copied ? "Copied!" : "Copy"}</button>
          <button onClick={regenerate} disabled={regenerating} className="font-display text-xs uppercase px-3 py-1.5 bg-[#6a4f79] text-[#fde52f] border border-[#6a4f79] hover:opacity-80 transition-opacity disabled:opacity-40">{regenerating ? "…" : "Regenerate"}</button>
        </div>
      </div>
      <code className="block font-mono text-sm bg-[#14121f] text-[#e2e8f0] px-4 py-2.5 border border-[#6a4f79] break-all">
        {display}
      </code>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function NavLink({ label, id, active }: { label: string; id: string; active: boolean }) {
  return (
    <a href={`#${id}`} className={`block px-3 py-1.5 font-display text-[15px] uppercase leading-none transition-colors ${active ? "bg-[#fde52f] text-black border-l-4 border-[#6a4f79]" : "text-[#423b35]/70 hover:text-[#6a4f79]"}`}>
      {label}
    </a>
  )
}

// ─── API tab content ──────────────────────────────────────────────────────────

const API_NAV = [
  { id: "authentication", label: "Authentication", group: "Getting Started" },
  { id: "create", label: "Create Entry", group: "Endpoints" },
  { id: "ask", label: "Ask Joey", group: "Endpoints" },
  { id: "read-today", label: "Read Today", group: "Endpoints" },
  { id: "read-entries", label: "Read Entries", group: "Endpoints" },
]

function ApiContent() {
  const BASE = "https://how-you-doin.vercel.app"
  return (
    <div className="space-y-16">
      <section id="authentication" className="space-y-4">
        <h2 className="font-display text-4xl uppercase leading-none">Authentication</h2>
        <p className="font-serif text-[#423b35]">All endpoints require your personal token as a Bearer header.</p>
        <Code>{`Authorization: Bearer hyd_your_token`}</Code>
      </section>

      <section id="create" className="space-y-4">
        <h2 className="font-display text-4xl uppercase leading-none">Create Entry</h2>
        <EndpointHeader method="POST" path="/api/v1/entry" summary="Create or update a journal entry for a given date. If an entry already exists for that date it will be updated." />
        <SectionTitle>Request body</SectionTitle>
        <table className="w-full text-left"><tbody>
          <ParamRow name="note" type="string" required desc="The journal text." />
          <ParamRow name="date" type="string" desc="YYYY-MM-DD — defaults to today." />
          <ParamRow name="primary_energy" type="string" desc="monica · chandler · ross · joey · phoebe · rachel" />
          <ParamRow name="secondary_energy" type="string" desc="A second energy from the same set." />
        </tbody></table>
        <SectionTitle>Example</SectionTitle>
        <Code>{`curl -X POST ${BASE}/api/v1/entry \\
  -H "Authorization: Bearer hyd_your_token" \\
  -H "Content-Type: application/json" \\
  -d '{"note": "Long day, but I got through it.", "primary_energy": "monica"}'`}</Code>
        <SectionTitle>Response</SectionTitle>
        <Code>{`{ "ok": true, "action": "created", "entry": { "id": "…", "date": "2026-06-11", "primary_energy": "monica", "secondary_energy": null, "note": "Long day, but I got through it." } }`}</Code>
      </section>

      <section id="ask" className="space-y-4">
        <h2 className="font-display text-4xl uppercase leading-none">Ask Joey</h2>
        <EndpointHeader method="POST" path="/api/v1/ask-joey" summary="Send a message to Joey. He responds based on the journal entry for the given date. History is loaded automatically when the question requires it." />
        <SectionTitle>Request body</SectionTitle>
        <table className="w-full text-left"><tbody>
          <ParamRow name="message" type="string" required desc="The question or message for Joey." />
          <ParamRow name="date" type="string" desc="Date context — defaults to today." />
          <ParamRow name="include_history" type="boolean" desc="Force loading recent entries. Auto-detected by default." />
        </tbody></table>
        <SectionTitle>Example</SectionTitle>
        <Code>{`curl -X POST ${BASE}/api/v1/ask-joey \\
  -H "Authorization: Bearer hyd_your_token" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "How has my week been?"}'`}</Code>
        <SectionTitle>Response</SectionTitle>
        <Code>{`{ "reply": "Looking at your week — Monday was full-on Monica, Wednesday Joey-style easy. That's a solid balance.", "context": { "date": "2026-06-11", "used_history": true, "entries_loaded": 5 } }`}</Code>
      </section>

      <section id="read-today" className="space-y-4">
        <h2 className="font-display text-4xl uppercase leading-none">Read Today</h2>
        <EndpointHeader method="GET" path="/api/v1/today" summary="Returns today's journal entry, including the couch story and reflection prompt for the selected energies." />
        <SectionTitle>Example</SectionTitle>
        <Code>{`curl ${BASE}/api/v1/today -H "Authorization: Bearer hyd_your_token"`}</Code>
        <SectionTitle>Response</SectionTitle>
        <Code>{`{ "date": "2026-06-11", "exists": true, "primary_energy": "monica", "secondary_energy": null, "note": "Long day, but I got through it.", "couch_story": { "dayTitle": "Getting Things Done", "story": "…", "reflection": "What's one thing you can let go of today?" } }`}</Code>
      </section>

      <section id="read-entries" className="space-y-4">
        <h2 className="font-display text-4xl uppercase leading-none">Read Entries</h2>
        <EndpointHeader method="GET" path="/api/v1/entries" summary="Returns a list of journal entries, newest first. Supports limit and date range filters." />
        <SectionTitle>Query params</SectionTitle>
        <table className="w-full text-left"><tbody>
          <ParamRow name="limit" type="number" desc="Max entries — default 10, max 50." />
          <ParamRow name="from" type="string" desc="Start date YYYY-MM-DD, inclusive." />
          <ParamRow name="to" type="string" desc="End date YYYY-MM-DD, inclusive." />
        </tbody></table>
        <SectionTitle>Example</SectionTitle>
        <Code>{`curl "${BASE}/api/v1/entries?limit=5" -H "Authorization: Bearer hyd_your_token"`}</Code>
        <SectionTitle>Response</SectionTitle>
        <Code>{`{ "entries": [{ "id": "…", "date": "2026-06-11", "primary_energy": "monica", "secondary_energy": null, "note": "Long day, but I got through it." }], "total": 1 }`}</Code>
      </section>
    </div>
  )
}

// ─── MCP tab content ──────────────────────────────────────────────────────────

const MCP_NAV = [
  { id: "mcp-connect", label: "Connect", group: "Getting Started" },
  { id: "mcp-tools", label: "Tools", group: "Reference" },
]

function McpContent({ apiKey }: { apiKey: string | null }) {
  const BASE = "https://how-you-doin.vercel.app"
  const mcpUrl = `${BASE}/api/mcp/mcp`
  const tokenPlaceholder = apiKey ?? "hyd_your_token"

  return (
    <div className="space-y-16">
      <section id="mcp-connect" className="space-y-5">
        <h2 className="font-display text-4xl uppercase leading-none">Connect</h2>
        <p className="font-serif text-[#423b35]">
          The MCP server is available at the URL below. It implements the{" "}
          <span className="font-mono text-sm text-[#6a4f79]">StreamableHTTP</span> transport — the modern standard for remote MCP servers.
          Any MCP-compatible client (Claude Desktop, Cursor, Windsurf, Claude Code…) can connect with your personal token.
        </p>

        <div className="border border-[#6a4f79] bg-[#f7f3ec] p-4 space-y-1">
          <p className="font-display text-xs uppercase text-[#6a4f79] tracking-widest">Server URL</p>
          <code className="font-mono text-sm text-[#423b35] break-all">{mcpUrl}</code>
        </div>

        <SectionTitle>Claude Desktop — claude_desktop_config.json</SectionTitle>
        <Code lang="json">{`{
  "mcpServers": {
    "how-you-doin": {
      "type": "http",
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${tokenPlaceholder}"
      }
    }
  }
}`}</Code>

        <SectionTitle>Claude Code — MCP config</SectionTitle>
        <Code lang="bash">{`claude mcp add how-you-doin \\
  --transport http \\
  --url ${mcpUrl} \\
  --header "Authorization: Bearer ${tokenPlaceholder}"`}</Code>

        <SectionTitle>Cursor / Windsurf — mcp.json</SectionTitle>
        <Code lang="json">{`{
  "mcpServers": {
    "how-you-doin": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${tokenPlaceholder}"
      }
    }
  }
}`}</Code>
      </section>

      <section id="mcp-tools" className="space-y-8">
        <h2 className="font-display text-4xl uppercase leading-none">Tools</h2>
        <p className="font-serif text-[#423b35]">The server exposes four tools. All tool calls require your token — passed once at connection time.</p>

        {/* Tool 1 */}
        <div className="space-y-3">
          <div className="border-b-4 border-[#6a4f79] pb-3">
            <code className="font-mono text-base text-[#6a4f79]">journal_get_today</code>
            <p className="font-serif text-sm text-[#423b35] mt-1">Get the journal entry for today or a specific date, including the couch story and reflection prompt.</p>
          </div>
          <table className="w-full text-left"><tbody>
            <ParamRow name="date" type="string" desc="YYYY-MM-DD — defaults to today." />
          </tbody></table>
        </div>

        {/* Tool 2 */}
        <div className="space-y-3">
          <div className="border-b-4 border-[#6a4f79] pb-3">
            <code className="font-mono text-base text-[#6a4f79]">journal_save_entry</code>
            <p className="font-serif text-sm text-[#423b35] mt-1">Create or update a journal entry. Energies are optional — omit them to save a note without any energy selected.</p>
          </div>
          <table className="w-full text-left"><tbody>
            <ParamRow name="note" type="string" required desc="The journal text." />
            <ParamRow name="date" type="string" desc="YYYY-MM-DD — defaults to today." />
            <ParamRow name="primary_energy" type="enum" desc="monica · chandler · ross · joey · phoebe · rachel" />
            <ParamRow name="secondary_energy" type="enum" desc="A second energy from the same set." />
          </tbody></table>
        </div>

        {/* Tool 3 */}
        <div className="space-y-3">
          <div className="border-b-4 border-[#6a4f79] pb-3">
            <code className="font-mono text-base text-[#6a4f79]">journal_list_entries</code>
            <p className="font-serif text-sm text-[#423b35] mt-1">List journal entries, newest first. Useful for reviewing recent history or building context for Joey.</p>
          </div>
          <table className="w-full text-left"><tbody>
            <ParamRow name="limit" type="number" desc="Max entries — default 10, max 50." />
            <ParamRow name="from" type="string" desc="Start date YYYY-MM-DD, inclusive." />
            <ParamRow name="to" type="string" desc="End date YYYY-MM-DD, inclusive." />
          </tbody></table>
        </div>

        {/* Tool 4 */}
        <div className="space-y-3">
          <div className="border-b-4 border-[#6a4f79] pb-3">
            <code className="font-mono text-base text-[#6a4f79]">joey_ask</code>
            <p className="font-serif text-sm text-[#423b35] mt-1">Send a message to Joey. He responds based on the relevant journal entry and detects automatically when broader history is needed.</p>
          </div>
          <table className="w-full text-left"><tbody>
            <ParamRow name="message" type="string" required desc="The question or message for Joey." />
            <ParamRow name="date" type="string" desc="Date context — defaults to today." />
          </tbody></table>
        </div>
      </section>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [tab, setTab] = useState<Tab>("api")
  const [active, setActive] = useState<string>("authentication")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  const nav = tab === "api" ? API_NAV : MCP_NAV

  // Scroll spy
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => {
      const ids = nav.map(n => n.id)
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el && el.getBoundingClientRect().top <= 120) { setActive(ids[i]); return }
      }
      setActive(ids[0])
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [tab, nav])

  // Reset active section on tab switch
  useEffect(() => {
    setActive(nav[0].id)
    mainRef.current?.scrollTo({ top: 0 })
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load API key for MCP config examples
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const res = await fetch("/api/v1/token", { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setApiKey((await res.json()).api_key)
    })
  }, [])

  return (
    <div className="h-dvh flex flex-col bg-[#ece7df]">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-[#6a4f79] bg-[#ece7df]">
        {/* Row 1: back + tabs */}
        <div className="flex items-center justify-between px-5 lg:px-8 h-12">
          <Link href="/settings" className="font-display text-lg uppercase leading-none text-[#6a4f79] hover:opacity-70 transition-opacity">
            ← Settings
          </Link>
          <nav className="flex items-center">
            {(["api", "mcp"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-display text-xl uppercase leading-none px-5 py-3 transition-colors ${tab === t ? "bg-[#fde52f] text-black border-b-4 border-[#6a4f79]" : "text-black/50 hover:text-black/80"}`}
              >
                {t === "api" ? "API" : "MCP"}
              </button>
            ))}
          </nav>
          <Link href="/" className="font-display text-lg uppercase leading-none text-[#6a4f79] hover:opacity-70 transition-opacity">
            App →
          </Link>
        </div>

        {/* Row 2: token widget */}
        <div className="px-5 lg:px-8 pb-4 pt-1">
          <TokenWidget />
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left nav */}
        <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 border-r border-[#6a4f79] bg-[#f7f3ec] overflow-y-auto">
          <div className="p-4 space-y-5">
            {Array.from(new Set(nav.map(n => n.group))).map(group => (
              <div key={group}>
                <p className="font-display text-[10px] uppercase text-[#938d8d] tracking-widest mb-1 px-3">{group}</p>
                {nav.filter(n => n.group === group).map(n => (
                  <NavLink key={n.id} id={n.id} label={n.label} active={active === n.id} />
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 lg:px-10 py-10">
            {tab === "api" ? <ApiContent /> : <McpContent apiKey={apiKey} />}
          </div>
        </main>
      </div>
    </div>
  )
}
