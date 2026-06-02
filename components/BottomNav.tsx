"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

function CouchIcon({ active }: { active: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/branding/couch.png"
      alt=""
      aria-hidden="true"
      className="transition-all"
      style={{ height: 28, width: "auto", opacity: active ? 1 : 0.45 }}
    />
  )
}

function JournalIcon({ active }: { active: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/historia.png"
      alt=""
      aria-hidden="true"
      style={{ height: 28, width: "auto", opacity: active ? 1 : 0.45 }}
    />
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/ustawienia.png"
      alt=""
      aria-hidden="true"
      style={{ height: 28, width: "auto", opacity: active ? 1 : 0.45 }}
    />
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const tabs = [
    { href: "/", label: t("nav.checkIn"), Icon: CouchIcon },
    { href: "/history", label: t("nav.journal"), Icon: JournalIcon },
    { href: "/settings", label: t("nav.settings"), Icon: SettingsIcon },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#ece7df] lg:hidden"
      style={{ boxShadow: "0px -2px 8px rgba(106,79,121,0.12)" }}
    >
      <div className="max-w-lg mx-auto flex safe-area-pb">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-3 transition-opacity",
                active ? "opacity-100" : "opacity-50",
              )}
            >
              <tab.Icon active={active} />
              <span className="font-display text-black text-lg leading-none uppercase">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
