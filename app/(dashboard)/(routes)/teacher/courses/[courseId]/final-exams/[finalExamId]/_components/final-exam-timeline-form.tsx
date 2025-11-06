"use client"

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Form, FormField, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FinalExamTimelineFormProps {
  initialData: {
    timeLimit: number | null;
    passingScore: number;
  };
  courseId: string;
  finalExamId: string;
}

const formSchema = z.object({
  timeLimit: z.coerce.number().min(1, "Time limit must be at least 1 minute"),
  passingScore: z.coerce.number().min(1).max(100, "Passing score must be between 1 and 100"),
});

export const FinalExamTimelineForm = ({
  initialData,
  courseId,
  finalExamId,
}: FinalExamTimelineFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeLimit: initialData.timeLimit || 60,
      passingScore: initialData.passingScore,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/final-exams/${finalExamId}`, values);
      toast.success("Final exam settings updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      console.error("[FINAL_EXAM_SETTINGS_UPDATE]", error);
      toast.error("Failed to update final exam settings");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Exam settings
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit settings
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className="text-sm mt-2 space-y-1">
          <p>Time limit: {initialData.timeLimit ? `${initialData.timeLimit} minutes` : "No limit"}</p>
          <p>Passing score: {initialData.passingScore}%</p>
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="timeLimit"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      disabled={isSubmitting} 
                      placeholder="e.g. '90'" 
                      type="number"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Time limit in minutes</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passingScore"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      disabled={isSubmitting} 
                      placeholder="e.g. '70'" 
                      type="number"
                      min="1"
                      max="100"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Passing score percentage</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};