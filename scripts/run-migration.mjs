import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read DATABASE_URL from .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const databaseUrl = envContent
  .split("\n")
  .find((line) => line.startsWith("DATABASE_URL="))
  ?.split("=")[1]
  ?.trim();

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = postgres(databaseUrl, { 
  max: 1,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log("📦 Connecting to database...");

    // Read migration file
    const migrationPath = resolve(__dirname, "../server/migrations/0000_tense_malice.sql");
    const migrationContent = readFileSync(migrationPath, "utf-8");

    // Split statements
    const statements = migrationContent
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📝 Found ${statements.length} statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        await sql.unsafe(statements[i]);
        console.log(`✅ Success\n`);
      } catch (err) {
        if (err.message?.includes("already exists")) {
          console.log(`⚠️  Already exists, skipping\n`);
        } else {
          console.error(`❌ Error: ${err.message}\n`);
          throw err;
        }
      }
    }

    console.log("🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
