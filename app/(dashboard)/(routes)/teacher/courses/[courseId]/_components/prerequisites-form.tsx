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

interface PrerequisitesFormProps {
  initialData: {
    id: string;
    prerequisites: string[];
  };
  courseId: string;
}

const formSchema = z.object({
  prerequisites: z.array(z.string()).optional().default([]),
});

export const PrerequisitesForm = ({
  initialData,
  courseId,
}: PrerequisitesFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [prerequisites, setPrerequisites] = useState<string[]>(
    initialData.prerequisites.length > 0 ? initialData.prerequisites : [""]
  );

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prerequisites: initialData.prerequisites.length > 0 ? initialData.prerequisites : [""],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        prerequisites: values.prerequisites.filter(p => p.trim() !== ""),
      });
      toast.success("Prerequisites updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const addPrerequisite = () => {
    const newPrerequisites = [...prerequisites, ""];
    setPrerequisites(newPrerequisites);
    form.setValue("prerequisites", newPrerequisites, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const removePrerequisite = (index: number) => {
    const newPrerequisites = prerequisites.filter((_, i) => i !== index);
    setPrerequisites(newPrerequisites);
    form.setValue("prerequisites", newPrerequisites, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const updatePrerequisite = (index: number, value: string) => {
    const newPrerequisites = [...prerequisites];
    newPrerequisites[index] = value;
    setPrerequisites(newPrerequisites);
    form.setValue("prerequisites", newPrerequisites, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course Prerequisites
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit prerequisites
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.prerequisites.length && "text-slate-500 italic"
        )}>
          {!initialData.prerequisites.length && "No prerequisites"}
          {initialData.prerequisites.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {initialData.prerequisites.map((prerequisite, index) => (
                <li key={index}>{prerequisite}</li>
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
              name="prerequisites"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      {prerequisites.map((prerequisite, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            disabled={isSubmitting}
                            placeholder={`Prerequisite ${index + 1}`}
                            value={prerequisite}
                            onChange={(e) => updatePrerequisite(index, e.target.value)}
                          />
                          {prerequisites.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removePrerequisite(index)}
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
                onClick={addPrerequisite}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add prerequisite
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
