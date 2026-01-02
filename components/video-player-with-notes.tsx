"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  SkipBack,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalNotes } from "@/components/notes/universal-notes";
import { UniversalVideoPlayer } from "@/components/universal-video-player";
import { toast } from "sonner";

interface VideoPlayerWithNotesProps {
  url: string;
  title?: string;
  courseId: string;
  chapterId?: string;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

export const VideoPlayerWithNotes = ({
  url,
  title,
  courseId,
  chapterId,
  onEnded,
  onProgress,
  className = ""
}: VideoPlayerWithNotesProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isCurrentlyFullscreen);
      // Auto-hide notes when exiting fullscreen
      if (!isCurrentlyFullscreen) {
        setShowNotes(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const enterFullscreen = async () => {
    if (containerRef.current) {
      try {
        // Check if fullscreen is available
        if (document.fullscreenEnabled || (document as any).webkitFullscreenEnabled) {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            await (containerRef.current as any).webkitRequestFullscreen();
          }
          setIsFullscreen(true);
        } else {
          console.warn("Fullscreen not supported");
          toast.error("Fullscreen mode is not supported in your browser");
        }
      } catch (error) {
        console.error("Error entering fullscreen:", error);
        toast.error("Could not enter fullscreen mode");
      }
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
      setShowNotes(false);
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };

  const toggleNotes = () => {
    if (!isFullscreen) {
      // If not in fullscreen, enter our custom fullscreen mode first, then show notes
      setIsFullscreen(true);
      setShowNotes(true);
    } else {
      // Toggle notes in fullscreen mode
      setShowNotes(!showNotes);
    }
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    setShowNotes(false);
    // Also try to exit browser fullscreen if active
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      exitFullscreen();
    }
  };

  // Regular mode (not fullscreen)
  if (!isFullscreen) {
    return (
      <div className={`relative ${className}`}>
        {/* Regular Video Player */}
        <div className="relative">
          <UniversalVideoPlayer
            url={url}
            title={title}
            onEnded={onEnded}
            onProgress={onProgress}
          />
          
          {/* Notes Toggle Button - Only show in regular mode */}
          <div className="absolute top-4 right-4">
            <Button
              onClick={toggleNotes}
              variant="secondary"
              size="sm"
              className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Show Notes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen mode
  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-black z-50 flex ${className}`}
    >
      {/* Video Area - Takes 4/5 width when notes are shown, full width when hidden */}
      <div className={`${showNotes ? 'w-4/5' : 'w-full'} relative transition-all duration-300 ease-in-out`}>
        {/* Video Player */}
        <div className="w-full h-full">
          <UniversalVideoPlayer
            url={url}
            title={title}
            onEnded={onEnded}
            onProgress={(progress) => {
              if (onProgress) onProgress(progress);
              // Update current time for notes
              setCurrentTime(progress);
            }}
            className="w-full h-full"
          />
        </div>

        {/* Fullscreen Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Notes Toggle */}
          <Button
            onClick={() => setShowNotes(!showNotes)}
            variant="secondary"
            size="sm"
            className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            {showNotes ? 'Hide Notes' : 'Show Notes'}
          </Button>

          {/* Exit Fullscreen */}
          <Button
            onClick={handleExitFullscreen}
            variant="secondary"
            size="sm"
            className="bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
          >
            <Minimize className="h-4 w-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>

        {/* Video Title Overlay */}
        {title && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/60 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
              <h3 className="font-semibold">{title}</h3>
            </div>
          </div>
        )}
      </div>

      {/* Notes Panel - Takes 1/5 width, slides in from right */}
      {showNotes && (
        <div className="w-1/5 bg-white border-l border-gray-300 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Notes Header */}
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Video Notes</h3>
            <Button
              onClick={() => setShowNotes(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Notes Content */}
          <div className="flex-1 overflow-hidden">
            <UniversalNotes
              courseId={courseId}
              chapterId={chapterId}
              context="VIDEO"
              timestamp={currentTime}
              className="h-full border-0 rounded-none shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};