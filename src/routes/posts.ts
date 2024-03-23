import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { zValidator } from '@hono/zod-validator'
import { createInsertSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { generateId } from 'lucia'
import { HTTPException } from 'hono/http-exception'
import db from '../db'
import { posts } from '../db/schema'

const post = new Hono()

post
  .use(async (c, next) => {
    const sessionId = getCookie(c, 'auth_session')
    if (!sessionId)
      throw new HTTPException(401, { message: 'Not logged in' })
    await next()
  })
  .get(async (c) => {
    const result = await db.select().from(posts)
    return c.json(result)
  })

  .post(
    zValidator('form', createInsertSchema(posts).pick({
      content: true,
    })),
    async (c) => {
      const body = c.req.valid('form')
      const query = await db.insert(posts).values({ ...body, id: generateId(15) }).returning()
      const post = query[0]
      return c.json({ message: 'Post created', result: post })
    },
  )

  .delete('/:id', async (c) => {
    const { id } = c.req.param()
    const query = await db.delete(posts).where(eq(posts.id, id)).returning()
    const post = query[0]
    if (!post)
      return c.notFound()

    return c.json({ message: 'Post deleted', result: post })
  })

export default post
