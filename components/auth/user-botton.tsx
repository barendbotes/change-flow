"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChevronsUpDown,
  ExternalLink,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { SidebarMenuButton } from "../ui/sidebar";
import { ModeToggle } from "../theme-toggle";

export const UserButton = () => {
  const user = useCurrentUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Avatar>
              <AvatarImage
                src={user?.image || ""}
                alt={user?.name || "guest"}
              />
              <AvatarFallback className="bg-primary">
                <UserIcon
                  width={24}
                  height={24}
                  className="text-primary-foreground"
                />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">{user?.name}</span>
            <span className="">{user?.email}</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Button variant="ghost" className="w-full justify-start p-0 ">
          <SettingsIcon className="ml-2 h-4 w-4" />
          <DropdownMenuItem asChild>
            <Link className="cursor-pointer" href="/settings">
              Settings
            </Link>
          </DropdownMenuItem>
        </Button>
        <DropdownMenuSeparator />

        <ModeToggle />

        <DropdownMenuSeparator />
        <LogoutButton>
          <DropdownMenuItem className="cursor-pointer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
