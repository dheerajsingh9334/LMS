"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type GlobalAnnouncement = {
  id: string;
  title: string;
  content: string;
};

export const GlobalAnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get("/api/announcements/global");
        const data = res.data ?? null;
        setAnnouncement(data);

        // Check if this announcement was dismissed before
        if (data) {
          const dismissedId = localStorage.getItem("dismissedAnnouncementId");
          if (dismissedId === data.id) {
            setIsVisible(false);
          }
        }
      } catch (error) {
        console.error("Failed to load global announcement", error);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem("dismissedAnnouncementId", announcement.id);
      setIsVisible(false);
    }
  };

  if (!announcement || !isVisible) return null;

  return (
    <div className="border-b bg-muted/60 px-4 py-3">
      <Alert className="max-w-5xl mx-auto flex items-start gap-3 relative pr-12">
        <Megaphone className="h-4 w-4 mt-1 flex-shrink-0 text-blue-600" />
        <div className="flex-1 pr-4">
          <AlertTitle className="font-semibold">
            {announcement.title}
          </AlertTitle>
          <AlertDescription>{announcement.content}</AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 absolute top-1 right-1 hover:bg-muted-foreground/10 flex-shrink-0 z-10 rounded-full border border-muted-foreground/20"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
        >
          <X className="h-5 w-5" />
        </Button>
      </Alert>
    </div>
  );
};
