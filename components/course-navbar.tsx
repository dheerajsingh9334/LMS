"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  FileQuestion,
  ClipboardList,
  Award,
  Video,
  FileText,
  Users,
  BarChart,
  GraduationCap,
} from "lucide-react";

interface CourseNavbarProps {
  courseId: string;
}

const routes = [
  {
    label: "Setup",
    href: "",
    icon: LayoutDashboard,
  },
  {
    label: "Chapters",
    href: "/chapters",
    icon: ListChecks,
  },
  {
    label: "Quizzes",
    href: "/quizzes",
    icon: FileQuestion,
  },
  {
    label: "Assignments",
    href: "/assignments",
    icon: ClipboardList,
  },
  {
    label: "Final Exams",
    href: "/final-exams",
    icon: GraduationCap,
  },
  {
    label: "Certificates",
    href: "/certificates",
    icon: Award,
  },
  {
    label: "Live Sessions",
    href: "/live-sessions",
    icon: Video,
  },
  {
    label: "Resources",
    href: "/resources",
    icon: FileText,
  },
  {
    label: "Students",
    href: "/students",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart,
  },
];

export const CourseNavbar = ({ courseId }: CourseNavbarProps) => {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b bg-white dark:bg-slate-900 px-6 py-4">
      {routes.map((route) => {
        const href = `/teacher/courses/${courseId}${route.href}`;
        const isActive = 
          (pathname === href) || 
          (pathname === `/teacher/courses/${courseId}` && route.href === "") ||
          (route.href !== "" && pathname?.startsWith(href));

        const Icon = route.icon;

        return (
          <Link
            key={route.href}
            href={href}
            className={cn(
              "flex items-center gap-x-2 text-sm font-medium px-4 py-2 rounded-lg transition-all whitespace-nowrap",
              isActive
                ? "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-200"
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
