"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Pencil, X, Plus } from "lucide-react";

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

interface HighlightsFormProps {
  initialData: {
    id: string;
    highlights: string[];
  };
  courseId: string;
}

const formSchema = z.object({
  highlights: z.array(z.string()).optional().default([]),
});

export const HighlightsForm = ({
  initialData,
  courseId,
}: HighlightsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [highlights, setHighlights] = useState<string[]>(
    initialData.highlights.length > 0 ? initialData.highlights : [""]
  );

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      highlights: initialData.highlights.length > 0 ? initialData.highlights : [""],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        highlights: values.highlights.filter(h => h.trim() !== ""),
      });
      toast.success("Highlights updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const addHighlight = () => {
    const newHighlights = [...highlights, ""];
    setHighlights(newHighlights);
    form.setValue("highlights", newHighlights, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = highlights.filter((_, i) => i !== index);
    setHighlights(newHighlights);
    form.setValue("highlights", newHighlights, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
    form.setValue("highlights", newHighlights, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course Highlights
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit highlights
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.highlights.length && "text-slate-500 italic"
        )}>
          {!initialData.highlights.length && "No highlights"}
          {initialData.highlights.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {initialData.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="highlights"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            disabled={isSubmitting}
                            placeholder={`Highlight ${index + 1}`}
                            value={highlight}
                            onChange={(e) => updateHighlight(index, e.target.value)}
                          />
                          {highlights.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeHighlight(index)}
                              variant="ghost"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button
                type="button"
                onClick={addHighlight}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add highlight
              </Button>
              <Button
                disabled={isSubmitting}
                type="submit"
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
