"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, FileText, MessageSquare, GripHorizontal } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { UniversalNotes } from "@/components/notes/universal-notes";
import { LiveChat } from "@/components/live/live-chat";

// Types for Agora SDK - imported dynamically to avoid SSR issues
type IAgoraRTCClient = import("agora-rtc-sdk-ng").IAgoraRTCClient;
type IAgoraRTCRemoteUser = import("agora-rtc-sdk-ng").IAgoraRTCRemoteUser;

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
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width in pixels
  const [notesHeight, setNotesHeight] = useState(50); // Notes take 50% of sidebar by default
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'width' | 'height' | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startViewing();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startViewing = async () => {
    try {
      setIsLoading(true);

      // Dynamically import Agora SDK only on client side
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

      // Get Agora token
      const response = await axios.post(
        `/api/courses/${courseId}/live/${liveSessionId}/token`,
        {
          channelName,
          role: "subscriber", // Student is subscriber
        }
      );

      const { token, appId } = response.data;

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;

      // Set client role to audience (student)
      await client.setClientRole("audience");

      // Join channel
      await client.join(appId, channelName, token, null);

      // Listen for remote user published
      client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        await client.subscribe(user, mediaType);

        if (mediaType === "video" && videoContainerRef.current) {
          // Play remote video
          user.videoTrack?.play(videoContainerRef.current);
        }

        if (mediaType === "audio") {
          // Play remote audio
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user: IAgoraRTCRemoteUser) => {
        // User stopped streaming
        if (user.videoTrack) {
          user.videoTrack.stop();
        }
      });

      setIsConnected(true);
      setIsLoading(false);
      toast.success("Connected to live stream!");

      // Increment view count
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
    try {
      await clientRef.current?.leave();
    } catch (error) {
      console.error("Error cleaning up:", error);
    }
  };

  const handleClose = async () => {
    await cleanup();
    onClose();
  };

  // Handle sidebar width resize
  const handleWidthResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType('width');
    document.body.classList.add('resizing');
    
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = Math.max(250, Math.min(800, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeType(null);
      document.body.classList.remove('resizing');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle notes/chat height resize
  const handleHeightResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType('height');
    document.body.classList.add('resizing-height');
    
    const startY = e.clientY;
    const startHeight = notesHeight;
    const sidebarElement = e.currentTarget.parentElement?.parentElement;
    
    if (sidebarElement) {
      const sidebarRect = sidebarElement.getBoundingClientRect();
      
      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        const sidebarHeight = sidebarRect.height;
        const newHeightPercent = Math.max(20, Math.min(80, startHeight + (deltaY / sidebarHeight) * 100));
        setNotesHeight(newHeightPercent);
      };
      
      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeType(null);
        document.body.classList.remove('resizing-height');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-semibold">LIVE</span>
          </div>
          <Button
            onClick={() => setShowNotes(!showNotes)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </Button>
        </div>
        <Button
          onClick={handleClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4 mr-2" />
          Exit
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Video Container */}
        <div 
          className="relative bg-gray-900 transition-all duration-200 ease-in-out"
          style={{ 
            width: showNotes ? `calc(100% - ${sidebarWidth}px)` : '100%' 
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-white text-lg">Connecting to live stream...</p>
            </div>
          )}
          <div
            ref={videoContainerRef}
            className="w-full h-full flex items-center justify-center"
          />
        </div>

        {/* Resizable Sidebar Panel */}
        {showNotes && (
          <>
            {/* Width Resize Handle */}
            <div 
              className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-ew-resize transition-colors ${
                isResizing && resizeType === 'width' ? 'bg-blue-500' : ''
              }`}
              onMouseDown={handleWidthResize}
            />
            
            {/* Sidebar Content */}
            <div 
              className="bg-white border-r border-gray-300 flex flex-col"
              style={{ width: `${sidebarWidth}px` }}
            >
              {/* Sidebar Header */}
              <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Notes & Chat</span>
                </div>
                <Button
                  onClick={() => setShowNotes(false)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes Section */}
              <div 
                className="flex flex-col border-b"
                style={{ height: `${notesHeight}%` }}
              >
                <div className="p-2 bg-gray-50 border-b">
                  <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                </div>
                <div className="flex-1 overflow-hidden">
                  <UniversalNotes
                    courseId={courseId}
                    context="LIVE_STREAM"
                    liveSessionId={liveSessionId}
                    className="h-full border-0 rounded-none shadow-none"
                  />
                </div>
              </div>

              {/* Height Resize Handle */}
              <div 
                className={`h-1 bg-gray-200 hover:bg-blue-500 cursor-ns-resize transition-colors flex items-center justify-center ${
                  isResizing && resizeType === 'height' ? 'bg-blue-500' : ''
                }`}
                onMouseDown={handleHeightResize}
              >
                <GripHorizontal className="h-3 w-3 text-gray-400" />
              </div>

              {/* Chat Section */}
              <div 
                className="flex flex-col"
                style={{ height: `${100 - notesHeight}%` }}
              >
                <div className="p-2 bg-gray-50 border-b">
                  <h4 className="text-sm font-medium text-gray-700">Live Chat</h4>
                </div>
                <div className="flex-1 overflow-hidden">
                  <LiveChat
                    courseId={courseId}
                    liveSessionId={liveSessionId}
                    className="h-full border-0 rounded-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentLiveViewer;
