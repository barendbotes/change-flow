import { ChangeRequestForm } from "@/components/forms/change-request-form";
import { currentUser } from "@/lib/auth";

export default async function RequestForChangePage() {
  const user = await currentUser();

  if (!user?.id) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be logged in to access this page.
        </p>
      </div>
    );
  }

  // Check if user has admin role or belongs to IT group
  const isAdmin = user.roles?.some(
    (role) => role.name.toLowerCase() === "admin"
  );
  const isITGroup = user.userGroups?.some(
    (group) => group.group.name.toLowerCase() === "it"
  );

  if (!isAdmin && !isITGroup) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page. This page is restricted
          to IT group members and administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          Request for Change
        </h1>
        <p className="text-muted-foreground">
          Submit a request for IT infrastructure or system changes.
        </p>
      </div>

      <ChangeRequestForm userId={user.id} />
    </div>
  );
}
