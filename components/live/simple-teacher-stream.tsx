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
  Monitor,
  ArrowLeft,
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
        setDuration(prev => prev + 1);
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
        }
      );

      const { token, appId } = response.data;

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;

      await client.setClientRole("host");
      await client.join(appId, channelName, token, null);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
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
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      {/* Simple Header */}
      <div className="bg-red-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-xl font-semibold">{title}</h1>
            
            <div className="flex items-center gap-2 bg-red-700 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">LIVE</span>
            </div>
            
            <div className="flex items-center gap-2 bg-red-700 px-3 py-1 rounded-full">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-sm">{viewerCount} viewers</span>
            </div>

            <div className="flex items-center gap-2 bg-red-700 px-3 py-1 rounded-full">
              <Monitor className="w-4 h-4 text-white" />
              <span className="text-white text-sm">{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExit && (
              <Button
                onClick={onExit}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit
              </Button>
            )}
            
            <Button
              onClick={handleEndStream}
              variant="destructive"
              size="sm"
              className="bg-white text-red-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              End Stream
            </Button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative">
        <div
          ref={videoContainerRef}
          className="w-full h-full flex items-center justify-center bg-gray-900"
        >
          {!isCameraOn && (
            <div className="flex flex-col items-center justify-center">
              <VideoOff className="w-32 h-32 text-gray-500 mb-4" />
              <p className="text-white text-xl">Camera is off</p>
              <p className="text-gray-400">Students can still hear you</p>
            </div>
          )}
        </div>

        {/* Status indicators */}
        {isStreaming && (
          <div className="absolute top-4 left-4 bg-red-600/90 px-3 py-1 rounded-full">
            <span className="text-white text-sm">Recording</span>
          </div>
        )}
      </div>

      {/* Simple Controls */}
      <div className="bg-gray-900 p-6 border-t border-gray-800">
        <div className="flex items-center justify-center gap-6">
          <Button
            onClick={toggleMic}
            size="lg"
            className={`rounded-full w-14 h-14 ${
              isMicOn
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isMicOn ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-white" />
            )}
          </Button>

          <Button
            onClick={toggleCamera}
            size="lg"
            className={`rounded-full w-14 h-14 ${
              isCameraOn
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isCameraOn ? (
              <Video className="h-6 w-6 text-white" />
            ) : (
              <VideoOff className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
          <span>{viewerCount} watching</span>
          <span>Duration: {formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleTeacherStream;