"use client";

import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Archive,
  Settings,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

// ============================================================================
// Types
// ============================================================================

interface NotificationV2 {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface SSEMessage {
  type: string;
  data: any;
  clientId?: string;
}

// Category badge colors
const categoryColors: Record<string, string> = {
  COURSE: "bg-blue-100 text-blue-700",
  LIVE_SESSION: "bg-red-100 text-red-700",
  ASSIGNMENT: "bg-orange-100 text-orange-700",
  QUIZ: "bg-purple-100 text-purple-700",
  ANNOUNCEMENT: "bg-green-100 text-green-700",
  CERTIFICATE: "bg-yellow-100 text-yellow-700",
  PAYMENT: "bg-emerald-100 text-emerald-700",
  SYSTEM: "bg-gray-100 text-gray-700",
  DISCUSSION: "bg-indigo-100 text-indigo-700",
  GRADE: "bg-pink-100 text-pink-700",
};

const priorityDot: Record<string, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500 animate-pulse",
};

// ============================================================================
// Enhanced Notification Bell with SSE
// ============================================================================

export const EnhancedNotificationBell = () => {
  const [notifications, setNotifications] = useState<NotificationV2[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [showLiveIndicator, setShowLiveIndicator] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const user = useCurrentUser();

  // Fetch notifications from the v2 API
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filter) params.set("category", filter);

      const response = await axios.get(`/api/notifications/v2?${params}`);
      const data = response.data;

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [filter]);

  // Connect to SSE stream for real-time updates
  const connectSSE = useCallback(() => {
    if (!user?.id || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource("/api/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);

          switch (message.type) {
            case "notification":
              // Add new notification to the top
              setNotifications((prev) => [message.data, ...prev.slice(0, 19)]);
              setUnreadCount((prev) => prev + 1);
              // Flash the bell
              setShowLiveIndicator(true);
              setTimeout(() => setShowLiveIndicator(false), 3000);
              break;

            case "live_session_started":
              // Show live indicator
              setShowLiveIndicator(true);
              // Add to notifications
              setNotifications((prev) => [
                {
                  id: `live_${message.data.sessionId}`,
                  title: "🔴 Live Session Started!",
                  body: `${message.data.teacherName} is now LIVE: "${message.data.sessionTitle}"`,
                  category: "LIVE_SESSION",
                  priority: "URGENT",
                  actionUrl: message.data.url,
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 19),
              ]);
              setUnreadCount((prev) => prev + 1);
              break;

            case "live_session_ended":
              setShowLiveIndicator(false);
              break;

            case "global_announcement":
              setNotifications((prev) => [
                {
                  id: `ga_${message.data.id}`,
                  title: "📢 " + message.data.title,
                  body: message.data.content,
                  category: "ANNOUNCEMENT",
                  priority: "HIGH",
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 19),
              ]);
              setUnreadCount((prev) => prev + 1);
              break;

            case "system_maintenance":
              setNotifications((prev) => [
                {
                  id: `sys_${Date.now()}`,
                  title: "⚠️ System Maintenance",
                  body: message.data.message,
                  category: "SYSTEM",
                  priority: "URGENT",
                  isRead: false,
                  createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 19),
              ]);
              setUnreadCount((prev) => prev + 1);
              break;
          }
        } catch (e) {
          // Ignore parse errors (heartbeats, etc.)
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;

        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, 5000);
      };
    } catch (error) {
      console.error("Failed to connect SSE:", error);
    }
  }, [user?.id]);

  // Initialize
  useEffect(() => {
    fetchNotifications();
    connectSSE();

    // Fallback: poll every 60 seconds (SSE handles real-time)
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      clearInterval(interval);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchNotifications, connectSSE]);

  // Refetch when filter changes
  useEffect(() => {
    fetchNotifications();
  }, [filter, fetchNotifications]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await axios.post("/api/notifications/v2", {
        action: "mark_read",
        notificationIds,
      });
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post("/api/notifications/v2", { action: "mark_all_read" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: NotificationV2) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell
            className={`h-5 w-5 transition-all ${
              showLiveIndicator ? "text-red-500 animate-bounce" : ""
            }`}
          />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          {showLiveIndicator && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 animate-ping" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px]">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  markAllAsRead();
                }}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Read all
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.preventDefault();
                router.push("/settings");
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-3 py-2 border-b flex gap-1 overflow-x-auto">
          <Button
            variant={filter === null ? "default" : "ghost"}
            size="sm"
            className="h-6 text-[11px] px-2 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              setFilter(null);
            }}
          >
            All
          </Button>
          {["LIVE_SESSION", "COURSE", "ASSIGNMENT", "ANNOUNCEMENT"].map(
            (cat) => (
              <Button
                key={cat}
                variant={filter === cat ? "default" : "ghost"}
                size="sm"
                className="h-6 text-[11px] px-2 shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  setFilter(filter === cat ? null : cat);
                }}
              >
                {cat.replace("_", " ")}
              </Button>
            ),
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer block ${
                  !notification.isRead
                    ? "bg-blue-50/50 dark:bg-blue-950/20"
                    : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2.5 w-full">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      priorityDot[notification.priority] || "bg-gray-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <div className="mt-1.5">
                      <span
                        className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          categoryColors[notification.category] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {notification.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/notifications");
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedNotificationBell;
