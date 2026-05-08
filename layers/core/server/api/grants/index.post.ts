import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const body = await readBody(event)
  const { profileId, roleTypeId, startsAt, expiresAt } = body ?? {}

  if (!profileId) throw createError({ statusCode: 400, statusMessage: 'profileId is verplicht' })
  if (!roleTypeId) throw createError({ statusCode: 400, statusMessage: 'roleTypeId is verplicht' })

  const employee = await employeeRepository.findById(db, profileId, orgId)
  if (!employee) throw createError({ statusCode: 404, statusMessage: 'Medewerker niet gevonden' })

  const roleType = await roleTypeRepository.findById(db, roleTypeId, orgId)
  if (!roleType) throw createError({ statusCode: 404, statusMessage: 'Roltype niet gevonden' })

  return grantRepository.create(db, {
    profileId,
    roleTypeId,
    startsAt: startsAt ?? null,
    expiresAt: expiresAt ?? null,
  })
})
