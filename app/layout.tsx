import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { auth } from "@/auth";
import "./globals.css";
import { ConfettiProvider } from "@/components/providers/confetti-provider";
import { ToastProvider } from "@/components/providers/toaster-provider";
import { SessionWrapper } from "@/components/providers/session-provider";
import { ReduxProvider } from "@/components/providers/redux-provider";

// Optimize font loading - only load weights actually used
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: {
    default: "Education - LMS Platform",
    template: "%s | Education",
  },
  description:
    "A comprehensive Learning Management System for online education",
  keywords: ["LMS", "education", "online learning", "courses"],
  authors: [{ name: "Education" }],
  creator: "Education",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionWrapper session={session}>
      <html lang="en" suppressHydrationWarning>
        <body className={poppins.className}>
          <ReduxProvider>
            <ConfettiProvider />
            <ToastProvider />
            {children}
          </ReduxProvider>
        </body>
      </html>
    </SessionWrapper>
  );
}
