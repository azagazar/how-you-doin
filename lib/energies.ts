import { EnergyKey } from "./types"

export type EnergyConfig = {
  key: EnergyKey
  name: string
  emoji: string
  tagline: string
  description: string
  traits: string[]
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

export const ENERGIES: Record<EnergyKey, EnergyConfig> = {
  monica: {
    key: "monica",
    name: "Monica",
    emoji: "👩‍🍳",
    tagline: "Getting Things Done",
    description: "Productive. Organised. Slightly stressed.",
    traits: ["responsible", "organised", "focused", "perfectionistic", "ambitious", "caring for others"],
    color: "sage-green",
    bgColor: "bg-[#8FAF8A]",
    borderColor: "border-[#8FAF8A]",
    textColor: "text-[#8FAF8A]",
  },
  chandler: {
    key: "chandler",
    name: "Chandler",
    emoji: "🎭",
    tagline: "Laughing Through It",
    description: "Funny. Tired. Emotionally guarded.",
    traits: ["sarcastic", "self-aware", "emotionally defensive", "exhausted", "witty", "coping through humour"],
    color: "dusty-purple",
    bgColor: "bg-[#9B8BAB]",
    borderColor: "border-[#9B8BAB]",
    textColor: "text-[#9B8BAB]",
  },
  ross: {
    key: "ross",
    name: "Ross",
    emoji: "🦖",
    tagline: "Thinking About It Too Much",
    description: "Reflective. Emotional. Analytical.",
    traits: ["overthinking", "sensitive", "reflective", "anxious", "thoughtful", "emotionally invested"],
    color: "dusty-blue",
    bgColor: "bg-[#7B9BB5]",
    borderColor: "border-[#7B9BB5]",
    textColor: "text-[#7B9BB5]",
  },
  joey: {
    key: "joey",
    name: "Joey",
    emoji: "🍕",
    tagline: "Enjoying The Moment",
    description: "Relaxed. Optimistic. Playful.",
    traits: ["spontaneous", "carefree", "fun-loving", "easy-going", "optimistic", "present-focused"],
    color: "coffee-brown",
    bgColor: "bg-[#9B7B5B]",
    borderColor: "border-[#9B7B5B]",
    textColor: "text-[#9B7B5B]",
  },
  phoebe: {
    key: "phoebe",
    name: "Phoebe",
    emoji: "🎸",
    tagline: "Trusting The Universe",
    description: "Creative. Intuitive. Authentic.",
    traits: ["creative", "intuitive", "unconventional", "curious", "authentic", "free-spirited"],
    color: "turquoise",
    bgColor: "bg-[#6BABB5]",
    borderColor: "border-[#6BABB5]",
    textColor: "text-[#6BABB5]",
  },
  rachel: {
    key: "rachel",
    name: "Rachel",
    emoji: "👠",
    tagline: "Growing Into Something New",
    description: "Confident. Social. Ambitious.",
    traits: ["confident", "adventurous", "social", "ambitious", "independent", "evolving"],
    color: "lavender-pink",
    bgColor: "bg-[#C48BAB]",
    borderColor: "border-[#C48BAB]",
    textColor: "text-[#C48BAB]",
  },
}

type CombinationKey = string

const COMBINATIONS: Record<CombinationKey, string> = {
  "monica+ross": "Productive. Thoughtful. Slightly overwhelmed.",
  "chandler+ross": "Overthinking while pretending everything is okay.",
  "monica+chandler": "Responsible but emotionally exhausted.",
  "joey+phoebe": "Spontaneous, creative and carefree.",
  "rachel+phoebe": "Confident, curious and open to change.",
  "rachel+monica": "Ambitious, focused and determined.",
}

export function getCombinationDescription(primary: EnergyKey, secondary?: EnergyKey): string {
  if (!secondary) return ENERGIES[primary].description

  const key1 = [primary, secondary].sort().join("+")
  if (COMBINATIONS[key1]) return COMBINATIONS[key1]

  return `${ENERGIES[primary].description} ${ENERGIES[secondary].description}`
}

export const ENERGY_ORDER: EnergyKey[] = ["monica", "chandler", "ross", "joey", "phoebe", "rachel"]
