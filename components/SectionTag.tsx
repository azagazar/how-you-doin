import { cn } from "@/lib/utils"

type Props = {
  label: string
  className?: string
}

export function SectionTag({ label, className }: Props) {
  return (
    <div className={cn("figma-tag", className)}>
      <span className="font-display text-[#6a4f79] text-2xl leading-none whitespace-nowrap uppercase">
        {label}
      </span>
    </div>
  )
}
