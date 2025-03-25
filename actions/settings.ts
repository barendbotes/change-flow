"use server";

import { getUserByEmail, getUserById } from "@/data/user";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateVerificationToken } from "@/lib/tokens";
import { SettingsSchema } from "@/schemas";
import { z } from "zod";

import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/mail";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user || !user.id) {
    return { error: "Unauthorized" };
  }

  const databaseUser = await getUserById(user.id);

  if (!databaseUser) {
    return { error: "Unauthorized" };
  }

  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);
    if (existingUser && existingUser.id !== user.id) {
      return { error: "Invalid email" };
    }
    const [verificationToken] = await generateVerificationToken(values.email);

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return { success: "Verification email sent" };
  }

  if (values.password && values.newPassword && databaseUser.password) {
    const passwordsMatch = await bcrypt.compare(
      values.password,
      databaseUser.password
    );
    if (!passwordsMatch) {
      return { error: "Invalid password" };
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10);
    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  const updateData: any = {
    name: values.name,
    email: values.email,
    password: values.password,
    isTwoFactorEnabled: values.isTwoFactorEnabled,
  };

  await db.update(users).set(updateData).where(eq(users.id, databaseUser.id));

  return { success: "Settings updated" };
};
