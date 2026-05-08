import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  return roleTypeRepository.findByOrg(db, orgId)
})
