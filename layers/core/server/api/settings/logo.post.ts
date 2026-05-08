import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { organisations } from '../../../../../drizzle/schema'

// Requires a public Supabase Storage bucket named "logos".
// Create it in the Supabase dashboard: Storage → New bucket → name "logos", Public ON.
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requireAdminRole(event)

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file')
  if (!filePart?.data || !filePart.type) {
    throw createError({ statusCode: 400, statusMessage: 'Geen bestand ontvangen' })
  }

  const ext = filePart.filename?.split('.').pop()?.toLowerCase() ?? 'png'
  if (!['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
    throw createError({ statusCode: 400, statusMessage: 'Bestandstype niet toegestaan (png, jpg, webp, svg)' })
  }

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const supabase = serverSupabaseServiceRole(event)
  const path = `${orgId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, filePart.data, { contentType: filePart.type, upsert: true })

  if (uploadError) {
    throw createError({ statusCode: 500, statusMessage: uploadError.message })
  }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

  // Bust CDN cache by appending a timestamp query param
  const logoUrl = `${publicUrl}?t=${Date.now()}`

  await db
    .update(organisations)
    .set({ logoUrl })
    .where(eq(organisations.id, orgId))

  return { url: logoUrl }
})
