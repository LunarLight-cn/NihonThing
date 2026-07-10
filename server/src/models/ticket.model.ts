import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllTickets = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Tickets.findMany({
    with: { client: true, agent: true }
  })
}

export const getTicketsByClientId = async (d1: D1Database, clientId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Tickets.findMany({
    where: eq(schema.Tickets.client_id, clientId),
    with: { agent: true }
  })
}

export const getTicketById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Tickets.findFirst({
    where: eq(schema.Tickets.id, id),
    with: { client: true, agent: true }
  })
}

export const createTicket = async (d1: D1Database, clientId: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Tickets).values({
    ...data,
    client_id: clientId,
    status: 'pending'
  }).returning()
}

export const updateTicket = async (d1: D1Database, id: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db
    .update(schema.Tickets)
    .set(data)
    .where(eq(schema.Tickets.id, id))
    .returning()
}
