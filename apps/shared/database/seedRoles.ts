import { db } from "./db";
import { roles, userRoles, users } from "./schema";
import { AuthService } from "../../company_services/service/auth/authService";

async function seedRoles() {
  console.log("🌱 Seeding roles...");

  // Check if roles already exist
  const existingRoles = await db.select({ count: roles.id }).from(roles);
  if (existingRoles[0].count > 0) {
    console.log("Roles already exist, skipping role seed");
    return;
  }

  // Create default roles
  const defaultRoles = [
    {
      name: "admin",
      description: "Administrator with full access",
    },
    {
      name: "supervisor",
      description: "Team supervisor with additional permissions",
    },
    {
      name: "staff",
      description: "Regular staff member",
    },
  ];

  // Insert roles
  await db.insert(roles).values(defaultRoles);
  console.log("Default roles created!");
}

async function seedAdminUser() {
  console.log("🌱 Seeding admin user...");

  // Check if admin user exists
  const adminExists = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@example.com"));

  if (adminExists.length > 0) {
    console.log("Admin user already exists, skipping admin seed");
    return adminExists[0].id;
  }

  // Create admin user
  const hashedPassword = await AuthService.hashPassword("adminpassword");
  const [admin] = await db
    .insert(users)
    .values({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
    })
    .returning();

  console.log("Admin user created!");
  return admin.id;
}

async function assignRolesToAdmin(adminId: number) {
  console.log("🌱 Assigning roles to admin user...");

  // Get role IDs for all roles
  const allRoles = await db.select().from(roles);

  // Assign all roles to admin
  for (const role of allRoles) {
    const roleAssignmentExists = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, adminId), eq(userRoles.roleId, role.id)));

    if (roleAssignmentExists.length === 0) {
      await db.insert(userRoles).values({
        userId: adminId,
        roleId: role.id,
      });
      console.log(`Assigned role ${role.name} to admin`);
    }
  }
}

// Run the seed
async function seed() {
  console.log("Starting seed process...");
  await seedRoles();
  const adminId = await seedAdminUser();
  await assignRolesToAdmin(adminId);
  console.log("Seed completed successfully!");
}

// Import missing dependencies
import { eq, and } from "drizzle-orm";

// Run seed
seed()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
