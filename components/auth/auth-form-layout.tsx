"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterLink {
  text: string;
  linkText: string;
  href: string;
  color?: string;
}

interface AuthFormLayoutProps {
  children: React.ReactNode;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Title shown below the icon */
  title: string;
  /** Subtitle / description */
  subtitle: string;
  /** Tailwind gradient classes for the page background */
  bgGradient?: string;
  /** Tailwind bg class for the icon circle */
  iconBg?: string;
  /** Footer navigation links (sign in / register / switch role) */
  footerLinks?: FooterLink[];
  /** "Back to home" href — defaults to "/" */
  backHref?: string;
  /** Text colour for accent back link */
  backLinkClass?: string;
}

export const AuthFormLayout = ({
  children,
  icon: Icon,
  title,
  subtitle,
  bgGradient = "from-slate-50 to-gray-100",
  iconBg = "bg-primary",
  footerLinks = [],
  backHref = "/",
  backLinkClass = "text-gray-600 hover:text-gray-900",
}: AuthFormLayoutProps) => {
  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-gradient-to-br p-4",
        bgGradient,
      )}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className={cn(
                "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
                iconBg,
              )}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {/* Form content rendered by caller */}
          {children}

          {/* Footer links */}
          {footerLinks.length > 0 && (
            <div className="mt-6 space-y-4">
              {footerLinks.map((link, idx) => (
                <div key={idx}>
                  {idx > 0 && (
                    <div className="relative mb-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                      </div>
                    </div>
                  )}
                  <div className="text-center text-sm text-gray-600">
                    {link.text}{" "}
                    <Link
                      href={link.href}
                      className={cn(
                        "font-semibold",
                        link.color ?? "text-primary hover:text-primary/80",
                      )}
                    >
                      {link.linkText}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            href={backHref}
            className={cn("text-sm underline", backLinkClass)}
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
