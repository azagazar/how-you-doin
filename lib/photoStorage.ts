import { supabase } from "./supabase"
import { resizeImage, getImageOrientation, ImageOrientation } from "./imageUtils"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

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
): Promise<{ url: string; orientation: ImageOrientation }> {
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    throw new PhotoError("Unsupported format. Please use JPG, PNG, or WebP.")
  }

  const { blob, width, height } = await resizeImage(file, 1600)
  const orientation = getImageOrientation(width, height)

  const accessToken = await getAccessToken()

  const formData = new FormData()
  formData.append("file", new File([blob], `${date}.jpg`, { type: "image/jpeg" }))
  formData.append("date", date)

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
  return { url, orientation }
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
