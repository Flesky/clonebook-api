import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createInsertSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { v4 } from 'uuid'
import { db } from '../db'
import { posts } from '../db/schema'

const post = new Hono()

post
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
      const query = await db.insert(posts).values({ ...body, id: v4() }).returning()
      const result = query[0]

      return c.json({ message: 'Post created', result })
    },
  )

  .delete('/:id', async (c) => {
    const { id } = c.req.param()
    const query = await db.delete(posts).where(eq(posts.id, id)).returning()
    const result = query[0]
    if (!result)
      return c.notFound()

    return c.json({ message: 'Post deleted', result })
  })

export default post
