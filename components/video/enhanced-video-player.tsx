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
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface EnhancedVideoPlayerProps {
  url: string;
  title?: string;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
}

export const EnhancedVideoPlayer = ({
  url,
  title,
  onEnded,
  onProgress,
}: EnhancedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [quality, setQuality] = useState("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([
    "auto",
    "1080p",
    "720p",
    "480p",
    "360p",
  ]);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);

      // Detect available qualities based on video dimensions
      if (video.videoHeight) {
        const detectedQualities = ["auto"];
        if (video.videoHeight >= 1080) detectedQualities.push("1080p");
        if (video.videoHeight >= 720) detectedQualities.push("720p");
        if (video.videoHeight >= 480) detectedQualities.push("480p");
        detectedQualities.push("360p");
        setAvailableQualities(detectedQualities);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onProgress) {
        onProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [onEnded, onProgress]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const changeQuality = (newQuality: string) => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;

    setQuality(newQuality);
    setIsLoading(true);

    // Show quality change notification
    toast.info(
      `Video quality changed to ${newQuality === "auto" ? "Auto" : newQuality}`
    );

    // For demonstration, we'll simulate quality changes by following
    // a naming convention like `video_720p.mp4`. In production you
    // should ensure these variant files actually exist.
    const qualityUrls: { [key: string]: string } = {
      auto: url,
      "1080p": url.replace(/\.(mp4|webm|ogg)$/i, "_1080p.$1"),
      "720p": url.replace(/\.(mp4|webm|ogg)$/i, "_720p.$1"),
      "480p": url.replace(/\.(mp4|webm|ogg)$/i, "_480p.$1"),
      "360p": url.replace(/\.(mp4|webm|ogg)$/i, "_360p.$1"),
    };

    // Check if the quality-specific URL exists, fallback to original
    const newUrl = qualityUrls[newQuality] || url;

    if (newUrl !== video.src) {
      video.src = newUrl;
      video.currentTime = currentTime;

      const handleLoadedData = () => {
        video.currentTime = currentTime;
        if (wasPlaying) {
          video.play();
        }
        setIsLoading(false);
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("error", handleError);
      };

      const handleError = () => {
        // If the quality-specific source fails to load, revert to Auto
        console.error("Failed to load selected quality, reverting to auto");
        toast.error("Unable to load selected quality, reverting to Auto");
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("error", handleError);

        setQuality("auto");
        video.src = url;
        video.currentTime = currentTime;
        if (wasPlaying) {
          video.play();
        }
        setIsLoading(false);
      };

      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("error", handleError);
      video.load();
    } else {
      setIsLoading(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        src={url}
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Button
            onClick={togglePlay}
            size="lg"
            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-black shadow-2xl"
          >
            <Play className="h-10 w-10 ml-1" />
          </Button>
        </div>
      )}

      {/* Title Overlay */}
      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            {/* Quality Indicator */}
            <div className="bg-black/60 px-2 py-1 rounded text-white text-sm">
              {quality === "auto" ? "Auto" : quality}
              {videoRef.current?.videoHeight && (
                <span className="ml-1 text-white/70">
                  ({videoRef.current.videoWidth}x{videoRef.current.videoHeight})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/80 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              onClick={togglePlay}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            {/* Skip Buttons */}
            <Button
              onClick={() => skip(-10)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => skip(10)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div className="w-24 hidden md:block">
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 text-xs px-2"
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  {quality}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/90 border-white/20"
              >
                <div className="text-white/60 text-xs font-semibold px-2 py-1">
                  Quality
                </div>
                {availableQualities.map((q) => (
                  <DropdownMenuItem
                    key={q}
                    onClick={() => changeQuality(q)}
                    className={`text-white cursor-pointer ${
                      quality === q ? "bg-white/20" : ""
                    }`}
                  >
                    {q === "auto" ? "Auto" : q}
                    {q === quality && (
                      <span className="ml-2 text-blue-400">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Playback Speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black/90 border-white/20"
              >
                <div className="text-white/60 text-xs font-semibold px-2 py-1">
                  Playback Speed
                </div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`text-white cursor-pointer ${
                      playbackRate === rate ? "bg-white/20" : ""
                    }`}
                  >
                    {rate}x {rate === 1 && "(Normal)"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoPlayer;
