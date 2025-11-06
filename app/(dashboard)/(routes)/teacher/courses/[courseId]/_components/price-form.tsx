"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";

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
import { Checkbox } from "@/components/ui/checkbox";

interface PriceFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number",
  }).optional().nullable(),
  isFree: z.boolean().default(false),
});

export const PriceForm = ({
  initialData,
  courseId
}: PriceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: initialData?.price || undefined,
      isFree: initialData?.isFree || false,
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const isFree = form.watch("isFree");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Course updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course price
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit price
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.price && !initialData.isFree && "text-slate-500 italic"
        )}>
          {initialData.isFree ? (
            <span className="text-green-600 font-semibold">Free Course</span>
          ) : initialData.price ? (
            <span className="font-semibold">₹{initialData.price}</span>
          ) : (
            "No price set"
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
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <label className="text-sm font-medium">
                      This is a free course
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Check this box if you want to make the course free for all students
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {!isFree && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-600">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={isSubmitting}
                          placeholder="Set a price for your course"
                          className="pl-7"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-slate-600 mt-1">
                      Price in Indian Rupees (INR)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="flex items-center gap-x-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
