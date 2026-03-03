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
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  FileText,
  PictureInPicture,
  RotateCcw,
  FastForward,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface Bookmark {
  timestamp: number;
  label: string;
}

interface VideoChapter {
  id: string;
  title: string;
  timestamp: number;
}

interface InteractiveVideoPlayerProps {
  url: string;
  title?: string;
  courseId?: string;
  chapterId?: string;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  chapters?: VideoChapter[];
  allowDownload?: boolean;
  showTranscript?: boolean;
  transcript?: string;
}

export const InteractiveVideoPlayer = ({
  url,
  title,
  courseId,
  chapterId,
  onEnded,
  onProgress,
  chapters = [],
  allowDownload = false,
  showTranscript = false,
  transcript = "",
}: InteractiveVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // Interactive features
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [quality, setQuality] = useState("auto");
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [watchedSegments, setWatchedSegments] = useState<boolean[]>([]);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    bufferedTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
    videoWidth: 0,
    videoHeight: 0,
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Check PiP support
  useEffect(() => {
    setIsPiPSupported(document.pictureInPictureEnabled);
  }, []);

  // Initialize watched segments
  useEffect(() => {
    if (duration > 0) {
      const segments = new Array(Math.ceil(duration / 5)).fill(false);
      setWatchedSegments(segments);
    }
  }, [duration]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setStats((prev) => ({
        ...prev,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      }));
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Track watched segments
      const segmentIndex = Math.floor(video.currentTime / 5);
      setWatchedSegments((prev) => {
        const newSegments = [...prev];
        newSegments[segmentIndex] = true;
        return newSegments;
      });

      if (onProgress) {
        onProgress((video.currentTime / video.duration) * 100);
      }

      // Update stats
      if (video.getVideoPlaybackQuality) {
        const quality = video.getVideoPlaybackQuality();
        setStats((prev) => ({
          ...prev,
          droppedFrames: quality.droppedVideoFrames,
          totalFrames: quality.totalVideoFrames,
        }));
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
        setStats((prev) => ({
          ...prev,
          bufferedTime: bufferedEnd,
        }));
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
    video.addEventListener("progress", handleProgress);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "c":
          e.preventDefault();
          // Toggle captions (if available)
          break;
        case "b":
          e.preventDefault();
          addBookmark();
          break;
        case "n":
          e.preventDefault();
          setIsNotesOpen(true);
          break;
        case "?":
          e.preventDefault();
          setShowHotkeys((prev) => !prev);
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          seekToPercentage(parseInt(e.key) * 10);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, volume]);

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

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    handleVolumeChange([newVolume]);
    toast.success(`Volume: ${Math.round(newVolume * 100)}%`);
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
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      toast.success(`${seconds > 0 ? "+" : ""}${seconds}s`);
    }
  };

  const seekToPercentage = (percent: number) => {
    if (videoRef.current && duration) {
      const newTime = (percent / 100) * duration;
      videoRef.current.currentTime = newTime;
      toast.success(`Seeked to ${percent}%`);
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

  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current?.requestPictureInPicture();
      }
    } catch (error) {
      toast.error("Picture-in-Picture not supported");
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    toast.success(`Speed: ${rate}x`);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const addNote = () => {
    if (currentNote.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        timestamp: currentTime,
        content: currentNote,
        createdAt: new Date(),
      };
      setNotes([...notes, newNote]);
      setCurrentNote("");
      toast.success("Note added!");
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    toast.success("Note deleted");
  };

  const jumpToNote = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setIsNotesOpen(false);
    }
  };

  const addBookmark = () => {
    const bookmark: Bookmark = {
      timestamp: currentTime,
      label: `Bookmark at ${formatTime(currentTime)}`,
    };
    setBookmarks([...bookmarks, bookmark]);
    toast.success("Bookmark added!");
  };

  const jumpToBookmark = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const shareVideo = () => {
    // Check if running in browser to avoid hydration issues
    if (typeof window === 'undefined') return;
    
    const shareData = {
      title: title || "Video",
      text: `Watch: ${title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const downloadVideo = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = title || "video";
    link.click();
    toast.success("Download started");
  };

  const toggleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
    toast.success(liked ? "Like removed" : "Liked!");
  };

  const toggleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  const getCompletionPercentage = () => {
    const watchedCount = watchedSegments.filter(Boolean).length;
    return (watchedCount / watchedSegments.length) * 100;
  };

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full"
          src={url}
          onClick={togglePlay}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {/* Play Button Overlay */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Button
              onClick={togglePlay}
              size="lg"
              className="w-24 h-24 rounded-full bg-white/95 hover:bg-white text-black shadow-2xl transition-transform hover:scale-110"
            >
              <Play className="h-12 w-12 ml-2" fill="currentColor" />
            </Button>
          </div>
        )}

        {/* Title Overlay */}
        {title && (
          <div
            className={cn(
              "absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300",
              showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">
                    {quality.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">
                    {Math.round(getCompletionPercentage())}% watched
                  </Badge>
                </div>
              </div>

              {/* Top Right Actions */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleLike}
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "text-white hover:bg-white/20",
                        liked && "text-green-400"
                      )}
                    >
                      <ThumbsUp className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Like</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={toggleDislike}
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "text-white hover:bg-white/20",
                        disliked && "text-red-400"
                      )}
                    >
                      <ThumbsDown className="h-5 w-5" fill={disliked ? "currentColor" : "none"} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dislike</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={shareVideo}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>

                {allowDownload && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={downloadVideo}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookmarks on Timeline */}
        {bookmarks.map((bookmark, index) => (
          <div
            key={index}
            className="absolute bottom-20 w-2 h-2 bg-yellow-400 rounded-full cursor-pointer hover:scale-150 transition-transform"
            style={{
              left: `${(bookmark.timestamp / duration) * 100}%`,
            }}
            onClick={() => jumpToBookmark(bookmark.timestamp)}
            title={bookmark.label}
          />
        ))}

        {/* Chapters on Timeline */}
        {chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            className="absolute bottom-20 w-1 h-3 bg-blue-400 cursor-pointer hover:h-4 transition-all"
            style={{
              left: `${(chapter.timestamp / duration) * 100}%`,
            }}
            onClick={() => jumpToBookmark(chapter.timestamp)}
            title={chapter.title}
          />
        ))}

        {/* Stats Overlay */}
        {showStats && (
          <div className="absolute top-20 right-4 bg-black/90 text-white text-xs p-4 rounded-lg backdrop-blur-sm">
            <div className="space-y-1">
              <p>Resolution: {stats.videoWidth}x{stats.videoHeight}</p>
              <p>Dropped Frames: {stats.droppedFrames}/{stats.totalFrames}</p>
              <p>Buffered: {formatTime(stats.bufferedTime)}</p>
              <p>Playback Rate: {playbackRate}x</p>
              <p>Volume: {Math.round(volume * 100)}%</p>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Overlay */}
        {showHotkeys && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-bold mb-4">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> / <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">K</kbd> Play/Pause</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">←</kbd> / <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">J</kbd> -10s</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">→</kbd> / <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">L</kbd> +10s</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd> Volume Up</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd> Volume Down</p>
                </div>
                <div className="space-y-2">
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">M</kbd> Mute</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F</kbd> Fullscreen</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">B</kbd> Bookmark</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">N</kbd> Notes</p>
                  <p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">0-9</kbd> Seek to %</p>
                </div>
              </div>
              <Button
                onClick={() => setShowHotkeys(false)}
                className="w-full mt-4"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 transition-opacity duration-300",
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Heat map / Watched segments */}
          <div className="mb-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="flex h-full">
              {watchedSegments.map((watched, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-full transition-colors",
                    watched ? "bg-blue-500/50" : "bg-transparent"
                  )}
                  style={{ width: `${100 / watchedSegments.length}%` }}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar with Hover Preview */}
          <div className="mb-3 group/progress">
            <div className="relative">
              {/* Buffered progress */}
              <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/30 transition-all"
                  style={{ width: `${buffered}%` }}
                />
              </div>
              
              {/* Main progress slider */}
              <Slider
                ref={progressBarRef}
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer relative z-10"
              />
            </div>
            
            <div className="flex justify-between text-xs text-white/90 mt-1.5 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Play/Pause (K)</TooltipContent>
              </Tooltip>

              {/* Skip Buttons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => skip(-10)}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>-10s (J)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => skip(10)}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>+10s (L)</TooltipContent>
              </Tooltip>

              {/* Volume */}
              <div className="flex items-center gap-2 ml-2">
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>Mute (M)</TooltipContent>
                </Tooltip>
                
                <div className="w-20 hidden md:block">
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                  />
                </div>
                <span className="text-white text-xs hidden md:block min-w-[3ch]">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Watch time badge */}
              <Badge variant="secondary" className="bg-white/10 text-white border-none ml-2 hidden lg:flex">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              {/* Bookmark */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={addBookmark}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    {bookmarks.some((b) => Math.abs(b.timestamp - currentTime) < 1) ? (
                      <BookmarkCheck className="h-5 w-5" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bookmark (B)</TooltipContent>
              </Tooltip>

              {/* Notes Sheet */}
              <Sheet open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 relative"
                      >
                        <MessageSquare className="h-5 w-5" />
                        {notes.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {notes.length}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Notes (N)</TooltipContent>
                </Tooltip>

                <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Video Notes</SheetTitle>
                    <SheetDescription>
                      Take notes while watching. Click on a note to jump to that timestamp.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-4">
                    {/* Add Note */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add Note at {formatTime(currentTime)}</label>
                      <Textarea
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        placeholder="Type your note here..."
                        className="min-h-[100px]"
                      />
                      <Button onClick={addNote} className="w-full" disabled={!currentNote.trim()}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">All Notes ({notes.length})</h3>
                      {notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No notes yet. Start taking notes while watching!
                        </p>
                      ) : (
                        notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => jumpToNote(note.timestamp)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {formatTime(note.timestamp)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNote(note.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                            <p className="text-sm">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(note.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Chapters Menu */}
              {chapters.length > 0 && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20"
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Chapters</TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
                    <div className="px-2 py-1.5 text-sm font-semibold">Chapters</div>
                    <DropdownMenuSeparator />
                    {chapters.map((chapter) => (
                      <DropdownMenuItem
                        key={chapter.id}
                        onClick={() => jumpToBookmark(chapter.timestamp)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{chapter.title}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {formatTime(chapter.timestamp)}
                          </Badge>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Picture in Picture */}
              {isPiPSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={togglePictureInPicture}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <PictureInPicture className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Picture in Picture</TooltipContent>
                </Tooltip>
              )}

              {/* Settings Menu */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>

                <DropdownMenuContent align="end" className="w-56">
                  {/* Playback Speed */}
                  <div className="px-2 py-1.5 text-sm font-semibold">Playback Speed</div>
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <Button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        variant={playbackRate === rate ? "default" : "ghost"}
                        size="sm"
                        className="text-xs"
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Quality */}
                  <div className="px-2 py-1.5 text-sm font-semibold">Quality</div>
                  {["auto", "1080p", "720p", "480p", "360p"].map((q) => (
                    <DropdownMenuItem
                      key={q}
                      onClick={() => setQuality(q)}
                      className={cn(
                        "cursor-pointer",
                        quality === q && "bg-accent"
                      )}
                    >
                      {q.toUpperCase()}
                      {quality === q && " ✓"}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* Other options */}
                  <DropdownMenuItem
                    onClick={() => setShowStats(!showStats)}
                    className="cursor-pointer"
                  >
                    Stats for Nerds
                    {showStats && " ✓"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setShowHotkeys(true)}
                    className="cursor-pointer"
                  >
                    Keyboard Shortcuts (?)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Fullscreen (F)</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Progress completion badge */}
        {getCompletionPercentage() === 100 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
            <CheckCircle className="inline mr-2" />
            Course Completed! 🎉
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
