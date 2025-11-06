"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Pencil, PlusCircle, Video, Trash2, GripVertical } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/file-upload";

interface ChapterVideo {
  id: string;
  title: string;
  videoUrl: string;
  duration?: number | null;
  position: number;
}

interface ChapterVideosFormProps {
  initialData: {
    chapterVideos?: ChapterVideo[];
  };
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  videoUrl: z.string().min(1, "Video is required"),
});

export const ChapterVideosForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterVideosFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [videos, setVideos] = useState<ChapterVideo[]>(initialData.chapterVideos || []);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/videos`, values);
      const newVideo = response.data;
      setVideos([...videos, newVideo]);
      
      toast.success("Video added");
      form.reset();
      setIsCreating(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onDelete = async (videoId: string) => {
    try {
      setIsUpdating(true);
      await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}/videos/${videoId}`);
      setVideos(videos.filter(v => v.id !== videoId));
      toast.success("Video deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = async (videoId: string, title: string, videoUrl: string) => {
    try {
      setIsUpdating(true);
      const response = await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}/videos/${videoId}`, {
        title,
        videoUrl
      });
      
      setVideos(videos.map(v => v.id === videoId ? response.data : v));
      toast.success("Video updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Video className="h-4 w-4" />
          Chapter Videos
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} variant="ghost">
          {isCreating ? (
            <>Cancel</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add a video
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. 'Introduction to the course'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      endpoint="chapterVideo"
                      onChange={(url) => {
                        if (url) {
                          field.onChange(url);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={!isValid || isSubmitting}
              type="submit"
            >
              Add Video
            </Button>
          </form>
        </Form>
      )}

      {!isCreating && (
        <div
          className={cn(
            "text-sm mt-2",
            !videos.length && "text-slate-500 italic"
          )}
        >
          {!videos.length && "No videos"}
          {videos.length > 0 && (
            <div className="space-y-2">
              {videos.map((video, index) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  index={index}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  disabled={isUpdating}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface VideoItemProps {
  video: ChapterVideo;
  index: number;
  onDelete: (videoId: string) => void;
  onEdit: (videoId: string, title: string, videoUrl: string) => void;
  disabled: boolean;
}

const VideoItem = ({ video, index, onDelete, onEdit, disabled }: VideoItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [videoUrl, setVideoUrl] = useState(video.videoUrl);

  const handleSave = () => {
    onEdit(video.id, title, videoUrl);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(video.title);
    setVideoUrl(video.videoUrl);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm p-3">
      <div className="flex items-center gap-x-2 flex-1">
        <GripVertical className="h-4 w-4" />
        <span className="font-medium">{index + 1}.</span>
        
        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title..."
              disabled={disabled}
            />
            <FileUpload
              endpoint="chapterVideo"
              onChange={(url) => {
                if (url) {
                  setVideoUrl(url);
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={disabled}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={disabled}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <p className="font-medium">{video.title}</p>
            <p className="text-xs text-slate-500">Video {index + 1}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-x-2">
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            disabled={disabled}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={() => onDelete(video.id)}
          size="sm"
          variant="ghost"
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};