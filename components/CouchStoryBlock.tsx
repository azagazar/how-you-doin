"use client"

import { CouchStory } from "@/lib/couchStories"
import { useI18n } from "@/lib/i18n"
import { SectionTag } from "@/components/SectionTag"

type Props = {
  story: CouchStory
}

export function CouchStoryBlock({ story }: Props) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      {/* COUCH STORY section */}
      <div>
        <div className="flex justify-center relative z-10 -mb-5">
          <SectionTag label={t("home.storySection")} />
        </div>
        <div className="figma-card pt-6 pb-5 px-5">
          <h2 className="font-display text-2xl text-black text-center uppercase leading-tight mb-3">
            {story.dayTitle}
          </h2>
          <div className="space-y-2 text-center">
            {story.story.split("\n\n").map((line, i) => (
              <p key={i} className="font-serif text-base text-black leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* REFLECTION section */}
      <div>
        <div className="flex justify-center relative z-10 -mb-5">
          <SectionTag label={t("home.reflectionSection")} />
        </div>
        <div className="figma-card pt-6 pb-5 px-5">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/coffee.png"
              alt=""
              aria-hidden="true"
              className="w-10 h-10 object-contain"
            />
            <p className="font-serif text-base text-black text-center leading-relaxed">
              {story.reflection}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
