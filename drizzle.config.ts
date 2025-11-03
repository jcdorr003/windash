import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './app/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://windash:windash@localhost:5432/windash',
  },
});
