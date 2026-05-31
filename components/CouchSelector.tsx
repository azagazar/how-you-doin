"use client"

import { EnergyKey } from "@/lib/types"
import { ENERGIES } from "@/lib/energies"

type Props = {
  primary?: EnergyKey
  secondary?: EnergyKey
}

function SeatSticker({ energyKey, side }: { energyKey?: EnergyKey; side: "left" | "right" }) {
  const energy = energyKey ? ENERGIES[energyKey] : null
  const rotation = side === "left" ? "rotate(-4deg)" : "rotate(3deg)"

  if (energy) {
    return (
      <div
        style={{
          transform: rotation,
          transformOrigin: "bottom center",
          width: "100%",
        }}
      >
        {/* key forces remount → replays settle animation on character change */}
        <div key={energyKey} className="animate-settle flex flex-col items-center">
          <div
            style={{
              filter:
                "drop-shadow(0px 5px 10px rgba(44,26,14,0.30)) drop-shadow(0px 1px 3px rgba(44,26,14,0.18))",
              width: "100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/icons/${energyKey}.png`}
              alt={energy.name}
              draggable={false}
              className="w-full h-auto object-contain select-none"
            />
          </div>
        </div>
      </div>
    )
  }

  // Empty slot — subtle dashed hint on the cushion
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "45%",
        opacity: 0.22,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1.5px dashed #C8A87A",
        }}
      />
    </div>
  )
}

export function CouchSelector({ primary, secondary }: Props) {
  return (
    <div className="relative w-full select-none" aria-label="Couch — place your energies here">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/branding/couch.png" alt="The couch" className="w-full h-auto" />

      {/* Sticker slots — characters sit directly on the cushions */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Left seat: left arm inset ~13%, width ~27% of couch */}
        <div className="absolute" style={{ left: "22%", top: "14%", width: "28%" }}>
          <SeatSticker energyKey={primary} side="left" />
        </div>
        {/* Right seat */}
        <div className="absolute" style={{ left: "46%", top: "14%", width: "28%" }}>
          <SeatSticker energyKey={secondary} side="right" />
        </div>
      </div>
    </div>
  )
}
