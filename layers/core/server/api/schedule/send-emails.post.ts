import { toZonedTime, format } from 'date-fns-tz'
import { eq, isNull, and } from 'drizzle-orm'
import { profiles, organisationSettings, organisations, shifts } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const { cronSecret } = useRuntimeConfig()
  const secret = getHeader(event, 'x-cron-secret')
  if (secret !== cronSecret) throw createError({ statusCode: 401 })

  const nowAmsterdam = toZonedTime(new Date(), 'Europe/Amsterdam')
  const currentTime = format(nowAmsterdam, 'HH:mm')

  const db = useDrizzle()
  const resend = useResend()
  const { resendFromAddress } = useRuntimeConfig()

  const allOrgs = await db
    .select({
      orgId: organisations.id,
      orgName: organisations.name,
      logoUrl: organisations.logoUrl,
      emailSendTime: organisationSettings.emailSendTime,
      emailSendDay: organisationSettings.emailSendDay,
    })
    .from(organisations)
    .leftJoin(organisationSettings, eq(organisations.id, organisationSettings.organisationId))

  const sentCount = { guards: 0, planners: 0 }

  for (const org of allOrgs) {
    const sendTime = (org.emailSendTime ?? '08:00').slice(0, 5)
    if (sendTime !== currentTime) continue

    const sendDay = org.emailSendDay ?? 1
    const todayDow = nowAmsterdam.getDay() === 0 ? 7 : nowAmsterdam.getDay()
    if (todayDow !== sendDay) continue

    const monday = new Date(nowAmsterdam)
    monday.setDate(monday.getDate() - monday.getDay() + 1 + 7)
    const weekStart = monday.toISOString().slice(0, 10)
    const weekEnd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6).toISOString().slice(0, 10)

    const weekYear = monday.getFullYear()
    const weekNum = Math.ceil((((monday.getTime() - new Date(weekYear, 0, 1).getTime()) / 86400000) + new Date(weekYear, 0, 1).getDay() + 1) / 7)
    const weekLabel = `week ${weekNum}`

    const guards = await db
      .select({ id: profiles.id, firstName: profiles.firstName, lastName: profiles.lastName, email: profiles.email })
      .from(profiles)
      .where(and(eq(profiles.organisationId, org.orgId), eq(profiles.role, 'employee'), isNull(profiles.deletedAt)))

    const shiftRows = await db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.organisationId, org.orgId),
        eq(shifts.weekPublished, true),
      ))

    for (const guard of guards) {
      const guardShifts = shiftRows
        .filter(s => s.profileId === guard.id && s.date >= weekStart && s.date <= weekEnd)
        .map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime, locationLabel: s.locationLabel }))

      const html = guardScheduleEmail({
        orgName: org.orgName,
        logoUrl: org.logoUrl,
        weekLabel,
        shifts: guardShifts,
      })

      await resend.emails.send({
        from: resendFromAddress as string,
        to: guard.email,
        subject: `Uw rooster — ${weekLabel} | ${org.orgName}`,
        html,
      })
      sentCount.guards++
    }

    const guardSummaries = guards.map(g => ({
      name: `${g.firstName} ${g.lastName}`,
      shifts: shiftRows
        .filter(s => s.profileId === g.id && s.date >= weekStart && s.date <= weekEnd)
        .map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime, locationLabel: s.locationLabel })),
    }))

    const overviewHtml = plannerOverviewEmail({
      orgName: org.orgName,
      logoUrl: org.logoUrl,
      weekLabel,
      guards: guardSummaries,
    })

    const plannerProfiles = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(and(eq(profiles.organisationId, org.orgId), isNull(profiles.deletedAt)))

    for (const planner of plannerProfiles) {
      await resend.emails.send({
        from: resendFromAddress as string,
        to: planner.email,
        subject: `Roosteroverzicht — ${weekLabel} | ${org.orgName}`,
        html: overviewHtml,
      })
      sentCount.planners++
    }
  }

  return { ok: true, sent: sentCount }
})
