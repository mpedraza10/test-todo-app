import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

async function main() {
  console.log("Connecting to database...");
  
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), "server/migrations/0000_tense_malice.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    // Split by statement breakpoint comments and filter out empty statements
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Applying ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      try {
        await sql.unsafe(statement);
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (err: any) {
        // Check if error is "already exists" which we can ignore
        if (err.message.includes("already exists")) {
          console.log(`⚠ Statement ${i + 1} skipped (already exists)`);
        } else {
          throw err;
        }
      }
    }

    console.log("\n✓ All migrations applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    throw err;
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
