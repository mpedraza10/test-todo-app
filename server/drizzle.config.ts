import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/lib/db/schema.ts",
    out: "./server/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
