"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Check,
  Download,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { approvals, requests } from "@/schemas/schema";
import { AttachmentViewer } from "./attachment-viewer";

// Type for unified approvals
type UnifiedApproval = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  type: string;
  data: Record<string, any>;
  user: any;
  group: any;
  approvalId: string;
  approvalStatus: string;
  approvalNotes?: string;
  approver: any;
  attachments?: any[];
};

interface ApprovalsListProps {
  approvals: UnifiedApproval[];
  currentUser: {
    id: string;
    roles?: { name: string }[];
    userGroups?: { group: { id: string; name: string } }[];
  };
}

export const ApprovalsList = ({
  approvals,
  currentUser,
}: ApprovalsListProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApproval, setSelectedApproval] =
    useState<UnifiedApproval | null>(null);
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );
  const [activeTab, setActiveTab] = useState("pending");
  const [error, setError] = useState<string | null>(null);

  // Check user roles
  const isAdmin = currentUser.roles?.some(
    (role) => role.name.toLowerCase() === "admin"
  );
  const isManager = currentUser.roles?.some(
    (role) => role.name.toLowerCase() === "manager"
  );
  const userGroupIds = currentUser.userGroups?.map((ug) => ug.group.id) || [];

  // Filter approvals based on user role and groups
  const filterApprovalsByPermission = (approvals: UnifiedApproval[]) => {
    if (isAdmin) {
      // Admin can see all approvals
      return approvals;
    }

    if (isManager) {
      // Manager can only see approvals from their groups
      return approvals.filter((approval) => {
        const approvalGroupId = approval.group?.id;
        return approvalGroupId && userGroupIds.includes(approvalGroupId);
      });
    }

    // Regular approver can only see approvals assigned to them
    return approvals.filter(
      (approval) => approval.approver.id === currentUser.id
    );
  };

  // Filter approvals by status and permission
  const filteredApprovals = filterApprovalsByPermission(approvals);
  const allApprovals = filteredApprovals;
  const pendingApprovals = filteredApprovals.filter(
    (a) => a.approvalStatus === "pending"
  );
  const approvedApprovals = filteredApprovals.filter(
    (a) => a.approvalStatus === "approved"
  );
  const rejectedApprovals = filteredApprovals.filter(
    (a) => a.approvalStatus === "rejected"
  );

  // Check for expandItem in URL parameters
  useEffect(() => {
    const expandItem = searchParams.get("expandItem");
    if (expandItem) {
      const approvalToExpand = approvals.find(
        (approval) => approval.id === expandItem
      );

      if (approvalToExpand) {
        // Expand the card
        setExpandedCards((prev) => ({
          ...prev,
          [approvalToExpand.approvalId]: true,
        }));

        // Switch to the appropriate tab
        if (approvalToExpand.approvalStatus === "pending") {
          setActiveTab("pending");
        } else if (approvalToExpand.approvalStatus === "approved") {
          setActiveTab("approved");
        } else if (approvalToExpand.approvalStatus === "rejected") {
          setActiveTab("rejected");
        }

        // Scroll to the item
        setTimeout(() => {
          const element = document.getElementById(
            `approval-${approvalToExpand.id}`
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
  }, [searchParams, approvals]);

  // Helper function to safely parse dates
  const parseDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    try {
      return parseISO(date);
    } catch {
      return null;
    }
  };

  // Helper function to format dates
  const formatDate = (date: string | Date | null | undefined): string => {
    const parsedDate = parseDate(date);
    if (!parsedDate) return "Invalid date";
    return format(parsedDate, "PPP");
  };

  const canApprove = (approval: UnifiedApproval): boolean => {
    if (isAdmin) return true;
    if (isManager) {
      const approvalGroupId = approval.group?.id;
      return approvalGroupId && userGroupIds.includes(approvalGroupId);
    }
    return approval.approver.id === currentUser.id;
  };

  const handleAction = async () => {
    if (!selectedApproval || !action) return;

    // Check if user has permission to approve/reject
    if (!canApprove(selectedApproval)) {
      setError("You don't have permission to perform this action");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = `/api/approvals/${selectedApproval.approvalId}`;
      const payload = {
        status: action === "approve" ? "approved" : "rejected",
        notes: notes,
      };

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update approval");
      }

      // Close dialog and refresh page
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating approval:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openApproveDialog = (approval: UnifiedApproval) => {
    setSelectedApproval(approval);
    setAction("approve");
    setNotes("");
    setDialogOpen(true);
  };

  const openRejectDialog = (approval: UnifiedApproval) => {
    setSelectedApproval(approval);
    setAction("reject");
    setNotes("");
    setDialogOpen(true);
  };

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderApprovalCard = (approval: UnifiedApproval) => {
    const isExpanded = expandedCards[approval.approvalId] || false;
    const isChangeRequest = approval.type.toLowerCase().includes("change");
    const hasApprovalPermission = canApprove(approval);

    return (
      <Card
        key={approval.approvalId}
        id={`approval-${approval.id}`}
        className="mb-4"
      >
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">
                <Link
                  href={`/requests/${approval.id}`}
                  className="text-primary hover:underline"
                >
                  {approval.title}
                </Link>
              </CardTitle>
              <CardDescription>
                Submitted by {approval.user.name} on{" "}
                {formatDate(approval.createdAt)}
                {!hasApprovalPermission && (
                  <div className="flex items-center text-destructive mt-1">
                    <ShieldAlert className="h-4 w-4 mr-1" />
                    <span>
                      You don't have permission to approve this request
                    </span>
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  approval.approvalStatus === "pending"
                    ? "outline"
                    : approval.approvalStatus === "approved"
                    ? "success"
                    : "destructive"
                }
              >
                {approval.approvalStatus.charAt(0).toUpperCase() +
                  approval.approvalStatus.slice(1)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleCard(approval.approvalId)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p>{approval.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Group</p>
                    <p>{approval.group?.name || "N/A"}</p>
                  </div>
                  {isChangeRequest && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Implementation Date
                        </p>
                        <p>
                          {formatDate(approval.data?.implementationDate) ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Priority
                        </p>
                        <p>{approval.data?.priority || "Not specified"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {approval.data?.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="whitespace-pre-wrap">
                    {approval.data.description}
                  </p>
                </div>
              )}

              {isChangeRequest && (
                <>
                  {approval.data?.impact && (
                    <div>
                      <h4 className="font-semibold mb-2">Impact</h4>
                      <p className="whitespace-pre-wrap">
                        {approval.data.impact}
                      </p>
                    </div>
                  )}
                  {approval.data?.rollbackPlan && (
                    <div>
                      <h4 className="font-semibold mb-2">Rollback Plan</h4>
                      <p className="whitespace-pre-wrap">
                        {approval.data.rollbackPlan}
                      </p>
                    </div>
                  )}
                </>
              )}

              {approval.attachments && approval.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Attachments</h4>
                  <AttachmentViewer attachments={approval.attachments} />
                </div>
              )}

              {approval.approvalNotes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="whitespace-pre-wrap">
                    {approval.approvalNotes}
                  </p>
                </div>
              )}
            </CardContent>

            {isExpanded &&
              approval.approvalStatus === "pending" &&
              hasApprovalPermission && (
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => openRejectDialog(approval)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button onClick={() => openApproveDialog(approval)}>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </CardFooter>
              )}
          </>
        )}
      </Card>
    );
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingApprovals.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 absolute -top-2 -right-2"
              >
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          {pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Info className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No pending approvals</p>
              <p className="text-muted-foreground">
                There are no requests waiting for your approval.
              </p>
            </div>
          ) : (
            pendingApprovals.map(renderApprovalCard)
          )}
        </TabsContent>
        <TabsContent value="approved" className="mt-6">
          {approvedApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Info className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No approved requests</p>
              <p className="text-muted-foreground">
                You haven't approved any requests yet.
              </p>
            </div>
          ) : (
            approvedApprovals.map(renderApprovalCard)
          )}
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          {rejectedApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Info className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No rejected requests</p>
              <p className="text-muted-foreground">
                You haven't rejected any requests yet.
              </p>
            </div>
          ) : (
            rejectedApprovals.map(renderApprovalCard)
          )}
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          {allApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Info className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No requests</p>
              <p className="text-muted-foreground">
                There are no requests to display.
              </p>
            </div>
          ) : (
            allApprovals.map(renderApprovalCard)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Are you sure you want to approve this request?"
                : "Are you sure you want to reject this request?"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="notes"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              variant={action === "approve" ? "default" : "destructive"}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
