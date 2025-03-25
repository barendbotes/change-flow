import { currentUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { users, roles, groups } from "@/schemas/schema";
import { sql } from "drizzle-orm";

export default async function AdminPage() {
  const user = await currentUser();

  // Check if user has admin role
  if (!user?.roles?.some((role) => role.name.toLowerCase() === "admin")) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  // Get counts for dashboard
  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const roleCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(roles);
  const groupCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(groups);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage users, roles, and system settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount[0].count}</div>
            <p className="text-xs text-muted-foreground">
              Active users in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCount[0].count}</div>
            <p className="text-xs text-muted-foreground">
              User roles defined in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupCount[0].count}</div>
            <p className="text-xs text-muted-foreground">
              User groups for permission management
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Create, edit, and manage user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>Define and configure user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/roles">
              <Button className="w-full">Manage Roles</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Group Management</CardTitle>
            <CardDescription>Configure groups and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/groups">
              <Button className="w-full">Manage Groups</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
