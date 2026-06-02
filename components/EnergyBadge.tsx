import { EnergyKey } from "@/lib/types"
import { ENERGIES } from "@/lib/energies"

type Props = {
  energy: EnergyKey
  size?: "sm" | "md"
}

export function EnergyBadge({ energy, size = "sm" }: Props) {
  const config = ENERGIES[energy]
  return (
    <span
      className="figma-tag"
      style={{ height: size === "sm" ? 32 : 40, padding: "0 10px" }}
    >
      <span
        className="font-display text-[#6a4f79] leading-none uppercase whitespace-nowrap"
        style={{ fontSize: size === "sm" ? 18 : 22 }}
      >
        {config.name}
      </span>
    </span>
  )
}
