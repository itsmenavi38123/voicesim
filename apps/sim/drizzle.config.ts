import type { Config } from 'drizzle-kit'
import { env } from './lib/env'
import 'dotenv/config'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config
