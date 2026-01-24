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
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header Bar - Fixed at top */}
      <header className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Title and Status */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-white text-lg font-semibold truncate max-w-[200px] md:max-w-none">
              {title}
            </h1>
            
            <span className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full text-white text-xs font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
          
          {/* Center: Stats */}
          <div className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-white text-sm">
              <Users className="w-4 h-4" />
              {viewerCount} viewers
            </span>
            
            <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-white text-sm">
              <Monitor className="w-4 h-4" />
              {formatDuration(duration)}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {onExit && (
              <Button
                onClick={onExit}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            )}
            
            <Button
              onClick={handleEndStream}
              size="sm"
              className="bg-white text-red-600 hover:bg-gray-100 font-medium"
            >
              <X className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">End Stream</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <div className="md:hidden flex-shrink-0 bg-slate-800 px-4 py-2 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5 text-slate-300 text-sm">
          <Users className="w-4 h-4" />
          {viewerCount}
        </span>
        <span className="flex items-center gap-1.5 text-slate-300 text-sm">
          <Monitor className="w-4 h-4" />
          {formatDuration(duration)}
        </span>
      </div>

      {/* Main Video Area - Fills remaining space */}
      <main className="flex-1 relative overflow-hidden bg-slate-950">
        <div
          ref={videoContainerRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: '#0f172a' }}
        >
          {!isCameraOn && (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <VideoOff className="w-12 h-12 text-slate-500" />
              </div>
              <p className="text-white text-xl font-medium mb-2">Camera is off</p>
              <p className="text-slate-400 text-sm">Students can still hear you</p>
            </div>
          )}
        </div>

        {/* Recording indicator - positioned to not overlap */}
        {isStreaming && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">REC</span>
          </div>
        )}
      </main>

      {/* Controls Bar - Fixed at bottom */}
      <footer className="flex-shrink-0 bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <Button
              onClick={toggleMic}
              size="lg"
              className={`rounded-full w-14 h-14 p-0 transition-all ${
                isMicOn
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                  : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
              } shadow-lg`}
              title={isMicOn ? "Mute microphone" : "Unmute microphone"}
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
              className={`rounded-full w-14 h-14 p-0 transition-all ${
                isCameraOn
                  ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30"
                  : "bg-red-600 hover:bg-red-700 shadow-red-500/30"
              } shadow-lg`}
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <VideoOff className="h-6 w-6 text-white" />
              )}
            </Button>
          </div>

          {/* Status Text */}
          <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-green-500' : 'bg-red-500'}`} />
              {isMicOn ? 'Mic on' : 'Mic off'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-green-500' : 'bg-red-500'}`} />
              {isCameraOn ? 'Camera on' : 'Camera off'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleTeacherStream;