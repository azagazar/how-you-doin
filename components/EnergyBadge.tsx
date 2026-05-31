import { EnergyKey } from "@/lib/types"
import { ENERGIES } from "@/lib/energies"
import { cn } from "@/lib/utils"

type Props = {
  energy: EnergyKey
  size?: "sm" | "md"
}

export function EnergyBadge({ energy, size = "sm" }: Props) {
  const config = ENERGIES[energy]
  const iconSize = size === "sm" ? 14 : 18
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
      `${config.bgColor}/20 ${config.textColor} border ${config.borderColor}/40`,
    )}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/icons/${energy}.png`}
        alt={config.name}
        draggable="false"
        style={{ width: iconSize, height: iconSize }}
        className="object-contain select-none"
      />
      {config.name}
    </span>
  )
}
