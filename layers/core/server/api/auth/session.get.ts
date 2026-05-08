import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { profiles, organisations } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const db = useDrizzle()
  const rows = await db
    .select({
      profile: profiles,
      org: organisations,
    })
    .from(profiles)
    .innerJoin(organisations, eq(profiles.organisationId, organisations.id))
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!rows.length) throw createError({ statusCode: 401, statusMessage: 'Profiel niet gevonden' })

  const { profile, org } = rows[0]!

  return {
    user: {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      organisationId: profile.organisationId,
      mustChangePassword: profile.mustChangePassword ?? false,
    },
    organisation: {
      id: org.id,
      name: org.name,
      kvkNumber: org.kvkNumber,
      primaryColour: org.primaryColour ?? '#1E3A5F',
      logoUrl: org.logoUrl ?? null,
      dashboardTitle: org.dashboardTitle ?? null,
    },
  }
})
