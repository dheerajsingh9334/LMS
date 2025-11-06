"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { useEffect } from "react";

interface RoleProtectedPageProps {
  children: React.ReactNode;
  allowedRole: UserRole;
  fallbackPath?: string;
}

export const RoleProtectedPage = ({ 
  children, 
  allowedRole, 
  fallbackPath = "/" 
}: RoleProtectedPageProps) => {
  const userRole = useCurrentRole();

  useEffect(() => {
    if (userRole && userRole !== allowedRole) {
      redirect(fallbackPath);
    }
  }, [userRole, allowedRole, fallbackPath]);

  // Show loading state while checking role
  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have the right role
  if (userRole !== allowedRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};