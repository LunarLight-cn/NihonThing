import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllTickets = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Tickets.findMany({
    with: { 
      client: { columns: { password_hash: false } }, 
      agent: { columns: { password_hash: false } } 
    }
  })
}

export const getTicketsByClientId = async (d1: D1Database, clientId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Tickets.findMany({
    where: eq(schema.Tickets.client_id, clientId),
    with: { agent: { columns: { password_hash: false } } }
  })
}

export const getTicketById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Tickets.findFirst({
    where: eq(schema.Tickets.id, id),
    with: { 
      client: { columns: { password_hash: false } }, 
      agent: { columns: { password_hash: false } } 
    }
  })
}

export const createTicket = async (d1: D1Database, clientId: number, data: Omit<typeof schema.Tickets.$inferInsert, 'client_id' | 'status'>) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Tickets).values({
    ...data,
    client_id: clientId,
    status: 'pending'
  }).returning()
}

export const updateTicket = async (d1: D1Database, id: number, data: Partial<typeof schema.Tickets.$inferInsert>) => {
  const db = drizzle(d1, { schema })
  return await db
    .update(schema.Tickets)
    .set({ ...data, udate: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.Tickets.id, id))
    .returning()
}
