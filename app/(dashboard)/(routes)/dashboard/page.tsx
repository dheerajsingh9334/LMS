import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const DashboardIndexPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    redirect("/auth/login");
  }

  switch (user.role) {
    case UserRole.ADMIN:
      redirect("/admin");
    case UserRole.TEACHER:
      redirect("/teacher/dashboard");
    case UserRole.USER:
    default:
      redirect("/student/dashboard");
  }

  // All paths above redirect; this is never rendered.
  return null;
};

export default DashboardIndexPage;
