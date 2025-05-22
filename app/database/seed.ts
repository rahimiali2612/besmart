import { db } from "./db";
import { users } from "./schema";
import fs from "fs";
import path from "path";

async function seed() {
  console.log("Seeding database...");

  try {
    // Read users from JSON file
    const userData = JSON.parse(
      fs.readFileSync(path.join(import.meta.dir, "../json/users.json"), "utf-8")
    );

    // Add timestamps to the user data
    const usersWithTimestamps = userData.map((user: any) => ({
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert users into database
    // In production we would hash passwords here
    await db.insert(users).values(usersWithTimestamps).onConflictDoNothing();

    console.log("Seeded database successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
