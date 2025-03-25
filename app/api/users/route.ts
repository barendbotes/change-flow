import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userRoles, userGroups } from "@/schemas/schema";
import { eq, desc } from "drizzle-orm";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (
      !user ||
      !user.roles?.some((role) => role.name.toLowerCase() === "admin")
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { roleId, groupIds, approverId, isTwoFactorEnabled } = body;

    // Get the latest created user (the one just registered)
    const [latestUser] = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(1);

    if (!latestUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    await db.transaction(async (tx) => {
      // Add role
      if (roleId) {
        await tx.insert(userRoles).values({
          userId: latestUser.id,
          roleId,
        });
      }

      // Add groups
      if (groupIds && groupIds.length > 0) {
        await tx.insert(userGroups).values(
          groupIds.map((groupId: string) => ({
            userId: latestUser.id,
            groupId,
          }))
        );
      }

      // Update user with additional info
      await tx
        .update(users)
        .set({
          approverId,
          isTwoFactorEnabled,
        })
        .where(eq(users.id, latestUser.id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
