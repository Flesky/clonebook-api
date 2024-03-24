import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import db from '../db'
import { profilesTable } from '../db/schema'
import authMiddleware from '../middleware/auth'

const usersRoutes = new Hono()

usersRoutes
  .get('/me', authMiddleware(), async (c) => {
    const user = c.get('user')
    const query = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id))
    const profile = query[0]
    return c.json(profile)
  })

export default usersRoutes
