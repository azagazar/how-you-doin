import { supabase } from "./supabase"
import { resizeImage, isHeic } from "./imageUtils"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"]

export class PhotoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PhotoError"
  }
}

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new PhotoError("Not authenticated")
  return session.access_token
}

export async function uploadPhoto(
  file: File,
  date: string
): Promise<{ url: string }> {
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) && !isHeic(file)) {
    throw new PhotoError("Unsupported format. Please use JPG, PNG, WebP, or HEIC.")
  }

  const accessToken = await getAccessToken()
  const formData = new FormData()

  if (isHeic(file)) {
    // HEIC can't be decoded client-side — send raw to server for sips conversion
    formData.append("file", file)
    formData.append("date", date)
  } else {
    const { blob } = await resizeImage(file, 1600)
    formData.append("file", new File([blob], `${date}.jpg`, { type: "image/jpeg" }))
    formData.append("date", date)
  }

  const res = await fetch("/api/v1/photo", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new PhotoError(`Upload failed: ${(data as { error?: string }).error ?? res.statusText}`)
  }

  const { url } = await res.json() as { url: string }
  return { url }
}

export async function deletePhoto(date: string): Promise<void> {
  const accessToken = await getAccessToken()

  const res = await fetch("/api/v1/photo", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new PhotoError(`Delete failed: ${(data as { error?: string }).error ?? res.statusText}`)
  }
}
