"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Video, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

interface CreateLiveSessionFormProps {
  courseId: string;
}

export const CreateLiveSessionForm = ({ courseId }: CreateLiveSessionFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledFor: undefined as Date | undefined,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Please enter a session title");
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post(`/api/courses/${courseId}/live`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        scheduledFor: formData.scheduledFor,
      });

      toast.success("Live session created successfully!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        scheduledFor: undefined,
      });
      
      // Refresh the page to show new session
      router.refresh();
      
    } catch (error) {
      console.error("Error creating live session:", error);
      toast.error("Failed to create live session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Session Title */}
        <div>
          <Label htmlFor="title">Session Title</Label>
          <Input
            id="title"
            placeholder="e.g., Introduction to React Hooks"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            disabled={isLoading}
          />
        </div>

        {/* Session Description */}
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Brief description of what will be covered..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={isLoading}
            rows={3}
          />
        </div>

        {/* Scheduled Date/Time */}
        <div>
          <Label>Schedule For (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.scheduledFor && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.scheduledFor ? (
                  format(formData.scheduledFor, "PPP 'at' p")
                ) : (
                  <span>Schedule for later (optional)</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.scheduledFor}
                onSelect={(date) => setFormData(prev => ({ ...prev, scheduledFor: date }))}
                initialFocus
              />
              {formData.scheduledFor && (
                <div className="p-3 border-t">
                  <Input
                    type="time"
                    onChange={(e) => {
                      if (formData.scheduledFor && e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(formData.scheduledFor);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setFormData(prev => ({ ...prev, scheduledFor: newDate }));
                      }
                    }}
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
          {formData.scheduledFor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, scheduledFor: undefined }))}
              className="mt-2 text-sm"
            >
              Clear schedule
            </Button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !formData.title.trim()}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Live Session
            </>
          )}
        </Button>
      </form>
      
      <div className="text-xs text-muted-foreground">
        💡 Tip: You can create sessions in advance and schedule them, or create them when you&apos;re ready to go live immediately.
      </div>
    </div>
  );
};