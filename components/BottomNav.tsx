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
      style={{ height: 22, width: "auto", opacity: active ? 1 : 0.45 }}
    />
  )
}

function JournalIcon({ active }: { active: boolean }) {
  const color = active ? "#6B4F7A" : "#9B8878"
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="1" width="14" height="22" rx="2" fill={color} opacity="0.75"/>
      <rect x="1" y="3" width="4" height="18" rx="2" fill={color} opacity="0.9"/>
      <path d="M7 7 H15" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M7 10.5 H15" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M7 14 H12" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  const color = active ? "#6B4F7A" : "#9B8878"
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1.8"/>
      <path
        d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42"
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#F5EFE6]/95 backdrop-blur-sm border-t border-[#E2D5C8] flex safe-area-pb z-50">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              active ? "text-[#6B4F7A]" : "text-[#9B8878]",
            )}
          >
            <tab.Icon active={active} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
