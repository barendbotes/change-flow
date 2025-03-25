import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ListChecks } from "lucide-react";
import Link from "next/link";

import { currentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requests, approvals } from "@/schemas/schema";
import { RequestApprovalActions } from "@/components/request-approval-actions";
import { ShareRequestButton } from "@/components/share-request-button";
import { AttachmentViewer } from "@/components/attachment-viewer";

export default async function ChangeRequestPage({
  params,
}: {
  params: { requestId: string };
}) {
  const user = await currentUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch the request with all related data
  const request = await db.query.requests.findFirst({
    where: eq(requests.id, params.requestId),
    with: {
      user: true,
      requestType: true,
      approvals: {
        with: {
          approver: true,
        },
      },
      attachments: true,
    },
  });

  if (!request) {
    return notFound();
  }

  // Get the request data
  const data = request.data as Record<string, any>;

  // Check if user has permission to view this request
  // Allow if user created the request or is an approver
  const isCreator = request.userId === user.id;
  const isApprover = request.approvals.some((a) => a.approverId === user.id);
  const isAdmin = user.roles?.some(
    (role) => role.name.toLowerCase() === "admin"
  );

  if (!isCreator && !isApprover && !isAdmin) {
    return redirect("/dashboard");
  }

  // Helper function to format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not specified";
    return format(new Date(date), "PPP");
  };

  // Determine status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get the user's approval if they are an approver
  const userApproval = request.approvals.find((a) => a.approverId === user.id);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Change Request Details
        </h1>
        <div className="flex items-center gap-2">
          {(isApprover || isAdmin) && (
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <Link href={`/approvals?expandItem=${params.requestId}`}>
                <ListChecks className="h-4 w-4" />
                Go to Approvals
              </Link>
            </Button>
          )}
          <ShareRequestButton requestId={params.requestId} />
          <Badge variant={getStatusBadge(request.status)}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
          <Badge variant="outline">{request.requestType.name}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{request.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            Requested by {request.user.name} on {formatDate(request.createdAt)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">
              {request.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Change Type</h3>
              <p className="text-sm text-muted-foreground">{data.changeType}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Priority</h3>
              <p className="text-sm text-muted-foreground">{data.priority}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Implementation Date</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(data.implementationDate)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Impact</h3>
              <p className="text-sm text-muted-foreground">{data.impact}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Rollback Plan</h3>
            <p className="text-sm text-muted-foreground">{data.rollbackPlan}</p>
          </div>

          {request.approvals.some((a) => a.notes) && (
            <div>
              <h3 className="font-medium mb-2">Approval Notes</h3>
              {request.approvals.map(
                (approval, index) =>
                  approval.notes && (
                    <div key={approval.id} className="mb-2">
                      <p className="text-sm font-medium">
                        {approval.approver.name}:
                      </p>
                      <p className="text-sm text-muted-foreground ml-4">
                        {approval.notes}
                      </p>
                    </div>
                  )
              )}
            </div>
          )}

          {request.attachments.length > 0 && (
            <AttachmentViewer
              attachments={request.attachments.map((attachment) => ({
                id: attachment.id,
                name: attachment.fileName,
                url: attachment.fileUrl,
                size: attachment.fileSize,
                type: attachment.fileType,
                requestId: params.requestId,
              }))}
            />
          )}
        </CardContent>
        {request.status === "pending" && userApproval?.status === "pending" && (
          <CardFooter>
            <RequestApprovalActions
              requestId={params.requestId}
              approvalId={userApproval.id}
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
