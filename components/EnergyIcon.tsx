import { EnergyKey } from "@/lib/types"

type Props = {
  energy: EnergyKey
  size?: number
  color?: string
}

export function EnergyIcon({ energy, size = 40, color }: Props) {
  const icons: Record<EnergyKey, (c: string) => React.ReactElement> = {
    monica: (c) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chef hat */}
        <ellipse cx="20" cy="27" rx="10" ry="5" fill={c} opacity="0.9"/>
        <rect x="12" y="22" width="16" height="6" rx="1" fill={c} opacity="0.9"/>
        <path d="M14 22 C14 14 10 12 12 8 C14 5 17 5 20 6 C23 5 26 5 28 8 C30 12 26 14 26 22" fill={c} opacity="0.75"/>
        <ellipse cx="20" cy="22" rx="8" ry="2.5" fill={c} opacity="0.9"/>
        {/* hat band */}
        <rect x="12" y="20.5" width="16" height="2.5" rx="1" fill={c}/>
      </svg>
    ),
    chandler: (c) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comedy mask */}
        <ellipse cx="14" cy="20" rx="8" ry="9" fill={c} opacity="0.8"/>
        <ellipse cx="26" cy="20" rx="8" ry="9" fill={c} opacity="0.55"/>
        {/* Smiling mask */}
        <path d="M10 20 Q14 25 18 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
        <circle cx="12" cy="17" r="1.2" fill="white" opacity="0.9"/>
        <circle cx="16" cy="17" r="1.2" fill="white" opacity="0.9"/>
        {/* Sad mask */}
        <path d="M22 23 Q26 18 30 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
        <circle cx="24" cy="17" r="1.2" fill="white" opacity="0.9"/>
        <circle cx="28" cy="17" r="1.2" fill="white" opacity="0.9"/>
        {/* Ribbon */}
        <path d="M18 14 Q20 12 22 14" stroke={c} strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    ross: (c) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Simple T-Rex silhouette — readable at all sizes */}
        {/* Body */}
        <ellipse cx="17" cy="25" rx="10" ry="8" fill={c} opacity="0.85"/>
        {/* Neck + head as one piece facing right */}
        <path d="M24 20 L28 12 L36 11 L37 15 L35 18 L32 19 L28 21 Z" fill={c} opacity="0.9"/>
        {/* Lower jaw open */}
        <path d="M32 19 L36 20 L37 23 L33 22 L30 21 Z" fill={c} opacity="0.75"/>
        {/* Teeth */}
        <path d="M33 19.5 L33 22 M35 19.8 L35.5 22.5" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
        {/* Eye */}
        <circle cx="33" cy="13.5" r="1.8" fill="white" opacity="0.9"/>
        <circle cx="33.4" cy="13.8" r="0.8" fill={c}/>
        {/* Tiny arm */}
        <path d="M25 23 L28 27" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M28 27 L26 29 M28 27 L30 29" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        {/* Tail */}
        <path d="M7 28 Q10 24 17 25" stroke={c} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8"/>
        {/* Legs */}
        <rect x="11" y="31" width="5" height="7" rx="2.5" fill={c} opacity="0.9"/>
        <rect x="18" y="31" width="5" height="7" rx="2.5" fill={c} opacity="0.9"/>
      </svg>
    ),
    joey: (c) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pizza slice */}
        <path d="M20 6 L34 30 Q20 36 6 30 Z" fill={c} opacity="0.85"/>
        {/* Crust */}
        <path d="M6 30 Q20 36 34 30" stroke={c} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6"/>
        {/* Cheese drips */}
        <path d="M20 6 L34 30" stroke="white" strokeWidth="0.5" opacity="0.3"/>
        {/* Toppings — pepperoni circles */}
        <circle cx="20" cy="20" r="2.5" fill="white" opacity="0.45"/>
        <circle cx="15" cy="26" r="2" fill="white" opacity="0.45"/>
        <circle cx="25" cy="25" r="2" fill="white" opacity="0.45"/>
        <circle cx="19" cy="14" r="1.5" fill="white" opacity="0.45"/>
      </svg>
    ),
    phoebe: (c) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Guitar — classic figure-8 body, clear neck, horizontal orientation */}
        {/* Upper bout */}
        <circle cx="20" cy="17" r="8" fill={c} opacity="0.78"/>
        {/* Lower bout (larger) */}
        <circle cx="20" cy="30" r="10" fill={c} opacity="0.88"/>
        {/* Waist — notch each side to create the figure-8 waist */}
        <ellipse cx="10.5" cy="23.5" rx="3.5" ry="5" fill="#F5EFE6" opacity="0.75"/>
        <ellipse cx="29.5" cy="23.5" rx="3.5" ry="5" fill="#F5EFE6" opacity="0.75"/>
        {/* Sound hole */}
        <circle cx="20" cy="29" r="3.5" fill="white" opacity="0.35"/>
        {/* Neck */}
        <rect x="18" y="3" width="4" height="11" rx="2" fill={c} opacity="0.88"/>
        {/* Headstock */}
        <rect x="15" y="2" width="10" height="4" rx="2" fill={c}/>
        {/* Strings */}
        <line x1="19.2" y1="5" x2="19.2" y2="17" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        <line x1="20.8" y1="5" x2="20.8" y2="17" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        {/* Bridge */}
        <rect x="16" y="32" width="8" height="2" rx="1" fill="white" opacity="0.4"/>
      </svg>
    ),
    rachel: (c) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* High heel — bold, unmistakable side silhouette */}
        {/* Stiletto heel column — thin and tall on the left */}
        <rect x="6" y="22" width="4" height="16" rx="2" fill={c} opacity="0.95"/>
        {/* Sole — thin horizontal bar */}
        <rect x="6" y="35" width="28" height="3" rx="1.5" fill={c} opacity="0.9"/>
        {/* Shoe body — the curved upper going from heel to pointed toe */}
        <path d="M8 23 Q10 10 20 8 Q30 6 34 14 Q36 18 34 24 L20 25 Q12 25 8 23 Z" fill={c} opacity="0.82"/>
        {/* Toe point — slight ellipse at the tip */}
        <ellipse cx="33" cy="24" rx="3.5" ry="4" fill={c} opacity="0.9"/>
        {/* Ankle strap detail */}
        <path d="M10 19 Q18 17 26 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      </svg>
    ),
  }

  const defaultColors: Record<EnergyKey, string> = {
    monica: "#8FAF8A",
    chandler: "#9B8BAB",
    ross: "#7B9BB5",
    joey: "#9B7B5B",
    phoebe: "#6BABB5",
    rachel: "#C48BAB",
  }

  const fill = color ?? defaultColors[energy]
  return icons[energy](fill)
}
