import NextAuth, { type DefaultSession } from "next-auth";

// Define the Role type based on your schema
type Role = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserGroup = {
  group: {
    id: string;
    name: string;
  };
};

export type ExtendedUser = DefaultSession["user"] & {
  roles: Role[];
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  userGroups: UserGroup[];
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: Role[];
    userGroups?: UserGroup[];
  }
}
