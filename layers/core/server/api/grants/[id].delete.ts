import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()

  const deleted = await grantRepository.deleteById(db, id)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Koppeling niet gevonden' })

  return { ok: true }
})
