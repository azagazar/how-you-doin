import { getAdminSupabase } from "@/lib/api-auth"

export const runtime = "nodejs"

const BUCKET = "journal-photos"

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

  const bytes = await file.arrayBuffer()
  const path = `${user.id}/${date}.jpg`

  const admin = getAdminSupabase()

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(bytes), { contentType: "image/jpeg", upsert: true })

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

  await admin.storage.from(BUCKET).remove([path])

  const { error: dbError } = await admin
    .from("journal_entries")
    .update({ photo_url: null })
    .eq("date", date)
    .eq("user_id", user.id)

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  return Response.json({ success: true })
}
