import type { Config } from 'drizzle-kit'
import { env } from './lib/env'
import 'dotenv/config'

console.log('env.DATABASE_URL:', env.DATABASE_URL ?? '(undefined)')
console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL ?? '(undefined)')

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config
