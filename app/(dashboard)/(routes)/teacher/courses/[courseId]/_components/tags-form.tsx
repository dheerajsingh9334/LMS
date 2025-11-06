"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagsFormProps {
  initialData: {
    tags: string[];
  };
  courseId: string;
}

const formSchema = z.object({
  tags: z.array(z.string()).optional().default([]),
});

export const TagsForm = ({
  initialData,
  courseId
}: TagsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: initialData?.tags || [],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Course updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !form.getValues("tags").includes(trimmedTag)) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, trimmedTag], { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
      { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course Tags
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit tags
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className="mt-2">
          {initialData.tags.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No tags added yet. Tags help students find your course.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {initialData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
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
              name="tags"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Enter a tag (e.g., JavaScript, Web Development)"
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          onClick={addTag}
                          disabled={!tagInput.trim() || isSubmitting}
                          variant="outline"
                        >
                          Add
                        </Button>
                      </div>
                      {form.getValues("tags").length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-white rounded-md border">
                          {form.getValues("tags").map((tag) => (
                            <Badge
                              key={tag}
                              variant="default"
                              className="text-xs flex items-center gap-1"
                            >
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
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
