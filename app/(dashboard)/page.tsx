import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

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

  // All cases above redirect; this is never rendered.
  return null;
};

export default MainDashboardPage;
