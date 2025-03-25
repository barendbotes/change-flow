"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  requests,
  groups,
  users,
  approvals,
  requestTypes,
} from "@/schemas/schema";
import { eq, inArray, like, and, or, SQL, sql } from "drizzle-orm";

interface GetReportsParams {
  groups: string[] | null;
  type: string | null;
  searchTerm: string | null;
}

interface ReportData {
  id: string;
  type: string;
  title: string;
  status: string;
  createdBy: string | null;
  createdAt: Date;
  groupName: string | null;
  approvalStatus: string | null;
}

interface GetReportsResult {
  data: ReportData[];
  availableGroups: { id: string; name: string }[];
}

export const getReports = async ({
  groups,
  type,
  searchTerm,
}: GetReportsParams): Promise<GetReportsResult> => {
  try {
    // Get all requests with related data
    const allRequests = await db.query.requests.findMany({
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
      },
    });

    // Filter requests based on parameters
    const filteredRequests = allRequests.filter((request) => {
      // Filter by group if specified
      if (groups && groups.length > 0) {
        if (
          !request.requestType.groupId ||
          !groups.includes(request.requestType.groupId)
        ) {
          return false;
        }
      }

      // Filter by type if specified
      if (type) {
        if (request.requestType.name.toLowerCase() !== type.toLowerCase()) {
          return false;
        }
      }

      // Filter by search term if specified
      if (searchTerm) {
        if (!request.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Format the data
    const formattedData: ReportData[] = filteredRequests.map((request) => {
      // Get the latest approval status
      const latestApproval = request.approvals
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .at(0);

      return {
        id: request.id,
        type: request.requestType.name,
        title: request.title,
        status: request.status,
        createdBy: request.user.name,
        createdAt: request.createdAt,
        groupName: request.requestType.group?.name || null,
        approvalStatus: latestApproval?.status || null,
      };
    });

    // Get available groups for filtering
    const availableGroups = await db.query.groups.findMany({
      orderBy: (groups, { asc }) => [asc(groups.name)],
    });

    return {
      data: formattedData,
      availableGroups: availableGroups.map((group) => ({
        id: group.id,
        name: group.name,
      })),
    };
  } catch (error) {
    console.error("[GET_REPORTS]", error);
    throw new Error("Failed to get reports");
  }
};
