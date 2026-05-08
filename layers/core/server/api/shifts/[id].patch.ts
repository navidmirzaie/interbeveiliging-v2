import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const body = await readBody(event)
  const { profileId, date, startTime, endTime, locationLabel } = body ?? {}

  const updated = await shiftRepository.update(db, id, orgId, {
    ...(profileId !== undefined && { profileId }),
    ...(date !== undefined && { date }),
    ...(startTime !== undefined && { startTime }),
    ...(endTime !== undefined && { endTime }),
    ...(locationLabel !== undefined && { locationLabel }),
  })

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Dienst niet gevonden' })

  return { shift: updated }
})
