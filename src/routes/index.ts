import { Hono } from 'hono'
import auth from './auth'
import posts from './posts'
import users from './users'
import comments from './comments'

const routes = new Hono()

// Base paths are specified in their respective files
routes.route('', auth)
routes.route('', users)
routes.route('', posts)
routes.route('', comments)

export default routes
