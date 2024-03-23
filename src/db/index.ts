import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

const sql = new Database('sqlite.db')

const db = drizzle(sql, { schema })

export default db
