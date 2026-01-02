"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  X,
  Send,
  Users,
  Pin,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  user: {
    name: string | null;
    image?: string | null;
  };
  createdAt: Date;
  isPinned?: boolean;
  isFromTeacher?: boolean;
}

interface TeacherLiveChatProps {
  courseId: string;
  liveSessionId: string;
  teacherName: string;
  teacherImage?: string;
  isVisible: boolean;
  onClose: () => void;
}

export const TeacherLiveChat = ({
  courseId,
  liveSessionId,
  teacherName,
  teacherImage,
  isVisible,
  onClose,
}: TeacherLiveChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessagesCallback = React.useCallback(async () => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`
      );
      if (response.ok) {
        const data = await response.json();
        const msgs = Array.isArray(data) ? data : data.messages;
        if (msgs) {
          setMessages(msgs);
        }
        if (!Array.isArray(data)) {
          setViewerCount(data.viewerCount ?? 0);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [courseId, liveSessionId]);

  useEffect(() => {
    if (isVisible) {
      loadMessagesCallback();
      // Set up polling for new messages
      const interval = setInterval(loadMessagesCallback, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, loadMessagesCallback]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`
      );
      if (response.ok) {
        const data = await response.json();
        const msgs = Array.isArray(data) ? data : data.messages;
        if (msgs) {
          setMessages(msgs);
        }
        if (!Array.isArray(data)) {
          setViewerCount(data.viewerCount ?? 0);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: newMessage.trim(),
            isFromTeacher: true,
          }),
        }
      );

      if (response.ok) {
        // Reload from server so teacher sees same data shape as students
        await loadMessages();
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const pinMessage = async (messageId: string) => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages/${messageId}/pin`
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
        )
      );
      toast.success("Message pinned for all viewers");
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message");
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await axios.delete(
        `/api/courses/${courseId}/live/${liveSessionId}/messages/${messageId}`
      );
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const toggleChat = async () => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/live/${liveSessionId}/chat-settings`,
        {
          enabled: !isChatEnabled,
        }
      );
      setIsChatEnabled(!isChatEnabled);
      toast.success(
        `Chat ${!isChatEnabled ? "enabled" : "disabled"} for students`
      );
    } catch (error) {
      console.error("Error toggling chat:", error);
      toast.error("Failed to update chat settings");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-900/95 backdrop-blur-md border-l border-white/10 z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Live Chat</h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Users className="w-4 h-4" />
            <span>{viewerCount} viewers</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleChat}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              {isChatEnabled ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {!isChatEnabled && (
          <div className="mt-2 p-2 bg-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-200">
              Chat disabled for students
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No messages yet</p>
              <p className="text-gray-500 text-xs">
                Be the first to start the conversation
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`group relative p-3 rounded-lg transition-all duration-200 ${
                  message.isFromTeacher
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 ml-4"
                    : "bg-gray-800/50 border border-gray-700/50"
                } ${message.isPinned ? "ring-2 ring-yellow-500/50" : ""} ${
                  selectedMessage === message.id
                    ? "ring-2 ring-blue-500/50"
                    : ""
                }`}
                onClick={() =>
                  setSelectedMessage(
                    selectedMessage === message.id ? null : message.id
                  )
                }
              >
                {message.isPinned && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                      <Pin className="w-3 h-3 mr-1" />
                      Pinned
                    </Badge>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={message.user.image} />
                    <AvatarFallback className="text-xs">
                      {message.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-medium ${
                          message.isFromTeacher ? "text-blue-300" : "text-white"
                        }`}
                      >
                        {message.user.name}
                      </span>
                      {message.isFromTeacher && (
                        <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Teacher
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 break-words">
                      {message.content}
                    </p>
                  </div>
                </div>

                {/* Message Actions */}
                {selectedMessage === message.id && (
                  <div className="absolute right-2 top-2 flex gap-1 bg-gray-800/90 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => pinMessage(message.id)}
                      variant="ghost"
                      size="sm"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 h-8 w-8 p-0"
                    >
                      <Pin className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteMessage(message.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10 bg-gray-900/50">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherLiveChat;
