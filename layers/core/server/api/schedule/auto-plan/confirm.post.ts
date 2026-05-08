import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { profiles } from '../../../../../../drizzle/schema'
import type { ShiftSuggestion } from '../../../../../base/types/api'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const body = await readBody(event)
  const suggestions: ShiftSuggestion[] = body?.suggestions ?? []

  if (!Array.isArray(suggestions) || !suggestions.length) {
    throw createError({ statusCode: 400, statusMessage: 'suggestions[] is verplicht' })
  }

  const savedShifts = []
  const violations = []

  for (const s of suggestions) {
    const [guard] = await db
      .select({ id: profiles.id, role: profiles.role, organisationId: profiles.organisationId })
      .from(profiles)
      .where(eq(profiles.id, s.employeeId))
      .limit(1)

    if (!guard || guard.organisationId !== orgId || guard.role !== 'employee') continue

    const shiftInput = { date: s.date, startTime: s.startTime, endTime: s.endTime }
    const weekStart = s.date
    const weekEnd = (() => {
      const d = new Date(s.date)
      d.setDate(d.getDate() + 6)
      return d.toISOString().slice(0, 10)
    })()

    const existingShifts = await shiftRepository.findByWeekForAutoplan(db, orgId, weekStart, weekEnd)
    const existing = existingShifts
      .filter(e => e.profileId === s.employeeId)
      .map(e => ({ date: e.date, startTime: e.startTime, endTime: e.endTime }))

    const shiftViolations = validateShift(shiftInput, existing)
    const hasErrors = shiftViolations.some(v => v.severity === 'error')

    if (hasErrors) {
      violations.push({ suggestion: s, violations: shiftViolations })
      continue
    }

    const saved = await shiftRepository.create(db, {
      organisationId: orgId,
      profileId: s.employeeId,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      locationLabel: s.locationLabel ?? null,
    })
    savedShifts.push({ ...saved, violations: shiftViolations })
  }

  return { saved: savedShifts, rejected: violations }
})
