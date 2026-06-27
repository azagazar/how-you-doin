"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { BottomNav } from "@/components/BottomNav"
import { DesktopNav } from "@/components/DesktopNav"

// ─── Nav structure ────────────────────────────────────────────────────────────

const NAV = [
  { id: "authentication", label: "Authentication",  group: "Getting Started" },
  { id: "create",         label: "Create Entry",    group: "API" },
  { id: "ask",            label: "Ask Joey",         group: "API" },
  { id: "read-today",     label: "Read Today",       group: "API" },
  { id: "read-entries",   label: "Read Entries",     group: "API" },
  { id: "mcp-connect",    label: "Connect",          group: "MCP" },
  { id: "mcp-tools",      label: "Tools",            group: "MCP" },
]

const GROUPS = ["Getting Started", "API", "MCP"]

// ─── Primitives ───────────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
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
    <span className="font-display text-xs uppercase px-2 py-0.5 border border-[#6a4f79] select-none"
      style={{ background: method === "GET" ? "#fde52f" : "#6a4f79", color: method === "GET" ? "#000" : "#fde52f" }}>
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

function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-display text-xs uppercase text-[#6a4f79] tracking-widest mb-2">{children}</p>
}

// ─── Token widget ─────────────────────────────────────────────────────────────

function TokenWidget({ onNewToken }: { onNewToken?: (token: string) => void }) {
  // `masked`   — display string from server: "hyd_2a60••••••••••••••••••••••••••••••••••••••••••••••"
  // `newToken` — plaintext token shown ONCE right after regeneration, then cleared
  const [masked, setMasked] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      setLoggedIn(true)
      const res = await fetch("/api/v1/token", { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setMasked((await res.json()).masked)
      setLoading(false)
    })
  }, [])

  async function regenerate() {
    if (!confirm("Regenerating will immediately invalidate your current token. Continue?")) return
    setRegenerating(true)
    setNewToken(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setRegenerating(false); return }
    const res = await fetch("/api/v1/token", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const json = await res.json()
      setMasked(json.masked)
      setNewToken(json.api_key) // shown once
      onNewToken?.(json.api_key)
    }
    setRegenerating(false)
  }

  function copy(val: string) {
    navigator.clipboard.writeText(val)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (loading) return (
    <div className="border border-[#6a4f79]/30 bg-[#f7f3ec] px-4 py-3">
      <span className="font-display text-xs uppercase text-[#938d8d]">Loading…</span>
    </div>
  )

  if (!loggedIn) return (
    <div className="border border-[#6a4f79]/30 bg-[#f7f3ec] px-4 py-3 space-y-2">
      <p className="font-display text-xs uppercase text-[#6a4f79] tracking-widest">Personal Token</p>
      <Link href="/login" className="block w-full text-center figma-btn py-2 font-display text-base uppercase">
        Log in
      </Link>
    </div>
  )

  return (
    <div className="border border-[#6a4f79]/30 bg-[#f7f3ec] px-4 py-3 space-y-2">
      <p className="font-display text-xs uppercase text-[#6a4f79] tracking-widest">Personal Token</p>

      {/* Show new token once after regeneration */}
      {newToken ? (
        <div className="space-y-1.5">
          <p className="font-display text-[10px] uppercase text-[#c0392b] tracking-wide">
            Copy now — won&apos;t be shown again
          </p>
          <code className="block font-mono text-xs bg-[#14121f] text-[#fde52f] px-3 py-2 border border-[#fde52f]/40 break-all leading-relaxed">
            {newToken}
          </code>
          <button
            onClick={() => copy(newToken)}
            className="w-full font-display text-[11px] uppercase py-1.5 bg-[#fde52f] text-black border border-[#6a4f79] hover:opacity-80 transition-opacity"
          >
            {copied ? "Copied!" : "Copy token"}
          </button>
          <button
            onClick={() => setNewToken(null)}
            className="w-full font-display text-[10px] uppercase py-1 text-[#938d8d] hover:text-[#6a4f79] transition-colors"
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <code className="block font-mono text-xs bg-[#14121f] text-[#e2e8f0] px-3 py-2 border border-[#6a4f79]/40 break-all leading-relaxed">
            {masked ?? "—"}
          </code>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copy(masked ?? "")}
              disabled={!masked}
              className="flex-1 font-display text-[11px] uppercase py-1.5 border border-[#6a4f79] text-[#6a4f79] hover:bg-[#6a4f79] hover:text-[#fde52f] transition-colors disabled:opacity-30"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="flex-1 font-display text-[11px] uppercase py-1.5 bg-[#6a4f79] text-[#fde52f] border border-[#6a4f79] hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {regenerating ? "…" : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Content sections ─────────────────────────────────────────────────────────

function SectionContent({ id, apiKey }: { id: string; apiKey: string | null }) {
  const BASE = "https://how-you-doin.vercel.app"
  const token = apiKey ?? "hyd_your_token"
  const mcpUrl = `${BASE}/api/mcp`

  if (id === "authentication") return (
    <div className="space-y-5">
      <h2 className="font-display text-4xl uppercase leading-none">Authentication</h2>
      <p className="font-serif text-[#423b35]">All endpoints require your personal token as a Bearer header.</p>
      <Code>{`Authorization: Bearer hyd_your_token`}</Code>
      <p className="font-serif text-sm text-[#938d8d]">Your token is shown in the left panel. Regenerating it immediately invalidates the previous one.</p>
    </div>
  )

  if (id === "create") return (
    <div className="space-y-5">
      <h2 className="font-display text-4xl uppercase leading-none">Create Entry</h2>
      <EndpointHeader method="POST" path="/api/v1/entry" summary="Create or update a journal entry. If an entry already exists for that date it will be updated. Energies are optional." />
      <Label>Request body</Label>
      <table className="w-full text-left"><tbody>
        <ParamRow name="note" type="string" required desc="The journal text." />
        <ParamRow name="date" type="string" desc="YYYY-MM-DD — defaults to today." />
        <ParamRow name="primary_energy" type="string" desc="monica · chandler · ross · joey · phoebe · rachel" />
        <ParamRow name="secondary_energy" type="string" desc="A second energy from the same set." />
      </tbody></table>
      <Label>Example</Label>
      <Code>{`curl -X POST ${BASE}/api/v1/entry \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"note": "Long day, but I got through it.", "primary_energy": "monica"}'`}</Code>
      <Label>Response</Label>
      <Code>{`{ "ok": true, "action": "created", "entry": { "id": "…", "date": "2026-06-11", "primary_energy": "monica", "secondary_energy": null, "note": "Long day, but I got through it." } }`}</Code>
    </div>
  )

  if (id === "ask") return (
    <div className="space-y-5">
      <h2 className="font-display text-4xl uppercase leading-none">Ask Joey</h2>
      <EndpointHeader method="POST" path="/api/v1/ask-joey" summary="Send a message to Joey. He responds based on the journal entry for the given date and loads history automatically when the question needs it." />
      <Label>Request body</Label>
      <table className="w-full text-left"><tbody>
        <ParamRow name="message" type="string" required desc="The question or message for Joey." />
        <ParamRow name="date" type="string" desc="Date context — defaults to today." />
        <ParamRow name="include_history" type="boolean" desc="Force loading recent entries. Auto-detected by default." />
      </tbody></table>
      <Label>Example</Label>
      <Code>{`curl -X POST ${BASE}/api/v1/ask-joey \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "How has my week been?"}'`}</Code>
      <Label>Response</Label>
      <Code>{`{ "reply": "Looking at your week — Monday was full-on Monica, Wednesday Joey-style easy. That's a solid balance.", "context": { "date": "2026-06-11", "used_history": true, "entries_loaded": 5 } }`}</Code>
    </div>
  )

  if (id === "read-today") return (
    <div className="space-y-5">
      <h2 className="font-display text-4xl uppercase leading-none">Read Today</h2>
      <EndpointHeader method="GET" path="/api/v1/today" summary="Returns today's journal entry, including the couch story and reflection prompt for the selected energies. Returns a clear empty state if no entry exists yet." />
      <Label>Example</Label>
      <Code>{`curl ${BASE}/api/v1/today \\
  -H "Authorization: Bearer ${token}"`}</Code>
      <Label>Response — entry exists</Label>
      <Code>{`{ "date": "2026-06-11", "exists": true, "primary_energy": "monica", "secondary_energy": null, "note": "Long day, but I got through it.", "couch_story": { "dayTitle": "Getting Things Done", "story": "…", "reflection": "What's one thing you can let go of today?" } }`}</Code>
      <Label>Response — no entry yet</Label>
      <Code>{`{ "date": "2026-06-11", "exists": false, "primary_energy": null, "secondary_energy": null, "note": null, "couch_story": { "dayTitle": "…", "story": "…", "reflection": "…" } }`}</Code>
    </div>
  )

  if (id === "read-entries") return (
    <div className="space-y-5">
      <h2 className="font-display text-4xl uppercase leading-none">Read Entries</h2>
      <EndpointHeader method="GET" path="/api/v1/entries" summary="Returns a list of journal entries, newest first. Supports limit and date range filters." />
      <Label>Query params</Label>
      <table className="w-full text-left"><tbody>
        <ParamRow name="limit" type="number" desc="Max entries — default 10, max 50." />
        <ParamRow name="from" type="string" desc="Start date YYYY-MM-DD, inclusive." />
        <ParamRow name="to" type="string" desc="End date YYYY-MM-DD, inclusive." />
      </tbody></table>
      <Label>Example</Label>
      <Code>{`curl "${BASE}/api/v1/entries?limit=5" \\
  -H "Authorization: Bearer ${token}"`}</Code>
      <Label>Response</Label>
      <Code>{`{ "entries": [{ "id": "…", "date": "2026-06-11", "primary_energy": "monica", "secondary_energy": null, "note": "Long day, but I got through it." }], "total": 1 }`}</Code>
    </div>
  )

  if (id === "mcp-connect") return (
    <div className="space-y-6">
      <h2 className="font-display text-4xl uppercase leading-none">Connect</h2>
      <p className="font-serif text-[#423b35]">The MCP server uses the <span className="font-mono text-sm text-[#6a4f79]">StreamableHTTP</span> transport — the modern standard for remote MCP servers. Any MCP-compatible client can connect using your personal token.</p>

      <div className="border border-[#6a4f79] bg-[#f7f3ec] px-4 py-3 space-y-1">
        <Label>Server URL</Label>
        <code className="font-mono text-sm text-[#423b35] break-all">{mcpUrl}</code>
      </div>

      <div className="space-y-3">
        <Label>Claude Desktop — claude_desktop_config.json</Label>
        <Code>{`{
  "mcpServers": {
    "how-you-doin": {
      "type": "http",
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${token}"
      }
    }
  }
}`}</Code>
      </div>

      <div className="space-y-3">
        <Label>Claude Code</Label>
        <Code>{`claude mcp add how-you-doin \\
  --transport http \\
  --url ${mcpUrl} \\
  --header "Authorization: Bearer ${token}"`}</Code>
      </div>

      <div className="space-y-3">
        <Label>Cursor / Windsurf — mcp.json</Label>
        <Code>{`{
  "mcpServers": {
    "how-you-doin": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${token}"
      }
    }
  }
}`}</Code>
      </div>
    </div>
  )

  if (id === "mcp-tools") return (
    <div className="space-y-8">
      <h2 className="font-display text-4xl uppercase leading-none">Tools</h2>
      <p className="font-serif text-[#423b35]">The server exposes four tools. Authentication is handled once at connection time via your Bearer token.</p>

      {[
        { name: "journal_get_today", desc: "Get the journal entry for today or a specific date, including the couch story and reflection prompt.", params: [{ name: "date", type: "string", desc: "YYYY-MM-DD — defaults to today." }] },
        { name: "journal_save_entry", desc: "Create or update a journal entry. Energies are optional — omit them to save without any energy selected.", params: [
          { name: "note", type: "string", required: true, desc: "The journal text." },
          { name: "date", type: "string", desc: "YYYY-MM-DD — defaults to today." },
          { name: "primary_energy", type: "enum", desc: "monica · chandler · ross · joey · phoebe · rachel" },
          { name: "secondary_energy", type: "enum", desc: "A second energy from the same set." },
        ]},
        { name: "journal_list_entries", desc: "List journal entries, newest first. Useful for reviewing recent history or building context for Joey.", params: [
          { name: "limit", type: "number", desc: "Max entries — default 10, max 50." },
          { name: "from", type: "string", desc: "Start date YYYY-MM-DD, inclusive." },
          { name: "to", type: "string", desc: "End date YYYY-MM-DD, inclusive." },
        ]},
        { name: "joey_ask", desc: "Send a message to Joey. He responds based on the relevant journal entry and detects automatically when broader history is needed.", params: [
          { name: "message", type: "string", required: true, desc: "The question or message for Joey." },
          { name: "date", type: "string", desc: "Date context — defaults to today." },
        ]},
      ].map(tool => (
        <div key={tool.name} className="space-y-3">
          <div className="pb-3 border-b-4 border-[#6a4f79]">
            <code className="font-mono text-base text-[#6a4f79]">{tool.name}</code>
            <p className="font-serif text-sm text-[#423b35] mt-1">{tool.desc}</p>
          </div>
          <table className="w-full text-left"><tbody>
            {tool.params.map(p => <ParamRow key={p.name} name={p.name} type={p.type} required={(p as { required?: boolean }).required} desc={p.desc} />)}
          </tbody></table>
        </div>
      ))}
    </div>
  )

  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type MobileTab = "API" | "MCP"

export default function DocsPage() {
  const [active, setActive] = useState("authentication")   // desktop
  const [mobileTab, setMobileTab] = useState<MobileTab>("API") // mobile
  const [apiKey, setApiKey] = useState<string | null>(null)

  const mobileSections = NAV.filter(n =>
    mobileTab === "API" ? n.group !== "MCP" : n.group === "MCP"
  )

  return (
    <div className="h-dvh flex flex-col bg-[#ece7df]">

      <DesktopNav />

      {/* ── Mobile: API / MCP tabs — below header ───────────────────────── */}
      <div className="lg:hidden flex-shrink-0 flex border-b border-[#6a4f79] bg-[#f7f3ec]">
        {(["API", "MCP"] as MobileTab[]).map(t => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 font-display text-xl uppercase leading-none py-3 transition-colors border-b-4 ${mobileTab === t ? "bg-[#fde52f] text-black border-[#6a4f79]" : "text-[#423b35]/50 border-transparent hover:text-[#423b35]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop left panel ────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-[#6a4f79] bg-[#f7f3ec] overflow-y-auto">
          <div className="p-4 border-b border-[#6a4f79]/30">
            <TokenWidget onNewToken={setApiKey} />
          </div>
          <nav className="p-4 space-y-5 flex-1">
            {GROUPS.map(group => (
              <div key={group}>
                <p className="font-display text-[10px] uppercase text-[#938d8d] tracking-widest mb-1 px-3">{group}</p>
                {NAV.filter(n => n.group === group).map(n => (
                  <button
                    key={n.id}
                    onClick={() => setActive(n.id)}
                    className={`w-full text-left block px-3 py-1.5 font-display text-[15px] uppercase leading-none transition-colors ${active === n.id ? "bg-[#fde52f] text-black border-l-4 border-[#6a4f79]" : "text-[#423b35]/70 hover:text-[#6a4f79]"}`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">

          {/* Mobile: token widget + all sections for selected tab */}
          <div className="lg:hidden">
            <div className="px-5 pt-5 pb-2">
              <TokenWidget onNewToken={setApiKey} />
            </div>
            <div className="px-5 py-8 pb-28 space-y-16">
              {mobileSections.map(n => (
                <SectionContent key={n.id} id={n.id} apiKey={apiKey} />
              ))}
            </div>
          </div>

          {/* Desktop: single selected section */}
          <div className="hidden lg:block max-w-3xl mx-auto px-10 py-10">
            <SectionContent id={active} apiKey={apiKey} />
          </div>

        </main>
      </div>

      {/* ── Bottom nav — mobile only ─────────────────────────────────── */}
      <BottomNav />
    </div>
  )
}
