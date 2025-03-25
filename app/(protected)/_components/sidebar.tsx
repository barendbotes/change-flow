"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Laptop,
  CheckSquare,
  Settings,
  LogOut,
  Users,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { ExtendedUser } from "@/next-auth";
import { logout } from "@/actions/logout";
import { UserButton } from "@/components/auth/user-botton";
import { ModeToggle } from "@/components/theme-toggle";

interface SidebarNavProps {
  user?: ExtendedUser;
  label?: string;
}

export function SidebarNav({ user, label }: SidebarNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["user", "manager", "admin"],
    },
    {
      href: "/request-for-change",
      label: "Request for Change",
      icon: FileText,
      roles: ["user", "manager", "admin"],
      groups: ["IT"],
    },
    {
      href: "/asset-request",
      label: "Asset Request",
      icon: Laptop,
      roles: ["user", "manager", "admin"],
      groups: ["Corporate"],
    },
    {
      href: "/approvals",
      label: "Approvals",
      icon: CheckSquare,
      roles: ["manager", "admin"],
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileText,
      roles: ["manager", "admin"],
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Settings,
      roles: ["admin"],
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
      roles: ["admin"],
    },
  ];

  // Filter routes based on user roles and groups
  const filteredRoutes = routes.filter((route) => {
    // Debugging - log user roles to see what's available
    console.log(
      "User roles:",
      user?.roles?.map((r) => r.name)
    );
    console.log("Route requires roles:", route.roles);

    // First, check if user has roles at all
    if (!user?.roles || user.roles.length === 0) {
      return false;
    }

    // Check if user has any of the required roles (case-insensitive)
    const hasRequiredRole = user.roles.some((role) => {
      // Check for undefined role.name
      if (!role.name) return false;

      return route.roles.some(
        (routeRole) => role.name.toLowerCase() === routeRole.toLowerCase()
      );
    });

    // If route has group requirements, check if user belongs to any of them
    if (route.groups && hasRequiredRole) {
      // First check if user has any groups
      if (!user.userGroups || user.userGroups.length === 0) {
        return false;
      }

      const hasRequiredGroup = user.userGroups.some((userGroup) => {
        // Check for undefined group data
        if (!userGroup.group || !userGroup.group.name) return false;

        return route.groups.some(
          (routeGroup) =>
            userGroup.group.name.toLowerCase() === routeGroup.toLowerCase()
        );
      });
      return hasRequiredRole && hasRequiredGroup;
    }

    return hasRequiredRole;
  });

  return (
    <SidebarProvider>
      {/* Mobile menu button - only visible on small screens */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Sidebar className={`${isMobileMenuOpen ? "block" : "hidden"} md:block`}>
        <SidebarHeader className="flex items-center px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-mono font-bold">ChangeFlow</span>
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarMenu>
            {filteredRoutes.map((route) => (
              <SidebarMenuItem key={route.href}>
                <SidebarMenuButton asChild isActive={pathname === route.href}>
                  <Link href={route.href}>
                    <route.icon className="h-5 w-5" />
                    <span>{route.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        {/* <SidebarFooter className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.roles?.map((role) => role.name).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                Groups:{" "}
                {user?.userGroups?.map((group) => group.group.name).join(", ")}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <Button
                onClick={logout}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </SidebarFooter> */}
        <SidebarFooter>
          <UserButton />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
