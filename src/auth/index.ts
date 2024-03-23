import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle'
import { Lucia } from 'lucia'
import db from '../db'
import { sessions, users } from '../db/schema'

const adapter = new DrizzleSQLiteAdapter(db, sessions, users)

const lucia = new Lucia(adapter)

export default lucia

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
  }
}
