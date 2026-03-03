"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Loader2,
  FileText,
  MessageSquare,
  Send,
  Users,
  Circle,
  Shield,
  Clock,
  User,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { UniversalNotes } from "@/components/notes/universal-notes";
import { useCurrentUser } from "@/hooks/use-current-user";

// Agora types
type IAgoraRTCClient = import("agora-rtc-sdk-ng").IAgoraRTCClient;
type IAgoraRTCRemoteUser = import("agora-rtc-sdk-ng").IAgoraRTCRemoteUser;

interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  user: { name: string | null; image?: string | null };
  createdAt: Date;
  isFromTeacher?: boolean;
}

interface StudentLiveViewerProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
  onClose: () => void;
}

export const StudentLiveViewer = ({
  courseId,
  liveSessionId,
  channelName,
  onClose,
}: StudentLiveViewerProps) => {
  const currentUser = useCurrentUser();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Side panel
  const [sidePanel, setSidePanel] = useState<"chat" | "notes" | null>("chat");

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollChat = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Load chat messages from DB ── */
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`
      );
      if (!res.ok) return;
      const data = await res.json();
      const msgs = Array.isArray(data) ? data : data.messages;
      if (msgs) setChatMessages(msgs);
      if (!Array.isArray(data) && typeof data.viewerCount === "number") {
        setViewerCount(data.viewerCount);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, [courseId, liveSessionId]);

  useEffect(() => {
    startViewing();
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll chat
  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 2000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => { scrollChat(); }, [chatMessages, scrollChat]);

  const startViewing = async () => {
    try {
      setIsLoading(true);
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const response = await axios.post(
        `/api/courses/${courseId}/live/${liveSessionId}/token`,
        { channelName, role: "subscriber" }
      );
      const { token, appId } = response.data;

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;
      await client.setClientRole("audience");
      await client.join(appId, channelName, token, null);

      client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && videoContainerRef.current) {
          user.videoTrack?.play(videoContainerRef.current);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user: IAgoraRTCRemoteUser) => {
        if (user.videoTrack) user.videoTrack.stop();
      });

      setIsConnected(true);
      setIsLoading(false);
      toast.success("Connected to live stream!");

      await axios.post(`/api/courses/${courseId}/live/join`);
    } catch (error: any) {
      console.error("Error joining stream:", error);
      setIsLoading(false);
      if (error.response?.status === 403) {
        toast.error("You must purchase this course to join live sessions");
      } else {
        toast.error("Failed to connect to live stream");
      }
      onClose();
    }
  };

  const cleanup = async () => {
    try { await clientRef.current?.leave(); }
    catch (e) { console.error("Cleanup error:", e); }
  };

  const handleClose = async () => {
    await cleanup();
    onClose();
  };

  /* ── Send chat message ── */
  const sendMessage = async () => {
    if (!newMessage.trim() || isSendingMsg || !currentUser?.id) return;
    setIsSendingMsg(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage.trim() }),
        }
      );
      if (res.ok) { setNewMessage(""); await loadMessages(); }
      else toast.error("Failed to send message");
    } catch { toast.error("Failed to send message"); }
    finally { setIsSendingMsg(false); }
  };

  const togglePanel = (p: "chat" | "notes") =>
    setSidePanel((cur) => (cur === p ? null : p));

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* ─── Top Bar ─── */}
      <header className="h-12 bg-gray-900/80 backdrop-blur-sm border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-600 pl-2 pr-3 py-1 rounded-full">
            <Circle className="h-2 w-2 fill-white animate-pulse" />
            <span className="text-white text-[11px] font-bold tracking-wide">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Users className="h-3.5 w-3.5" />
            <span>{viewerCount} watching</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => togglePanel("chat")} variant="ghost" size="sm"
            className={`h-7 text-xs gap-1.5 ${sidePanel === "chat" ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
            <MessageSquare className="h-3.5 w-3.5" /> Chat
          </Button>
          <Button onClick={() => togglePanel("notes")} variant="ghost" size="sm"
            className={`h-7 text-xs gap-1.5 ${sidePanel === "notes" ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
            <FileText className="h-3.5 w-3.5" /> Notes
          </Button>
          <div className="w-px h-4 bg-white/10" />
          <Button onClick={handleClose} variant="ghost" size="sm"
            className="h-7 text-xs text-gray-400 hover:bg-white/10 hover:text-white gap-1.5">
            <X className="h-3.5 w-3.5" /> Exit
          </Button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video */}
        <div className="flex-1 relative bg-black min-w-0">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className="text-white text-sm">Connecting to live stream...</p>
            </div>
          )}
          <div ref={videoContainerRef} className="w-full h-full flex items-center justify-center" />
        </div>

        {/* ─── Side Panel ─── */}
        {sidePanel && (
          <div className="w-[360px] bg-gray-900 border-l border-white/10 flex flex-col shrink-0">
            {/* Chat */}
            {sidePanel === "chat" && (
              <>
                <div className="h-11 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm font-semibold">Live Chat</span>
                    <Badge variant="secondary" className="bg-gray-800 text-gray-400 text-xs">
                      {chatMessages.length}
                    </Badge>
                  </div>
                  <button onClick={() => setSidePanel(null)} className="p-1 text-gray-500 hover:text-white transition-colors">
                    <PanelRightClose className="h-4 w-4" />
                  </button>
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2.5">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No messages yet</p>
                        <p className="text-gray-600 text-xs mt-1">Be the first to say something!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-2 p-2 rounded-lg ${msg.isFromTeacher ? "bg-blue-600/10 border border-blue-500/20" : ""}`}>
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={msg.user.image ?? undefined} />
                            <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                              {msg.user.name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-semibold ${msg.isFromTeacher ? "text-blue-400" : "text-gray-300"}`}>
                                {msg.user.name || "Anonymous"}
                              </span>
                              {msg.isFromTeacher && (
                                <Badge className="bg-blue-600/20 text-blue-300 text-[10px] px-1 py-0 h-4">
                                  <Shield className="h-2.5 w-2.5 mr-0.5" />Teacher
                                </Badge>
                              )}
                              {msg.userId === currentUser?.id && !msg.isFromTeacher && (
                                <span className="text-[10px] text-blue-400">(You)</span>
                              )}
                              <span className="text-[10px] text-gray-600">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mt-0.5 break-words">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <div className="p-3 border-t border-white/10 shrink-0">
                  <div className="flex gap-2">
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message..."
                      className="bg-gray-800 border-gray-700 text-white text-sm placeholder:text-gray-500 focus-visible:ring-blue-500"
                      disabled={isSendingMsg} />
                    <Button onClick={sendMessage} size="icon"
                      className="bg-blue-600 hover:bg-blue-700 shrink-0"
                      disabled={!newMessage.trim() || isSendingMsg}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1.5">Press Enter to send</p>
                </div>
              </>
            )}

            {/* Notes */}
            {sidePanel === "notes" && (
              <>
                <div className="h-11 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm font-semibold">Notes</span>
                  </div>
                  <button onClick={() => setSidePanel(null)} className="p-1 text-gray-500 hover:text-white transition-colors">
                    <PanelRightClose className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <UniversalNotes
                    courseId={courseId}
                    context="LIVE_STREAM"
                    liveSessionId={liveSessionId}
                    className="h-full border-0 rounded-none shadow-none"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLiveViewer;
