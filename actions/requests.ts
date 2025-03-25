"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  requests,
  userGroups,
  attachments,
  users,
  approvals,
  requestTypes,
} from "@/schemas/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { hasApprovalRole } from "@/lib/admin";
import { NextResponse } from "next/server";

const requestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requestTypeId: z.string().min(1, "Request type is required"),
  data: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
});

const changeRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  changeType: z.enum(["hardware", "software", "network", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  implementationDate: z.string(),
  impact: z
    .string()
    .min(10, "Impact description must be at least 10 characters"),
  rollbackPlan: z
    .string()
    .min(10, "Rollback plan must be at least 10 characters"),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        file: z.instanceof(File).optional(),
        url: z.string().optional(),
      })
    )
    .optional(),
});

export const createRequest = async (data: z.infer<typeof requestSchema>) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Validate input data
  const validatedData = requestSchema.parse(data);

  // Create request
  const [newRequest] = await db
    .insert(requests)
    .values({
      title: validatedData.title,
      description: validatedData.description,
      requestTypeId: validatedData.requestTypeId,
      userId: user.id,
      data: validatedData.data || {},
      status: "pending",
    })
    .returning();

  // Create attachments if provided
  if (validatedData.attachments?.length) {
    await db.insert(attachments).values(
      validatedData.attachments.map((url) => ({
        requestId: newRequest.id,
        fileUrl: url,
        fileName: url.split("/").pop() || "",
      }))
    );
  }

  return newRequest;
};

export const createChangeRequest = async (
  data: z.infer<typeof changeRequestSchema>
) => {
  const user = await currentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Get the IT Change Request type
  const changeRequestType = await db.query.requestTypes.findFirst({
    where: eq(requestTypes.name, "IT Change Request"),
  });

  if (!changeRequestType) {
    throw new Error("IT Change Request type not found");
  }

  // Get the user's approver (typically their manager)
  const userData = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      approverId: true,
    },
  });

  const approverId = userData?.approverId;

  if (!approverId) {
    throw new Error("No approver assigned to this user");
  }

  // Create request with change request data
  const [newRequest] = await db
    .insert(requests)
    .values({
      title: data.title,
      description: data.description,
      requestTypeId: changeRequestType.id,
      userId: user.id,
      status: "pending",
      data: {
        changeType: data.changeType,
        priority: data.priority,
        implementationDate: data.implementationDate,
        impact: data.impact,
        rollbackPlan: data.rollbackPlan,
      },
    })
    .returning();

  // Create an approval record
  await db.insert(approvals).values({
    requestId: newRequest.id,
    approverId: approverId,
    status: "pending",
  });

  // Create attachments if provided
  if (data.attachments?.length) {
    await db.insert(attachments).values(
      data.attachments
        .filter((attachment) => attachment.url)
        .map((attachment) => ({
          requestId: newRequest.id,
          fileUrl: attachment.url!,
          fileName: attachment.name,
          fileSize: String(attachment.size),
          fileType: attachment.type,
        }))
    );
  }

  return newRequest;
};

export const updateRequestStatus = async (
  requestId: string,
  status: "approved" | "rejected",
  notes?: string
) => {
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

  // Check if user has permission to approve this request
  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: {
      user: true,
      requestType: {
        with: {
          group: true,
        },
      },
    },
  });

  if (!request) throw new Error("Request not found");

  const isAdmin = user.roles?.some(
    (role) => role.name.toLowerCase() === "admin"
  );
  const isManager = user.roles?.some(
    (role) => role.name.toLowerCase() === "manager"
  );

  if (!isAdmin && isManager) {
    // Manager can only approve requests from their group
    const requestGroupId = request.requestType.groupId;
    if (!requestGroupId || !userGroupIds.includes(requestGroupId)) {
      throw new Error("You don't have permission to approve this request");
    }
  }

  // Update request status
  const [updatedRequest] = await db
    .update(requests)
    .set({
      status,
      data: {
        ...(typeof request.data === "object" ? request.data : {}),
        notes: notes || null,
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    })
    .where(eq(requests.id, requestId))
    .returning();

  return updatedRequest;
};

export const getChangeRequestApprovalLink = async (requestId: string) => {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/request-for-change/${requestId}`;
};

export async function POST(req: Request) {
  throw new Error(
    "This function should be defined in the API route file, not here."
  );
}
