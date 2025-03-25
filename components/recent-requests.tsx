"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, parseISO } from "date-fns";

interface RecentRequest {
  id: string;
  title: string;
  createdAt: string | Date;
  status: "pending" | "approved" | "rejected";
  type: "regular" | "change";
  implementationDate?: string | Date;
}

interface RecentRequestsProps {
  requests: RecentRequest[];
}

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

export const RecentRequests = ({ requests }: RecentRequestsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Requests</CardTitle>
        <CardDescription>
          Your most recent change and asset requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{request.title}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Created on {formatDate(request.createdAt)}
                    </p>
                    {request.type === "change" &&
                      request.implementationDate && (
                        <p className="text-sm text-muted-foreground">
                          Implementation:{" "}
                          {formatDate(request.implementationDate)}
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      request.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : request.status === "approved"
                        ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {request.type === "change"
                      ? "Change Request"
                      : "Asset Request"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No requests found.</p>
        )}
      </CardContent>
    </Card>
  );
};
