"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { AdminSidebar } from "@/app/admin/_components/admin-sidebar";

export const MobileSidebar = () => {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-white w-72">
        {isAdminRoute ? <AdminSidebar /> : <Sidebar />}
      </SheetContent>
    </Sheet>
  );
};
