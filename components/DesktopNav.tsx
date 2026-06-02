"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function DesktopNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const tabs = [
    { href: "/", label: t("nav.checkIn") },
    { href: "/history", label: t("nav.journal") },
    { href: "/settings", label: t("nav.settings") },
  ]

  return (
    <header
      className="hidden lg:flex items-center justify-between px-8 h-14 bg-[#ece7df] border-b border-[#6a4f79] flex-shrink-0"
    >
      <span className="font-display text-2xl text-black uppercase leading-none">
        How You Doin&apos;?
      </span>

      <nav className="flex items-center gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href === "/history" && pathname.startsWith("/entry"))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "font-display text-xl uppercase leading-none px-4 py-2 transition-colors",
                active
                  ? "bg-[#fde52f] text-black border border-[#6a4f79] border-b-4"
                  : "text-black opacity-50 hover:opacity-80",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
