import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const MainDashboardPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  // Redirect based on user role
  switch (user.role) {
    case UserRole.ADMIN:
      return redirect("/admin");
    case UserRole.TEACHER:
      return redirect("/teacher/dashboard");
    case UserRole.USER:
    default:
      return redirect("/student/dashboard");
  }
};

export default MainDashboardPage;
