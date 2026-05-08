import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { organisationSettings, organisations } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const [org] = await db
    .select()
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1)

  const [settings] = await db
    .select()
    .from(organisationSettings)
    .where(eq(organisationSettings.organisationId, orgId))
    .limit(1)

  return { org, settings: settings ?? null }
})
