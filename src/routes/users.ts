import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import lucia from '../auth'
import db from '../db'
import { profiles } from '../db/schema'

const users = new Hono()

users
  .get('/me', async (c) => {
    const sessionId = getCookie(c, 'auth_session')
    if (!sessionId)
      return c.json({ message: 'Not logged in' }, 401)

    const { session, user } = await lucia.validateSession(sessionId)
    if (!session) {
      return c.json({ message: 'Not logged in' }, 401)
    }
    else if (session.fresh) {
      const cookie = lucia.createSessionCookie(session.id)
      c.header('Set-Cookie', cookie.serialize())
    }

    const query = await db.select().from(profiles).where(eq(profiles.userId, user.id))
    const profile = query[0]
    return c.json(profile)
  })

export default users
