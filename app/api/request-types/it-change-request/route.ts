import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestTypes } from "@/schemas/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has admin role or belongs to IT group
    const isAdmin = user.roles?.some(
      (role) => role.name.toLowerCase() === "admin"
    );
    const isITGroup = user.userGroups?.some(
      (group) => group.group.name.toLowerCase() === "it"
    );

    if (!isAdmin && !isITGroup) {
      return new NextResponse(
        "You don't have permission to access this request type. This is restricted to IT group members and administrators.",
        { status: 403 }
      );
    }

    // Get the IT Change Request type
    const requestType = await db.query.requestTypes.findFirst({
      where: eq(requestTypes.name, "IT Change Request"),
    });

    if (!requestType) {
      return new NextResponse("Request type not found", { status: 404 });
    }

    return NextResponse.json({ requestType });
  } catch (error) {
    console.error("[GET_REQUEST_TYPE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
