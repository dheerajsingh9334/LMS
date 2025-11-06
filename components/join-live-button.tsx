"use client";

import { useState, useEffect } from "react";
import { Radio, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface JoinLiveButtonProps {
  courseId: string;
  courseTitle: string;
  className?: string;
}

export const JoinLiveButton = ({
  courseId,
  courseTitle,
  className,
}: JoinLiveButtonProps) => {
  const [isLive, setIsLive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkLiveStatus();
    // Poll every 5 seconds to check if session is live
    const interval = setInterval(checkLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [courseId]);

  const checkLiveStatus = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/live`);
      if (response.data && response.data.isLive) {
        setIsLive(true);
        setLiveSession(response.data);
      } else {
        setIsLive(false);
        setLiveSession(null);
        if (isOpen) {
          setIsOpen(false);
          toast("Live session has ended", { icon: "📴" });
        }
      }
    } catch (error) {
      setIsLive(false);
      setLiveSession(null);
    }
  };

  const joinSession = async () => {
    try {
      setIsLoading(true);
      // Increment view count
      await axios.post(`/api/courses/${courseId}/live/join`);
      setIsOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to join live session");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLive) {
    return null; // Don't show button if not live
  }

  return (
    <>
      <Button
        onClick={joinSession}
        disabled={isLoading}
        size="lg"
        className={cn(
          "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white animate-pulse",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <>
            <Radio className="w-5 h-5 mr-2" />
            <span className="font-bold">JOIN LIVE CLASS</span>
            <Badge className="ml-2 bg-white text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
              LIVE
            </Badge>
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  {liveSession?.title || "Live Session"}
                </DialogTitle>
                <DialogDescription>
                  {liveSession?.description || courseTitle}
                </DialogDescription>
              </div>
              <Badge className="bg-red-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                LIVE
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video Player Placeholder */}
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative">
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                <Users className="w-4 h-4" />
                {liveSession?.viewCount || 0} watching
              </div>
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">
                  Live Stream Video Player
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Teacher: {liveSession?.teacher?.name}
                </p>
                <div className="mt-4 bg-blue-500 px-4 py-2 rounded-lg inline-block">
                  <p className="text-xs">
                    Stream Key: {liveSession?.streamKey}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Session Info
                </h4>
                <div className="text-sm space-y-1 text-gray-700">
                  <p>
                    <strong>Teacher:</strong> {liveSession?.teacher?.name}
                  </p>
                  <p>
                    <strong>Started:</strong>{" "}
                    {liveSession?.startedAt
                      ? new Date(liveSession.startedAt).toLocaleTimeString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Viewers:</strong> {liveSession?.viewCount || 0}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">💡 Live Session Tips</h4>
                <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                  <li>Use chat to ask questions</li>
                  <li>Be respectful to others</li>
                  <li>Focus on learning</li>
                </ul>
              </div>
            </div>

            {/* Chat Section Placeholder */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Live Chat</h4>
              <div className="h-32 bg-white rounded border p-2 overflow-y-auto">
                <p className="text-sm text-gray-500 text-center py-8">
                  Chat messages will appear here...
                </p>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <Button size="sm">Send</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function Video({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
