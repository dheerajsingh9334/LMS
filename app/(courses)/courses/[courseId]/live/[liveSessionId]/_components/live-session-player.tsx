"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface LiveSessionPlayerProps {
  liveSession: any;
  userId: string;
  userName: string;
}

export const LiveSessionPlayer = ({
  liveSession,
  userId,
  userName
}: LiveSessionPlayerProps) => {
  const [messages, setMessages] = useState(liveSession.chatMessages || []);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Poll for new messages every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `/api/courses/${liveSession.courseId}/live/${liveSession.id}/messages`
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [liveSession.courseId, liveSession.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `/api/courses/${liveSession.courseId}/live/${liveSession.id}/messages`,
        { message: newMessage }
      );
      
      setMessages([...messages, response.data]);
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Live Session Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-semibold uppercase">Live</span>
              </div>
              <h1 className="text-2xl font-bold mt-1">{liveSession.title}</h1>
              <p className="text-sm opacity-90">
                Instructor: {liveSession.teacher.name}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{liveSession.viewCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {liveSession.streamUrl ? (
            <iframe
              src={liveSession.streamUrl}
              className="w-full h-full"
              allow="camera; microphone; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="text-white text-center">
              <p className="text-xl">Connecting to live stream...</p>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-96 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Live Chat</h2>
          </div>
          
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message: any) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.user?.image} />
                    <AvatarFallback>
                      {message.user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {message.user?.name || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newMessage.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
