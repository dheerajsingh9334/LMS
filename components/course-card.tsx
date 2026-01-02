"use client";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, MoreVertical } from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import { CourseProgress } from "@/components/course-progress";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IoIosShareAlt } from "react-icons/io";
import { MdOutlineWatchLater } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { FaHeart, FaRegHeart } from "react-icons/fa";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string;
  chaptersLength: number;
  progress: number | null;
  category: string;
  teacherId?: string;
  teacherName?: string;
  teacherImage?: string;
  averageRating?: number;
  totalRatings?: number;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  progress,
  category,
  teacherId,
  teacherName,
  teacherImage,
  averageRating,
  totalRatings,
}: CourseCardProps) => {
  // const [isAddingToWatchLater, setIsAddingToWatchLater] = useState(false); // State to track API call status
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${id}`;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {})
      .catch((err) => {
        toast.error("Failed to copy email.");
      });
  };

  useEffect(() => {
    const checkIfInWatchLater = async () => {
      try {
        const response = await axios.get(`/api/user/watch-later/${id}`);
        setIsInWatchLater(response.data.inWatchLater);
      } catch (error) {
        console.error("Error checking Watch Later status:", error);
      }
    };

    const checkIfFavorite = async () => {
      try {
        const response = await axios.get(`/api/user/favorite/${id}`);
        setIsFavorite(response.data.isFavorite);
      } catch (error) {
        console.error("Error checking Favorite status:", error);
      }
    };

    checkIfInWatchLater();
    checkIfFavorite();
  }, [id]);

  const toggleWatchLater = async () => {
    //setIsAddingToWatchLater(true);
    try {
      // Toggle Watch Later status based on current state
      if (isInWatchLater) {
        // Remove from Watch Later
        await axios.delete(`/api/user/watch-later/${id}`);
        setIsInWatchLater(false);
        toast.success("Removed from Watch Later");
      } else {
        // Add to Watch Later
        await axios.post(`/api/user/watch-later/${id}`);
        setIsInWatchLater(true);
        toast.success("Added to Watch Later");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast.error("Already exists in watch-later");
      } else toast.error("Failed to toggle Watch Later");
    } finally {
      //setIsAddingToWatchLater(false); // Reset loading state
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await axios.delete(`/api/user/favorite/${id}`);
        setIsFavorite(false);
        toast.success("Removed from Favorites");
      } else {
        await axios.post(`/api/user/favorite/${id}`);
        setIsFavorite(true);
        toast.success("Added to Favorites");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast.error("Already exists in Favorites");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div className="group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full relative  md:max-w-[300px]">
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        <Image fill className="object-cover" alt={title} src={imageUrl} />
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button>
                <MoreVertical className="text-white opacity-75 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer border-none" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="absolute right-0 w-36 py-1 bg-white rounded-sm">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={toggleWatchLater}
                  className={cn(
                    isInWatchLater &&
                      "text-custom-primary hover:text-input-border hover:bg-custom-primary/10"
                  )}
                >
                  <MdOutlineWatchLater className="mr-2" />
                  {isInWatchLater ? "Remove it" : "Watch Later"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-xs">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex text-sm items-center w-full px-2 py-1 hover:bg-gray-100">
                        <IoIosShareAlt className="mr-2" />
                        Share
                      </button>
                    </DialogTrigger>
                    <DialogContent className=" sm:max-w-[450px] py-7 ">
                      <DialogHeader>
                        <DialogTitle>Share this course</DialogTitle>
                        <DialogDescription>
                          You can share this course with your friends.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex w-full  items-center justify-between space-x-2">
                        <Input
                          value={link}
                          readOnly
                          className="border border-gray-300 rounded-md px-3 py-2 overflow-x-scroll whitespace-nowrap"
                        />
                        <Button type="button" onClick={handleCopy}>
                          Copy
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col pt-2">
        <Link href={`/courses/${id}`}>
          <div className="flex items-center gap-2">
            <div className="text-lg md:text-base font-medium group-hover:text-custom-primary transition line-clamp-2">
              {title}
            </div>
            {progress === 100 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0.5 border-transparent bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{category}</p>
        </Link>

        {/* Teacher Info */}
        {teacherName && teacherId && (
          <Link href={`/teacher/${teacherId}`} className="group/teacher">
            <div className="flex items-center gap-2 mt-2 mb-1 hover:opacity-80 transition">
              {teacherImage && (
                <Image
                  src={teacherImage}
                  alt={teacherName}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="text-xs text-gray-600 group-hover/teacher:text-blue-600 group-hover/teacher:underline">
                {teacherName}
              </span>
            </div>
          </Link>
        )}

        {/* Rating */}
        {averageRating !== undefined && averageRating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm font-bold text-amber-600">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < Math.floor(averageRating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-300"
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {totalRatings !== undefined && totalRatings > 0 && (
              <span className="text-xs text-gray-500">({totalRatings})</span>
            )}
          </div>
        )}

        <div className="my-3 flex items-center gap-x-2 text-sm md:text-xs">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-x-1 text-slate-500">
              <IconBadge size="sm" icon={BookOpen} />
              <span>
                {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
              </span>
            </div>
            <div onClick={toggleFavorite} className="cursor-pointer">
              {isFavorite ? (
                <FaHeart className="text-custom-primary text-lg" />
              ) : (
                <FaRegHeart className="text-custom-primary text-lg" />
              )}
            </div>
          </div>
        </div>
        {progress !== null ? (
          <CourseProgress
            variant={progress === 100 ? "success" : "default"}
            size="sm"
            value={progress}
          />
        ) : (
          <Link href={`/courses/${id}/overview`}>
            <div>
              <Badge variant="new">View Course Details</Badge>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};
