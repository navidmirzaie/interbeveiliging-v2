import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const employee = await employeeRepository.findById(db, id, orgId)
  if (!employee) throw createError({ statusCode: 404, statusMessage: 'Medewerker niet gevonden' })

  const body = await readBody(event)
  const { availability } = body

  if (!Array.isArray(availability) || availability.length !== 7) {
    throw createError({ statusCode: 400, statusMessage: 'Beschikbaarheid moet 7 dagen bevatten (0–6)' })
  }

  for (const day of availability) {
    if (day.dayOfWeek < 0 || day.dayOfWeek > 6) throw createError({ statusCode: 400, statusMessage: 'Dag moet 0–6 zijn' })
    if (day.maxHours < 0 || day.maxHours > 24) throw createError({ statusCode: 400, statusMessage: 'maxHours moet 0–24 zijn' })
  }

  await employeeRepository.upsertAvailability(db, id, availability)
  return { ok: true }
})
