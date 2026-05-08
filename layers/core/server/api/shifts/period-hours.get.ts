import { serverSupabaseUser } from '#supabase/server'
import { and, eq, gte, lte } from 'drizzle-orm'
import { shifts } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const query = getQuery(event)
  const weekStart = query.weekStart as string
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    throw createError({ statusCode: 400, statusMessage: 'weekStart parameter vereist (YYYY-MM-DD)' })
  }

  // 4-week period containing the given Monday
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 27)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const rows = await db
    .select({
      profileId: shifts.profileId,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
    })
    .from(shifts)
    .where(
      and(
        eq(shifts.organisationId, orgId),
        gte(shifts.date, startStr),
        lte(shifts.date, endStr),
      ),
    )

  const hoursByProfile: Record<string, number> = {}
  for (const row of rows) {
    const [sh, sm] = row.startTime.split(':').map(Number)
    const [eh, em] = row.endTime.split(':').map(Number)
    const mins = ((eh! * 60 + em!) - (sh! * 60 + sm!) + 1440) % 1440
    hoursByProfile[row.profileId] = (hoursByProfile[row.profileId] ?? 0) + mins / 60
  }

  return { hoursByProfile }
})
