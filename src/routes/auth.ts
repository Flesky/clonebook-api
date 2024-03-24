import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Argon2id } from 'oslo/password'
import { SqliteError } from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { deleteCookie } from 'hono/cookie'
import db from '../db'
import { profilesTable, usersTable } from '../db/schema'
import lucia from '../auth'
import authMiddleware from '../middleware/auth'

const schema = z.object({
  id: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
})

const authRoutes = new Hono()

authRoutes
  .post('/signup', zValidator('form', schema), async (c) => {
    const { id, password } = c.req.valid('form')
    const hashedPassword = await new Argon2id().hash(password)

    try {
      await db.insert(usersTable).values({ id, hashedPassword })
      await db.insert(profilesTable).values({
        userId: id,
        displayName: id,
      })

      const session = await lucia.createSession(id, {})
      const cookie = lucia.createSessionCookie(session.id)
      c.header('Set-Cookie', cookie.serialize())
      return c.json({ message: `Successfully signed up as ${id}` })
    }
    catch (err) {
      if (err instanceof SqliteError && err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY')
        return c.json({ message: `Username "${id}" is already taken` }, 400)

      throw err
    }
  })

  .post('/login', zValidator('form', schema), async (c) => {
    const { id, password } = c.req.valid('form')

    const query = await db.select().from(usersTable).where(eq(usersTable.id, id))
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

  .post('/logout', authMiddleware(), async (c) => {
    await lucia.invalidateSession(c.get('session').id)

    deleteCookie(c, 'auth_session')
    return c.json({ message: 'Successfully logged out' })
  })

export default authRoutes
