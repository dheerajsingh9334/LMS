import type { NextAuthConfig } from "next-auth";

// Edge-safe base config used by middleware.
// Do NOT import Node-only libraries (e.g. bcrypt, Prisma) here,
// because this file is consumed by Next.js middleware (Edge runtime).
const authConfig: NextAuthConfig = {
  // Keep any shared, runtime-agnostic settings here.
  // The detailed providers/adapter/callbacks live in auth.ts (Node runtime).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  // Trust the request host (prevents UntrustedHost errors in Edge/middleware).
  // In production, ensure NEXTAUTH_URL is set as well on the hosting platform.
  trustHost: true,
  // No providers here: middleware only needs to read/verify sessions.
  // Defining an empty array satisfies the type without pulling in
  // Node-only providers like bcrypt-based credentials.
  providers: [],
};

export default authConfig;
