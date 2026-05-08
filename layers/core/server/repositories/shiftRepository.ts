import { and, eq, gte, lte, inArray } from 'drizzle-orm'
import { shifts, profiles } from '../../../../drizzle/schema'
import type { DrizzleDB } from '../../../base/server/utils/drizzle'

export const shiftRepository = {
  async findByWeek(db: DrizzleDB, orgId: string, weekStart: string, weekEnd: string) {
    return db
      .select({
        id: shifts.id,
        organisationId: shifts.organisationId,
        profileId: shifts.profileId,
        date: shifts.date,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        locationLabel: shifts.locationLabel,
        weekPublished: shifts.weekPublished,
        createdAt: shifts.createdAt,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        email: profiles.email,
      })
      .from(shifts)
      .innerJoin(profiles, eq(shifts.profileId, profiles.id))
      .where(
        and(
          eq(shifts.organisationId, orgId),
          gte(shifts.date, weekStart),
          lte(shifts.date, weekEnd),
        ),
      )
  },

  async findOwnPublished(db: DrizzleDB, profileId: string, weekStart: string, weekEnd: string) {
    return db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.profileId, profileId),
          eq(shifts.weekPublished, true),
          gte(shifts.date, weekStart),
          lte(shifts.date, weekEnd),
        ),
      )
  },

  async create(db: DrizzleDB, data: {
    organisationId: string
    profileId: string
    date: string
    startTime: string
    endTime: string
    locationLabel: string | null
  }) {
    const [row] = await db.insert(shifts).values(data).returning()
    return row
  },

  async update(db: DrizzleDB, id: string, orgId: string, data: Partial<{
    profileId: string
    date: string
    startTime: string
    endTime: string
    locationLabel: string | null
  }>) {
    const [row] = await db
      .update(shifts)
      .set(data)
      .where(and(eq(shifts.id, id), eq(shifts.organisationId, orgId)))
      .returning()
    return row ?? null
  },

  async delete(db: DrizzleDB, id: string, orgId: string) {
    const [row] = await db
      .delete(shifts)
      .where(and(eq(shifts.id, id), eq(shifts.organisationId, orgId)))
      .returning()
    return row ?? null
  },

  async publishWeek(db: DrizzleDB, orgId: string, weekStart: string, weekEnd: string, published: boolean) {
    await db
      .update(shifts)
      .set({ weekPublished: published })
      .where(
        and(
          eq(shifts.organisationId, orgId),
          gte(shifts.date, weekStart),
          lte(shifts.date, weekEnd),
        ),
      )
  },

  async findByWeekForAutoplan(db: DrizzleDB, orgId: string, weekStart: string, weekEnd: string) {
    return db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.organisationId, orgId),
          gte(shifts.date, weekStart),
          lte(shifts.date, weekEnd),
        ),
      )
  },

  async findRecentByProfile(db: DrizzleDB, profileId: string, since: string) {
    return db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.profileId, profileId),
          gte(shifts.date, since),
        ),
      )
  },
}
