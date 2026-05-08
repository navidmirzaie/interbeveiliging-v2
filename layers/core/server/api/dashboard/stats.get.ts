import { serverSupabaseUser } from '#supabase/server'
import { and, count, eq, gte, isNull, lte } from 'drizzle-orm'
import { profiles, shifts } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const today = new Date().toISOString().slice(0, 10)
  const monday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  })()
  const sunday = (() => {
    const d = new Date(monday)
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0, 10)
  })()

  const [employeeCount] = await db
    .select({ total: count() })
    .from(profiles)
    .where(and(eq(profiles.organisationId, orgId), eq(profiles.role, 'employee'), isNull(profiles.deletedAt)))

  const [shiftsThisWeek] = await db
    .select({ total: count() })
    .from(shifts)
    .where(and(eq(shifts.organisationId, orgId), gte(shifts.date, monday), lte(shifts.date, sunday)))

  const [shiftsToday] = await db
    .select({ total: count() })
    .from(shifts)
    .where(and(eq(shifts.organisationId, orgId), eq(shifts.date, today)))

  return {
    totalEmployees: employeeCount?.total ?? 0,
    shiftsThisWeek: shiftsThisWeek?.total ?? 0,
    shiftsToday: shiftsToday?.total ?? 0,
  }
})
