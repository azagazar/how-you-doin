"use client"

import { Lang } from "@/lib/i18n"

type Props = {
  onClick: () => void
  lang: Lang
}

const LABEL: Record<Lang, string> = {
  en: "Ask Joey",
  pl: "Pogadaj z Joeyem",
}

/**
 * Mobile: slim strip pinned above the bottom nav — never overlaps content.
 * Desktop: not rendered here; Joey entry is embedded in the quote bar instead.
 */
export function JoeyInvite({ onClick, lang }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={LABEL[lang]}
      className="
        fixed bottom-[76px] left-0 right-0 z-20
        lg:bottom-0
        flex items-center justify-center gap-2
        bg-[#6FB6D4]
        py-2.5 px-4
        transition-opacity hover:opacity-80 active:opacity-60
      "
    >
      <span className="text-2xl leading-none" aria-hidden="true">🍕</span>
      <span className="font-display text-[#fde52f] text-2xl uppercase leading-none tracking-wide">
        {LABEL[lang]}
      </span>
    </button>
  )
}
