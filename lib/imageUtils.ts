// client-only: uses Canvas API and URL.createObjectURL
export type ImageOrientation = "portrait" | "landscape"

export function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  )
}

export async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeic(file)) return file
  const heic2any = (await import("heic2any")).default
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })
  const blob = Array.isArray(result) ? result[0] : result
  return new File([blob], file.name.replace(/\.heic?$/i, ".jpg"), { type: "image/jpeg" })
}

export function getImageOrientation(width: number, height: number): ImageOrientation {
  return height >= width ? "portrait" : "landscape"
}

export async function resizeImage(
  file: File,
  maxWidth = 1600
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let w = img.naturalWidth
      let h = img.naturalHeight

      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w)
        w = maxWidth
      }

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas 2d context unavailable"))
        return
      }

      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas toBlob returned null")); return }
          resolve({ blob, width: w, height: h })
        },
        "image/jpeg",
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image failed to load"))
    }

    img.src = url
  })
}
