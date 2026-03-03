"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ListChecks,
  FileQuestion,
  ClipboardList,
  Award,
  Video,
  FileText,
  MessageSquare,
  TrendingUp,
  Star,
} from "lucide-react";

interface StudentCourseNavbarProps {
  courseId: string;
}

const routes = [
  {
    label: "Overview",
    href: "",
    icon: BookOpen,
  },
  {
    label: "Content",
    href: "#chapters",
    icon: ListChecks,
  },
  {
    label: "Assignments",
    href: "/assignments",
    icon: ClipboardList,
  },
  {
    label: "Quizzes",
    href: "/quizzes",
    icon: FileQuestion,
  },
  {
    label: "Notes",
    href: "/notes",
    icon: FileText,
  },
  {
    label: "Certificate",
    href: "/certificate",
    icon: Award,
  },
  {
    label: "Live Classes",
    href: "/live",
    icon: Video,
  },
  {
    label: "Announcements",
    href: "/announcements",
    icon: MessageSquare,
  },
  {
    label: "Progress",
    href: "/progress",
    icon: TrendingUp,
  },
  {
    label: "Rating",
    href: "/rating",
    icon: Star,
  },
];

export const StudentCourseNavbar = ({ courseId }: StudentCourseNavbarProps) => {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b bg-white dark:bg-slate-900 px-6 py-4">
      {routes.map((route) => {
        const href = route.href.startsWith("#") 
          ? `/courses/${courseId}${route.href}`
          : `/courses/${courseId}${route.href}`;
        
        const isActive = 
          (pathname === href) || 
          (pathname === `/courses/${courseId}` && route.href === "") ||
          (route.href !== "" && !route.href.startsWith("#") && pathname?.startsWith(href));

        const Icon = route.icon;

        return (
          <Link
            key={route.href}
            href={href}
            className={cn(
              "flex items-center gap-x-2 text-sm font-medium px-4 py-2 rounded-lg transition-all whitespace-nowrap",
              isActive
                ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{route.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
