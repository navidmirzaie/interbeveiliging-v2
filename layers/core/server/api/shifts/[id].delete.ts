import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const deleted = await shiftRepository.delete(db, id, orgId)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Dienst niet gevonden' })

  return { ok: true }
})
