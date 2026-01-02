import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MessagesPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  const messages = await db.userMessage.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no messages yet.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border rounded-md p-3 space-y-1 bg-card"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>From: Admin</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="font-semibold text-sm">{message.title}</h3>
                  <p className="text-sm whitespace-pre-line">{message.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagesPage;
