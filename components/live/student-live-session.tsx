"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Send, Users } from "lucide-react";
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

interface StudentLiveSessionProps {
  sessionId: string;
  streamUrl?: string;
}

export const StudentLiveSession = ({
  sessionId,
  streamUrl,
}: StudentLiveSessionProps) => {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewCount, setViewCount] = useState(0);
  const [isLive, setIsLive] = useState(true);

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
                <CardTitle>{isLive ? "LIVE" : "Ended"}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{viewCount} viewers</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {streamUrl ? (
                <iframe
                  src={streamUrl}
                  className="w-full h-full"
                  allow="camera; microphone; autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Waiting for stream...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>Live Chat</CardTitle>
          <CardDescription>Join the conversation</CardDescription>
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
