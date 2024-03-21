import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import { ZodError } from 'zod'
import { HTTPException } from 'hono/http-exception'
import posts from './routes/posts'

const app = new Hono()

app.onError((err, c) => {
  if (err instanceof ZodError)
    return c.json({ message: 'Validation error', ...err.flatten() }, 400)

  if (err instanceof HTTPException)
    return err.getResponse()

  console.error(err)
  return c.json({ message: 'There was an error. Please try again later.' }, 500)
})

app.post(async (c, next) => {
  await next()

  const res = await c.res?.json()
  if (res?.error?.name === 'ZodError')
    throw new ZodError(res.error.issues)
})

app.route('/posts', posts)

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
