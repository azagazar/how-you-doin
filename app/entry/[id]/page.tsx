"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getEntries, saveEntry, deleteEntry } from "@/lib/storage"
import { JournalEntry } from "@/lib/types"
import { ENERGIES, ENERGY_ORDER } from "@/lib/energies"
import { getCouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { EnergyCard } from "@/components/EnergyCard"
import { EnergyBadge } from "@/components/EnergyBadge"
import { CouchStoryBlock } from "@/components/CouchStoryBlock"
import { JournalEditor } from "@/components/JournalEditor"
import { Button } from "@/components/ui/button"
import { EnergyKey } from "@/lib/types"

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function EntryDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { lang, t } = useI18n()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [editing, setEditing] = useState(false)
  const [primaryEnergy, setPrimaryEnergy] = useState<EnergyKey | undefined>()
  const [secondaryEnergy, setSecondaryEnergy] = useState<EnergyKey | undefined>()
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const found = getEntries().find((e) => e.id === id)
    if (!found) { router.replace("/history"); return }
    setEntry(found)
    setPrimaryEnergy(found.primaryEnergy)
    setSecondaryEnergy(found.secondaryEnergy)
    setContent(found.content)
  }, [id, router])

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
    router.replace("/history")
  }

  if (!entry) return null

  const viewStory = getCouchStory(entry.primaryEnergy, entry.secondaryEnergy, lang)
  const editStory = getCouchStory(primaryEnergy, secondaryEnergy, lang)

  return (
    <div className="min-h-dvh flex flex-col bg-[#ece7df]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 pt-8 pb-10 space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[#6B4F7A] font-medium hover:opacity-70 transition-opacity"
          >
            ← Back
          </button>

          <div>
            <p className="text-xs font-semibold text-[#9B7B5B] uppercase tracking-wide">
              {formatDate(entry.date, lang)}
            </p>
            <h1 className="font-display text-3xl font-bold text-[#2C1A0E] mt-1">{t("entryDetail.title")}</h1>
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
              <label className="block text-xs font-semibold text-[#6B4F7A] uppercase tracking-wide">
                {t("home.journalSection")}
              </label>
              <JournalEditor content={content} onChange={setContent} />
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none text-[#2C1A0E] bg-[#FAF6F1] rounded-2xl border border-[#E2D5C8] px-4 py-4"
              dangerouslySetInnerHTML={{ __html: entry.content || "<p class='text-[#B0A090] italic'>No journal entry written.</p>" }}
            />
          )}

          <div className="flex flex-col gap-2">
            {editing ? (
              <>
                <Button
                  onClick={handleSave}
                  className="w-full bg-[#6B4F7A] hover:bg-[#5A3F68] text-white rounded-xl py-3 font-semibold"
                >
                  {t("entryDetail.saveButton")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    setPrimaryEnergy(entry.primaryEnergy)
                    setSecondaryEnergy(entry.secondaryEnergy)
                    setContent(entry.content)
                  }}
                  className="w-full rounded-xl py-3 border-[#E8DDD0] text-[#6B5544]"
                >
                  {t("entryDetail.cancelButton")}
                </Button>
              </>
            ) : (
              <>
                {saved && (
                  <p className="text-center text-sm text-[#6B4F7A] font-medium">{t("entryDetail.changesSaved")}</p>
                )}
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="w-full rounded-xl py-3 border-[#6B4F7A]/30 text-[#6B4F7A]"
                >
                  {t("entryDetail.editButton")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="w-full rounded-xl py-3 border-red-200 text-red-500 hover:bg-red-50"
                >
                  {confirmDelete ? t("entryDetail.confirmDelete") : t("entryDetail.deleteButton")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
