"use client";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  BarChart2,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { UserButton } from "@/app/(dashboard)/_components/user-button";
import { SidebarItem } from "@/app/(dashboard)/_components/sidebar-item";

const adminRoutes = [
  {
    icon: LayoutDashboard,
    label: "Overview",
    href: "/admin",
  },
  {
    icon: Users,
    label: "Users",
    href: "/admin/users",
  },
  {
    icon: BookOpen,
    label: "Courses",
    href: "/admin/courses",
  },
  {
    icon: BarChart2,
    label: "Analytics",
    href: "/admin/analytics",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/admin/settings",
  },
];

export const AdminSidebar = () => {
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6 pt-8">
        <Logo />
      </div>
      <div className="flex flex-col w-full flex-grow">
        {adminRoutes.map((route) => (
          <SidebarItem
            key={route.href}
            icon={route.icon}
            label={route.label}
            href={route.href}
          />
        ))}
      </div>
      <div className="p-4">
        <UserButton />
      </div>
    </div>
  );
};
