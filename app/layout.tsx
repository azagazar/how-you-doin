import type { Metadata, Viewport } from "next"
import { Geist, League_Gothic, Cormorant_Infant } from "next/font/google"
import { I18nProvider } from "@/lib/i18n"
import { SwRegister } from "./sw-register"
import "./globals.css"

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] })
const leagueGothic = League_Gothic({ variable: "--font-display", subsets: ["latin"] })
const cormorantInfant = Cormorant_Infant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
})

export const metadata: Metadata = {
  title: "How You Doin'?",
  description: "Your daily emotional check-in",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "How You Doin'?",
  },
}

export const viewport: Viewport = {
  themeColor: "#2C1A0E",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${leagueGothic.variable} ${cormorantInfant.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <I18nProvider>{children}</I18nProvider>
        <SwRegister />
      </body>
    </html>
  )
}
