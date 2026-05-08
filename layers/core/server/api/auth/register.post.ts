import { createClient } from '@supabase/supabase-js'
import { eq } from 'drizzle-orm'
import { organisations, profiles, organisationSettings } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { organisationName, kvkNumber, email, password } = body

  if (!organisationName?.trim()) throw createError({ statusCode: 400, statusMessage: 'Organisatienaam is verplicht' })
  if (!/^\d{8}$/.test(kvkNumber ?? '')) throw createError({ statusCode: 400, statusMessage: 'KvK-nummer moet exact 8 cijfers bevatten' })
  if (!email?.trim()) throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
  if (!password || password.length < 8) throw createError({ statusCode: 400, statusMessage: 'Wachtwoord moet minimaal 8 tekens bevatten' })

  const config = useRuntimeConfig()

  // Only permitted use of service role key — creating the initial admin user
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    config.supabaseServiceRoleKey,
  )

  // Check KvK uniqueness
  const db = useDrizzle()
  const existing = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.kvkNumber, kvkNumber))
    .limit(1)

  if (existing.length) throw createError({ statusCode: 409, statusMessage: 'KvK-nummer is al in gebruik' })

  // Create Supabase auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already')) throw createError({ statusCode: 409, statusMessage: 'E-mailadres is al in gebruik' })
    throw createError({ statusCode: 500, statusMessage: 'Kon gebruiker niet aanmaken' })
  }

  const userId = authData.user!.id

  // Create org + profile + settings in sequence (Supabase doesn't support cross-table transactions via JS)
  const [org] = await db.insert(organisations).values({
    name: organisationName.trim(),
    kvkNumber,
  }).returning()

  if (!org) throw createError({ statusCode: 500, statusMessage: 'Kon organisatie niet aanmaken' })

  await db.insert(profiles).values({
    id: userId,
    organisationId: org.id,
    firstName: email.split('@')[0] ?? email,
    lastName: '',
    email,
    role: 'admin',
  })

  await db.insert(organisationSettings).values({
    organisationId: org.id,
  })

  return { ok: true, data: { organisationId: org.id, profileId: userId } }
})
