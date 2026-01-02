"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  MessageSquare,
  BarChart3,
  Users,
  Share2,
  Settings,
  Monitor,
  Volume2,
  VolumeX,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { TeacherPolls } from "./teacher-polls";
import { TeacherLiveChat } from "./teacher-live-chat";

// Types for Agora SDK - imported dynamically to avoid SSR issues
type IAgoraRTCClient = import("agora-rtc-sdk-ng").IAgoraRTCClient;
type ICameraVideoTrack = import("agora-rtc-sdk-ng").ICameraVideoTrack;
type IMicrophoneAudioTrack = import("agora-rtc-sdk-ng").IMicrophoneAudioTrack;

interface TeacherLiveStreamProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
  onEnd?: () => void;
  teacherName?: string;
  teacherImage?: string;
}

export const TeacherLiveStream = ({
  courseId,
  liveSessionId,
  channelName,
  onEnd,
  teacherName = "Teacher",
  teacherImage,
}: TeacherLiveStreamProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [showPolls, setShowPolls] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamStats, setStreamStats] = useState({
    duration: 0,
    bitrate: 0,
    quality: "HD",
  });

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startStreaming();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodically sync viewer count from the server so the
  // "viewers" badge reflects how many students have actually
  // joined via the /live/join endpoint.
  useEffect(() => {
    const fetchViewerCount = async () => {
      try {
        const res = await fetch(
          `/api/courses/${courseId}/live/${liveSessionId}/messages`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) && typeof data?.viewerCount === "number") {
          setViewerCount(data.viewerCount);
        }
      } catch (error) {
        console.error("Failed to sync viewer count", error);
      }
    };

    fetchViewerCount();
    const interval = setInterval(fetchViewerCount, 5000);
    return () => clearInterval(interval);
  }, [courseId, liveSessionId]);

  const startStreaming = async () => {
    try {
      // Dynamically import Agora SDK only on client side
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      // Get Agora token
      const response = await axios.post(
        `/api/courses/${courseId}/live/${liveSessionId}/token`,
        {
          channelName,
          role: "publisher", // Teacher is publisher
        }
      );

      const { token, appId } = response.data;

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;

      // Set client role to host (teacher)
      await client.setClientRole("host");

      // Join channel
      await client.join(appId, channelName, token, null);

      // Create and publish local tracks
      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();

      videoTrackRef.current = videoTrack;
      audioTrackRef.current = audioTrack;

      // Play video locally
      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current);
      }

      // Publish tracks
      await client.publish([videoTrack, audioTrack]);

      setIsStreaming(true);
      toast.success("Streaming started successfully!");

      // Listen for user joined (students joining)
      client.on("user-joined", (user) => {
        setViewerCount((prev) => prev + 1);
      });

      client.on("user-left", (user) => {
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
      // Close tracks
      videoTrackRef.current?.close();
      audioTrackRef.current?.close();

      // Leave channel
      await clientRef.current?.leave();
    } catch (error) {
      console.error("Error cleaning up:", error);
    }
  };

  const handleEndStream = async () => {
    await cleanup();
    setIsStreaming(false);
    onEnd?.();
  };

  const toggleScreenShare = async () => {
    // Screen sharing logic would go here
    setIsScreenSharing(!isScreenSharing);
    toast.success(
      isScreenSharing ? "Screen sharing stopped" : "Screen sharing started"
    );
  };

  // Stream statistics timer
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setStreamStats((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-pink-600 p-4 shadow-2xl border-b border-red-400/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="relative">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">
                {viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Monitor className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">
                {formatDuration(streamStats.duration)}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white font-semibold text-sm">
                {streamStats.quality}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowChat(!showChat)}
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/20 ${
                showChat ? "bg-white/20" : ""
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>

            <Button
              onClick={() => setShowPolls(!showPolls)}
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/20 ${
                showPolls ? "bg-white/20" : ""
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Polls
            </Button>

            <Button
              onClick={handleEndStream}
              variant="destructive"
              size="sm"
              className="bg-white/90 text-red-600 hover:bg-white font-semibold shadow-lg"
            >
              <X className="h-4 w-4 mr-2" />
              End Stream
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Video Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={videoContainerRef}
          className="w-full h-full flex items-center justify-center relative"
          style={{
            background:
              "radial-gradient(circle at center, #1a1a2e 0%, #0f0f1e 100%)",
          }}
        >
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-full p-8 mb-4">
                <VideoOff className="w-24 h-24 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg font-medium">Camera is off</p>
              <p className="text-gray-500 text-sm mt-2">
                Students can still hear you
              </p>
            </div>
          )}

          {/* Recording indicator */}
          {isStreaming && (
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">Recording</span>
            </div>
          )}

          {/* Stream quality indicator */}
          <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-xs font-medium">
              {streamStats.quality}
            </span>
          </div>

          {/* Audio level indicator */}
          {isMicOn && (
            <div className="absolute bottom-32 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
              <Volume2 className="w-4 h-4 text-green-400" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-4 rounded-full ${
                      i < 3 ? "bg-green-400" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {!isMicOn && (
            <div className="absolute bottom-32 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
              <VolumeX className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs">Muted</span>
            </div>
          )}

          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-red-500/30 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-red-500/30 rounded-tr-lg" />
          <div className="absolute bottom-28 left-4 w-12 h-12 border-b-2 border-l-2 border-red-500/30 rounded-bl-lg" />
          <div className="absolute bottom-28 right-4 w-12 h-12 border-b-2 border-r-2 border-red-500/30 rounded-br-lg" />
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="bg-gradient-to-t from-black via-gray-900 to-transparent p-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative group">
              <Button
                onClick={toggleMic}
                size="lg"
                className={`rounded-full w-16 h-16 shadow-2xl transition-all duration-300 border border-white/10 ${
                  isMicOn
                    ? "bg-gray-800 hover:bg-gray-700 shadow-black/40"
                    : "bg-gray-900 hover:bg-gray-800 shadow-black/60"
                }`}
              >
                {isMicOn ? (
                  <Mic className="h-6 w-6 text-white" />
                ) : (
                  <MicOff className="h-6 w-6 text-white" />
                )}
              </Button>
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                {isMicOn ? "Mute" : "Unmute"}
              </span>
            </div>

            <div className="relative group">
              <Button
                onClick={toggleCamera}
                size="lg"
                className={`rounded-full w-16 h-16 shadow-2xl transition-all duration-300 border border-white/10 ${
                  isCameraOn
                    ? "bg-gray-800 hover:bg-gray-700 shadow-black/40"
                    : "bg-gray-900 hover:bg-gray-800 shadow-black/60"
                }`}
              >
                {isCameraOn ? (
                  <Video className="h-6 w-6 text-white" />
                ) : (
                  <VideoOff className="h-6 w-6 text-white" />
                )}
              </Button>
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                {isCameraOn ? "Stop Video" : "Start Video"}
              </span>
            </div>

            <div className="relative group">
              <Button
                onClick={toggleScreenShare}
                size="lg"
                className={`rounded-full w-16 h-16 shadow-2xl transition-all duration-300 border border-white/10 ${
                  isScreenSharing
                    ? "bg-gray-800 hover:bg-gray-700 shadow-black/40"
                    : "bg-gray-900 hover:bg-gray-800 shadow-black/60"
                }`}
              >
                <Share2 className="h-6 w-6 text-white" />
              </Button>
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                {isScreenSharing ? "Stop Share" : "Share Screen"}
              </span>
            </div>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-400">
                <span className="text-white font-medium">{viewerCount}</span>{" "}
                watching
              </div>
              <div className="text-xs text-gray-400">
                Duration:{" "}
                <span className="text-white font-medium">
                  {formatDuration(streamStats.duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Polls Panel */}
      <TeacherPolls
        courseId={courseId}
        liveSessionId={liveSessionId}
        isVisible={showPolls}
        onClose={() => setShowPolls(false)}
      />

      {/* Chat Panel */}
      <TeacherLiveChat
        courseId={courseId}
        liveSessionId={liveSessionId}
        teacherName={teacherName}
        teacherImage={teacherImage}
        isVisible={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  );
};

export default TeacherLiveStream;
