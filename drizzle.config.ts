import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config();

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: safe for migrations; app validates env at runtime
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['auth', 'public'],
});
