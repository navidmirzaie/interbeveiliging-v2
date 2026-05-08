import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { profiles, organisations } from '../../../../../drizzle/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requirePlannerRole(event)

  const user = await serverSupabaseUser(event)
  const db = useDrizzle()
  const orgId = await getOrgId(user!.id, db)

  const body = await readBody(event)
  const { firstName, lastName, email, phone, employeeNumber, role, contractHoursPerPeriod, password, availability } = body

  if (!firstName?.trim()) throw createError({ statusCode: 400, statusMessage: 'Voornaam is verplicht' })
  if (!lastName?.trim()) throw createError({ statusCode: 400, statusMessage: 'Achternaam is verplicht' })
  if (!email?.trim()) throw createError({ statusCode: 400, statusMessage: 'E-mailadres is verplicht' })
  if (!password || password.length < 8) throw createError({ statusCode: 400, statusMessage: 'Wachtwoord moet minimaal 8 tekens bevatten' })

  const config = useRuntimeConfig()

  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    config.supabaseServiceRoleKey,
  )

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already')) throw createError({ statusCode: 409, statusMessage: 'E-mailadres is al in gebruik' })
    throw createError({ statusCode: 500, statusMessage: 'Kon gebruiker niet aanmaken' })
  }

  const authUserId = authData.user!.id

  const [profile] = await db.insert(profiles).values({
    id: authUserId,
    organisationId: orgId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phone: phone ?? null,
    employeeNumber: employeeNumber ?? null,
    role: role ?? 'employee',
    contractHoursPerPeriod: contractHoursPerPeriod ?? 144,
    mustChangePassword: true,
  }).returning()

  if (Array.isArray(availability) && availability.length === 7) {
    await employeeRepository.upsertAvailability(
      db,
      authUserId,
      availability.map((maxHours: number, dayOfWeek: number) => ({ dayOfWeek, maxHours })),
    )
  }

  const [orgRow] = await db
    .select({ name: organisations.name, logoUrl: organisations.logoUrl })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1)

  let emailError: string | null = null
  try {
    const resend = useResend()
    const { error: sendError } = await resend.emails.send({
      from: config.resendFromAddress as string,
      to: email.trim(),
      subject: `Welkom bij ${orgRow?.name ?? 'InterBeveiliging'} — uw inloggegevens`,
      html: welcomeEmail({
        orgName: orgRow?.name ?? 'InterBeveiliging',
        logoUrl: orgRow?.logoUrl ?? null,
        firstName: firstName.trim(),
        email: email.trim(),
        password,
        platformUrl: config.platformUrl as string,
      }),
    })
    if (sendError) {
      console.error('[welcome-email] Resend error:', sendError)
      emailError = sendError.message
    }
  } catch (err) {
    console.error('[welcome-email] Unexpected error:', err)
    emailError = err instanceof Error ? err.message : 'Onbekende fout'
  }

  return { ...profile, emailError }
})
