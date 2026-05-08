import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { and, eq } from 'drizzle-orm'
import { profiles } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  await requirePlannerRole(event)

  const user = await serverSupabaseUser(event)
  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()
  const orgId = await getOrgId(user!.id, db)

  const body = await readBody(event)
  const { password, ...rest } = body

  const allowed = ['firstName', 'lastName', 'email', 'phone', 'employeeNumber', 'contractHoursPerPeriod']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in rest) updates[key] = rest[key]
  }

  const hasAuthUpdate = (password && password.length >= 8) || updates.email
  if (!Object.keys(updates).length && !hasAuthUpdate) {
    throw createError({ statusCode: 400, statusMessage: 'Geen velden om bij te werken' })
  }

  if (hasAuthUpdate) {
    if (password && password.length < 8) {
      throw createError({ statusCode: 400, statusMessage: 'Wachtwoord moet minimaal 8 tekens bevatten' })
    }
    const config = useRuntimeConfig()
    const adminClient = createClient(process.env.SUPABASE_URL!, config.supabaseServiceRoleKey)
    const authUpdates: { password?: string; email?: string } = {}
    if (password && password.length >= 8) authUpdates.password = password
    if (updates.email) authUpdates.email = updates.email as string
    const { error } = await adminClient.auth.admin.updateUserById(id, authUpdates)
    if (error) throw createError({ statusCode: 500, statusMessage: 'Kon inloggegevens niet bijwerken' })
  }

  if (!Object.keys(updates).length) {
    const [current] = await db.select().from(profiles).where(and(eq(profiles.id, id), eq(profiles.organisationId, orgId))).limit(1)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Medewerker niet gevonden' })
    return current
  }

  const [updated] = await db
    .update(profiles)
    .set(updates)
    .where(and(eq(profiles.id, id), eq(profiles.organisationId, orgId)))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Medewerker niet gevonden' })
  return updated
})
