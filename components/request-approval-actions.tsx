"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RequestApprovalActionsProps {
  requestId: string;
  approvalId: string;
}

export function RequestApprovalActions({
  requestId,
  approvalId,
}: RequestApprovalActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleAction = async () => {
    if (!action) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/requests/change/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          approvalId,
          status: action === "approve" ? "approved" : "rejected",
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update approval");
      }

      setDialogOpen(false);
      setNotes("");
      setAction(null);

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error("Error updating approval:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openApproveDialog = () => {
    setAction("approve");
    setDialogOpen(true);
  };

  const openRejectDialog = () => {
    setAction("reject");
    setDialogOpen(true);
  };

  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button variant="outline" onClick={openRejectDialog}>
        <X className="mr-2 h-4 w-4" />
        Reject
      </Button>
      <Button onClick={openApproveDialog}>
        <Check className="mr-2 h-4 w-4" />
        Approve
      </Button>

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
                Notes
              </label>
              <Textarea
                id="notes"
                placeholder="Add any notes about your decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
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
            <Button onClick={handleAction} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {action === "approve" ? "Approving..." : "Rejecting..."}
                </>
              ) : action === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
