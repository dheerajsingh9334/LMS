"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AdminUserActionsProps {
  userId: string;
  userName: string;
}

export const AdminUserActions = ({
  userId,
  userName,
}: AdminUserActionsProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    try {
      setLoading(true);
      await axios.post("/api/admin/messages", {
        recipientIds: [userId],
        title,
        body,
      });
      toast.success("Message sent");
      setOpen(false);
      setTitle("");
      setBody("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {userName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Subject of your message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message to this user"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onSend}
            disabled={loading || !title.trim() || !body.trim()}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
