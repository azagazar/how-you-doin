"use client"

import { EnergyConfig } from "@/lib/energies"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type Props = {
  energy: EnergyConfig
  selected?: boolean
  onClick?: () => void
  size?: "sm" | "md"
}

export function EnergyCard({ energy, selected, onClick, size = "md" }: Props) {
  const { t } = useI18n()
  const tagline = t(`energies.${energy.key}.tagline`)

  return (
    <button
      onClick={onClick}
      className={cn(
        "energy-card flex flex-col items-center transition-all",
        "border border-[#6a4f79] border-b-4 overflow-hidden",
        selected ? "bg-[#fde52f]" : "bg-[#f7f3ec]",
        size === "md" ? "p-2 gap-1.5" : "p-1.5 gap-1",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden",
          size === "md" ? "w-[72px] h-[72px]" : "w-[48px] h-[48px]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/icons/${energy.key}.png`}
          alt={energy.name}
          draggable="false"
          className="w-full h-full object-contain select-none"
        />
      </div>
      <span
        className={cn(
          "font-display text-black leading-none uppercase",
          size === "md" ? "text-xl" : "text-base",
        )}
      >
        {energy.name}
      </span>
      {size === "md" && (
        <span className="font-serif text-[#423b35] text-xs text-center leading-tight">
          {tagline}
        </span>
      )}
    </button>
  )
}
