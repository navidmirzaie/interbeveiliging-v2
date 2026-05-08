import { serverSupabaseUser } from '#supabase/server'
import { eq, isNull, and, gte } from 'drizzle-orm'
import { profiles, grants, roleTypes, employeeAvailability } from '../../../../../drizzle/schema'
import type { ShiftSuggestion, UnfillableSlot } from '../../../../base/types/api'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requirePlannerRole(event)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)
  const { anthropicApiKey } = useRuntimeConfig()

  if (!anthropicApiKey) throw createError({ statusCode: 500, statusMessage: 'Anthropic API niet geconfigureerd' })

  const body = await readBody(event)
  const { weekStart } = body ?? {}

  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    throw createError({ statusCode: 400, statusMessage: 'weekStart (YYYY-MM-DD) is verplicht' })
  }

  const weekEnd = (() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0, 10)
  })()

  const today = new Date().toISOString().slice(0, 10)

  const employeeProfiles = await db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      contractHoursPerPeriod: profiles.contractHoursPerPeriod,
    })
    .from(profiles)
    .where(and(
      eq(profiles.organisationId, orgId),
      eq(profiles.role, 'employee'),
      isNull(profiles.deletedAt),
    ))

  const grantRows = await db
    .select({
      profileId: grants.profileId,
      roleTypeName: roleTypes.name,
      startsAt: grants.startsAt,
      expiresAt: grants.expiresAt,
    })
    .from(grants)
    .innerJoin(roleTypes, and(
      eq(grants.roleTypeId, roleTypes.id),
      eq(roleTypes.organisationId, orgId),
    ))

  const availRows = await db
    .select()
    .from(employeeAvailability)

  const existingShifts = await shiftRepository.findByWeekForAutoplan(db, orgId, weekStart, weekEnd)

  const employees = employeeProfiles.map(p => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    contractHoursPerPeriod: p.contractHoursPerPeriod ?? 144,
    grants: grantRows.filter(g => g.profileId === p.id),
    availability: availRows
      .filter(a => a.profileId === p.id)
      .map(a => ({ dayOfWeek: a.dayOfWeek, maxHours: Number(a.maxHours) })),
  }))

  const systemPrompt = buildCaoSystemPrompt()
  const userPrompt = buildSchedulePrompt(weekStart, employees, existingShifts)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    console.error('Claude API error:', response.status, errBody)
    throw createError({ statusCode: 502, statusMessage: `Claude API fout: ${response.status}` })
  }

  const claudeBody = await response.json()
  const rawText: string = claudeBody?.content?.[0]?.text ?? ''

  // Claude sometimes wraps JSON in markdown code fences — strip them
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  let suggestions: ShiftSuggestion[] = []
  let unfillable: UnfillableSlot[] = []

  try {
    const parsed = JSON.parse(jsonText)
    suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    unfillable = Array.isArray(parsed.unfillable) ? parsed.unfillable : []
  } catch {
    console.error('Failed to parse Claude response:', jsonText)
    throw createError({ statusCode: 502, statusMessage: 'Ongeldig JSON antwoord van Claude' })
  }

  return { suggestions, unfillable }
})
