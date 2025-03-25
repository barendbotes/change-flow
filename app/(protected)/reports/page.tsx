import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsTable } from "./_components/reports-table";
import { db } from "@/lib/db";
import { groups, requests, requestTypes } from "@/schemas/schema";

export default async function ReportsPage() {
  const user = await currentUser();

  // Check if user is logged in
  if (!user) {
    redirect("/auth/login");
  }

  // Check if user has admin or manager role
  const isAuthorized = user.roles?.some((role) =>
    ["admin", "manager"].includes(role.name.toLowerCase())
  );

  if (!isAuthorized) {
    redirect("/dashboard"); // Redirect unauthorized users
  }

  // Debug info: Check what's in the database
  console.log("Reports page: Checking database content...");

  // Count the number of requests by type
  const requestsByType = await db.query.requestTypes.findMany({
    with: {
      requests: true,
    },
  });

  requestsByType.forEach((type) => {
    console.log(`${type.name} count:`, type.requests.length);
  });

  // Count the number of requests by status
  const requests = await db.query.requests.findMany();
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  console.log("Requests by status:", {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    total: requests.length,
  });

  // Count the number of groups
  const groupCount = await db
    .select({ count: { value: groups.id } })
    .from(groups);
  console.log("Groups count:", groupCount[0]?.count?.value || 0);

  const isAdmin = user.roles?.some(
    (role) => role.name.toLowerCase() === "admin"
  );

  // Get user groups for filtering (if manager)
  const userGroups = !isAdmin
    ? user.userGroups?.map((ug) => ug.group.id)
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      <ReportsTable isAdmin={isAdmin} userGroups={userGroups} />
    </div>
  );
}
