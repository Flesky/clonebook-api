import * as process from 'node:process'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import db from './index'

function main() {
  try {
    migrate(db, {
      migrationsFolder: 'src/db/migrations',
    })
  }
  catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
