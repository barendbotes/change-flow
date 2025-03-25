"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { users, userRoles, userGroups } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { hash } from "bcryptjs";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  groupIds: z.array(z.string()).optional(),
  approverId: z.string().optional(),
  isTwoFactorEnabled: z.boolean().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
});

export const createUser = async (data: z.infer<typeof userSchema>) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  // Validate input data
  const validatedData = userSchema.parse(data);

  // Check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, validatedData.email),
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Hash password if provided
  const hashedPassword = validatedData.password
    ? await hash(validatedData.password, 12)
    : null;

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      isTwoFactorEnabled: validatedData.isTwoFactorEnabled || false,
      approverId: validatedData.approverId || null,
    })
    .returning();

  // Create user role
  await db.insert(userRoles).values({
    userId: newUser.id,
    roleId: validatedData.roleId,
  });

  // Create user groups if provided
  if (validatedData.groupIds?.length) {
    await db.insert(userGroups).values(
      validatedData.groupIds.map((groupId) => ({
        userId: newUser.id,
        groupId,
      }))
    );
  }

  return newUser;
};

export const updateUser = async (
  userId: string,
  data: z.infer<typeof userSchema>
) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const isUserAdmin = await isAdmin();
  if (!isUserAdmin && user.id !== userId) throw new Error("Unauthorized");

  // Validate input data
  const validatedData = userSchema.parse(data);

  // Check if email already exists for other users
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, validatedData.email),
  });

  if (existingUser && existingUser.id !== userId) {
    throw new Error("Email already exists");
  }

  // Hash password if provided
  const hashedPassword = validatedData.password
    ? await hash(validatedData.password, 12)
    : undefined;

  // Update user
  const [updatedUser] = await db
    .update(users)
    .set({
      name: validatedData.name,
      email: validatedData.email,
      ...(hashedPassword && { password: hashedPassword }),
      isTwoFactorEnabled: validatedData.isTwoFactorEnabled,
      approverId: validatedData.approverId || null,
    })
    .where(eq(users.id, userId))
    .returning();

  // Update user role
  await db
    .update(userRoles)
    .set({ roleId: validatedData.roleId })
    .where(eq(userRoles.userId, userId));

  // Update user groups
  if (validatedData.groupIds) {
    // Delete existing groups
    await db.delete(userGroups).where(eq(userGroups.userId, userId));

    // Add new groups
    if (validatedData.groupIds.length > 0) {
      await db.insert(userGroups).values(
        validatedData.groupIds.map((groupId) => ({
          userId,
          groupId,
        }))
      );
    }
  }

  return updatedUser;
};

export const deleteUser = async (userId: string) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  // Delete user roles
  await db.delete(userRoles).where(eq(userRoles.userId, userId));

  // Delete user groups
  await db.delete(userGroups).where(eq(userGroups.userId, userId));

  // Delete user
  await db.delete(users).where(eq(users.id, userId));
};
