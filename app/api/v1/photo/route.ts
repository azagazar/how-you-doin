import { execSync } from "child_process"
import { writeFileSync, readFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { getAdminSupabase } from "@/lib/api-auth"

export const runtime = "nodejs"

const BUCKET = "journal-photos"

function isHeicBuffer(filename: string, contentType: string): boolean {
  const name = filename.toLowerCase()
  return name.endsWith(".heic") || name.endsWith(".heif") ||
    contentType === "image/heic" || contentType === "image/heif"
}

function convertHeicToJpeg(input: Buffer<ArrayBufferLike>): Buffer<ArrayBufferLike> {
  if (process.platform !== "darwin") {
    throw new Error("HEIC uploads require macOS. Please convert to JPEG before uploading.")
  }
  const ts = Date.now()
  const inPath = join(tmpdir(), `hyd_${ts}.heic`)
  const outPath = join(tmpdir(), `hyd_${ts}.jpg`)
  try {
    writeFileSync(inPath, input)
    // -Z 1600: fit within 1600px on longest side; -s format jpeg: output JPEG
    execSync(`sips -s format jpeg -Z 1600 "${inPath}" --out "${outPath}"`, { stdio: "ignore" })
    return readFileSync(outPath)
  } finally {
    try { unlinkSync(inPath) } catch { /* ignore */ }
    try { unlinkSync(outPath) } catch { /* ignore */ }
  }
}

async function getUserFromToken(req: Request) {
  const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
  if (!accessToken) return null
  const admin = getAdminSupabase()
  const { data: { user } } = await admin.auth.getUser(accessToken)
  return user ?? null
}

export async function POST(req: Request) {
  const user = await getUserFromToken(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const date = formData.get("date") as string | null

  if (!file || !date) return Response.json({ error: "Missing file or date" }, { status: 400 })

  let imageBuffer: Buffer<ArrayBufferLike> = Buffer.from(await file.arrayBuffer())

  if (isHeicBuffer(file.name, file.type)) {
    try {
      imageBuffer = convertHeicToJpeg(imageBuffer)
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "HEIC conversion failed" }, { status: 415 })
    }
  }

  const path = `${user.id}/${date}.jpg`

  const admin = getAdminSupabase()

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, imageBuffer, { contentType: "image/jpeg", upsert: true })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  // Append cache-buster so browsers always fetch the new file after replace
  const versionedUrl = `${publicUrl}?v=${Date.now()}`

  const { error: dbError } = await admin
    .from("journal_entries")
    .update({ photo_url: versionedUrl })
    .eq("date", date)
    .eq("user_id", user.id)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  return Response.json({ url: versionedUrl })
}

export async function DELETE(req: Request) {
  const user = await getUserFromToken(req)
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let body: { date?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { date } = body
  if (!date) return Response.json({ error: "Missing date" }, { status: 400 })

  const admin = getAdminSupabase()
  const path = `${user.id}/${date}.jpg`

  const { error: storageError } = await admin.storage.from(BUCKET).remove([path])
  if (storageError) return Response.json({ error: storageError.message }, { status: 500 })

  const { error: dbError } = await admin
    .from("journal_entries")
    .update({ photo_url: null })
    .eq("date", date)
    .eq("user_id", user.id)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  return Response.json({ success: true })
}
