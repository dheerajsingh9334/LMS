import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { currentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSettingsPage = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/auth/login");
  }

  if (user.role !== UserRole.ADMIN) {
    return redirect("/dashboard");
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure global platform options (coming soon).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
