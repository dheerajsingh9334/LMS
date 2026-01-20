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
      if (!token.sub) return token;

      // Fetch the existing user by ID
      const existingUser = await getUserById(token.sub);
      if (!existingUser) {
        return token;
      }

      // Fetch the existing account
      const existingAccount = await getAccountByUserId(existingUser.id);
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.userType = existingUser.userType;

      // Check if the user's email exists in the teacher collection
      if (token.email) {
        const teacher = await db.teacher.findUnique({
          where: {
            email: token.email,
          },
        });

        // If the email is found in the teacher collection and the user's current role is not already "TEACHER"
        if (teacher && existingUser.role !== UserRole.TEACHER) {
          token.role = UserRole.TEACHER;

          // Update the user's role in the MongoDB database
          await db.user.update({
            where: { id: existingUser.id },
            data: { role: UserRole.TEACHER },
          });
        }
      }

      return token;
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
