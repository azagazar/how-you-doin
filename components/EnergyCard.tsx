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
        "energy-card rounded-2xl border flex flex-col items-center transition-all",
        size === "md" ? "p-3 gap-2 min-w-[88px]" : "p-2 gap-1 min-w-[72px]",
        selected
          ? `${energy.borderColor} ${energy.bgColor}/20 selected`
          : "border-[#D4C4B0] bg-[#FBF5EC]",
      )}
    >
      <div
        className={cn(
          "rounded-xl flex items-center justify-center overflow-hidden transition-all",
          size === "md" ? "w-12 h-12" : "w-9 h-9",
          selected ? `${energy.bgColor}/15` : "bg-white/60",
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
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "font-semibold leading-tight",
            size === "md" ? "text-xs" : "text-[10px]",
            selected ? energy.textColor : "text-[#4A3728]",
          )}
        >
          {energy.name}
        </span>
        {size === "md" && (
          <span
            className={cn(
              "text-[9px] leading-tight text-center",
              selected ? `${energy.textColor} opacity-75` : "text-[#9B8878]",
            )}
          >
            {tagline}
          </span>
        )}
      </div>
    </button>
  )
}
