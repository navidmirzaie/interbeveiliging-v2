import { and, eq, isNull, inArray, sql } from 'drizzle-orm'
import { profiles, grants, roleTypes, employeeAvailability } from '../../../../drizzle/schema'
import type { DrizzleDB } from '../../../base/server/utils/drizzle'

export const employeeRepository = {
  async findByOrg(db: DrizzleDB, orgId: string) {
    const rows = await db
      .select({
        id: profiles.id,
        organisationId: profiles.organisationId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
        phone: profiles.phone,
        employeeNumber: profiles.employeeNumber,
        role: profiles.role,
        contractHoursPerPeriod: profiles.contractHoursPerPeriod,
        deletedAt: profiles.deletedAt,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(and(
        eq(profiles.organisationId, orgId),
        isNull(profiles.deletedAt),
      ))

    const profileIds = rows.map(r => r.id)
    if (!profileIds.length) return []

    const grantRows = await db
      .select({
        profileId: grants.profileId,
        grantId: grants.id,
        roleTypeId: grants.roleTypeId,
        roleTypeName: roleTypes.name,
        startsAt: grants.startsAt,
        expiresAt: grants.expiresAt,
        createdAt: grants.createdAt,
      })
      .from(grants)
      .innerJoin(roleTypes, eq(grants.roleTypeId, roleTypes.id))
      .where(
        and(
          eq(roleTypes.organisationId, orgId),
          inArray(grants.profileId, profileIds),
        ),
      )

    const availRows = profileIds.length
      ? await db
          .select({
            profileId: employeeAvailability.profileId,
            dayOfWeek: employeeAvailability.dayOfWeek,
            maxHours: employeeAvailability.maxHours,
          })
          .from(employeeAvailability)
          .where(inArray(employeeAvailability.profileId, profileIds))
      : []

    const grantsByProfile = new Map<string, typeof grantRows>()
    for (const g of grantRows) {
      if (!grantsByProfile.has(g.profileId)) grantsByProfile.set(g.profileId, [])
      grantsByProfile.get(g.profileId)!.push(g)
    }

    const availByProfile = new Map<string, typeof availRows>()
    for (const a of availRows) {
      if (!availByProfile.has(a.profileId)) availByProfile.set(a.profileId, [])
      availByProfile.get(a.profileId)!.push(a)
    }

    return rows.map(p => ({
      ...p,
      grants: (grantsByProfile.get(p.id) ?? []).map(g => ({
        id: g.grantId,
        profileId: g.profileId,
        roleTypeId: g.roleTypeId,
        roleTypeName: g.roleTypeName,
        startsAt: g.startsAt,
        expiresAt: g.expiresAt,
        createdAt: g.createdAt,
      })),
      availability: (availByProfile.get(p.id) ?? []).map(a => ({
        dayOfWeek: a.dayOfWeek,
        maxHours: Number(a.maxHours),
      })),
    }))
  },

  async findById(db: DrizzleDB, id: string, orgId: string) {
    const [row] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.organisationId, orgId)))
      .limit(1)
    return row ?? null
  },

  async findAvailability(db: DrizzleDB, profileId: string) {
    return db
      .select()
      .from(employeeAvailability)
      .where(eq(employeeAvailability.profileId, profileId))
  },

  async upsertAvailability(db: DrizzleDB, profileId: string, days: { dayOfWeek: number; maxHours: number }[]) {
    if (!days.length) return
    await db
      .insert(employeeAvailability)
      .values(days.map(d => ({ profileId, dayOfWeek: d.dayOfWeek, maxHours: String(d.maxHours) })))
      .onConflictDoUpdate({
        target: [employeeAvailability.profileId, employeeAvailability.dayOfWeek],
        set: { maxHours: sql`excluded.max_hours` },
      })
  },

  async softDelete(db: DrizzleDB, id: string, orgId: string) {
    await db
      .update(profiles)
      .set({ deletedAt: new Date() })
      .where(and(eq(profiles.id, id), eq(profiles.organisationId, orgId)))
  },
}
