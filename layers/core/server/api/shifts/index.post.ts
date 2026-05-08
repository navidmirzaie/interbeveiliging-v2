import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { profiles } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const body = await readBody(event)
  const { profileId, date, startTime, endTime, locationLabel } = body ?? {}

  if (!profileId) throw createError({ statusCode: 400, statusMessage: 'profileId is verplicht' })
  if (!date) throw createError({ statusCode: 400, statusMessage: 'datum is verplicht' })
  if (!startTime) throw createError({ statusCode: 400, statusMessage: 'begintijd is verplicht' })
  if (!endTime) throw createError({ statusCode: 400, statusMessage: 'eindtijd is verplicht' })

  const [guard] = await db
    .select({ id: profiles.id, role: profiles.role, organisationId: profiles.organisationId })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1)

  if (!guard || guard.organisationId !== orgId) {
    throw createError({ statusCode: 404, statusMessage: 'Medewerker niet gevonden' })
  }
  if (guard.role !== 'employee') {
    throw createError({ statusCode: 400, statusMessage: 'Alleen medewerkers kunnen worden ingepland' })
  }

  const shift = await shiftRepository.create(db, {
    organisationId: orgId,
    profileId,
    date,
    startTime,
    endTime,
    locationLabel: locationLabel ?? null,
  })

  return { shift }
})
