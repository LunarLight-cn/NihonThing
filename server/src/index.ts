import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'

type Bindings = {
  nihonthing_db: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/users', async (c) => {
  const db = drizzle(c.env.nihonthing_db, { schema })

  const allUsers = await db.query.Users.findMany()
  return c.json(allUsers)
})

app.get('/create-test-user', async (c) => {
  const db = drizzle(c.env.nihonthing_db, { schema })

  await db.insert(schema.Users).values({
    username: "lunar_tester",
    email: "lunar@nihonthing.com",
    password_hash: "secret_1234",
    role: "admin"
  })
  return c.text("Test user created! Go to /users to see the result.")
})

export default app
