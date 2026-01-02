"use client";

import { useState, useEffect } from "react";
import { Video, VideoOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface GoLiveButtonProps {
  courseId: string;
  courseTitle: string;
}

export const GoLiveButton = ({ courseId, courseTitle }: GoLiveButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkLiveStatus();
    // Poll every 10 seconds
    const interval = setInterval(checkLiveStatus, 10000);
    return () => clearInterval(interval);
  }, [courseId]);

  const checkLiveStatus = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/live`);
      if (response.data) {
        setIsLive(true);
        setLiveSession(response.data);
      } else {
        setIsLive(false);
        setLiveSession(null);
      }
    } catch (error) {
      setIsLive(false);
      setLiveSession(null);
    }
  };

  const startLiveSession = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/courses/${courseId}/live`, {
        title: title || `Live Session - ${courseTitle}`,
        description: description || `Join the live class for ${courseTitle}`,
      });
      setLiveSession(response.data);
      setIsLive(true);
      toast.success("Live session started! 🎥");
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to start live session");
    } finally {
      setIsLoading(false);
    }
  };

  const endLiveSession = async () => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/courses/${courseId}/live`);
      setIsLive(false);
      setLiveSession(null);
      toast.success("Live session ended");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to end live session");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLive && liveSession) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full" />
          <span className="font-semibold">LIVE</span>
          <span className="text-sm">({liveSession.viewCount} viewers)</span>
        </div>
        <Button
          onClick={endLiveSession}
          disabled={isLoading}
          variant="destructive"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <VideoOff className="w-5 h-5 mr-2" />
          )}
          End Live Session
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
        >
          <Video className="w-5 h-5 mr-2" />
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">Start Live Session</DialogTitle>
          <DialogDescription>
            Start a live streaming session for {courseTitle}. Your students will be
            notified and can join instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              placeholder={`Live Session - ${courseTitle}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What will you cover in this live session?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Make sure your camera and microphone are working
              before starting the live session.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={startLiveSession}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Start Live
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
