import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getCountries = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Countries.findMany()
}

export const getProvinces = async (d1: D1Database, countryId?: number) => {
  const db = drizzle(d1, { schema })
  if (countryId) {
    return await db.query.Provinces.findMany({ where: eq(schema.Provinces.country_id, countryId) })
  }
  return await db.query.Provinces.findMany()
}

export const getDistricts = async (d1: D1Database, provinceId?: number) => {
  const db = drizzle(d1, { schema })
  if (provinceId) {
    return await db.query.Districts.findMany({ where: eq(schema.Districts.province_id, provinceId) })
  }
  return await db.query.Districts.findMany()
}

export const getSubdistricts = async (d1: D1Database, districtId?: number) => {
  const db = drizzle(d1, { schema })
  if (districtId) {
    return await db.query.Subdistricts.findMany({ where: eq(schema.Subdistricts.district_id, districtId) })
  }
  return await db.query.Subdistricts.findMany()
}
