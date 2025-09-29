import { defineConfig } from '@trigger.dev/sdk'

export default defineConfig({
  project: 'proj_hnmkxrzlqtgvuxhyczlc',
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 180,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
    },
  },
  dirs: ['./background'],
})
