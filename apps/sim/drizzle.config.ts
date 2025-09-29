import type { Config } from 'drizzle-kit'
import { env } from './lib/env'

console.log(process.env.DATABASE_URL, '<<<<<<<<<<<<')
export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config
