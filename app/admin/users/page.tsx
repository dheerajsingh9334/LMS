import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminUserActions } from "./_components/admin-user-actions";

const AdminUsersPage = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/auth/login");
  }

  if (user.role !== UserRole.ADMIN) {
    return redirect("/dashboard");
  }

  const users = await db.user.findMany({
    orderBy: { id: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userType: true,
    },
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name || "-"}</TableCell>
                  <TableCell>{u.email || "-"}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.userType}</TableCell>
                  <TableCell>
                    <AdminUserActions
                      userId={u.id}
                      userName={u.name || u.email || "User"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
