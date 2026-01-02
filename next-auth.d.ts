import { UserRole, UserType } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole;
  userType: UserType;
  isOAuth: boolean;
  // Student fields
  dateOfBirth?: Date;
  gender?: string;
  // Teacher fields
  headline?: string;
  bio?: string;
  achievements?: string[];
  socialLinks?: any;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
