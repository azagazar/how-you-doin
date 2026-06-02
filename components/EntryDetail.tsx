"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getEntries, saveEntry, deleteEntry } from "@/lib/storage"
import { JournalEntry, EnergyKey } from "@/lib/types"
import { ENERGIES, ENERGY_ORDER } from "@/lib/energies"
import { getCouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { EnergyCard } from "@/components/EnergyCard"
import { EnergyBadge } from "@/components/EnergyBadge"
import { CouchStoryBlock } from "@/components/CouchStoryBlock"
import { JournalEditor } from "@/components/JournalEditor"

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

interface Props {
  id: string
  onDelete?: () => void
}

export function EntryDetail({ id, onDelete }: Props) {
  const router = useRouter()
  const { lang, t } = useI18n()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [editing, setEditing] = useState(false)
  const [primaryEnergy, setPrimaryEnergy] = useState<EnergyKey | undefined>()
  const [secondaryEnergy, setSecondaryEnergy] = useState<EnergyKey | undefined>()
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setEditing(false)
    setSaved(false)
    setConfirmDelete(false)
    const found = getEntries().find((e) => e.id === id)
    if (!found) {
      if (onDelete) onDelete()
      else router.replace("/history")
      return
    }
    setEntry(found)
    setPrimaryEnergy(found.primaryEnergy)
    setSecondaryEnergy(found.secondaryEnergy)
    setContent(found.content)
  }, [id, router, onDelete])

  function handleEnergySelect(key: EnergyKey) {
    if (key === primaryEnergy) {
      setPrimaryEnergy(secondaryEnergy)
      setSecondaryEnergy(undefined)
      return
    }
    if (key === secondaryEnergy) {
      setSecondaryEnergy(undefined)
      return
    }
    if (!primaryEnergy) {
      setPrimaryEnergy(key)
    } else {
      setSecondaryEnergy(key)
    }
  }

  function handleSave() {
    if (!entry) return
    const updated: JournalEntry = { ...entry, primaryEnergy, secondaryEnergy, content }
    saveEntry(updated)
    setEntry(updated)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteEntry(id)
    if (onDelete) onDelete()
    else router.replace("/history")
  }

  if (!entry) return null

  const viewStory = getCouchStory(entry.primaryEnergy, entry.secondaryEnergy, lang)
  const editStory = getCouchStory(primaryEnergy, secondaryEnergy, lang)

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-10 space-y-6 w-full">
      {/* Back button — mobile only */}
      <button
        onClick={() => router.back()}
        className="lg:hidden flex items-center gap-2 text-sm text-[#6B4F7A] font-medium hover:opacity-70 transition-opacity"
      >
        ← Back
      </button>

      <div className="space-y-1">
        <p className="font-date italic text-[#6a4f79] text-lg leading-none uppercase">
          {formatDate(entry.date, lang)}
        </p>
        <h1 className="font-display text-5xl text-black uppercase leading-none">{t("entryDetail.title")}</h1>
      </div>

      {editing ? (
        <div className="space-y-4">
          {(primaryEnergy || secondaryEnergy) && (
            <div className="flex gap-3 flex-wrap">
              {primaryEnergy && <EnergyBadge energy={primaryEnergy} size="md" />}
              {secondaryEnergy && <EnergyBadge energy={secondaryEnergy} size="md" />}
            </div>
          )}
          <p className="text-sm font-semibold text-[#2C1A0E]">{editStory.dayTitle}</p>
          <div className="grid grid-cols-3 gap-2">
            {ENERGY_ORDER.map((key) => (
              <EnergyCard
                key={key}
                energy={ENERGIES[key]}
                selected={key === primaryEnergy || key === secondaryEnergy}
                onClick={() => handleEnergySelect(key)}
                size="sm"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(entry.primaryEnergy || entry.secondaryEnergy) && (
            <div className="flex gap-2 flex-wrap">
              {entry.primaryEnergy && <EnergyBadge energy={entry.primaryEnergy} size="md" />}
              {entry.secondaryEnergy && <EnergyBadge energy={entry.secondaryEnergy} size="md" />}
            </div>
          )}
          <CouchStoryBlock story={viewStory} />
        </div>
      )}

      {editing ? (
        <div className="space-y-2">
          <p className="font-display text-2xl text-black uppercase">
            {t("home.journalSection")}
          </p>
          <JournalEditor content={content} onChange={setContent} />
        </div>
      ) : (
        <div
          className="prose prose-sm max-w-none text-[#2C1A0E] border border-[#6a4f79] border-b-4 bg-[#faf8f4] px-4 py-4"
          dangerouslySetInnerHTML={{ __html: entry.content || "<p class='text-[#b0a090] italic'>No journal entry written.</p>" }}
        />
      )}

      <div className="flex flex-col gap-3">
        {editing ? (
          <>
            <div className="flex justify-center">
              <button onClick={handleSave} className="figma-btn" style={{ width: 185 }}>
                <span className="font-display text-[#fde52f] text-2xl leading-none uppercase translate-y-[2px]">
                  {t("entryDetail.saveButton")}
                </span>
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setEditing(false)
                  setPrimaryEnergy(entry.primaryEnergy)
                  setSecondaryEnergy(entry.secondaryEnergy)
                  setContent(entry.content)
                }}
                className="flex items-center justify-center border border-[#6a4f79] border-b-4 py-2 hover:opacity-70 transition-opacity cursor-pointer"
                style={{ width: 185 }}
              >
                <span className="font-display text-[#6a4f79] text-2xl leading-none uppercase translate-y-[2px]">
                  {t("entryDetail.cancelButton")}
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            {saved && (
              <p className="text-center font-display text-xl text-[#6a4f79] uppercase">{t("entryDetail.changesSaved")}</p>
            )}
            <div className="flex justify-center">
              <button onClick={() => setEditing(true)} className="figma-btn" style={{ width: 185 }}>
                <span className="font-display text-[#fde52f] text-2xl leading-none uppercase translate-y-[2px]">
                  {t("entryDetail.editButton")}
                </span>
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleDelete}
                className="flex items-center justify-center border border-red-400 border-b-4 py-2 bg-transparent hover:opacity-70 transition-opacity cursor-pointer"
                style={{ width: 185 }}
              >
                <span className="font-display text-red-500 text-2xl leading-none uppercase translate-y-[2px]">
                  {confirmDelete ? t("entryDetail.confirmDelete") : t("entryDetail.deleteButton")}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
