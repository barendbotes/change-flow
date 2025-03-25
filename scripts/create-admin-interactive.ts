import "dotenv/config";
import { db } from "@/lib/db";
import { users, roles, groups, userRoles, userGroups } from "@/schemas/schema";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log("🚀 Starting admin user creation...");

  try {
    // Prompt for user details
    const name =
      (await question("Enter admin name (default: Admin User): ")) ||
      "Admin User";
    const email =
      (await question("Enter admin email (default: admin@example.com): ")) ||
      "admin@example.com";
    const password =
      (await question("Enter admin password (default: Password123!): ")) ||
      "Password123!";

    if (!email.includes("@")) {
      console.error("❌ Please provide a valid email address");
      return;
    }

    if (password.length < 8) {
      console.error("❌ Password must be at least 8 characters long");
      return;
    }

    // Check if roles exist, create them if not
    console.log("👥 Checking roles...");
    const existingRoles = await db.select().from(roles);

    if (existingRoles.length === 0) {
      console.log("👥 Creating roles...");
      await db.insert(roles).values([
        {
          id: uuidv4(),
          name: "admin",
          description: "Administrator with full access",
        },
        {
          id: uuidv4(),
          name: "manager",
          description: "Manager with approval permissions",
        },
        {
          id: uuidv4(),
          name: "user",
          description: "Regular user",
        },
      ]);
    }

    // Check if groups exist, create them if not
    console.log("👥 Checking groups...");
    const existingGroups = await db.select().from(groups);

    if (existingGroups.length === 0) {
      console.log("👥 Creating groups...");
      await db.insert(groups).values([
        {
          id: uuidv4(),
          name: "IT",
          description: "IT department with access to change requests",
        },
        {
          id: uuidv4(),
          name: "Corporate",
          description: "Corporate department with access to asset requests",
        },
      ]);
    }

    // Get the admin role
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, "admin"),
    });

    if (!adminRole) {
      console.error("❌ Admin role not found");
      return;
    }

    // Check if the admin user already exists
    console.log("👤 Checking if admin user exists...");
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingAdmin) {
      console.log("👤 Admin user already exists");
      return;
    }

    // Create the admin user
    console.log("👤 Creating admin user...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
    });

    // Assign the admin role
    console.log("🔑 Assigning admin role...");
    await db.insert(userRoles).values({
      userId,
      roleId: adminRole.id,
    });

    // Assign all groups
    console.log("👥 Assigning groups...");
    const allGroups = await db.select().from(groups);

    for (const group of allGroups) {
      await db.insert(userGroups).values({
        userId,
        groupId: group.id,
      });
    }

    console.log("✅ Admin user created successfully!");
    console.log(`
    Name: ${name}
    Email: ${email}
    Password: ${password}
    `);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
