"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Megaphone } from "lucide-react";

type GlobalAnnouncement = {
  id: string;
  title: string;
  content: string;
};

export const GlobalAnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(
    null
  );

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get("/api/announcements/global");
        setAnnouncement(res.data ?? null);
      } catch (error) {
        console.error("Failed to load global announcement", error);
      }
    };

    fetchAnnouncement();
  }, []);

  if (!announcement) return null;

  return (
    <div className="border-b bg-muted/60 px-4 py-3">
      <Alert className="max-w-5xl mx-auto flex items-start gap-3">
        <Megaphone className="h-4 w-4 mt-1" />
        <div>
          <AlertTitle className="font-semibold">
            {announcement.title}
          </AlertTitle>
          <AlertDescription>{announcement.content}</AlertDescription>
        </div>
      </Alert>
    </div>
  );
};
