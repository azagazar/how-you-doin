"use client"

import { useRouter, useParams } from "next/navigation"
import { EntryDetail } from "@/components/EntryDetail"

export default function EntryDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  return (
    <div className="h-dvh overflow-y-auto bg-[#ece7df]">
      <EntryDetail id={id} onDelete={() => router.replace("/history")} />
    </div>
  )
}
