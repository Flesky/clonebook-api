import * as process from 'node:process'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './index'

function main() {
  try {
    migrate(db, {
      migrationsFolder: 'src/db/migrations',
    })
  }
  catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
