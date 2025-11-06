"use client";

import React from "react";
import { EnhancedVideoPlayer } from "@/components/enhanced-video-player";

interface UniversalVideoPlayerProps {
  url: string;
  title?: string;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

// Helper function to detect video type
const getVideoType = (url: string) => {
  if (!url) return 'unknown';
  
  // YouTube URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Vimeo URLs
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  // Dailymotion URLs
  if (url.includes('dailymotion.com') || url.includes('dai.ly')) {
    return 'dailymotion';
  }
  
  // Direct video files or uploaded videos
  return 'direct';
};

// Helper function to convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    // Use location.origin only on client side to avoid hydration issues
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${match[2]}?enablejsapi=1&origin=${origin}`;
  }
  
  return url;
};

// Helper function to convert Vimeo URL to embed URL
const getVimeoEmbedUrl = (url: string) => {
  const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
  const match = url.match(regExp);
  
  if (match && match[5]) {
    return `https://player.vimeo.com/video/${match[5]}`;
  }
  
  return url;
};

export const UniversalVideoPlayer = ({
  url,
  title,
  onEnded,
  onProgress,
  className = ""
}: UniversalVideoPlayerProps) => {
  const videoType = getVideoType(url);

  // For YouTube videos
  if (videoType === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(url);
    
    return (
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={embedUrl}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={() => {
            // YouTube iframe doesn't provide direct progress/ended events
            // You would need YouTube API for that
          }}
        />
      </div>
    );
  }

  // For Vimeo videos
  if (videoType === 'vimeo') {
    const embedUrl = getVimeoEmbedUrl(url);
    
    return (
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={embedUrl}
          title={title || "Video"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // For Dailymotion videos
  if (videoType === 'dailymotion') {
    // Extract Dailymotion video ID
    const regExp = /^.*(dailymotion\.com\/video\/|dai\.ly\/)([^_]+)/;
    const match = url.match(regExp);
    const videoId = match ? match[2] : '';
    
    return (
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={`https://www.dailymotion.com/embed/video/${videoId}`}
          title={title || "Video"}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // For direct video files (uploaded videos)
  if (videoType === 'direct') {
    return (
      <div className={className}>
        <EnhancedVideoPlayer
          url={url}
          title={title}
          onEnded={onEnded}
          onProgress={onProgress}
        />
      </div>
    );
  }

  // Fallback for unknown video types
  return (
    <div className={`relative aspect-video bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
      <p className="text-gray-600">Unsupported video format</p>
    </div>
  );
};