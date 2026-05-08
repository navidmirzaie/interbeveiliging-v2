import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { profiles } from '../../../../drizzle/schema'
import type { UserRole } from '../../types/auth'

export async function getOrgId(userId: string, db: ReturnType<typeof import('./drizzle').useDrizzle>): Promise<string> {
  const rows = await db
    .select({ organisationId: profiles.organisationId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  if (!rows.length) throw createError({ statusCode: 401, statusMessage: 'Profile not found' })
  return rows[0]!.organisationId
}

export async function getAuthRole(event: Parameters<typeof serverSupabaseUser>[0]): Promise<UserRole> {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  const db = useDrizzle()
  const rows = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!rows.length) throw createError({ statusCode: 401, statusMessage: 'Profile not found' })
  return rows[0]!.role as UserRole
}

export async function requirePlannerRole(event: Parameters<typeof serverSupabaseUser>[0]): Promise<void> {
  const role = await getAuthRole(event)
  if (role === 'employee') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}

export async function requireAdminRole(event: Parameters<typeof serverSupabaseUser>[0]): Promise<void> {
  const role = await getAuthRole(event)
  if (role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}
