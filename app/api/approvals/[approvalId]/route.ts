import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvals, requests, userGroups } from "@/schemas/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: { approvalId: string } }
) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin or manager
    const isAdmin = user.roles.some((role) => role.name === "admin");
    const isManager = user.roles.some((role) => role.name === "manager");

    if (!isAdmin && !isManager) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status, notes } = await req.json();

    if (!status || !["approved", "rejected"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    // Get the approval with approver details
    const approval = await db.query.approvals.findFirst({
      where: eq(approvals.id, params.approvalId),
      with: {
        approver: true,
        request: {
          with: {
            requestType: true,
          },
        },
      },
    });

    if (!approval) {
      return new NextResponse("Approval not found", { status: 404 });
    }

    // Check if user has permission to approve this request
    if (!isAdmin) {
      // For managers, check if they belong to the request's group
      const userGroupsData = await db.query.userGroups.findMany({
        where: eq(userGroups.userId, user.id),
        with: {
          group: true,
        },
      });

      const userGroupIds = userGroupsData.map((ug) => ug.group.id);
      const requestGroupId = approval.request.requestType.groupId;

      if (!requestGroupId || !userGroupIds.includes(requestGroupId)) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    // If the current user is not the assigned approver, update the approver
    const updateData: any = {
      status,
      notes: notes || null,
      updatedAt: new Date(),
    };

    if (approval.approver.id !== user.id) {
      console.log(
        `Updating approver from ${approval.approver.id} to ${user.id}`
      );
      updateData.approverId = user.id;
    }

    // Update the approval
    await db
      .update(approvals)
      .set(updateData)
      .where(eq(approvals.id, params.approvalId));

    // If all approvals are approved, update the request status
    if (status === "approved") {
      const allApprovals = await db.query.approvals.findMany({
        where: eq(approvals.requestId, approval.requestId),
      });

      const allApproved = allApprovals.every((a) => a.status === "approved");

      if (allApproved) {
        await db
          .update(requests)
          .set({
            status: "approved",
            updatedAt: new Date(),
          })
          .where(eq(requests.id, approval.requestId));
      }
    } else if (status === "rejected") {
      // If any approval is rejected, update the request status
      await db
        .update(requests)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(requests.id, approval.requestId));
    }

    return new NextResponse("Approval updated successfully", { status: 200 });
  } catch (error) {
    console.error("[APPROVAL_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { approvalId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has admin role
    const isAdmin = user.roles?.some(
      (role) => role.name.toLowerCase() === "admin"
    );

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete the approval
    await db.delete(approvals).where(eq(approvals.id, params.approvalId));

    return new NextResponse("Approval deleted successfully", { status: 200 });
  } catch (error) {
    console.error("[APPROVAL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
