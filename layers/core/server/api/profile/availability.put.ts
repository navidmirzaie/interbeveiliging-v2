import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const { availability } = await readBody(event)

  if (!Array.isArray(availability) || availability.length !== 7) {
    throw createError({ statusCode: 400, statusMessage: 'availability moet 7 dagen bevatten (0=zondag t/m 6=zaterdag)' })
  }

  const db = useDrizzle()
  await employeeRepository.upsertAvailability(
    db,
    user.id,
    availability.map((maxHours: number, dayOfWeek: number) => ({ dayOfWeek, maxHours })),
  )

  return { ok: true }
})
