import { serverSupabaseUser } from '#supabase/server'

function weekBounds(weekParam: string): { start: string; end: string } {
  const parts = weekParam.split('-W')
  const year = Number(parts[0])
  const week = Number(parts[1])
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const start = new Date(startOfWeek1)
  start.setDate(startOfWeek1.getDate() + (week - 1) * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const body = await readBody(event)
  const { week, published } = body ?? {}

  if (!week || !/^\d{4}-W\d{1,2}$/.test(week)) {
    throw createError({ statusCode: 400, statusMessage: 'week is verplicht (bijv. 2025-W20)' })
  }
  if (typeof published !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'published (boolean) is verplicht' })
  }

  const { start, end } = weekBounds(week)
  await shiftRepository.publishWeek(db, orgId, start, end, published)

  return { ok: true }
})
