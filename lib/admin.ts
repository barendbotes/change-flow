import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/schemas/schema";
import { eq } from "drizzle-orm";

export const isAdmin = async () => {
  try {
    const user = await currentUser();
    if (!user?.id) return false;

    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, user.id),
      with: {
        role: true,
      },
    });

    return userRole?.role.name.toLowerCase() === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const isManager = async () => {
  try {
    const user = await currentUser();
    if (!user?.id) return false;

    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, user.id),
      with: {
        role: true,
      },
    });

    return userRole?.role.name.toLowerCase() === "manager";
  } catch (error) {
    console.error("Error checking manager status:", error);
    return false;
  }
};

export const hasApprovalRole = async () => {
  try {
    const user = await currentUser();
    if (!user?.id) return false;

    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, user.id),
      with: {
        role: true,
      },
    });

    const roleName = userRole?.role.name.toLowerCase();
    return roleName === "admin" || roleName === "manager";
  } catch (error) {
    console.error("Error checking approval role:", error);
    return false;
  }
};
