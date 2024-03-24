import { createFactory } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import type { Session, User } from 'lucia'
import { HTTPException } from 'hono/http-exception'
import lucia from '../auth'

interface Env {
  Variables: {
    user: User
    session: Session
  }
}

const factory = createFactory<Env>()

export default function authMiddleware() {
  return factory.createMiddleware(async (c, next) => {
    const sessionId = getCookie(c, lucia.sessionCookieName)

    if (!sessionId)
      throw new HTTPException(401, { message: 'Not logged in' })

    const { session, user } = await lucia.validateSession(sessionId)
    if (!session) {
      c.header('Set-Cookie', lucia.createBlankSessionCookie().serialize(), {
        append: true,
      })
      throw new HTTPException(401, { message: 'Not logged in' })
    }
    else if (session.fresh) {
      c.header('Set-Cookie', lucia.createSessionCookie(session.id).serialize(), {
        append: true,
      })
    }

    c.set('user', user)
    c.set('session', session)
    return next()
  })
}
