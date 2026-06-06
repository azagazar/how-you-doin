"use client"

type Props = {
  label: string
  onClick: () => void
}

export function JoeyButton({ label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="figma-btn gap-2 !bg-[#6fb6d4] !border-[#6fb6d4]"
      aria-label={label}
    >
      <span className="font-display text-[#fde52f] text-xl leading-none uppercase translate-y-[2px] flex items-center gap-2">
        <span aria-hidden="true">🍕</span>
        {label}
      </span>
    </button>
  )
}
