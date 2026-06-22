"use client"

import { COMPANION_ORDER, COMPANIONS, CompanionId } from "@/lib/companions"

type AccessState = {
  subscription: { active: boolean; renewsAt: string } | null
  individualUnlocks: string[]
}

type Props = {
  selected: CompanionId
  access: AccessState | null
  onSelect: (id: CompanionId) => void
  onLocked: (id: CompanionId) => void
}

export function CompanionSelector({ selected, access, onSelect, onLocked }: Props) {
  function isUnlocked(id: CompanionId): boolean {
    if (COMPANIONS[id].free) return true
    if (access?.subscription?.active) return true
    if (access?.individualUnlocks?.includes(id)) return true
    return false
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
      {COMPANION_ORDER.filter((id) => id !== selected).map((id) => {
        const companion = COMPANIONS[id]
        const unlocked = isUnlocked(id)

        return (
          <button
            key={id}
            onClick={() => unlocked ? onSelect(id) : onLocked(id)}
            title={companion.name}
            className={[
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all flex-shrink-0",
              unlocked
                ? "hover:bg-black/5 text-black"
                : "opacity-50 hover:opacity-70 text-black",
            ].join(" ")}
          >
            <div className="relative w-7 h-7 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/icons/${id}.png`}
                alt={companion.name}
                draggable={false}
                className="w-7 h-7 object-contain select-none"
                style={{ filter: !unlocked ? "grayscale(1)" : undefined }}
              />
              {!unlocked && (
                <span className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none">🔒</span>
              )}
            </div>
            <span className="font-display text-[10px] uppercase leading-none tracking-wide">
              {companion.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
