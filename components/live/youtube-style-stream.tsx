"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Users,
  Clock,
  Send,
  MessageCircle,
  Circle,
  ChevronLeft,
  Shield,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Agora types
type IAgoraRTCClient = import("agora-rtc-sdk-ng").IAgoraRTCClient;
type ICameraVideoTrack = import("agora-rtc-sdk-ng").ICameraVideoTrack;
type IMicrophoneAudioTrack = import("agora-rtc-sdk-ng").IMicrophoneAudioTrack;

interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  user: { name: string | null; image?: string | null };
  createdAt: Date;
  isFromTeacher?: boolean;
}

interface YouTubeStyleStreamProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
  title?: string;
  description?: string;
  teacherName?: string;
  onEnd?: () => void;
}

export const YouTubeStyleStream = ({
  courseId,
  liveSessionId,
  channelName,
  title = "Live Session",
  description = "",
  teacherName = "Teacher",
  onEnd,
}: YouTubeStyleStreamProps) => {
  const router = useRouter();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollChat = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Load messages from DB ── */
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
    startStreaming();
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isStreaming) {
      const t = setInterval(() => setDuration((p) => p + 1), 1000);
      return () => clearInterval(t);
    }
  }, [isStreaming]);

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 2000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => { scrollChat(); }, [chatMessages, scrollChat]);

  const startStreaming = async () => {
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      const response = await axios.post(
        `/api/courses/${courseId}/live/${liveSessionId}/token`,
        { channelName, role: "publisher" }
      );
      const { token, appId } = response.data;
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;
      await client.setClientRole("host");
      await client.join(appId, channelName, token, null);

      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();
      videoTrackRef.current = videoTrack;
      audioTrackRef.current = audioTrack;
      if (videoContainerRef.current) videoTrack.play(videoContainerRef.current);
      await client.publish([videoTrack, audioTrack]);
      setIsStreaming(true);
      toast.success("You're now live!");

      client.on("user-joined", () => setViewerCount((p) => p + 1));
      client.on("user-left", () => setViewerCount((p) => Math.max(0, p - 1)));
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start streaming");
    }
  };

  const toggleCamera = async () => {
    if (videoTrackRef.current) {
      await videoTrackRef.current.setEnabled(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = async () => {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const cleanup = async () => {
    try {
      videoTrackRef.current?.close();
      audioTrackRef.current?.close();
      await clientRef.current?.leave();
    } catch (e) { console.error("Cleanup error:", e); }
  };

  const handleEndStream = async () => {
    try {
      await cleanup();
      await axios.patch(`/api/courses/${courseId}/live`);
      setIsStreaming(false);
      toast.success("Stream ended");
      onEnd?.();
      router.push(`/teacher/courses/${courseId}/live-sessions`);
    } catch (error) {
      console.error("Error ending stream:", error);
    }
  };

  const handleBack = () => {
    router.push(`/teacher/courses/${courseId}/live-sessions`);
  };

  /* ── Send chat to DB ── */
  const sendMessage = async () => {
    if (!newMessage.trim() || isSendingMsg) return;
    setIsSendingMsg(true);
    try {
      const res = await fetch(
        `/api/courses/${courseId}/live/${liveSessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage.trim(), isFromTeacher: true }),
        }
      );
      if (res.ok) { setNewMessage(""); await loadMessages(); }
    } catch { toast.error("Failed to send"); }
    finally { setIsSendingMsg(false); }
  };

  const fmtDur = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* ─── Top Bar ─── */}
      <header className="h-14 bg-gray-900/80 backdrop-blur-sm border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleBack}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div>
            <h1 className="text-white text-sm font-semibold leading-tight">{title}</h1>
            <p className="text-gray-500 text-xs">{teacherName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isStreaming && (
            <div className="flex items-center gap-1.5 bg-red-600 pl-2 pr-3 py-1 rounded-full">
              <Circle className="h-2.5 w-2.5 fill-white animate-pulse" />
              <span className="text-white text-xs font-bold tracking-wide">LIVE</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Users className="h-3.5 w-3.5" />
            <span>{viewerCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">{fmtDur(duration)}</span>
          </div>
          <Button onClick={handleEndStream} size="sm"
            className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1.5">
            <X className="h-3.5 w-3.5" /> End Stream
          </Button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video + Controls */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <div ref={videoContainerRef} className="absolute inset-0 bg-black">
              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                  <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4 ring-2 ring-gray-700">
                    <VideoOff className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-400 font-medium">Camera is off</p>
                  <p className="text-gray-600 text-sm mt-1">Students can still hear you</p>
                </div>
              )}
            </div>
            {isStreaming && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="relative">
                  <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                  <Circle className="absolute inset-0 h-2 w-2 fill-red-500 text-red-500 animate-ping" />
                </div>
                <span className="text-white text-xs font-medium">REC</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="h-20 bg-gray-900/80 backdrop-blur-sm border-t border-white/10 flex items-center justify-center gap-3 px-6 shrink-0">
            <button onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}>
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCameraOn ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}>
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
            <button onClick={() => setShowChat(!showChat)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showChat ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
              title="Toggle chat">
              <MessageCircle className="h-5 w-5" />
            </button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button onClick={handleEndStream}
              className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 transition-all">
              <X className="h-5 w-5" /> End
            </button>
          </div>
        </div>

        {/* ─── Chat Panel ─── */}
        {showChat && (
          <div className="w-[360px] bg-gray-900 border-l border-white/10 flex flex-col shrink-0">
            <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-400" />
                <span className="text-white text-sm font-semibold">Live Chat</span>
              </div>
              <button onClick={() => setShowChat(false)} className="p-1 text-gray-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No messages yet</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-2 p-2 rounded-lg ${msg.isFromTeacher ? "bg-blue-600/10" : ""}`}>
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={msg.user.image ?? undefined} />
                        <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                          {msg.user.name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold ${msg.isFromTeacher ? "text-blue-400" : "text-gray-300"}`}>
                            {msg.user.name || "Anonymous"}
                          </span>
                          {msg.isFromTeacher && (
                            <Badge className="bg-blue-600/20 text-blue-300 text-[10px] px-1 py-0 h-4">
                              <Shield className="h-2.5 w-2.5 mr-0.5" />Host
                            </Badge>
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

            <div className="p-3 border-t border-white/10 shrink-0">
              <div className="flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Message your students..."
                  className="bg-gray-800 border-gray-700 text-white text-sm placeholder:text-gray-500 focus-visible:ring-blue-500"
                  disabled={isSendingMsg} />
                <Button onClick={sendMessage} size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  disabled={!newMessage.trim() || isSendingMsg}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeStyleStream;
