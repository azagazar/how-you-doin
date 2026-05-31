import { EnergyKey } from "@/lib/types"
import { ENERGIES } from "@/lib/energies"

type Props = {
  primary?: EnergyKey
  secondary?: EnergyKey
  width?: number
}

/**
 * Mini couch for journal entry cards.
 * Characters sit on the couch cushions — same treatment as CouchSelector,
 * just scaled down.
 */
export function MiniCouch({ primary, secondary, width = 156 }: Props) {
  const primaryEnergy = primary ? ENERGIES[primary] : null
  const secondaryEnergy = secondary ? ENERGIES[secondary] : null

  return (
    <div style={{ position: "relative", width, flexShrink: 0 }}>
      {/* The couch — base layer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/branding/couch.png"
        alt=""
        draggable={false}
        style={{ width: "100%", height: "auto", display: "block" }}
      />

      {/* Characters sit on the cushions — same % positions as CouchSelector */}
      {primaryEnergy && (
        <div
          style={{
            position: "absolute",
            left: "22%",
            top: "14%",
            width: "28%",
            transform: "rotate(-4deg)",
            transformOrigin: "bottom center",
            filter: "drop-shadow(0px 3px 6px rgba(44,26,14,0.28)) drop-shadow(0px 1px 2px rgba(44,26,14,0.15))",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/icons/${primary}.png`}
            alt={primaryEnergy.name}
            draggable={false}
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
          />
        </div>
      )}

      {secondaryEnergy && (
        <div
          style={{
            position: "absolute",
            left: "46%",
            top: "14%",
            width: "28%",
            transform: "rotate(3deg)",
            transformOrigin: "bottom center",
            filter: "drop-shadow(0px 3px 6px rgba(44,26,14,0.28)) drop-shadow(0px 1px 2px rgba(44,26,14,0.15))",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/icons/${secondary}.png`}
            alt={secondaryEnergy.name}
            draggable={false}
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  )
}
