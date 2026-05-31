export type EnergyKey = "monica" | "chandler" | "ross" | "joey" | "phoebe" | "rachel"

export type JournalEntry = {
  id: string
  date: string
  primaryEnergy?: EnergyKey
  secondaryEnergy?: EnergyKey
  content: string
  createdAt: string
}
