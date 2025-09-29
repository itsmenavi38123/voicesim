// apps/sim/drizzle.env.ts
import 'dotenv/config'
import { env } from './lib/env'

export const DATABASE_URL = process.env.DATABASE_URL ?? env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

export { DATABASE_URL as default }