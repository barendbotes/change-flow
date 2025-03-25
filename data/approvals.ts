import { db } from "@/lib/db";
import {
  approvals,
  requests,
  changeRequests,
  userGroups,
} from "@/schemas/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { hasApprovalRole } from "@/lib/admin";

export interface ApprovalData {
  id: string;
  status: string;
  createdAt: Date;
  type: "regular" | "change";
  title: string;
  description: string;
  user: {
    id: string;
    name: string;
  };
  requestType?: {
    name: string;
  };
  attachments: any[];
}

export const getPendingApprovals = async (): Promise<ApprovalData[]> => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const hasRole = await hasApprovalRole();
  if (!hasRole) throw new Error("Unauthorized");

  // Get user's groups
  const userGroupsData = await db.query.userGroups.findMany({
    where: eq(userGroups.userId, user.id),
    with: {
      group: true,
    },
  });
  const userGroupIds = userGroupsData.map((ug) => ug.groupId);

  // Build the where clause based on user's role
  let whereClause;
  if (user.roles?.some((role) => role.name.toLowerCase() === "admin")) {
    // Admin sees all pending approvals
    whereClause = eq(approvals.status, "pending");
  } else if (
    user.roles?.some((role) => role.name.toLowerCase() === "manager")
  ) {
    // Manager sees approvals from their group OR where they are the approver
    whereClause = and(
      eq(approvals.status, "pending"),
      or(
        // Requests from their group
        inArray(
          approvals.requestId,
          db
            .select({ id: requests.id })
            .from(requests)
            .where(
              inArray(
                requests.userId,
                db
                  .select({ userId: userGroups.userId })
                  .from(userGroups)
                  .where(inArray(userGroups.groupId, userGroupIds))
              )
            )
        ),
        // Requests where they are the approver
        eq(approvals.approverId, user.id)
      )
    );
  } else {
    // Regular users only see their own approvals
    whereClause = and(
      eq(approvals.status, "pending"),
      eq(approvals.approverId, user.id)
    );
  }

  // Fetch pending approvals
  const pendingApprovals = await db.query.approvals.findMany({
    where: whereClause,
    with: {
      request: {
        with: {
          user: true,
          requestType: true,
          attachments: true,
        },
      },
      approver: true,
    },
    orderBy: (approvals, { desc }) => [desc(approvals.createdAt)],
  });

  // Transform the data to match the ApprovalData interface
  return pendingApprovals.map((approval) => ({
    id: approval.id,
    status: approval.status,
    createdAt: approval.createdAt,
    type: "regular",
    title: approval.request.title,
    description:
      (approval.request.data as any).description ||
      (approval.request.data as any).justification,
    user: approval.request.user,
    requestType: approval.request.requestType,
    attachments: approval.request.attachments,
  }));
};

export const getCompletedApprovals = async (): Promise<ApprovalData[]> => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  const hasRole = await hasApprovalRole();
  if (!hasRole) throw new Error("Unauthorized");

  // Get user's groups
  const userGroupsData = await db.query.userGroups.findMany({
    where: eq(userGroups.userId, user.id),
    with: {
      group: true,
    },
  });
  const userGroupIds = userGroupsData.map((ug) => ug.groupId);

  // Build the where clause based on user's role
  let whereClause;
  if (user.roles?.some((role) => role.name.toLowerCase() === "admin")) {
    // Admin sees all completed approvals
    whereClause = or(
      eq(approvals.status, "approved"),
      eq(approvals.status, "rejected")
    );
  } else if (
    user.roles?.some((role) => role.name.toLowerCase() === "manager")
  ) {
    // Manager sees completed approvals from their group OR where they are the approver
    whereClause = and(
      or(eq(approvals.status, "approved"), eq(approvals.status, "rejected")),
      or(
        // Requests from their group
        inArray(
          approvals.requestId,
          db
            .select({ id: requests.id })
            .from(requests)
            .where(
              inArray(
                requests.userId,
                db
                  .select({ userId: userGroups.userId })
                  .from(userGroups)
                  .where(inArray(userGroups.groupId, userGroupIds))
              )
            )
        ),
        // Requests where they are the approver
        eq(approvals.approverId, user.id)
      )
    );
  } else {
    // Regular users only see their own completed approvals
    whereClause = and(
      or(eq(approvals.status, "approved"), eq(approvals.status, "rejected")),
      eq(approvals.approverId, user.id)
    );
  }

  // Fetch completed approvals
  const completedApprovals = await db.query.approvals.findMany({
    where: whereClause,
    with: {
      request: {
        with: {
          user: true,
          requestType: true,
          attachments: true,
        },
      },
      approver: true,
    },
    orderBy: (approvals, { desc }) => [desc(approvals.createdAt)],
  });

  // Transform the data to match the ApprovalData interface
  return completedApprovals.map((approval) => ({
    id: approval.id,
    status: approval.status,
    createdAt: approval.createdAt,
    type: "regular",
    title: approval.request.title,
    description:
      (approval.request.data as any).description ||
      (approval.request.data as any).justification,
    user: approval.request.user,
    requestType: approval.request.requestType,
    attachments: approval.request.attachments,
  }));
};
