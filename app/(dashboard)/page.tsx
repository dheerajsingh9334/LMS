import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { DashboardClientMarker } from "./_components/dashboard-client-marker";

const MainDashboardPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    redirect("/auth/login");
  }

  // Redirect based on user role
  switch (user.role) {
    case UserRole.ADMIN:
      redirect("/admin");
    case UserRole.TEACHER:
      redirect("/teacher/dashboard");
    case UserRole.USER:
    default:
      redirect("/student/dashboard");
  }

  // Unreachable at runtime, but ensures a client reference
  return <DashboardClientMarker />;
};

export default MainDashboardPage;
