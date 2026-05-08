import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { profiles } from '../../../../../drizzle/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const { password } = await readBody(event)
  if (!password || password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Wachtwoord moet minimaal 8 tekens bevatten' })
  }

  const config = useRuntimeConfig()
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    config.supabaseServiceRoleKey,
  )

  const { error } = await adminClient.auth.admin.updateUserById(user.id, { password })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Wachtwoord wijzigen mislukt' })

  const db = useDrizzle()
  await db
    .update(profiles)
    .set({ mustChangePassword: false })
    .where(eq(profiles.id, user.id))

  return { ok: true }
})
