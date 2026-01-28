import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole, UserType } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { LoginSchema } from "@/schemas";
import { getUserById, getUserByEmail } from "@/data/user";
import { getAccountByUserId } from "./data/account";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Allow credentials login (no profile)
      if (!account) return true;

      // For OAuth providers, check email verification
      if (account.provider !== "credentials") {
        if (!profile?.email_verified) {
          return false;
        }
      }

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (token.userType && session.user) {
        session.user.userType = token.userType as UserType;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email!;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      // If there's no subject/user id in token, just return
      if (!token.sub) return token;

      try {
        // Avoid repeated DB work if core fields already exist
        const hasCoreClaims = Boolean(
          token.email &&
          token.name &&
          token.role &&
          token.userType !== undefined,
        );

        // Fetch the existing user by ID only when we don't have all claims
        const existingUser = hasCoreClaims
          ? null
          : await getUserById(token.sub);

        // Populate claims from DB when needed
        if (existingUser) {
          token.name = existingUser.name;
          token.email = existingUser.email;
          token.role = existingUser.role;
          token.userType = existingUser.userType;

          // Fetch the existing account to mark OAuth
          const existingAccount = await getAccountByUserId(existingUser.id);
          token.isOAuth = !!existingAccount;
        }

        // Opportunistic teacher role sync (best-effort, non-fatal)
        if (token.email) {
          const teacher = await db.teacher.findUnique({
            where: { email: token.email },
          });

          if (teacher && token.role !== UserRole.TEACHER) {
            token.role = UserRole.TEACHER;
            // Best-effort DB update; ignore failures
            try {
              await db.user.update({
                where: { id: token.sub },
                data: { role: UserRole.TEACHER },
              });
            } catch (_err) {
              // swallow
            }
          }
        }

        return token;
      } catch (_err) {
        // On any DB/env error, keep existing token without crashing the request
        return token;
      }
    },
  },
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        return user;
      },
    }),
  ],
});
