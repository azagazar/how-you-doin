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
        className="hidden lg:inline-flex figma-btn gap-2 !bg-[#6FB6D4] !border-[#6FB6D4] fixed bottom-8 right-8 z-20"
      >
        <span className="font-display text-[#fde52f] text-xl leading-none uppercase translate-y-[2px] flex items-center gap-2">
          <span aria-hidden="true">🍕</span>
          {LABEL[lang]}
        </span>
      </button>
    </>
  )
}
