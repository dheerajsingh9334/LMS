"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Users,
  Clock,
  ArrowLeft,
  Radio,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Types for Agora SDK - imported dynamically to avoid SSR issues
type IAgoraRTCClient = import("agora-rtc-sdk-ng").IAgoraRTCClient;
type ICameraVideoTrack = import("agora-rtc-sdk-ng").ICameraVideoTrack;
type IMicrophoneAudioTrack = import("agora-rtc-sdk-ng").IMicrophoneAudioTrack;

interface SimpleTeacherStreamProps {
  courseId: string;
  liveSessionId: string;
  channelName: string;
  title?: string;
  onEnd?: () => void;
  onExit?: () => void;
}

export const SimpleTeacherStream = ({
  courseId,
  liveSessionId,
  channelName,
  title = "Live Session",
  onEnd,
  onExit,
}: SimpleTeacherStreamProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);

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

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  const startStreaming = async () => {
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      const response = await axios.post(
        `/api/courses/${courseId}/live/${liveSessionId}/token`,
        {
          channelName,
          role: "publisher",
        },
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
      toast.success("Live stream started!");

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
    await cleanup();
    setIsStreaming(false);
    onEnd?.();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onExit && (
              <Button
                onClick={onExit}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Teacher Live Stream
              </p>
            </div>
          </div>

          {isStreaming && (
            <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Poster Style Card */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Video Container - 16:9 Aspect Ratio */}
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <div
              ref={videoContainerRef}
              className="absolute inset-0 bg-gray-900"
            >
              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <VideoOff className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-white text-lg font-medium">
                    Camera is off
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Students can still hear you
                  </p>
                </div>
              )}
            </div>

            {/* Live Indicator on Video */}
            {isStreaming && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold">LIVE</span>
              </div>
            )}

            {/* Stats Overlay on Video */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm">
                <Users className="w-4 h-4" />
                <span>{viewerCount}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="p-6 bg-gray-50 dark:bg-slate-800/50">
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                onClick={toggleMic}
                size="lg"
                variant={isMicOn ? "default" : "destructive"}
                className="rounded-full w-14 h-14 p-0"
                title={isMicOn ? "Mute microphone" : "Unmute microphone"}
              >
                {isMicOn ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={toggleCamera}
                size="lg"
                variant={isCameraOn ? "default" : "destructive"}
                className="rounded-full w-14 h-14 p-0"
                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
              >
                {isCameraOn ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={handleEndStream}
                size="lg"
                variant="destructive"
                className="rounded-full px-6 h-14 gap-2"
              >
                <X className="h-5 w-5" />
                End Stream
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isMicOn ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-gray-600 dark:text-gray-300">
                  {isMicOn ? "Microphone on" : "Microphone muted"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isCameraOn ? "bg-green-500" : "bg-red-500"}`}
                />
                <span className="text-gray-600 dark:text-gray-300">
                  {isCameraOn ? "Camera on" : "Camera off"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Tip:</strong> Share your screen by clicking the
            browser&apos;s share button. Students will see your stream in
            real-time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTeacherStream;
