import { serverSupabaseUser } from '#supabase/server'
import { eq } from 'drizzle-orm'
import { organisations, organisationSettings } from '../../../../../drizzle/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401 })

  await requireAdminRole(event)

  const db = useDrizzle()
  const orgId = await getOrgId(user.id, db)

  const body = await readBody(event)
  const {
    name,
    primaryColour,
    dashboardTitle,
    emailSendTime,
    emailSendDay,
  } = body ?? {}

  if (name !== undefined) {
    if (!name.trim()) throw createError({ statusCode: 400, statusMessage: 'Naam is verplicht' })
    await db
      .update(organisations)
      .set({
        name: name.trim(),
        primaryColour,
        dashboardTitle,
      })
      .where(eq(organisations.id, orgId))
  }

  if (emailSendTime !== undefined || emailSendDay !== undefined) {
    await db
      .insert(organisationSettings)
      .values({ organisationId: orgId, emailSendTime, emailSendDay })
      .onConflictDoUpdate({
        target: organisationSettings.organisationId,
        set: {
          ...(emailSendTime !== undefined && { emailSendTime }),
          ...(emailSendDay !== undefined && { emailSendDay }),
          updatedAt: new Date(),
        },
      })
  }

  return { ok: true }
})
