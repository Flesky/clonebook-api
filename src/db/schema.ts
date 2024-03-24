import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Authentication data

export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey(),
  hashedPassword: text('hashed_password').notNull(),
})

export const sessionsTable = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
})

// App tables

export const profilesTable = sqliteTable('profiles', {
  userId: text('user_id').primaryKey().references(() => usersTable.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  bio: text('bio').default('Cookbook'),
  avatarUrl: text('avatar_url'),
})

export const postsTable = sqliteTable('posts', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const commentsTable = sqliteTable('comments', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  postId: text('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})
