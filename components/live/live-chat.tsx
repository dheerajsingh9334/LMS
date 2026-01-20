"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";

interface LiveChatMessage {
  id: string;
  message: string;
  userId: string;
  user: {
    name: string | null;
    image: string | null;
  };
  createdAt: Date;
}

interface LiveChatProps {
  courseId: string;
  liveSessionId: string;
  className?: string;
}

export const LiveChat = ({
  courseId,
  liveSessionId,
  className = "",
}: LiveChatProps) => {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useCurrentUser();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`,
      );
      if (response.ok) {
        const data = await response.json();
        // API may return either an array of messages or
        // an object with a `messages` field plus metadata.
        const messages = Array.isArray(data) ? data : data.messages;
        if (messages) {
          setMessages(messages);
        }
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, liveSessionId]);

  // Load messages on component mount
  useEffect(() => {
    loadMessages();

    // Set up polling for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);

    return () => clearInterval(interval);
  }, [courseId, liveSessionId, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    try {
      setIsSending(true);
      const response = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: newMessage.trim(),
          }),
        },
      );

      if (response.ok) {
        setNewMessage("");
        // Immediately load new messages
        loadMessages();
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400">
                Be the first to say something!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex gap-2">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {message.user.image ? (
                    <Image
                      src={message.user.image}
                      alt={message.user.name || "User"}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {(message.user.name || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.user.name || "Anonymous"}
                    </span>
                    {message.userId === user?.id && (
                      <span className="text-xs text-blue-600 font-medium">
                        (You)
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {format(new Date(message.createdAt), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 break-words">
                    {message.message}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
