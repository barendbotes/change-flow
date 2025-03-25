"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { FormError } from "../form-error";
import { ExtendedUser } from "@/next-auth";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: ExtendedUser["role"];
}

export const RoleGate = ({ children, allowedRole }: RoleGateProps) => {
  const role = useCurrentRole();
  if (role !== allowedRole) {
    return (
      <FormError message="You do not have permission to view this content" />
    );
  }
  return <>{children}</>;
};
