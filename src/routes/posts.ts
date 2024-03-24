import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createInsertSchema } from 'drizzle-zod'
import { and, eq } from 'drizzle-orm'
import { generateId } from 'lucia'
import { HTTPException } from 'hono/http-exception'
import authMiddleware from '../middleware/auth'
import db from '../db'
import { postsTable, usersTable } from '../db/schema'

const postsRoutes = new Hono().basePath('/posts').use(authMiddleware())

postsRoutes
  .get('', async (c) => {
    const posts = await db.select().from(postsTable)
    return c.json({ data: posts })
  })

  .get('/user/:userId', async (c) => {
    const { userId } = c.req.param()

    const posts = await db.select().from(postsTable).where(eq(postsTable.userId, userId))

    if (!posts.length) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId))
      if (!user)
        throw new HTTPException(404, { message: 'User not found' })
    }

    return c.json({ data: posts })
  })

  .post('', zValidator('form', createInsertSchema(postsTable).pick({
    content: true,
  })), async (c) => {
    const { content } = c.req.valid('form')
    await db.insert(postsTable).values(
      { id: generateId(15), content, userId: c.get('user').id },
    )
    return c.json({ message: 'Post created' })
  })

  .delete('/:postId', async (c) => {
    const { postId } = c.req.param()
    const [post] = await db.delete(postsTable).where(
      and(eq(postsTable.id, postId), eq(postsTable.userId, c.get('user').id)),
    ).returning()
    if (!post) {
      // TODO: Check if user created that post

      throw new HTTPException(404, { message: 'Post not found' })
    }

    return c.json({ message: 'Post deleted' })
  })

export default postsRoutes
