import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)
  const employees = await employeeRepository.findByOrg(db, orgId)

  return { employees }
})
