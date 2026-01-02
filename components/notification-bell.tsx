"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  interface ApiNotification {
    id: string;
    courseName: string;
    content: string;
    teacherImage?: string | null;
    timeAgo: string;
    isRead: boolean;
  }

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/api/user/notifications");
      const apiData = response.data?.Notifications as
        | ApiNotification[]
        | undefined;
      if (!apiData) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      setNotifications(apiData as any);
      setUnreadCount(apiData.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(`/api/user/notifications/${notificationId}`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer ${
                  !notification.isRead ? "bg-blue-50" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {notification.content || "🔴 Live Class Started!"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.courseName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.timeAgo}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
