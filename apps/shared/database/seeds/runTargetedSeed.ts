import { seeders } from "./seedUtils";

/**
 * Run a targeted seed operation without clearing existing data
 */
async function runTargetedSeed() {
  try {
    console.log("🌱 Running targeted seed operation...");

    // Create new users with unique timestamps
    const timestamp1 = Date.now();
    const timestamp2 = timestamp1 + 100; // Ensure they're different

    console.log(`Creating first user with timestamp: ${timestamp1}`);
    const user1 = await seeders.seedUser({
      name: `Example User ${timestamp1}`,
      email: `example-${timestamp1}@example.com`,
      password: "password123",
    });
    if (user1) {
      console.log(`Created user 1 with ID: ${user1.id}`);
    }

    console.log(`Creating second user with timestamp: ${timestamp2}`);
    const user2 = await seeders.seedUser({
      name: `Example User ${timestamp2}`,
      email: `example-${timestamp2}@example.com`,
      password: "password123",
    });
    if (user2) {
      console.log(`Created user 2 with ID: ${user2.id}`);
    }

    // Create new roles with unique timestamps
    console.log(`Creating first role with timestamp: ${timestamp1}`);
    const role1 = await seeders.seedRole({
      name: `example-role-${timestamp1}`,
      description: "An example role created by the targeted seeder",
    });
    if (role1) {
      console.log(`Created role 1 with ID: ${role1.id}`);
    }

    console.log(`Creating second role with timestamp: ${timestamp2}`);
    const role2 = await seeders.seedRole({
      name: `example-role-${timestamp2}`,
      description: "Another example role created by the targeted seeder",
    });
    if (role2) {
      console.log(`Created role 2 with ID: ${role2.id}`);
    }

    // Create new permissions with unique timestamps
    console.log(`Creating first permission with timestamp: ${timestamp1}`);
    const permission1 = await seeders.seedPermission({
      key: `example:read:${timestamp1}`,
      category: "example",
      action: `read-${timestamp1}`,
      description: "An example read permission created by the targeted seeder",
    });
    if (permission1) {
      console.log(`Created permission 1 with ID: ${permission1.id}`);
    }

    console.log(`Creating second permission with timestamp: ${timestamp2}`);
    const permission2 = await seeders.seedPermission({
      key: `example:write:${timestamp2}`,
      category: "example",
      action: `write-${timestamp2}`,
      description: "An example write permission created by the targeted seeder",
    });
    if (permission2) {
      console.log(`Created permission 2 with ID: ${permission2.id}`);
    }

    // Assign roles to users
    if (user1 && role1) {
      console.log(`Assigning role ${role1.id} to user ${user1.id}`);
      const userRole1 = await seeders.assignRoleToUser(user1.id, role1.id);
      console.log(`Role assignment 1 complete: ${JSON.stringify(userRole1)}`);
    }

    if (user2 && role2) {
      console.log(`Assigning role ${role2.id} to user ${user2.id}`);
      const userRole2 = await seeders.assignRoleToUser(user2.id, role2.id);
      console.log(`Role assignment 2 complete: ${JSON.stringify(userRole2)}`);
    }

    // Assign permissions to roles
    if (role1 && permission1) {
      console.log(`Assigning permission ${permission1.id} to role ${role1.id}`);
      const rolePermission1 = await seeders.assignPermissionToRole(
        role1.id,
        permission1.id
      );
      console.log(
        `Permission assignment 1 complete: ${JSON.stringify(rolePermission1)}`
      );
    }

    if (role2 && permission2) {
      console.log(`Assigning permission ${permission2.id} to role ${role2.id}`);
      const rolePermission2 = await seeders.assignPermissionToRole(
        role2.id,
        permission2.id
      );
      console.log(
        `Permission assignment 2 complete: ${JSON.stringify(rolePermission2)}`
      );
    }

    console.log("✅ Targeted seed operation completed successfully!");
  } catch (error) {
    console.error("❌ Error in targeted seed operation:", error);
  } finally {
    // Exit properly
    process.exit(0);
  }
}

// Use Bun's top-level await to ensure only one execution
if (import.meta.main) {
  await runTargetedSeed();
}

// Run the targeted seed operation
runTargetedSeed();

// Run the targeted seed operation
runTargetedSeed();
