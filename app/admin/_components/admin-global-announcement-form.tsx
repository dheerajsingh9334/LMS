"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const AdminGlobalAnnouncementForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasAnnouncement, setHasAnnouncement] = useState(false);

  useEffect(() => {
    // Load latest announcement to prefill (optional)
    const fetchLatest = async () => {
      try {
        const res = await axios.get("/api/announcements/global");
        if (res.data) {
          setTitle(res.data.title ?? "");
          setContent(res.data.content ?? "");
          setHasAnnouncement(true);
        } else {
          setHasAnnouncement(false);
        }
      } catch (error) {
        console.error("Failed to load latest global announcement", error);
        setHasAnnouncement(false);
      }
    };

    fetchLatest();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("/api/announcements/global", {
        title,
        content,
        isActive: true,
      });
      setHasAnnouncement(true);
      toast.success("Global announcement updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save announcement");
    } finally {
      setLoading(false);
    }
  };

  const onRemove = async () => {
    if (!confirm("Are you sure you want to remove the announcement?")) {
      return;
    }
    try {
      setDeleting(true);
      await axios.delete("/api/announcements/global");
      setTitle("");
      setContent("");
      setHasAnnouncement(false);
      toast.success("Announcement removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove announcement");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ga-title">Title</Label>
            <Input
              id="ga-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Platform-wide announcement title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ga-content">Content</Label>
            <Textarea
              id="ga-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Message shown on all dashboards"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || deleting || !title.trim() || !content.trim()}
            >
              {loading ? "Saving..." : "Save announcement"}
            </Button>
            {hasAnnouncement && (
              <Button
                type="button"
                variant="destructive"
                disabled={loading || deleting}
                onClick={onRemove}
              >
                {deleting ? "Removing..." : "Remove announcement"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
