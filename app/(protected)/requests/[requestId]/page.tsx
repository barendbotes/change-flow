import { redirect } from "next/navigation";
import { format } from "date-fns";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requests } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttachmentViewer } from "@/components/attachment-viewer";
import { RequestApprovalActions } from "@/components/request-approval-actions";

interface RequestDetailsPageProps {
  params: {
    requestId: string;
  };
}

interface RequestData {
  changeType: string;
  priority: string;
  implementationDate: string;
  impact: string;
  rollbackPlan: string;
}

export default async function RequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get the request with all related data
  const request = await db.query.requests.findFirst({
    where: eq(requests.id, params.requestId),
    with: {
      user: true,
      requestType: {
        with: {
          group: true,
        },
      },
      approvals: {
        with: {
          approver: true,
        },
      },
      attachments: true,
    },
  });

  if (!request) {
    redirect("/dashboard");
  }

  // Check if user has permission to view this request
  const isAdmin = user.roles?.some(
    (role) => role.name.toLowerCase() === "admin"
  );
  const isManager = user.roles?.some(
    (role) => role.name.toLowerCase() === "manager"
  );
  const userGroupIds = user.userGroups?.map((ug) => ug.group.id) || [];
  const requestGroupId = request.requestType.group?.id;

  const canView =
    isAdmin ||
    request.userId === user.id ||
    (isManager && requestGroupId && userGroupIds.includes(requestGroupId)) ||
    request.approvals.some((approval) => approval.approver.id === user.id);

  if (!canView) {
    redirect("/dashboard");
  }

  // Format dates
  const createdAt = format(request.createdAt, "PPP");
  const updatedAt = format(request.updatedAt, "PPP");
  const data = request.data as RequestData;
  const implementationDate = data.implementationDate
    ? format(new Date(data.implementationDate), "PPP")
    : "Not specified";

  // Get the user's approval if they are an approver
  const userApproval = request.approvals.find(
    (approval) => approval.approver.id === user.id
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{request.title}</h1>
        <Badge
          variant={
            request.status === "pending"
              ? "outline"
              : request.status === "approved"
              ? "success"
              : "destructive"
          }
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="whitespace-pre-wrap">{request.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-muted-foreground">Type</h4>
                <p>{request.requestType.name}</p>
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground">Group</h4>
                <p>{request.requestType.group?.name || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground">Submitted By</h4>
                <p>{request.user.name}</p>
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground">Submitted On</h4>
                <p>{createdAt}</p>
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground">Last Updated</h4>
                <p>{updatedAt}</p>
              </div>
            </div>

            {request.requestType.name === "IT Change Request" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-muted-foreground">
                      Change Type
                    </h4>
                    <p className="capitalize">{data.changeType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Priority</h4>
                    <p className="capitalize">{data.priority}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">
                      Implementation Date
                    </h4>
                    <p>{implementationDate}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Impact</h3>
                  <p className="whitespace-pre-wrap">{data.impact}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Rollback Plan</h3>
                  <p className="whitespace-pre-wrap">{data.rollbackPlan}</p>
                </div>
              </>
            )}

            {request.attachments.length > 0 && (
              <div>
                <AttachmentViewer attachments={request.attachments} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.approvals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium">{approval.approver.name}</p>
                  {approval.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {approval.notes}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    approval.status === "pending"
                      ? "outline"
                      : approval.status === "approved"
                      ? "success"
                      : "destructive"
                  }
                >
                  {approval.status.charAt(0).toUpperCase() +
                    approval.status.slice(1)}
                </Badge>
              </div>
            ))}

            {userApproval && userApproval.status === "pending" && (
              <RequestApprovalActions
                requestId={request.id}
                approvalId={userApproval.id}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
