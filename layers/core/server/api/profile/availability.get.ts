import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { profiles } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const db = useDrizzle()

  const [profile] = await db
    .select({ contractHoursPerPeriod: profiles.contractHoursPerPeriod })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  const availability = await employeeRepository.findAvailability(db, user.id)

  return {
    contractHoursPerPeriod: profile?.contractHoursPerPeriod ?? 144,
    availability: availability.map(a => ({
      dayOfWeek: a.dayOfWeek,
      maxHours: Number(a.maxHours),
    })),
  }
})
