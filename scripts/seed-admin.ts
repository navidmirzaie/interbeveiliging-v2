/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const value = trimmed.slice(eqIdx + 1).trim()
  if (key && !process.env[key]) process.env[key] = value
}

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

const ADMIN_EMAIL = 'admin@interbeveiliging.nl'
const ADMIN_PASSWORD = 'Admin1234!'
const ORG_NAME = 'InterBeveiliging BV'
const ORG_KVK = '12345678'

async function createAdminUser() {
  // 1. Create Supabase auth user via admin API (skip if already exists)
  console.log('Creating Supabase auth user...')
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    }),
  })

  const authData = await authRes.json()
  let userId: string

  if (!authRes.ok) {
    if (authData.code === 'email_exists' || authData.msg?.includes('already')) {
      // Fetch existing user id
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, {
        headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY },
      })
      const listData = await listRes.json()
      userId = listData.users?.[0]?.id ?? 'abcbbd94-7726-4b1b-ba19-6b6645ef5e8a'
      console.log(`Auth user already exists: ${userId}`)
    } else {
      console.error('Auth user creation failed:', authData)
      process.exit(1)
    }
  } else {
    userId = authData.id
    console.log(`Auth user created: ${userId}`)
  }

  // 2. Insert org + profile via Drizzle
  const { drizzle } = await import('drizzle-orm/postgres-js')
  const postgres = (await import('postgres')).default
  const { organisations, profiles } = await import('../drizzle/schema.ts')

  const client = postgres(DATABASE_URL)
  const db = drizzle(client)

  console.log('Inserting organisation...')
  const [org] = await db.insert(organisations).values({
    name: ORG_NAME,
    kvkNumber: ORG_KVK,
  }).returning()

  console.log(`Organisation created: ${org!.id}`)

  console.log('Inserting admin profile...')
  await db.insert(profiles).values({
    id: userId,
    email: ADMIN_EMAIL,
    firstName: 'Admin',
    lastName: 'Gebruiker',
    role: 'admin',
    organisationId: org!.id,
  })

  await client.end()

  console.log('\n✓ Admin user created successfully!')
  console.log(`  Email:    ${ADMIN_EMAIL}`)
  console.log(`  Password: ${ADMIN_PASSWORD}`)
  console.log(`  Org:      ${ORG_NAME} (KvK: ${ORG_KVK})`)
  console.log('\nYou can change the org name and KvK number in the Settings page after logging in.')
}

createAdminUser().catch(console.error)
