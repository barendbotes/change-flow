"use server";

import { currentRole } from "@/lib/auth";
import { userRoles } from "@/schemas/schema";

export const admin = async () => {
  const role = await currentRole();
  if (role === "admin") {
    return { success: "Allowed" };
  }
  return { error: "Forbidden" };
};
