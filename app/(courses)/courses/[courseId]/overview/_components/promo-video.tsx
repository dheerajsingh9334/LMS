"use client";

import { useState } from "react";
import { PlayCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactPlayer from "react-player";

interface PromoVideoProps {
  videoUrl?: string;
  courseTitle: string;
  imageUrl?: string;
}

export const PromoVideo = ({ videoUrl, courseTitle, imageUrl }: PromoVideoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!videoUrl) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute inset-0 bg-black/20 flex items-center justify-center group hover:bg-black/30 transition w-full h-full"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition">
            <PlayCircle className="w-16 h-16 text-blue-600" />
          </div>
          <span className="text-white text-lg font-semibold bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full">
            Watch Course Preview
          </span>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{courseTitle} - Course Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {isOpen && (
              <ReactPlayer
                url={videoUrl}
                controls
                playing
                width="100%"
                height="100%"
                config={{
                  file: {
                    attributes: {
                      controlsList: "nodownload",
                    },
                  },
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
