import { db } from "@/lib/db";
import {
  requests,
  userGroups,
  approvals,
  requestTypes,
} from "@/schemas/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { currentUser } from "@/lib/auth";

export interface DashboardStats {
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  recentRequests: any[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

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
    // Admin sees all requests
    whereClause = undefined;
  } else if (
    user.roles?.some((role) => role.name.toLowerCase() === "manager")
  ) {
    // Manager sees all requests from users in their groups
    whereClause = inArray(
      requests.userId,
      db
        .select({ userId: userGroups.userId })
        .from(userGroups)
        .where(inArray(userGroups.groupId, userGroupIds))
    );
  } else {
    // Regular users only see their own requests
    whereClause = eq(requests.userId, user.id);
  }

  // Fetch all requests with proper filtering
  const allRequests = await db.query.requests.findMany({
    where: whereClause,
    with: {
      user: true,
      requestType: {
        with: {
          group: true,
        },
      },
      attachments: true,
      approvals: {
        with: {
          approver: true,
        },
      },
    },
    orderBy: (requests, { desc }) => [desc(requests.createdAt)],
  });

  // Count requests by status
  const pendingRequests = allRequests.filter(
    (r) => r.status === "pending"
  ).length;
  const approvedRequests = allRequests.filter(
    (r) => r.status === "approved"
  ).length;
  const rejectedRequests = allRequests.filter(
    (r) => r.status === "rejected"
  ).length;

  // Get recent requests (last 5)
  const recentRequests = allRequests.slice(0, 5).map((request) => ({
    id: request.id,
    title: request.title,
    status: request.status,
    createdAt: request.createdAt,
    type: request.requestType.name,
    data: request.data,
    user: request.user,
    group: request.requestType.group,
    approvals: request.approvals,
  }));

  return {
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    recentRequests,
  };
};
