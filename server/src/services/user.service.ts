import { getAllUsers } from '../models/user.model'

export const fetchUsersList = async (d1: D1Database, role?: string) => {
  const users = await getAllUsers(d1, role)
  return users
}