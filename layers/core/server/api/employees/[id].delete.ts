import { serverSupabaseUser } from '#supabase/server'
import { and, eq } from 'drizzle-orm'
import { shifts } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  await requirePlannerRole(event)

  const user = await serverSupabaseUser(event)
  const id = getRouterParam(event, 'id')!
  const db = useDrizzle()
  const orgId = await getOrgId(user!.id, db)

  const existingShifts = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(and(eq(shifts.profileId, id), eq(shifts.organisationId, orgId)))
    .limit(1)

  if (existingShifts.length) {
    // Soft-delete — never hard-delete when shifts exist
    await employeeRepository.softDelete(db, id, orgId)
    return { ok: true, softDeleted: true }
  }

  await employeeRepository.softDelete(db, id, orgId)
  return { ok: true, softDeleted: true }
})
