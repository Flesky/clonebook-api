import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { createInsertSchema } from 'drizzle-zod'
import { generateId } from 'lucia'
import authMiddleware from '../middleware/auth'
import db from '../db'
import { commentsTable, postsTable } from '../db/schema'

const commentsRoutes = new Hono().basePath('/posts/:postId/comments').use(authMiddleware())

commentsRoutes
  .get('', async (c) => {
    const { postId } = c.req.param()

    const comments = await db.select().from(commentsTable).where(eq(commentsTable.postId, postId))

    if (!comments.length) {
      const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId))
      if (!post)
        throw new HTTPException(404, { message: 'Post not found' })
    }

    return c.json({ data: comments })
  })

  .post('', zValidator('form', createInsertSchema(commentsTable).pick({
    content: true,
  })), async (c) => {
    // Type inference not working
    const { postId }: { postId: string } = c.req.param()
    const { content } = c.req.valid('form')
    await db.insert(commentsTable).values(
      { id: generateId(15), content, postId, userId: c.get('user').id },
    )
    return c.json({ message: 'Comment sent' })
  })

  .delete('/:commentId', async (c) => {
    const { postId, commentId } = c.req.param()
    const [comment] = await db.delete(commentsTable).where(and(
      eq(commentsTable.postId, postId),
      and(eq(commentsTable.id, commentId), eq(commentsTable.userId, c.get('user').id)),
    )).returning()
    if (!comment)
      throw new HTTPException(404, { message: 'Comment not found' })

    return c.json({ message: 'Comment deleted' })
  })

export default commentsRoutes
