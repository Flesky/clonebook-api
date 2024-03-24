import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle'
import { Lucia } from 'lucia'
import db from '../db'
import { sessionsTable, usersTable } from '../db/schema'

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      username: string
    }
  }
}

const adapter = new DrizzleSQLiteAdapter(db, sessionsTable, usersTable)

const lucia = new Lucia(adapter, {
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
    }
  },
})

export default lucia
