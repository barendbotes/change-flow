import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requests, approvals, userGroups, users } from "@/schemas/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { hasApprovalRole } from "@/lib/admin";

// Validation schema for the approval action
const approvalSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  status: z.enum(["approved", "rejected"], {
    invalid_type_error: "Status must be either 'approved' or 'rejected'",
  }),
  notes: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has manager or admin role
    const hasRole = await hasApprovalRole();
    if (!hasRole) {
      return new NextResponse("You don't have permission to approve requests", {
        status: 403,
      });
    }

    const body = await req.json();

    // Validate request body
    const validatedData = approvalSchema.parse(body);

    // Get user's groups
    const userGroupsData = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, user.id),
      with: {
        group: true,
      },
    });
    const userGroupIds = userGroupsData.map((ug) => ug.groupId);

    // Check if user has permission to approve this request
    const request = await db.query.requests.findFirst({
      where: eq(requests.id, validatedData.requestId),
      with: {
        user: true,
        requestType: {
          with: {
            group: true,
          },
        },
      },
    });

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    const isAdmin = user.roles?.some(
      (role) => role.name.toLowerCase() === "admin"
    );
    const isManager = user.roles?.some(
      (role) => role.name.toLowerCase() === "manager"
    );

    if (!isAdmin && isManager) {
      // Get approval record to check if user is the approver
      const approvalRecord = await db.query.approvals.findFirst({
        where: and(
          eq(approvals.requestId, validatedData.requestId),
          eq(approvals.approverId, user.id)
        ),
      });

      // Manager can only approve requests from their group or where they are the approver
      if (!approvalRecord) {
        // Check if the request's group is in the manager's groups
        if (
          !request.requestType.groupId ||
          !userGroupIds.includes(request.requestType.groupId)
        ) {
          return new NextResponse(
            "You don't have permission to approve this request",
            { status: 403 }
          );
        }
      }
    }

    try {
      // Update the approval status
      await db
        .update(approvals)
        .set({
          status: validatedData.status,
          notes: validatedData.notes,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(approvals.requestId, validatedData.requestId),
            eq(approvals.approverId, user.id)
          )
        );

      // If all approvals are approved, update the request status
      if (validatedData.status === "approved") {
        const allApprovals = await db.query.approvals.findMany({
          where: eq(approvals.requestId, validatedData.requestId),
        });

        const allApproved = allApprovals.every((a) => a.status === "approved");

        if (allApproved) {
          await db
            .update(requests)
            .set({
              status: "approved",
              updatedAt: new Date(),
            })
            .where(eq(requests.id, validatedData.requestId));
        }
      } else if (validatedData.status === "rejected") {
        // If any approval is rejected, update the request status
        await db
          .update(requests)
          .set({
            status: "rejected",
            updatedAt: new Date(),
          })
          .where(eq(requests.id, validatedData.requestId));
      }

      return NextResponse.json({
        message: `Request ${validatedData.status} successfully`,
      });
    } catch (error) {
      console.error("[DB_UPDATE_ERROR]", error);
      return new NextResponse(
        "Database error: " +
          (error instanceof Error ? error.message : "Unknown error"),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[REQUEST_APPROVAL]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
