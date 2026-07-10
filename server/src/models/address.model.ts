import { drizzle } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAddresses = async (d1: D1Database, userId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Addresses.findMany({
    where: eq(schema.Addresses.user_id, userId)
  })
}

export const createAddress = async (d1: D1Database, userId: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db
    .insert(schema.Addresses)
    .values({
      user_id: userId,
      title: data.title,
      fullname: data.fullname,
      surname: data.surname,
      tel: data.tel,
      address_line: data.address_line,
      subdistrict_id: data.subdistrict_id,
      tag: data.tag
    })
    .returning()
}

export const deleteAddress = async (d1: D1Database, userId: number, addressId: number) => {
  const db = drizzle(d1, { schema })
  await db.delete(schema.Addresses).where(and(eq(schema.Addresses.id, addressId), eq(schema.Addresses.user_id, userId)))
}

export const updateAddress = async (d1: D1Database, userId: number, addressId: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db
    .update(schema.Addresses)
    .set(data)
    .where(and(eq(schema.Addresses.id, addressId), eq(schema.Addresses.user_id, userId)))
    .returning()
}
