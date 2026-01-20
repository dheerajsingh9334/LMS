"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, VideoOff, Mic, MicOff, Send, Users } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface LiveChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface TeacherLiveSessionProps {
  sessionId: string;
  courseId: string;
  chapterId?: string;
}

export const TeacherLiveSession = ({
  sessionId,
  courseId,
  chapterId,
}: TeacherLiveSessionProps) => {
  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewCount, setViewCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get(`/api/live-sessions/${sessionId}/chat`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [sessionId, fetchMessages]);

  const startLive = async () => {
    try {
      const response = await axios.post("/api/live-sessions", {
        title: "Live Session",
        courseId,
        chapterId,
      });

      setIsLive(true);
      toast.success("Live session started!");
    } catch (error) {
      toast.error("Failed to start live session");
    }
  };

  const endLive = async () => {
    try {
      await axios.patch(`/api/live-sessions/${sessionId}`, {
        isLive: false,
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setIsLive(false);
      setIsCameraOn(false);
      setIsMicOn(false);
      toast.success("Live session ended");
    } catch (error) {
      toast.error("Failed to end live session");
    }
  };

  const toggleCamera = async () => {
    try {
      if (!isCameraOn) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setIsCameraOn(true);
      } else {
        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach((track) => track.stop());
        }
        setIsCameraOn(false);
      }
    } catch (error) {
      toast.error("Failed to access camera");
    }
  };

  const toggleMic = async () => {
    try {
      if (!isMicOn) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        setIsMicOn(true);
      } else {
        if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach((track) => track.stop());
        }
        setIsMicOn(false);
      }
    } catch (error) {
      toast.error("Failed to access microphone");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(`/api/live-sessions/${sessionId}/chat`, {
        message: newMessage,
      });
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen p-4">
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-gray-400"}`}
                />
                <CardTitle>{isLive ? "LIVE" : "Not Live"}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{viewCount} viewers</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <VideoOff className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={toggleCamera}
                variant={isCameraOn ? "default" : "outline"}
                size="icon"
              >
                {isCameraOn ? <Video /> : <VideoOff />}
              </Button>
              <Button
                onClick={toggleMic}
                variant={isMicOn ? "default" : "outline"}
                size="icon"
              >
                {isMicOn ? <Mic /> : <MicOff />}
              </Button>
              {!isLive ? (
                <Button
                  onClick={startLive}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Go Live
                </Button>
              ) : (
                <Button onClick={endLive} variant="destructive">
                  End Live
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>Live Chat</CardTitle>
          <CardDescription>Interact with your students</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100%-5rem)]">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={msg.user.image || ""} />
                    <AvatarFallback>
                      {msg.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {msg.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              disabled={!isLive}
            />
            <Button onClick={sendMessage} size="icon" disabled={!isLive}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
