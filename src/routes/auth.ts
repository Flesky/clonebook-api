import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Argon2id } from 'oslo/password'
import { generateId } from 'lucia'
import { SqliteError } from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { deleteCookie, getCookie } from 'hono/cookie'
import db from '../db'
import { profiles, users } from '../db/schema'
import lucia from '../auth'

const schema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
})

const auth = new Hono()

auth
  .post('/signup', zValidator('form', schema), async (c) => {
    const { username, password } = c.req.valid('form')
    const id = generateId(15)
    const hashedPassword = await new Argon2id().hash(password)

    try {
      await db.insert(users).values({ id, username, hashedPassword })
      await db.insert(profiles).values({
        userId: id,
        displayName: username,
      })

      const session = await lucia.createSession(id, {})
      const cookie = lucia.createSessionCookie(session.id)
      c.header('Set-Cookie', cookie.serialize())
      return c.json({ message: 'Successfully signed up' })
    }
    catch (err) {
      if (err instanceof SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE')
        return c.json({ message: 'Username is already taken' }, 400)

      throw err
    }
  })

  .post('/login', zValidator('form', schema), async (c) => {
    const { username, password } = c.req.valid('form')

    const query = await db.select().from(users).where(eq(users.username, username))
    const user = query[0]
    if (!user)
      return c.json({ message: 'Wrong username or password' }, 400)

    if (!await new Argon2id().verify(user.hashedPassword, password))
      return c.json({ message: 'Wrong username or password' }, 400)

    const session = await lucia.createSession(user.id, {})
    const cookie = lucia.createSessionCookie(session.id)
    c.header('Set-Cookie', cookie.serialize())
    return c.json({ message: 'Successfully logged in' })
  })

  .post('/logout', async (c) => {
    const sessionId = getCookie(c, 'auth_session')
    if (!sessionId)
      return c.json({ message: 'Not logged in' }, 401)

    await lucia.invalidateSession(sessionId)

    deleteCookie(c, 'auth_session')
    return c.json({ message: 'Successfully logged out' })
  })

export default auth
