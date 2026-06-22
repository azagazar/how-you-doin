"use client"

import { useRef, useEffect, useState, FormEvent } from "react"
import { JournalEntry } from "@/lib/types"
import { Lang } from "@/lib/i18n"
import { getEntries } from "@/lib/storage"
import { CompanionId, COMPANIONS } from "@/lib/companions"
import { getAuthToken } from "@/lib/auth-client"
import { CompanionSelector } from "./CompanionSelector"
import { CompanionUnlockCard } from "./CompanionUnlockCard"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

type AccessState = {
  subscription: { active: boolean; renewsAt: string; subscriptionId: string } | null
  individualUnlocks: string[]
}

type Props = {
  currentEntry: JournalEntry | null
  lang: Lang
  onClose: () => void
  initialCompanion?: CompanionId
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getOpeningMessage(companionId: CompanionId, lang: Lang): string {
  const openings: Record<CompanionId, Record<Lang, string>> = {
    joey: {
      en: "Hey! What's going on? Tell me about your day — or ask me anything about your journal.",
      pl: "Hej! Co tam? Powiedz mi coś o swoim dniu albo zapytaj o cokolwiek z dziennika.",
    },
    monica: {
      en: "Hi.\n\nBefore we start rearranging the universe...\n\nWhat's one thing that went right today?",
      pl: "Cześć.\n\nZanim zaczniemy naprawiać świat...\n\nOpowiedz mi, co dzisiaj poszło po Twojej myśli?",
    },
    chandler: {
      en: "Well...\n\nThis is either going to be a very normal conversation or a complete disaster.\n\nEither way, I'm listening.",
      pl: "No dobrze...\n\nTo będzie albo całkiem normalna rozmowa, albo totalna katastrofa.\n\nTak czy inaczej, słucham.",
    },
    ross: {
      en: "I've got a question.\n\nWhat has been taking up the most space in your head lately?",
      pl: "Mam jedno pytanie.\n\nCo ostatnio zajmuje najwięcej miejsca w Twojej głowie?",
    },
    phoebe: {
      en: "Okay...\n\nIf today had a soundtrack, what would it sound like?",
      pl: "Dobrze...\n\nGdyby dzisiejszy dzień miał własną ścieżkę dźwiękową, jak by brzmiała?",
    },
    rachel: {
      en: "Hi.\n\nLet's start simple.\n\nWhat's been on your mind lately?",
      pl: "Cześć.\n\nZacznijmy prosto.\n\nCo ostatnio chodzi Ci po głowie?",
    },
  }
  return openings[companionId]?.[lang] ?? openings.joey[lang]
}

export function JoeyChat({ currentEntry, lang, onClose, initialCompanion = "joey" }: Props) {
  const [activeCompanion, setActiveCompanion] = useState<CompanionId>(initialCompanion)
  const [lockedCompanion, setLockedCompanion] = useState<CompanionId | null>(null)
  const [access, setAccess] = useState<AccessState | null>(null)

  const [messages, setMessages] = useState<Message[]>([
    { id: "opening", role: "assistant", content: getOpeningMessage(initialCompanion, lang) },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const cachedEntries = useRef<JournalEntry[] | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch access state on mount
  useEffect(() => {
    getAuthToken().then((token) =>
      fetch("/api/companions/access", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    ).then((r) => r.json())
      .then((data) => setAccess(data))
      .catch(() => setAccess({ subscription: null, individualUnlocks: [] }))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    if (!lockedCompanion) {
      const t = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [lockedCompanion])

  function switchCompanion(id: CompanionId) {
    setLockedCompanion(null)
    if (id === activeCompanion) return
    setActiveCompanion(id)
    setMessages([{ id: makeId(), role: "assistant", content: getOpeningMessage(id, lang) }])
    setError(false)
    cachedEntries.current = null
    try { localStorage.setItem("hyd_active_companion", id) } catch { /* unavailable */ }
  }

  async function getRecentEntries(): Promise<JournalEntry[]> {
    if (cachedEntries.current !== null) return cachedEntries.current
    const all = await getEntries()
    const recent = all.slice(0, 20)
    cachedEntries.current = recent
    return recent
  }

  async function sendMessage(userInput: string) {
    const userMsg: Message = { id: makeId(), role: "user", content: userInput }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput("")
    setError(false)
    setIsLoading(true)

    const assistantId = makeId()
    setMessages([...history, { id: assistantId, role: "assistant", content: "" }])

    const recentEntries = await getRecentEntries()

    // Joey uses the legacy endpoint; all others use the new generic endpoint
    const endpoint =
      activeCompanion === "joey"
        ? "/api/joey"
        : `/api/companions/${activeCompanion}/chat`

    const token = await getAuthToken()

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          currentEntry,
          recentEntries,
          lang,
        }),
      })

      if (!res.ok || !res.body) {
        setError(true)
        setIsLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.id === assistantId) {
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
          }
          return updated
        })
      }
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (input.trim() && !isLoading) sendMessage(input.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) sendMessage(input.trim())
    }
  }

  const displayedId = lockedCompanion ?? activeCompanion
  const companion = COMPANIONS[displayedId]
  const sendLabel = lang === "pl" ? "Wyślij" : "Send"
  const placeholderLabel = lang === "pl" ? "Napisz coś…" : "Say something…"
  const errorLabel =
    lang === "pl"
      ? "Hmm, coś poszło nie tak. Spróbuj jeszcze raz?"
      : "Hmm, something went wrong. Try again?"

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 lg:bg-black/10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label={`${companion.name} chat`}
        className="joey-panel fixed z-50 bottom-0 left-0 right-0 h-[88dvh] lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px] flex flex-col bg-[#ece7df] border-t-4 border-l border-r border-[#6a4f79] lg:border-4 lg:border-[#6a4f79]"
      >
        {/* Header */}
        <div className="bg-[#fde52f] border-b-4 border-[#6a4f79] px-4 py-3 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/icons/${displayedId}.png`} alt={companion.name} draggable={false} className="w-8 h-8 object-contain select-none" aria-hidden="true" />
              <span className="font-display text-2xl text-[#6a4f79] uppercase leading-none">
                {companion.name}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="font-display text-3xl text-[#6a4f79] leading-none hover:opacity-60 transition-opacity"
            >
              ×
            </button>
          </div>

          {/* Companion selector */}
          <CompanionSelector
            selected={lockedCompanion ?? activeCompanion}
            access={access}
            onSelect={switchCompanion}
            onLocked={(id) => setLockedCompanion(id)}
          />
        </div>

        {/* Unlock card or chat — key triggers companion-enter animation on switch */}
        {lockedCompanion ? (
          <div key={lockedCompanion} className="companion-enter flex-1 min-h-0 overflow-y-auto px-5 py-5">
            <CompanionUnlockCard
              companionId={lockedCompanion}
              lang={lang}
              onBack={() => setLockedCompanion(null)}
            />
          </div>
        ) : (
          <div key={activeCompanion} className="companion-enter flex-1 min-h-0 flex flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg) => msg.role === "assistant" && msg.content === "" ? null : (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/icons/${displayedId}.png`} alt={companion.name} draggable={false} className="w-7 h-7 object-contain flex-shrink-0 mb-1 select-none" aria-hidden="true" />
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 font-serif text-base leading-relaxed animate-settle ${
                      msg.role === "assistant"
                        ? "figma-card text-black"
                        : "bg-[#fde52f] border border-[#6a4f79] border-b-4 text-black"
                    }`}
                  >
                    {msg.content
                      ? msg.content.split("\n").map((line, i, arr) => (
                          <span key={i}>
                            {line}
                            {i < arr.length - 1 && <br />}
                          </span>
                        ))
                      : <span className="opacity-0">…</span>}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading &&
                messages[messages.length - 1]?.role === "assistant" &&
                messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-end gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/icons/${displayedId}.png`} alt={companion.name} draggable={false} className="w-7 h-7 object-contain flex-shrink-0 mb-1 select-none" aria-hidden="true" />
                    <div className="figma-card px-4 py-3">
                      <div className="joey-typing-dots" aria-label={`${companion.name} is typing`}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

              {error && (
                <p className="text-center font-serif text-sm text-[#938d8d] py-1">{errorLabel}</p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex-shrink-0 border-t-4 border-[#6a4f79] bg-[#f7f3ec] p-4 flex gap-3 items-end"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderLabel}
                disabled={isLoading}
                autoComplete="off"
                rows={2}
                className="flex-1 resize-none bg-[#faf8f4] border border-[#6a4f79] border-b-4 px-4 py-3 font-serif text-base text-black placeholder:text-[#b0a090] outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label={sendLabel}
                className="flex-shrink-0 w-11 h-11 rounded-full bg-[#6a4f79] border-b-4 border-[#3d2b4a] flex items-center justify-center transition-opacity disabled:opacity-40 hover:opacity-90"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M9 16V2M3 8l6-6 6 6" stroke="#fde52f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
