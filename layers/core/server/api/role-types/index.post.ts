import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requireAdminRole(event)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const body = await readBody(event)
  const name = (body?.name ?? '').trim()

  if (!name) throw createError({ statusCode: 400, statusMessage: 'Naam is verplicht' })
  if (name.length > 100) throw createError({ statusCode: 400, statusMessage: 'Naam mag maximaal 100 tekens zijn' })

  return roleTypeRepository.create(db, orgId, name)
})
