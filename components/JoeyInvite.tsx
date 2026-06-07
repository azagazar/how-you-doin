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
    <>
      {/* Mobile: full-width strip above bottom nav */}
      <button
        onClick={onClick}
        aria-label={LABEL[lang]}
        className="
          lg:hidden
          fixed bottom-[76px] left-0 right-0 z-20
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

      {/* Desktop: FAB in bottom-right corner */}
      <button
        onClick={onClick}
        aria-label={LABEL[lang]}
        className="
          hidden lg:flex
          fixed bottom-8 right-8 z-20
          items-center gap-3
          bg-[#6FB6D4] border border-[#6FB6D4] border-b-4
          px-6 py-3
          shadow-lg
          transition-opacity hover:opacity-80 active:opacity-60
        "
      >
        <span className="text-2xl leading-none" aria-hidden="true">🍕</span>
        <span className="font-display text-[#fde52f] text-xl uppercase leading-none tracking-wide">
          {LABEL[lang]}
        </span>
      </button>
    </>
  )
}
