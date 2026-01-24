"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Users,
  Clock,
  Settings,
  Send,
  MessageCircle,
  Eye,
  ChevronLeft,
  Circle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Types for Agora SDK
type IAgoraRTCClient = import("agora-rtc-sdk-ng").IAgoraRTCClient;
type ICameraVideoTrack = import("agora-rtc-sdk-ng").ICameraVideoTrack;
type IMicrophoneAudioTrack = import("agora-rtc-sdk-ng").IMicrophoneAudioTrack;

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isTeacher?: boolean;
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
  const [isRecording] = useState(true);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startStreaming();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startStreaming = async () => {
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      const response = await axios.post(
        `/api/courses/${courseId}/live/${liveSessionId}/token`,
        { channelName, role: "publisher" },
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

      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current);
      }

      await client.publish([videoTrack, audioTrack]);
      setIsStreaming(true);
      toast.success("You're now live! 🎥");

      setChatMessages([
        {
          id: "1",
          user: "System",
          message: "Live stream started. Welcome everyone!",
          timestamp: new Date(),
        },
      ]);

      client.on("user-joined", () => {
        setViewerCount((prev) => prev + 1);
      });

      client.on("user-left", () => {
        setViewerCount((prev) => Math.max(0, prev - 1));
      });
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
    } catch (error) {
      console.error("Error cleaning up:", error);
    }
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

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: teacherName,
        message: newMessage,
        timestamp: new Date(),
        isTeacher: true,
      },
    ]);
    setNewMessage("");
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Header - Black with Red accents */}
      <header className="bg-black border-b-2 border-red-600 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white hover:text-red-400 transition-colors text-lg font-medium"
            >
              <ChevronLeft className="h-6 w-6" />
              Back
            </button>
            <div className="h-8 w-0.5 bg-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-gray-400 text-lg">{teacherName}</p>
            </div>
          </div>

          {/* Right: Stats + Actions */}
          <div className="flex items-center gap-4">
            {/* LIVE Badge */}
            {isStreaming && (
              <div className="flex items-center gap-3 bg-red-600 px-6 py-3 rounded-lg">
                <Circle className="h-4 w-4 fill-white animate-pulse" />
                <span className="font-black text-xl tracking-wider">LIVE</span>
              </div>
            )}

            {/* Viewers */}
            <div className="flex items-center gap-3 bg-zinc-900 border-2 border-zinc-700 px-5 py-3 rounded-lg">
              <Eye className="h-6 w-6 text-red-500" />
              <span className="text-2xl font-bold">{viewerCount}</span>
              <span className="text-gray-400 text-lg">viewers</span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 bg-zinc-900 border-2 border-zinc-700 px-5 py-3 rounded-lg">
              <Clock className="h-6 w-6 text-red-500" />
              <span className="text-2xl font-bold font-mono">
                {formatDuration(duration)}
              </span>
            </div>

            {/* Recording */}
            {isRecording && (
              <div className="flex items-center gap-2 bg-red-900/50 border-2 border-red-600 px-4 py-3 rounded-lg">
                <Circle className="h-4 w-4 fill-red-500 text-red-500 animate-pulse" />
                <span className="font-bold text-red-400">REC</span>
              </div>
            )}

            {/* Settings */}
            <button className="p-3 bg-zinc-900 border-2 border-zinc-700 rounded-lg hover:bg-zinc-800 hover:border-red-600 transition-all">
              <Settings className="h-6 w-6 text-white" />
            </button>

            {/* End Stream */}
            <button
              onClick={handleEndStream}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold text-lg transition-colors"
            >
              <X className="h-6 w-6" />
              End Stream
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex max-w-[1920px] mx-auto h-[calc(100vh-88px)]">
        {/* Video Section */}
        <div className={`flex-1 flex flex-col p-6 ${showChat ? "pr-0" : ""}`}>
          {/* Video Container */}
          <div className="relative bg-zinc-900 rounded-2xl overflow-hidden flex-1 border-4 border-zinc-800">
            <div ref={videoContainerRef} className="absolute inset-0">
              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                  <div className="w-40 h-40 rounded-full bg-zinc-800 flex items-center justify-center mb-6 border-4 border-red-600">
                    <VideoOff className="w-20 h-20 text-red-500" />
                  </div>
                  <p className="text-white text-3xl font-bold">Camera is off</p>
                  <p className="text-gray-400 text-xl mt-2">
                    Your audience can still hear you
                  </p>
                </div>
              )}
            </div>

            {/* Video Overlay - Top Left */}
            {isStreaming && (
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg shadow-lg shadow-red-600/50">
                  <Circle className="h-3 w-3 fill-white animate-pulse" />
                  <span className="text-white font-black text-lg">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-lg">
                  <span className="text-white font-mono font-bold text-lg">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Video Overlay - Top Right */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-lg">
                <Users className="h-5 w-5 text-red-500" />
                <span className="text-white font-bold text-xl">
                  {viewerCount}
                </span>
              </div>
              <div className="bg-red-600 px-3 py-2 rounded-lg">
                <span className="font-bold">HD</span>
              </div>
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="mt-6 bg-zinc-900 rounded-2xl p-6 border-2 border-zinc-800">
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-4">
                {/* Mic Button */}
                <button
                  onClick={toggleMic}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    isMicOn
                      ? "bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600"
                      : "bg-red-600 hover:bg-red-700 border-2 border-red-500"
                  }`}
                >
                  {isMicOn ? (
                    <Mic className="h-7 w-7" />
                  ) : (
                    <MicOff className="h-7 w-7" />
                  )}
                  <span>{isMicOn ? "Mute" : "Unmute"}</span>
                </button>

                {/* Camera Button */}
                <button
                  onClick={toggleCamera}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    isCameraOn
                      ? "bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600"
                      : "bg-red-600 hover:bg-red-700 border-2 border-red-500"
                  }`}
                >
                  {isCameraOn ? (
                    <Video className="h-7 w-7" />
                  ) : (
                    <VideoOff className="h-7 w-7" />
                  )}
                  <span>{isCameraOn ? "Stop Video" : "Start Video"}</span>
                </button>
              </div>

              {/* Center: Status */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full ${isMicOn ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-lg font-medium text-gray-300">
                    {isMicOn ? "Mic On" : "Mic Off"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full ${isCameraOn ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-lg font-medium text-gray-300">
                    {isCameraOn ? "Camera On" : "Camera Off"}
                  </span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4">
                {/* Chat Toggle */}
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    showChat
                      ? "bg-red-600 hover:bg-red-700 border-2 border-red-500"
                      : "bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600"
                  }`}
                >
                  <MessageCircle className="h-7 w-7" />
                  <span>Chat</span>
                </button>

                {/* End Stream */}
                <button
                  onClick={handleEndStream}
                  className="flex items-center gap-3 bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-lg border-2 border-red-500 transition-all"
                >
                  <X className="h-7 w-7" />
                  <span>End Stream</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        {showChat && (
          <div className="w-[420px] flex-shrink-0 p-6 pl-6">
            <div className="bg-zinc-900 rounded-2xl h-full flex flex-col border-2 border-zinc-800">
              {/* Chat Header */}
              <div className="p-5 border-b-2 border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6 text-red-500" />
                  <span className="font-bold text-xl text-white">
                    Live Chat
                  </span>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.isTeacher
                            ? "bg-red-600"
                            : msg.user === "System"
                              ? "bg-zinc-700"
                              : "bg-blue-600"
                        }`}
                      >
                        <span className="text-white font-bold">
                          {msg.user[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              msg.isTeacher
                                ? "text-red-400"
                                : msg.user === "System"
                                  ? "text-gray-400"
                                  : "text-blue-400"
                            }`}
                          >
                            {msg.user}
                          </span>
                          {msg.isTeacher && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                              HOST
                            </span>
                          )}
                          <span className="text-gray-500 text-sm">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-200 text-base mt-1">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t-2 border-zinc-800">
                <div className="flex gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="bg-zinc-800 border-2 border-zinc-700 text-white text-lg placeholder:text-gray-500 focus:border-red-600 h-14"
                  />
                  <Button
                    onClick={sendMessage}
                    size="icon"
                    className="bg-red-600 hover:bg-red-700 h-14 w-14"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeStyleStream;
