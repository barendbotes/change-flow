import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./schemas/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    ssl: true,
    url: process.env.DATABASE_URL!,
  },
});
