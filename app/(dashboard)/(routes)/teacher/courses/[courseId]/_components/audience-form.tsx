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

interface AudienceFormProps {
  initialData: {
    id: string;
    whoIsThisFor: string[];
  };
  courseId: string;
}

const formSchema = z.object({
  whoIsThisFor: z.array(z.string()).optional().default([]),
});

export const AudienceForm = ({
  initialData,
  courseId,
}: AudienceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [audience, setAudience] = useState<string[]>(
    initialData.whoIsThisFor.length > 0 ? initialData.whoIsThisFor : [""]
  );

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      whoIsThisFor: initialData.whoIsThisFor.length > 0 ? initialData.whoIsThisFor : [""],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        whoIsThisFor: values.whoIsThisFor.filter(a => a.trim() !== ""),
      });
      toast.success("Target audience updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const addAudience = () => {
    const newAudience = [...audience, ""];
    setAudience(newAudience);
    form.setValue("whoIsThisFor", newAudience, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const removeAudience = (index: number) => {
    const newAudience = audience.filter((_, i) => i !== index);
    setAudience(newAudience);
    form.setValue("whoIsThisFor", newAudience, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const updateAudience = (index: number, value: string) => {
    const newAudience = [...audience];
    newAudience[index] = value;
    setAudience(newAudience);
    form.setValue("whoIsThisFor", newAudience, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Who Is This Course For?
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit audience
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.whoIsThisFor.length && "text-slate-500 italic"
        )}>
          {!initialData.whoIsThisFor.length && "No target audience specified"}
          {initialData.whoIsThisFor.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {initialData.whoIsThisFor.map((item, index) => (
                <li key={index}>{item}</li>
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
              name="whoIsThisFor"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      {audience.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            disabled={isSubmitting}
                            placeholder={`Target audience ${index + 1}`}
                            value={item}
                            onChange={(e) => updateAudience(index, e.target.value)}
                          />
                          {audience.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeAudience(index)}
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
                onClick={addAudience}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add audience
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
