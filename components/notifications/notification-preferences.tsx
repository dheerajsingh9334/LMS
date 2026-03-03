"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, Mail, Smartphone, Volume2 } from "lucide-react";

const NOTIFICATION_CATEGORIES = [
  {
    key: "COURSE",
    label: "Course Updates",
    description: "New chapters, updates, and completion",
  },
  {
    key: "LIVE_SESSION",
    label: "Live Sessions",
    description: "Session starts, scheduled events, and reminders",
  },
  {
    key: "ASSIGNMENT",
    label: "Assignments",
    description: "New assignments, due reminders, and grading",
  },
  { key: "QUIZ", label: "Quizzes", description: "New quizzes and results" },
  {
    key: "ANNOUNCEMENT",
    label: "Announcements",
    description: "Course and platform announcements",
  },
  {
    key: "CERTIFICATE",
    label: "Certificates",
    description: "Certificate issuance and downloads",
  },
  {
    key: "PAYMENT",
    label: "Payments",
    description: "Payment confirmations and failures",
  },
  {
    key: "DISCUSSION",
    label: "Discussions",
    description: "Replies and mentions",
  },
  { key: "GRADE", label: "Grades", description: "Assignment and exam grades" },
  {
    key: "SYSTEM",
    label: "System",
    description: "Maintenance and platform updates",
  },
];

const DIGEST_OPTIONS = [
  {
    value: "INSTANT",
    label: "Instant",
    description: "Get notified immediately",
  },
  {
    value: "DAILY",
    label: "Daily Digest",
    description: "Once per day summary",
  },
  {
    value: "WEEKLY",
    label: "Weekly Digest",
    description: "Once per week summary",
  },
];

export function NotificationPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    categoryPreferences: {} as Record<string, boolean>,
    quietHoursStart: null as number | null,
    quietHoursEnd: null as number | null,
    digestFrequency: "INSTANT",
  });

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await axios.get("/api/notifications/preferences");
      setPreferences({
        emailEnabled: response.data.emailEnabled ?? true,
        pushEnabled: response.data.pushEnabled ?? true,
        inAppEnabled: response.data.inAppEnabled ?? true,
        categoryPreferences: response.data.categoryPreferences || {},
        quietHoursStart: response.data.quietHoursStart,
        quietHoursEnd: response.data.quietHoursEnd,
        digestFrequency: response.data.digestFrequency || "INSTANT",
      });
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.put("/api/notifications/preferences", preferences);
      toast.success("Notification preferences saved!");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      categoryPreferences: {
        ...prev.categoryPreferences,
        [key]: !(prev.categoryPreferences[key] ?? true),
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-1">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Control how and when you receive notifications.
        </p>
      </div>

      {/* Channels */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Notification Channels
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">In-App Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Show in notification bell
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, inAppEnabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Send to your registered email
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, emailEnabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Browser / mobile push (coming soon)
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, pushEnabled: checked }))
              }
            />
          </div>
        </div>
      </div>

      {/* Email Frequency */}
      {preferences.emailEnabled && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Email Frequency
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DIGEST_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    digestFrequency: option.value,
                  }))
                }
                className={`p-3 rounded-lg border text-left transition-all ${
                  preferences.digestFrequency === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Preferences */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Category Preferences
        </h4>
        <p className="text-xs text-muted-foreground">
          Choose which types of notifications you want to receive via email.
        </p>
        <div className="space-y-2">
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.description}
                </p>
              </div>
              <Switch
                checked={preferences.categoryPreferences[cat.key] ?? true}
                onCheckedChange={() => toggleCategory(cat.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
