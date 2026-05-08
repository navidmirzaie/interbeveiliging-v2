import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../../../drizzle/schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDrizzle() {
  if (!_db) {
    const config = useRuntimeConfig()
    const client = postgres(process.env.DATABASE_URL!, { prepare: false })
    _db = drizzle(client, { schema })
  }
  return _db
}

export type DrizzleDB = ReturnType<typeof useDrizzle>
