import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  approvals,
  requests,
  userGroups,
  groups,
  requestTypes,
} from "@/schemas/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { ApprovalsList } from "@/components/approvals-list";

export default async function ApprovalsPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect("/auth/login");
  }

  // Check if user is admin or manager or has approvals assigned
  const isAdmin = user.roles.some(
    (role) => role.name.toLowerCase() === "admin"
  );
  const isManager = user.roles.some(
    (role) => role.name.toLowerCase() === "manager"
  );
  const hasApprovals = await db.query.approvals.findFirst({
    where: eq(approvals.approverId, user.id),
  });

  if (!isAdmin && !isManager && !hasApprovals) {
    redirect("/dashboard");
  }

  // Get user's groups if they are a manager
  let userGroupIds: string[] = [];
  if (isManager) {
    const userGroupsData = await db.query.userGroups.findMany({
      where: eq(userGroups.userId, user.id),
      with: {
        group: true,
      },
    });
    userGroupIds = userGroupsData.map((ug) => ug.group.id);
  }

  // Build where clause based on user role
  const whereClause = isAdmin
    ? undefined
    : {
        where: inArray(requests.requestTypeId, userGroupIds),
      };

  // Fetch all approvals with related data
  const allRequests = await db.query.requests.findMany({
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
    ...whereClause,
  });

  // Format approvals for the ApprovalsList component
  const formattedApprovals = allRequests.flatMap((request) =>
    request.approvals.map((approval) => ({
      id: request.id,
      title: request.title,
      status: request.status,
      createdAt: request.createdAt,
      type: request.requestType.name,
      data: request.data as Record<string, any>,
      user: request.user,
      group: request.requestType.group,
      approvalId: approval.id,
      approvalStatus: approval.status,
      approvalNotes: approval.notes || undefined,
      approver: approval.approver,
      attachments: request.attachments,
    }))
  );

  // Prepare current user info for the ApprovalsList
  const currentUserInfo = {
    id: user.id,
    roles: user.roles.map((role) => ({ name: role.name })),
    userGroups: user.userGroups.map((ug) => ({
      group: {
        id: ug.group.id,
        name: ug.group.name,
      },
    })),
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          Review and manage approval requests.
        </p>
      </div>
      <ApprovalsList
        approvals={formattedApprovals}
        currentUser={currentUserInfo}
      />
    </div>
  );
}
