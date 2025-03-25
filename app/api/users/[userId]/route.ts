import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userRoles, userGroups } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await currentUser();

    if (
      !user ||
      !user.roles?.some((role) => role.name.toLowerCase() === "admin")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      roleId,
      groupIds,
      approverId,
      isTwoFactorEnabled,
    } = body;

    // Update user basic info
    const updateData: any = {
      name,
      email,
      approverId,
      isTwoFactorEnabled,
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await db.transaction(async (tx) => {
      // Update user
      await tx.update(users).set(updateData).where(eq(users.id, params.userId));

      // Update role
      if (roleId) {
        // Delete existing roles
        await tx.delete(userRoles).where(eq(userRoles.userId, params.userId));

        // Add new role
        await tx.insert(userRoles).values({
          userId: params.userId,
          roleId,
        });
      }

      // Update groups
      if (groupIds && groupIds.length > 0) {
        // Delete existing groups
        await tx.delete(userGroups).where(eq(userGroups.userId, params.userId));

        // Add new groups
        await tx.insert(userGroups).values(
          groupIds.map((groupId: string) => ({
            userId: params.userId,
            groupId,
          }))
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await currentUser();

    if (
      !user ||
      !user.roles?.some((role) => role.name.toLowerCase() === "admin")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.delete(users).where(eq(users.id, params.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
