import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import { ZodError } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { showRoutes } from 'hono/dev'
import routes from './routes'

const app = new Hono({ strict: false })

app.onError((err, c) => {
  if (err instanceof ZodError)
    return c.json({ message: 'Validation error', ...err.flatten() }, 400)

  if (err instanceof HTTPException)
    return c.json({ message: err.message }, err.status)

  console.error(err)
  return c.json({ message: 'Server error. Please try again later.' }, 500)
})

app.on(['POST', 'PUT'], '*', async (c, next) => {
  await next()

  const res = await c.res?.json()
  if (res.error?.name === 'ZodError')
    throw new ZodError(res.error.issues)
})

app.route('', routes)

const port = 3000

console.log(`Server is running on port ${port}. Available routes:`)
showRoutes(app)

serve({
  fetch: app.fetch,
  port,
})
