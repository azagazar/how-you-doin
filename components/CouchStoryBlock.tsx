"use client"

import { CouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"

type Props = {
  story: CouchStory
}

export function CouchStoryBlock({ story }: Props) {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      {/* COUCH STORY section */}
      <div className="flex flex-col items-center gap-0">
        <span className="bg-[#6B4F7A] text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full z-10 relative">
          {t("home.storySection")}
        </span>
        <div
          className="w-full rounded-2xl px-5 pt-5 pb-4 -mt-3"
          style={{
            background: "#FBF5EC",
            border: "1px solid #D4C4B0",
            boxShadow: "0 4px 16px rgba(100,70,40,0.09), 0 1px 3px rgba(100,70,40,0.05)",
          }}
        >
          <div className="flex items-center gap-3 justify-center mt-2 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/coffee.png" alt="" aria-hidden="true" className="w-8 h-8 object-contain flex-shrink-0" style={{ transform: "scaleX(-1)" }} />
            <h2 className="font-display text-xl font-bold text-[#6B4F7A] leading-tight text-center">
              {story.dayTitle}
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/coffee.png" alt="" aria-hidden="true" className="w-8 h-8 object-contain flex-shrink-0" />
          </div>
          <div className="space-y-1.5 text-center">
            {story.story.split("\n\n").map((line, i) => (
              <p key={i} className="text-sm text-[#4A3728] leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* REFLECTION section */}
      <div className="flex flex-col items-center gap-0">
        <span className="bg-[#6B4F7A] text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full z-10 relative">
          {t("home.reflectionSection")}
        </span>
        <div
          className="w-full rounded-2xl px-5 pt-5 pb-4 -mt-3"
          style={{
            background: "#F5EFE6",
            border: "1px solid #D4C4B0",
            boxShadow: "0 4px 16px rgba(100,70,40,0.09), 0 1px 3px rgba(100,70,40,0.05)",
          }}
        >
          <div className="flex items-start gap-3 mt-1">
            <span className="text-[#C8A87A] text-lg leading-none flex-shrink-0 mt-0.5">★</span>
            <p className="font-display italic text-sm text-[#6B4F7A] leading-relaxed">
              {story.reflection}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
