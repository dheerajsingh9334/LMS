"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TeacherLiveStreamWrapper as TeacherLiveStream } from "@/components/live/teacher-live-stream-wrapper";

interface LiveSessionFormProps {
  courseId: string;
  activeLiveSession?: {
    id: string;
    isLive: boolean;
    title?: string;
  } | null;
}

export const LiveSessionForm = ({
  courseId,
  activeLiveSession
}: LiveSessionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const router = useRouter();

  const handleStartLive = async () => {
    try {
      setIsLoading(true);
      
      if (!title.trim()) {
        toast.error("Please enter a title for the live session");
        return;
      }

      const response = await axios.post(`/api/courses/${courseId}/live`, {
        title,
        description,
        streamUrl: courseId, // Use courseId as channel name
      });

      // Send notifications to all enrolled students
      try {
        await axios.post(`/api/courses/${courseId}/live/${response.data.id}/notify`);
      } catch (notifyError) {
        console.error("Failed to send notifications:", notifyError);
      }

      setOpen(false);
      setIsStreaming(true);
      router.refresh();
    } catch (error) {
      toast.error("Failed to start live session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    try {
      if (!activeLiveSession) return;
      
      await axios.patch(`/api/courses/${courseId}/live/${activeLiveSession.id}`, {
        isLive: false,
      });

      setIsStreaming(false);
      toast.success("Live session ended");
      router.refresh();
    } catch (error) {
      toast.error("Failed to end live session");
    }
  };

  const handleStopLive = async () => {
    try {
      setIsLoading(true);
      
      await axios.patch(`/api/courses/${courseId}/live/${activeLiveSession?.id}`, {
        isLive: false,
      });

      toast.success("Live session ended");
      router.refresh();
    } catch (error) {
      toast.error("Failed to end live session");
    } finally {
      setIsLoading(false);
    }
  };

  // Show live streaming interface if streaming
  if (isStreaming && activeLiveSession) {
    return (
      <TeacherLiveStream
        courseId={courseId}
        liveSessionId={activeLiveSession.id}
        channelName={courseId} // Use courseId as channel name
        onEnd={handleEndStream}
      />
    );
  }

  if (activeLiveSession?.isLive) {
    return (
      <div className="border rounded-md p-4 bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-red-700">Live Session Active</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsStreaming(true)}
              variant="outline"
              size="sm"
            >
              <Video className="h-4 w-4 mr-2" />
              Join Stream
            </Button>
            <Button
              onClick={handleEndStream}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              <VideoOff className="h-4 w-4 mr-2" />
              End Live
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Video className="h-4 w-4 mr-2" />
            Start Live Class
          </Button>
        </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Start Live Class</DialogTitle>
          <DialogDescription>
            Configure your live streaming session for this course.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">
              Session Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 3: Advanced Concepts"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you cover in this session?"
              disabled={isLoading}
            />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> This will use our built-in live streaming system. Students will be able to watch directly in the app.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleStartLive} disabled={isLoading}>
            {isLoading ? "Starting..." : "Start Live"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <Button 
      variant="ghost" 
      size="sm" 
      className="w-full text-muted-foreground"
      onClick={() => router.push(`/teacher/courses/${courseId}/live-sessions`)}
    >
      Manage all live sessions →
    </Button>
  </div>
  );
};
