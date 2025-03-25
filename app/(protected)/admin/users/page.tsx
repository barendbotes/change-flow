import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersList } from "@/components/admin/users-list";

export default async function UsersPage() {
  const user = await currentUser();

  // Check if user has admin role
  if (user?.roles?.some((role) => role.name === "Admin")) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  // Fetch all users with their roles and groups
  const users = await db.query.users.findMany({
    with: {
      userRoles: {
        with: {
          role: true,
        },
      },
      userGroups: {
        with: {
          group: true,
        },
      },
      approver: true,
    },
  });

  // Fetch all roles and groups for the form
  const roles = await db.query.roles.findMany();
  const groups = await db.query.groups.findMany();

  // Get managers and admins for approver selection
  const managers = users.filter((user) =>
    user.userRoles.some(
      (ur) =>
        ur.role.name.toLowerCase() === "manager" ||
        ur.role.name.toLowerCase() === "admin"
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage user accounts.
        </p>
      </div>

      <UsersList
        users={users}
        roles={roles}
        groups={groups}
        managers={managers}
      />
    </div>
  );
}
