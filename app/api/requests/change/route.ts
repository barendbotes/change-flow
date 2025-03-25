import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requests, requestTypes, users, approvals } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schema for the request body
const changeRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  changeType: z.enum(["hardware", "software", "network", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  implementationDate: z.string(),
  impact: z
    .string()
    .min(10, "Impact description must be at least 10 characters"),
  rollbackPlan: z
    .string()
    .min(10, "Rollback plan must be at least 10 characters"),
  userId: z.string(),
  attachments: z.any().optional(),
});

export async function POST(req: Request) {
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
        "You don't have permission to submit change requests. This is restricted to IT group members and administrators.",
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validatedData = changeRequestSchema.parse(body);

    // Ensure the user is submitting on their own behalf
    if (validatedData.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the IT Change Request type
    const requestType = await db.query.requestTypes.findFirst({
      where: eq(requestTypes.name, "IT Change Request"),
    });

    if (!requestType) {
      return new NextResponse("IT Change Request type not found", {
        status: 404,
      });
    }

    // Get the user's approver
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        approverId: true,
      },
    });

    const approverId = userData?.approverId;

    if (!approverId) {
      return new NextResponse("No approver assigned to this user", {
        status: 400,
      });
    }

    try {
      console.log("Preparing attachments:", validatedData.attachments || []);

      // Create the request with the new schema
      const [request] = await db
        .insert(requests)
        .values({
          title: validatedData.title,
          description: validatedData.description,
          userId: validatedData.userId,
          requestTypeId: requestType.id,
          data: {
            changeType: validatedData.changeType,
            priority: validatedData.priority,
            implementationDate: validatedData.implementationDate,
            impact: validatedData.impact,
            rollbackPlan: validatedData.rollbackPlan,
            attachments: validatedData.attachments || [],
          },
          status: "pending",
        })
        .returning();

      // Create an approval record
      await db.insert(approvals).values({
        requestId: request.id,
        approverId: approverId,
        status: "pending",
      });

      return NextResponse.json({
        message: "Change request submitted successfully",
        request,
      });
    } catch (error) {
      console.error("[DB_INSERT_ERROR]", error);
      return new NextResponse(
        "Database error: " +
          (error instanceof Error ? error.message : "Unknown error"),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[CHANGE_REQUEST_SUBMIT]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
