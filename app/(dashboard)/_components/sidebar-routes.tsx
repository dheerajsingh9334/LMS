"use client";

import {
  BarChart,
  Bell,
  Compass,
  Heart,
  Layout,
  List,
  LayoutDashboard,
  ListChecks,
  FileQuestion,
  ClipboardList,
  Award,
  Video,
  FileText,
  Settings,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Star,
  TrendingUp,
  MessageSquare,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarItem } from "./sidebar-item";
import { FaChalkboardTeacher } from "react-icons/fa";
import { useEffect, useState } from "react";

const studentRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/student/dashboard",
  },
  {
    icon: BookOpen,
    label: "My Courses",
    href: "/dashboard/my-courses",
  },
  {
    icon: Compass,
    label: "Browse Courses",
    href: "/browse",
  },
  {
    icon: BarChart,
    label: "Analytics",
    href: "/student/analytics",
  },
  {
    icon: Award,
    label: "Certificates",
    href: "/dashboard/certificates",
  },
  {
    icon: Heart,
    label: "Favorites",
    href: "/collections/favorites",
  },
  {
    icon: Clock,
    label: "Watch Later",
    href: "/collections/watch-later",
  },
  {
    icon: TrendingUp,
    label: "My Progress",
    href: "/dashboard/progress",
  },
  {
    icon: FileText,
    label: "My Notes",
    href: "/dashboard/my-notes",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    href: "/dashboard/messages",
  },
  {
    icon: User,
    label: "Profile",
    href: "/profile",
  },
];

const teacherRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/teacher/dashboard",
  },
  {
    icon: List,
    label: "Courses",
    href: "/teacher/courses",
  },
  {
    icon: BarChart,
    label: "Analytics",
    href: "/teacher/analytics",
  },
  {
    icon: Bell,
    label: "Announcements",
    href: "/teacher/announcements",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    href: "/dashboard/messages",
  },
  {
    icon: User,
    label: "Profile",
    href: "/profile",
  },
];

const getTeacherCourseRoutes = (courseId: string) => [
  {
    icon: LayoutDashboard,
    label: "Course Setup",
    href: `/teacher/courses/${courseId}`,
  },
  {
    icon: ListChecks,
    label: "Chapters",
    href: `/teacher/courses/${courseId}#chapters`,
  },
  {
    icon: FileQuestion,
    label: "Quizzes",
    href: `/teacher/courses/${courseId}#quizzes`,
  },
  {
    icon: ClipboardList,
    label: "Assignments",
    href: `/teacher/courses/${courseId}/assignments`,
  },
  {
    icon: Award,
    label: "Certificates",
    href: `/teacher/courses/${courseId}/certificates`,
  },
  {
    icon: Video,
    label: "Live Sessions",
    href: `/teacher/courses/${courseId}#live`,
  },
  {
    icon: FileText,
    label: "Resources",
    href: `/teacher/courses/${courseId}#resources`,
  },
  {
    icon: Users,
    label: "Students",
    href: `/teacher/courses/${courseId}/students`,
  },
  {
    icon: BarChart,
    label: "Course Analytics",
    href: `/teacher/courses/${courseId}/analytics`,
  },
];

const getStudentCourseRoutes = (courseId: string) => [
  {
    icon: BookOpen,
    label: "Course Overview",
    href: `/courses/${courseId}`,
  },
  {
    icon: ListChecks,
    label: "Course Content",
    href: `/courses/${courseId}#chapters`,
  },
  {
    icon: ClipboardList,
    label: "Assignments",
    href: `/courses/${courseId}/assignments`,
  },
  {
    icon: FileQuestion,
    label: "Quizzes",
    href: `/courses/${courseId}/quizzes`,
  },
  {
    icon: FileText,
    label: "Notes",
    href: `/courses/${courseId}/notes`,
  },
  {
    icon: Award,
    label: "Certificate",
    href: `/courses/${courseId}/certificate`,
  },
  {
    icon: Video,
    label: "Live Classes",
    href: `/courses/${courseId}/live`,
  },
  {
    icon: MessageSquare,
    label: "Announcements",
    href: `/courses/${courseId}/announcements`,
  },
  {
    icon: TrendingUp,
    label: "My Progress",
    href: `/courses/${courseId}/progress`,
  },
  {
    icon: Star,
    label: "Rate Course",
    href: `/courses/${courseId}/rating`,
  },
];

export const SidebarRoutes = () => {
  const pathname = usePathname();
  const [teacherCourseId, setTeacherCourseId] = useState<string | null>(null);
  const [studentCourseId, setStudentCourseId] = useState<string | null>(null);

  useEffect(() => {
    // Extract courseId from pathname for teacher
    const teacherMatch = pathname?.match(/\/teacher\/courses\/([^\/]+)/);
    if (teacherMatch && teacherMatch[1] && teacherMatch[1] !== "create") {
      setTeacherCourseId(teacherMatch[1]);
    } else {
      setTeacherCourseId(null);
    }

    // Extract courseId from pathname for student
    const studentMatch = pathname?.match(/\/courses\/([^\/]+)/);
    if (studentMatch && studentMatch[1] && !pathname?.includes("/teacher")) {
      setStudentCourseId(studentMatch[1]);
    } else {
      setStudentCourseId(null);
    }
  }, [pathname]);

  const isTeacherPage = pathname?.includes("/teacher");

  // Determine which routes to show
  let routes = isTeacherPage ? teacherRoutes : studentRoutes;

  // If teacher is viewing a specific course
  if (
    teacherCourseId &&
    pathname?.includes(`/teacher/courses/${teacherCourseId}`)
  ) {
    routes = [...teacherRoutes, ...getTeacherCourseRoutes(teacherCourseId)];
  }

  // If student is viewing a specific course
  if (studentCourseId && pathname?.includes(`/courses/${studentCourseId}`)) {
    routes = [...studentRoutes, ...getStudentCourseRoutes(studentCourseId)];
  }

  return (
    <div className="flex flex-col w-full">
      {routes.map((route: any) =>
        route.isHeader ? (
          <div
            key={route.href}
            className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4"
          >
            {route.label}
          </div>
        ) : (
          <SidebarItem
            key={route.href}
            icon={route.icon}
            label={route.label}
            href={route.href}
          />
        )
      )}
    </div>
  );
};
