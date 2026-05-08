import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const employee = await employeeRepository.findById(db, id, orgId)
  if (!employee) throw createError({ statusCode: 404, statusMessage: 'Medewerker niet gevonden' })

  const [availability, grants] = await Promise.all([
    employeeRepository.findAvailability(db, id),
    grantRepository.findByProfile(db, id, orgId),
  ])

  return {
    employee: { ...employee, grants },
    availability: availability.map(a => ({
      dayOfWeek: a.dayOfWeek,
      maxHours: Number(a.maxHours),
    })),
  }
})
