import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requireAdminRole(event)

  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const roleType = await roleTypeRepository.findById(db, id, orgId)
  if (!roleType) throw createError({ statusCode: 404, statusMessage: 'Roltype niet gevonden' })

  const activeGrants = await grantRepository.countByRoleType(db, id)
  if (activeGrants > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Roltype kan niet worden verwijderd — er zijn nog actieve koppelingen',
    })
  }

  await roleTypeRepository.delete(db, id, orgId)
  return { ok: true }
})
