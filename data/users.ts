import { db } from "@/lib/db";
import { users, userRoles, userGroups } from "@/schemas/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  groups: {
    id: string;
    name: string;
  }[];
  approver?: {
    id: string;
    name: string;
  };
  isTwoFactorEnabled: boolean;
}

export const getUsers = async (): Promise<UserData[]> => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error("Unauthorized");

  const allUsers = await db.query.users.findMany({
    with: {
      roles: {
        with: {
          role: true,
        },
      },
      groups: {
        with: {
          group: true,
        },
      },
      approver: true,
    },
  });

  return allUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roles[0]?.role || { id: "", name: "" },
    groups: user.groups.map((g) => ({
      id: g.group.id,
      name: g.group.name,
    })),
    approver: user.approver
      ? {
          id: user.approver.id,
          name: user.approver.name,
        }
      : undefined,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
  }));
};

export const getUserById = async (userId: string): Promise<UserData | null> => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const isUserAdmin = await isAdmin();
  if (!isUserAdmin && user.id !== userId) throw new Error("Unauthorized");

  const foundUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      roles: {
        with: {
          role: true,
        },
      },
      groups: {
        with: {
          group: true,
        },
      },
      approver: true,
    },
  });

  if (!foundUser) return null;

  return {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.roles[0]?.role || { id: "", name: "" },
    groups: foundUser.groups.map((g) => ({
      id: g.group.id,
      name: g.group.name,
    })),
    approver: foundUser.approver
      ? {
          id: foundUser.approver.id,
          name: foundUser.approver.name,
        }
      : undefined,
    isTwoFactorEnabled: foundUser.isTwoFactorEnabled,
  };
};
