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
      style={{ height: size === "sm" ? 32 : 40, padding: "0 10px", backgroundColor: "#6FB6D4", border: "none" }}
    >
      <span
        className="font-display leading-none uppercase whitespace-nowrap"
        style={{ fontSize: size === "sm" ? 18 : 22, color: "#FDE52F" }}
      >
        {config.name}
      </span>
    </span>
  )
}
