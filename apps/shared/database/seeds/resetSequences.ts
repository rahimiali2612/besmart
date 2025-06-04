import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Reset sequences for all tables to the maximum ID value + 1
 * This ensures that auto-increment works correctly after seeding with fixed IDs
 */
async function resetSequences() {
  console.log("🔄 Resetting database sequences...");

  try {
    // List of tables with ID sequences to reset
    const tables = ["users", "roles", "permissions"];

    // First, let's check the current max IDs
    for (const table of tables) {
      const result = await db.execute(sql.raw(`SELECT MAX(id) FROM ${table}`));
      console.log(`Table ${table} max ID:`, result[0]?.max || 0);
    }

    // Reset all sequences
    for (const table of tables) {
      console.log(`Resetting sequence for table: ${table}`);

      // This query will:
      // 1. Get the sequence name for the table's ID column
      // 2. Set the sequence's next value to MAX(id) + 1
      // 3. The false parameter means the sequence hasn't been called yet
      const resetSql = sql.raw(`
        SELECT setval(pg_get_serial_sequence('${table}', 'id'), 
                     COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, 
                     false);
      `);

      // Execute the SQL
      const result = await db.execute(resetSql);
      console.log(
        `Sequence for ${table} reset to:`,
        result[0]?.setval || "unknown"
      );
    }

    console.log("✅ All sequences reset successfully!");
  } catch (error) {
    console.error("❌ Error resetting sequences:", error);
    throw error;
  }
}

// Run the reset function
await resetSequences()
  .then(() => {
    console.log("Sequence reset completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to reset sequences:", error);
    process.exit(1);
  });

// Run the reset function
await resetSequences()
  .then(() => {
    console.log("Sequence reset completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to reset sequences:", error);
    process.exit(1);
  });
