import { and, eq, count } from 'drizzle-orm'
import { grants, roleTypes, profiles } from '../../../../drizzle/schema'
import type { DrizzleDB } from '../../../base/server/utils/drizzle'

export const grantRepository = {
  async findByProfile(db: DrizzleDB, profileId: string, orgId: string) {
    return db
      .select({
        id: grants.id,
        profileId: grants.profileId,
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
          eq(grants.profileId, profileId),
          eq(roleTypes.organisationId, orgId),
        ),
      )
  },

  async create(db: DrizzleDB, data: {
    profileId: string
    roleTypeId: string
    startsAt: string | null
    expiresAt: string | null
  }) {
    const [row] = await db.insert(grants).values(data).returning()
    return row
  },

  async deleteById(db: DrizzleDB, id: string) {
    const [row] = await db.delete(grants).where(eq(grants.id, id)).returning()
    return row ?? null
  },

  async countByRoleType(db: DrizzleDB, roleTypeId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(grants)
      .where(eq(grants.roleTypeId, roleTypeId))
    return row?.total ?? 0
  },
}

export const roleTypeRepository = {
  async findByOrg(db: DrizzleDB, orgId: string) {
    return db
      .select()
      .from(roleTypes)
      .where(eq(roleTypes.organisationId, orgId))
  },

  async findById(db: DrizzleDB, id: string, orgId: string) {
    const [row] = await db
      .select()
      .from(roleTypes)
      .where(and(eq(roleTypes.id, id), eq(roleTypes.organisationId, orgId)))
      .limit(1)
    return row ?? null
  },

  async create(db: DrizzleDB, orgId: string, name: string) {
    const [row] = await db.insert(roleTypes).values({ organisationId: orgId, name }).returning()
    return row
  },

  async delete(db: DrizzleDB, id: string, orgId: string) {
    const [row] = await db
      .delete(roleTypes)
      .where(and(eq(roleTypes.id, id), eq(roleTypes.organisationId, orgId)))
      .returning()
    return row ?? null
  },
}
